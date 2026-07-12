# fix/51-plan-feature-replan-loop

## Goal

`plan-feature` re-scaffolds a feature that is already `planned` instead of
advancing it, and neither `plan-feature` nor `workflow-status` verifies that
the `defined → planned` status write actually landed. On a weak executor the
write is a classic dropped end-of-document step, so the roadmap row stays
`defined`; `workflow-status` then correctly-per-its-rules keeps recommending
`/plan-feature <slug>`, and `plan-feature` re-plans it — an infinite "plan this
again" loop with no sensor that notices no progress was made. This fix closes
the three gaps that turn a single dropped write into an unbounded loop; it
cannot wait for a feature cycle because it silently defeats the whole
plan → execute pipeline for anyone running the skills on a non-frontier model.

## Issue

`#51` — GitHub issue. The PR must close it via `Closes #51` in the body.

## Branch

`fix/51-plan-feature-replan-loop`

## Depends on

None. (Feature 07 / U4's five-state roadmap machine and #52's `workflow-status`
envelope hardening — including the `--last-envelope` hint mechanism this fix
hooks into — are already merged into `main`.)

## Root cause

Three independent gaps in the post-U4 five-state pipeline, all verified against
current `main` (2026-07-12):

1. **No already-planned short-circuit (gap 1).** `skills/plan-feature/SKILL.md`
   redirect gate step 1 (lines 60–61): "Roadmap row status `defined` or higher
   → proceed to Routing below." There is no branch that stops on
   `planned` / `in-progress` / `done` and hands off to `/execute-phase`. A
   `planned` row falls straight through to Routing → `plan-feature-scaffold`
   (`skills/plan-feature/SKILL.md:88-89, 108-110`), which re-runs scaffolding on
   an already-scaffolded feature.

2. **The `defined → planned` write is never verified (gap 2).**
   `skills/plan-feature-scaffold/SKILL.md` step 5 (lines 121–127) owns the
   `defined → planned` write and lists status `planned` under "Done when"
   (line 164), but neither that file nor `plan-feature`'s turn contract
   (`skills/plan-feature/SKILL.md:32-40`) has a checklist item that **re-reads
   the roadmap row and confirms it literally reads `planned`** before the turn
   ends. A dropped write is silently invisible. `workflow-status` likewise has
   no "this unit did not advance despite the recommended command running last
   turn" smell anywhere in its Process (`skills/workflow-status/SKILL.md:71-170`)
   — it re-recommends `/plan-feature` forever with no seatbelt.

3. **`--next` targets `planned` rows (gap 3).** `plan-feature`'s frontmatter
   description (`skills/plan-feature/SKILL.md:15-16`), routing step 4 (line 90),
   and the example table (line 101) all say `--next` takes "the next `planned`
   roadmap entry" — but a `planned` row is already fully scaffolded. This is
   leftover pre-five-state logic: `--next` for planning should target the next
   **`defined`** entry (the units that still need engineering planning).

Together: a dropped write (gap 2) leaves a row at `defined`; `workflow-status`
correctly re-recommends `/plan-feature`; and even when the row *is* correctly
`planned`, gaps 1 and 3 re-scaffold it instead of advancing.

## Detected in

User report, 2026-07-11 — `plan-feature` run twice on a feature in another
project; `workflow-status` looped on `/plan-feature`, never advancing to
`/execute-phase`. Triaged fix-now on 2026-07-12 (issue comment), each gap
re-verified against this repo's own current-`main` skills.

## Scope

### In scope

- `skills/plan-feature/SKILL.md`:
  - Redirect gate: an **already-planned short-circuit** — `planned` (SPEC +
    artifacts present) → STOP, hand off to `/execute-phase <NN> P1`;
    `in-progress` → STOP, hand off to resume the current phase; `done` → STOP,
    report already-shipped. Only `defined` proceeds to Routing.
  - Turn contract + Done-when: assert that, when routing scaffolded a feature,
    the roadmap row was re-read and **literally reads `planned`** before the
    turn ends.
  - `--next`: target the next **`defined`** entry (frontmatter description,
    routing step 4, example table, and any Done-when reference).
- `skills/plan-feature-scaffold/SKILL.md` step 5 + "Done when": re-read the
  roadmap row after the write and confirm it literally reads `planned`;
  re-apply the edit if not — never end with the write unverified.
- `skills/workflow-status/SKILL.md`: a **no-progress guard** — when a hint
  envelope is supplied (`--last-envelope`) whose `next.recommended` targeted
  `/plan-feature <slug>` (or `/design-feature <slug>`) for a unit this run
  still classifies at the same pre-advance status (`defined` / `idea`
  respectively), emit a `workflow_observations` note flagging the suspected
  dropped write. Still read-only; still surfaces the recommendation, but no
  longer blandly, silently repeats it.
- Version bumps + changelog/README sync for the three edited skills
  (via `bump-skill`).

### Out of scope

- `workflow-status`'s untriaged-issue VERDICT-comment trust gap → its own issue
  [#54](https://github.com/gtrabanco/agentic-workflow/issues/54).
- `workflow-status` per-finding severity/tier for fold-cycle routing → its own
  issue [#49](https://github.com/gtrabanco/agentic-workflow/issues/49).
- Any broader "status vocabulary" reconciliation beyond the five states — the
  unknown-status → `idea` mapping already shipped in #52.
- Auto-repairing a dropped status write (`workflow-status` stays read-only; it
  flags, it never fixes — that would be an `audit-docs` concern).

## Acceptance

Objective, verifiable conditions:

- [ ] `skills/plan-feature/SKILL.md` redirect gate has an explicit branch that,
      for a `planned` row with SPEC + artifacts present, **STOPS** and prints
      `→ /execute-phase <NN> P1` without invoking `plan-feature-scaffold`; and
      distinct STOP branches for `in-progress` (resume) and `done`
      (already-shipped). Only `defined` proceeds to Routing.
      (grep: the gate lists `planned`, `in-progress`, `done` STOP branches.)
- [ ] No occurrence of `--next` "next `planned`" survives in
      `skills/plan-feature/SKILL.md` — frontmatter description, routing step 4,
      and the example table all read `defined`.
      (grep: `grep -n "next .planned" skills/plan-feature/SKILL.md` → no
      `--next` hit; `grep -n "next .defined" ...` → the `--next` references.)
- [ ] `skills/plan-feature/SKILL.md` turn contract and "Done when" carry a box
      asserting the roadmap row was re-read and literally reads `planned` when a
      scaffold ran this turn.
- [ ] `skills/plan-feature-scaffold/SKILL.md` step 5 and "Done when" require a
      post-write re-read confirming the row reads `planned`, with re-apply on
      mismatch.
- [ ] `skills/workflow-status/SKILL.md` Process (and the envelope's
      `workflow_observations` documentation) describe the no-progress guard:
      hint `next.recommended` = `/plan-feature <slug>` (or `/design-feature`) +
      same unit still at the same pre-advance status → a `workflow_observations`
      note. Read-only preserved (no new write path).
- [ ] Updated `docs/fix/README.md` — this fix's row present, status tracked.
- [ ] The three edited skills have bumped `version:` fields and matching rows in
      `CHANGELOG.md`, `CHANGELOG.es.md`, and the skills/model tables in
      `README.md` / `README.es.md` (via `bump-skill`).
- [ ] Verification gate green: `npx skills add . --list` discovers every skill;
      markdown well-formed; cross-references resolve; no stack/real-project
      references leaked.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here.

### P1 — Planning-router advance correctness + write verification

Files: `skills/plan-feature/SKILL.md`, `skills/plan-feature-scaffold/SKILL.md`
(one concern: the planning pipeline advances correctly and self-verifies its
own status write). Gaps 1, 3, and the planning-side half of gap 2.

- [x] `plan-feature` redirect gate: replace step 1's "`defined` or higher →
      proceed" with status-specific branches — `defined` → Routing; `planned`
      (SPEC + artifacts present) → **STOP**, print `→ /execute-phase <NN> P1`,
      never invoke `plan-feature-scaffold`; `in-progress` → **STOP**, hand off
      to resume the current phase (`/execute-phase <NN> <next-phase>`); `done`
      → **STOP**, report already-shipped. (grep: gate names all three STOP
      states.)
- [x] `plan-feature` Routing example table + "Done when": add the
      already-planned closing block variant matching the new short-circuit.
- [x] `plan-feature` `--next`: change "next `planned` entry" → "next `defined`
      entry" in the frontmatter description (lines ~15–16), routing step 4
      (line ~90), and the example table (line ~101). (grep: no `--next`/
      `planned` pairing remains.)
- [x] `plan-feature` turn contract + "Done when": add a checkbox asserting that,
      when a scaffold ran this turn, the roadmap row was re-read and literally
      reads `planned` before the turn ends (a dropped `defined→planned` write
      fails the turn).
- [x] `plan-feature-scaffold` step 5 + "Done when": after the `defined →
      planned` write, re-read the roadmap row and confirm it literally reads
      `planned`; re-apply the edit on mismatch; never end with the write
      unverified.

### P2 — `workflow-status` no-progress guard

File: `skills/workflow-status/SKILL.md` (one concern: the sensor-side seatbelt
that surfaces a stalled planning loop). Sensor-side half of gap 2.

- [x] Add the no-progress guard to the Process (natural home: the
      `--last-envelope` / crash-recovery hint handling, lines ~192–195): when
      the hint envelope's `next.recommended` was `/plan-feature <slug>` (or
      `/design-feature <slug>`) and this run still classifies that same unit at
      the same pre-advance status (`defined` / `idea` respectively), emit a
      `workflow_observations` note naming the suspected dropped status write —
      instead of blandly, silently re-recommending the same command. The
      recommendation itself still fires; the guard only *adds* the observation.
- [x] Document the note in the `## Machine envelope` section (a
      `workflow_observations` example line) and add a turn-contract / "Done
      when" mention so a weak model can't drop it. Confirm no new write path is
      introduced — read-only invariant preserved. (grep: `workflow_observations`
      references the no-progress condition.)

### P3 — Hardening & PR

- [x] Run `bump-skill` for the three edited skills (`plan-feature`,
      `plan-feature-scaffold`, `workflow-status`) — bumps `version:` and updates
      `CHANGELOG.md`, `CHANGELOG.es.md`, `README.md`, `README.es.md`
      (3.0.0→3.1.0, 1.8.0→1.9.0, 1.4.0→1.5.0, all minor)
- [x] Re-run the project's full verification gate (commands + exit codes
      pasted): `npx skills add . --list` lists every skill; markdown well-formed;
      cross-references resolve; no stack/real-project references leaked
      (`npx skills add . --list` → exit 0, all 3 edited skills present)
- [x] Smoke-test the executor-path wording change per
      `docs/workflow/GOLDEN_FIXTURE.md` (P1 edits `plan-feature` /
      `plan-feature-scaffold`) with the weakest model in the fleet — **not run
      live** (no weaker fleet model available in this session); substituted a
      manual read-through against the fixed pass criteria (logged as a `NOT
      RUN` row in `GOLDEN_FIXTURE.md`'s run log, not fabricated as a pass) — a
      real weak-model run is still owed.
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip
- [x] `git push`
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and PRINT
      THE PR URL in the chat; the body includes `Closes #51`
      (https://github.com/gtrabanco/agentic-workflow/pull/55)
- [x] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [x] Commit `docs: link PR #51` and push

## Testing

This repo has no application build; "green" is the documented verification gate
plus a manual read-through:

- **Architecture/contract (grep-checkable):** each acceptance grep above is the
  test — the STOP branches exist, no `--next`/`planned` pairing survives, the
  turn-contract/Done-when assertions are present, `workflow_observations`
  references the guard.
- **Discovery:** `npx skills add . --list` still lists all skills after the
  edits (malformed frontmatter would drop one).
- **Golden-fixture smoke test:** `docs/workflow/GOLDEN_FIXTURE.md` drives the
  changed executor-path skills (`plan-feature`, `plan-feature-scaffold`) through
  a toy fixture with the weakest model — catches wording a frontier model
  absorbs but a weak model misreads (this fix exists precisely because of a weak
  model dropping a step).
- No unit/integration layer applies (skills are Markdown instructions, not code).

## Rollback

`git revert <merge-commit>` (or close the PR unmerged). No data-side cleanup —
the change is Markdown-only skill instructions; reverting restores the prior
gate/`--next`/guard wording. No schema, migration, or persisted state touched.

## Impact

- **Layers touched:** the skills layer only (`skills/plan-feature`,
  `skills/plan-feature-scaffold`, `skills/workflow-status`) plus the repo's
  own doc/version-sync artifacts (`CHANGELOG*`, `README*`, `docs/fix/README.md`).
  No application code, no schema package.
- **Modules/files:** `skills/plan-feature/SKILL.md`,
  `skills/plan-feature-scaffold/SKILL.md`, `skills/workflow-status/SKILL.md`,
  `CHANGELOG.md`, `CHANGELOG.es.md`, `README.md`, `README.es.md`,
  `docs/fix/README.md`, `docs/fix/51-plan-feature-replan-loop/SPEC.md`.
- **Blast radius:** dev-workflow behavior only — corrects an infinite re-plan
  loop and adds a stalled-loop sensor note. No user-facing product surface, no
  runtime, no data. Silent-regression risk is low: the changes are additive
  guards and a target-status correction, not a behavioral removal.
- **Detection lead time:** immediate to the operator — the loop symptom is
  visible on the next `plan-feature` / `workflow-status` invocation; the new
  short-circuit and observation note both surface in the same turn they apply.

## Rules that must never be violated

- **`workflow-status` stays strictly read-only** (`SKILL.md` Guardrails,
  lines 361–376): the no-progress guard emits an *observation*, never a write,
  commit, comment, label, or roadmap edit.
- **`plan-feature` / `plan-feature-scaffold` stay docs-only** — no code, no
  branch (that is `execute-phase`).
- **The redirect gate's no-bypass invariant holds** — an undesigned (`idea`)
  feature is still never planned; the new short-circuit only *adds* stops for
  states *above* `defined`, it never opens a bypass for states below it.
- **Five-state machine is the single ground truth** (`docs/features/ROADMAP.md`
  Status legend) — the fix reads and routes on `idea/defined/planned/
  in-progress/done`, introducing no new status value.
- **Stack/architecture-agnostic** — no product/stack/framework reference leaks
  into the edited skills or shared docs.
- **Version-every-change** — every edited `SKILL.md` gets a `version:` bump and
  changelog/README rows in the same PR (`bump-skill`).
- **Phases labelled `P1, P2, …`** — never `S1`/"Step N".

## Operational risks

- **No scheduled-job / queue / cache / schema / external-adapter interaction** —
  the change is instruction text consumed by an agent at invocation time; there
  is no persisted state, migration, or background process.
- **Concurrency:** the only concurrency hazard is editorial — issues #54 and #49
  also edit `workflow-status/SKILL.md`. If worked in parallel they will
  conflict textually; sequence them (this fix is independent of both — see
  Cross-issue notes).

## Security risks

n/a — no auth, secrets, PII, webhooks, or rate-limits are touched. The
`detail.urgent` injection-safety invariant in `workflow-status` (labels-only,
never issue text) is not modified; the no-progress guard reads only the caller's
own hint envelope and this-run computed status, not untrusted issue content.

## Compliance touchpoints

n/a — no data retention, regional, or consumer-protection surface. Documentation
language stays English per the repo's docs-language rule.

## Affected docs

- `CHANGELOG.md` + `CHANGELOG.es.md` — a row per edited skill (via `bump-skill`).
  → acceptance: "Updated `CHANGELOG.md` / `CHANGELOG.es.md` with a row per
  edited skill".
- `README.md` + `README.es.md` — skills and model tables reflect the new
  versions (via `bump-skill`). → acceptance: "Updated `README.md` /
  `README.es.md` skills/model tables".
- `docs/fix/README.md` — this fix's Active row. → acceptance: "Registered the
  fix row in `docs/fix/README.md`".
- No `docs/workflow/*` tutorial prose needs changing — the five-state flow it
  documents is unchanged; the fix aligns the skills *to* that documented flow.

## Observability

There is no production runtime here; "live and healthy" = the operator sees the
corrected behavior:

- The **already-planned short-circuit** is confirmed live when
  `plan-feature <planned-slug>` prints `→ /execute-phase <NN> P1` and does **not**
  emit a `SCAFFOLD …` completion report.
- The **no-progress guard** is confirmed live when a `workflow-status
  --last-envelope <hint>` whose hint recommended `/plan-feature <slug>`, run
  against a still-`defined` `<slug>`, prints a `workflow_observations` note
  naming the suspected dropped write. Its absence (bland re-recommendation, no
  note) is the silent-degradation signal.

## Cross-issue notes

- **#54** (`workflow-status` untriaged-issue VERDICT-comment trust) — **parallel,
  unrelated logic; file-overlap only.** Both edit `workflow-status/SKILL.md`;
  sequence to avoid a textual conflict, but no dependency either way.
- **#49** (`workflow-status` per-finding severity/tier) — **parallel, unrelated;
  file-overlap only.** Same sequencing note as #54.
- **#52** (`workflow-status` envelope hardening) — **prerequisite, already
  merged** ([#53](https://github.com/gtrabanco/agentic-workflow/pull/53)); it
  shipped the `--last-envelope` hint plumbing and the unknown-status → `idea`
  mapping this fix builds on and explicitly does **not** re-open.
- No open PRs; no blocking work.

## Effort

**S** — three `SKILL.md` edits (two of them one-concern in P1, one in P2) plus
the mechanical `bump-skill` sync; no code, no schema, no migration. Multi-file
but small and additive; comfortably under a day. Not XS only because it spans
three skills and requires the golden-fixture smoke test on an executor-path
change.

## Decisions made during drafting

- **Split across two implementation phases (P1 planning skills, P2 sensor), not
  gap-by-gap.** Gap 2 spans both sides; grouping by *file/concern* (the planning
  pipeline vs. the read-only sensor) keeps each phase one concern and
  independently checkable. A gap-by-gap split would put the two halves of gap 2
  in different phases and touch `plan-feature/SKILL.md` from two phases.
- **The no-progress guard flags, it does not repair.** `workflow-status` is
  read-only by hard rule; auto-fixing a dropped write belongs to `audit-docs`.
  The guard's job is to make the stall *visible*, converting a silent infinite
  loop into a surfaced observation — the operator (or a driver) then re-runs
  planning or repairs the row.
- **The guard keys off the existing `--last-envelope` hint**, not a new
  persistence mechanism — reusing the crash-recovery plumbing #52 already
  shipped, per the repo's "never invent a new mechanism" rule.
- **`--next` retargets to `defined`, and the short-circuit is a second seatbelt.**
  Even if `--next` (or a direct invocation) lands on a `planned` row, the new
  short-circuit stops it — the two fixes are independently sufficient against
  the re-scaffold, deliberately overlapping.
- **Version bumps deferred to the P3 `bump-skill` run**, not hand-edited per
  phase — `bump-skill` is the mechanical enforcer and keeps CHANGELOG/README in
  sync in one place. (Exact major/minor/patch is `bump-skill`'s call; these are
  backward-compatible behavior corrections — expected minor.)

## Status

`done`
