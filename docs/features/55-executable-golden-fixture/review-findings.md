# Review findings — 55-executable-golden-fixture

Fix-now fold ledger for the unit's review cycles (schema `finding-mark@1` /
`review-mark@1`, `skills/pre-execution-review/references/LEDGERS.md`). Created
2026-09-17 by `/review-change` (cycle 1, single-reviewer) over HEAD
`bf2ae86b26545fff6ebee2b3154ca95f64cdc34d` (PR #240). Scope:
`git diff origin/main...HEAD`. Applicable axes run: code, security, verify,
perf. Skipped: design/a11y/SEO (no UI or web surface), brand (no brand doc
declared). Every row below is a **confirmed** candidate verified against the
reviewed head's bytes, carrying its `VF-` signature; `folded` is flipped to
`yes` only by the unit's fold cycle (`/fold-findings`). Cycle 1 surfaced one
fix-now finding; no candidate was refuted.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | scripts/golden-fixture.test.mjs:286 | code | high | fix-now | fold (source) · fold c32525c | yes |
| VF-1 | scripts/golden-fixture.test.mjs:286 · reviewer review-change · HEAD bf2ae86b26545fff6ebee2b3154ca95f64cdc34d · recheck failing reproducer: `runLogGrammar` over the committed `docs/workflow/GOLDEN_FIXTURE.md` plus one valid append `\| 2026-09-18 \| synthetic \| \`test\` \| exact 12/12 · invented none · shape ok \| … \|` returns `{"ok":true,"rows":44,"checked":1}` while `assert.equal(result.checked, 0, "no committed row is dated on/after the 2026-09-18 cutoff yet")` then fails — the frozen contract (ACCEPTANCE AC3(c); SPEC O5 / ED-55-4) requires only that every post-cutoff row match the grammar, and the run log is append-only (`docs/workflow/GOLDEN_FIXTURE.md:103`, "One row per run. Append a row after every run"), so the suite hard-fails the repo gate on the first legitimate post-cutoff row | code | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD bf2ae86b26545fff6ebee2b3154ca95f64cdc34d | n/a | n/a | review-mark | n/a | n/a |
