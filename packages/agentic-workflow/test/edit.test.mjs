/**
 * Tests for agentic-workflow edit — typed file services SDK.
 *
 * Uses node:test with temp directories for isolation.
 * Covers: UnitDoc, Roadmap, Changelog, Budgets, Manifest, receipts, CLI smoke.
 */

import { describe, it, before, after } from "node:test";
import { strictEqual, ok, throws } from "node:assert";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

// ── SDK imports ──────────────────────────────────────────────────────────
import { create, setSection, evidence_addRow, progress_logEntry, validate } from "../src/edit/UnitDoc.mjs";
import { rowUpsert, annotate, fixRowUpsert } from "../src/edit/Roadmap.mjs";
import { readShared } from "../src/writer/driver.mjs";
import { rowAdd } from "../src/edit/Changelog.mjs";
import { ceilingRebase } from "../src/edit/Budgets.mjs";
import { skillAdd, skillRemove } from "../src/edit/Manifest.mjs";

// ── Test fixtures ────────────────────────────────────────────────────────

let tmpDir;
let unitDir;
let specPath;

before(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "agentic-workflow-edit-"));
  unitDir = join(tmpDir, "docs", "features", "61-test-slug");
  mkdirSync(unitDir, { recursive: true });
  specPath = join(unitDir, "SPEC.md");
});

after(() => {
  if (tmpDir && existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ── UnitDoc tests ────────────────────────────────────────────────────────

describe("UnitDoc", () => {
  it("create produces 14 sections in order", () => {
    const receipt = create(unitDir, "61-test-slug");
    strictEqual(receipt.ok, true);
    strictEqual(receipt.service, "unitDoc");
    strictEqual(receipt.op, "create");

    const content = readFileSync(specPath, "utf8");
    // #305: `## Impact` is required, between Acceptance criteria and Non-goals,
    // so the producer emits what the selector accepts.
    const sections = [
      "Objective", "Why", "User outcome", "Acceptance criteria", "Impact",
      "Non-goals", "Future cost", "Applicable tests",
      "Known pre-existing issues", "Tasks", "Evidence",
      "Progress log", "Next", "References",
    ];

    // All 14 sections must exist in order
    let lastIdx = -1;
    for (const section of sections) {
      const idx = content.indexOf(`## ${section}`);
      ok(idx !== -1, `Section "${section}" not found`);
      ok(idx > lastIdx, `Section "${section}" out of order`);
      lastIdx = idx;
    }
  });

  it("setSection refuses an unknown section", () => {
    throws(() => {
      setSection(specPath, "UnknownSection", "body");
    }, /Unknown section/);
  });

  it("setSection updates an existing section", () => {
    const receipt = setSection(specPath, "Objective", "New objective body");
    strictEqual(receipt.ok, true);

    const content = readFileSync(specPath, "utf8");
    ok(content.includes("New objective body"));
  });

  it("evidence.addRow writes the exact column shape", () => {
    const receipt = evidence_addRow(specPath, {
      ac: "AC-14",
      command: "bun test edit.test.mjs",
      exitDigest: "sha256:abc123",
      output: "2 tests passed",
      verifiedBy: "test-agent",
    });
    strictEqual(receipt.ok, true);

    const content = readFileSync(specPath, "utf8");
    ok(content.includes("| AC-14"));
    ok(content.includes("| bun test edit.test.mjs"));
    ok(content.includes("| sha256:abc123"));
    ok(content.includes("| 2 tests passed"));
    ok(content.includes("| test-agent |"));
  });

  it("progress entry with a bad timestamp is refused", () => {
    throws(() => {
      progress_logEntry(specPath, {
        ts: "not-a-timestamp",
        what: "did something",
        ref: "abc123",
        next: "do more",
      });
    }, /Progress entry does not match/);
  });

  it("progress entry with valid format succeeds", () => {
    const receipt = progress_logEntry(specPath, {
      ts: "2026-09-22 14:30",
      what: "implemented agentic-workflow edit",
      ref: "abc123def",
      next: "write tests",
    });
    strictEqual(receipt.ok, true);

    const content = readFileSync(specPath, "utf8");
    ok(content.includes("2026-09-22 14:30 — implemented agentic-workflow edit → abc123def — next: write tests"));
  });

  it("validate returns violations for missing sections", () => {
    const content = "# Test\n\n## Objective\n\nOnly one section";
    const result = validate(content);
    strictEqual(result.ok, false);
    ok(result.violations.length > 0);
    ok(result.violations.some((v) => v.includes("Why")));
  });
});

// ── Roadmap tests ────────────────────────────────────────────────────────

describe("Roadmap", () => {
  let roadmapPath;

  before(() => {
    roadmapPath = join(tmpDir, "ROADMAP.md");
    const content = `# Roadmap

| NN | slug | status | depends-on | description |
|---|---|---|---|---|
`;
    writeFileSync(roadmapPath, content, "utf8");
  });

  it("rowUpsert inserts a new row", () => {
    const receipt = rowUpsert(roadmapPath, {
      nn: "61",
      slug: "adaptive-unit-lane",
      status: "active",
      dependsOn: "",
      description: "Adaptive unit lane implementation",
    });
    strictEqual(receipt.ok, true);

    const updated = readFileSync(roadmapPath, "utf8");
    ok(updated.includes("| 61 | adaptive-unit-lane |"));
  });

  it("rowUpsert updates the same NN without duplicating", () => {
    const receipt = rowUpsert(roadmapPath, {
      nn: "61",
      slug: "adaptive-unit-lane-v2",
      status: "completed",
      dependsOn: "",
      description: "Updated description",
    });
    strictEqual(receipt.ok, true);

    const content = readFileSync(roadmapPath, "utf8");
    const count = content.split("| 61 |").length - 1;
    strictEqual(count, 1);
  });

  it("annotate appends to the description", () => {
    annotate(roadmapPath, "61", "Added annotation note");
    const content = readFileSync(roadmapPath, "utf8");
    ok(content.includes("— Added annotation note"));
  });

  it("annotate keeps the row on one physical line (a table row never wraps)", () => {
    annotate(roadmapPath, "61", "Second note on the same row");
    const lines = readFileSync(roadmapPath, "utf8").split("\n");
    const rowIdx = lines.findIndex((l) => l.startsWith("| 61 |"));
    ok(rowIdx > -1);
    ok(lines[rowIdx].includes("— Second note on the same row"));
    // A note on its own line terminates the row: renderers turn the tail into
    // a new, malformed row (the 2026-11-09 unit-227 damage).
    ok(!/^\s*— /u.test(lines[rowIdx + 1] ?? ""), lines.slice(rowIdx, rowIdx + 3).join("\n"));
    const headerIdx = lines.findIndex((l) => l.includes("| NN |"));
    for (const line of lines.slice(headerIdx)) {
      if (line.trim() !== "") ok(line.startsWith("|"), line);
    }
  });
});

// ── Changelog tests ──────────────────────────────────────────────────────

describe("Changelog", () => {
  it("changelog row lands inside the named section's table", () => {
    const changelogPath = join(tmpDir, "CHANGELOG.md");
    const content = `# Changelog

#### \`unit-doc\`

| Version | Date | Type | What changed |
|---|---|---|---|

#### \`roadmap\`

| Version | Date | Type | What changed |
|---|---|---|---|
`;
    writeFileSync(changelogPath, content, "utf8");

    const receipt = rowAdd(changelogPath, "unit-doc", {
      version: "0.1.0",
      date: "2026-09-22",
      type: "feature",
      what: "Added agentic-workflow edit typed file services",
    });
    strictEqual(receipt.ok, true);

    const updated = readFileSync(changelogPath, "utf8");
    // The row should appear under unit-doc section, not roadmap
    const parts = updated.split("#### `unit-doc`");
    ok(parts.length >= 2);
    const unitDocContent = parts[1];
    const roadmapIdx = unitDocContent.indexOf("#### `roadmap`");
    const unitDocOnly = roadmapIdx === -1 ? unitDocContent : unitDocContent.slice(0, roadmapIdx);
    ok(unitDocOnly.includes("| 0.1.0 | 2026-09-22 | feature | Added agentic-workflow edit"));
  });
});

// ── Budgets tests ────────────────────────────────────────────────────────

describe("Budgets", () => {
  let budgetPath;

  before(() => {
    budgetPath = join(tmpDir, "budgets.json");
    const content = JSON.stringify({
      routes: {
        "execute-phase": { estimateMax: 1000, linesMax: 500, sources: {} },
      },
    }, null, 2);
    writeFileSync(budgetPath, content, "utf8");
  });

  it("budgets shrink without growth source is refused", () => {
    const receipt = ceilingRebase(budgetPath, "execute-phase", 500, 250, "");
    strictEqual(receipt.ok, false);
  });

  it("budgets shrink WITH growth source succeeds", () => {
    const receipt = ceilingRebase(budgetPath, "execute-phase", 500, 250, "Optimization: reduced scope");
    strictEqual(receipt.ok, true);

    const content = readFileSync(budgetPath, "utf8");
    const data = JSON.parse(content);
    strictEqual(data.routes["execute-phase"].estimateMax, 500);
    strictEqual(data.routes["execute-phase"].linesMax, 250);
    strictEqual(data.routes["execute-phase"].sources.ceilingRebase, "Optimization: reduced scope");
  });
});

// ── Manifest tests ───────────────────────────────────────────────────────

describe("Manifest", () => {
  let pluginJsonPath;

  before(() => {
    pluginJsonPath = join(tmpDir, ".claude-plugin", "plugin.json");
    mkdirSync(join(pluginJsonPath, ".."), { recursive: true });
    const data = { skills: [] };
    writeFileSync(pluginJsonPath, JSON.stringify(data, null, 2), "utf8");
  });

  it("manifest add keeps alphabetical order", () => {
    skillAdd(pluginJsonPath, "zebra-skill", { description: "Z" });
    skillAdd(pluginJsonPath, "alpha-skill", { description: "A" });
    skillAdd(pluginJsonPath, "middle-skill", { description: "M" });

    const content = readFileSync(pluginJsonPath, "utf8");
    const parsed = JSON.parse(content);
    const names = parsed.skills.map((s) => s.name);
    strictEqual(names.length, 3);
    strictEqual(names[0], "alpha-skill");
    strictEqual(names[1], "middle-skill");
    strictEqual(names[2], "zebra-skill");
  });

  it("manifest add refuses duplicate", () => {
    throws(() => {
      skillAdd(pluginJsonPath, "alpha-skill", { description: "duplicate" });
    }, /already exists/);
  });

  it("manifest remove keeps alphabetical order", () => {
    skillRemove(pluginJsonPath, "middle-skill");

    const content = readFileSync(pluginJsonPath, "utf8");
    const parsed = JSON.parse(content);
    const names = parsed.skills.map((s) => s.name);
    strictEqual(names.length, 2);
    strictEqual(names[0], "alpha-skill");
    strictEqual(names[1], "zebra-skill");
  });
});

// ── Receipt tests ────────────────────────────────────────────────────────

describe("Receipts", () => {
  it("receipts carry matching sha256 digests", () => {
    const receipt = setSection(specPath, "Why", "New reason");
    strictEqual(typeof receipt.before, "string");
    strictEqual(typeof receipt.after, "string");
    strictEqual(receipt.before.length, 8); // sha256 prefix is 8 chars
    strictEqual(receipt.after.length, 8);
    // Content changed so digests differ
    strictNotEqual(receipt.before, receipt.after);
  });
});

// ── CLI smoke test ───────────────────────────────────────────────────────

describe("CLI smoke", () => {
  it("spawn bin/agentic-workflow.mjs unit-doc create --json parses", (t, done) => {
    const testDir = mkdtempSync(join(tmpdir(), "agentic-workflow-cli-"));
    const testUnitDir = join(testDir, "docs", "features", "cli-test");
    mkdirSync(testUnitDir, { recursive: true });

    const agwoPath = join(fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url)));

    const proc = spawn("node", [agwoPath, "unit-doc", "cli-test", "create", "--json"], {
      cwd: testDir,
      timeout: 10000,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => { stdout += data.toString(); });
    proc.stderr.on("data", (data) => { stderr += data.toString(); });

    proc.on("close", (code) => {
      try {
        strictEqual(code, 0);
        const parsed = JSON.parse(stdout);
        strictEqual(parsed.ok, true);
        strictEqual(parsed.service, "unitDoc");
        strictEqual(parsed.op, "create");
        // Cleanup
        rmSync(testDir, { recursive: true, force: true });
        done();
      } catch (e) {
        rmSync(testDir, { recursive: true, force: true });
        done(e);
      }
    });

    proc.on("error", (e) => {
      rmSync(testDir, { recursive: true, force: true });
      done(e);
    });
  });
});

// ── Roadmap on the writer driver (issue #498) ─────────────────────────────
//
// The roadmap family writes through the shared writer driver (`src/writer/
// driver.mjs`): key-based splice instead of a whole-file rewrite, optional CAS
// (`expected`) refusing with a named `stale-read`, existing receipt shapes
// preserved.

describe("Roadmap on the writer driver (issue #498)", () => {
  let dir;
  let roadmapPath;
  let PROSE_BEFORE;
  let PROSE_AFTER;

  const FIXTURE = [
    "# Index",
    "",
    "intro prose line",
    "",
    "| NN | slug | status | depends-on | description |",
    "|---|---|---|---|---|",
    "| 12 | first-unit | idea | — | first row |",
    "",
    "closing prose line",
    "",
  ].join("\n");

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "aw-roadmap-driver-"));
    roadmapPath = join(dir, "ROADMAP.md");
    writeFileSync(roadmapPath, FIXTURE, "utf8");
  });

  after(() => {
    if (dir && existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  });

  it("previous behavior holds: receipt shape, row content, and foreign bytes untouched", () => {
    PROSE_BEFORE = readFileSync(roadmapPath, "utf8");
    const receipt = rowUpsert(roadmapPath, {
      nn: "12",
      slug: "first-unit",
      status: "in-progress",
      dependsOn: "—",
      description: "first row, settled",
    });
    // The receipt shape the CLI and the settle validators read, unchanged.
    strictEqual(receipt.service, "roadmap");
    strictEqual(receipt.op, "rowUpsert");
    strictEqual(receipt.schema, "roadmap-table@1");
    strictEqual(receipt.ok, true);
    ok(/^[0-9a-f]{8}$/.test(receipt.before));
    ok(/^[0-9a-f]{8}$/.test(receipt.after));
    ok(receipt.before !== receipt.after);
    // The splice: only the row line moved, every other byte carried through.
    PROSE_AFTER = readFileSync(roadmapPath, "utf8");
    ok(PROSE_AFTER.includes("| 12 | first-unit | in-progress | — | first row, settled |"));
    for (const line of ["intro prose line", "closing prose line", "# Index"]) {
      ok(PROSE_AFTER.includes(line), line);
    }
  });

  it("FF-1 — rowUpsert with a stale read refuses with a named rejection, before mutation", () => {
    const read = readShared(roadmapPath);
    // A concurrent writer moves the table forward.
    annotate(roadmapPath, "12", "a concurrent write");
    const afterConcurrent = readFileSync(roadmapPath, "utf8");
    throws(
      () =>
        rowUpsert(roadmapPath, {
          nn: "12",
          slug: "first-unit",
          status: "done",
          dependsOn: "—",
          description: "stale",
          expected: read.revision,
        }),
      (error) => {
        strictEqual(error.name, "WriterError");
        strictEqual(error.reason, "stale-read");
        strictEqual(error.details.expected, read.revision);
        ok(/^[0-9a-f]{64}$/.test(error.details.actual));
        ok(error.details.expected !== error.details.actual);
        return true;
      },
    );
    // Nothing moved.
    strictEqual(readFileSync(roadmapPath, "utf8"), afterConcurrent);
  });

  it("annotate with the revision it read succeeds; a stale annotate refuses", () => {
    const read = readShared(roadmapPath);
    const receipt = annotate(roadmapPath, "12", "CAS annotate", { expected: read.revision });
    strictEqual(receipt.ok, true);
    ok(readFileSync(roadmapPath, "utf8").includes("— CAS annotate"));
    throws(
      () => annotate(roadmapPath, "12", "stale annotate", { expected: "0".repeat(64) }),
      (error) => {
        strictEqual(error.reason, "stale-read");
        return true;
      },
    );
  });

  it("FF-2 — fixRowUpsert inserts and updates a `## Fixes` row by issue number", () => {
    const fixesPath = join(dir, "FIXES.md");
    writeFileSync(
      fixesPath,
      [
        "# Index",
        "",
        "## Fixes",
        "",
        "| Issue | Topic | Status | Notes |",
        "|---|---|---|---|",
        "| [#498](https://github.com/x/y/issues/498) | shared-writer-driver | in-progress | this unit |",
        "",
        "legend prose",
        "",
      ].join("\n"),
      "utf8",
    );
    const receipt = fixRowUpsert(fixesPath, {
      issue: 502,
      url: "https://github.com/x/y/issues/502",
      topic: "nan-publish-stable",
      status: "pending",
      notes: "inserted by the writer",
    });
    strictEqual(receipt.ok, true);
    strictEqual(receipt.service, "roadmap");
    strictEqual(receipt.op, "fixRowUpsert");
    const content = readFileSync(fixesPath, "utf8");
    ok(content.includes("| [#502](https://github.com/x/y/issues/502) | nan-publish-stable | pending | inserted by the writer |"));
    // Update the same issue without duplicating.
    fixRowUpsert(fixesPath, {
      issue: 502,
      url: "https://github.com/x/y/issues/502",
      topic: "nan-publish-stable",
      status: "in-progress",
      notes: "settled by the writer",
    });
    const updated = readFileSync(fixesPath, "utf8");
    strictEqual(updated.split("[#502]").length - 1, 1);
    ok(updated.includes("nan-publish-stable | in-progress | settled by the writer"));
    // The `[#498]` row and the foreign bytes carried through.
    ok(updated.includes("| [#498](https://github.com/x/y/issues/498) | shared-writer-driver | in-progress | this unit |"));
    ok(updated.includes("legend prose"));
  });

  it("fixRowUpsert never touches a feature table in the same document", () => {
    const bothPath = join(dir, "BOTH.md");
    writeFileSync(
      bothPath,
      [
        "# Index",
        "",
        "## Features",
        "",
        "| NN | slug | status | depends-on | description |",
        "|---|---|---|---|---|",
        "| 12 | feature-unit | idea | — | a feature row |",
        "",
        "## Fixes",
        "",
        "| Issue | Topic | Status | Notes |",
        "|---|---|---|---|",
        "",
      ].join("\n"),
      "utf8",
    );
    const receipt = fixRowUpsert(bothPath, {
      issue: 7,
      url: "https://github.com/x/y/issues/7",
      topic: "a-fix",
      status: "pending",
      notes: "—",
    });
    strictEqual(receipt.ok, true);
    const content = readFileSync(bothPath, "utf8");
    ok(content.includes("| [#7](https://github.com/x/y/issues/7) | a-fix | pending | — |"));
    ok(content.includes("| 12 | feature-unit | idea | — | a feature row |"));
  });

  it("CLI: roadmap read answers a revision receipt; stale writes refuse with exit 2", (t, done) => {
    const cliDir = mkdtempSync(join(tmpdir(), "aw-roadmap-cli-"));
    const cliPath = join(cliDir, "ROADMAP.md");
    writeFileSync(cliPath, FIXTURE, "utf8");
    const agwoPath = join(fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url)));
    const readProc = spawn("node", [agwoPath, "roadmap", "read", cliPath, "--json"], { cwd: cliDir, timeout: 10000 });
    let readOut = "";
    readProc.stdout.on("data", (d) => { readOut += d.toString(); });
    readProc.on("close", (code) => {
      try {
        strictEqual(code, 0);
        const receipt = JSON.parse(readOut);
        strictEqual(receipt.op, "read");
        strictEqual(receipt.ok, true);
        ok(/^[0-9a-f]{64}$/.test(receipt.revision));
        runStaleRowUpsert(receipt.revision);
      } catch (e) {
        rmSync(cliDir, { recursive: true, force: true });
        done(e);
      }
    });

    function runStaleRowUpsert(revision) {
      const payload = JSON.stringify({ nn: "12", slug: "first-unit", status: "done", dependsOn: "—", description: "stale", expected: revision });
      // First write moves the file; the second write with the same read refuses.
      const first = spawn("node", [agwoPath, "roadmap", cliPath, "annotate", "12", "moves the table", "--json"], { cwd: cliDir, timeout: 10000 });
      first.on("close", (c1) => {
        try {
          strictEqual(c1, 0);
          const second = spawn("node", [agwoPath, "roadmap", cliPath, "rowUpsert", payload, "--json"], { cwd: cliDir, timeout: 10000 });
          let err = "";
          let out = "";
          second.stdout.on("data", (d) => { out += d.toString(); });
          second.stderr.on("data", (d) => { err += d.toString(); });
          second.on("close", (c2) => {
            try {
              strictEqual(c2, 2);
              ok(err.includes("stale-read"), err);
              ok(err.includes("EDIT REFUSAL"), err);
              const readBack = readShared(cliPath);
              const third = spawn("node", [agwoPath, "roadmap", cliPath, "annotate", "12", "CAS via CLI", "--expect", readBack.revision, "--json"], { cwd: cliDir, timeout: 10000 });
              let okOut = "";
              third.stdout.on("data", (d) => { okOut += d.toString(); });
              third.on("close", (c3) => {
                try {
                  strictEqual(c3, 0);
                  strictEqual(JSON.parse(okOut).ok, true);
                  ok(readFileSync(cliPath, "utf8").includes("— CAS via CLI"));
                  rmSync(cliDir, { recursive: true, force: true });
                  done();
                } catch (e) {
                  rmSync(cliDir, { recursive: true, force: true });
                  done(e);
                }
              });
            } catch (e) {
              rmSync(cliDir, { recursive: true, force: true });
              done(e);
            }
          });
        } catch (e) {
          rmSync(cliDir, { recursive: true, force: true });
          done(e);
        }
      });
    }
  });

  it("CLI: roadmap fixrow writes a Fixes row — no hand edit", (t, done) => {
    const cliDir = mkdtempSync(join(tmpdir(), "aw-fixrow-cli-"));
    const cliPath = join(cliDir, "ROADMAP.md");
    writeFileSync(
      cliPath,
      ["# Index", "", "## Fixes", "", "| Issue | Topic | Status | Notes |", "|---|---|---|---|", ""].join("\n"),
      "utf8",
    );
    const agwoPath = join(fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url)));
    const payload = JSON.stringify({ issue: 499, url: "https://github.com/x/y/issues/499", topic: "next-fix", status: "pending", notes: "via CLI" });
    const proc = spawn("node", [agwoPath, "roadmap", "fixrow", cliPath, payload, "--json"], { cwd: cliDir, timeout: 10000 });
    let stdout = "";
    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.on("close", (code) => {
      try {
        strictEqual(code, 0);
        strictEqual(JSON.parse(stdout).ok, true);
        ok(readFileSync(cliPath, "utf8").includes("| [#499](https://github.com/x/y/issues/499) | next-fix | pending | via CLI |"));
        rmSync(cliDir, { recursive: true, force: true });
        done();
      } catch (e) {
        rmSync(cliDir, { recursive: true, force: true });
        done(e);
      }
    });
  });

  // External-verify B1: the bin usage header, SPEC P3 and D5 promise
  // `--expect <hash>` on rowUpsert/fixrow; the flag must refuse a stale read
  // with exit 2 before mutation — never be silently ignored with success.
  it("CLI: --expect is honored on rowUpsert and fixrow — a stale flag refuses exit 2 before mutation (B1)", async () => {
    const cliDir = mkdtempSync(join(tmpdir(), "aw-expect-cli-"));
    try {
      const cliPath = join(cliDir, "ROADMAP.md");
      writeFileSync(cliPath, `${FIXTURE}\n## Fixes\n\n| Issue | Topic | Status | Notes |\n|---|---|---|---|\n`, "utf8");
      const before = readFileSync(cliPath, "utf8");
      const agwoPath = join(fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url)));
      const stale = "0".repeat(64);
      const run = (args) =>
        new Promise((resolve) => {
          const p = spawn("node", [agwoPath, ...args], { cwd: cliDir, timeout: 10000 });
          let stdout = "";
          let stderr = "";
          p.stdout.on("data", (d) => { stdout += d.toString(); });
          p.stderr.on("data", (d) => { stderr += d.toString(); });
          p.on("close", (code) => resolve({ code, stdout, stderr }));
        });

      const upPayload = JSON.stringify({ nn: "13", slug: "expect-flag", status: "planned", dependsOn: "—", description: "flag CAS" });
      const upStale = await run(["roadmap", cliPath, "rowUpsert", upPayload, "--expect", stale, "--json"]);
      strictEqual(upStale.code, 2);
      ok(upStale.stderr.includes("stale-read"), upStale.stderr);
      strictEqual(readFileSync(cliPath, "utf8"), before);

      const fixPayload = JSON.stringify({ issue: 497, url: "https://github.com/x/y/issues/497", topic: "flag-cas", status: "open", notes: "n" });
      const fixStale = await run(["roadmap", cliPath, "fixrow", fixPayload, "--expect", stale, "--json"]);
      strictEqual(fixStale.code, 2);
      ok(fixStale.stderr.includes("stale-read"), fixStale.stderr);
      strictEqual(readFileSync(cliPath, "utf8"), before);

      const upFresh = await run(["roadmap", cliPath, "rowUpsert", upPayload, "--expect", readShared(cliPath).revision, "--json"]);
      strictEqual(upFresh.code, 0);
      strictEqual(JSON.parse(upFresh.stdout).ok, true);

      const fixFresh = await run(["roadmap", cliPath, "fixrow", fixPayload, "--expect", readShared(cliPath).revision, "--json"]);
      strictEqual(fixFresh.code, 0);
      ok(readFileSync(cliPath, "utf8").includes("| [#497](https://github.com/x/y/issues/497) | flag-cas |"));
    } finally {
      rmSync(cliDir, { recursive: true, force: true });
    }
  });
});

function strictNotEqual(a, b) {
  if (a === b) throw new Error(`Expected ${a} !== ${b}`);
}
