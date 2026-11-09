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
justification | packages/agentic-workflow/test/doc.query.test.mjs | P2 | 2026-11-09 | execute-phase | the offline keys-free pins asserted an EMPTY degradations[] on a default query; S2 makes that path declare why hybrid did not run, so the three assertions now expect `unavailable-embeddings-not-configured` and keep their original guarantees (ok, results present, no key, no network) intact
justification | scripts/doc-discipline.test.mjs | P2 | 2026-11-09 | execute-phase | the AC25 single-entry-point allowlist gains one narrowly named test file: the native /aw-index suite carries a realistic sync envelope whose store path is the literal index.db, and the command prints that path without ever opening the store — the guard keeps biting for every other pi-package file
justification | packages/agentic-workflow/test/doc.envelope.test.mjs,packages/agentic-workflow/test/doc.query.test.mjs | P2 | 2026-11-09 | execute-phase | the two query-object pins described the retired `mode: "keyword"` default in their expected values; the expectation becomes "the key is absent" (the flag still parses where it is given), so S2's runtime resolution is what the grammar is held to — no assertion is dropped
justification | packages/pi-agentic-workflow/test/alias-coverage.test.mjs | P7 | 2026-11-09 | external-verify correction batch | the AC15 README-table pin swept the new code-doors table rows (`/advance`, `/aw-index`, the second `/log-session`) and deepEqual-failed against the catalogue alone; the pin expands to the exact documented surface — catalogue ∪ {advance, aw-index}, duplicates collapsed — so it still refuses any invented name; no assertion is deleted (external-verify.md blocker 1, confirmed 2026-11-09)
```
