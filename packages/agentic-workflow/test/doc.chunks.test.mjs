/**
 * Tests for the fence-aware section chunker (unit 65, P4a — D5's chunking).
 *
 * A chunk is one ATX-heading-delimited section found by a fence-aware scanner
 * (a `#` inside a fenced code block is never a heading); the id is
 * `<relative-path>#<slug of the heading path>` with `-2` style dedupe,
 * derived only from content — no timestamps, no mtimes — so ids are stable
 * across sync runs (AC2/AC12). `lines` is 1-based inclusive.
 *
 * D20 auto-truncation (issue #470): `scanChunks` accepts an optional third
 * parameter `maxChunkChars`; chunk bodies exceeding it are automatically
 * truncated (never skipped) and counted in `truncated`.
 */

import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual, ok } from "node:assert";

import { scanChunks } from "../src/doc/chunks.mjs";

/** Helper: extract the `chunks` array from the `{ chunks, truncated }` return value. */
function chunksOnly(result) {
  return result.chunks;
}

describe("doc chunker (D5)", () => {
  it("splits on ATX headings with a preamble chunk and 1-based inclusive lines", () => {
    const md = ["intro line", "", "# One", "body one", "", "## Two", "body two", ""].join("\n");
    const result = scanChunks(md, "a.md");
    const chunks = chunksOnly(result);
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
    const result = scanChunks(md, "n.md");
    const chunks = chunksOnly(result);
    const ids = chunks.map((c) => c.id);
    ok(ids.includes("n.md#a"));
    ok(ids.includes("n.md#a-b"));
    ok(ids.includes("n.md#c"));
    // duplicate "B" under a different parent is NOT deduped (different heading path)
    ok(ids.includes("n.md#c-b"));
  });

  it("dedupes identical heading paths with -2", () => {
    const md = ["## A", "x", "", "## A", "y"].join("\n");
    const result = scanChunks(md, "d.md");
    const chunks = chunksOnly(result);
    strictEqual(chunks[0].id, "d.md#a");
    strictEqual(chunks[1].id, "d.md#a-2");
  });

  it("never treats a # inside a fenced code block as a heading", () => {
    const md = ["# Real", "```bash", "# not a heading", "echo hi", "```", "tail"].join("\n");
    const result = scanChunks(md, "f.md");
    const chunks = chunksOnly(result);
    strictEqual(chunks.length, 1); // heading on line 1 ⇒ empty preamble range ⇒ no preamble chunk
    deepStrictEqual(chunks[0].lines, [1, 6]);
    ok(chunks[0].body.includes("# not a heading"));
  });

  it("never reads a heading out of a list continuation that opens with `## ` (S15/A7)", () => {
    // The real shape (skills/triage-issue/references/ISSUE_PROCESS.md): the
    // carrier name wraps across lines inside a list item, so the continuation
    // line starts with `## ` at the item's content column. It is paragraph text,
    // never a root heading — and the chunker must read it exactly as the tree does.
    const md = [
      "# Guide",
      "",
      "- repairable as-is → fold into the phase, or",
      "  append the row to the carrier — `SPEC.md",
      "  ## Findings` for a migrated unit, `review-findings.md` for a legacy one.",
      "",
      "## Real",
      "",
      "body",
    ].join("\n");
    const result = scanChunks(md, "nested.md");
    const chunks = chunksOnly(result);
    deepStrictEqual(
      chunks.filter((chunk) => chunk.section !== null).map((chunk) => chunk.section),
      ["Guide", "Guide > Real"],
    );
    ok(chunks[0].body.includes("## Findings` for a migrated unit"));
  });

  it("never closes a fence on a shorter one, so a nested example is never a heading (S14/A6)", () => {
    const md = [
      "# Real",
      "````markdown",
      "## example inside a four-backtick block",
      "```",
      "## still quoted after the inner fence",
      "````",
      "tail",
      "",
      "## After",
      "",
      "after body",
    ].join("\n");
    const result = scanChunks(md, "nested.md");
    const chunks = chunksOnly(result);
    deepStrictEqual(
      chunks.filter((chunk) => chunk.section !== null).map((chunk) => chunk.section),
      ["Real", "Real > After"],
    );
    ok(chunks[0].body.includes("## example inside a four-backtick block"));
    ok(chunks[0].body.includes("## still quoted after the inner fence"));
    strictEqual(chunks[1].id, "nested.md#real-after");
  });

  it("handles tilde fences and indented fences the same way", () => {
    const md = ["# T", "~~~", "# fenced", "~~~", "end"].join("\n");
    const result = scanChunks(md, "t.md");
    const chunks = chunksOnly(result);
    strictEqual(chunks.length, 1);
    ok(chunks[0].body.includes("# fenced"));
  });

  it("strips frontmatter from chunk bodies and exposes it as meta", () => {
    const md = ["---", "name: my-skill", "triggers: alpha, beta", "---", "", "# Body", "x"].join("\n");
    const result = scanChunks(md, "s.md");
    const chunks = chunksOnly(result);
    deepStrictEqual(chunks[0].meta, { name: "my-skill", triggers: ["alpha", "beta"] });
    ok(!chunks[0].body.includes("name:"));
  });

  it("clamps the preamble chunk's lines to the post-frontmatter body (F19)", () => {
    // frontmatter ends at line 3, so the preamble body occupies lines 4-5:
    // `lines` must start at 4, never at 1 (a consumer slicing by `lines`
    // would otherwise land inside the frontmatter block).
    const md = ["---", "name: x", "---", "intro line", "", "# One", "body"].join("\n");
    const result = scanChunks(md, "p.md");
    const chunks = chunksOnly(result);
    deepStrictEqual(chunks[0].lines, [4, 5]);
    ok(chunks[0].body.startsWith("intro line"));
    ok(!chunks[0].body.includes("---"));
  });

  it("a trailing newline is one phantom split element, never a line (F47)", () => {
    // '# A', '', 'text line' are the file's 3 real lines; the final \n ends
    // line 3 and must not become a 4th line (VF-46: lines [1,4] for a 3-line file).
    const result = scanChunks("# A\n\ntext line\n", "x.md");
    const chunks = chunksOnly(result);
    strictEqual(chunks.length, 1);
    deepStrictEqual(chunks[0].lines, [1, 3]);
    ok(chunks[0].body.includes("text line"));
    // a genuinely blank final line still counts as a line
    const blank = scanChunks("# A\n\ntext line\n\n", "y.md");
    deepStrictEqual(chunksOnly(blank)[0].lines, [1, 4]);
  });

  it("is deterministic: same input yields byte-identical ids and lines", () => {
    const md = ["# A", "one", "", "## A", "two"].join("\n");
    const a = scanChunks(md, "x.md");
    const b = scanChunks(md, "x.md");
    deepStrictEqual(a, b);
  });
});

// ── D20: auto-truncate chunks (issue #470) ────────────────────────────────

describe("D20 auto-truncate", () => {
  it("no limit: all chunks are emitted unchanged, truncated is 0", () => {
    const md = ["# A", "short body"].join("\n");
    const result = scanChunks(md, "x.md");
    strictEqual(result.chunks.length, 1);
    strictEqual(result.chunks[0].section, "A");
    strictEqual(result.truncated, 0);
  });

  it("limit set: chunks exceeding the limit are truncated to fit, never skipped", () => {
    const md = "# A\n" + "x".repeat(100); // 100+ char body
    const result = scanChunks(md, "x.md", 50);
    strictEqual(result.chunks.length, 1, "the chunk stays in the index");
    strictEqual(result.chunks[0].body.length, 50, "the body is cut to the limit");
    strictEqual(result.truncated, 1);
  });

  it("limit set: chunks at or below the limit are kept unchanged", () => {
    const md = "# A\n" + "x".repeat(20); // 24-char body, well under 50
    const result = scanChunks(md, "x.md", 50);
    strictEqual(result.chunks.length, 1);
    strictEqual(result.chunks[0].body.length, 24);
    strictEqual(result.truncated, 0);
  });

  it("limit set: only oversized sections are truncated, the rest are untouched", () => {
    const md = ["# Short", "short body", "", "# Long", "y".repeat(200)].join("\n");
    const result = scanChunks(md, "a.md", 50);
    strictEqual(result.chunks.length, 2, "both sections stay in the index");
    strictEqual(result.chunks[0].body.length, 19, "`# Short\nshort body` is untouched");
    strictEqual(result.chunks[1].body.length, 50);
    strictEqual(result.truncated, 1);
  });

  it("limit 0 (default): all bodies unchanged, truncated is 0", () => {
    const md = "# A\n" + "x".repeat(9999);
    const result = scanChunks(md, "x.md", 0);
    strictEqual(result.chunks.length > 0, true);
    strictEqual(result.truncated, 0);
  });

  it("limit undefined (default): all bodies unchanged, truncated is 0", () => {
    const md = "# A\n" + "x".repeat(9999);
    const result = scanChunks(md, "x.md");
    strictEqual(result.chunks.length > 0, true);
    strictEqual(result.truncated, 0);
  });

  it("preamble chunks are also truncated when oversized", () => {
    const md = "preamble line\n" + "x".repeat(100) + "\n\n# Heading\ntext";
    const result = scanChunks(md, "p.md", 30);
    strictEqual(result.chunks.length, 2);
    strictEqual(result.chunks[0].section, null);
    strictEqual(result.chunks[0].body.length, 30);
    strictEqual(result.truncated, 1);
  });

  it("truncation is deterministic: same input and limit yield identical output", () => {
    const md = "# A\n" + "x".repeat(500);
    const a = scanChunks(md, "x.md", 100);
    const b = scanChunks(md, "x.md", 100);
    deepStrictEqual(a, b);
  });
});
