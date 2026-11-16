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

## 2026-11-16 — delta verdict (corrections and two owner-routed units landed since receipt 1)

State bound: unit dirs on this PR per the owner's `fix-here` route —
`docs/fix/560-307-residual-completion/` (the branch's unit; latest prior
receipt above, full verdict `VERIFIED` 0 blockers 4 advisories at head
`9dfe671f`), plus the carried units `docs/fix/566-upstream-corrected-instruction-bugs/`
and `docs/fix/567-path-protection-bypass/` (no prior receipt — first verdict
here) · free-text intent `#577` (PR https://github.com/gtrabanco/agentic-workflow/pull/577)
selects the target · base ref `origin/main` moved twice mid-run
(`a05d6907` → `d1287c3d` at close; the branch integrates main only through
merge-base `af3e6f22`) · corrections since receipt 1 (8b9857d6, 1a1dfa02,
84473468, 226a9e95) → **delta verdict**: receipt 1's blockers (none to
re-verify) plus the delta diff `9dfe671f..084f70cf` (24 branch commits: the
advisory batch, units #566/#567, integration/roadmap/projection repairs, log
fragments), then the spot check.

```text
EXTERNAL VERIFY — base: 9dfe671f · head: 084f70cf
Blockers: 4 —
  B1 docs/fix/560-307-residual-completion/SPEC.md:301-305 (AC12) + planning-obligations.md:22 (O12): the declared proof `git diff --name-only 2907d5f6...HEAD | rg '^(packages|scripts|skills)/'` must exit 1 ("every touched carrier is prose", "no executable path changes") but exits 0 with 10 paths at head (probe.mjs, memory-probe.test.mjs, extension/index.ts, guards/shell-path.ts, shell-write-guard.test.mjs, packages README, TURN_CONTRACT.md, MEMORY.md + main's run-root-suite pair) — base-vs-head: same command exits 1 at receipt-1 head 9dfe671f (re-observed), so the claim died with the delta's #566/#567 code landing on this branch; normative-drift half of AC12 still exits 0 · smallest action: dated AC12/O12 amendment scoping the proof to unit-560's own diff (or restating it over the multi-unit branch's declared file list), validator re-run green → /aw-local-apply
  B2 docs/fix/566-upstream-corrected-instruction-bugs/SPEC.md:150 (AC4) + planning-obligations.md:20 (O10): "the skills diff being `skills/unit-lane/references/MEMORY.md` only" is false at head — `git diff --name-only origin/main...HEAD -- skills/` prints MEMORY.md **and** skills/orchestration-envelope/references/TURN_CONTRACT.md (567's declared contract surface); base-vs-head: the clause held at 566's evidence time (e9d1c09f, pre-567) and at base (no 566 unit, branch-scope skills diff empty), falsified by 7ef2f738 on the same branch; AC4's first proof clause (execute-phase/log-session diff) and O10's validator column both still exit 0 → smallest action: dated AC4/O10 amendment scoping "the skills diff" to B1's own change or naming TURN_CONTRACT as 567's declared second file → /aw-local-apply
  B3 docs/features/66-engram-memory-substrate/SPEC.md:350 (AC8 description): surviving old-truth sibling of B1 — "both sides read back with irreconcilable versions surfaced" stands with no correction note while the change rewrote exactly that rule in MEMORY.md §7 (note added only at :106); 566's own Impact (:54) and O3 (planning-obligations.md:13) promise the dated note on "(narrative line + AC8 description)", so O3's stated outcome is not fully delivered (its validator `rg -c 'corrected 2026-11-16'` matches 1 — one note, wrong surface only); base-vs-head: at base af3e6f22 the old clause was live (rg → 1), so AC8 was true then and became false by this change (F51/F53 class) → smallest action: append the same dated Mirror-contract note to AC8's cell, re-run O3's validator → /aw-local-apply
  B4 docs/features/66-engram-memory-substrate/SPEC.md:257 and :272 + docs/fix/538-engram-startup-report/SPEC.md:134: surviving five-check siblings of B2 — "verdict is `ok` only when all five checks pass…", "(all five checks pass, verdict `ok`)", "(probe.mjs, five checks, 30 s ceiling)" are false after the sixth check shipped (probe.mjs CHECK_IDS, README six-check table, header "Six checks"); not dispositioned anywhere (unlike CHANGELOG 0.4.0, dispositioned at 566 SPEC:61, and the dated log line 66:411, which stays history); base-vs-head: at base af3e6f22 (and current origin/main) probe.mjs has no `instance-id` (rg → exit 1) so the lines were true then — change-caused, delta-only → smallest action: dated six-check correction notes on the three lines (same style as 66:106) → /aw-local-apply
Advisories: 5 —
  A1 packages/pi-agentic-workflow/src/guards/shell-path.ts (extraction sets) with skills/orchestration-envelope/references/TURN_CONTRACT.md:188: own probe shows statically visible out-of-root literals via `sed -i` and `dd of=` pass un-judged (write-shaped never set) — why advisory: recorded design boundary (567 decisions D2.2/Future-cost names `dd`/`sed -i` as future indicators, owner ruled a-enforce, contract says "never full shell coverage"), strictly better than base (zero shell coverage), and the contract sentence "only the command's literal operands … are judged" reads wider than the extraction lists do.
  A2 packages/agentic-workflow/src/memory/probe.mjs:38: the unchanged bounds sentence "4 s for the HTTP/runner/version calls, 10 s for the two CLI-backed calls" now undercounts (instance-id is a third CLI-backed call at 4 s) and disagrees with the same paragraph's updated "4+4+4+4+10+10 = 36 s" — why advisory: comment prose only; PROBE_TIMEOUTS, README table and outputs are correct.
  A3 docs/fix/566-upstream-corrected-instruction-bugs/SPEC.md:149 (AC3): parenthetical expects `rg -c 'review_due' skills/ packages/` → "only the historical feature-79/560 citations", observed exit 1 (zero matches — those citations live in docs/ only) — why advisory: evidence-description imprecision; the substantive no-adoption claim reproduces stronger than stated (O11 green).
  A4 environment (scripts/worktree-guard.mjs): first declared-command gate run FAILED at step 12/15 on two sibling worktrees (feat-565-quality-sensor, fix-570-track-undici-advisories "merged into origin/main") — why advisory: not change-caused — the identical FAIL reproduces at the primary checkout (base state), the guard reads no branch bytes, refs/worktrees on this shared box moved repeatedly mid-run (origin/main fetched twice, a third sibling worktree created, worktree-guard verdict flapped FAIL→PASS→FAIL on other worktrees), and the re-run passed all 15 steps; also disclosed: head advanced 059b6fdf → 084f70cf at 11:23:09 during binding (concurrent journal-fragment commit, +6 lines, no executable/contract surface — results hold for both heads); and this verifier's own incident — an unquoted heredoc executed four benign scratch writes under /home/agent (aw-verify-OUTSIDE*.txt, aw-verify-dd.bin) outside the repository, removed within minutes, `~/.pi/agent/prompts/aw-verify-probe.md` never created, `git status --porcelain` empty throughout (no live-tree mutation).
  A5 standing survivors from receipt 1's advisories: docs/fix/435-project-charter/external-verify.md:80 and docs/research/2026-11-12-input-quality-and-editing/README.md:97 still read "#436 planned/#366 planned" — why advisory: pre-existing at base (receipt 1 advisory 2), dated historical documents, dispositioned wontfix-as-history in D13; receipt-1 A1 (row relocation) wontfix stands, A2 (435's two Future rows, Resolved notes ×2), A3 (Impact cell :81 settles `done · [#577]`) and A4 (ROADMAP `2026-12-18` → 0; survivors are only 560's own receipts quoting the pattern) all re-verified fixed.
Sibling sweep: list — B3 (66:350) and B4 (66:257, 66:272, 538:134) are the lying siblings, A5 the two dated-history mentions; otherwise clean: "keep both and surface the difference" → 0 outside 566's own issue/retirement quotes, "never reaches the write/edit prevention" → 0 in code (1 at base), no consumer asserts a single-surface guard, `path-protection@1` fence byte-identical, README/header probe narration both six, CHANGELOG 0.4.0 five-check row dispositioned history, 66:411 dated log line history.
Completeness: 560 S1–S11 resolved (P1–P7 `(Implements:)` present, validators + phase-lint exit 0 here); S12 task P7 validator green but its AC12 proof is red — open via B1. 566 S1–S4 all tasks present and green except AC4's proof clause (B2) and O3's outcome (B3). 567 S1–S3 resolved (P1–P6 green). Obligations: 560 O1–O11, O13–O15 verified-green, **O12 red** (B1); 566 O1–O9, O11–O12 verified-green, O10's validator green with its invariant clause red (B2); 567 O1–O12 all verified-green.
Spot check: bun scripts/local-gate.mjs --skip-network --jobs 1 → match (reported G1 "local-gate: PASS — 15 step(s)"; observed final run "local-gate: PASS — 15 step(s) in 611s" exit 0 with all 15 steps — run 1 of the identical command environment-failed at worktree-guard, disclosed in A4 with base-side proof)
Verdict: NEEDS-DECISION (open blockers: B1, B2, B3, B4)
```

### Declared commands re-run this delta (command: observed)

- `bun test packages/agentic-workflow/test/memory-probe.test.mjs` → exit 0, **25 pass / 0 fail** (matches E4 green); red side re-proved in `mktemp -d` scratch at `68470eea` → **exit 1, 8 fail / 17 pass** (exact E4 match), removed after.
- `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` → exit 0, **21 pass / 0 fail**; red side in scratch at `6fff112f` → **exit 1, module `../dist/guards/shell-path.js` absent** (exact E4 match), removed after. Both red commits touch their test file alone (`git show --stat`).
- `cd packages/pi-agentic-workflow && bun run test` → exit 0, **920 pass / 0 fail across 81 files** (O8, matches E4/E8).
- `bun test packages/pi-agentic-workflow/test/path-protection.test.mjs` → exit 0, 25 pass (regression scope: edit/write containment untouched).
- `bun test scripts/normative-drift.test.mjs` → exit 0, 21 pass (AC12's second half, 567 AC4); `bun scripts/vocabulary-probe.mjs` → PASS, 0 violations; `bun test scripts/tier-cost.test.mjs scripts/ledger-ownership.test.mjs scripts/roadmap-settle.test.mjs scripts/vocabulary-probe.test.mjs` → exit 0, 42 pass (63 with normative-drift, matches G4/E25).
- `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint <SPEC>` × 560/566/567 → exit 0, `verdict PASS` each; `verify <SPEC>` × 3 → exit 0 `ok: true`; `promise-coherence <SPEC>` × 3 → PASS (560: 7 checked · 0 skipped; 566/567: 2 checked · 4 disclosed skips each).
- `bun scripts/check-skill-context.mjs --routes --budgets` → exit 0, `PASS context budgets: 30 skills` (E9 repair holds); `bun scripts/docs-generate.mjs --check` → exit 0, 0 stale (O13); `bun scripts/roadmap-settle.mjs` → exit 0, **213 unit docs · 0 violations** (O15, matches E9); `bun scripts/lint-changeset.mjs` → exit 0; `bun scripts/test-impact.mjs --base origin/main` → exit 0, `reason: 7 executable path(s), 9 symbol(s), 6 suite(s)`.
- 566 obligation battery: O1 exit 1 · O2 1 · O3 1 · O4 1 · O5 1 · O7 exit 0 (2 commits) · O8 1 · O9 exit 0 · O10 first clause exit 0/empty (second clause red — B2) · O11 gh body match 1 + `rg review_due skills/ packages/` exit 1 · O12 gate green (below).
- 567 battery: O2 1 · O5 1 · O6 1 · O7 1 · O9 exit 0 (`6fff112f`) · O10 exit 0 · O11 `[#567] … done · [#577]` 1 (566's row 1) · retirement pin exit 0/0 matches (1 at base `origin/main`) · O8 920 green · O1/O3/O4 suites green.
- 560 battery: LEDGERS line 178 present · O3 exit 1 + `settled, not rejected` 1 · O4 1 · O5 exit 1 · O6 1 · O7 exit 1 + D5 present · O10 exit 1 · O13 0-stale · O14 exit 1 · O8 `roadmap read --nn 436` → `done · [#515]`, `--nn 560` → `done · [#577] · carried by fix #560` · O9 compare exit 2 `units: 0`, O11 `rows: []` · **O12 red (B1)** · phase-lint/verify/promise-coherence green.
- Advisory corrections re-verified: 435's two `Resolved 2026-11-16` notes → 1 each, original `Status: planned` rows preserved ×2; 560 Impact settle → 1; `rg -c '2026-12-18' docs/ROADMAP.md` → exit 1 (0).
- Live read-only probe: `bun packages/agentic-workflow/bin/agentic-workflow.mjs memory probe` → exit 0, **six checks**, `instance-id · ok · instance-id capability served` (E5 reproduces; `degraded` only on the known `session-ambiguity`).
- Own probes (derived from S1/S2 wording, not the writer's tests): fake-`engram` PATH — old core → `capability-unmet` naming `instance-id`, exit 0 degraded; `ENGRAM_URL` set → `ok · remote runtime authoritative — local instance-id not judged`; no binary → `binary-missing`, exit 0. Shipped handler (`dist/extension/index.js`) with own inputs — bash out-of-root headless → `{block: true}` pre-execution (target never written), incident choreography via readable scratch script → blocked, `edit` same target → block with the same `resolves outside the project root` reason (edit-parity), in-root/read-only/temp/UI-approved → pass, UI-declined → block; module-level `sed -i`/`dd of=` → pass (A1).
- `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` → exit 0, `ok: true, checked: 71`; `unit-route --triage 566-…` → exit 0, block matches the pasted `## Triaged steps`.
- `bun scripts/local-gate.mjs --skip-network --jobs 1` → run 1 exit 1 at `worktree-guard` (environment — A4; steps 1–11 including `root-suite`, `crate-suite-bun`, `crate-suite-node` all exit 0 before the bail); re-run with `--no-bail` → exit 0, **`local-gate: PASS — 15 step(s) in 611s`** (every step green, incl. `worktree-guard` on that pass).
