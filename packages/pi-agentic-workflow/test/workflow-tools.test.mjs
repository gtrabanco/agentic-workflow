// workflow-tools.test.mjs — issue #274: the pi package's deferred tool surface.
//
// The five envelope-emitting deterministic scripts register as deferred pi tools
// whose output schema is the machine contract the repo already publishes. The
// specs are Pi-free (`src/extension/workflow-tools.ts`): execute takes
// `(params, cwd)` and returns `{ structuredContent, text, isError? }`; the
// adapter (`index.ts`) hands them to `pi.registerTool`. Spawns are injectable,
// and the two dependency-free gate scripts are exercised live against fixture
// trees under os.tmpdir() (never against the live repository).

import { after, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const PKG_ROOT = path.resolve(import.meta.dirname, "..");
const REPO_ROOT = path.resolve(PKG_ROOT, "..", "..");

/** Every scratch dir this file creates, removed when the file finishes. */
const SCRATCH = [];
function scratchDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  SCRATCH.push(dir);
  return dir;
}
after(() => {
  for (const dir of SCRATCH) fs.rmSync(dir, { recursive: true, force: true });
});

function sandboxGitEnv(env = process.env) {
  const clean = { ...env };
  for (const name of [
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_INDEX_FILE",
    "GIT_OBJECT_DIRECTORY",
    "GIT_ALTERNATE_OBJECT_DIRECTORIES",
    "GIT_COMMON_DIR",
    "GIT_NAMESPACE",
    "GIT_CEILING_DIRECTORIES",
  ]) {
    delete clean[name];
  }
  return clean;
}

/** A valid Envelope v2 fixture (same shape the sensor suite's makeValidEnv builds). */
function makeValidEnv(overrides = {}) {
  return {
    skill: "workflow-status",
    state: "OK",
    summary: "ready",
    unit: { type: "feature", id: "62", issue: 233, branch: "feat/62" },
    phase: { current: "P1", total: 4, completed: 0 },
    pr: { number: null, url: null, state: "none", head_sha: "abc123def456", merge_ready: null, ci: "green" },
    gates: { verification: "green", review_pending: false, audit_pending: false },
    findings: { fix_now: [], issues_filed: [], untriaged: 0, decisions_recorded: 0 },
    blockers: [],
    dependencies: { unmet: [], build_order: [] },
    recommendations: { product_audit: false, reason: null },
    needs_input: null,
    next: { recommended: "/discover-repository-state", alternatives: [], tier: "strong" },
    detail: { repository_state: { status: "frozen", source_revision: "abc123" }, ...overrides.detail },
    ...overrides,
  };
}

/** A fake node script file (the sensor suite's seam); kept for parity with
 * `conductor-sensor.test.mjs`, currently used only where a file path is the
 * simplest double. */
function writeFakeScript(content) {
  const tmp = path.join(scratchDir("paw-tool-fake-"), "fake.js");
  fs.writeFileSync(tmp, "#!/usr/bin/env node\n" + content + "\n", { mode: 0o755 });
  return tmp;
}
void writeFakeScript;

async function loadModule() {
  return import("../dist/extension/workflow-tools.js");
}

const TOOL_NAMES = [
  "agentic_workflow_status",
  "agentic_workflow_diff_guard",
  "agentic_workflow_phase_lint",
  "agentic_workflow_audit_pr_gate",
  "agentic_workflow_snapshot_verify",
  // Issue #719 S2: the doc index as a first-class tool.
  "doc_search",
  // Issue #555's generic door: the subcommands the skills cite symbolically
  // and no typed tool wraps.
  "agentic_workflow_run",
];

// ---------------------------------------------------------------------------
// Registration shape (AC2, O3)
// ---------------------------------------------------------------------------

test("registration: seven deferred tools in the agentic-workflow namespace, readOnly", async () => {
  const { createWorkflowTools, WORKFLOW_TOOLS_NAMESPACE } = await loadModule();
  const tools = createWorkflowTools();
  assert.deepEqual(
    tools.map((tool) => tool.name).sort(),
    [...TOOL_NAMES].sort(),
  );
  assert.equal(WORKFLOW_TOOLS_NAMESPACE.name, "agentic-workflow");
  for (const tool of tools) {
    assert.equal(tool.exposure, "deferred", `${tool.name} must declare deferred exposure`);
    assert.equal(tool.annotations?.readOnlyHint, true, `${tool.name} is read-only`);
    assert.equal(typeof tool.description, "string");
    assert.ok(tool.description.length > 0);
    assert.equal(tool.parameters?.type, "object");
    assert.ok(
      tool.outputSchema && (tool.outputSchema.type === "object" || Array.isArray(tool.outputSchema.oneOf)),
      `${tool.name} declares an output schema`,
    );
  }
});

// Issue #603 S4: a session that never loads the usage skill still learns which
// family solves which problem, because the index rides the deferred runner
// tool's own description — the text `tool_search` surfaces, at no standing cost
// (the tool set is unchanged and every tool stays deferred).
test("the deferred runner tool's description carries the subcommand family index (issue #603 S4)", async () => {
  const { createWorkflowTools } = await loadModule();
  const tools = createWorkflowTools();
  const run = tools.find((tool) => tool.name === "agentic_workflow_run");
  assert.ok(run, "the generic runner door exists");
  for (const family of ["editing", "sensor", "guard", "lane", "forge", "knowledge", "tooling"]) {
    assert.match(run.description, new RegExp(`\\b${family}\\b`, "u"), `the index names the \`${family}\` family`);
  }
  assert.match(run.description, /help <subcommand>/u, "the index points at the CLI's own help for exact flags");
  // The index rides an existing description: it adds no tool, so the declared
  // set — and therefore the standing token cost — is unchanged.
  assert.deepEqual(
    tools.map((tool) => tool.name).sort(),
    [...TOOL_NAMES].sort(),
    "no tool was added to carry the index",
  );
  for (const tool of tools) {
    assert.equal(tool.exposure, "deferred", `${tool.name} stays deferred, so nothing is declared standing`);
  }
});

test("registration: the factory's toolRegistrar seam receives the specs", async () => {
  const { createExtension } = await import("../dist/extension/factory.js");
  const registered = [];
  createExtension({
    registrar: { registerCommand: () => {} },
    toolRegistrar: { registerTool: (tool) => registered.push(tool) },
    surface: () => ({}),
    skillsDir: join(process.cwd(), "skills"),
    agentDir: path.join(os.tmpdir(), "paw-tool-agentdir"),
    hint: { shouldShow: () => false, markShown: () => {} },
    settings: () => {},
  });
  assert.deepEqual(
    registered.map((tool) => tool.name).sort(),
    [...TOOL_NAMES].sort(),
  );
  for (const tool of registered) {
    assert.equal(tool.exposure, "deferred");
    assert.equal(tool.annotations?.readOnlyHint, true);
    assert.ok(tool.execute, `${tool.name} carries an execute`);
    assert.equal(typeof tool.parameters, "object");
    assert.equal(typeof tool.outputSchema, "object");
  }
});

// ---------------------------------------------------------------------------
// Status tool (AC1, AC2, O1, O2, O4, O5)
// ---------------------------------------------------------------------------

test("status: happy path returns the validated envelope as structuredContent", async () => {
  const { createWorkflowTools } = await loadModule();
  const envelope = makeValidEnv();
  // The runSensor seam is the conductor's own; the tool must call it with the
  // caller's cwd and the resolved bin.
  const calls = [];
  const tools = createWorkflowTools({
    bin: () => "bun",
    runSensor: (cwd, bin) => {
      calls.push([cwd, bin]);
      return Promise.resolve({ ok: true, envelope });
    },
  });
  const status = tools.find((tool) => tool.name === "agentic_workflow_status");
  const result = await status.execute({}, "/fixture/project");
  assert.deepEqual(calls, [["/fixture/project", "bun"]], "the sensor spawns in the project under work with the resolved bin");
  assert.equal(result.isError, undefined);
  assert.deepEqual(result.structuredContent, envelope);
  assert.equal(typeof result.text, "string");
  assert.ok(result.text.length > 0);
});

test("status: degraded envelope → isError true with the envelope attached", async () => {
  const { createWorkflowTools } = await loadModule();
  const envelope = makeValidEnv({ detail: { degradations: ["git-not-available"] } });
  const tools = createWorkflowTools({
    bin: () => "bun",
    runSensor: () => Promise.resolve({ ok: false, refusal: "sensor-degraded", detail: "sensor degraded: git-not-available", envelope }),
  });
  const status = tools.find((tool) => tool.name === "agentic_workflow_status");
  const result = await status.execute({}, "/fixture/project");
  assert.equal(result.isError, true);
  assert.deepEqual(result.structuredContent, envelope, "the envelope rides structuredContent on the degraded run");
});

test("status: spawn/parse failure → isError true with the degradation record", async () => {
  const { createWorkflowTools } = await loadModule();
  const tools = createWorkflowTools({
    bin: () => "bun",
    runSensor: () => Promise.resolve({ ok: false, refusal: "sensor-degraded", detail: "spawn error: boom" }),
  });
  const status = tools.find((tool) => tool.name === "agentic_workflow_status");
  const result = await status.execute({}, "/fixture/project");
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent.refusal, "sensor-degraded");
  assert.equal(result.structuredContent.detail, "spawn error: boom");
  assert.equal(result.structuredContent.tool, "agentic_workflow_status");
});

test("status: outputSchema reuses the published envelope schema verbatim (no second source)", async () => {
  const { createWorkflowTools } = await loadModule();
  const published = JSON.parse(
    fs.readFileSync(require.resolve("@gtrabanco/agentic-workflow-schema/envelope.schema.json"), "utf8"),
  );
  const tools = createWorkflowTools();
  const status = tools.find((tool) => tool.name === "agentic_workflow_status");
  const oneOf = status.outputSchema.oneOf;
  assert.ok(Array.isArray(oneOf) && oneOf.length === 2, "envelope + degradation record");
  assert.deepEqual(oneOf[0], published, "the envelope branch IS the published schema");
  assert.equal(oneOf[1].properties?.refusal?.const, "sensor-degraded", "the degradation branch is the tool's own boundary contract");
});

// ---------------------------------------------------------------------------
// Live gate scripts (AC4, AC5, O9, O10)
// ---------------------------------------------------------------------------

/**
 * Local siblings each live *repository* script imports — the copy must carry its
 * closure. The runner tools need no copy at all: since feature 91 they spawn the
 * crate's bin, which a project gets from its installed package.
 */
const SCRIPT_CLOSURE = {
  "audit-pr-gate.mjs": ["review-receipt.mjs", "scope-manifest.mjs"],
};

/** A throwaway git repo with the script and its import closure copied into scripts/. */
function makeLiveSandbox(script) {
  const root = scratchDir("paw-tool-live-");
  fs.mkdirSync(path.join(root, "scripts"));
  for (const name of [script, ...(SCRIPT_CLOSURE[script] ?? [])]) {
    const source = path.join(REPO_ROOT, "scripts", name);
    // A migrated runtime has no repository copy any more: its tool spawns the
    // crate's bin, so the sandbox is the project, not a copy of the runner.
    if (!fs.existsSync(source)) continue;
    fs.copyFileSync(source, path.join(root, "scripts", name));
  }
  const git = (args, opts = {}) =>
    execFileSync("git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.test", "-c", "commit.gpgsign=false", ...args], { cwd: root, env: sandboxGitEnv(), encoding: "utf8", ...opts });
  git(["init", "-q"]);
  return { root, git };
}

/**
 * Minimal JSON-schema check for the shapes these schemas declare. It reports the
 * reason a value does not match (`null` when it does), so `checkSchema` can tell a
 * match from a mismatch: `someOf` is satisfied by ANY branch passing.
 */
function checkSchema(schema, value, where = "value") {
  const error = matchesSchema(schema, value);
  assert.equal(error, null, `${where}: ${error}`);
}

function matchesSchema(schema, value) {
  if (Array.isArray(schema.oneOf)) {
    const failures = schema.oneOf.map((variant) => matchesSchema(variant, value));
    if (failures.some((failure) => failure === null)) return null;
    return `matches no oneOf branch (${failures.join(" | ")})`;
  }
  const type = schema.type;
  if (type !== undefined) {
    const types = Array.isArray(type) ? type : [type];
    const actual = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
    const accepted = types.some((candidate) => {
      if (candidate === "integer") return Number.isInteger(value);
      // JSON Schema: every integer IS a number; `number` never means "non-integer".
      if (candidate === "number") return typeof value === "number" && Number.isFinite(value);
      return candidate === actual;
    });
    if (!accepted) return `expected ${types.join("|")}, got ${actual}`;
  }
  if (Array.isArray(schema.enum)) {
    if (!schema.enum.includes(value)) return `expected one of ${schema.enum.join("|")}`;
  }
  if ("const" in schema && value !== schema.const) return `expected const ${JSON.stringify(schema.const)}`;
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const name of schema.required ?? []) {
      if (!(name in value)) return `missing required property ${name}`;
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) return `unexpected property ${key}`;
      }
    }
    for (const [name, sub] of Object.entries(schema.properties ?? {})) {
      if (name in value) {
        const result = matchesSchema(sub, value[name]);
        if (result !== null) return `${name}: ${result}`;
      }
    }
  }
  if (Array.isArray(value) && schema.items) {
    for (let index = 0; index < value.length; index += 1) {
      const result = matchesSchema(schema.items, value[index]);
      if (result !== null) return `[${index}]: ${result}`;
    }
  }
  return null;
}

test("schema helper: a value matching no oneOf branch fails the check", () => {
  // The frozen failure (external-verify 26b4919c B3): `filter(Boolean)` kept a
  // failure *string* as truthy, so this assertion could never fail and the five
  // gate schemas were never actually validated against live output.
  const schema = {
    oneOf: [
      { type: "object", required: ["a"], properties: { a: { type: "string" } } },
      { type: "object", required: ["b"], properties: { b: { type: "string" } } },
    ],
  };
  assert.throws(() => checkSchema(schema, { unrelated: true }, "self-check"), /matches no oneOf branch/);
  checkSchema(schema, { b: "ok" }, "self-check");
});

test("schema helper: `number` admits an integer, `integer` rejects a fraction", () => {
  checkSchema({ type: "number" }, 3, "integer-as-number");
  assert.throws(() => checkSchema({ type: "integer" }, 3.5, "fraction"), /expected integer/);
});

test("diff-guard live: pass → structured counts; breach → isError with the breach data", async () => {
  const { createWorkflowTools } = await loadModule();
  const { root, git } = makeLiveSandbox("diff-guard.mjs");
  fs.writeFileSync(path.join(root, "a.txt"), "one\n");
  git(["add", "."]);
  git(["commit", "-qm", "base"]);
  const base = git(["rev-parse", "HEAD"]).trim();

  const tools = createWorkflowTools({ bin: () => "node" });
  const guard = tools.find((tool) => tool.name === "agentic_workflow_diff_guard");

  const pass = await guard.execute({ base }, root);
  checkSchema(guard.outputSchema, pass.structuredContent, "diff-guard pass");
  assert.equal(pass.isError, undefined);
  assert.equal(pass.structuredContent.breach, false);
  assert.ok(String(pass.structuredContent.base).startsWith(base.slice(0, 7)), "the guard echoes the base revision");

  fs.appendFileSync(path.join(root, "a.txt"), Array.from({ length: 500 }, (_, i) => `line ${i}\n`).join(""));
  const breach = await guard.execute({ base }, root);
  checkSchema(guard.outputSchema, breach.structuredContent, "diff-guard breach");
  assert.equal(breach.isError, true, "a breach is isError: true");
  assert.equal(breach.structuredContent.breach, true);
  assert.ok(breach.structuredContent.lines > 400);

  const missing = await guard.execute({ base: "not-a-ref" }, root);
  assert.equal(missing.isError, true, "an error run is isError: true");
  // The script reports an unmeasurable run as the breach *reason* (diff-guard.mjs
  // `breach: error || …`), so the declared schema must admit the string form.
  assert.equal(typeof missing.structuredContent.breach, "string", "the error path carries the reason in `breach`");
  checkSchema(guard.outputSchema, missing.structuredContent, "diff-guard error");
  assert.ok(missing.structuredContent.error);
});

test("snapshot-verify live: a unit with no receipt answers the missing-receipt report, schema-valid", async () => {
  const { createWorkflowTools } = await loadModule();
  // The script resolves the schema runtime from its own checkout, so the fixture
  // carries the repository's `packages/` tree and the script's import closure.
  const { root, git } = makeLiveSandbox("pre-execution-snapshot.mjs");
  fs.symlinkSync(path.join(REPO_ROOT, "packages"), path.join(root, "packages"));
  fs.mkdirSync(path.join(root, "docs", "fix", "probe-unit"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "docs", "fix", "probe-unit", "SPEC.md"),
    "# probe-unit\n\n## Specs\n\n**S1 — probe.**\n",
  );
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);

  const tools = createWorkflowTools({ bin: () => "node" });
  const verify = tools.find((tool) => tool.name === "agentic_workflow_snapshot_verify");
  // A fix unit binds no parent (D6); the explicit dir keeps the fixture's unit
  // outside the `docs/features/` default.
  const result = await verify.execute(
    { stage: "plan", unit: "probe-unit", unitKind: "fix", dir: "docs/fix/probe-unit" },
    root,
  );
  // Exit 3: the report carries the reason code and no digest at all.
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent.current, false);
  assert.equal(result.structuredContent.code, "missing-receipt-snapshot");
  assert.equal(result.structuredContent.unit, "probe-unit");
  checkSchema(verify.outputSchema, result.structuredContent, "snapshot missing-receipt");
});

test("phase-lint live: PASS and BLOCKED unit docs → typed verdict with fingerprint", async () => {
  const { createWorkflowTools } = await loadModule();
  // phase-lint is a read-only script that imports a repo-rooted sibling, so it
  // runs from the repository's own checkout (a read, never a mutation of the
  // live tree) with fixture documents written under os.tmpdir().
  const fixtures = scratchDir("paw-tool-lint-");
  const clean = path.join(fixtures, "clean.md");
  fs.writeFileSync(
    clean,
    [
      "## Tasks",
      "",
      "- P1 — Write the failing suite (validator: `bun test test/x.test.mjs` exits 1)",
      "  (Implements: S1)",
      "- P2 — Implement the module (validator: `bun test test/x.test.mjs` exits 0)",
      "  (Implements: S1)",
      "- P3 — Verify the unit (validator: `bun test test/x.test.mjs` exits 0)",
      "  (Implements: S1)",
    ].join("\n") + "\n",
  );
  const tools = createWorkflowTools({ bin: () => "node" });
  const lint = tools.find((tool) => tool.name === "agentic_workflow_phase_lint");

  const pass = await lint.execute({ path: clean }, REPO_ROOT);
  checkSchema(lint.outputSchema, pass.structuredContent, "phase-lint pass");
  assert.equal(pass.isError, undefined);
  assert.equal(pass.structuredContent.verdict, "PASS");
  assert.match(pass.structuredContent.fingerprint, /^[0-9a-f]{64}$/);

  const blocked = path.join(fixtures, "blocked.md");
  fs.writeFileSync(
    blocked,
    ["## Tasks", "", "- P1 — A task with no link", ""].join("\n") + "\n",
  );
  const blockedRun = await lint.execute({ path: blocked }, REPO_ROOT);
  checkSchema(lint.outputSchema, blockedRun.structuredContent, "phase-lint blocked");
  assert.equal(blockedRun.isError, true, "BLOCKED is isError: true");
  assert.equal(blockedRun.structuredContent.verdict, "BLOCKED");
  assert.ok(blockedRun.structuredContent.blockReason);
  assert.equal(typeof blockedRun.structuredContent.fingerprint, "string");
});

// ---------------------------------------------------------------------------
// Exit-code mapping with an injected spawn (O11, O12)
// ---------------------------------------------------------------------------

function spawnDouble(rows) {
  return (request) => {
    const row = rows.shift();
    if (!row) throw new Error("unexpected extra spawn");
    return row;
  };
}

test("audit-pr-gate: exit 0 → structured report; exit 2 → isError with the report", async () => {
  const { createWorkflowTools } = await loadModule();
  const ready = { verdict: "MERGE-READY", reason: null, head: "a".repeat(40), pr: 1, action: "post", actionReason: "new" };
  const blocked = { verdict: "BLOCKED", reason: "no-current-receipt", head: "b".repeat(40), pr: 1, action: "none", actionReason: "blocked" };
  const tools = createWorkflowTools({
    bin: () => "bun",
    spawnScript: spawnDouble([
      { code: 0, stdout: JSON.stringify(ready), stderr: "" },
      { code: 2, stdout: JSON.stringify(blocked), stderr: "" },
      { code: 1, stdout: "not json", stderr: "boom" },
    ]),
  });
  const gate = tools.find((tool) => tool.name === "agentic_workflow_audit_pr_gate");

  const ok = await gate.execute({ pr: "1" }, "/fixture/project");
  checkSchema(gate.outputSchema, ok.structuredContent, "audit-pr-gate ready");
  assert.equal(ok.isError, undefined);
  assert.equal(ok.structuredContent.verdict, "MERGE-READY");

  const blockedRun = await gate.execute({ pr: "1" }, "/fixture/project");
  assert.equal(blockedRun.isError, true);
  assert.equal(blockedRun.structuredContent.verdict, "BLOCKED");

  const garbage = await gate.execute({ pr: "1" }, "/fixture/project");
  assert.equal(garbage.isError, true);
  assert.equal(garbage.structuredContent.refusal, "gate-unavailable");
});

test("audit-pr-gate: the spawn leaves the forge scope to the spawn cwd", async () => {
  const { createWorkflowTools } = await loadModule();
  const requests = [];
  const tools = createWorkflowTools({
    bin: () => "bun",
    spawnScript: (request) => {
      requests.push(request);
      return { code: 2, stdout: JSON.stringify({ verdict: "BLOCKED", reason: "no-current-receipt", head: null, pr: null, action: "none", actionReason: "blocked" }), stderr: "" };
    },
  });
  const gate = tools.find((tool) => tool.name === "agentic_workflow_audit_pr_gate");
  await gate.execute({ pr: "9", head: "c".repeat(40) }, "/fixture/project");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].cwd, "/fixture/project");
  assert.equal(requests[0].program, "bun");
  // `--repo`/`-R` is a forge scope (`[HOST/]OWNER/REPO`), never a filesystem
  // path: the script reads git in its cwd and `gh` infers the repo from it.
  assert.deepEqual(requests[0].argv, ["scripts/audit-pr-gate.mjs", "evaluate", "--pr", "9", "--head", "c".repeat(40)]);
});

test("audit-pr-gate live: the tool reaches the script's own report contract", async () => {
  const { createWorkflowTools } = await loadModule();
  const { root } = makeLiveSandbox("audit-pr-gate.mjs");
  // The script's import closure resolves the schema runtime from its own
  // checkout (`<root>/packages/...`), exactly as it does in the repository.
  fs.symlinkSync(path.join(REPO_ROOT, "packages"), path.join(root, "packages"));
  const head = "e".repeat(40);
  // A `gh` shim on PATH answers the forge read: the only network surface the
  // script has, pinned so the fixture stays deterministic and offline.
  const binDir = path.join(root, "bin");
  fs.mkdirSync(binDir);
  const shim = path.join(binDir, "gh");
  fs.writeFileSync(
    shim,
    `#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify({ headRefOid: ${JSON.stringify(head)}, number: 1, isDraft: false, mergeable: "MERGEABLE", comments: [] }));\n`,
    { mode: 0o755 },
  );
  const previousPath = process.env.PATH;
  process.env.PATH = `${binDir}${path.delimiter}${previousPath}`;
  try {
    const tools = createWorkflowTools({ bin: () => "node" });
    const gate = tools.find((tool) => tool.name === "agentic_workflow_audit_pr_gate");
    const result = await gate.execute({ pr: "1" }, root);
    // No receipt for this head → BLOCKED (exit 2), reported with data instead of
    // the `gate-unavailable` degradation the forge-scope flag used to cause.
    assert.equal(result.structuredContent.refusal, undefined, "the script answered, so no degradation record");
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent.verdict, "BLOCKED");
    assert.equal(result.structuredContent.head, head);
    assert.equal(result.structuredContent.action, "none");
    checkSchema(gate.outputSchema, result.structuredContent, "audit-pr-gate live blocked");
  } finally {
    process.env.PATH = previousPath;
  }
});

test("snapshot-verify: exit 0 fresh; exit 3/4 → isError with the report", async () => {
  const { createWorkflowTools } = await loadModule();
  const fresh = {
    current: true, stage: "spec", unit: "70-pi-tool-surface",
    receipt: { id: "R1", verdict: "spec-review-pass", snapshot: "sha256:" + "d".repeat(64), authorExclusion: null, contextClean: null, policy: "1" },
    observedDigest: "d".repeat(64), digestMatches: true, verdictIsPass: true,
    structural: { fresh: true, dimensions: [] },
  };
  const missing = {
    current: false, code: "missing-receipt-snapshot", stage: "spec", unit: "70-pi-tool-surface",
    seen: [],
  };
  const stale = {
    current: false, stage: "spec", unit: "70-pi-tool-surface",
    receipt: { id: "R1", verdict: "spec-review-pass", snapshot: "sha256:" + "e".repeat(64), authorExclusion: null, contextClean: null, policy: "1" },
    observedDigest: "f".repeat(64), digestMatches: false, verdictIsPass: true,
    structural: { fresh: false, dimensions: [{ dimension: "artifact-content", reason: "stale-artifact-content" }] },
  };
  const tools = createWorkflowTools({
    bin: () => "bun",
    spawnScript: spawnDouble([
      { code: 0, stdout: JSON.stringify(fresh), stderr: "" },
      { code: 3, stdout: JSON.stringify(missing), stderr: "" },
      { code: 4, stdout: JSON.stringify(stale), stderr: "" },
    ]),
  });
  const verify = tools.find((tool) => tool.name === "agentic_workflow_snapshot_verify");

  const ok = await verify.execute({ stage: "spec", unit: "70-pi-tool-surface" }, "/fixture/project");
  checkSchema(verify.outputSchema, ok.structuredContent, "snapshot-verify fresh");
  assert.equal(ok.isError, undefined);
  assert.equal(ok.structuredContent.current, true);

  const missingRun = await verify.execute({ stage: "spec", unit: "70-pi-tool-surface" }, "/fixture/project");
  assert.equal(missingRun.isError, true);
  assert.equal(missingRun.structuredContent.current, false);

  const staleRun = await verify.execute({ stage: "spec", unit: "70-pi-tool-surface" }, "/fixture/project");
  assert.equal(staleRun.isError, true);
  assert.equal(staleRun.structuredContent.current, false);
});

// ---------------------------------------------------------------------------
// doc_search (issue #719 S2, D4)
// ---------------------------------------------------------------------------
//
// The doc index used to be reachable only through a shell (`agentic-workflow doc
// --query`) or the `/aw-index` slash command, so semantic search was a command a
// caller had to remember. `doc_search` is the same query as a deferred tool: the
// crate's own `doc --query … --json-only` envelope, returned typed, never
// re-derived and never written.

const DOC_QUERY_ENVELOPE = {
  ok: true,
  command: "query",
  results: [
    { path: "docs/features/a/SPEC.md", section: "Decision", lines: [12, 30], score: -1.25, meta: { words: 140 } },
    { path: "skills/x/SKILL.md", section: null, lines: [1, 9], score: -0.5, meta: {} },
  ],
  degradations: [],
  store: { present: true, model: "qwen3-embedding", chunks: 4200, pending: 0 },
};

test("doc_search: registered deferred and read-only in the agentic-workflow namespace", async () => {
  const { createWorkflowTools, WORKFLOW_TOOLS_NAMESPACE } = await loadModule();
  const tools = createWorkflowTools();
  const search = tools.find((tool) => tool.name === "doc_search");

  assert.ok(search, "the tool is registered under the owner's own suggested name");
  assert.equal(search.exposure, "deferred", "never declared to the model");
  assert.equal(search.annotations?.readOnlyHint, true, "a query writes nothing");
  assert.equal(search.namespace, WORKFLOW_TOOLS_NAMESPACE);
  assert.deepEqual(Object.keys(search.parameters.properties).sort(), ["mode", "query"]);
  assert.deepEqual(search.parameters.required, ["query"]);
  assert.deepEqual(search.parameters.properties.mode.enum, ["hybrid", "keyword"]);
});

test("doc_search: spawns the pinned runner's doc query with --json-only and returns the typed envelope", async () => {
  const { createWorkflowTools } = await loadModule();
  const requests = [];
  const tools = createWorkflowTools({
    bin: () => "bun",
    spawnScript: (request) => {
      requests.push(request);
      return Promise.resolve({ code: 0, stdout: JSON.stringify(DOC_QUERY_ENVELOPE), stderr: "" });
    },
  });
  const search = tools.find((tool) => tool.name === "doc_search");
  const result = await search.execute({ query: "embedding precedence" }, "/fixture/project");

  assert.equal(requests.length, 1);
  assert.equal(requests[0].cwd, "/fixture/project", "the host's cwd is the project the query runs against");
  assert.deepEqual(
    requests[0].argv.slice(-4),
    ["doc", "--query", "embedding precedence", "--json-only"],
    "the crate's own query op, its JSON switch",
  );
  assert.deepEqual(result.structuredContent, DOC_QUERY_ENVELOPE, "the envelope arrives as data, verbatim");
  assert.equal(result.isError, undefined);
  checkSchema(search.outputSchema, result.structuredContent, "doc_search happy path");
});

test("doc_search: an explicit mode rides the crate's own flag, an absent one is left to the crate", async () => {
  const { createWorkflowTools } = await loadModule();
  const requests = [];
  const tools = createWorkflowTools({
    bin: () => "bun",
    spawnScript: (request) => {
      requests.push(request);
      return Promise.resolve({ code: 0, stdout: JSON.stringify(DOC_QUERY_ENVELOPE), stderr: "" });
    },
  });
  const search = tools.find((tool) => tool.name === "doc_search");

  await search.execute({ query: "term", mode: "keyword" }, "/fixture");
  assert.ok(requests[0].argv.includes("--mode"), "the mode is forwarded");
  assert.equal(requests[0].argv[requests[0].argv.indexOf("--mode") + 1], "keyword");

  await search.execute({ query: "term" }, "/fixture");
  assert.ok(
    !requests[1].argv.includes("--mode"),
    "an absent mode is absent, so the crate's own auto resolution runs",
  );
});

test("doc_search: the result description matches the crate's frozen ordering — a higher score ranks first", async () => {
  const { createWorkflowTools } = await loadModule();
  const search = createWorkflowTools().find((tool) => tool.name === "doc_search");
  // The published schema is the success/error union; the score lives in the
  // envelope branch, the one a caller reads a result row from.
  const schema = search.outputSchema.oneOf?.find((branch) => branch.properties?.results) ?? search.outputSchema;
  const score = schema.properties.results.items.properties.score;
  assert.equal(score.type, "number");
  // `query.mjs`'s frozen D3 ordering is score descending (the score is the
  // negated bm25 rank, so higher is better) — a caller reading this schema must
  // be told the same thing the crate does, never the inverse.
  assert.match(score.description, /higher (score )?ranks first/iu, "the description names the real ordering");
  assert.doesNotMatch(score.description, /lower/iu, "and never claims the inverse");
});

test("doc_search: a keyword-only store answers with its declared degradation, not an error", async () => {
  const { createWorkflowTools } = await loadModule();
  const degradedEnvelope = {
    ...DOC_QUERY_ENVELOPE,
    degradations: ["unavailable-embeddings-not-configured"],
    store: { present: true, model: null, chunks: 4200, pending: 0 },
  };
  const tools = createWorkflowTools({
    bin: () => "bun",
    spawnScript: () => Promise.resolve({ code: 0, stdout: JSON.stringify(degradedEnvelope), stderr: "" }),
  });
  const result = await tools.find((tool) => tool.name === "doc_search").execute({ query: "term" }, "/fixture");

  // exit 0 is ok by the crate's own contract (D3): a degraded hybrid answer is
  // still an answer, and the caller decides what the degradation means.
  assert.equal(result.isError, undefined);
  assert.deepEqual(result.structuredContent.degradations, ["unavailable-embeddings-not-configured"]);
});

test("doc_search: a spawn that cannot answer degrades with a record instead of throwing", async () => {
  const { createWorkflowTools } = await loadModule();
  const tools = createWorkflowTools({
    bin: () => "bun",
    spawnScript: () => Promise.resolve({ code: null, stdout: "", stderr: "", spawnError: "ENOENT" }),
  });
  const result = await tools.find((tool) => tool.name === "doc_search").execute({ query: "term" }, "/fixture");

  assert.equal(result.isError, true);
  assert.equal(result.structuredContent.contract, "agentic-workflow/tool-degraded");
  assert.equal(result.structuredContent.refusal, "gate-unavailable");
});

test("doc_search: a missing query is an argument error, never a silent empty search", async () => {
  const { createWorkflowTools } = await loadModule();
  const spawned = [];
  const tools = createWorkflowTools({
    bin: () => "bun",
    spawnScript: (request) => {
      spawned.push(request);
      return Promise.resolve({ code: 0, stdout: "{}", stderr: "" });
    },
  });
  const search = tools.find((tool) => tool.name === "doc_search");
  const result = await search.execute({}, "/fixture");

  // The shared gate-tool body turns a refused argument into a degraded record
  // rather than letting it escape to the host — and, crucially, nothing spawns:
  // an empty `--query` would answer the whole corpus, which is worse than no
  // answer at all.
  assert.equal(spawned.length, 0, "no query runs without a term");
  assert.equal(result.isError, true);
  assert.match(result.structuredContent.detail, /query is required/);
});
