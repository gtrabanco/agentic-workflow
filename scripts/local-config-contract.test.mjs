// local-config-contract.test.mjs — the repository's OWN config obeys the schema.
//
// This checkout carries committed config, and the reader is silent about a
// section nobody declares: `resolveConfigDocuments` validates only the sections
// the registry names, so a file carrying a retired or misspelled top-level key
// resolves to the shipped defaults with no error at all. That is how a
// hand-committed `guards` key (retired by issue #626) sat in
// `.pi/agentic-workflow.json` while every test read it as "unconfigured".
//
// Two files, two owners, one check: the base file's sections come from the
// schema package's registry, and the extension file's from the descriptor the
// package ships. An unknown top-level key, a value the section schema refuses,
// or a file that is not JSONC fails here instead of silently falling back.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const schema = await import(join(root, "packages", "agentic-workflow-schema", "dist", "index.js"));

/** One committed config file, read the way the runtime reads it (JSONC). */
function readConfig(relPath) {
  const text = readFileSync(join(root, relPath), "utf8");
  const parsed = schema.parseJsonc(text);
  assert.equal(parsed.ok, true, `${relPath} must be valid JSONC (${parsed.ok ? "" : JSON.stringify(parsed.error)})`);
  return parsed.value;
}

/** The base file's every key must be a declared section, and every value valid. */
test("the committed base config declares only published sections, and each value is valid", () => {
  const document = readConfig(".pi/agentic-workflow.json");
  const declared = new Set(schema.BASE_CONFIG_SECTIONS.map((section) => section.key));
  const unknown = Object.keys(document).filter((key) => !declared.has(key));
  assert.deepEqual(
    unknown,
    [],
    `unknown top-level section(s) in .pi/agentic-workflow.json: ${unknown.join(", ")} — the reader ignores them and the project silently runs the shipped default`,
  );
  for (const section of schema.BASE_CONFIG_SECTIONS) {
    if (document[section.key] === undefined) continue;
    assert.deepEqual(
      schema.validateSectionValue(section, document[section.key]),
      [],
      `${section.key} in .pi/agentic-workflow.json must satisfy its published schema`,
    );
  }
});

/** The extension file is the `pi` section's; its owner is the package descriptor. */
test("the committed extension config declares only the package's published keys", () => {
  const document = readConfig(".pi/pi-agentic-workflow.json");
  const descriptor = JSON.parse(
    readFileSync(join(root, "packages", "pi-agentic-workflow", "agentic-workflow.config.json"), "utf8"),
  );
  assert.equal(descriptor.contract, "config-extension@1", "the descriptor the check reads is the published contract");
  const declared = new Set(Object.keys(descriptor.schema.properties ?? {}));
  const unknown = Object.keys(document).filter((key) => !declared.has(key));
  assert.deepEqual(unknown, [], `unknown key(s) in .pi/pi-agentic-workflow.json: ${unknown.join(", ")}`);
  assert.deepEqual(
    schema.validateJsonSchema(descriptor.schema, document, descriptor.key),
    [],
    `.pi/pi-agentic-workflow.json must satisfy the package's own descriptor`,
  );
});

/** The one fact this repository configures for itself has to keep its meaning. */
test("the repository's own guard posture survives a config edit", () => {
  const document = readConfig(".pi/agentic-workflow.json");
  if (document.guard === undefined) return;
  const resolved = schema.normalizeGuard(document.guard);
  assert.ok(
    ["allow", "deny", "ask"].includes(resolved.gitIdentity),
    `the identity guard resolves to a published disposition, got ${JSON.stringify(resolved.gitIdentity)}`,
  );
});
