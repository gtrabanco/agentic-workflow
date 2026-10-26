---
name: verification-contract
user-invocable: false
version: 1.5.0
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal contract: the acceptance artifact per delivery unit — legacy (pre-
  feature 61) units may carry a frozen `ACCEPTANCE.md` (binding if present);
  post-feature 61 units use the unit doc's `## Acceptance criteria` section as
  the canonical acceptance source; the unit doc's evidence carrier — `## Evidence`
  table, or `## Log` `E` lines for a re-cut unit (#308) — serves as the execution
  receipt. Consumed by planners, execute-phase, and review-change.
---

# Verification Contract (internal)

Single owner of the delivery finish line. Planning freezes it; executors may
strengthen coverage but cannot move it; review checks the same bytes.

## Executable claims

An acceptance criterion or Evidence row that states a count, an exit code or a
length is a promise, not a description: `scripts/promise-coherence.mjs` re-runs
it. Write the outcome a command must produce (`` `cmd` matches <N> ``,
`` `cmd` exits <N> ``) or, for a shape promise, name the file and the
`## Section` the count is about (`` … a 3–5 line `## Inputs` in
`skills/<name>/SKILL.md` ``) — a length with no named surface cannot be recounted
and fails closed.

## Artifact

Legacy (pre-feature 61) units (ACCEPTANCE.md present — binding if present):
the frozen `ACCEPTANCE.md` beside the SPEC; required parts: `Status: frozen`;
one stable ID per SPEC criterion; `Required outcome`; named `Validator`; literal
quality floor; project commands. Prefer commands, otherwise use
`read-verified: <evidence>` or `manual: <exact observation>`. Unlabelled prose
is invalid. A planned test may name its future project runner; it cannot
substitute a narrower runner later.

Lane-era units (post-feature 61): the unit doc's `## Acceptance criteria` section is the
canonical acceptance source. Criteria are numbered, each induced from a concrete
user scenario, and command-verified where possible (label `read-verified` for
prose-only checks). Unlabelled prose is invalid.

**Validator stability.** A validator must never gate on a surface other workflow
actors mutate — the branch diff as a whole, the session log, progress entries,
review ledgers, or forge state — because any out-of-unit commit (a session-log
append, another unit's fold) then re-fails a frozen criterion on a finished unit
and re-opens its review loop. Grep the unit's own files and outputs; a
diff-based validator enumerates the unit's paths or excludes the
workflow-mutated surfaces explicitly (docs/LOGS.md, the unit's own docs
directory, harness/toolstate).

**Validator determinism.** A frozen validator must be deterministic — pin network,
clock, randomness, and unordered-concurrency dependencies (fixed version,
frozen fixture, recorded input) or downgrade the row to `read-verified:`/
`manual:`.

**Property / fuzz validators.** A planner may emit a property or fuzz validator as
a bounded `commands` row — deterministic, bounded runtime within the project's
per-command timeout budgets. No new validator kind in `VerificationPlan
v1` is needed: property/fuzz rides the existing `commands` class.

## Freeze and receipt

The unit doc's own evidence carrier is the execution receipt: the `## Evidence`
table for a legacy-shape unit, the `## Log` `E` lines for a re-cut one (#308). Each
row or line records a validator command, its exit code or blob digest, output
excerpt, and who verified it. A frozen criterion's receipt is the Evidence row for that
criterion — exact match continues; missing/mismatched evidence stops before
edits:

```text
ACCEPTANCE GATE — <unit> BLOCKED
Expected Evidence row for AC<N>: present with blob <sha> · Actual: missing/changed
Reason: the frozen finish line evidence is missing or changed.

→ Next: restore the frozen manifest, or obtain explicit user approval for a
  SPEC amendment and replacement manifest; then record a fresh Evidence row
  · never edit tests, commands, or acceptance to make the current candidate pass
```

A legitimate change requires, in order: explicit user approval; dated SPEC
`## Amendments` row; replacement manifest; committed fresh Evidence row. The
executor never self-authorizes it.

Legacy unit with no manifest mention: fingerprint committed `SPEC.md` and record
`Manifest: legacy SPEC.md`. A new plan or any plan naming the manifest fails
closed when it is missing.

## Validation ladder

Evaluate every row plus the normal project gate:

- `PASS`: commands green; read evidence present; manual checks named.
- `FAIL`: validator disproves the candidate; include compact failure evidence.
- `NEEDS-DECISION`: missing product/architecture choice.
- `BLOCKED`: command/input/environment unavailable; name it.

## Anti-gaming rules

Forbidden: deleting, skipping, narrowing, or loosening a validator; suppression,
stub, hard-coded answer, or no-op fix used to manufacture green. A command cannot
prove an untested read/manual row. Stronger regression tests are allowed. Repair
test setup only when assertions stay at least as strong and the reason is logged.

## Test immutability

A test, once written, is **immutable**. The executor fixes code until green,
never the test — editing an expectation to match behaviour is not a fix, it is
a cover-up. The sole legitimate amendment is a **proven mis-encoding of external semantics**: the test's expectation contradicts the actual
documented semantics of the platform/library/language, cited from authoritative documentation — not a product decision change. Even that surfaces as a
**finding plus a SPEC amendment**, never a silent edit to go green.

The deterministic backstop for this rule is the feature 60 path-protection
checkpoint (`path-protection@1` in the turn contract): the Tier 1 gate fails a
protected-path change with no recorded justification/approval, and the pi guard
blocks the write before it lands. This manifest is the finish line those
recorded escapes are checked against.

Prevention rides the research gate (**research-before-encode**): platform
semantics are verified against authoritative documentation **before a test encodes them**, so **adding stronger tests stays allowed**; **editing expectations never** (except the proven-mis-encoding path above).

## Done when

Execution receipt (unit doc `## Log` `E` lines for a re-cut unit, `## Evidence` table for a post-feature 61 one; legacy `ACCEPTANCE.md` manifest binding-if-present) + named validators + literal quality floor; executor and reviewer evaluate identical evidence.
