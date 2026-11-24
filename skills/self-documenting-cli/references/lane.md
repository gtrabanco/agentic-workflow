# Lane — moving a unit through its own state machine

A delivery unit has a state, and the lane's commands read that state instead of
you inferring it. The single most useful habit: **ask the router what is next
rather than deciding yourself.**

**Flag spelling is not here.** It is `runner help <subcommand>`.

## Ask the router first

`unit-route` reads a unit's own ledger and prints the route it takes now, plus
the next command. It is the lane's answer to "what do I do next", and it is
computed from the document, not guessed from a summary.

```text
unit-route <unit>  →  status · route · next · open row ids · review cycles
```

A route of `fold` means open findings exist. A route of `close-out` means the
merge gate is next. **Do not skip the router to save a call** — the thing you
skip is the reason the route is what it is.

## The ceremony CLI

`ceremony` is one object registry with one op per object, JSON on stdout, and a
uniform exit contract (**0** success · **1** usage error · **2** ceremonial
block). A block is not a crash: it is the ceremony telling you a discipline gate
did not pass.

The pattern that matters across every object:

```text
1. read the object's current state
2. perform the op
3. the op's own receipt is the evidence — capture it, never re-describe it
```

`ceremony pr` is the **only** family that reaches outside the process. Its
absence of a forge is a declared degradation (`gh-missing`,
`gh-unauthenticated`), and every other forge failure is a usage error — none of
them invent an API call. When the forge is unreachable, say so; do not
improvise a call.

## The Relay path

When a unit runs as Relay legs, `relay` is the offline half: it checks the
packet, measures the handover against its ceiling, reads each leg's tier,
verifies the obligations ledger is closed, and runs the close-out ladder. It
writes nothing. **The closing leg is where the receipt gets dropped** — run
`relay closeout` before claiming a Relay run is done.

## The receipts a merge gate reads

- **`gate-receipt`** — runs the gate and records it, then judges a recorded
  receipt `pass`/`stale`/`invalid`/`missing`. A receipt that cannot be re-derived
  is a blocker, never an assumption.
- **`review-receipt`** — emits, verifies and posts the SHA-bound review receipt.
- **`audit-pr-gate`** — the merge decision. It consumes the two above; it does
  not re-derive them, and it is the only thing entitled to say `MERGE-READY`.

Never restate a verdict from memory. Re-run it, or quote the receipt it printed.
