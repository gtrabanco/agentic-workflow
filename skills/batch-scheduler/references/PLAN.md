# The plan grammar — `batch-plan@3`

The batch scheduler's machine envelope: one fixed JSON document, produced only
by `scripts/batch-scheduler.mjs` and validated against the schema package's
`agentic-workflow/batch-plan` contract before printing. The inventory below is
the document's closed field set (grammar `table:batch-fields@1`, pinned in the
guide's normative-surfaces inventory); the schema package owns the closed
vocabularies and the validator. v2 (issue #460) added the lifecycle delta and the triage/soft-dep signals; v3
(issue #509) adds `label_blocked[]` with its summary count and the
`file-overlap`/`stale-claim` findings.

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
| batch-plan | label_blocked |
| batch-plan | findings |
| batch-plan | new_issues |
| batch-plan | closed_since |
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
| issue | triaged |
| blocked | number |
| blocked | blockers |
| blocked | reason |
| launched | number |
| launched | evidence |
| label_blocked | number |
| label_blocked | labels |
| finding | code |
| finding | numbers |
| finding | detail |
| summary | open_issues |
| summary | batched |
| summary | blocked |
| summary | launched |
| summary | findings |
| summary | batches |
| summary | label_blocked |

## The fields

| field | meaning |
|---|---|
| `contract` / `version` / `schema` | `agentic-workflow/batch-plan` · `3` · `batch-plan@3` |
| `source_revision` | the git revision the plan was computed at |
| `degraded[]` | what could not be read, `unavailable-<source>-<cause>` (launch reads: `unavailable-launch-evidence-*`, `unavailable-forge-pr-list-*`); the plan still prints |
| `batches[].n` | 1 = runnable now; N+1 when batch N completes |
| `lanes[].surface` | one lane per touched surface — `skills/<name>`, `packages/<name>`, `scripts`, `docs`, `template`, `.github`, or `general` when no path is named |
| `lanes[].occupied_by` | the **evidence** of the in-flight unit on the surface (`branch fix/1-x + unit-doc docs/fix/1-x`), or `null` |
| `lanes[].issues[]` | the issues serialized in the lane, in run order |
| `issue.worktree` | `<feat\|fix>/<issue>-<slug>` — reported, never created |
| `issue.command` | `/unit-lane --from-issue <N>` — the published form |
| `issue.reason.kind` | `satisfied-inputs` · `surface-conflict` (after the previous occupant) · `soft-ordered` · `untriaged` (no triage anywhere; provisional) · `soft-deps-open` (soft deps not delivered strictly first: other lane, later in the lane, unbatched, or `state unknown`) |
| `issue.triaged` | `false` when the roadmap row is below `planned` **and** the body carries no verdict (`fix-now`, `postponed`, `promoted`, `wontfix`) |
| `issue.size_hint` | `light` / `mixed` / `heavy` — the declared `(S)/(M)/(L)` token, else the distinct-surface count (1, 2, ≥3) |
| `lane.size_hint` | the max of its issues' hints — a fact, never a lane-count policy |
| `issue.claimed` | `true` only for a **live** claim on this exact `(issue, lane)` pair: another lane's claim never marks it, an expired one never does |
| `blocked[]` | issues gated by open native `blocked-by` relations, with the blockers and the reason |
| `launched[]` | issues running now, on evidence: an `OPEN` PR or an unmerged `fix\|feat/<n>-*` branch, named in `evidence`. A unit doc corroborates, never decides. Excluded from every batch |
| `label_blocked[]` | issues a hold label keeps unlaunchable (`postponed`, `backlog`, `human-revision-needed`) with those labels — never batched |
| `new_issues[]` / `closed_since[]` | the lifecycle delta — first seen; closed since with the last known row |
| `findings[]` | `cycle` (a wait no batch can satisfy; in flight is a state) · `orphaned-soft-dep` (a target neither open, in flight, label-blocked, closed-since nor indexed) · `prose-native-mismatch` (a `hard` row without a native `blocked-by`) · `file-overlap` (parallel issues whose files intersect) · `stale-claim` (a claim that no longer stands, keyed) |
| `summary` | the totals: `open_issues`, `batched`, `blocked`, `launched`, `findings`, `batches`, `label_blocked` |

## The standing constraints

1. **Hard blockers gate**, batch N+1 after the last blocker's; closed blockers
   never gate, an in-flight one gates and is named as in flight.
2. **Soft deps order, never gate.** Resolution is the forge's: a target the
   previous plan saw open and the forge no longer lists is closed and resolved;
   an open undelivered one is named; with an unreadable open set the state is
   `unknown` — never assumed resolved, never invented as an orphan.
3. **One lane per surface**, soft-ordered inside the lane; a tree-root token
   joins every declared child lane so a broad issue never runs beside it.
4. **In flight is evidence** (rule 5's `launched[]`): a merged or parked unit
   doc is not an in-flight unit, and the unit occupies every surface it declares.
5. **A hold label wins** over every other status (`label_blocked[]`).
6. **Parallel means no shared file.** Two issues the plan presents as running
   together that rewrite one file are a `file-overlap` finding. Claims are the
   paths the body declares plus the ones the branch rewrites; a directory or a
   glob claims nothing. A batched issue with no branch contributes only what it
   declares — an overlap on a file nobody declared is invisible, a declared
   limit, not a guess.
7. **Size hints are facts**; the lane count is the consumer's.

## The dependency parser (fail-closed, with a recovery pass)

`extractProseDependencies` parses **only** the declared table
(`| Depends on | Kind | Why |`); any other shape is refused and declared
(`unavailable-prose-dependencies-issue-<n>-<parsed>-of-<total>-rows-…`).
Beside it `extractPartialDependencies` recovers what the table still
attributes: a row contributes only when a cell is *exactly* a kind token
(`soft`, `hard`, `blocked`, `block`, `blocked-by`, `blocks`, `depends on`) and
the deps are the `#\d+` in its other cells. A row naming no kind contributes
nothing, so #307's `| Feature | Issue |` tables — the twelve false findings of
issue #460 — still parse to zero.

## The state file (the single write path)

`.agentic-workflow/batches.json` (under `--root`; untracked, durable).
**Version 3** keys every claim by `(issue, lane)`:

```json
{
  "version": 3,
  "written_at": "<ISO instant>",
  "source_revision": "<sha>",
  "claimed": {
    "487|scripts": { "batch": 1, "lane": "scripts", "first_seen": "…", "last_seen": "…", "worktree": "fix/487-secret-scan-gate" }
  },
  "seen": {
    "<issue-number>": { "title": "…", "batch": 1, "lane": "skills/x", "first_seen": "…", "last_seen": "…" }
  }
}
```

A claim is live only for the pair it was made in: an issue in four lanes and
claimed in `scripts` reads unclaimed in the other three. A claim that no longer
stands is reported once as `stale-claim` and pruned in the same run on any of: a
pre-v3 bare-number key (no migration — a guessed lane is the bug); a
`MERGED`/`CLOSED` PR or merged branch; an issue closed since; a `launched_at`
claim whose lane has no worktree, branch or PR left; or a `last_seen` older than
**48 hours** against the run instant. A dormant claim keeps its old `last_seen`,
so it ages out and never resurrects a stale pair.

`seen` is the last-seen open-issue set, and it is what makes a soft-dep target
*closed* rather than merely absent. `--mark-launched <n>` records an out-of-band
launch under the lane the issue was already claimed in (else `general`); it is
mutually exclusive with `--no-state` (exit 2). The document carries **no
timestamp**: the 48-hour rule is decided against the run instant the CLI
supplies, so the same inputs produce a byte-identical envelope.

## CLI

```
bun scripts/batch-scheduler.mjs [--root <dir>] [--issues-file <json>]
                                [--state <path> | --no-state]
                                [--remote <url>] [--mark-launched <n>] [--json-only]
```

`node` is the fallback. `--remote <url>` names the forge for the three reads
(issues, relations, PRs). Exit codes: `0` plan printed (degradations are
reported, not fatal); `1` the document failed its own `batch-plan@3` validation
(a producer bug); `2` usage error. One call per dimension, never per issue.
