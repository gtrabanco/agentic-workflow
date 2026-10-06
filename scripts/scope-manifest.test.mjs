#!/usr/bin/env node

/**
 * fix/286 — the affecting-path scope manifest, black box over the CLI in a
 * throwaway git repository (#182 AC 3/9 remain the spec via issue #286).
 *
 *   · `sign` emits the manifest: sorted affected paths (branch delta vs base,
 *     minus the non-affecting classes), per-path SHA-256 over the git blob at
 *     the head, base/head revisions, and one scope digest — computed by the
 *     schema package's `sha256HexSync`, never a second hash implementation;
 *   · the non-affecting classes are exactly the named ones — session log and
 *     agent toolstate/memory dirs — and any path matching no named class binds
 *     (fail-closed);
 *   · `verify` re-derives the manifest at a head: a non-affecting delta keeps
 *     the digest fresh, an affecting delta goes stale naming the path.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(repoRoot, "scripts", "scope-manifest.mjs");

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const commit = (root, files, message) => {
  for (const [rel, text] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  }
  git(root, "add", "-A", "--", ".");
  git(root, "commit", "-qm", message);
  return git(root, "rev-parse", "HEAD");
};

/** A repo with a base commit, then a branch carrying affecting + foreign work. */
function makeRepo(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scope-manifest-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "Fixture");
  git(root, "config", "commit.gpgsign", "false");
  const base = commit(root, { "src/keep.md": "base\n", "docs/LOGS.md": "base log\n" }, "base");
  git(root, "checkout", "-qb", "feat/unit");
  const foreign = commit(root, {
    "docs/LOGS.md": "base log\n\n- session entry (foreign)\n",
    ".serena/project.yml": "cache: fast\n",
    ".engram/memory.md": "recall\n",
    ".pi/agent/state.json": "{}\n",
  }, "chore(foreign): session log + toolstate");
  const unit = commit(root, { "src/feature.ts": "export {};\n" }, "feat: the unit");
  return { root, base, foreign, unit };
}

const run = (root, args) => spawnSync(process.execPath, [script, ...args], {
  cwd: root, encoding: "utf8", timeout: 120000,
});

const sign = (t, { root, base, head }) => {
  const r = run(root, ["sign", "--base", base, "--head", head, "--root", root]);
  assert.equal(r.status, 0, `sign failed: ${r.stderr}`);
  return JSON.parse(r.stdout);
};

test("sign emits the affecting-path manifest: sorted bound paths, blob digests, scope digest (AC1)", (t) => {
  const f = makeRepo(t);
  const manifest = sign(t, { ...f, head: f.unit });
  assert.equal(manifest.contract, "scope-manifest-v1");
  assert.equal(manifest.base, f.base);
  assert.equal(manifest.head, f.unit);
  const paths = manifest.paths.map((row) => row.path);
  assert.deepEqual(paths, [...paths].sort(), "bound paths are sorted");
  assert.deepEqual(paths, ["src/feature.ts"], "exactly the affecting delta binds — session log and toolstate/memory dirs are excluded");
  for (const row of manifest.paths) {
    assert.match(row.digest, /^[a-f0-9]{64}$/, "per-path digest is 64-hex");
    const blob = execFileSync("git", ["show", `${f.unit}:${row.path}`], { cwd: f.root });
    assert.equal(row.digest, createHash("sha256").update(blob).digest("hex"), "the digest is over the git blob at the head");
  }
  assert.match(manifest.scope, /^[a-f0-9]{64}$/, "the scope digest is 64-hex");
  // determinism: same inputs, same digest — no timestamps, no locale
  assert.equal(sign(t, { ...f, head: f.unit }).scope, manifest.scope);
});


test("fail-closed: a path matching no named class binds even when it looks foreign (AC2)", (t) => {
  const f = makeRepo(t);
  const stray = commit(f.root, { "notes.txt": "looks foreign, is not listed\n" }, "chore: stray note");
  const manifest = sign(t, { ...f, head: stray });
  assert.ok(manifest.paths.some((row) => row.path === "notes.txt"),
    "an unlisted path is affecting — the classes are a closed list");
});

test("verify: fresh at the signed head; a non-affecting delta keeps the digest fresh (AC3)", (t) => {
  const f = makeRepo(t);
  const manifest = sign(t, { ...f, head: f.unit });
  const fresh = run(f.root, ["verify", "--base", f.base, "--head", f.unit, "--scope", manifest.scope, "--root", f.root]);
  assert.equal(fresh.status, 0, `verify must be fresh: ${fresh.stderr}`);
  assert.equal(JSON.parse(fresh.stdout).fresh, true);

  const afterForeign = commit(f.root, { "docs/LOGS.md": "another foreign entry\n" }, "docs(log): foreign entry");
  const still = run(f.root, ["verify", "--base", f.base, "--head", afterForeign, "--scope", manifest.scope, "--root", f.root]);
  assert.equal(still.status, 0, `a non-affecting delta must not move the scope: ${still.stderr}`);
  assert.equal(JSON.parse(still.stdout).fresh, true);
});

test("verify: an affecting delta goes stale naming the path, both for content and appearance (AC3)", (t) => {
  const f = makeRepo(t);
  const manifest = sign(t, { ...f, head: f.unit });

  const changed = commit(f.root, { "src/feature.ts": "export const x = 1;\n" }, "feat: touch a bound path");
  const r1 = run(f.root, ["verify", "--base", f.base, "--head", changed, "--scope", manifest.scope, "--since", f.unit, "--root", f.root]);
  assert.equal(r1.status, 4, "a changed bound path voids the scope");
  const report1 = JSON.parse(r1.stdout);
  assert.equal(report1.fresh, false);
  assert.deepEqual(report1.drift.changed, ["src/feature.ts"], "the drifted path is named");

  const appeared = commit(f.root, { "src/extra.ts": "export {};\n" }, "feat: a new affecting path");
  const r2 = run(f.root, ["verify", "--base", f.base, "--head", appeared, "--scope", manifest.scope, "--since", f.unit, "--root", f.root]);
  assert.equal(r2.status, 4, "a new affecting path voids the scope");
  assert.deepEqual(JSON.parse(r2.stdout).drift.appeared, ["src/extra.ts"]);
});

test("verify: a malformed scope digest is a usage error (exit 1), never fresh", (t) => {
  const f = makeRepo(t);
  const r = run(f.root, ["verify", "--base", f.base, "--head", f.unit, "--scope", "nope", "--root", f.root]);
  assert.equal(r.status, 1);
});

test("batch cat-file --batch: exercises the single-invocation path with multiple affected paths", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scope-manifest-batch-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "Fixture");
  git(root, "config", "commit.gpgsign", "false");
  // Base commit with one file
  const base = commit(root, { "src/main.ts": "base\n" }, "base");
  // Branch with 8 affected paths (batches exercise the cat-file path)
  git(root, "checkout", "-qb", "feat/batch-test");
  const affected = {
    "src/a.ts": "a\n",
    "src/b.ts": "b\n",
    "src/c.ts": "c\n",
    "src/d.ts": "d\n",
    "src/e.ts": "e\n",
    "src/f.ts": "f\n",
    "src/g.ts": "g\n",
    "src/h.ts": "h\n",
  };
  const head = commit(root, affected, "feat: batch-test files");
  // Sign and verify the manifest
  const r = run(root, ["sign", "--base", base, "--head", head, "--root", root]);
  assert.equal(r.status, 0, `sign failed: ${r.stderr}`);
  const manifest = JSON.parse(r.stdout);
  assert.equal(manifest.contract, "scope-manifest-v1");
  const paths = manifest.paths.map((row) => row.path).sort();
  assert.deepEqual(paths, Object.keys(affected).sort(), "all affected paths present");
  assert.equal(paths.length, 8, "exactly 8 affected paths (batch exercise)");
  // Verify each digest is correct
  for (const row of manifest.paths) {
    const blob = execFileSync("git", ["show", `${head}:${row.path}`], { cwd: root });
    assert.equal(row.digest, createHash("sha256").update(blob).digest("hex"),
      `${row.path}: digest matches git blob`);
  }
  // Verify the scope digest is deterministic
  const r2 = run(root, ["sign", "--base", base, "--head", head, "--root", root]);
  assert.equal(r2.status, 0);
  assert.equal(JSON.parse(r2.stdout).scope, manifest.scope, "scope digest is deterministic");
});

test("batch path: mixed affected + non-affecting paths", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scope-manifest-mixed-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "Fixture");
  git(root, "config", "commit.gpgsign", "false");
  const base = commit(root, { "docs/LOGS.md": "base\n" }, "base");
  git(root, "checkout", "-qb", "feat/mixed");
  const head = commit(root, {
    "src/one.ts": "one\n",
    "docs/LOGS.md": "updated log\n",
    "src/two.ts": "two\n",
    ".pi/state.json": "{}\n",
  }, "feat: mixed paths");
  const r = run(root, ["sign", "--base", base, "--head", head, "--root", root]);
  assert.equal(r.status, 0, `sign failed: ${r.stderr}`);
  const manifest = JSON.parse(r.stdout);
  const paths = manifest.paths.map((row) => row.path);
  assert.deepEqual(paths, ["src/one.ts", "src/two.ts"],
    "only affected paths present; non-affecting dirs excluded");
});
