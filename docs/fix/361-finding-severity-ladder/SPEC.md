# fix/361-finding-severity-ladder

> Fix specification — one single unit document, cut in the `spec-by-reference`
> shape. The request is issue #361 (title and body quoted verbatim in `## Specs`
> and `L1`); the planning ledgers are frozen as the sibling
> `planning-evidence.md` / `planning-obligations.md` (M sizing) and this document's
> sections name them instead of embedding them.

## Issue

`#361` — findings lack a severity/impact vocabulary — adopt a fixed ladder + impact
column + the baseline-advisory rule. The issue is open; the PR must close it with
`Closes #361`. Roadmap row 98 (`finding-severity-ladder`) is this unit's registry
entry.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.
The scope below is the issue's own **What's wrong**, **Expected behaviour**,
**Where** and **Non-goals**, cut one requirement per distinct ask, in the issue's
order. Rows named `S9` onward keep the issue's own ordering for the failure
statement and the non-goals.

**S1 — One published severity ladder crosses `findings-table@1` and every
`review-*` findings table.**
> **Severity ladder** (closed vocabulary): `BLOCKER | CRITICAL | WARNING | SUGGESTION` in the `findings-table@1` grammar of both `_TEMPLATE/SPEC.md` docs and every `review-*` skill's findings table.

**S2 — One published impact column answers "behaviour, docs, or nothing that
blocks".**
> **Impact column** (closed vocabulary): `blocking | docs-only | report-only` — answers "does this affect behavior, only documents, or nothing that blocks".

**S3 — The baseline-advisory rule is the citable definition of a blocker.**
> **Baseline-advisory rule** as the citable definition: a blocker is *caused by the change and reproducible with realistic input*; a failure already present at the base commit is a **pre-existing advisory and never requires a correction round** (ties into the differential-baseline issue).

**S4 — `decision-required` stays the human-override route for a false negative.**
> Escalation vocabulary already exists (`decision-required`) — keep it as the human-override route for false negatives.

**S5 — `normative-surfaces@1` gains the new grammar cells and the drift gate
covers them.**
> `normative-surfaces@1` gains the new grammar cells; drift gate covers them.

**S6 — The named surfaces change, `skill-lint` checks the new enums, and #355's
finding routes are coordinated with, not re-cut.**
> - `docs/features/_TEMPLATE/SPEC.md` + `docs/fix/_TEMPLATE/SPEC.md` (`findings-table@1`), all `review-*` skills' output contracts, `review-implementation/CLASSIFY.md`, `skill-lint` (check the new enums), coordinate with #355's finding routes.

**S7 — Non-goals: no new skill, menu entry or review axis.**
> - No new skill, no new menu entry, no new review axis.

**S8 — Non-goals: the disposition decision table is unchanged.**
> - Does not change the disposition decision table; it adds vocabulary on top of it.

**S9 — The failure being repaired: a findings row cannot say what it is.**
> There is **no published severity ladder and no impact column** — a reader cannot tell from a findings row whether it is a real functional bug, a documentation-only note, or something that does not block anything. This cost a real review cycle on PR #354 (owner had to ask "are these real bugs or not?").

The grammar the machine reads (`spec-requirement@1`) — one `**S# — title.**` line
per requirement followed by the requester's `>` words; a correction is its own
line (`S1a`), never a rewrite.

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

- **The severity cell is a published machine vocabulary, not prose.**
  `FINDINGS_TABLE_SEVERITIES` (`packages/agentic-workflow-schema/src/vocabularies.ts`)
  is the canonical declaration; the four unit-doc templates and
  `packages/agentic-workflow/src/edit/UnitDoc.mjs` publish it, and
  `scripts/vocabulary-parity.test.mjs` refuses a drifted copy. Replacing the set
  is therefore a schema-package change (breaking), a template change on both the
  repo pair and the exported `template/` pair, and a parity-pin change — one PR.
- **Every reader of the migrated carrier parses positionally.** The row grows
  from six columns to seven (`impact` sits between `severity` and `class`), so
  `scripts/unit-route.mjs` (`findingsRows`), `scripts/ceremony/lib.mjs`
  (`parseFindings` / `renderFindings`), `scripts/ceremony/findings.mjs` (the
  writer and its `--impact` flag) and `scripts/vocabulary-probe.mjs` move
  together. The **legacy** seven-column `review-findings.md` carrier is
  untouched: it is a closed unit's append-only history, read by
  `scripts/ledger-provenance.mjs`, and nothing in this change rewrites it.
- **The envelope is not the table.** `packages/agentic-workflow-schema/src/index.ts`
  keeps `FIX_NOW_SEVERITIES = ["high","med","low"]`; the sensor projects the
  ladder onto it (`SEVERITY_VOCABULARY` in `scripts/workflow-status.mjs`), so a
  published envelope schema stays byte-compatible while the ledger gains its
  fourth tier.
- **Nine finder skills plus every consumer of their tables** carry the closed
  vocabulary in a fixed output block: `review-code`, `review-security`,
  `review-verify`, `review-perf`, `review-design`, `review-a11y`, `review-brand`,
  `review-seo`, `review-debt`, then `review-change` (synthesis + report),
  `review-implementation` (decision table), `product-audit` (finding line),
  `audit-pr` (blocker row), `fold-findings` (frozen-severity branch),
  `triage-issue` (ledger append) and `pre-execution-review` (`LEDGERS.md` carrier
  map). A token left standing in any of them is a second vocabulary.
- **Discovery consumers of the *retired* tokens**: `rg -n '\b(critical|major|minor)\b'`
  over `skills/` is the sweep, and `rg -n '\b(high|med|low)\b' skills/` is its
  companion for severity cells. `skill-lint`'s severity words for a skill diff
  are a *release* vocabulary (major/minor/patch) and are explicitly not this
  ladder — they stay.
- **Not touched:** `#355`'s `route:` cell and the router's route vocabulary
  (`replan | fold | decision-required | product owner`), the disposition decision
  table, and `PRE_EXECUTION_FINDING_SEVERITIES` (the planning receipt's own
  published scale), which the conversion table maps **onto** the ladder instead.

## Retirements

| Retired surface | Replacement | Evidence |
|---|---|---|
| `severity \| high \| med \| low` as the `findings-table@1` scale | `severity \| BLOCKER \| CRITICAL \| WARNING \| SUGGESTION` plus the `impact` cell | `rg -n 'high \\\\| med \\\\| low' docs/features/_TEMPLATE docs/fix/_TEMPLATE template/docs` matches 0 after the change (the legacy carrier's own block stays in `LEDGERS.md`) |
| the finder scale `critical \| major \| minor` in a `review-*` output contract | the same ladder, assigned by every finder | `rg -n 'critical\|major\|minor' skills/review-*` matches 0 after the change |
| the six-column `findings-table@1` row shape | the seven-column row (`impact` between `severity` and `class`) | `rg -n 'six-column\|six columns\|6-column\|6 cols' skills/ docs/workflow/` matches 0 after the change |

The legacy `review-findings.md` seven-column row is **not** retired: it is a
closed unit's frozen history (`docs/features/79-spec-by-reference/review-findings.md`
and siblings), read by `scripts/ledger-provenance.mjs`, and the conversion table
maps its `high|med|low` cells onto the ladder. `S8` keeps the disposition table
and `S4` keeps `decision-required`, so neither is retired either.

## Non-goals

- No new skill, no new menu entry, no new review axis (S7).
- The disposition decision table (`ignore` / `fix-now` / `replan-in-unit` /
  `decision-required` / `proposal`) is unchanged; the ladder adds vocabulary on
  top of it (S8).
- `#355`'s `route:` finding cell and `scripts/unit-route.mjs`'s route vocabulary
  are coordinated with, never re-cut (S6).
- The differential baseline **run** belongs to `#363`; this unit publishes the
  rule the run enforces and the contradiction a static gate can already refuse
  (S3).
- `PRE_EXECUTION_FINDING_SEVERITIES` (planning receipts) and the envelope's
  `FIX_NOW_SEVERITIES` are not replaced — they are mapped (S1, S3).
- No legacy unit document is rewritten: a closed unit's `high|med|low` rows stay
  bytes as they are.

## Future

- `none` — nothing was deferred. `#363` (the baseline run) and `#362` (the
  computed correction budget) are separate issues already filed, not deferrals of
  this unit's scope.

## Future cost

- A new severity or impact token is a schema-const + grammar-block + parity-pin
  change in one PR (the `vocabulary-parity` rule), binding every future unit that
  wants one.
- The exported `template/` pair is pinned by `scripts/vocabulary-parity.test.mjs`
  and `scripts/scaffold-parity.test.mjs`: a future scaffold edit that drifts from
  the repo pair fails the root suite.
- The ladder is now the only severity a finder may assign: a new review axis must
  publish the ladder in its output block or `scripts/vocabulary-parity.test.mjs`
  fails.

## Applicable tests

- `node --test scripts/vocabulary-probe.test.mjs` — the carrier vocabulary: an
  off-ladder severity, a missing/off-vocabulary impact and the frozen corpus rows
  are refused naming `file:line`; the clean fixture passes.
- `node --test scripts/vocabulary-parity.test.mjs` — the published sets, the four
  templates' grammar rows, the nine finder output tables, the conversion table's
  totality, the one-home baseline rule and the skill-lint enum citation.
- `node --test scripts/normative-drift.test.mjs` — the two new
  `normative-surfaces@1` cells resolve to published vocabularies.
- `node --test scripts/unit-route.test.mjs` and
  `node --test scripts/ceremony-findings-ledger.test.mjs` — the router and the
  ceremony writer read/write the seven-column carrier, and the legacy carrier's
  behaviour is unchanged.
- `node --test scripts/scaffold-parity.test.mjs` and
  `node --test scripts/residue-dimensions.test.mjs` — `#355`'s routes and
  `CLASSIFY.md`'s existing rules survive the prose edit.
- `node scripts/run-root-suite.mjs`, `bun scripts/check-skill-context.mjs`,
  `(cd packages/agentic-workflow-schema && bun run test)` — the whole gate.

## Known pre-existing issues

- **`docs/features/79-spec-by-reference/review-findings.md` and every other
  closed unit ledger carry `high|med|low`.** `does-not-affect` this unit: closed
  units are append-only evidence, and the conversion table is exactly the
  read-side map that keeps them meaningful. The probe's corpus rule (in-flight
  docs only) already excludes them.
- **`skills/triage-issue/references/LABELS.md` grades an *issue's* severity
  (`high`) to decide a label.** `does-not-affect`: that is issue triage, not a
  findings row; the ladder governs findings, and the labels document owns its own
  vocabulary. It is left byte-identical.
- **`skills/skill-lint/references/DISCOVERY_AND_LINT.md` uses `major`/`minor`
  for the *change* a SKILL.md diff represents.** `does-not-affect`: a release
  classification, unrelated to a finding's severity; both vocabularies stay and
  the lint rule added here names the ladder separately.
- **`scripts/workflow-status.mjs` accepted the finder scale on read
  (`critical`/`major`/`medium`/`minor`).** `does-not-affect`: those aliases are
  the legacy ledger's read accommodation, kept so a pre-#308 unit still projects;
  the ladder joins the same map.

## Tasks

- P1 — Extract the frozen-failure corpus as failing checks before any machine,
  grammar and prose change: the two live rows from unit 79 (F5, a functional
  defect graded `high`; F12, a docs-only drift graded `med`) reproduced as
  fixture rows that today read as identical, plus a row with the retired
  `medium` severity and a row with no `impact` cell (validator: `node --test
  scripts/vocabulary-probe.test.mjs` exits 1 naming the new cases at this phase,
  and the same command exits 0 once P5 lands)
  (Implements: S1, S2, S9)
  Relevant files: scripts/vocabulary-probe.test.mjs, scripts/fixtures/vocabulary-probe/tree/

- P2 — Publish the two closed sets in the schema package and export them: the
  ladder replaces `FINDINGS_TABLE_SEVERITIES`, `FINDINGS_TABLE_IMPACTS` joins it,
  and `index.ts` re-exports both (validator: `(cd packages/agentic-workflow-schema
  && bun run build && bun run test)` exits 0)
  (Implements: S1, S2)
  Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts, packages/agentic-workflow-schema/src/index.ts

- P3 — Carry the grammar into the four templates and the skeleton: both repo
  `_TEMPLATE/SPEC.md` docs, both exported twins and `UnitDoc.mjs` publish the
  seven-column row with the impact cell (validator: `node --test
  scripts/vocabulary-parity.test.mjs` exits 0 with its five-surface case)
  (Implements: S1, S2)
  Relevant files: docs/features/_TEMPLATE/SPEC.md, docs/fix/_TEMPLATE/SPEC.md, template/docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md, packages/agentic-workflow/src/edit/UnitDoc.mjs

- P4 — Carry the grammar into the readers and writers: `ceremony lib` parses and
  renders the impact cell, `ceremony findings` gains `--impact` and refuses an
  unpublished token, `unit-route` steps over the cell, and the sensor projects
  the ladder onto the envelope (validator: `node --test
  scripts/unit-route.test.mjs scripts/ceremony-findings-ledger.test.mjs` exits 0)
  (Implements: S1, S2, S3)
  Relevant files: scripts/ceremony/lib.mjs, scripts/ceremony/findings.mjs, scripts/unit-route.mjs, scripts/workflow-status.mjs

- P5 — Gate the grammar: the probe gains the `finding-impact` dimension and the
  ladder severity set, the parity suite pins both sets across the templates and
  the nine finder tables, and the drift inventory declares the two new grammar
  cells (validator: `node --test scripts/vocabulary-probe.test.mjs
  scripts/vocabulary-parity.test.mjs scripts/normative-drift.test.mjs` exits 0)
  (Implements: S1, S2, S5, S9)
  Relevant files: scripts/vocabulary-probe.mjs, scripts/vocabulary-parity.test.mjs, scripts/normative-drift.test.mjs, AGENTS.md

- P6 — Own the meanings in one place: `CLASSIFY.md` publishes the ladder, the
  baseline-advisory rule, the total conversion table (never a `BLOCKER` target)
  and the `decision-required` escalation (validator: `node --test
  scripts/vocabulary-parity.test.mjs` exits 0 including the one-home and
  conversion cases, and `node --test scripts/residue-dimensions.test.mjs` exits 0)
  (Implements: S3, S4, S8)
  Relevant files: skills/review-implementation/references/CLASSIFY.md, skills/review-implementation/SKILL.md

- P7 — Carry the vocabulary into the nine finder output contracts, so each
  publishes the ladder and the impact set in its own fixed table (validator:
  `node --test scripts/vocabulary-parity.test.mjs` exits 0 with its nine-finder
  loop, and `rg -c 'critical\|major\|minor' skills/review-*` matches 0)
  (Implements: S1, S2)
  Relevant files: skills/review-code/SKILL.md, skills/review-security/SKILL.md, skills/review-verify/SKILL.md, skills/review-perf/SKILL.md, skills/review-design/SKILL.md, skills/review-a11y/SKILL.md, skills/review-brand/SKILL.md, skills/review-seo/SKILL.md, skills/review-debt/SKILL.md

- P8 — Carry the vocabulary into `review-change`'s synthesis, report and persist
  contracts, so the fused table and the report block carry both cells
  (validator: `node --test scripts/vocabulary-parity.test.mjs
  scripts/ledger-ownership.test.mjs` exits 0)
  (Implements: S1, S2, S6, S8)
  Relevant files: skills/review-change/SKILL.md, skills/review-change/references/ADVERSARIAL_SYNTHESIS.md, skills/review-change/references/OUTPUT_AND_GUARDRAILS.md, skills/review-change/references/PERSIST_AND_DECIDE.md

- P9 — Carry the vocabulary into the audit, fold and ledger contracts:
  `product-audit`'s finding line, `audit-pr`'s blocker row, `fold-findings`'s
  frozen-severity branch, `triage-issue`'s ledger append, `LEDGERS.md`'s carrier
  map and `SENSOR_CORE.md`'s tier projection (validator: `node --test
  scripts/ledger-ownership.test.mjs scripts/pre-execution-quality.test.mjs` exits 0)
  (Implements: S1, S2, S6, S8)
  Relevant files: skills/product-audit/SKILL.md, skills/audit-pr/references/03_AUDIT_PROCESS.md, skills/fold-findings/SKILL.md, skills/triage-issue/references/FOLD_LEDGER.md, skills/pre-execution-review/references/LEDGERS.md, skills/workflow-status/references/SENSOR_CORE.md

- P10 — Add `skill-lint`'s eighth rule for the two published sets and publish the
  migration note for the six- to seven-column move (validator: `rg -n
  'FINDINGS_TABLE_IMPACTS' skills/skill-lint/references/DISCOVERY_AND_LINT.md`
  matches 1 and `rg -n 'findings-table@1' docs/workflow/MIGRATION.md` matches 1)
  (Implements: S6)
  Relevant files: skills/skill-lint/SKILL.md, skills/skill-lint/references/DISCOVERY_AND_LINT.md, docs/workflow/MIGRATION.md

- P11 — Register the unit, record the decisions, re-base any budget the growth
  moves and run the whole gate (validator: `node scripts/run-root-suite.mjs`
  exits 0, `bun scripts/check-skill-context.mjs` exits 0, `bun
  scripts/lint-changeset.mjs` exits 0, and `node scripts/unit-route.mjs 361`
  prints `route: close-out`)
  (Implements: S5, S6, S7, S8, S9)
  Relevant files: docs/ROADMAP.md, docs/fix/361-finding-severity-ladder/, .changeset/, docs/workflow/SKILL_CONTEXT_BUDGETS.json

The link grammar (`task-spec-link@1`) — every bullet names the requirements it
delivers on its own `(Implements: …)` line.

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

The ledger is frozen as [`planning-evidence.md`](planning-evidence.md) beside
this document (M sizing) — the unit doc names it and never embeds a second copy.

### Obligations

The ledger is frozen as [`planning-obligations.md`](planning-obligations.md)
beside this document (M sizing). Before the unit ships every row is `verified`
(or an evidenced `n/a`).

## Acceptance criteria

One observable criterion per `S#`, each naming the check that proves it. This
section is the anchor a review's per-criterion coverage table reads.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 | `findings-table@1` publishes the ladder `BLOCKER \| CRITICAL \| WARNING \| SUGGESTION`, the machine const equals it, and every `review-*` findings table publishes the same four tokens (S1) | `node --test scripts/vocabulary-parity.test.mjs` — the ladder case and the nine-finder loop pass |
| AC-2 | The carrier carries an `impact` cell whose closed set is `blocking \| docs-only \| report-only`, in the grammar, both repo templates, both exported templates and the `UnitDoc` skeleton (S2) | `node --test scripts/vocabulary-parity.test.mjs` — the impact case passes over all five surfaces; `node --test scripts/vocabulary-probe.test.mjs` refuses a missing/off-vocabulary cell |
| AC-3 | The baseline-advisory rule is published once, with its own words, and the conversion table never targets `BLOCKER`; a `BLOCKER` row with `report-only` impact is refused (S3) | `node --test scripts/vocabulary-probe.test.mjs` (the contradiction case) and `node --test scripts/vocabulary-parity.test.mjs` (the one-home and conversion cases) |
| AC-4 | `decision-required` survives as the false-negative escalation and the disposition decision table is unchanged (S4) | `node --test scripts/vocabulary-parity.test.mjs` — the escalation case and the five-class decision-table case pass |
| AC-5 | `normative-surfaces@1` declares the two new grammar cells and the drift gate resolves them against the published vocabularies (S5) | `node --test scripts/normative-drift.test.mjs` exits 0 with the two surfaces in the inventory |
| AC-6 | The named surfaces change, `skill-lint` reports the new enums, and `#355`'s finding routes are untouched (S6) | `node --test scripts/vocabulary-parity.test.mjs` (the lint citation) and `node --test scripts/scaffold-parity.test.mjs` (the route pins) |
| AC-7 | No new skill, menu entry or review axis appears (S7) | `git diff --name-status main -- skills/ \| rg '^A'` prints nothing, and `ls skills \| wc -l` is unchanged |
| AC-8 | The disposition decision table keeps its five classes and the router's route vocabulary is unchanged (S8) | `node --test scripts/vocabulary-parity.test.mjs` and `node --test scripts/scaffold-parity.test.mjs` pass; `rg -n 'const ROUTES' -A 3 scripts/unit-route.mjs` still prints the same closed set |
| AC-9 | The frozen corpus reproduces: the two unit-79 rows and an off-ladder/missing-impact row fail before the change and pass after it (S9) | `node --test scripts/vocabulary-probe.test.mjs` — the corpus case names all four fixture rows; the `E` row records the pre-change red run |

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed
yet. Nothing has been reviewed yet — the table starts empty.

The carrier grammar (`findings-table@1`): the OPEN rows only, appended by
`review-change` and `triage-issue`. A folded row leaves the table and becomes a
`## Log` line, so this table never grows a history column.

```text
findings-table@1
column | shape | what it holds
id | F<n> | the stable finding id a fold and a log line cite
target | S<n> · <file>:<line> | the requirement or the location the finding names
axis | <axis> | the review axis that found it
severity | BLOCKER \| CRITICAL \| WARNING \| SUGGESTION | the published ladder (owner: `skills/review-implementation/references/CLASSIFY.md` §Severity ladder) — `BLOCKER` requires a reproducer, the others convert
impact | blocking \| docs-only \| report-only | whether the finding affects behaviour, only documents, or nothing that blocks
class | product \| plan \| source \| environment \| runtime | the owner that repairs it
route | fold \| replan-in-unit \| decision-required \| product owner — … \| <free prose> | where the row goes; the router reads this column's head first (`scripts/unit-route.mjs`)
```

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind
token from `log-kind@1` — a request or correction, an evidence run, a gate run, a
folded finding, an owner decision, a phase's progress, a review run, a finding's
verification.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-11-04, the issue, verbatim:
  ```
  ## What's wrong

  The review pack classifies findings by *disposition* (`fix-now / replan-in-unit / decision-required / proposal / ignore`, CLASSIFY.md) and only says "don't inflate severity; separate correctness/security from taste" (`review-implementation`). There is **no published severity ladder and no impact column** — a reader cannot tell from a findings row whether it is a real functional bug, a documentation-only note, or something that does not block anything. This cost a real review cycle on PR #354 (owner had to ask "are these real bugs or not?").

  ## Expected behaviour

  1. **Severity ladder** (closed vocabulary): `BLOCKER | CRITICAL | WARNING | SUGGESTION` in the `findings-table@1` grammar of both `_TEMPLATE/SPEC.md` docs and every `review-*` skill's findings table.
  2. **Impact column** (closed vocabulary): `blocking | docs-only | report-only` — answers "does this affect behavior, only documents, or nothing that blocks".
  3. **Baseline-advisory rule** as the citable definition: a blocker is *caused by the change and reproducible with realistic input*; a failure already present at the base commit is a **pre-existing advisory and never requires a correction round** (ties into the differential-baseline issue).
  4. Escalation vocabulary already exists (`decision-required`) — keep it as the human-override route for false negatives.
  5. `normative-surfaces@1` gains the new grammar cells; drift gate covers them.

  ## Where

  - `docs/features/_TEMPLATE/SPEC.md` + `docs/fix/_TEMPLATE/SPEC.md` (`findings-table@1`), all `review-*` skills' output contracts, `review-implementation/CLASSIFY.md`, `skill-lint` (check the new enums), coordinate with #355's finding routes.

  ## Non-goals

  - No new skill, no new menu entry, no new review axis.
  - Does not change the disposition decision table; it adds vocabulary on top of it.
  ```

- **D1** — 2026-11-04, the issue's own scope (S1): the ladder **replaces**
  `high|med|low` as the `findings-table@1` severity scale rather than joining it
  as a second column — one vocabulary per row, which is what "a reader cannot
  tell" asks for. The legacy `review-findings.md` carrier keeps its frozen
  `high|med|low` rows and is mapped on read.
- **D2** — 2026-11-04, S1's verbatim casing: the ladder tokens are published
  uppercase (`BLOCKER | CRITICAL | WARNING | SUGGESTION`). The retired ledger
  scale and the finder scale stay lowercase, so a mixed carrier is visible to a
  human reader and mechanically detectable (the sets are case-sensitive).
- **D3** — 2026-11-04, S2's placement: `impact` is the carrier's fifth column
  (`id | S# / file:line | axis | severity | impact | class | route`), beside the
  severity it qualifies; `route` stays last so `#355`'s routed-cell prose and the
  legacy carrier's trailing `folded` keep their own positions.
- **D4** — 2026-11-04, S3's mechanical half: `BLOCKER` with impact `report-only`
  is refused by the probe. The differential run that proves cause belongs to
  `#363`; until it exists, the contradiction a static gate *can* see (a blocker
  that blocks nothing) is refused instead of published.
- **D5** — 2026-11-04, S3's read-side: the conversion table never targets
  `BLOCKER`. A converted scale can only reach `CRITICAL | WARNING | SUGGESTION`;
  `BLOCKER` is assigned by evidence (a reproducer) or not at all.
- **D6** — 2026-11-04, S3's ownership: the baseline-advisory definition is
  published **here**, in `CLASSIFY.md` §Severity ladder, and roadmap row 100
  (`#363`) cites it instead of keeping its own copy. One home, two consumers —
  the owner row's "not restated" note is satisfied by removing the duplicate.
- **D7** — 2026-11-04, S6's `skill-lint` half: the lint gains an eighth
  report-only rule that names the two published sets; the enforcing half stays
  `scripts/vocabulary-parity.test.mjs` (the gate that can refuse a commit).
- **D8** — 2026-11-04, S1's envelope half: the envelope keeps
  `high|med|low` and the sensor projects (`BLOCKER`/`CRITICAL` → `high`,
  `WARNING` → `med`, `SUGGESTION` → `low`), so a published envelope schema is not
  re-cut for a ledger vocabulary.
- **D9** — 2026-11-04, S4/S8: the finder FAIL rule keeps its old blast radius —
  `critical` → `CRITICAL`, `major` → `WARNING`, `minor` → `SUGGESTION`, so
  `BLOCKER | CRITICAL | WARNING` open still fails a pass and `SUGGESTION` still
  never blocks. No disposition value changes.

## Next

P1 — extract the frozen-failure corpus as failing checks.

## References

- Issue [#361](https://github.com/gtrabanco/agentic-workflow/issues/361) — the
  request. Roadmap rows 98 (this unit), 100 (`#363`, the differential baseline
  the rule feeds) and 99 (`#362`, the computed correction budget that consumes
  the ladder).
- `docs/fix/79-spec-by-reference/review-findings.md` F5 / F12 — the two live rows
  the frozen corpus reproduces (a functional defect and a docs-only drift, both
  indistinguishable by severity today).
- `docs/fix/355-scaffold-parity-routes/` — the preceding unit over the same
  contract family; its `route:` cell is coordinated with, never re-cut.
