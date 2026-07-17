# fix/78-audit-pr-closure-integrity

> Fix specification. Its `## Phases` section is the execution ledger
> `execute-phase --fix` runs one phase per invocation.

## Goal

`audit-pr` verifies delivery against the SPEC that *exists* — every acceptance
criterion mapped to evidence — but never checks that the SPEC itself is
complete. A hollow SPEC (a feature planned before `design-feature` existed, or a
capability closure filled lazily) sails through as MERGE-READY over poor
criteria: garbage in, merge-ready out. This is the root "goal gap" behind
features that ship technically correct yet humanly unusable — a user system with
no visible way to log in, a profile page with no edit. `design-feature`'s
capability-closure checklist catches exactly these *at design time*, but nothing
downstream verifies the closure was ever done. This fix adds a purely mechanical
**closure-integrity check** to `audit-pr`'s merge-readiness contract, with a
trigger-based legacy carve-out so no existing project is forced into a mass
retrofit. It cannot wait for a feature cycle: it is the systemic hole every
other item in the goal-gap discussion routes through.

## Issue

`#78` — GitHub issue. The PR must close it via `Closes #78` in the body.

## Branch

`fix/78-audit-pr-closure-integrity`

## Depends on

None. Independent of #76 (adversarial multi-reviewer) and #77 (review cadence);
can land first — confirmed by the triage note on the issue.

## Root cause

`skills/audit-pr/SKILL.md` — the merge-readiness contract table
(`skills/audit-pr/SKILL.md:93-103`) takes the governing SPEC as ground truth:
every gate (Acceptance criteria, Scope integrity, Docs, Tests, …) evaluates
delivery *against* the SPEC, none inspects the SPEC's own completeness. The
capability-closure invariant lives only in `design-feature`
(`skills/design-feature/SKILL.md:115-165`, `184-188`) and is enforced only at
design time; `plan-feature-from-issue` extends it (forbids stamping `designed`
over a blank closure table), but the merge gate never re-checks it. So a SPEC
that bypassed or predates `design-feature` reaches merge unchecked.

## Detected in

Design discussion, 2026-07-17 (recorded in issue #78); triaged the same day to
`fix-now` as the highest-impact item of the goal-gap package.

## Scope

### In scope

- A **closure-integrity gate** added to `audit-pr`'s merge-readiness contract
  (`skills/audit-pr/SKILL.md`), purely mechanical (grep-level), with two fixed
  output paths: a **blocker** path (SPEC carries a closure block but fails the
  boxes) and a dated **warning** path (`design-debt: closure absent, SPEC
  predates the rule` — legacy SPEC, never blocks).
- The gate's **legacy-vs-new detection** stated as mechanical: presence of the
  `## Capability closure` block itself (grep), never dates or versions.
- The gate's **scope** stated: it applies to **feature-governed PRs** only; for
  a fix-governed PR (`docs/fix/<n>-<topic>/SPEC.md`, which has no closure block
  by design) the gate is **n/a**, never a warning.
- The **retrofit trigger** stated in `audit-pr`'s warning text (new work
  touching a legacy feature must fill the closure via `design-feature`'s upsert
  *before* planning that work) and **cross-referenced** from `design-feature`'s
  upsert section (`skills/design-feature/SKILL.md`).
- `audit-pr`'s closing **`→ Next:`** block routes a closure warning/blocker to
  `/design-feature <slug>` (upsert) as the recommended command, with the
  existing alternatives kept as sub-bullets.
- **Docs restating the audit contract** brought into parity: `README.md` /
  `README.es.md`, `docs/workflow/SKILLS.md` / `SKILLS.es.md`,
  `docs/workflow/FEATURE_WORKFLOW.md` / `FEATURE_WORKFLOW.es.md` — each names
  the closure-integrity gate.
- Registration: `bump-skill` (version bumps for `audit-pr` + `design-feature`,
  `CHANGELOG.md` + `CHANGELOG.es.md` rows, README skill tables).
- GOLDEN_FIXTURE smoke test on the reworded `audit-pr` with the weakest fleet
  model: a hollow closure block → BLOCKED with the design-debt route; a SPEC
  with no closure block → the dated warning and **does not** block.

### Out of scope

- **Any change to the closure checklist itself** — the boxes `design-feature`
  writes are unchanged; this fix only *reads* them at the gate. Design-time
  judgment stays in `design-feature`.
- **Mass retrofit of legacy SPECs** — deliberately excluded; the carve-out
  exists precisely so debt is paid when its trigger fires, per the repo's triage
  philosophy. Retrofit belongs to whatever unit next touches a legacy feature.
- **The adversarial R3 "SPEC-coverage" reviewer role** — issue #76. Complementary
  (see Cross-issue notes), not part of this fix.
- **`workflow-status` surfacing the closure/scope signals** — issue #79 (already
  postponed). This fix adds the gate; exposing it in the envelope is #79's job.
- **Exposing a machine `closure` field in the envelope schema package** — #79.

## Acceptance

- [ ] The three-box closure-integrity check is added to `audit-pr`'s
      merge-readiness contract table, with **both** the legacy-warning path and
      the blocker path specified as fixed outputs (grep `skills/audit-pr/SKILL.md`
      → the three boxes, the `design-debt: closure absent…` warning string, and
      a `BLOCKER` path all present).
- [ ] The retrofit trigger is stated in `audit-pr` (the warning text names it)
      and cross-referenced from `design-feature`'s upsert section (grep both
      SKILLs → each references the other's role in the retrofit path).
- [ ] `n/a` is explicitly documented as **passing** — the check never demands
      surface; `n/a: <reason>` is a valid, passing row (present verbatim in the
      gate text).
- [ ] The gate's scope (feature PRs only; fix PRs n/a) and its mechanical
      legacy-vs-new detection (grep for `## Capability closure`, never
      dates/versions) are both stated in `audit-pr`.
- [ ] `audit-pr`'s `→ Next:` block routes a closure warning/blocker to
      `/design-feature <slug>` (upsert) as the recommended command.
- [ ] Docs restating the audit contract updated in the same change: `README.md`
      + `README.es.md`, `docs/workflow/SKILLS.md` + `SKILLS.es.md`,
      `docs/workflow/FEATURE_WORKFLOW.md` + `FEATURE_WORKFLOW.es.md` — each names
      the closure-integrity gate (grep both siblings of each pair → mentioned in
      EN and ES).
- [ ] `bump-skill` run: `audit-pr` and `design-feature` `version:` bumped
      (minor — backward-compatible capability), `CHANGELOG.md` +
      `CHANGELOG.es.md` rows added, README skill-version tables reflect the new
      versions.
- [ ] `npx skills add . --list` still discovers every skill (no YAML breakage).
- [ ] GOLDEN_FIXTURE smoke test recorded: a weak model given a hollow closure
      block produces BLOCKED with the design-debt route; given a SPEC with no
      closure block produces the warning and does **not** block (run-log row
      appended to `docs/workflow/GOLDEN_FIXTURE.md`).

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here. Every implementation phase below passes all 8 phase-lint boxes
(see `docs/fix/_TEMPLATE/SPEC.md` `## Phases`).

### P1 — Closure-integrity gate in the audit-pr contract

Layer: `docs`. Done-when: `grep -c` on `skills/audit-pr/SKILL.md` finds the
three boxes, the `design-debt: closure absent, SPEC predates the rule` warning
string, the `n/a: <reason>` passing note, and the `/design-feature <slug>`
route.

- [x] Add a **Closure integrity** gate row to the merge-readiness contract
      table (what it means: the governing feature SPEC's capability closure was
      taken and recorded; blocker when a present closure block has a blank row
      or an unmapped non-`n/a` row).
- [x] Add the fixed-output gate detail after the table: the three boxes
      (block present · zero blank rows · every non-`n/a` row maps to an
      acceptance criterion), stating `n/a: <reason>` is a valid passing row and
      the check never demands surface.
- [x] State the mechanical legacy-vs-new detection (grep for `## Capability
      closure`, never dates/versions) and the two paths: block present → boxes
      are blockers; block absent → dated warning `design-debt: closure absent,
      SPEC predates the rule`, PR still merges.
- [x] State the gate scope: feature-governed PRs only; fix-governed PRs are
      `n/a` (no closure block by design, never a warning).
- [x] State the retrofit trigger in the warning text (new work touching a
      legacy feature fills the closure via `design-feature` upsert before
      planning that work).
- [x] Add a turn-contract box requiring the closure gate to be evaluated
      (pass / blocker / warning / n-a) on every audit.
- [x] Wire the closing `→ Next:` block: on a closure warning/blocker, recommend
      `/design-feature <slug>` (upsert); keep the existing alternatives as
      sub-bullets.

### P2 — Retrofit cross-reference in design-feature

Layer: `docs`. Done-when: `grep` on `skills/design-feature/SKILL.md` finds a
reference to `audit-pr`'s closure-integrity gate / retrofit trigger in the
upsert section.

- [x] In `design-feature`'s upsert semantics section, note that `audit-pr`'s
      closure-integrity warning is the retrofit trigger: re-running
      `design-feature <slug>` on a legacy feature fills only the missing closure
      rows (upsert never destroys recorded decisions) before that new work is
      planned.

### P3 — Contract-restatement docs parity

Layer: `docs`. Done-when: for each EN/ES pair, `grep` shows the closure-integrity
gate named in both siblings.

- [ ] `README.md` + `README.es.md` — the `audit-pr` gate-list row names the
      closure-integrity gate (both siblings, same change).
- [ ] `docs/workflow/SKILLS.md` + `docs/workflow/SKILLS.es.md` — the `audit-pr`
      row names the closure-integrity gate (both siblings).
- [ ] `docs/workflow/FEATURE_WORKFLOW.md` + `docs/workflow/FEATURE_WORKFLOW.es.md`
      — the `audit-pr` merge-gate bullet names the closure-integrity gate (both
      siblings).
- [ ] Verify: `grep -il "closure" ` each pair → the gate is mentioned in EN and
      ES for all three pairs.

### P4 — Registration via bump-skill

Layer: `docs`. Done-when: `npx skills add . --list` lists every skill and the
new `audit-pr` + `design-feature` versions appear in both READMEs.

- [ ] Run `bump-skill` for `audit-pr` and `design-feature`: bump each
      `version:` (minor) and add rows to `CHANGELOG.md` + `CHANGELOG.es.md`.
- [ ] Confirm `bump-skill` updated the skill-version tables in `README.md` +
      `README.es.md`.
- [ ] Verify: `npx skills add . --list` discovers every skill (no YAML breakage).

### P5 — Hardening & PR

- [ ] GOLDEN_FIXTURE smoke test (`manual`): with the weakest fleet model, drive
      the reworded `audit-pr` against two SPEC variants — a hollow closure block
      (blank row) → BLOCKED with the design-debt/`design-feature` route; a SPEC
      with no closure block → the dated warning, no block. Append a run-log row
      to `docs/workflow/GOLDEN_FIXTURE.md`.
- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #78`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #78` and push

## Testing

No application test suite exists (skills/docs repo). Verification is:

- `npx skills add . --list` — every skill still discovered (YAML well-formed).
- Grep-based structural checks (P1–P3 done-when) — the gate boxes, warning
  string, retrofit cross-reference, and bilingual restatements are present.
- GOLDEN_FIXTURE manual smoke test (P5) — the integration-level check: the
  weakest fleet model produces BLOCKED on a hollow closure and the dated warning
  (no block) on a legacy SPEC. This exercises the actual weak-model behavior the
  fix targets, not a mock of it. Prefer this over any heavier harness.

## Rollback

`git revert <merge-commit>` (or revert the PR from the forge). No data-side
cleanup — the change is skill/doc wording only; nothing persists outside git.
The gate is additive and mechanical; reverting simply removes the closure check,
restoring the prior behavior where a hollow SPEC could reach MERGE-READY.
Nothing is lost.

## Impact

- **Layers touched:** none in a running application — this repo ships skills +
  docs. Affected artifacts: `skills/audit-pr/SKILL.md`,
  `skills/design-feature/SKILL.md`, the six contract-restatement docs (EN/ES),
  `CHANGELOG.*`, `README.*`, `docs/workflow/GOLDEN_FIXTURE.md`.
- **Blast radius:** dev-only, and *fail-open on legacy*. On new work the gate
  adds a blocker that can only fire when the `design-feature` flow was bypassed
  — exactly what it exists to catch. On legacy SPECs it only warns, so no
  existing project's PRs are newly blocked. The worst-case misfire is a spurious
  warning, never a wrongful block.
- **Detection lead time:** immediate — a wrong gate output shows in the very
  next `audit-pr` run and in the GOLDEN_FIXTURE smoke test before merge.

## Rules that must never be violated

- **The gate never demands surface.** `n/a: <reason>` is a fully valid passing
  row; the check verifies the decision was *taken and recorded*, never that UI/API
  exists. It must not push weak models to invent surface (the explicit
  anti-overengineering constraint from the issue).
- **Legacy never hard-blocks.** A SPEC with no closure block yields a dated
  warning, never a blocker — no mass retrofit is ever forced.
- **Detection stays mechanical.** Legacy-vs-new is decided purely by grep for
  the closure block; never by dates, versions, or judgment.
- **Checklists over heuristics; fixed output.** Both paths (warning, blocker)
  are fixed-output blocks a weak model copies verbatim (CLAUDE.md "Checklists
  over heuristics").
- **Bilingual sync is same-change.** Every edited EN doc with an `.es.md`
  sibling updates the sibling in the same commit/PR (CLAUDE.md hard rule).
- **`audit-pr` never edits or merges by default.** This fix adds a read-only
  gate; it does not touch the skill's read-first / no-refactor / opt-in-merge
  invariants.

## Operational risks

None — no scheduled job, queue, cache, schema, or external adapter. The change
is inert wording enforced by a human/agent running `audit-pr`. No concurrency or
eventual-consistency surface.

## Security risks

None — no auth, secrets, PII, webhooks, or rate-limits touched. The gate only
greps a committed SPEC file already in the repo.

## Compliance touchpoints

n/a — no domain/compliance rules (data retention, regional, consumer-protection)
apply to a skills/docs change.

## Affected docs

- `README.md` / `README.es.md` — `audit-pr` gate-list row (also an acceptance
  criterion). Bilingual pair, same change.
- `docs/workflow/SKILLS.md` / `SKILLS.es.md` — `audit-pr` row (acceptance
  criterion). Bilingual pair.
- `docs/workflow/FEATURE_WORKFLOW.md` / `FEATURE_WORKFLOW.es.md` — `audit-pr`
  merge-gate bullet (acceptance criterion). Bilingual pair.
- `docs/workflow/GOLDEN_FIXTURE.md` — run-log row for the smoke test (P5).
- `CHANGELOG.md` / `CHANGELOG.es.md`, `README.md` / `README.es.md` skill tables
  — via `bump-skill` (bilingual pairs synced in the same change).

## Observability

n/a for a running system. The gate's own "is it live and healthy" signal is the
GOLDEN_FIXTURE run-log row (P5) plus the grep-based done-when checks: if the
closure gate is present in `skills/audit-pr/SKILL.md` and the smoke test
produced BLOCKED-on-hollow / warning-on-legacy, the check is live and behaving.

## Cross-issue notes

- **#76 (adversarial multi-reviewer, R3 "SPEC-coverage" role)** —
  **complementary, not redundant.** This closure-integrity check verifies *the
  SPEC promises completely* (the door on the planning side); #76's R3 reviewer
  verifies *the diff delivers what was promised* (the door on the delivery
  side). Neither subsumes the other — one without the other leaves half the door
  open. Recorded here so neither is later descoped as "redundant with the
  other." **Decision:** parallel; land independently.
- **#77 (review-cadence recalibration)** — unrelated mechanism; parallel.
- **#79 (workflow-status exposes review/closure/scope signals + envelope schema
  mirror)** — **downstream, postponed.** This fix adds the gate; #79 surfaces the
  closure signal in the machine envelope and mirrors the schema package.
  **Decision:** #79 stays its own unit; do not fold envelope work here.
- No open PRs; nothing blocks or is blocked by this fix.

## Effort

**S** — single logical change (a read-only gate) fanned across two SKILLs, six
bilingual doc restatements, a version bump, and one smoke test. No code, no
schema, no runtime. Multi-file but mechanical; ≤ 4h.

## Decisions made during drafting

- **Gate scope = feature PRs only.** The capability-closure concept is a
  feature-design artifact (`design-feature` produces it); fix SPECs have no
  closure block by design. So the gate is `n/a` for fix-governed PRs, never a
  warning — otherwise every fix PR would emit a spurious "closure absent"
  warning. Not spelled out in the issue but required to avoid noise; the
  implementer may re-question if a project ever adds closure blocks to fixes.
- **`## Capability closure` is the grep target** for legacy-vs-new detection —
  that is the exact heading `design-feature` writes
  (`skills/design-feature/SKILL.md:117`). If a project renames the heading, the
  detection string moves with it; stated as the mechanical anchor.
- **Complementarity note lives in this SPEC** (Cross-issue notes), not in
  `audit-pr`'s body — the issue asks to "record in the SPEC," and keeping it out
  of the skill body avoids coupling `audit-pr`'s text to an unshipped #76.
- **No `workflow-status` / envelope edits** here — that surface is #79's, kept
  out to hold scope to the gate itself.

## Status

`pending`
