## Fix mode workflow

**`--fix`** — `docs/fix/<n>-<topic>/`, template `docs/fix/_TEMPLATE/SPEC.md`, index `docs/fix/README.md`. A fix SPEC carries `## Phases` → run **one phase per invocation** (`execute-phase --fix <n> [P<k>]`), the final `Hardening & PR` phase running the close-out (steps 7–9) in its own invocation; otherwise legacy, all steps in one pass.

1. Verify the issue exists (`gh issue view <n>`); if it doesn't, create it
   (`gh issue create --template fix.yml --body-file <path>`, body from the SPEC
   written to a Markdown file — per the Markdown rule above).
2. **If `docs/fix/<n>-<topic>/SPEC.md` already exists (e.g. from `plan-fix`), use it — do not re-draft.** Otherwise copy the template, fill every section, and register the entry in `docs/fix/README.md`.
3. Verify branch (`fix/<n>-<topic>`).
4. Implement the fix (no separate planning artifacts; the SPEC and its `## Phases` ledger are enough).
5. Run the gate.
6. Stage and commit: `git add <changed files>` then `git commit -m "fix(<scope>): <summary>"`. In phased mode, an implementation phase **STOPs here — no push, no PR** (per-phase stop and the turn contract's box 5 "unit not finished" rule).
7. **Mark done + open the PR — always (the close-out; in a phased SPEC these
   are the final `Hardening & PR` phase's tasks, run in their own
   invocation).** Set the
   `docs/fix/README.md` entry's status to `done` (built, not yet merged), commit,
   `git push`, then open the PR with the body written to a Markdown file (per the
   Markdown rule above): `gh pr create --base main --title "fix(<scope>): <summary>" --body-file <path>`
   (the body includes `Closes #<n>`). Run the commands. Then, with the returned URL: **print it in the chat**,
   set the `docs/fix/README.md` entry to `done · [#<pr>](<pr-url>)`, commit
   (`docs: link PR #<n>`), and push again. A fix **never ends branch-only** —
   it always leaves an open, chat-linked PR.
8. **Mandatory review hand-off** → `/review-change`, then `audit-pr` as the merge gate.
   Print the next step. **Keep the fix-index entry** until the PR is actually merged
   (don't drop issue tracking early; the merge gate also blocks on pending docs).
9. **After merge only:** remove the `docs/fix/README.md` entry (or archive it to the
   project's fix history per its convention) — never before the merge.

**Resuming an interrupted phase (stated contract — any agent must honor it).**
If, on entry, the fix branch already carries dirty files or commits belonging
to the requested phase (a prior run died mid-turn — e.g. the driver process
restarted), do **not** restart the phase from scratch: reconcile against the
SPEC's `## Phases` checkboxes first — verify each ticked task's evidence
actually exists (code path / test present), untick any tick without evidence,
then continue from the first unticked task. Idempotent re-entry is the contract
`workflow-status`'s crash-recovery verdict `RESUMABLE` relies on. If the ledger
contradicts the commits in a way that has no unique next task, stop and report
instead of guessing (that is its `AMBIGUOUS` verdict — a human decides).

(The `Depends on:` check for fixes is the same Dependency gate above — it runs
before step 1, transitively, and blocks unless `--force`.)
