# fix/119-progressive-planning-docs-adapters

> Fix specification. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in `docs/fix/README.md`. Lighter than a feature spec — no
> separate planning artifacts: the SPEC alone is the source of truth,
> and its `## Phases` section is the execution ledger.

## Goal

Repair two regressions introduced while extracting progressive skill resources:
issue-derived feature planning must apply the Normalized Repository State (NRS)
gate before writing a product half, and Docusaurus must have an explicit docs
adapter contract. Track the repairs in a dedicated fix unit instead of the
already-merged feature 20 ledger.

## Issue

`#119` — tracked issue in the project's forge. The PR must close it via
`Closes #119` in the body.

## Branch

`codex/reduce-skill-context` — user-authorized exception to `plan-fix`'s normal
new-branch rule. This unit remains on the current branch and opens one PR
against `main` during P3.

## Depends on

None. Feature 20 and fix #117 are already merged into `main`.

## Root cause

Commit `c571944` moved `plan-feature` routing into
`skills/plan-feature/references/ROUTING.md`, while
`skills/plan-feature/SKILL.md` loads `PLANNING_GATES.md` only for a designed
input. An issue input therefore reaches `plan-feature-from-issue`, which writes
the product half, before the NRS stop condition in
`skills/plan-feature/references/PLANNING_GATES.md` is applied. Commit `501e362`
split `generate-docs` adapter details into `ADAPTERS.md` but retained only
Starlight and plain-markdown columns even though `ADAPTER_DISCOVERY.md` selects
Docusaurus.

## Detected in

`/review-change` on `codex/reduce-skill-context` reported R1 (NRS issue route),
R2 (Docusaurus adapter contract), and R3 (missing unmerged unit/ledger) on
2026-08-02. R1–R3 are preserved as F1–F3 in this unit's ledger.

## Scope

### In scope

- Require the NRS gate before every `plan-feature` route that can write a
  planning artifact, including issue-derived inputs.
- Add the Docusaurus column and all documented adapter slots to
  `skills/generate-docs/references/ADAPTERS.md`.
- Keep a dedicated fix SPEC, findings ledger, issue #119, and future PR link
  for these repairs.

### Out of scope

- Changing NRS statuses, frozen facts, or the resolver contract; those remain
  owned by `discover-repository-state` and `resolve-repository-state`.
- Scaffolding or changing a Docusaurus site; `generate-docs` only documents
  supported adapters.
- Adding adapters beyond Docusaurus; any new platform adapter needs its own
  issue and fix unit.
- Rewriting the merged feature 20 ledger or its PR history.

## Acceptance

1. `node scripts/check-skill-context.mjs --skill plan-feature` exits 0 after
   the NRS gate is reachable on the issue-derived route.
2. `read-verified`: a fresh-context `plan-feature --from-issue` probe with a
   `draft`, `contradicted`, or `resolved` NRS ledger stops before a product-half
   write and routes to discovery or resolution.
3. `node scripts/check-skill-context.mjs --skill generate-docs` exits 0 after
   the Docusaurus adapter table is complete.
4. `grep -q "Docusaurus" skills/generate-docs/references/ADAPTERS.md` exits 0
   and the column covers content, page, guides, map, review, sidebar, verify,
   and assets slots.
5. `test -f docs/fix/119-progressive-planning-docs-adapters/review-findings.md`
   exits 0 and its F1–F3 rows retain `class: fix-now` and
   `route: replan-in-unit`.
6. `git diff --check` exits 0; the P3 PR body includes `Closes #119` and the
   fix-index row links that PR.

### Spec-lint (mechanical — presence checks only)

- [x] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'`
      over the filled sections returns nothing — the `### P1` scaffold lines
      are replaced, not kept).
- [x] `### Out of scope` has ≥ 1 concrete bullet — never empty.
- [x] Every `## Acceptance` criterion is a runnable command OR labelled
      `read-verified`.
- [x] Every phase passes the 8-box Phase-lint below (already mandatory).

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation**
and ticks tasks here. **Always ≥ 2 phases**: `P1..Pn` implement the fix
(each task independently checkable, no judgement); the final phase is
always `Hardening & PR` — keep its pre-written tasks **literally**, never
paraphrase or merge them into an implementation phase.

### Phase-lint (authoritative copy — keep in sync with `docs/features/_TEMPLATE/SPEC.md` `### Phases`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.

- [x] Title names ONE deliverable — FAIL if it joins nouns with `+`, `,`,
      `&`, `and`/`y`, or `/`.
- [x] One declared layer — each phase declares exactly one of the fixed enum
      `schema/db | domain | api | ui | config/infra | docs | hardening |
      close-out`; FAIL if any task's target file belongs to another. Tests
      for the phase's own layer belong to the phase; a test-only phase
      declares `hardening`.
- [x] ≤ 8 tasks (close-out phase: ≤ 10, only the literal close-out chain).
- [x] One checkbox = one deliverable — FAIL if a task contains a `→` chain
      of implementation steps, enumerates > 3 cases/scenarios, or creates
      > 1 file of distinct concerns.
- [x] Zero decision words — FAIL on `Decide`, `choose`, `OR` between
      alternatives, `If … then <change scope>`.
- [x] No conditional scope mutation — a task may not move work between
      phases at runtime.
- [x] No external/manual gates inside implementation phases —
      human/out-of-repo verifications live in the hardening/close-out phase,
      marked `manual`.
- [x] Machine-checkable done-when — every phase ends with one verifiable
      invariant (a command + expected outcome).

### P1 — NRS issue-route gate

Layer: docs. Done-when: `node scripts/check-skill-context.mjs --skill plan-feature` → exit 0.

- [ ] Require `PLANNING_GATES.md` before an issue-derived route can invoke
      `plan-feature-from-issue`.
- [ ] Preserve the redirect gate's early-stop behavior before loading planning
      gates.
- [ ] Flip F1 to `yes` after the local gate passes.

### P2 — Docusaurus adapter slots

Layer: docs. Done-when: `node scripts/check-skill-context.mjs --skill generate-docs` → exit 0.

- [ ] Add the Docusaurus adapter column to the canonical slot table.
- [ ] Match the discovered Docusaurus convention for every documented slot.
- [ ] Flip F2 to `yes` after the local gate passes.

### P3 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #119`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push
- [ ] Flip F3 to `yes` in the PR-link commit after the index row is updated.

## Testing

- Contract: `node scripts/check-skill-context.mjs --skill plan-feature --skill generate-docs`.
- Behavioral: a fresh-context weak-model probe records that issue-derived
  planning stops for non-frozen NRS before writing a product half.
- Documentation: inspect the Docusaurus table against
  `ADAPTER_DISCOVERY.md` and run `git diff --check`.
- Regression risk: `docs/workflow/GOLDEN_FIXTURE.md` and its Spanish sibling
  must record any new executor-path probe together.

## Rollback

Revert the PR with `git revert <merge-or-squash-sha>`. No data-side cleanup is
needed; the rollback restores the previous skill wording and adapter table.

## Status

`pending`

(Removed from `docs/fix/README.md` only **after** the PR merges.)

## Impact

- **Layers touched:** workflow skill contracts and generated-documentation
  adapter metadata.
- **Modules/files:** `skills/plan-feature/SKILL.md`,
  `skills/plan-feature/references/PLANNING_GATES.md`,
  `skills/generate-docs/references/ADAPTERS.md`, this SPEC, and the fix index.
- **Blast radius:** developer workflow behavior; a missed NRS gate can create
  planning artifacts from contradictory repository state, while a wrong adapter
  can generate documentation into an incompatible site layout.
- **Detection lead time:** immediate in a fresh-context planning probe or docs
  generation run; otherwise silent until an author notices the wrong artifact.

## Rules that must never be violated

- NRS states `draft`, `contradicted`, and `resolved` stop planning; only frozen
  facts may inform a planning write (`PLANNING_GATES.md`, Normalized Repository
  State).
- A selected adapter has explicit paths and verification instructions; the
  generator never guesses them (`ADAPTER_DISCOVERY.md`, Step 0).
- Docs artifacts and commits stay English; translatable workflow docs retain
  Spanish siblings (`CLAUDE.md`, Working rules).
- One PR per unit targets `main` (`CLAUDE.md`, Working rules).

## Operational risks

No runtime jobs, queues, cache, schema, or external-service state changes.
The operational risk is a bad agent route creating planning files before a
required stop condition, or documentation landing in the wrong adapter layout.

## Security risks

No auth, secrets, PII, webhooks, or rate-limit surface changes. The NRS gate
remains a workflow integrity control, not an access-control boundary.

## Compliance touchpoints

n/a — this repository contains workflow documentation and skills, with no
regulated data or product compliance surface in scope.

## Affected docs

- `docs/fix/README.md` — add the pending #119 unit, then link its PR in P3.
- `docs/workflow/GOLDEN_FIXTURE.md` and `docs/workflow/GOLDEN_FIXTURE.es.md` —
  record the NRS issue-route probe when it is run.

## Observability

There is no production metric. The health signals are the NRS probe's required
stop before any product-half write, context-checker exit status, and the PR's
`Closes #119` linkage.

## Cross-issue notes

- **#119** is the only open issue and contains all three review findings.
- **PR #118 / issue #117** are merged and closed; they are historical context,
  not prerequisites or a destination for new findings.

## Effort

M — two focused skill-contract changes, a behavioral probe, and the normal
review/PR close-out require multiple commits but no product design work.

## Decisions made during drafting

- R1–R3 share the same post-merge progressive-resource regression and are
  planned as one issue and one future PR.
- The user explicitly authorized retaining `codex/reduce-skill-context` rather
  than creating the default `fix/119-progressive-planning-docs-adapters` branch.
- The dedicated ledger starts with the frozen review classifications; P1, P2,
  and P3 own F1, F2, and F3 respectively.
