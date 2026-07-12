# fix/52-workflow-status-envelope-hardening

> Fix specification. The SPEC alone is the source of truth; its `## Phases`
> section is the execution ledger `execute-phase --fix` runs one phase per
> invocation.

## Goal

`workflow-status` emitted a machine envelope that (a) routed to a non-actionable,
wrong-stage `next.recommended`, (b) **fails its own `validateEnvelope()`** against
the bundled JSON Schema, (c) suppressed the `product_audit` recommendation its own
rule required, and (f) had **no structured field for the plain open-issue backlog**
— so a real driver would reject the envelope, a human could not tell which feature
to build, and even a fixed `next.recommended` had nothing concrete to cite for the
"3 pages of open issues" the user felt were ignored. Two independent
reproductions (2026-07-11, two unrelated projects, across `/plan-feature` **and**
`/triage-issue`) confirm the defects are not command-specific. Most are not a wrong
process rule: the rules in `skills/workflow-status/SKILL.md` are already correct.
The failure is that **nothing enforces them at emit time** — the turn contract has
no assertion that `next.recommended` is non-bare and correctly staged, the envelope
section gives no shape reminder for the two fields that violated the schema, and the
product-audit trigger is stated but never mechanically checked (worse: a model
*invented* an unauthorized "wait for a natural pause" exception on top of a
count-only checklist). The one genuinely new gap (F) is a missing **capability**:
the sensor never enumerates open issues that have never been through
`/triage-issue`. This is the same "weak models drop end-of-document duties" /
"checklists over heuristics" hardening this repo already applies elsewhere, so it
is a self-contained skill edit that cannot wait for a feature cycle: undetected,
every driven run on a weak tier can silently emit a garbage envelope that buries the
backlog.

## Issue

`#52` — GitHub issue. The PR must close it via `Closes #52` in the body.

## Branch

`fix/52-workflow-status-envelope-hardening`

## Depends on

None. (Independent of `#51`; see **Cross-issue notes**.)

## Root cause

Five of the six sub-defects (A–E) trace to one class of gap in
[`skills/workflow-status/SKILL.md`](../../../skills/workflow-status/SKILL.md):
a **missing emit-time assertion / shape reminder**, not a wrong rule. The sixth
(F) is a missing **capability** — no computation surfaces the untriaged backlog.
Confirmed against the skill and
`packages/agentic-workflow-schema/envelope.schema.json` on `main` (2026-07-11),
re-verified in the issue triage (2026-07-12) and a second reproduction comment
(2026-07-12, a `/triage-issue` envelope from a second unrelated project):

- **A — `next.recommended` bare / wrong-stage.** Process step 6
  (`skills/workflow-status/SKILL.md:96`) already states the correct routing
  (`idea → /design-feature <slug>`, `defined → /plan-feature <slug>`,
  `planned → /execute-phase <NN> P1`), and step 12 already prints a
  design-candidates line. But the turn contract
  (`skills/workflow-status/SKILL.md:28`) has **no check** that `next.recommended`
  is fully-formed (slug included) and staged by the target unit's real status
  before the turn ends, so a model emitted a bare `/plan-feature` and pointed the
  `scheduled` (undesigned) `design_candidates` rows at `/plan-feature` instead of
  `/design-feature`. Compounded by a non-standard `scheduled` roadmap status that
  Process step 4 (`skills/workflow-status/SKILL.md:84`) does not map into the
  five-state machine, so those rows are bucketed and staged inconsistently.
- **B — envelope fails `validateEnvelope()`.** The `## Machine envelope` section
  (`skills/workflow-status/SKILL.md:178`) documents the payload by example but
  gives **no explicit shape reminder** for the two fields that were emitted
  wrong: `blockers[].scope` must be one of `enum: ["unit","run"]`
  (`envelope.schema.json:110` — a `"code"` value is invalid) and
  `dependencies.unmet` is `{type: array, items: {type: string}}`
  (`envelope.schema.json:120` — an array of objects is invalid). The example also
  never states that doc-drift is unit-scope, so the sensor over-escalated it to
  `run`/`code` while keeping `state: OK` — an internal contradiction (run-scope =
  stop-the-world, incompatible with `OK`, per
  `skills/orchestration-envelope/SKILL.md:80`).
- **C — `product_audit` trigger miss / invented exception.** Process step 10
  (`skills/workflow-status/SKILL.md:114`) states the trigger (≥3 features merged
  since the last audit **OR** the same drift kind in ≥2 units) but nothing
  mechanically checks it before setting `recommendations.product_audit`. The first
  reproduction skipped the check (both triggers fired, field emitted `false`); the
  **second** is worse — the model *invented* an unauthorized exception
  (`reason: "…recommend waiting for natural pause before next audit"`) on top of a
  count-only checklist that defines no such clause. That is exactly the failure
  `CLAUDE.md`'s **"Checklists over heuristics"** principle exists to prevent, and
  it means the step must be worded as a **mechanical boolean** (`merged_count >= 3`,
  no exception defined) a model cannot rationalize past — not merely "make the check
  run".
- **D — `next.tier` mismatch.** Neither the skill nor
  `skills/orchestration-envelope/SKILL.md:93` gives `workflow-status` a
  **derivation rule** tying `next.tier` to the resolved command's declared tier, so
  a planning recommendation (`strong` work) was emitted `cheap` — recurring across
  `/plan-feature` (repro 1) and `/triage-issue` (repro 2), both declared `strong`
  in `docs/workflow/model-routing.yml` and the README model table.
- **E — envelope dropped on follow-up.** The turn contract
  (`skills/workflow-status/SKILL.md:35`) requires the envelope as the absolute
  last output of an invocation but says nothing about a same-session
  natural-language follow-up about state, where the reported reply dropped it.
- **F — no structured field for the untriaged open-issue backlog (NEW, repro 2).**
  Process step 9 (`skills/workflow-status/SKILL.md:111`) scopes `pending_triage`
  narrowly — `known-issues.md` entries with no linked issue, plus open issues
  *labeled/titled* as postponed findings. A project's plain low-priority backlog
  (open issues that never went through `/triage-issue`: no dated verdict comment,
  no disposition) correctly yields `pending_triage: []`, and `findings.untriaged`
  is review-finding routing, not issue backlog. So **no field anywhere enumerates
  the untriaged backlog** — fixing A alone still leaves `next.recommended` with no
  concrete issue numbers to cite. The sensor needs a new computation:
  cross-reference `gh issue list --state open` against triage disposition (the
  fixed-format dated `VERDICT:` comment `triage-issue` posts —
  `skills/triage-issue/SKILL.md:95-104`) and surface the untriaged subset.

## Detected in

User report, 2026-07-11 — a real `workflow-status` envelope from a mature project
(all planned features merged, 30+ open issues, 10 undesigned features) pasted into
chat; every claim re-verified against the schema and skill on `main`. Triaged
fix-now (2026-07-12) with per-claim re-verification recorded on `#52`. A **second
reproduction** (2026-07-12 comment) from a different project — a `/triage-issue`
envelope with `tier: "cheap"`, a bare `/triage-issue`, and an invented product-audit
exception — corroborated A/C/D across command types and surfaced the new backlog-
coverage gap (F).

## Scope

### In scope

Edits to [`skills/workflow-status/SKILL.md`](../../../skills/workflow-status/SKILL.md)
only, plus the mechanical `bump-skill` sync it forces (version, both changelogs,
both README tables). Specifically:

1. **Turn-contract assertions (A, C, D, E)** — add checkable boxes to the
   `## Turn contract` section so an about-to-end turn with any unticked box is not
   done:
   - `next.recommended` is a fully-formed command **with its slug/NN** (never a
     bare `/plan-feature`), and its stage matches the target unit's resolved
     status (`idea`/undesigned → `/design-feature <slug>`; `defined` →
     `/plan-feature <slug>`; `planned` → `/execute-phase <NN> P1`).
   - **every** `design_candidates[].next` begins with `/design-feature ` (design
     candidates route to design regardless of anything else).
   - `recommendations.product_audit` was computed by the step-10 mechanical check,
     not guessed.
   - `next.tier` was derived from the resolved `next.recommended` command's
     declared tier (per the mapping added in P2), not guessed.
   - the envelope is emitted on **every** invocation of this skill, **including a
     same-session natural-language follow-up** about state — never replaced by
     prose.
2. **Unknown-status mapping (A)** — extend Process step 4 with one rule: a roadmap
   status **not** in the five-state machine (`idea/defined/planned/in-progress/
   done`) maps to the nearest five-state value, **defaulting to `idea`** (so it
   routes to `/design-feature`), and the raw status is noted in
   `workflow_observations`. Explicitly names `scheduled → idea` as the worked
   example, cross-referencing `#51`'s status-vocabulary work.
3. **Envelope shape reminders + self-validation (B)** — in `## Machine envelope`,
   add an explicit, bulleted **shape reminder** immediately adjacent to the JSON
   example:
   - `blockers[].scope ∈ {"unit","run"}` — there is no `"code"`; doc/roadmap
     drift is **`"unit"`** (unit-scope), never `"run"`.
   - a `"run"`-scope blocker forces `state` ∈ `{BLOCKED, HALT}` — it is **never**
     compatible with `state: OK` (cites `orchestration-envelope`).
   - `dependencies.unmet` is an **array of strings** (unit ids / `#issue` refs) —
     never objects; move any `requires`/`detail` richness into a `blockers[]`
     entry's `detail` string.
   - add one turn-contract box: the emitted envelope is validated against
     `packages/agentic-workflow-schema/envelope.schema.json` (the bundled schema)
     before it is printed — dogfood the package the drivers use.
4. **Product-audit mechanical boolean (C)** — reword Process step 10 from a
   heuristic into a two-condition checklist (`✓ merged_count >= 3` since the last
   SHIP_REPORT/product-audit artifact **OR** `✓ the same drift kind appears in
   ≥2 units' docs`) with `product_audit: true` + a stated `reason` when **either**
   holds. The wording must make it a **mechanical boolean with no exception clause**
   — state explicitly that `merged_count >= 3` is a count, not a judgment call, and
   that "wait for a natural pause / big-milestone" reasoning is **not defined and
   must not be invented** (the repro-2 failure). Note that a fired trigger may
   surface `/product-audit` as `next.recommended` or an `alternatives` entry
   (backlog/audit over net-new feature work).
5. **`next.tier` derivation rule (D)** — add to `## Machine envelope` a fixed
   command→tier map: `plan-feature`, `design-feature`, `review-change`, `audit-pr`,
   `triage-issue`, `product-audit` → `strong`; `execute-phase` → `cheap`;
   `next.tier` is read off this map from the resolved `next.recommended`, never
   guessed.
6. **Untriaged open-issue backlog surfacing (F)** — add a new Process step
   (after step 9's `pending_triage`) that cross-references the open-issue list
   already fetched in step 2 (`gh issue list --state open`) against triage
   disposition, marking an issue **untriaged** when it carries **no dated
   `triage-issue` verdict comment** (the fixed-format `VERDICT: …` block —
   `skills/triage-issue/SKILL.md:95-104`) and no `wontfix`/`postponed`/`promoted`
   disposition label. Surface the result in a new free-form envelope field
   `detail.untriaged_issues: {count, oldest_open: [numbers]}` (`detail` is
   schema-unconstrained — `envelope.schema.json:154` — so **no package change**),
   cap the listed numbers (default: oldest 5) to bound output, and let a non-zero
   count influence `next.recommended`/`alternatives` (surface `/triage-issue <the
   listed numbers>` as a concrete, non-bare option). Keep this **distinct** from
   `pending_triage` (findings-derived) and `findings.untriaged` (review-finding
   routing).

### Out of scope

- **The `plan-feature` loop / no-progress guard / already-planned short-circuit**
  — that is `#51`; do not touch `plan-feature`/`plan-feature-scaffold` here.
- **Re-scoping or removing `pending_triage` / `findings.untriaged`.** F **adds** a
  new field beside them; their existing narrow semantics are unchanged.
- **The deeper `scheduled`-status vocabulary reconciliation** across the roadmap
  legend and authoring skills — `#51` owns status-vocabulary; this fix only adds
  the defensive *unknown → idea* mapping so `workflow-status` routes safely today.
- **Any schema/package change.** `packages/agentic-workflow-schema/` is already
  correct; the bug is that the skill emitted output the (correct) schema rejects.
  No `envelope.schema.json`, `src/index.ts`, or package-version change.
- **Per-finding severity/tier in the envelope** — that is `#49` (enhancement).

## Rules that must never be violated

- **Read-only, always.** The skill still edits nothing at runtime; these are
  documentation edits to the skill body only (`skills/workflow-status/SKILL.md:277`).
- **No new schema fields or states.** The envelope keys and `state` enum are
  unchanged; the schema package is not touched (a schema change that skips the
  package is incomplete — so we make **no** schema change). `orchestration-envelope`
  stays the single source of truth for the shared schema.
- **Stack/architecture agnostic.** No product/stack/framework reference enters the
  skill or shared docs (CLAUDE.md "Working rules").
- **Docs language is English**; `SKILL.md` is English-only (not a bilingual
  human-doc), so no `.es.md` sibling is created for it.
- **Version every change.** Editing a `SKILL.md` requires `bump-skill`
  (version + `CHANGELOG.md` + `CHANGELOG.es.md` + `README.md` + `README.es.md`).

## Impact

- **Layers touched:** documentation only — the `workflow-status` skill body. No
  code, no schema, no template.
- **Modules and files:**
  [`skills/workflow-status/SKILL.md`](../../../skills/workflow-status/SKILL.md)
  (edited); `CHANGELOG.md`, `CHANGELOG.es.md`, `README.md`, `README.es.md`
  (mechanically synced by `bump-skill`).
- **Blast radius:** dev-only / driver-facing. A wrong edit degrades the guidance a
  future `workflow-status` run follows; it cannot corrupt data or affect a running
  system (the skill never writes). Correct edits make every driven run's envelope
  schema-valid, its recommendation actionable, and the backlog visible. F adds one
  free-form `detail.untriaged_issues` sub-object — `detail` is schema-unconstrained
  (`envelope.schema.json:154`), so **still no schema/package change**.
- **New runtime cost (F only):** determining "untriaged" may require reading each
  open issue's comments for the triage `VERDICT:` marker — the one place this
  otherwise-cheap sensor may issue per-issue forge reads. Bounded by capping the
  listed numbers and computing lazily; called out in **Decisions** and left for the
  implementer to optimise, not a correctness risk.
- **Detection lead time:** immediate for B (a driver's `validateEnvelope()` rejects
  a bad envelope on the next poll); silent-until-noticed for A/C/D/F (a human or
  driver acts on a wrong-but-valid recommendation, or never sees the backlog) —
  which is exactly why the assertions move enforcement to emit time.

## Operational risks

None at runtime — the skill is read-only and drives no scheduled job, queue,
cache, schema, or external adapter. The only process interaction is that a driver
consuming the envelope now gets a schema-valid payload, removing spurious trips
through `orchestration-envelope`'s repair loop.

## Security risks

None. No auth, secrets, PII, webhook, or rate-limit surface is touched. The
injection-safe `detail.urgent` invariant (labels-only, presence-only) is untouched
by this fix.

## Compliance touchpoints

n/a — no domain/compliance rules apply to a skill-authoring doc in this repo.

## Affected docs

- [`skills/workflow-status/SKILL.md`](../../../skills/workflow-status/SKILL.md) —
  the fix itself (acceptance criterion below).
- `CHANGELOG.md`, `CHANGELOG.es.md`, `README.md`, `README.es.md` — updated by
  `bump-skill` (skill table row + model table unchanged in content, version cell
  bumped; changelog rows added).
- No other doc in the CLAUDE.md documentation map references the emit-time
  behavior being hardened, so no further doc update is required (the five-state
  routing rule the fix enforces is already documented in `ROADMAP.md` and
  unchanged).

## Acceptance

Each is an objective, independently checkable condition.

- [ ] `skills/workflow-status/SKILL.md` `## Turn contract` contains a box
      asserting `next.recommended` is non-bare (carries slug/NN) **and** staged by
      the target unit's resolved status. *(grep: "non-bare" / "slug")*
- [ ] The turn contract asserts every `design_candidates[].next` begins with
      `/design-feature `.
- [ ] The turn contract asserts `recommendations.product_audit` came from the
      step-10 mechanical check and `next.tier` from the command→tier map.
- [ ] The turn contract asserts the envelope is emitted on every invocation
      **including a same-session natural-language follow-up** about state.
- [ ] The turn contract asserts the envelope validates against
      `packages/agentic-workflow-schema/envelope.schema.json` before printing.
- [ ] Process step 4 contains the *unknown roadmap status → nearest five-state,
      default `idea`* rule, naming `scheduled → idea`, with a
      `workflow_observations` note and an `#51` cross-reference.
- [ ] `## Machine envelope` contains a shape-reminder block stating
      `blockers[].scope ∈ {unit,run}` (no `code`; doc-drift = `unit`), that a
      `run`-scope blocker is incompatible with `state: OK`, and that
      `dependencies.unmet` is an array of strings (not objects).
- [ ] `## Machine envelope` contains the command→tier map and the rule that
      `next.tier` derives from the resolved `next.recommended`.
- [ ] Process step 10 is a two-condition checklist that sets
      `product_audit: true` + a `reason` when either condition holds, and may
      surface `/product-audit` in `next`. Its wording states `merged_count >= 3`
      is a **mechanical boolean** and that no "wait for a natural pause"/milestone
      exception exists or may be invented. *(grep: "merged_count" / "no exception")*
- [ ] A new Process step (after step 9) surfaces the untriaged open-issue backlog:
      an open issue with **no dated `triage-issue` `VERDICT:` comment** and no
      `wontfix`/`postponed`/`promoted` label is counted, and the result is emitted
      as `detail.untriaged_issues: {count, oldest_open: [...]}` (kept distinct from
      `pending_triage` and `findings.untriaged`). *(grep: "untriaged_issues")*
- [ ] When `detail.untriaged_issues.count > 0`, the skill may cite
      `/triage-issue <numbers>` (non-bare) in `next.recommended`/`alternatives`.
- [ ] `skills/workflow-status/SKILL.md` `version:` is bumped and
      `CHANGELOG.md` + `CHANGELOG.es.md` + both READMEs are updated by
      `bump-skill` (verification-gate item).
- [ ] The verification gate is green: `npx skills add . --list` still lists every
      skill; no stack/real-project reference leaked into the skill; markdown
      well-formed and the new cross-references resolve.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here.

### P1 — Envelope schema-conformance hardening (defect B)

Edit only the `## Machine envelope` section of
`skills/workflow-status/SKILL.md`. No other section, no other file.

- [x] Add a **shape-reminder** block adjacent to the JSON example stating:
      `blockers[].scope` ∈ `{"unit","run"}` — there is **no** `"code"`; doc/roadmap
      drift is `"unit"`. *(evidence: the new bullets; cross-check
      `packages/agentic-workflow-schema/envelope.schema.json:110`)*
- [x] In the same block, state that a `"run"`-scope blocker forces `state` ∈
      `{BLOCKED, HALT}` and is never compatible with `state: OK` (cite
      `orchestration-envelope`). *(evidence: the new bullet)*
- [x] In the same block, state that `dependencies.unmet` is an **array of
      strings** (unit ids / `#issue` refs), never objects; richer detail goes in a
      `blockers[].detail` string. *(evidence: the new bullet; cross-check
      `envelope.schema.json:120`)*
- [x] Add the command→tier map (`plan-feature`/`design-feature`/`review-change`/
      `audit-pr`/`triage-issue`/`product-audit` → `strong`; `execute-phase` →
      `cheap`) and the rule that `next.tier` derives from the resolved
      `next.recommended` (defect D lives here, adjacent to the envelope shape).
      *(evidence: the new map)*
- [x] Gate: markdown still well-formed, no stack reference introduced, and the
      example JSON in the section stays schema-valid.

### P2 — Recommendation-policy enforcement (defects A, C, D, E)

Edit the `## Turn contract` and `## Process` sections of
`skills/workflow-status/SKILL.md`. (No `bump-skill` yet — it runs once in P3, the
last implementation phase.)

- [x] Add the turn-contract box: `next.recommended` non-bare (carries slug/NN)
      **and** staged by the target unit's resolved status
      (`idea`→`/design-feature`, `defined`→`/plan-feature`,
      `planned`→`/execute-phase <NN> P1`). *(evidence: the new box)*
- [x] Add the turn-contract box: every `design_candidates[].next` begins with
      `/design-feature `. *(evidence: the new box)*
- [x] Add the turn-contract box: `recommendations.product_audit` came from the
      step-10 mechanical check and `next.tier` from the P1 command→tier map.
      *(evidence: the new box)*
- [x] Add the turn-contract box: the envelope is emitted on **every** invocation
      including a same-session natural-language follow-up about state — never
      replaced by prose (defect E). *(evidence: the new box)*
- [x] Add the turn-contract box: the emitted envelope validates against
      `packages/agentic-workflow-schema/envelope.schema.json` before printing.
      *(evidence: the new box)*
- [x] Extend Process step 4 with the *unknown roadmap status → nearest five-state,
      default `idea`* rule, naming `scheduled → idea`, adding the raw status to
      `workflow_observations`, cross-referencing `#51`. *(evidence: the edited
      step)*
- [x] Rewrite Process step 10 as a mechanical two-condition checklist
      (`✓ merged_count >= 3` since last audit OR `✓ same drift kind in ≥2 units`)
      → `product_audit: true` + `reason`; state `merged_count >= 3` is a count, not
      a judgment, and that **no** "wait for a natural pause" exception exists or may
      be invented; note it may surface `/product-audit` in `next`. *(evidence: the
      edited step)*
- [x] Gate: `npx skills add . --list` lists every skill; markdown well-formed;
      no stack reference introduced.

### P3 — Untriaged-backlog surfacing (defect F) + version sync

Edit the `## Process` and `## Machine envelope` sections of
`skills/workflow-status/SKILL.md`, then run `bump-skill` (last implementation
phase — one version sync over the complete P1–P3 edits).

- [x] Add a new Process step (after step 9's `pending_triage`) that cross-references
      the step-2 open-issue list against triage disposition: an open issue is
      **untriaged** iff it has no dated `triage-issue` `VERDICT:` comment
      (`skills/triage-issue/SKILL.md:95-104`) and no
      `wontfix`/`postponed`/`promoted` label. *(evidence: the new step)*
- [x] Document the `detail.untriaged_issues: {count, oldest_open: [numbers]}` field
      in `## Machine envelope` (cap listed numbers at oldest 5; `detail` is
      schema-free — no package change), distinct from `pending_triage` and
      `findings.untriaged`. *(evidence: the new field + example)*
- [x] State that a non-zero `untriaged_issues.count` may drive
      `next.recommended`/`alternatives` to a non-bare `/triage-issue <numbers>`
      (ties the backlog into the recommendation A hardened). *(evidence: the new
      wording)*
- [x] Run `bump-skill` for `workflow-status`: version bumped, `CHANGELOG.md` +
      `CHANGELOG.es.md` rows added, `README.md` + `README.es.md` tables synced.
      *(evidence: `git diff --stat` shows all five files)*
- [x] Gate: `npx skills add . --list` lists every skill; markdown well-formed;
      no stack reference introduced; the section's example JSON stays schema-valid.

### P4 — Hardening & PR

- [x] Re-run the project's full verification gate (commands + exit codes pasted)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip
- [x] `git push`
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #52`
- [x] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [x] Commit `docs: link PR #52` and push

## Testing

No application build exists; "green" is the repo's documentation gate
(CLAUDE.md → **Verification**):

- `npx skills add . --list` discovers every skill (the edited `SKILL.md`
  frontmatter still parses).
- Markdown well-formed; the new cross-references (`envelope.schema.json`,
  `orchestration-envelope`, `#51`) resolve.
- No stack/real-project reference leaked into the skill.
- **Manual verification (why: no runtime to drive a doc change):** re-read the
  hardened skill against **both** reported envelopes' inputs (the `/plan-feature`
  and the `/triage-issue` repro) and confirm each of A–F now has a turn-contract
  box, shape reminder, or Process step that would have caught it — in particular
  that the emitted envelope, run through the shape reminders, would pass
  `validateEnvelope()`, and that the untriaged backlog would appear as concrete
  numbers. There is no unit/integration layer for a skill-authoring doc; the
  golden-fixture smoke-test does not apply (`workflow-status` is not in its
  executor-path list).

## Rollback

`git revert <merge-commit>` (or close the PR unmerged). No data-side cleanup: the
change is documentation only and the skill writes nothing. Nothing is lost on
revert beyond the added assertions; the prior `SKILL.md` behavior is restored
exactly. The `bump-skill` version/changelog rows revert with the same commit.

## Observability

n/a for a read-only skill — there is no prod log line or metric. The proxy signal
that the fix is live and healthy: a driver consuming `workflow-status` stops
tripping `orchestration-envelope`'s repair loop on this skill's output (the
envelope now validates first time), and its `next.recommended` is directly
executable (carries a slug/NN).

## Cross-issue notes

- **`#51`** (`workflow-status loops on /plan-feature`) — **parallel, not a
  dependency.** It hardens `plan-feature`'s already-planned short-circuit and a
  sensor-side no-progress guard; this fix hardens the envelope's emit-time
  correctness. They touch different skills (`plan-feature`/`scaffold` vs.
  `workflow-status`'s envelope/turn-contract) and overlap only in the non-standard
  `scheduled` status: this fix adds the minimal defensive *unknown → idea* mapping;
  `#51`/status-vocabulary owns the fuller reconciliation. Either can merge first.
- **`#49`** (surface per-finding severity/tier in the envelope) — **parallel,
  additive.** An enhancement that adds new envelope detail; unrelated to the
  emit-time correctness hardened here. F's `detail.untriaged_issues` is a different
  field (issue backlog, not per-finding severity) — no conflict, both live under
  the free-form `detail`.
- **Second reproduction (2026-07-12 issue comment)** — corroborating evidence from
  a second, unrelated project, not a separate issue: it confirmed A/C/D recur across
  command types and contributed the new gap F, both folded into this SPEC. No new
  issue to file.
- No open PRs. No issue blocks or is blocked by this fix.

## Effort

**M** — still a single `SKILL.md`, but now three localized implementation passes
(envelope shape + tier map; turn-contract + Process steps 4/10; new untriaged-
backlog Process step + `detail` field) plus the mechanical `bump-skill` sync; no
code, no schema, no tests to author. The new capability F (a Process step with a
per-issue disposition check) is what tips it past S into multi-commit territory;
comfortably ≤ 1 day.

## Decisions made during drafting

- **Unknown-status default is `idea` (→ `/design-feature`), not `defined`.** The
  conservative choice: an unrecognized status most likely predates or bypasses the
  design stage, and mis-routing to `/design-feature` (re-confirm design) is safer
  than mis-routing an undesigned unit to `/plan-feature`. Re-question if the
  `scheduled` semantics in `#51` prove otherwise.
- **`next.tier` map is inlined in `workflow-status`, not centralized in
  `orchestration-envelope`.** Smallest change that closes D; a shared table is a
  larger refactor and out of scope. `orchestration-envelope:93` already states the
  strong/cheap principle — this fix makes it mechanical for the one skill that
  emits the envelope itself.
- **`bump-skill` runs in P3 (last implementation phase), not P4.** It must run
  once, after all `SKILL.md` edits (P1–P3) are final; P3 is the last phase that
  edits the skill, so the version/changelog/README sync lands with the
  implementation and P4's gate re-runs over a complete tree. The literal
  `Hardening & PR` tasks are kept verbatim.
- **Self-validation is documented as an instruction, not implemented as code.**
  The skill tells the emitter to check its envelope against the bundled schema;
  adding an executable validator to the skill runtime is out of scope (no code
  change, no package touch).
- **F is a new field `detail.untriaged_issues`, not an extension of
  `pending_triage`.** `pending_triage` has a deliberately narrow, findings-derived
  meaning (step 9) and `findings.untriaged` is review-finding routing; overloading
  either would blur two distinct signals a driver routes on separately. A new
  free-form `detail` sub-object is the smallest addition and needs no schema change.
- **"Untriaged" = no dated `triage-issue` `VERDICT:` comment.** That fixed-format
  comment (`skills/triage-issue/SKILL.md:95-104`) is the disposition marker
  `triage-issue` reliably writes; disposition labels are a secondary signal (triage
  does not always apply them). The trade-off is per-issue comment reads on an
  otherwise-cheap sensor — accepted because the issue explicitly requests the
  capability; the implementer may bound/lazy-compute it (see **Impact**).
- **Incremental update over a re-plan.** The second reproduction corroborated the
  existing A–E hardening (generic assertions already cover the new command types)
  and added exactly one new concern (F) plus a wording sharpening (C); the SPEC's
  structure held, so this revised the existing SPEC in place (new defect F, extra
  phase P3, sharpened C) rather than drafting a fresh one.

## Status

`done`
