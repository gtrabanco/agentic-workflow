---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(journal): write fragments from fields, and check the carrier before merge

The fragment carrier had one enforcement point — `parseFragmentName` at
aggregation time — and it fired hours or days after the fragment had already
merged. Four malformed fragments across 2026-11-07/08 (a writer label in the
kind slot, a body without its terminator) each blocked the weekly aggregation
and the publish gate's `S15`, because the only writer a model had was "compose
the name and paste the bytes".

`journal write` takes the only thing a model can honestly supply — `--summary`,
`--decisions`, `--next`, or a rendered `--content -` block on stdin — plus
`--kind` and an optional `--session`, and computes the rest: the UTC second, the
branch from git, the session slug, the block bytes from the one narrative
renderer, and the name from the grammar's owner. It self-validates the name
before writing and lands the fragment with an exclusive create, so a collision
is refused instead of overwritten. The skill's step 4 and the extension's
`/log-session` directive both name it; the prose path and the code path no longer
describe different acts.

`journal aggregate --check` is the same validation as a read-only carrier lint:
it lists every non-conforming fragment, moves no byte, and runs in the local
gate's offline pre-push subset, so a malformed fragment fails its own PR instead
of the weekly run. `session-close close` validates every fragment it is about to
commit through the same predicate — the close happens minutes after the mistake,
the gate hours later. The aggregator itself keeps its documented contract: it
validates the name's grammar and the body's shape and trusts the name.
