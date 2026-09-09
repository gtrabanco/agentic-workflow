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

## Pre-execution review receipt v1 — spec
- Review: RS-45-02 · Snapshot: a845bd3f97592f9d893953d55841aa9de728f5686aa91bec848e29ccb4686cf7 · Verdict: spec-review-fail
- Unit: 45-operator-approved-model-routing · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 2032e203c1805e857dd709cef12e0618292e68f9 · Artifact revision: 2032e203c1805e857dd709cef12e0618292e68f9
- Reviewer: pi-web:review-spec@1.7.1 · Session: manual (no runtime session identity exposed) · Role: reviewer · Author: design-feature repair session (commit 2032e203; identity not exposed)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-09T00:28Z/2026-09-09T00:38Z · Findings: 4 (material open: 4)

Notes:
- Post-repair re-review of the RS-45-01 repair batch (SF-45-001…011 all resolved at revision `2032e203…`). Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 45-operator-approved-model-routing`; artifact revision derived from the newest commit touching `SPEC.md` (`2032e203…`, `docs(features): repair 45 product half after SPEC-REVIEW-FAIL`) — matches the handoff id; sourceRevision and artifactRevisionId coincide by derivation.
- Builder context kinds: architectural-invariants: absent; normalized-repository-state: present, digest `e8509783…`; project-guide: present, digest `9ae03966…`. Two further authorities consulted this review, not representable in the builder's context list, recorded as manual notes (`validated: manual`): governing-issue #201 (OPEN, fetched via `gh issue view 201`; Mechanics 1, Tests first, Open questions re-read) and dependency-unit (roadmap row 43 `producer-package`, `idea`; `packages/` contains only `agentic-workflow-schema` and `pi-agentic-workflow`).
- Check results: C1–C7 pass, C8 finding (SF-45-012), C9 findings (SF-45-012, SF-45-015), C10 pass, C11 finding (SF-45-014), C12 finding (SF-45-013), C13 pass, C14 pass. Failed checks: C8, C9, C11, C12.
- Verified repository claims (C10): `packages/pi-agentic-workflow/src/config/schema.ts` ROOT_KEYS `default|commands|onUnavailableRoute`; `docs/CAPABILITIES.md` unseeded (13 placeholder subsystem rows 35–47, placeholder Roles row 24); `skills/init-workspace/references/{BOOTSTRAP_WRITE,UPGRADE}.md` and `skills/review-change/references/ADVERSARIAL_SETUP.md` exist; `docs/workflow/model-routing.yml` exists with the alphabetical-key assertion at `scripts/pre-execution-quality.test.mjs:482`; `docs/workflow/GOLDEN_FIXTURE.md` exists; roadmap rows 43 (`idea`, #196) and 45 (`defined`, deps 43).
- Zero writes to reviewed artifacts: SPEC.md, decisions.md, ROADMAP.md untouched by this review (receipt + findings rows only; `git status --porcelain` re-checked after the ledger writes).

### READINESS — 45-operator-approved-model-routing spec READY-FOR-REVIEW
- Artifact revision: 2032e203c1805e857dd709cef12e0618292e68f9 · Rows checked: 10 (Evidence E1–E10) · Unknowns open: 0
- Evidence: SPEC Product half (`### Evidence`) + `decisions.md` · Frozen: 2026-09-09
- Boxes: B1 bounded placeholder grep → no output; B2 `designed` earned by spec-lint; B3 zero blank entity rows; B4 13/13 inventory rows + 6 derived; B5 role matrix complete (operator allowed, orchestrator allowed, pass denied); B6 12/12 sweep rows resolved with pointers; B7 in-scope→AC map + every AC labelled (13/13); B8 deferred rows carry triggers; B9 all evidence rows `current` + `proven`/`decision`; B10 no memory/chat-sourced claims. D1: no delegated-evidence run (n/a).
- Readiness is an authoring gate, not a review verdict — handoff to `/review-spec` for the independent re-review of the new snapshot.

## Repair batch v2 — design-feature (response to RS-45-02)
- Scope: ONE batch over the full open findings set SF-45-012…SF-45-015 (all `class: product`; REPAIR §1 — no per-finding re-review, no split by file).
- Classes: SF-45-012/014/015 mechanical (intent-preserving; dated line in `decisions.md` "Repair batch v2"); SF-45-013 closure completion (evidence acquired: issue #201 Open questions fetched 2026-09-09; `packages/pi-agentic-workflow/src/config/load.ts` S11 + `src/settings/console.ts:156` read at HEAD; AD-45-007 appended).
- Repairs: AC4 + semantics item 4 rewritten (per-pass reason `no default chain` reserved for schema-level degenerate chains — absent/empty `default`, or an entry that yields no chain; schema-invalid references stay strict-validator rejections §3/AC12; runtime availability stays spawn-time consumer behaviour AC6 — refines issue #201's "chain of unresolvable refs → inline with reason" fixture wording, preserving AD-45-006); AD-45-007 appended + semantics item 5 + sweep row 13 + AC14 (read-verified) + Evidence row E11 (issue #201's `auto` open question resolved yes-by-construction via the existing project-trust gate — no new gate invented, no product change taken); Evidence E7 refreshed (row 45 `defined`, deps `43`); decisions.md vocabulary note (AD-45-002's "per-skill, not per-pass" phrasing imprecise; `passes` keyed by the closed pass-name vocabulary with optional overrides — contrast is per-subagent-instance granularity).
- Gates re-run and pasted: spec-lint product boxes (bounded runs in the SPEC's `### Spec-lint`; placeholder grep re-run → no output, exit 1); readiness preflight stage:spec — all 10 boxes tick, `READY-FOR-REVIEW` (below).
- New `artifactRevisionId`: `8ae76d8754e9ce9da1575285f2f9d7549820a40a` (commit that produced the repaired SPEC bytes; mandatory rotation per evidence-grounding).
- Receipts untouched: RS-45-02 and all finding severities/claims unchanged; rows resolved via the `status/resolution-evidence/resolving-artifact-revision` columns only.
- Zero open findings classified outside `product`; no counter-evidence dismissal used; no forge issue created; scope not widened (the dedicated-`auto`-gate alternative for SF-45-013 was a possible product change and was NOT taken — the proposed "yes" is satisfied by the existing gate).

```text
CONVERGENCE-ANOMALY — 45-operator-approved-model-routing spec
- Finding ids: repeated: none / new: SF-45-012, SF-45-013, SF-45-014, SF-45-015
- Snapshots: a845bd3f97592f9d893953d55841aa9de728f5686aa91bec848e29ccb4686cf7 → 8ae76d8754e9ce9da1575285f2f9d7549820a40a (artifactRevisionId 2032e203c1805e857dd709cef12e0618292e68f9 → 8ae76d8754e9ce9da1575285f2f9d7549820a40a)
- Missed: Evidence row E7 (left stale by the same batch that wrote the roadmap status it cites); AC4's inherited issue-#201 fixture clause (never re-grounded against the recorded AD-45-006 semantics); issue #201's `auto` open question (inherited, unowned); decisions.md vocabulary drift (AD-45-002 vs the SPEC's pass-name map)
- Owning stage: product
- Why the prior repair failed: the batch rewrote the SPEC around AD-45-006 but did not re-ground every inherited issue-#201 clause and open question against it, and left a fact its own batch had just written (E7) stale
- Route to owner: design-feature repair batch v2 (this turn, complete) → /review-spec re-review of the new snapshot
```
Second repair/re-review cycle — recorded per POLICY §4: a repair responding to a persisted verdict produces a new snapshot by design (never blocked); the anomaly is printed and routed, not a stop.

### READINESS — 45-operator-approved-model-routing spec READY-FOR-REVIEW
- Artifact revision: 8ae76d8754e9ce9da1575285f2f9d7549820a40a · Rows checked: 11 (Evidence E1–E11) · Unknowns open: 0
- Evidence: SPEC Product half (`### Evidence`) + `decisions.md` · Frozen: 2026-09-09
- Boxes: B1 bounded placeholder grep → no output (re-run exit 1); B2 `designed` earned by spec-lint; B3 zero blank entity rows; B4 13/13 inventory rows + 6 derived; B5 role matrix complete (operator allowed, orchestrator allowed, pass denied); B6 13/13 sweep rows resolved with pointers; B7 in-scope→AC map + every AC labelled (14/14); B8 deferred rows carry triggers; B9 all evidence rows `current` + `proven`/`decision` (E1–E11); B10 no memory/chat-sourced claims. D1: no delegated-evidence run (n/a).
- Readiness is an authoring gate, not a review verdict — handoff to `/review-spec` for the independent re-review of the new snapshot.
