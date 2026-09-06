---
name: plan-feature
model: opus
effort: high
user-invocable: true
version: 5.0.0
argument-hint: <NN-slug | #N> | --from-issue N | --scaffold <slug> | --next
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Route designed features or issues into engineering planning and roadmap
  registration; undesigned work stops at design-feature. Supports `--next`,
  `--from-issue`, and `--scaffold`. Triggers: "plan-feature", "plan a feature",
  "plan the next roadmap feature", "create SPEC and TASKS".
---

# Plan Feature (router)

The engineering-planning door for a feature whose product definition already
exists. Routes to a focused internal step so only the work you need runs (no
fat single skill). **Docs only — no code, no branch.** Product definition
(raw-idea interview, capability closure) is `design-feature`'s job, not this
one — the routed redirect gate enforces that split.

## Turn contract — verify before ending the turn

```
✓ The redirect gate ran FIRST, before any SPEC edit: undesigned input → STOP,
  print the fixed `/design-feature <slug>` block, do nothing else this turn
✓ Then the Product-review gate ran: no current `spec-review-pass` receipt bound to
  the recomputed snapshot → STOP with its fixed block and the `/review-spec`
  hand-off; a candidate/verification receipt, a Plan receipt, or readiness never counts
✓ Designed input only: engineering half filled, artifacts written, and the
  roadmap entry registered (number, order, deps verified)
✓ If `plan-feature-scaffold` ran this turn: the roadmap row was re-read
  AFTER the write and literally reads `planned` — a dropped `defined→planned`
  write fails this box; do not end the turn until it's fixed
✓ Planned, not reviewed: the ledgers are frozen, `stage: plan` readiness printed
  `READY-FOR-REVIEW`, and the turn hands off to `/review-plan` — this skill never
  reviews the plan it just wrote and never hands off to `/execute-phase` for a
  plan with no current Plan review receipt
✓ The dependency & blocker check was RUN and its result decides which closing block is printed
✓ An unmet dependency? The closing block lists the complete dependency chain, deepest first, joined with ` + `
✓ Artifact language: explicit user instruction > the project's declared docs language > English. The CONVERSATION language never decides — a Spanish prompt still produces English PRs/issues/commits/SPECs unless one of the first two says otherwise
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the **roadmap** (`docs/features/ROADMAP.md`), so routing
and roadmap registration match the project's real layout.

## Progressive loading — route before planning

The reference allowlist is exactly the two paths below:

1. Every invocation: read [redirect gate and routing](references/ROUTING.md),
   apply the status gate first, then the Product-review gate, and stop on its
   exact block when instructed.
2. Any route that can write planning artifacts: after the redirect gate permits
   routing, consume the [planning preflight](<../planning-preflight/SKILL.md>) —
   it owns the normalized repository state read and the ONE final architectural
   classification — before composing an internal step, including the
   issue-derived route.
3. Before composing an internal step: load the [phase contract](<../phase-contract/SKILL.md>)
   so every SPEC written this turn carries the canonical 8-box phase-lint and
   the normalized phase fingerprint.

Do not load planning gates after a redirect stop. Both resources are normative,
one hop from this file, and fail closed when missing.

## Process

1. **Redirect gate** from `ROUTING.md` — always first.
2. **Product-review gate** from the same resource — current `spec-review-pass`
   receipt bound to the recomputed snapshot, or STOP. No bypass flag.
3. **Route** from the same resource. For issue input, resolve and validate the issue
   identity only; after the [planning preflight](<../planning-preflight/SKILL.md>)
   confirms that planning may write, compose the from-issue internal to produce
   a **filled, sized SPEC product half**; that internal stops at the Product-review
   gate, so `plan-feature-scaffold` runs only once `review-spec` has passed the half:
   it fills the engineering half, scales the artifacts to the SPEC's size (XS/S →
   SPEC-only; M/L → full set) and registers the roadmap. The
   already-designed scoped path runs `plan-feature-scaffold` directly. Every
   path holds **one immutable planning context** — the roadmap snapshot taken
   before writing (and one issue payload when `--from-issue`) — reused across
   the internal steps; never re-fetched mid-plan.
4. **Confirm roadmap.** Verify the feature is registered in
   `docs/features/ROADMAP.md` with the right number, ordering, and dependencies;
   if any of the three is missing or wrong, fix the entry now — never leave
   registration for later.
5. **Dependency & blocker check (always, before recommending execution).**
   - Walk the feature's `Depends on:` closure (transitively): every dependency
     must be `done` **and merged**. Any unmet → the closing block recommends
     building the deepest unmet dependency first, NOT this feature.
   - Check the fix index + open issues (forge CLI) for fix-now items touching
     the same modules this SPEC names. Any hit → the closing block recommends
     `/plan-fix <n>` before execution ("building on a known defect bakes it in").
   - Planning itself never blocks on either — the SPEC/artifacts are still
     written; only the **recommended next step** changes.
5. **Print the next step** per the check above (see Done when).

## Guardrails

- Docs only — no code, no branch (that is `execute-phase`).
- **Never plan an undesigned feature** — the redirect gate has no bypass flag,
  ever. Do not add one, even if asked; point at `/design-feature` instead.
- **Never plan an unreviewed Product half** — this gate has no bypass flag either.
  Planning binds the reviewer's receipt; it may never write, widen, or "refresh"
  one, and a receipt bound to older bytes is stale, not close enough.
- Don't re-ask what a flag, the issue, or the docs already settle.
- Surface conflicts (numbering clashes, dependency cycles, scope overlap) before
  writing, not after.
- Otherwise per the project's **Workflow conventions** (docs-language).

## Internal steps (not user-invocable)

- `plan-feature-from-issue` — issue → scoped SPEC product half, `Closes #N`.
- `plan-feature-scaffold` — SPEC → engineering half + full artifact set +
  roadmap entry.

These run **within this same conversation** (that's what "composing" means) —
on any agent, just follow their `SKILL.md` inline as the routed step. The
raw-idea interview that used to be an internal step of this router is retired
— see `docs/workflow/MIGRATION.md`; that logic now lives in `design-feature`,
a user-facing skill in its own right (product definition is its own pipeline
stage, not an internal routing detail of this one).

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context. The
  internal steps above are the exception — they run inline, in this one.
- **No per-skill `model:`/`effort:`** — the frontmatter tiers state intent:
  planning is judgment work — run it on your **strongest** model. The
  execution it hands off to may run cheaper.

## Relationship to other skills

- **Redirects to** `design-feature` when the redirect gate stops on an
  undesigned feature — never composed in-turn (planning-class, ≥-tier hand-off).
- **Redirects to** `review-spec` when the Product-review gate stops: designed is not
  reviewed. Its receipt is this skill's input, and `plan-feature-scaffold` binds it
  as the Plan snapshot's Product parent.
- `triage-issue` routes here to promote an issue to a feature (still subject to
  the redirect gate if the promoted issue is undesigned).
- `execute-phase` executes the phases afterward (`audit-docs` audits anytime).

## Done when

- The redirect gate ran, and if it stopped, nothing else in this turn touched
  the SPEC.
- Designed input only: a planned feature with its full artifact set exists and
  is roadmap-registered — **and the roadmap row was re-read after the write and
  literally reads `planned`** (never assumed from having run the write step).
- The two planning ledgers were frozen with the Engineering half
  ([planning ledgers](<../../pre-execution-review/SKILL.md>)), the
  `stage: plan` readiness preflight printed `READY-FOR-REVIEW`, and the new
  `artifactRevisionId` is named in the hand-off. A planned unit is **not** an
  executable unit: this skill never reviews its own plan.
- The dependency & blocker check ran, and **the closing `→ Next:` block matches
  its result** — clean:

  ```
  → Next: /review-plan <NN> — the plan is written; an independent context must
    review it before any phase is executed
    · the review returned PLAN-REVIEW-FAIL → this skill replans the batch, then re-reviews
    · adjust scope first → re-run /design-feature <slug>   · audit the planning docs → /audit-docs
  ```

  already-planned feature (redirect gate stopped, never re-scaffolded):

  ```
  → Next: /execute-phase <NN> — this feature is already planned; execute every
    remaining phase, don't re-plan it.
    · explicit atomic mode → /execute-phase <NN> P1
  ```

  undesigned feature (redirect gate stopped):

  ```
  → Next: /design-feature <slug> — this feature has no completed product design yet
    (capability closure not done). Design it first; then re-run /plan-feature <slug>.
  ```

  designed but unreviewed/stale (Product-review gate stopped): the fixed
  `PRODUCT-REVIEW GATE … BLOCKED` block from `ROUTING.md`, closing with
  `/review-spec <NN>-<slug>`.

  unmet dependency and/or blocking fix-now issue:

  ```
  Dependency chain (deepest first): <deepest> + <dependency> + <NN> (replace with every actual member; never print `…`)
  → Next: /plan-feature <deepest-unmet-dep> (or /execute-phase <deepest-unmet-dep>) — build the
    complete dependency chain first: <deepest> + <dependency> + <NN>
    · blocking fix-now issue #<n> in the same area → /plan-fix <n> before executing
    · proceed anyway → /execute-phase <NN> --force (the gate logs the override)
  ```
