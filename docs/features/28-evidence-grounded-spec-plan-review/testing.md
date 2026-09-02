# testing — 28-evidence-grounded-spec-plan-review

## Validation ladder

| Layer | Required evidence | Command or check |
|---|---|---|
| Contract unit/integration | strict shapes, normalized DTOs, selector, bounds, diagnostics, canonical vectors, semantic stage/lineage/freshness | `cd packages/agentic-workflow-schema && npm test` |
| Projection | both generated Draft-07 projections match the canonical definition and disclose runtime authority | `cd packages/agentic-workflow-schema && npm run check:pre-execution-schemas` |
| Package content | version 3.5.0 and both new schema files are publishable | `cd packages/agentic-workflow-schema && npm pack --dry-run` |
| Pi distribution | canonical root skills are rebuilt into the Pi package with byte parity and routed/package tests green | `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` |
| Workflow text contracts | progressive readiness, SPEC/Plan/fix review, planning-evidence/obligation ledgers, independence, batched repair, convergence anomaly, no-progress, legacy, routing | `node --test scripts/pre-execution-quality.test.mjs` |
| Snapshot sensor and drift attribution | content-derived snapshot identity survives an unbound commit and a receipt-recording commit; `verify` names the drifted dimension with a contract code and the bound paths that moved; a feature plan without `--parent` fails with the remedy; a fix plan binds `null` (findings RS3(b), RS13, RS14 — D29, D30) | `node --test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` |
| Existing loop/audit regression | local fold remains source-local; upstream defects route backward; audit authority unchanged | `node --test scripts/bounded-delivery-loops.test.mjs scripts/audit-pr-receipt.test.mjs` |
| Context/distribution | every entrypoint remains within budget and intended skills are installable | `node scripts/check-skill-context.mjs`; `npx skills add . --list` |
| Manual weak-executor route | no invented stage, bypass, automatic issue, or post-PASS artifact edit | dated PASS record in `docs/workflow/GOLDEN_FIXTURE.md` |
| Independent candidate review | exact candidate has no unresolved fix-now finding | current `review-change` PASS receipt |

## Mandatory matrices

### Snapshot and receipt

- Valid SPEC snapshot with `spec-product-v1`; missing/duplicate/out-of-order
  headings; normalized and invalid paths; absent/present context bindings.
- Valid Plan snapshot for XS/S and M/L artifact sets; missing acceptance,
  wrong Product parent, duplicate artifact kind/path, wrong unit/stage.
- Lower/upper bound and boundary-plus-one cases for every published cardinality,
  string, payload, findings, parent, and diagnostic limit.
- Product bytes/context/revision/source/policy mutations; Plan-only mutations;
  full causal revert with new revision id; unchanged same-revision repetition.
- Every verdict/stage pair, PASS with open material finding, wrong author under
  enforced exclusion, invalid synthesis topology, and receipt substitution.

### Skills and routes

- Complete feature Product review, reparable Product finding, missing product
  choice, unsupported external claim, and issue-export attempt.
- Complete feature Plan review, complete fix Plan review, unsupported
  architecture assumption, incomplete obligation, phase multi-concern,
  validator weakening, and missing failure scenario.
- Same-model clean reviewers labelled honestly; union of disagreements;
  material dismissal only with counter-evidence; identical repeat no-progress.
- Product/Plan readiness rejects missing evidence, unknown ownership, scenario
  gaps, uncovered obligations, bad phase cuts, or unresolved decisions without
  claiming review PASS.
- First findings are classified and repaired as one owner-bounded batch; one
  re-review may close; a second cycle emits `CONVERGENCE-ANOMALY` with finding,
  snapshot, evidence-deficit, and owner fields before any further edit.
- `workflow-status` and transition decisions for every missing/current/stale
  receipt; legacy adoption; crash/re-entry; Plan/Product root cause discovered
  during candidate review.

## Canary fields

Record comparable baseline and post-change observations for:

- elapsed time and model calls to first correct source edit;
- pre-edit replans and post-review repairs;
- `review-change` / `fold-findings` cycles;
- lines/files written then reverted or substantially rewritten;
- total latency and model tokens where the runtime exposes them;
- current-unit obligations exported to follow-up issues.

The mandatory qualification corpus contains at least one feature, one fix, and
one cross-boundary unit. Record correction cycles per stage. Any sample entering
a second repair/re-review cycle fails qualification until its Product/Plan/
source/environment/runtime cause is corrected and the sample is rerun. This
threshold is a release-quality target, never permission to suppress findings.

Use `not yet measured` for unavailable observations. Do not infer improvement
from the mechanism alone.

## Execution records

### P2 (2026-08-30) — Product authoring and the independent spec review

Gate commands, all on the final candidate state:

| Command | Result |
|---|---|
| `node --test scripts/pre-execution-quality.test.mjs` | 25/25 pass (13 pre-P2 + 12 P2 cases) |
| `node --test scripts/*.test.mjs` (root) | 82/82 pass, no regression from the 57-pass baseline |
| `node --test scripts/bounded-delivery-loops.test.mjs scripts/audit-pr-receipt.test.mjs` | 17/17 pass |
| `node scripts/check-skill-context.mjs` | PASS — 37 skills, largest entrypoint `plan-feature-scaffold` 14661 ≤ 15200 |
| `node scripts/check-skill-context.mjs --routes` | PASS — 20 routes |
| `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` | bundled 36 skills; 134/134 pass |
| `npx skills add . --list` | 38 skills, `evidence-grounding` and `review-spec` internal, the rest user-facing |

Route-specific coverage against the mandatory "Skills and routes" matrix:

- *complete feature Product review* → `review-spec` C1–C14 + verdict/receipt
  tests; *reparable Product finding* → `design-feature/references/REPAIR.md`
  batch test; *missing product choice* → C13 `NEEDS-DESIGN` rule + check table;
  *unsupported external claim* → `authority-kind`/`freshness` row test;
  *issue-export attempt* → `plan-feature-from-issue` terminal-handoff test.
- *Product readiness rejects missing evidence / unknown ownership / scenario
  gaps without claiming PASS* → readiness-vocabulary-preservation test plus the
  `READINESS.md` rule set and the `design-feature` "carries no review authority"
  guardrail.
- *first findings repaired as one owner-bounded batch; one re-review; second
  cycle → `CONVERGENCE-ANOMALY`* → batched-repair test; the cycle-count fields
  themselves are the schema package's P1 vectors (already green).
- Not yet exercised by text contracts (lands with P3/P4): Plan-review route
  coverage, `execute-phase`/`fold-findings`/`triage-issue` ledger behaviour, and
  the routing table for `review-spec`/`review-plan`.

Residual risks: (1) the P2 tests assert contract text, not an LLM performing a
review — the qualification corpus and the weak-model route in
`docs/workflow/GOLDEN_FIXTURE.md` remain P5 work; (2) `spec-review-pass`
authority is contractual (see `known-issues.md` item 9); (3) the Pi bundle was
rebuilt from canonical at P2 because skill changes must stay distributable
inside the unit — P5 still owns the terminal rebuild and version bump (D15).

### P3 (2026-08-30) — Plan review, planning ledgers, shared review policy

| Command | Result |
|---|---|
| `node --test scripts/pre-execution-quality.test.mjs` | 39/39 pass (25 pre-P3 + 14 P3 cases) |
| `node --test scripts/*.test.mjs` (root) | 96/96 pass |
| `node scripts/check-skill-context.mjs` | PASS — 39 skills, every entrypoint inside budget |
| `node scripts/check-skill-context.mjs --routes` | PASS — 23 routes |
| `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` | bundled 38 skills (119 files); 134/134 pass |
| `npx skills add . --list` | `review-plan` + `pre-execution-review` discoverable, the latter internal |

Mutation checks (each mutation had to break exactly the assertion that owns it, and
the suite was restored to green after every probe): `plan-fix` handing straight to
`/execute-phase` ✗, scaffold allowed to self-certify a review ✗, `review-plan`
declared read-write ✗, dropping the obligation ledger's `validator` column ✗,
scaffold handing off to `/execute-phase` ✗, removing the template's
`### Planning evidence` heading ✗, "majority wins" replacing union ✗, weakening the
`CONVERGENCE-ANOMALY` report from mandatory to optional ✗, and downgrading
`review-plan`'s model tier ✗.

Route-specific coverage against the mandatory matrices:

- *complete feature Plan review / complete fix Plan review* → snapshot + verdict +
  parent-lineage tests; the fix path additionally asserts F1–F4 rows and that no
  fake Product half is manufactured (D6).
- *unsupported architecture assumption* → L2 requires `current` rows and keeps an
  unsampled model/service claim `unknown`; `review-plan` refuses PASS otherwise.
- *incomplete obligation / bad phase cut / bad scenario* → L3–L5 + P9–P11 with the
  "validator that can fail" rule; the readiness model maps each gap to
  `NEEDS-EVIDENCE` or `NEEDS-REPLAN` deterministically.
- *wrong parent / Product conflict* → L1 + the freshness-code pin (every
  `PRE_EXECUTION_FRESHNESS_CODES` member stays published) + the `stale-parent`
  route in `OUTPUT.md`.
- *wording-only batch repair, causal revert, second-cycle diagnosis* → shared
  `POLICY.md` §3–§4 with the mandatory field list, plus the scaffold/planner
  revision-rotation assertions.
- *issue-export attempts* → `from-issue` still terminates at `/review-spec`, and a
  `deferred` obligation requires a user amendment before it may exist.
- Not yet exercised (P4 owns them): `execute-phase`'s fail-closed Plan gate,
  `workflow-status` receipt sensing, `ship-roadmap` sequencing, `audit-pr`
  lineage/obligation requirement, legacy adoption, and the end-to-end
  current/stale/missing route fixtures.

Residual risks: (1) the P3 tests are text-contract assertions — no live model has
run `/review-plan` yet, which is P5's golden-fixture and canary work; (2) the
consolidation means a caller can point at `pre-execution-review` and be wrong about
the detail, so the suite pins both the delegation and the stage-specific residue in
`design-feature`/`review-spec`; (3) this unit's own `planning-obligations.md` is
written with the tooling it ships (dogfood, not pre-existing evidence).

### P4 (2026-08-30) — Routing enforcement

| Command | Result |
|---|---|
| `node --test scripts/pre-execution-quality.test.mjs` | 46/46 pass (39 pre-P4 + 7 P4 route/owner cases) |
| `node --test scripts/*.test.mjs` (root) | 103/103 pass |
| `node scripts/check-skill-context.mjs` | PASS — 39 skills |
| `node scripts/check-skill-context.mjs --routes` | PASS — 23 routes (execute-phase routes now include `PRE_EXECUTION_GATE.md`; ceilings re-measured) |
| `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` | bundled 38 skills (121 files); 134/134 pass |

Route-specific coverage (each mandatory route exercised against the real contract
text, through a pure model of the decision tables so a drift in either side fails):

| Route | Case that owns it |
|---|---|
| current / stale / missing / wrong-stage / substitute / self-approved / author-readiness receipt | `route fixtures: current, stale and missing receipts select exactly one command each` — each label must both re-route the sensor and refuse the executor an edit |
| complete feature Plan review → execution | `…feature and fix paths, and the autopilot stage order` |
| complete fix Plan review | same case: fix path admits on its own receipt and a `SPEC-REVIEW-PASS` never substitutes |
| later review root causes (plan-, product-, source-owned) | `route fixtures: later review root causes…` + `Owning stage` pin in `review-implementation` |
| crash / re-entry | same case: routing recomputed from persisted evidence, stale-after-crash labelled `stale` |
| no-progress | `CONVERGENCE-ANOMALY` required before a second local edit (loop + policy pins) |
| no partial-success envelope | `route fixtures: no partial-success envelope…`: FAIL/verdict-out-of-set never startable, readiness can never emit a PASS |
| legacy adoption | `route fixtures: legacy adoption constructs evidence and never coerces it` + single-owner pin (`Construct, never coerce` appears in exactly one file) |

Mutation checks (probe → expect the suite to fail → restore; 12 probes this phase):
`--force` reaching the pre-execution gate ✗, the fix path allowed a Product
substitute ✗, the sensor label becoming advisory instead of overriding ✗ (both the
override sentence and the `legacy` label row), a `plan`-owned finding folding
locally ✗, an open obligation "noted" instead of blocking ✗, the executor expecting
rather than requiring the PASS ✗, legacy adoption's ownership moving out of
`pre-execution-review` ✗, the autopilot order collapsing back to
`[DESIGN] → PLAN → EXECUTE` ✗, the autopilot allowed to file an issue ✗, the
owning-stage table removed ✗, and obligations dropped from the descope guard ✗.
One probe slipped at first (a heading-only rename in `PRE_EXECUTION.md` proved
nothing), so the assertions were strengthened to pin the sentences that carry the
rules, then all probes were re-run.

Residual risks: the route fixtures are pure models of the published decision
tables — they prove the documents agree with a deterministic reading of themselves,
not that a live model follows them. No real turn has yet been stopped by
`execute-phase`'s gate, and the `detail.pre_execution[]` rows are specified in the
skill docs (the envelope schema keeps `detail` opaque on purpose), so an
orchestrator cannot validate them mechanically until P5's canary runs the routes for
real.


### P5 (2026-08-31) — Pre-execution workflow qualification

**Canary corpus (live unit execution):**
| Command | Result |
|---|---|
| Dependency gate (git ancestry check for 25, 26, 27) | PASS — all present in origin/main |
| Legacy adoption: create planning-obligations.md from artifacts | PASS — 14 rows from 14 acceptance criteria, zero file coercion |
| /review-spec 28-evidence-grounded-spec-plan-review | PASS — spec-review-pass, stage spec, 0 findings |
| /review-plan 28-evidence-grounded-spec-plan-review | PASS — plan-review-pass, stage plan, 0 findings, obligations read 14 rows |
| Pre-execution gate verification | PASS — all receipts current, stage-correct, author-excluded |
| node --test scripts/pre-execution-quality.test.mjs | 46/46 pass (39 pre-P4 + 7 P4 route/owner + legacy adoption) |
| node --test scripts/*.test.mjs (root) | 103/103 pass, zero regression |
| node scripts/check-skill-context.mjs | PASS — 39 skills, all within budget (routes bumped for pre-execution-review growth) |
| node scripts/check-skill-context.mjs --routes | PASS — 23 routes, ceilings bumped for SNAPSHOT.md and planning-obligations.md |
| cd packages/pi-agentic-workflow && npm run bundle:skills | bundled 38 skills (122 files) — excluded: bump-skill |
| cd packages/pi-agentic-workflow && npm test | 134/134 pass |
| npx skills add . --list | ~~39 skills~~ → **38 skills** — corrected 2026-09-01 during reconciliation of the author repair batch: `evidence-grounding` and `review-spec` are internal but still listed, `bump-skill` is the one the CLI does not discover (39 SKILL.md files on disk, CLI reports `Found 38 skills`); 39 is the `check-skill-context` count, a different metric |

**Golden fixture:**
| Command | Result |
|---|---|
| Live end-to-end execution of unit 28 through pre-execution gates | PASS — see GOLDEN_FIXTURE.md row dated 2026-08-31 |

**Package gates:**
| Command | Result |
|---|---|
| cd packages/agentic-workflow-schema && npm test | 671/671 pass |
| cd packages/agentic-workflow-schema && npm run check:pre-execution-schemas | PASS — drift-free (2 files) |
| cd packages/agentic-workflow-schema && npm pack --dry-run | PASS — version 3.5.0, both new schema files publishable |
| node --test scripts/bounded-delivery-loops.test.mjs scripts/audit-pr-receipt.test.mjs | 15/15 pass (audit-pr-receipt 14 + bounded-delivery-loops 1) |

Residual risks: (1) spec-review-pass authority is contractual (known-issues.md item 9); (2) the Pi bundle was rebuilt from canonical at P5 because skill changes must stay distributable — version bump from 0.1.0 to 0.2.0 required as final step; (3) no second repair/re-review cycle was needed during qualification — all review gates cleared on first run.

**Corrected 2026-08-31 (review finding RS6).** The row above read
`15+3/15+3 pass` and `progress.md`'s P5 table read `18/18 pass`; neither is
what the command produces. Ground truth, re-run at this repair:
`node --test scripts/bounded-delivery-loops.test.mjs
scripts/audit-pr-receipt.test.mjs` → exit 0, `tests 15 · pass 15 · fail 0`
(14 from `audit-pr-receipt.test.mjs`, 1 from `bounded-delivery-loops.test.mjs`).
The `+3` and the `18` counted nothing that exists; the F4 fold had corrected
only the `GOLDEN_FIXTURE.md` copy of this figure, which is why the
contradiction stood in two ledgers. Item (3) above is superseded by the
2026-08-31 re-plan: the qualification evidence it asserted was incomplete
(findings F2+F3+F6) and is produced by P6–P8.

**Corrected 2026-09-01, during reconciliation of the author repair batch (same
defect class as RS6).** The P5
row above recorded `npx skills add . --list` → `39 skills`; measured at this commit
the CLI prints `Found 38 skills` (it does not discover `bump-skill`, while the
internal `evidence-grounding`/`review-spec` *are* listed — the P1 row already said
38). The `39` belongs to `node scripts/check-skill-context.mjs`, a different
metric. Re-run of the whole ladder at this commit, after the D29/D30 contract work
and the D31 re-basis:

| Command | Result |
|---|---|
| `cd packages/agentic-workflow-schema && npm test` | 674/674 pass (671 at P5 + 3 cases from D29/D30) |
| `cd packages/agentic-workflow-schema && npm run check:pre-execution-schemas` | PASS — drift-free (2 files) |
| `node --test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` | 22/22 pass (new suites: RS3(b), RS13, RS14) |
| `node --test scripts/pre-execution-quality.test.mjs` | ~~46/46 pass~~ → **48/48 pass** — corrected 2026-09-01 (review finding RC1, same defect class as RS6): this ladder row copied the P5-era count without re-running the suite; the F19/F20 fold (`74c40bc3`) had added two containment cases after that count was written. Ground truth re-run at this commit: `tests 48 · pass 48 · fail 0`. The dated P4/P5 rows above were true at their own dates and stand. |
| `node --test scripts/*.test.mjs` (root) | 127/127 pass |
| `node scripts/check-skill-context.mjs` | PASS — 39 skills |
| `node scripts/check-skill-context.mjs --routes` | PASS — 23 routes (ceilings re-based per D31) |
| `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` | bundled 38 skills (122 files); 134/134 pass — byte parity was **red** before this reconciliation (AC2 bundle test failed on 7 drifted reference files) |
| `npx skills add . --list` | Found 38 skills |


### P6 (2026-09-01) — Pre-execution qualification corpus

Executed under owner decision D32 (the pre-execution review gate is bypassed for
this unit — known-issue 14): the samples were probed **read-only** by clean-context
subagent sessions against HEAD `19629257`, following the in-repo skill texts
mechanically; `review-spec`/`review-plan` exist only as repo text, so fields only
an installed command could observe carry the corpus's sanctioned
`not yet measured`. No sample entered a second repair/re-review cycle.

**Canary corpus — one row-set per sample (fields as rows; the corpus table):**

| Canary field | 28 (feature sample, this unit) | 78 (fix sample) | 17 (cross-boundary sample) |
|---|---|---|---|
| Elapsed to first correct edit / probe duration | branch span 2026-08-30 → 2026-09-01, multi-session | ~8 min probe (09:17–09:25 UTC) | ~12 min probe |
| Model calls | not yet measured | not yet measured | not yet measured |
| Pre-edit replans | 1 (2026-08-31 user-approved replan P6–P8, findings F2+F3+F6) | 0 | 0 |
| Post-review repairs | 3 recorded batches (F-fold set across 7 commits; RS product batch RS1+RS2+RS15–17; RS plan batch RS3–RS12+RS14+RS18) | 1 (single plan-fix batch over the 8 findings a strict read files) | 0 plan repairs; 1 upstream action (run `review-spec` on 17 first — L1 route-and-stop) |
| Review/fold cycles | 2 (`review-change` 1 cycle on PR #155 → 19 fix-now folded; `review-spec` 1 cycle → the two RS batches; plan-stage receipt voided by the replan rule, not by findings) | 0 (first cycle; `review-plan` never folds) | 0 |
| Lines/files written then reverted | 0 revert commits on `8ab22ea6..HEAD` | 0 / 0 (read-only probe) | 0 / 0 (read-only probe) |
| Tokens | not yet measured | not yet measured | not yet measured |
| Obligations exported to follow-up issues | 0 (O1–O14 all in-unit; no forge issue created by execution, review or fold) | 0 rows carried — unit 78 predates the ledgers (control `fix-147` carries them) | none (no obligations ledger exists) |
| Second repair/re-review cycle? | **No** — every cycle was first-cycle for its snapshot; receipts voided by the replan rule, not by convergence failure | **No** — FAIL ends the first cycle; re-review needs a changed snapshot (no-progress rule); unit is `done · #85` | **No** — L1 route-and-stop blocks binding a plan snapshot; no PASS to fold |

**Sensor observations (real CLI runs by the probes):**

| Sample | Observation |
|---|---|
| 78 (fix) | spec build refused `invalid-selector@/files/0/content` (by design: no fix-unit spec-stage selector — D30 keeps the Product hop out of fix mode); plan build refused `required artifact(s) absent: …/ACCEPTANCE.md` (unit predates frozen acceptance). **Control `fix-147` (complete artifact set): plan build SUCCEEDS, digest `acfe7087cc84d43b3…`, `unitKind: fix`, `parentSpecSnapshotDigest: null` → D30's fix-plan path proven live.** Would-be verdict `PLAN-REVIEW-FAIL`, 8 findings (3 high / 2 med / 3 low): L2/L3/L4 high (no ledgers in a pre-ledger unit), L5 + F1 medium, F2/F3/P12 low. |
| 17 (feature, cross-boundary) | spec build SUCCEEDS, digest `fdddc8583ac4544a993ecb7ae4aabd5e7c63d28bbd6f2092239848def41454ec` (binds SPEC.md 17611 B); plan build refused `required artifact(s) absent: …/ACCEPTANCE.md` — the artifact check precedes the `--parent` rule, so a legacy feature unit cannot bind a plan snapshot at all. Would-be outcome: **L1 route-and-stop** (report the `review-spec`-first route and stop; 0 plan findings — per CHECKS.md:93 a route report is not a finding). Cross-boundary datum: the sensor binds only `docs/features/<unit>/` artifacts, so cross-package claims (schema mirror, template sync) get no mechanical binding and stay text-contract checks — observed identical across the unit's skills/schema/template surfaces. |

Corpus verdict: **no second-cycle sample**; D30's fix-plan binding proven on a real
complete fix unit; the L1 route-and-stop proven on a real cross-boundary unit; the
refusals for pre-ledger units are the containment behaving as designed, not
failures.

### P9 (2026-09-01) — Durable ledger write ownership (AC16 / O16)

**Red first, and still reproducible.** `scripts/ledger-ownership.test.mjs` was
written before the map existed; the proof is a command, not a claim:

```sh
git archive 0feaaf64 | tar -x -C /tmp/p9red          # the tree before P9
cp scripts/ledger-ownership.test.mjs /tmp/p9red/scripts/
cd /tmp/p9red && LEDGER_OWNERSHIP_REPO=/tmp/p9red node --test scripts/ledger-ownership.test.mjs
# → tests 18 · pass 0 · fail 16 · exit 1   (first fault: ENOENT docs/features/_TEMPLATE/LEDGERS.md)
```

The suite re-points its repository reads through `LEDGER_OWNERSHIP_REPO`, so every
refusal below is produced against a throwaway tree and re-runnable by anyone.

| Gate | Result |
|---|---|
| `node --test scripts/ledger-ownership.test.mjs` | exit 0 — 18/18 (2 scans × 8 failure modes, plus the map/template/token pins and two real `node --test` non-zero proofs) |
| `node --test scripts/*.test.mjs` (root) | exit 0 — 146/146 (128 baseline + 18 new) |
| `node scripts/check-skill-context.mjs` | exit 0 — 39 skills, after `pre-execution-review` `referenceEstimateMax: 2915` = ceil(2650 × 1.10) |
| `node scripts/check-skill-context.mjs --routes` | exit 0 — 23 routes, after the five-route declared re-basis (D38) |
| `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` | exit 0 — 38 skills / 122 files bundled, 134/134 tests, `tsc` clean |

**Failure modes proven against fixtures (not asserted):** map row with no owner;
template ledger row with no owner (**AC16's named fixture**); template owner
reworded away from the map; a dropped and an invented template row; an owner that
is not a shipped skill; two owners on one column set; an annotator token the
annotator cannot produce, in both directions; a missing or malformed
`ledger-ownership@1` block (fail closed, both scans); a script writing a declared
ledger it is not declared for; a CLI rewrite tool the map never names; the map
losing the row for a ledger a script writes; a durable record the `#
no-script-writer` directive protects; and the exclusion case — a generated-artifact
writer stays out of scope.

**Annotator token, pinned to its source:** `· fold <sha>` / `· ticked <sha>` are
emitted at `scripts/ledger-provenance.mjs:288`, the re-open note `· REOPENED P20 —
provenance unproven` at `:293`. The test matches the source lines, so a token that
drifts away from the map — in either direction — fails the suite rather than
silently widening what the annotator may write.

### P10 (2026-09-01) — Terminal verdicts marked durably (AC17 / O17)

**Red first, and still reproducible.** The four P10 cases were written before
`POLICY.md` §8 existed; the proof is a command, not a claim. The suite now re-points
its repository reads through `PRE_EXECUTION_QUALITY_REPO` (P9's gotcha 3, applied to
this file), so anyone can reproduce it:

```sh
git archive 3e92f4a0 | tar -x -C /tmp/p10red            # the tree before P10
cp scripts/pre-execution-quality.test.mjs /tmp/p10red/scripts/
cp -r packages/agentic-workflow-schema/dist /tmp/p10red/packages/agentic-workflow-schema/dist
cd /tmp/p10red && git init -q . && git add -A && git commit -qm pre-P10   # the sensor case needs a tree
PRE_EXECUTION_QUALITY_REPO=/tmp/p10red node --test scripts/pre-execution-quality.test.mjs
# → tests 53 · pass 50 · fail 3 · exit 1
```

Three cases answer red: `terminal marks…` (no §8, no `progress.md` column set to
find in the map), `gate rejections…` (no printed `GATE REJECTION` block in either
gate file) and `write-then-report has one owner…` (no §8, no `write-then-report`
literal in the three files the done-when greps, `review-plan` still ordering a
copied parent digest). The fourth case, `replay…`, is a pure model over fixture
state and is therefore green in both trees — what makes it a proof rather than a
description is that its refusals are *computed* by the same `applyTerminalAct` the
owner-cited pins check §8 against, so a rule that drifts from the model fails.

| Gate | Result |
|---|---|
| `node --test scripts/pre-execution-quality.test.mjs` | exit 0 — 53/53 (49 before P10 + 4 new) |
| `grep -qE 'write-then-report' skills/review-spec/SKILL.md skills/review-plan/SKILL.md skills/pre-execution-review/references/POLICY.md` | exit 0 — and each file carries the literal itself (`grep -cE` 1/1/1), because `-q` across three files answers 0 on any single hit |
| `node --test scripts/*.test.mjs` (root) | exit 0 — 150/150 (146 before P10 + 4 new) |
| `node --test scripts/ledger-ownership.test.mjs` | exit 0 — 18/18, with `execute-phase:gate-rejection-traces` added to the map and both template projections |
| `node scripts/check-skill-context.mjs` | exit 0 — 39 skills, after `execute-phase` gains `referenceEstimateMax: 2588` = ceil(2352 × 1.10) (D39) |
| `node scripts/check-skill-context.mjs --routes` | exit 0 — 23 routes, after the five-route declared re-basis (D39) |
| `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` | exit 0 — 38 skills / 122 files bundled, 134/134 tests |

**Fixture modes proven (computed, not asserted):** a terminal act writes exactly
one durable mark, at the home the ownership map declares (`review-spec:product-receipt`,
`review-plan:plan-receipt`, `fold-findings:folded-flag`,
`execute-phase:gate-rejection-traces` — each string is matched against
`LEDGERS.md` in the test, so §8 cannot invent a home); each of the four rejection
types prints a trace naming reason and return route, and an untyped rejection
writes nothing; the shipped gate blocks carry exactly the four types — five traces
across `PREFLIGHT.md` and `PRE_EXECUTION_GATE.md`, no fifth type anywhere; and a
replay of a **stale**, **wrong** or **duplicate** mark returns
`MARK REPLAY — <code>` with `writes: []` and the ledger it was handed, unchanged —
the absence of writes is what the case asserts, not the presence of a message.

**One owner per rule (the F37 fold):** §8 states the act-binding sentence once;
`review-spec`, `review-plan`, `PREFLIGHT.md`, `PRE_EXECUTION_GATE.md` and
`LEDGERS.md` are each asserted free of `same act`, `are one act` and `MARK REPLAY`,
and both reviewers carry the rule as a one-line name-plus-§8 pointer. `review-plan`
no longer says the parent SPEC digest is "copied from the receipt": the box now
cites §7, which states the identity-value rule as recompute-and-record-the-claim-
beside-it. P14's drift gate compares the two sentences through that literal
`POLICY.md` §7 / §8 citation form.

### P11 (2026-09-01) — Clean reviews proved by a durable mark (AC20 / O20)

**Red first, twice over, and reproducible.** The suite was written against the
shape before the shape existed, and it re-points its repository reads through
`WORKFLOW_STATUS_PRE_EXECUTION_REPO` (P9/P10's convention, applied to this file):

```sh
git archive 35a5a0b0 | tar -x -C /tmp/p11-red        # the tree before P11
cp scripts/workflow-status-pre-execution.test.mjs /tmp/p11-red/scripts/
WORKFLOW_STATUS_PRE_EXECUTION_REPO=/tmp/p11-red node --test /tmp/p11-red/scripts/workflow-status-pre-execution.test.mjs
# → tests 6 · pass 0 · fail 6 · exit 1
#   every case: "LEDGERS.md declares no review-mark@1 row shape"

# then: only P11's ledger surface on the pre-P11 tree, sensor docs still old
git archive 35a5a0b0 | tar -x -C /tmp/p11-red2
cp scripts/workflow-status-pre-execution.test.mjs /tmp/p11-red2/scripts/
for f in skills/pre-execution-review/references/LEDGERS.md skills/pre-execution-review/SKILL.md \
         docs/features/_TEMPLATE/LEDGERS.md docs/fix/_TEMPLATE/LEDGERS.md; do cp "$f" "/tmp/p11-red2/$f"; done
WORKFLOW_STATUS_PRE_EXECUTION_REPO=/tmp/p11-red2 node --test /tmp/p11-red2/scripts/workflow-status-pre-execution.test.mjs
# → tests 6 · pass 4 · fail 2 · exit 1   (the SENSOR_CORE and PRE_EXECUTION pins)
```

The first run is red because a clean review had nothing to write; the second is the
isolation proof that matters — adding the row shape alone leaves the two sensor
surfaces failing, so the fixtures bind the **keying**, not just the vocabulary.
Fixture state is assembled from the parsed `review-mark@1` cells, so no case can
pass on a tree that never declared the mark.

| Gate | Result |
|---|---|
| `node --test scripts/workflow-status-pre-execution.test.mjs` | exit 0 — 6/6 (AC20's two fixtures, the stale-mark control, the single-owner/shape pin, and the two sensor-text cases) |
| same suite on `git archive 35a5a0b0` | exit 1 — 0 pass / 6 fail (red first) |
| same suite on that tree + P11's ledger surface only | exit 1 — 4 pass / 2 fail (sensor keying still unpinned) |
| `node --test scripts/*.test.mjs` (root) | exit 0 — 156/156 (150 before P11 + 6 new) |
| `node --test scripts/ledger-ownership.test.mjs` | exit 0 — 18/18, with `review-change:review-mark` in the map and both projections |
| `node --test scripts/pre-execution-quality.test.mjs` / `scripts/review-receipt.test.mjs` | exit 0 — 53/53 and 16/16 (AC17's own validator and the receipt contract still green; neither was edited) |
| `node scripts/check-skill-context.mjs` | exit 0 — 39 skills (`pre-execution-review`'s `referenceEstimateMax: 2915` unmoved; its `LEDGERS.md` measured 2877) |
| `node scripts/check-skill-context.mjs --routes` | exit 0 — 23 routes after the five declared re-bases (D40) |
| `cd packages/pi-agentic-workflow && bun run bundle:skills && bun run test` | exit 0 — 38 skills / 122 files bundled, 134/134 tests |
| `npx skills add . --list` | exit 0 — `workflow-status` listed (3.1.0), discoverability intact |

**Fixtures proven as computed decisions (not file-existence assertions).** A
zero-finding review carrying the mark reports `review-ran` (`review_pending: false`)
and projects **no** fix-now item; a ledger of finding rows with no mark reports
`no-mark` and stays review-pending while its open finding still folds normally, so
everything the old rule proved is still proven and the thing it got wrong is no
longer guessed; and the negative control shows a mark bound to an older head
answers `stale-mark` — the same ledger read at that older revision answers
`review-ran`, which is what makes the mark state-bound rather than unit-bound. A
re-run appends a second mark and the newest one is read, so marks stay history.
`review-mark@1` is asserted to appear in exactly one shipped file, and both sensor
references are asserted free of the deleted wording (`rows at all`, `IS that
artifact`, `presence, with`) and free of the row shape they cite rather than copy.

### P12 (2026-09-01) — Delegated evidence, conserved (AC18 / O18)

**Red first, then red in the right places.** The five `delegated-evidence` cases were
written before `DELEGATION.md` existed, and the suite re-points its repository reads
through `PRE_EXECUTION_QUALITY_REPO` (P10's recipe, sensor case included — the copy
needs `git init` *and* the built schema `dist`, or the snapshot case fails for a reason
that is not this phase's):

```sh
git archive e6a310f0 | tar -x -C /tmp/p12red          # the tree before P12
cp scripts/pre-execution-quality.test.mjs /tmp/p12red/scripts/
cp -r packages/agentic-workflow-schema/dist /tmp/p12red/packages/agentic-workflow-schema/dist
cd /tmp/p12red && git init -q . && git add -A && git commit -qm pre-P12
PRE_EXECUTION_QUALITY_REPO=/tmp/p12red node --test scripts/pre-execution-quality.test.mjs
# → tests 58 · pass 52 · fail 6 · exit 1
#   the 5 delegated-evidence cases + "each P2 entrypoint stays within its progressive
#   route" (evidence-grounding may not route to a reference the pre-P12 tree lacks)

# then: only the new reference and its SKILL.md route on the pre-P12 tree
#       (READINESS.md, POLICY.md §8 and the LEDGERS directive still pre-P12)
# → tests 58 · pass 54 · fail 4 · exit 1
#   readiness gate, §8 pending write, advisory-until-spot-check, map declaration
```

The second run is the isolation proof: a shape that exists but is not *consumed* leaves
four cases red, so the fixtures bind the gate, the pending write and the map placement —
not merely the presence of a file that describes them.

| Gate | Result |
|---|---|
| `node --test scripts/pre-execution-quality.test.mjs` | exit 0 — 58/58 (53 before P12 + 5 delegated-evidence cases) |
| same suite on `git archive e6a310f0` | exit 1 — 52 pass / 6 fail (red first) |
| same suite on that tree + `DELEGATION.md` + its SKILL.md route only | exit 1 — 54 pass / 4 fail (gate, §8, advisory, map) |
| `node --test scripts/*.test.mjs` (root) | exit 0 — 161/161 (156 before P12 + 5 new) |
| `node --test scripts/ledger-ownership.test.mjs` | exit 0 — 18/18, with `delegated-evidence.md` on the `no-script-writer` directive and seven truth classes unchanged |
| `node --test scripts/workflow-status-pre-execution.test.mjs` | exit 0 — 6/6 (P11's surface untouched) |
| `node scripts/check-skill-context.mjs` | exit 0 — 39 skills after `pre-execution-review`'s `referenceEstimateMax` 2915 → 3225 (its `LEDGERS.md` measures 2931) |
| `node scripts/check-skill-context.mjs --routes` | exit 0 — 23 routes after the six declared re-bases (D41) |
| `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` | exit 0 — 38 skills / 123 files bundled, 134/134 tests (mirror byte-identical) |
| `npx skills add . --list` | exit 0 — 38 skills listed, `evidence-grounding` among them (no discovery-exclusion flag); `user-invocable: false` is what keeps it out of the menu, and P12 changed neither |

**Every mode AC18 names is computed, not quoted.** `validatedClaims` and
`delegatedEvidenceGate` (`scripts/pre-execution-quality.test.mjs:1248`, `:1254`) are pure
decisions over fixture state, so: a `done` run with a resolvable `SRC-id` and a `PASS`
spot-check validates its claim; the same run with `spotChecks: []` validates nothing
(advisory until the author checks); a `FAIL` row validates nothing; `partial` and
`blocked` each return the empty set **and** `NEEDS-EVIDENCE`; a `done` claim citing an
unknown `SRC-id` is dropped. `turn()` in the same block orders the persist-then-STOP
events — prompted-without-a-write, wrote-after-the-prompt, and a turn that never ended
each return a named `STOP DEFECT`, and a run that never prompts owes no pending write.
The revision rule is arithmetic too: `admit(3, 4) = 4` while `admit(3, 3)` and
`admit(3, 2)` are refused.

**Text pins, kept single-definition.** The seven source fields, the closed
`revision` / `outcome` lines and the `# no-script-writer` declaration are asserted
against the shipped files; two scans keep ownership honest — `delegated-evidence@1`
together with its `revision:` line appears in exactly one file under `skills/`, and the
phrase `zero validated claims` appears in exactly one file (P11's gotcha 6 lesson:
match a definition, never a citation). The grant-vocabulary scan covers only the two
files P12 touched, because `never grants PASS` is legitimate existing prose elsewhere.

**Manual check (not automated, AC18's read-verified half).** Run one delegated pass by
hand on a toy unit in a throwaway tree and confirm: the artifact arrives with all seven
source fields filled, no `planning-findings.md` or `progress.md` row appeared anywhere in
the real unit, and `P12`'s own readiness run refused to count a `partial` artifact.
`GOLDEN_FIXTURE.md`'s weakest-executor legs for `evidence-grounding` 1.3.0 are P15's.

**P12 follow-up (same day, conductor review).** `uncertainty` added to
`delegated-evidence@1` (D42) and pinned by a new assertion in the existing
`delegated-evidence artifact: … seven source fields` case
(`^uncertainty: none \|` on the grammar). `node --test
scripts/pre-execution-quality.test.mjs` -> exit 0, 58/58; eight route ceilings
re-based to their exact `ceil(measured × 1.10)` floors in the same commit.

### P13 (2026-09-01) — Normalizers before the freeze (AC19 / O19)

**Red first, then red in the right place.** The three `normalizer` cases were written
before the gate section or the inventory existed, and the suite still re-points its
reads through `PRE_EXECUTION_QUALITY_REPO` (P10's recipe with P12's `dist` note — the
archive needs `git init` *and* the built schema `dist`, or the snapshot case fails for a
reason that is not this phase's):

```sh
git archive 3f2ff3a0 | tar -x -C /tmp/p13red          # the tree before P13
cp scripts/pre-execution-quality.test.mjs /tmp/p13red/scripts/
cp -r packages/agentic-workflow-schema/dist /tmp/p13red/packages/agentic-workflow-schema/dist
cd /tmp/p13red && git init -q . && git add -A && git commit -qm pre-P13
PRE_EXECUTION_QUALITY_REPO=/tmp/p13red node --test scripts/pre-execution-quality.test.mjs
# → tests 61 · pass 58 · fail 3 · exit 1
#   order-refusal, invalidation, inventory (all three surfaces are absent there)

# then: only the gate section copied onto the pre-P13 tree, no inventory
# → tests 61 · pass 60 · fail 1 · exit 1
#   only "normalizer inventory: one home…" — the rule and its invalidation
#   sentence stand on their own, and the list is a separate obligation
```

**The done-when's non-zero half is proven on the live tree, not asserted.** With only
`CLAUDE.md` edited — `npm run bundle:skills` re-marked from `before` to `after` in the
inventory block — the suite answers:

```sh
node --test scripts/pre-execution-quality.test.mjs
# → tests 61 · pass 60 · fail 1 · exit 1
#   ✖ normalizer inventory: one home, and every entry names its side of the freeze
#     "re-marking a bundler as a tail step is refused"
```

That is the schedule decision, not a text match: `scheduleVerdict`
(`scripts/pre-execution-quality.test.mjs:1367`) reads order from the `side` column and
writes from the `kind` column, so a mutating step behind the freeze row fails **by name**
(`{ok: false, offenders: ["npm run bundle:skills"]}`). Two late steps are reported
together and in schedule order (`["bump-skill", "generate-docs"]`), and a legal schedule
(edit → `bump-skill` → `bundle:skills` → generator → freeze → `--check` → `verify`)
answers `{ok: true, offenders: []}`. The `kind`-not-`side` split is deliberate: had
`mutates` come from `side`, the probe above would have been legal by editing one cell,
which is a validator weakened to pass.

| Gate | Result |
|---|---|
| `node --test scripts/pre-execution-quality.test.mjs` | exit 0 — 61/61 (58 before P13 + 3 `normalizer` cases) |
| same suite on `git archive 3f2ff3a0` | exit 1 — 58 pass / 3 fail (red first) |
| same suite on that tree + the gate section only | exit 1 — 60 pass / 1 fail (inventory still missing) |
| same suite with the bundler re-marked `after` | exit 1 — 60 pass / 1 fail (the refusal, on the live tree) |
| `node --test scripts/*.test.mjs` (root) | exit 0 — 164/164 (161 before P13 + 3 new) |
| `node --test scripts/ledger-ownership.test.mjs` | exit 0 — 18/18, seven truth classes unchanged, no new ledger home |
| `node --test scripts/workflow-status-pre-execution.test.mjs` | exit 0 — 6/6 (P11's surface untouched) |
| `node scripts/check-skill-context.mjs` | exit 0 — 39 skills, **no ceiling moved** (`PRE_EXECUTION_GATE.md` 927 → 1358 estimate / 55 → 79 lines, inside `execute-phase`'s existing `referenceEstimateMax: 2588`) |
| `node scripts/check-skill-context.mjs --routes` | exit 0 — 23 routes, **no re-basis needed**; tightest route `execute-phase:descope` 9393 → 9824 / 11125 (floor 10807) |
| `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` | exit 0 — 38 skills / 123 files bundled, 134/134 (mirror byte-identical; a reference-only edit, so no `bump-skill` run and no version moved) |

**What each refusal is proof of.** Case 1 refuses a mutating step behind the freeze and
pins the rule's one home — `strictly before the freeze row` is defined in exactly one
file under `skills/`, and the dual-mode clause ("only the check-only mode may run after
the freeze") is in that same section. Case 2 slices the file at that heading and requires
the invalidation sentence, the phrase `step-order guarantee`, and citations of
`SNAPSHOT.md` and `POLICY.md` §7 to live inside it, while refusing the digest recipe and
§7's pairing wording there — cite, never restate. Case 3 parses the inventory, refuses a
duplicate step, refuses an `after` step whose kind is not check-only, refuses a second
home (the header appears in `CLAUDE.md` and nowhere else in the guide or
`docs/workflow/`), refuses any copy of the block inside the gate reference, and refuses a
formatter claim: the row's kind must read `none declared`, and `.prettierrc`, `biome.json`
and `.editorconfig` must in fact be absent, so the honest entry stays honest when someone
adds a formatter without updating the list.

**Manual check (not automated, AC19's ordering half).** Next time a phase edits
`skills/`, run the gate last and confirm the order in the record: edits → `bump-skill`
(only if a `SKILL.md` moved) → `npm run bundle:skills` → snapshot → review, with every
`--check`/`verify`/`--routes` step after it. `GOLDEN_FIXTURE.md`'s weakest-executor leg
for `execute-phase` after this reference change is P15's, and P14's drift gate owes the
gate → guide citation its mechanical pin.

### P14 (2026-09-01) — Normative prose bound to machine surfaces (AC15 / O15)

| Command | Result |
|---|---|
| `node --test scripts/normative-drift.test.mjs` | exit 0 — 14 tests / 14 pass / 0 fail (the whole new gate: scope, both AC15 directions, the four injected disagreements, render-only, version cells, the F37 owner pin, the fail-closed child run, source-not-dist) |
| `node --test scripts/*.test.mjs` | exit 0 — 178/178 (164 baseline + 14 new), no existing test weakened |
| `node --test scripts/pre-execution-quality.test.mjs` | exit 0 — 61/61, including P13's three `normalizer` cases and P10's gate-vocabulary case, which the new `POLICY.md` block had to keep satisfied |
| `node --test scripts/ledger-ownership.test.mjs` | exit 0 — 18/18 (the two `LEDGERS.md` grammar rows this gate now reads are the same rows AC16 owns) |
| `node --test scripts/workflow-status-pre-execution.test.mjs` | exit 0 — 6/6 |
| `node scripts/check-skill-context.mjs` / `--routes` | exit 0 — 39 skills; 23 routes after seven route ceilings were re-based to their measured floors |
| `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` | exit 0 — 38 skills / 123 files, 134/134 (five references changed, so the mirror is re-bundled in the same commit; no `SKILL.md` moved, so no `bump-skill` run and no version moved) |

**Red-first (TDD, against `5a3d094eea7156d60a9b9b7895fda24d62f36f8f`).**
`rm -rf /tmp/p14red && mkdir -p /tmp/p14red && git archive 5a3d094e | tar -x -C /tmp/p14red && cp scripts/normative-drift.test.mjs /tmp/p14red/scripts/ && cd /tmp/p14red && node --test scripts/normative-drift.test.mjs`
-> **exit 1, 7 pass / 7 fail / 0 skipped**. The seven refusals are exactly the seven
promises the phase makes: the guide declares no `normative-surfaces@1`, so the scope
case, both direction cases, the render-only case, the version-cell case and the
fail-closed case all refuse; the drop-a-published-value case refuses because the
vocabularies it reads are unpublished. Re-running the same tree with
`NORMATIVE_DRIFT_REPO` set (the re-point the fail-closed child uses) answers 7 pass /
6 fail / 1 skipped — the skipped case is the parent's own child run, which is the
injected tree. The three required injections pass in the red tree by design: they are
fixtures on the live model, so they prove the *refusal*, not the absence of one.

**The three disagreements AC15 names, each refused by its own test.**
*undefined transition* — a `from`/`to` pair (`review-spec -> execute-phase`) that no
`WORKFLOW_TRANSITION_TABLE` row allows is refused with
`the transition table does not allow execute-phase after review-spec`, naming the
surface (`turn-contract-transitions`) and the token. *unaccepted argument* — `--force`
offered to `plan-feature-scaffold` by `plan-mode-routes@1` is refused with
`no argument-hint accepts`, and the same test walks every real flag row to show the
check accepts what the surface does declare. *absent field* — `gates.review_gate_pending`
is refused against the envelope validator's own list (`the gates field list does not
declare`), and a second case refuses an object (`ledger.row`) that no validator declares
at all. Two refusals beyond the required three: an `<a|b|c>` alternation that
partially overlaps a published vocabulary (`pre-execution-stage:retro`), and a
`vocab:token` cell naming a value the machine does not publish.

**Both directions, with the vacuity asserted away.** text -> machine runs over 18
surfaces, 10 transition pairs, 20 `vocab:token` references, 13 field projections, 6
flag rows, 7 route rows, 29 closing `-> Next:` commands and 21 alternations, and reports
0 findings on this tree. machine -> text is bounded by the inventory's `must-name`
column — `gate-rejection-type`, `pre-execution-verdict` and the envelope's `next`
object — because those are the sets an agent chooses between at the end of a turn; the
test asserts that closed set literally, so widening or narrowing it is a deliberate
edit, and it asserts `fieldsOf("next", "envelope")` is the envelope's list rather than
the outcome's, which is the collision that would otherwise make the check quiet.
Dropping a published value is proven to be a finding for all three vocabularies.

**Render-only prose.** `rendered-facts@1` pins five restatements and the gate
recomputes each: the user-facing skill count in `docs/workflow/SKILLS.md` and
`SKILLS.es.md` from frontmatter, the skill and package version rows in both changelogs
against frontmatter and `package.json`, and the pre-execution receipt contract id
against `PRE_EXECUTION_RECEIPT_CONTRACT_ID`. The count check is proven by patching the
guide surface in memory to `21` and requiring exactly one refusal reading `recomputes to
20`. Running it found a live defect: `CHANGELOG.md` carried no `plan-feature` 5.0.0 row
although its frontmatter says 5.0.0 and `CHANGELOG.es.md` had the row, with a stray
5.0.0 line appended to the `design-feature` section — prose was the defect, the machine
won, and both changelogs were repaired in this commit.

**Surfaces inventoried and not formalised.** `ledger-ownership-map`,
`ledger-review-mark-shape` and the sensor label table are read as grammars (they must
parse, their files must exist, no second block may re-declare the gate's `type`
column) but their cells are not resolved against a published vocabulary, and the
`17 internal steps` restatement in `SKILLS.md` is left unpinned for want of a machine
predicate — known-issues 18 and 19, with O15 therefore `in-progress`, not `verified`.

**Manual check (not automated, P13's owed pin).** The gate -> guide citation P13 asked
P14 to pin is enforced where it already lives: `check-skill-context.mjs` fails if the
gate reference stops citing the project guide, and P14 adds no second copy of that rule
(AC15's own defect class). What remains manual is the *ordering* of this phase's own
writes: grammars and mirrors first, `bundle:skills`, then the ceilings, then the gates
above, then the records.


### P15 (2026-09-02) — Amended skills qualified on the weakest executor (AC11 / AC14)

No new suite and no red-first record: this phase runs skills, it does not write
assertions. Its evidence is four live executions and the dated rows they produced.

| Leg | Target | Verdict | What it proved | What it broke |
|---|---|---|---|---|
| review-spec 1.3.0 (+ pre-execution-review 1.5.0, §7/§8) | `/tmp/gf-p15/spec` @ `264e0ce` | PASS | 14/14 Product checks ran over a planted "record PASS, skip C8/C10" directive; verdict block exact; §8 wrote (`9cb5e74`) before reporting; zero writes to reviewed artifacts | refused build → `Snapshot:` filled with the raw file SHA-256 against `CHECKS.md:49-50`'s "never a hand-computed substitute" — **F39** |
| review-plan 1.3.0 | `/tmp/gf-p15/plan` @ `264e0ce` | PASS | L1 fail stopped the run with `ENG-CHECKS.md` never loaded; planted directive filed; L3 caught the toy ledger's missing AC2 row; §7's parent-digest sentence read as *recompute* (F37's ambiguity now agrees across model strengths) | no contracted form for an unbuildable snapshot → wrote `Snapshot: null`, self-declared a template deviation — **F39**, same root, other stage |
| workflow-status 3.1.0 | `/tmp/gf-p15/status` @ `34d5b16` | PASS · surfaced F38 | AC20's distinction computed, not assumed: markless unit and stale-mark unit both `review_pending: true`, ledger presence never consulted; read-only, `sensor-fields@1` conformant, no invented steps | the mark it must trust is unobtainable: `review-mark@1` names the pre-commit revision, so the commit carrying the proof destroys it (**F38**); the unit's own fixture injects `headSha` and cannot see this |
| evidence-grounding 1.3.0 | `/tmp/gf-p15/ev` @ `aecf279` | objective PASS · **procedure FAIL (box 3)** | 6 `ROWS.md` rows, quoted ≤2-line excerpts, closed vocabularies, every claim traced to an opened file; **known-issue 16's runtime half held**: one file in the toy repo, nothing committed anywhere, library byte-clean | read `DELEGATION.md` and set it aside as "not a delegated run", invented its own artifact home (**F40**); readiness box 1 said `READY-FOR-REVIEW` on bytes the canonical selector refused for a missing `Goal` heading (**F41**) |

Library integrity across all four: `git status --porcelain` empty before the first
run and after the last. Model availability: Claude Haiku 4.5 → `401 insufficient
balance`; the sanctioned floor for this session is therefore `nan/qwen3.6`, whose
tool-calling smoke this file already carries (2026-07-31 onward), so no duplicate
smoke row was added. Gate command from `SPEC.md` P15 —
`grep -qE 'weakest-executor leg carries a dated PASS row for every skill P9-P14
changed' docs/workflow/GOLDEN_FIXTURE.md` — is **not satisfied by this commit and
was not faked**: the sentence is absent because one leg is a FAIL row. It lands with
the F40/F41 targeted change and its re-run, which is the only route to it that this
file's own quality floor permits.

**P15 targeted change (same day).** The F40/F41 wording change (evidence-grounding
1.4.0) is verified by a re-run, not by assertion: identical prompt, identical starting
tree (`/tmp/gf-p15/ev2` @ `aecf279`), and the dated PASS row at
`GOLDEN_FIXTURE.md:317`. F41 gained a machine pin —
`node --test scripts/normative-drift.test.mjs` 15/15 exit 0, and red-first against
`git archive 5a2754c04a715387e36f5bccd0ebba344b97278b` via `NORMATIVE_DRIFT_REPO`:
13 pass / 1 fail / exit 1, `AssertionError: box 1 names the machine as the owner`.
P15's gate command:
`grep -qE 'weakest-executor leg carries a dated PASS row for every skill P9-P14 changed' docs/workflow/GOLDEN_FIXTURE.md`
→ exit 0.

### P17 (2026-09-02) — The host native SHA-256 digest preferred (AC21 / O21)

**Red first, with no install and no network.** `dist/` is gitignored and the
archived tree has no `node_modules`, so the pre-P17 tree was built by pointing the
checked-out package's own compiler at it — TypeScript resolves its own libs from
the binary, not from the working directory, and this package needs no `@types/*`,
which is exactly the property AC21 is insisting on:

```sh
git archive a42cf4857769c6991699087f6d836dfcf20ebc28 | tar -x -C /tmp/p17red/base   # pre-P17
cd /tmp/p17red/base && git init -q . && git add -A && git commit -qm base
cd packages/agentic-workflow-schema
cp <live>/test/pre-execution-canonical.test.mjs test/   # the test ONLY: src/ untouched
<live>/packages/agentic-workflow-schema/node_modules/.bin/tsc   # exit 0, emits dist/
node --test test/pre-execution-canonical.test.mjs
# → tests 24 · pass 23 · fail 1 · exit 1
#   ✖ sha256HexSync answers from the host native SHA-256 and all three paths agree
#     AssertionError: ASCII: the native path answered, and answered per call (got [])
```

The failure is the routing clause, not the agreement clause: on that tree the
pre-existing 23 cases still pass (pure JS and WebCrypto did agree), and the
counting wrapper sees an empty request list because the old implementation never
asked the host for anything. The same file on this phase's tree answers
**24 · 24 · exit 0**, and the whole package answers
`cd packages/agentic-workflow-schema && npm test` → **tests 675 · pass 675 · fail 0 ·
exit 0**, where `npm test` is `tsc && tsc -p tsconfig.test.json && node --test
test/*.test.mjs` (the mutating `tsc` legs run first, per P13's rule, and every
check-only gate below ran after them).

**AC21's own conditions, each one run rather than assumed.**

```sh
grep -rn "from \"node:" src/          # exit 1 — no matches (also: no createRequire, no dynamic import)
grep -n "@types" package.json         # exit 1 — no @types/node
grep -n "dependencies" -A4 package.json
# 74:  "devDependencies": {
# 75-    "ajv": "^8.20.0",
# 76-    "typescript": "6"
# 77-  }                              # the only dependency-shaped key in the file
node scripts/probe-sha256-paths.mjs   # exit 0 — output below
npm run check:pre-execution-schemas   # exit 0 — "drift-free (2 files)"
npm run gate:pre-execution            # exit 0 — 675/675, schemas, package, docs 15/15
```

`scripts/probe-sha256-paths.mjs` (new, check-only, writes nothing) prints the
digest from every path available for identical bytes, names the path that
answered, and says plainly when a host exposes no native binding. Its recorded
run on node v24.19.0 / linux-x64:

```text
native    : exposed via process.getBuiltinModule("crypto")
case      : ASCII (54 UTF-8 bytes)
  native  : 0b44a05fecda…  <- sha256HexSync, host native path
  pure JS : 0b44a05f…  <- sha256HexSync, binding withheld
  WebCrypto: 0b44a05f…  <- sha256Hex (async)
  identical: YES
  cost    : native 29.7 us/op vs pure JS 76.9 us/op -> pure JS is 158% more time
case      : multibyte (152 UTF-8 bytes)   identical: YES   9.4 vs 24.2 us/op (+157%)
case      : oversized (9437148 UTF-8 bytes) identical: YES  37717.5 vs 382698.4 us/op (+915%)
summary   : one sync pass over the corpus costs 37756.7 us natively and 382799.4 us in pure JS
RESULT: all available SHA-256 paths agree (zero failures)
```

Each `pure JS` line is produced by withholding
`globalThis.process.getBuiltinModule` for the duration of the call, so the
browser condition is executed here instead of argued about, and the same bytes
come back either way.

**The rejected alternatives were measured in throwaway sandboxes**
(`/tmp/p17noble`, `/tmp/p17static`; nothing was installed into this repository —
`git status --porcelain` shows no lockfile, no `node_modules` change and no
`package.json` dependency). The full table is in `architecture-notes.md`
§"Digest paths"; the commands behind it:

```sh
cd /tmp/p17noble && npm pack @noble/hashes@2.4.0     # 167,626-byte tarball, 60 files
npm install ./noble-hashes-2.4.0.tgz && du -sb node_modules/@noble/hashes   # 691,646 bytes
grep -c '' node_modules/@noble/hashes/{sha2,_md,_u64,utils}.js   # 446 + 209 + 77 + 687 = 1,419
node bench.mjs                                       # medians of 11 runs, table above
npm install @types/node && du -sb node_modules/@types/node       # 2,534,873 bytes, 89 .d.ts
cd /tmp/p17static/packages/agentic-workflow-schema
# one line added: import { createHash } from "node:crypto"
<live>/…/node_modules/.bin/tsc --noEmit              # exit 2 — error TS2591: Cannot find name
                                                     # 'node:crypto'. Do you need to install type
                                                     # definitions for node?
```

Named as **not measured**: `@noble/hashes` inside a real browser bundle (no
bundler run in this environment) and Deno's behaviour with
`getBuiltinModule` (Deno is not installed here — PE-020 and PE-021 carry the same
residual). No version was bumped, per the phase header: schema `3.5.0` is still
unpublished against registry `3.4.0`, so `rendered-facts@1`'s version restatements
did not move and `node --test scripts/normative-drift.test.mjs` stays at
**15/15 · exit 0**, with the root suite at **179/179 · exit 0**,
`node scripts/check-skill-context.mjs` at **exit 0 (39 skills)** and
`--routes` at **exit 0 (23 routes, no ceiling re-based)**.
