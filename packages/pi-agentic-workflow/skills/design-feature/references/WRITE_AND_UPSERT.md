## Closure, write, and upsert

0. **Inventory before drafting** (the `evidence-grounding` passes, Product stage).
   List every normative obligation, affected role/use case, failure state,
   compatibility boundary, recorded decision, and material unknown, then acquire
   one evidence row per material claim
   (`claim-or-obligation | authority-kind | source-and-location |
   observed-revision | freshness | status | owner-or-next-evidence`). Product
   conclusions freeze in the SPEC's Product half and `decisions.md`. A claim you
   cannot evidence stays `status: unknown` with an owner — it never becomes a
   plausible rationale. A repeated read that answers no new question is
   no-progress: stop and report the missing evidence.

5. **Capability closure (the core).** Walk the SPEC template's **three fixed
   checklists** (`docs/features/_TEMPLATE/SPEC.md` → `### Capability closure`
   is the authoritative block — instantiate it, never paraphrase it) and write
   the result into the SPEC's `### Capability closure` section. Every row
   resolves to a filled surface **or** an explicit `n/a: <reason>` — a blank
   row is not a valid state, it is an unfinished design:
   1. **Entity closure** — for every entity the feature introduces or
      touches: Create/Read/Update/Delete/state-transitions, each with UI
      entry point + API surface + test.
   2. **Integration closure** — reconcile the feature against **every**
      subsystem in the capability inventory (`docs/CAPABILITIES.md`), one row
      per subsystem, none skipped: how does this feature touch auth, ACL,
      navigation, notifications, search, audit, settings, …? ("blog" ⇒ ACL
      gets a `blog:write` permission; the dashboard gets an "Articles" link
      with drafts above published and a "New article" button; auth is
      required to write.) **No inventory file** → derive the inventory from
      the architecture doc + codebase, record it in the section, walk it, and
      offer to seed `docs/CAPABILITIES.md` from the template (upsert-safe,
      user confirms).
   3. **Role matrix** — for every capability, EVERY role in the inventory is
      explicitly `allowed` or `denied` — no role unlisted, no "admins
      obviously can" left implicit.

   The filled rows **become the Acceptance criteria** — copy each resolved row
   (or its `n/a` line) into `## Acceptance criteria` as an objective, checkable
   condition. Do not restate them loosely; the checklist row *is* the
   criterion.
6. **Expectation sweep (the implicit-knowledge gate).** Enumerate **≥ 10
   candidate expectations** (M/L; **≥ 5** for XS/S) a competent human would
   assume ship with a feature of this kind without being told — domain
   conventions, not project specifics ("a blog has drafts and a publish
   action", "a list has an empty state", "a delete asks for confirmation").
   Fill the SPEC's `### Expectation sweep` table: each row resolves to exactly
   one of `in-scope` (add/point to an acceptance criterion), `out-of-scope`
   (add to *Out of scope / non-goals*), or `deferred` (row in *Deferred
   decisions*) — **never left unmentioned**. Rows the user rejects are
   recorded as out-of-scope, not dropped: a rejected expectation is a future
   surprise defused. When a resolution genuinely needs the user's call, it
   rides the step-3 interview protocol (one question per turn, recommended
   default).
7. **Scale-down for XS features.** The gate stays uniform — every closure row
   and inventory subsystem is still walked, the sweep still runs (≥ 5 rows) —
   but for a small feature most rows resolve to `n/a: out of scope for this
   slice` in one pass, and the interview (step 3) may be a single confirming
   question. Passing the gate is cheap; the gate itself never opens.
9. **Per-feature tooling notes.** Check which installed skills/MCPs are
   relevant to *this* feature (e.g. a payments MCP for a billing feature) and
   record them in `## Tooling`. This is not a global discovery sweep — that is
   `product-audit`'s job; record only what this feature will actually use.
10. **Write the Product half.** Fill `Context`, `Business goals`, `Scope`
   (in/out), `Capability closure`, `Acceptance criteria`, `Tooling`,
   `Product decisions`, and `Deferred decisions` (`none` if empty) in the
   SPEC. When instantiating the closure, **replace** the template's fenced
   example block with the filled rows (keeping it fails the spec-lint's
   placeholder box). Record every non-obvious call in `Product decisions`
   with its rationale, and log any residual unknown as an open question in
   `decisions.md` rather than guessing.
11. **Run the Spec-lint product boxes, then stamp.** Mechanically check the
   SPEC template's `### Spec-lint` **product boxes**
   (`docs/features/_TEMPLATE/SPEC.md`) and paste the box results. All
   product boxes tick → set the marker to `designed` **and**
   set this feature's `docs/features/ROADMAP.md` row status to `defined` (the
   `idea → defined` transition this skill owns — see the roadmap's Status
   legend). If the row doesn't exist yet (brand-new feature, no prior `idea`
   row), add it first at `idea` (number, slug, dependencies), then promote it
   to `defined` in the same edit — no feature is ever registered directly at
   `defined` without passing through `idea`. Any spec-lint product box FAILing
   (a blank closure row, an unlabelled prose criterion, an in-scope item with
   no criterion, …), or an unresolved question blocking closure → leave
   `## Design status` at `not designed`, leave the roadmap row at `idea` (or
   unadded), and end the turn with the failed boxes / pending question stated
   plainly instead of a false `designed` stamp or a premature `defined` write.
12. **Confirm the roadmap row.** The row from step 11 carries the right number,
    slug, dependencies, and status (`defined`). Beyond `defined`, status
    transitions (`planned`, `in-progress`, `done`) are `plan-feature-scaffold`'s
    and `execute-phase`'s job — this skill never writes past `defined`.
12b. **Readiness preflight, then rotate the revision.** Before handing off, run
    the `stage: spec` readiness boxes owned by the internal
    [`evidence-grounding`](<../../evidence-grounding/SKILL.md>) skill (its ordered
    passes route to its own readiness reference) and paste the fixed
    `READINESS — <NN-slug> spec <outcome>` block. Only
    `READY-FOR-REVIEW` may hand off; `NEEDS-EVIDENCE` / `NEEDS-DESIGN` /
    `NEEDS-REPLAN` keep the artifact at home with the named missing row. Readiness
    is an authoring gate: it licenses a review request, never a review verdict.
    Then mint the new `artifactRevisionId` for the bytes just written (every write
    rotates it — a revert included) and carry it in the handoff.
13. **Upsert semantics (never destroy).** Re-running on an existing slug
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
14. **Hand off.** Once `designed` and readiness-clean, print the closing block
    (see *Done when*) recommending `/review-spec <slug>` with the current
    `artifactRevisionId`. Do **not** recommend `/plan-feature`: engineering
    planning is gated on an independent Product review this skill cannot supply.
