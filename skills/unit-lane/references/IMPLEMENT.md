# Implement step

## Purpose

Execute the plan's tasks against the code. One phase per commit. Layer order
respected. Guard enforced.

## Inputs

- The unit's Tasks section (filled by the plan step)
- The project's architecture doc (layer rules)
- The diff guard baseline from the triage step's reference

## Fixed output contract

After each phase commit, update the unit doc's **Evidence** section and
**Progress log**:

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| P1 | <git commit sha> | 0 · <sha> | <result ≤2 lines> | <model> |

## Checklist (pass only if)

- [ ] Phases executed in P1, P2, … order from the Tasks section
- [ ] One phase per commit (no bundling)
- [ ] Layer order respected (inner layers don't import outer)
- [ ] `git status --porcelain` is empty after each commit
- [ ] Diff guard passed after each phase (see step 4 in SKILL.md)
- [ ] Red run avoided — tests pass before committing, or tests-first red-run
    evidence recorded

## Allowed

- Changes scoped to the phase's acceptance criteria only
- Bug fixes in affected paths that the phase touches
- Documentation updates in the same commit as the code change

## Forbidden

- No unrelated refactors in the same commit
- No new abstractions or dependencies beyond what the unit doc demands
- Never commit red (test failure)
- Never shrink a diff by deleting comments, blank lines, docs, or tests
- Do not expand scope beyond the unit's non-goals