# 45 — Progress

## Pre-execution review receipt v1 — spec
- Review: RS-45-01 · Snapshot: f5e49087386c4bbe178987b414a611bfce4b15e9f2b5167e5b8b41ac01052ee5 · Verdict: spec-review-fail
- Unit: 45-operator-approved-model-routing · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 00c42bfd95b755cd9cd9e4def8f084d983b094f1 · Artifact revision: 00c42bfd95b755cd9cd9e4def8f084d983b094f1
- Reviewer: pi-web:review-spec@1.7.1 · Session: manual (no runtime session identity exposed) · Role: reviewer · Author: prior design-feature session (commit 00c42bfd; identity not exposed)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-09T00:05Z/2026-09-09T00:20Z · Findings: 11 (material open: 11)

Notes:
- Head at review time is `1efcb8ec` (a docs-log commit after the artifact); the builder binds `sourceRevision`/`artifactRevisionId` to `00c42bfd`, the commit that produced the reviewed SPEC bytes — correct binding, recorded here beside HEAD per POLICY §7.
- Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 45-operator-approved-model-routing` (builder-validated). The builder emitted three context kinds (architectural-invariants: absent; normalized-repository-state: present, digest `e8509783…`; project-guide: present, digest `9ae03966…`). Two further authorities were consulted by this review but are not representable in the builder's context list, recorded here as manual notes (`validated: manual` for these two): governing-issue #201 (OPEN, fetched via `gh issue view 201`) and dependency-unit (roadmap row 43 `producer-package`, `idea`; `packages/` contains no `agentic-workflow` package).
- Failed checks: C4, C6, C8, C9, C10, C13. Findings rows: `SF-45-001` … `SF-45-011` in `planning-findings.md`.
- Zero writes to reviewed artifacts: SPEC.md, decisions.md, ROADMAP.md untouched by this review (verified with `git status --porcelain` after the ledger writes).

## Repair batch v1 — design-feature (response to RS-45-01)
- Scope: ONE batch over the full open findings set SF-45-001…SF-45-011 (all `class: product`; REPAIR §1 — no per-finding re-review, no split by file).
- Classes: 001/002/005/006/008/009/010/011 mechanical (intent-preserving, dated line in `decisions.md`); 003/004/007 closure completion (evidence acquired: issues #196/#201/#154 fetched 2026-09-09, roadmap/packages inspected at HEAD; AD-45-006 appended for 004).
- Repairs: SPEC Product half rewritten (dependencies → feature 43/issue #196 + issue #154; inventory walked 13/13 CAPABILITIES.md rows + 6 derived; unavailable/exhaustion semantics section + AD-45-006; AC12 unknown-root-key fix; producer = feature 43's `aw resolve-passes` + `.mjs` fallback; AC13 added; AC labels `command-verified`/`read-verified`; evidence table E1–E10 frozen; Engineering half restored to template state); roadmap row 45 → `defined`, deps `43`.
- Gates re-run and pasted: spec-lint product boxes (bounded runs in the SPEC's `### Spec-lint`); readiness preflight stage:spec — all 10 boxes tick, `READY-FOR-REVIEW` (below).
- New `artifactRevisionId`: `2032e203c1805e857dd709cef12e0618292e68f9` (commit that produced the repaired SPEC bytes; mandatory rotation per evidence-grounding — a revert would also mint a new id).
- Receipts untouched: RS-45-01 and all finding severities/claims unchanged; rows resolved via the `status/resolution-evidence/resolving-artifact-revision` columns only.
- Zero open findings classified outside `product`; no counter-evidence dismissal used; no forge issue created; scope not widened (all repairs align to recorded AD-45-001…005 and the governing issues).
- Offered, not done: seeding `docs/CAPABILITIES.md` from its template (init-workspace owns seeding; needs user confirmation).

### READINESS — 45-operator-approved-model-routing spec READY-FOR-REVIEW
- Artifact revision: 2032e203c1805e857dd709cef12e0618292e68f9 · Rows checked: 10 (Evidence E1–E10) · Unknowns open: 0
- Evidence: SPEC Product half (`### Evidence`) + `decisions.md` · Frozen: 2026-09-09
- Boxes: B1 bounded placeholder grep → no output; B2 `designed` earned by spec-lint; B3 zero blank entity rows; B4 13/13 inventory rows + 6 derived; B5 role matrix complete (operator allowed, orchestrator allowed, pass denied); B6 12/12 sweep rows resolved with pointers; B7 in-scope→AC map + every AC labelled (13/13); B8 deferred rows carry triggers; B9 all evidence rows `current` + `proven`/`decision`; B10 no memory/chat-sourced claims. D1: no delegated-evidence run (n/a).
- Readiness is an authoring gate, not a review verdict — handoff to `/review-spec` for the independent re-review of the new snapshot.
