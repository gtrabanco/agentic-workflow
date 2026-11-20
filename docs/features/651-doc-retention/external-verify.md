# 651 — external verify receipt

2026-11-20 · first external verification of this unit: no prior
`EXTERNAL VERIFY` block, no `external-verify.md` and no review verdict existed
for `docs/features/651-doc-retention/` at bind time, so this is the full
verdict, once.

Bound state: unit dir `docs/features/651-doc-retention/` (SPEC + both planning
ledgers + decisions) · base `origin/main` `8fc204abb4e945f47a7d70d6faf5545d33af206c`
· head `e62414d0175beed232616fcae73bf9a7b59d6d5c` (both unchanged through the
run; worktree clean before this receipt). Every new/changed command under test
(`doc archive`, `doc restore`, `workflow-status`, `config validate`, the
retention scripts) ran only in `mktemp -d` scratch trees or as check-only
modes; no mutation path touched the live tree, and this receipt file is the
verification's only write (uncommitted — no commit, push or forge call was
made). Verification evidence: all 13 applicable-test suites green at head with
pass counts matching E1–E13; 14 own probes over the write path, the sensor and
the config surface (all green after correcting four probe-side defects that the
stability check ruled out as product defects); gate run at head with 18/19
steps green and `root-suite` red (below).

```text
EXTERNAL VERIFY — base: 8fc204abb4e945f47a7d70d6faf5545d33af206c · head: e62414d0175beed232616fcae73bf9a7b59d6d5c
Blockers: 2 —
  1. docs/ROADMAP.md:201 with docs/features/651-doc-retention/SPEC.md:354 (gate: scripts/roadmap-settle.test.mjs:80, "the live tree is green") — reproducer: `bun test scripts/roadmap-settle.test.mjs` → 9 pass / 1 fail: `pr-url-unsettled — doc carries its PR URL (Log); row status is 'in-progress · [#661](…/pull/661)' — expected 'done · [#661](…/pull/661)'`, and with it `bun scripts/local-gate.mjs` exits 1 at root-suite. Base-vs-head: a `git archive origin/main` copy in mktemp with its own `bun install` runs the same suite 10 pass / 0 fail (exit 0); `git log -S 'pull/661' origin/main..HEAD -- SPEC.md ROADMAP.md` → only `e62414d01`, which added the URL to both files after the last gate receipt (G3 ran at `34f7cf9dc`, whose SPEC carries no URL). Stability: the suite's fixture half is green at head, so the reproducer fires only on this unit's doc/row pair. The unit's own claim at SPEC.md:354-356 ("the release-settle step (#316) lands the row's `done · #661` only after the merge") misreads #316 — scripts/roadmap-settle.mjs:5 states the done settle is written at PR open. Smallest action: docs/ROADMAP.md:201 status cell → `done · [#661](https://github.com/gtrabanco/agentic-workflow/pull/661)`, then re-run the gate. Route: /aw-local-apply.
  2. docs/features/651-doc-retention/planning-obligations.md (row O29, status `verified`) — reproducer: its validator `bun scripts/local-gate.mjs` no longer exits 0 at head (exit 1, root-suite, same red as 1); the quoted receipts G1–G3 all predate the roadmap-link commit. Base-vs-head: green at base (suite green; the unit's rows did not exist yet at base) and green at every pre-`e62414d01` head the unit recorded; red only at the final head. Every other gate step runs green here: all 19 covered (18 green; `root-suite` red from 1 — of its 132 suites exactly `roadmap-settle` is change-caused red; `ledger-provenance` failed only under this verifier's parallel load and is 27/27 green standalone at head). Smallest action: same as 1, then a fresh gate receipt at head. Route: /aw-local-apply.
Advisories: 5 —
  1. packages/agentic-workflow-schema/src/pre-execution.ts:616 — "One contract, two accepted shapes (#308)" undercounts the three accepted shapes at head; advisory: comment only, resolution goes through the one published table (probed: legacy/spec-by-reference/settled each resolve).
  2. packages/agentic-workflow/src/edit/UnitDoc.mjs:302 — "Both accepted shapes are addressable" undercounts the three; advisory: comment only, and by inspection the legacy∪spec-ref addressable union still contains every settled section.
  3. scripts/unit-doc-contract.test.mjs:191,216 — "#308 — two accepted shapes" header and test name; advisory: #308-scoped presence assertions (suite 21/21 green here), they assert no absence of a third shape.
  4. docs/workflow/MIGRATION.md:41-42 — the `format`-axis enumeration lists only `unit-doc@1`/`unit-doc@2`; advisory: dated #462 entry left untouched by an additive, non-breaking `unit-doc@3`, no consumer reads it as a closed current set (docs-currency polish for /aw-local-apply).
  5. scripts/ledger-provenance.test.mjs (test "a marker that folded something else is reported, never trusted (F63's shape)") — failed only inside this verifier's overloaded parallel root-suite run with an empty spawn output (26 pass / 1 fail), 27 pass / 0 fail standalone at head; advisory: environmental load fragility, not change-caused, fires at base the same way under load.
Sibling sweep: 4 stale mentions (advisories 1–4), no behavioral survivor — the deleted Verify.mjs `Acceptance criteria` carve-out survives correctly as the `carrierCount` rule in UnitDoc.mjs:510-527 (shared section tolerated, Evidence/Progress log still refused — probed both ways); the old `doc` usage string exists only where rewritten (grammar.mjs); the GATE_INVENTORY `normative-surface-grammar` cell retains every prior id plus the four new ones (normative-drift green); SENSOR_CORE carries the two new `detail.retention` rows; no prose anywhere still claims `unit-doc@2` is the current reader generation outside frozen planning ledgers and dated logs.
Completeness: S2–S11 resolved — every `S#` carries a task with `(Implements: S#)` whose validator re-runs green here; S1 open — its task P8's validator (`bun scripts/local-gate.mjs`) exits 1 under blocker 1. Obligations: O1–O28 and O30 `verified` with every stated validator re-run green at head (pass counts match the recorded E lines); O29 open (blocker 2). No `postponed/wontfix` dispositions needed.
Spot check: bun scripts/retention-declaration.mjs --check → match (E10 reported `4 templates, 19 rows each, verdict PASS`; observed 4 template lines each `rows 19`, `verdict | PASS`, exit 0).
Verdict: NEEDS-DECISION (1, 2)
```
