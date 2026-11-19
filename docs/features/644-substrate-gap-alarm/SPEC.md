---
type: feature
scope: medium
ac-hash: 3e65a693b661f0cf2211335fd31e155146ba01df
---

# 644 — substrate-gap-alarm

> One-line: close the two gaps that let a session decide with facts it does not
> own — nothing detects when a missing fact is a *substrate* gap (no document is
> scaffolded to own it) and routes that alarm to `init-workspace` instead of
> halting in the lane, and evidence taken from tree prose is trusted forever
> (#643's stale header comment), so a cited claim is re-checked against the fact
> it asserts before it decides anything.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

Requirements, each numbered `S#` quoting the requester's own words verbatim.
`S1` is the turn's instruction; `S2…S6` quote issue #644, which `S1` adopts as
the request.

**S1 — Apply the issue to this repository.**
> Apply to this repository: issue #644

**S2 — Audit: no skill or command invents an answer.**
> Walk every stage skill (`unit-lane`, `execute-phase`, `review-*`, `audit-*`, `triage-issue`, `fold-findings`, `batch-scheduler`, `workflow-status`, `init-workspace`, `discover-repository-state`, `resolve-repository-state`) and every runner command path; verify each binds `ask-dont-infer@1` by reference (never restatement) at every point where a fact is needed: triage decisions, tier classification, doc placement ("where does this go"), contract selection, dependency declaration, verification depth. Deliverable: an audit table (skill × decision point × binding status); every unbound point gets the reference or a recorded reason why no fact is needed there. This audit is evidence, not prose — it lands in the unit doc.

**S3 — The substrate alarm (new needs-input route).**
> Extend `needs-input` with a third route kind (working name `init-workspace`, owner may rename): when the lane cannot resolve a fact through provenance → research **and** the reason is that no document in the workspace is scaffolded to own it (no architecture doc, no documentation-map row, no contract surface — not "the owner hasn't answered yet"), the `open-questions@1` block routes that question to `init-workspace` instead of only surfacing it. Detection is structural: the question's provenance search found no owning doc because no doc *could* own it. The machine surface (`ROUTES` const, the routing table, `open-questions@1`) changes in one PR with its schema mirror if the envelope vocabulary grows.

**S4 — init-workspace coverage gate.**
> `init-workspace` gains the obligation (bootstrap and upgrade mode): the interview's `ARC`/`DEC`/`API`/documentation-map answers must land in written scaffold sections (charter, architecture pointer, documentation map) — an install that leaves them absent is a refused install (or an explicit recorded decline, ask-first, never a silent skip). Upgrade mode detects a workspace whose substrate lacks those sections and offers the additive block (the #260 S11 edge-4 shape: ask-first, never auto-written).

**S5 — Evidence-staleness rule (the #643 class).**
> A claim used as decision evidence from tree prose (a comment, a doc paragraph) must cite its location, and when a decision contradicts the cited claim's neighborhood (the file it describes now imports the thing the claim denies), the contradiction is surfaced before the decision — prose rule first (owner: the invariant's own home or `unit-lane/references/DESIGN.md`), with a materializable candidate: a lint-class check is **proposed as a follow-up feature**, not silently skipped (receipt-neutrality: no speculative script without a measured failure corpus beyond #643's one case).

**S6 — Make the alarm real before writing prose.**
> S2/S3 are materializable by nature (a route const + a gate step); S4 ships the prose rule and records the script candidate with its re-trigger condition. Tests land red-first for the new route (needs-input suite) and the coverage gate (init-workspace suite).

## Acceptance criteria

One observable, testable criterion per requirement, each naming the check that
proves it.

| AC | Criterion | Check |
|---|---|---|
| AC-1 (S2) | Every stage skill's fact-needing decision point carries the `ask-dont-infer@1` binding (by reference to its owner, never a restatement) or a recorded reason why no fact is needed there; the audit is a table in the unit doc, one row per decision point | `docs/features/644-substrate-gap-alarm/SPEC.md` §"The audit" carries one row per audited decision point and `bun scripts/check-skill-context.mjs` exits 0 |
| AC-2 (S3) | A question whose fact has no owning document routes to `init-workspace` and the block prints that route; the same question on a workspace that owns the surface is refused instead of granted the scaffold route | `bun test scripts/needs-input.test.mjs` exits 0 (the `substrate route` cases) |
| AC-3 (S3) | The route vocabulary stays closed and is published once: the crate's set, the `open-questions@1` block's `route:` line and the fail-block's reason codes agree | `bun test scripts/substrate.test.mjs` exits 0 (the `route vocabulary` pin) |
| AC-4 (S4) | `substrate check` reports one row per substrate class with its evidence and exits 0 only when every class is present or carries a recorded decline | `bun test scripts/substrate.test.mjs` exits 0 (the `coverage gate` cases) |
| AC-5 (S4) | `init-workspace` runs that gate on both routes and offers the additive block in upgrade mode instead of writing it | `rg -o 'substrate check' skills/init-workspace \| wc -l` matches 3 and `rg -o 'substrate-declines@1' skills/init-workspace template/AGENTS.md \| wc -l` matches 2 |
| AC-6 (S5) | The evidence-staleness rule has exactly one owner, is registered as a normative surface, and its follow-up lint candidate carries a dated re-trigger condition | `rg -c 'evidence-staleness@1' skills/unit-lane/references/DESIGN.md` matches 1 and `bun test scripts/normative-drift.test.mjs` exits 0 |
| AC-7 (S6) | Both new suites land red before the implementation and green after, and no unrelated behaviour moves | `bun test scripts/substrate.test.mjs` exits 0, `bun test scripts/needs-input.test.mjs` exits 0, and the recorded differential run shows no undeclared delta |

## Impact

- **The dispatcher's consumers.** `needs-input` is cited by `unit-lane`
  (`SKILL.md`, `DESIGN.md`, `PLAN.md`, `RESEARCH.md`, `ELICITATION.md`),
  `execute-phase`, `triage-issue`, `init-workspace` and
  `orchestration-envelope`'s `TURN_CONTRACT.md`. Anyone printing the block reads
  the `route:` line; only the ones that state the route vocabulary are edited.
- **The published ledger grammar.** `template/AGENTS.md` publishes the
  `open-questions@1` example the crate's reader consumes; its `route` cell and
  its prose are a second copy of the same closed set and move in the same change.
- **The scaffolder.** `init-workspace` gains a done-when gate, so every future
  install pays one command; an upgrade run gains one more additive offer.
- **The invariants guide.** A new `normative-surfaces@1` row (or three) moves the
  guide's machine region and its budgets; the `AGENTS.md` document budgets are
  spent to the line, so they are re-pinned by measurement.
- **What stops being true.** The sentence "the lane can only halt and ask" and
  the two-value route vocabulary in `TURN_CONTRACT.md`, `template/AGENTS.md` and
  `DESIGN.md`'s needs-input guard.
- **Ask before touching live state:** nothing here writes to a live install; the
  fixtures run in `mktemp` trees.

## Surfaces

- `packages/agentic-workflow`
- `packages/agentic-workflow-schema`
- `skills/unit-lane`
- `skills/init-workspace`
- `skills/orchestration-envelope`
- `scripts`
- `docs`
- `template`

## Retirements

Strictly additive: no surface is retired. The census over the added surfaces,
`bun scripts/residual-classify.mjs --inventory --base main` (the anti-divergence
receipt), is recorded in the `## Log` once the implementation lands. Every added
surface names its consumer in this document (the `route` cell of a ledger row,
the `init-workspace` done-when gate, the normative-surface rows), so no row is
`orphan`.

## Non-goals

- Rewriting `ask-dont-infer@1` — it is correct and owned; this unit references it.
- Making `init-workspace` auto-run: the alarm routes, the owner decides.
- Any vocabulary movement (owner: #643, merged as #648).
- The guide-minimalism pass (its own issue, same family).
- The evidence-staleness lint script: proposed with a re-trigger condition, never
  written speculatively (S5's receipt-neutrality clause).

## Risk tier

- **Tier** — `standard` · **Task Size** — medium
- **Named high-risk item** — none — not a high-tier unit (the change is a
  read-only sensor plus prose; no auth, publish, destructive or CI surface).

## Future

- **Evidence-staleness lint** — `slop/stale-tree-claim`: a check that reads a
  comment's factual claim ("this crate does not depend on X") against the file's
  own imports, failing when the claim and the neighbourhood disagree. Captured
  2026-11-19 from issue #644's S5. Status: `open`. Re-trigger condition: a second
  measured instance of the #643 class (the stale header comment that justified
  vocabulary mirrors for weeks) — one case is the corpus, two justify a script.
  Owner of the decision: the human owner, at the next `product-audit` sweep of
  the analysis dimension.

## Future cost

- Anyone adding a route to the alarm adds its token to the schema const, the
  `open-questions@1` block and the crate's import in one change — the
  `substrate.test.mjs` pin fails otherwise.
- Anyone adding a substrate class adds it to the census table **and** to
  `template/AGENTS.md` (the surface that must own it), or an install will be
  reported `absent` for a section the scaffold does not ship.
- `init-workspace` pays one `substrate check` run per install from now on.

## Applicable tests

- `scripts/substrate.test.mjs` — the census and the coverage gate (red first).
- `scripts/needs-input.test.mjs` — the new route cases beside the existing corpus
  (red first).
- `packages/agentic-workflow/test/cli.surface.test.mjs` — the bin's usage line
  and the README's Commands row (red first).
- `packages/agentic-workflow/test` and `packages/agentic-workflow-schema`'s
  `bun run test` — the crate suites.
- `bun scripts/normative-drift.test.mjs`, `bun scripts/residue-dimensions.test.mjs`,
  `bun scripts/check-skill-context.mjs` — the prose/drift/budget gates.
- `bun scripts/local-gate.mjs` — the full gate at the head.

## Known pre-existing issues

- `packages/agentic-workflow/src/runner/unit-doc-phases.mjs:451` — the in-flight rule matches the legacy `Progress
  log` entry shape, so a re-cut (`## Log`) unit doc is never picked up by `promise-coherence`'s corpus sweep.
  *Affects* this unit's verification: the guard was invoked on its three documents directly (`D9`, `V1`).
  *Does not affect* delivery: the exported claim kinds and the corpus rule are untouched by this change.
- `docs/fix/258-harden-needs-input-contracts/review-findings.md:937` (F47) —
  *does not affect* this unit: the route cell is a closed vocabulary and this
  unit extends it by the same mechanism, never by accepting a command form.
- `docs/features/258` era gap: the `open-questions@1` fail-block reason list in
  `TURN_CONTRACT.md` and the crate's reason codes are two hand-kept copies with
  no pin between them (`rg -n 'missing-search-receipt' scripts/*.test.mjs` hits
  only the dispatcher's own corpus). *Affects* this unit: the two new reason
  codes are added to both by hand, and the `route vocabulary` pin this unit adds
  covers the route set only — the reason list stays a known issue, recorded here
  rather than silently repaired.

## Tasks

- P1 — Audit every stage skill's fact-needing decision point and record the
  binding (or its reason) in the unit doc (validator:
  `rg -c '^\| [^|]+ \| [^|]+ \| (bound|bound-by-reference|\*\*unbound\*\*) \|' docs/features/644-substrate-gap-alarm/SPEC.md`
  matches 35)
  (Implements: S2)
  - Relevant files: docs/features/644-substrate-gap-alarm/SPEC.md
- P2 — Land the red suites first: the census/coverage-gate corpus, the new
  needs-input route cases, and the CLI surface red (validator:
  `bun test scripts/substrate.test.mjs` exits 1 before the implementation and
  `bun test scripts/needs-input.test.mjs` exits 1 for the new cases)
  (Implements: S3, S4, S6)
  - Relevant files: scripts/substrate.test.mjs, scripts/needs-input.test.mjs
- P3 — Implement the substrate census and the `substrate check` command, and
  register it in the closed dispatch table (validator:
  `bun test scripts/substrate.test.mjs` exits 0)
  (Implements: S4, S6)
  - Relevant files: packages/agentic-workflow/src/runner/sensors/substrate.mjs,
    packages/agentic-workflow/src/runner/cli.mjs,
    packages/agentic-workflow/bin/agentic-workflow.mjs,
    packages/agentic-workflow/README.md
- P4 — Extend `needs-input` with the substrate route: publish the route and
  class vocabularies, verify the claim against the census, add the refused cases
  (validator: `bun test scripts/needs-input.test.mjs` exits 0)
  (Implements: S3, S6)
  - Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts,
    packages/agentic-workflow/src/runner/sensors/needs-input.mjs
- P5 — Move the published grammars and wire the consumers: the
  `open-questions@1` block, the template's ledger example and prose, the lane's
  needs-input guard and resolution order, and `init-workspace`'s coverage gate on
  both routes (validator:
  `rg -o 'substrate check' skills/init-workspace | wc -l` matches 3 and
  `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S3, S4)
  - Relevant files: skills/orchestration-envelope/references/TURN_CONTRACT.md,
    template/AGENTS.md, skills/unit-lane/references/DESIGN.md,
    skills/unit-lane/SKILL.md, skills/init-workspace/SKILL.md,
    skills/init-workspace/references/UPGRADE.md, AGENTS.md
- P6 — State the evidence-staleness rule once, register it, and record its
  re-trigger condition (validator:
  `rg -c 'evidence-staleness@1' skills/unit-lane/references/DESIGN.md` matches 1
  and `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S5)
  - Relevant files: skills/unit-lane/references/DESIGN.md, AGENTS.md
- P7 — Register the unit's state through its owners: the gate inventory row, the
  roadmap status cell, the budget re-pins, the changeset and the journal entry
  (validator: `bun scripts/docs-generate.mjs --check` exits 0 and
  `bun scripts/log-immutability.mjs` exits 0)
  (Implements: S4, S5)
  - Relevant files: docs/workflow/GATE_INVENTORY.md, docs/ROADMAP.md,
    docs/workflow/SKILL_CONTEXT_BUDGETS.json, .changeset/,
    docs/LOGS.md
- P8 — Verify the whole change and the differential against the base commit
  (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S2, S3, S4, S5, S6)
  - Relevant files: scripts/needs-input.test.mjs, scripts/substrate.test.mjs

The task-to-phase order is dependency-topological: the red corpus precedes the
implementation (S6), the census precedes the route that verifies against it, and
the state registration follows the code it registers.

### Planning evidence

Frozen in [`planning-evidence.md`](planning-evidence.md) — M scope keeps the
ledger beside the unit doc, never both here and there.

### Obligations

Frozen in [`planning-obligations.md`](planning-obligations.md) — M scope keeps
the nine-column ledger beside the unit doc.

## The audit

S2's deliverable: one row per fact-needing decision point across the stage
skills and the runner command paths. `binding` is `bound` (the surface cites
`ask-dont-infer@1`'s owner inline), `bound-by-reference` (it cites a surface that
cites the owner — one hop, no restatement) or `unbound` (with what was added in
this unit). The rule itself is not restated here: its owner is
`skills/unit-lane/references/DESIGN.md` §The no-assumption rule
(`ask-dont-infer@1`).

| skill | decision point | binding | evidence | action |
|---|---|---|---|---|
| `unit-lane` | the pre-spec's unknown rows become questions | bound-by-reference | `skills/unit-lane/references/ELICITATION.md` §Fill, then assume-or-ask → the block's reader | none — the reference chain holds |
| `unit-lane` | design-tier scope/architecture questions | bound | `skills/unit-lane/references/DESIGN.md` §Needs-input guard cites the rule and the fixed order | the guard gains the substrate branch (P5) |
| `unit-lane` | the lane's own resolution order (0 provenance → 1 research → 2 halt) | bound-by-reference | `skills/unit-lane/SKILL.md` §Inputs — never inferred, never defaulted | the halt line names the third route (P5) |
| `unit-lane` | plan-owned facts (task/validator derivation) | bound-by-reference | `skills/unit-lane/references/PLAN.md` → the block's reader | none |
| `unit-lane` | research eligibility (is the gap external?) | bound-by-reference | `skills/unit-lane/references/RESEARCH.md` §Skipped research | none |
| `execute-phase` | a phase that cannot proceed on a missing fact | bound-by-reference | `skills/execute-phase/SKILL.md` → `open-questions@1` (execution never interviews) | none |
| `execute-phase` | risk-tier classification | bound | `skills/execute-phase/references/risk-tiers.md` §Passive record — a tier is computed, never chosen | none |
| `execute-phase` | test-impact verdict | bound-by-reference | `skills/execute-phase/references/TEST_IMPACT.md` — a refusal or an absent script runs the full gate, never a silent skip | none |
| `triage-issue` | triage verdict and lane selection | bound-by-reference | `skills/triage-issue/references/ISSUE_PROCESS.md` → the one-shot eligibility reads the pre-spec's `questions:` | none |
| `fold-findings` | an unmaterializable `recheck` cell | bound-by-reference | `skills/fold-findings/SKILL.md` → `BLOCKED <missing input>`, never re-derived | none |
| `batch-scheduler` | lane collision and order | bound-by-reference | `skills/batch-scheduler/references/PLAN.md` — `surface-unknown` is a legal honest answer | none |
| `workflow-status` | what is startable next | bound-by-reference | `skills/workflow-status/SKILL.md` — read-only sensor, decides nothing | none |
| `init-workspace` | consent gaps and the charter's identity layer | bound | `skills/init-workspace/SKILL.md` §Consent / §Charter — the identity layer is blocking, never guessed | the substrate coverage gate joins the done-when (P5) |
| `init-workspace` | the engineering interview's unanswered slots | bound | `skills/init-workspace/references/ENGINEERING_INTERVIEW.md` §The team-adaptation knob — a default lands as a dated assumption | none |
| `discover-repository-state` | evidence that cannot be established | bound-by-reference | `skills/discover-repository-state/SKILL.md` — facts, decisions and inference stay separate | none |
| `resolve-repository-state` | a contradiction it may not resolve alone | bound-by-reference | `skills/resolve-repository-state/SKILL.md` — the only writer of frozen facts, human-ratified | none |
| `review-change` | an axis whose applicability is unclear | bound-by-reference | `skills/review-change/SKILL.md` §Applicability — an inapplicable axis is recorded, never assumed | none |
| `audit-pr` | a missing receipt at the head | bound-by-reference | `skills/audit-pr/SKILL.md` — a blocker is evidenced or the verdict is not MERGE-READY | none |
| `audit-docs` | a coherence defect it may not repair | bound-by-reference | `skills/audit-docs/SKILL.md` — fixes only low-risk items, on request | none |
| `product-audit` | a proposed rescope | bound-by-reference | `skills/product-audit/SKILL.md` — proposes, never edits | none |
| `unit-lane` (docs step) | doc placement ("where does this go") | bound-by-reference | `skills/unit-lane/references/DOCS.md` §Documentation currency — the documentation map owns placement | none |
| `init-workspace` (bootstrap write) | a substrate block the template lacks | bound-by-reference | `skills/init-workspace/references/BOOTSTRAP_WRITE.md` narrates the writes; `skills/init-workspace/SKILL.md` §Substrate coverage gate now makes "absent section, no recorded decline" a refusal through `runner substrate check` | closed by this unit (P3/P5) — the gate is the reference |
| `unit-lane` (evidence) | a tree-prose claim used as evidence | bound | `skills/unit-lane/references/DESIGN.md` §A tree claim is evidence with an expiry (`evidence-staleness@1`): the claim cites its location and is re-read against its neighbourhood before it decides | closed by this unit (P6) |
| runner: `needs-input` | a fact the lane cannot resolve | bound-by-reference | `skills/unit-lane/references/DESIGN.md` §Needs-input guard; the crate reads the ledger, decides nothing | the substrate route (P4) |
| runner: `unit-route` | which steps a unit needs | bound-by-reference | `skills/triage-issue/references/ISSUE_PROCESS.md` — the machine's step list is authoritative | none |
| runner: `phase-lint` | whether a phase is well-formed | bound | `skills/phase-contract/SKILL.md` — two accepted grammars, fixed PASS/BLOCKED | none |
| runner: `workflow-status` | what can be built next | bound-by-reference | the sensor's own header: it never edits, never decides | none |
| runner: `ceremony tier classify` | the unit's ceremony | bound | `skills/execute-phase/references/risk-tiers.md` — computed, never chosen | none |
| runner: `pre-execution-snapshot` | whether a bound digest still holds | bound | `skills/pre-execution-review/references/SNAPSHOT.md` — a byte change voids the receipt | none |
| runner: `diff-guard` | diff-size overflow | bound | `skills/execute-phase/references/TEST_IMPACT.md` / `skills/unit-lane/SKILL.md` — overflow means re-triage | none |
| runner: `ledger-provenance` | an unproven tick | bound | `skills/pre-execution-review/references/LEDGERS.md` §Durable ledger write ownership | none |
| runner: `quality-metrics` | quality numbers | bound-by-reference | `packages/agentic-workflow/README.md` `quality-metrics@1` — measured, never estimated | none |
| runner: `forge-read` | host facts | bound | `skills/triage-issue/SKILL.md` — the forge is read through one carrier | none |
| runner: `doc` | a retrieval answer | bound-by-reference | `packages/agentic-workflow/README.md` — citations, never synthesis | none |
| `substrate check` (new) | whether a class is present, declined or absent | bound | this unit: a recorded decline is ask-first, never a silent skip (S4) | added by P3 |

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-19, the turn instruction, verbatim:
  ```
  Apply to this repository: issue #644
  ```
- **L2** — 2026-11-19, issue #644, verbatim (S2…S6 above quote it in full):
  ```
  NEW FEATURE: substrate-gap-alarm — missing architecture/contract facts route to init-workspace, never an inferred answer
  ```
- **P1** — 2026-11-19 12:04, unit doc cut, the audit table landed (35 decision
  points, 2 `unbound`), O1…O13 and PE-001…PE-016 frozen · `eea76216c`.
- **E1** — 2026-11-19, `bun test scripts/substrate.test.mjs` at `4d603113a` · exit 1 · 15 of 16 fail; the one pass is the byte-stability control, which passed because both runs printed the same missing-command bytes.
- **E2** — 2026-11-19, `bun test scripts/needs-input.test.mjs` at `4d603113a` · exit 1 · 6 of the 8 new cases fail; the two that pass are the refusals, which already refused (`unknown-route`) before the route existed — the fail-closed direction was never redesigned.
- **E3** — 2026-11-19, `bun test packages/agentic-workflow/test/cli.surface.test.mjs` at `4d603113a` · exit 1 · the bin does not dispatch `substrate`.
- **P2** — 2026-11-19 12:31, the red corpus committed alone · `4d603113a`.
- **P3** — 2026-11-19 13:02, the census, `substrate check`, the schema consts and the dispatcher's verification · `de52801ba`.
- **E4** — 2026-11-19, `bun test scripts/substrate.test.mjs` · exit 0 · 16 pass.
- **E5** — 2026-11-19, `bun test scripts/needs-input.test.mjs` · exit 0 · 42 pass (34 pre-existing + 8 new).
- **E6** — 2026-11-19, the audit tally · `rg -c '^\| [^\|]+ \| [^\|]+ \| (bound\|bound-by-reference) \|' docs/features/644-substrate-gap-alarm/SPEC.md` → 35 and `rg -q '\*\*unbound\*\*' …/SPEC.md` → exit 1 (no unbound row survives).
- **E7** — 2026-11-19, the differential against `c1ccc1985` over one three-question ledger plus a decided row (`needs-input`, text and `--json`, stdout + stderr + exit) · no diff beyond the run label · two declaared deltas, both intended: base refuses `init-workspace:architecture` as `unknown-route` (exit 1) while the head grants it on a workspace without the document (exit 0), and `substrate` is a new subcommand (base: closed-world usage error).
- **P4** — 2026-11-19 13:31, the published grammars, the skill wiring, the inventory rows and the budget re-pins · `29d5a1afb`.
- **E8** — 2026-11-19, the through-the-owner suites, all exit 0: `promise-coherence` 37 · `normative-drift` 22 · `residue-dimensions` 30 · `vocabulary-parity` 35 · `ledger-ownership` 15 · `unit-doc-contract` 21 · `prose-gate-inventory` 22 · `test-obligation-tags` 15.
- **E9** — 2026-11-19, `bun scripts/check-skill-context.mjs` → `PASS context budgets: 30 skills`; `--documents` → `PASS context documents: 4 budgeted documents` · the four re-pins are recorded in the manifest's own `sources` rows.
- **E10** — 2026-11-19, `bun test packages/agentic-workflow/test` → 1321 pass · `bun run test` in `packages/agentic-workflow-schema` → 914 pass.
- **E11** — 2026-11-19, the gate on this repository itself: `substrate check --workspace .` · exit 1 · `architecture` and `documentation-map` present, `decision-records` and `api-posture` absent because this repository's guide carries no `## Project charter` and no `substrate-declines@1` row. Disclosed, not repaired: the gate governs scaffold installs, this repository is not one, and adding a charter here is a project-domain decision outside this unit's scope.
- **E12** — 2026-11-19, `bun scripts/docs-generate.mjs` (1 file written — the 644 row in `docs/generated/units.md`) then `--check` · exit 0 · `PASS`.
- **E13** — 2026-11-19, `rg -o 'substrate check' skills/init-workspace | wc -l` → 3 (SKILL.md 2, UPGRADE.md 1) and `rg -o 'substrate-declines@1' skills/init-workspace template/AGENTS.md | wc -l` → 2 (SKILL.md 1, template/AGENTS.md 1). Corrected from a `rg -c` spelling in the same session: `rg -c` over a directory prints one line per file, so the tally was unreadable as a single number and the guard re-read it as 2 (F1, `V1`).
- **E14** — 2026-11-19, `rg -c 'evidence-staleness@1' skills/unit-lane/references/DESIGN.md` → 1 (one owner; the inventory row cites it and `scripts/normative-drift.test.mjs` resolves its grammar, E8).
- **D1** — 2026-11-19, the unit's home is `docs/features/644-substrate-gap-alarm/` because `docs/ROADMAP.md:196` already names it (authority: the roadmap's hand-owned cell; recorded as D-644-1).
- **D2…D7** — 2026-11-19, the design decisions this unit took (qualified-and-verified substrate route, the four census surfaces, one census module, schema-owned vocabularies, a declined class keeps the route open, the staleness lint stays a candidate) — `docs/features/644-substrate-gap-alarm/decisions.md`.
- **D8** — 2026-11-19, disclosed side effect: a `journal aggregate` run inside this worktree consumed 114 tracked fragments and appended 115 entries to `docs/LOGS.md` (it is main's aggregator, not a branch's). Restored with `git checkout -- docs/LOGS.md .agentic-workflow/journal`; the carrier now holds 115 fragments (the 114 tracked ones plus this unit's), and this unit's entry is left for main's aggregator instead of being appended here.
- **G1** — 2026-11-19, `bun scripts/run-root-suite.mjs` · exit 0 · 128 suites.
- **G2** — 2026-11-19, `bun scripts/docs-generate.mjs --check` · exit 0 · `verdict: PASS`.
- **G3** — 2026-11-19, `bun scripts/log-immutability.mjs` · exit 0 · `0 violations · base c1ccc1985`.
- **G6** — 2026-11-19, `bun scripts/local-gate.mjs` at `39c5a463b` (the head the handoff presents) · exit 0 · `PASS — 19 step(s) in 614s`. This line is the append-only record written after it.
- **G5** — 2026-11-19, `bun scripts/local-gate.mjs` at `ecbc7001c` (the state-registration head, every code and prose change in place) · exit 0 · `PASS — 19 step(s) in 629s`. This line is the append-only record after it; the only bytes after the gate ran are this `## Log` append and the obligation statuses it cites.
- **G4** — 2026-11-19, `bun scripts/local-gate.mjs` at the P7 head · exit 0 · `PASS — 19 step(s) in 739s` (the first run was red on `worktree-guard` because of this unit's own differential scratch worktree; the scratch was removed and the gate re-run green).

- **V1** — 2026-11-19, `docs/features/644-substrate-gap-alarm/SPEC.md:194` · reviewer self, before the handoff · recheck `bun scripts/promise-coherence.mjs docs/features/644-substrate-gap-alarm/SPEC.md …/planning-obligations.md …/planning-evidence.md` → `verdict PASS`, 3 claims checked · confirmed: the `rg -c` tally over a directory was unreadable as one number (observed 2), the claim now reads `rg -o … | wc -l`.
- **F1** — 2026-11-19, folded in the session that found it: the two validator cells that spelled a directory `rg -c` were re-spelled to a single-number command (AC-5 and P5, plus `E13`'s wording). No behaviour changed — the corrected form reports the same 3 and 2, now readable as one number.
- **D9** — 2026-11-19, disclosed gap, not repaired here: `inFlightUnitDocs()`'s in-flight rule matches the legacy `Progress log` shape (`YYYY-MM-DD HH:MM — …`), which the re-cut `## Log` `P` line the template publishes does not carry — so `promise-coherence`'s own corpus sweep examines no post-#308 unit doc, this unit included. The guard was therefore run against this unit's three documents directly (`V1`), and repairing the detector is left to the owner: it changes the corpus of every unit and belongs to its own unit, not to this one.

## Next

The owner's verdict on the diff (external verification). Nothing in this unit is
self-approved: the obligation rows record the validators that ran, and the
verdict is the owner's.

## References

- Issue [#644](https://github.com/gtrabanco/agentic-workflow/issues/644).
- Roadmap row 644 (`docs/ROADMAP.md` § Features).
- `docs/features/643-single-source-vocabulary/` — the sibling unit whose root
  cause (stale tree evidence) S5 names.
- `skills/unit-lane/references/DESIGN.md` §The no-assumption rule — the single
  owner of `ask-dont-infer@1`, cited here and never restated.

## Branch

`feat/644-substrate-gap-alarm`

## Depends on

None blocking. Soft: `643-single-source-vocabulary` (merged as #648) — the same
failure family; this unit owns detection, that unit owned the vocabulary move.

## Regression scope

- The `needs-input` corpus of 38 existing cases: identical stdout, stderr and
  exit code at the base commit and the head, apart from the two declared deltas
  (the `route:` line's vocabulary and the fail-block's reason list).
  Check: the differential run recorded in the `## Log`.
- The crate's own suites: `bun test packages/agentic-workflow/test` exits 0.
- Both runtimes: every suite runs under `bun test` with the `node --test`
  fallback, per the repository's runtime convention.
