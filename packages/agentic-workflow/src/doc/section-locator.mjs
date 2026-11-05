/**
 * Section locator — fence-safe Markdown section/range location and a lossless
 * byte-offset splice (issue #407).
 *
 * The defect this module exists for: a raw `indexOf("\n## ")` heading scan
 * matches `## `-like lines inside fenced code blocks, so it corrupts a section
 * body that documents Markdown (the `UnitDoc.setSection` class). Here the
 * document is parsed once with `mdast-util-from-markdown`, section bounds come
 * from node positions, and the mutation is a slice of the original string —
 * everything outside the reported range is carried through byte for byte.
 *
 * The source contract, frozen by the suite beside this file:
 *
 *   - A **section** is an ATX heading (a `heading` node whose source starts
 *     with one to six `#` and a space) that is a **direct child of the document
 *     root**. A fenced line, a blockquote heading and a setext heading are
 *     never sections; an mdast setext heading would otherwise swallow a
 *     frontmatter block (`---` + `key: value` + `---`).
 *   - A section spans from its heading's start offset to the start offset of the
 *     next root heading of depth <= its own, or to end-of-document. Nested
 *     sections are inside their parent's range.
 *   - `start`/`end` are UTF-16 code-unit offsets into the source string, which
 *     is exactly what `String.prototype.slice` takes. `byteStart`/`byteEnd` are
 *     the derived UTF-8 byte offsets — a caller that hashes a range must use
 *     those, never the string offsets (multi-byte content makes them differ).
 *   - A selector resolving to zero sections raises `NO_MATCH`; more than one
 *     raises `AMBIGUOUS_MATCH`. Callers decide the policy — this module never
 *     guesses which duplicate was meant.
 *
 * No normalization, no reformatting, no clock: same input, same output.
 */

import { fromMarkdown } from "mdast-util-from-markdown";

/** The closed set of selector-resolution failures. */
export const SECTION_ERROR_CODES = Object.freeze(["NO_MATCH", "AMBIGUOUS_MATCH", "BAD_SELECTOR"]);

/** A typed resolution failure: `code` is one of `SECTION_ERROR_CODES`. */
export class SectionLocatorError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "SectionLocatorError";
    this.code = code;
    /** Sections (or lines) that matched; `0` for a malformed selector. */
    this.matches = details.matches ?? 0;
    /** The normalized selector that failed, JSON-serializable for the CLI envelope. */
    this.selector = details.selector ?? null;
  }
}

/** An ATX heading opens with at most three spaces, one to six `#`, then a space
 *  or the end of the line. Bounded to the widest legal prefix. */
const ATX_HEADING = /^ {0,3}#{1,6}(?:[ \t]|$)/;
/** The widest legal ATX prefix: 3 spaces + 6 hashes + one separator. */
const ATX_PREFIX_WIDTH = 10;

function assertSource(markdown) {
  if (typeof markdown !== "string") {
    throw new TypeError(`section-locator: the document must be a string, got ${typeof markdown}`);
  }
  return markdown;
}

/** The plain text of a heading: text and inline-code values, links flattened,
 *  images as their alt text. Markup is never part of a title. */
function nodeText(node) {
  if (typeof node.value === "string") return node.value;
  if (node.type === "image") return node.alt ?? "";
  return (node.children ?? []).map(nodeText).join("");
}

/** 1-based start offset of every line. A trailing newline opens a final empty
 *  line, which is what every offset-to-line conversion then sees. */
function lineStarts(markdown) {
  const starts = [0];
  for (let index = 0; index < markdown.length; index += 1) {
    if (markdown.charCodeAt(index) === 10) starts.push(index + 1);
  }
  return starts;
}

/** The 1-based line number that owns `offset`. */
function lineAt(starts, offset) {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (starts[middle] <= offset) low = middle;
    else high = middle - 1;
  }
  return low + 1;
}

/** The 1-based line of the last byte (or code unit) inside a range, so a range
 *  ending on a newline reports the line it terminates, never the empty next one. */
function endLineAt(starts, start, end) {
  if (end <= start) return lineAt(starts, start);
  return lineAt(starts, end - 1);
}

/** One line span: its offsets, its terminator-inclusive end, and the content a
 *  matcher sees (no line terminator). */
function lineSpan(markdown, starts, index) {
  const start = starts[index];
  const end = index + 1 < starts.length ? starts[index + 1] : markdown.length;
  let contentEnd = end;
  if (contentEnd > start && markdown.charCodeAt(contentEnd - 1) === 10) contentEnd -= 1;
  if (contentEnd > start && markdown.charCodeAt(contentEnd - 1) === 13) contentEnd -= 1;
  return { start, end, content: markdown.slice(start, contentEnd) };
}

/**
 * Derive the UTF-8 byte offset of every range boundary in one forward pass, so
 * `listSections` stays linear in the document instead of re-measuring the
 * prefix once per section.
 */
function attachByteOffsets(markdown, ranges) {
  const events = [];
  for (const range of ranges) {
    events.push({ range, field: "byteStart", offset: range.start });
    events.push({ range, field: "byteEnd", offset: range.end });
  }
  events.sort((left, right) => left.offset - right.offset || (left.field === "byteStart" ? -1 : 1));
  let cursor = 0;
  let byte = 0;
  for (const event of events) {
    byte += Buffer.byteLength(markdown.slice(cursor, event.offset), "utf8");
    cursor = event.offset;
    event.range[event.field] = byte;
  }
  return ranges;
}

function badSelector(message) {
  throw new SectionLocatorError("BAD_SELECTOR", `section-locator: ${message}`);
}

/** A regex in its JSON form `{source, flags}`; `g`/`y` are dropped so `.test` is
 *  stateless across calls. */
function toRegex(value, field) {
  if (value instanceof RegExp) return { source: value.source, flags: value.flags.replace(/[gy]/g, "") };
  if (value && typeof value === "object" && typeof value.source === "string" && (value.flags === undefined || typeof value.flags === "string")) {
    const flags = (value.flags ?? "").replace(/[gy]/g, "");
    try {
      new RegExp(value.source, flags);
    } catch (error) {
      badSelector(`${field} is not a valid regular expression: ${error.message}`);
    }
    return { source: value.source, flags };
  }
  badSelector(`${field} must be a RegExp or its JSON form {source, flags}`);
}

function headingTitle(value, field) {
  if (typeof value !== "string" || value.trim() === "") badSelector(`${field} must be a non-empty heading title`);
  return value;
}

function headingPath(value, field) {
  if (!Array.isArray(value) || value.length === 0) badSelector(`${field} must be a non-empty array of heading titles`);
  return value.map((entry, index) => headingTitle(entry, `${field}[${index}]`));
}

/** Normalize every accepted selector spelling into one JSON-serializable form. */
function normalizeSelector(selector) {
  if (typeof selector === "string") return { kind: "title", title: headingTitle(selector, "the title selector") };
  if (Array.isArray(selector)) return { kind: "path", path: headingPath(selector, "the path selector") };
  if (!selector || typeof selector !== "object") {
    badSelector("a selector is a heading title, a path array, or an object");
  }
  const forms = ["heading", "path", "headingRegex", "line"].filter((key) => Object.prototype.hasOwnProperty.call(selector, key));
  if (forms.length !== 1) badSelector("a selector object carries exactly one of heading, path, headingRegex, line");
  const form = forms[0];
  if (form !== "line" && Object.prototype.hasOwnProperty.call(selector, "within")) {
    badSelector("within only scopes a line selector");
  }
  if (form === "heading") return { kind: "title", title: headingTitle(selector.heading, "heading") };
  if (form === "path") return { kind: "path", path: headingPath(selector.path, "path") };
  if (form === "headingRegex") return { kind: "heading-regex", ...toRegex(selector.headingRegex, "headingRegex") };
  const within =
    selector.within === undefined || selector.within === null ? null : normalizeSelector(selector.within);
  if (typeof selector.line === "string") return { kind: "line", within, match: { kind: "exact", text: selector.line } };
  return { kind: "line", within, match: { kind: "regex", ...toRegex(selector.line, "line") } };
}

/**
 * listSections(markdown) — every root ATX section, in document order.
 * Each descriptor: `{depth, title, path, start, end, byteStart, byteEnd, lines,
 * headingLines}`, where `lines` is the whole section and `headingLines` the
 * heading line, both 1-based inclusive.
 */
export function listSections(markdown) {
  const source = assertSource(markdown);
  const starts = lineStarts(source);
  const headings = [];
  for (const node of fromMarkdown(source).children) {
    if (node.type !== "heading" || !node.position) continue;
    const start = node.position.start.offset;
    if (!ATX_HEADING.test(source.slice(start, start + ATX_PREFIX_WIDTH))) continue;
    headings.push({
      depth: node.depth,
      title: nodeText(node).trim(),
      start,
      headingLines: [node.position.start.line, node.position.end.line],
    });
  }

  const sections = [];
  const open = [];
  for (const heading of headings) {
    while (open.length > 0 && open[open.length - 1].depth >= heading.depth) {
      open.pop().end = heading.start;
    }
    open.push({
      depth: heading.depth,
      title: heading.title,
      path: [...open.map((section) => section.title), heading.title],
      start: heading.start,
      end: source.length,
      headingLines: heading.headingLines,
    });
    sections.push(open[open.length - 1]);
  }

  for (const section of sections) {
    section.lines = [lineAt(starts, section.start), endLineAt(starts, section.start, section.end)];
  }
  return attachByteOffsets(source, sections);
}

function matchSections(sections, selector) {
  if (selector.kind === "title") return sections.filter((section) => section.title === selector.title);
  if (selector.kind === "path") {
    return sections.filter(
      (section) => section.path.length === selector.path.length && section.path.every((title, index) => title === selector.path[index]),
    );
  }
  const regex = new RegExp(selector.source, selector.flags);
  return sections.filter((section) => regex.test(section.title));
}

function describeSelector(selector) {
  if (selector.kind === "title") return `the heading title "${selector.title}"`;
  if (selector.kind === "path") return `the heading path ${selector.path.map((title) => `"${title}"`).join(" > ")}`;
  if (selector.kind === "heading-regex") return `the heading regex /${selector.source}/${selector.flags}`;
  return "the line selector";
}

/** Resolve exactly one section or raise the typed failure. */
function resolveSection(source, selector) {
  const sections = listSections(source);
  const matches = matchSections(sections, selector);
  if (matches.length === 0) {
    throw new SectionLocatorError("NO_MATCH", `section-locator: no section matches ${describeSelector(selector)}`, {
      matches: 0,
      selector,
    });
  }
  if (matches.length > 1) {
    throw new SectionLocatorError(
      "AMBIGUOUS_MATCH",
      `section-locator: ${matches.length} sections match ${describeSelector(selector)}; disambiguate with a path selector`,
      { matches: matches.length, selector },
    );
  }
  return matches[0];
}

function lineMatcher(match) {
  if (match.kind === "exact") return (content) => content === match.text;
  const regex = new RegExp(match.source, match.flags);
  return (content) => regex.test(content);
}

function locateLines(source, selector) {
  const section = selector.within === null ? null : resolveSection(source, selector.within);
  const starts = lineStarts(source);
  const matches = lineMatcher(selector.match);
  const indices = [];
  for (let index = 0; index < starts.length; index += 1) {
    const span = lineSpan(source, starts, index);
    if (section !== null && (span.start < section.start || span.start >= section.end)) continue;
    if (matches(span.content)) indices.push(index);
  }
  if (indices.length === 0) {
    throw new SectionLocatorError("NO_MATCH", `section-locator: no line matches ${describeSelector(selector)}`, {
      matches: 0,
      selector,
    });
  }
  const contiguous = indices.every((index, position) => position === 0 || index === indices[position - 1] + 1);
  if (!contiguous) {
    throw new SectionLocatorError(
      "AMBIGUOUS_MATCH",
      `section-locator: ${indices.length} non-adjacent lines match ${describeSelector(selector)}; a range is contiguous`,
      { matches: indices.length, selector },
    );
  }
  const first = lineSpan(source, starts, indices[0]);
  const last = lineSpan(source, starts, indices[indices.length - 1]);
  return makeRange(source, starts, "line-range", first.start, last.end, section, selector);
}

function makeRange(source, starts, kind, start, end, section, selector) {
  const [range] = attachByteOffsets(source, [{ start, end }]);
  return {
    kind,
    start,
    end,
    byteStart: range.byteStart,
    byteEnd: range.byteEnd,
    text: source.slice(start, end),
    lines: [lineAt(starts, start), endLineAt(starts, start, end)],
    section,
    selector,
  };
}

/**
 * locate(markdown, selector) — the single section or line range a selector
 * names. Raises `SectionLocatorError` on `NO_MATCH`, `AMBIGUOUS_MATCH` and
 * `BAD_SELECTOR`; callers decide whether a miss is fatal.
 */
export function locate(markdown, selector) {
  const source = assertSource(markdown);
  const normalized = normalizeSelector(selector);
  if (normalized.kind === "line") return locateLines(source, normalized);
  const section = resolveSection(source, normalized);
  return makeRange(source, lineStarts(source), "section", section.start, section.end, section, normalized);
}

/**
 * splice(markdown, selector, replacement) — the source string with exactly the
 * located range replaced. `{text, range}`; untouched bytes are the source's.
 */
export function splice(markdown, selector, replacement) {
  if (typeof replacement !== "string") {
    throw new TypeError(`section-locator: the replacement must be a string, got ${typeof replacement}`);
  }
  const source = assertSource(markdown);
  const range = locate(source, selector);
  return { text: source.slice(0, range.start) + replacement + source.slice(range.end), range };
}

/** remove(markdown, selector) — splice the range away. */
export function remove(markdown, selector) {
  return splice(markdown, selector, "");
}

/** replace(markdown, selector, replacement) — splice the range to new text. */
export function replace(markdown, selector, replacement) {
  return splice(markdown, selector, replacement);
}
