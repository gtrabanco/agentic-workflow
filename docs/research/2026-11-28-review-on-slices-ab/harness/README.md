# Harness — review-on-slices A/B instrument (2026-11-28)

Authored in-session for the research documented in
[../README.md](../README.md) and [../VERIFICATION.md](../VERIFICATION.md); no
third-party code is vendored here, so no provenance header applies.

| File | Role |
|---|---|
| `build-contexts.mjs` | Material builder: reads a config (units → base/tip commits, slice → file lists, anchors), resolves from the repo (`bun build-contexts.mjs <REPO_ROOT>`), renders each review context (review preamble + per-file diff + tip content under the declared caps) to `ctx/<U?>/<mono|slice>__<name>.txt`. Declares every content cap in `contentCap`. |
| `run-reviews.mjs` | Caller: posts every (unit, job, model, run) review context to the nan chat completions API (`NAN_API_KEY` in env). Reasoning-first models need `enable_thinking:false` (see VERIFICATION note 1). Per-model max-token budgets in `MODEL_MAXTOK`. Writes one raw record per call. Retry ×3 on transport errors; truncated-JSON salvage is marked, never silent. |
| `score.mjs` | Scorer: aggregates packed call records into the arm-summary table (fixed matcher semantics documented in the file head). |
| `config.json` | The two units' reconstruction config — bases, tips, the natural-language unit summaries, and both units' slice → files maps (fix/224's map is generated from the change list and checked for full coverage with no overlaps). |
| `gt.json` | Ground truth: the two committed cycle-1 ledgers reduced to id + cited files + essence, for the file-mapped recall scorer. |
| `out-*.json` | The 112 raw call records packed from the session run (id, usage including reasoning tokens, finish reason, parse state, the parsed findings, and the model's raw completion for audit). |
| `results/` (`../results/`) | `arm-summary.md` (definitive tables) + `all-calls.csv` (per-call tokens, wall clock, findings, parse state). |

Reuse for another unit: add the unit to `config.json` (base/tip + slices from
its own doc Tasks/phase structure; the fold/phase boundaries are the slicing
rule) and its cycle-1 ledger ids to `gt.json`; then the three commands in
VERIFICATION.md re-run the whole grid unchanged. Any slice MUST include at
least one check-anchor surface (a shared, unchanged or chapter file that other
slices' claims touch — VERIFICATION.md's read-anchor note) or cross-slice
registry/parity classes stay blind.
