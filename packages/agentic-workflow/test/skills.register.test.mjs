/**
 * skills.register.test.mjs — issue #591 S5: lifecycle registration and decay.
 *
 * An installed external skill is registered in the guide's "Optional review
 * extras" note as one `review-extras@1` row, and the inventory reads it back
 * with a closed state. The two invariants the suite pins: a row never loses a
 * cell (an incomplete registration is refused before any byte moves), and the
 * decay decision is pure — the same cells and the same `as-of` produce the same
 * state, with no clock read inside the library.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REVIEW_EXTRAS_CONTRACT_ID,
  REVIEW_EXTRAS_HEADING,
  SKILL_EXTRA_STATES,
  SkillExtrasRefusal,
  inventoryExtras,
  parseReviewExtras,
  registerReviewExtra,
} from "../src/skills/register.mjs";
import { GUIDE_WITHOUT_NOTE } from "./skills.fixtures.mjs";

const ROW = {
  name: "framework-review",
  source: "https://github.com/example/framework-review",
  pin: "2.1.0",
  installed: "2026-11-16",
  axis: "review-design",
};

test("the published grammar and state set are the closed ones this unit declares", () => {
  assert.equal(REVIEW_EXTRAS_CONTRACT_ID, "review-extras@1");
  assert.equal(REVIEW_EXTRAS_HEADING, "Optional review extras");
  assert.deepEqual([...SKILL_EXTRA_STATES], ["ok", "unpinned", "stale", "incomplete"]);
});

test("an absent note is created with its heading and its block, then read back", () => {
  const { text, changed } = registerReviewExtra({ guideText: GUIDE_WITHOUT_NOTE, ...ROW });
  assert.equal(changed, "created");
  assert.match(text, /^### Optional review extras$/mu);
  assert.match(text, /^review-extras@1$/mu);
  assert.match(text, /^name \| source \| pin \| installed \| axis$/mu);
  assert.match(text, /^framework-review \| https:\/\/github\.com\/example\/framework-review \| 2\.1\.0 \| 2026-11-16 \| review-design$/mu);
  // The guide's own bytes survive untouched.
  assert.ok(text.startsWith(GUIDE_WITHOUT_NOTE), "the existing guide is a prefix, never rewritten");

  const parsed = parseReviewExtras(text);
  assert.equal(parsed.present, true);
  assert.deepEqual(parsed.rows, [{ ...ROW }]);
});

test("a second registration appends a row and keeps the first", () => {
  const first = registerReviewExtra({ guideText: GUIDE_WITHOUT_NOTE, ...ROW });
  const second = registerReviewExtra({ guideText: first.text, ...ROW, name: "a11y-review", axis: "review-a11y" });
  assert.equal(second.changed, "appended");
  const rows = parseReviewExtras(second.text).rows;
  assert.deepEqual(rows.map((row) => row.name), ["framework-review", "a11y-review"]);
});

test("a duplicate name is refused and the guide is unchanged", () => {
  const first = registerReviewExtra({ guideText: GUIDE_WITHOUT_NOTE, ...ROW });
  assert.throws(() => registerReviewExtra({ guideText: first.text, ...ROW }), SkillExtrasRefusal);
  assert.equal(first.text, registerReviewExtra({ guideText: GUIDE_WITHOUT_NOTE, ...ROW }).text);
});

test("an incomplete registration is refused before any byte moves", () => {
  for (const field of ["name", "source", "pin", "installed", "axis"]) {
    assert.throws(() => registerReviewExtra({ guideText: GUIDE_WITHOUT_NOTE, ...ROW, [field]: "" }), SkillExtrasRefusal, field);
  }
  assert.throws(() => registerReviewExtra({ guideText: GUIDE_WITHOUT_NOTE, ...ROW, installed: "16/11/2026" }), SkillExtrasRefusal);
  assert.throws(() => registerReviewExtra({ guideText: GUIDE_WITHOUT_NOTE, ...ROW, installed: "2026-02-30" }), SkillExtrasRefusal);
});

test("the inventory reports the four states from the row's own cells", () => {
  const guide = [
    { ...ROW, name: "ok-row" },
    { ...ROW, name: "unpinned-row", pin: "latest" },
    { ...ROW, name: "stale-row", installed: "2025-01-01" },
  ].reduce((text, row) => registerReviewExtra({ guideText: text, ...row }).text, GUIDE_WITHOUT_NOTE);
  // The incomplete row is a hand-edited one — exactly the drift the inventory
  // exists to catch, and the reason `register` refuses it on the way in.
  const withBrokenRow = guide.replace(
    /^(stale-row \|.*)$/mu,
    `$1\nincomplete-row | https://github.com/example/f | 1.0.0 | 2026-11-16 | `,
  );

  const report = inventoryExtras({ guideText: withBrokenRow, asOf: "2026-11-16", maxAgeDays: 180 });
  assert.deepEqual(
    report.rows.map((row) => [row.name, row.state]),
    [
      ["ok-row", "ok"],
      ["unpinned-row", "unpinned"],
      ["stale-row", "stale"],
      ["incomplete-row", "incomplete"],
    ],
  );
  assert.equal(report.rows[2].ageDays, 684);
  assert.equal(report.verdict, "attention");
});

test("the inventory is deterministic and reads no clock", () => {
  const guide = registerReviewExtra({ guideText: GUIDE_WITHOUT_NOTE, ...ROW }).text;
  const a = inventoryExtras({ guideText: guide, asOf: "2026-11-16", maxAgeDays: 180 });
  const b = inventoryExtras({ guideText: guide, asOf: "2026-11-16", maxAgeDays: 180 });
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.rows.map((row) => row.state), inventoryExtras({ guideText: guide, asOf: "2027-11-16", maxAgeDays: 180 }).rows.map((row) => row.state));
});

test("a guide without the note reports present: false and an empty ledger", () => {
  const parsed = parseReviewExtras(GUIDE_WITHOUT_NOTE);
  assert.equal(parsed.present, false);
  assert.deepEqual(parsed.rows, []);
  assert.equal(inventoryExtras({ guideText: GUIDE_WITHOUT_NOTE, asOf: "2026-11-16", maxAgeDays: 180 }).verdict, "pass");
});

test("a global default is not a silent suppression: an out-of-range max age is refused", () => {
  assert.throws(() => inventoryExtras({ guideText: GUIDE_WITHOUT_NOTE, asOf: "2026-11-16", maxAgeDays: 0 }), SkillExtrasRefusal);
  assert.throws(() => inventoryExtras({ guideText: GUIDE_WITHOUT_NOTE, asOf: "whenever", maxAgeDays: 180 }), SkillExtrasRefusal);
});
