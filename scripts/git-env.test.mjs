#!/usr/bin/env node

/**
 * git-env.test.mjs — a gate step must not inherit the caller's repository.
 *
 * `git push` runs its `pre-push` hook with `GIT_DIR` (and friends) exported. A
 * fixture that spawns `git init <dir>` inside a suite then re-initializes the
 * *real* repository instead of the throwaway one, and its commits move the
 * caller's branch: that happened on 2026-11-05, when the local gate ran from the
 * hook and clobbered the working checkout's branch pointer.
 *
 * The scrub is one definition (`scripts/git-env.mjs`) used by both entry points
 * that spawn suites (`scripts/local-gate.mjs`, `scripts/run-root-suite.mjs`).
 * These cases pin the vocabulary and the parts it must NOT touch: `GIT_CONFIG_*`
 * is how the root gate disables commit signing, and `GIT_AUTHOR_*` is how a
 * fixture sets its own identity.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

const { GIT_LOCATOR_VARS, scrubGitLocator } = await import("./git-env.mjs");

test("every variable that points git at a repository is scrubbed", () => {
  const dirty = {
    GIT_DIR: "/real/.git",
    GIT_WORK_TREE: "/real",
    GIT_INDEX_FILE: "/real/.git/index",
    GIT_OBJECT_DIRECTORY: "/real/.git/objects",
    GIT_ALTERNATE_OBJECT_DIRECTORIES: "/other/objects",
    GIT_COMMON_DIR: "/real/.git",
    GIT_PREFIX: "sub/dir/",
    GIT_NAMESPACE: "ns",
    GIT_QUARANTINE_PATH: "/tmp/q",
  };
  for (const name of Object.keys(dirty)) {
    assert.ok(GIT_LOCATOR_VARS.includes(name), `${name} must be in the published scrub set`);
    assert.equal(scrubGitLocator(dirty)[name], undefined, `${name} must not reach a step`);
  }
});

test("the configuration and identity variables survive: the gate sets them on purpose", () => {
  const env = {
    GIT_DIR: "/real/.git",
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "commit.gpgsign",
    GIT_CONFIG_VALUE_0: "false",
    GIT_AUTHOR_NAME: "Fixture",
    GIT_AUTHOR_EMAIL: "fixture@example.com",
    GIT_DEFAULT_BRANCH: "main",
    PATH: "/usr/bin",
    HOME: "/home/someone",
  };
  const clean = scrubGitLocator(env);
  assert.equal(clean.GIT_DIR, undefined);
  assert.equal(clean.GIT_CONFIG_COUNT, "1");
  assert.equal(clean.GIT_CONFIG_KEY_0, "commit.gpgsign");
  assert.equal(clean.GIT_CONFIG_VALUE_0, "false");
  assert.equal(clean.GIT_AUTHOR_NAME, "Fixture");
  assert.equal(clean.GIT_AUTHOR_EMAIL, "fixture@example.com");
  assert.equal(clean.GIT_DEFAULT_BRANCH, "main");
  assert.equal(clean.PATH, "/usr/bin");
  assert.equal(clean.HOME, "/home/someone");
});

test("the scrub never mutates the environment it is handed", () => {
  const env = { GIT_DIR: "/real/.git", PATH: "/usr/bin" };
  scrubGitLocator(env);
  assert.equal(env.GIT_DIR, "/real/.git", "the caller's object is left alone");
});

test("an env with no git locator is returned intact", () => {
  const env = { PATH: "/usr/bin", HOME: "/home/someone" };
  assert.deepEqual(scrubGitLocator(env), env);
});

/* ── the per-file and per-suite entry points (issue #514 S9) ───────────── */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRELOAD = path.join(REPO_ROOT, "scripts", "test-preload.mjs");

/** Every bunfig the repository ships must preload the one scrub module. */
test("each bunfig preloads the repository-locator scrub", () => {
  const configs = ["bunfig.toml", ...fs.readdirSync(path.join(REPO_ROOT, "packages")).map((name) => path.join("packages", name, "bunfig.toml"))];
  let found = 0;
  for (const relative of configs) {
    const absolute = path.join(REPO_ROOT, relative);
    if (!fs.existsSync(absolute)) continue;
    found += 1;
    const text = fs.readFileSync(absolute, "utf8");
    assert.match(text, /^\[test\]$/m, `${relative} declares a [test] table`);
    assert.match(text, /preload\s*=\s*\[[^\]]*test-preload\.mjs/, `${relative} preloads scripts/test-preload.mjs`);
  }
  assert.ok(found >= 5, `every suite entry point is covered — found ${found}`);
});

/** The claim the whole entry-point fix rests on: bun runs the preload in the
 *  test process, before the suite body, so a fixture never sees GIT_DIR. */
test("a real `bun test` run reaches the suite with the locators already gone", (t) => {
  const bun = ["bun", "bunx"].find((candidate) => spawnSync(candidate, ["--version"], { encoding: "utf8" }).status === 0);
  if (!bun) {
    t.skip("bun is not installed; the node fallback documents its own --import form");
    return;
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "preload-proof-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(dir, "bunfig.toml"),
    `[test]\npreload = [${JSON.stringify(PRELOAD)}]\n`,
  );
  fs.writeFileSync(
    path.join(dir, "proof.test.mjs"),
    [
      'import assert from "node:assert/strict";',
      'import { test } from "node:test";',
      'test("the suite body sees no repository locator", () => {',
      '  assert.equal(process.env.GIT_DIR, undefined, "GIT_DIR");',
      '  assert.equal(process.env.GIT_WORK_TREE, undefined, "GIT_WORK_TREE");',
      '  assert.equal(process.env.GIT_INDEX_FILE, undefined, "GIT_INDEX_FILE");',
      "});",
      "",
    ].join("\n"),
  );
  // A suite is never handed its parent's test-runner context: with
  // NODE_TEST_CONTEXT set, node's runner skips the file and exits 0.
  const env = { ...process.env, GIT_DIR: "/real/.git", GIT_WORK_TREE: "/real", GIT_INDEX_FILE: "/real/.git/index" };
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(bun, ["test", "proof.test.mjs"], { cwd: dir, encoding: "utf8", env });
  const output = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 0, output);
  // bun writes the per-file report to stderr when it is not attached to a tty.
  assert.match(output, /the suite body sees no repository locator/, "the proof suite actually ran");
});
