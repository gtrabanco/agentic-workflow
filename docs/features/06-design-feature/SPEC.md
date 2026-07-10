# 06 — design-feature

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning mode from this spec.

## Goal

Introduce a new user-facing **`design-feature`** skill that owns *product*
definition — the stage that turns an idea or a feature request into an
exhaustive, checkable set of acceptance criteria — and slim `plan-feature` down
to *engineering* planning. The core mechanism is **capability closure**: a
checklist that forces every entity, capability, and role a feature introduces to
be walked to its full surface (CRUD + state transitions + UI entry point + API +
test, or an explicit design-time `n/a`), so non-frontier executor models stop
silently omitting the implicit work ("auth with dashboard management and ACLs"
must not collapse to a users table + a list view). The SPEC becomes **one
document filled in two halves**: `design-feature` writes the product half,
`plan-feature` completes the engineering half. `plan-feature` gains a friendly
STOP-and-redirect when a feature has not been designed yet. This is U3 of the
2026-07-09 backlog — the structural core the rest of the pipeline redesign
(U4's roadmap-status machine) builds on.

## Branch

`feat/06-design-feature`

## Size

`M` — one new skill (`design-feature`, the substantial deliverable), a MAJOR
slim of the `plan-feature` router, retirement of the `plan-feature-interview`
internal step (its logic migrates into `design-feature`), a SPEC-template
convention change, a `MIGRATION.md` note, and full `bump-skill` bookkeeping
(EN/ES). Phased (full artifact set). It sits at the M/L boundary but does **not**
need further splitting: the roadmap-status machine and workflow-status/
ship-roadmap wiring that would push it to L are already carved out into **U4**
([#14](https://github.com/gtrabanco/agentic-workflow/issues/14)).

## Dependencies

**None (hard or soft).** Issue [#13](https://github.com/gtrabanco/agentic-workflow/issues/13)
declares "M-L · no dependencies (U4 depends on this)". The backlog execution
order places U1 → U2 → **U3**; both predecessors have shipped and merged
(U1 = feature `04-running-economically`,
[PR #22](https://github.com/gtrabanco/agentic-workflow/pull/22), merged;
U2 = feature `05-adversarial-context-clean-review`,
[PR #23](https://github.com/gtrabanco/agentic-workflow/pull/23), merged), so no
predecessor work is unshipped. The fix index (`docs/fix/`) holds no entries and
no open fix-now issue touches `plan-feature`, `plan-feature-interview`,
`plan-feature-from-issue`, `plan-feature-scaffold`, or the SPEC template — the
only open issues are the remaining backlog units (#14–#21). **U4 depends on this
unit**, not the reverse.

## Context

`plan-feature` today mixes two different jobs: product definition (its
`plan-feature-interview` path interviews a raw idea into a SPEC) and engineering
planning (`plan-feature-scaffold` produces PLAN/TASKS and registers the roadmap).
Because there is no dedicated stage whose only job is to **close implicit work**,
a SPEC can leave the implicit implicit. Frontier models improvise the rest; the
fleet's cheaper execution models (see the model-fleet note in the backlog memory)
do not — they build exactly what is written and omit the login screen, the
create/delete/suspend actions, and the ACL management that "auth with dashboard
management and ACLs" obviously implies. The result is under-built features that
pass a shallow review because the SPEC never named the missing surface.

This unit fixes the process at the definition stage: a new `design-feature` skill
makes capability closure a **uniform gate** (cheap to pass for XS features
because it scales down, not because it opens), and `plan-feature` becomes a pure
engineering-planning step that refuses to plan an undesigned feature and points
the user at `design-feature` instead — the same friendly-STOP shape the
dependency gate already uses.

## Business goals

n/a — internal workflow-quality feature (no external product surface). The
outcome it serves is *build-completeness on weaker models*: features defined
through this gate ship with the implicit work made explicit, so any agent — not
only frontier Claude — implements the whole surface.

## Technical goals

- Add a **product-definition stage** to the skill pipeline
  (design → plan → execute → review → audit), owned by one new user-facing skill.
- Make **capability closure** a fixed, checkable checklist (per entity, per
  capability, per role) whose output is exhaustive acceptance criteria — not a
  heuristic a weak model can skim past.
- Establish the **one-SPEC-in-two-halves** convention (product half vs
  engineering half) with a machine-checkable "design complete" marker, so exactly
  one document carries a feature and drift between a design doc and a plan doc is
  structurally impossible.
- Slim `plan-feature` to defined-feature → engineering half → artifacts +
  roadmap, and add a **no-bypass redirect** to `design-feature` when a feature's
  product half is not complete.
- Keep every skill portable and weak-model-executable per the repo's authoring
  contract (checklists over heuristics, fixed output formats, `## Portability`).

## Scope

### In scope

- **New skill `skills/design-feature/SKILL.md`** (`user-invocable: true`,
  `version: 1.0.0`). Canonical name `design-feature`. Body sections per the repo
  authoring contract: `## Turn contract`, `Step 0 — Discover the project`,
  `Process`, `Guardrails`, `## Portability`, `Relationship to other skills`,
  `Done when`, closing `→ Next:` block. Capabilities:
  - **Capability closure** (the core): a fixed checklist —
    - *per entity introduced* → create / read / update / delete / state
      transitions (suspend, block, archive…), **each** with a UI entry point +
      API surface + test, or an **explicit design-time `n/a`** with a reason;
    - *per capability* → a visible entry point + who may execute it (ACLs fall
      out of this row);
    - *per role / permission* → where it is assigned, revoked, and viewed.
    Output: exhaustive, checkable **acceptance criteria** written into the SPEC's
    product half.
  - **Proportional research**: capability-closure checklist first (cheap);
    external/domain research **only** when the domain is new to the project. **No**
    systematic per-feature market research (explicitly rejected in the backlog).
  - **Per-feature tooling notes**: check installed skills/MCPs relevant to *this*
    feature and record them in the SPEC's Tooling section. (Heavy *global*
    discovery is U6/product-audit's job — not here.)
  - **Upsert semantics**: `design-feature <existing-slug>` re-reads the SPEC +
    `decisions.md` and never destroys recorded decisions — revisions are appended
    to `decisions.md`. Starting from zero requires the user to explicitly say
    "delete and redesign". **No `--update` flag** (user decision): upsert is the
    default.
  - **Interaction rule**: bare `design-feature <slug>` → FIRST print a summary of
    what the feature will do and ask what to remove/change (this doubles as review
    mode); `design-feature <slug> <instruction>` → apply the change directly, no
    questions, touching only what the instruction implies.
  - **Scales down**: for XS features the interview may be a single question and
    most closure rows resolve to `n/a` — the gate stays uniform; passing it is
    cheap.
  - Writes the **product half** of `SPEC.md` and stamps the design-complete
    marker (see Design).
- **SPEC template — two halves + marker.** Update
  `docs/features/_TEMPLATE/SPEC.md` to (a) group its sections into a **Product
  half** (Goal, Context, Scope in/out, Capability closure → Acceptance criteria,
  Tooling, product Decisions) and an **Engineering half** (Architecture impact,
  Design, Phases, Testing, Dev scenarios, Deploy & rollback), and (b) carry a
  machine-checkable **design-complete marker** the `plan-feature` gate reads.
- **`plan-feature` router slim (MAJOR).** Remove the raw-idea interview path from
  the router. Given a feature whose product half is **not** complete, `plan-feature`
  **STOPS and redirects**: `run /design-feature <slug>` — dependency-gate style
  (friendly stop, next command printed, **no bypass flag**). Given a designed
  feature, it proceeds as today (scaffold the engineering half + register the
  roadmap). Router version bumped **major**; `MIGRATION.md` note added.
- **Retire `plan-feature-interview`.** Its raw-idea interview logic migrates into
  `design-feature`. The internal skill is removed (its directory deleted) and all
  references to it (router internals, docs) are repointed to `design-feature`.
  This is a rename/removal → **major** for the affected surface, noted in
  `MIGRATION.md`.
- **Adapt `plan-feature-from-issue`.** It continues to map an issue → identity +
  `Closes #N`, but now writes the SPEC's **product half** in the two-halves format
  and must satisfy the capability-closure gate (for a thin issue it hands the
  seed to `design-feature`; for an already-detailed issue it fills the product
  half directly, closure included). Minor bump (its contract shape is unchanged;
  it emits the two-halves SPEC).
- **`plan-feature-scaffold` alignment.** It fills only the **engineering half** of
  an already-designed SPEC (no longer the product sections) and generates
  PLAN/TASKS/… as today. Minor bump if its body text changes; no behavior
  regression for M/L artifact generation.
- **Workflow docs.** Update `docs/workflow/FEATURE_WORKFLOW.md` (and the skill
  reference in `docs/workflow/SKILLS.md`) to name the five-stage pipeline
  **design → plan → execute → review → audit** and describe the two-halves SPEC
  and the redirect gate. Update `docs/workflow/MIGRATION.md` with the major-change
  notes (router slim, interview retirement).
- **`bump-skill` bookkeeping.** New skill row for `design-feature` (1.0.0);
  major bump for `plan-feature`; removal row for `plan-feature-interview`; minor
  bumps for `plan-feature-from-issue` / `plan-feature-scaffold` as touched;
  `CHANGELOG.md` **and** `CHANGELOG.es.md` rows; README skills+model tables
  (EN/ES) updated.

### Out of scope / non-goals

- **Roadmap `defined` state + workflow-status / ship-roadmap wiring** — owned by
  **U4** ([#14](https://github.com/gtrabanco/agentic-workflow/issues/14)). This
  unit introduces the SPEC-half convention, the design-complete marker, and the
  redirect; U4 formalizes the roadmap status column (`idea → defined → planned →
  in-progress → done`) and makes `workflow-status` / `ship-roadmap` read it. In
  the interim the gate keys on the **SPEC product-half marker**, not a roadmap
  status value (see Design → Gate detection).
- **ship-roadmap founding-interview / JIT-design integration** — U4.
- **A separate `DESIGN.md`** — explicitly rejected; one SPEC, two halves.
- **A `--update` flag on `design-feature`** — rejected; upsert is default.
- **Systematic per-feature market research** — rejected; research is
  proportional and domain-gated.
- **Global installed-skill/MCP discovery sweep** — that is U6/product-audit
  ([#16](https://github.com/gtrabanco/agentic-workflow/issues/16)); this unit
  records only tooling relevant to the feature at hand.
- **Phase-economics rules** (split thresholds, criteria-as-commands) — U5
  ([#15](https://github.com/gtrabanco/agentic-workflow/issues/15)).
- **A stub/alias skill for "add-feature"** — rejected for menu/bookkeeping noise;
  "add feature"/"add a feature"/"new feature" ship as **description trigger
  phrases** on `design-feature`, not as separate skills.
- **Fully rerouting `triage-issue` promote and `plan-feature-from-issue` through
  `design-feature`** — deferred (see Open questions). U3 moves only the *raw-idea
  interview* out; the issue path keeps its own product-half authoring, gated by
  closure.

## Architecture impact

Docs/skills-only change — the skills are the product here. Invariants to hold:

- **Authoring contract** (`CLAUDE.md` → "Authoring a skill"): `design-feature`
  sets `user-invocable: true`, opens with `## Turn contract`, has `Step 0`,
  `Guardrails`, a `## Portability` section, uses `P1, P2, …` labels for any phase
  reference, is checklist-driven with fixed output formats, and ends with a
  visible `→ Next:` block. `plan-feature`'s slimmed body keeps all of the same.
- **Stack/architecture agnostic**: no product, stack, framework, ORM, runtime, or
  architecture-pattern references leak into the new skill or the shared docs —
  generic phrasing only ("the project's entities", "the project's ACL model").
- **Hand-off, don't compose across a lower tier**: `design-feature` is a
  planning-class skill (strongest model / high effort intent). `plan-feature`
  must **hand off** to it (print `run /design-feature <slug>`), never compose it
  in-turn from a weaker tier. `plan-feature-from-issue` composing `design-feature`
  for a thin issue is allowed only if it runs at ≥ its tier; otherwise it hands
  off. Record the chosen composition boundary in `architecture-notes.md`.
- **Machine envelope**: `design-feature` emits the standard machine envelope
  (per `orchestration-envelope`) as the absolute last output, mirroring
  `plan-feature` — `state` = `OK` (designed), `NEEDS_INPUT` (interview question
  pending), or `BLOCKED` (unresolvable capability gap). `next.recommended` =
  `/plan-feature <slug>`.
  *(Superseded 2026-07-10 by feature 10: `design-feature` dropped its inline
  `## Machine envelope` section; the contract moved to the orchestration
  layer. See `docs/workflow/MIGRATION.md`.)*
- **One-PR-per-unit, against `main`**; conventional commits.

## Design

### The five-stage pipeline

```
design (design-feature)  →  plan (plan-feature)  →  execute (execute-phase)
       ↓                                                      ↓
   product half of SPEC                          review (review-change)  →  audit (audit-pr / product-audit)
       ↓
   engineering half of SPEC  ← plan-feature completes this
```

`design-feature` and `plan-feature` write **the same `SPEC.md`**, each its own
half. `plan-feature` will not proceed until the product half is marked complete.

### SPEC two-halves layout + design-complete marker

`docs/features/_TEMPLATE/SPEC.md` gains two clearly-labelled groupings and a
marker line the gate reads. Chosen marker (machine-checkable, human-readable):

```markdown
## Design status
`designed` — product half complete (capability closure done). Set by
design-feature. plan-feature refuses to plan a feature not marked `designed`.
```

- **Product half** (written by `design-feature`): Goal · Context · Business
  goals · Scope (in/out) · **Capability closure → Acceptance criteria** · Tooling
  · product Decisions · `## Design status`.
- **Engineering half** (written by `plan-feature` / `plan-feature-scaffold`):
  Architecture impact · Design · Phases · Testing requirements · Dev scenarios ·
  Deploy & rollback · Deliverables.

The marker is a single line the gate greps for; it is intentionally simple so
U4 can later swap it for a roadmap `defined` status without changing the SPEC
body shape.

### Gate detection (interim, until U4)

`plan-feature`'s redirect keys on the **SPEC product-half marker**, not a roadmap
status column (which does not exist until U4):

- No `SPEC.md`, or `## Design status` missing / not `designed`, or the Capability
  closure section empty → **STOP**, print `run /design-feature <slug>`.
- Marker `designed` and closure present → proceed to scaffold the engineering
  half.

Fixed redirect output (dependency-gate style, no bypass flag):

```
→ Next: /design-feature <slug> — this feature has no completed product design yet
  (capability closure not done). Design it first; then re-run /plan-feature <slug>.
```

U4 will migrate this check from the SPEC marker to the roadmap `defined` status
(the marker stays as the SPEC-local record).

### Capability-closure checklist (the core of design-feature)

Written as a **checklist a weak model cannot misread** (per the authoring
contract), with explicit `n/a` handling. Skeleton the skill emits into the SPEC:

```markdown
## Capability closure

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

Every row resolves to a filled surface **or** an explicit `n/a: <reason>` — a
blank row fails the gate. The filled rows become the **Acceptance criteria**.

### Interaction & upsert

- Bare `design-feature <slug>`: read any existing SPEC/decisions → **print a
  summary** of what the feature will do → ask what to add/remove/change (review
  mode). Never destroys recorded decisions; logs revisions to `decisions.md`.
- `design-feature <slug> <instruction>`: apply the instruction directly, no
  questions, touching only what it implies.
- "delete and redesign" in the prompt is the only path that starts the product
  half from zero.

### plan-feature-interview retirement

The raw-idea interview (questions that turn a vague description into scoped
product intent) moves verbatim-in-spirit into `design-feature`'s Process, folded
ahead of capability closure. `skills/plan-feature-interview/` is deleted; the
router's routing table drops the "raw idea → interview" row and replaces it with
"raw idea / undesigned → STOP → `/design-feature`". `MIGRATION.md` records the
removal and the replacement command.

## Decisions to confirm

- **Canonical name `design-feature`; no alias skill** — RESOLVED (issue): trigger
  phrases "add feature"/"add a feature"/"new feature" live in the description.
- **One SPEC, two halves; no `DESIGN.md`** — RESOLVED (issue): a second document
  would guarantee drift.
- **Gate keys on the SPEC product-half marker in U3** (roadmap `defined` status is
  U4) — RESOLVED (this SPEC, from the issue's constraint that "this unit may
  introduce the SPEC-half convention and the redirect, U4 wires the status
  machine"). Rationale: the roadmap status column does not exist yet; the SPEC
  marker is the available ground truth and U4 migrates the check without changing
  the SPEC body.
- **`plan-feature-interview` is removed, not kept as a thin wrapper** — RESOLVED:
  keeping it would leave two doors to product definition. Its logic lives in
  `design-feature`. (Major; MIGRATION note.)
- **`plan-feature-from-issue` stays in plan-feature for U3** (not yet rerouted
  through design-feature) — RESOLVED for scope control: the issue moves only the
  *interview* out. from-issue emits the two-halves SPEC and satisfies closure;
  full unification is deferred (Open questions).
- **No bypass flag on the redirect** — RESOLVED (issue): XS features pass cheaply
  because design-feature scales down, not because the gate opens.

## Acceptance criteria

Each is objectively checkable; textual ones are runnable commands.

1. **New skill exists and parses.** `skills/design-feature/SKILL.md` exists with
   `name: design-feature`, `user-invocable: true`, and `version: 1.0.0`:
   `grep -q "^name: design-feature$" skills/design-feature/SKILL.md` and
   `grep -q "^user-invocable: true$" skills/design-feature/SKILL.md`.
2. **Discoverable.** `npx skills add . --list` lists `design-feature` and still
   lists every other skill (all files parse).
3. **Trigger phrases present.** The description contains "add feature" (and
   variants) so the menu surfaces it:
   `grep -iq "add feature" skills/design-feature/SKILL.md`.
4. **Capability closure is a checklist with explicit n/a.** The skill body
   contains the per-entity / per-capability / per-role closure checklist and an
   explicit `n/a` handling rule:
   `grep -iq "capability closure" skills/design-feature/SKILL.md` and the body
   shows CRUD + state-transition + UI-entry-point + ACL rows (verified by read).
5. **Two-halves SPEC template.** `docs/features/_TEMPLATE/SPEC.md` groups sections
   into a product half and an engineering half and carries a `## Design status`
   marker line:
   `grep -q "## Design status" docs/features/_TEMPLATE/SPEC.md`.
6. **plan-feature redirect exists, no bypass flag.** `skills/plan-feature/SKILL.md`
   STOPS and points at `/design-feature` when a feature is undesigned, and adds no
   bypass flag:
   `grep -q "/design-feature" skills/plan-feature/SKILL.md` and
   `! grep -Eq "\-\-force-plan|--skip-design|--no-design" skills/plan-feature/SKILL.md`.
7. **Interview retired.** `skills/plan-feature-interview/` no longer exists, and no
   skill or workflow doc references it:
   `test ! -e skills/plan-feature-interview` and
   `! grep -rq "plan-feature-interview" skills docs README.md README.es.md`.
8. **Pipeline documented.** `docs/workflow/FEATURE_WORKFLOW.md` names the
   design → plan → execute → review → audit pipeline and the two-halves SPEC:
   `grep -iq "design-feature" docs/workflow/FEATURE_WORKFLOW.md`.
9. **Migration recorded.** `docs/workflow/MIGRATION.md` documents the `plan-feature`
   major slim and the `plan-feature-interview` removal with the replacement
   command: `grep -q "design-feature" docs/workflow/MIGRATION.md`.
10. **Bookkeeping consistent.** `bump-skill` ran: `design-feature` 1.0.0 and the
    `plan-feature` major bump have rows in `CHANGELOG.md` **and** `CHANGELOG.es.md`,
    and the README skills + model tables (EN/ES) list `design-feature` — the same
    consistency `audit-docs` checks.
11. **No stack leakage.** No product/stack/framework/ORM/runtime reference appears
    in the new skill or the edited shared docs (generic phrasing only) — verified
    by read.
12. **PR carries `Closes #13`.**

## Testing requirements

No application build exists — "green" is the repo's doc-verification gate
(`CLAUDE.md` → Verification):

- **Structural:** `npx skills add . --list` lists all skills, including
  `design-feature`, and no longer errors on the removed `plan-feature-interview`.
- **Textual (acceptance criteria as commands):** run the `grep`/`test` checks in
  Acceptance criteria 1, 3, 4, 5, 6, 7, 8, 9.
- **Cross-doc:** `bump-skill` bookkeeping is consistent (skill `version:` ↔
  changelog rows EN/ES ↔ README skills+model tables EN/ES); documentation-map and
  skill-reference links resolve — the same checks `audit-docs` performs. Run
  `/audit-docs` after the edits.
- **Weak-model read-through:** re-read `design-feature` as if executed by the
  fleet's weakest model — every closure row independently checkable, every "if
  needed" replaced by a named minimum set, fixed output formats present.
- **Manual:** dry-run the two interaction modes (bare vs `<instruction>`) and the
  redirect on an undesigned slug, confirming the printed next-command matches the
  fixed format.

No unit/integration test layer applies (no code).

## Dev scenarios

The change is skill/doc text (no runtime), but the skill defines process
situations an executor must reproduce when following it. Listed as prose (no
runnable harness in this repo):

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `design:xs-scaledown` | an XS feature where most closure rows are `n/a` | the uniform gate passing cheaply (single question, explicit n/a rows) |
| `design:upsert` | `design-feature <existing-slug>` re-run | upsert: re-read SPEC/decisions, ask only deltas, append revision to `decisions.md`, destroy nothing |
| `design:instruction-mode` | `design-feature <slug> "<change>"` | direct application, no questions, touch only what the instruction implies |
| `plan:redirect` | `plan-feature <slug>` on an undesigned feature | STOP + fixed `/design-feature <slug>` redirect, no bypass |
| `design:closure-gap` | an entity left with a blank closure row | gate failure → NEEDS_INPUT / BLOCKED, not a silent pass |

## Phases

**P1 — SPEC two-halves convention + template + pipeline docs.** Update
`docs/features/_TEMPLATE/SPEC.md` (product/engineering grouping + `## Design
status` marker). Update `docs/workflow/FEATURE_WORKFLOW.md` and
`docs/workflow/SKILLS.md` to name the design → plan → execute → review → audit
pipeline and the two-halves SPEC. **P1 also commits the planning artifacts** for
this feature. This is the substrate later phases reference.

**P2 — `design-feature` skill (core).** Author
`skills/design-feature/SKILL.md`: frontmatter (name, `user-invocable: true`,
`version: 1.0.0`, description with the "add feature" triggers), `## Turn
contract`, `Step 0`, `Process` (raw-idea interview folded in + proportional
research + capability-closure checklist + per-feature tooling notes + upsert +
interaction rule + scale-down), `Guardrails`, `## Portability`, `Relationship to
other skills`, `Done when`, `→ Next:` block, and the machine envelope
*(superseded 2026-07-10 by feature 10 — see `docs/workflow/MIGRATION.md`)*.
Writes the SPEC product half + stamps the `designed` marker.

**P3 — `plan-feature` slim (MAJOR) + interview retirement + from-issue/scaffold
alignment.** Slim the router (remove interview path; add the redirect gate on the
product-half marker; no bypass flag; major bump). Delete
`skills/plan-feature-interview/` and repoint all references. Adapt
`plan-feature-from-issue` (emit two-halves SPEC, satisfy closure) and
`plan-feature-scaffold` (fill engineering half only). Add the `MIGRATION.md`
notes.

**P4 — Hardening + bookkeeping.** Run `bump-skill` (new skill 1.0.0, plan-feature
major, interview removal, from-issue/scaffold minors) → `CHANGELOG.md` +
`CHANGELOG.es.md` + README skills+model tables (EN/ES). Hardening: run
`npx skills add . --list`; run every acceptance-criteria command; `/audit-docs`
for cross-doc consistency; weak-model read-through of `design-feature`; confirm
no stack leakage, `## Portability` intact, `→ Next:` blocks last, closure gate
rejects a blank row. Open the PR with `Closes #13`, print the URL, update the
roadmap row to `done`.

## Deploy & rollback

n/a — merging the PR is the whole deploy. Rollback = revert the PR; no data,
no migration, no config. One caveat: the removal of `plan-feature-interview` and
the `plan-feature` major slim are surfaced through `MIGRATION.md` so downstream
installs update their invocation habits — this is documentation, not a runtime
migration.

## Open questions / risks

- **Risk: gate double-definition with U4.** The interim SPEC-marker gate must be
  written so U4 can migrate it to the roadmap `defined` status without reshaping
  the SPEC. Mitigation: the marker is one grep-able line; the gate logic reads
  "product half complete?", which U4 re-points from marker → roadmap status.
- **Risk: scope creep into product definition duplication.** With `design-feature`
  owning product definition and `plan-feature-from-issue` still authoring a
  product half, the capability-closure checklist could be duplicated. Mitigation:
  the closure checklist lives **once** in `design-feature`; from-issue references
  it / composes design-feature for thin issues rather than restating it.
- **Risk: composition tier.** `plan-feature-from-issue` composing `design-feature`
  must respect the ≥-tier rule (never run design at a weaker tier). Mitigation:
  from-issue hands off (prints `run /design-feature <slug>`) for thin issues
  rather than composing when it cannot guarantee ≥ tier; recorded in
  `architecture-notes.md`.
- **DEFERRED — full issue-path unification.** Rerouting `triage-issue` promote and
  `plan-feature-from-issue` entirely through `design-feature` (so *every* origin
  passes one product-definition door) is deferred beyond U3. Tracked in
  `known-issues.md`; a candidate follow-up unit (evaluate alongside U4).
- **Inherited:** none.

## Deliverables

- New `skills/design-feature/SKILL.md` (v1.0.0).
- Slimmed `skills/plan-feature/SKILL.md` (major bump, redirect gate).
- Deleted `skills/plan-feature-interview/` + all references repointed.
- Edited `skills/plan-feature-from-issue/SKILL.md` and
  `skills/plan-feature-scaffold/SKILL.md` (two-halves alignment, minor bumps).
- Updated `docs/features/_TEMPLATE/SPEC.md` (two halves + `## Design status`).
- Updated `docs/workflow/FEATURE_WORKFLOW.md`, `docs/workflow/SKILLS.md`,
  `docs/workflow/MIGRATION.md`.
- `CHANGELOG.md` + `CHANGELOG.es.md` rows; README (EN/ES) skills + model tables —
  via `bump-skill`.
- This SPEC and the full planning artifact set (`PLAN.md`, `TASKS.md`,
  `progress.md`, `testing.md`, `known-issues.md`, `decisions.md`,
  `architecture-notes.md`) and the `docs/features/ROADMAP.md` entry (row 06).
- PR against `main` carrying `Closes #13`.

## Post-merge next feature

Per the backlog execution order (U1→U2→U3→**U4**→…), the next unit is **U4 —
roadmap states `idea`/`defined` + `workflow-status` & `ship-roadmap` JIT design**
([#14](https://github.com/gtrabanco/agentic-workflow/issues/14)), an **M feature
that depends on this one being merged** (it wires the status machine onto the
two-halves convention and the design-complete marker introduced here). See
`docs/features/ROADMAP.md`.
