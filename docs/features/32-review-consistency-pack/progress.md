# Progress — 32-review-consistency-pack

Last reviewed: —

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: SPEC-REVIEW-32-1 · Snapshot: 5852f381958322e3ab690af196254c4c542672c021e86d2c10e9c03e7cc624a4 · Verdict: spec-review-fail
- Unit: 32-review-consistency-pack · Stage: spec · Unit kind: feature · Parent: null
- Source revision: a4c60040e5792522b6ed33d0f097c1e414d24173 · Artifact revision: a4c60040e5792522b6ed33d0f097c1e414d24173
- Reviewer: review-spec (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: design-feature (2026-09-17 authoring turn)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T00:03Z/2026-09-18T00:08Z · Findings: 8 (material open: 5)
```

Notes:
- Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 32-review-consistency-pack`; digest is stdout's first line. `artifactRevisionId` was left to the builder's derived default (no explicit author handoff id was carried into this manual review turn), so the bound Product bytes are pinned by digest: artifact `spec` (`docs/features/32-review-consistency-pack/SPEC.md`, selector `spec-product-v1`, 40062 bytes, sha256 `545dca50edb8142c473771027760b158aa8e6ae310cdea1ced284123d96dba93`).
- **Write fix required before the mark could land (recorded, not hidden).** The authoring turn left the Product half untracked on `main` with the roadmap row promoted in the working tree and no `docs(32): …` design commit, so the builder's first `contentRevision` resolved to `87d5b2db` (a context-only commit) and the sensor read the untracked bound artifact as `stale-artifact-content` (`structural.fresh: false`, `changedPaths: [SPEC.md]`). Per POLICY §8 / OUTPUT ("fix the write and re-run; the verdict is not emit-able"), this review turn created the branch the SPEC itself declares (`feat/32-review-consistency-pack`), committed the author's frozen bytes unmodified (`a4c60040 docs(32): record the authored product half for independent review (#172)`; `SPEC.md` + `decisions.md` + the roadmap row promotion), and rebuilt the snapshot. The Product selector digest is byte-identical across the two builds (`545dca50…`), so the bytes reviewed and the bytes bound are the same bytes; only the revision that covers them changed.
- Contexts emitted by the recipe owner (its `CONTEXT_SOURCES` set): `project-guide` (`CLAUDE.md`, present), `normalized-repository-state` (`docs/workflow/REPOSITORY_STATE.md`, present), `architectural-invariants` (`docs/architecture/ARCHITECTURAL_INVARIANTS.md`, absent). Governing issue #172 and dependency units 30/31 were consulted live (roadmap rows 30/31/32; `gh issue view 172` body incl. its 2026-09-07 amendment) but the builder's fixed context set carries no `governing-issue`/`dependency-unit` row — recorded here, not in the snapshot (same shape as SPEC-REVIEW-59-1).
- All 14 Product checks resolved: C1, C2, C3, C4, C5, C7, C11, C13 pass; C6, C8, C9, C10, C12, C14 carry findings (F1–F8). Five material rows open (F1 high; F2–F5 medium); F6/F7 low, F8 info.
- C11 pass is a judgment recorded explicitly: every material claim resolves to a `proven`/`decision` row that is `current`, and E-19's `unknown` carries an owner plus next evidence — but E-19 keeps `freshness: drifted` while C11's literal third clause and READINESS box 9 forbid a surviving `drifted` row. ROWS.md §"Closed vocabularies" prescribes exactly this encoding ("re-acquired **or** demoted to `unknown` with an owner"), so the row is compliant with the row-shape owner and carries no material claim; the check-vs-ROWS.md wording tension is noted for the check's own owner, not filed against this half.
- Falsification pass run per CHECKS.md §2 (stance CONFIRMED-GAPS → confirmed): F1 (E-09's `proven`/`current` row is false — the finder scale is live in nine review passes and already converted at `PERSIST_AND_DECIDE.md:20-21`), F2 (`docs/CAPABILITIES.md` exists, tracked since `1bab6e60`), F3 (the planning scale is live at `LEDGERS.md:92`). Spot-checks that passed: FOLDING.md:26 / PERSIST_AND_DECIDE.md:28 / fold-findings/SKILL.md:153 / LEDGERS.md:117 and :139-146 (E-01/E-02), CLASSIFY.md severity legend (:86-88), audit-docs 14 checks + `MEDIUM` + `<n>/13` (E-04), product-audit `postpone/tradeoff` (E-05), audit-pr `warning` (E-06), `NRS_BLOCKING` (E-07), EXECUTION_CONTRACT NRS-optional clause (E-08), review-change triage-mode prose (E-10), F010 absence of `docs/architecture/` (E-16), issue #172 open with its 2026-09-07 amendment and README bibliography obligation (E-13). C13 pass checked against precedent: the `## Size` phase sketch is the project's established sizing idiom (feature 30 §Size; feature 59 §Size names P1–P4), not engineering leakage.
- Zero writes to any reviewed artifact: `SPEC.md` and `decisions.md` carry the exact bytes the author wrote and the exact bytes the digest binds (the commit only records them), the roadmap row is the author's own promotion as found, and no reviewed byte was edited. Only this file (receipt) and `planning-findings.md` (F1–F8) were authored by this turn. `artifactRevisionId` rotation depends on manual handoff — no runtime rotation occurred; any later write to `SPEC.md` invalidates this receipt.
- Self-check `verify --stage spec` run in the same act as this write (write-then-report); its JSON output is printed beside the verdict block in chat.

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: SPEC-REVIEW-32-2 · Snapshot: 4efd6ffacf65996d0e606de0dd75d3248f6aeab666d19412160500aa621726a4 · Verdict: spec-review-fail
- Unit: 32-review-consistency-pack · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 929c6cb28a6319c3014628bb7b7d1c9af7e94f25 · Artifact revision: 929c6cb28a6319c3014628bb7b7d1c9af7e94f25
- Reviewer: review-spec (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: design-feature (2026-09-18 repair batch, D32-6)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T07:05Z/2026-09-18T07:13Z · Findings: 2 (material open: 2)
```

Notes:
- Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 32-review-consistency-pack`; digest is stdout's first line. `artifactRevisionId` defaults to the content-derived revision of the bound paths (no explicit handoff id carried in this manual turn); bound Product bytes: spec `docs/features/32-review-consistency-pack/SPEC.md`, selector `spec-product-v1`, 44859 bytes, sha256 `9db21c849c84e033b4ddb2bf002f641d0d953e35d845f8c475620e22a884570d` at revision `929c6cb2`.
- Contexts emitted by the recipe owner's fixed `CONTEXT_SOURCES` set: `project-guide` (`CLAUDE.md`, present, digest `f5c8e142…`), `normalized-repository-state` (`docs/workflow/REPOSITORY_STATE.md`, present, digest `e1b81e29…`), `architectural-invariants` (`docs/architecture/ARCHITECTURAL_INVARIANTS.md`, absent). Governing issue #172 and dependency units 30/31 were consulted live but the builder's fixed context set carries no `governing-issue`/`dependency-unit` row — recorded here, not in the snapshot (same shape as SPEC-REVIEW-32-1 / SPEC-REVIEW-59-1).
- This is the re-review of the repaired revision (parent review SPEC-REVIEW-32-1, snapshot `5852f381…`, FAIL with F1–F8). Snapshot changed → no no-progress; this is the normal first repair/re-review cycle, not a second cycle, so no `CONVERGENCE-ANOMALY`.
- All 14 Product checks resolved: C1–C8, C11–C14 pass; C9 and C10 carry findings (F9, F10). Independent verification re-ran every material evidence row of the repaired half: E-01/E-02 (fold-flip claims + LEDGERS prose vs table), E-03 (ledger severity legend), E-04 (audit-docs 14 checks, `MEDIUM`:98, `<n>/13`:125, `| # | Check (1-13) |`:121), E-05 (`postpone|tradeoff`), E-06 (`warning`:52 vs `pass / blocker / n-a`:55,58), E-07 (`NRS_BLOCKING`:223 includes `missing`), E-08 (EXECUTION_CONTRACT NRS-optional clause), E-09 (finder scale live in nine review passes; ad-hoc map at `PERSIST_AND_DECIDE.md:20-21`), E-10 (review-change triage-issue prose), E-13 (issue #172 open, incl. 2026-09-07 amendment + bibliography obligation), E-14/E-15 (roadmap rows 30 done · #188; 31 idea; 33/35/50 depend on 32), E-16 (no `docs/architecture/`), E-20 (`WORKFLOW_INVARIANTS.md:78-80`), E-22 (`docs/CAPABILITIES.md` tracked at `1bab6e60`, 47 lines, byte-identical to the template), E-23 (planning scale at `LEDGERS.md:92`; live rows 37-F1 `info`, 59-F1 `low`). All match.
- C11 pass is a judgment recorded explicitly: every material claim resolves to a `proven`/`decision` row that is `current`, and E-19's `unknown` carries an owner plus next evidence — but E-19 keeps `freshness: drifted` while C11's literal third clause forbids a surviving `drifted` row. `evidence-grounding/references/ROWS.md` §"Closed vocabularies" prescribes exactly this encoding ("re-acquired **or** demoted to `unknown` with an owner"), so the row complies with the row-shape owner and carries no material claim; the check-vs-ROWS.md wording tension belongs to the check's owner (same note as SPEC-REVIEW-32-1).
- C13 pass checked against the project's established sizing idiom (`## Size` names no authoritative phase cut; feature 30 / 59 do the same and remain Plan-stage work).
- Zero writes to any reviewed artifact: `SPEC.md`, `decisions.md`, and the roadmap row carry the exact bytes the repair turn committed at `929c6cb2` (the snapshot digest binds them); this turn authored only this receipt block and the F9/F10 rows in `planning-findings.md`. `artifactRevisionId` rotation depends on manual handoff — no runtime rotation occurred; any later write to `SPEC.md` invalidates this receipt.
- Self-check `verify --stage spec` run in the same act as this write (write-then-report); its JSON output is printed beside the verdict block in chat.
## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: SPEC-REVIEW-32-3 · Snapshot: eb2e7a29d80eaf9c66de29efc11f0a81eb69e8bf83ba7ddb5c34b4494ce4d9e7 · Verdict: spec-review-fail
- Unit: 32-review-consistency-pack · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 0f93f7ea4e736f41df373753a45bafce2af9ac8d · Artifact revision: 0f93f7ea4e736f41df373753a45bafce2af9ac8d
- Reviewer: review-spec (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: design-feature (2026-09-18 repair batch, D32-7)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T08:30Z/2026-09-18T08:37Z · Findings: 2 (material open: 2)
```

Notes:
- Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 32-review-consistency-pack`; digest is stdout's first line. `artifactRevisionId` defaults to the content-derived revision of the bound paths (no explicit handoff id carried in this manual turn); bound Product bytes: spec `docs/features/32-review-consistency-pack/SPEC.md`, selector `spec-product-v1`, 46614 bytes, sha256 `095f955afcb3c6465c90ec72b2429fe3f0415e7090c787778cd301591323bb44` at revision `0f93f7ea`. Snapshot digest differs from the parent review's `4efd6ffa…` (the D32-7 repair changed `SPEC.md`), so no no-progress.
- Contexts emitted by the recipe owner's fixed `CONTEXT_SOURCES` set: `project-guide` (`CLAUDE.md`, present, digest `f5c8e142…`), `normalized-repository-state` (`docs/workflow/REPOSITORY_STATE.md`, present, digest `e1b81e29…`), `architectural-invariants` (`docs/architecture/ARCHITECTURAL_INVARIANTS.md`, absent). Governing issue #172 and dependency units 30/31 were consulted live (`gh issue view 172` incl. its 2026-09-07 amendment; roadmap rows 30/31/32) but the builder's fixed context set carries no `governing-issue`/`dependency-unit` row — recorded here, not in the snapshot (same shape as SPEC-REVIEW-32-1/32-2).
- All 14 Product checks resolved: C1–C8, C10, C13 pass; C9 carries F11; C11 carries F12; C12 passes with a recorded note (the `docs/CAPABILITIES.md` fill offer is flagged for the human in `decisions.md` D32-6, is optional extra work, and exports no current-unit obligation); C14 passes (the NRS staleness routes to `resolve-repository-state`, the `manifest` slot is a reserved out-of-scope interface, no obligation leaves the unit).
- The F9 repair is independently re-verified and grammar-admitting. `IS-4`'s encoding (add `execute-phase:gate-ran-marks` + `review-change:review-gate-ran-marks` to the existing `review-findings` truth-class row's owner cell, and mirror the identical cell in both `docs/*/_TEMPLATE/LEDGERS.md`) passes the machine-read grammar: reproduced in a throwaway tree (`LEDGER_OWNERSHIP_REPO=/tmp/lo32`) → `node --test scripts/ledger-ownership.test.mjs` = 16 pass / 0 fail; `scripts/ledger-ownership.test.mjs:66-74` (`TRUTH_CLASSES` = 7), `:158-164` (one row per class), `:176-186` (unique ledger per pattern), `:223-241` (`ownerCellFailures`: unknown skill, duplicate column-set), `:186-196` (`squash(mapRow.owner) !== squash(row.owner)`), `:411-417` (`knownSkills` reads `skills/*/SKILL.md` → both skills are known). The F10 counts are re-derived green: 25 entity rows (5 entities × 5), 18 Integration-closure rows, 17 sweep rows, 7 capabilities × 4 roles.
- Falsification pass per CHECKS.md §2 (stance CONFIRMED-GAPS → F11/F12 confirmed). Evidence spot-checks at the bound revision: E-01/E-02 (`PERSIST_AND_DECIDE.md:28`, `FOLDING.md:26`, `fold-findings/SKILL.md:153`, `LEDGERS.md:117` + `:139-146`), E-03 (`CLASSIFY.md:18-24,86-88`), E-04 (`audit-docs/SKILL.md:98` `MEDIUM`, `:121` `| # | Check (1-13) |`, `:125` `<n>/13`), E-05 (`product-audit/SKILL.md:100,105`; `AUDIT_PROCESS.md:7`), E-06 (`audit-pr/SKILL.md:52` vs `:55,58`), E-07 (`workflow-status.mjs:223`), E-08 (`EXECUTION_CONTRACT.md:108-116`), E-10 (`review-change/SKILL.md:44,153`; `PERSIST_AND_DECIDE.md:37`; `OUTPUT_AND_GUARDRAILS.md:38`), E-16 (`docs/architecture/` absent; `REPOSITORY_STATE.md` F010), E-17 (F011/AD-002), E-18 (`LEDGERS.md:123`), E-20 (`WORKFLOW_INVARIANTS.md:78-80`), E-22 (`docs/CAPABILITIES.md` tracked, 47 lines, byte-identical to `template/docs/CAPABILITIES.md`), E-23 (`LEDGERS.md:92`). AC-01's grep `only step that ever flips|one and only ledger state transition` over `docs/workflow/` returns nothing today. E-15's "row 32 exists at `idea`" is pre-promotion state with the same row noting "plus this turn's edit" — recorded as an observation, not filed.
- C11's `drifted`/`unknown` row (E-19) is the same recorded judgment as SPEC-REVIEW-32-1/32-2: it carries no material claim, names its owner and next evidence, and `evidence-grounding/references/ROWS.md` §"Closed vocabularies" prescribes exactly this encoding. F12 is a separate gap (a material claim with no row at all), not the E-19 wording tension.
- CONVERGENCE-ANOMALY applies: this is the second repair/re-review cycle (SPEC-REVIEW-32-1 FAIL → D32-6 → SPEC-REVIEW-32-2 FAIL → D32-7 → this review). Printed before the next edit, routed, not a stop — a repair turn whose input is a persisted FAIL produces a new snapshot by design.
- Zero writes to any reviewed artifact: `SPEC.md`, `decisions.md`, and the roadmap row carry the exact bytes the D32-7 repair committed at `0f93f7ea` (the snapshot digest binds them); this turn authored only this receipt block and the F11/F12 rows in `planning-findings.md`. `artifactRevisionId` rotation depends on manual handoff — no runtime rotation occurred; any later write to `SPEC.md` invalidates this receipt.
- Self-check `verify --stage spec` run in the same act as this write (write-then-report); its JSON output is printed beside the verdict block in chat.

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: SPEC-REVIEW-32-4 · Snapshot: 5d5a5b6c04cad71e2b5fdf8cc1fa3fd248164d9ea7ae68968e54cd00f06f0acd · Verdict: spec-review-pass
- Unit: 32-review-consistency-pack · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 7cb1398f38355306ab4b74ce9ff387cec3466a3b · Artifact revision: 7cb1398f38355306ab4b74ce9ff387cec3466a3b
- Reviewer: review-spec (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: design-feature (2026-09-18 repair batch, D32-8)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T10:33Z/2026-09-18T10:43Z · Findings: 0 (material open: 0)
```

Notes:
- Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 32-review-consistency-pack`; digest is stdout's first line. The builder derived `sourceRevision`/`artifactRevisionId` = `7cb1398f` (the content revision of the bound paths); `HEAD` is `2a87c5cd`, which only appended the F11–F12 resolution rows to `planning-findings.md` and is binding-irrelevant. Bound Product bytes: spec `docs/features/32-review-consistency-pack/SPEC.md`, selector `spec-product-v1`, 48622 bytes, sha256 `675349efa8655a55345aec1c7ac47163ceb2eb6cb0832f0eada53924713e68cc`.
- Contexts emitted by the recipe owner's fixed set: `project-guide` (`CLAUDE.md`, present, digest `f5c8e142…`), `normalized-repository-state` (`docs/workflow/REPOSITORY_STATE.md`, present, digest `e1b81e29…`), `architectural-invariants` (`docs/architecture/ARCHITECTURAL_INVARIANTS.md`, absent). Governing issue #172 and dependency units 30/31 were consulted live (`gh issue view 172` incl. its 2026-09-07 amendment; roadmap rows 30/31/32) but the builder's fixed context set carries no `governing-issue`/`dependency-unit` row — recorded here, not in the snapshot (same shape as SPEC-REVIEW-32-1/32-2/32-3).
- This is the re-review of the D32-8 repair (parent SPEC-REVIEW-32-3, snapshot `eb2e7a29…`, FAIL with F11–F12). Snapshot changed (`eb2e7a29…` → `5d5a5b6c…`) → no no-progress.
- All 14 Product checks resolved **pass**: C1–C14. Independent verification re-ran every evidence row against the bound revision: E-01/E-02 (`PERSIST_AND_DECIDE.md:28`, `FOLDING.md:26`, `fold-findings/SKILL.md:153`, `LEDGERS.md:117` + `:139-146`), E-03 (`CLASSIFY.md:18-24,86-88`), E-04 (`audit-docs/SKILL.md:98` `MEDIUM`, `:121` `| # | Check (1-13) |`, `:125` `<n>/13`; checks 1–14 confirmed), E-05 (`product-audit/SKILL.md:100,105`; `AUDIT_PROCESS.md:7`), E-06 (`audit-pr/SKILL.md:52` `blocker / warning / n-a` vs `:55,58` `pass / blocker / n-a`), E-07 (`workflow-status.mjs:223`), E-08 (`EXECUTION_CONTRACT.md:108-116`), E-09 (finder scale live in exactly nine review passes; ad-hoc map at `PERSIST_AND_DECIDE.md:20-21`), E-10 (`review-change/SKILL.md:44,153`; `PERSIST_AND_DECIDE.md:37`; `OUTPUT_AND_GUARDRAILS.md:38` — only the proposals route), E-14/E-15 (roadmap rows 30 done · #188; 31 `idea`; 33/35/50 depend on 32), E-16 (no `docs/architecture/`), E-18 (`LEDGERS.md:123`), E-20 (`WORKFLOW_INVARIANTS.md:78-80`), E-22 (`docs/CAPABILITIES.md` 47 lines, tracked at `1bab6e60`, byte-identical to `template/docs/CAPABILITIES.md`), E-23 (`LEDGERS.md:90-92`), E-24 (`LEDGERS.md:146`; `plan-feature/SKILL.md:91-94`; `plan-feature-scaffold/SKILL.md:110`). All match the bound bytes.
- F9's grammar question was independently re-verified in a throwaway `git archive HEAD` tree (`/tmp/lo32`): baseline `node --test scripts/ledger-ownership.test.mjs` = 18 pass / 0 fail; applying IS-4's owner-column extension (`execute-phase:gate-ran-marks` + `review-change:review-gate-ran-marks` on the existing `review-findings` truth-class row, mirrored identically in both `docs/*/_TEMPLATE/LEDGERS.md`) = 18 pass / 0 fail; adding a **new** `gate-ran` truth-class row instead = 16 pass / 2 fail with `map truth class "gate-ran" is not one of the seven AC16 classes` and `ledger "docs/features/<NN>-<slug>/review-findings.md" is already declared by "review-findings"`. D32-7's encoding is therefore the grammar-admitting one and the SPEC's claim is exact.
- F11/F12 independently re-verified. The reworded out-of-scope bullet disambiguates the two LEDGERS.md **template projections** (which DO change) from the `template/` **export mirror** (which stays); the mirror is in fact drifted (`template/docs/features/_TEMPLATE/LEDGERS.md` and `template/docs/fix/_TEMPLATE/LEDGERS.md` lack `review-change:finding-mark` relative to the live projections), so the bullet's stated reason holds. E-24's citations are accurate and ground IS-5(c) → AC-07.
- Recorded observations, non-material — no finding filed: (1) E-15's "row 32 exists at `idea`" describes the pre-promotion state; the roadmap row now reads `defined` and the same row carries "(plus this turn's edit)" — the claim's material content (dependencies 30/31; dependents 33/35/50) is accurate, and the promotion is recorded in `decisions.md`. (2) IS-4's "every mark names its recorder" is satisfied by the ownership map's two recorder column-sets; the pinned format itself carries no recorder field, and AC-04 pins the format without one — a plan-stage implementation detail, not a product gap. (3) `## Size`'s per-owner phase sketch matches the project's established sizing idiom (feature 30 / feature 59 `## Size`, the latter review-passed); it names no PLAN phase, task, or phase validator. (4) C11/E-19 is the same recorded judgment as the prior three receipts: E-19 carries `freshness: drifted` with `status: unknown` + owner + next evidence, and `evidence-grounding/references/ROWS.md` §"Closed vocabularies" prescribes exactly this encoding ("re-acquired **or** demoted to `unknown` with an owner"); the row is not evidence and the check-vs-ROWS wording tension belongs to the check's owner.
- Cycle count: this is the third repair/re-review cycle (32-1 FAIL → D32-6 → 32-2 FAIL → D32-7 → 32-3 FAIL → D32-8 → this review). POLICY §4 makes the anomaly informational and never a stop; each repair turn responded to a persisted FAIL receipt (new snapshot by design), so no cycle cap or anomaly rule blocks this PASS. Feature 31's hard two-cycle cap is not merged (roadmap row 31 `idea`) and does not apply.
- Zero writes to any reviewed artifact: `SPEC.md`, `decisions.md`, and the roadmap row carry the exact bytes the D32-8 repair committed at `7cb1398f` (the snapshot digest binds them); this turn authored only this receipt block, and appended zero findings rows (`Findings: 0`). `artifactRevisionId` rotation depends on manual handoff — no runtime rotation occurred; any later write to `SPEC.md` invalidates this receipt.
- Self-check `verify --stage spec` run in the same act as this write (write-then-report); its JSON output is printed beside the verdict block in chat.

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-32-1 · Snapshot: 102238d5e10dd88444b947fed646915fe77daf7096c4c5f5322608aab4044c97 · Verdict: plan-review-fail
- Unit: 32-review-consistency-pack · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 5d5a5b6c04cad71e2b5fdf8cc1fa3fd248164d9ea7ae68968e54cd00f06f0acd · Parent Product receipt: SPEC-REVIEW-32-4
- Source revision: e1c008bc039d2403855fd180da156a9472bc43e7 · Artifact revision: e1c008bc039d2403855fd180da156a9472bc43e7
- Reviewer: review-plan (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: plan-feature-scaffold (2026-09-18 `32-plan-1`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-19T11:50Z/2026-09-19T12:15Z · Findings: 7 (material open: 6)
- Ledgers read: planning-evidence 22 rows · obligations 25 rows (verified-capable: 22)
- Prior plan receipt (re-review only): none — first cycle
```

Notes:

- Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage plan --unit 32-review-consistency-pack --parent 5d5a5b6c04cad71e2b5fdf8cc1fa3fd248164d9ea7ae68968e54cd00f06f0acd`; digest is stdout's first line (`102238d5…`). Bound artifacts: `SPEC.md` (whole-file 69401 B, `98ec785d…`), `ACCEPTANCE.md` (`6b8db637…`), `PLAN.md` (`2c47fc6b…`), `TASKS.md` (`7f417498…`), `planning-evidence.md` (`b3d2c49e…`), `planning-obligations.md` (`925a6b49…`), `testing.md` (`e1901989…`), `decisions.md` (`23d17cff…`), `architecture-notes.md` (`c96d9c69…`). No `planning-evidence`/`obligations` rows are `absent` (M unit froze both ledgers as files). `sourceRevision`/`artifactRevisionId` default to `e1c008bc` (HEAD, no source write in this turn); the planner's label is `32-plan-1` — no runtime rotates the id in this environment, so the builder's digest-derived value is bound and the label recorded (the same reconciliation `plan-review-31-1` recorded).
- **L1 fails — the bound parent is stale, not missing.** `bun scripts/pre-execution-snapshot.mjs verify --stage spec --unit 32-review-consistency-pack` answers `digestMatches: false`, `structural.fresh: false`, `reasonCode: "stale-context"`, `changedPaths: ["CLAUDE.md"]`: `SPEC-REVIEW-32-4` recorded `project-guide` (`CLAUDE.md`) at `f5c8e142…`; at `e1c008bc` the file hashes `45af6d85…` (`87d5b2db` → `b968c33e`), so the current spec snapshot recomputes to `e4b293e3…` instead of the bound `5d5a5b6c…`. The Product projection itself is unchanged (`spec-product-v1` digest `675349ef…`, 48622 B, byte-identical to the reviewed bytes), but the contract binds contexts too. No current `SPEC-REVIEW-PASS` therefore exists to parent this plan; parent state = `stale-parent → review-spec first`.
- Contexts emitted by the recipe owner at `e1c008bc`: `project-guide` (`CLAUDE.md`, present, `45af6d85…`), `normalized-repository-state` (`docs/workflow/REPOSITORY_STATE.md`, present, `e1b81e29…`), `architectural-invariants` (`docs/architecture/ARCHITECTURAL_INVARIANTS.md`, absent). Governing issue #172 and dependency rows 30/31 were read live; the builder's fixed context set carries no `governing-issue`/`dependency-unit` row (recorded here, not in the snapshot — same shape as SPEC-REVIEW-32-1…4).
- **Root cause of the substantive plan finding.** The plan set was cut at `2a87c5cd`/`852c29ef`, before the branch merged `origin/main` at `e1c008bc` — which brought feature 31 (the SPEC's declared hard execution dependency, merged via #243) and feature 60 (#245). `git diff --stat 7cb1398f HEAD` shows the planned target surfaces moved after the evidence revision (`LEDGERS.md` +4, `PERSIST_AND_DECIDE.md` −15, `review-change/SKILL.md` +2, `audit-pr/SKILL.md` +2, `fold-findings/SKILL.md` ±24, `workflow-status.mjs` +2, `review-loop-discipline.test.mjs` +41, `audit-pr-receipt.test.mjs` rewritten, `SKILL_CONTEXT_BUDGETS.json` 164 lines), while every `planning-evidence` row still claims `freshness: current`/`status: proven` and the SPEC `## Dependencies` still reads feature 31 "not yet merged (roadmap status `idea`)". PE-022 is falsified at `e1c008bc`: roadmap row 31 is `done · #243` and the committed row 32 is `idea`.
- Falsification pass (CHECKS.md §2) stance CONFIRMED-GAPS → confirmed: F13 (stale parent, L1), F14 (pre-merge plan vs merged dependency 31), F15 (P4/AC-09/O13 gate red at head), F16/F17 (stale `path:line` and stale ledger counts), F18 (31's overlapping materiality contract), F19 (roadmap write clobbered by the merge). Spot-checks that passed at `e1c008bc`: `CLASSIFY.md:29-41,86-88` (closed classes + severity legend), `audit-docs/SKILL.md` (14 checks, `MEDIUM` at :98, `(1-13)` at :121, `<n>/13` at :125), `product-audit` `postpone|tradeoff`, `PERSIST_AND_DECIDE.md:20-21,28` (ad-hoc map + sole-flipper sentence still present), `review-loop-discipline.test.mjs:40` (`critical.*high.*major.*med.*minor.*low` still present), `plan-feature/SKILL.md:92-94`, `plan-feature-scaffold/SKILL.md:110`, `unit-route.mjs:114,128`, `ledger-provenance.mjs:33`, `phase-lint.mjs:232-237,468-487`.
- Ledger sweep: L1 fail (above); L2 fail (PE rows stale/falsified — F14/F16/F18); L3 pass (obligations cover every AC-01…AC-11, the four applicable invariants, the grammar/mirror invariants, and the six dev scenarios); L4 pass (every row names one phase, one task, an owner, a validator, required evidence; none blank or `deferred`); L5 pass (each named failure state maps to a scenario with a phase and a validator that can fail); L6 pass (F1–F12 all `resolved` with resolution evidence and revisions; no open material row).
- Engineering checks: P1 finding by omission of pre-31 reconciliation; P2 fail; P3 pass; P4 `n/a: no secrets/authn/PII surface — docs and a read-only sensor`; P5 pass (budget re-basis + English-only interim named); P6 pass (per-phase progress receipts / idempotent re-entry); P7 pass (`## Deploy & rollback`: standard revert, no migration); P8 pass (sensor projects the new state; docs carry the rule); P9 pass (`bun scripts/phase-lint.mjs docs/features/32-review-consistency-pack/PLAN.md` → all five phases PASS (8/8), verdict PASS, flags `P1:config/infra:3:nrs-missing-ledger-notice` … `P5:hardening:9:hardening-pr`); P10 fail (F15); P11 pass (six scenarios mapped); P12 fail (F16/F17). Reports-only, no F-checks (feature unit).
- Zero writes to any reviewed artifact: `SPEC.md`, `PLAN.md`, `TASKS.md`, `ACCEPTANCE.md`, `planning-evidence.md`, `planning-obligations.md`, `decisions.md`, `architecture-notes.md`, `testing.md`, and the roadmap row carry the exact bytes the plan set was committed at (`852c29ef`); this turn authored only this receipt block and the F13–F19 rows in `planning-findings.md`. The pre-existing `docs/features/ROADMAP.md` working-tree modification (`idea` → `planned`) predates this turn and was not touched. `artifactRevisionId` rotation depends on manual handoff — no runtime rotation occurred; any later write to a bound artifact invalidates this receipt.
- Self-check (`verify --stage plan`, POLICY §8), run in the same act as this write:

```json
{
  "current": false,
  "stage": "plan",
  "unit": "32-review-consistency-pack",
  "receipt": {
    "id": "PLAN-REVIEW-32-1",
    "verdict": "plan-review-fail",
    "snapshot": "102238d5e10dd88444b947fed646915fe77daf7096c4c5f5322608aab4044c97",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "102238d5e10dd88444b947fed646915fe77daf7096c4c5f5322608aab4044c97",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}

(exit 4 — the write landed, `structural.fresh: true`, `digestMatches: true`; `current` is false because the verdict is FAIL, which is the expected emit result and routes per the verdict.)
```

## Acceptance receipt v1

- Manifest: docs/features/32-review-consistency-pack/ACCEPTANCE.md · Blob: ce71193384cbf0cb7f4adb490456f309da8fc2e5 · Status: frozen · Verified: 2026-09-18 (recorded at plan freeze by `plan-feature-scaffold`; recomputed before every phase and final review per `verification-contract`)

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: SPEC-REVIEW-32-5 · Snapshot: e4b293e3f62f2ad543423b172fa4766c211604a7d77d6ea719700dd949aeb9a7 · Verdict: spec-review-pass
- Unit: 32-review-consistency-pack · Stage: spec · Unit kind: feature · Parent: null
- Source revision: e1c008bc039d2403855fd180da156a9472bc43e7 · Artifact revision: e1c008bc039d2403855fd180da156a9472bc43e7
- Reviewer: review-spec (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: design-feature (D32-8 repair batch) + plan-feature-scaffold (`32-plan-1`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-19T13:20Z/2026-09-19T13:40Z · Findings: 1 (material open: 0)
- Artifact: docs/features/32-review-consistency-pack/SPEC.md · selector spec-product-v1 · bytes 48622 · digest 675349efa8655a55345aec1c7ac47163ceb2eb6cb0832f0eada53924713e68cc · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 14/14 evaluated (13 pass · C10 carries one low report-note F20; material open 0) · falsification CONFIRMED-GAPS → F20 only
```

Notes:

- Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 32-review-consistency-pack`; digest is stdout's first line (`e4b293e3…`). Bound Product bytes: spec `docs/features/32-review-consistency-pack/SPEC.md`, selector `spec-product-v1`, 48622 bytes, sha256 `675349ef…`. Contexts emitted by the recipe owner's fixed set: `project-guide` (`CLAUDE.md`, present, `45af6d85…`), `normalized-repository-state` (`docs/workflow/REPOSITORY_STATE.md`, present, `e1b81e29…`), `architectural-invariants` (`docs/architecture/ARCHITECTURAL_INVARIANTS.md`, absent). The roadmap row is read as routing data and deliberately unbound; parent is `null`. Governing issue #172 (open, incl. its 2026-09-07 amendment) and dependency rows 30/31 were consulted live; the builder's fixed context set carries no `governing-issue`/`dependency-unit` row — recorded here, not in the snapshot (same shape as SPEC-REVIEW-32-1…4).
- **Why this review exists.** `SPEC-REVIEW-32-4` (PASS at `7cb1398f`, snapshot `5d5a5b6c…`) went stale on its **contexts**, not on its artifact: `CLAUDE.md` moved `f5c8e142…` → `45af6d85…` (`87d5b2db` → `b968c33e`, feature 60's P3 path-protection rows), so the current spec snapshot recomputes to `e4b293e3…` and `verify --stage spec` answers `structural.fresh: false`, `reasonCode: "stale-context"`, `changedPaths: ["CLAUDE.md"]`. The Product projection is byte-identical to the bytes that review approved (`675349ef…`, 48622 B) — planning writes cannot invalidate a spec-stage receipt by themselves, but a context row can. `PLAN-REVIEW-32-1`'s L1 (F13) named exactly this and routed here; the substantive plan findings F14–F19 are plan-stage and are not this review's work.
- Cycle count (POLICY §4): `32-1` FAIL → D32-6 → `32-2` FAIL → D32-7 → `32-3` FAIL → D32-8 → `32-4` **PASS (count reset)** → this review. This is cycle 1 of the new window on a changed snapshot, so no `CONVERGENCE-ANOMALY` block is owed and the merged two-cycle/third-cycle rule does not arm.
- Falsification pass (CHECKS.md §2, stance CONFIRMED-GAPS → one confirmed gap). Hostile probes: (1) the four derived-blocking citation categories of IS-3 are traceable to existing single-owner sources and to E-11/E-12, not invented; (2) D32-4's reserved `manifest <sha>` slot is the issue #172 2026-09-07 amendment verbatim (E-13); (3) IS-6's bibliography row is the issue's own obligation (E-13 + E-11). The user outcome "blocking stops being a severity opinion" carries an observable check (AC-03's discipline pins). No capability row leaves a role unspecified (4 roles × 7 capabilities, every cell resolved). What would have to be true for the half to be wrong — that `CLASSIFY.md` already owned a conversion table, that the ledger already used the finder scale, or that `LEDGERS.md`'s prose already matched its own table — is **false**: the ad-hoc finder map is still live at `PERSIST_AND_DECIDE.md:20-21`, the `triage-issue`-gives-it sentence is still at `LEDGERS.md:121`, and no conversion section exists in `CLASSIFY.md`. The one confirmed gap is the citation/dependency drift filed as F20.
- Independent re-verification at `e1c008bc` (content, not line numbers). Confirmed live: `PERSIST_AND_DECIDE.md:28` ("only step that ever flips it to `yes`") and `:20-21` (the ad-hoc finder map); `FOLDING.md:26` ("the one and only ledger state transition, owned solely by this fold cycle"); `fold-findings/SKILL.md:157` ("this skill only flips"); the `ledger-ownership@1` map's `review-findings` annotator `fold-findings:folded-flag` and the roadmap writer column-sets (`LEDGERS.md:145`, `:150`); `LEDGERS.md:91-96` (material = `medium`+, `low` = report-note); `CLASSIFY.md:18-24,86-88`; `audit-docs/SKILL.md:98` (`MEDIUM`), `:121` (`Check (1-13)` header), `:125` (`<n>/13`) with 14 real checks; `product-audit/SKILL.md:100,105` + `AUDIT_PROCESS.md:7` (`fix-now / postpone / tradeoff`); `audit-pr/SKILL.md:54` (`pass / blocker / warning / n-a`) vs `:55,58` (`pass / blocker / n-a`); `workflow-status.mjs:225` (`NRS_BLOCKING` includes `missing`); `EXECUTION_CONTRACT.md:108-116` (NRS optional); the finder scale `critical | major | minor` in exactly nine `review-*` passes; `review-change/SKILL.md:44,155`; `WORKFLOW_INVARIANTS.md:78-80`; `plan-feature/SKILL.md:92-94`; `plan-feature-scaffold/SKILL.md:110`; `docs/CAPABILITIES.md` = 47 lines, byte-identical to `template/docs/CAPABILITIES.md`; no `docs/architecture/`; roadmap rows 30 (`done · #188`), 31 (`done · #243`), 33/35/50 depending on 32.
- **The one row — F20 (`low`, `product`, check C10, report-note).** The post-authoring merge of feature 31 (#243, this unit's declared hard dependency) and feature 60 (#245) shifted the surfaces the Evidence rows cite and merged the dependency those rows record as open (detail in `planning-findings.md`). Every underlying claim was re-verified in substance; only the citations moved (`fold-findings/SKILL.md:153`→`:157`; `LEDGERS.md:117`→`:121`, `:123`→`:127`, `:139-146`→`:142-149`, `:146`→`:150`; `audit-pr/SKILL.md:52`→`:54`; `workflow-status.mjs:223`→`:225`) and the dependency status advanced (`## Dependencies` + E-14 still read 31 as unmerged; roadmap row 31 is `done · #243`). Intent, obligation identity, phase topology, validators and authority are unaffected, so `low` — a persisted report-note the stage author (`design-feature`) re-bases without a re-review (LEDGERS.md §3; POLICY §3 wording-only determination if the rotation is recorded) — is the honest band, not a deflation of a blocking defect: no ACCEPTANCE criterion fails, no obligation row is non-`verified`/`n-a`, no gate is red at head, and no open `fix-now` row exists. `A PASS may coexist with open or unverified low/info report-note rows` (LEDGERS.md:111); the established precedent is `spec-review-30-1` (PASS, 2 non-material rows) and `SPEC-REVIEW-37-2` (PASS, 3 `info` rows).
- Recorded observations, non-material, no finding filed: (1) E-19 keeps `freshness: drifted` with `status: unknown`, an owner and next evidence — the exact encoding `evidence-grounding/references/ROWS.md` §"Closed vocabularies" prescribes (same note as SPEC-REVIEW-32-1…4), and it carries no material claim. (2) IS-3's classification outcome "report-note" and feature 31's shipped severity band "report-note" share one word; in effect they agree (uncited or `low` ⇒ non-blocking) and F18 routes the wording reconciliation to the plan re-cut. (3) F19's pre-existing working-tree `docs/features/ROADMAP.md` modification (`idea` → `planned · 32-plan-1`) predates this turn and was not touched; the roadmap row is unbound at this stage. (4) `## Size`'s per-owner phase sketch remains the project's established sizing idiom (feature 30 / feature 59), not engineering leakage.
- Zero writes to any reviewed artifact: `SPEC.md`, `decisions.md`, `ACCEPTANCE.md` and the roadmap row carry the exact bytes they held at `e1c008bc` — `git status --porcelain` shows no change to any of them. This turn authored only this receipt block (unbound `progress.md`) and the F20 row (unbound `planning-findings.md`). No runtime rotates `artifactRevisionId` in this environment, so the mutate-and-revert guarantee rests on the manual handoff — any later write to a bound artifact invalidates this receipt.
- Self-check (`verify --stage spec`, POLICY §8) run in the same act as this write, before the report:

## Product checks (14/14 evaluated — the fixed list, one row each)

| # | Check | Result | Evidence at `e1c008bc` (bound product bytes `675349ef…`) |
|---|---|---|---|
| C1 | Outcome ownership | pass | Each in-scope item states a concrete outcome with its AC anchor: IS-1→AC-01, IS-2→AC-02, IS-3→AC-03, IS-4→AC-04, IS-5→AC-05/06/07/08, IS-6→AC-10, IS-7→AC-09/11; `## Business goals` name observable machine behaviours (gate-run reuse, citation-backed blocking), never "improve X" |
| C2 | Actors and roles | pass | Four derived roles — agent-reviewer, agent-executor, orchestrator, human — named, and the matrix resolves all 7 capabilities × 4 roles to `allowed`/`denied`, with the `n/a` cells being manual-path impossibilities, not unlisted roles |
| C3 | Entity closure | pass | 25 closure rows re-counted mechanically (5 entities × Create/Read-list/Update/Delete/State transitions); zero blank; every row resolves to UI/API/test or an explicit `n/a: <reason>` (permanent section, append-only mark, static mapping) |
| C4 | Limits and failure states | pass | Size `M`; failure states each resolved — unknown severity scale fails closed (AC-02), changed HEAD ⇒ re-run (AC-04), missing NRS ledger ⇒ non-blocking notice (AC-05), `draft`/`contradicted`/`resolved` keep blocking |
| C5 | Scope and non-goals | pass | 9 out-of-scope bullets, each naming an owner or a non-goal (feature 31, feature 33, feature 35, feature 28's `c6daf5ec`, AD-002/F011 interim, no schema change); nothing excluded by silence |
| C6 | Integration closure | pass | 18 inventory rows, one per derived subsystem, none skipped; `docs/CAPABILITIES.md` re-verified as the unfilled 47-line template byte-identical to `template/docs/CAPABILITIES.md`, and the derived inventory is recorded in the half |
| C7 | Expectation sweep | pass | 17 rows (≥ 10 for M), counted mechanically, each forced to `in-scope`/`out-of-scope` with a pointer (`deferred` unused) |
| C8 | Acceptance objectivity | pass | AC-01…AC-11, objective and labelled: 10 `command-verified`, 1 `read-verified` (AC-10, merge-time bibliography); every in-scope bullet maps to ≥ 1 criterion |
| C9 | Internal contradiction | pass | Counts are mutually consistent and match the Spec-lint box (25 entity rows; 18 inventory rows; 17 sweep rows; 7 capability rows × 4 roles); no two sections assert incompatible behaviour, counts or ownership |
| C10 | Repository contradiction | finding (low) | Claims match the repository in substance, but several authoring-time citations and the feature-31 dependency status no longer resolve at `e1c008bc` → F20 (report-note) |
| C11 | Evidence integrity | pass | Every material claim resolves to a `proven`/`decision` row; no unowned `unknown`; E-19 keeps the sanctioned `drifted`/`unknown` + owner + next-evidence encoding; F20's rows stay `current` in metadata and are re-based by their owner |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none`; DD-1's resolution is recorded (D32-6); the `docs/CAPABILITIES.md` fill offer is flagged for the human in D32-6 and exports no current-unit obligation |
| C13 | Engineering leakage | pass | The half cuts no PLAN phase, task or phase validator; `## Size`'s per-owner sketch is the established sizing idiom, and the closure rows' test pointers are the half's own product-level observability |
| C14 | Obligation containment | pass | No current-unit obligation is exported: IS-6 ships with the PR, the NRS staleness routes to `resolve-repository-state`, and no row defers work to a future issue or "later" |

Findings: 1 (material open: 0 — F20 `low`, report-note, owner `design-feature`).

```json
{
  "current": true,
  "stage": "spec",
  "unit": "32-review-consistency-pack",
  "receipt": {
    "id": "SPEC-REVIEW-32-5",
    "verdict": "spec-review-pass",
    "snapshot": "e4b293e3f62f2ad543423b172fa4766c211604a7d77d6ea719700dd949aeb9a7",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "e4b293e3f62f2ad543423b172fa4766c211604a7d77d6ea719700dd949aeb9a7",
  "digestMatches": true,
  "verdictIsPass": true,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 0 — a PASS: `structural.fresh: true`, `current: true`, `digestMatches: true`.)

## Verdict

```text
SPEC-REVIEW-PASS — 32-review-consistency-pack
- Snapshot: e4b293e3f62f2ad543423b172fa4766c211604a7d77d6ea719700dd949aeb9a7 · Artifact revision: e1c008bc039d2403855fd180da156a9472bc43e7 · Checks: 14/14
- Material findings open: 0 · Read-only: no reviewed artifact modified
- Authority: planning may bind this receipt as its Product parent
```

No reviewed artifact was modified by this turn; the only writes are to the unbound `progress.md` and `planning-findings.md`. F20 (`low`, `product`, report-note) is the sole open row and does not block: the stage author (`design-feature`) re-bases the drifted citations and the feature-31 dependency status without a re-review (LEDGERS.md §3; POLICY §3 wording-only determination if the rotation is recorded).

→ Next: /plan-feature 32-review-consistency-pack — Product half reviewed; the plan binds this receipt
  · design changed underneath → re-run /review-spec 32-review-consistency-pack first
  · recurring closure gaps across units → /product-audit (a systemic pattern, not one SPEC)

## Plan repair batch `32-plan-2` — plan-feature authoring turn (2026-09-19)

Trigger: `PLAN-REVIEW-32-1` (`plan-review-fail`, snapshot `102238d5…`) findings
F13–F19. The FAIL receipt's emitted continuation was
`/plan-feature 32-review-consistency-pack "<instruction>" — one repair batch for
F13 + F14 + F15 + F16 + F17 + F18 + F19, then /review-plan ... judges the new
artifact revision`; this turn ran exactly that batch. Root cause (one, not seven):
the plan set was cut at `2a87c5cd` **before** this branch merged `origin/main` at
`e1c008bc`, which brought feature 31 (PR #243 — the SPEC's declared hard
execution dependency) and feature 60 (PR #245).

**Router line, recorded rather than hidden.** `node scripts/unit-route.mjs 32`
answers `status: planned`, `open-rows: 0`, `route: execute` — not `replan` —
because the router reads only the code-side `review-findings.md` ledger and this
unit carries no such file: its findings live in `planning-findings.md`. The
`replan-findings` contract therefore does not load, and its prohibition on
re-scaffolding is honoured — nothing was re-scaffolded, the existing phase cut
was re-cut in place. The repair is authorised by `review-plan`'s own route table
(`PLAN-REVIEW-FAIL`, `class: plan` → `plan-feature`, one root-caused repair batch
→ new artifact revision → re-review), which is the block this unit's FAIL receipt
printed. Observable gap for its owner: the router has no plan-ledger intake, so a
plan-stage FAIL never produces the `route: replan` line that contract expects.

**What changed** (one batch; the F13–F19 rows in `planning-findings.md` are all
`resolved` with their resolution evidence and `resolving-artifact-revision`
`32-plan-2`):

- **F13** — the parent Product receipt is re-established as `SPEC-REVIEW-32-5`
  (`spec-review-pass`, snapshot `e4b293e3…`, `current: true`, zero open material
  rows), because `SPEC-REVIEW-32-4` went `stale-context` when feature 60 moved
  `CLAUDE.md`. The `32-plan-2` snapshot parents to it
  (`--parent e4b293e3…`).
- **F14 / F16** — `planning-evidence.md` is fully re-based: every row re-read at
  `e1c008bc`, every shifted `path:line` updated (`LEDGERS.md`, `fold-findings`,
  `audit-pr`, `workflow-status.mjs`, `CLAUDE.md`, the two suites), `PE-016`
  corrected (the budget manifest declares per-skill entries for only some touched
  skills; the rest ride `defaults`, the case feature 30's P30-4 recorded) and
  `PE-022` rewritten to the **satisfied** dependency closure (rows 30 and 31 both
  `done` and merged).
- **F15** — `PE-023` records the `CHANGELOG.md` `pre-execution-review` 2.3.0
  collision and its observed 18/19 drift-gate failure; P4 gains task 1, which
  resolves it at the row (the later-merged feature 60 row takes 2.4.0 with the
  matching frontmatter) instead of extending `LEGACY_DUPLICATE_VERSION_ROWS`, so
  P4's done-when and O13 can reach exit 0.
- **F17** — `PLAN.md`'s ledger references now read `PE-001…PE-023` and
  `O1…O25`, matching the two ledgers, and the SPEC's engineering half was
  corrected to the same counts.
- **F18** — `ED-32-9`: `report-note` stays owned by `LEDGERS.md` §3
  (`:91-96`, feature 31's shipped materiality contract) and is cited, never
  restated; P1 adds an assertion that the sensor's merged feature 31
  review-loop-cycle projection survives the NRS branch.
- **F19** — the roadmap row's promotion is re-committed as
  `planned · 32-plan-2`, so the row is durable at HEAD.

**Deliberately not done** (reported, never smuggled in):

- `SPEC.md ## Dependencies` still records feature 31 as unmerged. That sentence is
  Product half: re-basing it here would rotate the Product bytes `SPEC-REVIEW-32-5`
  binds. It is filed as **F20** (`low`, `product`, owner `design-feature`) and
  re-based there, as a report-note with no re-review owed.
- The `CHANGELOG.md` correction is *planned* (P4 task 1), not executed here: it is
  release bookkeeping inside the phase that owns it (`ED-32-8`). The frozen
  `ACCEPTANCE.md` blob is untouched (`ce71193384cbf0cb7f4adb490456f309da8fc2e5`),
  and `node --test scripts/normative-drift.test.mjs` stays 18/19 at the planning
  head by design until P4 lands.
- `planning-findings.md` row **F12** (spec stage, `resolved`, authored by
  `review-spec`) carries one raw `|` inside its evidence cell, so a pipe split
  reads 11 cells instead of the 10 the ledger header fixes. It is outside this
  batch's rows and was left untouched — reported here for its owner.

Phase-lint (verbatim stdout of `bun scripts/phase-lint.mjs docs/features/32-review-consistency-pack/PLAN.md`):

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:config/infra:4:nrs-missing-ledger-notice
P2 Phase-lint: PASS (8/8) · fingerprint P2:docs:8:contract-prose-alignment
P3 Phase-lint: PASS (8/8) · fingerprint P3:docs:8:classification-single-owner-contract
P4 Phase-lint: PASS (8/8) · fingerprint P4:docs:7:gate-run-receipt
P5 Phase-lint: PASS (8/8) · fingerprint P5:hardening:9:hardening-pr
verdict PASS
fingerprint: bcc83a051816c2a893161c819f301ed0b27b9a7b6021ccbc1d9382f91fe29382
```

Readiness preflight (`evidence-grounding/references/READINESS.md`, `stage: plan`,
boxes 1–11 re-run on the re-cut bytes):

```text
READINESS — 32-review-consistency-pack plan READY-FOR-REVIEW
- Artifact revision: 32-plan-2 · Rows checked: 23 evidence / 25 obligations · Unknowns open: 0
- Evidence: planning-evidence.md · Frozen: 2026-09-18 (ACCEPTANCE.md blob ce71193384cbf0cb7f4adb490456f309da8fc2e5)
```

- Box 1 — the governing Product half is `designed` and `SPEC-REVIEW-32-5` is a
  current `spec-review-pass` for exactly `e4b293e3…`, the snapshot parented here.
- Box 2 — `ACCEPTANCE.md` is `frozen`, one stable ID per SPEC criterion AC-01…AC-11,
  every row carries a named validator; blob recomputed `ce711933…` (unchanged).
- Box 3 — `architecture-notes.md` names the affected surfaces with `path:line`
  evidence and the invariant classification (`n/a` project invariants; workflow
  rows `preserves`).
- Box 4 — 25 obligation rows, each with phase, task, owner, validator, required
  evidence and a non-blank `planned` status; no `deferred` row.
- Box 5 — the M/L ledger home is `planning-evidence.md`, compact, 23 rows, every
  engineering claim resolving to one.
- Box 6 — the six dev scenarios map to phases and validators (`testing.md`).
- Box 7 — every phase passes the 8-box phase-lint with its fingerprint recorded
  (stdout above).
- Box 8 — phase order follows the dependency closure; no later deliverable is
  built early; P5 is the hardening/close-out phase.
- Box 9 — deploy/rollback stated (standard revert, no migration); no unnamed
  public-contract change (schema package regression-only).
- Box 10 — no unresolved decision word; the risk list names an owner per risk.
- Box 11 — every evidence row is `current`; no unowned unknown.

Plan snapshot (built in this act, after the re-cut commit):

```text
53502b22… (pre-commit build) → 065459e621797ef57769e42d96d1bb25b9de99b804b8d26d0f5f17da77190cd6 (post-commit build)
sourceRevision / artifactRevisionId: aefdccc4de12b65883d1fe556317ab2107418158 (the re-cut commit)
parentSpecSnapshotDigest: e4b293e3f62f2ad543423b172fa4766c211604a7d77d6ea719700dd949aeb9a7
```

The planner's label is `32-plan-2`; no runtime rotates an id in this environment,
so the hand-off names the label and the snapshot binds the builder's canonical
commit-derived identity (the same reconciliation every prior receipt recorded). The
roadmap row was re-read after the write:

```text
node scripts/unit-route.mjs 32 → status: planned · open-rows: 0 · route: execute
git show HEAD:docs/features/ROADMAP.md row 32 → planned · `32-plan-2` (engineering half re-cut on branch)
```

Hand-off: `/review-plan 32-review-consistency-pack` — an independent context
judges this artifact revision.

**Parent-lineage note for the re-review (recorded, not hidden).** Committing the
re-cut touched `SPEC.md` (engineering half only), so `SPEC.md`'s **whole-file**
content revision moved to `aefdccc4` and a standalone
`verify --stage spec` now answers `stale-source-revision` for `SPEC-REVIEW-32-5`
(`changedPaths: [SPEC.md]`) even though nothing the Product half says changed: the
bound `spec-product-v1` projection is byte-identical (`675349ef…`, 48622 B) and
every context row is unmoved (`CLAUDE.md` `45af6d85…`,
`REPOSITORY_STATE.md` `e1b81e29…`, invariants absent). This is the recorded
comparator limitation of feature 30's `P30-3` disposition — a plan commit's
Engineering-half append rotates the SPEC.md content revision while the Product
projection is unchanged — and L1 is judged on the projection evidence, not by
auto-routing back to `review-spec`. The plan snapshot's
`parentSpecSnapshotDigest` is exactly `e4b293e3…`, the digest that receipt
recorded.

**Plan-stage verify at the re-cut head** (the reviewer's sensor, POLICY §8;
expected to answer `stale-source-revision` against the superseded
`PLAN-REVIEW-32-1` receipt, because a repair turn produces a new snapshot by
design — POLICY §4's repair-in-response carve-out):

```json
{
  "current": false,
  "stage": "plan",
  "unit": "32-review-consistency-pack",
  "receipt": {
    "id": "PLAN-REVIEW-32-1",
    "verdict": "plan-review-fail",
    "snapshot": "102238d5e10dd88444b947fed646915fe77daf7096c4c5f5322608aab4044c97",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "065459e621797ef57769e42d96d1bb25b9de99b804b8d26d0f5f17da77190cd6",
  "digestMatches": false,
  "verdictIsPass": false,
  "structural": {
    "fresh": false,
    "reasonCode": "stale-source-revision",
    "detail": "the artifacts were reviewed at e1c008bc039d2403855fd180da156a9472bc43e7, the bound bytes now sit at aefdccc4de12b65883d1fe556317ab2107418158",
    "changedPaths": [
      "docs/features/32-review-consistency-pack/PLAN.md",
      "docs/features/32-review-consistency-pack/SPEC.md",
      "docs/features/32-review-consistency-pack/TASKS.md",
      "docs/features/32-review-consistency-pack/architecture-notes.md",
      "docs/features/32-review-consistency-pack/decisions.md",
      "docs/features/32-review-consistency-pack/planning-evidence.md",
      "docs/features/32-review-consistency-pack/planning-obligations.md",
      "docs/features/32-review-consistency-pack/testing.md"
    ]
  }
}
```

(exit 4 — the superseded FAIL receipt is stale against the re-cut bytes; the
re-review mints its successor. The suites the plan qualifies against were re-run
at this head: `review-loop-discipline`, `ledger-ownership`,
`bounded-delivery-loops`, `audit-pr-receipt`, `workflow-status-sensor`,
`workflow-status-pre-execution` and `check-skill-context` all pass;
`normative-drift` stays 18/19 by design until P4 task 1 lands.)

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-32-2 · Snapshot: 065459e621797ef57769e42d96d1bb25b9de99b804b8d26d0f5f17da77190cd6 · Verdict: plan-review-fail
- Unit: 32-review-consistency-pack · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: e4b293e3f62f2ad543423b172fa4766c211604a7d77d6ea719700dd949aeb9a7 · Parent Product receipt: SPEC-REVIEW-32-5
- Source revision: aefdccc4de12b65883d1fe556317ab2107418158 · Artifact revision: aefdccc4de12b65883d1fe556317ab2107418158
- Reviewer: review-plan (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: plan-feature (2026-09-19 `32-plan-2`) / plan-feature-scaffold (2026-09-18 `32-plan-1`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-19T16:00Z/2026-09-19T16:28Z · Findings: 4 (material open: 2)
- Ledgers read: planning-evidence 23 rows · obligations 25 rows (verified-capable: 25)
- Prior plan receipt (re-review only): PLAN-REVIEW-32-1 @ 102238d5e10dd88444b947fed646915fe77daf7096c4c5f5322608aab4044c97
```

Notes:

- Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage plan --unit 32-review-consistency-pack --parent e4b293e3f62f2ad543423b172fa4766c211604a7d77d6ea719700dd949aeb9a7`; digest is stdout's first line (`065459e6…`), byte-identical to the planner's post-commit build. Bound artifacts: `SPEC.md` (whole-file 71648 B, `7e074bd0…`), `ACCEPTANCE.md` (6390 B, `6b8db637…`), `PLAN.md` (14438 B, `0faf5bde…`), `TASKS.md` (10826 B, `9bda6ab7…`), `planning-evidence.md` (15669 B, `a4d80211…`), `planning-obligations.md` (13208 B, `0eb97433…`), `testing.md` (4980 B, `7e4b2fe3…`), `decisions.md` (22510 B, `f1ca1a1d…`), `architecture-notes.md` (4291 B, `efb9710c…`). No `planning-evidence`/`obligations` row is `absent` (M unit froze both ledgers as files). `sourceRevision`/`artifactRevisionId` are the builder's content revision `aefdccc4` (the re-cut commit); HEAD is `28247b05`, which appended only the unbound `progress.md` repair record. No runtime rotates an id in this environment — the handoff label is `32-plan-2` and the snapshot binds the builder's canonical identity.
- **L1 holds on the Product projection, not on the standalone code.** `SPEC-REVIEW-32-5` (`spec-review-pass`, snapshot `e4b293e3…`) equals this plan's `parentSpecSnapshotDigest`. A standalone `bun scripts/pre-execution-snapshot.mjs verify --stage spec --unit 32-review-consistency-pack` answers `fresh: false / stale-source-revision`, `changedPaths: ["SPEC.md"]`, because the `32-plan-2` re-cut appended the Engineering half, rotating `SPEC.md`'s whole-file content revision — the recorded feature-30 `P30-3` comparator limitation (plan commit's Engineering-half append rotates the whole-file revision while the Product projection is unchanged). Independent recomputation of `selectSpecProduct(SPEC.md)` in this turn returns byteLength 48622 / digest `675349efa8655a55345aec1c7ac47163ceb2eb6cb0832f0eada53924713e68cc` — byte-identical to the Product bytes `SPEC-REVIEW-32-5` reviewed. All three context rows are unmoved (`CLAUDE.md` `45af6d85…`, `REPOSITORY_STATE.md` `e1b81e29…`, architectural-invariants absent). Parent state: **current**; no route to `review-spec`.
- Contexts emitted by the recipe owner at `aefdccc4`: `project-guide` (`CLAUDE.md`, present, `45af6d85…`), `normalized-repository-state` (`docs/workflow/REPOSITORY_STATE.md`, present, `e1b81e29…`), `architectural-invariants` (`docs/architecture/ARCHITECTURAL_INVARIANTS.md`, absent). Governing issue #172 and dependency rows 30/31 were read live; the builder's fixed context set carries no `governing-issue`/`dependency-unit` row (recorded here, not in the snapshot — same shape as SPEC-REVIEW-32-1…5).
- Repeat gate (POLICY §4): prior receipt `PLAN-REVIEW-32-1` @ `102238d5…` (FAIL, F13–F19). Snapshot changed (`102238d5…` → `065459e6…`) by the persisted repair batch, so no no-progress; this is cycle 1 of the new window, so no `CONVERGENCE-ANOMALY` is owed. Prior findings F13–F19 are all `resolved` with resolution evidence and `resolving-artifact-revision` `32-plan-2`; F20 (spec, `low`) stays open, non-material.
- Falsification pass (CHECKS.md §2), stance CONFIRMED-GAPS → 4 confirmed. Engineering claims checked: PE-001…PE-023 were re-read at `aefdccc4`; the `path:line` cites resolve for every row **except PE-011** (F-32P-01). Obligation sweep: all 25 rows carry phase/task/owner/validator/evidence and `status: planned`; O9's phase mapping is the one contradiction (F-32P-02). Validators checked: all phase done-when commands are the project's real gates and are runnable; AC-02's `skills/product-audit/` grep is not (F-32P-03) and AC-10's "the diff shows the append" cannot hold because feature 31 already added the entry (F-32P-04).
- Ledger sweep: L1 **pass** (above). L2 **finding** — PE-011 is marked `current`/`proven` but its `path:line` cites do not resolve (F-32P-01); all other 22 rows resolve. L3 **pass** — O1…O25 cover all eleven ACs, the three applicable workflow invariants, the grammar/mirror invariant, the integration closure, and the dev scenarios (five rows; `sweep:nrs-missing` is exercised by O9's missing-ledger case); no duplicate, no `deferred`. L4 **finding** — O9 names phase P1 and a task that includes "align the skill references", but the work is `PLAN.md`/`TASKS.md` P2 task 7 (and the plan's own PE-010 says "P2 aligns the two reference files"), and O9's validator (the sensor suite) cannot fail on that component (F-32P-02). L5 **finding** — AC-02's `grep -nE "postpone|tradeoff" skills/product-audit/` (ACCEPTANCE.md and O4) exits 2 on a directory without `-r` and can never answer "no match" (F-32P-03); AC-10's read-verified "the diff shows the append" is unsatisfiable because `README.md` already carries the entry under `## References` (F-32P-04). L6 **pass** — F1–F19 `resolved`, F20 `open`/`low`/`product` (non-material), no open material row.
- Engineering checks: P1 **pass** (`architecture-notes.md` names the surfaces with `path:line` rows; invariant class `preserves` for the three workflow rows, `n/a` for absent project invariants). P2 **pass** (rows 30 `done · #188` and 31 `done · #243` merged; `node scripts/unit-route.mjs 32` → `status: planned`, `open-rows: 0`). P3 **pass** (seven truth classes, one declaration per ledger pattern, router/provenance parsers untouched — PE-011/PE-021). P4 **n/a** (`no secrets/authn/PII surface — docs and a read-only sensor`). P5 **pass** (budget re-basis named; English-only interim AD-002/F011; `CHANGELOG.md` collision forward path named). P6 **pass** (per-phase commits + green gate; idempotent text edits). P7 **pass** (`## Deploy & rollback`: standard revert, no migration). P8 **pass** (sensor projects the notice; docs carry the rule). P9 **pass** (`bun scripts/phase-lint.mjs docs/features/32-review-consistency-pack/PLAN.md` → all five phases PASS (8/8), fingerprints `P1:config/infra:4:…`…`P5:hardening:9:hardening-pr`, verdict PASS, file fingerprint `bcc83a05…`). P10 **finding by construction** — the phase done-whens are the real gates and runnable, but AC-02's product-audit grep and AC-10's append clause are not (F-32P-03/F-32P-04). P11 **pass** (six dev scenarios each map to a phase and a validator; the failure categories are covered). P12 **finding** — PE-011's cites (F-32P-01). Reports-only; no F-checks (feature unit).
- Zero writes to any reviewed artifact: `SPEC.md`, `PLAN.md`, `TASKS.md`, `ACCEPTANCE.md`, `planning-evidence.md`, `planning-obligations.md`, `decisions.md`, `architecture-notes.md`, `testing.md` and the roadmap row carry the exact bytes the `32-plan-2` re-cut committed at `aefdccc4`. This turn authored only this receipt block (unbound `progress.md`) and the four finding rows (unbound `planning-findings.md`). No runtime rotates `artifactRevisionId` here, so the mutate-and-revert guarantee rests on the manual handoff — any later write to a bound artifact invalidates this receipt.

Self-check (`verify --stage plan`, POLICY §8), run in the same act as this write:

```json
{
  "current": false,
  "stage": "plan",
  "unit": "32-review-consistency-pack",
  "receipt": {
    "id": "PLAN-REVIEW-32-2",
    "verdict": "plan-review-fail",
    "snapshot": "065459e621797ef57769e42d96d1bb25b9de99b804b8d26d0f5f17da77190cd6",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "065459e621797ef57769e42d96d1bb25b9de99b804b8d26d0f5f17da77190cd6",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 4 — the write landed, `structural.fresh: true`, `digestMatches: true`; `current` is false because the verdict is FAIL, which is the expected emit result and routes per the verdict.)

## Plan repair batch `32-plan-3` — plan-feature authoring turn (2026-09-19)

Trigger: `PLAN-REVIEW-32-2` (`plan-review-fail`, snapshot `065459e6…`) findings
F21 + F22, one batch, per the FAIL receipt's emitted continuation
(`/plan-feature 32-review-consistency-pack "…" — one batch for F21 + F22`).
Both findings are `class: plan`, so the batch is the `review-plan` route table's
own repair path (`plan-feature` → new artifact revision → re-review); the
router's code-side line is unchanged (`node scripts/unit-route.mjs 32` →
`status: planned`, `open-rows: 0`, `route: execute` — this unit's findings live
in `planning-findings.md`, which the router does not read, per the recorded
`32-plan-2` router note).

**What changed** (one batch; F21/F22 rows in `planning-findings.md` are
`resolved` with resolution evidence and `resolving-artifact-revision`
`32-plan-3`):

- **F21** — `planning-evidence.md` row PE-011's `ledger-ownership.test.mjs`
  cites are re-based at the bound source revision `aefdccc4`: `:56-57` (the
  `FEATURE_TEMPLATE_REL`/`FIX_TEMPLATE_REL` projection paths), `:66-74`
  (`TRUTH_CLASSES`), `:158-163` (one row per class), `:173` (the
  unique-ledger-per-row check), `:202-204` (the owner-cell equality check).
  Every location was re-read before the row was rewritten; the claim,
  `freshness: current` and `status: proven` now stand on cited lines that
  resolve.
- **F22** — the IS-5(a) prose half lands at P2 everywhere:
  `planning-obligations.md` O9 moves from P1 to **P2** — its task now names the
  split (the sensor half lands in P1's tasks; the reference alignment is
  `PLAN.md`/`TASKS.md` P2 task 7), its validator gains the
  `review-loop-discipline` IS-5(a)-text pin so the reference-alignment component
  is falsifiable when the obligation resolves, and its required evidence moves
  to the P2 handoff. `SPEC.md`'s P1 phase bullet drops "the workflow-status
  references state the same split" and the P2 bullet now names the
  workflow-status reference alignment (IS-5(a) text). `PLAN.md`'s
  artifact-revision paragraph is re-cut to `32-plan-3` (history preserved).
  No `PLAN.md`/`TASKS.md` task moved: the finding itself recorded that P2 task 7
  already owned the alignment, and P1's four tasks are untouched, so both
  phase-lint fingerprints are unchanged.

**Product-half safety.** The SPEC.md edit is inside the `## Engineering half`
(§ Phases), outside the `spec-product-v1` projection. Recomputed projection at
the batch head: digest `675349efa8655a55345aec1c7ac47163ceb2eb6cb0832f0eada53924713e68cc`
— byte-identical to the bytes `SPEC-REVIEW-32-5` reviewed, so the parent Product
receipt stays current on the projection evidence (the recorded feature-30
`P30-3` comparator limitation; the whole-file content revision moved, which is
why a standalone `verify --stage spec` answers `stale-source-revision` for
`SPEC.md` only).

**Open findings after the batch**: F20 (spec, low, report-note — Product-half
citation re-base, owner `design-feature`), F23 (product, low, report-note —
AC-02's directory grep), F24 (product, low, report-note — AC-10's append
clause). All three are non-material; none was touched by this batch (they are
not F21/F22 and were never claimed).

**Deliberately recorded, not fixed here.** `node --test
scripts/check-skill-context.test.mjs` fails at this head (assertion at
`:121` — `--routes --json` exits 1) because four *route* budgets are over their
declared ceilings (`plan-feature:scaffold`, `plan-fix:issue`,
`review-plan:default`, `review-spec:default`). Verified pre-existing: the same
test fails identically at the batch's parent commit `45f70b09`. The
`check-skill-context.mjs` manifest gate itself passes (`PASS context budgets:
40 skills`; `PASS context manifest: 40 discovered skills; 11 explicit
overrides; reference depth 1`). The route-ceiling drift predates this unit's
plan and touches no surface this batch edits; it is reported for its owner
(the budget manifest's route section) and is not folded into this batch.

Phase-lint (verbatim stdout of `bun scripts/phase-lint.mjs docs/features/32-review-consistency-pack/PLAN.md`):

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:config/infra:4:nrs-missing-ledger-notice
P2 Phase-lint: PASS (8/8) · fingerprint P2:docs:8:contract-prose-alignment
P3 Phase-lint: PASS (8/8) · fingerprint P3:docs:8:classification-single-owner-contract
P4 Phase-lint: PASS (8/8) · fingerprint P4:docs:7:gate-run-receipt
P5 Phase-lint: PASS (8/8) · fingerprint P5:hardening:9:hardening-pr
verdict PASS
fingerprint: bcc83a051816c2a893161c819f301ed0b27b9a7b6021ccbc1d9382f91fe29382
```

Readiness preflight (`evidence-grounding/references/READINESS.md`, `stage: plan`,
boxes 1–11 re-run on the batch bytes):

```text
READINESS — 32-review-consistency-pack plan READY-FOR-REVIEW
- Artifact revision: 32-plan-3 · Rows checked: 23 evidence / 25 obligations · Unknowns open: 0
- Evidence: planning-evidence.md · Frozen: 2026-09-18 (ACCEPTANCE.md blob ce71193384cbf0cb7f4adb490456f309da8fc2e5)
```

- Box 1 — `SPEC-REVIEW-32-5` (`spec-review-pass`, `e4b293e3…`) is the current
  Product receipt; the projection is byte-identical at this head (above).
- Box 2 — `ACCEPTANCE.md` untouched, blob recomputed `ce711933…` (unchanged).
- Box 4 — 25 obligation rows (O9 re-pointed to P2; counts unchanged), each with
  phase, task, owner, validator, required evidence and a non-blank `planned`
  status; no `deferred` row.
- Box 5 — 23 evidence rows, every engineering claim resolving to one; PE-011's
  provenance now cites lines that resolve at the bound revision (F21 closed).
- Box 7 — every phase passes the 8-box phase-lint with its fingerprint recorded
  (stdout above); the `config/infra` phase still carries no `skills/` first
  target (F22's layer note is satisfied by O9's move).
- Boxes 3, 6, 8, 9, 10, 11 — unchanged by this batch (surfaces, dev scenarios,
  phase order, rollback, risks, unknowns all as re-cut at `32-plan-2`).

Plan snapshot (built in this act, after the batch commit):

```text
digest: a29feeca517bfad3dea51e08751c4931b3f2738739cbcd56e5eb90d4af0f797c
sourceRevision / artifactRevisionId: 55bf6b80f127aa3c824551cd5a97f03c438f12b5 (the batch commit)
parentSpecSnapshotDigest: e4b293e3f62f2ad543423b172fa4766c211604a7d77d6ea719700dd949aeb9a7
```

The planner's label is `32-plan-3`; no runtime rotates an id in this
environment, so the hand-off names the label and the snapshot binds the
builder's canonical commit-derived identity (the reconciliation every prior
receipt recorded). The roadmap row was re-read after the write:

```text
node scripts/unit-route.mjs 32 → status: planned · open-rows: 0 · route: execute
```

Qualification suites re-run at the batch head: `review-loop-discipline`,
`ledger-ownership`, `bounded-delivery-loops`, `audit-pr-receipt`,
`workflow-status-sensor`, `workflow-status-pre-execution` all pass;
`normative-drift` stays 18/19 by design until P4 task 1 lands;
`check-skill-context` manifest gate passes (its route-budget test failure is
pre-existing, recorded above).

Plan-stage verify at the batch head (the reviewer's sensor, POLICY §8; expected
to answer `stale-source-revision` against the superseded `PLAN-REVIEW-32-2`
receipt — a repair turn produces a new snapshot by design, POLICY §4's
repair-in-response carve-out):

```json
{
  "current": false,
  "stage": "plan",
  "unit": "32-review-consistency-pack",
  "receipt": {
    "id": "PLAN-REVIEW-32-2",
    "verdict": "plan-review-fail",
    "snapshot": "065459e621797ef57769e42d96d1bb25b9de99b804b8d26d0f5f17da77190cd6",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "a29feeca517bfad3dea51e08751c4931b3f2738739cbcd56e5eb90d4af0f797c",
  "digestMatches": false,
  "verdictIsPass": false,
  "structural": {
    "fresh": false,
    "reasonCode": "stale-source-revision",
    "detail": "the artifacts were reviewed at aefdccc4de12b65883d1fe556317ab2107418158, the bound bytes now sit at 55bf6b80f127aa3c824551cd5a97f03c438f12b5",
    "changedPaths": [
      "docs/features/32-review-consistency-pack/PLAN.md",
      "docs/features/32-review-consistency-pack/SPEC.md",
      "docs/features/32-review-consistency-pack/planning-evidence.md",
      "docs/features/32-review-consistency-pack/planning-obligations.md"
    ]
  }
}
```

(exit 4 — the superseded FAIL receipt is stale against the batch bytes; the
re-review mints its successor.)

Hand-off: `/review-plan 32-review-consistency-pack` — an independent context
judges the `32-plan-3` artifact revision (prior receipt `PLAN-REVIEW-32-2`,
FAIL, F21–F22 resolved with evidence; F20/F23/F24 remain open, non-material).

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-32-3 · Snapshot: a29feeca517bfad3dea51e08751c4931b3f2738739cbcd56e5eb90d4af0f797c · Verdict: plan-review-pass
- Unit: 32-review-consistency-pack · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: e4b293e3f62f2ad543423b172fa4766c211604a7d77d6ea719700dd949aeb9a7 · Parent Product receipt: SPEC-REVIEW-32-5
- Source revision: 55bf6b80f127aa3c824551cd5a97f03c438f12b5 · Artifact revision: 55bf6b80f127aa3c824551cd5a97f03c438f12b5
- Reviewer: review-plan (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: plan-feature (`32-plan-3` / `32-plan-2`) / plan-feature-scaffold (`32-plan-1`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-19T20:15Z/2026-09-19T20:34Z · Findings: 4 (material open: 0)
- Ledgers read: planning-evidence 23 rows · obligations 25 rows (verified-capable: 25)
- Prior plan receipt (re-review only): PLAN-REVIEW-32-2 @ 065459e621797ef57769e42d96d1bb25b9de99b804b8d26d0f5f17da77190cd6
```

Notes:

- Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage plan --unit 32-review-consistency-pack --parent e4b293e3f62f2ad543423b172fa4766c211604a7d77d6ea719700dd949aeb9a7`; digest is stdout's first line (`a29feeca…`), byte-identical to the planner's post-commit build. Bound artifacts: `SPEC.md` (whole-file 71672 B, `18639ccd…`), `ACCEPTANCE.md` (6390 B, `6b8db637…`), `PLAN.md` (14835 B, `80c9aee0…`), `TASKS.md` (10826 B, `9bda6ab7…`), `planning-evidence.md` (15698 B, `c9c467fa…`), `planning-obligations.md` (13444 B, `14003e0f…`), `testing.md` (4980 B, `7e4b2fe3…`), `decisions.md` (22510 B, `f1ca1a1d…`), `architecture-notes.md` (4291 B, `efb9710c…`). No `planning-evidence`/`obligations` row is `absent` (M unit froze both ledgers as files). `sourceRevision`/`artifactRevisionId` are the builder's content revision `55bf6b80` (the `32-plan-3` batch commit); HEAD is `fd9f7913`, which touched only the unbound roadmap row. No runtime rotates an id in this environment — the handoff label is `32-plan-3` and the snapshot binds the builder's canonical identity.
- **L1 holds on the Product projection (the recorded P30-3 comparator limitation).** `SPEC-REVIEW-32-5` (`spec-review-pass`, snapshot `e4b293e3…`) equals this plan's `parentSpecSnapshotDigest`. A standalone `bun scripts/pre-execution-snapshot.mjs verify --stage spec --unit 32-review-consistency-pack` answers `fresh: false / stale-source-revision`, `changedPaths: ["SPEC.md"]`, because the plan's Engineering-half writes rotated `SPEC.md`'s whole-file content revision. Independent recomputation at the current bytes with the receipt's own revisions (`build --stage spec --source-revision e1c008bc… --artifact-revision e1c008bc…`) reproduces `e4b293e3…` exactly, with the `spec-product-v1` row at 48622 B / digest `675349ef…` — byte-identical to the Product bytes `SPEC-REVIEW-32-5` reviewed — and all three context rows unmoved (`project-guide` `CLAUDE.md` `45af6d85…`, `normalized-repository-state` `REPOSITORY_STATE.md` `e1b81e29…`, `architectural-invariants` absent). Per feature 30's resolved `P30-3`, this code is a whole-file-digest comparator limitation, not a lineage defect; parent state **current**.
- Contexts emitted by the recipe owner at `55bf6b80`: `project-guide` (`CLAUDE.md`, present, `45af6d85…`), `normalized-repository-state` (`docs/workflow/REPOSITORY_STATE.md`, present, `e1b81e29…`), `architectural-invariants` (`docs/architecture/ARCHITECTURAL_INVARIANTS.md`, absent). Governing issue #172 and dependency rows 30/31 were read live; the builder's fixed context set carries no `governing-issue`/`dependency-unit` row (recorded here, not in the snapshot — same shape as SPEC-REVIEW-32-1…5).
- **Repeat gate (POLICY §4).** Prior receipt `PLAN-REVIEW-32-2` @ `065459e6…` (FAIL, F21–F22). Snapshot changed (`065459e6…` → `a29feeca…`) by the persisted `32-plan-3` repair batch, so no no-progress. `PLAN-REVIEW-32-2` was cycle 1 of the window `SPEC-REVIEW-32-5` opened; this review is **cycle 2**, so the window's `CONVERGENCE-ANOMALY` block is printed below (on entry; it grants no PASS and is not a stop). Prior findings F21/F22 are `resolved` with resolution evidence and `resolving-artifact-revision` `32-plan-3`; F20 (spec, `low`), F23 (plan, `low`), F24 (plan, `low`) remain open report-notes, non-material.
- Falsification pass (CHECKS.md §2), stance CONFIRMED-GAPS → 1 low only. Engineering claims checked: PE-001…PE-023 were re-read at `55bf6b80`; **every** `path:line` cite resolves, including PE-011's re-based cites (`scripts/ledger-ownership.test.mjs:56-57`, `:66-74`, `:158-163`, `:173`, `:202-204`), which is F21's repair. Obligation sweep: all 25 rows carry phase/task/owner/validator/evidence and `status: planned`; O9 now names P2 with both halves falsifiable (the sensor suite plus the IS-5(a)-text pin), which is F22's repair. Validators: every phase done-when is a real, runnable project gate. The one new row is F25 (`low`, `plan`, report-note): the SPEC Engineering half's present-tense identity claim (`SPEC.md:654`) still reads `32-plan-2` while `PLAN.md:16` and roadmap row 32 read `32-plan-3` (plus the closing inventory at `SPEC.md:1023-1024` still listing ED-32-1…ED-32-6 while `decisions.md` carries ED-32-7…ED-32-9) — a documentation label with no bound byte or gate behind it.
- Ledger sweep: L1 **pass** (above). L2 **pass** — all 23 `planning-evidence.md` rows are `current`/`proven`, every cite re-read at `55bf6b80`; no `drifted`/`stale` row survives. L3 **pass** — O1…O25 cover all eleven ACs (15 rows), the three applicable workflow invariants, the grammar/mirror invariant, the integration closure, and the six dev-scenario pins (five rows plus O9's missing-ledger case); no duplicate, no `deferred`, ids stable. L4 **pass** — every row names one phase, one task, an `implementation-owner`, a validator copied from `ACCEPTANCE.md`/the phase done-when, and required evidence; no blank status; O9 is P2 (the phase where both halves are provable). L5 **pass** — each SPEC failure category maps to a scenario, each scenario to the phase/validator that exercises it, and the phase-and-pin validators can fail; F23 (AC-02's directory `grep`) and F24 (AC-10's "the diff shows the append") stay open `low` Product-side report-notes whose substance is covered by the discipline pins. L6 **pass** — F1–F19 and F21–F22 `resolved` with evidence, F20/F23/F24 open `low` (non-material), F25 added `low`; no open material row.
- Engineering checks: P1 **pass** (`architecture-notes.md` names the affected surfaces; invariant class `preserves` for the three workflow rows, `n/a` for absent project invariants — NRS F010). P2 **pass** (rows 30 `done · #188` and 31 `done · #243` merged; `node scripts/unit-route.mjs 32` → `status: planned`, `open-rows: 0`). P3 **pass** (no schema/package/public API change; the map keeps exactly seven truth classes, one declaration per ledger pattern; router/provenance parsers untouched — PE-011/PE-021). P4 **n/a** (`no secrets/authn/PII surface — docs and a read-only sensor`). P5 **pass** (`CHANGELOG.md` collision forward path named in ED-32-8/P4 task 1; budget re-basis named; English-only interim AD-002/F011). P6 **pass** (per-phase commits + green gate; idempotent text edits; `progress.md` receipts). P7 **pass** (`## Deploy & rollback`: standard revert, no migration, no data side). P8 **pass** (sensor projects the notice; docs carry the rule). P9 **pass** (`bun scripts/phase-lint.mjs docs/features/32-review-consistency-pack/PLAN.md` → all five phases PASS (8/8), fingerprints `P1:config/infra:4:…`…`P5:hardening:9:hardening-pr`, verdict PASS, file fingerprint `bcc83a05…`). P10 **pass** (every phase done-when is the project's real gate and runnable; the red-at-head drift gate is resolved by P4 task 1, not exempted; no validator weakened or re-scoped to reach a phase). P11 **pass** (six dev scenarios each map to a phase and a validator; `sweep:nrs-missing` via O9). P12 **pass** (every cited `path:line` resolves at `55bf6b80`; the gate suites `review-loop-discipline`, `ledger-ownership`, `bounded-delivery-loops`, `audit-pr-receipt`, `workflow-status-sensor`, `workflow-status-pre-execution` all pass at this revision — 119 pass / 0 fail). Reports-only; no F-checks (feature unit).
- Recorded, not a finding: `node --test scripts/check-skill-context.test.mjs` fails at this head on four pre-existing **route**-ceiling drifts (`plan-feature:scaffold`, `plan-fix:issue`, `review-plan:default`, `review-spec:default`); the manifest gate `node scripts/check-skill-context.mjs` (AC-09's validator) passes with exit 0, and the drift predates this plan and touches no surface it edits. The `32-plan-3` batch already recorded it for its owner.
- Zero writes to any reviewed artifact: `SPEC.md`, `PLAN.md`, `TASKS.md`, `ACCEPTANCE.md`, `planning-evidence.md`, `planning-obligations.md`, `decisions.md`, `architecture-notes.md`, `testing.md` and the roadmap row carry the exact bytes the `32-plan-3` batch committed at `55bf6b80`. This turn authored only this receipt block (unbound `progress.md`) and one finding row (unbound `planning-findings.md`). No runtime rotates `artifactRevisionId` here, so the mutate-and-revert guarantee rests on the manual handoff — any later write to a bound artifact invalidates this receipt.

```json
{
  "current": true,
  "stage": "plan",
  "unit": "32-review-consistency-pack",
  "receipt": {
    "id": "PLAN-REVIEW-32-3",
    "verdict": "plan-review-pass",
    "snapshot": "a29feeca517bfad3dea51e08751c4931b3f2738739cbcd56e5eb90d4af0f797c",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "a29feeca517bfad3dea51e08751c4931b3f2738739cbcd56e5eb90d4af0f797c",
  "digestMatches": true,
  "verdictIsPass": true,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

CONVERGENCE-ANOMALY (POLICY §4) — entry to the plan stage's second review of the window `SPEC-REVIEW-32-5` opened (cycle 1 = `PLAN-REVIEW-32-2`, FAIL). Reported on entry; grants no PASS and is not a stop:

```text
CONVERGENCE-ANOMALY — 32-review-consistency-pack plan
- Finding ids: F21 (repeats F16's stale-`path:line` class) + F20 (Product-side citation drift, open since PLAN-REVIEW-32-1) / new: F25 (low)
- Snapshots: 065459e621797ef57769e42d96d1bb25b9de99b804b8d26d0f5f17da77190cd6 → a29feeca517bfad3dea51e08751c4931b3f2738739cbcd56e5eb90d4af0f797c (artifactRevisionId 32-plan-2/aefdccc4 → 32-plan-3/55bf6b80)
- Missed: PE-011's `ledger-ownership.test.mjs` cites were not re-based by the 32-plan-2 batch though F16 required every shifted cite re-based; `planning-obligations.md` O9 mapped the IS-5(a) prose half to P1 though PLAN/TASKS P2 task 7 owns it
- Owning stage: plan
- Why the prior review failed: PLAN-REVIEW-32-2 returned FAIL on F21 (stale evidence cites) + F22 (O9 phase contradiction); the 32-plan-3 batch repaired both with evidence
- Route to owner: none required for the verdict — F21/F22 resolved at 32-plan-3 and this cycle converges (PASS); F20/F23/F24 (low, Product/plan report-notes) plus F25 (low) are re-based by the stage author without a re-review (LEDGERS.md §3)
```

## Unit-loop receipt — P1
- Commit: pending · Gate: node --test scripts/workflow-status-sensor.test.mjs scripts/workflow-status-pre-execution.test.mjs (exit 0) · Acceptance blob: ce71193384cbf0cb7f4adb490456f309da8fc2e5
- Next: P2 · Attempts: 1
- Tasks: NRS_BLOCKING de-deduplicated "missing"; substrate_notice added to detail; resolveNext routes missing to alternatives; 5 new sensor tests (1 missing-ledger + 3 regressions + 1 review-loop-cycle projection)

## Unit-loop receipt — P2
- Commit: pending · Gate: node --test scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs (exit 0) · Acceptance blob: ce71193384cbf0cb7f4adb490456f309da8fc2e5
- Next: P4 · P2 complete · Attempts: 1
- Tasks: 7 prose corrections (fold-flip provenance, triage-issue modes, roadmap verify-vs-write, NRS sensor split) + discipline pins (IS-1/5a/5b/5c) in review-loop-discipline and ledger-ownership suites

## Unit-loop receipt — P3
- Commit: pending · Gate: node --test scripts/review-loop-discipline.test.mjs scripts/audit-pr-receipt.test.mjs (exit 0) · Acceptance blob: ce71193384cbf0cb7f4adb490456f309da8fc2e5
- Next: P4 · Attempts: 1
- Tasks: canonical severity conversion table (CLASSIFY.md), derived blocking gate (CLASSIFY.md), report-note owner citation (LEDGERS.md), audit-docs fix (14 checks, no MEDIUM), product-audit vocabulary (closed class set), PERSIST_AND_DECIDE.md finder-scale pointer, audit-pr scale alignment (pass/blocker/n-a), all pinned in review-loop-discipline and audit-pr-receipt suites
