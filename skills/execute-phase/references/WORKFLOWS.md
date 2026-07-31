## Workflows

**Feature phase (default)** — `docs/features/<NN>-<slug>/`

1. Verify branch (create if on `main`). **P1 only:** if the planning artifacts
   (`docs/features/<NN>-<slug>/`) are still uncommitted, commit them first on the
   feature branch — `git add docs/features/<NN>-<slug> && git commit -m "docs(<NN>-<slug>): planning artifacts"` —
   so planning history stays separate from implementation.
2. Read `progress.md` first (the phase handoff record — fixed schema above;
   the last entry's `Remains:`/`Gotchas:` lines are the previous phase's
   message to you), then `SPEC.md` + the requested phase's `TASKS.md`
   section. That is the whole handoff — never rely on session memory from a
   previous phase, and honor the *Context budget* for everything beyond
   these files.
3. Implement only that phase (see *Implementation guidance*).
4. Run the gate (type-check, tests, build). **If red:** fix within the phase's
   scope and re-run — never commit red. If the failure can't be fixed within
   this phase's scope, record it in `known-issues.md`, leave the work
   uncommitted, and stop with a clear report.
5. Update the per-phase docs.
6. Stage and commit: `git add <changed files>` then `git commit -m "<type>(<scope>): <summary>"` — one commit per phase, conventional format. Run this; don't just describe what should be committed.
7. **Review checkpoint (recommended, not blocking)** — check the *Review checkpoint triggers* above; when one fires, **recommend** a hand-off to `/review-change` in the closing block, naming the trigger (see below). The user decides: review now, or continue straight to the next phase — the skill never forces the intermediate stop. The **end-of-unit review stays mandatory** (it feeds `audit-pr`, the merge gate). Never run the review in this skill's turn.

**Resuming an interrupted phase (stated contract — any agent must honor it).**
If, on entry, the unit branch already carries dirty files or commits belonging
to the requested phase (a prior run died mid-turn — e.g. the driver process
restarted), do **not** restart the phase from scratch: reconcile against
`TASKS.md` first — verify each ticked task's evidence actually exists (code
path / test present), untick any tick without evidence, then continue from the
first unticked task. Idempotent re-entry is the contract `workflow-status`'s
crash-recovery verdict `RESUMABLE` relies on. If the ledger contradicts the
commits in a way that has no unique next task, stop and report instead of
guessing (that is its `AMBIGUOUS` verdict — a human decides).

**Phased single-pass units — the default for both modes below.** Every fix
SPEC and every XS/S feature SPEC drafted since `plan-fix` 2.1.0 /
`plan-feature-scaffold` 1.8.0 carries a `## Phases` section (**≥ 2 phases**;
the final one is always `Hardening & PR`). When the SPEC has it, run **one
phase per invocation**: `execute-phase <NN> [P<k>]` /
`execute-phase --fix <n> [P<k>]` — `P<k>` omitted → the **first phase with an
unticked task** (deterministic; no judgement). The SPEC's checkboxes are the
execution ledger (there is no `TASKS.md`): tick each task with evidence, and
reconcile on re-entry exactly as *Resuming an interrupted phase* above
prescribes for `TASKS.md`. Each phase appends its handoff entry to a
`progress.md` beside the SPEC (created on P1 — see *Phase handoff record*). Implementation phases run the mode's steps below
but **STOP after the phase commit — no push, no PR** (the per-phase stop and
the turn contract's box 5 "unit not finished" rule). The final
`Hardening & PR` phase runs the close-out — the mode's "Mark done + open the
PR" step — **in its own invocation**: its pre-written tasks ARE the close-out
chain; execute them literally, in order. A SPEC **without** `## Phases`
(drafted before those versions) runs the **legacy flow** below unchanged,
end-to-end in one pass.

**Single-pass** — small feature with only a `SPEC.md`, no planning artifacts
(SPEC carries `## Phases` → phased per the block above; otherwise legacy,
all steps in one pass):

1. Verify branch.
2. Read `SPEC.md` (+ `DECISIONS.md` if present) and the docs its documentation map points to.
3. If the SPEC is ambiguous on scope / edge cases / UI, ask first — one question at a time, nothing it already answers.
4. Implement end-to-end (see *Implementation guidance*).
5. Run the gate; write `CHECKLIST.md` (below).
6. Stage and commit: `git add <changed files>` then `git commit -m "<type>(<scope>): <summary>"`.
7. **Mark done + open the PR — always (the close-out; in a phased SPEC these
   are the final `Hardening & PR` phase's tasks, run in their own
   invocation).** Flip the roadmap
   row to `done` (it's *built*; merge state lives in the forge, not the status —
   see *Marking done*), commit that flip, then `git push` and open the PR
   (body written to a file as Markdown, per the Markdown rule above):
   `gh pr create --base main --title "<type>(<scope>): <summary>" --body-file <path>`
   (put `Closes #<n>` in that body when issue-born). Then, with the URL `gh pr create`
   returned: **print it in the chat**, update the roadmap row to
   `done · [#<pr>](<pr-url>)`, commit (`docs: link PR #<n>`), and push again —
   the link commit rides the same open PR. A single-pass unit **never ends
   branch-only** — it always leaves an open, chat-linked PR, regardless of the
   review/audit still to come.
8. **Mandatory review hand-off** → `/review-change` (the required final quality step;
   see *Review checkpoint*), then `audit-pr` as the merge gate. Print the next step.

**`--fix`** — `docs/fix/<n>-<topic>/`, template `docs/fix/_TEMPLATE/SPEC.md`, index `docs/fix/README.md` (SPEC carries `## Phases` → phased per the block above; otherwise legacy, all steps in one pass):

1. Verify the issue exists (`gh issue view <n>`); if it doesn't, create it
   (`gh issue create --template fix.yml --body-file <path>`, body from the SPEC
   written to a Markdown file — per the Markdown rule above).
2. **If `docs/fix/<n>-<topic>/SPEC.md` already exists (e.g. from `plan-fix`), use it — do not re-draft.** Otherwise copy the template, fill every section, and register the entry in `docs/fix/README.md`.
3. Verify branch (`fix/<n>-<topic>`).
4. Implement the fix (no separate planning artifacts; the SPEC and its `## Phases` ledger are enough).
5. Run the gate.
6. Stage and commit: `git add <changed files>` then `git commit -m "fix(<scope>): <summary>"`.
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

(The `Depends on:` check for fixes is the same Dependency gate above — it runs
before step 1, transitively, and blocks unless `--force`.)
