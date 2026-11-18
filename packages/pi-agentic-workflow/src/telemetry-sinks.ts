/**
 * telemetry-sinks.ts — where a session sample goes (issue #383 S3/S4b).
 *
 * The accumulator (`session-telemetry.ts`) measures; a sink delivers. This module
 * ships the sinks a sample needs — the project's ledger (whichever `tier-cost@N`
 * grammar its block declares) and, since #504, the per-session JSONL — and the
 * interface it implements is what `#394` plugs its log writer into.
 *
 * The sink never owns the grammar: it reads the ledger's declared columns and
 * writes the sample in *that* order, refusing when the two disagree in either
 * direction. A column list copied into this file would be a second grammar, and
 * the round-trip test exists to catch exactly that.
 *
 * Two sessions of one project write on their own boundaries, and Pi runs them in
 * separate processes. A sample whose `source` has no row appends one line with
 * `O_APPEND`, which the kernel places atomically: no lock, no queue, no lost row,
 * and every byte already in the ledger stays where it is. That is also the one
 * shape this sink accepts — the samples table has to be the file's last section,
 * because a row appended after trailing prose would land outside the table.
 *
 * Since #623 S6 the ledger keeps one row per session: a settled session emits its
 * cumulative sample once per run, so the same `source` arrives more than once. A
 * later emission for a `source` the ledger already carries replaces that row
 * through a staged write and an atomic rename — the row belongs to that session
 * alone, nothing else moves, and the document's prose and column order are never
 * rewritten. A ledger that declares no `source` column has no identity to upsert
 * on, so it keeps the append contract rather than inventing a key.
 *
 * #504 added the second destination (#504 S3): the same sample as one JSON
 * object per line, for a consumer that streams rather than reads a document. It
 * is the same append contract — one `O_APPEND` per line, no lock, nothing
 * rewritten — and the same field order, taken from the schema package's
 * published list so a line and a ledger row cannot disagree about what a sample
 * carries.
 */

import fs from "node:fs";
import path from "node:path";

import { TELEMETRY_SAMPLE_FIELDS } from "@gtrabanco/agentic-workflow-schema";

import type { TelemetrySample, TelemetrySink } from "./session-telemetry.js";

export interface LedgerSinkOptions {
  /** The absolute path of the ledger this sink appends to — any declared `tier-cost@N` grammar. */
  readonly ledgerPath: string;
}

/**
 * The line that declares the ledger's grammar. The sink does not own the
 * version: it reads whatever `tier-cost@N` block the file carries, validates the
 * columns it declares against the published sample fields, and writes them in
 * that order — which is what lets a project still on `@1` keep appending eight
 * cells while a `@2` project appends sixteen.
 */
const MARKER = /^tier-cost@\d+$/;

/** The trimmed cells of one markdown table row. */
function cellsOf(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

/**
 * A sink that appends one row to the project's ledger (any declared `tier-cost@N`
 * grammar), in the order the ledger declares, once per sample.
 *
 * It throws — rather than writing something plausible — when the ledger carries
 * no grammar block, when the sample and the declared columns disagree, when the
 * table's header is not the declared set, or when the table is not the file's
 * last section. The accumulator catches a sink failure so one broken destination
 * never costs the others their sample.
 *
 * Its idempotency guard spans both shapes: an identical row is a re-emission and
 * is dropped, a `source` the ledger already carries is the same session and is
 * replaced, and a different sample never is.
 */
export function createLedgerSink(options: LedgerSinkOptions): TelemetrySink {
  const { ledgerPath } = options;
  return {
    name: "tier-cost-ledger",
    write(sample: TelemetrySample): void {
      const text = fs.readFileSync(ledgerPath, "utf8");
      const lines = text.split("\n");

      const markerAt = lines.findIndex((line) => MARKER.test(line.trim()));
      if (markerAt === -1) throw new Error(`${ledgerPath} carries no tier-cost@N block`);

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
      // column that is not a published sample field is a grammar the sample
      // cannot satisfy, and one the sample cannot fill is a producer defect:
      // both are refusals, never a row written blind.
      const unpublished = declared.filter((column) => !(TELEMETRY_SAMPLE_FIELDS as readonly string[]).includes(column));
      if (unpublished.length > 0) throw new Error(`${ledgerPath} declares columns no sample carries: ${unpublished.join(", ")}`);
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

      // One row per sample: an identical row is a re-emission, and a row whose
      // `source` matches is this very session's earlier emission — the ledger
      // keeps one row per session, whatever its row count per run (#623 S6).
      const row = `| ${declared.map((column) => String(values[column])).join(" | ")} |`;
      const dataRows: number[] = [];
      for (let at = headerAt + 2; at < lines.length; at += 1) {
        if (!lines[at].trim().startsWith("|")) break;
        dataRows.push(at);
      }
      const identical = (at: number): boolean => {
        const cells = cellsOf(lines[at]);
        return declared.every((column, index) => (cells[index] ?? "") === String(values[column]));
      };
      if (dataRows.some(identical)) return;

      const sourceAt = declared.indexOf("source");
      const sameSource = sourceAt === -1 ? undefined : dataRows.find((at) => (cellsOf(lines[at])[sourceAt] ?? "") === String(values.source));
      if (sameSource === undefined) {
        fs.appendFileSync(ledgerPath, `${row}\n`);
        return;
      }

      // The staged write + rename is a whole-file swap, so a reader never sees a
      // half-written ledger. The residual race — another process appending
      // between this read and the swap — costs that process its row in this
      // document; the JSONL stream still carries it, and the row this swap
      // replaces belongs to this session alone.
      lines[sameSource] = row;
      const staged = `${ledgerPath}.${process.pid}.tmp`;
      try {
        fs.writeFileSync(staged, lines.join("\n"));
        fs.renameSync(staged, ledgerPath);
      } finally {
        fs.rmSync(staged, { force: true });
      }
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
 * No duplicate guard of its own: the accumulator emits a value once (`emit()`
 * drops a re-emission and `flush()` is latched), so a repeated line would be a
 * repeated sample, not a re-emission to swallow. With #623 S6 the file carries
 * one line per settled run, cumulative, so a consumer differences consecutive
 * lines instead of reading one row per session.
 */
export function createJsonlSink(options: JsonlSinkOptions): TelemetrySink {
  const { path: file } = options;
  return {
    name: "jsonl",
    write(sample: TelemetrySample): void {
      const values = sample as unknown as Record<string, unknown>;
      const missing = TELEMETRY_SAMPLE_FIELDS.filter((field) => !(field in values));
      if (missing.length > 0) throw new Error(`the sample carries no value for: ${missing.join(", ")}`);
      const ordered: Record<string, unknown> = {};
      for (const field of TELEMETRY_SAMPLE_FIELDS) ordered[field] = values[field];
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.appendFileSync(file, `${JSON.stringify(ordered)}\n`);
    },
  };
}
