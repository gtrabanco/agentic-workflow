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
artifactRevisionId: c55328a451c065c3f0381ac8ed55eee54704561caa59e9b0f4c3b9fbf1140780

| id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| F5 | plan | high | product | c55328a451c065c3f0381ac8ed55eee54704561caa59e9b0f4c3b9fbf1140780 | The F3 fold amended SPEC §Design box-1 to exempt the templates' literal final-phase title `Hardening & PR`, but `skills/phase-contract/SKILL.md` (sole rule owner, v1.0.1) rule 1 FAILs any `&`-joined title with no exemption; the linter is specified to implement the rules verbatim (PE-001, O1) while O12 forbids touching phase-contract — so the linter this unit builds will emit `BLOCKED — box 1` for the plan's own P4 title and for every template-derived plan's final phase, making the recorded `P4 — Phase-lint: PASS (8/8)` unprovable by the deliverable itself | SPEC.md §Design → Rule checks box-1; skills/phase-contract/SKILL.md rule 1 (lines 33-34, no exemption); docs/features/_TEMPLATE/SPEC.md:314; docs/fix/_TEMPLATE/SPEC.md:100,119; decisions.md ED5 ("Proposal for separate user triage") | folded | Owner resolved F5 in session (2026-09-10): option 1 — the `Hardening & PR` exception is sanctioned in the rule owner and the amendment lands inside this PR. New P1 amends `skills/phase-contract/SKILL.md` rule 1 (v1.0.1 → 1.0.2) + `npm run bundle:skills`; SPEC §Design box-1 re-pointed verbatim to the amended owner (no local semantics); plan re-cut to 5 phases; AC8/O12 re-scoped to "amended in this PR, not re-edited" | 37-plan-3 |
| F6 | plan | low | plan | c55328a451c065c3f0381ac8ed55eee54704561caa59e9b0f4c3b9fbf1140780 | AC8/O8's validator `grep -n "phase-lint.mjs" … skills/execute-phase/` passes a directory without `-r`: GNU grep never descends and prints `grep: skills/execute-phase/: Is a directory`, so "matches in all three" is unobservable as written — the validator as copied into ACCEPTANCE and O8 cannot demonstrate its required outcome | ACCEPTANCE.md AC8 validator cell; planning-obligations.md O8 validator cell; observed run at HEAD 0e39cbe (exit 2, no directory matches) | folded | AC8 and O8 third grep target corrected from `skills/execute-phase/` to `skills/execute-phase/SKILL.md` | 37-plan-3 |
| F7 | plan | low | plan | c55328a451c065c3f0381ac8ed55eee54704561caa59e9b0f4c3b9fbf1140780 | Dev scenario `lint:threshold` (9-task phase → `BLOCKED — box 3`) has no owning task: P1's corpus task enumerates only valid/invalid/ambiguous-layer/no-phases/missing-plan fixtures and P4's edge-corpus task names only oversized/permission-denied/concurrent — the threshold fixture dies between scenario and task (L5) | SPEC.md §Dev scenarios (lint:threshold row); TASKS.md P1 task 5, P4 task 2; SPEC.md §Design → Corpus | folded | P2's corpus task now includes the 9-task threshold fixture (expected `BLOCKED — box 3`); SPEC §Design Corpus updated to own the `lint:threshold` scenario | 37-plan-3 |
```
