// P13 / AC7 · AC9 · AC10 — qualification tooling registration and F70 lock sync.
//
// F70 originally asserted that the npm package-lock.json and bun.lock agreed
// with the manifest (dual-lock sync). On 2026-08-30 the repo went bun-only:
// bun.lock is the sole lockfile (CLAUDE.md → Packages; pinned by
// lockfile-policy.test.mjs), so the sync assertions now compare the one lock
// against the manifest instead of the two locks against each other.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relative) => readFileSync(new URL(relative, import.meta.url), "utf8");
const manifest = JSON.parse(read("../package.json"));
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
  assert.ok(!bunLockText.includes("@types/node"), "the Bun lock must not resolve @types/node");
});

test("the Bun lock agrees with the manifest dependency ranges", () => {
  const declared = manifest.devDependencies;
  // bun.lock is JSONC (trailing commas): compare the workspace block it declares.
  const bun = JSON.parse(bunLockText.replace(/,(\s*[}\]])/g, "$1"));
  assert.deepEqual(bun.workspaces[""].devDependencies, declared, "Bun lock drifts from package.json");
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
});

// ---------------------------------------------------------------------------
// F94 — bench-verification argument discipline (behavioral, spawned)
// ---------------------------------------------------------------------------

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const benchPath = fileURLToPath(new URL("../scripts/bench-verification.mjs", import.meta.url));

test("F94: an explicit --commands 1 run is accepted, not self-rejected", () => {
  // A single-command plan divides the fast-stage budget by 1, which once
  // produced a 900000 ms timeout above the 600000 ms per-fast-command ceiling
  // — the bench generated a plan its own validator rejected. The ceiling must
  // clamp, so the run exits 0 with a PASS verdict.
  const run = spawnSync(process.execPath, [benchPath, "--commands", "1", "--warm", "2", "--samples", "5"], {
    encoding: "utf8",
  });
  assert.equal(run.stderr, "", `bench must be silent on success: ${run.stderr}`);
  assert.equal(run.status, 0, `--commands 1 must run clean (exit ${run.status}): ${run.stdout}`);
  assert.match(run.stdout, /PASS · p95/);
});

test("F94: a non-numeric flag exits 2 with an echoed argument error", () => {
  // Argument parsing must exit 2 BEFORE plan construction — a NaN silently
  // degrading into an invalid-plan rejection (exit 1) conflates usage with
  // contract failure.
  const run = spawnSync(process.execPath, [benchPath, "--commands", "not-a-number"], {
    encoding: "utf8",
  });
  assert.equal(run.status, 2, `expected usage exit 2, got ${run.status}`);
  assert.match(run.stderr, /--commands expects a finite positive integer/);
  assert.equal(run.stdout, "", "a usage failure must print no report");
});

// ---------------------------------------------------------------------------
// F112 — the package gate is path-portable (behavioral, spawned)
// ---------------------------------------------------------------------------

import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const packageDir = fileURLToPath(new URL("..", import.meta.url));

test("F112: the package gate passes from a checkout path with a space and a non-ASCII character", () => {
  // PACKAGE_ROOT used to be `new URL("..", import.meta.url).pathname`, which
  // keeps `%20` where the filesystem has a space, so `npm pack` was handed a
  // cwd that does not exist and the gate failed on a healthy package. The root
  // must come from `fileURLToPath`, like every other path in this package.
  const tempRoot = mkdtempSync(join(tmpdir(), "awlspace gate ñ-"));
  const checkout = join(tempRoot, "package");
  try {
    cpSync(packageDir, checkout, {
      recursive: true,
      filter: (source) => !source.split("/").includes("node_modules"),
    });
    const run = spawnSync(process.execPath, [join(checkout, "scripts", "check-verification-package.mjs")], {
      encoding: "utf8",
    });
    assert.equal(
      run.status,
      0,
      `the package gate must pass from an encoded-path checkout (exit ${run.status}):\n${run.stderr}`,
    );
    assert.match(run.stdout, /^PASS · @gtrabanco\/agentic-workflow-schema@/m, "the gate must reach its PASS verdict");
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
