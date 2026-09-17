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
