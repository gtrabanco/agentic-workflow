---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": patch
"unit-lane": minor
"triage-issue": minor
---

feat(526): Layer 0 of the input path — the pre-spec before triage

A vague request becomes a structured `pre-spec@1` before the lane triages it: a
checklist bank fills what the request, the tree and the docs already answer, the
bank's declared cheap default lands as a dated assumption where nothing answers,
and only what survives both becomes **one** open question in the
`open-questions@1` block the design step already reads.

- `skills/unit-lane/references/ELICITATION.md` is the layer's single owner: a
  16-row checklist bank over six request families plus an `any` family, the
  artifact's grammar and its home (`docs/pre-spec/<YYYY-MM-DD>-<slug>.md`), the
  fill-then-assume-or-ask rule, one-question-at-a-time calibration, the
  cross-family rule with its declared degradation, and the contextual-approval
  block with its hard boundary.
- `agentic-workflow elicitation check --bank <path> --spec <path>` is the
  artifact's own check (exit 0 `ELICITATION CHECK PASS` · 1 `… BLOCKED` · 2
  `EDIT REFUSAL`). The qualification (`two answers → a question`), the
  completeness of the checklist, the receipt each provenance demands, the
  one-open-question rule and the family rule are all mechanical; the question
  columns are imported from the `needs-input` reader, so the layer cannot drift
  from the grammar it feeds.
- `triage-issue`'s `one-shot` eligibility reads the pre-spec (`questions: none`
  is its evidence that no design decision is pending) instead of asserting that
  the work is "small and understood"; the six conditions are unchanged, and the
  layer adds no gate.
- Not a second ask mechanism: design-tier questions stay the design step's
  batched ask, and the pre-spec is a record — never an approval.
