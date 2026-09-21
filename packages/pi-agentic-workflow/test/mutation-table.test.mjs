// mutation-table.test.mjs — the cheap half of `bun run mutation`.
//
// The full run applies every mutant to a mirror of the repository: minutes of
// build-and-test work, so it is not in the ordinary gate. Two failure modes it
// can only report at the end of that run are checkable here in milliseconds:
//
//  - a needle that no longer occurs in its source. The mutation is then never
//    applied and the suite cannot fail, so the row keeps claiming a rule that
//    nothing verifies. That is exactly the state this file was added in.
//  - a row pointing at a source file or suite that does not exist.
//
// Neither check builds anything, so both run on every `bun test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { MUTANTS, findStaleNeedles } from "../scripts/mutation-check.mjs";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

test("mutation table: every needle still occurs in its source file", () => {
  assert.deepEqual(
    findStaleNeedles(),
    [],
    "a stale needle means the mutant is never applied and its rule is unverified — re-point the row at the current source",
  );
});

test("mutation table: every row names an existing source file and test suite", () => {
  const missing = [];
  for (const mutant of MUTANTS) {
    if (!existsSync(join(PKG_DIR, mutant.file))) missing.push(`source ${mutant.file}`);
    if (!existsSync(join(PKG_DIR, "test", `${mutant.suite}.test.mjs`))) missing.push(`suite ${mutant.suite}`);
  }
  assert.deepEqual(missing, []);
});

test("mutation table: every row actually mutates and names the rule it breaks", () => {
  const vacuous = MUTANTS.filter((mutant) => mutant.from === mutant.to).map((mutant) => `${mutant.rule} (${mutant.file})`);
  const unnamed = MUTANTS.filter((mutant) => !mutant.rule || mutant.rule.trim() === "").map((mutant) => mutant.file);
  assert.deepEqual(vacuous, []);
  assert.deepEqual(unnamed, []);
  assert.ok(MUTANTS.length > 0, "an empty table would report a clean run");
});
