# fix/81-legacy-spec-phase-lint-carveout

## Goal

Restore the backward-compatibility contract that fix #64 (PR #75) promised
but silently broke: `execute-phase`'s new **Phase-lint pre-flight guard**
(`skills/execute-phase/SKILL.md:161`) must NOT run against a legacy SPEC that
has no `## Phases` section. As worded, the guard lints the "target phase" of
every SPEC unconditionally; a legacy SPEC has no declared `Layer:`/`Done-when:`
line and no discrete phase, so boxes 2 (One declared layer) and 8
(Machine-checkable done-when) fail every time, STOPping the executor with
`PHASE-LINT GATE … BLOCKED` on a path fix #64's own SPEC and CHANGELOG describe
as "existing plans/SPECs still execute" unchanged. This cannot wait for a
feature cycle because the contradiction already ships in the merged skill and
is reachable today (13 legacy SPECs without `## Phases` currently live in this
repo).

## Issue

`#81` — GitHub issue. The PR must close it via `Closes #81` in the body.

## Branch

`fix/81-legacy-spec-phase-lint-carveout`

## Depends on

None. Independent.

## Root cause

Fix #64 (PR #75, commit `8ada55b`) introduced the "Phase-lint pre-flight
guard" section at `skills/execute-phase/SKILL.md:161-187`. That section
instructs the executor to run the canonical 8-box phase-lint against the
**target phase** before any edit, and STOP on any failed box. It was written
for the phased single-pass flow (SPECs carrying a `## Phases` ledger) but was
placed as an unconditional "always, before any edit" gate. It never inherited
the legacy-SPEC exemption that the *Workflows* section already states a few
dozen lines below at `skills/execute-phase/SKILL.md:323-325`:

> A SPEC **without** `## Phases` (drafted before those versions) runs the
> **legacy flow** below unchanged, end-to-end in one pass.

A legacy SPEC has no `### P<k>` phases, no `Layer:` enum line, and no
per-phase `Done-when:` command — so the guard's box 2 ("One declared layer")
and box 8 ("Machine-checkable done-when") fail unconditionally, and the guard
STOPs before any edit, requiring `--force` to run a SPEC the shipped fix
explicitly promised would keep executing untouched.

## Detected in

`/review-change` on `fix/64-phase-atomicity-lint` (PR #75), finding **A**,
then confirmed fix-now by `/triage-issue` on 2026-07-17 (issue #81 triage
comment). The triage re-ran
`for f in docs/features/*/SPEC.md docs/fix/*/SPEC.md; do grep -q '^## Phases' "$f" || echo "$f"; done`
on the current tree and found live legacy SPECs — verified again while drafting
this SPEC: **13** SPECs currently have no `## Phases` section.

## Scope

### In scope

- Add one explicit carve-out to the "Phase-lint pre-flight guard" section
  (`skills/execute-phase/SKILL.md:161`): when the target SPEC has **no
  `## Phases` section**, skip the guard entirely — no lint run, no STOP — and
  fall through to the legacy single-pass flow. This mirrors the exemption
  already stated at `skills/execute-phase/SKILL.md:323-325`.
- Version + doc sync mandated by CLAUDE.md "Version every change": bump
  `execute-phase`'s `version:` and run `bump-skill` to update `CHANGELOG.md`,
  `CHANGELOG.es.md`, `README.md`, and `README.es.md`.

### Out of scope

- **Issue #82** (wrapped `Phase-lint` headings render as stray paragraphs in
  both SPEC templates) — a Markdown-rendering defect in the *template copy* of
  the lint, unrelated to the executor's guard logic; already triaged
  `postponed`. Belongs to its own fix folder if/when its trigger fires.
- Any change to the 8-box lint *content*, to the emitter skills
  (`plan-fix`, `plan-feature-scaffold`), or to the template copies of the lint
  — the guard's behavior for phased SPECs is correct and stays untouched.
- Auto-detecting/upgrading legacy SPECs to the phased format — this fix only
  makes the guard skip them, it does not migrate them.

## Acceptance

- [ ] The "Phase-lint pre-flight guard" section
      (`skills/execute-phase/SKILL.md:161`) contains an explicit legacy-SPEC
      carve-out stating that a SPEC with no `## Phases` section skips the guard
      entirely (no lint, no STOP) and runs the legacy single-pass flow.
- [ ] The carve-out is stated as an unconditional skip **before** the "run the
      8-box lint" instruction, so a weak model cannot read the lint step first
      and STOP.
- [ ] The carve-out references the pre-existing legacy exemption at
      `skills/execute-phase/SKILL.md` *Workflows* (the "A SPEC without
      `## Phases` … runs the legacy flow … end-to-end in one pass" sentence),
      so the two statements are cross-linked and cannot drift apart.
- [ ] No change to the guard's behavior for a SPEC that **does** carry
      `## Phases` — the 8-box lint still runs and still STOPs on a failed box.
- [ ] `execute-phase`'s `version:` is bumped (patch — wording/behavior
      clarification that widens an over-broad gate) and `CHANGELOG.md`,
      `CHANGELOG.es.md`, `README.md`, `README.es.md` are updated by
      `bump-skill` in the same PR.
- [ ] Updated `CHANGELOG.md` + `CHANGELOG.es.md` each carry a row for this
      `execute-phase` change (bilingual sync — CLAUDE.md hard rule).

## Impact

- **Layers touched:** docs only (skill body + repo changelog/readme/version
  metadata). No application code — this repo ships no application.
- **Modules and files:**
  - `skills/execute-phase/SKILL.md` (the guard section, ~line 161) — the fix.
  - `CHANGELOG.md`, `CHANGELOG.es.md`, `README.md`, `README.es.md` — the
    mechanical version/doc sync (`bump-skill`).
- **Blast radius:** dev-/operator-visible only. The current bug is a
  wrongly-raised STOP (a valid legacy SPEC is blocked); the fix removes the
  false block. No data corruption, no silent regression — the failure mode it
  removes is loud and `--force`-recoverable.
- **Detection lead time:** immediate — the wrongly-blocked path prints a
  `PHASE-LINT GATE … BLOCKED` STOP to the operator; the fix is verified by
  reading the skill body and (optionally) driving the golden fixture.

## Rules that must never be violated

- **Backward compatibility of the legacy single-pass flow** — a SPEC without
  `## Phases` must execute end-to-end unchanged (the contract fix #64 promised
  and this fix restores). This is the whole point of the change; do not narrow
  it.
- **Guard correctness for phased SPECs is preserved** — the 8-box lint must
  still run and still STOP on a failed box for any SPEC that carries a
  `## Phases` ledger. The carve-out keys strictly on the *absence* of the
  `## Phases` section, nothing else.
- **Docs language is English** for `SKILL.md`, SPEC, commit, PR (docs-language
  rule); the human-readable `CHANGELOG`/`README` pair carries EN + ES siblings
  updated in the same change (bilingual sync hard rule).
- **Stack/architecture agnostic** — no product/stack/framework reference
  enters the skill body.
- **Version every change** — editing a `SKILL.md` requires a `version:` bump
  and changelog/readme sync in the same PR (`bump-skill`).

## Operational risks

None. No scheduled job, queue, cache, schema, or external adapter is
involved — this is a documentation/skill-body edit. The only "runtime" is a
model reading the skill; the risk is a wording slip that a weak model
misreads, mitigated by the acceptance criterion that the carve-out is stated
as an unconditional skip *before* the lint step.

## Security risks

None. No auth, secrets, PII, webhook, or rate-limit surface is touched.

## Compliance touchpoints

n/a — no domain/regional/consumer-protection rules apply to a skill-body doc
edit.

## Affected docs

- `skills/execute-phase/SKILL.md` — the guard section (the fix itself).
- `CHANGELOG.md` + `CHANGELOG.es.md` — a row for the `execute-phase` change
  (via `bump-skill`).
- `README.md` + `README.es.md` — the skills/version tables refreshed to the
  bumped `execute-phase` version (via `bump-skill`).
- `docs/fix/README.md` — this fix's index row (added `pending` at draft, flipped
  to `done` at close-out).

## Observability

There is no production telemetry for a skill body. "The fix is live" is
confirmed by: (1) `grep` showing the carve-out sentence in the guard section;
(2) reading the guard so the skip precedes the lint step; (3) optionally
driving a legacy fixture SPEC (no `## Phases`) through
`execute-phase --fix` and observing it runs the legacy flow instead of
STOPping. If the fix degrades (wording drifts so the skip is stated *after* the
lint, or keys on the wrong marker), the symptom returns as the same loud
`PHASE-LINT GATE … BLOCKED` STOP on a legacy SPEC — observable immediately by
the operator.

## Cross-issue notes

- **#82** (postponed) — wrapped `Phase-lint` heading renders as stray
  paragraphs in the SPEC *templates*. Same fix #64 lineage, different artifact
  (template copy vs. executor guard) and different failure (Markdown render vs.
  false STOP). **Unrelated** — not absorbed here; stays its own postponed item.
- **#80, #78, #79** — unrelated (`plan-fix` multi-issue semantics, `audit-pr`
  capability closure, `workflow-status` signals). No overlap.
- No open PRs. Nothing blocks or is blocked by this fix.

## Effort

**XS** — a single-sentence carve-out added to one skill section, plus the
mechanical `bump-skill` version/doc sync. One logical change, ≤ 1h.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation**
and ticks tasks here.

### Phase-lint (authoritative copy — keep in sync with
`docs/features/_TEMPLATE/SPEC.md` `### Phases`)

Every implementation phase below must pass all 8 boxes before it is executed
(`execute-phase` pre-flight). Fail-closed: any unticked box blocks execution
until the phase is re-cut or split.

- [ ] Title names ONE deliverable — FAIL if it joins nouns with `+`, `,`,
      `&`, `and`/`y`, or `/`.
- [ ] One declared layer — each phase declares exactly one of the fixed enum
      `schema/db | domain | api | ui | config/infra | docs | hardening |
      close-out`; FAIL if any task's target file belongs to another. Tests
      for the phase's own layer belong to the phase; a test-only phase
      declares `hardening`.
- [ ] ≤ 8 tasks (close-out phase: ≤ 10, only the literal close-out chain).
- [ ] One checkbox = one deliverable — FAIL if a task contains a `→` chain
      of implementation steps, enumerates > 3 cases/scenarios, or creates
      > 1 file of distinct concerns.
- [ ] Zero decision words — FAIL on `Decide`, `choose`, `OR` between
      alternatives, `If … then <change scope>`.
- [ ] No conditional scope mutation — a task may not move work between
      phases at runtime.
- [ ] No external/manual gates inside implementation phases —
      human/out-of-repo verifications live in the hardening/close-out phase,
      marked `manual`.
- [ ] Machine-checkable done-when — every phase ends with one verifiable
      invariant (a command + expected outcome).

### P1 — Legacy-SPEC carve-out + skill version/doc sync

Layer: `docs`. Done-when:
`grep -n 'no `## Phases`' skills/execute-phase/SKILL.md` returns a line inside
the guard section (before the "run the 8-box lint" step) **and**
`grep -m1 '^version:' skills/execute-phase/SKILL.md` shows a version greater
than `2.4.0`.

- [x] In `skills/execute-phase/SKILL.md`'s "Phase-lint pre-flight guard"
      section (~line 161), add an unconditional first step: a SPEC with **no
      `## Phases` section** skips the guard entirely (no lint, no STOP) and
      runs the legacy single-pass flow — placed **before** the "run the
      canonical 8-box phase-lint" instruction, and cross-referencing the
      existing legacy exemption in the *Workflows* section.
      Evidence: `skills/execute-phase/SKILL.md:163-167`, commit `b0c13eb`.
- [x] Run `bump-skill` for `execute-phase`: bump its `version:` (patch), add
      the `CHANGELOG.md` + `CHANGELOG.es.md` rows, and refresh the
      `README.md` + `README.es.md` skills/version tables.
      Evidence: `version: 2.4.1` (`skills/execute-phase/SKILL.md:4`),
      `CHANGELOG.md`/`CHANGELOG.es.md` rows + release-log entries, commit
      `b0c13eb`. README/README.es.md skills table left unchanged — the
      existing cell already states the legacy-SPEC single-pass fact
      separately and isn't inaccurate (patch-bump policy: no README edit
      required unless the cell is wrong); no model/effort tier changed, so
      `model-routing.yml` is untouched.

### P2 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #81`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #81` and push

## Testing

No automated test harness exists for skill-body prose (this repo has no
application build). Verification is:

- **Static (in-repo):** `grep` for the carve-out sentence in the guard
  section; read the section to confirm the skip is stated *before* the lint
  step and keys on the absence of `## Phases`.
- **Manual (`manual` — required, and why):** per CLAUDE.md
  "Smoke-test wording changes to executor-path skills", drive the golden
  fixture (`docs/workflow/GOLDEN_FIXTURE.md`) through the edited
  `execute-phase` with a legacy-style SPEC (no `## Phases`) using the weakest
  model in the fleet, and confirm it runs the legacy flow rather than STOPping
  at the phase-lint gate. This is manual because it exercises a model reading
  the skill, which no unit test can stand in for.
- **Regression risk:** confirm a phased SPEC (with `## Phases`) still triggers
  the 8-box lint and still STOPs on a deliberately non-atomic phase — the
  carve-out must not disable the guard for phased SPECs.

## Rollback

`git revert <merge-commit>` (or revert the PR from the forge). No data-side
cleanup — the change is confined to committed Markdown; reverting restores the
prior guard wording exactly. Nothing is lost.

## Status

`pending`
