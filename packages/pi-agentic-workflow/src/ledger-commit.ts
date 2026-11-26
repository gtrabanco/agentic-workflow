/**
 * ledger-commit.ts — the teardown half of the machine-owned ledger's commit
 * (issue #727 S1a).
 *
 * The telemetry sink writes its last row when the session settles or shuts down,
 * so the row can never be committed by the session that produced it: a session
 * told to commit the ledger commits without its own row, and the teardown then
 * re-dirties the file. The commit is therefore mechanical and spends no model
 * tokens — and, exactly like every other child this extension spawns, it runs at
 * the runtime that launched pi (`runtimeBin()`/`runtimeEnv()`), never a guessed
 * one.
 *
 * Three rules, each a case in `test/ledger-commit.test.mjs`:
 *
 *  - **One command, no second implementation.** The child is the crate's own
 *    `telemetry commit`, the same module the skills-only path and the gate use.
 *    A `git add`/`git commit` pair composed here would be a second owner of the
 *    lock and the subject.
 *  - **Best-effort, never fatal.** A teardown must not fail over a ledger: an
 *    absent crate, a non-checkout, a spawn error and a nonzero exit are outcomes,
 *    reported once per session through the operator's own channel.
 *  - **Once per session.** The commit follows the final flush and runs at most
 *    once, so a host that fires the shutdown twice does not commit twice.
 */

import { spawnSync as nodeSpawnSync } from "node:child_process";

import { runnerBin } from "./runner-bin.js";
import { runtimeBin, runtimeEnv } from "./runtime.js";

/** What the commit concluded. `skipped` is an absence, never a failure. */
export interface LedgerCommitOutcome {
  readonly status: "committed" | "clean" | "locked" | "skipped" | "failed" | "would-commit";
  readonly detail?: string;
}

/** The slice of `spawnSync` this module needs, so the suite owns the child. */
export type SpawnSyncLike = (
  program: string,
  argv: readonly string[],
  options: { readonly cwd: string; readonly env: NodeJS.ProcessEnv; readonly timeout: number; readonly encoding: "utf8" },
) => { readonly status: number | null; readonly stdout?: string | null; readonly stderr?: string | null; readonly error?: Error };

export interface LedgerCommitOptions {
  readonly root: string;
  /** The telemetry switch; off means no commit at all. */
  readonly enabled?: boolean;
  /** The runtime to spawn; defaults to the one that launched pi. */
  readonly program?: string;
  /** The crate bin script; `null` means "not installed", the honest absence. */
  readonly script?: string | null;
  /** Extra environment for the child; the runtime declaration is always added. */
  readonly env?: NodeJS.ProcessEnv;
  /** How long a teardown may wait on git. */
  readonly timeoutMs?: number;
  readonly spawn?: SpawnSyncLike;
  /** Where an outcome is reported: the operator's `notify`, or stderr. */
  readonly report?: (message: string) => void;
}

export interface LedgerCommit {
  commit(): LedgerCommitOutcome;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Build the teardown commit. The crate bin and the runtime are resolved lazily
 * and once: a session that never settles pays nothing, and a repaired install is
 * not hidden by a cached negative.
 */
export function createLedgerCommit(options: LedgerCommitOptions): LedgerCommit {
  const enabled = options.enabled !== false;
  const report = options.report ?? ((message: string) => void process.stderr.write(`${message}\n`));
  let resolved: { program: string; script: string } | null | undefined;
  let reported = false;
  let committed = false;

  function resolve(): { program: string; script: string } | null {
    if (resolved === undefined) {
      const script = options.script === undefined ? runnerBin() : options.script;
      resolved = script === null || script === "" ? null : { program: options.program ?? runtimeBin(), script };
    }
    return resolved;
  }

  /** Once per session: a repair request repeated per emission stops being heard. */
  function say(message: string): void {
    if (reported) return;
    reported = true;
    try {
      report(message);
    } catch {
      process.stderr.write(`${message}\n`);
    }
  }

  return {
    commit(): LedgerCommitOutcome {
      if (!enabled) return { status: "skipped", detail: "telemetry is off" };
      if (committed) return { status: "committed", detail: "already committed by this session" };
      const target = resolve();
      if (target === null) {
        say("pi-agentic-workflow: the machine-ledger commit did not run — @gtrabanco/agentic-workflow is not installed in this session");
        return { status: "skipped", detail: "crate not installed" };
      }

      const spawn: SpawnSyncLike = options.spawn ?? (nodeSpawnSync as unknown as SpawnSyncLike);
      const child = spawn(target.program, [target.script, "telemetry", "commit", "--class", "telemetry"], {
        cwd: options.root,
        env: { ...process.env, ...runtimeEnv(), ...(options.env ?? {}) },
        timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        encoding: "utf8",
      });

      if (child.error !== undefined || child.status !== 0) {
        const reason = child.error?.message ?? (String(child.stderr ?? "").trim() || `exit ${child.status ?? "unknown"}`);
        say(`pi-agentic-workflow: the machine-ledger commit failed — ${reason}`);
        return { status: "failed", detail: reason };
      }

      committed = true;
      let status: LedgerCommitOutcome["status"] = "committed";
      try {
        const envelope = JSON.parse(String(child.stdout ?? "{}")) as { status?: unknown };
        if (typeof envelope.status === "string") status = envelope.status as LedgerCommitOutcome["status"];
      } catch {
        // The child answered nothing parseable; its exit code already said it ran.
      }
      return { status };
    },
  };
}
