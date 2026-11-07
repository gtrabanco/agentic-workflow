---
type: fix
scope: small
# ac-hash: 6b7b62a11222aa8dc19986bfbd0114aeebfd0a31cb9b1e19429e144793bb6e9b
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

Consumers: every lane run that journals claims (`sources.md` is
human-authored prose — no machine parser reads its columns, searched at
`PE-003`), the inventory validator (`scripts/prose-gate-inventory.mjs`), and
the context-budget checker (`docs/workflow/SKILL_CONTEXT_BUDGETS.json`).
Nothing executable changes; the worktree branch is `feat/432-model-memory-tier-0`.

## Retirements

Nothing is retired. Empty answer: the change only adds a provenance column, an
exit rule and ledger rows — no surface, token, helper, contract or narrative
becomes obsolete, and no prose currently states the certainty vocabulary in a
place this change would leave stale (searched: `rg -ln "confirmed / inferred / unknown" skills/ template/ packages/`
— the journal tables in DESIGN.md and PLAN.md are the only live carriers, and
both are updated here; every other `certainty` hit belongs to another unit's
frozen design record, which that search excludes by construction).

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
| O13 | Regression scope | The root suite is green at the final head — no prose pin outside the extended suite moved | P7 | P7 | the whole tree | `node scripts/run-root-suite.mjs` exits 0 with 0 FAIL | E8: 87 PASS / 0 FAIL | verified |

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

OPEN rows only. None at cut — the first review was the owner's external verify; the
rows below were appended by the triage of that verify's delta receipt (2026-11-07),
and the rows that receipt also carried as advisories are dispositioned in
`external-verify.md` under the same date rather than persisted here (`report-only`
impact never earns a correction round).

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | S1 · docs/features/67-serena-provisioning/sources.md:20 · docs/features/66-engram-memory-substrate/sources.md:17, :20, :37 | provenance honesty | BLOCKER | docs-only | source | decision-required, gated on F3 — the migrated cell asserts `repository` for a source the row itself names as outside the repository: a `registry.npmjs.org/@bacnh85/pi-serena/latest` + `pi.dev/packages/…` fetch (with certainty `confirmed`, which DESIGN.md:59 grants only to a *pinned* source and forbids for `latest`), `cat ~/.pi/agent/mcp.json`, `curl -m4 :7437/health`, `~/.pi/agent/settings.json:24` + `gh issue view 219` (66:17's own claim text says the provisioning is "machine-global … outside the workflow"). Differential: `git show 3e02d85c:docs/features/67-serena-provisioning/sources.md` carries no `provenance` cell at all, so the false assertion is minted by `35fc6e1e`; nothing else in the tree carries the column, so the reproducer cannot fire on untouched code. If F3 reverts the batch the cells disappear; if it stands, the four cells and their ceiling are repaired by the fold |
| F2 | S1 · docs/fix/432-model-memory-tier-0/SPEC.md:67-75 | documentation currency (retirements) | BLOCKER | docs-only | source | decision-required, gated on F3 — `## Retirements` states "no surface, token, helper, contract or narrative becomes obsolete" while `## Log` D6 (same file:265) calls the 4-column claim-journal shape "the retired 4-column shape" and 148 rows were rewritten to the 5-column grammar by `35fc6e1e`. DESIGN.md:129-131 and the checklist at :270 make the retirement declaration a design deliverable, so the section must name the retired shape, its replacement and the survivors (`353-residue-shadow-copies/SPEC.md:84`, `375-release-notes-rendering/SPEC.md:104`, `103-doc-currency/SPEC.md:156`, `CHANGELOG.md:747`). True at `3e02d85c`, false at `35fc6e1e` — the scope grew and the declaration did not follow |
| F3 | S1 · skills/unit-lane/references/DESIGN.md:58-61 | grammar coverage | WARNING | docs-only | product | decision-required (the owner's call, and it gates F1, F2, F5, F6) — the four-kind set is the issue's verbatim S1 while PLAN.md:196 forbids a blank, `—` or `n/a` cell, so the batch's declared fallback ("anything else — path, command, git/gh receipt — → `repository`") had to mislabel rows. Measured at this head: **11 of the 148 migrated cells** say `repository` for a source the row itself names as outside the repository, and 7 of the 11 are already expressible inside the closed set — an installed tool's own `--version` / `--help` / `doctor` output is "the current docs of that exact version" (`version-pinned doc`), and `gh issue view` / `gh api` read the owner's words (`owner answer`, see 79:77 and 84:63); an eighth (`67-serena-provisioning/sources.md:20`) is not a kind gap but the pinned-version rule working — its `/latest` fetch earns `inferred` until the row cites the pin. Only 3 cells have no kind at all (`66-engram-memory-substrate/sources.md:17`, `:20`, `:37` — a machine-global config path and a live service probe; 2% of the corpus). Routes: revert the batch-2 migration of other units' journals (recommended — it erases F1, F2 and the F5/F6 rewrites and leaves #432's product intact), keep it and re-label those 11 cells inside the closed set (no new kind required, optionally with one clause widening `version-pinned doc` to "an observation of the installed environment that records the version observed"), or widen the set with a fifth kind — measured need below threshold, and it costs the 13 surfaces that name the set verbatim, a red-first change to the suite's `PROVENANCE_SET` pin, and an `S1a` amendment to the owner's own requirement |
| F4 | — · docs/fix/432-model-memory-tier-0/SPEC.md:4 | freeze-marker accuracy | WARNING | docs-only | source | fold — the frontmatter `ac-hash: 6b7b62a1…` does not reproduce from the recipe the ledger owner documents (`sed -n '/^## Acceptance criteria/,/^## /p' docs/fix/432-model-memory-tier-0/SPEC.md \| git hash-object --stdin` → `43604f80…`) at any revision of the file, including the freeze commit `d391280b`, so the marker names no bytes. The acceptance section itself is byte-identical from `d391280b` to `35fc6e1e`, so the freeze substance holds and only the recorded value is wrong: re-stamp it, regenerate the projection with `bun scripts/docs-generate.mjs`, and append an `E` line naming the recompute. Independent of F3 |
| F5 | S1 · docs/fix/432-model-memory-tier-0/SPEC.md:40-66 | documentation currency (sweep surface) | WARNING | docs-only | source | decision-required, gated on F3 — `## Impact` enumerates only the first batch's surface, while `35fc6e1e` also rewrote 7 claim journals and `docs/fix/303-investigate-orient-ask/BRIEF.md`; Impact is the section that owns "the surface the executor must sweep", so what it must list depends on whether F3 keeps or reverts that batch |
| F6 | — · docs/fix/432-model-memory-tier-0/SPEC.md:267-269 | hand-off accuracy | WARNING | docs-only | source | decision-required, gated on F3 — `## Next` points at "the correction batch `## Log` records (`E10`–`E14`)" while the batch that receipt verified runs to `E15`/`E16` with `D5`/`D6`; the action it names is still correct (`gh pr view 447` → OPEN, head `feat/432-model-memory-tier-0`), its range is not, and its final wording depends on F3. This is the same section that carried the previous receipt's blocker |
| F7 | — · docs/fix/432-model-memory-tier-0/SPEC.md:265 | authority citation | WARNING | docs-only | source | fold — D6 justifies its boundary with a quotation attributed to `LEDGERS.md` ("a legacy unit keeps the ledger it was written with and is never rewritten to migrate it"), but that sentence is `skills/pre-execution-review/references/LEDGERS.md:22-24` and is scoped to the **findings** carrier (`review-findings.md` vs the unit doc's `## Findings`), not to planning-evidence tables; the copy in `.agentic-workflow/journal/20261107T120858Z-feat-432-model-memory-tier-0-narrative-local.md` repeats it. D6's other reason (a fifth column there would mint a third grammar; converting would invent `authority-kind`/`freshness` cells) stands alone, so this is precision of authority, not a wrong decision. The `## Log` is append-only: repair with a new dated line, never by editing D6. Independent of F3 |

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

## Next

The owner's external verify of the correction batch `## Log` records (`E10`–`E14`), which closed that receipt's blocker and advisories; then merge [PR #447](https://github.com/gtrabanco/agentic-workflow/pull/447), which closes #432.

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
