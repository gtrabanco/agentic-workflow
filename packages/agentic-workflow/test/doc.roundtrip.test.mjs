/**
 * Lossless roundtrip golden (issue #366, S6 / AC1 of the carried 71 SPEC).
 *
 * The AC's bar — "MD → AST → MD is byte-identical on unchanged input, proven
 * against the golden fixtures and every `skills/**` doc" — is delivered
 * through the splice design (unit D2): a locate through the AST plus a
 * byte-offset splice of the source's own bytes. The roundtrip a consumer
 * actually runs is the no-op `doc edit`: replace every located section with
 * its own located text and the file must come back byte-identical — which is
 * exactly what this golden drives over every file of the corpus.
 *
 * The allowed-normalizations list, pinned explicitly as the AC requires:
 *
 *   ALLOWED_NORMALIZATIONS = []
 *
 * Empty by construction: the writer never re-serializes, so there is no
 * normalization to allow. The list is a contract — widening it means a
 * serializer entered the pipeline, and that is the D8 re-trigger.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, it } from "node:test";

import { listSections, replace } from "../src/doc/section-locator.mjs";

/** The explicit allowed-normalizations list: empty is the contract (D2). */
export const ALLOWED_NORMALIZATIONS = Object.freeze([]);

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** The golden corpus: every `skills/**` Markdown doc, sorted by path. */
function skillDocs() {
  const walk = (dir) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".md") ? [path.join(dir, e.name)] : []));
  return walk(path.join(REPO_ROOT, "skills")).sort();
}

const DIRS = new Set();
after(() => {
  for (const dir of DIRS) fs.rmSync(dir, { recursive: true, force: true });
});

/** A stubborn one-file fixture: frontmatter, setext prose, fenced Markdown
 *  carrying `## `-like lines, inline code, unicode, a CRLF line, trailing
 *  spaces and no final newline. */
function stubbornFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "doc366-rt-"));
  DIRS.add(dir);
  const file = path.join(dir, "stubborn.md");
  fs.writeFileSync(
    file,
    [
      "---",
      "type: feature",
      "scope: small",
      "---",
      "# Stubborn 标题 🚀",
      "",
      "Setext prose",
      "============",
      "",
      "```markdown",
      "## Not a heading",
      "### also not",
      "```",
      "",
      "## Real 有 section",
      "",
      "- item with `## inline` code",
      "  ",
      "#### Deep 深度",
      "",
      "tail no newline",
    ].join("\n"),
    "utf8",
  );
  return file;
}

describe("roundtrip golden (S6/AC1, splice design)", () => {
  it("carries the empty allowed-normalizations contract", () => {
    assert.deepEqual([...ALLOWED_NORMALIZATIONS], []);
  });

  // The corpus no-op edit re-parses per section (536+ full AST parses over
  // the corpus) — that O(n²) is the golden's honest cost, so the test
  // carries its own timeout above the runners' defaults.
  it(
    "no-op splices every section of every skills/** doc byte-identically",
    { timeout: 300_000 },
    () => {
    const docs = skillDocs();
    assert.ok(docs.length > 50, `the corpus shrunk: ${docs.length} docs`);
    let sections = 0;
    for (const file of docs) {
      const relative = path.relative(REPO_ROOT, file);
      const source = fs.readFileSync(file, "utf8");
      const located = listSections(source);
      assert.ok(located.length > 0, `${relative}: no sections located`);
      for (const section of located) {
        sections += 1;
        assert.ok(section.start >= 0 && section.end <= source.length && section.start < section.end, `${relative}: bounds of ${section.title}`);
        const round = replace(source, { path: section.path }, source.slice(section.start, section.end)).text;
        assert.equal(round, source, `${relative}: no-op edit of "${section.path.join(" > ")}" must return the original bytes`);
      }
    }
    assert.ok(sections > 500, `the corpus shrunk: ${sections} sections`);
    },
  );

  it("survives the stubborn fixture (frontmatter, setext, fences, unicode, CRLF)", () => {
    const file = stubbornFixture();
    const source = fs.readFileSync(file, "utf8");
    const located = listSections(source);
    // The setext heading and the fenced decoys are never sections; the ATX
    // sections are `# Stubborn 标题 🚀`, its `##` child and the `####` leaf.
    assert.deepEqual(located.map((s) => `${s.depth}:${s.title}`), ["1:Stubborn 标题 🚀", "2:Real 有 section", "4:Deep 深度"]);
    assert.equal(located[0].end, source.length, "the last open section runs to end-of-document");
    for (const section of located) {
      const round = replace(source, { path: section.path }, source.slice(section.start, section.end)).text;
      assert.equal(round, source, `no-op edit of "${section.path.join(" > ")}" must return the original bytes`);
    }
  });
});
