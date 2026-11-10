// config-schema-artifact.test.mjs — the committed `config.schema.json` is the
// generator's output (issue #427 M3). A hand-edited projection is a defect.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { BASE_CONFIG_SECTIONS, composeConfigSchema } from "../dist/index.js";

test("the committed config.schema.json is exactly the generated projection", () => {
  const committed = JSON.parse(readFileSync(new URL("../config.schema.json", import.meta.url), "utf8"));
  assert.deepEqual(committed, JSON.parse(JSON.stringify(composeConfigSchema(BASE_CONFIG_SECTIONS))));
});

test("the published schema names every base section and refuses unknown ones", () => {
  const committed = JSON.parse(readFileSync(new URL("../config.schema.json", import.meta.url), "utf8"));
  assert.deepEqual(Object.keys(committed.properties).sort(), BASE_CONFIG_SECTIONS.map((section) => section.key).sort());
  assert.equal(committed.additionalProperties, false);
});
