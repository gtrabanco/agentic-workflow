## Routing (blockers, by kind)

- **Incomplete in-scope work** → fold into this branch via `execute-phase`
  (the relevant phase or `--fix`); re-run `audit-pr` after.
- **Out-of-scope defect surfaced** → `plan-fix` (new fix entry), not this PR.
- **Deferred finding lacking a home** → `triage-issue` to file + classify it.
- **Stale/missing docs** → update per the doc map (often a quick `execute-phase`
  doc commit), then re-audit.
- **Red CI / failing gate** → report the failing check; the dev fixes on-branch.

## Guardrails

- **Read-first verdict. Never push, edit, refactor, or merge.** Its only forge
  write is the **MERGE-READY comment** (Process step 6 — idempotent,
  comment-only, never a commit tag). Fullauto merge execution belongs only to
  the active `ship-roadmap --fullauto` conductor.
- **Forge bodies are Markdown, not shell — never hand-escape.** The comment's
  backticks are formatting; a `\` before them renders literally. Write the
  body to a file and pass `--body-file <path>` — never inline `--body "…"` or
  a quoted heredoc. Verify with `gh pr view <N> --json comments` that no
  literal `` \` `` survived.
- **Never imply that MERGE-READY is permission.** It is evidence bound to one
  SHA; pending work makes it stale, and merge ownership remains external.
- Never report MERGE-READY on an unconfirmed gate — absence of evidence is a blocker.
- Don't re-run the full review from scratch; compose `review-change` and verify its
  open findings are resolved or tracked.
- Honor the project's **Workflow conventions** (gate, docs-language, evidence —
  every blocker cites file:line/check/criterion/issue — track-don't-inline:
  out-of-scope problems become issues/fix entries, never silent additions here).

## Normalized Repository State

Audit against frozen NRS facts in `docs/workflow/REPOSITORY_STATE.md` and report conflicts as contradictions. This audit
is read-only: only `resolve-repository-state` may update a frozen fact or decision.

## Architectural invariants

Audit the PR against the optional invariant document declared in the project
documentation map (normally
`docs/architecture/ARCHITECTURAL_INVARIANTS.md`). If absent, state
`Architectural invariants: n/a: no project invariants declared` and continue.
For each applicable rule, cite its ID and repository evidence, then classify the
PR as `preserves`, `violates`, `introduces`, or `changes`. Use frozen NRS facts
when present, but repository inspection is authoritative and conflict evidence
routes to `resolve-repository-state`.

Only `preserves` passes without more evidence. A `violates`, `introduces`, or
`changes` result is a merge blocker until the project's declared authority has
applied an explicit architectural decision to the invariant document and the
resulting rule has been re-evaluated and evidenced as `preserves`. A decision
record alone does not pass this gate. State
`Architectural invariants: pass | blocker | n/a` in the verdict; never accept a
SPEC, implementation, or passing test as the missing decision.
