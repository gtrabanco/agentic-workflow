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
 *
 * Two sessions of one project append on their own shutdowns, and Pi runs them in
 * separate processes. The write is therefore a single `O_APPEND`, which the
 * kernel places atomically: no lock, no queue, no lost row, and every byte
 * already in the ledger stays where it is. That is also the one shape this sink
 * accepts — the samples table has to be the file's last section, because a row
 * appended after trailing prose would land outside the table.
 */

import fs from "node:fs";
import type { TelemetrySample, TelemetrySink } from "./session-telemetry.js";

export interface LedgerSinkOptions {
  /** The absolute path of the `tier-cost@1` ledger this sink appends to. */
  readonly ledgerPath: string;
}

/** The contract id the ledger's grammar block opens with. */
const MARKER = "tier-cost@1";

/** The trimmed cells of one markdown table row. */
function cellsOf(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

/**
 * A sink that appends one row to the `tier-cost@1` ledger, in the order the
 * ledger declares, once per sample.
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

      // An append is only safe where the table ends the file: a row written after
      // trailing prose would sit outside it, and the reader would stop before it.
      if (!text.endsWith("\n")) throw new Error(`${ledgerPath}: the ledger must end with a newline before a row can be appended`);
      const tail = text.slice(0, -1).split("\n").at(-1) ?? "";
      if (!tail.trim().startsWith("|")) {
        throw new Error(`${ledgerPath}: the samples table must be the ledger's last section, found ${JSON.stringify(tail)}`);
      }

      // One row per sample: the guard compares the whole row, because the row is
      // what a sample is. Keying it on a few cells (unit, source, day) would
      // swallow a second session of the same unit — the exact case the ledger
      // exists to record — while an identical row is a re-emission, not a sample.
      for (const line of lines.slice(headerAt + 2)) {
        if (!line.trim().startsWith("|")) break;
        const cells = cellsOf(line);
        if (declared.every((column, at) => (cells[at] ?? "") === String(values[column]))) return;
      }

      fs.appendFileSync(ledgerPath, `| ${declared.map((column) => String(values[column])).join(" | ")} |\n`);
    },
  };
}
