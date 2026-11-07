# Sources — unit 82 (relay-lane-execution)

Plan-stage `CLAIM-*` rows: every claim the tasks rest on, with the source that
settles it. Row shape is the plan step's (`skills/unit-lane/references/PLAN.md`
§Stage 1); the ledger form is `planning-evidence.md`, which carries the same
claims as `PE-nnn` rows with their freshness. This file exists so a plan claim
that is *not* an Engineering claim still has a cited source.

> Shape migrated 2026-11-07 to `DESIGN.md` § Provenance: the `provenance` column is a
> mechanical classification of each row's own first cited source (repository /
> version-pinned doc / owner answer / model memory). No claim, source or certainty
> was changed, and no new evidence is asserted — re-derive any cell from the row.

| id | claim | source | provenance | certainty |
|---|---|---|---|---|
| CLAIM-001 | A packet is three markdown files with pi-web's own names and bounds | `PE-001`, `PE-003` | repository | confirmed |
| CLAIM-002 | `dispatch_relay` takes per-leg `model`/`thinkingLevel` and a **string** leg id | `PE-002` | repository | confirmed |
| CLAIM-003 | Dispatch fails before dispatching when the host cannot dispatch | `PE-004` | repository | confirmed |
| CLAIM-004 | `.pi-web/` never enters a delivery commit | `.gitignore` (`.pi-web/`) | repository | confirmed |
| CLAIM-005 | `budget_tier` has exactly one source and no model consumer today | `PE-006` | repository | confirmed |
| CLAIM-006 | `REVIEW-VERDICT` has one owner and no script parser today | `PE-007` | repository | confirmed |
| CLAIM-007 | A new reference must be linked, heading-first and budgeted per route | `PE-008` | repository | confirmed |
| CLAIM-008 | pi-web presence is readable from the session marker | `PE-009` | repository | confirmed |
| CLAIM-009 | A new script lands red then green | `PE-010` | repository | confirmed |
| CLAIM-010 | A skills change needs a version/CHANGELOG/changeset companion | `PE-011` | repository | confirmed |
| CLAIM-011 | No `.es.md` sibling may be created | `PE-012` | repository | confirmed |
| CLAIM-012 | The router cannot probe the dispatch tool | `PE-013` | repository | confirmed (decision) |
| CLAIM-013 | The handover ceiling is an assumption at cut | `PE-014` | repository | unknown, owner recorded |
| CLAIM-014 | The router's relay hint must not disturb the piped block | `scripts/unit-route.test.mjs` (parses `^next:` and the fixed headers) | repository | confirmed |
| CLAIM-015 | The docs projection is regenerated from unit docs and roadmap rows | `scripts/docs-generate.mjs:235-251,342-374` | repository | confirmed |
