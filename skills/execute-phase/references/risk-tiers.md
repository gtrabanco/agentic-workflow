# Risk tiers — ceremony proportional to risk

> Owner of the `risk-tier-verdict@1` grammar and of the per-tier ceremony table.
> Unit #360, direction #307; the roadmap row is the issue's canonical link.
> Every other file cites this one; nothing restates the table.

The tier is **computed, never chosen**. `packages/agentic-workflow/src/runner/risk-tiers.mjs` (and the closed
ceremony CLI's `tier classify`, which wraps it) reads repo evidence — the changed
paths, their contents, and nothing else — and emits one of the published tiers.
No skill, phase or model may decide a tier, and no input accepts one: the tier
arrives as a verdict to read.

```text
risk-tier-verdict@1
field | shape | what it holds
tier | passive | standard | high | the ceremony the change owes (machine: `RISK_TIER_KINDS`)
reason | <one sentence> | why the classifier answered what it answered
reason_kind | no-executable-effect | comment-only | executable-content | named-high-risk | empty-change | the closed reason (machine: `RISK_TIER_REASONS`)
signals | auth | security | destructive | ci | publish | content | the *named* item that raised `high` (machine: `RISK_TIER_SIGNAL_KINDS`)
task_size | {understood, contained_risk, resumable_from_diff, ceremony, verification} | the Task Size the verdict implies
size_tier | prose | small | large | the change's size, a **different fact** from the tier (machine: `SIZE_TIER_KINDS`)
changed_paths | <n> | how many paths the verdict saw — reported, never read as a reason
```

## Task Size

**Task Size = Understood + Contained risk + Resumable-from-diff** (the "resume
test"). **File counts never decide**: four hundred prose files are `passive`, one
auth file is `high`. The count is *reported* by the classifier and *read* by
nobody.

| Signal | `passive` | `standard` | `high` |
|---|---|---|---|
| Understood | yes — a prose change has one reading | yes | yes, once a high-risk item is named |
| Contained risk | contained | contained | named: the `signals[]` entry *is* the containment statement |
| Resumable-from-diff | yes | yes | yes |

Ambiguity fails closed **upward**: an empty scope, an unknown path class or a
mixed change never falls to `passive`. A change the classifier cannot prove inert
pays the ceremony that proves it.

## Two callers, two scopes (and when their answers may differ)

The classifier is a **pure function of `path → contents`**: no git, no branch, no
history, no clock. Two different directories whose files carry the same relative
paths and the same bytes classify **identically** — a scratch copy is not a
special case. *Where* the tree lives never changes the verdict.

What changes it is **which paths you hand it**, and there are two callers:

| Caller | Scope it classifies |
|---|---|
| `workflow-status` (the sensor) | the branch's whole change: `git diff --name-only` against the merge base, plus every uncommitted path |
| `ceremony tier classify --paths a,b` | exactly the paths passed |

So the two answers **agree whenever the scopes agree**, and may diverge when they
do not: a long-lived branch with commits from earlier sessions classifies wider
through the sensor than through a `--paths` call naming only today's files. That
is a scope difference, never a content difference — the same scope always yields
the same tier, byte for byte.

A caller that wants the sensor's answer passes the sensor's scope; a caller that
wants "what am I about to touch" passes `--paths`. Neither may report the other's
answer as its own.

Both callers pass the same **repo-rooted resolver**, so a relative import is
followed identically on either route — the resolver is what keeps the two answers
byte-identical for one scope. A caller that supplies none analyses the change
set's own files only and never guesses a capability.

## The three tiers

| Tier | What it owes | Verification |
|---|---|---|
| `passive` | inline work, **no unit doc ceremony**: no unit folder, no phases, no evidence table, no review pass | structural readback (below) |
| `standard` | the current unit-doc ceremony: the unit doc with its `## Tasks` phases, `## Log` evidence lines, and the declared gates | the project's gates |
| `high` | the unit-doc ceremony **plus** a named high-risk item in the unit doc's `Impact`/`Non-goals` half, and the full review pass | `/review-change`, then `/audit-pr` before merge |

`high` is never bare: the verdict carries at least one `signals[]` entry, and the
unit doc repeats it verbatim. A `high` with no named item is a classifier bug, not
a tier.

## What makes a change destructive (capability, not spelling)

`destructive` is the one signal that is not path-shaped, and it is decided by
what a file **can do**, never by a list of operation names:
`packages/agentic-workflow/src/runner/capabilities.mjs` reads the imports a file declares and the effects they
enable — per language family (`js`, `py`, `sh`), resolved through a catalogue
keyed by provider (`node:fs/promises` *can* remove entries), with a relative
import followed one module deep — and the classifier asks it. A removal is caught
by its capability, so an unlisted spelling, an alias, a namespace member, a
destructured `require`, a language the table never had, or a helper one module
away all raise the signal. A guarded scratch cleanup (`recursive` **and** `force`)
is hygiene, not a removal; a script that embeds a shell command or a SQL statement
is a destructive surface whatever its own language. The catalogue is that rule's
one home: this file names no operation.

## The passive carrier

A passive unit records its readback in `docs/passive/<id>.md`: a file, not a unit
doc — no phases, no evidence table, no review pass. It carries exactly five
fields and nothing else:

```text
passive-record@1
id | `<YYYY-MM-DD>-<slug>` | the passive unit's stable id
tier | passive | the verdict as the classifier emitted it
paths | <comma-separated repo-relative paths> | the readback's own scope
readback | <what was read and what it showed> | the structural readback: every changed file read and classified
gate | `<command>` · exit <code> | the deterministic gate that ran beside it
```

The readback is *structural*: every changed path is read and classified against
the classifier's own table, and the sentence says what it showed. A passive unit
that turns out to touch executable content is not passive — it is routed to the
standard ceremony, never patched into passivity.

The record's **only writer** is `ceremony passive add` (`packages/agentic-workflow/src/runner/ceremony/passive.mjs`):
never `echo`, `sed -i` or a hand edit. The id is the file name, so a second `add`
on a taken id is a ceremonial block (exit 2) and two passive units cannot collide;
`add` records the tier the classifier computed for the record's own `--paths`, and
refuses a scope it does not call `passive` (exit 2, `route: standard-ceremony`)
rather than recording a false claim. `passive read --id <id>` answers one record
and `passive list` enumerates them, both as JSON on stdout.

## Where the tier is read

| Consumer | Reads | Never |
|---|---|---|
| `unit-lane` triage | the verdict, to route the unit (`passive` → the carrier, otherwise the unit doc) | re-derives or overrides it |
| `execute-phase` | `task_size.ceremony` + `task_size.verification` for the work it is executing | lets a phase lower its own tier |
| `workflow-status` | the classifier's verdict for the branch in scope, as `detail.risk_tier` | computes a tier of its own |
| any driver | the ceremony CLI's JSON | accepts a tier from a prompt |
