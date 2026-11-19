#!/usr/bin/env node
// test-obligation: protects=packages/agentic-workflow/src/runner/sensors/substrate.mjs,skills/orchestration-envelope/references/TURN_CONTRACT.md obligations=contract,failure-path

/**
 * substrate.test.mjs — the substrate census, its coverage gate, and the single
 * owner of the alarm's route vocabulary (issue #644, S3/S4).
 *
 * Two things are asserted here, and they are deliberately in one suite because
 * they are one mechanic:
 *
 *   1. `agentic-workflow substrate check` reads a workspace and reports, per
 *      substrate class, whether the surface that would own that class is
 *      present, declined with a recorded row, or absent. Exit 0 only when no
 *      class is absent: the gate `init-workspace` runs on both routes.
 *   2. The route vocabulary the alarm publishes is *one* closed set: the schema
 *      const, the crate's dispatcher, and the `open-questions@1` block's
 *      `route:` line. A token invented on one side fails here.
 *
 * Every fixture is written to a `mktemp` tree at run time and removed after:
 * nothing under the repository is mutated, and the assertions are at the CLI
 * boundary because that boundary is what the skills paste.
 */

import test, { after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { schemaRuntimePath } from "./schema-runtime.mjs";

const BIN = fileURLToPath(new URL("../packages/agentic-workflow/bin/agentic-workflow.mjs", import.meta.url));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "substrate-corpus-"));

after(() => fs.rmSync(TMP, { recursive: true, force: true }));

let counter = 0;

const GUIDE_WITH_MAP = `# Fixture project

## Documentation map

| Task | Required docs |
|---|---|
| Any change | \`docs/architecture/ARCHITECTURE.md\` |

## Project charter

- **Decision records:** one ADR per irreversible decision
- **API posture:** safer-API — reject the misuse at the boundary
`;

const ARCHITECTURE = `# Architecture

One module boundary: the runner reads, the skills decide.
`;

/** The decline block, in the shape the template guide publishes. */
function declineBlock(...rows) {
  return [
    "",
    "```text",
    "substrate-declines@1",
    "class | date | owner",
    ...rows,
    "```",
    "",
  ].join("\n");
}

/**
 * Write a workspace and return its path. Every surface is optional so a fixture
 * names exactly the gap it wants to observe.
 */
function workspace({ guide = GUIDE_WITH_MAP, architecture = ARCHITECTURE, charter = true } = {}) {
  const dir = path.join(TMP, `ws-${++counter}`);
  fs.mkdirSync(path.join(dir, "docs", "architecture"), { recursive: true });
  const g = charter ? guide : guide.replace(/\n## Project charter[\s\S]*$/, "\n");
  fs.writeFileSync(path.join(dir, "AGENTS.md"), g);
  if (architecture !== null) fs.writeFileSync(path.join(dir, "docs", "architecture", "ARCHITECTURE.md"), architecture);
  return dir;
}

/** Run the coverage gate; returns { status, stdout, stderr }. */
function run(...args) {
  const result = spawnSync(process.execPath, [BIN, "substrate", "check", ...args], { encoding: "utf8" });
  if (result.error && result.error.code === "ENOENT") return null;
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** One `- <class> · <state> · <evidence>` row of the block, or undefined. */
function row(stdout, name) {
  return stdout.split("\n").find((line) => line.startsWith(`- ${name} · `));
}

test("coverage gate — a complete install exits 0 and names every class present", () => {
  const result = run("--workspace", workspace());

  assert.equal(result.status, 0, result.stderr);
  const lines = result.stdout.split("\n");
  assert.equal(lines[0], "substrate-coverage@1");
  for (const name of ["architecture", "decision-records", "api-posture", "documentation-map"]) {
    assert.match(row(result.stdout, name), new RegExp(`^- ${name} · present · .+$`), `${name} is present`);
  }
  assert.match(result.stdout, /^Summary: 4 classes · 4 present · 0 declined · 0 absent$/m);
  assert.match(result.stdout, /^Verdict: complete$/m);
});

test("coverage gate — a missing architecture doc is absent, named with its path, and exits 1", () => {
  const result = run("--workspace", workspace({ architecture: null }));

  assert.equal(result.status, 1, "a gap is not a pass");
  assert.equal(row(result.stdout, "architecture"), "- architecture · absent · docs/architecture/ARCHITECTURE.md");
  assert.match(result.stdout, /^Summary: 4 classes · 3 present · 0 declined · 1 absent$/m);
  assert.match(result.stdout, /^Verdict: gap$/m);
});

test("coverage gate — an architecture doc that is only a placeholder is absent", () => {
  const result = run("--workspace", workspace({ architecture: "# Architecture\n\n<what this project's architecture is>\n" }));

  assert.equal(result.status, 1, "a documented shape is not an answer");
  assert.match(row(result.stdout, "architecture"), /· absent · /);
});

test("coverage gate — an unfilled charter slot is absent, the filled one is present", () => {
  const result = run("--workspace", workspace({
    guide: GUIDE_WITH_MAP.replace("- **API posture:** safer-API — reject the misuse at the boundary", "- **API posture:** `<safer-API or the team's error contract>`"),
  }));

  assert.equal(result.status, 1);
  assert.equal(row(result.stdout, "decision-records"), "- decision-records · present · AGENTS.md § Project charter · Decision records");
  assert.equal(row(result.stdout, "api-posture"), "- api-posture · absent · AGENTS.md § Project charter · API posture");
});

test("coverage gate — a guide without the documentation map has no owner for it", () => {
  const guide = GUIDE_WITH_MAP.replace("## Documentation map", "## Docs");
  const result = run("--workspace", workspace({ guide }));

  assert.equal(result.status, 1);
  assert.equal(row(result.stdout, "documentation-map"), "- documentation-map · absent · AGENTS.md § Documentation map");
});

test("coverage gate — a recorded decline makes its class non-blocking", () => {
  const guide = `${GUIDE_WITH_MAP}${declineBlock("architecture | 2026-11-19 | human-owner")}`;
  const result = run("--workspace", workspace({ guide, architecture: null }));

  assert.equal(result.status, 0, "a declined class is a decision, not a gap");
  assert.equal(row(result.stdout, "architecture"), "- architecture · declined · AGENTS.md § substrate-declines@1 · D1");
  assert.match(result.stdout, /^Verdict: complete$/m);
});

test("coverage gate — a decline row naming a class outside the set is refused", () => {
  const guide = `${GUIDE_WITH_MAP}${declineBlock("billing | 2026-11-19 | human-owner")}`;
  const result = run("--workspace", workspace({ guide }));

  assert.equal(result.status, 2, "an unknown class is a refusal, never ignored");
  assert.match(result.stdout, /^SUBSTRATE REFUSAL — substrate-coverage@1$/m);
  assert.match(result.stdout, /^Reason: unknown-class$/m);
  assert.match(result.stdout, /^Where: AGENTS\.md:\d+$/m);
});

test("coverage gate — a decline row that is not dated and owned is refused", () => {
  for (const bad of ["architecture | soon | human-owner", "architecture | 2026-11-19", "| 2026-11-19 | human-owner"]) {
    const guide = `${GUIDE_WITH_MAP}${declineBlock(bad)}`;
    const result = run("--workspace", workspace({ guide }));
    assert.equal(result.status, 2, `refused: ${bad}`);
    assert.match(result.stdout, /^Reason: malformed-declines$/m, `refused: ${bad}`);
  }
});

test("coverage gate — two declines for one class are refused instead of one winning", () => {
  const guide = `${GUIDE_WITH_MAP}${declineBlock("architecture | 2026-11-19 | human-owner", "architecture | 2026-11-20 | human-owner")}`;
  const result = run("--workspace", workspace({ guide }));

  assert.equal(result.status, 2);
  assert.match(result.stdout, /^Reason: duplicate-class$/m);
});

test("coverage gate — --json emits the same computation", () => {
  const result = run("--workspace", workspace({ architecture: null }), "--json");

  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.block, "substrate-coverage@1");
  assert.equal(parsed.verdict, "gap");
  assert.deepEqual(parsed.summary, { classes: 4, present: 3, declined: 0, absent: 1 });
  const architecture = parsed.classes.find((entry) => entry.name === "architecture");
  assert.deepEqual(architecture, { name: "architecture", state: "absent", evidence: "docs/architecture/ARCHITECTURE.md" });
});

test("coverage gate — the block is byte-stable across runs", () => {
  const dir = workspace();
  const first = run("--workspace", dir).stdout;
  const second = run("--workspace", dir).stdout;
  assert.equal(first, second, "no clock, no ordering by readdir, no run-dependent bytes");
});

test("coverage gate — a workspace that does not exist is a usage error, not a gap", () => {
  const result = run("--workspace", path.join(TMP, "does-not-exist"));

  assert.equal(result.status, 2);
  assert.match(result.stderr, /^substrate: .*not a directory/m);
});

test("coverage gate — no --workspace is a usage error", () => {
  const result = run();

  assert.equal(result.status, 2);
  assert.match(result.stderr, /^substrate: /m);
  assert.match(result.stderr, /usage: agentic-workflow substrate check --workspace <dir>/m);
});

test("coverage gate — an unknown option is a usage error", () => {
  const result = run("--workspace", workspace(), "--nope");

  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown option: --nope/m);
});

test("route vocabulary — the schema, the crate and the published block are one closed set", async () => {
  const schema = await import(schemaRuntimePath);
  const runner = await import("../packages/agentic-workflow/src/runner/sensors/needs-input.mjs");
  const block = fs.readFileSync(
    path.join(ROOT, "skills", "orchestration-envelope", "references", "TURN_CONTRACT.md"),
    "utf8",
  );

  assert.deepEqual([...schema.NEEDS_INPUT_ROUTES], ["design", "unit-lane", "init-workspace"], "the schema publishes the set");
  assert.deepEqual([...runner.ROUTES], [...schema.NEEDS_INPUT_ROUTES], "the dispatcher imports the set, never a literal copy");
  assert.deepEqual([...schema.SUBSTRATE_CLASSES], ["architecture", "decision-records", "api-posture", "documentation-map"]);

  const published = /^route:\s+(.+)$/m.exec(block);
  assert.ok(published, "the open-questions@1 block publishes its route line");
  for (const route of schema.NEEDS_INPUT_ROUTES) {
    assert.ok(published[1].includes(route), `the block's route line names ${route}`);
  }
  // The class set is not restated in the block: the block cites its owner, which
  // is the residency rule the pin exists to protect. The tokens are compared
  // against the schema const above, one home, no second copy.
  assert.match(block, /schema-export:SUBSTRATE_CLASSES/, "the block cites the class vocabulary's owner");
});

test("route vocabulary — the dispatcher verifies a substrate route against the census, never trusting the cell", () => {
  const source = fs.readFileSync(path.join(ROOT, "packages", "agentic-workflow", "src", "runner", "sensors", "needs-input.mjs"), "utf8");

  assert.match(source, /from "\.\/substrate\.mjs"/, "the census is imported, not re-derived");
  assert.match(source, /substrate-present/, "the refusal for an owned surface exists");
  assert.match(source, /missing-workspace/, "a substrate claim with no workspace fails closed");
});
