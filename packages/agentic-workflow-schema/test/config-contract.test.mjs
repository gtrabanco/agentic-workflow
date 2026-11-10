// config-contract.test.mjs — the unified config machine contract (issue #427).
//
// The contract owns four things and nothing else:
//   - the base feature section registry (keys, categories, defaults, schemas);
//   - strict validation of one section value (no coercion, unknown keys refused);
//   - fill-in resolution (defaults fill only UNDEFINED keys; project over global);
//   - the extension descriptor contract a package ships to publish its own section.

import assert from "node:assert/strict";
import test from "node:test";

import {
  BASE_CONFIG_SECTIONS,
  CONFIG_EXTENSION_CONTRACT,
  composeConfigSchema,
  fillDefaults,
  normalizeLogSession,
  resolveConfigDocuments,
  sanitizeSectionValue,
  validateConfigExtension,
  validateSectionValue,
} from "../dist/index.js";

const section = (key) => BASE_CONFIG_SECTIONS.find((entry) => entry.key === key);

test("the base registry carries the feature sections the issue names", () => {
  const keys = BASE_CONFIG_SECTIONS.map((entry) => entry.key);
  assert.deepEqual(keys, ["logSession", "memory", "telemetry", "guards", "advance", "pathProtection"]);
  for (const entry of BASE_CONFIG_SECTIONS) {
    assert.equal(entry.category, "feature");
    assert.equal(entry.file, "agentic-workflow.json");
    assert.ok(entry.description.length > 0);
    assert.equal(typeof entry.schema, "object");
  }
});

test("logSession accepts the boolean-like values and the publisher object", () => {
  for (const value of [false, true, 0, 1, "off", "on"]) {
    assert.deepEqual(validateSectionValue(section("logSession"), value), []);
  }
  assert.deepEqual(
    validateSectionValue(section("logSession"), { publisher: { command: ["curl", "-sS", "https://example.test"], timeoutMs: 5000 } }),
    [],
  );
  assert.deepEqual(validateSectionValue(section("logSession"), { enabled: true, publisher: { command: ["tee"] } }), []);
  assert.equal(validateSectionValue(section("logSession"), "mechanical").length, 1);
  assert.equal(validateSectionValue(section("logSession"), { publisher: { command: [] } }).length, 1);
  assert.equal(validateSectionValue(section("logSession"), { publisher: { nope: true } }).length, 1);
});

test("logSession normalizes to the effective pair", () => {
  assert.deepEqual(normalizeLogSession(true), { enabled: true, publisher: null });
  assert.deepEqual(normalizeLogSession("off"), { enabled: false, publisher: null });
  assert.deepEqual(normalizeLogSession({ publisher: { command: ["sink"] } }), {
    enabled: false,
    publisher: { command: ["sink"], timeoutMs: 5000 },
  });
  assert.deepEqual(normalizeLogSession({ enabled: true, publisher: { command: ["sink"], timeoutMs: 10 } }), {
    enabled: true,
    publisher: { command: ["sink"], timeoutMs: 10 },
  });
});

test("unknown keys are refused and named by path", () => {
  const issues = validateSectionValue(section("memory"), { engram: true, other: 1 });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].path, "memory.other");
  assert.match(issues[0].message, /unknown/i);
});

test("no coercion: a string where a boolean belongs is refused", () => {
  const issues = validateSectionValue(section("telemetry"), { enabled: "yes" });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].path, "telemetry.enabled");
});

test("guards validates its booleans and the token ceiling", () => {
  assert.deepEqual(validateSectionValue(section("guards"), { merge: true, history: false, ci: true, cost: { maxTokens: 500000 } }), []);
  assert.equal(validateSectionValue(section("guards"), { cost: { maxTokens: 0 } }).length, 1);
  assert.equal(validateSectionValue(section("guards"), { merge: "yes" }).length, 1);
});

test("advance validates its knobs and paths", () => {
  assert.deepEqual(
    validateSectionValue(section("advance"), {
      iterationsCap: 12,
      sensitivePaths: ["secrets/**"],
      securityPaths: ["auth/**"],
      runLogPath: ".agentic-workflow/advance-run.log",
    }),
    [],
  );
  assert.equal(validateSectionValue(section("advance"), { iterationsCap: 0 }).length, 1);
  assert.equal(validateSectionValue(section("advance"), { runLogPath: 7 }).length, 1);
});

test("pathProtection validates only the tighten-only override shape", () => {
  assert.deepEqual(
    validateSectionValue(section("pathProtection"), {
      protectedGlobs: ["**/*.secret"],
      requirements: { "post-freeze": { modify: "approval" } },
    }),
    [],
  );
  assert.equal(validateSectionValue(section("pathProtection"), { requirements: { "post-freeze": { modify: "weak" } } }).length, 1);
  assert.equal(validateSectionValue(section("pathProtection"), { protectedGlobs: [7] }).length, 1);
});

test("fillDefaults fills only undefined keys", () => {
  assert.deepEqual(fillDefaults({ enabled: false }, { enabled: true, publisher: null }), {
    enabled: false,
    publisher: null,
  });
  // A defined object key is not deep-merged with the default object.
  assert.deepEqual(fillDefaults({ cost: { maxTokens: 1 } }, { merge: false, cost: { maxTokens: 500000, window: 3 } }), {
    merge: false,
    cost: { maxTokens: 1 },
  });
});

test("resolution is feature-by-feature, project over global, defaults for absent keys", () => {
  const resolved = resolveConfigDocuments({
    sections: BASE_CONFIG_SECTIONS,
    global: {
      "agentic-workflow.json": {
        logSession: { publisher: { command: ["global-sink"] } },
        memory: { engram: true },
      },
    },
    project: {
      "agentic-workflow.json": {
        logSession: { enabled: true },
        telemetry: { enabled: true },
      },
    },
  });
  assert.equal(resolved.ok, true);
  assert.deepEqual(resolved.config.logSession, {
    enabled: true,
    publisher: { command: ["global-sink"], timeoutMs: 5000 },
  });
  assert.deepEqual(resolved.config.memory, { engram: true });
  assert.deepEqual(resolved.config.telemetry, { enabled: true });
  assert.deepEqual(resolved.config.guards, { merge: false, history: false, ci: false, cost: { maxTokens: 500000 } });
});

test("an invalid section is reported and the effective value is not invented", () => {
  const resolved = resolveConfigDocuments({
    sections: BASE_CONFIG_SECTIONS,
    global: {},
    project: { "agentic-workflow.json": { memory: { engram: "yes" } } },
  });
  assert.equal(resolved.ok, false);
  assert.equal(resolved.issues.length, 1);
  assert.equal(resolved.issues[0].path, "memory.engram");
  assert.deepEqual(resolved.config.memory, { engram: false });
});

test("sanitize removes unknown keys and reports their paths", () => {
  const sanitized = sanitizeSectionValue(section("memory"), { engram: true, ghost: 1 });
  assert.deepEqual(sanitized.value, { engram: true });
  assert.deepEqual(sanitized.removed, ["memory.ghost"]);
});

test("composeConfigSchema produces one object schema naming every section", () => {
  const schema = composeConfigSchema(BASE_CONFIG_SECTIONS);
  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(Object.keys(schema.properties).sort(), BASE_CONFIG_SECTIONS.map((entry) => entry.key).sort());
});

test("an extension descriptor is validated before it can extend the schema", () => {
  assert.deepEqual(validateConfigExtension({ contract: CONFIG_EXTENSION_CONTRACT, key: "pi", file: "pi-agentic-workflow.json", description: "pi", schema: { type: "object" }, defaults: {} }), []);
  assert.equal(validateConfigExtension({ contract: "nope", key: "pi", file: "x.json", description: "pi", schema: { type: "object" }, defaults: {} }).length, 1);
  assert.equal(validateConfigExtension({ contract: CONFIG_EXTENSION_CONTRACT, key: "memory", file: "x.json", description: "pi", schema: { type: "object" }, defaults: {} }).length, 1);
  assert.equal(validateConfigExtension({ contract: CONFIG_EXTENSION_CONTRACT, key: "pi", file: "x.json", description: "pi", schema: { type: "object" }, defaults: {} }).length, 0);
});

test("a section key may only be claimed once", () => {
  const resolved = resolveConfigDocuments({
    sections: BASE_CONFIG_SECTIONS,
    global: {},
    project: {},
    extensions: [
      { contract: CONFIG_EXTENSION_CONTRACT, key: "pi", file: "pi-agentic-workflow.json", description: "pi", schema: { type: "object" }, defaults: {} },
      { contract: CONFIG_EXTENSION_CONTRACT, key: "pi", file: "other.json", description: "pi again", schema: { type: "object" }, defaults: {} },
    ],
  });
  assert.equal(resolved.ok, false);
  assert.match(resolved.issues[0].message, /duplicate/i);
});
