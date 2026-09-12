# Decisions — 37-phase-lint-script

## Product decisions (design-feature, artifact revision 37-spec-1)

- **PD1 (2026-09-09, user-approved "yes")** — Fail-closed edge handling: every
  unresolvable input (missing plan file, plan with no phases, unparsable
  grammar) resolves to `BLOCKED` with a distinct reason code (`missing-plan`,
  `no-phases`, `unparseable`) and a non-zero exit; `PASS` only on a fully
  parsed clean plan. Never guess, never partially judge.
- **PD2 (2026-09-09, user-approved "yes")** — Output contract: stdout is one
  fixed human-pasteable text block (one line per failing rule, final
  `PASS` / `BLOCKED: <reason-code>` verdict, `fingerprint: <sha256>` line);
  exit `0` (PASS) / `1` (BLOCKED); no `--json` mode in v1.
- **PD3 (2026-09-09, user-approved "yes with amendment")** — Input: exactly one
  explicit file path argument, no auto-discovery of an "active" plan, v1
  English-only. Amendment (user-approved): drop the 1 MB cap — the file is read
  whole and any read/parse failure is `BLOCKED: unparseable`; every behavior
  must be exercisable by the golden-fixture corpus.
- **PD4 (2026-09-09, user-approved "sí")** — Success criterion: one command
  (`bun scripts/phase-lint.mjs <plan.md>`, fallback `node`) produces an
  unambiguous PASS/BLOCKED over a corpus of test plans (valid, invalid,
  ambiguous), no network calls, no manual steps.
- **PD5** — Out of scope confirmed: no plan correction, no rule changes
  (`phase-contract` sole owner), no replacement of the full pre-execution gate,
  no AI/network dependencies.

## Engineering decisions (plan-feature, artifact revision 37-plan-1)

- **ED1 (2026-09-09, scaffold-time resolution of SPEC Deferred decisions row 1)** —
  `scripts/phase-lint.mjs` stays at `scripts/` and is not re-homed into the
  crate. AC1–AC7 pin the exact `scripts/phase-lint.mjs` path as the frozen
  contract; re-homing would need a user-approved SPEC amendment. The vehicle
  rule is still satisfied: this feature creates the `packages/agentic-workflow`
  crate skeleton + `.agentic-workflow/tmp/` (AC10); producers 38/42 land as
  subcommands.
- **ED2 (2026-09-09)** — `.agentic-workflow/tmp/` is committed with a
  `.gitkeep` so the convention exists on fresh clones and AC10's `test -d`
  passes off-clone.
- **ED3 (2026-09-09)** — No `--json` mode in v1 (PD2); no dependency on
  `packages/agentic-workflow-schema` (AC9); machine consumption is feature
  38/42 work.
- **ED4 (risk note)** — Fix #191 (in-progress · PR #193) edits
  `skills/execute-phase/` terminal hand-off text; P4 touches the same file's
  preflight section (disjoint area). P4 re-bases on current `main` at execution
  time.

## Open questions

- None blocking closure. Vehicle-rule mechanics (crate layout, script placement)
  are Engineering-half work — see SPEC Deferred decisions.

## Engineering decisions (plan-feature replan, artifact revision 37-plan-2)

- **ED5 (2026-09-10, user-directed replan, folds plan review findings F2 + F3 + F4)** —
  P4 re-cut: (1) task count corrected from 7 to 8 — PLAN.md P4 now includes the
  dev-scenario edge-corpus task that TASKS.md already listed, so the recorded
  fingerprint's task count matches the actual phase shape; (2) box-1 heuristic
  amended so it never BLOCKs the templates' conventional final-phase title
  `Hardening & PR` — that title is kept literally by template mandate and its
  title-deliverable normalizes to `hardening-pr` (`&` treated as a
  normalization separator, not a deliverable joiner); any other `&`-joined
  title still FAILs. Box-1 also gains `/` in the joiner list to match
  phase-contract rule 1's stated joiners. PE-007 corrected: roadmap row 37
  status wording `defined` → `planned` to reflect the working tree.
  **Proposal for separate user triage (not bundled here):** the templates'
  fixed wording `Hardening & PR` conflicts with phase-contract rule 1's
  inclusion of `&` as a fail joiner; a future fix could align phase-contract
  or the templates repo-wide.

## Engineering decisions (plan-feature replan, artifact revision 37-plan-3)

- **ED6 (2026-09-10, owner decision approved in session — resolves F5)** —
  Option 1: the `Hardening & PR` box-1 exception is **sanctioned in the rule
  owner, and the amendment lands inside this PR**. P1 amends
  `skills/phase-contract/SKILL.md` rule 1 (v1.0.1 → 1.0.2) so that only the
  templates' literal closing title `Hardening & PR` is exempt — its
  title-deliverable normalizes to `hardening-pr` (`&` is a normalization
  separator, not a connector of deliverables) — while any other `&`-joined
  title still FAILs. The mirror is re-bundled via `npm run bundle:skills`.
  SPEC §Design box-1 stays verbatim with respect to the amended owner, with no
  local rule semantics. This supersedes ED5's separate-triage proposal, which
  is no longer needed.

## Engineering decisions (plan-feature repair batch, artifact revision 37-plan-4)

- **ED7 (2026-09-10, repair batch for review receipt PLAN-REVIEW-37-3 — folds
  F8 + F9 + F10 + F11; convergence argument stated per the CONVERGENCE-ANOMALY
  notice)** — One batch, four folds:
  1. **F8** — PE-008's claim cited the wrong SPEC location: the correction F1
     describes lives in `SPEC §Acceptance criteria` (AC10 covers the vehicle
     rule), not in the in-scope bullet. The SPEC in-scope bullet 7 was amended
     to read `→ AC10 (crate + tmp convention); AC9 is n/a for this bullet`,
     and PE-008's source-and-location cell now cites both surfaces, so the
     `proven` claim is backed by the bound artifact bytes. The Product-half
     correction itself was user-approved in the design interview (F1,
     verified); no product semantics changed.
  2. **F9** — The plan's version surface is now explicit and mechanical: P1
     runs `bump-skill` for `phase-contract` (1.0.1 → 1.0.2 + CHANGELOG.md +
     CHANGELOG.es.md rows + README/SKILLS table sync) and P4 runs `bump-skill`
     for the three slimmed skills (minor bumps + same surface), replacing the
     bare "minor version bumps" wording that no step could satisfy. This keeps
     `scripts/normative-drift.test.mjs` (P5's own gate) green by construction.
  3. **F10** — P1 and P4 re-cut so the recorded fingerprints match the actual
     checkbox counts: P1 = 3 tasks (`P1:docs:3:amend-phase-contract-rule-1`,
     bump-skill replaces the bare version-bump task), P4 = 7 tasks
     (`P4:docs:7:slim-three-consumer-routes-to-run-and-paste`, bump-skill
     replaces the prose "minor bumps" mention).
  4. **F11** — SPEC §Design box-2's check object aligned to the rule owner's
     rule 2 ("each task's **target file**"): the frozen prefix table now maps
     the target file — defined mechanically as the task's first path-like
     token outside a quoted command span; a task with no target file (a
     command, assertion, or process step) is exempt — and `packages/<pkg>/README.md`
     follows its package into `config/infra`, not the generic `.md` rule.
     Checking-surface determinism sentences were also added to box-1 (joiners
     are word separators; hyphen-joined compounds are one token) and to the
     grammar (title-deliverable normalization: lowercase, kebab, `&` as
     separator, leading articles dropped). No new grammar concept and no
     semantics beyond the owner's rules are introduced; every check stays
     deterministic and fail-closed as before, and the full mechanical walk
     over the re-cut plan (all 27 tasks, 10 targets, 5 fingerprints) is clean
     — recorded in the fold notes below.
  **Convergence argument (required by the cycle-3 CONVERGENCE-ANOMALY):** the
  recurring family across cycles 1–3 was plan-self-conformance (F2 → F10/F11):
  each replan hand-patched the reported row instead of re-deriving the plan's
  self-conformance claims. This batch re-derives every fingerprint mechanically
  from the re-cut phase tasks (checkbox counts in TASKS.md, `Layer:`
  declarations, kebab-cased title-deliverables, P5's `Hardening & PR` →
  `hardening-pr` per the amended rule 1), re-walks the frozen box-2 grammar
  against every phase body including P4's own task text, and states the
  convergence argument here before hand-off — no fingerprint or grammar claim
  in this plan is hand-patched; each is re-derived from the cut tasks.

## Engineering decisions (repair batch, artifact revision 37-plan-6)

- **ED8 (2026-09-12, repair batch for review receipt PLAN-REVIEW-37-6 — folds
  F14 + F15 + F16 — plus the feature-38 merge readiness; convergence argument
  stated per the cycle-6 CONVERGENCE-ANOMALY notice)** — One batch, one root
  cause: replan 5 (`37-plan-5`) edited artifact content without syncing the
  three revision headers, one invariant-wording cell, and one evidence status
  clause. The same batch records the two facts that landed on `main` while this
  plan was in flight, because the next review reads the merged tree.
  1. **F14** — every bound planning artifact's header now names the current
     revision `37-plan-6` (`SPEC.md` §Engineering half, `PLAN.md`,
     `planning-evidence.md`, `architecture-notes.md`, `TASKS.md`, `testing.md`,
     `planning-obligations.md`), and the SPEC's Engineering-half replan-note
     chain no longer stops at Replan 4: the missing Replan 5 (the `37-plan-5`
     F7 re-cut) and Replan 6 (this batch) are recorded. `ACCEPTANCE.md` is
     **not** touched — it is frozen and its `37-plan-3` reference is the
     freeze's own revision, not a live header.
  2. **F15** — `architecture-notes.md` §Layer placement states the rule owner
     was amended **twice**, with both revisions and commits (P1: rule 1,
     v1.0.1 → 1.0.2; cycle-1 review fold F5: rule 3 ≥ 1-task minimum,
     v1.0.2 → 1.0.3, `8a35face`), matching O12 and the tree. No decision.md
     lookup is required to read a bound artifact any more.
  3. **F16** — the roadmap-status claim matches the row: `planning-evidence.md`
     PE-007 and `planning-obligations.md` O11 now state the row's real value
     (`in-progress · [#212]` while P5+P6 execute; `done` again at the PR-open
     step), not the scaffold-time `planned`. The row was flipped by
     user-approved merge-readiness decision (see 4d) — the same value
     `execute-phase` P1 writes, so the flip is idempotent when P5 runs.
  4. **Feature-38 merge readiness** (recorded here, not as review findings —
     no review ran between the merge and this batch):
     a. **`--json` deferred decision closed plan-side.** SPEC `### Deferred
        decisions` row 2's decide-by trigger — "Feature 38 scaffold time" —
        fired: feature 38 is merged (PR #213). The v1 decision stands, because
        the merged sensor reads `progress.md` receipts, git and the forge —
        never the linter's stdout (PE-011) — so no machine-readable mode is
        added. The row lives in the frozen Product half, so the closure is
        recorded here and in the SPEC §Open questions (plan-side) rather than
        by editing the bound Product bytes, which would break the
        SPEC-REVIEW-37-1 parent binding (F12/F13's class).
     b. **E10's ordering clause superseded, product half untouched.** Product
        evidence row E10 says feature 37 "precedes 38"; the merge order is the
        reverse (38 merged first). Recorded as `planning-evidence.md` PE-011
        for the same freeze reason as (a); if a later reviewer requires the
        Product half itself to change, that is a Product-half amendment plus a
        delta `/review-spec` — an owner call, not this batch's.
     c. **Producer family paragraph rewritten.** The SPEC's "Post-merge next
        feature" section claimed 38 lands as a subcommand of the crate this
        feature creates; it now records the fact (38 merged first at
        `scripts/workflow-status.mjs`, outside the crate) while the crate
        obligation (P3/AC10) and the vehicle-rule redistribution stay
        unchanged. Re-homing 38's producer is recorded in `known-issues.md`
        §Deferred items as a follow-up unit — explicitly **not** this
        feature's scope.
     d. **Roadmap row 37 flipped `done` → `in-progress · [#212]`** (user
        instruction, merge-readiness): the unit still owes P5 and the P6
        close-out re-run, and the own-status gate must read an executable
        state. The PR-open step restores `done`.
  **Convergence argument (required by the cycle-6 CONVERGENCE-ANOMALY):** the
  cycle-6 family was planning-set sync drift (F14 → F15/F16): replan 5 changed
  artifact content and left the surrounding self-description behind. This batch
  is one root cause in one pass — every live revision header, the rule-owner
  history cell, the roadmap-status clause in both places that assert it (PE-007
  and O11), and the feature-38 facts — all re-derived from the tree as it now
  stands, none hand-patched row by row, with the frozen `ACCEPTANCE.md` blob
  (`21adb084…`) and the Product half both verified untouched. Phase shape and
  all six fingerprints are unchanged from `37-plan-5`, so the linter's output
  is reproduced verbatim by the reviewer's own run.

## Opportunistic findings (execute-phase)

| Date | Finding | Evidence | Estimate | Risk | Local files | Decision | Why | Trigger | Record |
|---|---|---|---|---|---|---|---|---|---|
| 2026-09-10 | EN `CHANGELOG.md` lost the `@gtrabanco/pi-agentic-workflow` `0.8.0` row (present in `CHANGELOG.es.md` and at `7fd87ea5`), so `node --test scripts/normative-drift.test.mjs` fails the bilingual version-set symmetry check at HEAD (`15 pass / 1 fail`, reproduced in a clean worktree at `f46cf450`) — P5's own gate | `/tmp/aw-base` at `f46cf450`: `node --test scripts/normative-drift.test.mjs` → `ℹ fail 1`; `CHANGELOG.md:96` jumps `0.9.0` → `0.7.2`; `git show 7fd87ea5:CHANGELOG.md:95` carries the row | 1 line / 1 file | low | yes — `CHANGELOG.md` (already touched by P1) | Autofix | all boxes: ≤15 lines, ≤2 files, file already touched, low risk, no API/schema/dependency/acceptance change, objective unchanged | drop the fix if the drift is resolved upstream first | this commit (P1) |

## Plan conflicts (execute-phase)

- **P2 (2026-09-10) — `TASKS.md` lacked the phase grammar its own linter consumes.**
  The frozen input grammar (`SPEC §Design`) requires every `P<n>` phase body to
  carry a `Layer:` line and a `Done-when:` line, and the canonical M/L plans do
  (e.g. `docs/features/29-bounded-implementation-discovery/TASKS.md:10`,
  `docs/features/30-repair-receipt-delta-review/TASKS.md:10`). Feature 37's
  `TASKS.md` carried neither, so the reviewed plan's own recorded fingerprints
  (`P1:docs:3…` … `P5:hardening:8…`, SPEC §Phase-lint) could not be reproduced
  by the linter the plan commissions — the recurring plan-self-conformance
  family (F2/F10/F11) one more time. Repair applied under the execute-phase
  plan-conflict rule: the five `Layer: <layer> · Done-when: <command>` lines
  were added to `TASKS.md` **verbatim from `SPEC.md` §Phases** (the frozen
  values — no semantics, scope, or acceptance change), and the linter now
  reproduces all five recorded fingerprints exactly
  (`bun scripts/phase-lint.mjs docs/features/37-phase-lint-script/TASKS.md` →
  `verdict PASS`, sha256 `b012730370…`).
  Consequence recorded, not hidden: `TASKS.md` is a bound `stage: plan` artifact,
  so `PLAN-REVIEW-37-5`'s snapshot no longer matches the working tree. The
  whole-unit loop re-checks the acceptance blob (unchanged) and the phase gates,
  not the plan receipt, so execution continues; the Product half and
  `ACCEPTANCE.md` are untouched. If the project wants the plan receipt current
  again, that is a fresh `/review-plan` on the amended plan — never a receipt
  refresh.

## Implementation definitions (execute-phase, P2)

Deterministic definitions of the frozen approximations, pinned by
`scripts/phase-lint.test.mjs` (the SPEC authorizes approximation, the corpus owns
its exact behaviour):

- **box-4 `→` chain** — two or more arrows in one task are a chain; a single
  arrow is an outcome annotation. Real plans use a single arrow inside tasks and
  `Done-when:` lines (e.g. `docs/features/24-workflow-transition-decider/TASKS.md:87`,
  `docs/features/30-repair-receipt-delta-review/TASKS.md:19-21`), so counting any
  arrow would block them.
- **box-4 enumerated cases** — numbered/lettered markers (`(1)`, (a)) or ordinal
  words, not a bare comma list; a corpus case with four markers pins the branch.
- **box-8 done-when block** — the remainder runs from `Done-when:` to the end of
  its paragraph (blank line or first task), matching the SPEC's “in the same
  block”; real plans wrap long commands across lines
  (`docs/features/29-bounded-implementation-discovery/TASKS.md:11-13`).
- **title-deliverable** — articles (`the`, `a`, `an`) are dropped as standalone
  words wherever they appear, not only when leading: the recorded fingerprints
  `P2:…:implement-deterministic-phase-linter`,
  `P3:…:create-producer-crate-vehicle` and
  `P4:…:slim-three-consumer-routes-to-run-and-paste` (SPEC §Phase-lint) are only
  reproducible under that reading.

## Fold notes (37-plan-4 mechanical re-derivation, 2026-09-10)

Mechanical walk over the re-cut plan (the same derivation the linter will
perform), run before hand-off:

- Fingerprints: all 5 phases re-derived from TASKS.md checkbox counts +
  `Layer:` lines + kebab-cased title-deliverables — all match the recorded
  lines in SPEC §Phase-lint (P1 `P1:docs:3:…`, P2 `:6:`, P3 `:3:`,
  P4 `P4:docs:7:slim-three-consumer-routes-to-run-and-paste`, P5
  `P5:hardening:8:hardening-pr`).
- box-1: all 5 title-deliverables clean under the frozen joiner detection
  (word-separator `and`/`y`, `+`/`,`/`/` between word chars, hyphenated
  compounds are one token; P5 exempt via the amended rule 1).
- box-2: 27 tasks walked; 10 target files checked against the frozen prefix
  table (incl. the `packages/<pkg>/README.md` package rule); 17 tasks exempt
  (no target file — command/assertion/process steps); zero ambiguous, zero
  cross-layer targets.
- box-3: task counts 3/6/3/7/8, all within the ≤ 8 (≤ 10 hardening) limits.

## F7 fold — box-2 test-file mapping (`37-plan-5`, 2026-09-11)

User-directed replan-in-unit (review-findings.md F7, cycle-1 code review, class
`replan-in-unit`, user-confirmed): the frozen box-2 prefix table could not
express the owner-sanctioned test-only shape, so a plan correctly following
`phase-contract` rule 2 ("a test-only phase declares `hardening`") was BLOCKED
on its own test files (VF-7: test-only `Layer: hardening` phase creating
`scripts/tokenizer.test.mjs` → `BLOCKED — box 2`).

Decision (plan owner):

- SPEC §Design box-2 gains the frozen test-file mapping: a **test file** is a
  target whose basename contains `.test.` (mechanical, the repository's
  colocated-test convention — PE-006; the surrounding dots keep
  `latest.config` / `unit.testing.mjs` out); in a phase declared `hardening`
  a test-file target maps to `hardening`; a non-test target in `hardening`
  still maps via the prefix table (so `hardening` stays test-only); a test
  file everywhere else maps via the prefix table like any file (owner rule 2
  clause 1 — tests for the phase's own layer belong to the phase).
  `close-out` is deliberately NOT given the mapping: the owner rule names
  `hardening` only, and the literal close-out chain carries no test-file
  targets — fail-closed over a guess.
- Plan re-cut to six phases: new P5 "Implement the box-2 test-file mapping"
  (config/infra: red-first corpus fixtures + mapping implementation; O13,
  PE-010), and the former close-out P5 renumbered P6 — tasks, ticks and
  fingerprint unchanged except the phase number. `phase-contract` is NOT
  touched (amended once in P1, sole rule owner — O12). ACCEPTANCE.md is NOT
  modified: AC1–AC10 are unchanged and the new fixtures fall under AC5's
  corpus validator, so the frozen acceptance blob stays `21adb084…`.
- Convergence argument (cycle-3 anomaly requirement): fingerprints and
  grammar are re-derived by the linter itself over the re-cut plan — not by a
  hand walk. Output:

```
$ node scripts/phase-lint.mjs docs/features/37-phase-lint-script/TASKS.md
P1 Phase-lint: PASS (8/8) · fingerprint P1:docs:3:amend-phase-contract-rule-1
P2 Phase-lint: PASS (8/8) · fingerprint P2:config/infra:6:implement-deterministic-phase-linter
P3 Phase-lint: PASS (8/8) · fingerprint P3:config/infra:3:create-producer-crate-vehicle
P4 Phase-lint: PASS (8/8) · fingerprint P4:docs:7:slim-three-consumer-routes-to-run-and-paste
P5 Phase-lint: PASS (8/8) · fingerprint P5:config/infra:2:implement-box-2-test-file-mapping
P6 Phase-lint: PASS (8/8) · fingerprint P6:hardening:8:hardening-pr
verdict PASS
fingerprint: 3ea28e5b965e08cfc59d5410f80fed542e5fb8e5398268130a82f98bc4794940
```

  (whole-plan sha256 after the re-cut: `3ea28e5b…`; was `b0127303…` at P2.)
- Parent Product lineage re-proven, not assumed: `bun scripts/pre-execution-snapshot.mjs
  build --stage spec --unit 37-phase-lint-script --source-revision 05480514…
  --artifact-revision 05480514…` over the re-cut tree →
  `8f736cc97ff87fa83e7581e1faeabbdb52fdc6ab3e9f73bc6e1cefcb3be9c0a0` — exact
  match with SPEC-REVIEW-37-1's bound snapshot (the re-cut's SPEC edits are
  confined to the Engineering half). `node --test scripts/phase-lint.test.mjs`
  → 26/26 (no code changed in this cycle).
