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
| F2 | audit-pr Step 1 receipt gate — `bun scripts/review-receipt.mjs verify --pr 288` → exit 3 `missing-review-receipt` at head 2cfafbd7 (no `review-change:pass` marker on PR #288) | Review receipt | high | fix-now | /review-change (re-review at the head), then re-run /audit-pr | no |
| F3 | docs/fix/286-affecting-path-receipt-binding/ — no `## Pre-execution review receipt v1 — plan` (no progress.md); `pre-execution-snapshot.mjs verify --stage plan --unit 286-affecting-path-receipt-binding` → exit 1 `required artifact(s) absent: .../ACCEPTANCE.md` | Pre-execution lineage | high | fix-now | /unit-lane 286-affecting-path-receipt-binding (lane review step re-derives the artifact; enforcer alignment tracked by #285 / PR #287), then re-run /audit-pr | no |
| REVIEW-RAN | HEAD de71f51548729de10a0346e655deea31f46ef81f | n/a | n/a | review-mark | n/a | n/a |
| F4 | scripts/scope-manifest.mjs:92,125-127 | code | high | fix-now | fold into current phase (hash the blob bytes — `sha256Bytes`/`createHash` — not the ToString-coerced string; binary-blob fixture) | no |
| F5 | scripts/scope-manifest.mjs:105-109 | security | high | fix-now | fold into current phase (`git diff --name-only --no-renames`; R100-move-into-non-affecting regression test) | no |
| F6 | scripts/audit-pr-gate.mjs:341 vs :351 | security | high | fix-now | fold into current phase (thread `changedPaths` into the `comment` branch; evaluate/comment agreement test) | no |
| F7 | scripts/scope-manifest.mjs:105 | code | med | fix-now | fold into current phase (resolve the merge base before the delta; main-advanced test) | no |
| F8 | scripts/review-receipt.mjs:132-136,148 | security | med | fix-now | fold into current phase (re-derive and compare the scope manifest at judge time) | no |
| F9 | scripts/scope-manifest.mjs:123-125 | perf | med | fix-now | fold into current phase (one `git cat-file --batch` for the blob set) | no |
| F10 | CHANGELOG.md · docs/workflow/SKILL_CONTEXT_BUDGETS.json · README.md · skills/audit-pr/SKILL.md · SPEC `Depends on` | workflow | high | fix-now | rebase onto #287, re-run bump-skill + budget re-base with a single `audit-pr` version, correct the false SPEC "Depends on: None" | no |
| F11 | docs/fix/286-affecting-path-receipt-binding/review-findings.md (F2/F3 rows) | workflow | med | fix-now | fold into current phase (normalize `axis`/`file:line` columns to the ledger schema; re-commit as `docs`) | no |

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
