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

`scripts/relay-packet.mjs check <unit>` validates what follows; the mode is
read-only and names the fault it found. pi-web validates the same three
documents on dispatch with its own bounds (a non-empty UTF-8 regular file of at
most 262,144 bytes each), so a packet the checker passes is a packet the tool can
read.

The checker has one owner — `packages/agentic-workflow/src/relay/Packet.mjs` —
and two entry points that print the identical block: the workspace's script
(`bun scripts/relay-packet.mjs …`, present in a project that adopted the
workflow) and the crate (`agentic-workflow relay …`, present wherever
`@gtrabanco/agentic-workflow` is installed). A project carrying only the crate
runs the same four modes and needs no `scripts/` at all.

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
Review: pending | attempted <n> — <result>
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
2. Validate it: `bun scripts/relay-packet.mjs check <unit>` exits 0 (and
   `budget <unit>` for the handover ceiling).
3. **Human approval** is required before any dispatch. The baton moves to
   `State: Active` and leg 1 is seeded; drafting a packet is allowed before
   approval, dispatch is not.

The router prints the same instruction at the hand-off (`relay: bootstrap-needed`
plus a `relay-next:` line naming the packet path, the unit doc, leg `"1"` and the
leg count).

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

### Receipt boundary

The coherence verdict is evidence, not a receipt: it **emits no receipt**,
because a receipt binds an open PR's head and the lane gate runs before the PR
exists. After the PR opens, the lane's close-out is unchanged — `/review-change`
posts the SHA-bound receipt and `/audit-pr` is the terminal merge gate; a
`REVIEW-VERDICT: PASS` never satisfies `bun scripts/review-receipt.mjs verify
--pr <N>`.

## Model routing

The leg's tier comes from the catalog — one source — and the operator's model
profile still picks the concrete model:

```sh
bun scripts/relay-packet.mjs tiers <unit>   # execute + coherence-review tiers
```

| Leg | Catalog step | Tier |
|---|---|---|
| execution phase | `implement` | `cheap` |
| coherence review | `review` | `strong` |

Pass the tier's model with the dispatch (`model`, `thinkingLevel`) only when the
operator instructed it; otherwise omit both and inherit. Mechanical phases are
the cheap tier by decision; the coherence review and any adversarial pass are the
strong tier, and reviewing with a weaker model than the author stays forbidden.

## Post-PR

Unchanged, in this order: `/review-change` (isolated passes, receipt) → `/audit-pr`
(merge gate). Relay replaces the lane's inline pre-PR review only; the formal
review and the merge gate keep their close-out ordering and their receipt.

## Degradation

Without pi-web the dispatch fails before dispatching (`Relay dispatch requires PI
WEB's session dispatch bridge …`); no session is created and no work is lost.
The lane then degrades to the existing per-phase hand-off:

```
→ Next: /execute-phase <NN-slug> P<k> (tier: <tier>)
```

The router says why (`relay: unavailable — …`) and keeps the per-phase command
printed. Relay is an enhancement of the seam, never a hard dependency: nothing in
this repository requires a pi-web session, and every packet is inspected by a
read-only checker rather than by a dispatcher.

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
| packet valid, charter a pointer, baton a position | `bun scripts/relay-packet.mjs check <unit>` | exit 0, `verdict: PASS` |
| handover within the ceiling | `bun scripts/relay-packet.mjs budget <unit>` | exit 0, `measured` under `ceiling` |
| leg tiers from the catalog | `bun scripts/relay-packet.mjs tiers <unit>` | exit 0, `execute` + `coherence-review` |
| obligations closed before handoff | `bun scripts/relay-packet.mjs obligations <unit>` | exit 0, `open: 0` |
| the lane's context stays inside its budgets | `bun scripts/check-skill-context.mjs` | exit 0 |

## Forbidden

- Never dispatch without the human's approval of the goal and boundaries.
- Never restate the plan, a gate, an evidence row or an acceptance criterion in
  the packet — the unit doc is the only copy.
- Never chain legs past the bounded review (no open-ended Relay).
- Never treat the coherence verdict as the merge gate's receipt.
- Never run a second phase in the leg that already ran one.
- Never write a packet field pi-web does not read: the three anchors and
  `decisions.md` are the whole shape.
