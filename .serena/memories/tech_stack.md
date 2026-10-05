# Tech stack
- Main deliverable is Markdown-based skills/scaffold; no root application build.
- Distribution: `npx skills add ...` reads `skills/<name>/SKILL.md` directly.
- Schema module: ESM TypeScript package `@gtrabanco/agentic-workflow-schema`, Node >=18, TypeScript 6.
- Schema source: `packages/agentic-workflow-schema/src/index.ts`; output `dist/index.js` + `dist/index.d.ts`; tests use Node's built-in `node:test` and `node:assert/strict`.
- JSON contracts are exported alongside the package (`envelope.schema.json`, `skill-outcome.schema.json`, `workflow-snapshot.schema.json`).
- See `mem:suggested_commands` for commands.