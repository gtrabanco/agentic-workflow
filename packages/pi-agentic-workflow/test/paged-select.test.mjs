// paged-select.test.mjs — AC6 (fix #214, PE-001, PE-012)
//
// Pi-web rejects a select dialog that offers more than 24 options
// (`EXTENSION_DIALOG_OPTION_LIMIT = 24`, PE-001). `pagedSelect` is the one helper
// that keeps every dialog the console and its adapter build under that cap: one
// dialog while the list fits, 21-item pages with `◀ Previous page` /
// `More options…` pager entries when it does not, and the caller's trailing
// option (`Type another reference…`) last on every dialog. Written red-first:
// the helper did not exist when this landed.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  pagedSelect,
  PAGED_SELECT_NEXT,
  PAGED_SELECT_PREV,
  SELECT_OPTION_LIMIT,
} from "../dist/settings/picker.js";

const TRAILING = "Type another reference…";

/** A scripted select: records every dialog it was asked, answers from a queue. */
function scriptedSelect(answers) {
  const calls = [];
  return {
    calls,
    select: async (title, options) => {
      calls.push({ title, options: [...options] });
      if (answers.length === 0) throw new Error("scriptedSelect exhausted its answers");
      return answers.shift();
    },
  };
}

/** `option-01` … `option-nn`, so sort order and page membership are obvious. */
const options = (n) => Array.from({ length: n }, (_, i) => `option-${String(i + 1).padStart(2, "0")}`);

test("AC6: a list plus its trailing option that fits the cap opens exactly one dialog", async () => {
  const exact = scriptedSelect(["option-03"]);
  assert.equal(await pagedSelect(exact.select, "Pick", options(24)), "option-03");
  assert.equal(exact.calls.length, 1, "24 data options fit one dialog");
  assert.equal(exact.calls[0].options.length, 24);

  const withTrailing = scriptedSelect([TRAILING]);
  assert.equal(await pagedSelect(withTrailing.select, "Pick", options(23), { trailing: TRAILING }), TRAILING);
  assert.equal(withTrailing.calls.length, 1, "23 data options + trailing fit one dialog");
  assert.equal(withTrailing.calls[0].options.length, 24);
  assert.equal(withTrailing.calls[0].options.at(-1), TRAILING, "the trailing option stays last");
});

test("AC6: a 30-item list pages 21 per dialog and never exceeds SELECT_OPTION_LIMIT", async () => {
  const { calls, select } = scriptedSelect([PAGED_SELECT_NEXT, "option-25"]);
  assert.equal(await pagedSelect(select, "Pick", options(30), { trailing: TRAILING }), "option-25");

  assert.equal(calls.length, 2, "the operator navigated once");
  assert.ok(calls.every((call) => call.options.length <= SELECT_OPTION_LIMIT), "every dialog is under the cap");
  assert.deepEqual(
    calls[0].options,
    [...options(21), PAGED_SELECT_NEXT, TRAILING],
    "page 1 is 21 data options, then NEXT, then the trailing option",
  );
  assert.deepEqual(
    calls[1].options,
    [...options(30).slice(21), PAGED_SELECT_PREV, TRAILING],
    "page 2 is the remainder, then PREV, then the trailing option",
  );
});

test("AC6: PREV navigates back to the previous page", async () => {
  const { calls, select } = scriptedSelect([PAGED_SELECT_NEXT, PAGED_SELECT_PREV, "option-02"]);
  assert.equal(await pagedSelect(select, "Pick", options(30)), "option-02");

  assert.equal(calls.length, 3);
  assert.equal(calls[1].options[0], "option-22", "the second dialog is page 2");
  assert.equal(calls[2].options[0], "option-01", "PREV brought page 1 back");
});

test("AC6: the trailing option is last on every page, and 21 + two pagers + trailing is still within the cap", async () => {
  const { calls, select } = scriptedSelect([PAGED_SELECT_NEXT, PAGED_SELECT_NEXT, "option-43"]);
  assert.equal(await pagedSelect(select, "Pick", options(45), { trailing: TRAILING }), "option-43");

  assert.equal(calls.length, 3, "45 items span three pages");
  assert.ok(calls.every((call) => call.options.length <= SELECT_OPTION_LIMIT));
  assert.ok(calls.every((call) => call.options.at(-1) === TRAILING), "the trailing option is the last entry of every page");
  assert.equal(calls[1].options.length, SELECT_OPTION_LIMIT, "a middle page is exactly 21 data + PREV + NEXT + trailing");
});

test("AC6: an undefined answer passes straight through and stops the dialog", async () => {
  const { calls, select } = scriptedSelect([undefined]);
  assert.equal(await pagedSelect(select, "Pick", options(30), { trailing: TRAILING }), undefined);
  assert.equal(calls.length, 1, "a cancelled dialog is never re-opened");
});

test("AC6: 24 options and 23 + trailing fit; one more option pages", async () => {
  const atLimit = scriptedSelect(["option-24"]);
  await pagedSelect(atLimit.select, "Pick", options(24));
  assert.equal(atLimit.calls.length, 1, "24 options fit exactly");

  const withTrailing = scriptedSelect([TRAILING]);
  await pagedSelect(withTrailing.select, "Pick", options(23), { trailing: TRAILING });
  assert.equal(withTrailing.calls.length, 1, "23 + trailing fit exactly");

  const overLimit = scriptedSelect([PAGED_SELECT_NEXT, "option-25"]);
  await pagedSelect(overLimit.select, "Pick", options(24), { trailing: TRAILING });
  assert.equal(overLimit.calls.length, 2, "24 + trailing is one over the cap and pages");

  const twentyFive = scriptedSelect([PAGED_SELECT_NEXT, "option-25"]);
  await pagedSelect(twentyFive.select, "Pick", options(25));
  assert.equal(twentyFive.calls.length, 2, "25 data options page");
});

test("AC6: no dialog exceeds the cap at any list length, and the chosen value is returned", async () => {
  for (const n of [1, 20, 21, 22, 23, 24, 25, 30, 42, 43, 44, 45, 60, 100]) {
    const list = options(n);
    const last = list.at(-1);
    const pages = n + 1 <= SELECT_OPTION_LIMIT ? 1 : Math.ceil(n / 21);
    const answers = [...Array(Math.max(0, pages - 1)).fill(PAGED_SELECT_NEXT), last];
    const { calls, select } = scriptedSelect(answers);

    assert.equal(await pagedSelect(select, "Pick", list, { trailing: TRAILING }), last, `returns the picked value at n=${n}`);
    assert.ok(
      calls.every((call) => call.options.length <= SELECT_OPTION_LIMIT),
      `every dialog is under the cap at n=${n}: ${calls.map((call) => call.options.length).join(", ")}`,
    );
    assert.ok(calls.every((call) => call.options.at(-1) === TRAILING), `trailing stays last at n=${n}`);
  }
});
