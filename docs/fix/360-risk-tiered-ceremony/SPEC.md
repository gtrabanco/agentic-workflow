# fix/360-risk-tiered-ceremony

> Fix specification — one single unit document, cut in the re-cut
> `spec-by-reference` shape from `docs/fix/_TEMPLATE/SPEC.md`. Size: **L** —
> the planning ledgers live beside this doc as `planning-evidence.md` and
> `planning-obligations.md` (never both embedded and separate). The frozen
> request is **L1** in `## Log`; every requirement below quotes it verbatim.

## Issue

`#360` — NEW FEATURE: risk-tiered ceremony — computed risk classifier decides
Task Size and tier; passive tier runs inline with zero ceremony. The PR closes
it via `Closes #360`.

## Specs

Requirements numbered `S#`, quoting the issue's own words verbatim. A later
correction is its own id (`S1a`, …) and never rewrites the line it corrects.

**S1 — Direction and owner decision.**
> Land #307 layer 1 for real (direction row 83, owner decision 2026-11-02): ceremony proportional to **risk**, decided by a deterministic classifier — never by the model.

**S2 — Task Size definition.**
> **Task Size** = Understood + Contained risk + Resumable-from-diff (the "resume test"). File counts never decide.

**S3 — The classifier is script-computed from repo evidence.**
> A **script-computed risk classifier** (repo-evidence only: changed/expected paths, surface signals — auth, security, sinks, executable vs non-executable content) emits the tier. The classifier decides the tier, never the model.

**S4 — Determinism-first support.**
> Support: arXiv 2608.09290 (determinism-first review), arXiv 2606.22528 (prose-only rules decay; scripts don't).

**S5 — Three closed tiers.**
> **Tiers:**
>   - `passive` — documentation, images, comments, prose with no executable effect: inline + gate only, **no unit doc ceremony**, verification = structural readback. Zero ceremony for a docs-only request.
>   - `standard` — the current unit-doc ceremony (unit doc, phases, evidence, review).
>   - `high` — requires a *named* high-risk item (auth, destructive ops, CI/publish surfaces).

**S6 — Tiered verification mirrors the tier.**
> Tiered verification mirrors the tier (passive → readback; standard → current gates; high → full review-change).

**S7 — The tier is versioned grammar, never model-emitted.**
> Machine surface: the tier vocabulary and the classifier's output become versioned grammar (normative-surfaces update), emitted by the ceremony CLI (#338) / crate (#352), never model-emitted.

**S8 — Where it lands.**
> - `skills/unit-lane` triage block (Task Size signals), `skills/execute-phase`, `skills/workflow-status`, ceremony CLI sensors.
> - Direction vehicle: #307 / roadmap row 83 (this issue is its implementation unit).

**S9 — Measured acceptance.**
> No prose deletion without the measurement: tokens and wall-clock per unit, per tier, before/after over ≥3 real units. Passive units must measurably skip phases.

**S10 — Non-goals.**
> - No model-emitted command tokens.
> - No ceremony reduction that cannot show its measured delta.
> - #352 (distributable runner) is untouched; the classifier lands as a crate-able module.

## Impact

Callers and consumers of what this unit ships:

| Surface | Why it changes | What consumes it |
|---|---|---|
| `scripts/risk-tiers.mjs` (new) | the classifier itself — pure module, dependency-free | `scripts/ceremony/tier.mjs`, the root suites |
| `scripts/ceremony.mjs` | registry gains the `tier` object (S7: the CLI emits the tier) | any driver invoking the closed ceremony CLI |
| `packages/agentic-workflow-schema/src/vocabularies.ts` | `RISK_TIER_KINDS` + `RISK_TIER_SIGNAL_KINDS` + `RISK_TIER_REASONS` published as the canonical closed sets (S7) | the parity suite, the ceremony CLI, the skills that cite the tier |
| `packages/agentic-workflow-schema/src/index.ts` | the tier verdict joins the envelope as `detail.tier` fields | `scripts/workflow-status.mjs`, drivers reading Envelope v2 |
| `scripts/workflow-status.mjs` | projects the computed tier of the in-flight/next unit (S8) | `next.recommended`'s consumers, `docs/workflow/ORCHESTRATION.md` |
| `skills/unit-lane/SKILL.md` | triage reads the tier and names the Task Size signals (S2, S8) | every lane run |
| `skills/execute-phase/SKILL.md` | the tier decides which ceremony the executor owes (S5, S6) | every executor turn |
| `skills/workflow-status/references/SENSOR_CORE.md` | the sensor's fixed field set gains the tier fields (S8) | the sensor's grammar block |
| `AGENTS.md` (`normative-surfaces@1`) | the tier vocabulary and the classifier's output become inventoried surfaces (S7) | `scripts/normative-drift.test.mjs` |
| `docs/fix/_TEMPLATE/SPEC.md`, `docs/features/_TEMPLATE/SPEC.md` | the passive tier's zero-ceremony output needs a carrier that is not a unit doc (S5) | `template/` mirrors |
| `docs/ROADMAP.md` | row 97 moves `idea` → its implementation unit | `audit-docs`, `workflow-status` |

Live-on-the-other-side: the `packages/agentic-workflow-schema` envelope schema
(`envelope.schema.json`) is generated from `index.ts` and published — touching
it requires re-running its generator, never a hand edit.

## Retirements

Nothing is retired by this unit — it adds a classifier, a CLI module, two
published vocabularies, an envelope detail object and the skill wording that
consumes them. The surfaces it supersedes are **not repurposed**: `next.tier`
(`strong | cheap`, the model-budget tier) and `findings.fix_now[].suggested_tier`
stay exactly as they are, and this unit's `risk tier` (`passive | standard |
high`) is a distinct, separately named field — so no existing consumer of
`next.tier` changes meaning (`grep -rn "next.tier" skills/ scripts/` stays a
model-budget reader).

Evidence that nothing can be removed here: `rg -c 'risk-tiers|RISK_TIER' -g '!node_modules'` → 0 at cut
(no prior art to delete), and the issue's own non-goals (S10) forbid the one
retirement a first slice would otherwise make (no ceremony reduction that
cannot show its measured delta).

## Non-goals

- **No prose deletion without the measurement** (S9): the diff budget of "what
  a passive unit skips" is stated per tier and measured by the lane's own
  `## Log` `P`/`E` lines; no skill prose is deleted in this unit to make room.
- **No model-emitted tier or command token** (S7, S10): the model reads the
  verdict; it never computes or restates it as its own decision.
- **`#352` (distributable runner) untouched** (S10): the classifier lands as a
  plain ES module the crate can wrap later (`scripts/risk-tiers.mjs` imports
  only `node:` modules and exports pure functions).
- **Not the correction budget** (`#362`, roadmap row 99) and **not the
  severity/impact ladder** (`#361`): those own their own vocabularies. This
  unit's tier names risk, never finding severity.
- **Not the orchestrator topology** (`#260`, roadmap row 68): its T0/T1/T2
  definitions are superseded here (the issue's supersession record), but its
  non-executing-orchestrator scope stays open and untouched.
- Nothing is asked of the forge: no label, milestone or issue is created.

## Future

- `open` — 2026-11-02, the supersession record quoted verbatim (S10's sibling
  from the issue's second comment): "#260's remaining scope (non-executing
  orchestrator, context-free subagent dispatch, pruning invariant, the four
  non-negotiables) is **independent and stays open** — its row should drop the
  T0/T1/T2 definitions in favor of this issue's vocabulary when planned."
- `open` — 2026-11-02, the measured acceptance's instrument (S9): "tokens and
  wall-clock per unit, per tier, before/after over ≥3 real units" needs a
  sensor that aggregates per-tier cost; this unit emits the tier and records
  it in the unit doc's `## Log`, but the aggregation over ≥3 units is a
  follow-up with its own evidence. Not implemented here.

## Future cost

- Every new tier token binds three surfaces at once (schema const, the
  ceremony CLI's vocabulary, the `normative-surfaces@1` row) — a future tier
  is a three-file change plus the parity pin, never a prose edit. Binds any
  future unit touching `packages/agentic-workflow-schema/src/vocabularies.ts`.
- `scripts/risk-tiers.mjs` classifies from **repo evidence only** (paths and
  contents the repository can prove). A future "expected paths" input must
  arrive as a declared file list, never as model prose. Binds any future unit
  extending the classifier.
- The passive tier's carrier (this unit's `docs/passive/<id>.md` shape) is the
  only place a passive unit records anything; a future change that wants a
  passive unit to carry a unit doc reopens S5 with the owner.

## Applicable tests

- `scripts/risk-tier-classifier.test.mjs` — the classifier's fixtures and its
  frozen differential corpus (the `#360` frozen-failure corpus).
- `scripts/risk-tier-ceremony.test.mjs` — the ceremony CLI module, the
  `normative-surfaces@1` rows, the sensor fields and the skills' citations.
- `scripts/vocabulary-parity.test.mjs` — the two new published vocabularies.
- `node scripts/run-root-suite.mjs` — the whole root suite, unchanged and green.

## Known pre-existing issues

- **`bun install` is not run in this worktree's CI-equal form**: the root suite
  needs `packages/agentic-workflow-schema/dist/`, built by
  `bun run build` in that package. *does-not-affect* this unit: the cut head
  builds and the suite is green (1416 tests) before the first line of this
  unit's code.
- **`docs/ROADMAP.md` row 97 still reads `idea`** at the cut head.
  *affects* this unit: P6 moves it to its implementation unit (both the row's
  status and its pointer to this folder).

## Tasks

- P1 — Publish the tier vocabularies and the classifier's pure module: `RISK_TIER_KINDS`, `RISK_TIER_SIGNAL_KINDS` and `RISK_TIER_REASONS` in the schema package; `scripts/risk-tiers.mjs` exporting `classifyTier(changedPaths)` and `taskSizeOf(tier)` over repo evidence only (path class + content class: executable vs prose), fail-closed upward (validator: `node --test scripts/risk-tier-classifier.test.mjs` exits 0)
  (Implements: S2, S3, S4, S5, S7)
  Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts, packages/agentic-workflow-schema/src/index.ts, scripts/risk-tiers.mjs, scripts/risk-tier-classifier.test.mjs
- P2 — Emit the tier from the closed ceremony CLI: `scripts/ceremony/tier.mjs` + the `tier` registry entry (`classify --paths <a,b>` and `read --unit <slug>`), JSON on stdout, the CLI's exit contract unchanged (validator: `node --test scripts/risk-tier-ceremony.test.mjs` exits 0 and `node scripts/ceremony.mjs tier classify --paths docs/a.md` exits 0)
  (Implements: S7, S8, S10)
  Relevant files: scripts/ceremony.mjs, scripts/ceremony/tier.mjs
- P3 — Project the tier in the sensor: the envelope's `detail.tier` object for the in-flight/next unit and the `sensor-fields@1` rows that declare it (validator: `node --test scripts/workflow-status-sensor.test.mjs` exits 0 and `node --test scripts/risk-tier-ceremony.test.mjs` exits 0)
  (Implements: S8)
  Relevant files: scripts/workflow-status.mjs, skills/workflow-status/references/SENSOR_CORE.md, packages/agentic-workflow-schema/src/index.ts
- P4 — Bind the tier into the normative inventory and the two skills: one `normative-surfaces@1` row per published surface (the schema export and the CLI's tier block), the lane's Task Size signals and the executor's per-tier ceremony (validator: `node --test scripts/normative-drift.test.mjs` exits 0 and `node --test scripts/risk-tier-ceremony.test.mjs` exits 0)
  (Implements: S1, S2, S5, S6, S7, S8)
  Relevant files: AGENTS.md, skills/unit-lane/SKILL.md, skills/execute-phase/SKILL.md, scripts/risk-tier-ceremony.test.mjs
- P5 — The passive tier's zero-ceremony carrier: both unit-doc templates state the passive shape (a `docs/passive/<id>.md` readback record, no unit doc, no phases), the scaffold mirrors it, and the lane's triage routes a `passive` verdict to it (validator: `node --test scripts/unit-doc-contract.test.mjs` exits 0 and `node --test scripts/risk-tier-ceremony.test.mjs` exits 0)
  (Implements: S5, S6, S9)
  Relevant files: docs/fix/_TEMPLATE/SPEC.md, docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md, template/docs/features/_TEMPLATE/SPEC.md, skills/unit-lane/SKILL.md
- P6 — Register the unit and verify: `docs/ROADMAP.md` row 97 points at this folder, this unit's row is registered in `## Fixes`, every obligation row is verified, and the whole root suite is green (validator: `node scripts/run-root-suite.mjs` exits 0 with `fail 0` and `skipped 0`)
  (Implements: S8, S9)
  Relevant files: docs/ROADMAP.md, docs/fix/360-risk-tiered-ceremony/planning-obligations.md

### Planning evidence

The ledger lives beside this doc as [`planning-evidence.md`](planning-evidence.md)
(M/L size: separate file, never both).

### Obligations

The ledger lives beside this doc as [`planning-obligations.md`](planning-obligations.md)
(M/L size: separate file, never both).

## Acceptance criteria

One observable criterion per `S#`, each naming the check that proves it. This
section is the anchor a review's per-criterion coverage table reads.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 | The tier is computed by a script and never by the model: the classifier exists as a pure module, and its verdict is what every consumer reads (S1, S3) | `node --test scripts/risk-tier-classifier.test.mjs` — the `F1 frozen corpus` case proves the module's presence at head and its absence at the base commit |
| AC-2 | Task Size is Understood + Contained risk + Resumable-from-diff, and file counts never decide (S2) | `node --test scripts/risk-tier-classifier.test.mjs` — the `file counts never decide` case: 400 prose files → `passive`, 1 auth file → `high` |
| AC-3 | The classifier reads repo evidence only — paths and contents, executable vs non-executable, named auth/security/destructive/CI/publish surfaces (S3) | `node --test scripts/risk-tier-classifier.test.mjs` — the `F3b`/`F3d` cases name each surface, and `F6b` refuses a clock, environment read or network call |
| AC-4 | The two papers S4 cites are the ones the repository already recorded | `rg -n '2608.09290\|2606.22528' docs/research/papers-sweep-2026-11-02.md` matches 2 |
| AC-5 | Three closed tiers: `passive` (prose, no unit doc, structural readback), `standard` (the current unit-doc ceremony), `high` (requires a named high-risk item) (S5) | `node --test scripts/risk-tier-classifier.test.mjs` and `node --test scripts/risk-tier-ceremony.test.mjs` — the tier table is the `risk-tier-verdict@1` block and every fixture asserts its branch |
| AC-6 | Verification mirrors the tier: passive → readback, standard → the project's gates, high → the full review pass (S6) | `node --test scripts/risk-tier-ceremony.test.mjs` — the executor case asserts all three branches of the `RISK_TIERS.md` table |
| AC-7 | The tier vocabulary and the classifier's output are versioned grammar, emitted by the ceremony CLI, never model-emitted (S7) | `node --test scripts/vocabulary-parity.test.mjs` and `node --test scripts/normative-drift.test.mjs` exit 0; the CLI refuses a `--tier` input with `unknown-flag` |
| AC-8 | The surfaces the issue names carry the tier: the lane's triage, the executor, the sensor, the ceremony CLI (S8) | `node --test scripts/risk-tier-ceremony.test.mjs` — the lane, executor and sensor cases; `node scripts/workflow-status.mjs` prints `detail.risk_tier` |
| AC-9 | No measurement is claimed without its instrument: the unit records the tier per unit and the ≥3-unit aggregation is a standing, dated obligation (S9) | `rg -n '≥3 real units' docs/fix/360-risk-tiered-ceremony/SPEC.md` matches at least 1 and `node scripts/unit-lineage.mjs --unit 360` exits 0 |
| AC-10 | The non-goals hold: no model-emitted token, no unmeasured prose deletion, `#352`'s crate untouched, the classifier crate-able (S10) | `git status --porcelain packages/` lists only the schema package's two source files; `rg -n "^import" scripts/risk-tiers.mjs` matches only `node:` and the schema source |

## Findings

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-02, the issue, verbatim:
  ```
  ## Summary

  Land #307 layer 1 for real (direction row 83, owner decision 2026-11-02): ceremony proportional to **risk**, decided by a deterministic classifier — never by the model.

  **Task Size** = Understood + Contained risk + Resumable-from-diff (the "resume test"). File counts never decide.

  ## Mechanism

  - A **script-computed risk classifier** (repo-evidence only: changed/expected paths, surface signals — auth, security, sinks, executable vs non-executable content) emits the tier. The classifier decides the tier, never the model. Support: arXiv 2608.09290 (determinism-first review), arXiv 2606.22528 (prose-only rules decay; scripts don't).
  - **Tiers:**
    - `passive` — documentation, images, comments, prose with no executable effect: inline + gate only, **no unit doc ceremony**, verification = structural readback. Zero ceremony for a docs-only request.
    - `standard` — the current unit-doc ceremony (unit doc, phases, evidence, review).
    - `high` — requires a *named* high-risk item (auth, destructive ops, CI/publish surfaces).
  - Tiered verification mirrors the tier (passive → readback; standard → current gates; high → full review-change).
  - Machine surface: the tier vocabulary and the classifier's output become versioned grammar (normative-surfaces update), emitted by the ceremony CLI (#338) / crate (#352), never model-emitted.

  ## Where

  - `skills/unit-lane` triage block (Task Size signals), `skills/execute-phase`, `skills/workflow-status`, ceremony CLI sensors.
  - Direction vehicle: #307 / roadmap row 83 (this issue is its implementation unit).

  ## Measured acceptance (per #307's non-negotiable rule)

  No prose deletion without the measurement: tokens and wall-clock per unit, per tier, before/after over ≥3 real units. Passive units must measurably skip phases.

  ## Non-goals

  - No model-emitted command tokens.
  - No ceremony reduction that cannot show its measured delta.
  - #352 (distributable runner) is untouched; the classifier lands as a crate-able module.
  ```

- **E1** — 2026-11-02, `node --test scripts/risk-tier-classifier.test.mjs` at the base tree `1f527d45` (throwaway copy) · 12 tests, `pass 0`, `fail 12`; the frozen reproducer is `node -e "import('./scripts/risk-tiers.mjs')"` → `ERR_MODULE_NOT_FOUND` (O1).
- **E2** — 2026-11-02, `node --test scripts/risk-tier-ceremony.test.mjs` before the CLI existed · 13 tests, `pass 0`, `fail 13` (O5, O7…O11).
- **P1** — 2026-11-02, published `RISK_TIER_KINDS` / `RISK_TIER_SIGNAL_KINDS` / `RISK_TIER_REASONS` and the pure classifier `scripts/risk-tiers.mjs`; `node --test scripts/risk-tier-classifier.test.mjs` → 13 tests, `pass 13`, `fail 0`; the same file run against the base tree stays `pass 0 / fail 12`, and its `F1` probe passes with `RISK_TIER_BASE` pointed at the base tree.
- **P2** — 2026-11-02, the closed ceremony CLI gained `tier classify|read|plan`; `node scripts/ceremony.mjs tier classify --paths docs/a.md` · exit 0 · `"tier": "passive"`.
- **P3** — 2026-11-02, the sensor projects `detail.risk_tier` and the envelope's `detail` key set is declared; measured on this branch it reads `high` only while the fixture corpus carries a raw deletion call, `standard` otherwise.
- **E5** — 2026-11-02, fixtures before the real tree: a throwaway repo under `mktemp -d` classified eight contrived edges (prose naming a deletion command → `passive`, prose beside an executable → `standard`, extensionless file → `standard`, CI workflow → `high`, lockfile → `standard`), and a written `docs/passive/<id>.md` record parsed back to exactly its five fields. Both are pinned now (`F2b`/`F3b`/`F3d` in the corpus, `C5b` in the ceremony suite).
- **E6** — 2026-11-02, `node --input-type=module -e "import('./packages/agentic-workflow-schema/dist/index.js')…"` · exit 0 · the built package publishes `RISK_TIER_KINDS` (3), `RISK_TIER_SIGNAL_KINDS` (6) and `RISK_TIER_REASONS` (5); `node --test scripts/vocabulary-parity.test.mjs` · 9/9 pass (O6).
- **E7** — 2026-11-02, `node --test scripts/normative-drift.test.mjs` · 20/20 pass with the five new `normative-surfaces@1` rows live (three `schema-export:`, two `block:`); the inventory's must-name direction re-derives the three sets from the verdict grammar (O7).
- **E8** — 2026-11-02, `node scripts/workflow-status.mjs` · exit 0 · `detail.risk_tier` = `{tier, reason, reason_kind, signals[], task_size{…}}`; `node --test scripts/workflow-status-sensor.test.mjs` · 76/76 pass (O8).
- **E9** — 2026-11-02, the lane's step 1a, the executor's per-tier citation and the passive carrier's grammar are pinned by `scripts/risk-tier-ceremony.test.mjs` (`C3`, `C3a`, `C4`, `C5`, `C5a`, `C5b`), and `node --test scripts/unit-doc-contract.test.mjs` stays 19/19 (O9, O10, O11).
- **E10** — 2026-11-02, `node scripts/workflow-status.mjs` prints `next.tier: cheap` unchanged and `git diff 1f527d45 -- scripts/workflow-status.mjs` carries no change to `TIER_MAP` or `suggested_tier` (O12).
- **E11** — 2026-11-02, `git status --porcelain packages/` lists only the schema package's two source files; `rg -n "^import" scripts/risk-tiers.mjs` matches one specifier — the schema vocabulary source. No crate surface touched (O13).
- **E12** — 2026-11-02, `node scripts/run-root-suite.mjs` · exit 0 · `tests 1445 · pass 1445 · fail 0 · skipped 0`; `bun scripts/check-skill-context.mjs` `PASS context budgets: 28 skills`, `--routes` `PASS route budgets: 14 routes`, `--documents` `PASS context documents: 3 budgeted documents` (O14).
- **E13** — 2026-11-02, `rg -c '360-risk-tiered-ceremony' docs/ROADMAP.md` matches 1; `node scripts/unit-route.mjs 360-risk-tiered-ceremony` prints `route: execute` (O16).
- **E14** — 2026-11-02, the unit's `## Future` carries the ≥3-unit aggregation as an open row and no measurement is asserted without its instrument; `classifyObligations` over this unit's ledger answers `{ok: true, count: 17, open: []}` (O17).
- **E15** — 2026-11-02, the differential: `workflow-status.mjs` run against a copy of the base commit and at head differs only by the new `detail.risk_tier` key and the dirty-file count of the three files the test copy added; every pre-existing `detail` key is byte-identical, and the four pre-existing ceremony operations (`unit read`, `docs check`, `ledger read`, `findings read`) print identical stdout and exit codes at both heads (O15).

## Next

External verification by the owner: read the diff and the `## Log` evidence lines, then decide.

## References

- Issue [#360](https://github.com/gtrabanco/agentic-workflow/issues/360) — this unit; the PR closes it via `Closes #360`.
- Direction [#307](https://github.com/gtrabanco/agentic-workflow/issues/307) — roadmap row 83 (`odd-hybrid-direction`).
- Roadmap row 97 (`risk-tiered-ceremony`) — this unit's row.
- `docs/research/papers-sweep-2026-11-02.md` — arXiv 2608.09290 and 2606.22528, the evidence S4 cites.
- Related, untouched: [#352](https://github.com/gtrabanco/agentic-workflow/issues/352) (row 91), [#260](https://github.com/gtrabanco/agentic-workflow/issues/260) (row 68), [#361](https://github.com/gtrabanco/agentic-workflow/issues/361), [#362](https://github.com/gtrabanco/agentic-workflow/issues/362).

## Branch

`fix/360`

## Depends on

none — `#338` (the ceremony CLI) and `#365` are merged at the branch base.

## Regression scope

| Scenario | Verification |
|---|---|
| `next.tier` (`strong`/`cheap`) still derives identically and no consumer reads the new tier as a model budget | `node --test scripts/workflow-status-sensor.test.mjs` exits 0; the tier lives in `detail.risk_tier`, a distinct key |
| `findings.fix_now[].suggested_tier` unchanged | `node --test scripts/workflow-status-sensor.test.mjs` exits 0 |
| the closed ceremony CLI's exit contract (0/1/2) and its closed-world refusal survive the new object | `node --test scripts/ceremony.test.mjs` exits 0 |
| every pre-existing published vocabulary keeps its tokens | `node --test scripts/vocabulary-parity.test.mjs` exits 0 |
| the normative inventory refuses drift exactly as before for every pre-existing row | `node --test scripts/normative-drift.test.mjs` exits 0 |
| the unit-doc contract (re-cut shape) is unchanged for a standard unit | `node --test scripts/unit-doc-contract.test.mjs` exits 0 |
| `phase-lint`, `unit-route` and the root suite keep their behavior | `node scripts/run-root-suite.mjs` exits 0 with `fail 0`, `skipped 0` |
