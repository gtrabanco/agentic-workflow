/**
 * The location indexes — one document, two tables (issue #319).
 *
 * `docs/ROADMAP.md` is the single index: `## Features` orders feature units,
 * `## Fixes` carries the active fixes that used to live in `docs/fix/README.md`.
 * The path is published here so a consumer never hardcodes it again — the
 * 15-file recurrence the move was made to end.
 *
 * The same constants are mirrored by `@gtrabanco/agentic-workflow-schema`
 * (`src/paths.ts`), the package the orchestration layer imports; the mirror is
 * held in step by `scripts/index-document.test.mjs`, which reads both sources.
 * The pre-move path is spelled exactly once in the tree, in this file: the
 * alias below.
 *
 * The migration window is CLOSED (owner decision D4, 2026-10-30; it supersedes
 * unit 319's D2): every reader resolves {@link ROADMAP_DOCUMENT} only. A
 * repository that still carries the pre-move path is refused with a
 * `roadmap-moved` pointer at its new home — never a silent empty parse, and
 * never an empty index. `ROADMAP_LEGACY_READ` stays as the documented
 * rollback lever: flipping it back to `true` re-opens the alias for an
 * emergency, it is not a normal operating mode.
 */

import fs from "node:fs";
import path from "node:path";

/** The consolidated index. */
export const ROADMAP_DOCUMENT = "docs/ROADMAP.md";
/** The pre-move path: detected only, so the refusal can name it. Never read. */
export const ROADMAP_LEGACY_DOCUMENT = "docs/features/ROADMAP.md";
/** The fix index file. Before unit 319 it was the index itself; now it is a stub. */
export const FIX_INDEX_DOCUMENT = "docs/fix/README.md";
/** The features table's heading in the consolidated index. */
export const ROADMAP_FEATURES_HEADING = "Features";
/** The fixes table's heading in the consolidated index. */
export const ROADMAP_FIXES_HEADING = "Fixes";
/**
 * D4: the read alias is closed. Kept as an explicit, tested rollback lever:
 * `true` re-opens the pre-move path for an emergency, and every consumer reads
 * it through this one value.
 */
export const ROADMAP_LEGACY_READ = false;
/** The closed code a closed window refuses the pre-move path with. */
export const ROADMAP_MOVED_CODE = "roadmap-moved";

/**
 * The pre-move path was read after the window closed. The error names the file
 * that moved and where it moved to, so a consumer reconciles instead of parsing
 * an empty document.
 */
export class RoadmapMovedError extends Error {
  constructor(from = ROADMAP_LEGACY_DOCUMENT, to = ROADMAP_DOCUMENT) {
    super(`${ROADMAP_MOVED_CODE}: ${from} has moved to ${to} — read ${to}`);
    this.name = "RoadmapMovedError";
    this.code = ROADMAP_MOVED_CODE;
    this.from = from;
    this.to = to;
  }
}

/**
 * Which index a repository carries, without reading it: `{ path, source }`
 * where `source` is `"canonical"`, or `"legacy"` only while the rollback lever
 * is on; `null` when neither exists. A repository that carries only the
 * pre-move path and no rollback is refused here, before any read.
 *
 * `exists` is the caller's own existence check, so a consumer that confines
 * reads to its project root (the sensor) keeps its confinement instead of
 * bypassing it with a second filesystem call.
 *
 * @param {object} options
 * @param {(relative: string) => boolean} options.exists
 * @param {boolean} [options.legacy] — defaults to the window flag.
 * @returns {{path: string, source: "canonical"|"legacy"} | null}
 */
export function resolveRoadmapSource({ exists, legacy = ROADMAP_LEGACY_READ }) {
  if (exists(ROADMAP_DOCUMENT)) return { path: ROADMAP_DOCUMENT, source: "canonical" };
  if (!exists(ROADMAP_LEGACY_DOCUMENT)) return null;
  if (!legacy) throw new RoadmapMovedError();
  return { path: ROADMAP_LEGACY_DOCUMENT, source: "legacy" };
}

/**
 * Read the index a repository carries: `{ path, source, text }` or `null`.
 * Throws `RoadmapMovedError` when only the pre-move path exists and the window
 * is closed.
 *
 * @param {string} rootDir
 * @param {{legacy?: boolean}} [options]
 */
export function readRoadmapIndex(rootDir, { legacy = ROADMAP_LEGACY_READ } = {}) {
  const exists = (relative) => {
    try {
      return fs.lstatSync(path.join(rootDir, relative)).isFile();
    } catch {
      return false;
    }
  };
  const source = resolveRoadmapSource({ exists, legacy });
  if (source === null) return null;
  return { ...source, text: fs.readFileSync(path.join(rootDir, source.path), "utf8") };
}

/**
 * The body of one `## <heading>` section, or `null` when the document has no
 * such heading. Fenced code blocks are respected: a `##` line inside a fence is
 * document text, not a heading.
 *
 * @param {string} text
 * @param {string} heading
 * @returns {string | null}
 */
export function roadmapSection(text, heading) {
  if (typeof text !== "string") return null;
  const wanted = heading.trim().toLowerCase();
  const lines = text.split("\n");
  const out = [];
  let inFence = false;
  let level = 0;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const match = inFence ? null : /^(#{1,6})\s+(.*)$/.exec(line);
    if (match) {
      if (level !== 0 && match[1].length <= level) break; // the section ended
      if (level === 0 && match[2].trim().toLowerCase() === wanted) {
        level = match[1].length;
        continue;
      }
      if (level === 0) continue;
    }
    if (level !== 0) out.push(line);
  }
  return level === 0 ? null : out.join("\n");
}

/** The cells of one Markdown table row, splitting only on unescaped pipes. */
export function tableCells(line) {
  const cells = [];
  let current = "";
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\\" && line[index + 1] === "|") {
      current += "|";
      index += 1;
    } else if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells.length > 2 ? cells.slice(1, -1) : [];
}

const isSeparatorRow = (cells) => cells.length > 0 && cells.every((cell) => /^[-:\s]*$/.test(cell));

/**
 * The data rows of the table that belongs to `kind` — `"feature"` reads
 * `## Features`, `"fix"` reads `## Fixes`.
 *
 * Scoping is what keeps the two tables apart: in a consolidated document a
 * feature row numbered `N` and a fix row for issue `N` are different rows, and a
 * parser handed the whole file must never mix them. A document without the
 * heading (a pre-319 roadmap, a standalone fix index, a caller-supplied
 * fragment) keeps its single-table meaning: every row is the caller's kind.
 *
 * @param {string} text
 * @param {"feature"|"fix"} kind
 * @returns {string[][]}
 */
export function roadmapTableRows(text, kind) {
  if (typeof text !== "string") return [];
  const heading = kind === "fix" ? ROADMAP_FIXES_HEADING : ROADMAP_FEATURES_HEADING;
  const body = roadmapSection(text, heading) ?? text;
  const rows = [];
  for (const line of body.split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    const cells = tableCells(line);
    if (cells.length === 0 || isSeparatorRow(cells)) continue;
    rows.push(cells);
  }
  return rows;
}

/**
 * The fix index's rows for this repository: the `## Fixes` table of the
 * consolidated index when it has one, else the standalone `docs/fix/README.md`
 * of a pre-319 tree. `{ path, text }` or `null`.
 *
 * @param {string} rootDir
 * @param {{legacy?: boolean}} [options]
 */
export function readFixIndexTable(rootDir, { legacy = ROADMAP_LEGACY_READ } = {}) {
  const index = readRoadmapIndex(rootDir, { legacy });
  if (index !== null) {
    const section = roadmapSection(index.text, ROADMAP_FIXES_HEADING);
    if (section !== null) return { path: index.path, text: section };
  }
  const standalone = path.join(rootDir, FIX_INDEX_DOCUMENT);
  try {
    if (!fs.lstatSync(standalone).isFile()) return null;
    return { path: FIX_INDEX_DOCUMENT, text: fs.readFileSync(standalone, "utf8") };
  } catch {
    return null;
  }
}

/** Whether a caller-supplied document path is the consolidated index. */
export function isRoadmapDocument(documentPath) {
  return typeof documentPath === "string" && (documentPath === ROADMAP_DOCUMENT || documentPath.endsWith(`/${ROADMAP_DOCUMENT}`));
}
