# Planning findings — fix-191-handoff-review-fold-order

Reviewers append rows; only the stage's author resolves them (LEDGERS contract).
`info` is the only immaterial severity. `dismissed` requires counter-evidence
that falsifies the finding; `resolved` names the closing artifact revision.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| RP1-F1 | plan | low | plan | a96ad417c7f00b38f7916738345ca34e437d7e80412001d625d40d3d822e9a1e | Obligation task references (O1 "Tasks 1–4", O2 "Task 5", O3 "Tasks 3–4", O4 "Task 7", O5 "Task 8") don't match P1's 8 actual bullets (cycle-1 receipt finding). | cycle-1 receipt rp-fix191-20260908-001 (progress.md), SPEC `### Obligations` vs `### P1` | dismissed | Re-read at `190ef808`: O6–O8 task citations are exact, and O1's validator (`grep` across all of `skills/execute-phase/`) is strictly broader than the cited task set — no deliverable can be skipped, so the claimed failure mode is falsified; remaining imprecision is a bookkeeping citation, re-filed as info RP2-F1 | 190ef8082ee2aba59a76c1ba0298ca7721024e95 |
| RP1-F2 | plan | low | plan | a96ad417c7f00b38f7916738345ca34e437d7e80412001d625d40d3d822e9a1e | Fix-index row showed `pending` while the branch was open; should be `in-progress` (cycle-1 receipt finding). | cycle-1 receipt rp-fix191-20260908-001 (progress.md); docs/fix/README.md:17 | resolved | `docs/fix/README.md:17` now reads `in-progress · [#193](…pull/193)` (verified 2026-09-08 at `190ef808`) | 163ae34c198f5f64669cb9f6cd1fb2d821185a0e |
| RP2-F1 | plan | info | plan | 1882c268a544c016d038c3e4002f1dc748b1fe55aee964c7d94458521ff13750 | O1's task column cites P1 "Tasks 1–4" but the reorder deliverable also spans P1 tasks 5–6 (SKILL.md, BATCH_AND_PORTABILITY.md rewrites). | SPEC `### Obligations` O1 vs `### P1` bullets 5–6 | open | — | — |
| RP2-F2 | plan | info | plan | 1882c268a544c016d038c3e4002f1dc748b1fe55aee964c7d94458521ff13750 | O1–O5 statuses still read `planned` although P1/P2 executed and their evidence is recorded in the cycle-1 receipt / P1 progress entry. | SPEC `### Obligations` statuses; progress.md P1 entry | open | — (execute-phase flips `status` per LEDGERS §2 on its next phase completion, P3/P4) | — |
