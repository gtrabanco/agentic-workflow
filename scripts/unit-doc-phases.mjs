/**
 * unit-doc-phases.mjs — parser for `P<n> —` bullets in a unit doc's `## Tasks`
 * section.
 *
 * This module owns the shared grammar that both `phase-lint.mjs` (the linter)
 * and `scripts/unit-route.mjs` (the router) need.  Keeping it separate prevents
 * the 1 000+ line linter from being pulled into every router invocation
 * (issue #291 / unit 73 F3). It also owns the one in-flight unit-doc corpus
 * rule (cycle-2 review F20): the roadmap + fix-index row grammar and the
 * dated-progress filter that `promise-coherence` and `vocabulary-probe` used
 * to keep as byte-similar copies that could silently disagree.
 */

import fs from "node:fs";
import path from "node:path";

/** A fence the line opens, or null: three-or-more backticks/tildes. */
export const FENCE_OPEN = /^(`{3,}|~{3,})/;
/** A closing fence: same character at equal-or-greater length. */
export const FENCE_CLOSE = /^(`{3,}|~{3,})$/;
/** A `P<n> —` task bullet. */
const UNIT_DOC_BULLET = /^ {0,3}[-*+] P(\d+)\s*[—-]\s+(\S.*)$/;
/** The `(Implements: S1, S2)` link line a re-cut task bullet carries. Anchored like
 *  `Relevant files:` — the link is metadata on its own line, so a sentence that
 *  quotes the shape inside a task's prose is task text, never the phase's link. */
const IMPLEMENTS_LINK = /^\(Implements:\s*([^)]*)\)$/;
/** Metadata line that attaches relevant-files to the preceding bullet. */
const UNIT_DOC_RELEVANT_FILES = /^\s*[-*+]\s+Relevant files:\s*(.*)$/;

export function openFence(trimmed) {
  const match = FENCE_OPEN.exec(trimmed);
  return match ? { char: match[1][0], length: match[1].length } : null;
}

export function closesFence(trimmed, fence) {
  const match = FENCE_CLOSE.exec(trimmed);
  return Boolean(match && match[1][0] === fence.char && match[1].length >= fence.length);
}

/** A `## ` level-2 heading, used as the section bound. */
const H2_HEADING = /^## /;

/**
 * Locate the real `## Tasks` section, ignoring headings that sit inside a
 * fenced code block.
 *
 * @param {string} text — the full unit doc text.
 * @returns {{ start: number, end: number } | null} offsets of the section body
 *   (after the heading line, before the next level-2 heading or EOF).
 */
export function locateTasksSection(text) {
  let fence = null;
  let offset = 0;
  let bodyStart = null;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const lineStart = offset;
    offset += line.length + 1; // the split swallowed one newline
    if (fence) {
      if (closesFence(trimmed, fence)) fence = null;
      continue;
    }
    const opened = openFence(trimmed);
    if (opened) {
      fence = opened;
      continue;
    }
    if (bodyStart === null) {
      if (/^## Tasks[ \t]*$/.test(trimmed)) bodyStart = offset;
      continue;
    }
    if (H2_HEADING.test(trimmed)) return { start: bodyStart, end: lineStart };
  }
  return bodyStart === null ? null : { start: bodyStart, end: text.length };
}

/**
 * Parse a unit doc's `## Tasks` section into phases and orphans.
 *
 * @param {string} text — the full unit doc text.
 * @returns {{ phases: Array<{number, title, tasks, taskScan, ticks, layer, kind, validator, relevantFiles, duplicate, body}>, orphans: Array<string> }}
 */
export function parseUnitDocPhases(text) {
  // Locate `## Tasks` and its body bound with the same fence state machine the
  // body scan uses: a `## Tasks` example inside a fenced code block is quoted
  // text, never the real section (F-74-1: locating it with a bare regex let a
  // fenced example hijack the section and linte a `P9` sample while the real
  // `P1` went unjudged).
  const section = locateTasksSection(text);
  if (!section) return { phases: [], orphans: [] };
  const { start, end } = section;
  const body = text.slice(start, end);

  const phases = [];
  const orphans = [];
  const seen = new Set();
  let current = null;
  let mode = "prose";
  let closed = false;
  let fence = null;
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    // Fence inertness — the same contract the plan grammar keeps: a fenced
    // example of a bullet is quoted text, never a phase, so a unit doc may
    // show its own shape without linting the example.
    if (fence) {
      if (closesFence(trimmed, fence)) fence = null;
      continue;
    }
    const opened = openFence(trimmed);
    if (opened) {
      fence = opened;
      continue;
    }
    const bullet = UNIT_DOC_BULLET.exec(line);
    if (bullet) {
      const number = Number(bullet[1]);
      current = { number, lines: [bullet[2]], relevantFiles: null, duplicate: seen.has(number), implements: null };
      seen.add(number);
      phases.push(current);
      mode = "prose";
      closed = false;
      continue;
    }
    const files = UNIT_DOC_RELEVANT_FILES.exec(line);
    if (files) {
      if (!current) {
        orphans.push(trimmed);
        continue;
      }
      current.relevantFiles =
        current.relevantFiles === null ? files[1] : `${current.relevantFiles} ${files[1]}`;
      mode = "files";
      closed = false;
      continue;
    }
    if (!current) continue;
    if (trimmed === "") {
      closed = true;
      continue;
    }
    if (/^#{1,6}\s/.test(trimmed)) {
      current = null;
      mode = "prose";
      closed = false;
      continue;
    }
    if (closed) {
      // Prose after a blank line is a new block, not a continuation of the
      // bullet; only the metadata line may still attach at this point.
      current = null;
      mode = "prose";
      closed = false;
      continue;
    }
    if (mode === "files") {
      current.relevantFiles = `${current.relevantFiles} ${trimmed}`;
      continue;
    }
    // A re-cut bullet's requirement link is its own line (`(Implements: S1, S2)`)
    // and is metadata, exactly like `Relevant files:` — it never becomes task text,
    // and no line that merely quotes the shape inside a sentence replaces it (F46).
    const link = IMPLEMENTS_LINK.exec(trimmed);
    if (link) {
      current.implements = link[1];
      continue;
    }
    current.lines.push(trimmed);
  }

  const built = phases.map((phase) => {
    const first = (phase.lines[0] || "").trim();
    const titleEnd = first.indexOf("(validator:");
    const head = (titleEnd === -1 ? first : first.slice(0, titleEnd)).trim();
    const title = (head.split(":")[0] || head).trim() || first;
    const scan = phase.lines.join(" ");
    const validatorAt = scan.indexOf("(validator:");
    const validator =
      validatorAt === -1
        ? null
        : scan.slice(validatorAt + "(validator:".length).replace(/\)\s*$/, "").trim();
    return {
      number: phase.number,
      title,
      tasks: [first],
      taskScan: [scan],
      ticks: [],
      layer: null,
      kind: "unit-doc",
      validator,
      relevantFiles: phase.relevantFiles,
      implements: phase.implements,
      duplicate: phase.duplicate,
      body: phase.lines,
    };
  });
  return { phases: built, orphans };
}
// ---------------------------------------------------------------------------
// The re-cut (`spec-by-reference`) grammar — issue #308
//
// A migrated unit doc numbers its requirements `S#` in `## Specs` (each one
// quoting the requester verbatim), links every task bullet to the requirements
// it implements, and appends its history to one `## Log` whose lines carry a
// closed kind token. The linter and the router read the same three readers, so
// the two can never disagree about what a migrated document says.
// ---------------------------------------------------------------------------

/**
 * The closed log-kind vocabulary, published by the unit-doc templates as the
 * `log-kind@1` block. This is the reader of that block's `token` column — one
 * definition, never a second copy in code (`scripts/phase-lint.test.mjs` pins the
 * template to this exact list).
 */
export const LOG_KINDS = Object.freeze(["L", "E", "G", "F", "D", "P", "R", "V"]);

/** A requirement heading in `## Specs`: `**S1 — title.**` / `**S2a — title.**`. */
const SPEC_REQUIREMENT = /^\*\*(S\d+[a-z]?)\s*—\s*(.*)$/;
/** A log line: `- **L1** — …` (the kind token is the id prefix). */
const LOG_LINE = /^[-*+]\s+\*\*([A-Z]+)(\d+)\*\*\s*[—-]\s*(.*)$/;

/**
 * Read `## Specs` into requirement records.
 *
 * @param {string} text — the full unit doc text.
 * @returns {{ requirements: Array<{ id, title, quote }>, present: boolean }}
 *   `quote` is the requirement's first blockquote line, `null` when it has none
 *   (the defect the linter reports as `spec-quote-missing`).
 */
export function parseSpecs(text) {
  const body = sectionText(text, "Specs");
  if (body === null) return { requirements: [], present: false };
  const requirements = [];
  let current = null;
  let fence = null;
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (fence) {
      if (closesFence(trimmed, fence)) fence = null;
      continue;
    }
    const opened = openFence(trimmed);
    if (opened) {
      fence = opened;
      continue;
    }
    const heading = SPEC_REQUIREMENT.exec(trimmed);
    if (heading) {
      // The heading is `**S1 — title.**`, optionally followed by a note
      // (`_…_`): the title ends at the bold close, the note is not a title.
      const title = heading[2].replace(/\*\*[\s\S]*$/, "").trim();
      current = { id: heading[1], title, quote: null };
      requirements.push(current);
      continue;
    }
    if (!current || current.quote !== null) continue;
    // The quote is the blockquote body; a bold marker (`> **S1a** — …`) and the
    // guillemets a translated correction arrives in are markers, not the words.
    const quoted = /^>\s*(.*)$/.exec(trimmed);
    if (quoted === null) continue;
    const words = quoted[1].replace(/^\*\*[^*]+\*\*\s*[—-]?\s*/, "").trim();
    if (words === "") continue;
    if (/^«.*»$/.test(words)) current.quote = words.slice(1, -1).trim();
    else current.quote = words;
  }
  return { requirements, present: true };
}

/**
 * Read `## Log` into its lines.
 *
 * @param {string} text — the full unit doc text.
 * @returns {{ lines: Array<{ kind, number, token, body }>, present: boolean }}
 */
export function parseLog(text) {
  const body = sectionText(text, "Log");
  if (body === null) return { lines: [], present: false };
  const lines = [];
  let fence = null;
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (fence) {
      if (closesFence(trimmed, fence)) fence = null;
      continue;
    }
    const opened = openFence(trimmed);
    if (opened) {
      fence = opened;
      continue;
    }
    const entry = LOG_LINE.exec(trimmed);
    if (entry) lines.push({ kind: entry[1], number: Number(entry[2]), token: `${entry[1]}${entry[2]}`, body: entry[3] });
  }
  return { lines, present: true };
}

/** The `P<n>` phases a `## Log` records, in order — a `P<n>` progress line is the receipt. */
export function loggedPhases(text) {
  const { lines, present } = parseLog(text);
  if (!present) return [];
  return lines.filter((line) => line.kind === "P").map((line) => line.number);
}

/** The raw body of one level-2 section, fence-aware; `null` when absent. */
export function sectionText(text, name) {
  let fence = null;
  let offset = 0;
  let start = null;
  const heading = new RegExp(`^## ${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[ \\t]*$`);
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const lineStart = offset;
    offset += line.length + 1;
    if (fence) {
      if (closesFence(trimmed, fence)) fence = null;
      continue;
    }
    const opened = openFence(trimmed);
    if (opened) {
      fence = opened;
      continue;
    }
    if (start === null) {
      if (heading.test(trimmed)) start = offset;
      continue;
    }
    if (H2_HEADING.test(trimmed)) return text.slice(start, lineStart);
  }
  return start === null ? null : text.slice(start);
}

/** The `[from, to)` range of one level-2 section, its heading included, or null.
 * Fence-aware: fenced blocks inside the section body are skipped so a line
 * like `## Status` inside a code block does not truncate the section. The
 * old fence-unaware copy (`/^## /m`) is the defect class #308 F28.
 */
export function sectionBounds(text, name) {
  let fence = null;
  let start = null;
  const heading = new RegExp(
    `^## ${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[ \t]*$`,
  );
  for (let offset = 0; offset < text.length; offset++) {
    const eol = text.indexOf("\n", offset);
    const lineEnd = eol === -1 ? text.length : eol;
    const trimmed = text.slice(offset, lineEnd).trim();
    if (fence) {
      if (closesFence(trimmed, fence)) fence = null;
      offset = lineEnd;
      continue;
    }
    const opened = openFence(trimmed);
    if (opened) {
      fence = opened;
      offset = lineEnd;
      continue;
    }
    if (start === null) {
      if (heading.test(trimmed)) start = offset;
      offset = lineEnd;
      continue;
    }
    if (H2_HEADING.test(trimmed)) return [start, offset];
    // Advance past this line before the loop's `offset++` skips the newline;
    // without it the loop re-slices the same line once per character — the F7
    // quadratic class, found by the unit-84 sibling pin on a 50k-char log line.
    offset = lineEnd;
  }
  return start === null ? null : [start, text.length];
}

/* ------------------------------------------------------- in-flight corpus */

/** A roadmap row: `| NN | `slug` | status |`. */
const ROADMAP_ROW = /^\|\s*(\d+)\s*\|\s*`([a-z0-9-]+)`\s*\|\s*([^|]+)\|/;
/** A fix-index row: `| [#N](url) | slug | status |`. */
const FIX_ROW = /^\|\s*\[#(\d+)\]\([^)]*\)\s*\|\s*([a-z0-9-]+)\s*\|\s*`?([a-z-]+)`?/;
/** The dated progress entry that makes a plan a unit in flight. */
const IN_FLIGHT_PROGRESS = /\d{4}-\d{2}-\d{2} \d{2}:\d{2} — /;

function readLinesUnder(root, relative) {
  try {
    return fs.readFileSync(path.join(root, relative), "utf8").split(/\r?\n/);
  } catch {
    return null;
  }
}

/**
 * The unit docs the roadmap and the fix index still call in flight, read
 * once: `{ file, lines }` pairs, `file` repository-relative. A plan that was
 * never started is a plan, not a promise — a dated progress entry makes it
 * live. The one owner of this rule (cycle-2 review F20): both gates consume
 * it, so the corpus they examine cannot drift apart in silence.
 */
export function inFlightUnitDocs(root) {
  const out = [];
  const roadmap = readLinesUnder(root, "docs/features/ROADMAP.md");
  if (roadmap !== null) {
    for (const line of roadmap) {
      const row = ROADMAP_ROW.exec(line);
      if (row === null) continue;
      if (/done|discarded|superseded/i.test(row[3])) continue;
      out.push(`docs/features/${row[1]}-${row[2]}/SPEC.md`);
    }
  }
  const fixes = readLinesUnder(root, "docs/fix/README.md");
  if (fixes !== null) {
    for (const line of fixes) {
      const row = FIX_ROW.exec(line);
      if (row === null) continue;
      if (/done/i.test(row[3])) continue;
      out.push(`docs/fix/${row[1]}-${row[2]}/SPEC.md`);
    }
  }
  // In flight = the Progress log carries a dated entry (the same rule both
  // consumers stated before it was unified here).
  const docs = [];
  for (const file of out) {
    const lines = readLinesUnder(root, file);
    if (lines !== null && IN_FLIGHT_PROGRESS.test(lines.join("\n"))) docs.push({ file, lines });
  }
  return docs;
}
