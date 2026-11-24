# 695 — derived-capability-record · planning evidence

One row per Engineering claim this change rests on. Column order and freshness
vocabulary are owned by `skills/pre-execution-review/references/LEDGERS.md`;
every row names the decision or obligation it affects. A claim carried from
memory is `unknown` with an owner — never a silent citation.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | measured-probe | `@gtrabanco/pi-nan-provider@1.6.1` exports `NAN_MODEL_FACTS` (13 models), `NAN_MODEL_FACTS_META` (build stamp + citation table) and `NAN_FACT_SOURCES`, and its `src/model-facts.ts` subpath imports only data modules (`scripts/models.generated.ts`, `scripts/manual-overrides.ts`, `scripts/model-facts.ts`, `./model-facts-core.ts`) — no pi runtime, no network | probe run in this workspace (`bun -e` importing the subpath, receipt `E3`), package tarball `gtrabanco-pi-nan-provider-1.6.1.tgz` | verified 2026-11-23 | D2; O1; O2 |
| PE-002 | measured-probe | the exported facts for the routed fleet: `contextWindow` 1,048,576 for seven routed models and 1,000,000 for `qwen3.8-max`/`qwen4-max`, 262,144 for `qwen3.6`/`gemma4`; `toolCalling` `openai-tools` on nine, `xml` on `qwen3.6`/`gemma4`/`qwen3.8-flash`; `cacheMode` `automatic` on nine and `unmeasured` on the same two cluster models; `cost` all-zero on every model | the same probe, printed as a table (receipt `E3`) | verified 2026-11-23 | D3; D5; O5; O6 |
| PE-003 | file-read | the recorded snapshot carries `context: 1000000` for the eight non-cluster routed models and no `capabilities` key on the four paid entries, so a provider-derived record would disagree with it on exactly those cells | `packages/pi-nan-agentic-workflow/catalog/nan-catalog-2026-11.jsonc` (`models[]`), read by the shared JSONC parser (receipt `E4`) | verified 2026-11-23 | D5; O6; O10 |
| PE-004 | file-read | the provider's `cost` pair is pinned to zero on every model by the credit-pool decision, so it cannot answer "is a cached read cheaper here"; the credit tariff that can is this repository's snapshot (`credits_when_exceeded` / `rates`, `cached.credits_per_1m` < `input.credits_per_1m` on all nine published pairs) | provider `scripts/generate-models.ts` NAN_CATALOG_COST note (quoted in every entry's `notes`), plus the snapshot fields above | verified 2026-11-23 | D3; O5; O7 |
| PE-005 | file-read | the two vocabularies the mapping targets are already published and owned by the schema package — `PHASE_BATCHING_TOOL_HARNESSES` (`native \| xml \| unmeasured`) and `PHASE_BATCHING_CACHE_POSTURES` (`discounted \| flat \| unmeasured`) — so no schema change is needed and the mapping must target those tokens, not invent any (IR1) | `packages/agentic-workflow-schema/src/phase-batching.ts` | verified 2026-11-23 | S12; O2; O5 |
| PE-006 | measured-probe | node cannot import the provider's TypeScript sources at all: node 26 answers `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` for a file under `node_modules`, and older node has no type stripping — so the generator is bun-run by necessity, not by preference | probe run through `node --test` on a throwaway `/tmp` file importing the installed subpath (receipt `E5`) | run 2026-11-23 | D2; the bun boundary in `## Future cost` |
| PE-007 | file-read | the parity gate's `--pins` half reads `pkg.dependencies` only, so a build-time `devDependencies` pin is never nudged by the PR gate and moves on the owner's deliberate cadence | `scripts/version-parity-gate.mjs` (`main`, `evaluatePins`) | verified 2026-11-23 | the pin cadence in `## Future cost` |
| PE-008 | file-read | the existing parity case "the declared window thresholds are the fleet's own extremes" recomputes `max`/`min` from the snapshot's `context` cells and asserts equality, so correcting those cells moves the fleet maximum to 1,048,576 and the claim has to be re-cut to the band floor the policy actually states | `packages/pi-nan-agentic-workflow/test/catalog-parity.test.mjs` (last case), `packages/pi-nan-agentic-workflow/src/phase-batching.ts` (`NAN_PHASE_THRESHOLDS`) | verified 2026-11-23 | D6; O4; O10 |
| PE-009 | file-read | the README's capability table is prose no test reads — `docs-parity.test.mjs` pins the fleet documentation and the four ladder tables only — so the four "not documented" harness cells would go stale silently unless the table gains a pin | `packages/pi-nan-agentic-workflow/test/docs-parity.test.mjs`, `packages/pi-nan-agentic-workflow/README.md` §Phase batching | verified 2026-11-23 | O13 |
| PE-010 | file-read | the JSONC reader that the snapshot tests need lives inside `test/catalog-parity.test.mjs`, so a generator that also has to read the tariff must share one implementation rather than grow a second (IR11) | `packages/pi-nan-agentic-workflow/test/catalog-parity.test.mjs` (`parseJsoncText`) | verified 2026-11-23 | O3; O7 |
| PE-011 | measured-probe | the workspace links members from the folder and resolves the pre-release provider by exact pin: `bun install` added one `bun.lock` entry (`@gtrabanco/pi-nan-provider@1.6.1`, sha512 recorded) and the subpath resolves from the preset package's own `node_modules` | `bun.lock` diff from the install in this worktree (receipt `E2`) | run 2026-11-23 | O11; the pin row |
| PE-012 | document | the provider's exported provenance model is a closed id set resolved through `NAN_MODEL_FACTS_META.sources`, with three ids (`override`, `compat`, `catalog-cost`) pointing into the entry's own `notes` — so a generated cell can carry an inheritable id and the citation text can be inherited once per artifact instead of per cell | provider `src/model-facts-core.ts` (`NAN_FACT_SOURCES`, `NanModelFacts.provenance`) | verified 2026-11-23 | O2 |

## Notes

- `PE-001`/`PE-002`/`PE-006`/`PE-011` are probes run in this worktree against the
  installed pin, not recollections of the provider's documentation.
- `PE-004` is the row that decides `cache_posture`: the provider states whether
  the cache *engages* (`cacheMode`), this repository states whether it is
  *cheaper* (the credit pair), and the artifact records both readings in one cell
  with per-cell provenance (`D3`).
- `PE-008` is the reason a test claim moves: the code the claim judges
  (`largeContextWindow`) does not change its value, so the claim is re-cut to the
  rule the policy states rather than the constant being bent to satisfy it.
