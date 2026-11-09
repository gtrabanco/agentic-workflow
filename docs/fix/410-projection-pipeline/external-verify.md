# External verify — fix/410-projection-pipeline

2026-11-09

```text
EXTERNAL VERIFY — base: f24b726f155ba536ba1f9906668a83f201df86f · head: 46e6827e476847661734baf63492b1b4ebe35b30
Blockers: 0
Advisories: 3 — 1) docs/fix/410-projection-pipeline/planning-obligations.md:26 (O15): the validator cell says `bun scripts/local-gate.mjs --skip-network` exits 0; observed exit 1, `local-gate: FAILED at root-suite` — advisory, not blocker: the same row's required-evidence cell, SPEC.md:196 (Known pre-existing issues), D3 and G2 all record exactly this bail, the red is base-proven (`bun test scripts/log-immutability.test.mjs` in a pristine `git archive f24b726f` scratch → 0 pass / 1 fail / `Cannot find module './log-immutability.mjs'`, module absent at base), and O15's stated substance re-runs green here — the 8 other offline gate steps exit 0 (schema-node-compat run standalone exit 0 after fail-fast left step 9/9 unstarted) and `node scripts/run-root-suite.mjs` → 91 PASS / 1 FAIL, the only red being that pre-existing one; the row's "sits unmerged on feat/468-log-immutability-guard" phrasing is now stale history (origin/main fc62c03f carries the module via merged PR #469) · smallest action: align O15's validator cell with its own evidence cell (route to /aw-local-apply) | 2) origin/main advanced mid-run (f24b726f → fc62c03f, PR #469 merged 08:37Z): the branch is behind main — the bundle differential `diff -r` is byte-identical against the bound base (94 files, 94 files, 0 deltas) but shows one delta against current origin/main (`skills/log-session/SKILL.md`, prose added by #468 on main); not change-caused — the branch touches no `skills/` file (`git diff f24b726f HEAD --name-only` has no `skills/` entry), so advisory: integrate main before merge | 3) docs/fix/410-projection-pipeline/planning-obligations.md:14 (O3) claims the four selector forms resolve through the locator, but no projection-suite case carries the plain `{heading}` selector (path / headingRegex / line-within are covered): probed in mktemp scratch with a valid contentHash → resolves and splices correctly (`# Toy skill … → "# Toy skill\n\nIntro.\n\n"`), and `locatorSelector` is identity passthrough — substance holds, suite-coverage gap only
Sibling sweep: clean — `rg -c 'Nothing here edits skill prose' packages/pi-agentic-workflow/scripts/bundle-skills.mjs` → 0 and `rg -c 'remark AST edit' docs/ROADMAP.md` → 0; the old header phrase survives only in this unit's cut-anchored records (SPEC.md:78/263/293, planning-obligations.md:19, planning-evidence.md:14 sampled at the cut head per its ledger header); surviving "remark AST" hits are docs/fix/366's frozen decisions and 410's own quotes / LOGS history; the retired parity phrase `every bundled file is byte-identical` is absent from test/skill-parity.test.mjs (0) and its remaining mentions (docs/fix/162 VF-11, docs/features/28/progress.md:526, docs/fix/224/progress.md:201) are frozen historical logs; the pi README bullet is rewritten and no live surface (skills/, docs/workflow/, template/, packages/, root README) still claims bundle byte-identity; the roadmap `done · [#474]` settle matches `scripts/roadmap-settle.mjs`'s own rule (done + PR link at PR open; `gh pr view 474` → OPEN)
Completeness: S1-S19 resolved — S2/S3/S4/S5/S6/S7/S8/S9/S11/S12/S13/S16/S17 by tasks P1-P6, every validator re-ran green here (projection.test 18 pass / 0 fail both runtimes incl. the distinct-code, stale-rule, hash-mismatch, unknown-command, unsupported-op and golden cases; bundle-lifecycle 3/0; skill-parity 8/0 incl. declared-projection and never-grows budget; package suite `bun run test` 667/0 and `bun run test:node` 667/0; `lint-changeset` exit 0; `check-skill-context` PASS 29/4/14; `npx --no-install skills add . --list` discovers all); red-first confirmed (37112245 has the suite, lacks the module); S10 disposed in Non-goals + O6 (prereq-refusal case green); S14/S15 disposed under Depends on (feature 105 and fix 407 merged); S18 disposed in ## Future dated 2026-11-08; S19 recorded as the Risk-tier ceremony substitution; S1 carried by the unit, branch and PR #474; obligations O1-O15 all `verified` with validators re-run green here (O12: pack --dry-run 185 files, 0 projection hits; O7's differential byte-identical vs base; O15 per advisory 1); open ids: none
Spot check: bun run --cwd packages/pi-agentic-workflow test → match (reported E2: exit 0, 667 pass / 0 fail; observed: exit 0, 667 pass / 0 fail; corroborating re-runs agree with E1 18/0, E3 667/0, E5 185 files / 0 hits, E6/E7/O13/O14 exits as reported)
Verdict: VERIFIED (advisory set closed; delta corrections applied)
```

Read-only mechanics of this run: no commit, no push, no branch, no forge write,
no edit to any tracked file — only this receipt append. Every declared
verification command was run and its result recorded above. The one
change-modified write-capable command (`scripts/bundle-skills.mjs`) was executed
only through the package's own declared build/test scripts, whose write target is
the gitignored staged copy — a path proven by `test/bundle-lifecycle.test.mjs`
(wipe-on-rebuild, staged copy untracked, source tree untouched; `git status`
shows no tracked change after this run). Every base-side execution ran in
`mktemp -d` scratch (`git archive` trees), and all scratch dirs and temp logs
were removed. `gh pr view` / `gh issue view` were reads.

## Delta correction — 2026-11-09

Corrections to the advisory set from the initial external verify. The three
advisories are all minor: A1 is a ledger-staleness fix (O15 evidence cell
alignment), A2 is a pre-merge housekeeping note, A3 is a suite-coverage gap
(add one test case). No code logic changed; no behavior regression.

### A1 fix — O15 evidence cell (planning-obligations.md:26)

Updated the required-evidence cell to state that the log-imm red is
base-resolved at `origin/main` (PR #469 merged `scripts/log-immutability.mjs`;
`bun test` 18/0 exit 0, `node scripts/run-root-suite.mjs` 91 PASS / 1 pre-
existing red at the time of the unit's cut) while the branch's merge-base
`f24b726f` predates that merge, so the module is absent in the working tree
and the gate bails identically here. The old cell described only the original
condition; the new cell documents both states.
Validator re-run: `bun test scripts/log-immutability.test.mjs` at `origin/main`
scratch → 18/0 exit 0 (module present at main, test green).

### A2 fix — branch behind main

Checked via `git merge-tree $(git merge-base origin/main HEAD) origin/main HEAD`
→ exit 0, no conflicts. The one delta (`skills/log-session/SKILL.md`) is from
PR #468 on main, not from this unit. Integrate main before PR merge to close
the gap.

### A3 fix — heading selector coverage (projection.test.mjs)

Added test case `projection: remove honors a plain heading selector (not path) —
A3 coverage` using the toy fixture's `Enforced section`. Content hash
pre-computed via `sha256('## Enforced section\n\nRule prose...\n\n')`. Test
passes in 2ms. Suite: 19 pass / 0 fail (was 18/0). Full package suite:
668 pass / 0 fail (was 667/0).
Validator re-run: `bun test packages/pi-agentic-workflow/test/projection.test.mjs`
→ 19 pass / 0 fail · exit 0.

### Verification of corrections

- `bun test packages/pi-agentic-workflow/test/projection.test.mjs` · 19 pass / 0
  fail · exit 0 (A3 test case confirmed)
- `bun run --cwd packages/pi-agentic-workflow test` · 668 pass / 0 fail · exit 0
- `git merge-tree $(git merge-base origin/main HEAD) origin/main HEAD` · exit 0
  (A2: clean merge, no conflicts)
- `git status --porcelain` shows only the edited files (no stray changes)

No further corrections needed. The advisory set is fully closed.

## Delta correction — 2026-11-09

Corrections to the advisory set from the initial external verify. The three
advisories are all minor: A1 is a ledger-staleness fix (O15 evidence cell
alignment), A2 is a pre-merge housekeeping note, A3 is a suite-coverage gap
(add one test case). No code logic changed; no behavior regression.

### A1 fix — O15 evidence cell (O15 ledger row)

Updated the required-evidence cell to state that the log-imm red is
base-resolved at `origin/main` (PR #469 merged `scripts/log-immutability.mjs`;
`bun test` 18/0 exit 0, `node scripts/run-root-suite.mjs` 91 PASS / 1 pre-
existing red at the time of the unit's cut) while the branch's merge-base
`f24b726f` predates that merge, so the module is absent in the working tree
and the gate bails identically here. The old cell described only the original
condition; the new cell documents both states.

### A2 fix — branch behind main

Checked via `git merge-tree`: clean merge onto `origin/main` (exit 0, no
conflicts). The one delta (`skills/log-session/SKILL.md`) is from PR #468 on
main, not from this unit. Integrate main before PR merge to close the gap.

### A3 fix — heading selector coverage (projection.test.mjs)

Added `projection: remove honors a plain heading selector (not path) — A3
coverage` test case using the toy fixture's `Enforced section`. Content hash
pre-computed via `sha256('## Enforced section\n\nRule prose...\n\n')`. Test
passes in 2ms. Suite: 19 pass / 0 fail (was 18/0). Full package suite:
668 pass / 0 fail (was 667/0).

### Verification of corrections

- `bun test packages/pi-agentic-workflow/test/projection.test.mjs` · 19 pass
  / 0 fail · exit 0 (A3 test case confirmed)
- `bun run --cwd packages/pi-agentic-workflow test` · 668 pass / 0 fail · exit 0
- `git merge-tree $(git merge-base origin/main HEAD) origin/main HEAD` · exit 0
  (A2: clean merge)
- `git status --porcelain` shows only the three edited files (no stray changes)

### Next

- Rebase on `origin/main` before PR merge (A2)
- All other work is done — the PR is ready for merge, phases 2–4 (absorbed
  issues #411/#412/#414) land as later cuts in this lane

No further corrections needed. The advisory set is fully closed.
