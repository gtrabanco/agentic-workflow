#!/usr/bin/env node
/**
 * git-config-writes.test.mjs — the repository's `-c`-only convention for test
 * suites, pinned mechanically (issue #514 S7, precedent
 * `scripts/log-immutability.test.mjs`).
 *
 * The defect this closes: a suite mutates a *fixture* repository's identity with
 * `git config user.email …`. When the fixture's resolution fails (a `GIT_DIR`
 * inherited from git's own `pre-push` export, a failed `mkdtemp`), the write
 * lands in the shared checkout instead, and every later commit carries the
 * fixture identity — `t <t@example.test>` for 139 commits on `origin/main`.
 * Passing identity per invocation (`git -c user.name=… -c user.email=…`) has no
 * second target: the value exists for that one process and nowhere else.
 *
 * The rule is textual on purpose, and its boundary is stated: a `git`
 * invocation assembled by variable indirection (`c=config; git $c …`) is out of
 * scope, exactly like `guard-command.sh`'s literal-token boundary. False
 * positives are repaired by rewording the suite, never by widening an exemption
 * list.
 *
 * The gate's own corpus lives in `scripts/git-config-writes.cases.txt` so this
 * suite contains no invoking form to flag.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { classifyInvocation, scanSource } from "./git-config-writes.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRIPT = path.join(HERE, "git-config-writes.mjs");
const CASES = path.join(HERE, "git-config-writes.cases.txt");

/** Assembled, not written: this suite is a carrier too, and the gate scans it. */
const CONFIG = "config";

/** The corpus: `<expectation> | <source fragment>`, comments with `#`. */
function corpus() {
  return fs
    .readFileSync(CASES, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => {
      const pivot = line.indexOf("|");
      assert.ok(pivot > 0, `corpus line without a separator: ${line}`);
      return { expectation: line.slice(0, pivot).trim(), source: line.slice(pivot + 1).trim() };
    });
}

function run(args, options = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", cwd: ROOT, ...options });
}

test("every corpus case classifies as its expectation declares", () => {
  const cases = corpus();
  assert.ok(cases.length >= 16, `the corpus is the contract — ${cases.length} case(s) is not enough`);
  for (const { expectation, source } of cases) {
    const findings = scanSource(source);
    const verdict = findings.some((finding) => finding.kind === "write") ? "write" : "read";
    assert.equal(verdict, expectation, `wrong verdict for: ${source}`);
  }
});

test("both syntaxes are recognised: legacy flags and modern subcommands", () => {
  const legacy = classifyInvocation([CONFIG, "--unset", "user.name"]);
  const modern = classifyInvocation([CONFIG, "unset", "user.name"]);
  assert.equal(legacy.kind, "write");
  assert.equal(modern.kind, "write");
  assert.equal(legacy.key, "user.name");
  assert.equal(modern.key, "user.name");
  assert.equal(classifyInvocation([CONFIG, "get", "user.email"]).kind, "read");
  assert.equal(classifyInvocation([CONFIG, "--get-all", "user.email"]).kind, "read");
});

test("a file option is skipped before the key is read", () => {
  const finding = classifyInvocation([CONFIG, "--file", "/tmp/x", "user.email", "a@b"]);
  assert.equal(finding.kind, "write");
  assert.equal(finding.key, "user.email");
  assert.equal(classifyInvocation([CONFIG, "--global", "--get", "user.name"]).kind, "read");
});

test("the scan reports path:line and never counts a comment or a non-git line", () => {
  const findings = scanSource("// a note\nconst a = 1;\n");
  assert.deepEqual(findings, []);
  const hit = scanSource(`x();\n  git(["${CONFIG}", "user.email", "t@example.test"]);\n`);
  assert.equal(hit.length, 1);
  assert.equal(hit[0].line, 2);
});

function fixtureTree(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gw-cases-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [relative, body] of Object.entries(files)) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body);
  }
  return root;
}

test("a fixture tree with one offending suite fails the gate at that line", (t) => {
  const offending = ["const x = 1;", "run([\"config\", \"user.name\", \"Fixture\"]);", ""].join("\n");
  const clean = ["const y = 1;", "run([\"-c\", \"user.name=Fixture\", \"commit\", \"-m\", \"x\"]);", ""].join("\n");
  const root = fixtureTree(t, {
    "scripts/a.test.mjs": offending,
    "scripts/b.test.mjs": clean,
    "packages/demo/test/c.test.mjs": clean,
    "template/.agentic-workflow/hooks/tests/test-hook.sh": "#!/usr/bin/env bash\ngit config user.email t@example.test\n",
  });
  const result = run(["--root", root]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /FINDING scripts\/a\.test\.mjs:2 /);
  assert.match(result.stdout, /FINDING template\/\.agentic-workflow\/hooks\/tests\/test-hook\.sh:2 /);
  assert.match(result.stdout, /verdict: FAIL/);
});

test("a clean fixture tree passes and prints a byte-stable block", (t) => {
  const root = fixtureTree(t, {
    "scripts/a.test.mjs": "run([\"-c\", \"user.name=Fixture\", \"commit\"]);\n",
    "packages/demo/test/c.test.mjs": "assert.ok(true);\n",
  });
  const first = run(["--root", root]);
  assert.equal(first.status, 0, first.stdout + first.stderr);
  assert.match(first.stdout, /^git-config-writes — \d+ carriers scanned, 0 findings$/m);
  assert.match(first.stdout, /verdict: PASS/);
  const second = run(["--root", root]);
  assert.equal(second.stdout, first.stdout, "the block is deterministic");
});

test("this repository is compliant (issue #514 S7, S9)", () => {
  const result = run(["--root", ROOT]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /verdict: PASS/);
});

test("usage errors exit 2", () => {
  assert.equal(run(["--nope"]).status, 2);
  assert.equal(run(["--root"]).status, 2);
  assert.equal(run(["--root", path.join(ROOT, "does-not-exist")]).status, 2);
});
