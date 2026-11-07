# The plan grammar — `batch-plan@1`

The batch scheduler's machine envelope: one fixed JSON document, produced only
by `scripts/batch-scheduler.mjs` and validated against the schema package's
`agentic-workflow/batch-plan` contract before printing. The inventory below is
the document's closed field set (grammar `table:batch-fields@1`, pinned in the
guide's normative-surfaces inventory); the schema package owns the closed
vocabularies and the validator.

## The field inventory — batch-fields@1

| object | field |
|---|---|
| batch-plan | contract |
| batch-plan | version |
| batch-plan | schema |
| batch-plan | source_revision |
| batch-plan | degraded |
| batch-plan | batches |
| batch-plan | blocked |
| batch-plan | launched |
| batch-plan | findings |
| batch-plan | summary |
| batch | n |
| batch | lanes |
| lane | surface |
| lane | occupied_by |
| lane | size_hint |
| lane | issues |
| issue | number |
| issue | title |
| issue | lane |
| issue | worktree |
| issue | command |
| issue | reason |
| reason | kind |
| reason | detail |
| issue | size_hint |
| issue | claimed |
| blocked | number |
| blocked | blockers |
| blocked | reason |
| launched | number |
| launched | evidence |
| finding | code |
| finding | numbers |
| finding | detail |
| summary | open_issues |
| summary | batched |
| summary | blocked |
| summary | launched |
| summary | findings |
| summary | batches |

## The fields

| field | meaning |
|---|---|
| `contract` / `version` / `schema` | `agentic-workflow/batch-plan` · `1` · `batch-plan@1` |
| `source_revision` | the git revision the plan was computed at |
| `degraded[]` | what could not be read, `unavailable-<source>-<cause>` — never a silent empty plan |
| `batches[].n` | 1 = the runnable-now set; N+1 becomes runnable when batch N completes (strictly ascending) |
| `batches[].lanes[].surface` | one lane per touched surface — `skills/<name>`, `packages/<name>`, `scripts/`, `docs/`, `template/`, `.github/`, or `general` when an issue body names no path. A token that names the whole tree instead of a child (`skills`, `skills/`, `skills/**`) is not a lane of its own: it joins every declared child lane (`skills/<name>` found anywhere in the run), and keeps the tree-root key only when no child is declared |
| `batches[].lanes[].occupied_by` | the in-flight unit doc occupying the surface, or `null` |
| `batches[].lanes[].issues[]` | the issues serialized in the lane, in run order |
| `issue.worktree` | the derived worktree name `<feat\|fix>/<issue>-<slug>` — reported, never created |
| `issue.command` | `/unit-lane --from-issue <N>` — the exact published form |
| `issue.reason` | why the issue sits here: `satisfied-inputs` (no open blockers, surface free) · `surface-conflict` (shares the lane; serializes after the previous occupant) · `soft-ordered` (a prose soft dep orders it after its target in the same lane) |
| `issue.size_hint` | `light` / `mixed` / `heavy` — from the issue's declared `(S)/(M)/(L)` token, else its distinct-surface count (1 → light, 2 → mixed, ≥3 → heavy) |
| `lane.size_hint` | the max of its issues' hints — a fact for the consumer's lane-count decision, never a policy |
| `issue.claimed` | `true` when the persisted state file recognizes the lane from a previous run |
| `blocked[]` | issues gated by open native `blocked-by` relations, with the blocker numbers and the reason string. A blocker whose unit doc is on disk is **in flight**: it gates the issue, the reason says so (`blocked-by 20 (open, unit in flight)`), and the issue is never batched while that unit runs |
| `launched[]` | issues already running (an open unit dir under `docs/fix/` or `docs/features/` carries the number), excluded from every batch |
| `findings[]` | the unresolvable spots, never silent omissions: `cycle` (a cyclic — or cycle-downstream — `blocked-by` wait **no batch can ever satisfy**; an in-flight target is a state, never a cycle), `orphaned-soft-dep` (a soft row whose target is neither open nor in the location index — a target that is open and in flight is not an orphan), `prose-native-mismatch` (a prose row declared `hard` with no native `blocked-by` — the #442 agreement check; skipped and declared when the native relations are unavailable) |
| `summary` | the totals: `open_issues`, `batched`, `blocked`, `launched`, `findings`, `batches` |

## The standing constraints, mechanically

1. **Hard blockers gate.** An issue with an unmet native `blocked-by` is not
   in batch 1; it lands in the first batch after its last blocker's batch.
   Closed blockers (absent from the open set) never gate. A blocker whose unit
   doc is on disk is in flight: it gates, is named as in flight, and its
   dependants wait outside every batch until it lands — never reported as a
   cycle.
2. **Soft dependencies order.** A prose `soft` row never gates: a dependent
   runs at or after its target's batch, and after it inside a shared lane.
3. **Single-occupant-per-surface.** Issues sharing a surface share one lane
   and serialize; disjoint surfaces get disjoint lanes. An issue spanning
   several surfaces serializes in each of them, and a tree-root declaration
   joins every declared child lane, so a broad issue never runs beside the
   concrete lane it covers.
4. **Size hints are reported.** The consumer decides how many lanes to launch;
   the planner never caps anything.

## The state file (the single write path)

`.agentic-workflow/batches.json` (under `--root`; untracked by the carrier's
own `.gitignore` whitelist, so it is durable locally and never a commit churn):

```json
{
  "version": 1,
  "written_at": "<ISO instant>",
  "source_revision": "<sha>",
  "claimed": {
    "<issue-number>": { "batch": 1, "lane": "skills/x", "first_seen": "…", "last_seen": "…", "worktree": "feat/1-x" }
  }
}
```

A re-run marks every still-planned issue present in `claimed` with
`claimed: true`. `--no-state` skips the write entirely; `--mark-launched <n>`
records that the operator launched issue N's lane outside the sensor. The two
are mutually exclusive (the pair is a usage error, exit 2) — a pure read never
writes. Nothing else on disk is ever touched.

## CLI

```
bun scripts/batch-scheduler.mjs [--root <dir>] [--issues-file <json>]
                                [--state <path> | --no-state]
                                [--remote <url>] [--mark-launched <n>] [--json-only]
```

`node` is the fallback when bun is absent. `--remote <url>` names the forge for
**both** collection sources (the issue list and the relations call), so a
scratch clone whose `origin` is a local path still reads the live issues.
Exit codes: `0` a plan was printed (degradations inside are reported, not
fatal); `1` the produced document failed its own `batch-plan@1` validation (a
producer bug — never ship around it); `2` usage error, including a missing flag
value and the `--no-state`/`--mark-launched` pair.
