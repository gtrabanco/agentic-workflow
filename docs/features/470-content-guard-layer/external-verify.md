# External verify — feat/470-content-guard-layer

Read-only verification run, 2026-11-17. Full verdict (no prior `EXTERNAL VERIFY`
receipt existed for this unit).

```text
EXTERNAL VERIFY — base: 3a5b76b409beeb58a5b93bab57612734420b8e4a · head: 5dd7a0b8a57667640afdc8874eb63d95130a24bb
Blockers: 4 — each: file:line, reproducer, base-vs-head evidence
  1. docs/workflow/SKILL_CONTEXT_BUDGETS.json:167 — the merge resolution reverted main's init-workspace reference ceiling (5071 → 4848) and deleted main's `merge of PR #594 …` referenceSources note, unrecorded anywhere in the unit. Reproducer: `git diff 3a5b76b4...HEAD -- docs/workflow/SKILL_CONTEXT_BUDGETS.json` shows the revert; the head tree's largest init-workspace reference measures 4610 est (byte/4, identical to base) while the surviving note at :173 claims 4407; `bun scripts/check-skill-context.mjs --skill init-workspace` → PASS, so the gate stays green over the silent revert. Base-vs-head: base (3a5b76b4 and current origin/main b25ef8a9) carry 5071 + the note; the branch's cut base 5ef01c1f carried 4848; merge 219a1bbc resolved the file branch-side (parents 4848 / 5071 → result 4848) and also dropped main's `unit 557` / `merge of PR #594` provenance notes from the AGENTS.md and GATE_INVENTORY blocks. Smallest action (/aw-local-apply): restore `referenceEstimateMax: 5071` and the deleted `merge of PR #594 …` note, or re-measure this tree and pin with a recorded source entry.
  2. docs/features/470-content-guard-layer/planning-obligations.md:18 (O10, validator cell) — the row is `verified` on three commands; the third does not reproduce. Reproducer: `bun scripts/version-parity-gate.mjs` → exit 2 + `usage: … --content …`, not exit 0. Base-vs-head: the wording is new at head; the substantive gate is green in the recorded form (`bun scripts/version-parity-gate.mjs --content` → exit 0, `VERDICT: PASS`, re-run here). Smallest action: point O10's third command — and AC13's identical wording at SPEC.md:293 — at `--content`, the form G7/O15 already record.
  3. docs/features/470-content-guard-layer/planning-obligations.md:19 (O11, validator cell) — `git diff --name-only 5ef01c1f..HEAD -- skills/` matches `0` lines does not reproduce. Reproducer: the command returns 8 files (skills/audit-docs/SKILL.md, skills/init-workspace/…), all brought in by main's own commits through integration 219a1bbc. Base-vs-head: the change's own skills diff against the merge-base is `0` (`git diff --name-only 3a5b76b4...HEAD -- skills/` → 0), so the substantive claim (S11/AC10) holds; only the frozen cut-base range went stale on integration. Smallest action: retarget the range at the merge-base (as AC10's `<base>` placeholder already does).
  4. docs/features/470-content-guard-layer/SPEC.md:426 (claim; task P6 at :342 lists docs/LOGS.md) — "the session entry" is reported done; it was never written. Reproducer: `git diff --stat 3a5b76b4...HEAD -- docs/LOGS.md` → empty; newest `## ` entry in docs/LOGS.md is 2026-11-16 (pre-cut), no #470 implementation entry exists on the branch or on origin/main. Base-vs-head: LOGS.md byte-identical to base; the claim is new at head. Smallest action: append the 2026-11-17 session entry via log-session, or amend P6 to drop "the session entry".
Advisories: 3 — each: file:line, why advisory
  1. docs/features/470-content-guard-layer/SPEC.md:225 (AC1) — its proved-by says `rg -c 'guardForgeContent' …` matches `2` (one per seam); observed `scripts/batch-scheduler.mjs:3` and `…/workflow-status.mjs:2`. Advisory because the same claim is correctly pinned and re-verified in O1 (`3` and `2`), the wiring substance reproduces, and both suites are green — the AC's stated count is the defect, not the wiring.
  2. scripts/content-guard-discipline.test.mjs:69 — the `release.mjs` exemption's `why` cites "recorded as a planned guard consumer in docs/features/470-content-guard-layer/SPEC.md", and SPEC.md never mentions release.mjs/CHANGELOG. Advisory: the exemption's substantive justification (human-read document, no model instruction) holds and the gate only requires a non-empty reason; the pointer itself is unverifiable.
  3. docs/workflow/SKILL_CONTEXT_BUDGETS.json (integration surface) — origin/main advanced during this run (3a5b76b4 → b25ef8a9, PR #599 / #574's budget pins for batch-scheduler and triage-issue). Not change-caused: any branch cut at 3a5b76b4 shows the same delta, and no pin/package file is touched by this change. Advisory: one more main integration is owed before merge, and this file will be a real conflict there (both sides edited it).
Sibling sweep: 3 findings — SKILL_CONTEXT_BUDGETS.json:173 (surviving note asserts the largest init-workspace reference measures 4407 while the tree measures 4610; main's `unit 557` / `merge of PR #594` provenance notes deleted) → blocker 1; SPEC.md:342,426 (session-entry claim with an untouched sibling docs/LOGS.md) → blocker 4; content-guard-discipline.test.mjs:69 (cites a SPEC record that does not exist) → advisory 2. All other swept surfaces clean: roadmap row + docs/generated/units.md agree, GATE_INVENTORY `normative-surface-grammar` cell 98 → 99 tokens with none lost, AGENTS.md +1 row / 0 deletions, CONFIG.md and both READMEs additive, no stale `clean` guard-reason anywhere, skills/ untouched by the change.
Completeness: S1–S15 resolved (tasks P1–P7, every `(Implements: S#)` validator re-ran green here); obligations O1–O15 — O1–O9, O12–O15 verified with re-run green validators (O14 both differentials reproduced byte-identical in mktemp scratch); open ids: O10, O11 (blockers 2–3).
Spot check: bun test scripts/batch-scheduler.test.mjs → match (73 pass, 0 fail = G2's reported output; note: G6's 898/994 counts are SHA-scoped to bbc79821 — re-run at head 5dd7a0b8 gives 902/1038 pass, 0 fail after main's tests arrived with the integration).
Verdict: NEEDS-DECISION (4 open blockers)
```

## Declared commands re-run (command: observed result)

- `bun test packages/agentic-workflow-schema/test/content-guard.test.mjs` → exit 0 · 5 pass, 0 fail
- `bun test packages/agentic-workflow/test/content-guard.test.mjs` → exit 0 · 15 pass, 0 fail (G1)
- `bun test scripts/batch-scheduler.test.mjs` → exit 0 · 73 pass, 0 fail (G2)
- `bun test --timeout 30000 scripts/workflow-status-sensor.test.mjs` → exit 0 · 81 pass, 0 fail (G3)
- `bun test scripts/content-guard-discipline.test.mjs` → exit 0 · 7 pass, 0 fail (G4)
- `bun test scripts/normative-drift.test.mjs` → exit 0 · 21 pass, 0 fail (G5)
- `bun run --cwd packages/agentic-workflow-schema check:config-schema` → `config.schema.json: current`
- `bun run --cwd packages/agentic-workflow-schema test` → exit 0 · 902 pass, 0 fail
- `(cd packages/agentic-workflow && bun run test)` → exit 0 · 1038 pass, 0 fail
- `node scripts/run-root-suite.mjs` → exit 0 (every listed suite PASS)
- `bun scripts/version-parity-gate.mjs --content` → exit 0 · `VERDICT: PASS`
- `bun scripts/lint-changeset.mjs` → exit 0
- `bun scripts/docs-generate.mjs --check` → exit 0 · `verdict: PASS`
- `bun scripts/prose-gate-inventory.mjs` → exit 0 · `verdict: PASS`
- `bun scripts/check-skill-context.mjs --documents` → PASS (AGENTS.md 723/160, GATE_INVENTORY 170/75 — inside their pins)
- `bun scripts/check-skill-context.mjs` → PASS (30 skills)

Own probes beyond the change's tests:

- S2/S5/S10 pipeline, head vs base: `collectIssues()` over an OWNER fixture carrying an HTML comment, a zero-width byte and a mixed-script `ignоre` token → head returns `"Fix the build "`, strips each kind with `stripped-forge-content-issue-title-901-html-comment-1` / `-body-901-zero-width-1` / `-body-901-homoglyph-instruction-1`, and excludes a `CONTRIBUTOR` with `excluded-forge-content-issue-title-902-untrusted-author`; base (3a5b76b4) returns the raw payload with no degradations.
- O14 differential 1 (planner): base planner (3a5b76b4) vs head planner over one owner-authored fixture, shared scratch `--root`, `--no-state` → both exit 0, stdout byte-identical (2580 bytes).
- O14 differential 2 (sensor): base tree vs head tree, `agentic-workflow workflow-status --json-only` over one owner-authored fixture with a `gh` shim → both exit 0, envelope byte-identical (3773 bytes) and non-vacuous — both guarded issue titles are present in the envelope.
- AC1/AC10/AC11 probes: `rg -c 'guardForgeContent' …` → 3 and 2 (see advisory 1); `git diff --name-only 3a5b76b4...HEAD -- skills/` → 0 lines; `rg -c '^## Backstop — the residual risk$' …/SPEC.md` → 1.

## Run disclosure

- No `git commit`, no `git push`, no branch creation, no `gh` forge mutation, no
  repository file edits — the only write to this workspace is this receipt.
- Base-side copies, probe scripts and fixtures lived in `mktemp -d` scratch
  (`/tmp/…`), built and executed only there, removed after the run; no mutation
  command introduced or modified by the change was executed against the live
  tree or a shared worktree (the planner differential used `--no-state` with a
  scratch `--root`, the sensor ran against a scratch fixture with a local `gh`
  shim).
- `origin/main` advanced mid-run (3a5b76b4 → b25ef8a9); the verdict binds the
  merge-base 3a5b76b4 as base — the PR's true divergence point — and the
  advance is advisory 3.
- `bun scripts/local-gate.mjs` was not re-run: it is not a declared command of
  this unit (its obligations name the root suite, both package suites and the
  version-parity gate, all re-run green above). D9's disclosed
  `dependency-pin-gate` red is base-present: this change touches no
  `package.json` or pin file.

## Corrections

Corrections for blockers 1–4 belong to `/aw-local-apply` under its own bounds
(one batch → one blockers-only recheck → a second only if the same blocker
persists → `Needs your decision`). This verdict suggests no fix beyond the
smallest action named per blocker above.
