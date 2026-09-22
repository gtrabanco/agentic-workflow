# Design step

## Purpose

Induce acceptance criteria from user scenarios and close entity, role, and
expectation boundaries — distilled from the full design skill's closure.

## Inputs

- The unit's objective, why, and user outcome from the SPEC
- Research findings from the research step

## Fixed output contract

Fill the unit doc's **Acceptance criteria** section. Each AC must be:
- Induced from a concrete user scenario ("I do X and observe Y")
- Command-verified where possible (not "feel correct")
- Numbered (AC1, AC2, …)

## Checklist (pass only if)

- [ ] Every AC is induced from a user scenario, not inferred from vague intent
- [ ] Acceptance criteria are command-verified where possible
- [ ] Entity closure: every entity mentioned has its role in the unit stated
- [ ] Role closure: every actor/role that interacts with the unit is listed
- [ ] Expectation sweep: user's accepted and rejected inputs are bounded
- [ ] Vague items → ask the user with concrete options, never invent

## Forbidden

- Do not build a separate DESIGN.md — one SPEC, all in the unit doc
- Do not invent product scope the user did not confirm
- Do not pre-fill engineering content (phases, tests, architecture)
- Do not stamp "designed" with an incomplete closure row
- An incomplete row silently un-does the skill's purpose