# Unit 181 — progress log (fix/181-pi-server-devdep-obsolete)

## Pre-execution review receipt v1 — plan
- Review: rp-fix181-20260908-001 · Snapshot: 684309e5f394ceab0c9332a914e41cee657307d80a04e3077ae39c04ee8f6e4b · Verdict: plan-review-pass
- Unit: fix-181 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); no `review-spec` upstream, none claimed
- Source revision: 3687c291719fb0d1108383eb16b3a5501eac9beb · Artifact revision: 3687c291719fb0d1108383eb16b3a5501eac9beb
- Reviewer: review-plan (fresh pi session) · Session: pi-web review turn on `fix/181-pi-server-devdep-obsolete` · Role: reviewer · Author: plan-fix (commit `3687c291`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: same-model · Policy: v1
- Context-clean note: this conversation wrote/replanned no part of the unit (review-only turn)
- Started/finished: 2026-09-08T10:39Z / 2026-09-08T10:55Z · Findings: 0 (material open: 0)
- Ledgers read: planning-evidence 11 rows (PE-001…PE-011, embedded in the SPEC) · obligations 9 rows (O1…O9, verified-capable: 0 — all validators pin future work)
- Prior plan receipt (re-review only): none — first cycle
- Portability note: the planner's handoff declared no `artifactRevisionId`; the builder fell back to the source revision. Nothing in this runtime rotates the id — mutate-and-revert detection depends on the next repair producing new bytes and a fresh snapshot (fix-161/fix-166/fix-179 disclosure shape).

### Review-run evidence (commands + results)

- `node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-181 --dir docs/fix/181-pi-server-devdep-obsolete` → digest `684309e5f394ceab0c9332a914e41cee657307d80a04e3077ae39c04ee8f6e4b`, stable across two builds; `unitKind: fix`, artifacts: spec (27686 B) + acceptance (4413 B), `parentSpecSnapshotDigest: null` ✓. Ledgers are embedded in the SPEC (fix template convention), so `planning-evidence`/`obligations` snapshot rows are absent and bound through the whole-file `spec` row. Contexts: `architectural-invariants` absent (optional doc does not exist — invariant classification carried by the SPEC's "Rules that must never be violated" + PE-005); `normalized-repository-state` and `project-guide` present and bound.
- PE-001: `package.json` devDeps `@earendil-works/pi-server: "0.85.0"` + peer `@earendil-works/pi-coding-agent: "*"`; `bun.lock:8` (devDep), `:13` (peer `*`), `:78` (pi-coding-agent@0.85.0), `:82` (pi-server package entry); `grep -rc pi-server src/ test/` → 0, `grep -rln pi-server dist/` → 0 → proven ✓
- PE-002: `CHANGELOG.md:98` is the 0.4.1 row stating the shim rationale (`main` → `experimental/server` → `@earendil-works/pi-server`); `gh issue view 181` fetched live (2026-09-08, OPEN, label `bug`) confirms the root-cause narrative incl. pi PR #9132 → proven ✓
- PE-003: `files:` = `dist`, `skills`, `package.json`, both READMEs, `LICENSE` — never `node_modules`; only shipped behavioral delta is the peer range `*` → `>=0.85.1` (bun/npm warn on a 0.85.0 host) → proven ✓
- PE-005: package manifest + README Notes section carry the peer-declaration claim → proven ✓
- PE-006: `npm view @earendil-works/pi-coding-agent version` → `0.85.1`; `npm view @earendil-works/pi-server version` → `0.85.1` (both live 2026-09-08); issue §"Empirical proof" records 140/140 pass on 0.85.1 without the shim and `ERR_MODULE_NOT_FOUND` on 0.85.0 without it → proven ✓
- PE-007: lock pins `pi-coding-agent@0.85.0` under peer `*`; with `>=0.85.1` that resolution is invalid → re-resolution + prune mechanics; O3's suite gate backstops the new resolution set → proven ✓
- PE-008: `scripts.test` = `tsc && node --test test/*.test.mjs`; `test/shipped-adapter.test.mjs` exists (14 test files total); drift guard `ThinkingLevelsMirrorMatchesPi` at `src/extension/index.ts:39-44` → proven ✓
- PE-009: `.github/workflows/publish-pi-package.yml` — merge-triggered on `packages/pi-agentic-workflow/**`, `bun install --frozen-lockfile` + `bun run test` gate before the version-gated publish; `prepublishOnly` build+test at `package.json:48` → proven ✓ (note: CI's `--frozen-lockfile` requires the P1 lock re-resolution to be committed — the plan's P1 task 2 does exactly that)
- PE-010: `gh issue view 181` live — §Fix items 1–5, §Files changed, §Verification map 1:1 to AC1–AC4 and O1–O7 → proven ✓
- PE-004 / PE-011: derived/decision rows (rollback path, required failure state) — internally consistent with the Rollback section and O8's stop rule → accepted as decisions
- AC5 reachability probe: the frozen regex scored **1** against the index's actual done-row convention (replicated on the #166 done row, `docs/fix/README.md:23`) — the fix-166 PR-1 class of defect (unreachable regex) is absent here
- P4 double index-flip (status flip pre-push, PR-link update post-open, two commits) verified as the established close-out shape (fix-166 P5 precedent) — not a finding
- AC3 reachability: exactly one `0.85.0` occurrence per README (the note lines, `README.md:142` / `README.es.md:148`) → 0/0 reachable post-edit ✓; AC4 reachability: companion table rows use the `| 0.4.1 | …` format → a `| 0.7.1 |` row fits ✓
- Package gate state at review: not run (execution not started; the suite runs at P1 per plan)
- Falsification stance before checking: NO-CONFIRMED-GAPS — the three strongest hostile-reader candidates (PE-007 bun prune mechanics, PE-006's 140/140 claim, PE-003's tarball-surface claim) each resolved to repository/registry evidence; no SPEC obligation silently dies (O1–O9 ↔ AC1–AC5 ↔ issue items 1–5 close); no validator passes on a no-op (AC1–AC4 fail against current bytes)

Ledger sweep L1–L6: L1 pass (`parentSpecSnapshotDigest: null`, stated plainly) · L2 pass (11/11 rows current, proven or decision; no unknown/drifted/stale) · L3 pass (9 obligations, none missing/duplicated) · L4 pass (each row: one phase, one task, owner `execute-phase`, validator copied from ACCEPTANCE/done-when, evidence target; all `planned`) · L5 pass (required failure state O8 has scenario + phase P1 + validator `bun run test` which demonstrably fails on 0.85.0) · L6 pass (no prior findings ledger — first cycle).

Engineering checks: P1–P12 + F1–F4 all **pass** — P1 layers named with path:line + invariant preserved via PE-005 · P2 `Depends on: none`, #182/#179 disjoint per Cross-issue notes · P3 boundary = peer range + README claim, PE-003 · P4 explicit n/a (no secrets/auth/PII; install surface reduced) · P5 bilingual EN+ES scheduled same-change (O5/O7, AC3/AC4) · P6 idempotent commands + execute-phase progress receipts + O4 VERIFY rows · P7 single-revert rollback + 0.7.2 republish mechanics stated · P8 Observability section + CI publish gate + fix-index sensor row · P9 phase order P1→P4 sound (O8 stop-before-P2 protects the note rule), last phase is hardening/close-out, phase-lint PASS 8/8 recorded with fingerprints · P10 every done-when a command with expected outcome, real gate (`bun run test`), no weakening · P11 failure states covered (red suite / pi-server resurfacing / stale note / sole-lockfile via existing `lockfile-policy.test.mjs`), concurrency/oversize n/a for a manifest+docs edit · P12 every cited `path:line` re-read at `3687c291` ✓ · F1 reproduction = issue's empirical matrix + PE-001 zero-reference grep at cited revision · F2 root cause evidenced (`CHANGELOG.md:98` + pi #9132) and is exactly what the fix edits · F3 regression scope = dev/test install surface, detectors named (`shipped-adapter.test.mjs`, lock greps) · F4 revert + republish, no Product-half ceremony.

Verdict: **PLAN-REVIEW-PASS** — 0 findings, 0 material open.

## Acceptance receipt v1
- Manifest: docs/fix/181-pi-server-devdep-obsolete/ACCEPTANCE.md · Blob: 9ff45eb7b4424d10725fc010aaa654716330ad74 · Status: frozen · Verified: 2026-09-08

## P1 — Drop the pi-server devDep and pin the peer to 0.85.1

- VERIFY resolved peer (AC1): `node -p "require('./node_modules/@earendil-works/pi-coding-agent/package.json').version"` → `0.85.1`
- VERIFY suite gate (AC1/O3): `cd packages/pi-agentic-workflow && bun run test` → exit `0`, `tests 140 / pass 140 / fail 0` (tsc type contract incl. `ThinkingLevelsMirrorMatchesPi` + full `node --test` including `shipped-adapter.test.mjs`)
- VERIFY lock prune (AC1): `grep -c "pi-server" packages/pi-agentic-workflow/bun.lock` → `0`
- VERIFY node_modules prune (AC2): `test ! -d packages/pi-agentic-workflow/node_modules/@earendil-works/pi-server` → exit `0` (absent)
- VERIFY peer range (AC2): `node -p "require('./packages/pi-agentic-workflow/package.json').peerDependencies['@earendil-works/pi-coding-agent']"` → `>=0.85.1`
- VERIFY devDep removed (AC2): `node -e "process.exit(require('./packages/pi-agentic-workflow/package.json').devDependencies['@earendil-works/pi-server'] === undefined ? 0 : 1)"` → exit `0`
- Note: `bun install` (v1.4.2) would not auto-upgrade the peer already in `node_modules`; a clean re-resolve (`rm -rf node_modules bun.lock && bun install`) was required to honor `>=0.85.1` and prune `pi-server`.

## Unit-loop receipt — P1
- Commit: 16fd9ee2 · Gate: `bun run test` (exit 0 · 140/140) · Acceptance blob: 9ff45eb7b4424d10725fc010aaa654716330ad74
- Next: P2 · Attempts: 1

## P2 — Refresh the baseline note to pi 0.85.1 (EN + ES)

- VERIFY baseline note EN+ES (AC3/O5): `grep -c "0\.85\.0" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → `0` and `0`; `grep -c "0\.85\.1" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → `1` and `1`
- Bilingual pair edited in the same change: `README.md:142` `Verified against Pi 0.85.1 (2026-09-05)` · `README.es.md:148` `Probado con Pi 0.85.1 (2026-09-05)`

## Unit-loop receipt — P2
- Commit: c1789112 · Gate: AC3 greps (0.85.0 0/0 · 0.85.1 1/1) · Acceptance blob: 9ff45eb7b4424d10725fc010aaa654716330ad74
- Next: P3 · Attempts: 1

## P3 — Release bookkeeping 0.7.1

- VERIFY package version (AC4/O6): `node -p "require('./packages/pi-agentic-workflow/package.json').version"` → `0.7.1`
- VERIFY changelog row EN+ES (AC4/O7): `grep -c "| 0.7.1 |" CHANGELOG.md CHANGELOG.es.md` → `1` and `1`
- Bilingual changelog rows added above the 0.7.0 row in the `@gtrabanco/pi-agentic-workflow` "Companion npm packages" subsections (CHANGELOG.md / CHANGELOG.es.md)

## Unit-loop receipt — P3
- Commit: bd2df74e · Gate: AC4 (version 0.7.1 · changelog rows 1/1) · Acceptance blob: 9ff45eb7b4424d10725fc010aaa654716330ad74
- Next: P4 close-out · Attempts: 1

## P4 — Hardening & PR (close-out)

- Full gate re-run 2026-09-08: `bun run test` → exit 0 / 140/140; AC1–AC4 green; acceptance blob unchanged `9ff45eb7…` (matches receipt); pending-docs `git status --porcelain -- docs/` → empty.
- Fix-index row flipped to `` `done` `` then `` `done` · [#190](https://github.com/gtrabanco/agentic-workflow/pull/190) ``(AC5: 1).
- PR opened: https://github.com/gtrabanco/agentic-workflow/pull/190 (base `main`, head `fix/181-pi-server-devdep-obsolete`, MERGEABLE, body includes `Closes #181`).
- Commits: `16fd9ee2` (P1) · `c1789112` (P2) · `bd2df74e` (P3) · done flip + `65de74e5` (P4). Branch pushed; working tree clean.

UNIT LOOP — fix/181 COMPLETE · Phases: 4 · Acceptance: 9ff45eb7b4424d10725fc010aaa654716330ad74 · Gate: PASS · PR: https://github.com/gtrabanco/agentic-workflow/pull/190
