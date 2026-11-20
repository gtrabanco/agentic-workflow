/**
 * doc-retention.test.mjs — the retention write path and its pure half
 * (issue #651).
 *
 * The suite is the frozen expectation of the feature's deterministic core:
 *
 *  - the settle projection keeps the permanent record and collapses the rest;
 *  - the eligibility report names every non-candidate and every out-of-scope
 *    document instead of skipping it;
 *  - the archive is byte-bound: nothing moves into it without a manifest, and a
 *    restore refuses a tampered copy;
 *  - a unit whose folder carries an unclassified file, an open finding or
 *    uncommitted bytes is refused before any byte moves.
 *
 * The fixture is a throwaway repository under the platform temp dir — the live
 * `docs/` tree is never touched by a test.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  archiveRetention,
  assessUnit,
  planRetention,
  restoreRetention,
  settleUnitDoc,
} from "../src/doc/retention.mjs";

import { newRepo, commitFile, git } from "./fixtures.mjs";

const tmp = () => mkdtempSync(join(tmpdir(), "aw-retention-"));
const rm = (dir) => rmSync(dir, { recursive: true, force: true });

const SPEC_REF_HEADINGS = [
  "Specs",
  "Impact",
  "Non-goals",
  "Future cost",
  "Applicable tests",
  "Known pre-existing issues",
  "Tasks",
  "Findings",
  "Log",
  "Next",
  "References",
];

const specRefDoc = (extra = {}) => {
  const lines = [
    "---",
    "type: feature",
    "scope: small",
    "---",
    "",
    "# 42 — example",
    "",
    "> One-line: an example unit.",
    "",
    "```text",
    "doc-provenance@1",
    "written_by: agentic-workflow@4.10.0",
    "schema: @gtrabanco/agentic-workflow-schema@4.10.0",
    "format: unit-doc@2",
    'grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}',
    "```",
    "",
    "## Specs",
    "",
    "**S1 — do the thing.**",
    "> verbatim ask",
    "",
    "## Acceptance criteria",
    "",
    "1. **AC1 (S1)** — the thing is done.",
    "",
    "## Impact",
    "",
    "none",
    "",
    "## Non-goals",
    "",
    "none",
    "",
    "## Future cost",
    "",
    "none",
    "",
    "## Applicable tests",
    "",
    "- `bun test`",
    "",
    "## Known pre-existing issues",
    "",
    "none",
    "",
    "## Tasks",
    "",
    "- P1 — do it (validator: `true` exits 0)",
    "  (Implements: S1)",
    "",
    "## Findings",
    "",
    "| id | S# / file:line | axis | severity | impact | class | route |",
    "|---|---|---|---|---|---|---|",
    "",
    "## Log",
    "",
    "- **L1** — 2026-11-20, the request, verbatim:",
    "  ```",
    "  do the thing",
    "  ```",
    "- **D1** — 2026-11-20, an owner decision — the authority and what was decided.",
    "- **R1** — 2026-11-20, `HEAD abc1234`, PASS, cycle 1, gate exit 0.",
    "- **F1** — 2026-11-20, folded at `deadbee`, the assertion was verified.",
    "",
    "## Evidence",
    "",
    "| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |",
    "|---|---|---|---|---|",
    "| AC1 | `bun test` | 0 | ok | phase |",
    "",
    "## Next",
    "",
    "ship it",
    "",
    "## References",
    "",
    "none",
    "",
  ];
  for (const [heading, body] of Object.entries(extra)) {
    lines.push(`## ${heading}`, "", body, "");
  }
  return lines.join("\n");
};

const root = () => {
  const dir = tmp();
  mkdirSync(join(dir, "docs", "features"), { recursive: true });
  writeFileSync(join(dir, ".gitignore"), ".agentic-workflow/archive/\n");
  return dir;
};

const writeUnit = (dir, unit, files) => {
  const unitDir = join(dir, "docs", "features", unit);
  mkdirSync(unitDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(join(unitDir, name), content);
  return unitDir;
};

const ROADMAP = (rows) => [
  "# Roadmap",
  "",
  "## Features",
  "",
  "| NN | Slug | Status | Dependencies | Summary |",
  "|---|---|---|---|---|",
  ...rows,
  "",
  "## Fixes",
  "",
  "| Issue | Topic | Status |",
  "|---|---|---|",
  "",
].join("\n");

const writeRoadmap = (dir, rows) => writeFileSync(join(dir, "docs", "ROADMAP.md"), ROADMAP(rows));

const snapshot = (dir) => {
  const out = [];
  const walk = (rel) => {
    const abs = join(dir, rel);
    for (const entry of readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = rel === "" ? entry.name : `${rel}/${entry.name}`;
      if (entry.name === ".git") continue;
      if (entry.isDirectory()) walk(child);
      else out.push(`${child}:${createHash("sha256").update(readFileSync(join(dir, child))).digest("hex")}`);
    }
  };
  walk("");
  return out;
};

const DEFAULT_CONFIG = Object.freeze({
  mode: "archive",
  pendingTrimAfterDays: 0,
  archiveDir: ".agentic-workflow/archive",
  archiveRetentionDays: null,
  seamHook: null,
});

/* ------------------------------------------------------------- the settle */

test("the settle projection keeps the permanent record and collapses the rest", () => {
  const result = settleUnitDoc(specRefDoc({ Surfaces: "- `packages/x`", "Risk tier": "standard" }));
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  const text = result.text;

  for (const gone of ["## Tasks", "## Findings", "## Next", "## Applicable tests", "## Evidence"]) {
    assert.equal(text.includes(gone), false, `${gone} is trimmed`);
  }
  for (const kept of ["## Specs", "## Impact", "## Non-goals", "## Future cost", "## Known pre-existing issues", "## Log", "## References", "## Surfaces", "## Risk tier"]) {
    assert.equal(text.includes(kept), true, `${kept} survives the settle`);
  }
  // The log is untouched, one digest line is appended to it, and nothing else is.
  for (const line of ["- **L1**", "- **D1**", "- **R1**", "- **F1**"]) {
    assert.equal(text.includes(line), true, `${line} survives verbatim`);
  }
  const evidenceLines = text.split("\n").filter((line) => /^- \*\*E\d+\*\*/.test(line));
  assert.equal(evidenceLines.length, 1, "the evidence table collapses into one E line");
  assert.match(evidenceLines[0], /bun test/, "the digest line names what was run");
  // The stamp advances to the settled generation and declares its grammar set.
  assert.match(text, /^format: unit-doc@3$/mu);
  assert.match(text, /^grammars: \{"log-kind":1,"obligations":1,"unit-doc":1\}$/mu);
  assert.equal(text.includes("| AC | What was run |"), false, "the evidence table itself is gone");
});

test("the settle projection never mistakes a fenced heading for a section, and refuses a settled document", () => {
  const fenced = specRefDoc({
    Log: [
      "- **L1** — 2026-11-20, the request, verbatim:",
      "  ```md",
      "  ## Tasks",
      "  kept inside the quote",
      "  ```",
    ].join("\n"),
  });
  const once = settleUnitDoc(fenced);
  assert.equal(once.ok, true, JSON.stringify(once.errors));
  assert.match(once.text, /## Tasks\n  kept inside the quote/, "a fenced heading is not a section");
  const twice = settleUnitDoc(once.text);
  assert.equal(twice.ok, false);
  assert.equal(twice.reason, "already-settled", "a settled carrier is refused, never re-settled");
});

test("the settle projection refuses a document it cannot settle, by name", () => {
  const cases = [
    [{}, "unstamped"],
    [{ format: "unit-doc@1" }, "older-format"],
    [{ format: "unit-doc@3" }, "already-settled"],
  ];
  for (const [override, reason] of cases) {
    let text = specRefDoc();
    if (override.format === undefined) {
      text = text.replace(/```text\ndoc-provenance@1[\s\S]*?```\n/u, "");
    } else {
      text = text.replace("format: unit-doc@2", `format: ${override.format}`);
    }
    const result = settleUnitDoc(text);
    assert.equal(result.ok, false, `${reason} is refused`);
    assert.equal(result.reason, reason);
  }
});

test("the settle projection refuses a document that no longer satisfies the full carrier", () => {
  // `## Log` is required by `spec-by-reference`, so dropping it leaves a body no
  // carrier resolves: the projection refuses instead of stamping a lie.
  const text = specRefDoc().replace(/## Log[\s\S]*?## Evidence/u, "## Evidence");
  const result = settleUnitDoc(text);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "unknown-carrier");
});

/* ---------------------------------------------------------- the assessment */

test("assessUnit splits the folder against the published matrix", () => {
  const dir = root();
  try {
    const unitDir = writeUnit(dir, "42-example", {
      "SPEC.md": specRefDoc(),
      "progress.md": "p",
      "TASKS.md": "t",
      "decisions.md": "d",
      "notes.md": "n",
    });
    const row = assessUnit({
      unit: "docs/features/42-example",
      text: readFileSync(join(unitDir, "SPEC.md"), "utf8"),
      status: "done",
      files: readdirSync(unitDir).sort(),
      dirty: false,
    });
    assert.equal(row.state, "eligible");
    assert.equal(row.eligible, true);
    assert.deepEqual(row.trim, ["TASKS.md", "progress.md"]);
    assert.deepEqual(row.kept, ["SPEC.md", "decisions.md"]);
    assert.deepEqual(row.unclassified, ["notes.md"]);
    assert.equal(row.writable, false, "an unclassified file refuses the write path");
    assert.equal(row.blocked, "unclassified-file");
  } finally {
    rm(dir);
  }
});

test("assessUnit refuses a legacy review-findings.md that still carries an open row", () => {
  const dir = root();
  try {
    const open = writeUnit(dir, "42-example", {
      "SPEC.md": specRefDoc(),
      "review-findings.md": "| id | file:line | axis | severity | class | route | folded |\n|---|---|---|---|---|---|---|\n| F1 | a.js:1 | code | high | source | fold | no |\n",
    });
    const row = assessUnit({
      unit: "docs/features/42-example",
      text: readFileSync(join(open, "SPEC.md"), "utf8"),
      status: "done",
      files: readdirSync(open).sort(),
      dirty: false,
      reviewFindings: readFileSync(join(open, "review-findings.md"), "utf8"),
    });
    assert.equal(row.state, "open-findings");
    assert.equal(row.eligible, false);

    const folded = writeUnit(dir, "43-example", {
      "SPEC.md": specRefDoc(),
      "review-findings.md": "| id | file:line | axis | severity | class | route | folded |\n|---|---|---|---|---|---|---|\n| F1 | a.js:1 | code | high | source | fold | yes |\n",
    });
    const ok = assessUnit({
      unit: "docs/features/43-example",
      text: readFileSync(join(folded, "SPEC.md"), "utf8"),
      status: "done",
      files: readdirSync(folded).sort(),
      dirty: false,
      reviewFindings: readFileSync(join(folded, "review-findings.md"), "utf8"),
    });
    assert.equal(ok.state, "eligible");
    assert.deepEqual(ok.trim, ["review-findings.md"]);
  } finally {
    rm(dir);
  }
});

/* -------------------------------------------------------------- the report */

test("the dry-run report names every candidate and every out-of-scope unit, and writes nothing", () => {
  const dir = root();
  try {
    writeRoadmap(dir, [
      "| 42 | `example` | done | — | shipped |",
      "| 43 | `ancient` | done | — | unstamped |",
      "| 44 | `open` | in-progress | — | in flight |",
    ]);
    writeUnit(dir, "42-example", { "SPEC.md": specRefDoc(), "progress.md": "p" });
    writeUnit(dir, "43-ancient", {
      "SPEC.md": specRefDoc().replace(/```text\ndoc-provenance@1[\s\S]*?```\n/u, ""),
      "progress.md": "p",
    });
    writeUnit(dir, "44-open", { "SPEC.md": specRefDoc(), "progress.md": "p" });
    const before = snapshot(dir);

    const plan = planRetention({ root: dir, config: DEFAULT_CONFIG });
    assert.equal(plan.dry_run, true);
    const byUnit = Object.fromEntries(plan.rows.map((row) => [row.unit, row]));
    assert.equal(byUnit["docs/features/42-example"].state, "eligible");
    assert.equal(byUnit["docs/features/43-ancient"].state, "unstamped");
    assert.equal(byUnit["docs/features/44-open"].state, "not-done");
    assert.deepEqual(plan.out_of_scope.map((row) => row.unit), ["docs/features/43-ancient"]);
    assert.deepEqual(plan.eligible.map((row) => row.unit), ["docs/features/42-example"]);
    assert.deepEqual(snapshot(dir), before, "the report writes nothing");
  } finally {
    rm(dir);
  }
});

/* --------------------------------------------------------------- the write */

test("the archive moves the matrix's files, writes its manifest and settles the doc", () => {
  const dir = root();
  try {
    writeRoadmap(dir, ["| 42 | `example` | done | — | shipped |"]);
    const unitDir = writeUnit(dir, "42-example", {
      "SPEC.md": specRefDoc(),
      "progress.md": "progress body",
      "TASKS.md": "tasks body",
      "decisions.md": "decision body",
    });

    const result = archiveRetention({ root: dir, config: DEFAULT_CONFIG, only: "docs/features/42-example" });
    assert.equal(result.ok, true, JSON.stringify(result.refused));
    assert.deepEqual(result.archived, ["docs/features/42-example"]);

    assert.equal(existsSync(join(unitDir, "progress.md")), false);
    assert.equal(existsSync(join(unitDir, "TASKS.md")), false);
    assert.equal(readFileSync(join(unitDir, "decisions.md"), "utf8"), "decision body");

    const archive = join(dir, ".agentic-workflow/archive/42-example");
    assert.equal(readFileSync(join(archive, "files/progress.md"), "utf8"), "progress body");
    const manifest = JSON.parse(readFileSync(join(archive, "manifest.json"), "utf8"));
    assert.equal(manifest.contract, "doc-retention-archive@1");
    assert.equal(manifest.unit, "docs/features/42-example");
    assert.deepEqual(manifest.files.map((row) => row.path).sort(), ["TASKS.md", "progress.md"]);

    const settled = readFileSync(join(unitDir, "SPEC.md"), "utf8");
    assert.match(settled, /^format: unit-doc@3$/mu);
    assert.equal(settled.includes("## Tasks"), false);

    // A second settle is a no-op refusal: the unit is already settled.
    const again = archiveRetention({ root: dir, config: DEFAULT_CONFIG, only: "docs/features/42-example" });
    assert.equal(again.ok, false);
    assert.equal(again.refused[0].reason, "already-settled");
  } finally {
    rm(dir);
  }
});

test("the write path refuses before any byte moves, naming the reason", () => {
  const cases = [
    {
      name: "not-done",
      roadmap: ["| 42 | `example` | in-progress | — | wip |"],
      files: { "SPEC.md": specRefDoc(), "progress.md": "p" },
    },
    {
      name: "unstamped",
      roadmap: ["| 42 | `example` | done | — | shipped |"],
      files: { "SPEC.md": specRefDoc().replace(/```text\ndoc-provenance@1[\s\S]*?```\n/u, ""), "progress.md": "p" },
    },
    {
      name: "open-findings",
      roadmap: ["| 42 | `example` | done | — | shipped |"],
      files: {
        "SPEC.md": specRefDoc(),
        "review-findings.md": "| id | file:line | axis | severity | class | route | folded |\n|---|---|---|---|---|---|---|\n| F1 | a.js:1 | code | high | source | fold | no |\n",
      },
    },
    {
      name: "unclassified-file",
      roadmap: ["| 42 | `example` | done | — | shipped |"],
      files: { "SPEC.md": specRefDoc(), "notes.md": "n" },
    },
  ];
  for (const { name, roadmap, files } of cases) {
    const dir = root();
    try {
      writeRoadmap(dir, roadmap);
      const unitDir = writeUnit(dir, "42-example", files);
      const before = snapshot(dir);
      const result = archiveRetention({ root: dir, config: DEFAULT_CONFIG, only: "docs/features/42-example" });
      assert.equal(result.ok, false, `${name} refuses`);
      assert.equal(result.refused[0].reason, name);
      assert.deepEqual(snapshot(dir), before, `${name} moves no byte`);
      assert.equal(existsSync(join(dir, ".agentic-workflow/archive")), false, `${name} creates no archive`);
      assert.ok(existsSync(join(unitDir, "SPEC.md")));
    } finally {
      rm(dir);
    }
  }
});

test("the write path refuses a dirty unit folder and a non-ignored archive directory", () => {
  const repo = newRepo(tmp(), "retention-repo", "main");
  try {
    writeFileSync(join(repo, ".gitignore"), "");
    mkdirSync(join(repo, "docs"), { recursive: true });
    writeRoadmap(repo, ["| 42 | `example` | done | — | shipped |"]);
    commitFile(repo, "docs/ROADMAP.md", readFileSync(join(repo, "docs/ROADMAP.md"), "utf8"));
    commitFile(repo, "docs/features/42-example/SPEC.md", specRefDoc());
    commitFile(repo, "docs/features/42-example/progress.md", "p");

    const notIgnored = archiveRetention({ root: repo, config: DEFAULT_CONFIG, only: "docs/features/42-example" });
    assert.equal(notIgnored.ok, false);
    assert.equal(notIgnored.refused[0].reason, "archive-not-ignored");

    commitFile(repo, ".gitignore", ".agentic-workflow/archive/\n");
    writeFileSync(join(repo, "docs/features/42-example/progress.md"), "dirty\n");
    const dirty = archiveRetention({ root: repo, config: DEFAULT_CONFIG, only: "docs/features/42-example" });
    assert.equal(dirty.ok, false);
    assert.equal(dirty.refused[0].reason, "dirty-unit-dir");

    git(repo, "checkout", "--", "docs/features/42-example/progress.md");
    const ok = archiveRetention({ root: repo, config: DEFAULT_CONFIG, only: "docs/features/42-example" });
    assert.equal(ok.ok, true, JSON.stringify(ok.refused));
  } finally {
    rm(repo);
  }
});

test("the seam hook runs after the archive is durable and its failure is a degradation, not a loss", () => {
  const dir = root();
  try {
    writeRoadmap(dir, ["| 42 | `example` | done | — | shipped |"]);
    const unitDir = writeUnit(dir, "42-example", { "SPEC.md": specRefDoc(), "progress.md": "p" });

    const ok = archiveRetention({
      root: dir,
      config: { ...DEFAULT_CONFIG, seamHook: "echo noticed" },
      only: "docs/features/42-example",
    });
    assert.equal(ok.ok, true, JSON.stringify(ok.refused));
    assert.equal(ok.hooks[0].ran, true);
    assert.equal(ok.hooks[0].exit, 0);

    const dir2 = root();
    writeRoadmap(dir2, ["| 43 | `example` | done | — | shipped |"]);
    const unitDir2 = writeUnit(dir2, "43-example", { "SPEC.md": specRefDoc(), "progress.md": "p" });
    const failed = archiveRetention({
      root: dir2,
      config: { ...DEFAULT_CONFIG, seamHook: "false" },
      only: "docs/features/43-example",
    });
    assert.equal(failed.ok, true, "the local archive is durable even when the offsite copy fails");
    assert.equal(failed.hooks[0].ran, true);
    assert.notEqual(failed.hooks[0].exit, 0);
    assert.match(failed.degradations.join(" "), /seam-hook/);
    assert.equal(existsSync(join(unitDir2, "progress.md")), false);
    assert.equal(existsSync(join(unitDir, "progress.md")), false);
  } finally {
    rm(dir);
  }
});

test("restore reconstructs the trimmed files byte-identically and refuses a tampered archive", () => {
  const dir = root();
  try {
    writeRoadmap(dir, ["| 42 | `example` | done | — | shipped |"]);
    const unitDir = writeUnit(dir, "42-example", {
      "SPEC.md": specRefDoc(),
      "progress.md": "progress body",
      "TASKS.md": "tasks body",
    });
    assert.equal(archiveRetention({ root: dir, config: DEFAULT_CONFIG, only: "docs/features/42-example" }).ok, true);

    const restored = restoreRetention({ root: dir, config: DEFAULT_CONFIG, unit: "docs/features/42-example" });
    assert.equal(restored.ok, true, JSON.stringify(restored.refused));
    assert.equal(readFileSync(join(unitDir, "progress.md"), "utf8"), "progress body");
    assert.equal(readFileSync(join(unitDir, "TASKS.md"), "utf8"), "tasks body");

    // A tampered archive is refused before it writes, and the unit keeps the
    // bytes it already had.
    const archive = join(dir, ".agentic-workflow/archive/42-example");
    writeFileSync(join(archive, "files/progress.md"), "tampered");
    const again = restoreRetention({ root: dir, config: DEFAULT_CONFIG, unit: "docs/features/42-example" });
    assert.equal(again.ok, false);
    assert.equal(again.refused[0].reason, "content-hash-mismatch");
    assert.equal(readFileSync(join(unitDir, "progress.md"), "utf8"), "progress body");
  } finally {
    rm(dir);
  }
});
