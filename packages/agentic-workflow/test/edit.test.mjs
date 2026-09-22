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
import { spawn } from "node:child_process";

// ── SDK imports ──────────────────────────────────────────────────────────
import { create, setSection, evidence_addRow, progress_logEntry, validate } from "../src/edit/UnitDoc.mjs";
import { rowUpsert, annotate } from "../src/edit/Roadmap.mjs";
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
  it("create produces 13 sections in order", () => {
    const receipt = create(unitDir, "61-test-slug");
    strictEqual(receipt.ok, true);
    strictEqual(receipt.service, "unitDoc");
    strictEqual(receipt.op, "create");

    const content = readFileSync(specPath, "utf8");
    const sections = [
      "Objective", "Why", "User outcome", "Acceptance criteria",
      "Non-goals", "Future cost", "Applicable tests",
      "Known pre-existing issues", "Tasks", "Evidence",
      "Progress log", "Next", "References",
    ];

    // All 13 sections must exist in order
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

    const agwoPath = join(process.cwd(), "bin", "agentic-workflow.mjs");

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

function strictNotEqual(a, b) {
  if (a === b) throw new Error(`Expected ${a} !== ${b}`);
}
