# Review findings — fix-162 (source stage)

Fold ledger contract: `skills/review-change/references/PERSIST_AND_DECIDE.md` step 11 +
`skills/pre-execution-review/references/LEDGERS.md` (§review-mark@1, §finding-mark@1).
Reviewers append; `execute-phase`'s fold cycle is the only step that flips `folded`.
Cycle 1 — reviewed head `43c39fd561c74002015beed710c1b29729ac8608` (PR #178, open).
Scope: branch diff vs `main` (60 files, +1475/−139). Low findings are report-only
notes in that review's chat report and are never written here.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | skills/review-plan/references/OUTPUT.md:55 | workflow | med | fix-now | fold into current unit (/fold-findings) | no |
| VF-1 | skills/review-plan/references/OUTPUT.md:55 · reviewer review-change · HEAD 43c39fd561c74002015beed710c1b29729ac8608 · recheck direct read + greps of the cited bytes: the diff edits executor-path wording in `review-spec` 1.7.0 (OUTPUT.md self-check + RUN box), `review-plan` 1.6.0 (OUTPUT.md self-check + two-verdict set, SKILL.md) and `review-change` 3.3.0 (PERSIST_AND_DECIDE cap-scope), while `grep -c "162" docs/workflow/GOLDEN_FIXTURE.md` → 0, `grep -n "2026-09-06" docs/workflow/GOLDEN_FIXTURE.md` → 0 rows (log ends 2026-09-05, feature 29), `grep -rn GOLDEN_FIXTURE docs/fix/162-verdict-receipt-roadmap-desync/` → 0 — CLAUDE.md § "Smoke-test wording changes to executor-path skills" mandates the fixture for `review-*` edits; the operating norm (every prior row, e.g. 2026-07-12) records unavailability as a dated NOT-RUN row, never silence. The changed RUN-box/self-check wording is exactly the class weak models misrendered before (F39, 2026-09-02 log row) | workflow | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 43c39fd561c74002015beed710c1b29729ac8608 | n/a | n/a | review-mark | n/a | n/a |
