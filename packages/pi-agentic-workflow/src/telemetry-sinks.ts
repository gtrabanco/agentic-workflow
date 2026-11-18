/**
 * telemetry-sinks.ts — where a session sample goes (issue #383 S3/S4b).
 *
 * The accumulator (`session-telemetry.ts`) measures; a sink delivers. This module
 * ships the sinks a sample needs — the project's ledger (whichever `tier-cost@N`
 * grammar its block declares) and, since #504, the per-session JSONL — and the
 * interface it implements is what `#394` plugs its log writer into.
 *
 * The write itself moved to `@gtrabanco/agentic-workflow/src/telemetry/ledger.mjs`
 * (issue #624): the universal CLI appends the same reconstructed rows from a
 * manual reconciliation, a crate cannot import this package, and one grammar with
 * one owner beats two copies that drift. Both spells below are therefore thin:
 * they keep the Pi-facing interface and refuse nothing on their own — the shared
 * module owns the grammar checks, the atomic append and the duplicate guard.
 *
 * The sink never owns the grammar: it reads the ledger's declared columns and
 * writes the sample in *that* order, refusing when the two disagree in either
 * direction. A column list copied into this file would be a second grammar, and
 * the round-trip test exists to catch exactly that.
 */

import { appendJsonlSample, appendLedgerSample } from "@gtrabanco/agentic-workflow/src/telemetry/ledger.mjs";

import type { TelemetrySample, TelemetrySink } from "./session-telemetry.js";

export interface LedgerSinkOptions {
  /** The absolute path of the ledger this sink appends to — any declared `tier-cost@N` grammar. */
  readonly ledgerPath: string;
}

/**
 * A sink that appends one row to the project's ledger (any declared
 * `tier-cost@N` grammar), in the order the ledger declares, once per sample.
 *
 * It throws — rather than writing something plausible — when the ledger carries
 * no grammar block, when the sample and the declared columns disagree, when the
 * table's header is not the declared set, or when the table is not the file's
 * last section. The accumulator catches a sink failure so one broken destination
 * never costs the others their sample.
 *
 * Its idempotency guard compares a whole row: a repeated emission is dropped, a
 * different sample never is. The session identity that keeps two sessions apart
 * lives in the sample's `source`, not in a key invented here.
 */
export function createLedgerSink(options: LedgerSinkOptions): TelemetrySink {
  const { ledgerPath } = options;
  return {
    name: "tier-cost-ledger",
    write(sample: TelemetrySample): void {
      appendLedgerSample({ ledgerPath, sample });
    },
  };
}

export interface JsonlSinkOptions {
  /** The absolute path of the per-session JSONL file this sink appends to. */
  readonly path: string;
}

/**
 * A sink that appends one JSON object per line — the sample itself, in the
 * published field order (`TELEMETRY_SAMPLE_FIELDS`), with no wrapper and no
 * prose (#504 S3, S9).
 *
 * It refuses a sample that cannot fill every published field, rather than
 * writing a line a consumer would have to special-case: the fields are the
 * contract, and a missing one is a producer defect, not an absent value. The
 * directory is created on demand, so a project needs no `.pi` before its first
 * session; two sessions appending from separate processes each take their own
 * `O_APPEND`, which the kernel places atomically.
 *
 * No duplicate guard: a sample is emitted once per session by construction
 * (`flush()` emits once), so a repeated line would be a repeated sample, not a
 * re-emission to swallow.
 */
export function createJsonlSink(options: JsonlSinkOptions): TelemetrySink {
  const { path: file } = options;
  return {
    name: "jsonl",
    write(sample: TelemetrySample): void {
      appendJsonlSample({ path: file, sample });
    },
  };
}
