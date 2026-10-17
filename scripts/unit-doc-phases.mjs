/**
 * unit-doc-phases.mjs — parser for `P<n> —` bullets in a unit doc's `## Tasks`
 * section.
 *
 * This module owns the shared grammar that both `phase-lint.mjs` (the linter)
 * and `scripts/unit-route.mjs` (the router) need.  Keeping it separate prevents
 * the 1 000+ line linter from being pulled into every router invocation
 * (issue #291 / unit 73 F3).
 */

/** A fence the line opens, or null: three-or-more backticks/tildes. */
export const FENCE_OPEN = /^(`{3,}|~{3,})/;
/** A closing fence: same character at equal-or-greater length. */
export const FENCE_CLOSE = /^(`{3,}|~{3,})$/;
/** A `P<n> —` task bullet. */
const UNIT_DOC_BULLET = /^ {0,3}[-*+] P(\d+)\s*[—-]\s+(\S.*)$/;
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
      current = { number, lines: [bullet[2]], relevantFiles: null, duplicate: seen.has(number) };
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
      duplicate: phase.duplicate,
      body: phase.lines,
    };
  });
  return { phases: built, orphans };
}