// test-obligation: protects=packages/agentic-workflow/src/config/materialize.mjs obligations=config-materialization,merge,backup,idempotency,extension-discovery,failure-path
//
// config-materialize.test.mjs — the `config default` engine (issue #600).
//
// The engine is the one writer that materializes explicit defaults, so every
// case runs it against a throwaway project and reads the bytes it produced: the
// value set, the comment lines, the backup copy and the second run's stability.
// Nothing here runs the engine against the live checkout.

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { BASE_CONFIG_SECTIONS, parseJsonc, resolveConfigDocuments } from "@gtrabanco/agentic-workflow-schema";

import { configDivergence, materializeConfig, renderConfigFile } from "../src/config/materialize.mjs";
import { readConfigDocument } from "../src/config/store.mjs";

const AT = new Date("2026-11-21T01:30:00Z");

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "aw-config-materialize-"));
  return { root, global: join(root, "global"), project: join(root, "project"), projectFile: join(root, "project", ".pi", "agentic-workflow.json") };
}

/** The file is JSONC: comments are the point, so every read parses JSONC. */
function readJsonc(path) {
  const parsed = parseJsonc(readFileSync(path, "utf8"));
  assert.equal(parsed.ok, true, `the materialized file parses: ${JSON.stringify(parsed.error ?? {})}`);
  return parsed.value;
}

function baseDefaults() {
  const config = {};
  for (const section of BASE_CONFIG_SECTIONS) config[section.key] = structuredClone(section.defaults);
  return config;
}

function extension(root, descriptor = {}) {
  const pkg = join(root, "project", "node_modules", "@gtrabanco", "demo-config");
  mkdirSync(pkg, { recursive: true });
  writeFileSync(join(pkg, "package.json"), JSON.stringify({ name: "demo-config", agenticWorkflow: { config: "./agentic-workflow.config.json" } }));
  writeFileSync(
    join(pkg, "agentic-workflow.config.json"),
    JSON.stringify({
      contract: "config-extension@1",
      key: "demo",
      file: "demo.json",
      description: "demo package config",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          alpha: { type: "string", description: "The alpha switch the demo package reads." },
          beta: {
            type: "object",
            additionalProperties: false,
            properties: { gamma: { type: "integer", description: "The gamma ceiling." } },
          },
          optional: { type: "string" },
        },
      },
      defaults: { alpha: "a", beta: { gamma: 3 } },
      ...descriptor,
    }),
  );
  return join(root, "project", ".pi", "demo.json");
}

test("a fresh scope writes every base section explicitly, with a comment per key", () => {
  const { root, global, project, projectFile } = fixture();
  try {
    const receipt = materializeConfig({ projectDir: project, globalDir: global, scope: "project", now: AT });
    assert.equal(receipt.contract, "config-materialize@1");
    const file = receipt.files.find((entry) => entry.file === "agentic-workflow.json");
    assert.equal(file.existed, false);
    assert.equal(file.written, true);
    assert.equal(file.backup, null, "nothing exists, so there is nothing to back up");

    const text = readFileSync(projectFile, "utf8");
    const parsed = readJsonc(projectFile);
    assert.deepEqual(parsed, baseDefaults(), "every declared section is explicit");
    // Each materialized key names itself, its type and its shipped default.
    for (const key of ["logSession.enabled", "memory.engram", "telemetry.enabled", "advance.iterationsCap", "guard.default", "pathProtection.protectedGlobs"]) {
      assert.match(text, new RegExp(`// ${key.replaceAll(".", "\\.")}\\b`), `the comment documents ${key}`);
    }
    assert.match(text, /shipped default/);
    assert.match(text, /type: boolean/);
    // The file resolves to exactly what an absent file resolves to.
    assert.deepEqual(readConfigDocument(projectFile).value, parsed);
    assert.equal(file.materialized.includes("memory.engram"), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("merge preserves user values and drops schema-absent keys", () => {
  const { root, global, project, projectFile } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    writeFileSync(
      projectFile,
      JSON.stringify({ logSession: { enabled: true }, memory: { engram: true, ghost: 1 }, guards: { merge: false } }),
    );
    const receipt = materializeConfig({ projectDir: project, globalDir: global, scope: "project", now: AT });
    const file = receipt.files.find((entry) => entry.file === "agentic-workflow.json");
    const parsed = readJsonc(projectFile);
    assert.equal(parsed.logSession.enabled, true, "a user value is never overwritten by its default");
    assert.equal(parsed.logSession.publisher, null, "an undefined key gains its explicit default");
    assert.deepEqual(parsed.memory, { engram: true }, "an unknown leaf is dropped");
    assert.equal(parsed.guards, undefined, "a removed section is dropped");
    assert.equal(file.removed.includes("memory.ghost"), true);
    assert.equal(file.removed.includes("guards"), true);
    assert.equal(file.materialized.includes("logSession.publisher"), true);
    assert.equal(file.materialized.includes("logSession.enabled"), false, "a defined key is not re-materialized");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("resolution parity: a materialized file resolves exactly like an absent one", () => {
  const fixtureA = fixture();
  const fixtureB = fixture();
  try {
    materializeConfig({ projectDir: fixtureA.project, globalDir: fixtureA.global, scope: "project", now: AT });
    const materialized = readConfigDocument(fixtureA.projectFile).value;
    const empty = resolveConfigDocuments({ sections: BASE_CONFIG_SECTIONS, global: {}, project: {} });
    const resolved = resolveConfigDocuments({ sections: BASE_CONFIG_SECTIONS, global: {}, project: { "agentic-workflow.json": materialized } });
    assert.deepEqual(resolved.config, empty.config);
    assert.deepEqual(resolved.issues, []);
    // Same for a partially written file with a user override.
    mkdirSync(join(fixtureB.project, ".pi"), { recursive: true });
    writeFileSync(fixtureB.projectFile, JSON.stringify({ logSession: { enabled: true } }));
    materializeConfig({ projectDir: fixtureB.project, globalDir: fixtureB.global, scope: "project", now: AT });
    const partial = readConfigDocument(fixtureB.projectFile).value;
    const partialResolved = resolveConfigDocuments({ sections: BASE_CONFIG_SECTIONS, global: {}, project: { "agentic-workflow.json": partial } });
    const userOnly = resolveConfigDocuments({ sections: BASE_CONFIG_SECTIONS, global: {}, project: { "agentic-workflow.json": { logSession: { enabled: true } } } });
    assert.deepEqual(partialResolved.config, userOnly.config);
  } finally {
    rmSync(fixtureA.root, { recursive: true, force: true });
    rmSync(fixtureB.root, { recursive: true, force: true });
  }
});

test("backup before modification: the copy carries the pre-run bytes", () => {
  const { root, global, project, projectFile } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    const before = '{ "memory": { "engram": true, "ghost": 1 } }';
    writeFileSync(projectFile, before);
    const receipt = materializeConfig({ projectDir: project, globalDir: global, scope: "project", now: AT });
    const file = receipt.files.find((entry) => entry.file === "agentic-workflow.json");
    assert.ok(file.backup, "a backup path is reported");
    assert.match(file.backup, /agentic-workflow\.json\.bak-20261121T013000Z$/u);
    assert.equal(readFileSync(file.backup, "utf8"), before, "the backup is the file as it was");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("second run is a no-op: identical bytes and no second backup", () => {
  const { root, global, project, projectFile } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    writeFileSync(projectFile, JSON.stringify({ memory: { engram: true } }));
    materializeConfig({ projectDir: project, globalDir: global, scope: "project", now: AT });
    const first = readFileSync(projectFile, "utf8");
    const backups = readdirSync(join(project, ".pi")).filter((name) => name.includes(".bak-"));
    assert.equal(backups.length, 1, "the first run backed the existing file up once");
    const second = materializeConfig({ projectDir: project, globalDir: global, scope: "project", now: new Date("2026-11-21T02:00:00Z") });
    const file = second.files.find((entry) => entry.file === "agentic-workflow.json");
    assert.equal(file.written, false, "no byte changed");
    assert.equal(file.backup, null, "an unmodified file is not backed up");
    assert.equal(readFileSync(projectFile, "utf8"), first);
    assert.deepEqual(file.materialized, []);
    assert.deepEqual(file.removed, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("extension file follows discovery: its own schema and defaults drive the file", () => {
  const { root, global, project } = fixture();
  try {
    const extensionFile = extension(root);
    const receipt = materializeConfig({ projectDir: project, globalDir: global, scope: "project", now: AT });
    const file = receipt.files.find((entry) => entry.file === "demo.json");
    assert.ok(file, "the discovered extension file is materialized");
    const text = readFileSync(extensionFile, "utf8");
    assert.deepEqual(readJsonc(extensionFile), { alpha: "a", beta: { gamma: 3 } }, "the schema-only key is documented, never written");
    assert.match(text, /\/\/ demo\.alpha — The alpha switch the demo package reads\./);
    assert.match(text, /\/\/ demo\.optional\b/);
    assert.match(text, /\/\/ demo\.beta\.gamma — The gamma ceiling\./);

    // The package is uninstalled: discovery yields nothing and the file is left alone.
    rmSync(join(project, "node_modules"), { recursive: true, force: true });
    const before = readFileSync(extensionFile, "utf8");
    const again = materializeConfig({ projectDir: project, globalDir: global, scope: "project", now: AT });
    assert.equal(again.files.some((entry) => entry.file === "demo.json"), false);
    assert.equal(readFileSync(extensionFile, "utf8"), before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("refuses a broken file and never rewrites it", () => {
  const { root, global, project, projectFile } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    const broken = '{ "logSession": ';
    writeFileSync(projectFile, broken);
    assert.throws(
      () => materializeConfig({ projectDir: project, globalDir: global, scope: "project", now: AT }),
      (error) => error.code === "PARSE",
    );
    assert.equal(readFileSync(projectFile, "utf8"), broken);
    assert.equal(readdirSync(join(project, ".pi")).some((name) => name.includes(".bak-")), false, "a refused run takes no backup");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("refuses an invalid merge and leaves the file untouched", () => {
  const { root, global, project, projectFile } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    const before = { memory: { engram: "yes" } };
    writeFileSync(projectFile, JSON.stringify(before));
    assert.throws(
      () => materializeConfig({ projectDir: project, globalDir: global, scope: "project", now: AT }),
      (error) => error.code === "INVALID" && error.issues.length > 0,
    );
    assert.deepEqual(readJsonc(projectFile), before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("no-backup skips the copy and still writes", () => {
  const { root, global, project, projectFile } = fixture();
  try {
    mkdirSync(join(project, ".pi"), { recursive: true });
    writeFileSync(projectFile, JSON.stringify({ memory: { engram: true } }));
    const receipt = materializeConfig({ projectDir: project, globalDir: global, scope: "project", backup: false, now: AT });
    const file = receipt.files.find((entry) => entry.file === "agentic-workflow.json");
    assert.equal(file.written, true);
    assert.equal(file.backup, null);
    assert.equal(readdirSync(join(project, ".pi")).some((name) => name.includes(".bak-")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("divergence names the new options and the removed keys", () => {
  const { root, global, project, projectFile } = fixture();
  try {
    const absent = configDivergence({ projectDir: project, globalDir: global, scope: "project" });
    assert.equal(absent.files.find((entry) => entry.file === "agentic-workflow.json").exists, false);

    mkdirSync(join(project, ".pi"), { recursive: true });
    writeFileSync(projectFile, JSON.stringify({ logSession: { enabled: true }, guards: { merge: false } }));
    const diverged = configDivergence({ projectDir: project, globalDir: global, scope: "project" });
    const row = diverged.files.find((entry) => entry.file === "agentic-workflow.json");
    assert.equal(row.exists, true);
    assert.equal(row.converged, false);
    assert.equal(row.missing.includes("logSession.publisher"), true);
    assert.equal(row.missing.includes("memory.engram"), true);
    assert.equal(row.removed.includes("guards"), true);

    materializeConfig({ projectDir: project, globalDir: global, scope: "project", now: AT });
    const converged = configDivergence({ projectDir: project, globalDir: global, scope: "project" });
    const after = converged.files.find((entry) => entry.file === "agentic-workflow.json");
    assert.deepEqual(after.missing, []);
    assert.deepEqual(after.removed, []);
    assert.equal(after.converged, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the renderer is deterministic and documents the schema's own description", () => {
  const sections = BASE_CONFIG_SECTIONS;
  const document = baseDefaults();
  const first = renderConfigFile(sections, document);
  const second = renderConfigFile(sections, JSON.parse(JSON.stringify(document)));
  assert.equal(first, second);
  assert.match(first, /\/\/ logSession\.enabled — Append the mechanical entry to docs\/LOGS\.md\./);
  assert.match(first, /\/\/ logSession\.publisher\.command\b/);
  assert.match(first, /type: array/);
});
