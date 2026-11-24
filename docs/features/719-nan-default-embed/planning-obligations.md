# Planning obligations — 719-nan-default-embed

Home: unit folder (M-sized carrier). Column order owned by
`skills/pre-execution-review/references/LEDGERS.md`. Every row `planned` at
cut time; `verified` (or evidenced `n/a`) before the unit ships.

| id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 (issue #719 verbatim) + D1 | a pi-nan session with `NAN_API_KEY` and no provider block gets the NaN provider without any manual `index.json` edit | P2 | T2 | pi package `extension` wiring | resolver+wiring suite exit 0; e2e row PE-006 | suite + e2e evidence lines in `## Log` | planned |
| O2 | S4 (explicit block overrides) + INV-002/003 | an operator's committed provider block always wins; the committed file is never rewritten by default-on | P1 | T1 | pi package `config/embed-profile` resolver | setting/withhold suite rows (PE-002) | same | planned |
| O3 | S4 (no key → nothing changes) | a session with no `NAN_API_KEY` keeps the shipped keyword-only behaviour and its degradation | P1 | T1 | pi package resolver | PE-003 suite row | same | planned |
| O4 | S2 (first-class pi tool) + D4 | every skill/model surface can call `doc_search{query, mode?}` and read typed results | P3 | T3 | pi package `extension/workflow-tools` | workflow-tools suite exit 0 parsing the crate's envelope (PE-005) | same | planned |
| O5 | S3 (scope honesty: prose retrieval, crate neutrality) | `rg`/serena stay untouched; the runner crate's tree carries zero diff from this unit | P4 | T4 | lane verification | `git diff --stat -- packages/agentic-workflow` empty; root suite of touched packages green | E/P log lines | planned |
| O6 | D3 (tuning parity) | the default-on path stays within the provider's documented input window without a crate change | P1 | T1 | pi package resolver | PE-004 suite row | same | planned |
| O7 | RETENTION/anti-divergence | every added surface is consumed (the extension consumes both from load) | P4 | T4 | lane verification | `residual-classify --inventory` receipt, no `orphan` row | E line at close | planned |
