#!/usr/bin/env node

/**
 * test-impact.test.mjs — the impact hint's corpus (issue #356).
 *
 * One case per behaviour the hint owes and per failure state it must refuse.
 * Two layers, both deterministic:
 *
 *   * the unit level imports `classifyPath` / `isTestFile` / `symbolsIn` and
 *     judges the pure rules directly, so a rule change fails here without a
 *     subprocess in between;
 *   * the CLI level spawns the script against throwaway repositories
 *     (`mktemp -d`, committed, removed in `finally`) and judges the fixed block,
 *     the exit code and the fixture's own `git status` — because the contract is
 *     a printed block, not a return value.
 *
 * The `rg`-absent and no-matcher cases run the script under a synthetic PATH
 * (a directory carrying symlinks to the binaries the case allows), which is how
 * the degradation and the refusal are proved for real instead of mocked.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { classifyPath, isTestFile, symbolsIn } from "./test-impact.mjs";

const scriptFile = fileURLToPath(new URL("./test-impact.mjs", import.meta.url));
const repoRoot = path.resolve(path.dirname(scriptFile), "..");

/** A throwaway repository; removed by the caller's `finally`. */
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "test-impact-"));
  for (const [relative, body] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, body);
  }
  return root;
}

/** The first directory on PATH carrying an executable named `name`. */
function which(name, envPath = process.env.PATH ?? "") {
  for (const dir of envPath.split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(dir, name);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

/** A PATH containing exactly the named binaries — the synthetic-environment seam. */
function restrictedPath(names) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "test-impact-bin-"));
  for (const name of names) {
    const real = which(name);
    if (real) fs.symlinkSync(real, path.join(dir, name));
  }
  return dir;
}

function run(args, { cwd = repoRoot, envPath } = {}) {
  const result = spawnSync(process.execPath, [scriptFile, ...args], {
    cwd,
    encoding: "utf8",
    env: envPath === undefined ? process.env : { ...process.env, PATH: envPath },
  });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

const git = (cwd, args) => spawnSync("git", args, { cwd, encoding: "utf8" });

/** A repository the `--base` cases can commit into; the identity is fixture-local. */
function repository(files) {
  const root = fixture(files);
  git(root, ["init", "-q"]);
  git(root, ["config", "user.email", "fixture@example.invalid"]);
  git(root, ["config", "user.name", "fixture"]);
  return root;
}

const commitAll = (cwd, message) => {
  git(cwd, ["add", "-A"]);
  const commit = git(cwd, ["-c", "commit.gpgsign=false", "commit", "-m", message]);
  assert.equal(commit.status, 0, commit.stderr);
};

/** The suite lines of a block, in the order printed. */
function suitesOf(stdout) {
  const lines = stdout.split("\n");
  const at = lines.findIndex((line) => /^suites \(\d+\):$/.test(line));
  if (at === -1) return [];
  const out = [];
  for (const line of lines.slice(at + 1)) {
    if (!line.startsWith("  ")) break;
    out.push(line.trim());
  }
  return out;
}

/** One fixed `key: value` field of the block. */
function fieldOf(stdout, key) {
  const line = stdout.split("\n").find((candidate) => candidate.startsWith(`${key}:`));
  return line === undefined ? null : line.slice(key.length + 1).trim();
}

const MATH = `export function add(a, b) {\n  return a + b;\n}\n`;
const MATH_SUITE = `import { add } from "./math.mjs";\n\ntest("add", () => {\n  assert.equal(add(1, 2), 3);\n});\n`;
const OTHER = `export function mul(a, b) {\n  return a * b;\n}\n`;
const OTHER_SUITE = `import { mul } from "./other.mjs";\n\ntest("mul", () => {\n  assert.equal(mul(2, 3), 6);\n});\n`;

// ── Pure rules ──────────────────────────────────────────────────────────────

test("a prose or asset path is inert, and everything else fails closed as executable (S1, O1)", () => {
  for (const inert of ["README.md", "docs/fix/356/SPEC.md", "CHANGELOG.md", ".changeset/fix-1.md", "docs/diagram.png", "notes.txt"]) {
    assert.equal(classifyPath(inert), "inert", `${inert} is prose or an asset`);
  }
  for (const executable of ["scripts/x.mjs", "src/main.ts", "app.py", "Makefile", "package.json", "scripts/test-route-map.json"]) {
    assert.equal(classifyPath(executable), "executable", `${executable} may carry behaviour, so it fails closed upward`);
  }
});

test("the test-file patterns the hint ships are the ones it reads (S4, PE-010)", () => {
  for (const name of ["scripts/x.test.mjs", "src/x.spec.ts", "test_x.py", "x_test.go", "x_spec.rb", "FooTest.java"]) {
    assert.equal(isTestFile(name), true, `${name} is a test file`);
  }
  for (const name of ["scripts/x.mjs", "docs/SPEC.md", "src/testing-notes.md"]) {
    assert.equal(isTestFile(name), false, `${name} is not a test file`);
  }
});

test("declaration extraction reads the identifiers a language declares, never a mention (S4)", () => {
  const source = [
    "// loadMap is mentioned here, never declared",
    "import { loadMap } from './map.mjs';",
    "export function planFor(paths) { return paths; }",
    "export const MAP_PATH = 'x.json';",
    "class Router {}",
    "def paint(self): pass",
    "fn render() {}",
    "  func Mount() {}",
  ].join("\n");
  const found = symbolsIn(source);
  for (const wanted of ["planFor", "MAP_PATH", "Router", "paint", "render", "Mount"]) {
    assert.ok(found.includes(wanted), `${wanted} is a declaration`);
  }
  assert.ok(!found.includes("loadMap"), "an import is a mention, not a declaration");
});

test("a declaration written inside a fixture string is a mention, never a symbol (S4, O3)", () => {
  const fixtureSource = [
    "const SAMPLE = `export function added(a, b) {",
    "  return a + b;",
    "}`;",
    'const OTHER = "export const multiplied = 2;";',
    "// `export function commented()` in a doc comment is prose",
    "export function real(a) { return a; }",
  ].join("\n");
  const found = symbolsIn(fixtureSource, ".mjs");
  assert.deepEqual(found, ["real"], "only the file's own exported declaration is in scope");
});

// ── The block, driven through the CLI ───────────────────────────────────────

test("a prose-only change answers an empty verdict with no suite and no invented test (S1, O1)", () => {
  const root = fixture({
    "README.md": "The add helper lives in src/math.mjs — see add and mul.\n",
    "docs/SPEC.md": "This change touches add, mul and paint in prose only.\n",
    "src/math.mjs": MATH,
    "src/math.test.mjs": MATH_SUITE,
  });
  try {
    const result = run(["--paths", "README.md", "docs/SPEC.md"], { cwd: root });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^TEST IMPACT — empty$/m);
    assert.equal(fieldOf(result.stdout, "verdict"), "empty");
    assert.equal(fieldOf(result.stdout, "changed"), "2");
    assert.equal(fieldOf(result.stdout, "executable"), "0");
    assert.deepEqual(suitesOf(result.stdout), [], "an empty impact set surfaces zero suites");
    assert.doesNotMatch(result.stdout, /math\.test\.mjs/, "a doc that mentions a symbol never invents its test");
    assert.match(fieldOf(result.stdout, "reason") ?? "", /no executable path/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a code change surfaces the affected suite and excludes the unrelated one (S3, O3)", () => {
  const root = fixture({
    "src/math.mjs": MATH,
    "src/math.test.mjs": MATH_SUITE,
    "src/other.mjs": OTHER,
    "src/other.test.mjs": OTHER_SUITE,
  });
  try {
    const result = run(["--paths", "src/math.mjs"], { cwd: root });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^TEST IMPACT — targeted$/m);
    assert.deepEqual(suitesOf(result.stdout), ["src/math.test.mjs"]);
    // The tier names the matcher this machine offers, not this case's subject:
    // a runner without rg answers `grep` and owes the same set, which is what
    // the degradation case below pins.
    assert.ok(
      ["rg", "grep"].includes(fieldOf(result.stdout, "tier") ?? ""),
      `a portable tier answered, got: ${fieldOf(result.stdout, "tier")}`,
    );
    assert.ok((fieldOf(result.stdout, "symbols") ?? "").includes("add"), "the touched symbol is named");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the suite beside a changed file joins the set even when it names no touched symbol (S4, O3)", () => {
  const root = fixture({
    "src/format.mjs": "export function paint(value) {\n  return `${value}`;\n}\n",
    "src/format.test.mjs": "test(\"formats\", () => {\n  assert.ok(true);\n});\n",
  });
  try {
    const result = run(["--paths", "src/format.mjs"], { cwd: root });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(suitesOf(result.stdout), ["src/format.test.mjs"]);
    assert.match(fieldOf(result.stdout, "sources") ?? "", /sibling/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a code change no suite matches stays targeted and says to fall back to the project gate (S3, S4)", () => {
  const root = fixture({
    "src/orphan.mjs": "export function lonely(value) {\n  return value;\n}\n",
    "src/other.test.mjs": OTHER_SUITE,
  });
  try {
    const result = run(["--paths", "src/orphan.mjs"], { cwd: root });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fieldOf(result.stdout, "verdict"), "targeted", "an unmatched code change is never an empty set");
    assert.deepEqual(suitesOf(result.stdout), []);
    assert.match(fieldOf(result.stdout, "reason") ?? "", /fall back to the project gate/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("with rg absent the hint degrades to grep, says so, and answers the same set (S4, O5)", () => {
  const root = fixture({
    "src/math.mjs": MATH,
    "src/math.test.mjs": MATH_SUITE,
    "src/other.mjs": OTHER,
    "src/other.test.mjs": OTHER_SUITE,
  });
  const binDir = restrictedPath(["grep"]);
  try {
    const portable = run(["--paths", "src/math.mjs"], { cwd: root });
    const degraded = run(["--paths", "src/math.mjs"], { cwd: root, envPath: binDir });
    assert.equal(degraded.status, 0, degraded.stderr);
    assert.equal(fieldOf(degraded.stdout, "tier"), "grep");
    assert.match(degraded.stdout, /^fallback: rg absent/m, "the degradation is stated, never silent");
    assert.deepEqual(suitesOf(degraded.stdout), suitesOf(portable.stdout), "the tier never changes the answer");
    assert.equal(fieldOf(degraded.stdout, "verdict"), fieldOf(portable.stdout, "verdict"));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(binDir, { recursive: true, force: true });
  }
});

test("the LSP tier is an input: --references joins the set and states its tier (S4, O6)", () => {
  const root = fixture({
    "src/math.mjs": MATH,
    "src/math.test.mjs": MATH_SUITE,
    "test/integration/uses-add.mjs": "export const check = (add) => add;\n",
    "refs.txt": "test/integration/uses-add.mjs\n",
  });
  try {
    const result = run(["--paths", "src/math.mjs", "--references", "refs.txt"], { cwd: root });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fieldOf(result.stdout, "tier"), "lsp");
    assert.deepEqual(suitesOf(result.stdout), ["src/math.test.mjs", "test/integration/uses-add.mjs"]);
    assert.match(fieldOf(result.stdout, "sources") ?? "", /lsp/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a --references entry that does not exist is refused, never dropped (S4, O6, O7)", () => {
  const root = fixture({ "src/math.mjs": MATH, "src/math.test.mjs": MATH_SUITE, "refs.txt": "src/missing.test.mjs\n" });
  try {
    const result = run(["--paths", "src/math.mjs", "--references", "refs.txt"], { cwd: root });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^TEST IMPACT — error$/m);
    assert.match(result.stderr, /src\/missing\.test\.mjs/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the hint refuses when no matcher is installed instead of answering empty (S4, O7)", () => {
  const root = fixture({ "src/math.mjs": MATH, "src/math.test.mjs": MATH_SUITE });
  const emptyPath = fs.mkdtempSync(path.join(os.tmpdir(), "test-impact-none-"));
  try {
    const result = run(["--paths", "src/math.mjs"], { cwd: root, envPath: emptyPath });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /neither rg nor grep/);
    assert.equal(result.stdout.includes("verdict: empty"), false, "a missing matcher is never an empty impact set");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(emptyPath, { recursive: true, force: true });
  }
});

test("no path in scope is a refusal, not an empty set (S1, O7)", () => {
  const root = repository({ "src/math.mjs": MATH });
  try {
    const noArgs = run([], { cwd: root });
    assert.equal(noArgs.status, 1);
    assert.match(noArgs.stderr, /no path in scope/);

    commitAll(root, "base");
    const emptyDiff = run(["--base", "HEAD"], { cwd: root });
    assert.equal(emptyDiff.status, 1);
    assert.match(emptyDiff.stderr, /no path in scope/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a --paths entry that exists nowhere is refused when no diff justifies it (O7)", () => {
  const root = fixture({ "src/math.mjs": MATH });
  try {
    const result = run(["--paths", "docs/typo.md"], { cwd: root });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /--paths entry does not exist: docs\/typo\.md/);
    assert.equal(result.stdout.includes("verdict: empty"), false, "a typo'd path is never an empty impact set");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a --paths entry that names a directory is refused, never silently searched (O7)", () => {
  const root = fixture({ "src/math.mjs": MATH, "src/math.test.mjs": MATH_SUITE });
  try {
    const result = run(["--paths", "src"], { cwd: root });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /--paths entry is a directory: src/);
    assert.equal(result.stdout.includes("verdict: targeted"), false, "a directory is never a searched scope");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("an unknown flag and a bare --base are usage errors (O7)", () => {
  const root = fixture({ "src/math.mjs": MATH });
  try {
    const unknown = run(["--paths", "src/math.mjs", "--nope"], { cwd: root });
    assert.equal(unknown.status, 1);
    assert.match(unknown.stderr, /unknown argument: --nope/);

    const bare = run(["--base"], { cwd: root });
    assert.equal(bare.status, 1);
    assert.match(bare.stderr, /--base requires a revision/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── The diff tier ───────────────────────────────────────────────────────────

test("--base reads the symbols the diff touches, not every declaration in the file (S3, PE-005)", () => {
  const root = repository({ "src/math.mjs": `${MATH}export function mul(a, b) {\n  return a * b;\n}\n`, "src/math.test.mjs": MATH_SUITE });
  try {
    commitAll(root, "base");
    fs.appendFileSync(path.join(root, "src/math.mjs"), "export function sub(a, b) {\n  return a - b;\n}\n");

    const result = run(["--base", "HEAD"], { cwd: root });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fieldOf(result.stdout, "symbols"), "sub", "only the added declaration is in scope");
    assert.deepEqual(suitesOf(result.stdout), ["src/math.test.mjs"]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("--base with a prose-only diff answers empty (S1, O1)", () => {
  const root = repository({ "README.md": "one\n", "src/math.mjs": MATH, "src/math.test.mjs": MATH_SUITE });
  try {
    commitAll(root, "base");
    fs.appendFileSync(path.join(root, "README.md"), "add and mul are described here.\n");

    const result = run(["--base", "HEAD"], { cwd: root });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fieldOf(result.stdout, "verdict"), "empty");
    assert.deepEqual(suitesOf(result.stdout), []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── Invariants of the printed block ─────────────────────────────────────────

test("the block is byte-stable across runs and the hint writes nothing (O7, PE-009)", () => {
  const root = repository({ "src/math.mjs": MATH, "src/math.test.mjs": MATH_SUITE });
  try {
    commitAll(root, "base");
    const before = git(root, ["status", "--porcelain"]).stdout;
    const first = run(["--paths", "src/math.mjs"], { cwd: root });
    const second = run(["--paths", "src/math.mjs"], { cwd: root });
    assert.equal(first.stdout, second.stdout, "the same tree prints the same block");
    assert.equal(git(root, ["status", "--porcelain"]).stdout, before, "the hint writes no file");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the shipped tree: a one-file change never answers the whole gate (S3, O3)", () => {
  const result = run(["--paths", "scripts/test-impact.mjs"]);
  assert.equal(result.status, 0, result.stderr);
  const suites = suitesOf(result.stdout);
  assert.ok(suites.length > 0, "the hint finds the pair's own suite");
  assert.ok(
    suites.length < 20,
    `a one-file change must stay a handful of suites, never the gate — got ${suites.length}`,
  );
});

test("the shipped tree: this unit's own change targets its own suite (S3, S7)", () => {
  const result = run(["--paths", "scripts/test-impact.mjs"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fieldOf(result.stdout, "verdict"), "targeted");
  assert.ok(
    suitesOf(result.stdout).includes("scripts/test-impact.test.mjs"),
    `the pair's own suite is in the impact set, got: ${suitesOf(result.stdout).join(", ")}`,
  );
});
