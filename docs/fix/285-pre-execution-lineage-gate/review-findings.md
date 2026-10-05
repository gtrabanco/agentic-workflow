# review-findings — fix/285-pre-execution-lineage-gate

```text
review-mark@1
id | file:line | axis | severity | class | route | folded
REVIEW-RAN | HEAD ffab7c28d03c02bc022b13bdd7d260cd8edddb13 | n/a | n/a | review-mark | n/a | n/a
```

Axes run at HEAD `ffab7c28`: code/correctness (schema requiredness relaxation +
CLI consumer sweep: every `acceptance`-row consumer already handles absence —
`attributeFreshness`'s acceptance-exclusion explicitly tolerates a snapshot that
binds no manifest; the wording-only route stays fail-closed without one),
security (no new input surface; docs + requiredness only), perf (trivial —
build-time row filtering), verify (all gates re-run live at HEAD: repo suite
619/0, schema package 717/0, context budgets PASS, schema drift checks PASS),
a11y/brand/seo — n/a (no UI or user-facing copy).

```text
finding-mark@1
id | file:line | axis | severity | class | route | folded
```

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | `scripts/unit-route.mjs` (reasons map, ~line 447) | code | low | report-note | report-note: the triage block's `Skipped:` reason strings are static per unit type ("trivial scope") even when the actual scope is `standard` — misleading prose in an authoritative block. Pre-existing behaviour, outside this fix's regression boundary (fix/285 changes nothing in `unit-route.mjs`); file its own issue if a consumer ever parses those strings. | no |
