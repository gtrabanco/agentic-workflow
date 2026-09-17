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
| R31-01 | plan | high | product | e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a | The Product half moved after `spec-review-31-1`, so this plan descends from a stale Product receipt. The `31-plan-2` repair batch edited Product-half bytes — SPEC `#### In scope` (the derived-surfaces paragraph and item 5), three Integration-closure rows, `### Acceptance criteria` (AC1–AC4, AC6–AC9, AC11, AC12 reworded/anchored and AC14 added), `### Tooling`, and the Spec-lint product box — and re-froze `ACCEPTANCE.md`. The `spec-product-v1` projection digest is now `c09b28aa82002cb075b62aa07b0b821fb6a1be8c1a8ce999cd358daa5d0960f2` (31130 chars) while the receipt bound `14d23401222e9d8ab9090ac917cee3268bfb90fdcc7551f3ada9616328a094d9` (28554 chars). The plan snapshot still binds `--parent 735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a`, whose Product bytes no longer exist on disk. | `git diff cf238040 a3012f86 -- docs/features/31-planning-review-materiality/SPEC.md` (Product-half hunks @@ -116, -133, -255, -332, -356, -438); `selectSpecProduct` digest old `14d2340…` vs now `c09b28aa…`; `docs/features/31-planning-review-materiality/SPEC.md` Engineering-half claim of a fresh `verify --stage spec`; `node scripts/pre-execution-snapshot.mjs verify --stage spec --unit 31-planning-review-materiality` → `fresh: false / stale-source-revision`, `changedPaths: [SPEC.md]` | open | — | — |
| R31-02 | plan | medium | plan | e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a | Obligation `O15` names three phases and three tasks in one row (`P1 (table shell + floor 4), P2 (floor 8), P3 (floor 9)`), violating the frozen ledger's row contract "exactly one phase and one task; a row needing two phases means the phase cut is wrong". The ledger's own `## Closure` restates the span: "AC14→O15 (P1/P2/P3, run at the PR head)". The AC14 validator runs only at the PR head, so the row's phase mapping is also mis-targeted. | `docs/features/31-planning-review-materiality/planning-obligations.md` O15 row + `## Closure`; `skills/pre-execution-review/references/LEDGERS.md` §2 `phase` / `task` cell contract | open | — | — |
| R31-03 | plan | info | plan | e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a | AC8's scope guard reads a whole-diff `git diff main --stat` "lists only the In-scope surfaces … and nothing else", but the branch diff necessarily also carries this unit's own planning records (`docs/features/31-planning-review-materiality/*`) and the `docs/features/ROADMAP.md` row update; neither is enumerated in In-scope nor in the declared derived-surface set (E-D31-7). P4's read-verified walk (AC8/O8) can therefore report the unit's own records as scope violations — the same class as F03, repaired only for the bump/mirror surfaces. | `docs/features/31-planning-review-materiality/ACCEPTANCE.md` AC8; SPEC `#### In scope` + `## Amendments` E-D31-7; `PLAN.md`/`TASKS.md` P4 task 5; `git diff --stat main...HEAD` (13 files, incl. the unit dir and `docs/features/ROADMAP.md`) | open | — | — |

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
| N31-012 | spec | medium | product | c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3 | AC7 verifies the re-review-for-every-batch mandate in both `OUTPUT.md` files but not in `POLICY.md` §3, the surface In-scope 5 declares shrunk and §Context names as the defect the wording-only route fixes. `POLICY.md`'s opening §3 paragraph still reads "applies **one** evidence-bounded repair batch to the owning artifact(s) before a single re-review of the resulting snapshot" (`:41-42`), and **no** criterion (AC1–AC14) matches that sentence's removal or qualification: AC7's only re-review pattern (`re-review of the new snapshot\|re-reviews the new`) is scoped to the two `OUTPUT.md` files. A PR that adds the wording-only exemption but leaves POLICY §3's unconditional sentence — or removes it inconsistently — passes every AC while the shipped POLICY.md still mandates the re-review the machine no longer requires. Same false-green class as N31-004/N31-006/N31-010. Note the sentence wraps across `:41-42` (`single` ends `:41`), so a full-phrase grep would false-pass exactly as N31-006's did; the criterion needs a single-line fragment such as `grep -n "re-review of the resulting snapshot"` (exits 0 today at `:42`) or a fragment of the intended qualified sentence. | SPEC.md `#### In scope` item 5 (POLICY §3 "lose the sentences the machine now owns … the mandate of a re-review for every batch"); SPEC.md §Context 3rd bullet (quotes §3's sentence as the defect); SPEC.md AC7 (removal grep set); `skills/pre-execution-review/references/POLICY.md:39-42` (the sentence, wrapped `:41-42`); observed `grep -n "re-review of the resulting snapshot" skills/pre-execution-review/references/POLICY.md` → `42:` exit 0; observed `grep -rnE "re-review of the new snapshot\|re-reviews the new" skills/review-spec/references/OUTPUT.md skills/review-plan/references/OUTPUT.md` → the only AC7 re-review anchors, POLICY.md absent from the file list; `skills/review-spec/references/OUTPUT.md:109`; `skills/review-plan/references/OUTPUT.md:118` | open | — | — |
| N31-013 | spec | low | product | c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3 | AC3 claims the finding record carries the **bounded** `reproducer`, but its command only proves the token appears somewhere in `pre-execution-contract.ts` (`grep -n "reproducer"` exit 0) and its suite clause only proves back-compatibility (a receipt without `reproducer` still validates); no criterion verifies the bound. `VerificationObjectSpec`'s field type makes `maxLength` optional (`verification-contract.ts:51`), and no schema test asserts a bound for `reproducer`, so an unbounded `reproducer` can ship with AC3 green — the receipt's bounded-size contract (the section's whole point) is unverified for the new field. The presence anchor does discriminate at branch head (grep exits 1 today), so the defect is the missing bound check, not a pre-satisfied anchor. | SPEC.md AC3 ("the finding record carries the bounded `reproducer`"); `packages/agentic-workflow-schema/src/verification-contract.ts:51` (`readonly maxLength?: number`); observed `grep -n "reproducer" packages/agentic-workflow-schema/src/pre-execution-contract.ts` → exit 1 at `bfdd3b54` (presence discriminates); observed `grep -rn "reproducer" packages/agentic-workflow-schema/test/*.mjs` → no hits (no bound vector); `packages/agentic-workflow-schema/test/pre-execution-receipt.test.mjs:116` ("full bounded structure" test walks vocabularies, not per-field `maxLength`) | open | — | — |

The `medium` row is the product-side acceptance-coverage defect the `31-spec-6`
batch's AC2/AC7 re-aiming left; the `low` row is the same root cause one field
property deep. Both are `product` class → repair owner
`design-feature 31-planning-review-materiality`, one batch over the whole set,
then `/review-spec 31-planning-review-materiality` re-reviews the new artifact
revision. The plan-stage rows R31-01/R31-02/R31-03 stay `open` for
`plan-feature`.
