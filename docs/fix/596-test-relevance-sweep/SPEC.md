---
scope: large
roadmap_summary: Issue [#596](https://github.com/gtrabanco/agentic-workflow/issues/596) (L): the justification half of test relevance — a closed obligation vocabulary published as a schema export, one `// test-obligation:` tag beside every root suite naming the surface it protects and the obligations it asserts, a gate that refuses an untagged suite and a tag whose protected surface is gone, the sweep with a per-cluster decision recorded, selective kill-rate on the declared suspect list, and the wall-clock per change class before and after. `scripts/test-impact.mjs` (the targeting half, #356) is untouched. SPEC: [SPEC](fix/596-test-relevance-sweep/SPEC.md)
---

# fix/596-test-relevance-sweep

> One-line: the workflow stops guessing which tests justify their cost — every
> root suite declares the surface it protects and the obligations it asserts, a
> deterministic gate refuses a suite that declares neither, and the sweep's
> deletion decision is obligation-level evidence instead of line coverage.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#596` — `NEW FEATURE: test relevance sweep — obligation tags per suite,
obligation-level duplication evidence, measured wall-clock (re-cut of the
unshipped half of #364)`. Closed by this PR via `Closes #596`.

## Specs

Cut from the issue's `## Expected behaviour`, one requirement per enumerated
item, quoted verbatim; the issue's own words are the authority and this document
never paraphrases them.

**S1 — the closed obligation vocabulary ships as a schema export with its owner doc.**
> 1. **Closed obligation vocabulary** (the tag's values), declared as a `schema-export` in `packages/agentic-workflow-schema/src/vocabularies.ts` with its owner doc — proposed starter set, adapted from BlindSpot's obligation metrics + Zhang & Mesbah: `contract` (the observable API/behavior contract), `failure-path`, `boundary`, `prompt-byte`/`distribution-contract` (distribution-surface tests — legitimate even where they look redundant), `fixture-support`, `convention`.

**S2 — one annotation line beside each suite, at its head.**
> 2. **Tag surface beside each suite** — one annotation line at the suite head naming the surface it protects and its obligation values. Beside-the-suite (not a central registry) so tags cannot rot away from what they describe; the deadcode-ratchet lesson (gentle-ai #4120: orphan helpers invisible to a binary-rooted scan).

**S3 — the sweep, with obligation-level deletion evidence and a declared selection rule.**
> 3. **The sweep** — all root suites tagged; per-cluster owner decision (keep / merge / delete) recorded. A test disappears exactly when its surface no longer exists, it is an obligation-level duplicate, or its cost exceeds the risk it covers (owner rule 2026-11-16). Deletion **never** happens on line-coverage evidence alone (Rothermel's warning); the deterministic evidence is obligation-level duplication (from the tags) plus **selective** mutation kill-rate on contested/suspicious clusters — deterministic trigger for which clusters get the sweep (highest-cost, lowest-obligation-count first — Elbaum's prioritization shape); never exhaustive (cost precedent: gentle-ai #5092 rejected mandatory mutation passes).

**S4 — the maintenance rule, mechanically armed.**
> 4. **The maintenance rule, mechanically armed**: a gate check (structural-sibling-pins style) refuses a new suite without a tag; product-audit's surplus check (#595) consumes the tags — surface gone ⇒ test flagged for deletion. When the tagged surface disappears, the test disappears: the tag is what makes that rule detectable without re-deriving it every audit.

**S5 — the measured wall-clock per change class, before and after.**
> 5. **Measured wall-clock per change class** (#364's point 4, owner-requested inclusion): docs-only / script change / package change, measured before the sweep and after, recorded in the unit doc's evidence.

**S6 — the targeting half stays untouched and model-free.**
> 6. **test-impact.mjs stays untouched and model-free** — the targeting half is done and correct; this unit adds the justification half.

**S7 — normative registration and re-based budgets.**
> 7. **Normative registration**: vocabulary row in AGENTS.md's `normative-surfaces@1` + `GATE_INVENTORY.md`; tag grammar owner doc; budgets re-based for touched surfaces.

## Impact

- **The tag gate's inputs are the tree's own suites.** `scripts/test-obligation-tags.mjs`
  reads `scripts/*.test.mjs` heads; a suite added anywhere under that directory is
  in scope from its first commit, so the sweep's 127 tags are a load-bearing
  surface and not a one-off record. Renaming or deleting a protected file turns
  its tagged suites red on the next push — the intended behaviour, and the reason
  the tag names paths rather than prose.
- **`scripts/test-obligation-tags.mjs` is a new root-suite member**: the gate
  dispatches it through `scripts/run-root-suite.mjs`, `red-first.mjs` orders its
  suite/implementation pair, and `structural-sibling-pins` sees a paired file.
- **The vocabulary is published from the schema package**, so the drift gates
  that read `packages/agentic-workflow-schema/src/index.ts`
  (`scripts/normative-drift.test.mjs`) and the parity suite
  (`scripts/vocabulary-parity.test.mjs`) both see it from the first commit.
- **`AGENTS.md` is the always-loaded guide and its machine region is spent**:
  the new `normative-surfaces@1` row moves `machineLines` by one, so
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json` is re-pinned to the measured
  boundary in the same change (the fix #571 precedent, never headroom nobody
  asked for).
- **`skills/unit-lane/references/TESTS.md` is the tests-step reference** every
  project reads; the tag rule lands there as the one owner and `AGENTS.md` links
  it instead of restating it.
- **`docs/workflow/GATE_INVENTORY.md` is a `dimension-regression` surface**, so
  the range records a run of `scripts/dimension-regression.mjs`.
- **`skills/product-audit/references/AUDIT_DIMENSIONS.md` carries the surplus
  check** (#595) that consumes the tags; the pointer is one link, never a second
  copy of the tag grammar.

## Surfaces

- `scripts`
- `packages/agentic-workflow-schema`
- `skills/unit-lane`
- `skills/product-audit`
- `docs`

## Retirements

Strictly additive: no surface is removed, so the anti-divergence receipt is the
computed surface inventory. Command:
`bun scripts/residual-classify.mjs --inventory --base main`.

| added surface | how it is consumed from day one |
|---|---|
| `packages/agentic-workflow-schema/src/vocabularies.ts` → `TEST_OBLIGATION_KINDS` | parsed by `scripts/test-obligation-tags.mjs`, published through `src/index.ts` |
| `scripts/test-obligation-tags.mjs` | the root-suite gate; `--sweep` is its report mode |
| `skills/unit-lane/references/TESTS.md` → `test-obligation-tag@1` | the tag grammar's owner doc |
| `// test-obligation:` tag on every root suite | the gate's input, the sweep's evidence |
| `docs/workflow/GATE_INVENTORY.md` row `test-obligation-tags` | cited by `prose-gate-inventory` |

## Non-goals

Inherited verbatim from the issue's `## Non-goals`, and binding on this unit:

- No deletion of tests without obligation-level evidence (inherited from #364's
  non-goal, now with its literature-backed definition).
- No exhaustive mutation sweep.
- No decision-model dependency anywhere — deterministic scripts and prose only;
  the decision-substrate (#444, soft Related) upgrades candidate proposal later
  without touching this unit's evidence producers.
- No weakening, deletion, or skipping of tests to make anything pass — the
  boundary is written, not implied.
- No test-framework choice; no graph infrastructure beyond the declared tag
  surface.

Plus one this unit adds for itself: `scripts/test-impact.mjs` and
`skills/execute-phase/references/TEST_IMPACT.md` are read, never edited (S6).

## Risk tier

Computed, never chosen:

```
runner ceremony tier classify --paths packages/agentic-workflow-schema/src/vocabularies.ts,packages/agentic-workflow-schema/src/index.ts,scripts/test-obligation-tags.mjs,scripts/test-obligation-tags.test.mjs,skills/unit-lane/references/TESTS.md,AGENTS.md,docs/workflow/GATE_INVENTORY.md
```

- **Tier** — `standard` · **Task Size** — `standard`
- **Reason** — `executable-content` (4 escalating paths, 3 inert)
- **Named high-risk item** — `none — not a high-tier unit`

## Future

None deferred.

## Future cost

- **A new root suite owes its tag and its obligation values** — the gate refuses
  it otherwise. Binds every future unit that adds a `scripts/*.test.mjs`.
- **A protected file that moves owes its tags** — the tag names the path, so a
  rename is a tag edit in the same change that renames. Binds whoever moves a
  script, skill reference or doc that a suite protects.
- **The sweep's selection rule is re-run, not re-invented** — `--sweep --cost`
  is the deterministic trigger; a future sweep reads it instead of picking
  clusters by eye. Binds the next unit that deletes or merges tests.

## Applicable tests

- `bun scripts/test-obligation-tags.mjs` (the gate itself, on the live tree)
- `node --test scripts/test-obligation-tags.test.mjs` (its sibling suite, bun-first)
- `node scripts/run-root-suite.mjs` (the whole root gate)
- `bun test packages/agentic-workflow-schema/test/*.test.mjs` (the vocabulary's package)
- `bun scripts/check-skill-context.mjs` and `--documents` (the budgets)
- `bun scripts/prose-gate-inventory.mjs` (the inventory carrier)
- `bun scripts/dimension-regression.mjs --base <rev>` (the review-surface rule)

## Known pre-existing issues

- **`scripts/run-root-suite.mjs` prints each suite's wall clock** (`PASS <file>
  (N.Ns)`) and nothing aggregates it: `--cost` consumes that log rather than
  adding a timing store. **affects** this unit (it is the cost input) and is not
  repaired here.
- **`docs/workflow/SKILL_CONTEXT_BUDGETS.json`'s `documents` section has no
  emitter** — a re-pin is a recorded hand edit with a `sources` reason. **affects**
  O14 and is the declared mechanism, not a defect.
- **`scripts/test-timeout-allowlist.json` names suites that measured above the
  10 s budget.** **does not affect** this unit: no test is added, weakened or
  re-timed, so the allowlist is untouched.

## Acceptance criteria

Frozen at cut. One observable criterion per `S#`, each naming the check that
proves it.

- **AC-S1** — the vocabulary is a published schema export with its owner doc and
  its normative rows. Check: `bun scripts/test-obligation-tags.mjs --vocabulary`
  exits 0 and prints `6 of 6`; `rg -c 'test-obligation-tags' AGENTS.md` prints 1.
- **AC-S2** — every root suite carries the tag at its head.
  Check: `bun scripts/test-obligation-tags.mjs` exits 0 and its header prints
  `verdict: PASS`; `bun scripts/test-obligation-tags.mjs --list | wc -l` prints
  the number of `scripts/*.test.mjs` files on disk.
- **AC-S3** — the sweep is recorded: a decision per cluster, the obligation-level
  duplication evidence, and the declared selection rule.
  Check: `rg -c '^### (sweep|kill-rate|wall-clock)' docs/fix/596-test-relevance-sweep/sweep.md`
  prints `3`.
- **AC-S4** — the gate refuses an untagged suite and a dead protected surface,
  and product-audit consumes the tags. Check:
  `node --test scripts/test-obligation-tags.test.mjs` exits 0 (both refusals are
  cases); `bun scripts/prose-gate-inventory.mjs` prints `verdict: PASS`;
  `rg -c 'test-obligation-tag@1' skills/product-audit/references/AUDIT_DIMENSIONS.md`
  prints 1.
- **AC-S5** — the three change classes are measured before and after. Check:
  `rg -c '^\| `(docs-only|script change|package change)` ' docs/fix/596-test-relevance-sweep/sweep.md`
  prints `3`.
- **AC-S6** — the targeting half is untouched. Check:
  `git diff --name-only main...HEAD -- scripts/test-impact.mjs skills/execute-phase/references/TEST_IMPACT.md`
  prints nothing, and `node --test scripts/test-impact.test.mjs` exits 0.
- **AC-S7** — normative registration and re-based budgets. Check:
  `node --test scripts/normative-drift.test.mjs` exits 0;
  `bun scripts/check-skill-context.mjs` exits 0 and
  `bun scripts/check-skill-context.mjs --documents` exits 0.

## Tasks

Dependency-topological, smallest first. One task per phase; the phase's
validator is the command that proves the whole phase.

- P1 — Freeze the unit doc and both planning ledgers: the seven requirements
  verbatim, the acceptance criteria, the evidence and obligation ledgers
  (validator: `rg -c '^\*\*S[1-7] — ' docs/fix/596-test-relevance-sweep/SPEC.md` prints `7`)
  (Implements: S1, S2, S3, S4, S5, S6, S7)
  - Relevant files: docs/fix/596-test-relevance-sweep/SPEC.md, docs/fix/596-test-relevance-sweep/planning-evidence.md, docs/fix/596-test-relevance-sweep/planning-obligations.md
- P2 — Publish the obligation vocabulary: the closed set plus its type in the
  schema package and its index re-export
  (validator: `rg -c 'export const TEST_OBLIGATION_KINDS' packages/agentic-workflow-schema/src/vocabularies.ts` prints `1`)
  (Implements: S1)
  - Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts, packages/agentic-workflow-schema/src/index.ts
- P3 — Land the tag gate red-first: the sibling suite observed failing on the
  missing module, then the module that parses, validates and reports
  (validator: `node --test scripts/test-obligation-tags.test.mjs` exits 0)
  (Implements: S2, S4)
  - Relevant files: scripts/test-obligation-tags.test.mjs, scripts/test-obligation-tags.mjs
- P4 — Tag every root suite and record the sweep: one tag per suite, the
  per-cluster decisions, the duplication evidence
  (validator: `bun scripts/test-obligation-tags.mjs` prints `verdict: PASS`)
  (Implements: S2, S3)
  - Relevant files: scripts/, docs/fix/596-test-relevance-sweep/sweep.md
- P5 — Measure: selective kill-rate on the declared suspect list and the
  wall-clock of the three change classes at the base and at the head
  (validator: `rg -c '^### (sweep|kill-rate|wall-clock)' docs/fix/596-test-relevance-sweep/sweep.md` prints `3`)
  (Implements: S3, S5)
  - Relevant files: docs/fix/596-test-relevance-sweep/sweep.md
- P6 — Register the surfaces: the tag grammar block as the tests-step reference's
  owner doc, the `normative-surfaces@1` row, the gate-inventory row, the
  product-audit pointer, the budget re-pin, the changeset
  (validator: `bun scripts/prose-gate-inventory.mjs` prints `verdict: PASS`)
  (Implements: S1, S4, S7)
  - Relevant files: skills/unit-lane/references/TESTS.md, AGENTS.md, docs/workflow/GATE_INVENTORY.md, skills/product-audit/references/AUDIT_DIMENSIONS.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, .changeset/
- P7 — Verify and write the state: the root gate and the package suite in the
  foreground, the roadmap row through the deterministic writer, the projection
  re-rendered, the journal fragment written
  (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S3, S5, S6, S7)
  - Relevant files: docs/ROADMAP.md, docs/generated/, .agentic-workflow/journal/

### Planning evidence

The ledger lives beside this document — `planning-evidence.md` — with one row per
Engineering claim the change rests on. This section names it; it does not embed a
second copy.

### Obligations

The ledger lives beside this document — `planning-obligations.md` — in the closed
nine-column shape (owner: `skills/pre-execution-review/references/LEDGERS.md`).
This section names it; it does not embed a second copy.

## Triaged steps

`bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-route --triage 596-test-relevance-sweep`
is the machine's step list; the issue is delivered inline on the owner's
instruction, which overrides the lane's step sequencing (never its gates):

```text
docs → implement → tests → evidence
```

## Findings

Open rows only (carrier grammar: `findings-table@1`).

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-19, the issue, verbatim:
  ```
  NEW FEATURE: test relevance sweep — obligation tags per suite, obligation-level duplication evidence, measured wall-clock (re-cut of the unshipped half of #364)
  ```
- **L2** — 2026-11-19, the owner's local workflow instruction, verbatim:
  ```
  Apply to this repository: issue #596

  This is a **local, unpublished** workflow for changing agentic-workflow itself.
  ```

- **G1** — 2026-11-19, HEAD `ed5283dfa`, `bun scripts/local-gate.mjs` (the full local gate, network
  steps included) · exit 0 · `local-gate: PASS — 19 step(s) in 634s`; the root
  step read `root gate: 127 suite(s)` (the base's 126 plus this unit's, exit 0 in
  133s), the crate suites ran green under both runtimes (`crate-suite-bun`
  248s, `crate-suite-node` 206s), and `docs-generated-projection`,
  `version-parity-content`, `journal-carrier-check`, `log-immutability`,
  `worktree-guard` and `secret-scan` all exited 0.
- **G2** — 2026-11-19, HEAD `ed5283dfa`, `bun scripts/docs-generate.mjs --check` · `verdict: PASS`
  (roadmap unchanged), and the roadmap row written through
  `ceremony roadmap row-upsert` is the one this unit could **not** produce — see
  D7.
- **E16** — 2026-11-19, `bun scripts/prose-gate-inventory.mjs` · PASS with the
  new row resolved; `bun scripts/dimension-regression.mjs --base 176ab984b` ·
  `verdict | clean` (`18 dimensions` at both ends, evidence
  `docs/fix/596-test-relevance-sweep/SPEC.md`); `bun scripts/test-obligation-tags.mjs --list | wc -l`
  · `127`.
- **D7** — 2026-11-19, `ceremony roadmap row-upsert` cannot write a **fix** row:
  `packages/agentic-workflow/src/runner/ceremony/roadmap.mjs:55-80` reads the
  roadmap and hands the resulting *text* to `fixRowUpsert`, which expects the
  table's *path* (`ENAMETOOLONG: name too long, open '# Roadmap…'`). The feature
  branch of the same command works. This unit's fix row is therefore
  hand-written, which `docs/ROADMAP.md` § Fixes declares as the mechanism ("fix
  rows stay owner-managed end to end"); the defect is reported, not repaired
  here (it is its own unit's scope), and O16 records it as `n/a`.
- **G3** — 2026-11-19, HEAD `f1168c637`, `node scripts/run-root-suite.mjs` · exit 0 ·
  `root gate: 127 suite(s)`, 127 PASS / 0 FAIL — the final tree, after the state
  commit. The full gate's own last run was `ed5283dfa` (G1); the two commits after
  it change `docs/` only (`docs-generate --check`, `roadmap check` and the five
  doc-reading suites re-ran green at `f1168c637`), and the temporary measurement
  worktrees the wall-clock section used are removed (the guard reads three
  worktrees, none of them a leftover).
- **G4** — 2026-11-19, HEAD `4de3f869e` (the delivered head),
  `node scripts/run-root-suite.mjs` · exit 0 · 127 PASS / 0 FAIL in 3m32s — the
  run the handoff stands on; G3's third run of the same step was at the commit
  before the sweep's heading fix.
- **P8** — 2026-11-19, the branch integrated `origin/main` (`7bd57037a`, a
  journal fragment only), pushed with the offline gate green (`PASS — 17 step(s)
  in 475s`), and the pull request opened: [#649](https://github.com/gtrabanco/agentic-workflow/pull/649). Both roadmap rows settle
  to `done · [#649]` at the same time — `done` means built and awaiting the merge,
  and the merge state lives in the forge.
- **P6** — 2026-11-19, the surfaces registered: the tag grammar block in the
  tests-step reference, the two normative rows, the gate-inventory row, the
  product-audit pointer, the re-pinned budgets and the changeset · `6d8c9eadf`.
- **P7** — 2026-11-19, the state written: the roadmap's feature row and its new
  fix row, the projection re-rendered by the emitter, and the session's
  narrative journal fragment
  (`.agentic-workflow/journal/20261119T101521Z-feat-596-test-relevance-sweep-narrative-local.md`,
  written by `journal write --kind narrative`).

## Next

The owner's external verdict on the diff. Every obligation row is closed on a
foreground run before that handoff; what stays open by design is named here, not
deferred out of the unit.

## References

- Pull request [#649](https://github.com/gtrabanco/agentic-workflow/pull/649) — `done` in the status machine means built and awaiting the merge, and the owner is this workflow's external verifier.
- Issue [#596](https://github.com/gtrabanco/agentic-workflow/issues/596) — closed by this PR via `Closes #596`.
- Issue [#364](https://github.com/gtrabanco/agentic-workflow/issues/364) — the re-cut's parent (closed as a duplicate of #356; this unit ships its unshipped half).
- Issue [#356](https://github.com/gtrabanco/agentic-workflow/issues/356) — the execution half this unit leaves untouched (`scripts/test-impact.mjs`).
- Issue [#595](https://github.com/gtrabanco/agentic-workflow/issues/595) — the surplus check that consumes the tags.
- `skills/unit-lane/references/TESTS.md` — the tag grammar's owner doc.
- `skills/pre-execution-review/references/LEDGERS.md` — the ledger row shapes.

## Branch

`feat/596-test-relevance-sweep` (worktree `.worktrees/feat-596-test-relevance-sweep`).

## Depends on

Soft (prose only, no native blocker): #595 (surplus direction) landed first and
already declares that it reads "the tagged or claimed protecting surface" — this
unit is what makes "tagged" real.

## Regression scope

- `scripts/*.test.mjs` heads (127 files): a tag line is added to each; no test
  body, assertion, import or fixture changes.
- `packages/agentic-workflow-schema/src/{vocabularies,index}.ts`: one const, one
  type, one re-export; no existing export changes.
- `skills/unit-lane/references/TESTS.md`: one grammar block plus its rules; the
  step's existing contract is untouched.
- `AGENTS.md`: one `normative-surfaces@1` row, one table row in the tests rule.
- `docs/workflow/{GATE_INVENTORY.md,SKILL_CONTEXT_BUDGETS.json}`: one row and the
  re-pinned measurements.
- `skills/product-audit/references/AUDIT_DIMENSIONS.md`: one pointer line inside
  the existing surplus block.
- `docs/ROADMAP.md`, `docs/generated/`, `.agentic-workflow/journal/`: the state
  surfaces, written by their declared writers.
- **D1…D6** — 2026-11-19, the six decisions taken at cut (the issue's taxonomy
  adopted verbatim, `distribution-contract` resolving the issue's
  `prompt-byte`/`distribution-contract` pair, the root gate's own log as the cost
  input, `must-name: no` for the vocabulary's normative row, paths rather than
  prose as the protected surface, one declaration per suite at its head) —
  recorded in full in [`decisions.md`](decisions.md), with the
  `path-protection-records@1` rows this unit's suite edits owe.
- **E1** — 2026-11-19, the cut head's baseline (commit `176ab984b`):
  `node scripts/run-root-suite.mjs` · exit 0 · 126 suites pass, 2m16s wall.
- **E2** — 2026-11-19, RED at `c4c58acaf` (the suite alone):
  `node --test scripts/test-obligation-tags.test.mjs` · exit 1 ·
  `ERR_MODULE_NOT_FOUND: Cannot find module '.../scripts/test-obligation-tags.mjs'`.
- **E3** — 2026-11-19, GREEN at `eff444d2e` (implementation plus the 127 tags):
  `node --test scripts/test-obligation-tags.test.mjs` · exit 0 · 15 pass / 0 fail.
- **E4** — 2026-11-19, `bun scripts/test-obligation-tags.mjs` · exit 0 ·
  `test-obligation-tags@1 — 127 suite(s) · 0 finding(s)` · `verdict: PASS`.
- **E5** — 2026-11-19, `bun scripts/test-obligation-tags.mjs --vocabulary` ·
  exit 0 · `6 of 6 value(s) named by skills/unit-lane/references/TESTS.md`.
- **E6** — 2026-11-19, the differential for the swept suites:
  `git diff --numstat 176ab984b..HEAD -- 'scripts/*.test.mjs'` · 126 existing
  suites, `+184 / -0` — one declaration line each, and the only added suite is
  this unit's. No assertion, import, fixture or timeout moved.
- **E7** — 2026-11-19, `bun run test` in `packages/agentic-workflow-schema` ·
  exit 0 · 914 pass / 0 fail (52 files), the new export included.
- **E8** — 2026-11-19, `bun scripts/check-skill-context.mjs --documents` · PASS
  (4 documents) after re-pinning the measured boundary: `AGENTS.md` 738 lines /
  173 machine / 565 prose / 13,404 est (`linesMax` 731 → 738, `machineLines`
  171 → 173, `estimateMax` 13,259 → 14,745) and `GATE_INVENTORY.md` 178 / 83 /
  95 / 7,799 (177 → 178, 82 → 83, 8,015 → 8,579); `bun scripts/check-skill-context.mjs`
  · PASS (30 skills).
- **E9** — 2026-11-19, `bun scripts/prose-gate-inventory.mjs` · `verdict: PASS`
  (the new row resolves to `scripts/test-obligation-tags.test.mjs` and claims
  both new normative surfaces); `node --test scripts/normative-drift.test.mjs` ·
  exit 0 · 21 pass / 0 fail.
- **E10** — 2026-11-19, `bun scripts/version-parity-gate.mjs --content` ·
  `VERDICT: PASS` with `.changeset/596-test-relevance-sweep.md`; that file is
  generated by `bun scripts/changeset-create.mjs` and validated by
  `bun scripts/lint-changeset.mjs` · ok.
- **E11** — 2026-11-19, `bun scripts/docs-generate.mjs` · 2 files written (the
  projection gains the unit), `--check` · PASS; the roadmap table unchanged.
- **E12** — 2026-11-19, the selective kill-rate over the five selected clusters ·
  `9 of 15` mutants killed (`0.60`), every cluster's baseline green; the six
  survivors are named in [`sweep.md`](sweep.md) § kill-rate.
- **E13** — 2026-11-19, `bun scripts/test-obligation-tags.mjs --sweep --cost <root log>`
  · 125 clusters · 43 suspects · 5 selected · the table and the decision per
  cluster are [`sweep.md`](sweep.md) § sweep.
- **E14** — 2026-11-19, S6's untouched half:
  `git diff --name-only 176ab984b..HEAD -- scripts/test-impact.mjs skills/execute-phase/references/TEST_IMPACT.md`
  · prints nothing; `node --test scripts/test-impact.test.mjs` · exit 0 ·
  21 pass / 0 fail. `node --test scripts/product-audit-surplus.test.mjs` · exit 0
  · 13 pass; `node --test scripts/vocabulary-parity.test.mjs` · exit 0 · 23 pass.
- **E15** — 2026-11-19, `bun scripts/dimension-regression.mjs --base 176ab984b` ·
  `base 18 dimensions · head 18 dimensions · changed review surfaces 4` — the
  range touches `docs/workflow/GATE_INVENTORY.md` and three files under
  `skills/product-audit/`, and no dimension id is dropped; the dimensions the
  audit already had are re-verified at the head by
  `node --test scripts/dimension-regression.test.mjs` and
  `node --test scripts/product-audit-rescope.test.mjs` (both green in G1's root
  run), so this unit adds no eighth-C check and removes none.
- **E17** — 2026-11-19, the wall-clock measurement (`sweep.md` § wall-clock):
  docs-only `2 s → 1 s` (11 steps, test steps skipped on both sides), script
  change `598 s → 516 s`, package change `661 s → 478 s`; the change's own cost
  is one suite, `PASS scripts/test-obligation-tags.test.mjs (0.6 s)`, and the
  deltas are larger than it and in the other direction — run variance, stated as
  such in the section.
- **P1** — 2026-11-19, the unit doc and both planning ledgers frozen · `23950525`.
- **P2** — 2026-11-19, the closed vocabulary published from the schema package · `c63ea2be`.
- **P3** — 2026-11-19, the gate's suite landed alone and observed red · `c4c58acaf`.
- **P4** — 2026-11-19, the gate plus all 127 root suites tagged · `eff444d2e`.
- **P5** — 2026-11-19, the sweep: the cluster table, the duplicate evidence read
  pair by pair, and the selective kill-rate · commit that carries `sweep.md`.
