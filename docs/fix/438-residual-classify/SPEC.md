---
# type: fix | scope: medium | ac-hash: af8d37211bfe0166a35d80d4fbca1ffd4cc4af8aded8eacae699f8ebb60b58eb
---

# fix/438-residual-classify

> Fix specification — one single unit document. Applied through the owner's
> local unpublished workflow (§5 ledger freeze substitutes for the lane's plan
> step); no repo review/fold machinery runs on this change.

## Issue

`#438` — "NEW FEATURE: residual-classify — used / scaffold / half-built /
orphan, decided by the plan, never by rg-zero alone". The PR closes it via
`Closes #438`.

## Specs

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #438

**S2 — Four plan-decided states, never `rg`-zero alone.**
> `residual-classify <surface|symbol>`: a deterministic classifier that answers *"unused — and then what?"* with four states, because **unused is not a property of the code; it is a property of the plan**:
>
> ```text
> used      live consumer in the tree (rg > 0)
> andamio   no consumer yet, but a roadmap row / open unit / recorded forward promise names it
> half-built    an open unit introduced it with unmet P<n> tasks → resume, not retire
> orphan    nothing in the plan claims it → retire is legitimate here
> ```

**S3 — Consult order, path receipts, fail-closed ambiguity.**
> 1. The classifier consults, in order: live-tree consumers; roadmap rows; open unit docs and their tasks; forward promises in `decisions.md`; charter planned-work rows (soft-dep below). Every conditional carries the path it consulted; fail-closed on ambiguity: `ambiguous` instead of a guess.

**S4 — Named planned consumer, recorded at plan time.**
> 2. `andamio` and `half-built` require the *named planned consumer* to be recorded at plan time (the forward-closure deliverable); the classifier never infers intentions.

**S5 — Additive units carry a computed surface inventory.**
> 3. It replaces the prose `## Retirements` section in strictly additive units: those units record a computed surface inventory (manifest, diff-derived) as the anti-divergence receipt, and the prose section survives only for units that genuinely retire something.

**S6 — A retire leaves the receipt plus the dated decision.**
> 4. Retire verdicts always leave the recorded receipt + the dated decision, so a later feature can *reclaim* the retired name with evidence.

**S7 — `orphan` is the only retire-legitimate state.**
> - Binding note 2026-11-06: `residual-classify` is the deterministic input of the triage **removal verdict** (#307 design note 11) — `orphan` is the only retire-legitimate state, `andamio` binds the retiral behind the recorded planned-consumer promise, `half-built` routes to resume. **No standing REMOVED/retire section is added**: a removal grammar exists only when a triage verdict pays for it (never section-ritual); when the verdict is *remove*, the doc delta is its *record*, not its cause.

**S8 — Carriers.**
> `scripts/` (classifier; sibling suite per red-first rule), `skills/unit-lane/references/DESIGN.md` + SPEC template (retirements section replacement), `ceremony-profile@1` consumer (soft-dep #436).

**S9 — Cite-sources clause.**
> Adopted knowledge → `docs/research/ATTRIBUTION.md` row in the implementing PR.

**S10 — Regression bound.**
> **Differential check**: run each touched command against a copy of the base commit (in `mktemp -d`, never committed) and against the change; any stdout/stderr/exit difference nobody asked for is a regression — fix and pin it.

## Decisions

**D1 — Consult order is S3's; state precedence is `used` → `half-built` →
`andamio` → `orphan`** (authority: S3's sentence plus S2's own definitions —
`andamio`/`half-built` are defined as "no consumer yet", so a live consumer
outranks both; an unmet task is a stronger plan claim than a roadmap row, so
`half-built` outranks `andamio`). Every classification carries one receipt row
per consulted surface, in S3's order, each with `result` (`consumer` / `claim` /
`unmet` / `met` / `none` / `absent` / `unreadable`) and the sorted `path:line`
evidence. A surface that could not be read is `unreadable`, never `none`.

**D2 — `used` reads *executable* consumers, not documentation mentions**
(authority: S2's `rg > 0`, narrowed because S2's `andamio` is defined as "a
roadmap row / open unit / recorded forward promise names it" — if a prose
mention counted, every planned surface would classify `used` and `andamio`
would be unreachable). The scan is `rg --fixed-strings --line-number
--no-heading` (grep fallback when rg is absent, the repo's documented tool
order), over the tree minus `docs/`, `**/*.md`, `.git/`, `node_modules/`,
`.agentic-workflow/`, `.worktrees/`, and minus the target's own file when the
target is a path. Evidence is capped at the first 5 sorted `path:line` sites.

**D3 — A forward promise is a declared grammar, never inferred prose**
(authority: S4's "the *named planned consumer* … recorded at plan time" and
"never infers intentions"). The block lives in a unit folder's `decisions.md`:

```text
residual-promise@1
surface | consumer | date | owner
```

`consumer` resolves offline to exactly one of `unit:<unit-folder-path>` or
`row:<NN>`; anything else (a bare issue number, a sentence) is a malformed
row and refuses as `ambiguous`. A promise whose consumer does not resolve to an
existing open unit / open roadmap row is `ambiguous` too — an unverifiable
consumer is not a guess. The block is published where the classifier reads it,
registered in `normative-surfaces@1`, and taught by the template's Retirements
section.

**D4 — `half-built` reads the existing tick grammar, not a second one**
(authority: S2's "an open unit introduced it with unmet `P<n>` tasks"). A unit
folder is *open* when it has no roadmap row or its row's status is non-terminal
(`done`, `declined`, `folded`, `wontfix` are terminal). A task names the target
when its bullet text does; it is *unmet* when the bullet carries no `[x]`. The
parse is `parseTasks` from `scripts/ceremony/lib.mjs` (the tick owner), so the
classifier adds no second reading of `## Tasks`. An open unit whose naming
tasks are all ticked classifies `andamio`, never `half-built` — the work is
scheduled and underway, not abandoned.

**D5 — A roadmap row claims only while it is non-terminal** (authority: S2's
"a roadmap row … names it" + the roadmap's own status machine). A `done` row
whose surface has no live consumer is *exactly* the speculative-generality case
`orphan` names; treating it as a claim would make retirement impossible for
delivered-but-unconsumed code. `## Features` and `## Fixes` rows both count;
the row's slug and summary cells are searched, never its dependency cell.

**D6 — The charter surface is read only where it exists** (authority: S3's
"charter planned-work rows (soft-dep below)" + its own soft dependency on
#435). The classifier reads the guide's `## Project charter` section for a
table whose heading matches `planned work` (case-insensitive); a project with
no such section records `absent` in the receipt and the surface contributes no
claim. `absent` is a declared degradation, never `none`-as-empty and never a
guessed claim.

**D7 — `--inventory` is the diff-derived manifest S5 replaces the prose with**
(authority: S5's "computed surface inventory (manifest, diff-derived) as the
anti-divergence receipt"). One row per surface the unit adds: every added
non-documentation file and every added `export` symbol in a changed `.js`/
`.mjs`/`.ts` file, read from `git diff --name-only --diff-filter=A` and
`git diff -U0` against `--base <rev>`. Each row carries the state the
classifier computes for it, so an `orphan` in an "additive" unit is visible at
plan time instead of passing as an empty Retirements section.

**D8 — Exit codes are part of the contract** (authority: S3's fail-closed
rule). `0` = a classified state (`used`, `andamio`, `half-built`, `orphan`);
`1` = `ambiguous` (the refusal that needs a human, still printed as the machine
document); `2` = usage error. `--receipt` prints the recorded receipt plus the
dated decision row only for `orphan`, and refuses (`1`) for every other state
— S7's "only retire-legitimate state", mechanized.

**D9 — Nothing here consults the forge or a clock** (authority: this repo's
determinism rule and S10's differential requirement). No `gh` call, no
`Date.now()`: `--receipt --date <YYYY-MM-DD>` supplies the date the decision
row carries, and every other input is the tree plus the git history.

## Impact

- **`scripts/residual-classify.mjs`** (new): the classifier (`classify`,
  `parsePromises`, `parseCharterPlannedWork`, `consultedSurfaces`,
  `inventoryFromDiff`, `renderReceipt`) and the CLI.
- **`scripts/residual-classify.test.mjs`** (new): the red-first sibling suite —
  one case per requested rule, the fixture corpus under
  `scripts/fixtures/residual-classify/`, the differential and determinism pins.
- **`skills/unit-lane/references/DESIGN.md`**: the Retirements bullet now says
  what a strictly additive unit answers instead of a prose retirement, and
  points at the classifier as the receipt's producer. The retirement rule
  itself (replacement or no-consumer evidence, "why nothing can be removed")
  is unchanged.
- **The four unit-doc templates** (`docs/features/_TEMPLATE/SPEC.md`,
  `docs/fix/_TEMPLATE/SPEC.md`, `template/docs/features/_TEMPLATE/SPEC.md`,
  `template/docs/fix/_TEMPLATE/SPEC.md`): the `## Retirements` body carries
  S5's additive-unit answer and S7's `orphan`-only rule. Section names and
  order are untouched, so `unit-doc-contract` and `scaffold-parity` keep
  reading the same shape.
- **`AGENTS.md`**: one `normative-surfaces@1` row for `residual-promise@1`
  (D3), so the declaration the classifier reads is a declared surface.
- **`docs/research/ATTRIBUTION.md`**: S9's row.
- **`docs/ROADMAP.md`**: feature row 438's status cell and a `## Fixes` row —
  hand edits, because no emitter writes fix rows (`docs-generate.mjs` appends
  feature rows and never fix rows; PE-009).
- **`docs/LOGS.md`**: this session's entry.
- **Nothing live is touched**: the classifier is a read-only script and is
  never run against this repository's live tree during the change; every
  fixture run is a throwaway tree under `mktemp -d`, removed after.

## Retirements

- **The prose-only `## Retirements` answer for a strictly additive unit**: its
  replacement is the computed inventory D7 emits; no-consumer evidence for the
  retired rule is the template text itself (`rg -c 'strictly additive'
  docs/features/_TEMPLATE/SPEC.md` → 1) and the pin
  `residual-classify.test.mjs`'s "templates teach the additive answer".
- Nothing else is removed. The negative-capability pin for a genuine
  retirement, the "why nothing can be removed" reason, `unit-doc-contract`'s
  `## Retirements` requirement, and the design step's retirement declaration
  all stay (S8 names the DESIGN.md bullet as the surface that changes, not the
  rule).

## Non-goals

- No `rg`-zero verdict anywhere: the classifier never retires on a zero match
  alone (S2, S7).
- No forge read, no clock read, no network (D9).
- No second task-tick parser (D4) and no second roadmap reader (the crate's
  `index-document.mjs` owns the table grammar; D5 reuses it).
- No `REMOVED`/retire section in any template (S7): the removal grammar lands
  only when a triage verdict pays for it.
- No consumer re-implementation for #440's product-audit dimensions: this unit
  publishes the four states as the one home; #440 reads them.
- No change to `ceremony-profile@1`'s piece vocabulary (S8 names it a soft
  dependency only; #436 owns whether the prose section survives in a given
  project).

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`
- **Named high-risk item** — `none — not a high-tier unit`

Verdict (`bun scripts/ceremony.mjs tier classify --base 43e8c1f9 --paths
scripts/residual-classify.mjs scripts/residual-classify.test.mjs
docs/fix/438-residual-classify/SPEC.md skills/unit-lane/references/DESIGN.md
docs/fix/_TEMPLATE/SPEC.md docs/features/_TEMPLATE/SPEC.md
template/docs/fix/_TEMPLATE/SPEC.md template/docs/features/_TEMPLATE/SPEC.md
AGENTS.md docs/research/ATTRIBUTION.md docs/ROADMAP.md`, at the cut head
`43e8c1f9`):

```json
{"contract":"risk-tier-verdict@1","tier":"standard","reason":"1 path(s) carry executable content: scripts/residual-classify.mjs","reason_kind":"executable-content","task_size":{"understood":true,"contained_risk":"contained","resumable_from_diff":true,"ceremony":"unit-doc","verification":"gates"},"signals":[]}
```

## Future

none

## Future cost

- **The promise grammar is a durable contract.** A project that records
  `residual-promise@1` rows owes their consumer cells a real path/row: a
  consumer that is renamed leaves a promise that refuses as `ambiguous`
  (fail-closed by design, D3), so a rename sweep must carry the promise rows.
- **The consumer scan is path-based.** A target whose name is a substring of
  more common identifiers can report a consumer the author did not intend; the
  evidence sites are printed, so a reader judges them — the classifier never
  re-ranks by "looks like a consumer".
- **`--inventory` reads the diff, so it is only as complete as the base ref.**
  A unit whose base is behind `main` sees other units' additions as "not
  added"; the row is a manifest of *this* change, never a repository audit.
- **#440's product-audit dimensions must read this vocabulary, not a copy.**
  Two vocabularies would split the meaning of `andamio` the same way #460's
  parser split the dependency shape.

## Applicable tests

`bun test scripts/residual-classify.test.mjs` (red first per §2/§6), `bun
scripts/red-first.mjs` (the pair's two-commit ordering), `bun
scripts/check-skill-context.mjs`, `bun test scripts/normative-drift.test.mjs`,
`bun test scripts/scaffold-parity.test.mjs`, `bun test
scripts/unit-doc-contract.test.mjs`, `bun scripts/docs-generate.mjs --check`,
`bun scripts/roadmap-settle.mjs` and the root gate (`bun
scripts/local-gate.mjs`) before handoff.

## Known pre-existing issues

- The worktree `feat/438-new-feature-residual-classify` starts with no
  `node_modules` and no schema `dist/`, so any suite resolving the schema
  runtime fails (`Cannot find module …/dist/index.js`) until `bun install
  --frozen-lockfile` + `cd packages/agentic-workflow-schema && bun run build`.
  Does-not-affect: this unit — both ran before the baseline (PE-006).
- The `## Fixes` table has a malformed row shape in places (a row separated
  from the table body by a blank line, e.g. `#495`/`#500`), and
  `docs/ROADMAP.md`'s feature rows are not all at a pipeline status. **Affects**
  this unit's D5 reader: it reads live table rows through the crate's
  `roadmapTableRows`, so a row outside a live table is not a claim — a declared
  limitation, not a silent one.
- `scripts/precondition-closure.test.mjs` exists with no
  `scripts/precondition-closure.mjs` (a test-only pilot of #433's closure
  prose). Does-not-affect: nothing here pairs with it.

## Acceptance criteria

- **AC-S1** — The unit is applied through the owner's local workflow: the
  ledgers exist beside this SPEC, no repo review/fold machinery ran, and the
  work lands as conventional commits. Check: `ls
  docs/fix/438-residual-classify/` lists `SPEC.md`, `planning-evidence.md`,
  `planning-obligations.md`; `git log --oneline origin/main..HEAD` shows the
  unit's own conventional commits.
- **AC-S2** — The four S2 states are produced by the plan surfaces, never by a
  zero match alone: a live consumer → `used`; an open roadmap row / open unit /
  recorded promise naming the target → `andamio`; an open unit with an unmet
  task naming it → `half-built`; nothing → `orphan`. Check: the `C1`–`C5`
  tests exit 0.
- **AC-S3** — Every classification carries a receipt row per consulted
  surface in S3's order, each naming the path it read, and an unreadable
  surface refuses as `ambiguous` instead of guessing. Check: the `R1`–`R3`
  tests exit 0.
- **AC-S4** — `andamio` and `half-built` require a recorded named consumer:
  no prose sentence produces a claim; a promise with an unresolvable consumer
  is `ambiguous`; an open unit whose naming tasks are all ticked is `andamio`,
  not `half-built`. Check: the `P1`–`P3` and `H2` tests exit 0.
- **AC-S5** — A strictly additive unit answers `## Retirements` with the
  computed, diff-derived inventory, and all four unit-doc templates teach that
  answer while keeping the "why nothing can be removed" reason. Check: the
  `I1`/`I2` and `T1` tests exit 0; `bun test scripts/scaffold-parity.test.mjs`
  and `bun test scripts/unit-doc-contract.test.mjs` exit 0.
- **AC-S6** — `--receipt` prints the recorded receipt plus the dated decision
  row for an `orphan` and refuses every other state, so a later feature can
  reclaim the name with the recorded evidence. Check: the `X1`/`X2` tests exit
  0.
- **AC-S7** — The state vocabulary is the triage removal verdict's input:
  `orphan` is the only state `--receipt` accepts, and no template gains a
  standing `REMOVED` section. Check: the `X1`/`X2` and `T1` tests exit 0.
- **AC-S8** — The carriers S8 names carry the change: the classifier + sibling
  suite in `scripts/`, the DESIGN.md bullet, the four templates, and the
  registered `residual-promise@1` surface. Check: `bun test
  scripts/normative-drift.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs`
  exits 0.
- **AC-S9** — The adopted knowledge is attributed. Check: `rg -n
  'residual-classify|Speculative Generality' docs/research/ATTRIBUTION.md`
  matches the unit's row.
- **AC-S10** — Nothing else moved: the base-vs-change differential of every
  touched command differs only in the declared deltas. Check: the `F1`
  differential test exits 0 and the `## Log` records the run.

## Tasks

- P1 — Freeze the planning ledgers from the issue's verbatim text (validator:
  `ls docs/fix/438-residual-classify/` lists SPEC.md, planning-evidence.md,
  planning-obligations.md) (Implements: S1, S3, S4, S5, S6)
  - Relevant files: docs/fix/438-residual-classify/
- P2 — RED corpus: the fixture tree and one failing test per requested rule
  (`scripts/residual-classify.test.mjs`), observed failing on the missing
  module before any implementation (validator: `bun test
  scripts/residual-classify.test.mjs` exits non-zero on every new test)
  (Implements: S2, S3, S4, S5, S6, S7, S10)
  - Relevant files: scripts/residual-classify.test.mjs,
    scripts/fixtures/residual-classify/
- P3 — Script: the classifier core — `classify` over the five consult surfaces
  in S3's order, the state precedence and the receipts (D1–D6), the
  `residual-promise@1` reader (D3), the diff-derived inventory (D7) and the
  receipt/exit contract (D8/D9) (validator: `bun test
  scripts/residual-classify.test.mjs` exits 0) (Implements: S2, S3, S4, S6)
  - Relevant files: scripts/residual-classify.mjs
- P4 — Docs: the templates' `## Retirements` answer (S5/S7), the DESIGN.md
  bullet, the `residual-promise@1` registration in `normative-surfaces@1`
  (validator: `bun test scripts/unit-doc-contract.test.mjs` exits 0 and `bun
  test scripts/normative-drift.test.mjs` exits 0) (Implements: S5, S7, S8)
  - Relevant files: docs/features/_TEMPLATE/SPEC.md, docs/fix/_TEMPLATE/SPEC.md,
    template/docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md,
    skills/unit-lane/references/DESIGN.md, AGENTS.md
- P5 — Repository state in the same change: the ATTRIBUTION row (S9), the
  roadmap feature row + `## Fixes` row (hand edits — no emitter writes fix
  rows), the changeset intent, the `docs/LOGS.md` entry, the generated
  projection through the renderer (validator: `bun scripts/docs-generate.mjs
  --check` exits 0 and `bun scripts/lint-changeset.mjs` exits 0) (Implements:
  S1, S9)
  - Relevant files: docs/research/ATTRIBUTION.md, docs/ROADMAP.md, .changeset/,
    docs/LOGS.md, docs/generated/
- P6 — Verification: the differential run base-vs-change, the declared
  deterministic gates in the foreground, every obligation closed (validator:
  `bun scripts/local-gate.mjs` exits 0) (Implements: S1, S10)

### Planning evidence

M/L unit: the ledger lives in this folder's
[`planning-evidence.md`](planning-evidence.md) — one row per Engineering claim.

### Obligations

M/L unit: the ledger lives in this folder's
[`planning-obligations.md`](planning-obligations.md) — one row per normative
behaviour, compatibility invariant, affected use case, and required failure
state.

## Triaged steps

n/a — applied inline per the owner's instruction (S1): the §5 ledger freeze
substitutes for the lane's plan step, and no repo machinery runs on this
surgery.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-11, the request, verbatim:
  ```
  Apply to this repository: issue #438
  ```
- **L2** — 2026-11-11, the issue, verbatim (title, the four-state summary, the
  four expected behaviours, the carriers, the cite-sources clause and the
  binding triage note) — carried in `## Specs` as S2–S9 above.
- **L3** — 2026-11-11, intent resolved from state before acting: `proceed` —
  the branch carried no commits of its own (`HEAD 43e8c1f9` = `origin/main`),
  no unit folder existed, the roadmap row read `idea`, so the next incomplete
  phase was P1.
