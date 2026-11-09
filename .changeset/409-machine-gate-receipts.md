---
"@gtrabanco/agentic-workflow-schema": minor
---

feat(schema): publish the machine gate receipt contract

The project verification gate's output becomes a document the review and audit
passes read, instead of a wall of conversation text they have to re-derive.

New in this release:

- `gate-receipt@1`: one closed document — `contract`, `version`, `schema`,
  `verdict`, `degraded`, `provenance`, `manifest`, `gate` and `checks` — with
  `validateGateReceipt`, `digestGateManifest`, `digestGateReceipt` and the
  hand-maintained Draft-07 projection `gate-receipt.schema.json`.
- **Validity is the declared content manifest, never the commit.**
  `manifest.entries` is the closure (`path` + `sha256`) and `manifest.digest` is
  its canonical digest; `provenance.head_sha` records where the run happened.
  `compareGateReceiptToCurrent` is a pure local hash comparison, so an unrelated
  commit cannot invalidate a receipt and one mutated signed byte cannot leave it
  current.
- The three closed vocabularies (`GATE_RECEIPT_VERDICTS`, `GATE_CHECK_STATUSES`,
  `GATE_RECEIPT_FRESHNESS_CODES`), the published `GATE_MANIFEST_PATTERNS` closure
  and `GATE_RECEIPT_LIMITS`, all registered in `normative-surfaces@1`.

The package still declares no `dependencies`. Issue #409.
