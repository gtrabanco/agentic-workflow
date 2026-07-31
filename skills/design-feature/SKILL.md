---
name: design-feature
user-invocable: true
version: 2.6.0
argument-hint: <idea | NN-slug> [<instruction>]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Turn a raw idea or existing feature into a designed product SPEC by completing
  entity, integration, role, and expectation closure. Upserts never destroy
  recorded decisions. Triggers: "design-feature", "design this feature",
  "define product scope".
---

# Design Feature

Product definition — the stage that turns an idea or a feature request into an
exhaustive, checkable set of acceptance criteria, before any engineering
planning happens. **Docs only — no code, no branch.**

## Turn contract — verify before ending the turn

```
✓ The Product half of the SPEC is filled (Context, Business goals, Scope,
  Capability closure, Expectation sweep, Tooling, Product decisions, Deferred
  decisions) OR a `NEEDS_INPUT` question is pending — never a half-filled
  section left silently incomplete
✓ Every Capability closure row resolves to a filled surface (UI + API + test)
  or an explicit `n/a: <reason>` — a blank row is not a valid end state
✓ Integration closure walked the capability inventory (`docs/CAPABILITIES.md`,
  or the derived inventory when the project has none) with one resolved row
  per subsystem — zero subsystems skipped; every capability's role matrix
  lists EVERY inventory role as `allowed`/`denied`
✓ The Expectation sweep table is present and fully resolved (≥ 10 rows M/L,
  ≥ 5 XS/S; each `in-scope`/`out-of-scope`/`deferred` with a pointer) — an
  enumerated expectation left unresolved is not a valid end state
✓ Interview questions (when any were needed) went out ONE per turn — never a
  batched round
✓ `## Design status` is set to `designed` only when the Spec-lint product
  boxes all tick (closure complete included) — otherwise it stays
  `not designed` and the turn reports the failed boxes
✓ The roadmap row's status is set to `defined` in lockstep with `designed`
  (added at `idea` first if it didn't exist) — never `defined` with an
  incomplete closure, never `designed` with the roadmap row left at `idea`
✓ Upsert discipline honored: an existing SPEC/decisions.md was re-read first;
  nothing recorded there was destroyed; revisions were appended, not overwritten
✓ Artifact language: explicit user instruction > the project's declared docs
  language > English. The CONVERSATION language never decides — a Spanish
  prompt still produces an English SPEC/decisions unless one of the first two
  says otherwise
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## When to use

- A rough idea, no issue yet, and no SPEC: `design-feature "<idea>"`.
- An existing feature slug whose SPEC is not yet marked `designed`:
  `design-feature <NN-slug>`.
- Revising an already-designed feature's product definition:
  `design-feature <NN-slug> "<change>"` (instruction mode), or bare
  `design-feature <NN-slug>` for review mode (see *Interaction & upsert*).
- `plan-feature` redirects here automatically when it detects an undesigned
  feature — you don't have to notice the gap yourself.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then
read what THIS skill needs: `docs/features/_TEMPLATE/SPEC.md` (the two-halves
layout + `## Design status` marker), the roadmap (`docs/features/ROADMAP.md`),
the **capability inventory** (`docs/CAPABILITIES.md` — the substrate the
Integration closure walks; if the project has none, derive an ad-hoc inventory
from the architecture doc + codebase during step 5 and offer to seed the file
from the template), and — if the slug already has a folder — its existing
`SPEC.md` and `decisions.md` in full (upsert never starts blind). Skim the
architecture doc
and domain/style docs relevant to the idea's area only far enough to ground
capability closure in the project's real entities and roles — deep engineering
research is the Engineering half's job, not this one.


## Progressive loading — resolve status before product detail

The reference allowlist is exactly the four paths linked below. Never invent or
read another `references/` path.

**Hard stop for an incomplete raw-idea interview:** LOAD exactly
`references/INTERVIEW.md` and no other reference. Ask its one next
question, return `NEEDS_INPUT`, and end the turn. `WRITE_AND_UPSERT.md` is
forbidden until every mandatory interview slot is resolved; that resource then
owns closure rows and writing.

| Condition now | LOAD now | DEFER / SKIP now |
|---|---|---|
| Bare existing slug, no instruction | [interview](references/INTERVIEW.md) through its interaction rule; report status and stop | `references/WRITE_AND_UPSERT.md`, `references/UPSERT_EXAMPLE.md`, `references/PORTABILITY.md` |
| Brand-new idea with any mandatory interview slot unresolved | [interview](references/INTERVIEW.md) only; ask exactly its next question and stop | `references/WRITE_AND_UPSERT.md`, `references/UPSERT_EXAMPLE.md`, `references/PORTABILITY.md` |
| New idea after every mandatory interview slot resolves | [interview](references/INTERVIEW.md), then [closure, write, and upsert](references/WRITE_AND_UPSERT.md) | `references/UPSERT_EXAMPLE.md` unless shape is ambiguous; `references/PORTABILITY.md` |
| Existing slug plus instruction | interview, then closure/write/upsert | [upsert example](references/UPSERT_EXAMPLE.md) unless shape is ambiguous; `references/PORTABILITY.md` |
| A named platform primitive is absent | the selected row above plus [portability](references/PORTABILITY.md) | only unrelated rows |

Do not load write/upsert while an interview slot is unresolved. A supported
primitive is not absent merely because the current task does not use it.

All resources are one hop from this file. Closure rows, role matrices,
expectation counts, fixed status blocks, and Spec-lint are normative. A missing
required resource or unresolved mandatory slot returns NEEDS_INPUT; never guess.

## Guardrails

- Docs only — no code, no branch (that is `execute-phase`), no engineering
  content (architecture, design, phases, testing — that is `plan-feature`'s
  Engineering half; do not pre-fill it here even if the answer seems obvious).
- Never stamp `## Design status: designed` with a blank Capability closure row,
  a skipped inventory subsystem, an incomplete role matrix, or an unresolved
  Expectation sweep row — a skipped row silently un-does the entire point of
  this skill.
- The Expectation sweep enumerates **domain conventions**, not new scope: it
  may only route each expectation to in-scope / out-of-scope / deferred — it
  never silently grows the feature beyond what the user confirms.
- No systematic per-feature market research; no global skill/MCP discovery
  sweep (`product-audit`'s job); no `--update` flag — upsert is always the
  default behavior, not an opt-in.
- Don't build a separate `DESIGN.md` — one SPEC, two halves, always.
- **Composition tier.** This skill is planning-class (judgment work — run it
  on your strongest model / highest effort). `plan-feature-from-issue`
  composing this skill in-turn for a thin issue is allowed only when it runs
  at ≥ this skill's tier; otherwise it must hand off (`run /design-feature
  <slug>`) rather than under-power it.
- Otherwise per the project's **Workflow conventions** (docs-language).

## Normalized Repository State

Consume frozen facts and decisions from `docs/workflow/REPOSITORY_STATE.md`.
An absent fact may be inspected; a conflict becomes a resolver contradiction.
Documentation and inference are never implementation evidence.

## Architectural invariants

Discover the optional project invariant document declared in the documentation
map (normally `docs/architecture/ARCHITECTURAL_INVARIANTS.md`) before defining a
capability. If absent, record `n/a: no project invariants declared` in the SPEC
and continue. For every applicable rule, cite its ID and repository evidence and
classify the proposal as `preserves`, `violates`, `introduces`, or `changes`.
Only `preserves` may proceed to capability closure. A violation, new rule, or
changed rule stops design for an explicit architectural decision through the
project's declared authority; never make a SPEC, implementation plan, or test
retroactively authorize it. When NRS exists, consume its frozen facts first;
the repository remains authoritative and a conflict routes to the resolver.


## Portability

Do not read [portability](references/PORTABILITY.md) on a supported platform.
Read it only after detecting that a named interaction primitive is absent. The
interview, closure, upsert, and fixed output contracts stay identical.

## Relationship to other skills

- `plan-feature` **redirects here** (no bypass flag) when a feature's product
  half is not marked `designed`; once this skill hands off, `plan-feature`
  fills the Engineering half and scaffolds the artifacts.
- `plan-feature-from-issue` may compose this skill in-turn for a thin issue
  (only at ≥ tier — see *Guardrails*), or hand off to it directly.
- `triage-issue`'s `promote-to-feature` verdict routes through `plan-feature`,
  which redirects here if the promoted issue is still undesigned.
- `execute-phase` never calls this skill — it only executes an already-planned
  SPEC's Engineering half.

## Done when

- The Product half of the SPEC is filled and every Capability closure row is
  resolved (filled surface or explicit `n/a`).
- `## Design status` accurately reflects the outcome (`designed` only when
  closure is complete).
- The roadmap row exists (created at `idea` if this was a brand-new feature)
  and its status matches the outcome — `defined` when `designed`, left at
  `idea` on `NEEDS_INPUT`.
- **The closing `→ Next:` block is printed:**

  ```
  → Next: /plan-feature <slug> — product half designed, ready for engineering planning
    · more to design → re-run /design-feature <slug> "<instruction>" (upsert, destroys nothing)
    · recurring gap in this project's capability closure → /product-audit (a systemic pattern,
      not a one-off design fix)
  ```

  When ending `NEEDS_INPUT` instead:

  ```
  → Next: answer the pending question, then re-run /design-feature <slug>
    · unsure how to scope it → propose the smallest version and confirm
  ```
