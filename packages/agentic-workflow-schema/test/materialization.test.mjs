import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ARTIFACT_EVIDENCE_KINDS,
  MATERIALIZATION_FINDING_CODES,
  MATERIALIZATION_OUTCOMES,
} from "../dist/index.js";

// Issue #564 S1/S5: the three routes a prose-only boundary may take. The set is
// closed because every route writes a row the check reads back — a fourth token
// in prose and not here would be a route no receipt can record.
test("MATERIALIZATION_OUTCOMES publishes the three routes, in the order a round offers them", () => {
  assert.deepEqual([...MATERIALIZATION_OUTCOMES], ["scaffold", "issue", "declined"]);
});

// Issue #564 S4/S9: every code names a declared-but-unmaterialized state.
test("MATERIALIZATION_FINDING_CODES is the closed, sorted set the check emits", () => {
  assert.deepEqual([...MATERIALIZATION_FINDING_CODES], [
    "artifact-evidence-missing",
    "boundary-artifact-missing",
    "boundary-declared-unenforced",
    "evidence-driver-missing",
    "feature-map-missing",
    "feature-map-shape",
  ]);
});

// Issue #564 S3: the capture shapes a criterion may demand evidence for.
test("ARTIFACT_EVIDENCE_KINDS publishes the three capture shapes", () => {
  assert.deepEqual([...ARTIFACT_EVIDENCE_KINDS], ["screenshot", "video", "state-snapshot"]);
});

test("the three vocabularies are frozen, unique and kebab-case", () => {
  for (const [name, values] of [
    ["MATERIALIZATION_OUTCOMES", MATERIALIZATION_OUTCOMES],
    ["MATERIALIZATION_FINDING_CODES", MATERIALIZATION_FINDING_CODES],
    ["ARTIFACT_EVIDENCE_KINDS", ARTIFACT_EVIDENCE_KINDS],
  ]) {
    assert.equal(Object.isFrozen(values), true, `${name} is frozen`);
    assert.equal(new Set(values).size, values.length, `${name} has no duplicate token`);
    for (const value of values) assert.match(value, /^[a-z][a-z0-9-]*$/u, `${name}:${value} is kebab-case`);
  }
});
