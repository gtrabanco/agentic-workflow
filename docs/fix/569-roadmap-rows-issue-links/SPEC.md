---
type: fix
scope: xs
roadmap_summary: Issue [#569](https://github.com/gtrabanco/agentic-workflow/issues/569) (M, fix-now 2026-11-16): roadmap rows 556–558 never name their own issues (#563/#564/#565, open) — the owner's hand edit `87ce2bc8` added the `Issue [#NNN]` links and the projection regeneration `811ff65a` clobbered them by re-syncing the summary cells from the unit docs' `roadmap_summary:`, which lack the refs. Repair route is the unit docs (edit the unit doc, never the table): the three `roadmap_summary:` lines now open with their own issue link and the emitter reproduces it. Origin: product audit 2 F1. SPEC: [SPEC](fix/569-roadmap-rows-issue-links/SPEC.md)
---

# fix/569-roadmap-rows-issue-links

> Roadmap rows 556, 557 and 558 are the only feature rows whose summary cell
> names nothing but their *dependencies*: a reader (and every issue-keyed
> consumer — `audit-docs`, `workflow-status`, triage) cannot tell which forge
> issue each unit tracks, while sibling rows 553–555 each open with
> `Issue [#NNN](…)`. The refs existed once — the owner added them by hand in
> `87ce2bc8` — and the next projection regeneration (`811ff65a`) re-synced
> those cells from the unit docs' `roadmap_summary:`, which never carried them.
> The repair is therefore not the table (a re-edit is clobbered again): the
> three unit docs' `roadmap_summary:` gain their own issue link, and the emitter
> — which is the row's only writer — writes it.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#569` — roadmap rows 556–558 do not name their own issues; origin product
audit 2 finding F1 (`docs/audits/2-2026-11-16.md`). The PR closes it via
`Closes #569`.

## Specs

**S1 — the rows never name their own issues.**
> "Roadmap rows 556–558 (`docs/ROADMAP.md:173-175`) never name their own issues — they carry only dependency refs (`526 (soft)`, `563 (hard)`, `504 (soft)`), while sibling rows 553–555 each carry `Issue [#NNN](…)`."

**S2 — the consumer impact.**
> "Issues #563/#564/#565 are OPEN on the forge, so issue-keyed consumers (audit-docs, workflow-status, triage) cannot match the rows."

**S3 — the mechanism that reverted the hand edit.**
> "The owner's edit `87ce2bc8` added the `Issue [#563/#564/#565]` links; the next projection regeneration `811ff65a` ("docs(generated): doc site generated") rewrote the three summary cells from the unit docs' `roadmap_summary:` frontmatter (`docs/features/556-engineering-interview/SPEC.md:4` and the 557/558 siblings), which lack the issue refs"

**S4 — a table re-edit is the wrong repair.**
> "The emitter's own rule ("edit the unit doc, never the table") makes a table re-edit the wrong repair: it would be clobbered again by the next regeneration."

**S5 — the fix.**
> "Put the `Issue [#563/#564/#565]` refs into the three unit docs' `roadmap_summary:` frontmatter (features/556, 557, 558) and regenerate the projection — the rows then name their issues and survive future regenerations."

## Impact

- `docs/features/556-engineering-interview/SPEC.md`,
  `docs/features/557-verification-materialization/SPEC.md`,
  `docs/features/558-quality-sensor/SPEC.md` — one frontmatter line each
  (`roadmap_summary:`). No body change; the unit docs' own `## Log` `L1` lines
  already carry the same issue numbers, so the refs are a restatement of
  committed facts, not new claims (`PE-003`).
- `docs/ROADMAP.md` — three summary cells, written by the emitter, never by
  hand; plus this unit's `## Fixes` row through the crate's `fixrow` writer.
- Consumers that read the summary cell as the row's description:
  `packages/agentic-workflow/src/edit/Roadmap.mjs` (`findRow`'s `description`,
  `rowNumber`'s `issues/(\d+)` — `:210`, `:224`), `roadmap read --nn`,
  `roadmap-settle`, `batch-scheduler`, and the workflow sensor (`PE-008`).
- Nothing executable changes: frontmatter prose and a projected table
  (`PE-009`, `PE-010`).

## Retirements

none — strictly additive frontmatter plus its projection. No token, helper,
contract or carrier is superseded, and the three summary cells' current text is
carried forward verbatim after the new link.

## Non-goals

- No change to the emitter. `syncRoadmapDocument`'s override rule — a unit doc's
  `roadmap_summary:` owns the summary cell — is the documented contract
  (`PE-001`); the defect is the frontmatter's contents, not the rule. Changing
  the rule would be a different unit with its own decision.
- No hand edit of `docs/ROADMAP.md`: the three cells are written by the emitter
  and the fix row by the crate's writer, so this change never demonstrates the
  clobber it repairs.
- No renumbering, no status change and no dependency-cell change for rows
  556–558; their PR/issue state stays the forge's (S5 asks for the refs only).
- No change to `docs/features/553`–`555` (they have no unit folder; their cells
  are hand-owned and already correct — `PE-006`).

## Risk tier

Computed by the closed ceremony CLI over this change's own path set, copied
verbatim, never written from memory (`E3`):

- **Tier** — `passive` · **Task Size** — `understood: true`,
  `contained_risk: "contained"`, `resumable_from_diff: true`,
  `ceremony: "none"`, `verification: "readback"` · **signals** — `[]`
- **Reason** — `every changed path is documentation, an image or prose: no
  executable effect` (`reason_kind: no-executable-effect`).
- **Named high-risk item** — none — not a high-tier unit.

The `passive` contract's "no unit-doc ceremony" and the §5 unit-doc order
coexist the way fix #500, fix #527 and fix #560 resolved them: this prose change
keeps its readback in this doc's `## Log`, the ledgers §5 orders are cut here,
and no `docs/passive/` record is created beside it — one change, one carrier
(`D1`).

## Future

none

## Future cost

- Every unit doc whose `roadmap_summary:` is set owns that row's summary cell:
  a later hand edit of the table is reverted by the next render. The emitter is
  the row's writer (`PE-001`); a future change that wants the table editable
  again is a decision about the emitter's contract, not a repair.

## Applicable tests

`n/a — no tests step for this fix` — every changed path is documentation
(`PE-009`), so `bun scripts/test-impact.mjs --base main` answers `empty`
(`E5`) and no test is invented (repo rule: a prose-only change records the
verdict instead of the TDD ceremony). The frozen-failure corpus is instead the
§2 reproducer set below, run as commands and recorded as `E` lines.

## Known pre-existing issues

- The issue body and the audit row both write "(#563/#564/#565, both open)" —
  "both" for three items. A wording slip in the intake text, quoted verbatim in
  `L1` and left untouched: `does-not-affect` this unit (all three are indeed
  open, `PE-004`).
- Fix row 569's Notes cell still reads "SPEC: created by the fix lane" — no
  unit folder existed when triage registered it. `affects` this unit: P5
  rewrites that cell through the crate's writer so it names this SPEC.

## Acceptance criteria

- **AC-S1** — Rows 556, 557 and 558 each name their own forge issue in the
  summary cell. Check: `sed -n '/^| 55[678] |/p' docs/ROADMAP.md | rg -c
  'issues/56[345]'` matches `3`, and each row carries *its own* number
  (`556`→`563`, `557`→`564`, `558`→`565`).
- **AC-S2** — The issue-keyed read path resolves each row to its open forge
  issue. Check: `agentic-workflow roadmap read docs/ROADMAP.md --nn <NN>` prints
  a `description` that starts `Issue [#56N](`, for NN 556/557/558; `gh issue
  view 563/564/565 --json state` answers `OPEN` for all three.
- **AC-S3** — The refs survive regeneration: the emitter reproduces them instead
  of reverting them. Check: `bun scripts/docs-generate.mjs --check` exits 0 with
  `Roadmap: docs/ROADMAP.md — unchanged`, and a second `--root`-fixture render
  is byte-identical.
- **AC-S4** — The repair is not a table re-edit: the three cells' bytes come
  from the unit docs, and no other cell of the Features table moves. Check:
  `git diff main -- docs/ROADMAP.md | rg -c '^[-+][^-+]'` matches `8` (three
  summary cells + this unit's fix row), and the three `roadmap_summary:` lines
  are the only changed lines in the unit docs' frontmatter.
- **AC-S5** — The three `roadmap_summary:` frontmatter lines open with their own
  issue link. Check: `rg -c '^roadmap_summary: Issue \[#56[345]\]'
  docs/features/55[678]-*/SPEC.md` matches `3`.

## Tasks

- P1 — Cut this unit doc with the frozen planning ledgers, the acceptance
  criteria and the obligations (§5's substitute for the lane's plan step).
  (Implements: S1, S5)
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/569-roadmap-rows-issue-links/SPEC.md` exits 0)
  - Relevant files: docs/fix/569-roadmap-rows-issue-links/SPEC.md
- P2 — Record the frozen-failure corpus RED at base before any edit: the three
  cells are nameless while the emitter reports the tree in sync (§2).
  (Implements: S1, S2, S3)
  (validator: `rg -c 'issues/563|issues/564|issues/565' docs/ROADMAP.md` exits 1 — 0 matches at base)
  - Relevant files: docs/ROADMAP.md
- P3 — Add each unit's own issue link to the three `roadmap_summary:` lines, in
  the 553–555 sibling form.
  (Implements: S5)
  (validator: `rg -c '^roadmap_summary: Issue \[#56[345]\]' docs/features/55[678]-*/SPEC.md` matches 3)
  - Relevant files: docs/features/556-engineering-interview/SPEC.md, docs/features/557-verification-materialization/SPEC.md, docs/features/558-quality-sensor/SPEC.md
- P4 — Regenerate the projection through the emitter so the three summary cells
  carry the refs, and re-check it is a fixed point.
  (Implements: S3, S4, S5)
  (validator: `bun scripts/docs-generate.mjs --check` exits 0 with `Roadmap: docs/ROADMAP.md — unchanged`)
  - Relevant files: docs/ROADMAP.md, docs/generated/
- P5 — Index rows and the session door: this unit's `## Fixes` row through the
  crate's `fixrow` writer (status `in-progress`, Notes naming this SPEC, the
  frontmatter as its single source), and the `docs/LOGS.md` entry.
  (Implements: S1)
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap read docs/ROADMAP.md --nn 569 --json | rg -c '"status": "in-progress"'` matches 1)
  - Relevant files: docs/ROADMAP.md, docs/LOGS.md
- P6 — Verification: every obligation's validator in the foreground, the
  readers, the affected suites and the offline gate.
  (Implements: S1, S2, S3, S4, S5)
  (validator: `bun scripts/roadmap-settle.mjs` exits 0 with `0 violations`)
  - Relevant files: docs/ROADMAP.md, docs/fix/569-roadmap-rows-issue-links/SPEC.md

### Planning evidence

One row per Engineering claim the change rests on. Embedded here: XS unit
(shape owned by `skills/pre-execution-review/references/LEDGERS.md`).

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | committed-source | The emitter owns a row's summary cell whenever the unit doc sets `roadmap_summary:` — `syncTable` returns the hand row untouched unless that field is non-empty, and otherwise writes `cells[columns - 1] = mdCell(unit.roadmapSummary)`. That is why a hand edit of the table is reverted and why the frontmatter is the repair surface | `scripts/docs-generate.mjs:480-481`, header comment `:377-390` | read 2026-11-16 at `f49998f5` | S3, S4, S5; O1, O2, O5 |
| PE-002 | committed-source | A row with no `roadmap_summary:` (or no unit folder at all) passes through byte for byte, so rows 553–555's hand-owned cells are unaffected by this change | `scripts/docs-generate.mjs:480`; `scripts/docs-generate.test.mjs:495` ("roadmap_summary: overrides the summary cell; hand rows without a folder never move") | read 2026-11-16 at `f49998f5` | S4; O5 |
| PE-003 | committed-source | The issue each unit tracks is already recorded in that unit doc: `L1 — … the request (GitHub issue #563)` for 556, `#564` for 557, `#565` for 558. The refs S5 adds restate committed facts | `docs/features/556-engineering-interview/SPEC.md:128`; `docs/features/557-verification-materialization/SPEC.md:128`; `docs/features/558-quality-sensor/SPEC.md:137` | read 2026-11-16 at `f49998f5` | S1, S5; O1, O4 |
| PE-004 | measured-probe | #563, #564 and #565 are all `OPEN` on the forge, so the mapping is live and a closed issue cannot explain the missing links | `gh issue view 563/564/565 --json number,state,title` (`2026-11-16`), titles matching the three unit slugs | run 2026-11-16 | S2; O4 |
| PE-005 | committed-source | The defect and its repair route originate in product audit 2 F1, which records the clobbering commits and the "repair route verified at triage: the fix edits the unit docs' roadmap_summary, never the table" ruling | `docs/audits/2-2026-11-16.md` F1 and its `↳ triaged 2026-11-16` line | read 2026-11-16 at `f49998f5` | S1–S5; O1–O7 |
| PE-006 | committed-source | Rows 553–555 are the form to match (`Issue [#553](…) (M): …`) and have no unit folder (`ls docs/features` holds no `553-`/`554-`/`555-` directory), so their cells are hand-owned and correct — the change must not touch them | `docs/ROADMAP.md:169-171`; `ls docs/features \| rg '^55[345]-'` → no output | read 2026-11-16 at `f49998f5` | S1; O5 |
| PE-007 | measured-probe | At base the emitter reports the tree in sync (`verdict: PASS`, `Roadmap: docs/ROADMAP.md — unchanged`), so the nameless cells are exactly what the current frontmatter produces — the frontmatter, not a stale render, is the defect | `bun scripts/docs-generate.mjs --check` at `f49998f5` (`E1`) | run 2026-11-16 | S3, S5; O3, O2 |
| PE-008 | committed-source | The issue-keyed read path parses the summary cell as `description` and recovers the number from `issues/(\d+)` or `#(\d+)`, so the missing link is what breaks the match | `packages/agentic-workflow/src/edit/Roadmap.mjs:196-231` (`findRow`, `rowNumber`); `packages/agentic-workflow/src/runner/sensors/workflow-status.mjs:446-454` | read 2026-11-16 at `f49998f5` | S2; O4 |
| PE-009 | measured-probe | The change is documentation-only: the risk classifier answers `passive` / `no-executable-effect` over the planned path set, so no executable behaviour is at stake and the ceremony is the readback | `agentic-workflow ceremony tier classify --paths …` (`E3`) | run 2026-11-16 | S1–S5; O6 |
| PE-010 | measured-probe | The test-impact set for the change is empty, so the red-first ceremony does not apply and no test is invented; the §2 reproducer commands are the corpus | `bun scripts/test-impact.mjs --base main` (`E5`) | run 2026-11-16 | S1–S5; O3, O6 |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state (9-column shape owned by
`skills/pre-execution-review/references/LEDGERS.md`).

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S5 | Each of the three unit docs' `roadmap_summary:` opens with its own issue link, in the 553–555 sibling form (`Issue [#NNN](url) (M): <the existing summary, verbatim>`) | P3 | P3 | direct application (this session) | `rg -c '^roadmap_summary: Issue \[#56[345]\]' docs/features/55[678]-*/SPEC.md` matches 3 | `E` line in this doc's `## Log` naming the command and the count | planned |
| O2 | S1, S3, S5 | The three summary cells carry the refs after a render, and a second render is a fixed point — the refs cannot be reverted the way `811ff65a` reverted them | P4 | P4 | direct application (this session) | `bun scripts/docs-generate.mjs --check` exits 0 with `Roadmap: docs/ROADMAP.md — unchanged`, and `sed -n '/^\| 55[678] \|/p' docs/ROADMAP.md \| rg -c 'issues/56[345]'` matches 3 | `E` lines naming the render, the `--check` verdict and the count | planned |
| O3 | S1, S2, S3 | The frozen failure, reproduced at base before any edit: the three cells name no issue while the emitter reports the tree in sync — the RED corpus this change closes | P2 | P2 | direct application (this session) | `rg -c 'issues/563\|issues/564\|issues/565' docs/ROADMAP.md` exits 1 — 0 matches at base `f49998f5`; the same command at the change matches 3 | `E` lines naming the base run (0) and the change run (3) | planned |
| O4 | S2 | Issue-keyed consumers match a row to its open forge issue: `findRow`'s `description` for NN 556/557/558 opens with `Issue [#56N](`, the number `rowNumber` recovers is the forge issue, and that issue is `OPEN` | P4 | P4 | direct application (this session) | `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap read docs/ROADMAP.md --nn 556 --json` matches `"description": "Issue [#563](` | `E` line quoting the three `description` values and the three forge states | planned |
| O5 | S4 | Compatibility invariant: no other cell of the Features table moves, rows 553–555 stay byte-identical, and no table byte is hand-written — the diff's only `docs/ROADMAP.md` content lines are the three summary cells plus this unit's fix row | P4 | P4 | direct application (this session) | `git diff main -- docs/ROADMAP.md \| rg -c '^[-+][^-+]'` matches 8; `git diff main -- docs/ROADMAP.md \| rg -c '^[-+]\| 55[345] \|'` exits 1 | `E` line naming both diffs | planned |
| O6 | S1–S5 | No previous behaviour regresses on the surfaces this change reads or writes: the emitter, roadmap and unit-doc suites stay green, and the readers report clean | P6 | P6 | direct application (this session) | `bun test scripts/docs-generate.test.mjs scripts/roadmap-settle.test.mjs scripts/index-document.test.mjs scripts/unit-doc-contract.test.mjs` exits 0 | `E` line naming the suite totals | planned |
| O7 | S1 | This unit's `## Fixes` row is written by the crate's writer (status `in-progress`, Notes naming this SPEC) and the unit doc's `roadmap_summary:` is that Notes cell's single source, so the next render cannot revert it | P5 | P5 | direct application (this session) | `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap read docs/ROADMAP.md --nn 569 --json` matches `"status": "in-progress"` | `E` line quoting the read receipt, its `description`, and the following `--check` verdict | planned |

## Triaged steps

n/a — no `unit-route --triage` block is pasted: this unit is applied through the
owner's local workflow, which substitutes the frozen planning ledgers above for
the lane's plan step and never runs the lane machinery on the repository's own
surgery. Recorded consequence, not a hidden gap: audit scripts that require a
pasted block report it as blocked on lane-era units, and the lane is not run in
this flow.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-16, the issue, verbatim (body as written on the forge):
  ```
  Origin: product audit 2, finding F1
  (docs/audits/2-2026-11-16.md)

  Checked: `rg "#56[45]" docs/ROADMAP.md` → 0 matches at HEAD `811ff65a`; `git log -S 'Issue [#563]' -- docs/ROADMAP.md` → added by 87ce2bc8, removed by 811ff65a; unit docs' `roadmap_summary:` lines read; `gh issue list` 2026-11-16 confirms #563/#564/#565 OPEN.

  ## Evidence

  - Roadmap rows 556–558 (`docs/ROADMAP.md:173-175`) never name their own issues — they carry only dependency refs (`526 (soft)`, `563 (hard)`, `504 (soft)`), while sibling rows 553–555 each carry `Issue [#NNN](…)`. Issues #563/#564/#565 are OPEN on the forge, so issue-keyed consumers (audit-docs, workflow-status, triage) cannot match the rows.
  - The owner's edit `87ce2bc8` added the `Issue [#563/#564/#565]` links; the next projection regeneration `811ff65a` ("docs(generated): doc site generated") rewrote the three summary cells from the unit docs' `roadmap_summary:` frontmatter (`docs/features/556-engineering-interview/SPEC.md:4` and the 557/558 siblings), which lack the issue refs — silently reverting the hand edit.
  - The emitter's own rule ("edit the unit doc, never the table") makes a table re-edit the wrong repair: it would be clobbered again by the next regeneration.

  ## Fix

  Put the `Issue [#563/#564/#565]` refs into the three unit docs' `roadmap_summary:` frontmatter (features/556, 557, 558) and regenerate the projection — the rows then name their issues and survive future regenerations.
  ```
- **E1** — 2026-11-16, the §0/§2 base state: `git rev-list --count main..HEAD` →
  `0`; `rg -c 'issues/563|issues/564|issues/565' docs/ROADMAP.md` · exit 1 ·
  0 matches; `rg -c 'Issue \[#56[345]\]' docs/ROADMAP.md` · exit 1 · 0 matches;
  `bun scripts/docs-generate.mjs --check` · exit 0 · `Files: 3 checked · 0
  missing · 0 stale · 0 orphaned` / `Roadmap: docs/ROADMAP.md — unchanged` /
  `verdict: PASS` — the nameless cells are exactly what the frontmatter
  produces.
- **E2** — 2026-11-16, the forge mapping: `gh issue view 556/557/558` → `MERGED`
  (merge commits, not the feature units' issues); `gh issue view 563` → `OPEN —
  NEW FEATURE: init-workspace engineering interview …`; `564` → `OPEN — …
  verification materialization …`; `565` → `OPEN — … quality sensor …`; each
  unit doc's `L1` names its own number (`556`→`563`, `557`→`564`, `558`→`565`).
- **E3** — 2026-11-16, the risk verdict, copied into `## Risk tier`:
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify
  --paths "docs/features/556-engineering-interview/SPEC.md,docs/features/557-verification-materialization/SPEC.md,docs/features/558-quality-sensor/SPEC.md,docs/ROADMAP.md,docs/LOGS.md,docs/fix/569-roadmap-rows-issue-links/SPEC.md"`
  · exit 0 · `tier: passive`, `reason_kind: no-executable-effect`,
  `signals: []`, `task_size: {understood: true, contained_risk: contained,
  resumable_from_diff: true, ceremony: none, verification: readback}`.
- **E4** — 2026-11-16, the §3 fixture, before any live write: a `mktemp -d`
  root with `AGENTS.md`'s `Docs site` block, a `docs/ROADMAP.md` carrying rows
  553/556/557 and two unit docs whose `roadmap_summary:` lacked the ref —
  `bun scripts/docs-generate.mjs --root <fixture>` rewrote both cells to the
  bare frontmatter (the `811ff65a` clobber, reproduced); with the ref added to
  the frontmatter the same run wrote `Issue [#563](…) (M): …` into row 556 and
  `Issue [#564](…) (M): …` into row 557, `--check` then answered `Roadmap:
  docs/ROADMAP.md — unchanged`, a second generate was byte-identical (`diff` →
  no output), and row 553 (no folder) stayed verbatim;
  `agentic-workflow roadmap read <fixture>/docs/ROADMAP.md --nn 556 --json`
  printed `description: "Issue [#563](…) (M): …"`. Scratch removed
  (`rm -rf /tmp/fx569.*`).
- **E5** — 2026-11-16, the test-impact verdict for `## Applicable tests`:
  `bun scripts/test-impact.mjs --base main` before the first edit · `TEST
  IMPACT — error` / `no path in scope` (a clean tree answers nothing to
  measure); re-run at the completed change, recorded in `E12`.
- **E6** — 2026-11-16, environment receipt: the worktree carried no
  `node_modules` and the CLI refused with `Cannot find package
  'mdast-util-from-markdown'` — `bun install --frozen-lockfile` → `164 packages
  installed [3.29s]`, after which every reader answered.

## Next

P2 — record the frozen-failure corpus RED, then P3's three frontmatter lines,
P4's render, P5's index + journal writes and P6's verification sweep.

## References

- Issue [#569](https://github.com/gtrabanco/agentic-workflow/issues/569) —
  closed by this PR via `Closes #569`.
- [Product audit 2](../../audits/2-2026-11-16.md) — finding F1 and its triage
  line.
- [Features 556](../features/556-engineering-interview/SPEC.md),
  [557](../features/557-verification-materialization/SPEC.md),
  [558](../features/558-quality-sensor/SPEC.md) — the three unit docs whose
  `roadmap_summary:` carries the repair.
- Issues [#563](https://github.com/gtrabanco/agentic-workflow/issues/563),
  [#564](https://github.com/gtrabanco/agentic-workflow/issues/564),
  [#565](https://github.com/gtrabanco/agentic-workflow/issues/565) — the three
  forge issues the rows now name.
- Roadmap rows 556–558; this unit's `## Fixes` row.
- Emitter contract: `scripts/docs-generate.mjs` §"roadmap table sync (fix
  #507)".

## Branch

`fix/569-roadmap-rows-issue-links`

## Depends on

`n/a` — independent; the three features' own dependencies are untouched.

## Regression scope

| Scenario | Verified by |
|---|---|
| Every other roadmap cell and every other row keeps its bytes | `git diff main -- docs/ROADMAP.md \| rg -c '^[-+][^-+]'` matches 8 and no `55[345]` line appears (O5) |
| Rows 553–555, whose cells are hand-owned (no unit folder), are unchanged | the same diff (O5) plus `E4`'s fixture row 553 passing through verbatim |
| A row's summary cell is still emitted from the unit doc, not hand-written | `bun scripts/docs-generate.mjs --check` exits 0 (O2) — a hand edit would come back as the frontmatter's text |
| The generated site projection is untouched by this change | `bun scripts/docs-generate.mjs --check` reports `0 stale · 0 orphaned` (O2) |
| The three unit docs' bodies are unchanged | `git diff main -- docs/features/556-engineering-interview/SPEC.md` shows one changed line (the `roadmap_summary:` line) — part of O1's evidence |
