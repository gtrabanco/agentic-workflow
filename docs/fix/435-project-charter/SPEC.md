---
type: feature
scope: medium
---
# fix/435-project-charter

> One-line: `init-workspace` gains a project-charter step — a two-layer owner
> interrogation whose answers land where every downstream tier-0 read reaches
> them (agent guide + registered docs), audited for coverage by `audit-docs`.

## Issue

`#435` — "NEW FEATURE: project charter in init-workspace — two-layer owner
interrogation whose answers become tier-0 sources". Open, labels `promoted` +
`feature`, triaged 2026-11-06. The PR closes it via `Closes #435` in the body.

## Specs

**S1 — Apply issue #435 to this repository.**
> Apply to this repository: issue #435

**S2 — Identity layer, forced at bootstrap.**
> 1. **Identity layer — forced at bootstrap** (the workflow may not guess these): what the project is (web app / desktop / library / CLI / docs / infra repo); who uses it and why; where it is deployed and how it is served; the project's license; and the **ceremony profile seed** (see the piecewise-ceremony issue, `blocked-by` there).

**S3 — Domain layer, open-with-defaults.**
> 2. **Domain layer — open-with-defaults** (recorded as dated assumptions, surfaced by the first unit that needs them, not re-asked at every bootstrap): tests policy and the project's gate commands; dependency policy incl. selection criteria and third-party license respect; documentation policy (generated vs authored, serving, audit cadence, captures); required tooling; data/PII; i18n.

**S4 — Content rule (evidence-bound): decisions and policies, never derived description.**
> 3. **Content rule (evidence-bound)**: the charter records **decisions, policies and commands — never derivable-from-code description**. arXiv 2602.11988 found context files with repository *overviews* cost +20% tokens with no success gain while instructions work; arXiv 2601.20404 found root guides reduce tokens on real PRs. arXiv 2605.10039 (instruction adherence): content is positioned and sized per the documentation map, never one monolithic document.

**S5 — Mechanics reuse, none new.**
> 4. **Mechanics reuse, none new**: the interrogation is the existing `needs-input.mjs` / `open-questions@1` fail-closed flow (recommended option + why, one alternative, "Decide for me", "Explain the options"), batched, cheap-to-undo as dated assumptions; expensive-to-undo unanswered.

**S6 — Answers land in the agent guide + registered docs.**
> 5. **Answers land in the agent guide + registered docs** (documentation map rows), so the design/plan provenance searches reach them at tier-0 with no new machinery.

**S7 — Coverage is computed, not policed by prose.**
> 6. **Coverage is computed**: the declared mandatory sections are audited by `audit-docs` (the CAPABILITIES pattern), not policed by prose.

**S8 — Tooling behaviour of `init-workspace` preserved untouched.**
> 7. **Tooling behaviour of `init-workspace` is preserved untouched** — this adds the interrogation step; every existing consent gate stays.

**S9 — The charter's domain layer owns the verification-criteria catalogue.**
> The charter's domain layer (`open-with-defaults`) explicitly includes the **verification-criteria catalogue**: which acceptance criteria exist *at project level*, which review passes apply per surface type, what "done" means beyond the workflow's generic baseline (framework-specific gate commands, docs coverage, captures, manual-check rows).

**S10 — Provenance is mandatory per criterion.**
> **Provenance is mandatory per criterion** — `workflow-generic` / `project-declared` / `stamped assumption (dated)`; triage and execution consume the catalogue and never invent criteria silently.

**S11 — Non-technical owners get help-mode, never silent defaults.**
> **Non-technical owners**: where the project has no declared criteria, the interrogation enters help-mode (recommended option + why, "Explain the options", "Decide for me") so the owner can define them with guidance or let the agent propose them as recorded dated assumptions — never silent defaults.

**S12 — The catalogue's coverage is computed too.**
> Coverage of the declared catalogue is computed by `audit-docs` (same pattern as the mandatory sections), not policed by prose.

## Impact

- **`init-workspace` bootstrap** gains a pre-substrate charter step: the identity
  layer is asked and blocking (expensive-to-undo unanswered → the existing
  fail-closed flow), the domain layer is open-with-defaults (cheap-to-undo →
  dated assumptions, never re-asked at every bootstrap).
- **`init-workspace` upgrade mode** offers the missing charter blocks additively
  (its diff-against-current-template contract picks them up; never re-asking what
  the project answered).
- **`template/AGENTS.md`** carries the charter skeleton (identity slots + domain
  slots + the dated-assumption record) and two new documentation-map rows
  (charter, criteria catalogue) — a copied-but-unfilled template is the shape
  `audit-docs`' new check flags, not a silent pass.
- **`template/docs/workflow/VERIFICATION_CRITERIA.md`** — the criteria-catalogue
  template: per-criterion provenance from the closed set
  (`workflow-generic` / `project-declared` / `stamped assumption (dated)`).
- **`audit-docs`** gains one mechanical check (16) auditing charter + catalogue
  coverage with the CAPABILITIES pattern (rg-backed commands, not prose policing).
- **Consumers reached at tier-0 with no new machinery**: design/plan provenance
  searches reach the charter through the agent guide + map rows; triage and
  execution consume the catalogue.
- **Soft deps composed, not delivered here**: #436 owns the ceremony profile's
  machine grammar (this unit asks for the seed conceptually); #366's doc CLI is
  the future cheap reader; the #357 AGENTS.md-evidence rider composes at
  implementation.
- **Nothing live is touched**: this is prose-only across skill docs, template
  docs, the attribution ledger, the roadmap row and this unit doc.

## Retirements

Nothing is retired — the change is purely additive (a new step, a new template
doc, two map rows, one audit check, one attribution row, one roadmap row). The
omission is a reason, not a gap: there is no superseded surface, helper or
narrative for a charter that did not exist. Evidence at verification:
`git diff <base> --stat` shows no deletion outside this unit doc's own ledger
scaffolding.

## Non-goals

- **No force-filling of all questions at bootstrap** (the anti-pattern:
  reflexive answers that rot) — only the identity layer is blocking (issue
  `Non-goals`, verbatim).
- **No new receipt format**; the charter is prose + existing grammar blocks only.
- **No machine grammar for the ceremony profile** — #436's deliverable; here the
  identity layer asks for the seed conceptually and records the answer.
- **No doc-CLI section reader** — #366's; the charter lands in files the map
  already reaches at tier-0.
- **This repository's own `AGENTS.md` is not rewritten into a charter** — the
  repo's guide predates the charter and already carries its identity in the
  guide's own shape (D2); the unit ships the capability, it does not re-cut this
  repo's guide (the #357 evidence rider composes when it lands, not here).

## Risk tier

Computed, never chosen — `bun scripts/ceremony.mjs tier classify --paths` over
the planned paths at the cut head (`e1d94057`), verdict copied verbatim:

```json
{
  "contract": "risk-tier-verdict@1",
  "tier": "passive",
  "reason": "every changed path is documentation, an image or prose: no executable effect",
  "reason_kind": "no-executable-effect",
  "task_size": {
    "understood": true,
    "contained_risk": "contained",
    "resumable_from_diff": true,
    "ceremony": "none",
    "verification": "readback"
  },
  "signals": [],
  "paths": {
    "changed": [
      "skills/init-workspace/SKILL.md"
    ],
    "escalating": []
  }
}
```

- **Tier** — `passive` · **Task Size** — `understood + contained + resumable (ceremony: none, verification: readback)`
- **Named high-risk item** — `none — not a high-tier unit`

Carrier note (D1, `decisions.md`): the passive verdict's default carrier is
`docs/passive/<id>.md` with **no unit doc**; the owner's standing local workflow
for this change (S1, frozen request) explicitly orders the unit doc + planning
ledgers instead — "This command substitutes for the lane's plan step". The
unit-doc carrier is therefore cut by owner instruction; the deterministic gate
remains the whole verification either way, and no `ceremony passive add` record
is written for the same scope (the two carriers are mutually exclusive, never
both).

## Future

- The ceremony profile seed's **machine grammar** (a `@1` block, vocabulary,
  tier-cost integration) — its own unit, issue [#436](https://github.com/gtrabanco/agentic-workflow/issues/436), `blocked-by` this one. Status: `planned`.
- **Section-level charter reads** through the doc CLI (`doc read`, feature 106's
  locator) so downstream skills read charter sections cheaply — issue
  [#366](https://github.com/gtrabanco/agentic-workflow/issues/366). Status: `planned`.

## Future cost

- **Target projects**: triage and execution consume the charter's criteria
  catalogue and never invent acceptance criteria silently — a criterion absent
  from the catalogue is recorded (`project-declared` or a dated assumption), not
  inferred. Owner: the template agent guide's charter section +
  `audit-docs`' charter check, binding the lane skills at runtime in every
  scaffolded project.
- **This repository**: none imposed — the repo's own guide is not rewritten by
  this unit (D2).

## Applicable tests

n/a — no tests step for this unit

## Known pre-existing issues

- `template/docs/features/ROADMAP.md` + `template/docs/fix/README.md` still ship
  the pre-319 two-index layout while this repo's own tree is consolidated —
  deliberate (upgrade step 4 offers the move to old installs), **does-not-affect**
  this unit: the charter lands in `template/AGENTS.md` and
  `template/docs/workflow/`, neither of which the consolidation moves.
- `audit-docs` check 10's legacy-carrier grep (`grep -rnE '\bS[0-9]+\b…'`) is
  scoped to `PLAN/TASKS/progress.md` files this unit never creates —
  **does-not-affect**.

## Tasks

- P1 — Cut the unit doc + planning ledgers (this freeze): `SPEC.md`,
  `planning-evidence.md`, `planning-obligations.md`, `decisions.md`; paste the
  machine's triaged steps (validator: `bun scripts/phase-lint.mjs docs/fix/435-project-charter/SPEC.md` prints `verdict PASS`)
  (Implements: S1)
  Relevant files: docs/fix/435-project-charter/
- P2 — Record the adopted-knowledge attribution row (cite-sources clause) in
  `docs/research/ATTRIBUTION.md` (validator: `rg -c "#435" docs/research/ATTRIBUTION.md` matches 3)
  (Implements: S4)
  Relevant files: docs/research/ATTRIBUTION.md
- P3 — Ship the charter substrate in the template: `## Project charter` skeleton
  (identity slots + domain slots + dated-assumption record + content rule) and
  the two documentation-map rows in `template/AGENTS.md`; the criteria-catalogue
  template `template/docs/workflow/VERIFICATION_CRITERIA.md` with the closed
  provenance set (validator: `rg -c "## Project charter" template/AGENTS.md` matches 1 and `test -f template/docs/workflow/VERIFICATION_CRITERIA.md` exits 0)
  (Implements: S4, S6, S9, S10)
  Relevant files: template/AGENTS.md template/docs/workflow/VERIFICATION_CRITERIA.md
- P4 — `skills/init-workspace/SKILL.md`: the charter step before any substrate
  action — identity layer asked and blocking, domain layer open-with-defaults,
  halt through the existing fail-closed dispatcher, answers land per the map
  (validator: `rg -c "Project charter" skills/init-workspace/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs` prints `PASS context budgets`)
  (Implements: S2, S3, S5, S6, S8)
  Relevant files: skills/init-workspace/SKILL.md
- P5 — `skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md`: the charter
  interview round — identity questions blocking, domain questions as dated
  assumptions, non-technical help-mode (validator: `rg -c "identity layer" skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` matches ≥1 and `rg -c "help-mode" skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` matches ≥1)
  (Implements: S2, S3, S11)
  Relevant files: skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md
- P6 — `skills/init-workspace/references/BOOTSTRAP_WRITE.md`: where the answers
  land — charter section + map rows in the guide, the catalogue doc, the
  charter's own verify step (validator: `rg -c "Project charter" skills/init-workspace/references/BOOTSTRAP_WRITE.md` matches ≥1)
  (Implements: S6, S9)
  Relevant files: skills/init-workspace/references/BOOTSTRAP_WRITE.md
- P7 — `skills/init-workspace/references/UPGRADE.md`: the additive charter offer
  for existing installs — blocks missing from the diff, never re-asking what the
  project answered (validator: `rg -c "Project charter" skills/init-workspace/references/UPGRADE.md` matches ≥1)
  (Implements: S6, S8)
  Relevant files: skills/init-workspace/references/UPGRADE.md
- P8 — `skills/audit-docs/SKILL.md`: charter-coverage check 16 — mandatory
  charter section present and non-placeholder, catalogue rows
  provenance-typed, per the CAPABILITIES pattern (validator: `rg -n "16\. \*\*Project charter" skills/audit-docs/SKILL.md` matches 1)
  (Implements: S7, S12)
  Relevant files: skills/audit-docs/SKILL.md
- P9 — Register the unit and ship the change's own docs state: roadmap `## Fixes`
  row, the changeset intent file (the repo's changeset CLI), rendered
  projections, `docs/LOGS.md` session entry (validator: `rg -n "#435" docs/ROADMAP.md` matches ≥1)
  (Implements: S1)
  Relevant files: docs/ROADMAP.md .changeset/ docs/LOGS.md
- P10 — Verification: run every obligation validator in the foreground, close the
  obligations ledger, run the deterministic gate (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12)

## Triaged steps

Derived by `bun scripts/unit-route.mjs --triage 435-project-charter` and pasted
verbatim; this block is authoritative for routing.

```text
TRIAGE — 435-project-charter (feature)
Steps: research, design, plan, implement, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: tests: tests n/a
Budget: strong
```

**Declared deviation.** The steps run under the owner's local workflow, not the
lane: research/design/plan are collapsed into the frozen ledgers above (the
owner's command substitutes for the lane's plan step); `implement` is P3–P8;
`evidence` + `docs` are P9; `review` does **not** run as a self-review — the
diff is handed to the owner as the external verifier (recorded as D1/D4 in
`decisions.md`); `release` is the changeset intent + gate run of P9/P10. The
tests step is skipped by the machine itself (`tests: tests n/a` — prose-only
unit).

## Next

Printed at hand-off per the lane's contract — the closing recommendation block
lives in the conversation and in `docs/LOGS.md`, never frozen here.

## References

- Issue [#435](https://github.com/gtrabanco/agentic-workflow/issues/435) + the owner's charter-extension comment (2026-11-06, `#issuecomment-6697247126`).
- Child issue [#436](https://github.com/gtrabanco/agentic-workflow/issues/436) (ceremony profile grammar) · soft dep [#366](https://github.com/gtrabanco/agentic-workflow/issues/366) (doc CLI) · adjacent rider #357 comment.
- Direction umbrella [#307](https://github.com/gtrabanco/agentic-workflow/issues/307) (row 83, design notes 1–14).
- arXiv [2602.11988](https://arxiv.org/abs/2602.11988) · [2601.20404](https://arxiv.org/abs/2601.20404) · [2605.10039](https://arxiv.org/abs/2605.10039) — verified 2026-11-07 (PE-004…PE-006).
- `docs/research/ATTRIBUTION.md` (the cite-sources clause's ledger) · `skills/unit-lane/references/DESIGN.md` (`ask-dont-infer`) · `docs/workflow/REPLICATE.md` (companion-surface comparison).

## Findings

OPEN rows only, appended by `review-change` and `triage-issue` — none at cut.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-07 · request (verbatim): "Apply to this repository: issue #435"
- **L2** — 2026-11-07 · evidence — issue #435 read in full (body + 2 comments, labels `promoted` `feature`, triage 2026-11-06); no unit dir existed; branch `feat/435-project-charter` at `e1d94057` (merge-base with `origin/main`), tree clean.
