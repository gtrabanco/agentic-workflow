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
