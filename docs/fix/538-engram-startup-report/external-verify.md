# External Verification Receipt

## 2026-11-14 — EXTERNAL VERIFY (full, initial)

No prior `EXTERNAL VERIFY` block for this unit → full verdict, once. Read-only
run: no commit, no push, no branch, no forge mutation, no code edit. The two
reconstructed harnesses (O12's differential, P2's red corpus) ran in
`mktemp -d` scratch against copies of the base bytes and were removed after;
no mutation-path command ran against the live tree (`docs-generate --check`,
`roadmap-settle`, `lint-changeset` and `phase-lint` are check-only) and
`git status` stayed clean through the run. The base for the change-vs-base
proofs is `origin/main` `0a47bca6`; the branch's merge-base is `a83b9b38`
(D8 — main moved by one docs-only commit, so the changed paths are byte-equal
at both).

```
EXTERNAL VERIFY — base: 0a47bca64c698bb8f0550061284e6c9eeade490e · head: 078e96de12b17fcf6d79b990e1a4aca7c37dc393
Blockers: 0
Advisories: 5 — (1) docs/workflow/SKILL_CONTEXT_BUDGETS.json:37 (AGENTS.md machineLines: 134) vs AGENTS.md:382 (normative-surfaces@1 measures 135): `bun scripts/check-skill-context.mjs --documents` exits 1 at head and identically at base 0a47bca6 — base-present, this unit edits neither the guide nor the budget cell (E11). (2) scripts/residual-classify.mjs:72 imports ./ceremony/lib.mjs, removed by #524: 5 pass/20 fail exit 1 at head, byte-identical at base — base-present, outside this change's regression boundary (E12). (3) scripts/ceremony-unit-plan.test.mjs:263 — 1 red inside the pooled root-suite run (the case hit the 10 s budget after `plan delete` returned exit 1 under four-worker load), passes standalone 18 pass/0 fail exit 0; suite untouched by this diff — disclosed load-flake class (G2), fails the stability check for blocker attribution. (4) docs/fix/531-engram-native-skip-remote-surfaces/SPEC.md:157 (the adapter's informational set, owner index.ts), :356 (O8 — the overlap states the external-server fact), :358 (O10 — one info line for native-active), :446 (D1 — the overlap line) + docs/fix/531-engram-native-skip-remote-surfaces/decisions.md:26 — dated 2026-11-13 closed-unit receipts still asserting truths 538 D3/D6 supersede; historical records, the supersession declared in this unit's Retirements, no live narration carries them. (5) docs/fix/538-engram-startup-report/SPEC.md:318 (O13) — the validator cell says `bun scripts/local-gate.mjs` exits 0 / "gates green before handoff", observed exit 1 here and in the recorded G1/G2; the status cell's stated outcome reproduces (15 of 17 steps, only step-red root-suite, reds = advisories 1–3) — wording only, the obligation's substance verifies.
Sibling sweep: clean on live surfaces — `INFORMATIONAL_ENGRAM` 0 matches in src and tests, the retired advisory/refusal/served-by sentences survive only as this unit doc's quotes of them, the README situation table, skills, docs, changeset, roadmap row and journal entry all carry the new truth; only the dated 531 records in advisory 4 survive, none a live narration
Completeness: S1–S8 all resolved to task (Implements: S#) clauses whose validators re-run green here (P2's red half re-proved in mktemp scratch against the a83b9b38 build: 46 pass / 20 fail exit 1, identical to E4, removed after); O1–O14 all verified — O12's differential (its /tmp script gc'd) reconstructed in fresh scratch: 20 provisionEngram rows → 11 changed all declared, 9 identical; 8 resolveEngramBinary rows identical; 0 undeclared; exit 0; O13 as its status cell states (advisory 5); open ids: none
Spot check: cd packages/pi-agentic-workflow && bun test test/engram-provision.test.mjs test/shipped-adapter.test.mjs → match (66 pass / 0 fail exit 0 = E5)
Verdict: VERIFIED
```

Supporting runs (command: observed), all at head `078e96de` unless noted:

| command | observed |
|---|---|
| `bun test test/engram-provision.test.mjs test/shipped-adapter.test.mjs` | exit 0 · 66 pass / 0 fail (E5) |
| same with `ENGRAM_URL=… ENGRAM_BIN=/nope/engram` exported | exit 0 · 66 pass / 0 fail (E6, O14) |
| `bun run test` (package suite, tsc first) | exit 0 · 871 pass / 0 fail / 77 files (E7) |
| `bun … phase-lint docs/fix/538-engram-startup-report/SPEC.md` | exit 0 · 7 × PASS (6/6), verdict PASS, fingerprint `c852bae1…` (E3) |
| `bun scripts/docs-generate.mjs --check` | exit 0 · 3 checked · 0 missing · 0 stale · 0 orphaned, verdict PASS (E9) |
| `bun scripts/lint-changeset.mjs` | exit 0 · `ok 538-engram-startup-report.md` (E9) |
| `bun scripts/roadmap-settle.mjs` | exit 0 · 196 unit docs · violations 0 (E9) |
| `rg -c '#538' docs/ROADMAP.md` | 1 (O11) |
| `rg -n 'INFORMATIONAL_ENGRAM' packages/pi-agentic-workflow/src` | exit 1 · 0 matches (E10, O10) |
| `bun scripts/local-gate.mjs --no-bail` | exit 1 · 15 pass / root-suite fail / schema-node-compat skipped — exactly one step named FAILED (G1/G2 shape); `bun scripts/run-root-suite.mjs` → 108 pass / 3 FAIL (`check-skill-context`, `residual-classify` = base-red proven at 0a47bca6 exit 1 both; `ceremony-unit-plan` load flake, standalone 18/0 exit 0) |
| red-first in scratch (head tests vs `a83b9b38` sources rebuilt by the package's own `tsc`) | exit 1 · 46 pass / 20 fail — E4 reproduced exactly |
| differential in scratch (base module beside head, 20+8-row corpus) | exit 0 · 11 changed all declared / 9 identical / 0 undeclared — E8 reproduced |
