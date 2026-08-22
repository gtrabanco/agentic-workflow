# Progress

Last reviewed: 2026-08-22

## Dependency receipt v1

- Fingerprint: `b17a5a86d9025bc2c0422255b18103e8cf502a48` · Closure: `23-workflow-skill-capability-profiles ← (none)`
- Merged PRs: none (no hard or soft dependencies; PR #135 `WorkflowSkillProfile` inventory merged @ `ca2bd8f5`)
- Fully merged: yes · Verified: 2026-08-22
- Recomputed 2026-08-22 after full forge pass — historical fingerprint input not reproducible from current PREFLIGHT; closure is empty and provenance PR #135 confirmed MERGED (`gh pr view 135`).

## Acceptance receipt v1

- Manifest: `docs/features/23-workflow-skill-capability-profiles/ACCEPTANCE.md` · Blob: `b47e831108671c9a6993b2762ae6e84e5ec8552e` · Status: frozen · Verified: 2026-08-22

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

- Done: P2 — hardening and PR close-out. Gate re-run: `npm test` exit 0 (45/45), context budgets PASS (35 skills), `npx skills add . --list` exit 0, `npm pack --dry-run` lists `dist/index.js|index.d.ts|README.md|README.es.md`; `git status --porcelain -- docs/` empty; roadmap row flipped to `done` and committed; branch pushed; PR #140 opened with `Closes #136`; roadmap row updated to `done · [#140](<https://github.com/gtrabanco/agentic-workflow/pull/140>)` and linked commit pushed.
- Remains: none
- Gotchas: dependency-receipt fingerprint from the plan was not reproducible from the current PREFLIGHT input spec — fail-closed rule triggered a full forge pass (PR #135 MERGED) and a receipt rewrite with the recomputed fingerprint `b17a5a86…`; no acceptance-manifest change (blob `42457ccb…` still matches).
- Files: `packages/agentic-workflow-schema/src/index.ts`, `packages/agentic-workflow-schema/test/capabilities.test.mjs`, `packages/agentic-workflow-schema/README.md`, `README.es.md`, `packages/agentic-workflow-schema/package.json` (P1); `docs/features/23-workflow-skill-capability-profiles/{SPEC,progress}.md`, `docs/features/ROADMAP.md` (P2)
- Next: historical P2 close-out superseded by the approved P3–P5 replan below

## Replan P3–P5 — 2026-08-22

- Done: acceptance audit classified AC1, AC4, AC5, AC6, AC9, and AC10 as
  acceptable; reopened F3 (public TypeScript source-compatibility regression)
  and F4 (non-deterministic AC2/AC7/AC8 validators) on the same branch.
- Evidence: a declaration consumer assigning `skill`, `output`, and
  `nativeFallback` fails with TS2540; `grep -c "capabilities"` returns 13 rather
  than 12; the AC7 English-only grep has no Spanish match; the AC8 alternation
  succeeds when any one artifact is present instead of requiring all four.
- Plan: P3 restores the additive public profile boundary; P4 adds deterministic
  release evidence; P5 repeats the literal final hardening and PR close-out.
- Acceptance amendment: user-approved SPEC row recorded; replacement frozen
  manifest blob `b47e831108671c9a6993b2762ae6e84e5ec8552e` matches the receipt above and
  strengthens AC3 plus the affected validators without loosening outcomes.
- Remains: P4, P5
- Next: /execute-phase 23 P4

## P3 — 2026-08-22

- Done: P3 — restored public profile source-compatibility. Removed `readonly`
  from `skill`, `output`, and `nativeFallback` on the public `WorkflowSkillProfile`
  interface; introduced `BuiltInSkillProfile` as a deeply readonly type boundary
  for shipped profiles; `WORKFLOW_SKILL_PROFILES` typed as `readonly
  BuiltInSkillProfile[]`; compile-time readonly assertions retargeted to the
  built-in boundary.
  - Gate: `npm test` → exit 0 (47/47); fixture `tsc` → clean (no TS2540);
    `Object.isFrozen(WORKFLOW_SKILL_PROFILES)` → true
- Remains: P4, P5
- Gotchas: `WorkflowSkillCapabilities` still has readonly on all fields (correct —
  it is a deeply readonly interface); the `capabilities` field on the public
  boundary is optional and writable for assignment
- Files: `packages/agentic-workflow-schema/src/index.ts` (WorkflowSkillProfile
  readonly removal + BuiltInSkillProfile type + type assertions); `packages/agentic-workflow-schema/test/capabilities.test.mjs` (compat runtime tests); `packages/agentic-workflow-schema/test/fixtures/workflow-skill-profile-compat.ts` (TS2540 fixture); `packages/agentic-workflow-schema/tsconfig.test.json` (compile-time check)
- Next: /execute-phase 23 P4 — Harden release evidence
