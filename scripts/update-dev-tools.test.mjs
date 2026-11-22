#!/usr/bin/env node
// test-obligation: protects=scripts/update-dev-tools.mjs obligations=contract,failure-path

/**
 * update-dev-tools.test.mjs — the decision contract for the one-shot tool
 * updater. The updater refreshes only what is already present (installs stay
 * `setup-env`'s job), so the suite pins the plan, never the execution: plan
 * determinism, per-tool commands, honest skips and the fail-closed refusals.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { buildBunPinCommand, updatePlan } from "./update-dev-tools.mjs";

const unixBase = () => ({
  platform: "linux",
  bun: { present: true, version: "1.2.30" },
  bunPinned: "1.2.30",
  uv: { present: true, version: "0.9.0" },
  serena: { present: true, version: "0.1.0" },
  engram: { present: true, version: "0.4.0" },
  pi: { present: true, version: "1.0.0" },
  brew: { present: false },
  gentleEngram: { present: true, version: "1.0.0" },
  rg: { present: true },
});

/** The plan row for one tool: exactly once per plan. */
function rowOf(plan, tool) {
  const rows = plan.steps.filter((step) => step.tool === tool);
  assert.equal(rows.length, 1, `exactly one ${tool} row`);
  return rows[0];
}

test("plan is deterministic and covers every managed tool exactly once", () => {
  const plan = updatePlan(unixBase());
  assert.equal(plan.refused, null);
  assert.deepEqual(
    plan.steps.map((step) => step.tool),
    ["bun", "uv", "serena", "engram", "gentle-engram", "ripgrep"],
  );
});

test("bun at or above the pin refreshes in place; behind the pin installs the pinned build", () => {
  assert.equal(rowOf(updatePlan(unixBase()), "bun").command, "bun upgrade");

  const behind = updatePlan({ ...unixBase(), bun: { present: true, version: "1.2.10" }, bunPinned: "1.2.30" });
  const row = rowOf(behind, "bun");
  assert.equal(row.action, "upgrade");
  assert.match(row.command, /bun-v1\.2\.30/u, "the pinned installer names the .bun-version build");
  assert.match(row.command, /^curl -fsSL https:\/\/bun\.sh\/install/u);
});

test("upgrades never install: an absent tool is an honest skip naming setup-env", () => {
  const plan = updatePlan({
    ...unixBase(),
    uv: { present: false, version: null },
    serena: { present: false, version: null },
    engram: { present: false, version: null },
    gentleEngram: { present: false, version: null },
    bun: { present: false, version: null },
    rg: { present: false },
  });
  for (const step of plan.steps) {
    assert.equal(step.action, "skip", `${step.tool} must not be installed by the updater`);
    if (step.tool === "ripgrep") {
      assert.match(step.reason, /package manager/u, "the system binary names its real channel, never setup-env");
    } else {
      assert.match(step.reason, /setup-env/u, `${step.tool} skip names the install owner`);
    }
    assert.equal(step.command, null);
  }
});

test("serena present without uv skips instead of guessing a channel", () => {
  const row = rowOf(updatePlan({ ...unixBase(), uv: { present: false, version: null } }), "serena");
  assert.equal(row.action, "skip");
  assert.equal(row.command, null);
});

test("engram refreshes through the tarball seam; the pi package through pi", () => {
  const plan = updatePlan(unixBase());
  const engram = rowOf(plan, "engram");
  assert.equal(engram.action, "upgrade");
  assert.equal(engram.kind, "engram-tarball");
  assert.equal(rowOf(plan, "gentle-engram").command, "pi install npm:gentle-engram@latest");
});

test("gentle-engram present without pi skips — the updater never installs pi (S11)", () => {
  const row = rowOf(updatePlan({ ...unixBase(), pi: { present: false, version: null } }), "gentle-engram");
  assert.equal(row.action, "skip");
  assert.equal(row.command, null);
});

test("ripgrep upgrades through brew when it exists and honestly refuses a channel otherwise", () => {
  const brew = rowOf(updatePlan({ ...unixBase(), platform: "darwin", brew: { present: true } }), "ripgrep");
  assert.equal(brew.action, "upgrade");
  assert.equal(brew.command, "brew upgrade ripgrep");

  const unmanaged = rowOf(updatePlan(unixBase()), "ripgrep");
  assert.equal(unmanaged.action, "skip");
  assert.equal(unmanaged.command, null);
});

test("win32 is refused closed before any step is planned (WSL-only)", () => {
  const plan = updatePlan({ ...unixBase(), platform: "win32" });
  assert.notEqual(plan.refused, null);
  assert.equal(plan.steps.length, 0);
});

test("buildBunPinCommand keeps the official installer shape and quotes the tag", () => {
  assert.equal(
    buildBunPinCommand("1.2.30"),
    'curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.30"',
  );
});
