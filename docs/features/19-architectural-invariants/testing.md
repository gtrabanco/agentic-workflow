# 19 — architectural-invariants · testing

## Contract checks

- P1 template and workflow-document checks pass.
- P2 planning-skill checks passed: all five roles cite the optional project
  invariant document and explicit-decision route.
- P3 execution checks passed: invariant evaluation precedes edits and an absent
  NRS ledger remains compatible.
- P4 review/audit checks passed: both name architectural invariants, preserve
  the NRS read-only evidence rule, and expose an n-a branch for absent rules.
- `npx skills add . --list` passed on 2026-07-31 and discovered 30 skills.
- P2 through P4 run the commands in `TASKS.md`.
- `npx skills add . --list` must discover every shipped skill.

## Integration and failure checks

- An absent invariant document records `n/a` and does not block a compatible repository.
- A declared invariant violation, introduction, or change stops for an explicit architectural decision.
- Frozen NRS facts are consumed when present; contradictory source evidence routes to `resolve-repository-state`.
- Repository inspection remains the authoritative implementation evidence.
- Golden-fixture result: Qwen3 8B passed the explicit-invariant scenario with
  `--think=false`; the first default-thinking attempt is retained as a failed
  exact-output run in `docs/workflow/GOLDEN_FIXTURE.md` and its Spanish sibling.
- Golden-fixture completion: Qwen3 8B (`--think=false`) passed live CSV-export
  runs for `design-feature` 2.5.0, `plan-feature` 3.3.0,
  `plan-feature-from-issue` 1.6.0, and `plan-feature-scaffold` 1.12.0; the
  run-log row is recorded in both language siblings.
- PR [#115](https://github.com/gtrabanco/agentic-workflow/pull/115) targets
  `main` and its body contains `Closes #109`.
