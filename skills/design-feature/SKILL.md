---
name: design-feature
user-invocable: true
version: 2.1.0
argument-hint: <idea | NN-slug> [<instruction>]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Turn an idea or a feature request into an exhaustive, checkable product
  definition — the stage before engineering planning. The core mechanism is
  **capability closure**: a checklist that forces every entity, capability, and
  role a feature introduces to be walked to its full surface (CRUD + state
  transitions + UI entry point + API + test, or an explicit design-time `n/a`),
  so non-frontier executor models stop silently omitting the implicit work
  ("auth with dashboard management and ACLs" must not collapse to a users
  table + a list view). Writes the SPEC's **product half** and stamps the
  `## Design status: designed` marker `plan-feature` reads before it will plan
  a feature's engineering half. Bare `design-feature <slug>` reviews and asks
  what to change; `design-feature <slug> <instruction>` applies a change
  directly. On Claude Code and want hand-tuned per-skill model/effort tiers?
  Install the `#claude` branch instead (`npx skills add gtrabanco/agentic-workflow#claude`)
  — see the README. This branch is model-agnostic: the skill inherits whatever
  model and effort your agent session is already using.
  Triggers: "add feature", "add a feature", "new feature", "design a feature",
  "design the product half of NN", "capability closure for NN", "define the
  feature before planning it".
---

# Design Feature

Product definition — the stage that turns an idea or a feature request into an
exhaustive, checkable set of acceptance criteria, before any engineering
planning happens. **Docs only — no code, no branch.**

## Turn contract — verify before ending the turn

```
✓ The Product half of the SPEC is filled (Context, Business goals, Scope,
  Capability closure, Tooling, Product decisions) OR a `NEEDS_INPUT` question
  is pending — never a half-filled section left silently incomplete
✓ Every Capability closure row resolves to a filled surface (UI + API + test)
  or an explicit `n/a: <reason>` — a blank row is not a valid end state
✓ `## Design status` is set to `designed` only when closure is complete;
  otherwise it stays `not designed` and the turn reports what's missing
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
and — if the slug already has a folder — its existing `SPEC.md` and
`decisions.md` in full (upsert never starts blind). Skim the architecture doc
and domain/style docs relevant to the idea's area only far enough to ground
capability closure in the project's real entities and roles — deep engineering
research is the Engineering half's job, not this one.

## Process

1. **Resolve the slug.** A raw idea with no existing folder → propose a number
   (next free roadmap slot) and a kebab-case slug; confirm before writing. An
   existing `NN-slug` → that folder's `SPEC.md` (create the folder + copy the
   template if the roadmap has the row but no folder yet).
2. **Interaction rule (fixed — no interpretation):**
   - **Bare `design-feature <slug>`** (existing SPEC/decisions found): print a
     summary of what the feature currently does (or would do, from a fresh
     idea) → ask what to add / remove / change. This doubles as review mode.
   - **`design-feature <slug> <instruction>`**: apply the instruction
     directly, no questions — touch only what the instruction implies. Still
     re-reads the existing SPEC/decisions first (upsert, never blind).
   - **Nothing exists yet** (brand-new idea, no prior SPEC): go straight to
     step 3 (interview), since there is nothing to review or upsert.
3. **Raw-idea interview (folded in, only when starting from zero or the
   instruction leaves genuine gaps).** Small batched rounds, each with a
   recommended default, covering only what the docs and the instruction don't
   already answer:
   - **Problem & goal** — what changes for the user; success signal.
   - **Business goals** — the outcome served (n/a if purely internal).
   - **Scope** — explicitly what is IN and what is OUT.
   - **Size estimate** (`XS/S/M/L`) — drives how much ceremony the Engineering
     half later needs; XS/S stays SPEC-only, M/L gets the full artifact set.
   - **Non-goals / future work** — deferred to issues, not designed early.
   - **Traceability** — offer to open a tracking issue (from the feature issue
     template); if created, the eventual PR will `Closes #n`.
4. **Proportional research.** Capability closure (step 5) is cheap and comes
   first. Reach for external or domain research **only** when the feature
   touches a domain genuinely new to the project (a regulation, an unfamiliar
   integration, an industry convention with no precedent in the codebase) —
   never as a systematic per-feature step.
5. **Capability closure (the core).** For every entity, capability, and role
   the feature introduces or touches, walk the fixed checklist below and write
   it into the SPEC's `## Capability closure` section. Every row resolves to a
   filled surface **or** an explicit `n/a: <reason>` — a blank row is not a
   valid state, it is an unfinished design:

   ```markdown
   For EACH entity this feature introduces or touches:
   - [ ] Create — UI entry point: <where> · API: <surface> · test: <name>  | n/a: <reason>
   - [ ] Read/list — UI: <where> · API: <surface> · test: <name>           | n/a: <reason>
   - [ ] Update — UI: <where> · API: <surface> · test: <name>              | n/a: <reason>
   - [ ] Delete — UI: <where> · API: <surface> · test: <name>              | n/a: <reason>
   - [ ] State transitions (suspend/block/archive/…): <list> — each with UI+API+test | n/a: <reason>

   For EACH capability (action a user can take):
   - [ ] Visible entry point: <where>
   - [ ] Who may execute it (ACL): <role(s)>

   For EACH role / permission:
   - [ ] Assigned where · Revoked where · Viewed where
   ```

   The filled rows **become the Acceptance criteria** — copy each resolved row
   (or its `n/a` line) into `## Acceptance criteria` as an objective, checkable
   condition. Do not restate them loosely; the checklist row *is* the
   criterion.
6. **Scale-down for XS features.** The gate stays uniform — every row is still
   walked — but for a small feature most rows resolve to `n/a: out of scope
   for this slice` in one pass, and the interview (step 3) may be a single
   confirming question. Passing the gate is cheap; the gate itself never opens.
7. **Per-feature tooling notes.** Check which installed skills/MCPs are
   relevant to *this* feature (e.g. a payments MCP for a billing feature) and
   record them in `## Tooling`. This is not a global discovery sweep — that is
   `product-audit`'s job; record only what this feature will actually use.
8. **Write the Product half.** Fill `Context`, `Business goals`, `Scope`
   (in/out), `Capability closure`, `Acceptance criteria`, `Tooling`, and
   `Product decisions` in the SPEC. Record every non-obvious call in `Product
   decisions` with its rationale, and log any residual unknown as an open
   question in `decisions.md` rather than guessing.
9. **Stamp `## Design status` and set the roadmap row to `defined`.** Every
   closure row filled or explicit `n/a` → set the marker to `designed` **and**
   set this feature's `docs/features/ROADMAP.md` row status to `defined` (the
   `idea → defined` transition this skill owns — see the roadmap's Status
   legend). If the row doesn't exist yet (brand-new feature, no prior `idea`
   row), add it first at `idea` (number, slug, dependencies), then promote it
   to `defined` in the same edit — no feature is ever registered directly at
   `defined` without passing through `idea`. Any closure row still blank, or
   an unresolved question blocking closure → leave `## Design status` at `not
   designed`, leave the roadmap row at `idea` (or unadded), and end the turn
   with the pending question asked plainly instead of a false `designed`
   stamp or a premature `defined` write.
10. **Confirm the roadmap row.** The row from step 9 carries the right number,
    slug, dependencies, and status (`defined`). Beyond `defined`, status
    transitions (`planned`, `in-progress`, `done`) are `plan-feature-scaffold`'s
    and `execute-phase`'s job — this skill never writes past `defined`.
11. **Upsert semantics (never destroy).** Re-running on an existing slug
    re-reads the SPEC and `decisions.md` first; a revision **appends** to
    `decisions.md` (dated, with what changed and why) — it never rewrites or
    deletes a prior decision. The only path that starts the product half from
    zero is an explicit "delete and redesign" in the prompt; even then, record
    that reset itself in `decisions.md`. **This is the retrofit path
    `audit-pr`'s closure-integrity gate routes to:** a legacy SPEC with no
    `Capability closure` block trips that gate's dated `design-debt:
    closure absent, SPEC predates the rule` warning (never a blocker) on the
    next PR touching the feature; re-running `design-feature <slug>` there
    fills only the missing closure rows via this same upsert — it never
    rewrites what's already recorded.
12. **Hand off.** Once `designed`, print the closing block (see *Done when*)
    recommending `/plan-feature <slug>`.

## Guardrails

- Docs only — no code, no branch (that is `execute-phase`), no engineering
  content (architecture, design, phases, testing — that is `plan-feature`'s
  Engineering half; do not pre-fill it here even if the answer seems obvious).
- Never stamp `## Design status: designed` with a blank Capability closure row
  — a skipped row silently un-does the entire point of this skill.
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

## Interaction & upsert (worked shape)

```
design-feature <slug>                → print summary → ask what to add/remove/change
design-feature <slug> "<instruction>" → apply directly, no questions, scoped to the instruction
design-feature "<new idea>"           → interview from zero (no prior SPEC to review)
design-feature <slug> "delete and redesign, <new direction>" → the only from-zero reset path
```

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the
  frontmatter pins these tiers; here, pick tiers yourself: capability closure
  is judgment work — run it on your **strongest** model available.
- **No `/loop`** — re-invoke this skill by hand when a review round or an
  instruction-mode revision is needed; follow the closing `→ Next:` block each
  time.

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
