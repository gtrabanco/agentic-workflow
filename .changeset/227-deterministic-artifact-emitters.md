---
"@gtrabanco/agentic-workflow": minor
---

feat: verify cross-checks a unit doc's claims against the tree (issue #227)

The 2026-11-03 re-scope's residual half: referenced paths exist, cited gates
are the published ones. A root-relative path citation (`dir/…/file.ext`,
optional `:line` suffix) must exist in the repository (`cited-path-missing`)
and a `` `id` gate `` citation must resolve to something published — the gate
inventory's ids, audit-pr's `GATE_NAMES`, an existing skill or script stem
(`cited-gate-unknown`). Context-relative shorthand, brace expansion, commands,
branch names and fenced verbatim quotes are not claims and are never checked;
with no repo context (`--no-git`) both cross-checks are skipped and stay out
of the receipt's `checks`.

fix: `roadmap annotate` keeps the row on one physical line

A note joined with a newline terminated the table row and a renderer turned
its tail into a malformed extra row; the note now lands inside the row's
description cell, on the same line.
