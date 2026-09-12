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
import { execFileSync, spawn, spawnSync } from "node:child_process";
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
function makeFixture({ roadmapRows = [], issues = [], openPrs = [], mergedPrs = [], nrs = FROZEN_NRS, extraFiles = {}, ghMode = "ok", branch = "main", dirty = null, pathWithoutGit = false } = {}) {
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

  const shimBody = ghMode === "fail-fast"
    ? `process.stderr.write("network unreachable\\n"); process.exit(1);`
    : ghMode === "auth"
      ? `process.stderr.write("gh: authentication required\\n"); process.exit(1);`
      : ghMode === "hang"
        ? `setInterval(() => {}, 1000);`
        : `const args = process.argv.slice(2).join(" ");
const out = (value) => { process.stdout.write(JSON.stringify(value)); process.exit(0); };
if (args.includes("pr list") && args.includes("--state open")) out(${JSON.stringify(openPrs)});
if (args.includes("pr list") && args.includes("--state merged")) out(${JSON.stringify(mergedPrs)});
if (args.includes("issue list")) out(${JSON.stringify(issues)});
process.stderr.write("unexpected gh call: " + args + "\\n");
process.exit(1);`;

  if (ghMode !== "absent") {
    fs.writeFileSync(path.join(binDir, "gh"), `#!/usr/bin/env node\n${shimBody}\n`, { mode: 0o755 });
  }

  execFileSync("git", ["init", "-q", "-b", branch], { cwd: dir });
  execFileSync("git", ["config", "user.email", "fixture@example.com"], { cwd: dir });
  execFileSync("git", ["config", "user.name", "Fixture"], { cwd: dir });
  execFileSync("git", ["add", "-A"], { cwd: dir });
  execFileSync("git", ["commit", "-q", "-m", "fixture"], { cwd: dir });
  if (dirty) write(dirty, "uncommitted work\n");

  const pathBase = pathWithoutGit ? path.dirname(process.execPath) : process.env.PATH;
  const run = (args = [], opts = {}) => spawnSync(process.execPath, [opts.script ?? SCRIPT, ...args], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, PATH: `${binDir}:${pathBase}`, ...opts.env },
    timeout: opts.timeout ?? 60_000,
  });

  return { dir, binDir, run, write };
}

const parseEnvelope = (stdout) => JSON.parse(stdout);

/**
 * A `git` shim on an isolated PATH entry that records every invocation's argv
 * before delegating to the real binary. It lives OUTSIDE the sensed repository
 * (and logs outside it), so probing the read path never dirties the fixture's
 * tree. The read path's spawn budget is a behavior, so it is measured rather
 * than inferred from source text (F32–F34).
 */
function installGitProbe() {
  const probeDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-status-gitprobe-"));
  const log = path.join(probeDir, "git-probe.log");
  const realGit = execFileSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).trim();
  fs.writeFileSync(path.join(probeDir, "git"), `#!/bin/sh\nprintf '%s\\n' "$*" >> "${log}"\nexec "${realGit}" "$@"\n`, { mode: 0o755 });
  return { log, binDir: probeDir };
}

const probeEnv = (fixture, probe) => ({ PATH: `${probe.binDir}:${fixture.binDir}:${process.env.PATH}` });

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
  // The sensor's real import graph: the contract module it shares with the
  // verifier. Copying it keeps the sandbox a faithful mirror — the assertions
  // (named precondition, never a module-not-found) are unchanged.
  fs.copyFileSync(path.join(repoRoot, "scripts", "pre-execution-contract.mjs"), path.join(tmp, "scripts", "pre-execution-contract.mjs"));
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
  // The sensor's real import graph: the contract module it shares with the
  // verifier. Copying it keeps the sandbox a faithful mirror — the assertions
  // (named precondition, never a module-not-found) are unchanged.
  fs.copyFileSync(path.join(repoRoot, "scripts", "pre-execution-contract.mjs"), path.join(tmp, "scripts", "pre-execution-contract.mjs"));
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

// ===========================================================================
// P2 — Sensor script failure contract
// ===========================================================================

const codesOf = (envelope) => (envelope.detail.degradations ?? []).map((entry) => entry.code);

function requireDegradations(envelope) {
  assert.ok(Array.isArray(envelope.detail.degradations), "detail.degradations must be present");
  return codesOf(envelope);
}

test("P2: a fail-fast forge degrades to unavailable-forge-no-network with exit 0 (A:4/A:15)", () => {
  const { run } = makeFixture({ ghMode: "fail-fast", roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"] });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  assert.ok(requireDegradations(envelope).includes("unavailable-forge-no-network"));
  const validation = validateEnvelope(envelope);
  assert.equal(validation.ok, true, validation.errors?.join("; "));
});

test("P2: a forge that never answers times out and degrades (A:21)", () => {
  const { run } = makeFixture({ ghMode: "hang" });
  const started = Date.now();
  const result = run();
  const elapsed = Date.now() - started;
  assert.equal(result.status, 0, result.stderr);
  assert.ok(elapsed < 45_000, `the sensor must not hang (took ${elapsed}ms)`);
  const envelope = parseEnvelope(result.stdout);
  assert.ok(requireDegradations(envelope).includes("unavailable-forge-timeout"));
});

test("P2: an auth-failing forge degrades to unavailable-forge-auth (F37)", () => {
  const { run } = makeFixture({ ghMode: "auth" });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.ok(requireDegradations(parseEnvelope(result.stdout)).includes("unavailable-forge-auth"));
});

test("P2: a missing gh binary degrades to unavailable-forge-missing-cli (F37)", () => {
  const { run } = makeFixture({ ghMode: "absent", pathWithoutGit: true });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.ok(requireDegradations(parseEnvelope(result.stdout)).includes("unavailable-forge-missing-cli"));
});

test("P2: a missing git binary degrades to unavailable-git-missing with exit 0 (F37)", () => {
  const { run } = makeFixture({ pathWithoutGit: true });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  assert.ok(requireDegradations(envelope).includes("unavailable-git-missing"));
  assert.equal(validateEnvelope(envelope).ok, true);
});

test("P2: a stale hint that repeats a pre-advance recommendation is named, state untouched (A:18)", () => {
  const roadmapRows = ["| 90 | `alpha` | defined | — | a unit |"];
  const hint = JSON.stringify({ state: "OK", next: { recommended: "/plan-feature 90-alpha", alternatives: [], tier: "strong" } });
  const plain = makeFixture({ roadmapRows });
  const hinted = makeFixture({ roadmapRows });
  const before = parseEnvelope(plain.run().stdout);
  const after = parseEnvelope(hinted.run(["--last-envelope", hint]).stdout);
  const observations = after.detail.workflow_observations.join("\n");
  assert.match(observations, /still 'defined'/);
  assert.match(observations, /suspected dropped/);
  assert.equal(after.state, before.state);
  assert.deepEqual(after.next, before.next);
});

test("P2: a missing hint path degrades fail-open (A:19)", () => {
  const { run } = makeFixture();
  const result = run(["--last-envelope", "/no/such/hint-envelope.json"]);
  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  assert.ok(requireDegradations(envelope).includes("unavailable-hint-missing-path") || envelope.detail.workflow_observations.join("\n").includes("unavailable-hint-missing-path"));
  assert.equal(validateEnvelope(envelope).ok, true);
});

test("P2: an invalid JSON hint degrades fail-open (A:19)", () => {
  const { run } = makeFixture();
  const result = run(["--last-envelope", "{not valid json"]);
  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  assert.ok(requireDegradations(envelope).includes("unavailable-hint-invalid-json") || envelope.detail.workflow_observations.join("\n").includes("unavailable-hint-invalid-json"));
  assert.equal(validateEnvelope(envelope).ok, true);
});

test("P2: a clean state classifies as CLEAN and the envelope state is OK", () => {
  const { run } = makeFixture();
  const envelope = parseEnvelope(run().stdout);
  assert.equal(envelope.detail.crash_recovery.verdict, "CLEAN");
  assert.equal(envelope.state, "OK");
});

test("P2: a dirty unit branch with a coherent ledger classifies as RESUMABLE → CONTINUE", () => {
  const { run } = makeFixture({
    branch: "feat/90-alpha",
    dirty: "src/work.txt",
    roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"],
    extraFiles: {
      "docs/features/90-alpha/progress.md": "## P1 — 2026-09-11\n- Done: partial\n",
      "docs/features/90-alpha/TASKS.md": "## P1 — Core\n\nLayer: config/infra · Done-when: x\n\n- [ ] one task\n",
    },
  });
  const envelope = parseEnvelope(run().stdout);
  assert.equal(envelope.detail.crash_recovery.verdict, "RESUMABLE");
  assert.equal(envelope.state, "CONTINUE");
  assert.match(envelope.next.recommended, /execute-phase 90/);
});

test("P2: a dirty unit branch with no coherent ledger classifies as AMBIGUOUS → NEEDS_INPUT", () => {
  const { run } = makeFixture({ branch: "feat/91-beta", dirty: "src/work.txt", roadmapRows: ["| 91 | `beta` | planned | — | a unit |"] });
  const envelope = parseEnvelope(run().stdout);
  assert.equal(envelope.detail.crash_recovery.verdict, "AMBIGUOUS");
  assert.equal(envelope.state, "NEEDS_INPUT");
  assert.ok(envelope.needs_input && typeof envelope.needs_input.question === "string");
});

test("P2: an empty project emits the empty shapes and exits 0 (sensor:empty-state)", () => {
  const { run } = makeFixture();
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  assert.deepEqual(envelope.detail.design_candidates, []);
  assert.deepEqual(envelope.findings.fix_now, []);
});

test("P2: the untriaged backlog is capped at 5 oldest and the merged list at 20 (sensor:limit-threshold)", () => {
  const issues = Array.from({ length: 9 }, (_, i) => ({ number: i + 1, title: `issue ${i + 1}`, labels: [] }));
  const { run } = makeFixture({ issues });
  const envelope = parseEnvelope(run().stdout);
  assert.equal(envelope.detail.untriaged_issues.count, 9);
  assert.deepEqual(envelope.detail.untriaged_issues.oldest_open, [1, 2, 3, 4, 5]);
  assert.match(read("scripts/workflow-status.mjs"), /--limit", "20"/);
});

test("P2: two concurrent runs are safe and byte-identical (sensor:concurrent-action, F31)", async () => {
  // Both processes must be genuinely in flight together: the previous pin wrapped
  // two synchronous `spawnSync` calls in promise executors, so it ran them in
  // sequence and never exercised the property it claimed (F31).
  const { dir, binDir } = makeFixture({ roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"] });
  const spawnOnce = () => new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT], {
      cwd: dir,
      env: { ...process.env, PATH: `${binDir}:${process.env.PATH}` },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
  const [a, b] = await Promise.all([spawnOnce(), spawnOnce()]);
  assert.equal(a.status, 0, a.stderr);
  assert.equal(b.status, 0, b.stderr);
  assert.equal(a.stdout, b.stdout);
});

// ===========================================================================
// Fold review findings — the substrate shapes the fixtures above did not pin
// ===========================================================================

const TABLE_NRS = [
  "# Normalized Repository State",
  "",
  "## Snapshot",
  "",
  "| Field | Value |",
  "|---|---|",
  "| Snapshot ID | `2026-01-01-fixture` |",
  "| Source revision | `abc123` (`main`) |",
  "| Status | `frozen` |",
].join("\n");

test("F1: the table-form repository-state ledger reads as frozen, not draft", () => {
  // The shipped ledger — this repository's and the template's — states its fields as
  // a markdown table. Reading only `Status:` colon lines parsed it as `draft`, which
  // blocked every run on the substrate the sensor was shipped with.
  const { run } = makeFixture({ nrs: TABLE_NRS, roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"] });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  assert.equal(envelope.detail.repository_state.status, "frozen");
  assert.equal(envelope.detail.repository_state.snapshot_id, "2026-01-01-fixture");
  assert.equal(envelope.detail.repository_state.source_revision, "abc123", "the backticks and the `(main)` note are stripped");
  assert.equal(envelope.state, "OK", "a frozen ledger is not a substrate blocker");
  assert.ok(!envelope.blockers.some((b) => b.id === "repository-state"), "no run-scoped NRS blocker on a frozen ledger");
});

test("F7/F8: a mixed-vocabulary fold ledger is normalized, and an unusable row is named", () => {
  // The emitted envelope must satisfy its own schema on the ledgers this repository
  // actually has: finder-scale severities (`critical`/`major`) are mapped to the
  // published enum, `\|`-escaped cells keep their columns, a dash separator never
  // projects a finding, and a row the enum cannot carry is dropped by name.
  const ledger = [
    "| id | file:line | axis | severity | class | route | folded |",
    "|-----|-----|-----|-----|-----|-----|-----|",
    "| F1 | scripts/a.mjs:1 — a cell with an escaped \\| pipe | code | critical | fix-now | fold into phase | no |",
    "| F2 | scripts/b.mjs:2 | code | prose | fix-now | fold into phase | no |",
    "| F3 | scripts/c.mjs:3 | security | major | fix-now | fold into phase | yes |",
  ].join("\n");
  const { run } = makeFixture({
    roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"],
    extraFiles: { "docs/features/90-alpha/review-findings.md": `${ledger}\n` },
  });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  const items = envelope.findings.fix_now;
  assert.deepEqual(items.map((item) => item.id), ["F1"], `only the carryable unfolded row projects: ${JSON.stringify(items)}`);
  assert.equal(items[0].severity, "high", "finder-scale `critical` maps to the schema's `high`");
  assert.equal(items[0].suggested_tier, "strong");
  assert.match(items[0].file, /escaped \| pipe/, "an escaped pipe stays inside its cell");
  assert.ok(!items.some((item) => /^[-:]*$/.test(item.id)), "a separator row never projects a finding");
  assert.match(
    envelope.detail.workflow_observations.join("\n"),
    /dropped review-findings row 'F2'.*prose.*outside high\|med\|low/,
    "a dropped row is named, never silent",
  );
  assert.equal(validateEnvelope(envelope).ok, true, `schema errors: ${validateEnvelope(envelope).errors?.join("; ")}`);
});

test("F2: a done unit's merge state comes from the PR, never from the 20-row window", () => {
  const roadmapRows = [
    "| 90 | `alpha` | done · [#901](https://example.invalid/pr/901) | — | long shipped |",
    "| 92 | `gamma` | done · [#902](https://example.invalid/pr/902) | — | closed unmerged |",
    "| 91 | `beta` | planned | 90 | depends on alpha |",
    "| 93 | `delta` | planned | 92 | depends on gamma |",
  ];
  const fixture = makeFixture({ roadmapRows });
  // `makeFixture`'s shim answers the recent-merge window only. A PR outside it is
  // resolved from its own state on a second, lazy read — the read the fix added.
  fixture.write("bin/gh", `#!/usr/bin/env node
const args = process.argv.slice(2).join(" ");
const out = (value) => { process.stdout.write(JSON.stringify(value)); process.exit(0); };
if (args.includes("pr list") && args.includes("--state open")) out([]);
if (args.includes("pr list") && args.includes("--state merged")) out([]);
if (args.includes("pr list") && args.includes("--state all")) out([{ number: 901, state: "MERGED" }, { number: 902, state: "CLOSED" }]);
if (args.includes("issue list")) out([]);
process.stderr.write("unexpected gh call: " + args + "\\n");
process.exit(1);
`);
  fs.chmodSync(path.join(fixture.dir, "bin", "gh"), 0o755);

  const result = fixture.run();
  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  assert.ok(!envelope.dependencies.unmet.includes("90-alpha"), `a merged PR outside the window is met: ${JSON.stringify(envelope.dependencies.unmet)}`);
  assert.ok(!envelope.detail.blocked_units["91-beta"], "a dependent of a merged unit is not blocked");
  assert.ok(!JSON.stringify(envelope.blockers).includes("dependencies are unmerged"), "no spurious done-but-unmerged substrate blocker");
  assert.ok(envelope.dependencies.unmet.includes("92-gamma"), "a CLOSED-unmerged PR is still unmet");
  assert.ok(envelope.detail.blocked_units["93-delta"], "a dependent of a closed-unmerged unit stays blocked");
});

test("F5: a done unit with a still-open PR is sensed (step 6a)", () => {
  const { run } = makeFixture({
    roadmapRows: ["| 90 | `alpha` | done · [#901](https://example.invalid/pr/901) | — | PR open |"],
    openPrs: [{ number: 901, title: "alpha", headRefName: "feat/90-alpha", url: "https://example.invalid/pr/901", statusCheckRollup: [] }],
  });
  const envelope = parseEnvelope(run().stdout);
  assert.ok(
    envelope.detail.pre_execution.some((row) => row.unit === "90-alpha"),
    `a done-but-unmerged unit is never merge-ready and must be sensed: ${JSON.stringify(envelope.detail.pre_execution)}`,
  );
  assert.ok(
    envelope.blockers.some((blocker) => blocker.kind === "gate" && blocker.id === "90-alpha"),
    "a missing receipt on that unit is a gate blocker",
  );
  assert.ok(!envelope.dependencies.unmet.includes("90-alpha"), "an open PR never counts as merged");
});

// ===========================================================================
// F19 — the forge dimension spends one shared wall-clock budget
// ===========================================================================

test("F19: a slow-but-alive forge costs one shared bound, never one bound per read", () => {
  const fixture = makeFixture({
    roadmapRows: ["| 90 | `alpha` | done · [#901](https://example.invalid/pr/901) | — | long shipped |"],
  });
  // The open-PR read answers; every other forge read hangs. Without a shared
  // budget each read pays its own 10s bound (merged → issues → all-states ≈ 30s)
  // and the urgency read still runs; with it the first hang spends the dimension.
  fixture.write("bin/gh", `#!/usr/bin/env node
const args = process.argv.slice(2).join(" ");
if (args.includes("pr list") && args.includes("--state open")) { process.stdout.write("[]"); process.exit(0); }
if (args.includes("issue list")) {
  process.stdout.write(JSON.stringify([{ number: 7, title: "urgent thing", labels: [{ name: "urgent" }] }]));
  process.exit(0);
}
setInterval(() => {}, 1000);
`);
  fs.chmodSync(path.join(fixture.dir, "bin", "gh"), 0o755);

  const started = Date.now();
  const result = fixture.run();
  const elapsed = Date.now() - started;

  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  assert.ok(
    envelope.detail.degradations.some((row) => row.code === "unavailable-forge-timeout"),
    `a hanging forge names the declared timeout code: ${JSON.stringify(envelope.detail.degradations)}`,
  );
  assert.deepEqual(
    envelope.detail.urgent.issues, [],
    "the reads left after the budget is spent never spawn — the urgency read must not have answered",
  );
  assert.ok(elapsed < 20_000, `one shared bound, not one per read (elapsed ${elapsed}ms)`);
});

// ===========================================================================
// F21 — a symlinked ancestor directory never widens the sensed root
// ===========================================================================

test("F21: an out-of-repo receipt behind a directory symlink never enters the envelope", () => {
  const fixture = makeFixture({ roadmapRows: ["| 90 | `alpha` | planned | — | symlinked ancestor |"] });
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-status-outside-"));
  fs.writeFileSync(path.join(outside, "progress.md"), [
    "## Pre-execution review receipt v1 — plan",
    "- Review: rp-forged · Snapshot: deadbeef · Verdict: plan-review-pass",
    "",
  ].join("\n"));
  // `docs/features/90-alpha` is a directory symlink pointing outside the sensed
  // repository: the leaf (`progress.md`) is a regular file, so only the resolved
  // containment check can refuse it.
  const unitDir = path.join(fixture.dir, "docs", "features", "90-alpha");
  fs.rmSync(unitDir, { recursive: true, force: true });
  fs.symlinkSync(outside, unitDir, "dir");

  try {
    const result = fixture.run();
    assert.equal(result.status, 0, result.stderr);
    const envelope = parseEnvelope(result.stdout);
    const row = envelope.detail.pre_execution.find((entry) => entry.unit === "90-alpha");
    assert.ok(!row || row.verdict === null, `out-of-repo receipt bytes must never enter the envelope: ${JSON.stringify(row)}`);
    assert.ok(!JSON.stringify(envelope).includes("rp-forged"), "no out-of-repo receipt id may appear anywhere in the envelope");
  } finally {
    fs.rmSync(unitDir, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

// ===========================================================================
// F23 — the reported PR state is the forge's answer
// ===========================================================================

test("F23: a merged PR is never reported open, and an open PR is never reported merged", () => {
  const mergedRun = makeFixture({
    branch: "feat/90-alpha",
    roadmapRows: ["| 90 | `alpha` | done · [#901](https://example.invalid/pr/901) | — | shipped long ago |"],
    mergedPrs: [{ number: 901, headRefName: "feat/90-alpha" }],
  }).run();
  assert.equal(mergedRun.status, 0, mergedRun.stderr);
  const merged = parseEnvelope(mergedRun.stdout);
  assert.equal(merged.pr.state, "merged", `a merged PR is not open: ${JSON.stringify(merged.pr)}`);

  const openRun = makeFixture({
    branch: "feat/90-alpha",
    roadmapRows: ["| 90 | `alpha` | done · [#901](https://example.invalid/pr/901) | — | at the merge gate |"],
    openPrs: [{ number: 901, title: "alpha", headRefName: "feat/90-alpha", url: "https://example.invalid/pr/901", statusCheckRollup: [] }],
  }).run();
  assert.equal(openRun.status, 0, openRun.stderr);
  assert.equal(parseEnvelope(openRun.stdout).pr.state, "open");

  const noneRun = makeFixture({
    branch: "feat/90-alpha",
    roadmapRows: ["| 90 | `alpha` | planned | — | no PR yet |"],
  }).run();
  assert.equal(parseEnvelope(noneRun.stdout).pr.state, "none");
});

// ===========================================================================
// F24/F25 — the contract's shape has one owner
// ===========================================================================

test("F24/F25: the sensor imports the contract's tables and parser, never re-declares them", () => {
  const source = fs.readFileSync(SCRIPT, "utf8");
  assert.match(
    source,
    /import \{ STAGE_ARTIFACTS, CONTEXT_SOURCES, parseReceipts \} from "\.\/pre-execution-contract\.mjs"/,
    "the sensor reads the shared contract module",
  );
  assert.doesNotMatch(source, /REVIEW_STAGE_ARTIFACTS = \{\s*\n\s*spec: \[/, "no hand-mirrored stage artifact table (F24)");
  assert.doesNotMatch(source, /const RECEIPT_SPLIT/, "no second parser of the receipt grammar (F25)");
  assert.doesNotMatch(source, /const field = \(chunk, label\)/, "no second receipt field extractor (F25)");
});

test("F24/F25: the sensor's bound set is exactly the verifier's stage tables", () => {
  // The bound set is derived from the shared module at import time, so a table that
  // grows in the contract must grow in the sensor's currency check in the same edit.
  const sensorSource = fs.readFileSync(SCRIPT, "utf8");
  assert.match(sensorSource, /Object\.entries\(STAGE_ARTIFACTS\)\.map/, "the artifact table is read, not copied");
  assert.match(sensorSource, /CONTEXT_SOURCES\.map\(\(source\) => source\.file\)/, "the context sources are read, not copied");
});

// ===========================================================================
// P5 — sensor read-path fold batch (F20, F27–F35)
// ===========================================================================

test("F32: one `git status` scan feeds the dirty set and the ahead count", () => {
  const fixture = makeFixture({ roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"] });
  const probe = installGitProbe();
  const result = fixture.run([], { env: probeEnv(fixture, probe) });
  assert.equal(result.status, 0, result.stderr);
  const calls = fs.readFileSync(probe.log, "utf8").split("\n").filter(Boolean);
  const statusCalls = calls.filter((call) => call.startsWith("status "));
  assert.equal(statusCalls.length, 1, `exactly one git status scan: ${JSON.stringify(statusCalls)}`);
  assert.match(statusCalls[0], /--porcelain=v1/, "the single scan carries the branch header");
  assert.equal(parseEnvelope(result.stdout).detail.crash_recovery.verdict, "CLEAN");
});

test("F33: unit-branch upstream state comes from one batched spawn", () => {
  const fixture = makeFixture({
    roadmapRows: [
      "| 90 | `alpha` | planned | — | a unit |",
      "| 91 | `beta` | planned | — | a unit |",
      "| 92 | `gamma` | planned | — | a unit |",
    ],
  });
  for (const branch of ["feat/90-alpha", "feat/91-beta", "feat/92-gamma"]) {
    execFileSync("git", ["branch", branch], { cwd: fixture.dir });
  }
  const log = installGitProbe();
  const result = fixture.run([], { env: probeEnv(fixture, log) });
  assert.equal(result.status, 0, result.stderr);
  const calls = fs.readFileSync(log.log, "utf8").split("\n").filter(Boolean);
  assert.equal(calls.filter((call) => call.startsWith("for-each-ref ")).length, 1, "one batched upstream read");
  assert.equal(calls.filter((call) => call.startsWith("rev-list --count")).length, 0, "no per-branch rev-list spawn");
  assert.equal(calls.filter((call) => call.startsWith("rev-parse --abbrev-ref")).length, 0, "no per-branch rev-parse spawn");
});

test("F34: closed units pay zero review-mark spawns (OPEN_STATES gate)", () => {
  const ledger = [
    "| id | file:line | axis | severity | class | route | folded |",
    "|-----|-----|-----|-----|-----|-----|-----|",
    "| F1 | scripts/a.mjs:1 | code | high | fix-now | fold into phase | no |",
    `| REVIEW-RAN | HEAD ${"0".repeat(40)} · 2026-01-01 · review-change · axes: code · verdict: REVIEW-FAIL · cycle: 1 |`,
  ].join("\n");
  const fixture = makeFixture({
    roadmapRows: ["| 90 | `alpha` | done · [#901](https://example.invalid/pr/901) | — | shipped |"],
    mergedPrs: [{ number: 901, headRefName: "feat/90-alpha" }],
    extraFiles: { "docs/features/90-alpha/review-findings.md": `${ledger}\n` },
  });
  const log = installGitProbe();
  const result = fixture.run([], { env: probeEnv(fixture, log) });
  assert.equal(result.status, 0, result.stderr);
  const calls = fs.readFileSync(log.log, "utf8").split("\n").filter(Boolean);
  assert.equal(calls.filter((call) => call.startsWith("merge-base --is-ancestor")).length, 0, "a closed unit pays no ancestor spawn");
  assert.equal(calls.filter((call) => call.startsWith("log ")).length, 0, "a closed unit pays no bound-input log spawn");
});

test("F28: a zero-PR forge answer is a successful read, not a failure", () => {
  const fixture = makeFixture({
    roadmapRows: ["| 90 | `alpha` | done · [#901](https://example.invalid/pr/901) | — | long shipped |"],
  });
  fixture.write("bin/gh", `#!/usr/bin/env node
const args = process.argv.slice(2).join(" ");
const out = (value) => { process.stdout.write(JSON.stringify(value)); process.exit(0); };
if (args.includes("pr list")) out([]);
if (args.includes("issue list")) out([]);
process.exit(0);
`);
  fs.chmodSync(path.join(fixture.dir, "bin", "gh"), 0o755);
  const result = fixture.run();
  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  assert.ok(
    !(envelope.detail.degradations ?? []).some((row) => row.source === "forge"),
    `an empty-but-valid answer is not a forge failure: ${JSON.stringify(envelope.detail.degradations)}`,
  );
  assert.ok(!envelope.detail.workflow_observations.join("\n").includes("merge state unverified"), "no false unverified-merge observation");
});

test("F29: unparseable forge stdout names a parse cause, never no-network", () => {
  const fixture = makeFixture({ roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"] });
  fixture.write("bin/gh", "#!/usr/bin/env node\nprocess.stdout.write(\"not-json\");\nprocess.exit(0);\n");
  fs.chmodSync(path.join(fixture.dir, "bin", "gh"), 0o755);
  const result = fixture.run();
  assert.equal(result.status, 0, result.stderr);
  const codes = (parseEnvelope(result.stdout).detail.degradations ?? []).map((row) => row.code);
  assert.ok(codes.includes("unavailable-forge-malformed-answer"), `a parse failure names its own cause: ${JSON.stringify(codes)}`);
  assert.ok(!codes.includes("unavailable-forge-no-network"), "the real cause is never misattributed");
});

test("F30: a non-array forge answer degrades per the contract, never exits 1", () => {
  const fixture = makeFixture({ roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"] });
  fixture.write("bin/gh", "#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify({ oops: true }));\nprocess.exit(0);\n");
  fs.chmodSync(path.join(fixture.dir, "bin", "gh"), 0o755);
  const result = fixture.run();
  assert.equal(result.status, 0, `a malformed answer degrades, never crashes: ${result.stderr}`);
  const envelope = parseEnvelope(result.stdout);
  assert.ok((envelope.detail.degradations ?? []).some((row) => row.code === "unavailable-forge-malformed-answer"));
  assert.equal(validateEnvelope(envelope).ok, true, `schema errors: ${validateEnvelope(envelope).errors?.join("; ")}`);
});

test("F35: forge list reads carry --limit so the default page cannot truncate counts", () => {
  const source = read("scripts/workflow-status.mjs");
  const openPrLine = source.split("\n").find((line) => line.includes('"pr", "list", "--state", "open"'));
  const openIssueLine = source.split("\n").find((line) => line.includes('"issue", "list", "--state", "open"'));
  assert.match(openPrLine, /"--limit"/, "the open-PR read bounds its own page");
  assert.match(openIssueLine, /"--limit"/, "the open-issue read bounds its own page");
  const issues = Array.from({ length: 40 }, (_, i) => ({ number: i + 1, title: `issue ${i + 1}`, labels: [] }));
  assert.equal(parseEnvelope(makeFixture({ issues }).run().stdout).detail.untriaged_issues.count, 40, "a page larger than gh's default 30 counts whole");
});

test("F27: dependencies.build_order and blocked_units[].build_order are one derivation", () => {
  const envelope = parseEnvelope(makeFixture({
    roadmapRows: [
      "| 90 | `shipped` | done · [#901](https://example.invalid/pr/901) | — | merged |",
      "| 91 | `missing` | idea | — | unstarted |",
      "| 92 | `blocked` | planned | 90 91 | waits on both |",
    ],
    mergedPrs: [{ number: 901, headRefName: "feat/90-shipped" }],
  }).run().stdout);
  const blocked = envelope.detail.blocked_units["92-blocked"];
  assert.ok(blocked, `92 is blocked: ${JSON.stringify(envelope.detail.blocked_units)}`);
  assert.deepEqual(blocked.build_order, envelope.dependencies.build_order, "both projections emit the same chain");
  assert.deepEqual(blocked.build_order, ["90-shipped", "91-missing", "92-blocked"], "the chain closes on the blocked unit");
});

test("F20: pre-execution verifier spawns are capped and degrade, never hang", () => {
  const cap = Number(/PRE_EXECUTION_MAX_SENSES = (\d+)/.exec(read("scripts/workflow-status.mjs"))?.[1]);
  assert.ok(Number.isInteger(cap) && cap > 0, "the cap is a suite-pinned positive constant");
  const roadmapRows = [];
  const extraFiles = {};
  for (let i = 0; i < cap + 2; i += 1) {
    const nn = 200 + i;
    roadmapRows.push(`| ${nn} | \`unit-${nn}\` | planned | — | cap probe |`);
    extraFiles[`docs/features/${nn}-unit-${nn}/progress.md`] =
      "## Pre-execution review receipt v1 — plan\n- Review: rp-cap · Snapshot: deadbeef · Verdict: plan-review-pass\n\n";
  }
  const result = makeFixture({ roadmapRows, extraFiles }).run();
  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  const capped = envelope.detail.pre_execution.filter((row) => /cap/i.test(row.reason ?? ""));
  assert.ok(capped.length > 0, `the over-cap rows degrade by name: ${JSON.stringify(envelope.detail.pre_execution.map((row) => row.reason))}`);
});
