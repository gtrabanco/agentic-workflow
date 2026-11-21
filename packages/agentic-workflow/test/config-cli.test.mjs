// config-cli.test.mjs — the unified config CLI/API (issue #427 S6/S7).
//
// Every assertion runs the real binary in a throwaway project, because the CLI
// is the contract an operator and a `runner <subcommand>` citation use.

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const CLI = new URL("../bin/agentic-workflow.mjs", import.meta.url).pathname;

function run(args, options = {}) {
  return spawnSync(process.execPath, [CLI, "config", ...args], { encoding: "utf8", ...options });
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "aw-config-cli-"));
  return { root, global: join(root, "global"), project: join(root, "project") };
}

test("init writes a commented file and refuses to overwrite it", () => {
  const { root, global, project } = fixture();
  try {
    const created = run(["init", "--project", project, "--global-dir", global]);
    assert.equal(created.status, 0, created.stderr);
    const text = readFileSync(join(project, ".pi", "agentic-workflow.json"), "utf8");
    assert.match(text, /agentic-workflow config/);
    assert.match(text, /logSession/);
    // Issue #626: the first file an operator writes explains the guard vocabulary.
    assert.match(text, /\"guard\"/);
    assert.match(text, /allow.*deny.*ask/);
    const again = run(["init", "--project", project, "--global-dir", global]);
    assert.equal(again.status, 2);
    assert.match(again.stderr, /CONFIG REFUSAL/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("init refuses to overwrite a present-but-broken file", () => {
  const { root, global, project } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    const file = join(project, ".pi", "agentic-workflow.json");
    writeFileSync(file, '{ "logSession": ');
    const again = run(["init", "--project", project, "--global-dir", global]);
    assert.equal(again.status, 2);
    assert.equal(readFileSync(file, "utf8"), '{ "logSession": ', "the broken bytes are evidence, not scratch");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("get reads the effective default without a file", () => {
  const { root, global, project } = fixture();
  try {
    const got = run(["get", "logSession", "--project", project, "--global-dir", global]);
    assert.equal(got.status, 0, got.stderr);
    assert.deepEqual(JSON.parse(got.stdout), { enabled: false, publisher: null });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("set validates before writing and never coerces", () => {
  const { root, global, project } = fixture();
  try {
    const ok = run(["set", "logSession", "true", "--project", project, "--global-dir", global]);
    assert.equal(ok.status, 0, ok.stderr);
    assert.deepEqual(JSON.parse(readFileSync(join(project, ".pi", "agentic-workflow.json"), "utf8")), { logSession: true });
    const bad = run(["set", "memory.engram", "yes", "--project", project, "--global-dir", global]);
    assert.equal(bad.status, 2);
    assert.match(bad.stderr, /CONFIG REFUSAL/);
    assert.match(bad.stderr, /expected boolean/);
    assert.equal(readFileSync(join(project, ".pi", "agentic-workflow.json"), "utf8").includes("yes"), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("project overrides global per key", () => {
  const { root, global, project } = fixture();
  try {
    mkdirSync(join(global), { recursive: true });
    writeFileSync(join(global, "agentic-workflow.json"), '{ "logSession": { "publisher": { "command": ["global-sink"] } } }');
    mkdirSync(join(project, ".pi"), { recursive: true });
    writeFileSync(join(project, ".pi", "agentic-workflow.json"), '{ "logSession": { "enabled": true } }');
    const got = run(["get", "logSession", "--scope", "resolved", "--project", project, "--global-dir", global]);
    assert.equal(got.status, 0, got.stderr);
    assert.deepEqual(JSON.parse(got.stdout), { enabled: true, publisher: { command: ["global-sink"], timeoutMs: 5000 } });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("list names every node with type, category and default", () => {
  const { root, global, project } = fixture();
  try {
    const listed = run(["list", "--project", project, "--global-dir", global, "--json"]);
    assert.equal(listed.status, 0, listed.stderr);
    const nodes = JSON.parse(listed.stdout);
    const memory = nodes.find((node) => node.path === "memory.engram");
    assert.deepEqual({ type: memory.type, category: memory.category, defaultValue: memory.defaultValue }, { type: "boolean", category: "feature", defaultValue: false });
    assert.equal(nodes.some((node) => node.path === "guard.gitIdentity.mode"), true);
    assert.equal(nodes.some((node) => node.path === "guard.default"), true);
    assert.equal(nodes.some((node) => node.path.startsWith("guards.")), false, "the retired section is not listed");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("validate reports an unknown key, silence is opt-in, sanitize removes it", () => {
  const { root, global, project } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    const file = join(project, ".pi", "agentic-workflow.json");
    writeFileSync(file, '{ "memory": { "engram": true, "ghost": 1 } }');
    const strict = run(["validate", "--project", project, "--global-dir", global]);
    assert.equal(strict.status, 2);
    assert.match(strict.stderr, /memory\.ghost/);
    const silenced = run(["validate", "--no-warn-unknown", "--project", project, "--global-dir", global]);
    assert.equal(silenced.status, 0, silenced.stderr);
    const sanitized = run(["validate", "--sanitize", "--project", project, "--global-dir", global]);
    assert.equal(sanitized.status, 0, sanitized.stderr);
    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), { memory: { engram: true } });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("reset removes a section and a nested node", () => {
  const { root, global, project } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    const file = join(project, ".pi", "agentic-workflow.json");
    writeFileSync(file, '{ "logSession": { "enabled": true, "publisher": { "command": ["sink"] } }, "memory": { "engram": true } }');
    assert.equal(run(["reset", "logSession.publisher", "--project", project, "--global-dir", global]).status, 0);
    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")).logSession, { enabled: true });
    assert.equal(run(["reset", "memory", "--project", project, "--global-dir", global]).status, 0);
    assert.equal(JSON.parse(readFileSync(file, "utf8")).memory, undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an installed package extends the schema and the same CLI edits its file", () => {
  const { root, global, project } = fixture();
  try {
    const pkg = join(project, "node_modules", "@gtrabanco", "pi-agentic-workflow");
    mkdirSync(pkg, { recursive: true });
    writeFileSync(join(pkg, "package.json"), JSON.stringify({ name: "@gtrabanco/pi-agentic-workflow", agenticWorkflow: { config: "./agentic-workflow.config.json" } }));
    writeFileSync(
      join(pkg, "agentic-workflow.config.json"),
      JSON.stringify({
        contract: "config-extension@1",
        key: "pi",
        file: "pi-agentic-workflow.json",
        description: "pi package config",
        schema: { type: "object", additionalProperties: false, properties: { default: { type: "object", additionalProperties: false, properties: { model: { type: "string" } } } } },
        defaults: { default: { model: "inherit" } },
      }),
    );
    const listed = run(["list", "--project", project, "--global-dir", global, "--json"]);
    assert.equal(listed.status, 0, listed.stderr);
    assert.equal(JSON.parse(listed.stdout).some((node) => node.path === "pi.default.model" && node.category === "pi"), true);
    const set = run(["set", "pi.default.model", '"nan/qwen3-32b"', "--project", project, "--global-dir", global]);
    assert.equal(set.status, 0, set.stderr);
    assert.deepEqual(JSON.parse(readFileSync(join(project, ".pi", "pi-agentic-workflow.json"), "utf8")), { default: { model: "nan/qwen3-32b" } });
    // Issue #626: `guard.default` and the extension's own `default` share a
    // first segment, so the unprefixed path is refused and the section prefix is
    // what names the node (the CLI's own teaching message says so).
    const ambiguous = run(["get", "default.model", "--scope", "resolved", "--project", project, "--global-dir", global, "--json"]);
    assert.equal(ambiguous.status, 2);
    assert.match(ambiguous.stderr, /belongs to several sections: guard, pi/);
    const got = run(["get", "pi.default.model", "--scope", "resolved", "--project", project, "--global-dir", global, "--json"]);
    assert.equal(got.status, 0, got.stderr);
    assert.equal(JSON.parse(got.stdout).value, "nan/qwen3-32b");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("schema prints the composed contract", () => {
  const { root, global, project } = fixture();
  try {
    const printed = run(["schema", "--project", project, "--global-dir", global]);
    assert.equal(printed.status, 0, printed.stderr);
    const schema = JSON.parse(printed.stdout);
    assert.equal(schema.type, "object");
    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.properties.logSession !== undefined, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ── config default — materialize explicit documented defaults (issue #600) ──

test("config default materializes every file of the requested scopes", () => {
  const { root, global, project } = fixture();
  try {
    const run1 = run(["default", "--project", project, "--global-dir", global, "--json"]);
    assert.equal(run1.status, 0, run1.stderr);
    const receipt = JSON.parse(run1.stdout);
    assert.equal(receipt.contract, "config-materialize@1");
    assert.equal(receipt.scope, "both");
    const files = receipt.files.map((entry) => `${entry.scope}/${entry.file}`).sort();
    assert.deepEqual(files, ["global/agentic-workflow.json", "project/agentic-workflow.json"]);
    const text = readFileSync(join(project, ".pi", "agentic-workflow.json"), "utf8");
    assert.match(text, /\/\/ memory\.engram\b/);
    assert.equal(JSON.parse(text).memory.engram, false);
    // stdout is the receipt; the progress channel never writes it.
    assert.equal(run1.stderr.includes("config-materialize@1"), false, "the receipt is stdout-only");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("config default preserves a user value and backs the file up first", () => {
  const { root, global, project } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    const file = join(project, ".pi", "agentic-workflow.json");
    writeFileSync(file, JSON.stringify({ telemetry: { enabled: false }, guards: { merge: false } }));
    const run1 = run(["default", "--scope", "project", "--project", project, "--global-dir", global, "--json"]);
    assert.equal(run1.status, 0, run1.stderr);
    const receipt = JSON.parse(run1.stdout);
    const row = receipt.files[0];
    assert.equal(JSON.parse(readFileSync(file, "utf8")).telemetry.enabled, false);
    assert.equal(JSON.parse(readFileSync(file, "utf8")).guards, undefined);
    assert.ok(row.backup, "the backup path is on the receipt");
    assert.equal(readFileSync(row.backup, "utf8"), JSON.stringify({ telemetry: { enabled: false }, guards: { merge: false } }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("config default --no-backup keeps the write and skips the copy", () => {
  const { root, global, project } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    const file = join(project, ".pi", "agentic-workflow.json");
    writeFileSync(file, JSON.stringify({ memory: { engram: true } }));
    const run1 = run(["default", "--scope", "project", "--no-backup", "--project", project, "--global-dir", global, "--json"]);
    assert.equal(run1.status, 0, run1.stderr);
    const row = JSON.parse(run1.stdout).files[0];
    assert.equal(row.backup, null);
    assert.equal(readdirSync(join(project, ".pi")).some((name) => name.includes(".bak-")), false);
    assert.equal(JSON.parse(readFileSync(file, "utf8")).memory.engram, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("config default refuses an unknown scope and a broken file without touching bytes", () => {
  const { root, global, project } = fixture();
  try {
    const badScope = run(["default", "--scope", "resolved", "--project", project, "--global-dir", global]);
    assert.equal(badScope.status, 2);
    assert.match(badScope.stderr, /CONFIG REFUSAL/);
    assert.equal(existsSync(join(project, ".pi", "agentic-workflow.json")), false);

    mkdirSync(join(project, ".pi"), { recursive: true });
    const file = join(project, ".pi", "agentic-workflow.json");
    writeFileSync(file, '{ "logSession": ');
    const broken = run(["default", "--scope", "project", "--project", project, "--global-dir", global]);
    assert.equal(broken.status, 2);
    assert.match(broken.stderr, /CONFIG REFUSAL/);
    assert.equal(readFileSync(file, "utf8"), '{ "logSession": ');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
