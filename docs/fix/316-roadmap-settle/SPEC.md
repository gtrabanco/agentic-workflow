---
scope: standard
---

# fix/316-roadmap-settle

> Fix specification — one single unit document. Retrospective unit: the
> implementation landed in four commits (9950ba61…445a0777) before this doc
> existed; the doc records the requirements, evidence and close-out for PR
> #323.

## Issue

`#316` — tracked issue in the project's forge. The PR must close it via
`Closes #316` in the body.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers.

**S1 — the writer gets call sites.**
> the release/close-out step **calls** the crate's writer (`roadmap rowUpsert`)
> instead of instructing it in prose, and `scripts/unit-cycle.mjs` writes the row
> itself rather than asking the model to

**S2 — the doc↔row contradiction fails closed offline.**
> a unit doc that carries a PR URL whose row is not `done · [#N](same url)` fails
> closed **offline** (root suite), with a named code — no forge call needed

**S3 — the settle is a task the executor owns.**
> the transition is a `## Tasks` item so the executor owns it and a skipped write
> is a failed task, not a missing courtesy

**S4 — the concrete scope: crate check, root gate, call sites.**
> crate: a cross-document check (`roadmap check` or `unit index-check`) comparing a
> unit doc's own facts (NN, slug, status token, PR URL) with its roadmap row, a
> closed exit contract, tests, version bump + CHANGELOG row;
> this repo's wiring: a `scripts/` gate plus a case in the root suite;
> the call sites: `unit-lane`'s release step, `execute-phase`'s close-out and
> `scripts/unit-cycle.mjs` invoke the writer, and the lane's plan step emits the
> settle as a task.

## Impact

- **Consumers of what it delivers**: every future lane unit — the `done` settle
  stops being a prose courtesy and becomes a deterministic write + an offline
  gate; `audit-pr`'s traceability gate stops catching the miss after the review
  pass was already paid; `scripts/unit-cycle.mjs` loop drivers get the settle as
  a state-machine action instead of an instruction to the model.
- **Mentions that stop being true when it lands**: the prose checklist items
  that told the model to "set the roadmap row"
  (`skills/unit-lane/references/RELEASE.md:33`, `skills/unit-lane/SKILL.md:193-195`)
  — replaced by writer-call checklist items and a release-settle task
  (`skills/unit-lane/references/PLAN.md` P<n+1>).
- **What to ask before touching something live on the other side**: nothing —
  the crate's `roadmap rowUpsert` writer grammar is untouched; only a
  separator-detection fix (the old literal `|---|` match refused the repo's own
  `|----|------|…` tables) widens acceptance of existing tables.

## Non-goals

- The row **composer** built from SPEC title/slug/summary/PR —
  [#227](https://github.com/gtrabanco/agentic-workflow/issues/227) (producer half).
- The schema-wide deterministic `verify` for unit docs —
  [#260](https://github.com/gtrabanco/agentic-workflow/issues/260) (verifier half).
- The docs-only zero-code **repair-receipt receiver** —
  [#301](https://github.com/gtrabanco/agentic-workflow/issues/301) (closed;
  re-trigger #260). This fix removes the most frequent *source* of that delta,
  it does not implement the receiver.
- Any roadmap schema change.
- Findings discovered during implementation never expand scope beyond the
  declared regression boundary below.

## Future

none

## Future cost

| Rule | Who it binds |
|---|---|
| The `done` settle stays **code**: any future change to the lane's close-out/release grammar must keep a writer call site (`roadmap rowUpsert` via `unit-cycle` or the skill checklist); reverting to prose-only re-opens #316. | skill authors, `unit-lane`/`execute-phase` maintainers |
| A new doc↔row violation kind must be added to the crate's closed code set (`ROADMAP_CHECK_CODES`, `packages/agentic-workflow/src/edit/Roadmap.mjs`) and mirrored by the root gate (`scripts/roadmap-settle.mjs`) in the same PR — never as a free-string in one of the two. | crate + repo maintainers |

## Applicable tests

- `packages/agentic-workflow/test/roadmap-check.test.mjs` — the crate check
  (17 cases: closed codes, exit contract, separator shapes, own-PR surfaces).
- `scripts/roadmap-settle.test.mjs` — the root gate against the frozen-failure
  corpus (77/79 fail, 40/78/80/272/91 consistent).
- `scripts/unit-cycle.test.mjs` — the settle-roadmap act and its position in
  the state machine.
- Root suite: `node --test scripts/*.test.mjs`.

## Known pre-existing issues

- [#227](https://github.com/gtrabanco/agentic-workflow/issues/227) — row composer
  missing: **does-not-affect** this unit (S4's check reads the doc's own facts;
  it never composes a row).
- [#260](https://github.com/gtrabanco/agentic-workflow/issues/260) — schema-wide
  unit-doc verifier missing: **does-not-affect** this unit (the check here is
  doc↔row only, not the full unit-doc schema).
- [#301](https://github.com/gtrabanco/agentic-workflow/issues/301) (closed) —
  repair-receipt receiver missing: **does-not-affect** this unit (declared
  non-goal; the re-trigger condition stays #260).
- Unit 77's roadmap row is `in-progress` on `main` while PR #309 merged —
  **does-not-affect** the fix itself: it is the gate's frozen-failure corpus
  (`scripts/fixtures/roadmap-settle/docs/features/77-settle-repro/`); repairing
  the live row on `main` is post-merge reconciliation, out of scope.

## Tasks

- P1 — crate: `roadmap check <doc-path>` subcommand with `checkUnitDoc` /
  `findRow`, closed code set `ROADMAP_CHECK_CODES`
  (`row-missing`, `slug-mismatch`, `pr-url-unsettled`), exit contract 0
  consistent · 1 violations · 2 usage, and the separator-detection fix
  (validator: `node --test packages/agentic-workflow/test/roadmap-check.test.mjs` exits 0)
  (Implements: S2, S4)
  Relevant files: packages/agentic-workflow/src/edit/Roadmap.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/test/roadmap-check.test.mjs
- P2 — repo wiring: root gate `scripts/roadmap-settle.mjs` (offline, fails
  closed, named codes) + frozen-failure corpus under
  `scripts/fixtures/roadmap-settle/` + case in the root suite
  (validator: `bun test scripts/roadmap-settle.test.mjs` exits 0)
  (Implements: S2, S4)
  Relevant files: scripts/roadmap-settle.mjs, scripts/roadmap-settle.test.mjs, scripts/fixtures/roadmap-settle/
- P3 — `scripts/unit-cycle.mjs` writes the settle itself: `settleRoadmapRow()` /
  `parsePrUrl()` and a `settle-roadmap` state-machine action between release
  and the receipt chain, via the crate's `rowUpsert`, every cell preserved
  (validator: `bun test scripts/unit-cycle.test.mjs` exits 0)
  (Implements: S1)
  Relevant files: scripts/unit-cycle.mjs, scripts/unit-cycle.test.mjs
- P4 — skill call sites: `unit-lane` RELEASE.md checklist calls the writer,
  PLAN.md emits the release-settle task P<n+1>, `execute-phase` close-out step
  invokes it; README + `docs/workflow/LANE_FLOW.md` API table
  (validator: `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S1, S3)
  Relevant files: skills/unit-lane/SKILL.md, skills/unit-lane/references/PLAN.md, skills/unit-lane/references/RELEASE.md, skills/execute-phase/SKILL.md
- P5 — verification: full gate at the settled head (root suites, crate tests,
  schema tests, budgets)
  (validator: `node --test scripts/*.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4)

## Triaged steps

Paste of `bun scripts/unit-route.mjs --triage 316-roadmap-settle` (2026-10-26, exit 0) — the authoritative step list:

```text
TRIAGE — 316-roadmap-settle (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

Plan/implement/tests already ran (retrospective — P1–P4 in the Log above);
remaining triaged steps: evidence, review, docs.

### Planning evidence

One row per claim the SPEC rests on. Every claim is either the issue's own words
(quoted verbatim in `## Specs`) or a reproduction run on this candidate — no
claim here is a guess.

| id | claim | authority-kind | authority-source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | The crate's roadmap writer exists and is tested, but carries zero call sites and nothing verifies doc↔row. | issue-text | `#316` body, "The four layers, measured" table | current | O1, O2 |
| PE-002 | A unit doc carrying a PR URL is offline-detectable against its own index row, with no forge call. | reproduced | `bun scripts/roadmap-settle.mjs` over the 77/79 frozen corpus — fails closed with `pr-url-unsettled` | current | O2 |
| PE-003 | The transition is a `## Tasks` item, not a courtesy: the lane's plan step emits it and a skipped write fails the task. | issue-text | `#316` body, "Expected behaviour" third bullet | current | O3 |
| PE-004 | The writer's separator rule refused this repository's own tables, so the writer the issue names could not write them. | reproduced | `packages/agentic-workflow/test/roadmap-check.test.mjs` separator cases; `SEPARATOR_RE` now accepts any pipes/dashes/colons rule | current | O1, O4 |
| PE-005 | `roadmap rowUpsert` resolved a bare subcommand word as the table path, so the form the skills named could never run. | reproduced | scratch dir: `roadmap rowUpsert '{…}'` → `EDIT REFUSAL — ENOENT … rowUpsert`; after the repair → `usage…`, exit 2 | current | O4 |
| PE-006 | A fix-index row is not an `NN`-headed roadmap table, so `rowUpsert` cannot settle a fix unit. | reproduced | scratch dir: `rowUpsert` over `docs/fix/README.md` → `Roadmap table header not found` | current | O4 |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case, and
required failure state. Every row is `verified` on this candidate — the validator
in each row is the command that was run, with the outcome it produced.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | The close-out/release step **calls** the crate's writer instead of instructing it in prose; `unit-cycle` writes the row itself. | P3, P4 | P3, P4 | `execute-phase` | `bun test scripts/unit-cycle.test.mjs` exits 0 (45 pass, incl. the `settleRoadmapRow` cell-preservation case) | `## Log` E3, E7 | verified |
| O2 | S2 | A unit doc that carries a PR URL whose row is not `done · [#N](same url)` fails closed **offline**, with a named code and no forge call. | P1, P2 | P1, P2 | `scripts/roadmap-settle.mjs` | `bun test scripts/roadmap-settle.test.mjs` exits 0 (8 pass, incl. the `--root`-without-value usage case) and `node --test packages/agentic-workflow/test/roadmap-check.test.mjs` exits 0 (18 pass) | `## Log` E1, E2 | verified |
| O3 | S3 | The settle is a `## Tasks` item so the executor owns it and a skipped write is a failed task. | P4 | P4 | `unit-lane` plan step | `grep -c 'release-settle' skills/unit-lane/references/PLAN.md` matches ≥1 and `bun scripts/check-skill-context.mjs` exits 0 | `## Log` E5 | verified |
| O4 | S4 | The writer's call sites name a form that executes, and the roadmap grammar keeps accepting the repository's real tables. | P1, P4 | P1, P4 | `agentic-workflow` crate | `node --test packages/agentic-workflow/test/roadmap-check.test.mjs` exits 0 (18 pass) and a bare `roadmap rowUpsert` exits 2 with usage | `## Log` E1, E9 | verified |
| O5 | `## Regression scope` | Existing `rowUpsert`/`annotate` grammar and cell preservation are unchanged; `unit-cycle`'s prior actions and ordering are unchanged. | P1, P3 | P1, P3 | `agentic-workflow` crate | `node --test packages/agentic-workflow/test/edit.test.mjs` exits 0 and `bun test scripts/unit-cycle.test.mjs` exits 0 | `## Log` E3, E7 | verified |
| O6 | S2 | The live tree stays green: no shipped unit doc fails the new gate. | P5 | P5 | `scripts/roadmap-settle.mjs` | `bun scripts/roadmap-settle.mjs` exits 0 · `verdict: PASS · violations: 0` | `## Log` E4 | verified |

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed
yet. A folded row leaves this table and becomes a `## Log` line.

```text
findings-table@1
column | shape | what it holds
id | F<n> | the stable finding id a fold and a log line cite
target | S<n> · <file>:<line> | the requirement or the location the finding names
axis | <axis> | the review axis that found it
severity | high \| med \| low | the ledger severity (the canonical scale)
class | product \| plan \| source \| environment \| runtime | the owner that repairs it
route | fold \| replan-in-unit \| decision-required \| product owner — … \| <free prose> | where the row goes; the router reads this column's head first (`scripts/unit-route.mjs`), and `class` names the owner that repairs it
```

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Review verdict

### Cycle 1 — 2026-10-26, independent reviewer @ HEAD 445a0777 + 27762d27

```
REVIEW-VERDICT: FAIL
- Findings: 2 material, 4 report-notes
- Evidence reproduced: yes
- AC integrity: unchanged from triage
```

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|
| F1 | S1 · scripts/unit-cycle.mjs:553 | correctness | high | source | fold — the settle act's commit ran `git commit -- <path> -m <msg>`: options after `--` are pathspecs, so the commit always failed (reproduced exit 1) and the S1 code-driven settle could never land its commit; the 43 unit-cycle tests only covered pure `decide`/`settleRoadmapRow`, never the commit argv |
| F2 | S4 · docs/fix/README.md (row 244) | scope | low | source | fold — the fix-index row 244 topic rename (`freeze-batch-next-consumer` → `freeze-batch-planner-consumer`, commit 96544a7d) was a deliberate gate-driven repair (the gate's `slug-mismatch` code fails the live tree on the d1bb61c5-born mismatch) but was never documented in the unit doc |
| F3 | S4 · scripts/unit-cycle.mjs:451 | correctness | low | source | report-note — the loop's settle fact checks only `[#<pr>](` link presence, not the exact URL; a wrong-URL settle passes unit-cycle yet fails `roadmap-settle.mjs` — two graders, two strengths |
| F4 | S1 · skills/execute-phase/SKILL.md:186 · skills/unit-lane/references/RELEASE.md:33 | contract consistency | low | source | report-note — the close-out/release settle instruction is unconditioned on unit kind; for fix units a `roadmap rowUpsert` against `docs/features/ROADMAP.md` would insert a spurious feature row, while `unit-cycle`'s `sense`/`settleRoadmapRow` exempt fix units — prose and code disagree on the fix-unit case |
| F5 | S4 · scripts/roadmap-settle.mjs:50 | correctness | low | source | report-note — `--root` with no value throws an uncaught TypeError instead of the documented exit-2 usage path |
| F6 | S2 · docs/features/ROADMAP.md:87 | scope | low | source | report-note — live row 77 is settled to `done · [#309]` in this diff although the SPEC's Known-issues section declares live-row repair post-merge reconciliation, out of scope — necessary for the live-tree-green gate, but it contradicts the doc's own scope statement |

### Cycle 2 — 2026-10-26, after the fold

```
REVIEW-VERDICT: PASS
- Findings: 0 material, 4 report-notes (F3–F6 stand)
- Evidence reproduced: yes
- AC integrity: unchanged from triage
```

F1 re-verified fixed (argv order + 2 new tests + scratch-repo commit run);
F2 resolved by documentation (D3). Report-notes are informational, not blockers;
F4 is the strongest — it stays visible as a re-trigger condition for a future
fix-unit routing pass.

### Cycle 3 — 2026-10-27, delta-scoped, after the post-PASS record commits

```
REVIEW-VERDICT: PASS
- Findings: 0 material, 2 low report-notes
- Evidence reproduced: yes
- AC integrity: unchanged from triage
```

The delta since cycle 2's head was the post-PASS record commits (unit-doc log
lines only). The two low notes: G3 sits above G1 in the `## Log` (append-only,
left in place), and R1's "gates exit 0" is unqualified — the settle gates
passed, `diff-guard` excepted per D2. Folded rows F1/F2 re-verified.

### Cycle 4 — 2026-10-27, the audit's blockers repaired (this commit range)

No review has run over this range yet — the `audit-pr` pass that produced
findings F7–F12 moved the head, so the cycle-3 receipt is void and the next
review is `/review-change 316-roadmap-settle`, not a new verdict here. What the
range contains is recorded in `## Log` as F7–F12's fold lines.

## Log

Append-only. `L1` is the issue text verbatim; every later line carries one kind
token from `log-kind@1`.

- **L1** — 2026-10-26, the issue, verbatim:
  ```
  ISSUE: the roadmap row's done settle is prose-only — the crate's roadmap writer has zero call sites and nothing verifies doc↔row

  ### What's broken

  The roadmap row's `done` settle — the status-machine write `done` + PR link at PR
  open, per `skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:31` and
  `skills/pre-execution-review/references/SNAPSHOT.md:58` — has a **deterministic
  detector and no deterministic writer**. It is the only lane transition assigned to
  free-form prose.

  Two live cases, both caught late (at `audit-pr`, i.e. after the review pass was
  already paid):

  | Unit | State of the artefact | State of the row |
  |---|---|---|
  | 77 `promise-coherence-guard` | PR #309 **merged** 2026-10-21 | `in-progress` on `main` today |
  | 79 `spec-by-reference` (PR #311) | 7 phases logged, PR open, review receipt posted | `in-progress` until the audit blocked on it |

  ### The four layers, measured

  | Layer | Where | State |
  |---|---|---|
  | Writer (crate) | `packages/agentic-workflow/bin/agentic-workflow.mjs:212-238` → `roadmap rowUpsert` / `annotate`; `src/edit/Roadmap.mjs`; documented `docs/workflow/LANE_FLOW.md:255` | **exists, tested** (`test/edit.test.mjs:150,164`) |
  | Call sites of that writer | `grep -rn "agentic-workflow roadmap" --include=*.md --include=*.mjs skills scripts` | **0** |
  | Code-driven cycle | `scripts/unit-cycle.mjs` | **0 `writeFile`** — `:196` and `:227` only instruct the model to "set the roadmap row" |
  | Prose owners | `skills/unit-lane/SKILL.md:193-195`, `references/RELEASE.md:33`; the plan's `## Tasks` (`P1`–`Pn`) | prose checklist item, never a task the executor owns |
  | Detector | `scripts/unit-route.mjs:884` (fail-closed when every phase is recorded and the status is not `done`); `grep -c writeFile` → **0** | deterministic, but has **no writer to point at** |

  The inverse invariant is also unchecked in code: a unit doc **carrying a PR URL**
  must have a row reading `done · [#N](same url)`. The only check is the LLM rule in
  `skills/audit-docs/SKILL.md:70-74`, and it covers the **other direction** (`done`
  ⇒ link). Both live cases carry the URL in-doc
  (`docs/features/77-promise-coherence-guard/SPEC.md:274`, and 79's Evidence row), so
  the contradiction is offline-detectable.

  ### Reproduction

  1. Open a unit's PR without touching its roadmap row — the happy path of every
     lane-era step list, because no task owns it.
  2. `bun scripts/unit-route.mjs <NN-slug>` → `status: in-progress · route: execute · next: /execute-phase … P1`, even with every phase logged.
  3. `/audit-pr` → BLOCKED on `Traceability`; the fix is a documentation commit that
     then voids the `REVIEW-PASS` receipt at the head.

  ### Expected behaviour

  The settle is code and the contradiction fails locally, not at the merge gate:

  - the release/close-out step **calls** the crate's writer (`roadmap rowUpsert`)
    instead of instructing it in prose, and `scripts/unit-cycle.mjs` writes the row
    itself rather than asking the model to;
  - a unit doc that carries a PR URL whose row is not `done · [#N](same url)` fails
    closed **offline** (root suite), with a named code — no forge call needed;
  - the transition is a `## Tasks` item so the executor owns it and a skipped write
    is a failed task, not a missing courtesy.

  ### Scope — narrow slice, subordinate to existing owners

  This is deliberately **not** the general tool. The wider halves are already tracked
  and postponed:

  - **#227** — deterministic *emitters*: the row composer built from SPEC
    title/slug/summary/PR (producer half).
  - **#260** — the schema-wide deterministic `verify` for unit docs, sibling of the
    crate's `edit` CLI, failing closed against the schema package's published
    constants (verifier half; #227's 2026-09-24 scope adjustment names it).
  - **#301** (closed, re-trigger `#260`) — docs-only zero-code repairs voiding the
    `REVIEW-PASS`. This issue removes the most frequent *source* of that delta but
    does not implement the repair-receipt receiver #301 wants.

  In scope here:

  - crate: a cross-document check (`roadmap check` or `unit index-check`) comparing a
    unit doc's own facts (NN, slug, status token, PR URL) with its roadmap row, a
    closed exit contract, tests, version bump + CHANGELOG row;
  - this repo's wiring: a `scripts/` gate plus a case in the root suite;
  - the call sites: `unit-lane`'s release step, `execute-phase`'s close-out and
    `scripts/unit-cycle.mjs` invoke the writer, and the lane's plan step emits the
    settle as a task.

  Out of scope: the row composer (#227), the full unit-doc verifier (#260), the
  repair-receipt receiver (#301), and any roadmap schema change.

  ### Why it is filed instead of absorbed

  Three near-identical misses (77 on `main`, 79 in PR #311, plus the audit that had
  to persist it as `F43`) mean the guard exists while the actor does not — the
  failure mode `AGENTS.md`'s "checklists over heuristics" rule is meant to prevent.
  The fix is small and verifiable; the general tools stay where they are.
  ```
- **D1** — 2026-10-26, owner decision: the unit lives in the **fix tree**
  (`docs/fix/316-roadmap-settle/`, registered in `docs/fix/README.md`), not the
  feature tree. Authority: user answer to lane question `ask 00e3cc04-0105-43d1-9569-691a07eee23a`
  (option `fix_tree`), chosen over the typed `--from-issue` invocation because the
  issue carries `bug` + `fix-next` and the branch is `fix-316-roadmap-writer-call-sites`.
- **P1** — 2026-10-26, P1 — crate `roadmap check` implemented · commit 9950ba61.
- **P2** — 2026-10-26, P2 — root gate + frozen-failure corpus implemented · commit 96544a7d.
- **P3** — 2026-10-26, P3 — unit-cycle settle act implemented · commit 3dea3e9f.
- **P4** — 2026-10-26, P4 — skill call sites + docs + version bumps implemented · commit 445a0777.
- **E1** — 2026-10-26, `node --test packages/agentic-workflow/test/roadmap-check.test.mjs` · exit 0 · 17 pass / 0 fail.
- **E2** — 2026-10-26, `bun test scripts/roadmap-settle.test.mjs` · exit 0 · 7 pass / 0 fail (frozen-failure corpus: 77/79 fail, consistent docs pass).
- **E3** — 2026-10-26, `bun test scripts/unit-cycle.test.mjs` · exit 0 · 43 pass / 0 fail.
- **E4** — 2026-10-26, `bun scripts/roadmap-settle.mjs` (live tree) · exit 0 · `verdict: PASS · violations: 0` over 110 unit docs.
- **E5** — 2026-10-26, `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 28 skills`.
- **E6** — 2026-10-26, `node --test scripts/*.test.mjs` · exit 0 · 903 pass / 0 fail (120s).
- **E7** — 2026-10-26 (post-fold), `bun test scripts/unit-cycle.test.mjs` · exit 0 · 45 pass / 0 fail (43 + 2 new settleCommitArgs tests).
- **E8** — 2026-10-26 (post-fold), `node --test scripts/*.test.mjs` · exit 0 · 905 pass / 0 fail.
- **E9** — 2026-10-26 (post-fold), scratch-repo verification of the fixed argv: `git commit -m "docs(roadmap): settle 80-example — done · [#323](url)" -- docs/features/ROADMAP.md` · exit 0 · commit landed (the F1 repro now passes).
- **G2** — 2026-10-26, `bun scripts/review-receipt.mjs verify --pr 323` · exit 3 · `missing-review-receipt` (no REVIEW-PASS marker with contract=v1 in the PR comments) — routes the close-out to `/review-change`.
- **G3** — 2026-10-26, `agentic-workflow memory probe --json` · memory-probe@1 verdict **`degraded`** — http-health/mcp-runner/binary-version/sync-staleness ok; `session-ambiguity` failed (2 ambiguous active-runtime sessions, 20 closed-space sync findings). Non-blocking; recorded per the lane's memory protocol.
- **G1** — 2026-10-26, `bun scripts/diff-guard.mjs --base main --unit 316` · **BREACH** — Lines: 1101 > 400 · Files: 30 > 8. Anti-gaming respected: nothing deleted to shrink the diff. → recorded as exception D2.
- **D2** — 2026-10-26, owner-recorded exception (diff-guard): the whole-unit diff is 1101 lines / 30 files against the 400/8 budget — a four-layer slice (crate + root gate + unit-cycle + four skills/docs surfaces) that cannot shrink without dropping one of the four layers S1–S4 demand; work was committed across four scoped commits (9950ba61 → 445a0777) before this doc existed. Precedent: unit 78's recorded exception in `docs/features/78-spec-by-reference` decisions.md. Not gaming: the diff was never shrunk.
- **D3** — 2026-10-26, owner-recorded decision (resolves review finding F2): commit 96544a7d renamed fix-index row 244's topic `freeze-batch-next-consumer` → `freeze-batch-planner-consumer` because the new root gate's `slug-mismatch` code fails the live tree on the row↔folder mismatch born in d1bb61c5 — the repair is the gate's own first catch, in-scope as P2's validator passing on the live tree (E4), now documented here.
- **R1** — 2026-10-26, review run — `HEAD 445a0777 (+27762d27)`, verdict **FAIL**, cycle 1, gates exit 0. 2 material (F1, F2), 4 report-notes (F3–F6); verdict section above.
- **F1** — 2026-10-26, folded — F1 repaired: the settle commit argv extracted into pure `settleCommitArgs()` (`-m` before `--`), 2 new tests covering the argv contract, fixed command verified to commit in a scratch repo · commit 523a95e2.
- **F2** — 2026-10-26, folded — F2 resolved by documentation: D3 records the row-244 rename and its gate-driven reason · commit 523a95e2.
- **R2** — 2026-10-26, review run — `HEAD 523a95e2`, verdict **PASS**, cycle 2, gates exit 0. 0 material, 4 report-notes (F3–F6 stand).
- **G4** — 2026-10-27, gate runs at `HEAD 783b57f1` — `node --test scripts/*.test.mjs` · exit 0 · 905 pass / 0 fail; `bun test scripts/unit-cycle.test.mjs` · exit 0 · 45 pass / 0 fail; `node --test packages/agentic-workflow/test/roadmap-check.test.mjs` · exit 0; `bun test scripts/roadmap-settle.test.mjs` · exit 0 · 7 pass / 0 fail; `bun scripts/roadmap-settle.mjs` (live tree) · exit 0 · `verdict: PASS · violations: 0` over 110 unit docs; `bun scripts/check-skill-context.mjs` · exit 0 · 28 skills.
- **R3** — 2026-10-27, review run — `HEAD 783b57f1`, delta-scoped cycle 3 (delta since the cycle-2 head: the post-PASS record commits fc36bfe3 + 783b57f1, unit-doc log lines only), verdict **PASS**, gates exit 0 (G4). 0 material; 2 low report-notes (G3 sits above G1 in this log — insert position, left in place per append-only; R1's "gates exit 0" unqualified — the settle gates, diff-guard excepted per D2). Folded rows re-verified: F1 fixed (`settleCommitArgs()` `-m` before `--`, scripts/unit-cycle.mjs:543, 45 tests), F2 resolved by D3 (direct read). Findings table stays empty; receipt emitted at the head of the record commit below.

- **F7** — 2026-10-27, folded — the `main` conflict is gone: the branch was rebased onto `origin/main` (`c893ea1a`, which had meanwhile merged #324). Two files conflicted and both resolved on the base's intent: `CHANGELOG.md` (main's 0.35.0 kept, this unit re-cut as 0.35.1) and `docs/fix/README.md` (main had cleared the index of merged entries; only the #316 row returns). Nothing was deleted to make a merge pass.
- **F8** — 2026-10-27, folded — the obligation ledger exists: `### Planning evidence` (PE-001…PE-006) and `### Obligations` (O1…O6, every row `verified` with the validator that ran) join the unit doc. `bun scripts/unit-lineage.mjs --unit 316-roadmap-settle` → `LINEAGE OK — lane-era (triage block re-derives) · obligations closed (6)`.
- **F9** — 2026-10-27, folded — the head that carries the repairs is the one that produces the forge run; the pre-repair head carried zero check runs. Local gate at this head: `node --test scripts/*.test.mjs` 922/922, crate suite 254/254, `bun scripts/roadmap-settle.mjs` PASS over 110 unit docs, `bun scripts/check-skill-context.mjs` (skills and `--routes`) exit 0.
- **F10** — 2026-10-27, folded — `Closes #316` added to the PR #323 body; the fix-index row stays `done` · `[#323](…)`.
- **F11** — 2026-10-27, folded — `## Next` rewritten to this head's real state (receipt stale, hand-off `/review-change`) and the cycle-3 verdict block recorded, so the section no longer contradicts the receipt it describes.
- **F12** — 2026-10-27, folded — F3: `unit-cycle` grades the settle through the crate's `checkUnitDoc` (one rule, exact URL) instead of its own `[#N](`-prefix test. F4: both call sites name the executable form and the kind boundary, and a bare `roadmap rowUpsert`/`annotate` is a usage error rather than a filename. F5: `roadmap-settle --root` with no value exits 2 with usage. F6 is moot — `main` had already settled roadmap row 77, so the rebase carries no out-of-scope live edit.
- **D4** — 2026-10-27, owner-noted decision: writing the ledger exposed a defect in the gate it had to pass — `scripts/unit-lineage.mjs`'s `subsectionBody` preferred the first `###` heading found anywhere over a nearer `##`, so the `### Obligations` section swallowed the following `## Findings` table and reported F7–F12 as open obligations. Fixed to stop at the nearest `##`/`###`, with a regression test; the defect would have blocked every unit doc carrying a findings table.
- **D5** — 2026-10-27, owner-noted decision: the pi package re-cuts to **0.35.1** because `main` published 0.35.0 (#321, the Serena bridge replacement) while this branch was open; shipping 0.35.0 again would publish nothing. The crate keeps **0.5.0** (above `main`'s 0.4.0, no collision). D3's row-244 rename is moot on the rebased base: `main` had already removed that row.

- **G5** — 2026-10-27, gate runs at `HEAD 5239889a` — `node --test scripts/*.test.mjs` · exit 0 · 922 pass / 0 fail; crate suite `bun run test` · exit 0 · 254 pass / 0 fail; `bun scripts/roadmap-settle.mjs` · exit 0 · `verdict: PASS · violations: 0` (110 unit docs); `bun scripts/check-skill-context.mjs` and `--routes` · exit 0 (28 skills, 14 routes); `bun scripts/unit-lineage.mjs --unit 316-roadmap-settle` · exit 0 · `LINEAGE OK — lane-era · obligations closed (6)`; `roadmap check docs/fix/316-roadmap-settle/SPEC.md` · exit 0 · PASS.

## Next

The receipt is **stale**: the audit pass that produced findings F7–F12 moved the
head past the `REVIEW-PASS` marker (`sha=e6251202…`), and the repair commits
below moved it again. `bun scripts/review-receipt.mjs verify --pr 323` answers
`stale` at this head, so the closing hand-off is
`/review-change 316-roadmap-settle`, then `/audit-pr 323`.

The blockers that pass cleared, so the next audit re-checks rather than
re-discovers: F7 (rebase onto `main`), F8 (the obligations ledger, plus the
`subsectionBody` section-boundary defect it exposed), F9 (the push that produces
the CI run), F10 (`Closes #316` on the PR body), F11 (this section and the
cycle-3 verdict block), F12 (the writer's call sites, the single settle grader,
the `--root` usage path).

## References

- Issue: [#316](https://github.com/gtrabanco/agentic-workflow/issues/316)
  — the PR closes it via `Closes #316` in the PR #323 body.
- PR: [#323](https://github.com/gtrabanco/agentic-workflow/pull/323)
- Related (out of scope here): #227 (composer), #260 (verifier), #301 (repair receiver)
- `skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md` — the settle's authority source
- `skills/pre-execution-review/references/SNAPSHOT.md` — the settle's detector side
- `docs/workflow/LANE_FLOW.md` — the crate API table the call sites cite

## Branch

`fix-316-roadmap-writer-call-sites` — the branch already existed (work started
before this doc); the template's `fix/316-roadmap-settle` shape was not used.

## Depends on

none

## Regression scope

| Scenario | Verified by |
|---|---|
| The crate's `roadmap rowUpsert`/`annotate` writer keeps its existing grammar and cell-preservation behaviour | `packages/agentic-workflow/test/edit.test.mjs`, `packages/agentic-workflow/test/roadmap-check.test.mjs` |
| `unit-cycle`'s existing state machine keeps every prior action and ordering | `bun test scripts/unit-cycle.test.mjs` |
| The repo's own roadmap tables keep passing the promise-coherence guard | `node --test scripts/*.test.mjs` (includes `promise-coherence` cases) |
| Skill context budgets stay within their enforced ceilings after the SKILL.md edits | `bun scripts/check-skill-context.mjs` |
