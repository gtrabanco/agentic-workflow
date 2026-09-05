---
name: implementation-discovery
user-invocable: false
version: 1.0.0
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal contract: the single owner of the bounded pre-write implementation
  discovery step. One read-only mapper that closes seven evidence questions,
  emits one fixed compact map, and routes READY | REPLAN | NEEDS-DESIGN |
  BLOCKED before any branch, planning, or source write. Consumed only by
  execute-phase on the pre-write route. Not a menu entry.
---

# Implementation Discovery (internal)

The one authoritative owner of the bounded, read-only pre-write mapper consumed
by `execute-phase`. A phase does not touch the repository until this step has
closed its questions and said `READY`. Nothing else may define what a valid
pre-write discovery pass is.

## When to use

- `execute-phase` — before any branch/planning/source write, after the read-only
  dependency/status/acceptance/phase/feature-28 receipt checks.
- The step runs only on the pre-write route; it is never a general-purpose
  orientation pass and never a substitute for planning.

## Inputs (exact, only these)

The mapper receives only:

- the governing SPEC/fix obligations for the current phase;
- the current feature-28 SPEC and Plan receipt digests;
- the phase-relevant rows from frozen planning evidence, with source revision,
  affected decision/obligation, freshness, and declared unknowns;
- the phase fingerprint, ordered tasks, acceptance/obligation ids, and the last
  progress receipt;
- source HEAD plus clean-source / allowed-planning-path evidence;
- applicable NRS / decision / invariant evidence;
- the repository discovery tools available in this environment.

## Seven evidence questions

Every pass must answer — each answer citing repository-relative `path:line`,
symbol, or test plus exact source revision / content identity:

1. Which entry points and public/internal interfaces own current behaviour?
2. Which callers, adapters, roles, compatibility surfaces, and failure paths
   can this phase affect?
3. Which helpers, patterns, decisions, and invariants constrain the change?
4. Which tests, fixtures, probes, and production-like scenarios establish
   current behaviour?
5. Which exact writes are expected, and which reviewed obligation does each
   serve?
6. Which carried planning-evidence claims and Plan assumptions are directly
   confirmed, refined, stale, missing, or contradicted by source?
7. Which relevant unknowns remain, who owns them, and what evidence resolves
   them?

The mapper records conclusions, not every search. Repeating a search/read
requires a new question, changed source, or insufficient cited evidence;
otherwise it stops (no-progress).

## Inline and fresh routing

**Inline** is permitted only when behaviour is localized/familiar, targeted
evidence answers every question, no public/persistence/security/recovery/
compatibility boundary may change, and the executor can finish the map before
writing.

**A fresh read-only mapper** is required for cross-module/layer or unfamiliar
work, public/persistence/security/recovery/compatibility impact, competing
project patterns, an unproven material Plan assumption, prior failed
attempts/review bias, or any case where editing would begin before the map
closes. Same-model fresh context is useful but is not model diversity. Manual
sequential fresh conversations are the portable fallback.

No file-count threshold participates in the route or the verdict.

## Fixed implementation map

```text
IMPLEMENTATION MAP — unit-id phase-id
Map revision: opaque single-consumption id
Source identity: HEAD + clean-source proof + cited-evidence manifest digest
Authority: SPEC receipt + Plan receipt + phase fingerprint
Planning evidence: carried row ids + current confirmation/refinement/conflict
Obligations: ordered acceptance/fix/obligation ids
Entry points: path:line or symbol + role + exact evidence
Affected surfaces: callers/adapters/roles/compatibility/failure paths + evidence
Current behaviour: evidence-backed summary
Reuse and constraints: helper/pattern/decision/invariant/fixture + evidence
Expected writes: ordered path + obligation served + reason
Validation: falsification probe + TDD target + phase gate
Plan assumptions: confirmed items + evidence
Contradictions: none or exact Plan/source conflict
Unknowns: none or exact missing fact + owner + resolution evidence
Decision: READY | REPLAN | NEEDS-DESIGN | BLOCKED
```

## Verdicts

`READY` requires every field, question, and owned obligation covered, no
material contradiction/unknown, an observed falsification probe, and expected
writes inside phase authority. It also requires every carried planning-evidence
row to be confirmed or narrowly refined.

`REPLAN` means source disproves Engineering assumptions while Product remains
stable, or Plan-level topology/architecture/obligation/validator evidence is
absent.

`NEEDS-DESIGN` means Product, acceptance, authority, or architecture intent is
missing or conflicting.

`BLOCKED` names evidence that cannot currently be obtained.

No other verdict exists.

## Early falsification

Before READY, run the cheapest relevant read-only probe: a focused existing
test, current parser/CLI output, public type/schema inspection, symbol callers,
or an existing fixture. Record the command/query, the observed result, and the
evidence. A failed probe informs REPLAN/NEEDS-DESIGN; unavailable high-risk
evidence is BLOCKED, never rewritten as confident evidence. This does not
replace TDD or later verification.

## No-progress

Conclusion once. Do not re-read or re-search to reconfirm the same conclusion
without a new question, changed source, or insufficient cited evidence. On
repetition, stop with `BLOCKED` and name what is still missing. Re-read is
allowed only for a changed source revision, a new question, insufficient
evidence, or a contradiction.

## Read-only boundary

The mapper reads; it may not write. It creates no forge issue, no committed
map, no planning unit, no schema, no source edit, and no test edit. It emits the
map and reuses `SkillOutcome v1`. A missing current-unit behaviour entailed by
reviewed scope joins the obligation map and routes upstream; it is not a
follow-up issue. Discovery never calls the forge.

## Writer handoff

The writer receives frozen phase authority plus the fixed compact map. It does
not receive raw files, repeated summaries, raw planning discovery, raw
exploration history, or the authoring conversation unless a cited claim cannot
be interpreted without a focused excerpt. The map preserves the phase-relevant planning-evidence ids and
their current confirmation. The writer may only touch expected paths /
obligations; a newly discovered path or contradiction stops and remaps/routes
rather than expanding silently.
