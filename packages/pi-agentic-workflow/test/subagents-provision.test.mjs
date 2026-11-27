// test-obligation: protects=packages/pi-agentic-workflow/src/extension/subagents.ts,packages/pi-agentic-workflow/src/extension/subagents-entry.ts,packages/pi-agentic-workflow/package.json obligations=contract,distribution-contract,failure-path
// subagents-provision.test.mjs — issue #726, defect 2.
//
// `pi.extensions` entries are resolved by pi with `path.resolve(packageDir,
// entry)` and kept only when the file exists; a void path is dropped with no
// diagnostic. The dependency's `node_modules/pi-extensible-workflows/...` path
// only exists when npm nests dependencies, so a hoisted install loads no
// subagent layer and says nothing.
//
// The fix is a package-owned shim (`dist/extension/subagents-entry.js`) that
// resolves the dependency through Node's package algorithm, which survives both
// layouts. This suite proves the two layouts, the factory invocation, the one
// diagnostic on failure, and the manifest/README contract — the real
// `ui.notify` path is exercised by the adapter's session_start handler.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  SUBAGENTS_ENTRY_LABEL,
  provisionSubagents,
  resolveSubagentsEntry,
  subagentsDiagnostic,
} from "../dist/extension/subagents.js";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

/** Write a package-shaped tree; `layout` picks where the dependency lives. */
function fixture(t, { layout, factory = 'export default function factory(pi) { pi.registerTool({ name: "subagents_run" }); }\n', omitEntry = false, omitPackage = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-subagents-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const packageDir = join(root, "node_modules", "@gtrabanco", "pi-agentic-workflow");
  const extensionDir = join(packageDir, "dist", "extension");
  mkdirSync(extensionDir, { recursive: true });
  const from = pathToFileURL(join(extensionDir, "subagents-entry.js")).href;
  writeFileSync(join(extensionDir, "subagents-entry.js"), "// fixture shim\n");

  if (omitPackage) return { root, from };

  const dependencyDir = layout === "nested" ? join(packageDir, "node_modules", "pi-extensible-workflows") : join(root, "node_modules", "pi-extensible-workflows");
  mkdirSync(join(dependencyDir, "dist", "src"), { recursive: true });
  writeFileSync(join(dependencyDir, "package.json"), JSON.stringify({ name: "pi-extensible-workflows", version: "6.4.0", type: "module", main: "dist/src/index.js" }));
  writeFileSync(join(dependencyDir, "dist", "src", "index.js"), "export const marker = 'fixture';\n");
  if (!omitEntry) {
    mkdirSync(join(dependencyDir, "dist", "subagents"), { recursive: true });
    writeFileSync(join(dependencyDir, "dist", "subagents", "index.js"), factory);
  }
  return { root, from, dependencyDir };
}

function fakeHost() {
  const tools = [];
  const handlers = new Map();
  const notices = [];
  return {
    tools,
    handlers,
    notices,
    host: {
      registerTool: (tool) => tools.push(tool),
      on: (type, handler) => handlers.set(type, handler),
    },
    fireSessionStart() {
      for (const handler of handlers.values()) handler({ type: "session_start" }, { ui: { notify: (message, kind) => notices.push([message, kind]) } });
    },
  };
}

test("a hoisted sibling layout resolves the subagents entry", (t) => {
  const { from, dependencyDir } = fixture(t, { layout: "hoisted" });
  const resolved = resolveSubagentsEntry(from);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.reason);
  assert.equal(resolved.path, join(dependencyDir, "dist", "subagents", "index.js"));
});

test("a nested layout resolves the subagents entry", (t) => {
  const { from, dependencyDir } = fixture(t, { layout: "nested" });
  const resolved = resolveSubagentsEntry(from);
  assert.equal(resolved.ok, true, resolved.ok ? "" : resolved.reason);
  assert.equal(resolved.path, join(dependencyDir, "dist", "subagents", "index.js"));
});

test("a missing dependency is unavailable with a reason", (t) => {
  const { from } = fixture(t, { omitPackage: true });
  const resolved = resolveSubagentsEntry(from);
  assert.equal(resolved.ok, false);
  assert.match(resolved.reason, /pi-extensible-workflows/u);
});

test("a dependency without the entry is unavailable with a reason", (t) => {
  const { from } = fixture(t, { omitEntry: true });
  const resolved = resolveSubagentsEntry(from);
  assert.equal(resolved.ok, false);
  assert.match(resolved.reason, /dist\/subagents\/index\.js/u);
});

test("the resolved factory registers its tools through the host API", async (t) => {
  const { from } = fixture(t, { layout: "hoisted" });
  const { tools, host } = fakeHost();
  const result = await provisionSubagents(host, { from });
  assert.equal(result.status, "loaded", JSON.stringify(result));
  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, "subagents_run");
});

test("a missing dependency reports once at session start", async (t) => {
  const { from } = fixture(t, { omitPackage: true });
  const fake = fakeHost();
  const result = await provisionSubagents(fake.host, { from });
  assert.equal(result.status, "unavailable");
  fake.fireSessionStart();
  fake.fireSessionStart();
  assert.equal(fake.notices.length, 1, `exactly one diagnostic, got ${JSON.stringify(fake.notices)}`);
  assert.equal(fake.notices[0][1], "warning");
  assert.match(fake.notices[0][0], /pi-extensible-workflows\/dist\/subagents\/index\.js/u);
});

test("a dependency without the entry reports once at session start", async (t) => {
  const { from } = fixture(t, { omitEntry: true });
  const fake = fakeHost();
  await provisionSubagents(fake.host, { from });
  fake.fireSessionStart();
  assert.equal(fake.notices.length, 1);
  assert.ok(fake.notices[0][0].includes(SUBAGENTS_ENTRY_LABEL));
});

test("a dependency without a factory reports once at session start", async (t) => {
  const { from } = fixture(t, { factory: "export default 42;\n" });
  const fake = fakeHost();
  const result = await provisionSubagents(fake.host, { from });
  assert.equal(result.status, "unavailable");
  fake.fireSessionStart();
  assert.equal(fake.notices.length, 1);
  assert.match(fake.notices[0][0], /factory/u);
});

test("a dependency whose entry throws reports once at session start", async (t) => {
  const { from } = fixture(t, { factory: 'throw new Error("boom");\n' });
  const fake = fakeHost();
  await provisionSubagents(fake.host, { from });
  fake.fireSessionStart();
  assert.equal(fake.notices.length, 1);
  assert.match(fake.notices[0][0], /boom/u);
  assert.ok(fake.notices[0][0].includes(SUBAGENTS_ENTRY_LABEL));
});

test("the diagnostic names the entry and the repair", () => {
  const message = subagentsDiagnostic("not installed");
  assert.ok(message.includes(SUBAGENTS_ENTRY_LABEL), message);
  assert.match(message, /not installed/u);
});

test("the manifest declares the shim and the shipped file exists", (t) => {
  const manifest = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));
  assert.deepEqual(manifest.pi.extensions, [
    "./dist/extension/index.js",
    "./dist/extension/subagents-entry.js",
  ]);
  assert.equal(existsSync(join(PKG_DIR, "dist", "extension", "subagents-entry.js")), true, "the shim must be built into dist");
  assert.ok(
    !manifest.pi.extensions.some((entry) => entry.includes("node_modules/pi-extensible-workflows")),
    "a node_modules path only exists on a nested install; it must not be the shipped entry",
  );
});

test("the README names the shim as the entry and the disable target", () => {
  const readme = readFileSync(join(PKG_DIR, "README.md"), "utf8");
  assert.ok(readme.includes("./dist/extension/subagents-entry.js"), "the README names the shipped entry");
  assert.match(readme, /hoist/iu, "the README states the hoisting caveat");
  assert.ok(
    !/remove the\s+`\.\/node_modules\/pi-extensible-workflows/u.test(readme),
    "the disable instruction must not name the retired node_modules path",
  );
});
