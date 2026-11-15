# 541 — NaN embed preset · external verification

2026-11-15 · first receipt for this unit (no prior `EXTERNAL VERIFY` block in this
unit dir → full verdict, once). Read-only run: no commit, no push, no branch, no
forge mutation; the only write is this receipt. The one mutation-shaped check
(the declared load-vs-sync differential) ran in `mktemp -d` scratch copies of
`origin/main` and this tree, never against the live tree, and was removed after.

Base `4eedcf6107f976e08ffe0aa813f035a3aeb3573b` (`origin/main`) · head
`5379370d0450ab4736e0b0bd8ac0662f9c225663`. The branch advanced mid-verification
from `44f03656` to `5379370d` (19:27 UTC, another session's `docs(log)` journal
fragment — one file, 6 insertions, no executable surface); every suite, gate and
docs check below was executed at or after those bytes.

```text
EXTERNAL VERIFY — base: 4eedcf6107f976e08ffe0aa813f035a3aeb3573b · head: 5379370d0450ab4736e0b0bd8ac0662f9c225663
Blockers: 1 — docs/fix/541-nan-embed-preset/SPEC.md:260 (task P2's validator; same wrong path at SPEC.md:165 Applicable tests, SPEC.md:207 AC-S3, SPEC.md:262 Relevant files) and docs/fix/541-nan-embed-preset/planning-obligations.md:11,12,13 (O1, O2, O3): the declared validator `cd packages/agentic-workflow && bun test test/doc.config.test.mjs` cannot run — `packages/agentic-workflow/test/doc.config.test.mjs` does not exist (reproducer at head: exit 1, `The following filters did not match any test files: test/doc.config.test.mjs`; `git log --all -- '*doc.config.test.mjs'` empty and `git ls-tree` at `4bb3a73a`/`049ec9ac`/head list only `config-cli.test.mjs`, so the file never existed on any ref), so O1/O2/O3's `verified` outcome and P2/AC-S3's check do not re-run green here — the cases those rows name live in `packages/agentic-workflow/test/doc.store.test.mjs` (the red commit `4bb3a73a` added them there; re-run green here: 37 pass · 0 fail). Base-vs-head: at `4eedcf61` no unit doc, ledger or surface names that path (`git grep -c 'doc.config.test' origin/main -- docs packages` → none), so the claim is change-caused, and the reproducer is this unit's own declared command — it fires on no other surface (stability check clean). Smallest action: repoint SPEC.md:165/207/260/262 and planning-obligations.md:11-13 at `test/doc.store.test.mjs` (the suite carrying the 10 provider-block cases), or add the named sibling suite, then re-run those validators → /aw-local-apply
Advisories: 2 — (1) docs/fix/541-nan-embed-preset/SPEC.md:223 (AC-S6) vs the issue's verbatim first acceptance bullet (S9): a live `doc --sync` on this repo with no hand-written `index.json` and no injected embedder is never executed — the unit operationalizes it as a git fixture + injected embedder, and this environment has no provider key/network, so it is out-of-domain rather than reproduced; no dated disposition line names that re-scope. (2) docs/fix/541-nan-embed-preset/SPEC.md:117 (Retirements) quotes the console prose "the only file this console writes is the unified config" as a surface it narrows; that sentence exists nowhere at base or head (`rg 'only file.*console'` finds only this SPEC line), so the retirement names a surface that is not in the tree — dead receipt, no behavior at stake.
Sibling sweep: clean — greps over every surface the change moved or rewrote (`DEFAULT_PACING` ownership after D5 incl. the `embeddings.mjs` re-export and `config.d.mts`, the `positiveInteger` hint branch and every pre-existing caller, `validateProviderConfig`/`validateIndexConfigObject` for a second copy of the provider schema, the console's write surface, hand-written `index.json` instructions in `skills/`/`template/`/`docs/workflow`, "refused only at sync" claims in the READMEs) return no surviving mention asserting the old truth; the only stale mentions are the blocker's own carriers (SPEC.md + planning-obligations.md).
Completeness: S1-S10 resolved (S1→P1,P9 · S2→P3,P4,P7 · S3→P7 with P2's validator blocked · S4→P4,P5 · S5→P3 · S6→P7,P8 · S7→P4,P5,P8 · S8→ the Non-goals disposition · S9→P4,P6,P8,P9 with P2's validator blocked · S10→ D1,D2,D3) — open ids: none beyond the blocked P2/AC-S3/O1/O2/O3 path above; obligations O4-O15 re-ran `verified` green here, O1/O2/O3 are the blocker's ids
Spot check: cd packages/pi-agentic-workflow && bun test test/embed-profile.test.mjs test/embed-profile-console.test.mjs test/embed-profile-e2e.test.mjs → match (17 / 7 / 2 pass, 0 fail, exit 0 — equal to E14's `17 pass · 0 fail` + `9 pass · 0 fail` at `034aa68d`)
Verdict: NEEDS-DECISION (1 open blocker)
```

Commands re-run in this session (command: observed result):

| Command | Observed |
|---|---|
| `cd packages/agentic-workflow && bun test test/doc.config.test.mjs` | exit 1 — filters matched no test file (the blocker) |
| `cd packages/agentic-workflow && bun test test/doc.store.test.mjs` | exit 0 · 37 pass · 0 fail |
| `cd packages/agentic-workflow && bun run test` | exit 0 · 808 pass · 0 fail (46 files) |
| `cd packages/pi-agentic-workflow && bun run test` | exit 0 · 899 pass · 0 fail (80 files) |
| `cd packages/pi-agentic-workflow && bun test test/embed-profile.test.mjs test/embed-profile-console.test.mjs test/embed-profile-e2e.test.mjs` | exit 0 · 17 / 7 / 2 pass |
| `cd packages/pi-agentic-workflow && bun test test/provider-presets.test.mjs test/embed-profile.test.mjs` (P3) | exit 0 · 31 pass |
| `cd packages/pi-agentic-workflow && bun test test/vendor-neutral.test.mjs test/provider-presets.test.mjs test/settings-console.test.mjs` | exit 0 · 85 pass |
| `cd packages/pi-nan-agentic-workflow && bun run test` | exit 0 · 36 pass · 0 fail (5 files) |
| `cd packages/pi-nan-agentic-workflow && bunx tsc --noEmit` (E8) | exit 0 |
| `! rg -qi 'nan' packages/pi-agentic-workflow/src/config/embed-profile.ts packages/pi-agentic-workflow/src/config/presets.ts`; `! rg -q 'nan' packages/agentic-workflow/src/doc/config.mjs` | exit 1 / 1 (no match — neutrality holds) |
| `bun scripts/run-root-suite.mjs` | exit 0 · 113 PASS · 0 FAIL |
| `bun scripts/local-gate.mjs --jobs 1` | exit 0 · `local-gate: PASS — 19 step(s) in 408s` |
| `bun scripts/lint-changeset.mjs` | exit 0 · 91 ok incl. `541-nan-embed-preset.md` |
| `bun scripts/version-parity-gate.mjs --content` | exit 0 · `VERDICT: PASS` |
| `bun scripts/docs-generate.mjs --check` | exit 0 · `0 stale` · `verdict: PASS` |
| `bun scripts/check-skill-context.mjs` | exit 0 · `PASS context budgets: 30 skills` |
| `node packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/fix/541-nan-embed-preset/SPEC.md` | exit 0 · `violations: 0` |
| `node packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` · `node scripts/log-immutability.mjs` | exit 0 · `{"ok":true,"checked":41,…}` · `verdict: PASS` |
| `rg -c '^\| O[0-9]+ \|' docs/fix/541-nan-embed-preset/planning-obligations.md` (P1) | 15 (≥ 15) |
| `rg -c 'provider\.chunk_limit must be a positive integer' packages/agentic-workflow/src/doc/config.mjs` (Retirements) | 1 |
| Differential in `mktemp -d` (base copy vs head copy, `loadConfig`): `provider.pacing.batchSize: 0` · `provider.baseUrl: ""` · `provider: null` · a valid block | base: LOADED / LOADED / LOADED / LOADED · head: REFUSED (named key) / REFUSED (named key) / LOADED / LOADED — the declared tightening D4 reproduces exactly, valid configs byte-identical |

`git status --short` was empty after every verification command (the gate's
generators wrote only gitignored build output); all `/tmp` scratch used here was
removed. This receipt is the run's only write.
