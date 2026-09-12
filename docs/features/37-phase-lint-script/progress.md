# Progress — 37-phase-lint-script

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: SPEC-REVIEW-37-1 · Snapshot: 8f736cc97ff87fa83e7581e1faeabbdb52fdc6ab3e9f73bc6e1cefcb3be9c0a0 · Verdict: spec-review-pass
- Unit: 37-phase-lint-script · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 054805145e485e4f5161b3d6dd7392c1fb466b93 · Artifact revision: 054805145e485e4f5161b3d6dd7392c1fb466b93
- Reviewer: review-spec (independent session) · Session: review-spec-37-2026-09-09 · Role: reviewer · Author: design-feature
- Author exclusion: enforced · Context clean: true
- Model diversity: same-model · Policy: pre-execution-review@current
- Started/finished: 2026-09-09 (UTC not recorded by runtime) / 2026-09-09 · Findings: 1 (material open: 0)
```

Notes:
- Snapshot built via `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 37-phase-lint-script`; digest is stdout's first line. `artifactRevisionId` was assigned by the builder (equal to `sourceRevision`); decisions.md records the author's handoff revision label as `37-spec-1` — the digest above binds the exact bytes reviewed.
- Contexts: normalized-repository-state and project-guide present; governing-issue consulted in-repo (issue #184, open); architectural-invariants absent; dependency-unit absent (n/a — roadmap shows no dependency for row 37).
- All 14 Product checks resolved: 14 pass, 0 findings, 0 n/a. One info-severity note recorded in `planning-findings.md` (F1 — AC-mapping redundancy on in-scope bullet 7; AC10 covers the vehicle rule). No open or unverified material rows.
- Falsification pass run per CHECKS.md §2: stance CONFIRMED-GAPS → verified that PD1–PD4 are interview-recorded in decisions.md (dated, user-approved), PD5 traced to roadmap row 43 + issue #196; token-savings business goal is not AC-measured (business goal, not an in-scope item outcome); role matrix explicitly n/a with recorded reason; repository spot-checks confirmed phase-contract v1.0.1 exists and owns the eight grammar-checkable rules, and the three consumer skills exist as claimed.
- No reviewed artifact was modified. `artifactRevisionId` rotation depends on manual handoff — no runtime rotation occurred; any later write to SPEC.md invalidates this receipt.
- Self-check `verify --stage spec` pending run beside verdict block in chat (write-then-report: receipt written before report).

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-37-1 · Snapshot: 800b79d3caaf5c1f3320d1fd1d04c1584a6c22cd3e9a0d67a901045a8861d2fb · Verdict: plan-review-fail
- Unit: 37-phase-lint-script · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 8f736cc97ff87fa83e7581e1faeabbdb52fdc6ab3e9f73bc6e1cefcb3be9c0a0 · Parent Product receipt: SPEC-REVIEW-37-1
- Source revision: 28353158ce8dfa6d06a4543563c8b452b1777c1a · Artifact revision: 28353158ce8dfa6d06a4543563c8b452b1777c1a
- Reviewer: review-plan (independent session) · Session: review-plan-37-2026-09-09 · Role: reviewer · Author: plan-feature-scaffold
- Author exclusion: enforced · Context clean: true
- Model diversity: same-model · Policy: v1
- Started/finished: 2026-09-09 (UTC not recorded by runtime) / 2026-09-10 · Findings: 3 (material open: 2)
- Ledgers read: planning-evidence 9 rows · obligations 12 rows (verified-capable: 1)
- Prior plan receipt (re-review only): none — first cycle
```

Notes:
- Parent snapshot re-derived with `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 37-phase-lint-script` → first line equals the parent receipt's `8f736cc9…` (Product bytes unmoved since SPEC-REVIEW-37-1).
- Plan snapshot built with `--parent 8f736cc9…` over `--stage plan --unit 37-phase-lint-script`; digest `800b79d3…` binds SPEC, ACCEPTANCE, planning-evidence, planning-obligations, PLAN, TASKS, testing, decisions, architecture-notes at whole-file scope. Feature unit kind read from roadmap row 37 (`planned`, feature), never inferred from files. Snapshot rebuilt after the planning set was committed on `feat/37-phase-lint-script` (untracked bound bytes read as moved by the verifier; the digest re-binds at commit `28353158…`).
- Falsification stance before checking: CONFIRMED-GAPS → confirmed (F2 fingerprint/task-count drift; F3 box-1 heuristic vs template's `Hardening & PR`); F4 (PE-007 status wording) verified against the working tree.
- L1–L6 swept: ledgers clean (O1–O10 `planned` with validators copied from ACCEPTANCE; O11 `verified`; O12 owned) except PE-007 status-wording drift (L2/P12, F4). No `unknown`, `drifted`, or deferred row survives. No duplicate or missing obligation; scenario↔validator↔phase closure holds (L5) — the two material findings are plan defects, not ledger gaps.
- Zero writes to any reviewed artifact: only progress.md (receipt) and planning-findings.md (F2–F4) were appended.
- No prior plan receipt exists; this is cycle 1. Planning artifacts are uncommitted on `main` (planner scaffold state); no commit made by this review — reviewer wrote evidence only.

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-37-2 · Snapshot: c55328a451c065c3f0381ac8ed55eee54704561caa59e9b0f4c3b9fbf1140780 · Verdict: plan-review-fail
- Unit: 37-phase-lint-script · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 8f736cc97ff87fa83e7581e1faeabbdb52fdc6ab3e9f73bc6e1cefcb3be9c0a0 · Parent Product receipt: SPEC-REVIEW-37-1
- Source revision: 0e39cbe23160503212efe1f30a808d32131880d5 · Artifact revision: 0e39cbe23160503212efe1f30a808d32131880d5
- Reviewer: review-plan (independent session) · Session: review-plan-37-cycle2-2026-09-10 · Role: reviewer · Author: plan-feature-scaffold
- Author exclusion: enforced · Context clean: true
- Model diversity: same-model · Policy: v1
- Started/finished: 2026-09-10 / 2026-09-10 · Findings: 3 (material open: 3)
- Ledgers read: planning-evidence 9 rows · obligations 12 rows (verified-capable: 1)
- Prior plan receipt (re-review only): PLAN-REVIEW-37-1 @ 800b79d3caaf5c1f3320d1fd1d04c1584a6c22cd3e9a0d67a901045a8861d2fb
```

Notes:
- Cycle 2 of the plan loop: cycle 1 (PLAN-REVIEW-37-1, verdict fail) → user-directed replan (ED5, folds F2+F3+F4, revision `37-plan-2`) → this review. No-progress gate satisfied by a changed snapshot (`800b79d3…` → `c55328a4…`); falsification stance CONFIRMED-GAPS, run per CHECKS.md §2.
- Fold verification at `37-plan-2`: F2 verified — SPEC §Phase-lint, PLAN §P4, and TASKS.md P4 all state 8 tasks and fingerprint `P4:hardening:8:hardening-pr`. F4 verified — PE-007 now reads roadmap row 37 `planned`, matching the working tree. F3 verified as written but recurred materially as F5 (the box-1 exemption is not authorized by the sole rule owner).
- Parent lineage: the Product half is byte-identical between the parent receipt's revision (05480514) and this review (product-half diff empty; builder `changedPaths: []`). Re-deriving the `stage: spec` snapshot at the parent receipt's recorded source revision (`--source-revision 05480514…`) reproduces `8f736cc9…` exactly; the naive default rebuild prints `74349f31…` only because RS3(b) `contentRevision` rotates to the fold commit `0e39cbe…` (an engineering-half edit that touched `SPEC.md`). The parent receipt's `Policy: pre-execution-review@current` string reads stale against current policy `v1` — a formatting-era artifact, not a byte or context move.
- Snapshot bound with `--parent 8f736cc9…`; digest is stdout's first line; `artifactRevisionId` defaults to `contentRevision` (0e39cbe…) with the planner's handoff label `37-plan-2` recorded above.
- Falsification confirmed F5 (box-1 owner contradiction — invented rule semantics), plus two non-owner defects: AC8's third grep target is a directory without `-r` (F6) and the `lint:threshold` scenario has no owning task (F7).
- Zero writes to any reviewed artifact: only progress.md (this receipt) and planning-findings.md (F5–F7) were appended.
- Self-check `verify --stage plan --parent 8f736cc9…` pasted beside the verdict block in chat (write-then-report: receipt written before report).
- Receipt write fixed once before reporting: the `Artifact revision:` field first carried the planner's handoff label `37-plan-2`; the verifier refused it (`stale-artifact-revision`, no bound byte moved) because the builder's canonical revision is the digest-derived `0e39cbe…` — the handoff label stays recorded in the notes above, the receipt field binds the digest-derivable value.

## Replan 3 — F5 resolution fold (2026-09-10)

User decision (owner, approved in session): F5 resolved via option 1 — the `Hardening & PR`
box-1 exception is sanctioned in the rule owner and the amendment lands inside this PR.

Folds applied (revision `37-plan-3`):
- F5: new P1 amends `skills/phase-contract/SKILL.md` rule 1 (v1.0.1 → 1.0.2) + re-bundle;
  SPEC §Design box-1 kept verbatim to the amended owner; ED6 recorded in decisions.md,
  superseding ED5's separate-triage proposal. Plan re-cut to 5 phases (P1 amend rule owner →
  P2 linter → P3 crate → P4 consumer slims → P5 Hardening & PR) with fingerprints recomputed.
- F6: AC8/O8 third grep target corrected to `skills/execute-phase/SKILL.md`.
- F7: 9-task threshold fixture added to the linter corpus (owns `lint:threshold` dev scenario).
- AC8 and O12 re-scoped: phase-contract is amended in this PR (P1) and not re-edited by other phases.

Note: SPEC product-half engineering-section edits (AC8) mean the SPEC-REVIEW-37-1 receipt
snapshot no longer binds the current SPEC bytes; a fresh review cycle is required.

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-37-3 · Snapshot: 27565d4a0867a2a3ddb025f82a983edafd65c280a4f1737c40feb2c133ce6c50 · Verdict: plan-review-fail
- Unit: 37-phase-lint-script · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 8f736cc97ff87fa83e7581e1faeabbdb52fdc6ab3e9f73bc6e1cefcb3be9c0a0 · Parent Product receipt: SPEC-REVIEW-37-1
- Source revision: 81a2166aff3cdab4f3e8c0bde9388f145166c816 · Artifact revision: 81a2166aff3cdab4f3e8c0bde9388f145166c816
- Reviewer: review-plan (independent session) · Session: review-plan-37-cycle3-2026-09-10 · Role: reviewer · Author: plan-feature-scaffold
- Author exclusion: enforced · Context clean: true
- Model diversity: same-model · Policy: v1
- Started/finished: 2026-09-10 / 2026-09-10 · Findings: 4 (material open: 4)
- Ledgers read: planning-evidence 9 rows · obligations 12 rows (verified-capable: 1)
- Prior plan receipt (re-review only): PLAN-REVIEW-37-2 @ c55328a451c065c3f0381ac8ed55eee54704561caa59e9b0f4c3b9fbf1140780
```

Notes:
- Cycle 3 of the plan loop. No-progress gate satisfied: snapshot changed 800b79d3… → c55328a4… → 27565d4a… (the `37-plan-3` fold + the PE sync commit `81a2166a` re-cut phase labels and PE-001's owner revision).
- Parent lineage re-proven against current bytes instead of assumed: the Product projection (`selectSpecProduct`, digest `a365fa7b…`, 20345 bytes) is byte-identical at the first committed revision (`28353158`) and at HEAD, and no bound context file moved since the spec review (CLAUDE.md and REPOSITORY_STATE.md unchanged; architectural-invariants absent on both sides). Reproducing the parent receipt's exact identity required BOTH `--source-revision 05480514…` AND `--artifact-revision 05480514…` — the `--source-revision` flag alone does not pin `artifactRevisionId`, which defaults to the newest commit touching the bound paths (cycle 2's notes under-describe this). L1 holds.
- Falsification stance before checking: CONFIRMED-GAPS → confirmed F8 (PE-008's resolution claim contradicted by the frozen product bytes it cites), F9 (version bumps with no CHANGELOG/`bump-skill` step vs the plan's own normative-drift version-tables gate), F10 (P1 fingerprint `:2:` vs 3 tasks — F2's drift class recurring on a new phase), F11 (frozen box-2 heuristic scans "referenced file paths" where the rule owner's rule 2 says "target file" — P4's own task text embeds config/infra script paths in a docs phase, so the recorded P4 PASS is unprovable under the frozen grammar).
- Ledger sweep L1–L6: L3/L4/L5 hold (O1–O10 planned with validators copied from ACCEPTANCE, O11 verified, O12 owned; F7's threshold-fixture gap was genuinely closed in P2's corpus task). L2 fails on PE-008 only (F8). P-checks: P1–P4, P6–P8, P11, P12 pass; P5, P9, P10 carry findings; no n/a rows.
- CONVERGENCE-ANOMALY applies to the next repair cycle: the recurring family across cycles 1–3 is plan-self-conformance (F2 → F10/F11) — each replan hand-patches the reported row instead of re-deriving fingerprints/grammar mechanically over the re-cut plan. The next batch must state its convergence argument (mechanical fingerprint + grammar re-derivation before hand-off) or the owner should re-scope before a fourth cycle.
- Zero writes to any reviewed artifact: only progress.md (this receipt) and planning-findings.md (F8–F11) were appended; the reviewer made no commit (the author's fold commit carries them, as in cycles 1–2).
- Self-check `verify --stage plan --parent 8f736cc9…` pasted beside the verdict block in chat (write-then-report: receipt written before report).

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-37-4 · Snapshot: 81aefd1c05f762ff85e05c9eb2069c73a491e710bb7d77d84a2a820c29dcd689 · Verdict: plan-review-fail
- Unit: 37-phase-lint-script · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 8f736cc97ff87fa83e7581e1faeabbdb52fdc6ab3e9f73bc6e1cefcb3be9c0a0 · Parent Product receipt: SPEC-REVIEW-37-1
- Source revision: dd68f05075a88abbd0deb3f4f055278f161cf8b2 · Artifact revision: dd68f05075a88abbd0deb3f4f055278f161cf8b2
- Reviewer: review-plan (independent session) · Session: review-plan-37-cycle4-2026-09-10 · Role: reviewer · Author: plan-feature-scaffold
- Author exclusion: enforced · Context clean: true
- Model diversity: same-model · Policy: v1
- Started/finished: 2026-09-10 (UTC not recorded by runtime) / 2026-09-10 · Findings: 2 (material open: 1)
- Ledgers read: planning-evidence 9 rows · obligations 12 rows (verified-capable: 1)
- Prior plan receipt (re-review only): PLAN-REVIEW-37-3 @ 27565d4a0867a2a3ddb025f82a983edafd65c280a4f1737c40feb2c133ce6c50
```

Notes:
- Cycle 4 of the plan loop; no-progress gate satisfied: snapshot changed 27565d4a… → 81aefd1c… (the `37-plan-4` fold commit `dd68f050`). Falsification stance before checking: CONFIRMED-GAPS → confirmed on L1 only (F12).
- L1 fails (stale-parent): the parent Product receipt SPEC-REVIEW-37-1 (snapshot `8f736cc9…`) no longer binds the current Product half. Recomputation per POLICY §7: the F8 fold commit `dd68f050` edited SPEC §Scope in-scope bullet 7 (AC9→AC10 mapping) — inside the `spec-product-v1` projection, which ends at `## Engineering half`. The current Product projection is 20439 bytes · digest `4f33d5979f1e7e0169051bd83096dd8ffaa3013dd9e6440d5281cca693cb613f`; a `stage: spec` build at the receipt's own pinned revisions (05480514…) over the current tree prints `2a072615…` — neither reproduces the recorded `8f736cc9…` (20345 bytes). Context authorities did NOT move: CLAUDE.md (`9ae03966…`) and REPOSITORY_STATE.md (`e8509783…`) recomputed byte-identical 05480514→dd68f050; architectural-invariants absent on both sides; no `governing-issue`/`dependency-unit` context exists in the builder. So `changedPaths` is empty and the moved bytes are exactly the unit's own Product half. Claimed value `8f736cc9…` recorded beside the recomputed values — the pairing is the defect, never a substitution.
- Per CHECKS §3 the review stops at L1 rather than reviewing an orphaned plan: L2–L6 and P1–P12 were read but not adjudicated this cycle. The ledgers themselves swept clean on read (planning-evidence 9 rows all `current`/`proven|decision`; obligations 12 rows, none blank/deferred/duplicated, O11 `verified`); that is context, not an adjudication.
- Fold verification (context for the next cycle, not an adjudication): F8's SPEC edit is present (§Scope bullet 7 now maps to AC10 — this is the very edit that moved the Product half); F9 verified (bump-skill steps in PLAN/TASKS P1+P4; testing.md names the normative-drift dependency); F10 verified (fingerprints re-derived 3/6/3/7/8 = TASKS.md checkbox counts; P4 `P4:docs:7:slim-three-consumer-routes-to-run-and-paste`); F11 verified (box-2 frozen to target-file semantics with the no-target exemption and package-README rule; PE-002's `path:line` citations match the working tree at `af4fe86`). The plan-self-conformance family from cycles 1–3 did not recur.
- Zero writes to any reviewed artifact: only progress.md (this receipt) and planning-findings.md (F12–F13) were appended; the reviewer made no commit.
- Self-check `verify --stage plan --parent 8f736cc9…` pasted beside the verdict block in chat (write-then-report: receipt written before report).

## Replan 5 — F12+F13 fold: Product-half byte restore + PE-008 re-point (2026-09-10)

Owner decision (user, approved in session): resolve F12/F13 via option 2 — restore
the Product half to the exact bytes SPEC-REVIEW-37-1 reviewed, and repair PE-008
plan-side only. No product semantics changed.

Folds applied (revision `37-spec-2`):
- F12: SPEC §Scope in-scope bullet 7 reverted to the SPEC-REVIEW-37-1-reviewed text
  ("→ AC9 (n/a pending planning)"). Digest proof: `bun scripts/pre-execution-snapshot.mjs
  build --stage spec --unit 37-phase-lint-script --source-revision 05480514…
  --artifact-revision 05480514…` → `8f736cc97ff87fa83e7581e1faeabbdb52fdc6ab3e9f73bc6e1cefcb3be9c0a0`
  — exact match with the receipt's bound snapshot; the Product receipt binds the
  Product half again. Context authorities unchanged (CLAUDE.md, REPOSITORY_STATE.md
  diff vs `dd68f050` empty).
- F13: PE-008's `source-and-location` re-pointed plan-side only, from the SPEC Scope
  bullet to `SPEC §Acceptance criteria AC9/AC10` (the AC10 location F1 verified),
  citing the spec-stage F1 ledger row as authority — planning-evidence.md is not a
  Product-half byte, so the parent digest stays `8f736cc9…`.
- `## Design status` and all other Product-half bytes untouched; no content
  re-review needed — this is a byte-identity restore, not a product change.

Note: planning-evidence.md moved (not a Product-half byte); a `stage: plan` rebuild
is expected for the next review-plan cycle with parent `8f736cc9…`.

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-37-5 · Snapshot: 8c81bd16b8392e415558a0b7554112e45f78eab933b326fd02003ed9d47d21e4 · Verdict: plan-review-pass
- Unit: 37-phase-lint-script · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 8f736cc97ff87fa83e7581e1faeabbdb52fdc6ab3e9f73bc6e1cefcb3be9c0a0 · Parent Product receipt: SPEC-REVIEW-37-1
- Source revision: f46cf4504bb9995665f89cc0e0f04fc53526d1a5 · Artifact revision: f46cf4504bb9995665f89cc0e0f04fc53526d1a5
- Reviewer: review-plan (independent session) · Session: review-plan-37-cycle5-2026-09-10 · Role: reviewer · Author: plan-feature-scaffold
- Author exclusion: enforced · Context clean: true
- Model diversity: same-model · Policy: v1
- Started/finished: 2026-09-10 / 2026-09-10 · Findings: 0 (material open: 0)
- Ledgers read: planning-evidence 9 rows · obligations 12 rows (verified-capable: 1)
- Prior plan receipt (re-review only): PLAN-REVIEW-37-4 @ 81aefd1c05f762ff85e05c9eb2069c73a491e710bb7d77d84a2a820c29dcd689
```

Notes:
- Cycle 5 of the plan loop; no-progress gate satisfied: snapshot changed 27565d4a… → 81aefd1c… → 8c81bd16… (the `37-spec-2` fold commit `f46cf450`). The planner's handoff label is `37-spec-2`; the receipt's `Artifact revision:` binds the builder's canonical digest-derived value `f46cf450…` (handoff label recorded here, as in cycles 2–4).
- Parent lineage re-proven, never copied: `stage: spec` build at the parent receipt's own pinned revisions (`--source-revision 05480514… --artifact-revision 05480514…`) over the current tree reproduces `8f736cc9…` exactly — the F12 fold's byte-restore claim verified; context authorities recomputed byte-identical (CLAUDE.md `9ae03966…`, REPOSITORY_STATE.md `e8509783…`, diff 05480514→f46cf450 empty; architectural-invariants absent both sides). L1 holds.
- Falsification stance before checking: CONFIRMED-GAPS → no confirmed gaps. Fold verification: F12 verified (the in-scope bullet reads the SPEC-REVIEW-37-1 text again and the digest reproduces), F13 verified (PE-008 now cites `SPEC §Acceptance criteria AC9/AC10` with the spec-stage F1 row as authority). F8–F11 stand verified from cycle 4's read.
- Ledger sweep: L2 clean (9 evidence rows, all `current` + `proven`/`decision`; PE-002's path:line citations match the tree at f46cf450); L3–L4 clean (12 obligation rows, none blank/deferred/duplicated, O11 `verified`); L5 closure holds (8 dev scenarios ↔ validators ↔ phases; validators can fail); L6 honest (F2–F11 folded with evidence; spec-stage F1 is info, non-material). P1–P12 all pass — P9's fingerprints re-derived mechanically (checkbox counts 3/6/3/7/8 = TASKS.md; layers declared; P5 normalizes to `hardening-pr` per the P1-amended rule 1, ED6), P10's gate set matches the project's real gates incl. the normative-drift version-tables dependency (F9 fold), P12's citations re-verified (`plan-fix/SKILL.md:101`, `execute-phase/SKILL.md:50`, `PREFLIGHT.md:154`, phase-contract v1.0.1, fix #191 row).
- Zero writes to any reviewed artifact: only progress.md (this receipt) was appended; no new finding rows — planning-findings.md unchanged this cycle.
- Self-check `verify --stage plan --parent 8f736cc9…` pasted beside the verdict block in chat (write-then-report: receipt written before report).

## Pre-flight gates — 2026-09-10 (execute-phase, whole-unit mode)

- Branch: `feat/37-phase-lint-script` (`git branch --show-current` → `feat/37-phase-lint-script`; not `main`).
- Own-status: roadmap row 37 reads `planned` (`docs/features/ROADMAP.md:47`) → proceed.
- Dependency gate: SPEC §Dependencies declares **Hard: none**, **Soft: none** — transitive closure empty, all met.
- Pre-execution review gate: `node scripts/pre-execution-snapshot.mjs verify --stage plan --unit 37-phase-lint-script --parent 8f736cc97ff87fa83e7581e1faeabbdb52fdc6ab3e9f73bc6e1cefcb3be9c0a0` → `"current": true`, `PLAN-REVIEW-37-5` `plan-review-pass`, digest `8c81bd16b8392e415558a0b7554112e45f78eab933b326fd02003ed9d47d21e4`, `changedPaths: []`.
- Architectural invariants: `n/a: no project invariants declared` (NRS F010; `docs/architecture/ARCHITECTURAL_INVARIANTS.md` absent).
- NRS: `docs/workflow/REPOSITORY_STATE.md` status `frozen` — consumed; no applicable contradiction for this unit.
- Phase-lint pre-flight (model reasoning — the deterministic linter this feature writes does not exist yet): all five phases PASS (8/8), fingerprints matching SPEC §Phase-lint (P1 `docs:3`, P2 `config/infra:6`, P3 `config/infra:3`, P4 `docs:7`, P5 `hardening:8` — P5's `Hardening & PR` exempt per the P1-amended rule 1).
- Queue (whole-unit mode): P1, P2, P3, P4, P5 — all remaining phases; TASKS.md unticked at `f46cf450`.

## Dependency receipt v1
- Fingerprint: 5d64ad9d1cf8767025ba9ccb7b58ab1f4d294351 · Closure: 37-phase-lint-script ← (none declared)
- Merged PRs: none (no dependencies declared) · Fully merged: yes · Verified: 2026-09-10

## Acceptance receipt v1
- Manifest: docs/features/37-phase-lint-script/ACCEPTANCE.md · Blob: 21adb08445ef1b1994ae3adfbcfc3bbe32a5a7b4 · Status: frozen · Verified: 2026-09-10

## P1 — 2026-09-10
- Done: `phase-contract` rule 1 amended with the owner-sanctioned `Hardening & PR` exception; version 1.0.1 → 1.0.2 through the `bump-skill` surface (CHANGELOG.md + CHANGELOG.es.md rows and Release log lines); pi mirror re-bundled (38 skills, 123 files).
- Remains: P2–P5.
- Gotchas: the frozen plan pins `1.0.2` while the versioning policy maps a rule-semantics change to a minor bump — kept `1.0.2` per PLAN/SPEC/PE-001 and labelled the CHANGELOG row `patch` with the exception described explicitly; flagged for the end review. EN `CHANGELOG.md` had lost the pi-package `0.8.0` row (pre-existing, `normative-drift` red at HEAD) — folded as an Autofix, see decisions.md §Opportunistic findings. `npm run bundle:skills` resolves only from `packages/pi-agentic-workflow` (no root package.json).
- Files: skills/phase-contract/SKILL.md, CHANGELOG.md, CHANGELOG.es.md, packages/pi-agentic-workflow/skills/phase-contract/SKILL.md, docs/features/37-phase-lint-script/{TASKS.md,decisions.md,progress.md}
- Next: P2 — Implement the deterministic phase linter

## Unit-loop receipt — P1
- Commit: pending · Gate: `node --test scripts/normative-drift.test.mjs` → exit 0 (16/16) · P1 done-when: `grep -n "Hardening & PR" skills/phase-contract/SKILL.md` → match at :35, `bun run bundle:skills` → exit 0 (38 skills) · Acceptance blob: 21adb08445ef1b1994ae3adfbcfc3bbe32a5a7b4
- Next: P2 · Attempts: 1

## P2 — 2026-09-10
- Done: `scripts/phase-lint.mjs` (parser, eight rule checks, four reason codes, exit 0/1, per-phase fingerprints, whole-plan sha256) and `scripts/phase-lint.test.mjs` (13 CLI-level corpus tests: valid, invalid boxes 1+4+5, enumerated-cases, 9-task threshold, ambiguous layer, no phases, missing file/argument, permission denied, oversized input, determinism, concurrency, node/bun parity); P1 commit `509d685c` reconciled.
- Remains: P3–P5.
- Gotchas: the frozen grammar is only satisfiable by the file carrying the task list — `TASKS.md` — and this unit's `TASKS.md` was missing its five `Layer:`/`Done-when:` lines, so the reviewed plan could not reproduce its own recorded fingerprints; repaired verbatim from `SPEC.md` §Phases (plan-conflict rule) and recorded in `decisions.md`, with the `PLAN-REVIEW-37-5` snapshot consequence disclosed. The linter now reproduces all five fingerprints exactly. Lint target + disclosed limitations in `known-issues.md`/`testing.md`.
- Files: scripts/phase-lint.mjs, scripts/phase-lint.test.mjs, docs/features/37-phase-lint-script/{TASKS.md,decisions.md,known-issues.md,testing.md,progress.md}
- Next: P3 — Create the producer crate vehicle

## Unit-loop receipt — P2
- Commit: pending · Gate: `node --test scripts/phase-lint.test.mjs` → exit 0 (13/13) · `node --test scripts/normative-drift.test.mjs` → exit 0 (16/16) · `bun scripts/check-skill-context.mjs` → PASS (39 skills) · `npx skills add . --list` → exit 0 · dogfood `bun scripts/phase-lint.mjs docs/features/37-phase-lint-script/TASKS.md` → `verdict PASS`, 5/5 recorded fingerprints, sha256 `b012730370…` · Acceptance blob: 21adb08445ef1b1994ae3adfbcfc3bbe32a5a7b4
- Next: P3 · Attempts: 1

## P3 — 2026-09-10
- Done: created the producer crate vehicle — `packages/agentic-workflow/package.json` (private, zero dependencies, no build step), `packages/agentic-workflow/README.md` stub stating the vehicle rule and the scratch convention, and the committed `.agentic-workflow/tmp/.gitkeep`; P2 commit `4828900d` reconciled.
- Remains: P4–P5.
- Gotchas: none — the new package is inert (no scripts, no deps, not published), and adding it left the repository scripts suite at its pre-existing 220/221.
- Files: packages/agentic-workflow/package.json, packages/agentic-workflow/README.md, .agentic-workflow/tmp/.gitkeep, docs/features/37-phase-lint-script/{TASKS.md,progress.md}
- Next: P4 — Slim the three consumer routes to run-and-paste

## Unit-loop receipt — P3
- Commit: pending · Gate: `test -d packages/agentic-workflow && test -f packages/agentic-workflow/package.json && test -d .agentic-workflow/tmp` → exit 0 (AC10) · `node --test scripts/*.test.mjs` → 220/221 (only the pre-existing `check-skill-context` failure) · phase-lint P3 → PASS (8/8) `P3:config/infra:3:create-producer-crate-vehicle` · Acceptance blob: 21adb08445ef1b1994ae3adfbcfc3bbe32a5a7b4
- Next: P4 · Attempts: 1

## P4 — 2026-09-10
- Done: the three consumer routes now run the linter instead of reasoning — `plan-feature-scaffold` 2.2.0→2.3.0 (`SKILL.md`, `references/SCAFFOLD_PROCESS.md`), `plan-fix` 3.1.0→3.2.0 (`SKILL.md`, `references/PLANNING_PROCESS.md`), `execute-phase` 4.4.1→4.5.0 (`SKILL.md`, `references/PREFLIGHT.md`); both CHANGELOGs (rows + Release log), README/README.es cells, and the pi mirror re-bundled; P3 commit `1a96ccc9` reconciled.
- Remains: P5.
- Gotchas: route estimate ceilings were already over “measured × 1.10” repo-wide at HEAD (23 routes across 5 skills, the cause of the pre-existing `check-skill-context.test.mjs` failure) — the plain budget check is green and the `--routes` overrun is disclosed in `known-issues.md`, not repaired here. `execute-phase`'s per-reference ceiling (2588) left only 191 bytes of headroom, so the script prose lives in `SKILL.md` (main budget) and `PREFLIGHT.md` kept a compact swap (est 2463).
- Files: skills/plan-feature-scaffold/{SKILL.md,references/SCAFFOLD_PROCESS.md}, skills/plan-fix/{SKILL.md,references/PLANNING_PROCESS.md}, skills/execute-phase/{SKILL.md,references/PREFLIGHT.md}, CHANGELOG.md, CHANGELOG.es.md, README.md, README.es.md, packages/pi-agentic-workflow/skills/**, docs/features/37-phase-lint-script/{TASKS.md,progress.md}
- Next: P5 — Hardening & PR

## Unit-loop receipt — P4
- Commit: pending · Gate: `grep -n "phase-lint.mjs" skills/plan-feature-scaffold/SKILL.md skills/plan-fix/SKILL.md skills/execute-phase/SKILL.md` → matches at :51/:101/:51 · `bun scripts/check-skill-context.mjs` → PASS (39 skills) · `npx skills add . --list` → exit 0 · `node --test scripts/normative-drift.test.mjs` → 16/16 · `bun run bundle:skills` → 38 skills/123 files · mirror parity `diff -r skills packages/pi-agentic-workflow/skills` → only `bump-skill` (excluded) · `git diff --stat -- skills/phase-contract` → empty (O12) · Acceptance blob: 21adb08445ef1b1994ae3adfbcfc3bbe32a5a7b4
- Next: P5 · Attempts: 1

## P5 — 2026-09-10 (close-out; renumbered P6 by the F7 re-cut)
- Done: full verification gate re-run — `node --test scripts/phase-lint.test.mjs` exit 0 (13/13), `node --test scripts/normative-drift.test.mjs` exit 0 (16/16), `bun scripts/check-skill-context.mjs` exit 0 (PASS, 39 skills), `npx skills add . --list` exit 0, `bun run test` in `packages/pi-agentic-workflow` exit 0 (185/185), AC1–AC10 re-run green (AC1 `5` PASS lines, AC2 exit 1 with rule + BLOCKED lines, AC4 byte-identical, AC6 grep empty, AC9 diff empty, AC10 exit 0); the dev-scenario edge corpus exercised (oversized input, permission-denied, concurrent runs — 3/3); `git status --porcelain -- docs/` empty; roadmap row 37 flipped to `done`; P4 commit `d3ee1658` reconciled.
- Remains: none — unit finished (PR open).
- Gotchas: `node --test scripts/*.test.mjs` is 220/221 — the single red is the pre-existing `check-skill-context.test.mjs` route-budget fixture failure owned by fix #200 / issue #176 (`known-issues.md` §Disclosed limitations), present at `f46cf450` too and not introduced or repaired here. The `PLAN-REVIEW-37-5` snapshot no longer matches `TASKS.md` after the P2 plan-conflict repair (recorded in `decisions.md`); a receipt refresh would be forgery, so only a fresh `/review-plan` can restore it.
- Files: docs/features/37-phase-lint-script/{TASKS.md,progress.md,known-issues.md}, docs/features/ROADMAP.md
- Next: unit finished — `/review-change` on the changed HEAD

## Unit-loop receipt — P5 (close-out; now P6)
- Commit: `cdcec97c` (done flip) + link commit · Gate: `node --test scripts/phase-lint.test.mjs` 0 (13/13) · `node --test scripts/normative-drift.test.mjs` 0 (16/16) · `bun scripts/check-skill-context.mjs` 0 · `npx skills add . --list` 0 · `bun run test` (pi package) 0 (185/185) · `node --test scripts/*.test.mjs` 1 (220/221, pre-existing #200/#176) · Acceptance blob: 21adb08445ef1b1994ae3adfbcfc3bbe32a5a7b4
- Next: close-out complete · PR: https://github.com/gtrabanco/agentic-workflow/pull/212 · Attempts: 1

## Replan 6 — F7 fold: box-2 test-file mapping (2026-09-11)

User directive: plan the F7 resolution (review-findings.md F7 — med, class
`replan-in-unit`, user-confirmed; its row stays `folded: no` until this
re-cut's execution lands and a fresh review re-verifies it). Folds applied
(revision `37-plan-5`), docs-only on the planning set — no code changed this
cycle:

- SPEC §Design box-2: the sentence "Tests live with the phase's own layer."
  replaced by the frozen test-file mapping for the owner-sanctioned test-only
  `hardening` shape (owner rule 2; `.test.` mechanical basename definition;
  `close-out` deliberately excluded — fail-closed). See decisions.md.
- PLAN/TASKS/SPEC §Phases re-cut to six phases: new P5 "Implement the box-2
  test-file mapping" (config/infra — red-first corpus fixtures + mapping
  implementation; O13, PE-010); former close-out P5 renumbered P6 (tasks,
  ticks and fingerprint unchanged except the number).
- testing.md fingerprint record updated (six, incl. `P5:config/infra:2`);
  planning-obligations gains O13; planning-evidence gains PE-010; ACCEPTANCE.md
  and `skills/phase-contract/` untouched (O12; frozen acceptance blob stays
  `21adb084…`).
- Mechanical re-derivation (convergence argument): `node scripts/phase-lint.mjs
  docs/features/37-phase-lint-script/TASKS.md` → verdict PASS, six per-phase
  fingerprints matching SPEC §Phase-lint exactly, whole-plan sha256
  `3ea28e5b965e08cfc59d5410f80fed542e5fb8e5398268130a82f98bc4794940`;
  `node --test scripts/phase-lint.test.mjs` → 26/26; parent Product snapshot
  re-proven: `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit
  37-phase-lint-script --source-revision 05480514… --artifact-revision
  05480514…` → `8f736cc9…` exact (SPEC-REVIEW-37-1 still binds the Product
  half — SPEC edits confined to the Engineering half).
- Same-surface check: the only other `scripts/phase-lint.mjs` consumers, fix
  units 81 (legacy-spec carve-out) and 82 (heading wrap), are both `done` — no
  open fix-now work on the surface.

Next: /review-plan 37 (fresh re-review; prior receipt PLAN-REVIEW-37-5), then
/execute-phase 37 for P5 plus the P6 close-out re-run.

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-37-6 · Snapshot: 432566ce326379b845d03d906864a48431ac4201f7fc7c19cb0610d80ca59b1a · Verdict: plan-review-fail
- Unit: 37-phase-lint-script · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 8f736cc97ff87fa83e7581e1faeabbdb52fdc6ab3e9f73bc6e1cefcb3be9c0a0 · Parent Product receipt: SPEC-REVIEW-37-1
- Source revision: e4c9e16922f913e9bf754416fc03f8e86296240b · Artifact revision: e4c9e16922f913e9bf754416fc03f8e86296240b
- Reviewer: review-plan (independent session) · Session: review-plan-37-cycle6-2026-09-11 · Role: reviewer · Author: plan-feature-scaffold
- Author exclusion: enforced · Context clean: true
- Model diversity: same-model · Policy: v1
- Started/finished: 2026-09-11 / 2026-09-11 · Findings: 3 (material open: 3)
- Ledgers read: planning-evidence 10 rows · obligations 13 rows (verified-capable: 1)
- Prior plan receipt (re-review only): PLAN-REVIEW-37-5 @ 8c81bd16b8392e415558a0b7554112e45f78eab933b326fd02003ed9d47d21e4
```

Notes:
- Cycle 6 of the plan loop; no-progress gate satisfied: snapshot changed `8c81bd16…` → `432566ce…` (the P2 plan-conflict repair + the user-directed `37-plan-5` replan commit `e4c9e169`). The input was a repair performed in response to persisted findings (review-findings F7, replan-in-unit) — POLICY §4's guards do not block it.
- Falsification stance before checking: CONFIRMED-GAPS → confirmed on a new planning-set sync-drift family (F14–F16). The cycle-3 anomaly family (plan-self-conformance) did NOT recur: fingerprints were re-derived mechanically by this reviewer by running the delivered linter — `node scripts/phase-lint.mjs docs/features/37-phase-lint-script/TASKS.md` → `verdict PASS`, six per-phase fingerprints matching SPEC §Phase-lint exactly (P1 `docs:3`, P2 `config/infra:6`, P3 `config/infra:3`, P4 `docs:7`, P5 `config/infra:2`, P6 `hardening:8`), whole-plan sha256 `3ea28e5b…` equal to the recorded re-cut value; `node --test scripts/phase-lint.test.mjs` → 0 failures.
- Parent lineage re-proven, never copied: `stage: spec` build at the parent receipt's pinned revisions (`--source-revision 05480514… --artifact-revision 05480514…`) over the re-cut tree reproduces `8f736cc97ff87fa83e7581e1faeabbdb52fdc6ab3e9f73bc6e1cefcb3be9c0a0` exactly (Product half unmoved — replan 6's SPEC edits are Engineering-half only). Context authorities: zero commits touched `CLAUDE.md` / `docs/workflow/REPOSITORY_STATE.md` between `05480514` and HEAD; builder digests match cycle 5's (`9ae03966…`, `e8509783…`); architectural-invariants absent both sides. L1 holds.
- The receipt's `Artifact revision:` binds the builder's canonical digest-derived value `e4c9e169…`; the planner's handoff label `37-plan-5` is recorded here (cycle-2 precedent).
- L2: PE-001/PE-002/PE-010 verified resolving at HEAD (`skills/phase-contract/SKILL.md:4` v1.0.3; rule 2 "a test-only phase declares `hardening`" at :42; rule 3 ≥ 1-task minimum at :43; `skills/plan-fix/SKILL.md:101` and `skills/execute-phase/SKILL.md:50` land on the run-and-paste steps P4 shipped). PE-007 fails (F16); no `unknown`/`drifted`/`deferred` row otherwise.
- L3/L4: 13 obligation rows, none blank/deferred/duplicated; O11 `verified`; O13 `planned` matching the unticked P5. O4/O6/O9's `P2 / P5` re-verification cells continue the five-cycle adjudication (re-verification points whose substance stays true under the 6-phase re-cut — P5 re-proves after the box-2 change, P6 re-runs the full gate) — recorded here, not re-litigated.
- L5: 8 dev scenarios ↔ phases ↔ validators; every validator can fail (the corpus asserts the exit-1 paths; `diff` / `test -d` / grep are falsifiable); P5's fixtures cover the new box-2 failure states (hardening + source target → BLOCKED; test file outside hardening → prefix table). L6: honest — spec-stage F1 open info (non-material); F2–F13 folded with resolution evidence; review-findings F7 `folded: no` pending this re-cut's execution, per replan 6.
- P-checks: P1–P8, P10, P11 pass; P9 pass on the mechanical re-derivation above; P10's frozen acceptance blob re-verified byte-identical (`git hash-object ACCEPTANCE.md` → `21adb08445ef1b1994ae3adfbcfc3bbe32a5a7b4`). Failed: L2 (F16) and P12 (F14, F15).
- Notes, non-findings: (a) roadmap row 37 reads `done · [#212]` while the handoff directs P5 + the P6 close-out re-run — execute-phase's own-status gate reading of a `done` row is unrecorded here; surface at execution if the gate refuses (no evidence of refusal — not a finding). (b) review-findings F8 (`packages/agentic-workflow/README.es.md`) is `folded: yes`; the plan's P3 task text predates that fold — the delta lives in the fold ledger. (c) PE-009's fix #191 re-check point was consumed at executed P4 (disjoint areas verified in the P4 receipt); no remaining phase touches that surface.
- Zero writes to any reviewed artifact: only progress.md (this receipt) and planning-findings.md (F14–F16) were appended, uncommitted by design so HEAD stays at the bound sourceRevision `e4c9e169` — the author's fold commit carries these bytes, as in cycles 1–5.
- Convergence notice for the next cycle: F14–F16 are a new family (planning-set sync drift), first adjudication this cycle; the re-review after the repair batch is that family's second cycle and must print the CONVERGENCE-ANOMALY block before any further edit (POLICY §4). The repair batch must state its own convergence argument: one root cause (replan 6 edited artifact content without syncing the three header labels, one invariant wording cell, and one evidence status clause), one batch.

## Repair 7 — F14–F16 fold + feature-38 merge readiness (`37-plan-6`, 2026-09-12)

User instruction for this cycle: feature 38 is merged (`e0c18284`, PR #213), so
sync `main` into this branch and run the repair batch; the `--json` deferred
decision closes **plan-side**; the producer-crate re-homing becomes a recorded
follow-up; the roadmap row returns to `in-progress` while P5 + the P6 close-out
re-run execute.

Folds applied (revision `37-plan-6`), docs-only on the planning set — no code
changed this cycle (see decisions.md ED8 for the reasoning and the convergence
argument):

- **F14** — every live revision header now names `37-plan-6` (`SPEC.md`
  §Engineering half, `PLAN.md`, `planning-evidence.md`, `architecture-notes.md`,
  `TASKS.md`, `testing.md`, `planning-obligations.md`) and the SPEC's
  Engineering-half replan-note chain gained the missing Replan 5 (`37-plan-5`)
  and Replan 6 (this batch). `ACCEPTANCE.md` untouched — the frozen blob is
  `21adb08445ef1b1994ae3adfbcfc3bbe32a5a7b4` before and after this batch.
- **F15** — `architecture-notes.md` §Layer placement states the rule owner was
  amended twice with both revisions and commits (P1: 1.0.1 → 1.0.2; cycle-1
  fold F5: 1.0.2 → 1.0.3, `8a35face`), matching O12 and
  `skills/phase-contract/SKILL.md:4`.
- **F16** — `planning-evidence.md` PE-007 and `planning-obligations.md` O11
  state the row's real value; the row was flipped `done · [#212]` →
  `in-progress · [#212]` (user-approved merge-readiness fold; the same value
  `execute-phase` P1 writes, so P5's own-status gate reads an executable state).
- **Feature-38 merge readiness** (ED8.4, recorded as author-side folds — no
  review ran between the merge and this batch):
  - the `--json` deferred decision (SPEC `### Deferred decisions` row 2, Product
    half) closes plan-side: the trigger "Feature 38 scaffold time" fired and the
    merged sensor consumes receipts/git/forge, never the linter's stdout, so v1
    adds no machine surface and the frozen Product bytes stay untouched;
  - Product evidence E10's "it precedes 38" clause is superseded by the merge
    order and recorded as new `planning-evidence.md` PE-011 (same freeze
    reason);
  - SPEC `## Engineering half` §Producer family after this feature replaces the
    now-false "38 lands as a subcommand of the crate" claim with the fact
    (38 merged first at `scripts/workflow-status.mjs`) and points at the
    recorded follow-up in `known-issues.md` §Deferred items;
  - the crate obligation (P3 / AC10) and the vehicle-rule redistribution are
    unchanged — re-homing 38's producer is explicitly **not** this feature's
    scope.
- Mechanical re-derivation unchanged: `node scripts/phase-lint.mjs
  docs/features/37-phase-lint-script/TASKS.md` → verdict PASS, six fingerprints
  and whole-plan sha256 `3ea28e5b…` exactly as recorded (this batch does not
  touch phase shape); the Product parent snapshot (`8f736cc9…`) still binds the
  Product half.

Next: sync `main` into the branch (3 conflict files), re-basis the routes feature
38's merge re-grew, then `/review-spec 37` (bounded delta: the merge moved the
bound `CLAUDE.md` authority and the receipt was produced by the superseded
snapshot builder) and `/review-plan 37` (cycle 7).

## Merge sync — feature 38 (`main` → branch, 2026-09-12)

`git merge main` (`e0c18284`, PR #213) → merge commit `e3d8e0ea`. Three conflict
files only, no code conflict:

- `docs/LOGS.md` — append-only union: 17 branch entries + 15 `main` entries,
  the two sides' headers disjoint.
- `docs/features/ROADMAP.md` — row 37 from the branch (`in-progress · [#212]`)
  and row 38 from `main` (`done · [#213]`, carrying the #209 release-policy
  fold).
- `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — per-route max of both sides (the
  branch's re-basis #2 for the four plan-feature/plan-fix routes, `main`'s
  feature-38 re-basis for `execute-phase:*` / `review-change:*`, plus the new
  `workflow-status` skill entry).

Post-merge **re-basis #3** (ED8.4e): feature 38 re-based at its own HEAD, before
this branch's `phase-contract` 1.0.3 rewords and the P4 `execute-phase` slim
existed, so the seven `execute-phase:*` routes measured above their merged
ceilings (15 route failures on the merged tree). Re-set to `ceil(measured ×
1.10)` — 11656 / 11669 / 11539 / 11701 / 11854 / 11454 / 11616, line ceilings
unchanged — with the growth source declared in `policy.declared` and in the
`CHANGELOG.md` + `CHANGELOG.es.md` pair.

Gates RUN after the sync (verbatim summaries):

```
$ node scripts/check-skill-context.mjs --routes
PASS route budgets: 22 routes
$ node scripts/check-skill-context.mjs
PASS context budgets: 39 skills
$ node --test scripts/*.test.mjs
ℹ tests 285 · pass 285 · fail 0
$ node scripts/phase-lint.mjs docs/features/37-phase-lint-script/TASKS.md
verdict PASS · fingerprint: 3ea28e5b965e08cfc59d5410f80fed542e5fb8e5398268130a82f98bc4794940
$ git hash-object docs/features/37-phase-lint-script/ACCEPTANCE.md
21adb08445ef1b1994ae3adfbcfc3bbe32a5a7b4
```

The suite total is `main`'s 259 plus this branch's 26 `phase-lint` tests. The
pre-existing `check-skill-context.test.mjs` red disclosed since `f46cf450` is
closed by the sync (fixture half: fix #200 on `main`; live half: re-basis #3) —
`known-issues.md` and `testing.md` record it; no check was weakened.

Receipt state after the sync — both causes are structural, neither repairable:

- the newest plan receipt is `PLAN-REVIEW-37-6`, a `plan-review-fail` (F14–F16,
  folded in this batch — only a fresh cycle can turn it into a PASS), and
- the sync moved a bound context authority (`CLAUDE.md`, where feature 38 folded
  fix #209's release-policy line) **and** replaced the snapshot builder
  (`scripts/pre-execution-contract.mjs`; `pre-execution-snapshot.mjs` rewritten
  by feature 38), so no recorded digest is reproducible at all. A receipt
  refresh is forgery; a fresh review is the only route.

Next: `/review-spec 37-phase-lint-script` (bounded delta over the moved bound
authority) → `/review-plan 37-phase-lint-script` (cycle 7) → `/execute-phase 37`
for P5 plus the P6 close-out re-run.

## Pre-execution review receipt v1 — spec

```text
- Review: SPEC-REVIEW-37-2 · Snapshot: 27522e96dd726b2eb4dc12ff6ba4e6655c38a4dd0908b3f6d2af945037da6669 · Verdict: spec-review-pass
- Unit: 37-phase-lint-script · Stage: spec · Unit kind: feature · Parent: null
- Source revision: e3d8e0ea3f07ce93892dd2ad10462bd5b25b2891 · Artifact revision: e3d8e0ea3f07ce93892dd2ad10462bd5b25b2891
- Reviewer: review-spec (fresh context, manual portability route) · Session: 01a09632-a3bb-74b9-bf9b-2fe591053ec4 · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-12T15:18:16Z/2026-09-12T15:45:52Z · Findings: 3 (material open: 0)
```

Notes:

- Bounded delta re-review routed by this file's previous entry ("a fresh review
  is the only route"): the moved bound authorities are `CLAUDE.md` (feature 38's
  fix #209 line) and the replaced snapshot builder — the recorded spec digests
  (`8f736cc9…`) are therefore not reproducible by design, and lineage was proven
  by direct extracted-Product-half diffs instead: the Product half is
  byte-identical from its first commit (`28353158`) through HEAD (`f2c264ce`),
  across the F8 edit (`dd68f050`) and its F12/F13 restore (`f46cf450`).
- `sourceRevision`/`artifactRevisionId` carry the builder's identity default
  (`e3d8e0ea…` — the merge that last touched every bound path; bound bytes
  verified unchanged `e3d8e0ea` → HEAD `f2c264ce`). The invocation handed no
  artifact-revision id and no runtime rotates one here; the Product half's
  recorded labels are `37-spec-1` (decisions.md) and `37-spec-2` (the no-byte
  rotation at `f46cf450`).
- Governing issue #184 consulted (gh REST); contexts bound by the builder:
  project-guide + normalized-repository-state present, architectural-invariants
  absent (matches frozen fact F010).
- Findings F17–F19 (`info`, verified, open — PASS-compatible per LEDGERS) are
  recorded in `planning-findings.md` §Spec-stage findings; none is material and
  each cites its recorded plan-side disposition. No reviewed artifact (SPEC,
  decisions, roadmap row, ACCEPTANCE) was modified.

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-37-7 · Snapshot: 4ed98668b3d8a49c974a08d2007044411c9c51ab8770ec031fff3c23a37e2824 · Verdict: plan-review-pass
- Unit: 37-phase-lint-script · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 27522e96dd726b2eb4dc12ff6ba4e6655c38a4dd0908b3f6d2af945037da6669 · Parent Product receipt: SPEC-REVIEW-37-2
- Source revision: f2c264ce72722b0a315ecf4e1b9936444f1282aa · Artifact revision: f2c264ce72722b0a315ecf4e1b9936444f1282aa
- Reviewer: review-plan (independent session) · Session: review-plan-37-cycle7-2026-09-12 · Role: reviewer · Author: plan-feature-scaffold
- Author exclusion: enforced · Context clean: true
- Model diversity: same-model · Policy: v1
- Started/finished: 2026-09-12T15:50Z/2026-09-12T16:06Z · Findings: 1 (material open: 0)
- Ledgers read: planning-evidence 11 rows · obligations 13 rows (verified-capable: 1)
- Prior plan receipt (re-review only): PLAN-REVIEW-37-6 @ 432566ce326379b845d03d906864a48431ac4201f7fc7c19cb0610d80ca59b1a
```

Notes:
- Re-review of the repaired plan (no-progress gate satisfied): snapshot changed `432566ce…` → `4ed98668…` — the input was the F14–F16 fold commit `f9aed3fe` + the feature-38 merge sync `f2c264ce` (budget re-basis #3), a repair performed in response to persisted findings; POLICY §4's guards do not block it. The receipt's `Artifact revision:` binds the builder's canonical digest-derived value `f2c264ce…`; the planner's handoff label `37-plan-6` is recorded here (cycle-2/6 precedent).
- Convergence (cycle-6 family, second adjudication): the planning-set sync-drift family (F14–F16) did **not** recur — all seven live revision headers verified at `37-plan-6` (SPEC.md:309, PLAN.md chain extended to terminate at `37-plan-6`, planning-evidence.md:2, planning-obligations.md:4, TASKS.md:3, testing.md:3, architecture-notes.md:3), F15's amended-twice wording verified in architecture-notes.md, F16's roadmap-status clause verified in PE-007 + O11 against the row (`in-progress · [#212]`). The repair batch's own convergence argument (ED8) is accepted; the loop exits this cycle. Residual style inconsistency recorded as F20 (info, PASS-compatible).
- Falsification stance before checking: CONFIRMED-GAPS → refuted mechanically. The delivered linter reproduces the plan's self-conformance claims byte-identically: `bun scripts/phase-lint.mjs docs/features/37-phase-lint-script/TASKS.md` → `verdict PASS`, six per-phase fingerprints matching SPEC §Phase-lint exactly, whole-plan sha256 `3ea28e5b…` equal to the recorded re-cut value; `node --test scripts/phase-lint.test.mjs` → 26/26. `git hash-object ACCEPTANCE.md` → `21adb08445ef1b1994ae3adfbcfc3bbe32a5a7b4` (frozen blob byte-identical). `skills/phase-contract/SKILL.md:4` = 1.0.3.
- Parent lineage re-proven, never copied: SPEC-REVIEW-37-2 (snapshot `27522e96…`) is the newest current SPEC-REVIEW-PASS; between its bound revision `f2c264ce` and HEAD `f3329527` only `progress.md` + `planning-findings.md` moved (verified by `git diff --name-only`); zero commits touched `CLAUDE.md` / `docs/workflow/REPOSITORY_STATE.md` / SPEC since `f2c264ce`; builder context digests match the parent's (REPOSITORY_STATE `e8509783…`, CLAUDE.md `89908a32…`, invariants absent per frozen fact F010). L1 holds.
- L2: PE-001…PE-011 all `current` + `proven` (PE-005 `decision`); no `unknown`/`drifted`/`deferred` row. path:line spot-checks resolved: PE-002 (`skills/plan-fix/SKILL.md:101`, `skills/execute-phase/SKILL.md:50` — run-and-paste steps P4 shipped), PE-004 (`packages/pi-agentic-workflow/package.json:47` `bundle:skills`), PE-011 (`e0c18284` = PR #213 merge). PE-009's re-check point was consumed at executed P4 (cycle-6 note); the claim itself remains true at HEAD (fix #191 still `in-progress · #193`) and no remaining phase touches that surface — non-finding.
- L3/L4: 13 obligation rows, none blank/deferred/duplicated, ids stable; each names one phase, one task, owner, ACCEPTANCE-copied validator, required evidence; O11 `verified`; O13 `planned` matching the unticked P5. O4/O6/O9's `P2 / P5` re-verification cells continue the five-cycle adjudication — recorded, not re-litigated.
- L5: 8 dev scenarios ↔ phases ↔ validators; every validator can fail (corpus asserts the exit-1 paths; `diff`/`test -d`/grep falsifiable). L6: honest — open rows are F1 + F17–F19 (spec-stage, info, verified, each with recorded plan-side disposition); F2–F16 folded with resolution evidence; no open material row carried into execution.
- P-checks: P1–P12 pass; P9 on the mechanical re-derivation above (order matches the no-dependency closure; last phase `hardening`); P10's validators are the project's real gates, none weakened — gates re-run by this reviewer: `node --test scripts/normative-drift.test.mjs` → 0 failures, `bun scripts/check-skill-context.mjs --routes` → 22/22, `bun scripts/check-skill-context.mjs` → 39/39 (re-basis #3 reproduced); P12's remaining claims: O12 verified by commit history (exactly `509d685c` P1 + `8a35face` F5 touched the rule owner), O10 vehicle validator → exit 0, AC9 diff `main...HEAD -- packages/agentic-workflow-schema` → empty.
- Notes, non-findings: (a) execution state — P1–P4 and P6 ticked, P5 pending; the plan is ordered P5 → P6 and the early P6 ticks are the user-approved merge-readiness state (ED8.4d, row `in-progress`); P6's close-out re-run re-executes after P5 per O4/O6/O9's re-verification cells — not a plan defect. (b) The 2026-09-10 plan-conflict record (TASKS grammar repair, PLAN-REVIEW-37-5 snapshot staleness) is superseded: this snapshot binds the current TASKS.md carrying the `Layer:`/`Done-when:` lines, and the linter reproduces the fingerprints from it.
- Zero writes to any reviewed artifact: only progress.md (this receipt) and planning-findings.md (F20) were appended, uncommitted by design so HEAD stays at the bound sourceRevision `f2c264ce` — the next commit on the branch carries these bytes, as in cycles 1–6.

## P5 — 2026-09-12 (box-2 test-file mapping; F7 fold)
- Done: box-2 gained the owner-sanctioned test-file mapping red-first — `scripts/phase-lint.test.mjs` 26→30 tests (the VF-7 reproducer now PASSes; a source target in `hardening` still BLOCKs box 2; a test file beside its implementation keeps the prefix table; `close-out` excluded, fail-closed) and `scripts/phase-lint.mjs` maps a `.test.` basename to `hardening` only in a phase declared `hardening`; the dogfood run reproduces the six recorded fingerprints and sha256 `3ea28e5b…`.
- Remains: P6 close-out re-run (roadmap flip to `done`, PR body refresh).
- Gotchas: the historical `## P5 — 2026-09-10` entry above is the close-out phase the `37-plan-5` re-cut renumbered **P6** (commit `cdcec97c`) — today's P5 is the new box-2 phase, not a rerun; the two are disambiguated by the explicit qualifiers. The `PLAN-REVIEW-37-7` snapshot no longer matches `testing.md` after this phase's test-record edit (same class as P2's TASKS.md repair, disclosed; only a fresh `/review-plan` can restore it). No skill changed, so no `bump-skill`/CHANGELOG surface moved.
- Files: scripts/phase-lint.mjs, scripts/phase-lint.test.mjs, docs/features/37-phase-lint-script/{TASKS.md,testing.md,progress.md}
- Next: P6 — Hardening & PR (close-out re-run)

## Unit-loop receipt — P5
- Commit: pending · Gate: `node --test scripts/phase-lint.test.mjs` → exit 0 (30/30) · `bun scripts/phase-lint.mjs docs/features/37-phase-lint-script/TASKS.md` → exit 0 (6/6 fingerprints, sha256 `3ea28e5b…`) · O4 `diff` → empty · O6 no-network grep → empty · O9 schema diff → empty · Acceptance blob: 21adb08445ef1b1994ae3adfbcfc3bbe32a5a7b4
- Next: P6 — close-out re-run · Attempts: 1

## P6 — 2026-09-12 (close-out re-run)
- Done: full verification gate re-run green after the P5 mapping landed — `node --test scripts/*.test.mjs` 289/289, `node --test scripts/normative-drift.test.mjs` 16/16, `bun scripts/check-skill-context.mjs` PASS (39 skills), `--routes` PASS (22 routes), `npx skills add . --list` exit 0, `bun run bundle:skills` 38 skills/123 files (pi mirror parity), `bun run test` pi package 185/185, schema package 684/684; AC1–AC10 re-run green (AC1 exit 0 with the six PASS lines, AC2 each failing rule + BLOCKED line, AC3 `missing-plan`/`no-phases`/`unparseable`, AC4 byte-identical, AC5 corpus 30/30, AC6 grep empty, AC7 exit 0, AC9 diff empty, AC10 exit 0); dev-scenario edge corpus exercised (5 MB oversized → PASS, permission-denied → `unparseable`, 8 concurrent runs byte-identical); `git status --porcelain -- docs/` empty; roadmap row 37 flipped `in-progress · [#212]` → `done · [#212]`; P5 commit `de5ddd57` reconciled.
- Remains: none — unit finished (PR #212 open; end review next).
- Gotchas: whole-unit review-checkpoint triggers recorded, not acted on (whole-unit mode continues; the end review covers all of it): **layer boundary** — P5 `config/infra` → P6 `hardening`; accumulation since `bedf717c` = 111 insertions / 5 files (under the 400-line / 8-file threshold); sensitivity — none (no auth, payments, destructive migration, secrets or CI config). The `## Unit-loop receipt — P5` block above stays `pending` by the loop contract (never amend a published commit to self-reference); this entry is its reconciliation. No skill changed in P5, so `bump-skill`/CHANGELOG did not move, and the `PLAN-REVIEW-37-7` plan receipt still binds the plan bytes up to the P5 landing.
- Files: docs/features/ROADMAP.md, docs/features/37-phase-lint-script/progress.md
- Next: unit finished — `/review-change` on the changed HEAD

## Unit-loop receipt — P6
- Commit: pending · Gate: `node --test scripts/*.test.mjs` exit 0 (289/289) · `bun scripts/check-skill-context.mjs` exit 0 · `bun scripts/check-skill-context.mjs --routes` exit 0 · `npx skills add . --list` exit 0 · `bun run test` (pi) exit 0 (185/185) · `bun run test` (schema) exit 0 (684/684) · `bun run bundle:skills` exit 0 (38 skills/123 files) · Acceptance blob: 21adb08445ef1b1994ae3adfbcfc3bbe32a5a7b4
- Next: close-out complete · PR: https://github.com/gtrabanco/agentic-workflow/pull/212 · Attempts: 1
