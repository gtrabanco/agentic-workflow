import { runSeam } from "../hooks/dispatcher.js";
import type { SeamRunResult } from "../hooks/dispatcher.js";
import type { HookRunResult } from "../hooks/runner.js";
import type { InjectedOutcome } from "../hooks/dispatcher.js";

/**
 * The seam-hooks wiring — the Pi-free half of the extension adapter (issue
 * #413, obligations O12/O5).
 *
 * It binds the dispatcher's four deterministically-triggered seams to the
 * narrow slice of pi the extension sees, exactly the way `receipt-guard.ts`
 * stays Pi-free so tests run without a session:
 *  - `session:start` / `session:end` from the pi session lifecycle;
 *  - `pre:commit` / `pre:push` by intercepting `git commit` / `git push` bash
 *    tool calls before they execute — a block is a pi `{ block, reason }`;
 *  - `post:commit` from the tool result of a `git commit` that already ran — a
 *    failure there cannot block retroactively, so it is reported as a notice.
 *
 * Every notice the dispatcher produces (a broken file, an inert declaration
 * without consent) is announced once per project session, and the session seams
 * report their blocks instead of dropping them: a session seam cannot block the
 * session, so the teaching message is the only thing that makes the declaration
 * real (O16, O20). The shutdown seam additionally runs inside
 * `SHUTDOWN_BUDGET_MS` and returns its promise to the host, which awaits the
 * handler before teardown — a slow check is reported as a timeout, never lost
 * to the exit (N3).
 *
 * The git matcher reads the command as a shell would read its shape — unquoted
 * operators separate segments, quotes group tokens, a leading `NAME=value` is an
 * environment prefix, and the git options that take a value consume the next
 * token — so `git -C <dir> commit` and `GIT_DIR=x git commit` are the same seam
 * as `git commit` (O17/O18). A git call the extension cannot see (inside a
 * script, or behind `bash -c`) is out of reach by construction: this is a
 * guardrail on the agent's own bash calls, never an enforcement boundary.
 */

export interface HooksContext {
  cwd: string;
  isProjectTrusted(): boolean;
  ui: { notify(message: string, kind?: "error" | "info" | "warning"): void };
}

export interface HooksToolCallEvent {
  toolName: string;
  input: { command?: unknown };
}

export interface HooksToolResultEvent {
  toolName: string;
  input: { command?: unknown };
  isError: boolean;
}

export interface HooksBlockDecision {
  block: true;
  reason: string;
}

/** The wall clock the shutdown seam may spend: pi is exiting, so a declared
 *  `session:end` check either reports inside this bound or is reported as a
 *  timeout — it never outlives the session (N3). */
export const SHUTDOWN_BUDGET_MS = 5_000;

export interface HooksWiringDeps {
  agentDir: string;
  /** Overrides the shutdown seam's budget (tests). */
  shutdownBudgetMs?: number;
  readFile?: (path: string) => string | null;
  readConsent?: (agentDir: string, cwd: string) => boolean;
  /** Overrides the tokenized argv execution (tests; defaults to the runner). */
  spawnHook?: (argv: string[], options: { cwd: string; timeoutMs?: number }) => Promise<HookRunResult | InjectedOutcome>;
  /** Overrides the auto commit/push git executions. */
  runGit?: (argv: string[]) => Promise<HookRunResult | InjectedOutcome>;
}

export interface HooksWiring {
  onSessionStart(ctx: HooksContext): Promise<void>;
  onSessionShutdown(ctx: HooksContext): Promise<void>;
  onToolCall(event: HooksToolCallEvent, ctx: HooksContext): Promise<HooksBlockDecision | undefined>;
  onToolResult(event: HooksToolResultEvent, ctx: HooksContext): Promise<void>;
}

type GitSeam = "pre:commit" | "pre:push" | "post:commit";

/** Split a command at its unquoted shell operators — a quoted `|` stays inside its argument. */
function splitSegments(command: string): string[] {
  const segments: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index] as string;
    if (quote !== null) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      current += char;
      continue;
    }
    if (char === "\n" || char === ";" || char === "|" || char === "&") {
      segments.push(current);
      current = "";
      const next = command[index + 1];
      if ((char === "|" || char === "&") && next === char) index += 1;
      continue;
    }
    current += char;
  }
  segments.push(current);
  return segments;
}

/** Split one segment into tokens: quotes group, and are dropped (there is no shell left to see them). */
function tokenizeSegment(segment: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let started = false;
  for (const char of segment) {
    if (quote !== null) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      started = true;
      continue;
    }
    if (char === " " || char === "\t") {
      if (started) tokens.push(current);
      current = "";
      started = false;
      continue;
    }
    started = true;
    current += char;
  }
  if (started) tokens.push(current);
  return tokens;
}

/** The git options whose following token is a value, never the subcommand.
 *  Value-less-legal options (git's print-and-exit forms, like a bare
 *  `--exec-path`) do NOT belong here: they consume nothing, and a bare
 *  option followed by a subcommand either errors out or never reaches the
 *  subcommand — quiet either way (O26). */
const GIT_VALUE_OPTIONS = new Set([
  "-C",
  "-c",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--super-prefix",
]);

const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/u;

/** The git subcommand a segment runs, with env prefixes and option values skipped. */
function gitSubcommand(tokens: string[]): string | null {
  let index = 0;
  while (index < tokens.length && ENV_ASSIGNMENT.test(tokens[index] as string)) index += 1;
  if (tokens[index] !== "git") return null;
  index += 1;
  while (index < tokens.length) {
    const token = tokens[index] as string;
    if (token === "--") {
      index += 1;
      break;
    }
    if (token.startsWith("-") && token.length > 1) {
      index += GIT_VALUE_OPTIONS.has(token) ? 2 : 1;
      continue;
    }
    break;
  }
  return tokens[index] ?? null;
}

/** The seams a bash command touches, read the way a shell would chain it. */
function gitSeamsIn(command: string): GitSeam[] {
  const seams: GitSeam[] = [];
  for (const segment of splitSegments(command)) {
    const subcommand = gitSubcommand(tokenizeSegment(segment));
    if (subcommand === "commit") seams.push("pre:commit", "post:commit");
    else if (subcommand === "push") seams.push("pre:push");
  }
  return seams;
}

export function createHooksWiring(deps: HooksWiringDeps): HooksWiring {
  /** One announce per notice per project session — a broken file or an inert
   *  declaration explains itself once and then stops talking (O5, O20). Reset
   *  at each session start so a NEW project session hears the announcement
   *  again: the promise is per session, not per extension instance (DA1). */
  const announced = new Set<string>();

  const announce = (ctx: HooksContext, message: string, kind: "error" | "info" | "warning"): void => {
    const key = `${ctx.cwd}\u0000${message}`;
    if (announced.has(key)) return;
    announced.add(key);
    ctx.ui.notify(message, kind);
  };

  const run = async (seam: Parameters<typeof runSeam>[0], ctx: HooksContext, budgetMs?: number): Promise<SeamRunResult> => {
    const result = await runSeam(seam, {
      agentDir: deps.agentDir,
      cwd: ctx.cwd,
      projectTrusted: ctx.isProjectTrusted(),
      readFile: deps.readFile,
      readConsent: deps.readConsent,
      spawnHook: deps.spawnHook,
      runGit: deps.runGit,
      ...(budgetMs === undefined ? {} : { budgetMs }),
    });
    for (const notice of result.notices) announce(ctx, notice.message, notice.kind === "problem" ? "warning" : "info");
    return result;
  };

  /** A session seam cannot block the session, so its blocks are reported — never swallowed (O16). */
  const reportBlocks = (ctx: HooksContext, result: SeamRunResult): void => {
    for (const block of result.blocks) ctx.ui.notify(block, "warning");
  };

  const postCommitFailure = async (event: HooksToolResultEvent, ctx: HooksContext): Promise<void> => {
    if (event.toolName !== "bash" || event.isError) return;
    const command = typeof event.input?.command === "string" ? event.input.command : "";
    if (!gitSeamsIn(command).includes("post:commit")) return;
    const result = await run("post:commit", ctx);
    for (const block of result.blocks) ctx.ui.notify(block, "warning");
  };

  return {
    async onSessionStart(ctx) {
      // A new project session re-announces: clear the latch before the seam
      // runs so its own notices are fresh for this session (DA1/O25).
      announced.clear();
      reportBlocks(ctx, await run("session:start", ctx));
    },

    async onSessionShutdown(ctx) {
      // The host awaits this handler before teardown completes (N3), so the
      // report lands — inside the shutdown budget, never past it.
      reportBlocks(ctx, await run("session:end", ctx, deps.shutdownBudgetMs ?? SHUTDOWN_BUDGET_MS));
    },

    async onToolCall(event, ctx) {
      if (event.toolName !== "bash") return undefined;
      const command = typeof event.input?.command === "string" ? event.input.command : "";
      if (command === "") return undefined;
      const seams = gitSeamsIn(command);
      if (seams.length === 0) return undefined;
      for (const seam of seams) {
        if (seam === "post:commit") continue; // fired from the tool result
        const result = await run(seam, ctx);
        if (result.blocks.length > 0) {
          return { block: true, reason: result.blocks.join("\n\n") };
        }
      }
      return undefined;
    },

    onToolResult: postCommitFailure,
  };
}
