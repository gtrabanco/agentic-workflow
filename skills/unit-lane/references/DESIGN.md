# Design step

## Needs-input guard

A blank or vague scope or acceptance-criteria input is a gap, not a licence to
infer. The order is fixed: search the repository's own docs first and append an
`open-question` row to the unit folder's `decisions.md` recording where; research
an external gap into 2–3 concrete options. A gap surviving both runs
`node scripts/needs-input.mjs <unit-dir>`, pastes the `open-questions@1` block
and stops — route `design` for scope/architecture questions. "Decide for me" is
a legitimate answer: the lane chooses and records the choice with its reason.
Cheap-to-change defaults are recorded as assumptions, never silent.

## Purpose

Run the gap interview, induce acceptance criteria from user scenarios, and
close entity, role, and expectation boundaries — distilled from the full design
skill's closure.

## Inputs

- The unit's objective, why, and user outcome from the SPEC
- The user's original request, the repository's current state, and the
  installed tooling — whatever they already answer is never asked again
- Research findings from the research step

## The gap interview (runs before acceptance criteria lock)

Collect every open decision the unit depends on and filter each one:

| The gap… | The lane does |
|---|---|
| The request, the repo, or the installed tooling already answers it | Never asks |
| Blocks now and is expensive to undo once code sits on top | Asks |
| Blocks a later task that is already foreseeable | Asks now as a possibility; re-asks only if conditions change |
| Cheap to change later | Takes a reasonable default and records it as an assumption — never silent |

Expensive to undo = the choices that cost a lot to change once code exists on
top: **scope** (personal / team / global), **stack**, **architecture pattern**,
**data model**, **deployment target**, and **security configuration**.

Mechanics — one batched form-turn, never one-question-per-turn:

- Group all independent questions into a single turn; ≤6 slots, one-word
  defaults accepted, ≤2 ambiguity follow-ups per slot.
- Ask a single question first only when its answer changes the others. When
  more than five gaps remain, the root decision (objective or scope) goes
  first — its answer usually removes most of the rest.
- Every slot carries: the **recommended option with its why**, one
  alternative, **"Decide for me"**, and **"Explain the options"** — the user
  may always answer freely.
- **"Decide for me"**: the lane chooses, then records the choice and its
  reason as a dated row in the unit folder's `decisions.md` — explicit, never
  guessed silently.
- **"Explain the options"**: explain each alternative didactically, then
  re-ask only that slot.
- A tool the project lacks may be offered as one more option (with its
  recommendation and why); installing it always needs the user's explicit
  consent.
- **Ready when:** no expensive-to-undo blocking gap remains unanswered — not
  when no gaps remain. An answer the user already gave is never re-asked.

Deferred ideas ("down the road I'd like…") are never implemented, never turned
into spec or tasks by this unit: they go verbatim to the unit doc's
`## Future` section, dated, so the architecture may accommodate them without
building them.

## Fixed output contract

Fill the unit doc's **Acceptance criteria** section. Each AC must be:
- Induced from a concrete user scenario ("I do X and observe Y")
- Command-verified where possible (not "feel correct")
- Numbered (AC1, AC2, …)

## Checklist (pass only if)

- [ ] The gap interview ran before the ACs locked: one batched form-turn,
      each gap filtered through the table above
- [ ] No expensive-to-undo blocking gap remains unanswered
- [ ] Every "Decide for me" choice is recorded with its reason in `decisions.md`
- [ ] Cheap defaults are recorded as assumptions, correctable by the user
- [ ] Deferred user ideas landed in `## Future`, not in scope
- [ ] Every AC is induced from a user scenario, not inferred from vague intent
- [ ] Acceptance criteria are command-verified where possible
- [ ] Entity closure: every entity mentioned has its role in the unit stated
- [ ] Role closure: every actor/role that interacts with the unit is listed
- [ ] Expectation sweep: user's accepted and rejected inputs are bounded
- [ ] Vague items → ask the user with concrete options, never invent

## Forbidden

- Do not ask what the request, the repo, or the installed tooling already answers
- Do not ask one question per turn when slots are independent
- Do not implement, spec, or task anything from `## Future`
- Do not install a missing tool without explicit user consent
- Do not build a separate DESIGN.md — one SPEC, all in the unit doc
- Do not invent product scope the user did not confirm
- Do not pre-fill engineering content (phases, tests, architecture)
- Do not stamp "designed" with an incomplete closure row
- An incomplete row silently un-does the skill's purpose
