# 08 — phase-economics · testing

No application build exists — "green" is the repo's doc-verification gate
(`CLAUDE.md` → Verification). Layers below in order of authority. This feature's
own subject is "criteria as runnable commands," so the criteria below are commands
wherever possible.

## Structural

- `npx skills add . --list` lists every skill (all touched SKILL.md files parse).

## Textual (acceptance criteria as runnable commands)

Run from repo root; each maps to a SPEC acceptance criterion. Grep patterns are
illustrative — the executor confirms exact wording by read.

```sh
# AC1 — hard split rule (must + three triggers) in the scaffold
grep -iq 'must' skills/plan-feature-scaffold/SKILL.md          # at the split rule (read-confirm the 3 triggers)
# AC2 — cheap-executability checklist (4 boxes) in the scaffold
grep -iq 'cheap-executab' skills/plan-feature-scaffold/SKILL.md
# AC3 — criteria-as-commands in the scaffold
grep -iEq 'runnable command|as the command|command-checkable' skills/plan-feature-scaffold/SKILL.md
# AC4 — one-phase-one-session in execute-phase
grep -iEq 'one phase = one session|one phase per session|one session' skills/execute-phase/SKILL.md
# AC5 — one-phase-one-session in FEATURE_WORKFLOW
grep -iq 'one phase' docs/workflow/FEATURE_WORKFLOW.md
# AC6 — SPEC template (repo) hardened
grep -iEq 'one layer|more than one|independently shippable' docs/features/_TEMPLATE/SPEC.md
# AC7 — SPEC template (template/) mirrored
grep -iEq 'one layer|more than one|independently shippable' template/docs/features/_TEMPLATE/SPEC.md
```

Read-verified criteria (no single grep suffices): AC1's three triggers and `must`
wording; the four checklist boxes (AC2); the old soft "consider splitting" removed
from both templates (AC6/AC7); AC10 (no stack leakage); AC11 (`## Portability` +
`→ Next:` intact on `execute-phase`); AC12 (PR carries `Closes #15`).

## Cross-doc

- `bump-skill` bookkeeping consistent (AC9): `plan-feature-scaffold` +
  `execute-phase` `version:` ↔ changelog rows EN/ES ↔ README skills+model tables
  EN/ES.
- Repo ↔ `template/` mirror clean: SPEC template edits present in both copies;
  `FEATURE_WORKFLOW` mirror updated or its absence recorded in `decisions.md`.
- Run `/audit-docs` after the edits — expect no drift.

## Weak-model read-through

Re-read each edited skill as the fleet's weakest model would execute it:

- `plan-feature-scaffold` hard split rule — the three triggers are a fixed OR
  list with `must`, not "consider"; each trigger independently checkable.
- `plan-feature-scaffold` cheap-executability checklist — four boxes, `n/a`
  explicit; a phase failing any box is re-cut/split (deterministic, not judgement).
- `plan-feature-scaffold` criteria-as-commands — command-checkable → command;
  judgement-only → prose labelled read-verified.
- `execute-phase` one-phase-one-session — a rule box, not a suggestion; `/loop`
  convenience paired with the manual re-invoke fallback in `## Portability`.

## Manual dry-runs (read-through, no runtime harness)

Each maps to a SPEC dev scenario:

1. `plan:split-oversize` — a feature planned to >5 phases → the scaffold's `must`
   split rule fires and chains via `Depends on:`.
2. `plan:split-multilayer` — a phase touching >1 concern → checklist box "one
   layer/concern" fails → re-cut/split.
3. `plan:open-decision` — a phase needing an unresolved decision → box "zero open
   decisions" fails → split; decision recorded first.
4. `plan:criteria-as-commands` — a command-checkable criterion is emitted as a
   command in `TASKS.md`/`testing.md`, not prose.
5. `exec:one-phase-session` — two phases in one session on a weak model → forbidden
   by the `execute-phase` batch rule + `FEATURE_WORKFLOW` convention.
