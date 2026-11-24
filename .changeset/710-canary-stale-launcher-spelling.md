---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/pi-agentic-workflow": patch
---

fix(710): an invocation instruction that resolves to nothing is now refused

Two surfaces composed one: a canary cut recorded skills stamped with the train
before the one it published, and the `/log-session` door handed the model a bare
`agentic-workflow journal write …` that nothing answers to (the scope-less npm
name is a `0.0.0` placeholder with no `bin`).

The canary stage now stamps the skill frontmatter with the prerelease it
publishes — the same helper the stable cut always ran — the publish job restores
those stamps with the manifests and rebuilds the skill bundle after the stage, so
the tag and the tarball carry the train they name. The `/log-session` directive
hands the model the `agentic_workflow_run` tool call instead of a launcher, and
every shipped page that spelled the launcher now orders the symbolic
`runner <subcommand>` form: `scripts/runner-launcher-drift.mjs` reads the
subcommand set from the CLI's own registry and refuses a bare launcher by file
and line, so the residue #679's verification sketch never swept cannot return.
