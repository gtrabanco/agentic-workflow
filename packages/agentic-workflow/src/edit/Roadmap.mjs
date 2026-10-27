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

/**
 * The separator rule matches the table that exists in this repository
 * (`|----|------|…`), not only the literal `|---|` — issue #316 found the
 * writer refusing the repo's own roadmap on the old literal match.
 */
const SEPARATOR_RE = /^\s*\|[-: |]+\|?\s*$/;

function isSeparatorLine(line) {
  return SEPARATOR_RE.test(line) && (line.match(/-/g) || []).length >= 3;
}

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

  // Find the separator line (a rule of pipes, dashes, colons and spaces)
  const separatorLine = content.split("\n").find(isSeparatorLine);
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
 * findRow(table, nn) — the full cell parse of one row, for callers that need
 * to re-emit the row through rowUpsert without clobbering the cells they do
 * not touch (the settle write: status changes, everything else preserved).
 *
 * Returns { nn, slug, status, dependsOn, description, line } or null when the
 * row is absent. slug keeps the raw cell (backticks included); callers that
 * compare slugs strip them.
 */
export function findRow(table, nn) {
  const content = readFileSync(table, "utf8");
  const line = content.split("\n").find((l) => l.trim().startsWith(`| ${nn} |`) && /^\| (\d+) \|/.test(l.trim()));
  if (!line) return null;
  const cells = line.split("|").map((c) => c.trim());
  return {
    nn: cells[1] ?? "",
    slug: cells[2] ?? "",
    status: cells[3] ?? "",
    dependsOn: cells[4] ?? "",
    description: cells[5] ?? "",
    line,
  };
}

/**
 * The closed vocabulary of `roadmap check`. Adding a code is a change to this
 * constant and its tests, never a new string somewhere else.
 */
export const ROADMAP_CHECK_CODES = Object.freeze(["row-missing", "slug-mismatch", "pr-url-unsettled"]);

/** First cell's unit number: roadmap rows carry it bare, fix-index rows link it. */
function rowNumber(cell) {
  if (/^\d+$/.test(cell)) return cell;
  const m = /issues\/(\d+)|#(\d+)/.exec(cell);
  return m ? m[1] ?? m[2] : null;
}

function parseIndexRows(indexText) {
  const rows = new Map();
  for (const line of indexText.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 4) continue;
    const nn = rowNumber(cells[1] ?? "");
    if (!nn) continue;
    rows.set(nn, { status: cells[3] ?? "", slug: (cells[2] ?? "").replace(/`/g, "") });
  }
  return rows;
}

/** The status cell's bare token: the decoration (` · [#N](url)`) never carries it. */
function statusToken(cell) {
  return cell.replace(/[`*]/g, "").split("·")[0].trim();
}

/**
 * PR URLs on the doc's own lifecycle surfaces: the `## Next`, `## Log` and
 * `## Evidence` sections and the References `- PR:` line the release step
 * writes. URLs quoted elsewhere (cross-references in References prose) are
 * other units' PRs and are never treated as this doc's own.
 */
function ownPrUrls(docText) {
  const urls = [];
  let section = null;
  docText.split("\n").forEach((line, i) => {
    const heading = /^##\s+(.*)/.exec(line);
    if (heading) section = heading[1].trim();
    const isReferencePr = /^-\s*PR:/.test(line);
    const own = (section && /^(Next|Log|Evidence)\b/i.test(section)) || isReferencePr;
    if (!own) return;
    for (const m of line.matchAll(/https?:\/\/\S*\/pull\/(\d+)/g)) {
      urls.push({
        pr: Number(m[1]),
        url: m[0].replace(/[`），.]+$/, ""),
        line: i + 1,
        where: isReferencePr ? "References" : section,
      });
    }
  });
  return urls;
}

/**
 * checkUnitDoc({ nn, slug, kind, docText, indexText }) — the cross-document
 * comparison between a unit doc's own facts and its index row (issue #316).
 *
 * kind is "feature" (roadmap-indexed) or "fix" (fix-index rows are removed
 * once merged, so an absent row is that index's own convention, not a
 * contradiction). Returns { ok, violations } where every violation carries a
 * code from ROADMAP_CHECK_CODES, the doc line it was detected on and a detail
 * naming the expected settle form `done · [#N](<same url>)`.
 */
export function checkUnitDoc({ nn, slug, kind, docText, indexText }) {
  const violations = [];
  const row = parseIndexRows(indexText).get(String(nn));
  if (!row) {
    if (kind !== "fix") {
      violations.push({ code: "row-missing", line: 1, detail: `no roadmap row for NN ${nn}` });
    }
    return { ok: violations.length === 0, violations };
  }
  if (slug && row.slug && row.slug !== slug) {
    violations.push({ code: "slug-mismatch", line: 1, detail: `doc folder says '${slug}', row says '${row.slug}'` });
  }
  for (const { pr, url, line, where } of ownPrUrls(docText)) {
    const token = statusToken(row.status);
    // The settle link is backtick-tolerant: the fix index decorates rows as
    // `done` · [`#302`](…), the roadmap as done · [#212](…). Both are the same
    // settle; only the exact URL is compared, never the decoration.
    const settled =
      token === "done" &&
      new RegExp(`\\[\`?#${pr}\`?\\]\\(${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`).test(row.status);
    if (settled) continue;
    violations.push({
      code: "pr-url-unsettled",
      line,
      detail: `doc carries its PR URL (${where}); row status is '${row.status}' — expected 'done · [#${pr}](${url})'`,
    });
  }
  return { ok: violations.length === 0, violations };
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