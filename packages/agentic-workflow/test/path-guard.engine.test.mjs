// Engine suite for packages/agentic-workflow/src/path-policy.mjs.
//
// The freeze × class × operation matrix, creation-vs-modification, the
// justification / approval / unmatched-record / malformed-declaration cases,
// the shipped-default fallback and degradation cases, and the
// `path-guard:empty-diff` pin (AC1, AC3, AC5, AC6).

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  CHANGED_PATH_LIMIT,
  DEGRADATION_CODES,
  PATH_GUARD_REASONS,
  REQUIREMENTS,
  SHIPPED_PATH_POLICY,
  evaluatePathGuard,
  freezeStateFor,
  globToRegExp,
  parsePlanDeclaration,
  parsePathPolicy,
  parseRecords,
  pathMatchesGlob,
  resolvePathPolicy,
  serializeShippedPolicy,
} from "../src/path-policy.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(here, "..", "bin", "path-guard.mjs");
const GIT_CONFIG = ["-c", "user.email=t@example.com", "-c", "user.name=test", "-c", "commit.gpgsign=false"];
const TMP = [];

function repo(name) {
  const dir = mkdtempSync(path.join(os.tmpdir(), `path-guard-${name}-`));
  TMP.push(dir);
  execFileSync("git", ["init", "-q", "-b", "feat/unit", dir]);
  execFileSync("git", [...GIT_CONFIG, "-C", dir, "commit", "-q", "--allow-empty", "-m", "base"]);
  return dir;
}

function commitFile(dir, rel, content = "x\n") {
  const target = path.join(dir, rel);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
  execFileSync("git", [...GIT_CONFIG, "-C", dir, "add", rel]);
  execFileSync("git", [...GIT_CONFIG, "-C", dir, "commit", "-q", "-m", `add ${rel}`]);
}

function runCli(dir, args) {
  const result = spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: "utf8" });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

test.after(() => {
  for (const dir of TMP) rmSync(dir, { recursive: true, force: true });
});

const DECLARED = `path-protection-plan@1
freeze-after: P4
kind | path | justification
created | ** | all paths declared for the matrix`;

const DECLARATION = parsePlanDeclaration(DECLARED).declaration;
const POLICY = resolvePathPolicy(SHIPPED_PATH_POLICY, null);

function evaluate(changes, { phase = "P1", records = [], declaration = DECLARATION, policy = POLICY } = {}) {
  return evaluatePathGuard({ changes, policy, declaration, records, phase });
}

function justification(paths, phase = "P1") {
  return { kind: "justification", paths: [paths].flat(), phase, date: "2026-09-18", authority: "execute-phase", justification: "why" };
}

function approval(paths, phase = "P5") {
  return { kind: "approval", paths: [paths].flat(), phase, date: "2026-09-18", authority: "human-owner", justification: "owner said yes" };
}

/* ------------------------------------------------------------- vocabularies */

test("the shipped defaults are frozen and carry the five classes", () => {
  assert.deepEqual(Object.keys(SHIPPED_PATH_POLICY.classes), ["tests", "e2e", "test-file", "fixtures", "policy-config"]);
  assert.equal(SHIPPED_PATH_POLICY.classes["policy-config"].freeze, false);
  assert.equal(Object.isFrozen(SHIPPED_PATH_POLICY.classes.tests.globs), true);
  assert.equal(serializeShippedPolicy().endsWith("\n"), true);
});

test("the closed reason set is exactly the ten declared reasons", () => {
  assert.deepEqual([...PATH_GUARD_REASONS].sort(), [
    "approval-required",
    "approved",
    "clean",
    "justified",
    "malformed-config",
    "malformed-declaration",
    "missing-config",
    "protected-modification",
    "undeclared-test",
    "unmatched-record",
  ]);
  assert.equal(Object.isFrozen(PATH_GUARD_REASONS), true);
  assert.equal(DEGRADATION_CODES.includes("ignored-removal"), true);
  assert.equal(CHANGED_PATH_LIMIT, 10000);
  assert.deepEqual(REQUIREMENTS, ["none", "justification", "approval"]);
});

/* ------------------------------------------------------- freeze-state logic */

test("freeze state flips at the declared boundary", () => {
  assert.equal(freezeStateFor("P4", "P4"), "pre-freeze");
  assert.equal(freezeStateFor("P5", "P4"), "post-freeze");
  assert.equal(freezeStateFor("P1", null), "pre-freeze");
});

/* --------------------------------------------------------------- glob match */

test("glob matching crosses directories for ** and stays inside for *", () => {
  assert.equal(pathMatchesGlob("tests/a/b.mjs", "tests/**"), true);
  assert.equal(pathMatchesGlob("a/b/foo.test.mjs", "**/*.test.*"), true);
  assert.equal(pathMatchesGlob("foo.test.mjs", "**/*.test.*"), true);
  assert.equal(pathMatchesGlob("a/foo.spec.mjs", "**/*.test.*"), false);
  assert.equal(globToRegExp("a?c").test("abc"), true);
});

/* ------------------------------------------------------- policy validation */

test("parsePathPolicy fails closed on a wrong schema, unknown key, or bad requirement", () => {
  assert.equal(parsePathPolicy("not json").ok, false);
  assert.equal(parsePathPolicy("{}").ok, false);
  const good = JSON.parse(serializeShippedPolicy());
  assert.equal(parsePathPolicy(JSON.stringify(good)).ok, true);
  assert.equal(parsePathPolicy(JSON.stringify({ ...good, extra: 1 })).ok, false);
  good.matrix["pre-freeze"].modify = "sometimes";
  assert.equal(parsePathPolicy(JSON.stringify(good)).ok, false);
});

/* ------------------------------------------------------- resolution / fallback */

test("a missing override resolves to the shipped defaults with no degradation", () => {
  const resolved = resolvePathPolicy(SHIPPED_PATH_POLICY, null);
  assert.deepEqual(resolved.degradations, []);
  assert.deepEqual(resolved.classes.tests.globs, ["tests/**"]);
});

test("an override may only add globs and raise requirements", () => {
  const override = JSON.parse(serializeShippedPolicy());
  override.classes.tests.globs.push("spec/**");
  override.matrix["pre-freeze"].modify = "approval";
  const resolved = resolvePathPolicy(SHIPPED_PATH_POLICY, override);
  assert.equal(resolved.classes.tests.globs.includes("spec/**"), true);
  assert.equal(resolved.matrix["pre-freeze"].modify, "approval");
  assert.deepEqual(resolved.degradations, []);
});

test("a removal or lowering is ignored and reported", () => {
  const override = JSON.parse(serializeShippedPolicy());
  override.classes.tests.globs = [];
  override.matrix["post-freeze"].modify = "justification";
  const resolved = resolvePathPolicy(SHIPPED_PATH_POLICY, override);
  assert.equal(resolved.classes.tests.globs.includes("tests/**"), true, "the shipped glob stays in force");
  assert.equal(resolved.matrix["post-freeze"].modify, "approval", "the shipped requirement stays in force");
  const codes = resolved.degradations.map((entry) => entry.code);
  assert.equal(codes.includes("ignored-removal"), true);
  assert.equal(codes.includes("ignored-lowering"), true);
});

/* ---------------------------------------------------- matrix: freeze × class */

const CLASS_PATHS = {
  tests: "tests/a.mjs",
  e2e: "e2e/a.mjs",
  "test-file": "src/a.test.mjs",
  fixtures: "fixtures/a.json",
  "policy-config": ".agentic-workflow/path-policy.json",
};

test("pre-freeze freeze-class matrix: create passes, modify/delete/rename need a justification", () => {
  for (const name of ["tests", "e2e", "test-file", "fixtures"]) {
    const path0 = CLASS_PATHS[name];
    assert.equal(evaluate([{ path: path0, operation: "create" }]).reason, "clean", `${name} create`);
    for (const operation of ["modify", "delete", "rename"]) {
      const fail = evaluate([{ path: path0, operation }]);
      assert.equal(fail.verdict, "fail", `${name} ${operation} without record`);
      assert.equal(fail.reason, "protected-modification", `${name} ${operation} reason`);
      const pass = evaluate([{ path: path0, operation }], { records: [justification(path0)] });
      assert.equal(pass.verdict, "pass", `${name} ${operation} with justification`);
      assert.equal(pass.reason, "justified");
    }
  }
});

test("post-freeze freeze-class matrix: modify/delete/rename need a justification plus an approval", () => {
  for (const name of ["tests", "e2e", "test-file", "fixtures"]) {
    const path0 = CLASS_PATHS[name];
    for (const operation of ["modify", "delete", "rename"]) {
      assert.equal(
        evaluate([{ path: path0, operation }], { phase: "P5" }).reason,
        "protected-modification",
        `${name} ${operation} without record`,
      );
      assert.equal(
        evaluate([{ path: path0, operation }], { phase: "P5", records: [justification(path0, "P5")] }).reason,
        "approval-required",
        `${name} ${operation} with justification only`,
      );
      const approved = evaluate([{ path: path0, operation }], {
        phase: "P5",
        records: [justification(path0, "P5"), approval(path0, "P5")],
      });
      assert.equal(approved.verdict, "pass", `${name} ${operation} approved`);
      assert.equal(approved.reason, "approved");
    }
    const create = evaluate([{ path: path0, operation: "create" }], { phase: "P5", records: [justification(path0, "P5")] });
    assert.equal(create.verdict, "pass", `${name} create post-freeze needs only a justification`);
  }
});

test("the policy config is protected at all times", () => {
  const path0 = CLASS_PATHS["policy-config"];
  for (const phase of ["P1", "P5"]) {
    assert.equal(evaluate([{ path: path0, operation: "modify" }], { phase }).reason, "protected-modification");
    const pass = evaluate([{ path: path0, operation: "modify" }], {
      phase,
      records: [justification(path0, phase), approval(path0, phase)],
    });
    assert.equal(pass.verdict, "pass");
    assert.equal(pass.reason, "approved");
  }
});

/* ----------------------------------------------- creation ≠ modification */

test("a declared create passes pre-freeze; an undeclared create is undeclared-test", () => {
  const declared = evaluate([{ path: "tests/a.mjs", operation: "create" }]);
  assert.equal(declared.verdict, "pass");

  const narrow = parsePlanDeclaration(`path-protection-plan@1
freeze-after: P4
kind | path | justification
created | tests/declared.mjs | only this one`).declaration;
  const undeclared = evaluate([{ path: "tests/other.mjs", operation: "create" }], { declaration: narrow });
  assert.equal(undeclared.verdict, "fail");
  assert.equal(undeclared.reason, "undeclared-test");
});

/* ---------------------------------------------------- records and closure */

test("an unmatched record fails the gate", () => {
  const result = evaluate([], { records: [justification("tests/void.mjs")] });
  assert.equal(result.verdict, "fail");
  assert.equal(result.reason, "unmatched-record");
});

test("a record from another phase never satisfies this phase", () => {
  const result = evaluate([{ path: "tests/a.mjs", operation: "modify" }], {
    phase: "P2",
    records: [justification("tests/a.mjs", "P1")],
  });
  assert.equal(result.reason, "protected-modification");
});

test("a malformed declaration fails closed", () => {
  assert.equal(evaluate([], { declaration: null }).reason, "malformed-declaration");
  assert.equal(parsePlanDeclaration("no block here").ok, false);
  assert.equal(parsePlanDeclaration("path-protection-plan@1\nkind | path | justification\ncreated | x | y").ok, false);
});

test("records require the sanctioned authority per kind", () => {
  assert.equal(parseRecords("").ok, true);
  assert.equal(parseRecords("").records.length, 0);
  const bad = `path-protection-records@1
kind | paths | phase | date | authority | justification
approval | tests/a.mjs | P5 | 2026-09-18 | execute-phase | auto`;
  assert.equal(parseRecords(bad).ok, false);
  const good = `path-protection-records@1
kind | paths | phase | date | authority | justification
approval | tests/a.mjs | P5 | 2026-09-18 | human-owner | owner`;
  assert.equal(parseRecords(good).ok, true);
});

/* ------------------------------------------------------- empty-diff pin (CLI) */

test("path-guard:empty-diff — a clean tree yields pass — clean, exit 0", () => {
  const dir = repo("empty");
  const unit = "docs/features/60-demo";
  commitFile(dir, `${unit}/PLAN.md`, `\`\`\`text\n${DECLARED}\n\`\`\`\n`);
  const result = runCli(dir, ["--unit", unit, "--phase", "P1"]);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /^PATH-GUARD pass — clean\n/);
  assert.match(result.stdout, /offenders: none\n/);
  assert.match(result.stdout, /checked: 0\n/);
});

test("unknown arguments are a usage error on stderr, exit 2", () => {
  const dir = repo("usage");
  const result = runCli(dir, ["--unit", "u", "--phase", "P1", "--bogus"]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /unknown argument: --bogus/);
  assert.equal(result.stdout, "");
});
