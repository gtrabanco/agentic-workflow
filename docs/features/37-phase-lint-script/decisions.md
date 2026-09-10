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
  `skills/execute-phase/` terminal hand-off text; P3 touches the same file's
  preflight section (disjoint area). P3 re-bases on current `main` at execution
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
