# Pre-spec — 2026-11-24-719-nan-default-embed

The pre-spec for the `unit-lane --from-issue 719` invocation: the checklist
answers what the issue, the roadmap row and the tree already say, and nothing
survives to become a question. Owner, bank and grammar:
`skills/unit-lane/references/ELICITATION.md`.

```text
pre-spec@1
id: 2026-11-24-719-nan-default-embed
request: "Make the NaN embedding profile the shipped-by-default doc-index provider, instead of preset-plus-consent, because the credentials and model are already part of the pi-nan ecosystem and (for now) effectively unmetered for the account owner. This requires (1) default-on provider resolution in pi-nan-agentic-workflow when `NAN_API_KEY` is present … and (2) exposing the doc index as a first-class pi tool so skills/models can reach it without shell commands."
shape: feature
elicitor: nan
implementer: nan
same-family: the owner's single NaN account routes every session (`PI_PROVIDER=nan`, `PI_MODEL=glm5.3-flash`), so one family both ran the checklist and will execute the phases; no question was asked, so no cross-model gap can hide inside one
questions: none — the issue names the actors, the observations, the non-goals, the surfaces and the rollback; the one open mechanism choice (how default-on resolution reaches the crate without writing bytes) is design-tier and routes to the design step, not the pre-spec
```

| field | value | provenance | receipt |
|---|---|---|---|
| user-scenario | a pi-nan user with `NAN_API_KEY` in the environment gets working auto-hybrid retrieval out of the box — no preset discovery, no manual `index.json` edit, no `/aw-index` activation ceremony — and every skill/model surface can reach the index through the new tool | request | — |
| non-goals | bounded by the issue: keep `rg` for exact strings/regex in code and LSP (serena) for symbols; extending the store's corpus beyond markdown is a separate decision; an explicit `index.json` provider block keeps overriding the default; existing shell paths stay untouched; #718's embed-pass defects stay in their own unit | request | — |
| observation | `doc --query --json-only` returns the typed result the tool wraps, and the default-on path is observed by the crate's own embed-config tests plus the pi packages' e2e suite patterns | repository | `packages/agentic-workflow/src/doc/embeddings.mjs:138` (`resolveEmbedConfig`), `packages/pi-agentic-workflow/test/embed-profile-e2e.test.mjs` |
| lane-collision | #718 (companion, parallel-safe) owns the runner crate's `doc/` code while this unit owns `packages/pi-nan-agentic-workflow` + `packages/pi-agentic-workflow` tool/extension surfaces; shared files (`docs/ROADMAP.md`, `CHANGELOG.md`) merge textually | repository | `docs/ROADMAP.md:244-245` (both triage rows record the parallel decision) |
| reversibility | reversible — the default-on path binds on `NAN_API_KEY` presence only and writes nothing by itself, the tool is additive, and reverting the unit's own diff removes both | request | — |
