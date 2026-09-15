# Unit 224 — progress log (fix/224-deterministic-replan-routing)

## Pre-execution review receipt v1 — plan
- Review: rp-224-20260915-001 · Snapshot: 843327b1a50c1359308efe8182638166eb8a15020aa8d451e69ad3c8710be566 · Verdict: plan-review-fail
- Unit: fix-224 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); the contract forbids a parent on a fix plan snapshot (D30)
- Source revision: 56355c2c0827cabc37d66274d083971e080f4790 · Artifact revision: 56355c2c0827cabc37d66274d083971e080f4790
- Reviewer: review-plan (fresh pi session) · Session: pi-web review turn on `fix/224-deterministic-replan-routing` · Role: reviewer · Author: plan-fix (commit `56355c2c`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: same-model · Policy: v1
- Context-clean note: this conversation wrote/replanned no part of the unit (review-only turn)
- Started/finished: 2026-09-15T11:31:37Z/2026-09-15T11:33:05Z · Findings: 5 (material open: 4)
- Ledgers read: planning-evidence 12 rows (PE-001…PE-012, embedded in the SPEC) · obligations 9 rows (OB-1…OB-9, verified-capable: 0 — all validators pin future work)
- Prior plan receipt (re-review only): none — first cycle
- Portability note: the planner's handoff declared no `artifactRevisionId`; the builder fell back to the source revision (`contentRevision` over the bound paths = `56355c2c`, the SPEC-draft commit). Nothing in this runtime rotates the id — mutate-and-revert detection depends on the next repair producing new bytes and a fresh snapshot. The schema package was absent from `node_modules`; `bun install --frozen-lockfile` + `bun run build` ran inside `packages/agentic-workflow-schema` (gitignored paths only) so the authoritative validator executed; the tree stayed clean throughout.

### Review-run evidence (commands + results)

- Snapshot build: `NODE_PATH=packages/agentic-workflow-schema/node_modules node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-224 --dir docs/fix/224-deterministic-replan-routing` → digest `843327b1a50c1359308efe8182638166eb8a15020aa8d451e69ad3c8710be566`, schema-validated by the recipe owner (no refusal); `unitKind: fix` derived from the `docs/fix/` prefix, no `--parent` passed, `parentSpecSnapshotDigest: null` ✓. Artifacts: spec (38022 B) + acceptance (3916 B); the two planning ledgers are embedded in the SPEC (the fix contract's no-separate-artifacts convention, SPEC Decision 5, precedent fix-179) and bound through the whole-file `spec` row. Contexts: `project-guide` + `normalized-repository-state` present and bound; `architectural-invariants` absent (the optional doc does not exist). Acceptance manifest blob: `git hash-object docs/fix/224-deterministic-replan-routing/ACCEPTANCE.md` → `4e22637d6d5bcee5e0e0e9149385dcf00b2bf64c`.
- Citation verification at `56355c2c`: PE-001 ✓ (`skills/plan-feature/references/ROUTING.md:17-24` — `planned`/`in-progress` STOP blocks print `→ /execute-phase` exactly as claimed), PE-002 ✓ (both planners' progressive-loading allowlists are closed lists excluding `review-findings.md`), PE-003 ✓ (the three destination sentences read verbatim as claimed), PE-004 ✓ (fold freeze-batch + REPLAN-ROUTE text at both cited sites), PE-005 ✓ substance (`suggested` is a schema-declared **array** at `envelope.schema.json:169-175`, so "the envelope gains one optional array" needs no package change; `SENSOR_SIGNALS.md:74-76` documents the fold suggestion; `grep -n suggested scripts/workflow-status.mjs` → only `:735`, not `:729`), PE-006 ✓ substance (`readFixNow` at `:713`, projection push `:735` — the SPEC's `:708-729` window is offset ~6 lines), PE-008 ✓ (fix template `## Rollback` row present; no schema vocabulary change needed), PE-009 ✓ (`CLASSIFY.md:96-98` carries the affected use case), PE-011 ✓ (`scripts/phase-lint.mjs` absent at HEAD and at `b5358666`; present on `feat/37-phase-lint-script`), PE-012 ✓ (budget manifest, bundler, parity test and the CLAUDE.md mirror rule all present).
- The decisive falsification: `git ls-tree HEAD docs/features/ --name-only | grep -c 37` → **0**, and the same at `b5358666` → **0** — `docs/features/37-phase-lint-script/` does not exist in this tree; the 1065-line ledger (`git show feat/37-phase-lint-script:docs/features/37-phase-lint-script/review-findings.md | wc -l` → 1065) exists only on the unmerged branch, and roadmap row 37 at HEAD is `idea` (`docs/features/ROADMAP.md:47`). AC5's dogfood (`node scripts/unit-route.mjs 37-phase-lint-script` → `route: replan` + row ids) is therefore not executable at the revision acceptance is verified against, and PE-010's `observed-revision: b5358666` misattributes that measurement.
- Destination census (`grep -rn "replan-in-unit" skills/ docs/workflow/ --include="*.md"`): besides the four converged surfaces, `skills/review-implementation/references/CLASSIFY.md:96-98`, `skills/review-implementation/SKILL.md:100-101` and `skills/review-change/references/OUTPUT_AND_GUARDRAILS.md:27-29` each send `replan-in-unit` to `execute-phase` with no planner and no router, and `docs/workflow/FEATURE_WORKFLOW.md:280-282` + `PORTABLE_PROMPT.md:135-136` (+ ES siblings) repeat it — AC7's "no surface sends a replan row to the executor or the fold" is false at HEAD while its validator (grep over four files) passes.

### Ledger sweep L1–L6 + Engineering/fix checks

- L1 pass — `parentSpecSnapshotDigest: null`, stated plainly; no invented parent (fix unit, D6/D30).
- L2 FAIL — PE-010 is a `proven` row whose observation (`wc -l → 1065`) is not reproducible at its claimed `observed-revision: b5358666`; it is reproducible only against `feat/37-phase-lint-script`'s tree (RP-224-2). All other rows are current + proven/decision.
- L3 FAIL — the Security risks section and scenario S7 promise a sanitizer (single sanitizer, truncation of long cells, never-verbatim echo) that has no obligation row, no acceptance criterion and no implementing task (RP-224-4).
- L4 pass — OB-1…OB-9 each name one phase, one task, owner `execute-phase`, a validator, required evidence, all `planned`; none blank, none `deferred`, none duplicated.
- L5 FAIL — AC7's validator (grep over the four cited files) passes while the criterion's unqualified "no surface sends a replan row to the executor or the fold" is false at HEAD (RP-224-3); AC5 has no tree in which it can run as written (RP-224-1).
- L6 pass — no prior findings ledger for this unit; first cycle.
- P1 pass · P2 FAIL (AC5 hard-depends on unit 37's unmerged tree while `Depends on: none` — RP-224-1) · P3 pass (envelope boundary honest: `suggested` already schema-declared; frozen classification and linter grammar untouched) · P4 pass (untrusted-text echo addressed in prose; its missing execution owner is RP-224-4) · P5 pass (EN+ES pairs scheduled same-PR; no schema/data migration) · P6 pass (phase ledger tick + idempotent validators) · P7 pass (revert path with honest causal limits) · P8 pass (router block + sensor emission + suite alarm; only the dogfood leg is broken) · P9 pass (7 fingerprints recorded PASS 8/8, last phase Hardening & PR, planning-time lint on the unmerged linter disclosed with the binding re-lint at execution) · P10 pass (done-whens are commands with outcomes; real gates; red-first explicit) · P11 FAIL (S7's "sanitizer pin" has no implementing task — RP-224-4; the dogfood leg of S1 unrunnable — RP-224-1) · P12 FAIL (PE-010 path absent at its claimed revision — RP-224-2; PE-005/006 window drift — RP-224-5) · F1 pass (operator report + cited gate lines reproduce the dead end by reading) · F2 pass (four causes evidenced at `path:line`; the competing design — extending the sensor — recorded and ruled out in Decision 1) · F3 FAIL (regression scope under-covers its own grep: PE-007's cited `grep -rn replan-in-unit` returns ~45 hits and the fold converges four files + two tutorial docs — RP-224-3) · F4 pass (revert; no fake Product-half ceremony).

Verdict: **PLAN-REVIEW-FAIL** — 4 material open findings (all class `plan`); repair owner `plan-fix 224`.

## Pre-execution review receipt v1 — plan
- Review: rp-224-20260915-002 · Snapshot: 605f53068f5e0d43509750aecfb752fd5afe7d98cc3dbff08b1ae871a7424b35 · Verdict: plan-review-fail
- Unit: fix-224 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); the contract forbids a parent on a fix plan snapshot (D30)
- Source revision: f8adbb4d9b5145c83df79ba63acd3088775cc835 · Artifact revision: f8adbb4d9b5145c83df79ba63acd3088775cc835
- Reviewer: review-plan (fresh pi session) · Session: pi-web review turn on `fix/224-deterministic-replan-routing` (cycle 2) · Role: reviewer · Author: plan-fix (commit `f8adbb4d`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: same-model · Policy: v1
- Context-clean note: this conversation wrote/replanned no part of the unit (review-only turn)
- Started/finished: 2026-09-15T13:44:00Z/2026-09-15T14:17:54Z · Findings: 1 (material open: 1)
- Ledgers read: planning-evidence 14 rows (PE-001…PE-014, embedded in the SPEC) · obligations 10 rows (OB-1…OB-10, verified-capable: 0 — all validators pin future work)
- Prior plan receipt (re-review only): rp-224-20260915-001 @ 843327b1a50c1359308efe8182638166eb8a15020aa8d451e69ad3c8710be566
- Portability note: the planner's handoff declared no `artifactRevisionId`; the builder fell back to the source revision (`contentRevision` over the bound paths = `f8adbb4d`, the repair-batch commit), while the SPEC's `## Amendments` names the revision label `fix-224-artrev-0002` — recorded as label + bound bytes. The schema package was present (`NODE_PATH=packages/agentic-workflow-schema/node_modules`); the authoritative validator executed, no install needed; the tree stayed clean throughout the review reads.

### Review-run evidence (commands + results)

- Snapshot build: `NODE_PATH=packages/agentic-workflow-schema/node_modules node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-224 --dir docs/fix/224-deterministic-replan-routing` → digest `605f53068f5e0d43509750aecfb752fd5afe7d98cc3dbff08b1ae871a7424b35`, schema-validated by the recipe owner (no refusal); `unitKind: fix` derived from the `docs/fix/` prefix, no `--parent` passed, `parentSpecSnapshotDigest: null` ✓. Artifacts: spec (47193 B) + acceptance (4949 B); both planning ledgers embedded in the SPEC (fix contract, SPEC Decision 5, precedent fix-179 — verified: `docs/fix/179-declared-ledger-delta-receipts/SPEC.md` sized M with `### Planning evidence` embedded) and bound through the whole-file `spec` row. Contexts: `project-guide` + `normalized-repository-state` present and bound; `architectural-invariants` absent (`docs/architecture/` does not exist — matches the builder's `absent` row, honestly stated). Acceptance manifest blob re-computed: `git hash-object docs/fix/224-deterministic-replan-routing/ACCEPTANCE.md` → `b6dc545edf96e99a6d0081eadac298124c7ac592` — matches the value recorded in the SPEC `## Status` after the re-freeze ✓.
- Re-review gate (POLICY §4): prior receipt `rp-224-20260915-001` verdict FAIL; the repair batch (`f8adbb4d`, touched only `docs/fix/224-deterministic-replan-routing/*` per `git show --stat`) produced a changed snapshot → repeat sanctioned. First repair/re-review cycle was the normal correction path; this verdict enters the second cycle → `CONVERGENCE-ANOMALY` printed below.
- Repair verification, row by row against the new bytes: RP-224-1 ✓ (AC5 re-targeted to the committed unit-37 fixture, PE-013 added, `Depends on` carries the ordering note, Observability alarm re-worded, live dogfood demoted to informational post-merge in `### Testing`); RP-224-2 ✓ (PE-010 now cites `feat/37-phase-lint-script@e1e282c5` with the cross-branch disclosure — re-verified `git show e1e282c5:docs/features/37-phase-lint-script/review-findings.md | wc -l` → 1065; the branch tip has since moved to `0e6ad8aa` where the ledger is 1134 lines, but both rows pin the exact commit, so the observation is reproducible); RP-224-3 ✓ (census converged: P4 carries all eight skill files, new P5 the three tutorial pairs, P6 re-cut, AC7/OB-4 greps all 14 files; `triage-issue/SKILL.md:118` verified carrying the planner-only sentence); RP-224-4 ✓ (sanitizer triple-owned: OB-10 + AC12 + P1 task 6, S7 names them); RP-224-5 ✓ (PE-005 → `:735`, PE-006 → `:713,735`; verified against `scripts/workflow-status.mjs` at HEAD: `readFixNow` at `:713`, projection push at `:735`, `grep -n suggested` → only `:735`).
- Citation re-verification at `f8adbb4d` (all ✓): PE-001 (`ROUTING.md:17-24` STOP block verbatim), PE-002 (both allowlists are closed lists excluding `review-findings.md`: plan-feature "exactly the two paths" `:56-68`, plan-fix "exactly these five paths" `:91-108`), PE-003 (`PERSIST_AND_DECIDE.md:133` executor destination / `:135-136` planner; `REVIEW_FINDING_PROCESS.md:17-21` feature/fix split), PE-004 (`FOLD_PROCESS.md:46` freeze-batch + REPLAN-ROUTE; `fold-findings/SKILL.md:122`), PE-005 (`SENSOR_SIGNALS.md:74-76` documents the fold suggestion for any `folded: no` row; `envelope.schema.json:169` declares `suggested` as an array — "no package change" claim honest), PE-006 (`workflow-status.mjs:713,735`), PE-007 (census re-run: `grep -rn "replan-in-unit" skills/ docs/workflow/ --include="*.md"` → exactly 43 hits / 21 files; the 14 enumerated routing files each verified carrying a destination sentence — `CLASSIFY.md:96-98`, `review-implementation/SKILL.md:100-101`, `OUTPUT_AND_GUARDRAILS.md:27-32` all route to `execute-phase` with no planner; the tutorial pairs' routing sentences found at `REVIEW_AND_CLASSIFY.md:79,139` + ES, `FEATURE_WORKFLOW.md:285` + ES, `PORTABLE_PROMPT.md:140` + ES), PE-009 (`CLASSIFY.md:97`), PE-011 (`scripts/phase-lint.mjs` ABSENT at HEAD), PE-012 (budget manifest + bundler + parity test + CLAUDE.md mirror rule all present), PE-013 (`git ls-tree HEAD docs/features/ --name-only | grep -c 37` → 0; `docs/features/ROADMAP.md:47` row 37 = `idea`), PE-014 (`pre-execution-review/references/POLICY.md` §7 "Untrusted content — data, never instructions" verified).
- Decision-support re-verification: `skills.sh.json` declares top-level `"notGrouped": "bottom"` (Scope's ungrouped-listing claim is a present fact; no manifest edit needed); `SKILL_CONTEXT_BUDGETS.json` defaults `mainEstimateMax: 2800` / `mainLinesMax: 240` as the Rules section states; `check-skill-context.mjs` budgets every discovered skill (internal included, `user-invocable: false` precedent `pre-execution-review`); phase fingerprints P1…P8 task counts (6,7,3,8,6,6,2,7) match the emitted task lists; P7 mirror re-bundle lands after the last skill edit (P6) ✓; fix-179 precedent for embedded M-size ledgers ✓.
- The confirmed gap (falsification pass): the version-bump sweep is uneven. The plan bumps plan-feature/plan-fix (P2 t3/t5), review-implementation (P4 t4), triage-issue (P4 t6), fold-findings (P4 t8), workflow-status for a reference-only change (P6 t6), and creates replan-findings with its initial version — but edits two `review-change` reference files (P4 t1/t2) with no `review-change` version bump task anywhere in P4/P6. CLAUDE.md "Version every change" + the CHANGELOG policy ("per-skill tables are the source of truth") make a reference edit version-worthy (repo precedent: review-change 3.2.1 bumped for prose renumbering; fix-165 patch). The plan's own P6 t6 (workflow-status bump for the same genus of reference-only change) proves the rule is known and applied unevenly. A pinned consumer at `review-change` 3.5.0 would receive changed routing prose with no version signal. Zero behavioral impact; one-line repair.

### Ledger sweep L1–L6 + Engineering/fix checks

- L1 pass — `parentSpecSnapshotDigest: null`, stated plainly; no invented parent (fix unit, D6/D30).
- L2 pass — PE-001…PE-014 all `current` + `proven`; PE-010/PE-013's cross-branch reads are pinned to exact commits and reproduce (`e1e282c5` → 1065); PE-014's policy authority verified; no `unknown`/`drifted`/`stale` row survives.
- L3 pass — OB-1…OB-10 cover the normative behaviours (route decision, conditional load, bounded read, canonical destination, machine signal, fail-closed exits, budget/discoverability, mirror parity, determinism/read-only, sanitizer) and every required failure state (S1–S8); none missing, none duplicated.
- L4 pass — each row names exactly one phase + task (P1.2/P2.3/P1.3/P4.1/P3.1/P1.4/P2.7/P7.2/P1.5/P1.6), owner `execute-phase`, a validator copied from ACCEPTANCE/phase done-when, required evidence, status `planned`; none blank, none `deferred`, none duplicated.
- L5 pass — S1–S8 each map to a phase + validator; validators are exit-0 commands pinning named outcomes (route fixtures, class pins, exit codes, sanitizer output), so each can fail; the cycle-1 L5 defect (AC7 true-by-narrow-grep) is closed by the widened 14-file validator matching the census.
- L6 pass — RP-224-1…RP-224-5 all `resolved` with resolution evidence independently re-verified against the new bytes (see Review-run evidence); no open material row carried into this review except the new one below.
- P1 pass (surfaces named with `path:line` evidence rows; invariant posture = the Rules list: frozen classification, linter grammar, agnosticism, budget/mirror constraints — `docs/architecture/` absent, honestly unbound) · P2 pass (closure merged; the unit-37 ordering note is honest and AC-verifiable without unit 37 — fixture from a committed revision, live variant informational) · P3 pass (envelope boundary honest: `suggested` already schema-declared, no package vocabulary change; frozen classification untouched) · P4 pass (untrusted echo owned by OB-10/AC12/S7 + sanitizer; no secrets/auth/PII surface; fail-closed exits) · P5 pass (no migration; EN+ES pairs scheduled same-PR in P5/P6 and the Affected-docs table) · P6 pass (progress receipts, idempotent exit-0 validators, phase tick ledger, execution-time re-lint disclosed as binding) · P7 pass (revert with honest causal limit: the dead end returns) · P8 pass (router block + `next.suggested` + silent-failure alarm via the dogfood fixture; live re-check post-merge informational) · P9 **finding** (RP-224-6: P4's task set is incomplete for its own deliverable under the repo's version-every-change rule — the two review-change reference edits ship without their version bump; fingerprints otherwise 8/8 recorded, counts match, order correct, Hardening last) · P10 pass (every done-when a command with an expected outcome; gate = the repo's real suites; red-first explicit; no validator weakened) · P11 pass (S1–S8 cover wrong-route classes, guessed-route failure, sanitizer echo, absent ledger; concurrency/queues/cache covered as n/a in risks) · P12 pass (every cited `path:line`, grep count, revision-pinned read, dependency/status claim re-verified at `f8adbb4d`) · F1 pass (operator report + reproduced dead end by reading the cited gates; cost evidence pinned) · F2 pass (four causes at `path:line`; the extend-the-sensor alternative recorded and ruled out in Decision 1) · F3 pass (scope now covers its own census: 43 hits / 21 files → 14 converged surfaces + test suites that catch a re-break) · F4 pass (revert; no fake Product-half ceremony).

Verdict: **PLAN-REVIEW-FAIL** — 1 material open finding (class `plan`); repair owner `plan-fix 224`.

### CONVERGENCE-ANOMALY — fix-224 plan
- Finding ids: repeated: none / new: RP-224-6
- Snapshots: 843327b1a50c1359308efe8182638166eb8a15020aa8d451e69ad3c8710be566 → 605f53068f5e0d43509750aecfb752fd5afe7d98cc3dbff08b1ae871a7424b35 (artifactRevisionId 56355c2c0827cabc37d66274d083971e080f4790 → f8adbb4d9b5145c83df79ba63acd3088775cc835, label `fix-224-artrev-0002`)
- Missed: P4/P6 task list — the review-change version bump + its per-skill changelog cell (CLAUDE.md "Version every change"; CHANGELOG per-skill tables are the source of truth)
- Owning stage: plan
- Why the prior review/repair failed: the repair batch converged the destination census and re-owned the sanitizer, but applied the version-bump rule only where SKILL.md bytes change — the same genus got a bump for workflow-status (P6 t6) while review-change's two reference edits (P4 t1/t2) got none
- Route to owner: `plan-fix 224` — one-line repair batch (add the review-change bump task + changelog cell, re-freeze the ledgers), then `/review-plan fix-224` re-reviews the new artifact revision

## Pre-execution review receipt v1 — plan
- Review: rp-224-20260915-003 · Snapshot: a65783d87c171aa99e9c2db19c15a2a014256339774e426c7d267b25593f779f · Verdict: plan-review-pass
- Unit: fix-224 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); the contract forbids a parent on a fix plan snapshot (D30)
- Source revision: dbbd6a92f7dd5348e397ae07f8c9947e69921bb1 · Artifact revision: dbbd6a92f7dd5348e397ae07f8c9947e69921bb1
- Reviewer: review-plan (fresh pi session) · Session: pi-web review turn on `fix/224-deterministic-replan-routing` (cycle 3) · Role: reviewer · Author: plan-fix (commit `dbbd6a92`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: same-model · Policy: v1
- Context-clean note: this conversation wrote/replanned no part of the unit (review-only turn; the only writes are this receipt and the chat report)
- Started/finished: 2026-09-15T15:55:00Z/2026-09-15T16:05:27Z · Findings: 0 (material open: 0)
- Ledgers read: planning-evidence 15 rows (PE-001…PE-015, embedded in the SPEC) · obligations 11 rows (OB-1…OB-11, verified-capable: 0 — all validators pin future work)
- Prior plan receipt (re-review only): rp-224-20260915-002 @ 605f53068f5e0d43509750aecfb752fd5afe7d98cc3dbff08b1ae871a7424b35
- Portability note: the planner's handoff declared no `artifactRevisionId`; the builder fell back to the source revision (`contentRevision` over the bound paths = `dbbd6a92`, the repair-batch commit), while the SPEC's `## Amendments` names the revision label `fix-224-artrev-0003` — recorded as label + bound bytes (label carried here, not on the revision line, so the verifier parses the field cleanly). The schema package was present (`NODE_PATH=packages/agentic-workflow-schema/node_modules`); the authoritative validator executed, no install needed; the tree stayed clean throughout the review reads.

### Review-run evidence (commands + results)

- Snapshot build: `NODE_PATH=packages/agentic-workflow-schema/node_modules node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-224 --dir docs/fix/224-deterministic-replan-routing` → digest `a65783d87c171aa99e9c2db19c15a2a014256339774e426c7d267b25593f779f`, schema-validated by the recipe owner (no refusal); `unitKind: fix` derived from the `docs/fix/` prefix, no `--parent` passed, `parentSpecSnapshotDigest: null` ✓. Artifacts: spec (49740 B) + acceptance (5489 B); both planning ledgers embedded in the SPEC (fix contract, SPEC Decision 5, precedent fix-179) and bound through the whole-file `spec` row. Contexts: `project-guide` + `normalized-repository-state` present and bound; `architectural-invariants` absent (`docs/architecture/` does not exist — matches the builder's `absent` row, honestly stated). Acceptance manifest blob re-computed: `git hash-object docs/fix/224-deterministic-replan-routing/ACCEPTANCE.md` → `0dd2747222ce25617ffcf6eae851035a215d6504` — matches the value recorded in the SPEC `## Status` after the artrev-0003 re-freeze ✓.
- Re-review gate (POLICY §4): prior receipt `rp-224-20260915-002` verdict FAIL; the repair batch (`dbbd6a92`, touched only `docs/fix/224-deterministic-replan-routing/*` per `git diff --stat f8adbb4d..HEAD`: ACCEPTANCE +7, SPEC ±27, planning-findings +1, progress +44) produced a changed snapshot → repeat sanctioned. This is the third cycle (second re-review); the anomaly block below documents the loop's exit, not a new repair.
- Repair verification, row by row against the new bytes (RP-224-6): ✓ P4's two review-change reference tasks merged into one same-skill task and new P4 task 8 added — `sed -n` over `### P4` shows exactly 8 tasks (fingerprint `P4:docs:8:skills-replan-destination` unchanged and still accurate); task 8 bumps `skills/review-change/SKILL.md` 3.5.0 → 3.5.1 (patch) and adds its per-skill changelog cell to `CHANGELOG.md` + `CHANGELOG.es.md`; P4's done-when extended with the three-grep version-signal validator; grounded as PE-015 (new row), owned by OB-11 + AC13, both added to the SPEC and ACCEPTANCE (re-frozen, blob matches). Version-sweep evenness re-checked across every edited skill: plan-feature (P2 t3 wire + bump), plan-fix (P2 t5 wire + bump), review-change (P4 t1 refs + P4 t8 bump), review-implementation (P4 t3 ref + t4 SKILL + bump), triage-issue (P4 t5 RFP + bump, SKILL t4 same skill), fold-findings (P4 t6/t7 + bump), workflow-status (P6 t6 bump for the reference-only withdrawal), replan-findings (new skill, initial version) — no edited skill lacks a bump task and none is double-bumped.
- Citation re-verification at `dbbd6a92` (all ✓): PE-001 (`skills/plan-feature/references/ROUTING.md:17-24` — `planned`/`in-progress` STOP blocks print `→ /execute-phase` verbatim), PE-002 (plan-feature allowlist "exactly the two paths" `:56-68`; plan-fix "exactly these five paths" `:91-108`; neither names `review-findings.md`), PE-003 (`PERSIST_AND_DECIDE.md:133` executor destination / `:135-136` planner; `REVIEW_FINDING_PROCESS.md:17-21` feature/fix split), PE-004 (`FOLD_PROCESS.md:46` freeze-batch table + REPLAN-ROUTE; `fold-findings/SKILL.md:120-124`), PE-005 (`SENSOR_SIGNALS.md:74-76` documents the fold suggestion; `envelope.schema.json:169-175` declares `suggested` as an array; `grep -n suggested scripts/workflow-status.mjs` → only `:735`), PE-006 (`readFixNow` at `:713`, projection push at `:735`), PE-007 (census re-run: `grep -rn "replan-in-unit" skills/ docs/workflow/ --include="*.md"` → exactly 43 hits / 21 files), PE-011 (`scripts/phase-lint.mjs` ABSENT at HEAD), PE-013 (`git ls-tree HEAD docs/features/ --name-only | grep -c 37` → 0; `docs/features/ROADMAP.md:47` row 37 = `idea`), PE-015 (`skills/review-change/SKILL.md:4` = `version: 3.5.0`; `CHANGELOG.md:9` "Versioning policy (per skill)"; the `review-change` 3.2.1 prose-renumbering cell at `CHANGELOG.md:392`; `scripts/normative-drift.test.mjs:677` `version-tables` compares `newestVersionCell(text, skill)` against the frontmatter — the pair is machine-enforced as claimed).
- Decision-support re-verification: `skills.sh.json:3` `"notGrouped": "bottom"` (the ungrouped-listing claim is a present fact); `SKILL_CONTEXT_BUDGETS.json` defaults `mainEstimateMax: 2800` / `mainLinesMax: 240` as the Rules section states; `CHANGELOG.es.md` carries the same per-skill cell shape (`| 3.2.1 | … |` at `:162`, `:313`), so AC13's grep lands on both tables; PE-010/PE-013's cross-branch reads reproduce exactly at their pinned commits (`git show e1e282c5:docs/features/37-phase-lint-script/review-findings.md | wc -l` → 1065; branch tip `feat/37-phase-lint-script` has moved to 1134 lines but both rows pin `e1e282c5`); phase fingerprints P1…P8 task counts (6,7,3,8,6,6,2,7) match the emitted task lists; P7 mirror re-bundle lands after the last skill edit (P6) ✓.
- Falsification pass: three candidate invented-looking claims probed and confirmed real — (1) PE-015's "machine-enforced" pair (drift test verified), (2) PE-010's 1065-line cost measurement (reproduces at the pinned commit), (3) PE-007's census (43/21 exact). No obligation this plan cannot deliver, no phase whose validator could pass for the wrong reason (AC13's loose grep is pinned by the drift test's newest-cell-equals-frontmatter check), and the out-of-scope residue (root-file linter grammar gap → unit 37; loop convergence → #205) is named with owners. Every failure state S1–S8 has a scenario and a fixture-pinned validator that can fail.

### Ledger sweep L1–L6 + Engineering/fix checks

- L1 pass — `parentSpecSnapshotDigest: null`, stated plainly; no invented parent (fix unit, D6/D30).
- L2 pass — PE-001…PE-015 all `current` + `proven`; the new PE-015 verified against CLAUDE.md, the CHANGELOG policy and the drift test; PE-010/PE-013's commit-pinned cross-branch reads reproduce; no `unknown`/`drifted`/`stale` row survives.
- L3 pass — OB-1…OB-11 cover the normative behaviours (route decision, conditional load, bounded read, canonical destination, machine signal, fail-closed exits, budget/discoverability, mirror parity, determinism/read-only, sanitizer, version signal) and every required failure state (S1–S8); the cycle-2 gap (review-change bump) is closed by OB-11; none missing, none duplicated.
- L4 pass — each row names exactly one phase + task (P1.2/P2.3/P1.3/P4.1/P3.1/P1.4/P2.7/P7.2/P1.5/P1.6/P4.8), owner `execute-phase`, a validator copied from ACCEPTANCE/the phase done-when, required evidence, status `planned`; none blank, none `deferred`, none duplicated.
- L5 pass — S1–S8 each map to a phase + validator; validators are exit-0 commands pinning named outcomes (route fixtures, class pins, exit codes, sanitizer output), so each can fail; the cycle-1 L5 defect stays closed (14-file AC7 validator matching the census).
- L6 pass — RP-224-1…RP-224-6 all `resolved` with resolution evidence independently re-verified against the new bytes (RP-224-6 above; RP-224-1…5 verified in cycle 2 and their code-side citations re-spot-checked here); no open material row carried into execution.
- P1 pass (surfaces named with `path:line` evidence rows; invariant posture = the Rules list: frozen classification, linter grammar, agnosticism, budget/mirror constraints — `docs/architecture/` absent, honestly unbound) · P2 pass (closure honest: delivery needs no dependency; the unit-37 ordering note is stated and AC-verifiable without unit 37 — fixture from a pinned committed revision, live variant informational) · P3 pass (envelope boundary honest: `suggested` already schema-declared at `envelope.schema.json:169-175`, no package vocabulary change; frozen classification untouched) · P4 pass (untrusted echo owned by OB-10/AC12/S7 + sanitizer; no secrets/auth/PII surface; fail-closed exits, no injection surface) · P5 pass (no migration; EN+ES pairs scheduled same-PR in P5/P6 and the Affected-docs table) · P6 pass (progress receipts, idempotent exit-0 validators, phase tick ledger, execution-time re-lint disclosed as binding) · P7 pass (revert with honest causal limit: the dead end returns) · P8 pass (router block + `next.suggested` + silent-failure alarm via the dogfood fixture; live re-check post-merge informational) · P9 pass (8 fingerprints recorded PASS 8/8, counts 6,7,3,8,6,6,2,7 match the task lists, order correct, no early building of a later phase's deliverable, last phase Hardening & PR; planning-time lint on the unmerged linter disclosed with the binding re-lint at execution) · P10 pass (every done-when a command with an expected outcome; gate = the repo's real suites; red-first explicit; no validator weakened — the artrev-0003 change *added* a validator) · P11 pass (S1–S8 cover wrong-route classes, guessed-route failure, sanitizer echo, absent ledger; concurrency/queues/cache covered as n/a in risks) · P12 pass (every cited `path:line`, grep count, revision-pinned read, dependency/version/status claim re-verified at `dbbd6a92`) · F1 pass (operator report + reproduced dead end by reading the cited gates; cost evidence pinned) · F2 pass (four causes at `path:line`; the extend-the-sensor alternative recorded and ruled out in Decision 1) · F3 pass (scope covers its own census: 43 hits / 21 files → 14 converged surfaces + test suites that catch a re-break) · F4 pass (revert; no fake Product-half ceremony).

Verdict: **PLAN-REVIEW-PASS** — 0 material open findings; execution may bind this receipt for snapshot `a65783d87c171aa99e9c2db19c15a2a014256339774e426c7d267b25593f779f`.

### CONVERGENCE-ANOMALY — fix-224 plan (loop exit)
- Finding ids: repeated: none / new: none
- Snapshots: 605f53068f5e0d43509750aecfb752fd5afe7d98cc3dbff08b1ae871a7424b35 → a65783d87c171aa99e9c2db19c15a2a014256339774e426c7d267b25593f779f (artifactRevisionId f8adbb4d9b5145c83df79ba63acd3088775cc835 → dbbd6a92f7dd5348e397ae07f8c9947e69921bb1, label `fix-224-artrev-0003`)
- Missed: none this cycle — the repair closed RP-224-6 exactly as routed (P4 task 8 + PE-015/OB-11/AC13 + done-when extension, ledgers re-frozen)
- Owning stage: plan
- Why the prior review/repair failed: the plan's version-bump sweep covered workflow-status's reference-only edit but omitted review-change's two reference edits; the repair batch made the sweep even
- Route to owner: none — the loop terminates here on PASS; execution (`/execute-phase --fix 224`) is the next owner

## Execution preflight — `execute-phase --fix 224` (2026-09-15)

- **Dependency gate: PASS** — the SPEC's `## Depends on` section declares no dependency unit; the transitive closure is empty, so nothing needs a forge check. Fingerprint: `793a4040121ca59c1a8ae16b39aabac5dc2b9e71` (`git hash-object --stdin` over the `## Depends on` section body, heading excluded — the fix-214 recipe).
- **Own-status precondition: n/a** — a fix unit has no roadmap-status equivalent; its own state is the fix-index row (`docs/fix/README.md:30`, `pending`).
- **Pre-execution review gate: PASS** — newest `stage: plan` receipt `rp-224-20260915-003`, verdict `plan-review-pass`. Re-derived with `NODE_PATH=packages/agentic-workflow-schema/node_modules node scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-224 --dir docs/fix/224-deterministic-replan-routing` → `current: true`, `observedDigest: a65783d87c171aa99e9c2db19c15a2a014256339774e426c7d267b25593f779f`, `digestMatches: true`, `verdictIsPass: true`, `structural.changedPaths: []`.
- **Acceptance-manifest gate: PASS** — `git hash-object docs/fix/224-deterministic-replan-routing/ACCEPTANCE.md` → `0dd2747222ce25617ffcf6eae851035a215d6504`, equal to the blob recorded in the SPEC `## Status` after the `fix-224-artrev-0003` re-freeze. Receipt appended below; re-checked before every phase.
- **Phase-lint: PASS (8/8) for P1–P8** — `node /tmp/phase-lint.mjs docs/fix/224-deterministic-replan-routing/SPEC.md` (the linter extracted from the unmerged `feat/37-phase-lint-script`, PE-011) → every phase `PASS (8/8)`, `verdict PASS`, overall fingerprint `044734b3f34f66983a7ec7aade48d3700e83e6ee4b8f40703122ce3a37f67848`; per-phase fingerprints still match the SPEC's `### Phase-lint` block (P1 6, P2 7, P3 3, P4 8, P5 6, P6 6, P7 2, P8 7 tasks). `scripts/phase-lint.mjs` remains absent on this branch — the binding re-lint is this run.
- **Pre-write implementation discovery: READY** — inline mapper (localized writes, every question answered by the SPEC's `### Planning evidence` rows, targeted reads below). Compact map:
  - Entry points: `scripts/unit-route.mjs` (new CLI); `scripts/workflow-status.mjs` `readFixNow` (:713) / projection (:735) / `resolveNext` (:918); the eight routing skill files and three tutorial pairs named in Scope.
  - Affected surfaces: the sensor envelope's `next` object (schema already declares `suggested`, `envelope.schema.json:169-175`), both planners' progressive-loading allowlists, the fold's REPLAN-ROUTE receipt, `check-skill-context.mjs` discovery, the Pi mirror parity test.
  - Reuse/constraints: `cellsOf`-style escaped-pipe parsing; the `{command, trigger, source_skill}` shape from `SENSOR_SIGNALS.md:13`; `CLAUDE.md` version-every-change + bilingual-doc rules; the eight phase-lint rules.
  - Validation: red-first `node --test scripts/unit-route.test.mjs` (14/14 red absent the script, 14/14 green with it), `node --test scripts/workflow-status-sensor.test.mjs`, `node --test scripts/normative-drift.test.mjs`, `bun scripts/check-skill-context.mjs`, `npx skills add . --list`, the Pi parity suite.
  - Contradictions: none. Unknowns: none — PE-001…PE-015 re-verified by the cycle-3 receipt against `dbbd6a92`.
- **Gate-rejection traces:** none — every gate passed; no `--force` was passed or recorded.

## Dependency receipt v1
- Fingerprint: 793a4040121ca59c1a8ae16b39aabac5dc2b9e71 · Closure: fix-224 ← (none — the SPEC `## Depends on` section names no dependency unit)
- Merged PRs: none required · Fully merged: yes · Verified: 2026-09-15
- Recipe note: `sha1("blob <len>\0" + body)` over the `## Depends on` section body, heading excluded (the fix-214 recipe). The three named cross-issue units (#205, #172, #194) are independent by the SPEC's own statement, never `Depends on` edges; the unit-37 ordering note is informational (RP-224-1).

## Acceptance receipt v1
- Manifest: docs/fix/224-deterministic-replan-routing/ACCEPTANCE.md · Blob: 0dd2747222ce25617ffcf6eae851035a215d6504 · Status: frozen · Verified: 2026-09-15

## P1 — 2026-09-15
- Phase-lint re-checked PASS (8/8) at fingerprint `P1:config/infra:6:deterministic-unit-router`.
- Done: `scripts/unit-route.mjs` — the closed route table (`replan`/`decision`/`fold`/`execute`/`plan-from-issue`, first match winning), the fixed block (`unit`, `status`, `open-rows`, `route`, `next`, `rows`, `read-set`, `fingerprint`), the bounded read set (unit `review-findings.md`/`SPEC.md`/`ACCEPTANCE.md` + cited existing paths, deduped, sorted, capped at 12 with `… and N more`), the fail-closed exits (unknown/usage → 1, ambiguous → 2, no route printed), and one sanitizer (control-char flatten + 160-char truncation) over every echoed id/path. `scripts/unit-route.test.mjs` (14 cases) + the committed fixture tree `scripts/fixtures/unit-route/` (unit-37 dogfood ledger copied from `feat/37-phase-lint-script@e1e282c5`, route cases, the cap case). `UNIT_ROUTE_REPO` re-points the router at a fixture root; the router spawns no shell and writes nothing.
- Red-first: 14/14 fail without `scripts/unit-route.mjs`, 14/14 pass with it.
- Gate: `node --test scripts/unit-route.test.mjs` → 14 pass / 0 fail, exit 0.
- Gotchas: the route cell text is never echoed — only ids, the route name and repository paths are; the read set keeps only paths that exist under the root, so a path cited by a FOLDED row (F89 → `docs/LOGS.md`) is provably absent from the replan set.
- Files: scripts/unit-route.mjs · scripts/unit-route.test.mjs · scripts/fixtures/unit-route/** · docs/fix/224-deterministic-replan-routing/SPEC.md (P1 ticks) · progress.md
- Next: P2 — Replan entry contract

## P2 — 2026-09-15
- Phase-lint re-checked PASS (8/8) at fingerprint `P2:docs:7:replan-entry-contract`.
- Done: new internal skill `skills/replan-findings/SKILL.md` (load condition gated on the router's `route: replan` line, bounded intake, guardrails) + `references/PHASE_APPEND.md` (append contract, hardening placement, artifact-revision duty, hand-off). Conditional load wired into `skills/plan-feature/SKILL.md` (progressive-loading item 4) and `skills/plan-fix/SKILL.md` (item 7); the replan exemption added to `skills/plan-feature/references/ROUTING.md` (router runs before the status gate) and `skills/plan-fix/references/PLANNING_PROCESS.md` (router before ingest). Version bumps: plan-feature 5.1.0 → 5.2.0, plan-fix 3.1.0 → 3.2.0, each with its per-skill changelog cell in `CHANGELOG.md` + `CHANGELOG.es.md`. Budget manifest entry for `replan-findings`.
- Gate: `bun scripts/check-skill-context.mjs` → exit 0; `node --test scripts/normative-drift.test.mjs` → 16 pass / 0 fail (the version tables and package versions recompute equal).
- Gotchas: the added prose pushed plan-feature's main estimate to 2802 > 2800 and ROUTING.md to 2227 > 2200; both were compressed back under the defaults rather than raising the budget (plan-feature now 2799, ROUTING under 2200).
- Files: skills/replan-findings/SKILL.md · skills/replan-findings/references/PHASE_APPEND.md · skills/plan-feature/SKILL.md · skills/plan-feature/references/ROUTING.md · skills/plan-fix/SKILL.md · skills/plan-fix/references/PLANNING_PROCESS.md · docs/workflow/SKILL_CONTEXT_BUDGETS.json · CHANGELOG.md · CHANGELOG.es.md · docs/fix/224-deterministic-replan-routing/SPEC.md (P2 ticks) · progress.md
- Next: P3 — Class-routed machine signal

## P3 — 2026-09-15
- Phase-lint re-checked PASS (8/8) at fingerprint `P3:config/infra:3:class-routed-machine-signal`.
- Done: `scripts/workflow-status.mjs` now emits `next.suggested` (the schema field declared at `envelope.schema.json:169-175`): `readOpenRows` is shared by `readFixNow` and the new `readSuggestions`, which routes a plan-owned open row to the unit's planner (`/plan-feature <unit>` / `/plan-fix <issue>`), a plain fix-now row to `/fold-findings`, and contributes nothing when no row is open. The array is attached additively after `resolveNext`, so `recommended`/`alternatives`/`tier` are untouched. Pins: the three class outcomes in `scripts/workflow-status-sensor.test.mjs` (feature planner, fix planner, fold, none, plus schema validity) and the closed route/destination vocabulary in `scripts/normative-drift.test.mjs`.
- Gate: `node --test scripts/workflow-status-sensor.test.mjs` → 53 pass / 0 fail, exit 0; `node --test scripts/normative-drift.test.mjs` → 17 pass / 0 fail, exit 0.
- Evidence: live `node scripts/workflow-status.mjs --json-only` → `next.suggested` carries the plan-owned unit's planner command (`/plan-feature 20-runtime-guardrails-progressive-skills`, ids F18/F22/F40/F42/F43/F44) plus the `/fold-findings` entries for the plain ledgers, exit 0.
- Gotchas: the ledger is read twice per unit only if `readFixNow` and `readSuggestions` were both called — the loop calls `readSuggestions` once and the shared `readOpenRows` keeps the parse single-sourced; `findings.fix_now[]` keeps its frozen schema (`additionalProperties: false`), so the unit identity never leaks into it.
- Files: scripts/workflow-status.mjs · scripts/workflow-status-sensor.test.mjs · scripts/normative-drift.test.mjs · docs/fix/224-deterministic-replan-routing/SPEC.md (P3 ticks) · progress.md
- Next: P4 — Skills replan destination

## P4 — 2026-09-15
- Phase-lint re-checked PASS (8/8) at fingerprint `P4:docs:8:skills-replan-destination`.
- Done: every routing surface the census names now sends a plan-owned open finding through `node scripts/unit-route.mjs <unit>` and the planner its `route: replan` line names, never directly to the executor or the fold: `review-change/references/PERSIST_AND_DECIDE.md` (the `REVIEW-FAIL` block's two contradictory sub-bullets merged into one router line), `review-change/references/OUTPUT_AND_GUARDRAILS.md` (Routing), `review-implementation/references/CLASSIFY.md` (large-in-scope replan, Routing bullet, `plan`-owner row), `review-implementation/SKILL.md` (relationship), `triage-issue/SKILL.md` (diagram + prose), `triage-issue/references/REVIEW_FINDING_PROCESS.md`, `fold-findings/references/FOLD_PROCESS.md` (batch table + step 9), `fold-findings/SKILL.md` (freeze-batch + branch table). Version bumps with per-skill changelog cells EN+ES: review-change 3.5.0 → 3.5.1 (patch), review-implementation 1.7.0 → 1.8.0, triage-issue 2.7.0 → 2.8.0, fold-findings 1.4.0 → 1.5.0.
- Gate: `grep -c "unit-route"` → ≥1 on all eight files (1,1,3,1,2,1,2,2); `grep -q "^version: 3\.5\.1" skills/review-change/SKILL.md && grep -q "^| 3\.5\.1 |" CHANGELOG.md && grep -q "^| 3\.5\.1 |" CHANGELOG.es.md` → exit 0; `bun scripts/check-skill-context.mjs` → exit 0; `node --test scripts/normative-drift.test.mjs` → 17 pass / 0 fail.
- Gotchas: `review-implementation` had no `####` section; its version row lives in the `### Internal (user-invocable: false)` table, so the 1.8.0 row was added there in both languages, keeping the version-set equality check green.
- Files: skills/review-change/**, skills/review-implementation/**, skills/triage-issue/**, skills/fold-findings/**, CHANGELOG.md · CHANGELOG.es.md · docs/fix/224-deterministic-replan-routing/SPEC.md (P4 ticks) · progress.md
- Next: P5 — Tutorial destination convergence

## P5 — 2026-09-15
- Phase-lint re-checked PASS (8/8) at fingerprint `P5:docs:6:tutorial-destination-convergence`.
- Done: the three tutorial pairs route `replan-in-unit` through `node scripts/unit-route.mjs <unit>` and the planner its `route: replan` line names, with the fresh `/review-plan` before execution: `REVIEW_AND_CLASSIFY.md` (+ ES) routing bullet and "Where it sits", `FEATURE_WORKFLOW.md` (+ ES) review-step prose, `PORTABLE_PROMPT.md` (+ ES) the finding-destination sentence. EN and ES edited in the same commit.
- Gate: `grep -c "unit-route"` on the six files → 2, 2, 1, 1, 1, 1; the full AC7 census over all 14 files → ≥1 each.
- Gotchas: `PORTABLE_PROMPT.es.md` mirrors the English prompt text, so both sides carry the identical sentence (no translation drift).
- Files: docs/workflow/REVIEW_AND_CLASSIFY.md (+ ES) · docs/workflow/FEATURE_WORKFLOW.md (+ ES) · docs/workflow/PORTABLE_PROMPT.md (+ ES) · docs/fix/224-deterministic-replan-routing/SPEC.md (P5 ticks) · progress.md
- Next: P6 — Release bookkeeping

## P6 — 2026-09-15
- Phase-lint re-checked PASS (8/8) at fingerprint `P6:docs:6:release-bookkeeping`.
- Done: `docs/workflow/SKILLS.md` (+ ES) names `replan-findings` in the internal-step table and moves the internal-step count 18 → 19 (user-facing count unchanged at 19). `skills/workflow-status/references/SENSOR_SIGNALS.md` step 13 withdraws the stale "any `folded: no` row → `/fold-findings`" signal and documents the class-routed emission (plan-owned → the unit's planner, `source_skill: review-change`; any other open row → the fold). `skills/workflow-status/SKILL.md` 3.4.0 → 3.5.0. CHANGELOG.md + CHANGELOG.es.md: the `workflow-status` 3.5.0 row and the new `replan-findings` 1.0.0 row.
- Gate: `grep -q "unit-route" CHANGELOG.md && grep -q "unit-route" CHANGELOG.es.md && grep -q "replan-findings" docs/workflow/SKILLS.md && grep -q "replan-findings" docs/workflow/SKILLS.es.md` → exit 0; `bun scripts/check-skill-context.mjs` → exit 0; `node --test scripts/normative-drift.test.mjs` → 17 pass / 0 fail.
- Gotchas: the SENSOR_SIGNALS.md addition pushed that reference to 2297 est > the 2200 default; the `workflow-status` `referenceEstimateMax` was re-based to 2300 with a declared `referenceSources` note (measured 2297) rather than trimming the required signal out.
- Files: docs/workflow/SKILLS.md (+ ES) · skills/workflow-status/references/SENSOR_SIGNALS.md · skills/workflow-status/SKILL.md · docs/workflow/SKILL_CONTEXT_BUDGETS.json · CHANGELOG.md · CHANGELOG.es.md · docs/fix/224-deterministic-replan-routing/SPEC.md (P6 ticks) · progress.md
- Next: P7 — Mirror parity

## P7 — 2026-09-15
- Phase-lint re-checked PASS (8/8) at fingerprint `P7:config/infra:2:mirror-parity`.
- Done: `bun run bundle:skills` (from `packages/pi-agentic-workflow`) re-bundled 39 skills / 125 files after the last skill edit (P6), adding the mirror copy of `replan-findings/**` and refreshing the 15 touched files. Package version 0.9.2 → 0.10.0 with its changelog row in `CHANGELOG.md` + `CHANGELOG.es.md`.
- Gate: `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → 7 pass / 0 fail, exit 0 (every bundled file byte-identical to its `skills/` source); `node --test scripts/normative-drift.test.mjs` → 17 pass / 0 fail (package-versions recompute to 0.10.0).
- Files: packages/pi-agentic-workflow/skills/** · packages/pi-agentic-workflow/package.json · CHANGELOG.md · CHANGELOG.es.md · docs/fix/224-deterministic-replan-routing/SPEC.md (P7 ticks) · progress.md
- Next: P8 — Hardening & PR

## P8 — 2026-09-15
- Phase-lint re-checked PASS (8/8) at fingerprint `P8:hardening:7:hardening-pr`.
- Full gate at the executed head (all commands RUN, exit codes pasted):
  - `NODE_PATH=packages/agentic-workflow-schema/node_modules node --test scripts/*.test.mjs` → exit 0 · 282 tests, 282 pass, 0 fail.
  - `bun scripts/check-skill-context.mjs` → exit 0; `bun scripts/check-skill-context.mjs --routes` → exit 0 (`PASS route budgets: 22 routes`).
  - `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → exit 0 · 7 pass, 0 fail (mirror byte-identical).
  - `cd packages/pi-agentic-workflow && bun install --frozen-lockfile && bun run test` → exit 0 · 214 pass, 0 fail (gitignored `node_modules/` only).
  - `npx skills add . --list` → exit 0, `replan-findings` discovered.
  - `node --test scripts/unit-route.test.mjs` → 14 pass; `node --test scripts/workflow-status-sensor.test.mjs` → 53 pass; `node --test scripts/normative-drift.test.mjs` → 17 pass.
- Two gate repairs were required and are part of this phase, not silent edits:
  1. **Route ceilings re-based.** The converged prose grew four routes past their declared 10 % headroom (plan-feature:issue/scoped, plan-fix:issue, review-change:adversarial/default-backend/default-web/synthesize). Each ceiling was raised to `ceil(measured × 1.10)` with a `sources` note in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` naming fix #224 as the growth source.
  2. **A version pin was maintained.** `scripts/review-loop-discipline.test.mjs:10j` pinned `fold-findings`'s exact `version:` to 1.4.0 (feature 30's one-time contract pin). P4 bumps that skill to 1.5.0 by SPEC obligation, so the pin was advanced to 1.5.0 with the assertion unchanged in strength — a version fact, not a weakened check. `grep` over every test file found no other stale version pin.
- Pending-docs check: `git status --porcelain -- docs/` → empty (run after this phase's commit).
- Gotcha: the `docs/` pending check is a *post-commit* check; this receipt is committed with the phase, so the check runs against a clean tree.
- Files: scripts/review-loop-discipline.test.mjs · docs/workflow/SKILL_CONTEXT_BUDGETS.json · docs/fix/224-deterministic-replan-routing/SPEC.md (P8 ticks) · progress.md
- Next: flip the fix index to `done`, push, open the PR with `Closes #224`, link it.
- Close-out: fix-index row flipped to `done` and committed (`eb09fdda`), branch pushed, PR opened and printed — **https://github.com/gtrabanco/agentic-workflow/pull/225** (`Closes #224`); the row updated to `done · [#225](…)` in the link commit.
- `git status --porcelain -- docs/` was empty before the flip; `git status --porcelain` is empty after the link commit.
- Unit status: **done** (built, PR open — merge state lives in the forge).
- Next: `/review-change` (the mandatory end review), then `/fold-findings` only on `REVIEW-FAIL`, then re-run `/review-change`, then `/audit-pr` as the merge gate.

## Replan — `fix-224-artrev-0004` (2026-09-16)

- **Trigger:** `audit-pr` on PR #225 returned **BLOCKED (2 blockers)** after the
  `feat/37-phase-lint-script` merge — no `review-change` receipt at the head
  (F21) and a stale `stage: plan` receipt whose `changedPaths` is the executed
  SPEC's tick flips (F22) — plus two defects the post-merge dogfood run
  surfaced (F23, F24) and one the replan itself hit (F25).
- **Router line that licensed this write:**
  `node scripts/unit-route.mjs 224-deterministic-replan-routing` → `route: replan`,
  `next: /plan-fix 224`, `rows: F21 F22 F23 F24 F25`, `read-set (9)`.
  The bounded intake below is exactly that read set plus the cited finding rows —
  **no planning preflight** (the findings pin the scope), per
  `skills/replan-findings/SKILL.md`.
- **Appended phases:** `P9` terminal route for a finished unit (F23, F24) ·
  `P10` executed-phase lint exemption (F25) · `P11` replan path contract docs
  (F24, F25) · `P12` terminal receipt closure (F21, F22) — each closing its
  selected rows in its task text.
- **Placement — the one deviation, disclosed:** inserted **before** a re-opened
  `P8` instead of appended after it. Reason: appending the mandated fresh final
  `Hardening & PR` makes the executed `P8` non-last, and `scripts/phase-lint.mjs:653`
  keys box-3's budget **and** box-7's `gh pr` position rule off the last phase, so
  the executed phase is retro-blocked and the replan is unemittable —
  `verdict BLOCKED: lint-blocked`. Re-opening `P8` (task list byte-identical, all
  seven boxes un-ticked) satisfies the placement rule's purpose — the ledger again
  ends with an unexecuted `Hardening & PR` closing out every phase — and stays
  lintable today; `P10` repairs the linter so the next replan needs no workaround.
  Recorded in the SPEC `## Amendments` with the operator decision.
- **Phase-lint:** `node scripts/phase-lint.mjs docs/fix/224-deterministic-replan-routing/SPEC.md`
  → `verdict PASS` for `P1`–`P7`, `P9`–`P12` and the re-opened `P8`
  (8/8 each), overall fingerprint
  `751f72932d6b3c0c46af3df062824c020f049861e22eeca609c3bcf35bcc1fda`.
  Linted with the **shipped** linter (PE-011 is closed: the merge brought
  `scripts/phase-lint.mjs` onto this branch); the executor's pre-flight re-lint
  stays binding.
- **Ledgers:** findings `F21`–`F25` persisted in `review-findings.md`
  (`route: replan-in-unit`, `folded: no` — the fold cycle flips them after the
  execution); obligations `OB-12`–`OB-15` added as the owners of the four new
  normative behaviours; planning evidence unchanged (the findings ledger is the
  authority for this write, not new repository reads).
- **Acceptance re-freeze:** `AC1` amended (the `close-out` token for a finished
  unit and the bare `status` field) and `AC14` added (the executed-phase lint
  exemption). New blob
  `git hash-object docs/fix/224-deterministic-replan-routing/ACCEPTANCE.md` →
  `b89e915f33a8c49151eca65cea966b3e7e2e03e9`, recorded in the SPEC `## Status`.
  User-authorized manifest change (SPEC `## Amendments`, 2026-09-16).
- **Artifact revision:** `fix-224-artrev-0004` = `2f801ad36ee80a2fc15a5a1e3d626f48d86c73df` (the commit that carries this
  write). The write rotates the id, so the prior `stage: plan` receipt
  `rp-224-20260915-003` is void by design — only a fresh `/review-plan` restores
  currency over these bytes.
- **Gate at this write:** `node --test scripts/*.test.mjs` → 413 pass / 0 fail.
- **`git status --porcelain -- docs/`:** empty after this write's commit.
- **Next:** `/review-plan fix-224` — a fresh independent review of the re-cut
  plan; `PLAN-REVIEW-PASS` licenses `/execute-phase --fix 224` for `P9`–`P12`
  plus the re-opened `P8`.

## Pre-execution review receipt v1 — plan
- Review: rp-224-20260915-004 · Snapshot: bcde3ca15fa0f63fd16166833a3674668654715c8a89a6c13796362bbd610065 · Verdict: plan-review-fail
- Unit: fix-224 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); the contract forbids a parent on a fix plan snapshot (D30)
- Source revision: 2f801ad36ee80a2fc15a5a1e3d626f48d86c73df · Artifact revision: 2f801ad36ee80a2fc15a5a1e3d626f48d86c73df
- Reviewer: review-plan (fresh pi session) · Session: pi-web review turn on `fix/224-deterministic-replan-routing` (replan cycle 4) · Role: reviewer · Author: plan-fix (commit `2f801ad3`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: same-model · Policy: v1
- Context-clean note: this conversation wrote/replanned no part of the unit (review-only turn; the only writes are this receipt and the findings rows it emits)
- Started/finished: 2026-09-15T20:28:00Z/2026-09-15T20:35:00Z · Findings: 5 (material open: 5)
- Ledgers read: planning-evidence 15 rows (PE-001…PE-015, embedded in the SPEC) · obligations 15 rows (OB-1…OB-15, verified-capable: 11 — the OB-1…OB-11 validators ran and their evidence is recorded in the phase receipts below; the `status` cells stay `planned` and P12 task 1 owns the reconciliation)
- Prior plan receipt (re-review only): rp-224-20260915-003 @ a65783d87c171aa99e9c2db19c15a2a014256339774e426c7d267b25593f779f
- Portability note: the planner's handoff named `fix-224-artrev-0004` = `2f801ad36ee80a2fc15a5a1e3d626f48d86c73df`; the builder resolved `sourceRevision`/`artifactRevisionId` to the same 40-hex (`contentRevision` over the bound paths = the replan commit), so the label and the bound bytes agree. The schema package was present (`NODE_PATH=packages/agentic-workflow-schema/node_modules`); the authoritative validator executed, no install needed; the tree stayed clean throughout the review reads.

### Review-run evidence (commands + results)

- Snapshot build: `NODE_PATH=packages/agentic-workflow-schema/node_modules node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-224 --dir docs/fix/224-deterministic-replan-routing` → digest `bcde3ca15fa0f63fd16166833a3674668654715c8a89a6c13796362bbd610065`, schema-validated by the recipe owner (no refusal); `unitKind: fix` derived from the `docs/fix/` prefix, no `--parent` passed, `parentSpecSnapshotDigest: null` ✓. Artifacts: spec (57007 B, digest `842ef1fa…e663b`) + acceptance (6430 B, digest `e61f4819…bdc7`); both planning ledgers are embedded in the SPEC (fix contract, SPEC Decision 5, precedent fix-179) and bound through the whole-file `spec` row, so their snapshot rows are `absent` — the fix unit carries no `tasks`/`testing`/`decisions` files at all (fix contract: no separate planning artifacts), the same shape cycles 1–3 bound and the authoritative validator accepted. Contexts: `project-guide` (CLAUDE.md) + `normalized-repository-state` present and bound; `architectural-invariants` absent (`docs/architecture/` does not exist — honestly unbound). Acceptance manifest blob recomputed: `git hash-object docs/fix/224-deterministic-replan-routing/ACCEPTANCE.md` → `b89e915f33a8c49151eca65cea966b3e7e2e03e9`, equal to the value recorded in the SPEC `## Status` (`SPEC.md:728`) ✓.
- Prior-receipt staleness re-derived, never assumed: `verify --stage plan --unit fix-224 --dir docs/fix/224-deterministic-replan-routing` → `current:false`, `digestMatches:false`, `reasonCode: stale-source-revision`, `changedPaths: [ACCEPTANCE.md, SPEC.md]`, exit 4 (the replan rotation, F22). Repeat sanctioned: the snapshot changed (`a65783d8…779f` → `bcde3ca1…0065`) and the question was re-cut by the replan; no blind re-run of an identical snapshot.
- Phase-lint re-derived with the shipped linter: `node scripts/phase-lint.mjs docs/fix/224-deterministic-replan-routing/SPEC.md` → `verdict PASS`, `Phase-lint: PASS (8/8)` for P1–P7, P9–P12 and the re-opened P8, overall fingerprint `751f72932d6b3c0c46af3df062824c020f049861e22eeca609c3bcf35bcc1fda`, exit 0; every per-phase fingerprint matches the SPEC's `### Phase-lint` block (P1 6, P2 7, P3 3, P4 8, P5 6, P6 6, P7 2, P9 4, P10 3, P11 4, P12 6, P8 7 tasks). PE-011's closure is real: `scripts/phase-lint.mjs` is present on this branch.
- Citation re-verification at the bound revision `2f801ad3`: F23 reproduced live — `node scripts/unit-route.mjs 224-deterministic-replan-routing` → `status: `done` (leading backtick, the raw fix-index cell), `open-rows: 5`, `route: replan`, `next: /plan-fix 224`, `rows: F21 F22 F23 F24 F25`, `read-set (9)`, exit 0; F24 corroborated by `ROUTES` (`scripts/unit-route.mjs:36`: five tokens, no `close-out`) and the route chain (`:336-352`); F25 corroborated by `scripts/phase-lint.mjs:651-657` (`finalCloseOut = index === phases.length - 1 && HARDENING_LAYERS.has(layer)`), `:489-493` (box-3 limit 8, 10 only for `finalCloseOut`) and `:580-590` (box-7 `gh pr` fires outside `finalCloseOut`) — the append-after shape is genuinely unlintable today, so the insert-before placement is the only shape that emits now, and the workaround is disclosed in the SPEC `## Amendments` (`:718`) and the replan note (`:488-492`).
- Falsified current-state claims at the bound revision (RP-224-8): `git show 2f801ad3:docs/features/ROADMAP.md | sed -n 47p` → `done · [#212]`; `git ls-tree 2f801ad3 docs/features/ --name-only | grep 37` → `docs/features/37-phase-lint-script`; `git cat-file -e 2f801ad3:scripts/phase-lint.mjs` → present; `git show 2f801ad3:docs/features/37-phase-lint-script/review-findings.md | wc -l` → 1153 (PE-010's 1065 is pinned to `e1e282c5`, so only the HEAD-relative prose drifts).
- Obligation/scope map checks (RP-224-7/9/10/11): all 15 `| OB-` rows end `| planned |` (P12 task 1 owns their reconciliation); `grep -n "phase-contract"` over the P9–P12 bodies → no task edits `skills/phase-contract/SKILL.md` (v1.0.3; rule 3 `:43`, rule 7 `:51`, guardrail `:85`, sole-owner claim `:17`); `grep -n "phase-lint"` over the SPEC → no Scope/Impact/Rollback row for the P10 targets (`:650-659`), while `## Impact` (`:279-304`) and `## Rollback` (`:703-710`) still describe the change without the linter; `docs/fix/README.md:30` → `done · [#225](https://github.com/gtrabanco/agentic-workflow/pull/225)` with the P8 close-out receipt recording the same PR at head `a74ee351`.

### Ledger sweep L1–L6 + Engineering/fix checks

- L1 pass — the snapshot binds `parentSpecSnapshotDigest: null` and the receipt says so plainly; no invented parent (fix unit, D6/D30).
- L2 finding (RP-224-8) — PE-011 and PE-013 keep `freshness: current` while their assertions are falsified at the bound revision (the linter and unit-37's directory exist there; roadmap row 37 = `done · #212`); PE-005's "never emitted" is likewise closed by the executed P3, though its observed-revision is pinned. All other rows are `current` + `proven`/`decision`; no `unknown` without an owner.
- L3 finding (RP-224-7) — one behaviour appears twice (OB-12's "and the new route token is documented and released" repeats OB-15's release behaviour) and the phase-contract half of OB-15 has no owner, so the normative-behaviour set is both duplicated and incomplete.
- L4 finding (RP-224-7) — OB-12 names one phase and one task (P9.3) but its content spans P9 and P11; OB-15 names P11.3, whose deliverable cannot produce the row's required evidence ("the two version cells" — P11.3 adds the `replan-findings` cells only). Every other row names exactly one phase + task, owner, validator copied from `ACCEPTANCE.md`/the phase done-when, and required evidence.
- L5 finding (RP-224-11) — the scenario matrix carries no row for the replan's new failure categories (F24's finished-unit mis-route, F25's retro-blocked executed phase, F23's raw status token), and P11's named validator can pass while OB-15's phase-contract half stays undelivered.
- L6 pass — RP-224-1…RP-224-6 are all `resolved` with resolution evidence pinned to their own revisions; no `dismissed` row lacks counter-evidence; the only open material rows are the five emitted here, and `review-findings.md` F21–F25 stay `folded: no` (their fold is execution's, never this review's).
- P1 pass (surfaces named with `path:line` evidence rows; invariant posture = the `## Rules that must never be violated` list; the phase-contract sole-ownership invariant the P10 relaxation touches is not in that list — carried as RP-224-7) · P2 pass (the dependency closure is empty and correctly so; the stale ordering note in `## Depends on` is RP-224-8, not a closure defect) · P3 pass (the boundary is honest: `suggested` is already schema-declared at `envelope.schema.json:169`, the amended route vocabulary is the router's own contract and P11 documents it, `review-change`/`fold-findings` classification untouched) · P4 pass (the sanitizer owns the echoed ids/paths, OB-10/AC12, and the new terminal route adds no injection surface; no secrets/auth/PII) · P5 pass (no migration; P11.3 names both changelog languages for the `replan-findings` cell — the missing phase-contract cell is RP-224-7) · P6 finding (RP-224-9: the re-opened P8's already-satisfied/invalid tasks and unstated idempotent re-entry) · P7 finding (RP-224-10: the rollback prose no longer covers the P10 linter change) · P8 pass (the router block, the sensor's `next.suggested` and the suites observe the shipped behaviour; the terminal route's own observability is P9/P11) · P9 finding (RP-224-9: the receipt-closure phase is ordered before the head-finalizing hardening phase; the disclosed placement itself is accepted as the only currently lintable shape) · P10 pass (every done-when is a command with an expected outcome on the repo's real gates; P10 adds a corpus pair rather than deleting one — its owner-side consequence is RP-224-7) · P11 finding (RP-224-11) · P12 finding (RP-224-8 for the dependency/status claims; RP-224-10 for the stale Impact/Rollback surface) · F1 pass (the operator report and the cited gates reproduce the dead end by reading; the router supplies the missing selection, reproduced live) · F2 pass (four causes at `path:line`, the extend-the-sensor alternative recorded and ruled out in Decision 1; the replan's three post-merge defects reproduce at their cited lines) · F3 finding (RP-224-10: the linter surface P10 edits is not named in Scope/Impact/Regression) · F4 finding (RP-224-10: the same accounting gap in `## Rollback`; no fake Product-half ceremony anywhere).

### Verdict

```text
PLAN-REVIEW-FAIL — fix-224 BLOCKED
- Snapshot: bcde3ca15fa0f63fd16166833a3674668654715c8a89a6c13796362bbd610065 · Artifact revision: 2f801ad36ee80a2fc15a5a1e3d626f48d86c73df
- Failed checks: L2, L3, L4, L5, P6, P7, P9, P11, P12, F3, F4
- Findings (unioned, one row each):
  | id | severity | class | check | claim |
  |---|---|---|---|---|
  | RP-224-7 | medium | plan | L3, L4 | OB-15's phase-contract half has no executing task: no phase edits `skills/phase-contract/SKILL.md`, so the exemption P10 makes the linter skip for ticked phases is never stated by the sole rule owner and its required evidence is unreachable; OB-12 duplicates the release behaviour |
  | RP-224-8 | medium | plan | L2, P12 | `## Depends on` and PE-011/PE-013 assert unit 37 is unmerged at the bound revision while the bound tree has it merged (row 37 = `done · #212`, directory and `phase-lint.mjs` present, ledger 1153 lines) — a self-contradiction with the same revision's amendment row |
  | RP-224-9 | medium | plan | P6, P9 | The re-opened P8 is not executable/resumable at this branch state (PR #225 open, fix-index row already `done · [#225]`), and P12's end-review/merge-audit are ordered before it, so F21's "no receipt at the close-out head" can recur |
  | RP-224-10 | medium | plan | P7, P12, F3, F4 | P10 edits `scripts/phase-lint.mjs`/`.test.mjs` but Scope, Impact and Rollback still describe the change without the linter, so the regression scope and un-ship accounting omit a shared validator |
  | RP-224-11 | low | plan | L5, P11 | The scenario matrix has no row for the replan's new failure categories (F23/F24/F25) and P11's drift-test validator can pass while OB-15's phase-contract half stays undelivered |
- Repair owner: `plan-fix 224` — one batch over this whole set
- Parent state: n/a — fix unit, no Product half exists (D6); no Product lineage to go stale
```

### Self-check (POLICY §8) — pasted sensor answer

```json
NODE_PATH=packages/agentic-workflow-schema/node_modules node scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-224 --dir docs/fix/224-deterministic-replan-routing
{
  "current": false,
  "stage": "plan",
  "unit": "fix-224",
  "receipt": {
    "id": "rp-224-20260915-004",
    "verdict": "plan-review-fail",
    "snapshot": "bcde3ca15fa0f63fd16166833a3674668654715c8a89a6c13796362bbd610065",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "bcde3ca15fa0f63fd16166833a3674668654715c8a89a6c13796362bbd610065",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

`structural.fresh: true` + `digestMatches: true`; `current: false` / `exit 4` is the sanctioned form for a persisted FAIL verdict per POLICY §8 ("`exit 4`/`current: false` means a verdict persisted but not a PASS — the verdict itself is the emit result, route per verdict").

### CONVERGENCE-ANOMALY — fix-224 plan (replan re-entry)

- Finding ids: repeated: none / new: RP-224-7, RP-224-8, RP-224-9, RP-224-10, RP-224-11
- Snapshots: a65783d87c171aa99e9c2db19c15a2a014256339774e426c7d267b25593f779f → bcde3ca15fa0f63fd16166833a3674668654715c8a89a6c13796362bbd610065 (artifactRevisionId dbbd6a92f7dd5348e397ae07f8c9947e69921bb1 → 2f801ad36ee80a2fc15a5a1e3d626f48d86c73df, label `fix-224-artrev-0004`)
- Missed: the obligation map's release half (the phase-contract amendment + its version cells), the bound-revision truthfulness of `## Depends on`/PE-011/PE-013 after unit 37 merged into this branch, the terminal phase's executability once its PR already exists, and the declared surface/rollback of the P10 linter change
- Owning stage: plan
- Why the prior review/repair failed: cycle 3's PASS was correct for `artrev-0003`'s bytes, and the `audit-pr` BLOCKED verdict predates this replan; the replan added P9–P12 grounded in F21–F25 but did not re-derive the dependency section, the obligation map's release half, or the terminal phase against the branch's post-merge state, so a new material set exists on the new revision
- Route to owner: `plan-fix 224` — one repair batch over RP-224-7…RP-224-11, rotate the artifact revision, then `/review-plan fix-224` re-reviews the new snapshot

Verdict: **PLAN-REVIEW-FAIL** — 5 material open findings (4 × class `plan` medium, 1 × class `plan` low); repair owner `plan-fix 224`.

## Repair batch — `fix-224-artrev-0005` = `9cc6bf904d41737e69493f58385caae823fd2121` (2026-09-16)

- **Trigger:** plan-review cycle 2 (receipt `rp-224-20260915-004`, snapshot
  `bcde3ca15fa0f63fd16166833a3674668654715c8a89a6c13796362bbd610065`) returned
  **PLAN-REVIEW-FAIL** on the replan with RP-224-7…RP-224-11.
- **Repaired in one batch** (all five, no partial pass): the phase-contract rule
  owner now carries the executed-phase exemption plus the corpus triple
  (`OB-16`, RP-224-7); `## Depends on` and PE-011/PE-013 state unit 37's merged
  reality, re-observed at `bf88bccc` (RP-224-8); the re-opened `P8` is idempotent
  for the live PR #225 and the three receipt tasks moved out of `P12` into `P8`,
  ordered after every tick so no later write can void the plan receipt
  (RP-224-9); `### In scope`, `## Impact` and `## Rollback` declare the shared
  linter edit and its narrowed blast radius (RP-224-10); the scenario matrix
  gained S9–S11 and `S4` points at S9 for the `done` half (RP-224-11).
- **Ledgers:** the five reviewer rows are `resolved` in `planning-findings.md`
  with per-finding resolution evidence and this artifact revision.
- **Phase-lint:** `verdict PASS` with the shipped linter; overall fingerprint
  `597c922a20d352504d840cab86282fd149fbea9c636246481877650518e9a3fa`
  (`P8:hardening:10:hardening-pr`, `P11:docs:5:replan-path-contract-docs`,
  `P12:close-out:3:terminal-receipt-closure`).
- **Acceptance re-freeze:** `AC14` extended (owner-side rule statement + the
  corpus triple); blob
  `git hash-object docs/fix/224-deterministic-replan-routing/ACCEPTANCE.md` →
  `15e9661fdcafbc628419926806b27ae0532f021d`, recorded in the SPEC `## Status`.
- **Gate at this write:** `node --test scripts/*.test.mjs` → 413 pass / 0 fail.
- **Next:** `/review-plan fix-224` (cycle 3) — a fresh independent review of this
  artifact revision; `PLAN-REVIEW-PASS` licenses `/execute-phase --fix 224`.
