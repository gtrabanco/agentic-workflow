/**
 * The native `aw-index` command (issue #443 S5).
 *
 * `/aw-index` is code, not a skill: it is registered by this extension beside
 * `/advance`, carries no `SKILL.md`, no `argument-hint` and no context budget,
 * and rebuild stays a manual `doc --rebuild` (out of the command).
 *
 * The command runs one **progressive, idempotent** sync by spawning the runner
 * crate's own entry point — the store's pending set is the resume point, so a
 * run killed part-way never re-embeds what already landed — and prints the
 * report the operator asked for: pending count, pinned model, the last sync's
 * four counts, the declared degradations and, when the provider refused a
 * request, what it said and which chunks it cost (fix #540). The report is
 * rendered from the sync envelope alone (S9): no second read, no model-side
 * re-derivation.
 *
 * Nothing here writes a byte of store state itself; the runner owns it.
 */

import { spawnSync } from "node:child_process";

import { installedCandidate, runnerLaunch } from "../runner-bin.js";
import type { RunnerAnswer } from "../runner-bin.js";
import { runtimeBin } from "../runtime.js";
import { AW_INDEX_COMMAND } from "../routing/types.js";
import type { CommandRegistrar } from "./factory.js";
import type { InvocationContext, ModelRef } from "../routing/types.js";

/**
 * The floor of the spawn cap: the scan pass plus a warm sync. A run whose pending
 * count is unknown never gets less than this, so a store that answers nothing
 * degrades to the shipped cap instead of an invented one.
 */
const RUN_TIMEOUT_MS = 600_000;

/** The status probe is a local read of two counts: it must never hold the command. */
export const PROBE_TIMEOUT_MS = 30_000;

/**
 * How long one pending chunk costs, rounded up from the pace the issue measured
 * (~65 chunks/min on a 12.9k-chunk corpus, issue #718), plus the scan pass and
 * provider latency on top of the paced work.
 */
const EMBED_MS_PER_CHUNK = 1_000;
const EMBED_SLACK_MS = 120_000;

/**
 * The most the probe's answer may buy: six hours. A real backfill of a large
 * corpus stays well inside it, and a store whose count is corrupt or invented
 * cannot turn the derived cap into an unbounded wait.
 */
export const MAX_DERIVED_TIMEOUT_MS = 6 * 60 * 60 * 1_000;

/**
 * The cap a pending count buys (issue #718 S4): the paced work plus the scan,
 * never below the shipped floor and never above a ceiling — a corrupt or hostile
 * store reporting an absurd count would otherwise buy an effectively unbounded
 * window and remove the very bound the floor sets (review-change fix/718 cycle 1).
 */
export function derivedTimeoutMs(pending: number | null | undefined): number {
  if (typeof pending !== "number" || !Number.isFinite(pending) || pending <= 0) return RUN_TIMEOUT_MS;
  return Math.min(MAX_DERIVED_TIMEOUT_MS, Math.max(RUN_TIMEOUT_MS, pending * EMBED_MS_PER_CHUNK + EMBED_SLACK_MS));
}

/** The status envelope's one field the cap reads. */
export interface StatusEnvelopeLike {
  readonly store?: { readonly pending?: number | null } | null;
}

/**
 * The envelope the runner prints for `doc --sync --json-only`. Only the fields
 * the report renders are named; anything else the envelope carries is ignored,
 * so an additive runner field never breaks the command.
 */
/** The additive rejection detail a rejected sync carries (fix #540 S4). */
export interface RejectedChunksLike {
  readonly count?: number;
  readonly failures?: readonly { readonly status?: number | null; readonly message?: string }[];
  readonly chunks?: readonly string[];
  readonly omitted?: number;
}

export interface SyncEnvelopeLike {
  readonly ok?: boolean;
  readonly command?: string;
  readonly degradations?: readonly string[];
  readonly store?: {
    readonly path?: string;
    readonly files?: number;
    readonly chunks?: number;
    readonly pending?: number | null;
    readonly model?: string | null;
    readonly rejected?: RejectedChunksLike | null;
    readonly lastSync?: {
      readonly files_scanned?: number;
      readonly files_changed?: number;
      readonly files_deleted?: number;
      readonly embedded?: number;
    };
  } | null;
}

/** One runner invocation, injectable so a suite owns argv, cwd and exit status. */
export type IndexRunRequest = {
  program: string;
  argv: string[];
  cwd: string;
  timeoutMs: number;
};

/** The spawn result, narrowed to what the command reads. */
export type IndexRunResult = { status: number | null; stdout: string; stderr: string; error?: Error };

export interface AwIndexCommandDeps {
  readonly run?: (request: IndexRunRequest) => IndexRunResult;
  /** The composed runner command; defaults to the shared `runnerLaunch`. */
  readonly launch?: (args: string[]) => Promise<RunnerAnswer>;
  readonly timeoutMs?: number;
}

/**
 * The composed runner command: the crate bin this package resolves, or the
 * crate's closed runner set when that dependency is missing (issue #555). A
 * host where neither resolves reports the reason instead of throwing.
 */
async function defaultLaunch(args: string[]): Promise<RunnerAnswer> {
  return runnerLaunch(args, { installed: installedCandidate(runtimeBin()) });
}

function defaultRun(request: IndexRunRequest): IndexRunResult {
  const result = spawnSync(request.program, request.argv, {
    cwd: request.cwd,
    encoding: "utf8",
    timeout: request.timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
  });
  return {
    status: result.status,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
    ...(result.error ? { error: result.error } : {}),
  };
}

/**
 * The store's pending count from `doc status --json-only`, or `null` when the
 * probe cannot answer (an absent store, a refused spawn, output that is not the
 * one envelope). A `null` keeps the shipped floor: an unreadable store is not a
 * refusal to index, and a probe must never become the command's failure.
 */
async function pendingCount(
  launchFor: (args: string[]) => Promise<RunnerAnswer>,
  run: (request: IndexRunRequest) => IndexRunResult,
  cwd: string,
): Promise<number | null> {
  let launch: RunnerAnswer;
  try {
    launch = await launchFor(["doc", "--status", "--json-only"]);
  } catch {
    return null;
  }
  let result: IndexRunResult;
  try {
    result = run({ program: launch.argv[0], argv: launch.argv.slice(1), cwd, timeoutMs: PROBE_TIMEOUT_MS });
  } catch {
    return null;
  }
  if (result.error || result.status !== 0) return null;
  try {
    const pending = (JSON.parse(result.stdout) as StatusEnvelopeLike)?.store?.pending;
    return typeof pending === "number" && Number.isFinite(pending) ? pending : null;
  } catch {
    return null;
  }
}

/**
 * Render the report from the sync envelope and nothing else (S9). A store that
 * predates the additive `pending`/`model`/`rejected` fields still renders — the
 * count is declared `unknown` rather than invented, and an absent `rejected`
 * reads `none` rather than being guessed from the degradation list.
 *
 * `rejected` is the rejection detail (fix #540 S4): the provider's status and
 * body excerpt, and the chunks it cost. A non-zero pending count adds the one
 * line that moves the operator forward — the sync is resumable, and a rejected
 * set is repaired by re-chunking under the current limit and embedding in the
 * same pass (`doc --rebuild`).
 */
export function renderIndexReport(envelope: SyncEnvelopeLike | null): string {
  const store = envelope?.store ?? {};
  const lastSync = store?.lastSync ?? {};
  const pending = store?.pending === undefined || store?.pending === null ? "unknown" : String(store.pending);
  const model = store?.model ? String(store.model) : "none";
  const degradations =
    Array.isArray(envelope?.degradations) && envelope.degradations.length > 0
      ? envelope.degradations.join(", ")
      : "none";
  const rejected = store?.rejected ?? null;
  const rejectionLine = renderRejection(rejected);
  const lines = [
    `aw-index — ${store?.path ?? "(unknown store)"}`,
    `files: ${store?.files ?? 0} · chunks: ${store?.chunks ?? 0}`,
    `pending: ${pending} · model: ${model}`,
    `last sync: scanned ${lastSync.files_scanned ?? 0} · changed ${lastSync.files_changed ?? 0} · deleted ${
      lastSync.files_deleted ?? 0
    } · embedded ${lastSync.embedded ?? 0}`,
    `rejected: ${rejectionLine}`,
    `degradations: ${degradations}`,
  ];
  if (typeof store?.pending === "number" && store.pending > 0) {
    lines.push(
      `next: ${store.pending} chunk(s) remain unembedded — re-run /aw-index (the sync is resumable); if the ` +
        `provider rejected them, \`doc --rebuild\` re-chunks under the current provider.chunk_limit and embeds in one pass`,
    );
  }
  return lines.join("\n");
}

/** `none`, or the provider's own words with the chunks they cost. */
function renderRejection(rejected: RejectedChunksLike | null | undefined): string {
  if (!rejected) return "none";
  const count = rejected.count ?? 0;
  if (count === 0) return "none";
  const failures = (rejected.failures ?? [])
    .map((failure) => `${failure.status ?? "-"} ${failure.message ?? "(no diagnosis)"}`.trim())
    .join(" | ");
  const omitted = rejected.omitted ?? 0;
  const more = omitted > 0 ? ` (+${omitted} more)` : "";
  return `${count} chunk(s) · ${failures || "(no diagnosis)"}${more}`;
}

/** Register the native `/aw-index` command on the shared registrar. */
export function registerAwIndexCommand<M extends ModelRef = ModelRef>(
  registrar: CommandRegistrar<M>,
  deps: AwIndexCommandDeps = {},
): void {
  const launchFor = deps.launch ?? defaultLaunch;
  const run = deps.run ?? defaultRun;

  registrar.registerCommand(AW_INDEX_COMMAND, {
    description:
      "Index the project docs now: a progressive, resumable sync that reports pending chunks, the pinned embedding model, the last sync and any degradation.",
    handler: async (_args: string, ctx: InvocationContext<M>): Promise<void> => {
      let launch: RunnerAnswer;
      try {
        launch = await launchFor(["doc", "--sync", "--json-only"]);
      } catch (error) {
        ctx.notify(
          `/aw-index could not find the runner crate: ${error instanceof Error ? error.message : String(error)}. Nothing was indexed.`,
          "error",
        );
        return;
      }

      let result: IndexRunResult;
      try {
        // The operator asked for the indexing, not for a ten-minute ceiling: the
        // cap is derived from what the store says is left, and only when the
        // caller did not supply one (issue #718 S4).
        const timeoutMs = deps.timeoutMs ?? derivedTimeoutMs(await pendingCount(launchFor, run, ctx.cwd));
        // The resolver answers a full argv; the spawn seam takes the program
        // beside the arguments it receives.
        result = run({ program: launch.argv[0], argv: launch.argv.slice(1), cwd: ctx.cwd, timeoutMs });
      } catch (error) {
        ctx.notify(
          `/aw-index could not run the index sync: ${error instanceof Error ? error.message : String(error)}`,
          "error",
        );
        return;
      }

      if (result.error) {
        ctx.notify(`/aw-index could not run the index sync: ${result.error.message}`, "error");
        return;
      }
      if (result.status !== 0) {
        const detail = result.stderr.trim() || result.stdout.trim() || `exited ${result.status}`;
        ctx.notify(`/aw-index: the index sync failed — ${detail}`, "error");
        return;
      }

      let envelope: SyncEnvelopeLike;
      try {
        envelope = JSON.parse(result.stdout) as SyncEnvelopeLike;
      } catch {
        // A runner whose stdout is not the one JSON document it promises is
        // reported, never rendered as an empty, reassuring report.
        const detail = result.stdout.trim().slice(0, 200) || "(empty stdout)";
        ctx.notify(`/aw-index: the index sync printed no parseable envelope — ${detail}`, "error");
        return;
      }

      ctx.notify(renderIndexReport(envelope), "info");
    },
  });
}
