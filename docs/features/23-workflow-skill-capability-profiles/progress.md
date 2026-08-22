# Progress

Last reviewed: 2026-08-22

## Dependency receipt v1

- Fingerprint: `b17a5a86d9025bc2c0422255b18103e8cf502a48` · Closure: `23-workflow-skill-capability-profiles ← (none)`
- Merged PRs: none (no hard or soft dependencies; PR #135 `WorkflowSkillProfile` inventory merged @ `ca2bd8f5`)
- Fully merged: yes · Verified: 2026-08-22
- Recomputed 2026-08-22 after full forge pass — historical fingerprint input not reproducible from current PREFLIGHT; closure is empty and provenance PR #135 confirmed MERGED (`gh pr view 135`).

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

## P2 — 2026-08-22

- Done: P2 — hardening and PR close-out. Gate re-run: `npm test` exit 0 (45/45), context budgets PASS (35 skills), `npx skills add . --list` exit 0, `npm pack --dry-run` lists `dist/index.js|index.d.ts|README.md|README.es.md`; `git status --porcelain -- docs/` empty; roadmap row flipped to `done` and committed; branch pushed; PR #137 opened with `Closes #136`; roadmap row updated to `done · [#137](<pr-url>)` and linked commit pushed.
- Remains: none
- Gotchas: dependency-receipt fingerprint from the plan was not reproducible from the current PREFLIGHT input spec — fail-closed rule triggered a full forge pass (PR #135 MERGED) and a receipt rewrite with the recomputed fingerprint `b17a5a86…`; no acceptance-manifest change (blob `42457ccb…` still matches).
- Files: `packages/agentic-workflow-schema/src/index.ts`, `packages/agentic-workflow-schema/test/capabilities.test.mjs`, `packages/agentic-workflow-schema/README.md`, `README.es.md`, `packages/agentic-workflow-schema/package.json` (P1); `docs/features/23-workflow-skill-capability-profiles/{SPEC,progress}.md`, `docs/features/ROADMAP.md` (P2)
- Next: unit finished