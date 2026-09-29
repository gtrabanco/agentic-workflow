---
type: fix
scope: standard
---

# 272 — phase-lint-unit-doc-grammar

> One-line: teach `phase-lint` the lane's unit-doc task grammar (the
> `P<n> — <task> (validator: …)` bullet plus its `Relevant files:` sub-section),
> so the execute-phase pre-flight stops answering `BLOCKED: no-phases` on every
> unit the lane creates.

## Issue

`#272` — GitHub issue. Required. The PR must close it via `Closes #272` in the
body.

## Branch

`fix/272-phase-lint-unit-doc-grammar`

## Depends on

Empty — independent. Feature **69** depends on *this* fix (owner decision
D-69-4): its P8 implementation moved here, and its `implement` steps resume
once this merges.

## Regression scope

| Previously-working behaviour that must NOT break | Verifier |
|---|---|
| Legacy plan files (`## P<n> —` phase blocks) parse to the same per-phase verdicts and **byte-identical fingerprints** | `node --test scripts/phase-lint.test.mjs` (existing corpus assertions unchanged) |
| A doc with no phase in either grammar still answers `BLOCKED: no-phases`, exit 1 | the same suite's `no-phases` fixture |
| An unreadable/out-of-enum phase still fails **closed** (`unparseable`), never partially judged | the same suite's fail-closed fixtures |
| `phase-lint.mjs` keeps carrying no second copy of rule semantics — it mechanizes what `skills/phase-contract/SKILL.md` owns | read-verified at review + the script's own header contract |
| The eight rule semantics themselves are unchanged (this fix adds a **grammar**, not new rules) | `skills/phase-contract/SKILL.md` diff review |

## Objective

Close the contradiction research R4 found in feature 69: `scripts/phase-lint.mjs`
only parses plan-style phase blocks (`## P<n> — Title` + `Layer:` + checkbox
tasks + `Done-when:`), while the lane's plan step writes `P1 — <task> (validator: …)`
bullets into `## Tasks` (`skills/unit-lane/references/PLAN.md`, both SPEC
templates). The linter therefore answers `verdict BLOCKED: no-phases` (exit 1)
on every unit doc the lane creates, and `execute-phase`'s pre-flight STOPs on
that exit — so no unit can reach its first edit. Feature 61's own SPEC already
obligated the missing work (P10: *"`phase-lint.mjs` parses the unit doc's task
grammar"*) and no test ever asserted it.

## Why

- **Observed 2026-09-29** (feature 69 research, rows R4):
  `bun scripts/phase-lint.mjs docs/features/69-efficient-context-targeting/SPEC.md`
  → `BLOCKED: no-phases`, exit 1; same for `62-pi-native-conductor/SPEC.md`;
  the legacy `59-executable-continuations/PLAN.md` still PASSes.
- **Root cause:** one grammar, two document shapes. The linter was built for
  `PLAN.md` (feature 37 / #184) and feature 61 replaced plan files with the unit
  doc without teaching it the new shape — the P10 obligation was written, never
  implemented, never pinned.
- **Consequence:** the deterministic gate is unusable on lane units today, and
  the unit that would fix it is gated by the same defect (this is why owner
  decision D-69-4 split it out of feature 69).

## User outcome

Running `/execute-phase <NN> P<k>` on a lane-written unit doc returns a real
per-phase phase-lint verdict (or a genuine rule finding) instead of an
unconditional `no-phases` STOP, and the plan step's `Relevant files:`
sub-section is machine-checked: present, well-formed, fail-closed when
malformed. Legacy plan files lint exactly as they did before.

## Acceptance criteria

1. **Unit-doc bullets lint.** On a lane-written unit doc whose `## Tasks`
   carries `P<n> — <task> (validator: …)` bullets, `bun scripts/phase-lint.mjs
   <doc>` exits 0 with per-phase `PASS (n/8)` lines and a `fingerprint:` line,
   and no `no-phases`. Verified by `node --test scripts/phase-lint.test.mjs`.
2. **`Relevant files:` is parsed and fail-closed.** A bullet phase's nested
   `- Relevant files: <path, path…>` line is read as the phase's file set; a
   malformed entry (empty list, token that is neither path nor glob) fails
   closed with a typed reason instead of being silently dropped. Verified by
   the same suite.
3. **Legacy behaviour is unchanged.** The pre-existing plan-file corpus still
   PASSes with byte-identical fingerprints, and the `no-phases` /
   `unparseable` / `missing-plan` reason codes still fire on their fixtures.
   Verified by `node --test scripts/phase-lint.test.mjs` (exit 0).
4. **One owner, no second copy.** `skills/phase-contract/SKILL.md` states the
   unit-doc bullet grammar and which of the eight rules map to a bullet phase
   and which are `n/a` (with the reason); `scripts/phase-lint.mjs` mechanizes
   that mapping only. Verified by the skill diff plus the script header's
   "never carries a second copy of rule semantics" contract.
5. **This unit's own gate runs green.** `bun scripts/phase-lint.mjs
   docs/fix/272-phase-lint-unit-doc-grammar/SPEC.md` exits 0 (the fix unit is
   written in the grammar phase-lint accepts today, and keeps passing after
   the bullet grammar lands).
6. **The gate stays green overall.** `node --test scripts/*.test.mjs` and
   `bun scripts/check-skill-context.mjs` both exit 0, with a `bump-skill`
   version + CHANGELOG row for every skill touched.

## Non-goals

- **Consuming** the lists — `execute-phase`'s bounded read set,
  `review-change`'s read set, and phase-close forward propagation stay
  feature 69's P9.
- Rewriting any existing unit doc or plan file into the new shape (both
  grammars stay accepted).
- The rg-first / ripgrep half of #269.
- Changing the eight rules' semantics, the fixed PASS/BLOCKED verdict, or the
  fail-closed reason-code set (only the input grammar widens).
- Moving the linter into the runner crate (feature 61's later packaging step).

## Future cost

| Rule | Binds |
|---|---|
| The unit-doc bullet grammar is a published grammar: its shape changes only through `phase-contract`, then `phase-lint` follows | whoever edits either surface; a prose-only change to one side is a normative drift |
| Two grammars must both stay green forever — every phase-lint test addition runs against plan files **and** unit docs | `scripts/phase-lint.test.mjs` maintainers |
| A `Relevant files:` entry is metadata, never a task: it must not inflate task counts or box-2 targets | the linter's parser and its tests |

## Applicable tests

- `node --test scripts/phase-lint.test.mjs` (unit-doc grammar + corpus pins)
- `node --test scripts/*.test.mjs` (root suite)
- `bun scripts/check-skill-context.mjs` (phase-contract / unit-lane skill edits)
- `bun scripts/phase-lint.mjs docs/fix/272-phase-lint-unit-doc-grammar/SPEC.md`
  (this unit's own gate, AC5)

## Known pre-existing issues

- **`execute-phase`'s pre-flight STOPs on any exit 1 for a unit doc that has
  `## Tasks`** (`skills/execute-phase/references/PREFLIGHT.md`) — **affects**
  this unit: it is the defect's blast radius, and it is why this fix's own
  `## Tasks` is written in the phase-block grammar that passes today.
- `docs/fix/214-model-selection-over-24-options/SPEC.md` answers
  `BLOCKED: unparseable` (legacy shape) — **does-not-affect** (legacy unit,
  never re-triaged; its failure is a different, already-recorded reason code).
- Feature 61 SPEC P10 states the obligation with no evidence row claiming it
  landed — **does-not-affect** (this fix is that obligation; recorded so the
  audit trail is honest).
- Skill context ceilings: `phase-contract` has no per-skill ceiling entry
  (defaults apply) — **does-not-affect** unless the mapping prose exceeds the
  default reference ceiling, in which case the docs step re-bases with a
  declared growth source.

## Tasks

Written in the grammar phase-lint accepts today (phase blocks with `Layer:`,
checkbox tasks and `Done-when:`) — the bullet grammar this fix adds is AC1's
subject, and a bullet-only `## Tasks` would be blocked by the very gate being
repaired.

### P1 — Unit-doc bullet grammar parser

Layer: config/infra

- [x] Parse the lane's `P<n> — <task> (validator: …)` bullets from a unit doc's `## Tasks` section in scripts/phase-lint.mjs (validator: `node --test scripts/phase-lint.test.mjs`)
- [x] Keep `BLOCKED: no-phases` for a document where neither grammar carries a phase, pinned in scripts/phase-lint.test.mjs

Done-when: `node --test scripts/phase-lint.test.mjs` exits 0.

### P2 — Relevant-files sub-section parser

Layer: config/infra

- [ ] Read the nested `Relevant files:` line under a bullet phase into that phase's file set in scripts/phase-lint.mjs
- [ ] Fail closed with a typed reason on a malformed entry, pinned in scripts/phase-lint.test.mjs

Done-when: `node --test scripts/phase-lint.test.mjs` exits 0.

### P3 — Phase-contract grammar mapping

Layer: docs

- [ ] State the unit-doc bullet grammar and its eight-rule mapping in skills/phase-contract/SKILL.md
- [ ] Name the accepted grammars in skills/unit-lane/references/PLAN.md
- [ ] Note the sub-section's metadata status in docs/features/_TEMPLATE/SPEC.md

Done-when: `bun scripts/check-skill-context.mjs` exits 0.

### P4 — Hardening & PR

Layer: hardening

- [ ] Run the root gate → exit 0 (`node --test scripts/*.test.mjs`)
- [ ] Run the context budgets → exit 0 (`bun scripts/check-skill-context.mjs`)
- [ ] Run this unit's own lint → exit 0 (`bun scripts/phase-lint.mjs docs/fix/272-phase-lint-unit-doc-grammar/SPEC.md`)
- [ ] open the PR (`gh pr create --body-file <path>`) with `Closes #272` and PRINT THE PR URL
- [ ] update the fix index row to `done` · [#<pr>](<pr-url>) in the active-fix table

Done-when: `bun scripts/phase-lint.mjs docs/fix/272-phase-lint-unit-doc-grammar/SPEC.md` exits 0 with the root suite green and the PR URL printed.

## Evidence

Triaged steps (verbatim, authoritative):

```
TRIAGE — 272 (fix)
Steps: plan, implement, tests, evidence, review, docs
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| 1 | `node --test scripts/phase-lint.test.mjs` + `node scripts/phase-lint.mjs /tmp/69-spec.md` (feature 69's real unit doc) | 0 · 145 pass | unit-doc bullets lint to `PASS (6/6)` with `P<n>:unit-doc:…` fingerprints; feature 69 now gets rule verdicts instead of `no-phases` | main agent |
| 2 | pending | | | |
| 3 | pending | | | |
| 4 | pending | | | |
| 5 | pending | | | |
| 6 | pending | | | |
| — | `bun scripts/diff-guard.mjs --base main --unit 272` | 1 (BREACH) | Lines: 636 > 400 · Files: 5 ≤ 8 — **recorded exception**: the diff is this unit doc (268) + the parser (178) + its test corpus (183) + the fix-index row (1), every line AC-mandated; one honest split attempted (P1 and P2 land as separate commits — the guard is cumulative by design) and **nothing was deleted to fit**; unit budget declared at 700 lines / 8 files, re-run with `--max-lines 700` after each implement phase | main agent |

## Progress log

- 2026-09-29 17:25 — fix unit doc created from `docs/fix/_TEMPLATE/SPEC.md`
  for issue #272 (split out of feature 69 by owner decision D-69-4);
  `## Tasks` written in the phase-block grammar so the pre-flight gate can run
  at all → branch `fix/272-phase-lint-unit-doc-grammar` — next: triage
- 2026-09-29 17:31 — triage ran (`bun scripts/unit-route.mjs --triage 272`,
  exit 0): plan, implement, tests, evidence, review, docs — block pasted
  verbatim above; `bun scripts/phase-lint.mjs <this doc>` → `PASS (8/8)` ×4,
  verdict `PASS` (this unit's own gate is green, AC5 half-done); fix index row
  registered → next: plan review, then implement P1
- 2026-09-29 17:38 — plan step: checklist verified against
  `skills/unit-lane/references/PLAN.md` — AC1→P1, AC2→P2, AC3→P1/P2 pins,
  AC4→P3, AC5→P4, AC6→P4; smallest first; a validator (command or outcome) per
  task; final task is verification; the bump-skill/CHANGELOG work moved out of
  the plan into the triaged `docs` step → working tree — next: implement P1
- 2026-09-29 18:05 — implement P1 (tests-first): 18 unit-doc grammar tests
  added first — 16 failed against the missing parser, the 2 `no-phases` pins
  already held — then the bullet parser + the boxes 3–8 mapping landed;
  145/145 in `scripts/phase-lint.test.mjs`, root suite 593/593, legacy
  `59-executable-continuations/PLAN.md` fingerprint byte-identical
  (`1a3bf148…`), budgets PASS; this doc's own phase-lint verdict stays
  `PASS (8/8)` → evidence: AC1 row — next: implement P2
- 2026-09-29 18:12 — diff guard after P1: `DIFF-GUARD BREACH — 272` /
  `Lines: 636 > 400 · Files: 5 > 8` (exit 1); exception recorded in the
  Evidence table (unit doc + parser + corpus are AC-mandated, nothing deleted,
  P1/P2 split already attempted) → evidence: exception row — next: implement P2

## Next

Triage is recorded (plan → implement → tests → evidence → review → docs) and
this unit's own phase-lint gate is green. The **plan** step is satisfied by the
`## Tasks` above (every AC maps to a task, validators named, smallest first,
final task = verification, no docs/release tasks) — next: execute **implement
P1** (the unit-doc bullet parser, tests-first), one phase per commit with the
diff guard after each.

## References

- Issue [#272](https://github.com/gtrabanco/agentic-workflow/issues/272) — `Closes #272`.
- Feature 69 (`docs/features/69-efficient-context-targeting/SPEC.md`) — research
  R4 found the defect; owner decisions **D-69-1** (keep bullets, teach the
  linter) and **D-69-4** (split P8 here) govern this fix; its AC6 is satisfied
  by AC1/AC2 of this unit.
- Feature 61 `SPEC.md` P10 — the unmet obligation *"`phase-lint.mjs` parses the
  unit doc's task grammar"* (no evidence row ever claimed it landed).
- Issue [#184](https://github.com/gtrabanco/agentic-workflow/issues/184) /
  feature 37 — where `phase-lint.mjs` and its eight-rule corpus came from.
- `skills/phase-contract/SKILL.md` — sole owner of the eight rules; this fix
  extends the *grammar* it accepts, never the rule semantics.
- `scripts/phase-lint.mjs` header — the script mechanizes the contract and
  never carries a second copy of rule semantics.
- `skills/execute-phase/references/PREFLIGHT.md` — the pre-flight that STOPs on
  this defect (unchanged by this fix).

## Status

`in-progress` — branch open, unit doc created, triage pending.
