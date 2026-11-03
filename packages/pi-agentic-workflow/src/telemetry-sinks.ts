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
 * no grammar block, when the sample and the declared columns disagree, or when
 * the table's header is not the declared set. The accumulator catches a sink
 * failure so one broken destination never costs the others their sample.
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
      // column the sample cannot fill is a refusal; a sample field the ledger does
      // not store (the tier, which the reader derives) is simply not written.
      const missing = declared.filter((column) => !(column in values));
      if (missing.length > 0) throw new Error(`the sample carries no value for: ${missing.join(", ")}`);

      const headerAt = lines.findIndex((line, index) => index > fenceEnd && line.trim().startsWith("|"));
      if (headerAt === -1) throw new Error(`${ledgerPath}: no sample table after the ${MARKER} block`);
      if (cellsOf(lines[headerAt]).join("|") !== declared.join("|")) {
        throw new Error(`${ledgerPath}: the sample table's header is not the declared columns`);
      }

      let lastRow = headerAt + 1;
      while (lastRow + 1 < lines.length && lines[lastRow + 1].trim().startsWith("|")) lastRow += 1;

      // One row per sample: a second shutdown for the same session appends nothing.
      for (let index = headerAt + 2; index <= lastRow; index += 1) {
        const cells = cellsOf(lines[index]);
        const row = Object.fromEntries(declared.map((column, at) => [column, cells[at] ?? ""]));
        if (row.unit === String(values.unit) && row.source === String(values.source) && row.observed === String(values.observed)) return;
      }

      lines.splice(lastRow + 1, 0, `| ${declared.map((column) => String(values[column])).join(" | ")} |`);
      fs.writeFileSync(ledgerPath, lines.join("\n"));
    },
  };
}
