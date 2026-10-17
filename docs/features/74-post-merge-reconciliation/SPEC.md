---
type: feature
scope: medium
---

# 74 — post-merge-reconciliation

> One-line: post-merge reconciliation of issues #270 (PR #280) and #272 (PR #276) — one review pass over the union plus repair of whatever the combination breaks.

## Objective

Both branches of the overlap (#270 → PR #280, #272 → PR #276) are merged. Issue #275 owns the combination: one review pass over the **union** diff (branch-level verdicts do not cover it), repair of cross-PR drift (PLAN.md sections, budget ceilings, roadmap/CHANGELOG hygiene, MCP hygiene), and a green full gate on merged `main`.

## Why

The two PRs were reviewed independently. `git merge-tree` (2026-09-29, issue body) predicted a PLAN.md conflict, independently re-based budget ceilings that can exceed both branches' values, and roadmap rows 69/70 racing on the same insertion point. Each merge landed cleanly as a text matter; the issue exists to verify the *combination* rather than assume it.

## User outcome

A lane operator merging both PRs gets: a `review-change` receipt recorded against the merged result, a `unit-lane` PLAN step that carries both #270's prior-decisions sweep and #272's phase-block plan, `check-skill-context --routes` green with ceilings that name their growth source, ordered roadmap/CHANGELOG records, and a green `node --test scripts/*.test.mjs` on `main`.

## Acceptance criteria

From the issue's draft ACs (each already command-verifiable):

1. A `review-change` receipt exists for the merged result covering both PRs' union.
2. `skills/unit-lane/references/PLAN.md` holds both sections, no conflict markers, format still owned by `phase-contract`.
3. `bun scripts/check-skill-context.mjs --routes` green over the merged tree; every re-based ceiling names its growth source.
4. CHANGELOG version-table + package-versions checks green with #273's and #270's rows combined; ROADMAP rows 69 → 70 in order.
5. No `.pi/mcp*` path appears in either PR's diff.
6. `node --test scripts/*.test.mjs` green on merged `main`.

## Non-goals

- The MCP migration itself (owned by its own feature/window).
- Implementing #274 (pi tool surface) or any new capability.
- Re-opening #270/#272's own scope — this unit only reviews the combination and repairs what the combination breaks.
- No pi 0.99 semantic work: those decisions live in #201, #269, #274 and the MCP feature.

## Future

none

## Future cost

None — one-time reconciliation; no standing rule introduced.

## Applicable tests

`node --test scripts/*.test.mjs` (full repo suite, AC-06) and `bun scripts/check-skill-context.mjs --routes` (AC-03).

## Known pre-existing issues

- Stray MCP files (`.pi/mcp-adapter.json`, `.pi/mcp.json`) were observed uncommitted in the working tree during #272's execution — does-not-affect this unit (tree verified clean 2026-10-17; they belong to the MCP feature window).

## Tasks

- P1 — Verify the mechanical reconciliation items that the merges may already have satisfied (PLAN.md both sections + no markers; route budgets; roadmap rows 69→70; CHANGELOG tables; no `.pi/mcp*` in either PR diff; full suite green) and record per-AC evidence. (validator: `node --test scripts/*.test.mjs && bun scripts/check-skill-context.mjs --routes` both exit 0)
- P2 — Run the review pass over the union diff of PR #280 + PR #276 (files, skills, budgets, records the branches share), classify findings, record the receipt against the merge state. (validator: `grep -c "REVIEW-RAN" docs/features/74-post-merge-reconciliation/review-findings.md` exits with code 0 and prints at least 1)
- P3 — Repair the fix-now findings from P2 that this unit owns (the unit doc's own lint-blocked validator spans); findings owned by another unit's surface are persisted and routed, never repaired here. (validator: `node scripts/phase-lint.mjs docs/features/74-post-merge-reconciliation/SPEC.md` prints `verdict PASS`)

### Prior-decisions sweep

| claim | prior decision | source path | relation |
|---|---|---|---|
| one PR for this unit, based on `main` | "One PR per unit of work, always against `main`" | AGENTS.md (Working rules) | compatible |
| unit doc + review receipt in English | "Docs language is English-only (interim)" | AGENTS.md (Working rules) | compatible |
| PLAN.md keeps both sections, format owned by `phase-contract` | phase-contract 1.1.0 owns the two phase grammars and the PLAN format (fix #272) | skills/phase-contract/SKILL.md:4 | compatible |
| budget ceilings carry declared growth sources | "every ceiling raise names its real growth source in the commit and changelog row" | docs/workflow/SKILL_CONTEXT_BUDGETS.json (policy.rules) | compatible |

Clean — no `contradicts` row; the plan proceeds.

## Planning evidence

XS/S unit — embedded. Claims: PLAN.md carries both sections on `main` (verified 2026-10-17: `## Prior-decisions contradiction sweep` present, no markers); route budget table passes `--routes` (14 routes, PASS); roadmap rows 69 then 70 present and ordered; full suite 663/663 pass at HEAD 3844c1ae; PR diffs #280/#276 contain no `.pi/mcp*` path.

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O-74-1 | Issue #275 scope item 1 | review receipts cover PR combinations, not only branches | P2 | P2 | review-change pass over union | review-findings.md verdict row | verdict | verified |
| O-74-2 | Issue #275 scope item 2 | PLAN.md format ownership stays with phase-contract | P1 | P1 | `phase-contract` version/grammar unchanged | grep no markers + both sections present | grep output | verified |
| O-74-3 | Issue #275 scope items 3–6 | budgets/records/gates green on merged main | P1 | P1 | scripts as cited in ACs 3–6 | commands exit 0 | command output | verified |

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC-2 | `grep -c "^## Prior-decisions contradiction sweep" skills/unit-lane/references/PLAN.md` + `grep -c "<<<<<<<\|>>>>>>>" skills/unit-lane/references/PLAN.md` | 1 · 0 | sweep section present; zero conflict markers | claude (sonnet, session) |
| AC-3 | `bun scripts/check-skill-context.mjs` + `--routes` | 0 · PASS | route budgets: 14 routes PASS; ceilings carry declared growth sources (policy.rules; rows "feature 69 / issue #270", "fix #272 (unit-doc bullet grammar)") | claude (sonnet, session) |
| AC-4 | `node --test scripts/*.test.mjs` (rendered-facts checks) + `grep -c "^| 69 \|^| 70 " docs/features/ROADMAP.md` | 0 · 2 | suite green incl. CHANGELOG version-table/package-versions; roadmap rows 69 then 70 in order | claude (sonnet, session) |
| AC-5 | `gh pr diff 280 --name-only \| grep -ci mcp || true` ×2 (also PR #276) | 0 · 0 | zero `.pi/mcp*` paths in either merged PR's diff | claude (sonnet, session) |
| AC-6 | `node --test scripts/*.test.mjs` | 0 | tests 663, pass 663, fail 0 | claude (sonnet, session) |
| AC-1 | `grep -c "REVIEW-RAN" docs/features/74-post-merge-reconciliation/review-findings.md` | 0 · 1 | union receipt present: 5 isolated axes (code FAIL→RC-1 routed, verify FAIL→V1 folded, security/perf/brand PASS), verdict REVIEW-FAIL with the one open fix-now routed to the fix/272 surface | claude (sonnet, session) + 5 isolated reviewers |

## Triaged steps

```
TRIAGE — 74-post-merge-reconciliation (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

## Progress log

2026-10-17 08:45 — unit doc created from issue #275 (from-issue route) — next: triage
2026-10-17 08:52 — research step: per-AC state verified at HEAD 3844c1ae (PLAN.md both sections/no markers, `--routes` 14 PASS, roadmap 69→70 ordered, suite 663/663, no `.pi/mcp*` in PR #280/#276 diffs; budget growth sources declared incl. "feature 69 / issue #270" and "fix #272" rows) — next: design
2026-10-17 08:56 — design step: ACs adopted from issue #275's draft; gap interview closed with 3 recorded decisions (review depth, receipt home, AC adoption), 2 assumptions; `## Future` = none — next: plan
2026-10-17 09:00 — plan step: prior-decisions sweep clean (4 compatible rows, 0 contradicts); ledgers embedded (XS/S home) — next: implement
2026-10-17 09:08 — implement P1: mechanical AC verification at HEAD 70a18b81 (AC-2/3/4/5/6 rows recorded; AC-1 pending the P2 review pass) → 7f8427d5 — next: tests
2026-10-17 09:12 — tests step: full gate re-run at 7f8427d5 — 663/663 pass, fail 0; `--routes` PASS 14 routes — next: review (P2 union pass)
2026-10-17 09:20 — evidence step: AC-2…AC-6 rows present from P1 runs (re-runnable as written); AC-1 row lands with the P2 review receipt — next: review (5 isolated axis reviewers spawned over the union diff)
2026-10-17 09:45 — review P2: 5 isolated axis reviewers over the union diff — code FAIL (RC-1 med: fenced `## Tasks` hijack, reproduced, routed to fix/272 surface per non-goals), verify FAIL (V1 major: this doc's own validator spans lint-BLOCKED), security/perf/brand PASS — next: P3 fold
2026-10-17 09:55 — implement P3: fold F-74-2 (validator spans rewritten to the enforced shape; `phase-lint` verdict PASS 6/6 ×3) → 7d075a8a — next: review ledger + docs
2026-10-17 10:05 — review step closed: fused receipt at docs/features/74-post-merge-reconciliation/review-findings.md (AC-1 evidence row recorded) → 06fc50af — next: docs
2026-10-17 10:10 — branch hygiene: lane commits moved from local main to 74-post-merge-reconciliation (main reset to origin/main; no push happened) — next: docs step
2026-10-17 10:12 — docs step: roadmap row 74 registered (in-progress · #275, ordered after row 73); no CHANGELOG row (no skill/package surface touched; bump-skill n/a); SPEC ## Next re-pointed → next: release
2026-10-17 10:20 — release step: diff-guard PASS (191/4); branch pushed; PR #298 opened with `Closes #275` + Evidence table; References block written; roadmap row 74 flipped to `done · [#298]` → next: unit close-out

## Next

PR #298 is not merge-ready until the open fix-now findings are resolved:
- /triage-issue on F-74-1 — no tracked issue exists for the fenced `## Tasks` defect in `scripts/unit-doc-phases.mjs`; F-74-9 is the deferral that needs triage
- /review-change 74-post-merge-reconciliation — the PR carries no `REVIEW-PASS` marker (F-74-7, `bun scripts/review-receipt.mjs verify --pr 298` → absent, exit 3)

Once both are closed and a passing review exists at the PR head, /audit-pr is the merge gate. Owner-only merge per the merge-guard convention.

## References

- Closes [#275](https://github.com/gtrabanco/agentic-workflow/issues/275)
- PR: https://github.com/gtrabanco/agentic-workflow/pull/298
- Branch: `74-post-merge-reconciliation`
- Commit: 6a7c1999 (head at PR open)
- Issue [#270](https://github.com/gtrabanco/agentic-workflow/issues/270) / PR [#280](https://github.com/gtrabanco/agentic-workflow/pull/280) (review-conformance, merged)
- Issue [#272](https://github.com/gtrabanco/agentic-workflow/issues/272) / PR [#276](https://github.com/gtrabanco/agentic-workflow/pull/276) (phase-lint unit-doc grammar, merged)
- PR [#273](https://github.com/gtrabanco/agentic-workflow/pull/273) (pi-tui peerDependencies + 0.99.1 re-basis, merged)
- Roadmap rows 69, 70
