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
- **`pi-compat-guard` is red on `main` — does-not-affect** this unit. Evidence:
  the guard's temp install cannot resolve `@gtrabanco/agentic-workflow/src/log/{render,publish}.mjs` and `…/journal/fragment.mjs` from `packages/pi-agentic-workflow/src/auto-log-session.ts` (TS2307 ×4), and the byte-identical failure was reproduced on a copy of the base commit (`e1d94057`); the files are the in-flight journal units' surface (roadmap rows 114/115), touched by no commit here.
- **The crate suites' S15 probe is red on `main` — does-not-affect** this unit.
  Evidence: `packages/agentic-workflow/test/journal.surfaces.test.mjs:118` fails on the committed fragment `.agentic-workflow/journal/20261107T001707Z-direction-review-odd-hybrid-design-notes-manual.md` — its name carries the kind token `manual`, outside `journal-fragment-grammar@1`'s closed set (`mechanical | narrative`), so `parseFragmentName` returns null; the fragment landed on `main` at `9b27fab9` and the identical failure reproduces on the base copy. The fragment belongs to the journal units' carrier; renaming it here would be another unit's surgery, not this one's.
- **`scripts/audit-pr-receipt.test.mjs`'s gh-subprocess tests flake intermittently — does-not-affect** this unit. Evidence: at the base copy three consecutive runs reported `fail 1`; at head one pooled-gate run failed 6 cases and an isolated rerun plus four further runs reported `fail 0` (28 pass) — the tests shell out to real `git`/`gh` and their outcome depends on environment state, never on this change's files (none of its fixtures touch `skills/`, `template/` or `docs/fix/435-*`).

## Tasks

- [x] P1 — Cut the unit doc + planning ledgers (this freeze): `SPEC.md`,
  `planning-evidence.md`, `planning-obligations.md`, `decisions.md`; paste the
  machine's triaged steps (validator: `bun scripts/phase-lint.mjs docs/fix/435-project-charter/SPEC.md` prints `verdict PASS`)
  (Implements: S1)
  Relevant files: docs/fix/435-project-charter/
- [x] P2 — Record the adopted-knowledge attribution row (cite-sources clause) in
  `docs/research/ATTRIBUTION.md` (validator: `rg -c "#435" docs/research/ATTRIBUTION.md` matches 3)
  (Implements: S4)
  Relevant files: docs/research/ATTRIBUTION.md
- [x] P3 — Ship the charter substrate in the template: `## Project charter` skeleton
  (identity slots + domain slots + dated-assumption record + content rule) and
  the two documentation-map rows in `template/AGENTS.md`; the criteria-catalogue
  template `template/docs/workflow/VERIFICATION_CRITERIA.md` with the closed
  provenance set (validator: `rg -c "## Project charter" template/AGENTS.md` matches 1 and `test -f template/docs/workflow/VERIFICATION_CRITERIA.md` exits 0)
  (Implements: S4, S6, S9, S10)
  Relevant files: template/AGENTS.md template/docs/workflow/VERIFICATION_CRITERIA.md
- [x] P4 — `skills/init-workspace/SKILL.md`: the charter step before any substrate
  action — identity layer asked and blocking, domain layer open-with-defaults,
  halt through the existing fail-closed dispatcher, answers land per the map
  (validator: `rg -c "Project charter" skills/init-workspace/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs` prints `PASS context budgets`)
  (Implements: S2, S3, S5, S6, S8)
  Relevant files: skills/init-workspace/SKILL.md
- [x] P5 — `skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md`: the charter
  interview round — identity questions blocking, domain questions as dated
  assumptions, non-technical help-mode (validator: `rg -c "identity layer" skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` matches ≥1 and `rg -c "help-mode" skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` matches ≥1)
  (Implements: S2, S3, S11)
  Relevant files: skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md
- [x] P6 — `skills/init-workspace/references/BOOTSTRAP_WRITE.md`: where the answers
  land — charter section + map rows in the guide, the catalogue doc, the
  charter's own verify step (validator: `rg -c "Project charter" skills/init-workspace/references/BOOTSTRAP_WRITE.md` matches ≥1)
  (Implements: S6, S9)
  Relevant files: skills/init-workspace/references/BOOTSTRAP_WRITE.md
- [x] P7 — `skills/init-workspace/references/UPGRADE.md`: the additive charter offer
  for existing installs — blocks missing from the diff, never re-asking what the
  project answered (validator: `rg -c "Project charter" skills/init-workspace/references/UPGRADE.md` matches ≥1)
  (Implements: S6, S8)
  Relevant files: skills/init-workspace/references/UPGRADE.md
- [x] P8 — `skills/audit-docs/SKILL.md`: charter-coverage check 16 — mandatory
  charter section present and non-placeholder, catalogue rows
  provenance-typed, per the CAPABILITIES pattern (validator: `rg -n "16\. \*\*Project-charter coverage" skills/audit-docs/SKILL.md` matches 1)
  (Implements: S7, S12)
  Relevant files: skills/audit-docs/SKILL.md
- [x] P9 — Register the unit and ship the change's own docs state: roadmap `## Fixes`
  row, the changeset intent file (the repo's changeset CLI), rendered
  projections, `docs/LOGS.md` session entry (validator: `rg -n "#435" docs/ROADMAP.md` matches ≥1)
  (Implements: S1)
  Relevant files: docs/ROADMAP.md .changeset/ docs/LOGS.md
- [x] P10 — Verification: run every obligation validator in the foreground, close the
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
- **L3** — 2026-11-07 · evidence — the three arXiv citations verified against arxiv.org (2602.11988 title + the 20% developer-written-context reasoning-token figure in its HTML body; 2601.20404 and 2605.10039 titles/subjects confirmed) before they anchor the content rule (PE-004…PE-006).
- **D1** — 2026-11-07 · owner-instruction application — the passive-tier verdict's default carrier (`docs/passive/<id>.md`, no unit doc) is replaced by the unit-doc + ledgers carrier the owner's standing local workflow orders; no `ceremony passive add` record is written for the same scope (never both). Rationale in `decisions.md` D1.
- **D2** — 2026-11-07 · decision — this repository's own `AGENTS.md` is not re-cut into a charter; the unit ships the capability (decisions.md D2).
- **D3** — 2026-11-07 · decision — the verification-criteria catalogue is its own registered doc (`template/docs/workflow/VERIFICATION_CRITERIA.md` + map row), not a charter paragraph — content rule (arXiv 2605.10039) and one mechanical audit target (decisions.md D3).
- **D4** — 2026-11-07 · decision — home `docs/fix/435-project-charter/` despite the `feature` label: the workflow's explicit home + ~12 `docs/fix/<issue>-<topic>/` precedents resolve the sub-decision (decisions.md D4).
- **E3** — 2026-11-07 · evidence — `bun scripts/test-impact.mjs --base e1d94057` at P1 head → `TEST IMPACT — empty / verdict: empty / executable: 0` (prose-only; no TDD ceremony invented).
- **P1** — 2026-11-07 · phase — P1 done: unit doc + three ledgers cut; `bun scripts/phase-lint.mjs docs/fix/435-project-charter/SPEC.md` → `verdict PASS` (10/10 phases after the box-4/box-5 rewords); triage block pasted. Commit `6329f417`.
- **P2** — 2026-11-07 · phase — P2 done: three idea-adapted rows landing at #435 in `docs/research/ATTRIBUTION.md`; `rg -c "#435" docs/research/ATTRIBUTION.md` → 3. Commit `c3d8ffef`.
- **P3** — 2026-11-07 · phase — P3 done: `## Project charter` + two docs-map rows in `template/AGENTS.md`; `template/docs/workflow/VERIFICATION_CRITERIA.md` with the provenance closed set. Validated on a throwaway checklist before landing (counts O2/O3/O6/O9/O10 measured: 2/1/1+1/3·5·3/2, `assumed` → 0). Commit `bae6fd5a`.
- **P4** — 2026-11-07 · phase — P4 done: `init-workspace/SKILL.md` charter step (turn-contract box, route bullet, §Charter); measured 4358 est / 297 lines over the 4066/281 ceilings → re-based to ceil(4358×1.10)=4794 / ceil(297×1.10)=327 in `SKILL_CONTEXT_BUDGETS.json`, growth source named (issue #435). Commit `74f8cfe7`.
- **P5** — 2026-11-07 · phase — interview round in `BOOTSTRAP_DISCOVERY.md`: charter block first, identity questions blocking, domain as dated assumptions, help-mode (same commit as P4).
- **P6** — 2026-11-07 · phase — landing in `BOOTSTRAP_WRITE.md` step 4: charter answers to the guide's section + map rows + catalogue with provenance (same commit as P4).
- **P7** — 2026-11-07 · phase — additive charter offer in `UPGRADE.md` step 2's diff list, never re-asking answered identity (same commit as P4).
- **P10** — 2026-11-07 · phase — verification pass complete: all fourteen obligation validators run in the foreground, the ledger closed `verified` ×14, the differential run recorded (E6), the gate runs recorded (G1–G3). Commit `5cec89c7`.
- **P8** — 2026-11-07 · phase — `audit-docs` check 16 + description trigger + report template 15→16; inventory fixture validated on throwaway copies (`mktemp -d`): fail-shapes detected (missing section, unfilled slot, raw catalogue cells), pass-shapes clean. Ceiling 3116 est over the 2800 flat default → re-based ceil(3116×1.10)=3428, growth source named. Commit `d5e443b5`.
- **E4** — 2026-11-07 · evidence — **live-tree side effect, disclosed and cleaned:** a transient `/tmp` full made `mktemp` fail and the first fixture script `cd`'d into the repo root — the repo's own `AGENTS.md` was overwritten (+4/−455) and a stray `VERIFICATION_CRITERIA.md` appeared at root; both restored/removed immediately (§4 rule: disclosed, cleaned, never hidden). Root cause fixed: the rerun fails fast before `cd`, and the fixture output below is from the guarded run.
- **P9** — 2026-11-07 · phase — registered: roadmap `## Fixes` row #435 (in-progress), changeset `feat-435-project-charter-…` (minor, lint ok), `docs-generate` write regenerated `docs/generated/units.md` (`--check` read DRIFT first — one stale file — then rewritten by the renderer, never by hand, and now `verdict: PASS`). Commit `78a1942f`.
- **D5** — 2026-11-07 · owner-directed exception — `review-loop-discipline.test.mjs` IS-2 pin updated 15→16 in the same change (audit-docs owns the count; the same move feature 32 P3 made 13→14). The test-impact verdict changes accordingly: `empty` → 2 executable paths / 3 suites (`check-skill-context`, `guide-split`, `promise-coherence`), all run green under `node --test` (1/14/37 pass). Commit `508736b8`.
- **E5** — 2026-11-07 · evidence — obligation validators run in the foreground (§Verification block): O1 `rg -ci "identity layer"` → 3/1, blocking wording present; O2 `rg -c "dated assumption"` → 1/2; O3 → 1/1; O4 → 3; O5 `rg -c "open-questions@1"` → 4, `git diff e1d94057 --name-only -- scripts/` → only `review-loop-discipline.test.mjs`, `-- scripts/needs-input.mjs` → empty; O6 → 1/1; O7 → 1 hit at `skills/audit-docs/SKILL.md:142`; O8 consent-deletion lines → 0 (rg exit 1, zero matches); O9 file exists, 3/5/3; O10 `stamped assumption (dated)` → 2, `assumed` → no output; O11 help-mode 1 / recommended option 2 / "Decide for me" 2 / "Explain the options" 2; O12 → 2; O13 roadmap hit 1, changeset file present, `--check` PASS, fragment written and parses.
- **E6** — 2026-11-07 · evidence — §6 differential: `skill-lint` byte-identical verdicts at base and head (0 findings / PASS); `check-skill-context` differs only in the two changed skills' counts (init-workspace 3987→4358, audit-docs 2730→3116 — the asked-for deltas); `needs-input.mjs` output identical on the same input (script untouched).
- **G1** — 2026-11-07 · gate — `bun scripts/local-gate.mjs` (default): FAILED at `pi-compat-guard` — TS2307 ×4 resolving `@gtrabanco/agentic-workflow/src/log/*` from `packages/pi-agentic-workflow/src/auto-log-session.ts` — reproduced byte-identical on a base-commit copy (pre-existing, rows 114/115's surface).
- **G2** — 2026-11-07 · gate — `bun scripts/local-gate.mjs --no-bail --skip-network`: every step green except `crate-suite-node`/`crate-suite-bun` (exit 1 each) — the journals S15 probe failing on the malformed fragment `.agentic-workflow/journal/20261107T001707Z-direction-review-odd-hybrid-design-notes-manual.md` (kind token `manual`, outside `journal-fragment-grammar@1`; committed on `main` at `9b27fab9`; identical fail on the base copy). `root-suite` exit 0 after the IS-2 pin update. Per-step: docs-generated-projection 0 · version-parity-content 0 · schema-build 0 · pi-node-compat 0 · schema-node-compat 0 in isolation (one pooled dispatch observed a transient red, green on three isolated re-runs — infra contention, recorded, not this unit's surface).
- **G3** — 2026-11-07 · gate — `bun scripts/local-gate.mjs --only dependency-pin-gate,dependency-advisories` → PASS (advisory rows pre-existing, report-only).
- **G4** — 2026-11-07 · gate — final full offline run over the finished tree (`bun scripts/local-gate.mjs --no-bail --skip-network`): docs-generated-projection 0 · version-parity-content 0 · schema-build 0 · pi-node-compat 0 · root-suite 1 / crate-suite-node 1 / crate-suite-bun 1. The root-suite red is `audit-pr-receipt.test.mjs`'s gh-subprocess flake (isolated rerun at head: 29 pass / 0 fail, then four runs × 0 fail; at the base copy three runs × 1 fail — pre-existing flake, recorded in Known pre-existing issues); the two crate reds are the recorded journals S15 probe. Nothing naming this unit's files failed.
- **E7** — 2026-11-07 · evidence — final state of the impacted deterministic checks after the last commits: `guide-split` 14/0 · `check-skill-context` 1/0 · `promise-coherence` 37/0 · `review-loop-discipline` 1/0 · `check-skill-context.mjs` → `PASS context budgets: 28 skills` · `skill-lint` → PASS · `docs-generate --check` → PASS · `phase-lint` on the unit doc → PASS · ceremony docs checks (tasks-ticks, progress-entry, phase-labels) → all `valid: true`.
