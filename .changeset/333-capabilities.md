---
"init-workspace": minor
---

fix(skills): the capability inventory is inferred from cited paths, asked when evidence is absent, and deleted when the project type excludes it

`init-workspace`'s bootstrap route gains a procedure where it had an intent:
`capability-inventory@1` orders six moves — classify the project, delete the rows
whose surface that project cannot carry (no question asked), infer `yes`/`partial`
/`no` only from a cited repository path, ask the remainder in one batched round
with the existence question before any state question, forbid a self-answered
state, and report the three outcomes. `capability-evidence@1` gives each of the
template's candidate rows the probes that prove each state, so no executor has to
invent a signal. The write route gains the gate the run lacked: no `<…>`
placeholder survives, every row carries a state and its evidence or an explicit
`unresolved — <question>`, and a file that fails is reported as a residual
instead of a seeded inventory. Upgrade mode points at the same procedure instead
of inheriting it by reference, and `template/docs/CAPABILITIES.md` now presents
its rows as candidates evaluated against the project rather than a floor to trim.
