## Version and documentation synchronization

### 1. Bump `version:` only

Parse the frontmatter semver and apply the selected bump, resetting lower
components (`1.2.3` → patch `1.2.4`, minor `1.3.0`, major `2.0.0`). Replace only
the `version:` line.

### 2. Synchronize both changelogs

Insert the newest row first in the skill table under `## Per-skill version
history` in `CHANGELOG.md`:

```
| <new-version> | <YYYY-MM-DD> | <bump-type> | <one-sentence summary> |
```

For a new skill, create this table in the correct user-facing/internal section:

```markdown
#### `<name>`
| Version | Date | Type | What changed |
|---|---|---|---|
| <new-version> | <YYYY-MM-DD> | — | First versioned release |
```

Use today's date and a tight behavioral summary. Add or merge today's Release
log line. Mirror the row and order in `CHANGELOG.es.md` as a faithful Spanish
translation.

### 3. Synchronize READMEs and model routing

- Minor/major behavior change: update only the affected Skills-table cell in
  `README.md` and its translated cell in `README.es.md`. Patch: edit only if the
  cell is inaccurate.
- Tier change: update `docs/workflow/model-routing.yml`, then mirror it in both
  README model tables. Never edit the derived `claude` branch directly.
- Otherwise leave README content unchanged.

### 4. Handle major migrations

For a rename or removed/renamed flag, append the migration to
`docs/workflow/MIGRATION.md` (create its standard header when absent), update
the `CLAUDE.md` skill entry when its name/contract changed, and update stale
cross-references found under `docs/` and `skills/`.
