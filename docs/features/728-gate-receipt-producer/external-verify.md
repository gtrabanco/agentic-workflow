# External verify — feature/728-gate-receipt-producer

Full verdict, once (2026-11-26): no prior `EXTERNAL VERIFY` block existed in
this unit dir (no `external-verify.md`, no block in `SPEC.md`, no recorded
review verdict), so this receipt is the first and is the full verdict, not a
delta.

Method: every command in `SPEC.md` §Applicable tests, every `### Obligations`
validator, and every acceptance-criterion check was re-run at `41d7322e1`
against base `022769f8b` (merge-base `022769f8b`, identical to `origin/main`).
Base-side proofs ran in `mktemp -d` copies of `git archive origin/main`
(removed afterwards); the producer's behaviour probes ran against toy gate
roots under `mktemp -d` — nothing in this receipt wrote to the live tree, and
the worktree is clean. Re-run ledger:

- §Applicable tests — all green: `gate-producer-drift.test.mjs` 9/0,
  `gate-receipt.test.mjs` 10/0, `audit-pr-receipt.test.mjs` 32/0,
  `normative-drift.test.mjs` 24/0, `skill-lint.test.mjs` 20/0,
  `test-obligation-tags.test.mjs` 22/0, `structural-sibling-pins.test.mjs` 8/0,
  `prose-gate-inventory.test.mjs` 22/0, `check-skill-context.mjs` PASS
  (33 skills / 14 routes / 7 documents — the three lines come from the default,
  `--routes` and `--documents` invocations), `lint-changeset` ok,
  `red-first.test.mjs` 9/0 with `--timeout 60000` (bare invocation red —
  advisory 7).
- Obligations O1–O9 and O11–O16 re-run green here; **O10 does not reproduce**
  (blocker 1). `ac-hash` re-derives (`acceptanceState` → `match`,
  `c06777de…`).
- `bun scripts/local-gate.mjs --jobs 4 --no-bail` → exit 1, **14 passed /
  1 failed / 5 skipped** — the one failed step is `root-suite` whose first red
  is the base-present `findings-corpus` count, the same shape G2 records;
  `docs-generate --check` exit 0; `roadmap-settle` PASS (0 violations);
  `version-parity-gate --content` PASS.
- Producer probes (toy roots, `mktemp -d`): handshake gate → `run` exit 0
  `verdict: pass`, `verify` exit 0 `current`+`pass`; a signed write after the
  run → `verify` exit 4 naming the path; a write under `.agentic-workflow/` →
  still `current`; a gate ignoring `--json` → `run` exit 1 `degraded`; a gate
  rejecting `--json` → `run` exit 2 `degraded` (PE-005–PE-008 all reproduced).
- Base proofs: `findings-corpus --repo <scratch of origin/main>` → **1178**
  against the frozen **1173** (same fail at base); `workflow-doctor` at base in
  scratch → 20 pass / 3 fail, the same three cases as at head.
- Sibling sweep greps: no surviving "reserved, not yet consumed", no surviving
  "no producer"/"reactively only" claim in a live surface; the stale mentions
  that do survive are blockers 2–3 and advisory 5 below.

```text
EXTERNAL VERIFY — base: 022769f8be96b441ec11ffede7ed85e2490e3997 · head: 41d7322e1642454ba390c3cba28e409876d83e3e · 2026-11-26
Blockers: 3 — each: file:line, reproducer, base-vs-head evidence
1) SPEC.md:91 (AC7 for S7) with SPEC.md:464 (E15) and planning-obligations.md:24 (O10) — the frozen S7 check and the O10 validator both claim `git diff --name-only $(git merge-base origin/main HEAD)..HEAD -- skills/review-verify skills/audit-pr skills/review-*` lists **0** paths; reproducer: that exact command (glob shell-expanded or quoted, identical) → 1 path, `skills/review-change/references/PERSIST_AND_DECIDE.md`; base-vs-head: the path is modified on this branch only by `ed1ffdab4` (`git log --oneline origin/main..HEAD -- skills/review-change/references/PERSIST_AND_DECIDE.md` → `ed1ffdab4`), and the AC7/O10 wording itself landed later in `1c971f1be` after that edit, so neither the claim nor its failure exists at base. The substance holds — `-- skills/review-verify skills/audit-pr` → 0 paths and the nine review passes → 0 paths — but the written glob also names `review-change`, which this unit deliberately edits as the fourth caller (D5, Impact). Smallest action: re-scope AC7's and O10's path list (drop `skills/review-*` or exclude `skills/review-change`), correct E15's recorded `0 paths`, re-freeze `ac-hash`; O10 stays `verified` only once that cell re-runs green → /aw-local-apply.
2) decisions.md:68 (D6) — "`review-verify` gains one clause naming the owner a re-route goes to"; reproducer: `git diff --name-only $(git merge-base origin/main HEAD)..HEAD -- skills/review-verify` → 0 paths (byte-identical to base) while decisions.md:102 (D9) records that clause as withdrawn; base-vs-head: D6 was written at the freeze `5187297de` and never amended when D9 landed in `1c971f1be`; this unit's `decisions.md` does not exist at base, so the false claim is change-caused. Smallest action: amend D6's last sentence to mark the clause planned-then-withdrawn (cite D9) or delete it → /aw-local-apply.
3) SPEC.md:324 (P6) — P6's `Relevant files` names `skills/review-verify/SKILL.md`, a file this change does not touch; reproducer: the same 0-path diff as blocker 2; base-vs-head: the freeze `5187297de` wrote P6 while the clause was still planned, the withdrawal (SPEC.md:133-140, D9) removed it, and P6 was never rewritten — no `review-verify` byte changes anywhere in this branch's range. Smallest action: drop `skills/review-verify/SKILL.md` from P6's relevant files (the precondition landed in `template/AGENTS.md` and `packages/agentic-workflow/README.md`) → /aw-local-apply.
Advisories: 7 — each: file:line, why advisory
1) SPEC.md:85 (AC1) — the literal check "lists only paths `## Impact` names" is not what the command answers: the diff carries 25 paths, of which the state carriers (`.changeset/728-gate-receipt-producer.md`, `.agentic-workflow/journal/…`, `docs/ROADMAP.md`, `docs/generated/*`, `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, root `AGENTS.md`, the unit dir, `packages/agentic-workflow/{README.md,src/…}`, `scripts/gate-producer-drift.*`) are declared by P2/P7/D10 and the `## Surfaces` list instead of by `## Impact`'s bullets. No out-of-scope path exists, so the need AC1 names is met; only its naming is loose.
2) SPEC.md:469 (E16) — "two reds only" does not reproduce: `bun scripts/run-root-suite.mjs --jobs 4 --test-timeout 60` (E16's exact command) → exit 1 with 5 FAILs — `findings-corpus` and `workflow-doctor` (both proven base-present in scratch: base corpus 1178 vs frozen 1173; base workflow-doctor 20/3, identical cases) plus `phase-lint` (SUITE TIMEOUT 120.3s), `workflow-status-sensor` (SUITE TIMEOUT 120.0s) and `red-first` (64.2s vs its 60s allowlist). The three extra are load-shaped (box load average 10.7–12.8 on 6 CPUs) and green standalone at head — phase-lint 162/0, workflow-status-sensor 81/0 with `--timeout 60000`, red-first 9/0 with `--timeout 60000` — and all three suites are untouched by this diff, so the reproducer also fires without the change. Advisory: E16's line should record the load or be re-measured; no change-caused red was found.
3) skills/fold-findings/SKILL.md:34, skills/fold-findings/references/FOLD_PROCESS.md:24, skills/review-change/references/PERSIST_AND_DECIDE.md:69 — the rewrites state the producer unconditionally ("the gate was run **as the producer** (`runner gate-receipt run`…)") while the rule they cite is conditional (`precondition`/`absent`, LEDGERS.md:305-306); `execute-phase/SKILL.md:50` and `unit-lane/SKILL.md:308` carry the no-handshake exception inline, these two call sites do not. The old text ("the normal project gate") was project-neutral, so the modality did flip at the call site — but each sentence cites the owner block that carries the condition, and the rule itself kept both qualifiers, so this is prose restating its owner incompletely, not a binding rule made absolute. Smallest action: mirror execute-phase's one-clause exception at these two call sites.
4) scripts/gate-producer-drift.test.mjs:151-190 — the red corpus's two expectation arrays (finding-code list, missing-field order) were corrected inside the implementation commit `ed1ffdab4`; the red-commit form could not be satisfied by any correct implementation (it expects two findings the audit cannot emit, and an alphabetical field order against `PRODUCER_FIELDS` order), so the corrected assertions were never observed red or green in isolation, and `red-first` (order-only) cannot see the edit. No behaviour defect: the corrected expectations match the audit's actual output (9/0 here). Advisory — the correction deserves a `## Log` line of its own.
5) skills/pre-execution-review/references/LEDGERS.md:266 — the `gate-ran@1` grammar example still labels the slot `[reserved trailing slot: \`manifest <sha>\`]` while the bullet below (273-276) says the producer fills it; the "reserved, not yet consumed" claim itself was rewritten, so this is terminology residue in a shape annotation, not a surviving old truth.
6) SPEC.md:464 (E15) — apart from its `0 paths` half (blocker 1), E15 attributes three PASS lines to one `bun scripts/check-skill-context.mjs` run; that invocation prints only `PASS context budgets: 33 skills`, the route line needs `--routes` and the documents line `--documents`. All three budgets PASS here under their own invocations — narration imprecision only.
7) SPEC.md §Applicable tests, `bun test scripts/red-first.test.mjs` — the bare command is red at head under bun's 5s per-test default (8 pass / 1 fail, the shipped-history walk at 5008ms); with its declared 60s bound it is 9/0. Base-present by the allowlist's own record ("bun's own 5s default already failed this suite standalone before this unit"), so the listed command needs the bound flag, not a repair.
Sibling sweep: list — blockers 2 (`decisions.md:68`) and 3 (`SPEC.md:324`) plus advisory 5 (`LEDGERS.md:266`) are the surviving mentions; every other mention of what this change removed or rewrote is clean (no live surface still claims "reserved, not yet consumed", no live surface claims the receipt is only reactively produced, `docs/generated/units.md`, `docs/ROADMAP.md` and the changeset narrate the post-change truth, and `skills/review-verify`/`skills/audit-pr` carry no edit at all).
Completeness: S1–S7 resolved (S1→P7, S2→P1/P3/P4, S3→P1/P2/P3, S4→P2/P3/P5, S5→P5/P6, S6→P6, S7→P6 — every task validator re-run green here except the S7/O10 diff clause named in blocker 1) | open ids: O10 (marked `verified` on a validator that does not reproduce — blocker 1)
Spot check: `bun scripts/gate-producer-drift.mjs` (SPEC E3) → match (`gate-producer-drift — feat-728-gate-receipt-producer · 4 callers · 1 owner block · 1 template guide · 0 findings` + `verdict: PASS`, exit 0). The wider re-run surfaced exactly two reported lines that do not reproduce — E15 (blocker 1) and E16 (advisory 2); every other reported command matched its recorded result.
Verdict: NEEDS-DECISION (B1, B2, B3)
```
