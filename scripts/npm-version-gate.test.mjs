#!/usr/bin/env node

/**
 * npm-version-gate.test.mjs — the publish gate that replaced "local ≠ latest".
 *
 * Incident (2026-09-27, run 36355201053): main reverted a version bump, so the
 * local version went 0.18.0 → 0.17.0 while the registry's `latest` stayed at
 * 0.18.0 and 0.17.0 was itself already on the registry. The old gate compared
 * local against `npm view <name> version` (the `latest` dist-tag): 0.17.0 ≠
 * 0.18.0 read as "must publish", and npm rejected the run with
 * `EBADVERSION — You cannot publish over the previously published versions:
 * 0.17.0`. The question the gate must ask is exact-version membership, never
 * dist-tag equality — so the regression case below is the first test here.
 *
 * Covers:
 *   - REGRESSION: local already published but not `latest` → skip, no publish
 *   - local == registry's only version → skip (the pre-incident green path)
 *   - local newer than every published version → publish
 *   - registry empty / lookup failed → publish (first publish stays manual)
 *   - npm's single-version `--json` string quirk is accepted
 *   - stdout is `$GITHUB_OUTPUT`-shaped; exit 2 fails closed on a bad path
 *   - all three publish workflows call this gate and none keep the old
 *     `npm view … version` dist-tag comparison
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { decidePublish } from "./npm-version-gate.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(repoRoot, "scripts", "npm-version-gate.mjs");
const WORKFLOWS = [
  "publish-pi-package.yml",
  "publish-schema.yml",
  "publish-agentic-workflow.yml",
].map((f) => path.join(repoRoot, ".github", "workflows", f));

const run = (args, { cwd = repoRoot } = {}) =>
  spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", cwd });

const writePkg = (version) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "npm-version-gate-"));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "@fixture/pkg", version }));
  return path.join(dir, "package.json");
};

// ---------------------------------------------------------------------------
// The decision (pure)
// ---------------------------------------------------------------------------

test("REGRESSION: a version already on the registry skips even when it is not latest", () => {
  // The exact state of 2026-09-27: local 0.17.0 after the revert, registry
  // [0.17.0, 0.18.0] with 0.18.0 as latest. Old gate → publish → EBADVERSION.
  const decision = decidePublish({ local: "0.17.0", published: ["0.16.0", "0.17.0", "0.18.0"] });
  assert.equal(decision.publish, false, "an already-published version must never reach `npm publish`");
  assert.match(decision.notice ?? "", /0\.18\.0/, "the skip must say which version actually holds `latest`");
});

test("local equals the registry's only version → skip (the pre-incident green path)", () => {
  assert.deepEqual(decidePublish({ local: "0.17.0", published: ["0.17.0"] }), { publish: false, notice: null });
});

test("local newer than every published version → publish", () => {
  const decision = decidePublish({ local: "0.18.1", published: ["0.16.0", "0.17.0", "0.18.0"] });
  assert.equal(decision.publish, true);
  assert.equal(decision.notice, null);
});

test("registry empty → publish (the first publish is manual, the gate must not swallow it)", () => {
  assert.equal(decidePublish({ local: "0.1.0", published: [] }).publish, true);
});

test("registry lookup failed → publish, with a notice that the check did not run", () => {
  const decision = decidePublish({ local: "0.18.1", published: null, lookupError: true });
  assert.equal(decision.publish, true);
  assert.match(decision.notice ?? "", /without a version check/);
});

test("npm's single-version `--json` string is treated as a one-element list", () => {
  assert.equal(decidePublish({ local: "4.5.0", published: "4.5.0" }).publish, false);
});

test("a lower version that is NOT on the registry still publishes, flagging the backwards move", () => {
  const decision = decidePublish({ local: "0.17.5", published: ["0.17.0", "0.18.0"] });
  assert.equal(decision.publish, true, "npm accepts any unpublished version — the gate reports, it does not veto");
  assert.match(decision.notice ?? "", /backwards/);
});

// ---------------------------------------------------------------------------
// The CLI (what each workflow appends to $GITHUB_OUTPUT)
// ---------------------------------------------------------------------------

test("stdout is $GITHUB_OUTPUT-shaped and the run exits 0", () => {
  const pkg = writePkg("0.17.0");
  const res = run(["--package", pkg, "--published", '["0.17.0","0.18.0"]']);
  assert.equal(res.status, 0, res.stderr);
  const lines = res.stdout.trim().split("\n");
  assert.equal(lines[0], "publish=false");
  assert.ok(lines.every((l) => /^[a-z]+=.*/.test(l)), `every stdout line must be key=value: ${res.stdout}`);
});

test("stdout carries publish=true with no notice when nothing is hidden", () => {
  const pkg = writePkg("0.19.0");
  const res = run(["--package", pkg, "--published", '["0.18.0"]']);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(res.stdout.trim(), "publish=true");
});

test("an unreadable package path fails closed (exit 2 — never a silent publish decision)", () => {
  const res = run(["--package", "/nonexistent/package.json", "--published", "[]"]);
  assert.equal(res.status, 2);
  assert.equal(res.stdout, "");
});

test("malformed --published input fails closed (exit 2)", () => {
  const pkg = writePkg("0.1.0");
  const res = run(["--package", pkg, "--published", "not-json"]);
  assert.equal(res.status, 2);
  assert.equal(res.stdout, "");
});

test("an unknown flag is a usage error (exit 2)", () => {
  const res = run(["--frobnicate"]);
  assert.equal(res.status, 2);
});

// ---------------------------------------------------------------------------
// The wiring (all three publish workflows)
// ---------------------------------------------------------------------------

test("every publish workflow routes the decision through the gate script", () => {
  for (const file of WORKFLOWS) {
    const text = fs.readFileSync(file, "utf8");
    const name = path.basename(file);
    assert.match(text, /scripts\/npm-version-gate\.mjs/, `${name} must call scripts/npm-version-gate.mjs`);
    assert.match(text, /steps\.version\.outputs\.notice/, `${name} must surface the gate's notice as an annotation`);
  }
});

test("no publish workflow still compares the local version to the latest dist-tag", () => {
  for (const file of WORKFLOWS) {
    const text = fs.readFileSync(file, "utf8");
    const name = path.basename(file);
    assert.ok(!text.includes('PUBLISHED=$(npm view'), `${name} still runs the dist-tag comparison that failed on 2026-09-27`);
    assert.ok(!text.includes('if [ "$LOCAL" = "$PUBLISHED" ]'), `${name} still tests dist-tag equality`);
  }
});
