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
feature 37 (`scripts/phase-lint.mjs`), feature 38
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

What changed since: feature 37/38 landed deterministic checkers
(`phase-lint.mjs`, `check-skill-context.mjs`), feature 28 gave the repo a
schema runtime (`scripts/schema-runtime.mjs`), feature 59 added
`next.continuation` in Envelope v2, and feature 59 established the
committed-toy-repo fixture pattern (`scripts/fixtures/unit-route/` +
`scripts/continuation-discipline.test.mjs`). The mechanical half of the golden
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
| 2 | A failing mechanical assertion names which fixture and which assertion failed (diagnosable, not a bare exit code) | in-scope | AC3 (suite output contract in Engineering half) |
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
  corresponding check fails — proving detection without editing committed
  files.
- **AC5** — doc slim: `grep -rn "csv-export-command" docs/` returns no
  matches; `docs/workflow/GOLDEN_FIXTURE.md` is ≤ 150 lines, contains the
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
no reviewed-intent change. Readiness re-run for re-review by `review-spec`.

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold`, only once the Product
half above is marked `designed`.

### Technical goals

### Architecture impact

### Design

### Planning evidence

### Obligations

### Decisions to confirm

### Testing requirements

### Dev scenarios

### Phases

### Deploy & rollback

### Open questions / risks

### Deliverables

### Post-merge next feature
