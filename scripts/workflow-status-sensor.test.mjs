#!/usr/bin/env node

/**
 * Feature 38 — `scripts/workflow-status.mjs`, the deterministic sensor.
 *
 * One fixture-repo suite grown phase by phase. P1 writes the core-emission pins
 * (schema validity, field presence, read-only, idempotence, roadmap mapping,
 * labels-only, flag contract, envelope-mismatch diagnostic); P2 extends it with
 * the declared failure contract. Tests are written red-first inside the phase
 * that implements the behaviour and are never edited to pass.
 *
 * Fixtures are real git repositories under `os.tmpdir()` (the pattern
 * `scripts/workflow-status-pre-execution.test.mjs` established) with a `gh` shim
 * on PATH — no network, no repository mutation, no shared state.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(repoRoot, "scripts", "workflow-status.mjs");
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");

/** The built schema runtime — the same loader the script must consume (A:8). */
const { loadSchemaRuntime } = await import("./schema-runtime.mjs");
const { validateEnvelope } = await loadSchemaRuntime();

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

const ROADMAP_HEADER = [
  "# Roadmap",
  "",
  "## Features",
  "",
  "| NN | Slug | Status | Depends on | Summary |",
  "|----|------|--------|------------|---------|",
].join("\n");

const FIX_INDEX = [
  "# Active fixes",
  "",
  "## Active",
  "",
  "| Issue | Topic | Status | Notes |",
  "|---|---|---|---|",
].join("\n");

const FROZEN_NRS = [
  "# Normalized repository state",
  "",
  "Status: frozen",
  "",
  "Snapshot: fix-1",
].join("\n");

/**
 * A throwaway git repository with the substrate the sensor reads, plus a `gh`
 * shim whose canned JSON is controlled per test. Returns `{dir, binDir, run}`.
 */
function makeFixture({ roadmapRows = [], issues = [], openPrs = [], mergedPrs = [], nrs = FROZEN_NRS, extraFiles = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-status-fixture-"));
  const binDir = path.join(dir, "bin");
  fs.mkdirSync(binDir, { recursive: true });

  const write = (rel, content) => {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };

  write("docs/features/ROADMAP.md", `${ROADMAP_HEADER}\n${roadmapRows.join("\n")}\n`);
  write("docs/fix/README.md", `${FIX_INDEX}\n`);
  if (nrs !== null) write("docs/workflow/REPOSITORY_STATE.md", nrs);
  for (const [rel, content] of Object.entries(extraFiles)) write(rel, content);

  const shim = `#!/usr/bin/env node
const args = process.argv.slice(2).join(" ");
const out = (value) => { process.stdout.write(JSON.stringify(value)); process.exit(0); };
if (args.includes("pr list") && args.includes("--state open")) out(${JSON.stringify(openPrs)});
if (args.includes("pr list") && args.includes("--state merged")) out(${JSON.stringify(mergedPrs)});
if (args.includes("issue list")) out(${JSON.stringify(issues)});
process.stderr.write("unexpected gh call: " + args + "\\n");
process.exit(1);
`;
  const ghPath = path.join(binDir, "gh");
  fs.writeFileSync(ghPath, shim, { mode: 0o755 });

  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
  execFileSync("git", ["config", "user.email", "fixture@example.com"], { cwd: dir });
  execFileSync("git", ["config", "user.name", "Fixture"], { cwd: dir });
  execFileSync("git", ["add", "-A"], { cwd: dir });
  execFileSync("git", ["commit", "-q", "-m", "fixture"], { cwd: dir });

  const run = (args = [], opts = {}) => spawnSync(process.execPath, [opts.script ?? SCRIPT, ...args], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, PATH: `${binDir}:${process.env.PATH}`, ...opts.env },
    timeout: opts.timeout ?? 60_000,
  });

  return { dir, binDir, run, write };
}

const parseEnvelope = (stdout) => JSON.parse(stdout);

// ===========================================================================
// P1 — Sensor script core emission
// ===========================================================================

test("P1: the sensor script exists at the expected path (A:1)", () => {
  assert.ok(fs.existsSync(SCRIPT), `${SCRIPT} is missing`);
});

test("P1: the emitted envelope is a valid Envelope v2 document (A:2)", () => {
  const { run } = makeFixture({
    roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"],
  });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  const validation = validateEnvelope(envelope);
  assert.equal(validation.ok, true, `schema errors: ${validation.errors?.join("; ")}`);
  assert.equal(envelope.skill, "workflow-status");
});

test("P1: the envelope carries every required Envelope v2 key in shape (A:2)", () => {
  const { run } = makeFixture();
  const envelope = parseEnvelope(run().stdout);
  for (const key of [
    "skill", "state", "summary", "unit", "phase", "pr", "gates", "findings",
    "blockers", "dependencies", "recommendations", "needs_input", "next", "detail",
  ]) {
    assert.ok(key in envelope, `missing key: ${key}`);
  }
  assert.equal(typeof envelope.pr, "object");
  assert.ok(Array.isArray(envelope.pr) === false, "pr must be an object, not an array");
  assert.ok("recommended" in envelope.next && "alternatives" in envelope.next && "tier" in envelope.next);
  assert.ok(!("state" in envelope.next), "next.state must not exist");
  assert.ok(Array.isArray(envelope.blockers));
  assert.ok(Array.isArray(envelope.dependencies.unmet));
});

test("P1: the source is read-only — no mutation calls (A:3)", () => {
  const source = read("scripts/workflow-status.mjs");
  const mutation = /(createBranch|git push|gh pr (edit|merge|close|create)|gh issue (edit|close|label|create)|writeFile|fs\.write|unlink)/;
  const hits = source.split("\n").filter((line) => mutation.test(line));
  assert.deepEqual(hits, [], `mutation calls found: ${hits.join(" | ")}`);
});

test("P1: the source is headless — no interactive-prompt calls (A:22)", () => {
  const source = read("scripts/workflow-status.mjs");
  const prompt = /(readline|createInterface|process\.stdin\.(read|setRawMode)|@clack|inquirer|prompts?\(|confirm\()/;
  const hits = source.split("\n").filter((line) => prompt.test(line));
  assert.deepEqual(hits, [], `prompt calls found: ${hits.join(" | ")}`);
});

test("P1: two consecutive runs are byte-identical (A:5, idempotence)", () => {
  const { run } = makeFixture({
    roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"],
    issues: [{ number: 3, title: "urgent thing", labels: [{ name: "urgent" }] }],
  });
  const first = run();
  const second = run();
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.stdout, first.stdout);
});

test("P1: an ambiguous roadmap row maps to the nearest five-state value and is named (A:6)", () => {
  const { run } = makeFixture({
    roadmapRows: ["| 91 | `beta` | scheduled | — | weird status |"],
  });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  const observations = envelope.detail.workflow_observations.join("\n");
  assert.match(observations, /scheduled/, "the raw status string must be named");
  assert.match(observations, /idea/, "the mapped state must be named");
  const candidate = envelope.detail.design_candidates.find((c) => c.id === "91-beta");
  assert.ok(candidate, `91-beta must be a design candidate: ${JSON.stringify(envelope.detail.design_candidates)}`);
  assert.equal(candidate.status, "idea");
  assert.equal(candidate.next, "/design-feature 91-beta");
});

test("P1: urgency comes from the labels object only — labels-only scan (A:7)", () => {
  const source = read("scripts/workflow-status.mjs");
  const forbidden = source.split("\n").filter((line) => /--json[^|]*(body|comment)/.test(line));
  assert.deepEqual(forbidden, [], `a forge --json field list requests body/comment: ${forbidden.join(" | ")}`);
  assert.ok((source.match(/labels/g) ?? []).length >= 1, "the labels-only scan path must exist");

  const { run } = makeFixture({
    issues: [
      { number: 3, title: "labelled", labels: [{ name: "urgent" }] },
      { number: 4, title: "unlabelled", labels: [] },
    ],
  });
  const envelope = parseEnvelope(run().stdout);
  assert.deepEqual(envelope.detail.urgent.issues, [{ number: 3, title: "labelled", label: "urgent" }]);
});

test("P1: forge reads stay on explicit --json field lists (A:7/A-RV invariant)", () => {
  const source = read("scripts/workflow-status.mjs");
  const jsonLists = source.split("\n").filter((line) => line.includes("--json"));
  assert.ok(jsonLists.length >= 1, "the script must read the forge on explicit --json field lists");
  for (const line of jsonLists) {
    assert.doesNotMatch(line, /body|comment/, `extended fields are read: ${line.trim()}`);
  }
  assert.match(source, /"pr", "list", "--state", "open", "--json"/);
  assert.match(source, /"issue", "list", "--state", "open", "--json"/);
});

test("P1: the loader import form is the repo's established relative path (A:8)", () => {
  const source = read("scripts/workflow-status.mjs");
  assert.match(source, /from ['"]\.\/schema-runtime\.mjs['"]/);
  assert.doesNotMatch(source, /^import .*['"]@gtrabanco\/agentic-workflow-schema['"]/m);
});

test("P1: decideWorkflowAction() stays consumer-side — absent from the script (A:12)", () => {
  assert.equal((read("scripts/workflow-status.mjs").match(/decideWorkflowAction/g) ?? []).length, 0);
});

test("P1: --help exits 0 and prints usage; --version prints the schema package version (A:10)", () => {
  const help = spawnSync(process.execPath, [SCRIPT, "--help"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /[Uu]sage/);

  const version = spawnSync(process.execPath, [SCRIPT, "--version"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(version.status, 0, version.stderr);
  const pkg = JSON.parse(read("packages/agentic-workflow-schema/package.json"));
  assert.ok(version.stdout.includes(pkg.version), `expected ${pkg.version} in: ${version.stdout}`);
});

test("P1: --json-only is an accepted no-op (A:17)", () => {
  const { run } = makeFixture({ roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"] });
  const plain = run();
  const jsonOnly = run(["--json-only"]);
  assert.equal(plain.status, 0, plain.stderr);
  assert.equal(jsonOnly.stdout, plain.stdout);
});

test("P1: an unknown flag is the fatal class — exit non-zero + stderr usage (A:20)", () => {
  const { run } = makeFixture();
  const result = run(["--not-a-real-flag"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /[Uu]sage/);
});

test("P1: stdout alone is one valid JSON document (A:23, stream separation)", () => {
  const { run } = makeFixture({ roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"] });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.ok(parseEnvelope(result.stdout));
});

test("P1: importing the module with the built runtime present exits 0 (A:11 case a)", () => {
  const result = spawnSync(process.execPath, ["-e", `import(${JSON.stringify(pathToFileURL(SCRIPT).href)})`], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
});

test("P1: importing with dist/ absent fails with the named precondition (A:11 case b)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-status-nodist-"));
  fs.mkdirSync(path.join(tmp, "scripts"), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(tmp, "scripts", "workflow-status.mjs"));
  fs.copyFileSync(path.join(repoRoot, "scripts", "schema-runtime.mjs"), path.join(tmp, "scripts", "schema-runtime.mjs"));
  const result = spawnSync(process.execPath, ["-e", `import(${JSON.stringify(pathToFileURL(path.join(tmp, "scripts", "workflow-status.mjs")).href)})`], {
    cwd: tmp,
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stderr}`, /schema runtime is not built/);
  assert.doesNotMatch(`${result.stderr}`, /ERR_MODULE_NOT_FOUND/);
});

test("P1: a failing validateEnvelope is a diagnostic, never a gate — envelope printed, exit 0 (E-38-1)", () => {
  const { dir } = makeFixture();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-status-stub-"));
  fs.mkdirSync(path.join(tmp, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "packages", "agentic-workflow-schema", "dist"), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(tmp, "scripts", "workflow-status.mjs"));
  fs.copyFileSync(path.join(repoRoot, "scripts", "schema-runtime.mjs"), path.join(tmp, "scripts", "schema-runtime.mjs"));
  fs.writeFileSync(
    path.join(tmp, "packages", "agentic-workflow-schema", "dist", "index.js"),
    "export function validateEnvelope() { return { ok: false, errors: ['forced mismatch'] }; }\n",
  );
  fs.writeFileSync(
    path.join(tmp, "packages", "agentic-workflow-schema", "package.json"),
    JSON.stringify({ name: "@gtrabanco/agentic-workflow-schema", version: "0.0.0-stub" }),
  );
  const result = spawnSync(process.execPath, [path.join(tmp, "scripts", "workflow-status.mjs")], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, PATH: `${path.join(dir, "bin")}:${process.env.PATH}` },
    timeout: 60_000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /mismatch|validate/i, "a stderr diagnostic is expected");
  const envelope = parseEnvelope(result.stdout);
  assert.ok(envelope.next && envelope.detail, "the envelope is still printed");
});

test("P1: the existing roadmap rows keep their order in the projections", () => {
  const { run } = makeFixture({
    roadmapRows: [
      "| 90 | `alpha` | planned | — | a unit |",
      "| 91 | `beta` | idea | — | another |",
    ],
  });
  const envelope = parseEnvelope(run().stdout);
  const ids = envelope.detail.features.map((f) => f.id);
  assert.deepEqual(ids, ["90-alpha", "91-beta"]);
});
