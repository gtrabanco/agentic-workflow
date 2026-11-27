# Decisions — fix/734-log-session-subcommand-shape

The unit's durable decision record. One row per decision, dated, with the
authority that made it and the reason it holds.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/test/journal.write.test.mjs, packages/pi-agentic-workflow/test/log-session-invocation.test.mjs, packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs | P4 | 2026-11-27 | execute-phase | The unit's declared expansions: the two pi suites appended at P3 per the SPEC plan block and the crate cross-package pin re-bound stronger per decisions D5 and D8, every pre-existing assertion kept (IR3). Recorded here because path-guard evaluates the whole base..HEAD union at the checked phase, so the P3 appends surface in every post-freeze check.
approval | packages/agentic-workflow/test/journal.write.test.mjs, packages/pi-agentic-workflow/test/log-session-invocation.test.mjs, packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs | P4 | 2026-11-27 | human-owner | Owner order 2026-11-27, verbatim: "Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff" — recorded as SPEC ## Log L3, with L2 (work inline, the ledger freeze is the plan) and D10 (Create the PR with the reds disclosed) as the standing authority.
justification | packages/agentic-workflow/test/journal.write.test.mjs, packages/pi-agentic-workflow/test/log-session-invocation.test.mjs, packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs | P5 | 2026-11-27 | execute-phase | The unit's declared expansions: the two pi suites appended at P3 per the SPEC plan block and the crate cross-package pin re-bound stronger per decisions D5 and D8, every pre-existing assertion kept (IR3). Recorded here because path-guard evaluates the whole base..HEAD union at the checked phase, so the P3 appends surface in every post-freeze check.
approval | packages/agentic-workflow/test/journal.write.test.mjs, packages/pi-agentic-workflow/test/log-session-invocation.test.mjs, packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs | P5 | 2026-11-27 | human-owner | Owner order 2026-11-27, verbatim: "Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff" — recorded as SPEC ## Log L3, with L2 (work inline, the ledger freeze is the plan) and D10 (Create the PR with the reds disclosed) as the standing authority.
justification | packages/agentic-workflow/test/journal.write.test.mjs, packages/pi-agentic-workflow/test/log-session-invocation.test.mjs, packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs | P6 | 2026-11-27 | execute-phase | The unit's declared expansions: the two pi suites appended at P3 per the SPEC plan block and the crate cross-package pin re-bound stronger per decisions D5 and D8, every pre-existing assertion kept (IR3). Recorded here because path-guard evaluates the whole base..HEAD union at the checked phase, so the P3 appends surface in every post-freeze check.
approval | packages/agentic-workflow/test/journal.write.test.mjs, packages/pi-agentic-workflow/test/log-session-invocation.test.mjs, packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs | P6 | 2026-11-27 | human-owner | Owner order 2026-11-27, verbatim: "Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff" — recorded as SPEC ## Log L3, with L2 (work inline, the ledger freeze is the plan) and D10 (Create the PR with the reds disclosed) as the standing authority.
```

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
are removed. The crate's behaviour is unchanged; its one edit is the cross-package test pin (D8), and a change under `packages/agentic-workflow/` counts as shipped content for the parity gate, so the changeset declares the crate too.

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

## D8 — the crate's cross-package pin is re-bound, never relaxed

2026-11-27. `packages/agentic-workflow/test/journal.write.test.mjs` asserts that
the pi code door names the journal writer, and it did so through the literal
`/journal write/` — the spaced phrase the runner door can never execute. The
fix removes that phrase from the emitter, so the pin went red. IR3 forbids
repairing a red assertion by weakening it, and keeping the phrase in the source
to satisfy the pin would be gaming it. The pin therefore binds the shape the
door actually executes: `"subcommand": "journal"` *and* `"args": ["write"`, two
independent literals where one stood before. The intent — the code door names
the same writer — is unchanged, and a regression to a spaced service now fails
two assertions instead of one.

## D9 — the ledger's own shape row is not validated by `verify`

2026-11-27. O8's validator was `verify … --no-git`, and `verify` includes the
obligations-closure check — so the row that vouches for the ledger's existence
could only pass after every row closed, a circularity no unit can satisfy while
an unrelated row is open. Its validator is now the two facts the row actually
asserts (the `## Specs` section exists once; `decisions.md` names route (a)).
This is not a relaxation: the closure check still runs over the whole ledger,
and `verify` still refuses until O9 closes.

## D10 — the owner ordered the PR with the two reds disclosed

2026-11-27. Owner order: `Create the PR`. The gate's two red steps are
environmental and were reported before that order — `worktree-guard` on three
stale worktrees this unit never created, and `crate-suite-bun` on
`doc.structure.test.mjs` exceeding its declared 240s suite bound under
concurrent sessions (the same 85 suites are green at `--jobs 1`, and the node
leg is green). O9 therefore closes as an evidenced `n/a`: the disposition is the
owner's delivery decision, recorded here and in the PR body, never the writer's
verdict on its own gate. The change's own validators stay green and are the
evidence the reviewer reads.

## D11 — the #722 half stays on this branch, published-before-reader and declared

2026-11-27. Authority: the owner, twice, in this session. First `A` (strip the
`#722` half), then — after the stripping route proved to need a history rewrite
of five published commits — `No, prohibido force push, en ese caso se lo queda
737`, and finally `B2`. The two `#722` commits (`7c3ad28f9`, `6b94a16e0`), the
`relay` config section and `.changeset/722-relay-seam-owner-default.md`
therefore stay.

This reverses `review-change` cycle 1's F1 repair direction, so the reasoning is
recorded rather than assumed: stripping was the clean option and the owner
refused its only safe form. Adding a reader here was the reviewer's alternative
and is **rejected as a facade** — the semantics of `relay.seam` (the lane's
Relay bootstrap: ask, or preselect the inline per-phase hand-off after stating
the seam) live in #722's `RELAY.md` half, carried by PR #739; a `normalizeRelaySeam`
call wired into this package without that behaviour would compile, pass its own
test and change nothing, which is worse than an honest gap.

The deviation is therefore declared, never silent: the key ships before its
reader, against the config-shipment policy, and records its re-trigger in
`## Known pre-existing issues` (the reader lands on #739, or the section and its
changeset are removed in the change that drops #739). AC-S1 was corrected to
state what the branch actually carries and `ac-hash` recomputed with the tree's
own sensor, because a criterion its own branch falsifies is worse than none.
