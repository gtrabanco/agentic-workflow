---
name: review-implementation
user-invocable: false
version: 1.3.1
argument-hint: <path-or-glob>
allowed-tools: Read, Grep, Glob, Bash, WebFetch
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal findings engine composed by review-change (and reused by the audit
  skills): two-phase find → classify pass ending in a classified decision table
  (fix-now / postpone / ignore / intentional-tradeoff). Findings only — never
  refactors.
---

# Review Implementation (internal engine)

The findings engine the review/audit skills compose: it **produces findings and a
decision table, and stops** — never refactors or edits code. It owns the **review
axes** (Phase 1) and the **classification rubric** (Phase 2) that `review-change`,
`audit-pr`, and `product-audit` reference instead of restating.

## When to use

- Invoked by `review-change` (the user-facing review entry) as its engine; the
  audit skills reference its rubric.
- Run directly only when you want the raw classified pass without the
  platform-adaptive orchestration `review-change` adds.

## Scope

Default target is the **current change** (branch diff vs. the default branch);
accept an explicit path/glob to widen or narrow it. State the scope at the top of
the report so the reader knows what was and wasn't reviewed.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the architecture/layering rules, the testing philosophy,
and any runtime/platform, security, money, i18n/SEO/a11y and bundle rules. Pull
the project's specific risk axes from its guardrail skills where present
(architecture-pattern, runtime/platform, domain-rules). The `FIND.md` axis list
is the default; the project's docs refine it.

## Context budget (hard rule)

The scope is the diff. Beyond it, read **at most 10 non-diff files in full**
for surrounding context (callers, contracts, tests); targeted reads (≤ 50
lines of a named range) and grep/glob results don't count. Record each
finding as its table row **immediately** (id, `file:line`, axis, one-line
evidence) and drop the raw file content — Phase 2 classifies the table, never
the sources. Never quote whole files into the report.

## Progressive loading — find, then classify

The reference allowlist is exactly the two paths below. Every review executes
them sequentially:

1. Read [Phase 1 — Find](references/FIND.md), produce the findings rows, then
   discard raw source context as required by the context budget.
2. Read [Phase 2 — Classify and route](references/CLASSIFY.md) and classify every
   row without reopening source files.

Both resources are normative and one hop from this file. Missing resource →
stop; never invent an axis, class, override, or route.

## Guardrails

- **Findings + table only. Never refactor or edit code in this skill.**
- Honor the dead-code exception — staged/planned code is not dead code.
- Don't inflate severity; separate "correctness/security" from "taste".
- Don't deflate either: never classify a confirmed real defect as `postpone`/
  `intentional-tradeoff` without running the fix-now override checks, and
  never downgrade an in-scope fix-now because it is big — size routes to
  `replan-in-unit`, not to postpone.
- Otherwise per the project's **Workflow conventions** (docs-language, evidence):
  cite `file:line`, mark uncertainties *verify*.

## Relationship to other skills

- **Engine of `review-change`** — the user-facing review skill composes this plus
  the internal review pack's applicable passes (`review-code`, `review-security`,
  `review-verify`, `review-debt`, design/a11y/brand/perf/seo). `audit-pr` and
  `product-audit` reuse this rubric.
- Sits in **Stage 4** of the feature workflow (verification & review).
- `fix-now`/`postpone` outcomes hand off to `plan-fix` / `triage-issue`.

## Done when

- A scoped findings list (Phase 1) and a complete decision table (Phase 2) exist,
  every finding classified with reasoning, each routed — and **no code changed**.
