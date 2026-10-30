<!--
All PR descriptions are written in English. Delete the section that
does not apply (feature vs fix).
-->

## Type

- [ ] Feature
- [ ] Fix
- [ ] Chore / docs / infra (no behaviour change)

## Linked issue

<!-- Required for fixes. Optional for features unless they originated
from an issue. Use `Closes #<n>` so the issue auto-closes on merge. -->

Closes #

---

## Feature PR — delete if this is a fix

### Phase

Which phase from `docs/features/<NN>-<slug>/TASKS.md` does this PR close?

### Summary

One or two sentences. What changed and why.

### SPEC reference

- SPEC: `docs/features/<NN>-<slug>/SPEC.md`
- Progress: `docs/features/<NN>-<slug>/progress.md`
- Decisions added: `<none>` or list the decision IDs

### Acceptance criteria covered

- [ ] Criterion 1
- [ ] Criterion 2

---

## Fix PR — delete if this is a feature

### SPEC reference

`docs/fix/<n>-<topic>/SPEC.md`

### Root cause (one line)

### Change set (one line)

### Rollback

How to revert safely if this misbehaves in production.

---

## Verification

- [ ] Type-check passes
- [ ] Tests pass
- [ ] Build passes
- [ ] No architecture violations (per the project's architecture doc)
- [ ] No hardcoded secrets
- [ ] No hidden user-facing limitations
- [ ] Any other project-mandated rules satisfied

## Notes for the reviewer

<!-- Anything that helps the reviewer: tricky decisions, places to
look first, follow-ups already scheduled, things deliberately left
out. -->

---

## Evidence pack — render, don't re-type

Generated from the unit doc's acceptance criteria, Evidence rows and decisions.
Every acceptance criterion links its demonstration. A criterion with no
demonstration never reaches the merge gate.

### Human layer — for the approver who did not do the work

<!--
Plain language, no codebase knowledge assumed. For each criterion:
what was asked → what you can now do → how to see it yourself.
-->

- **Asked for:** <what the requester wanted>
- **Now you can:** <the behaviour, in one sentence>
- **See it yourself:** <the exact click path / command a non-technical approver
  can follow, with the capture or pasted output beside it>

### Technical layer — for the merge gate

<!--
One row per acceptance criterion: the criterion, the command that demonstrates
it, and the observed result. `audit-pr` checks this table and re-runs a sample.
-->

| AC | demonstration (command / capture) | observed |
|---|---|---|
| <AC id> | `<command>` | <exit code + output, pasted not typed> |

### Decisions and resolved ask-gates

<!--
The why travels with the what: decisions taken (and their reason), plus every
question asked under ask-don't-infer and the answer received — so the approver
sees nothing was invented. New contracts name where they are documented for
their future consumers.
-->

- **Decision:** <what was chosen> — <why>
- **Asked:** <the question> → **Answered:** <the answer>
- **New contract:** <name/field/endpoint> — documented in <path> for <consumer>
