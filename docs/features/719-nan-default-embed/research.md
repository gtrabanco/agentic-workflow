# Research — 719-nan-default-embed

Everything the unit needs was answered by the tree and the two Engram topics;
no external fetch was owed (skipped-research exit: the receipt substitutes the
fetch). Read with the noun "the crate" = `packages/agentic-workflow`, "the pi
package" = `packages/pi-agentic-workflow`, "the companion" =
`packages/pi-nan-agentic-workflow`.

## Repo-answered receipts

| # | Claim | Receipt |
|---|---|---|
| R1 | The crate's `resolveEmbedConfig` already resolves a provider from the direct pi-style env vars alone — no `index.json` provider block needed | `packages/agentic-workflow/src/doc/embeddings.mjs:138` (precedence doc: "`cli` > direct pi-style env > config file") and `:46` (`DIRECT_ENV`) |
| R2 | The direct env vars beat the config's provider block in that precedence — so an unconditional env injection would defeat an operator's explicit block, which S4 forbids; the inject-or-withhold decision must read the project's `index.json` first | `packages/agentic-workflow/src/doc/embeddings.mjs:142-144` (`pick(cliValue, envName, configValue)`: env wins over config) |
| R3 | The committed `index.json` is a documented-decision surface; missing config is never a hard failure and the keyword-only degradation is `unavailable-embeddings-not-configured` | `packages/agentic-workflow/src/doc/config.mjs:10-22` |
| R4 | The preset seam exists end to end: the companion registers `NAN_EMBED_PROFILE` into `registerProviderPreset` and never depends on the crate; the pi package consumes the preset's embed profile for `index.json` materialization (per-key, absent-keys-only) | `packages/pi-nan-agentic-workflow/src/extension.ts:4-33`, `packages/pi-agentic-workflow/src/config/embed-profile.ts:1-19` |
| R5 | The chunk budget has an env override (`AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MAX_REQUEST_CHARS`) but `chunk_limit` itself does not; with a configured provider and no explicit `chunk_limit`, the request budget becomes the chunk limit, so the preset can carry its 6000×6 tuning through the budget env var without a crate change | `packages/agentic-workflow/src/doc/config.mjs` (`MAX_REQUEST_CHARS_ENV`, `effectiveChunkLimit`, `DEFAULT_MAX_REQUEST_CHARS = 90000`) |
| R6 | The query surface a tool would wrap exists as a typed envelope: `doc --query <term> [--mode keyword|hybrid] [--json-only]`, and `queryIndex(root…)` returns `buildEnvelope(...)` with auto-hybrid resolution and the AC17 declared degradation when no provider resolves | `packages/agentic-workflow/src/doc/grammar.mjs:36,262`, `packages/agentic-workflow/src/doc/query.mjs:104-140` |
| R7 | The pi tool adapter pattern to extend: specs in `workflow-tools.ts` (name, parameters JSON schema, `execute(params, cwd)` spawning the runner), `exposure: "deferred"` + namespace `agentic-workflow`, tests in `workflow-tools*.test.mjs`/`shipped-adapter.test.mjs` | `packages/pi-agentic-workflow/src/extension/workflow-tools.ts:14-25,260-330` |
| R8 | The live-project evidence behind the issue (corpus ran keyword-only a full day; activation needed preset discovery → materialization → `/aw-index`) and the recorded owner proposal ("preset ships the profile; the runner crate stays provider-neutral/config-driven") | Engram `aw-index-partial-embeddings` (project `sosfelinosbasti`), `nan-embeddings-usage-debug` (project `agentic-workflow`) |

## Uncertainties (routed to the fused design+plan pass)

1. **Injection mechanism** (R1/R2): inject the direct-env vars into the host
   process environment at extension load, or resolve per spawn at tool/sync
   call time — and per-key (only keys the explicit block does not already
   carry). Normative: architecture fit, precedence semantics.
2. **Ownership split** (R4): the companion owns the data, the pi package owns
   the logic — where the "read `index.json`, decide, inject" code lives so the
   companion's no-crate-dependency rule holds (`extension.ts:13`).
3. **Tool shape** (R6/R7): name (`doc_search` vs `agentic_workflow_doc_search`
   namespace convention), params `{query, mode?}`, typed result mapping from
   the doc query envelope, read-only annotations, deferred exposure.
4. **Chunk tuning parity** (R5): whether default-on should also carry
   `max_request_chars = 36000` (the preset's 6000×6 pair) or leave the crate's
   safe default — a measured-cost question, not a guess.

## Gaps

One gap is deliberately not researched here: #718's embed-pass defects. They
belong to the companion fix unit; this unit only avoids depending on their
absence ("affects" check stays in `## Known pre-existing issues`).
