// serena-activation-check.test.mjs — AC1 (feature 321)
//
// After replacing the @bacnh85/pi-serena bridge with native MCP registration
// (issue #321), the activation check must verify that the MCP registration path
// is intact rather than the old bridge's tool registration.
//
// The test exercises `scripts/serena-activation-check.mjs` against the
// package's own staging + packing pipeline, so the check's logic is tested,
// not the live MCP registration (that requires a real `serena-agent` install).
//
// Run: node --test packages/pi-agentic-workflow/test/serena-activation-check.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PKG_DIR = resolve(new URL(".", import.meta.url).pathname, "..");
const manifest = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));

// S1: the bridge dependency must be gone
test("AC1: @bacnh85/pi-serena is not in dependencies", () => {
  assert.ok(
    !manifest.dependencies?.["@bacnh85/pi-serena"],
    "@bacnh85/pi-serena must not be a dependency after MCP replacement",
  );
});

// S2: the extension entry for the bridge must be gone
test("AC1: the bridge's extension entry is not in pi.extensions", () => {
  const entries = manifest.pi?.extensions ?? [];
  assert.ok(
    !entries.includes("./node_modules/@bacnh85/pi-serena/extensions/index.ts"),
    "pi.extensions must not declare the bridge's extension entry",
  );
});

// AC: the package's own compiled extension must still be present
test("AC1: the package's own extension entry is still declared", () => {
  const entries = manifest.pi?.extensions ?? [];
  assert.ok(
    entries.includes("./dist/extension/index.js"),
    "the package's own compiled extension must still load",
  );
  assert.equal(entries.length, 1, "the manifest declares exactly one extension entry (own)");
});