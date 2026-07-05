# 03 — orchestrator-crash-recovery

> Feature specification. Size S — this SPEC is the only planning artifact;
> implement with `execute-phase 03` in a single pass.

## Goal

Give external drivers (a Node server talking only to an agent's REST API, e.g.
opencode) a safe restart path: `workflow-status` gains a **crash-recovery
reconcile section** that detects an interrupted turn from ground truth (dirty
working tree on a unit branch, half-closed phase, stale persisted envelope) and
reports it through the existing envelope so the driver knows exactly how to
resume — without the driver needing filesystem or git access of its own.

## Branch

`feat/03-orchestrator-crash-recovery`

## Size

`S` — one existing SKILL.md extended plus ORCHESTRATION.md driver-loop docs.

## Dependencies

None (workflow-status and the envelope contract are on `main`; PR #4).

## Context

`workflow-status` computes the project state (features, fixes, PRs, findings,
startable units) but assumes turns end cleanly. If the driver's process dies
mid-turn, on restart the persisted envelope (the driver's JSON journal) may
disagree with reality in a specific way status doesn't classify today: work
happened that no skill report closed. The driver then can't distinguish
"continue", "re-run the phase", or "ask a human".

## Business goals

n/a — internal workflow/orchestration robustness.

## Technical goals

- Recovery is **recomputed from ground truth** (git/forge/docs), never trusted
  from the driver's JSON; the driver's last envelope is an optional *hint*
  input, not a source.
- Read-only invariant preserved: workflow-status still never edits anything —
  it classifies and recommends; recovery *actions* are performed by the skill
  it routes to.

## Scope

### In scope

1. **`workflow-status`** (minor bump): new `Crash recovery` checklist, run on
   every invocation (cheap) and reported in a fixed sub-block:
   - ✓ Working tree state per unit branch: dirty tree or unpushed commits on a
     `feat/*|fix/*` branch → interrupted-turn candidate; cite branch + files.
   - ✓ Phase ledger coherence: `progress.md`/`TASKS.md` last entry vs actual
     commits on the branch (commits after the last closed phase entry →
     half-closed phase).
   - ✓ Optional hint: the caller may pass the last persisted envelope
     (`workflow-status --last-envelope <json|path>`); the skill diffs it
     against recomputed state and reports the divergence — hint only, never
     authoritative.
   - Classification (closed set): `CLEAN` (no interruption) ·
     `RESUMABLE` (re-invoke `execute-phase <NN> P<x>` — idempotent re-entry) ·
     `AMBIGUOUS` (human must look; envelope `state: NEEDS_INPUT` with the
     evidence and the concrete options).
   - Envelope mapping: `CLEAN` → existing behavior; `RESUMABLE` →
     `state: CONTINUE`, `next.recommended` = the resuming command;
     `AMBIGUOUS` → `state: NEEDS_INPUT` with `needs_input.question/options`
     filled. **No schema change** — existing fields only.
2. **`execute-phase`** (patch bump): make idempotent re-entry explicit — a
   short "Resuming an interrupted phase" note: on entry, if the branch already
   has commits/dirty state for this phase, reconcile against `TASKS.md` ticks
   and continue from the first unticked task instead of restarting (this is
   Step-0 behavior today; the note makes it a stated contract any agent must
   honor).
3. **`docs/workflow/ORCHESTRATION.md`**: "Driver restart protocol" section —
   load journal (hint) → call `workflow-status --last-envelope` → route on
   `state` (`CONTINUE`/`NEEDS_INPUT`/normal) → append-only envelope journal
   recommendation (timestamp + SHA per entry).
4. `bump-skill` bookkeeping (versions, CHANGELOG EN/ES, README tables EN/ES).

### Out of scope / non-goals

- Automatic cleanup (stash/commit/reset of an interrupted tree) — mutations
  belong to `execute-phase` (resume) or a human; workflow-status stays
  read-only by contract.
- Changes to `orchestration-envelope`'s schema or the npm schema package — the
  classification maps onto existing `state` values on purpose.
- The Node/opencode driver implementation itself — user land; ORCHESTRATION.md
  documents the protocol only.
- Distributed/multi-driver locking — single-driver assumption stands.

## Architecture impact

None structural. Honors the composition rule (workflow-status recommends and
hands off; it never composes execute-phase in-turn). The envelope contract is
untouched — critical, because `packages/agentic-workflow-schema` mirrors it and
this feature must NOT require a schema/package release.

## Design

Fixed sub-block appended to workflow-status's existing report (closed format,
identical on every agent):

```
CRASH RECOVERY — verdict: CLEAN | RESUMABLE | AMBIGUOUS
| Branch | Evidence | Classification | Resume command |
|---|---|---|---|
| feat/01-generate-docs | dirty: 3 files; progress.md last = P1 closed; 2 commits after | RESUMABLE | execute-phase 01 P2 |
Hint envelope: <matched | diverged: <one line> | not provided>
```

Classification rules are a decision table (every row independently checkable):
clean tree + ledger coherent → CLEAN; dirty/unpushed + ledger points to a
unique next task → RESUMABLE; dirty + ledger contradiction (ticks ahead of
commits, unknown branch, detached HEAD) → AMBIGUOUS.

## Decisions to confirm

- D1 — classify inside `workflow-status` vs a new `reconcile-run` micro-skill:
  **chosen: inside workflow-status** — the driver already calls it on every
  loop tick; a second sensor skill would duplicate Step 0 and the envelope.
- D2 — no envelope schema change: **chosen** — `CONTINUE`/`NEEDS_INPUT` +
  `detail` cover the three verdicts; avoids a lockstep schema-package release.

## Acceptance criteria

- `workflow-status` SKILL.md contains the Crash recovery checklist, the
  decision table, the fixed sub-block, the `--last-envelope` hint contract, and
  the envelope mapping; read-only guardrail restated.
- `execute-phase` SKILL.md contains the "Resuming an interrupted phase" note.
- ORCHESTRATION.md contains the Driver restart protocol (journal → sensor →
  route) incl. the append-only journal recommendation.
- No change under `packages/agentic-workflow-schema/` and no change to
  `orchestration-envelope`'s schema block (checked by diff).
- Versions bumped; CHANGELOG EN/ES + README tables EN/ES updated;
  `npx skills add . --list` green; cross-references resolve.

## Testing requirements

Docs-level gate plus dry-runs: simulate the three verdicts on this repo
(scratch branch with an uncommitted file → RESUMABLE fixture; clean main →
CLEAN; ticked task without its commit → AMBIGUOUS) and paste transcripts in the
PR description. Schema invariance: `npm test` in
`packages/agentic-workflow-schema` still passes untouched.

## Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `recover:clean` | normal restart | run on clean `main` → CLEAN |
| `recover:mid-phase` | server died during execute-phase | scratch unit branch + uncommitted file + progress.md behind → RESUMABLE with resume command |
| `recover:ledger-contradiction` | crash between tick and commit | TASKS.md tick with no matching commit → AMBIGUOUS, NEEDS_INPUT options listed |
| `recover:stale-hint` | driver journal older than reality | `--last-envelope` from before a merge → "diverged" line, recomputed state wins |

## Phases

Single-pass (`execute-phase 03`) — no PLAN/TASKS. Close-out: open the PR, print
its URL, roadmap row → done.

## Deploy & rollback

n/a — merging is enough.

## Open questions / risks

- R1: `--last-envelope` on agents without argument passing → Portability
  fallback: paste the JSON into the invocation message; the skill treats the
  last fenced json block of the request as the hint.

## Deliverables

Edits to `skills/workflow-status/SKILL.md`, `skills/execute-phase/SKILL.md`,
`docs/workflow/ORCHESTRATION.md`; CHANGELOGs + READMEs; this SPEC.

## Post-merge next feature

Roadmap exhausted at time of planning — run `/product-audit` or plan the next
idea with `/plan-feature`.
