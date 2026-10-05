/**
 * Tests for the fence-aware section chunker (unit 65, P4a — D5's chunking).
 *
 * A chunk is one ATX-heading-delimited section found by a fence-aware scanner
 * (a `#` inside a fenced code block is never a heading); the id is
 * `<relative-path>#<slug of the heading path>` with `-2` style dedupe,
 * derived only from content — no timestamps, no mtimes — so ids are stable
 * across sync runs (AC2/AC12). `lines` is 1-based inclusive.
 */

import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual, ok } from "node:assert";

import { scanChunks } from "../src/doc/chunks.mjs";

describe("doc chunker (D5)", () => {
  it("splits on ATX headings with a preamble chunk and 1-based inclusive lines", () => {
    const md = ["intro line", "", "# One", "body one", "", "## Two", "body two", ""].join("\n");
    const chunks = scanChunks(md, "a.md");
    strictEqual(chunks.length, 3);
    // preamble: section null, id `<path>#`
    strictEqual(chunks[0].section, null);
    strictEqual(chunks[0].id, "a.md#");
    deepStrictEqual(chunks[0].lines, [1, 2]);
    strictEqual(chunks[1].section, "One");
    deepStrictEqual(chunks[1].lines, [3, 5]);
    strictEqual(chunks[2].section, "One > Two"); // section carries the heading path (matches the id slug, disambiguates duplicate titles)
    deepStrictEqual(chunks[2].lines, [6, 7]); // the trailing \n ends line 7 — the phantom 8th line was F47's overshoot
    ok(chunks[1].body.includes("body one"));
    ok(!chunks[1].body.includes("intro line"));
  });

  it("builds the heading path into the slug (nested sections stay unique)", () => {
    const md = ["# A", "", "## B", "text", "", "# C", "", "## B", "other"].join("\n");
    const chunks = scanChunks(md, "n.md");
    const ids = chunks.map((c) => c.id);
    ok(ids.includes("n.md#a"));
    ok(ids.includes("n.md#a-b"));
    ok(ids.includes("n.md#c"));
    // duplicate "B" under a different parent is NOT deduped (different heading path)
    ok(ids.includes("n.md#c-b"));
  });

  it("dedupes identical heading paths with -2", () => {
    const md = ["## A", "x", "", "## A", "y"].join("\n");
    const chunks = scanChunks(md, "d.md");
    strictEqual(chunks[0].id, "d.md#a");
    strictEqual(chunks[1].id, "d.md#a-2");
  });

  it("never treats a # inside a fenced code block as a heading", () => {
    const md = ["# Real", "```bash", "# not a heading", "echo hi", "```", "tail"].join("\n");
    const chunks = scanChunks(md, "f.md");
    strictEqual(chunks.length, 1); // heading on line 1 ⇒ empty preamble range ⇒ no preamble chunk
    deepStrictEqual(chunks[0].lines, [1, 6]);
    ok(chunks[0].body.includes("# not a heading"));
  });

  it("handles tilde fences and indented fences the same way", () => {
    const md = ["# T", "~~~", "# fenced", "~~~", "end"].join("\n");
    const chunks = scanChunks(md, "t.md");
    strictEqual(chunks.length, 1);
    ok(chunks[0].body.includes("# fenced"));
  });

  it("strips frontmatter from chunk bodies and exposes it as meta", () => {
    const md = ["---", "name: my-skill", "triggers: alpha, beta", "---", "", "# Body", "x"].join("\n");
    const [preamble] = scanChunks(md, "s.md");
    deepStrictEqual(preamble.meta, { name: "my-skill", triggers: ["alpha", "beta"] });
    ok(!preamble.body.includes("name:"));
  });

  it("clamps the preamble chunk's lines to the post-frontmatter body (F19)", () => {
    // frontmatter ends at line 3, so the preamble body occupies lines 4-5:
    // `lines` must start at 4, never at 1 (a consumer slicing by `lines`
    // would otherwise land inside the frontmatter block).
    const md = ["---", "name: x", "---", "intro line", "", "# One", "body"].join("\n");
    const [preamble] = scanChunks(md, "p.md");
    deepStrictEqual(preamble.lines, [4, 5]);
    ok(preamble.body.startsWith("intro line"));
    ok(!preamble.body.includes("---"));
  });

  it("a trailing newline is one phantom split element, never a line (F47)", () => {
    // '# A', '', 'text line' are the file's 3 real lines; the final \n ends
    // line 3 and must not become a 4th line (VF-46: lines [1,4] for a 3-line file).
    const chunks = scanChunks("# A\n\ntext line\n", "x.md");
    strictEqual(chunks.length, 1);
    deepStrictEqual(chunks[0].lines, [1, 3]);
    ok(chunks[0].body.includes("text line"));
    // a genuinely blank final line still counts as a line
    const blank = scanChunks("# A\n\ntext line\n\n", "y.md");
    deepStrictEqual(blank[0].lines, [1, 4]);
  });

  it("is deterministic: same input yields byte-identical ids and lines", () => {
    const md = ["# A", "one", "", "## A", "two"].join("\n");
    const a = scanChunks(md, "x.md");
    const b = scanChunks(md, "x.md");
    deepStrictEqual(a, b);
  });
});
