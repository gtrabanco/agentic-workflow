# Loading ladder — what a session reads, and in what order

The documentation tree is not flat: a session reads its guide on every turn, a
reference only when its step runs, and an audit almost never. This page owns that
ordering, the balance rule behind it, and the one property of a file that a
prefix cache punishes when it is ignored — where the volatile bytes sit.

It does **not** own the model-level question (does this provider discount a
cached prefix at all?). That is `phase-batching@1`'s: its
`PHASE_BATCHING_CACHE_POSTURES` (`discounted`, `flat`, `unmeasured`) records the
posture per model, and a session may not assume `discounted`. This page assumes
nothing about it and states, for every claim below, which posture it depends on.

## The ladder

```text
loading-ladder@1
# tier order is the reading order: a session descends only as far as its task needs
tier | what loads | when | members
0-always | the guide: identity, precedence, the laws, the working rules, the documentation map | every turn of every session, before any action | AGENTS.md, the host guide's scaffold twin (template/AGENTS.md) for a target project
1-on-demand | the one owner a task names, plus the reference its step cites | once per task, when the step runs | docs/workflow/*.md, skills/*/references/*.md, the unit doc and its ledgers
2-rarely | the corpus a sweep or an audit reads, and history | on a measured trigger: a product audit, a forensic read, a resumed session | docs/audits/*, docs/research/*, docs/design/*, docs/passive/*, docs/features/*, docs/fix/*, docs/LOGS.md
```

Tier membership is not an accident of where a file lives: a doc is tier 0 only if
**every** session needs it before acting, tier 1 if the task's owner *names* it,
and tier 2 if only a trigger reaches it. The map in `AGENTS.md` § Documentation
map is the tier-1 index: a doc that appears nowhere in it is a tier-2 candidate
by construction, which is what the dead-doc lens of the audit reads.

## The balance rule

Always-loaded content is the **minimum** every session needs to act correctly:
identity, precedence, the inviolable laws, the working rules, and the map that
points at everything else. Nothing else earns tier 0 — and the test is measured
read-frequency, never a feeling that a rule "should" be loaded. A rule that a
session must obey on *every* turn belongs in the guide (`AGENTS.md`), not behind
a hop; everything else earns its place by being read when its task runs.

That rule has a cost the other direction too: the guide grows by addition, so
each addition is a re-pin of a machine block (below) — which is affordable only
because the volatile part is last.

## Per-file ordering: stable first, volatile last

A prompt cache keeps a **prefix**. When any byte of a file changes, everything
after that byte is re-read; everything before it is not. So within any file a
session loads whole, the regions must be ordered by how often they change:

1. identity and the rules that change by decision — deliberately slow;
2. prose that changes with a unit's findings;
3. **volatile machine blocks** — the ones a unit appends a row to: a
   `normative-surfaces@1` row, a `rendered-facts@1` claim, a `normalizer-inventory@1`
   entry.

The rule follows: a newly appended row must sit **after** the prose it would
otherwise invalidate. This page's own unit re-ordered the guide for exactly that
reason, and the receipt is `docs/fix/646-docs-skills-reconciliation/second-read.md`:
moving the three machine regions to the end grew the guide's stable prefix from
53% to 59% of its bytes, so a machine-region edit now invalidates about a tenth
less of the file. The exact byte counts live in that receipt, never here — a
number restated in prose is exactly the class `rendered-facts@1` exists to
refuse.

### The dedicated late-loaded file: evaluated, not adopted

The obvious next step — move the machine blocks into their own file a session
loads last — was measured and **rejected**. The blocks are read by gates
(`scripts/normative-drift.test.mjs`, `scripts/check-skill-context.mjs`,
`scripts/pre-execution-quality.test.mjs`), and three of them are normative
surfaces a session must obey while acting: splitting them out of the guide would
either make a law tier-1 (a hop, which `IR11` and the guide's own minimalism
decision forbid for a law) or leave the gate reading a file no session reads. The
re-order buys the same cache property at no cost in authority, so the blocks stay
inline and last. Recorded as the design decision; re-open it only with a
measurement showing a split keeps authority.

## Measuring it

The metric is bytes, not tokens — it is deterministic and needs no provider:

```sh
wc -c AGENTS.md                                     # tier 0
wc -c skills/unit-lane/SKILL.md skills/unit-lane/references/PLAN.md   # a typical lane step
```

For a **typical `unit-lane` task** (one triage-plus-plan pass, this repository),
the measured read is the guide plus the lane's own skill and plan reference, and
the guide is 59% of it (receipt: `second-read.md`). That is the whole reason tier
0 stays the minimum: every byte added there is paid on every task, while a
reference is paid only when its step runs.
