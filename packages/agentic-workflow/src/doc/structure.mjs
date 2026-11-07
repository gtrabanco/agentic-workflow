/**
 * The derived structure index (issue #366, half A of #192).
 *
 * `doc index` regenerates a deterministic JSON structure document over the
 * repository's tracked Markdown corpus — the same corpus retrieval indexes
 * (`corpusFiles`, #192's "docs/** and skills/** first"). Per file: sections
 * with stable D5 ids through `chunks.mjs`' one shared ID function, frontmatter
 * parsed once per file by the chunks parser, skill triggers read from the
 * frontmatter `description`'s `Triggers:` clause. Unit docs (frontmatter
 * `type` in the repo's closed set) additionally carry their phase mapping —
 * `- [x] P<n>` rows from `## Tasks`, plus previous/current/next pointers — and
 * the bullet lines of their `## Dependencies` (or `## Depends on`) section.
 *
 * Determinism contract: content only — no timestamps, no mtimes, no HEAD — so
 * two runs over an unchanged corpus emit byte-identical canonical JSON
 * (issue #192's resolved open question: the structure index is the separate,
 * commit-compatible artifact; the retrieval `.db` stays 65's and untouched).
 *
 * The output is never a decision authority: producers of gates and receipts
 * never read it (#192's transversal rule).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { canonicalJson, corpusFiles } from "./manifest.mjs";
import { parseFrontmatter } from "./chunks.mjs";
import { sectionsWithIds } from "./docops.mjs";

/** The closed unit-doc frontmatter `type` set (the unit-doc template's keys). */
export const UNIT_DOC_TYPES = Object.freeze(["feature", "fix", "docs", "chore"]);

const PHASE_RE = /^- \[([ xX])\] (P\d+[a-z]?)\s*[—-]/;
const TRIGGERS_RE = /Triggers:\s*(.+)$/s;
const QUOTED_RE = /"([^"]+)"/g;

/** Skill triggers: the description scalar's `Triggers:` clause, or a
 *  frontmatter `triggers` key when the project declares one there. */
export function extractTriggers(meta) {
  const declared = meta.triggers;
  const fromKey = Array.isArray(declared) ? declared : typeof declared === "string" && declared !== "" ? [declared] : [];
  if (fromKey.length > 0) return fromKey.map((t) => String(t).trim());
  const description = typeof meta.description === "string" ? meta.description : "";
  const match = TRIGGERS_RE.exec(description);
  if (!match) return [];
  // The clause's own convention is quoted, comma-separated tokens (and it
  // may carry trailing prose); quoted tokens win, a comma split remains the
  // fallback for an unquoted list.
  const quoted = [...match[1].matchAll(QUOTED_RE)].map((m) => m[1].trim()).filter((t) => t !== "");
  if (quoted.length > 0) return quoted;
  return match[1]
    .split(",")
    .map((t) => t.trim().replace(/^["'`]+|["'`]+$/g, ""))
    .filter((t) => t !== "");
}

/** The frontmatter block's lines, or an empty block when the file opens
 *  with anything else (including a lone `---` with no closer). */
function frontmatterLines(markdown) {
  const lines = markdown.split("\n");
  if (lines[0]?.trim() !== "---") return [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") return lines.slice(1, i);
  }
  return [];
}

/** The section text of any section whose title is exactly `title` (first
 *  match in document order, nested headings included — `##` children of a
 *  root section are inside their parent's range). */
function sectionText(markdown, sections, title) {
  for (const section of sections) {
    if (section.title === title) return markdown.slice(section.start, section.end);
  }
  return null;
}

/** Phase rows from a `## Tasks` section's checkbox bullets; a fenced row is
 *  never a phase (the section text carries fences, the bullets never parse). */
function parsePhases(tasksText) {
  if (tasksText === null) return [];
  const phases = [];
  for (const line of tasksText.split("\n")) {
    const match = PHASE_RE.exec(line);
    if (match) phases.push({ id: match[2], status: match[1].trim() === "" ? "open" : "complete" });
  }
  return phases;
}

/** previous/current/next: `current` is the first open phase; the pointers are
 *  the phases immediately around it (null at either end). All open pointers
 *  stay content-derived — no clock, no ordering assumption beyond document
 *  order. */
function phaseMapping(phases) {
  const currentIndex = phases.findIndex((p) => p.status === "open");
  if (currentIndex === -1) return { previous: null, current: null, next: null };
  return {
    previous: currentIndex > 0 ? phases[currentIndex - 1].id : null,
    current: phases[currentIndex].id,
    next: currentIndex + 1 < phases.length ? phases[currentIndex + 1].id : null,
  };
}

/** The bullet lines of a unit doc's dependencies section (verbatim bodies,
 *  marker stripped). Both spellings the repo's unit docs use are accepted. */
function parseDependencies(markdown, sections) {
  const text = sectionText(markdown, sections, "Dependencies") ?? sectionText(markdown, sections, "Depends on");
  if (text === null) return [];
  const out = [];
  for (const line of text.split("\n").slice(1)) {
    const match = /^[-*] (.+)$/.exec(line);
    if (match) out.push(match[1].trim());
  }
  return out;
}

/** One corpus file's structure row. The document is parsed once — the same
 *  `sectionsWithIds` pass feeds the range rows, the phase section and the
 *  dependencies section. */
export function scanDocFile(path, content) {
  const sections = sectionsWithIds(content, path);
  const meta = parseFrontmatter(frontmatterLines(content));
  const kind = /(^|\/)SKILL\.md$/.test(path) ? "skill" : "doc";
  const rows = sections.map((s) => ({
    id: s.id,
    title: s.title,
    depth: s.depth,
    lines: [s.lines[0], s.lines[1]],
  }));
  const file = { path, kind, frontmatter: meta, triggers: kind === "skill" ? extractTriggers(meta) : [], sections: rows };
  if (UNIT_DOC_TYPES.includes(meta.type)) {
    const phases = parsePhases(sectionText(content, sections, "Tasks"));
    file.unit = {
      path,
      type: meta.type,
      phases,
      ...phaseMapping(phases),
      dependencies: parseDependencies(content, sections),
    };
  }
  return file;
}

/**
 * buildDocIndex(corpus) — the deterministic index document over an in-memory
 * corpus `[{path, content}]`. Pure: identical input, identical output.
 */
export function buildDocIndex(corpus) {
  const files = [...corpus]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map((f) => scanDocFile(f.path, f.content));
  return { version: 1, files, units: files.filter((f) => f.unit !== undefined).map((f) => f.unit) };
}

/**
 * collectDocIndex(root) — the index over the live repo at `root`, corpus from
 * `corpusFiles` (git-tracked `*.md`). A file that no longer reads is an IO
 * failure naming it.
 */
export function collectDocIndex(root) {
  const corpus = corpusFiles(root).map((p) => {
    let content;
    try {
      content = readFileSync(join(root, p), "utf8");
    } catch (e) {
      throw new Error(`doc index: cannot read the corpus file (${p}): ${e.message}`);
    }
    return { path: p, content };
  });
  return buildDocIndex(corpus);
}

/** The `doc index` CLI op (wired by the bin's half-A branch). `--json`
 *  prints exactly one JSON document (the canonical index); `--out <path>`
 *  writes the identical canonical bytes plus a newline; the plain surface
 *  prints one receipt line. The retrieval store is never opened here. */
export async function runDocIndex(g, { rootDir }) {
  const index = collectDocIndex(rootDir);
  const bytes = canonicalJson(index) + "\n";
  const sections = index.files.reduce((n, f) => n + f.sections.length, 0);
  if (g.json) {
    process.stdout.write(bytes);
    return;
  }
  if (g.out !== null) {
    const target = resolve(rootDir, g.out);
    try {
      const { mkdirSync } = await import("node:fs");
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes);
    } catch (e) {
      throw new Error(`doc index: cannot write the artifact (${target}): ${e.message}`);
    }
    console.log(`doc index: files=${index.files.length} sections=${sections} units=${index.units.length} written=${target}`);
    return;
  }
  console.log(`doc index: files=${index.files.length} sections=${sections} units=${index.units.length}`);
}
