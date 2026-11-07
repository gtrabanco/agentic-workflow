/**
 * Positional `doc` ops suite (issue #366, unit docs/fix/366-doc-cli) — the
 * half-A branch of the one entry point 65 created.
 *
 * The grammar must keep both spells D2 froze: a first token starting with `-`
 * is retrieval, a positional first token dispatches to `read` / `edit` /
 * `index`. `read` prints the located section's original bytes (title or the
 * D5 id scheme `path#slug`, `-2` dedupe included), `edit` splices a
 * replacement over the located section in place, and both ride #407's
 * section-locator so a fenced `## heading` is never a section. Refusals are
 * printed as `DOC REFUSAL — <code>` on exit 2 before any write; malformed
 * invocations are usage errors on exit 1. The last block pins the router's
 * previous behavior: retrieval grammar keeps its exact shape (S8).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";

import { parseDocArgs } from "../src/doc/grammar.mjs";

const CLI = new URL("../bin/agentic-workflow.mjs", import.meta.url).pathname;
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "doc366-a-"));

after(() => fs.rmSync(ROOT, { recursive: true, force: true }));

let counter = 0;
/** A fresh fixture file per case, so no case can observe another's write. */
function fixture(markdown) {
  counter += 1;
  const file = path.join(ROOT, `fixture-${counter}.md`);
  fs.writeFileSync(file, markdown, "utf8");
  return file;
}

/** Two same-title `## Objective` sections under `# Guide`, plus a fenced decoy. */
const DOC = [
  "# Guide",
  "",
  "## Objective",
  "",
  "body one",
  "",
  "## Objective",
  "",
  "duplicate sibling",
  "",
  "```markdown",
  "## Not a heading",
  "```",
  "",
  "## Next steps",
  "",
  "tail content",
  "",
].join("\n");

/** One title per section, multi-byte content, no frontmatter. */
const UNIQUE_DOC = [
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
  "## Next 步骤 🚀",
  "",
  "tail content",
  "",
].join("\n");

/** The Objective section spans until the next root heading — fence included. */
function objectiveSection(markdown) {
  return markdown.slice(markdown.indexOf("## Objective"), markdown.indexOf("## Next 步骤 🚀"));
}
function tailSection(markdown) {
  return markdown.slice(markdown.indexOf("## Next 步骤 🚀"));
}

function run(args, { stdin, cwd = ROOT } = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", input: stdin, cwd });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("doc positional grammar (S2)", () => {
  it("parses `read --file <path> --section <ref>` into the docop branch", () => {
    const parsed = parseDocArgs(["read", "--file", "a.md", "--section", "Objective"]);
    assert.equal(parsed.branch, "docop");
    assert.equal(parsed.op, "read");
    assert.equal(parsed.file, "a.md");
    assert.equal(parsed.section, "Objective");
    assert.equal(parsed.json, false);
  });

  it("parses `read` without --section (whole-document read)", () => {
    const parsed = parseDocArgs(["read", "--file", "-"]);
    assert.equal(parsed.branch, "docop");
    assert.equal(parsed.op, "read");
    assert.equal(parsed.file, "-");
    assert.equal(parsed.section, null);
  });

  it("accepts --json on the docop branch", () => {
    assert.equal(parseDocArgs(["read", "--file", "a.md", "--json"]).json, true);
  });

  it("parses `edit --file --section --replacement` with --dry-run optional", () => {
    const parsed = parseDocArgs(["edit", "--file", "a.md", "--section", "Objective", "--replacement", "b.md"]);
    assert.equal(parsed.branch, "docop");
    assert.equal(parsed.op, "edit");
    assert.equal(parsed.dryRun, false);
    const dry = parseDocArgs(["edit", "--file", "a.md", "--section", "Objective", "--replacement", "-", "--dry-run"]);
    assert.equal(dry.dryRun, true);
    assert.equal(dry.replacement, "-");
  });

  it("parses `index` with an optional --out", () => {
    assert.equal(parseDocArgs(["index"]).op, "index");
    assert.equal(parseDocArgs(["index", "--out", "idx.json"]).out, "idx.json");
  });

  it("refuses an unknown positional op as a usage error", () => {
    assert.throws(() => parseDocArgs(["watch"]), (e) => e.code === "USAGE" && /read \| edit \| index/.test(e.message));
  });

  it("refuses a retrieval flag after a positional op as a usage error", () => {
    assert.throws(() => parseDocArgs(["read", "--sync"]), (e) => e.code === "USAGE");
    assert.throws(() => parseDocArgs(["index", "--query", "x"]), (e) => e.code === "USAGE");
  });

  it("refuses malformed invocations as usage errors", () => {
    assert.throws(() => parseDocArgs(["edit"]), (e) => e.code === "USAGE" && /--file is required/.test(e.message));
    assert.throws(() => parseDocArgs(["edit", "--file", "-"]), (e) => e.code === "USAGE" && /--file -/.test(e.message), "edit refuses a stdin document");
    assert.throws(() => parseDocArgs(["edit", "--file", "a", "--section", "x"]), (e) => e.code === "USAGE" && /--replacement/.test(e.message));
    assert.throws(() => parseDocArgs(["index", "--out"]), (e) => e.code === "USAGE");
    assert.throws(() => parseDocArgs(["read", "--file"]), (e) => e.code === "USAGE");
  });
});

describe("doc read CLI (S3)", () => {
  it("prints the whole file when --section is absent, byte-identical", () => {
    const file = fixture(UNIQUE_DOC);
    const res = run(["doc", "read", "--file", file]);
    assert.equal(res.status, 0);
    assert.equal(res.stdout, UNIQUE_DOC);
    assert.equal(res.stderr, "");
  });

  it("prints a single section's original bytes by heading title", () => {
    const file = fixture(UNIQUE_DOC);
    const res = run(["doc", "read", "--file", file, "--section", "Next 步骤 🚀"]);
    assert.equal(res.status, 0);
    assert.equal(res.stdout, tailSection(UNIQUE_DOC));
  });

  it("prints one section by its bare D5 slug id (the H1 belongs to the path)", () => {
    const file = fixture(UNIQUE_DOC);
    const res = run(["doc", "read", "--file", file, "--section", "guide-objective"]);
    assert.equal(res.status, 0, `stderr: ${res.stderr}`);
    assert.equal(res.stdout, objectiveSection(UNIQUE_DOC));
  });

  it("prints one section by its path-prefixed D5 id with multi-byte bytes intact", () => {
    const file = fixture(UNIQUE_DOC);
    const name = path.basename(file);
    const res = run(["doc", "read", "--file", file, "--section", `${name}#guide-next`]);
    assert.equal(res.status, 0, `stderr: ${res.stderr}`);
    assert.equal(res.stdout, tailSection(UNIQUE_DOC));
  });

  it("refuses an unknown section title on exit 2 without touching stdout", () => {
    const file = fixture(UNIQUE_DOC);
    const res = run(["doc", "read", "--file", file, "--section", "Nonexistent"]);
    assert.equal(res.status, 2);
    assert.match(res.stderr, /DOC REFUSAL — NO_MATCH/);
    assert.equal(res.stdout, "");
  });

  it("refuses an ambiguous title on exit 2", () => {
    const file = fixture(DOC);
    const res = run(["doc", "read", "--file", file, "--section", "Objective"]);
    assert.equal(res.status, 2);
    assert.match(res.stderr, /DOC REFUSAL — AMBIGUOUS_MATCH/);
  });

  it("never matches a `## heading` line inside a fenced code block", () => {
    const file = fixture(UNIQUE_DOC);
    const res = run(["doc", "read", "--file", file, "--section", "Not a heading"]);
    assert.equal(res.status, 2);
    assert.match(res.stderr, /DOC REFUSAL — NO_MATCH/);
  });

  it("resolves a dedupe id (`-2`) to the second same-title section", () => {
    const file = fixture(DOC);
    const res = run(["doc", "read", "--file", file, "--section", "guide-objective-2"]);
    assert.equal(res.status, 0, `stderr: ${res.stderr}`);
    // The second Objective section spans until the next root heading — the
    // fenced decoy is inside it, which is the point of the fence-aware scan.
    const start = DOC.indexOf("## Objective", DOC.indexOf("## Objective") + 1);
    assert.equal(res.stdout, DOC.slice(start, DOC.indexOf("## Next steps")));
  });

  it("is a usage error when the file cannot be read", () => {
    const res = run(["doc", "read", "--file", path.join(ROOT, "missing.md")]);
    assert.equal(res.status, 1);
    assert.equal(res.stdout, "");
    assert.match(res.stderr, /doc:/);
  });

  it("emits one JSON receipt under --json", () => {
    const file = fixture(UNIQUE_DOC);
    const name = path.basename(file);
    const res = run(["doc", "read", "--file", file, "--section", "Objective", "--json"]);
    assert.equal(res.status, 0);
    const receipt = JSON.parse(res.stdout);
    assert.equal(receipt.ok, true);
    assert.equal(receipt.command, "read");
    assert.equal(receipt.path, file);
    assert.equal(receipt.section.id, `${name}#guide-objective`);
    assert.equal(receipt.section.title, "Objective");
    assert.ok(Array.isArray(receipt.section.lines) && receipt.section.lines.length === 2);
    assert.equal(receipt.bytes, objectiveSection(UNIQUE_DOC).length);
  });

  it("reads the document from stdin with --file -", () => {
    const res = run(["doc", "read", "--file", "-", "--section", "Objective"], { stdin: UNIQUE_DOC });
    assert.equal(res.status, 0);
    assert.equal(res.stdout, objectiveSection(UNIQUE_DOC));
  });
});

describe("doc edit CLI (S4)", () => {
  it("splices the replacement over the located section in place, byte-lossless outside", () => {
    const file = fixture(UNIQUE_DOC);
    const replacement = path.join(ROOT, "replacement.md");
    fs.writeFileSync(replacement, "## Objective\n\nreplaced body\n", "utf8");
    const before = fs.readFileSync(file, "utf8");
    const start = before.indexOf("## Objective");
    const end = before.indexOf("## Next 步骤 🚀");
    const res = run(["doc", "edit", "--file", file, "--section", "Objective", "--replacement", replacement]);
    assert.equal(res.status, 0, `stderr: ${res.stderr}`);
    const after = fs.readFileSync(file, "utf8");
    const inserted = "## Objective\n\nreplaced body\n";
    assert.equal(after, before.slice(0, start) + inserted + before.slice(end));
    assert.equal(after.slice(start + inserted.length), before.slice(end), "every byte after the splice is the source's own");
    assert.match(res.stdout, /doc edit:/);
  });

  it("reads the replacement from stdin with --replacement -", () => {
    const file = fixture(UNIQUE_DOC);
    const res = run(
      ["doc", "edit", "--file", file, "--section", "Next 步骤 🚀", "--replacement", "-"],
      { stdin: "## Next steps\n\nnew tail\n" },
    );
    assert.equal(res.status, 0, `stderr: ${res.stderr}`);
    assert.match(fs.readFileSync(file, "utf8"), /## Next steps\n\nnew tail\n/);
  });

  it("refuses before writing when the section resolves to nothing", () => {
    const file = fixture(UNIQUE_DOC);
    const before = fs.readFileSync(file, "utf8");
    const res = run(["doc", "edit", "--file", file, "--section", "Missing", "--replacement", "-"], { stdin: "x" });
    assert.equal(res.status, 2);
    assert.match(res.stderr, /DOC REFUSAL — NO_MATCH/);
    assert.equal(fs.readFileSync(file, "utf8"), before, "the file must be byte-identical after a refusal");
  });

  it("refuses an ambiguous section before writing", () => {
    const file = fixture(DOC);
    const before = fs.readFileSync(file, "utf8");
    const res = run(["doc", "edit", "--file", file, "--section", "Objective", "--replacement", "-"], { stdin: "x" });
    assert.equal(res.status, 2);
    assert.match(res.stderr, /DOC REFUSAL — AMBIGUOUS_MATCH/);
    assert.equal(fs.readFileSync(file, "utf8"), before);
  });

  it("--dry-run prints the transformed document and writes nothing", () => {
    const file = fixture(UNIQUE_DOC);
    const before = fs.readFileSync(file, "utf8");
    const res = run(["doc", "edit", "--file", file, "--section", "Objective", "--replacement", "-", "--dry-run"], { stdin: "## Objective\n\ndry\n" });
    assert.equal(res.status, 0, `stderr: ${res.stderr}`);
    const start = before.indexOf("## Objective");
    const end = before.indexOf("## Next 步骤 🚀");
    assert.equal(res.stdout, before.slice(0, start) + "## Objective\n\ndry\n" + before.slice(end));
    assert.equal(fs.readFileSync(file, "utf8"), before, "--dry-run must not write");
  });

  it("emits one JSON receipt under --json", () => {
    const file = fixture(UNIQUE_DOC);
    const bytesBefore = Buffer.byteLength(UNIQUE_DOC);
    const res = run(["doc", "edit", "--file", file, "--section", "Next 步骤 🚀", "--replacement", "-", "--json"], { stdin: "## Next steps\n\nnew tail\n" });
    assert.equal(res.status, 0);
    const receipt = JSON.parse(res.stdout);
    assert.equal(receipt.ok, true);
    assert.equal(receipt.command, "edit");
    assert.ok(receipt.section.id.endsWith("#guide-next"), receipt.section.id);
    assert.equal(receipt.bytesBefore, bytesBefore);
    assert.ok(typeof receipt.bytesAfter === "number" && receipt.bytesAfter !== receipt.bytesBefore);
  });

  it("is a usage error when the replacement file cannot be read", () => {
    const file = fixture(UNIQUE_DOC);
    const res = run(["doc", "edit", "--file", file, "--section", "Objective", "--replacement", path.join(ROOT, "missing.md")]);
    assert.equal(res.status, 1);
    assert.equal(fs.readFileSync(file, "utf8"), UNIQUE_DOC);
  });
});

describe("doc edit text spellings (S20)", () => {
  it("splices --set text over the located section, byte-lossless outside", () => {
    const file = fixture(UNIQUE_DOC);
    const start = UNIQUE_DOC.indexOf("## Objective");
    const end = UNIQUE_DOC.indexOf("## Next 步骤 🚀");
    const res = run(["doc", "edit", "--file", file, "--section", "Objective", "--set", "## Objective\n\nset body\n"]);
    assert.equal(res.status, 0, `stderr: ${res.stderr}`);
    assert.equal(fs.readFileSync(file, "utf8"), UNIQUE_DOC.slice(0, start) + "## Objective\n\nset body\n" + UNIQUE_DOC.slice(end));
  });

  it("appends --append text to the section body, on its own block before the next heading", () => {
    const file = fixture(UNIQUE_DOC);
    const start = UNIQUE_DOC.indexOf("## Objective");
    const end = UNIQUE_DOC.indexOf("## Next 步骤 🚀");
    const res = run(["doc", "edit", "--file", file, "--section", "Objective", "--append", "- appended line"]);
    assert.equal(res.status, 0, `stderr: ${res.stderr}`);
    const expected = UNIQUE_DOC.slice(0, start) + UNIQUE_DOC.slice(start, end) + "- appended line\n" + UNIQUE_DOC.slice(end);
    assert.equal(fs.readFileSync(file, "utf8"), expected);
    assert.ok(fs.readFileSync(file, "utf8").includes("- appended line\n## Next 步骤 🚀"));
  });

  it("reads --set and --append text from stdin with `-`", () => {
    const file = fixture(UNIQUE_DOC);
    const res = run(["doc", "edit", "--file", file, "--section", "Objective", "--set", "-"], { stdin: "## Objective\n\nstdin set\n" });
    assert.equal(res.status, 0, `stderr: ${res.stderr}`);
    assert.ok(fs.readFileSync(file, "utf8").includes("## Objective\n\nstdin set\n"));
  });

  it("refuses more than one body source as a usage error", () => {
    const file = fixture(UNIQUE_DOC);
    const before = fs.readFileSync(file, "utf8");
    for (const argv of [
      ["--replacement", "-", "--set", "x"],
      ["--set", "x", "--append", "y"],
    ]) {
      const res = run(["doc", "edit", "--file", file, "--section", "Objective", ...argv], { stdin: "z" });
      assert.equal(res.status, 1, `argv ${argv.join(" ")}: ${res.stderr}`);
      assert.match(res.stderr, /exactly one of --replacement, --set, --append/);
    }
    assert.equal(fs.readFileSync(file, "utf8"), before);
  });
});

describe("stdin selectors (S21)", () => {
  it("refuses a path-qualified id on stdin by name, never `NO_MATCH`", () => {
    const res = run(["doc", "read", "--file", "-", "--section", "some/doc.md#guide-objective"], { stdin: UNIQUE_DOC });
    assert.equal(res.status, 1, `stderr: ${res.stderr}`);
    assert.match(res.stderr, /path-qualified section id needs a real document path/);
    assert.doesNotMatch(res.stderr, /NO_MATCH/);
  });

  it("still resolves a bare slug and a title from stdin", () => {
    for (const ref of ["guide-objective", "Objective"]) {
      const res = run(["doc", "read", "--file", "-", "--section", ref], { stdin: UNIQUE_DOC });
      assert.equal(res.status, 0, `${ref}: ${res.stderr}`);
      assert.equal(res.stdout, objectiveSection(UNIQUE_DOC));
    }
  });
});

describe("retrieval branch unchanged (S8)", () => {
  it("still parses the retrieval flag spellings into the retrieval branch", () => {
    for (const [argv, op] of [
      [["--sync"], "sync"],
      [["--query", "term"], "query"],
      [["--status"], "status"],
      [["--rebuild"], "rebuild"],
    ]) {
      const parsed = parseDocArgs(argv);
      assert.equal(parsed.op, op, `retrieval op ${op} must keep parsing`);
      assert.equal(parsed.branch, undefined);
    }
  });

  it("still refuses a malformed retrieval invocation exit 1 at the CLI", () => {
    const res = run(["doc", "--query"]);
    assert.equal(res.status, 1);
    assert.match(res.stderr, /--query requires a non-empty term/);
  });
});

describe("option grammar (S11)", () => {
  it("refuses --out on read: it belongs to index, and a stray flag is never dropped", () => {
    const file = fixture(UNIQUE_DOC);
    const out = path.join(ROOT, "read-out.json");
    const res = run(["doc", "read", "--file", file, "--out", out]);
    assert.equal(res.status, 1, `stderr: ${res.stderr}`);
    assert.match(res.stderr, /--out belongs to index/);
    assert.equal(fs.existsSync(out), false);
  });

  it("refuses --out on edit and leaves the document untouched", () => {
    const file = fixture(UNIQUE_DOC);
    const out = path.join(ROOT, "edit-out.json");
    const res = run([
      "doc", "edit", "--file", file, "--section", "Objective",
      "--replacement", "-", "--out", out,
    ], { stdin: "## Objective\n\nnope\n" });
    assert.equal(res.status, 1, `stderr: ${res.stderr}`);
    assert.match(res.stderr, /--out belongs to index/);
    assert.equal(fs.existsSync(out), false);
    assert.equal(fs.readFileSync(file, "utf8"), UNIQUE_DOC);
  });

  it("prints exactly one `doc:` prefix on a selector refusal", () => {
    const file = fixture(UNIQUE_DOC);
    const res = run(["doc", "read", "--file", file, "--section", "Nonexistent"]);
    assert.equal(res.status, 2);
    assert.equal(
      res.stderr,
      'DOC REFUSAL — NO_MATCH\ndoc: no section matches --section "Nonexistent"\n',
    );
  });
});
