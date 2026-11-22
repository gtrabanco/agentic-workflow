/**
 * session-telemetry.ts — the session accumulator and its sinks (issue #383,
 * S4/S4a/S4b). It is the one place a unit's cost is observed from inside the
 * runtime that spent it: the model provider's own token counts and the tool
 * runtime's monotonic durations, accumulated per turn and emitted to every
 * registered sink — at each settled run (`emit()`) and once more at teardown
 * (`flush()`), which writes nothing when the last run already emitted the same
 * value.
 *
 * Five rules, each a test in `test/session-telemetry.test.mjs`:
 *
 *  - **Turn boundaries, never a session span.** A session's first and last
 *    timestamps measure how long a person was away. A turn's window, minus the
 *    tools it ran, is the closest honest reading of what the model did.
 *  - **Content-free.** The payload carries a unit id and numbers. No prompt
 *    text, no model output, no diff, no file content — the accumulator never
 *    receives any of them, so no sink can leak what it was never given.
 *  - **Measured when written, never snapshotted early.** The path count and the
 *    provenance string may be functions, resolved as the sample is taken: a
 *    value captured when the accumulator was built describes the tree and the
 *    run *before* the work the sample exists to record.
 *  - **A run boundary emits, a teardown closes (#623 S4/S6).** `emit()` writes
 *    the cumulative sample at a settled run and drops a re-emission of the value
 *    the sinks already hold; `flush()` is the final, latched emission. That is
 *    what lets a session that never shuts down keep emitting without duplicating,
 *    and what keeps the shutdown from adding a second copy of the last run's row.
 *  - **Off means absent.** A disabled accumulator emits nothing and reports
 *    nothing; it never estimates the sample it did not take.
 *  - **A refusal is reported, never swallowed (#690 S3).** A sink that refuses
 *    its sample costs the others nothing — and costs nobody their silence: the
 *    failure travels to `onSinkError` with the sink's name and the refusal's
 *    reason, so a destination that fails on every emission is a stated defect
 *    instead of an empty file nobody hears about.
 *
 * The log writer (#394) consumes this module as a second sink, which is why the
 * interface here is a sink and not a hardcoded writer.
 */

import fs from "node:fs";
import path from "node:path";

import { PHASE_LABELS } from "@gtrabanco/agentic-workflow-schema";

/** The provider's usage record for one assistant message; every field optional. */
export interface MessageUsage {
  totalTokens?: number;
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
  reasoning?: number;
}

/**
 * One unit sample — the numbers only, in the ledger's own column order.
 *
 * #504 widened it: `phase`, `version` and `model` name the work, and the five
 * provider fields break `tokens` down, so a cost regression can be attributed
 * to a work type instead of a single opaque number. The eight fields #383
 * shipped keep their meaning; `tokens` is still the provider's own total.
 */
export interface TelemetrySample {
  readonly unit: string;
  readonly phase: string | null;
  readonly version: string | null;
  readonly model: string | null;
  readonly changed_paths: number;
  readonly tokens: number;
  readonly turns: number;
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly cache_read_tokens: number;
  readonly cache_write_tokens: number;
  readonly reasoning_tokens: number;
  readonly model_ms: number;
  readonly tool_ms: number;
  readonly observed: string;
  readonly source: string;
}

/** A destination for one sample. A sink that throws never breaks another. */
export interface TelemetrySink {
  readonly name: string;
  write(sample: TelemetrySample): void;
}

/**
 * One sink's refusal: which destination lost the sample, and why (#690 S3).
 * `error` is the sink's own throw, passed through untouched so the report can
 * carry the reason the writer itself chose — a ledger that refuses a missing
 * grammar and one that refuses a full disk read very differently.
 */
export interface TelemetrySinkFailure {
  readonly sink: string;
  readonly error: unknown;
}

export interface SessionTelemetryOptions {
  /** The telemetry switch; `false` disables counting and emission entirely. */
  readonly enabled: boolean;
  /** The unit the session is working on, as its directory is named. */
  readonly unit: string;
  /**
   * The command that named the unit, from the closed `PHASE_LABELS` vocabulary.
   * Absent means the sample names no phase, which is what a caller outside a
   * dispatched command honestly has.
   */
  readonly phase?: string | null;
  /**
   * The producing package's version. Defaults to this package's own manifest —
   * the value a row traces back to — and is injectable for the same reason the
   * clock is: so the suite owns it.
   */
  readonly version?: string | null;
  /**
   * How many paths this session changed. A function is evaluated when the sample
   * is written, which is the only moment the answer is known: a count taken when
   * the accumulator was built would describe the tree before the session worked.
   */
  readonly changedPaths?: number | (() => number);
  readonly sinks?: readonly TelemetrySink[];
  /**
   * Where a sink's refusal is reported. Absent means the caller has no channel
   * to report through, which is an honest absence for a caller with none; the
   * wiring that owns the session supplies one.
   */
  readonly onSinkError?: (failure: TelemetrySinkFailure) => void;
  /** Milliseconds since the epoch; injected so the suite owns the clock. */
  readonly now?: () => number;
  /** `YYYY-MM-DD`; injected for the same reason. */
  readonly date?: () => string;
  /**
   * The producer's provenance string, so a sample traces back to its run. A
   * function is resolved at emit time, which is how one builder can name the
   * session it is about to measure.
   */
  readonly source?: string | (() => string);
}

export interface SessionTelemetry {
  onTurnStart(event: { timestamp?: number }): void;
  onTurnEnd(event: { message?: { usage?: MessageUsage; model?: string } }): void;
  onToolEnd(event: { durationMs?: number }): void;
  /** The counters as a sample, without emitting it. */
  peek(): TelemetrySample | null;
  /**
   * Emit the current cumulative sample at a run boundary. Returns the sample it
   * wrote, or `null` when there was nothing new: a disabled accumulator, a
   * closed session, or the same value the sinks already hold (a re-emission is
   * not a second sample).
   */
  emit(): TelemetrySample | null;
  /** Emit the final sample to every sink, once; a second call emits nothing. */
  flush(): TelemetrySample | null;
}

const EPOCH_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The provider's own token count: the total when given, else its parts. */
function tokensOf(usage: MessageUsage | undefined): number {
  if (!usage) return 0;
  if (typeof usage.totalTokens === "number") return Math.max(0, Math.trunc(usage.totalTokens));
  return sumOf(usage);
}

/** One provider field as a non-negative integer; an absent field is a zero. */
function countOf(value: number | undefined): number {
  return typeof value === "number" ? Math.max(0, Math.trunc(value)) : 0;
}

/** The five provider fields, summed — the total when the provider names none. */
function sumOf(usage: MessageUsage): number {
  return [usage.input, usage.output, usage.cacheRead, usage.cacheWrite, usage.reasoning]
    .reduce<number>((sum, part) => sum + countOf(part), 0);
}

let cachedVersion: string | null | undefined;

/**
 * The package's own version, read from its manifest.
 *
 * `dist/session-telemetry.js` sits one directory below the manifest, so the
 * path is the same in the source tree and in a packed install. A package whose
 * manifest cannot be read answers `null` rather than a literal nobody bumped.
 */
export function packageVersion(): string | null {
  if (cachedVersion === undefined) {
    try {
      const manifest = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version?: unknown };
      cachedVersion = typeof manifest.version === "string" && manifest.version !== "" ? manifest.version : null;
    } catch {
      cachedVersion = null;
    }
  }
  return cachedVersion;
}

/**
 * The phase a dispatched command names, or `null` for a name the vocabulary does
 * not publish. The set is closed: a command that ran without being registered is
 * a coverage defect the repository's own test catches (`S7`), never a label
 * invented here.
 */
export function phaseFromCommand(command: string): string | null {
  return (PHASE_LABELS as readonly string[]).includes(command) ? command : null;
}

/**
 * The accumulator. Event handlers are safe to call in any order and any number
 * of times: an unbalanced `onToolEnd` still counts, a `onTurnEnd` with no open
 * window counts its tokens and zero milliseconds.
 */
export function createSessionTelemetry(options: SessionTelemetryOptions): SessionTelemetry {
  const now = options.now ?? Date.now;
  const date = options.date ?? (() => new Date(now()).toISOString().slice(0, 10));
  const sinks = options.sinks ?? [];
  const source = options.source ?? "pi:session";
  const changedPaths = options.changedPaths ?? 0;

  let tokens = 0;
  let turns = 0;
  let modelMs = 0;
  let toolMs = 0;
  let windowStart: number | null = null;
  let windowToolMs = 0;
  /** The final flush happened: the session is closed, no boundary may emit. */
  let emitted = false;
  /** The identity of the last sample the sinks received, so a re-emission is dropped. */
  let lastWritten = "";
  // The provider's own fields, accumulated beside the total they belong to.
  const tokenFields = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 };
  // Which model served which turns. A session may switch models, and the sample
  // is the session's cost: it names the majority's model, first seen on a tie.
  const modelTurns = new Map<string, number>();

  function modelOf(): string | null {
    let best: string | null = null;
    let bestTurns = 0;
    for (const [model, served] of modelTurns) {
      if (served > bestTurns) {
        best = model;
        bestTurns = served;
      }
    }
    return best;
  }

  function sample(): TelemetrySample | null {
    if (!options.enabled) return null;
    const observed = date();
    if (!EPOCH_DAY.test(observed)) throw new Error(`observed date must be YYYY-MM-DD, got ${observed}`);
    return {
      unit: options.unit,
      phase: options.phase ?? null,
      version: options.version === undefined ? packageVersion() : options.version,
      model: modelOf(),
      changed_paths: typeof changedPaths === "function" ? changedPaths() : changedPaths,
      tokens,
      turns,
      input_tokens: tokenFields.input,
      output_tokens: tokenFields.output,
      cache_read_tokens: tokenFields.cacheRead,
      cache_write_tokens: tokenFields.cacheWrite,
      reasoning_tokens: tokenFields.reasoning,
      model_ms: Math.max(0, Math.round(modelMs)),
      tool_ms: Math.max(0, Math.round(toolMs)),
      observed,
      source: typeof source === "function" ? source() : source,
    };
  }

  /**
   * Write the current sample unless the sinks already hold exactly this one. A
   * sample repeated unchanged can only be a re-emission — a run that measured
   * nothing adds no turn, no token and no tool millisecond — and writing it
   * again would be the one duplicate the sinks do not guard against.
   */
  function writeCurrent(): TelemetrySample | null {
    const payload = sample();
    if (payload === null) return null;
    const identity = JSON.stringify(payload);
    if (identity === lastWritten) return null;
    lastWritten = identity;
    for (const sink of sinks) {
      try {
        sink.write(payload);
      } catch (error) {
        // One broken destination must not cost the others their sample, and a
        // shutdown must never be blocked by a writer. The refusal is reported
        // instead of vanishing (#690 S3): a sink that refuses on every emission
        // used to be an empty destination nobody was told about.
        try {
          options.onSinkError?.({ sink: sink.name, error });
        } catch {
          // The reporter belongs to the caller; a broken one must not cost the
          // remaining sinks their sample either.
        }
      }
    }
    return payload;
  }

  return {
    onTurnStart(event) {
      if (!options.enabled) return;
      windowStart = typeof event.timestamp === "number" ? event.timestamp : now();
      windowToolMs = 0;
    },

    onTurnEnd(event) {
      if (!options.enabled) return;
      const message = event.message;
      const usage = message?.usage;
      tokens += tokensOf(usage);
      if (usage) {
        tokenFields.input += countOf(usage.input);
        tokenFields.output += countOf(usage.output);
        tokenFields.cacheRead += countOf(usage.cacheRead);
        tokenFields.cacheWrite += countOf(usage.cacheWrite);
        tokenFields.reasoning += countOf(usage.reasoning);
      }
      if (typeof message?.model === "string" && message.model !== "") {
        modelTurns.set(message.model, (modelTurns.get(message.model) ?? 0) + 1);
      }
      turns += 1;
      if (windowStart !== null) {
        // The window covers the whole turn, tools included; what the model spent
        // is the window minus the tool durations it contains.
        const wall = now() - windowStart;
        modelMs += Math.max(0, wall - windowToolMs);
      }
      windowStart = null;
      windowToolMs = 0;
    },

    onToolEnd(event) {
      if (!options.enabled) return;
      const duration = typeof event.durationMs === "number" ? Math.max(0, event.durationMs) : 0;
      toolMs += duration;
      windowToolMs += duration;
    },

    peek() {
      return sample();
    },

    emit() {
      if (emitted) return null;
      return writeCurrent();
    },

    flush() {
      if (emitted) return null;
      emitted = true;
      return writeCurrent();
    },
  };
}

/** The commands whose first argument names a unit. */
const UNIT_COMMANDS = new Set(["execute-phase", "unit-lane", "fold-findings", "workflow-status"]);

const UNIT_TREES = ["docs/fix", "docs/features"] as const;

/**
 * The unit a command invocation names, resolved against the project's own
 * directories — deterministic, from the arguments the caller already has. An
 * argument may be the directory name (`383-measured-acceptance`) or the issue
 * number the directory starts with (`383`); anything else resolves to `null`, and
 * a `null` unit means no sample is invented for it.
 */
export function unitFromCommand(root: string, command: string, args: readonly string[]): string | null {
  if (!UNIT_COMMANDS.has(command)) return null;
  for (const raw of args) {
    const arg = raw.trim();
    if (arg === "" || arg.startsWith("-") || !/^[0-9A-Za-z]/.test(arg)) continue;
    for (const tree of UNIT_TREES) {
      const dir = path.join(root, tree);
      let entries: string[];
      try {
        entries = fs.readdirSync(dir);
      } catch {
        continue;
      }
      const exact = entries.find((name) => name === arg);
      if (exact) return exact;
      if (/^\d+$/.test(arg)) {
        const prefixed = entries.filter((name) => name.startsWith(`${arg}-`)).sort();
        if (prefixed.length === 1) return prefixed[0];
      }
    }
  }
  return null;
}
