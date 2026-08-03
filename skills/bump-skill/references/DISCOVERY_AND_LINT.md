## Change discovery and authoring lint

### 1. Identify changed skills

Union modified `skills/*/SKILL.md` paths from `git diff --name-only HEAD` and
`git diff --cached --name-only`. Explicitly named skills override that set after
their files are verified. Empty set → report and stop.

### 2. Choose each bump from its diff

Read `git diff HEAD -- skills/<name>/SKILL.md` (plus `--cached` when staged):

- **major** — rename, removed/renamed flag, or fundamental contract/output change;
- **minor** — backward-compatible capability, flag, section, or route;
- **patch** — wording, example, formatting, or internal clarification.

Ask one consolidated question only when a bump remains genuinely ambiguous.

### 3. Lint, warn, never repair

Check all seven `CLAUDE.md` invariants. This skill may edit only `version:` in a
SKILL.md, so report violations without fixing them:

1. User-facing entrypoint contains a visible closing `→ Next:` block.
2. Planning/execution uses `P1…` phases, never `S1` or `Step N`.
3. Every user-facing skill contains `## Portability`.
4. Every user-facing skill opens with `## Turn contract`.
5. Every user-facing skill directory appears as `./skills/<name>` in
   `.claude-plugin/plugin.json`.
6. That plugin array and `docs/workflow/model-routing.yml` top-level keys are
   alphabetical (compare each ordered list with its sorted form).
7. A `user-invocable: false` skill absent from the plugin array has anchored
   `metadata.internal: true` inside frontmatter. Plugin-listed internal steps
   are exempt. Check only between the first two `---` lines; body prose does not
   satisfy the rule.

Report every result in the summary; lint warnings do not block the bump.
