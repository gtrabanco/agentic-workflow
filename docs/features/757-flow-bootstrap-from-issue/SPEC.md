---
type: feature
scope: standard
roadmap_summary: /flow bootstrap from a tracked issue — consume unit-route's plan-from-issue and demote /unit-lane to the internal conductor in pi docs
---

# 757 — flow-bootstrap-from-issue

> One-line: /flow and /draft can bootstrap from a tracked issue number — consume unit-route's plan-from-issue route and demote /unit-lane to internal conductor in docs.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
```

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.

**S1 — /flow bootstrap from a tracked issue number.**
> /flow and /draft can only start from an existing unit folder — resolveUnit fails with unknown unit before the router is ever asked. Yet the router (unit-route) already answers the exact case: a bare issue number with no folder resolves through plan-from-issue to the lane invocation (/unit-lane --fix <n> for the fix index, /unit-lane --from-issue <n> for a roadmap feature row). The driver does not consume that branch. Fix: when the token does not resolve to a folder, ask the router; when it answers plan-from-issue, hand that lane invocation over exactly as it prints it.

**S2 — /draft bootstrap from a tracked issue number.**
> Same bootstrap as /flow: the driver accepts a tracked issue number and hands off the router's plan-from-issue lane invocation.

**S3 — Demote /unit-lane to internal conductor in docs.**
> Re-document the pi command surface so /unit-lane is presented as the internal conductor (the portable SKILL.md flow and /draft hand planning steps to), with /flow and /draft as the user-facing entries — first-class, in narrative flow order per the repo's conventions.

**S4 — Exit codes and refusal grammar stay the driver's.**
> The two bridges (issue tracked in fix index; issue referenced by a roadmap feature row; unknown number) each have an observable outcome, never a silent guess.

**S5 — Update suites.**
> packages/agentic-workflow/test/flow.test.mjs (bootstrap cases + refusal cases) and the pi door's flow-command.test.mjs updated in the same change; sibling red-first ordering per IR4 if a new script appears (none expected).

**S6 — Consume router's answer only, no second router.**
> --yes, --retriage, --record semantics unchanged on the folder-resolved path; refinements explicitly rejected by #669's decisions (D4/D6: no second router) still hold — this consumes the router's answer, it does not re-decide.

## Impact

What the change touches beyond its own files: the flow driver (flow.mjs), the unit-route router, the pi package's command door, and all pi/docs surfaces.

## Surfaces

- `packages/agentic-workflow`
- `packages/pi-agentic-workflow`
- `docs`

## Retirements

- /unit-lane as user-facing entry in pi docs → demoted to internal conductor + portable entry for non-pi hosts

## Non-goals

- No command-name change, removal or rename — the two doors keep their names.
- No /draft semantics change (--stop-after plan in force, --yes dropped) — unchanged.
- No loop/seven-step-per-invocation semantics — owned by the separate decision issue (#758).
- No adapter sources beyond the two the router already resolves.

## Risk tier

The unit's ceremony is proportional to risk, and the tier is **computed, never chosen**: `runner ceremony tier classify` reads the change's paths and contents and emits `passive | standard | high` (owner: `skills/execute-phase/references/risk-tiers.md`, block `risk-tier-verdict@1`).

- **`standard`** — the ceremony this document describes.

**Task Size = Understood + Contained risk + Resumable-from-diff.**

- **Tier** — `<standard>` · **Task Size** — `<verdict.task_size>`
- **Named high-risk item** — `none — not a high-tier unit`

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a date and a status.

- The unknown-number refusal (an issue that exists on the forge but matches no index row) should read the forge directly — v1 reads the index only; reading the forge live is a triage-time concern (triage-issue), not a driver one.
- The --json envelope (currently a zero-consumer surface, 669 known-issue row 4) gains this decision; if a consumer settles there, that row's debt trigger fires.

## Future cost

- The --json envelope may gain a consumer; the debt trigger from #669 row 4 must be addressed if so.
- The router's plan-from-issue grammar is a normative surface; any change must be reflected in normative-surfaces@1.

## Applicable tests

The tests this unit will run (triage-decided).

- `bun test packages/agentic-workflow/test/flow.test.mjs` (bootstrap + refusal cases)
- `bun test packages/pi-agentic-workflow/test/flow-command.test.mjs`
- `bun scripts/run-root-suite.mjs` (node-compatible subset)
- `bun scripts/local-gate.mjs` (rendered-facts and normative-surface integrity)
- `runner unit-route --triage <test-slug> --json` (router still answers correctly)

## Known pre-existing issues

- **#669** — deterministic lane driver (parent: #669 S2 "the model only executes the step it is handed"; D4/D6: no second router). Affects: this unit constrains itself to the router's plan-from-issue answer, never re-decides.
- **#758** — loop semantics decision (related: soft order, no blocker). Does not affect: this unit works regardless of the loop decision.
- **#319** — location index consolidation (F34: plan-from-issue route). Affects: this unit's underlying route resolution depends on #319's lane invocation paths.

## Tasks

P1…Pn with stable IDs, one line each, smallest first.

- P1 — Add plan-from-issue bootstrap to flow.mjs: resolveUnit no-match → consult computeRoute → if route: plan-from-issue, emit the router's next: and stop (validator: `agentic-workflow flow 752` prints /unit-lane --from-issue 752 as next:, exits 0)
  (Implements: S1, S4)
  - Relevant files: packages/agentic-workflow/src/flow.mjs

- P2 — Add plan-from-issue bootstrap to draft.mjs: same bootstrap as flow.mjs (validator: `agentic-workflow draft 752` prints /unit-lane --from-issue 752 --stop-after plan as next:, exits 0)
  (Implements: S2, S4)
  - Relevant files: packages/agentic-workflow/src/draft.mjs

- P3 — Update flow.test.mjs: bootstrap cases for fix-index issue, roadmap feature row issue, and unknown-number refusal (validator: all new test cases pass)
  (Implements: S1, S4)
  - Relevant files: packages/agentic-workflow/test/flow.test.mjs

- P4 — Update flow-command.test.mjs: bootstrap cases for the pi door (validator: all new test cases pass)
  (Implements: S5)
  - Relevant files: packages/pi-agentic-workflow/test/flow-command.test.mjs

- P5 — Update docs: pi package README, docs/workflow/SKILLS.md flow narrative, docs/workflow/LIFECYCLE.md command decision tree — /unit-lane demoted to internal conductor, /flow and /draft as user entries (validator: rendered-facts and normative-surfaces integrity passes)
  (Implements: S3)
  - Relevant files: packages/pi-agentic-workflow/README.md, docs/workflow/SKILLS.md, docs/workflow/LIFECYCLE.md

- P6 — Update unknown-unit error message: suggest the router's route when one exists (validator: unknown number still refuses unknown unit exit 1; issue number with route suggests it)
  (Implements: S4)
  - Relevant files: packages/agentic-workflow/src/flow.mjs, packages/agentic-workflow/src/draft.mjs

- P7 — Verification: run root suite + all package tests (validator: bun scripts/run-root-suite.mjs exits 0, all package tests green)
  (Implements: S1-S6)

### Planning evidence

One row per Engineering claim (the closed column order and vocabularies are owned by `skills/pre-execution-review/references/LEDGERS.md`).

### Obligations

One row per normative behaviour, compatibility invariant, affected use case, and required failure state.

## Triaged steps

> Paste the `## Triaged steps` block from `runner unit-route --triage <slug>` here verbatim. This block is the machine's authoritative step list; the lane never re-derives or reorders it (owner: `skills/unit-lane/SKILL.md` §Turn contract).

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed yet.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind token from the closed set.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-11-28, the request, verbatim:
  ```
  /flow bootstrap from a tracked issue — consume unit-route's plan-from-issue and demote /unit-lane to the internal conductor in pi docs
  ```

## Next

The single next action: run triage and begin P1 (plan-from-issue bootstrap in flow.mjs).

## References

- Issue: [#757](https://github.com/gtrabanco/agentic-workflow/issues/757)
- Roadmap: row 757
- #669 — deterministic lane driver (parent, D4/D6 no second router)
- #758 — loop semantics decision (related, soft order)
- #319 — location index consolidation (plan-from-issue route, F34)