---
type: fix
scope: small
# ac-hash: 43604f8056a06a975fb6fecc9ee268fbea6f35f9
---

# fix/432-model-memory-tier-0

## Issue

`#432` — tracked issue in the project's forge. The PR must close it via
`Closes #432` in the body.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. Cut one requirement per distinct ask, in the order
the issue states them. A later correction is appended under its own id
(`S1a`, `S2a`, …) and never rewrites the id it corrects.

**S1 — the journal records provenance; model memory can never carry `confirmed`.**
> Research/design may never treat **model memory** (training data) as a tier-0 source. Any claim of the shape *"tool/signature/syntax/API v behaves like X"*, when not read from the repository, is journaled with certainty **`inferred` at best**; `confirmed` demands a **version-pinned, current** source — the project's own lockfile/manifest/GitHub-action pinning, not `latest`, and never the model's recollection.
>
> [… elision: the issue's measured evidence and bibliography sections are jumped — Expected behaviour 1 follows verbatim …]
>
> 1. `sources.md` claim grammar records whether a claim's provenance is **repository / version-pinned doc / owner answer / model memory**; model-memory provenance can never carry `confirmed`.

**S2 — external implementation-detail claims verify against the pinned version first.**
> 2. Any external implementation-detail claim (CI schema, tool flags, API versions, shell syntax) verifies against the **pinned version** the project actually uses (lockfile, manifest, action SHAs) before it may guide a task; the verification is a cheap one-fetch receipt in the research/design evidence row.

**S3 — where verification is deterministic, prefer a script.**
> 3. Where the verification is **deterministic, prefer a script** (actionlint, schema validation, type-check) — extends #359's prose→script migration and matches the determinism-first review evidence ([arXiv 2608.09290](https://arxiv.org/abs/2608.09290)).

**S4 — the skipped-research exit records its receipt.**
> 4. The skipped-research exit records its receipt: which claim the repo answered, where (repo-answered-descriptive rule of the #307 kernel amendment).

**S5 — the cite-sources clause.**
> Any implementing unit must record adopted knowledge in `docs/research/ATTRIBUTION.md` in the same PR (ideas adapted = ledger row; vendored bytes = four-part provenance header per `AGENTS.md`).

## Impact

The change touches the lane's **design**, **research** and **plan** step
references — the surfaces every unit's knowledge-honesty phase reads:

- `skills/unit-lane/references/DESIGN.md` — the single normative owner of the
  provenance kinds and the certainty ceiling (S1, S2, S3). Its `sources.md`
  journal table, its § Provenance ceiling and its orient tier-0 row name model
  memory as never tier-0.
- `skills/unit-lane/references/RESEARCH.md` — the repo-answered exit rule
  (S4) plus a pointer to the provenance owner.
- `skills/unit-lane/references/PLAN.md` — the `CLAIM-*` journal table carries
  the same provenance column, with the owner pointer for the semantics (S1).
- `docs/workflow/GATE_INVENTORY.md` — the gate note the issue's *Where*
  requires: a prose row for the model-memory gate, plus the budget manifest's
  `machineLines` re-pin the new row forces.
- `docs/research/ATTRIBUTION.md` — the S5 rows.
- `scripts/knowledge-honesty-contract.test.mjs` — the test home: the suite
  already pins the design/plan knowledge contract (#303), so the #432 cases
  land there instead of a second suite (one carrier, no second copy).

Batch 2 (`35fc6e1e`, the owner-ordered migration `## Log` D5 records) grew this
surface, and the fold of the delta receipt grew it again. This is the list an
executor must sweep, not the first batch's list:

- the `version-pinned doc` row of `skills/unit-lane/references/DESIGN.md`
  § Provenance — line 59, the one-line clause that admits an observation of the
  installed environment, and the `inferred` cap the version-less reads fall to;
- the seven claim journals the migration rewrote —
  `docs/features/66-engram-memory-substrate/sources.md`,
  `docs/features/67-serena-provisioning/sources.md`,
  `docs/features/78-unit-cycle/sources.md`,
  `docs/features/79-spec-by-reference/sources.md`,
  `docs/features/82-relay-lane-execution/sources.md`,
  `docs/features/84-published-vocabulary-sweep-gate/sources.md` and
  `docs/fix/303-investigate-orient-ask/decisions.md` — where the fold re-derives
  11 `provenance` cells and the certainty of 4 of them, and where the dated note
  above each touched table says so;
- `docs/fix/303-investigate-orient-ask/BRIEF.md` — the one shape sentence that
  spelled the retired four-column header (batch 2; the fold leaves it);
- `scripts/knowledge-honesty-contract.test.mjs` again — the same carrier gains
  the pin that keeps this fold from being prose-only (a new obligation row, O14,
  carries its red and green receipts).

Consumers: every lane run that journals claims (`sources.md` is
human-authored prose — no machine parser reads its columns, searched at
`PE-003` and re-run at this head: `rg -l "sources\.md" scripts/*.mjs` outside
the suites still matches nothing. The O14 case reads the columns as a check
inside a `*.test.mjs`, which is not a consumer the lane must feed, so the
compatibility invariant O8 states holds unchanged), the inventory validator
(`scripts/prose-gate-inventory.mjs`), and the context-budget checker
(`docs/workflow/SKILL_CONTEXT_BUDGETS.json`). Nothing executable changed before
the pin; with it the only executable surface is the test suite. The worktree
branch is `feat/432-model-memory-tier-0`.

## Retirements

The four-column claim-journal shape **is** retired — by this unit's second
batch, not its first. The sentence this section carried was true at `3e02d85c`
and `35fc6e1e` made it false; the fold of the delta receipt re-cuts it.

- **Retired surface:** the four-column claim-journal header
  `id | claim | source | certainty`, the shape `sources.md` and the design
  journals were written in.
- **Its replacement:** the five-column grammar § Provenance publishes —
  `id | claim | source | provenance | certainty` (`provenance` inserted before
  `certainty`; unit 67's seven-column tables keep their `tier`/`cost` cells
  after it). Owner: `skills/unit-lane/references/DESIGN.md` § Provenance,
  mirrored by `skills/unit-lane/references/PLAN.md`.
- **The batch that applied it:** `35fc6e1e` (2026-11-07, ordered at D5) — 11
  tables / 148 rows across the seven claim journals `## Impact` lists, plus the
  two shape descriptions that spelled the old header
  (`docs/features/66-engram-memory-substrate/sources.md:3`,
  `docs/fix/303-investigate-orient-ask/BRIEF.md:16`).
- **Negative-capability pin, with the before/after count:**
  `rg -c "^\| id \| claim \| source \| certainty \|$" skills/ template/
  packages/ docs/workflow/` exits 1 — no live normative surface carries the
  retired shape. Over the whole tree the same pattern counts 9 files / 12 tables
  at `3e02d85c` (`git grep -c` on that commit) and 3 files / 3 tables at this
  head — and none of the 3 is a claim journal.
- **Survivors, each with the reason it is not swept:**
  `docs/fix/353-residue-shadow-copies/SPEC.md:84`,
  `docs/fix/375-release-notes-rendering/SPEC.md:104` and
  `docs/features/103-doc-currency/SPEC.md:156` are legacy `### Planning
  evidence` ledgers of closed units — the canonical planning-evidence row is the
  six-column one, so converting them would invent `authority-kind`/`freshness`
  cells for other units' records (D6, whose citation scope this batch bounds in
  a new dated `## Log` line); and `CHANGELOG.md:747` quotes the old header inside the
  published 2.2.0 release note — published history is never rewritten.

## Non-goals

> - No change to `ask-dont-infer@1` semantics — this is its evidence layer, not a rival rule.
> - No forced re-lookup of claims the repository already answers with a receipt (that is the point of the exit rule).

Additionally (this unit's own cut): the **scriptable checks** (actionlint /
schema-validation / type-check executions wired as lane steps) are the issue's
declared second slice — "then the scriptable checks (actionlint/schema) as
second slice if the measured acceptance (#260 rule) justifies them" — and are
recorded in `## Future`, not implemented here.

## Risk tier

- **Tier** — `standard` · **Task Size** — `{understood: true, contained_risk: "contained", resumable_from_diff: true, ceremony: "unit-doc", verification: "gates"}`
- **Named high-risk item** — `none — not a high-tier unit`

(Copy of `bun scripts/ceremony.mjs tier classify` at the cut head; re-run at
P6 — the verdict can only rise, and a rise appends a `## Log` line, never a
quiet edit.)

## Future

| Idea | Date | Status |
|---|---|---|
| The issue's second slice: wire the deterministic checks (actionlint, workflow schema validation, type-check) as lane steps / #359 migration rows where measured acceptance justifies them (#260 rule) | 2026-11-07 | open |

## Future cost

- Every future `sources.md` journal row carries the `provenance` column — the
  lane's design and plan steps write it (binds: `unit-lane` skill users).
- The gate inventory's `model-memory-provenance` row must keep resolving:
  renaming or deleting its pinned section in DESIGN.md fails the root suite.

## Applicable tests

`scripts/knowledge-honesty-contract.test.mjs` (extended with the #432 cases) +
the root suite. The fix cannot regress executable behaviour — it changes prose
ledger rows and pinning tests only — so no new runtime suite applies.

## Known pre-existing issues

- `scripts/roadmap-moved.test.mjs` (1 case) and `scripts/docs-generate.test.mjs`
  (1 case) failed at this worktree before the first edit — the first because
  the crate's deps were not installed in this fresh worktree (`bun install`
  fixed it), the second because the unregistered unit dir stalled the
  projection (registering the Fixes row fixed it). Both recorded because a red
  gate is never excused by an unrecorded issue — after the two repairs the
  pre-edit head runs 87 PASS / 0 FAIL.
- `packages/agentic-workflow` `test:node` (crate-suite-node) is red at the
  base tip: `main` carries a committed journal fragment without the contract's
  kind token (`9b27fab9`: `20261107T001707Z-direction-review-odd-hybrid-design-notes-manual.md`),
  so the S15 probe refuses the whole carrier set. **Does-not-affect this
  unit's behaviour; does affect its push gate** (the local gate is full for a
  test-bearing push). Repaired on this branch with the same conforming rename
  the journal unit already landed on its own branch (`11e14db2`) — if both
  merge, the renames agree on the same target name and the same bytes.
- The gate-inventory prose row planned here is unverifiable by script until the
  #359 second slice — affects this unit (it is exactly the unit's product, not
  a gap in it).

## Tasks

- P1 — RED: add the #432 cases to `scripts/knowledge-honesty-contract.test.mjs` (provenance column in both journals, the `model-memory` certainty ceiling, the pinned-version receipt, the script preference with the #359 pointer, the repo-answered exit in RESEARCH.md, the gate-inventory row) and observe them fail before any prose changes (validator: `bun test scripts/knowledge-honesty-contract.test.mjs` exits non-zero with only the new #432 cases red)
  (Implements: S1, S2, S3, S4)
  Relevant files: scripts/knowledge-honesty-contract.test.mjs
- P2 — Fixture first (§3): apply the exact wording patch to a throwaway copy of the tree in `/tmp`, run the touched suites and gates inside the copy, and delete it (validator: the three commands recorded as `E` rows exit 0 inside the fixture)
  (Implements: S1, S2, S3, S4)
- P3 — Write the rule's single owner: DESIGN.md's design step gains the provenance kinds and the certainty ceiling (S1), the pinned-version receipt rule (S2) and the script preference naming the #359 migration (S3) (validator: `rg -n "model memory" skills/unit-lane/references/DESIGN.md` matches the new section)
  (Implements: S1, S2, S3)
  Relevant files: skills/unit-lane/references/DESIGN.md
- P4 — The two readers of the same rule: PLAN.md's `CLAIM-*` journal table gains the same provenance column with the owner pointer, and RESEARCH.md gains the repo-answered exit with its receipt (S4) (validator: `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0)
  (Implements: S1, S4)
  Relevant files: skills/unit-lane/references/PLAN.md, skills/unit-lane/references/RESEARCH.md
- P5 — Gate note: add the `model-memory-provenance` prose row to `docs/workflow/GATE_INVENTORY.md` and re-pin the manifest's `machineLines` with its declared source (validator: `node scripts/prose-gate-inventory.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S3)
  Relevant files: docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P6 — Attribution and release state: the four evidence rows in `docs/research/ATTRIBUTION.md` (S5), the changeset intent file (validator: `rg -c "2406.10279|2310.03214|2608.22652|2607.02052" docs/research/ATTRIBUTION.md` matches 4 and the changeset parses)
  (Implements: S5)
  Relevant files: docs/research/ATTRIBUTION.md, .changeset/432-model-memory.md
- P7 — Verification and closure: run the root suite, the context budgets and the obligations ledger in the foreground, flip every row `verified` on its run, regenerate the projection, append the session log, and hand the diff to the owner (validator: `node scripts/run-root-suite.mjs` exits 0 with 0 FAIL)
  (Implements: S1, S2, S3, S4, S5)

### Planning evidence

This is an S-size unit: the ledger is embedded here and in `### Obligations` —
never a separate file.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The pre-edit head is green once the worktree's deps are installed and the unit is registered: 87 root suites, 0 FAIL (count corrected at the correction batch — `scripts/` carries 87 `*.test.mjs` at the base commit, the pre-edit head and the current head; the 86 was a miscount, the green verdict is unchanged) | `node scripts/run-root-suite.mjs` → 87 `PASS` lines, `FAIL` count 0 (2026-11-07) | current | O1–O13 |
| PE-002 | known | The four papers the journal cites exist with the titles the attribution rows claim: package-hallucination analysis (USENIX Sec 2025), FreshLLMs/FreshQA, inference-time defenses against package hallucination, model-editing mitigation | `web_fetch` of the four `arxiv.org` abs/html pages, 2026-11-07 — titles recorded verbatim in `## Log` E1 | current | O6 |
| PE-003 | known | No machine parser reads the `sources.md` journal columns — `rg -l "sources.md" scripts/*.mjs` (non-test) matches nothing, so adding a `provenance` column breaks no consumer | `rg -l "sources\.md" scripts/*.mjs` → empty (2026-11-07) | current | O8 |
| PE-004 | unknown | Whether measured acceptance will justify the issue's second slice (scripted checks as lane steps) is not decidable in this unit — no measurement exists yet | not measured; the slice stays `open` in `## Future` until #260-rule evidence exists | not-applicable | AC coverage (S3 prose ships; S3 machinery deferred) |
| PE-005 | assumption | DESIGN.md at 263 lines is within 12 lines of its `linesMax` ceiling (275), so the edit is written tight and the budgets outcome (hold or declared re-base) is verified at P4, never assumed | `bun scripts/check-skill-context.mjs` unit-lane reference ceiling `referenceLinesMax: 275` in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`; measured 2026-11-07 | current | O10 |
| PE-006 | known | The golden-fixture smoke run (GOLDEN_FIXTURE.md §When-to-run, optional for a wording edit) needs a fleet weak-model session this change cannot run itself | `docs/workflow/GOLDEN_FIXTURE.md` — "Optional but recommended before the PR" | current | O11 (recorded as honestly skipped, owner runs it) |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | The design and plan journals carry the `provenance` column with the closed four-kind set (`repository / version-pinned doc / owner answer / model memory`) | P3, P4 | P1 | skills/unit-lane/references/DESIGN.md, PLAN.md | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 with the provenance-column cases green | E2: 15 pass / 0 fail, both journal cases green | verified |
| O2 | S1 | The certainty ceiling is a rule, not a prohibition-only line: a claim whose provenance is `model memory` can never carry `confirmed` — its ceiling is `inferred` | P3 | P1 | skills/unit-lane/references/DESIGN.md | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 with the ceiling case green | E2, DESIGN.md §Provenance ceiling row (`inferred` — never `confirmed`, and never tier-0) | verified |
| O3 | S2 | An external implementation-detail claim verifies against the project's pinned version (lockfile/manifest/action SHA) before it guides a task; the verification rides as a one-fetch receipt in the research/design evidence row | P3 | P1 | skills/unit-lane/references/DESIGN.md | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 with the pinned-version case green | E2; E1 (this unit's own four fetch receipts follow the same rule) | verified |
| O4 | S3 | Deterministic verification prefers a script (actionlint, schema validation, type-check), stated as an extension of #359's migration, never as a new rival rule | P3, P5 | P1 | skills/unit-lane/references/DESIGN.md + docs/workflow/GATE_INVENTORY.md | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 with the script-preference case green and `node scripts/prose-gate-inventory.mjs` exits 0 | E2 + E3 (`model-memory-provenance — prose · DESIGN.md:61`), stay-reason `judgment-needed` | verified |
| O5 | S4 | The research step's repo-answered exit: a descriptive question the repository answers skips external research, and the receipt names which claim the repo answered and where; a normative question never closes on precedent | P4 | P1 | skills/unit-lane/references/RESEARCH.md | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 with the exit-rule case green | E2; RESEARCH.md §Skipped-research exit carries the `R<n>` receipt form | verified |
| O6 | S5 | The adopted knowledge is attributed: `docs/research/ATTRIBUTION.md` carries rows for arXiv 2406.10279, 2310.03214, 2608.22652 and 2607.02052 landing at #432, all `evidence only` (no bytes vendored) | P6 | P6 | docs/research/ATTRIBUTION.md | `rg -n "2406.10279|2310.03214|2608.22652|2607.02052" docs/research/ATTRIBUTION.md` matches 4 or more | E5: 4 matched lines, one per row, `evidence only` | verified |
| O7 | S5 | No third-party bytes are vendored by this unit, so no four-part provenance header is owed | P7 | P7 | the unit's diff | `git diff main..HEAD --name-status` lists no vendored source file | E7: no vendor-class file in the 12-file diff | verified |
| O8 | S1 (non-goal: no semantic change to the ledger reader) | The `sources.md` journal stays a human-authored ledger: no machine parser consumes its columns, so the added column breaks no consumer (compatibility invariant) | P4 | P4 | — | `rg -l "sources\.md" scripts/*.mjs` (non-test) matches nothing | E6: empty match | verified |
| O9 | S1 | The pre-existing #303 pins hold — the staged/ordered headings, the citation checklist and the ledger-reader parity tests pass unchanged on the edited references (regression guard) | P3 | P1 | scripts/knowledge-honesty-contract.test.mjs | the pre-existing #303 tests in the same suite exit 0 unmodified (`git diff P3..P1 -- scripts/knowledge-honesty-contract.test.mjs` touches only appended #432 blocks) | E2 (all 9 pre-existing cases green); E4: the test-file delta past the red commit is one line inside a #432 case | verified |
| O10 | repo rule (context budgets) | The edited reference stays inside its declared ceiling, or the ceiling is re-based with its `sources` reason in the manifest — never silently over | P5 | P5 | docs/workflow/SKILL_CONTEXT_BUDGETS.json | `bun scripts/check-skill-context.mjs` and `--documents` exit 0 | E3: both exit 0; DESIGN.md measured 292 lines / 4,116 est, re-based to 322 / 4,528 with the declared source | verified |
| O11 | repo rule (honest verification) | The golden-fixture smoke run for the edited executor-path skill is declared skipped with its reason (needs a fleet weak model), never claimed | P7 | P7 | the unit doc's `## Log` | the `## Log` carries the skip line naming GOLDEN_FIXTURE.md §When-to-run and the owner as the runner | D-row E9/D2 below | verified |
| O12 | repo rule (authoring lint) | The edited skills tree stays lint-clean and free of stack leakage | P7 | P7 | `bun scripts/skill-lint.mjs` | `bun scripts/skill-lint.mjs` exits 0 | E3: exit 0 | verified |
| O13 | Regression scope | The root suite is green at the final head — no prose pin outside the extended suite moved | P7 | P7 | the whole tree | `node scripts/run-root-suite.mjs` exits 0 with 0 FAIL | E8, E16, E21: 87 PASS / 0 FAIL at this head | verified |
| O14 | S1 · S3 | No journaled claim may assert `repository` for a source its own row names as outside the repository, and the refusal is machine-checked in the test home this issue declared — batch 2's fallback mislabelled 11 cells precisely because nothing read the column | P1 | P1 | `scripts/knowledge-honesty-contract.test.mjs` + the 7 migrated journals | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 with the two #432 F1 cases green (17 cases) | E17 (red: 6 offenders named), E18 (green: 17 pass / 0 fail) | verified |
| O15 | S1 | The four-kind set stays closed: the installed-environment arm is one clause inside the existing `version-pinned doc` row, not a fifth kind, and `repository` is not widened | P3 | P3 | `skills/unit-lane/references/DESIGN.md` § Provenance | `node scripts/prose-gate-inventory.mjs` exits 0 and still resolves `model-memory-provenance — prose · skills/unit-lane/references/DESIGN.md:61`; `bun scripts/check-skill-context.mjs` exits 0 | E18, E21 | verified |
| O16 | S2 | An environment or service read that records no observed version, and a fetch of `latest`, cannot carry `confirmed` — the ceiling is applied to the migrated cells, not only stated | P3 | P3 | `docs/features/66-engram-memory-substrate/sources.md`, `docs/features/67-serena-provisioning/sources.md` | `rg -n "\| version-pinned doc \| inferred" docs/features/66-engram-memory-substrate/sources.md docs/features/67-serena-provisioning/sources.md` matches 4 | E18, F1 | verified |
| O17 | S1 | `## Retirements` names the retired four-column shape, its replacement, the batch that applied it and every survivor with its reason — a declared deliverable, not a review-time discovery | P7 | P7 | this doc's `## Retirements` | `rg -c "^\| id \| claim \| source \| certainty \|$" skills/ template/ packages/ docs/workflow/` exits 1 | E21, F2 | verified |
| O18 | S1 | `## Impact` lists the surface batch 2 and this fold actually touched, because Impact is the section that owns what the executor sweeps | P7 | P7 | this doc's `## Impact` | `rg -l "Shape migrated 2026-11-07" docs/features/66-engram-memory-substrate/sources.md docs/features/67-serena-provisioning/sources.md docs/features/78-unit-cycle/sources.md docs/features/79-spec-by-reference/sources.md docs/features/82-relay-lane-execution/sources.md docs/features/84-published-vocabulary-sweep-gate/sources.md docs/fix/303-investigate-orient-ask/decisions.md \| wc -l` matches 7 | F5 | verified |
| O19 | S3 | The freeze marker reproduces from the recipe the ledger owner documents, and the projection carries the stamped value — the deterministic half of S3 applied to this unit's own ledger | P7 | P7 | this doc's frontmatter + `docs/generated/units.md` | `sed -n '/^## Acceptance criteria/,/^## /p' docs/fix/432-model-memory-tier-0/SPEC.md \| git hash-object --stdin` matches the frontmatter `ac-hash` — the coherence guard's reader allowlist refuses `sed` and `git hash-object`, so the row is a disclosed skip there and is proven in the foreground at E19 | E19 | verified |
| O20 | S1 | Append-only history is corrected by new lines, never by editing: D6's quotation is bounded by a dated line, and the journals' notes are amended only where the derivation the note describes stopped being the one applied | P7 | P7 | this doc's `## Log` + the 4 journals the fold touched | `rg -c "^- \*\*D6\*\*" docs/fix/432-model-memory-tier-0/SPEC.md` matches 1 | E20, F7 | verified |

## Triaged steps

> Pasted verbatim from `bun scripts/unit-route.mjs --triage 432-model-memory-tier-0` at the cut (2026-11-07). The owner's command runs this change inline — the review step's verdict holder is the owner's external verify, not a lane review run.

```text
TRIAGE — 432-model-memory-tier-0 (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 | The design and plan journals carry the `provenance` column over the closed four-kind set, and a `model-memory` row can never carry `confirmed` — the ceiling rule is stated in the provenance's single owner (S1) | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 including the #432 provenance and ceiling cases |
| AC-2 | The pinned-version rule and its one-fetch receipt are stated where a design/research run reads them (S2) | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 including the pinned-version case; `rg -n "pinned version" skills/unit-lane/references/DESIGN.md` matches ≥ 1 |
| AC-3 | The script-preference rule (actionlint, schema validation, type-check) names the #359 migration, and the `model-memory-provenance` gate row resolves in the #359 inventory (S3) | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 including the script-preference case; `node scripts/prose-gate-inventory.mjs` exits 0 |
| AC-4 | RESEARCH.md carries the repo-answered exit with its receipt shape, and the normative-questions-never-close-on-precedent line (S4) | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 including the exit-rule case |
| AC-5 | The four adopted knowledge sources are attributed at #432, all evidence-only, with no vendored bytes (S5) | `rg -n "2406.10279|2310.03214|2608.22652|2607.02052" docs/research/ATTRIBUTION.md` matches ≥ 4 and `git diff main..HEAD --name-status` lists no vendored source file |

## Findings

OPEN rows only: none. The first review was the owner's external verify; the rows
the triage of its delta receipt persisted (F1–F7, 2026-11-07) are closed by the
correction batch and live as `## Log` F-lines with their fold commit — the table
never grows a history column. The advisories that receipt also carried are
dispositioned in `external-verify.md` under the same date rather than persisted
here (`report-only` impact never earns a correction round).

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-07, the request, verbatim:
  ```
  Apply to this repository: issue #432
  ```
- **L1a** — 2026-11-07, the issue's requirement source, verbatim (issue #432 body, "Expected behaviour"):
  ```
  1. `sources.md` claim grammar records whether a claim's provenance is **repository / version-pinned doc / owner answer / model memory**; model-memory provenance can never carry `confirmed`.
  2. Any external implementation-detail claim (CI schema, tool flags, API versions, shell syntax) verifies against the **pinned version** the project actually uses (lockfile, manifest, action SHAs) before it may guide a task; the verification is a cheap one-fetch receipt in the research/design evidence row.
  3. Where the verification is **deterministic, prefer a script** (actionlint, schema validation, type-check) — extends #359's prose→script migration and matches the determinism-first review evidence ([arXiv 2608.09290](https://arxiv.org/abs/2608.09290)).
  4. The skipped-research exit records its receipt: which claim the repo answered, where (repo-answered-descriptive rule of the #307 kernel amendment).
  ```
- **E1** — 2026-11-07, `web_fetch` of the four `arxiv.org` pages cited by the issue (one batch, receipts before the rows cite them) · exit ok · `2406.10279` = "We Have a Package for You! A Comprehensive Analysis of Package Hallucinations by Code Generating LLMs" (USENIX Security 2025) · `2310.03214` = "FreshLLMs: Refreshing Large Language Models with Search Engine Augmentation" · `2608.22652` = "Evaluating Inference-Time Defenses against Package Hallucination in LLM-Generated Code" · `2607.02052` = "Mitigating Package Hallucinations in Large Language Models via Model Editing".
- **E2** — 2026-11-07, `bun test scripts/knowledge-honesty-contract.test.mjs` · exit 0 · 15 pass / 0 fail (6 new #432 cases; the 9 pre-existing #303 cases unchanged). RED state first: at `17c65d12` the same suite ran 9 pass / 6 fail — exactly the new cases, before the rule text existed.
- **E3** — 2026-11-07, `node scripts/prose-gate-inventory.mjs` · exit 0 · verdict PASS, new row `model-memory-provenance — prose · skills/unit-lane/references/DESIGN.md:61 · priority 6 · prose`; `bun scripts/check-skill-context.mjs` exit 0 (PASS 28 skills); `--documents` exit 0 (PASS 4 budgeted documents); `bun scripts/skill-lint.mjs` exit 0 (0 findings).
- **E4** — 2026-11-07, `git diff 17c65d12..821b5af5 -- scripts/knowledge-honesty-contract.test.mjs` · exit 0 · the green commit's test delta is 1 insertion / 1 deletion — a shared test defect fixed before green (the inventory block is space-delimited, not a markdown table, so the case's row finder used the wrong prefix); no assertion was weakened.
- **E5** — 2026-11-07, `rg -n "2406.10279|2310.03214|2608.22652|2607.02052" docs/research/ATTRIBUTION.md` · exit 0 · 4 matched lines, one per adopted row, all `evidence only`.
- **E6** — 2026-11-07, `rg -l "sources\.md" scripts/*.mjs` (non-test filter) · exit 1 (no match) · no machine parser consumes the journal columns, so the added `provenance` column breaks no consumer.
- **E7** — 2026-11-07, `git diff main..HEAD --name-status` · exit 0 · 12 files, none a vendored third-party source; no four-part provenance header is owed.
- **E8** — 2026-11-07, `node scripts/run-root-suite.mjs` · exit 0 · 87 suites PASS / 0 FAIL at the final head.
- **P1** — 2026-11-07 01:30, ledgers frozen before the first line of code (SPEC S1–S5 verbatim, 13 obligations, 6 evidence rows, decisions D1–D4, ac-hash `6b7b62a1…`, roadmap Fixes row + projection) · `d391280b`.
- **P2** — 2026-11-07 01:31, RED: the six #432 cases land and are observed failing (9 pass / 6 fail) before any prose change · `17c65d12`.
- **P3** — 2026-11-07 01:50, the rule ships after the §3 fixture pass: the exact wording patch was validated in a throwaway `/tmp` tree (fixture suite 15/15, budgets, `prose-gate-inventory`, `skill-lint`, `docs-generate --check` all green there first), then applied to the tree unchanged · `821b5af5`.
- **P4** — 2026-11-07 01:53, attribution rows + changeset · `dacf767c`.
- **D1** — 2026-11-07, owner decision recorded ahead of the external verify: the golden-fixture smoke run (GOLDEN_FIXTURE.md §When-to-run — optional for a wording edit) is **skipped**, not passed: it needs a fleet weak-model session this change cannot run itself. The owner runs it before merge if wanted.
- **D2** — 2026-11-07, owner decision recorded ahead of the external verify: the issue's second slice (scripted checks as lane steps) stays `open` in `## Future` — no measured acceptance exists yet (#260 rule), so it is not built here.
- **D3** — 2026-11-07, the owner's external verify returned approval ("Okey") with no findings — §9 earned no correction batch. The PR was opened closing #432 per the plan's next step.
- **E9** — 2026-11-07, `bun run test:node` + `bun run test` (packages/agentic-workflow) · exit 0 · 388 pass / 0 fail each, after the conforming fragment rename (recorded pre-existing issue above).
- **L2** — 2026-11-07, the request, verbatim:
  ```
  Apply to this repository: arregla tanto los blockers como los advisories, verifica con evidencia la reparación y planifica y evalua antes de arreglar cual será la ruta adecuada para arreglar el problema
  ```
- **D4** — 2026-11-07, owner decision recorded for this correction batch: the advisories are in scope, not report-only (the verify protocol reports them; the owner ordered them repaired). One is declined — advisory 5 (other units' `sources.md` ledgers still spelling `| id | claim | source | certainty |`) is **not** repaired: those are frozen design records of closed units, and editing another unit's record is falsification, not documentation currency; the live surfaces (`skills/`, `docs/workflow/`, `template/`, `packages/`) carry only the new grammar, which the Retirements receipt now proves by construction.
- **E10** — 2026-11-07, the frozen corpus, RED before any edit (each reproducer from `external-verify.md`): `rg -n "on approval, open the PR" …/SPEC.md` → 1 match at `:253` (exit 0); `sed -n '81,93p' DESIGN.md | rg -c "model memory"` → 0; `rg -n "86 (root suites|PASS)" …/SPEC.md` → 2 matches vs `ls scripts/*.test.mjs | wc -l` → 87; `rg -n certainty skills/ docs/ | wc -l` → 66 against the claim that the journal tables are the only carriers; `ls .agentic-workflow/journal/ | rg 432` → none.
- **E11** — 2026-11-07, §3 fixture (throwaway copy at `/tmp/fix432-batch-*`, removed after): the exact patch, applied there first by an assertion-guarded replacer (each old text must match exactly once), then `bun test scripts/knowledge-honesty-contract.test.mjs` 15 pass / 0 fail · `bun test scripts/unit-doc-contract.test.mjs` 19 pass / 0 fail · `bun scripts/check-skill-context.mjs` PASS 28 skills · `--documents` PASS 4 documents · `node scripts/prose-gate-inventory.mjs` PASS · `bun scripts/skill-lint.mjs` 0 findings · `bun scripts/docs-generate.mjs --check` PASS · the fragment write through `writeFragment` (narrative, branch `feat-432-model-memory-tier-0`, session `local`) parsed back correctly and `bun test test/journal.test.mjs` in `packages/agentic-workflow` ran 24 pass / 0 fail with it in the carrier. **Gap disclosed:** that fixture gate set omitted `scripts/roadmap-settle.test.mjs`'s live-tree case, so the first `## Next` rewrite (which names PR #447's URL) went red at the live gate — `pr-url-unsettled` — and the repair was routed back through the same fixture run before it touched the live tree again: the ROADMAP Fixes row settles to the gate's own expected form `done · [#447](…)`, and the projection is regenerated by `bun scripts/docs-generate.mjs`, never hand-written.
- **E12** — 2026-11-07, the live tree after both patches: `bun test scripts/knowledge-honesty-contract.test.mjs` 15 pass / 0 fail · `bun test scripts/unit-doc-contract.test.mjs` 19 pass / 0 fail · `bun scripts/check-skill-context.mjs` PASS 28 skills (`unit-lane` 331 lines / 4,332 est, ceiling 322 / 4,528) · `--documents` PASS 4 documents (`GATE_INVENTORY.md` 149 / 57 / 4,862) · `node scripts/prose-gate-inventory.mjs` PASS (`model-memory-provenance — prose · DESIGN.md:61`) · `bun scripts/skill-lint.mjs` 0 findings · `node scripts/roadmap-settle.mjs` PASS 146 unit docs / 0 violations · `bun scripts/docs-generate.mjs --check` PASS 3 files / 0 stale · `bun scripts/lint-changeset.mjs` ok.
- **E13** — 2026-11-07, advisory 4's corrective entry, written as a NEW carrier fragment and never as an edit of the stale `Next` at `docs/LOGS.md:4588`: `writeFragment` → `.agentic-workflow/journal/20261107T113150Z-feat-432-model-memory-tier-0-narrative-local.md` (1,734 bytes, `parseFragmentName` returns `{timestamp, branch: feat-432-model-memory-tier-0, kind: narrative, sessionId: local}`). `docs/LOGS.md` is untouched — the merge aggregator is its only writer while the carrier is opted in.
- **E14** — 2026-11-07, the batch's final head: `node scripts/run-root-suite.mjs` · exit 0 · 87 PASS / 0 FAIL, run twice (default worker pool and `--jobs 4`). Honest note: one earlier run of the same suite returned 3 FAILs — `ceremony-workspace`, `ceremony-findings-ledger`, `session-close` — and each of the three re-ran green alone (14 / 0, 19 / 0, 28 / 0) with no assertion message attributable to this change, so the batch is attributed to the gate's worker pool under load, not to the diff; two later full runs were 87 / 0. Crate suites: `bun run test:node` 389 pass / 0 fail, `bun run test` 388 pass / 0 fail (packages/agentic-workflow), `bun run test` 530 pass / 0 fail (packages/pi-agentic-workflow).
- **D5** — 2026-11-07, the owner overrode D4's decline and ordered advisory 5 applied: `Aplica el 5 que declinaste`. Applied as a **shape-only** migration, never a content rewrite — the `provenance` column classifies each row's own first cited source by a stated mechanical rule, and a dated note above each table says so, so no cell can be mistaken for newly researched evidence.
- **E15** — 2026-11-07, advisory 5's repair: 7 claim-journal files (11 tables, **148 rows**) gain the `provenance` column — `66-engram-memory-substrate/sources.md` · `67-serena-provisioning/sources.md` (6-column shape, provenance inserted before `certainty`) · `78-unit-cycle/sources.md` · `79-spec-by-reference/sources.md` (2 tables) · `82-relay-lane-execution/sources.md` · `84-published-vocabulary-sweep-gate/sources.md` · `303-investigate-orient-ask/decisions.md` (2 tables) — plus the two shape descriptions that spelled the old header (`66…/sources.md:3`, `303…/BRIEF.md:16`). Rule, applied without judgement per row: explicit model-memory wording → `model memory`; first cited source an `http(s)` URL → `version-pinned doc`; first cited source an `issue #N`/`#N §…` reference → `owner answer`; anything else (path, command, git/gh receipt, `PE-`/`INV-`/`CLAIM-` reference) → `repository`. Proofs: the migration is **idempotent** (a second run reports `changedFiles=0 notes=0 insertedRows=0`); and **additive only** — each of the 7 files is byte-identical to its `HEAD` version once the `provenance` cell and the note are stripped (separator rows widened by exactly one cell; 50/45/18/111/22/56/67 lines compared line by line, 0 content drift).
- **E16** — 2026-11-07, gates after the migration (live tree): `node scripts/run-root-suite.mjs` exit 0 · **87 PASS / 0 FAIL** · `bun test scripts/knowledge-honesty-contract.test.mjs` 15 / 0 · `bun test scripts/unit-doc-contract.test.mjs` 19 / 0 · `bun scripts/check-skill-context.mjs` PASS 28 skills · `--documents` PASS 4 · `node scripts/prose-gate-inventory.mjs` PASS · `bun scripts/skill-lint.mjs` PASS · `node scripts/roadmap-settle.mjs` PASS 0 violations · `bun scripts/docs-generate.mjs --check` PASS 0 stale. Fixture disclosure: the same suite inside the `/tmp` copy returned 5 FAILs — `doc-discipline`, `local-gate`, `red-first`, `roadmap-moved`, `unit-route` — every one of them `fatal: not a git repository`, because the copy carries no `.git`; the live run is the gate, and no assertion text implicated the migrated files.
- **D6** — 2026-11-07, advisory 5's **boundary**, reported rather than crossed: the three `### Planning evidence` tables still in the retired 4-column shape (`353-residue-shadow-copies/SPEC.md:84`, `375-release-notes-rendering/SPEC.md:104`, `103-doc-currency/SPEC.md:156`) are **not** claim journals — the canonical planning-evidence ledger is the six-column `id | authority-kind | claim | source | freshness | affected-decision-or-obligation` shape, so adding `provenance` there would mint a third grammar, and converting them would require inventing `authority-kind`/`freshness`/`affected-decision-or-obligation` cells for other units' closed ledgers, which `LEDGERS.md` forbids ("a legacy unit keeps the ledger it was written with and is never rewritten to migrate it"). Left as written; converting them is a separate unit with the canonical shape. Residue also noted: `CHANGELOG.md:747` quotes the old header inside the 2.2.0 release note — a published changelog entry, never rewritten.
- **D7** — 2026-11-07, owner decision recorded for this correction batch: owner chose route B — the batch-2 migration stands; the 11 mislabeled cells are corrected inside the closed four-kind set; the fifth-kind route (C) was measured and rejected (3/148 cells). The clause widening `version-pinned doc` rides the same batch on the verifier's recommendation; route A (revert) was rejected.
- **E17** — 2026-11-07, RED before anything else, on the receipt's own reproducers: `bun test scripts/knowledge-honesty-contract.test.mjs` · exit 1 · 17 cases, 2 fail — the #432 F1 pin names 6 offenders, each asserting `repository` for the source its row cites: `66-engram-memory-substrate/sources.md:17` (`cat ~/.pi/agent/mcp.json`), `:20` (`curl -m4 :7437/health`), `:37` (`~/.pi/agent/settings.json:24`), `67-serena-provisioning/sources.md:20` (`registry.npmjs.org/…/latest` + `pi.dev/…`), `79-spec-by-reference/sources.md:77` (`gh issue view 303/305`), `84-published-vocabulary-sweep-gate/sources.md:63` (`gh api …/issues/305,308,303`) · the case lands alone at `99fbb547`.
- **E18** — 2026-11-07, §3 fixture (throwaway copy at `/tmp/fix432-batch3-*`, deleted after) and then the same bytes in the live tree: `bun test scripts/knowledge-honesty-contract.test.mjs` 17 pass / 0 fail · `bun test scripts/unit-doc-contract.test.mjs` 19 / 0 · `node scripts/prose-gate-inventory.mjs` PASS — `model-memory-provenance — prose · skills/unit-lane/references/DESIGN.md:61`, the clause added no line · `bun scripts/check-skill-context.mjs` PASS 28 skills (`unit-lane` references 4,188 est / 291 lines inside the declared 4,528 / 322) · `--documents` PASS 4 · `bun scripts/skill-lint.mjs` 0 findings · `bun scripts/docs-generate.mjs --check` PASS 0 stale · `node scripts/roadmap-settle.mjs` PASS 0 violations · fold commit `b3e33756`. Fixture disclosure, same class as E16: a copy carries no `.git`, so the git-reading suites fail there and the live run is the gate.
- **E19** — 2026-11-07, the ac-hash recompute (F4). The recipe is owned by `skills/pre-execution-review/references/LEDGERS.md:83`: `sed -n '/^## Acceptance criteria/,/^## /p' docs/fix/432-model-memory-tier-0/SPEC.md | git hash-object --stdin` → `43604f8056a06a975fb6fecc9ee268fbea6f35f9`, and the same value at `d391280b` (the freeze commit), `3e02d85c`, `35fc6e1e` and `c1599cf2` — the acceptance section never changed bytes, so the freeze substance holds and only the recorded value was wrong. The frontmatter carried `6b7b62a11222aa8dc19986bfbd0114aeebfd0a31cb9b1e19429e144793bb6e9b`, which reproduces from no revision of this file: the marker named no bytes. Re-stamped to the recomputed value; the projection regenerated by `bun scripts/docs-generate.mjs`, never by hand. The coherence guard declines to execute this validator (`sed`, `git hash-object` are outside its reader allowlist) — disclosed as a skip, proven in the foreground here (O19).
- **E20** — 2026-11-07, F7's scope correction. D6 is **not** edited — `## Log` is append-only. `sed -n '18,26p' skills/pre-execution-review/references/LEDGERS.md` · exit 0 · the sentence D6 quotes ("a legacy unit keeps the ledger it was written with and is never rewritten to migrate it") sits inside the paragraph that opens **"One findings carrier per unit, one read path."**, whose object is `review-findings.md` versus the unit doc's `## Findings` — not the planning-evidence table. So the quotation does not carry D6's planning-evidence boundary, and the scope of the citation is bounded here. The rest of D6's argument stands on its own: a fifth `provenance` column in those six-column ledgers would mint a third grammar, and converting them would invent `authority-kind`/`freshness`/`affected-decision-or-obligation` cells for other units' closed records — which is why the boundary itself does not move. The copy of the quote in `.agentic-workflow/journal/20261107T120858Z-feat-432-model-memory-tier-0-narrative-local.md` is dated history: superseded by the new fragment this batch writes, never edited.
- **E21** — 2026-11-07, the live tree after the fold: `bun test scripts/knowledge-honesty-contract.test.mjs` 17 / 0 · `bun test scripts/unit-doc-contract.test.mjs` 19 / 0 · `node scripts/prose-gate-inventory.mjs` PASS · `bun scripts/check-skill-context.mjs` PASS 28 skills · `--documents` PASS 4 · `bun scripts/skill-lint.mjs` PASS · `node scripts/roadmap-settle.mjs` PASS 0 violations · `bun scripts/docs-generate.mjs --check` PASS 0 stale · `node scripts/run-root-suite.mjs` exit 0 · 87 suites PASS / 0 FAIL · `packages/agentic-workflow`: `bun run test` 388 pass / 0 fail, `bun run test:node` 389 pass / 0 fail (the carrier gains this batch's fragment) · `bun scripts/local-gate.mjs` pending (recorded below once it runs) · `node scripts/unit-route.mjs 432-model-memory-tier-0` → `open-rows: 0`.
- **E22** — 2026-11-07, the gate run E21 deferred. `bun scripts/local-gate.mjs --skip-network` · exit 0 · 8 steps PASS in 109s — the subset the installed `pre-push` hook runs, so the push is gated green. `bun scripts/local-gate.mjs` (full, network steps included) · exit 1 · the same run stops at `pi-compat-guard`: `TS2307 Cannot find module '@gtrabanco/agentic-workflow/src/log/render.mjs'` (plus `src/log/publish.mjs`, `src/journal/fragment.mjs`). Measured, not remembered: `git show main:packages/pi-agentic-workflow/src/auto-log-session.ts:32` imports `src/log/render.mjs` and the published `@gtrabanco/agentic-workflow@4.10.0` tarball holds 24 files, none of them `src/log/*` — so the step is red on `main` by construction and `git diff $(merge-base)..HEAD -- packages/` is empty. Already recorded the same way at `docs/fix/405-journal-fragments/SPEC.md` L14 and `docs/LOGS.md:4478`; the train release cures it, not this batch. Disclosed, never skipped around.
- **F1** — 2026-11-07, folded at `b3e33756` under D7: the 11 cells batch 2 mislabeled are re-derived inside the closed four-kind set, cited source by cited source — `66:17`→`version-pinned doc` / `inferred`, `66:18`→`version-pinned doc` / `confirmed` (the row records the installed CLI 3.4.0 from `engram --version`), `66:19`→`version-pinned doc` / `confirmed` (its cited R3 is the run that recorded it), `66:20`→`version-pinned doc` / `inferred (server answers) / unknown (historic cause)`, `66:29`→`version-pinned doc` / `confirmed` (the same installed CLI's own `--help`), `66:37`→`version-pinned doc` / `inferred`, `67:20`→`version-pinned doc` / `inferred`, `67:52`→`version-pinned doc` / `confirmed`, `67:58`→`version-pinned doc` / `confirmed` (the claim names `Serena 1.7.0`), `79:77`→`owner answer`, `84:63`→`owner answer`. Four rows lose `confirmed`, on the rule this branch already published, measured rather than remembered: `bun.lock` carries no `bacnh85` entry at this head and `packages/pi-agentic-workflow/package.json` declares no such dependency (`f930223a` replaced the bridge with native MCP registration), so 67's `/latest` fetch has no project pin to cite; and a config or service read that names no version cannot reach the ceiling. The dated notes above the four touched tables now describe the correction, so no note misdescribes its own batch.
- **F2** — 2026-11-07, folded at `0fef1413`: `## Retirements` declares the retired four-column claim-journal shape, its five-column replacement, the batch that applied it (`35fc6e1e`, 11 tables / 148 rows / 7 journals) and the survivors with their reasons; the search receipt that was already right (`rg -ln "confirmed / inferred / unknown" skills/ template/ packages/` → DESIGN.md + PLAN.md) is kept. Pin: O17.
- **F3** — 2026-11-07, closed by the owner's decision D7 at `0fef1413`: route B, inside the closed four-kind set, with the clause; route A (revert) and route C (a fifth kind, measured need 3/148) rejected. The gate consequence of the choice is O15 — the `model-memory-provenance` anchor must still resolve at DESIGN.md:61, and E18 shows it does.
- **F4** — 2026-11-07, folded at `0fef1413`: the frontmatter `ac-hash` is re-stamped to the value the documented recipe reproduces (`43604f80…`), the projection regenerated by the renderer, and E19 names the recipe, both hashes and the byte-identity of the acceptance section across every revision.
- **F5** — 2026-11-07, folded at `0fef1413`: `## Impact` lists the batch-2 sweep surface (the seven journals and `docs/fix/303-investigate-orient-ask/BRIEF.md`) and the `version-pinned doc` row the clause touches — the surface an executor must sweep, which the section did not name.
- **F6** — 2026-11-07, folded at `0fef1413`: `## Next` names the one real remaining action instead of a stale batch range — push this head to PR #447 and merge, closing #432. The `E10`–`E14` range it pointed at ran to `E16` with `D5`/`D6`, and the carrier gained `0cad771e`'s and `c1599cf2`'s fragments; those are append-only history, superseded by E21.
- **F7** — 2026-11-07, folded at `0fef1413`: E20 bounds D6's LEDGERS quotation — that sentence is the findings-carrier rule, not a planning-evidence rule — and D6 is left byte-identical. Its surviving reason (a third grammar; invented cells) keeps the boundary exactly where D6 drew it.
- **E23** — 2026-11-07, the pushed head after the fold: `b4c96e18` rewords one certainty cell (`67 INV-003`) so it states its own reason instead of pointing at another unit's ledger — the value is unchanged, `inferred`. Verified at that head: `bun test scripts/knowledge-honesty-contract.test.mjs` 17 / 0 · `node scripts/run-root-suite.mjs` exit 0 · 87 PASS / 0 FAIL · `bun scripts/docs-generate.mjs --check` PASS 0 stale · `node scripts/roadmap-settle.mjs` PASS 0 violations · `node scripts/unit-route.mjs 432-model-memory-tier-0` → `open-rows: 0`, route `close-out`. Push receipts: `f2c8b7ab` ran the hook's offline gate (8 steps, exit 0); `b4c96e18`'s push range is prose-only, so `test-impact` skipped the test steps — the two runs above are the foreground proof that the skipped steps still pass.
- **E24** — 2026-11-07, the verifier's blockers-only receipt committed as `3de02abd` (the tree's only dirty path until then, so `audit-pr-gate hygiene` could not pass), then `main` integrated: `git merge origin/main` at `cf041cca`. `git merge-tree --write-tree origin/main HEAD` exited 1 naming exactly three conflicts — `docs/LOGS.md`, `docs/ROADMAP.md`, `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — plus the `docs-generated-merge` driver resolving `docs/generated/units.md` to the incoming projection, re-derived with `bun scripts/docs-generate.mjs`. The two docs are append-only indexes, so both sides' rows survive verbatim and nothing is dropped: `git diff origin/main -- docs/LOGS.md docs/ROADMAP.md` shows only this unit's one entry and one `#432` row (`## ` and `| [` greps over the negated diff return nothing). The manifest is not a union: `main`'s `7d8dc658` re-encoded the file to `\uXXXX` while this branch kept raw UTF-8 and added the `fix 432` source key, and both branches re-based real ceilings, so the resolution keeps `main`'s encoding and takes each ceiling from the side whose tree the merged tree actually is — `AGENTS.md` 9,462 / 111 and the `audit-pr` routes 11,178 from `main`, `GATE_INVENTORY.md` `machineLines` 57 and unit-lane's reference 4,528 / 322 from this branch. Verified by measurement, not by reading: `--documents` reports AGENTS.md 111 machine lines / 8,680 est and GATE_INVENTORY.md 57 / 4,875 (so both #432's and #440's rows are counted), `--routes` reports `audit-pr:feature` 10,161 / 623 under 11,178, and the unit-lane reference is DESIGN.md's 4,188 est / 291 lines under 4,528 / 322 — every ceiling holds on the merged tree, and the gate is PASS 4 documents / 28 skills / 14 routes.
## Next

Push this batch's head to [PR #447](https://github.com/gtrabanco/agentic-workflow/pull/447) (the batch does it — a fast-forward over the remote tip `3e02d85c`, no rewrite) and merge it: that is the one remaining action, and the merge closes #432. Nothing else is open in this unit — `## Findings` carries no row, every obligation row is `verified`, and the receipt re-runs against `## Log` E17–E22.

## References

- Issue [#432](https://github.com/gtrabanco/agentic-workflow/issues/432) — the PR closes it via `Closes #432`.
- Direction [#307](https://github.com/gtrabanco/agentic-workflow/issues/307) (kernel amendment 2026-11-06, comment-1); #359 prose→script migration.
- `docs/research/ATTRIBUTION.md`, `docs/workflow/GATE_INVENTORY.md`, `docs/workflow/GOLDEN_FIXTURE.md`.

## Branch

`feat/432-model-memory-tier-0` (owner-provided; the template's `fix/<n>-<topic>` name was pre-empted by this branch — recorded, not renamed).

## Depends on

None (the issue's own table: "No hard blocker; the prose rule needs nothing that is not already shipped").

## Regression scope

- The design/plan steps' existing knowledge-honesty contract (#303): `bun test scripts/knowledge-honesty-contract.test.mjs` — every pre-existing case exits 0 unmodified.
- The gate inventory validator: `node scripts/prose-gate-inventory.mjs` exits 0 after the new row.
- Context budgets: `bun scripts/check-skill-context.mjs` and `--documents` exit 0.
- The root suite: `node scripts/run-root-suite.mjs` exits 0.
