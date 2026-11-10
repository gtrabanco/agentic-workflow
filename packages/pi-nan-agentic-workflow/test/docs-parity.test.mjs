// docs-parity.test.mjs — the companion README is the human-facing source of
// truth for the preset (issue #388: the NaN guidance moved here from the root
// README). Two directions are pinned (amendment 2): every model any profile
// routes to is documented, and the README's balanced-ladder table agrees with
// the preset on each rung-1 pick.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PROFILE_LADDERS, PROFILES } from "../dist/preset.js";

const readme = () => readFileSync(new URL("../README.md", import.meta.url), "utf8");

test("parity: every model any profile routes to is documented in the companion README", () => {
  const doc = readme();
  const routed = new Set(
    Object.values(PROFILE_LADDERS).flatMap((ladder) =>
      [ladder.default, ...Object.values(ladder.commands)]
        .filter(Boolean)
        .flatMap((route) => route.model ?? []),
    ),
  );
  assert.ok(routed.size >= 6, `expected the four profiles to route several models, got: ${[...routed]}`);
  for (const modelRef of routed) {
    const id = modelRef.split("/")[1];
    assert.ok(doc.includes(`**${id}**`) || doc.includes(`\`${id}\``), `the companion README does not document \`${id}\``);
  }
});

const README_ROWS = [
  ["Merge gates", "audit-pr"],
  ["Product definition", "unit-lane"],
  ["Planning / triage", "review-change"],
  ["Execution / mechanical", "execute-phase"],
  ["Cheap", "log-session"],
];

/** Row cells split on ` | `; cell 0 = task, cell 1 = skills, cells 2-5 = the
 *  four posture columns in the header's order (Quality, Balanced, Economy,
 *  No-credits). */
const rung1Of = (doc, task, profile) => {
  const row = new RegExp(`^\\| \\*\\*${task}\\*\\* \\|.*$`, "mu").exec(doc);
  assert.ok(row, `the README has no ladder row for ${task}`);
  const cells = row[0].split(" | ");
  assert.equal(cells.length, 6, `the ${task} row must carry task + skills + the four posture columns`);
  const column = cells[2 + PROFILES.indexOf(profile)];
  const model = /1\. \*\*([^*]+)\*\*/.exec(column);
  assert.ok(model, `the ${task} row declares no ${profile} rung 1`);
  return model[1];
};

test("parity: the README's per-profile ladder tables and the preset agree on every rung 1", () => {
  const doc = readme();
  for (const profile of PROFILES) {
    for (const [task, skill] of README_ROWS) {
      const expected = PROFILE_LADDERS[profile].commands[skill].model[0].split("/")[1];
      assert.equal(
        rung1Of(doc, task, profile),
        expected,
        `${profile} ${task} rung 1: the README table and the preset disagree`,
      );
    }
  }
});
