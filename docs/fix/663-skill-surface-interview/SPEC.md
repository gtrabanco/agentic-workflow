---
name: Skill surface — discovery interview before any analysis
created: 2026-12-xx
triage: pending
ac-hash: pending
---

# Skill surface — discovery interview before any analysis

> **Interview-first. No analysis, no recommendation, no restructuring plan
> until the user answers.** This issue is the interview itself. The user
> brings context that any offline analysis misses; the goal is a **discovery
> conversation**, not a recommendation delivered in advance.

## One-line summary

The repo ships **30 skills** (~5,220 lines SKILL.md + ~130KB references).
Progressive loading bounds token cost, so this is **not a token issue**.
But: new people (or future-self) need to navigate 30 skills, merge conflicts
across review-* skills create friction, and duplicated checklist structure is
a source of future drift.

**The user is asked: does this feel like a problem worth solving, and in what
direction?** No analysis precedes this question. Any analysis is a guess.
The interview comes first.

## What we know (facts, not guesses)

- **30 skills total** (29 `SKILL.md` files in `skills/`, 14 reference directories)
- **~5,220 lines of SKILL.md source** (average ~174 lines/skill)
- **9 review-* skills** follow the same structure: header + checklist (15-20 items) + output format. Each has a different checklist. All are `user-invocable: false` — composed by `review-change` / `product-audit`.
- **5 internal-contract skills** declare contracts, don't execute: `phase-contract`, `verification-contract`, `orchestration-envelope`, `runner-contract`, `pre-execution-review`
- **13 user-facing skills** (`user-invocable: true`): unit-lane, execute-phase, triage-issue, review-change, fold-findings, product-audit, audit-pr, audit-docs, batch-scheduler, workflow-status, init-workspace, discover-repository-state, resolve-repository-state, log-session, skill-lint
- **Progressive loading** is already active: budgets enforce ≤ 2,800 est tokens / 240 lines for main SKILL.md entrypoints and ≤ 2,200 est tokens / 280 lines for references (one hop deep). The committed manifest (`docs/workflow/SKILL_CONTEXT_BUDGETS.json`) and `scripts/check-skill-context.mjs` validate this.
- A prior progressive-loading pass reduced 9 skills from 30,868 → 16,046 est tokens combined.

## What we DON'T know (the interview questions)

These are the questions. The issue is complete when the user answers them.
Partial answers are fine. No recommendation is made until after the interview.

### Core questions (answer what you can)

1. **Is the current 30-skill surface a problem worth solving?**
   - Is it mainly a discoverability issue (too many to navigate)?
   - Is it a merge-path issue (same concept in 9 files → conflicts)?
   - Is it a maintainability issue (duplicated structure → drift risk)?
   - Or is it "fine as-is" and the perceived overhead is worth the simplicity?

2. **What would a "good enough" outcome look like?**
   - Fewer skills (fewer files to manage)?
   - Cleaner structure within the same number of skills?
   - Fewer merge conflicts between skills?
   - Something else?

3. **What's the cost ceiling?**
   - How much migration effort is acceptable? (This would touch: all SKILL.md files, all reference files, all scripts that read skill paths, the pi package's staged copy, all docs, all tutorials/published skill descriptions, the `skills-lock.json` for anyone using pinning.)
   - Are there hard deadlines that make a big restructuring impractical right now?

4. **Any skills that are "sacred"?**
   - Are there skills you'd keep exactly as-is regardless of the restructuring?
   - Are there skills you'd happily merge without looking at them?

5. **What about the review pack specifically?**
   - 9 review-* skills share structure but have different checklists.
   - Would you prefer:
     - a) One consolidated skill with tabular checklists (1 file, ~300-400 lines)?
     - b) Keep them separate (9 files, ~70-130 lines each)?
     - c) Something in between (e.g., 3 groups of checklists)?
   - Is discoverability of individual review axes important, or is `review-change → run code axis` acceptable?

### Optional but helpful

6. **Do any external consumers reference specific skills by name?**
   (other projects, published docs, tutorials that link to specific skills?)

7. **Is there a timeline preference?**
   (nice-to-have now, or wait for a specific milestone/period?)

## If the user says "yes, let's restructure"

After the interview, the next step is a **concrete plan** (separate issue):

1. **Proposal draft**: based on the interview answers, propose a restructuring
   (which skills merge, which stay, what the new layout looks like).
2. **Impact analysis**: migration cost estimate, affected files, budget changes,
   test changes.
3. **Implementation plan**: ordered steps, PRs, rollback strategy.
4. **Review + approval** before any implementation.

## If the user says "not now" or "no thanks"

Close the issue as wontfix. No action needed.

## If the user says "not sure yet"

Leave open with the interview as the pending action. The user can answer later.

## References

- `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — current context budgets
- `scripts/check-skill-context.mjs` — the budget checker (reads the manifest)
- `docs/workflow/SKILLS.md` — skill reference with progressive loading docs
- README.md §"What's inside" — the 30-skill breakdown
- `skills/*/SKILL.md` — all 30 skill files