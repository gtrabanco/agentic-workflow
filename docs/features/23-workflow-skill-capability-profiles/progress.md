# Progress

Last reviewed: 2026-08-22

## Dependency receipt v1

- Fingerprint: `5522cdd83270ef86aae5446780406167d3e13da1` · Closure: `23-workflow-skill-capability-profiles ← (none)`
- Merged PRs: none (no hard or soft dependencies; PR #135 present on `main`)
- Fully merged: yes · Verified: 2026-08-22

## Acceptance receipt v1

- Manifest: `docs/features/23-workflow-skill-capability-profiles/ACCEPTANCE.md` · Blob: `42457ccba493b50283bf81b063943d6c2c33df27` · Status: frozen · Verified: 2026-08-22

## Phase P1 handoff

- Done: P1 — capability vocabularies + derived unions exported and frozen;
  `WorkflowSkillCapabilities` added as optional `capabilities` on
  `WorkflowSkillProfile`; all 12 built-in profiles populated from the AC2
  table; table-driven `capabilities.test.mjs` (exact coverage, duplicate and
  unknown-vocabulary rejection, fail-closed fixture, `Object.isFrozen`);
  synchronized EN/ES capability guidance; package bumped 3.0.0 → 3.1.0.
  - Gate: `cd packages/agentic-workflow-schema && npm test` → exit 0 (45/45);
    `npm pack --dry-run` lists `dist/index.js`, `dist/index.d.ts`, `README.md`,
    `README.es.md`.
- Remains: P2 — hardening and PR (docs/ clean, roadmap `done`, push, PR with `Closes #136`).