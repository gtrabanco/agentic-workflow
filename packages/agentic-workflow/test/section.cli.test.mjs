/**
 * section CLI suite (issue #407) — the dual-surface half of the request (S5).
 *
 * The command is a thin driver over `src/doc/section-locator.mjs`: it must never
 * re-derive a scanner, and its output contract is the crate's — a receipt block
 * on success, the transformed document on stdout when nothing is written, a
 * `SECTION REFUSAL — <code>` refusal (exit 2) when a selector resolves to
 * nothing or to several sections, and a usage error (exit 1) for a malformed
 * invocation. The last case pins the router's previous behaviour: every command
 * the crate shipped before this one still routes, and the usage line still names
 * all of them.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";

import { locate, remove, replace } from "../src/doc/section-locator.mjs";

const CLI = new URL("../bin/agentic-workflow.mjs", import.meta.url).pathname;
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "sl407-cli-"));

after(() => fs.rmSync(ROOT, { recursive: true, force: true }));

let counter = 0;
/** A fresh fixture file per case, so no case can observe another's write. */
function fixture(markdown) {
  counter += 1;
  const file = path.join(ROOT, `fixture-${counter}.md`);
  fs.writeFileSync(file, markdown, "utf8");
  return file;
}

const DOC = [
  "# Guide",
  "",
  "## Objective",
  "",
  "body one",
  "",
  "```markdown",
  "## Not a heading",
  "```",
  "",
  "## Next steps",
  "",
  "tail",
  "",
].join("\n");

function run(args, stdin) {
  const result = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", input: stdin });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("section CLI (S5)", () => {
  it("locates a section and prints the crate receipt block", () => {
    const file = fixture(DOC);
    const result = run(["section", "locate", "--file", file, "--selector", '"Objective"']);
    assert.equal(result.status, 0);
    assert.match(result.stdout, new RegExp(`^EDIT section\\.locate — .*fixture-\\d+\\.md\\n`));
    assert.match(result.stdout, /^Schema: section-splice@1 · Receipt: pass$/m);
    assert.match(result.stdout, /^Range: section · offsets \d+-\d+ · bytes \d+-\d+ · lines \d+-\d+$/m);
    assert.equal(result.stderr, "");
  });

  it("emits exactly one JSON document with --json, matching the library range", () => {
    const file = fixture(DOC);
    const result = run(["section", "locate", "--file", file, "--selector", '{"path":["Guide","Objective"]}', "--json"]);
    assert.equal(result.status, 0);
    const receipt = JSON.parse(result.stdout);
    const expected = locate(DOC, { path: ["Guide", "Objective"] });
    assert.equal(receipt.ok, true);
    assert.equal(receipt.service, "section");
    assert.equal(receipt.op, "locate");
    assert.equal(receipt.schema, "section-splice@1");
    assert.equal(receipt.range.kind, "section");
    assert.equal(receipt.range.start, expected.start);
    assert.equal(receipt.range.end, expected.end);
    assert.equal(receipt.range.byteStart, expected.byteStart);
    assert.deepEqual(receipt.range.section.path, ["Guide", "Objective"]);
  });

  it("prints the transformed document on stdout when nothing is written", () => {
    const file = fixture(DOC);
    const result = run(["section", "remove", "--file", file, "--selector", '"Objective"']);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, remove(DOC, "Objective").text);
    assert.equal(fs.readFileSync(file, "utf8"), DOC, "a read-only run never touches the file");
  });

  it("writes the splice in place with --write and reports the receipt", () => {
    const file = fixture(DOC);
    const body = "## Objective\n\nrewritten\n\n";
    const result = run(["section", "replace", "--file", file, "--selector", '"Objective"', "--replacement", "-", "--write"], body);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /^EDIT section\.replace — /m);
    assert.equal(fs.readFileSync(file, "utf8"), replace(DOC, "Objective", body).text);
  });

  it("removes a line range inside a scope with a JSON regex selector", () => {
    const table = ["## Evidence", "", "| AC | What was run |", "|---|---|", "| AC1 | bun test |", "| AC2 | bun test |", "", "## Next", ""].join("\n");
    const file = fixture(table);
    const selector = JSON.stringify({ within: "Evidence", line: { source: "^\\| AC2 \\|", flags: "" } });
    const result = run(["section", "remove", "--file", file, "--selector", selector]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, remove(table, { within: "Evidence", line: { source: "^\\| AC2 \\|", flags: "" } }).text);
  });

  it("reads the document from stdin with --file -", () => {
    const result = run(["section", "locate", "--file", "-", "--selector", '"Objective"', "--json"], DOC);
    assert.equal(result.status, 0);
    assert.equal(JSON.parse(result.stdout).range.start, DOC.indexOf("## Objective"));
  });
});

describe("section CLI failures (S10)", () => {
  it("refuses a selector that resolves to nothing with exit 2 and the SECTION REFUSAL line", () => {
    const file = fixture(DOC);
    const result = run(["section", "locate", "--file", file, "--selector", '"Nope"']);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /^SECTION REFUSAL — NO_MATCH — /);
    assert.equal(result.stdout, "");
  });

  it("refuses an ambiguous selector and keeps the JSON receipt machine-readable", () => {
    const file = fixture(["## A", "", "one", "", "## A", "", "two", ""].join("\n"));
    const result = run(["section", "remove", "--file", file, "--selector", '"A"', "--json"]);
    assert.equal(result.status, 2);
    const receipt = JSON.parse(result.stdout);
    assert.equal(receipt.ok, false);
    assert.equal(receipt.code, "AMBIGUOUS_MATCH");
    assert.equal(receipt.matches, 2);
    assert.match(result.stderr, /^SECTION REFUSAL — AMBIGUOUS_MATCH — /);
    assert.equal(fs.readFileSync(file, "utf8"), ["## A", "", "one", "", "## A", "", "two", ""].join("\n"), "a refusal writes nothing");
  });

  it("answers a malformed selector as a usage error, not a refusal", () => {
    const file = fixture(DOC);
    for (const selector of ["{}", '"   "', '{"line":5}', "not json"]) {
      const result = run(["section", "locate", "--file", file, "--selector", selector]);
      assert.equal(result.status, 1, `selector ${selector}`);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, /^section: /);
    }
  });

  it("answers a malformed invocation as a usage error (exit 1)", () => {
    const file = fixture(DOC);
    const cases = [
      ["section"],
      ["section", "explode", "--file", file, "--selector", '"A"'],
      ["section", "locate", "--selector", '"A"'],
      ["section", "locate", "--file", file],
      ["section", "locate", "--file", file, "--selector", '"A"', "--write"],
      ["section", "remove", "--file", file, "--selector", '"A"', "--replacement", "-"],
      ["section", "replace", "--file", file, "--selector", '"A"'],
      ["section", "locate", "--file", file, "--selector", '"A"', "--nope"],
      ["section", "locate", "--file", file, "--selector", '"A"', "extra"],
    ];
    for (const args of cases) {
      const result = run(args);
      assert.equal(result.status, 1, `args ${JSON.stringify(args)}`);
      assert.match(result.stderr, /^section: /, `args ${JSON.stringify(args)}`);
    }
  });

  it("reports an unreadable file as a usage/IO error (exit 1)", () => {
    const result = run(["section", "locate", "--file", path.join(ROOT, "missing.md"), "--selector", '"A"']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^section: /);
  });
});

describe("router regression (S11)", () => {
  it("keeps every pre-existing command in the usage line and exits 1 with no command", () => {
    const result = run([]);
    assert.equal(result.status, 1);
    for (const command of ["unit-doc", "roadmap", "changelog", "budgets", "manifest", "doc", "memory", "log", "section"]) {
      assert.ok(result.stderr.includes(command), `usage line names ${command}`);
    }
  });
});
