# Adversarial Review: feat/21-workflow-contract-consolidation

**Reviewer:** opencode adversarial pass
**Branch:** `feat/21-workflow-contract-consolidation`
**Date:** 2026-08-06
**Scope:** 82 files, ~4K additions, ~857 deletions, 24 commits

---

## Executive Summary

Feature 21 consolidates workflow contracts across the agentic-workflow skill pack. The overall design is sound: single-owner principles reduce duplication, route splitting improves context budgets, and the classifier-only `review-implementation` eliminates a redundant diff scan. Tests pass, SPEC ACs are covered, and file references resolve.

**Verdict: MERGE-READY with minor cosmetic items.** No blockers found.

---

## Axis 1 — Standards Compliance

### F1: Indentation inconsistency in execute-phase/SKILL.md (cosmetic)

**File:** `skills/execute-phase/SKILL.md:48-49`
**Severity:** Minor

The `--body-file` line has 6 spaces of indent while the continuation line has 5 spaces. Visually breaks alignment in the Markdown source.

```
48:       (real Markdown, NO `\`-escaped backticks — see Forge body policy). AND the roadmap row (or fix-index entry)
49:       guard* under *Forge body policy*): each classified discovered vs. descope; any
```

Both lines should use consistent 6-space indent to align with the preceding line's content.

### F2: All conventional commits properly formatted ✅

All 24 commits follow `<type>(<scope>): <summary>` format. No issues.

### F3: No secrets/keys in new files ✅

Checked `opencode.jsonc` — contains only MCP server identifiers, no tokens or credentials.

---

## Axis 2 — Spec Adherence

### F4: `opencode.jsonc` introduces MCP servers not in SPEC (scope creep)

**File:** `opencode.jsonc` (new, 32 lines)
**Severity:** Minor/Proposal

SPEC line 295 states: *"No external MCP is required for the execution of this feature."*

The new `opencode.jsonc` adds 3 MCP servers:
- `@modelcontextprotocol/server-filesystem`
- `mcp-server-fetch` (via uvx)
- `serena` (via uvx from git)

These are infrastructure/tooling configuration for the opencode CLI tool, not workflow contract changes. They support development ergonomics but aren't required by the skill contracts themselves.

**Recommendation:** Either update the SPEC to note the optional MCP config, or move `opencode.jsonc` out of this PR into a separate tooling commit. The file is clearly tooling config (not a workflow contract), so this is a soft finding — the SPEC statement is arguably still true if you read "required" strictly.

### F5: All 18 ACs have diff evidence ✅

No SPEC drift detected. Every acceptance criterion maps to concrete changes.

---

## Axis 3 — Correctness

### F6: All tests pass ✅

| Test file | Tests | Status |
|-----------|-------|--------|
| `check-skill-context.mjs --routes` | 16 routes | PASS |
| `check-skill-context.test.mjs` | 1 | PASS |
| `audit-pr-receipt.test.mjs` | 13 | PASS |
| `review-receipt.test.mjs` | 25 | PASS |
| `dependency-gate.test.mjs` | all | PASS |

Route budget check: all 16 routes within SKILL_CONTEXT_BUDGETS.json limits.

### F7: File references resolve ✅

All progressive-loading references verified:
- `FORGE_BODY.md` ✅
- `DESCOPE.md` ✅  
- `OPPORTUNISTIC_FINDING.md` ✅ (renamed from ISSUE_POLICY.md)
- `WORKFLOWS_FEATURE.md` ✅
- `WORKFLOWS_SMALL_PHASED.md` ✅
- `WORKFLOWS_FIX.md` ✅
- `WORKFLOWS_LEGACY.md` ✅

### F8: No stale ISSUE_POLICY references ✅

Grep confirms: `ISSUE_POLICY` only appears in historical documentation files (SPEC, TASKS, progress, decisions) — not in any skill code or reference files. The rename to `OPPORTUNISTIC_FINDING.md` (R053) is complete.

### F9: Phase-lint deduplication is clean ✅

Both SPEC templates (`docs/features/_TEMPLATE/SPEC.md` and `docs/fix/_TEMPLATE/SPEC.md`) now reference `skills/phase-contract/SKILL.md` as the single owner. The duplicated 8-box checklist has been replaced with a consumption directive and fingerprint recording pattern. This is the intended consolidation.

### F10: review-debt transform design is correct ✅

`review-debt` v1.1.0 correctly shifts from a standalone finder to a transform that consumes the synthesized findings table. Key invariants preserved:
- Still never edits code
- Still evaluates every row
- Now attributes to axes already recorded (never re-litigates ownership)
- Adds current-unit debt mislabeling check
- Adds dead-code exception for staged/planned code

### F11: review-implementation classifier-only design is correct ✅

v1.4.0 removes the two-phase find+classify pattern. Now:
- Step 1: verify axis coverage (are all applicable axes represented?)
- Step 2: classify each finding into the decision table
- No diff scanning (that's the finder axes' job)
- Current-unit contract enforced: current-unit work cannot be `postpone`/`tradeoff`/`wontfix`

This is a clean separation of concerns.

---

## Axis 4 — Completeness

### F12: WORKFLOWS.md properly split ✅

The monolithic `WORKFLOWS.md` (107 lines) has been split into:
- `WORKFLOWS_FEATURE.md` — feature workflow
- `WORKFLOWS_SMALL_PHASED.md` — small phased workflow
- `WORKFLOWS_FIX.md` — fix workflow
- `WORKFLOWS_LEGACY.md` — legacy workflow

`execute-phase/SKILL.md` references all four via progressive loading. The split reduces per-invocation context cost.

### F13: SKILL_CONTEXT_BUDGETS.json is comprehensive ✅

131 lines covering 13 routes with budget manifests. Route budget check script validates all 16 routes (including the audit-pr routes). Dependencies declared per-route.

### F14: Cross-skill dependency declarations ✅

`dependency-gate.test.mjs` verifies dependency receipts. The dependency system is tested and working.

---

## Axis 5 — Risk

### F15: No breaking changes to existing workflows ✅

The consolidation is additive — existing skill invocations continue to work. Route splitting is backward-compatible (omitted route arg defaults to first unticked phase). The `--merge` removal from review-change is replaced by `--synthesize` with clear three-state output.

### F16: Progressive loading reduces context cost ✅

All major skills now use progressive loading with reference files. The SKILL_CONTEXT_BUDGETS.json tracks budgets. This is a net improvement for context-constrained environments.

---

## Summary Table

| # | Finding | Severity | Verdict | Action |
|---|---------|----------|---------|--------|
| F1 | Indentation inconsistency in execute-phase:48-49 | Minor | Fix-now | Align 6-space indent |
| F2 | Commits properly formatted | — | Pass | — |
| F3 | No secrets in new files | — | Pass | — |
| F4 | opencode.jsonc MCP servers not in SPEC | Minor | Proposal | Update SPEC or separate PR |
| F5 | All 18 ACs covered | — | Pass | — |
| F6 | All tests pass | — | Pass | — |
| F7 | All file references resolve | — | Pass | — |
| F8 | No stale ISSUE_POLICY refs | — | Pass | — |
| F9 | Phase-lint dedup clean | — | Pass | — |
| F10 | review-debt transform correct | — | Pass | — |
| F11 | review-implementation classifier correct | — | Pass | — |
| F12 | WORKFLOWS.md split complete | — | Pass | — |
| F13 | SKILL_CONTEXT_BUDGETS comprehensive | — | Pass | — |
| F14 | Dependency declarations working | — | Pass | — |
| F15 | No breaking changes | — | Pass | — |
| F16 | Progressive loading reduces context | — | Pass | — |

**Fix-now items:** 1 (F1 — indentation)
**Proposal items:** 1 (F4 — SPEC/MCP scope)
**Blockers:** 0

---

## Recommendation

**MERGE-READY.** The indentation fix (F1) is a one-line cosmetic change that can be addressed in a follow-up commit or as part of merge cleanup. The SPEC scope question (F4) is a documentation decision — the MCP config is infrastructure tooling, not a workflow contract, so the SPEC's "no external MCP required" statement is defensible as-is.

The consolidation is well-executed: single-owner principles are consistently applied, the classifier-only review-implementation is a clean design, and the progressive loading with budget tracking is a meaningful improvement for context-constrained agents.
