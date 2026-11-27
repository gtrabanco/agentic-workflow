# Decisions — fix/734-log-session-subcommand-shape

The unit's durable decision record. One row per decision, dated, with the
authority that made it and the reason it holds.

## D1 — route (a): the emitter learns the door's contract

2026-11-27. Authority: the owner's order (`## Log` L1), which adopts the issue's
recommendation. The directive renders the service alone in `subcommand` and the
operation as the first `args` entry, because the runner door forwards
`subcommand` as one argv token and `args` verbatim. Route (b) — splitting a
spaced `subcommand` in the door — is rejected: it would keep two valid forms of
one call forever, which `IR11` (one owner per vocabulary) exists to prevent. The
decision is recorded here because the issue reserved it to the maintainer and
the implementation must cite who chose it.

## D2 — the pin's home is the emitter's own suite

2026-11-27. The issue suggests #678's suite (`receipt-guard`, the
deferred-tools ordering cases) as the pin's natural home. Verified, not assumed:
that suite drives the registered tool specs and never imports `composeDirective`,
so the rendered bytes cannot be produced there without duplicating the emitter.
The executable pin therefore lives beside the emitter,
`packages/pi-agentic-workflow/test/log-session-invocation.test.mjs`, which is
also where the two assertions the prior commit touched already are. The pin
parses the `agentic_workflow_run` body out of the directive and runs
`[subcommand, ...args]` against the crate in a `mktemp` fragment-carrier project,
so it exercises the seam instead of restating it.

## D3 — the release intent is the changeset; the hand bump and row leave

2026-11-27. The starting state bumped `packages/agentic-workflow` and
`packages/pi-agentic-workflow` to `4.10.2`, left the schema and the NaN preset at
`4.10.1`, and hand-wrote a `CHANGELOG.md` row. Three defects in one: the one
train (`D-40-14`) is broken by construction, the parity gate rejects the row it
was never given (`companion-row-missing`), and `release.mjs apply` owns both the
version stamps and the companion rows at cut time. A valid `.changeset/*.md` is
the sanctioned per-PR release intent (`docs/workflow/PACKAGES.md` §Version
bumps), so the changeset is scoped to the touched package and both hand edits
are removed. The crate is unchanged, so it declares nothing.

## D4 — the contract rule is worded inside the block's ceiling

2026-11-27. `runner-mapping@1` rides in every staged `SKILL.md` that cites the
symbolic form, and its ceiling (`RUNNER_MAPPING_ESTIMATE_MAX = 132` est) was
fixed after the block was measured at 120. The shape rule rewrites the `in-pi`
row instead of adding a fourth row, so the block stays inside the ceiling and no
budget is re-pinned. A further rule is a contract change and re-measures with its
reason.

## D5 — path protection: expansions only

2026-11-27. Both suites are protected paths (`**/*.test.*`, `freeze: true`). The
edits are expansions: `log-session-invocation.test.mjs` gains the executable pin
(the two prior assertions already match the contract shape and are kept), and
`runner-mapping-injection.test.mjs` gains the shape case beside its byte-parity
cases. No pre-existing assertion is deleted, relaxed or narrowed, and no input is
narrowed to make a case pass.

## D6 — the shape pins the seam, not the wording

2026-11-27. The executable case is the authority for the shape; the contract
block and the README sentence teach the same rule in prose. If they ever
disagree, the case wins and the prose is the defect — which is why the case
parses the rendered bytes and runs them, instead of asserting a string the
emitter and the test could both carry while drifting from the crate.

## D7 — AC-S8's sweep is scoped to the render surface

2026-11-27. The criterion first named `skills packages template docs` as the
sweep's roots, and `docs` matches the unit doc itself, which quotes the issue's
spaced call as history. The sweep now names what can *compose* a call —
`packages/*/src`, `skills`, `template` — while the unit doc and the journal
quote the defect as the record. `ac-hash` is recomputed after this correction
(pre-handoff, same session): a criterion that its own record can never satisfy
is worse than no criterion.
