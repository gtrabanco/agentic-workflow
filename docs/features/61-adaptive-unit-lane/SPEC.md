# Feature 61 — Adaptive unit lane

## Objective

Replace the fixed multi-file SDD pipeline (design-feature → review-spec →
plan-feature → review-plan → execute-phase → review-change → audit-pr, ~8 files
per unit) with one adaptive, triage-driven lane where each unit is one single
document and the steps it needs are decided by a cheap triage pass against a
closed catalog.

## Why

The current pipeline wastes context and cycles on fixed-file boilerplate that
most units do not need, forces every unit through the same expensive gates
(regardless of size or change type), and requires the model to remember a rigid
path instead of selecting the right steps. The redesign keeps discipline — every
unit still goes through the same quality gates — but gates become proportional,
evidence-based, and driven by a single triage decision.

## User outcome

A maintainer gets a single unit document per feature/fix under
`docs/features/<NN>-<slug>/` that contains objective, why, user outcome,
acceptance criteria, non-goals, future cost, applicable tests, known
pre-existing issues, tasks, evidence with its verification, a dated progress
log, next step, and references (issues / roadmap rows / related material). They invoke one command (`/unit-lane <NN>` or the triage
step) and the system tells them exactly what to do next, chosen from a closed
catalog of steps (research, design, plan, implement, tests, evidence, review,
docs, release), with guards that bite when a unit outgrows the light path.

## Acceptance criteria

1. **Single-unit document**: Every NEW unit (feature or fix) created after
   this feature produces exactly one `SPEC.md` under `docs/features/<NN>-<slug>/`
   containing all mandatory sections (objective, why, user outcome, acceptance
   criteria, non-goals, future cost, applicable tests — present when the
   triage includes a tests step, `n/a` otherwise — known pre-existing issues
   with an explicit affects/does-not-affect this unit marking per issue, tasks
   with stable IDs, evidence with its verification records, a progress log,
   and next step). Legacy multi-file units are not migrated (see Non-goals).
   Verification: a newly created unit has exactly one file and no orphan
   PLAN/TASKS/ACCEPTANCE siblings.

2. **Triage catalog**: `scripts/unit-route.mjs` (already present) accepts an
   optional catalog file (`catalog.json`) listing closed-step names, their
   applicability rules, and their budget tiers. When invoked with `--triage
   <slug>`, it reads the unit's scope from the first-pass SPEC content and
   returns a deterministic ordered list of steps the unit needs.
   Verification: a docs-only change produces `[docs, evidence]` — no tests, no
   code review, no plan; a trivial fix (color change, one-line correction)
   produces `[implement, evidence]` — no tests step, no review; a core-logic
   feature produces the full ordered list including `tests` and `review`.

3. **Post-phase diff-size guard**: A script measures `git diff --stat` after each
   phase; if the diff exceeds the phase budget (defined per step in the catalog),
   the unit is expelled from the light path and flagged for mandatory re-triage.
   Anti-gaming rule verbatim: "NEVER shrink a diff by deleting comments, blank
   lines, docs or tests." Verification: a phase that produces a 200-line diff
   against a 50-line budget triggers `replan` and stops.

4. **Path-protection reuse**: Feature 60's path-protection guards (feature 60,
   `packages/agentic-workflow/src/path-policy.mjs`) are consumed by the lane's
   guard layer without modification. Verification: protected-path violations on
   `tests/` or `fixtures/` are caught at the same checkpoint as before.

5. **Deterministic next-step**: `scripts/workflow-status.mjs` + schema's
   `decideWorkflowAction()` extend to compute the next command from the ordered
   priority: in-flight units → urgent/fix-next labeled issues → triaged issues
   → defined features → ideas. No hand-off templates — the next command is
   computed. Verification: `workflow-status --json | jq .next.command` prints the
   exact next invocation string.

6. **plan-feature and plan-fix absorbed**: These skills cease to be standalone
   user-invocable commands. Their functionality becomes optional catalog steps
   (`design`, `plan`) within the triage catalog. The `--scaffold` and
   `--from-issue` flags are retired. Verification: `/plan-feature <slug>`
   redirects to the triage lane; `npx skills add --list` no longer lists them.

7. **ship-roadmap removed**: The `ship-roadmap` skill is deleted (its scope is
   replaced by the deterministic router in the lane's runner package).
   Verification: `skills/ship-roadmap/` directory is gone; all ~12 referencing
   surfaces (roadmap, skills/tables, templates, docs) are updated.

8. **Runner package `packages/agwo`**: A new bun-managed package at
   `packages/agwo/` owns all runtime scripts: workflow-status, phase-lint,
   path-guard, receipts, evidence runner, future configurator.
   `packages/pi-agentic-workflow` becomes a thin pi integration layer depending
   on `agwo`. `packages/agentic-workflow-schema` is untouched. Root `scripts/`
   keeps only repo-own dev/CI checks. Verification: `bun test` passes under
   `packages/agwo/`; `pi-agentic-workflow` lists `agwo` as its only dependency.

9. **Runtime rule**: The runtime that launched pi decides for runner-spawned
   scripts — pi under bun spawns bun, pi under node spawns node — resolved by
   the pi package's runtime module (`detectRuntime`/`runtimeBin`/`runtimeEnv`,
   shipped with this feature's pi integration); `AGENTIC_WORKFLOW_RUNTIME=bun|node`
   env override always wins. Verification: with pi under node, a runner script
   spawned by the integration runs under node; under bun, under bun; the env
   override flips both.

10. **Dogfooding — first slice**: The lane's minimal version (triage + unit doc
    template + implement step + evidence) is implemented and used to document
    one existing feature folder as the test case. Verification: at least one
    feature folder (e.g. a small `XS` unit) follows the new single-file format
    end-to-end.

11. **Roadmap & forge reconciliation**: Every roadmap row affected by this
    feature is annotated in one pass — fully absorbed rows become `folded → 61`
    (number kept, never reused), superseded rows record the reason, partially
    absorbed ones are either re-scoped in place or unified into new roadmap
    rows, and rows the owner declines carry an explicit won't-do note. Every
    absorbed issue is closed by this feature's PR via `Closes #N`, and the
    unit's References section lists the full mapping. Verification: no open
    roadmap row or open issue still points at machinery this feature removed.

12. **Substrate adoption (`init-workspace` + `template/`)**: The scaffold
    ships the new way of working — `init-workspace` bootstrap and upgrade mode
    write the updated AGENTS.md conventions (unit document, catalog, guards,
    evidence, commit formats), the `template/` tree carries the new unit-doc
    template and documentation map, and a repo upgraded before this feature
    gets only the missing blocks additively (never clobbering recorded
    decisions). Verification: a fresh bootstrap produces a project whose
    AGENTS.md describes the adaptive lane; upgrade mode on a pre-lane repo
    adds the new blocks without destroying existing ones.

## Non-goals

- No replacement orchestrator for ship-roadmap: this feature only DELETES the
  skill (its retirement scope is absorbed here); the pi-native conductor that
  replaces its role (issue #233) is a separate later feature.
- No migration of existing old-format units (feature/fix units with separate
  PLAN/TASKS/ACCEPTANCE/progress files remain as-is; new units use the single
  file).
- No Engram memory hard dependency — Engram mirroring of the unit doc is
  optional and can be added by a separate integration.
- No model self-selection or dynamic cost optimization at triage time.
- No changes to the schema package's `Envelope v2` structure.

## Future cost

Every new catalog step added after this feature requires: a triage rule
(applicability + budget), a deterministic guard (scope/size), and a budget
entry in `catalog.json`. The roadmap and `docs/workflow/SKILLS.md` must stay
in sync when skills are removed or absorbed. The runner package `agwo` becomes
the central deployment target — any script addition must pass the package's
test suite. The single-unit document convention must be propagated to the
`template/` directory so target projects adopt it.

## Tasks

P1 — **Unit doc template**: Write the canonical `docs/features/_TEMPLATE/SPEC.md`
with all mandatory sections: objective, why, user outcome, acceptance criteria
with ask-don't-infer, non-goals, future cost, applicable tests (triage-decided,
`n/a` when the unit has no tests step), known pre-existing issues (each marked
`affects` / `does-not-affect` this unit, so a red gate can never be excused by
an unrecorded pre-existing failure nor blamed on one that was), tasks P1…Pn,
evidence with verification records (each evidence item carries what was run,
its exit status/digest, and who verified it against which acceptance criterion),
a progress log (one dated `YYYY-MM-DD HH:MM` entry per step taken: what was
done, the resulting commit/evidence, and what is next), next step, and
references (issues, roadmap rows, related material worth exploring). Propagate
to `template/`.

P2 — **Roadmap & forge reconciliation**: one owner-approved pass over the
roadmap and the forge: fully absorbed rows (54/229, 50/205, 51/218, 42/194,
35/182) become `folded → 61`; 58/233 records the deletion-half absorption (its
conductor half stays open as a new row); 46/206, 33/173, 53/227, 41/174,
45/201 are re-scoped in place or unified into new row(s) where that beats two
half-overlapping rows; 44/198 and #176 record supersession; the declined rows
get an explicit won't-do note. New roadmap rows are cut here (the #233
pi-native conductor is the first candidate). Each absorbed issue is closed by
this feature's PR via `Closes #N`.

P3 — **Triage catalog**: Create `scripts/catalog.json` listing the closed steps
(research, design, plan, implement, tests, evidence, review, docs, release),
each with `applicable_if` rules, `budget_tier`, and `requires_gate` flags.
Extend `scripts/unit-route.mjs` `--triage` mode to read scope from a single
SPEC.md and emit an ordered step list.

P4 — **Implement step (dogfood slice)**: Extend `execute-phase` to consume the
triage-decided step list from the unit doc instead of a fixed phase set. A unit
runs only the triaged steps, each as an atomic gate/commit. First dogfood: pick
one XS feature folder, convert to single-file format, run through triage +
implement.

P5 — **Diff-size guard**: Add `scripts/diff-guard.mjs` that measures `git
diff --stat` at phase boundaries, enforces the budget from `catalog.json`, and
expels the unit for re-triage when exceeded. Anti-gaming rule baked in as code.

P6 — **Path-protection wiring**: Integrate feature 60's path guards into the
lane's guard layer (run at phase checkpoints). Reuse existing
`packages/agentic-workflow/src/path-policy.mjs` without modification.

P7 — **Deterministic next-step**: Extend `scripts/workflow-status.mjs` and the
schema's `decideWorkflowAction()` to compute the next command from priority:
in-flight units → urgent/fix-next issues → triaged issues → defined features →
ideas. Labels are read from GitHub via `gh issue list --label`. No hand-off
templates — the next command is the exact invocation string.

P8 — **Absorb plan-feature / plan-fix**: Retire both skills as standalone
user-invocable commands. Their catalog-step variants (`design`, `plan`) become
entries in `catalog.json`. Update all ~12 referencing surfaces (roadmap,
SKILLS.md, README, template, docs/workflow diagrams, MIGRATION.md, skills/
tables, etc.).

P9 — **Delete ship-roadmap**: Remove `skills/ship-roadmap/` directory. Migrate
urgency micro-judge, `--adversarial 2` floor, batch-design/JIT design, closeout,
and re-point all referencing surfaces to the deterministic router in `agwo`.
(feature 58 will later replace the full conductor role — document as deferred).

P10 — **Runner package `packages/agwo`**: Create the new bun-managed package.
Move runtime scripts from root `scripts/` into `packages/agwo/src/` (workflow-
status, phase-lint, path-guard, receipts, evidence runner, config).
`packages/pi-agentic-workflow` depends on `agwo` as its only dependency. Root
`scripts/` keeps only repo-own dev/CI checks. Tests pass under `packages/agwo/`.

P11 — **Substrate adoption**: `init-workspace` bootstrap and upgrade mode
write the new way of working into target projects — the updated AGENTS.md
conventions (unit document, catalog, guards, evidence, commit formats), the
`template/` tree's new unit-doc template and documentation map, additive-only
upgrade blocks for pre-lane installs (never clobbering a recorded decision).

P12 — **Hardening**: Integration test covering the full lane (triage → unit doc
→ implement → evidence → guard bite → re-triage) on the dogfood XS unit. Update
`docs/workflow/SKILLS.md` and README skill table. Golden fixture smoke test.
Final review against AGENTS.md conventions.

## References

- Closes (absorbed, closed by this feature's PR): [#229](https://github.com/gtrabanco/agentic-workflow/issues/229) (row 54, two-level artifacts) · [#205](https://github.com/gtrabanco/agentic-workflow/issues/205) (row 50, review-loop convergence) · [#218](https://github.com/gtrabanco/agentic-workflow/issues/218) (row 51, review-evidence substrate) · [#194](https://github.com/gtrabanco/agentic-workflow/issues/194) (row 42, deterministic review-change) · [#182](https://github.com/gtrabanco/agentic-workflow/issues/182) (row 35, scoped receipt verifier)
- Partially absorbed (re-scoped or unified in P2): [#233](https://github.com/gtrabanco/agentic-workflow/issues/233) (row 58 — deletion here, conductor later) · [#206](https://github.com/gtrabanco/agentic-workflow/issues/206) (row 46 → research catalog step) · [#173](https://github.com/gtrabanco/agentic-workflow/issues/173) (row 33 → surviving skills only) · [#227](https://github.com/gtrabanco/agentic-workflow/issues/227) (row 53 → unit-doc template) · [#174](https://github.com/gtrabanco/agentic-workflow/issues/174) (row 41) · [#201](https://github.com/gtrabanco/agentic-workflow/issues/201) (row 45)
- Superseded: [#198](https://github.com/gtrabanco/agentic-workflow/issues/198) (row 44 — scripts move to `agwo`, not into skill folders) · #176 route-slimming (rows disappear instead of slimming)
- Related reading: `docs/workflow/REPOSITORY_STATE.md` (frozen facts substrate) · feature 60's path-protection policy (reused unmodified) · the 2026-09-15 bureaucracy-reduction execution order in the roadmap (this feature supersedes its Phase 2/3 sequencing)

## Open questions

1. **Triage budget tiers per step**: What budget (line count, phase time, model
   tier) should each step have? Proposed default: research (xhigh/60min), design
   (opus/45min), plan (sonnet/30min), implement (sonnet/45min), tests (sonnet/
   30min), evidence (cheap/15min), review (opus/30min), docs (cheap/10min),
   release (sonnet/15min). Adjust per measured data.

2. **Triage accuracy on vague units**: When the unit's SPEC content is too
   vague to triage reliably, what is the fallback? Proposed default: prompt the
   user with concrete options (ask-don't-infer), then re-run triage on the
   clarified input.

3. **Diff-size guard budget origin**: Where does the per-phase budget come from?
   Proposed default: defined in `catalog.json` per step, with a `budget_lines`
   field. The budget is the maximum allowed `git diff --stat` line count after
   one honest split. If a phase cannot fit after splitting once, report the real
   count with an `exception` flag.

4. **Migration path for existing units**: How do existing multi-file units
   transition to single-file? Proposed default: no migration. Existing units
   remain untouched. New units use the single-file format. The lane detects the
   format on read and adapts — multi-file units get a `--convert` flag if
   desired.