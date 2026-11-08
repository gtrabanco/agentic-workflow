import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PASS_NAMES } from "../dist/index.js";

const packageFile = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));

// Issue #201 S1: the pass-name vocabulary is exactly the eleven spawned review
// passes the issue's Mechanics 1 names. `passes.default` is deliberately NOT a
// member: it is the config-layer escape hatch for unlisted passes (owner
// decision 2026-10-12), not a spawned pass itself.
test("PASS_NAMES publishes the issue's eleven review-pass names, in order", () => {
  assert.deepEqual([...PASS_NAMES], [
    "review-code",
    "review-security",
    "review-verify",
    "review-design",
    "review-a11y",
    "review-brand",
    "review-perf",
    "review-seo",
    "verify",
    "classify",
    "debt",
  ]);
});

test("PASS_NAMES is a frozen, unique, slug-shaped closed set", () => {
  assert.equal(Object.isFrozen(PASS_NAMES), true, "the published vocabulary is frozen");
  assert.equal(new Set(PASS_NAMES).size, PASS_NAMES.length, "no duplicate member");
  for (const token of PASS_NAMES) {
    assert.match(token, /^[a-z][a-z0-9-]*$/u, `member ${token} is a lowercase slug`);
  }
});

test("the README's pass-routing vocabulary section restates exactly the published set", () => {
  const readme = readFileSync(packageFile("README.md"), "utf8");
  const section = readme.split(/^## Review-pass routing vocabularies /m)[1];
  assert.ok(section, "the README carries the Review-pass routing vocabularies section");
  for (const token of PASS_NAMES) {
    assert.ok(section.includes(`\`${token}\``), `the README section names ${token}`);
  }
  assert.ok(section.includes("`passes.default`"), "the README section documents the passes.default escape");
});
