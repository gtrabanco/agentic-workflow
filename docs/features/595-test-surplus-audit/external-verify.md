# External verify — feature/595-test-surplus-audit

2026-11-17 · **full verdict** — no prior `EXTERNAL VERIFY` block, `external-verify.md`
or review verdict exists for this unit (the unit dir carried SPEC.md + both planning
ledgers only; PR #609 reports zero reviews and zero comments), so this is the full
verdict, once. Free-text intent (`#609` / "Verify the change on this repository") is
the owner's target override: it selects this PR / this unit, waiving no check below.

**Binding.** unit dir `docs/features/595-test-surplus-audit/` (SPEC.md + both planning
ledgers) · base `origin/main` → merge-base
`8b51f3753d699f03cb3999cfcf4760b87b22f228` · head
`d8d81f065b0505cc239eabf939bb0599d1f4b891` (9 branch commits). `origin/main` is
`807d89f5` (16 commits past the merge-base — unit #526 landed mid-flight); the
merge-base never moved, so the diff under verification is stable. PR #609 reports
`mergeable: CONFLICTING` against that main — recorded as A5, merge-state.

**Read-only run.** No `git commit`, `git push`, branch creation, forge mutation or
file edit; the only writes are this receipt and `mktemp -d` scratch clones (base
`8b51f375` and red commit `d85b5d01`, both removed after use). No unproven mutation
path was executed against the live tree: the change's only new command,
`scripts/product-audit-surplus.test.mjs`, was read before running (committed bytes
read-only), and every other command re-run is an unmodified check-only script.
`git status --porcelain` is empty after the run.

```text
EXTERNAL VERIFY — base: 8b51f3753d699f03cb3999cfcf4760b87b22f228 · head: d8d81f065b0505cc239eabf939bb0599d1f4b891
Blockers: 0
Advisories: 5 —
  A1 docs/features/595-test-surplus-audit/planning-evidence.md:17 (PE-003 `source` cell) · the quoted sample "live run at the cut: `bun scripts/prose-gate-inventory.mjs` → `verdict: PASS`, 74 rows" never reproduces: a `git archive 8b51f375` scratch run prints `prose-gate-inventory — 69 row(s) · script 43 · cli 12 · prose 14 · migrate 0` · exit 0 · `verdict: PASS`, and the head prints `70 row(s) · script 44 · cli 12 · prose 14 · migrate 0` (raw `^[a-z0-9-]+ \|` rows: 73 at base, 74 only at head — 74 is the head's raw count, never the cut's script output). Why advisory: the row's substance (the inventory refuses an unclaimed surface id in both directions, token resolution, checkability-3 → refused `migrate`) reproduces PASS on both trees, no validator reads the number, and it is narration in a frozen evidence cell (590 receipt A4 precedent).
  A2 docs/features/595-test-surplus-audit/planning-evidence.md:15 (PE-001 `source`) · cites `scripts/dimension-regression.mjs:83 (dimensionsOf)` and `:41 (DIMENSION_SURFACES)`; actual locations are `dimensionsOf` at :72 and `DIMENSION_SURFACES` at :51 (:41 is `import { spawnSync }`, :83 is blank). Why advisory: pointer drift only — the claim itself (bold-cell reading, frozen dimension id set) re-verifies green (`bun test scripts/dimension-regression.test.mjs` 10/0; the run reports `verdict | clean`), and no gate reads the line numbers.
  A3 docs/features/595-test-surplus-audit/planning-evidence.md:25 (PE-011 `source`) · cites `:95 (evaluateEvolution)` and `:121 (recordsRun)`; actual: `recordsRun` is :95, `evaluateEvolution` is :102, :121 is a closing `}`. Why advisory: same class as A2 — the mechanism re-verifies (`dimension-regression.mjs --base 8b51f375` → exit 0, `verdict | clean`, evidence = this unit doc), only the labels are attached to the wrong lines.
  A4 docs/workflow/SKILL_CONTEXT_BUDGETS.json:240 (`referenceSources["issue #595 (test surplus audit)"]`) · declares "Measured at the change … AUDIT_DIMENSIONS.md 4923 est; ceiling re-based to ceil(4923 x 1.10) = 5416", but the re-pin commit `b5360066` itself shrank the reference (SL-04 fix: URL citation → bare `#595`, −60 bytes), and from `b5360066` through head the manifest's own formula (`estimate = ceil(bytes/4)`, scripts/check-skill-context.mjs:72) yields 19,632 bytes → 4908 est; arithmetic over the real measurement would be ceil(4908×1.10) = 5399, so the ceiling sits 17 est units above its own declared rule. Why advisory: the binding check passes as measured (`bun scripts/check-skill-context.mjs --skill product-audit` → exit 0; 4908 ≤ 5416), no gate or `rendered-facts@1` row reads this narration number, and the ceilings gates do read re-measure exactly (AGENTS.md 724/161/563/13014; GATE_INVENTORY.md 172/77/95/7040).
  A5 PR #609 (`gh pr view 609` → `mergeable: CONFLICTING`) against `origin/main` 807d89f5 · `git merge-tree --write-tree origin/main HEAD` → exit 1: content conflicts in `docs/workflow/GATE_INVENTORY.md` and `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (shared-doc driver marks `documents.files.AGENTS.md.linesMax` 724↔725, `.machineLines` 161↔162, `GATE_INVENTORY.estimateMax` 7040↔main's re-pin; both sides appended to the same `normative-surface-grammar` surfaces cell and the same budget leaves), `docs/ROADMAP.md` unioned by the driver, `docs/generated/units.md` resolved to the incoming projection (driver note: run `bun scripts/docs-generate.mjs`). Why advisory: merge-state, not a change-caused defect — the merge-base is unchanged, main moved independently (unit #526 registered two surfaces and re-pinned the same cells), and AGENTS.md "Published history is owner-written" makes integrating `main` on the branch the prescribed step before the owner's merge (568 receipt A1 precedent: "Merge-state, not a change-caused defect"). Smallest action: integrate `origin/main` on the branch, resolve the two files keeping both sides' rows/sources with the ceilings re-pinned to the merged measurement, then re-run `bun scripts/docs-generate.mjs --check`, `bun scripts/check-skill-context.mjs --documents` and `bun scripts/roadmap-settle.mjs` → /aw-local-apply (owner runs the integration).
Sibling sweep: clean — the old truth survives nowhere: `git grep -n 'missing/!flaky|untested failure modes|Coverage of critical paths' HEAD` → only AUDIT_DIMENSIONS.md:34 (the rewritten Tests row still carries every prior sweep item, which is what the regression case asserts) and the change's own suite; `which tests are missing` → only AUDIT_DIMENSIONS.md:171 (the new section's past-tense framing) and AUDIT_PROCESS.md:24 (the new step, both directions named); `verified: no surplus tests` present in both references (AUDIT_DIMENSIONS.md:190/:210, AUDIT_PROCESS.md:26) with no competing receipt name anywhere; the three check ids appear only in surfaces that know them (dimension reference, gate-inventory statement, budget narrations, changeset, journal, roadmap, units projection, pin suite) and none contradicts; `test-surplus-grammar` declared exactly once (AGENTS.md:403) and claimed exactly once (GATE_INVENTORY:66 surfaces cell); `template/` carries no normative-surfaces or gate-inventory copy (absent at base too) and `packages/` ships no committed skill copy; `docs/workflow/SKILLS.md`, `docs/CAPABILITIES.md` and `skills/product-audit/SKILL.md` make no Tests-dimension direction claim needing update; `docs/LOGS.md` untouched (`git status --porcelain docs/LOGS.md` empty, E10 re-confirmed).
Completeness: S1–S12 resolved, open ids: none — every S# has a task carrying `(Implements: S#)` whose validator re-runs green here: S1→P1 (`bun test scripts/pre-execution-quality.test.mjs` exit 0; its 1 skip is the deleted-skill fixture, present at base), S2/S3/S5/S8/S9→P3, S4/S7→P4 (the surplus suite's receipt/class/route/boundary cases), S6/S10→P5 (`normative-drift` 21/0, `prose-gate-inventory` PASS 70 rows with the new row resolved at scripts/product-audit-surplus.test.mjs:105, `check-skill-context --documents` PASS), S10/S11/S12→P6 (`lint-changeset` ok, `docs-generate --check` PASS, root suite 119/0); P2's red validator reproduces red at its own red commit `d85b5d01` (scratch: 3 pass / 10 fail — exactly E1) and green at head through P3/P4. S11's non-goals hold as invariants: `git diff --name-only 8b51f375...HEAD -- packages/agentic-workflow-schema scripts/local-gate.mjs` prints nothing (0 lines) and the one new script is a prose pin with no producer and no gate step. Obligations: O1–O14 all `verified`, every stated validator re-run green here (O1–O7/O11 → surplus suite 13/0; O2/O8 → `normative-drift` 21/0 + `prose-gate-inventory` PASS; O7 → `residue-dimensions` 30/0; O9 → both `check-skill-context` invocations exit 0 with the re-pinned rows; O10 → empty diff; O12 → `dimension-regression` clean + root suite 119/0; O13 → changeset ok, `docs-generate --check` PASS, `docs/LOGS.md` untouched, both journal fragments present, `roadmap-settle` PASS 225 docs / 0 violations; O14 → `rg -c '^- \*\*R'` → 0); O13's AC-7 observation half carries its evidenced `n/a` (owner-triggered run required by `audit-trigger@1`, cited to `skills/product-audit/SKILL.md` § When to use and PE-015), dated 2026-11-17 — a recorded disposition, not a drop.
Spot check: bun scripts/run-root-suite.mjs --jobs 4 → match (reported G3 "119 suites, none failed, exit 0" reproduced exactly: `root gate: 119 suite(s) · 4 worker(s) · fail-fast off` · PASS=119 · FAIL=0 · KILLED=0 · exit 0)
Verdict: VERIFIED
```

**Contract-text qualifier check.** The diff's rewritten binding sentences: the
`**Tests**` applicability row (skills/product-audit/references/AUDIT_DIMENSIONS.md:34
— all three prior sweep items, the detector cell and the applicability cell survive
verbatim; the surplus clause is purely additive) and the `normative-surface-grammar`
row's `surfaces` cell (docs/workflow/GATE_INVENTORY.md:66-block row — statement
byte-identical, only `,test-surplus-grammar` appended). AGENTS.md gained one row
(+1 line, 0 deletions); AUDIT_PROCESS.md gained two paragraphs (0 deleted lines);
the budget file gained source rows and re-pinned numbers. No removed sentence carries
a qualifier that fails to survive; no rule flipped conditional↔absolute. In the new
text itself the quantifiers hold as written: `only` (class), `never` (audit repairs /
exhaustive sweep / weakening), `every pass` (receipt), `exactly one` (owner).

## Declared verification commands re-run this run (command: observed)

- `bun test scripts/product-audit-surplus.test.mjs` → exit 0, **13 pass / 0 fail**
  (E2/AC-1…AC-5/AC-7). Independently red at the red commit: scratch at `d85b5d01`
  → **3 pass / 10 fail** (E1 reproduced).
- `bun test scripts/normative-drift.test.mjs` → exit 0, **21 pass / 0 fail** (E4/AC-6).
- `bun scripts/prose-gate-inventory.mjs` → exit 0, `verdict: PASS`,
  `70 row(s) · script 44 · cli 12 · prose 14 · migrate 0`, new row resolved at
  `scripts/product-audit-surplus.test.mjs:105`, `test-surplus-grammar` claimed once
  (E4/AC-6). Base side (scratch): exit 0, `69 row(s)`, PASS.
- `bun scripts/check-skill-context.mjs --documents` → exit 0, `AGENTS.md 724 / 161 /
  563 / 13014`, `GATE_INVENTORY.md 172 / 77 / 95 / 7040` (G1/AC-8/O9).
- `bun scripts/check-skill-context.mjs --skill product-audit` → exit 0,
  `product-audit 3883 / 284 / 2 refs / 117` (G1/AC-8); plain
  `bun scripts/check-skill-context.mjs` → exit 0, `PASS context budgets: 30 skills`.
- `bun scripts/lint-changeset.mjs .changeset/595-test-surplus-audit.md` → exit 0,
  `ok 595-test-surplus-audit.md` (E7/AC-8).
- `bun scripts/skill-lint.mjs` → exit 0, `104 file(s) · 7 check(s) · 0 finding(s)`,
  `verdict: PASS` (E6/AC-9).
- Sibling suites (E3): `product-audit-rescope` **16/0**, `residue-dimensions`
  **30/0**, `coverage-gap` **20/0**, `dimension-regression` **10/0** — all exit 0.
- `bun test scripts/guide-split.test.mjs` → exit 0, **15/0**; `bun test
  scripts/promise-coherence.test.mjs` → exit 0, **37/0**; `bun scripts/promise-coherence.mjs`
  → `verdict PASS`, `42 checked · 23 skipped` (E5).
- `bun scripts/docs-generate.mjs --check` → exit 0, `verdict: PASS`, 3 files,
  0 stale, `Roadmap: docs/ROADMAP.md — unchanged` (G2/O13).
- `bun scripts/dimension-regression.mjs --base 8b51f375` → exit 0,
  `verdict | clean`, 17 dimensions both sides, 4 changed review surfaces, evidence =
  this unit doc (G2/O12).
- `bun scripts/run-root-suite.mjs --jobs 4` → exit 0, **119 suites / 119 PASS /
  0 FAIL** (G3/O12) — the spot check above.
- `bun scripts/red-first.mjs` → exit 0, `PASS`, 56 pairs · 31 after the cutoff ·
  0 findings (the test-only addition is exempt, PE-010).
- `bun scripts/roadmap-settle.mjs` → exit 0, `225 unit docs checked · 0 fix docs
  skipped`, `verdict: PASS`, `violations: 0` (P6's reported line).
- Invariants: `git diff --name-only 8b51f375...HEAD -- packages/agentic-workflow-schema
  scripts/local-gate.mjs` → empty; `rg -c '^- \*\*R' docs/features/595-test-surplus-audit/SPEC.md`
  → 0 matches, exit 1 (AC-10/AC-11, E9).
