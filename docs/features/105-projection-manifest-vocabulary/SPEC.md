---
type: feature
scope: medium
---

# 105 — projection-manifest-vocabulary

> The one machine home for the workflow-projection contract: closed vocabularies
> (seams, ops, selector kinds, hash algorithms, guard verdicts), the
> projection-manifest rule grammar, the guard-verdict message contract, and the
> published Draft-07 projections — types and validation only, zero behavior.

## Issue

`#406` — tracked issue in the project's forge. The PR must close it via
`Closes #406` in the body.

Roadmap row: **105 `projection-manifest-vocabulary`** (first unit of the
projection chain). This unit was cut locally, under the owner's direct-application
workflow for changes to this repository itself, without the lane's own review
machinery. The folder is feature-numbered (`105`) so it pairs with its roadmap row;
the issue it closes is #406.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.

**S1 — Goal: the type foundation.**
> Type foundation for the pi-projection work: the closed vocabularies and the projection-manifest grammar that four planned units (stripper, pi guards, pi seam-hooks, pi prereq) consume, so none of them renegotiates grammar independently. Pure types + schemas — zero behavior.

**S2 — Business value.**
> One machine home for the workflow-projection contract; prevents grammar drift across the four consumers (the repo's schema-first pattern).

**S3 — Seam names.**
> Seam names (`phase:end`, `pre:commit`, …) as a closed vocabulary.

**S4 — Projection-manifest grammar.**
> Projection-manifest grammar: ops `remove` / `pointerize` / `prereq`; selectors (heading path, `headingRegex`, line-in-scope / `lineRegex`); per-rule content-hash binding over the exact removed bytes.

**S5 — Guard-verdict vocabulary.**
> Guard-verdict vocabulary (the fail-closed rejection message contract).

**S6 — Normative-surface registrations.**
> Normative-surface registrations in `normative-surfaces@1` for every new machine grammar above.

**S7 — Schemas + version bump.**
> TypeBox schemas + version bump in `packages/agentic-workflow-schema` (stays dependency-free).

**S8 — Out of scope.**
> Any runtime behavior; pi code; the stripper transform (own issue); the locator (own issue).

**S9 — Acceptance: validate/reject.**
> Schemas validate a valid manifest fixture and reject: ambiguous selector (0 or >1 matches is a runtime check, but schema rejects malformed rules), unknown op, unknown seam.

**S10 — Acceptance: exported + parity-tested.**
> New vocabularies exported and imported by version-parity tests.

**S11 — Acceptance: inventory + drift gate.**
> `normative-surfaces@1` rows added; drift gate passes.

**S12 — Dependencies.**
> None. First issue of the projection chain.

**S13 — Recorded risk.**
> Exact seam-name set may grow when the seam-hooks dispatcher lands; vocabulary is a closed set — additions need a schema bump (deliberate friction).

### S7 resolution (owner answer, 2026-11-07)

S7's two clauses conflict literally: a TypeBox schema needs TypeBox at build or
run time, and this package declares no `dependencies`. The owner asked for the
dependency inventory before a new one entered, then chose the repository pattern:

> A — repo pattern (my recommendation): descriptor + hand-written validators + generated Draft-07 projection + ajv fixture parity

Applied: the schema package stays dependency-free (no `dependencies`, no
devDependency added), the contract is a hand-written TS type set plus validators
in `src/projection.ts`, and two hand-maintained Draft-07 projections
(`projection-manifest.schema.json`, `guard-verdict.schema.json`) ship beside it
with the `ajv` fixture parity the package already uses for `envelope.schema.json`
and its four peers. The version bump is the release intent (a `.changeset/`
file) — this repository never hand-bumps package versions; `scripts/release.mjs
apply` stamps the train version at cut.

## Acceptance criteria

One observable criterion per requirement, each naming the check that proves it.

1. **S1** — the contract lives only in `packages/agentic-workflow-schema`
   (`src/vocabularies.ts`, `src/projection.ts`, the two schema files); no crate,
   pi-package or skill source changes. Check: `git diff --name-only origin/main...HEAD --
   packages/agentic-workflow packages/pi-agentic-workflow skills` prints nothing.
2. **S2** — every vocabulary has exactly one declaration, in
   `src/vocabularies.ts`, and one machine binding in `normative-surfaces@1`.
   Check: `bun test scripts/normative-drift.test.mjs` exits 0.
3. **S3** — the seam set is non-empty, closed and exported; an unknown seam is
   refused. Check: `bun test packages/agentic-workflow-schema/test/projection.test.mjs`
   exits 0 (the `unknown seam` case).
4. **S4** — the manifest grammar covers the three ops, the four locator selector
   forms, the keep-list and the per-rule `sha256:<64 hex>` content hash; a valid
   fixture validates. Check: the same suite's `valid manifest` case exits 0.
5. **S5** — a guard verdict is one of `allow | block | degrade` and a rejection
   carries reason, requirement, enforcing command and message; `degrade` names
   its declared fallback. Check: the same suite's guard-verdict cases exit 0.
6. **S6** — each new vocabulary has a `schema-export:` row in
   `normative-surfaces@1`. Check: `bun test scripts/normative-drift.test.mjs` exits 0,
   and `rg -c "schema-export:(PROJECTION_SEAMS|PROJECTION_OPS|PROJECTION_SELECTOR_KINDS|PROJECTION_HASH_ALGORITHMS|GUARD_VERDICTS|GUARD_REJECTION_REASONS)" AGENTS.md`
   matches 6.
7. **S7** — the two schemas are exportable and packed, and the release intent is
   a valid changeset declaring the schema package. Check:
   `npm pack --dry-run --json` in the package lists both; `bun scripts/lint-changeset.mjs
   .changeset/406-projection-manifest-vocabulary.md` exits 0.
8. **S8** — no runtime behavior ships outside the schema package. Check: same
   path diff as criterion 1.
9. **S9** — `ajv` validates the valid fixture against both published schemas and
   each malformed fixture is rejected by schema and validator alike (unknown op,
   unknown seam, two selector forms, no selector form, `within` on a non-line
   selector, an invalid regex, a malformed hash). Check: the parity cases in the
   same suite exit 0.
10. **S10** — the new vocabularies are exported by the package and imported by
    the root vocabulary-parity suite. Check:
    `bun test scripts/vocabulary-parity.test.mjs` exits 0.
11. **S11** — the deterministic gate passes. Check: `bun scripts/local-gate.mjs`
    exits 0 (recorded in the `## Log` `G` line).
12. **S12** — no dependency is added to the schema package. Check:
    `rg -c '"dependencies"' packages/agentic-workflow-schema/package.json` matches 0
    and `bun install --frozen-lockfile` exits 0.
13. **S13** — the seam set is published as the single closed list, so growing it
    is a schema-const change with a failing `unknown seam` test until the const
    changes. Check: the `unknown seam` case plus the drift gate's
    `value-not-named` direction exit 0.

## Impact

- **Deliverables consumed later, not by this unit:** #409 (gate-receipt envelope,
  separate contract), #410 (stripper consumes `PROJECTION_OPS`, the selector
  grammar and `contentHash`), #412 (guards consume `GUARD_VERDICTS` and the
  rejection message contract), #413 (seam-hooks consume `PROJECTION_SEAMS`), #414
  (`prereq` entries consume the op and `enforcingCommand`). None of them ships here.
- **`packages/agentic-workflow-schema` gains two published contracts** (source,
  schemas, README grammar) and no dependency; its `exports`/`files` lists grow.
  Every existing contract and suite is untouched.
- **The root drift gate** gains six inventory rows that read the new consts from
  committed source; its must-name set grows by the same six names.
- **The root vocabulary-parity suite** imports the six sets, which turns "the
  package exports it" into a checked fact (S10).
- **The runner crate, the pi package, the skills and the locator are untouched**
  (S8): the selector grammar is *cited* from #407's shipped `SectionSelector`, not
  re-implemented there.
- **The roadmap** row 105 moves to `in-progress` with this unit's link, and the
  generated unit projection records it.

## Retirements

Nothing is retired: this unit only adds. `rg -c 'PROJECTION_SEAMS|PROJECTION_OPS|GUARD_VERDICTS'
packages/ skills/ docs/` → 0 at the cut head, so no predecessor surface exists to
delete. The one *claim* this unit corrects is S7's own wording: "TypeBox schemas"
is delivered as the package's schema contract (owner answer above), recorded here
rather than edited out of the verbatim quote.

## Non-goals

- S8 in full: no runtime behavior, no pi code, no stripper transform, no locator
  changes.
- No new dependency and no devDependency in the schema package.
- No hand-bumped version: the release intent is a changeset.
- No generated projection (no generator, no `--check` step): these two schemas
  follow `envelope.schema.json`'s hand-maintained pattern, pinned by an `ajv`
  parity test.
- No second selector grammar: the manifest selector is the JSON subset of
  #407's `SectionSelector`, and the parity case proves it.
- Findings discovered during implementation never expand this unit.

## Risk tier

Computed, never chosen:

```text
$ bun scripts/ceremony.mjs tier classify
"tier": "standard"
"reason": "the change names no path, so nothing proves it inert — fail closed upward"
```

- **Tier** — `standard` · **Task Size** — understood · contained risk · resumable from diff
- **Named high-risk item** — none — not a high-tier unit

## Future

- The seam set grows (`skill:invoke`, `command:invoke`, …) when #413 lands its
  dispatcher; S13 records that as deliberate friction, not a prose edit. **open**
- A consumer that hashes the removed range must use #407's `byteStart`/`byteEnd`
  (UTF-8), never the UTF-16 offsets; a future unit may publish a shared
  `contentHash` helper once a second consumer exists. **open**

## Future cost

- Every new seam, op, selector kind, hash algorithm or guard verdict requires a
  schema-const change plus a `normative-surfaces@1` row in the same PR — this
  binds #410–#414 and any future projection consumer.
- Both published schemas are hand-maintained: a change to the contract must move
  the TS types, the validators, the schema file and the fixture matrix together,
  or the `ajv` parity case fails.

## Applicable tests

- `packages/agentic-workflow-schema/test/projection.test.mjs` — the contract
  suite (vocabularies, selector grammar, manifest validation, guard verdict,
  schema parity, fixture matrix, README vocabulary parity).
- `scripts/vocabulary-parity.test.mjs` — imports the six new sets (S10).
- `scripts/normative-drift.test.mjs` — the inventory rows resolve (S6, S11).
- `scripts/prose-gate-inventory.test.mjs` — every new normative surface is
  claimed by an inventory row.
- `packages/agentic-workflow-schema` `bun run test` / `bun run test:node` — the
  whole package under both runtimes.
- `bun scripts/local-gate.mjs` — the repository gate.

## Known pre-existing issues

- The schema package's five hand-maintained schemas have no `--check` drift
  guard, unlike the four generated projections; this unit joins that pattern
  deliberately. **does-not-affect** (recorded as a future cost).
- The full local gate's `pi-compat-guard` step is red at `origin/main` too: its
  peer-floor install pulls the published `@gtrabanco/agentic-workflow` 1.x, whose
  `src/` has no `log/render.mjs` / `log/publish.mjs`, so the type-check fails
  before this change can reach it. Re-produced in a detached `origin/main`
  worktree with the same three `TS2307` errors. **does-not-affect** this unit: the
  offline subset (`--skip-network`) is the unit's gate, and no file this unit
  touches participates in that step.

## Tasks

- P1 — Freeze the ledgers, then add the six vocabularies and the contract module
  with its red-first suite and fixture matrix.
  (validator: `bun test packages/agentic-workflow-schema/test/projection.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S9, S13)
  Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts, packages/agentic-workflow-schema/src/projection.ts, packages/agentic-workflow-schema/src/index.ts, packages/agentic-workflow-schema/test/projection.test.mjs, packages/agentic-workflow-schema/test/fixtures/projection/
- P2 — Publish the two Draft-07 projections, wire `exports`/`files`, document the
  two versioned grammars in the package README, and pin the schema↔validator
  parity.
  (validator: `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S4, S5, S7, S9)
  Relevant files: packages/agentic-workflow-schema/projection-manifest.schema.json, packages/agentic-workflow-schema/guard-verdict.schema.json, packages/agentic-workflow-schema/package.json, packages/agentic-workflow-schema/README.md
- P3 — Register every new machine grammar in `normative-surfaces@1` and in the
  prose-gate inventory, import the sets in the vocabulary-parity suite, and add
  the release intent.
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S6, S10, S7)
  Relevant files: AGENTS.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, docs/workflow/GATE_INVENTORY.md, scripts/normative-drift.test.mjs, scripts/vocabulary-parity.test.mjs, .changeset/406-projection-manifest-vocabulary.md
- P4 — Move roadmap row 105 to in-progress with this unit's link and regenerate
  the docs projection.
  (validator: `rg -c '406-projection-manifest-vocabulary' docs/ROADMAP.md` matches 1)
  (Implements: S1, S11)
  Relevant files: docs/ROADMAP.md, docs/generated/units.md
- P5 — Run the package suites under both runtimes and the repository gate.
  (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S7, S11, S12)
  Relevant files: packages/agentic-workflow-schema

### Planning evidence

The frozen ledger is `planning-evidence.md` beside this document (M/L shape).

### Obligations

The frozen ledger is `planning-obligations.md` beside this document (M/L shape).

## Triaged steps

Cut locally by the owner's direct-application workflow for changes to this
repository: plan, implement, hand the diff back. The lane's own triage and review
machinery is deliberately not run on this unit.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **2026-11-07 — cut.** Requested `S1..S13` extracted verbatim from issue #406.
  Two ambiguities asked and answered: S7 → repository pattern (no TypeBox, owner
  answer quoted in §S7 resolution); home → the features route. The folder is `docs/features/105-projection-manifest-vocabulary/`:
  `roadmap-settle` pairs a feature folder's number with its `## Features` row,
  and row 105 is the index entry this unit fills (the `96-prose-gate-inventory`
  precedent — a feature number, not an issue number).
  Frozen: 13 acceptance criteria, 13 planning-evidence rows, 15 obligation rows.
- **2026-11-07 — cut-time correction.** The obligations' O10/O11 validators named
  `bun scripts/<file>` for two `node:test` suites; the repository's invocation is
  `bun test scripts/<file>`. Corrected before any status flip (no validator had
  run yet), and the same spelling corrected in the acceptance criteria.
- **E1** — 2026-11-07, `bun test packages/agentic-workflow-schema/test/projection.test.mjs` — exit 0, 11 pass / 0 fail (the six-vocabulary set, the unknown-seam refusal, the valid and empty manifest, unknown op, the malformed-selector trio, the regex and hash refusals, the undeclared-field/duplicate-id/except cases, the three guard verdicts plus the missing-command refusal, the schema↔validator enum parity, and the README vocabulary parity).
- **E2** — 2026-11-07, `cd packages/agentic-workflow-schema && bun run test` — exit 0, 743 pass / 0 fail across 39 files.
- **E3** — 2026-11-07, `cd packages/agentic-workflow-schema && bun run test:node` — exit 0, 743 pass / 0 fail.
- **E4** — 2026-11-07, `cd packages/agentic-workflow-schema && npm pack --dry-run --json` — exit 0, the packed file list carries `projection-manifest.schema.json` and `guard-verdict.schema.json`.
- **E5** — 2026-11-07, `bun install --frozen-lockfile` — exit 0 ("Checked 167 installs across 184 packages (no changes)"); `grep -c '"dependencies"' packages/agentic-workflow-schema/package.json` → 0.
- **E6** — 2026-11-07, `bun test scripts/normative-drift.test.mjs` — exit 0, 21 pass / 0 fail; the six `schema-export:` rows resolve and the two `block:` rows are read from the package README.
- **E7** — 2026-11-07, `bun test scripts/vocabulary-parity.test.mjs` — exit 0, 20 pass / 0 fail; the six imported sets are non-empty published arrays.
- **E8** — 2026-11-07, `bun scripts/lint-changeset.mjs .changeset/406-projection-manifest-vocabulary.md` — exit 0 (`ok 406-projection-manifest-vocabulary.md`).
- **E9** — 2026-11-07, `rg -c '105-projection-manifest-vocabulary' docs/ROADMAP.md` → 1.
- **E10** — 2026-11-07, `git diff --name-only origin/main...HEAD -- packages/agentic-workflow packages/pi-agentic-workflow skills` — empty (zero runtime surface outside the schema package).
- **G1** — 2026-11-07, `bun scripts/local-gate.mjs --skip-network` — exit 0, "PASS — 8 step(s) in 105s" (root-suite 104s, crate suites both runtimes, schema-build, docs projection, version parity).
- **D1** — 2026-11-07, owner decision recorded in §S7 resolution: the schema package keeps its own pattern (no TypeBox, no dependency); the release intent is the changeset.
- **D2** — 2026-11-07, the folder key is `105` (feature-numbered) because `roadmap-settle` pairs a feature folder's number with its `## Features` row; the closing issue stays #406. Recorded here and in `decisions.md`.
- **D3** — 2026-11-07, O14's validator narrowed to `--skip-network`: the full gate's `pi-compat-guard` step fails identically at `origin/main` (see §Known pre-existing issues), so the offline subset is the unit's gate; the network step was run separately and its pre-existing failure disclosed.

## Next

Close the obligations ledger with the validators actually run, then hand the diff
to the owner as the external verifier.

## References

- Issue #406; roadmap row 105; issues #407 (locator), #409, #410, #411, #412,
  #413, #414 (consumers).
- `packages/agentic-workflow/src/doc/section-locator.mjs` and its `.d.mts` — the
  selector grammar this manifest cites.
- `packages/agentic-workflow-schema/envelope.schema.json`,
  `packages/agentic-workflow-schema/test/machine-contract.test.mjs` — the
  hand-maintained schema + parity pattern.
- `skills/pre-execution-review/references/LEDGERS.md` — ledger shapes.
- `docs/workflow/PACKAGES.md` — the bun workspace and release-intent rules.
