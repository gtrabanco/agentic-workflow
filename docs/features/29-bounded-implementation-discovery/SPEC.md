# 29 — bounded-implementation-discovery

> Feature specification for issue
> [#149](https://github.com/gtrabanco/agentic-workflow/issues/149). Product and
> engineering authority are complete; implementation must preserve this SPEC.

## Goal

Add a portable, read-only implementation-discovery gate between a current
`PLAN-REVIEW-PASS` and the first repository write of every execution phase. The
gate must prove the reviewed phase against current entry points, callers,
constraints, tests, expected writes, assumptions, contradictions, and unknowns
before an executor edits anything, so relevant exploration becomes preventive
evidence rather than late review/rework. It begins from feature 28's compact
planning evidence and revalidates/delta-maps it against current source; it is
not the first time the implementation topology is investigated and cannot
compensate for an evidence-poor Plan.

## Branch

`feat/29-bounded-implementation-discovery`

## Size

`M` — one internal skill/reference contract, a pre-write `execute-phase`
integration, exact source/authority freshness and routing rules, workflow/docs/
distribution updates, a broad fixture matrix, and canary qualification. Four
single-concern phases; no split trigger applies.

## Dependencies

- Hard: feature 28 / issue #146 must be implemented and merged, including
  current SPEC/Plan receipt semantics and upstream return routes.
- Satisfied transitive prerequisite: feature 27 / PR #150 is merged; feature 28
  and this feature must ship changed canonical skills through its Pi
  bundle/parity surface.
- No new package/schema dependency: reuse feature 28 receipts, current
  `SkillOutcome v1`, Git/repository evidence, and runtime-opaque persistence.

---

## Product half

### Context

A complete, reviewed SPEC and Plan can still contain an implementation-level
assumption which has drifted or was never tested against source. The current
executor may begin writing while it is still discovering the real entry point,
affected consumers, existing helper, compatibility behavior, or protecting
test. That turns exploration into speculative code and pushes the true research
cost into repeated execute/review/fold/replan cycles.

The optimization is not a low file count or instant editing. The gate may read
one relevant file or one hundred. It is bounded by seven fixed questions, exact
evidence, one compact map, and a stop condition. Semantic/symbol tools can make
that work cheaper; direct repository reads remain the portable authority.

Feature 28 establishes that the Product and Plan are complete and current. This
feature asks a narrower question immediately before one phase writes: does that
reviewed phase still map to the actual current repository, and is the executor's
first edit justified? Planning must already have investigated the architecture,
affected surfaces, reusable patterns, validators, and phase cut far enough to
justify the Plan. The mapper consumes the phase-relevant planning-evidence rows,
tests them against current source, fills implementation-local detail, and routes
any material gap back to Plan review. It cannot amend or approve Product/Plan
authority.

### Business goals

- Increase the proportion of first edits that target the correct location,
  reuse the correct project pattern, and preserve affected consumers.
- Move source-level plan contradictions before code writes and route them to
  the correct upstream authority.
- Pass a compact evidence map into writing context rather than raw exploration
  history or repeated file dumps.
- Measure time/rework/token effects with comparable canaries before claiming
  an efficiency improvement.

### Product-surface considerations

- i18n: changed human workflow docs ship in synchronized English/Spanish pairs;
  skill prompts, code, SPECs/plans, commits, and PRs remain English.
- Accessibility: n/a, no UI is introduced.
- SEO: n/a, no public web route is introduced.
- Pricing: n/a, no commercial surface is introduced.
- UI design reference: n/a, the surface is an internal execution gate and
  evidence handoff.

### Scope

#### In scope

- **S1:** Add one internal, non-user-invocable implementation-discovery step
  consumed by `execute-phase` before every phase's first repository write.
- **S2:** Replace file-count heuristics with seven fixed evidence questions and
  routing based on uncertainty, topology, risk, and closure.
- **S3:** Support an inline route for localized, fully evidenced work and a
  fresh read-only mapper route for unfamiliar, cross-boundary, risky, or
  assumption-heavy work; manual fresh conversations remain first-class.
- **S4:** Emit one fixed compact implementation map bound to current Plan
  review, phase fingerprint/obligations, source HEAD, cited content evidence,
  phase-relevant planning evidence, and one consumable mapping revision.
- **S5:** Return exactly `READY | REPLAN | NEEDS-DESIGN | BLOCKED`, with no edit
  until `READY` covers all seven questions and every phase obligation.
- **S6:** Run the cheapest relevant read-only falsification probe before READY
  and preserve TDD, staged verification, candidate review, and audit authority.
- **S7:** Invalidate a map on Plan/SPEC/receipt/phase/source/cited-evidence drift,
  consume it at the first implementation write, and prevent old-map reuse after
  revert or interrupted partial execution.
- **S8:** Pass only the compact map plus frozen phase authority to a fresh
  writer where supported, including the carried planning claims it needs and
  excluding raw planning/exploration history; semantic navigation and episodic
  memory remain optional advisory accelerators.
- **S11:** Treat a mapper that must invent the Plan's affected topology,
  architecture choice, obligation coverage, or validator as `REPLAN`, not
  `READY`; implementation discovery revalidates and specializes a sound Plan.
- **S12:** Extend the feature-28 convergence canary through first write and
  candidate review. One source-local repair/re-review may occur; entering a
  second cycle emits the inherited `CONVERGENCE-ANOMALY` outcome and fails
  qualification through feature-28 ownership, never waiving a finding.
- **S9:** Route engineering contradictions to replan/review-plan, product or
  authority gaps to design/review-spec/planning, and unavailable required
  evidence to an exact blocker.
- **S10:** Add no-progress detection for repeated reads/searches with no new
  question/evidence, a complete fixture matrix, legacy/manual behavior,
  canonical/Pi distribution parity, golden-fixture coverage, and a measured
  canary protocol.

#### Out of scope / non-goals

- No review, repair, or approval of the SPEC or Plan; feature 28 owns them.
- No source or test write during mapping and no authority beyond the frozen
  phase after READY.
- No fixed maximum number of files, symbols, searches, reads, or context tokens
  used as a proxy for understanding.
- No public `implementation-map` command, committed map file, planning artifact,
  or public schema by default.
- No named model/provider, subagent requirement, retry/concurrency policy,
  durable store, context broker, or dependency on Serena, Engram, Gentle AI, or
  AWL.
- No external product research or autonomous product/architectural decisions.
- No replacement or weakening of TDD, frozen acceptance, staged verification,
  `review-change`, `fold-findings`, or `audit-pr`.
- No automatic issue creation. Unrelated pre-existing defects retain the
  existing opportunistic-finding policy but cannot justify partial current-unit
  delivery.
- No savings claim before canary evidence and no requirement that exploration
  be shorter than implementation.
- No use of implementation mapping as a late substitute for missing planning
  evidence, affected-surface analysis, phase design, or validator selection.

### Capability closure

The repository has no project `docs/CAPABILITIES.md`. Derived inventory:
feature-28 review authority, execution phase/preflight, repository/source
identity, semantic/direct discovery tools, testing/verification, backward
routing, runtime/Pi distribution, bilingual docs, and qualification. Roles are
`product authority`, `planner`, `mapper`, `executor`, and `runtime operator`.

**1. Entity closure — ephemeral implementation map and mapping attempt**

- [x] Create — UI: n/a · API: internal skill emits the fixed text map after
  read-only discovery; runtime may persist its exact inputs/output opaquely ·
  tests: inline/fresh/decision matrix.
- [x] Read/list — UI: n/a · API: the executor receives exactly one compact map
  and frozen phase authority; no historical map list is a portable skill
  surface · tests: handoff-minimization fixtures.
- [x] Update — n/a: a map is immutable; changed evidence requires a new mapping
  revision and complete re-evaluation of affected questions · tests: stale
  mutation matrix.
- [x] Delete — portable skill keeps no store; runtime retention/deletion is its
  own policy. A consumed/stale map cannot authorize a later write · tests:
  single-consumption and interrupted-reentry fixtures.
- [x] State transitions — `MAPPING -> READY | REPLAN | NEEDS-DESIGN | BLOCKED`;
  READY is consumed by first write; drift before consumption returns to
  MAPPING/upstream, and partial execution requires fresh recovery/mapping ·
  tests: transition fixtures.

**Capabilities and role matrix**

- [x] Change Product authority — entry point: `design-feature` after
  `NEEDS-DESIGN` · `product authority`: allowed · `planner`: denied · `mapper`:
  denied · `executor`: denied · `runtime operator`: routes only.
- [x] Change Engineering Plan — entry point: `plan-feature`/`plan-fix` after
  `REPLAN` · `product authority`: allowed · `planner`: allowed inside reviewed
  scope · `mapper`: denied · `executor`: denied · `runtime operator`: routes
  only.
- [x] Explore and emit map — entry point: internal discovery step · `product
  authority`: allowed read-only · `planner`: allowed only in a fresh mapper
  role, not as author approval · `mapper`: allowed read-only · `executor`:
  allowed only on the inline route before writing · `runtime operator`: invokes
  and persists only.
- [x] Begin phase write — entry point: `execute-phase` after READY freshness
  check · `product authority`: allowed · `planner`: n/a · `mapper`: denied ·
  `executor`: allowed for expected phase writes · `runtime operator`: allows
  only from current unconsumed READY.
- [x] Create a follow-up issue — entry point: existing user-authorized triage
  flow only · `product authority`: allowed explicitly · `planner`: denied by
  this step · `mapper`: denied · `executor`: denied · `runtime operator`:
  denied automatically.

**2. Integration closure — derived inventory**

- [x] Feature-28 review authority — mapping requires current Plan PASS and
  carries exact SPEC/Plan receipt and phase obligation bindings · tests:
  missing/stale/wrong-parent fixtures.
- [x] Execution preflight — discovery runs after read-only phase gates and
  before branch/planning commit or any implementation write; expected setup is
  revalidated after READY · tests: preparation-continuity fixtures.
- [x] Repository/source identity — bind source HEAD, clean-source condition,
  cited path/symbol content digests, and an expected planning-path allowlist;
  no hidden source dirt · tests: tracked/untracked/drift/revert matrix.
- [x] Discovery tools — semantic/symbol navigation is preferred when available;
  targeted search/read/call-site inspection is the portable fallback · tests:
  equivalent evidence-map fixtures.
- [x] Testing/verification — cheapest read-only probe before READY; TDD and
  feature-26 verification remain post-map authorities · tests: available,
  failing, and unavailable probe cases.
- [x] Backward routing — exact `REPLAN`, `NEEDS-DESIGN`, and `BLOCKED` routes
  reuse feature-28 owners; no competing vocabulary · tests: route matrix.
- [x] Runtime/Pi distribution — opaque durable evidence is optional; canonical
  root skill changes rebuild through feature-27 Pi bundling/parity · tests: Pi
  package suite and bundle parity.
- [x] Bilingual docs/qualification — workflow, migration, orchestration, golden
  fixture, root regression, canary, and independent review ship together.

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Mapping occurs before the phase's first write, not after a speculative edit | in-scope | S1, S5; AC3 |
| 2 | A mapper may read as many relevant files/symbols as required | in-scope | S2; AC1, AC2 |
| 3 | Reading many files without answering a named question is not success | in-scope | S2, S10; AC2, AC7 |
| 4 | Existing helpers and patterns are preferred over invented duplicates | in-scope | S2, S4; AC1 |
| 5 | Affected callers/compatibility/failure paths are evidenced, not guessed | in-scope | S2, S4; AC1 |
| 6 | Every expected write names the reviewed obligation it serves | in-scope | S4-S5; AC1, AC4 |
| 7 | A source contradiction cannot coexist with READY | in-scope | S5, S9; AC4 |
| 8 | Missing Product authority returns to the human | in-scope | S5, S9; AC4 |
| 9 | Unavailable high-risk evidence becomes an exact blocker | in-scope | S5-S6, S9; AC4, AC5 |
| 10 | A focused existing test/probe may falsify the starting assumption early | in-scope | S6; AC5 |
| 11 | The writer receives evidence conclusions, not raw exploration history | in-scope | S8; AC6 |
| 12 | Serena/Engram absence cannot block portable use | in-scope | S8; AC6 |
| 13 | Branch/planning setup after READY cannot silently invalidate the source map | in-scope | S4, S7; AC3, AC7 |
| 14 | An interrupted or reverted attempt cannot reuse a consumed/stale map | in-scope | S7; AC7 |
| 15 | A discovered current-unit omission stays in the current unit | in-scope | S9; AC4, AC9 |
| 16 | The map is committed as a new planning artifact | out-of-scope | No committed-map non-goal |
| 17 | The mapper chooses providers, retries, or storage | out-of-scope | Runtime-policy non-goal |
| 18 | Faster or cheaper delivery is claimed from the mechanism alone | out-of-scope | Unmeasured-savings non-goal |
| 19 | The mapper receives and revalidates phase-relevant planning evidence | in-scope | S4, S8; AC1, AC6 |
| 20 | Missing plan-level topology or validators return to planning instead of being invented during mapping | in-scope | S11; AC4, AC13 |
| 21 | A second candidate repair/re-review cycle is a qualification anomaly, never an approval shortcut | in-scope | S12; AC10, AC13 |

### Acceptance criteria

- [ ] **AC1 — command-verified:** `node --test
  scripts/implementation-discovery.test.mjs` exits 0 proving the seven fixed
  questions, exact fixed map fields, complete phase-obligation coverage, and
  four closed decisions.
- [ ] **AC2 — command-verified:** fixtures prove routing uses uncertainty,
  topology, risk, and evidence completeness rather than file counts; one-file,
  many-file, inline, and fresh-mapper cases converge by question/evidence.
- [ ] **AC3 — command-verified:** fixtures prove discovery is read-only and
  occurs before branch/planning/implementation writes; READY authorizes only
  expected deterministic setup and the first phase write after exact continuity
  revalidation.
- [ ] **AC4 — command-verified:** READY is rejected for uncovered obligations,
  contradictions, or unknowns; engineering drift returns `REPLAN`, Product/
  authority gaps return `NEEDS-DESIGN`, and unavailable required evidence
  returns `BLOCKED` with one exact prerequisite.
- [ ] **AC5 — command-verified:** every READY fixture records the cheapest
  relevant read-only falsification probe and its observed result; unavailable
  or failed high-risk probes cannot be rewritten as success.
- [ ] **AC6 — command-verified:** semantic navigation and direct-repository
  fallback produce equivalent required map evidence; the writer handoff excludes
  raw exploration history and includes every relevant claim/unknown.
- [ ] **AC7 — command-verified:** SPEC/Plan/receipt/phase/source/cited-content
  drift, unexpected setup paths, consumed map, interrupted partial execution,
  and new causal revert all invalidate old READY; repeated reads with unchanged
  question/evidence stop as no-progress.
- [ ] **AC8 — command-verified:** fixtures cover localized inline work, broad
  same-layer topology, cross-layer work, reusable-helper and affected-consumer
  discovery, contradicted Plan, stale inputs, unavailable evidence, repeated
  reads, and use cases revealed by compatibility invariants.
- [ ] **AC9 — command-verified:** the feature creates no issue, committed map,
  planning unit, schema, or source/test edit during mapping; current-unit
  obligations cannot be exported automatically.
- [ ] **AC10 — read-verified:** canary records time/model calls to first correct
  edit, pre-edit replans, post-review repairs, diff/rework, latency, tokens, and
  issue spill with observed or `not yet measured` values and no unsupported
  savings claim.
- [ ] **AC11 — command-verified:** root regressions, feature-28 package/route
  gates, Pi bundle/parity/package tests, context budgets, installability,
  migration/docs checks, and the executor-path golden fixture pass.
- [ ] **AC12 — read-verified:** exact candidate independently reviews with no
  unresolved fix-now finding and preserves feature 28, TDD, staged
  verification, candidate review, and audit authority.
- [ ] **AC13 — command/read-verified:** fixtures reject READY when
  phase-relevant planning evidence is missing, contradicted, or requires the
  mapper to invent Plan topology/validators; the end-to-end feature/fix/
  cross-boundary canary records source-local repair cycles and emits
  `CONVERGENCE-ANOMALY` on entry into a second cycle without suppressing
  findings.

### Tooling

- Prefer Serena/symbol/call-reference navigation when available; direct `grep`,
  `find`, repository file reads, Git, tests, and fixtures are portable fallback.
- Engram/episodic memory may suggest prior attempts or symbols but cannot satisfy
  a map field without current repository evidence.
- Root Node fixtures test the text contract and state transitions. No new
  public package validator is introduced.
- Feature 27 Pi bundle/parity tests and existing context/install/golden tools own
  distribution and weak-executor qualification.

### Product decisions

- **PD1 — internal integration:** mapping is an internal `execute-phase` step,
  not another public command the user must remember.
- **PD2 — question-bound, not count-bound:** exploration terminates by evidence
  closure or a contracted blocker; no file/search/read threshold determines
  quality.
- **PD3 — no edit before READY:** discovery is read-only and cannot partially
  implement while deciding what implementation is needed.
- **PD4 — existing authorities:** contradictions travel backward to feature-28
  design/plan owners; mapping never changes the reviewed contract.
- **PD5 — ephemeral portable result:** the map is a compact handoff. Runtimes
  may persist it opaquely, but no committed artifact/schema is justified yet.
- **PD6 — evidence before claim:** canary first; savings language only after
  observed comparison.
- **PD7 — mapping is delta validation:** implementation discovery specializes
  and revalidates a reviewed evidence-backed Plan. A missing Plan-level
  argument returns to planning; it is never created opportunistically by the
  mapper.

### Deferred decisions

none

### Spec-lint (mechanical — presence checks only)

Product boxes:

- [x] No template placeholders remain in the Product half.
- [x] Out-of-scope contains concrete ownership/non-goal bullets.
- [x] Every entity capability row is filled or explicitly n/a.
- [x] Integration closure walks every derived subsystem.
- [x] Every capability lists every derived role.
- [x] Expectation sweep has at least ten resolved rows with pointers.
- [x] Every in-scope bullet maps to at least one acceptance criterion.
- [x] Every acceptance criterion is command-verified or read-verified.
- [x] Deferred decisions is present and reads `none`.

Engineering boxes:

- [x] Dev scenarios include every fixed failure category.
- [x] Every phase passes the eight-box Phase-lint.
- [x] No template placeholders remain anywhere in the SPEC.

## Design status

`designed`

---

## Amendments

| Date | Authority | Change |
|---|---|---|
| 2026-08-30 | User-approved | Bind mapping to phase-relevant planning evidence, prohibit using mapping as deferred planning, and extend second-cycle convergence qualification through candidate review. |

---

## Engineering half

### Technical goals

- Define one text-first, bounded discovery contract with exact inputs, outputs,
  stop conditions, and authority routes.
- Integrate it before any phase write without duplicating feature-28 review or
  feature-26 verification contracts.
- Bind READY to exact current authority/source evidence and one consumable
  mapping revision while remaining portable without a runtime.
- Revalidate a compact phase-specific planning-evidence slice and route missing
  Plan-level understanding upstream before mapping can say READY.
- Keep the writer context compact and the exploration path evidence-driven.

### Architecture impact

- Add one internal skill/reference owner under `skills/`; `execute-phase` loads
  it only on the pre-write route. No new public skill or package contract.
- Extend current execution/recovery documentation and existing `SkillOutcome`
  routes; do not add another workflow state machine or durable record owner.
- Git and repository bytes remain source authority. Optional semantic/memory
  tools are adapters which may locate evidence but cannot replace it.
- Feature 27's bundle script remains the sole writer of Pi-packaged skill
  copies; canonical root changes are rebuilt and parity-tested.
- Human workflow docs follow AD-002; implementation uses one PR against `main`
  per AD-004. Architectural classification is `n/a: no project invariants
  declared` at the consumed NRS.

### Design

#### 1. Discovery inputs and seven questions

The internal step receives only:

- governing SPEC/fix obligations for the current phase;
- current feature-28 SPEC and Plan receipt digests;
- the phase-relevant rows from frozen planning evidence, including their source
  revision, affected decision/obligation, freshness, and declared unknowns;
- phase fingerprint, ordered tasks, acceptance/obligation ids, and last progress
  receipt;
- source HEAD plus clean-source/allowed-planning-path evidence;
- applicable NRS/decision/invariant evidence;
- repository discovery tools available in the current environment.

It must answer:

1. Which entry points and public/internal interfaces own current behavior?
2. Which callers, adapters, roles, compatibility surfaces, and failure paths
   can this phase affect?
3. Which helpers, patterns, decisions, and invariants constrain the change?
4. Which tests, fixtures, probes, and production-like scenarios establish
   current behavior?
5. Which exact writes are expected, and which reviewed obligation does each
   serve?
6. Which carried planning-evidence claims and Plan assumptions are directly
   confirmed, refined, stale, missing, or contradicted by source?
7. Which relevant unknowns remain, who owns them, and what evidence resolves
   them?

Each answer cites repository-relative path plus line/symbol/test and exact
source revision/content identity. The mapper records conclusions, not every
search. Repeating a search/read requires a new question, changed source, or
insufficient cited evidence; otherwise stop no-progress.

#### 2. Inline/fresh routing

Inline is permitted only when behavior is localized/familiar, targeted evidence
answers every question, no public/persistence/security/recovery/compatibility
boundary may change, and the executor can finish the map before writing.

A fresh read-only mapper is required for cross-module/layer or unfamiliar work,
public/persistence/security/recovery/compatibility impact, competing project
patterns, an unproven material Plan assumption, prior failed attempts/review
bias, or any case where editing would begin before the map closes. Same-model
fresh context is useful but is not called model diversity. Manual sequential
fresh conversations are the portable fallback.

No file-count threshold participates in the route or verdict.

#### 3. Fixed implementation map

```text
IMPLEMENTATION MAP — unit-id phase-id
Map revision: opaque single-consumption id
Source identity: HEAD + clean-source proof + cited-evidence manifest digest
Authority: SPEC receipt + Plan receipt + phase fingerprint
Planning evidence: carried row ids + current confirmation/refinement/conflict
Obligations: ordered acceptance/fix/obligation ids
Entry points: path:line or symbol + role + exact evidence
Affected surfaces: callers/adapters/roles/compatibility/failure paths + evidence
Current behavior: evidence-backed summary
Reuse and constraints: helper/pattern/decision/invariant/fixture + evidence
Expected writes: ordered path + obligation served + reason
Validation: falsification probe + TDD target + phase gate
Plan assumptions: confirmed items + evidence
Contradictions: none or exact Plan/source conflict
Unknowns: none or exact missing fact + owner + resolution evidence
Decision: READY | REPLAN | NEEDS-DESIGN | BLOCKED
```

`READY` requires every field, question, and owned obligation covered, no
material contradiction/unknown, an observed falsification probe, and expected
writes inside phase authority. It also requires every carried planning-evidence
row to be confirmed or narrowly refined; absent Plan-level topology,
architecture, obligation, or validator evidence is `REPLAN`. `REPLAN` also
means source disproves Engineering assumptions while Product remains stable.
`NEEDS-DESIGN` means Product, acceptance, authority, or architecture intent is
missing/conflicting. `BLOCKED` names evidence that cannot currently be
obtained. No other verdict exists.

#### 4. Source identity and first-write ordering

`execute-phase` performs all read-only dependency/status/acceptance/phase/
feature-28 receipt checks first. It requires no dirty source/test paths; only the
current unit's not-yet-committed planning paths may be allowed and are already
bound by the Plan receipt. Mapping then occurs before branch creation, planning
commit, or implementation edit.

Source identity is:

- exact pre-map HEAD commit;
- proof that tracked/untracked changes outside the allowed planning paths are
  absent;
- ordered manifest digest of every cited evidence path/content plus the current
  phase/receipt bindings;
- opaque `mappingRevisionId` created for this mapping event.

After READY, deterministic setup may create the branch and commit only the
already-reviewed planning paths. Before the first source/test edit, the executor
proves either HEAD is unchanged or the new commit is a direct descendant whose
entire diff is the allowed planning set and whose authority/content digests
match. Any other path, parent, receipt, phase, or evidence change invalidates
the map and routes again. This continuity proof resolves the apparent conflict
between pre-write mapping and the historical P1 planning commit.

READY is single-consumption: the first implementation write consumes it. A
crash before the write may resume only after freshness/no-consumption proof. A
crash after any partial write remaps current source during recovery. A new map
revision plus changed Git causal identity prevents reuse after revert; direct
out-of-protocol state manipulation cannot be claimed detectable without runtime
history.

#### 5. Early falsification and writer handoff

Before READY, execute the cheapest relevant read-only probe: focused existing
test, current parser/CLI output, public type/schema inspection, symbol callers,
or existing fixture. Record command/query, observed result, and evidence. A
failed probe informs REPLAN/NEEDS-DESIGN; unavailable high-risk evidence is
BLOCKED. This does not replace TDD or later verification.

The writer receives frozen phase authority plus the fixed compact map. It does
not receive raw files, repeated summaries, raw planning discovery, or the
authoring conversation unless a cited claim cannot be interpreted without a
focused excerpt. The map preserves the phase-relevant planning-evidence ids and
their current confirmation. The writer may only touch expected paths/
obligations; a newly discovered path or contradiction stops and remaps/routes
rather than expanding silently.

#### 6. Persistence, recovery, and issue policy

The portable skill creates no file/schema/store. It emits the map and reuses
`SkillOutcome v1`. AWL may persist exact inputs/output, source/receipt/context-
policy identity, role/session, consumption, and acknowledgement as opaque
evidence. It must not reconstruct a different verdict vocabulary.

A missing current-unit behavior entailed by reviewed scope or an affected
compatibility invariant joins the obligation map and routes upstream as needed;
it is not a follow-up issue. A demonstrated unrelated pre-existing defect may
use existing opportunistic reporting, but discovery never calls the forge.

### Decisions to confirm

- **D1 — Internal skill:** implement as one internal progressive capability
  consumed by `execute-phase`; no public command/schema/artifact.
- **D2 — Bound by questions:** seven evidence questions and one blocker/closure
  condition, never file/read counts.
- **D3 — Map timing:** run before all repository writes; permit only reviewed
  planning setup after READY and revalidate exact continuity before first code/
  test edit.
- **D4 — Source identity:** HEAD + clean-source proof + cited-content manifest +
  receipt/phase bindings + consumable mapping revision; no claim that a single
  hash proves all causal history.
- **D5 — Routes:** exactly READY/REPLAN/NEEDS-DESIGN/BLOCKED and feature-28
  upstream owners.
- **D6 — Tools:** semantic navigation/memory are optional locators; repository
  evidence is authority.
- **D7 — Persistence:** runtime may retain opaque evidence; v1 public skill
  surface creates no schema or committed map.
- **D8 — Measurement:** canary records observations before any efficiency claim.
- **D9 — Planning-evidence input:** READY must confirm or narrowly refine every
  phase-relevant planning-evidence row. Material absence or contradiction is a
  Plan defect and routes to replan/review-plan.
- **D10 — Convergence inheritance:** use feature 28's first-findings batch and
  exact `CONVERGENCE-ANOMALY` second-cycle semantics through candidate review;
  mapping creates no competing cycle authority.

### Testing requirements

- Red-first root Node fixture suite parses/executes the text contract and every
  route/freshness/continuity/no-progress condition.
- Test inline/fresh selection without file counts across localized, many-file
  same-layer, cross-layer, public interface, failure/recovery, prior-attempt, and
  unproven-assumption cases.
- Test exact map completeness, obligations, paths, evidence, probe results,
  unknowns, single consumption, crash before/after first write, preparation
  allowlist, tracked/untracked dirt, drift, and causal revert.
- Test carried planning-evidence confirmation/refinement and fail READY when the
  mapper would need to invent Plan-level topology, architecture, obligation, or
  validator claims.
- Preserve all feature-28 package/route, execution, review/fold, verification,
  audit, context, installability, Pi bundle/parity, and golden tests.
- Record an observational feature/fix/cross-boundary canary and independent
  review of exact terminal candidates; entry into a second repair/re-review
  cycle fails qualification and routes to the owning root cause.

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `map:localized-ready` | one familiar entry point with complete targeted evidence | inline fixture reaches READY before write |
| `map:empty-evidence` | no current callers/tests/evidence for a required claim | BLOCKED or upstream route, never guessed READY |
| `map:oversized-topology` | many relevant same-layer callers/files | fresh mapper closes seven questions without count cutoff |
| `map:wrong-authority` | mapper discovers missing Product/architecture choice | `NEEDS-DESIGN` and no edit |
| `map:dependency-unavailable` | required test/service/source cannot be inspected | exact `BLOCKED` prerequisite |
| `map:duplicate-read` | same search/read repeats without new question/evidence | deterministic no-progress stop |
| `map:limit-hit` | context/result pressure before all questions close | compact partial evidence plus BLOCKED, never truncated READY |
| `map:preparation-drift` | branch/planning setup changes an unexpected path | continuity failure and remap |
| `map:partial-recovery` | crash after first write then revert/new attempt | consumed old map rejected; current source remapped |

### Phases

#### P1 — Define bounded implementation discovery

Layer: docs. Done-when: `node --test
scripts/implementation-discovery.test.mjs` -> exit 0 for seven-question,
inline/fresh, fixed-map, verdict, probe, and no-file-count fixtures.

Phase-lint: PASS (8/8) · fingerprint
`P1:docs:8:define-bounded-implementation-discovery`

#### P2 — Gate the first phase write

Layer: docs. Done-when: `node --test
scripts/implementation-discovery.test.mjs` -> exit 0 for pre-write ordering,
source identity, planning-setup continuity, drift, consumption, and recovery.

Phase-lint: PASS (8/8) · fingerprint
`P2:docs:8:gate-the-first-phase-write`

#### P3 — Integrate evidence-aware execution routing

Layer: docs. Done-when: implementation-discovery plus existing execution/
review/audit route suites exit 0 for backward routing, compact writer context,
legacy/manual behavior, no issue creation, and authority preservation.

Phase-lint: PASS (8/8) · fingerprint
`P3:docs:8:integrate-evidence-aware-execution-routing`

#### P4 — Qualify implementation discovery

Layer: hardening. Done-when: repository, feature-28, Pi distribution, context,
installability, golden-fixture, canary, and independent-review gates pass on the
exact candidate.

Phase-lint: PASS (8/8) · fingerprint
`P4:hardening:8:qualify-implementation-discovery`

### Deploy & rollback

No data migration, package schema release, environment variable, or committed
state. Merge distributes skill/docs changes through canonical and Pi surfaces.
Rollback is a PR revert and skill version correction if already published; AWL
opaque records remain historical evidence and cannot authorize a workflow that
no longer recognizes the map route.

### Open questions / risks

- **RESOLVED — file threshold:** no count proxy; fixed questions and evidence
  decide closure/route.
- **RESOLVED — planning commit ordering:** map precedes writes; an exact
  allowlisted descendant continuity proof permits only the reviewed planning
  commit before first implementation edit.
- **RESOLVED — public schema:** no demonstrated portable consumer requires one;
  fixed text + existing receipts/SkillOutcome and opaque runtime persistence
  suffice for v1.
- **Risk — full-source relevance:** cited evidence may omit an unexpected
  consumer. The fixed affected-surface question, targeted reference search,
  risk-based fresh route, and independent review reduce but cannot mathematically
  prove semantic completeness.
- **Risk — manual causal enforcement:** single consumption/revision is strongest
  under a runtime; manual handoff must preserve and honestly rotate the mapping
  revision.
- **Risk — exploration non-convergence:** question/evidence/no-progress rules
  stop repetition, but a legitimate unavailable dependency may still BLOCK.
- **Risk — Pi/root drift:** only the feature-27 bundle script may update packaged
  copies; parity test is mandatory.

### Deliverables

- Internal implementation-discovery skill/reference and fixed compact map.
- Pre-write `execute-phase` integration with source/authority freshness,
  planning-setup continuity, consumption, and recovery.
- Upstream route/no-progress/no-issue/context-handoff policies in existing
  workflow owners.
- Complete root fixture matrix, synchronized EN/ES docs/migration, canonical/Pi
  distribution parity, golden record, canary protocol, and independent review.

### Post-merge next feature

No automatic AW feature. Run the qualified manual feature/fix/cross-boundary
corpus through features 28+29, record the canary, and only then automate the
complete flow in AWL issue #26 and its prerequisite AWL issues.
