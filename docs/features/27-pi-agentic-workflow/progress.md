# progress — 27-pi-agentic-workflow

Last reviewed: —

## Acceptance receipt v1
- Manifest: docs/features/27-pi-agentic-workflow/ACCEPTANCE.md · Blob: 22d3f3394a9ab0e0c0bd3596767ebeb3e502a44f · Status: frozen · Verified: 2026-08-29

## Dependency receipt v1
- Fingerprint: ca01f5b0d7506a6c4b3ed7eb26485b3bc9b74130 · Closure: 27-pi-agentic-workflow ← (none — SPEC hard deps: none)
- Merged PRs: none required · Fully merged: yes · Verified: 2026-08-29

## Gate receipts (2026-08-29, whole-unit entry)
- Branch: `feat/27-pi-agentic-workflow` (not `main`) — verified with `git branch --show-current`.
- Own-status: roadmap row 27 = `planned` → proceed.
- NRS: ledger `2025-08-22-nrs-regen`, Status `frozen` → consumable.
- Architectural invariants: `n/a: no project invariants declared` (`docs/architecture/ARCHITECTURAL_INVARIANTS.md` absent at this revision; `ls` → exit 2).
- Phase-lint at entry (canonical 8-box contract): P1 PASS (8/8) · P2 PASS (8/8) — all six phases ≤ 8 tasks, single layer, machine-checkable done-when. Recorded task-count drift against the SPEC's stored fingerprints: `decisions.md` 2026-08-29 (execution).

## Unit-loop receipt — P1
- Commit: pending · Gate: `cd packages/pi-agentic-workflow && node --test test/skill-parity.test.mjs` (exit 0, 7/7) · Acceptance blob: 22d3f3394a9ab0e0c0bd3596767ebeb3e502a44f
- Next: P2 · Attempts: 1
- Review-checkpoint trigger recorded (not interrupting, whole-unit mode): layer boundary P1 `config/infra` → P2 `domain`; sensitivity: none (no auth/secrets/CI/migration surface).

## P1 — 2026-08-29
- Done: package skeleton — `package.json` (name/keyword/`publishConfig.access`/`pi` manifest → AC1 command exit 0), `scripts/bundle-skills.mjs` inclusion rule (bundle all skills minus `metadata.internal: true`), `test/skill-parity.test.mjs` written red-first then green (7/7, real tree + 2 fixtures), `src/extension/index.ts` type-only stub referenced by the manifest; 34 skills / 105 files bundled, `bump-skill` excluded; `npm pack --dry-run` lists `dist/extension/index.js`, 105 `skills/` files, `package.json`, `LICENSE` (109 total).
- Remains: P2 routing config engine · P3 routed command execution · P4 settings console · P5 bilingual READMEs · P6 hardening & PR. **Blocked before close-out:** roadmap numbering collision — `main` (829ad18) assigned NN 27/28 to `pre-execution-plan-review`/`bounded-implementation-discovery` after this branch was cut; unit renumber + rebase pending an explicit user decision (frozen `ACCEPTANCE.md` names the `27-` paths).
- Gotchas: Pi's package root does not export `Model`/`ThinkingLevel` — derive them (`NonNullable<ExtensionContext["model"]>`, `ReturnType<ExtensionAPI["getThinkingLevel"]>`); `dist/` is build-only (schema-package precedent), so the pack listing needs `tsc` first; `scripts/bundle-skills.mjs` wipes then copies per skill, so a deleted source skill cannot survive as a stale bundle directory; the bundle path for the CLI resolves from `scripts/..` (package dir) → `../../skills` (repo root), which is why the fixture tests drive `bundleSkills()` with explicit dirs instead of the CLI.
- Files: `packages/pi-agentic-workflow/{package.json,package-lock.json,tsconfig.json,.gitignore,LICENSE,scripts/bundle-skills.mjs,src/extension/index.ts,test/skill-parity.test.mjs,skills/**}`, `docs/features/27-pi-agentic-workflow/{TASKS.md,progress.md,testing.md,known-issues.md,decisions.md}`
- Next: P2 — Routing config engine
