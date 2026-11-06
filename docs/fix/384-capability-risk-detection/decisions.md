# Decisions — fix/384-capability-risk-detection

One table, one row per decision taken while cutting this unit. `authority` names
what settles the row — an owner instruction, a recorded owner decision, or a
pinned repository fact — so a reviewer can overturn a row by citing a stronger
authority, never by preference.

| id | decision | authority | rejected |
|---|---|---|---|
| D1 | The analyser is a **bounded syntactic analyser per language family** (imports + invocations extracted per family, resolved through a provider→capability catalogue, relative imports followed one module graph deep), not an AST parser and not an operation-name list | S10 names the question and the two constraints; `docs/fix/360-risk-tiered-ceremony/decisions.md` `D360-3` records the owner's shape — "one mini-analyser per language family in the repo (`mjs`, `ts`, `sh`, `py`)"; `scripts/risk-tier-classifier.test.mjs` `F6b` pins `scripts/risk-tiers.mjs` to `node:` + schema-source imports only, and `scripts/ceremony/lib.mjs` is dependency-free, so a real parser means adding a dependency to a module two callers already import | A real AST parser per language (a new dependency in the classifier path, and `#352`'s crate is not built yet — a bigger change than this unit); keeping and extending the operation-name regex (the objection S2 quotes) |
| D2 | The capability ids stay **internal evidence**: they appear in `reason` and in the analyser's own API, and no new published vocabulary or verdict field is introduced | S9: "No change to `detail.risk_tier` / `detail.size_tier`'s published shape beyond the reason codes the new analysis needs" — and no new reason code is needed, because `destructive` is already a named signal | Publishing `CAPABILITY_KINDS` in the schema package (three surfaces to bind — schema const, `normative-surfaces@1` row, parity pin — for a vocabulary no consumer reads yet) |
| D3 | `ceremony passive add` **refuses** a non-`passive` scope (exit 2, `route: standard-ceremony`) and a colliding id (exit 2, `record-exists`) | S6/S7 (the carrier's record is written by the CLI, never by hand) plus `skills/execute-phase/references/risk-tiers.md`: "A passive unit that turns out to touch executable content is not passive — it is routed to the standard ceremony, never patched into passivity" | Writing the record anyway and letting a false passivity claim exist on disk; a `--force` flag (a flag that defeats the record's only invariant is a footgun) — see the boundary note below |
| D4 | The analyser's bound on transitive resolution is one module graph, depth ≤ 4, cycle-safe, and only through a caller-supplied resolver | The repo's own purity contract (`risk-tiers.md`: "a pure function of `path → contents`") — the resolver keeps the module pure while letting both repo callers read the same tree | Making the module read the filesystem itself (two callers would then answer differently from the same scope — O12); an unbounded walk (a monorepo-wide call graph is `#352`'s crate work) |

## D3's boundary, stated so it is never re-litigated as a violation of S4/S9

`No command may refuse to run because of a tier or a capability verdict` (S9)
bounds **ordinary work**: `fold-findings`, `log-session`, every executor route,
every pre-existing ceremony operation. `passive add` is not ordinary work — it *is*
the passive ceremony, and what it refuses is writing a record that claims
passivity for an executable change. The refusal is exit 2 (the CLI's existing
ceremonial-block channel) and it leaves the tree untouched; nothing else in the
repository gains a tier check. `O6` pins the difference.

## Path-protection records

The two suites this unit's corpus lives in are protected paths (`**/*.test.*`).
Both are **new files added by this unit**; the records below are the policy's own
justification channel, and neither row weakens an existing assertion — the 360
frozen corpus (`scripts/risk-tier-classifier.test.mjs`) is deliberately **not**
edited by this change, so no precondition it froze can move.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/capabilities.test.mjs | P1 | 2026-11-06 | execute-phase | the new analyser's frozen corpus (F1-F16), authored before the module exists; no pre-existing assertion is touched
justification | scripts/ceremony-passive.test.mjs | P3 | 2026-11-06 | execute-phase | the passive carrier writer's suite, authored before the module exists; no pre-existing assertion is touched
```

## D5 — the frozen `F6b` dependency rule is corrected, not relaxed

`scripts/risk-tier-classifier.test.mjs` `F6b` asserted "only `node:` builtins may
be imported" by scanning **single-line** imports (`/^import .* from "…";$/m`).
The classifier already imports the schema package's vocabulary source over a
multi-line statement, so the assertion never saw it: it held by formatting, not
by the invariant it names.

This unit makes the classifier delegate its `destructive` signal to
`scripts/capabilities.mjs` (S3, S8), a repository-relative module. The assertion
is therefore corrected to the invariant that was always meant — **every import is
a `node:` builtin or a repository-relative module; never a third-party package** —
and it now checks the multi-line form as well, with two negative cases proving the
rule bites. No behaviour expectation is relaxed: every other case in that frozen
suite keeps its exact verdict, and none was edited for this unit.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/risk-tier-classifier.test.mjs | P2 | 2026-11-06 | execute-phase | F6b states the dependency invariant the classifier now needs (a repository-relative analyser module); the rule is widened to node:+repo-internal and made stricter about multi-line and third-party specifiers, and no verdict expectation changes
```

## D5b — the sensor's sandbox mirror gains the analyser module

`mirrorSensorGraph()` in `scripts/workflow-status-sensor.test.mjs` copies the
sensor's real import graph into a sandbox so the "no built schema runtime" cases
fail for the reason they assert instead of `ERR_MODULE_NOT_FOUND`. Its own
docblock lists every issue that grew the graph (#291, #319, #360, #294); this unit
grows it by one module, so the list gains `capabilities.mjs` and the docblock
gains #384. No assertion changes: the mirror's purpose is to stay identical to the
real graph, and leaving it stale would make two unrelated cases fail for the wrong
reason.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/workflow-status-sensor.test.mjs | P2 | 2026-11-06 | execute-phase | the sandbox mirror of the sensor's import graph gains the analyser module the classifier now imports; no assertion is changed
```

## D6 — a fail-open defect in the touched classifier is repaired, not shipped

While proving this unit's differential, `ceremony tier classify --base main`
printed `github/workflows/root-suite.yml` for an uncommitted
`.github/workflows/root-suite.yml` — `scopePaths()` reads a trimmed
`git status --porcelain=v1`, and the trim eats the leading status column of the
first line, so the first dirty path loses its first character. It is a fail-open
tier: a CI, auth or publish surface in that position does not match its named
pattern, and the change classifies `standard` where it owes `high`. Pre-existing
(the 360 branch hit its symptom as a "dirty-file count" note), and squarely in
this unit's own command, so it is repaired here and pinned by
`risk-tier-ceremony.test.mjs` `C1d` — the sensor already asks git for the `-b`
header, which is why only the CLI was affected (`scripts/workflow-status.mjs`
reads the same listing with its header line intact).

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/risk-tier-ceremony.test.mjs | P5 | 2026-11-06 | execute-phase | new case C1d pins the pre-existing porcelain off-by-one the touched command carried; no existing assertion changes
```
