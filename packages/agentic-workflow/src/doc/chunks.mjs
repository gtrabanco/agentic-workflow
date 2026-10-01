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

const FENCE_RE = /^(`{3,}|~{3,})/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;

function slugify(headingPath) {
  return headingPath
    .toLowerCase()
    .replace(/\s*>\s*/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Minimal frontmatter: top-level `key: value` scalars, comma lists, and `>`/`|` folded blocks. */
function parseFrontmatter(lines) {
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
  const lines = String(markdown).split(/\r?\n/);

  // Frontmatter block, only when it opens the file.
  let contentStart = 0;
  let meta = {};
  if (lines.length > 0 && lines[0].trim() === "---") {
    let end = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "---") {
        end = i;
        break;
      }
    }
    if (end !== -1) {
      meta = parseFrontmatter(lines.slice(1, end));
      contentStart = end + 1;
    }
  }

  // Headings outside fenced code blocks.
  const headings = []; // {level, title, line (1-based)}
  let fence = null;
  for (let i = contentStart; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (fence !== null) {
      if (trimmed.startsWith(fence)) fence = null;
      continue;
    }
    const f = trimmed.match(FENCE_RE);
    if (f) {
      fence = f[1][0].repeat(3);
      continue;
    }
    const h = trimmed.match(HEADING_RE);
    if (h) headings.push({ level: h[1].length, title: h[2].trim(), line: i + 1 });
  }

  const chunks = [];
  const usedIds = new Set();
  const nextId = (headingPath) => {
    const slug = slugify(headingPath);
    let id = `${relativePath}#${slug}`;
    let n = 2;
    while (usedIds.has(id)) id = `${relativePath}#${slug}-${n++}`;
    usedIds.add(id);
    return id;
  };

  // Preamble chunk — only when its range is non-empty.
  const firstHeadingLine = headings.length > 0 ? headings[0].line : lines.length + 1;
  if (firstHeadingLine > 1 || headings.length === 0) {
    const to = headings.length > 0 ? firstHeadingLine - 1 : lines.length;
    const body = lines
      .slice(0, to)
      .filter((_, idx) => !(idx < contentStart))
      .join("\n");
    chunks.push({
      id: `${relativePath}#`,
      path: relativePath,
      section: null,
      lines: [1, to],
      meta,
      body,
    });
    usedIds.add(`${relativePath}#`);
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
