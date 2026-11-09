---
"@gtrabanco/pi-agentic-workflow": minor
---

feat(state-flow): opt-in command-scoped state-flow episode lifecycle (issue #174)

The pi package can now drive an explicit execution-state episode around the
longest workflow commands: with `stateFlow.enabled: true` and
`@llblab/pi-state-flow` installed, `/execute-phase` and `/fold-findings` start
an episode just before the skill prompt runs and stop it when the command
settles — including on abort — with no manual state-flow commands. Design,
plan, review and audit commands never touch it.

Off by default; the backend is a soft dependency detected at runtime through
Pi's `getCommands()` (fail-closed on the mode pair, because a mode dispatch the
session cannot execute would fall through to the model as a literal prompt).
The mode switches ride the same documented seam the skill dispatch uses —
`sendUserMessage(..., { expandPromptTemplates: true })`, which executes an
extension command immediately and starts no turn. Ownership is
package-internal: the package stops only an episode it started, and a second
allowlisted dispatch restarts the episode instead of stacking two.

The `stateFlow` config block (strict schema, project-over-global per field,
whole-list allowlist) carries `enabled`, `backend`, `commands`, `stopOn` and
`onBackendMissing` (`noop` warns once per session; `refuse` stops the command
before anything is dispatched). `/agentic-workflow-settings` gains a State Flow
section with the effective status beside the edit path. The canonical `skills/`
tree is unchanged, and the root README's References section gains the
issue's two bibliography entries.
