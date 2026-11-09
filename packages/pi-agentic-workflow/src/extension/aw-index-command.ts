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
 * four counts and the declared degradations. The report is rendered from the
 * sync envelope alone (S9): no second read, no model-side re-derivation.
 *
 * Nothing here writes a byte of store state itself; the runner owns it.
 */

import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

import { runtimeBin } from "../runtime.js";
import { AW_INDEX_COMMAND } from "../routing/types.js";
import type { CommandRegistrar } from "./factory.js";
import type { InvocationContext, ModelRef } from "../routing/types.js";

/**
 * A run so long that the operator would rather wait is still the operator's
 * call: a paced backfill of a large corpus is minutes of declared work, never a
 * silently truncated sync.
 */
const RUN_TIMEOUT_MS = 600_000;

/**
 * The envelope the runner prints for `doc --sync --json-only`. Only the fields
 * the report renders are named; anything else the envelope carries is ignored,
 * so an additive runner field never breaks the command.
 */
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
  bin: string;
  args: string[];
  cwd: string;
  timeoutMs: number;
};

/** The spawn result, narrowed to what the command reads. */
export type IndexRunResult = { status: number | null; stdout: string; stderr: string; error?: Error };

/** The resolved runner entry point, or the reason it could not be resolved. */
export type ResolvedScript = { ok: true; path: string } | { ok: false; detail: string };

export interface AwIndexCommandDeps {
  readonly run?: (request: IndexRunRequest) => IndexRunResult;
  readonly bin?: string;
  readonly resolveScript?: () => ResolvedScript;
  readonly timeoutMs?: number;
}

/**
 * The runner crate's entry point, resolved from this package's own dependency
 * (the same resolution `workflow-tools.ts` uses for the schema package's JSON).
 * A host where the dependency is absent reports the reason instead of throwing.
 */
function defaultResolveScript(): ResolvedScript {
  try {
    const require = createRequire(import.meta.url);
    return { ok: true, path: require.resolve("@gtrabanco/agentic-workflow/bin/agentic-workflow.mjs") };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

function defaultRun(request: IndexRunRequest): IndexRunResult {
  const result = spawnSync(request.bin, request.args, {
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
 * Render the report from the sync envelope and nothing else (S9). A store that
 * predates the additive `pending`/`model` fields still renders — the count is
 * declared `unknown` rather than invented.
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
  return [
    `aw-index — ${store?.path ?? "(unknown store)"}`,
    `files: ${store?.files ?? 0} · chunks: ${store?.chunks ?? 0}`,
    `pending: ${pending} · model: ${model}`,
    `last sync: scanned ${lastSync.files_scanned ?? 0} · changed ${lastSync.files_changed ?? 0} · deleted ${
      lastSync.files_deleted ?? 0
    } · embedded ${lastSync.embedded ?? 0}`,
    `degradations: ${degradations}`,
  ].join("\n");
}

/** Register the native `/aw-index` command on the shared registrar. */
export function registerAwIndexCommand<M extends ModelRef = ModelRef>(
  registrar: CommandRegistrar<M>,
  deps: AwIndexCommandDeps = {},
): void {
  const resolveScript = deps.resolveScript ?? defaultResolveScript;
  const run = deps.run ?? defaultRun;
  const timeoutMs = deps.timeoutMs ?? RUN_TIMEOUT_MS;

  registrar.registerCommand(AW_INDEX_COMMAND, {
    description:
      "Index the project docs now: a progressive, resumable sync that reports pending chunks, the pinned embedding model, the last sync and any degradation.",
    handler: async (_args: string, ctx: InvocationContext<M>): Promise<void> => {
      const script = resolveScript();
      if (!script.ok) {
        ctx.notify(`/aw-index could not find the runner crate: ${script.detail}. Nothing was indexed.`, "error");
        return;
      }

      let result: IndexRunResult;
      try {
        result = run({
          bin: deps.bin ?? runtimeBin(),
          args: [script.path, "doc", "--sync", "--json-only"],
          cwd: ctx.cwd,
          timeoutMs,
        });
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
