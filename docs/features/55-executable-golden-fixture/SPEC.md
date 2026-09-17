# 55 — executable-golden-fixture

> Feature specification. Source: issue
> [#230](https://github.com/gtrabanco/agentic-workflow/issues/230). One SPEC,
> two halves: this Product half is authored by `design-feature`; the
> Engineering half is authored by `plan-feature` after an independent Product
> review. **Traceability note:** #230 was closed on the forge (2026-09-16) as
> "absorbed into feature 59", but it was **not** absorbed — feature 59's own
> `decisions.md` records the owner's correction restoring this scope to row 55
> as a separate unit, and the owner restated it on 2026-09-17 ("#230 wasn't
> absorbed by feature 59"). This SPEC is #230's product definition.

## Goal

Turn the golden fixture — the repo's smoke test for skill wording
(`docs/workflow/GOLDEN_FIXTURE.md`) — into an **executable test where the
checking is mechanical and English-only throughout**: the toy fixture becomes a
committed file tree under `scripts/fixtures/golden-fixture/`, the deterministic
assertions (phase-lint verdicts, schema-envelope validity, run-log result
grammar, fixture/doc cross-references, audit-target trap invariants) become a
`node --test` suite, and the doc slims to the judgment protocol (~100 words)
plus the run log. The judgment part — running a changed skill against the
fixture with the weakest fleet model and reading its contracted output — stays
manual by design; only its bookkeeping becomes machine-comparable.

## Branch

`feat/55-executable-golden-fixture`

## Size

`S` — one committed fixture directory, one test script joining the existing
root `scripts/*.test.mjs` family, one slimmed doc, and three small doc
touch-ups (workflow index, `CLAUDE.md` verification list, roadmap row). No
skill text changes, no schema changes, no CI workflow changes. SPEC-only
planning: a compact frozen `ACCEPTANCE.md` at scaffold, `P1` implementation +
`P2 — Hardening & PR`.

## Dependencies

No hard dependencies. The producers this feature reuses are all merged:
feature 37 (`scripts/phase-lint.mjs`), feature 20
(`scripts/check-skill-context.mjs`), feature 28 (`scripts/schema-runtime.mjs`;
the schema package contracts it loads trace to feature 25, and
`next.continuation` in Envelope v2 to feature 59), and the
`scripts/fixtures/unit-route/` committed-toy-repo precedent this feature's
layout follows.

---

## Product half

Written by `design-feature`. Not complete until `## Design status` below reads
`designed` — `plan-feature` refuses to plan this feature until then.

### Context

Feature 12 shipped the golden fixture as a **manual, infrastructure-free**
procedure: a 383-line human doc with the toy "CSV export command" feature
embedded, fixed pass criteria, an audit-evidence provenance fixture, and a
run log that has caught real weak-model regressions (30+ dated rows, including
FAILs that drove wording fixes). Its own scope boundary — "no CI, no runnable
script" — was an economy decision, later revisited by the bureaucracy-reduction
plan: issue #230 (Phase 0 quick win) supersedes it **with owner approval**,
because the doc is a test living in the human-docs surface.

What changed since: feature 37 landed the deterministic plan checker
(`scripts/phase-lint.mjs`) and feature 20 the skill-context checker
(`scripts/check-skill-context.mjs`), feature 28 gave the repo a schema
runtime (`scripts/schema-runtime.mjs`), feature 59 added `next.continuation`
in Envelope v2 (with `scripts/continuation-discipline.test.mjs`), and fix
#224 committed the toy-repo fixture pattern (`scripts/fixtures/unit-route/`)
this feature's layout follows. The mechanical half of the golden
fixture can now be asserted deterministically; only the weak-model judgment
cannot. Issue #183's "golden-fixture machine-comparable result field" (its
third item) is absorbed here as the run-log's Result grammar.

Two traceability facts this SPEC records: (1) #230 was closed on the forge as
"absorbed into 59" — incorrect; 59's `decisions.md` explicitly restored the
executable-fixture scope to row 55, and the owner confirmed the correction.
(2) Feature 12's run-log history is load-bearing evidence and is preserved
verbatim; nothing in this feature rewrites past rows.

### Business goals

Purely internal/technical: protect the "runs correctly on any agent and any
model" promise at lower cost. The mechanical suite catches fixture/doc drift
and contracted-shape regressions for free on every run; the manual protocol
keeps doing what only a model run can do.

### Scope

#### In scope

1. **Committed executor fixture tree** at `scripts/fixtures/golden-fixture/`:
   the toy "CSV export command" feature as files — a phase-lint-clean toy plan
   (`toy-plan.md`), a deliberately non-atomic variant (`toy-plan-nonatomic.md`,
   expected `BLOCKED`), the toy SPEC and acceptance manifest as separate files,
   and committed expected-output snapshots (e.g. the exact `phase-lint.mjs`
   stdout block for `toy-plan.md`). → AC1–AC4
2. **Committed audit-target fixture tree** at
   `scripts/fixtures/golden-fixture/audit-target/`: the product-audit toy
   project (README declaring `make verify`, the worklist row lagging the forge,
   ADRs ending at `0047-transport.md`, the prior audit file with finding `F2`)
   so the T1–T4 traps are replayable from committed bytes. → AC6
3. **Mechanical assertion suite** `scripts/golden-fixture.test.mjs`
   (`node --test`, bun-compatible, `#!/usr/bin/env node`, read-only): runs the
   real scripts against the committed fixtures — phase-lint PASS and BLOCKED
   cases, envelope schema validity (valid sample passes, invalid sample fails,
   via `scripts/schema-runtime.mjs`), run-log Result-grammar enforcement with
   the dated cutoff, fixture/doc cross-reference existence, audit-target trap
   invariants, and at least one built-in tamper case proving fail-closedness
   without mutating committed files. → AC3, AC4, AC8
4. **Run-log machine-comparable Result grammar** (absorbs #183 item 3): a
   closed form `exact <n>/<n> · invented none|<k> · shape ok|<fail-code>`;
   every row dated on/after 2026-09-18 must match it; earlier rows are
   grandfathered verbatim. → AC3 (enforced by the suite), D-55-6
5. **Slimmed `docs/workflow/GOLDEN_FIXTURE.md`** (~100-word judgment protocol,
   the tool-calling smoke precondition, run log, pointers to the committed
   fixtures); the embedded toy SPEC/manifest blocks move out of the doc; the
   "no invented steps"-style pass criteria stay as the manual protocol's
   checklist. → AC5, AC7
6. **Doc touch-ups in the same unit**: `docs/workflow/README.md` index line
   (manual smoke test → manual protocol + executable suite) and the
   `CLAUDE.md` verification bullet listing the new suite beside the existing
   root regressions. → AC7, AC9
7. **Roadmap row 55** flipped `idea → defined` by this design turn; row
   summary corrected to carry the #230 traceability note. → AC9

#### Out of scope / non-goals

- **Automating the weak-model judgment runs** — no model in the mechanical
  loop, no orchestration of fleet runs; the ~100-word manual protocol stays
  manual (feature 12's core insight retained).
- **A CI workflow file for root suites** — no new `.github/workflows/*`; root
  `scripts/*.test.mjs` suites run through the repo's existing verification
  gates, as today.
- **`template/` mirror of the fixture** — the fixture stays repo-internal
  (feature 12 constraint retained; only its "no runnable script" half is
  superseded).
- **Skill text changes** — the suite surfaces wording regressions; the fix is
  always a separate targeted change (feature 08 dependency-direction note).
- **Bilingual siblings for the doc or fixture** — English-only interim
  (`AD-002`); row 57 owns bilingual restoration and the fixture directory is a
  code surface regardless.
- **Scripts-travel for installed skills** — the pi package distribution gap
  (59's B-01) stays with feature 44 (#198).
- **Schema-package changes** — the suite consumes the published validator via
  `scripts/schema-runtime.mjs`; no new vocabulary, no version bump.
- **Rewriting or pruning historical run-log rows** — append-only; grandfathered
  rows are read-only evidence.

### Capability closure

Three fixed checklists. This is a docs-and-scripts repository: "UI entry
point" means the surface an agent or human touches (command, doc section,
fixture file); "API" means the invocation surface (script argv, test runner);
roles and the capability inventory are the derived ones recorded here —
`docs/CAPABILITIES.md` is still the unseeded template (placeholder rows only),
so the inventory below is **derived from the repo's real subsystems**
(`CLAUDE.md` repository layout + `scripts/` family); the open offer to seed
`docs/CAPABILITIES.md` from it is deferred (see Deferred decisions).

**Architectural invariants:** `n/a: no project invariants declared` —
`docs/architecture/ARCHITECTURAL_INVARIANTS.md` is absent;
`docs/workflow/WORKFLOW_INVARIANTS.md` is the portable contract template with
no invariant declared for this repository (NRS F010). No invariant
classification applies to this docs-only unit.

**1. Entity closure** — entities this feature introduces or touches:

**E1 — executor fixture tree** (`scripts/fixtures/golden-fixture/` toy CSV
files: plan, non-atomic plan variant, toy SPEC, acceptance manifest, expected
output snapshots, and the committed envelope samples `envelope/valid.json` +
`envelope/invalid.json` for the AC3(b) schema-validity case)

- Create — committed in P1 as fixture files; never generated at runtime ·
  API: files under `scripts/fixtures/golden-fixture/` · test: AC1, AC3
- Read/list — read by `scripts/golden-fixture.test.mjs` and by the human/agent
  running the manual protocol · entry point: the doc's fixture pointer ·
  test: AC3, AC5
- Update — only through SPEC/PR review; a changed expected snapshot is a
  reviewed re-pin, never a silent regeneration (Jest snapshot discipline:
  fix the bug before re-recording) · test: AC4
- Delete — n/a: the fixture is permanent infrastructure; removal is a SPEC
  change
- State transitions — n/a: static bytes

**E2 — audit-target fixture tree** (`scripts/fixtures/golden-fixture/audit-target/`:
README, worklist index `docs/fix/README.md`, ADR tree `docs/adr/` ending at
`0047-transport.md`, prior audit file `docs/audits/3-*.md` carrying `F2` —
all relative to the fixture root)

- Create — committed in P1 as fixture files reproducing the four traps T1–T4 ·
  API: files under `audit-target/` · test: AC6
- Read/list — read by the product-audit manual protocol run and by the
  suite's trap-invariant assertions · test: AC3, AC6
- Update — n/a: same reviewed-re-pin rule as E1 · test: AC4
- Delete — n/a: permanent infrastructure
- State transitions — n/a: static bytes

**E3 — mechanical assertion suite** (`scripts/golden-fixture.test.mjs`)

- Create — authored in P1; joins the root `scripts/*.test.mjs` family
  (`#!/usr/bin/env node`, bun-else-node runtime convention) · API:
  `node --test scripts/golden-fixture.test.mjs` · test: AC3
- Read/list — run by the repo's verification gates and by any contributor
  after editing an executor-path skill · entry point: `CLAUDE.md` verification
  list · test: AC7, AC9
- Update — behavior changes ride this SPEC's review cycle; the suite never
  writes (read-only over the working tree, temp copies for tamper cases) ·
  test: AC3, AC8
- Delete — n/a: not in scope
- State transitions — n/a: stateless checker

**E4 — run-log Result grammar** (closed form over the run-log table in
`docs/workflow/GOLDEN_FIXTURE.md`)

- Create — the writer of a run-log row fills the Result cell after a manual
  run · API: the closed grammar `exact <n>/<n> · invented none|<k> · shape
  ok|<fail-code>` · test: AC3
- Read/list — parsed by the suite's grammar check (rows dated ≥ 2026-09-18)
  and by humans comparing run-over-run · test: AC3
- Update — append-only: new rows only; grandfathered rows (dated < 2026-09-18)
  are never rewritten · test: AC3
- Delete — n/a: history is evidence
- State transitions — n/a: per-row value

**E5 — slimmed procedure doc** (`docs/workflow/GOLDEN_FIXTURE.md`)

- Create — the slimmed doc replaces the current 383-line file in P1 · API: a
  human doc (purpose, ~100-word judgment protocol, tool-calling smoke
  precondition, run log, fixture pointers) · test: AC5
- Read/list — read by skill authors before running the protocol; indexed from
  `docs/workflow/README.md` and `CLAUDE.md` · test: AC7
- Update — run-log rows append; protocol wording changes ride review ·
  test: AC5, AC7
- Delete — the embedded toy SPEC/manifest/audit-target blocks are removed from
  the doc (they live as fixture files now; a second live copy would fork the
  fixture) · test: AC5
- State transitions — n/a: static doc + append-only log

**2. Integration closure** — the feature reconciled against the **derived
capability inventory** (docs-and-scripts repository):

- [ ] Machine surfaces (`scripts/*.mjs` + root test suites) — integrates: new
      suite `scripts/golden-fixture.test.mjs` joins the family; consumes
      `phase-lint.mjs` and `scripts/schema-runtime.mjs` as read-only tools ·
      test: AC3
- [ ] Skill text surfaces (`skills/*/SKILL.md`, references) — n/a: no skill
      text changes (out of scope bullet); budgets unaffected
- [ ] Schema package (`packages/agentic-workflow-schema`) — integrates
      read-only: envelope validator loaded via `scripts/schema-runtime.mjs`
      for the valid/invalid sample cases; no schema change, no version bump ·
      test: AC3
- [ ] Pi package mirror (`packages/pi-agentic-workflow`) — n/a: no skill
      changes, so no `bundle:skills` re-bundle in this unit
- [ ] Docs surfaces (`docs/workflow/*`, `CLAUDE.md`) — integrates: doc slimmed
      with pointers, workflow index line reworded, `CLAUDE.md` verification
      bullet extended; the existing `CLAUDE.md` fixture pointer keeps
      resolving · test: AC5, AC7, AC9
- [ ] Roadmap (`docs/features/ROADMAP.md`) — integrates: row 55 flipped
      `idea → defined` by this turn with the corrected summary · test: AC9
- [ ] Verification gates (repo "green" definition, pre-execution gates) —
      integrates: the suite becomes part of the repo's own verification story
      (listed beside the existing root regressions); no gate semantics change ·
      test: AC9
- [ ] i18n / localization — n/a: English-only interim (`AD-002`); the fixture
      directory is a code surface and never enters row 57's scope
- [ ] Authentication / ACL / notifications / search / audit log / settings /
      background jobs / file storage / feature flags / billing / public API —
      n/a: no such subsystem exists in this repository (inventory derived from
      `CLAUDE.md`; the unseeded template lists none as existing)

**3. Role matrix** — derived roles (no ACL subsystem exists; forge write
access governs changes, runtime access is clone-and-run). The single
user-facing capability of this feature: **run the fixture smoke test**
(mechanical suite + manual protocol).

| Role | Run mechanical suite | Append run-log row | Change fixture/protocol |
|---|---|---|---|
| Repo owner (maintainer) | allowed | allowed | allowed (via SPEC/PR review) |
| Agent (AI coding session) | allowed | allowed (after a manual run) | allowed (via SPEC/PR review) |
| CI / root test runner | n/a: no root CI job exists; suites run via the repo's existing verification gates | n/a | n/a |
| Target-project consumer (installed skills) | n/a: the fixture is repo-internal, not distributed | n/a | n/a |

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | The suite runs offline with no wall-clock or randomness dependence | in-scope | AC8; D-55-7 |
| 2 | A failing mechanical assertion names which fixture and which assertion failed (diagnosable, not a bare exit code) | in-scope | AC4 (tamper-case diagnostic assertion) |
| 3 | The manual judgment protocol survives in the doc — weakest-model run, fixed pass criteria, no-invented-steps check | in-scope | AC5 (fixed-pass-criteria grep); In-scope item 5 |
| 4 | The tool-calling smoke test (model precondition) stays reachable from the doc | in-scope | AC5 (smoke-test grep); In-scope item 5 |
| 5 | Run-log history is preserved; past rows are never rewritten | in-scope | E4 Update/Delete rows; Out-of-scope (rewrite ban) |
| 6 | The fixture is mirrored into `template/` so target projects get it too | out-of-scope | Out of scope (template mirror bullet) |
| 7 | The suite runs in a new CI workflow on every push | out-of-scope | Out of scope (CI bullet) |
| 8 | Weak-model runs are automated by the suite | out-of-scope | Out of scope (first bullet) |
| 9 | The toy SPEC is additionally registered under `docs/features/` as a real feature folder | out-of-scope | Feature 12 rule retained: scratch fixture, never a feature folder; committed only under `scripts/fixtures/` |
| 10 | A `.es.md` sibling of the doc is created/updated | out-of-scope | Out of scope (bilingual bullet) |

### Acceptance criteria

Runnable unless labelled `read-verified`. Commands use the repo's bun-else-node
runtime convention.

- **AC1** — `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan.md`
  exits 0, prints per-phase `PASS (8/8)` and final verdict `PASS`, and its
  stdout block is byte-identical to the committed snapshot
  `scripts/fixtures/golden-fixture/expected/phase-lint-toy-plan.txt`.
- **AC2** — `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan-nonatomic.md`
  exits non-zero, prints verdict `BLOCKED`, and its finding lines emit at
  least one phase-lint finding token `box-<n>` (the tool's fixed
  `P<n> box-<n>: <reason>` finding-line form).
- **AC3** — `node --test scripts/golden-fixture.test.mjs` exits 0 on a clean
  tree and covers: (a) AC1+AC2 assertions, (b) envelope schema validity —
  `scripts/fixtures/golden-fixture/envelope/valid.json` passes and
  `scripts/fixtures/golden-fixture/envelope/invalid.json` is rejected via
  `scripts/schema-runtime.mjs`, (c) run-log Result grammar with the
  2026-09-18 cutoff and grandfathering, (d) fixture/doc cross-reference
  existence, (e) audit-target trap invariants.
- **AC4** — fail-closedness: the suite includes a built-in tamper case that
  copies a fixture tree to a temp dir, mutates one byte, and asserts the
  corresponding check fails, with the failing check's message naming the
  mutated fixture path and the violated assertion — proving diagnosable
  detection (Expectation 2: a failing mechanical assertion names which
  fixture and which assertion failed, not a bare exit code) without editing
  committed files.
- **AC5** — doc slim: the toy-feature slug is gone from the live docs surface
  — `grep -rn "csv-export-command" docs/ | grep -vE
  '^(docs/workflow/GOLDEN_FIXTURE\.md:[0-9]+:\| 20|docs/features/)'` returns
  no output (the two exemptions are preserved evidence, not live prose: the
  doc's dated run-log rows — the append-only log, E4, five grandfathered rows
  carry the token — and the append-only unit ledgers under `docs/features/`);
  `docs/workflow/GOLDEN_FIXTURE.md` is ≤ 150 lines, contains the
  judgment protocol and run log, and points at
  `scripts/fixtures/golden-fixture/`; and the slim is verified to preserve
  the protocol's fixed surface — `grep -n "Tool-calling smoke test"
  docs/workflow/GOLDEN_FIXTURE.md` and `grep -n "Fixed pass criteria"
  docs/workflow/GOLDEN_FIXTURE.md` each return a match, and the "No invented
  steps" rule appears in the retained pass criteria (Expectations 3–4).
- **AC6** — audit-target invariants under
  `scripts/fixtures/golden-fixture/audit-target/` (asserted by the suite): the
  worklist index `docs/fix/README.md` shows row `9 — stale-cache` as
  `in-progress`; `docs/adr/` under that fixture root ends at
  `0047-transport.md`; `docs/audits/3-*.md` under that fixture root exists and
  mentions finding `F2`.
- **AC7** — cross-reference integrity: the `CLAUDE.md` fixture pointer and the
  `docs/workflow/README.md` index line resolve to the existing doc; the doc
  references only fixture paths that exist (suite-checked).
- **AC8** — determinism: `grep -nE "Date\.now|Math\.random|fetch\(|https?://"`
  over `scripts/golden-fixture.test.mjs` returns no matches;
  `read-verified`: the suite passes with network access disabled.
- **AC9** — registration: roadmap row 55 reads `defined`; the
  `docs/workflow/README.md` index line and the `CLAUDE.md` verification list
  name the executable suite.

### Tooling

No installed skills/MCPs are specific to this feature; the suite reuses the
repo's own deterministic tools (`scripts/phase-lint.mjs`,
`scripts/schema-runtime.mjs`). `scripts/check-skill-context.mjs` is unaffected
(no skill text changes) and stays covered by the repo's existing budget gate.

### Product decisions

| ID | Decision | Rationale |
|---|---|---|
| D-55-1 | Fixture home is `scripts/fixtures/golden-fixture/` | Follows the `scripts/fixtures/unit-route/` committed-toy-repo precedent; keeps the fixture out of the human-docs surface (#230 item 1). User-selected 2026-09-17. |
| D-55-2 | `GOLDEN_FIXTURE.md` slims to protocol + run log + pointers | #230's "short manual protocol (~100 words) in the run-log doc"; a second live copy of the toy SPEC in the doc would fork the fixture. User-selected 2026-09-17. |
| D-55-3 | Both toy trees (executor CSV + audit target) become committed fixtures | Trap invariants are deterministic file facts even though trap *reporting* is judgment. User-selected 2026-09-17. |
| D-55-4 | Run-log Result field is a test-enforced closed grammar | #230 absorbs #183's "machine-comparable result field"; enforcement is what makes run-over-run comparison mechanical. User-selected 2026-09-17. |
| D-55-5 | Traceability: #230 was closed in error (never absorbed by 59); this SPEC is #230's product definition under roadmap row 55 | Owner statement 2026-09-17 ("#230 wasn't absorbed by feature 59") + 59's `decisions.md` restoring the scope to row 55. No forge state change is taken by this design turn; reopening #230 remains an owner action. |
| D-55-6 | Grammar: `exact <n>/<n> · invented none|<k> · shape ok|<fail-code>`; cutoff date 2026-09-18; earlier rows grandfathered | Refinement of D-55-4: the 30+ historical rows carry heterogeneous free-text verdicts that are evidence, not data to migrate; a dated cutoff is deterministic where a content heuristic is not. |
| D-55-7 | Suite determinism constraints: no network, no wall-clock, no randomness, no model in the mechanical loop | Golden-master practice (ApprovalTests) and Fowler's non-determinism quarantine rule; matches #183's anti-flakiness grounding (arXiv:2505.06177 harness degradation). |

### Deferred decisions

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| Seed `docs/CAPABILITIES.md` from the derived inventory used here | The template is unseeded repo-wide; seeding is a cross-feature docs change, not this unit's scope | Next `product-audit` inventory sweep or the next design turn that needs roles |
| Reopen or comment on #230 on the forge | Forge state is owner-owned; the roadmap row + this SPEC carry the correction | Owner discretion, before or at PR merge |

### Spec-lint (mechanical — presence checks only)

Product boxes (run by `design-feature` before stamping `designed`):

- [x] No template placeholders left in the product half (grep clean).
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet (8 bullets).
- [x] Every Capability closure row is filled or explicitly n/a — zero blank
      rows.
- [x] Integration closure has one row per subsystem in the derived inventory
      (recorded above; `docs/CAPABILITIES.md` unseeded) — zero skipped.
- [x] Every capability's role matrix lists every derived role with an explicit
      value — no role unlisted.
- [x] `### Expectation sweep` has ≥ 5 resolved rows (10 rows), every row
      `in-scope` / `out-of-scope` / `deferred` with a pointer.
- [x] Every In-scope bullet maps to ≥ 1 Acceptance criterion (numbered items →
      ACs as marked).
- [x] Every Acceptance criterion is a runnable command or labelled
      `read-verified` (AC8's second clause).
- [x] `### Deferred decisions` exists; both rows have decide-by triggers.

## Design status

`designed` — capability closure complete (2026-09-17); every closure row is
filled or explicitly `n/a`. Review batch SPEC55-F1…F5 (spec-review-fail,
2026-09-16) repaired 2026-09-17 — five `product`-class findings, one batch,
no reviewed-intent change. Review batch SPEC55-F6…F10 (spec-review-fail,
2026-09-17 second cycle) repaired 2026-09-17 — five `product`-class findings,
one batch, no reviewed-intent change. Readiness re-run for re-review by
`review-spec`.

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold` on 2026-09-17, only after
the Product half above was marked `designed` and its `spec-review-pass` receipt
(`spec-review-55-20260917-3`, snapshot
`c1f040405f0d5178d44bbcfa4441f4ed3b4cccbf25bb12142317a4b4c41d20d2`) was
re-verified against the bytes on disk. Grounded in `### Planning evidence`
(PE-001…PE-017); obligations frozen in `### Obligations` (O1…O14). Repair batch
of the first plan review's findings `PF-55-01`…`PF-55-04` applied 2026-09-17
(AC5 validator, doc-slim budget arithmetic, O2 phasing, O12 lifecycle); the
Product half was not touched, so the `spec` receipt above stays current. Plan
artifact revision: `55-plan-2` (rotated by this write; the snapshot builder
derives the git revision from the newest commit touching a bound path).

### Technical goals

- The deterministic half of the golden fixture becomes executable: both toy
trees live as committed bytes under `scripts/fixtures/golden-fixture/`, and one
read-only `node --test` suite asserts the phase-lint verdicts, the envelope
contract, the run-log Result grammar, the fixture cross-references, and the
audit-target trap invariants — zero model calls, zero network, zero wall-clock,
zero randomness.
- The procedure doc drops to the judgment-only surface: the ~100-word protocol,
the tool-calling smoke precondition, the fixed pass criteria, the verbatim run
log, and pointers to the committed fixtures. The embedded toy SPEC/manifest and
the audit-target build get exactly one live home (the fixture tree) instead of a
second copy in the human-docs surface.
- Run-log rows become machine-comparable from 2026-09-18 through the closed
Result grammar `exact <n>/<n> · invented none|<k> · shape ok|<fail-code>`
enforced by the suite; the 43 grandfathered rows stay byte-identical evidence.

### Architecture impact

Surfaces touched: `scripts/fixtures/golden-fixture/**` (new fixture trees),
`scripts/golden-fixture.test.mjs` (new root suite), `docs/workflow/GOLDEN_FIXTURE.md`
(slimmed), `docs/workflow/README.md` (one index line), `CLAUDE.md` (one
verification bullet), `docs/features/ROADMAP.md` (row 55 registration). Not
touched: any `skills/**` text, the schema package, the Pi package mirror, the
`template/` scaffold, and any CI workflow.

- Evidence rows for every touched existing surface: `docs/workflow/GOLDEN_FIXTURE.md`
(PE-006: 383 lines, 43 rows; PE-007: five exempt rows), `docs/workflow/README.md:21`
(PE-013), `CLAUDE.md:238-258` (PE-012), `docs/features/ROADMAP.md:65` (PE-014),
`scripts/phase-lint.mjs:232-238` (PE-003) and `:296-317` (PE-005),
`scripts/schema-runtime.mjs:36-47` (PE-010), `scripts/phase-lint.test.mjs:1-40`
(PE-011), `scripts/fixtures/unit-route/**` (PE-015), and
`packages/agentic-workflow-schema/src/index.ts:270-482` (PE-009).

- **Layer placement is the phase cut** (frozen prefix table PE-003: `scripts/`,
`packages/`, `.github/`, `.agentic-workflow/` → `config/infra`; `skills/`,
`docs/`, `template/`, any `.md` → `docs`). Since box 2 of the phase-lint forbids
a mixed-layer phase, the fixture/suite work (config/infra) and the doc work
(docs) cannot share one phase. The engineering half therefore cuts **four
phases** where the Product half's size rationale sketched two — same
deliverable, no product intent changed (ED-55-1, PE-003, PE-016).
- Box 2 keys on each task's **first** path-like token outside a backticked
command span (PE-004), so every task below leads with a path of its own phase's
layer; a phrase that must name a fixture path inside a docs phase puts the docs
path first.

Invariants the implementation must hold:

- **Read-only suite.** `scripts/golden-fixture.test.mjs` never writes inside the
repository; the tamper case copies a tree to `fs.mkdtempSync(os.tmpdir())` and
mutates the copy (O8, O13).
- **Determinism.** No network call, no wall-clock read, no randomness, no model
in the mechanical path (AC8, D-55-7).
- **No skill-text change** — context budgets, the Pi mirror, and the skill
surfaces are untouched (O11's boundary).
- **English-only artifacts** (`CLAUDE.md` docs-language rule; bilingual
restoration is feature 57).
- **No schema vocabulary** — the suite consumes the published validator; the
schema package is read-only here.

Preflight: Stage 1 — NRS consumed · arch: deferred.
Preflight: NRS consumed · invariant classification: n/a (no project invariants
declared — `docs/architecture/ARCHITECTURAL_INVARIANTS.md` is absent, NRS F010).

### Design

**Fixture layout** (every path relative to `scripts/fixtures/golden-fixture/`, the
home fixed by D-55-1 and precedent PE-015):

```text
toy-plan.md                        phase-lint-clean two-phase toy plan (P1 domain, P2 hardening)
toy-plan-nonatomic.md              deliberately non-atomic variant, expected verdict BLOCKED
toy-spec.md                        the toy "99 — csv-export-command" SPEC, moved verbatim from the doc
toy-acceptance.md                  the toy unit's acceptance manifest, moved verbatim from the doc
expected/phase-lint-toy-plan.txt   byte-exact stdout of phase-lint over toy-plan.md
envelope/valid.json                a complete, schema-valid Envelope v2 sample
envelope/invalid.json              the same object with state set to BOGUS (rejected)
RUN_LOG_NOTES.md                   the doc's interleaved historical prose blocks, moved verbatim
audit-target/README.md             declares `make verify` as the gate, its last command the root suite
audit-target/EXPECTED.md           the T1–T4 traps and the expected-report pass criteria
audit-target/docs/fix/README.md    worklist index whose row `9 — stale-cache` reads `in-progress`
audit-target/docs/adr/0047-transport.md   the terminal decision record
audit-target/docs/audits/3-2026-06-30.md prior whole-product audit carrying finding `F2`
```

The two toy plans are already written and probed: `toy-plan.md` (a `P1 —
implement export-csv` phase declaring `domain` with two tasks, plus a literal
`P2 — Hardening & PR`) exits 0 with `P1 Phase-lint: PASS (8/8) · fingerprint
P1:domain:2:implement-export-csv` / `P2 Phase-lint: PASS (8/8) · fingerprint
P2:hardening:7:hardening-pr` / `verdict PASS`, fingerprint
`c39665a9a270c456055430f65c66be1df7364a7d91aefa957ef9ce59e1bd4310` (PE-001).
`toy-plan-nonatomic.md` (one 9-task phase whose title joins deliverables with
`and`, mixes an `api` phase with a `docs/` target, carries a decision word, an
inline manual gate, and a non-command `Done-when:`) exits 1 with `verdict
BLOCKED: lint-blocked` and six `P<n> box-<n>:` finding lines, each carrying its reason (PE-002).
Both probe runs are reproducible at HEAD `3133c5ca`.

**Suite: `scripts/golden-fixture.test.mjs`.** `node:test` + `node:assert/strict`,
`#!/usr/bin/env node`, part of the root `scripts/*.test.mjs` family (PE-011). Its
checks are factored as **functions of a fixture root** so the tamper case
re-runs a real check against a temporary copy instead of a re-implementation:
`phaseLintPass(root)`, `phaseLintBlocked(root)`, `envelopeValidity(root)`,
`runLogGrammar(docPath)`, `crossReferences(root)`, `auditTargetTraps(root)`. Each
returns `{ ok, message }` and every failure message names the fixture path and
the violated assertion (AC4's diagnosability requirement). The suite spawns the
real tool with `process.execPath scripts/phase-lint.mjs <plan>` and loads the real
validator through `scripts/schema-runtime.mjs` — no mocks, no stubs.

| Check | Assertion | AC |
|---|---|---|
| `phaseLintPass` | exit 0 and stdout byte-identical to `expected/phase-lint-toy-plan.txt` (which also carries `verdict PASS`) | AC1 |
| `phaseLintBlocked` | non-zero exit, `verdict BLOCKED`, at least one `box-\d+` finding token | AC2 |
| `envelopeValidity` | `validateEnvelope(valid)` ok; `validateEnvelope(invalid)` not ok | AC3(b) |
| `runLogGrammar` | every run-log row dated on/after 2026-09-18 matches the closed Result grammar; a synthetic post-cutoff row with a malformed Result is rejected, and a pre-cutoff free-text row is accepted | AC3(c) |
| `crossReferences` | the doc's fixture-pointer line is present and every `scripts/fixtures/golden-fixture/...` path the doc names exists | AC3(d), AC7 |
| `auditTargetTraps` | the worklist row `9 — stale-cache` reads `in-progress`; `docs/adr/` ends at `0047-transport.md`; `docs/audits/3-*.md` exists and mentions `F2` | AC3(e), AC6 |
| tamper case | a temp copy of the fixture tree with one mutated byte makes `phaseLintPass` fail with a message naming the mutated path | AC4 |

**Run-log Result grammar** (D-55-6): a row's Result cell must match
`exact <n>/<n> · invented none|<k> · shape ok|<fail-code>` — mechanically
`^exact \d+/\d+ · invented (?:none|\d+) · shape (?:ok|[a-z][a-z0-9-]*)$`. Rows dated
before 2026-09-18 are grandfathered and never rewritten; the suite's synthetic
post-cutoff case proves both the accept and the reject path today, so the rule is
enforced now rather than only when a future row appears.

**Doc slim.** The doc keeps only live surfaces: purpose, when-to-run, the
~100-word judgment protocol, the tool-calling smoke test, the fixed pass
criteria (executor path plus the audit expected-report pointer), the verbatim
43-row run log, and the fixture pointers. The measured budget is exact
(PE-006, PE-007, PE-017):

- **Moves out — 205 lines.** The toy SPEC fence (44–115, 72 lines) and the
  manifest fence (121–134, 14) become `toy-spec.md`/`toy-acceptance.md`; the
  audit-target build (204–268, 65) becomes `audit-target/**` plus `EXPECTED.md`;
  the three prose blocks — `## Scope boundary` (312–317, 6), `Coverage note`
  (333–356, 24), `**Coverage addendum**` (357–380, 24) — move verbatim to
  `RUN_LOG_NOTES.md`.
- **Re-joins — 11 lines.** The run log's rows sit in five runs around the moved
  prose, separated by 11 blank lines (282, 287, 293, 299, 301, 304, 311, 319,
  322, 332, 382). Re-joining the table in existing row order drops those
  separators without touching one row's content.
- **Condenses — 19 lines.** Moves + re-join leave 167 lines: 117 of live prose
  plus the 50-line run-log section (heading, blank, 2-line intro, blank, header,
  separator, 43 rows). P2's `≤ 150` cap therefore requires live prose ≤ 100 and
  the log intro on one line; the frozen assembly measures **148** — 99 lines of
  live prose (intro 6 · Purpose 6 · When-to-run 7 · Fixture 15 · Procedure 9 ·
  Smoke 15 · Fixed pass criteria 19 · Form-turn 14 · Audit 8) plus the 49-line
  run-log section — satisfying `wc -l ≤ 150` with headroom.

The probe that fixes those numbers (PE-017): at HEAD the doc is 383 lines; the
frozen moves plus the re-join yield 167; the frozen per-section assembly yields
148 and keeps every AC5 clause green — the `docs/` exemption pipeline returns no
output, both protocol greps match, and the retained pass criteria carry "No
invented steps".

The run log stays append-only and byte-identical: the slim re-joins its rows into
one contiguous table in their existing order (rows currently sit at 276–310,
318–331, 381, 383 around the moved prose) without editing a single row's content.

### Planning evidence

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | `phase-lint` accepts the drafted clean toy plan: exit 0, per-phase `PASS (8/8)`, `verdict PASS`, fingerprint `c39665a9…` | repository | `scripts/phase-lint.mjs` run over the drafted `toy-plan.md` (probe) | `3133c5ca` | AC1 · O1 · O3 | current | proven | — |
| PE-002 | the drafted non-atomic variant yields exit 1, `verdict BLOCKED: lint-blocked`, and six `P<n> box-<n>:` finding lines | repository | same tool over the drafted `toy-plan-nonatomic.md` (probe) | `3133c5ca` | AC2 · O1 · O3 | current | proven | — |
| PE-003 | the frozen prefix table maps `scripts/`+`packages/`+`.github/`+`.agentic-workflow/` → `config/infra` and `skills/`+`docs/`+`template/`+`*.md` → `docs` | repository | `scripts/phase-lint.mjs:232-238` | `3133c5ca` | phase cut (ED-55-1) | current | proven | — |
| PE-004 | box 2 takes each task's first path-like token outside a backticked command span: a `docs`-declared phase whose task led with `scripts/fixtures/…` returned `box-2 … belongs to layer config/infra, not docs` | repository | probe over `scripts/phase-lint.mjs` | `3133c5ca` | phase cut (ED-55-1) · task wording | current | proven | — |
| PE-005 | fenced code blocks contribute nothing to the phase-lint parse, so embedded plan text is inert | repository | `scripts/phase-lint.mjs:296-317` | `3133c5ca` | Design (embedding) | current | proven | — |
| PE-006 | the doc is 383 lines with 43 run-log rows; embedded toy fences at 44–115 and 121–134; audit section 204–268; prose blocks at 312–317, 333–356, 357–380 | repository | `docs/workflow/GOLDEN_FIXTURE.md` + `wc -l`/`grep -n` at HEAD | `3133c5ca` | AC5 · O10 | current | proven | — |
| PE-007 | exactly five run-log rows carry the toy slug (278, 279, 280, 298, 383), each starting `\| 20`, which is AC5's declared exemption | repository | `grep -n "csv-export-command" docs/workflow/GOLDEN_FIXTURE.md` | `3133c5ca` | AC5 · O10 | current | proven | — |
| PE-008 | no live script or package test pins the doc's content | repository | `grep -rn GOLDEN_FIXTURE scripts/ packages/*/src packages/*/test` → no matches | `3133c5ca` | AC5 · ED-55-3 | current | proven | — |
| PE-009 | `validateEnvelope` accepts a complete Envelope v2 and rejects the same object with `state: "BOGUS"` | repository | `packages/agentic-workflow-schema/src/index.ts:270-482` + probe through `scripts/schema-runtime.mjs` | `3133c5ca` | AC3(b) · O4 | current | proven | — |
| PE-010 | `scripts/schema-runtime.mjs` throws at import when the package `dist/` is missing, naming the build step | repository | `scripts/schema-runtime.mjs:36-47` | `3133c5ca` | O4 · risk (suite precondition) | current | proven | — |
| PE-011 | the root suite family is `scripts/*.test.mjs` run with `node --test`, `#!/usr/bin/env node`, embedding fixtures in temp dirs | repository | `scripts/phase-lint.test.mjs:1-40`; `CLAUDE.md` `## Verification` | `3133c5ca` | AC3 · O3 · O13 | current | proven | — |
| PE-012 | `CLAUDE.md`'s verification list exists (lines 238–258) and does not yet name the new suite | repository | `CLAUDE.md` `## Verification` | `3133c5ca` | AC9 · O11 | current | proven | — |
| PE-013 | `docs/workflow/README.md:21` carries the single index line describing the doc as a manual smoke test | repository | `docs/workflow/README.md:21` | `3133c5ca` | AC7 · AC9 · O11 | current | proven | — |
| PE-014 | roadmap row 55 read `defined` with `Depends on: —` at plan time and reads `planned` after scaffold | repository | `docs/features/ROADMAP.md:65` | `3133c5ca` | registration · O12 | current | proven | — |
| PE-015 | `scripts/fixtures/unit-route/` is the committed-toy-repo precedent this layout follows | repository | `scripts/fixtures/unit-route/**` | `3133c5ca` | D-55-1 · O1 | current | proven | — |
| PE-016 | unit 28's historical ledgers quote grep strings found inside `GOLDEN_FIXTURE.md`; no suite re-runs those strings | repository | `docs/features/28-evidence-grounded-spec-plan-review/{testing,planning-findings}.md` + `grep -rln` over `scripts/**` → none | `3133c5ca` | AC5 · ED-55-3 (disclosed) | current | proven | — |
| PE-017 | the doc-slim budget is reachable: the doc is 383 lines at HEAD, the frozen moves + run-log re-join leave 167, and the frozen per-section assembly measures 148 lines with every AC5 clause green | repository | probe over `docs/workflow/GOLDEN_FIXTURE.md` at HEAD applying the removal ledger + table re-join + per-section budget (`wc -l` → 148; the AC5 exemption pipeline → empty; both protocol greps match) | `62e22d7e` | AC5 · O10 · P2 done-when | current | proven | — |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | SPEC §Scope item 1; PE-001, PE-002, PE-015 | the two committed toy trees exist as bytes and lint as designed | P1 | 1–8 | execute-phase | `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan.md` and `…toy-plan-nonatomic.md` | exit 0 / exit 1 with the expected verdicts | planned |
| O2 | SPEC §Scope item 2; AC6 | the audit-target fixture tree is committed at its five declared paths | P1 | 6–7 | execute-phase | `git ls-files scripts/fixtures/golden-fixture/audit-target` | the five declared files listed (`README.md`, `EXPECTED.md`, `docs/fix/README.md`, `docs/adr/0047-transport.md`, `docs/audits/3-2026-06-30.md`) | planned |
| O3 | SPEC §Scope item 3; AC1, AC2, AC3(a); PE-011 | the suite exercises the real phase-lint tool at its CLI boundary, both directions | P3 | 1–2 | execute-phase | `node --test scripts/golden-fixture.test.mjs` | PASS and BLOCKED assertions green | planned |
| O4 | SPEC §Scope item 3; AC3(b); PE-009, PE-010 | envelope validity is proven from committed samples in both directions | P3 | 3 | execute-phase | suite `envelopeValidity` | valid accepted, invalid rejected | planned |
| O5 | SPEC §Scope item 4; AC3(c); D-55-6 | every row dated on/after 2026-09-18 matches the closed Result grammar; earlier rows are grandfathered | P3 | 4 | execute-phase | suite `runLogGrammar` | accept and reject paths both asserted | planned |
| O6 | SPEC §Scope item 3; AC3(d), AC7 | the doc's fixture pointer resolves and every referenced fixture path exists | P3 | 5 | execute-phase | suite `crossReferences` | pointer present, zero missing paths | planned |
| O7 | SPEC §Scope item 2; AC6 | the T1–T4 trap invariants hold in the committed tree | P3 | 6 | execute-phase | suite `auditTargetTraps` | the worklist-row, ADR-terminal, and prior-audit-`F2` assertions pass | planned |
| O8 | SPEC §Scope item 3; AC4; Expectation 2 | a failing check names the mutated fixture path and the violated assertion, fail-closed | P3 | 7 | execute-phase | suite tamper case | tamper assertion fails with the path named, committed bytes untouched | planned |
| O9 | SPEC AC8; D-55-7 | the suite is deterministic — no network, wall-clock, or randomness | P3 | 1–7 | execute-phase | `grep -nE "Date\.now\|Math\.random\|fetch\(\|https?://" scripts/golden-fixture.test.mjs` + read check | no matches, suite green offline | planned |
| O10 | SPEC §Scope item 5; AC5; PE-006, PE-007 | the doc slims to the judgment surface, keeps the protocol and run log, and drops every embedded copy | P2 | 1–3, 5 | execute-phase | `wc -l` ≤ 150; the AC5 greps | budget met, both protocol greps match, no live slug | planned |
| O11 | SPEC §Scope item 6; AC7, AC9; PE-012, PE-013 | the workflow index and the `CLAUDE.md` verification list name the executable suite | P2 | 3–4 | execute-phase | `grep -n` over both files | both name the suite and resolve | planned |
| O12 | SPEC §Scope item 7; AC9; PE-014 | roadmap row 55 moves through the full status machine with a current summary tail | P1, P4 · planning write | registration | plan-feature / execute-phase | re-read of `docs/features/ROADMAP.md` | row reads `planned` before P1, `in-progress` after P1 (branch open), and `done · [#<pr>](<pr-url>)` after P4; the summary tail names no superseded route | planned |
| O13 | SPEC §Scope item 3; AC3, AC8; PE-011 | the suite is read-only over the working tree | P3 | 1, 7 | execute-phase | suite helpers + `git status --porcelain` after a run | committed fixtures byte-identical after the run | planned |
| O14 | SPEC AC9; verification-contract | the unit's own finish line is frozen and receipted before any phase edits | P4 | 1–8 | execute-phase | `git hash-object docs/features/55-executable-golden-fixture/ACCEPTANCE.md` | blob matches the receipt | planned |

### Decisions to confirm

All engineering decisions are made and recorded here; none is open. The Product
decisions D-55-1…D-55-7 are inherited unchanged.

- **ED-55-1 — four phases, not the Product half's two.** The size rationale
  sketched `P1` plus `P2 — Hardening & PR`; a single implementation phase cannot
  carry `scripts/**` and `docs/**` targets, because box 2 of the phase-lint
  fails a phase whose task targets another layer (PE-003, PE-004). The cut is
  therefore P1 corpus (config/infra) → P2 doc slim (docs) → P3 suite
  (config/infra) → P4 hardening. Deliverable and acceptance criteria are
  unchanged; only the phase boundaries move, and the docs phase sits between the
  two config/infra phases so the suite's cross-reference check is non-vacuous.
- **ED-55-2 — checks are functions of a fixture root.** This is what makes
  AC4's built-in tamper case real: the same code path runs over a temp copy.
  It also keeps the suite read-only over committed bytes (O13).
- **ED-55-3 — the doc's interleaved prose moves verbatim to
  `RUN_LOG_NOTES.md`.** The ≤150-line budget cannot hold the embedded blocks,
  the 43 rows, and 54 lines of historical prose at once (PE-006). Moving the
  prose preserves it while the run-log rows stay byte-identical in place.
  Disclosed consequence: unit 28's historical ledger entries that quote grep
  strings from that prose become stale historical records; no suite re-runs them
  (PE-008, PE-016).
- **ED-55-4 — the grammar is enforced today, not at the first future run.** The
  suite asserts the accept and reject paths against synthetic rows, so the
  cutoff date governs the committed log while the rule itself is proven
  immediately.
- **ED-55-5 — the invalid envelope sample differs from the valid one in exactly
  one field** (`state`), so the check proves deliberate rejection rather than an
  incidental shape error (PE-009).
- **ED-55-6 — the audit expected report moves to `audit-target/EXPECTED.md`.**
  The T1–T4 pass criteria are judgment checks for the manual audit run, so they
  live with the toy target they describe; the doc keeps a one-line pointer
  (Expectation 3–4's protocol greps are unaffected).

### Testing requirements

Integration-first, no mocks: `scripts/golden-fixture.test.mjs` runs the real
`scripts/phase-lint.mjs` through `process.execPath` and loads the real envelope
validator through `scripts/schema-runtime.mjs` (whose missing-build error is the
one stated precondition — PE-010). Fixtures are the committed trees; the tamper
case is the only temp-directory use. Standing repo gates stay as they are:
`bun scripts/check-skill-context.mjs` (unaffected — no skill text changes),
`node --test scripts/phase-lint.test.mjs`, and `npx skills add . --list`.

### Dev scenarios

The feature's runtime is a test suite, so the failure categories are exercised as
suite cases rather than domain states.

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `suite:missing-fixture` | a committed fixture file absent (empty/zero-state input) | the check reads the path and fails naming it, never a bare exit code — P3 `phaseLintPass` |
| `suite:tampered-tree` | one byte mutated in a temp copy (AC4) | `phaseLintPass` over the copy fails with the mutated path in the message — P3 tamper case |
| `suite:invalid-envelope` | an object violating the envelope contract (invalid input) | `validateEnvelope(invalid)` rejects it through `schema-runtime.mjs` — P3 `envelopeValidity` |
| `suite:grandfathered-row` | a pre-cutoff free-text Result cell (compatibility boundary) | `runLogGrammar` accepts it, proving the cutoff is honoured — P3 `runLogGrammar` |
| `suite:post-cutoff-malformed` | a row dated on/after the cutoff with a malformed Result (limit/threshold) | `runLogGrammar` rejects the synthetic row — P3 `runLogGrammar` |
| `suite:permission-denied` | an unreadable fixture path | n/a: the check surfaces the read error naming the path — P3 `crossReferences`; no separate orchestration exists or is needed |
| `suite:dependency-outage` | the schema runtime `dist/` absent | n/a as a scenario: the import throws a message naming the build step (PE-010), the fail-closed behavior P3 `envelopeValidity` depends on; the package build runs in the gate |
| `suite:concurrent` | two suites running at once | n/a: the suite is read-only and stateless — P3 checks share no state to race on |

### Spec-lint (engineering boxes — the template's additional five)

- [x] `### Dev scenarios` carries failure-mode rows — five concrete rows plus three explicit `n/a` rows, each naming the check that covers it.
- [x] Every phase passes the 8-box phase-lint — pasted below as `verdict PASS`, four fingerprints.
- [x] `### Planning evidence` and `### Obligations` are present in place with zero blank cells (PE-001…PE-017, O1…O14).
- [x] Every normative SPEC behaviour, applicable invariant, affected use case, and required failure state has exactly one obligation row carrying a phase and a validator; no row is `deferred` and none points at a follow-up issue. No project invariant applies (NRS F010), so no invariant row is owed.
- [x] No template placeholders left anywhere in the file — with one declared exemption: the frozen Product half's AC2 cites the phase-lint finding-line grammar `P<n> box-<n>: <reason>`, whose `<n>`/`<reason>` are grammar tokens of the tool's fixed output rather than unfilled template slots (the same exemption feature 52 recorded for `<N>`/`<code>`).

### Phases

Phases are `P1, P2, …` and called phases. Planning is not a numbered phase;
`P1` is the first implementation phase and also commits the planning artifacts.
The last phase is always hardening. The phase cut and its rationale are
ED-55-1; every phase below is linted with the canonical
[phase contract](../../../skills/phase-contract/SKILL.md).

#### P1 — Commit the golden-fixture corpus

Layer: `config/infra`. Done-when: `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan.md` → `verdict PASS`, and the same command over `scripts/fixtures/golden-fixture/toy-plan-nonatomic.md` → `verdict BLOCKED`.

- [x] Commit `scripts/fixtures/golden-fixture/toy-plan.md` — the phase-lint-clean two-phase toy plan (PE-001; O1) — evidence: `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan.md` → exit 0, `verdict PASS`
- [x] Commit `scripts/fixtures/golden-fixture/toy-plan-nonatomic.md` — the expected-BLOCKED variant (PE-002; O1) — evidence: same command over the variant → exit 1, `verdict BLOCKED`, six `box-<n>` findings
- [x] Commit `scripts/fixtures/golden-fixture/toy-spec.md` and `scripts/fixtures/golden-fixture/toy-acceptance.md` — the toy unit's two product artifacts, moved verbatim from the doc (PE-006; O1) — evidence: `scripts/fixtures/golden-fixture/toy-spec.md`, `toy-acceptance.md`
- [x] Commit `scripts/fixtures/golden-fixture/expected/phase-lint-toy-plan.txt` — the byte-exact stdout of the linter over the clean toy plan (PE-001; O1) — evidence: `diff <(node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan.md) scripts/fixtures/golden-fixture/expected/phase-lint-toy-plan.txt` → empty
- [x] Commit `scripts/fixtures/golden-fixture/envelope/valid.json` and `scripts/fixtures/golden-fixture/envelope/invalid.json` — a complete Envelope v2 sample and its one-field-invalid twin (PE-009; O4) — evidence: `validateEnvelope` accepts the valid sample, rejects the invalid one (`state: BOGUS`)
- [x] Commit `scripts/fixtures/golden-fixture/audit-target/README.md`, `scripts/fixtures/golden-fixture/audit-target/EXPECTED.md`, and `scripts/fixtures/golden-fixture/audit-target/docs/fix/README.md` — the toy target's gate declaration, its expected report, and its lagging worklist row `9 — stale-cache` (O2)
- [x] Commit `scripts/fixtures/golden-fixture/audit-target/docs/adr/0047-transport.md` and `scripts/fixtures/golden-fixture/audit-target/docs/audits/3-2026-06-30.md` — the terminal decision record and the prior whole-product audit carrying `F2` (O2)
- [x] Commit `scripts/fixtures/golden-fixture/RUN_LOG_NOTES.md` — the doc's interleaved historical prose blocks, moved verbatim (PE-006; O10)

#### P2 — Slim the golden-fixture procedure doc

Layer: `docs`. Done-when: `wc -l docs/workflow/GOLDEN_FIXTURE.md` → ≤ 150, and `grep -n "Tool-calling smoke test" docs/workflow/GOLDEN_FIXTURE.md` → a match.

- [x] Slim `docs/workflow/GOLDEN_FIXTURE.md` to the frozen live-surface shape — purpose, the ~100-word judgment protocol, the tool-calling smoke test, the fixed pass criteria, the run log, and the fixture pointers — applying the §Design move/re-join/condense ledger to 148 lines (PE-006, PE-017; O10) — evidence: `wc -l docs/workflow/GOLDEN_FIXTURE.md` → 149 (≤ 150; the fixture-pointer list is one line shorter than the frozen assembly and the prose carries no `fix`-only filler)
- [x] Remove the embedded toy SPEC and manifest blocks from `docs/workflow/GOLDEN_FIXTURE.md`, leaving one pointer at the fixture tree (PE-006, PE-007; O10) — evidence: no ```markdown fence remains in the doc; it points at `scripts/fixtures/golden-fixture/`
- [x] Remove the audit-target build, the four traps, and the old scope-boundary prose from `docs/workflow/GOLDEN_FIXTURE.md`, leaving pointers to `scripts/fixtures/golden-fixture/audit-target/EXPECTED.md` and `scripts/fixtures/golden-fixture/RUN_LOG_NOTES.md` (ED-55-3; O10)
- [x] Update the `docs/workflow/README.md` index line so it names the judgment protocol alongside the executable suite (PE-013; O11) — evidence: `grep -n "golden-fixture" docs/workflow/README.md` → one line naming `scripts/golden-fixture.test.mjs`
- [x] Extend `CLAUDE.md`'s verification list so it names the executable suite beside the existing root regressions (PE-012; O11) — evidence: `grep -n "golden-fixture" CLAUDE.md` → one line naming the suite under `## Verification`
- [x] Verify `docs/workflow/GOLDEN_FIXTURE.md` carries no live toy slug outside the grandfathered run-log rows and that its 43 rows are byte-identical to the pre-slim bytes (PE-007; O10) — evidence: the AC5 exemption pipeline prints nothing; `diff` of the 43 `| 20…` rows against `HEAD:docs/workflow/GOLDEN_FIXTURE.md` → empty

#### P3 — Author the golden-fixture assertion suite

Layer: `config/infra`. Done-when: `node --test scripts/golden-fixture.test.mjs` → exit 0.

- [x] Author `scripts/golden-fixture.test.mjs` with the read-only fixture-root helpers every check shares (ED-55-2; O3, O13) — evidence: `runPhaseLint`/`showPath`/`copyTree`/`withTempDir` plus the six root-parameterized checks; writes only to `fs.mkdtempSync(os.tmpdir())`
- [x] Assert in `scripts/golden-fixture.test.mjs` the phase-lint PASS case byte-for-byte and the BLOCKED case (PE-001, PE-002; O3) — evidence: `phaseLintPass`/`phaseLintBlocked`, both green
- [x] Assert in `scripts/golden-fixture.test.mjs` the envelope pair through `scripts/schema-runtime.mjs` — valid accepted, invalid rejected (PE-009, PE-010; O4) — evidence: `envelopeValidity`
- [x] Assert in `scripts/golden-fixture.test.mjs` the run-log Result grammar over `docs/workflow/GOLDEN_FIXTURE.md` with the 2026-09-18 cutoff, one grandfathered accept, and one synthetic reject (D-55-6; O5) — evidence: `runLogGrammar`/`resultVerdict`; 43 committed rows read, 0 post-cutoff, synthetic accept+reject paths asserted
- [x] Assert from `scripts/golden-fixture.test.mjs` that `docs/workflow/GOLDEN_FIXTURE.md` carries its fixture pointer and names only fixture paths that exist (O6) — evidence: `crossReferences` (doc + `CLAUDE.md` + `docs/workflow/README.md`)
- [x] Assert from `scripts/golden-fixture.test.mjs` the audit-target trap invariants under `scripts/fixtures/golden-fixture/audit-target/` (O7) — evidence: `auditTargetTraps`
- [x] Assert in `scripts/golden-fixture.test.mjs` the tamper case — a temp copy with one mutated byte fails, naming the mutated path (AC4, Expectation 2; O8) — evidence: the AC4 test asserts the failure message names `expected/phase-lint-toy-plan.txt` and the violated snapshot assertion, and the committed snapshot is unchanged

#### P4 — Hardening & PR

Layer: hardening · Done-when: `git status --porcelain -- docs/` → empty, and the project verification gate commands exit 0.

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Read-verify that `scripts/golden-fixture.test.mjs` passes with network access disabled (AC8 second clause)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the roadmap row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc) and PRINT THE PR URL in the chat
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push

#### Phase-lint (owned by `skills/phase-contract/SKILL.md` — keep in sync with `docs/fix/_TEMPLATE/SPEC.md`)

Run over the emitted plan (`node scripts/phase-lint.mjs docs/features/55-executable-golden-fixture/SPEC.md`):

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:config/infra:8:commit-golden-fixture-corpus
P2 Phase-lint: PASS (8/8) · fingerprint P2:docs:6:slim-golden-fixture-procedure-doc
P3 Phase-lint: PASS (8/8) · fingerprint P3:config/infra:7:author-golden-fixture-assertion-suite
P4 Phase-lint: PASS (8/8) · fingerprint P4:hardening:8:hardening-pr
verdict PASS
fingerprint: 58fdb9db609f96bc36149d5260aafb83e5923a8a45ce97a2ef83bb8ffbcf9124
```

### Deploy & rollback

n/a — merging is enough. No schema migration, no feature flag, no config or
environment change. Rollback = revert the PR; the suite and fixtures are additive
and carry no persisted state, and the doc slim is reversible from git.

### Open questions / risks

- **Risk — the ≤150-line budget is tight** once 43 rows stay verbatim (PE-006,
  PE-007). Mitigation: P2's done-when is the measured budget and the prose moves
  verbatim to `RUN_LOG_NOTES.md`, so an over-budget slim fails the phase instead
  of surfacing in review. Owner: P2.
- **Risk — the envelope check needs the built schema package** (`dist/`); a
  fresh clone without it makes the suite fail loudly at import with the build
  step named (PE-010). That fail-closed message is the intended behavior; the
  package build is part of the verification gate the unit runs. Owner: P4.
- **Disclosed — stale historical ledger strings.** Unit 28's
  `testing.md`/`planning-findings.md` quote grep strings from doc prose that
  moves to `RUN_LOG_NOTES.md` (PE-008, PE-016). No suite re-runs them; they stay
  as historical records of that unit's own verification. Owner: none — the
  disclosure is the mitigation.
- Inherited open questions: none — the Product half records two Deferred
  decisions, each with a decide-by trigger, and none blocks this plan.

### Deliverables

- `scripts/fixtures/golden-fixture/` — both committed toy trees (executor corpus
  plus audit target), the expected stdout snapshot, the envelope samples, the
  moved product artifacts, and `RUN_LOG_NOTES.md`
- `scripts/golden-fixture.test.mjs` — the read-only mechanical assertion suite
- `docs/workflow/GOLDEN_FIXTURE.md` — the slimmed judgment protocol plus the
  verbatim run log
- `docs/workflow/README.md` — the updated index line
- `CLAUDE.md` — the verification-list bullet naming the suite
- `docs/features/ROADMAP.md` — row 55 registered, then closed out with the PR link
- planning artifacts: this SPEC's Engineering half and
  `docs/features/55-executable-golden-fixture/ACCEPTANCE.md`

### Post-merge next feature

Per the 2026-09-15 bureaucracy-reduction execution order, Phase 0 ends with this
unit (fix #224 · 52 · 59 · 55 all shipped). The next unit is **31
`planning-review-materiality`** ([#171](https://github.com/gtrabanco/agentic-workflow/issues/171)),
which opens Phase 1's loop-policy chain (`31 → 32 → 35 → 42 → 51 → 50`).
