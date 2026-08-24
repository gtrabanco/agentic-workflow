| id | file:line | axis | severity | class | route | folded |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | packages/agentic-workflow-schema/src/index.ts:3641-3753 | correctness + verify + API ergonomics | high | fix-now | fold into current phase | yes |
| F2 | packages/agentic-workflow-schema/src/index.ts:3209 | spec-drift + correctness + API ergonomics | high | fix-now | fold into current phase | yes |
| F3 | packages/agentic-workflow-schema/src/index.ts:3761-3810 | correctness + verify + API ergonomics | high | fix-now | fold into current phase | yes |
| F4 | packages/agentic-workflow-schema/verification-plan.schema.json:37-69 | correctness + security + verify + API ergonomics | high | fix-now | fold into current phase | yes |
| F5 | packages/agentic-workflow-schema/src/index.ts:3315-3451 | correctness + security + API ergonomics | high | fix-now | fold into current phase | yes |
| F6 | packages/agentic-workflow-schema/src/index.ts:3165-3182 | security | high | fix-now | fold into current phase | yes |
| F7 | packages/agentic-workflow-schema/src/index.ts:3591-3604 | performance | high | fix-now | fold into current phase | yes |
| F8 | packages/agentic-workflow-schema/src/index.ts:3528-3539,3713-3717 | API ergonomics | med | fix-now | fold into current phase | yes |
| F9 | packages/agentic-workflow-schema/README.md:222-257 | API ergonomics + documentation | med | fix-now | fold into current phase | yes |
| F10 | docs/features/26-staged-verification-contracts/ACCEPTANCE.md:12 | verify + spec-drift | high | fix-now | fold into current phase | yes |
| F11 | docs/features/26-staged-verification-contracts/progress.md:1 | workflow | high | fix-now | fold into current phase | yes |
| F12 | docs/features/26-staged-verification-contracts/progress.md:57-59 | workflow | high | fix-now | fold into current phase | yes |
| F13 | packages/agentic-workflow-schema/src/index.ts:3644-3650,3742-3754 | code + security + verify + API ergonomics/docs + spec-drift | high | fix-now | fold into current unit with shared required-set tests | yes |
| F14 | packages/agentic-workflow-schema/src/index.ts:3764-3812 | code + verify + API ergonomics/docs + spec-drift | high | fix-now | fold into current unit | yes |
| F15 | packages/agentic-workflow-schema/verification-plan.schema.json:38-59 | code + verify + API ergonomics/docs + spec-drift | high | fix-now | fold into current unit with shared AJV fixtures | yes |
| F16 | packages/agentic-workflow-schema/src/index.ts:3424-3464 | code + security + verify | high | fix-now | fold into current unit with parity regressions | yes |
| F17 | packages/agentic-workflow-schema/src/index.ts:3161-3182 | security + code | high | fix-now | fold into current unit with cross-platform path tests | yes |
| F18 | packages/agentic-workflow-schema/src/index.ts:3596-3608 | perf + code | high | fix-now | fold into current unit | yes |
| F19 | packages/agentic-workflow-schema/README.md:268-304 | API ergonomics/docs + verify | med | fix-now | fold into current unit; update EN and ES together | yes |
| F20 | packages/agentic-workflow-schema/src/index.ts:3715-3721 | API ergonomics/docs + spec-drift | high | fix-now | fold into current unit | yes |
| F21 | packages/agentic-workflow-schema/src/index.ts:3658-3708 | code + perf + API ergonomics/docs | low | fix-now | fold into current unit with F14 | yes |
| F22 | docs/features/26-staged-verification-contracts/TASKS.md:64-70 | workflow | high | fix-now | fold into current unit before completion is re-attested | yes |
| F23 | docs/features/26-staged-verification-contracts/review-findings.md:3-10 | workflow + verify | high | fix-now | fold after root-cause fixes are verified | yes |
| F24 | packages/agentic-workflow-schema/src/index.ts:3703-3719 | code | minor | fix-now | dead code `_canonObj` and `_canon` never called | yes |
| F25 | packages/agentic-workflow-schema/src/index.ts:3729 | code | minor | fix-now | unnecessary `_sha256` wrapper indirection over sha256Hex | yes |
| F26 | packages/agentic-workflow-schema/src/index.ts:3791-3794 | code | minor | fix-now | redundant `incomplete-stage-coverage` loop (logically unreachable) | yes |
| F28 | packages/agentic-workflow-schema/test/release-contract.test.mjs:62 | verify | minor | fix-now | npm-pack test omits new schema files from required list | yes |
| F30 | docs/features/26-staged-verification-contracts/TASKS.md:66-70 | workflow | high | fix-now | P5 checkboxes 66-70 remain unchecked despite work verified done (roadmap flipped, PR #145 open, branch remote-current) | yes |
| F31 | packages/agentic-workflow-schema/src/index.ts:3725-3764 | code + verify + API ergonomics/docs + spec-drift | high | fix-now | replan-in-unit: define distinct reachable freshness outcomes, then fresh Hardening & PR | yes |
| F32 | packages/agentic-workflow-schema/src/index.ts:3774-3808 | code + verify + API ergonomics/docs + spec-drift | high | fix-now | replan-in-unit: publish fixed immutable vectors with independent TS/JSON-Schema tests | yes |
| F33 | packages/agentic-workflow-schema/src/index.ts:3735-3748 | code | high | fix-now | replan-in-unit: validate before hashing/dereferencing and prove no-throw behavior | yes |
| F34 | packages/agentic-workflow-schema/src/index.ts:3714-3716 | code + API ergonomics/docs + spec-drift | med | fix-now | replan-in-unit: remove the unspecified public synchronous digest surface | yes |
| F35 | packages/agentic-workflow-schema/README.md:267-320 | API ergonomics/docs + verify | high | fix-now | replan-in-unit: synchronize compilable EN/ES examples and add a compile test | yes |
| F36 | packages/agentic-workflow-schema/src/index.ts:2993-3001 | API ergonomics/docs + security | high | fix-now | replan-in-unit: freeze exported vocabularies and add immutability tests | yes |
| F37 | packages/agentic-workflow-schema/package-lock.json:3-8 | API ergonomics/docs + workflow | med | fix-now | replan-in-unit: regenerate release metadata and verify the packed artifact | yes |
| F38 | docs/features/26-staged-verification-contracts/progress.md:60-64 | workflow + spec-drift | high | fix-now | replan-in-unit: refresh progress only after corrective phases and final gates | yes |
| F39 | docs/features/26-staged-verification-contracts/review-findings.md:6,29,31 | workflow + spec-drift | high | fix-now | replan-in-unit: restore the fixed ledger schema and remove non-fix-now rows | yes |