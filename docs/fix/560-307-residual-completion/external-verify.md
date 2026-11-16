# External verify — fix/560-307-residual-completion

Receipt for the owner's external verification. Read-only pass: no commit, no
push, no branch, no forge mutation, no code edit; the only file this pass
writes is this receipt. The change introduces no command — its diff touches no
path under `packages/`, `scripts/` or `skills/` — so no unproven mutation path
was executed against the live tree; every probe ran read-only, and
`git status --porcelain` stayed empty after each, including after the full
gate.

## 2026-11-16 — full verdict (no prior receipt for this unit)

State bound: unit dir `docs/fix/560-307-residual-completion/` (`SPEC.md`,
`planning-obligations.md` 15/15 `verified`, `planning-evidence.md`,
`decisions.md`) · base ref `origin/main`
`44a20ab607d274377793067c9cadf83e7a248be1` · head
`9dfe671ff70f4a996390c29ec64a26286c072075` · no `EXTERNAL VERIFY` block and no
prior `external-verify.md` for this unit → full verdict, once.

```text
EXTERNAL VERIFY — base: 44a20ab6 · head: 9dfe671f
Blockers: 0 — none; every declared validator re-ran green at head, and each §2 reproducer's RED side was proved at base (44a20ab6 / 2907d5f6)
Advisories: 4 — (1) docs/ROADMAP.md:229-232: the armed row-union driver relocated main's four `### Active` rows #574/#572/#571/#569 from block head to block tail in the owner-run origin/main integration (merge d4a8287f) — by design (packages/agentic-workflow/src/writer/merges.mjs:139, insertions land at the end of their block), key-set complete (37 main rows + #560 = 38), no ordering contract in docs/ROADMAP.md:179-193, all gates green; position-only change to existing rows, disclosed in SPEC E20 as a key-set union but the relocation itself is unstated. (2) docs/fix/435-project-charter/SPEC.md:290 (+ docs/fix/435-project-charter/external-verify.md:80, docs/research/2026-11-12-input-quality-and-editing/README.md:97): still say "#436 … Status: `planned`" — already false at base (issue #436 closed / PR #515 merged 2026-11-11, before 44a20ab6), so pre-existing, not change-caused. (3) docs/fix/560-307-residual-completion/SPEC.md:81 (Impact) and decisions.md:87 (D9): say row 560 "becomes `in-progress · carried by fix #560`" while head reads `done · [#577] · carried by fix #560` — plan-time prose superseded later in the same doc (Log E19); the settle matches the legend (docs/ROADMAP.md:191-192: `done` = built, PR open, awaiting merge) and no gate reads the Impact cell as current state. (4) docs/ROADMAP.md:172: row 560's description dates "promoted 2026-12-18 / Triaged promote 2026-12-18" postdate this session (2026-11-16) — pre-existing at base, description cell untouched by this change.
Sibling sweep: list — no unopposed old-truth claim survives: row 436 `planned`, #383 Future row 4 `open`/`decision-required`, `Nothing is retired` (kept as explicit history with its disclaimer, docs/features/108-machine-gate-receipts/SPEC.md:174) and row 560 `promoted` all leave no lying sibling; the survivors are advisories 2–3 above.
Completeness: S1–S12 resolved (P1–P7 each carry (Implements: S#), every task validator plus phase-lint re-run green here); obligations O1–O15 all `verified` with their validators re-run green here; open ids: none.
Spot check: bun scripts/tier-cost.mjs compare --ledger docs/workflow/TIER_COST.md → match (reported E3: exit 2 · verdict insufficient-corpus · min_units_per_tier 3 · short_tiers passive 0 · standard 0 · high 0 · every group units 0 — observed identical)
Verdict: VERIFIED
```

### Declared commands re-run (command: observed)

- `bun test scripts/ledger-ownership.test.mjs` → exit 0, 14 pass (AC2)
- `rg -n '^tier-cost \| docs/workflow/TIER_COST.md' skills/pre-execution-review/references/LEDGERS.md` → line 178, match 1 (AC2); present at base `44a20ab6` too (D1 settlement, not amendment)
- `rg -c '^- \`open\` — 2026-11-03, \*\*decision-required' docs/fix/383-measured-acceptance/SPEC.md` → exit 1 at head; match 1 at base `2907d5f6` and `44a20ab6` (AC3, E5)
- `rg -c 'settled, \*\*not rejected\*\*' docs/fix/383-measured-acceptance/SPEC.md` → 1 (AC3)
- `rg -c 'retired the review-local gate re-run attestation' docs/features/108-machine-gate-receipts/SPEC.md` → 1 (AC4); `git diff d7b391b4^1 d7b391b4 -- skills/review-verify/SKILL.md skills/audit-pr/references/01_MERGE_GATES.md` shows the removed "verification gate ran in THIS review … paste exit status per command" and the plain merge-gate row (E10 proved)
- `rg -c 'wall[_-]clock|\belapsed\b' scripts/tier-cost.mjs docs/workflow/TIER_COST.md` → exit 1 (AC5)
- `rg -c 'forward-only' docs/fix/383-measured-acceptance/SPEC.md` → 1 (AC6)
- `rg -c '^## Project charter' AGENTS.md` → exit 1; `^- \*\*D5 —` in decisions.md → line 49 (AC7)
- `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap read docs/ROADMAP.md --nn 436` → `done · [#515](https://github.com/gtrabanco/agentic-workflow/pull/515)`; every other cell byte-identical to `origin/main` (AC8); `--nn 560` → `done · [#577](https://github.com/gtrabanco/agentic-workflow/pull/577) · carried by fix #560`
- `bun scripts/tier-cost.mjs compare --ledger docs/workflow/TIER_COST.md` → exit 2, `verdict: insufficient-corpus`, 0 units per tier; `read` → `rows: []` exit 0; `git status --porcelain` empty after both (AC9/AC11, spot check)
- `rg -c 'savings|delta_total' scripts/tier-cost.mjs` → exit 1 (AC10)
- `git diff --name-only 2907d5f6...HEAD | rg '^(packages|scripts|skills)/'` → exit 1; same vs `origin/main` → exit 1 (AC12)
- `bun test scripts/normative-drift.test.mjs` → exit 0, 21 pass (AC12); touched suites total 63 pass / 0 fail (14 + 21 + 28) matching G4; `bun scripts/vocabulary-probe.mjs` → 0 violations
- `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/560-307-residual-completion/SPEC.md` → exit 0, `verdict PASS` P1–P7 6/6 (O1, G2)
- `rg -c '\| planned \|' docs/fix/560-307-residual-completion/planning-obligations.md` → exit 1 (O14)
- `bun scripts/roadmap-settle.mjs` → exit 0, `210 unit docs checked · 0 violations` (O15, matches G4/E17)
- `bun scripts/docs-generate.mjs --check` → exit 0, 0 stale (O13, matches G3/E15)
- `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/560-307-residual-completion/SPEC.md` → exit 0 `ok: true`; `bun scripts/promise-coherence.mjs …` → PASS 7 checked · 0 skipped (G3)
- `bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-route --triage 560-307-residual-completion` → exit 0; block byte-matches the pasted `## Triaged steps` (G1)
- `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths "…"` → exit 0, `passive` / `no-executable-effect` / `signals: []` — matches `## Risk tier` verbatim (E13)
- `bun scripts/test-impact.mjs --base 2907d5f6` → `verdict: empty`, executable 0 (`changed: 14` post-merge vs E12's 9 pre-merge — count rides the main integration, verdict identical); `--base origin/main` → `verdict: empty`, changed 9 (matches E20) (E12/E20)
- `bun scripts/local-gate.mjs --skip-network --jobs 1` → exit 0, **`local-gate: PASS — 15 step(s) in 539s`**, all 15 steps `exit 0` incl. `root-suite`, `crate-suite-bun`, `crate-suite-node`, `journal-carrier-check` (G5/G6, E18; the 4 network steps skipped by the offline subset as disclosed)
- base-side instrument identity: `git diff origin/main...HEAD -- scripts/tier-cost.mjs docs/workflow/TIER_COST.md` and the same vs `2907d5f6` → empty (E14's byte-identical premise); `git diff origin/main...HEAD -- docs/LOGS.md` → empty (E18); journal fragment `20261116T005405Z-fix-560-307-residual-completion-narrative-local.md` present (P6 validator)
