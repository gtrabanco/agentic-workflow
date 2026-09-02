# Progress — fix/157-claude-skills-self-mount

## Pre-execution review receipt v1 — plan
- Review: rp-fix157-20260902-001 · Snapshot: fe999383fa12801b80b787d3c9c6542267afb0fcba421f0d151696b03de99b8b · Verdict: plan-review-pass
- Unit: fix-157 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent note: fix unit — no Product half exists (D6)
- Source revision: 5b38ae6bc8a5d6eb499ab680f1f03cdb9e8017c9 · Artifact revision: 5b38ae6bc8a5d6eb499ab680f1f03cdb9e8017c9
- Reviewer: review-plan clean-context turn · Session: 20260902-plan-review · Role: reviewer · Author: plan-fix (draft commit 5b38ae6b)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-02T14:27:31Z/2026-09-02T14:27:31Z · Findings: 0 (material open: 0)
- Ledgers read: planning-evidence 8 rows · obligations 9 rows (verified-capable: 0)
- Prior plan receipt (re-review only): none — first cycle
- Note: artifact revision is the content-derived identity (the plan-draft commit that last touched the bound paths); no separate id rotates it — mutate-and-revert detection depends on this handoff (no runtime enforcement in this review)

## Execution receipt v1
- Phases: P1 (untrack mount) + P2 (dogfooding docs) + P3 (hardening & PR) completed
- PR: https://github.com/gtrabanco/agentic-workflow/pull/158
- All acceptance criteria verified: AC1-AC8 pass; AC9 was NOT verified as written —
  corrected in Execution receipt v2 below (ledger finding F2)
- Tree clean, branch pushed, PR open against main

## Acceptance receipt v1
- Manifest: `docs/fix/157-claude-skills-self-mount/ACCEPTANCE.md` · Blob: `9b7456a67370e7d9581e047bebdabbd0f6ccf14c` · Status: frozen · Verified: 2026-09-03

## Execution receipt v2 — review fold (F2 + F3)
- AC9 correction: the frozen manifest validator's exclusion list omits `.claude/skills`,
  so the literal command prints the branch's own symlink deletion (`D .claude/skills`)
  instead of no output. The required **outcome** of AC9 holds — `git diff --name-only
  main...HEAD` lists only allowlisted paths plus that deletion, and no `skills/`,
  `packages/`, `.claude-plugin/` or `template/` path is touched. Amending the frozen
  validator itself needs a user-approved SPEC amendment (ACCEPTANCE.md quality floor),
  tracked as open finding F1 — it is **not** folded here, and no validator was weakened.
- Ledger reconciliation (F3): completed P1/P2/P3 tasks are ticked in SPEC.md and
  obligations O1-O8 read `verified`; O9 reads `in-progress` (its validator is defective
  per F1, while its outcome is met).
- Intentionally unticked: P3 "Open the PR … the body includes `Closes #157`". PR #158
  carries no `Closes #157` line and no forge closing link (`closingIssuesReferences`
  empty; issue #157 still open). This is an out-of-queue discovery recorded for user
  triage, not fixed from this fold.
- Gate re-run at fold: `node scripts/check-skill-context.mjs` → exit 0 (`PASS context
  budgets: 39 skills`); `node --test scripts/normative-drift.test.mjs` → 16 pass / 0 fail.

## Acceptance receipt v2 — replacement manifest (F1)
- Manifest: `docs/fix/157-claude-skills-self-mount/ACCEPTANCE.md` · Blob: `fe01d7bcfb8e3209825e8d9833f50bda279ab08a` · Status: frozen · Verified: 2026-09-03
- Supersedes Acceptance receipt v1 (blob `9b7456a67370e7d9581e047bebdabbd0f6ccf14c`). Amendment trail: explicit user approval (`F1 -> a`) → dated `## Amendments` row in SPEC.md → this replacement manifest → this receipt.
- Strength retained: the amended filter excludes only this unit's own `.claude/skills` untrack. Falsification probe — feeding `skills/foo/SKILL.md` and `packages/pi-agentic-workflow/src/x.js` through the same command still reports both, so a real distribution-channel touch keeps failing AC9.

## Acceptance receipt v3 — replacement manifest (F10)
- Manifest: `docs/fix/157-claude-skills-self-mount/ACCEPTANCE.md` · Blob: `78218f2189f604d30912214f8b14ace48dafcd00` · Status: frozen · Verified: 2026-09-03
- Supersedes Acceptance receipt v2 (blob `fe01d7bcfb8e3209825e8d9833f50bda279ab08a`). Amendment trail: review-findings fold F10 → dated `## Amendments` row in SPEC.md → this replacement manifest → this receipt.
- Strength retained: the `$`-anchor filter prevents prefix-matching of exclusion rules (e.g. `.gitignore.bak`, `.claude/skills-old`); re-running the AC9 validator against the re-frozen manifest yields no output.

## Execution receipt v3 — review fold (F1)
- AC9 as re-frozen: `git diff --name-only main...HEAD | grep -vE '^(\.gitignore$|CLAUDE\.md$|README\.md$|README\.es\.md$|\.serena/|\.claude/skills$|docs/fix/)'` → no output, exit 1 → **PASS**. All nine criteria now verify against the re-frozen manifest bytes.
- SPEC.md: Acceptance 9 and manifest AC9 now carry the identical filter (dots escaped); obligation O9 flipped `in-progress → verified`.
- Still open and out of this unit's queue: PR #158 does not auto-close #157 (no `Closes #157` in the body, no forge closing link), so that P3 task stays unticked pending user triage.

## Execution receipt v4 — F8 resolution (user-verified, no re-plan needed)
- PR #158 body amended to carry `Closes #157` (fold F11, commit `237c11d6`); the forge now reports the closing reference: `closingIssuesReferences` → `#157`, totalCount 1 (GraphQL, verified at fold). Issue #157 auto-closes when PR #158 merges — its OPEN state until then is by design.
- SPEC.md Issue claim ("The PR closes it via `Closes #157`") now matches the forge; P3 task "Open the PR … body includes `Closes #157`" conditions all met (PR opened, URL printed in receipts, closing keyword present) → ticked with amendment note.
- Supersedes the stale note in Execution receipt v3 above; ledger row F8 flipped `folded: yes` (route `replan-in-unit` untouched per fold policy).
