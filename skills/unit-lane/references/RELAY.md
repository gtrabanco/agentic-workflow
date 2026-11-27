# Relay legs

The lane composes with **pi-web Relay**: a delivery unit's triaged phases run as
**Relay legs**, each in a fresh session, with the unit doc as the durable plan
and this lane as the conductor. This file owns the leg contract — the packet the
lane bootstraps, what a leg does, and the coherence review that replaces the
lane's inline pre-PR review when pi-web is present.

pi-web owns Relay. This file never defines the packet format, the tool, or the
method: `@jmfederico/pi-relay`'s `relay` and `relay-runner` skills own those, and
`dispatch_relay` is theirs. Read them when a leg runs; this file says what the
*lane* requires on top of them.

## When this applies

- A code unit (feature or fix) with at least one execution phase, in a session
  where pi-web is present.
- Without pi-web the lane is unchanged: it hands off `/execute-phase <NN> P<k>`
  one phase per turn (§Degradation).
- Whether pi-web, its session daemon and the Relay package are actually there is
  the tool doctor's `relay` row, never a local guess: `runner doctor --check relay`
  prints that one row, whose status is the answer (`ok`, `unreachable`, `missing`,
  `not-applicable`) and whose advisory names the missing half and the route below.

## Ownership

agentic-workflow owns the **plan**; Relay owns the **continuity**. Nothing else
divides it:

| Owner | Artifact | Carries |
|---|---|---|
| the unit doc | `docs/features/<NN>-<slug>/SPEC.md` | requirements, acceptance criteria, tasks, the findings table, the append-only log, the review verdict |
| the charter | `.pi-web/relays/<slug>/charter.md` | the goal: a pointer to the unit doc and its acceptance criteria |
| the baton | `.pi-web/relays/<slug>/status.md` | the position: state, leg cursor, phase cursor, evidence pointers, gaps, checks, blockers |
| the log | `.pi-web/relays/<slug>/log.md` | the history: one entry per leg |
| the decisions | `.pi-web/relays/<slug>/decisions.md` | optional consequential decisions and rejected approaches from execution |

The unit doc stays authoritative. A packet never becomes the second home of a
requirement, a step, a gate or an evidence row.

## Packet

`runner relay check <unit>` validates what follows; the mode is
read-only and names the fault it found. pi-web validates the same three
documents on dispatch with its own bounds (a non-empty UTF-8 regular file of at
most 262,144 bytes each), so a packet the checker passes is a packet the tool can
read.

The checker has one owner — `packages/agentic-workflow/src/relay/Packet.mjs` —
and two entry points that print the identical block: the workspace's script
(`runner relay …`, present in a project that adopted the
workflow) and the crate (`runner relay …`, present wherever
`@gtrabanco/agentic-workflow` is installed). A project carrying only the crate
runs the same five modes and needs no `scripts/` at all.

### Charter — a pointer, never a copy

The charter names `docs/features/<NN>-<slug>/SPEC.md` (a named unit doc must
exist) and points at its acceptance criteria; that section, hashed at triage, is
the finish line. It carries no `P<n> —` task bullet, no `(validator: …)` span
and no plan, gates, steps or evidence heading. Scope boundaries are the unit
doc's non-goals, referenced, not restated.

### Baton — position, not content

```
# Baton — <slug>

State: Active
Legs: 1 → 2
Phase: P2
Location: branch `feat/<NN>-<slug>` @ <40-hex>
Progress: <one line: what the last leg finished and left>
Evidence: `<unit dir>/SPEC.md` · its `## Log` `E` lines, never copied here
Gaps: <what remains until the finish line>
Checks: `<command>` · exit <code>
Review: pending | attempted <n> — <result> | receipt current at <40-hex>[ · pr <url>] | receipt stale at <40-hex>
Blockers: none | <the human-dependent blocker>
```

The state is one of `Draft — awaiting approval` (not dispatched), `Active`,
`Complete`, `Needs help`. `Legs:` carries pi-web leg identities on both sides
(`1 → 2`, `none → 1`); `Phase:` carries the `P<n>` this leg starts, or `done`.
The baton **points**: it never carries an evidence table (`| AC |` row) or a
plan or evidence heading — the checker refuses a duplicate.

The machine reads the shape (`relay-status@1`):

```text
relay-status@1
line | shape | what it orders
State | State: <Draft — awaiting approval; not dispatched | Active | Complete | Needs help> | pi-web relay-runner's closed state set; the head is the value
Legs | Legs: <leg> → <leg> | the last completed leg and the next one; `none` before leg 1
Phase | Phase: P<n> | done | the lane's phase cursor: this leg's phase, or the unit has none left
Review | Review: receipt current at <40-hex>[ · pr <url>] | the receipt boundary's only input: `current` binds the PR head, `receipt stale at`/`pending`/`attempted <n> — <result>`/absent never does
Evidence | Evidence: <path> · <section> | a pointer to the unit doc's evidence carrier, never a copy
```

### Log and decisions

`log.md` appends one `## Leg <id>` entry per leg: what changed, the commit, the
checks with their real results, and the handoff or stop. `decisions.md` is
**optional** and stays minimal: consequential decisions and rejected approaches
from execution worth remembering beyond the unit doc's own `D1`, `D2` rows. It is
never required, never a checklist item, and never a second plan.

## Bootstrap — after the plan, before the first leg

The plan step is unchanged (`/unit-lane --from-issue <N>` or `/unit-lane
<NN-slug>`): the triaged unit doc with its phases, acceptance criteria, evidence
carrier and gates. Then:

1. Create `.pi-web/relays/<slug>/` with the three documents. The charter is the
   pointer above; the baton is `State: Draft — awaiting approval`, `Legs: none →
   1`, `Phase: P<n>` for the first unfinished phase; the log carries the
   bootstrap entry.
2. Validate it: `runner relay check <unit>` exits 0 (and
   `budget <unit>` for the handover ceiling).
3. **ASK the owner, then STOP for the answer.** With pi-web present and the
   packet `bootstrap-needed` or `draft`, the turn's next action is one question
   with exactly two answers — **relay legs** (dispatch leg 1) or **inline**
   (`/execute-phase <NN-slug> P<k>`) — and the turn ends there. The question
   states the owner's recorded default (`relay.seam`, §The seam's default); the
   default preselects the answer and never replaces it. This step is required: a
   session that has read `relay: bootstrap-needed` or `relay: draft` and stops
   without asking has skipped the contract, and one that hands off inline
   without the answer has invented a state this file does not define.
4. On the answer: **relay** moves the baton to `State: Active`, seeds leg 1 and
   makes `dispatch_relay(packet: "<packet>", leg: "1")` the turn's final
   operational action; **inline** is a recorded owner choice, after which the
   per-phase hand-off is the turn.

The router prints the same instruction at the hand-off (`relay: bootstrap-needed`
or `relay: draft`, plus a `relay-seam:` line carrying the resolved default and a
`relay-next:` line). The bootstrap line names the packet path, the unit doc, both
answers, the stop and leg `"1"`; the draft line names the answers, the stop and
the approval step that precedes leg `"1"`.

## The seam's default — `relay.seam`

The owner may record which answer the seam's question preselects. One key, in the
unified config (`runner config get relay.seam`):

| Value | What it does | What it never does |
|---|---|---|
| `ask` (shipped default, and what an absent key means) | the question is printed with no preselection | — |
| `inline` | the question is printed with the inline per-phase answer preselected | skip the question, dispatch anything, or bypass pi-web's own `dispatch_relay` human-consent gate |

There is no `auto`: a value that dispatched or degraded on its own is the policy
this seam exists to remove, and the host's dispatch consent is not the lane's to
grant. The router is the key's reader (`relay-seam:` in its addendum); the lane
reads that line, never the config file.

## A leg

A leg reads `charter.md` and `status.md`, then the workflow skills it needs
(`unit-lane` for planning and close-out; `execute-phase` for the phase), and runs
**one** triaged phase under the executor's own contract — gate → commit →
evidence row → progress line. It never runs a second phase in the same session:
one leg is one phase, exactly the boundary `/execute-phase <NN> P<k>` already
holds.

Then, in this order: commit the phase, record the evidence row and the progress
line in the unit doc, refresh the baton, append the log entry, and hand off with
`leg: <k+1>` as the session's **final operational action**. Nothing follows a
dispatch but a short summary.

**Leg count = execution phases + coherence-review legs; no open-ended chain.**
The review is bounded (§Coherence review), so the chain terminates: the last
phase's leg hands off the review leg, and the review leg either completes the
unit or stops with `Needs help`.

## Coherence review — the pre-PR gate

When a leg finishes substantive work, the final review does **not** pass through
it. It hands off to a fresh leg, and a fresh leg performs the review instead of
passing it on again. The reviewer cannot trust what is not written down, which
is the property this gate exists for: the author's context is gone.

The checklist is positive verification — it confirms the criteria hold, it does
not hunt for faults:

- **(a) log/Progress entries ↔ actual diff** — every entry the unit doc records
  names work the diff contains, and no substantive change is unrecorded.
- **(b) decisions ↔ plan ↔ ACs** — the decisions taken are consistent with the
  frozen plan and do not silently move an acceptance criterion.
- **(c) re-run each Evidence row** — every `E` line reproduces at the head: the
  command, its exit code, its output. A row that does not reproduce is the
  finding.
- **(d) AC-section hash unchanged from triage** — the acceptance-criteria
  section's hash still matches the `ac-hash:` frontmatter line the design step
  recorded at triage (owner: `DESIGN.md` §Fixed output contract). A changed AC
  is a plan repair, never a review edit.

Output is the **existing** `REVIEW-VERDICT` block in the unit doc, whose grammar
and meaning are owned by [`REVIEW.md`](REVIEW.md) — this file never restates the
block. Findings are classified material or report-note there too.

Attempts are bounded by `relay-runner`: the initial review plus at most two
post-correction reviews. If the third attempt still has blockers, the baton
records `Needs help` and the chain stops — no further review or correction leg.

### Receipt boundary — the leg that ends the relay owes the ladder

The coherence verdict is evidence, not a receipt: it **emits no receipt**,
because a receipt binds an open PR's head and the lane gate runs before the PR
exists. A `REVIEW-VERDICT: PASS` never satisfies `runner review-receipt verify
--pr <N>`, and a `## Final review receipt` heading written into the unit doc is
not a receipt either — it is prose about one.

So the review-receipt lane needs an owner after the lane session has ended, and
that owner is **the relay's last leg** (or the leg that opens the PR): it ends by
running the lane's close-out ladder, and never records "awaiting owner decision"
in place of it. Coherence PASS is a *state of the evidence*; a receipt current at
the PR head is a *state of the receipt*. Two states, two names, never one word
for both.

```sh
runner relay closeout <unit>   # the ladder: the receipt verdict + the → Next: block
```

The mode is read-only and offline — it reads the baton, never the forge — and its
block is the machine shape below:

```text
relay-closeout@1
# produced-by: `runner relay closeout <unit>` (the same command the crate's own bin dispatches)
# input: the packet's status.md — `State:` and `Review:`
field | shape | what it orders
receipt | current | stale | not-current | absent | the receipt's state, read from the `Review:` line; `stale` names another head, `not-current` records no receipt, `absent` means the line is missing
precondition | a current review-change receipt at the PR head | none — the review receipt is missing or stale | none — the Review line records no PR url | what the merge gate rests on, stated before the gate is named
next | → Next: /review-change <NN-slug> | → Next: /audit-pr <PR-url> | the one closing block: the receipt's owner while the gate's precondition is unmet (receipt not current, or its line records no PR url), the merge gate only once it is
```

Rules the block encodes:

- A `Complete` baton **must** carry a current receipt or `relay check` refuses it
  (`status.md: a Complete verdict carries no current review receipt`). Silence is
  never current: a missing `Review:` line is a fault, not a default.
- `/audit-pr` is never printed before its precondition exists. The `→ Next:` line
  carries `/review-change` alone while the receipt is missing, stale or
  unrecorded, and `/audit-pr <PR-url>` only when the receipt verifies current —
  the PR url comes from the same `Review:` line the leg recorded. A receipt that
  verifies current but records no url is not routable either: the block states
  `precondition: none — the Review line records no PR url` and still routes to
  `/review-change`.
- The ladder runs when the relay is `Complete`. Before that a leg still owes its
  phase, so the mode refuses rather than routing one.
- The receipt itself is `/review-change`'s to post at the PR head; this boundary
  reads the state it recorded, and never posts, edits or clears a receipt.

## Model routing

The leg's tier comes from the catalog — one source — and the operator's model
profile still picks the concrete model:

```sh
runner relay tiers <unit>   # execute + coherence-review tiers
```

The tiers are not declared on this page: they are the **catalog's**, read for the
unit's `implement` and `review` steps from
`packages/agentic-workflow/src/runner/catalog.json` by the command above — the
same source `unit-lane` names.

Pass the tier's model with the dispatch (`model`, `thinkingLevel`) only when the
operator instructed it; otherwise omit both and inherit. Mechanical phases are
the cheap tier by decision; the coherence review and any adversarial pass are the
strong tier, and the review-authority rule (never weaker than the author, with
the stated inline degrade as its only escape) is
[`ORCHESTRATE.md`](ORCHESTRATE.md)'s — cited here, never re-worded.

## Post-PR

Unchanged, in this order: `/review-change` (isolated passes, receipt) → `/audit-pr`
(merge gate). Relay replaces the lane's inline pre-PR review only; the formal
review and the merge gate keep their close-out ordering and their receipt.

## Degradation

`relay: unavailable` is the **only** degradation this contract defines, and it
means pi-web is genuinely absent. Without pi-web the dispatch fails before
dispatching (`Relay dispatch requires PI WEB's session dispatch bridge …`); no
session is created and no work is lost. The lane then degrades to the existing
per-phase hand-off:

```
→ Next: /execute-phase <NN-slug> P<k> (tier: <tier>)
```

A pi-web-present packet in `bootstrap-needed` or `draft` is **not a degradation**:
that state is §Bootstrap step 3's question, and the answer is the owner's. The
per-phase hand-off above is a response to `relay: unavailable` — never a fallback
a conductor invents while the relay is present and unapproved.

The router says why (`relay: unavailable — …`) and keeps the per-phase command
printed. Relay is an enhancement of the seam, never a hard dependency: nothing in
this repository requires a pi-web session, and every packet is inspected by a
read-only checker rather than by a dispatcher.

Two readings answer "is Relay available here" without a packet: the router's
`relay:` line for this unit's session, and the doctor's `relay` row for the
environment. `runner doctor --check relay` prints that row — the session marker,
the daemon endpoint PI WEB itself resolves, and the installed `@jmfederico/pi-relay`
with its two skills — and it reports the session-dispatch bridge as the host's own
question (`observable: false`) rather than as a probed fact. It never dispatches,
so reading it costs nothing and decides nothing about consent.

## Relationship to other units

| Unit | Relationship |
|---|---|
| issue #293 D1/D3/D4 | closed structurally: this seam is D1/D3/D4; D2 (ordered `/audit-pr`) is untouched |
| issue #260 | complementary: #260 puts atomic *work* on cheap free-context subagents inside a leg; a leg puts *phases* on fresh contexts across sessions |
| issue #201 | a different layer: #201's `passes` table governs passes spawned inside a leg, the leg's own `model` governs the leg |
| issue #174 | equivalence, not dependency: a leg with a maintained baton is a state-flow episode whose state is materialized on disk (inspectable in pi-web's Relays panel) |
| issue #294 | this unit's issue |

## Checks

| What | Command | Outcome |
|---|---|---|
| packet valid, charter a pointer, baton a position | `runner relay check <unit>` | exit 0, `verdict: PASS` |
| handover within the ceiling | `runner relay budget <unit>` | exit 0, `measured` under `ceiling` |
| leg tiers from the catalog | `runner relay tiers <unit>` | exit 0, `execute` + `coherence-review` |
| obligations closed before handoff | `runner relay obligations <unit>` | exit 0, `open: 0` |
| the close-out ladder, and the receipt the merge gate rests on | `runner relay closeout <unit>` | exit 0, one `→ Next:` line and its `precondition` |
| the lane's context stays inside its budgets | `runner skill-context` | exit 0 |

## Forbidden

- Never dispatch without the human's approval of the goal and boundaries.
- Never hand off inline while pi-web is present and the packet is
  `bootstrap-needed` or `draft` without the owner's answer: that state is
  §Bootstrap step 3, and only `relay: unavailable` degrades.
- Never restate the plan, a gate, an evidence row or an acceptance criterion in
  the packet — the unit doc is the only copy.
- Never chain legs past the bounded review (no open-ended Relay).
- Never treat the coherence verdict as the merge gate's receipt.
- Never run a second phase in the leg that already ran one.
- Never write a packet field pi-web does not read: the three anchors and
  `decisions.md` are the whole shape.
