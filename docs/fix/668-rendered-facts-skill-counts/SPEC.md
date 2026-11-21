---
type: feature
scope: small
roadmap_summary: Issue [#668](https://github.com/gtrabanco/agentic-workflow/issues/668) (S): every committed surface that renders a skill-surface count is bound to a `rendered-facts@1` row recomputed from the tree and the frontmatter by a new deterministic counter (`scripts/skill-surface-counts.mjs`, red-first), so the counts #663 caught rotting cannot drift again.
ac-hash: 2bcc7c6e4336b4f9748cc41bc87bef8c76e10d3dbd2f69b217b74a1cfd9f2ac2
---

# fix/668-rendered-facts-skill-counts

> One-line: the skill surface is counted by the tree, never by hand — one
> deterministic counter derives the `SKILL.md` count, the
> `user-invocable: true|false` split, the `metadata.internal` exclusion, the
> discoverable set and the reference-directory count, and every committed
> sentence that renders one of those numbers is a `rendered-facts@1` row the
> drift gate recomputes.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
```

## Issue

`#668` — tracked issue in the project's forge. The PR closes it via
`Closes #668`. Applied through the fix lane at the owner's request (the unit
folder is `docs/fix/668-rendered-facts-skill-counts/`; the issue carries the
`feature` label).

## Specs

The issue's own words, numbered in the order it states them. The Goal paragraph
is S1, the three In-scope bullets are S2–S4, the three Out-of-scope bullets are
S5–S7, and the three acceptance-criteria boxes are S8–S10.

**S1 — Pin every hand-rendered skill-surface count to a recomputed row.**
> Pin every hand-rendered **skill-surface count** in committed documents to `rendered-facts@1` rows that recompute the value from the tree/frontmatter — so a count can never silently rot again. Origin: issue #663 (skill-surface interview); owner verdict 2026-11-20 (approved, "esto sí").

**S2 — A deterministic counter with its red-first sibling suite.**
> A new deterministic script + red-first sibling suite (two commits, `IR4`) that derives the skill-surface counts from the tree: `SKILL.md` file count, `user-invocable: true|false` split from frontmatter, reference-directory count — and any sibling count the design sweep finds rendered by hand.

**S3 — Rows for every committed surface that renders such a count.**
> `rendered-facts@1` rows for every committed surface that renders such a count, recomputed against the derived source; a restatement found in review that is not pinned is already a known-issue by the block's own rule — this unit closes the class for skill counts.

**S4 — The surfaces the design sweep confirms.**
> Surfaces likely carrying the counts today (the design sweep confirms): `README.md` ("The skills" breakdown), `docs/CAPABILITIES.md`, `docs/workflow/SKILLS.md` (its existing row stays, new rows join the same block).

**S5 — No prose wording change beyond what pinning requires.**
> No change to any count's prose wording beyond what pinning requires.

**S6 — No new gate step.**
> No new gate step beyond the suite that recomputes the pinned rows (the pattern's existing mechanism is enough).

**S7 — Not a generic count sweep.**
> Not a generic "count everything" sweep — scope is the skill-surface counts #663 caught drifting.

**S8 — Red-first, both runs recorded.**
> The script + suite land red-first (`IR4`): the suite committed alone, observed failing, then the implementation observed green; the unit doc's `## Log` records both runs.

**S9 — Every rendering pinned or deleted.**
> Every committed surface rendering a skill-surface count is either pinned in `rendered-facts@1` (recomputed from frontmatter/tree) or the restatement is deleted.

**S10 — Root gate green under both runtimes; `normative-drift` green.**
> Root gate green under both runtimes; `normative-drift` green (rows live in the declared block).

The measured evidence the issue cites, kept for the record (it is the reason the
unit exists, never a requirement):

> **Measured evidence**: issue #663 itself was written with stale counts that drifted within a day of its creation — it claimed 13 user-facing skills (14 carry `user-invocable: true`), 29 `SKILL.md` files (there are 30), and 14 reference directories (there are 17). Hand-rendered counts rot; the repo already owns the fix pattern (`rendered-facts@1` in `AGENTS.md`, whose tests **recompute** each claim against its machine source — e.g. `docs/workflow/SKILLS.md`'s user-facing count is already pinned).

## Acceptance criteria

Frozen at the cut; the `ac-hash:` frontmatter line is this section's SHA-256.
One criterion per requirement, each naming the check that proves it.

1. **S1 — the counter is the authority.** `bun scripts/skill-surface-counts.mjs` exits 0 printing all six `count:` machine names with the tree's values, and `rg -c 'deriveSkillSurfaceCounts' scripts/normative-drift.test.mjs` matches at least 1 — the gate derives, it does not keep a second copy.
2. **S2 — the derivation covers the four named families.** `bun test scripts/skill-surface-counts.test.mjs` exits 0 with a fixture case per family (`SKILL.md` file count, the `user-invocable` split, the metadata-internal exclusion, the reference-directory count) and the live identity `skillFiles === userFacing + workflowInternals + metadataInternal`.
3. **S3 — every rendered count is bound.** `bun test scripts/normative-drift.test.mjs` exits 0 and `AGENTS.md`'s `rendered-facts@1` block carries the twelve new rows over `README.md`, `docs/workflow/SKILLS.md` and `docs/workflow/REPLICATE.md`.
4. **S4 — the named surfaces answer.** `README.md` and `docs/workflow/SKILLS.md` carry the corrected numbers, and `docs/CAPABILITIES.md`'s `empty` answer is recorded in the unit doc (`rg -c 'source skills|user-facing skills|installable skills' docs/CAPABILITIES.md` matches 0).
5. **S5 — no wording change beyond pinning.** Reading `git diff <base>..HEAD -- README.md docs/workflow/SKILLS.md docs/workflow/REPLICATE.md` shows only count-bearing sentences: the numbers, the two missing enumeration entries and the metadata-internal carrier's name.
6. **S6 — no new gate step.** `rg -c 'skill-surface-counts' scripts/local-gate.mjs` matches 0 — the recomputation rides the existing `normative-drift` step.
7. **S7 — the sweep stays bounded.** The recorded sweep answers exactly the three narrative files (plus `CAPABILITIES.md`'s empty answer); no other surface is pinned and no dated record is bound.
8. **S8 — red-first, both runs recorded.** `bun scripts/red-first.mjs` exits 0 and the `## Log` carries an `E` line for the observed-red run and one for the observed-green run, each with its commit.
9. **S9 — every rendering pinned or deleted.** The sweep command printed in `## Log` lists no unpinned skill-surface rendering: each is either a row's captured number or the deleted review-pack count.
10. **S10 — the gate is green under both runtimes.** `bun scripts/local-gate.mjs` exits 0, `bun scripts/run-root-suite.mjs` exits 0, and `bun test scripts/normative-drift.test.mjs` exits 0.

## Impact

The design sweep (S4's command, run over the tree at the cut) answers three
questions the issue left open, and its negative findings are part of the change:

| Surface | Rendered skill-surface count at the cut | Verdict |
|---|---|---|
| `README.md:29` | `29 source skills (14 user-facing + 14 workflow internals + 1 metadata-internal; 28 discoverable …)` | **stale on four of five numbers** — the tree carries 30 skill files, 15 workflow internals, 29 discoverable; pinned |
| `README.md:87` | `**14 user-facing skills**` | correct today, **unpinned**; pinned |
| `docs/workflow/SKILLS.md:5` | `**14 user-facing skills**` | correct, already pinned; the row gains a second surface |
| `docs/workflow/SKILLS.md:10` | `**one metadata-internal** … (orchestration-envelope; it carries metadata.internal: true …)` | the count is right, **the named carrier is wrong** — the only `metadata.internal: true` skill is `skill-lint`; pinned and corrected |
| `docs/workflow/SKILLS.md:14` | `The 14 user-facing skills cover …` | correct, second rendering in the same file; pinned |
| `docs/workflow/SKILLS.md:10` | `the workflow's own 9-skill internal review pack: …` | **underivable** — no frontmatter signal separates the nine passes from `review-implementation` (also `review-*`, also `user-invocable: false`), so a machine would encode a hand-kept exclusion list; the count word is **deleted**, the enumeration stays |
| `docs/workflow/REPLICATE.md:28`,`:32` | `The 27 installable skills (13 user-facing + 14 internal …)`, `**13 user-facing + 14 internal** (27 total)` and their two enumerations | **stale** — 29 installable (14 user-facing + 15 internal), and the enumerations miss `batch-scheduler` and `runner-contract`; corrected and pinned |
| `docs/CAPABILITIES.md` | **no skill count rendered** (56 lines: roles, subsystem rows, probes) | nothing to pin — S4 named the file, the sweep answers `empty` for it, recorded here instead of invented |

Beyond its own lines the change touches:

- `scripts/normative-drift.test.mjs` — the drift gate stops keeping its own
  `count:user-facing` lambda and resolves every `count:` machine from the new
  module (one owner of the derivation, `IR1`); one case is added.
- `AGENTS.md` — twelve `rendered-facts@1` rows, one existing row gains a second
  surface, one prose sentence names the unbound counter, and the block's pinned
  `machineLines` moves.
- `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — `machineLines` re-pinned to the
  measured block size (`check-skill-context --documents` is the ceiling's owner).
- `docs/generated/code.md` — the new script appears in the emitted projection.
- Consumers of the changed numbers: `check-skill-context --documents` (the guide
  budget), `docs-generate --check`, `red-first`, `structural-sibling-pins`,
  `test-obligation-tags`, `temp-hygiene`, `invocation-drift` (a usage string).
- What to ask before touching something live: nothing — every path is this
  repository's own documentation and its own gate scripts.

## Surfaces

- `scripts`
- `docs`

## Retirements

Two things stop being true and are removed by this unit; each with its
replacement:

- **The hand-rendered numbers on the four narrative surfaces** (`README.md:29`,
  `README.md:87`, `docs/workflow/SKILLS.md:5`, `:10`, `:14`,
  `docs/workflow/REPLICATE.md:28`, `:32`) — replaced by the same numbers
  rendered from `bun scripts/skill-surface-counts.mjs`, bound by rows. The
  numbers stay in the sentence (S5 forbids rewording them away); their
  authority moves to the machine.
- **The `9-skill` count word in `docs/workflow/SKILLS.md:10`** — the nine names
  that follow it are the enumeration; the number is decoration with no machine
  behind it. Replacement: the same sentence without the count
  (`the workflow's own internal review pack:`). `rg -c '9-skill' docs/` → 0
  after the change.

Nothing else retires: the gate's `count:user-facing` machine keeps its name and
its value, so every existing row and case still resolves. `rg -c 'count:user-facing' AGENTS.md scripts/normative-drift.test.mjs`
is non-zero before and after — the vocabulary is additive, not renamed.

This unit is otherwise **strictly additive** (new script, new suite, new rows,
new machine names) and its residual inventory is the new pair itself:
`scripts/skill-surface-counts.mjs` and its sibling suite are ``andamio`` by
construction — the consumer is the drift gate (`scripts/normative-drift.test.mjs`
imports `deriveSkillSurfaceCounts`) and the `rendered-facts@1` rows, both landing
in the same unit.

## Non-goals

- Not a generic count sweep (S7): the family is the skill-surface counts, the
  surfaces are the narrative docs that render them.
- No date-stamped recount is pinned. `docs/ROADMAP.md`'s row 33 carries a
  "post-lane recount — 14 skills carry a `## Turn contract` section and only 5
  reference the canonical `TURN_CONTRACT.md`; the scope is those 9 non-canonical
  skills" inside an owner-managed row; `docs/workflow/MIGRATION.md`, `CHANGELOG.md`,
  `docs/LOGS.md`, `docs/research/**`, `docs/audits/**` and every unit doc carry
  the same kind of record. A row that recomputes from the current tree would
  make a dated measurement *change* when the tree moves, which is the opposite
  of what a record is. Measured at this head the counts in row 33 are stale (15
  sections, 16 citations) — reported under `## Known pre-existing issues`, never
  hand-edited (the roadmap's fix rows and re-scope notes are owner-managed).
- No new gate step (S6): the drift gate already recomputes `rendered-facts@1`.
- No skill body is touched; no skill version moves; no package version moves.
- No `count:` machine is invented for a fact the tree does not evidence (the
  review-pack count is the case the sweep refused).

## Risk tier

Computed, never chosen — `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths 'scripts/skill-surface-counts.mjs,scripts/skill-surface-counts.test.mjs,scripts/normative-drift.test.mjs,AGENTS.md,README.md,docs/workflow/SKILLS.md,docs/workflow/REPLICATE.md,docs/workflow/SKILL_CONTEXT_BUDGETS.json,docs/fix/668-rendered-facts-skill-counts/SPEC.md,docs/ROADMAP.md'`
returned, verbatim:

```text
risk-tier-verdict@1
tier: standard
reason: 4 path(s) carry executable content: docs/workflow/SKILL_CONTEXT_BUDGETS.json, scripts/normative-drift.test.mjs, scripts/skill-surface-counts.mjs, …
reason_kind: executable-content
task_size: understood · contained_risk: contained · resumable_from_diff · ceremony: unit-doc · verification: gates
signals: none
```

- **Tier** — `standard` · **Task Size** — understood, contained, resumable from the diff
- **Named high-risk item** — none — not a high-tier unit

## Future

none

## Future cost

| Standing obligation | Binds |
|---|---|
| A new `skills/<name>/SKILL.md` changes five counts at once; the rows recompute them, so the prose on `README.md`, `docs/workflow/SKILLS.md` and `docs/workflow/REPLICATE.md` must be corrected in the same change that adds the skill — the gate now refuses the stale sentence instead of letting it rot | whoever adds or removes a skill |
| A new `count:` machine enters by editing `SKILL_SURFACE_COUNT_MACHINES` and its derivation in `scripts/skill-surface-counts.mjs`, never by a second lambda in the gate | whoever extends the counter |
| A narrative surface that renders a skill-surface number for the first time earns a `rendered-facts@1` row in the same change | whoever writes such a surface |

## Applicable tests

- `scripts/skill-surface-counts.test.mjs` (new, red-first) — the derivation's
  semantics on fixture trees, the identities, the four refusal states, and the
  CLI's output.
- `scripts/normative-drift.test.mjs` — the new case plus the whole existing
  rendered-facts and inventory suite.
- `scripts/check-skill-context.test.mjs` / `--documents` — the guide budget the
  new rows spend.
- `scripts/red-first.mjs`, `scripts/structural-sibling-pins.test.mjs`,
  `scripts/test-obligation-tags.mjs`, `scripts/temp-hygiene.test.mjs`,
  `scripts/invocation-drift.mjs`, `scripts/docs-generate.test.mjs` — the
  structural rules the new pair and the touched guide must keep.

## Known pre-existing issues

- **`docs/ROADMAP.md` row 33's post-lane recount is stale** — the row says "14
  skills carry a `## Turn contract` section and only 5 reference the canonical
  `TURN_CONTRACT.md`; the scope is those 9 non-canonical skills"; measured at
  this head `rg -l '^## Turn contract' skills/*/SKILL.md | wc -l` → 15 and
  `rg -l 'TURN_CONTRACT\.md' skills/*/SKILL.md | wc -l` → 16. **Does not affect
  this unit**: the row is owner-managed roadmap prose (the emitter never
  rewrites a hand row) and the counts are a dated recount, so this unit reports
  it instead of pinning or editing it.
- **`docs/fix/663-skill-surface-interview/SPEC.md` does not exist** although the
  roadmap's Fixes row 663 links it (`| [#663] … | pending | … SPEC: [SPEC](fix/663-skill-surface-interview/SPEC.md) |`).
  **Does not affect this unit**: #663 delivered a research note
  (`docs/research/2026-11-20-issue-663-skill-surface-diagnosis.md`) and no unit
  doc; the stale link is the roadmap owner's to settle.
- **`docs/workflow/SKILLS.md:10` names `orchestration-envelope` as the
  `metadata.internal: true` skill** — the tree carries exactly one
  (`skills/skill-lint/SKILL.md`). **Affects this unit**: the sentence is the
  metadata-internal count's rendering, so pinning it (S3) requires naming the
  real carrier; corrected here and disclosed in the handoff.

## Tasks

P1…P4, dependency-topological, smallest within a ready set.

- P1 — RED: cut `scripts/skill-surface-counts.test.mjs`, commit it alone and observe it failing on the missing module (validator: `bun test scripts/skill-surface-counts.test.mjs` exits 1 with a module-resolution error, recorded as an `E` line)
  (Implements: S2, S8)
  - Relevant files: scripts/skill-surface-counts.test.mjs
- P2 — GREEN: cut `scripts/skill-surface-counts.mjs` and make the drift gate resolve every `count:` machine from it instead of keeping its own lambda (validator: `bun test scripts/skill-surface-counts.test.mjs scripts/normative-drift.test.mjs` exits 0)
  (Implements: S1, S2, S8)
  - Relevant files: scripts/skill-surface-counts.mjs, scripts/normative-drift.test.mjs
- P3 — the twelve rows, the corrected renderings and the re-pinned budget land, observed red on the stale sentence first (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S3, S4, S5, S7, S9)
  - Relevant files: AGENTS.md, README.md, docs/workflow/SKILLS.md, docs/workflow/REPLICATE.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P4 — the state and docs surfaces ship with the change and the whole gate runs in the foreground (validator: `bun scripts/local-gate.mjs` exits 0 and `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S6, S10)
  - Relevant files: docs/ROADMAP.md, docs/LOGS.md, docs/generated/code.md, .agentic-workflow/journal/

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

Column order and vocabularies are owned by
`skills/pre-execution-review/references/LEDGERS.md`; this file is the XS/S
carrier, so the embedded table below **is** the ledger.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | measured-run | The tree's skill surface at the cut: 30 `skills/*/SKILL.md`, 14 `user-invocable: true`, 16 `user-invocable: false` of which exactly 1 carries `metadata.internal: true` (`skill-lint`), 29 discoverable, 17 `skills/*/references/` directories | `find skills -name SKILL.md \| wc -l` → 30; `rg -l '^user-invocable: true' skills/*/SKILL.md \| wc -l` → 14; `rg -l 'internal: true' skills/*/SKILL.md` → `skill-lint`; `find skills -type d -name references \| wc -l` → 17 | measured 2026-11-21 (this session) | O2–O6, O9 |
| PE-002 | committed-source | `rendered-facts@1` resolves a `pattern:` claim by matching the regex against the surface's text and comparing captured group 1 with `String(machine())`; the machine map is a local object literal in `runDriftChecks` holding `count:user-facing`, `count:packages` and `package:version`, and an unknown machine answers `unpublished-machine` | `scripts/normative-drift.test.mjs:672-690` (the map), `:700-720` (the `pattern:` branch) | read 2026-11-21 (this session) | O1, O8 |
| PE-003 | committed-source | A `rendered-facts@1` row's cells split on `|`, so a claim's regex may not contain that character; the `m` flag means one row pins one occurrence per surface, and two rows over the same file need distinct anchors | `scripts/normative-drift.test.mjs:247-271` (`versionedBlock`), `:713` (`new RegExp(literal, "m")`) | read 2026-11-21 (this session) | O8 |
| PE-004 | measured-run | The sweep over every committed narrative surface finds the skill-surface counts on exactly three files — `README.md` (2 lines, 5 numbers), `docs/workflow/SKILLS.md` (3 renderings), `docs/workflow/REPLICATE.md` (2 statements + 2 enumerations) — and none in `docs/CAPABILITIES.md` | `rg -n -i '\b\d+\b[^\n]{0,25}(skills\|references dir\|reference director)' README.md docs/CAPABILITIES.md docs/workflow/*.md template/**/*.md` with the historical carriers (`MIGRATION.md`, `GOLDEN_FIXTURE.md`) read and excluded | measured 2026-11-21 (this session) | O9, O10 |
| PE-005 | measured-run | `docs/CAPABILITIES.md` renders no skill count: its 56 lines are roles, subsystem rows and probes — so S4's third named surface answers `empty` and nothing is pinned there | `rg -n -i 'skills' docs/CAPABILITIES.md` → subsystem rows only | measured 2026-11-21 (this session) | O10 |
| PE-006 | committed-source | The user-facing count `docs/workflow/SKILLS.md:5` already pins is the only `rendered-facts@1` row over a skill count; no row covers the source-skill total, the internals split, the metadata-internal exclusion, the discoverable set, the reference directories or the review pack | `AGENTS.md` § Rendered facts, read at the cut | read 2026-11-21 (this session) | O7, O8 |
| PE-007 | committed-source | The review pack's "9" has no frontmatter signal: `skills/review-implementation/SKILL.md` is also `review-*` and `user-invocable: false`, so a name-plus-flag rule counts 10 — the issue's S9 branch (delete the restatement) is the only honest answer, and the nine names follow the number in the same sentence | `rg -n '^user-invocable' skills/review-*/SKILL.md` | read 2026-11-21 (this session) | O9, D2 |
| PE-008 | committed-source | The guide's block budgets are exact pins: `docs/workflow/SKILL_CONTEXT_BUDGETS.json`'s `documents.files["AGENTS.md"]` carries `machineLines: 201` (the sum of the three machine blocks), `linesMax: 681`, `proseLinesMax: 475`, `estimateMax: 14285`; the measured guide at the cut is 657 / 201 / 456 / 13,879 | `bun scripts/check-skill-context.mjs --documents` at the cut; the manifest's `sources` note | measured 2026-11-21 (this session) | O11 |
| PE-009 | committed-source | A new `scripts/x.mjs` + `scripts/x.test.mjs` pair must land as two commits, the suite's observed-red commit being an ancestor of the implementation's — the gate reads git history, and its cutoff is its own adding commit | `scripts/red-first.mjs:75-101` | read 2026-11-21 (this session) | O12 |
| PE-010 | committed-source | Every root suite declares `// test-obligation: protects=<path> obligations=<kind>` at its head, from the closed set `contract \| failure-path \| boundary \| distribution-contract \| fixture-support \| convention` | `scripts/test-obligation-tags.mjs`, `packages/agentic-workflow-schema/src/vocabularies.ts:274-281` | read 2026-11-21 (this session) | O12 |
| PE-011 | committed-source | `scripts/invocation-drift.mjs` fails a usage string in `scripts/*.mjs` that names `node` outside the bootstrap allowlist, so a new script prints the bun form with the node fallback stated beside it | `scripts/invocation-drift.mjs:12`, `:30-36` | read 2026-11-21 (this session) | O13 |
| PE-012 | committed-source | `docs/generated/**` is emitted, never hand-written, and the gate runs `docs-generate --check` on every push; the emitter's code projection walks `scripts/` and lists every `*.mjs` | `AGENTS.md` § Docs site; `packages/agentic-workflow/src/docs-generate/index.mjs:330` | read 2026-11-21 (this session) | O14 |
| PE-013 | measured-run | The fix row for a unit is written through the crate's writer, not by hand — `agentic-workflow roadmap row-upsert --slug <unit> --status <status> --issue <n>` resolves the unit's `type` and calls `fixRowUpsert` for a fix-lane unit; `rowsettle`/`roadmap check` read it back | `packages/agentic-workflow/src/runner/ceremony/roadmap.mjs:63-80`; `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check --slug 646-docs-skills-reconciliation` → the row | measured 2026-11-21 (this session) | O14 |
| PE-014 | committed-source | The session journal is fragment-only in this repository: `.agentic-workflow/journal.md` declares the carrier, `docs/LOGS.md` is written by the aggregator, and the fragment name is computed by `agentic-workflow journal name --kind <mechanical\|narrative>` | `.agentic-workflow/journal.md`; `docs/workflow/GATE_INVENTORY.md` rows `journal-carrier-check` / `log-immutability` | read 2026-11-21 (this session) | O14 |
| PE-015 | measured-run | The worktree had no `node_modules` and no schema `dist/`, so the crate refused every subcommand (`Cannot find package 'mdast-util-from-markdown'`); `bun install --frozen-lockfile` installed 166 packages and the ceremony commands run | the two commands, exit 1 then exit 0 | measured 2026-11-21 (this session) | the `## Risk tier` verdict; O15 |
| PE-016 | committed-source | `scripts/temp-root.mjs` is the tracked temp-root helper (exit-hook cleanup, signals dispose first), and `scripts/temp-hygiene.test.mjs` enforces it — a fixture tree in a new suite uses `tempRoot`, never `mkdtempSync` | `scripts/temp-root.mjs:1-40`; `skills/unit-lane/references/TESTS.md` | read 2026-11-21 (this session) | O6, O13 |

### Obligations

One row per normative behaviour, invariant, use case and required failure state.
Every row is `planned` at the cut and flips only on a foreground validator run
whose receipt lands where `required-evidence` says.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 · S2 · IR1 · PE-002 | The derivation has one owner: the drift gate imports `deriveSkillSurfaceCounts` and keeps no second copy of any skill count; the machine names are the module's published list | P2 | P2 | direct application (this session) | `rg -c 'deriveSkillSurfaceCounts' scripts/normative-drift.test.mjs` matches at least 1 and `rg -c 'count:user-facing.*=>' scripts/normative-drift.test.mjs` matches 0 | `E` line with both counts | planned |
| O2 | S2 · PE-001 | `count:skill-files` is the number of `skills/*/SKILL.md` entrypoints, derived from the tree | P1 | P1 | direct application (this session) | `bun test scripts/skill-surface-counts.test.mjs` exits 0 with the fixture case naming 4 skill files and the live case agreeing with `find skills -name SKILL.md` | `E` line naming the case and the count | planned |
| O3 | S2 · PE-001 | `count:user-facing` and `count:workflow-internals` split the non-metadata entries on `user-invocable: true\|false` read from the frontmatter, and the split sums back to the file count | P1 | P1 | direct application (this session) | `bun test scripts/skill-surface-counts.test.mjs` exits 0 with the identity case (`skillFiles === userFacing + workflowInternals + metadataInternal`) and the fixture case | `E` line naming the identity case | planned |
| O4 | S2 · PE-001 | `count:metadata-internal` counts `metadata.internal: true` and `count:discoverable` is the file count minus that set | P1 | P1 | direct application (this session) | `bun test scripts/skill-surface-counts.test.mjs` exits 0 with the fixture case whose metadata-internal entry is excluded from the discoverable set | `E` line naming the case | planned |
| O5 | S2 · PE-001 | `count:skill-references` is the number of `skills/*/references/` directories — the count #663 rendered by hand and no surface renders today | P1 | P1 | direct application (this session) | `bun test scripts/skill-surface-counts.test.mjs` exits 0 with the fixture case (one references directory among four skills) and `bun scripts/skill-surface-counts.mjs` prints `count:skill-references` | `E` line with the printed row | planned |
| O6 | S2 · PE-016 | Required failure states: a `skills/` entry with no `SKILL.md`, a `SKILL.md` with no `user-invocable:` line, an unknown `user-invocable` value, and `metadata.internal: true` beside `user-invocable: true` each refuse by code and path — the counter never guesses a classification | P1 | P1 | direct application (this session) | `bun test scripts/skill-surface-counts.test.mjs` exits 0 with the four refusal cases and `bun scripts/skill-surface-counts.mjs --root <fixture>` exits 1 with `SKILL SURFACE REFUSAL` on stderr | `E` line naming the four codes | planned |
| O7 | S3 · S9 · PE-004 · PE-006 | Every committed narrative surface that renders a skill-surface count is bound: twelve rows cover `README.md` (5 renderings), `docs/workflow/SKILLS.md` (3, one joined with README) and `docs/workflow/REPLICATE.md` (6), and no rendering the sweep found stays unpinned | P3 | P3 | direct application (this session) | `bun test scripts/normative-drift.test.mjs` exits 0 and `rg -c '^\w.*\| (pattern|literal|restates|package-versions)' AGENTS.md` matches the block's full row count | `E` line with the row count and the green suite | planned |
| O8 | S3 · PE-002 · PE-003 | The gate recomputes every new row: a surface that drifts from the tree is refused once, by name, with the recomputed value in the message | P3 | P3 | direct application (this session) | `bun test scripts/normative-drift.test.mjs` exits 0 with the `#668` case asserting one `unrendered-value` for a mutated `README.md` and one for a mutated `REPLICATE.md` | `E` line naming the case and both findings | planned |
| O9 | S4 · S5 · S9 · PE-001 · PE-007 | The renderings agree with the tree: `README.md` states 30 source skills (14 user-facing + 15 workflow internals + 1 metadata-internal; 29 discoverable), `REPLICATE.md` states 29 installable (14 + 15) with both enumerations naming `batch-scheduler` and `runner-contract`, and `SKILLS.md`'s metadata-internal sentence names `skill-lint` and drops the `9-skill` count word | P3 | P3 | direct application (this session) | `bun scripts/skill-surface-counts.mjs` prints the values the three files state, and `rg -c '9-skill' docs/workflow/SKILLS.md` matches 0 | `E` line with the printed table and the count | planned |
| O10 | S4 · PE-004 · PE-005 | The sweep's negative finding is recorded, not invented: `docs/CAPABILITIES.md` renders no skill count, so nothing is pinned there | P3 | P3 | direct application (this session) | `rg -c 'source skills\|user-facing skills\|installable skills' docs/CAPABILITIES.md` matches 0 | `E` line with the count | planned |
| O11 | S10 · PE-008 | The guide budget is re-pinned to the measured block: `machineLines` equals the measured machine-region size and every ceiling passes | P3 | P3 | direct application (this session) | `bun scripts/check-skill-context.mjs --documents` exits 0 and prints `PASS`, with `AGENTS.md`'s measured `machine` cell equal to the manifest's `machineLines` | `E` line with the measured row | planned |
| O12 | S8 · PE-009 · PE-010 | The pair is red-first and tagged: the suite's commit precedes the implementation's, the red run is recorded, and the suite declares its obligation tag | P2 | P2 | direct application (this session) | `bun scripts/red-first.mjs` exits 0 and `bun scripts/test-obligation-tags.mjs` exits 0 | `E` line with both verdicts and both SHAs | planned |
| O13 | S10 · PE-011 · PE-016 | The new script satisfies the repo's structural rules: bun-form usage string with the node fallback, no `node` usage literal, sibling pair present, temp roots tracked | P2 | P2 | direct application (this session) | `bun scripts/invocation-drift.mjs`, `bun test scripts/structural-sibling-pins.test.mjs scripts/temp-hygiene.test.mjs` each exit 0 | `E` line with the three verdicts | planned |
| O14 | S1 · S10 · PE-012 · PE-013 · PE-014 | The state and docs surfaces ship with the change: the unit doc's Evidence/Log current, the roadmap's fix row written through the crate's writer, the session entry a journal fragment with a computed name, and the generated projection re-emitted | P4 | P4 | direct application (this session) | `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check --slug 668-rendered-facts-skill-counts` prints the row, `bun scripts/docs-generate.mjs --check` exits 0, and `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal check`-class validation exits 0 | `E` line with the three outcomes | planned |
| O15 | S10 · regression | Every existing consumer of the changed bytes keeps its previous behaviour: the drift gate's 23 existing cases, the guide budget, the authoring lint, the residue suite and the golden fixture stay green, and no command's stdout/stderr/exit changed for a reason this unit did not ask for | P4 | P4 | direct application (this session) | `bun scripts/local-gate.mjs` exits 0 and `bun scripts/run-root-suite.mjs` exits 0 | `G` lines with both verdicts | planned |

## Triaged steps

> Pasted from `runner unit-route --triage 668-rendered-facts-skill-counts` after the
> unit doc existed; the machine's block is authoritative and the lane never
> re-derives it.

```text
TRIAGE — 668-rendered-facts-skill-counts (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: release: small scope
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
relay: bootstrap-needed — no packet at .pi-web/relays/668-rendered-facts-skill-counts
relay-next: create .pi-web/relays/668-rendered-facts-skill-counts/ (charter → docs/fix/668-rendered-facts-skill-counts/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/668-rendered-facts-skill-counts", leg: "1") · legs: 5 = 4 phases + 1 coherence review
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only; kinds are the closed set in `log-kind@1` (the template's).

- **L1** — 2026-11-21, the issue, verbatim:
  ```
  ## Goal

  Pin every hand-rendered **skill-surface count** in committed documents to `rendered-facts@1` rows that recompute the value from the tree/frontmatter — so a count can never silently rot again. Origin: issue #663 (skill-surface interview); owner verdict 2026-11-20 (approved, "esto sí").

  **Measured evidence**: issue #663 itself was written with stale counts that drifted within a day of its creation — it claimed 13 user-facing skills (14 carry `user-invocable: true`), 29 `SKILL.md` files (there are 30), and 14 reference directories (there are 17). Hand-rendered counts rot; the repo already owns the fix pattern (`rendered-facts@1` in `AGENTS.md`, whose tests **recompute** each claim against its machine source — e.g. `docs/workflow/SKILLS.md`'s user-facing count is already pinned).

  ## In scope

  - A new deterministic script + red-first sibling suite (two commits, `IR4`) that derives the skill-surface counts from the tree: `SKILL.md` file count, `user-invocable: true|false` split from frontmatter, reference-directory count — and any sibling count the design sweep finds rendered by hand.
  - `rendered-facts@1` rows for every committed surface that renders such a count, recomputed against the derived source; a restatement found in review that is not pinned is already a known-issue by the block's own rule — this unit closes the class for skill counts.
  - Surfaces likely carrying the counts today (the design sweep confirms): `README.md` ("The skills" breakdown), `docs/CAPABILITIES.md`, `docs/workflow/SKILLS.md` (its existing row stays, new rows join the same block).

  ## Out of scope

  - No change to any count's prose wording beyond what pinning requires.
  - No new gate step beyond the suite that recomputes the pinned rows (the pattern's existing mechanism is enough).
  - Not a generic "count everything" sweep — scope is the skill-surface counts #663 caught drifting.

  ## Surfaces

  - `AGENTS.md` (`rendered-facts@1` block — new rows)
  - The new script + suite pair under `scripts/` (red commit before green)
  - `README.md`, `docs/CAPABILITIES.md`, `docs/workflow/SKILLS.md` — the counted surfaces
  - `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — only if a touched surface's ceiling moves

  ## Acceptance criteria

  - [ ] The script + suite land red-first (`IR4`): the suite committed alone, observed failing, then the implementation observed green; the unit doc's `## Log` records both runs.
  - [ ] Every committed surface rendering a skill-surface count is either pinned in `rendered-facts@1` (recomputed from frontmatter/tree) or the restatement is deleted.
  - [ ] Root gate green under both runtimes; `normative-drift` green (rows live in the declared block).

  ## Dependencies

  None blocking. Related (same origin, no order): #667 (review-pack preamble extraction) — disjoint surfaces and test-impact sets; no ordering constraint between them.

  ## Open questions / risks

  - Which additional hand-rendered counts exist beyond the three that rotted — the design sweep answers with evidence, not assumption (`IR10`).
  - Whether one `count:` machine serves all rows or per-kind machines are needed (frontmatter split vs tree glob).
  ```
- **D1** — 2026-11-21, owner instruction (the prompt this session runs under): the change is applied **locally and inline** — no `review-change`, no `audit-pr`, no fold cycle on its own surgery; the repository's deterministic gates run anyway. Authority: the run instruction's §4.
- **D2** — 2026-11-21, the sweep's boundary, decided from evidence (`PE-004`, `PE-005`, `PE-007`): **current-state renderings in the narrative docs are pinned; dated recounts in records are not.** A `rendered-facts@1` row recomputes from the current tree, so binding a date-stamped measurement (`docs/ROADMAP.md` row 33, `MIGRATION.md`, changelogs, logs, research and audit notes, unit docs) would make a record change when the tree moves. The review pack's `9` is underivable from the frontmatter (PE-007), so that number is deleted rather than given a machine that would carry a hand-kept exclusion list (`IR10`).
- **D3** — 2026-11-21, the enumerations are part of the count (S5 boundary): `REPLICATE.md`'s "13 user-facing"/"14 internal" lists omit `batch-scheduler` and `runner-contract`, so correcting the numbers alone would leave a sentence that states 14 and lists 13 — the exact contradiction #663 caught in its own text. The lists gain the two names; no other wording moves.

## Next

P1: cut `scripts/skill-surface-counts.test.mjs`, commit it alone, and record the
observed red run.

## References

- Issue [#668](https://github.com/gtrabanco/agentic-workflow/issues/668) — the PR closes it via `Closes #668`.
- Issue [#663](https://github.com/gtrabanco/agentic-workflow/issues/663) and its evidence carrier `docs/research/2026-11-20-issue-663-skill-surface-diagnosis.md` §2 (the measured counts this unit pins).
- `docs/fix/646-docs-skills-reconciliation/` — the precedent for a `count:` machine (`count:packages`) and the carrier shape copied here.

## Branch

`feat/668-rendered-facts-skill-counts`

## Depends on

none

## Regression scope

| Scenario | Verifier |
|---|---|
| Every existing `rendered-facts@1` claim still recomputes (`count:user-facing` on `SKILLS.md`, `count:packages`, `package:version`, the gate-rejection restatement, `package-versions`) | `bun test scripts/normative-drift.test.mjs` (23 existing cases stay green) |
| The drift gate's other directions (text → machine, machine → text, the declared grammars, the identity-value owner) are untouched | same suite |
| The guide still fits its ceilings after twelve rows land | `bun scripts/check-skill-context.mjs --documents` |
| The skill budgets and route budgets are untouched (no `SKILL.md` changes) | `bun scripts/check-skill-context.mjs` and `--routes` |
| The docs projection is current after a file is added under `scripts/` | `bun scripts/docs-generate.mjs --check` |
| The structural rules the new pair must satisfy keep holding for every existing pair | `bun scripts/red-first.mjs`, `bun test scripts/structural-sibling-pins.test.mjs` |
