# fix/382-red-first-commits

> Fix specification — one single unit document, cut in the `spec-by-reference`
> shape from `docs/fix/_TEMPLATE/SPEC.md`. The request is issue #382 (title and
> body quoted verbatim in `## Specs` and `L1`); the planning ledgers are frozen
> as the sibling `planning-evidence.md` / `planning-obligations.md` (M sizing)
> and this document's sections name them instead of embedding them.

## Issue

`#382` — red-first evidence: a new sibling suite lands red in its own commit
before the implementation. The PR must close it with `Closes #382`. Roadmap row
102 (`red-first-commits`) is this unit's registry entry.

## Specs

Requirements numbered `S#`, quoting the issue's own words verbatim. The frozen
request is `L1`; every later decision cites its `S#`.

**S1 — The ceremony: two commits, red then green.**
> a new script and its sibling suite land in two commits, in this order — the suite first, observed failing on the missing module or the failing assertion (the **red commit**), then the implementation, observed green. The unit doc's `## Log` records both runs as `E` lines naming both commit hashes, so the ceremony is justified with reproducible evidence, not narration.

**S2 — The deterministic gate: same-commit pairs after the cutoff fail.**
> `scripts/red-first.mjs` + sibling `scripts/red-first.test.mjs` (hard gate in the root suite). For every `scripts/<x>.test.mjs` + `scripts/<x>.mjs` pair whose introducing commits are both after the gate's own introduction, the test's introducing commit must **precede** the implementation's; a pair introduced in one commit after the gate fails. Pairs introduced at or before the gate's own commit are grandfathered. Verified with throwaway `mktemp` git repos (the root-suite pattern).

**S3 — The skills half: the ceremony travels to target projects.**
> `execute-phase` and `unit-lane` carry the ceremony into target projects — the tests step commits red before the implementation step commits green, per task, and the evidence names both commits.

**S4 — The prose surfaces: the rule and its evidence shape are stated.**
> Prose surfaces: `AGENTS.md` (working rules) and `docs/workflow/FEATURE_WORKFLOW.md` (the tutorial's testing/commit section).

**S5 — No per-hunk enforcement; no history rewrites.**
> No per-hunk ordering enforcement for behavior *added* to an existing script+suite pair — the gate covers new sibling pairs deterministically; the prose rule covers the broader discipline.
> No rewriting of published history to manufacture red commits for past units.

**S6 — Acceptance: the gate discriminates; the tree passes; a changeset ships; the rule dogfoods itself.**
> - [ ] The gate fails a fixture pair committed together after the cutoff and passes a test-first pair and the shipped tree.
> - [ ] The rule and its evidence shape are stated in `AGENTS.md`, `docs/workflow/FEATURE_WORKFLOW.md`, `execute-phase` and `unit-lane` without breaking context budgets.
> - [ ] A changeset ships for the touched skills; the gate's own pair lands red-first (the rule dogfoods itself).

## Impact

- `scripts/red-first.mjs` (new) + `scripts/red-first.test.mjs` (new) — the
  mechanical half. The gate reads git history (`git log --diff-filter=A`) and
  nothing else; it runs inside the root suite with zero model tokens, so the
  ceremony check is programmatic by construction. Its sibling suite is
  mandatory (`scripts/structural-sibling-pins.test.mjs`).
- `scripts/test-route-map.json` — the change→suite route for the new pair;
  unmatched paths already fall back to the full gate, the row makes the route
  explicit.
- `AGENTS.md` — the working-rules bullet that owns the sibling rule gains the
  ordering half; this guide is the repo's binding statement of the ceremony.
- `docs/workflow/FEATURE_WORKFLOW.md` — the tutorial's execution-order section
  states the same rule where triage and steps are taught.
- `skills/unit-lane/references/TESTS.md` + `IMPLEMENT.md` — the step references
  that own the tests and implement checklists: the red commit becomes the
  checklist, and `IMPLEMENT.md`'s "Never commit red" gains its one sanctioned
  exception so the two rules cannot collide.
- `skills/execute-phase/SKILL.md` — the executor's step-4 wording: the red run
  becomes a red *commit*. Its budget headroom is 20 lines (349 of 369), so the
  edit is a rewrap, not an expansion.
- `.changeset/` — the skills release intent (the two touched skill surfaces).
- `docs/ROADMAP.md` — the row 102 status and the `## Fixes` row.
- Determinism boundary: the gate is a pure function of the git history it is
  pointed at; it reads, writes nothing, calls no network, has no dependency,
  and prints a byte-stable block for the same history.

## Retirements

Nothing is retired. `scripts/structural-sibling-pins.test.mjs` keeps owning
pair *existence* — this unit adds *ordering* beside it, so no line of it is
subsumed and its bullet in `AGENTS.md` survives with one added sentence.

## Non-goals

- No per-hunk or per-behavior ordering enforcement inside an existing pair
  (S5): the gate's granularity is the pair's introducing commits.
- No rewriting of published history to manufacture red commits for past units
  (S5): pairs at or before the gate's own introduction are grandfathered.
- No new skill, no menu entry, no dependency: the gate is a repo script and the
  ceremony lands as prose in surfaces that already exist.
- No test-only gates get a pair requirement: `scripts/*.test.mjs` files with no
  `scripts/<x>.mjs` sibling (the structural gates) are out of the gate's scope
  — there is nothing to precede.

## Future

| deferred idea (verbatim) | date | status |
|---|---|---|
| Extending the ordering rule to pairs outside `scripts/` (e.g. a target project's source trees) once the ceremony has settled here | 2026-11-04 | open |

## Future cost

- Every future script lands as two commits — the suite's red commit and the
  implementation's green commit — with both runs recorded in the unit doc's
  Log. Binds every author of a repo script.
- The gate's cutoff is its own introducing commit: rebasing it away, deleting
  it or squashing its pair into one commit reddens the gate. Binds whoever
  touches `scripts/red-first.mjs`'s history.

## Applicable tests

`node --test scripts/red-first.test.mjs` — the gate's own suite: one fixture
per required failure state (same-commit pair, implementation-first pair), the
test-first pass case, the grandfathering case, the no-pair skip case, and the
shipped-tree pin. `node scripts/run-root-suite.mjs` — the root gate, which
discovers the new suite with no registration step.

## Known pre-existing issues

- `#329` / roadmap row 88 — the root suite runs under `node` by construction
  and fails under `bun`. `affects` nothing here: the gate and its suite are
  documented `node`-first, same as every sibling gate.
- `#352` / roadmap row 91 — `scripts/` is repo-only and planned to move into
  the published crate. `does-not-affect`: the gate would move with the other
  repo gates.
- External verification of #357 could not re-run E1's red-first run from git
  (P2 and P3 share commit `a305e5b1`). `affects` this unit directly — it is
  the defect this unit closes for every future pair.

## Tasks

- P1 — Cut this unit doc and its two ledgers; register roadmap row 102 and
  freeze the requirements before any code (validator:
  `bun scripts/phase-lint.mjs docs/fix/382-red-first-commits/SPEC.md` exits 0
  and its verdict line reads `verdict: PASS`)
  (Implements: S1, S2, S3, S4, S5, S6)
  Relevant files: docs/fix/382-red-first-commits/SPEC.md, docs/ROADMAP.md
- P2 — Commit the fixture corpus alone — the red commit: the suite
  `scripts/red-first.test.mjs` with its fixture cases (the two required
  failure states, the passing order, the grandfathering, the no-pair skip and
  the shipped-tree pin), every case failing on `MODULE_NOT_FOUND` for the
  missing gate module (validator: `node --test scripts/red-first.test.mjs`
  exits non-zero, every case failing on the missing module)
  (Implements: S2, S6)
  Relevant files: scripts/red-first.test.mjs
- P3 — Implement the gate `scripts/red-first.mjs`: the pair discovery, the
  cutoff from its own introducing commit, the ancestor ordering check, the
  byte-stable report and the PASS/FAIL exit code (validator:
  `node --test scripts/red-first.test.mjs` exits 0 and prints `verdict: PASS`)
  (Implements: S2, S6)
  Relevant files: scripts/red-first.mjs
- P4 — Wire the surfaces: the test-route-map row, the `AGENTS.md`
  sibling-rule bullet, `docs/workflow/FEATURE_WORKFLOW.md`'s execution-order
  section, `unit-lane`'s TESTS/IMPLEMENT references (the red commit in the
  checklist, the sanctioned exception to "Never commit red") and
  `execute-phase`'s step-4 rewrap (validator: `node --test
  scripts/red-first.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs`
  exits 0)
  (Implements: S1, S3, S4, S6)
  Relevant files: scripts/test-route-map.json, AGENTS.md, docs/workflow/FEATURE_WORKFLOW.md, skills/unit-lane/references/TESTS.md, skills/unit-lane/references/IMPLEMENT.md, skills/execute-phase/SKILL.md
- P5 — Verification and the release intent: the root gate, the changeset, the
  roadmap status and the PR that closes #382 (validator:
  `node scripts/run-root-suite.mjs` exits 0 and
  `bun scripts/lint-changeset.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6)
  Relevant files: .changeset, docs/ROADMAP.md

### Planning evidence

Frozen as the sibling [`planning-evidence.md`](planning-evidence.md) (M sizing) —
one row per Engineering claim the change rests on (`PE-001`…`PE-008`).

### Obligations

Frozen as the sibling [`planning-obligations.md`](planning-obligations.md) (M
sizing) — one row per normative behaviour, compatibility invariant, affected use
case and required failure state (`O1`…`O9`).

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that
proves it. Frozen at cut.

| S# | criterion | proving check |
|---|---|---|
| S1 | a new script+suite lands as two commits, red recorded before green, with both SHAs in the unit doc's Log | this unit's own `E2`/`E3` lines name both commits; `node scripts/red-first.mjs` exits 0 |
| S2 | a same-commit pair after the cutoff fails; a test-first pair passes; the shipped tree passes | `node --test scripts/red-first.test.mjs` exits 0, its same-commit and test-first and shipped-tree cases all pass |
| S3 | the tests step commits red before the implementation commits green, and the evidence names both commits | `rg -c 'red-first' skills/unit-lane/references/TESTS.md skills/unit-lane/references/IMPLEMENT.md` matches ≥1 per file; `bun scripts/check-skill-context.mjs` exits 0 |
| S4 | AGENTS.md and FEATURE_WORKFLOW.md state the rule with the evidence shape | `rg -c 'red commit' AGENTS.md docs/workflow/FEATURE_WORKFLOW.md` matches ≥1 per file |
| S5 | no per-hunk gate exists and no history was rewritten | `git log --oneline origin/main..HEAD` is a straight line off `main` (no rewrite), and the gate's flags are only `--repo` |
| S6 | the changeset is valid and the gate's own pair lands red-first | `bun scripts/lint-changeset.mjs` exits 0; `git log --diff-filter=A --format=%H -- scripts/red-first.test.mjs scripts/red-first.mjs` shows two distinct commits, test first |

## Findings

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-04, the issue and the owner's decisions, verbatim (the
  request's body; the three owner answers came from the verify thread):
  ```
  ## Summary

  External verification of #357 (PR #377) surfaced **E1**: the unit's log claims the fixture corpus ran red (`MODULE_NOT_FOUND` for the missing scanner) before the implementation existed — but P2 (tests) and P3 (implementation) landed in the **same commit** (`a305e5b1`), so no committed state shows the red run. The claim is unverifiable from git, and nothing in the repo's rules or gates prevents a repeat: the sibling rule ("a new script ships its sibling suite") constrains *existence*, never *commit ordering*, so the TDD ceremony leaves no reproducible evidence.

  ## Proposed fix

  - **The ceremony (repo rule):** a new script and its sibling suite land in two commits, in this order — the suite first, observed failing on the missing module or the failing assertion (the **red commit**), then the implementation, observed green. The unit doc's `## Log` records both runs as `E` lines naming both commit hashes, so the ceremony is justified with reproducible evidence, not narration.
  - **The deterministic gate:** `scripts/red-first.mjs` + sibling `scripts/red-first.test.mjs` (hard gate in the root suite). For every `scripts/<x>.test.mjs` + `scripts/<x>.mjs` pair whose introducing commits are both after the gate's own introduction, the test's introducing commit must **precede** the implementation's; a pair introduced in one commit after the gate fails. Pairs introduced at or before the gate's own commit are grandfathered. Verified with throwaway `mktemp` git repos (the root-suite pattern).
  - **The skills half (owner decision, 2026-11-02 — repo and skills):** `execute-phase` and `unit-lane` carry the ceremony into target projects — the tests step commits red before the implementation step commits green, per task, and the evidence names both commits.
  - Prose surfaces: `AGENTS.md` (working rules) and `docs/workflow/FEATURE_WORKFLOW.md` (the tutorial's testing/commit section).

  ## Non-goals

  - No per-hunk ordering enforcement for behavior *added* to an existing script+suite pair — the gate covers new sibling pairs deterministically; the prose rule covers the broader discipline.
  - No rewriting of published history to manufacture red commits for past units.

  ## Acceptance criteria

  - [ ] The gate fails a fixture pair committed together after the cutoff and passes a test-first pair and the shipped tree.
  - [ ] The rule and its evidence shape are stated in `AGENTS.md`, `docs/workflow/FEATURE_WORKFLOW.md`, `execute-phase` and `unit-lane` without breaking context budgets.
  - [ ] A changeset ships for the touched skills; the gate's own pair lands red-first (the rule dogfoods itself).
  ```
  Owner answers (2026-11-04): "1. Abre con gh" (the issue is this unit's
  request, opened with the automated note), "2. Repo y skills" (S3 in scope),
  and the confirmation that the gate must be programmatic — a deterministic
  script in the root suite, zero model tokens at run time.
- **D1** — 2026-11-04, the gate's granularity is the pair's introducing
  commits (S5): enforcing ordering per behavior-change inside an existing pair
  would require parsing hunks against diffs — brittle, and `git log
  --diff-filter=A` cannot express it. The prose rule (S1, S4) carries the
  per-task discipline; the gate carries the pair-level one. Recorded as the
  scoping decision, not a limitation discovered later.
- **D2** — 2026-11-04, the cutoff is the gate's own introducing commit, not a
  date constant: a date drifts with rebases and timezones, while the
  introducing commit is a fact git already holds, and it makes the gate
  self-anchoring on any clone (no configuration surface).
- **E1** — 2026-11-04, the cut is frozen before any code:
  `bun scripts/phase-lint.mjs docs/fix/382-red-first-commits/SPEC.md` · exit 0 ·
  `verdict PASS` (5/5 phases; fingerprint `3da0f2d6…`); the triage block ran via
  `bun scripts/unit-route.mjs --triage 382-red-first-commits`.
- **E2** — 2026-11-04, the red commit (S1, O8, red side): the suite alone at
  commit `b8461b4f` — `node --test scripts/red-first.test.mjs` · exit 1 · every
  case failing on the missing gate file (`ENOENT … scripts/red-first.mjs`; the
  fixture corpus loads the gate's bytes for fixture repos, so the module-missing
  failure is the loader's, not a test bug).
- **E3** — 2026-11-04, the green commit (S1, O8, green side): the gate lands at
  commit `1374ea96` — `node --test scripts/red-first.test.mjs` · exit 0 ·
  `8 tests, 8 pass, 0 fail` — the two required failure states, the passing
  order, the grandfathering, the no-pair skip, the usage error, determinism and
  the shipped-tree pin.
- **E4** — 2026-11-04, the shipped tree (O4, S2):
  `node scripts/red-first.mjs` · exit 0 · `28 pair(s) · 0 after the cutoff ·
  cutoff 1374ea9`, `0 finding(s)`, `verdict: PASS` — every pre-gate pair is
  grandfathered, including this unit's own pair now ordered test-first.
- **E5** — 2026-11-04, the wiring surfaces (O6, O7):
  `rg -c 'red-first' skills/unit-lane/references/TESTS.md
  skills/unit-lane/references/IMPLEMENT.md` → 1 and 1;
  `rg -c 'red commit' AGENTS.md docs/workflow/FEATURE_WORKFLOW.md` → 2 and 1;
  `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets:
  28 skills`, and `check-skill-context.mjs --routes` · exit 0 after the
  execute-phase rewrap was trimmed back under the route ceilings (three
  trimming commits — the ceilings were exact at the base).
- **E6** — 2026-11-04, the release intent (O9):
  `bun scripts/lint-changeset.mjs` · exit 0 ·
  `.changeset/fix-382-red-first-commits-tests-land-red-before-the-implementation.md`
  ok, declaring `execute-phase` and `unit-lane` minor.
- **G1** — 2026-11-04, the root gate (O9): `node scripts/run-root-suite.mjs` ·
  exit 0 · `1424 tests, 1424 pass, 0 fail` — the new suite is discovered with
  no registration step; `node --test
  scripts/structural-sibling-pins.test.mjs` · exit 0 (existence still enforced).
- **G2** — 2026-11-04, `node scripts/diff-guard.mjs --base 1f527d45 --unit
  382-red-first-commits` · BREACH, both budgets: 664 lines > 400, 13 files > 8
  (against origin/main the run is meaningless — main moved past the branch
  base). **Recorded exception, not a forced number:** the unit doc and its two
  ledgers (~290 lines) are the spec-by-reference block; the gate and its
  fixture corpus (~380 lines) are the deliverable; the remaining six files are
  one-line-to-one-paragraph wiring. A split was considered and rejected:
  stacking is forbidden by `AGENTS.md`, and a prose-only PR would state a rule
  with no enforcing gate — the exact proven-desert pattern this unit closes.
- **P1** — 2026-11-04, the unit doc, its two ledgers and roadmap row 102 cut
  before any code · `acc1735f`.
- **P2** — 2026-11-04, the fixture corpus committed alone — the red commit
  (E2) · `b8461b4f`.
- **P3** — 2026-11-04, the gate implemented — the green commit (E3), then the
  suite's report-header pin corrected to the shipped shape · `1374ea96`,
  `4ad9bb75`.
- **P4** — 2026-11-04, the wiring: the route row, the AGENTS.md bullet (its
  pin's line shape kept), FEATURE_WORKFLOW, TESTS/IMPLEMENT, the
  execute-phase rewrap · `255c3e28`, `dfd27311`, `ded26c78`.
- **P5** — 2026-11-04, verification on the full diff (E1–E6, G1–G2), the
  changeset, the roadmap status and the PR that closes #382.
- **E7** — 2026-11-04, CI's invocation-drift gate (added to main by #380 after
  this branch was cut) flagged `scripts/red-first.mjs:42` as usage-node — the
  usage strings now teach bun-first with the node fallback, matching the
  repo's runtime convention. `dependency-advisory-pass.mjs:57` is flagged by
  the same run but is main's own pre-existing red (#365's file vs #380's new
  gate), recorded here as an advisory outside this unit's scope.
- **E8** — 2026-11-05, the correction round the external verification forced
  (`decisions.md`, P6). The verifier proved the gate answered `PASS` for the
  exact one-commit regression this unit exists to close: `introduced()` read
  `commits[commits.length - 1]` — the OLDEST add of a path — so a pair deleted
  and re-added together after the cutoff was ordered by its first-ever add and
  never flagged. Red side: the new case `a pair re-added together after an
  earlier add still fails (O1)` against the previous index · `node --test
  scripts/red-first.test.mjs` · exit 1 · 8 pass, **1 fail (the re-added case
  only)** — every pre-existing case stays green, so the case discriminates
  rather than duplicating. Green side: `introduced()` takes `commits[0]`, the
  add that produced the current bytes · `node --test scripts/red-first.test.mjs`
  · exit 0 · `9 tests, 9 pass, 0 fail`. The shipped tree is unchanged by the
  fix: `node scripts/red-first.mjs` · exit 0 · `29 pair(s) · 0 after the cutoff
  · cutoff 1374ea9`, `verdict: PASS` — the only multi-add pair
  (`scripts/review-receipt.test.mjs`) stays grandfathered because its latest
  add (`2fc1432c`) predates the cutoff. Root gate: `node
  scripts/run-root-suite.mjs` · exit 0 · `1438 tests, 1437 pass, 0 fail`.
  `scripts/red-first.test.mjs` is a protected path (`**/*.test.*`, `freeze:
  true`), so the edit ships with the owner's `approval` record in
  `decisions.md`, never as an unattributed suite change.

## Triaged steps

```text
TRIAGE — 382-red-first-commits (fix)
Steps: implement, evidence
Tiers: implement: cheap, evidence: strong
Skipped: research: trivial scope, design: trivial scope, plan: trivial scope, tests: trivial scope, review: trivial scope, docs: trivial scope, release: not a feature
Budget: strong
```

Run 2026-11-04 via `bun scripts/unit-route.mjs --triage 382-red-first-commits`.
This block is authoritative for routing, and the model never re-derives it.
**Declared deviation:** the catalog skips `tests` as trivial scope, but this
unit's own rule (S1) orders a test before the behaviour it judges, so `P2`
exists and is the frozen proof of O8 — the red commit is the tests step.

## Next

The PR's green checks and the owner's verdict: the merge closes `#382` and
removes the `## Fixes` row.

## References

- `#382` — this fix's tracked issue (roadmap row 102).
- `docs/fix/357-skill-lint-smells-supply-chain/SPEC.md` — the E1 evidence gap
  this unit closes (external-verify round, 2026-11-02).
- `scripts/structural-sibling-pins.test.mjs` — the pair-existence gate this
  unit composes beside, never replaces.

## Branch

`fix/382-red-first-commits`

## Depends on

None — independent of every open unit.

## Regression scope

| scenario | verifier |
|---|---|
| existing sibling pairs (all pre-gate) stay grandfathered | `node scripts/red-first.mjs` exits 0 on the shipped tree |
| pair existence is still enforced as before | `node --test scripts/structural-sibling-pins.test.mjs` exits 0 |
| every other skill's budget is untouched | `bun scripts/check-skill-context.mjs` exits 0 |
| the root gate stays green | `node scripts/run-root-suite.mjs` exits 0 |
