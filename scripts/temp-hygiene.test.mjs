#!/usr/bin/env node
/**
 * temp-hygiene.test.mjs — the fixture corpus for `scripts/temp-hygiene.mjs`
 * (issue #476).
 *
 * The gate is the static floor of the temp-leak defence: every file that
 * creates temp dirs (`mkdtemp`, or `mkdir` over `tmpdir()`) must carry a
 * cleanup capability in the same file — an `rmSync` call or the tracked
 * helper `tempRoot`. The incident it pins: 14 test files created temp dirs
 * with zero cleanup capability, so every red run leaked, until 494k files
 * saturated `/tmp` and blocked the session daemon behind the same disk I/O.
 * The gate is fail-closed: a file without any cleanup signal is a finding,
 * never a warning.
 *
 * Every case here builds a throwaway source tree (fixtures under
 * `TMPDIR || /var/tmp`, removed in a `finally`) and runs the gate over it —
 * the gate never scans the shipped tree from this suite; the local-gate step
 * (`temp-hygiene`) does that on every push.
 *
 * Usage
 *   bun test scripts/temp-hygiene.test.mjs     (the per-file bun-first rule)
 *   node --test scripts/temp-hygiene.test.mjs  (the guaranteed fallback)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GATE = path.join(repoRoot, "scripts/temp-hygiene.mjs");
const tmpBase = process.env.TMPDIR || "/var/tmp";

const MKDTEMP_LEAK = `import fs from "node:fs";\nimport os from "node:os";\nconst root = fs.mkdtempSync(path.join(os.tmpdir(), "leak-"));\n`;
const MKDTEMP_CLEAN = `${MKDTEMP_LEAK}process.on("exit", () => fs.rmSync(root, { recursive: true, force: true }));\n`;
const MKDTEMP_HELPER = `import { tempRoot } from "./temp-root.mjs";\nconst root = tempRoot("helper-");\n`;
const MKDIR_TMPDIR_LEAK = `import fs from "node:fs";\nimport os from "node:os";\nimport path from "node:path";\nfs.mkdirSync(path.join(os.tmpdir(), "leak-dir-"));\n`;
const TMPDIR_IMPORT_ONLY = `import os from "node:os";\nconsole.log(os.tmpdir());\n`;

/** A throwaway source tree: `{ "scripts/<name>.mjs": text, … }` under a
 *  scoped directory, removed in a `finally`. */
function withTree(files, run) {
  const root = fs.mkdtempSync(path.join(tmpBase, "temp-hygiene-"));
  try {
    for (const [file, content] of Object.entries(files)) {
      fs.mkdirSync(path.join(root, file, ".."), { recursive: true });
      fs.writeFileSync(path.join(root, file), content);
    }
    return run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

/** Run the gate over a fixture tree. */
function gate(root, args = []) {
  const result = spawnSync(process.execPath, [GATE, "--root", root, ...args], { encoding: "utf8" });
  assert.equal(result.status !== null, true, `the gate spawned (stderr: ${result.stderr})`);
  return result;
}

test("a file that creates a temp dir with no cleanup signal is a finding", () => {
  withTree({ "scripts/leaky.test.mjs": MKDTEMP_LEAK }, (root) => {
    const result = gate(root);
    assert.equal(result.status, 1, `exit 1 on a finding (stdout: ${result.stdout})`);
    assert.match(result.stdout, /FINDING scripts\/leaky\.test\.mjs — NO-CLEANUP/, "the finding names the file");
    assert.match(result.stdout, /verdict: FAIL/);
  });
});

test("an rmSync call anywhere in the file satisfies the floor", () => {
  withTree({ "scripts/clean.test.mjs": MKDTEMP_CLEAN }, (root) => {
    const result = gate(root);
    assert.equal(result.status, 0, `exit 0 (stdout: ${result.stdout})`);
    assert.match(result.stdout, /verdict: PASS/);
  });
});

test("the tracked tempRoot helper satisfies the floor", () => {
  withTree({ "scripts/helper.test.mjs": MKDTEMP_HELPER }, (root) => {
    const result = gate(root);
    assert.equal(result.status, 0, `exit 0 (stdout: ${result.stdout})`);
    assert.match(result.stdout, /verdict: PASS/);
  });
});

test("mkdir over tmpdir() with no cleanup is a finding too", () => {
  withTree({ "packages/pkg/test/leaky.mjs": MKDIR_TMPDIR_LEAK }, (root) => {
    const result = gate(root);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /FINDING packages\/pkg\/test\/leaky\.mjs — NO-CLEANUP/);
  });
});

test("a tmpdir read without any mkdir is not a creation", () => {
  withTree({ "scripts/reader.test.mjs": TMPDIR_IMPORT_ONLY }, (root) => {
    const result = gate(root);
    assert.equal(result.status, 0, `exit 0 (stdout: ${result.stdout})`);
  });
});

test("files outside the scanned scopes are never scanned", () => {
  withTree({ "docs/ignored.mjs": MKDTEMP_LEAK, "packages/pkg/dist/ignored.mjs": MKDTEMP_LEAK }, (root) => {
    const result = gate(root);
    assert.equal(result.status, 0, `exit 0 (stdout: ${result.stdout})`);
    assert.match(result.stdout, /verdict: PASS/);
  });
});

test("the tally names the file count and the creating count", () => {
  withTree(
    { "scripts/a.mjs": MKDTEMP_LEAK, "scripts/b.mjs": MKDTEMP_CLEAN, "scripts/c.mjs": TMPDIR_IMPORT_ONLY },
    (root) => {
      const result = gate(root);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /temp-hygiene — 3 file\(s\) scanned · 1 creating/);
      assert.match(result.stdout, /temp-hygiene: 1 finding\(s\)/);
    },
  );
});

test("--json emits one JSON object with the same verdict", () => {
  withTree({ "scripts/leaky.test.mjs": MKDTEMP_LEAK }, (root) => {
    const result = gate(root, ["--json"]);
    assert.equal(result.status, 1);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.verdict, "FAIL");
    assert.equal(parsed.findings.length, 1);
    assert.equal(parsed.findings[0].file, "scripts/leaky.test.mjs");
    assert.equal(parsed.findings[0].code, "NO-CLEANUP");
  });
});

test("an unknown flag is a usage error", () => {
  withTree({}, (root) => {
    const result = gate(root, ["--bogus"]);
    assert.equal(result.status, 2);
  });
});

test("a missing --root value is a usage error", () => {
  const result = spawnSync(process.execPath, [GATE, "--root"], { encoding: "utf8" });
  assert.equal(result.status, 2);
});
