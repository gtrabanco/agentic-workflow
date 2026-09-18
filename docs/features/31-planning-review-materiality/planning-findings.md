# Planning findings — 31-planning-review-materiality

One stage-aware table, both stages; reviewers append rows, only the stage's
author resolves. Row shape per `pre-execution-review/references/LEDGERS.md` §3:
`finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision`

Review `spec-review-31-1` (stage spec) @ source revision
`cf2380405cb08fa4a4ff578a9e0779eeb02542d9`, snapshot
`735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a`,
2026-09-17. Context-clean reviewer turn; first review of the unit's Product half.
Verdict: `spec-review-pass` — 14/14 checks pass, no material finding. Both rows
below are `info` (immaterial) and route to their product-class owner
(`design-feature`); a PASS may coexist with open `info` rows.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| N31-001 | spec | info | product | 735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a | Two grounding citations are imprecise, though the substantive claims hold. (a) SPEC §Context says POLICY §4 "says more cycles \"stay allowed when correctness needs them\"" and that `REPAIR.md` §4 "repeats" it; the exact string is in `design-feature/references/REPAIR.md` §4, while POLICY §4 says "Entering a second cycle is allowed when correctness needs it". (b) decisions.md's code-side-cap row cites `skills/review-change/SKILL.md:159-163` for both the cap and the `LOOP CAP REACHED` literal; the third-cycle rule is at those lines, but `LOOP CAP REACHED` lives in `skills/review-change/references/REVIEW_PROCESS.md` (the file `scripts/review-loop-discipline.test.mjs` reads as `reviewProcess`). | SPEC.md §Context, 3rd bullet (POLICY §4 / REPAIR.md §4 quote); decisions.md evidence row `Code-side loop cap, test-pinned`; `skills/pre-execution-review/references/POLICY.md:60-61,83`; `skills/design-feature/references/REPAIR.md:64-65,71`; `skills/review-change/SKILL.md:162-163`; `scripts/review-loop-discipline.test.mjs:67,317` | resolved | §Context now quotes POLICY §4's actual wording ("Entering a **second** cycle is allowed when correctness needs it", POLICY.md:60-61); decisions.md's code-side-cap evidence row now cites `skills/review-change/references/REVIEW_PROCESS.md:169` for the `LOOP CAP REACHED` literal while `SKILL.md:159-163` keeps the third-cycle-rule citation (mechanical, intent-preserving; new evidence row records the exact strings) | 31-spec-2 |
| N31-002 | spec | info | product | 735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a | E2's `Read/list` surface lists only plan-stage homes for a recorded wording-only determination (`planning-evidence.md` for M/L, the SPEC's `### Planning evidence` section for XS/S), but POLICY §3 governs both stages and a spec-stage wording-only route is executed by `design-feature`, whose frozen-evidence home is the evidence rows in `decisions.md` (ledger ownership map: the `decisions` ledger, `design-feature:product-decisions`). The `Create` row's generic phrase "the unit's frozen evidence" covers the spec stage, so no entity row is blank and no check fails; only the pointer is incomplete for one of the two stages the feature claims to cover. | SPEC.md §Capability closure §1, entity E2 (`Create` and `Read/list` cells); `skills/pre-execution-review/references/LEDGERS.md` ledger ownership map (`decisions` row) and §1 planning-evidence home (writer: the authoring planner); `skills/pre-execution-review/references/POLICY.md` §3 (both stages) | resolved | E2's `Read/list` surface now names both stages' frozen-evidence homes: plan stage — `planning-evidence.md` (M/L) / SPEC planning-evidence section (XS/S); spec stage — `decisions.md` evidence rows (ledger ownership map: the `decisions` ledger, writer `design-feature:product-decisions`) (mechanical, intent-preserving) | 31-spec-2 |
| F01 | plan | medium | plan | 459264b4a79b078f4731c6082a0e2e8c10d23cc1d6570dc74ece5d2822025a0b | AC12's validator — and the P4/TASKS/testing mirror step it mirrors — invokes `bun run bundle:skills` at the repository root, where it cannot execute: the repository has no root `package.json`, and the `bundle:skills` script is declared only in `packages/pi-agentic-workflow/package.json`. Observed: `bun run bundle:skills` → `error: Script not found "bundle:skills"`, exit 1. The repo's own convention (feature 59 AC-12, feature 29 testing) is `cd packages/pi-agentic-workflow && npm run bundle:skills`. P4's done-when/AC12 "bundle ran" outcome is unreachable as written; `testing.md` chains `bun run bundle:skills && cd packages/pi-agentic-workflow && bun run test`, so the `&&` guarantees the whole chain fails. | ACCEPTANCE.md AC12 + `## Commands`; SPEC.md `### Testing requirements` ("Distribution parity"); `testing.md` Pi-distribution row and runtime-convention section; PLAN.md P4 task 2; TASKS.md P4 task 2; planning-evidence.md PE-012; `packages/pi-agentic-workflow/package.json` `scripts.bundle:skills`; no root `package.json` (`ls`); observed exit 1 at 31dd3681 | resolved | AC12's validator and `## Commands` now spell `cd packages/pi-agentic-workflow && bun run bundle:skills` (plus `bun run test` from the same root, and `testing.md`'s Pi-distribution row chains the same form); the Pi-mirror Integration-closure row, PE-012 + new PE-018, PLAN.md/TASKS.md P4 task 2, `testing.md` and obligation O12 carry it. `CLAUDE.md`'s parsed `normalizer-inventory@1` row is deliberately not edited (E-D31-6); PE-018 records the feature 29/59 precedent and the observed non-zero root-form exit at `2550e1a8` | 31-plan-2 |
| F02 | plan | medium | plan | 459264b4a79b078f4731c6082a0e2e8c10d23cc1d6570dc74ece5d2822025a0b | The feature's core deliverable — the new planning-side discipline pins (In-scope 5, E6) — is not verified to exist by any frozen validator. `bun test scripts/review-loop-discipline.test.mjs` is a plain assertion script: it exits 0 over the unmodified suite, and the AC1/AC2 validators name a "pin section" only in prose; AC9 checks only that no existing assertion is removed (vacuously true with zero additions). So the document edits alone satisfy AC1–AC3, AC9, AC11 while the enforcement is absent, and P1/P2/P3 done-whens pass for the wrong reason — the falsification question L5 names. | ACCEPTANCE.md AC1 (validator "(report-note pin section)"), AC2 ("CHECKS pin section"), AC4, AC6, AC9, AC11; testing.md mandatory-scenario rows whose validator is "discipline suite … pin"; PLAN.md P1/P2/P3 done-whens; TASKS.md P1/P2/P3; `bun test scripts/review-loop-discipline.test.mjs` → exit 0 (0 pass / 0 fail, unmodified suite) at 31dd3681; `scripts/review-loop-discipline.test.mjs:27-28,134` (the suite reads the docs, never itself) | resolved | New AC14 plus a declared `PLANNING_PIN_TABLE` with a row floor (`PLANNING_PIN_FLOOR` 4 after P1, 8 after P2, 9 at the PR head) and a discrimination leg (`assertDiscriminating(`); P1 declares the table, P2/P3 raise the floor, every phase done-when runs the presence check, and P4 runs AC14. AC1–AC4, AC6, AC7, AC9, AC11, In-scope 5, Design E6, `### Testing requirements`, the `loop:pin-vacuous` scenario row, obligation O15 and decision E-D31-5 carry it (PE-019 records the suite's vacuity) | 31-plan-2 |
| F03 | plan | info | plan | 459264b4a79b078f4731c6082a0e2e8c10d23cc1d6570dc74ece5d2822025a0b | AC8's file-list guard is worded against "the affected surfaces enumerated in the SPEC's In scope", but the P4 writes and the bump surface also touch `packages/pi-agentic-workflow/skills/**` (mirror re-bundle), the four `SKILL.md` `version:` lines, `README.md` Skills cells, and `CHANGELOG.md` — none enumerated in `#### In scope`. The read-verified walk (P4 task 5) must record those as derived In-scope surfaces, or it will report them as scope violations. Non-blocking: the In-scope enumeration is already a concern list (it also omits the bump's README cells), and the walk is read-verified. | ACCEPTANCE.md AC8; SPEC.md `#### In scope`; SPEC.md Integration-closure row "Pi package mirror"; PLAN.md P4 tasks 1/2/5; planning-evidence.md PE-012 | resolved | The In-scope declaration now names the derived-surface set (Pi mirror under `packages/pi-agentic-workflow/skills/**`, the four edited `version:` lines, README skill-table cells, `CHANGELOG.md`) and AC8 + obligation O8 + PLAN.md/TASKS.md P4 task 5 walk it per path instead of reporting it as a violation (E-D31-7) | 31-plan-2 |
| R31-01 | plan | high | product | e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a | The Product half moved after `spec-review-31-1`, so this plan descends from a stale Product receipt. The `31-plan-2` repair batch edited Product-half bytes — SPEC `#### In scope` (the derived-surfaces paragraph and item 5), three Integration-closure rows, `### Acceptance criteria` (AC1–AC4, AC6–AC9, AC11, AC12 reworded/anchored and AC14 added), `### Tooling`, and the Spec-lint product box — and re-froze `ACCEPTANCE.md`. The `spec-product-v1` projection digest is now `c09b28aa82002cb075b62aa07b0b821fb6a1be8c1a8ce999cd358daa5d0960f2` (31130 chars) while the receipt bound `14d23401222e9d8ab9090ac917cee3268bfb90fdcc7551f3ada9616328a094d9` (28554 chars). The plan snapshot still binds `--parent 735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a`, whose Product bytes no longer exist on disk. | `git diff cf238040 a3012f86 -- docs/features/31-planning-review-materiality/SPEC.md` (Product-half hunks @@ -116, -133, -255, -332, -356, -438); `selectSpecProduct` digest old `14d2340…` vs now `c09b28aa…`; `docs/features/31-planning-review-materiality/SPEC.md` Engineering-half claim of a fresh `verify --stage spec`; `node scripts/pre-execution-snapshot.mjs verify --stage spec --unit 31-planning-review-materiality` → `fresh: false / stale-source-revision`, `changedPaths: [SPEC.md]` | resolved | Replan `31-plan-3` (2026-09-17, `plan-feature`): the carrier amendment's re-cut binds the plan to the current Product receipt `spec-review-31-9` @ `e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507`, verified fresh against the bytes on disk at the Product-review gate, and the plan snapshot's `--parent` is that digest — the lineage defect the row names (a plan descending from `spec-review-31-1`) no longer exists. The superseded `31-plan-1/2` set dies with its carrier (D-31-6), never repaired. Recorded in `decisions.md` §"Engineering replan for the code carrier" and `progress.md`. | `31-plan-3` |
| R31-02 | plan | medium | plan | e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a | Obligation `O15` names three phases and three tasks in one row (`P1 (table shell + floor 4), P2 (floor 8), P3 (floor 9)`), violating the frozen ledger's row contract "exactly one phase and one task; a row needing two phases means the phase cut is wrong". The ledger's own `## Closure` restates the span: "AC14→O15 (P1/P2/P3, run at the PR head)". The AC14 validator runs only at the PR head, so the row's phase mapping is also mis-targeted. | `docs/features/31-planning-review-materiality/planning-obligations.md` O15 row + `## Closure`; `skills/pre-execution-review/references/LEDGERS.md` §2 `phase` / `task` cell contract | resolved | Replan `31-plan-3` (2026-09-17, `plan-feature`): `planning-obligations.md` is re-cut with one phase and one task per row — O1…O14 mirror AC1…AC14 and O15 carries the AD-008 invariant — and its `## Closure` restates that mapping, with the reading convention for the `phase`/`task` cells stated in the ledger header. The superseded O15 row that named three phases died with the `31-plan-2` set. | `31-plan-3` |
| R31-03 | plan | info | plan | e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a | AC8's scope guard reads a whole-diff `git diff main --stat` "lists only the In-scope surfaces … and nothing else", but the branch diff necessarily also carries this unit's own planning records (`docs/features/31-planning-review-materiality/*`) and the `docs/features/ROADMAP.md` row update; neither is enumerated in In-scope nor in the declared derived-surface set (E-D31-7). P4's read-verified walk (AC8/O8) can therefore report the unit's own records as scope violations — the same class as F03, repaired only for the bump/mirror surfaces. | `docs/features/31-planning-review-materiality/ACCEPTANCE.md` AC8; SPEC `#### In scope` + `## Amendments` E-D31-7; `PLAN.md`/`TASKS.md` P4 task 5; `git diff --stat main...HEAD` (13 files, incl. the unit dir and `docs/features/ROADMAP.md`) | resolved | Replan `31-plan-3` (2026-09-17, `plan-feature`): the current Product half's AC13 declares the third allowed-set group — `workflow-mutated record surfaces`: the unit's own records under `docs/features/31-planning-review-materiality/**`, the unit's `docs/features/ROADMAP.md` row, `docs/LOGS.md` session-log appends — together with the anchored pathspec exclusions, and obligation O13 binds the PR-head walk to it, so the unit's own records are declared in-scope instead of reported as scope violations. | `31-plan-3` |
| P31-01 | plan | medium | plan | e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f | The wording-only route's identity check is unsatisfiable at the plan stage. E6/PLAN-P3 require the determination block's recorded `Artifact revision` to equal the snapshot's **current** `artifactRevisionId`, but every plan-stage determination home is a **bound** artifact (`planning-evidence.md`, or the SPEC's `### Planning evidence` inside the bound `SPEC.md`), and `artifactRevisionId` defaults to `contentRevision` = the newest commit touching the bound paths — so writing the block rotates the very revision it must record, and no commit can name its own hash. The route can therefore never answer `fresh`: AC4's first outcome ("revision rotated + determination recorded + no material movement → verify stays current without a new review receipt") is unreachable. The spec stage's home (`decisions.md`) is not bound by `STAGE_ARTIFACTS.spec` and would work; the plan stage's is not. | SPEC.md §Design E5/E6 and §Phases P3; PLAN.md P3 tasks 2–3; TASKS.md P3; `scripts/pre-execution-contract.mjs:33-75` (`STAGE_ARTIFACTS.plan` binds `planning-evidence.md`; `STAGE_ARTIFACTS.spec` binds only the `spec-product-v1` projection; `CONTEXT_SOURCES` does not include `decisions.md`); `scripts/pre-execution-snapshot.mjs` `contentRevision()` (`git log -1 --format=%H -- <boundPaths>`) and `receipts()` (which reads the **unbound** `progress.md` — the repo's own precedent that a recorded block must live outside the bound set); observed `node scripts/pre-execution-snapshot.mjs build --stage plan …` lists `{"kind":"planning-evidence", …}` among the bound artifacts | resolved | Repair batch `31-plan-4` (2026-09-17, `plan-feature`): E5's home moves to the unit's unbound `progress.md` — the one unit record neither stage's `STAGE_ARTIFACTS` row binds, with the `## Dependency receipt v1` block as the standing precedent — so appending the record cannot rotate the `artifactRevisionId` it names and E6's identity check has a fixed point that survives its own write (E-D31-15, PE-026). | `31-plan-4` |
| P31-02 | plan | medium | plan | e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f | E6's branch placement cannot produce the answer it promises. "After the identity lines and before the generic `stale-artifact-content` answer" sits **after** `attributeFreshness`'s `stale-source-revision` slot, which fires first whenever a bound byte moved — exactly the branch's own stated trigger ("when bound artifact bytes moved") — so the `fresh` answer is unreachable at that position; and P3 task 3's "a rotated revision with no matching determination keeps `stale-artifact-revision`" contradicts the same task's "keeping the comparator's documented order" (a moved bound byte answers `stale-source-revision` today). Either the branch changes the comparator's documented precedence (which the SPEC forbids) or it is dead code. | SPEC.md §Design E6; PLAN.md P3 tasks 2–3; TASKS.md P3; `scripts/pre-execution-snapshot.mjs` `attributeFreshness()` precedence (`stale-context` → `stale-source-revision` → `stale-parent` → `stale-artifact-content` → `stale-artifact-revision` → `fresh`); `scripts/pre-execution-attribution.test.mjs:77-110` (the pinned dimension answers the contract comparator must agree with) | resolved | Repair batch `31-plan-4`: the branch is specified after the `stale-context` check and before the `stale-source-revision` check, fed by a pure `wordingOnly` input so `attributeFreshness` stays pure and `pre-execution-attribution.test.mjs` keeps its dimension-by-dimension agreement, with the no-determination path falling through unchanged (the earlier `stale-artifact-revision` wording was wrong) (E-D31-16, PE-027). | `31-plan-4` |
| P31-03 | plan | high | plan | e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f | P2's sensor task has no implementation that both enforces the cap and preserves feature 38's frozen invariant. `scripts/workflow-status-sensor.test.mjs:268-269` pins "`decideWorkflowAction()` stays consumer-side — absent from the script" (`grep -c decideWorkflowAction scripts/workflow-status.mjs` → 0; feature 38 SPEC AC-12 / obligation O12 / `architecture-notes.md:66-67`), yet P2 task 6 requires `scripts/workflow-status.mjs` to "pass [the derived count] into the decider input" while E4 keeps "the sensor's envelope shape unchanged" — so either the sensor references the decider (breaking A:12) or the count must be surfaced in Envelope v2 (an undeclared contract change the SPEC does not name). No in-repo consumer calls `decideWorkflowAction` today, so the refusal has no reachable enforcement path. The suite that would catch the break is in **no** gate: AC10 and the P5 ladder both omit `scripts/workflow-status-sensor.test.mjs`, so the regression is invisible to every frozen validator. | `scripts/workflow-status-sensor.test.mjs:268-269`; `docs/features/38-workflow-status-sensor-script/SPEC.md:306` (A:12); `docs/features/38-workflow-status-sensor-script/architecture-notes.md:66-67`; `docs/features/38-workflow-status-sensor-script/planning-obligations.md` O12; SPEC.md §Scope 3, §Design E4; PLAN.md P2 task 6; TASKS.md P2 task 6; `ACCEPTANCE.md` AC5 + AC10; PLAN.md P5 task 1 (ladder); `grep -rn decideWorkflowAction` → consumers only under `packages/agentic-workflow-schema/test/` | resolved | Repair batch `31-plan-4`: the count is derived by one shared pure helper `deriveReviewLoopCycles` in `scripts/pre-execution-contract.mjs` and projected by `scripts/workflow-status.mjs` into the envelope's free-form `detail` bag as `detail.review_loop_cycles` — never a decider reference, so feature 38's A:12 holds. The invariant's durable pin lands in the **already-packed** `scripts/review-loop-discipline.test.mjs` block (projection string + `decideWorkflowAction` absence), not by adding the feature-38 suite to AC10: that suite is outside every gate and carries 3 pre-existing failures at this head, so adding it to a frozen gate would make the gate unsatisfiable (E-D31-17, PE-024/PE-025, `known-issues.md` §11). | `31-plan-4` |
| P31-04 | plan | low | plan | e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f | P1 bumps the schema package to 4.3.0 but P4 adds its `CHANGELOG.md` companion-table row, so the repo's `normative-drift` gate (`rendered-facts@1` row `CHANGELOG.md \| package-versions \| package:version \| equals-each`) is red from P1 through P4. P1's done-when (`cd packages/agentic-workflow-schema && bun run test && bun run check:pre-execution-schemas`, which never runs `scripts/normative-drift.test.mjs`) cannot see it, and no phase between P1 and P4 runs the gate — the split is caught only at P5. | SPEC.md §Design E9; PLAN.md P1 ("Bump the package to 4.3.0") vs P4 ("Add the schema package's 4.3.0 row"); TASKS.md P1/P4; `scripts/normative-drift.test.mjs:708-715` (`newestVersionCell` vs `package.json` version); `CLAUDE.md` block `rendered-facts@1`; observed at this head: `bun test scripts/normative-drift.test.mjs` → 0 fail (baseline green, so the P1/P4 split is what reddens it) | resolved | Repair batch `31-plan-4`: the row stays in P4 because the canonical phase contract forbids a `docs` target (`CHANGELOG.md`) in a `config/infra` phase; the `normative-drift` window P1→P4 is now declared in `known-issues.md`, P1's done-when stays package-local, and P4's done-when runs `bun test scripts/normative-drift.test.mjs` to prove the closure (E-D31-18, PE-028). | `31-plan-4` |
| P31-05 | plan | low | plan | e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f | The Engineering half states the evidence ledger carries "rows PE-001…PE-021", but the frozen `planning-evidence.md` at the same artifact revision (`31-plan-3`) carries **23** rows (`PE-001…PE-023`); `testing.md:47` cites `PE-023`, so the range claim is false against the ledger it cites. | SPEC.md:736 ("evidence rows PE-001…PE-021 in `planning-evidence.md`") and SPEC.md:915 ("rows PE-001…PE-021, all `current`, `proven` or decision"); `planning-evidence.md` (23 `| PE-` rows, last `PE-023`); `testing.md:47` (cites `PE-023`); PLAN.md header (artifact revision `31-plan-3`) | resolved | Repair batch `31-plan-4`: the Engineering half's range now reads the ledger's actual rows — `PE-001…PE-029`, including this batch's PE-024…PE-029 — in both places it was stated (E-D31-19, PE-029). | `31-plan-4` |
| P31-06 | plan | medium | product | e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f | AC13's declared **code-carrier** group does not enumerate three paths this plan edits by design — `scripts/pre-execution-contract.mjs` (the determination parser plus `deriveReviewLoopCycles`), `scripts/workflow-status.mjs` (the `detail.review_loop_cycles` projection) and `scripts/workflow-status-pre-execution.test.mjs` (all three edited by the original `31-plan-3` cut; this batch adds no new undeclared path) — so the frozen scope guard reports them as violations and AC13 can never pass. Surfaced by the `31-plan-4` repair turn (`plan-review-31-3`'s union missed it). Repairing it widens a **Product-half** declaration, so it routes to `design-feature`; no plan write may amend it without inventing product intent. Related live evidence: `scripts/workflow-status-sensor.test.mjs` is outside the AC10 pack and carries 3 pre-existing failures at this head (2 forge-hang harness timeouts, 1 exit-status assertion), so the workflow never notices it is red — the same validator-blind class. | `SPEC.md` `#### In scope` (declared allowed-set groups, group 1) against §Design E4/E6 and `PLAN.md` P2 tasks 6-8 / P3 task 1; `ACCEPTANCE.md` AC13 row and its mechanical anchor; observed `bun test scripts/workflow-status-sensor.test.mjs` → 59 pass / 3 fail at `7ace8dbc` | resolved | Re-derivation `31-plan-5` (2026-09-17, `plan-feature`): the Product half was amended by the owner-commissioned patches `31-spec-9` (the three paths this row named) and `31-spec-10` (the two suites `spec-review-31-10`'s N31-015 named), and `spec-review-31-11` returned `spec-review-pass` (14/14, zero findings) on the patched bytes. With AC13's code-carrier group enumerating every path the plan edits by design, the frozen scope walk (O13) is satisfiable and the row's defect no longer exists; the re-derivation also rebinds the plan's parent to `spec-review-31-11` @ `dd09372a…` (E-D31-20). | `31-plan-5` |

---

## Repair batch (`31-plan-2`, 2026-09-17)

Trigger: `plan-review-31-1` returned `PLAN-REVIEW-FAIL` (checks L5 + P10) with
F01 (medium), F02 (medium) and F03 (info) — the unit's first plan cycle, no
cycle cap consumed. Repair owner: `plan-feature` (one batch over the whole set,
user-commissioned as "repair F01 + F02 (+F03) — package-root `bundle:skills`,
mechanical pin-existence validators, AC8 derived-surface walk"). The three rows
above were resolved in place by that batch, which also re-froze `ACCEPTANCE.md`
(AC8 wording, AC12 validator, AC14 added) and rotated the artifact revision to
`31-plan-2` — see SPEC `## Amendments` and `decisions.md` E-D31-5…E-D31-7.

The two `info` product-class rows N31-001/N31-002 stay `open`: their owner is
`design-feature` (spec-stage product class), not this batch.

---

## Re-review (`spec-review-31-2`, 2026-09-17)

Re-review of the Product half the `31-plan-2` repair batch edited — the route
`plan-review-31-2` named for R31-01 (`class: product` → Product-half re-review
before the plan can re-derive a parent). This is the spec stage's cycle-1
repair/re-review (one review, one re-review), so no cycle cap is consumed and no
`CONVERGENCE-ANOMALY` is due — the same reading `plan-review-31-2` recorded for
its own re-review. Fresh context; this conversation never authored or edited the
Product half, its ledgers, or its acceptance manifest.

Snapshot `d93328fe9bede0ecadb64081d5663b91259e2cd9681374657b7f59bda6277a2e` @
source revision `a3012f8617549fe5fd73f2e86cf80ab520370e43` (`spec-product-v1`
digest `c09b28aa82002cb075b62aa07b0b821fb6a1be8c1a8ce999cd358daa5d0960f2`,
31401 bytes). Verdict: `spec-review-fail` — 13/14 checks pass, C8 carries one
material `product` row. N31-001/N31-002 stay `open` (`info`), unchanged.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| N31-003 | spec | medium | product | d93328fe9bede0ecadb64081d5663b91259e2cd9681374657b7f59bda6277a2e | AC8's scope guard gates on the branch diff as a whole (`git diff main --stat`) while its declared allowed set — the governed In-scope surfaces plus the derived-surface set (E-D31-7) — omits the unit's own workflow-mutated paths, so the criterion cannot be satisfied by the correct implementation: at the PR head the diff necessarily also carries `docs/features/31-planning-review-materiality/**` and the `docs/features/ROADMAP.md` row. | SPEC.md `#### In scope` + AC8; `ACCEPTANCE.md` AC8; `skills/verification-contract/SKILL.md:27-33` §Validator stability (v1.2.1, rule added by fix #159 per `CHANGELOG.md:659` — a validator must never gate on the branch diff as a whole; a diff-based validator enumerates the unit's paths or excludes the workflow-mutated surfaces explicitly, `docs/LOGS.md`, the unit's own docs directory); `docs/features/27-pi-agentic-workflow/ACCEPTANCE.md` AC16 (repo precedent that enumerates its own unit dir + `ROADMAP.md`); `git diff main --stat` at `afd0edab` → 13 paths, all unit records + `ROADMAP.md`, none an In-scope surface; R31-03 (same defect, plan facet, `open`/`info`) | resolved | AC8's allowed set completed with its third declared group — the workflow-mutated record surfaces (`docs/features/31-planning-review-materiality/**`, the unit's `docs/features/ROADMAP.md` row, `docs/LOGS.md` session-log appends) per `verification-contract` §Validator stability, with feature 27's AC16 precedent and a mechanical pathspec-exclusion anchor (`git diff main --name-only -- . ':(exclude)…'`, verified: the 13-path diff reduces to empty); `ROADMAP.md` hunk walk (row 31 only) added; the In-scope paragraph and sweep row 17 carry the declaration. Closure completion — product intent unchanged; the guard stays closed (any path outside the three groups is still a violation) | 31-spec-2 |

The finding is the product-side facet of R31-03: the plan reviewer read the same
whole-diff guard as a plan-stage walk defect (`info`), this review reads the
criterion's declared allowed set as the Product-half defect the
verification-contract rule names, and no plan-only walk can satisfy that rule
without editing the Product half's `#### In scope` / AC8 wording — which is why
the plan cannot re-derive a stable parent until `design-feature` repairs it.

---

## Repair batch (`31-spec-2`, 2026-09-17)

Trigger: `spec-review-31-2` returned `SPEC-REVIEW-FAIL` (failed check C8) with
N31-003 (medium, product) material plus the open `info` rows N31-001/N31-002 —
one batch over the whole set, repair owner `design-feature`, user-commissioned
as "widen the AC8 scope guard". This enters the spec stage's second
repair/re-review cycle, so the `CONVERGENCE-ANOMALY` block was printed before
any edit (POLICY §4). The three spec-stage rows above were resolved in place
with `resolving-artifact-revision: 31-spec-2` — see SPEC `## Amendments`
(`31-spec-2`) and `decisions.md` (product repair batch section). The plan-stage
rows R31-01/R31-02/R31-03 stay open for `plan-feature`'s re-derivation batch
(plan re-cut + `ACCEPTANCE.md` re-freeze once a fresh `SPEC-REVIEW-PASS`
receipt exists).

---

## Re-review (`spec-review-31-3`, 2026-09-17)

Cycle-2 re-review of the Product half the `31-spec-2` repair batch rewrote — the
route `spec-review-31-2` named for N31-003 (`class: product` → Product-half
repair, then re-review). Fresh context; this conversation never authored or
edited the Product half, its ledgers, or its acceptance manifest.

Snapshot `b1cafdbfa468f95c7dceb849b0568b2fef57041ac94dfc712220ba65e79144c7` @
source revision `3e4c7c2d5cbdde6e241db77d37f14906afd88b5e` (`spec-product-v1`
digest `5cdbd2f3f2039b1089c14cdce9a3367df9a92720eb0122de822e1693a07f502e`,
33332 bytes). Verdict: `spec-review-pass` — **14/14 checks pass, zero new
findings**. No row was appended: N31-001/N31-002/N31-003 remain `resolved` at
`resolving-artifact-revision: 31-spec-2` (their resolutions re-verified on disk
here), and the plan-stage rows R31-01/R31-02/R31-03 stay `open` for
`plan-feature`'s re-derivation batch, which owns them.

What this re-review verified, in one line each:

- **N31-003 (medium, product)** — AC8's allowed set now carries its third
  declared group (the workflow-mutated record surfaces:
  `docs/features/31-planning-review-materiality/**`, the unit's
  `docs/features/ROADMAP.md` row, `docs/LOGS.md` appends), and the mechanical
  pathspec anchor
  (`git diff main --name-only -- . ':(exclude)…'` ×3) verifiably reduces the
  13-path branch diff to the governed + derived set (exit 0, no path listed) at
  the reviewed revision; the `ROADMAP.md` hunk is row 31 only. Resolved.
- **N31-001 (info, product)** — SPEC §Context now quotes POLICY §4's actual
  wording, and the `decisions.md` code-side-cap row cites
  `REVIEW_PROCESS.md:169` for `LOOP CAP REACHED` (re-read on disk). Resolved.
- **N31-002 (info, product)** — E2's `Read/list` names both stages'
  frozen-evidence homes. Resolved.

The cycle-2 `CONVERGENCE-ANOMALY` (POLICY §4) was reported by the `31-spec-2`
repair batch on entry and is reproduced in `progress.md`; it grants no PASS and
is not a stop. `plan-feature` may now re-derive the Engineering half against
this receipt: the plan-side mirrors of AC8 (`ACCEPTANCE.md` AC8, obligation O8,
`PLAN.md`/`TASKS.md` P4 task 5) remain `plan-feature`'s to re-cut, closing
R31-02 + R31-03 and re-freezing `ACCEPTANCE.md`.

---

## Re-review (`spec-review-31-4`, 2026-09-17)

Cycle-1 review of the carrier-amended Product half (`31-spec-3`) — the
authorized re-open D-31-6/D-31-7 declared after `spec-review-31-3` (PASS) went
`stale-artifact-content` on the carrier-move write. Fresh context; this
conversation never authored or edited the Product half, its ledgers, or its
acceptance manifest.

Snapshot `d2444b4c179b3aa0ec7ab21345733355efc066c3588eba68edd25539ab6754fa` @
source revision `9a39c3fc88379cea123dd4b85123caefb439363b` (`spec-product-v1`
digest `c0dfc2598158ca0b9198b65af57279c8a19372864f67932bbe93810b9fbee4a8`,
40400 bytes); handoff label `31-spec-3`. Verdict: `spec-review-fail` — C8
carries one material `product` row (N31-004) plus one open `info` row
(N31-005). The three earlier spec rows (N31-001/N31-002/N31-003) stay
`resolved` at `resolving-artifact-revision: 31-spec-2`; the plan-stage rows
R31-01/R31-02/R31-03 stay `open` for `plan-feature`.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| N31-004 | spec | medium | product | d2444b4c179b3aa0ec7ab21345733355efc066c3588eba68edd25539ab6754fa | AC7 does not verify three of the prose surfaces In-scope item 5 declares shrunk. It greps `POLICY.md` ("no cap converts a verdict into a dead end", "Entering a second cycle is allowed") and, via `grep -rn "More cycles stay allowed" skills/`, `REPAIR.md` §4 — but never `skills/review-spec/references/CHECKS.md` or `skills/review-plan/references/CHECKS.md` (both still read "Material = anything above `info`"), never either `OUTPUT.md`, and never the removal of "`info` is the only immaterial one" from `LEDGERS.md` §3 (AC7 only checks the new `report-note` sentence is present). The Integration-closure row "Skill reference docs" claims its Test is "AC7 greps + `normative-drift` + context budgets", but `scripts/normative-drift.test.mjs` reads neither CHECKS.md nor OUTPUT.md for materiality, `scripts/pre-execution-quality.test.mjs` reads CHECKS.md yet pins no materiality sentence, and `bun scripts/check-skill-context.mjs` checks budgets only. A correct implementation could therefore leave CHECKS.md/OUTPUT.md/LEDGERS.md still stating material = anything above `info` with every AC green — a documented rule contradicting the shipped machine predicate. | SPEC.md `#### In scope` item 5; SPEC.md `### Acceptance criteria` AC7; SPEC.md `### Capability closure` Integration-closure row "Skill reference docs"; `skills/review-spec/references/CHECKS.md:104`; `skills/review-plan/references/CHECKS.md:105`; `skills/pre-execution-review/references/LEDGERS.md:93`; `scripts/normative-drift.test.mjs` (no CHECKS/OUTPUT materiality read); `scripts/pre-execution-quality.test.mjs:30,500` (reads CHECKS.md, pins no materiality line) | resolved | Resolved at `31-spec-4` (closure completion — reviewed product intent unchanged): AC7's removal grep set now covers every surface In-scope item 5 declares shrunk — both `CHECKS.md` (`grep -rn "Material = anything above"`, both files), both `OUTPUT.md` (`grep -rnE "re-review of the new snapshot\|re-reviews the new"` — the FAIL verdict-route rows and the closing hand-off blocks), and `LEDGERS.md` §3 (`grep -n "only immaterial"`); the Integration-closure row "Skill reference docs" now states its Test truthfully (AC7's greps + `check-skill-context.mjs` budgets; `normative-drift` guards versioned blocks, not the materiality prose). Evidence rows: `decisions.md` §"Product repair batch (design-feature, artifact revision `31-spec-4`)". | 31-spec-4 |
| N31-005 | spec | info | product | d2444b4c179b3aa0ec7ab21345733355efc066c3588eba68edd25539ab6754fa | Two summary sections state the loop's unconverged end is `NEEDS-DESIGN` without stage scoping, while In-scope item 3 and D-31-8 scope it: at the plan stage the exit is the orchestrator's refusal + `design-feature` routing (the machine map does not sanction a plan-stage `needs-design` receipt — fix/162). The Goal says "the spec/plan repair loop gets a hard two-cycle cap whose unconverged end is `NEEDS-DESIGN`" and the Business goals say "an unconverged planning loop asks the human (`NEEDS-DESIGN`)". D-31-2 already carries "(stage-scoped by D-31-8)", so these two summary instances are the only unqualified ones; the substantive mechanism sections are unambiguous, which is why this is `info`, not material. | SPEC.md `## Goal`; SPEC.md `### Business goals` bullet 2; SPEC.md `#### In scope` item 3; SPEC.md `### Product decisions` D-31-2/D-31-8; `packages/agentic-workflow-schema/src/pre-execution-contract.ts:126-138` (`VERDICTS_BY_STAGE` — plan stage carries no `needs-design`) | resolved | Resolved at `31-spec-4` (mechanical, intent-preserving): the Goal and Business-goals bullet 2 now stage-scope the unconverged end per D-31-8 — `NEEDS-DESIGN` where the verdict vocabulary sanctions it (spec stage), the orchestrator's refusal + `design-feature` routing at the plan stage (fix/162); D-31-2's pointer and every mechanism section unchanged. | 31-spec-4 |

The medium row is the acceptance-coverage defect the carrier amendment's
AC re-derivation introduced: the pre-carrier Product half verified each prose
surface with its own criterion (old AC1/AC2 covered `LEDGERS.md` and both
`CHECKS.md`); the re-derived AC7 keeps only the `POLICY.md`/`REPAIR.md`
greps, so the same declared scope now ships with a smaller, non-covering
acceptance set. Repair owner: `design-feature` (add the missing greps to AC7 —
`grep -n "anything above \`info\`" skills/review-spec/references/CHECKS.md
skills/review-plan/references/CHECKS.md` exits non-zero, the schema-side AC2
pattern for `LEDGERS.md` — or re-scope item 5), then `/review-spec` re-judges
the new revision.

---

## Re-review (`spec-review-31-5`, 2026-09-17)

Cycle-2 re-review of the Product half the `31-spec-4` repair batch rewrote —
the route `spec-review-31-4` named for N31-004. Fresh context; this
conversation never authored or edited the Product half, its ledgers, or its
acceptance manifest.

Snapshot `b9cf60a8e4e64bc197b7d1ced093b8875d43055392f8c59d5dc7555d14d3b10a` @
source revision `fef66d093f850888454ea095e8dc6de8509be681` (`spec-product-v1`
digest `bd05875641c632ca88533e2de8a85fa1c68942d03531bae8e922af8c65a871ab`,
41678 bytes). Verdict: `spec-review-fail` — 11/14 checks pass; C1, C8 and C10
carry one row each. N31-004/N31-005 are verified repaired; N31-001/N31-002/
N31-003 stay `resolved` at `resolving-artifact-revision: 31-spec-2`.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| N31-006 | spec | medium | product | b9cf60a8e4e64bc197b7d1ced093b8875d43055392f8c59d5dc7555d14d3b10a | AC7's removal clause for the two POLICY §4 sentences cannot verify the removal, so a correct-looking PR can ship POLICY.md still stating the unbounded loop while AC7 is green. `grep -n "no cap converts a verdict into a dead end" skills/pre-execution-review/references/POLICY.md` exits 1 because the sentence is line-wrapped (`:83-84` — "… no cap converts a verdict into a" / "dead end."); `grep -n "Entering a \*\*second\*\* cycle is allowed" …/POLICY.md` exits 1 because `:60-61` wraps it ("Entering a **second**" / "cycle is allowed …"). Both criteria are therefore satisfied whether or not the sentence survives — a false-green validator of the same class the second-cycle repair set out to close. | SPEC.md `### Acceptance criteria` AC7 (first three greps); `skills/pre-execution-review/references/POLICY.md:60-61,83-84`; observed `grep … ; echo $?` → exit 1 for both patterns at `fef66d09` (sentences present, wrapped); `grep -rn "More cycles stay allowed" skills/`, the CHECKS/OUTPUT/LEDGERS greps and the three kept-side greps all discriminate as intended | resolved | Resolved at `31-spec-5` (closure completion — reviewed product intent unchanged): AC7's two POLICY §4 removal greps now match single-line fragments verified present at branch head `4cf755ab` — `grep -n "no cap converts a verdict into a"` hits `POLICY.md:83` (the sentence's tail `dead end.` wraps to `:84`), and `grep -n "cycle is allowed when correctness needs it"` hits `POLICY.md:61` (the second line of the wrapped "Entering a **second** cycle is allowed …" sentence, `:60-61`); both fragments are unique in `skills/` and exit 0 while the sentences stand, so each grep exits 0 before the shrink and non-zero after it — the false-green path is closed. Evidence rows: `decisions.md` §"Product repair batch (design-feature, artifact revision `31-spec-5`)" | 31-spec-5 |
| N31-007 | spec | low | product | b9cf60a8e4e64bc197b7d1ced093b8875d43055392f8c59d5dc7555d14d3b10a | In-scope 7 declares the four touched skills bumped minor with CHANGELOG rows and README skill-table cells, but its AC pointer ("→ AC10 + AC11") observes none of it: AC9 names only the schema package `version:`; AC10 runs the gate pack + `check-skill-context.mjs`; AC11 runs the mirror/package suite. No test in `scripts/` reads README skill-table cells or asserts the four `version:` lines (`grep -rn "version: [0-9]" scripts/*.test.mjs` hits only `review-loop-discipline.test.mjs:278`, the fold-skill pin), and `normative-drift.test.mjs` checks restated-vs-actual consistency, so an unchanged version stays consistent and green. | SPEC.md `#### In scope` item 7; SPEC.md AC9/AC10/AC11; SPEC.md `### Capability closure` Integration-closure row "Versioning/release surfaces"; `skills/pre-execution-review/SKILL.md` (`version: 2.2.1`), `skills/review-spec/SKILL.md` (`1.7.1`), `skills/review-plan/SKILL.md` (`1.6.1`), `skills/design-feature/SKILL.md` (`3.4.0`); `scripts/normative-drift.test.mjs:701-713` (consistency, not bump); no README/version assertion in `scripts/` | resolved | Resolved at `31-spec-5` (closure completion — the obligation was already In-scope 7's declared content; only its criterion was missing): new **AC14** observes the four skill `version:` bumps (pathspec-limited `git diff main` over the four `SKILL.md` files must carry one removed + one added `version:` line each — ≥ 8 hunk lines; a non-bumped skill contributes no hunk), each pair a semver-minor increment per the #176 freeze, `CHANGELOG.md` per-skill rows (recomputed against frontmatter by AC10's `normative-drift` version-tables check), and the README `## The skills` cells accurate post-shrink. In-scope 7's AC pointer and the Integration-closure row "Versioning/release surfaces" name AC14 | 31-spec-5 |
| N31-008 | spec | info | product | b9cf60a8e4e64bc197b7d1ced093b8875d43055392f8c59d5dc7555d14d3b10a | In-scope 5 frames the planning remainder as text the shrink `keep[s] only`, but three of the named remainder items do not exist in the named planning surfaces today and must be authored: the anti-deflation judgment ("`medium` minimum") exists only code-side at `skills/review-implementation/references/CLASSIFY.md:22` ("`med` minimum"), not under `skills/pre-execution-review/references/`, `skills/review-spec/`, `skills/review-plan/`; "third cycle never" is absent from `POLICY.md` (it lives in `review-change` files); "report-note" is absent from `LEDGERS.md` §3. The AC7 kept-side greps correctly require the post-shrink state, so the defect is the half's "keep only"/decisions "stays" framing presenting authored prose as preserved prose, not the criterion. | SPEC.md `#### In scope` item 5; SPEC.md AC7 (kept-side greps); `grep -rn 'medium` minimum' skills/pre-execution-review/references/ skills/review-spec/ skills/review-plan/` → exit 1 at `fef66d09`; `grep -n "third cycle never" skills/pre-execution-review/references/POLICY.md` → exit 1; `grep -niE "report-note" skills/pre-execution-review/references/LEDGERS.md` → exit 1; `skills/review-implementation/references/CLASSIFY.md:22-23`; `skills/review-change/SKILL.md:161` | resolved | Resolved at `31-spec-5` (mechanical, intent-preserving): In-scope 5 now names the **authored remainder** — the anti-deflation judgment, the human-keyed third-cycle rule and the report-note persistence contract (with the planning materiality line replacing the removed sentences) are stated as written fresh by this feature (none exists in the named planning surfaces today, per this finding's three exit-1 greps), with only the `CONVERGENCE-ANOMALY` block and the receipt-literal lines preserved byte-unchanged; AC7's kept-side greps were already correct and are unchanged | 31-spec-5 |


---

## Repair batch (`31-spec-5`, 2026-09-17)

Trigger: `spec-review-31-5` returned `SPEC-REVIEW-FAIL` (failed checks C1, C8,
C10; 11/14 pass) with N31-006 (medium, product), N31-007 (low, product) and
N31-008 (info, product) — one batch over the whole set, repair owner
`design-feature`, user-commissioned as "repair N31-006 + N31-007 + N31-008:
make AC7's two POLICY §4 removal greps discriminate (targets are line-wrapped
— match a single-line fragment), add a criterion for the four skill version:
bumps + README cells, and correct In-scope 5's \"keep only\" framing to name
the authored remainder". This is the spec stage's **third consecutive cycle**
of the window D-31-7 opened at the carrier amendment; it starts under that
explicit user instruction (D-31-7's user-keyed third cycle — the commission is
quoted verbatim above and in `progress.md`). The three spec-stage rows above
were resolved in place with `resolving-artifact-revision: 31-spec-5` — see
SPEC `## Amendments` (`31-spec-5`) and `decisions.md` §"Product repair batch
(design-feature, artifact revision `31-spec-5`)". The plan-stage rows
R31-01/R31-02/R31-03 stay `open` for `plan-feature`'s re-derivation batch
(plan re-cut + `ACCEPTANCE.md` re-freeze once a fresh `SPEC-REVIEW-PASS`
receipt exists).

---

## Re-review (`spec-review-31-6`, 2026-09-17)

Cycle-3 independent re-review of the Product half the `31-spec-5` repair batch
rewrote — the route `spec-review-31-5` named for N31-006/N31-007/N31-008. Fresh
context; this conversation never authored or edited the Product half, its
ledgers, or its acceptance manifest → `contextClean: true`.

Snapshot `95d1551379b7573c2577a63e2be978a11b782d131de5a783b65b81223b681cfa` @
source revision `bccc95fd2debbce4748668f80f1b490c56178990` (`spec-product-v1`
digest `98fa0ae18bd44f27f344854e5e5a5a6b6df9b350f6c2b22aa7e8c599710c1272`,
43682 bytes). Verdict: `spec-review-fail` — 12/14 checks pass; C8 carries two
material `product` rows (N31-009, N31-010) and C9 one open `info` row
(N31-011). N31-006/N31-007/N31-008 are verified repaired at `31-spec-5`;
N31-004/N31-005 stay `resolved` at `31-spec-4`; N31-001/N31-002/N31-003 stay
`resolved` at `31-spec-2`.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| N31-009 | spec | medium | product | 95d1551379b7573c2577a63e2be978a11b782d131de5a783b65b81223b681cfa | AC2's second command cannot verify the requirement it is the only anchor for. `grep -n "medium" packages/agentic-workflow-schema/src/pre-execution-contract.ts` already matches the severity enum literal at line 103 (`"info", "low", "medium", "high", "critical",`) and therefore exits 0 whether or not the finding-record severity description is rewritten. AC2 claims the hit is "the finding-record severity description stating the new line", but the bare command cannot distinguish the enum hit from a description hit; the criterion is labelled `(command)` and is not objective. The first AC2 grep (`the only immaterial`) discriminates for the phrase's removal but proves nothing about the replacement text, so a PR can satisfy AC2 while the schema's field description still does not state material = `medium`+ — the declared requirement "the schema's own prose matches the predicate" ships unfulfilled with every criterion green. | SPEC.md `### Acceptance criteria` AC2; `packages/agentic-workflow-schema/src/pre-execution-contract.ts:103` (severity enum literal, already contains `medium`) and `:459` (finding-record severity description, today "`info` is the only immaterial row."); observed `grep -n "medium" packages/agentic-workflow-schema/src/pre-execution-contract.ts` → 1 hit (line 103), exit 0 at HEAD `bccc95fd`; `grep -rn "the only immaterial" …/src/` → exit 0 (three hits, `:101,:459`) — removal-only | resolved | Resolved at `31-spec-6` (closure completion — reviewed product intent unchanged): AC2's second anchor `grep -n "medium"` (exit 0 via the severity enum literal at `:103` regardless of the description) is replaced by two discriminating greps over the same file — `grep -nE 'material = .medium'` and `grep -n "report-note"` — whose fragments exist only in the rewritten finding-record severity description stating the new line (material = `medium`+; `low` is a report-note); both exit 1 at `bccc95fd` and turn 0 only when the rewrite lands, so a PR cannot satisfy AC2 while the description still reads "`info` is the only immaterial row." The read-verified alternative named by the commission was not taken — a discriminating command anchor keeps AC2 `(command)` and objective. Evidence: `decisions.md` §"Product repair batch (design-feature, artifact revision `31-spec-6`)" | 31-spec-6 |
| N31-010 | spec | medium | product | 95d1551379b7573c2577a63e2be978a11b782d131de5a783b65b81223b681cfa | AC7 declares `design-feature/references/REPAIR.md` §4 among the surfaces losing "the unbounded-cycle sentences" (In-scope 5) but verifies only one of that section's two. `grep -rn "More cycles stay allowed" skills/` covers `REPAIR.md:64-65`; the second unbounded-cycle sentence at `REPAIR.md:71` — "no cycle cap converts its verdict into a dead end." — is matched by no criterion (AC7's other cap grep `no cap converts a verdict into a` is scoped to `POLICY.md` only). A PR that removes the first sentence and leaves the second ships a documented rule still asserting the loop is uncapped while AC7 is green — the same false-green class N31-004/N31-006 closed for the other declared surfaces. | SPEC.md `#### In scope` item 5; SPEC.md `### Acceptance criteria` AC7 (the `skills/` grep + the POLICY-scoped `no cap converts` grep); `skills/design-feature/references/REPAIR.md:64-65,71`; SPEC.md `## Amendments` E5 (the `31-plan-2` design names both REPAIR §4 sentences for replacement); observed `grep -n "no cycle cap converts" skills/design-feature/references/REPAIR.md` → exit 0 with the sentence standing at HEAD `bccc95fd` | resolved | Resolved at `31-spec-6` (closure completion — In-scope 5 already declared REPAIR.md §4 among the shrunk surfaces; only this sentence's criterion was missing): AC7 gains `grep -n "no cycle cap converts" skills/design-feature/references/REPAIR.md` → non-zero, covering §4's second unbounded-cycle sentence at `:71` (fragment unique in the file, exit 0 with the sentence standing at `bccc95fd`, so it matches while the sentence stands and disappears with it — the same discrimination N31-006 gave the other removal greps). Evidence: `decisions.md` §"Product repair batch (design-feature, artifact revision `31-spec-6`)" | 31-spec-6 |
| N31-011 | spec | info | product | 95d1551379b7573c2577a63e2be978a11b782d131de5a783b65b81223b681cfa | The Spec-lint product box gives AC1 an incompatible classification from AC1's own label: the box reads "AC1–AC3, AC5, AC10–AC12 pure commands" while AC1 is labelled `(command + read-verified)`. Every other criterion matches its group (AC2/AC3/AC5/AC10–AC12 pure command; AC4/AC6–AC9/AC13–AC14 command + read-verified), so AC1 is the single misfiled entry. Non-blocking: AC1's own label already carries the read-verified requirement, so the outcome is unaffected. | SPEC.md `## Spec-lint (mechanical — presence checks only)` product box (`AC1–AC3, AC5, AC10–AC12 pure commands; AC4, AC6–AC9, AC13–AC14 command + read-verified where judgement-only`); SPEC.md AC1 label (line 430: `(command + read-verified)`) | resolved | Resolved at `31-spec-6` (mechanical, intent-preserving): the Spec-lint product box re-files AC1 into the group its own label declares — the box now reads "AC2–AC3, AC5, AC10–AC12 pure commands; AC1, AC4, AC6–AC9, AC13–AC14 command + `read-verified` where judgement-only"; no criterion text changed. Evidence: `decisions.md` §"Product repair batch (design-feature, artifact revision `31-spec-6`)" | 31-spec-6 |

The two `medium` rows are acceptance-coverage defects in the criteria the
`31-spec-5` batch added or re-aimed: N31-006's discriminating-fragment repair is
verified correct for the five greps it touched, but the same discrimination
standard exposes AC2's added `grep -n "medium"` anchor and AC7's uncovered
second REPAIR §4 sentence. Both are `product` class → repair owner
`design-feature 31-planning-review-materiality`, one batch over the whole set;
N31-011 (`info`) routes to the same owner without blocking.

---

## Repair batch (`31-spec-6`, 2026-09-17)

Trigger: `spec-review-31-6` returned `SPEC-REVIEW-FAIL` (failed checks C8, C9;
12/14 pass) with N31-009 (medium, product), N31-010 (medium, product) and
N31-011 (info, product) — one batch over the whole set, repair owner
`design-feature`, user-commissioned as "repair N31-009 + N31-010 + N31-011:
make AC2's contract-prose check discriminate (grep the description for a
new-line fragment such as material = \`medium\`/report-note, not the bare word
medium, or move the clause to read-verified), cover REPAIR.md §4's second
sentence in AC7 (grep -n \"no cycle cap converts\"
skills/design-feature/references/REPAIR.md` exits non-zero), and fix the
Spec-lint AC1 classification". This is the spec stage's **fourth consecutive
cycle** of the window D-31-7 opened at the carrier amendment
(`spec-review-31-4` FAIL #1, `spec-review-31-5` FAIL #2, `spec-review-31-6`
FAIL #3); it starts under that explicit user instruction (D-31-7's user-keyed
cycle — the commission is quoted verbatim above and in `progress.md`; REPAIR
§4: a repair responding to a persisted verdict is never a loop defect). The
three spec-stage rows above were resolved in place with
`resolving-artifact-revision: 31-spec-6` — see SPEC `## Amendments`
(`31-spec-6`) and `decisions.md` §"Product repair batch (design-feature,
artifact revision `31-spec-6`)". The plan-stage rows
R31-01/R31-02/R31-03 stay `open` for `plan-feature`'s re-derivation batch
(plan re-cut + `ACCEPTANCE.md` re-freeze once a fresh `SPEC-REVIEW-PASS`
receipt exists).

---

## Re-review (`spec-review-31-7`, 2026-09-17)

Cycle-4 independent re-review of the Product half the `31-spec-6` repair batch
rewrote — the route `spec-review-31-6` named for N31-009/N31-010/N31-011. Fresh
context; this conversation never authored or edited the Product half, its
ledgers, or its acceptance manifest → `contextClean: true`.

Snapshot `c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3` @
source revision `bfdd3b54475007c4d53e87fecbf71ae3893f6809` (`spec-product-v1`
digest `542c5a44830af2fc7e23e1747d76206aca394d4de320b0c9f7ff29fdeb79dd8b`,
44354 bytes); handoff label `31-spec-6`. Verdict: `spec-review-fail` — 12/14
checks pass; C8 carries two `product` rows (N31-012 `medium`, N31-013 `low`).
N31-009/N31-010/N31-011 are verified repaired at `31-spec-6` (AC2's two new
fragments discriminate: both exit 1 today and turn 0 only on the rewrite; AC7
gains the REPAIR.md §4 second-sentence grep; the Spec-lint AC1 refile matches
the label). N31-006/N31-007/N31-008 stay `resolved` at `31-spec-5`;
N31-004/N31-005 at `31-spec-4`; N31-001/N31-002/N31-003 at `31-spec-2`.

The two new rows are the same acceptance-coverage class this unit's review loop
keeps surfacing (N31-004, N31-006, N31-010): In-scope 5 declares a surface
shrunk and no criterion observes that surface's sentence, so a correct-looking
PR can ship the old rule with every AC green. N31-012 names the surface the
half's own §Context calls the defect (`POLICY.md` §3); N31-013 names the one
property of the `reproducer` field the criterion does not test (`bounded`).

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| N31-012 | spec | medium | product | c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3 | AC7 verifies the re-review-for-every-batch mandate in both `OUTPUT.md` files but not in `POLICY.md` §3, the surface In-scope 5 declares shrunk and §Context names as the defect the wording-only route fixes. `POLICY.md`'s opening §3 paragraph still reads "applies **one** evidence-bounded repair batch to the owning artifact(s) before a single re-review of the resulting snapshot" (`:41-42`), and **no** criterion (AC1–AC14) matches that sentence's removal or qualification: AC7's only re-review pattern (`re-review of the new snapshot\|re-reviews the new`) is scoped to the two `OUTPUT.md` files. A PR that adds the wording-only exemption but leaves POLICY §3's unconditional sentence — or removes it inconsistently — passes every AC while the shipped POLICY.md still mandates the re-review the machine no longer requires. Same false-green class as N31-004/N31-006/N31-010. Note the sentence wraps across `:41-42` (`single` ends `:41`), so a full-phrase grep would false-pass exactly as N31-006's did; the criterion needs a single-line fragment such as `grep -n "re-review of the resulting snapshot"` (exits 0 today at `:42`) or a fragment of the intended qualified sentence. | SPEC.md `#### In scope` item 5 (POLICY §3 "lose the sentences the machine now owns … the mandate of a re-review for every batch"); SPEC.md §Context 3rd bullet (quotes §3's sentence as the defect); SPEC.md AC7 (removal grep set); `skills/pre-execution-review/references/POLICY.md:39-42` (the sentence, wrapped `:41-42`); observed `grep -n "re-review of the resulting snapshot" skills/pre-execution-review/references/POLICY.md` → `42:` exit 0; observed `grep -rnE "re-review of the new snapshot\|re-reviews the new" skills/review-spec/references/OUTPUT.md skills/review-plan/references/OUTPUT.md` → the only AC7 re-review anchors, POLICY.md absent from the file list; `skills/review-spec/references/OUTPUT.md:109`; `skills/review-plan/references/OUTPUT.md:118` | resolved | Resolved at `31-spec-7` (closure completion — In-scope 5 already declared POLICY.md §3 among the shrunk surfaces; only this sentence's criterion was missing): AC7 gains `grep -n "re-review of the resulting snapshot" skills/pre-execution-review/references/POLICY.md` → non-zero, covering §3's re-review-for-every-batch mandate. The sentence wraps across `:41-42`, so the anchor is its single second line (`:42`) — unique in the file, exit 0 with the sentence standing at branch head `6f1d024e`, so it matches while the sentence stands and disappears with it (the same line-wrap discrimination N31-006 gave the §4 greps; a full-phrase grep would false-pass exactly as this row warns). The commission's qualified-sentence alternative was not taken: the removal fragment is observable without fixing the replacement's wording. Evidence: `decisions.md` §"Product repair batch (design-feature, artifact revision `31-spec-7`)" | 31-spec-7 |
| N31-013 | spec | low | product | c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3 | AC3 claims the finding record carries the **bounded** `reproducer`, but its command only proves the token appears somewhere in `pre-execution-contract.ts` (`grep -n "reproducer"` exit 0) and its suite clause only proves back-compatibility (a receipt without `reproducer` still validates); no criterion verifies the bound. `VerificationObjectSpec`'s field type makes `maxLength` optional (`verification-contract.ts:51`), and no schema test asserts a bound for `reproducer`, so an unbounded `reproducer` can ship with AC3 green — the receipt's bounded-size contract (the section's whole point) is unverified for the new field. The presence anchor does discriminate at branch head (grep exits 1 today), so the defect is the missing bound check, not a pre-satisfied anchor. | SPEC.md AC3 ("the finding record carries the bounded `reproducer`"); `packages/agentic-workflow-schema/src/verification-contract.ts:51` (`readonly maxLength?: number`); observed `grep -n "reproducer" packages/agentic-workflow-schema/src/pre-execution-contract.ts` → exit 1 at `bfdd3b54` (presence discriminates); observed `grep -rn "reproducer" packages/agentic-workflow-schema/test/*.mjs` → no hits (no bound vector); `packages/agentic-workflow-schema/test/pre-execution-receipt.test.mjs:116` ("full bounded structure" test walks vocabularies, not per-field `maxLength`) | resolved | Resolved at `31-spec-7` (closure completion — In-scope 1 already declares the field bounded; only the bound's criterion was missing): AC3's `bounded` claim becomes command-observable — `grep -A8 'key: "reproducer"' packages/agentic-workflow-schema/src/pre-execution-contract.ts | grep -c "maxLength"` returns ≥ 1 (the field entry declares its size bound; `VerificationFieldSpec.maxLength` is optional at `verification-contract.ts:51`, so a bound-less declaration fails the anchor — observed count 0 at `6f1d024e`) and `grep -rln "reproducer" packages/agentic-workflow-schema/test/` exits zero (a suite vector exercises the field — none exists today); the suite clause names the bound vector (a `reproducer` longer than the declared `maxLength` is refused) beside the existing back-compatibility clause. The commission's read-verified alternative was not taken: command anchors keep AC3 `(command)` and objective. Evidence: `decisions.md` §"Product repair batch (design-feature, artifact revision `31-spec-7`)" | 31-spec-7 |

The `medium` row is the product-side acceptance-coverage defect the `31-spec-6`
batch's AC2/AC7 re-aiming left; the `low` row is the same root cause one field
property deep. Both are `product` class → repair owner
`design-feature 31-planning-review-materiality`, one batch over the whole set,
then `/review-spec 31-planning-review-materiality` re-reviews the new artifact
revision. The plan-stage rows R31-01/R31-02/R31-03 stay `open` for
`plan-feature`.

---

## Repair batch (`31-spec-7`, 2026-09-17)

Trigger: `spec-review-31-7` returned `SPEC-REVIEW-FAIL` (failed check C8;
12/14 pass) with N31-012 (medium, product) and N31-013 (low, product) — one
batch over the whole set, repair owner `design-feature`, user-commissioned as
"repair N31-012 + N31-013: add a POLICY.md §3 criterion to AC7 (single-line
fragment such as grep -n \"re-review of the resulting snapshot\" exits
non-zero, or the intended qualified-sentence fragment) so the declared §3
shrink is observable, and add a bound check for the reproducer field to AC3
(or move 'bounded' to read-verified)". This is the spec stage's **fifth
consecutive cycle** of the window D-31-7 opened at the carrier amendment
(`spec-review-31-4` FAIL #1, `spec-review-31-5` FAIL #2, `spec-review-31-6`
FAIL #3, `spec-review-31-7` FAIL #4); it starts under that explicit user
instruction (D-31-7's user-keyed cycle — the commission is quoted verbatim
above and in `progress.md`; REPAIR §4: a repair responding to a persisted
verdict is never a loop defect). The two spec-stage rows above were resolved
in place with `resolving-artifact-revision: 31-spec-7` — see SPEC
`## Amendments` (`31-spec-7`) and `decisions.md` §"Product repair batch
(design-feature, artifact revision `31-spec-7`)". The plan-stage rows
R31-01/R31-02/R31-03 stay `open` for `plan-feature`'s re-derivation batch
(plan re-cut + `ACCEPTANCE.md` re-freeze once a fresh `SPEC-REVIEW-PASS`
receipt exists).

---

## Re-review (`spec-review-31-8`, 2026-09-17)

Cycle-5 independent re-review of the Product half the `31-spec-7` repair batch
rewrote — the route `spec-review-31-7` named for N31-012/N31-013. Fresh
context; this conversation never authored or edited the Product half, its
ledgers, or its acceptance manifest → `contextClean: true`.

Snapshot `07bdbf673ff2299a76c90df0cb90092f6021f54a9f6861eae535916b43e56794` @
source revision `12ddc2154f6f9a5c88361dee95e38b4726e8e190` (`spec-product-v1`
digest `d4912d0cac1378f01f835a1629df4203ce7ceb3b6cd27fcf4cea2aba4e539153`,
45546 bytes); handoff label `31-spec-7`. Verdict: `spec-review-fail` — 13/14
checks pass; C8 carries one `product` row (N31-014 `medium`). N31-012 and
N31-013 are verified repaired at `31-spec-7` (the POLICY §3 removal grep hits
`POLICY.md:42` today and discriminates; the two AC3 bound anchors return 0 /
exit 1 today and discriminate). N31-009/N31-010/N31-011 stay `resolved` at
`31-spec-6`; N31-006/N31-007/N31-008 at `31-spec-5`; N31-004/N31-005 at
`31-spec-4`; N31-001/N31-002/N31-003 at `31-spec-2`.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| N31-014 | spec | medium | product | 07bdbf673ff2299a76c90df0cb90092f6021f54a9f6861eae535916b43e56794 | In-scope 5 declares `POLICY.md` §4 among the surfaces that lose "the unbounded-cycle sentences", and AC7 claims "the machine-owned sentences leave **every** declared surface", but AC7's removal set covers only two of §4's three unbounded-cycle claims: `grep -n "cycle is allowed when correctness needs it"` (`:61`, the wrapped "Entering a **second** cycle is allowed …" sentence) and `grep -n "no cap converts a verdict into a"` (`:83`, tail of "The anomaly is printed and routed, never a stop, and no cap converts a verdict into a dead end."). §4's third — "a repair turn whose input is a FAIL/NEEDS-DESIGN receipt produces a new snapshot by design, so no cycle cap or anomaly rule may block or end it." (`:81-82`) — is matched by no criterion. After this unit ships the machine refuses a third consecutive unconverged review→repair→re-review cycle (In-scope 3 / E3 state transitions: "a third never starts: the orchestrator refuses and names the human route"; AC5), so §4's `:82` is contradicted by the shipped rule; a PR that rewrites §4's other two sentences and leaves `:82` ships a POLICY.md still asserting no cap may end the loop with every AC green — the same false-green class as N31-004/N31-006/N31-010/N31-012. | SPEC.md `#### In scope` item 5 (POLICY §4 "lose … the unbounded-cycle sentences"); SPEC.md AC7 (the two POLICY §4 greps + the "every declared surface" claim); SPEC.md `### Capability closure` E3 state transitions; SPEC.md AC5; `skills/pre-execution-review/references/POLICY.md:80-84` (the sentence, `:81-82`); observed `grep -n "no cycle cap or anomaly rule" skills/pre-execution-review/references/POLICY.md` → `82:` exit 0 at HEAD `12ddc215`, fragment unique in `skills/`; observed the only AC7 POLICY §4 fragments at `:61` and `:83` (both exit 0 today with the sentences standing) | resolved | Repair batch `31-spec-8` (2026-09-17, closure completion — In-scope 5 already declared §4's unbounded-cycle sentences shrunk; only this sentence's criterion was missing): AC7 gains `grep -n "no cycle cap or anomaly rule" skills/pre-execution-review/references/POLICY.md` → non-zero. The sentence wraps across `:81-82`; the fragment is its single second line (`:82`), unique in the file (`grep -c` → 1) and in `skills/` (1 hit), and exits 0 with the sentence standing at branch head `12ddc215` — it matches while the sentence stands and disappears with it, the same line-wrap discrimination N31-006 gave the first two §4 greps and N31-012 the §3 grep. Evidence rows in `decisions.md` §Evidence rows (repair batch `31-spec-8`, 2026-09-17). | `31-spec-8` |

The `medium` row is the same acceptance-coverage class the unit's review loop
keeps surfacing (N31-004, N31-006, N31-010, N31-012): In-scope 5 declares a
sentence class removed from `POLICY.md` §4 and no criterion observes one of
that section's sentences. Repair owner: `design-feature
31-planning-review-materiality`, one batch over the whole set, then
`/review-spec 31-planning-review-materiality` re-reviews the new artifact
revision. The plan-stage rows R31-01/R31-02/R31-03 stay `open` for
`plan-feature`'s re-derivation batch (plan re-cut + `ACCEPTANCE.md` re-freeze
once a fresh `SPEC-REVIEW-PASS` receipt exists).

---

## Re-review (`spec-review-31-9`, 2026-09-17)

Cycle-6 independent re-review of the Product half the `31-spec-8` repair batch
rewrote — the route `spec-review-31-8` named for N31-014. Fresh context; this
conversation never authored or edited the Product half → `contextClean: true`.
Snapshot `e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507` @
source revision `6084983b99dceccaaab316c89c1f99e7438a28f2` (`spec-product-v1`
digest `9f22563ea1148fac99806ef9847b4e9b48e72e6c5a7e1d1619a5f67540f79474`,
46004 bytes); handoff label `31-spec-8`. Verdict: **`spec-review-pass`** —
14/14 checks pass, **zero findings**, `material open: 0`. N31-014 is verified
repaired at `31-spec-8`: AC7's new `grep -n "no cycle cap or anomaly rule"
skills/pre-execution-review/references/POLICY.md` hits `POLICY.md:82` (exit 0,
fragment unique in `skills/`) with the sentence standing, so it discriminates
removal alongside the `:61` and `:83` greps; the §3 grep (`:42`), both
`CHECKS.md`, both `OUTPUT.md`, `LEDGERS.md` §3 and REPAIR §4 (`:64`/`:71`)
likewise all discriminate. N31-012/N31-013 stay `resolved` at `31-spec-7`;
N31-009/N31-010/N31-011 at `31-spec-6`; N31-006/N31-007/N31-008 at
`31-spec-5`; N31-004/N31-005 at `31-spec-4`; N31-001/N31-002/N31-003 at
`31-spec-2`.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|

No finding row: this review found no gap in the Product half. The plan-stage
rows R31-01/R31-02/R31-03 stay `open` for `plan-feature`'s re-derivation batch
(plan re-cut + `ACCEPTANCE.md` re-freeze), which this PASS receipt now unlocks.

---

## Replan (`31-plan-3`, 2026-09-17)

Trigger: the owner's carrier ruling D-31-6 (`SPEC.md` §Context, `decisions.md`),
executed product-side as the `31-spec-3` carrier amendment and then as eight
spec repair/re-review cycles ending in `spec-review-31-9` (`spec-review-pass`,
14/14, zero findings). The ruling states that the plan set cut as `31-plan-1/2`
is **superseded, never repaired**, because the predicate, the two-cycle cap and
the wording-only route move into code. Repair owner: `plan-feature`
(`class: plan` resolutions; the plan-stage rows, exactly as the `spec-review-31-9`
receipt records: "the plan-stage rows R31-01/R31-02/R31-03 stay `open` for
`plan-feature`'s re-derivation batch (plan re-cut + `ACCEPTANCE.md` re-freeze),
which this PASS receipt now unlocks").

What the re-cut did, in one batch:

- Re-cut the Engineering half (`SPEC.md`), `PLAN.md`, `TASKS.md`, `testing.md`,
  `known-issues.md` and `architecture-notes.md` against the code carrier, with
  five phases (P1 schema finding-record materiality → P2 transition-decider cap
  refusal → P3 snapshot wording-only route → P4 skill-reference prose shrink →
  P5 Hardening & PR), all five passing the eight-box phase-lint
  (`fingerprint: 7ae7a09036d9fafc8cffbbc735ec06f9dc8a03d632ca2d1141785ac555e8bce7`).
- Re-froze `ACCEPTANCE.md` from AC1…AC14 with the code-anchored validators (blob
  `3d7e7c9ee92314261e5529815c76b373e8ca2745`) and re-cut
  `planning-evidence.md` (PE-001…PE-023) and `planning-obligations.md`
  (O1…O15, one phase and one task each).
- Resolved R31-01 (stale Product parent), R31-02 (a three-phase obligation row)
  and R31-03 (the scope walk missing the unit's own records) in place, per the
  table above, and recorded engineering decisions E-D31-8…E-D31-14 (E-D31-5
  superseded with its carrier).
- Rotated the artifact revision label to `31-plan-3`; the plan receipt
  `plan-review-31-2` (FAIL, and stale against the superseded set) is invalidated
  by design — only a fresh `/review-plan` restores currency.

Every spec-stage row stays resolved where it was recorded: N31-001/N31-002 at
`31-spec-2`, N31-003 at `31-spec-2`, N31-004/N31-005 at `31-spec-4`,
N31-006/N31-007/N31-008 at `31-spec-5`, N31-009/N31-010/N31-011 at `31-spec-6`,
N31-012/N31-013 at `31-spec-7`, N31-014 at `31-spec-8`. No row is left `open`
for any class at the time of this write.

---

## Re-review (`spec-review-31-10`, 2026-09-17)

Cycle-1 independent re-review (D-31-7: the count resets on `spec-review-31-9`'s
PASS) of the Product half the `31-spec-9` amendment rewrote — the amendment
widened the `## Scope` **Code carriers** allowed-set group for the open P31-06
row. Fresh context; this conversation never authored or edited the Product half →
`contextClean: true`. Snapshot
`b3f1c415036ba9679f280dc4222e0cd9df0129bfbcbc35952316f7b108761df9` @ source
revision `f0042c6210702ba2c884c960137e14135057266f` (`spec-product-v1` digest
`3dba9a8fdd7c16244ed22bbaf4adf9f229a48c85824c1f9df5576377210e118b`, 46282
bytes); handoff label `31-spec-9`. Verdict: **`spec-review-fail`** — 12/14 checks
pass; C9 (internal contradiction) and C10 (repository contradiction) carry the
one material `product` row below. N31-001…N31-014 stay resolved at their
recorded revisions (`31-spec-2`…`31-spec-8`); P31-01…P31-05 stay resolved at
`31-plan-4`; P31-06 stays `open` for `plan-feature`'s re-derivation.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| N31-015 | spec | medium | product | b3f1c415036ba9679f280dc4222e0cd9df0129bfbcbc35952316f7b108761df9 | AC13's declared **code-carrier** group still omits two paths the implementation must edit. AC4 requires `grep -rn "wording-only" scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` to exit zero, and both files carry **zero** `wording-only` hits at this head, so the PR diff must edit them; `PLAN.md` P3 extends both suites with the wording-only vectors. Neither path is in the code-carrier group or in the other two declared groups, so AC13's mechanical anchor (`git diff main --name-only` minus the three excluded paths must list only the first two groups' paths) would report both as scope violations. AC4 and AC13 are therefore mutually unsatisfiable — the same root cause P31-06 named, incompletely repaired by the `31-spec-9` amendment (which added the three paths P31-06 named but not these two). | `SPEC.md` `## Scope` code-carrier group (`:201-204`) vs AC4 (`:467-473`); `PLAN.md:107-108` ("Extend `scripts/pre-execution-attribution.test.mjs`…" / "Extend `scripts/pre-execution-sensor.test.mjs`…"); observed `grep -rn "wording-only" scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` → no match at `f0042c62`; P31-06 row (same class, repaired at `31-spec-9`) | resolved | User-commissioned Product-half patch `31-spec-10` (owner instruction, POLICY §5): the code-carrier group gains `scripts/pre-execution-attribution.test.mjs` and `scripts/pre-execution-sensor.test.mjs` (`SPEC.md` `## Amendments` `31-spec-10`; `decisions.md` D-31-10), so AC4 and AC13 stop contradicting. The owner refused a further `design-feature` cycle and amended the governing SPEC directly. | `31-spec-10` |

C9's other sections are consistent; the single contradiction is AC4's required
edits versus AC13's declared allowed set. C10's other repository claims hold:
the three paths the amendment added exist at `f0042c62`
(`scripts/pre-execution-contract.mjs`, `scripts/workflow-status.mjs`,
`scripts/workflow-status-pre-execution.test.mjs`).

Route: `class: product` → repair owner `design-feature
31-planning-review-materiality` — one batch adding
`scripts/pre-execution-attribution.test.mjs` and
`scripts/pre-execution-sensor.test.mjs` to the code-carrier group, then
`/review-spec` re-reviews the new artifact revision.

---

## Re-derivation (`31-plan-5`, 2026-09-17)

Trigger: the Product half moved after the plan's parent `spec-review-31-9` — the
owner-commissioned patches `31-spec-9` (adding the three code-carrier paths this
ledger's P31-06 named) and `31-spec-10` (adding the two suites `spec-review-31-10`'s
N31-015 named) — and `spec-review-31-11` returned `spec-review-pass` (14/14 checks,
zero findings) on the patched bytes. The plan descended from a stale parent and
still carried the one open row P31-06, so `plan-feature` re-derived it as artifact
revision `31-plan-5`.

What changed: the plan snapshot's parent binds `spec-review-31-11` @ `dd09372a…`;
**P31-06 flips to `resolved`** above (its defect — AC13's code-carrier group
lagging the plan's designed edits — no longer exists once the Product half
enumerates them); the `P31-04` prose slips in `decisions.md` E-D31-18 and
`PLAN.md`/`TASKS.md` P4 task 8 are corrected to the phase-lint-valid allocation
(row in P4), and `known-issues.md` gains the `normative-drift` window declaration
its own text already claimed. No phase, task or validator changed: both Product
patches were enumeration-only.

Cycle accounting (D-31-7): the plan-stage window `plan-review-31-1` opened has
three reviews — `plan-review-31-1` FAIL (#1), `plan-review-31-2` FAIL (#2) and
`plan-review-31-3` FAIL (#3, commissioned by the owner under D-31-6). The
`plan-review-31-3` receipt's `CONVERGENCE-ANOMALY` block stands, byte-unchanged.
This re-derivation is not a blind re-review of unchanged bytes: the reviewed
Product parent moved twice under it, so `31-plan-5` is a new artifact revision the
Product review the owner commissioned owes, and the `/review-plan` it hands off to
is the window's next cycle, started from the explicit user instruction that
invoked `plan-feature` here rather than from an automatic loop.

Route: a repaired plan is not an approved plan —
`/review-plan 31-planning-review-materiality`.

## Re-review (`plan-review-31-4`, 2026-09-17)

Context-clean reviewer turn over plan snapshot
`b17009ea2719f3d81764d04c1c7831c1ada78b77af8c1d2b07f674e3c131d4be` (artifact
revision `31-plan-5`), bound to Product parent `spec-review-31-11` @ `dd09372a…`.
Verdict: `plan-review-fail` — the plan is decidable but P1's own done-when cannot
pass and the phase cut is stated two ways. No reviewed plan artifact was modified
by the turn. The window `plan-review-31-1` opened is now at its **fourth** review;
the `CONVERGENCE-ANOMALY` block in `progress.md` records it.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| P31-07 | plan | high | plan | b17009ea2719f3d81764d04c1c7831c1ada78b77af8c1d2b07f674e3c131d4be | P1's done-when is unreachable as the task list is written. P1's done-when is `(cd packages/agentic-workflow-schema && bun run test && bun run check:pre-execution-schemas)` → exit 0, and `bun run test` is `tsc && tsc -p tsconfig.test.json && bun test test/*.test.mjs`. Two of those tests hard-pin the package version to the current value: `test/release-contract.test.mjs:23-28` (`test("AC8 read-verified: package version is 4.2.0")` → `assert.equal(pkg.version, "4.2.0")`) and `test/verification-gates.test.mjs:117` (`assert.equal(manifest.version, "4.2.0")`). P1's task list bumps `package.json` to 4.3.0 and never updates either pin, so both assertions fail and the phase cannot commit. The repository's own precedent is explicit: feature 59's repair updated both pins "in the same commit as the bump" (`docs/features/59-executable-continuations/decisions.md:255-256`). | PLAN.md P1 task 7 + P1 Done-when; TASKS.md P1 task 7; `packages/agentic-workflow-schema/package.json:3` (`"version": "4.2.0"`), `:62` (`"test": "tsc && tsc -p tsconfig.test.json && bun test test/*.test.mjs"`); `packages/agentic-workflow-schema/test/release-contract.test.mjs:23-28`; `packages/agentic-workflow-schema/test/verification-gates.test.mjs:115-118`; `docs/features/59-executable-continuations/decisions.md:255-256`; observed: `bun test test/release-contract.test.mjs test/verification-gates.test.mjs test/pre-execution-docs.test.mjs` → 32 pass / 0 fail at `2300b0d7` (baseline green, so the bump is what reddens it); `ACCEPTANCE.md` AC9/AC10 | resolved | Repair batch `31-plan-6` (2026-09-17, `plan-feature`): P1's bump task now moves both version pins in the same commit — `test/release-contract.test.mjs` (`assert.equal(pkg.version, "4.2.0")`) and `test/verification-gates.test.mjs` (`assert.equal(manifest.version, "4.2.0")`) — so the phase's own done-when (`bun run test`) can commit; the baseline was re-observed green (32 pass / 0 fail) at `6e2a804f` (E-D31-22, PE-033). | `31-plan-6` |
| P31-08 | plan | high | plan | b17009ea2719f3d81764d04c1c7831c1ada78b77af8c1d2b07f674e3c131d4be | P1's done-when is unreachable for a second, independent reason: the docs half of the same package suite requires every published limit to be documented in the package README. `test/pre-execution-docs.test.mjs` `SECTIONS = { "README.md": featureSection(README_EN) }` and the test `AC8: every published limit is documented with its exact number` iterates `Object.entries(schema.PRE_EXECUTION_LIMITS)` and asserts the section includes both the key and its value. P1 adds `reproducerChars: 1024` to `PRE_EXECUTION_LIMITS` and names no task that adds `reproducerChars` to the README's `### Published limits` block (`packages/agentic-workflow-schema/README.md:411-424`, inside the parsed `## Evidence-Grounded Pre-Execution Review (feature 28)` section), so the walk fails with `README.md omits the reproducerChars limit`. The edit cannot ride P4 either — `layerForTarget` maps `packages/**` to `config/infra`, and P4's layer is `docs` (phase-lint box 2). | PLAN.md P1 tasks 1-2 (`PRE_EXECUTION_LIMITS.reproducerChars`) + P1 Done-when; TASKS.md P1 tasks 2, 8; `packages/agentic-workflow-schema/test/pre-execution-docs.test.mjs:26-34` (`SECTIONS`), `:131-137` (the published-limit walk); `packages/agentic-workflow-schema/README.md:248` (`## … Pre-Execution Review (feature 28)`), `:411-424` (`### Published limits`); `scripts/phase-lint.mjs:232-238` (`layerForTarget`); observed `bun run test` → 707 pass / 0 fail at `2300b0d7` (baseline green) | resolved | Repair batch `31-plan-6`: a new P1 task publishes `reproducerChars 1024` in the `### Published limits` block of `packages/agentic-workflow-schema/README.md` — the `packages/**` (`config/infra`) home the published-limit walk reads — so `test/pre-execution-docs.test.mjs` finds the key and its value (E-D31-22, PE-034). | `31-plan-6` |
| P31-09 | plan | medium | plan | b17009ea2719f3d81764d04c1c7831c1ada78b77af8c1d2b07f674e3c131d4be | The reviewed plan set states the schema package's release-record phase two ways. `SPEC.md:960-963` (Engineering half, `E9 — Release records`) says the `CHANGELOG.md` companion-table row "lands **in the same phase as the bump (P1)**", while `PLAN.md` P1/P4, `TASKS.md` P1/P4, the same SPEC's `### Open questions / risks` (`:1163-1166`, "the schema package's `CHANGELOG.md` row stays in the `docs` P4 — it cannot live in the `config/infra` P1") and decision `E-D31-18` say P4 with the `normative-drift` window declared. An executor following E9 places a `docs` target in the `config/infra` P1 and fails phase-lint box 2; an executor following PLAN/TASKS leaves E9 false. The `31-plan-5` re-derivation corrected `E-D31-18`/`known-issues.md` §12 but left E9 stale, so the contradiction survives inside one bound file. | `SPEC.md:960-963` vs `SPEC.md:1163-1166`; `PLAN.md` P1 ("The package's own release record is owned by P4…") and P4 task 8; `TASKS.md` P1 header + P4 task 8; `docs/features/31-planning-review-materiality/known-issues.md` §12; `decisions.md` `E-D31-18`; `scripts/phase-lint.mjs:232-238`; `scripts/normative-drift.test.mjs:708-715` | resolved | Repair batch `31-plan-6`: E9 now states the P4 allocation (the phase-lint-valid one the P31-04/E-D31-18 resolution chose), names the two version pins and the published-limit block as the bump's own P1 surfaces, and the SPEC `### Phases` P1 done-when stays package-local with the declared window — one reading across E9, PLAN/TASKS P1/P4, `known-issues.md` §12 and E-D31-18 (E-D31-23). | `31-plan-6` |
| P31-10 | plan | low | plan | b17009ea2719f3d81764d04c1c7831c1ada78b77af8c1d2b07f674e3c131d4be | P4's POLICY §3 instruction keeps the exact literal the frozen acceptance deletes. `ACCEPTANCE.md` AC7 requires `grep -n "re-review of the resulting snapshot" skills/pre-execution-review/references/POLICY.md` to exit **non-zero** at the PR head (the phrase sits wholly on `POLICY.md:42` and is the removal anchor the N31-012 repair chose), while `PLAN.md`/`TASKS.md` P4 task 3 say "keep the single re-review of the resulting snapshot as the default batch consequence". Done literally, the task re-introduces the phrase and AC7 fails; done as intended, the task text should have said the default survives with different wording. P4's own done-when (`bun scripts/check-skill-context.mjs && bun test scripts/normative-drift.test.mjs && grep -n "third cycle never" …`) never runs the AC7 removal greps, so the collision is invisible until the P5 read-verified walk — the false-green shape the F02/P31-03 rows named. | `ACCEPTANCE.md` AC7 (the fourth removal grep) + `## Commands`; `PLAN.md` P4 task 3; `TASKS.md` P4 task 3; `skills/pre-execution-review/references/POLICY.md:39-42`; observed `grep -n "re-review of the resulting snapshot" skills/pre-execution-review/references/POLICY.md` → `42:` exit 0 at `2300b0d7` (the fragment discriminates); `planning-findings.md` N31-012 (the anchor's provenance); PLAN.md P4 Done-when | resolved | Repair batch `31-plan-6`: P4's `POLICY.md` §3 task no longer recites the literal AC7 deletes; it names the removal grep and states the default batch consequence — one re-review of the freshly rotated snapshot — without reproducing the deleted phrase (E-D31-24, PE-036). | `31-plan-6` |
| P31-11 | plan | info | plan | b17009ea2719f3d81764d04c1c7831c1ada78b77af8c1d2b07f674e3c131d4be | P4's CHECKS.md instruction is worded wider than the frozen gate it must keep green. `PLAN.md`/`TASKS.md` P4 task 2 say to "rewrite the findings-assembly paragraph" in `skills/review-spec/references/CHECKS.md` and `skills/review-plan/references/CHECKS.md`, promising only that "each closed severity vocabulary list" stays byte-identical; but `scripts/pre-execution-quality.test.mjs:326` (AC10's pack) asserts `specChecks` matches `/a \`PASS\` may not carry an open or\nunverified material row/` — a sentence inside that same paragraph, pinned with its line break. A paragraph re-wrap reddens the gate at P5. Non-blocking: the break is caught by AC10's gate at the PR head, and the targeted replacement P4 describes (change the materiality clause, add two sentences) need not touch the pinned clause. | `ACCEPTANCE.md` AC10; `PLAN.md` P4 task 2; `TASKS.md` P4 task 2; `skills/review-spec/references/CHECKS.md:98-105` (the paragraph); `scripts/pre-execution-quality.test.mjs:319-327` (the pin); SPEC.md `### Architecture impact` byte-stability list | resolved | Repair batch `31-plan-6`: P4's CHECKS task now names the sentence `scripts/pre-execution-quality.test.mjs` pins verbatim — the `a \`PASS\` may not carry an open` line and the `unverified material row` line — and requires both the words and the break point to stay put, so the rewrite cannot re-wrap the pinned paragraph into a red AC10 (E-D31-24, PE-035). | `31-plan-6` |

---

## Repair batch (`31-plan-6`, 2026-09-17)

Trigger: `plan-review-31-4` returned `PLAN-REVIEW-FAIL` (snapshot `b17009ea…`,
artifact revision `31-plan-5`) with the five plan-class rows above — P31-07/P31-08
(high), P31-09 (medium), P31-10 (low), P31-11 (info) — and no product row. Route:
`plan-feature 31-planning-review-materiality`, one batch over the whole set (the
`CONVERGENCE-ANOMALY` block `plan-review-31-4` printed names the same). No Product
byte moved (the `spec-product-v1` projection recomputes to `e9ce9abf…` at 46362
bytes, with the three context digests unmoved), so the plan's parent stays
`spec-review-31-11` @ `dd09372a…`. The five rows flip to `resolved` with
`31-plan-6` as their resolving artifact revision; the two `info` product-class rows
N31-001/N31-002 keep their `design-feature` owner.

Router disclosure (recorded, never silently worked around):
`node scripts/unit-route.mjs 31-planning-review-materiality` answers
`route: execute` (`open-rows: 0`) because it reads the unit's `review-findings.md`
— the code-side fix-now fold ledger, which this unit does not have — and is blind
to the stage-aware `planning-findings.md` where plan-class rows live. The plan
review is nevertheless a FAIL with four open material rows, and `execute-phase`'s
own pre-execution gate refuses these bytes, so the commissioned batch followed the
verdict's named repair owner instead of the router's line — the same reported
`unit-route` family gap the `31-plan-2` batch disclosed (its `replan` route is
unreachable for plan-class rows).

---

## Re-review (`plan-review-31-5`, 2026-09-18)

Cycle-5 independent reviewer turn over plan snapshot
`255d099b7b1fc546b3677a5a796aebc0ee45c3d0d73ff31d5db3aab3616472c1` (artifact
revision `31-plan-6` @ `ef0fe325`), bound to Product parent `spec-review-31-11`
@ `dd09372a…`. Fresh context; this conversation never authored or edited a plan
artifact → `contextClean: true`. Verdict: **`plan-review-pass`** — L1–L6 and
P1–P12 all pass; the five rows `plan-review-31-4` opened (P31-07…P31-11) are
verified resolved at `31-plan-6`. Two **immaterial** (`info`) rows are recorded
below for traceability; neither blocks the verdict (material open: 0) and neither
changes a phase gate, a validator, or a required outcome.

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| P31-12 | plan | info | plan | 255d099b7b1fc546b3677a5a796aebc0ee45c3d0d73ff31d5db3aab3616472c1 | The `### Phases` **P4** summary done-when in the SPEC omits `bun test scripts/normative-drift.test.mjs`, while `PLAN.md`/`TASKS.md` P4 done-whens carry it, the same SPEC's `### Phases` P1 summary (`:1106-1108`) says the `docs` P4 closes the declared `normative-drift` window, and the `31-plan-4` amendment (`:1542`) states "P4's done-when now closes it by running `bun test scripts/normative-drift.test.mjs`". Non-blocking: the SPEC designates `PLAN.md` the canonical phase list ("the canonical phase list the linter reads is `PLAN.md`"), `PLAN.md` P4 and `TASKS.md` P4 both carry the gate, and AC10's PR-head pack runs `normative-drift` regardless — so no phase's actual gate is lost. | `SPEC.md:1128-1131` (the P4 summary done-when) vs `PLAN.md:154`, `TASKS.md:55`, `SPEC.md:1106-1108`, `SPEC.md:1542`; `bun scripts/phase-lint.mjs docs/features/31-planning-review-materiality/PLAN.md` → PASS (canonical list unaffected) | open | — (immaterial duplicate-summary drift; `PLAN.md` is authoritative and correct) | — |
| P31-13 | plan | info | plan | 255d099b7b1fc546b3677a5a796aebc0ee45c3d0d73ff31d5db3aab3616472c1 | `TASKS.md` P1 carries nine `- [ ]` checklist items while `PLAN.md` P1 carries the canonical eight that `known-issues.md` §13 and `E-D31-25` record as the phase-contract box-3 ceiling; the ninth item is a finer-grained split of the `reproducerChars` limit (folded into task 1 of `PLAN.md` P1), not a ninth requirement. Non-blocking: `phase-lint` reads `PLAN.md`, which is at 8/8, so the phase shape is unaffected. | `PLAN.md` P1 (8 `- [ ]`), `TASKS.md` P1 (9 `- [ ]`); `known-issues.md` §13; `decisions.md` `E-D31-25`; observed `bun scripts/phase-lint.mjs …` → `P1:config/infra:8:…` | open | — (immaterial checklist-granularity drift; the canonical count is 8) | — |

Environment note (not a finding): `bun test`'s parallel file execution makes two
5 s harness timeouts in `scripts/ledger-provenance.test.mjs` observable under load
(this turn saw 9 failures across the AC10 pack under load, 0 in isolation); no
file this unit edits is read by that suite, and the receipt's notes carry the
re-run instruction. Recorded so a later executor does not read a loaded pack as a
real regression.
