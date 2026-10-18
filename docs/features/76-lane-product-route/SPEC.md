# 76 — lane-product-route

> Unit doc for issue #293 (combined #246 + #291): the machine `product` route
> for product-owned review findings. Axis B (#291, close-out receipt/hand-offs)
> already landed with feature 73 (PR #297) and is verified here, not rebuilt.

## Objective

Give product-owned review findings a machine route. Today `routeOfRow` falls
through to `fold` for any row that is not plan- or decision-routed, so every
deterministic consumer (`fold-findings`, `triage-issue`, the printed hand-off)
mis-routes a `fix-now` row whose `Route` cell begins `product owner` — the fold
cycle then attempts to repair authority, which `pre-execution-review/POLICY.md`
§4 forbids. This unit adds the `product` route to `scripts/unit-route.mjs`,
teaches the freeze-batch table, the triage verdict vocabulary and the
`review-change` close-out hand-off about it, and verifies the already-landed
Axis B close-out contract of issue #293.

## Why

`review-implementation` publishes owning stage `product` and `review-change`
persists such a row with `class: fix-now` and a `Route` cell beginning
`product owner — …`. No machine consumer reads that cell:
`DECISION_ROUTE` (`scripts/unit-route.mjs:40`) matches only decision vocabulary,
there is no `PRODUCT_ROUTE`, and `routeOfRow` falls through to `"fold"`.
Live reproduction on `main` @ `c6b3201e`:

```text
$ node scripts/unit-route.mjs 31-planning-review-materiality
route: fold
next: /fold-findings
rows: F9 F10        ← both product-owned
```

The product repair resource (`design-feature`'s `REPAIR.md`) was retired with
feature 61; per issue #293's non-goals the repair route lands in the lane
(`/unit-lane <unit>`), not in a resurrected skill. Issue #293's Axis B
(receipt, ordered `/audit-pr`, per-phase `execute-phase` hand-offs,
`budget_tier` consumption) closed with feature 73 (PR #297, merged
2026-10-17); its ACs are verified as evidence rows here.

## User outcome

A reviewer (or the orchestrator) who runs `node scripts/unit-route.mjs <unit>`
on a unit with product-owned findings sees `route: product` and an executable
lane hand-off instead of `route: fold` → `/fold-findings`; `fold-findings`
never takes a product-owned row into a fold batch; `triage-issue` can conclude
a product verdict; the `review-change` close-out names a hand-off that runs as
typed.

## Acceptance criteria

From issue #293. AC3–AC7 are already satisfied by feature 73; they are
verification-only here (evidence re-run, no re-implementation).

1. `node scripts/unit-route.mjs 31-planning-review-materiality` returns a
   product route for `F9`/`F10` (not `fold`), and its `next` names the
   product-repair hand-off (`/unit-lane 31-planning-review-materiality`).
   FAIL if it still prints `route: fold`.
2. A `fix-now` row whose `Route` begins `product owner` never folds:
   `FOLD_PROCESS.md`'s freeze-batch table states its class explicitly and
   freezes the batch (never folds, never flips `folded: yes`).
3. `node scripts/unit-route.mjs <unit>` prints `/execute-phase <unit> P<k>`
   naming exactly one phase, never the bare slug. *(landed with 73 — verify)*
4. `unit-lane`'s review step emits a `review-receipt.mjs`-verifiable receipt;
   `bun scripts/review-receipt.mjs verify --pr <N>` is not
   `missing-review-receipt` after a lane review step. *(landed with 73 —
   verify the wiring: REVIEW.md instructs emit + verify)*
5. `budget_tier` from `scripts/catalog.json` is consumed by the router, with a
   test pinning it. *(landed with 73 — verify test exists)*
6. The closing `→ Next:` block orders `/audit-pr` as a stage, not a
   third-level bullet. *(landed with 73 — verify in `skills/unit-lane/SKILL.md`)*
7. `grep -c "execute-phase" skills/unit-lane/SKILL.md` is non-zero and the
   hand-off names a phase. *(landed with 73 — verify)*
8. No existing test is weakened to pass; new pins added for each of the above.

## Non-goals

- No new schema/envelope surface (issue #293).
- No change to `audit-pr`'s verdict vocabulary or the review pack's axes.
- No re-introduction of `design-feature` — the product repair route lands in
  the lane (`/unit-lane <unit>`).
- No tier-*selection* policy change (that is #201/#260).
- Findings discovered during implementation never expand scope.

## Future

none

## Future cost

- `unit-route.mjs`'s `ROUTES`/`routeOfRow` gain `product`: future owning-stage
  vocabulary changes must update the regexes and the route branch together
  (binds `scripts/unit-route.mjs` maintainers and `review-implementation`'s
  CLASSIFY.md owners).

## Applicable tests

`node --test scripts/unit-route.test.mjs`, `node --test
scripts/review-loop-discipline.test.mjs`, `node --test
scripts/next-recommendations.test.mjs`, `node --test
scripts/normative-drift.test.mjs`, plus the root suites
(`node --test scripts/*.test.mjs`).

## Known pre-existing issues

- `31-planning-review-materiality`'s F9/F10 are product-owned and unresolved on
  `main` — affects this unit only as AC1's live fixture; resolving them is the
  lane run this router hands off to, not this unit's work.

## Tasks

- P1 — Pins first: add `unit-route.test.mjs` cases for the product route (a
  product-owned row routes `product`, never `fold`; the `next` names
  `/unit-lane <unit>`; product loses to a co-resident replan row; a plain
  fix-now row still folds) and a `review-loop-discipline.test.mjs` pin that
  `FOLD_PROCESS.md`'s freeze-batch table names the product-owner class.
  (validator: `node --test scripts/unit-route.test.mjs scripts/review-loop-discipline.test.mjs` — new pins red before P2)
  Relevant files: scripts/unit-route.test.mjs, scripts/review-loop-discipline.test.mjs
- P2 — Router: add `PRODUCT_ROUTE` vocabulary + `product` to `ROUTES`, the
  `routeOfRow` branch before the `fold` fall-through, the route priority branch
  with the lane hand-off command, and read-set/base handling.
  (validator: `node --test scripts/unit-route.test.mjs` exits 0 and AC1's live command prints `route: product`)
  Relevant files: scripts/unit-route.mjs
- P3 — Consumers: `FOLD_PROCESS.md` freeze-batch row for a product-owned row
  (class stated, batch frozen); `triage-issue`'s `REVIEW_FINDING_PROCESS.md`
  gains the product verdict and routes it through the router;
  `review-change`'s `PERSIST_AND_DECIDE.md` makes the product hand-off
  executable as typed (router-first, lane command per unit kind).
  (validator: `node --test scripts/review-loop-discipline.test.mjs scripts/next-recommendations.test.mjs scripts/normative-drift.test.mjs` exit 0)
  Relevant files: skills/fold-findings/references/FOLD_PROCESS.md, skills/triage-issue/references/REVIEW_FINDING_PROCESS.md, skills/review-change/references/PERSIST_AND_DECIDE.md
- P4 — Skill bookkeeping: `bump-skill` pass for every touched skill (version +
  CHANGELOG rows), context-budget check, Pi package version bump + companion
  row (skills/** trigger set).
  (validator: `bun scripts/check-skill-context.mjs` exit 0; `node scripts/version-parity-gate.mjs --content --base main` exit 0)
- P5 — Verification: run every AC's command, fill Evidence rows, run the root
  suites, open the PR with `Closes #293`.
  (validator: `node --test scripts/*.test.mjs` exits 0)

### Planning evidence

Embedded (S/M unit). Claims verified against `main` @ `c6b3201e`:

| id | Claim | Evidence | Status |
|---|---|---|---|
| E1 | `routeOfRow` has no product branch; product-owned rows fall to `fold` | `scripts/unit-route.mjs:145-151` read; live repro `node scripts/unit-route.mjs 31-planning-review-materiality` → `route: fold`, rows F9 F10 | verified |
| E2 | FOLD_PROCESS freeze-batch keys only on `replan-in-unit`/`decision-required` | `skills/fold-findings/references/FOLD_PROCESS.md` batch table read | verified |
| E3 | `triage-issue` verdict vocabulary lacks a product outcome | `skills/triage-issue/references/REVIEW_FINDING_PROCESS.md:37` read | verified |
| E4 | `PERSIST_AND_DECIDE.md:141` product bullet is not executable as typed (no router step, no per-kind command) | reference read | verified |
| E5 | Axis B ACs (issue AC3–7) landed with feature 73 | `skills/unit-lane/references/REVIEW.md` receipt wiring; `unit-route.mjs:729-730` per-phase + tier; `catalog.test.mjs:122` tier pin; SKILL.md closing block | verified |

Prior-decisions contradiction sweep (plan step): candidate sources checked —
no `decisions.md` existed before this unit, no frozen NRS artifact exists
(`find docs -iname "*normalized*"` → only the feature-18 folder), no
architectural-invariants doc is installed. Hits and relations:

| claim | prior decision | source path | relation |
|---|---|---|---|
| tests are written before implementation (P1 pins first) | "Do tests before implementation with the expected behaviour and features" | `AGENTS.md` (project instructions) | `compatible` |
| one PR per unit, against `main`, conventional commits | "One PR per unit of work… conventional commits" | `AGENTS.md` (Working rules) | `compatible` |
| product route lands in the lane, not a new skill | issue #293 Non-goals: "No re-introduction of `design-feature`" | issue #293 (forge) | `compatible` |
| no new schema/envelope surface; verdict vocabulary change stays in skill prose | issue #293 Non-goals; normative-surfaces table routes verdict vocab through the owning surface only | issue #293 (forge); `AGENTS.md` normative-surfaces@1 | `compatible` |

### Obligations

| id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | `pre-execution-review/POLICY.md` §4 | the fold loop repairs source, never authority — a product-owned row must never fold | P2 P3 | product route + freeze-batch row | router + fold-findings | unit-route pins + discipline pin | Evidence row AC1/AC2 | verified |
| O2 | `review-implementation/CLASSIFY.md` owner table | product owner's hand-off is the lane; the router's `next` must name it as typed per unit kind | P2 P3 | route branch command + PERSIST_AND_DECIDE bullet | router + review-change | unit-route pins | Evidence row AC1 | verified |
| O3 | issue #293 AC8 | no existing test weakened; pins added for each changed behavior | P1 P5 | pins-first | tests | root suites | Evidence rows | verified |

## Triaged steps

```text
TRIAGE — 76-lane-product-route (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: release: small scope
Budget: strong
```

Step notes:
- **research** — E1–E5 verified against `main` @ `c6b3201e` (see Planning evidence); uncertainties: none blocking — the owner vocabulary is published by `CLASSIFY.md` and the policy rule by `POLICY.md` §4.
- **design** — ACs come from issue #293 verbatim (ask-don't-infer satisfied: the issue states them); gap interview: no expensive-to-undo gap remains open — every open choice is answerable from the repo; cheap defaults recorded as assumptions in `decisions.md`.
- **plan** — Tasks P1–P5 below; prior-decisions sweep clean (see Planning evidence); ledgers embedded (S/M sizing rule).
- **implement/tests** — P1 pins first, P2 router, P3 consumers, one phase per commit, diff guard after each implement step.
- **evidence/review/docs** — Evidence rows per AC; review verdict; `bump-skill` + CHANGELOG + package bump (P4); root suites + PR (P5).

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC1 | `node scripts/unit-route.mjs 31-planning-review-materiality` (live, P2 head `e8a4522f`) | exit 0 · fingerprint `9bcdd584…` | `route: product` · `next: /unit-lane 31-planning-review-materiality` | `node --test scripts/unit-route.test.mjs` pins (39 pass) |
| AC1 | `node --test scripts/unit-route.test.mjs` (P1 pins red-first, green after P2) | exit 0 | tests 39, pass 39, fail 0 | pins in `scripts/unit-route.test.mjs` + fixtures |
| AC2 | `node --test scripts/review-loop-discipline.test.mjs` (freeze-batch pin for product-owner class) | exit 0 | tests 27, pass 27, fail 0 | pin `assert.match(foldSkill, /frozen \(product owner present\)/)` |
| AC3–AC5 | P2 additions: `workflow-status-sensor.test.mjs` + `next-recommendations.test.mjs` pins; tier consumption landed with 73 | exit 0 | next-recommendations PASS · sensor pins pass | `scripts/workflow-status-sensor.test.mjs`, `scripts/next-recommendations.test.mjs` |
| AC8 | validators after P3: `node --test scripts/review-loop-discipline.test.mjs scripts/next-recommendations.test.mjs scripts/normative-drift.test.mjs` | exit 0 | PASS next-rec · PASS review-loop-discipline · fail 0 | combined run, no test weakened — pins were added, existing assertions only widened to the new closed vocabulary |
| — | diff guard (P3, working tree vs HEAD) | PASS | Lines: 47 (+34/-13) · Files: 5 (limit 8) | `bun scripts/diff-guard.mjs --base HEAD --unit 76` |
| P4 | `bump-skill` pass: fold-findings 1.8.0, triage-issue 2.11.0, review-change 3.12.0, review-implementation 1.11.0 + CHANGELOG rows + release-log line; pi package 0.20.0 → 0.21.0 + companion row | exit 0 | version-parity content gate: `VERDICT: PASS` (parity holds, companion row present) | `node scripts/version-parity-gate.mjs --content --base main` |
| P4 | context-budget check after the skill edits | exit 0 | `PASS context manifest: 28 discovered skills`; routes PASS after declared re-bases (fold-findings main 3252; four review-change routes re-based to ceil(measured × 1.10) with growth source `issue #293 (unit 76)`) | `bun scripts/check-skill-context.mjs` + `--routes` |
| P4 | `node --test scripts/*.test.mjs` (root suites, incl. the version-pin maintenance 1.7.0 → 1.8.0 in `review-loop-discipline.test.mjs` per the pin's own protocol) | exit 0 | tests 690, pass 690, fail 0 | root suites |
| P4 | `bun run test` (packages/pi-agentic-workflow) | exit 0 | 432 pass, 0 fail | package suite |
| AC1 (re-run) | `node scripts/unit-route.mjs 31-planning-review-materiality` at P5 head | exit 0 | `route: product` · `next: /unit-lane 31-planning-review-materiality` · `rows: F9 F10` | live re-run, P5 head `22b3e5eb` |
| AC2 | `FOLD_PROCESS.md` freeze-batch table names the `frozen (product owner present)` class explicitly (row 2) + SKILL.md rule | — | class stated, batch frozen, never folds | `node --test scripts/review-loop-discipline.test.mjs` (27 pass, incl. `#293` pins) |
| AC3 | `node scripts/unit-route.mjs 71-doc-cli` | exit 0 | `next: /execute-phase 71-doc-cli P1 (tier: cheap)` — exactly one phase, never the bare slug | `unit-route.test.mjs` `#291 AC3` pin + live run |
| AC4 | receipt wiring: `grep -c review-receipt skills/unit-lane/references/REVIEW.md` → 3 (emit + verify instructions present) | exit 0 | 3 hits | live grep; receipt runtime verified by `node --test scripts/review-receipt.test.mjs` (root suites) |
| AC5 | router consumes `catalog.json` `budget_tier` (`unit-route.mjs:483`); tier pins in tests | exit 0 | `(tier: cheap)` in execute hand-offs; a changed tier changes the emitted route | `unit-route.test.mjs` F31/#291 tier pins |
| AC6 | `skills/unit-lane/SKILL.md` closing block: `/audit-pr <PR-url>` is the first ordered alternative with the receipt precondition — an ordered stage, not a third-level bullet | — | lines 218–221 read | direct read + `next-recommendations.test.mjs` conductor pin |
| AC7 | `grep -c execute-phase skills/unit-lane/SKILL.md` | exit 0 | 7 (hand-off names a phase: `/execute-phase <NN-slug> P<k>`) | live grep |
| AC8 | no existing test weakened; pins added in P1 for each changed behavior (router route, freeze-batch class, triage verdict, executable hand-off); the one maintained pin (`version: 1.7.0` → `1.8.0`) follows the pin's own documented bump protocol, strength unchanged | exit 0 | root suites 690/690 | `node --test scripts/*.test.mjs` |

## Progress log

`2026-10-17 20:53 — unit doc created from issue #293; roadmap row 76 (defined); triage run + pasted; research/design/plan steps closed (decisions.md + sweep) → (this commit) — next: P1 pins`
`2026-10-17 20:58 — P1 pins: unit-route product-route cases (route, fix-unit hand-off, co-resident replan priority, plain fix-now still folds), freeze-batch class pin, next-recommendations pins; red-first per AC8 → 8891d84c — next: P2 router`
`2026-10-17 21:07 — P2 router: PRODUCT_ROUTE vocabulary, routeOfRow product branch before fold fall-through, per-kind lane hand-off command, sensor projection (workflow-status.mjs) + pins; AC1 live repro now prints route: product → e8a4522f — next: P3 consumers`
`2026-10-17 21:40 — P3 consumers: FOLD_PROCESS freeze-batch row + receipt PRODUCT-ROUTE branch (fold-findings), product-repair verdict routed through the router (triage-issue), executable product hand-off (review-change PERSIST_AND_DECIDE); validators green, diff guard PASS → 1bfbaea5 — next: P4 bump-skill bookkeeping`
`2026-10-17 22:05 — P4: bump-skill (fold-findings 1.8.0, triage-issue 2.11.0, review-change 3.12.0, review-implementation 1.11.0; CHANGELOG rows + release log), pi package 0.21.0 + companion row, parity content gate PASS; context budgets: fold-findings re-based to 3252 (declared growth source) after compressing the new SKILL.md paragraph to a FOLD_PROCESS.md pointer, and the four review-change route ceilings re-based to ceil(measured × 1.10) — the A5 bullet is router-first as typed; review-loop-discipline version pin maintained 1.7.0 → 1.8.0 per the pin's documented protocol (strength unchanged); root suites 690/690, package suite 432/432 → 22b3e5eb — next: P5 verification + PR`
`2026-10-17 22:20 — P5: every AC re-run and evidenced (AC1 product route live; AC3–AC7 Axis B verified as landed-with-73; AC8 pins-first honored); root suites 690/690; PR opened with Closes #293 → [PR #300](https://github.com/gtrabanco/agentic-workflow/pull/300) — next: review-change on the accumulated diff, then /audit-pr`
`2026-10-17 22:25 — PR #300 opened; roadmap row 76 → done · #300; branch pushed (6 commits, base main) → ba169edc + this commit — next: /review-change (review gate), then /audit-pr #300`

## Next

All triaged steps executed. Post-merge the router hands product-owned rows to `/unit-lane 31-planning-review-materiality` — that lane run (resolving F9/F10) is the next unit of work, not part of this one.

## References

- Issue [#293](https://github.com/gtrabanco/agentic-workflow/issues/293) (combined [#246](https://github.com/gtrabanco/agentic-workflow/issues/246) + [#291](https://github.com/gtrabanco/agentic-workflow/issues/291))
- Roadmap rows 61 (adaptive unit-lane), 73 (`lane-closeout-handoffs`, PR #297 — Axis B)
- `skills/review-implementation/references/CLASSIFY.md` (owner table), `skills/pre-execution-review/references/POLICY.md` §4
