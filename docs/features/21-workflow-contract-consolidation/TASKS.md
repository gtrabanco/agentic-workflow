# 21 — workflow-contract-consolidation · TASKS

Run every command from the repository root. `read-verified` tasks require the
named contract comparison and cited file evidence in `testing.md`.

## P1 — Route cost measurement

- [x] Extend the context-budget manifest with named, ordered composed routes
      for planning, fix planning, execution modes, review modes, and feature/fix
      audit.
      Check: `node scripts/check-skill-context.mjs --routes --json` parses and
      lists every route named in SPEC Acceptance criterion 1.
- [x] Compute each route from unique files using the existing deterministic
      byte/4 metric; report fixed instructions separately from target-project
      context.
      Check: `read-verified` against the manifest metric and stable JSON shape.
- [x] Reject structurally invalid route declarations and route-budget
      regressions.
      Check: `node scripts/check-skill-context.test.mjs` covers all five
      failures and exits 0.
- [x] Capture the pre-change baseline totals in `testing.md` before any hot
      route is rewritten.
      Check: `grep -q "Baseline route estimates" docs/features/21-workflow-contract-consolidation/testing.md`.
- [x] Keep the existing per-file budget CLI and tests backward compatible.
      Check: `node scripts/check-skill-context.mjs --skill execute-phase --skill review-change --skill audit-pr` exits 0.
  Done-when: `node scripts/check-skill-context.test.mjs && node scripts/check-skill-context.mjs --routes` → both exit 0.

## P2 — Planning contract consolidation

- [x] Add internal `planning-preflight` as the single normalized-state and
      final architectural-planning gate used by `plan-feature` and `plan-fix`.
      Check: `grep -q "name: planning-preflight" skills/planning-preflight/SKILL.md`.
- [x] Add internal `phase-contract` as the single eight-box phase-lint owner,
      with fixed PASS/BLOCKED output and a normalized phase fingerprint.
      Check: `grep -q "name: phase-contract" skills/phase-contract/SKILL.md`.
- [x] Refactor `plan-feature` and its internals to pass one immutable planning
      context containing the roadmap snapshot and optional issue payload.
      Check: route fixtures assert one roadmap snapshot and at most one issue fetch.
- [x] Keep scaffold as the sole roadmap writer and post-write verifier.
      Check: the planning fixture records exactly one post-write roadmap read.
- [x] Refactor `plan-fix` to consume the shared planning/phase contracts while
      preserving root-cause, risk, rollback, observability, local branch,
      commit, no-push, and no-PR behavior.
      Check: `read-verified` against the old/new turn contracts and fix fixture.
- [x] Slim feature/fix templates and mirrors so generated SPECs keep instance
      criteria, phase tasks, contract version/fingerprint, and results without
      duplicating authoring tutorials or the eight lint rules.
      Check: all eight invalid-phase fixtures fail identically in planner and
      executor paths.
- [x] Run `bump-skill` for every planning/internal skill changed in this phase
      and update the relevant migration/template surfaces.
      Check: `node scripts/check-skill-context.mjs --routes --route plan-feature:scoped --route plan-fix:issue` exits 0 below baseline.
  Done-when: `node scripts/check-skill-context.mjs --routes --route plan-feature:scoped --route plan-fix:issue` → both routes pass reduced maxima.

## P3 — Execution route consolidation

- [x] Split `WORKFLOWS.md` into feature, small/phased, fix, and legacy resources;
      select exactly one before loading mode detail.
      Check: route fixtures record one selected workflow resource per mode.
- [x] Split `ISSUE_POLICY.md` into forge-body, descope, and opportunistic-finding
      resources with independent load conditions.
      Check: final-PR, descope, and finding fixtures each record only their
      required policy resource.
- [x] Add the versioned dependency receipt and its fail-closed local fingerprint
      fast path for later phases.
      Check: dependency fixtures cover fast path plus every invalidation case.
- [x] Preserve the existing universal execution safety boxes in the compact
      Turn contract.
      Check: `read-verified` maps every previous safety box to its unique owner.
- [x] Preserve route-specific observable behavior without loading its contract
      on unrelated routes.
      Check: existing and new execute fixtures pass with unchanged observable outcomes.
- [x] Run `bump-skill` for `execute-phase` and synchronize its docs/migration
      surfaces.
      Check: `node scripts/check-skill-context.mjs --routes --route execute-phase:feature --route execute-phase:final-pr` exits 0 below baseline.
  Done-when: `node scripts/check-skill-context.mjs --routes --route execute-phase:feature --route execute-phase:final-pr` → both routes pass and execution fixtures are green.

## P4 — Review-to-audit boundary

- [x] Replace `review-change --merge` and `ADVERSARIAL_MERGE.md` with
      `--synthesize`/synthesis terminology; legacy `--merge` returns the fixed
      no-mutation migration refusal.
      Check: Acceptance criterion 2 command passes and negative merge fixtures
      observe zero merge calls.
- [x] Assign every review concern to one owning pass; make `review-debt` a
      synthesized-table transform and `review-implementation` the one
      scope/classification engine rather than duplicate diff scanners.
      Check: overlap fixture emits each seeded finding once with no missing axis.
- [x] Implement the current-unit classification contract defined by Product
      decisions D2 and D3.
      Check: classification fixtures cover every scope category in AC 10–12.
- [x] Load only the short recommendation checklist on default review, the full
      setup on adversarial review, and only fusion detail on synthesis.
      Check: named review route budgets and load traces match their route manifests.
- [x] Post the idempotent exact-SHA final `REVIEW-PASS` receipt through
      `--body-file`; keep FAIL findings in the fold ledger and use
      `NEEDS-DECISION` without issue creation.
      Check: fake-forge receipt suite covers PASS/FAIL/stale/idempotent/no-PR.
- [x] Refactor `audit-pr` to consume the current receipt and own only the
      delivery gates listed in the SPEC.
      Check: audit fixtures prove current receipt consumption and stale/missing
      receipt blocking without invoking review passes.
- [x] Update downstream consumers only where they use renamed decisions, flags,
      reports, or routing; bump every changed skill.
      Check: repository search finds no active legacy flag/decision vocabulary
      outside migration/refusal text.
  Done-when: `node scripts/check-skill-context.mjs --routes --route review-change:default-backend --route audit-pr:feature` → both routes pass and review/audit fixtures are green.

## P5 — Hardening & PR

- [x] Run the repository verification matrix defined in `testing.md`; record
      commands and exit codes there.
- [x] Record before/after proxy totals for every hot route and explain any route
      that did not decrease; no coverage-related file may be omitted to improve
      the number.
- [x] Run the executor-path golden fixture with the weakest available
      tool-capable model and record every required assertion from AC 17.
- [x] Synchronize every versioned, migration, workflow, template, and bilingual
      documentation surface required by AC 16.
- [x] Run the complete local close-out command set from AC 18.
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push
  Done-when: `node scripts/check-skill-context.test.mjs && node scripts/check-skill-context.mjs && npx skills add . --list` → all exit 0 with golden evidence recorded.
