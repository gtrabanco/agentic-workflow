# Planning evidence — 719-nan-default-embed

Home: unit folder (M-sized carrier, per the sizing rule). Column order owned by
`skills/pre-execution-review/references/LEDGERS.md`. One row per Engineering
claim; status `planned` until evidence lands.

| id | claim | source | receipt | status |
|---|---|---|---|---|
| PE-001 | With `NAN_API_KEY` present and no `index.json` provider block, exporting the three direct env vars makes the crate resolve the NaN provider for both `doc --sync` and `doc --query` | `packages/agentic-workflow/src/doc/embeddings.mjs:138-144` (D1) | planned — resolver suite row asserts configured=true with the preset's values | planned |
| PE-002 | With a provider block present the resolver injects nothing, so the block's values stay authoritative and the request budget the block implies is untouched | D1 withhold branch; `embeddings.mjs:142-144` precedence | planned — suite row asserts empty injection from a fixture config | planned |
| PE-003 | With `NAN_API_KEY` absent the resolver injects nothing and the store stays keyword-only with `unavailable-embeddings-not-configured` | `packages/agentic-workflow/src/doc/config.mjs:10-22` (AC17) | planned — suite row asserts empty injection without the key | planned |
| PE-004 | `MAX_REQUEST_CHARS=36000` reproduces the preset's measured 6000×6 pair on the default-on path because a configured provider with no explicit `chunk_limit` adopts the budget as its chunk limit | `config.mjs` (`effectiveChunkLimit`, `DEFAULT_MAX_REQUEST_CHARS`, `MAX_REQUEST_CHARS_ENV`) (D3) | planned — suite row asserts the budget value exported and its chunk-limit consequence documented, not re-derived at runtime | planned |
| PE-005 | `doc --query <term> [--mode …] --json-only` prints a typed JSON envelope the tool can render without a second read or a model-side re-derivation | `packages/agentic-workflow/src/doc/grammar.mjs:36,262`; `src/doc/envelope.mjs` | planned — tool suite parses a recorded envelope fixture | planned |
| PE-006 | Spawning the pinned runner from the tool inherits the host process environment, so the extension-load injection reaches the tool's own query runs | `aw-index-command.ts` spawn precedent; Node ≥24 child-env inheritance (CLAIM-002) | planned — e2e row queries through the tool seam from a fixture project | planned |
| PE-007 | The runner crate's tree is untouched by this unit | CLAIM-003 | planned — `git diff --stat -- packages/agentic-workflow` empty at the unit's head | planned |
| PE-008 | The strictly-added surface carries a named planned consumer (the doc_search tool and the default-on resolver are consumed by the loaded extension in every pi-nan session) | D2/D4 + `residual-promise@1` (decisions.md) | planned — `runner residual-classify --inventory --base <merge-base>` at the unit's head | planned |
