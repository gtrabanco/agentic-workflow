# 14 — final-docs-batch

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Size `S` → this SPEC is the **only planning artifact** (single-pass
> execution, no `PLAN.md`/`TASKS.md`).
>
> **One SPEC, two halves.** The Product half was written from issue
> [#21](https://github.com/gtrabanco/agentic-workflow/issues/21) via
> `plan-feature-from-issue` (capability closure satisfied, `## Design status:
> designed`); the Engineering half by `plan-feature-scaffold`.

## Goal

The **final documentation sweep** of the 2026-07-09 backlog (U11 of 11 —
deliberately the LAST unit, run once after every other unit merged instead of
churning the same tables per-unit). Bring the repo's shared documentation back
in sync with what features 01–13 actually shipped: skill counts and skill
tables (README EN/ES, `docs/workflow/SKILLS.md`), the model tables +
equivalence picks + `docs/workflow/model-routing.yml`, the pipeline diagrams
(add the design stage and the five-state statuses where still missing), and a
consolidated upgrade narrative in `docs/workflow/MIGRATION.md`. Closes the
pre-existing `SKILLS.md` staleness recorded as known-issue #4 of feature 01.

## Branch

`feat/14-final-docs-batch`

## Size

`S` — docs-only, single-pass. Five bounded sweep targets, zero open design
decisions, one concern (documentation coherence), verification is
command-checkable greps plus reads. No split triggers fire.

## Dependencies

All other backlog units, per the issue's hard constraint ("do NOT start until
all other backlog units are merged"): features **04–13** (U1–U10), PRs
[#22](https://github.com/gtrabanco/agentic-workflow/pull/22)–[#31](https://github.com/gtrabanco/agentic-workflow/pull/31)
— **all merged** (verified 2026-07-10 via `gh pr list`). Features 01–03 (soft,
their docs are also swept) merged earlier (#8–#10). **No unmet dependency.**

---

## Product half

Written by `plan-feature-from-issue` from issue #21.

### Context

Features 01–13 each changed the skill set (new skills: `generate-docs`,
`design-feature`, the review pack growth; renames and contract changes:
`plan-feature` 2.0.0 slimming, envelope removal ×14) but — by design — did
**not** each re-sweep the shared tables and diagrams; U11 exists precisely to
do that once. The drift is now measurable (verified on `main` @ `63167ad`,
2026-07-10):

- **Reality:** 28 skill directories; **16** with `user-invocable: true`
  (user-facing) + **12** internal.
- `docs/workflow/SKILLS.md` intro says "**12 user-facing + 4 internal**" and
  lists **neither `workflow-status` nor any of the 9 review-pack skills**
  (pre-existing drift recorded in
  `docs/features/01-generate-docs/known-issues.md` #4).
- `README.md` says "28 skills (**14 user-facing + 14 internal**)" (repo-layout
  block) **and** "**15 user-facing + 13 internal**" (skills intro) — wrong twice
  and self-contradictory. `README.es.md` says "**15 + 13**" in both places.
- The `README.md` mermaid pipeline still reads
  `Interview → Roadmap → Plan → Execute → Review → PR → Audit → Merge` — no
  design stage, though `docs/workflow/{FEATURE_WORKFLOW,SKILLS}.md` already
  gained it (feature 06/07). `README.es.md` mirrors the stale diagram.
- The model/equivalence tables and `docs/workflow/model-routing.yml` already
  carry `design-feature` and the user's fleet (GLM-5.2 · DeepSeek V4 Flash ·
  Mimo V2.5 · Qwen3.6 35B · Gemma4 26B) — for these the sweep **verifies and
  refreshes** (dates, per-skill rows vs. the 28-skill reality, re-check
  warning) rather than introduces.
- `docs/workflow/MIGRATION.md` is a stack of dated notes plus a legacy "v2
  skill set" section; the majors of this backlog (`plan-feature` slimming,
  envelope removal) exist as separate notes with no single upgrade narrative.

### Business goals

Trustworthy self-description. The README tables and `SKILLS.md` are the
product's storefront and the skills' discovery surface — stale counts and a
pipeline diagram missing the design stage misrepresent the workflow to new
adopters and to `init-workspace`'s own recommendation path. Internal/docs
feature — no external business surface.

### Scope

#### In scope

Five sweep targets (the issue's items 1–5):

1. **Model tables** — `README.md` + `README.es.md`: skill/model tables and the
   model-equivalence section verified against the current 28-skill set (rows
   for `design-feature` and any skill added since the last sweep; reflect
   `execute-phase`/`review-change` contract changes); equivalence picks
   refreshed against the user's current fleet, dated **as of July 2026** with
   the existing re-check warning retained. `docs/workflow/model-routing.yml`
   (source of truth for the `#claude` branch) verified/refreshed to cover
   every user-facing skill.
2. **Pipeline diagrams** — `README.md` + `README.es.md` mermaid flows gain the
   **design stage** (`design-feature` before plan) and reflect the
   `idea → defined → planned → in-progress → done` statuses;
   `docs/workflow/{FEATURE_WORKFLOW,SKILLS}.md` flows verified (already
   carry the design stage — fix only if a residual is found).
3. **`docs/workflow/SKILLS.md` staleness** — intro counts corrected to the
   computed reality (16 user-facing + 12 internal as of this writing —
   **recount at execution time**, never hardcode from this SPEC); add the
   missing entries: `workflow-status` and the 9-skill internal review pack
   (`review-code`, `review-security`, `review-verify`, `review-debt`,
   `review-design`, `review-a11y`, `review-brand`, `review-perf`,
   `review-seo`, plus `review-implementation` if absent). Mark known-issue #4
   of feature 01 resolved in that feature's `known-issues.md`.
4. **`MIGRATION.md` consolidation** — one coherent upgrade narrative at the
   top covering this backlog's majors (`plan-feature` 2.0.0 slimming +
   `design-feature`; envelope removal ×14) with the ordered upgrade path,
   keeping the dated notes as the detailed record (consolidate, don't delete
   history).
5. **Skill counts everywhere** — every "N skills (X user-facing + Y internal)"
   phrasing in `README.md`, `README.es.md`, `docs/workflow/SKILLS.md` (and any
   other doc a grep sweep finds) equals the computed reality, EN/ES consistent.

Plus: PR carries `Closes #21`; roadmap row 14 maintained through the status
machine.

#### Out of scope / non-goals

- **Skill behavior changes** — no `SKILL.md` body is edited for meaning; if a
  sweep reveals a wording bug inside a skill, it becomes an issue, not part of
  this unit. Therefore **no version bumps / `bump-skill` run** (docs outside
  `skills/` only) — unless a skill table row inside a README is itself the fix,
  which touches no `SKILL.md`.
- **`template/` changes** — the swept docs (READMEs, workflow docs) are
  repo-level; the exported scaffold is untouched.
- **`#claude` branch edits** — `model-routing.yml` lives on `main` and is
  consumed by the `#claude` branch; syncing that branch's per-skill frontmatter
  is its own maintenance task, not this unit.
- **New diagrams or docs** — sweep and correct existing surfaces only.
- **CI enforcement of counts** — stays manual per the repo's "no application
  build" model (a future unit could script it; not proposed here).

### Capability closure

No runtime entities (this repo ships skills + docs). The swept unit is a
**shared documentation surface** (a table, diagram, count, or narrative that
must match the shipped skill set). Closure filled against that, honest `n/a`
for inapplicable rows:

```markdown
Entity: shared documentation surface (count / table / diagram / migration narrative)
- [x] Create — n/a: no new docs; this unit corrects existing surfaces only
- [x] Read/list (detect drift) — UI entry: the sweep itself (computed counts vs.
      stated counts; table rows vs. skills/ reality; diagram vs. pipeline) ·
      API: n/a (docs) · test: the acceptance-criteria grep/count commands below
- [x] Update (correct a drifted surface) — UI: the edited docs themselves ·
      API: n/a · test: acceptance-criteria commands pass after the edit;
      EN/ES parity read-verified
- [x] Delete — n/a: nothing removed except factually wrong numbers/rows being
      replaced; MIGRATION history is consolidated, never deleted
- [x] State transitions — n/a: a doc surface is current or drifted; no lifecycle

Capability: run the final docs sweep once, after U1–U10 merged
- [x] Visible entry point: `execute-phase 14` (single-pass) on this SPEC
- [x] Who may execute it (ACL): n/a — local developer tool, whoever runs the agent

Role / permission: n/a — no roles introduced (docs)
```

### Acceptance criteria

Command-checkable where possible (run from repo root; `[✓]` = must pass).
`N_UF`/`N_INT` below mean the values **computed at execution time**:
`N_UF=$(grep -rl "user-invocable: true" skills/*/SKILL.md | wc -l)`,
`N_TOT=$(ls -d skills/*/ | wc -l)`, `N_INT=$((N_TOT - N_UF))`.

- Counts correct and consistent:
  `grep -RnoE "[0-9]+ (user-facing|de cara al usuario)" README.md README.es.md docs/workflow/SKILLS.md`
  returns **only** the computed `N_UF`, and every paired internal count equals
  `N_INT` — no occurrence of the stale `12|14|15` user-facing figures remains.
- `grep -q "workflow-status" docs/workflow/SKILLS.md` — the sensor is listed.
- `grep -q "review-code" docs/workflow/SKILLS.md && grep -q "review-perf" docs/workflow/SKILLS.md`
  — the internal review pack is listed.
- README pipeline diagrams show the design stage:
  `sed -n '/```mermaid/,/```/p' README.md | grep -qiE "design"` and the same
  for `README.es.md`.
- Every user-facing skill has a routing row:
  for each of the `N_UF` skills, `grep -q "<name>:" docs/workflow/model-routing.yml`.
- Model tables refreshed: README EN/ES model tables carry `design-feature`
  (already true — must remain) and the equivalence section keeps a dated
  "as of" + re-check warning — `read-verified`.
- MIGRATION consolidation: `docs/workflow/MIGRATION.md` opens with a single
  upgrade narrative naming both majors (`plan-feature` slimming, envelope
  removal) and the ordered upgrade path; dated notes retained below —
  `read-verified`.
- `grep -qi "resolved" docs/features/01-generate-docs/known-issues.md` (issue
  #4 entry marked resolved with a pointer to this feature) — `read-verified`.
- EN/ES parity: every swept block reads equivalently in `README.md` and
  `README.es.md` — `read-verified`.
- `npx skills add . --list` still discovers all 28 skills (docs sweep broke no
  frontmatter).
- PR body contains `Closes #21`.

### Tooling

- **No `bump-skill` run** — no `SKILL.md` is edited (see out-of-scope). If
  execution finds it must touch one, STOP: that is scope creep — file an issue.
- No MCP servers apply. Not on the golden-fixture executor-path list — no
  `GOLDEN_FIXTURE.md` gate.
- `audit-docs` after the sweep is the natural coherence check (recommended in
  the close-out).

### Product decisions

- **Compute counts at execution time, never copy from this SPEC** (chosen) —
  the whole unit exists because hardcoded counts rot; the SPEC's own figures
  are dated context, the commands are the contract.
- **Consolidate MIGRATION, don't rewrite it** (chosen) — the dated notes are
  the auditable record; the new narrative is a layer on top.
- **Verify-and-refresh over rewrite for the model tables** (chosen) — features
  06–13 already maintained their rows via `bump-skill`; the sweep's value is
  catching what per-unit bookkeeping missed, not re-authoring healthy tables.

## Design status

`designed` — capability closure complete (filled rows + explicit `n/a` with
reasons); acceptance criteria emitted as commands where checkable. Written
from issue #21 by `plan-feature-from-issue`.

---

## Engineering half

Written by `plan-feature-scaffold`.

### Technical goals

- One sweep commit-series on one branch: measure (compute the real counts,
  diff each surface) → correct → verify with the acceptance commands.
- Keep every correction **factual and minimal** — numbers, missing rows,
  missing diagram node, narrative section; no restyling, no restructuring of
  documents beyond the MIGRATION narrative layer.
- Bilingual discipline: every EN edit lands with its ES mirror in the same
  commit.

### Architecture impact

None — docs only. Touches `README.md`, `README.es.md`,
`docs/workflow/SKILLS.md`, `docs/workflow/MIGRATION.md`,
`docs/workflow/model-routing.yml` (verify/refresh),
`docs/features/01-generate-docs/known-issues.md` (resolve #4), roadmap row 14.
Invariant: stack-agnostic phrasing; no `skills/*/SKILL.md`, no `template/`.

### Design

Single-pass execution order (not phases — one session):

1. **Measure.** Compute `N_UF`/`N_INT`/`N_TOT` from `skills/`; list every
   user-facing skill name; grep all count phrasings; extract both READMEs'
   mermaid blocks; list `model-routing.yml` keys vs. the skill list.
2. **SKILLS.md.** Fix intro counts; add `workflow-status` (user-facing table)
   and the review-pack entries (internal section) in the document's existing
   row format.
3. **READMEs EN/ES.** Fix both count phrasings per file; add the design stage
   to both mermaid diagrams (`Interview/Idea → Design → Plan → …` matching
   FEATURE_WORKFLOW's `design → plan → execute → review → audit`); verify
   skill/model tables cover all `N_UF` skills; refresh the equivalence
   section's date + fleet note if drifted.
4. **model-routing.yml.** Add any missing user-facing skill key; keep existing
   tiers untouched (tier *changes* are out of scope — only coverage).
5. **MIGRATION.md.** Write the consolidated narrative at the top (upgrade path
   from a pre-backlog install: update skills → the two majors and what they
   break → `init-workspace` upgrade → optional `product-audit`), linking the
   dated notes.
6. **known-issues.md** of feature 01: mark #4 resolved → this feature.
7. **Verify.** Run every acceptance command; `npx skills add . --list`; then
   hand off to `review-change` (mandatory end-of-unit, context-clean).

### Decisions to confirm

None open — all three product decisions recorded above; no engineering
alternatives worth a decision log (docs sweep).

### Testing requirements

No application build — verification is the acceptance-criteria command list
run locally, `read-verified` for the prose criteria (EN/ES parity, MIGRATION
narrative, table refresh), and `audit-docs` as the coherence gate after the
change.

### Dev scenarios

n/a — no runtime. The "scenarios" are the acceptance commands themselves
(each drift class has one: counts, missing entries, diagram stage, routing
coverage, narrative).

### Phases

None — `S`, single-pass (`execute-phase 14`, one session, one PR). The
verification step (7 above) is the hardening.

### Deploy & rollback

n/a — merging is enough. Rollback = revert the PR (docs-only).

### Open questions / risks

- **Count churn between planning and execution** — mitigated by the "compute
  at execution time" contract; the SPEC never hardcodes the answer, only the
  commands.
- **ES drift** — the ES README historically lags; the same-commit EN/ES rule
  plus the parity read is the guard.

### Deliverables

- `README.md`, `README.es.md` — counts, diagrams, model/equivalence tables.
- `docs/workflow/SKILLS.md` — counts + missing entries.
- `docs/workflow/MIGRATION.md` — consolidated upgrade narrative.
- `docs/workflow/model-routing.yml` — full user-facing coverage (verify).
- `docs/features/01-generate-docs/known-issues.md` — #4 resolved.
- `docs/features/14-final-docs-batch/SPEC.md` — this planning artifact.
- Roadmap row 14 → `done · [#PR]` on PR open; PR carries `Closes #21`.

### Post-merge next feature

None — U11 is the last unit of the 2026-07-09 backlog. The natural follow-up
is a `product-audit` sweep (fresh roadmap proposals), not a queued feature.
