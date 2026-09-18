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

## 2026-09-17 — Product repair batch (design-feature, artifact revision `31-spec-8`)

Trigger: `spec-review-31-8` returned `SPEC-REVIEW-FAIL` (failed check C8;
13/14 pass) with one finding, N31-014 (`medium`, product) — one batch over
the whole open spec-stage set (N31-012/N31-013 are verified repaired at
`31-spec-7`; no other open product row), repair owner `design-feature`,
user-commissioned as "repair N31-014: give POLICY.md §4's third
unbounded-cycle sentence ('… so no cycle cap or anomaly rule may block or end
it.', :82) a criterion in AC7 so the declared §4 shrink is observable".

**Cycle authorization (D-31-7).** This is the spec stage's sixth consecutive
unconverged cycle in the window the carrier amendment opened
(`spec-review-31-4` FAIL #1 → `31-spec-4` → `spec-review-31-5` FAIL #2 →
`31-spec-5` → `spec-review-31-6` FAIL #3 → `31-spec-6` → `spec-review-31-7`
FAIL #4 → `31-spec-7` → `spec-review-31-8` FAIL #5 → this batch). D-31-7 keys
a further cycle to explicit user instruction; the commission quoted above is
that instruction, issued in direct answer to the `spec-review-31-8` receipt's
hand-off. Under the live POLICY §4 the planning loop is still uncapped — that
is the defect this unit fixes — so the cycle is lawful on both readings; the
window's `CONVERGENCE-ANOMALY` block was printed on entry to cycle 2 and is
reproduced in the `spec-review-31-8` receipt — POLICY §4's anomaly rule scopes
to second-cycle entry, so no new block is due for a user-keyed further cycle.
Recorded per REPAIR §4: a repair responding to a persisted verdict is never a
loop defect.

Repair class (REPAIR §2):

- **N31-014 — closure completion (In-scope 5 already declares POLICY.md §4's
  unbounded-cycle sentences among the shrunk surfaces; only this sentence's
  criterion was missing).** AC7's removal set covered two of §4's three
  unbounded-cycle claims (`:61` "Entering a **second** cycle is allowed …";
  `:83` "… no cap converts a verdict into a dead end.") while the third —
  "a repair turn whose input is a FAIL/NEEDS-DESIGN receipt produces a new
  snapshot by design, so no cycle cap or anomaly rule may block or end it."
  (`:81-82`) — is the claim most directly contradicted by the shipped rule
  (E3: "a third never starts: the orchestrator refuses and names the human
  route"; AC5). AC7 gains `grep -n "no cycle cap or anomaly rule"
  skills/pre-execution-review/references/POLICY.md` → non-zero. The sentence
  wraps across `:81-82`, so the anchor is its single second line (`:82`),
  unique in the file (`grep -c` → 1) and in `skills/` (1 hit), and exits 0
  with the sentence standing at branch head `12ddc215` — it matches while the
  sentence stands and disappears with it, the same line-wrap discrimination
  N31-006 gave the first two §4 greps and N31-012 the §3 grep. No new product
  decision is taken: the repair stays inside intent the SPEC already records
  (In-scope 5, AC7, D-31-2/D-31-7); the decision set D-31-1…D-31-8 is
  unchanged.

### Evidence rows (repair batch, 2026-09-17)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| POLICY.md §4's third unbounded-cycle sentence ("a repair turn whose input is a FAIL/NEEDS-DESIGN receipt produces a new snapshot by design, so no cycle cap or anomaly rule may block or end it.") wraps across `:81-82`; the fragment "no cycle cap or anomaly rule" is contained in its single second line (`:82`), unique in the file and unique under `skills/`, and exits 0 with the sentence standing — the replacement AC7 grep discriminates removal | repository | `sed -n '79,84p' skills/pre-execution-review/references/POLICY.md`; observed `grep -n "no cycle cap or anomaly rule" skills/pre-execution-review/references/POLICY.md` → `82:` (exit 0, sole hit, `grep -c` → 1); `grep -rn "no cycle cap or anomaly rule" skills/` → 1 hit (at `12ddc215`) | `12ddc215` @ 2026-09-17 | current | proven | — |
| Receipt state at authoring start: `verify --stage spec` → exit 4 (receipt not current), receipt `spec-review-31-8` bound, `digestMatches: true`, `verdictIsPass: false` — the open FAIL receipt that names this repair (REPAIR §4: the unit is being repaired by definition) | repository | `node scripts/pre-execution-snapshot.mjs verify --stage spec --unit 31-planning-review-materiality` (run 2026-09-17 at `12ddc215`) | `12ddc215` @ 2026-09-17 | current | proven | — |
| Prior materiality-domain research rows (arXiv:2603.00539; Google eng-practices "Nit:"; GitHub required status checks; Tricorder) remain current from the initial write and the earlier batches — this batch authors no new domain claim, so the research gate is satisfied by those rows at `current` freshness | document | `decisions.md` §Evidence rows (grounding, 2026-09-17; repair batches `31-spec-4`/`31-spec-5`/`31-spec-6`/`31-spec-7`, 2026-09-17) | — | current | proven | — |

---

## 2026-09-17 — Engineering replan for the code carrier (plan-feature, artifact revision `31-plan-3`)

The re-cut the Product carrier amendment (`31-spec-3`, D-31-6) and the Product
half's `## Design status` require: `plan-feature` re-cuts the plan set
(`31-plan-1/2` superseded, never repaired) once a current `SPEC-REVIEW-PASS`
receipt exists — `spec-review-31-9` @ snapshot
`e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507`, verified
fresh at this turn's Product-review gate. The re-cut retired the plan-stage
finding rows R31-01/R31-02/R31-03 (resolved in `planning-findings.md`), re-froze
`ACCEPTANCE.md` (blob `3d7e7c9ee92314261e5529815c76b373e8ca2745`) and rotated the
artifact revision label to `31-plan-3`.

Earlier engineering decisions, and what the carrier move does to them:

- **E-D31-1** (one version bump per skill per PR) — in force.
- **E-D31-2** (no `docs/workflow/` tutorial edit) — in force.
- **E-D31-3** (AD-008 classified `preserves`) — in force; carried by O15.
- **E-D31-4** (planning-side pins live in the existing discipline suite) — in
  force, re-aimed at the code carriers by E-D31-14 below.
- **E-D31-5** (`PLANNING_PIN_TABLE` with a prose row floor and a discrimination
  leg) — **superseded**. The pins no longer police prose sentences; a
  discrimination leg over superseded wording has nothing to discriminate. The
  suite's planning block reads code carriers instead.
- **E-D31-6** (the bundler is always spelled from the package that owns it) —
  in force.
- **E-D31-7** (the diff-scope walk names the declared derived surfaces) — in
  force, re-aimed at AC13's three declared groups.

New decisions of this replan:

### E-D31-8: The materiality predicate is a closed membership test over the material severities

`validatePreExecutionReceiptAgainstSnapshot` replaces `finding.severity !==
"info"` with a membership test over the material set (`medium`, `high`,
`critical`). A negated comparison would let a future severity value become
material silently; the closed set spells the material severities once. The rule
id `pass-requires-resolved-material-findings` and its published claim text are
unchanged, and no severity value is added, renamed or removed.

### E-D31-9: `reproducer` is optional and bounded, with the bound published

`FINDING_SPEC` gains `{ key: "reproducer", type: "string", minLength: 1,
maxLength: PRE_EXECUTION_LIMITS.reproducerChars, nulFree: true }`, mirrored as
`readonly reproducer?: string`. `reproducerChars: 1024` joins
`PRE_EXECUTION_LIMITS` so the bound is published rather than spelled in the
field. Optional on purpose: a receipt whose findings carry no `reproducer` stays
valid, so the addition is additive for every producer. AC3 anchors both halves —
the declared `maxLength` and the bound refusal vector — because
`VerificationFieldSpec.maxLength` is itself optional and a bound-less
declaration would pass the structural walk.

### E-D31-10: The cap-refusal outcome is one added stop code, fed by a derived count

`WORKFLOW_DECISION_STOP_CODES` gains exactly one value, `stop-review-loop-cap`.
`WorkflowDecisionInput` gains the optional `reviewLoopCycles: { spec?: number;
plan?: number }`, derived per run from the persisted receipts (D-31-7: `n` is the
consecutive FAIL-verdict receipts for a stage since its last PASS-verdict
receipt; a PASS resets `n` to 0). `decideWorkflowAction` answers, before the
transition-table match, with `kind: "stop"`, `intent: "ask-human"`,
`reasonCode: "stop-review-loop-cap"` and the human route (`design-feature`) named
in `detail` when a `review-spec`/`review-plan` proposal's stage count reaches
two. Every existing code value and every transition row keeps its behavior: the
`review-spec` row already allows `design-feature`, and plan-stage `needs-design`
stays narrowed (fix/162).

### E-D31-11: The determination record reuses the existing record-block family in the unit's evidence home

The wording-only determination is recorded as a `## Wording-only determination v1
— <stage>` block with `- Field: value` lines — the shape the pre-execution
receipt blocks already use — in the unit's evidence home (`planning-evidence.md`
for the plan stage, the SPEC's `### Planning evidence` for XS/S, `decisions.md`
for the spec stage). The alternative (a new fenced grammar plus a `CLAUDE.md`
`normative-surfaces@1` row) is rejected: it would put `CLAUDE.md` in the PR diff,
outside AC13's three declared groups. Precedent evidence: PE-011 — the receipt
block itself is not a `normative-surfaces@1` row. The homes are outside the
durable-ledger ownership map, so no writer row changes; the authoring skill
(`plan-feature`, `plan-fix`, `design-feature`) writes the block, and the
`# no-script-writer` directive keeps scripts as readers only.

### E-D31-12: The wording-only answer adds no freshness code, flag or exit code

`attributeFreshness` keeps the comparator's precedence and the ten closed codes:
a matching determination (same artifact revision, same acceptance fingerprint,
zero changed context authorities) answers `fresh` with the determination id named
in `detail`, and every other movement keeps `stale-artifact-content` (exit 4). A
rotated revision with no matching determination keeps `stale-artifact-revision`;
an absent acceptance manifest makes the route unavailable (fail closed). This is
the Product half's In-scope 2 read literally: "revision rotated, determination
recorded, acceptance fingerprint and bound material bytes unmoved → still
current".

### E-D31-13: The acceptance manifest is re-frozen by this re-cut

Every AC1–AC9/AC11/AC13/AC14 validator anchored to the superseded prose carrier,
so the frozen finish line had to move with the carrier. The new blob
`3d7e7c9ee92314261e5529815c76b373e8ca2745` is recorded in `PLAN.md` and receipted
in `progress.md`; the superseded `d85e217acad1322d3caf4968715ef5d00e9189c0` is
retained only as traceability (`known-issues.md` boundary 9).

### E-D31-14: The pins read the code carriers, and the release records ride one PR

`scripts/review-loop-discipline.test.mjs` keeps every existing assertion and adds
a planning block that reads the schema package's predicate, the CLI's verify
report and the decider's refusal — so the suite still fails when a rule regresses
while the prose shrink is validated by AC7's removal greps. The four skill minor
bumps and the schema package's 4.3.0 bump land once each in this PR, with their
CHANGELOG rows and README cells, and the Pi mirror re-bundles from the package
root in the hardening phase after the last `skills/` edit.

### Evidence rows (replan, 2026-09-17)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| The Product half carries a current independent PASS at this replan: `spec-review-31-9` @ `e15374a3…`, 14/14 checks, zero findings, and the CLI re-derives the same digest | repository | `progress.md` receipt block `spec-review-31-9`; `node scripts/pre-execution-snapshot.mjs verify --stage spec --unit 31-planning-review-materiality` → `current: true`, `structural.fresh: true` (run 2026-09-17 at `4b7cad56`) | `4b7cad56` @ 2026-09-17 | current | proven | re-run at the plan review |
| The `spec-product-v1` projection excludes the Engineering half and `## Amendments`, so the re-cut cannot move the Product bytes: post-write `build --stage spec` still answers `e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507` | repository | `packages/agentic-workflow-schema/src/pre-execution.ts:482-556` (boundary scan after `## Design status`); observed post-write build at the re-cut | `4b7cad56` @ 2026-09-17 | current | proven | re-derive after any later SPEC write |
| The materiality predicate is one expression at `pre-execution.ts:1059`, the severity prose is at `pre-execution-contract.ts:101` and `:459`, and `FINDING_SPEC` is the record's one field list at `:455-500` | repository | the three locations, read at the re-cut | `4b7cad56` @ 2026-09-17 | current | proven | P1 edits |
| `VerificationFieldSpec.maxLength` is optional (`verification-contract.ts:51`), so AC3's bound anchor is what proves the `reproducer` declaration is bounded | repository | `packages/agentic-workflow-schema/src/verification-contract.ts:51`; `ACCEPTANCE.md` AC3 | `4b7cad56` @ 2026-09-17 | current | proven | P1 declares the bound |
| The decider's stop vocabulary is closed at six values (`index.ts:719-727`), its input type is `WorkflowDecisionInput` (`:746-756`), and `decideWorkflowAction` (`:1069`) is pure and fail-closed | repository | the three locations, read at the re-cut | `4b7cad56` @ 2026-09-17 | current | proven | P2 implements the refusal |
| The receipt block is not a `CLAUDE.md` `normative-surfaces@1` row (the declared rows are the CLI `contract` fenced output, the verdict vocabularies and the snapshot commands), so a record-block-family addition needs no `CLAUDE.md` edit | repository | `CLAUDE.md` blocks `normative-surfaces@1` and `rendered-facts@1` | `4b7cad56` @ 2026-09-17 | current | proven | E-D31-11 |
| `attributeFreshness` answers `stale-artifact-content` for moved bound artifact bytes and `stale-artifact-revision` for a rotated revision, in the comparator's precedence, with no way to distinguish a wording-only move today — the branch is new, and the manifest fingerprint is available because the plan snapshot binds `ACCEPTANCE.md` | repository | `scripts/pre-execution-snapshot.mjs:331-420`; `scripts/pre-execution-contract.mjs:33-75` (`STAGE_ARTIFACTS.plan`, `CONTEXT_SOURCES`) | `4b7cad56` @ 2026-09-17 | current | proven | P3 adds the branch |
| All nine AC7 removal fragments exist today with their sentences standing, and the kept-side `third cycle never` is absent today, so the greps discriminate and the shrink authors the remainder | repository | `REPAIR.md:64`, `:71`; `POLICY.md:42`, `:61`, `:82`, `:83`; `CHECKS.md` spec `:104` / plan `:105`; `OUTPUT.md` spec `:109,153` / plan `:118,160`; `LEDGERS.md:93`; `grep -n "third cycle never" skills/pre-execution-review/references/POLICY.md` → non-zero at `4b7cad56` | `4b7cad56` @ 2026-09-17 | current | proven | P4 rewrites, P5 re-runs |
| Roadmap row 31 reads `defined`, dependency 29 reads `done · #175` (merged), and rows 32/35/42/46 chain after 31 | repository | `docs/features/ROADMAP.md` rows 29–35, 42, 46 | `4b7cad56` @ 2026-09-17 | current | proven | the scaffold flips `defined → planned` and re-reads |
| The superseded manifest blob was `d85e217acad1322d3caf4968715ef5d00e9189c0`; the re-frozen manifest's blob is `3d7e7c9ee92314261e5529815c76b373e8ca2745` | repository | `git hash-object docs/features/31-planning-review-materiality/ACCEPTANCE.md` (observed at the re-cut); `PLAN.md` header | `4b7cad56` @ 2026-09-17 | current | proven | P5 re-checks the blob |

## 2026-09-17 — Engineering repair batch for `plan-review-31-3` (plan-feature, artifact revision `31-plan-4`)

Trigger: `plan-review-31-3` returned `PLAN-REVIEW-FAIL` (failed checks L5, P3, P8,
P10, P12) with five rows — P31-03 (high), P31-01/P31-02 (medium), P31-04/P31-05
(low). Repair owner: `plan-feature`, one batch over the whole set on the owner's
instruction. The batch repairs the plan; it does not re-open the Product half: the
decider stays the cap's carrier (In-scope 3), the materiality line and the two-cycle
cap are unchanged, and no acceptance criterion's required outcome is weakened.

### E-D31-15: The wording-only determination is recorded in the unbound `progress.md`

The plan-stage determination home (`planning-evidence.md`, or the SPEC's
`### Planning evidence`) is a **bound** artifact of the plan snapshot, and
`artifactRevisionId` defaults to `contentRevision` (the newest commit touching the
bound paths). Recording the block there rotates the very revision the block must
name, so E6's "recorded revision equals the snapshot's current
`artifactRevisionId`" had no fixed point and AC4's first outcome was unreachable
(P31-01). The home moves to the unit's `progress.md`: it is the one unit record
neither stage's `STAGE_ARTIFACTS` row binds (`scripts/pre-execution-contract.mjs:33-75`),
it already carries the review receipts and the `## Dependency receipt v1` block
written by agent turns, and appending a block there cannot rotate the revision it
records. The spec-stage home moves with it, so one home serves both stages. No
ownership row changes: the block is a record in an existing unit ledger, not a new
ledger column set, and `scripts/ledger-ownership.test.mjs` still fails any script
writing a ledger it does not own.

### E-D31-16: The wording-only branch is pure, and sits after `stale-context`, before `stale-source-revision`

A wording-only movement moves a bound artifact, so `sourceRevision` always rotates,
and `stale-source-revision` precedes `stale-artifact-content` in
`attributeFreshness`'s documented order. At the position the superseded plan named
("before the generic `stale-artifact-content` answer") the promised `fresh` answer
was dead code (P31-02). The branch now sits after the `stale-context` check and
before the `stale-source-revision` check; it is consulted only when a moved bound
artifact is named, `changedContexts` is empty, a determination records the
snapshot's current revision, and that block's acceptance fingerprint equals the
manifest's. When any of those fails the answer **falls through unchanged** (for
moved bound bytes: `stale-source-revision`), and no reason code on the
no-determination path is rewritten — the earlier P3 wording that named
`stale-artifact-revision` there was wrong. The branch receives its determination
and fingerprint as inputs (`wordingOnly`) and stays pure, so
`scripts/pre-execution-attribution.test.mjs`'s dimension-by-dimension agreement
with the schema comparator is unchanged.

### E-D31-17: The cap count is derived by one shared helper and projected into the envelope's `detail` bag

`decideWorkflowAction()` is consumer-side by feature 38's frozen A:12
(`scripts/workflow-status-sensor.test.mjs:268-269`;
`docs/features/38-workflow-status-sensor-script/SPEC.md:306`), so the superseded
P2 task — "pass [the count] into the decider input" from the sensor — had no
implementation that did not break that invariant, and no gate ran the suite that
pins it (P31-03). The batch keeps both properties: `scripts/pre-execution-contract.mjs`
gains the pure helper `deriveReviewLoopCycles(receipts)` (consecutive FAIL verdicts
per stage since that stage's last PASS; no receipt → `0`), and
`scripts/workflow-status.mjs` projects the recomputed value into the envelope's
existing **free-form** `detail` bag as `detail.review_loop_cycles = { spec, plan }`
(`packages/agentic-workflow-schema/envelope.schema.json` declares `detail` as an
open object, so no envelope shape or closed set moves). The consumer-side
orchestrator builds `WorkflowDecisionInput` from that value and gets the refusal.
the re-aimed `scripts/review-loop-discipline.test.mjs` block (a code carrier
already inside the AC10 pack) pins the projection string and the decider's
absence, so the invariant can no longer regress unseen; the behavioral emission
stays a hardening-phase observation because the feature-38 suite is outside every
gate and carries pre-existing failures at this head (`known-issues.md` §11).

### E-D31-18: The schema package's CHANGELOG row stays in the `docs` P4, with the `normative-drift` window declared

`rendered-facts@1` recomputes the `CHANGELOG.md` companion table against
`package.json` (`scripts/normative-drift.test.mjs:708-715`), so bumping the package
in P1 while the row lands later leaves the repo gate red across that window with no
phase-local validator covering it (P31-04). The row cannot move into P1 to close
it: `CHANGELOG.md` is a `docs` target and the canonical phase contract's box 2
refuses a `docs` target in a `config/infra` phase (`scripts/phase-lint.mjs`
`layerForTarget`; verified against the phase as cut, which lints PASS). The
allocation is therefore unchanged — row in P4 with the four skill release records
— P1's done-when stays package-local, the `normative-drift` window P1→P4 is
declared in `known-issues.md`, and P4's done-when runs `bun test
scripts/normative-drift.test.mjs` to prove the closure. **Amendment 2026-09-17
(`31-plan-5`, E-D31-21): the body originally read "the row moves into P1 with the
bump", which contradicts both this allocation and the linter's rule; that reading
is dead and this is the authoritative one.**

### E-D31-19: The Engineering half's evidence-row range is corrected

The half claimed "rows PE-001…PE-021" while the frozen ledger carried 23 rows
(`testing.md` cites `PE-023`) (P31-05). The range now reads the ledger's actual
rows, and this batch's six new rows (`PE-024`…`PE-029`) are part of it.

### Evidence rows (repair batch, 2026-09-17)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| The plan-stage determination homes named by the superseded E5 are all bound artifacts, so writing the block rotates the revision it must record | repository | `scripts/pre-execution-contract.mjs:33-75` (`STAGE_ARTIFACTS.plan`); `scripts/pre-execution-snapshot.mjs` `contentRevision()` | `7ace8dbc` @ 2026-09-17 | current | proven | E-D31-15; PE-026 |
| `progress.md` is not a bound artifact of either stage's snapshot, and a record block there survives its own write (the review receipts and `## Dependency receipt v1` prove the pattern) | repository | `scripts/pre-execution-contract.mjs:33-75`; `scripts/pre-execution-snapshot.mjs` `receipts()`; `skills/execute-phase/references/PREFLIGHT.md:50` | `7ace8dbc` @ 2026-09-17 | current | proven | E-D31-15; PE-026 |
| `attributeFreshness` orders `stale-context` → `stale-source-revision` → `stale-parent` → `stale-artifact-content` → `stale-artifact-revision` → `fresh`, and `sourceRevision` derives from the same bound paths a wording-only repair moves | repository | `scripts/pre-execution-snapshot.mjs` `attributeFreshness()`; `scripts/pre-execution-attribution.test.mjs:77-110` | `7ace8dbc` @ 2026-09-17 | current | proven | E-D31-16; PE-027 |
| Feature 38 pins `decideWorkflowAction()` consumer-side and the suite that asserts it is not in the AC10 pack or the P5 ladder | repository | `scripts/workflow-status-sensor.test.mjs:268-269`; `docs/features/38-workflow-status-sensor-script/SPEC.md:306`; `docs/features/31-planning-review-materiality/ACCEPTANCE.md` AC10 | `7ace8dbc` @ 2026-09-17 | current | proven | E-D31-17; PE-024 |
| The envelope's `detail` member is an open object, so `detail.review_loop_cycles` adds no field and moves no closed set | repository | `packages/agentic-workflow-schema/envelope.schema.json:220`; `CLAUDE.md` block `normative-surfaces@1` (`sensor-envelope-fields`, `must-name: no`) | `7ace8dbc` @ 2026-09-17 | current | proven | E-D31-17; PE-025 |
| `normative-drift` recomputes the CHANGELOG companion table against `package.json`, so the bump and its row are one unit of work | repository | `scripts/normative-drift.test.mjs:708-715`; `CLAUDE.md` block `rendered-facts@1` | `7ace8dbc` @ 2026-09-17 | current | proven | E-D31-18; PE-028 |
| The frozen evidence ledger carries 23 rows at artifact revision `31-plan-3` while the Engineering half claimed 21 | repository | `docs/features/31-planning-review-materiality/planning-evidence.md` (23 `| PE-` rows); `testing.md:47` (cites `PE-023`) | `7ace8dbc` @ 2026-09-17 | current | proven | E-D31-19; PE-029 |

## 2026-09-17 — Product-half amendment (design-feature, artifact revision `31-spec-9`)

Trigger: `plan-review-31-3` returned `PLAN-REVIEW-FAIL` (checks L5, P3, P8,
P10, P12); the `31-plan-4` repair batch fixed P31-01…P31-05 and surfaced one
row it could not repair — **P31-06** (`medium`, `class: product`, open in
`planning-findings.md`): AC13's declared **code-carrier** allowed-set group
omits three paths the plan edits by design, so the frozen scope walk reports
them as violations and AC13 can never pass. Repair owner: `design-feature` —
widening a Product-half declaration is product intent; no plan write may
amend it. Commission (explicit user instruction, verbatim): "amendar el grupo
code carriers de AC13 para incluir scripts/pre-execution-contract.mjs,
scripts/workflow-status.mjs y scripts/workflow-status-pre-execution.test.mjs
(P31-06) — una línea, sin tocar el resto del Product half".

### D-31-9: The code-carrier group enumerates every path the plan edits by design

The `## Scope` **Code carriers** group gains
`scripts/pre-execution-contract.mjs`, `scripts/workflow-status.mjs` and
`scripts/workflow-status-pre-execution.test.mjs` beside the four paths it
already enumerated. The carrier ruling D-31-6 moved the design into code; the
`31-plan-3` re-cut (E-D31-15/E6, E-D31-17/E4, P31-03) then assigned those
edits to `pre-execution-contract.mjs` (the determination parser and the
shared `deriveReviewLoopCycles` helper), `workflow-status.mjs` (the
`detail.review_loop_cycles` projection) and
`workflow-status-pre-execution.test.mjs` (the suite that carries the
emission/cap vectors, already in AC10's gate command) — the group
declaration lagged the plan, and AC13's `read-verified` scope walk failed
closed on the unit's own designed edits. One-line widening; no criterion
text, closure row, sweep row, or non-goal moved. The open P31-06 row is
resolved by the plan's re-derivation on a fresh `SPEC-REVIEW-PASS` receipt,
not by this authoring turn. Roadmap row 31 stays `planned` (this write
changes no scope or status beyond the declaration's enumeration).

### Evidence rows (amendment batch, 2026-09-17)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| The plan edits `scripts/pre-execution-contract.mjs`, `scripts/workflow-status.mjs` and `scripts/workflow-status-pre-execution.test.mjs` by design (helper + parser, projection, suite extension) | repository | `docs/features/31-planning-review-materiality/PLAN.md:82-84,103,109`; `TASKS.md:26,33-35,41` | `7e6c5413` @ 2026-09-17 | current | proven | D-31-9; P31-06 |
| `scripts/workflow-status-pre-execution.test.mjs` is already a machine-validated carrier (AC10's gate command runs it) | repository | `docs/features/31-planning-review-materiality/SPEC.md` AC10 (gate pack command) | `7e6c5413` @ 2026-09-17 | current | proven | D-31-9; P31-06 |
| AC13's scope walk keys on the declared allowed-set groups, so the omission made AC13 unsatisfiable against the plan's own diff | repository | `docs/features/31-planning-review-materiality/planning-findings.md` P31-06 row; `SPEC.md` AC13 | `7e6c5413` @ 2026-09-17 | current | proven | D-31-9; P31-06 |
| Widening a Product-half declaration is a product decision owned by `design-feature` | user | `planning-findings.md` P31-06 route column ("routes to `design-feature`; no plan write may amend it without inventing product intent") + the commission quoted above | `7e6c5413` @ 2026-09-17 | current | decision | D-31-9 |

## 2026-09-17 — User-commissioned Product-half patch (reviewing turn, artifact revision `31-spec-10`)

Owner ruling (explicit user instruction, verbatim): "No voy a rediseñar más
arreglalo tú como un parche, estamos tirando billones de tokens a la basura."
`spec-review-31-10`'s open row N31-015 (`medium`, `class: product`) is closed by
direct owner amendment of the governing SPEC instead of a further `design-feature`
cycle (POLICY §5 sanctions the user amending the governing SPEC).

### D-31-10: The code-carrier group enumerates the two remaining plan-edited suites

`scripts/pre-execution-attribution.test.mjs` and
`scripts/pre-execution-sensor.test.mjs` join the `## Scope` **Code carriers**
group. Every path the plan edits by design is now enumerated across the three
allowed-set groups, so AC4 (which requires `wording-only` vectors in both suites)
and AC13 (which forbids undeclared diff paths) no longer contradict. No criterion
text, closure row, sweep row, or non-goal moved.

### Evidence rows (user-commissioned patch, 2026-09-17)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| AC4 requires `wording-only` in both suites, so both must be edited | repository | `docs/features/31-planning-review-materiality/SPEC.md` AC4; observed `grep -rn "wording-only" scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` → no match | `f0042c62` @ 2026-09-17 | current | proven | D-31-10; N31-015 |
| The plan extends both suites by design | repository | `docs/features/31-planning-review-materiality/PLAN.md:107-108` | `f0042c62` @ 2026-09-17 | current | proven | D-31-10; N31-015 |
| The two paths complete the declared allowed set (no other plan-edited path is undeclared) | repository | `PLAN.md` P1–P5 task set against `SPEC.md` `## Scope` groups 1–3 | `f0042c62` @ 2026-09-17 | current | proven | D-31-10; N31-015 |
| The user owns the SPEC amendment and refused a further `design-feature` cycle | user | the commission quoted above | `f0042c62` @ 2026-09-17 | current | decision | D-31-10 |

## 2026-09-17 — Engineering re-derivation for the reviewed Product patch (plan-feature, artifact revision `31-plan-5`)

Trigger: the plan's parent was `spec-review-31-9` @ `e15374a3…`; the Product
half's bound bytes then moved twice — the owner-commissioned patches `31-spec-9`
(the `## Scope` code-carrier group gains the three paths `plan-review-31-3`'s open
row P31-06 named) and `31-spec-10` (gains the two suites `spec-review-31-10`'s
N31-015 named) — and `spec-review-31-11` (`spec-review-pass`, 14/14 checks, zero
findings) is the current receipt. The plan therefore descended from a stale
parent, the exact lineage class R31-01 named, and still carried one open row
(P31-06). Repair owner: `plan-feature`, on the Product reviewer's own hand-off
("Product half reviewed; the plan binds this receipt"). No phase, task, validator
or acceptance criterion's required outcome changed: both Product patches were
enumeration-only.

### E-D31-20: The plan binds `spec-review-31-11` and closes P31-06

The plan snapshot's `--parent` becomes
`dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e`
(`spec-review-31-11`), verified fresh against the bytes on disk at this
re-derivation's Product-review gate (`node scripts/pre-execution-snapshot.mjs
verify --stage spec --unit 31-planning-review-materiality` → `current: true`,
`structural.fresh: true`). With AC13's code-carrier group now enumerating every
path the plan edits by design, P31-06's defect no longer exists — the frozen scope
walk (O13) is satisfiable — so the row flips to `resolved` with `31-plan-5` as its
resolving artifact revision. The lineage is repaired by re-deriving the plan,
never by editing the reviewed Product half (the Engineering half and `##
Amendments` sit outside the `spec-product-v1` selector, PE-003).

### E-D31-21: P31-04's allocation is the linter-valid one (row in P4), and its prose slips are corrected

The `31-plan-4` batch's `P31-04` resolution (row stays in P4; window declared in
`known-issues.md`; P4's done-when proves the closure) is the authoritative one,
because the canonical phase contract's box 2 refuses a `docs` target in the
`config/infra` P1 (`scripts/phase-lint.mjs` `layerForTarget`). Two prose slips said
otherwise and are corrected here: `E-D31-18`'s body and the `PLAN.md`/`TASKS.md`
P4 task 8 parenthetical now read the allocation that lints PASS; `known-issues.md`
gains the window declaration its own text already claimed existed. A plan set that
contradicts itself on a phase allocation is exactly what a plan review flags, so
the re-derivation repairs it rather than carrying it forward.

### Evidence rows (re-derivation, 2026-09-17)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| The Product half moved after the plan's parent and `spec-review-31-11` is the current PASS receipt; the plan's parent must rebind to `dd09372a…` | repository | `docs/features/31-planning-review-materiality/progress.md` receipt block `spec-review-31-11`; `node scripts/pre-execution-snapshot.mjs verify --stage spec --unit 31-planning-review-materiality` → `current: true`, `fresh: true` | `8eb3b928` @ 2026-09-17 | current | proven | E-D31-20; PE-030 |
| AC13's code-carrier group now enumerates every path the plan edits by design, so P31-06's defect is gone | repository | `docs/features/31-planning-review-materiality/SPEC.md` `## Scope` group 1 (nine paths); the P1–P5 task targets in `PLAN.md`/`TASKS.md` | `8eb3b928` @ 2026-09-17 | current | proven | E-D31-20; PE-031 |
| The phase contract refuses a `docs` target in a `config/infra` phase, so the schema `CHANGELOG.md` row stays in the `docs` P4 | repository | `scripts/phase-lint.mjs` box 2 (`layerForTarget`); `PLAN.md` P1/P4 `Layer:` declarations | `8eb3b928` @ 2026-09-17 | current | proven | E-D31-21; PE-032 |
| The Product reviewer's own hand-off routed to `plan-feature` to bind `spec-review-31-11` | repository | `progress.md` `spec-review-31-11` receipt → `→ Next: /plan-feature 31-planning-review-materiality` | `8eb3b928` @ 2026-09-17 | current | proven | E-D31-20 |

## 2026-09-17 — Plan repair batch for `plan-review-31-4` (plan-feature, artifact revision `31-plan-6`)

Trigger: `plan-review-31-4` returned `PLAN-REVIEW-FAIL` (snapshot `b17009ea…`,
artifact revision `31-plan-5`) with five plan-class rows — P31-07/P31-08 (high),
P31-09 (medium), P31-10 (low), P31-11 (info) — and no product row. Its
`CONVERGENCE-ANOMALY` block named the repair owner: `plan-feature
31-planning-review-materiality` — one batch for the whole set, then `/review-plan`
re-reviews the new artifact revision. The user commissioned the batch with the
same scope. No Product byte moves: the `spec-product-v1` projection digest stays
`e9ce9abfa9f931356adcbcda1e8efe308ffc4809b6b3afcbe2e28ff88ef07e02` (46362
bytes) and the three context digests stay unmoved, so the plan's parent remains
`spec-review-31-11` @ `dd09372a…`.

### E-D31-22: the bump's own reddened gates and its published limit are P1 tasks, in the bump's commit

P1's done-when runs `(cd packages/agentic-workflow-schema && bun run test && bun
run check:pre-execution-schemas)`, and `bun run test` is `tsc && tsc -p
tsconfig.test.json && bun test test/*.test.mjs` — so the phase commits only if
every test in that package passes. Bumping `package.json` to 4.3.0 reddens two
existing pins that assert `4.2.0` verbatim (`test/release-contract.test.mjs`,
`test/verification-gates.test.mjs`), and adding `reproducerChars` to
`PRE_EXECUTION_LIMITS` reddens `test/pre-execution-docs.test.mjs`, whose
published-limit walk requires the README's `### Published limits` block to carry
every key and its value (P31-07/P31-08). All three surfaces are `packages/**`,
which `layerForTarget` maps to `config/infra`, so they belong to P1 and cannot
ride the `docs` P4. The bump task now moves both pins in the same commit — the
precedent feature 59 recorded — and a new P1 task publishes `reproducerChars 1024`
in the README block. The alternative reading (make P1's done-when weaker) would
have manufactured a green phase over a red package suite, which the manifest's
quality floor refuses.

### E-D31-23: `E9` states the P4 CHANGELOG allocation — one reading, not two

`SPEC.md` E9 said the schema package's `CHANGELOG.md` companion row lands "in the
same phase as the bump (P1)" while `PLAN.md`/`TASKS.md` P1/P4, `E-D31-18`,
`known-issues.md` §12 and E9's sibling `### Open questions / risks` bullet all read
P4 (P31-09). An executor following E9 would place a `docs` target in the
`config/infra` P1 and fail phase-lint box 2; one following PLAN/TASKS would leave
E9 false. The P31-04/E-D31-18 resolution already settled the linter-valid
allocation (row in P4, `normative-drift` window P1→P4 declared), so E9 now states
it, names the two version pins and the published-limit block as the bump's own
P1 surfaces, and the SPEC's `### Phases` P1 done-when — which had appended a
`bun test scripts/normative-drift.test.mjs` → exit 0 claim as if the row shared
P1 — stays package-local and restates the window. Same root cause, both
statements repaired.

### E-D31-24: the two P4 task wordings name the frozen gate they must keep

P4's `CHECKS.md` task promised only that "each closed severity vocabulary list"
stays byte-identical, while `scripts/pre-execution-quality.test.mjs` — inside
AC10's pack — matches the review-spec paragraph's sentence `a \`PASS\` may not
carry an open` + line break + `unverified material row` verbatim, so a re-wrap
reddens the gate (P31-11). The task now names that pinned pairing and its break
point. P4's `POLICY.md` §3 task kept the exact literal AC7's removal grep deletes
(P31-10); it now names the removal grep and states the default batch consequence —
one re-review of the freshly rotated snapshot — without reciting the deleted
phrase. Both are wording-only: no phase, task count, validator or acceptance
outcome moves.

### E-D31-25: P1's task budget is at the canonical ceiling

P1 now carries eight tasks, the maximum the phase contract's box 3 allows a
non-close-out phase (`bun scripts/phase-lint.mjs` → `PASS (8/8)` per phase, new
fingerprint `P1:config/infra:8:schema-finding-record-materiality`, new aggregate
`d71938984b6e87a81def926b394ffeed643eb71001df98a846ea7035391bf95c`). The two
additions do not raise the count beyond the ceiling because the two version pins
fold into the bump task they belong to in the same commit (E-D31-22). The boundary
is recorded in `known-issues.md` §13: a further P1 requirement splits the phase,
never grows the list.

### Evidence rows (repair batch, 2026-09-17)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| Two existing package tests hard-pin the version to `4.2.0`, so the bump reddens them; the three-file baseline is green | repository | `packages/agentic-workflow-schema/test/release-contract.test.mjs:23-28`; `packages/agentic-workflow-schema/test/verification-gates.test.mjs:115-118`; `packages/agentic-workflow-schema/package.json:3,62`; observed `bun test test/release-contract.test.mjs test/verification-gates.test.mjs test/pre-execution-docs.test.mjs` → 32 pass / 0 fail | `6e2a804f` @ 2026-09-17 | current | proven | E-D31-22; PE-033 |
| The published-limit walk requires every `PRE_EXECUTION_LIMITS` key and value in the README's feature-28 `### Published limits` block, and `packages/**` maps to `config/infra` | repository | `packages/agentic-workflow-schema/test/pre-execution-docs.test.mjs:26-34,131-137`; `packages/agentic-workflow-schema/README.md:411-424`; `scripts/phase-lint.mjs` box 2 (`layerForTarget`) | `6e2a804f` @ 2026-09-17 | current | proven | E-D31-22; PE-034 |
| `scripts/pre-execution-quality.test.mjs` pins the review-spec `CHECKS.md` sentence with its line break, inside AC10's pack | repository | `scripts/pre-execution-quality.test.mjs:319-327`; `skills/review-spec/references/CHECKS.md:104-105`; `ACCEPTANCE.md` AC10 | `6e2a804f` @ 2026-09-17 | current | proven | E-D31-24; PE-035 |
| The `POLICY.md` sentence AC7's removal grep deletes is live at line 42, so a task that says "keep" it collides with the frozen criterion | repository | `ACCEPTANCE.md` AC7 (the `POLICY.md` re-review removal grep); `skills/pre-execution-review/references/POLICY.md:39-42`; observed `grep -n "re-review of the resulting snapshot" skills/pre-execution-review/references/POLICY.md` → `42:`, exit 0 | `6e2a804f` @ 2026-09-17 | current | proven | E-D31-24; PE-036 |
| Phase-lint box 3 caps a non-close-out phase at 8 tasks, so the two added P1 requirements resolve inside the budget by folding the pins into the bump task | repository | `scripts/phase-lint.mjs` box 3 (`box3`, `limit = 8` for a non-close-out phase); `PLAN.md` P1 (8 tasks); observed `bun scripts/phase-lint.mjs docs/features/31-planning-review-materiality/PLAN.md` → PASS (8/8) per phase, aggregate `d7193898…` | `6e2a804f` @ 2026-09-17 | current | proven | E-D31-25; PE-037 |
| The Product projection and its three context digests recompute byte-identical from the bytes on disk, so the repair batch moves no reviewed Product byte | repository | `node scripts/pre-execution-snapshot.mjs build --stage spec --unit 31-planning-review-materiality` → `spec-product-v1` digest `e9ce9abf…` (46362 bytes); `progress.md` receipt block `spec-review-31-11`; `packages/agentic-workflow-schema/src/pre-execution.ts:482-556` (the selector) | `6e2a804f` @ 2026-09-17 | current | proven | E-D31-20; the plan's `--parent` binding |

## 2026-09-18 — Execution conflict resolution (execute-phase, P1 entry)

The pre-write mapper for P1 (implementation-discovery) confirmed every carried
P1 planning-evidence row (PE-006/PE-007/PE-033/PE-034/PE-037) and found one
Plan/source contradiction the `31-plan-6` cut left standing.

### E-D31-26: The schema bump, its two pins and its `CHANGELOG.md` row land together in P1

P1's own done-when (`cd packages/agentic-workflow-schema && bun run test &&
bun run check:pre-execution-schemas`) is unsatisfiable as the `31-plan-6` cut
wrote it: the package suite carries `test/verification-docs.test.mjs`, whose
"the changelog of record carries a row for the version being shipped" case
reads `package.json` and asserts the schema package's `CHANGELOG.md` table has
a row for that exact version. Bumping to 4.3.0 while the row stays in P4
reddens P1's own gate. The phase contract's box 2 concern P31-04 raised
(`CHANGELOG.md` is a `docs` target, `scripts/phase-lint.mjs` `layerForTarget`)
applies to the *first* declared target of a task, and P1's bump task names
`packages/agentic-workflow-schema/package.json` first; `CHANGELOG.md` is one of
AC13's declared derived surfaces. The repo's *Version every change* rule and
feature 59's P1 (`59-executable-continuations`) both bind the bump, its row and
its release surfaces to the same PR/task. Resolution: the 4.3.0 row moves from
P4 to P1 alongside the bump and the two version pins. No phase, task count,
validator, obligation or acceptance outcome moves (P1 stays eight tasks, P4
stays eight tasks), so every phase fingerprint and the aggregate
`d71938984b6e87a81def926b394ffeed643eb71001df98a846ea7035391bf95c` are
unchanged; `known-issues.md` §12 is rewritten to retire the window.

### Execution-time refinement (E-D31-26 companion): the shared field spec needs an additive `optional` flag

E-D31-9 declares `reproducer` "optional on purpose: a receipt whose findings
carry no `reproducer` stays valid". The shared `VerificationFieldSpec`
(`packages/agentic-workflow-schema/src/verification-contract.ts`) requires
every declared field (`validateStructureFields` pushes `missing-field` for an
absent key), so optionality had no representation. P1 adds `optional?: boolean`
(default `false`) to the field spec, skips an absent optional field in the
structural walk, and filters optional fields out of `required` in both Draft-07
generators. Additive and default-off: no existing field changes behaviour, and
the projected `PreExecutionReviewFindingV1.required` list stays byte-identical,
which is exactly what `test/pre-execution-schema.test.mjs` already pins.

### Evidence rows (execution conflict, 2026-09-18)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| The package suite requires a `CHANGELOG.md` row for the shipped `package.json` version | repository | `packages/agentic-workflow-schema/test/verification-docs.test.mjs:504-522`; observed `bun run test` after the 4.3.0 bump → `2 tests failed`, incl. "the changelog of record carries a row for the version being shipped" | `4d522b6b` @ 2026-09-18 | current | proven | E-D31-26 |
| The published-limits fixture also discloses every key, so `reproducerChars` must join its literal | repository | `packages/agentic-workflow-schema/test/pre-execution-canonical.test.mjs:524-546`; `test/fixtures/pre-execution-vectors.mjs` (`limits: PRE_EXECUTION_LIMITS`) | `4d522b6b` @ 2026-09-18 | current | proven | E-D31-26 |
| The shared field walk has no optional-key representation | repository | `packages/agentic-workflow-schema/src/verification-contract.ts:1160-1164` (`missing-field` for every absent declared key); `src/verification-contract.ts:42-76` (`VerificationFieldSpec`, no `optional`) | `4d522b6b` @ 2026-09-18 | current | proven | E-D31-26 companion |
| Feature 59's P1 put the schema bump and its CHANGELOG row in one `config/infra` task | repository | `docs/features/59-executable-continuations/PLAN.md` P1 task ("Bump the package to 4.2.0 ... record the row in the repo `CHANGELOG.md`") | `4d522b6b` @ 2026-09-18 | current | proven | E-D31-26 |

### E-D31-27: TASKS P5 task 6 stops naming `PLAN.md` so the phase linter passes on TASKS.md too

The canonical phase contract's box 2 refuses a `docs` target in a `hardening`
phase. `PLAN.md` P5 task 6 was already worded "recorded in this plan"; `TASKS.md`
P5 task 6 said "recorded in `PLAN.md`", so `bun scripts/phase-lint.mjs
docs/features/31-planning-review-materiality/TASKS.md` (the form
`turn-contract.mjs` runs for box 2) blocked while the same linter over `PLAN.md`
passed. The `TASKS.md` wording now matches `PLAN.md`; the requirement (confirm the
recorded fingerprints and the read-verified evidence rows) is unchanged. No phase,
task count, validator, obligation or acceptance outcome moves.

## 2026-09-18 — F3 product patch (design-feature, `31-spec-12`)

### E-D31-28: AC4's fall-through code is `stale-source-revision`, not `stale-artifact-content`

Review-change finding F3 (`review-findings.md`, head `ec04261d`, PR #243): the
SPEC's AC4 required `stale-artifact-content` (exit 4) for material byte
movement in the wording-only scenario, but a material movement of a bound
artifact rotates `sourceRevision` by construction, and the verifier returns
`stale-source-revision` before the `stale-artifact-content` slot — so the
criterion's named code was unreachable for the scenario it describes. The
frozen `ACCEPTANCE.md` AC4 and Design E6 already record the correct code.
Owner-commissioned repair routed through the product route
(`design-feature` → `review-spec`); the criterion's required outcome (non-fresh,
exit 4) is unchanged, only the impossible code name is corrected. Domain
grounding (research gate, accessed 2026-09-18): content-addressed freshness
derives the staleness signal from the changed bytes themselves — a changed
artifact necessarily produces a new content key/revision
(https://en.wikipedia.org/wiki/Content-addressable_storage), and
revision/content-movement invalidation precedes content-only comparison in
standard invalidation ladders
(https://getsdeready.com/cache-invalidation-optimizing-application-performance/).

### Evidence rows (F3 product patch, 2026-09-18)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| The verifier answers `stale-source-revision` for moved bound bytes, before the `stale-artifact-content` slot | repository | `scripts/pre-execution-snapshot.mjs:395-400` (`stale-source-revision` return precedes the artifact-content slot) | `9c253473` @ 2026-09-18 | current | proven | E-D31-28 |
| The frozen acceptance manifest records `stale-source-revision` (exit 4) for the no-determination fall-through | repository | `docs/features/31-planning-review-materiality/ACCEPTANCE.md` AC4 row | `849af5ae` blob @ 2026-09-18 | current | proven | E-D31-28 |
| Design E6 declares the fall-through code for moved bound bytes and already corrected the earlier wrong code name | repository | `docs/features/31-planning-review-materiality/SPEC.md` Design E6 ("for moved bound bytes answers `stale-source-revision`") | `9c253473` @ 2026-09-18 | current | proven | E-D31-28 |
| A wording-only movement always rotates the source revision, so the scenario AC4 describes cannot answer `stale-artifact-content` | repository | SPEC Design E6 opening ("a wording-only movement moves a bound artifact and therefore always rotates `sourceRevision`") | `9c253473` @ 2026-09-18 | current | proven | E-D31-28 |
| Content-addressed freshness derives the staleness signal from the changed bytes (new content ⇒ new key) | external | https://en.wikipedia.org/wiki/Content-addressable_storage (accessed 2026-09-18) | fetched 2026-09-18 | current | proven | E-D31-28 |
| Invalidation ladders check revision/content movement before content-only comparison | external | https://getsdeready.com/cache-invalidation-optimizing-application-performance/ (accessed 2026-09-18) | fetched 2026-09-18 | current | proven | E-D31-28 |

### E-D31-29: the surviving freshness-code names follow AC4 — `stale-source-revision` for moved bound bytes; the per-revision readiness block is a record duty

Spec-review finding N31-016 (`spec-review-31-12`, `medium`, `class: product`):
the F3 patch (E-D31-28) corrected AC4 but left the same wrong code name in two
more Product-half locations — In scope item 2 and Capability closure E2's state
transitions still said `stale-artifact-content` for moved bound bytes — and
Expectation sweep row 11 still named `stale-artifact-revision` for an unrecorded
rotation, the naming Design E6 already corrected as wrong once. One event, two
incompatible codes in the same half. Ruling: the comparator's precedence is the
single authority — for committed moved bound bytes `attributeFreshness` answers
`stale-source-revision` before the `stale-artifact-content` slot, and on the
no-determination path the wording-only branch never holds, so the same
fall-through applies; `stale-artifact-revision` keeps only its comparator slot
(a rotation with no bound byte moved). The three names move to
`stale-source-revision`; no criterion outcome, validator or required outcome
moves. Companion record duty (N31-017, `low` report-note): every Product-half
patch that asserts a readiness preflight records its `READINESS — … spec
READY-FOR-REVIEW` block in the unbound `progress.md` in the same authoring act
— the per-revision record convention every earlier reviewed revision follows,
which `31-spec-12` broke. Repair owner `design-feature` (product class),
artifact revision `31-spec-12` → `31-spec-13`; the frozen `ACCEPTANCE.md`
(blob `849af5ae…`) is untouched.

### Evidence rows (N31-016 + N31-017 repair batch, 2026-09-18)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| The verifier answers `stale-source-revision` for committed moved bound bytes, before the `stale-artifact-content` slot | repository | `scripts/pre-execution-snapshot.mjs:395-400` (`stale-source-revision` return precedes the artifact-content slot at `:412`) | `9c253473` @ 2026-09-18 | current | proven | E-D31-29 |
| On the no-determination path the wording-only branch never holds, so an unrecorded rotation falls through to the same `stale-source-revision` precedence | repository | `scripts/pre-execution-snapshot.mjs:377-403` (branch conditions + fall-through comment: "the branch never rewrites a reason code on the no-determination path") | `9c253473` @ 2026-09-18 | current | proven | E-D31-29 |
| `stale-artifact-revision` is reserved for a rotation with no bound byte moved, not for an unrecorded-determination refusal | repository | `scripts/pre-execution-snapshot.mjs:418-421` (the code answers only after `changedArtifacts.length === 0`) | `9c253473` @ 2026-09-18 | current | proven | E-D31-29 |
| In scope item 2, E2 state transitions and sweep row 11 carried the wrong names at the reviewed bytes | review record | `planning-findings.md` N31-016 row (`spec-review-31-12` snapshot `2ca0f9c4…`, evidence `SPEC.md:150,:313,:419` against AC4 `:476-478` and E6 `:919-936`) | `324d9de3` @ 2026-09-18 | current | proven | E-D31-29 |
| Every earlier reviewed spec revision carries a `READINESS — … spec READY-FOR-REVIEW` block in `progress.md`; `31-spec-12` had none | repository | `progress.md` blocks for `31-spec-4`…`31-spec-9` (grep `READINESS — .* spec READY-FOR-REVIEW`) vs `grep -c '31-spec-12' progress.md` → 0 at the reviewed bytes | `324d9de3` @ 2026-09-18 | current | proven | E-D31-29 |

## 2026-09-18 — Review-findings closure batch (design-feature, artifact revision `31-spec-14`)

Trigger: the unit's `review-change` ledger (`review-findings.md`, reviewed
heads after PR #243) carries two open fix-now findings routed to the product
owner — **F8** (`medium`, spec-drift) and **F10** (`medium`, brand) — and the
owner commissioned one batch over exactly that set. **F9** stays open by owner
choice: its route offers "amend AC13's anchor to the merge-base form and/or
main-sync the branch", and the commission scoped this batch to F8 + F10 only.
Repair owner `design-feature` (product class); no receipt text was touched
(`review-findings.md` rows flip at fold time, owned by `fold-findings`).

### D-31-11: The wording-only route never certifies a movement of the unit's own frozen acceptance manifest

- **What**: the exemption is rejected when the moved bound artifacts include
  the unit's `ACCEPTANCE.md`; the recorded acceptance fingerprint stops being
  a sufficient condition on its own — it corroborates the determination only
  when the manifest itself did not move. Declared in In-scope 2, AC4,
  Capability closure E2 (Create + state transitions), role matrix C3 and
  sweep row 10, and made operational in Design E6 (a fifth branch condition:
  the moved bound artifact is not the unit's own acceptance manifest).
- **Why**: F8's reproducer — the wording-only branch self-compares the
  determination's recorded `Acceptance fingerprint` with the current on-disk
  `git hash-object <unit>/ACCEPTANCE.md`, so a repair that rewrites the frozen
  manifest and records the post-edit revision plus the post-edit hash answers
  `fresh: true` over the movement it just made. A fingerprint taken after the
  move is a self-referential attestation: the manifest being measured is the
  artifact whose movement is being certified. Domain grounding (research
  gate, fetched 2026-09-18): RFC 9334 (RATS architecture) — attestation
  requires a root of trust outside the target, "so that the Target Environment
  cannot forge Evidence about itself". The SPEC's own mitigation sentence
  ("requires the acceptance fingerprint and the bound authorities to be
  unmoved") is only deliverable if manifest movement sits outside the
  exemption; otherwise the branch delivers nothing its contract claims.
- **Consequence**: a manifest movement always falls through unchanged
  (`stale-source-revision`, exit 4) — the same non-fresh outcome AC4 already
  requires for material movement, so no criterion outcome, exit code or
  vocabulary value moves. The code half (the branch's manifest-exclusion
  condition in `scripts/pre-execution-snapshot.mjs`) folds at source after
  the Product half re-passes review.
- **Authority**: the owner commission (recorded verbatim in `SPEC.md`
  Amendments `31-spec-14`); `review-findings.md` F8/VF-8.

### D-31-12: The re-review skip is declared by every surface that executes a repair batch

- **What**: AC13's declared set (In-scope group 2), the prose-shrink surface
  enumeration (In-scope 5) and AC7's removal set widen to include
  `skills/plan-feature/SKILL.md`, `skills/plan-fix/SKILL.md`,
  `skills/ship-roadmap/references/ADVANCE.md` and
  `skills/replan-findings/references/PHASE_APPEND.md`, plus
  `design-feature/references/REPAIR.md` §1/§3; those surfaces declare — like
  POLICY §3 and both OUTPUTs already do — that a recorded wording-only batch
  skips the re-review (D-31-3's semantics, unchanged). AC7 gains seven
  removal greps (each fragment observed unique in its file with the mandate
  standing). The touched-skills enumeration (In-scope 7, AC14, Design E9)
  widens four → eight skills with the same consequence: minor bumps,
  CHANGELOG rows and accurate README cells, one bump per skill per PR
  (E-D31-1).
- **Why**: F10 — POLICY §3 and both OUTPUTs declare the skip while the
  surfaces that execute repairs (`plan-feature`'s redirect gate, `plan-fix`'s
  close-out, `ship-roadmap`'s REVIEW-SPEC step, `replan-findings`' append
  contract, `REPAIR.md` §1/§3's hand-offs) still mandate an unconditional
  re-review — a newly introduced internal contradiction (`git show main:`
  proves the pre-change §3 skipped only a full replan). Domain grounding
  (research gate, fetched 2026-09-18): the XACML PEP/PDP separation — an
  enforcement point enforces the decision the decision point makes, so every
  surface that executes a policy must carry that policy; a policy declared
  only at the decision point is a contradiction waiting at the first
  enforcement surface.
- **Consequence**: no vocabulary value, verdict or criterion outcome moves;
  the widening makes the declared allowed-set match what the shrink must
  edit (the exact defect class AC13/P31-06 closed for the code-carrier
  group), and the versioning surface widens with it so the plan stage cannot
  inherit an undeclared release obligation.
- **Authority**: the owner commission; D-31-3 (the skip's semantics are
  maintained, not re-decided); `review-findings.md` F10/VF-10.

### Evidence rows (closure batch, 2026-09-18)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| The wording-only branch self-compares the determination's recorded fingerprint with the on-disk manifest and names no manifest exclusion — F8's defect stands in code at this write | repository | `scripts/pre-execution-snapshot.mjs:377-403` (branch conditions; no path-exclusion test) | `553982d3` @ 2026-09-18 | current | proven | the source fold re-aims the branch after the Product re-review |
| The seven new AC7 removal fragments exist verbatim, each unique in its file, with the unconditional mandates standing: `replans the batch, then re-reviews` (plan-feature SKILL.md:176), `rotate the artifact revision, re-review` (plan-fix SKILL.md:138), `then a fresh review` (ADVANCE.md:28), `Never skip the re-review` (:88) and `a fresh independent review of the re-cut plan` (:72) (PHASE_APPEND.md), `request one re-review of the new snapshot` (:15) and `for a re-review of the new snapshot` (:54) (REPAIR.md) — observed `grep -c` → 1 per fragment | repository | observed greps at this write (2026-09-18); `skills/plan-feature/SKILL.md`, `skills/plan-fix/SKILL.md`, `skills/ship-roadmap/references/ADVANCE.md`, `skills/replan-findings/references/PHASE_APPEND.md`, `skills/design-feature/references/REPAIR.md` | `553982d3` @ 2026-09-18 | current | proven | P4 rewrites the surfaces, P5 re-runs AC7 |
| Attestation requires a root of trust outside the target — the Target Environment cannot forge Evidence about itself | document | https://www.rfc-editor.org/rfc/rfc9334 (RFC 9334, RATS architecture; fetched 2026-09-18) | RFC 9334 @ 2026-09-18 | current | proven | D-31-11 |
| An enforcement point enforces the decision the decision point makes — every surface that executes a policy carries that policy (PEP/PDP separation) | document | https://docs.oracle.com/cd/E24191_01/common/tutorials/authz_xacml_pep.html (fetched 2026-09-18) | page @ 2026-09-18 | current | proven | D-31-12 |
| The eight skills the widened surface set touches: `pre-execution-review`, `review-spec`, `review-plan`, `design-feature`, `plan-feature`, `plan-fix`, `ship-roadmap`, `replan-findings` — their SKILL.md `version:` lines are the bump surface AC14 counts (≥ 16 hunk lines) | repository | `grep -m1 '^version:' skills/<name>/SKILL.md` ×8 (all carry the line); `skills/bump-skill/SKILL.md` guardrail | `553982d3` @ 2026-09-18 | current | proven | P1/P4 bumps, AC14 walk |
| The frozen `ACCEPTANCE.md` requires re-freeze by `plan-feature` on a fresh PASS: AC4's validator text, AC7's removal-grep enumeration (nine → sixteen) and AC14's touched-skill set moved with this batch | repository | `ACCEPTANCE.md` AC4/AC7/AC14 vs the patched `SPEC.md` at `31-spec-14` | `849af5ae` blob @ 2026-09-18 | current | proven | `plan-feature` re-cut (the `31-plan-5` precedent) |
| Receipt state at authoring start: `verify --stage spec` → exit 0, receipt `spec-review-31-13` PASS current, `digestMatches: true` — this batch moves Product bound bytes with no wording-only determination (a Product predicate change is never wording-only, D-31-11's own rule), so the receipt goes stale by design; the next `/review-spec` is cycle 1 of a fresh window (D-31-7) | repository | `node scripts/pre-execution-snapshot.mjs verify --stage spec --unit 31-planning-review-materiality` (run 2026-09-18 at `553982d3`) | `553982d3` @ 2026-09-18 | current | proven | the re-review hand-off |
| Prior materiality-domain research rows (arXiv:2603.00539; Google eng-practices "Nit:"; GitHub required status checks; Tricorder; content-addressable storage; invalidation ladders) remain current — this batch adds the two rows above for its new domain claims | document | `decisions.md` §Evidence rows (2026-09-17 batches; E-D31-28) | — | current | proven | — |

## 2026-09-18 — Review-finding repair batch (design-feature, artifact revision `31-spec-15`)

Trigger: `spec-review-31-14` returned `SPEC-REVIEW-FAIL` (12/14; C9 + C10) with
two `product` rows (F31-14-01 `medium`, F31-14-02 `low`); one batch over the
whole open spec-stage set, repair owner `design-feature`. Commission (explicit
user instruction, verbatim): "add docs/workflow/SKILL_CONTEXT_BUDGETS.json to
AC13's declared derived-surface group (and correct known-issues.md §3), and
drop/correct AC14's 'nothing but the version: change' clause" — quoted in
`SPEC.md` Amendments `31-spec-15` and `progress.md` (REPAIR §4: a repair
responding to a persisted verdict is never a loop defect).

### D-31-13: The declared derived-surface group carries the budget manifest; version-only is `bump-skill`'s own constraint, not the unit's

- **What**: AC13's second declared group (Prose-shrink surfaces + derived
  surfaces) gains `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — the route
  ceilings AC10's `check-skill-context.mjs` gate reads, re-based when the
  shrink moves a route's measured size — and `known-issues.md` §3 names it;
  AC14 drops the false "each SKILL.md carries nothing but the `version:`
  change" clause (the two driver-surface skills carry the declaration prose
  In scope 5 + AC7 require), and the Integration-closure row
  "Versioning/release surfaces" is corrected four → eight skill minor bumps
  (same root cause).
- **Why**: F31-14-01 — the PR diff already carries the budget manifest (F6's
  fold `9f4e05c2` re-based the six feature-31 route ceilings to
  ceil(measured × 1.10) at a declared re-basis), so AC10's budget gate and
  AC13's scope guard asserted incompatible sets; the declared set lagged the
  designed edits, the same defect class AC13/P31-06 closed for the
  code-carrier group and N31-015 for its test-suite members. F31-14-02 — the
  version-only sentence attributed `bump-skill`'s own edit guardrail
  (`skills/bump-skill/SKILL.md:81`) to the unit's SKILL.md diffs, which AC7's
  removal greps require to carry prose changes in exactly those two files.
- **Consequence**: no vocabulary value, verdict, exit code or criterion
  outcome moves. AC13's mechanical anchor lists only in-group paths after the
  widening; AC14's ≥ 16 anchor is unchanged (each touched SKILL.md still
  contributes exactly one `version:` hunk pair); `known-issues.md` §3's
  no-materiality-text rule for `docs/workflow/` is unchanged — only its
  "only the unit's records" claim is corrected.
- **Authority**: the owner commission (quoted in Amendments `31-spec-15`);
  D-31-12 (the eight-skill widening whose Integration row lagged);
  `progress.md` spec-review-31-14 findings F31-14-01 (C9/C10) and F31-14-02
  (C9).

### Evidence rows (F31-14-01 + F31-14-02 repair batch, 2026-09-18)

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| The AC13 mechanical anchor lists `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — one hit, outside all three declared groups — while the PR diff carries the file (13 insertions / 13 deletions) | repository | `git diff main --name-only -- . ':(exclude)docs/features/31-planning-review-materiality' ':(exclude)docs/features/ROADMAP.md' ':(exclude)docs/LOGS.md' \| grep -c SKILL_CONTEXT_BUDGETS` → 1; `git diff main --stat -- docs/workflow/SKILL_CONTEXT_BUDGETS.json` | branch head @ 2026-09-18 | current | proven | the group widening makes AC13's walk satisfiable; P5 re-runs AC13 |
| The budget manifest is the input `check-skill-context.mjs` reads and the shrink re-bases when a route's measured size moves — F6's fold re-based six feature-31 route ceilings to ceil(measured × 1.10) at a declared re-basis naming feature 31 P4 | repository | `scripts/check-skill-context.mjs:9` (`manifestPath`); commit `9f4e05c2` (fold F6, 2026-09-18); AC10's "budgets updated for the shrink if it moves sizes" | `9f4e05c2` @ 2026-09-18 | current | proven | AC10's gate at P5 |
| The two driver-surface skills' SKILL.md files must lose prose today — AC7's removal fragments stand at `plan-feature/SKILL.md:176` and `plan-fix/SKILL.md:138` — so AC14's "nothing but the `version:` change" clause was unsatisfiable as written | repository | observed greps (2026-09-18, both fragments present); SPEC In scope 5 + AC7 | branch head @ 2026-09-18 | current | proven | P4 rewrites the surfaces, P5 re-runs AC7 |
| The version-only rule is `bump-skill`'s own guardrail — it constrains what `bump-skill` edits, not the unit's direct SKILL.md edits | repository | `skills/bump-skill/SKILL.md:81` ("Never change anything in a SKILL.md except the `version:` line") | branch head @ 2026-09-18 | current | proven | AC14's corrected walk |
| Same-root-cause staleness: the Integration-closure row "Versioning/release surfaces" said "four skill minor bumps" against AC14's "eight touched skills" (D-31-12's four→eight widening lagged the row) | repository | SPEC Integration-closure row, pre-patch bytes of this write | branch head @ 2026-09-18 | current | proven | corrected in this batch; verified by the row's own Test cell pointing at AC14 |
| Receipt state at authoring start: `verify --stage spec` → exit 0, `structural.fresh: true`, `digestMatches: true`, receipt `spec-review-31-14` FAIL current (`verdictIsPass: false`) — this batch moves Product bound bytes with no wording-only determination, so the receipt stays superseded; the next `/review-spec` is cycle 2 of the window `spec-review-31-13`'s PASS opened (second cycle allowed when correctness needs it — POLICY §4) | repository | `node scripts/pre-execution-snapshot.mjs verify --stage spec --unit 31-planning-review-materiality` (run 2026-09-18) | branch head @ 2026-09-18 | current | proven | the re-review hand-off |
