# 706 — log-write-path-fix · decisions

## D1 — P3 lands under a one-time owner exception, not a gate change

**Decision:** reorder the `docs/LOGS.md` header so the fragment rule leads, and
record the resulting `log-rewritten` verdict as an explicit one-time owner
exception. `scripts/log-immutability.mjs` is not edited.

**Why:** the gate requires `docs/LOGS.md` to be a byte-prefix extension of its
baseline; any header edit fails at the first changed byte (measured: byte 19).
The issue's AC also says the byte-prefix check must stay unaffected. Weakening
the gate to allow header edits would trade the invariant away permanently for a
one-time wording repair. The owner chose the exception; the gate keeps its
teeth for every later push.

**Cost:** the branch's `log-immutability` step is red with `log-rewritten` until
the owner pushes under the authorized exception. The handoff reports it; it is
never hidden or reclassified as a pass.

## D2 — P4: product refuses non-CI runs; only this project refuses local journal pushes

**Decision:** the shipped `journal aggregate` refuses any run that is not in CI
(`CI` set), with no local flag. This repository adds a project-only
`log-local-push` rule in `scripts/log-immutability.mjs`: a local push that
changes `docs/LOGS.md` is refused even when the commit carries the
`journal-bot` identity; only the GitHub Action's push (the journal PR) passes.

**Why:** `journal aggregate` consumes every pending fragment, so a local run
pulls other sessions' entries and can commit under the wrong identity (the 667,
650 and `e60f051cf` incidents). A product flag would leave the unsafe default
one word away; the owner chose CI-only. The local-push guard closes the
identity loophole the existing identity predicate left open (`e60f051cf` passed
the gate by identity alone) and is project-domain because this repository uses
GitHub Actions for its journal PR.

**Product/forge split:** the product predicate is the generic `CI` variable so
the documented `post-receive` hook keeps working on a self-hosted forge; the
project guard names `GITHUB_ACTIONS` because this repository's aggregator is
the GitHub workflow. Neither rule leaks into the other domain (`IR7`).

## D3 — P1: the owner's §7 uses the fragment-only wording

**Decision:** the replacement sentence is:

> docs/LOGS.md: the session entry is written through `journal write` as a
> fragment when `.agentic-workflow/journal/` exists; never hand-append it.

**Why:** the old sentence offers "manual append", which outranks the repository
docs in instruction precedence and contradicts the gate. The owner applies the
sentence to the local prompt, which lives outside this repository; this unit
quotes it and records the decision.

## D4 — the candidate solutions, adopted or rejected

| Problem | Candidate | Disposition | Reason |
|---|---|---|---|
| P1 | owner edits §7 to fragment-only wording | adopted (D3) | the only instruction that outranks the gate; the owner applies it |
| P2 | reword the skill description/line 9 to state both doors | adopted | the body already owns the rule; the listing must agree |
| P3 | lead with the fragment rule | adopted under D1 | the order is the defect; the gate cannot be weakened for it |
| P4 | refuse a local aggregate, or document one local recipe | adopted refusal (D2), recipe rejected | a documented recipe leaves the unsafe default reachable; the owner chose refusal |
| P5 | find and close the env/config leak; record published-history treatment | adopted the closure, rejected rewriting | #529 identifies the identity-less spawn and the `-c`-only gate closes it; published history is already rewritten and is never judged (#539) |

## D5 — the product guard is `CI`, the project guard is `GITHUB_ACTIONS`

**Decision:** `isCiRun` accepts `CI=true` or `CI=1`. The project gate accepts
`GITHUB_ACTIONS=true` (or the forge-bot actor) as the CI signal.

**Why:** the crate must stay forge-free (issue #405 AC5); a GitHub-only product
guard would break the documented `post-receive` recipe. The project gate is
allowed to name GitHub because this repository's journal PR is the GitHub
Action. The post-receive example gains `CI=true` in the same change.
