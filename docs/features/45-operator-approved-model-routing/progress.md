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

## Pre-execution review receipt v1 — spec
- Review: RS-45-03 · Snapshot: 45b6eb12d8f1d7e037408b853a520a9bfa051c14e2baf968b5f570f6283e4618 · Verdict: spec-review-fail
- Unit: 45-operator-approved-model-routing · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 8ae76d8754e9ce9da1575285f2f9d7549820a40a · Artifact revision: 8ae76d8754e9ce9da1575285f2f9d7549820a40a
- Reviewer: pi-web:review-spec (fresh context, no authoring turns) · Session: manual (no runtime session identity exposed) · Role: reviewer · Author: design-feature repair batch v2 session (commit 8ae76d87; identity not exposed)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-09T00:44Z/2026-09-09T00:52Z · Findings: 3 (material open: 2)

Notes:
- Re-review of repair batch v2 (SF-45-012…015 all resolved at revision `8ae76d87…`). Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 45-operator-approved-model-routing`; artifact revision derived from the newest commit touching `SPEC.md` (`8ae76d87…`) — matches the handoff id; sourceRevision and artifactRevisionId coincide by derivation. Builder context kinds: architectural-invariants: absent; normalized-repository-state: present, digest `e8509783…`; project-guide: present, digest `9ae03966…`. Two further authorities consulted this review, not representable in the builder's context list, recorded as manual notes (`validated: manual` for those rows): governing-issue #201 (OPEN, body re-read via GitHub API; Mechanics 1, Tests first, Open questions) and dependency-unit (roadmap rows 43/45 + issue #196 fetched; `resolve-passes` subcommand and execution ladder `aw` → `.mjs` → prose contract confirmed).
- Falsification (pre-check stance): three recorded decisions (AD-45-001/005/006/007) all trace to dated rows in `decisions.md` — none invented; the Business-goal "order of magnitude cost reduction" is aspirational with no AC, but C1 binds in-scope items (all mapped), not goals; no role left unspecified in the derived matrix; repo state required for the half to be wrong (ROOT_KEYS, trust gate, unseeded inventory) checked and holds. Stance entering checks: CONFIRMED-GAPS (clause-level AC coverage).
- Check results: C1–C7 pass, C8 finding (SF-45-016 low, SF-45-017 low, SF-45-018 info), C9 pass, C10 pass, C11 pass, C12 pass, C13 pass, C14 pass. Failed checks: C8.
- Verified repository claims (C10): `packages/pi-agentic-workflow/src/config/schema.ts:14` ROOT_KEYS `default|commands|onUnavailableRoute`; `src/config/load.ts:20-21,97` project file not read while untrusted (S11); `src/settings/console.ts:156-160` project-scope edits refused while untrusted; `docs/CAPABILITIES.md` unseeded (13 placeholder subsystem rows 35–47, placeholder Roles row 24); all six named surfaces exist (GOLDEN_FIXTURE.md, model-routing.yml, BOOTSTRAP_WRITE.md, UPGRADE.md, review-change/SKILL.md, ADVERSARIAL_SETUP.md); alphabetical-key assertion at `scripts/pre-execution-quality.test.mjs:482`; `packages/` holds only `agentic-workflow-schema` and `pi-agentic-workflow`; roadmap row 45 `defined`, deps `43`; issue #196 Mechanics reserves `aw resolve-passes` with the `.mjs` fallback ladder; issue #201 Mechanics 1 pass vocabulary matches the SPEC's (review-* finders + verify/classify/debt; repo `review-*` skill set consistent).
- Cycle note: third review of the unit, second re-review cycle entered after the anomaly already printed at repair batch v2 (progress.md above); snapshot changed `a845bd3f…` → `45b6eb12…`, so this re-review is sanctioned (POLICY §4: a repair responding to a persisted verdict produces a new snapshot by design).
- Zero writes to reviewed artifacts: SPEC.md, decisions.md, ROADMAP.md untouched by this review (receipt + findings rows only; `git status --porcelain` re-checked after the ledger writes).

## Repair batch v3 — design-feature (response to RS-45-03)
- Scope: ONE batch over the full open findings set SF-45-016…SF-45-018 (two low + one info; all `class: product`; REPAIR §1 — no per-finding re-review, no split by file).
- Classes: SF-45-016/017 closure completion (AC15/AC16 added; evidence acquired: `skills/ship-roadmap/references/MODEL_ROUTING.md` + `docs/workflow/GOLDEN_FIXTURE.md` verified to exist at HEAD — Evidence row E12; issue #201 Tests first re-read via `gh issue view 201` 2026-09-09, frozen in E1); SF-45-018 mechanical (intent-preserving; dated line in `decisions.md` "Repair batch v3").
- Repairs: AC15 (command-verified) observes in-scope item 6's second clause — the post-install recommendation note in `skills/ship-roadmap/references/MODEL_ROUTING.md` + `docs/workflow/GOLDEN_FIXTURE.md`, recommendation-not-autowritten; AC16 (command-verified) observes in-scope item 2's unknown-pass-name rejection under `passes` → exit ≠ 0 (closed pass vocabulary of issue #201 Mechanics 1); AC9's example fixed to the described shape (non-ModelRef element inside the `default` array). Pointers updated: in-scope 2→AC2/AC5/AC12/AC16, 6→AC7/AC15, 8→AC1–AC5, AC9–AC12, AC16; expectation row 12 → AC12 + AC16; spec-lint labelled-count 14→16 (14 command-verified, 2 read-verified).
- Gates re-run and pasted: spec-lint product boxes (bounded placeholder grep → no output, exit 1; 16/16 ACs labelled; in-scope map updated in the SPEC's `### Spec-lint`); readiness preflight stage:spec — all 10 boxes tick, `READY-FOR-REVIEW` (below).
- New `artifactRevisionId`: `143261d2315ecb7c86236b2c46f960083b37fd62` (commit that produced the repaired SPEC bytes; mandatory rotation per evidence-grounding — a revert would also mint a new id).
- Receipts untouched: RS-45-03 and all finding severities/claims unchanged; rows resolved via the `status/resolution-evidence/resolving-artifact-revision` columns only.
- Zero open findings classified outside `product`; no counter-evidence dismissal used; no forge issue created; scope not widened (both new ACs observe clauses already in the reviewed in-scope set — no product change taken).
- No convergence anomaly: every finding in this batch was missed by the same check (C8) re-run on a new snapshot, not a previously-passing check — the repeated-finding pattern POLICY §4 flags does not apply.

### READINESS — 45-operator-approved-model-routing spec READY-FOR-REVIEW
- Artifact revision: 143261d2315ecb7c86236b2c46f960083b37fd62 · Rows checked: 12 (Evidence E1–E12) · Unknowns open: 0
- Evidence: SPEC Product half (`### Evidence`) + `decisions.md` · Frozen: 2026-09-09
- Boxes: B1 bounded placeholder grep → no output (re-run exit 1); B2 `designed` earned by spec-lint; B3 zero blank entity rows; B4 13/13 inventory rows + 6 derived; B5 role matrix complete (operator allowed, orchestrator allowed, pass denied); B6 13/13 sweep rows resolved with pointers; B7 in-scope→AC map + every AC labelled (16/16: 14 command-verified, 2 read-verified); B8 deferred rows carry triggers; B9 all evidence rows `current` + `proven`/`decision` (E1–E12); B10 no memory/chat-sourced claims. D1: no delegated-evidence run (n/a).
- Readiness is an authoring gate, not a review verdict — handoff to `/review-spec` for the independent re-review of the new snapshot.

## Pre-execution review receipt v1 — spec
- Review: RS-45-04 · Snapshot: 9de8b72abd51c3d8cd42358c41953a4ff5cced9d173101ee97b38ae661fe211d · Verdict: spec-review-fail
- Unit: 45-operator-approved-model-routing · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 143261d2315ecb7c86236b2c46f960083b37fd62 · Artifact revision: 143261d2315ecb7c86236b2c46f960083b37fd62
- Reviewer: pi-web:review-spec (fresh context, no authoring turns) · Session: manual (no runtime session identity exposed) · Role: reviewer · Author: design-feature repair batch v3 session (commit 143261d2; identity not exposed)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-09T00:52Z/2026-09-09T01:05Z · Findings: 1 (material open: 1)

Notes:
- Re-review of repair batch v3 (SF-45-016…018 all resolved at revision `143261d2…`). Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 45-operator-approved-model-routing`; sourceRevision and artifactRevisionId coincide by derivation; HEAD at review time is `fcfd5263` (a ledger-write commit after the artifact) — recorded beside the builder-bound revision per POLICY §7. Artifact row: `spec-product-v1`, 31003 bytes, digest `a847b018bf29608ef18c250da632969f2735fe384e06900f93b5e14e2b6a9149`.
- Builder context kinds: architectural-invariants: absent; normalized-repository-state: present, digest `e8509783…`; project-guide: present, digest `9ae03966…`. Two further authorities consulted this review, not representable in the builder's context list, recorded as manual notes (`validated: manual` for those rows): governing-issue #201 (OPEN, fetched via `gh issue view 201`; Mechanics 1 pass vocabulary — 8 `review-*` finders + `verify`/`classify`/`debt` — matches the SPEC's; Tests first; Open questions) and dependency-unit (roadmap row 43 `producer-package`, `idea`, issue #196; row 45 `defined`, deps `43`).
- Falsification (pre-check stance): the half's product decisions (AD-45-001…005, AD-45-006/007) all trace to dated `decisions.md` rows — none invented; the Business-goal "order of magnitude cost reduction" is aspirational with no AC, but C1 binds in-scope items (all mapped), not goals, and cost tracking is an explicit non-goal; no role left unspecified in the derived matrix; the repository premises the half depends on (ROOT_KEYS exactly `default|commands|onUnavailableRoute`, project-trust gate at config load, unseeded CAPABILITIES inventory) all checked and hold. Stance entering checks: CONFIRMED-GAPS (criterion-level AC coverage).
- Check results: C1–C7 pass, C8 finding (SF-45-019 low), C9 pass, C10 pass, C11 pass, C12 pass, C13 pass, C14 pass. Failed checks: C8.
- Verified repository claims (C10/C11): `packages/pi-agentic-workflow/src/config/schema.ts:14` ROOT_KEYS `default|commands|onUnavailableRoute` — the SPEC's Evidence row E4 cites `schema.ts:17`, a 3-line pointer imprecision carried from issue #201's own body text; the claim itself (the exact root-key set) is verified true and the file is unchanged since `ed068388` (2026-08-30), so the row stays `proven`/`current` — pointer imprecision disclosed here per the RS-45-03 precedent, not filed. Also verified: `load.ts:20,97` project config not read while untrusted (S11); `console.ts` project-scope edits refused while untrusted; `docs/CAPABILITIES.md` unseeded (13 placeholder subsystem rows 35–47, placeholder Roles row 24); all eight named surfaces exist at HEAD (`GOLDEN_FIXTURE.md`, `model-routing.yml`, `BOOTSTRAP_WRITE.md`, `UPGRADE.md`, `review-change/SKILL.md`, `ADVERSARIAL_SETUP.md`, `ship-roadmap/references/MODEL_ROUTING.md`, `CAPABILITIES.md`); `scripts/pre-execution-quality.test.mjs:482` holds the model-routing alphabetical-key assertion (AC10); `packages/` holds only `agentic-workflow-schema` and `pi-agentic-workflow` (no schema-pkg dependency in the pi package's `package.json`, E5); REPOSITORY_STATE F010/F011 as cited; repo `review-*` skills match issue #201 Mechanics 1's finder vocabulary.
- Scope note (receipt, no finding): the `model-routing.yml` pass-tier work (AC10, expectation row 10, derived subsystem row) is not named in the numbered `#### In scope` bullet list, only in the integration closure and the sweep — coverage exists in three recorded places, so the gap is presentational, not a dropped obligation.
- Cycle note: fourth review of the unit; snapshot changed `45b6eb12…` → `9de8b72a…` (repair batch v3 responded to a persisted verdict), so this re-review is sanctioned (POLICY §4). The new finding was missed by the same check (C8) re-run on the changed snapshot — same pattern repair batch v3 recorded.
- Zero writes to reviewed artifacts: SPEC.md, decisions.md, ROADMAP.md untouched by this review (receipt + findings row only; `git status --porcelain` re-checked after the ledger writes).
