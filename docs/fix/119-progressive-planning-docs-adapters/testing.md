# 119-progressive-planning-docs-adapters · testing

## P1 — 2026-08-02

- `node scripts/check-skill-context.mjs --skill plan-feature` → exit 0.
- `git diff --check` → exit 0 before commit.
- Behavioral probe remains for P3: a fresh-context issue-derived route must load
  `PLANNING_GATES.md` before invoking `plan-feature-from-issue`.

## P2 — 2026-08-02

- `node scripts/check-skill-context.mjs --skill generate-docs` → exit 0.
- `grep -q "Docusaurus" skills/generate-docs/references/ADAPTERS.md` → exit 0.
- `git diff --check` → exit 0 before commit.

## P3 — 2026-08-02

- `node scripts/check-skill-context.mjs` → exit 0.
- `node scripts/check-skill-context.test.mjs` → exit 0.
- `npx skills add . --list` → exit 0; discovered 30 installable skills.
- `git diff --check` → exit 0.
- `git status --porcelain -- docs/` → empty before the P3 close-out edits.

## P4–P7 — planned

- P4: `node scripts/check-skill-context.mjs --skill plan-feature` after the
  issue route loads planning gates before composing its writer.
- P5: `node scripts/check-skill-context.mjs --skill plan-feature-scaffold`
-  → exit 0 after the cross-skill handoff link is replaced by the self-contained
  progress ownership statement.
- P6: `! git diff --name-only origin/main...HEAD | grep -Fx
  'docs/features/20-runtime-guardrails-progressive-skills/review-findings.md'`.
- P7: fresh-context `--from-issue` probes with `draft`, `contradicted`, and
  `resolved` NRS ledgers; record the no-write result and route in both Golden
  Fixture language variants before closing F4–F8.

## P4 — 2026-08-03
- `node scripts/check-skill-context.mjs --skill plan-feature` → exit 0.
- `git diff --check` → exit 0.
- Read-verified: issue routing resolves identity before composing `plan-feature-from-issue`; the parent route loads `PLANNING_GATES.md` first.

## P6 — 2026-08-03
- `node scripts/check-skill-context.mjs --skill plan-feature --skill generate-docs --skill plan-feature-scaffold` → exit 0; all three selected skills passed.
- `node scripts/check-skill-context.test.mjs` → exit 0.
- The nine progressive entrypoints sum to `16,035` estimated tokens; the bilingual context references and changelog entries contain `16,035` and no stale `15,977` total.
- `git diff --check` → exit 0.
- Read-verified: the feature-20 review ledger is unchanged after removing this branch's F51–F53 hunk; the unit scope retains the approved amendment and enumerates the progressive resources.

## P7 — 2026-08-03

- `node scripts/check-skill-context.mjs` → exit 0; 31 skills passed.
- `node scripts/check-skill-context.test.mjs` → exit 0.
- `npx skills add . --list` → exit 0; discovered 30 skills.
- `git diff --check` → exit 0.
- Feature-20 ledger exclusion check → PASS; the historical review ledger is absent from `origin/main...HEAD`.
- Read-verified fresh-context probes → PASS for `draft`, `contradicted`, and `resolved`: the parent route loads `PLANNING_GATES.md` before composing `plan-feature-from-issue`, each non-frozen state stops before a product-half write, and the expected route is discovery or resolution.
- Review-change read-only pass → PASS: implementation, code, verification, debt, and performance axes found no new finding; UI, accessibility, brand, and SEO axes were n/a for this docs/skill change. Architectural invariants were n/a because no project invariant document exists. Manual checklist: weak-model live run not performed; read-verified route probes passed.
- Audit-pr read-only pass → BLOCKED: PR #120 is mergeable and closes #119, but `gh pr checks 120` reports no checks, so CI verification evidence is absent. No MERGE-READY comment was posted.

## P8 — 2026-08-03

| Acceptance | Evidence owner | Verification |
| --- | --- | --- |
| 1 | P4 issue-route gate | `node scripts/check-skill-context.mjs --skill plan-feature` → exit 0 |
| 2 | P2 adapter slots | `node scripts/check-skill-context.mjs --skill generate-docs` → exit 0 |
| 3 | P2 adapter slots | Docusaurus slot grep covers content, page, guides, map, review, sidebar, verify, and assets |
| 4 | P1–P3 ledger | F1–F3 retain `fix-now` and `replan-in-unit` |
| 5 | P3 PR close-out | `git diff --check` → exit 0; PR #120 body includes `Closes #119`; fix index links the PR |
| 6 | P5 reference ownership | `node scripts/check-skill-context.mjs --skill plan-feature-scaffold` → exit 0 |
| 7 | P7 read-verified route probes and P10 live probe | `draft`, `contradicted`, and `resolved` stop before a product-half write and route to discovery or resolution |
| 8 | P6 traceability | feature-20 review ledger is absent from `origin/main...HEAD` |

- `node scripts/check-skill-context.mjs --skill plan-feature --skill plan-feature-scaffold` → exit 0.
- `git diff --check` → exit 0 before commit.

## F9 fold — 2026-08-03

- `grep -Fq '**Issue input**' skills/plan-feature/references/ROUTING.md` → exit 0.
- `grep -Fq 'plan-feature-from-issue`, then `plan-feature-scaffold' skills/plan-feature/references/ROUTING.md` → exit 0.

## P9 — 2026-08-03

- Selected-route probe: `grep -Fq 'selects the issue-derived route; detection itself' skills/plan-feature/references/ROUTING.md` → exit 0.
- Parent-ownership probe: `grep -Fq 'The parent route owns the' skills/plan-feature/references/ROUTING.md` → exit 0.
- Read-verified: issue detection selects the route before composition; the parent loads and applies `PLANNING_GATES.md` before composing `plan-feature-from-issue`.
- `node scripts/check-skill-context.mjs --skill plan-feature` → exit 0.
- `git diff --check` → exit 0.

## P10 — 2026-08-03

- Tool-calling smoke: `qwen3:8b` with `think=false`, temperature `0`, and seed
  `20` returned `finish_reason: tool_calls`, function `get_time`, and parseable
  `{}` arguments.
- Live weak-model NRS issue-route probe: `draft` called `read_nrs`, then
  `/discover-repository-state`; `product_half_write_called: false`.
- Live weak-model NRS issue-route probe: `contradicted` called `read_nrs`, then
  `/resolve-repository-state`; `product_half_write_called: false`.
- Live weak-model NRS issue-route probe: `resolved` called `read_nrs`, then
  `/resolve-repository-state`; `product_half_write_called: false`.
- All three fresh runs printed a `→ Next:` hand-off; no product-half write tool
  was called. F18 is folded.
- `grep -Fq 'live weak-model NRS issue-route probe' docs/workflow/GOLDEN_FIXTURE.md docs/workflow/GOLDEN_FIXTURE.es.md` → exit 0.
- `git diff --check` → exit 0 before commit.

## P11 — 2026-08-03

- `node scripts/check-skill-context.mjs` → exit 0; 31 skills passed.
- `node scripts/check-skill-context.test.mjs` → exit 0.
- `npx skills add . --list` → exit 0; discovered 30 skills.
- `git diff --check` → exit 0.
- `git status --porcelain -- docs/` → empty before the final close-out edits.
- Feature-20 ledger exclusion check → exit 0.
- Existing PR verification: `gh pr view 120` → `OPEN`, `MERGEABLE`, base
  `main`, body contains the amended progressive-resource scope and `Closes #119`.
- `gh pr checks 120` reports no published checks; this remains an `audit-pr`
  merge-gate blocker and is not claimed as CI evidence here.

## P12 — 2026-08-03

- `node scripts/check-skill-context.mjs` → exit 0; 31 skills passed.
- The mechanically verified progressive budget is `16,046` estimated tokens;
  `docs/workflow/SKILLS.md`, `docs/workflow/SKILLS.es.md`, `CHANGELOG.md`, and
  `CHANGELOG.es.md` contain the synchronized total.
- `grep -Fq 'Layer: close-out. Done-when: `git diff --check` → exit 0.`'
  docs/fix/119-progressive-planning-docs-adapters/SPEC.md` → exit 0.
- Fix-index row 119 is `in progress` while P12/P13 remain open.
- F13 and F20 are folded (`yes`) in `review-findings.md`.
- `git diff --check` → exit 0.
