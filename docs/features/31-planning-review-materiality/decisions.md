# Decisions — 31-planning-review-materiality

Product-half decisions recorded by `design-feature` (append-only; newest last).

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
| Code-side loop cap, test-pinned: at most two review→fold cycles; `LOOP CAP REACHED`; third cycle never starts without explicit user instruction | repository | `skills/review-change/SKILL.md:159-163`; `scripts/review-loop-discipline.test.mjs` §4 (asserts) | branch head d63e9b12 @ 2026-09-17 | current | proven | — |
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

## Open questions

None at product stage. The engineering half enumerates the exact pin diff in
`scripts/review-loop-discipline.test.mjs` and confirms no new fenced grammar
block is introduced (Integration closure row 5).

## 2026-09-17 — Engineering decisions (plan-feature, artifact revision `31-plan-1`)

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
