# External verify — 435-project-charter

Receipt carrier for this unit's external verification (the next run reads the
latest block here and verifies only the delta). Written 2026-11-07 by the
read-only external-verify command; no other byte of the branch was touched.

## 2026-11-07

EXTERNAL VERIFY — base: e1d94057 · head: 995b28de
Blockers: 2 —
  1. skills/audit-docs/SKILL.md:155 — check 16's declared identity-slot scan
     (`rg -n '^- \*\*[^*]+:\*\* \`?<[^>]+>\`?$' AGENTS.md`) over-matches
     non-charter bullets. Reproducer: run that exact pattern against
     `template/AGENTS.md` → 12 hits including the pre-existing, non-identity
     hard-rules stub `template/AGENTS.md:387` (Backward-compatibility
     `<declare…>` placeholder); with the charter filled and an honest residual
     placeholder left — which `BOOTSTRAP_WRITE.md:13` mandates ("Leave honest
     placeholders where the user hasn't decided") — the check's pass condition
     "must print nothing" is unreachable, so a healthy scaffold carries a
     permanent false "unfilled identity slot" finding on check 16 (and the
     sub-bullet states no severity). Base-vs-head: check and command absent at
     `e1d94057` (`git show e1d94057:skills/audit-docs/SKILL.md | rg
     'Project-charter coverage'` → no match); the matched bullet exists
     untouched at base (`template/AGENTS.md:336`) — the defect is the new
     check's over-match, introduced by this change. Smallest action: scope the
     scan to the `## Project charter` block (or narrow it to charter bullets)
     and re-run the P8 fixtures with a pass-shape that keeps honest residual
     placeholders.
  2. docs/fix/435-project-charter/SPEC.md:89 — the Retirements evidence claim
     fails its own stated command. Reproducer: `git diff e1d94057 --stat` →
     `19 files changed, 659 insertions(+), 14 deletions(-)`, the deletions
     landing outside the unit doc in `scripts/review-loop-discipline.test.mjs`
     (4), `skills/audit-docs/SKILL.md` (4),
     `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (3),
     `skills/init-workspace/SKILL.md` (1),
     `skills/init-workspace/references/UPGRADE.md` (1), `docs/ROADMAP.md` (1),
     plus the `.agentic-workflow/journal/` fragment rename (old path removed) —
     none inside the unit doc's own scaffolding, contradicting "no deletion
     outside this unit doc's own ledger scaffolding" and "purely additive".
     Base-vs-head: `SPEC.md` does not exist at `e1d94057`, so the false claim is
     introduced by this change; every deletion is an in-scope reword already
     recorded in the Log (D5, P4, P8, P9, D6) and no surface is retired.
     Smallest action: reword SPEC.md:85-90 to name what the deletions actually
     are (recorded rewords, no retired surface) or drop the stat claim.
Advisories: 2 —
  1. docs/fix/435-project-charter/SPEC.md:236 — P10's declared validator
     `bun scripts/local-gate.mjs` exits 0 does not reproduce: observed
     `local-gate: FAILED at pi-compat-guard` (TS2307 ×4 resolving
     `@gtrabanco/agentic-workflow/src/log/*` from
     `packages/pi-agentic-workflow/src/auto-log-session.ts`), byte-identical to
     the failure reproduced in a `mktemp -d` copy of base `e1d94057` —
     pre-existing at base and on files this diff never touches (guard scope is
     `packages/pi-agentic-workflow/{src,tsconfig.json,package.json}`), hence
     advisory, not blocker; recorded in Known pre-existing issues (rows
     114/115 surface).
  2. docs/fix/435-project-charter/planning-obligations.md:24 — O14's validator
     text records the pre-D6 reds (`rg "^local-gate: FAILED"` →
     crate-suite-node, crate-suite-bun); after this branch's D6 fragment repair
     the offline gate reports no FAILED lines at all (observed `local-gate:
     PASS — 8 step(s) in 208s`). The obligation's outcome — unit introductions
     green, only pre-existing reds, never a red naming this unit's files —
     reproduces vacuously/better, and the required evidence exists in `## Log`
     (G2, G4, D6); only the recorded-run description is superseded.
Sibling sweep: clean — no live surface asserts a superseded truth; surviving
  mentions of the old check count (`docs/LOGS.md:32`), the old ceilings
  (`docs/fix/332-agents-md-split/SPEC.md:341`, `docs/fix/398-retired-carriers/SPEC.md:431`),
  the old `Check (1-15)` contract (`docs/features/103-doc-currency/SPEC.md:53,123`)
  and the old journal-fragment name (SPEC.md:183,306,308) are all dated unit/log
  records scoped to their own dates; PE-003 is explicitly stamped "at the cut
  head"; no live manifest, pin, report template or skill prose still carries
  `1-15`/`<n>/15` (the pin `scripts/review-loop-discipline.test.mjs` was updated
  to 16 in the same change and re-runs green).
Completeness: S1–S12 resolved — every S# carries a task with
  `(Implements: S#)` whose validator re-runs green here (phase-lint
  `verdict PASS` 10/10; all declared rg counts; `check-skill-context` →
  `PASS context budgets: 28 skills`; `skill-lint` → PASS 0 findings;
  `docs-generate --check` → PASS; offline gate PASS 8/8) except P10's literal
  default-gate validator → advisory 1; obligations O1–O14 all `verified` with
  re-runs green (O14 → advisory 2); dispositions recorded for Non-goals
  (#436 planned, #366 planned, D2) — no open S# ids.
Spot check: `bun scripts/local-gate.mjs --no-bail --skip-network` → match
  (reported SPEC.md D6 "offline gate PASS 8/8" / G4 per-step exits; observed
  `local-gate: PASS — 8 step(s) in 208s`; secondary re-runs of E7's counts:
  check-skill-context 1/0, guide-split 14/0, promise-coherence 37/0,
  review-loop-discipline 1/0 — exact match).
Verdict: NEEDS-DECISION (2 open blockers)
