/**
 * Fence-aware section chunker (unit 65, D5).
 *
 * A chunk is one ATX-heading-delimited section found by a scanner where a `#`
 * inside a fenced code block is never a heading. The id is
 * `<relative-path>#<slug of the heading path>` with `-2` style dedupe,
 * derived only from content — no timestamps, no mtimes — so ids are stable
 * across sync runs (AC2/AC12) and half A's structure index shares the same
 * function (no drift between the halves). `lines` is 1-based inclusive.
 *
 * File-level frontmatter (`---` block) is parsed once and attached to every
 * chunk as `meta`; frontmatter lines never enter a chunk body. The preamble
 * (content before the first heading) is a chunk with `section: null` and id
 * `<path>#` — emitted only when that range is non-empty. A file with no
 * headings at all yields exactly the preamble chunk.
 */

import { listSections } from "./section-locator.mjs";

/**
 * The D5 shared slug rule — half B's chunks and half A's `doc read`/`edit`/
 * `index` consume this one export, so the two halves cannot drift (issue #366,
 * 65's D5). Exported without behavior change for the retrieval path.
 */
export function slugify(headingPath) {
  return headingPath
    .toLowerCase()
    .replace(/\s*>\s*/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The leading frontmatter block's bound: the 0-based index of the first content
 *  line (0 when the document carries no `---` block). One owner for both halves —
 *  the chunker never scans those lines and the section index never publishes a
 *  section from them, so a commented `# key:` inside frontmatter is not a heading
 *  anywhere (S15/A7). */
export function leadingFrontmatterEnd(lines) {
  if (lines.length === 0 || lines[0].trim() !== "---") return 0;
  for (let i = 1; i < lines.length; i++) if (lines[i].trim() === "---") return i + 1;
  return 0;
}

/** A section's own heading line, verbatim — the id source both halves share.
 *  The locator's `title` is rendered text (markup stripped), so it is the right
 *  value for a selector and the wrong one for an id (S11/B1). */
export function rawHeadingTitle(markdown, section) {
  const lineEnd = markdown.indexOf("\n", section.start);
  const line = markdown.slice(section.start, lineEnd === -1 ? markdown.length : lineEnd);
  return line.replace(/^#{1,6}\s+/, "").trim();
}

/**
 * The D5 shared id for one heading path within one document scan:
 * `<relative-path>#<slug>` with `-2` style dedupe against `usedIds`. Callers
 * pass one `usedIds` set per document so dedupe order is document order —
 * the identical scheme `scanChunks` has always emitted.
 */
export function nextSectionId(usedIds, relativePath, headingPath) {
  const slug = slugify(headingPath);
  let id = `${relativePath}#${slug}`;
  let n = 2;
  while (usedIds.has(id)) id = `${relativePath}#${slug}-${n++}`;
  usedIds.add(id);
  return id;
}

/** Minimal frontmatter: top-level `key: value` scalars, comma lists, and `>`/`|` folded blocks.
 *  Exported for half A's structure index (issue #366): one parser, both halves. */
export function parseFrontmatter(lines) {
  const meta = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if (value === ">" || value === "|" || value === ">-" || value === "|-") {
      const block = [];
      while (i + 1 < lines.length && /^\s/.test(lines[i + 1])) {
        block.push(lines[i + 1].trim());
        i++;
      }
      value = block.join(" ");
    } else if (value.includes(",")) {
      value = value.split(",").map((s) => s.trim()).filter((s) => s !== "");
    } else {
      value = value.replace(/^["']|["']$/g, "");
    }
    meta[key] = value;
  }
  return meta;
}

/**
 * Scan `markdown` into chunks attributed to `relativePath`.
 * Returns rows `{id, path, section, lines: [start, end], meta, body}` in
 * document order. Deterministic: identical input ⇒ identical output.
 */
export function scanChunks(markdown, relativePath) {
  const content = String(markdown);
  const lines = content.split(/\r?\n/);
  // A file ending in a newline splits into one phantom trailing element; it is
  // not a line, and counting it overshoots every last chunk's line_end (F47).
  if (lines.length > 1 && lines[lines.length - 1] === "" && /\r?\n$/.test(content)) lines.pop();

  // Frontmatter block, only when it opens the file.
  const contentStart = leadingFrontmatterEnd(lines);
  const meta = contentStart > 0 ? parseFrontmatter(lines.slice(1, contentStart - 1)) : {};

  // One heading scanner for both halves: the markdown tree the section locator
  // builds, never a second fence state machine. A quoted example, an inline code
  // span that wraps a line, an indented fence inside a list item and a commented
  // frontmatter key are therefore classified once, for `doc read`/`edit`/`index`
  // and for retrieval alike (S15/A7).
  const headings = listSections(content)
    .filter((section) => section.lines[0] >= contentStart + 1)
    .map((section) => ({ level: section.depth, title: rawHeadingTitle(content, section), line: section.lines[0] }));

  const chunks = [];
  const usedIds = new Set();
  const nextId = (headingPath) => nextSectionId(usedIds, relativePath, headingPath);

  // Preamble chunk — only when its range is non-empty and body is non-blank
  // (AC10: skip frontmatter-only preamble to avoid empty-body noise).
  const firstHeadingLine = headings.length > 0 ? headings[0].line : lines.length + 1;
  if (firstHeadingLine > 1 || headings.length === 0) {
    const to = headings.length > 0 ? firstHeadingLine - 1 : lines.length;
    const body = lines
      .slice(0, to)
      .filter((_, idx) => !(idx < contentStart))
      .join("\n");
    if (body.trim() !== "") {
      chunks.push({
        id: `${relativePath}#`,
        path: relativePath,
        section: null,
        lines: [contentStart + 1, to],
        meta,
        body,
      });
      usedIds.add(`${relativePath}#`);
    }
  }

  // Heading sections with their heading-path chain.
  const stack = []; // {level, title}
  for (let s = 0; s < headings.length; s++) {
    const heading = headings[s];
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) stack.pop();
    stack.push({ level: heading.level, title: heading.title });
    const headingPath = stack.map((e) => e.title).join(" > ");
    const to = s + 1 < headings.length ? headings[s + 1].line - 1 : lines.length;
    chunks.push({
      id: nextId(headingPath),
      path: relativePath,
      section: headingPath,
      lines: [heading.line, to],
      meta,
      body: lines.slice(heading.line - 1, to).join("\n"),
    });
  }

  return chunks;
}
