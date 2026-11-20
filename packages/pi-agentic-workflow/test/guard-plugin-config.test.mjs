// guard-plugin-config.test.mjs — the `guardPlugins` config section (issue #654,
// S6 bullet 3 / S9 / S11).
//
// A project declares its own guards here, in the pi extension file, and the
// section is the ONE authoring surface: the plugin's own policy file is a
// projection of it (`provision permissions`), never a second place to write the
// same claim. What this suite pins: the strict validator (a typo is refused by
// name, never merged), the project-over-global merge at the documented
// granularity, the shipped default, and the published descriptor.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseConfigFile } from "../dist/config/schema.js";
import { mergeConfigs } from "../dist/config/merge.js";
import { DEFAULT_CONFIG, DEFAULT_PI_CONFIG } from "../dist/config/defaults.js";
import { PI_CONFIG_EXTENSION } from "../dist/config/extension.js";

const DENY_ENV = {
  kind: "deterministic",
  surface: "path",
  rules: [{ match: "**/.env", verdict: "deny", reason: "secrets" }],
};

const valid = (json, label) => {
  const result = parseConfigFile(json);
  assert.equal(result.ok, true, `${label}: expected valid, got ${JSON.stringify(result.issues)}`);
  return result.config;
};

const refused = (json, needle, label) => {
  const result = parseConfigFile(json);
  assert.equal(result.ok, false, `${label}: expected a refusal`);
  const text = JSON.stringify(result.issues);
  assert.ok(text.includes(needle), `${label}: expected an issue naming ${needle}, got ${text}`);
};

/* ------------------------------------------------------------ the section */

test("a declaration parses, and the section's own switch is optional", () => {
  const parsed = valid(JSON.stringify({ guardPlugins: { guards: { "no-dotenv": DENY_ENV } } }), "guards only");
  assert.deepEqual(parsed.guardPlugins.guards["no-dotenv"], DENY_ENV);
  assert.equal(parsed.guardPlugins.enabled, undefined, "an absent switch is not invented by the parser");

  const off = valid(JSON.stringify({ guardPlugins: { enabled: false, guards: { "no-dotenv": DENY_ENV } } }), "explicit off");
  assert.equal(off.guardPlugins.enabled, false);
});

test("an unknown key, an unknown kind and an unknown surface are refused by name", () => {
  refused('{"guardPlugins": {"on": true}}', "$.guardPlugins.on", "unknown section key");
  refused('{"guardPlugins": {"enabled": "yes"}}', "$.guardPlugins.enabled", "non-boolean switch");
  refused('{"guardPlugins": {"guards": {"g": {"kind": "judge", "surface": "path", "rules": [{"match": "*"}]}}}}', "kind", "unknown kind");
  refused('{"guardPlugins": {"guards": {"g": {"kind": "deterministic", "surface": "network", "rules": [{"match": "*"}]}}}}', "surface", "unknown surface");
  refused('{"guardPlugins": {"guards": {"g": {"kind": "deterministic", "surface": "path", "rules": []}}}}', "rules", "empty rules");
  refused('{"guardPlugins": {"guards": {"g": {"kind": "deterministic", "surface": "path", "rules": [{"match": "*", "verdict": "maybe"}]}}}}', "verdict", "unknown verdict");
  refused('{"guardPlugins": {"guards": {"g": {"kind": "deterministic", "surface": "path", "rules": [{"match": "*", "then": "deny"}]}}}}', "then", "unknown rule key");
  refused('{"guardPlugins": {"guards": {"No Dotenv": {"kind": "deterministic", "surface": "path", "rules": [{"match": "*"}]}}}}', "guard name", "malformed guard name");
});

/* ---------------------------------------------------------------- merging */

test("the shipped default is an empty, enabled section", () => {
  assert.deepEqual(DEFAULT_PI_CONFIG.guardPlugins, { enabled: true, guards: {} });
  assert.deepEqual(DEFAULT_CONFIG.guardPlugins, { enabled: true, guards: {} });
  assert.deepEqual(mergeConfigs({}, {}).guardPlugins, { enabled: true, guards: {} });
});

test("enabled resolves project-over-global, field by field", () => {
  assert.equal(mergeConfigs({ guardPlugins: { enabled: false } }, {}).guardPlugins.enabled, false);
  assert.equal(mergeConfigs({ guardPlugins: { enabled: false } }, { guardPlugins: { enabled: true } }).guardPlugins.enabled, true);
  assert.equal(mergeConfigs({ guardPlugins: { enabled: true } }, { guardPlugins: {} }).guardPlugins.enabled, true, "an absent project field keeps the global one");
});

test("guards merge per name: a project declaration replaces the global one wholesale", () => {
  const globalFile = { guardPlugins: { guards: { "no-dotenv": DENY_ENV } } };
  const projectFile = {
    guardPlugins: {
      guards: {
        "no-dotenv": { kind: "deterministic", surface: "path", rules: [{ match: "*", verdict: "allow" }] },
        "scratch": { kind: "deterministic", surface: "bash", rules: [{ match: "rm -rf *", verdict: "deny" }] },
      },
    },
  };
  const merged = mergeConfigs(globalFile, projectFile).guardPlugins;
  assert.deepEqual(Object.keys(merged.guards).sort(), ["no-dotenv", "scratch"], "the project's declaration joins, the global one it replaces does not survive");
  assert.equal(merged.guards["no-dotenv"].rules.length, 1);
  assert.equal(merged.guards["no-dotenv"].rules[0].verdict, "allow", "the rule list is one ordered policy, replaced whole");
});

/* ------------------------------------------------------------- descriptor */

test("the published descriptor offers the section, closed at every level", () => {
  const schema = PI_CONFIG_EXTENSION.schema.properties.guardPlugins;
  assert.ok(schema, "the descriptor publishes guardPlugins");
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.guards.additionalProperties.additionalProperties, false, "a declaration admits no extra key");
  assert.equal(schema.properties.guards.additionalProperties.properties.rules.items.additionalProperties, false, "a rule admits no extra key");
  assert.deepEqual(PI_CONFIG_EXTENSION.defaults.guardPlugins, { enabled: true, guards: {} });
});
