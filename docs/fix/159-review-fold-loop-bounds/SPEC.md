# SPEC — fix-159-review-fold-loop-bounds

## Issue

[#159](https://github.com/gtrabanco/agentic-workflow/issues/159) — the
`review-change → fold-findings` loop never terminates on its own: fix/157
(11 review/fold rounds, F1–F18) and feature 28 (5 cycles, F1–F77+) proved four
structural defects. Evidence trail: `docs/fix/157-claude-skills-self-mount/`
(review-findings.md F1–F18) and `docs/features/28-evidence-grounded-spec-plan-review/`
(known-issue 6: "every future review cycle re-reports working tree not clean").

## Root causes (four, fixed independently)

1. **Materiality floor destroyed at classification.** Finders say "minor never
   blocks"; the current-unit contract routed every in-scope defect to fix-now
   and `REVIEW-FAIL` fired on *any* open fix-now row — a missing trailing
   period blocked a merge.
2. **State findings were ledger rows the workflow itself re-creates** (dirty
   tree, unpushed HEAD, uncommitted ledger appends).
3. **Folded rows got re-reported** (F15 re-found F1 at the same
   `file:line+axis`; dedupe existed but nothing told an isolated reviewer to
   re-verify instead of re-report).
4. **No unit-level cycle bound** — the CONVERGENCE-ANOMALY guard keyed on
   repeating the same finding family, and every round manufactured new trivia,
   so it never fired.

## Change set

- `review-implementation` 1.6.0 — severity floor: `low` = report-only, never
  persisted, never blocks; mislabeled real defects re-escalate to `med`.
- `review-change` 3.0.0 — decision + persist rules carry the floor
  (high/med only); workspace state = `REVIEW BLOCKED` precondition, not a
  finding; the review commits its own ledger append; re-reviews read the
  ledger, state the cycle, re-verify folded rows (`regression of <id>` /
  `DISPUTED`), report `CONVERGENCE-ANOMALY` at cycle ≥2 with new findings.
- `loop-review-fold` 4.0.0 — hard cap: at most two review→fold cycles per
  unit, family-agnostic; a third never starts.
- 8 finder skills 1.1.0/1.2.0 — materiality bar (cite the violated rule or it
  is not a finding; empty table + PASS is expected; never pad).
- `verification-contract` 1.1.0 — validator stability (never gate on surfaces
  other workflow actors mutate — the AC9/LOGS.md failure).
- `evidence-grounding` 1.5.0 — claim discipline (no forward-looking claim
  stated as present fact).
- `log-session` 2.1.0 — status words are forge-verified.
- `review-spec`/`review-plan` 1.4.0 — class→resolver map printed verbatim;
  `fold-findings` never repairs a planning artifact.

## Out of scope

- Redesigning `evidence-grounding`'s readiness passes (already exhaustive).
- `fold-findings`/`triage-issue`/`audit-pr` (their row semantics are unchanged;
  only the *population* of rows changes).
