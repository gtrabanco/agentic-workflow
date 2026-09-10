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
artifactRevisionId: 1ce16d1a84c7ed8c95e7a1128e295517d699bc53b1222624603a1e83f8046bec

| id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| F2 | plan | medium | plan | 1ce16d1a84c7ed8c95e7a1128e295517d699bc53b1222624603a1e83f8046bec | P4's recorded fingerprint says 7 tasks (`P4:hardening:7:hardening-pr`) but TASKS.md P4 lists 8 checkboxes; SPEC §Phase-lint and PLAN repeat the same wrong count — the fingerprint the linter is being built to compute does not match the plan it was computed from | SPEC.md §Phases → Phase-lint · SPEC §P4; TASKS.md P4 (8 rows); PLAN.md P4 | open | | |
| F3 | plan | medium | plan | 1ce16d1a84c7ed8c95e7a1128e295517d699bc53b1222624603a1e83f8046bec | The frozen box-1 heuristic FAILs any title-deliverable containing `&`, yet the template-mandated final phase title is `Hardening & PR` (`docs/features/_TEMPLATE/SPEC.md:314`, `docs/fix/_TEMPLATE/SPEC.md:119`); the plan's own P4 carries that title and claims `PASS (8/8)` — self-contradiction that BLOCKs this unit's P4 and every future template plan; heuristic also omits `/` from the joiner list the rule owner states (phase-contract rule 1: `+`, `,`, `&`, `and`/`y`, `/`) | SPEC.md §Design → Rule checks box-1; docs/features/_TEMPLATE/SPEC.md:314; docs/fix/_TEMPLATE/SPEC.md:119; skills/phase-contract/SKILL.md §The eight phase-lint rules rule 1 | open | | |
| F4 | plan | low | plan | 1ce16d1a84c7ed8c95e7a1128e295517d699bc53b1222624603a1e83f8046bec | PE-007 records roadmap row 37 status as `defined`; the actual row reads `planned` after scaffold | planning-evidence.md PE-007; docs/features/ROADMAP.md row 37 (working tree) | open | | |
