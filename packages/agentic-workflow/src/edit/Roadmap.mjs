/**
 * Roadmap — row upsert and annotation for the roadmap table.
 *
 * The roadmap table uses pipe-delimited columns:
 *   | NN | slug | status | depends-on | description |
 *
 * Operations validate post-state against the schema and emit receipts.
 *
 * Since issue #498 every write goes through the shared writer driver
 * (`src/writer/driver.mjs`): a key-based **splice** — only the target row's
 * byte range moves, every other byte is carried through — with optional
 * **CAS**: `expected` (the `revision` a `readShared` answered) refuses with a
 * named `stale-read` rejection instead of last-write-wins. Receipts keep
 * their published shape (`service/op/path/schema/before/after/ok`, 8-char
 * hashes); `fixRowUpsert` adds the missing writer for the `## Fixes` table
 * (4 columns, keyed by the issue link's number).
 */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { roadmapTableRows, ROADMAP_FIXES_HEADING } from "../index-document.mjs";
import { writeShared, WriterError } from "../writer/driver.mjs";

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

/**
 * Throw a writer refusal as a typed WriterError whose message is the refusal's
 * own detail — the exact text the pre-driver writers threw, so the CLI's
 * `EDIT REFUSAL — <message>` output is unchanged.
 */
function throwRefusal(result) {
  const error = new WriterError(result.reason, result);
  error.message = result.detail ?? result.reason;
  throw error;
}

/**
 * Walk the line starts of `content` once: offsets[i] is the character index
 * of lines[i] inside content — the map a splice edit needs to name a line's
 * byte range without touching any other byte.
 */
function lineOffsets(content) {
  const lines = content.split("\n");
  const offsets = new Array(lines.length);
  let cursor = 0;
  for (let i = 0; i < lines.length; i += 1) {
    offsets[i] = cursor;
    cursor += lines[i].length + 1;
  }
  return { lines, offsets, total: content.length };
}

/**
 * A row insert after `sepIdx` as one splice edit, newline-safe: after the
 * separator's own newline when there is one, or appended to the document
 * (with its leading newline) when the separator is the last line.
 */
function insertAfterLineEdit(lines, offsets, total, sepIdx, replacement) {
  const afterNewline = offsets[sepIdx] + lines[sepIdx].length + 1;
  if (sepIdx === lines.length - 1 && afterNewline > total) {
    return { start: total, end: total, replacement: `\n${replacement}` };
  }
  return { start: afterNewline, end: afterNewline, replacement: `${replacement}\n` };
}

/** The splice declaration for `rowUpsert`: locate the row (or the insert
 * position) and declare that one range — never the whole content. */
function rowUpsertEdits(content, { nn, slug, status, dependsOn, description }) {
  const { lines, offsets, total } = lineOffsets(content);

  const headerIdx = lines.findIndex((l) => l.includes("| NN |"));
  if (headerIdx === -1) {
    return { ok: false, reason: "invalid-document", detail: "Roadmap table header not found (expected line with | NN |)" };
  }
  const sepIdx = lines.findIndex(isSeparatorLine);
  if (sepIdx === -1) {
    return { ok: false, reason: "invalid-document", detail: "Roadmap table separator not found (expected line with |---|)" };
  }

  const existingRowIdx = lines.findIndex((l) => {
    return /^\| (\d+) \|/.test(l) && l.trim().startsWith(`| ${nn} |`);
  });

  const newRow = `| ${nn} | ${slug || ""} | ${status || ""} | ${dependsOn || ""} | ${description || ""} |`;

  if (existingRowIdx !== -1) {
    return {
      ok: true,
      edits: [{ start: offsets[existingRowIdx], end: offsets[existingRowIdx] + lines[existingRowIdx].length, replacement: newRow }],
    };
  }
  return { ok: true, edits: [insertAfterLineEdit(lines, offsets, total, sepIdx, newRow)] };
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
export function rowUpsert(table, { nn, slug, status, dependsOn, description, expected }) {
  const result = writeShared({ path: table, expected, apply: (content) => rowUpsertEdits(content, { nn, slug, status, dependsOn, description }) });
  if (!result.ok) throwRefusal(result);

  // Validate: check column count by counting pipe separators
  const content = readFileSync(table, "utf8");
  const dataLine = content.split("\n").find((l) => /^\| (\d+) \|/.test(l) && l.trim().startsWith(`| ${nn} |`));
  // A 5-column table row has 6 pipe characters (including leading and trailing)
  const pipeCount = dataLine ? (dataLine.match(/\|/g) || []).length : 0;
  const ok = pipeCount >= 6;

  return makeReceipt(
    "roadmap",
    "rowUpsert",
    table,
    "roadmap-table@1",
    shaPrefix(result.before),
    shaPrefix(result.after),
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

/**
 * The index rows of one kind, keyed by unit number. Scoped through
 * `roadmapTableRows` so a consolidated document (issue #319) never answers a
 * fix check with a feature row of the same number, while a pre-319 document or
 * a caller-supplied fragment keeps its single-table meaning.
 */
function parseIndexRows(indexText, kind) {
  const rows = new Map();
  for (const cells of roadmapTableRows(indexText, kind === "fix" ? "fix" : "feature")) {
    if (cells.length < 3) continue;
    const nn = rowNumber(cells[0] ?? "");
    if (!nn) continue;
    rows.set(nn, { status: cells[2] ?? "", slug: (cells[1] ?? "").replace(/`/g, "") });
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
  const row = parseIndexRows(indexText, kind).get(String(nn));
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
 * annotate(nn, note, { expected }) — appends a note to the description cell of the row
 * identified by nn.  The note is appended on the same physical line, with a
 * space and "—" prefix: a newline inside a cell terminates the row, and a
 * renderer turns its tail into a malformed extra row (the 2026-11-09 unit-227
 * damage to this repository's index). The write is a one-line splice through
 * the shared writer driver; `expected` (the revision a `readShared` answered)
 * closes the CAS loop — a moved table refuses with `stale-read`.
 *
 * Returns a receipt.  Throws if the row is not found.
 */
export function annotate(table, nn, note, { expected } = {}) {
  const result = writeShared({
    path: table,
    expected,
    apply: (content) => {
      const { lines, offsets } = lineOffsets(content);
      const existingRowIdx = lines.findIndex((l) => {
        return /^\| (\d+) \|/.test(l) && l.trim().startsWith(`| ${nn} |`);
      });
      if (existingRowIdx === -1) {
        return { ok: false, reason: "invalid-document", detail: `Roadmap row for NN ${nn} not found` };
      }
      // Parse the existing row and append to the description (5th column, 0-indexed: 4)
      const parts = lines[existingRowIdx].split("|").map((p) => p.trim());
      const annotation = `— ${note.trim()}`;
      parts[5] = [(parts[5] || "").trim(), annotation].filter(Boolean).join(" ");
      const newRow = parts.map((p, i) => (i === 0 || i === parts.length - 1 ? p : " " + p + " ")).join("|");
      return {
        ok: true,
        edits: [{ start: offsets[existingRowIdx], end: offsets[existingRowIdx] + lines[existingRowIdx].length, replacement: newRow }],
      };
    },
  });
  if (!result.ok) throwRefusal(result);

  return makeReceipt(
    "roadmap",
    "annotate",
    table,
    "roadmap-table@1",
    shaPrefix(result.before),
    shaPrefix(result.after),
    true,
  );
}

/** The Fixes-table row key: the issue number inside the leading `[#N](url)`
 * link cell (a bare `| N |` first cell is accepted for link-less rows). */
function fixRowKey(line) {
  const linked = /^\|\s*\[#(\d+)\]/.exec(line);
  if (linked) return linked[1];
  const bare = /^\|\s*(\d+)\s*\|/.exec(line);
  return bare ? bare[1] : null;
}

/** The splice declaration for `fixRowUpsert`: scope the `## Fixes` table, key
 * the row by issue number, declare one range. */
function fixRowUpsertEdits(content, { issue, url, topic, status, notes }) {
  const { lines, offsets, total } = lineOffsets(content);
  const fixesIdx = lines.findIndex((l) => l.trim() === `## ${ROADMAP_FIXES_HEADING}`);
  if (fixesIdx === -1) {
    return { ok: false, reason: "invalid-document", detail: `Roadmap Fixes table not found (expected '## ${ROADMAP_FIXES_HEADING}')` };
  }
  const headerIdx = lines.findIndex((l, i) => i > fixesIdx && /^\|\s*Issue\s*\|/.test(l.trim()));
  if (headerIdx === -1 || headerIdx < fixesIdx) {
    return { ok: false, reason: "invalid-document", detail: `Roadmap Fixes table not found (expected an | Issue | table under '## ${ROADMAP_FIXES_HEADING}')` };
  }
  const sepIdx = lines.findIndex((l, i) => i > headerIdx && isSeparatorLine(l));
  if (sepIdx === -1) {
    return { ok: false, reason: "invalid-document", detail: "Roadmap Fixes table separator not found (expected line with |---|)" };
  }

  const newRow = `| [#${issue}](${url || ""}) | ${topic || ""} | ${status || ""} | ${notes || ""} |`;
  for (let i = sepIdx + 1; i < lines.length && lines[i].startsWith("|"); i += 1) {
    if (fixRowKey(lines[i]) === String(issue)) {
      return { ok: true, edits: [{ start: offsets[i], end: offsets[i] + lines[i].length, replacement: newRow }] };
    }
  }
  return { ok: true, edits: [insertAfterLineEdit(lines, offsets, total, sepIdx, newRow)] };
}

/**
 * fixRowUpsert(table, { issue, url, topic, status, notes, expected }) — the
 * writer for the `## Fixes` table (issue #498: the rows RELEASE.md said were
 * edited by hand because "no `NN` column, so `rowUpsert` does not apply"). The
 * row is keyed by the issue number in the leading `[#N](url)` cell; the link
 * is passed in explicitly — the writer never invents issue links. Upserts:
 * an existing row is updated in place, a new one inserts after the table's
 * separator. The write is a one-line splice; `expected` closes the CAS loop.
 *
 * Returns a receipt. Throws a WriterError when the `## Fixes` table is absent
 * or malformed.
 */
export function fixRowUpsert(table, { issue, url, topic, status, notes, expected }) {
  const result = writeShared({ path: table, expected, apply: (content) => fixRowUpsertEdits(content, { issue, url, topic, status, notes }) });
  if (!result.ok) throwRefusal(result);

  const content = readFileSync(table, "utf8");
  const dataLine = content.split("\n").find((l) => fixRowKey(l) === String(issue) && l.includes(`[#${issue}]`));
  const pipeCount = dataLine ? (dataLine.match(/\|/g) || []).length : 0;
  const ok = pipeCount >= 5;

  return makeReceipt(
    "roadmap",
    "fixRowUpsert",
    table,
    "roadmap-table@1",
    shaPrefix(result.before),
    shaPrefix(result.after),
    ok,
  );
}