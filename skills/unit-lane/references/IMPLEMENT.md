# Implement step

## Purpose

Hand the plan's phases to the executor, one phase per turn. The conductor
never runs an execution phase inline — per-step model routing is reachable
only across a turn boundary (issue #291 AC3/AC4).

## Inputs

- The unit's Tasks section (filled by the plan step)
- The triage block's `Tiers:` line (the `implement` entry is the execution tier)
- The unit's Progress log (which phases are done)

## Fixed output contract

At each execution boundary, print exactly one phase hand-off and end the turn:

```
→ Next: /execute-phase <NN-slug> P<k> (tier: <tier>) — run phase P<k>; the lane resumes after the last phase
  · no unfinished phase → continue the close-out ladder
```

`<k>` = first unfinished phase (lowest `P<n>` bullet the Progress log does not
record; `bun scripts/unit-route.mjs <NN-slug>` prints it — if every phase is
recorded while the index still reads `in-progress`, the router refuses with
`UNIT ROUTE — error … settle the index or roadmap status` and exits 1). `<tier>` =
the `implement` entry of the triage block's `Tiers:` line. Never the bare
whole-unit command.

When the last phase's turn closes, `execute-phase` resumes the lane. Verify
its work landed in the unit doc before continuing:

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| P1 | <phase validator> | 0 · <sha> | <result ≤2 lines> | <executor model> |

## Checklist (pass only if)

- [ ] Every phase handed off as `/execute-phase <NN-slug> P<k> (tier: <tier>)`
      — exactly one phase, never a bare whole-unit command
- [ ] Phases ran in P1, P2, … order from the Tasks section
- [ ] Each executor turn recorded its Evidence row and dated Progress entry
- [ ] Diff guard run at the lane's resume (see step 4 in SKILL.md)
- [ ] `git status --porcelain` is empty when the lane resumes

## Allowed

- Changes scoped to the phase's acceptance criteria only (enforced by the
  executor's own gates)
- Documentation updates in the same commit as the code change

## Forbidden

- Never run an execution phase inline at the conductor's tier
- No unrelated refactors in the same commit
- No new abstractions or dependencies beyond what the unit doc demands
- Never commit red (test failure)
- Never shrink a diff by deleting comments, blank lines, docs, or tests
- Do not expand scope beyond the unit's non-goals