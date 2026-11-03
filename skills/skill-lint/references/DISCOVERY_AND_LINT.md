## Change discovery and authoring lint

### 1. Identify changed skills

Union modified `skills/*/SKILL.md` paths from `git diff --name-only HEAD` and
`git diff --cached --name-only`. Explicitly named skills override that set after
their files are verified. Empty set → report and stop.

### 2. Read the change, choose what to report

Read `git diff HEAD -- skills/<name>/SKILL.md` (plus `--cached` when staged):

- **major** — rename, removed/renamed flag, or fundamental contract/output change;
- **minor** — backward-compatible capability, flag, section, or route;
- **patch** — wording, example, formatting, or internal clarification.

Ask one consolidated question only when a rule's applicability remains genuinely ambiguous.

### 3. Lint, warn, never repair

Check all eight `AGENTS.md` invariants against each changed SKILL.md. This skill
edits nothing — it reports, so state every violation and leave the fix to the
author:

1. User-facing entrypoint contains a visible closing `→ Next:` block.
2. Planning/execution uses `P1…` phases, never `S1` or `Step N`.
3. Every user-facing skill contains `## Portability`.
4. Every user-facing skill opens with `## Turn contract`.
5. Every user-facing skill directory appears as `./skills/<name>` in
   `.claude-plugin/plugin.json`.
6. That plugin array is alphabetical (compare the ordered list with its sorted
   form).
7. A `user-invocable: false` skill absent from the plugin array has anchored
   `metadata.internal: true` inside frontmatter. Plugin-listed internal steps
   are exempt. Check only between the first two `---` lines; body prose does not
   satisfy the rule.
8. **Published vocabularies, never a second copy (issue #361).** A skill whose
   output contract publishes a closed vocabulary must publish exactly the
   canonical tokens: a findings table's `Sev` cell is `FINDINGS_TABLE_SEVERITIES`
   (`BLOCKER`, `CRITICAL`, `WARNING`, `SUGGESTION`) and its `Impact` cell is
   `FINDINGS_TABLE_IMPACTS` (`blocking`, `docs-only`, `report-only`), both
   declared in `packages/agentic-workflow-schema/src/vocabularies.ts` and pinned
   by `scripts/vocabulary-parity.test.mjs`. Report a drifted or missing cell;
   never repair it. The parity suite is this rule's enforcing half — this lint
   only makes the drift visible before the commit.

Report every result in the summary; lint warnings do not block the commit.
