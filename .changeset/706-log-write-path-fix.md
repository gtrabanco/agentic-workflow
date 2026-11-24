---
"@gtrabanco/agentic-workflow": patch
"log-session": patch
---

fix(journal): one write path for docs/LOGS.md (issue #706)

`journal aggregate` now refuses every non-CI run before the first byte moves: a
local run consumed other sessions' pending fragments and each session
improvised the identity, so the merge-to-main job is the only door. `--check`
stays local because it moves no byte. The documented `post-receive` example
runs the same command with `CI=true`; the GitHub workflow already runs with
`CI` set by the runner.

The `log-session` skill description now states both doors — a fragment under
`.agentic-workflow/journal/` when the carrier exists, otherwise an append to
`docs/LOGS.md` — matching the body it already carried.

No new config key, no schema change and no command rename.
