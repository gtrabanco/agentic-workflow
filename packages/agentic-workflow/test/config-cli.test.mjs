// config-cli.test.mjs — the unified config CLI/API (issue #427 S6/S7).
//
// Every assertion runs the real binary in a throwaway project, because the CLI
// is the contract an operator and `bunx @gtrabanco/agentic-workflow` use.

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    assert.equal(nodes.some((node) => node.path === "guards.cost.maxTokens"), true);
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
    const got = run(["get", "default.model", "--scope", "resolved", "--project", project, "--global-dir", global, "--json"]);
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
