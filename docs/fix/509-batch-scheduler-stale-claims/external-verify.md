# External verify — 2026-11-12 (fix/509-batch-scheduler-stale-claims)

EXTERNAL VERIFY — base: 675f06c455001e3330c1a350b627caee9ba38229 · head: fb6c88d7c15857d0b9bd19dd1f20ec9fcbb3cb03 (PR #518 head; the branch advanced to 2cafaab6248ea1645c697510a5d60d83f11f141b mid-verification — see the concurrent-commit note below; the two trees differ by exactly one journal fragment, no executable or gated surface)
Blockers: 0 — none; every S# and O-id claim reproduced on this checkout (command evidence below)
Advisories: 2 — (1) docs/fix/509-batch-scheduler-stale-claims/planning-obligations.md:30 (O19) + docs/fix/509-batch-scheduler-stale-claims/SPEC.md:546,552 (P8): the ledger/task prose names a `docs/LOGS.md` session entry, but `rg -n '#509' docs/LOGS.md` → exit 1 — the session record ships as the three `.agentic-workflow/journal/*509*` fragments, which is the carrier `log-session` mandates while the fragment journal is opted in (#405; a direct append is refused); the compound validator still exits 0 via `docs/ROADMAP.md` and its other conjuncts reproduce — same wording class as unit 484's receipt advisory 1; smallest action: amend those prose cells to name the fragment carrier → route `/aw-local-apply`; (2) docs/fix/509-batch-scheduler-stale-claims/SPEC.md:728,739,743,744 — the Log's P7/P8/G3 lines are garbled: P8 splices mid-line into `- **G3**`, a stray `## Next` heading carries the P8 tail, and two receipts read the unfilled `commit <this commit>` (P7 → `371b5a0b`, P8 → `beffc826`); no validator reads this block (gate green, roadmap-settle PASS) and no normative claim is false; smallest action: repair the three lines and fill the SHAs → route `/aw-local-apply`
Sibling sweep: clean — `batch-plan@2`/`@1` survive only in the suite's own sweep filter (scripts/batch-scheduler.test.mjs:1377-1378), the schema corpus's non-object vector (packages/agentic-workflow-schema/test/batch-plan.test.mjs:217) and unit 460's dated external-verify receipt; per-issue-claim / unit-doc-launch / two-state-soft-dep narrations survive only inside this unit's verbatim issue quotes, decisions and E-line history; README.md:160, docs/workflow/SKILLS.md:152, skills/batch-scheduler/SKILL.md, skills/batch-scheduler/references/PLAN.md, docs/ROADMAP.md:188, docs/generated/units.md:148 and docs/features/107-mechanization-inventory/INVENTORY.md:204 all carry the landed `batch-plan@3` contract; the suite's pin `envelope: no owned surface keeps a superseded batch-plan token` exits 0
Completeness: S1–S12 resolved — every S# has a task carrying `(Implements: S#)` with a validator that re-runs green here (P2/P10's red-state validators re-produced at their own SHAs); O1–O33 all `verified` with validators re-run green here (O17 = this receipt's differential; O19 as advisory 1)
Spot check: bun scripts/local-gate.mjs --jobs 2 → match (reported G3 `PASS — 17 step(s) in 171s`, observed `PASS — 17 step(s) in 167s`, 0 skipped)
Verdict: VERIFIED

## Evidence

`command: observed result` — every command run on this checkout unless named
otherwise; the working tree stayed clean (`git status --short` empty) after
every run.

Concurrent-commit note: at 00:20:59 UTC (2026-11-12), during this run, another
actor committed `2cafaab6` (`docs(log): Issue #509 …`, author/committer Gabriel
Trabanco Llano, 7 seconds after the journal fragment's own `002052Z` stamp) to
this branch. No command run here commits — this session executed no
`git commit`, and the diff `fb6c88d7..2cafaab6` is exactly one added file,
`.agentic-workflow/journal/20261112T002052Z-…-01a1cccc-….md` (6 insertions),
which no executed or gated surface reads. Every behavioral result below holds
for both heads byte-identically; `git status` stayed clean because the change
was committed, not dirty.

| command | observed |
|---|---|
| `bun test scripts/batch-scheduler.test.mjs` | exit 0 · 70 pass, 0 fail (matches E4; every obligation-named test present: C1–C3, V1–V5, W1–W3, X1–X5, A1/A2, B1/B2, C1/C2, D1–D3, E1/E2, docs pin, S9) |
| `cd packages/agentic-workflow-schema && bun run test` | exit 0 · 837 pass, 0 fail (matches E5) |
| `bun test scripts/normative-drift.test.mjs` | exit 0 · 21 pass (matches E6) |
| `bun scripts/check-skill-context.mjs` | exit 0 · PASS context budgets, 29 skills (matches E6) |
| `bun scripts/docs-generate.mjs --check` | exit 0 · 3 checked, 0 missing, 0 stale, 0 orphaned (matches E7) |
| `bun scripts/roadmap-settle.mjs` | exit 0 · PASS, 186 unit docs, 0 violations (matches E7) |
| `bun scripts/lint-changeset.mjs` | exit 0 · violations 0, `509-` entry ok (matches E7) |
| `bun scripts/test-impact.mjs --base 675f06c4` | exit 0 · verdict `targeted`, 6 suites; all 6 re-run green (batch-scheduler 70/0, batch-plan inside the 837, normative-drift 21/0, index-document 9/0, review-loop-discipline 0/0 top-level-assert pass, version-parity-gate 53/0) |
| `bun scripts/local-gate.mjs --jobs 2` | exit 0 · `PASS — 17 step(s) in 167s`, 0 skipped (spot check vs G3: match) |
| O17 differential (re-run) — `mktemp -d /tmp/aw509-diff-*`, `git archive 675f06c4` vs `git archive HEAD`, both schema packages built in scratch, one identical fixture (unit doc for #10, `postponed` #11 with a soft dep on #10, closed #12 in `previous.seen`, a v2 claim map) through `buildBatchPlan` + `updateState` | both exit 0, stderr empty; 124 diff lines, every one a declared delta: version/schema `@2`→`@3`, `occupied_by` losing the unit-doc-only source, #10 leaving `launched[]` / #11 entering `label_blocked[]` + `summary.label_blocked`, two `stale-claim` findings (pre-v3 keys), state `version` 3 + `<n>\|<lane>` pair keys, `seen` batch/lane following the new plan, summary counts. No undeclared difference |
| CLI differential (scratch) — `node scripts/batch-scheduler.mjs --bogus-flag` base vs head | both exit 2 with byte-identical usage/stderr (no CLI flag change) |
| red-first re-production (scratch archives, dist built per commit) — `9ebfc6ae` | exit 1 · 43 pass, 16 fail (matches E2 exactly) |
| red-first re-production — `3601997e` | exit 1 · 62 pass, 8 fail = E3's 7 new (A1, B1, B2, C1, D1, D3, E1) + the docs-pin carryover already red at the first corpus |
| `git merge-tree --write-tree origin/main HEAD` (main at `a20a3046`, 29 commits past the merge-base) | exit 0 · clean merge; the logs/generated driver prints its standard "run `bun scripts/docs-generate.mjs`" post-merge note, no conflict |
| `gh pr view 518 --json state` / `gh issue view 509 --json state` | `OPEN` / `OPEN`; no reviews or comments on the PR — no prior EXTERNAL VERIFY existed, hence this full verdict, once |
| `rg -n '#509' docs/ROADMAP.md docs/LOGS.md` | exit 0 via docs/ROADMAP.md:188 only; the docs/LOGS.md half does not match — advisory 1 |
| `ls docs/fix/509-batch-scheduler-stale-claims/` + `git log --oneline origin/main..HEAD` | SPEC.md, planning-evidence.md, planning-obligations.md, external-verify.md present; all branch commits conventional (`docs(509)`, `test(509)`, `feat(509)`, `feat(schema)`, `docs(log)`) — AC-S1 holds |

Mutation hygiene: every producer/CLI execution ran in `mktemp -d` scratch
(archives of base and of head, symlinked `node_modules`, scratch-built `dist`,
fixture root under `/tmp`); no change-introduced command touched the live tree
or a shared worktree; scratch removed after the run.
