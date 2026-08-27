// P13 registration — the executable documentation suite named by AC7/P14.
//
// This file is the harness `npm run test:verification-docs` drives. P13 owns the
// wiring (the command exists, resolves, and asserts the facts that must hold for
// any documentation work); P14 owns the content assertions — example extraction
// and compilation, EN/ES semantic parity, the limits/budgets reference and the
// deferred AWL boundary. The coverage list below is what P14 must extend, so the
// handoff is visible in the suite rather than implied.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readme = () => readFileSync(new URL("../README.md", import.meta.url), "utf8");
const readmeEs = () => readFileSync(new URL("../README.es.md", import.meta.url), "utf8");

test("both language references exist and carry content", () => {
  for (const [name, text] of [["README.md", readme()], ["README.es.md", readmeEs()]]) {
    assert.ok(text.length > 4000, `${name} is unexpectedly short (${text.length} chars)`);
    assert.match(text, /^# /m, `${name} has no top-level heading`);
  }
});

test("the verification surface is documented in both languages", () => {
  // Topic anchors, not sentences. P14 extends this list with the generated
  // projections, every D14 limit/aggregate budget and the deferred AWL boundary —
  // each of those is absent from both references today, so adding them here would
  // pre-empt P14's own red-first evidence.
  const topics = [
    /validateVerificationPlanV1/,
    /validateVerificationReceiptAgainstPlan/,
  ];
  const [en, es] = [readme(), readmeEs()];
  for (const topic of topics) {
    assert.match(en, topic, "README.md does not name the topic");
    assert.match(es, topic, "README.es.md does not name the topic");
  }
});

test("npm run test:verification-docs is the command the acceptance names", () => {
  const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(
    manifest.scripts["test:verification-docs"],
    "node --test test/verification-docs.test.mjs",
    "the docs command must drive this file",
  );
});
