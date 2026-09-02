# Planning obligations — 28-evidence-grounded-spec-plan-review

One row per acceptance criterion from the frozen SPEC/ACCEPTANCE.md.
Created by legacy adoption from artifacts as they stand.

Amended 2026-08-31 (user-approved re-plan, findings F2+F3+F6):
qualification obligations O9–O14 are re-mapped to the appended phases
(P6 corpus/fixture evidence, P7 reconciliation, P8 terminal re-review).
Statuses remain as recorded until each row's evidence lands.

Repaired 2026-08-31 (review finding RS4): rows O3 and O4 carried the closed
verdict vocabulary with unescaped `|` separators inside the
`affected-use-case-or-invariant` cell, so a strict nine-column parse shifted
every later column of those two rows (the verdicts read as `phase`, `task`,
… and the `status` column landed past the end). The same words are now joined
with commas, which keeps the nine-column contract parseable and the vocabulary
visible; no verdict, validator, evidence or status changed.

Reconciled 2026-09-01 (phase P14): O15 moves `planned` -> `in-progress`. Proven by
`scripts/normative-drift.test.mjs` (14 tests, exit 0; 7 pass / 7 fail / exit 1 against
the pre-P14 tree): the text -> machine direction for transitions, arguments, envelope
fields, verdicts, routes and gate-rejection types over 18 inventoried surfaces
(`normative-surfaces@1`), the machine -> text direction for the three vocabularies that
vocabularies an agent chooses between (`gate-rejection-type`, `pre-execution-verdict`,
`envelope-field:next`), and the render-only direction for the five restatements
`rendered-facts@1` pins, which corrected a real `CHANGELOG.md` version drift. Left open
deliberately, and recorded as known-issue 19: AC15's `artifact` and `ledger-row shape`
clauses are inventoried and grammar-checked but their cells are not yet resolved against
a published vocabulary (`PRE_EXECUTION_ARTIFACT_KINDS`, and the `review-mark@1` column
set, whose validator is AC16's `ledger-ownership.test.mjs`), and the machine -> text
direction is bounded by the inventory's `must-name` column rather than by every
vocabulary the schema exports.

Reconciled 2026-09-01 (phase P7): O9, O10, O11 and O14 are `verified` on the
evidence recorded in `testing.md` (the P5 gate tables, the 2026-09-01 re-runs
and the qualification corpus — no second-cycle sample across the three samples).
O12 stays `planned`: its validator is the independent `review-change` PASS on
the terminal candidate, which P8 produces; it is named in `progress.md`'s
residuals. O13 has been `verified` since P4. Status cells only — no verdict,
validator or evidence cell changed.

Amended again 2026-09-01 (owner verdict on F32): obligation **O21** is added for AC21 and mapped to **P17**, which executes before the P16 close-out.

Reconciled 2026-09-01 (phase P9): **O16** moves to `in-progress`, not `verified`.
Its map-and-scan clauses are proven — `node --test scripts/ledger-ownership.test.mjs`
18/18 exit 0 green, and 16 of 18 failing / exit 1 against the pre-P9 tree
(`git archive 0feaaf64`: no map, no templates) — but the row's third clause, "gate
rejections keep typed durable traces", is P10's work (AC17/O17), and a row whose
named validator covers only part of its statement is not a verified row. Status
cell only; no verdict, validator or evidence cell changed.

Reconciled 2026-09-01 (phase P10): **O16** moves to `verified` — the clause P9
left open, "gate rejections keep typed durable traces", landed with AC17's four
types and their printed traces, and the row's named validator still answers
(`node --test scripts/ledger-ownership.test.mjs` 18/18 exit 0, and 16/18 failing
against the pre-P9 tree). **O17** moves from `planned` to `in-progress`, not
`verified`: P10 delivered the mark, trace and replay fixtures
(`node --test scripts/pre-execution-quality.test.mjs` 53/53 exit 0 with the four
new cases), but the row spans P10 **and** P11, and P11's half — the sensor keying
its review-ran proof on the durable mark instead of on ledger presence — has not
run. Status cells only; no verdict, validator or evidence cell changed.

Amended 2026-09-01 (user-approved re-plan, finding F3 `replan-in-unit`, issue
#146 flow-integrity amendment F1-F6): obligations **O15-O20** are added for
AC15-AC20 and mapped to the appended phases P9-P16. Existing rows O1-O14 keep
their recorded authority, validator, evidence and status untouched; O12 stays
`planned` because its validator is the independent review that **P16** now
produces at the amended head, not P8.

Nine-column rule held: no cell quotes a closed `|`-separated vocabulary — vocabularies are joined with commas (known-issue 13).

obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status
O1 | AC1 | strict PreExecutionArtifactSnapshot v1 and PreExecutionReviewReceipt v1 public-entry suites, canonical vectors, bounded diagnostics | P1 | Publish pre-execution evidence contracts | execute-phase | `cd packages/agentic-workflow-schema && npm test` | exit 0 with all new and existing suites green | verified
O2 | AC2 | package tests prove exact-content and artifactRevisionId binding, Product-to-Plan parent binding, drift precedence, authoring-event revert non-resurrection, rejection of candidate review/verification receipts | P1-P2 | Publish contracts / Establish Product review readiness | execute-phase | package test assertions | exit 0, assertions pass | verified
O3 | AC3 | node --test scripts/pre-execution-quality.test.mjs exits 0 with fixtures showing review-spec is read-only, checks product/role/capability/expectation/acceptance closure, returns exactly one of SPEC-REVIEW-PASS, SPEC-REVIEW-FAIL, NEEDS-DESIGN | P2 | Establish Product review readiness | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0, 25/25 | verified
O4 | AC4 | review-plan covers both feature and fix units, reconciles every obligation to a phase/task/validator/closure condition, returns exactly one of PLAN-REVIEW-PASS, PLAN-REVIEW-FAIL, NEEDS-DESIGN | P3 | Establish Plan review readiness | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0, 39/39 | verified
O5 | AC5 | evidence grounding never emits approval, feature issues stop for review-spec before Engineering-half planning, fix issues route plan-fix -> review-plan, unsupported claims remain explicit unknowns | P2 | Establish Product review readiness | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0, fixtures pass | verified
O6 | AC6 | root fixtures reject blank/partial/deferred/issue-exported current-unit obligations, accept n/a only with non-contradictory evidence, every accepted row has phase/owner/validator/evidence/verified closure | P2 | Establish Product review readiness | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0, fixtures pass | verified
O7 | AC7 | root fixtures prove clean-context review, author-exclusion where identities available, unioned findings, counter-evidence-only dismissal, truthful diversity labels, bounded critique/synthesis, changed-snapshot-or-named-question no-progress enforcement | P3 | Establish Plan review readiness | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0, fixtures pass | verified
O8 | AC8 | transition and workflow fixtures prove current SPEC receipt gates planning, current Plan receipt gates execution, legacy adoption does not rewrite frozen acceptance, later plan/spec root causes route upstream | P4 | Enforce pre-execution authority routing | execute-phase | `node --test scripts/pre-execution-quality.test.mjs scripts/bounded-delivery-loops.test.mjs` | exit 0, 46/46 | verified
O9 | AC9 | package and repository diffs preserve the meanings and public shapes of CandidateSnapshot v1, candidate ReviewReceipt v1, VerificationPlan v1, and VerificationReceipt v1; review-change and audit-pr retain candidate and delivery authority | P5-P8 | Qualify the pre-execution workflow | execute-phase | `node --test scripts/*.test.mjs` | exit 0, all suites pass | verified
O10 | AC10 | package version/export/pack checks, canonical-to-Pi skill bundling/parity and Pi package tests, node scripts/check-skill-context.mjs, npx skills add . --list, skill changelogs, synchronized EN/ES docs, migration fixtures all pass | P5-P8 | Qualify the pre-execution workflow | execute-phase | `npm test` + Pi bundle + check-skill-context + skills add | exit 0, all checks pass | verified
O11 | AC11 | required executor-path golden fixture demonstrates complete manual path through review-spec, planning, review-plan, execution gating, candidate review, and audit without provider/runtime dependency or automatic issue creation | P6-P7 | Qualify the pre-execution workflow | execute-phase | golden fixture execution | PASS with no unresolved findings | verified
O12 | AC12 | independent review of the exact candidate reports no unresolved fix-now finding; canary protocol records baseline and post-change measurements without claiming improvement before results exist | P6, P8 | Qualify the pre-execution workflow | execute-phase | review-change + canary corpus | PASS with no fix-now findings | planned
O13 | AC13 | Product and Engineering authoring follow inventory -> evidence -> draft -> readiness -> independent review; readiness gate checks complete evidence/obligation/unknown structure, binds compact planning evidence, cannot emit review PASS verdict | P2-P3 | Establish Product/Plan review readiness | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0, fixtures pass | verified
O14 | AC14 | route fixtures and qualification corpus prove first review findings are repaired as one root-caused batch, one re-review is the normal correction path, entry into second repair/re-review cycle emits convergence anomaly with exact owner and evidence deficit; release canary includes feature/fix/cross-boundary unit, any sample needing second cycle fails qualification | P6-P7 | Qualify the pre-execution workflow | execute-phase | review-change + canary + second-cycle checks | PASS with no second-cycle sample | verified
O15 | AC15 | F1 drift gate: a repository test fails when normative skill text orders a transition, argument, field, artifact, or ledger-row shape the machine surface does not accept, and when the machine requires something no text states; surfaces lacking fixed grammar get one; prose restating versions, SHAs, counts, next commands is render-only and the machine is authoritative | P14 | Bind normative prose to machine surfaces | execute-phase | `node --test scripts/normative-drift.test.mjs` | exit 0 green and non-zero against each of the three injected disagreements | in-progress
O16 | AC16 | F2 durable-ledger write ownership: one declared owner per truth class plus declared mechanical annotator, present in the ownership map and every template; scan fails undeclared script or agent writers; gate rejections keep typed durable traces | P9 | Declare durable ledger write ownership | execute-phase | `node --test scripts/ledger-ownership.test.mjs` | exit 0 green and non-zero on the undeclared-writer fixture | verified
O17 | AC17 | F3 terminal marking: verdict and rejection turns write the durable mark in the same act, traces name reason and return route, replay of a stale, wrong, or duplicate mark refuses with a typed reason and zero side effects | P10, P11 | Mark terminal verdicts durably, prove clean reviews with a durable mark | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0 with terminal-mark, rejection-trace and no-side-effect fixtures | verified
O18 | AC18 | F4 delegated evidence standard: versioned artifact with outcome, questions, seven source fields, claims mapped to source ids, contradictions, freshness, separated product choices, unverified section; partial or blocked blocks readiness; persist-then-STOP; advisory until spot-checked | P12 | Conserve delegated evidence as a versioned artifact | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0 with delegated-evidence and NEEDS-EVIDENCE fixtures | verified
O19 | AC19 | F5 normalization before freeze: every source-mutating normalizer scheduled strictly before the snapshot or freeze row, only check-only actions after, post-freeze byte change voids current receipts | P13 | Run normalizers before the artifact freeze | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0 green and non-zero when a mutating step follows the freeze | verified
O20 | AC20 | F6 clean-review sensing: sensor review-run proof keys on the durable review mark instead of findings-ledger presence so a zero-finding review is distinguishable from a never-reviewed unit | P11 | Prove clean reviews with a durable mark | execute-phase | `node --test scripts/workflow-status-pre-execution.test.mjs` | exit 0 with mark-present and ledger-only fixtures | verified
O21 | AC21 | F32 disposition: the sync digest prefers the host native SHA-256 through globalThis.process?.getBuiltinModule?.("crypto") where present and this package's pure-JS path otherwise, one identical lowercase 64-hex result, no static node: specifier, no @types/node, no dependency added, nothing vendored, rejected alternatives recorded with measured cost, and any future copied code carrying source, author, version and license | P17 (runs before P16) | Prefer the host native SHA-256 digest | execute-phase | `cd packages/agentic-workflow-schema && npm test` plus the no-static-node-import grep and the two-path digest probe | exit 0, identical digests from both paths, zero static builtin imports | verified

Reconciled 2026-09-01 (phase P11): **O17** and **O20** move to `verified`. O20's
named validator now exists and answers —
`node --test scripts/workflow-status-pre-execution.test.mjs` 6/6 exit 0 with both
required cases computed over fixture state, 0 pass / 6 fail / exit 1 against the
pre-P11 tree (`git archive 35a5a0b0`) and 4 pass / 2 fail / exit 1 against that tree
with only P11's ledger surface added. O17's row spans P10 **and** P11: its validator
(`node --test scripts/pre-execution-quality.test.mjs` 53/53 exit 0, re-run today)
covers the mark, trace and replay rules P10 landed, and the clause P10 left open —
the sensor keying its review-ran proof on the durable mark instead of on ledger
presence — is what P11 delivered, so both AC17's and AC20's evidence now exist. The
residual is not a gap in this row: `review-change`'s own persist reference still
describes only finding rows, and pinning it to `review-change:review-mark` is P14's
drift-gate work (proposal recorded in D40, named in `progress.md`'s Remains). Status
cells only; no verdict, validator or evidence cell changed.
Reconciled 2026-09-01 (phase P12): **O18** moves to `verified`. Its named validator
answers with the required fixtures — `node --test
scripts/pre-execution-quality.test.mjs` 58/58 exit 0, and 53 pass / 5 fail / exit 1
against the pre-P12 tree (`git archive e6a310f0`) with only these cases added — and
each clause of AC18 has its own evidence: the shape and the seven source fields in
`skills/evidence-grounding/references/DELEGATION.md` §"The artifact", the
zero-validated-claims rule computed by `validatedClaims`/`delegatedEvidenceGate`
(`scripts/pre-execution-quality.test.mjs:1248`, `:1254`), the gate at its owner
(`READINESS.md` shared box D1), the pending write before the prompt
(`DELEGATION.md` §Persist-then-STOP with `POLICY.md` §8 extended at its owner), the
advisory-until-spot-check rule, and the self-attested boundary that added no
permission vocabulary. What the row does **not** claim: mechanical enforcement of a
delegate's obedience (known-issue 16's stated residual — the scan reaches scripts, the
contract reaches models), and no snapshot kind was invented to bind this artifact.
Status cell only; no verdict, validator or evidence cell changed.

Reconciled 2026-09-01 (phase P13): **O19** moves to `in-progress`, not `verified`. Its
named validator now answers both ways it was asked to — `node --test
scripts/pre-execution-quality.test.mjs` 61/61 exit 0, and exit 1 with the single
`normalizer inventory: one home…` failure when `npm run bundle:skills` is re-marked from
`before` to `after` in the inventory (58 pass / 3 fail / exit 1 against the pre-P13 tree,
60 pass / 1 fail against that tree with only the gate section added) — and it closes the
row's first two clauses with computed proof: the ordering rule is stated in exactly one
skill file (`PRE_EXECUTION_GATE.md` §"Normalizer order"), each project's mutating steps are
inventoried in exactly one place (`CLAUDE.md`, `normalizer-inventory@1`, every entry naming
its side of the freeze and every dual-mode step contributing only its check-only mode
afterwards), and `scheduleVerdict` refuses a mutating step behind the freeze row by naming
it. What the row does **not** claim: AC19's third clause — a byte change to a frozen input
after the freeze voiding current receipts and forcing fresh review — is enforced by the
existing digest machinery (`SNAPSHOT.md`'s verify recipe, `POLICY.md` §7,
`scripts/pre-execution-attribution.test.mjs`), which this phase cites at its owner and did
not re-prove; P13 added a step-order guarantee, not a second invalidation mechanism. The
sentence that says so is pinned to the ordering section, but no fixture of this phase's
mints a receipt, lets a byte move behind it, and watches it go stale — that proof belongs
to the machinery above and to P16's receipt set, minted at a terminal HEAD where a
post-freeze write is actually observable. Status cell only; no verdict, validator or
evidence cell changed.

Reconciled 2026-09-02 (phase P15, weakest-executor legs): **O11**'s named evidence is
dated rows in `docs/workflow/GOLDEN_FIXTURE.md`, and four 2026-09-02 `nan/qwen3.6`
rows now cover every skill P9-P14 changed. **O11 stays exactly where P6 left it**
(`verified`) — this commit claims no movement, because the required form is a dated
*PASS* row per changed executor-path skill/version and the evidence-grounding leg is
recorded as objective PASS · procedure FAIL (box 3) until its targeted wording change
(F40) and a re-run land. Recorded rather than rounded up — D44.

Closed 2026-09-02 in the same phase: the F40/F41 change landed (evidence-grounding
1.4.0), the re-run leg is a dated PASS row, and `GOLDEN_FIXTURE.md` now carries the
P15 gate sentence (`grep -qE …` exit 0). **O11 is not re-declared by these legs** — it
stays `verified` on the P6 corpus evidence it already cited; P15 adds the P9-P14
coverage without moving the row. F38 and F39 stay open for P16's fold (D45).

Reconciled 2026-09-02 (phase P17): **O21** moves `planned` -> `verified`. Every
clause of AC21 has its own proof now: the routing (native binding consulted per
call) and the identical-result guarantee are pinned by
`sha256HexSync answers from the host native SHA-256 and all three paths agree` in
`test/pre-execution-canonical.test.mjs`, which fails red-first on the pre-P17
tree with `the native path answered, and answered per call (got [])`; the
no-static-`node:` clause by `grep -rn "from \"node:" src/` -> no matches (exit 1);
the no-`@types/node` and no-dependencies clauses by `grep -n "@types" package.json`
-> exit 1 and the `devDependencies`-only block in `package.json`; and the
recorded-cost clause by the measured table in `architecture-notes.md` §"Digest
paths". F36's half of the phase is closed with it: the `src/sha256.ts` header now
names `test/pre-execution-canonical.test.mjs`, the file that truly pins the
digests. Status cell only — the row's authority, validator and required-evidence
cells are untouched, and the probe named in the validator is
`packages/agentic-workflow-schema/scripts/probe-sha256-paths.mjs`
(`npm run probe:sha256-paths`), which prints three paths rather than two.

Reconciled 2026-09-02 (P16 fold half): **O15 stays `in-progress`** — the fold fixed
F38 and F39 and made the annotator see escaped-pipe rows, but AC15's artifact-kind and
ledger-row-shape clauses are still grammar-checked only (known-issues 18-19), so the
row cannot claim `verified` and is not being nudged. No other obligation status moved
in this commit; the close-out half confirms O15-O20 against their cited evidence at
terminal HEAD, which is what P16 box 6 exists to do.

Confirmed 2026-09-02 (P16 close-out half, terminal HEAD): every row O15-O20 was read
against the command its own validator cell names, re-run at this head, and judged on
the output rather than on the cell. `normative-drift` 15/15 exit 0, `ledger-ownership`
18/18 exit 0, `pre-execution-quality` 62/62 exit 0, `workflow-status-pre-execution` 7/7
exit 0 — figures and the gate set around them in `testing.md` §"P16 close-out".
**O15 stays `in-progress`**: its artifact-kind and ledger-row-shape clauses are still
grammar-checked only, and known-issue 19's re-trigger (a published vocabulary those
cells resolve against) has not been met, so the row keeps the cell the drift gate
cannot yet support. **O16, O17, O18, O20 stay `verified`** on the same evidence they
cited — the P11 note's residual for O17 (pinning `review-change`'s own persist
reference to `review-mark@1`) shipped in P14, and O20's fixture now builds real
commits instead of injecting a head, which strengthens rather than replaces its
claim. **O19 moves `in-progress` → `verified`**, because the one clause P13 withheld
is now machine-proven and observed. AC19's third clause — a byte change to a frozen
input after the freeze invalidates current receipts and forces fresh review — is not
asserted by a sentence here: `scripts/pre-execution-sensor.test.mjs` mints a receipt,
moves exactly one bound byte, and refuses the stale answer in both its committed form
(`RS13: a committed bound edit reports a specific dimension with the changed path`) and
its uncommitted form (`RS13: an uncommitted bound edit is attributed to artifact
content`), with `RS3b: a bound edit invalidates the receipt exactly once` pinning the
single-invalidation rule and `RS3b: an unbound commit leaves the snapshot digest
byte-identical` pinning the other direction. The same machinery answered live at this
head: `node scripts/pre-execution-snapshot.mjs verify --stage plan --unit
28-evidence-grounded-spec-plan-review --parent 781f8127481cd59a51255f86b74d8f82a8f5b0b87533c9619f4b95cb69fed4cf`
→ `current: false`, `digestMatches: false`, `structural.fresh: false`, exit 4, with the
2026-08-31 freeze `f82316b8ee700d79…` against the observed `70251fa8976f8455…`. P13's
note assigned exactly this proof to "P16's receipt set, minted at a terminal HEAD where
a post-freeze write is actually observable"; the condition is met, so the row moves.
Status cell only: O19's authority, phase, validator and required-evidence cells are
untouched, and no other row's text moved here.


Reconciled 2026-09-02 (P16 review fold): no obligation advanced. The fold changed what the
gates can see (row arity, duplicate rendered rows, tautological and vacuous assertions), not
which acceptance clauses are machine-covered — **O15 stays `in-progress`** for the same
reason it did before: AC15's artifact-kind and ledger-row-shape clauses remain grammar-checked
only (known-issues 18-19). F58 and known-issue 24 are new open work with owners and re-checks;
neither closes an O-row.
