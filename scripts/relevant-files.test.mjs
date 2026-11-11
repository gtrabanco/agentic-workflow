/**
 * relevant-files.test.mjs — issue #269 (remaining P2), the never-authority
 * discipline harness. `scripts/relevant-files.mjs` is the mechanical backstop
 * of the unit doc's per-phase `Relevant files:` read sets:
 *
 *   - `--phase P<k>` prints that phase's read set (one path per line) — the
 *     consumption contract execute-phase and review-change read.
 *   - default mode checks the changed set against the union of the lists plus
 *     the unit doc's Progress/Log citations: listed or logged passes, a
 *     changed-and-unlogged file exits 1 naming it (an unlisted file is never
 *     out of scope — only unlogged; owner: skills/phase-contract/SKILL.md).
 *   - a unit doc with no list at all degrades to `read-set: absent` and passes
 *     (the consumption prose owns the scoped-survey fallback).
 *
 * Its sibling script lands in the green commit; this suite commits red-first
 * against the missing module, per the repo's red-first rule.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("./relevant-files.mjs", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

/** A fixture unit doc written into a fresh temp dir per case. */
function writeUnitDoc(text) {
  const doc = join(mkdtempSync(join(tmpdir(), "relevant-files-")), "SPEC.md");
  writeFileSync(doc, text);
  return doc;
}

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

const UNIT = `---
type: feature
scope: medium
---

# 269 — efficient-context-targeting

## Acceptance criteria

- **AC-S3** — the scope items are delivered. Check: the suites exit 0.

## Tasks

- P1 — freeze the planning ledgers (validator: \`bun scripts/phase-lint.mjs docs/fix/269-efficient-context-targeting/SPEC.md\` prints PASS)
  Relevant files: docs/fix/_TEMPLATE/SPEC.md
- P2 — implement the read-set tool (validator: \`bun test scripts/relevant-files.test.mjs\` exits 0)
  Relevant files: scripts/unit-doc-phases.mjs, scripts/phase-lint.mjs,
    scripts/red-first.mjs
- P3 — no list on this phase (validator: \`bun test scripts/x.test.mjs\` exits 0)

## Log

- **P1** — 2026-11-10 10:00, set up the ledgers → 41e72230.
- **E1** — 2026-11-10, \`bun test\` · exit 0.
`;

test("a changed file listed in a phase's Relevant files passes the discipline", () => {
  const doc = writeUnitDoc(UNIT);
  const r = run([doc, "--changed", "scripts/phase-lint.mjs"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /RELEVANT FILES pass/);
});

test("a changed file matching a glob entry passes", () => {
  const doc = writeUnitDoc(UNIT.replace("scripts/unit-doc-phases.mjs", "scripts/unit-doc-*.mjs"));
  const r = run([doc, "--changed", "scripts/unit-doc-phases.mjs"]);
  assert.equal(r.status, 0, r.stderr);
});

test("a listed file passes, an unlisted-and-unlogged file fails naming it", () => {
  const doc = writeUnitDoc(UNIT);
  const covered = run([doc, "--changed", "docs/fix/_TEMPLATE/SPEC.md"]);
  assert.equal(covered.status, 0, covered.stderr);

  const unlogged = run([doc, "--changed", "src/newly-discovered.mjs"]);
  assert.equal(unlogged.status, 1, "unlogged-and-unlisted must fail the discipline");
  assert.match(unlogged.stdout, /src\/newly-discovered\.mjs/);
});

test("a changed file cited in the Progress/Log stays legal (never-authority: logged, not listed)", () => {
  const docLogged = writeUnitDoc(
    UNIT + "\n- **P2** — 2026-11-10 11:00, discovered src/newly-discovered.mjs ahead of P3 → abc1234.",
  );
  const ok = run([docLogged, "--changed", "src/newly-discovered.mjs"]);
  assert.equal(ok.status, 0, "a logged discovery stays legal");
  assert.match(ok.stdout, /logged/);
});

test("--phase P<k> prints that phase's read set, joined across wrapped lines", () => {
  const doc = writeUnitDoc(UNIT);
  const r = run([doc, "--phase", "P2"]);
  assert.equal(r.status, 0, r.stderr);
  const files = r.stdout.trim().split("\n");
  assert.deepEqual(files, [
    "scripts/unit-doc-phases.mjs",
    "scripts/phase-lint.mjs",
    "scripts/red-first.mjs",
  ]);
});

test("--phase with an unknown phase is a refusal, not an empty pass", () => {
  const doc = writeUnitDoc(UNIT);
  const r = run([doc, "--phase", "P9"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /REFUSAL/);
});

test("the unit doc itself never counts against the discipline", () => {
  const doc = writeUnitDoc(UNIT.replace("docs/fix/_TEMPLATE/SPEC.md", "docs/other/SPEC.md"));
  const r = run([doc, "--changed", `${doc},scripts/phase-lint.mjs`]);
  assert.equal(r.status, 0, r.stderr);
});

test("a unit doc with no Relevant files at all degrades to read-set: absent and passes", () => {
  const doc = writeUnitDoc(
    UNIT
      .replace(/\n  Relevant files: docs\/fix\/_TEMPLATE\/SPEC\.md/, "")
      .replace(/\n  Relevant files: scripts\/unit-doc-phases\.mjs, scripts\/phase-lint\.mjs,\n    scripts\/red-first\.mjs/, ""),
  );
  const r = run([doc, "--changed", "scripts/something-new.mjs"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /read-set: absent/);
});

test("empty Relevant files entries are refused, not silently dropped", () => {
  const doc = writeUnitDoc(UNIT.replace(
    "Relevant files: scripts/unit-doc-phases.mjs, scripts/phase-lint.mjs,",
    "Relevant files: scripts/unit-doc-phases.mjs,, scripts/phase-lint.mjs,",
  ));
  const r = run([doc, "--changed", "scripts/unit-doc-phases.mjs"]);
  assert.equal(r.status, 1, "an empty entry is a malformed read set");
  assert.match(r.stdout, /empty/);
});

test("the three skills carry the consumption + forward-propagation + affected-set contracts", () => {
  const executePhase = readRepo("skills/execute-phase/SKILL.md");
  assert.match(executePhase, /relevant-files\.mjs/);
  assert.match(executePhase, /read set/is);
  assert.match(executePhase, /forward-propagat/i);
  assert.match(executePhase, /phase-contract/);

  const review = readRepo("skills/review-change/SKILL.md");
  assert.match(review, /relevant-files\.mjs|Relevant files/);
  assert.match(review, /read set/i);

  const triage = readRepo("skills/triage-issue/SKILL.md");
  assert.match(triage, /affected[- ]file set/i);

  const contract = readRepo("skills/phase-contract/SKILL.md");
  assert.match(contract, /Never-authority/);
});

/** Read a file relative to the repo root (spawn cwd for the script). */
function readRepo(relative) {
  return readFileSync(join(REPO_ROOT, relative), "utf8");
}
