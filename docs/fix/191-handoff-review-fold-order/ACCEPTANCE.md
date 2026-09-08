# Acceptance manifest v1 — fix-191-handoff-review-fold-order

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The inverted fold-first pattern is gone from both verified surfaces | `grep -rn "fold-findings, then re-run /review-change" skills/execute-phase/ skills/ship-roadmap/` → 0 matches |
| AC2 | Every reordered block leads with `/review-change`; fold appears only as the correction leg after a verdict | `grep -rn "→ Next: /review-change" skills/execute-phase/references/UNIT_LOOP.md skills/execute-phase/references/FOLDING.md skills/execute-phase/references/CLOSEOUT.md` → ≥ 3 matches (one per file) |
| AC3 | Verdict-following fold uses did not regress | `grep -c "fold-findings" skills/review-change/SKILL.md skills/review-plan/references/OUTPUT.md skills/review-spec/references/OUTPUT.md skills/review-implementation/references/CLASSIFY.md skills/fold-findings/SKILL.md` → every count ≥ 1 |
| AC4 | Discipline suite green with a new red-first pin of the canonical order on `UNIT_LOOP.md` | `node --test scripts/next-recommendations.test.mjs scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs` → all pass, new pin present |
| AC5 | Full project gate green | `npm test` → all pass |
| AC6 | The word "mandatory" never labels the fold hand-off | `grep -rn "mandatory \`/fold-findings\`" skills/execute-phase/` → 0 matches; `grep -n "mandatory" skills/execute-phase/references/CLOSEOUT.md` matches only review-mandatory sentences |
| AC7 | Context budgets still pass for both edited skills | `node scripts/check-skill-context.mjs` → exit 0 |
| AC8 | Release bookkeeping: `execute-phase` → 4.4.1, `ship-roadmap` → 5.2.1 with CHANGELOG rows | `grep -n "4.4.1" skills/execute-phase/SKILL.md CHANGELOG.md CHANGELOG.es.md` → ≥ 1 match per file; `grep -n "5.2.1" skills/ship-roadmap/SKILL.md CHANGELOG.md CHANGELOG.es.md` → ≥ 1 match per file |
| AC9 | ES sibling CHANGELOG row ships in the same change; `bundle:skills` re-bundle committed | read-verified: diff of the unit's commit shows faithful `CHANGELOG.es.md` row + bundle mirror files |
| AC10 | Every reordered block's wording matches the canonical correction path declared by `skills/review-change/SKILL.md` (review → fold-if-findings → re-review; two-cycle cap pointer preserved where present) | read-verified: side-by-side of each edited block against `review-change` SKILL.md correction-path wording |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `node --test scripts/next-recommendations.test.mjs scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs`
- `npm test`
- `node scripts/check-skill-context.mjs`
