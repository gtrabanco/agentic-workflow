# review-findings — fix/286-affecting-path-receipt-binding

Mark and finding shapes are owned by `skills/pre-execution-review/references/LEDGERS.md`
(`review-mark@1` / `finding-mark@1` — cited, not re-declared).

Axes run at HEAD `2d222a88` (post review-finding fold): code/correctness (the
judge is pure and shared by both consumers — no drift surface; the marker regex
keeps its strictness and the scope attribute is hex-validated at parse **and**
at the body builder), security (scope values are 64-hex validated before they
touch marker bytes — one review finding folded at 2d222a88; git invocations are
spawnSync argv arrays, no shell interpolation; the non-affecting class list is
a closed, fail-closed vocabulary), perf (one extra `git diff --name-only` per
stale-by-sha check — negligible), verify (all gates re-run live: repo 626/0,
budgets PASS), a11y/brand/seo — n/a (no UI or user-facing copy).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD 2d222a88bd7c3e5d9c17402b00dcd90b29bdbd14 | n/a | n/a | review-mark | n/a | n/a |
| F1 | scripts/review-receipt.mjs (renderReceiptBody) | security | med | fix-now | fold into current phase (source: validate the scope value 64-hex at the body builder, red test) · fold 2d222a88 | yes |
| F2 | scripts/audit-pr-gate.mjs, scripts/review-receipt.mjs | workflow | high | fix-now | /review-change (re-review at the head), then re-run /audit-pr | no |
| F3 | scripts/pre-execution-snapshot.mjs, docs/fix/286-affecting-path-receipt-binding/ | workflow | high | fix-now | /unit-lane 286-affecting-path-receipt-binding (lane review step re-derives the artifact; enforcer alignment tracked by #285 / PR #287), then re-run /audit-pr | no |
| REVIEW-RAN | HEAD de71f51548729de10a0346e655deea31f46ef81f | n/a | n/a | review-mark | n/a | n/a |
| F4 | scripts/scope-manifest.mjs:92,125-127 | code | high | fix-now | fold into current phase (hash the blob bytes — `sha256Bytes`/`createHash` — not the ToString-coerced string; binary-blob fixture) · fold 4e8d638 | yes |
| F5 | scripts/scope-manifest.mjs:105-109 | security | high | fix-now | fold into current phase (`git diff --name-only --no-renames`; R100-move-into-non-affecting regression test) · fold 4e8d638 | yes |
| F6 | scripts/audit-pr-gate.mjs:341 vs :351 | security | high | fix-now | fold into current phase (thread `changedPaths` into the `comment` branch; evaluate/comment agreement test) · fold 4e8d638 | yes |
| F7 | scripts/scope-manifest.mjs:105 | code | med | fix-now | fold into current phase (resolve the merge base before the delta; main-advanced test) · fold 4e8d638 | yes |
| F8 | scripts/review-receipt.mjs:132-136,148 | security | med | fix-now | fold into current phase (re-derive and compare the scope manifest at judge time) · fold 4e8d638 | yes |
| F9 | scripts/scope-manifest.mjs:123-125 | perf | med | fix-now | fold into current phase (one `git cat-file --batch` for the blob set) · fold 4e8d638 | yes |
| F10 | CHANGELOG.md · docs/workflow/SKILL_CONTEXT_BUDGETS.json · README.md · skills/audit-pr/SKILL.md · SPEC `Depends on` | workflow | high | fix-now | rebase onto #287, re-run bump-skill + budget re-base with a single `audit-pr` version, correct the false SPEC "Depends on: None" · fold 4e8d638 | yes |
| F11 | docs/fix/286-affecting-path-receipt-binding/review-findings.md (F2/F3 rows) | workflow | med | fix-now | fold into current phase (normalize `axis`/`file:line` columns to the ledger schema; re-commit as `docs`) | yes |

Cycle 2 — independent review at HEAD `de71f515` (2026-10-05). Axes run: code,
security, verify, perf (all four FAIL); workflow/spec-drift (FAIL); design /
a11y / brand / SEO — n/a (no UI or user-facing copy). Workspace precondition:
clean tree, branch in sync with `origin`. Cycle-2 re-verification: F1 (folded
at `2d222a88`) re-checked at its cited location — the 64-hex validation at the
receipt body builder is present, defect gone. F2 and F3 re-confirmed open
(`review-receipt.mjs verify --pr 288` → exit 3 `missing-review-receipt`; the
plan-stage lineage gate still refuses a lane-era unit until #285/PR #287 lands).
Escalation: full pass, not delta — `de71f515` touches a file outside the folded
rows' cited paths and the batch exceeds 200 changed lines. Low findings (G–J)
are report-only notes, never ledger rows.

Cycle 3 — independent review at HEAD `e2b36294` (2026-10-05), a fresh context,
invoked by the user after the two-cycle cap was already reached (cycle-1 mark
`2d222a88`, cycle-2 mark `de71f515`; both folds landed). Axes run: code,
security, verify, perf (all four FAIL); workflow/spec-drift (FAIL); design /
a11y / brand / SEO — n/a (no UI or user-facing copy). Workspace precondition:
clean tree, branch in sync with `origin`. Cycle-3 re-verification of every
`folded: yes` row: F1/F4/F5/F6 repaired at their cited locations; F7 only
partially — the `mergeBase` resolution landed in `scope-manifest.mjs` but not in
the `review-receipt.mjs --scope-base` emitter (F16), so the two derivations
disagree; F8 (F14), F9 (F15), F10 (F12) and F11 (F13) are provably not repaired.
The `folded: yes` flags on F5–F9 were written by `e2b36294` as **duplicate rows**
instead of flipping the existing `folded: no` rows, so the ledger carries each of
F5–F9 twice with contradictory values. Escalation: full pass, not delta —
`e2b36294` changes files far outside the folded rows' cited paths (22 changed
files, 1378 lines, versus the delta width and size guards). Two consecutive
unconverged cycles → `CONVERGENCE-ANOMALY` declared in the cycle-3 report.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD e2b362940ebd0d8a487395072c59c25a5834df9a | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD e2b362940ebd0d8a487395072c59c25a5834df9a | node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD e2b362940ebd0d8a487395072c59c25a5834df9a | bun scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD e2b362940ebd0d8a487395072c59c25a5834df9a | (cd packages/agentic-workflow-schema && bun run test) | exit 0 |
| F12 | CHANGELOG.md:76,557,681,725 · packages/agentic-workflow-schema/package.json:3 · docs/workflow/SKILL_CONTEXT_BUDGETS.json · docs/fix/285-pre-execution-lineage-gate/SPEC.md | workflow | high | fix-now | regression of F10 — fold: `e2b36294` pulled #285's release metadata into PR #288 without #285's code. Revert the schema version + test pins to 4.5.0 and drop the 4.6.0 / audit-pr-285-half / `unit-lane` 1.3.0 / `pre-execution-review` 2.7.0 CHANGELOG rows, the 285 `referenceSources`, and the 285 SPEC file (land them from #287 after it merges); or implement 285 here | no |
| VF-12 | CHANGELOG.md:76 · reviewer review-change · HEAD e2b362940ebd0d8a487395072c59c25a5834df9a · recheck direct read: `git diff c5aa61ab..HEAD -- packages/agentic-workflow-schema/src/` is empty and `src/pre-execution.ts:579` still reads `Object.freeze({ spec: [spec], plan: [spec, acceptance] })` while CHANGELOG.md:76 claims the plan set drops `acceptance`; `skills/pre-execution-review/references/SNAPSHOT.md:31` still says both are required; `skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:91` still requires `progress.md`; `skills/unit-lane/` carries no ledger text; `git show e2b36294 --name-status` adds the 285 SPEC | workflow | confirmed | finding-mark | n/a | n/a |
| F13 | docs/fix/286-affecting-path-receipt-binding/review-findings.md:24-33 | workflow | med | fix-now | regression of F11 — fold: delete the duplicate F5–F9 rows `e2b36294` appended (keep one row per id with the true `folded` value) and normalize F2/F3's `axis`/`file:line` cells (still `Review receipt` / `Pre-execution lineage` and prose, neither a schema axis nor a `file:line`). The F11 fold at `4e8d638` never touched this file | no |
| VF-13 | docs/fix/286-affecting-path-receipt-binding/review-findings.md:24-33 · reviewer review-change · HEAD e2b362940ebd0d8a487395072c59c25a5834df9a · recheck direct read: `git show 4e8d638 -- docs/fix/286-affecting-path-receipt-binding/review-findings.md` is empty (the F11 fold never landed), `grep -c` for the F5–F9 ids returns 10 rows (each id twice, `folded: yes` and `folded: no`), and F2/F3's `axis` cells are unchanged since `de71f515` | workflow | confirmed | finding-mark | n/a | n/a |
| F14 | scripts/review-receipt.mjs:145-155 | security | med | fix-now | regression of F8 — fold: re-derive the scope digest at judge time and pass **that** as `scopeManifest`, or delete the unreachable comparison and its comment. Every call site passes the recorded digest (`review-receipt.mjs:409,452`; `audit-pr-gate.mjs:98`), so any 64-hex `scope=` is accepted; red test: a forged `scope=ffff…` over a foreign delta must void | no |
| VF-14 | scripts/review-receipt.mjs:151-152 · reviewer review-change · HEAD e2b362940ebd0d8a487395072c59c25a5834df9a · recheck failing reproducer: throwaway repo, receipt marker `scope=ffff…64` at HEAD, one `docs/LOGS.md` commit, `review-receipt.mjs verify --head <new head>` → exit 0 `status: current`, `reason: non-affecting head delta` (an all-zero digest behaves identically) | security | confirmed | finding-mark | n/a | n/a |
| F15 | scripts/scope-manifest.mjs:148 | perf | med | fix-now | regression of F9 — fold: one `git cat-file --batch` over the blob set instead of `git show` per changed path. Measured: 400-path delta 2.38 s (1671 ms in the spawn loop), 2000-path 10.06 s, batched equivalent 99 ms | no |
| VF-15 | scripts/scope-manifest.mjs:148 · reviewer review-change · HEAD e2b362940ebd0d8a487395072c59c25a5834df9a · recheck measured on a throwaway fixture: `scope-manifest.mjs sign` on a 400-path delta → 2.38 s vs 99 ms for one `git cat-file --batch` over the same blobs; source still reads `const blob = gitRun("show", \`${head}:${rel}\`)` inside the per-path loop, and `git show 4e8d638` shows no batching was added | perf | confirmed | finding-mark | n/a | n/a |
| F16 | scripts/review-receipt.mjs:374 | code | med | fix-now | regression of F7 — fold: resolve `mergeBase(base, head)` before `affectingPathsAt` in the emitter too, as `scope-manifest.mjs:201-202` already does. Reproducer: after main advances, `sign` scope `fd29ae16…` vs `render --scope-base main` scope `129cd5f6…` for one base/head | no |
| VF-16 | scripts/review-receipt.mjs:374 · reviewer review-change · HEAD e2b362940ebd0d8a487395072c59c25a5834df9a · recheck failing reproducer: temp repo, main advances while a feature branch is open, then `scope-manifest.mjs sign --base main` → scope `fd29ae1614606ba2ea01c1b9162872bbb2650d90dfb225e411e5aadc58125391` vs `review-receipt.mjs render --head <same> --scope-base main` → `scope=129cd5f6f1a43c7d3d43f006ea1c235c7387433e2c52dd67261a94d142d0c745` | code | confirmed | finding-mark | n/a | n/a |
| F17 | skills/review-change/SKILL.md:27-31 · docs/fix/286-affecting-path-receipt-binding/SPEC.md:146 | spec-drift | med | fix-now | fold: restore the `--scope-base` receipt guidance `e2b36294` deleted from the box (AC7 requires it) and correct the SPEC Evidence row that claims both closeout surfaces pass it (`grep -c scope-base skills/review-change/SKILL.md` → 0; only `PERSIST_AND_DECIDE.md:64,67` matches) | no |
| VF-17 | skills/review-change/SKILL.md:27-31 · reviewer review-change · HEAD e2b362940ebd0d8a487395072c59c25a5834df9a · recheck direct read + command: the box's `emit` example carries no scope flag; `grep -n scope-base skills/review-change/SKILL.md skills/review-change/references/PERSIST_AND_DECIDE.md` matches only the reference file; `git show e2b36294 -- skills/review-change/SKILL.md` removes the paragraph `72317a06` added | spec-drift | confirmed | finding-mark | n/a | n/a |
| F18 | docs/fix/README.md:22 | workflow | med | fix-now | fold: the #286 row reads `pending` (legend: SPEC drafted, branch not yet open) while PR #288 is open and built; `2cfafbd7` set `done · #288` and `e2b36294` reverted it | no |
| VF-18 | docs/fix/README.md:22 · reviewer review-change · HEAD e2b362940ebd0d8a487395072c59c25a5834df9a · recheck direct read: `docs/fix/README.md:22` reads `` `pending` ``, its own legend says `pending` = SPEC drafted, branch not yet open, and `git show e2b36294 -- docs/fix/README.md` shows the `done · #288` value `2cfafbd7` wrote being replaced by `pending` | workflow | confirmed | finding-mark | n/a | n/a |
