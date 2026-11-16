# External verification — fix/568-doctor-unreachable-gutter

Date: 2026-11-16

Target: PR #575 (owner free-text intent #575), full verdict — no prior
`EXTERNAL VERIFY` block or review verdict existed for this unit. PR head
`08579295`; local head `6322b6f8` (the owner's docs-only journal-fragment
commit landed mid-verification; delta `08579295..6322b6f8` = +1
`.agentic-workflow/journal/*.md`, verified docs-only).

```text
EXTERNAL VERIFY — base: 811ff65a · head: 6322b6f8
Blockers: 0
Advisories: 4 —
  (A1) docs/ROADMAP.md:199 — PR #575 reports mergeable CONFLICTING against main (both sides insert `## Fixes` rows; 7 main-side commits); owner-disclosed with the shared-doc driver remedy recorded. Merge-state, not a change-caused defect.
  (A2) packages/agentic-workflow/src/doctor/doctor.mjs:112 — the branch was pushed with AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1 (PR disclosure 1; worktree-guard red on a peer session's live stale worktree; the hatch is documented at scripts/local-gate.mjs:775 and the reason is recorded in the PR). Re-run here: `bun scripts/local-gate.mjs --jobs auto` → exit 0 · local-gate: PASS — 19 step(s) in 787s at 6322b6f8, so the skipped push gate is covered by this receipt.
  (A3) .agentic-workflow/journal/20261116T010530Z-fix-568-doctor-unreachable-gutter-narrative-01a1e1c1-3aa6-7202-8356-0ab862a90500.md:1 — local head is 1 ahead of origin (owner's journal-fragment commit 6322b6f8, unpushed); the PR still carries 08579295. Operational, owner-owned.
  (A4) .serena/cache (scripts/setup-env.mjs --check) — `node scripts/setup-env.mjs --check` → FAIL, serena-cache missing in this fresh worktree; pre-existing local state, unrelated to the change; the root gate passed regardless.
Sibling sweep: clean — both labelled-line regex copies (packages/agentic-workflow/test/doctor.cli.test.mjs:113 and test/doctor.checks.test.mjs:388) assert \s{2,}; packages/agentic-workflow/README.md:109-111 declares `<LABEL>  <id>  <detail>` (two spaces), matching the fixed head; `padEnd(12)` survives only in past-tense defect descriptions (unit doc, ROADMAP row); no present-tense stale claim of the old one-space behaviour anywhere.
Completeness: S1–S3 resolved (P1/P2/P3 carry (Implements: S#) and every validator re-runs green here: base reproduction = 12 labelled lines, `bun test test/doctor.checks.test.mjs` exit 0 · 21 pass, 12→14 differential, lint-changeset exit 0, docs-generate --check PASS); O1–O5 all `verified` with outcomes reproduced (O1 ✓, O2 ✓ 12 vs 14, O3 ✓ base exit 1 `unreachable: at least two spaces before the row id`, actual `UNREACHABLE surface-unreachable-`, O4 ✓ --json byte-identical and stdout diff = exactly the two UNREACHABLE lines, O5 ✓ 836 pass · 0 fail · 47 files plus gate PASS 19 steps). Open ids: none.
Spot check: cd packages/agentic-workflow && bun test test/doctor.checks.test.mjs → match (exit 0 · 21 pass · 0 fail = SPEC E8)
Verdict: VERIFIED
```
