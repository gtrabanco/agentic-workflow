# 21 — workflow-contract-consolidation · decisions

## 2026-08-04 — Product design

- The feature is one cohesive unit with at most five atomic phases.
- Completing the current capability takes precedence over minimizing elapsed
  review time or issue count cosmetics.
- Review cannot defer in-scope or implicit-completeness gaps, create follow-up
  issues, or decide a new trade-off/wontfix outcome.
- `review-change --merge` is removed and fails closed; `--synthesize` names
  findings-table fusion without merge semantics.
- Final review evidence is a SHA-bound PR comment, not a committed report file,
  so the receipt does not invalidate its own reviewed SHA.
- Audit consumes current review evidence and owns delivery/merge readiness; it
  does not repeat diff-quality review.
- Repeated checks remain only when their underlying state can change; otherwise
  snapshots, fingerprints, and exact-SHA receipts carry evidence forward.
- The project has no root `docs/CAPABILITIES.md`, repository-state artifact, or
  project-specific architectural-invariant document. The SPEC therefore records
  a derived workflow capability inventory and the compatible `n/a` outcomes.

## 2026-08-04 — Route arrays vs reality (P2)

- The planned approach expected new internal contracts to be added to route
  `skills` arrays in `SKILL_CONTEXT_BUDGETS.json`. Reality contradicted the
  plan: adding them would inflate route estimates above the baselines captured
  in `testing.md`, so the `skills` arrays are left unchanged and the internal
  contracts are instead linked from routers via `(../planning-preflight/SKILL.md)`
  / `(../phase-contract/SKILL.md)` — the route resolver only pulls
  `references/`-linked files into route totals, so these links change no route
  membership.
- The three planning routes carry reduced regression maxima (set below their
  captured baselines): `plan-feature:scoped` 3346/258, `plan-feature:issue`
  5221/398, `plan-fix:issue` 3145/222. Execute/review/audit routes stay `null`
  until P3/P4 assign them maxima.

## 2026-08-04 — Mode routes vs reality (P3-1)

- The planned approach expected a single conditional `WORKFLOWS.md` loaded only
  when the target artifacts require mode detail. Reality contradicted the plan:
  the load condition is the route itself, not an artifact check, so the four
  per-mode workflows (`WORKFLOWS_FEATURE.md`, `WORKFLOWS_SMALL_PHASED.md`,
  `WORKFLOWS_FIX.md`, `WORKFLOWS_LEGACY.md`) are declared directly as the mode
  route references; route resolution became route-authoritative.
- `BATCH_AND_PORTABILITY` and `ISSUE_POLICY` do not load on mode routes; the
  `final-pr` close-out route carries `ISSUE_POLICY` instead of a mode workflow.
- The five execute routes carry reduced regression maxima (below the 13284/866
  baseline): feature 9500/660, small 9500/660, fix 9700/660, legacy 9300/650,
  final-pr 11000/740.

## 2026-08-04 — Policy resources vs reality (P3-2)

- `ISSUE_POLICY.md` (8538 B) was one mixed policy blob loaded on the final-pr
  route; the P3-2 plan split it into three independently loaded resources. The
  `execute-phase` entrypoint now loads **exactly one** policy per situation:
  forge body → `FORGE_BODY.md` (final-pr route), descope → `DESCOPE.md`
  (descope route), out-of-scope work → `OPPORTUNISTIC_FINDING.md` (finding
  route). The three policy routes each record their required policy resource.
- Replacing ISSUE_POLICY (2135 est) with FORGE_BODY (513 est) dropped final-pr
  to 9071/621, so its maxima were tightened from 11000/740 to 9500/660; the new
  descope (9027/631) and finding (9719/655) routes got 9500/660 and 9800/680.

## 2026-08-04 — Dependency receipts vs reality (P3-3)

- The P3-3 plan added a versioned dependency receipt so later phases skip forge
  traversal. Implementation landed the contract in `PREFLIGHT.md` (the
  dependency-gate owner, loaded on every execute route): the unit's `progress.md`
  records `Dependency receipt v1` after a full merged pass; later phases
  recompute a cheap local fingerprint and fail closed to the full gate on any of
  a changed graph, missing/older receipt, later `--force`, or unmet dependency.
- **Fingerprint inputs are local-only.** The first draft hashed the SPEC line,
  roadmap rows, *and* merged PR identities — but the fast path has no forge
  access to re-derive PR identities, so the recompute could never match. Fixed:
  the fingerprint covers only the SPEC `Depends on:` line and the closure
  roadmap rows (which already encode the merged PR, e.g. `22-other #7 @ a1b2c3
  merged`); PR identities stay in the receipt as provenance.
- The receipt contract permanently grows PREFLIGHT (~1100 B, ~270 est / ~23
  lines on every execute route). Rather than trimming the fail-closed detail
  below the SPEC's testable-invalidation requirement, the seven execute maxima
  were recalibrated once to the new steady state (feature/small 9600/670, fix
  9750/670, legacy 9400/660, final-pr 9500/660 unchanged, descope 9400/670,
  finding 10100/690). All routes stay far below the 13284/866 baseline; future
  regressions are still caught against these maxima.
- The contract is testable: `scripts/dependency-gate.test.mjs` (10 cases) models
  the fingerprint and fast-path logic, cross-checks the git blob hash against
  `git hash-object --stdin`, and asserts every invalidation case fails closed.

## 2026-08-04 — Owner map for the 11 safety boxes (P3-4)

- The pre-consolidation universal execution checklist (11 boxes at `5c71105^`)
  had no single authority; each box lived inline in the old monolithic
  entrypoint. P3-4 fixes that by designating, per box, exactly one owner
  resource whose normative detail the box points to, while the box line stays
  resident in the compact Turn contract (preservation). Owner assignments:
  `EXECUTION_CONTRACT.md` owns branch-first, architectural-invariant gate,
  gate-RUN, git-add/commit, and clean-tree; `PREFLIGHT.md` owns the phase-lint
  pre-flight guard (proxying `skills/phase-contract/SKILL.md`, the owner of the
  8-box lint rules); `CLOSEOUT.md` owns finishing-a-unit push + PR and the
  `→ Next:` block; `FOLDING.md` owns the clean-tree check; `FORGE_BODY.md` owns
  artifact language; `DESCOPE.md` the descope guard; `OPPORTUNISTIC_FINDING.md`
  finding classification.
- "Unique owner" means one owner per box, not one box per owner — several boxes
  legitimately share `EXECUTION_CONTRACT.md`. The fixture enforces the 1:1 box
  mapping and that every owner exists and carries its marker (read-verified:
  the test reads the actual files, never assumes).
- No SKILL.md prose change was needed: the box lines were already identical to
  the pre-consolidation checklist, so P3-4 is pure verification + fixtures
  (`scripts/check-skill-context.test.mjs` owner-map + observable-behavior
  blocks),   leaving the 2799/177 main budget untouched.

## 2026-08-07 — Turn Contract ownership redesign

- The interrupted P5 follow-up identified fifteen workflow skills that still
  carry inline `## Turn contract` copies. This is an incomplete part of feature
  21, not a new feature: replan it on the existing feature folder, branch, and
  PR.
- `skills/orchestration-envelope/references/TURN_CONTRACT.md` is the one
  authority for the existing eleven boxes. The redesign preserves those boxes
  unchanged and makes the owner SKILL.md link the resource; a missing resource
  remains a STOP, never an inline fallback.
- Each migrated skill retains only its unique verification rules in the
  semantically relevant linked reference. If no suitable reference exists, add
  one for those additions rather than leaving an inline duplicate.
- The user selected patch semver bumps for every changed skill. `bump-skill`
  remains responsible for synchronized changelog/readme distribution updates.

## 2026-08-07 — P1 gate reconcile (execute 21 P1)
- Reality vs plan: `scripts/check-skill-context.test.mjs` (P1-extended) asserted 11 ✓ boxes inside `execute-phase/SKILL.md` and owner markers; after canonical consolidation the boxes live only in `orchestration-envelope/references/TURN_CONTRACT.md` and some normative detail moved. Updated test source + box phrases + markers so P1 done-when (`test && --routes`) passes while preserving the read-verified intent. Recorded per "when reality contradicts the plan" rule; no TASKS change needed (all boxes already checked, evidence now green).
- No architecture change; P1 scope (route measurement + its test) only.
