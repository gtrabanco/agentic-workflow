#!/usr/bin/env node
/**
 * tmp-gc.test.mjs — the fixture corpus for `scripts/tmp-gc.mjs` (issue #476).
 *
 * The GC is the backstop of the temp-leak defence: the static floor
 * (`scripts/temp-hygiene.mjs`) stops new leak-capable files, but dirs a
 * killed runner already left behind — and the 3,532 the incident produced —
 * only go away when something sweeps. The GC sweeps the machine's temp roots
 * for entries whose names start with a prefix the repository's own sources
 * declare (discovered from `tmpdir(), "<prefix>"` literals, so the allowlist
 * is self-maintaining), and removes only entries older than the age bound —
 * never a fresh dir a running suite may be using, never a name no source
 * declared, never the filesystem or repo root.
 *
 * Every case builds a throwaway temp root and a throwaway source tree (under
 * `TMPDIR || /var/tmp`, removed in a `finally`) and points the GC at them —
 * the suite never lets the GC run against the machine's real roots.
 *
 * Usage
 *   bun test scripts/tmp-gc.test.mjs     (the per-file bun-first rule)
 *   node --test scripts/tmp-gc.test.mjs  (the guaranteed fallback)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { discoverPrefixes } from "./tmp-gc.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GC = path.join(repoRoot, "scripts/tmp-gc.mjs");
const tmpBase = process.env.TMPDIR || "/var/tmp";

const SOURCE_WITH_PREFIX = `const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gc-fixture-"));\n`;

/** A throwaway GC root plus a throwaway source tree declaring one prefix. */
function withFixture(run, { entries = [], maxAgeMinutes = 120 } = {}) {
  const sources = fs.mkdtempSync(path.join(tmpBase, "tmp-gc-sources-"));
  const root = fs.mkdtempSync(path.join(tmpBase, "tmp-gc-root-"));
  try {
    fs.mkdirSync(path.join(sources, "scripts"), { recursive: true });
    fs.writeFileSync(path.join(sources, "scripts", "declares.test.mjs"), SOURCE_WITH_PREFIX);
    for (const [name, ageMinutes] of entries) {
      const full = path.join(root, name);
      fs.mkdirSync(full, { recursive: true });
      fs.writeFileSync(path.join(full, "marker.txt"), "x");
      if (ageMinutes !== null) {
        const past = new Date(Date.now() - ageMinutes * 60_000);
        fs.utimesSync(full, past, past);
      }
    }
    return run({ sources, root, maxAgeMinutes });
  } finally {
    fs.rmSync(sources, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function gc(args) {
  const result = spawnSync(process.execPath, [GC, ...args], { encoding: "utf8" });
  assert.equal(result.status !== null, true, `the GC spawned (stderr: ${result.stderr})`);
  return result;
}

test("discoverPrefixes picks up the prefixes the sources declare, deduplicated", () => {
  const sources = fs.mkdtempSync(path.join(tmpBase, "tmp-gc-disc-"));
  try {
    fs.mkdirSync(path.join(sources, "scripts"), { recursive: true });
    fs.writeFileSync(
      path.join(sources, "scripts", "a.test.mjs"),
      `fs.mkdtempSync(path.join(os.tmpdir(), "alpha-"));\nfs.mkdtempSync(path.join(os.tmpdir(), "alpha-"));\nfs.mkdtempSync(path.join(os.tmpdir(), "beta-"));\n`,
    );
    const prefixes = discoverPrefixes(sources);
    assert.deepEqual(prefixes.sort(), ["alpha-", "beta-"]);
  } finally {
    fs.rmSync(sources, { recursive: true, force: true });
  }
});

test("discoverPrefixes ignores string literals without a trailing dash", () => {
  const sources = fs.mkdtempSync(path.join(tmpBase, "tmp-gc-disc2-"));
  try {
    fs.mkdirSync(path.join(sources, "scripts"), { recursive: true });
    fs.writeFileSync(
      path.join(sources, "scripts", "a.test.mjs"),
      `os.tmpdir(), "no-dash", os.tmpdir(), "yes-dash-"\n`,
    );
    assert.deepEqual(discoverPrefixes(sources), ["yes-dash-"]);
  } finally {
    fs.rmSync(sources, { recursive: true, force: true });
  }
});

test("the GC removes matching entries older than the age bound and keeps everything else", () => {
  withFixture(
    ({ root, sources }) => {
      const result = gc(["--root", root, "--sources", sources, "--max-age", "60"]);
      assert.equal(result.status, 0, `exit 0 (stdout: ${result.stdout})`);
      assert.match(result.stdout, /verdict: PASS/);
      assert.equal(fs.existsSync(path.join(root, "gc-fixture-old")), false, "the old matching dir is removed");
      assert.equal(fs.existsSync(path.join(root, "gc-fixture-fresh")), true, "the fresh matching dir survives");
      assert.equal(fs.existsSync(path.join(root, "unrelated-old")), true, "a non-matching dir survives");
      assert.match(result.stdout, /REMOVED/);
    },
    { entries: [["gc-fixture-old", 180], ["gc-fixture-fresh", 0], ["unrelated-old", 180]] },
  );
});

test("--dry-run reports the candidates and removes nothing", () => {
  withFixture(
    ({ root, sources }) => {
      const result = gc(["--root", root, "--sources", sources, "--max-age", "60", "--dry-run"]);
      assert.equal(result.status, 0, `exit 0 (stdout: ${result.stdout})`);
      assert.equal(fs.existsSync(path.join(root, "gc-fixture-old")), true, "dry-run removes nothing");
      assert.match(result.stdout, /dry-run: would remove 1/);
      assert.equal(fs.existsSync(path.join(root, "gc-fixture-fresh")), true);
    },
    { entries: [["gc-fixture-old", 180], ["gc-fixture-fresh", 0]] },
  );
});

test("--json emits one JSON object carrying the removals", () => {
  withFixture(
    ({ root, sources }) => {
      const result = gc(["--root", root, "--sources", sources, "--max-age", "60", "--json"]);
      assert.equal(result.status, 0);
      const parsed = JSON.parse(result.stdout);
      assert.equal(parsed.verdict, "PASS");
      assert.equal(parsed.removed.length, 1);
      assert.equal(parsed.removed[0], "gc-fixture-old");
    },
    { entries: [["gc-fixture-old", 180]] },
  );
});

test("a root equal to the filesystem root is refused", () => {
  withFixture(({ sources }) => {
    const result = gc(["--root", path.parse(tmpBase).root, "--sources", sources]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /refus/);
  });
});

test("a root equal to the sources tree is refused", () => {
  withFixture(({ sources }) => {
    const result = gc(["--root", sources, "--sources", sources]);
    assert.equal(result.status, 2);
  });
});

test("a missing --root value is a usage error", () => {
  const result = gc(["--root"]);
  assert.equal(result.status, 2);
});

test("a non-integer --max-age is a usage error", () => {
  withFixture(({ root, sources }) => {
    const result = gc(["--root", root, "--sources", sources, "--max-age", "soon"]);
    assert.equal(result.status, 2);
  });
});

test("a sources tree declaring no prefix yields zero candidates and passes", () => {
  const sources = fs.mkdtempSync(path.join(tmpBase, "tmp-gc-noprefix-"));
  const root = fs.mkdtempSync(path.join(tmpBase, "tmp-gc-empty-"));
  try {
    const result = gc(["--root", root, "--sources", sources]);
    assert.equal(result.status, 0, `exit 0 (stdout: ${result.stdout})`);
    assert.match(result.stdout, /prefixes: 0/);
    assert.match(result.stdout, /verdict: PASS/);
  } finally {
    fs.rmSync(sources, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("os.tmpdir() is a real directory this suite may rely on", () => {
  assert.equal(fs.existsSync(os.tmpdir()), true);
});
