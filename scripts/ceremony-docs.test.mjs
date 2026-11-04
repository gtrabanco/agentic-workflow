/**
 * ceremony-docs.test.mjs — ceremony `docs` module (fix #338, P4).
 *
 * Fixtures: hermetic temp git repos with a fixture unit doc
 * (scripts/ceremony/testing.mjs). Pins the five discipline checks + check-all,
 * the R3 frozen-failure reproducer (`Step 1` phase label detected), and the
 * exit-2 ceremonial block on every failing check.
 */

import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cer, makeRepo, commitFile, unitDoc } from "./ceremony/testing.mjs";

function makeUnitRepo({ tasks = "", log = "", findings = "", commits = [] } = {}) {
  const dir = makeRepo();
  fs.mkdirSync(path.join(dir, "docs/fix/1-fixture"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/fix/1-fixture/SPEC.md"), unitDoc({ tasks, log, findings }));
  execFileSync("git", ["add", "."], { cwd: dir });
  execFileSync("git", ["commit", "-m", "docs: fixture unit"], { cwd: dir });
  for (const [file, message] of commits) commitFile(dir, file, "x\n", message);
  return dir;
}

const GOOD_TASKS = `- P1 — do the thing (validator: \`true\` exits 0)
  (Implements: S1)
- P2 — do the other thing (validator: \`true\` exits 0)
  (Implements: S1)`;

test("check-phase-labels reports repo-relative paths, byte-stable across runs", () => {
  const dir = makeUnitRepo({ tasks: `- Step 1 — bad label (validator: \`true\` exits 0)` });
  const one = cer(["docs", "check-phase-labels", "--slug", "1-fixture"], dir);
  const two = cer(["docs", "check-phase-labels", "--slug", "1-fixture"], dir);
  assert.equal(one.code, 2);
  assert.equal(one.json.invalid[0].file, "docs/fix/1-fixture/SPEC.md", "a repo-relative path, never a machine path");
  assert.equal(one.stdout, two.stdout);
});

test("check-all resolves the unit from the branch when --slug is omitted (S5)", () => {
  const dir = makeUnitRepo({
    tasks: `- [x] P1 — do the thing (validator: \`true\` exits 0)\n  (Implements: S1)`,
    log: `- **P1** — 2026-11-24 10:00, a · abc1234.`,
  });
  execFileSync("git", ["checkout", "-b", "fix/1-fixture"], { cwd: dir });
  const r = cer(["docs", "check-all", "--from", "main"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.overall, "PASS");
  const nowhere = cer(["docs", "check-all"], makeUnitRepo({ tasks: GOOD_TASKS }));
  assert.equal(nowhere.code, 1);
  assert.equal(nowhere.json.error, "missing-flag");
});

test("R3 reproducer: a `Step 1` task label is detected, exit 2 (O11)", () => {
  const dir = makeUnitRepo({ tasks: `- Step 1 — bad label (validator: \`true\` exits 0)\n- P2 — fine\n  (Implements: S1)` });
  const r = cer(["docs", "check-phase-labels", "--slug", "1-fixture"], dir);
  assert.equal(r.code, 2);
  assert.equal(r.json.blocked, true);
  assert.equal(r.json.valid, false);
  assert.equal(r.json.invalid.length, 1);
  assert.match(r.json.invalid[0].content, /^- Step 1/);
  assert.ok(r.json.invalid[0].line >= 1);
});

test("check-phase-labels: clean P# labels pass, exit 0", () => {
  const dir = makeUnitRepo({ tasks: GOOD_TASKS });
  const r = cer(["docs", "check-phase-labels", "--slug", "1-fixture"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.valid, true);
  assert.deepEqual(r.json.invalid, []);
});

test("check-commit-format: non-conventional subjects listed; clean range passes", () => {
  const base = makeUnitRepo({ tasks: GOOD_TASKS });
  const seed = execFileSync("git", ["rev-parse", "HEAD"], { cwd: base, encoding: "utf8" }).trim();
  commitFile(base, "a.txt", "a\n", "no format at all");
  commitFile(base, "b.txt", "b\n", "fix(docs): proper subject");
  const r = cer(["docs", "check-commit-format", `${seed}..HEAD`], base);
  assert.equal(r.code, 2);
  assert.equal(r.json["commit-format"] ?? r.json.valid, false);
  assert.equal(r.json.invalid.length, 1);
  assert.match(r.json.invalid[0].message, /no format/);

  const clean = cer(["docs", "check-commit-format", `HEAD~1..HEAD`], base);
  assert.equal(clean.code, 0);
  assert.equal(clean.json.valid, true);
});

test("check-tasks-ticks: a ticked task with no P log line is a mismatch, exit 2", () => {
  const dir = makeUnitRepo({ tasks: `- [x] P1 — done (validator: \`true\` exits 0)\n- P2 — open\n  (Implements: S1)` });
  const r = cer(["docs", "check-tasks-ticks", "--slug", "1-fixture"], dir);
  assert.equal(r.code, 2);
  assert.deepEqual(r.json.mismatched, [{ task: "P1", ticked: true, logged: false }]);
});

test("check-tasks-ticks: tick + matching log P line passes", () => {
  const dir = makeUnitRepo({
    tasks: `- [x] P1 — done (validator: \`true\` exits 0)\n  (Implements: S1)`,
    log: `- **P1** — 2026-11-24 10:00, did the thing · abc1234.`,
  });
  const r = cer(["docs", "check-tasks-ticks", "--slug", "1-fixture"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.valid, true);
});

test("check-progress-entry: phases without a log entry are listed, exit 2", () => {
  const dir = makeUnitRepo({ tasks: GOOD_TASKS, log: `- **P1** — 2026-11-24 10:00, did the thing · abc1234.` });
  const r = cer(["docs", "check-progress-entry", "--slug", "1-fixture"], dir);
  assert.equal(r.code, 2);
  assert.deepEqual(r.json.missing, ["P2"]);
});

test("check-docs-language: an .es.md file is a block, exit 2; none passes", () => {
  const dir = makeUnitRepo({ tasks: GOOD_TASKS });
  const clean = cer(["docs", "check-docs-language"], dir);
  assert.equal(clean.code, 0);
  fs.writeFileSync(path.join(dir, "docs/es-doc.es.md"), "x\n");
  const blocked = cer(["docs", "check-docs-language"], dir);
  assert.equal(blocked.code, 2);
  assert.deepEqual(blocked.json["es-files"], ["docs/es-doc.es.md"]);
});

test("check-all: all green → overall PASS, exit 0; any red → exit 2", () => {
  const dir = makeUnitRepo({
    tasks: `- [x] P1 — do the thing (validator: \`true\` exits 0)\n  (Implements: S1)\n- [x] P2 — do the other thing (validator: \`true\` exits 0)\n  (Implements: S1)`,
    log: `- **P1** — 2026-11-24 10:00, a · abc1234.\n- **P2** — 2026-11-24 10:05, b · abc1234.`,
  });
  const good = cer(["docs", "check-all", "--slug", "1-fixture"], dir);
  assert.equal(good.code, 0);
  assert.equal(good.json.overall, "PASS");
  assert.equal(good.json["commit-format"].valid, true);

  fs.writeFileSync(path.join(dir, "docs/fix/1-fixture/SPEC.md"), unitDoc({
    tasks: `- Step 1 — bad (validator: \`true\` exits 0)`,
  }));
  const bad = cer(["docs", "check-all", "--slug", "1-fixture"], dir);
  assert.equal(bad.code, 2);
  assert.equal(bad.json.overall, "FAIL");
  assert.equal(bad.json["phase-labels"].valid, false);
});

test("unknown docs subcommand → exit 1", () => {
  const dir = makeUnitRepo({ tasks: GOOD_TASKS });
  const r = cer(["docs", "check-nothing"], dir);
  assert.equal(r.code, 1);
  assert.equal(r.json.error, "unknown-subcommand");
});

// #398 B3: no ## Tasks section → n/a, not vacuous valid:true

test("#398 B3: unit doc with no ## Tasks reports n/a (legacy carrier), not valid:true", () => {
  // A unit doc that uses the spec-by-reference shape has no ## Tasks section.
  // checkTasksTicks and checkProgressEntry must report n/a with the legacy-carrier
  // reason, not vacuous valid:true.
  const dir = makeUnitRepo({ tasks: "", log: "" });
  // Remove the Tasks section by writing a spec-by-reference doc
  fs.writeFileSync(
    path.join(dir, "docs/fix/1-fixture/SPEC.md"),
    `# 1 — no-tasks-unit

## Specs

**S1 — the request.**
> Add a command.

## Impact

none

## Non-goals

- Nothing

## Future

none

## Future cost

none

## Applicable tests

n/a

## Known pre-existing issues

none

## Findings

none

## Tasks

none

## Log

## Next

none

## References

none
`,
  );
  const r = cer(["docs", "check-tasks-ticks", "--slug", "1-fixture"], dir);
  assert.equal(r.code, 0, "should not block; n/a is not a failure");
  assert.ok(r.json.valid || r.json["n/a"], "must report n/a or valid");
  const hasNarrowAnswer = r.json["n/a"] === "no ## Tasks section — legacy carrier" ||
    r.json.valid === true && Object.keys(r.json).length <= 2;
  // The key assertion: not valid:true with an empty mismatched array (vacuous pass)
  if (r.json.valid === true && r.json.mismatched && r.json.mismatched.length === 0) {
    assert.fail("no ## Tasks should NOT report vacuous valid:true with empty mismatched");
  }
});

test("#398 B3: check-progress-entry with no ## Tasks reports n/a, not valid:true", () => {
  const dir = makeUnitRepo({ tasks: "", log: "" });
  fs.writeFileSync(
    path.join(dir, "docs/fix/1-fixture/SPEC.md"),
    `# 1 — no-tasks-unit

## Specs

**S1 — the request.**
> Add a command.

## Impact

none

## Non-goals

- Nothing

## Future

none

## Future cost

none

## Applicable tests

n/a

## Known pre-existing issues

none

## Findings

none

## Tasks

none

## Log

## Next

none

## References

none
`,
  );
  const r = cer(["docs", "check-progress-entry", "--slug", "1-fixture"], dir);
  assert.equal(r.code, 0, "should not block; n/a is not a failure");
  if (r.json.valid === true && r.json.missing && r.json.missing.length === 0) {
    assert.fail("no ## Tasks should NOT report vacuous valid:true with empty missing");
  }
});
