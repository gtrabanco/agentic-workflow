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
 * Degradation is latched: a broken config is announced once per project
 * session and then behaves as the declared no-op (O5) — it never blocks.
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

export interface HooksWiringDeps {
  agentDir: string;
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

/** Split a bash command into segments the same way a shell would chain them. */
function gitSeamsIn(command: string): Array<"pre:commit" | "pre:push" | "post:commit"> {
  const seams = new Array<"pre:commit" | "pre:push" | "post:commit">();
  for (const raw of command.split(/(?:\|\||&&|;|\||\r?\n)/u)) {
    const segment = raw.trim();
    const match = /^git(?:\s+-{1,2}[\w-]+)*\s+(commit|push)(?:\s|$)/u.exec(segment);
    if (!match) continue;
    if (match[1] === "commit") {
      seams.push("pre:commit", "post:commit");
    } else {
      seams.push("pre:push");
    }
  }
  return seams;
}

export function createHooksWiring(deps: HooksWiringDeps): HooksWiring {
  /** Degradation latch: one announce per project session (O5). */
  let degradationAnnouncedFor: string | null = null;

  const run = async (seam: Parameters<typeof runSeam>[0], ctx: HooksContext): Promise<SeamRunResult> => {
    const result = await runSeam(seam, {
      agentDir: deps.agentDir,
      cwd: ctx.cwd,
      projectTrusted: ctx.isProjectTrusted(),
      readFile: deps.readFile,
      readConsent: deps.readConsent,
      spawnHook: deps.spawnHook,
      runGit: deps.runGit,
    });
    if (result.verdict === "degrade" && degradationAnnouncedFor !== ctx.cwd) {
      degradationAnnouncedFor = ctx.cwd;
      for (const notice of result.notices) ctx.ui.notify(notice.message, "warning");
    }
    return result;
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
      await run("session:start", ctx);
    },

    async onSessionShutdown(ctx) {
      await run("session:end", ctx);
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
