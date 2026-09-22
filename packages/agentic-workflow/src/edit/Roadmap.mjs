/**
 * Roadmap — row upsert and annotation for the roadmap table.
 *
 * The roadmap table uses pipe-delimited columns:
 *   | NN | slug | status | depends-on | description |
 *
 * Operations validate post-state against the schema and emit receipts.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

// ── Helpers ──────────────────────────────────────────────────────────────

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function shaPrefix(hex) {
  return hex.slice(0, 8);
}

function makeReceipt(service, op, path, schema, before, after, ok) {
  return { service, op, path, schema, before, after, ok };
}

function atomicWrite(targetPath, content) {
  writeFileSync(targetPath, content, "utf8");
  return targetPath;
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * rowUpsert(table, { nn, slug, status, dependsOn, description })
 * Upserts a row by NN (the first column).  If the NN already exists,
 * the row is updated in place.  Otherwise a new row is inserted after
 * the header.  Keeps the | NN | pipe format and column count.
 * Never invents issue links — a link is passed in explicitly.
 *
 * table is the absolute path to the roadmap Markdown file (e.g. ROADMAP.md).
 * nn is the issue number as a string (e.g. "61").
 * slug, status, dependsOn, description are the cell values.
 *
 * Returns a receipt.
 */
export function rowUpsert(table, { nn, slug, status, dependsOn, description }) {
  const content = readFileSync(table, "utf8");
  const beforeHash = sha256(content);

  // Find the header line (contains "| NN |")
  const headerLine = content.split("\n").find((l) => l.includes("| NN |"));
  if (!headerLine) {
    throw new Error("Roadmap table header not found (expected line with | NN |)");
  }

  // Find the separator line (contains "|---|")
  const separatorLine = content.split("\n").find((l) => l.includes("|---|"));
  if (!separatorLine) {
    throw new Error("Roadmap table separator not found (expected line with |---|)");
  }

  // Find existing row for this NN
  const lines = content.split("\n");
  const existingRowIdx = lines.findIndex((l) => {
    // Match | NN | at the start of a data row (after header and separator)
    return /^\| (\d+) \|/.test(l) && l.trim().startsWith(`| ${nn} |`);
  });

  const newRow = `| ${nn} | ${slug || ""} | ${status || ""} | ${dependsOn || ""} | ${description || ""} |`;

  let newContent;
  if (existingRowIdx !== -1) {
    // Update existing row
    lines[existingRowIdx] = newRow;
    newContent = lines.join("\n");
  } else {
    // Insert new row after the separator
    const sepIdx = lines.indexOf(separatorLine);
    lines.splice(sepIdx + 1, 0, newRow);
    newContent = lines.join("\n");
  }

  atomicWrite(table, newContent);
  const afterHash = sha256(readFileSync(table, "utf8"));

  // Validate: check column count by counting pipe separators
  const dataLine = newContent.split("\n").find((l) => /^\| (\d+) \|/.test(l) && l.trim().startsWith(`| ${nn} |`));
  // A 5-column table row has 6 pipe characters (including leading and trailing)
  const pipeCount = dataLine ? (dataLine.match(/\|/g) || []).length : 0;
  const ok = pipeCount >= 6;

  return makeReceipt(
    "roadmap",
    "rowUpsert",
    table,
    "roadmap-table@1",
    shaPrefix(beforeHash),
    shaPrefix(afterHash),
    ok,
  );
}

/**
 * annotate(nn, note) — appends a note to the description cell of the row
 * identified by nn.  The note is appended with a newline and "—" prefix.
 *
 * Returns a receipt.  Throws if the row is not found.
 */
export function annotate(table, nn, note) {
  const content = readFileSync(table, "utf8");
  const beforeHash = sha256(content);
  const lines = content.split("\n");

  const existingRowIdx = lines.findIndex((l) => {
    return /^\| (\d+) \|/.test(l) && l.trim().startsWith(`| ${nn} |`);
  });

  if (existingRowIdx === -1) {
    throw new Error(`Roadmap row for NN ${nn} not found`);
  }

  // Parse the existing row and append to the description (5th column, 0-indexed: 4)
  const parts = lines[existingRowIdx].split("|").map((p) => p.trim());
  parts[5] = (parts[5] || "").trim() + "\n— " + note.trim();
  const newRow = parts.map((p, i) => (i === 0 || i === parts.length - 1 ? p : " " + p + " ")).join("|");

  lines[existingRowIdx] = newRow;
  const newContent = lines.join("\n");

  atomicWrite(table, newContent);
  const afterHash = sha256(readFileSync(table, "utf8"));

  return makeReceipt(
    "roadmap",
    "annotate",
    table,
    "roadmap-table@1",
    shaPrefix(beforeHash),
    shaPrefix(afterHash),
    true,
  );
}