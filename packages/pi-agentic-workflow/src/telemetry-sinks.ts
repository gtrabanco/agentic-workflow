/**
 * telemetry-sinks.ts — where a session sample goes (issue #383 S3/S4b).
 *
 * The accumulator (`session-telemetry.ts`) measures; a sink delivers. This module
 * ships the one sink this unit needs — the repository's `tier-cost@1` ledger —
 * and the interface it implements is what `#394` plugs its log writer into.
 *
 * The sink never owns the grammar: it reads the ledger's declared columns and
 * writes the sample in *that* order, refusing when the two disagree in either
 * direction. A column list copied into this file would be a second grammar, and
 * the round-trip test exists to catch exactly that.
 */

import fs from "node:fs";
import type { TelemetrySample, TelemetrySink } from "./session-telemetry.js";

export interface LedgerSinkOptions {
  /** The absolute path of the `tier-cost@1` ledger this sink appends to. */
  readonly ledgerPath: string;
  /** How long a writer waits for another writer's lock before reporting the loss. */
  readonly lockTimeoutMs?: number;
  /** A lock older than this belongs to a writer that is gone. */
  readonly lockStaleMs?: number;
}

/** Default wait before a blocked writer reports the lost row. */
export const LOCK_TIMEOUT_MS = 1_000;

/** Default age past which a lock is assumed abandoned. */
export const LOCK_STALE_MS = 10_000;

/** The contract id the ledger's grammar block opens with. */
const MARKER = "tier-cost@1";

/** A bounded synchronous wait: the sink runs inside a shutdown, so nothing is async. */
function sleepSync(ms: number): void {
  if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** The trimmed cells of one markdown table row. */
function cellsOf(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

/**
 * Append one sample inside an exclusive lock.
 *
 * Two sessions of one project append on their own shutdowns, and a plain
 * read-modify-write loses whichever row was read first. The lock is a file next
 * to the ledger created with `wx`, which is atomic on every platform this ships
 * on; a writer that cannot take it in time reports the loss instead of
 * rewriting the table from a stale read, and one left behind by a dead writer is
 * taken over rather than waited on forever.
 */
export function createLedgerSink(options: LedgerSinkOptions): TelemetrySink {
  const { ledgerPath } = options;
  const timeoutMs = options.lockTimeoutMs ?? LOCK_TIMEOUT_MS;
  const staleMs = options.lockStaleMs ?? LOCK_STALE_MS;
  const lockPath = `${ledgerPath}.lock`;

  /** Run `write` while holding the lock, releasing it on every exit. */
  function locked<T>(run: () => T): T {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      try {
        fs.closeSync(fs.openSync(lockPath, "wx"));
        break;
      } catch (error) {
        if ((error as { code?: string }).code !== "EEXIST") throw error;
        try {
          if (Date.now() - fs.statSync(lockPath).mtimeMs > staleMs) {
            fs.rmSync(lockPath, { force: true });
            continue;
          }
        } catch {
          continue; // released between the open and the stat
        }
        if (Date.now() >= deadline) throw new Error(`${ledgerPath}: the ledger stayed locked for ${timeoutMs} ms`);
        sleepSync(5);
      }
    }
    try {
      return run();
    } finally {
      fs.rmSync(lockPath, { force: true });
    }
  }

  return {
    name: "tier-cost-ledger",
    write(sample: TelemetrySample): void {
      locked(() => {
        const text = fs.readFileSync(ledgerPath, "utf8");
        const lines = text.split("\n");

        const markerAt = lines.findIndex((line) => line.trim() === MARKER);
        if (markerAt === -1) throw new Error(`${ledgerPath} carries no ${MARKER} block`);

        const fenceEnd = lines.findIndex((line, index) => index > markerAt && line.trim().startsWith("```"));
        if (fenceEnd === -1) throw new Error(`${ledgerPath}: the ${MARKER} block is not closed`);

        const declared: string[] = [];
        for (const line of lines.slice(markerAt + 1, fenceEnd)) {
          if (line.trim() === "" || line.trim().startsWith("column |")) continue;
          const [column] = cellsOf(line);
          if (column) declared.push(column);
        }

        const values = sample as unknown as Record<string, unknown>;
        // The ledger owns the column list; the sample owns the values. A declared
        // column the sample cannot fill is a refusal; a sample field the ledger
        // does not store (the tier, which the reader derives) is not written.
        const missing = declared.filter((column) => !(column in values));
        if (missing.length > 0) throw new Error(`the sample carries no value for: ${missing.join(", ")}`);

        const headerAt = lines.findIndex((line, index) => index > fenceEnd && line.trim().startsWith("|"));
        if (headerAt === -1) throw new Error(`${ledgerPath}: no sample table after the ${MARKER} block`);
        if (cellsOf(lines[headerAt]).join("|") !== declared.join("|")) {
          throw new Error(`${ledgerPath}: the sample table's header is not the declared columns`);
        }

        let lastRow = headerAt + 1;
        while (lastRow + 1 < lines.length && lines[lastRow + 1].trim().startsWith("|")) lastRow += 1;

        // One row per sample: the guard compares the whole row, because the row
        // is what a sample is. Keying it on a few cells (unit, source, day) would
        // swallow a second session of the same unit — the exact case the ledger
        // exists to record — while an identical row is a re-emission, not a sample.
        for (let index = headerAt + 2; index <= lastRow; index += 1) {
          const cells = cellsOf(lines[index]);
          if (declared.every((column, at) => (cells[at] ?? "") === String(values[column]))) return;
        }

        lines.splice(lastRow + 1, 0, `| ${declared.map((column) => String(values[column])).join(" | ")} |`);
        fs.writeFileSync(ledgerPath, lines.join("\n"));
      });
    },
  };
}
