/**
 * section-locator.d.mts — the type projection of `section-locator.mjs`.
 *
 * A projection, never a second contract: the names declared here and the runtime
 * exports of the module are compared by `test/doc.section-locator.test.mjs`, so a
 * new export cannot appear in one and not the other.
 */

/** A regular expression in its JSON form, for callers that carry a selector as data. */
export interface RegexSource {
  source: string;
  flags?: string;
}

/** A line selector: a whole-line match, optionally scoped to one section. */
export interface LineSelector {
  /** Section scope; omitted or `null` searches the whole document. */
  within?: SectionSelector | null;
  /** Exact line content (terminator excluded), or a regex over that content. */
  line: string | RegExp | RegexSource;
}

/** Every accepted selector spelling. */
export type SectionSelector =
  | string
  | string[]
  | { heading: string }
  | { path: string[] }
  | { headingRegex: RegExp | RegexSource }
  | LineSelector;

/** The selector after normalization, JSON-serializable for the CLI envelope. */
export type NormalizedSelector =
  | { kind: "title"; title: string }
  | { kind: "path"; path: string[] }
  | { kind: "heading-regex"; source: string; flags: string }
  | { kind: "line"; within: NormalizedSelector | null; match: { kind: "exact"; text: string } | { kind: "regex"; source: string; flags: string } };

/** One root ATX section. Offsets are UTF-16 indices; the byte fields are UTF-8. */
export interface SectionDescriptor {
  depth: number;
  title: string;
  path: string[];
  start: number;
  end: number;
  byteStart: number;
  byteEnd: number;
  /** Whole section, 1-based inclusive. */
  lines: [number, number];
  /** The heading line, 1-based inclusive. */
  headingLines: [number, number];
}

/** A located section or line range, with the source bytes it owns. */
export interface SectionRange {
  kind: "section" | "line-range";
  start: number;
  end: number;
  byteStart: number;
  byteEnd: number;
  text: string;
  lines: [number, number];
  /** The scope section for a line range; the located section for a section. */
  section: SectionDescriptor | null;
  selector: NormalizedSelector;
}

export type SectionErrorCode = "NO_MATCH" | "AMBIGUOUS_MATCH" | "BAD_SELECTOR";

export declare const SECTION_ERROR_CODES: readonly SectionErrorCode[];

export declare class SectionLocatorError extends Error {
  readonly code: SectionErrorCode;
  readonly matches: number;
  readonly selector: NormalizedSelector | null;
  constructor(code: SectionErrorCode, message: string, details?: { matches?: number; selector?: NormalizedSelector | null });
}

export declare function listSections(markdown: string): SectionDescriptor[];
export declare function locate(markdown: string, selector: SectionSelector): SectionRange;
export declare function splice(markdown: string, selector: SectionSelector, replacement: string): { text: string; range: SectionRange };
export declare function remove(markdown: string, selector: SectionSelector): { text: string; range: SectionRange };
export declare function replace(markdown: string, selector: SectionSelector, replacement: string): { text: string; range: SectionRange };
