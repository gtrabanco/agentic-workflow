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

## Repair batch v4 — design-feature (response to RS-45-04)
- Scope: ONE batch over the full open findings set SF-45-019 (single low finding, `class: product`; REPAIR §1 — the reviewer's own evidence names the repair class: mechanical, intent-preserving).
- Class: SF-45-019 mechanical, intent-preserving (dated line in `decisions.md` "Repair batch v4").
- Repairs: AC15's grep pattern narrowed from the over-broad `"pass routing\|passes"` to the recommendation phrase `"pass.?routing"`; the "recommendation (not auto-written)" check now scopes to the matched line(s) rather than every `passes` occurrence, and the unrelated audit-prose `passes` occurrence at GOLDEN_FIXTURE.md:252 is explicitly declared out of scope. Satisfiability verified at HEAD `1ad375dd`: `grep -in "pass.?routing" skills/ship-roadmap/references/MODEL_ROUTING.md docs/workflow/GOLDEN_FIXTURE.md` → 0 matches in both files (exit 1), so ≥ 1 match per file is achievable and decidable once the recommendation note lands; the old broad pattern reproduces the false match at line 252 (exit 0). Recommendation work, both surfaces, the not-auto-written property, and every pointer (in-scope 6→AC7/AC15, spec-lint 16/16 AC labels — 14 command-verified, 2 read-verified) unchanged. `## Design status` updated to name batches through v4.
- Gates re-run and pasted: spec-lint product boxes (bounded placeholder grep → no output, exit 1; 16/16 ACs labelled); readiness preflight stage:spec — all 10 boxes tick, `READY-FOR-REVIEW` (below).
- New `artifactRevisionId`: `5157d7c56e7189ed783c3d62d2893bcd95ea47df` (commit that produced the repaired SPEC bytes; mandatory rotation per evidence-grounding — a revert would also mint a new id).
- Receipts untouched: RS-45-04 and the finding's severity/claim unchanged; row resolved via the `status/resolution-evidence/resolving-artifact-revision` columns only.
- Zero open findings classified outside `product`; no counter-evidence dismissal used; no forge issue created; scope not widened.
- Cycle note: fourth repair cycle entered after a persisted verdict — sanctioned per POLICY §4 (a repair responding to a persisted verdict produces a new snapshot by design; artifact `143261d2…` → `5157d7c5…`, review snapshot `45b6eb12…` → `9de8b72a…`). **No CONVERGENCE-ANOMALY**: repeated finding ids — none; SF-45-019 was missed by the same check (C8) re-run on a changed snapshot, not a previously-passing check regressing and not a previously-filed finding resurfacing — the same non-anomaly rationale repair batch v3 recorded. (A prior session's LOGS entry predicted the anomaly "applies at repair time"; §4's repeat rule does not bear that out, recorded here rather than silently ignored.)

### READINESS — 45-operator-approved-model-routing spec READY-FOR-REVIEW
- Artifact revision: 5157d7c56e7189ed783c3d62d2893bcd95ea47df · Rows checked: 12 (Evidence E1–E12) · Unknowns open: 0
- Evidence: SPEC Product half (`### Evidence`) + `decisions.md` · Frozen: 2026-09-09
- Boxes: B1 bounded placeholder grep → no output (re-run exit 1); B2 `designed` earned by spec-lint (status names batches through v4); B3 zero blank entity rows; B4 13/13 inventory rows + 6 derived; B5 role matrix complete (operator allowed, orchestrator allowed, pass denied); B6 13/13 sweep rows resolved with pointers; B7 in-scope→AC map + every AC labelled (16/16: 14 command-verified, 2 read-verified); B8 deferred rows carry triggers; B9 all evidence rows `current` + `proven`/`decision` (E1–E12); B10 no memory/chat-sourced claims. D1: no delegated-evidence run (n/a).
- Readiness is an authoring gate, not a review verdict — handoff to `/review-spec` for the independent re-review of the new snapshot.

## Pre-execution review receipt v1 — spec
- Review: RS-45-05 · Snapshot: 2c90c79f9cb6e200ad1217d8d60cfb49bfb4bcbca29f0cee8e014edd0dd40f3b · Verdict: spec-review-fail
- Unit: 45-operator-approved-model-routing · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 5157d7c56e7189ed783c3d62d2893bcd95ea47df · Artifact revision: 5157d7c56e7189ed783c3d62d2893bcd95ea47df
- Reviewer: pi-web:review-spec (fresh context, no authoring turns) · Session: manual (no runtime session identity exposed) · Role: reviewer · Author: design-feature repair batch v4 session (commit 5157d7c5; identity not exposed)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-09T01:15Z/2026-09-09T01:25Z · Findings: 3 (material open: 3)

Notes:
- Re-review of repair batch v4 (SF-45-019 resolved at revision `5157d7c5…`). Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 45-operator-approved-model-routing`; artifact row `spec-product-v1`, 31243 bytes, digest `b4d2fa63908db151db124d4e32a2ac77c42a4417b0b54cf99b739bd2cded1616`; sourceRevision and artifactRevisionId coincide by derivation and match the handoff id. HEAD at review time is `e13096d3` (the ledger-write commit after the artifact) — recorded beside the builder-bound revision per POLICY §7.
- Builder context kinds: architectural-invariants: absent; normalized-repository-state: present, digest `e8509783…`; project-guide: present, digest `9ae03966…`. Two further authorities consulted this review, not representable in the builder's context list, recorded as manual notes (`validated: manual` for those rows): governing-issue #201 (OPEN, body re-read via `gh issue view 201` — Summary, Mechanics 1 (8 `review-*` finders + `verify`/`classify`/`debt`), Tests first, Non-goals, Affected surfaces, Depends on, Open questions — matching the SPEC's frozen E1 row) and dependency-unit (roadmap row 43 `producer-package`, `idea`, issue #196 — `resolve-passes` subcommand and `aw` → `.mjs` → prose ladder confirmed in #196 Mechanics; row 45 `defined`, deps `43`).
- Falsification (pre-check stance): the half's product decisions (AD-45-001…005, AD-45-006, AD-45-007) all trace to dated `decisions.md` rows — none invented; the Business-goal "order of magnitude cost reduction" is aspirational with no AC, but C1 binds in-scope items (all mapped) and cost tracking is an explicit non-goal; no role left unspecified in the derived matrix; the repository premises the half depends on all checked and hold (ROOT_KEYS exactly `default|commands|onUnavailableRoute`; project config not read while untrusted; CAPABILITIES.md unseeded; AC15 surfaces unchanged, `pass.?routing` grep → 0 matches at HEAD; GOLDEN_FIXTURE.md:252 still the unrelated audit prose). Stance entering checks: CONFIRMED-GAPS (affected-surface coverage + criterion-level AC coverage + named-field semantics).
- Check results: C1–C4 pass, C5 finding (SF-45-020), C6–C7 pass, C8 finding (SF-45-021), C9 finding (SF-45-022), C10–C14 pass. Failed checks: C5, C8, C9.
- Verified repository claims (C10/C11): `packages/pi-agentic-workflow/src/config/schema.ts:14` ROOT_KEYS `default|commands|onUnavailableRoute` (the SPEC's Evidence row E4 cites `schema.ts:17` — same 3-line pointer imprecision RS-45-04 disclosed; claim verified true, row stays `proven`/`current`, disclosed not filed); `load.ts:20-21,97` project file not read while untrusted (S11); `console.ts:156` project-scope edits refused while untrusted; `docs/CAPABILITIES.md` unseeded (13 placeholder subsystem rows, placeholder Roles row 24); all eight named surfaces exist at HEAD; `scripts/pre-execution-quality.test.mjs` holds the model-routing alphabetical-key assertion; `packages/` holds only `agentic-workflow-schema` and `pi-agentic-workflow`; roadmap rows 43 `idea`/#196 and 45 `defined`/deps 43; `grep -in "pass.?routing"` on the two AC15 surfaces → 0 matches (exit 1) at HEAD, so AC15 stays satisfiable; repo `review-*` skills match issue #201 Mechanics 1's finder vocabulary; issue #196 Mechanics reserves `aw resolve-passes` with the `.mjs` fallback ladder.
- Cycle note (fifth review of the unit): the three findings are new (no repeated finding ids) and were missed on a changed snapshot, but two of the three failed checks (C5, C9) had passed at RS-45-03/RS-45-04 — the same non-anomaly rationale v3/v4 recorded ("missed by the same check re-run on a changed snapshot") no longer covers the pattern: a whole-half re-ground is what the union now demands. Printed per POLICY §4 below; a repair responding to this persisted verdict produces a new snapshot by design, so the route is not blocked.

```text
CONVERGENCE-ANOMALY — 45-operator-approved-model-routing spec
- Finding ids: repeated: none / new: SF-45-020, SF-45-021, SF-45-022
- Snapshots: 9de8b72abd51c3d8cd42358c41953a4ff5cced9d173101ee97b38ae661fe211d → 2c90c79f9cb6e200ad1217d8d60cfb49bfb4bcbca29f0cee8e014edd0dd40f3b (artifactRevisionId 143261d2315ecb7c86236b2c46f960083b37fd62 → 5157d7c56e7189ed783c3d62d2893bcd95ea47df)
- Missed: the governing issue's README/CHANGELOG affected-surface pair (unclaimed by any scope row across four repair batches); the fourth strict-validator rejection class named in semantics §3 (invalid model reference — unobserved criterion); the `thinking` field of the `{model, thinking}` entry (committed to the resolved table but never given values, shapes, or an absent-entry rule)
- Owning stage: product
- Why the prior repair failed: each batch repaired exactly the finding rows on the table and re-ran the same bounded lint gates, without one full sweep of the governing issue's affected-surface list and of the half's own named output fields against the AC set
- Route to owner: design-feature repair batch v5 — ONE batch over the full open set (SF-45-020, SF-45-021, SF-45-022), then /review-spec re-review of the new snapshot
```
- Zero writes to reviewed artifacts: SPEC.md, decisions.md, ROADMAP.md untouched by this review (receipt + findings rows only; `git status --porcelain` re-checked after the ledger writes).

## Repair batch v5 — design-feature (response to RS-45-05)
- Scope: ONE batch over the full open findings set SF-45-020, SF-45-021, SF-45-022 (two low + one medium; all `class: product`; REPAIR §1 — no per-finding re-review, no split by file). The route RS-45-05's CONVERGENCE-ANOMALY named is honored exactly: one batch, then re-review of the new snapshot.
- Classes: all three closure completion (REPAIR class 2, evidence acquired) — none mechanical. SF-45-020's claim and SF-45-022's semantics were directed by the operator's dated instruction (2026-09-09): "claim the README/CHANGELOG affected-surface pair (in scope or an explicit out-of-scope row with an owner)" and "record thinking's semantics (valid values, accepted shapes, absent-entry resolution in the table)"; AD-45-008 appended for 022.
- Repairs: SF-45-020 — README/CHANGELOG EN+ES pair claimed IN SCOPE: in-scope item 9 + derived-subsystem row "Package documentation" + sweep row 14 + AC19 (command-verified; anchors pre-verified at HEAD `e13096d3` — `"passes"` → 0 matches in both package READMEs, `pass.?routing|passes config` → 0/0 in both CHANGELOGs, exit 1 — achievable and decidable once the docs land, the pre-verified anchoring SF-45-019 introduced; all four surfaces verified to exist); scope alignment to issue #201's own affected-surface list, not widening. SF-45-021 — AC17 added (command-verified): invalid model reference → exit ≠ 0 at `$.passes.<pass-name>.model` (issue #201 Tests first's reporting shape), both the scalar `"nope"` and the non-`provider/modelId` chain-element shapes; §3's fourth rejection class now observed; pointers extended (in-scope 2, item 8, sweep row 12). SF-45-022 — AD-45-008 + new SPEC subsection "Pass-entry `thinking` semantics" (valid values = the shipped route vocabulary `off|minimal|low|medium|high|xhigh|max` or `"inherit"` per `types.ts` THINKING_LEVELS/ThinkingSetting; shape = single scalar only, no array — availability fallthrough does not apply; absent key/entry → `"inherit"`, mirroring the shipped default route `{"model": "inherit", "thinking": "inherit"}`; `inline` passes carry `"inherit"`; verbatim carriage, never rewritten by chain resolution/`auto`) + AC18 (command-verified: explicit carriage, absent → `"inherit"`, non-scalar → exit ≠ 0 at `$.passes.<pass-name>.thinking`); in-scope item 4 now states the table carries both fields. The literal `<name>` token of the issue's path template is spelled `<pass-name>` in the SPEC so box 1's bounded grep stays clean (re-run below, exit 1); decisions.md keeps the issue-verbatim shape.
- Gates re-run and pasted: spec-lint product boxes — bounded placeholder grep → no output (exit 1); counts verified by grep: 19 ACs (17 `command-verified`, 2 `read-verified`), 14 sweep rows all in-scope with pointers, 9 in-scope items each mapped (item 9 → AC19), 13/13 CAPABILITIES rows + 7 derived rows. Readiness preflight stage:spec — all 10 boxes tick, `READY-FOR-REVIEW` (below).
- New `artifactRevisionId`: `f3fe6dcabfd3b589d66823e9ed7d7be4a98a06db` (commit `f3fe6dca`, "docs(features): repair 45 product half after SPEC-REVIEW-FAIL (SF-45-020..022)" — the commit that produced the repaired SPEC bytes; mandatory rotation per evidence-grounding; SPEC now 44810 bytes).
- Receipts untouched: RS-45-05 and all finding severities/claims unchanged; rows resolved via the `status/resolution-evidence/resolving-artifact-revision` columns only.
- Zero open findings classified outside `product`; no counter-evidence dismissal used; no forge issue created; scope not widened beyond the governing issue's own affected-surface list (README/CHANGELOG claimed, not invented).
- Cycle note: the reviewer's own ledger (RS-45-05 receipt, committed `e4e9d9c1`) already printed the CONVERGENCE-ANOMALY and routed it here; this batch is the routed owner acting — the anomaly block is not re-printed. RS-45-05's "why the prior repair failed" is answered structurally: this batch swept the governing issue's full affected-surface list (the pair was the only unclaimed surface) and gave every named output field of the resolved table (`model` and now `thinking`) explicit values/shapes/absence semantics with observing criteria.

### READINESS — 45-operator-approved-model-routing spec READY-FOR-REVIEW
- Artifact revision: f3fe6dcabfd3b589d66823e9ed7d7be4a98a06db · Rows checked: 14 (Evidence E1–E14) · Unknowns open: 0
- Evidence: SPEC Product half (`### Evidence`) + `decisions.md` · Frozen: 2026-09-09
- Boxes: B1 bounded placeholder grep → no output (re-run exit 1); B2 `designed` earned by spec-lint (status names batches through v5); B3 zero blank entity rows; B4 13/13 inventory rows + 7 derived; B5 role matrix complete (operator allowed, orchestrator allowed, pass denied); B6 14/14 sweep rows resolved with pointers; B7 in-scope→AC map + every AC labelled (19/19: 17 command-verified, 2 read-verified); B8 deferred rows carry triggers; B9 all evidence rows `current` + `proven`/`decision` (E1–E14); B10 no memory/chat-sourced claims. D1: no delegated-evidence run (n/a).
- Readiness is an authoring gate, not a review verdict — handoff to `/review-spec` for the independent re-review of the new snapshot.

## Pre-execution review receipt v1 — spec
- Review: RS-45-06 · Snapshot: d076d534f5ac2d897ad8add74f57d0f18364ad8307a4677ab46a5a1cabcccd26 · Verdict: spec-review-fail
- Unit: 45-operator-approved-model-routing · Stage: spec · Unit kind: feature · Parent: null
- Source revision: f3fe6dcabfd3b589d66823e9ed7d7be4a98a06db · Artifact revision: f3fe6dcabfd3b589d66823e9ed7d7be4a98a06db
- Reviewer: pi-web:review-spec (fresh context, no authoring turns) · Session: manual (no runtime session identity exposed) · Role: reviewer · Author: design-feature repair batch v5 session (commit f3fe6dca; identity not exposed)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-09T06:55Z/2026-09-09T07:17Z · Findings: 1 (material open: 1)

Notes:
- Re-review of repair batch v5 (SF-45-020…022 all resolved at revision `f3fe6dca…`). Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 45-operator-approved-model-routing`; artifact row `spec-product-v1`, 38758 bytes, digest `07ac1766a84ea5c15c2f30ba452e1f08e96e4931091efe62907ee2f7ffb7b328`; sourceRevision and artifactRevisionId coincide by derivation and match the handoff id. HEAD at review time is `406ed91b` (the ledger-write commit after the artifact) — recorded beside the builder-bound revision per POLICY §7.
- Builder context kinds: architectural-invariants: absent; normalized-repository-state: present, digest `e8509783…`; project-guide: present, digest `9ae03966…`. Two further authorities consulted this review, not representable in the builder's context list, recorded as manual notes (`validated: manual` for those rows): governing-issue #201 (OPEN, body re-read via `gh issue view 201` — Summary, Mechanics 1, Tests first, Non-goals, Affected surfaces, Depends on, Open questions; the `$.passes.<name>.model` reporting shape and the README/CHANGELOG EN+ES affected-surface pair confirmed verbatim) and dependency-unit (roadmap row 43 `producer-package`, `idea`, issue #196 OPEN — `aw resolve-passes` reserved with the `aw` → `.mjs` → prose ladder confirmed in #196 Mechanics; row 45 `defined`, deps `43`).
- v5 resolution verification (all three hold at `f3fe6dca`): SF-45-020 — in-scope item 9 + derived "Package documentation" row + sweep row 14 + AC19 present; AC19's anchors pre-verified and re-verified at HEAD `406ed91b`: `grep -c '"passes"'` on `packages/pi-agentic-workflow/README.md` + `README.es.md` → 0/0, `grep -cin 'pass.?routing\|passes config'` on `CHANGELOG.md` + `CHANGELOG.es.md` → 0/0 (exit 1); all four files exist. SF-45-021 — AC17 present (command-verified, both the bare-`"nope"` scalar and the non-`provider/modelId` chain-element shapes; `$.passes.<pass-name>.model` reporting path matches issue #201 Tests first's `$.passes.<name>.model` — the `<pass-name>` spelling keeps the bounded placeholder grep clean, verified: box 1 re-run → no output, exit 1); semantics §3's fourth rejection class observed. SF-45-022 — AD-45-008 + SPEC subsection "Pass-entry `thinking` semantics" present and grounded: `packages/pi-agentic-workflow/src/config/types.ts` THINKING_LEVELS = `off|minimal|low|medium|high|xhigh|max`, ThinkingSetting = level or `"inherit"`; shipped default route `{"model": "inherit", "thinking": "inherit"}` confirmed (`README.md:86`, merge.ts comment); AC18 present; in-scope item 4 states both fields.
- Falsification (pre-check stance): the half's product decisions (AD-45-001…005, AD-45-006…008) all trace to dated `decisions.md` rows — none invented; the Business-goal "order of magnitude cost reduction" is aspirational with no AC, but C1 binds in-scope items (all mapped) and cost tracking is an explicit non-goal; no role left unspecified in the derived matrix; the repository premises checked — ROOT_KEYS, trust gate, unseeded CAPABILITIES inventory, thinking vocabulary, AC19 anchors — all hold, EXCEPT the shipped `default` value shape (see SF-45-023). Stance entering checks: NO-CONFIRMED-GAPS on the v5 surface; the check re-run surfaced the `default`-shape contradiction instead.
- Check results: C1–C7 pass, C8 finding (SF-45-023), C9 pass, C10 finding (SF-45-023), C11–C14 pass. Failed checks: C8, C10.
- Verified repository claims (C10): `packages/pi-agentic-workflow/src/config/schema.ts:14` ROOT_KEYS `default|commands|onUnavailableRoute` (E4's `:17` pointer imprecision — same disclosure as RS-45-04/05, claim verified true, row stays `proven`/`current`); `src/config/types.ts:8-16` THINKING_LEVELS + ThinkingSetting exactly as E14 claims; `schema.ts:59,98` checkRoute requires `default`/route values to be records — `{"default":"nan/x"}` and `{"default":["nan/x"]}` are rejections today; `test/config-merge.test.mjs:39,105-107` and `README.md:74` confirm the shipped object shape; `src/config/load.ts:20` + `settings/console.ts:156` trust-gate claims hold; `docs/CAPABILITIES.md` unseeded (13 placeholder subsystem rows, placeholder Roles row 24); all named surfaces exist at HEAD; `scripts/pre-execution-quality.test.mjs:482` holds the model-routing alphabetical-key assertion (AC10); roadmap rows 43 `idea`/#196 and 45 `defined`/deps 43; issue #201 OPEN with the pass vocabulary, reporting shape, and affected surfaces as the SPEC records; issue #196 OPEN with `aw resolve-passes` + the `.mjs` ladder.
- Ledger note (disclosed, not filed — RS-45-04 precedent for non-artifact blemishes): rows SF-45-019…SF-45-022 in `planning-findings.md` sit outside the file's fenced table block (the fence closes after SF-45-018, line 29) — reviewer-authored placement from RS-45-04/RS-45-05; row content is intact and pipe-parseable, no gate reads the fence (`pre-execution-quality` pins no fence shape); this review appended SF-45-023 in the same plain-row stream rather than touching existing rows.
- Cycle note (sixth review of the unit): the finding is new (no repeated finding ids) and was missed on a changed snapshot, but C10 had passed at RS-45-03/04/05 for the ROOT_KEYS aspect and the AC-shape aspect was never re-grounded against the shipped value shapes — per POLICY §4 the convergence anomaly is printed below before routing; a repair responding to this persisted verdict produces a new snapshot by design, so the route is not blocked.

```text
CONVERGENCE-ANOMALY — 45-operator-approved-model-routing spec
- Finding ids: repeated: none / new: SF-45-023
- Snapshots: 2c90c79f9cb6e200ad1217d8d60cfb49bfb4bcbca29f0cee8e014edd0dd40f3b → d076d534f5ac2d897ad8add74f57d0f18364ad8307a4677ab46a5a1cabcccd26 (artifactRevisionId 5157d7c56e7189ed783c3d62d2893bcd95ea47df → f3fe6dcabfd3b589d66823e9ed7d7be4a98a06db)
- Missed: the shipped `default` value shape (RouteFile object) — five review rounds verified ROOT_KEYS and pass-vocabulary claims but never re-grounded in-scope item 1's "(existing)" single-ref claim nor AC11's backward-compat command against the validator's accepted value shapes
- Owning stage: product
- Why the prior repair failed: v5 (like v1–v4) repaired exactly the rows on the table; the value-shape premise of in-scope item 1/AC11 predates the cycle and was never sampled against `schema.ts`'s checkRoute, so no batch re-grounded it
- Route to owner: design-feature repair batch v6 — ONE batch over the full open set (SF-45-023), then /review-spec re-review of the new snapshot
```
- Zero writes to reviewed artifacts: SPEC.md, decisions.md, ROADMAP.md untouched by this review (receipt + findings row only; `git status --porcelain` re-checked after the ledger writes).

## Repair batch v6 — design-feature (response to RS-45-06)
- Scope: ONE batch over the full open findings set SF-45-023 (single medium finding, `class: product`; REPAIR §1).
- Classes: SF-45-023 closure completion (REPAIR class 2, evidence acquired) — correcting a mischaracterization that predates the repair cycle (present in the original SPEC cut): in-scope item 1 rewritten (the real existing `default` shape is a RouteFile object `{model, thinking}`, not a bare string), chain extension described as a second valid shape with bare-string explicitly excluded, AD-45-009 appended for the design choice (two chain forms: plain-array with implicit `thinking: inherit`, or chain-in-object with explicit model+thinking), AC11 re-ground (four sub-commands: existing object backward compat, plain-array chain, chain-in-object with thinking, bare-string rejection), AC12 re-ground (uses valid RouteFile object in the test).
- Gates re-run and pasted: spec-lint product boxes — bounded placeholder grep → no output (exit 1); counts verified by grep: 19 ACs (17 `command-verified`, 2 `read-verified`), 14 sweep rows, 9 in-scope items each mapped (item 1 → AC11/AC3), 13/13 CAPABILITIES rows + 7 derived rows. Readiness preflight stage:spec — all 10 boxes tick, `READY-FOR-REVIEW` (below).
- New `artifactRevisionId`: `9c79644a78fdf1564edbdc1740acc2d6d2f0b2a6` (commit `9c79644a`, "docs(features): repair 45 product half — re-ground default shape (SF-45-023)").
- Receipts untouched: RS-45-06 and all finding severities/claims unchanged; rows resolved via the `status/resolution-evidence/resolving-artifact-revision` columns only.
- Zero open findings classified outside `product`; no counter-evidence dismissal used; no forge issue created; scope not widened.
- Cycle note: sixth review of the unit; the value-shape premise was present from the original SPEC cut. Prior reviewers verified ROOT_KEYS and pass vocabulary but never re-grounded item 1's "(existing)" claim against `checkRoute`'s accepted value shapes — the root cause RS-45-06's CONVERGENCE-ANOMALY identified. RS-45-06's anomaly says "the prior repair failed: v5 (like v1–v4) repaired exactly the tabled rows; the value-shape premise of item 1/AC11 predates the cycle and was never sampled against `schema.ts`". This batch directly addresses that root cause.

### READINESS — 45-operator-approved-model-routing spec READY-FOR-REVIEW
- Artifact revision: 9c79644a78fdf1564edbdc1740acc2d6d2f0b2a6 · Rows checked: 14 (Evidence E1–E14) · Unknowns open: 0
- Evidence: SPEC Product half (`### Evidence`) + `decisions.md` · Frozen: 2026-09-09
- Boxes: B1 bounded placeholder grep → no output (re-run exit 1); B2 `designed` earned by spec-lint (status names batches through v6); B3 zero blank entity rows; B4 13/13 inventory rows + 7 derived; B5 role matrix complete (operator allowed, orchestrator allowed, pass denied); B6 14/14 sweep rows resolved with pointers; B7 in-scope→AC map + every AC labelled (19/19: 17 command-verified, 2 read-verified); B8 deferred rows carry triggers; B9 all evidence rows `current` + `proven`/`decision` (E1–E14); B10 no memory/chat-sourced claims. D1: no delegated-evidence run (n/a).
- Readiness is an authoring gate, not a review verdict — handoff to `/review-spec` for the independent re-review of the new snapshot.

## Pre-execution review receipt v1 — spec
- Review: RS-45-07 · Snapshot: 28eca84413f3c581baa85baf3448b7b9c396cb1a0bb21683076d34f0dee3e278 · Verdict: spec-review-pass
- Unit: 45-operator-approved-model-routing · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 9c79644a78fdf1564edbdc1740acc2d6d2f0b2a6 · Artifact revision: 9c79644a78fdf1564edbdc1740acc2d6d2f0b2a6
- Reviewer: pi-web:review-spec@1.7.1 · Session: manual (no runtime session identity exposed) · Role: reviewer · Author: design-feature repair batch v6 (commit 9c79644a; identity not exposed)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-09T07:30Z/2026-09-09T07:45Z · Findings: 0 (material open: 0)

Notes:
- Head at review time is `ea6465d8` (a ledger-write commit after the artifact) — recorded beside the builder-bound revision per POLICY §7. The builder binds `sourceRevision`/`artifactRevisionId` to `9c79644a`, the commit that produced the reviewed SPEC bytes (the repair that re-ground the default value shape). HEAD `ea6465d8` is the ledger-write commit that resolved SF-45-023 in planning-findings.md and updated progress.md.
- Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 45-operator-approved-model-routing` (builder-validated). The builder emitted three context kinds (architectural-invariants: absent; normalized-repository-state: present, digest `e8509783…`; project-guide: present, digest `9ae03966…`). Two further authorities were consulted by this review but are not representable in the builder's context list, recorded here as manual notes (`validated: manual` for these two): governing-issue #201 (OPEN, fetched via `gh issue view 201`) and dependency-unit (roadmap row 43 `producer-package`, issue #196 OPEN).
- Falsification (pre-check stance): the half's product decisions (AD-45-001…009) all trace to dated `decisions.md` rows — none invented; the Business-goal "order of magnitude cost reduction" is aspirational with no AC, but C1 binds in-scope items (all mapped) and cost tracking is an explicit non-goal; no role left unspecified in the derived matrix; the repository premises checked — ROOT_KEYS, RouteFile default shape, thinking vocabulary, trust gate, unseeded CAPABILITIES inventory — all hold.
- Check results: C1–C14 all pass. No findings. All 23 prior findings (SF-45-001…SF-45-023) are resolved in `planning-findings.md`.
- Verified repository claims (C10): `packages/pi-agentic-workflow/src/config/schema.ts:14` ROOT_KEYS `default|commands|onUnavailableRoute`; `schema.ts:59,98` checkRoute requires `default`/route values to be records (non-record → rejection) — the existing `default` shape is a RouteFile object `{model?, thinking?}` confirmed by `types.ts:24-28`; a bare string or bare array is rejected; the extension accepts plain-array chains and chain-in-object; `types.ts:8-16` THINKING_LEVELS = `off|minimal|low|medium|high|xhigh|max`, ThinkingSetting = level or `"inherit"`; `src/config/load.ts:20` + `settings/console.ts:156` trust-gate claims hold; `docs/CAPABILITIES.md` unseeded (13 placeholder subsystem rows, placeholder Roles row 24); all named surfaces exist at HEAD; `scripts/pre-execution-quality.test.mjs:482` holds the model-routing alphabetical-key assertion (AC10); roadmap rows 43 `producer-package`/#196 and 45 `defined`/deps 43; issue #201 OPEN with the pass vocabulary, reporting shape, and affected surfaces as the SPEC records; issue #196 OPEN with `aw resolve-passes` + the `.mjs` ladder.
- Ledger note: all 23 prior findings (SF-45-001…SF-45-023) are resolved; planning-findings.md fence and plain rows are intact. SF-45-023 resolution row at HEAD carries `resolving-artifact-revision: 9c79644a78fdf1564edbdc1740acc2d6d2f0b2a6` — the artifact revision this receipt binds.
- Cycle note (seventh review of the unit): the one finding from RS-45-06 (SF-45-023, the default-value shape mischaracterization) was addressed directly by repair batch v6 — the batch re-grounded item 1 against `checkRoute`'s accepted shapes, re-written AC11/AC12, and added AD-45-009. The CONVERGENCE-ANOMALY from RS-45-06 noted the root cause: prior reviewers verified ROOT_KEYS and pass vocabulary but never re-grounded item 1's "(existing)" claim against `schema.ts`. This batch fixed that root cause. The finding ids: repeated = none / new = none (SF-45-023 was the only finding from RS-45-06, now resolved). No prior-passing checks regressed — the same checks (C8, C10) now pass where they were blocked by SF-45-023. No CONVERGENCE-ANOMALY printed: the previous PASS on checks C8/C10 is explained by the removal of SF-45-023's material content on those checks, not by blind re-review.
- Zero writes to reviewed artifacts: SPEC.md, decisions.md, ROADMAP.md untouched by this review (receipt + findings rows only; `git status --porcelain` re-checked after the ledger writes).

## Scaffold — plan-feature-scaffold (response to RS-45-07)

- **Done**: Engineering half filled (technical goals, architecture impact, design
  incl. resolved-table shape D-E45-5, planning evidence PE-001–PE-021, obligations
  O1–O23, decisions to confirm D-E45-1…D-E45-7, testing requirements, 7 dev
  scenarios, five single-layer phases P1–P5 with 8/8 phase-lint fingerprints);
  `ACCEPTANCE.md` frozen (AC1–AC19, all with named validators); engineering
  decisions AD-45-010…AD-45-013 appended to `decisions.md`; roadmap row 45
  `defined → planned` (re-read after the write: literally `planned`, deps `43`).
- **Remains**: execution (P1–P5) after a current PLAN-REVIEW-PASS; feature 43
  (`idea`) must be designed/built before or alongside execution — it owns the
  `aw` rung of the producer ladder this plan's `.mjs` tier falls back to.
- **Gotchas**: the claude-branch injector treats every `model-routing.yml`
  top-level key as a skill, so the new `passes` section requires the
  non-skill-key skip (PE-011/D-E45-6) or `sync-claude` fails on push to main;
  the Product-half projection is byte-identical after the Engineering-half
  append (`spec-product-v1` digest `3f770298…`, byteLength 39780 — RS-45-07's
  binding holds); the plan snapshot binds the whole SPEC (XS/S ledgers embedded
  per LEDGERS, so its planning-evidence/obligations rows are `absent` by design).
- **Files**: SPEC.md (engineering half), ACCEPTANCE.md (new), decisions.md,
  ROADMAP.md, progress.md (this entry).
- **Next**: `/review-plan 45` — independent context; a plan with no current
  Plan review receipt is not executable.

- Acceptance manifest blob (`git hash-object ACCEPTANCE.md`):
  `9b3a2c320c24273a076e66ab88d4ae6b093887fd` · Status: frozen

Preflight: Stage 1 — NRS consumed · arch: deferred
Preflight: NRS consumed · invariant classification: n/a (no project invariants declared — F010)

### READINESS — 45-operator-approved-model-routing plan READY-FOR-REVIEW

- Artifact revision: 3c0b777212c6ebd4b48bc107eb54e071d291c318 · Rows checked: 21 (PE-001–PE-021) · Unknowns open: 0
- Evidence: SPEC `### Planning evidence` (XS/S embed; obligations O1–O23 alongside) · Frozen: 2026-09-09
- Boxes: B1 parent `designed` + current SPEC-REVIEW-PASS (RS-45-07, snapshot
  `28eca844…`, Product projection digest `3f770298…` unchanged after the
  Engineering-half append); B2 `ACCEPTANCE.md` frozen, 19 stable IDs, named
  validators, blob recorded above; B3 architecture impact names the affected
  surfaces with path evidence (PE-001…PE-019) + invariant classification
  `n/a` (F010); B4 obligations O1–O23, one phase + one task each, zero blank
  cells, none deferred; B5 planning-evidence table in its XS/S home, every
  Engineering claim resolved (PE-001–PE-021); B6 scenario matrix walks all six
  fixed failure categories, each naming its existing mechanism; B7 phase-lint
  8/8 recorded with fingerprints (P1 7 tasks · P2 8 · P3 4 · P4 6 · P5 7);
  B8 phase order matches the deps closure, no early build of a later
  deliverable, final phase = Hardening & PR; B9 compatibility boundary +
  rollback stated (additive config, strict validator loud-failure boundary),
  no unnamed public contract change (`auto`-only-in-passes closed reading
  recorded as D-E45-4); B10 no decision words in phases; open questions all
  RESOLVED or owner-named; B11 every evidence row `current`, zero unknowns.
  D1: no delegated-evidence run (n/a).
- Readiness is an authoring gate, not a review verdict — handoff to
  `/review-plan 45` for the independent review of the new snapshot.
