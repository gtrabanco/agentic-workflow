---
name: review-change
user-invocable: true
version: 2.9.1
argument-hint: <path-or-glob> [--adversarial N] [--merge]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Review a change with only applicable internal axes, classify every finding,
  persist fix-now work, and return one evidence-backed decision. Findings only;
  --adversarial N uses isolated reviewers. Triggers: "review-change", "review
  this change", "adversarial review".
---

# Review Change

The quality gate for a change: get every review that *applies* — and skip the ones
that don't — in one synthesized, classified report. **Findings only; never edits
or refactors.**

## Turn contract — verify before ending the turn

```
✓ This review runs in a conversation that did NOT implement the change; if this conversation wrote the diff, STOP and hand off to a fresh one (the reviewer works from the diff + the SPEC, not the author's mental state).
✓ The synthesized decision table + manual-verification checklist + `Decision: PASS | FAIL` were returned in the fixed output format
✓ Architectural-invariant preservation was stated explicitly as pass / finding / n-a
✓ Every non-fix-now finding got a destination (triaged — issue / decision / drop)
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## When to use

- **Mandatory before every merge** — every unit (feature, single-pass, or fix) gets a
  `review-change` pass before its merge gate; that end review is never skipped, and
  it must run in a conversation that did **not** implement the change — the
  conversation that wrote a diff shares the author's mental model and tends to
  catch only mechanical issues, missing design defects a context-clean,
  adversarial reviewer would find (see the turn-contract box above). If the
  reviewing conversation authored the diff, stop and hand off to a fresh one
  before reviewing.
  `execute-phase` additionally **recommends** a hand-off at its trigger-based
  checkpoints (layer boundary, accumulation, or sensitivity — see `#77`) — an
  optional checkpoint the user may skip.
- When you want the *right* reviews for this change without running irrelevant
  passes (e.g. accessibility on a backend change).

## Scope

Default target is the **current change** (branch diff vs the default branch);
accept a path/glob to widen or narrow. State the scope at the top of the report.

## Step 0 — Discover the project & the change (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then
decide which axes apply from two inputs:

1. **Project nature** — from the guide/map: is there a UI (`docs/frontend/`
   present)? Is it web, mobile, console/CLI, library/SDK, or backend/infra? Note
   any optional platform review skills the project recorded (its `init-workspace`
   notes them) — extras, never requirements.
2. **Change footprint** — what the diff actually touches (UI components? an API?
   infra? domain logic?). An axis applies only if **both** the project has it
   **and** the change touches it.

## Applicability matrix (default; the project's docs refine it)

Every axis maps to a skill of the workflow's **own internal review pack**
(`skills/review-*` — installed with the workflow, so none can be missing):

| Axis — internal pack skill | Web | Mobile | Console/CLI | Lib/SDK | Backend/Infra |
|---|---|---|---|---|---|
| `review-implementation` (bugs, arch, security, dead code, perf, tests, rules) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `review-code` (correctness + simplification) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `review-security` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `review-verify` (run it, confirm real behavior) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `review-debt` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `review-design` (UI/UX) | ✓ | ✓ | TUI only | ✗ | ✗ |
| `review-a11y` | ✓ | ✓ | rare | ✗ | ✗ |
| `review-brand` (voice/copy) | ✓ | ✓ | output text | ✗ | ✗ |
| `review-perf` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `review-seo` | ✓ | ✗ | ✗ | ✗ | ✗ |
| API ergonomics / usage docs (inline pass) | if API | if API | flags/help | ✓✓ | ✓ |

## Isolation rule (default — every pass, not only adversarial)

Each review pass (`review-implementation` in step 1 and every applicable pack
pass in step 4) runs **isolated and context-clean**, and returns **only its
fixed-format findings table + `PASS | FAIL`** — never the diff, never prose:

- **Spawn**: on Claude Code, one subagent per pass; on an agent with headless
  invocation, one headless run per pass; with neither, a fresh conversation
  per pass (same three tiers as the adversarial spawn below).
- **Each pass receives ONLY**: (a) the scope (branch/diff reference or
  path-glob), (b) its own `SKILL.md` checklist, (c) the specific project docs
  its Step 0 names. Context budget per pass: the diff plus **at most 10
  non-diff files read in full** (targeted ≤ 50-line reads and greps don't
  count).
- **The orchestrator holds tables, not sources.** After dispatch it never
  re-reads the diff or the files — it merges the returned tables (step 6)
  and runs steps 7–11 on them.
- **Inline fallback** (an agent that cannot spawn any fresh context):
  compose the passes in-turn as before — sequentially, and each pass must
  end by reducing to its table before the next pass starts; never hold two
  passes' raw context at once.
- The composition tier rule is unchanged: a spawned pass runs at ≥ its own
  tier (the session model or stronger — never a weaker override).


## Progressive loading — choose one review route

After applicability and isolation are established:

The reference allowlist is exactly the six linked paths below. Never invent or
read another `references/` path.

| Invocation route | LOAD in this order | SKIP |
|---|---|---|
| Default review | [review process](references/REVIEW_PROCESS.md) → [adversarial setup](references/ADVERSARIAL_SETUP.md) → [persist and decide](references/PERSIST_AND_DECIDE.md) → [output and guardrails](references/OUTPUT_AND_GUARDRAILS.md) | adversarial merge, portability |
| `--adversarial N` | review process → [adversarial setup](references/ADVERSARIAL_SETUP.md) before reviewers → [adversarial merge](references/ADVERSARIAL_MERGE.md) before synthesis → persist/decide → output/guardrails | portability |
| `--merge` | review process → adversarial setup → adversarial merge plus the supplied reviewer tables → persist/decide → output/guardrails | portability |

Add [portability](references/PORTABILITY.md) only when independent contexts,
parallelism, slash commands, or tier controls are actually unavailable. The
project artifact `docs/workflow/REPOSITORY_STATE.md` is evidence consumed by
output/guardrails; it is not a skill reference. Output/guardrails owns those NRS
evidence rules and Architectural invariants review.

Resources are one hop from this file. Fixed reviewer/merge/output contracts are
literal. Missing required resource → stop; never approximate a review contract.

## Portability

Keep reviewer contexts isolated on every platform. Use
[portability](references/PORTABILITY.md) for sequential/headless fallbacks; never
collapse independent adversarial passes into one context.

## Relationship to other skills

- Orchestrates `review-implementation` (engine) and the internal review pack
  (`review-code`, `review-security`, `review-verify`, `review-debt`,
  `review-design`, `review-a11y`, `review-brand`, `review-perf`, `review-seo`)
  — isolated per pass by default (see *Isolation rule*; in-turn composition is
  the fallback) — plus `triage-issue` (every non-fix-now finding — equal tier,
  in-turn), and — as optional extras only — any platform review skills the
  project installed.
- Sits in Stage 4 of the feature workflow; `execute-phase` recommends it at its
  trigger-based checkpoints (optional) and hands off for the **mandatory end
  review** (it runs in its own turn). `fix-now` → `plan-fix`; everything else →
  `triage-issue`.
- `audit-pr` is the PR-level gate it feeds; `product-audit` the periodic full sweep.

## Done when

- One synthesized, classified decision table across all **applicable** axes exists,
  the skipped axes are listed with reasons, and the manual-verification checklist is
  explicit.
- **Every finding has a destination:** fix-now routed, and every non-fix-now finding
  put through `triage-issue` (issue / documented decision / justified drop) — none
  silently lost.
- The **closing `→ Next:` block is printed** (clean → `/audit-pr`; recurring drift →
  `/product-audit`), and **no code changed**.
