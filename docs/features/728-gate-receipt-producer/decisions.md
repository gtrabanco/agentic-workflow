# Decisions — feature/728-gate-receipt-producer

Owner decisions taken at the cut, each with its authority. `## Specs` in `SPEC.md`
carries the requester's verbatim words; this file carries what was **decided**
between them.

## D1 — The producer lands at the executor (S5), not at the hook (S6)

Issue [#728](https://github.com/gtrabanco/agentic-workflow/issues/728) offers two
routes and names the first "the minimal one". Two measurements decide it:

- S6's premise is a pre-commit gate. This repository installs **no** pre-commit
  hook (`ls .husky` → absent) and `scripts/local-gate.mjs --install-hook` writes
  `.git/hooks/pre-push`, which runs *after* the commits a review audits — a
  receipt produced there would be young only until the next commit.
- The consumer that blocks (`review-verify`, `audit-pr`) reads the receipt at
  the head under review, so the run must be recorded by the step that owns that
  head. That step is the executor's verification gate.

S6 is therefore a **non-goal**, recorded with its evidence, not silently dropped.

## D2 — The producer is one command, and it replaces the gate run

`runner gate-receipt run` already executes the project's gate and writes the
receipt (`packages/agentic-workflow/src/gate-receipt/index.mjs`). The lane does
not gain a second invocation: it runs its gate **as** the producer, so the cost
is the same gate run it always paid. No `record --from <result>` mode is added —
that would be a second, forgettable step.

## D3 — The precondition is declared, never assumed

Measured at this cut (`mktemp -d` fixtures, `PE-012`–`PE-014`): a gate script that
**rejects** `--json <path>` makes `gate-receipt run` exit with the gate's own
non-zero code, and one that **ignores** the flag writes a `degraded` receipt and
exits 1. Routing an arbitrary project's gate through the producer can therefore
turn a green gate red. The producer is used only where the project declares a
gate script that writes `local-gate-result@1`; a project without one runs its
declared gate directly and the mark records why no receipt exists. The
declaration lands in `template/AGENTS.md` (the guide a project fills in), and
this repository already satisfies it: its gate is `scripts/local-gate.mjs`,
which publishes the handshake (`GATE_RESULT_SCHEMA`).

## D4 — The ordering law is the fix's real content

The receipt's manifest signs 2,410 files in this checkout (`bun scripts/gate-receipt.mjs
run -- --only secret-scan` → `manifest.entries`), and `docs/**` is inside the
closure, so **any** later doc row, evidence line or roadmap write stales it.
Field unit fix-288 recorded three green gate runs and still shipped a stale
receipt for exactly this reason. So the rule is not "run the producer" but "the
producer is the step's **last signed-byte write**, immediately before the commit
that closes the step". A receipt written before a signed-byte write is stale the
moment the write lands.

## D5 — The reviewer produces too

`review-change` records a `GATE-RAN` mark for the gate run the review performs
(`references/PERSIST_AND_DECIDE.md`) and its own ledger append is a signed-byte
write. Leaving the reviewer out would re-open the loop one step later: the
reviewer's rows would stale the executor's receipt before `audit-pr` reads it. So
the reviewer's run is produced after its append and before its commit, and the
four gate-running step owners are `execute-phase`, `fold-findings`, `unit-lane`
and `review-change`.

## D6 — Consumption is unchanged, and the mark's slot is filled — not read

The consumer half already exists and is correct: `review-verify` and `audit-pr`
read `runner gate-receipt verify` and never re-run the gate. Nothing there gains
a behavior; `review-verify` gains one clause naming the owner a re-route goes to,
so "routed to `runner gate-receipt run`" names a step that actually performs it.

`gate-ran@1` reserved a trailing `manifest <sha>` slot ("reserved, not yet
consumed"). The producer **fills** it with the receipt's `manifest.digest`. No
tool reads it in this unit: a cross-check between the mark's digest and the
receipt is a new consumer with its own failure states, and it is not what S2–S5
ask for.

## D7 — The executable half is the routing pin, and it is honest about its scope

Prose is the product here (the executor is an agent reading `SKILL.md`), so the
rule's executable expression is a deterministic drift gate:
`scripts/gate-producer-drift.mjs` + its sibling suite. It reads fixed tokens and
the owner block's fields — it pins **routing** (a step owner cannot be shipped
with zero citations, the owner's fields cannot vanish, the template cannot lose
its declared handshake, the producer's default gate cannot silently rename), and
it does **not** pretend to prove at runtime that an agent ran the producer. The
behavioral half the producer rests on is already pinned by
`scripts/gate-receipt.test.mjs` and is untouched here.

## D8 — No CLI, schema or contract behavior changes

`gate-receipt run`'s exit contract, the `gate-receipt@1` shape, the freshness
predicate and the merge gate stay byte-identical. The one source edit is an
additive named export (`GATE_DEFAULT_SCRIPT`) so the drift gate reads the
default instead of restating it (`IR11`).

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/gate-producer-drift.test.mjs | P1 | 2026-11-26 | execute-phase | the new gate's sibling suite is created by this unit and is the frozen-failure corpus P1 lands alone; the test-file class's freeze does not cover its own first landing
```
