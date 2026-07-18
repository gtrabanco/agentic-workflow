# fix/66-scope-bleed-guardrail

> Fix specification. Its `## Phases` section is the execution ledger
> `execute-phase --fix` runs one phase per invocation.

## Goal

Finishing a feature sometimes generates a tail of new issues — and some of
those are not genuinely new work discovered along the way, but **acceptance
scope quietly cut in the rush to declare the unit done**, then re-imported later
as issues. The unit reads as finished; the scope silently moved to the backlog.
No current guardrail catches this: `execute-phase` can create issues freely, and
`audit-pr` never cross-checks issues born during the unit against the SPEC's
acceptance criteria. This is the same laziness escape hatch `fold-findings`
(#65) closed for review findings: given a cheap way to look finished, models take
it. This fix encodes one precise distinction across three skills — **discovered
work** (genuinely outside the SPEC's promises → fine as an issue, that is what
triage exists for) vs **descoped work** (inside the SPEC's promises → must become
a user-approved, dated **SPEC amendment** *before* it may ever become an issue).
It cannot wait for a feature cycle: it is a systemic integrity hole in the
"done" definition that every unfinished-but-merged unit routes through.

## Issue

`#66` — GitHub issue. The PR must close it via `Closes #66` in the body.

## Branch

`fix/66-scope-bleed-guardrail`

## Depends on

None. Independent of #64 (phase atomicity, already merged) and #79 (envelope
exposure, postponed — it depends on *this*, not the reverse).

## Root cause

Not a defect in one file — a missing invariant spanning three skills:

- `skills/execute-phase/SKILL.md` — the **Issue policy** section
  (`skills/execute-phase/SKILL.md:258-281`) and the **Forbidden** list
  (`skills/execute-phase/SKILL.md:204-214`) let a phase create issues with no
  check on whether the issue's content overlaps a SPEC acceptance criterion or
  phase task. Descoping is therefore indistinguishable from discovery.
- `skills/audit-pr/SKILL.md` — the merge-readiness contract table
  (`skills/audit-pr/SKILL.md:98-109`) evaluates delivery *against* the SPEC's
  acceptance criteria but never inspects the issues *born during* the unit, so a
  criterion silently converted into a follow-up issue passes as "deferred work"
  with no trace.
- `skills/product-audit/SKILL.md` — the audit dimensions
  (`skills/product-audit/SKILL.md:80-94`) have no signal for *recurring*
  scope export, so a team systematically cutting units too big never gets the
  planning-quality flag that would route them to the atomicity/split rules.

The shared root is the absence of a defined **descope amendment** record — a
first-class, user-approved, dated entry in the governing SPEC — that both the
writer (`execute-phase`) and the verifier (`audit-pr`) can key off.

## Detected in

Design discussion, 2026-07-16 (recorded in issue #66); framed as the scope-side
twin of the findings-laziness case that produced `fold-findings` (#65).

## Scope

### In scope

- **`execute-phase` — descope guard (guardrail #1).** A fixed classification
  run before creating **any** issue during a unit's execution, plus a forbidden-
  list entry and a fixed STOP block:
  - The **descope test** (fixed checklist): an about-to-be-created issue is a
    *descope* iff its content overlaps a SPEC acceptance criterion or a phase
    task that is **not fully delivered** in this unit; otherwise it is
    *discovered work* and may be filed freely.
  - **Descope path:** STOP; the descope must first be recorded as a **SPEC
    amendment** — the criterion moved out of active `## Acceptance`, logged in
    the governing SPEC's `## Amendments` section (user-approved, dated), and
    *only then* may the follow-up issue be created, **linking that amendment**.
    An issue may never be the first record of a descope.
  - The **`## Amendments` record format** defined once here (the canonical
    single source both other skills reference): a fixed row
    `- <YYYY-MM-DD> — descoped: "<criterion/task>" — approved by user — follow-up: #<n>`.
  - A **Forbidden**-list entry: creating an issue that descopes a SPEC
    acceptance criterion or phase task without a user-approved, dated
    `## Amendments` entry.
  - A **turn-contract box** asserting the descope guard was applied to every
    issue created during the turn.
- **`audit-pr` — scope-bleed gate (guardrail #2).** A new merge-readiness gate,
  fixed-output, keyed off the `## Amendments` log as the authoritative record:
  - A **Scope integrity (descope)** gate row added to the contract table.
  - Mechanical detection: list issues **created since the branch diverged**
    (`git log <base>..HEAD` first-commit date) that **reference this unit**; for
    each, the fixed checklist — ✓ criterion still met in the PR, **or** ✓ a
    matching `## Amendments` entry exists (dated, user-approved, linked) —
    otherwise **BLOCKER**. Symmetrically, every `## Amendments` descope row must
    be dated, user-approved, and link a follow-up issue.
  - Scope: any PR governed by a SPEC with acceptance criteria (feature **and**
    fix). A SPEC with no `## Amendments` section and no unit-referencing issues
    born during the branch → the gate **passes** (nothing exported).
  - The closing `→ Next:` routes a scope-bleed blocker to the amendment-or-
    triage decision (record the amendment, or re-classify the issue as truly
    discovered).
- **`product-audit` — recurrence signal (guardrail #3).** A planning-quality
  finding under the process/workflow-discipline sweep: if **≥ 2 units in a row**
  (most-recent units, merged or in-flight) exported scope — a non-empty
  `## Amendments` descope log or a descope-classified born issue — flag that
  features are being cut too big for their real capacity and route the finding
  to the atomicity/split rules (#64).
- **Contract-restatement docs parity:** `README.md` / `README.es.md` and
  `docs/workflow/SKILLS.md` / `SKILLS.es.md` — the `execute-phase`, `audit-pr`,
  and `product-audit` contract rows each name the scope-bleed guardrail (both
  siblings, same change).
- **Registration:** `bump-skill` (version bumps for `execute-phase`, `audit-pr`,
  `product-audit`; `CHANGELOG.md` + `CHANGELOG.es.md` rows; README skill-version
  tables).
- **GOLDEN_FIXTURE smoke test** on the reworded `execute-phase` (executor-path
  skill — CLAUDE.md smoke rule) with the weakest fleet model: an issue that
  overlaps an unmet acceptance criterion → STOP demanding an amendment; an issue
  outside every criterion/task → filed with no stop.

### Out of scope

- **`workflow-status` — per-unit `issues_born: n` + descope-amendment count
  (guardrail #4 of the issue).** Deliberately excluded: issue **#79** (already
  postponed, and it **depends on #66**) explicitly folds this envelope field in
  "so the envelope changes land once". This fix ships the three behavioral
  guardrails; exposing their machine signal in the envelope + schema package is
  #79's job. See Cross-issue notes.
- **A pre-stubbed `## Amendments` section in the SPEC templates**
  (`docs/features/_TEMPLATE/SPEC.md`, `docs/fix/_TEMPLATE/SPEC.md`). The section
  is created on first descope; a template stub is a nicety, not required for the
  grep-level gate. If wanted, its own follow-up issue.
- **A `descoped` GitHub label.** Detection keys off the SPEC `## Amendments` log
  (the authoritative first record), not a label; label ownership already belongs
  to `triage-issue` (#54). Not needed here.
- **Changing what counts as an acceptance criterion**, or any SPEC-template
  acceptance format change. The gate only reads existing criteria.

## Acceptance

- [ ] `execute-phase` states the **descope test** (fixed checklist: overlaps an
      unmet acceptance criterion/phase task → descope; else discovered),
      the **descope STOP block** (record a `## Amendments` entry first, then the
      linked issue), and the **`## Amendments` row format** — grep
      `skills/execute-phase/SKILL.md` finds the checklist, the STOP block, and
      the `descoped: … — approved by user — follow-up: #<n>` row format.
- [ ] `execute-phase`'s **Forbidden** list gains the "no issue that descopes a
      criterion/task without a user-approved dated amendment" entry, and a
      **turn-contract box** asserts the descope guard ran (grep both present).
- [ ] `audit-pr` adds a **Scope integrity (descope)** gate to the contract
      table **and** the fixed-output detail: list issues born since branch
      divergence referencing the unit; per-issue checklist (criterion met **or**
      amendment exists → pass, else BLOCKER); every `## Amendments` row dated +
      user-approved + linked. Grep `skills/audit-pr/SKILL.md` → the gate row, the
      per-issue checklist, and the `BLOCKER` path all present.
- [ ] `audit-pr` states the gate scope (any SPEC-governed PR; nothing exported →
      passes) and adds a **turn-contract box** requiring the scope-bleed gate to
      be evaluated (pass / blocker / n-a) every audit.
- [ ] `product-audit` adds the **scope-export recurrence** signal: ≥ 2
      consecutive recent units with a descope log/issue → a planning-quality
      finding routed to #64. Grep `skills/product-audit/SKILL.md` → the ≥ 2
      threshold, the `#64` route, and its placement in the process/discipline
      sweep.
- [ ] Contract-restatement docs updated in the same change: `README.md` +
      `README.es.md` and `docs/workflow/SKILLS.md` + `SKILLS.es.md` — the
      `execute-phase`, `audit-pr`, and `product-audit` rows name the scope-bleed
      guardrail (grep both siblings of each pair → mentioned in EN and ES).
- [ ] `bump-skill` run: `execute-phase`, `audit-pr`, `product-audit` `version:`
      bumped (minor — backward-compatible capability), `CHANGELOG.md` +
      `CHANGELOG.es.md` rows added, README skill-version tables reflect the new
      versions.
- [ ] `npx skills add . --list` still discovers every skill (no YAML breakage).
- [ ] GOLDEN_FIXTURE smoke test recorded: a weak model given an issue that
      overlaps an unmet acceptance criterion STOPs demanding a `## Amendments`
      entry; given an issue outside every criterion/task files it without a stop
      (run-log row appended to `docs/workflow/GOLDEN_FIXTURE.md`).

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here. Every implementation phase below passes all 8 phase-lint boxes
(see `docs/fix/_TEMPLATE/SPEC.md` `## Phases`).

### P1 — Descope guard in execute-phase

Layer: `docs`. Done-when: `grep` on `skills/execute-phase/SKILL.md` finds the
descope test checklist, the STOP block, the `## Amendments` row format, the new
Forbidden entry, and the new turn-contract box.

- [x] Add a **descope guard** subsection to the Issue policy: the fixed descope
      test (issue overlaps an unmet acceptance criterion/phase task → descope;
      else discovered work → file freely). (`skills/execute-phase/SKILL.md:296-317`)
- [x] Add the fixed **descope STOP block** — on a descope, stop and require a
      user-approved dated `## Amendments` entry (criterion moved out of active
      `## Acceptance`) before the linked follow-up issue may be created.
      (`skills/execute-phase/SKILL.md:305-315`)
- [x] Define the canonical **`## Amendments` row format** once
      (`- <YYYY-MM-DD> — descoped: "<criterion/task>" — approved by user —
      follow-up: #<n>`), noting the other two skills reference this definition.
      (`skills/execute-phase/SKILL.md:313,316-317`)
- [x] Add the **Forbidden**-list entry: creating an issue that descopes a SPEC
      criterion/task without a user-approved dated amendment.
      (`skills/execute-phase/SKILL.md:218-221`)
- [x] Add a **turn-contract box** asserting the descope guard was applied to
      every issue created during the turn. (`skills/execute-phase/SKILL.md:63-68`)

### P2 — Scope-bleed gate in the audit-pr contract

Layer: `docs`. Done-when: `grep` on `skills/audit-pr/SKILL.md` finds the Scope
integrity (descope) gate row, the born-issues detection command, the per-issue
checklist, the `BLOCKER` path, and the new turn-contract box.

- [x] Add a **Scope integrity (descope)** row to the merge-readiness contract
      table (blocker when an issue born during the unit maps to an unmet
      acceptance criterion with no matching `## Amendments` entry).
      (`skills/audit-pr/SKILL.md:113`)
- [x] Add the fixed-output gate detail after the table: mechanical detection of
      issues born since branch divergence referencing the unit; the per-issue
      checklist (criterion met **or** amendment exists → pass, else BLOCKER);
      the symmetric `## Amendments`-row validity check (dated, user-approved,
      linked). (`skills/audit-pr/SKILL.md:153-172`)
- [x] State the gate scope (any SPEC-governed PR — feature and fix; nothing
      exported → passes) and that the `## Amendments` log is the authoritative
      record it keys off (single-source cross-ref to `execute-phase`).
      (`skills/audit-pr/SKILL.md:156-157,173-175`)
- [x] Add a **turn-contract box** requiring the scope-bleed gate to be evaluated
      (pass / blocker / n-a) on every audit. (`skills/audit-pr/SKILL.md:51-53`)
- [x] Wire the closing `→ Next:` block: a scope-bleed blocker routes to the
      amendment-or-triage decision (record the `## Amendments` entry, or
      re-classify the issue as genuinely discovered).
      (`skills/audit-pr/SKILL.md:319-321`)

### P3 — Recurrence signal in product-audit

Layer: `docs`. Done-when: `grep` on `skills/product-audit/SKILL.md` finds the
≥ 2-consecutive-units scope-export threshold, the `#64` route, and its
placement in the process/workflow-discipline dimension.

- [x] Add the **scope-export recurrence** signal to the process/workflow-
      discipline sweep: ≥ 2 consecutive recent units with a non-empty
      `## Amendments` descope log (or a descope-classified born issue) → a
      planning-quality finding ("features cut too big for real capacity"),
      routed to the atomicity/split rules (#64). (`skills/product-audit/SKILL.md:92`)
- [x] Reflect the signal in the audit dimensions table / output format so it
      surfaces as a ranked finding, not buried prose.
      (`skills/product-audit/SKILL.md:92,146-152`)

### P4 — Contract-restatement docs parity

Layer: `docs`. Done-when: for each EN/ES pair, `grep` shows the scope-bleed
guardrail named in both siblings for all three skills.

- [x] `README.md` + `README.es.md` — the `execute-phase`, `audit-pr`, and
      `product-audit` contract rows each name the scope-bleed guardrail (both
      siblings, same change).
- [x] `docs/workflow/SKILLS.md` + `docs/workflow/SKILLS.es.md` — the same three
      rows name the guardrail (both siblings).
- [x] Verify: `grep -il "scope-bleed\|descope"` each pair → mentioned in EN and
      ES for both doc pairs (confirmed on all four files).

### P5 — Registration via bump-skill

Layer: `docs`. Done-when: `npx skills add . --list` lists every skill and the
new `execute-phase` + `audit-pr` + `product-audit` versions appear in both
READMEs.

- [x] Run `bump-skill` for `execute-phase`, `audit-pr`, `product-audit`: bump
      each `version:` (minor) and add rows to `CHANGELOG.md` + `CHANGELOG.es.md`.
      (execute-phase 2.4.1→2.5.0, audit-pr 3.2.0→3.3.0, product-audit 2.0.0→2.1.0)
- [x] Confirm `bump-skill` updated the skill-version tables in `README.md` +
      `README.es.md`. (contract rows already reflected the new capabilities from
      P4; no further change needed — confirmed by `bump-skill`'s own step 7/8)
- [x] Verify: `npx skills add . --list` discovers every skill (no YAML breakage).

### P6 — Hardening & PR

- [x] GOLDEN_FIXTURE smoke test (`manual`): with the weakest fleet model, drive
      the reworded `execute-phase` against two issue-creation cases — an issue
      overlapping an unmet acceptance criterion → STOP demanding a
      `## Amendments` entry; an issue outside every criterion/task → filed, no
      stop. Append a run-log row to `docs/workflow/GOLDEN_FIXTURE.md`. (PASS,
      Claude Haiku 4.5 — both cases correctly classified, row appended EN+ES)
- [x] Re-run the project's full verification gate (commands + exit codes pasted)
      (`npx skills add . --list` → exit 0)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip (sha `8bdbc62`)
- [x] `git push` (sha `8bdbc62` pushed, branch tracking origin)
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #66`
      (https://github.com/gtrabanco/agentic-workflow/pull/88, verified 0
      escaped backticks)
- [x] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [x] Commit `docs: link PR #66` and push

## Testing

No application test suite exists (skills/docs repo). Verification is:

- `npx skills add . --list` — every skill still discovered (YAML well-formed).
- Grep-based structural checks (P1–P4 done-when) — the descope test, STOP block,
  `## Amendments` format, scope-bleed gate + checklist, recurrence signal, and
  bilingual restatements are present.
- GOLDEN_FIXTURE manual smoke test (P6) — the integration-level check: the
  weakest fleet model STOPs on a descope-issue and files a discovered-work issue
  cleanly. This exercises the actual weak-model behavior the fix targets, not a
  mock of it. Prefer this over any heavier harness.

## Rollback

`git revert <merge-commit>` (or revert the PR from the forge). No data-side
cleanup — the change is skill/doc wording only; nothing persists outside git.
The guardrails are additive; reverting restores the prior behavior where a
descope could silently become an issue. Nothing is lost.

## Impact

- **Layers touched:** none in a running application — this repo ships skills +
  docs. Affected artifacts: `skills/execute-phase/SKILL.md`,
  `skills/audit-pr/SKILL.md`, `skills/product-audit/SKILL.md`, the two
  contract-restatement doc pairs (`README.*`, `docs/workflow/SKILLS.*`),
  `CHANGELOG.*`, and `docs/workflow/GOLDEN_FIXTURE.md`.
- **Blast radius:** dev-only. The gate adds a STOP/blocker that can only fire
  when a SPEC criterion is being cut without a recorded amendment — exactly what
  it exists to catch. Worst-case misfire is a spurious STOP on a genuinely
  discovered issue that a re-read of the criteria clears; never data loss, never
  a wrongful merge-block on a clean unit.
- **Detection lead time:** immediate — a wrong guard output shows in the very
  next `execute-phase` / `audit-pr` run and in the GOLDEN_FIXTURE smoke test
  before merge.

## Rules that must never be violated

- **Discovered vs descoped is the whole point.** Genuinely new work (outside the
  SPEC's promises) stays a plain issue — triage's job. Only in-scope cuts need
  the amendment. The guard must not push weak models to treat every born issue
  as a descope (over-blocking) any more than to treat every descope as discovery
  (the leak).
- **An issue is never the first record of a descope.** The user-approved dated
  `## Amendments` entry always precedes the follow-up issue; the issue links it.
- **User approval is required for a descope.** `execute-phase` STOPs and asks —
  it never self-authorizes moving a criterion out of scope.
- **Detection stays mechanical where it can.** `audit-pr`/`product-audit` key off
  the grep-able `## Amendments` log and born-issue list, not judgment about
  intent.
- **Checklists over heuristics; fixed output.** The descope test, the STOP block,
  and the scope-bleed gate are fixed-output blocks a weak model copies verbatim
  (CLAUDE.md "Checklists over heuristics").
- **Bilingual sync is same-change.** Every edited EN doc with an `.es.md` sibling
  updates the sibling in the same commit/PR (CLAUDE.md hard rule). `SKILL.md`,
  SPECs, commits, and `CHANGELOG` rows via `bump-skill` follow their own rules.
- **`audit-pr` never edits or merges by default; `product-audit` never fixes.**
  Both new checks are read-only additions preserving those invariants.

## Operational risks

None — no scheduled job, queue, cache, schema, or external adapter. The change
is inert wording enforced by a human/agent running the skills. No concurrency or
eventual-consistency surface.

## Security risks

None — no auth, secrets, PII, webhooks, or rate-limits touched. The gate only
greps committed SPEC files and lists issues already in the forge (read-only).

## Compliance touchpoints

n/a — no domain/compliance rules (data retention, regional, consumer-protection)
apply to a skills/docs change.

## Affected docs

- `README.md` / `README.es.md` — the `execute-phase`, `audit-pr`,
  `product-audit` contract rows (also acceptance criteria). Bilingual pair, same
  change.
- `docs/workflow/SKILLS.md` / `SKILLS.es.md` — the same three rows (acceptance
  criterion). Bilingual pair.
- `docs/workflow/GOLDEN_FIXTURE.md` — run-log row for the smoke test (P6).
- `CHANGELOG.md` / `CHANGELOG.es.md`, `README.md` / `README.es.md` skill tables
  — via `bump-skill` (bilingual pairs synced in the same change).

## Observability

n/a for a running system. The guardrails' "is it live and healthy" signal is the
GOLDEN_FIXTURE run-log row (P6) plus the grep-based done-when checks: if the
descope guard is present in `execute-phase`, the scope-bleed gate in `audit-pr`,
the recurrence signal in `product-audit`, and the smoke test STOPed on a descope
and filed a discovered issue, the checks are live and behaving.

## Cross-issue notes

- **#79 (workflow-status exposes review/closure/scope signals + envelope schema
  mirror)** — **downstream, postponed, and depends on this.** Issue #79 explicitly
  folds guardrail #4 (`issues_born: n` + descope-amendment count in the envelope)
  into itself "so the envelope changes land once", and lists #66 as a dependency.
  **Decision:** guardrail #4 is out of scope here; #79 stays its own unit. Do not
  add envelope/schema-package work to this fix.
- **#64 (phase-atomicity lint)** — **merged; the recurrence signal's routing
  target.** Guardrail #3 points at #64's atomicity/split rules as the remedy when
  scope export recurs (units cut too big). **Decision:** reference #64 as the
  route; no dependency (it is already landed).
- **#65 (fold-findings)** — **merged; the conceptual twin.** `fold-findings`
  closed the *findings* laziness hatch; this fix closes the *scope* one with the
  same discovered-vs-must-be-recorded shape. **Decision:** cite the parallel in
  the Goal; no code coupling.
- **#77 (review-cadence recalibration)** — unrelated mechanism; parallel.
- No open PRs; nothing blocks or is blocked by this fix.

## Effort

**M** — one coherent invariant (the descope amendment) fanned across three
SKILLs (a writer guard, a verifier gate, a recurrence signal), two bilingual doc
restatements, a three-skill version bump, and one smoke test. No code, no schema,
no runtime; multi-file and mechanical. Larger than #78 (two SKILLs) but the same
kind of change. Multi-commit, ≤ 1 day.

## Decisions made during drafting

- **The `## Amendments` log is the single source of truth**, not a GitHub label.
  Because "an issue is never the first record of a descope", the SPEC amendment
  necessarily exists before any descope-issue — so `audit-pr` and `product-audit`
  key off the grep-able log, and every legitimate descope-issue links its row.
  Avoids inventing a new label surface (already `triage-issue`'s domain, #54).
- **The gate applies to fix-governed PRs too**, not just features. The issue is
  framed around features, but a fix SPEC also carries acceptance criteria that a
  lazy run could export — the gate keys off "SPEC acceptance criteria" generally,
  so it protects both. A fix with no exported scope simply passes. The
  implementer may narrow to feature-only if a project objects.
- **`## Amendments` heading is the grep anchor.** Chosen (over reusing
  `## Decisions made during drafting`) because a descope is a post-hoc scope
  change, semantically distinct from a drafting decision; keeping it separate
  makes the gate's grep unambiguous. If a project renames the heading, the anchor
  moves with it (stated in-skill).
- **No SPEC-template stub for `## Amendments`.** The section is created on first
  descope; a pre-stub is cosmetic and would add template churn for the common
  (no-descope) case. Left out of scope; the grep-level gate does not need it.
- **Guardrail #4 deferred to #79** — not a judgment call so much as honoring
  #79's own stated fold ("land the envelope changes once") and its declared
  dependency on #66. Kept out to hold scope to the three behavioral guardrails.

## Status

`done` · [#88](https://github.com/gtrabanco/agentic-workflow/pull/88)
