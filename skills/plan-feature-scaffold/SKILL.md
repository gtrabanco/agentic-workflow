---
name: plan-feature-scaffold
user-invocable: false
version: 1.12.0
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal step of plan-feature: from an already-designed SPEC (product half
  `designed`), fill the **engineering half** and generate the planning
  artifact set scaled to the feature's size (XS/S → SPEC-only with ≥ 2 phases
  in the SPEC, last = Hardening & PR; M/L → full set with a hardening phase)
  and register the roadmap entry. Docs only — never code.
---

# Plan Feature — Scaffold (internal)

Turn a designed feature into the project's complete planning artifact set,
ready for phase-by-phase execution. Fills only the SPEC's **engineering half**
— the product half (goal, context, scope, capability closure) already exists
and is marked `designed` before this skill ever runs (`plan-feature`'s
redirect gate guarantees it). **Docs only — never code.**

## When to use

- The `plan-feature` router calls this once a feature's product half is
  `designed` — from `design-feature`, `plan-feature-from-issue`, or an
  already-scoped slug/SPEC — to fill the engineering half of its
  `docs/features/<NN>-<slug>/SPEC.md` and the rest of the folder, then update
  the roadmap.

Not for product definition (that is `design-feature`) or writing code (that is
`execute-phase`) or deciding *whether* to build (that is the `plan-feature`
router / `triage-issue`).

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the feature SPEC **template**, the **roadmap**
(numbering/order/deps), 1–2 recent feature folders to mirror the artifact set, and
the architecture/domain docs the map points to. No template/roadmap → fall back to
the agent guide and state the assumption.

## Process

1. **Verify the product half is designed.** The SPEC's `## Design status` must
   read `designed` and Capability closure must be filled — `plan-feature`'s
   redirect gate already checked this before calling this skill, but confirm
   before writing: an undesigned SPEC here is a caller bug, not something to
   silently patch over.
2. **Resolve identity.** From the roadmap, confirm the number and kebab-case
   slug the product half already used (or, for an already-scoped SPEC with no
   prior roadmap entry, pick the next free number). Record dependencies
   (features that must land first) and note ordering conflicts.
3. **Fill the engineering half of the SPEC.** In the existing
   `docs/features/<NN>-<slug>/SPEC.md`, complete every Engineering-half
   section — technical goals, architecture impact, design, decisions to
   confirm, branch name (`feat/<NN>-<slug>` or per project convention), phases,
   testing requirements, and **dev scenarios** (happy path **and** failure
   modes: empty/degraded state, races, outages — plus how to reproduce each
   locally). Never touch the Product half (goal, context, scope, capability
   closure, `## Design status`) — that is `design-feature`'s content; if it
   looks wrong or incomplete, stop and redirect rather than editing it here.
   No unfilled placeholders; record genuinely-unknown values as open questions
   in `decisions.md`, not blanks.
4. **Scale the artifacts to the size.**
   - **XS/S** → the SPEC is the only planning artifact (skip the set below —
     don't generate ceremony the feature doesn't need), but its `### Phases`
     section must list **≥ 2 phases with checkbox tasks**: `P1` implementation
     (cut by the per-phase cheap-executability checklist below), final phase
     `P2 — Hardening & PR` carrying the **literal close-out tasks** (fixed
     wording — copy them from `docs/fix/_TEMPLATE/SPEC.md` `## Phases`, never
     paraphrase). Register the roadmap entry and hand off to
     `execute-phase <NN>` (it runs one phase per invocation, ticking the
     SPEC's `### Phases` checkboxes as its ledger).
   - **Split — mandatory, not advisory.** Before emitting the phase list for an
     M/L feature, split this feature into `Depends on:`-chained features if
     **any** holds: (a) the plan would exceed **~5 phases**; (b) a phase
     touches **more than one layer/concern**; (c) a phase requires a **design
     decision not resolved** in `SPEC.md`/`decisions.md`. Use the existing
     dependency infrastructure (transitive dependency gate + `workflow-status`
     build order) — never invent a new mechanism. More, smaller, slower
     features is the accepted trade; a phase a weak model cannot execute
     without judgement is not well-cut.
   - **Per-phase cheap-executability checklist.** Each phase you emit passes
     only if: ✓ every task is independently checkable **without judgement**;
     ✓ **zero open design decisions** (all resolved in `SPEC.md`/
     `decisions.md`); ✓ **one layer/concern**; ✓ its **verification gate runs
     locally**. A phase failing any box is re-cut or split (feeds the split
     rule above). State `n/a: <reason>` only where a box is genuinely
     inapplicable.
   - **Phase-lint (mandatory, emit-time).** Before emitting the phase list,
     run the canonical 8-box phase-lint (`docs/fix/_TEMPLATE/SPEC.md`
     `## Phases` "Phase-lint" — the authoritative copy, also quoted in
     `docs/features/_TEMPLATE/SPEC.md` `### Phases`) against every phase.
     Any FAIL → re-cut or split the phase using the mandatory-split rule
     above before emitting; never emit a phase with an unticked lint box.
   - **Spec-lint (mandatory, emit-time).** After filling the engineering
     half, run the SPEC template's `### Spec-lint` — **all boxes**: the
     engineering boxes plus the product boxes as a regression check
     (`design-feature` already passed them; a FAIL here means the product
     half regressed or the scaffold left placeholders). Presence checks
     only — mechanical, no quality judgement. Any FAIL → fix before the
     completion report; never report over a failed box.
   - **M/L** → generate the full set, mirroring the recent features':
     - `PLAN.md` — phased plan **labelled `P1, P2, …`** and called *phases*;
       phases are an *implementation* sequence, not a delivery boundary.
       **Naming is fixed: always `P1, P2, …` / "phases" — never `S1`/`S2` or
       "Steps".** The label is the executor's argument (`execute-phase NN P2`),
       so every artifact (`PLAN.md`, `TASKS.md`, `progress.md`) must use the same
       `P1, P2, …` labels. **The last implementation phase is always a hardening
       phase**: edge cases and the SPEC's dev-scenario failure modes
       (empty/degraded states, races, outages), implemented and tested — not just
       documented.
     - `TASKS.md` — per-phase checklists the executor ticks off. **The final
       phase's checklist always ends with these literal close-out tasks**:
       "[ ] open the PR (`gh pr create --body-file <path>` — body written as a
       Markdown file, real backticks, never inline `--body`/heredoc that leaves
       `\`-escaped backticks) and PRINT THE PR URL in the chat",
       "[ ] update the roadmap row to `done · [#<pr>](<pr-url>)`",
       "[ ] commit `docs: link PR #<n>` and push" — so the close-out is a
       ticked task, not an assumed behavior. **Emit each command-checkable
       acceptance criterion as the command** (a `grep`, a test invocation, a
       build) **— not as prose**; only genuinely judgement-only criteria stay
       prose, labelled `read-verified` (feature 07's `testing.md` is the
       reference shape). A weak executor verifies by *running* the command, not
       by judging prose.
     - `progress.md` — the phase handoff record, one entry per phase in
       `execute-phase`'s fixed schema (`## P<k> — <date> — <sha>` +
       `Done / Remains / Gotchas / Files / Next` lines — see *Phase handoff
       record* in `skills/execute-phase/SKILL.md`). Create it with just the
       header line `Last reviewed: —`; `execute-phase` appends the entries.
     - `testing.md` — what is tested at which layer (prefer integration); same
       command-checkable-as-command rule as `TASKS.md` above.
     - `known-issues.md` — deferred items, each linked to (or destined for) an
       issue. Do **not** plan to implement deferred work inline.
     - `decisions.md` — architecture/scope decisions + open questions.
     - `architecture-notes.md` — layer impact, ports, schema, bindings touched.
5. **Register in the roadmap** with number, ordering, dependencies, **and set
   the row's status to `planned`** — the `defined → planned` transition this
   skill owns (see the roadmap's Status legend). The row must already read
   `defined` on entry (step 1 confirmed the product half is `designed`); if
   the row is missing entirely (an already-scoped SPEC with no prior roadmap
   entry), add it directly at `planned` since the SPEC + artifacts this step
   produces satisfy that state in the same edit. **Verify the write before
   moving on**: re-read the roadmap row and confirm it literally reads
   `planned`. If it doesn't (a dropped write), re-apply the edit and re-read
   again — never end this step, or the turn, with the write unverified.
6. **Do not branch or code.** That belongs to `execute-phase`; record the branch
   name in the SPEC only.
7. **Hand off — return exactly** (fixed completion report):

   ```
   SCAFFOLD <NN>-<slug> — size: <XS|S|M|L>
   Artifacts written: <SPEC.md [+ PLAN.md TASKS.md progress.md testing.md
     known-issues.md decisions.md architecture-notes.md for M/L]>
   Roadmap: registered as <NN> (deps: <list|none>)   Phases: <n> (P1…P<n>, last = <hardening (M/L) | Hardening & PR (XS/S)>)
   Spec-lint: PASS (<n>/<n> boxes)   Phase-lint: PASS (all phases)
   Open questions: <n> (in decisions.md) | none
   ```

   The caller (`plan-feature`) prints the closing `→ Next:` block.

## Guardrails

- Docs only. No source edits, migrations, or dependencies.
- Respect the architecture: honor layer rules (inner layers don't import outer)
  and any domain/i18n/SEO/a11y rules from the docs map.
- **Architectural invariants.** Discover the optional document declared in the
  documentation map (normally `docs/architecture/ARCHITECTURAL_INVARIANTS.md`).
  Its absence is compatible: record `n/a: no project invariants declared` in
  the engineering half. For every applicable rule, record its ID, repository
  evidence, and `preserves | violates | introduces | changes` classification in
  `### Architecture impact`. Only `preserves` may produce phases; the other
  classifications stop for an explicit architectural decision through the
  project's declared authority. Never convert a violation into a phase task or
  infer approval from the product half. Consume frozen NRS facts when present;
  repository inspection remains authoritative.
- Surface conflicts (numbering clashes, dependency cycles, scope overlap) before
  writing, not after.
- Otherwise honor the project's **Workflow conventions** (branch/PR, docs-language).

## Relationship to other skills

Invoked by the `plan-feature` router (after `design-feature` /
`plan-feature-from-issue` designed the product half, or directly for an
already-designed scoped slug/SPEC). Hands off to `execute-phase` for P1;
`audit-docs` audits anytime.

## Done when

- `docs/features/<NN>-<slug>/` exists with the SPEC's engineering half +
  every planning artifact filled — the product half untouched from what
  `design-feature` / `plan-feature-from-issue` wrote.
- The roadmap lists the feature with correct number, order, dependencies, and
  **status `planned`** (the `defined → planned` write this skill owns) —
  **re-read and confirmed after the write**, not assumed from having run it.
- No code changed; open questions captured in `decisions.md`.
