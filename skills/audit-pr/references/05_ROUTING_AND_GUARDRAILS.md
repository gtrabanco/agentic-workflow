## Routing (blockers, by kind)

- **Missing/stale review receipt** → `/review-change` (re-review at the head, then
  re-run `audit-pr`) — never re-review from here.
- **Incomplete in-scope work** → fold into this branch via `execute-phase`
  (the relevant phase or `--fix`); re-run `audit-pr` after.
- **Out-of-scope defect surfaced** → `plan-fix` (new fix entry), not this PR.
- **Deferred finding lacking a home** → `triage-issue` to file + classify it.
- **Stale/missing docs** → update per the doc map (often a quick `execute-phase`
  doc commit), then re-audit.
- **Red CI / failing gate** → report the failing check; the dev fixes on-branch.

## Guardrails

- **Read-first verdict. Never push, edit, refactor, or merge.** Its only forge
  write is the **MERGE-READY comment** (Process step 7 — idempotent,
  comment-only, never a commit tag). Fullauto merge execution belongs only to
  the active `ship-roadmap --fullauto` conductor.
- **Never re-review the diff.** The `REVIEW-PASS` receipt is the review evidence;
  a missing/stale receipt is a blocker routed to `/review-change`. The audit does
  not compose `review-change`, rescan axes, judge test quality, remap diff hunks
  to acceptance criteria, or reclassify architectural invariants (AC 13).
- **Forge bodies are Markdown, not shell — never hand-escape.** The comment's
  backticks are formatting; a `\` before them renders literally. Write the
  body to a file and pass `--body-file <path>` — never inline `--body "…"` or
  a quoted heredoc. Verify with `gh pr view <N> --json comments` that no
  literal `` \` `` survived.
- **Never imply that MERGE-READY is permission.** It is evidence bound to one
  SHA; pending work makes it stale, and merge ownership remains external.
- Never report MERGE-READY on an unconfirmed gate — absence of evidence is a blocker.
- Honor the project's **Workflow conventions** (gate, docs-language, evidence —
  every blocker cites file:line/check/criterion/issue — track-don't-inline:
  out-of-scope problems become issues/fix entries, never silent additions here).

## Normalized Repository State

Audit against frozen NRS facts in `docs/workflow/REPOSITORY_STATE.md` and report conflicts as contradictions. This audit
is read-only: only `resolve-repository-state` may update a frozen fact or decision.

## Architectural invariants

The invariant result is part of the review evidence the receipt carries
(`- Architectural invariants: pass | blocker | n/a`). This audit **does not
reclassify** invariants (AC 13) — it confirms the receipt records an explicit
result and mirrors it into the verdict:

- `n/a: no project invariants declared` (the review recorded no applicable
  document) → pass, not a blocker.
- `pass` (the review evidenced every applicable rule as preserved, or an
  explicit architectural decision is recorded) → pass.
- `blocker` / `violates` / `introduces` / `changes` in the receipt → **merge
  blocker** routed to the decision the review surfaced; the PR's head cannot be
  merged until the project's declared authority applies the decision and the
  review re-runs.

State `Architectural invariants: pass | blocker | n/a` in the verdict. A decision
record alone does not pass; never accept a SPEC, implementation, or passing test
as the missing decision.
