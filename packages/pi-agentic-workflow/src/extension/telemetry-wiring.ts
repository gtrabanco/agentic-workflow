/**
 * telemetry-wiring.ts — attaches the session accumulator to Pi's lifecycle
 * (issue #383 S4/S4b, P5).
 *
 * The accumulator and its sink are pure; this file is the only place that knows
 * Pi exists. It is a factory over a `pi`-shaped object so the suite can drive the
 * five events directly, and so `#394` can add a second sink without touching how
 * the session is observed.
 *
 * Two decisions worth knowing when reading it:
 *
 *  - **The unit comes from the command that was dispatched**, resolved against
 *    the project's own directories. A session that ran no unit-scoped command
 *    emits nothing: a sample without a unit would be a row the ledger cannot
 *    attribute, which is worse than no row.
 *  - **Off registers no listener at all.** A listener that wakes up to find itself
 *    disabled is a cost with no feature, so `enabled: false` means `pi.on` is
 *    never called.
 */

import { execFileSync } from "node:child_process";
import { createSessionTelemetry, unitFromCommand, type TelemetrySink } from "../session-telemetry.js";
import { createLedgerSink } from "../telemetry-sinks.js";

/** The events this wiring listens to. */
export const TELEMETRY_EVENTS = Object.freeze([
  "session_start",
  "turn_start",
  "turn_end",
  "tool_execution_end",
  "session_shutdown",
] as const);

/** The slice of `pi` the wiring needs. */
export interface PiLike {
  on(event: string, handler: (event?: unknown) => void): void;
}

export interface TelemetryWiringOptions {
  readonly root: string;
  readonly enabled: boolean;
  readonly sinks?: readonly TelemetrySink[];
  /** Where the ledger lives, relative to `root`. */
  readonly ledgerPath?: string;
  /** How many paths this session changed; injected so the suite owns git too. */
  readonly changedPaths?: () => number;
  /** The HEAD the session started on, captured at `session_start`. */
  readonly sessionStartSha?: () => string;
  readonly now?: () => number;
  readonly date?: () => string;
  readonly source?: string;
}

export interface TelemetryWiring {
  /** Note a dispatched command, so the session knows which unit it is working on. */
  noteCommand(command: string, args: readonly string[]): void;
  register(pi: PiLike): void;
}

const DEFAULT_LEDGER = "docs/workflow/TIER_COST.md";

/** `git` in the project, or `""` when the project is not a repository. */
function git(root: string, args: string[]): string {
  try {
    return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
  } catch {
    return "";
  }
}

/**
 * How many distinct paths this session touched: the commits since the HEAD it
 * started on, plus whatever is still uncommitted. It is the session's own scope —
 * not the branch's — because the sample is the session's cost, and a long-lived
 * branch would otherwise be charged to whichever unit happened to end it.
 */
export function sessionChangedPaths(root: string, startSha: string): number {
  const paths = new Set<string>();
  for (const line of git(root, ["diff", "--name-only", `${startSha}..HEAD`]).split("\n")) {
    if (line.trim()) paths.add(line.trim());
  }
  for (const line of git(root, ["status", "--porcelain=v1"]).split("\n")) {
    const path = line.slice(3).trim();
    if (path) paths.add(path);
  }
  return paths.size;
}

/**
 * Build the wiring. Everything it cannot know is injected: the project root, the
 * sinks, the clock, the path count and the session's starting commit.
 */
export function createTelemetryWiring(options: TelemetryWiringOptions): TelemetryWiring {
  const sinks = options.sinks ?? [createLedgerSink({ ledgerPath: options.ledgerPath ?? `${options.root}/${DEFAULT_LEDGER}` })];
  const now = options.now ?? Date.now;
  const date = options.date ?? (() => new Date(now()).toISOString().slice(0, 10));
  const startSha = options.sessionStartSha ?? (() => git(options.root, ["rev-parse", "HEAD"]).trim());
  let start = "";
  const changedPaths = options.changedPaths ?? (() => sessionChangedPaths(options.root, start || "HEAD"));

  let unit: string | null = null;
  let accumulator: ReturnType<typeof createSessionTelemetry> | null = null;

  function build(): ReturnType<typeof createSessionTelemetry> | null {
    if (unit === null) return null;
    start = startSha();
    return createSessionTelemetry({
      enabled: true,
      unit,
      tier: "standard",
      changedPaths: changedPaths(),
      sinks,
      now,
      date,
      source: options.source ?? "pi:session",
    });
  }

  return {
    noteCommand(command, args) {
      if (!options.enabled) return;
      const resolved = unitFromCommand(options.root, command, args);
      if (resolved === null) return;
      unit = resolved;
      // A second command in the same session keeps the first unit it named: the
      // sample belongs to the work the session actually did, and re-pointing it
      // mid-session would attribute the tokens to the last thing typed.
      accumulator ??= build();
    },

    register(pi) {
      if (!options.enabled) return;
      pi.on("session_start", () => {
        accumulator ??= build();
      });
      pi.on("turn_start", (event) => accumulator?.onTurnStart((event ?? {}) as { timestamp?: number }));
      pi.on("turn_end", (event) => accumulator?.onTurnEnd((event ?? {}) as { message?: { usage?: Record<string, number> } }));
      pi.on("tool_execution_end", (event) => accumulator?.onToolEnd((event ?? {}) as { durationMs?: number }));
      pi.on("session_shutdown", () => {
        accumulator?.flush();
      });
    },
  };
}
