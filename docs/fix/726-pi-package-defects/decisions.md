# 726 — pi-package-defects · decisions

Each row is a decision this unit's plan rests on (`decision-scope@1`). The
addendum rows below were cut when issue #726 gained its "Additions for this
unit's scope" comment (2026-11-27); the earlier change and its ledgers are not
rewritten.

| id | decision | scope | ground |
|---|---|---|---|
| D1 | **The addendum is applied as a correction, not a new unit.** `S8` quotes the comment verbatim; items 1–2 were already delivered by the earlier change (the three hints are quoted and the suite asserts the string type), item 3 is the new `SL-08` regression guard, and item 4 (a patched install on the verification host) has no repository action. | unit-only | S8; the issue comment 2026-11-27; `## Log` L3 |
| D2 | **`SL-08` screens `argument-hint` only.** The owner's floor is "at minimum `argument-hint:`", and the shipped tree carries one other flow scalar — `skills/execute-phase/SKILL.md`'s `allowed-tools: [Bash, Read, Edit, Write, MultiEdit]` — whose array type is the host's contract. A general flow-scalar rule would flag a legitimate field, so the check stays on the field whose host reader requires a string. | unit-only | S8 item 3; `PE-014` |
| D3 | **The placeholder-led admission is literal.** `[<slug> …]` is admitted exactly as the owner wrote it: a value whose first meaningful token is a `<placeholder>` is a hint shape, not a flow collection. Anything else that opens with `[` or `{` is a finding. | unit-only | S8 item 3 |

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/skill-lint.test.mjs | P7 | 2026-11-27 | execute-phase | The addendum (S8 item 3) moves the CLI's check-count pin from seven to eight and adds the SL-08 fixture cases. The suite lands red first: the existing pins are updated to the new declared set and the new cases assert a finding the engine does not yet emit, so the failure is the missing engine check, not a weakened assertion. No existing case's expectation is relaxed.
justification | packages/agentic-workflow/test/skills.screen.test.mjs | P7 | 2026-11-27 | execute-phase | The addendum (S8 item 3) moves the engine's closed id-set pin from seven to eight and adds the SL-08 cases (unquoted `[`, unquoted `{`, quoted and placeholder-led admissions). It lands red before the engine change for the same reason: the id set is the contract the engine must meet, and the cases assert behaviour that does not exist yet. No existing case's expectation is relaxed.
```
