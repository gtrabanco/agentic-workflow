// runner-launch.test.mjs — pi's consumption of the one runner resolver (issue #555).
//
// pi never chooses a runner in prose: the crate ships as this package's own
// dependency, so the first answer is its bin under the runtime that launched pi.
// The choice only exists when that dependency is missing, and there it is the
// crate's resolver — one implementation, the same closed set and the same
// engine floors the crate's own suite pins.
//
// Two facts this suite owns, beyond the resolver's own cases:
//
//  - **The documented override is honoured, spaced form included.** RUNNER.md
//    documents `AGENTIC_WORKFLOW_RUNNER="bun /absolute/path"`; the previous
//    `runner-bin` ignored any override containing a space and silently used the
//    installed bin, so the escape hatch did not work in pi.
//  - **pi passes what only pi knows.** The installed candidate (bin path plus
//    the runtime that launched pi) travels to the resolver; pi never re-implements
//    the order, the floors or the refusal.

import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  RunnerUnavailableError,
  installedCandidate,
  runnerBin,
  runnerLaunch,
} from "../dist/runner-bin.js";

const CRATE = "@gtrabanco/agentic-workflow";
const crateVersion = JSON.parse(readFileSync(new URL(`../../agentic-workflow/package.json`, import.meta.url), "utf8")).version;
const crateBin = new URL(`../../agentic-workflow/bin/agentic-workflow.mjs`, import.meta.url).pathname;

/** A PATH holding only the programs the case declares, each printing its version. */
function fixturePath(t, programs) {
  const dir = mkdtempSync(join(tmpdir(), "paw555-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [name, version] of Object.entries(programs)) {
    const file = join(dir, name);
    writeFileSync(file, `#!/bin/sh\nprintf '%s\\n' '${version}'\n`);
    chmodSync(file, 0o755);
  }
  return dir;
}

const args = ["workflow-status", "--json-only"];

test("the installed crate bin is pi's first answer, under the pi runtime", async () => {
  assert.notEqual(runnerBin(), null, "this package resolves its own dependency in a working tree");
  const answer = await runnerLaunch(args, { installed: installedCandidate("node") });
  assert.equal(answer.source, "installed");
  assert.equal(answer.program, "node");
  assert.deepEqual(answer.argv, ["node", crateBin, ...args]);
});

test("the documented spaced override wins and is tokenised", async () => {
  const answer = await runnerLaunch(args, {
    env: { PATH: "", AGENTIC_WORKFLOW_RUNNER: "bun /tmp/checkout/bin/agentic-workflow.mjs" },
    installed: { program: "node", script: crateBin },
  });
  assert.equal(answer.source, "AGENTIC_WORKFLOW_RUNNER");
  assert.deepEqual(answer.argv, ["bun", "/tmp/checkout/bin/agentic-workflow.mjs", ...args]);
});

test("without an installed candidate the crate's closed set decides, floors included", async (t) => {
  const dir = fixturePath(t, { bun: "1.0.0", node: "26.13.0" });
  const answer = await runnerLaunch(args, { env: { PATH: dir, AGENTIC_WORKFLOW_RUNNER: "" }, installed: null });
  assert.equal(answer.source, "npx", "a bun below the crate's engines floor never launches the crate");
  assert.deepEqual(answer.argv, ["npx", "--yes", `${CRATE}@${crateVersion}`, ...args]);
});

test("with nothing resolvable pi fails closed naming the dependency and the override", async (t) => {
  const dir = fixturePath(t, {});
  await assert.rejects(
    () => runnerLaunch(args, { env: { PATH: dir, AGENTIC_WORKFLOW_RUNNER: "" }, installed: null }),
    (error) => {
      assert.ok(error instanceof RunnerUnavailableError, "the refusal is typed");
      assert.match(error.message, /no runner resolved/u);
      assert.match(error.message, /AGENTIC_WORKFLOW_RUNNER/u);
      return true;
    },
  );
});
