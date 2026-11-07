---
"@gtrabanco/pi-agentic-workflow": minor
"log-session": minor
---

feat(log-session): anchor the invocation in code, and say the miss out loud

`/log-session` was prose dispatch: a skill injection with nothing behind the
slash, so a model could read it and narrate it instead of running it, and the
session could end with no entry and no signal. It is now an extension command
(the #383 precedent, issue #429). Its handler records the invocation itself in
the project's `.pi` directory (one file per session,
`.session-<id>.log-session`), asks the project's own writer for the mechanical
facts and carries its answer byte for byte into the directive, and resolves the
entry's exact target — the fragment carrier's own name through the crate
grammar's owner when `skills/log-session/SKILL.md`'s carrier exists, the
`docs/LOGS.md` append otherwise. The model's remaining job is the prose:
Summary, Decisions and Next. When the turn settles with no entry at the
resolved path the extension names it once; a record that no longer parses is
reported and left alone, never deleted on a guess.

The prose door is unchanged and still complete: `SKILL.md` owns the procedure,
the catalogue still lists the command (routing, `/agentic-workflow-settings`
and the configured-route typo report read the same entry), and every other
skill command keeps its verbatim `/skill:<name>` dispatch. The package renders
no journal entry and writes no journal: feature 66's two-writer split and the
ownership map's single-writer rule both hold, so a project that ships no
`scripts/session-close.mjs` is told its facts were not computed rather than
handed an invented set.
