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

## Opportunistic findings (execute-phase)

| Date | Finding | Evidence | Estimate | Risk | Local files | Decision | Why | Trigger | Record |
|---|---|---|---|---|---|---|---|---|---|
| 2026-09-10 | EN `CHANGELOG.md` lost the `@gtrabanco/pi-agentic-workflow` `0.8.0` row (present in `CHANGELOG.es.md` and at `7fd87ea5`), so `node --test scripts/normative-drift.test.mjs` fails the bilingual version-set symmetry check at HEAD (`15 pass / 1 fail`, reproduced in a clean worktree at `f46cf450`) — P5's own gate | `/tmp/aw-base` at `f46cf450`: `node --test scripts/normative-drift.test.mjs` → `ℹ fail 1`; `CHANGELOG.md:96` jumps `0.9.0` → `0.7.2`; `git show 7fd87ea5:CHANGELOG.md:95` carries the row | 1 line / 1 file | low | yes — `CHANGELOG.md` (already touched by P1) | Autofix | all boxes: ≤15 lines, ≤2 files, file already touched, low risk, no API/schema/dependency/acceptance change, objective unchanged | drop the fix if the drift is resolved upstream first | this commit (P1) |

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
