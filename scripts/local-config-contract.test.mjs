// test-obligation: protects=packages/agentic-workflow-schema/src/config.ts obligations=contract,failure-path

// local-config-contract.test.mjs — the repository's OWN config obeys the schema.
//
// This checkout carries committed config, and the reader is silent about a
// section nobody declares: `resolveConfigDocuments` validates only the sections
// the registry names, so a file carrying a retired or misspelled top-level key
// resolves to the shipped defaults with no error at all. That is how a
// hand-committed `guards` key (retired by issue #626) sat in the repository's
// config while every test read it as "unconfigured".
//
// Two files, two owners, one check: the base file's sections come from the
// schema package's registry, and the extension file's from the descriptor the
// package ships. An unknown top-level key, a value the section schema refuses,
// or a file that is not JSON5 fails here instead of silently falling back.
//
// Issue #740 S4: the files are located by stem (`.json`, `.jsonc`, `.json5`,
// first existing wins) and this repository commits the middle extension, so the
// resolution rule itself is exercised on the real tree.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const projectConfigDir = join(root, ".pi");
const PI_STEM = "pi-agentic-workflow";

const schema = await import(join(root, "packages", "agentic-workflow-schema", "dist", "index.js"));

/** The file a stem occupies in the committed project scope, by the runtime's own rule. */
function resolveCommitted(stem) {
  return schema.resolveConfigFileName(stem, (name) => existsSync(join(projectConfigDir, name)));
}

/** One committed config file, read the way the runtime reads it (JSON5). */
function readConfig(stem) {
  const name = resolveCommitted(stem);
  const path = join(projectConfigDir, name);
  const parsed = schema.parseJsonc(readFileSync(path, "utf8"));
  assert.equal(parsed.ok, true, `.pi/${name} must be valid JSON5 (${parsed.ok ? "" : JSON.stringify(parsed.error)})`);
  return { name, value: parsed.value };
}

test("the committed configs resolve by stem, and the middle extension is the one committed", () => {
  assert.deepEqual(schema.configFileCandidates(schema.BASE_CONFIG_STEM), [
    "agentic-workflow.json",
    "agentic-workflow.jsonc",
    "agentic-workflow.json5",
  ]);
  assert.equal(resolveCommitted(schema.BASE_CONFIG_STEM), "agentic-workflow.jsonc");
  assert.equal(resolveCommitted(PI_STEM), "pi-agentic-workflow.jsonc");
});

/** The base file's every key must be a declared section, and every value valid. */
test("the committed base config declares only published sections, and each value is valid", () => {
  const { name, value: document } = readConfig(schema.BASE_CONFIG_STEM);
  const declared = new Set(schema.BASE_CONFIG_SECTIONS.map((section) => section.key));
  const unknown = Object.keys(document).filter((key) => !declared.has(key));
  assert.deepEqual(
    unknown,
    [],
    `unknown top-level section(s) in .pi/${name}: ${unknown.join(", ")} — the reader ignores them and the project silently runs the shipped default`,
  );
  for (const section of schema.BASE_CONFIG_SECTIONS) {
    if (document[section.key] === undefined) continue;
    assert.deepEqual(
      schema.validateSectionValue(section, document[section.key]),
      [],
      `${section.key} in .pi/${name} must satisfy its published schema`,
    );
  }
});

/** The extension file is the `pi` section's; its owner is the package descriptor. */
test("the committed extension config declares only the package's published keys", () => {
  const { name, value: document } = readConfig(PI_STEM);
  const descriptor = JSON.parse(
    readFileSync(join(root, "packages", "pi-agentic-workflow", "agentic-workflow.config.json"), "utf8"),
  );
  assert.equal(descriptor.contract, "config-extension@1", "the descriptor the check reads is the published contract");
  const declared = new Set(Object.keys(descriptor.schema.properties ?? {}));
  const unknown = Object.keys(document).filter((key) => !declared.has(key));
  assert.deepEqual(unknown, [], `unknown key(s) in .pi/${name}: ${unknown.join(", ")}`);
  assert.deepEqual(
    schema.validateJsonSchema(descriptor.schema, document, descriptor.key),
    [],
    `.pi/${name} must satisfy the package's own descriptor`,
  );
});

/** The one fact this repository configures for itself has to keep its meaning. */
test("the repository's own guard posture survives a config edit", () => {
  const { value: document } = readConfig(schema.BASE_CONFIG_STEM);
  if (document.guard === undefined) return;
  const resolved = schema.normalizeGuard(document.guard);
  assert.ok(
    ["allow", "deny", "ask"].includes(resolved.gitIdentity),
    `the identity guard resolves to a published disposition, got ${JSON.stringify(resolved.gitIdentity)}`,
  );
});
