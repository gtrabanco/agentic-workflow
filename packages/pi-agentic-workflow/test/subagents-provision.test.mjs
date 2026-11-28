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
//
// Issue #755 hardened that shim: the dependency binds the host through a bare
// specifier, so it loads whatever `@earendil-works/pi-coding-agent` the sandbox
// hoists — which `pi update --all` never refreshes and which can predate the
// export the layer imports. The shim now prefers a host module that satisfies
// the declared peer range, and a version it cannot satisfy becomes a diagnostic
// naming that version and the one-line repair.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  HOST_PACKAGE,
  SUBAGENTS_ENTRY_LABEL,
  peerRange,
  provisionSubagents,
  readHostVersion,
  resolveHostModule,
  resolveSubagentsEntry,
  satisfiesPeerRange,
  subagentsDiagnostic,
} from "../dist/extension/subagents.js";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

const HOST_NAME = "@earendil-works/pi-coding-agent";

/**
 * Write a host copy into a `node_modules` root. `version` is what its manifest
 * reports; `codemode` decides whether `dist/index.js` carries the export the
 * dependency imports (the reporter's 0.84.2 copy did not).
 */
function writeHostCopy(nodeModulesDir, { version, codemode = version.startsWith("1.") }) {
  const hostDir = join(nodeModulesDir, "@earendil-works", "pi-coding-agent");
  mkdirSync(join(hostDir, "dist"), { recursive: true });
  writeFileSync(join(hostDir, "package.json"), JSON.stringify({ name: HOST_NAME, version, type: "module", main: "./dist/index.js" }));
  const exportLine = codemode ? "export const createCodemodeExtension = () => {};\n" : "";
  writeFileSync(join(hostDir, "dist", "index.js"), `${exportLine}export const VERSION = ${JSON.stringify(version)};\n`);
  return hostDir;
}

/** Write a package-shaped tree; `layout` picks where the dependency lives. */
function fixture(t, { layout, factory = 'export default function factory(pi) { pi.registerTool({ name: "subagents_run" }); }\n', omitEntry = false, omitPackage = false, host = { version: "1.7.0" } } = {}) {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-subagents-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const packageDir = join(root, "node_modules", "@gtrabanco", "pi-agentic-workflow");
  const extensionDir = join(packageDir, "dist", "extension");
  mkdirSync(extensionDir, { recursive: true });
  const from = pathToFileURL(join(extensionDir, "subagents-entry.js")).href;
  writeFileSync(join(extensionDir, "subagents-entry.js"), "// fixture shim\n");

  if (omitPackage) return { root, from };

  // Unless a case asks for none, the sandbox hoists a host copy — the layout the
  // dependency's bare specifier always binds against.
  const hostDir = host === null ? null : writeHostCopy(join(root, "node_modules"), host);

  const dependencyDir = layout === "nested" ? join(packageDir, "node_modules", "pi-extensible-workflows") : join(root, "node_modules", "pi-extensible-workflows");
  mkdirSync(join(dependencyDir, "dist", "src"), { recursive: true });
  writeFileSync(join(dependencyDir, "package.json"), JSON.stringify({ name: "pi-extensible-workflows", version: "6.4.0", type: "module", main: "dist/src/index.js" }));
  writeFileSync(join(dependencyDir, "dist", "src", "index.js"), "export const marker = 'fixture';\n");
  if (!omitEntry) {
    mkdirSync(join(dependencyDir, "dist", "subagents"), { recursive: true });
    writeFileSync(join(dependencyDir, "dist", "subagents", "index.js"), factory);
  }
  return { root, from, dependencyDir, hostDir };
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

// --- issue #755: the sandbox's hoisted host copy -------------------------
//
// The dependency imports the host through a bare specifier, so it binds
// whatever the sandbox hoists. `pi update --all` never refreshes a hoisted peer
// with no direct requester, so that copy can predate the export the layer
// needs. Binding through the bare specifier is the dependency's file; what this
// package controls is (a) judging the copy the dependency's own import will
// bind against the declared peer range — a nameable running host informs the
// warning but never rescues a stale binding — and (b) telling the operator the
// resolved version and its repair.

test("the peer range comes from this package's own manifest, not a literal", () => {
  const manifest = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));
  assert.equal(peerRange(manifest), manifest.peerDependencies[HOST_PACKAGE]);
  assert.ok(satisfiesPeerRange("1.7.0", ">=1.1.0"), "1.7.0 satisfies >=1.1.0");
  assert.ok(!satisfiesPeerRange("0.84.2", ">=1.1.0"), "0.84.2 does not satisfy >=1.1.0");
  assert.ok(satisfiesPeerRange("1.1.0", ">=1.1.0"), "the floor itself satisfies the range");
  assert.ok(!satisfiesPeerRange("1.0.9", ">=1.1.0"), "just below the floor does not");
});

test("an in-range host module is preferred over an out-of-range sandbox copy", (t) => {
  // The sandbox hoists a stale copy the bare specifier would bind; the running
  // host that loaded us is a satisfying module beside it.
  const { root, from, hostDir } = fixture(t, { layout: "hoisted", host: { version: "0.84.2" } });
  const runningHost = writeHostCopy(join(root, "host"), { version: "1.7.0" });
  const chosen = resolveHostModule({ from, hostModule: join(runningHost, "dist", "index.js") });
  assert.equal(chosen.ok, true, chosen.ok ? "" : chosen.reason);
  assert.equal(chosen.version, "1.7.0", "the satisfying host wins over the stale one");
  assert.equal(chosen.path, join(runningHost, "dist", "index.js"));
  assert.notEqual(chosen.path, join(hostDir, "dist", "index.js"), "the stale sandbox copy is not the answer");
});

test("a satisfied peer range loads silently", async (t) => {
  const { from } = fixture(t, { layout: "hoisted", host: { version: "1.7.0" } });
  const fake = fakeHost();
  const result = await provisionSubagents(fake.host, { from });
  assert.equal(result.status, "loaded", JSON.stringify(result));
  fake.fireSessionStart();
  assert.equal(fake.notices.length, 0, `no diagnostic on a healthy install, got ${JSON.stringify(fake.notices)}`);
});

test("an out-of-range resolved host reports its version and the repair", async (t) => {
  const { from } = fixture(t, { layout: "hoisted", host: { version: "0.84.2", codemode: false } });
  const fake = fakeHost();
  const result = await provisionSubagents(fake.host, { from });
  assert.equal(result.status, "unavailable");
  fake.fireSessionStart();
  assert.equal(fake.notices.length, 1, `exactly one diagnostic, got ${JSON.stringify(fake.notices)}`);
  const [message, kind] = fake.notices[0];
  assert.equal(kind, "warning");
  assert.ok(message.includes("0.84.2"), `the diagnostic names the resolved version: ${message}`);
  assert.ok(message.includes(HOST_PACKAGE), `the diagnostic names the package: ${message}`);
  assert.match(message, /bun add /u, `the diagnostic names the repair: ${message}`);
  assert.ok(message.includes(SUBAGENTS_ENTRY_LABEL), "the diagnostic still names the entry");
  assert.ok(!/Reinstall the package/u.test(message), `"Reinstall the package" cannot fix a host-copy mismatch: ${message}`);
  assert.ok(message.startsWith("pi-agentic-workflow: the durable-subagents layer did not load"), "the session diagnostic's stable prefix is preserved");
});

test("an unreadable host version fails closed", async (t) => {
  const { from, hostDir } = fixture(t, { layout: "hoisted", host: { version: "0.84.2", codemode: false } });
  writeFileSync(join(hostDir, "package.json"), JSON.stringify({ name: HOST_NAME, type: "module" }));
  const fake = fakeHost();
  const result = await provisionSubagents(fake.host, { from });
  assert.equal(result.status, "unavailable");
  fake.fireSessionStart();
  assert.equal(fake.notices.length, 1);
  assert.match(fake.notices[0][0], /could not read/i, `an unreadable version is named, not guessed: ${fake.notices[0][0]}`);
});

test("a stale bound copy refuses even when a satisfying running host is nameable", async (t) => {
  // EXTERNAL VERIFY blocker 1, the reporter's shape with the running host
  // nameable: the gate must judge the copy the dependency's bare specifier
  // binds, so the export-error/reinstall text cannot come back and the
  // warning also says what the running host is.
  const { root, from } = fixture(t, { layout: "hoisted", host: { version: "0.84.2", codemode: false } });
  const runningHost = writeHostCopy(join(root, "host"), { version: "1.7.0" });
  const fake = fakeHost();
  const result = await provisionSubagents(fake.host, { from, hostModule: join(runningHost, "dist", "index.js") });
  assert.equal(result.status, "unavailable", JSON.stringify(result));
  fake.fireSessionStart();
  assert.equal(fake.notices.length, 1, `exactly one diagnostic, got ${JSON.stringify(fake.notices)}`);
  const [message] = fake.notices[0];
  assert.ok(message.includes("0.84.2"), `the diagnostic names the bound copy's version: ${message}`);
  assert.ok(message.includes("1.7.0"), `the diagnostic names the satisfying running host: ${message}`);
  assert.match(message, /bun add /u, `the diagnostic names the repair: ${message}`);
  assert.ok(!/Reinstall the package/u.test(message), `no retired reinstall advice for a peer mismatch: ${message}`);
  assert.ok(!/Export named/u.test(message), `the doomed load is never attempted: ${message}`);
  assert.equal(fake.tools.length, 0, "a refused host registers nothing");
});

test("a fresh copy beside this package cannot mask the stale copy the dependency binds", async (t) => {
  // The shim's own walk can reach a fresh nested peer while the dependency's
  // walk reaches the stale hoist — only the dependency's binding decides.
  const { from } = fixture(t, { layout: "hoisted", host: { version: "0.84.2", codemode: false } });
  const packageDir = dirname(dirname(dirname(fileURLToPath(new URL(from)))));
  writeHostCopy(join(packageDir, "node_modules"), { version: "1.7.0" });
  const fake = fakeHost();
  const result = await provisionSubagents(fake.host, { from });
  assert.equal(result.status, "unavailable", JSON.stringify(result));
  fake.fireSessionStart();
  assert.equal(fake.notices.length, 1, `exactly one diagnostic, got ${JSON.stringify(fake.notices)}`);
  const [message] = fake.notices[0];
  assert.ok(message.includes("0.84.2"), `the bound stale copy is named: ${message}`);
  assert.ok(!/Reinstall the package/u.test(message), `no retired reinstall advice for a peer mismatch: ${message}`);
  assert.equal(fake.tools.length, 0, "a refused host registers nothing");
});

test("a scratch install shaped like the reporter's sandbox loads the layer", async (t) => {
  // The reporter's sandbox geometry with a satisfying host at the point the
  // dependency's own import binds: the hoist carries the stale 0.84.2, the
  // dependency's nested peer carries the 1.7.0 line — the layer loads with no
  // diagnostic, so the manual remediation is not what gets it there.
  const { from, dependencyDir } = fixture(t, { layout: "hoisted", host: { version: "0.84.2", codemode: false } });
  writeHostCopy(join(dependencyDir, "node_modules"), { version: "1.7.0" });
  const fake = fakeHost();
  const result = await provisionSubagents(fake.host, { from });
  assert.equal(result.status, "loaded", JSON.stringify(result));
  fake.fireSessionStart();
  assert.equal(fake.notices.length, 0, `the reporter's manual remediation is no longer required, got ${JSON.stringify(fake.notices)}`);
  assert.equal(fake.tools.length, 1);
  assert.equal(fake.tools[0].name, "subagents_run");
});

test("readHostVersion reports the package version and never guesses", (t) => {
  const { root } = fixture(t, { layout: "hoisted" });
  const hostDir = writeHostCopy(join(root, "node_modules"), { version: "1.7.0" });
  assert.equal(readHostVersion(join(hostDir, "dist", "index.js")), "1.7.0");
  assert.equal(readHostVersion(join(root, "absent", "index.js")), null);
});

test("the README states the resolution order and the host-version repair", () => {
  const readme = readFileSync(join(PKG_DIR, "README.md"), "utf8");
  const section = readme.slice(readme.indexOf("## Subagent layer"));
  assert.match(section, /peer/iu, "the README names the peer range");
  assert.match(section, /satisf/iu, "the README states that a satisfied host is preferred");
  assert.match(section, /bun add @earendil-works\/pi-coding-agent/u, "the README names the one-line repair");
});

test("the entry hands the running host to the provision, so the stale copy is not the binding", async (t) => {
  // Load the shipped shim the way pi does — a module in the package's
  // dist/extension/, provisioned with the host API. `PI_PACKAGE_DIR` is what pi
  // itself honours to name its own package, so it stands in for "the running host".
  const { root } = fixture(t, { layout: "hoisted", host: { version: "0.84.2", codemode: false } });
  const runningHost = writeHostCopy(join(root, "host"), { version: "1.7.0" });
  const previous = process.env.PI_PACKAGE_DIR;
  process.env.PI_PACKAGE_DIR = runningHost;
  t.after(() => {
    if (previous === undefined) delete process.env.PI_PACKAGE_DIR;
    else process.env.PI_PACKAGE_DIR = previous;
  });
  const fake = fakeHost();
  const entry = await import(pathToFileURL(join(PKG_DIR, "dist", "extension", "subagents-entry.js")).href);
  await entry.default(fake.host);
  fake.fireSessionStart();
  assert.equal(fake.notices.length, 0, `a named running host removes the stale-copy warning, got ${JSON.stringify(fake.notices)}`);
  // The shipped dependency registers its five tools — the set the README names.
  const names = fake.tools.map((tool) => tool.name).sort();
  assert.deepEqual(names, ["subagents_inspect", "subagents_retry", "subagents_run", "subagents_steer", "subagents_stop"]);
});
