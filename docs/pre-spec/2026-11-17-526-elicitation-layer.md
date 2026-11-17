# Pre-spec — 2026-11-17-526-elicitation-layer

The pre-spec this unit's own layer produces, written before its triage ran: the
checklist answers what the issue, the roadmap row and the research folder already
say, and nothing survives to become a question. Owner, bank and grammar:
`skills/unit-lane/references/ELICITATION.md`.

```text
pre-spec@1
id: 2026-11-17-526-elicitation-layer
request: "NEW FEATURE: evidence-backed elicitation layer — pre-spec clarification (checklist-first, behavior-changing questions only, cross-model)"
shape: feature
elicitor: deepseek
implementer: deepseek
same-family: the owner's local apply order runs the whole unit in one session on one model (`PI_MODEL=deepseek-v4-flash`); no second family was available, and no question was asked
questions: none — the issue names the mechanism, its four evidence anchors and its non-goals, the roadmap row names the dependencies, and every applicable checklist row is answered by those three
```

| field | value | provenance | receipt |
|---|---|---|---|
| user-scenario | the maintainer typing a vague request gets a checklist-shaped pre-spec before any verdict, and triage reads its `questions:` as evidence | request | — |
| non-goals | bounded — design-tier elicitation, the `one-shot` verdict's regeneration design, a surveyed harness's taxonomy and a model-family registry stay out | request | — |
| observation | the layer's own check runs over the shipped bank and this file | repository | `packages/agentic-workflow/src/elicitation/prespec.mjs:1` |
| lane-collision | the only unit in flight on `skills/unit-lane` and `packages/agentic-workflow` for this change | repository | `docs/ROADMAP.md:156` |
| reversibility | reversible — the layer is additive, and reverting its own diff removes the reference, the command and the wiring | request | — |
