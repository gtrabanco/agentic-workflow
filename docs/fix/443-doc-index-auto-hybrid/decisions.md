# 443 — doc index auto-hybrid · decisions

Owner-scoped decisions and the path-protection escape records for this unit. The
records are append-only (`path-protection-records@1`, grammar owned by
`skills/orchestration-envelope/references/TURN_CONTRACT.md`); the declaration
they answer lives in [`SPEC.md`](SPEC.md) `## Path protection`.

## Path-protection escape records

The frozen tests this unit must edit are the pins S10 names: the grammar's
`keyword` default assertion and the four sites that enumerate the registered
command set exactly. Every row below is the *expansion* of a pin (the assertion
keeps asserting the exact set), never a relaxation — the justification names
what the pin becomes.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/test/doc.hybrid.test.mjs | P2 | 2026-11-09 | execute-phase | the grammar pin asserting the retired `keyword` default becomes "absent mode resolves at query time" (`undefined`), and the file gains the auto-resolution, resume-read-only and sync-envelope cases the unit's rules require; no assertion is deleted, the default's expectation is replaced by S2's
justification | packages/agentic-workflow/test/doc.embeddings.test.mjs | P2 | 2026-11-09 | execute-phase | the write-path suite gains the resilience cases (batch cap, pacing, retry on 429, first-landed-batch pin, resume by pending chunks); the existing batch-per-file and 0-call assertions keep their exact expectations
justification | packages/pi-agentic-workflow/test/alias-coverage.test.mjs | P2 | 2026-11-09 | execute-phase | three assertions enumerate the registered command set; each keeps asserting the exact full set and gains the new native name (`synthetic + advance + aw-index + settings + aw-settings`)
justification | packages/pi-agentic-workflow/test/log-session-command.test.mjs | P2 | 2026-11-09 | execute-phase | the differential pin lists every non-catalogue command name; it keeps listing all of them and gains `aw-index`, so the "nothing rides along" guarantee stays exact rather than loosened
justification | packages/agentic-workflow/test/doc.envelope.test.mjs,packages/agentic-workflow/test/doc.query.test.mjs | P2 | 2026-11-09 | execute-phase | the two query-object pins described the retired `mode: "keyword"` default in their expected values; the expectation becomes "the key is absent" (the flag still parses where it is given), so S2's runtime resolution is what the grammar is held to — no assertion is dropped
```
