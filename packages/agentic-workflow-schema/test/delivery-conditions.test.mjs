import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DELIVERY_CONDITION_FINDINGS,
  DELIVERY_CONDITION_KINDS,
  DELIVERY_CONDITION_REFUSALS,
  DELIVERY_CONDITION_VERDICTS,
} from "../dist/index.js";

// Issue #704: a condition that gates delivery names a carrier the machine
// re-checks. The four closed sets are the canonical declaration — the runner
// module imports them instead of restating them, and the root suite's parity case
// compares the issue process's declared table against the same tokens.
const SETS = {
  DELIVERY_CONDITION_KINDS: ["covered-by", "reopen-when", "proceeds-when", "waits-for", "retire-when"],
  DELIVERY_CONDITION_VERDICTS: ["satisfied", "pending", "stalled", "unresolved"],
  DELIVERY_CONDITION_FINDINGS: ["covered-by-open", "condition-stalled", "condition-uncarried"],
  DELIVERY_CONDITION_REFUSALS: ["covered-by-open"],
};

test("the delivery-condition sets publish the issue's own tokens, in order", () => {
  assert.deepEqual([...DELIVERY_CONDITION_KINDS], SETS.DELIVERY_CONDITION_KINDS);
  assert.deepEqual([...DELIVERY_CONDITION_VERDICTS], SETS.DELIVERY_CONDITION_VERDICTS);
  assert.deepEqual([...DELIVERY_CONDITION_FINDINGS], SETS.DELIVERY_CONDITION_FINDINGS);
  assert.deepEqual([...DELIVERY_CONDITION_REFUSALS], SETS.DELIVERY_CONDITION_REFUSALS);
});

test("each set is frozen, unique and slug-shaped", () => {
  for (const [name, values] of Object.entries(SETS)) {
    const published = {
      DELIVERY_CONDITION_KINDS,
      DELIVERY_CONDITION_VERDICTS,
      DELIVERY_CONDITION_FINDINGS,
      DELIVERY_CONDITION_REFUSALS,
    }[name];
    assert.equal(Object.isFrozen(published), true, `${name} is frozen`);
    assert.equal(new Set(published).size, published.length, `${name} has no duplicate member`);
    for (const token of values) assert.match(token, /^[a-z][a-z0-9-]*$/u, `${name}: ${token} is a lowercase slug`);
  }
});
