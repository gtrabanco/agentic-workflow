---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/pi-agentic-workflow": patch
"skill-lint": patch
"agentic-workflow-doctor": patch
"aw-doctor": patch
"fold-findings": patch
---

fix(pi-package): quote unsafe argument hints and provision subagents through a package entry (issue #726)

Two packaging defects in the shipped pi package, both reproduced in fresh
runtimes:

- pi reads a skill's frontmatter with a YAML parser, so a bare `[...]`
  `argument-hint:` is a flow sequence and the whole skill is rejected — its
  `skill:*` command never appears. `agentic-workflow-doctor` and `aw-doctor`
  lost their command that way, and `fold-findings` parsed as an array. The three
  values are now quoted strings with their text unchanged, and the staging
  projection quotes an unsafe hint itself, so a future source author cannot ship
  one.
- `pi.extensions` named `./node_modules/pi-extensible-workflows/dist/subagents/index.js`,
  a path that only exists when npm nests dependencies. On a hoisted install the
  durable-subagents layer never loaded and said nothing. The entry is now this
  package's own `./dist/extension/subagents-entry.js` shim, which resolves the
  dependency through Node's package resolution — nested or hoisted — and leaves
  one `session_start` diagnostic naming the entry when it cannot.

Follow-up (issue #726 addendum, 2026-11-27): the shared screen gains `SL-08 frontmatter-flow-scalar` — an `argument-hint` that opens unquoted with `[` or `{` is a finding (a broken flow collection or a silently wrong type), while a quoted or placeholder-led value is admitted. The published check set moves to eight and both suite pins, `CHECKS.md` and `SKILL.md` move with it.
