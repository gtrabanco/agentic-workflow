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

import { parseJsonc } from "@gtrabanco/agentic-workflow-schema";

const CLI = new URL("../bin/agentic-workflow.mjs", import.meta.url).pathname;

/** `config default` writes JSONC; these three cases read the file it wrote. */
function readJsoncFile(path) {
  const parsed = parseJsonc(readFileSync(path, "utf8"));
  assert.equal(parsed.ok, true, `the materialized file parses: ${JSON.stringify(parsed.error ?? {})}`);
  return parsed.value;
}

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
    const text = readFileSync(join(project, ".pi", "agentic-workflow.json5"), "utf8");
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
    assert.deepEqual(JSON.parse(readFileSync(join(project, ".pi", "agentic-workflow.json5"), "utf8")), { logSession: true });
    const bad = run(["set", "memory.engram", "yes", "--project", project, "--global-dir", global]);
    assert.equal(bad.status, 2);
    assert.match(bad.stderr, /CONFIG REFUSAL/);
    assert.match(bad.stderr, /expected boolean/);
    assert.equal(readFileSync(join(project, ".pi", "agentic-workflow.json5"), "utf8").includes("yes"), false);
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
        file: "pi-agentic-workflow",
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
    assert.deepEqual(JSON.parse(readFileSync(join(project, ".pi", "pi-agentic-workflow.json5"), "utf8")), { default: { model: "nan/qwen3-32b" } });
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
    assert.deepEqual(files, ["global/agentic-workflow", "project/agentic-workflow"], "the receipt names the stem (#740 S4)");
    const text = readFileSync(join(project, ".pi", "agentic-workflow.json5"), "utf8");
    assert.match(text, /\/\/ memory\.engram\b/);
    assert.equal(readJsoncFile(join(project, ".pi", "agentic-workflow.json5")).memory.engram, false);
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
    assert.equal(readJsoncFile(file).telemetry.enabled, false);
    assert.equal(readJsoncFile(file).guards, undefined);
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
    assert.equal(readJsoncFile(file).memory.engram, true);
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
    assert.equal(existsSync(join(project, ".pi", "agentic-workflow.json5")), false);

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

test("config default refuses before any byte moves in any scope", () => {
  const { root, global, project } = fixture();
  try {
    // The default scope runs global first: a refusal must still leave every
    // file of the run untouched, because the message says `nothing was written`
    // and the crate README promises a refusal lands before any byte moves
    // (external-verify 2026-11-21, blocker B1).
    mkdirSync(join(project, ".pi"), { recursive: true });
    const file = join(project, ".pi", "agentic-workflow.json");
    const broken = '{ "logSession": ';
    writeFileSync(file, broken);
    const refused = run(["default", "--project", project, "--global-dir", global]);
    assert.equal(refused.status, 2, refused.stderr);
    assert.match(refused.stderr, /CONFIG REFUSAL — .*nothing was written/u);
    assert.equal(readFileSync(file, "utf8"), broken, "the refusing file keeps its bytes");
    assert.equal(existsSync(join(global, "agentic-workflow.json5")), false, "no scope is written before the refusal");
    assert.equal(readdirSync(join(project, ".pi")).some((name) => name.includes(".bak-")), false, "a refused run takes no backup");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ── stem resolution, JSON5 and the write-side rule (issue #740) ─────────────

test("a config is located by stem across json/jsonc/json5, and json wins silently (#740 S2)", () => {
  const { root, global, project } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    const read = () => run(["get", "memory.engram", "--scope", "project", "--project", project, "--global-dir", global]);

    writeFileSync(join(project, ".pi", "agentic-workflow.jsonc"), "// a JSON5 file\n{ memory: { engram: true }, }\n");
    const jsonc = read();
    assert.equal(jsonc.status, 0, jsonc.stderr);
    assert.equal(JSON.parse(jsonc.stdout), true, "the middle extension is read");

    writeFileSync(join(project, ".pi", "agentic-workflow.json"), '{ "memory": { "engram": false } }');
    assert.equal(JSON.parse(read().stdout), false, "json is read before jsonc, silently");

    rmSync(join(project, ".pi", "agentic-workflow.json"));
    rmSync(join(project, ".pi", "agentic-workflow.jsonc"));
    writeFileSync(join(project, ".pi", "agentic-workflow.json5"), "{ memory: { engram: true }, }\n");
    const json5 = read();
    assert.equal(json5.status, 0, json5.stderr);
    assert.equal(JSON.parse(json5.stdout), true, "the last extension is read");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a write lands in the file that exists and never renames it (#740 S3)", () => {
  const { root, global, project } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    const file = join(project, ".pi", "agentic-workflow.jsonc");
    writeFileSync(file, '// keep me\n{ memory: { engram: false } }\n');
    const set = run(["set", "memory.engram", "true", "--project", project, "--global-dir", global, "--json"]);
    assert.equal(set.status, 0, set.stderr);
    assert.equal(JSON.parse(set.stdout).file, file, "the receipt names the file written");
    assert.equal(readJsoncFile(file).memory.engram, true);
    assert.deepEqual(
      readdirSync(join(project, ".pi")).sort(),
      ["agentic-workflow.jsonc"],
      "neither a .json nor a .json5 copy is created",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("config default creates <stem>.json5 over an absent pair and keeps an existing name (#740 S3)", () => {
  const { root, global, project } = fixture();
  try {
    const created = run(["default", "--scope", "project", "--project", project, "--global-dir", global, "--json"]);
    assert.equal(created.status, 0, created.stderr);
    assert.deepEqual(readdirSync(join(project, ".pi")).filter((name) => !name.includes(".bak-")), ["agentic-workflow.json5"]);

    writeFileSync(join(project, ".pi", "agentic-workflow.jsonc"), "{ memory: { engram: true } }\n");
    const kept = run(["default", "--scope", "project", "--project", project, "--global-dir", global, "--json"]);
    assert.equal(kept.status, 0, kept.stderr);
    const row = JSON.parse(kept.stdout).files[0];
    assert.equal(row.path, join(project, ".pi", "agentic-workflow.jsonc"));
    assert.equal(readJsoncFile(row.path).memory.engram, true, "the operator's value survives");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("validate --sanitize drops a value that no longer validates, not only unknown keys (#740 S7)", () => {
  const { root, global, project } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    const file = join(project, ".pi", "agentic-workflow.jsonc");
    writeFileSync(file, '{ "memory": { "engram": true, "ghost": 1 }, "advance": { "iterationsCap": "twelve", "sensitivePaths": [] } }');
    const strict = run(["validate", "--scope", "project", "--project", project, "--global-dir", global]);
    assert.equal(strict.status, 2);
    assert.match(strict.stderr, /memory\.ghost/);
    assert.match(strict.stderr, /advance\.iterationsCap/);

    const sanitized = run(["validate", "--sanitize", "--scope", "project", "--project", project, "--global-dir", global]);
    assert.equal(sanitized.status, 0, sanitized.stderr);
    assert.deepEqual(readJsoncFile(file), { memory: { engram: true }, advance: { sensitivePaths: [] } });
    const again = run(["validate", "--scope", "project", "--project", project, "--global-dir", global]);
    assert.equal(again.status, 0, "the sanitized file validates");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a JSON5-only value is refused instead of silently written as null (#740 S5)", () => {
  const { root, global, project } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    const file = join(project, ".pi", "agentic-workflow.jsonc");
    writeFileSync(file, '{ "advance": { "iterationsCap": 12 } }\n');
    const refused = run(["set", "advance.iterationsCap", "1e999", "--project", project, "--global-dir", global]);
    assert.equal(refused.status, 2, "a non-finite value is an INVALID refusal");
    assert.match(refused.stderr, /CONFIG REFUSAL/);
    assert.match(refused.stderr, /finite/u);
    assert.equal(readFileSync(file, "utf8").includes("null"), false);
    assert.equal(readJsoncFile(file).advance.iterationsCap, 12, "the file keeps its bytes");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a drop-in extension descriptor is read by stem from any of the three extensions (#740 S2)", () => {
  const { root, global, project } = fixture();
  try {
    const dir = join(project, "config-extensions");
    mkdirSync(dir, { recursive: true });
    const descriptor = {
      contract: "config-extension@1",
      key: "demo",
      file: "demo",
      description: "a drop-in section",
      schema: { type: "object", additionalProperties: false, properties: { level: { type: "string" } } },
      defaults: { level: "low" },
    };
    writeFileSync(join(dir, "demo.jsonc"), `// a JSON5 descriptor\n${JSON.stringify(descriptor, null, 2)}\n`);
    const listed = run(["list", "--project", project, "--global-dir", global, "--json"]);
    assert.equal(listed.status, 0, listed.stderr);
    assert.equal(JSON.parse(listed.stdout).some((node) => node.path === "demo.level" && node.category === "pi"), true);

    writeFileSync(join(dir, "demo.json"), JSON.stringify({ ...descriptor, description: "shadowed" }));
    const shadowed = run(["list", "--project", project, "--global-dir", global, "--json"]);
    assert.equal(shadowed.status, 0, shadowed.stderr);
    assert.deepEqual(
      JSON.parse(shadowed.stdout).filter((node) => node.path === "demo.level").length,
      1,
      "one descriptor per stem: the .json candidate wins silently",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
