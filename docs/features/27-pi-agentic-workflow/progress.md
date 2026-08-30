# progress — 27-pi-agentic-workflow

Last reviewed: 2026-08-29 (P3)

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
- Commit: `0bf01c3` feat(27-pi-agentic-workflow): package skeleton with byte-identical skill bundling (P1) · Gate: `cd packages/pi-agentic-workflow && node --test test/skill-parity.test.mjs` (exit 0, 7/7) · Acceptance blob: 22d3f3394a9ab0e0c0bd3596767ebeb3e502a44f
- Next: P2 · Attempts: 1
- Review-checkpoint trigger recorded (not interrupting, whole-unit mode): layer boundary P1 `config/infra` → P2 `domain`; sensitivity: none (no auth/secrets/CI/migration surface).
- *SHA note:* committed as `f8c4a78`, rebased onto `main@829ad18` on 2026-08-29 before P2 → `0bf01c3`. Content identical; the rebase carried the user-approved roadmap renumber (`decisions.md`).

## P1 — 2026-08-29
- Done: package skeleton — `package.json` (name/keyword/`publishConfig.access`/`pi` manifest → AC1 command exit 0), `scripts/bundle-skills.mjs` inclusion rule (bundle all skills minus `metadata.internal: true`), `test/skill-parity.test.mjs` written red-first then green (7/7, real tree + 2 fixtures), `src/extension/index.ts` type-only stub referenced by the manifest; 34 skills / 105 files bundled, `bump-skill` excluded; `npm pack --dry-run` lists `dist/extension/index.js`, 105 `skills/` files, `package.json`, `LICENSE` (109 total).
- Remains: P2 routing config engine · P3 routed command execution · P4 settings console · P5 bilingual READMEs · P6 hardening & PR. ~~**Blocked before close-out:** roadmap numbering collision~~ — **reconciled 2026-08-29 before P2**: the user kept NN 27 for this unit, the two unstarted `idea · scheduled` rows on `main` moved to 28/29, and the branch was rebased onto `main@829ad18`; `git diff main --name-only` now lists only AC16's allowed paths and the acceptance blob is untouched (`decisions.md`, `known-issues.md`).
- Gotchas: Pi's package root does not export `Model`/`ThinkingLevel` — derive them (`NonNullable<ExtensionContext["model"]>`, `ReturnType<ExtensionAPI["getThinkingLevel"]>`); `dist/` is build-only (schema-package precedent), so the pack listing needs `tsc` first; `scripts/bundle-skills.mjs` wipes then copies per skill, so a deleted source skill cannot survive as a stale bundle directory; the bundle path for the CLI resolves from `scripts/..` (package dir) → `../../skills` (repo root), which is why the fixture tests drive `bundleSkills()` with explicit dirs instead of the CLI.
- Files: `packages/pi-agentic-workflow/{package.json,package-lock.json,tsconfig.json,.gitignore,LICENSE,scripts/bundle-skills.mjs,src/extension/index.ts,test/skill-parity.test.mjs,skills/**}`, `docs/features/27-pi-agentic-workflow/{TASKS.md,progress.md,testing.md,known-issues.md,decisions.md}`
- Next: P2 — Routing config engine

## Unit-loop receipt — P2
- Commit: `5fec5d8` feat(27-pi-agentic-workflow): strict routing config engine with trust-gated merge (P2) · Gate: `cd packages/pi-agentic-workflow && node --test test/config-merge.test.mjs test/default-inherit.test.mjs test/untrusted-project-config.test.mjs` (exit 0, 23/23) · Acceptance blob: 22d3f3394a9ab0e0c0bd3596767ebeb3e502a44f (re-verified after the rebase)
- Full unit gate at the same revision: `npm test` → exit 0, 30 pass / 0 fail (P1 parity 7 + P2 23).
- Next: P3 · Attempts: 1
- Review-checkpoint trigger recorded (not interrupting, whole-unit mode): layer boundary P2 `domain` → P3 `api`; sensitivity: yes — P3 touches project-trust enforcement and model mutation (`setModel`), so the end review must read AC13 + AC7 evidence.

## P2 — 2026-08-29
- Done: routing config engine — `src/config/types.ts` (file shape vs. effective shape, `ModelRef` as a `${string}/${string}` template type so a slashless reference fails at compile time *and* at validation), `src/config/defaults.ts` (shipped `inherit`/`inherit` + `onUnavailableRoute: "stop"`), `src/config/schema.ts` (strict validator: only documented keys, only documented value shapes, field-pathed issues, blank file = empty config), `src/config/merge.ts` (per-key project-over-global cascade: project command → global command → resolved default → shipped default; inputs never mutated or aliased), `src/config/load.ts` (`configFilePaths(agentDir, cwd)` + trust-gated read that does not touch the project file while untrusted; fails closed). Suites written red-first and proven red (exit 1) before the modules existed: `config-merge` 9, `default-inherit` 8, `untrusted-project-config` 6.
- Also: rebase + roadmap renumber applied under a user decision (28/29 for the two unstarted rows), then P1's parity gate and `npm pack` listing re-verified against the new base — 34 skills / 105 files unchanged, `git diff main --name-only` clean of AC16-violating paths.
- Remains: P3 routed command execution · P4 settings console · P5 bilingual READMEs · P6 hardening & PR.
- Gotchas: an invalid file returns `{ok:false, issues}` with **no** `config` property, so a caller cannot merge a rejected file by accident; `loadConfig` answers `ok:false` by handing back the shipped default, not a partial merge, so a broken or hostile project file can never produce a partial route; the loader takes the *directories* as inputs (Pi's `getAgentDir()`, `ctx.cwd`) so a relocated Pi profile works and tests never touch the real `~/.pi/`.
- Files: `packages/pi-agentic-workflow/{src/config/*.ts,test/config-merge.test.mjs,test/default-inherit.test.mjs,test/untrusted-project-config.test.mjs,src/extension/index.ts}`, `docs/features/27-pi-agentic-workflow/{TASKS.md,progress.md,testing.md,known-issues.md,decisions.md}`, `docs/features/ROADMAP.md`
- Next: P3 — Routed command execution

## Unit-loop receipt — P3
- Commit: pending · Gate: `cd packages/pi-agentic-workflow && node --test test/alias-coverage.test.mjs test/argument-forwarding.test.mjs test/dispatch-refusals.test.mjs test/restore-after-settle.test.mjs test/unavailable-stop.test.mjs test/first-run-hint.test.mjs` (exit 0, 37 tests) · Acceptance blob: 22d3f3394a9ab0e0c0bd3596767ebeb3e502a44f
- Full unit gate at the same revision: `npm test` → exit 0, 74 pass / 0 fail. AC1 manifest check re-run → exit 0. `npm pack --dry-run` → 129 files.
- Next: P4 · Attempts: 1
- Review-checkpoint trigger recorded (not interrupting, whole-unit mode): sensitivity — this phase is the project-trust + session-mutation surface (`setModel`, dispatch guards, restore), i.e. exactly the AC13/AC7 evidence the end review must read. Deviation to review: the P3 suites were authored after the implementation (see `decisions.md`), with mutation-killing as the compensating evidence.

## P3 — 2026-08-29
- Done: routed command execution — `src/routing/types.ts` (narrow Pi views; `M` bound to Pi's own `Model` so no cast reintroduces a fake one), `src/routing/catalogue.ts` (bundled `user-invocable: true` skills → commands, duplicate/missing reports), `src/routing/dispatch.ts` (guards → route resolution → availability → snapshot → apply → hint → dispatch; settle restores), `src/routing/state.ts` (first-run acknowledgement in its own global file), `src/extension/factory.ts` (Pi-free registration), `src/extension/index.ts` (the only Pi-value importer: `getAgentDir`, context/surface translation, the three lifecycle subscriptions). 37 new tests across the six AC validators, plus the AC6 dispatch leg added to `test/default-inherit.test.mjs` and the P2 carry-in (configured route matching no command is reported once) in `test/alias-coverage.test.mjs`.
- Remains: P4 settings console · P5 bilingual READMEs · P6 hardening & PR.
- Gotchas: Pi's `model_select` fires for our own `setModel` as well as the operator's — `source` is `"set"` either way, so the only reliable discriminator is comparing the event's model with the one the turn applied; selecting a model can move the thinking level inside Pi, so the snapshot thinking level must be restored *after* the model or AC8 cannot hold; `ctx.modelRegistry` and `ctx.ui.notify` live on the invocation context, not on `pi`, which is why the router resolves its surface per call instead of holding one.
- Files: `packages/pi-agentic-workflow/{src/routing/*.ts,src/extension/factory.ts,src/extension/index.ts,src/config/schema.ts,test/alias-coverage.test.mjs,test/argument-forwarding.test.mjs,test/dispatch-refusals.test.mjs,test/restore-after-settle.test.mjs,test/unavailable-stop.test.mjs,test/first-run-hint.test.mjs,test/helpers/session.mjs,test/default-inherit.test.mjs}`, `docs/features/27-pi-agentic-workflow/{TASKS.md,progress.md,testing.md,decisions.md}`
- Next: P4 — Agentic-workflow settings console
