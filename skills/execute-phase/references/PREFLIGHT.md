## Dependency gate (always, before any other step)

Run this check for **every** mode (feature phase, single-pass, and `--fix`)
before touching anything:

1. Read the unit's `Depends on:` (SPEC) and its roadmap/fix-index row.
2. Build the **transitive closure**: for each dependency, read *its* roadmap
   row and collect its dependencies too, until none remain.
3. For each entry in the closure, its status must be **merged in the forge**
   (`gh pr view` on its PR, or the row's PR reference) — `done`-but-PR-open is
   NOT met (its code isn't on the default branch), and a missing folder/row is
   NOT met.
4. **All met** → proceed to the **own-status precondition** below.
5. **Any unmet → STOP before any edit** and print exactly:

   ```
   DEPENDENCY GATE — <NN>-<slug> BLOCKED
   Unmet chain (deepest first is the one to start):
     <NN> ← <dep> (<status>) [← <dep-of-dep> (<status>) …]
   Build order to unblock: <deepest> → … → <NN>

   → Next: /execute-phase <deepest> P1 — the deepest unmet dependency (plan it
     first with /plan-feature <deepest> if it has no SPEC)
     · fix-type dependency → /plan-fix then /execute-phase --fix
     · proceed anyway, at your own risk → /execute-phase <NN> <phase> --force
       (the override is recorded in decisions.md — never silent)
   ```

6. **`--force`** skips the stop (never the check): the gate still runs and its
   result is **recorded in `decisions.md`** ("started with unmet deps: <list>,
   user-forced <date>") before implementation begins. `--force` is a
   user-only escape hatch — the autopilot (`ship-roadmap`) must never pass it.

### Dependency receipt (v1) + fail-closed fast path

After a full pass with every dependency merged, append to the unit's `progress.md`:

```
## Dependency receipt v1
- Fingerprint: <sha> · Closure: <NN>-<slug> ← <dep> …
- Merged PRs: <dep> #<n> @ <merge sha> · Fully merged: yes · Verified: <date>
```

Fingerprint = `git hash-object --stdin` over the SPEC `Depends on:` line and
each closure roadmap row (rows encode the merged PR, e.g. `22-other #7 @ a1b2c3
merged`). PR identities are provenance in the receipt, never fingerprint input —
the fingerprint covers only inputs the fast path can re-derive locally.

**Fast path (local only, no forge calls):** recompute the fingerprint (SPEC +
roadmap rows). Skip forge traversal **only when** a `v1` receipt exists, the
recomputed fingerprint matches, it records `Fully merged: yes`, and no `--force`
is recorded in `decisions.md` after the receipt date.

**Fail closed — invalidate and rerun the full gate** on any of: fingerprint
mismatch (graph changed), missing or older-version receipt (format drift), a
later `--force`, or the full gate itself finding an unmet dependency. On any
ambiguity never skip forge traversal; rewrite the receipt after every full pass.

### Own-status precondition (runs after the dependency closure is met, still before any edit)

Feature mode only (a fix has no roadmap-status equivalent — its own state is
the fix-index entry, unaffected). Read this unit's own roadmap row status
(the five-state machine — `docs/features/ROADMAP.md` → Status legend):

1. **`idea`** (or no `SPEC.md` with `## Design status: designed`) → STOP,
   before any edit:

   ```
   OWN-STATUS GATE — <NN>-<slug> BLOCKED (idea)
   This unit has no completed product design yet.

   → Next: /design-feature <slug> — write the product half first
     · proceed anyway, at your own risk → /execute-phase <NN> <phase> --force
       (the override is recorded in decisions.md — never silent)
   ```

2. **`defined`** (product half designed, engineering half / planning
   artifacts not yet scaffolded) → STOP:

   ```
   OWN-STATUS GATE — <NN>-<slug> BLOCKED (defined)
   Product half designed; engineering half + planning artifacts not yet scaffolded.

   → Next: /plan-feature <NN>-<slug> — scaffold the engineering half + TASKS.md
     · proceed anyway, at your own risk → /execute-phase <NN> <phase> --force
       (the override is recorded in decisions.md — never silent)
   ```

3. **`planned`+** → proceed to the normal workflow.
4. **Legacy compat.** A row still reading a plain `planned` with no
   five-state history: check its `SPEC.md` product half. Complete
   (`## Design status: designed`) → treat as `defined`+`planned`, no
   redirect. Incomplete/absent → treat as `idea`, redirect per step 1. See
   `docs/workflow/MIGRATION.md`.
5. **`--force`** skips the STOP (never the check), same rule as the
   dependency gate: recorded in `decisions.md` before implementation begins;
   the autopilot (`ship-roadmap`) must never pass it.

## Phase-lint pre-flight guard (always, before any edit — after the dependency/own-status gates)

**Legacy-SPEC carve-out (check this first, before anything else in this
section):** if the target SPEC has **no `## Phases` section**, skip this
guard entirely — no lint run, no STOP — and fall straight through to the
legacy single-pass flow ("A SPEC without `## Phases`
… runs the legacy flow … end-to-end in one pass" — see
[legacy workflow](WORKFLOWS_LEGACY.md)). The guard below applies
only to a SPEC that carries a `## Phases` ledger.

Before touching any code, run the canonical 8-box phase-lint owned by
`skills/phase-contract/SKILL.md` (the fixed PASS/BLOCKED block and the
normalized phase fingerprint) against the **target phase** (its title,
declared layer, task list, and done-when).

1. **All 8 boxes tick** → proceed to the normal workflow.
2. **Any box FAILs → STOP before any edit** and print exactly:

   ```
   PHASE-LINT GATE — <NN|n>-<slug> <phase> BLOCKED
   Failed boxes:
     ✗ <box label> — <one-line reason>
     [✗ <box label> — <one-line reason>] …

   → Next: /plan-feature <NN> — re-cut or split the phase (feature)
     · fix-type unit → /plan-fix — re-cut or split the phase
     · proceed anyway, at your own risk → /execute-phase <NN|--fix n> <phase> --force
       (the override is recorded in decisions.md — never silent)
   ```

3. **`--force`** skips the STOP (never the check): the lint still runs and its
   result is **recorded in `decisions.md`** (feature mode) or the fix SPEC's
   own notes / `progress.md` if present ("executed non-atomic phase: <failed
   boxes>, user-forced <date>") before implementation begins. `--force` is a
   user-only escape hatch — the autopilot (`ship-roadmap`) must never pass it.
