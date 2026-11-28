---
# Uncomment and set the keys the unit needs; until type/scope are set, the readers fall back to the folder
# (type) and scope).
type: feature
scope: medium
# ac-hash: <sha256 of the ## Acceptance criteria section — the design step writes it>
roadmap_summary: pi 1.6.1→1.7.0 delta — decision-model classifiers reach pi, re-pin baseline, adopt diagnostics/blockedKind
---

# 752 — pi-delta-verification

> One-line: pi 1.6.1→1.7.0 delta — decision-model classifiers reach pi (#444's trigger), re-pin the baseline, adopt headless diagnostics/blockedKind.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
```

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers.

**S1 — Verify delta against both packages.**
> Delta verification — the #694 method over 1.6.1+1.7.0 for both pi packages: two‑leg `tsc --noEmit` against pi 1.7.0; re‑read the event matrix (no new events published in 1.6.1–1.7.0); REPLACE the dated `Also verified against Pi …` README entry with one dated entry for 1.7.0 (the verified‑baseline test forbids a second entry; peer floor `>=1.1.0` unchanged).

**S2 — Adopt headless diagnostics.**
> Adopt: headless `diagnostics` (1.7.0 fix) — print/JSON/RPC modes no longer swallow an invalid `models.json`: `createAgentSessionServices()` returns the error as a warning in `diagnostics` (previously it surfaced as `Model \"...\" not found` / `No API key found`). The sensor/headless surfaces (workflow‑status envelope, the orchestration‑envelope drivers) and the future tool‑doctor host dimension can read config health deterministically.

**S3 — Adopt ctx.ui blockedKind.**
> Adopt: `ctx.ui` `blockedKind` (1.6.1) — `select()`/`confirm()`/`input()` dialogs can report OSC 7501 program status kind (`\"permission\"`, …), so an approval dialog a program‑status terminal renders as a permission request. Candidate consumer: the consent/ASK surface of #654's seam hooks.

**S4 — Cache-preservation re-measure (deferred).**
> Cache‑preservation re‑measure note for the #631 tier‑cost corpus and #632's `cache_posture` vocabulary owners.

**S5 — Route `after_provider_response` HTTP 4xx/5xx visibility.**
> Rate‑limit visibility the #495 pacing surfaces may consume — route separately from delta verification.

**S6 — Probe `--agent-dir <dir>` + OSC 7577.**
> A probe candidate for tool‑doctor's host‑dimension unit.

## Impact

What the change touches beyond its own files: what consumes this unit's deliverables, what this unit consumes from others, what stops being true when the change lands.

## Surfaces

The batch scheduler's lane keys this unit occupies, one per line.

- `packages/pi-agentic-workflow`
- `packages/agentic-workflow`
- `skills/workflow-status`
- `skills/orchestration-envelope`

## Retirements

None — this unit is additive: it adopts new capabilities and re-pins version references.

## Non-goals

- No implementation of SystemOne materiality judging (#444's downstream half).
- No change to the `after_provider_response` HTTP 4xx/5xx route — deferred.
- No cache-preservation re-measure implementation — deferred.

## Risk tier

The unit's ceremony is proportional to risk, and the tier is **computed, never chosen**: `runner ceremony tier classify` reads the change's paths and contents and emits `passive | standard | high` (owner: `skills/execute-phase/references/risk-tiers.md`, block `risk-tier-verdict@1`).

- **`standard`** — the ceremony this document describes.

**Task Size = Understood + Contained risk + Resumable-from-diff.**

- **Tier** — `<standard>` · **Task Size** — `<verdict.task_size>`
- **Named high-risk item** — `none — not a high-tier unit`

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a date and a status: `open`, `planned`, or `discarded <YYYY-MM-DD>`.

- #444 (decision-substrate) — when activated, these classifiers are the trigger substrate (open, 2026-11-28)
- #614 (SystemOne substrate) — the "compatible endpoint" this delta reaches (open, 2026-11-28)
- #631 (tier-cost cache hit rate) — cache-preservation re-measure (open, 2026-11-28)
- #632 (model-aware phase batching) — `cache_posture` vocabulary (open, 2026-11-28)
- #705 (tool-doctor) — `diagnostics` probe and `--agent-dir` probe consumers (open, 2026-11-28)

## Future cost

Standing obligations this unit imposes on future work.

- The README's `Also verified against Pi` entry must stay single — no second dated entry allowed (verified-baseline test).
- The `diagnostics` adoption must be consumed by at least one of: workflow-status envelope, orchestration-envelope drivers, or tool-doctor host dimension.

## Applicable tests

The tests this unit will run (triage-decided).

- `bun test packages/pi-agentic-workflow/test/*`
- `bun test packages/agentic-workflow/test/*`
- `bun scripts/run-root-suite.mjs` (node-compatible subset)
- `tsc --noEmit` for both packages
- `runner unit-route --triage 752 --json` (triage sanity)
- Verified-baseline test (README entry uniqueness)

## Known pre-existing issues

- **#694** — the predecessor delta verification unit (same README entry pattern, merged). Affects: this unit must follow #694 in order to avoid conflicting with the same README entry.
- **#705** — tool-doctor check unit (related consumer for `diagnostics`). Does not affect: this unit operates independently on the version adoption.
- **#654** — guard-layer unit (related consumer for `blockedKind`). Does not affect: this unit adopts the capability; #654 consumes it.

## Tasks

P1…Pn with stable IDs, one line each, smallest first.

- P1 — Run `tsc --noEmit` for both packages against pi 1.7.0 (validator: `tsc --noEmit` exits 0)
  (Implements: S1)
  - Relevant files: packages/pi-agentic-workflow, packages/agentic-workflow

- P2 — Re-read the event matrix: diff 1.6.1 and 1.7.0 published events (validator: `rg --files-without-match 'new-event-name' packages/*/src/` shows no new event names)
  (Implements: S1)
  - Relevant files: packages/pi-agentic-workflow/src, packages/agentic-workflow/src

- P3 — Replace the dated `Also verified against Pi` README entry with one dated entry for 1.7.0 (validator: `rg 'Also verified against' README.md` shows exactly one entry)
  (Implements: S1)
  - Relevant files: packages/pi-agentic-workflow/README.md, packages/agentic-workflow/README.md

- P4 — Adopt headless diagnostics: verify `diagnostics` no longer swallows invalid `models.json` (validator: `node -e "..."` runs diagnostics with invalid config and sees warning, not error)
  (Implements: S2)
  - Relevant files: packages/agentic-workflow/src/runner, skills/workflow-status, skills/orchestration-envelope

- P5 — Adopt `ctx.ui blockedKind`: verify OSC 7501 program status kind is passed through `select()`/`confirm()`/`input()` (validator: `rg 'blockedKind' packages/agentic-workflow/src/` shows the field is consumed)
  (Implements: S3)
  - Relevant files: packages/agentic-workflow/src/runner, skills/orchestration-envelope

- P6 — Record deferred consumers: cache-preservation (#631/#632), after_provider_response (#495), --agent-dir (#705) (validator: each deferred item is recorded in decisions.md)
  (Implements: S4, S5, S6)
  - Relevant files: docs/features/752-pi-delta-verification/decisions.md

- P7 — Verification: run root suite + all package tests (validator: `bun scripts/run-root-suite.mjs` exits 0, all package tests green)
  (Implements: S1, S2, S3)

### Planning evidence

One row per Engineering claim (the closed column order and vocabularies are owned by `skills/pre-execution-review/references/LEDGERS.md`).

### Obligations

One row per normative behaviour, compatibility invariant, affected use case, and required failure state.

## Triaged steps

> Paste the `## Triaged steps` block from `runner unit-route --triage <slug>` here verbatim. This block is the machine's authoritative step list; the lane never re-derives or reorders it (owner: `skills/unit-lane/SKILL.md` §Turn contract).

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed yet.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind token from the closed set.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-11-28, the request, verbatim:
  ```
  pi 1.6.1→1.7.0 delta — decision-model classifiers reach pi (#444's trigger), re-pin the baseline, adopt headless diagnostics/blockedKind
  ```

## Next

The single next action: run triage and begin P1 (tsc --noEmit verification).

## References

- Issue: [#752](https://github.com/gtrabanco/agentic-workflow/issues/752)
- Roadmap: row 752
- #694 — predecessor delta verification (same README entry pattern)
- #444 — decision-substrate (trigger that fired)
- #705 — tool-doctor (diagnostics consumer)
- #654 — guard-layer (blockedKind consumer)
- #631 — tier-cost cache hit rate (cache preservation consumer)
- #632 — model-aware phase batching (cache posture consumer)
- #495 — pacing surfaces (after_provider_response consumer)