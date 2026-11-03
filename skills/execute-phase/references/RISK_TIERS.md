# Risk tiers — ceremony proportional to risk

> Owner of the `risk-tier-verdict@1` grammar and of the per-tier ceremony table.
> Issue [#360](https://github.com/gtrabanco/agentic-workflow/issues/360) /
> direction [#307](https://github.com/gtrabanco/agentic-workflow/issues/307).
> Every other file cites this one; nothing restates the table.

The tier is **computed, never chosen**. `scripts/risk-tiers.mjs` (and the closed
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

## The three tiers

| Tier | What it owes | Verification |
|---|---|---|
| `passive` | inline work, **no unit doc ceremony**: no unit folder, no phases, no evidence table, no review pass | structural readback (below) |
| `standard` | the current unit-doc ceremony: the unit doc with its `## Tasks` phases, `## Log` evidence lines, and the declared gates | the project's gates |
| `high` | the unit-doc ceremony **plus** a named high-risk item in the unit doc's `Impact`/`Non-goals` half, and the full review pass | `/review-change`, then `/audit-pr` before merge |

`high` is never bare: the verdict carries at least one `signals[]` entry, and the
unit doc repeats it verbatim. A `high` with no named item is a classifier bug, not
a tier.

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

## Where the tier is read

| Consumer | Reads | Never |
|---|---|---|
| `unit-lane` triage | the verdict, to route the unit (`passive` → the carrier, otherwise the unit doc) | re-derives or overrides it |
| `execute-phase` | `task_size.ceremony` + `task_size.verification` for the work it is executing | lets a phase lower its own tier |
| `workflow-status` | the classifier's verdict for the branch in scope, as `detail.risk_tier` | computes a tier of its own |
| any driver | the ceremony CLI's JSON | accepts a tier from a prompt |
