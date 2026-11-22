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
 * hashes); `fixRowUpsert` adds the missing writer for the `## Fixes` table, and
 * derives that table's own shape — its header words, its column count and the
 * column carrying the issue key — instead of matching one literal header, so a
 * project whose row shape differs is written, never asked to hand-edit its row.
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

/**
 * The line indexes of the rows keyed `nn`, scoped to the table the `| NN |`
 * header opens (every line when no header exists): one scope for the whole
 * NN-lookup family — upsert, read and annotate must never disagree, and a bare
 * `| N |` row under another header is a different key's row (issue #514 P12).
 */
function nnRowIndexes(lines, nn, headerIdx) {
  const matches = [];
  for (let i = headerIdx === -1 ? 0 : headerIdx; i < lines.length; i += 1) {
    if (headerIdx !== -1 && !/^\s*\|/.test(lines[i])) break;
    if (/^\| (\d+) \|/.test(lines[i]) && lines[i].trim().startsWith(`| ${nn} |`)) matches.push(i);
  }
  return matches;
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

  // NN-keyed matches, scoped by the shared helper — the header exists here
  // (refused above when absent), so the walk stops at the table's end.
  const matches = nnRowIndexes(lines, nn, headerIdx);

  const newRow = `| ${nn} | ${slug || ""} | ${status || ""} | ${dependsOn || ""} | ${description || ""} |`;

  if (matches.length > 1) {
    // Duplicate NN rows: every reader keeps the last (a Map keyed by NN is
    // overwritten in order), so the last row is the one that settles — the
    // earlier duplicates are unread state this upsert collapses away
    // (issue #514, external-verify 2026-11-15 blocker 1, D10). Each deletion
    // consumes the row's own newline; the survivor is spliced like any update.
    const keeper = matches[matches.length - 1];
    const edits = matches.slice(0, -1).map((i) => ({
      start: offsets[i],
      end: Math.min(offsets[i] + lines[i].length + 1, total),
      replacement: "",
    }));
    edits.push({ start: offsets[keeper], end: offsets[keeper] + lines[keeper].length, replacement: newRow });
    return { ok: true, edits };
  }
  if (matches.length === 1) {
    const existingRowIdx = matches[0];
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
 * the row is updated in place — and when the key carries duplicate rows,
 * the last one (the row every reader keeps) is updated while the earlier
 * duplicates are spliced out.  Otherwise a new row is inserted after
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
 * compare slugs strip them. When duplicates exist the last row answers — the
 * one `parseIndexRows` keeps (a Map keyed by NN, overwritten in order).
 */
export function findRow(table, nn) {
  const content = readFileSync(table, "utf8");
  const lines = content.split("\n");
  const matches = nnRowIndexes(lines, nn, lines.findIndex((l) => l.includes("| NN |")));
  const line = matches.length > 0 ? lines[matches[matches.length - 1]] : null;
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
      // The reader's row: last match wins — the same scope and rule `findRow`
      // answers by, so the note lands where every reader looks.
      const rowMatches = nnRowIndexes(lines, nn, lines.findIndex((l) => l.includes("| NN |")));
      const existingRowIdx = rowMatches.length > 0 ? rowMatches[rowMatches.length - 1] : -1;
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

/** Header words that name the Fixes table's issue-keyed cell. */
const FIX_ISSUE_HEADERS = Object.freeze(["issue", "issues", "#"]);

/** Header word → the writer argument whose value that column carries. */
const FIX_COLUMN_VALUES = Object.freeze({
  topic: "topic",
  summary: "topic",
  title: "topic",
  status: "status",
  notes: "notes",
  note: "notes",
});

/** A header cell as compared: emphasis and backticks dropped, case folded. */
function headerWord(cell) {
  return cell.replace(/[`*_]/g, "").trim().toLowerCase();
}

/** A row's cells between its outer pipes: `| a | b |` answers ["a", "b"]. */
function rowCells(line) {
  return line.split("|").slice(1, -1).map((cell) => cell.trim());
}

/** The issue number a Fixes cell keys: `[#N](url)` inside it, or the bare number. */
function issueKeyInCell(cell) {
  const linked = /\[#(\d+)\]/.exec(cell);
  if (linked) return linked[1];
  const bare = /^(\d+)$/.exec(cell.trim());
  return bare ? bare[1] : null;
}

/** The refusal every reader of the shape answers with. */
function shapeRefusal(detail) {
  return { ok: false, reason: "invalid-document", detail };
}

/**
 * Resolve a document's `## Fixes` table: its header cells (column count and
 * words), the column that carries the issue key, and the separator that opens
 * the rows. Every constraint a shape can miss is a refusal that names it — a
 * table that exists is never reported as missing (issue #684 extension, S4).
 */
function fixTableShape(content) {
  const { lines, offsets, total } = lineOffsets(content);
  const fixesIdx = lines.findIndex((l) => l.trim() === `## ${ROADMAP_FIXES_HEADING}`);
  if (fixesIdx === -1) {
    return shapeRefusal(`Roadmap Fixes table not found (expected '## ${ROADMAP_FIXES_HEADING}')`);
  }
  // The section ends at the next `#`/`##` heading: a `###` legend inside it is
  // prose about the table, not the end of the table (this repository's own
  // roadmap carries one between `## Fixes` and the header).
  const nextHeading = lines.findIndex((l, i) => i > fixesIdx && /^#{1,2}\s/.test(l));
  const end = nextHeading === -1 ? lines.length : nextHeading;
  const headerIdx = lines.findIndex((l, i) => i > fixesIdx && i < end && /^\s*\|/.test(l));
  if (headerIdx === -1) {
    return shapeRefusal(`Roadmap Fixes section carries no table header (expected a header row under '## ${ROADMAP_FIXES_HEADING}')`);
  }
  if (isSeparatorLine(lines[headerIdx])) {
    return shapeRefusal(`Roadmap Fixes table header missing above its separator (expected a header row under '## ${ROADMAP_FIXES_HEADING}')`);
  }
  const columns = rowCells(lines[headerIdx]);
  const keyColumns = columns
    .map((cell, i) => (FIX_ISSUE_HEADERS.includes(headerWord(cell)) ? i : -1))
    .filter((i) => i !== -1);
  if (keyColumns.length === 0) {
    return shapeRefusal(
      `Roadmap Fixes table has no issue-keyed column (header: ${columns.map((cell) => `'${cell}'`).join(" | ")}; expected one cell named 'Issue' or '#')`,
    );
  }
  if (keyColumns.length > 1) {
    return shapeRefusal(`Roadmap Fixes table has ${keyColumns.length} issue-keyed columns (expected exactly one)`);
  }
  const sepIdx = lines.findIndex((l, i) => i > headerIdx && i < end && isSeparatorLine(l));
  if (sepIdx === -1) {
    return shapeRefusal("Roadmap Fixes table separator not found (expected line with |---|)");
  }
  const separatorCells = rowCells(lines[sepIdx]).length;
  if (separatorCells !== columns.length) {
    return shapeRefusal(
      `Roadmap Fixes table separator has ${separatorCells} cells, its header has ${columns.length} (expected one cell per column)`,
    );
  }
  return { ok: true, lines, offsets, total, end, sepIdx, columns, keyColumn: keyColumns[0] };
}

/**
 * The splice declaration for `fixRowUpsert`: resolve the table's shape, key the
 * row by the issue number in its issue-keyed column, declare one range. The
 * replacement carries the table's column count: the columns the writer knows are
 * rewritten from its arguments, the columns it does not know keep the row's own
 * cells (or stay empty on an insert) — a value the writer was never given is
 * never invented.
 */
function fixRowUpsertEdits(content, { issue, url, topic, status, notes }) {
  const shape = fixTableShape(content);
  if (!shape.ok) return shape;
  const { lines, offsets, total, end, sepIdx, columns, keyColumn } = shape;
  const values = { topic, status, notes };
  const issueCell = url ? `[#${issue}](${url})` : String(issue);
  const rowLine = (existing) =>
    `| ${columns
      .map((cell, i) => {
        if (i === keyColumn) return issueCell;
        const bound = FIX_COLUMN_VALUES[headerWord(cell)];
        return bound === undefined ? existing[i] ?? "" : values[bound] ?? "";
      })
      .join(" | ")} |`;

  for (let i = sepIdx + 1; i < end && /^\s*\|/.test(lines[i]); i += 1) {
    const cells = rowCells(lines[i]);
    if (issueKeyInCell(cells[keyColumn] ?? "") === String(issue)) {
      return { ok: true, edits: [{ start: offsets[i], end: offsets[i] + lines[i].length, replacement: rowLine(cells) }] };
    }
  }
  return { ok: true, edits: [insertAfterLineEdit(lines, offsets, total, sepIdx, rowLine([]))] };
}

/**
 * fixRowUpsert(table, { issue, url, topic, status, notes, expected }) — the
 * writer for the `## Fixes` table (issue #498: the rows RELEASE.md said were
 * edited by hand because "no `NN` column, so `rowUpsert` does not apply"). The
 * table's own shape decides everything the old literal header decided: the issue
 * key may sit in any column (a header word `Issue`, `Issues` or `#`), the row is
 * keyed by the issue number in that column's `[#N](url)` or bare numeric cell,
 * and the spliced row carries the table's column count. The link is passed in
 * explicitly — the writer never invents issue links, and an absent `url` leaves
 * the bare number. Upserts: an existing row is updated in place, a new one
 * inserts after the table's separator. The write is a one-line splice;
 * `expected` closes the CAS loop.
 *
 * Returns a receipt. Throws a WriterError naming the exact constraint a missing
 * or malformed `## Fixes` table failed.
 */
export function fixRowUpsert(table, { issue, url, topic, status, notes, expected }) {
  const result = writeShared({ path: table, expected, apply: (content) => fixRowUpsertEdits(content, { issue, url, topic, status, notes }) });
  if (!result.ok) throwRefusal(result);

  // The post-state is judged by the same shape rule that wrote it: the row is
  // there, keyed by the issue in the table's own key column, and carries as many
  // cells as the table has columns. A fixed pipe count would misjudge a bare key
  // and any table that is not four columns wide (issue #684 extension).
  const written = fixTableShape(readFileSync(table, "utf8"));
  let ok = false;
  if (written.ok) {
    for (let i = written.sepIdx + 1; i < written.end && /^\s*\|/.test(written.lines[i]); i += 1) {
      const cells = rowCells(written.lines[i]);
      if (issueKeyInCell(cells[written.keyColumn] ?? "") !== String(issue)) continue;
      ok = cells.length === written.columns.length;
      break;
    }
  }

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