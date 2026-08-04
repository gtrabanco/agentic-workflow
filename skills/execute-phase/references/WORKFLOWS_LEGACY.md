## Legacy mode workflow

**Legacy single-pass** — a SPEC **without** a `## Phases` section (drafted
before `plan-feature-scaffold` 1.8.0 / `plan-fix` 2.1.0) runs the whole unit
end-to-end in **one pass**. This is the fallback shared by small-feature and
`--fix` modes; a SPEC that carries `## Phases` never runs it.

1. Verify branch.
2. Read `SPEC.md` (+ `DECISIONS.md` if present) and the docs its documentation map points to.
3. If the SPEC is ambiguous on scope / edge cases / UI, ask first — one question at a time, nothing it already answers.
4. Implement end-to-end (see *Implementation guidance*).
5. Run the gate; write `CHECKLIST.md` (below).
6. Stage and commit: `git add <changed files>` then `git commit -m "<type>(<scope>): <summary>"`.
7. **Mark done + open the PR — always (the close-out).** Flip the roadmap
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
