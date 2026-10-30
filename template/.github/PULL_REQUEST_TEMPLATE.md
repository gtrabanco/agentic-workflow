<!--
One PR per unit of work, always against `main`. Must be independently mergeable.
Never stack PRs.
-->

## What & why

<!-- One paragraph: what this PR delivers and why. -->

## Linked issue

<!-- "Closes #N" if this came from an issue; otherwise "n/a". -->
Closes #

## Type

- [ ] Feature
- [ ] Fix
- [ ] Chore / docs

## Checklist

- [ ] Branch is off `main` and the PR targets `main`
- [ ] Verification gate passes (type-check + tests + build)
- [ ] No architecture/dependency-rule violations (see `docs/architecture/ARCHITECTURE.md`)
- [ ] No secrets committed
- [ ] Docs updated where the documentation map requires it
- [ ] User-facing limitations disclosed (no hidden restrictions)

## Notes for the reviewer

<!-- Scope, trade-offs, anything to look at closely. -->

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
