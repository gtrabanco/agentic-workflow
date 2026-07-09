# 07 — roadmap-status-machine

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning mode from this spec.
>
> **One SPEC, two halves.** `design-feature`/`plan-feature-from-issue` write the
> **Product half** (product definition, capability closure, acceptance criteria)
> and stamp `## Design status`. `plan-feature` refuses to plan a feature not
> marked `designed`, then writes the **Engineering half** (architecture, design,
> phases, testing). One file, two owners, no drift.

## Goal

Wire the design→plan split (feature `06-design-feature`, U3) into the roadmap's
**status state machine** so the whole pipeline reads one ground-truth signal.
The roadmap status column becomes `idea → defined → planned → in-progress →
done`: a thin roadmap row **is** the wishlist (`idea` — no new file), `defined`
means the SPEC's product half is complete (design ran), `planned` means the full
SPEC + planning artifacts exist. Every sensor and executor then keys on that
status instead of on the SPEC-local `## Design status` marker: `workflow-status`
reports `idea` rows as design candidates and only calls `defined`+ units
startable; `execute-phase`'s gate redirects a sub-`planned` unit to the right
stage; and `ship-roadmap` satisfies the "nothing executes undesigned" invariant
by *complying* with the gate — its founding interview is batch design and mid-run
`idea` units get **just-in-time design from the locked founding decisions, with
no new questions**. This is U4 of the 2026-07-09 backlog; it formalizes the
status machine that U3 deliberately deferred.

## Branch

`feat/07-roadmap-status-machine`

## Size

`M` — no new skill; a shared-vocabulary change (the roadmap status legend in the
repo **and** `template/`, plus a `MIGRATION.md` legacy-compat note) rippled
through five skills (`workflow-status`, `execute-phase`, `ship-roadmap`,
`plan-feature`, and the two authoring internals `design-feature` /
`plan-feature-from-issue` / `plan-feature-scaffold` that must **set** the new
statuses), plus full `bump-skill` bookkeeping (EN/ES). Phased (full artifact
set), last phase hardening. It does not need splitting — the vocabulary and every
consumer of it move together, or the machine is half-wired and drifts.

## Dependencies

**Hard: `06-design-feature`** ([#13](https://github.com/gtrabanco/agentic-workflow/issues/13),
[PR #24](https://github.com/gtrabanco/agentic-workflow/pull/24) — **merged**
2026-07-09). U4 builds directly on U3's two-halves SPEC convention and the
`## Design status` marker: this feature migrates the pipeline's gate signal from
that SPEC marker to the roadmap status column, and cannot exist without the
marker/redirect it generalizes. No soft dependencies. The fix index
(`docs/fix/`) is empty and no open fix-now issue touches `workflow-status`,
`ship-roadmap`, `execute-phase`, `plan-feature`, or the roadmap template — the
only open issues are the remaining backlog units (#15–#21), none of which this
feature depends on.

---

## Product half

Written by `plan-feature-from-issue` from issue
[#14](https://github.com/gtrabanco/agentic-workflow/issues/14). Complete —
`## Design status` below reads `designed`.

### Context

Feature `06-design-feature` (U3) split the SPEC into a product half and an
engineering half and added a **redirect gate**: `plan-feature` refuses to plan a
feature whose product half is not marked `designed`, pointing the user at
`/design-feature`. U3 deliberately keyed that gate on a **SPEC-local marker**
(`## Design status`) as an interim measure, because *the roadmap had no status
value to represent "designed but not yet planned"*. Its SPEC records this
explicitly: *"U4 will migrate this check from the SPEC marker to the roadmap
`defined` status (the marker stays as the SPEC-local record)."*

Today the roadmap status legend has only `planned → in-progress → done`. That
conflates two very different states: a **thin wishlist row** with no design, and
a **fully-planned** unit ready to execute — both would read `planned`. Because of
that gap, three consumers can't act on design-completeness from the roadmap
alone:

- `workflow-status` (the orchestrator's sensor) parses `planned / in-progress /
  done` and calls any deps-met `planned` unit `startable_now` — even one that was
  never designed.
- `execute-phase`'s dependency gate checks *dependencies* but not *own
  design/plan state*, so it would happily start an undesigned unit.
- `ship-roadmap` (the autopilot) writes founding features straight to `planned`
  and forbids interviews mid-run — but has no defined behavior for a unit that
  reaches execution still undesigned. Its founding interview already elicits the
  product answers, so it *has* the material to design mid-run; it just isn't
  wired to.

This unit closes the gap by promoting the roadmap status to the pipeline's single
ground-truth state machine and teaching every consumer to read it.

### Business goals

n/a — internal workflow-quality feature (no external product surface). The
outcome it serves is **pipeline coherence on any agent**: one status vocabulary
that the sensor, the executor, and the autopilot all read the same way, so the
"nothing executes without a designed SPEC" invariant holds structurally — not by
each skill re-deriving design-completeness from a SPEC marker.

### Scope

#### In scope

- **Roadmap status vocabulary — repo and `template/`.** Update the status legend
  and conventions in `docs/features/ROADMAP.md` **and**
  `template/docs/features/ROADMAP.md` to the five-state machine:
  - `idea` — a row exists on the roadmap (the wishlist); no completed product
    design. **No new file** — a thin row *is* an idea.
  - `defined` — a `SPEC.md` exists with the **product half complete**
    (`## Design status: designed`, capability closure filled). `design-feature`
    or `plan-feature-from-issue` produced it.
  - `planned` — full SPEC (**engineering half filled**) + planning artifacts
    exist. `plan-feature-scaffold` produced them.
  - `in-progress` — branch open, phases executing.
  - `done` — PR open; **merge state lives in the forge** (semantics unchanged
    from today).
  The legend states the allowed transitions and which skill performs each.
- **`workflow-status` reads the machine.** Its roadmap parse recognizes all five
  statuses; `startable_now` requires status **≥ `defined`** *and* deps met; `idea`
  rows are reported separately as **design candidates** (next action
  `/design-feature`), never as startable. The machine envelope gains a
  `design_candidates` list alongside `startable_now` / `blocked_units`.
- **`execute-phase` gate redirects sub-`planned` units.** In the dependency-gate
  area (which already runs before any edit for every mode), add an **own-status
  precondition**: a unit whose roadmap row is below `planned` STOPS with a
  redirect aligned to U3's `plan-feature` redirect —
  `idea` → `/design-feature <slug>`; `defined` → `/plan-feature <slug>`. `--force`
  remains the only escape hatch (recorded in `decisions.md`); the autopilot never
  passes it.
- **The authoring skills SET the status.** The transitions become writes, not
  just reads:
  - `design-feature` and `plan-feature-from-issue` set the roadmap row to
    `defined` when they stamp `## Design status: designed`.
  - `plan-feature-scaffold` sets the row to `planned` when it registers the full
    artifact set (XS/S SPEC-only included — scaffold still runs and still lands
    the row at `planned`).
  - `plan-feature`'s redirect gate keys on the **roadmap status** as the primary
    signal (SPEC `## Design status` stays as the SPEC-local record and the
    legacy-compat fallback — see Product decisions).
  - `execute-phase` P1 moves the row `planned → in-progress` (as today); the
    PR-open step moves it to `done` (as today).
- **`ship-roadmap` satisfies the gate, never breaks on it.**
  - Its founding interview **is batch design**: the locked founding decisions
    (`SHIP_DECISIONS.md`) are the product answers for every founding feature.
  - A mid-run unit still at `idea` gets **JIT design from the locked founding
    decisions — no new questions** (the "no further questions after the interview"
    contract is preserved): the autopilot composes design→plan in-turn, promoting
    the unit `idea → defined → planned` before executing.
  - A unit genuinely **undesignable from the founding record** (emerged mid-run,
    or contradicts a locked decision) → `NEEDS_INPUT`, the unit is **parked**
    (not silently guessed).
- **`MIGRATION.md` legacy-compat note.** Existing roadmaps with plain `planned`
  rows must keep working: a legacy `planned` row **whose SPEC product half is
  complete** is treated as `defined`+`planned` (no redirect); documented so
  projects set up before U4 don't break.
- **`bump-skill` bookkeeping.** Minor bumps for every touched skill; `CHANGELOG.md`
  **and** `CHANGELOG.es.md` rows; README skills + model tables (EN/ES) kept
  consistent.

#### Out of scope / non-goals

- **Removing the SPEC `## Design status` marker** — kept as the SPEC-local record
  and the legacy-compat fallback. The roadmap status becomes the *primary* gate
  signal; the marker is not deleted.
- **A new roadmap file or per-status sub-index** — an `idea` is a thin row, not a
  document; no new files.
- **`review-change --adversarial N`** — U8 ([#18](https://github.com/gtrabanco/agentic-workflow/issues/18)).
- **Phase-economics rules** (split thresholds, criteria-as-commands) — U5
  ([#15](https://github.com/gtrabanco/agentic-workflow/issues/15)).
- **Removing the JSON envelope from skills** — U7
  ([#17](https://github.com/gtrabanco/agentic-workflow/issues/17)); this feature
  *adds* one envelope field to `workflow-status`, it does not touch the
  envelope-removal decision.
- **`init-workspace` upgrade/migration mode** — U10
  ([#20](https://github.com/gtrabanco/agentic-workflow/issues/20)); this feature
  ships the legacy-compat *rule* in `MIGRATION.md`, not an automated migrator.
- **Changing `done` semantics** — unchanged (`done` = PR open; merge state in the
  forge).

### Capability closure

The "entity" this feature introduces is the **roadmap feature status** — a state
machine, not a CRUD record. There is no runtime UI/API and no end-user roles;
this is workflow tooling whose "surfaces" are the skills that read and write the
status. Each closure row therefore resolves to a skill surface + a checkable
doc/grep test, or an explicit `n/a` with reason (same adaptation feature 06 used
for a docs/skills feature).

```markdown
For the entity "roadmap feature status" (a state machine):
- [x] Create — a status value is not created independently; a roadmap ROW is
      created (status `idea`) by the human/skill adding the row. UI entry: the
      roadmap table row · API: n/a (Markdown) · test: legend documents `idea` as
      the initial state.  | (create-of-a-status-value: n/a — status is an attribute of a row)
- [x] Read/list — UI: `workflow-status` human summary + machine envelope
      (`startable_now`, `design_candidates`, `blocked_units`) · API: the envelope
      JSON · test: envelope lists an `idea` row under `design_candidates` and a
      `defined`/`planned` deps-met row under `startable_now`.
- [x] Update (the transitions) — see State transitions below.
- [x] Delete — n/a: roadmap numbers/rows are never reused or deleted (roadmap
      convention "Numbers are assigned in order and never reused"); a dropped
      feature is a `product-audit` proposal, not a status delete.
- [x] State transitions:
      - `idea → defined` — performed by `design-feature` / `plan-feature-from-issue`
        (on stamping `## Design status: designed`). test: those skills' bodies set
        the roadmap row to `defined`.
      - `defined → planned` — performed by `plan-feature-scaffold` (on registering
        artifacts). test: scaffold sets the row to `planned`.
      - `planned → in-progress` — performed by `execute-phase` P1 (unchanged).
      - `in-progress → done` — performed by the PR-open step (unchanged).
      Each transition has a single owning skill + a doc/grep test; no transition
      is unowned.

For EACH capability (action a user/agent can take):
- [x] "See what needs design / what is startable" — entry point: `workflow-status`
      (`design_candidates` vs `startable_now`) · ACL: n/a (read-only sensor, no
      permissions).
- [x] "Be redirected when executing an undesigned/unplanned unit" — entry point:
      `execute-phase` dependency-gate area (idea→design, defined→plan redirect) ·
      ACL: `--force` is the user-only override; the autopilot may never pass it.
- [x] "JIT-design a mid-run `idea` unit with no new questions" — entry point:
      `ship-roadmap` loop · ACL: derived solely from the locked founding
      decisions; undesignable → `NEEDS_INPUT`, unit parked.

For EACH role / permission:
- [x] n/a — no runtime users or roles. The only authority distinctions are
      skill-internal and already covered by the capability ACL rows above
      (`--force` is user-only; the autopilot is forbidden from it).
```

### Acceptance criteria

Each is objectively checkable; textual ones are runnable commands (repo-verify
gate — no application build).

1. **Five-state legend, repo.** `docs/features/ROADMAP.md` status legend lists
   `idea` and `defined` with the meanings above:
   `grep -q '`idea`' docs/features/ROADMAP.md` **and**
   `grep -q '`defined`' docs/features/ROADMAP.md`.
2. **Five-state legend, template.** Same for the exported scaffold:
   `grep -q '`idea`' template/docs/features/ROADMAP.md` **and**
   `grep -q '`defined`' template/docs/features/ROADMAP.md`.
3. **`workflow-status` parses the machine.** Its body names all five statuses and
   defines `design_candidates`, and requires `defined`+ for `startable_now`:
   `grep -iq 'design_candidates' skills/workflow-status/SKILL.md` **and**
   `grep -iq 'defined' skills/workflow-status/SKILL.md` (the `startable_now ≥
   defined` rule and the `idea → design candidate` mapping verified by read).
4. **`workflow-status` envelope example updated.** The sample envelope in the
   skill shows `design_candidates` as a top-level key alongside `startable_now`
   (verified by read).
5. **`execute-phase` gate redirects sub-`planned` units.** Its dependency-gate
   section adds an own-status precondition pointing `idea → /design-feature` and
   `defined → /plan-feature`:
   `grep -q '/design-feature' skills/execute-phase/SKILL.md` **and**
   `grep -q '/plan-feature' skills/execute-phase/SKILL.md` (the sub-`planned`
   STOP + `--force` override verified by read).
6. **Authoring skills set the status.** `design-feature` and
   `plan-feature-from-issue` set the row to `defined`; `plan-feature-scaffold`
   sets it to `planned`:
   `grep -iq 'defined' skills/design-feature/SKILL.md` **and**
   `grep -iq 'defined' skills/plan-feature-from-issue/SKILL.md` **and**
   `grep -iq 'planned' skills/plan-feature-scaffold/SKILL.md` (the *set* action,
   not incidental mention, verified by read).
7. **`plan-feature` gate keys on roadmap status.** The redirect gate reads the
   roadmap status as the primary signal, with the SPEC marker as legacy fallback:
   verified by read (the section names the roadmap status and the legacy
   `planned`-with-designed-SPEC fallback).
8. **`ship-roadmap` batch/JIT design wired.** Its body states founding = batch
   design, mid-run `idea` → JIT design from locked decisions with no new
   questions, and undesignable → `NEEDS_INPUT` + park:
   `grep -iq 'JIT\|just-in-time' skills/ship-roadmap/SKILL.md` **and**
   `grep -iq 'NEEDS_INPUT' skills/ship-roadmap/SKILL.md` (the no-new-questions
   contract preserved, verified by read).
9. **Legacy compat documented.** `docs/workflow/MIGRATION.md` documents that a
   legacy `planned` row with a complete SPEC product half is treated as
   `defined`+`planned` (no redirect):
   `grep -iq 'defined' docs/workflow/MIGRATION.md` (the legacy `planned` rule
   verified by read).
10. **Discoverable / parses.** `npx skills add . --list` lists every skill
    (all touched files parse).
11. **Bookkeeping consistent.** `bump-skill` ran: a minor bump for each touched
    skill has rows in `CHANGELOG.md` **and** `CHANGELOG.es.md`, and the README
    skills + model tables (EN/ES) reflect the new versions — the consistency
    `audit-docs` checks.
12. **No stack leakage.** No product/stack/framework/ORM/runtime reference leaked
    into the touched skills or shared docs (generic phrasing only) — verified by
    read.
13. **`## Portability` intact.** Every touched user-facing skill still carries its
    `## Portability` section and closing `→ Next:` block — verified by read.
14. **PR carries `Closes #14`.**

### Tooling

- `bump-skill` (repo skill) — mandatory after every SKILL.md edit; drives the
  version bumps + changelog + README tables.
- `audit-docs` (installed skill) — cross-doc consistency check run in hardening.
- No MCPs apply. n/a beyond the above.

### Product decisions

- **Primary gate signal migrates SPEC-marker → roadmap status; marker retained** —
  RESOLVED (issue #14 + inherited from #13's deferral). The roadmap status is the
  single ground-truth the pipeline reads; the SPEC `## Design status` stays as the
  SPEC-local record and the legacy fallback. Rationale: one status vocabulary all
  consumers share, without a body-shape change to existing SPECs.
- **Legacy `planned`-with-complete-SPEC = `defined`+`planned`** — RESOLVED (issue
  constraint). Existing roadmaps must keep working; documented in `MIGRATION.md`.
  Rationale: no forced re-labelling of already-shipped projects.
- **Execution requires `planned`, not `defined` (resolves the issue's open
  question "or `defined` for single-pass?")** — RESOLVED. `execute-phase` requires
  `planned` for **every** mode including XS/S single-pass, because
  `plan-feature-scaffold` runs even for XS/S (SPEC-only) and lands the row at
  `planned`. A `defined` unit is redirected to `/plan-feature`, never executed
  directly. Rationale: one uniform executable state; no special-case where
  `defined` is sometimes runnable.
- **`ship-roadmap` complies via batch/JIT design, never via an exemption** —
  RESOLVED (issue invariant). The autopilot has no bypass; the "nothing executes
  undesigned" rule holds because founding *is* design and mid-run design is
  derived from the locked record. Rationale: a single invariant with no autopilot
  carve-out.
- **`idea` is a thin row, not a file** — RESOLVED (issue). No new document type.

## Design status

`designed` — product half complete (capability closure done, every row filled or
explicit `n/a`). Set by `plan-feature-from-issue` from issue #14. `plan-feature`
may now plan this feature.

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold`, product half being
`designed`.

### Technical goals

- Promote the **roadmap status column** to the pipeline's single state machine
  (`idea → defined → planned → in-progress → done`) and make it the primary gate
  signal every sensor/executor reads.
- Make each transition **owned by exactly one skill** (a write), so status is
  never inferred and never drifts from the artifacts it represents.
- Preserve the U3 invariant **"nothing executes without a designed SPEC"** by
  wiring compliance (redirects + autopilot batch/JIT design), not exemptions.
- Keep full **backward compatibility** with legacy `planned`-only roadmaps via a
  documented equivalence rule.
- Keep every touched skill portable and weak-model-executable (checklists, fixed
  output formats, `## Portability`) per the repo authoring contract.

### Architecture impact

Docs/skills-only change — the skills and the roadmap vocabulary are the product.
Invariants to hold:

- **Single source of truth.** The roadmap status is the ground truth; skills read
  it and (for their owned transition) write it. No skill invents a status from
  git/PR state except where already defined (`done`'s merge-state-in-forge rule is
  unchanged).
- **Owned transitions, no double-writers.** Exactly one skill performs each edge
  (`idea→defined`: design/from-issue; `defined→planned`: scaffold;
  `planned→in-progress`: execute-phase P1; `→done`: PR-open step). Any other skill
  only reads.
- **Hand off, don't compose across a lower tier.** `plan-feature` still hands off
  to `design-feature` (never composes it below its tier); `ship-roadmap`'s JIT
  design composes design→plan in-turn only within the ≥-tier rule it already
  documents (both opus/high).
- **Stack/architecture agnostic** — generic phrasing only; no stack leakage into
  skills or shared docs.
- **Machine envelope** — `workflow-status` gains one field (`design_candidates`);
  the envelope contract per `orchestration-envelope` is otherwise unchanged. The
  U7 envelope-removal decision is untouched.
- **One PR per unit, against `main`**; conventional commits.

### Design

#### The status state machine

```
idea ──design-feature / plan-feature-from-issue──▶ defined
        (stamps ## Design status: designed;
         sets roadmap row → defined)
                                                     │
                        plan-feature-scaffold        │
             (fills engineering half + artifacts;    ▼
              sets roadmap row → planned)          planned
                                                     │
                     execute-phase P1                │
              (branch open; row → in-progress)       ▼
                                                 in-progress
                                                     │
                        PR-open step                 │
              (row → done; merge state in forge)     ▼
                                                    done
```

- **`idea`** — a roadmap row with no completed product design. It may have no
  folder at all (pure wishlist) or a folder whose SPEC product half is not
  `designed`. The thin row *is* the idea.
- **`defined`** — `SPEC.md` product half complete (`## Design status: designed`,
  capability closure filled).
- **`planned`** — engineering half filled + planning artifacts present.
- **`in-progress` / `done`** — unchanged from today.

#### Roadmap legend (repo + template)

Rewrite the `## Status legend` in both `docs/features/ROADMAP.md` and
`template/docs/features/ROADMAP.md` to list all five states with the owning skill
per transition, and update the `## Conventions` block so the dependency rule reads
against the new vocabulary (a dependency must be **merged**, unchanged; a unit is
executable only when **`planned`**). The repo roadmap's existing rows (01–06) are
all `done` and need no relabelling.

#### `workflow-status` (sensor) — read the machine

- **Parse (step 3).** Recognize `idea / defined / planned / in-progress / done`.
- **Classify.**
  - `idea` rows → new **`design_candidates`** list (next action
    `/design-feature <slug>`), never `startable_now`.
  - `defined`/`planned` rows with **deps met** → `startable_now`, with the next
    command matched to the exact status: `defined` → `/plan-feature <slug>`,
    `planned` → `/execute-phase <NN> P1`.
  - deps unmet → `blocked_units` (unchanged).
- **Envelope.** Add `design_candidates` as a top-level array beside
  `startable_now` / `blocked_units`; update the sample envelope in the skill body.
- **Human summary.** The status table gains the `idea`/`defined` rows and a
  "design candidates" line. Read-only stance unchanged.

#### `execute-phase` — own-status precondition in the gate

In the **Dependency gate** section (runs before any edit, every mode), after the
transitive-dependency check, add an **own-status** check:

- Read this unit's roadmap status.
- `idea` (or no `designed` SPEC) → STOP, redirect `→ /design-feature <slug>`.
- `defined` (designed, not yet planned) → STOP, redirect `→ /plan-feature <slug>`.
- `planned`+ → proceed.
- `--force` skips the STOP (never the check); the override is recorded in
  `decisions.md`. The autopilot must never pass `--force` (unchanged rule).

The redirect block mirrors the fixed shape of the existing dependency-gate STOP
(a `→ Next:` line + sub-bullets), so the output contract stays uniform.

#### Authoring skills — set the status (the writes)

- **`design-feature`** — when it stamps `## Design status: designed`, also set the
  feature's roadmap row status to `defined` (add the row as `idea` first if it
  does not exist, then promote). Documented as an explicit step + in the closing
  contract.
- **`plan-feature-from-issue`** — same write when it produces the product half:
  register/promote the roadmap row to `defined` alongside the `Closes #N` wiring.
- **`plan-feature-scaffold`** — when it registers the full artifact set, set the
  row `defined → planned` (its existing "Register in the roadmap" step now writes
  the status value, not just the row).
- **`plan-feature`** (router) — the redirect gate reads the **roadmap status**
  first: `idea`/absent-and-undesigned → STOP → `/design-feature`; `defined`+ →
  proceed to scaffold. The SPEC `## Design status` marker remains the
  legacy-compat fallback: a legacy `planned` row whose SPEC product half is
  complete is treated as `defined`+ (no redirect).

#### `ship-roadmap` — comply, never break

- **Founding = batch design.** Document that the founding interview's rounds 2–4
  (features, quality/ops, workflow) *are* the product-definition answers for every
  founding feature; the locked `SHIP_DECISIONS.md` is the design record. Founding
  writes feature rows at `idea` carrying those locked decisions (the roadmap table
  today writes `planned`; under the machine, founding features that don't yet have
  a scaffolded SPEC are `idea` — the substrate/init feature it always writes stays
  a normal planned unit once scaffolded).
- **Mid-run JIT design.** When the selected next unit is `idea`, the autopilot
  composes design→plan in-turn **from the locked founding decisions, asking no new
  questions** (preserving the "no further questions after the interview"
  contract), promoting the unit `idea → defined → planned` before `execute-phase`.
  Compose within the ≥-tier rule already stated for founding (both opus/high).
- **Undesignable → park.** A unit that cannot be designed from the locked record
  (emerged mid-run, or contradicts a locked decision) → emit `NEEDS_INPUT`, park
  the unit, continue with the next startable one (or stop per the run's budget
  rules). No silent guessing; no mid-run interview.

### Decisions to confirm

- **Execution requires `planned` uniformly** — RESOLVED in Product decisions
  (XS/S included; scaffold always lands `planned`). Engineering consequence:
  `execute-phase`'s `defined` branch always redirects to `/plan-feature`, never
  runs single-pass off a bare `defined`.
- **`workflow-status` adds one envelope field, not a schema overhaul** — RESOLVED:
  `design_candidates` is additive; all existing keys stay. Keeps U7 (envelope
  removal) independent.
- **Founding writes `idea` rows for not-yet-scaffolded features** — RESOLVED: the
  autopilot promotes them JIT. The one substrate/init unit founding scaffolds
  immediately stays a normal `planned` unit. Rationale: founding shouldn't fake
  `planned` on rows that have no artifacts yet.
- **No automated legacy migrator here** — RESOLVED: the equivalence rule is
  documentation (`MIGRATION.md`); the automated upgrade path is U10.

### Testing requirements

No application build exists — "green" is the repo's doc-verification gate
(`CLAUDE.md` → Verification):

- **Structural:** `npx skills add . --list` lists every skill (all touched files
  parse).
- **Textual (acceptance criteria as commands):** run the `grep` checks in
  Acceptance criteria 1, 2, 3, 5, 6, 8, 9.
- **Cross-doc:** `bump-skill` bookkeeping consistent (each touched skill's
  `version:` ↔ changelog rows EN/ES ↔ README skills+model tables EN/ES);
  documentation-map + skill-reference links resolve — run `/audit-docs` after the
  edits.
- **Weak-model read-through:** re-read each edited skill as if run by the fleet's
  weakest model — the status precondition, the `startable_now ≥ defined` rule, and
  the JIT-design "no new questions" contract each expressed as an independently
  checkable step with a fixed output, no "if needed".
- **Manual dry-runs:** (a) `workflow-status` on a roadmap containing an `idea`
  row and a `defined` row — confirm the former lands in `design_candidates`, the
  latter in `startable_now` with `/plan-feature` as next; (b) `execute-phase` on a
  `defined` unit — confirm the `/plan-feature` redirect fires; (c) a legacy
  `planned`-with-designed-SPEC row — confirm no redirect.

No unit/integration test layer applies (no code).

### Dev scenarios

The change is skill/doc text (no runtime), but it defines process situations an
executor/autopilot must reproduce. Listed as prose (no runnable harness in this
repo):

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `status:idea-candidate` | a thin `idea` roadmap row | `workflow-status` lists it under `design_candidates`, next `/design-feature`, never `startable_now` |
| `status:defined-startable` | a `defined` row, deps met | `workflow-status` lists it under `startable_now` with `/plan-feature` as next |
| `execute:redirect-idea` | `execute-phase` on an `idea` unit | gate STOP → `/design-feature <slug>` |
| `execute:redirect-defined` | `execute-phase` on a `defined` unit | gate STOP → `/plan-feature <slug>` |
| `legacy:planned-compat` | a pre-U4 `planned` row with a complete SPEC product half | treated as `defined`+`planned`; no redirect |
| `ship:jit-design` | autopilot reaches an `idea` unit mid-run | JIT design from locked `SHIP_DECISIONS.md`, no new questions → promote → execute |
| `ship:undesignable` | a mid-run unit contradicting a locked decision | `NEEDS_INPUT`, unit parked, no silent guess |

### Phases

**P1 — Status vocabulary (repo + template) + legacy-compat note + planning
artifacts.** Rewrite the `## Status legend` and `## Conventions` in
`docs/features/ROADMAP.md` and `template/docs/features/ROADMAP.md` to the
five-state machine (owning skill per transition). Add the legacy `planned`↔
`defined`+`planned` equivalence rule to `docs/workflow/MIGRATION.md`. **P1 also
commits the planning artifacts** for this feature. This is the vocabulary every
later phase references.

**P2 — Sensor + executor read the machine.** `workflow-status`: parse five
statuses, `startable_now ≥ defined`, add `design_candidates` (list + envelope
field + sample envelope + human summary). `execute-phase`: add the own-status
precondition to the dependency gate (`idea→/design-feature`,
`defined→/plan-feature`, `--force` recorded). Minor bumps.

**P3 — Authoring skills set the status.** `design-feature` and
`plan-feature-from-issue` → set row `defined`; `plan-feature-scaffold` → set row
`planned`; `plan-feature`'s redirect gate reads roadmap status first (SPEC marker
as legacy fallback). Minor bumps.

**P4 — `ship-roadmap` batch/JIT design.** Document founding = batch design;
mid-run `idea` → JIT design from locked decisions with no new questions →
promote → execute; undesignable → `NEEDS_INPUT` + park. Minor bump.

**P5 — Hardening + bookkeeping.** Edge cases + the dev-scenario failure modes
(`ship:undesignable`, `legacy:planned-compat`, `execute:redirect-*`). Run
`bump-skill` (minor bumps for every touched skill → `CHANGELOG.md` +
`CHANGELOG.es.md` + README skills+model tables EN/ES). Run `npx skills add .
--list`; run every acceptance-criteria command; `/audit-docs` for cross-doc
consistency; weak-model read-through; confirm no stack leakage, `## Portability`
intact, `→ Next:` blocks last. Open the PR with `Closes #14`, print the URL,
update the roadmap row to `done`.

### Deploy & rollback

n/a — merging the PR is the whole deploy. Rollback = revert the PR; no data, no
migration, no config. The one migration surface is **documentation**: the legacy
`planned`↔`defined` equivalence in `MIGRATION.md` so projects set up before U4
keep working without relabelling — not a runtime migration.

### Open questions / risks

- **Risk: double-writers on a transition.** If more than one skill writes the same
  status edge, drift returns. Mitigation: the Design assigns exactly one owner per
  edge; the weak-model read-through in P5 verifies no second writer was introduced.
- **Risk: legacy roadmaps mis-gated.** A pre-U4 `planned` row could be wrongly
  redirected as undesigned. Mitigation: the `plan-feature`/`execute-phase` gates
  fall back to the SPEC `## Design status` marker for legacy `planned` rows; the
  `legacy:planned-compat` dev scenario is exercised in P5.
- **Risk: `ship-roadmap` JIT design asks a question.** Would break the "no further
  questions" contract. Mitigation: JIT design is explicitly derive-only from
  `SHIP_DECISIONS.md`; anything not derivable → `NEEDS_INPUT` (park), never a
  prompt. Verified in the weak-model read-through.
- **Inherited from #13 (RESOLVED here):** "U4 migrates the gate from the SPEC
  marker to the roadmap `defined` status" — done in P3, marker retained as
  fallback.

### Deliverables

- Edited `docs/features/ROADMAP.md` + `template/docs/features/ROADMAP.md` (five-
  state legend + conventions).
- Edited `docs/workflow/MIGRATION.md` (legacy-compat rule).
- Edited skills (minor bumps): `skills/workflow-status/SKILL.md`,
  `skills/execute-phase/SKILL.md`, `skills/ship-roadmap/SKILL.md`,
  `skills/plan-feature/SKILL.md`, `skills/design-feature/SKILL.md`,
  `skills/plan-feature-from-issue/SKILL.md`, `skills/plan-feature-scaffold/SKILL.md`.
- `CHANGELOG.md` + `CHANGELOG.es.md` rows; README (EN/ES) skills + model tables —
  via `bump-skill`.
- This SPEC + the full planning artifact set (`PLAN.md`, `TASKS.md`,
  `progress.md`, `testing.md`, `known-issues.md`, `decisions.md`,
  `architecture-notes.md`) and the `docs/features/ROADMAP.md` entry (row 07).
- PR against `main` carrying `Closes #14`.

### Post-merge next feature

Per the backlog execution order (U1→U2→U3→U4→**U5**…), the next unit is **U5 —
Phase economics** ([#15](https://github.com/gtrabanco/agentic-workflow/issues/15)):
split rules, a cheap-executability checklist, and acceptance criteria as runnable
commands. It has no hard dependency on this unit. See `docs/features/ROADMAP.md`.
