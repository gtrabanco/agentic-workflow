## Forge body policy

Forge operations use the project's declared forge CLI (Workflow conventions —
examples use `gh`; translate if the project declares another forge).

> **Forge bodies are Markdown, not shell — never hand-escape them.** Backticks,
> `*`, `_`, `#`, `|` in an issue / PR / comment body are **formatting**; a `\`
> before them renders **literally** (`` \`code\` `` instead of `` `code` ``) —
> the #1 forge-formatting bug (worse on some agents than others). Fix it at the
> source: **never pass a Markdown body inline** (`--body "…"`, a quoted
> `<<'EOF'` heredoc, or single quotes — all of these preserve a stray `\` or
> mangle backticks). Instead **write the body to a file with the Write tool**
> (plain Markdown — real backticks, zero backslashes; scratchpad is fine) and
> pass **`--body-file <path>`**: `gh issue create --body-file <path>`,
> `gh pr create --body-file <path>`, `gh issue comment <n> --body-file <path>`
> (or the declared forge's equivalent). Short one-liners with no Markdown (e.g.
> a bare `Closes #12`) may stay inline. **Verify after creating:**
> `gh issue view <n> --json body` / `gh pr view <n> --json body` must show
> backticks rendering — a literal `` \` `` in the output means redo it with
> `--body-file`.

- **`--fix`:** every fix needs a tracked issue; create with `gh issue create --template fix.yml --body-file <path>` if missing, populating the body from the SPEC (body as a Markdown file — see the Markdown rule above). Use the returned number for branch and folder.
- **feature:** if it came from an issue, include `Closes #<n>` in the PR body. Don't create issues for features that didn't originate from one.
- **Language precedence for every artifact** (issues, PRs, commits, SPECs, docs): (1) an explicit user instruction in the prompt, else (2) the project's declared docs language (Workflow conventions), else (3) English. The conversation language is NOT a signal — being asked in Spanish never makes the PR Spanish. Non-matching source material gets translated first.
