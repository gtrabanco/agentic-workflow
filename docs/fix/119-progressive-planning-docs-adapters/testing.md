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

## F9 fold — 2026-08-03

- `grep -Fq '**Issue input**' skills/plan-feature/references/ROUTING.md` → exit 0.
- `grep -Fq 'plan-feature-from-issue`, then `plan-feature-scaffold' skills/plan-feature/references/ROUTING.md` → exit 0.
