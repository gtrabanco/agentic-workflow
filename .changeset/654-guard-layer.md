---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
"@gtrabanco/agentic-workflow": minor
---

feat(guards): adopt the permission layer and declare project guards as data (issue #654)

The first-party shell write guard is retired. Its approval prompt was judged
synchronously against an async `ctx.ui.confirm`, so a pending promise read as
consent and an out-of-root write ran the same second its dialog appeared; its
static extractor also scanned heredoc bodies as command text and passed
computed targets silently. Bash gating is now the operator-level
`@gotgenes/pi-permission-system`: a real bash grammar, an external-directory map,
native session grants, `promptTimeoutMs` that denies an unanswered prompt and
tells the agent, and fail-closed handling of indirection.

What ships here is the authoring surface for a project's own guards.
`guardPlugins` in `pi-agentic-workflow.json` declares guards as data — a
deterministic kind evaluated locally (last matching rule wins, `*` the only
metacharacter, an omitted verdict asks) and a `model-backed` kind the seam
accepts and registers only once an adapter supplies it. The schema package
publishes the contract, the decision function and the policy projection; the
extension registers one authorizer link per declaration when the permission layer
is installed and reports a stated skip when it is not; `agentic-workflow
provision permissions` projects the declarations into the layer's own policy file,
creating it only when absent.

Tier 2 path protection keeps its records decision and gains the OS-temp scratch
carve-out the retired guard had, so a `/tmp` write no longer needs a
justification record while a durable out-of-root write is still refused. The
`path-protection@1` contract states the file-tools surface and names the
permission layer as bash's owner instead of describing a shell extractor that no
longer exists.
