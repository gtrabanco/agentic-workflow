# 21 — workflow-contract-consolidation

## Goal

Reduce the repeated instruction and repository context paid by the most-used
workflow skills while preserving their weak-model safeguards, and restore a
strict complete-feature flow in which `review-change` owns diff quality,
in-scope findings are completed in the current unit, and only `audit-pr` owns
the final merge-readiness verdict.

## Branch

`feat/21-workflow-contract-consolidation`

## Size

`L` — the change revises the shared contracts and progressive routes of
planning, execution, review, audit, templates, and their regression fixtures.
It remains one cohesive feature because every change serves one pipeline-level
invariant: each fact or decision has one owner and later stages consume its
evidence instead of repeating its work.

## Dependencies

No hard dependencies. The feature builds on the already-merged progressive
loading, normalized repository state, architectural invariants, finding ledger,
adversarial review, and runtime merge-guard features (17–20).

---

## Product half

### Context

The workflow accumulated defensive repetition after weaker models skipped
close-out duties, invented merge authorization, or downgraded findings to end a
unit early. Some repetition is a necessary stage boundary, but much of it now
causes the same turn to reload every mode, re-read the same roadmap or issue,
scan the same diff through overlapping review axes, or re-evaluate evidence that
the immediately preceding stage already produced.

The most damaging behavioral drift is not token cost: `review-change` can label
work required by the current feature as `postpone`, `tradeoff`, `wontfix`, or a
new issue. That makes a unit look finished while exporting its completeness into
an expanding backlog. The intended outcome is a complete feature, not a short
review followed by several new issues. A large in-scope correction may require
new phases, but it remains in the current SPEC, branch, and PR.

The `--merge` name inside adversarial review also collides with repository/PR
merge semantics. Review synthesis must never expose an ambiguous merge-shaped
entry point or emit merge-readiness language.

After P5, interrupted in-branch work exposed a remaining source of drift: the
fixed `## Turn contract` checklist remains copied inline in fifteen workflow
skills. The canonical eleven-box resource already exists, and three skills
already load it, but the owner skill does not yet link the resource and the
remaining copies prevent a single, reachable authority. This redesign completes
that ownership consolidation without changing any checklist behavior.

### Business goals

- Lower the fixed context cost paid on every planned and executed feature.
- Make small-model compliance easier through shorter, single-owner contracts.
- Finish the capability promised by the current feature instead of multiplying
  follow-up issues.
- Prevent review or adversarial synthesis from being interpreted as merge
  permission.
- Preserve the independent final delivery gate and every safety property that
  protects branch, CI, traceability, scope, and explicit architectural decisions.
- Give every migrated workflow skill one reachable canonical Turn Contract while
  retaining its unique verification rules in the semantically relevant resource.

### Scope

#### In scope

- Measure mandatory route cost for the hot feature/fix workflow, not only the
  size of individual files. (AC 1, AC 17)
- Split `execute-phase` resources so one invocation loads only its selected
  mode and only the forge, descope, finding, folding, or portability policy it
  actually needs. (AC 6, AC 7)
- Reuse one roadmap/issue snapshot across `plan-feature` and its composed
  internals; assign one final architectural planning gate; share the applicable
  planning preflight with `plan-fix`. (AC 3, AC 4)
- Establish one canonical phase contract and remove authoring tutorials and
  duplicated lint prose from generated unit SPECs while preserving executable
  lint checks and weak-model failure blocks. (AC 5)
- Replace `review-change --merge` with unambiguous synthesis terminology and
  fail closed on the legacy flag. (AC 2)
- Give each `review-*` axis exclusive finding ownership; classify once after
  synthesis instead of rescanning the diff through a broad duplicate engine.
  (AC 9)
- Make `review-change` the sole owner of diff quality, SPEC completeness,
  invariant preservation, and manual-verification discovery. (AC 9, AC 11)
- Make every current-unit or implicit-completeness gap `fix-now` or
  `replan-in-unit`; prohibit reviewer-created `postpone`, `tradeoff`, `wontfix`,
  or new-issue escapes for that work. (AC 10, AC 12)
- Batch genuinely unrelated future-capability proposals without automatically
  opening issues; user approval remains required before any backlog growth.
  (AC 12)
- Publish a compact SHA-bound final-review receipt that `audit-pr` consumes
  instead of re-running review axes or remapping the diff to the SPEC. (AC 11,
  AC 13)
- Limit `audit-pr` to delivery completeness, receipt freshness, CI,
  mergeability, traceability, closure/descope, and its SHA-bound
  `MERGE-READY | BLOCKED` verdict. (AC 13, AC 14)
- Remove full feature/fix template reads and review-quality re-litigation from
  `audit-pr`. (AC 14)
- Update versions, migration guidance, bilingual workflow docs, context budgets,
  and weak-model golden fixtures for every changed contract. (AC 16, AC 17,
  AC 18)
- Finish canonical Turn Contract ownership: link
  `skills/orchestration-envelope/references/TURN_CONTRACT.md` from its owner,
  and migrate `audit-docs`, `audit-pr`, `bump-skill`,
  `discover-repository-state`, `fold-findings`, `generate-docs`,
  `init-workspace`, `log-session`, `plan-feature`, `plan-fix`, `product-audit`,
  `resolve-repository-state`, `ship-roadmap`, `triage-issue`, and
  `workflow-status` from inline copies to that resource. Each skill retains its
  unique checks in the semantically relevant reference, creating one only when
  the skill has no appropriate reference resource. (AC 19, AC 20)
- Verify the migrated reference graph and progressive context budgets, then make
  a patch release of every changed skill through `bump-skill`. (AC 21, AC 22)

#### Out of scope / non-goals

- Removing the mandatory final `review-change` or the final `audit-pr` stage.
- Reducing review coverage, weakening exact-SHA/CI checks, or trusting a stale
  receipt after any branch change.
- Changing the sole automated merge authority of an active
  `ship-roadmap --fullauto` run or weakening the direct-merge runtime guard.
- Making `review-change`, an internal reviewer, or `audit-pr` merge a PR.
- Automatically creating issues for review findings or introducing an issue
  quota as a substitute for correct scope classification.
- Reworking `product-audit`, `audit-docs`, `triage-issue`, or application-specific
  review axes beyond the integrations required by the new contracts.
- Provider billing instrumentation or claims that the deterministic byte/4
  proxy equals billed tokens.
- Retrofitting historical feature folders or renumbering prior findings.
- Weakening, removing, or changing the eleven fixed boxes in the canonical Turn
  Contract, changing the machine-envelope schema, or changing workflow
  authority/behavior as part of this migration.

### Capability closure

#### Entity: route-cost manifest

| Operation | Resolution | UI | Command/API | Test |
|---|---|---|---|---|
| Create | in-scope | route-cost report | context checker reads route declarations | route fixture computes every hot path |
| Read/list | in-scope | before/after table in `testing.md` | deterministic JSON/CLI output | manifest parse and stable totals |
| Update | in-scope | changed-route result | edit route composition, not measured output | stale/missing route fixture fails |
| Delete | n/a: hot routes remain measurable | n/a | n/a | n/a |
| State transitions | baseline → optimized measurement | feature evidence | checker invocation | before/after comparison is lower without omitted gates |

#### Entity: review finding

| Operation | Resolution | UI | Command/API | Test |
|---|---|---|---|---|
| Create | in-scope | synthesized review table | unique owning `review-*` pass | overlapping-axis fixture emits one finding |
| Read/list | in-scope | one classified table | `review-change` synthesis | every finding has scope and owner |
| Update | in-scope | `fix-now` / `replan-in-unit` / proposal / false-positive / decision-required | classifier runs once after synthesis | in-scope downgrade attempts fail |
| Delete | n/a: fusion may dedupe but never silently drop | n/a | provenance-preserving dedupe | one-reviewer finding survives synthesis |
| State transitions | found → scoped → fixed/folded or user decision | review and fold reports | existing unit ledger | no current-unit finding becomes a new issue |

#### Entity: final-review receipt

| Operation | Resolution | UI | Command/API | Test |
|---|---|---|---|---|
| Create | in-scope | PR comment written through `--body-file` | SHA-bound `REVIEW-PASS` marker | fake-forge fixture posts exact marker |
| Read/list | in-scope | audit evidence row | `gh pr view --json comments` or forge equivalent | audit accepts current-head receipt |
| Update | n/a: receipts are immutable; a new head gets a new receipt | n/a | newest matching marker wins | stale receipt is ignored |
| Delete | n/a: durable audit history is retained | n/a | n/a | n/a |
| State transitions | absent/stale → current → invalidated by commit | review/audit report | head SHA comparison | any later commit blocks audit until re-review |

#### Entity: PR audit verdict

| Operation | Resolution | UI | Command/API | Test |
|---|---|---|---|---|
| Create | in-scope | `MERGE-READY | BLOCKED` report/comment | `audit-pr` only | repository-wide ownership assertion |
| Read/list | in-scope | full PR URL + audited SHA | forge PR/comments | idempotent same-SHA lookup |
| Update | n/a: verdicts are immutable and head-bound | n/a | re-audit creates a new verdict | old SHA never passes |
| Delete | n/a: historical evidence remains | n/a | n/a | n/a |
| State transitions | review-ready → audited → merge-ready/blocked | fixed audit output | delivery gates | no review command emits merge readiness |

#### Entity: canonical Turn Contract reference

| Operation | Resolution | UI | Command/API | Test |
|---|---|---|---|---|
| Create | in-scope | one canonical checklist resource | owner reference file | owner file exists and is linked from its SKILL.md |
| Read/list | in-scope | each migrated skill's Turn Contract section | canonical link plus semantic additions link | checker resolves every reference and no named skill retains an inline copy |
| Update | in-scope: only the owner changes shared boxes | owner resource and semantic per-skill references | explicit owner/additions links | migration fixture preserves every skill-specific verification |
| Delete | n/a: the shared checklist is required | n/a | missing resource stops | missing-reference checker failure |
| State transitions | inline copies → canonical link plus semantic additions → checker-verified | skill contract surface | context checker and budgets | all migrated skills resolve with no budget regression |

#### Capability role matrix

Every workflow role is listed for every capability; `allowed` means the role
owns or may invoke the capability, not that it may bypass its contract.

| Capability | Maintainer | Planner agent | Executor agent | Reviewer agent | Auditor agent | External orchestrator |
|---|---|---|---|---|---|---|
| Define route budgets/contracts | allowed | denied | denied | denied | denied | read-only |
| Produce feature/fix plans | allowed | allowed | denied | denied | denied | invoke-only |
| Execute and fold current-unit work | allowed | denied | allowed | denied | denied | invoke-only |
| Find and classify review findings | allowed | denied | denied | allowed | denied | invoke-only |
| Create backlog issues from review | user-approved only | denied | denied | denied | denied | denied |
| Emit final `REVIEW-PASS` receipt | denied | denied | denied | allowed | denied | invoke-only |
| Emit `MERGE-READY | BLOCKED` | denied | denied | denied | denied | allowed | invoke-only |
| Merge a PR | allowed, manual | denied | denied | denied | denied | allowed only inside active `ship-roadmap --fullauto` authority |
| Own/load canonical Turn Contract | allowed | read-only | read-only | read-only | read-only | read-only |

#### Integration closure

Derived inventory because this repository has no root `docs/CAPABILITIES.md`.

| Subsystem | Resolution | Acceptance pointer |
|---|---|---|
| Normalized repository state | preserve: optional frozen evidence remains authoritative when present | AC 18 |
| Architectural invariants | preserve: review owns final classification; audit consumes exact-SHA evidence | AC 11, AC 13 |
| Roadmap state machine | in-scope: one snapshot and one post-write row verification | AC 3 |
| Feature planning | in-scope: remove same-turn duplicate reads/gates | AC 3, AC 4 |
| Fix planning | in-scope: reuse the planning preflight and phase contract | AC 4, AC 5 |
| Phase execution/handoff | in-scope: route-specific loading and cached immutable prerequisites | AC 6–AC 8 |
| Internal review pack | in-scope: one owner per axis, classify once | AC 9, AC 10 |
| Finding ledger/fold cycle | preserve: current-unit work remains fix-now until folded | AC 10, AC 12 |
| PR review evidence | in-scope: durable SHA-bound final-review receipt | AC 11 |
| PR audit and merge authority | in-scope: delivery-only audit; merge authority unchanged | AC 13–AC 15 |
| Workflow sensor/orchestration | preserve: routes consume the renamed review state and audit verdict | AC 15 |
| Forge Markdown handling | preserve: comments/bodies use files, never ambiguous shell text | AC 2, AC 11 |
| Templates and distribution | in-scope: slim generated artifacts and migrate the renamed flag | AC 5, AC 16 |
| Context budget tooling | in-scope: measure composed routes and enforce regression limits | AC 1, AC 17 |
| Bilingual documentation/versioning | in-scope: EN/ES and per-skill semver stay synchronized | AC 16 |
| Golden-fixture verification | in-scope: weak-model behavior and no-merge/no-deferral failures are exercised | AC 17 |
| Envelope schema package | n/a: no machine-envelope field change is required | n/a |
| Skill reference reachability | in-scope: owner and migrated skills link only canonical/shared and semantic additions resources | AC 19, AC 21 |
| Progressive context budgets | in-scope: migration preserves reachable route budgets | AC 21 |
| Skill version/changelog distribution | in-scope: every changed skill receives a patch bump and synchronized changelog rows | AC 22 |

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | A normal review never loads the full adversarial orchestration contract | in-scope | AC 9 |
| 2 | Adversarial synthesis cannot be interpreted as merging a branch or PR | in-scope | AC 2, AC 15 |
| 3 | A required current-feature correction cannot be postponed into a new issue | in-scope | AC 10, AC 12 |
| 4 | Large in-scope fixes can add phases without changing unit/branch/PR identity | in-scope | AC 12 |
| 5 | Audit never claims quality was reviewed when the receipt is absent or stale | in-scope | AC 11, AC 13 |
| 6 | Review coverage remains complete after duplicate passes are removed | in-scope | AC 9, AC 17 |
| 7 | Feature and fix flows share safety contracts without becoming one ambiguous skill | in-scope | AC 4, AC 5 |
| 8 | Every execute invocation loads one workflow mode rather than all modes | in-scope | AC 6 |
| 9 | Creating a PR body does not load descope and opportunistic-finding policy | in-scope | AC 7 |
| 10 | Merged dependencies are not transitively reconstructed on every later phase | in-scope | AC 8 |
| 11 | Generated SPECs contain decisions and tasks, not repeated authoring tutorials | in-scope | AC 5 |
| 12 | Current branch, remote state, CI, traceability, closure, and descope remain fail-closed | in-scope | AC 13, AC 18 |
| 13 | Legacy `--merge` usage fails with a safe migration message rather than an alias | in-scope | AC 2 |
| 14 | Examples and portability detail do not load on supported normal routes | in-scope | AC 1, AC 16 |
| 15 | Before/after context savings are measured rather than claimed | in-scope | AC 1, AC 17 |
| 16 | Provider-specific billing telemetry is added | out-of-scope | Non-goals: deterministic proxy only |
| 17 | A missing canonical or skill-specific Turn Contract reference is tolerated | out-of-scope | AC 19, AC 21: missing reference stops |
| 18 | Shared Turn Contract boxes are changed while removing copies | out-of-scope | Non-goals; D11 |
| 19 | A migrated skill loses its unique close-out verification rules | out-of-scope | AC 20; semantic additions preserve them |
| 20 | Context budgets are assumed unchanged after reference migration | in-scope | AC 21 |
| 21 | Version/changelog updates are deferred because the behavior is preserved | out-of-scope | AC 22; patch bump required |

### Acceptance criteria

1. **command + read-verified:** `node scripts/check-skill-context.mjs` exits 0 and a committed hot-route
   report records reproducible before/after proxy totals for `plan-feature`,
   `plan-fix`, each `execute-phase` mode, default/adversarial `review-change`,
   and feature/fix `audit-pr`.
2. **command + read-verified:** `grep -Rni -- '--merge' skills/review-change docs/workflow | grep -v 'legacy.*reject\|migration'`
   returns no active review flag, `--synthesize` is the only direct fusion
   entry point, and invoking legacy `--merge` returns a fixed refusal without
   executing forge or git mutation commands.
3. **read-verified:** A `plan-feature` fixture proves one issue payload and one roadmap snapshot
   are reused through routing and composed internals, with exactly one
   post-write verification of the changed roadmap row.
4. **read-verified:** `plan-feature`, `plan-feature-from-issue`, `plan-feature-scaffold`, and
   `plan-fix` consume one planning preflight whose final architectural decision
   is taken only after the complete engineering plan exists.
5. **read-verified:** Feature/fix templates and generated SPEC fixtures contain one canonical
   phase-contract pointer/result rather than duplicated Phase-lint/tutorial
   prose, while planner and executor fixtures still fail the same eight invalid
   phase shapes.
6. **read-verified:** Feature, small/phased, fix, and legacy `execute-phase` fixtures each load
   only their selected workflow resource and preserve their existing STOP,
   commit, handoff, and final-PR contracts.
7. **read-verified:** A final-PR fixture loads forge-body policy without loading descope or
   opportunistic-finding policy; finding and descope fixtures load only their
   respective policies.
8. **read-verified:** P2+ execution with an unchanged dependency fingerprint does not rebuild the
   transitive closure; a changed `Depends on`, roadmap dependency row, or
   forced/unmet snapshot invalidates the receipt and reruns the full gate.
9. **read-verified:** Every default applicable review axis has exactly one finding owner; default
   review does not load the full adversarial setup; all removed duplicate axes
   remain covered by a named checklist and a golden-fixture case.
10. **read-verified:** Any finding mapped to an acceptance criterion, phase task, correctness,
    security, accessibility, required UX state, documented invariant, or a
    competent-user expectation necessary for an in-scope capability is
    classified `fix-now` or `replan-in-unit`; no reviewer-created
    `postpone`, `tradeoff`, `wontfix`, `disputed`, or new issue is permitted.
11. **read-verified:** A final `REVIEW-PASS` posts one idempotent PR comment through `--body-file`
    with reviewed HEAD SHA, scope, criterion evidence, invariant result,
    manual checks, and zero open current-unit findings; any later commit makes
    it stale.
12. **read-verified:** A finding too large to fold remains `fix-now`, gains user-confirmed phases
    in the same SPEC/branch/PR, and never routes to `plan-fix` or a new issue;
    only a genuinely independent future capability may be proposed for later
    user-approved triage.
13. **read-verified:** `audit-pr` blocks on a missing/stale `REVIEW-PASS`, consumes a current
    receipt without re-running review axes or SPEC-diff mapping, and independently
    evaluates only delivery artifacts, CI, mergeability, traceability,
    closure/descope, and receipt/manual-check integrity.
14. **read-verified:** `audit-pr` no longer reads full feature/fix templates and remains the only
    user-facing skill that emits a SHA-bound `MERGE-READY` PR comment.
15. **read-verified:** Repository tests prove `review-change --adversarial N`, `--synthesize`,
    internal reviewers, and standalone `audit-pr` cannot invoke a merge; the
    existing active `ship-roadmap --fullauto` authority remains unchanged.
16. **read-verified:** Every changed skill has the correct semver bump; `MIGRATION.md`, workflow
    reference docs, README tables where applicable, CHANGELOG EN/ES, template
    mirrors, and reciprocal bilingual siblings are synchronized.
17. **read-verified:** The required golden-fixture runs with the weakest available tool-capable
    model prove: no omitted review axis, no in-scope deferral/new issue, no
    accidental merge interpretation, stale receipt rejection, and all fixed
    output/closing blocks.
18. **command:** `npx skills add . --list`, `node scripts/check-skill-context.test.mjs`,
    `node scripts/check-skill-context.mjs`, `git diff --check`, documentation
    link/coherence checks, and every new route/receipt fixture exit 0.
19. **read-verified:** `skills/orchestration-envelope/SKILL.md` links its
    `references/TURN_CONTRACT.md` resource; that resource is the single owner of
    the unchanged eleven-box checklist; and none of the fifteen named migrated
    skills retains an inline copy of that checklist.
20. **read-verified:** Every named migrated skill loads the canonical Turn
    Contract and retains every skill-specific verification in a semantically
    relevant linked reference; a skill without an appropriate existing reference
    has one created for those additions.
21. **command:** `node scripts/check-skill-context.mjs --routes --budgets`
    exits 0 after the migration, including reference reachability and configured
    progressive context-budget checks.
22. **read-verified:** `bump-skill` applies a patch semver bump to every changed
    skill and synchronizes the required English and Spanish changelog/readme
    distribution artifacts.

### Tooling

- `bump-skill` for every changed `SKILL.md` and synchronized changelogs/readmes.
- Existing context-budget checker, extended route-cost fixtures, and Node tests.
- Existing command guard and fake-forge fixtures for negative merge tests.
- `GOLDEN_FIXTURE.md` with the weakest available tool-capable model.
- `npx skills add . --list` for install/discovery parity.
- No external MCP is required.

### Product decisions

- D1: ship this as one cohesive feature with five atomic phases, per the user's
  explicit preference; split only if implementation evidence proves a phase
  cannot remain one concern.
- D2: optimize for complete capabilities, not short unit duration. In-scope and
  implicit-completeness findings stay in the current unit even when they require
  more phases or days of work.
- D3: `review-change` never creates backlog work. It may present genuinely
  independent future-capability proposals, but only the user may route them to
  `triage-issue`.
- D4: remove the active `--merge` review flag. Replace it with `--synthesize`;
  legacy `--merge` fails closed and is not retained as an alias.
- D5: keep independent reviewer contexts only where the axes are genuinely
  different. Each axis owns unique findings; classification runs once over the
  synthesized table.
- D6: use a SHA-bound PR comment as the durable final-review receipt. The body is
  authored in a temporary Markdown file for safe forge submission, but is not
  committed into the branch, avoiding a review-report commit that would
  invalidate its own SHA.
- D7: intermediate pre-PR checkpoints keep their compact marker in `progress.md`;
  only the mandatory final review produces the audit-consumable receipt.
- D8: repeated checks at different stages remain when the observed state can
  change. Repetition inside the same turn or over immutable verified state is
  replaced by a snapshot, fingerprint, or receipt with an explicit invalidation
  rule.
- D9: fixed turn contracts remain short and front-loaded for weak models;
  explanatory rationale, examples, alternate modes, and portability detail move
  behind conditional references.
- D10: only `audit-pr` says `MERGE-READY`; review reports
  `REVIEW-PASS | REVIEW-FAIL | NEEDS-DECISION`.
- D11: retain the eleven canonical Turn Contract boxes unchanged. Every migrated
  skill loads the single owner at
  `skills/orchestration-envelope/references/TURN_CONTRACT.md`; only its unique
  verification rules live in a linked semantic reference. A missing reference
  stops rather than falling back to an inline copy.
- D12: place unique migration additions in the semantically relevant existing
  reference where one exists; otherwise create a dedicated additions reference.
  Every changed skill receives a patch bump.

### Deferred decisions

none

### Spec-lint (product boxes)

PASS: the Product half has no placeholders; non-goals, five entity closures,
the complete six-role matrix, the full derived integration inventory, twenty-one
resolved expectations, twenty-two verifiable acceptance criteria, and no
deferred decision.

## Design status

`designed`

---

## Engineering half

### Technical goals

- Measure the composed cost of real workflow routes and fail context regressions
  mechanically.
- Replace same-turn reconstruction with explicit snapshots, fingerprints, and
  immutable evidence receipts whose invalidation rules are testable.
- Give each planning, execution, review, and audit concern exactly one owner.
- Keep short, front-loaded weak-model contracts while moving alternate modes,
  rationale, examples, and portability detail behind conditional reads.
- Make feature completeness a blocking review property: current-unit gaps are
  folded or replanned in place, never exported to a growing issue backlog.

### Architecture impact

No root `docs/workflow/REPOSITORY_STATE.md` or project-specific
`docs/architecture/ARCHITECTURAL_INVARIANTS.md` exists, so the normalized-state
and project-invariant results are respectively `n/a: no normalized repository
state` and `n/a: no project invariants declared`.

The applicable workflow invariants in
`docs/workflow/WORKFLOW_INVARIANTS.md` are preserved:

- Roadmap transitions retain one writer per edge.
- Planning cannot authorize an architectural change implicitly.
- `execute-phase`, `review-change`, and `audit-pr` remain separate turns with
  their declared model/effort boundaries.
- `audit-pr` remains verdict/comment-only; active
  `ship-roadmap --fullauto` remains the only automated merge authority.
- Progressive references stay one hop from their owning `SKILL.md`.

This feature intentionally changes the workflow-level ownership boundary:
`review-change` becomes authoritative for final diff quality and completeness;
`audit-pr` verifies the current SHA-bound review receipt and owns only delivery
readiness. Product decisions D2–D10 and this SPEC are the explicit workflow
decision; implementation must update `WORKFLOW_INVARIANTS.md` and its Spanish
sibling so the declared contract matches the new boundary.

### Design

#### Route-cost model

Extend `docs/workflow/SKILL_CONTEXT_BUDGETS.json` and
`scripts/check-skill-context.mjs` with named composed routes. A route is an
ordered list of main skill files, mandatory references, internal skills, and
templates that the contract says must be loaded. The checker applies the
existing deterministic byte/4 estimate to the unique files in that route,
prints stable JSON/table output, rejects missing/unreachable entries, and
supports regression maxima. Target-project code, diffs, and docs remain outside
this fixed-instruction metric and are reported separately when measured.

The baseline includes at least:

- `plan-feature:scoped` and `plan-feature:issue`;
- `plan-fix:issue`;
- `execute-phase:feature`, `:small`, `:fix`, `:legacy`, and `:final-pr`;
- `review-change:default-backend`, `:default-web`, `:adversarial`, and
  `:synthesize`;
- `audit-pr:feature` and `audit-pr:fix`.

#### Shared planning contracts

Add two internal, non-menu contracts:

- `planning-preflight` owns normalized-state consumption and the one final
  architectural classification performed after the complete engineering plan
  exists. Routers may perform a cheap read-only eligibility check before
  writing, but do not repeat the full classification in each composed internal.
- `phase-contract` owns the eight phase-lint rules, fixed PASS/BLOCKED result,
  and normalized phase fingerprint. Feature/fix templates store instance data,
  the contract version, and lint result; they no longer copy the authoring
  tutorial into every generated SPEC.

`plan-feature` creates one in-turn planning context containing a normalized
roadmap snapshot and, for issue routes, one forge issue payload. Composed
internals consume that context rather than re-reading. Scaffold remains the sole
writer of `defined → planned` and performs the only post-write row re-read.
`plan-fix` consumes the same preflight and phase contract while retaining its
fix-specific root-cause, rollback, observability, issue, local branch, and
no-push/no-PR behavior.

#### Execution receipts and selective routes

Split `WORKFLOWS.md` by feature, small/phased, fix, and legacy mode. Split
`ISSUE_POLICY.md` into forge-body, descope, and opportunistic-finding resources.
The main `execute-phase` entrypoint selects a route from the target artifacts
before loading mode detail.

P1 runs the full dependency closure and records a normalized dependency receipt
in `progress.md`: the SPEC dependency line, relevant roadmap dependency rows,
and merged PR identities feed `git hash-object --stdin`. Later phases recompute
the cheap local graph fingerprint and skip forge traversal only when it matches
the receipt and the prior result was fully merged. A changed graph, missing
receipt, prior `--force`, or unmet dependency invalidates the receipt and runs
the full gate again.

#### Review ownership and complete-feature classification

The internal review pack uses an explicit ownership table:

- `review-code`: correctness, error paths, simplification, dead code,
  overengineering, architecture/runtime compatibility, and project code rules;
- `review-security`: secrets, validation, injection, auth, PII, unsafe inputs,
  and dependency security;
- `review-verify`: commands, behavioral execution, test strength, and manual
  verification discovery;
- `review-perf`: algorithmic/resource/performance evidence;
- design/a11y/brand/SEO passes: only their named surfaces;
- `review-debt`: transforms the synthesized findings table into explicit debt
  triggers; it does not rescan the diff;
- `review-implementation`: becomes the single scope/classification engine over
  synthesized tables and no longer performs a broad findings scan.

Classification first asks whether a finding belongs to the current unit. It is
current-unit work when it maps to the SPEC, a phase, an invariant, correctness,
security, accessibility, a required UX/error state, or an expectation necessary
for a competent user to consider an in-scope capability complete. Current-unit
work has only blocking outcomes:

- `fix-now` when it can fold directly;
- `replan-in-unit` when it needs additional user-confirmed phases;
- `decision-required` when a new product/architecture decision is unavoidable.

`postpone`, `tradeoff`, `wontfix`, `disputed`, and issue creation are forbidden
for current-unit work. A previously approved trade-off is cited as existing
evidence, not reinvented by review. `disputed` remains a later fold/user outcome,
not a reviewer shortcut. Only a truly independent future capability can become
a non-blocking proposal; proposals are batched in the report and never sent to
`triage-issue` automatically.

Rename adversarial table fusion to synthesis throughout:

- `--synthesize` consumes fixed reviewer tables;
- legacy `--merge` prints a fixed migration refusal and stops before any git or
  forge mutation;
- `ADVERSARIAL_MERGE.md` becomes `ADVERSARIAL_SYNTHESIS.md`;
- prompts use `synthesize`/`fuse`, never repository merge terminology.

Default review loads only a short adversarial recommendation checklist. The
full adversarial roles/spawn contract loads only for `--adversarial N`; direct
synthesis loads only the table-fusion contract.

#### Review receipt and delivery audit

The mandatory final review runs after the PR exists. `REVIEW-PASS` posts an
idempotent comment through a temporary Markdown `--body-file`:

```markdown
<!-- review-change:pass sha=<head SHA> contract=v1 -->
## review-change: REVIEW-PASS

- Reviewed head: `<head SHA>`
- Scope and applicable axes: <compact list>
- Acceptance coverage: concise criterion-to-evidence summary
- Architectural invariants: pass | n/a
- Current-unit findings open: 0
- Future-capability proposals: <count; no issues created>
- Manual verification: <items or none>
```

`REVIEW-FAIL` persists current-unit findings to the existing fold ledger and
posts no passing receipt. `NEEDS-DECISION` blocks without creating an issue.
Intermediate pre-PR checkpoints continue using `progress.md`'s compact reviewed
marker and do not produce audit receipts.

`audit-pr` fetches the newest receipt matching the current PR HEAD. Missing or
stale receipt is a blocker routed to `/review-change`; audit never composes or
reconstructs the review. With a current receipt it evaluates only:

- phases and required delivery docs complete;
- branch/base/draft/conflict state;
- traceability and roadmap/fix-index link integrity;
- current-head CI;
- capability closure and descope provenance;
- manual-verification acknowledgement;
- merge-owner routing and SHA-bound verdict comment.

It does not load feature/fix templates, rescan review axes, judge test quality,
remap diff hunks to acceptance criteria, or reclassify architectural invariants.
Only `audit-pr` emits `MERGE-READY | BLOCKED`.

### Decisions to confirm

none

### Testing requirements

- Extend the context-checker test suite with route composition, stable output,
  missing-file, duplicate-file, and regression-max fixtures.
- Add contract fixtures for roadmap/issue snapshot reuse and exactly one
  post-write roadmap verification.
- Run the canonical eight invalid phase shapes through both planners and the
  executor after template slimming.
- Add execute route-selection and dependency-receipt fixtures, including every
  invalidation condition.
- Add review ownership fixtures with deliberately overlapping correctness,
  security, tests, performance, architecture, and debt signals; each real
  finding appears once and no axis disappears.
- Add complete-feature classification fixtures for acceptance gaps, implicit
  required UX/error states, oversized in-scope work, pre-approved decisions,
  false positives, and truly independent future capabilities.
- Add fake-forge receipt fixtures for PASS, FAIL, idempotent same SHA, stale SHA,
  later commit, missing PR, and Markdown body integrity.
- Add audit fixtures proving a current receipt is consumed without review work,
  a stale/missing receipt blocks, delivery gates still fail closed, and only
  audit can emit `MERGE-READY`.
- Extend direct-merge negative fixtures across default, adversarial, synthesis,
  audit, and fullauto boundaries.
- Run the changed executor/review/audit contracts through the golden fixture
  with the weakest available tool-capable model.

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| normal backend review | duplicate general/specialized scanners | unique axis ownership + one classifier |
| adversarial request | ambiguous `--merge` semantics | isolated reviewers + internal synthesis only |
| legacy review flag | caller invokes `review-change --merge` | fixed refusal, zero mutation |
| missing expected state | feature omits empty/error/accessibility behavior | current-unit `fix-now` classification |
| oversized review correction | complete fix needs more than one fold commit | `replan-in-unit` on same SPEC/branch/PR |
| tempting follow-up | reviewer sees related future capability | proposal only; user-controlled triage |
| audit after PASS | exact review receipt exists at HEAD | delivery-only gate |
| audit after new commit | receipt SHA is stale | BLOCKED → re-run review |
| intermediate checkpoint | no PR exists yet | progress marker, no final receipt |
| later feature phase | dependencies already verified and immutable | fingerprint fast path |
| dependency amendment | SPEC/roadmap dependency changes | receipt invalidation + full gate |
| final PR body | only forge formatting is needed | load forge-body resource only |
| weak model route | alternate modes and examples are irrelevant | compact core + one selected reference |
| context regression | new mandatory file enters a hot route | route budget test fails |

### Phases

- P1 — Route cost measurement
  Layer: `config/infra`. Done-when:
  `node scripts/check-skill-context.test.mjs && node scripts/check-skill-context.mjs --routes`
  → both exit 0 and print all named baselines.
- P2 — Planning contract consolidation
  Layer: `docs`. Done-when:
  `node scripts/check-skill-context.mjs --routes --route plan-feature:scoped --route plan-fix:issue`
  → both planned routes pass their reduced regression maxima.
- P3 — Execution route consolidation
  Layer: `docs`. Done-when:
  `node scripts/check-skill-context.mjs --routes --route execute-phase:feature --route execute-phase:final-pr`
  → both routes pass and route/dependency fixtures are green.
- P4 — Review-to-audit boundary
  Layer: `docs`. Done-when:
  `node scripts/check-skill-context.mjs --routes --route review-change:default-backend --route audit-pr:feature`
  → both routes pass and review/audit contract fixtures are green.
- P5 — Hardening & PR
  Layer: `hardening`. Done-when:
  `node scripts/check-skill-context.test.mjs && node scripts/check-skill-context.mjs && npx skills add . --list`
  → all exit 0 with golden-fixture evidence recorded.

Every phase has one concern, no open design decision, no conditional scope
mutation, no more than eight implementation tasks (the final close-out chain
uses the allowed hardening exception), and a locally runnable gate. Five phases
do not trigger the mandatory feature-split rule.

### Deploy & rollback

No runtime deployment. Revert the feature PR to restore the previous contracts.
The migration explicitly rejects legacy `review-change --merge`, so rollback
must revert the migration and skill versions together; do not leave a mixed
flag/reference state. Existing target repositories receive template changes only
through their normal workflow upgrade path.

### Open questions / risks

- Shorter contracts can regress weak-model compliance if critical boxes move out
  of the front-loaded Turn contract; golden fixtures and fixed route ownership
  are the mitigation.
- A review receipt is only reusable when bound to the exact current PR HEAD;
  fail-closed invalidation is mandatory.
- Generated SPEC slimming must not make legacy target repositories unable to
  locate the phase contract; the planner/executor must carry a portable fallback
  or an explicit upgrade stop.
- Reviewer axis consolidation can create coverage holes if ownership is merely
  deleted rather than reassigned; the ownership matrix and overlap fixture are
  acceptance gates.

### Deliverables

Route-aware context budgets, shared planning/phase contracts, slim templates,
selective execute routes, a non-ambiguous adversarial synthesis contract,
single-owner review axes, complete-feature classification, SHA-bound review
receipts, delivery-only PR audit, version/migration records, bilingual workflow
documentation, and weak-model regression evidence.

### Post-merge next feature

none
