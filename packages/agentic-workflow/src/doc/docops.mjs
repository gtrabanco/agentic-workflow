/**
 * Half-A doc operations: section resolution over the shared D5 id scheme
 * (issue #366). This module is the only seam between the `doc` CLI branch and
 * #407's section locator: it locates with the locator's AST positions and
 * derives the D5 chunk ids with `chunks.mjs`' one shared id function, so
 * `doc read`'s `--section <id|title>` and `doc index`'s section ids cannot
 * drift from the retrieval chunks they mirror (65's D5).
 *
 * A `--section` reference is either a full D5 id (`<relative-path>#<slug>`,
 * dedupe suffixes included) or the slug part alone (`<slug>`); anything
 * without a `#` is matched as an exact heading title. Zero matches raise
 * `NO_MATCH`, several raise `AMBIGUOUS_MATCH` — both typed, both the
 * caller's policy to render (the CLI prints `DOC REFUSAL — <code>` exit 2).
 *
 * No normalization, no clock: the splice outputs carry the source's own
 * bytes, identical runs produce identical output blocks.
 */

import { existsSync } from "node:fs";
import path from "node:path";

import { listSections, SectionLocatorError } from "./section-locator.mjs";
import { nextSectionId } from "./chunks.mjs";

export { SectionLocatorError };

/**
 * The heading's own line, verbatim — the exact bytes `chunks.mjs` slugs. The
 * locator's `title` is rendered text (its contract strips inline markup), so it
 * is the right value for a title selector and the wrong one for an id: two
 * halves reading one slugger still drift if they feed it different strings
 * (S11/B1).
 */
function rawHeadingTitle(markdown, section) {
  const lineEnd = markdown.indexOf("\n", section.start);
  const line = markdown.slice(section.start, lineEnd === -1 ? markdown.length : lineEnd);
  return line.replace(/^#{1,6}\s+/, "").trim();
}

/**
 * Attach the D5 id to every root section of `markdown`, in document order,
 * mirroring `scanChunks`: one `usedIds` set per scan, the heading-path chain
 * rebuilt by the same depth stack from the same raw titles.
 * Returns the locator's section descriptors each carrying an `id`.
 */
export function sectionsWithIds(markdown, relativePath) {
  const sections = listSections(markdown);
  const usedIds = new Set();
  const stack = []; // {depth, title}
  for (const section of sections) {
    while (stack.length > 0 && stack[stack.length - 1].depth >= section.depth) stack.pop();
    stack.push({ depth: section.depth, title: rawHeadingTitle(markdown, section) });
    section.id = nextSectionId(usedIds, relativePath, stack.map((entry) => entry.title).join(" > "));
  }
  return sections;
}

/**
 * Resolve one `--section <id|title>` reference against `markdown`.
 * Returns the located section descriptor (`{depth, title, path, start, end,
 * lines, id}`). `ref` matches a section's full D5 id, the id's slug part
 * alone, or the exact heading title — one cascade, and several distinct
 * matches (for example a title equal to another section's slug) stay
 * ambiguous. Zero or several matches raise the typed `SectionLocatorError`.
 */
export function resolveSectionRef(markdown, relativePath, ref) {
  if (typeof ref !== "string" || ref.trim() === "") {
    throw new SectionLocatorError("BAD_SELECTOR", `doc: --section must be a non-empty id or title`, {
      matches: 0,
      selector: ref ?? null,
    });
  }
  const sections = sectionsWithIds(markdown, relativePath);
  const matches = sections.filter((section) => {
    const slugPart = section.id.slice(relativePath.length + 1);
    // `<id|title>`: a full D5 id, or its slug part alone, or the exact title.
    return section.id === ref || slugPart === ref || section.title === ref;
  });
  if (matches.length === 0) {
    throw new SectionLocatorError("NO_MATCH", `doc: no section matches --section ${JSON.stringify(ref)}`, {
      matches: 0,
      selector: ref,
    });
  }
  if (matches.length > 1) {
    throw new SectionLocatorError(
      "AMBIGUOUS_MATCH",
      `doc: ${matches.length} sections match --section ${JSON.stringify(ref)} (${matches.map((s) => s.id).join(", ")})`,
      { matches: matches.length, selector: ref },
    );
  }
  return matches[0];
}

/** The D5-style relative path of `file` inside the workspace containing it:
 *  walk up to the nearest `.git`, and fall back to the file's own directory. */
export function relativeDocPath(file) {
  const abs = path.resolve(file);
  let dir = path.dirname(abs);
  for (;;) {
    if (existsSync(path.join(dir, ".git"))) {
      const rel = path.relative(dir, abs).split(path.sep).join("/");
      return rel.startsWith("..") ? path.basename(abs) : rel;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return path.basename(abs);
    dir = parent;
  }
}
