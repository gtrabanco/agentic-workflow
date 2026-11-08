import type { ProjectionSeam } from "@gtrabanco/agentic-workflow-schema";

import { loadHooksConfig, readSeamHooksConsent } from "./config.js";
import { consentFilePath } from "./config.js";
import type { LoadedHooksConfig, ResolvedHookEntry } from "./config.js";
import { DEFAULT_HOOK_TIMEOUT_MS, runArgv, seamBlockMessage, tokenizeHookCommand } from "./runner.js";
import type { HookRunResult } from "./runner.js";

/**
 * The seam-hooks dispatcher — one seam, one verdict (issue #413, obligations
 * O3/O4/O5/O8/O11).
 *
 * The gates run in a fixed order before any process exists: the config must be
 * valid (a broken file degrades to a declared no-op with a notice, O5), the
 * seam's groups must be explicitly `enabled` (O4), and the project must carry
 * init-workspace's consent marker (O3). Only then do the seam's hooks run, in
 * order, global first; the first block ends the seam with the teaching message
 * that quotes the declared requirement (O8). Auto commit/push (O11) runs only
 * after the whole seam allowed, only on the flags' own seams, with the declared
 * message — the flags exist in the grammar so they can be refused everywhere
 * else, never as bundled defaults.
 *
 * This module is Pi-free: the wiring in `../extension/hooks-wiring.ts` binds it
 * to pi's lifecycle. It never writes anything (O13) — the only consent writer
 * is init-workspace's flow.
 *
 * Two silence traps are closed here. A broken file degrades with a problem
 * notice naming it (O5); an `enabled` group that has no consent entry is inert
 * and says so (O20) — a valid declaration must never look like a gate that ran.
 */

export interface SeamNotice {
  kind: "problem" | "info";
  message: string;
}

export interface HookRunRecord {
  source: "global" | "project";
  command: string;
  exitCode: number | null;
}

export interface SeamRunResult {
  seam: ProjectionSeam;
  verdict: "allow" | "block" | "degrade";
  notices: SeamNotice[];
  /** One teaching message per blocking hook, quoting the declared requirement. */
  blocks: string[];
  ran: HookRunRecord[];
}

/** What an injected execution returns: the verdict may be derived from the exit code. */
export type InjectedOutcome = Omit<HookRunResult, "verdict"> & { verdict?: HookRunResult["verdict"] };

const isBlocked = (outcome: InjectedOutcome): boolean =>
  outcome.verdict !== undefined ? outcome.verdict === "block" : outcome.exitCode !== 0 || outcome.timedOut;

export interface SeamDeps {
  agentDir: string;
  cwd: string;
  projectTrusted: boolean;
  readFile?: (path: string) => string | null;
  readConsent?: (agentDir: string, cwd: string) => boolean;
  /** Overrides the tokenized argv execution (tests, and the wiring's logging). */
  spawnHook?: (argv: string[], options: { cwd: string; timeoutMs?: number }) => Promise<InjectedOutcome>;
  /** Overrides the auto commit/push git executions. */
  runGit?: (argv: string[]) => Promise<InjectedOutcome>;
  /** Caps every hook at this seam, whatever the declaration asks for. The
   *  shutdown seam sets it: the process is about to exit, so a slow hook must
   *  fail closed inside a bound rather than outlive the session (N3). */
  budgetMs?: number;
}

const allowed = (seam: ProjectionSeam): SeamRunResult => ({ seam, verdict: "allow", notices: [], blocks: [], ran: [] });

export async function runSeam(seam: ProjectionSeam, deps: SeamDeps): Promise<SeamRunResult> {
  const loaded: LoadedHooksConfig = loadHooksConfig({
    agentDir: deps.agentDir,
    cwd: deps.cwd,
    projectTrusted: deps.projectTrusted,
    readFile: deps.readFile,
  });

  if (!loaded.ok) {
    return {
      seam,
      verdict: "degrade",
      notices: loaded.problems.map((problem) => ({
        kind: "problem" as const,
        message: `seam-hooks: ${problem.file} — ${problem.detail}. Declared no-op: no hooks run until the config is valid.`,
      })),
      blocks: [],
      ran: [],
    };
  }

  const enabled = loaded.entries.filter((entry) => entry.seam === seam && entry.group.enabled === true);
  if (enabled.length === 0) return allowed(seam);

  const consented = deps.readConsent
    ? deps.readConsent(deps.agentDir, deps.cwd)
    : readSeamHooksConsent(deps.agentDir, deps.cwd, deps.readFile);
  if (!consented) {
    return {
      seam,
      verdict: "allow",
      notices: [
        {
          kind: "info",
          message: `seam-hooks: this project declares enabled hooks but carries no consent entry (${consentFilePath(deps.agentDir)}) — every declared hook is inert until /init-workspace records your consent.`,
        },
      ],
      blocks: [],
      ran: [],
    };
  }

  const result = await runEnabledEntries(seam, enabled, deps);
  return result;
}

async function runEnabledEntries(seam: ProjectionSeam, entries: ResolvedHookEntry[], deps: SeamDeps): Promise<SeamRunResult> {
  const ran: HookRunRecord[] = [];
  const blocks: string[] = [];

  const execute = async (argv: string[], declared: string, timeoutMs: number | undefined, source: ResolvedHookEntry["source"]): Promise<boolean> => {
    const outcome: InjectedOutcome = deps.spawnHook
      ? await deps.spawnHook(argv, { cwd: deps.cwd, timeoutMs })
      : await runArgv(argv, { cwd: deps.cwd, timeoutMs });
    ran.push({ source, command: declared, exitCode: outcome.exitCode });
    if (isBlocked(outcome)) {
      blocks.push(seamBlockMessage(seam, declared, { ...outcome, verdict: "block" }));
      return false;
    }
    return true;
  };

  for (const entry of entries) {
    for (const hook of entry.group.hooks) {
      const tokenized = tokenizeHookCommand(hook.command);
      if (!tokenized.ok) {
        blocks.push(`seam-hooks: blocked at ${seam} — the project's declared requirement \`${hook.command}\` cannot run: ${tokenized.detail}`);
        return { seam, verdict: "block", notices: [], blocks, ran };
      }
      const declaredMs = hook.timeout !== undefined ? hook.timeout * 1000 : DEFAULT_HOOK_TIMEOUT_MS;
      const timeoutMs = deps.budgetMs !== undefined ? Math.min(declaredMs, deps.budgetMs) : declaredMs;
      const proceed = await execute(tokenized.argv, hook.command, timeoutMs, entry.source);
      if (!proceed) return { seam, verdict: "block", notices: [], blocks, ran };
    }
  }

  // O11 — auto actions only after the whole seam allowed.
  for (const entry of entries) {
    if (!entry.group.autoCommit && !entry.group.autoPush) continue;
    const message = entry.group.commitMessage as string;
    const add: InjectedOutcome = deps.runGit ? await deps.runGit(["git", "add", "-A"]) : await runArgv(["git", "add", "-A"], { cwd: deps.cwd });
    if (isBlocked(add)) {
      blocks.push(seamBlockMessage(seam, "git add -A", { ...add, verdict: "block" }));
      return { seam, verdict: "block", notices: [], blocks, ran };
    }
    const commitDeclared = `git commit -m "${message}"`;
    const commit: InjectedOutcome = deps.runGit
      ? await deps.runGit(["git", "commit", "-m", message])
      : await runArgv(["git", "commit", "-m", message], { cwd: deps.cwd });
    if (isBlocked(commit)) {
      blocks.push(seamBlockMessage(seam, commitDeclared, { ...commit, verdict: "block" }));
      return { seam, verdict: "block", notices: [], blocks, ran };
    }
    if (!entry.group.autoPush) continue;
    const push: InjectedOutcome = deps.runGit ? await deps.runGit(["git", "push"]) : await runArgv(["git", "push"], { cwd: deps.cwd });
    if (isBlocked(push)) {
      blocks.push(seamBlockMessage(seam, "git push", { ...push, verdict: "block" }));
      return { seam, verdict: "block", notices: [], blocks, ran };
    }
  }

  return { seam, verdict: "allow", notices: [], blocks, ran };
}
