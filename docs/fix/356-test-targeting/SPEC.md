# fix/356-test-targeting

> Fix specification — one single unit document, cut in the `spec-by-reference`
> shape from `docs/fix/_TEMPLATE/SPEC.md`. The request is issue #356 (quoted
> verbatim in `## Specs` and `L1`); the planning ledgers are frozen as the
> sibling `planning-evidence.md` / `planning-obligations.md` (L sizing) and this
> document names them instead of embedding them.

## Issue

`#356` — test targeting + test triage: the TDD rule gains its "which tests"
half. The PR must close it with `Closes #356`. Roadmap row 93
(`test-targeting-triage`) is this unit's registry entry.

## Specs

Requirements numbered `S#`, quoting the issue's own words verbatim. The frozen
request is `L1`; every later decision cites its `S#`.

**S1 — Test triage: an empty impact set is a recorded verdict, never a silent skip.**
> Testing everything is also wrong: docs-only or prose-only changes must not run the TDD ceremony. The paper's mechanism **is** the triage: TDAD builds a code–test dependency map and ranks tests by weighted impact, so a change with an empty impact set surfaces zero tests and the agent abstains (observed: higher empty-patch rate, no regression increase). This repo already owns per-unit test scoping — feature 61's triage puts `applicable tests` in the unit doc — but *which* tests a phase must verify is still model-guessed at execution time. This unit makes that surface explicit and deterministic, and makes the empty-impact verdict a recorded outcome instead of a silent skip (a `README.md` change records "no test impact — ceremony skipped", it does not invent a test).

**S2 — The AGENTS.md working-rule amendment.**
> **AGENTS.md rule amendment** (working rules): tests before implementation for changes with a **non-empty test impact set**; the targeted tests come from impact analysis plus the project gate; an empty impact set (e.g. docs-only) records the verdict in the phase's evidence instead of running the ceremony.

**S3 — The execute-phase verification contract.**
> **execute-phase verification contract**: RED evidence names the *targeted* tests and their failing first run; the phase's test set is derived, not guessed.

**S4 — The impact hint, two tiers.**
> **Impact hint, two tiers**: LSP-backed references via the already-shipped Serena provisioning (feature 67) where available; portable fallback = `rg`-based symbol→test-file hint (symbols touched → test files referencing them). Never a "run the whole suite" instruction standing in for targeting.

**S5 — verification-contract wording aligned.**
> **verification-contract** wording aligned (which layer, which tests, recorded empty-impact verdict).

**S6 — The non-goals: no graph infrastructure, no policy change, no test-framework choice.**
> - No dependency graph infrastructure beyond the static hint tiers above.
> - No change to the two-cycle cap, review policy, or per-unit triage ownership (feature 61).
> - Test framework choice stays with the target project.

**S7 — Acceptance: four fixtures and the gates.**
> - [ ] Fixture: docs-only change → recorded empty-impact verdict, no TDD ceremony, no invented test.
> - [ ] Fixture: code change → targeted test set surfaced, RED evidence names the targeted tests, then green.
> - [ ] `rg`-absent environment: the hint degrades per the declared fallback and says so.
> - [ ] `bun scripts/check-skill-context.mjs` green; root suites green; changeset per repo rule.

**S8 — Sequencing against the guide split.**
> #332 is relocation-only and keeps working rules in the AGENTS.md core; if it merges first, this is the first *content* amendment to that core.

## Impact

- `scripts/test-impact.mjs` (new) + `scripts/test-impact.test.mjs` (new) — the
  mechanical half: a deterministic, dependency-free hint that answers "which
  tests can this change affect?". It reads paths (`--paths`) or a diff
  (`--base <rev>`), extracts the identifiers the change touches, and resolves
  them to committed test files through one declared matcher (`rg`, falling back
  to `grep`), plus the sibling suite of each changed file and any
  LSP-resolved reference list the caller supplies. It writes nothing.
- `scripts/test-route-map.json` — the change→suite route for the new pair, so a
  checkpoint on this unit costs its own suite instead of the full gate. An
  unmatched path already answers `full-suite`; the row makes the route explicit.
- `AGENTS.md` — the working-rules bullet that owns "tests before
  implementation" gains its targeting half, and `normative-surfaces@1` gains
  the row that binds the verdict block to its grammar.
- `skills/execute-phase/references/TEST_IMPACT.md` (new) — the owner of the
  block's grammar, the two tiers, the empty-impact rule and the RED-evidence
  shape. Cited by `execute-phase`, not loaded on its routes (the
  `risk-tiers.md` precedent), so no route measurement moves for it.
- `skills/execute-phase/SKILL.md` — step 4 and step 5 name the derived test set
  and where the RED run's test names come from. Cited, one link line.
- `skills/verification-contract/SKILL.md` — S5's alignment: which layer runs
  which tests, and that an empty impact set is a recorded verdict rather than a
  missing receipt.
- `skills/unit-lane/references/TESTS.md` — the tests step points at the same
  owner instead of restating it.
- `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — the re-basis for the surfaces
  this unit grows (the guide document and the two touched execute-phase /
  review routes), each with its declared growth source.
- `.changeset/` — the release intent for the two touched skills.
- Determinism boundary: the hint is a pure function of the paths, the diff and
  the tree it is pointed at; it calls no network, has no dependency, holds no
  state, and prints a byte-stable block.

## Retirements

Nothing is retired. The rule this unit amends keeps its owner (the `AGENTS.md`
working-rules bullet) and its enforcing gates
(`scripts/structural-sibling-pins.test.mjs` for pair existence,
`scripts/red-first.mjs` for pair ordering) — the targeting half is added beside
them, and the pair rules stay armed unchanged.

No surface is deleted, because nothing stated the unqualified reading on its
own: the procedure lives in the one bullet this unit amends, and the executor
prose that repeats it is a hand-off, not a second owner.

## Non-goals

- No dependency graph infrastructure beyond the two static hint tiers (S6): the
  hint is path and symbol matching, never a build-time graph, an index or a
  daemon.
- No change to the two-cycle cap, the review policy or per-unit triage
  ownership (S6): the unit's `Applicable tests` section keeps its owner.
- The test framework and the project's own runner stay the target project's
  (S6): the hint names files, never a runner command.
- No LSP client inside the script: the LSP tier is an input the caller supplies
  (`--references`), never a server the script boots.

## Risk tier

Computed, never chosen: `bun scripts/ceremony.mjs tier classify --paths` over
the twelve paths `## Impact` names → `tier: standard`,
`reason_kind: executable-content`, `signals: []` (four escalating paths — the
script, its suite, the route map and the budget manifest — and eight inert
ones).

- **Tier** — `standard` · **Task Size** — `understood: true`,
  `contained_risk: contained`, `resumable_from_diff: true`, `ceremony: unit-doc`,
  `verification: gates`
- **Named high-risk item** — none — not a high-tier unit

## Future

| deferred idea (verbatim) | date | status |
|---|---|---|
| none — nothing was deferred by this request | 2026-11-04 | discarded 2026-11-04 |

## Future cost

- Every phase that changes executable content derives its test set before the
  first RED run, and records the block it got. Binds every executor phase.
- A new test-file naming convention in a target project must be added to the
  hint's declared pattern table, or the hint answers `no candidate test file
  matched` and the phase falls back to the project gate honestly. Binds whoever
  adopts a new convention.

## Applicable tests

`bun test scripts/test-impact.test.mjs` (node fallback
`node --test scripts/test-impact.test.mjs`) — the hint's own suite: the
docs-only empty verdict, the discriminating code-change case, the sibling
source, the `rg`-absent degradation, the LSP input, the fail-closed refusals
and the determinism/no-write pin. `bun scripts/run-root-suite.mjs` (node
fallback `node scripts/run-root-suite.mjs`) — the root gate, which discovers
the new suite with no registration step.

## Known pre-existing issues

- **The guide layer is over its declared estimate ceiling at the cut head.**
  `bun scripts/check-skill-context.mjs --documents` at the base commit
  (`c8b64d0b`) exits 1 with `AGENTS.md: estimate 6884 > 6881`, and
  `scripts/check-skill-context.test.mjs` fails with it — so the root gate is
  red before this unit's first line. `affects` this unit: the amendment lands in
  `AGENTS.md`, so the re-basis below is declared with this drift named, never
  used to hide a growth this unit did not make.
- **`#352` / roadmap row 91 — `scripts/` is repo-only** and planned to move into
  the published crate. `does-not-affect`: the hint would move with the other
  repo gates, and the reference cites it the way `unit-route.mjs` and
  `diff-guard.mjs` are already cited.

## Tasks

- P1 — Cut this unit doc and its two ledgers, and register roadmap row 93 plus
  the `## Fixes` row (validator: `bun scripts/phase-lint.mjs
  docs/fix/356-test-targeting/SPEC.md` exits 0 and prints `verdict PASS`)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)
  Relevant files: docs/fix/356-test-targeting/SPEC.md, docs/ROADMAP.md
- P2 — Commit the fixture corpus alone — the red commit: the suite with one
  case per required behaviour and per required failure state, every case
  failing on the missing module (validator: `bun test
  scripts/test-impact.test.mjs` exits non-zero, every case failing on the
  missing module)
  (Implements: S1, S4, S7)
  Relevant files: scripts/test-impact.test.mjs
- P3 — Implement the hint: path classification, the touched-symbol extraction,
  the three suite sources, the two matcher tiers, the fixed block and the
  fail-closed refusals (validator: `bun test scripts/test-impact.test.mjs`
  exits 0)
  (Implements: S1, S3, S4, S7)
  Relevant files: scripts/test-impact.mjs
- P4 — Wire the surfaces: the route-map row, the `AGENTS.md` rule and its
  inventory row, the new reference, and the two executor wiring paragraphs
  (validator: `bun scripts/check-skill-context.mjs --routes` exits 0 and
  `bun scripts/normative-drift.test.mjs` exits 0)
  (Implements: S1, S2, S3, S5, S8)
  Relevant files: scripts/test-route-map.json, AGENTS.md, skills/execute-phase/references/TEST_IMPACT.md, skills/execute-phase/SKILL.md, skills/verification-contract/SKILL.md, skills/unit-lane/references/TESTS.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P5 — Verification and the release intent: the four acceptance fixtures, the
  gates, the changeset and the roadmap status (validator: `bun
  scripts/run-root-suite.mjs` exits 0 and `bun scripts/lint-changeset.mjs`
  exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)
  Relevant files: .changeset, docs/ROADMAP.md

### Planning evidence

Frozen as the sibling [`planning-evidence.md`](planning-evidence.md) (L sizing) —
one row per Engineering claim the change rests on (`PE-001`…`PE-010`).

### Obligations

Frozen as the sibling [`planning-obligations.md`](planning-obligations.md) (L
sizing) — one row per normative behaviour, compatibility invariant, affected use
case and required failure state (`O1`…`O11`).

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that
proves it. Frozen at cut.

| S# | criterion | proving check |
|---|---|---|
| S1 | a docs/prose-only change yields an empty impact set and a recorded verdict, with no invented test | `bun test scripts/test-impact.test.mjs` exits 0 and its docs-only case passes |
| S2 | the guide states the rule with its targeting half and its empty-set verdict | `rg -c 'test impact' AGENTS.md` matches 1 and `rg -c 'test-impact-verdict' AGENTS.md` matches 1 |
| S3 | the executor's contract names the derived set and the RED evidence that names it | `rg -c 'targeted' skills/execute-phase/references/TEST_IMPACT.md skills/execute-phase/SKILL.md` matches at least 1 per file |
| S4 | the hint resolves a code change to the affected test files, falls back to `grep` with its verdict stated, and never substitutes the whole suite | `bun test scripts/test-impact.test.mjs` exits 0 and its code-change, sibling, `grep`-tier and LSP cases all pass |
| S5 | `verification-contract` states which layer runs which tests and the recorded empty-impact verdict | `rg -c 'test impact' skills/verification-contract/SKILL.md` matches at least 1 |
| S6 | no dependency and no graph infrastructure is added | `git diff --stat c8b64d0b -- package.json packages/agentic-workflow/package.json packages/pi-agentic-workflow/package.json bun.lock` prints nothing under the diff line |
| S7 | the guide layer, the root suites and the changeset are green | `bun scripts/check-skill-context.mjs` exits 0; `bun scripts/run-root-suite.mjs` exits 0; `bun scripts/lint-changeset.mjs` exits 0 |
| S8 | the amendment lands in the `AGENTS.md` core the split left behind, in the section that owns content rules | `rg -c 'test impact' AGENTS.md` matches 1, `rg -c 'test-impact-verdict' AGENTS.md` matches 1 and `bun scripts/check-skill-context.mjs --documents` exits 0 |

## Findings

OPEN rows only, appended by `review-change` and `triage-issue`. A folded row
leaves this table and becomes a `## Log` line.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-04, the request, verbatim: the operator's prompt was
  `Apply to this repository: issue #356`, and the issue body below is the
  frozen request (`S1`…`S8` quote it):

  ```
  ## Summary

  The root `AGENTS.md` rule ("Do tests before implementation") and `execute-phase`'s RED-evidence gate prescribe a *procedure* without *context targeting*. arXiv [2603.17973](https://arxiv.org/abs/2603.17973) (TDAD, SWE-bench Verified, two open-weight models) measured exactly this gap:

  | Configuration | Test-level regression rate |
  |---|---|
  | Vanilla | 6.08% |
  | TDD instructions **without** targeted context | **9.94% — worse than vanilla** |
  | TDD + impact map (which tests this change can affect) | **1.82% (−70%)** |

  Conclusion of the paper: *surfacing contextual information outperforms prescribing procedural workflows*. The rule is not wrong — it is missing its half.

  ## Test triage (owner requirement, 2026-11-02)

  Testing everything is also wrong: docs-only or prose-only changes must not run the TDD ceremony. The paper's mechanism **is** the triage: TDAD builds a code–test dependency map and ranks tests by weighted impact, so a change with an empty impact set surfaces zero tests and the agent abstains (observed: higher empty-patch rate, no regression increase). This repo already owns per-unit test scoping — feature 61's triage puts `applicable tests` in the unit doc — but *which* tests a phase must verify is still model-guessed at execution time. This unit makes that surface explicit and deterministic, and makes the empty-impact verdict a recorded outcome instead of a silent skip (a `README.md` change records "no test impact — ceremony skipped", it does not invent a test).

  ## Proposed fix

  1. **AGENTS.md rule amendment** (working rules): tests before implementation for changes with a **non-empty test impact set**; the targeted tests come from impact analysis plus the project gate; an empty impact set (e.g. docs-only) records the verdict in the phase's evidence instead of running the ceremony.
  2. **execute-phase verification contract**: RED evidence names the *targeted* tests and their failing first run; the phase's test set is derived, not guessed.
  3. **Impact hint, two tiers**: LSP-backed references via the already-shipped Serena provisioning (feature 67) where available; portable fallback = `rg`-based symbol→test-file hint (symbols touched → test files referencing them). Never a "run the whole suite" instruction standing in for targeting.
  4. **verification-contract** wording aligned (which layer, which tests, recorded empty-impact verdict).

  ## Non-goals

  - No dependency graph infrastructure beyond the static hint tiers above.
  - No change to the two-cycle cap, review policy, or per-unit triage ownership (feature 61).
  - Test framework choice stays with the target project.

  ## Sequencing

  #332 is relocation-only and keeps working rules in the AGENTS.md core; if it merges first, this is the first *content* amendment to that core.

  ## Acceptance criteria

  - [ ] Fixture: docs-only change → recorded empty-impact verdict, no TDD ceremony, no invented test.
  - [ ] Fixture: code change → targeted test set surfaced, RED evidence names the targeted tests, then green.
  - [ ] `rg`-absent environment: the hint degrades per the declared fallback and says so.
  - [ ] `bun scripts/check-skill-context.mjs` green; root suites green; changeset per repo rule.
  ```
- **D1** — 2026-11-04, the LSP tier is an input, never a client (S4, S6): a
  CLI script cannot speak MCP, so the preferred tier is resolved by the caller
  with Serena's `find_referencing_symbols` and handed in as `--references
  <file>` (one repo-relative path per line). The script validates every entry
  and unions it with the portable set — never fewer tests than either tier
  found. The portable tier stays the deterministic default, so a machine with
  no Serena still answers the same question.
- **D2** — 2026-11-04, the hint's verdict vocabulary is two words, `targeted`
  and `empty` (S1): a third value for the degraded tier would let a caller
  confuse "how it searched" with "what it found". The tier travels in its own
  `tier:` line, and the degradation prints a `fallback:` line, so the AC's
  "says so" is a fixed field rather than prose.
- **D3** — 2026-11-04, fail-closed is expressed as refusals with exit 1, never
  as a wider answer (S4, S1): no path in scope, no matcher on the machine, a
  `--references` entry that does not exist, and an unknown flag all exit 1. The
  one thing the hint never does is answer `empty` because it could not look.

- **D4** — 2026-11-04, the delivery strategy is one PR (S7): the diff measures
  1636 authored lines across 14 files, past the 400-line work-unit bound, and
  `AGENTS.md` forbids stacking — a PR's base is always `main` — so the only
  legal split would be a stacked one. Recorded as the diff-guard exception
  (G2), never as a number forced to fit.
- **D5** — 2026-11-04, the owner approved the counted-command correction
  found at verification (E5, P5). Verbatim: "Okey, corrige la cifra y luego crea
  la pr". The correction is a defect of the *proving command*, never of the
  scope: `S2` and `S8` asked `rg -c 'test impact' AGENTS.md` for 2 matches while
  the guide states the rule once and spells its inventory row
  `test-impact-verdict`; both rows now read the two atoms they meant — the rule
  phrase once and the surface id once — and `O2`'s validator resolves through
  the same pair. No obligation, task, or criterion's *substance* changed.
- **E9** — 2026-11-04, the corrected criterion and O2's validator, re-run
  (D5): `rg -c 'test impact' AGENTS.md` · exit 0 · `1`;
  `rg -c 'test-impact-verdict' AGENTS.md` · exit 0 · `1`;
  `bun scripts/normative-drift.test.mjs` · exit 0 · `21 pass · 0 fail`;
  `bun scripts/check-skill-context.mjs --documents` · exit 0 ·
  `PASS context documents: 3 budgeted documents`.
- **E1** — 2026-11-04, the cut is frozen before any code:
  `bun scripts/phase-lint.mjs docs/fix/356-test-targeting/SPEC.md` · exit 0 ·
  `verdict PASS` (5/5 phases, fingerprint `9544b897…`);
  `bun scripts/unit-route.mjs --triage 356-test-targeting` · exit 0 ·
  `Steps: implement, evidence`.
- **E2** — 2026-11-04, the red commit (O11, red side): the suite alone at
  `22a6680d` — `bun test scripts/test-impact.test.mjs` · exit 1 ·
  `error: Cannot find module './test-impact.mjs'` (0 pass, 1 fail, 1 error);
  `node --test scripts/test-impact.test.mjs` · `pass 0 · fail 1`.
- **E3** — 2026-11-04, the green commit (O1, O3, O5, O6, O7, O11 green side):
  the hint lands at `8daf7087` — `bun test scripts/test-impact.test.mjs` ·
  exit 0 · `20 pass · 0 fail`; the same file under `node --test` · `pass 20 ·
  fail 0`.
- **E4** — 2026-11-04, the three acceptance fixtures on the shipped tree
  (S1, S4 box 1–3, O1, O3, O5):
  `bun scripts/test-impact.mjs --paths README.md CHANGELOG.md` · exit 0 ·
  `TEST IMPACT — empty`, `executable: 0`, `suites (0)`;
  `bun scripts/test-impact.mjs --paths scripts/test-impact.mjs` · exit 0 ·
  `TEST IMPACT — targeted`, `suites (1): scripts/test-impact.test.mjs`,
  `symbols: classifyPath, isTestFile, symbolsIn`;
  the same command under a PATH carrying only `grep` · exit 0 · `tier: grep`,
  `fallback: rg absent — the symbol-to-test hint ran under grep (same answer, slower)`,
  and the identical suite set.
- **E5** — 2026-11-04, the prose surfaces (S2, S3, S5, S8, O4, O8):
  `rg -c 'targeted' skills/execute-phase/references/TEST_IMPACT.md
  skills/execute-phase/SKILL.md` → 5 and 1;
  `rg -c 'test impact' skills/verification-contract/SKILL.md` → 1;
  `rg -c 'test impact' AGENTS.md` → **1**, not the 2 the frozen criterion and
  O2 ask for — the guide states the rule once, in one bullet, and the inventory
  row spells the surface `test-impact-verdict` (hyphenated), so the second
  occurrence the count assumed does not exist. The rule is stated
  (`AGENTS.md:144`), the surface is declared (`AGENTS.md:334`) and
  `bun scripts/normative-drift.test.mjs` · exit 0 · 21 pass resolves the row;
  only the count is wrong, and it is reported rather than edited into the
  frozen criterion.
- **E6** — 2026-11-04, scope stayed where the Non-goals put it (S6, O10):
  `git diff --stat c8b64d0b -- package.json
  packages/agentic-workflow/package.json packages/pi-agentic-workflow/package.json
  bun.lock` · no output (no manifest, no lockfile, no dependency).
- **E7** — 2026-11-04, the differential against the base commit (the
  `git archive c8b64d0b` copy in `/tmp`): `scripts/check-skill-context.mjs
  --routes` differs only in the eleven routes this unit re-based;
  `scripts/invocation-drift.mjs` · exit 0 both · `115 → 116 skill files` (the
  new reference); `scripts/skill-lint.mjs` · exit 0 both · `90 → 91 file(s)`;
  `scripts/test-route.mjs --list` · exit 0 both · one added route
  (`test-impact`). No unexpected difference: every other reader prints the same
  bytes.
- **E8** — 2026-11-04, the shipped package still consumes the skills tree:
  `cd packages/pi-agentic-workflow && bun run test` · exit 0 ·
  `493 pass · 0 fail` (35 files) after `bundle:skills` staged the new reference.
- **G1** — 2026-11-04, the root gate (S7, O9): `bun scripts/run-root-suite.mjs`
  · exit 0 · `1541 pass · 1 skip · 0 fail` — up from `1520 pass · 2 fail · 1
  skip · 1 error` at the base commit, where the two failures were the guide's
  inherited estimate drift this unit's re-basis closes; and
  `bun scripts/check-skill-context.mjs` · exit 0 ·
  `PASS context budgets: 28 skills`; `--routes` · exit 0 ·
  `PASS route budgets: 14 routes`; `--documents` · exit 0 ·
  `PASS context documents: 3 budgeted documents`;
  `bun scripts/lint-changeset.mjs` · exit 0 ·
  `.changeset/fix-356-test-targeting-test-impact.md ok`.
- **G2** — 2026-11-04, `bun scripts/diff-guard.mjs --base c8b64d0b --unit
  356-test-targeting` · BREACH · `1636 > 400 lines`, `14 > 8 files`.
  **Recorded exception (D4), not a forced number:** the unit doc and its two
  ledgers are ~700 lines of the spec-by-reference block, the hint and its
  corpus ~780, and the wiring six files of one-to-forty lines each. A split was
  considered and rejected: `AGENTS.md` forbids stacked PRs, and a prose-only PR
  would ship a rule with no enforcing mechanism.
- **P1** — 2026-11-04, the unit doc, its two ledgers and roadmap row 93 cut
  before any code · `16069246`.
- **P2** — 2026-11-04, the fixture corpus committed alone — the red commit (E2)
  · `22a6680d`, then the fixture identity and the unknown-path case · `1a35b463`.
- **P3** — 2026-11-04, the hint implemented — the green commit (E3) ·
  `8daf7087`.
- **P4** — 2026-11-04, the wiring: the route row, the guide rule and its
  inventory row, the new reference, the executor and contract paragraphs, the
  budget re-basis and the changeset · `6230176a`.
- **P5** — 2026-11-04, verification on the full diff (E1–E8, G1–G2), the
  obligations closed, and this hand-off. **Open, for the owner:** AC `S2`'s
  proving command and `O2`'s first half ask `rg -c 'test impact' AGENTS.md` for
  2 matches, and the guide states the phrase once (E5). The substance both
  record — the rule at `AGENTS.md:144`, the `test-impact-verdict` row at
  `AGENTS.md:334`, `normative-drift` green — holds; the proposed correction is
  `rg -c 'test impact' AGENTS.md` matches 1 **and**
  `rg -c 'test-impact-verdict' AGENTS.md` matches 1.
  **Disclosed deviation:** the two suite cases added after the red commit
  (`a declaration written inside a fixture string is a mention`, `a one-file
  change never answers the whole gate`) landed in `6230176a` rather than in the
  red commit; each was observed failing against the implementation as it stood
  (the fixture template yielded `added`; a one-file change answered 97 suites).
  The pair itself — `22a6680d` before `8daf7087` — is red-first (O11).

## Triaged steps

```text
TRIAGE — 356-test-targeting (fix)
Steps: implement, evidence
Tiers: implement: cheap, evidence: strong
Skipped: research: trivial scope, design: trivial scope, plan: trivial scope, tests: trivial scope, review: trivial scope, docs: trivial scope, release: not a feature
Budget: strong
```

Run 2026-11-04 via `bun scripts/unit-route.mjs --triage 356-test-targeting`.
This block is authoritative for routing, and the model never re-derives it.
**Declared deviation:** the catalog skips `tests` as trivial scope, but this
unit's own rule (S7) orders the fixture corpus before the behaviour it judges,
so `P2` exists and is the frozen proof of the red side.

## Next

The owner's verdict on PR [#402](https://github.com/gtrabanco/agentic-workflow/pull/402):
the merge closes `#356`, removes the `## Fixes` row and settles roadmap row 93.
The one open decision — the S2/O2 counted-command correction — was approved and
applied (D5, E9); every obligation row is `verified`.

## References

- `#356` — this fix's tracked issue (roadmap row 93).
- PR [#402](https://github.com/gtrabanco/agentic-workflow/pull/402) — the
  change set, with `Closes #356`.
- arXiv 2603.17973 (TDAD) — the measured basis `S1` quotes.
- `docs/fix/382-red-first-commits/SPEC.md` — the red-first gate this unit's
  suite lands under, and the shape this document copies.
- `skills/execute-phase/references/TEST_IMPACT.md` — the contract this unit
  creates.

## Branch

`fix/356-test-targeting`

## Depends on

None — independent of every open unit.

## Regression scope

| scenario | verifier |
|---|---|
| every other skill's context budget is untouched | `bun scripts/check-skill-context.mjs` exits 0 |
| the touched routes stay inside their ceilings | `bun scripts/check-skill-context.mjs --routes` exits 0 |
| the guide layer's other two documents are untouched | `bun scripts/check-skill-context.mjs --documents` exits 0 |
| the route planner still answers `full-suite` for an unmatched path | `bun test scripts/test-route.test.mjs` exits 0 |
| pair existence is still enforced and the new pair lands red-first | `bun scripts/red-first.mjs` exits 0 and `bun test scripts/structural-sibling-pins.test.mjs` exits 0 |
| the root gate stays green | `bun scripts/run-root-suite.mjs` exits 0 |
