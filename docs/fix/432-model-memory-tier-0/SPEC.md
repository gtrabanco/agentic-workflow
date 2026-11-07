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
  journal table and its orient tiers name model memory as never tier-0.
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
place this change would leave stale (searched: `rg -n certainty skills/ docs/`
— the journal tables in DESIGN.md and PLAN.md are the only carriers, and both
are updated here).

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
  pre-edit head runs 86 PASS / 0 FAIL.
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
| PE-001 | known | The pre-edit head is green once the worktree's deps are installed and the unit is registered: 86 root suites, 0 FAIL | `node scripts/run-root-suite.mjs` → 86 `PASS` lines, `FAIL` count 0 (2026-11-07) | current | O1–O13 |
| PE-002 | known | The four papers the journal cites exist with the titles the attribution rows claim: package-hallucination analysis (USENIX Sec 2025), FreshLLMs/FreshQA, inference-time defenses against package hallucination, model-editing mitigation | `web_fetch` of the four `arxiv.org` abs/html pages, 2026-11-07 — titles recorded verbatim in `## Log` E1 | current | O6 |
| PE-003 | known | No machine parser reads the `sources.md` journal columns — `rg -l "sources.md" scripts/*.mjs` (non-test) matches nothing, so adding a `provenance` column breaks no consumer | `rg -l "sources\.md" scripts/*.mjs` → empty (2026-11-07) | current | O8 |
| PE-004 | unknown | Whether measured acceptance will justify the issue's second slice (scripted checks as lane steps) is not decidable in this unit — no measurement exists yet | not measured; the slice stays `open` in `## Future` until #260-rule evidence exists | not-applicable | AC coverage (S3 prose ships; S3 machinery deferred) |
| PE-005 | assumption | DESIGN.md at 263 lines is within 12 lines of its `linesMax` ceiling (275), so the edit is written tight and the budgets outcome (hold or declared re-base) is verified at P4, never assumed | `bun scripts/check-skill-context.mjs` unit-lane reference ceiling `referenceLinesMax: 275` in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`; measured 2026-11-07 | current | O10 |
| PE-006 | known | The golden-fixture smoke run (GOLDEN_FIXTURE.md §When-to-run, optional for a wording edit) needs a fleet weak-model session this change cannot run itself | `docs/workflow/GOLDEN_FIXTURE.md` — "Optional but recommended before the PR" | current | O11 (recorded as honestly skipped, owner runs it) |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | The design and plan journals carry the `provenance` column with the closed four-kind set (`repository / version-pinned doc / owner answer / model memory`) | P3, P4 | P1 | skills/unit-lane/references/DESIGN.md, PLAN.md | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 with the provenance-column cases green | E-row naming the two files the case reads | planned |
| O2 | S1 | The certainty ceiling is a rule, not a prohibition-only line: a claim whose provenance is `model memory` can never carry `confirmed` — its ceiling is `inferred` | P3 | P1 | skills/unit-lane/references/DESIGN.md | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 with the ceiling case green | E-row quoting the pinned sentence | planned |
| O3 | S2 | An external implementation-detail claim verifies against the project's pinned version (lockfile/manifest/action SHA) before it guides a task; the verification rides as a one-fetch receipt in the research/design evidence row | P3 | P1 | skills/unit-lane/references/DESIGN.md | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 with the pinned-version case green | E-row quoting the receipt sentence | planned |
| O4 | S3 | Deterministic verification prefers a script (actionlint, schema validation, type-check), stated as an extension of #359's migration, never as a new rival rule | P3, P5 | P1 | skills/unit-lane/references/DESIGN.md + docs/workflow/GATE_INVENTORY.md | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 with the script-preference case green and `node scripts/prose-gate-inventory.mjs` exits 0 | E-row with both results | planned |
| O5 | S4 | The research step's repo-answered exit: a descriptive question the repository answers skips external research, and the receipt names which claim the repo answered and where; a normative question never closes on precedent | P4 | P1 | skills/unit-lane/references/RESEARCH.md | `bun test scripts/knowledge-honesty-contract.test.mjs` exits 0 with the exit-rule case green | E-row quoting the receipt form | planned |
| O6 | S5 | The adopted knowledge is attributed: `docs/research/ATTRIBUTION.md` carries rows for arXiv 2406.10279, 2310.03214, 2608.22652 and 2607.02052 landing at #432, all `evidence only` (no bytes vendored) | P6 | P6 | docs/research/ATTRIBUTION.md | `rg -n "2406.10279|2310.03214|2608.22652|2607.02052" docs/research/ATTRIBUTION.md` matches 4 or more | E-row with the four matched lines | planned |
| O7 | S5 | No third-party bytes are vendored by this unit, so no four-part provenance header is owed | P7 | P7 | the unit's diff | `git diff main..HEAD --name-status` lists no vendored source file | E-row with the empty vendoring verdict | planned |
| O8 | S1 (non-goal: no semantic change to the ledger reader) | The `sources.md` journal stays a human-authored ledger: no machine parser consumes its columns, so the added column breaks no consumer (compatibility invariant) | P4 | P4 | — | `rg -l "sources\.md" scripts/*.mjs` (non-test) matches nothing | E-row with the empty match | planned |
| O9 | S1 | The pre-existing #303 pins hold — the staged/ordered headings, the citation checklist and the ledger-reader parity tests pass unchanged on the edited references (regression guard) | P3 | P1 | scripts/knowledge-honesty-contract.test.mjs | the pre-existing #303 tests in the same suite exit 0 unmodified (`git diff P3..P1 -- scripts/knowledge-honesty-contract.test.mjs` touches only appended #432 blocks) | E-row with the green run and the diff scope | planned |
| O10 | repo rule (context budgets) | The edited reference stays inside its declared ceiling, or the ceiling is re-based with its `sources` reason in the manifest — never silently over | P5 | P5 | docs/workflow/SKILL_CONTEXT_BUDGETS.json | `bun scripts/check-skill-context.mjs` and `--documents` exit 0 | E-row with measured lines/estimate per edited file and any re-base reason | planned |
| O11 | repo rule (honest verification) | The golden-fixture smoke run for the edited executor-path skill is declared skipped with its reason (needs a fleet weak model), never claimed | P7 | P7 | the unit doc's `## Log` | the `## Log` carries the skip line naming GOLDEN_FIXTURE.md §When-to-run and the owner as the runner | E/D-row naming the skip | planned |
| O12 | repo rule (authoring lint) | The edited skills tree stays lint-clean and free of stack leakage | P7 | P7 | `bun scripts/skill-lint.mjs` | `bun scripts/skill-lint.mjs` exits 0 | E-row with the result | planned |
| O13 | Regression scope | The root suite is green at the final head — no prose pin outside the extended suite moved | P7 | P7 | the whole tree | `node scripts/run-root-suite.mjs` exits 0 with 0 FAIL | E-row with the count | planned |

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

OPEN rows only. None at cut — the first review is the owner's external verify.

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

## Next

Run P1 (RED tests), then implement against the frozen ledgers.

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
