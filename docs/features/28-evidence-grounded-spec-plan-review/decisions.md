# decisions — 28-evidence-grounded-spec-plan-review

## Product decisions

- **PD1 — Human product authority:** `design-feature` may structure and
  challenge intent, but missing scope/outcome/role/authority choices return to
  the user.
- **PD2 — Two public review stages:** expose `review-spec` and `review-plan`;
  do not expose generic closure or separate fix/fold commands.
- **PD3 — Existing author repairs:** Product findings return to
  `design-feature`; Engineering findings return to `plan-feature` or
  `plan-fix`.
- **PD4 — No majority closure:** material findings are unioned and dismissed
  only by counter-evidence. Same-model clean contexts are not called diverse.
- **PD5 — Complete current unit:** no automatic issue or deferred row may stand
  in for a reviewed current-unit obligation without a user-approved amendment.
- **PD6 — Manual first-class:** sequential fresh conversations can run the
  complete workflow; AWL automates rather than defines it.
- **PD7 — One repair is normal, two is anomalous:** correctness remains
  fail-closed, but release qualification treats entry into a second
  repair/re-review cycle as evidence that readiness, evidence, design, planning,
  or routing is defective and requires root-cause correction.

## Engineering decisions

- **D1 — One additive contract family:** pre-execution contracts are distinct
  from candidate review and staged verification but reuse canonical package
  patterns and `SkillOutcome` routing.
- **D2 — Stable Product projection:** `spec-product-v1` selects the title,
  Goal, Branch, Size, Dependencies, Product half, and Design status; a Plan
  snapshot binds the resulting Product snapshot digest and the whole applicable
  plan artifact set.
- **D3 — Causal plus content identity:** exact hashes catch content drift;
  authoring-owned `artifactRevisionId` catches a new causal revision with the
  same bytes. Neither is misrepresented as sufficient alone.
- **D4 — Runtime semantic authority:** one package validator path owns PASS;
  JSON Schemas are generated structural projections.
- **D5 — Internal grounding owner:** authors share one non-authoritative
  claim/evidence/freshness/unknown contract and cannot convert its result into
  approval.
- **D6 — Existing state machine:** add review intents/evidence/profiles/routes
  to current schema owners; do not build a parallel SDD lifecycle.
- **D7 — Fix compatibility:** `plan-fix -> review-plan` verifies reproduction,
  root cause, regression, scope, and rollback without a feature Product half.
- **D8 — Keep internal name:** narrow `plan-feature-from-issue` to Product
  ownership and a SPEC-review handoff; defer renaming because it adds no
  correctness value.
- **D9 — Additive release:** bump the schema package from 3.4.0 to 3.5.0 and
  version/changelog every changed skill using repository tooling.
- **D10 — Evidence before claims:** ship a canary protocol and record observed
  or explicitly unavailable data; do not claim token/rework reduction from the
  design alone.
- **D11 — Progressive readiness:** authors inventory, evidence, draft, and run a
  deterministic readiness preflight before independent review. The preflight
  cannot approve its author's artifact.
- **D12 — Compact planning evidence:** bind `planning-evidence.md` (M/L) or the
  equivalent SPEC section (XS/S) into Plan authority; pass only phase-relevant
  rows to execution, never the raw exploration transcript.
- **D13 — Convergence diagnosis:** the first unioned findings set is repaired as
  one owner-bounded batch. A second cycle emits `CONVERGENCE-ANOMALY`; operational
  budgets never convert the anomaly or an open finding into PASS.
- **D14 — Distributed internal marking:** `evidence-grounding` ships as
  `user-invocable: false` without `metadata.internal: true`, registered in
  `.claude-plugin/plugin.json` and `skills.sh.json`, because that flag is the
  skills-CLI exclusion lever (#96) and a distributed skill wrongly carrying it
  is silently omitted from installs (#141). Lint rule 7 and the
  `bounded-delivery-loops` guard keep the marking valid.
- **D15 — One PR releases both packages:** the schema package releases as
  additive `3.5.0` from P1 and the Pi package bumps `0.1.0 -> 0.2.0` in P5's
  terminal pre-merge step after the last bundle rebuild;
  `publish-pi-package.yml` publishes on merge only when its version is newer
  than the registry, so the final hardening step makes the terminal candidate
  release-ready.
- **D16 — Parent topology is binding-time, not well-formedness:** the red-first
  receipt suite pins that a plain-reviewer receipt carrying parents passes
  `validatePreExecutionReviewReceiptV1` and is refused with `invalid-topology`
  only by `validatePreExecutionReceiptAgainstSnapshot`. The shared rule engine
  therefore gained an `enforcement: "walk" | "binding"` flag: the Draft-07
  projection renders `parent-topology-shaped`/`parent-topology-restrained`, the
  plain walk skips binding rules, and the binding authority re-applies them over
  the same captured document via the exported `applyCrossRule`. One definition,
  no second inline copy of the constraint.
- **D17 — Published-surface fidelity on the shared canonicalizer:** (a) the
  verification family's over-budget `TypeError` keeps its pinned `D14` marker
  (`F91`) through a `budgetTag` option on the shared canonicalizer — the
  pre-execution family leaves it unset; (b) the projection test's path-rule
  fragment `or ".." segments` is matched in its SERIALIZED form, because
  `JSON.stringify` always escapes the description's double quotes and a raw
  quoted fragment can never appear in serialized bytes — the assertion as first
  written was unsatisfiable under any implementation and was amended, not
  weakened (the rule, its pattern, and its description are unchanged).
- **D18 — `evidence-grounding` carries no model tier:** it is internal and
  always composed inside its caller's turn, so its work already runs at the
  caller's tier (`design-feature` = opus/high). `model-routing.yml` routes only
  entrypoints, and the precedent is explicit: `phase-contract`,
  `verification-contract` and `planning-preflight` are referenced from routed
  entrypoints and carry no route of their own. Adding a route for it would
  imply it can be invoked, which the SPEC forbids (`SKILL.md:133`).
- **D19 — P2 recalibrated the frozen route budgets:** the frozen manifest pinned
  `plan-feature:scoped` at 6337/536 and `plan-feature:issue` at 7786/687, both
  measured *before* the Product-review gate existed. A gate this skill must
  emit cannot fit the old ceiling, so the two routes were raised to
  7610/643 and 9970/814 and the two new routes registered
  (`design-feature:product` 11950/864, `review-spec:default` 4690/352). This
  follows the recorded feature-21 precedent ("budget manifest recalibrated to
  the new steady state") rather than truncating mandatory contract text. Each
  figure is a measured steady state, not a padded maximum: `check-skill-context
  --routes` passes with the smallest route-specific buffer in the manifest.
- **D20 — XS/S embeds both planning ledgers in the SPEC:** the snapshot then marks
  the `planning-evidence` and `obligations` context rows `absent` because their
  bytes are already bound by the whole-`spec` row, rather than splitting the SPEC
  to manufacture two files. Symmetrically an M/L unit that embedded its tables is
  a `review-plan` finding: one artifact, one complete table, and the reviewer
  always reads the whole table while execution reads a phase slice.
- **D21 — Route budgets model steps, not skills:** after P3 a planning invocation
  loads the shared owners, so `plan-feature` split into `:scoped` (router + gates,
  7610) and `:scaffold` (authoring + ledgers, 12700) and `design-feature` into
  `:product` (11950) and `:repair` (15800, the only step that loads
  `pre-execution-review`'s cycle policy). Inflating one ceiling to the worst-case
  union of every step would have hidden the real per-turn cost; each declared
  ceiling is the measured steady state of the step that actually loads those files.
- **D23 — `--force` never reaches the pre-execution gate:** the flag exists to let a
  human re-order *ordering* stops (dependency, own-status), which are statements about
  sequence the user may legitimately overrule. A review PASS is a verdict about
  quality that only an independent reviewer can produce, so the executor has nothing
  to assert over it; making it forceable would have turned the phase's headline
  guarantee into a warning. The gate therefore stops the turn and names `/review-plan`.
- **D24 — the owning stage routes a finding, the class only sizes the work:**
  `fix-now` kept meaning "belongs to this unit" while routing began keying on
  `product | plan | source | environment | runtime`, because the P3 ledgers proved one
  root cause can surface as several code-level findings. Folding a `plan`- or
  `product`-owned row would silently rewrite authority with candidate code, so
  `loop-review-fold` blocks instead and hands the row to its author plus a re-review;
  the fold-ledger schema is unchanged (the owner rides the existing `route` cell).
- **D25 — (numbered `D22` until finding RS7; `D23`/`D24` were already taken) —
  `pre-execution-review` is the single owner of the shared cycle and the
  ledger shapes, not of verdicts:** `review-spec`/`review-plan` emit verdicts, the
  authoring skills emit readiness, and this internal owner emits nothing — the
  suite asserts that the three ledger column lists appear in exactly one file in
  the tree, which is what keeps the P2 spec-side text and the P3 plan-side text
  from drifting apart later.

- **D26 — (numbered `D22` until finding RS7) — Route-ceiling headroom policy (F7,
  user decision 2026-08-31):** budget
  ceilings are re-baselined to `ceil(measured × 1.10)` at declared re-basis
  points, every ceiling raise must name its real growth source in the commit and
  changelog row, and ceilings are re-based down when trim work lands. Declared
  after F7 showed the audit-pr route ceilings pinned at exactly the measured
  value (0 % headroom — the guard could not trip) with a misattributed bump
  rationale (`857aa54b`); the live demonstration was the F1 fold tripping the
  guard with a 3-line doc correction. Applied now to `audit-pr:feature/fix`
  (9501/614 from measured 8637/558) and `plan-fix:issue` (18551/1429 from
  measured 16864/1299, F8's re-basis); the remaining 21 routes re-baseline at
  their next declared point. Unblocks F8's fold; the plan-fix:issue
  duplication trim stays with debt item D2 and its recorded trigger.

## Author repair batch — 2026-08-31 (findings RS3, RS8, RS12, RS13, RS14)

- **D27 — the machine manifest is the record of a ceiling, and every declared
  figure now trails it (RS8 + RS12).** The decision records fell behind the
  budgets JSON: D19 declared `review-spec:default` at 4690/352 while the manifest
  carried 11000/800, and D21 declared `plan-feature:scaffold` 12700 /
  `design-feature:repair` 15800 while the manifest carried 15500/1200 and
  18000/1300. The bridging commit (`857aa54b`) is the one D26 itself discredits
  ("misattributed bump rationale"), so no figure is inherited from it and nothing
  was reconstructed from it here. Re-declared from measurement instead —
  `node scripts/check-skill-context.mjs --routes --json` at this commit:

  | Route | Measured (est/lines) | Before (est/lines) | Declared now |
  |---|---|---|---|
  | `review-spec:default` | 10196 / 725 | 11000 / 800 | **11216** / 800 |
  | `review-plan:default` | 11605 / 775 | 12500 / 850 | **12766 / 853** |
  | `design-feature:product` | 11940 / 849 | 11950 / 864 | **13135 / 934** |
  | `design-feature:repair` | 17284 / 1219 | 18000 / 1300 | **19013 / 1341** |
  | `plan-feature:scoped` | 7496 / 620 | 7610 / 643 | **8246 / 682** |
  | `plan-feature:scaffold` | 14334 / 1093 | 15500 / 1200 | **15768 / 1203** |
  | `plan-feature:issue` | 9765 / 782 | 9970 / 814 | **10742 / 861** |
  | `review-change:default-backend` / `:default-web` | 12540 / 926 | 12750 / 949 | **13795 / 1019** |
  | `review-change:synthesize` | 13007 / 948 | 13240 / 972 | **14308 / 1043** |
  | `review-change:adversarial` | 14192 / 1034 | 14485 / 1062 | **15612 / 1138** |

  Growth source for each raise is the same event: D26's declared floor became
  machine-enforced (below), so every route under it had to be re-baselined at one
  declared point instead of tripping mid-correction. `audit-pr:feature/fix`
  (9501/614) and `plan-fix:issue` (18551/1429) already sat exactly on the floor
  from D26's own re-basis and were not touched, and the twelve routes at or above
  10 % (`execute-phase:*` 20–22 %, `loop-review-fold:default` 36 %) were not
  lowered: re-basing **down** stays a declared act tied to trim work (debt item
  D2), never a side effect of this check.
  Rule adopted with it: a decision record that names a ceiling states the
  measured value beside it, and the manifest is authoritative when the two differ.
  **Superseded for seven route entries by D31**, which re-based the same manifest
  inside the same batch: this table was measured before the batch finished editing
  the reference files its routes load.

- **D28 — the headroom policy binds mechanically (RS12).** D26 was recorded in
  `SKILL_CONTEXT_BUDGETS.json` as a `policy` block that **nothing read**:
  `scripts/check-skill-context.mjs` compared measured against
  `routeEstimateMax`/`routeLinesMax` and stopped there. The check now reads
  `policy.relative-headroom` and fails any route whose ceiling sits below
  `ceil(measured × (1 + headroom))`, naming both numbers, while a ceiling the
  measured value has already passed stays reported as the tighter fault (the
  breach, not the floor). The floor is deliberately one-way — trim widens
  headroom and must not be punished by a check that demands a re-basis. Covered by
  `scripts/check-skill-context.test.mjs`: an inflated declared headroom fails the
  estimate and the lines dimension separately, and the **shipped** manifest must
  satisfy its own policy. Counter-evidence against the finding's magnitude, kept
  visible rather than silently dropped: RS12 claimed "21 of 23 routes still sit at
  0.08–2.1 % headroom"; measured before this repair it was **11 of 23** routes
  below the 10 % floor (0.08 %–10.34 %, 11 on estimate and 10 on lines), with the
  other twelve at or above it. The defect was real; the count was not.

- **D29 — snapshot identity is content-derived, and `verify` names what drifted
  (RS3(b), RS13).** Two halves, both in the mechanical sensor:
  1. `build` defaulted `sourceRevision`/`artifactRevisionId` to live `HEAD`, so the
     canonical digest rotated on every commit — including the one that records a
     receipt, and any commit touching no bound path. That makes a content-bound
     verdict expire for reasons unrelated to content, which is the failure mode
     RS3(b) names. The default is now the newest commit touching the snapshot's own
     bound paths (artifacts plus context sources), with `--source-revision` /
     `--artifact-revision` still overriding for an explicit authoring-event id.
  2. `verify` passed the *current* snapshot object as both the reviewed and the
     current input of the schema comparator, so its precedence-1
     `missing-receipt-snapshot` branch always won and no consumer could ever learn
     *which* bound file moved — the gate block asks for exactly that. `verify` now
     attributes the drift from what the receipt actually records, in the
     comparator's own precedence order and only with codes from
     `PRE_EXECUTION_FRESHNESS_CODES`.
     Chosen deliberately over reconstructing a synthetic "reviewed" snapshot to
     feed the comparator: that would have manufactured the object the comparator
     exists to check, laundering a guess into a verdict. Rejected instead: letting
     the script keep a private precedence list, which would drift from the contract
     the header of the same file promises it cannot.

- **D30 — a fix unit's Plan snapshot binds no parent (RS14).** The contract said
  every `stage: plan` snapshot requires a non-null `parentSpecSnapshotDigest`
  (`plan-stage-requires-parent`), while the only sanctioned `stage: spec` binding
  was `spec-product-v1`, which requires the Product-half headings
  `Goal, Branch, Size, Dependencies, Product half, Design status`. A fix unit has
  no Product half by design — P3's own task text keeps fix authority in
  reproduction/root-cause/regression/rollback "without a fake Product half", and
  `PRE_EXECUTION_GATE.md` states fix mode has no Product hop to substitute — so the
  documented recipe (`SNAPSHOT.md`: "a fix unit passes its own SPEC snapshot
  digest") was unreachable for **every** fix unit, proven before this change by
  `node scripts/pre-execution-snapshot.mjs build --stage spec --dir
  docs/fix/78-audit-pr-closure-integrity --unit fix-78 --unit-kind fix` →
  `snapshot refused: invalid-selector@/files/0/content`. The rule is narrowed to
  `stage == plan && unitKind == feature`; a fix plan snapshot carries
  `parentSpecSnapshotDigest: null` and its receipt says so. This is a semantic
  change to a contract, so its boundaries are explicit: the pre-execution surface
  is new and unreleased in `3.5.0`, no published consumer can observe it, AC2's
  feature-side Product→Plan parent binding is unchanged and still tested, and AC9's
  frozen candidate `CandidateSnapshot`/`ReviewReceipt` and staged
  `VerificationPlan`/`VerificationReceipt` meanings are untouched. Rejected:
  inventing a Product half in the fix template (contradicts D6 and the fix
  workflow's authority model), and adding a second selector vocabulary entry
  (more surface for the same answer — a fix unit has nothing to parent, not
  something to bind differently).

- **D31 — second declared re-basis inside the RS batch (2026-09-01): a plan that
  measures its own ceilings must measure them last (RS-batch regression found by
  the check D28 added).** After the reference-file edits landed, `check-skill-context.mjs
  --routes` failed 14 rows across seven route entries: D27's declared ceilings were
  computed **before** this batch grew `skills/pre-execution-review/references/
  SNAPSHOT.md` (+51 lines, the RS14/RS3/RS13 remedy text), `skills/review-plan/
  references/{CHECKS,OUTPUT}.md` and `skills/audit-pr/references/
  02_CLOSURE_AND_SCOPE_GATES.md` — so the batch invalidated its own declaration
  while still uncommitted. Re-based at `ceil(measured × 1.10)` measured at this
  commit, growth source = this RS-repair batch's own reference edits:

  | Route | Measured (est/lines) | D27 declared | Declared now | Grew via |
  |---|---|---|---|---|
  | `audit-pr:feature` / `:fix` | 8675 / 560 | 9501 / 614 | **9543 / 616** | audit-pr `02_CLOSURE_AND_SCOPE_GATES.md` |
  | `review-spec:default` | 10791 / 758 | 11216 / 800 | **11871 / 834** | SNAPSHOT.md |
  | `review-plan:default` | 12420 / 814 | 12766 / 853 | **13663 / 896** | CHECKS.md + OUTPUT.md + SNAPSHOT.md |
  | `plan-feature:scaffold` | 14929 / 1126 | 15768 / 1203 | **16422 / 1239** | SNAPSHOT.md |
  | `plan-fix:issue` | 17459 / 1332 | 18551 / 1429 | **19205 / 1466** | SNAPSHOT.md |
  | `design-feature:repair` | 17879 / 1252 | 19013 / 1341 | **19667 / 1378** | SNAPSHOT.md |

  `design-feature:product`, `plan-feature:{scoped,issue}`, `plan-feature:*` and the
  `execute-phase:*` / `loop-review-fold:default` routes kept D27's or looser
  ceilings — nothing under the floor there. `plan-fix:issue` is raised although
  debt item D2 still owns its trim: the raise and the trim are separate declared
  acts, and the trim re-bases **down** when it lands.

  Rule adopted with it: **a declared re-basis is the last content act of a batch
  that grows route files**, measured with `--routes --json` after every
  skill/reference edit — never mid-batch. That the failure was caught by the gate
  rather than by the next unrelated unit is D28 working as intended: the floor was
  only declarable before, now it is checkable.

- **D32 — owner-authorized bypass of the pre-execution review gate for unit 28's
  own remaining phases (2026-09-01, explicit user instruction: "forcely ignore
  the review-plan … we can not consume a receipt from a skill in development —
  bypass our in development skills").** The gate demands a verdict only an
  independent reviewer can produce; for unit 28 the only process that could
  produce one is the unit's own undelivered artifact: `review-spec`,
  `review-plan` and `pre-execution-review` exist as repo text and are installed
  nowhere — not as a global skill, not as a pi command (the session's
  invocable-skill list carries none of them) — so the gate consumes receipts the
  unit itself has not shipped. The unit already qualified once through the
  legacy-adoption route (P5) under the same circularity; the 2026-08-31 replan
  voided those receipts (RS3(a)) and the re-run demand (RS3(c)) recreated the
  deadlock. Boundaries, all four load-bearing:
  1. The gate text, the schema and every other consumer are **unchanged** —
     feature 29 and every later unit still face the gate. This is a recorded
     owner override of the skill's own no-bypass clause for the one unit that
     develops the gated skills, not a policy change.
  2. It is recorded here and in the SPEC amendment table — never via the
     `--force` flag, which `PRE_EXECUTION_GATE.md` excludes by construction, and
     never silently.
  3. P8's RS3(c) receipt rows are satisfied by the installed `review-change`
     PASS on the terminal candidate plus this decision; the first real exercise
     of the gate stays where the SPEC already put it — feature 29's post-merge
     dogfood (review-spec + review-plan over unit 29's artifacts), where the
     gate is not circular.
  4. Canary fields that only a `review-plan` run could observe are recorded with
     the corpus's own sanctioned `not yet measured` value, never invented.
  Expires when the skills ship (known-issue 12's publish precondition) or when
  feature 29 exercises the reviews — whichever comes first; the close-out
  receipt names this decision either way.

## Out-of-scope finding ladder — 2026-09-01

| Date | Finding | Evidence | Estimate | Risk | Local files | Decision | Why | Trigger | Record |
|---|---|---|---|---|---|---|---|---|---|
| 2026-09-01 | `PREFLIGHT.md`'s dependency fingerprint hashes an input that does not exist in this repo, so the fast path can never be re-derived by any consumer | `skills/execute-phase/references/PREFLIGHT.md` → "Fingerprint = `git hash-object --stdin` over the SPEC `Depends on:` line and each closure roadmap row"; measured: `grep -rlE '^\s*[-*> ]*Depends on:' docs/features/ docs/fix/` → **0 files** (the 14 string matches are all prose about "`Depends on:`-chained features" or restatements of this same recipe), while 30 SPECs declare a `## Dependencies` section. Consequence observed live: unit 28's `…-001` dependency fingerprint `6f7c915f…` matches no reading of the named inputs, forcing a full forge pass every phase | 1 file (PREFLIGHT.md) + template, or 1 template + N SPECs | med | no — neither PREFLIGHT.md nor the template is touched by unit 28 | Proposal | Fails "files already touched" on both fix rows, and it is a two-way architectural choice (make the recipe match the `## Dependencies` section, or make the template emit a machine-readable `Depends on:` field) that changes what every unit's gate reads — owner judgment, not execution | When any unit recomputes a dependency fingerprint, or when the fingerprint format is next touched (it is owned by feature 25's receipt work, not by 28) | proposal (batched in this unit's final report; no forge issue created) |
| 2026-09-01 | Untracked harness state makes this repo's close-out gate unsatisfiable: `git status --porcelain` can never be empty while the agent's own memory/subagent files sit in the work tree, and every skill that checks for a clean tree (`execute-phase` "Done when", `audit-pr`, `workflow-status`) reads it as uncommitted work | `git status --porcelain` → `?? .engram/`, `?? .pi/subagents.json`; `git check-ignore -v .engram .pi/subagents.json` → no rule (root `.gitignore` is 137 bytes, covers neither) | 2 lines / 1 file (`.gitignore`) | low | no — `.gitignore` is untouched by unit 28 and no phase names it | Proposal | Autofix fails "files already touched"; Opportunistic Fix fails the same box. It is repo-wide environment hygiene, not current-unit scope, and it changes what every future gate sees — a judgment for the owner, not for execution | When any unit's close-out reports a dirty tree caused by agent state, or when a second repo hits the same | proposal (batched in this unit's final report; no forge issue created) |

## Replan decisions (2026-09-01 — finding F3, #146 flow-integrity amendment)

- **D33 — F1–F6 stay inside unit 28 as P9–P16 instead of being cut into
  `Depends on:`-chained features (explicit user decision 2026-09-01: "Sí — es
  replan de la 28").** The scaffold rule's own remedy for a plan past about five
  phases is to split it into chained features, and the unit is now at sixteen
  phases, so this decision buys cohesion at a real price. The case for staying:
  #146 is the governing source and states the six items are "normative for the
  same artifacts as the base feature"; `origin/main` already declares them inside
  roadmap row 28 (PR #153), so splitting them out would fork one issue's scope
  across two roadmap rows with different owners; and F1, F2, F5 and F6 all bind
  surfaces P1–P4 already shipped, so a second feature would re-open the same
  files. The cost, recorded rather than argued away: a bigger unit is a longer
  blast radius for the next review cycle, and the close-out that P16 now owns was
  already attempted once (P8) at a head this amendment invalidated. Mitigation:
  every appended phase is single-concern, single-layer, ≤8 tasks, and
  dependency-ordered inside the unit (P9 before P10/P11 — the mark needs its
  owner; P14 last among the text phases — the drift gate needs the fixed
  grammars the others produce). Revisit if P14's inventory shows the gate needs a
  machine surface this package does not publish: that is a new feature, not a
  task.
- **D34 — F32 (hand-rolled SHA-256) left open pending the owner's runtime-policy
  verdict, with the measurement recorded instead of an inferred answer.** The
  finding assumed the swap is a perf fold; `PE-020` shows the async sibling is
  already the standard Web Crypto path, that no runtime measured here has a
  synchronous standard digest, and that the hand-rolled path exists precisely for
  the one sync caller (`buildPreExecutionArtifactSnapshot`, AC2). So the real
  question is which portability surface the package promises, not which hash is
  faster. The owner asked for the availability matrix first; it is in
  `PE-020`. F32 stays `folded: no` and no classification was edited.
- **D35 — the fixture subagent that closed the weakest-executor leg wrote into
  the delivery branch (F35), and that is a process finding, not a wording
  finding.** A `general-purpose` agent told in prose to write only under `/tmp`
  obeyed its skill's output contract instead — `review-spec` requires appending a
  receipt to `progress.md` and creating `planning-findings.md` — and committed
  `de9f4a04` + `bc0a88ef`, including a `| 91 | toy-csv-export |` row added to the
  real roadmap. Reverted with `git reset --hard 2016d309` before anything was
  pushed; the tree is byte-clean and the evidence is at `/tmp/f35-evidence/`.
  Load-bearing for this amendment: it is a live specimen of exactly what F2
  (durable-ledger write ownership) and F3 (terminal marks) exist to catch — an
  undeclared writer reaching a ledger it does not own, and a mark written without
  its provenance. Consequence adopted now: qualification runs get a sandbox whose
  contract says out loud that its ledgers are toy ledgers, never a real repo with
  a prose instruction.
- **D36 — F32 disposition: native-first with this package's own fallback; no
  dependency, nothing vendored; attribution promoted to a standing rule
  (2026-09-01, owner verdict on the measured matrix).** The owner's direction had
  three parts and the measurements kept two of them. Kept: (1) **prefer the host's
  native hash** — `process.getBuiltinModule("crypto")` is documented as added in
  Node v22.3.0 and v20.16.0 and measured working in node v24.19.0 and bun 1.4.0, so
  the native path becomes the answer wherever a native path exists; (2) **credit is
  mandatory** — because vendoring was seriously considered, the rule is written
  down rather than left to taste: any copied third-party code carries source URL,
  author, version, and license name in a header comment (`CLAUDE.md`, P17 task 6).
  Not kept: (3) **carry the code in-house** — measured, the `@noble/hashes@2.4.0`
  `sha256` closure is 1,419 lines across `sha2.js`/`_md.js`/`_u64.js`/`utils.js`
  with 17 named imports that include SHA-384/512 and `u64` machinery this package
  never calls, against the 124 lines already owned here and already pinned against
  `node:crypto`. Vendoring would triple the surface we maintain, freeze a copy that
  stops receiving upstream security fixes, and only ever run on the no-native path —
  browsers, where there is no native alternative to beat and where 2.4 ms on a 52 KiB
  document is not a decision. So the fallback stays ours.
  Rejected alongside it: a static `import "node:crypto"` (deletes the browser target
  the package's own README promises and needs `@types/node`), and adding
  `@noble/hashes` as a dependency (breaks the published zero-dependency identity for
  a 2–3× gain on the path that stops mattering).
  Numbering: **P17 executes before P16** and the sequence is deliberately not
  monotonic — re-numbering the close-out would rotate a fingerprint plus the
  `TASKS.md` rows and obligation cells that already cite it, for cosmetics.
  What remains true and uncomfortable: after P17, older Node (below v20.16) and
  browsers still pay the pure-JS cost at the 4 MiB edge (175 ms node / 443 ms bun
  measured), and F31's debt — the builder hashes the full input before the budget
  refuses it — is the reason that edge is reachable at all. Neither is claimed as
  fixed by P17.
- **D37 — D32's bypass covers P9–P17 as well, and the scope cell that says
  "(P6–P8)" is stale text, not a narrower grant (recorded at the P9 preflight,
  2026-09-01).** The SPEC amendment row names P6–P8 because it was cut earlier
  the same day than the replan that appended P9–P16; D32's own scope clause is
  "unit 28's own remaining phases", and the reason it was granted has not weakened
  — it has multiplied. Measured at this preflight rather than remembered:
  `node scripts/pre-execution-snapshot.mjs verify --stage plan --unit
  28-evidence-grounded-spec-plan-review --parent 781f8127…` answers `current:
  false`, receipt `rp-28-20260831-001`, observed digest `a2794a42…`,
  `structural.reasonCode: stale-context`, `changedPaths: [docs/features/ROADMAP.md]`
  — the roadmap row this unit's own phases keep editing. And the three skills that
  could mint a current receipt (`review-spec`, `review-plan`, `pre-execution-review`)
  are still repo text installed nowhere (the invoking session's skill list carries
  none of them) while **P9–P15 are the phases that build them**: the gate would
  demand a verdict from artifacts that do not exist until the work the gate
  authorizes is finished. D32's four boundaries apply verbatim and none is
  loosened here: the gate text, the schema and every other consumer stay unchanged
  (feature 29 still faces it); no `--force` is used or recorded, because
  `PRE_EXECUTION_GATE.md` excludes that flag by construction and this is an owner
  decision, not an executor override; P16 mints the receipt set at its own
  terminal HEAD rather than inheriting anything; and canary fields no installed
  command can observe are recorded as `not yet measured`, never invented.
  Known-issue 14's closure condition (skills shipped **and** one consuming unit
  reviewed through them) is unchanged by this note.
- **D38 — P9: the map is one block, the templates are pinned projections; the
  ceiling raise that followed is a declared re-basis, not a quiet widening
  (2026-09-01).** Placement: AC16 wants the owners "in the ownership map AND in
  every ledger template", and task 6 names `LEDGERS.md` as the single cited source
  for the one-owner rule. So the map lives in
  `skills/pre-execution-review/references/LEDGERS.md` as a fenced
  `ledger-ownership@1` block — a grammar the scan parses, not prose it has to
  guess at — and `docs/features/_TEMPLATE/LEDGERS.md` + `docs/fix/_TEMPLATE/LEDGERS.md`
  carry per-tree projections of it. That is a deliberate second copy, acceptable
  only because it is pinned in **both** directions: a template row that is added,
  dropped, reworded or left owner-less fails the suite, so the copies cannot drift
  the way an uncited table duplicate would. The alternative — a single template for
  both trees — was rejected because the two trees have different homes
  (`docs/features/ROADMAP.md` vs the fix index `docs/fix/README.md`) and a unit that
  copies a template must see its own paths in it.
  Column-set owners, not file owners: `review-findings.md` legitimately has four
  (row append, audit append, triage append, fold flip), so `owner` is a
  `+`-joined set of `<skill>:<column-set>` and the one-owner rule is stated per
  column set. A bare filename-level owner would have been the fiction the finding
  was filed against.
  Budget consequence, named as the policy requires. The block is +44 lines /
  +1117 estimate units inside a one-hop reference, so every route that loads
  `pre-execution-review` measured higher than its ceiling:
  `design-feature:repair` 19360/1320 → 21296/1452, `plan-feature:scaffold`
  16410/1194 → 18051/1314, `plan-fix:issue` 18940/1400 → 20834/1540,
  `review-plan:default` 13889/881 → 15278/970, `review-spec:default` 12269/827 →
  13496/910, each exactly ceil(measured × 1.10) under the declared
  `relative-headroom` policy (D26/D31, command-bound by RS12). Per-skill:
  `pre-execution-review` gains `referenceEstimateMax: 2915` = ceil(2650 × 1.10).
  Growth source: this phase's ownership map, nothing else — no existing ceiling was
  lowered and no route was trimmed to hide it. What that costs going forward is
  stated here rather than discovered later: the override is skill-wide, so P10's
  `POLICY.md` growth shares `pre-execution-review`'s single ceiling with `LEDGERS.md`,
  and P10–P13 will each re-basis the routes they grow.
  Red-first is reproducible by anyone (see `testing.md` § P9): the suite takes its
  repository root from `LEDGER_OWNERSHIP_REPO`, so running it against
  `git archive 0feaaf64` — the tree before the map existed — fails 16 of 18 with
  exit 1. A scan that can only be shown green is a scan nobody can audit.
- **D39 — P10: marks go where the map already puts them, the rejection vocabulary
  is named after the gate that prints it, and the ceilings that growth moved are
  re-based once, with the source named (2026-09-01).** Placement first. AC17 asks
  that a terminal turn "write its durable mark in the same act" — it never asks for
  a new artifact, and P9's map already says who may write each ledger. So §8 places
  every terminal mark on a home the map declares: a review or plan verdict keeps
  writing its receipt block (`review-spec:product-receipt`,
  `review-plan:plan-receipt`), a fold completion keeps flipping
  `fold-findings:folded-flag`, and only the gate-rejection trace was genuinely
  homeless — it gains one column set on `progress.md`
  (`execute-phase:gate-rejection-traces`) rather than a new file, so the map, the
  two template projections and §8 all moved in this one commit and the drift scan
  pins them in both directions. The rejected alternative was a `gate-rejections.md`
  ledger: a file per rule is exactly the fragmentation AC16 exists to prevent, and
  `progress.md` already carries this unit's preflight and receipt blocks. The cost
  is that three durable surfaces must now agree every time a column set appears —
  paid for by `scripts/ledger-ownership.test.mjs` failing the mismatch rather than
  the reviewer noticing.
  Vocabulary second, chosen for the smallest closed set that names the real gates:
  `dependency`, `status`, `phase-lint`, `stale-or-missing-receipt`. `status` covers
  both own-status STOPs (`idea`, `defined`) instead of forking into
  `status-idea`/`status-defined`, because the gate is one check with two outcomes
  and a per-outcome type would turn a closed set of four into an open list. The
  consequence is mechanical and pinned: the fixture counts four *types* but five
  printed *traces*, so a future own-status state either reuses `status` or replans
  the vocabulary — it cannot silently add a sixth word. The replay codes are
  `stale|wrong|duplicate`, deliberately AC17's own words and deliberately **not**
  the snapshot freshness reason codes (`stale-context`, `stale-source-revision`):
  those belong to the schema package and describe digests, while these describe
  marks. Two similar-sounding vocabularies is the price of not redefining a
  package-owned code in prose; §8's sentence names its subject to keep the two apart.
  Budget, as the policy requires (D26/D31/D38). Growth source: §8 inside
  `POLICY.md` (2045 → 2482 estimate units, written to land under
  `pre-execution-review`'s existing `referenceEstimateMax: 2915` — that skill's
  ceiling did **not** move, its max file is still `LEDGERS.md`, at 2659) and the
  five typed traces plus the citation section inside `PREFLIGHT.md` (2123 → 2352),
  which is AC17's own requirement and crossed the default 2200. So `execute-phase`
  gains `referenceEstimateMax: 2588` = ceil(2352 × 1.10), and the five routes that
  load `pre-execution-review` move from their D38 floors to their P10 floors
  (estimate / lines): `design-feature:repair` 21296/1452 → 21793/1488,
  `plan-feature:scaffold` 18051/1314 → 18548/1349, `plan-fix:issue` 20834/1540 →
  21331/1576, `review-plan:default` 15278/970 → 15818/1007, `review-spec:default`
  13496/910 → 14011/946. Nothing was lowered to hide growth and nothing was raised
  twice — `pre-execution-review`'s own 2915 stayed put; the two reviewer skills and
  `pre-execution-review` are `minor` bumps under `bump-skill`, so the changelog
  rows, both README-language skill cells' owners and `SKILLS.md`/`SKILLS.es.md`
  moved with them, and the Pi mirror was rebuilt to byte parity.
  Not built here, because later phases own it: the sensor keying its review-ran
  proof on the durable mark (P11), the artifact that carries delegated evidence
  (P12), the normalizer ordering (P13) and the drift gate that pins §7/§8's
  sentences against the consumers that cite them (P14). The citation form the P14
  gate will read is the literal ``POLICY.md` §7` / ``POLICY.md` §8`, already in both
  reviewers' turn-contract boxes.

- **D40 — P11: the durable review mark is a row of the ledger it proves, and its
  freshness is the SHA equality the repo already runs.** AC20 needs one artifact
  that says "`review-change` ran against *this* state" for a review whose finding
  set is empty, and it forbids the sensor's old inference (the presence of any row
  in `review-findings.md`). The mark is therefore declared as `review-mark@1` in
  `pre-execution-review`'s `LEDGERS.md` — one row of the unit's existing
  `review-findings.md` fold ledger, in that ledger's existing seven columns, with
  `file:line` bound to the reviewed head sha and every other cell `n/a` because the
  row reports no finding. Two consequences were chosen deliberately. (1) It is a
  row, so the map declares its writer: `review-change:review-mark` was added to the
  `review-findings` owner cell **and** to both `_TEMPLATE/LEDGERS.md` projections in
  the same commit, because P9's and P10's shared gotcha is that a mark whose home the
  map does not declare is unownable, and `scripts/ledger-ownership.test.mjs` fails
  drift in either direction. (2) The `n/a` cells are not padding: they are what keeps the mark out of
  the fix-now projection, out of `fold-findings`, and out of the provenance annotator
  (whose row pattern matches `F<n>` ids only), so one row shape carries both findings
  and the mark without either reader mis-reading the other.
  Alternatives rejected, with reasons: a **new ledger file** for review marks (a new
  map row, a new template projection, a new lifecycle and a new snapshot concern for
  one line, and it splits "what `review-change` wrote about this unit" across two
  homes); a **`progress.md` marker line** (that ledger's owners are
  `plan-feature-scaffold`, `execute-phase` and the two pre-execution reviewers —
  `review-change` writes nothing there, so the line would have no column set to
  own); a **fenced marker block** inside the ledger (a shape outside the table is not
  a row, so the ownership map cannot declare it — exactly the failure mode AC16/O16
  exists to prevent); and **reusing `review-change`'s PR `REVIEW-PASS` receipt** as
  the mark (it is PR-scoped, it is `audit-pr`'s merge-gate evidence, and a unit with
  commits but no PR — every unit between `execute-phase` and its first push,
  including this phase's own candidate — would have nowhere to carry it; AC20 binds
  the proof to the *unit's current state*, not to the existence of a pull request).
  No second freshness mechanism was added: the mark names the head sha and the sensor
  tests equality, which is the rule `audit-pr` already applies to a SHA-bound receipt
  and `progress.md`'s `Last reviewed: <sha>` marker already uses, so "a mark an older
  commit left behind" is stale by a rule with one owner. The new suite proves that
  refusal as a computed decision (its third case), because a mark that survived later
  commits would make the whole change a rubber stamp.
  Units whose fold ledger predates the mark now read review-pending until a review
  runs at the current head, and nothing was backfilled: a backfilled mark would
  attest an act that left no trace, which §8's replay refusal already forbids.
  Budget: `LEDGERS.md` grew 2659 → 2877 estimate units and `pre-execution-review`'s
  own `referenceEstimateMax: 2915` did **not** move (its max file is still under the
  D39 ceiling, so that ceiling is still its measured floor), while the five routes
  that load the skill moved from their D39 floors to their P11 floors (estimate /
  lines): `design-feature:repair` 21793/1488 → 22039/1509, `plan-feature:scaffold`
  18548/1349 → 18794/1370, `plan-fix:issue` 21331/1576 → 21577/1597,
  `review-plan:default` 15818/1007 → 16065/1028, `review-spec:default` 14011/946 →
  14258/967. `workflow-status` is in no declared route and both files it grew
  (`SENSOR_CORE.md` 1811 → 1873, `PRE_EXECUTION.md` 1097 → 1266) stay under the
  default 2200 reference ceiling, so no ceiling of its own moved; nothing was
  lowered to hide growth and nothing was raised twice. `pre-execution-review` 1.4.0 →
  1.5.0 and `workflow-status` 3.0.3 → 3.1.0 are `minor` under `bump-skill`, so both
  changelog tables, both README-language cells, `SKILLS.md`/`SKILLS.es.md`, the
  human-facing `FEATURE_WORKFLOW.md`/`.es.md` ledger paragraph and the Pi mirror
  (rebuilt to byte parity, 38 skills / 122 files) moved with them.
  Proposal for the phase that owns it — **P14**: `review-change`'s own persist
  reference (`PERSIST_AND_DECIDE.md` step 11) still describes only finding rows, so
  the skill the map now names as the mark's writer does not yet cite the column set
  it owns. Its obligation derives from §8 plus the map, which is why P11 left the
  text alone rather than widen two more route budgets in a `docs` phase; the drift
  gate should pin `review-change`'s persist step against
  `review-change:review-mark` the way it pins the two reviewers against §7/§8.

- **D41 — P12: delegated evidence is a versioned artifact with one home and a
  sandbox named in its own contract, not a ledger, a snapshot kind, or a second
  revision mechanism.** AC18 demands a lot of one sentence: the reading happens
  outside the authoring context, the conservation is *versioned*, the outcome is
  closed, the source rows carry seven named fields, `partial`/`blocked` validate
  nothing, the pending state precedes the prompt, and the artifact is advisory
  until the author spot-checks. Each of those has one owner now, and the choices
  that got there are the ones worth recording.
  **Home: `docs/features/<NN>-<slug>/delegated-evidence.md`, with the `docs/fix/`
  analogue — one file per unit, at every size.** `planning-evidence.md` embeds in
  the SPEC for XS/S, and the obvious move was to copy that. Rejected: the embed
  exists to save an XS/S unit an artifact the Plan snapshot must then bind, and this
  artifact is advisory — nothing binds it — while its writer is a context that must
  not touch the author's file. A delegate's bytes inside `SPEC.md` is precisely the
  ownership blur P9's map exists to prevent, so the size exception would have
  bought one fewer path at the cost of the boundary AC18 is about. Cost paid: one
  more path per unit, and a unit that never delegates simply has no such file (the
  contract says so, so its absence is not a readiness gap).
  **Not a truth class.** An eighth map row was the other obvious move and is a
  contract violation: AC16 closes the classes at seven, and
  `scripts/ledger-ownership.test.mjs` fails a row outside them — the fixture asserts
  seven again so a later phase cannot "tidy" this. The artifact is declared on the
  map's `no-script-writer` directive instead, the same treatment `planning-evidence.md`
  gets, which is what keeps a script off it; its writer and its two zones are stated
  in the role contract, which is the only prose that may say them.
  **Revision: positive, read from disk, rotated by the mechanism that exists.**
  `revision + 1` is admitted only against the `revision` the current bytes carry, so
  a replay repeats a number instead of silently appending; and because conserving the
  artifact is an authoring write, `artifactRevisionId` rotates with it (Design §1) —
  no second counter, digest, or clock was introduced, and known-issue 1's out-of-band
  limit is inherited rather than restated as a guarantee.
  **Sandbox (known-issue 16's named fix): the boundary is the contract's text.** F35's
  run obeyed `review-spec`'s own instruction to create real ledgers over a prose aside
  next to the invocation, so `DELEGATION.md` states in the role that a qualifying or
  probing run writes only the sandbox copy's **toy ledgers**, that a run for a real
  unit writes exactly one real file and commits nothing, and that a launch satisfying
  neither rule does not launch. Honest residual, recorded in known-issue 16: that is
  normative text a model obeys plus a scan that reaches scripts — no runtime physically
  prevents a disobedient delegate, and nothing here un-writes what earlier probes
  committed.
  **Rule placement, twice over, by citation.** The zero-validated-claims definition
  lives with the shape (only `DELEGATION.md` may say it — the fixture scans `skills/`
  to prove it); the *gate* lives in `READINESS.md`, whose existing vocabulary already
  emits `NEEDS-EVIDENCE`, added as one shared box D1 rather than a duplicated box in
  each stage list or a new gate in a consumer. The pending write follows the same
  discipline: §8 did not cover it, so §8 gained the bullet
  ("**A pending write is a mark**") and `DELEGATION.md` says only what is local — the
  home, the content, and that the turn ends. Rejected alternatives there: restating
  write-then-report in the delegation contract (P10's own fixture fails any consumer
  that copies §8's sentences) and inventing a "pending" mark class in the map (the map
  designates marks for truth classes; this artifact is not one).
  **Capability gating stated once as out of scope** (`DELEGATION.md` §Capability gating
  is out of scope): self-attested, recorded nowhere, and the fixture asserts no
  `grant`/`entitlement`/`capability flag`/`allow-list` vocabulary entered the two files
  it touched — the phrase "no grant, no flag" was itself removed for that reason, which
  is the cheapest honest form of the boundary.
  **Budget: growth from this text, re-based in the same commit.** The new
  `DELEGATION.md` measures 1919 estimate units / 128 lines (default ceilings 2200 / 280,
  so it has 281 units of room), `evidence-grounding/SKILL.md` 1938 → 1988, `READINESS.md`
  1539 → 1780, `POLICY.md` 2482 → 2567, `LEDGERS.md` 2877 → 2931 — which breached
  `pre-execution-review`'s D39 `referenceEstimateMax: 2915`, moved to **3225**
  (= ceil(2931 × 1.10), LEDGERS being the skill's largest reference). Six routes grew
  (estimate / lines): `design-feature:product` 13211/939 → 15642/1095,
  `design-feature:repair` 22039/1509 → 24623/1672, `plan-feature:scaffold`
  18794/1370 → 21378/1534, `plan-fix:issue` 21577/1597 → 24161/1760,
  `review-plan:default` 16065/1028 → 16218/1036, `review-spec:default` 14258/967 →
  14410/975 — each exactly ceil(measured × 1.10) at this commit, with this text as the
  named growth source. Nothing was lowered to hide growth.
  **Distribution:** `evidence-grounding` 1.2.0 → 1.3.0 (`minor`: a new reference and a
  new shared readiness box, no vocabulary or emitted-outcome change, still no review
  PASS), with both changelog tables, one release-log line in each language, and both
  `SKILLS.md`/`SKILLS.es.md` cells; `pre-execution-review`'s SKILL.md stayed untouched —
  §8's coverage line already names write-then-report, so a reference-only edit needed no
  second bump. Pi mirror re-bundled to byte parity (38 skills / 123 files, +1).
  **For P13, one sentence of context:** the artifact is deliberately *not* in the
  snapshot's closed `kind` list, so any normalizer-ordering rule P13 writes for it must
  not assume a binding row exists — it is conserved, not bound.

- **D42 — P12's artifact shape carries `uncertainty`, which AC18 never asked for,
  because the phase's own task text did (2026-09-01, conductor review of
  `b5e59dfb`).** `TASKS.md` P12 task 2 lists "contradictions, **uncertainty**,
  freshness"; AC18 and S17 list contradictions and freshness with no uncertainty
  slot. The commit shipped the two the acceptance row names and ticked the box
  anyway, which leaves the ledger claiming more than the artifact holds — the exact
  class of drift this unit keeps filing findings about. Chosen: add the slot, and
  keep it distinct from the two neighbours that could absorb it (`unverified-claims`
  = a claim this run made and cannot stand behind; `contradictions` = two sources
  disagreeing; `uncertainty` = what the run could not establish, plus the evidence
  that would). Rejected: amending the task text to match the shipped shape — the
  task is the finer-grained promise, the acceptance row is the floor, and quietly
  lowering a task to what was already written is how a plan launders its own gaps.
  Direction matters: the shape is now a **superset** of AC18 — more reported state,
  no narrowed validator, no acceptance edit. Cost, stated: five lines in one
  reference pushed four routes past their own headroom floors, so eight ceilings moved
  to `ceil(measured × 1.10)` in the same commit (growth source: this slot). That is
  the price of the `relative-headroom` policy working as designed, and it is the
  second time in three phases that a small prose addition has cost a re-basis —
  recorded here, not as a complaint, so a later trim decision has the number.
