# 21 — workflow-contract-consolidation · progress

Last reviewed: —

## P1 — 2026-08-03

- Done: Route cost measurement — manifest `SKILL_CONTEXT_BUDGETS.json` gains 14 named routes (plan-feature:scoped/issue, plan-fix:issue, execute-phase ×5, review-change ×4, audit-pr ×2); `check-skill-context.mjs` adds `--routes/--json/--route` with byte/4 route metrics and regression checks; `check-skill-context.test.mjs` covers unknown route, JSON shape, filtered route, bare `--route`, unknown-skill, estimate and lines regressions; baselines captured in `testing.md`; per-file mode backward compatible.
- Remains: none.
- Gotchas: route estimate = `Math.ceil(Buffer.byteLength(text,'utf8')/4)`; per-file mode still prints `PASS context budgets: N skills`; script's last line has no trailing newline (pre-existing, harmless). Prior interrupted run left P1 implemented but uncommitted — reconciled now.
- Files: scripts/check-skill-context.mjs, scripts/check-skill-context.test.mjs, docs/workflow/SKILL_CONTEXT_BUDGETS.json, docs/features/21-workflow-contract-consolidation/testing.md, docs/features/21-workflow-contract-consolidation/TASKS.md, docs/features/21-workflow-contract-consolidation/progress.md
- Next: P2 — Planning contract consolidation | unit not finished

## P2 — 2026-08-04

- Done: Planning contract consolidation — new internal `planning-preflight`
  (owns the normalized repository state read and the ONE final architectural
  classification) and `phase-contract` (owns the canonical eight-box phase-lint
  and the normalized phase fingerprint); `plan-feature` (3.4.0) and `plan-fix`
  (2.5.0) consume both with one immutable planning context; internals
  `plan-feature-from-issue` (1.7.0) and `plan-feature-scaffold` (1.13.0) drop
  their duplicated invariant/lint copies; feature/fix templates and mirrors slim
  to a phase-contract pointer + `Phase-lint: PASS (8/8) · fingerprint` record
  line; `execute-phase` PREFLIGHT points at the phase contract; the three
  planning routes gain reduced regression maxima in `SKILL_CONTEXT_BUDGETS.json`;
  all route totals now sit below their captured baselines.
- Remains: none.
- Gotchas: plan-fix grew above baseline when the two new consumption paths were
  added, so ~52 bytes of prose were trimmed to land at 3145 est/222 lines below
  the 3150/225 baseline; `PLANNING_GATES.md` deleted (route resolver only pulls
  `references/`-linked files, so `../skill` links change no route membership).
- Files: skills/planning-preflight/SKILL.md (new), skills/phase-contract/SKILL.md
  (new), skills/plan-feature/SKILL.md, skills/plan-feature/references/ROUTING.md,
  skills/plan-feature/references/PLANNING_GATES.md (deleted),
  skills/plan-feature-from-issue/SKILL.md, skills/plan-feature-scaffold/SKILL.md,
  skills/plan-feature-scaffold/references/SCAFFOLD_PROCESS.md, skills/plan-fix/SKILL.md,
  skills/plan-fix/references/PLANNING_PROCESS.md, skills/plan-fix/references/SPEC_CONTRACT.md,
  docs/features/_TEMPLATE/SPEC.md, docs/fix/_TEMPLATE/SPEC.md,
  template/docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md,
  skills/execute-phase/references/PREFLIGHT.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json,
  docs/features/21-workflow-contract-consolidation/{testing,TASKS,decisions,progress}.md
- Next: P3 — Execution route consolidation | unit not finished

## P3 — 2026-08-04

- Done: Execution route consolidation (P3-1) — `WORKFLOWS.md` split into four
  per-mode resources (feature, small/phased, fix, legacy); `execute-phase`
  (2.13.1) entrypoint selects **exactly one** mode from the target artifacts
  before loading mode detail; route resolution is now route-authoritative (a
  route with a `references` object loads only the listed files); the five
  execute routes gain reduced regression maxima in `SKILL_CONTEXT_BUDGETS.json`;
  `BATCH_AND_PORTABILITY` and `ISSUE_POLICY` do not load on mode routes; the
  context-checker test suite gains per-route mode-selection fixtures. Committed
  as `5c71105` (`feat(workflow): split execute-phase workflows into per-mode routes`).
- Done: Execution policy consolidation (P3-2) — `ISSUE_POLICY.md` (8538 B)
  split into `FORGE_BODY.md` (2052 B, final-pr route), `DESCOPE.md` (1874 B,
  descope route), and `OPPORTUNISTIC_FINDING.md` (4643 B, finding route);
  `execute-phase` (2.13.2) loads exactly one policy per situation; the three
  policy routes record their required resource with reduced maxima (final-pr
  tightened 11000/740 → 9500/660 after the ~1615 est drop); policy-selection
  fixtures added; all 16 routes pass; SKILL.md main budget re-verified at
  2799 est / 177 lines.
- Done: Dependency receipt + fast path (P3-3) — `PREFLIGHT.md` gains the
  versioned **dependency receipt (v1)** and its fail-closed local fingerprint
  fast path: after a full merged pass the unit's `progress.md` records
  `Dependency receipt v1` (fingerprint + closure + merged PRs); later phases
  recompute the cheap local fingerprint (SPEC `Depends on:` line + closure
  roadmap rows only) and skip forge traversal only when the receipt is current,
  matches, records `Fully merged: yes`, and no `--force` is dated after it;
  any of a changed graph, missing/older receipt, later `--force`, or an unmet
  dependency fails closed to the full gate. Design fix: the fingerprint covers
  only locally-derivable inputs — PR identities are receipt provenance, never
  fingerprint input (else fast-path recompute could never match). The contract
  is made testable by `scripts/dependency-gate.test.mjs` (10 cases: fast path +
  every invalidation case + a `git hash-object --stdin` fidelity cross-check).
  Because PREFLIGHT loads on every execute route, the seven execute maxima in
  `SKILL_CONTEXT_BUDGETS.json` were recalibrated to the new steady state
  (feature/small 9600/670, fix 9750/670, legacy 9400/660, final-pr 9500/660,
  descope 9400/670, finding 10100/690); all 16 routes pass and stay far below
  the 13284/866 baseline.
- Done: Execution safety boxes preserved read-verified (P3-4) — every
  pre-consolidation universal safety box (11 boxes, cut at `5c71105^`) is
  preserved in the compact Turn contract and maps to exactly one unique owner
  resource that carries its normative detail. Owner map verified by reading the
  files: box 1 branch-first, 3 architectural-invariant gate, 4 gate-RUN
  (commands + exit codes), 5 git add/commit (Docs COMMITTED gate), 7 clean-tree
  → `EXECUTION_CONTRACT.md`; box 2 phase-lint pre-flight guard →
  `PREFLIGHT.md` (proxying `skills/phase-contract/SKILL.md`, the owner of the
  8-box lint rules); box 6 finishing-a-unit push + PR → `CLOSEOUT.md`; box 8
  artifact language → `FORGE_BODY.md`; box 9 descope → `DESCOPE.md`; box 10
  finding classification → `OPPORTUNISTIC_FINDING.md`; box 11 `→ Next:` block →
  `CLOSEOUT.md`. Observable behavior preserved: each of the 7 execute routes
  loads only its own mode workflow (feature/small/fix/legacy exactly one
  `WORKFLOWS_*`) and policy routes load no mode workflow, no mode route loads a
  policy file, and every execute route still PASSes on its own. Enforced by
  `scripts/check-skill-context.test.mjs` (read-verified owner map + mode/policy
  disjointness + per-route PASS); `node --test scripts/*.test.mjs` → 11 pass.
- Done: bump-skill pass over execute-phase (P3-6) — changelog rows for 2.13.2
  added to CHANGELOG.md/CHANGELOG.es.md (workflow split, policy split, versioned
  dependency receipt) plus the 2026-08-05 release-log line; all 7 authoring-rule
  lint checks pass (→ Next: block present, P1-only phase labels, Portability +
  Turn contract sections, plugin.json entry present and alphabetical,
  model-routing keys alphabetical, no internal-discovery violations). README
  cells remain accurate (no patch edit needed). Done-when gate green: both
  `execute-phase:feature` (9516/655) and `execute-phase:final-pr` (9378/646)
  pass below baseline.
- Remains: P4 — Review-to-audit boundary (see TASKS.md P4).
- Gotchas: SKILL.md step-3 conditional edit pushed the main estimate to 2863
  (over 2800); ~113 bytes of prose were trimmed (single-pass unit summary,
  PR-URL contract parenthetical, step-2 wording) to land at 2799 — only 1 est
  of headroom, so future SKILL.md edits must stay small.
- Files: skills/execute-phase/SKILL.md, skills/execute-phase/references/WORKFLOWS_FEATURE.md,
  skills/execute-phase/references/WORKFLOWS_SMALL_PHASED.md,
  skills/execute-phase/references/WORKFLOWS_FIX.md, skills/execute-phase/references/WORKFLOWS_LEGACY.md,
  skills/execute-phase/references/WORKFLOWS.md (deleted),
  skills/execute-phase/references/FORGE_BODY.md (new),
  skills/execute-phase/references/DESCOPE.md (new),
  skills/execute-phase/references/OPPORTUNISTIC_FINDING.md (new),
  skills/execute-phase/references/ISSUE_POLICY.md (deleted),
  skills/execute-phase/references/PREFLIGHT.md,
  docs/workflow/SKILL_CONTEXT_BUDGETS.json, scripts/check-skill-context.mjs,
  scripts/check-skill-context.test.mjs (P3-4 blocks), scripts/dependency-gate.test.mjs (new),
  docs/features/21-workflow-contract-consolidation/{testing,decisions,progress}.md
- Next: P4 — Review-to-audit boundary | unit not finished
