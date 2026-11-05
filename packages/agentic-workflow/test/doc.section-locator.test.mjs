/**
 * section-locator suite (issue #407) — the red-first corpus for the AST-based
 * section/range locator.
 *
 * The corpus is the defect class the request names, not a happy path:
 *
 *   C1  a fenced `## `-like line is never a heading (S2, S9) — the fence-blind
 *       `indexOf` scan the existing `UnitDoc.setSection` still carries;
 *   C2  nested headings span to the next heading of depth <= their own (S4);
 *   C3  multi-byte content: offsets are UTF-16 indices and the byte fields are
 *       derived, proven on astral and CJK text (S13);
 *   C7  frontmatter `---` / setext / blockquote headings never become sections —
 *       an mdast setext heading would otherwise swallow the frontmatter;
 *   C8  untouched bytes are byte-identical for every operation (S8);
 *   C9  the dependency is exact-pinned in the runner crate only, and the
 *       published type projection matches the runtime exports (S6, S5).
 *
 * C4 (the typed 0/>1 error, S10) and C6 (line-in-scope, S4) ride the selector
 * describe blocks. Nothing here is padded: every case maps to an S# or to the
 * regression boundary the SPEC declares.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  SECTION_ERROR_CODES,
  SectionLocatorError,
  listSections,
  locate,
  remove,
  replace,
  splice,
} from "../src/doc/section-locator.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const readRepo = (relative) => fs.readFileSync(path.join(REPO, relative), "utf8");

/** UTF-8 bytes of a slice, so "byte-identical" is compared as bytes. */
const bytes = (text) => Buffer.from(text, "utf8");

/** The whole-point invariant: the splices carry every untouched byte through. */
function assertOnlyRangeChanged(source, result) {
  const { range } = result;
  assert.equal(result.text.slice(0, range.start), source.slice(0, range.start));
  assert.equal(result.text.slice(result.text.length - (source.length - range.end)), source.slice(range.end));
  assert.ok(bytes(result.text.slice(0, range.start)).equals(bytes(source.slice(0, range.start))));
  assert.ok(bytes(result.text.slice(result.text.length - (source.length - range.end))).equals(bytes(source.slice(range.end))));
}

/** The source document every fencing case runs over (C1). */
const FENCE_TRAP = [
  "# Guide",
  "",
  "## Objective",
  "",
  "body one",
  "",
  "```markdown",
  "## Not a heading",
  "### Also not",
  "```",
  "",
  "> ## quoted, not a section",
  "",
  "## Next steps",
  "",
  "tail",
  "",
].join("\n");

/** Frontmatter + a setext heading + a thematic break (C7). */
const FRONTMATTER_TRAP = ["---", "type: fix", "scope: xs", "---", "", "Setext title", "============", "", "## Real", "", "body", ""].join("\n");

/** Astral + CJK content, so string offsets and byte offsets disagree (C3). */
const MULTI_BYTE = [
  "# Título 🚀",
  "",
  "cuerpo: 日本語 and café",
  "",
  "## Emoji 🚀 Café",
  "",
  "línea: 👩‍👩‍👧‍👦 familia",
  "",
  "## Fin",
  "",
  "último",
  "",
].join("\n");

describe("section table (C1, C2, C7)", () => {
  it("lists only ATX root headings, never a fenced, quoted or setext heading (C1, S2, S9)", () => {
    const titles = listSections(FENCE_TRAP).map((section) => section.title);
    assert.deepEqual(titles, ["Guide", "Objective", "Next steps"]);
  });

  it("spans a section to the next heading of depth <= its own, fence and quote included (C1, S4)", () => {
    const section = locate(FENCE_TRAP, "Objective").section;
    assert.equal(section.start, FENCE_TRAP.indexOf("## Objective"));
    assert.equal(section.end, FENCE_TRAP.indexOf("## Next steps"));
    const text = FENCE_TRAP.slice(section.start, section.end);
    assert.ok(text.includes("## Not a heading"), "the fenced heading stays inside the section");
    assert.ok(text.includes("> ## quoted, not a section"), "the quoted heading stays inside the section");
    assert.ok(!text.includes("## Next steps"));
  });

  it("never resolves a fenced heading-like line by title (C1, S9)", () => {
    assert.throws(() => locate(FENCE_TRAP, "Not a heading"), (error) => {
      assert.ok(error instanceof SectionLocatorError);
      assert.equal(error.code, "NO_MATCH");
      assert.equal(error.matches, 0);
      return true;
    });
  });

  it("treats a leading run of up to three spaces as an ATX heading (CommonMark)", () => {
    const md = ["## A", "", "   ## Indented", "", "body", ""].join("\n");
    const titles = listSections(md).map((section) => section.title);
    assert.deepEqual(titles, ["A", "Indented"]);
  });

  it("never turns frontmatter, a setext heading or a thematic break into a section (C7)", () => {
    const sections = listSections(FRONTMATTER_TRAP);
    assert.deepEqual(sections.map((section) => section.title), ["Real"]);
    assert.equal(sections[0].start, FRONTMATTER_TRAP.indexOf("## Real"));
  });

  it("makes a depth-1 section span the whole document (C2)", () => {
    const guide = locate(FENCE_TRAP, "Guide").section;
    assert.equal(guide.start, 0);
    assert.equal(guide.end, FENCE_TRAP.length);
  });

  it("builds a depth-aware heading path, so a nested title is addressable (C2, S4)", () => {
    const md = ["# Root", "", "## Parent", "", "### Child", "", "#### Grandchild", "", "## Sibling", ""].join("\n");
    const paths = listSections(md).map((section) => section.path);
    assert.deepEqual(paths, [
      ["Root"],
      ["Root", "Parent"],
      ["Root", "Parent", "Child"],
      ["Root", "Parent", "Child", "Grandchild"],
      ["Root", "Sibling"],
    ]);
    const child = locate(md, ["Root", "Parent", "Child"]).section;
    assert.equal(child.start, md.indexOf("### Child"));
    assert.equal(child.end, md.indexOf("## Sibling"), "a level-3 section ends at the next level-2 heading");
  });
});

describe("selector resolution (C4, C6, S4, S10)", () => {
  const SELECTORS = ["## Evidence", "", "preamble line", "", "| AC | What was run |", "|---|---|", "| AC1 | bun test |", "| AC2 | bun test |", "", "continuation one", "continuation two", "", "## Next", "", "tail", ""].join("\n");

  it("resolves a title selector anywhere in the tree (S4)", () => {
    assert.equal(locate(FENCE_TRAP, "Next steps").start, FENCE_TRAP.indexOf("## Next steps"));
  });

  it("resolves an explicit path form and a heading regex form (S4)", () => {
    const byPath = locate(FENCE_TRAP, { path: ["Guide", "Objective"] });
    assert.equal(byPath.start, FENCE_TRAP.indexOf("## Objective"));
    const byRegex = locate(FENCE_TRAP, { headingRegex: /^Next/ });
    assert.equal(byRegex.start, FENCE_TRAP.indexOf("## Next steps"));
  });

  it("resolves a line-in-scope exact selector and carries the line terminator (C6)", () => {
    const range = locate(SELECTORS, { within: "Evidence", line: "| AC2 | bun test |" });
    assert.equal(range.kind, "line-range");
    assert.deepEqual(range.lines, [8, 8]);
    assert.equal(SELECTORS.slice(range.start, range.end), "| AC2 | bun test |\n");
    assert.equal(range.section.title, "Evidence");
  });

  it("resolves a line-in-scope regex and joins adjacent matches into one range (C6)", () => {
    const range = locate(SELECTORS, { within: "Evidence", line: /^continuation / });
    assert.deepEqual(range.lines, [10, 11]);
    assert.equal(SELECTORS.slice(range.start, range.end), "continuation one\ncontinuation two\n");
  });

  it("scopes a line selector to the whole document when no scope is given (C6)", () => {
    const range = locate(SELECTORS, { line: "| AC1 | bun test |" });
    assert.deepEqual(range.lines, [7, 7]);
    assert.equal(range.section, null);
  });

  it("raises NO_MATCH for a selector that resolves to nothing (C4, S10)", () => {
    for (const selector of ["Nope", { path: ["Guide", "Nope"] }, { headingRegex: /^Nope$/ }, { line: "absent line" }]) {
      assert.throws(() => locate(FENCE_TRAP, selector), (error) => error.code === "NO_MATCH" && error.matches === 0);
    }
  });

  it("raises AMBIGUOUS_MATCH when more than one section matches (C4, S10)", () => {
    const md = ["## A", "", "body", "", "## A", "", "other", ""].join("\n");
    assert.throws(() => locate(md, "A"), (error) => {
      assert.ok(error instanceof SectionLocatorError);
      assert.equal(error.code, "AMBIGUOUS_MATCH");
      assert.equal(error.matches, 2);
      return true;
    });
  });

  it("raises AMBIGUOUS_MATCH for disjoint line matches and keeps adjacent ones a range (C6)", () => {
    const md = ["## A", "", "keep one", "drop", "keep two", "drop", ""].join("\n");
    assert.throws(() => locate(md, { within: "A", line: "drop" }), (error) => error.code === "AMBIGUOUS_MATCH" && error.matches === 2);
  });

  it("rejects a malformed selector with the typed BAD_SELECTOR code (C4)", () => {
    const malformed = [undefined, null, 42, {}, [], { heading: "A", path: ["A"] }, { headingRegex: "not-a-regexp" }, { line: 5 }, { within: "A" }, { line: "x", heading: "A" }, { line: "x", within: { line: "y" } }];
    for (const selector of malformed) {
      assert.throws(() => locate(FENCE_TRAP, selector), (error) => error instanceof SectionLocatorError && error.code === "BAD_SELECTOR", `selector ${JSON.stringify(selector)}`);
    }
  });

  it("publishes its closed error-code set", () => {
    assert.deepEqual([...SECTION_ERROR_CODES], ["NO_MATCH", "AMBIGUOUS_MATCH", "BAD_SELECTOR"]);
  });
});

describe("lossless splice (C8, S3, S8)", () => {
  it("removes exactly the located range and carries every other byte through (C8, S8)", () => {
    const range = locate(FENCE_TRAP, "Objective");
    const result = remove(FENCE_TRAP, "Objective");
    assert.equal(result.text, FENCE_TRAP.slice(0, range.start) + FENCE_TRAP.slice(range.end));
    assertOnlyRangeChanged(FENCE_TRAP, result);
  });

  it("replaces exactly the located range with the replacement text (S3)", () => {
    const range = locate(FENCE_TRAP, "Objective");
    const body = "## Objective\n\nreplacement\n\n";
    const result = replace(FENCE_TRAP, "Objective", body);
    assert.equal(result.text, FENCE_TRAP.slice(0, range.start) + body + FENCE_TRAP.slice(range.end));
    assert.equal(splice(FENCE_TRAP, "Objective", body).text, result.text);
    assertOnlyRangeChanged(FENCE_TRAP, result);
  });

  it("is a byte-identical no-op when the replacement equals the located text (C8, S8)", () => {
    for (const selector of ["Objective", "Guide", "Next steps"]) {
      const range = locate(FENCE_TRAP, selector);
      assert.equal(replace(FENCE_TRAP, selector, range.text).text, FENCE_TRAP);
      assert.equal(replace(FENCE_TRAP, selector, range.text).text.length, FENCE_TRAP.length);
    }
  });

  it("removes a nested section without touching its parent's other children (C2, C8)", () => {
    const md = ["## Parent", "", "keep before", "", "### Child", "", "drop me", "", "## After", "", "keep after", ""].join("\n");
    const result = remove(md, { path: ["Parent", "Child"] });
    assert.ok(!result.text.includes("drop me"));
    assert.ok(result.text.includes("keep before"));
    assert.ok(result.text.includes("keep after"));
    assertOnlyRangeChanged(md, result);
  });

  it("splices a multi-byte document without shifting a single byte (C3, S13)", () => {
    const range = locate(MULTI_BYTE, { path: ["Título 🚀", "Emoji 🚀 Café"] });
    assert.equal(range.start, MULTI_BYTE.indexOf("## Emoji 🚀 Café"));
    assert.equal(range.end, MULTI_BYTE.indexOf("## Fin"));
    assert.equal(range.byteStart, bytes(MULTI_BYTE.slice(0, range.start)).length);
    assert.equal(range.byteEnd, bytes(MULTI_BYTE.slice(0, range.end)).length);
    assert.notEqual(range.end, range.byteEnd, "the string offset and the byte offset are different quantities");

    const removed = remove(MULTI_BYTE, { path: ["Título 🚀", "Emoji 🚀 Café"] });
    assert.equal(removed.text, MULTI_BYTE.slice(0, range.start) + MULTI_BYTE.slice(range.end));
    assert.ok(bytes(removed.text).equals(Buffer.concat([bytes(MULTI_BYTE.slice(0, range.start)), bytes(MULTI_BYTE.slice(range.end))])));
    assertOnlyRangeChanged(MULTI_BYTE, removed);
  });

  it("reports 1-based inclusive lines that match the source (S4)", () => {
    const section = locate(FENCE_TRAP, "Objective").section;
    const lines = FENCE_TRAP.split("\n");
    assert.equal(lines[section.lines[0] - 1], "## Objective");
    assert.equal(lines[section.headingLines[0] - 1], "## Objective");
    assert.ok(section.lines[1] >= section.lines[0]);
  });

  it("locates the last section to end-of-document even with no trailing newline (S4)", () => {
    const md = "## Only\n\nbody without newline";
    const range = locate(md, "Only");
    assert.equal(range.start, 0);
    assert.equal(range.end, md.length);
    assert.equal(remove(md, "Only").text, "");
  });

  it("handles an empty document without inventing a section (S10)", () => {
    assert.deepEqual(listSections(""), []);
    assert.throws(() => locate("", "Anything"), (error) => error.code === "NO_MATCH");
  });
});

describe("package contract (C9, S5, S6, S11)", () => {
  it("pins the parser exactly in the runner crate (C9, S6)", () => {
    const manifest = JSON.parse(readRepo("packages/agentic-workflow/package.json"));
    const pin = manifest.dependencies["mdast-util-from-markdown"];
    assert.match(pin, /^\d+\.\d+\.\d+$/, `an exact pin, got ${pin}`);
  });

  it("keeps the schema package dependency-free (C9, S6)", () => {
    const manifest = JSON.parse(readRepo("packages/agentic-workflow-schema/package.json"));
    assert.equal(manifest.dependencies, undefined);
  });

  it("records the resolution in the single root lockfile (S11)", () => {
    const lock = readRepo("bun.lock");
    assert.ok(lock.includes('"mdast-util-from-markdown": "2.1.0"'), "the workspace manifest pin is in the lockfile");
    assert.match(lock, /"mdast-util-from-markdown": \["mdast-util-from-markdown@2\.1\.0"/, "the exact resolution is in the lockfile");
  });

  it("declares every runtime export in the published type projection (C9, S5)", () => {
    const projection = readRepo("packages/agentic-workflow/src/doc/section-locator.d.mts");
    const declared = [...projection.matchAll(/^export declare (?:function|const|class) (\w+)/gm)].map((match) => match[1]);
    const runtime = ["SECTION_ERROR_CODES", "SectionLocatorError", "listSections", "locate", "remove", "replace", "splice"];
    assert.deepEqual(declared.sort(), runtime.slice().sort());
  });
});
