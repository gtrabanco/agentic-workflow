# 12 — golden-fixture-procedure

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

Give this repo a **repeatable smoke test for skill wording**: a documented
procedure (`docs/workflow/GOLDEN_FIXTURE.md`) plus a tiny, self-contained
**fixture** (a pre-written toy feature — "add a CSV export command" — with a
ready SPEC) that an author runs after editing any executor-path skill, driving
the toy feature through the changed skill **with the weakest model in the
operator's fleet** (currently Qwen3.6 35B / Gemma4 26B). Fixed pass criteria
check that the skill's contracted output still holds on a weak model (fixed
output blocks print exactly, branch/commit discipline held, no invented steps);
each run is recorded in a one-line log table. This is U9 of the 2026-07-09
backlog ([#19](https://github.com/gtrabanco/agentic-workflow/issues/19)), and it
closes the enforcement gap feature 08 (`phase-economics`) explicitly deferred to
it (`docs/features/08-phase-economics/known-issues.md`).

## Branch

`feat/12-golden-fixture-procedure`

## Size

`S` — no new skill and no code: one new workflow doc
(`docs/workflow/GOLDEN_FIXTURE.md`) carrying the procedure + the embedded
fixture, a discoverability cross-reference from the existing workflow docs, and
`docs/workflow/README.md`'s index updated to list it. **Single-pass** execution
(`execute-phase 12`, no phase split) — the change is one new Markdown file plus
two small edits (index + one cross-reference), touches one concern (the
repo's own skill-maintenance workflow), and carries no unresolved design
decision. Deliberately **no infrastructure / no CI** in this unit (PRAGMA over
infrastructure — a stated constraint of the issue).

## Dependencies

**No hard dependencies.** The fixture *exercises* skills that already exist
(`plan-feature`, `plan-feature-scaffold`, `execute-phase`, the review pack), so
nothing must merge first. Soft relationship with **`08-phase-economics`**
([#15](https://github.com/gtrabanco/agentic-workflow/issues/15),
[PR #26](https://github.com/gtrabanco/agentic-workflow/pull/26) — **merged**
2026-07-09): 08 *states* the hard split rule, the per-phase cheap-executability
checklist, and one-phase-one-session but ships no harness to test those rules
against a weak model, and names this feature as the enforcement follow-up. The
fix index (`docs/fix/`) is empty; no open fix-now issue touches the workflow
docs — the other open issues are the remaining backlog units (#20, #21), neither
of which this feature depends on.

---

## Product half

Written by `plan-feature-from-issue` from issue
[#19](https://github.com/gtrabanco/agentic-workflow/issues/19). Complete —
`## Design status` below reads `designed`.

### Context

This repo's promise is that its skills **"run correctly on any agent and any
model"** (CLAUDE.md, "Checklists over heuristics"). Today that promise is
untested: skill bodies are reworded freely, and a rewording a frontier model
absorbs without trouble can silently break a weak local model
(Qwen3.6 35B / Gemma4 26B) executing a phase — a dropped turn-contract box, a
fixed output block rendered loosely, an invented step. Nothing in the repo
catches that regression before it ships.

Feature 08 (`phase-economics`) made this explicit: it introduced the hard split
rule, the per-phase cheap-executability checklist, and the one-phase-one-session
convention **precisely so a weak model can execute a phase**, then recorded in
its `known-issues.md` that it "ships no runnable harness that tests skill edits
against the weakest fleet model — that is U9". It also flagged the dependency
direction: if U9's fixture reveals a rule a weak model still misreads, the fix is
a wording tightening of the offending skill. This feature is that harness — kept
deliberately **manual and infrastructure-free** first (a procedure + a fixture +
a log), with CI automation earned only if the manual procedure proves its worth.

### Business goals

n/a — internal workflow-quality feature (no external product surface). The
outcome it serves: skill wording stays executable by the weakest fleet model, so
the repo's cross-model promise is verified on edit rather than assumed. This unit
is cheap insurance that protects every other executor-path skill.

### Scope

#### In scope

- **New workflow doc `docs/workflow/GOLDEN_FIXTURE.md`** containing:
  - **The fixture** — a fixed toy feature, "add a CSV export command", with a
    **pre-written toy SPEC embedded in the doc** (a fenced block the author
    copies to a scratch location), sized so a single skill run exercises the
    contracted output without real project context. Self-contained: no separate
    committed toy-project tree (which the roadmap/`audit-docs` drift checks would
    flag) — the fixture travels **inside** the procedure doc.
  - **The procedure** — the repeatable steps: (1) after editing any executor-path
    skill (`execute-phase`, `plan-feature`/`plan-feature-scaffold`,
    `plan-feature-from-issue`, `design-feature`, the `review-*` pack), (2) run the
    toy feature through the **changed** skill following its `SKILL.md` literally,
    (3) **with the weakest model in the operator's fleet** (name the current
    floor: Qwen3.6 35B / Gemma4 26B), (4) score against the fixed pass criteria.
  - **Fixed pass criteria** (a checklist the run passes only if all hold): the
    skill's fixed output blocks print **exactly** as contracted (Return exactly /
    checklists / `PASS | FAIL` / turn-contract boxes); branch and commit
    discipline held (branched off `main`, conventional commit, no work on `main`);
    **no invented steps** beyond the SKILL.md; the closing `→ Next:` block
    printed.
  - **A run log table** — one row per run recording **date, model, skill +
    version(s) exercised, pass/fail, note** — appended by the author after each
    run, so coverage is auditable over time.
  - **Scope boundary stated in the doc** — manual first, no CI; when (and only
    when) to graduate to automation.
- **Discoverability** — one cross-reference to the procedure from the existing
  skill-authoring guidance so an author editing a skill finds it: a line in
  `docs/workflow/README.md`'s document index, and a pointer from
  `CONTRIBUTING`/authoring guidance if such a hook exists (else the workflow
  README index is the single home).

#### Out of scope / non-goals

- **CI automation / any runnable harness or script** — this unit is the manual
  procedure only; automation is a separate, later unit earned only if the manual
  procedure proves its worth. (Owner: a future automation unit, not scheduled.)
- **A committed toy-project directory** (e.g. a stray `docs/features/NN-…` or a
  top-level `fixtures/` tree) — the fixture lives **inside**
  `GOLDEN_FIXTURE.md`; a committed toy feature folder would be flagged as
  roadmap/doc drift by `audit-docs`. (Owner: none — deliberately avoided.)
- **A `template/` mirror of the procedure** — `GOLDEN_FIXTURE.md` is *this*
  repo's own skill-maintenance workflow (testing skill wording the repo ships);
  it is **not** part of the exportable substrate a target project copies, so it
  does **not** go in `template/`. The "repo ↔ `template/` mirror is a same-PR
  invariant" from feature 08 applies to shared template artifacts (the SPEC
  template), not to this repo-internal maintenance doc. (Owner: n/a — no mirror.)
- **Editing the executor-path skills themselves** — this feature *tests* those
  skills; it does not reword them. Any wording fix a first fixture run reveals is
  a **follow-up** (a fix issue / a targeted skill edit), not part of this unit.
  (Owner: the skill's own `bump-skill` change, tracked separately.)
- **Changing `bump-skill`** — a `bump-skill` prompt to "run the golden fixture
  after a skill edit" would be a nice reinforcement but is a separate change; not
  in this docs-only unit. (Owner: a future `bump-skill` edit.)

### Capability closure

This feature introduces **no product entity, role, or user-facing UI/API
surface** — it is a new Markdown procedure doc (plus its embedded fixture and log
table) in a docs/skill repository. Every closure row is therefore `n/a` with a
reason; the verifiable conditions live in Acceptance criteria below as command
checks against the new doc.

```markdown
For EACH entity this feature introduces or touches:
- [ ] Create — n/a: no product entity; the deliverable is one workflow doc (GOLDEN_FIXTURE.md) with an embedded fixture + a run-log table
- [ ] Read/list — n/a: the "run log" is a Markdown table in the doc, not a persisted entity with a listing surface
- [ ] Update — n/a: authors append a log row by editing the Markdown; no entity/state to update
- [ ] Delete — n/a: no entity to delete
- [ ] State transitions — n/a: no entity lifecycle
For EACH capability (action a user can take):
- [ ] Visible entry point: the doc itself, linked from docs/workflow/README.md's index; an author runs the procedure by hand (no command)
- [ ] Who may execute it (ACL): n/a — any contributor editing a skill; no permission model in a docs repo
For EACH role / permission:
- [ ] Assigned/Revoked/Viewed: n/a — no roles in a docs/skill repository
```

### Acceptance criteria

Command-checkable (run from repo root; each must exit `0` / print the expected
match). Genuinely judgement-only criteria are labelled `read-verified`.

- **Procedure doc exists** — the new workflow doc is present:
  `test -f docs/workflow/GOLDEN_FIXTURE.md`
- **Fixture embedded** — the toy CSV-export feature + its toy SPEC live inside
  the doc:
  `grep -qi "CSV export" docs/workflow/GOLDEN_FIXTURE.md`
- **Weakest-model instruction present** — the procedure names running against
  the weakest fleet model:
  `grep -qiE "weakest.*model|Qwen3\.6|Gemma4" docs/workflow/GOLDEN_FIXTURE.md`
- **Fixed pass criteria present** — the doc carries an explicit pass checklist
  covering fixed output blocks, branch/commit discipline, and no invented steps:
  `grep -qiE "Return exactly|turn.contract|PASS \| FAIL" docs/workflow/GOLDEN_FIXTURE.md`
- **Run-log table present** — a log table with date/model/skill columns exists:
  `grep -qiE "\| *Date *\|" docs/workflow/GOLDEN_FIXTURE.md`
- **Discoverable from the index** — the workflow README lists the new doc:
  `grep -qi "GOLDEN_FIXTURE" docs/workflow/README.md`
- **No committed toy-project tree** (`read-verified` + spot check) — the fixture
  is embedded, not a stray feature/fixtures directory:
  `! ls docs/features/ | grep -qiE "csv|toy|fixture"`
- **No `template/` mirror added** (`read-verified`) — the repo-internal
  procedure was not copied into the exportable scaffold:
  `! test -f template/docs/workflow/GOLDEN_FIXTURE.md`
- **Skills unchanged by this unit** (`read-verified`) — this feature adds the
  test, it does not reword any executor-path skill; the PR touches docs only.

### Tooling

n/a for building this feature — it is a new Markdown doc. The *procedure it
documents* invokes the repo's own skills against a weak local model, but no
external skill/MCP is needed to author the doc.

### Product decisions

- **Manual procedure first, no infrastructure** (decided, from the issue): ship a
  documented procedure + fixture + log, not a script or CI job; automate only if
  the manual smoke test proves its worth. Rationale: PRAGMA over infrastructure —
  the cheapest thing that catches weak-model regressions, added now, beats a
  harness that may never earn its maintenance.
- **The fixture is a fixed toy feature — "add a CSV export command"** (decided,
  from the issue's worked example): a single, stable, low-context feature keeps
  runs comparable across models and dates. Rationale: a moving fixture makes the
  log meaningless; a fixed one makes a regression legible.
- **Test against the weakest model in the fleet, not a frontier model** (decided,
  from the issue): the whole point is catching wording that only weak models
  misread. Rationale: a frontier model passing proves nothing about the
  cross-model promise.

## Design status

`designed` — capability closure complete (every row filled or explicitly `n/a`
with a reason), acceptance criteria emitted as runnable commands. `plan-feature`
may plan the engineering half.

---

## Engineering half

Written by `plan-feature-scaffold`, product half above is `designed`.

### Technical goals

Produce one self-contained workflow doc that a contributor (or a weak model
following it) can execute without judgement: the fixture is embedded, the steps
are numbered, the pass criteria are a checkbox list, and the log table has a
worked example row. No change to any skill and no new directory that the drift
audits would flag.

### Architecture impact

- **Docs-only, single new file.** The change is `docs/workflow/GOLDEN_FIXTURE.md`
  plus a one-line index entry in `docs/workflow/README.md` and, if an authoring
  hook exists, one cross-reference line. No `skills/*` body changes, no
  `template/` changes, no code.
- **Drift-safe by construction.** The fixture is embedded in the doc as a fenced
  block, so no toy `docs/features/NN-…` folder exists for `audit-docs`/the
  roadmap consistency check to flag as an unregistered feature. The negative
  Acceptance-criteria greps encode this invariant.
- **Invariant to hold:** this unit is a **test of** the executor-path skills, so
  it must not edit them; the PR is docs-only. Any wording fix a run surfaces is a
  separate tracked change.

### Design

Structure of `docs/workflow/GOLDEN_FIXTURE.md` (all new content):

1. **Purpose** — one paragraph: why this exists (verify skill wording survives
   the weakest fleet model), linking feature 08's deferral and CLAUDE.md's
   "runs correctly on any agent and any model" promise.
2. **When to run** — trigger: after editing any executor-path skill
   (`execute-phase`, `plan-feature`, `plan-feature-scaffold`,
   `plan-feature-from-issue`, `design-feature`, the `review-*` pack); optional
   but recommended before opening the PR for that edit.
3. **The fixture** — a fenced, copy-pasteable **toy SPEC** for
   `add a CSV export command` (a minimal but complete SPEC product+engineering
   half, S size, single-pass) plus the one-line issue text it stands in for. The
   author copies it to a scratch path (e.g. the scratchpad) — it is **not**
   committed as a feature folder.
4. **The procedure** — numbered steps: pick the changed skill → set the agent to
   the **weakest fleet model** (name the current floor, Qwen3.6 35B / Gemma4 26B,
   and say "whatever is weakest in your fleet today") → run the skill against the
   fixture following its `SKILL.md` literally → observe the output.
5. **Fixed pass criteria** — a checkbox list, pass only if **all** hold:
   ✓ every fixed output block prints exactly as contracted (Return exactly /
   checklists / `PASS | FAIL` / turn-contract boxes); ✓ branch/commit discipline
   held (branched off `main`, conventional commit, never worked on `main`);
   ✓ no step invented beyond the `SKILL.md`; ✓ the closing `→ Next:` block
   printed. Any unchecked box = **FAIL**, and the fix is a wording tightening of
   the skill (a separate change), per feature 08's dependency-direction note.
6. **Run log** — a Markdown table with a worked example row and the column
   contract:

   | Date | Model | Skill(s) + version | Result | Note |
   |------|-------|--------------------|--------|------|
   | 2026-07-10 | Qwen3.6 35B | `execute-phase` 1.x | PASS | example row — replace on first real run |

7. **Scope boundary** — one short section: manual first, no CI; graduate to
   automation only if the manual procedure repeatedly catches regressions and the
   maintenance is justified.

Discoverability edits: add `GOLDEN_FIXTURE.md` to the document list in
`docs/workflow/README.md`; if the workflow README or CLAUDE.md's "Authoring a
skill" area has a natural "after editing a skill" hook, add one pointer line
there (else the README index is the single home — do not force a second link).

### Decisions to confirm

None open — the three product decisions above (manual-first, fixed CSV-export
fixture, weakest-model target) are settled by the issue. Two small engineering
choices are made here, not deferred: **fixture embedded in the doc** (not a
committed folder) and **no `template/` mirror** (repo-internal maintenance doc) —
both encoded as negative Acceptance-criteria checks.

### Testing requirements

Documentation change — no code test layer. Verification is the Acceptance-criteria
command block above run against the new doc and the updated README, plus the
repo's standing "green" checks: `npx skills add . --list` still discovers every
skill (unaffected — no skill touched), Markdown is well-formed, cross-references
resolve, and no stack/real-project reference leaked into the doc. The doc's *own*
"first real run" (executing the fixture on a weak model and replacing the example
log row) MAY be done as part of the PR to prove the procedure works end-to-end,
but is **not required** for the docs unit to be complete — record it as the first
log row if done.

### Dev scenarios

n/a — this feature adds no runtime behaviour with reproducible failure modes; it
is a new procedure document. The "degraded" case it concerns itself with (a weak
model misreading a skill) is what the *procedure* surfaces when an author runs it,
not a runtime path this doc introduces.

### Phases

**Single-pass (size S)** — executed with `execute-phase 12` (no `P1/P2` split).
The one pass: author `docs/workflow/GOLDEN_FIXTURE.md` (purpose, when-to-run,
embedded fixture, procedure, fixed pass criteria, run-log table, scope boundary),
add the index entry in `docs/workflow/README.md` (and one authoring-hook pointer
if a natural home exists), verify the Acceptance-criteria command block passes,
then open the PR carrying `Closes #19`. Opening the PR is the final step of the
pass, not a separate phase. No `bump-skill` run is required — **no `SKILL.md` is
edited** (bump-skill is only for skill changes).

### Deploy & rollback

n/a — merging the PR is the entire deployment; rollback is `git revert` of the
single doc PR. No migration, flag, or config change.

### Open questions / risks

- **Fixture drift** (low): if the toy SPEC embedded in the doc falls behind the
  real SPEC template shape, a run could misjudge a skill. Mitigated by keeping the
  fixture minimal and pointing readers at `docs/features/_TEMPLATE/SPEC.md` as the
  source of truth for shape; the fixture only needs enough to trigger the skill's
  fixed output.
- **Manual procedure decay** (medium, accepted): a manual smoke test only helps if
  authors actually run it. Mitigated by the discoverability cross-reference and by
  the log table making omission visible; escalation to automation is the stated
  future path if decay proves real.
- **Weak-model floor moves** (low): the named models (Qwen3.6 35B / Gemma4 26B)
  will age. Mitigated by phrasing the target as "the weakest model in your fleet
  today" with the current names as examples, not a hardcoded requirement.

### Deliverables

- New `docs/workflow/GOLDEN_FIXTURE.md` (purpose, when-to-run, embedded fixture,
  procedure, fixed pass criteria, run-log table, scope boundary).
- `docs/workflow/README.md` index updated to list the new doc (+ one authoring
  hook pointer if a natural home exists).
- This SPEC (the only planning artifact for an S feature).
- PR against `main` carrying `Closes #19`.

### Post-merge next feature

Per the backlog order, the remaining startable units are **U10 — init-workspace
upgrade mode** ([#20](https://github.com/gtrabanco/agentic-workflow/issues/20))
and, always last, **U11 — final docs batch**
([#21](https://github.com/gtrabanco/agentic-workflow/issues/21)). U7
([#17](https://github.com/gtrabanco/agentic-workflow/issues/17)) remains gated on
the opencode driver adopting the envelope repair loop. See
`docs/features/ROADMAP.md`.
