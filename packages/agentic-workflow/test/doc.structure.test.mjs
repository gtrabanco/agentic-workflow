/**
 * Structure index suite (issue #366) — `doc index`'s builder, TypeBox
 * validation and CLI wiring.
 *
 * The index is the derived JSON structure half A promised in #192's scope:
 * sections with stable D5 ids, parsed frontmatter, skill triggers, unit-doc
 * phase mapping (previous/current/next) and dependencies — determinism
 * byte-identical over two runs, and a deliberately invalid fixture rejected
 * by the schema. The CLI never touches the retrieval store (S8).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, it } from "node:test";

import { buildDocIndex, collectDocIndex } from "../src/doc/structure.mjs";
import { validateDocIndex } from "../src/doc/structure-schema.mjs";
import { canonicalJson, corpusFiles } from "../src/doc/manifest.mjs";
import { scanChunks } from "../src/doc/chunks.mjs";
import { sectionsWithIds } from "../src/doc/docops.mjs";
import { parseUnitDocPhases } from "../../../scripts/unit-doc-phases.mjs";

const CLI = new URL("../bin/agentic-workflow.mjs", import.meta.url).pathname;

const DIRS = new Set();
function scratch(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `doc366-idx-${name}-`));
  DIRS.add(dir);
  return dir;
}
after(() => {
  for (const dir of DIRS) fs.rmSync(dir, { recursive: true, force: true });
});

const SKILL = [
  "---",
  "name: demo-skill",
  "user-invocable: true",
  "description: >",
  "  Does demo things. Triggers: \"demo\", \"run demo\"",
  "  and also \"go\".",
  "---",
  "",
  "## One",
  "",
  "first body",
  "",
  "## Repeat",
  "",
  "one",
  "",
  "## Repeat",
  "",
  "two",
  "",
  "```markdown",
  "## Tasks",
  "",
  "- [ ] P9 — inside a fence, never a phase",
  "```",
  "",
].join("\n");

const UNIT = [
  "---",
  "type: fix",
  "scope: small",
  "---",
  "",
  "# fix/1-demo",
  "",
  "## Tasks",
  "",
  "- [x] P1 — first (validator: `bun test` exits 0)",
  "- [ ] P2 — second",
  "- [ ] P3 — third",
  "",
  "## Dependencies",
  "",
  "- #407 (the primitive)",
  "- soft: #365",
  "",
].join("\n");

const PLAIN = [
  "# Notes",
  "",
  "## A",
  "",
  "alpha",
  "",
].join("\n");

const CORPUS = [
  { path: "skills/demo/SKILL.md", content: SKILL },
  { path: "docs/fix/1-demo/SPEC.md", content: UNIT },
  { path: "docs/notes.md", content: PLAIN },
];

function run(args, { cwd } = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", cwd });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("buildDocIndex (S5)", () => {
  const index = buildDocIndex(CORPUS);

  it("carries version 1 and path-sorted files", () => {
    assert.equal(index.version, 1);
    assert.deepEqual(index.files.map((f) => f.path), [...index.files.map((f) => f.path)].sort());
  });

  it("derives stable D5 section ids with `-2` dedupe through the shared function", () => {
    const skill = index.files.find((f) => f.path === "skills/demo/SKILL.md");
    assert.deepEqual(
      skill.sections.map((s) => s.id),
      ["skills/demo/SKILL.md#one", "skills/demo/SKILL.md#repeat", "skills/demo/SKILL.md#repeat-2"],
    );
  });

  it("never treats a fenced `## Tasks` row as a phase", () => {
    const skill = index.files.find((f) => f.path === "skills/demo/SKILL.md");
    assert.ok(!skill.sections.some((s) => s.id.endsWith("#tasks")));
  });

  it("parses frontmatter once per file (folded scalars included)", () => {
    const skill = index.files.find((f) => f.path === "skills/demo/SKILL.md");
    assert.equal(skill.frontmatter.name, "demo-skill");
    assert.match(skill.frontmatter.description, /Does demo things/);
  });

  it("extracts skill triggers from the description's Triggers clause", () => {
    const skill = index.files.find((f) => f.path === "skills/demo/SKILL.md");
    assert.deepEqual(skill.triggers, ["demo", "run demo", "go"]);
    const plain = index.files.find((f) => f.path === "docs/notes.md");
    assert.deepEqual(plain.triggers, []);
  });

  it("maps unit-doc phases to previous/current/next", () => {
    assert.deepEqual(index.units, [
      {
        path: "docs/fix/1-demo/SPEC.md",
        type: "fix",
        phases: [
          { id: "P1", status: "complete" },
          { id: "P2", status: "open" },
          { id: "P3", status: "open" },
        ],
        previous: "P1",
        current: "P2",
        next: "P3",
        dependencies: ["#407 (the primitive)", "soft: #365"],
      },
    ]);
  });

  it("is deterministic: two builds are byte-identical with no clock anywhere", () => {
    const first = canonicalJson(buildDocIndex(CORPUS));
    const second = canonicalJson(buildDocIndex(CORPUS));
    assert.equal(first, second);
    assert.doesNotMatch(first, /(generated|timestamp|20\d\d-\d\d-\d\dT)/);
  });
});

describe("validateDocIndex (S5/AC5)", () => {
  it("accepts a valid index", async () => {
    const { ok } = await validateDocIndex(buildDocIndex(CORPUS));
    assert.equal(ok, true);
  });

  it("rejects a deliberately invalid fixture", async () => {
    const bad = buildDocIndex(CORPUS);
    bad.version = 2;
    bad.files[0].sections[0] = { title: "One", depth: 2, lines: [1, 2] }; // id dropped
    bad.units[0].phases[0].status = "maybe";
    const { ok, errors } = await validateDocIndex(bad);
    assert.equal(ok, false);
    assert.ok(errors.length >= 3, `expected several errors, got ${JSON.stringify(errors)}`);
  });
});

describe("doc index CLI (S5)", () => {
  const root = scratch("cli");
  const git = (...args) => execFileSync("git", ["-c", "user.email=t@e", "-c", "user.name=t", "-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8" });
  for (const { path: p, content } of CORPUS) {
    fs.mkdirSync(path.join(root, path.dirname(p)), { recursive: true });
    fs.writeFileSync(path.join(root, p), content);
  }
  git("init", "-q", ".");
  git("add", "-A");
  git("commit", "-qm", "corpus");

  it("prints one JSON document under --json, byte-identical across two runs", () => {
    const first = run(["doc", "index", "--json"], { cwd: root });
    assert.equal(first.status, 0, `stderr: ${first.stderr}`);
    const second = run(["doc", "index", "--json"], { cwd: root });
    assert.equal(second.stdout, first.stdout, "two runs over an unchanged corpus must be byte-identical");
    const index = JSON.parse(first.stdout);
    assert.equal(index.version, 1);
    assert.equal(index.files.length, 3);
  });

  it("writes the identical artifact under --out and prints a receipt line", () => {
    const out = path.join(root, "derived", "doc-index.json");
    const first = run(["doc", "index", "--out", out], { cwd: root });
    assert.equal(first.status, 0, `stderr: ${first.stderr}`);
    assert.match(first.stdout, /doc index: files=3 sections=\d+ units=1 written=/);
    const once = fs.readFileSync(out, "utf8");
    run(["doc", "index", "--out", out], { cwd: root });
    assert.equal(fs.readFileSync(out, "utf8"), once, "two --out runs are byte-identical");
    const json = run(["doc", "index", "--json"], { cwd: root });
    assert.equal(once, json.stdout, "--out and --json carry the same canonical bytes");
  });

  it("never opens the retrieval store (S8)", () => {
    assert.equal(fs.existsSync(path.join(root, ".agentic-workflow", "index")), false);
    const out = path.join(root, "one-more.json");
    run(["doc", "index", "--out", out], { cwd: root });
    assert.equal(fs.existsSync(path.join(root, ".agentic-workflow", "index")), false);
  });

  it("is a usage error on an unknown flag", () => {
    const res = run(["doc", "index", "--json-only"], { cwd: root });
    assert.equal(res.status, 1);
    assert.match(res.stderr, /unknown flag/);
  });

  it("--json prints one document; the receipt never rides stdout", () => {
    const res = run(["doc", "index", "--json"], { cwd: root });
    assert.equal(res.status, 0);
    assert.doesNotMatch(res.stdout, /^doc index:/m);
  });

  it("honours --out together with --json: the artifact is written and the document printed", () => {
    const out = path.join(root, "derived", "both.json");
    fs.rmSync(out, { force: true });
    const res = run(["doc", "index", "--out", out, "--json"], { cwd: root });
    assert.equal(res.status, 0, `stderr: ${res.stderr}`);
    assert.equal(fs.existsSync(out), true, "--out must never be dropped with a success exit");
    const printed = run(["doc", "index", "--json"], { cwd: root }).stdout;
    assert.equal(fs.readFileSync(out, "utf8"), printed, "--out and --json carry the same canonical bytes");
  });
});

describe("one scanner (S15)", () => {
  it("never publishes a commented key inside a leading frontmatter block as a section", () => {
    const DOC = [
      "---",
      "# ac-hash: deadbeef",
      "# type: feature | fix | docs | chore",
      "type: fix",
      "---",
      "",
      "# fix/1-demo",
      "",
      "## Tasks",
      "",
      "- P1 — one (validator: `true` exits 0)",
      "",
    ].join("\n");
    const index = buildDocIndex([{ path: "docs/fix/1-demo/SPEC.md", content: DOC }]);
    const ids = index.files[0].sections.map((section) => section.id);
    assert.deepEqual(ids, ["docs/fix/1-demo/SPEC.md#fix-1-demo", "docs/fix/1-demo/SPEC.md#fix-1-demo-tasks"]);
    assert.equal(index.files[0].frontmatter.type, "fix");
  });
});

describe("owner parity (S11)", () => {
  it("classifies the same headings as the markdown tree, on every tracked document", { timeout: 600_000 }, () => {
    const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
    const files = corpusFiles(ROOT);
    assert.ok(files.length > 500, `the corpus shrunk: ${files.length} files`);
    const drifted = [];
    const artifacts = [];
    const swallowed = [];
    let paired = 0;
    for (const relative of files) {
      const content = fs.readFileSync(path.join(ROOT, relative), "utf8");
      const sections = sectionsWithIds(content, relative);
      const chunks = scanChunks(content, relative).filter((chunk) => chunk.section !== null);
      const sectionLines = new Set(sections.map((section) => section.lines[0]));
      const byLine = new Map(chunks.map((chunk) => [chunk.lines[0], chunk.id]));
      // Both directions: a chunk heading the tree does not have, and a section
      // the chunker never produced. One scanner means neither can happen.
      for (const chunk of chunks) {
        if (!sectionLines.has(chunk.lines[0])) artifacts.push(`${relative}:${chunk.lines[0]}`);
      }
      for (const section of sections) {
        const chunkId = byLine.get(section.lines[0]);
        if (chunkId === undefined) {
          swallowed.push(`${relative}:${section.lines[0]}`);
          continue;
        }
        paired += 1;
        if (chunkId !== section.id) drifted.push(`${relative}:${section.lines[0]} chunk=${chunkId} index=${section.id}`);
      }
    }
    assert.ok(paired > 8000, `the corpus shrank: ${paired} paired sections`);
    assert.deepEqual(drifted.slice(0, 5), [], `${drifted.length} section id(s) drift from the chunker's`);
    assert.deepEqual(artifacts.slice(0, 5), [], `${artifacts.length} chunk heading(s) the markdown tree does not have`);
    assert.deepEqual(swallowed.slice(0, 5), [], `${swallowed.length} section(s) the chunker never produced`);
  });

  it("maps the template's row shape: the executed-phase tick is state, never shape", () => {
    const TEMPLATE_SHAPE = [
      "---", "type: fix", "scope: small", "---", "",
      "# fix/9-demo", "",
      "## Tasks", "",
      "- P1 — first deliverable (validator: `true` exits 0)",
      "- [x] P2 — second deliverable (validator: `true` exits 0)",
      "- P3 — third deliverable (validator: `true` exits 0)",
      "",
    ].join("\n");
    const unit = buildDocIndex([{ path: "docs/fix/9-demo/SPEC.md", content: TEMPLATE_SHAPE }]).units[0];
    assert.deepEqual(unit.phases, [
      { id: "P1", status: "open" },
      { id: "P2", status: "complete" },
      { id: "P3", status: "open" },
    ]);
    assert.equal(unit.previous, null);
    assert.equal(unit.current, "P1", "an open phase must never read as `current: null`");
    assert.equal(unit.next, "P2");
  });

  it("agrees with the phase-contract owner on every in-tree unit doc", { timeout: 300_000 }, () => {
    const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
    const index = buildDocIndex(
      corpusFiles(ROOT).map((p) => ({ path: p, content: fs.readFileSync(path.join(ROOT, p), "utf8") })),
    );
    assert.ok(index.units.length > 20, `the unit corpus shrank: ${index.units.length}`);
    const disagreed = [];
    for (const unit of index.units) {
      const text = fs.readFileSync(path.join(ROOT, unit.path), "utf8");
      const owner = parseUnitDocPhases(text).phases.map((phase) => `P${phase.number}`);
      const ours = unit.phases.map((phase) => phase.id);
      if (owner.join(",") !== ours.join(",")) disagreed.push(`${unit.path}: owner=[${owner}] index=[${ours}]`);
    }
    assert.deepEqual(disagreed.slice(0, 5), [], `${disagreed.length} unit doc(s) disagree with the owner grammar`);
  });
});
