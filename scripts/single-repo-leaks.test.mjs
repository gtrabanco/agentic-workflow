#!/usr/bin/env node
// test-obligation: protects=packages/agentic-workflow/src/single-repo-leaks/index.mjs,packages/agentic-workflow/src/runner/help.mjs,packages/agentic-workflow/src/test-obligation-tags/index.mjs,packages/agentic-workflow/src/dimension-regression/index.mjs obligations=contract,failure-path

/**
 * The single-repo-leak corpus (issue #717).
 *
 * Two halves, and no heuristic between them:
 *
 *   declaration  every subcommand the CLI publishes states which root it
 *                resolves against, and a missing or unknown cell is refused;
 *   probe        the read-only `project` rows run once against a
 *                consumer-shaped fixture — `template/` seeded, a `src/**` tree,
 *                no `packages/`, no root `skills/` — and a path token that
 *                resolves in the product tree but not in the fixture is the
 *                finding the class is about.
 *
 * The three repaired surfaces keep their own named cases here too, because the
 * census's claim is about *their* foreign-tree answer: `phase-lint` on a
 * consumer-tree unit doc, `test-obligation-tags` on a root with no `packages/`,
 * `dimension-regression` on a range whose carrier is absent.
 */

import test, { after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  CONTRACT,
  RESOLUTIONS,
  buildFixture,
  census,
  declarations,
  main,
  pathTokens,
  productPathFindings,
  renderReceipt,
} from "../packages/agentic-workflow/src/single-repo-leaks/index.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BIN = path.join(REPO, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs");
const CENSUS = path.join(REPO, "docs", "fix", "717-audit-single-repo-leaks", "census.md");
/** The closed classification vocabulary (`D1`): the union of S4 and S11. */
const CLASSIFICATIONS = Object.freeze([
  "declared-convention",
  "construction-only (documented)",
  "construction-only (undocumented)",
  "defect",
  "intentional",
]);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "single-repo-leaks-corpus-"));
const FIXTURE = path.join(TMP, "consumer");
fs.mkdirSync(FIXTURE, { recursive: true });
buildFixture(FIXTURE, REPO);
// A consumer tree is a git checkout; `dimension-regression` reads a range, and a
// missing history would hide the carrier question behind an unrelated error.
spawnSync("git", ["init", "-q"], { cwd: FIXTURE });
spawnSync("git", ["add", "-A"], { cwd: FIXTURE });
spawnSync("git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "commit", "-qm", "fixture"], { cwd: FIXTURE });

after(() => fs.rmSync(TMP, { recursive: true, force: true }));

const registry = async () => (await import("../packages/agentic-workflow/src/runner/help.mjs")).HELP_REGISTRY;

function published() {
  const result = spawnSync(process.execPath, [BIN, "help", "--json"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout).subcommands.map((entry) => entry.name).sort();
}

function run(argv, options = {}) {
  return spawnSync(process.execPath, [BIN, ...argv], { encoding: "utf8", ...options });
}

/** The census's candidate table, parsed out of its own document. */
function censusRows(text) {
  const lines = String(text).split("\n");
  const head = lines.findIndex((line) => line.startsWith("| id | candidate | classification | reproducer | route |"));
  assert.notEqual(head, -1, "census.md carries the candidate table");
  const rows = [];
  for (const line of lines.slice(head + 2)) {
    if (!line.startsWith("|")) break;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    // A cell's markup is presentation: the value is what the closed set matches.
    const plain = (cell) => cell.replace(/^`([^`]*)`$/u, "$1").trim();
    rows.push({ id: cells[0], candidate: cells[1], classification: plain(cells[2]), reproducer: cells[3], route: cells[4] });
  }
  return rows;
}

test("S2: every subcommand the CLI publishes declares its path-resolution class", async () => {
  const table = await registry();
  const declared = declarations(table);
  assert.deepEqual(declared.findings, [], "every registry entry declares one resolution cell");
  assert.deepEqual(
    declared.rows.map((row) => row.command).sort(),
    published(),
    "the registry and the published index name the same subcommands",
  );
  for (const row of declared.rows) assert.ok(RESOLUTIONS.includes(row.resolution), `${row.command} declares ${row.resolution}`);
});

test("S2: a registry entry without a declaration or with an unknown one is refused by name", () => {
  const missing = declarations({ thing: { family: "lane", summary: "x" } });
  assert.deepEqual(missing.findings.map((finding) => finding.code), ["undeclared-command"]);
  const unknown = declarations({ thing: { family: "lane", resolution: "elsewhere" } });
  assert.deepEqual(unknown.findings.map((finding) => finding.code), ["unknown-resolution"]);
  assert.match(unknown.findings[0].detail, /project\/product\/host/);
  const empty = declarations({});
  assert.deepEqual(empty.findings.map((finding) => finding.code), ["empty-registry"]);
});

test("S3: a read-only command on a foreign tree names no product-internal path", async () => {
  const table = await registry();
  const result = census({ registry: table, root: FIXTURE, productRoot: REPO, bin: BIN });
  assert.ok(result.probed.length >= 6, `at least six read-only project commands are probed (got ${result.probed.length})`);
  const leaked = result.findings.filter((finding) => finding.code === "product-path-named");
  assert.deepEqual(leaked, [], `no probe names a product-only path:\n${leaked.map((finding) => `${finding.command} → ${finding.detail}`).join("\n")}`);
});

test("S3: the leak rule measures resolution, not wording", () => {
  const output = [
    "checking /home/agent/projects/agentic-workflow/packages/agentic-workflow/README.md done",
    "refusal — packages/agentic-workflow-schema/src/vocabularies.ts is absent under /tmp/fixture",
    "docs/ROADMAP.md is seeded in both trees",
    "the project's own scripts/build.mjs is not a product path",
  ].join("\n");
  const findings = productPathFindings({ command: "probe", output, root: FIXTURE, productRoot: REPO });
  assert.deepEqual(findings.map((finding) => finding.code), ["product-path-named"]);
  assert.match(findings[0].detail, /packages\/agentic-workflow-schema\/src\/vocabularies\.ts/);
  assert.deepEqual(pathTokens("nothing here"), []);
});

test("S4: the census classifies all six candidates with a reproducer", () => {
  const rows = censusRows(fs.readFileSync(CENSUS, "utf8"));
  assert.equal(rows.length, 6, "one row per candidate");
  assert.deepEqual(rows.map((row) => row.id), ["C1", "C2", "C3", "C4", "C5", "C6"]);
  for (const row of rows) {
    assert.ok(CLASSIFICATIONS.includes(row.classification), `${row.id} carries a closed classification, got "${row.classification}"`);
    assert.match(row.reproducer, /`[^`]+`/, `${row.id} carries a backticked reproducer`);
    assert.ok(row.route !== "", `${row.id} names its route`);
  }
});

test("S10: the producer prints the receipt with zero findings and refuses a missing root", async () => {
  const table = await registry();
  const result = census({ registry: table, root: FIXTURE, productRoot: REPO, bin: BIN });
  const receipt = renderReceipt(result);
  assert.match(receipt, /^single-repo-leaks@1$/m);
  assert.match(receipt, /^declared \| \d+ subcommand\(s\) · project \d+ · product \d+ · host \d+$/m);
  assert.equal(result.verdict, "PASS", receipt);
  const refused = census({ registry: table, root: path.join(TMP, "absent"), productRoot: REPO, bin: BIN });
  assert.equal(refused.verdict, "REFUSED");
  assert.deepEqual(refused.findings.map((finding) => finding.code), ["missing-root"]);
  assert.equal(await main(["--bogus"]), 2);
});

test("S10: an undeclared command fails the producer", async () => {
  const table = await registry();
  const broken = { ...table, "not-a-command": { family: "lane", summary: "a subcommand with no declaration" } };
  const result = census({ registry: broken, root: FIXTURE, productRoot: REPO, bin: BIN });
  assert.equal(result.verdict, "FAIL");
  assert.ok(result.findings.some((finding) => finding.code === "undeclared-command" && finding.command === "not-a-command"));
});

test("S11 (a): a consumer-tree unit doc lints in the unit-doc grammar", () => {
  const file = path.join(FIXTURE, "docs", "fix", "49-ledger", "SPEC.md");
  fs.writeFileSync(
    file,
    [
      "# fix/49-ledger",
      "",
      "## Specs",
      "",
      "**S1 — the page exists.**",
      "> Create the ledger page.",
      "",
      "## Tasks",
      "",
      "- P1 — Create the ledger page (validator: `bun test src/pages/ledger.test.ts` exits 0)",
      "  (Implements: S1)",
      "  - Relevant files: src/pages/ledger.ts, src/pages/ledger.test.ts",
      "",
      "## Log",
      "",
      "- **L1** — 2026-12-24, the request, verbatim:",
      "  ```",
      "  Create the ledger page.",
      "  ```",
      "",
    ].join("\n"),
  );
  const result = run(["phase-lint", file]);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /^verdict PASS$/m);
});

test("S11 (b): the foreign-tree estate run names its legs instead of reporting a silent zero", () => {
  const result = run(["test-obligation-tags", "--root", FIXTURE]);
  const output = `${result.stdout}${result.stderr}`;
  assert.doesNotMatch(output, /packages\/agentic-workflow-schema\/src\/vocabularies\.ts is absent/, output);
  assert.match(output, /estate-empty/, output);
});

test("S7: a carrier absent from the measured tree is named, never compared as zero", () => {
  const result = run(["dimension-regression", "--root", FIXTURE, "--base", "HEAD"]);
  const output = `${result.stdout}${result.stderr}`;
  assert.match(output, /carrier \| skills\/product-audit\/references\/AUDIT_DIMENSIONS\.md absent/, output);
});

test("S10: the census contract is published and the suite declares its own surface", () => {
  assert.equal(CONTRACT, "single-repo-leaks@1");
  assert.deepEqual(RESOLUTIONS, ["project", "product", "host"]);
});
