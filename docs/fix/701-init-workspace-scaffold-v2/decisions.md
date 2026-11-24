# Decisions — fix/701-init-workspace-scaffold-v2

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/findings-corpus.test.mjs | P6 | 2026-11-23 | execute-phase | The tree's frozen finding count follows the tree, not a contract: this unit appends its OPEN row F1 to its own unit doc, so `corpus.findings.length` moves 1165 → 1166 and the suite header's parenthetical re-freezes with it. Same mechanism the suite documents at its own `reviewMarks` line, and the same record fix/693 made for 1164 → 1165 a day earlier; every fixture case and the other pinned counts are untouched, and no assertion is relaxed — the count stays exact.
justification | packages/agentic-workflow/test/scaffold-contract.test.mjs | P6 | 2026-11-23 | execute-phase | Additions only, nothing edited, relaxed or removed: AC3 names a duplicate and an out-of-order section as reported defects and O3's required-evidence claims both cases in this run, so the two selector codes get their own reproducer (both hold today through the owner selector), and the dispatch case gains two `assert.match` lines pinning AC1's `SURFACE … — MATCH` row and `verdict SCAFFOLD OK` line — the observable the 2026-11-23 external verify found asserted nowhere.
```

## D1 — the roadmap 98/99/100 collision is reported, not repaired

The 2026-11-23 external verify's advisory 2 is a real live-tree red
(`roadmap-settle`), but the repair is the owner's call, not this batch's:
commit `7951c17c1` (2026-11-22) inserted feature rows 98/99/100 on top of the
rows `ad63aa1b1` (2026-11-02) registered under those numbers, re-added issue
#537 as row 98 although `a1e83d5de` (2026-11-14) had already registered it as
the `done` row 537 with its own folder, left a stub folder
`docs/features/98-deterministic-tool-doctor/` duplicating that unit, and wrote
one 4-cell row into a 5-column table — while row 654 (`guard-layer`, planned)
and row 99 (`guard-plugin-core`, declined) state opposed statuses for one
`@gotgenes/pi-permission-system` scope with both citing #654. The `roadmap`
CLI offers only `read`/`list`/`row-upsert`/`settle`/`check` — no delete, no
renumber — and AGENTS §7 forbids a hand-edited index ("a hand edit is a
defect — report it instead"). Which registration wins therefore goes to the
owner; this batch touches neither the rows nor the folders.
