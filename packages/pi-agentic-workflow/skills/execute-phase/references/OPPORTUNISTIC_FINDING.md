## Opportunistic finding policy

Use this only for genuinely out-of-scope work discovered while implementing the
current unit. Missing acceptance, correctness, security, accessibility, required
UX/error behavior, or a phase task remains current-unit work — fix/replan/decide
inside the unit; it is never a proposal or issue.

### Closed decision ladder

Evaluate rows in order; every box in a selected row must pass. Estimates include
tests and docs.

| Decision | Pass only if every box is true | Action |
|---|---|---|
| **Autofix** | ≤15 lines; ≤2 files; files already touched; low risk; no public API/schema/migration/dependency/permission/architecture/user-visible change; objective unchanged | Fix in the current phase commit and run its gate. |
| **Opportunistic Fix** | ≤40 lines; ≤3 files; files touched or directly covered by the phase test; supports touched behavior/consistency; low risk; no public API/schema/migration/dependency/permission/architecture/acceptance change; objective unchanged | Fix in the phase commit, add focused behavior coverage, run the gate. |
| **Proposal** | Either fix row fails, evidence is uncertain, work is independent, or product/risk judgment is needed | Do not edit or create an issue. Record a compact proposal with evidence and trigger for explicit user batch triage. |

`≤` is inclusive. Check Opportunistic Fix even after a non-size Autofix failure.
More than 40 lines/3 files is a Proposal unless it is current-unit work, in
which case it is `replan-in-unit` and stays on the same branch/PR.

### Record before acting

Append one row to `decisions.md` before editing/recording:

```markdown
| Date | Finding | Evidence | Estimate | Risk | Local files | Decision | Why | Trigger | Record |
|---|---|---|---|---|---|---|---|---|---|
| <date> | <finding> | <file:line/command> | <lines/files> | <low/med/high> | <yes/no + paths> | <Autofix/Opportunistic Fix/Proposal> | <boxes> | <when to reconsider> | <commit sha|proposal> |
```

For a Proposal, `Record` stays `proposal`; no forge operation runs. Batch the
proposal in the unit's final report. Only an explicit user invocation of
`triage-issue`/the project's backlog intake may create tracked work, where it
must dedupe against existing issues first.

### Guardrails

- No automatic `gh issue create` or equivalent from execution, review, fold,
  audit, or their loops.
- Never use Proposal to move unfinished SPEC/task scope out of the unit.
- An uncertain classification becomes Proposal and may stop for user judgment;
  it never authorizes adjacent edits.
- `known-issues.md` records blockers, not a substitute backlog.
