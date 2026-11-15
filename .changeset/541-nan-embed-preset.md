---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
"@gtrabanco/pi-nan-agentic-workflow": minor
---

feat(doc-index): a provider preset ships the embedding profile and the console materializes it (issue #541)

The retrieval index reads one block for its embeddings provider — the
`provider` block of the committed `.agentic-workflow/index.json` — and nothing
told a NaN user what safe values were. `@gtrabanco/pi-nan-agentic-workflow` now
ships that block as data on its provider preset
(`ProviderPreset.embedProfile`): the endpoint, `qwen3-embedding`, the
`NAN_API_KEY` variable, a chunk limit its 32,768-token input window tolerates,
and the pacing its 60-requests-per-minute key cap tolerates (the README states
the key-global caveat: the cap is shared with chat traffic).

`@gtrabanco/pi-agentic-workflow` gains the materialization surface:
`/agentic-workflow-settings` → `Doc index embedding profile` shows, per key,
whether the value in force came from the preset, the operator or the engine's
default, and writes the profile after an explicit yes — filling only the keys
the project leaves absent, so a value the project wrote always wins, `pacing`
decided knob by knob, and a second run writes nothing. Nothing is written at
extension load, on a query or by a sync.

`@gtrabanco/agentic-workflow` stays provider-neutral and gains the schema: the
whole `provider` block (the three string fields, both budgets, every pacing
knob) is validated at config load, and `validateIndexConfigObject(root, body)`
exposes that same judgment for a candidate a writer outside the crate staged, so
the materializer keeps no second copy of the rules. A previously-latent bad
pacing value is now refused at load instead of only when resolved.
