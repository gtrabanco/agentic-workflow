## Readiness preflight

Deterministic, structural, and run by the author immediately before handing the
frozen artifact to an independent reviewer. It decides only whether the artifact
is *shaped* to be reviewed. It cannot decide correctness — that belongs to
`review-spec` / `review-plan` in a context that did not write the artifact.

### Stage selection

Use `stage: spec` for a Product half (`design-feature`, issue-derived design) and
`stage: plan` for an Engineering half or fix SPEC (`plan-feature`,
`plan-feature-scaffold`, `plan-fix`). Run every box of the selected stage.

### `stage: spec` boxes

```
✓ 1. Required Product headings present and in template order; no template
  placeholder text remains anywhere in the half
✓ 2. `## Design status` is literally `designed` (never stamped by this preflight
  — verify it was earned by the Spec-lint product boxes)
✓ 3. Entity closure: every entity row has a UI/API/test resolution or an
  explicit `n/a: <reason>` — zero blank rows
✓ 4. Integration closure: one resolved row per subsystem of the derived
  inventory; none skipped, inventory recorded when `docs/CAPABILITIES.md` absent
✓ 5. Role matrix: every inventory role is explicitly `allowed`/`denied` for every
  capability — no role unlisted
✓ 6. Expectation sweep: ≥ 10 rows (M/L) or ≥ 5 (XS/S), each forced to
  `in-scope`/`out-of-scope`/`deferred` with a pointer — and a `deferred` row
  exists only behind a user-made governing-SPEC amendment, never an issue this
  skill filed — a `deferred` row needs a
  governing-SPEC amendment the user made, never an issue this skill filed
✓ 7. Every in-scope bullet maps to ≥ 1 acceptance criterion; every criterion is
  labelled command-verified or read-verified
✓ 8. `Deferred decisions` present and reads `none` or lists each owner
✓ 9. Every evidence row from grounding is `current` and `proven`/`decision`, or
  is `unknown` with a named owner plus the next evidence step; no `drifted` or
  `stale` row survives
✓ 10. No criterion, scope bullet, or closure row rests on memory, chat history,
  or an unlocatable source
```

### `stage: plan` boxes

```
✓ 1. Governing SPEC Product half is `designed` and a current `SPEC-REVIEW-PASS`
  receipt exists for the exact snapshot being parented (missing/stale →
  `NEEDS-EVIDENCE`, route to `review-spec`; never self-approve the parent here)
✓ 2. Frozen `ACCEPTANCE.md` present, `Status: frozen`, one stable ID per SPEC
  criterion, every row carries a named Validator; blob computed with
  `git hash-object` and recorded
✓ 3. Architecture impact names the affected surfaces with `path:line` evidence
  rows, and the invariant classification is present (`preserves`, or the stop
  block for `violates`/`introduces`/`changes`)
✓ 4. Every normative obligation and applicable invariant/use case has exactly
  one row in the obligation ledger, with phase, task, implementation owner,
  validator, required evidence, and a non-blank status
  (ledger contract: `pre-execution-review/references/LEDGERS.md` §2)
✓ 5. The planning-evidence table exists in its size-appropriate home (M/L:
  `planning-evidence.md`; XS/S: `### Planning evidence` in the SPEC), is compact,
  and every Engineering claim resolves to a row in it
  (ledger contract: `pre-execution-review/references/LEDGERS.md` §1)
✓ 6. Scenario matrix covers each failure category the SPEC names; each scenario
  points at the phase and validator that exercise it
✓ 7. Every phase passes the canonical 8-box phase-lint with its fingerprint
  recorded (`phase-contract` is the sole owner of the rules)
✓ 8. Phase order matches the `Depends on` closure; no phase builds a later
  phase's deliverable early; the final phase is the hardening/close-out phase
✓ 9. Compatibility boundary and rollback path stated; no public contract change
  the SPEC did not name
✓ 10. No unresolved decision word remains (`Decide`, `choose`, `OR` between
  alternatives, conditional scope moves); `Open questions / risks` is resolved or
  each risk has an owner
✓ 11. Every evidence row is `current`; unknowns have owners
```

### Result — fixed output

All boxes tick for the selected stage:

```text
READINESS — <NN-slug|fix n> <spec|plan> READY-FOR-REVIEW
- Artifact revision: <artifactRevisionId> · Rows checked: <n> · Unknowns open: <n>
- Evidence: <planning-evidence.md | SPEC Product half/decisions.md> · Frozen: <date>
```

Any box fails — return exactly one of `NEEDS-EVIDENCE`, `NEEDS-DESIGN`,
`NEEDS-REPLAN` (the first matching rule wins):

```text
READINESS — <NN-slug|fix n> <spec|plan> <NEEDS-EVIDENCE|NEEDS-DESIGN|NEEDS-REPLAN>
- Failed box: <n> — <one-line reason>
- Missing: <evidence/heading/row/validator> · Owner: <authoring skill | human>
- Next: <exact authoring step to re-run> — do not invoke an independent reviewer
```

Choice of outcome is mechanical, not a judgment call:

| Condition | Outcome | Then |
|---|---|---|
| A row is missing, `drifted`, `stale`, or an unowned unknown | `NEEDS-EVIDENCE` | re-run grounding step 2 for that claim |
| Product intent, scope, role, authority, or user outcome is genuinely open | `NEEDS-DESIGN` | the human decides through `design-feature` |
| Obligations/scenarios/phases/validators exist but do not correspond | `NEEDS-REPLAN` | re-cut the plan (`plan-feature`/`plan-fix`), never patch wording |
| `stage: plan` and the parent SPEC review receipt is missing or stale | `NEEDS-EVIDENCE` | `review-spec` first |

### Prohibitions

- Never emit `SPEC-REVIEW-PASS`, `PLAN-REVIEW-PASS`, "approved", or "reviewed".
- Never tick a box without the repository evidence that proves it; a self-assessed
  tick is a false readiness, the exact failure this preflight exists to prevent.
- Never repair an artifact by editing the *reviewed* claim into agreement —
  repair means acquiring the missing evidence or routing to its owner.
- Never run the preflight after the review to justify a PASS the reviewer
  withheld.
- Never convert exhaustion into readiness: if the evidence is unreachable, the
  outcome is `NEEDS-EVIDENCE` with the named blocker, not `READY-FOR-REVIEW`.
