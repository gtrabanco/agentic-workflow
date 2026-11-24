---
"@gtrabanco/pi-nan-agentic-workflow": minor
---

feat(nan-preset): derive the phase-batching capability record from the provider's exported model facts

The capability record the phase-batching policy reads is generated instead of
hand-transcribed: `bun run derive:model-facts` writes
`src/model-capabilities.generated.ts` from `@gtrabanco/pi-nan-provider`'s exported
`NAN_MODEL_FACTS` (gtrabanco/pi-nan-provider#47), every cell carrying the
provider's own provenance id and the artifact naming the exact provider version
those facts were first read from. `bun run check:model-facts` proves the committed
copy, and an immaterial provider release — a new model, a dropped model this
preset does not route, a fact the policy never reads — rewrites nothing and lights
no package.

`max_phases_per_context` stays policy: it is computed from `NAN_PHASE_THRESHOLDS`
and never enters the generated file, and the provider is not read at runtime (it
is a build-time devDependency only). The four paid entries gain the harness the
provider documents, so with `phaseBatching` on they now earn four phases instead
of one; with the key off the recommendation is unchanged.
