---
name: Skill surface review — discoverability, merge-path, and future-proofing
created: 2026-12-xx
triage: pending
---

# Skill surface review — discoverability, merge-path, and future-proofing

> **Discovery / interview request.** No implementation here. This issue
> solicits a review pass from the user (and whoever cares about the long-term
> skill surface) before any consolidation or restructuring happens. The goal
> is a **discovery interview** + **recommendation** + **implementation plan**
> that anyone can execute months later without asking questions.

## Summary

The repo ships **30 skills** (5,220 lines of SKILL.md source + ~130KB of
references). **Progressive loading** means not every skill loads every turn,
so current token cost is bounded by the committed budgets and is fine.

What this issue raises are other axes:

- **Discoverability** — 30 skills is a lot to navigate; a new person (or
  future-self) needs to know which ones exist, what each does, and which
  references to load for which route.
- **Merge-path stability** — many skills grew independently. Future changes
  that touch the same references (e.g. a new checklist axis, a contract
  amendment, a vocabulary addition) create merge conflicts across multiple
  skills because the same concept lives in 9 separate review-* files or
  across 5 internal-contract skills.
- **Future-proofing** — if a new axis enters the review pack, a new contract
  gets its own skill, or a reference pattern is reused, each new addition
  either duplicates a skill or grows an existing one. A more modular layout
  makes additions **add one file, touch few others**.
- **Maintainability** — 9 review-* skills have the same structure (header +
  checklist + output format). 5 internal-contract skills share the same
  purpose (declare a contract, don't execute). Duplicated structure is a
  future source of drift.

**This is not a token issue.** It is a **structure + future-proofing** issue.
The user is asked to weigh these axes against each other and decide whether
the benefit of restructuring outweighs the migration cost.

## Context for whoever picks this up later

### Progressive loading already bounds token cost

The committed budgets enforce:

- Main SKILL.md entrypoints: ≤ 2,800 est tokens / 240 lines (defaults)
- References: ≤ 2,200 est tokens / 280 lines (one hop deep)
- A few skills have per-skill overrides (unit-lane, execute-phase, init-workspace)

The progressive-loading pass that refactored 9 skills in a prior pass reduced
their combined 30,868 → 16,046 est tokens. Current budgets are healthy.

### What a typical run actually loads

Most skills are **not** loaded every turn. Only the skill the user invokes
enters context, then progressive loading brings references on demand:

| Skill | When it loads |
|---|---|
| unit-lane | Only for the specific unit being worked on |
| execute-phase | Only for specific phases |
| triage-issue | Only for specific issues |
| review-* (9) | Only when review-change invokes one axis |
| product-audit | Only on explicit invocation |
| batch-scheduler | Only on explicit invocation |
| init-workspace | Only during scaffold setup |
| log-session | Only at session close |
| workflow-status | Only on explicit invocation |

So **the total line count of 5,220 does not equal the context a model sees**.
What a model sees is one skill + the references that route demand.

### What the current layout looks like

```
skills/                          # 30 skills
├── audit-docs/SKILL.md          # 268 lines — doc audit
├── audit-pr/SKILL.md            # 233 lines — PR merge gate
├── batch-scheduler/SKILL.md     # 206 lines — parallel planning
├── discover-repository-state/   # 87 lines — frozen repo state
├── execute-phase/SKILL.md       # 406 lines — phase executor
├── fold-findings/SKILL.md       # 432 lines — findings repair
├── init-workspace/SKILL.md      # 421 lines — scaffold setup
├── log-session/SKILL.md         # 227 lines — session journal
├── orchestration-envelope/      # 88 lines — machine contract (internal)
├── phase-contract/SKILL.md      # 157 lines — phase lint rules (internal)
├── pre-execution-review/        # 80 lines — planning evidence (internal)
├── product-audit/SKILL.md       # 284 lines — product health check
├── resolve-repository-state/    # 83 lines — contradiction resolution
├── review-a11y/SKILL.md         # 71 lines  — accessibility (internal)
├── review-brand/SKILL.md        # 76 lines  — brand copy (internal)
├── review-change/SKILL.md       # 252 lines — review orchestrator
├── review-code/SKILL.md         # 129 lines — correctness (internal)
├── review-debt/SKILL.md         # 83 lines  — tech debt (internal)
├── review-design/SKILL.md       # 71 lines  — UI/UX design (internal)
├── review-implementation/       # 123 lines — classification engine (internal)
├── review-perf/SKILL.md         # 90 lines  — performance (internal)
├── review-security/SKILL.md     # 81 lines  — security (internal)
├── review-seo/SKILL.md          # 76 lines  — SEO metadata (internal)
├── review-verify/SKILL.md       # 102 lines — verification (internal)
├── runner-contract/SKILL.md     # 88 lines  — runner invocation (internal)
├── skill-lint/SKILL.md          # 137 lines — skill linting (repo-only)
├── triage-issue/SKILL.md        # 227 lines — issue classification
├── unit-lane/SKILL.md           # 376 lines — lane conductor
├── verification-contract/SKILL.md # 158 lines — acceptance artifact (internal)
└── workflow-status/SKILL.md     # 140 lines — workflow sensor
```

References are one-hop deep, 14 reference directories total, 90-111KB of
reference content in the largest (init-workspace: 9 refs / 90KB; unit-lane:
14 refs / 111KB).

### What we know about consolidation opportunities

**Review pack (9 skills, 853 lines total):**
- All follow the same structure: `header + scope + checklist (15-20 items) + materiality bar + output format`
- Each has a different checklist (a11y, brand, code, debt, design, perf, security, seo, verify)
- All are composed by `review-change` / `product-audit` — not directly invocable
- All are "findings only; never edits"
- A single consolidated skill with tabular checklists could reduce 9 files → 1 file

**Internal contracts (5 skills, 613 lines total):**
- `phase-contract` (157) — 8 phase-lint rules
- `verification-contract` (158) — acceptance artifact contract
- `orchestration-envelope` (88) — machine result contract
- `runner-contract` (88) — runner invocation contract
- `pre-execution-review` (80) — planning evidence owner
- None are "user-invocable: true"
- All declare contracts; none execute
- A single merged contract file could work

**Other candidates:**
- `skill-lint` (137 lines) — repo-only maintenance, could be merged into another
- `audit-docs` (268) and `audit-pr` (233) — could be sub-routes of `product-audit`
- `discover-repository-state` (87) and `resolve-repository-state` (83) — similar purpose, could be variants of one skill
- `log-session` (227) — mostly a record-keeper, could be simpler

### What we DON'T know (needs user input)

1. **Do any of these skills have external consumers?** (other projects, published docs, tutorials that reference specific skills?)
2. **How much time would a migration take?** (updating all references, tests, docs, and published skill descriptions?)
3. **Are there skills the user considers "core" and wouldn't touch?** (e.g., maybe `product-audit` is important enough to keep separate from `audit-pr`)
4. **What's the preferred granularity?** (e.g., would the user rather have fewer, bigger skills or just cleaner structure within the same number?)
5. **Is there a deadline?** (is this a nice-to-have refactoring or a must-do before some milestone?)

### Risks of restructuring

- **Migration cost**: every external reference, every tutorial, every published
  skill description needs updating.
- **Breakage**: if references are restructured, any session that loads a
  reference by path would break.
- **Budget changes**: restructuring changes line counts → budget ceilings
  need re-baselining.
- **Skill parity**: the pi package ships a staged copy of skills; both trees
  need to stay in sync.

### Non-goals (explicitly out of scope for this issue)

- Token cost reduction (already bounded by budgets)
- Performance optimization (scripts are the performance surface)
- Content changes (checklists, contract terms, workflows stay as-is)

## Questions for the user

Please answer what you can — partial answers are fine:

1. **Would you consider merging the 9 review-* skills into a single skill?**
   (Each is ~70-130 lines; merged would be ~300-400 lines with tabular
   checklists + a single file for checklists.)

2. **What's your tolerance for merge conflicts across skills?**
   (Right now, a change to a shared concept can touch 9+ review-* files,
   creating merge headaches. A consolidated layout reduces this.)

3. **Are any of these skills "important to see separately" even if they
   have the same structure?** (e.g., do you want users to find `review-code`
   directly, or is `review-change` → "run code axis" acceptable?)

4. **What about the 5 internal-contract skills?** Should they be:
   a) One merged file with named blocks?
   b) Kept separate because they serve different roles?
   c) Something else?

5. **Should this be a discovery interview only, or do you want a concrete
   plan with implementation steps?**

## References

- `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — current context budgets
- `scripts/check-skill-context.mjs` — the budget checker (reads the manifest)
- `docs/workflow/SKILLS.md` — skill reference with progressive loading docs
- README.md §"What's inside" — the 30-skill breakdown