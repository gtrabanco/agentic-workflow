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
| F2 | scripts/golden-fixture.test.mjs:204-215 | code | med | fix-now | fold (source) | yes |
| VF-2 | scripts/golden-fixture.test.mjs:204-215 · reviewer review-change · HEAD 3326133d2401d3b78f493cb8fd1780318b384cff · recheck reproducer: import the exported `crossReferences` and call it with a temp root whose `toy-spec.md`, `toy-acceptance.md` and `toy-plan.md` were deleted, and with an empty dir → both return `{ok:true}` because the `root` argument is never read (tokens resolve against module-level `REPO` at `:215`), while the module header `:10` and SPEC ED-55-2 (`SPEC.md:643`) declare `crossReferences(root)` | code | confirmed | finding-mark | n/a | n/a |
| F3 | docs/workflow/GOLDEN_FIXTURE.md:22-25 | code | med | fix-now | fold (source) | yes |
| VF-3 | docs/workflow/GOLDEN_FIXTURE.md:22-25 · reviewer review-change · HEAD 3326133d2401d3b78f493cb8fd1780318b384cff · recheck reproducer: in a copy of the repo, under `scripts/fixtures/golden-fixture/` run `mv toy-spec.md toy-spec-RENAMED.md` and `rm toy-acceptance.md RUN_LOG_NOTES.md`, then `node --test scripts/golden-fixture.test.mjs` → `tests 10 / pass 10 / fail 0` although the doc names all three; `FIXTURE_TOKEN` (`scripts/golden-fixture.test.mjs:201`) matches only `scripts/fixtures/golden-fixture/`-prefixed tokens, so frozen AC7's "the doc names only fixture paths that exist" is unenforced for bare names | code | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 3326133d2401d3b78f493cb8fd1780318b384cff · 2026-09-17 · review-change · axes: code, security, verify, perf · skipped: design/a11y/SEO (no UI or web surface), brand (no brand doc declared) · verdict: REVIEW-FAIL · cycle: 2 · escalated to a full pass — Width trigger (changed file docs/features/55-executable-golden-fixture/review-findings.md lies outside the cited file set `scripts/golden-fixture.test.mjs`; Size triggers not fired: 2 files, 46 changed lines). F1 re-verified clean at its cited location | n/a | n/a | review-mark | n/a | n/a |
