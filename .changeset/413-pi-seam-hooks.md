---
"@gtrabanco/pi-agentic-workflow": minor
---

feat(pi): consent-gated seam-hooks dispatcher

Target projects can declare commands that run at the workflow's own lifecycle
points — `pre:commit`, `session:start`, `phase:end`, … — and the extension
executes them deterministically, no model in the loop (issue #413, roadmap row
112). The config form is the Claude Code `hooks.json` shape, so existing
declarations port: the project's `hooks.json` (under its `.pi` config directory) over
`<agentDir>/hooks.json`
(global), the established precedence and trust gate mirrored; `SessionStart` /
`SessionEnd` alias to `session:start` / `session:end`, every other Claude Code
event name is refused `config-invalid`, and the nine native `PROJECTION_SEAMS`
names are accepted (issue #406's closed vocabulary, consumed, never extended).

Nothing runs until two explicit gates are open, both proven off-by-default by
test: init-workspace's consent marker (`<agentDir>/seam-hooks-consent.json`,
keyed by absolute project path — the skill gains the consent step), and the
per-seam `"enabled": true` flag. Execution is sanitized and bounded: argv
tokenization with `shell: false` through the runtime module, shell
metacharacters refused before any process exists, output capped per stream with
a truncation marker, hard timeout per hook, and a non-zero exit blocks at the
seam with the declared requirement quoted (the teaching-message contract).
Auto commit/push exist only as explicit `phase:end`/`unit:end` per-seam flags
(`autoCommit` requires `commitMessage`; `autoPush` requires `autoCommit`) —
never bundled defaults. Missing config is a quiet no-op; present-but-broken
config announces its problems once per project session and degrades to a
declared no-op. The dispatcher never writes the user's hook config or consent.

Seam firing is wired for the boundaries pi exposes today (`session:start`,
`session:end`, and `pre:commit`/`post:commit`/`pre:push` via `git
commit`/`git push` interception); the `unit:*`/`phase:*` seams validate, accept
the auto flags, and run through `runSeam` — their lane-boundary wiring is the
recorded future work. The compatibility table and the execution contract are in
the package README; the workflow-level guide is `docs/workflow/SEAM_HOOKS.md`.
