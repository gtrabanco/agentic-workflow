// config-extension.test.mjs — the pi section's published descriptor (issue #427).
//
// The CLI discovers `agentic-workflow.config.json`; this suite pins it to the
// module the extension actually validates with, so a schema edit cannot ship a
// descriptor that disagrees with the runtime.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PI_CONFIG_EXTENSION } from "../dist/config/extension.js";

test("the committed descriptor is byte-equal to the module's published section", () => {
  const committed = JSON.parse(readFileSync(new URL("../agentic-workflow.config.json", import.meta.url), "utf8"));
  assert.deepEqual(committed, PI_CONFIG_EXTENSION);
});

test("the section is package-specific and names its own file", () => {
  assert.equal(PI_CONFIG_EXTENSION.contract, "config-extension@1");
  assert.equal(PI_CONFIG_EXTENSION.key, "pi");
  assert.equal(PI_CONFIG_EXTENSION.file, "pi-agentic-workflow.json");
  assert.equal(PI_CONFIG_EXTENSION.schema.additionalProperties, false);
  assert.equal(PI_CONFIG_EXTENSION.defaults.default.model, "inherit");
});
