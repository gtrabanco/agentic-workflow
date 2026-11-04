---
type: feature
scope: medium
---

# 396 — doc-gen

> One-line: a unit that ships code cannot close without an explicit documentation task, and one deterministic command renders the repository's own artifacts — unit docs, roadmap rows and the shipped code — into the project's declared output format.

## Specs

The request is issue [#396](https://github.com/gtrabanco/agentic-workflow/issues/396); every
`S#` below quotes its words verbatim, and each quote is copied from the issue's
`In scope` / `Acceptance criteria` list without rewording.

**S1 — Documenting what the unit shipped is a required, explicit task of the docs step.**
> A rule that makes **"document what this unit shipped"** a required, non-skippable task of a unit's docs step, named as an explicit task rather than implied.

> Closing a unit with a docs step requires an explicit task naming **what was documented and in which declared format**; a unit that ships code cannot close with no documentation task.

**S2 — One deterministic command renders the repository's own artifacts into the declared format.**
> An **automation** (script/CLI, deterministic) that renders the repository's own artifacts — unit docs, roadmap rows, and the shipped code — into the project's **declared output format**.

> One command regenerates the declared-format docs from repository artifacts (unit docs + roadmap + code), with no hand-duplicated content.

**S3 — The format is discovered from what the project declared at initialization.**
> Format discovery from what the project already declares at initialization (the scaffold's `Docs site` block: `format: starlight | docusaurus | markdown`, `content-dir`, `build`, `map`) — the format chosen at init drives the generated output; `md`, `mdx`, `html` and `latex` are the initial targets.

**S4 — No declared format falls back to markdown with a reported degradation.**
> No declared format → deterministic fallback to `markdown` with a reported degradation, never a silent failure.

**S5 — Both halves are covered: the code and the delivered features.**
> Coverage of **both** halves the request names: the **code** that was written and the **features** that were delivered (what shipped, where, how to use it).

**S6 — Runs are byte-identical and drift is detectable by a command the gate calls.**
> A stale-output signal: regenerating without changes is byte-identical, and a generated doc that no longer matches its sources is detectable.

> Two consecutive runs are byte-identical (determinism proven by a test), and drift between sources and generated output is detectable by a command the gate can call.

**S7 — Superseded documentation is deleted and the generator never emits a retired surface.**
> Removal of **obsolete documentation** in the change that supersedes it, so the generated tree cannot accumulate retired surfaces.

> Superseded documentation is deleted in the change that supersedes it, and the generator never emits a retired surface.

**S8 — `init-workspace` carries the format choice, additively and with consent.**
> `init-workspace` carries the choice: a project initialized with a format gets that format's output; an existing project is offered it additively and with consent.

## Impact

- **Consumes:** the guide's `## Docs site` block (`template/AGENTS.md:48-61` — `format`, `content-dir`, `build`, `map`), the crate's index readers (`readRoadmapIndex`, `readFixIndexTable`, `packages/agentic-workflow/src/index-document.mjs`), the unit-doc grammar reader (`scripts/unit-doc-phases.mjs`), the package manifests (`packages/*/package.json`), the skill frontmatter (`skills/*/SKILL.md`), and the lane's docs step (`skills/unit-lane/references/DOCS.md`).
- **Consumed by:** the root gate — `scripts/docs-generate.test.mjs` includes a live-tree `--check`, so a source that moves without regenerating reddens the suite (the same shape `scripts/roadmap-settle.test.mjs` uses); the docs step, which names the command; `init-workspace`, which writes the block.
- **Stops being true:** the lane's docs checklist item "All docs the unit demands are updated" — it names no format and no evidence, and S1 replaces it with a named task; the claim that nothing renders delivered code/features into the declared format.
- **Asks before touching something live:** nothing outside this repository's own surfaces. The generated tree is a new projection, never an authored surface (feature 65: Markdown is the source of truth); no published package, no `dist/`, no CI workflow changes.

## Retirements

One surface is superseded in this change, with its negative-capability pin:

| Retired surface | Replacement | Pin |
|---|---|---|
| the docs-step checklist item `All docs the unit demands are updated` — it names neither the artifact nor the declared format, so "all docs" was unenforceable | the required documentation task (what was documented + the declared format) and its `docs-generate --check` receipt | `rg -c "All docs the unit demands are updated" skills/unit-lane/references/DOCS.md` → no match (exit 1) |

Nothing else can be removed: the generator is new, and the six `S#` behaviours it
delivers had no prior carrier to retire (the `generate-docs` skill was retired
before this unit — `42d66a42` — and S2's shape is cut from today's substrate, not
revived from it).

## Non-goals

- **Replacing Markdown as the source of truth.** Feature 65 fixed that: Markdown
  stays the single source, and the generated formats are projections, never
  authored surfaces. No generated file is hand-edited; the generator owns it.
- **The README-currency repair and the documentation-currency rule.** That is the
  companion unit `103-doc-currency` (merged, PR #397); this unit builds the
  automation on top of it.
- **Reviving the retired `generate-docs` skill** (`42d66a42`), or adding a menu
  entry: the command is a script the gate and the docs step call, not a skill.
- **Language-aware code docs** (TypeDoc/JSDoc symbol extraction). The code page
  reports the surface that is already machine-readable — package names, versions,
  bin entries, skills and scripts — and stops there; a symbol-level extractor is a
  separate unit.
- **A site build.** `init-workspace` records the project's `build` command; this
  unit never runs it and never scaffolds a website.

## Risk tier

Verdict copied verbatim from `bun scripts/ceremony.mjs tier classify` at the
change's own diff (the tier is the classifier's, never this document's):

```json
{
  "contract": "risk-tier-verdict@1",
  "tier": "standard",
  "reason": "3 path(s) carry executable content: scripts/docs-generate.mjs, scripts/docs-generate.test.mjs, scripts/test-route-map.json",
  "reason_kind": "executable-content",
  "task_size": {
    "understood": true,
    "contained_risk": "contained",
    "resumable_from_diff": true,
    "ceremony": "unit-doc",
    "verification": "gates"
  },
  "signals": []
}
```

- **Tier** — `standard` · **Task Size** — `{ understood: true, contained_risk: contained, resumable_from_diff: true, ceremony: unit-doc, verification: gates }`
- **Named high-risk item** — `none — not a high-tier unit` (`signals: []`)

## Future

- 2026-11-04 — "Source-level API extraction (TypeDoc, JSDoc parsing)" — **open** (the
  issue's own risk list; not planned here).
- 2026-11-04 — multi-format simultaneous generation from one source pass
  (`mdx` + `html` + `latex` in one run) — **open**; today the run emits the one
  declared format, which is what the format choice means.

## Future cost

| Rule | Binds |
|---|---|
| The generated tree is regenerated in the change that moves its sources, and `bun scripts/docs-generate.mjs --check` is what proves it | every future unit touching `docs/ROADMAP.md`, a unit doc, a package manifest or a skill; owner `skills/unit-lane/references/DOCS.md`, gate `scripts/docs-generate.test.mjs` |
| A declared format is a project-level choice; changing it changes the generated file extension, and the previous format's pages are deleted by the same run | whoever edits the `Docs site` block; owner `template/AGENTS.md` §Docs site, interview `skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` |
| No generated file is ever hand-edited: a hand edit is drift the `--check` reports, and the next run overwrites it | every session; owner this unit doc §Non-goals |
| The generator runs where the runner crate's source is reachable — this repository, the same reach `scripts/needs-input.mjs` and `scripts/diff-guard.mjs` have — so a target project's generated output arrives with row 91's crate migration | whoever lands row 91, and any unit extending #396 before it |

## Applicable tests

- `bun test scripts/docs-generate.test.mjs` exits 0 (the new suite: discovery,
  four emitters, fallback, refusal, determinism, drift, orphan removal, live tree)
- `node scripts/run-root-suite.mjs` exits 0 (the repository gate)
- `bun scripts/skill-lint.mjs` → `verdict: PASS`
- `bun scripts/check-skill-context.mjs` and `… --documents` → both `PASS`
- `bun scripts/roadmap-settle.mjs` exits 0 (the roadmap row this unit adds)
- `node scripts/lint-changeset.mjs .changeset/396-doc-gen.md` → `ok`
- `bun scripts/phase-lint.mjs docs/features/396-doc-gen/SPEC.md` → `verdict PASS`

## Known pre-existing issues

- **The guide layer is over its declared estimate ceiling on `main`**:
  `bun scripts/check-skill-context.mjs --documents` answers
  `FAIL context documents: AGENTS.md: estimate 6884 > 6881` at `c8b64d0b`,
  before this unit's first commit. **Affects** this unit: the root suite cannot
  be green while the failure stands, and §7's verification requires a green gate,
  so the overrun is repaired here by tightening prose inside the existing ceiling
  (no rule deleted, no ceiling raised) and the repair is recorded as `D1` in
  `## Log`. It is a pre-existing defect owned by whoever last grew the guide
  (`27456e50`, the #397 merge's tier-cost row), not by this unit's scope.
- **`audit-docs` checks 10 and 11 still read pre-lane artifacts**
  (`docs/features/*/{PLAN,TASKS,progress}.md`). **Does not affect** this unit: it
  touches no audit check.
- **`docs/fix/365-manifest-vulnerability-pass/SPEC.md` carries ten obligation
  cells where the pinned header has nine.** **Does not affect** this unit (the
  gate reads the status column as the last cell, which still resolves); recorded
  so a later sweep does not read it as this unit's drift.
- **`node scripts/workflow-status.mjs` fails with `Maximum call stack size
  exceeded`** on an unmodified `main` worktree (`92715797`) and on this branch's
  base (`c8b64d0b`), identically. **Does not affect** this unit: the sensor is not
  in this change's verification set and no root suite calls it on the live tree
  (its suite runs fixtures). Recorded so a later session does not read it as
  regression, and routed to `triage-issue` as its own unit.

## Tasks

- P1 — Cut the frozen corpus as a failing suite, alone and observed red on the
  absent module (validator: `bun test scripts/docs-generate.test.mjs` exits 1
  with `ERR_MODULE_NOT_FOUND` naming `docs-generate.mjs`)
  (Implements: S2, S3, S4, S5, S6, S7)
  Relevant files: scripts/docs-generate.test.mjs
- P2 — Implement the generator: `Docs site` discovery, the four emitters,
  `--check` / `--dry-run` / projection, and orphan deletion (validator:
  `bun test scripts/docs-generate.test.mjs` exits 0)
  (Implements: S2, S3, S4, S5, S6, S7)
  Relevant files: scripts/docs-generate.mjs
- P3 — Register the new suite in the path→suite map (validator:
  `bun test scripts/test-route.test.mjs` exits 0)
  (Implements: S2)
  Relevant files: scripts/test-route-map.json
- P4 — Make the documentation task required and named in the lane's docs step —
  what was documented and in which declared format, with the `--check` receipt
  (validator: `bun scripts/skill-lint.mjs` exits 0 with `verdict: PASS`)
  (Implements: S1)
  Relevant files: skills/unit-lane/references/DOCS.md
- P5 — Carry the format question in the init interview, naming the four targets
  and the additive-with-consent path (validator:
  `rg -c "format" skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md`
  matches ≥ 1)
  (Implements: S8)
  Relevant files: skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md
- P6 — State the write step: the block is filled for a new project and offered
  additively, with explicit consent, to an existing one (validator:
  `rg -c "Docs site" skills/init-workspace/references/BOOTSTRAP_WRITE.md`
  matches ≥ 1)
  (Implements: S8)
  Relevant files: skills/init-workspace/references/BOOTSTRAP_WRITE.md
- P7 — Point the skill's own body at the format choice and the generator
  (validator: `rg -c "docs-generate" skills/init-workspace/SKILL.md` matches 1)
  (Implements: S8)
  Relevant files: skills/init-workspace/SKILL.md
- P8 — Widen the exported `Docs site` block to the four output targets and name
  the generator beside it (validator:
  `rg -c "docs-generate" template/AGENTS.md` matches 1 and
  `bun test scripts/scaffold-guide.test.mjs` exits 0)
  (Implements: S3, S8)
  Relevant files: template/AGENTS.md
- P9 — Index the unit on the roadmap (validator: `bun scripts/roadmap-settle.mjs`
  exits 0)
  (Implements: S2)
  Relevant files: docs/ROADMAP.md
- P10 — Commit the generated projection this repository's own fallback format
  produces (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S2, S6, S7)
  Relevant files: docs/generated
- P11 — Cut the release intent (validator:
  `node scripts/lint-changeset.mjs .changeset/396-doc-gen.md` → `ok`)
  (Implements: S2)
  Relevant files: .changeset/396-doc-gen.md
- P12 — Record the shipped surface in the changelog (validator:
  `node scripts/check-changelog-row.mjs "Unreleased" 4.10.0` → the table's row count
  is unchanged, and `rg -c "docs-generate" CHANGELOG.md` matches 1)
  (Implements: S2)
  Relevant files: CHANGELOG.md
- P13 — Verification over the whole change (validator:
  `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)

## Triaged steps

```text
TRIAGE — 396-doc-gen (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

Derived by `node scripts/unit-route.mjs --triage 396-doc-gen` and pasted
verbatim; this block is authoritative for routing.

**Declared deviation.** `review` does not run here: the governing instruction for
this change is to apply it inline and hand the diff to the owner as the external
verifier (recorded as `D2` in `## Log`). The other eight steps map to tasks:
`research`/`design`/`plan` were answered by the issue plus `PE-*`'s sampled
evidence, `implement`/`tests` are P1–P4, `evidence` is the `## Log` runs, `docs`
is P3, and `release` is P5's changeset intent (the version decision stays with
`scripts/release.mjs`).

```text
path-protection-plan@1
freeze-after: none
kind | path | justification
```

The unit's own acceptance criteria are frozen at cut and never re-cut after
implementation; `freeze-after: none` states that no phase boundary freezes a
path, and every protected-class write is recorded in
[`decisions.md`](decisions.md) with its justification.

### Planning evidence

One row per Engineering claim this change rests on, in the closed column order
and vocabularies owned by `skills/pre-execution-review/references/LEDGERS.md`:
frozen in [`planning-evidence.md`](planning-evidence.md) (M sizing — never both).

### Obligations

One row per normative behaviour, invariant, use case and required failure state,
in the nine-column shape owned by
`skills/pre-execution-review/references/LEDGERS.md`: frozen in
[`planning-obligations.md`](planning-obligations.md) (M sizing — never both).

## Acceptance criteria

One observable, testable criterion per requirement, each naming the check that
proves it. Frozen at cut.

| S# | criterion | proving check |
|---|---|---|
| S1 | a code-shipping unit's docs step carries an explicit documentation task that names what was documented and the declared output format, and a docs step without it does not pass | `rg -c "Document what this unit shipped" skills/unit-lane/references/DOCS.md` → 1 and the checklist's documentation row names the format |
| S2 | one command regenerates the whole generated tree from unit docs, roadmap rows and code, and no generated page carries hand-duplicated content the sources already own | `bun scripts/docs-generate.mjs --check` exits 0 at head; `bun test scripts/docs-generate.test.mjs` exits 0 |
| S3 | the declared `format` slot selects the emitter, and each of `md`, `mdx`, `html`, `latex` produces its own extension and shape | the four emitter cases pass in `bun test scripts/docs-generate.test.mjs` |
| S4 | a project with no `Docs site` block still gets markdown output, and the run reports the degradation instead of failing silently | the fallback case passes and `bun scripts/docs-generate.mjs --dry-run` prints the `degraded` line |
| S5 | the generated tree covers both halves: a page naming the delivered units (from the unit docs and roadmap rows) and a page naming the shipped code surface | the coverage case passes; the committed tree carries both pages |
| S6 | two consecutive runs are byte-identical, and `--check` exits 1 naming every missing, stale and orphaned file | the determinism case and the three drift cases pass |
| S7 | a page whose source unit is gone is deleted by the next write, and `--check` reports it as orphaned before that | the orphan-removal case passes |
| S8 | `init-workspace` asks for the format, writes it for a new project, and offers it additively with consent to an existing one | `rg -c "format" skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` names the slots and `BOOTSTRAP_WRITE.md` states the consent path |

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-04, the request, verbatim (issue #396's title and its
  `In scope` list):
  ```
  NEW FEATURE: forced documentation task + generated docs in the project's declared format (md/mdx/html/latex)
  ```
- **L2** — 2026-11-04, the governing instruction for applying the issue in this
  repository, verbatim: `"Apply to this repository: issue #396"` followed by the
  eight-step local workflow (verbatim intent, frozen-failure corpus first,
  fixtures before the real tree, work inline without the repo's own review
  machinery, freeze the planning ledgers, test-first slices, writer's
  verification and hand-off, correction bounds).
- **D1** — 2026-11-04, owner decision (the governing instruction's §5): the unit
  doc committed at `15d23a3c` was re-cut before any code because it could not
  carry its own contract — no `type`/`scope` frontmatter, obligations marked
  `verified` with no validator run behind them, a `### Planning evidence` table
  holding obligation rows, and no `## Acceptance criteria`. Its `E1`/`E2` lines
  recorded `unit-route --triage` over that malformed input, so both are re-run
  here and their new outputs recorded; the earlier values are superseded by this
  line rather than silently dropped. The frozen `S#` ids are the issue's own
  words, one id per distinct ask.
- **D2** — 2026-11-04, owner decision (governing instruction §4): `review-change`,
  `audit-pr` and the fold cycle do not run on this change — the owner is the
  external verifier. The deterministic gates (suites, lints) run always.
- **D3** — 2026-11-04, decision at cut: the generator ships as
  `scripts/docs-generate.mjs`, not as a `agentic-workflow docs build` subcommand.
  The crate is the published distribution channel and row 91 (`#352`) owns the
  migration of ceremony operations into it; adding a repo gate to the crate would
  ship a generator to target projects before the crate migration decides its
  module boundary. The script uses only `node:` builtins plus the crate's
  committed readers, so it moves into the crate when row 91 lands. The
  consequence, stated rather than hidden: today the command runs in a tree
  that carries the crate's source, so S8's format choice reaches a target
  project's generated output through that migration, not before it — the same
  reach `scripts/needs-input.mjs` and `scripts/diff-guard.mjs` already have.
- **D4** — 2026-11-04, decision at cut: generated output lives in a dedicated
  projection directory — `<content-dir>/generated/` when the project declares one,
  otherwise `docs/generated/` — so an authored page and a generated page can never
  collide, and a format change deletes the previous format's pages as orphans.
  The run never deletes outside that directory.
- **D5** — 2026-11-04, decision at cut: an undeclared format degrades to
  markdown (reported, exit 0) but an **unrecognised** declared value refuses
  (exit 2, nothing written). S4 forbids a silent failure, and silently downgrading
  a format the project explicitly named would be exactly that.
- **E1** — 2026-11-04, `node scripts/unit-route.mjs --triage 396-doc-gen` · exit 0 · `Steps: research, design, plan, implement, tests, evidence, review, docs, release` / `Skipped: none`.
- **E2** — 2026-11-04, `bun scripts/ceremony.mjs tier classify` · exit 0 · `tier: standard`, `task_size.contained_risk: contained` (verdict copied verbatim into `## Risk tier`).
- **E3** — 2026-11-04, `bun test scripts/docs-generate.test.mjs` at the red commit `772147ac` · exit 1 · `0 pass · 19 fail`, every case failing on `Cannot find module '.../scripts/docs-generate.mjs'` (`ERR_MODULE_NOT_FOUND`).
- **E4** — 2026-11-04, `bun test scripts/docs-generate.test.mjs` and `node --test scripts/docs-generate.test.mjs` · exit 0 both · `20 pass · 0 fail` under each runtime (the frozen corpus, including the live-tree `--check`).
- **E5** — 2026-11-04, `rg -c "Document what this unit shipped" skills/unit-lane/references/DOCS.md` → `1`; `rg -c "All docs the unit demands are updated" skills/unit-lane/references/DOCS.md` → no match (exit 1). O1 verified.
- **E6** — 2026-11-04, `bun scripts/docs-generate.mjs --dry-run` in this repository (no `Docs site` block) · exit 0 · ``Format: md — degraded (no `Docs site` block in AGENTS.md)`` / `Would write: code.md, index.md, units.md` — the S4 path, reported rather than silent. O4 verified.
- **E7** — 2026-11-04, `node scripts/docs-generate.mjs --root <tmp tree declaring format: asciidoc>` · exit 2 · `DOCS GENERATE REFUSAL — unrecognised format 'asciidoc' in AGENTS.md; expected markdown | md | mdx | starlight | docusaurus | html | latex | tex`, and the tree holds nothing but its own `AGENTS.md`. O5 verified.
- **E8** — 2026-11-04, `rg -c "docs-generate" skills/init-workspace/SKILL.md skills/init-workspace/references/BOOTSTRAP_WRITE.md template/AGENTS.md` · exit 0 · `1`, `1`, `2` — recorded as measured: the row predicted one match per surface and the scaffold's block names the generator and its `--check` mode on two lines, so the behaviour (every surface names the generator) holds while the predicted count was wrong. O10 verified on the behaviour, the count disclosed.
- **E9** — 2026-11-04, differential check against `c8b64d0b` (a `mktemp -d` copy of the base commit; removed after): `bun scripts/skill-lint.mjs` identical (`PASS`, 90 files); `bun scripts/phase-lint.mjs docs/features/103-doc-currency/SPEC.md` identical (same fingerprint `1c325170…`); `node scripts/unit-route.mjs --triage 103-doc-currency` identical; `bun scripts/roadmap-settle.mjs` 130 → 131 unit docs (the unit this change adds); `node scripts/test-route.mjs --list` +1 route (`docs-generate`); `bun scripts/check-skill-context.mjs --documents` FAIL → PASS (D6's repair). No unrequested difference.
- **G1** — 2026-11-04, `node scripts/run-root-suite.mjs` · exit 0 · `tests 1544 · pass 1543 · fail 0 · skipped 1` (the skip is pre-existing).
- **G2** — 2026-11-04, `bun scripts/skill-lint.mjs` · exit 0 · `verdict: PASS` (90 files, 0 findings).
- **G3** — 2026-11-04, `bun scripts/check-skill-context.mjs` and `… --documents` · exit 0 both · `PASS context budgets: 28 skills` / `PASS context documents: 3 budgeted documents` (`AGENTS.md` 6881/6881).
- **G4** — 2026-11-04, `bun scripts/phase-lint.mjs docs/features/396-doc-gen/SPEC.md` · exit 0 · `verdict PASS`, all phases 6/6.
- **G5** — 2026-11-04, `bun scripts/roadmap-settle.mjs` · exit 0 · 131 unit docs checked, `verdict: PASS`, 0 violations.
- **G6** — 2026-11-04, `node scripts/lint-changeset.mjs .changeset/396-doc-gen.md` → `ok`; `node scripts/version-parity-gate.mjs --content` → `VERDICT: PASS` (the intent covers `@gtrabanco/pi-agentic-workflow`).
- **G7** — 2026-11-04, `bun scripts/red-first.mjs` · exit 0 · `32 pair(s) · 2 after the cutoff · 0 finding(s)`, `verdict: PASS` — the suite's red commit precedes the generator's.
- **D6** — 2026-11-04, decision: `CHANGELOG.md` gains no row here. The changelog tables are the **release script's** surface (`docs/workflow/PACKAGES.md` §release flow: `scripts/release.mjs` writes the version's rows from the pending changesets), so this unit ships its release note as `.changeset/396-doc-gen.md` and writes no version it does not own. P12 is closed by that intent plus `version-parity-gate --content` (G6).
- **D7** — 2026-11-04, decision: the guide-layer overrun declared under `## Known pre-existing issues` was repaired in this change (`1c6e460f`) rather than reported and left red — three sentences tightened inside the existing ceiling, no rule, owner link or pinned phrase (`as the documented fallback`, the tool-choice sentence, the suite facts) touched, ceilings unchanged. Without it the root gate cannot be green and `O11` could not be verified.
- **P1** — 2026-11-04, the frozen corpus cut alone and observed red (`772147ac`); the implementation's first green at `ecaa1467`.
- **P2** — 2026-11-04, the generator implemented, then routed onto the shared fence-aware reader and its aliased target dropped after the sibling pins caught both (`ecaa1467`, `4f1f1b0f`); the path→suite map registration `99be3342`.
- **P3** — 2026-11-04, the docs step's explicit documentation task (`ca4ab1e9`).
- **P4** — 2026-11-04, `init-workspace`'s format choice and the scaffold's widened `Docs site` block (`a1e637e8`, `49943398`).
- **P5** — 2026-11-04, roadmap row 396, the committed projection and the release intent (`88857c5c`, `d326ca4e`).
- **P6** — 2026-11-04, the guide repair (`1c6e460f`) and the frozen corpus' two premise corrections (`440ef706`); the gate is `G1`.
- **P7** — 2026-11-04, branch pushed and [PR #400](https://github.com/gtrabanco/agentic-workflow/pull/400) opened against `main`; roadmap row 396 settled to `done · [#400]`, and the projection regenerated from that row (`G8`).
- **G8** — 2026-11-04, `bun scripts/docs-generate.mjs` · exit 0 · `1 written · 0 deleted · 2 unchanged` (the units page carries the settled row); `bun scripts/roadmap-settle.mjs` · exit 0 · 131 unit docs, `verdict: PASS`, 0 violations.

## Next

PR [#400](https://github.com/gtrabanco/agentic-workflow/pull/400) is open against
`main` and the owner is the external verifier (D2): read the diff against
`## Acceptance criteria` and re-run `G1`–`G7`. No `review-change`, `audit-pr` or
fold cycle runs on this change; the obligations are closed in
[`planning-obligations.md`](planning-obligations.md).

## References

- Issue: [#396](https://github.com/gtrabanco/agentic-workflow/issues/396) — `Closes #396`.
- PR: [#400](https://github.com/gtrabanco/agentic-workflow/pull/400) against `main`.
- Companion: [#103](https://github.com/gtrabanco/agentic-workflow/issues/103) /
  `docs/features/103-doc-currency/SPEC.md` (the rule and the audit check this unit
  builds the automation on; merged in PR #397).
- Scaffold declaration: `template/AGENTS.md` §`Docs site`.
- Frozen ledgers: [`planning-evidence.md`](planning-evidence.md),
  [`planning-obligations.md`](planning-obligations.md).
- Retired precedent: `docs/features/01-generate-docs/` (the skill retired at
  `42d66a42`) — read for why its shape is not revived.
