# Decisions — 31-planning-review-materiality

Product-half decisions recorded by `design-feature` (append-only; newest last).
Engineering decisions recorded by `plan-feature` under the revision that took
them: `31-plan-1` (first scaffold) and `31-plan-2` (repair batch for
`plan-review-31-1`'s findings F01/F02/F03).

## Product decisions (2026-09-17, initial write `31-spec-1`)

- **D-31-1 — Planning-side `low` rows persist as report-notes.** The code
  side's `low` is never persisted (`review-implementation` carries it as a
  report note in the review table); the planning side persists it in
  `planning-findings.md` instead. Rationale: the planning ledger is the
  audit trail for prose-vs-prose reviews where no executable arbiter exists —
  dropping rows there would collide with the no-silent-dismissal contract
  (POLICY §2, §5) and with cycle counting, which reads the ledger. Visibility
  without blocking is the honest middle. Authority: issue #171 item 1
  ("persisted and visible, but non-blocking").
- **D-31-2 — The cap terminates in the existing `NEEDS-DESIGN` verdict.** No
  new terminal label, no new grammar: `NEEDS-DESIGN` is already in the
  `pre-execution-verdict` vocabulary with a verdict block and a repair route in
  both OUTPUTs. Mirrors `review-change`'s user-gated third-cycle rule
  (`LOOP CAP REACHED` → explicit user instruction). Authority: issue #171 item
  2; D-31-5 records the ledger reconciliation.
- **D-31-3 — Wording-only skips only the re-review act.** The determination
  must still be recorded in the unit's evidence and `artifactRevisionId` must
  still rotate (mutate-and-revert protection is unchanged). Skipping the record
  or the rotation would reopen the exact failure the receipt contract exists to
  close. Authority: issue #171 item 3.
- **D-31-4 — One materiality line for both stages.** Material = `medium`+ on
  spec and plan alike; no stage-specific thresholds. Rationale: two lines would
  double the pinned surface for zero honesty gain, and the issue defines one
  line ("Material = `medium`+"). Authority: issue #171 item 1.
- **D-31-5 — AD-008 reconciliation path.** REPOSITORY_STATE AD-008 says
  correctness is "never cycle-count-bound". The cap does not bind correctness
  to a cycle count — it routes an unconverged loop to a human decision
  (`NEEDS-DESIGN`) instead of letting cycles qualify anything — so the design
  treats it as compatible. If `review-spec` reads a contradiction in the frozen
  wording, `resolve-repository-state` owns the amendment at execution time;
  design does not rewrite the ledger. Authority: REPOSITORY_STATE AD-008 +
  issue #171 item 2; classification recorded here per the design skill's
  invariant rule (no invariants doc exists — see evidence rows).

## Evidence rows (grounding, 2026-09-17)

One row per material claim, fixed column order
(`claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence`):

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| Feature scope: low → report-note (material = medium+), hard two-cycle cap ending in NEEDS-DESIGN, wording-only route without re-review, anti-deflation verbatim, non-goals, affected surfaces, README citation obligation | forge | https://github.com/gtrabanco/agentic-workflow/issues/171 (fetched 2026-09-17) | issue body @ 2026-09-17 | current | proven | — |
| Roadmap row 31: slug `planning-review-materiality`, size M, depends on 29, status `idea`, Phase 2 of the 2026-09 run | repository | `docs/features/ROADMAP.md` row 31 | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| Hard dependency satisfied: feature 29 merged through PR #175 | repository | `docs/features/ROADMAP.md` row 29 (`done · #175`) | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| Planning side today: "`info` is the only immaterial one" — any `low` finding is material | repository | `skills/pre-execution-review/references/LEDGERS.md:93` | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| Planning finding row shape, writers, and resolvers (columns `finding-id…resolving-artifact-revision`; reviewers append; only the stage's author resolves) | repository | `skills/pre-execution-review/references/LEDGERS.md` §3 + ownership-map row `planning-findings` | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| POLICY §3 wording-only class exists but every repair batch still gets "a single re-review of the resulting snapshot" | repository | `skills/pre-execution-review/references/POLICY.md` §3 (opening paragraph + wording-only table row) | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| POLICY §4 today: second cycle prints CONVERGENCE-ANOMALY; "more cycles stay allowed when correctness needs them"; "no cap converts a verdict into a dead end" — planning loop unbounded on paper | repository | `skills/pre-execution-review/references/POLICY.md` §4 | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| `design-feature` REPAIR §4 repeats "More cycles stay allowed when correctness needs them" | repository | `skills/design-feature/references/REPAIR.md` §4 | installed release @ 2026-09-17 | current | proven | — |
| Code-side precedent, test-pinned: `low` = report-only, never persisted, never blocks; re-escalate at `med` minimum; deflation to dodge a review is itself a review defect | repository | `skills/review-implementation/references/CLASSIFY.md`; `scripts/review-loop-discipline.test.mjs` §1 (asserts) | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| Code-side loop cap, test-pinned: at most two review→fold cycles; `LOOP CAP REACHED`; third cycle never starts without explicit user instruction | repository | `skills/review-change/SKILL.md:159-163` (third-cycle rule); `skills/review-change/references/REVIEW_PROCESS.md:169` (`LOOP CAP REACHED` literal); `scripts/review-loop-discipline.test.mjs` §4 (asserts) | branch head b84d57e1 @ 2026-09-17 | current | proven | — |
| Spec/plan verdicts key on "Material findings open: 0" — the pass condition already counts material findings, so only the materiality line moves | repository | `skills/review-spec/references/OUTPUT.md:66-70`; `skills/review-plan/references/OUTPUT.md:83` | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| Both CHECKS files fix the old line "Material = anything above `info`" | repository | `skills/review-spec/references/CHECKS.md:104-105`; `skills/review-plan/references/CHECKS.md:105-106` | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| review-plan OUTPUT carries the re-review cycle text + CONVERGENCE-ANOMALY routing the cap must extend | repository | `skills/review-plan/references/OUTPUT.md:125-126,165` | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| Overcorrection study: LLM reviewers frequently misclassify correct artifacts as non-compliant; richer prompts (explanation + proposed fix) raise the misjudgment rate | document | https://arxiv.org/abs/2603.00539 (fetched 2026-09-17), abstract | v1 2026-02-28 @ 2026-09-17 | current | proven | — |
| The issue's "FNR 26→88%" figure is asserted by the issue, not by the fetched abstract — the SPEC cites only the abstract-verified qualitative form; the README citation follows the issue's printed entry verbatim at shipping | forge | https://github.com/gtrabanco/agentic-workflow/issues/171 §Bibliography (fetched 2026-09-17) | issue body @ 2026-09-17 | current | proven | — |
| Industry convention: minor review findings are recorded and visible but never block ("Nit:" prefix marks optional, non-blocking points) | document | https://google.github.io/eng-practices/review/reviewer/comments.html (content read 2026-09-17 via the fetched adaptation https://solmaz.io/google-eng-practices-github, §How to write code review comments) | guide @ 2026-09-17 | current | proven | — |
| REPOSITORY_STATE AD-008 wording ("Correctness is … never cycle-count-bound") — reconciled by D-31-5, not contradicted | ledger | `docs/workflow/REPOSITORY_STATE.md` AD-008 | snapshot 2026-08-30-first-pass-convergence @ 2026-09-17 | current | proven | — |
| No architectural invariants doc exists: design proceeds with `n/a: no project invariants declared` | repository | absence of `docs/architecture/ARCHITECTURAL_INVARIANTS.md` (ls, 2026-09-17); REPOSITORY_STATE F010 | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| `docs/CAPABILITIES.md` is the unseeded template (no live roles/subsystems) — integration closure walks a derived inventory | repository | `docs/CAPABILITIES.md` (template placeholders only, read 2026-09-17) | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| `docs/workflow/REVIEW_AND_CLASSIFY.md` carries no severity/immateriality statement — tutorial surface unaffected | repository | grep over `docs/workflow/REVIEW_AND_CLASSIFY.md` (empty, 2026-09-17) | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| Versioning freeze: no majors until #176 merges — edited skills bump minor | repository | `CLAUDE.md` "Version every change" + #209 freeze note | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
| Validator-stability rule: a validator must never gate on a surface other workflow actors mutate (the branch diff as a whole, the session log, progress entries, review ledgers, forge state); a diff-based validator enumerates the unit's paths or excludes the workflow-mutated surfaces explicitly (`docs/LOGS.md`, the unit's own docs directory, harness/toolstate) | repository | `skills/verification-contract/SKILL.md` §Validator stability | v1.2.1 @ 2026-09-17 | current | proven | — |
| Whole-diff scope-guard precedent that enumerates its own records: feature 27's AC16 accepts `packages/pi-agentic-workflow/` + `docs/features/27-pi-agentic-workflow/` + `docs/features/ROADMAP.md` in `git diff main --stat` | repository | `docs/features/27-pi-agentic-workflow/ACCEPTANCE.md` AC16 | branch head b84d57e1 @ 2026-09-17 | current | proven | — |
| Observed branch diff at the repair's HEAD: 13 paths — 12 under `docs/features/31-planning-review-materiality/` + `docs/features/ROADMAP.md`; none a governed or derived surface of this feature | repository | `git diff main --stat` (run 2026-09-17 at b84d57e1) | branch head b84d57e1 @ 2026-09-17 | current | proven | — |
| Session-log surface exists and is workflow-mutated by log-session appends | repository | `docs/LOGS.md` (present; not part of the branch diff at b84d57e1) | branch head b84d57e1 @ 2026-09-17 | current | proven | — |
| git diff pathspec exclusion (`:(exclude)<path>`) and `--name-only` path-list output are documented git semantics — the mechanical anchor the repaired AC8 encodes (verified runnable at git 2.47.3: the 13-path diff reduces to empty under the three exclusions) | document | https://git-scm.com/docs/git-diff.html (fetched 2026-09-17; pathspec magic per the git glossary it references) | current git docs @ 2026-09-17 | current | proven | — |
| Exact planning-loop strings (N31-001 correction): POLICY §4 says "Entering a **second** cycle is allowed when correctness needs it" (:60-61) and "no cap converts a verdict into a dead end" (:83); `REPAIR.md` §4 says "More cycles stay allowed when correctness needs them" (:64-65); `LOOP CAP REACHED` lives in `REVIEW_PROCESS.md:169` | repository | `skills/pre-execution-review/references/POLICY.md:60-61,83`; `skills/design-feature/references/REPAIR.md:64-65`; `skills/review-change/references/REVIEW_PROCESS.md:169` | branch head b84d57e1 @ 2026-09-17 | current | proven | — |

## Open questions

None at product stage. The engineering half enumerates the exact pin diff in
`scripts/review-loop-discipline.test.mjs` and confirms no new fenced grammar
block is introduced (Integration closure row 5).

## 2026-09-17 — Engineering decisions (plan-feature, artifact revision `31-plan-1`)

Re-cut as `31-plan-2` by the repair batch below; E-D31-1…E-D31-4 keep their
substance and their authority.

### E-D31-1: One version bump per skill per PR, taken in the phase that first edits it

- **What**: P1 bumps `pre-execution-review` 2.2.1→2.3.0, `review-spec` 1.7.1→1.8.0,
  `review-plan` 1.6.1→1.7.0; P2 bumps `design-feature` 3.4.0→3.5.0. P2/P3 re-edit
  files of already-bumped skills (`POLICY.md`, `OUTPUT.md` ×2) without re-bumping.
- **Why**: a skill's `version:` is a per-PR artifact — it describes the PR's net
  change, and two bumps of one skill inside one PR would publish a phantom
  intermediate version. The per-phase commit rule ("run `bump-skill` before
  committing" a skill edit) is satisfied by bumping in the phase that first
  touches each skill; later phases edit the same PR's already-covered surfaces.
- **Authority**: plan-feature engineering interpretation of `CLAUDE.md`
  §"Version every change" + the #209 freeze (minor bumps, `BREAKING CHANGE:`
  footer convention).

### E-D31-2: No `docs/workflow/` tutorial edit

- **What**: this plan touches no file under `docs/workflow/`
  (`REVIEW_AND_CLASSIFY.md` included).
- **Why**: the tutorial carries no severity/materiality statement today
  (PE-15), and AC8 pins the PR diff to the In-scope surface enumeration — a
  tutorial edit would fail the unit's own acceptance gate. Drift between the
  tutorial and the new rules is `audit-docs`' inventory↔docs sweep, not this
  unit's.
- **Authority**: SPEC §Capability closure row "Workflow tutorial + site guides"
  (`partial`/n-a) + AC8.

### E-D31-3: AD-008 classification — preserved

- **What**: the hard cap does not contradict AD-008 ("Correctness is evidence-
  and obligation-bound, never cycle-count-bound"): the cap stops the loop and
  routes an explicit human decision (`NEEDS-DESIGN`, user-gated third cycle) —
  it never uses a cycle count to establish correctness, never auto-continues,
  and never waives findings.
- **Why**: D-31-5 (Product half) already reconciles this; the engineering cut
  encodes it as O14 (P2) so the §4 text is written and read against AD-008's
  wording. No `resolve-repository-state` amendment is triggered unless a
  reviewer reads an actual contradiction (D-31-5's conditional trigger).
- **Authority**: REPOSITORY_STATE AD-008; decisions.md D-31-5.

### E-D31-4: Planning-side pins live in the existing `scripts/review-loop-discipline.test.mjs`

- **What**: the report-note, anti-deflation, cap, and wording-only pins are new
  additive sections in the existing suite (new `read()` consts for `POLICY.md`,
  both `CHECKS.md`, `REPAIR.md`), not a second test file.
- **Why**: the suite already reads `LEDGERS.md` and both `OUTPUT.md` files
  (PE-007) and is the established home of loop-discipline pins (code side §1–§4);
  one suite keeps the no-weakening walk (AC9) computable as a single diff.
- **Authority**: SPEC §In scope 5 ("pins added to
  `scripts/review-loop-discipline.test.mjs`; every existing assertion keeps its
  strength").

## 2026-09-17 — Engineering decisions, repair batch (plan-feature, artifact revision `31-plan-2`)

### E-D31-5: F02's repair — one declared pin table with a floor and a discrimination leg

- **What**: the planning-side pins become rows of one `PLANNING_PIN_TABLE`
  (`{ id, doc, must, superseded }`) that the suite reads through three legs —
  liveness (every `must` matches the live bytes), discrimination
  (`assertDiscriminating(<row>)` fails any row whose `must` accepts its own
  `superseded` sample) and a row floor (`PLANNING_PIN_FLOOR`, 4 after P1, 8
  after P2, 9 at the PR head) — plus the frozen AC14 validator, which greps for
  the table, the discrimination call and the floor before running the suite.
- **Why**: F02 (medium, L5/P10) — the suite is a plain assertion script that
  exits 0 over an unmodified file (`0 pass / 0 fail`, PE-019), so the old
  done-whens were satisfied by the document edits alone and the enforcement
  could be absent. A presence grep alone would still admit seven trivial
  assertions; the discrimination leg is what makes a pin load-bearing, and the
  floor is what makes the table non-empty. This keeps E-D31-4 (one suite, one
  no-weakening diff) and adds no second test file.
- **Authority**: AC14 (new, user-authorized in the repair batch) + AC1–AC4,
  AC6, AC7, AC9, AC11; PE-019; the reviewer's F02 row.

### E-D31-6: F01's repair — the bundler command is always spelled from the package root

- **What**: every acceptance surface of this unit spells the bundler invocation
  as `cd packages/pi-agentic-workflow && bun run bundle:skills` (plus
  `bun run test` from the same root). `CLAUDE.md`'s `normalizer-inventory@1`
  row is deliberately **not** edited.
- **Why**: F01 (medium, P10) — this repository has no root `package.json`, so
  the bare root form exits non-zero and the P4/TASKS/testing chain could never
  produce AC12's outcome; the package's own manifest and features 29/59 spell
  the command from the package root (PE-012, PE-018). The inventory row is
  parsed by `scripts/pre-execution-quality.test.mjs` (pinned fixtures) and
  carries only the short step name, so the invocation form is owned by the
  manifests, not by that block. The plan's own P4 task is phrased through the
  package's script names (box 2's single-layer rule), with the verbatim command
  frozen in the acceptance manifest's Commands section.
- **Authority**: AC12 + Commands; PE-012, PE-018; the reviewer's F01 row.

### E-D31-7: F03's repair — AC8 walks the declared derived-surface set

- **What**: the SPEC declares the derived surfaces the same edits drag in — the
  Pi mirror under `packages/pi-agentic-workflow/skills/**`, the four edited
  `version:` lines, the README skill-table cells, `CHANGELOG.md` — and AC8's
  read-verified walk records each against that set instead of treating it as a
  scope violation.
- **Why**: F03 (info, P10) — the guard's wording named only the In-scope
  enumeration while P4's writes also land the bump and mirror surfaces, so the
  walk would have reported real, intended files as out of scope; declaring the
  derived set keeps the guard strict and truthful at the same time.
- **Authority**: AC8; PE-012; the reviewer's F03 row.

## 2026-09-17 — Product repair batch (design-feature, artifact revision `31-spec-2`)

Trigger: `spec-review-31-2` returned `SPEC-REVIEW-FAIL` (failed check C8) with
N31-003 (medium, product) material plus the open `info` rows N31-001/N31-002 —
one batch over the whole set, repair owner `design-feature`, user-commissioned
as "widen the AC8 scope guard". This enters the spec stage's second
repair/re-review cycle, so the `CONVERGENCE-ANOMALY` block was printed before
any edit (POLICY §4 — "printed and routed, never a stop"; a repair responding
to a persisted verdict is never a loop defect). Repair classes (REPAIR §2):

- **N31-003 — closure completion (autonomous; reviewed product intent
  unchanged).** AC8's allowed set gains its third declared group: the
  workflow-mutated record surfaces — the unit's own directory
  (`docs/features/31-planning-review-materiality/**`), the unit's
  `docs/features/ROADMAP.md` row, and `docs/LOGS.md` session-log appends —
  exactly the exclusions `verification-contract` §Validator stability names for
  a diff-based validator, with feature 27's AC16 as the repository precedent
  and a mechanical pathspec-exclusion anchor (`git diff main --name-only -- .
  ':(exclude)…'`, verified runnable at the repair's HEAD: the 13-path diff
  reduces to empty under the three exclusions). The guard stays closed: any
  path outside the three declared groups is still a violation, so the widening
  trades nothing away — it makes the criterion mean what it always meant ("the
  PR carries nothing beyond the feature's surfaces and the workflow's own
  records") while becoming satisfiable. Intent is unchanged: goal, In/Out of
  scope items, entities, roles, and all materiality semantics are untouched.
- **N31-001 — mechanical, intent-preserving.** §Context now quotes POLICY §4's
  actual wording ("Entering a **second** cycle is allowed when correctness
  needs it"); the code-side-cap evidence row cites `REVIEW_PROCESS.md:169` for
  the `LOOP CAP REACHED` literal (the `SKILL.md:159-163` citation keeps the
  third-cycle rule).
- **N31-002 — mechanical, intent-preserving.** E2's `Read/list` surface names
  both stages' frozen-evidence homes (plan: `planning-evidence.md` M/L / SPEC
  planning-evidence section XS/S; spec: `decisions.md` evidence rows, writer
  `design-feature:product-decisions` per the ownership map).

Out of this batch's scope, left open for their owner: R31-02 (medium, plan —
O15's one-phase/one-task contract) and R31-03's plan facet — `plan-feature`
re-derives the plan and re-freezes `ACCEPTANCE.md` (AC8 wording, obligation
O8, P4 task 5) once a fresh `SPEC-REVIEW-PASS` receipt exists; the manifest
stayed byte-frozen through this batch (blob `d85e217a…` recomputed intact).

## 2026-09-17 — Owner ruling: redesign + replan (carrier moves to code)

- **D-31-6 — The materiality predicate, the two-cycle cap and the wording-only
  route are implemented in code; the prose surfaces shrink to what is not
  computable.** Owner ruling after the 2026-09-17 review-cost audit. The Product
  intent recorded in D-31-1…D-31-5 is **unchanged** — `low` stays a persistent
  report-note, the loop still caps at two cycles and still ends in
  `NEEDS-DESIGN`, and a wording-only repair still skips the full snapshot
  re-review. What changes is the **carrier**: the predicate becomes a rule the
  machine evaluates (the finding record's `class`/`severity`/`reproducer` plus
  `pre-execution-snapshot.mjs verify`'s exit code and closed reason codes), the
  cap becomes the state the orchestrator refuses to advance past, and the
  discipline pins exist to keep the rule honest instead of encoding it.
- **Kept.** Feature number 31, branch `feat/31-planning-review-materiality`,
  issue #171, the entire Product half and its `spec-review-31-3` PASS (verified
  `current: true`), and every product decision row.
- **Superseded.** The whole plan set cut as `31-plan-1`/`31-plan-2` (`PLAN.md`,
  `TASKS.md`, `ACCEPTANCE.md`, `planning-evidence.md`, `planning-obligations.md`,
  `testing.md`) and the plan-review findings raised against it (`F01–F03`,
  `R31-01…R31-03`). They are **not repaired**: they describe a carrier
  (skill-reference prose) that this ruling replaces, so a repair batch would
  spend the plan stage's third cycle on the wrong artifact. The set is re-cut
  from scratch by `plan-feature` once the Engineering half is rewritten.
- **Why the Product half is not re-reviewed.** `spec-product-v1` selects title,
  `## Goal`, `## Branch`, `## Size`, `## Dependencies`, the Product half and
  `## Design status` — deliberately excluding the Engineering half
  (`pre-execution-review/references/SNAPSHOT.md`), "so planning writes cannot
  move a Product digest". Verified empirically on this revision: appending bytes
  to the `## Engineering half` left the bound digest at
  `5cdbd2f3f2039b1089c14cdce9a3367df9a92720eb0122de822e1693a07f502e` unchanged,
  so the `spec-review-31-3` PASS stays current through a reshape of the
  engineering cut. **If** the redesign is later judged to move the Product
  half's own surface list, the digest rotates, the receipt goes
  `stale-artifact-content` and the spec stage reopens — authorized by this
  ruling as a carrier change, never as another re-review of the same intent.
- **Next, in order.** `/plan-feature 31` (rewrites the Engineering half against
  D-31-6 and re-cuts the plan set) → `/review-plan 31` on the new set, which is
  cycle 1 of a new lineage → `/execute-phase 31` once the plan receipt is
  current. Roadmap row 31 returns to `defined` (routing data, unbound) until the
  new set is planned.

## 2026-09-17 — Carrier amendment (design-feature, artifact revision `31-spec-3`)

Trigger: the user commissioned "carrier amendment for D-31-6" — the Product
half is re-scoped to the code carrier the ruling names (the schema finding
record's `class`/`severity`/`reproducer`, the closed freshness/reason codes,
the orchestrator's cap refusal, phase-lint) with its frozen semantics
preserved verbatim (low = report-note; material = `medium`+; two-cycle cap →
`needs-design`; wording-only skips only the re-review). Repair class per
`REPAIR.md` §2: **redesign (carrier move)** — owner-authorized by D-31-6;
product intent (D-31-1…D-31-5) unchanged and restated verbatim in Scope. This
write moves the Product half's bound bytes, so `spec-review-31-3` goes
`stale-artifact-content` — the authorized carrier-change consequence, never a
repair of the receipt.

- **D-31-7 — The cap counts consecutive unconverged cycles; a PASS resets
  it.** The frozen "two-cycle cap" is a non-convergence bound, not a
  total-review bound: the count is the consecutive FAIL-verdict receipts for
  the stage since the last PASS verdict (the machine-derivable reading of
  "review→repair→re-review cycle"), mirroring `review-change`'s loop, which a
  REVIEW-PASS ends. Consequence: the spec stage's history
  (`spec-review-31-1` PASS → `31-2` FAIL → repair → `31-3` PASS) converged at
  cycle 1, and the ruling-authorized re-review of the carrier-amended Product
  half is cycle 1 of a fresh window — never a third cycle of the old one.
  Authority: D-31-6's authorization sentence + the user instruction;
  consistency with `review-change/references/REVIEW_PROCESS.md` (LOOP CAP
  REACHED semantics).
- **D-31-8 — The cap's unconverged exit is stage-scoped to the machine map.**
  The frozen "cap → `NEEDS-DESIGN`" holds where the verdict vocabulary
  sanctions it: `VERDICTS_BY_STAGE.spec` carries `needs-design`. The plan
  stage deliberately does not (fix/162 Decision 11: only `review-spec` may
  emit it; no persisted plan-stage `needs-design` receipt exists), so at the
  plan stage the cap's exit is the orchestrator's refusal to advance + the
  `design-feature` routing the transition table already allows. The honest
  property is identical at both stages — no silent end, no auto-continuation,
  no new terminal label. Authority: repository evidence
  (`pre-execution-contract.ts:127-138`) + D-31-2's no-new-label rule.

### Evidence rows (carrier amendment, 2026-09-17)

One row per material claim added by this amendment (fixed column order,
per `evidence-grounding` §The fixed evidence row):

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| Carrier named by the ruling + instruction: finding record `class`/`severity`/`reproducer`, verify exit code + closed reason codes, orchestrator cap refusal, phase-lint; frozen semantics verbatim | user | `decisions.md` D-31-6 + user instruction 2026-09-17 (recorded in this section) | — | not-applicable | decision | — |
| Finding record today: fields `id`/`severity`/`class`/`claim`/`evidenceRefs`/`verification`/`resolution`/`resolutionEvidence`; no `reproducer` field; severity enum `info\|low\|medium\|high\|critical`; class enum `product\|plan\|source\|environment\|runtime` | repository | `packages/agentic-workflow-schema/src/pre-execution-contract.ts:455-500` (`FINDING_SPEC`), enums `:102-112` | branch head `a400b978` @ 2026-09-17 | current | proven | — |
| Materiality predicate in code today: `const material = finding.severity !== "info"` — `low` currently material | repository | `packages/agentic-workflow-schema/src/pre-execution.ts:1059` | `a400b978` @ 2026-09-17 | current | proven | — |
| PASS rule + "the only immaterial" restatements live in the schema sources | repository | `pre-execution-contract.ts:101,197,459,549`; `pre-execution.ts:998` | `a400b978` @ 2026-09-17 | current | proven | — |
| Freshness vocabulary closed at 10 codes (`invalid-stage`, `invalid-unit`, `stale-policy`, `impossible-timeline`, `stale-context`, `stale-source-revision`, `stale-parent`, `stale-artifact-revision`, `stale-artifact-content`, `missing-receipt-snapshot`) | repository | `packages/agentic-workflow-schema/src/pre-execution.ts:159-170` | `a400b978` @ 2026-09-17 | current | proven | — |
| `verify` exit codes: 0 current · 3 no receipt · 4 receipt present but not current · 1 usage/error | repository | `scripts/pre-execution-snapshot.mjs:442,487,499` | `a400b978` @ 2026-09-17 | current | proven | — |
| `stale-artifact-revision` already answers "the authoring revision rotated … with no bound byte moved" — the machine half of the wording-only determination exists | repository | `scripts/pre-execution-snapshot.mjs:391` | `a400b978` @ 2026-09-17 | current | proven | — |
| Transition table rows `review-spec` (`:890`) and `review-plan` (`:923`) route FAIL/needs-design; the plan row does not sanction a plan-stage `needs-design` (fix/162 Decision 11) | repository | `packages/agentic-workflow-schema/src/index.ts:877-956`; `pre-execution-contract.ts:127-138` | `a400b978` @ 2026-09-17 | current | proven | — |
| Decider stop/sense codes are a closed vocabulary; no cycle awareness today | repository | `index.ts:712-725` (vocabulary), `:1069-1210` (`decideWorkflowAction`) | `a400b978` @ 2026-09-17 | current | proven | — |
| Phase-lint is a deterministic linter (8 rules + fingerprint); rule owner is `phase-contract` | repository | `scripts/phase-lint.mjs`; `skills/phase-contract/SKILL.md` | `a400b978` @ 2026-09-17 | current | proven | — |
| Receipt contract id `agentic-workflow/pre-execution-review-receipt@1`; policy version `v1` gates freshness (`stale-policy`) | repository | `pre-execution-contract.ts:39,56`; `scripts/pre-execution-snapshot.mjs:348` | `a400b978` @ 2026-09-17 | current | proven | — |
| Receipt current at authoring start: `verify --stage spec` → exit 0, `current: true`, `spec-review-pass`, `digestMatches: true` | repository | command run 2026-09-17 at `a400b978` | `a400b978` @ 2026-09-17 | current | proven | — |
| Baseline suites green: schema 707/707 at 4.2.0; dependency gate 12/12; context budgets PASS (40 skills) | repository | test runs 2026-09-17 at `a400b978` | `a400b978` @ 2026-09-17 | current | proven | — |
| `spec-review-31-3` PASS + digest-invariance proof; a Product-half edit rotates the digest → receipt `stale-artifact-content` → spec stage reopens, authorized by the ruling | user | `decisions.md` D-31-6; `progress.md` §Redesign & replan | — | not-applicable | decision | — |
| Tricorder: machine-computed analysis findings surfaced inside human review; guiding principles; data-driven ecosystem; empirical in-situ evaluation | document | https://research.google/pubs/pub43322/ (fetched 2026-09-17), abstract | page @ 2026-09-17 | current | proven | — |
| Required status checks must pass before a pull request can be merged; checks show whether a PR is ready to merge | document | https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks (fetched 2026-09-17) | page @ 2026-09-17 | current | proven | — |
| Prior materiality-domain research rows (arXiv:2603.00539; Google eng-practices "Nit:" convention) remain current from the initial write | document | `decisions.md` §Evidence rows (grounding, 2026-09-17) | — | current | proven | — |
| Schema package gate surface: `gate:pre-execution` = test + projection `--check` + package check + docs test | repository | `packages/agentic-workflow-schema/package.json` `scripts` | `a400b978` @ 2026-09-17 | current | proven | — |

## 2026-09-17 — Product repair batch (design-feature, artifact revision `31-spec-4`)

Trigger: `spec-review-31-4` returned `SPEC-REVIEW-FAIL` (failed check C8) with
one material `product` row (N31-004) plus one open `info` row (N31-005) — one
batch over the whole set, repair owner `design-feature`, user-commissioned as
"repair N31-004 + N31-005: extend AC7 to grep both CHECKS.md and both
OUTPUT.md for the removed materiality/loop sentences and LEDGERS.md for the
removal of 'info is the only immaterial one', correct the Integration-closure
row's Test claim, and stage-scope the NEEDS-DESIGN wording in Goal + Business
goals". This enters the spec stage's second repair/re-review cycle of the
window D-31-7 opened, so the `CONVERGENCE-ANOMALY` block was printed before
any edit (POLICY §4 — "printed and routed, never a stop"; a repair responding
to a persisted verdict is never a loop defect). Repair classes (REPAIR §2):

- **N31-004 — closure completion (autonomous; reviewed product intent
  unchanged).** In-scope item 5 already declared the shrink of both
  `CHECKS.md`, both `OUTPUT.md` and `LEDGERS.md` §3; what was missing was the
  verification. AC7's removal grep set gains three greps naming sentences
  verified to exist verbatim today (evidence rows below): both `CHECKS.md`
  lose "Material = anything above"; both `OUTPUT.md` lose the
  re-review-for-every-batch mandate — the `SPEC-REVIEW-FAIL` /
  `PLAN-REVIEW-FAIL, class: plan` verdict-route rows ("→ re-review of the new
  snapshot") and the closing hand-off blocks ("re-reviews the new artifact
  revision"); `LEDGERS.md` §3 loses "`info` is the only immaterial one". The
  kept-side greps are unchanged. The Integration-closure row "Skill reference
  docs" states its Test truthfully now: AC7's greps verify the shrink,
  `check-skill-context.mjs` checks budgets (AC10), and `normative-drift`
  guards the versioned blocks the shrink must not disturb (POLICY gate
  vocabulary, hand-off grammar) — it reads neither CHECKS.md nor OUTPUT.md and
  never pinned the materiality prose. No scope was widened: the AC now means
  what In-scope item 5 always said.
- **N31-005 — mechanical, intent-preserving.** The two summary instances of
  the unconverged-loop end are stage-scoped to the machine map, in substance
  D-31-8's wording: the Goal names `NEEDS-DESIGN` where the verdict vocabulary
  sanctions it (spec stage) and the orchestrator's refusal + `design-feature`
  routing at the plan stage; Business-goals bullet 2 carries the same scoping.
  D-31-2's "(stage-scoped by D-31-8)" pointer and every mechanism section
  (In-scope item 3, E3, expectation row 8) are untouched.

No new product decision is taken: both repairs stay inside intent the SPEC
already records (In-scope item 5, D-31-8); the decision set D-31-1…D-31-8 is
unchanged.

### Evidence rows (repair batch, 2026-09-17)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| Both `CHECKS.md` carry the materiality-definition sentence the shrink removes ("Material = anything above `info`") — the new AC7 grep names a sentence that exists verbatim | repository | `skills/review-spec/references/CHECKS.md:104`; `skills/review-plan/references/CHECKS.md:105` (no other `skills/` hit) | branch head `c5a6e173` @ 2026-09-17 | current | proven | — |
| Both `OUTPUT.md` carry the re-review-for-every-batch mandate the shrink removes: the FAIL verdict-route rows ("→ re-review of the new snapshot") and the closing hand-off blocks ("then /review-spec|/review-plan \<NN-slug\> re-reviews the new artifact revision") | repository | `skills/review-spec/references/OUTPUT.md:109,153`; `skills/review-plan/references/OUTPUT.md:118,160` (2 hits per file, none elsewhere) | `c5a6e173` @ 2026-09-17 | current | proven | — |
| `LEDGERS.md` §3 carries "`info` is the only immaterial one." | repository | `skills/pre-execution-review/references/LEDGERS.md:93` (sole hit) | `c5a6e173` @ 2026-09-17 | current | proven | — |
| `normative-drift` reads POLICY.md's versioned blocks, skill `SKILL.md` hand-offs and the turn contract — neither CHECKS.md nor OUTPUT.md, and no materiality sentence | repository | `scripts/normative-drift.test.mjs:76,324,343,366` | `c5a6e173` @ 2026-09-17 | current | proven | — |
| `check-skill-context.mjs` checks context budgets only (the corrected Integration row names it for that role) | repository | `scripts/check-skill-context.mjs` (budget walk); N31-004 finding evidence | `c5a6e173` @ 2026-09-17 | current | proven | — |

## 2026-09-17 — Product repair batch (design-feature, artifact revision `31-spec-5`)

Trigger: `spec-review-31-5` returned `SPEC-REVIEW-FAIL` (failed checks C1, C8,
C10) with N31-006 (medium) + N31-007 (low) + N31-008 (info), all `product` —
one batch over the whole set, repair owner `design-feature`, user-commissioned
as "repair N31-006 + N31-007 + N31-008: make AC7's two POLICY §4 removal
greps discriminate (targets are line-wrapped — match a single-line fragment),
add a criterion for the four skill version: bumps + README cells, and correct
In-scope 5's \"keep only\" framing to name the authored remainder".

**Cycle authorization (D-31-7).** This is the spec stage's third consecutive
unconverged cycle in the window the carrier amendment opened
(`spec-review-31-4` FAIL #1 → `31-spec-4` batch → `spec-review-31-5` FAIL #2 →
this batch). D-31-7 keys a third cycle to explicit user instruction; the
commission quoted above is that instruction, issued in direct answer to the
`spec-review-31-5` receipt's hand-off (which named this exact command and the
third-cycle gate). Recorded per REPAIR §4: a repair responding to a persisted
verdict is never a loop defect; the window's `CONVERGENCE-ANOMALY` block was
printed on entry to cycle 2 and is reproduced in the `spec-review-31-5`
receipt — POLICY §4's anomaly rule scopes to second-cycle entry, so no new
block is due for a user-keyed third cycle.

Repair classes (REPAIR §2):

- **N31-006 — closure completion (autonomous; reviewed product intent
  unchanged).** AC7's two POLICY §4 removal greps could not match their
  line-wrapped targets, so they passed whether or not the sentences were
  removed. They now match single-line fragments verified present at branch
  head `4cf755ab` (evidence rows below): `grep -n "no cap converts a verdict
  into a"` hits `POLICY.md:83` (the sentence's tail "dead end." wraps to
  `:84`), and `grep -n "cycle is allowed when correctness needs it"` hits
  `POLICY.md:61` — the second line of the wrapped "Entering a **second** cycle
  is allowed …" sentence (`:60-61`) and the fragment tied to the permissive
  semantics the shrink removes, so the authored cap text does not resurrect
  it. Both fragments are unique in `skills/`. Each grep now exits 0 while the
  sentence stands and non-zero after the shrink — the criterion discriminates.
  The full-sentence patterns are gone from the AC (they were the defect).
- **N31-007 — closure completion (the obligation was already In-scope 7's
  declared content; only its criterion was missing).** New **AC14**: a
  pathspec-limited `git diff main` over the four touched `SKILL.md` files must
  carry one removed + one added `version:` line per file (≥ 8 hunk lines — a
  skill whose version did not move contributes no hunk; `bump-skill`'s
  guardrail keeps everything else out of those files, so the hunk is exactly
  the bump), each old→new pair a semver-minor increment per the #176 freeze,
  `CHANGELOG.md` gaining one per-skill row per bumped skill (the AC10
  `normative-drift` version-tables check recomputes those tables against the
  frontmatter `version:` lines, so a moved version without its row fails
  AC10), and the README `## The skills` cells for the four touched skills
  accurate post-shrink (`bump-skill`'s update-not-rewrite surface;
  `pre-execution-review` is narrative-only in README — no version cells exist
  in README, the cells are description-accuracy cells). In-scope 7's AC
  pointer (`AC10 + AC11 + AC14`) and the Integration-closure row
  "Versioning/release surfaces" Test cell carry the new criterion. No scope
  widened: the bumps/CHANGELOG/README surfaces were already In-scope 7 and the
  derived-surfaces declaration.
- **N31-008 — mechanical, intent-preserving.** In-scope 5's "keep only"
  framing presented authored prose as preserved prose. The item now names the
  **authored remainder**: the anti-deflation judgment ("`medium` minimum"),
  the human-keyed third-cycle rule and the report-note persistence contract
  (with the planning materiality line — material = `medium`+; `low` is a
  report-note — replacing the removed sentences) are written fresh by this
  feature; only the `CONVERGENCE-ANOMALY` block and the receipt-literal lines
  are preserved byte-unchanged. This row also corrects the prior decisions'
  "stays" framing by record (decisions are append-only): the remainder of
  In-scope item 5 is authored, not preserved — the earlier batches' intent was
  always the authored state AC7's kept-side greps require; only the wording
  misstated it. AC7's kept-side greps are unchanged (the reviewer verified
  they are correct).

No new product decision is taken: the repairs stay inside intent the SPEC
already records (In-scope items 5 and 7, AC7, D-31-2/D-31-7); the decision set
D-31-1…D-31-8 is unchanged.

### Evidence rows (repair batch, 2026-09-17)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| POLICY §4's "no cap converts a verdict into a (dead end.)" sentence wraps across `:83-84`; the fragment "no cap converts a verdict into a" sits wholly on `:83` and is unique in `skills/` — the replacement AC7 grep exits 0 with the sentence standing | repository | `grep -n "no cap converts a verdict into a" skills/pre-execution-review/references/POLICY.md` → `83:` (exit 0, sole hit); `sed -n '83,84p'` (wrapped sentence) | branch head `4cf755ab` @ 2026-09-17 | current | proven | — |
| POLICY §4's "Entering a **second** cycle is allowed when correctness needs it …" sentence wraps across `:60-61`; the fragment "cycle is allowed when correctness needs it" sits wholly on `:61`, is unique in `skills/`, and carries the permissive semantics the cap replaces — the replacement AC7 grep exits 0 with the sentence standing | repository | `grep -n "cycle is allowed when correctness needs it" skills/pre-execution-review/references/POLICY.md` → `61:` (exit 0, sole hit); `sed -n '60,61p'` (wrapped sentence) | `4cf755ab` @ 2026-09-17 | current | proven | — |
| The four touched skills' current `version:` lines: `pre-execution-review` 2.2.1, `review-spec` 1.7.1, `review-plan` 1.6.1, `design-feature` 3.4.0 — AC14's ≥ 8 hunk-line anchor discriminates because `bump-skill` changes nothing else in a SKILL.md, so a non-bumped skill contributes no `^[+-]version: ` hunk | repository | `grep -m1 '^version:' skills/<name>/SKILL.md` ×4; `skills/bump-skill/SKILL.md` guardrail "Never change anything in a SKILL.md except the `version:` line" | `4cf755ab` @ 2026-09-17 | current | proven | — |
| `CHANGELOG.md`'s per-skill tables are the source of truth for per-version changes, and `normative-drift` recomputes the version tables against the frontmatter `version:` lines (rendered-facts `version-tables` claim) — so a moved version without a CHANGELOG row fails AC10's pack, and AC14's row check reads the diff | repository | `CHANGELOG.md:3-5` (per-skill tables preamble); `CLAUDE.md` rendered-facts table (`CHANGELOG.md \| version-tables \| frontmatter:version \| equals-each`); `scripts/normative-drift.test.mjs` | `4cf755ab` @ 2026-09-17 | current | proven | — |
| README has no version cells: the "skills tables" are the per-stage description tables (`## The skills`) — `design-feature` (table cell), `review-spec`, `review-plan` (table cells), `pre-execution-review` (narrative-only, `user-invocable: false`) — and `bump-skill` keeps them accurate (update-not-rewrite) — AC14's README leg is a description-accuracy walk, not a version read | repository | `README.md:84-147` (per-stage tables; `pre-execution-review` narrative at `:89`); `skills/bump-skill/SKILL.md` ("The `README.md` skills and model tables are accurate"; "prefer updating over rewriting") | `4cf755ab` @ 2026-09-17 | current | proven | — |
| Receipt state at authoring start: `verify --stage spec` → exit 4 (receipt not current), receipt `spec-review-31-5` bound, `digestMatches: true`, `verdictIsPass: false` — the open FAIL receipt that names this repair (REPAIR §4: the unit is being repaired by definition) | repository | `node scripts/pre-execution-snapshot.mjs verify --stage spec --unit 31-planning-review-materiality` (run 2026-09-17 at `4cf755ab`) | `4cf755ab` @ 2026-09-17 | current | proven | — |
| Prior materiality-domain research rows (arXiv:2603.00539; Google eng-practices "Nit:"; GitHub required status checks; Tricorder) remain current from the initial write and the 31-spec-4 batch — this batch authors no new domain claim, so the research gate is satisfied by those rows at `current` freshness | document | `decisions.md` §Evidence rows (grounding, 2026-09-17; repair batch `31-spec-4`, 2026-09-17) | — | current | proven | — |

## 2026-09-17 — Product repair batch (design-feature, artifact revision `31-spec-6`)

Trigger: `spec-review-31-6` returned `SPEC-REVIEW-FAIL` (failed checks C8, C9;
12/14 pass) with N31-009 (medium) + N31-010 (medium) + N31-011 (info), all
`product` — one batch over the whole set, repair owner `design-feature`,
user-commissioned as "repair N31-009 + N31-010 + N31-011: make AC2's
contract-prose check discriminate (grep the description for a new-line
fragment such as material = \`medium\`/report-note, not the bare word medium,
or move the clause to read-verified), cover REPAIR.md §4's second sentence in
AC7 (grep -n \"no cycle cap converts\"
skills/design-feature/references/REPAIR.md` exits non-zero), and fix the
Spec-lint AC1 classification" — one repair batch for N31-009 + N31-010 +
N31-011.

**Cycle authorization (D-31-7).** This is the spec stage's fourth consecutive
unconverged cycle in the window the carrier amendment opened
(`spec-review-31-4` FAIL #1 → `31-spec-4` batch → `spec-review-31-5` FAIL #2 →
`31-spec-5` batch → `spec-review-31-6` FAIL #3 → this batch). D-31-7 keys a
further cycle to explicit user instruction; the commission quoted above is
that instruction, issued in direct answer to the `spec-review-31-6` receipt's
hand-off (which named this exact command and batch). Under the live POLICY §4
the planning loop is still uncapped — that is the defect this unit fixes — so
the cycle is lawful on both readings; the window's `CONVERGENCE-ANOMALY` block
was printed on entry to cycle 2 and is reproduced in the `spec-review-31-6`
receipt — POLICY §4's anomaly rule scopes to second-cycle entry, so no new
block is due for a user-keyed further cycle. Recorded per REPAIR §4: a repair
responding to a persisted verdict is never a loop defect.

Repair classes (REPAIR §2):

- **N31-009 — closure completion (autonomous; reviewed product intent
  unchanged).** AC2's second anchor `grep -n "medium"
  .../pre-execution-contract.ts` matched the severity enum literal at `:103`
  (observed: 1 hit, exit 0 at `bccc95fd`) whether or not the finding-record
  severity description (`:459`, today "`info` is the only immaterial row.")
  was rewritten — the requirement it was the only anchor for (the description
  states material = `medium`+; `low` is a report-note) could ship unfulfilled
  with AC2 green. The anchor is replaced by two greps over the same file whose
  fragments exist only in the rewritten description: `grep -nE 'material =
  .medium'` and `grep -n "report-note"`. Both exit 1 at `bccc95fd` (no
  "material = " and no "report-note" text exists in the file) and turn 0 only
  when the rewrite lands, so the enum literal can no longer fake a pass; the
  removal grep (`the only immaterial` → non-zero) is unchanged. The
  commission's alternative — move the clause to `read-verified` — was not
  taken: a discriminating command anchor keeps AC2 `(command)` and objective,
  strictly stronger than a judgement-only walk.
- **N31-010 — closure completion (In-scope 5 already declared REPAIR.md §4
  among the shrunk surfaces; only this sentence's criterion was missing).**
  AC7 gains the removal grep for §4's second unbounded-cycle sentence:
  `grep -n "no cycle cap converts"
  skills/design-feature/references/REPAIR.md` exits non-zero. The fragment
  sits wholly on `:71` ("… and no cycle cap converts its verdict into a dead
  end."), is unique in the file, and exits 0 with the sentence standing at
  `bccc95fd` — it matches while the sentence stands and disappears with it,
  the same discrimination N31-006 gave the other removal greps. The authored
  cap mirror that replaces the sentence does not contain the fragment, so the
  grep cannot false-fail the post-shrink state.
- **N31-011 — mechanical, intent-preserving.** The Spec-lint box's AC
  classification re-files AC1 into the group its own label declares: the box
  now reads "AC2–AC3, AC5, AC10–AC12 pure commands; AC1, AC4, AC6–AC9,
  AC13–AC14 command + `read-verified` where judgement-only". No criterion
  text changes; every other criterion already matched its group (per the
  finding's own walk).

No new product decision is taken: the repairs stay inside intent the SPEC
already records (In-scope items 1 and 5, AC2, AC7, D-31-1/D-31-2); the
decision set D-31-1…D-31-8 is unchanged.

### Evidence rows (repair batch, 2026-09-17)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| `pre-execution-contract.ts` carries the severity enum literal ("info", "low", "medium", "high", "critical",) at `:103` and the finding-record severity description "`info` is the only immaterial row." at `:459`; the bare `grep -n "medium"` over the file hits only `:103` — N31-009's false-green anchor, verified | repository | `sed -n '103p;459p' packages/agentic-workflow-schema/src/pre-execution-contract.ts`; observed `grep -n "medium" packages/agentic-workflow-schema/src/pre-execution-contract.ts` → 1 hit (`:103`), exit 0 | branch head `bccc95fd` @ 2026-09-17 | current | proven | — |
| The replacement AC2 fragments discriminate: `grep -nE 'material = .medium'` and `grep -n "report-note"` over `pre-execution-contract.ts` both exit 1 today (no "material = " and no "report-note" text exists in the file) and turn 0 only when the rewritten description adds them — a PR cannot satisfy AC2 while the description still reads "`info` is the only immaterial row." | repository | observed `grep -nE 'material = .medium' packages/agentic-workflow-schema/src/pre-execution-contract.ts` → exit 1; `grep -n "report-note" packages/agentic-workflow-schema/src/pre-execution-contract.ts` → exit 1 (at `bccc95fd`) | `bccc95fd` @ 2026-09-17 | current | proven | — |
| REPAIR.md §4's second unbounded-cycle sentence sits wholly on `:71` ("… and no cycle cap converts its verdict into a dead end."); the fragment "no cycle cap converts" is unique in the file and exits 0 with the sentence standing — the replacement AC7 grep discriminates removal | repository | `grep -n "no cycle cap converts" skills/design-feature/references/REPAIR.md` → `71:` (exit 0, sole hit at `bccc95fd`) | `bccc95fd` @ 2026-09-17 | current | proven | — |
| Receipt state at authoring start: `verify --stage spec` → exit 4 (receipt not current), receipt `spec-review-31-6` bound, `digestMatches: true`, `verdictIsPass: false` — the open FAIL receipt that names this repair (REPAIR §4: the unit is being repaired by definition) | repository | `node scripts/pre-execution-snapshot.mjs verify --stage spec --unit 31-planning-review-materiality` (run 2026-09-17 at `bccc95fd`) | `bccc95fd` @ 2026-09-17 | current | proven | — |
| Prior materiality-domain research rows (arXiv:2603.00539; Google eng-practices "Nit:"; GitHub required status checks; Tricorder) remain current from the initial write and the earlier batches — this batch authors no new domain claim, so the research gate is satisfied by those rows at `current` freshness | document | `decisions.md` §Evidence rows (grounding, 2026-09-17; repair batches `31-spec-4`/`31-spec-5`, 2026-09-17) | — | current | proven | — |

## 2026-09-17 — Product repair batch (design-feature, artifact revision `31-spec-7`)

Trigger: `spec-review-31-7` returned `SPEC-REVIEW-FAIL` (failed check C8;
12/14 pass) with N31-012 (medium) + N31-013 (low), both `product` — one batch
over the whole set, repair owner `design-feature`, user-commissioned as
"repair N31-012 + N31-013: add a POLICY.md §3 criterion to AC7 (single-line
fragment such as grep -n \"re-review of the resulting snapshot\" exits
non-zero, or the intended qualified-sentence fragment) so the declared §3
shrink is observable, and add a bound check for the reproducer field to AC3
(or move 'bounded' to read-verified)" — one repair batch for N31-012 +
N31-013.

**Cycle authorization (D-31-7).** This is the spec stage's fifth consecutive
unconverged cycle in the window the carrier amendment opened
(`spec-review-31-4` FAIL #1 → `31-spec-4` batch → `spec-review-31-5` FAIL #2 →
`31-spec-5` batch → `spec-review-31-6` FAIL #3 → `31-spec-6` batch →
`spec-review-31-7` FAIL #4 → this batch). D-31-7 keys a further cycle to
explicit user instruction; the commission quoted above is that instruction,
issued in direct answer to the `spec-review-31-7` receipt's hand-off. Under
the live POLICY §4 the planning loop is still uncapped — that is the defect
this unit fixes — so the cycle is lawful on both readings; the window's
`CONVERGENCE-ANOMALY` block was printed on entry to cycle 2 and is reproduced
in the `spec-review-31-7` receipt — POLICY §4's anomaly rule scopes to
second-cycle entry, so no new block is due for a user-keyed further cycle.
Recorded per REPAIR §4: a repair responding to a persisted verdict is never a
loop defect.

Repair classes (REPAIR §2):

- **N31-012 — closure completion (In-scope 5 already declares POLICY.md §3
  among the shrunk surfaces; only this sentence's criterion was missing).**
  AC7 verifies the re-review-for-every-batch mandate in both `OUTPUT.md`
  files but had no anchor for the §3 sentence In-scope 5 declares lost and
  §Context names as the defect the wording-only route fixes. AC7 gains
  `grep -n "re-review of the resulting snapshot"
  skills/pre-execution-review/references/POLICY.md` → non-zero. The §3
  sentence wraps across `:41-42` ("… before a single\nre-review of the
  resulting snapshot."), so a full-phrase grep would false-pass exactly as
  N31-006's §4 greps did; the anchor is the sentence's single second line
  (`:42`), unique in the file (`grep -c` → 1), and exits 0 with the sentence
  standing at branch head `6f1d024e` — it matches while the sentence stands
  and disappears with it. The commission's alternative — grep the intended
  qualified sentence — was not taken: the removal fragment is observable
  without fixing the replacement's wording, which stays an implementation
  choice inside In-scope 5's declared intent (§3 loses the unconditional
  mandate; the wording-only route keeps a re-review for material movement
  per In-scope 2).
- **N31-013 — closure completion (In-scope 1 already declares the field
  bounded; only the bound's criterion was missing).** AC3 proved only token
  presence (`grep -n "reproducer"` exit 1 today, so presence discriminated —
  the defect was the missing bound check, as the finding itself notes). AC3
  gains two command anchors: `grep -A8 'key: "reproducer"'
  packages/agentic-workflow-schema/src/pre-execution-contract.ts | grep -c
  "maxLength"` returns ≥ 1 (the field entry declares its size bound;
  `VerificationFieldSpec.maxLength` is optional at `verification-contract.ts:51`,
  so a bound-less declaration fails the anchor — observed count 0 at
  `6f1d024e`), and `grep -rln "reproducer"
  packages/agentic-workflow-schema/test/` exits zero (a suite vector
  exercises the field; observed exit 1 today — the receipt test walks
  vocabularies, not per-field bounds). The suite clause now names the bound
  vector (a `reproducer` longer than the field's declared `maxLength` is
  refused) beside the existing back-compatibility clause. The commission's
  alternative — move `bounded` to `read-verified` — was not taken: command
  anchors keep AC3 `(command)` and objective, strictly stronger than a
  judgement-only walk. AC3's label is unchanged, so the Spec-lint product
  box's AC groups need no refile.

No new product decision is taken: the repairs stay inside intent the SPEC
already records (In-scope items 1 and 5, AC3, AC7, D-31-1/D-31-2); the
decision set D-31-1…D-31-8 is unchanged.

### Evidence rows (repair batch, 2026-09-17)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| POLICY.md §3's re-review mandate sentence wraps across `:41-42` ("applies **one** evidence-bounded repair batch to the owning artifact(s) before a single / re-review of the resulting snapshot."); the fragment "re-review of the resulting snapshot" is its single second line, unique in the file and unique under `skills/`, and exits 0 with the sentence standing — the replacement AC7 grep discriminates removal | repository | `sed -n '39,42p' skills/pre-execution-review/references/POLICY.md`; observed `grep -n "re-review of the resulting snapshot" skills/pre-execution-review/references/POLICY.md` → `42:` (exit 0, sole hit); `grep -rn "re-review of the resulting snapshot" skills/` → 1 hit (at `6f1d024e`) | `6f1d024e` @ 2026-09-17 | current | proven | — |
| The AC3 bound anchors discriminate: `grep -n "reproducer"` over `pre-execution-contract.ts` exits 1 (field absent), `grep -A8 'key: "reproducer"' … \| grep -c "maxLength"` returns 0, and `grep -rln "reproducer" packages/agentic-workflow-schema/test/` exits 1 (no test names the field) — all turn 0 / ≥ 1 only when the bounded field and its suite vector land; `VerificationFieldSpec.maxLength` is optional at `verification-contract.ts:51`, so a bound-less declaration is representable and would fail the declaration anchor | repository | observed greps at branch head (2026-09-17); `packages/agentic-workflow-schema/src/verification-contract.ts:51` (`readonly maxLength?: number`); `packages/agentic-workflow-schema/test/pre-execution-receipt.test.mjs:116` walks vocabularies, not per-field bounds | `6f1d024e` @ 2026-09-17 | current | proven | — |
| Receipt state at authoring start: `verify --stage spec` → exit 4 (receipt not current), receipt `spec-review-31-7` bound, `digestMatches: true`, `verdictIsPass: false` — the open FAIL receipt that names this repair (REPAIR §4: the unit is being repaired by definition) | repository | `node scripts/pre-execution-snapshot.mjs verify --stage spec --unit 31-planning-review-materiality` (run 2026-09-17 at `6f1d024e`) | `6f1d024e` @ 2026-09-17 | current | proven | — |
| Prior materiality-domain research rows (arXiv:2603.00539; Google eng-practices "Nit:"; GitHub required status checks; Tricorder) remain current from the initial write and the earlier batches — this batch authors no new domain claim, so the research gate is satisfied by those rows at `current` freshness | document | `decisions.md` §Evidence rows (grounding, 2026-09-17; repair batches `31-spec-4`/`31-spec-5`/`31-spec-6`, 2026-09-17) | — | current | proven | — |
