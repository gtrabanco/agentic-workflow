# Planning findings — 37-phase-lint-script

```text
findings-ledger@1
stage: spec
artifactRevisionId: 054805145e485e4f5161b3d6dd7392c1fb466b93

| id | severity | class | check | claim | evidence | verification | resolution |
|---|---|---|---|---|---|---|---|
| F1 | info | product | C8 | In-scope bullet 7 (vehicle rule) maps to "AC9 (n/a pending planning)", but AC9 verifies no schema change; the vehicle rule is actually covered by AC10 | SPEC.md §Scope → In scope bullet 7; SPEC.md §Acceptance criteria AC9, AC10 | verified | open |
```

```text
findings-ledger@1
stage: plan
artifactRevisionId: 3d3234f9a3f40fc80f6d9336288ed0c0581287c25a2bc972c8f7e61465fff996

| id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| F2 | plan | medium | plan | 800b79d3caaf5c1f3320d1fd1d04c1584a6c22cd3e9a0d67a901045a8861d2fb | P4's recorded fingerprint says 7 tasks (`P4:hardening:7:hardening-pr`) but TASKS.md P4 lists 8 checkboxes; SPEC §Phase-lint and PLAN repeat the same wrong count — the fingerprint the linter is being built to compute does not match the plan it was computed from | SPEC.md §Phases → Phase-lint · SPEC §P4; TASKS.md P4 (8 rows); PLAN.md P4 | folded | PLAN.md P4 now carries the 8th task (dev-scenario edge corpus) that TASKS.md already listed; recorded fingerprint re-cut to `P4:hardening:8:hardening-pr` — SPEC §Phase-lint, PLAN §P4, and TASKS.md P4 all state 8 tasks | 37-plan-2 |
| F3 | plan | medium | plan | 800b79d3caaf5c1f3320d1fd1d04c1584a6c22cd3e9a0d67a901045a8861d2fb | The frozen box-1 heuristic FAILs any title-deliverable containing `&`, yet the template-mandated final phase title is `Hardening & PR` (`docs/features/_TEMPLATE/SPEC.md:314`, `docs/fix/_TEMPLATE/SPEC.md:119`); the plan's own P4 carries that title and claims `PASS (8/8)` — self-contradiction that BLOCKs this unit's P4 and every future template plan; heuristic also omits `/` from the joiner list the rule owner states (phase-contract rule 1: `+`, `,`, `&`, `and`/`y`, `/`) | SPEC.md §Design → Rule checks box-1; docs/features/_TEMPLATE/SPEC.md:314; docs/fix/_TEMPLATE/SPEC.md:119; skills/phase-contract/SKILL.md §The eight phase-lint rules rule 1 | folded | SPEC box-1 amended: `/` added to the joiner list (verbatim per phase-contract rule 1) and the templates' conventional final-phase title `Hardening & PR` is exempted (kept literally by template mandate; title-deliverable normalizes to `hardening-pr`, `&` is a normalization separator); any other `&`-joined title still FAILs — recorded in decisions.md ED5 | 37-plan-2 |
| F4 | plan | low | plan | 800b79d3caaf5c1f3320d1fd1d04c1584a6c22cd3e9a0d67a901045a8861d2fb | PE-007 records roadmap row 37 status as `defined`; the actual row reads `planned` after scaffold | planning-evidence.md PE-007; docs/features/ROADMAP.md row 37 (working tree) | folded | PE-007 wording corrected: roadmap row 37 status `defined` → `planned` to match the working-tree row | 37-plan-2 |
```

```text
findings-ledger@1
stage: plan
artifactRevisionId: 81a2166aff3cdab4f3e8c0bde9388f145166c816

| id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| F8 | plan | medium | plan | 27565d4a0867a2a3ddb025f82a983edafd65c280a4f1737c40feb2c133ce6c50 | PE-008's resolution claim is contradicted by the SPEC bytes it cites: the in-scope bullet still reads "→ AC9 (n/a pending planning)" with no AC10 correction, yet the table row is marked `proven`; an evidence row asserting a correction that is not in the bound artifact fails the L2 integrity rule | planning-evidence.md PE-008; SPEC.md §Scope in-scope bullet 7 ("AC9 (n/a pending planning)") vs §Acceptance criteria AC10 | open | — | — |
| F9 | plan | medium | plan | 27565d4a0867a2a3ddb025f82a983edafd65c280a4f1737c40feb2c133ce6c50 | The plan bumps four skill versions (P1: phase-contract 1.0.1→1.0.2; P4: minor bumps to plan-feature-scaffold, plan-fix, execute-phase) but schedules no CHANGELOG rows in CHANGELOG.md/CHANGELOG.es.md and no `bump-skill` run — the project's normative-drift gate (`scripts/normative-drift.test.mjs`, declared in testing.md and re-run in P5) recomputes each skill's newest CHANGELOG row against its frontmatter version and will fail after P1/P4, so the plan cannot pass its own P5 gate as written | PLAN.md P1, P4, P5; TASKS.md P1, P4; CLAUDE.md §"Version every change" + §"bump-skill"; scripts/normative-drift.test.mjs version-tables test | open | — | — |
| F10 | plan | low | plan | 27565d4a0867a2a3ddb025f82a983edafd65c280a4f1737c40feb2c133ce6c50 | P1's recorded fingerprint says 2 tasks (`P1:docs:2:amend-phase-contract-rule-1`) but TASKS.md P1 lists 3 checkboxes (amend rule, bump version, re-bundle) — the same plan-self-conformance defect class as folded finding F2, recurring on the new P1 after the 5-phase re-cut | SPEC.md §Phase-lint P1; TASKS.md P1 (3 rows) | open | — | — |
| F11 | plan | low | plan | 27565d4a0867a2a3ddb025f82a983edafd65c280a4f1737c40feb2c133ce6c50 | The frozen box-2 heuristic lints "every task's referenced file paths" against the declared layer, while the rule owner's rule 2 covers a task's "target file"; under the SPEC's frozen grammar, P4 (layer docs) references `scripts/phase-lint.mjs` (→ config/infra per the frozen prefix table), so the linter this unit builds would emit `BLOCKED — box 2` for the plan's own P4 task text and its recorded `PASS (8/8)` is unprovable by the deliverable itself (F5's shape, narrower scope) | SPEC.md §Design box-2 vs skills/phase-contract/SKILL.md rule 2; TASKS.md P4 task 1; SPEC.md §Phase-lint P4 | open | — | — |
```

```text
findings-ledger@1
stage: plan
artifactRevisionId: 37-plan-4

| id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| F8 | plan | medium | plan | 27565d4a0867a2a3ddb025f82a983edafd65c280a4f1737c40feb2c133ce6c50 | PE-008's resolution claim is contradicted by the SPEC bytes it cites (in-scope bullet 7 still maps to "AC9 (n/a pending planning)") | planning-evidence.md PE-008; SPEC.md §Scope in-scope bullet 7 vs §Acceptance criteria AC10 | folded | In-scope bullet 7 re-mapped to `→ AC10 (crate + tmp convention); AC9 is n/a for this bullet` (the Product-half correction itself was the user-approved design-interview fix, F1, verified — no product semantics changed); PE-008's source-and-location cell now cites both surfaces (`SPEC §Scope in-scope bullet 7` + `§Acceptance criteria AC9/AC10`) so the `proven` claim is backed by the bound bytes | 37-plan-4 |
| F9 | plan | medium | plan | 27565d4a0867a2a3ddb025f82a983edafd65c280a4f1737c40feb2c133ce6c50 | Version bumps with no CHANGELOG/bump-skill step fail the plan's own P5 normative-drift version-tables gate | PLAN.md P1, P4, P5; TASKS.md P1, P4; CLAUDE.md §"Version every change" + §"bump-skill"; scripts/normative-drift.test.mjs | folded | P1 now runs `bump-skill` for `phase-contract` (1.0.1 → 1.0.2 + CHANGELOG.md + CHANGELOG.es.md rows + README/SKILLS table sync) and P4 runs `bump-skill` for the three slimmed skills (minor bumps + same surface); the bare "minor version bumps" wording is gone; testing.md states the normative-drift dependency explicitly; O8's obligation updated. Gate green by construction | 37-plan-4 |
| F10 | plan | low | plan | 27565d4a0867a2a3ddb025f82a983edafd65c280a4f1737c40feb2c133ce6c50 | P1's recorded fingerprint says 2 tasks but TASKS.md P1 lists 3 checkboxes (F2's class recurring after the re-cut) | SPEC.md §Phase-lint P1; TASKS.md P1 | folded | P1 and P4 re-cut and all five fingerprints re-derived mechanically from the cut tasks (checkbox counts + `Layer:` + normalized title-deliverables): P1 `P1:docs:3:amend-phase-contract-rule-1`, P4 `P4:docs:7:slim-three-consumer-routes-to-run-and-paste`; mechanical verification walk over the whole plan is clean (fold notes in decisions.md ED7) | 37-plan-4 |
| F11 | plan | low | plan | 27565d4a0867a2a3ddb025f82a983edafd65c280a4f1737c40feb2c133ce6c50 | Frozen box-2 lints "every task's referenced file paths" while the rule owner's rule 2 covers the task's "target file"; the deliverable would BLOCK its own P4 | SPEC.md §Design box-2 vs skills/phase-contract/SKILL.md rule 2; TASKS.md P4 task 1 | folded | SPEC §Design box-2 re-frozen to the owner's check object: target file = the task's first path-like token outside a quoted command span; no-target tasks exempt; `packages/<pkg>/README.md` follows its package; determinism sentences added to box-1 (word-separator joiners, hyphenated compounds are one token) and the grammar (title-deliverable normalization incl. article dropping). Mechanical box-2 walk over all 27 tasks: 10 targets checked, 17 exempt, zero violations — the plan's own P4 PASS is provable by the deliverable | 37-plan-4 |
```

## Convergence argument (required by the cycle-3 CONVERGENCE-ANOMALY)

The recurring family across cycles 1–3 was plan-self-conformance (F2 → F10/F11):
each replan hand-patched the reported row instead of re-deriving the plan's
self-conformance claims. This batch (revision `37-plan-4`) states its
convergence argument per the notice: every fingerprint and every grammar claim
was re-derived mechanically over the re-cut plan before hand-off (fingerprint
derivation, box-1 joiner detection, box-2 target-file walk, box-3 counts —
verified clean by the fold notes in decisions.md ED7), not hand-patched row by
row.

```text
findings-ledger@1
stage: plan
artifactRevisionId: dd68f05075a88abbd0deb3f4f055278f161cf8b2

| id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| F12 | plan | medium | product | 81aefd1c05f762ff85e05c9eb2069c73a491e710bb7d77d84a2a820c29dcd689 | The 37-plan-4 fold (commit dd68f050) repaired PE-008's citation by editing SPEC §Scope in-scope bullet 7 — bytes inside the `spec-product-v1` projection — so the parent Product receipt SPEC-REVIEW-37-1 (snapshot 8f736cc9…, 20345 bytes) no longer binds the current Product half (20439 bytes · 4f33d597…); a stage:spec build at the receipt's own pinned revisions over the current tree prints 2a072615…, never the recorded 8f736cc9…; contexts did not move (CLAUDE.md 9ae03966…, REPOSITORY_STATE.md e8509783… byte-identical across 05480514→dd68f050; invariants absent both sides; no governing-issue/dependency-unit context exists in the builder) | planning-evidence.md PE-008; SPEC.md §Scope in-scope bullet 7 (Product half, ends at `## Engineering half` line 307); progress.md receipt SPEC-REVIEW-37-1 + PLAN-REVIEW-37-3 lineage notes; recomputed projections 4f33d597…/2a072615… | folded | Product-half byte restore: SPEC §Scope in-scope bullet 7 reverted to the SPEC-REVIEW-37-1-reviewed text ("→ AC9 (n/a pending planning)"); stage:spec build at the receipt's pinned revisions (05480514…) reproduces `8f736cc97ff87fa83e7581e1faeabbdb52fdc6ab3e9f73bc6e1cefcb3be9c0a0` exactly — the parent Product receipt binds the current Product half again; contexts unchanged vs dd68f050; no product semantics changed (AC10 already covered the vehicle rule; the reverted pointer remains F1's recorded, user-approved info note) | 37-spec-2 |
| F13 | plan | low | plan | 81aefd1c05f762ff85e05c9eb2069c73a491e710bb7d77d84a2a820c29dcd689 | The cycle-3 convergence anomaly's mechanical re-derivation step itself moved Product-half bytes: a plan-class repair batch edited a SPEC Scope bullet instead of correcting only the evidence row (PE-008's source-and-location could have been re-pointed at SPEC §Acceptance criteria AC10 — the location F1 verified — without touching the Product half), converting a plan-side fold into a stale-parent | decisions.md ED7 fold 1; git diff 81a2166a…dd68f050 -- docs/features/37-phase-lint-script/SPEC.md (single Product-half hunk); POLICY §4 (replan-batch scope) | folded | PE-008's `source-and-location` re-pointed plan-side only — from the SPEC Scope bullet to `SPEC §Acceptance criteria AC9/AC10` (the AC10 location F1 verified), citing the spec-stage F1 ledger row as authority — with the Product half restored byte-identical (see F12's resolution); the convergence-family root-cause fix stands: the evidence row, not the Product half, is the plan-side repair surface | 37-spec-2 |
