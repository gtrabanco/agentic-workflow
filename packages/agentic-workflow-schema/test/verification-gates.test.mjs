// P13 / AC7 · AC9 · AC10 — qualification tooling registration and F70 lock sync.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relative) => readFileSync(new URL(relative, import.meta.url), "utf8");
const manifest = JSON.parse(read("../package.json"));
const npmLock = JSON.parse(read("../package-lock.json"));
const bunLockText = read("../bun.lock");
const benchSource = read("../scripts/bench-verification.mjs");

/** Commands ACCEPTANCE v2 names as the finish line (AC7/AC9/AC10 + P13/P14). */
const ACCEPTANCE_COMMANDS = [
  "test",
  "build",
  "check:verification-schemas",
  "check:verification-package",
  "bench:verification",
  "test:verification-docs",
  "gate:verification",
];

// ---------------------------------------------------------------------------
// Command registration
// ---------------------------------------------------------------------------

test("every command ACCEPTANCE v2 names is registered in the package", () => {
  for (const command of ACCEPTANCE_COMMANDS) {
    assert.ok(
      typeof manifest.scripts[command] === "string" && manifest.scripts[command].length > 0,
      `npm run ${command} is not registered`,
    );
  }
});

test("the aggregate gate runs every other verification command", () => {
  const gate = manifest.scripts["gate:verification"];
  // `build` is excluded on purpose: `npm test` compiles as its first step.
  for (const command of ACCEPTANCE_COMMANDS.filter((name) => name !== "gate:verification" && name !== "build")) {
    assert.ok(gate.includes(command), `gate:verification must run ${command}`);
  }
});

test("the schema check rebuilds before comparing, so a stale render cannot pass", () => {
  const check = manifest.scripts["check:verification-schemas"];
  assert.match(check, /^tsc\b/, "the definition is read from dist/, so the build must come first");
  assert.ok(check.indexOf("tsc") < check.indexOf("--check"), "build precedes the drift check");
});

test("the generator check is deterministic and byte-exact", () => {
  const generator = read("../scripts/generate-verification-schemas.mjs");
  assert.match(generator, /--check/, "the generator supports check mode");
  assert.match(generator, /drift-free/, "check mode reports the compared file count");
  // Rendered output is compared byte-for-byte, not semantically.
  assert.match(generator, /!== renderProjection|=== renderProjection/, "drift is decided on rendered bytes");
});

// ---------------------------------------------------------------------------
// F70 — Node typing and lock synchronization
// ---------------------------------------------------------------------------

test("the package declares no unused Node typings (F70)", () => {
  assert.equal(manifest.devDependencies["@types/node"], undefined, "@types/node must not be a dependency");
  const tsconfig = JSON.parse(read("../tsconfig.json").replace(/\/\/.*$/gm, ""));
  assert.equal(tsconfig.compilerOptions.types, undefined, 'tsconfig must not pin "types": ["node"]');
  assert.equal("node_modules/@types/node" in npmLock.packages, false, "the npm lock must not resolve @types/node");
  assert.ok(!bunLockText.includes("@types/node"), "the Bun lock must not resolve @types/node");
});

test("npm and Bun locks agree with the manifest dependency ranges", () => {
  const declared = manifest.devDependencies;
  assert.deepEqual(npmLock.packages[""].devDependencies, declared, "npm lock root drifts from package.json");
  // bun.lock is JSONC (trailing commas): compare the workspace block it declares.
  const bun = JSON.parse(bunLockText.replace(/,(\s*[}\]])/g, "$1"));
  assert.deepEqual(bun.workspaces[""].devDependencies, declared, "Bun lock drifts from package.json");
  assert.deepEqual(
    Object.keys(npmLock.packages[""].devDependencies).sort(),
    Object.keys(bun.workspaces[""].devDependencies).sort(),
    "the two locks resolved different dependency sets",
  );
});

// ---------------------------------------------------------------------------
// AC10 — the declared performance ceiling is not negotiable at runtime
// ---------------------------------------------------------------------------

test("the benchmark ceiling is the declared 100 ms and takes no override", () => {
  assert.match(benchSource, /const P95_CEILING_MS = 100;/, "p95 ceiling must stay at AC10's declared number");
  assert.ok(!/--p95/.test(benchSource), "the benchmark must not accept a looser ceiling from the command line");
  assert.match(benchSource, /process\.exit\(1\)/, "an over-ceiling p95 must fail the command");
  assert.match(benchSource, /for \(let i = 0; i < warm; i\+\+\)/, "samples are taken only after warm-up");
});

test("the benchmark default is the declared 128-command capacity", () => {
  assert.match(benchSource, /arg\("commands", VERIFICATION_LIMITS\.commands\)/);
  assert.match(manifest.scripts["gate:verification"], /bench:verification -- --commands 128/);
});

// ---------------------------------------------------------------------------
// Manifest consistency the packer cannot see
// ---------------------------------------------------------------------------

test("files and exports agree on the shipped schema documents", () => {
  const exported = Object.keys(manifest.exports)
    .filter((key) => key.endsWith(".schema.json"))
    .map((key) => key.replace(/^\.\//, ""))
    .sort();
  const included = manifest.files.filter((entry) => entry.endsWith(".schema.json")).sort();
  assert.deepEqual(exported, included, "a schema that ships must be importable, and vice versa");
  assert.ok(
    included.includes("./verification-plan.schema.json".slice(2)) &&
      included.includes("verification-receipt.schema.json"),
    "both feature-26 projections must ship",
  );
});

test("the package version matches the AC7 release contract", () => {
  assert.equal(manifest.version, "3.4.0");
  assert.equal(npmLock.version, "3.4.0");
  assert.equal(npmLock.packages[""].version, "3.4.0");
});
