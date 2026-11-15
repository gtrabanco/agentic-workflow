# 514 — external verify receipt

2026-11-12 — first (and full) external verification of this unit: no prior
`EXTERNAL VERIFY` block and no `R` line existed for it at bind time, so this is
the full verdict, once.

Bound state: unit dir `docs/features/514-git-identity-signing-guard/` · base ref
`origin/main` `d6aa087e472fd88802b814508a765c10b5ab5b54`, merge-base
`43e8c1f9e6f854a1e57a5ba2227f32e7042dacee` (diffs and base-side proofs use the
merge-base) · head `99a165751c59e2160e503e91ff3fe3313d4dfe0d` · branch
`feat/514-new-feature-git-identity-signing-guard`. Mid-run note: `origin/main`
advanced past the merge-base by 18 files (#521/#523 JSONC, roadmap/journal
aggregations), including shared surfaces this branch also touches
(`docs/workflow/CONFIG.md`, `docs/ROADMAP.md`, `docs/generated/units.md`,
`docs/LOGS.md`) — a later integration concern only; none of the advance touches
any file a blocker below names, so every base-side comparison holds for either
base.

Read-only statement: every command below was audited for write paths before
execution (the two new scripts resolve to `git rev-list/log/config --get` and
filesystem reads; the hook prints only; `docs-generate` ran `--check` only);
the base-side proof ran from a `git archive` copy in `mktemp -d` scratch
(removed after the run); no commit, push, branch, forge mutation or live-tree
write was made by this verification.

```text
EXTERNAL VERIFY — base: d6aa087e472fd88802b814508a765c10b5ab5b54 · head: 99a165751c59e2160e503e91ff3fe3313d4dfe0d
Blockers: 3 — 1) scripts/git-config-writes.mjs:132 (trigger: scripts/audit-pr-receipt.test.mjs:118) — the repo-wide `-c` gate false-PASSes on its own tree · reproducer: `node scripts/git-config-writes.mjs` → `278 carriers scanned, 0 findings / verdict: PASS`, while `scanSource(readFileSync("scripts/audit-pr-receipt.test.mjs"))` → `[]` although that scanned carrier holds direct writes at :283-284 (`git("config", "user.email", …)` flags on its own when fed that single line) — root cause: the tokenizer has no regex-literal handling, so `/--body "/` at :118 opens a phantom quote that never recovers (same shape at scripts/review-receipt.test.mjs:166 and packages/agentic-workflow/test/doc.envelope.test.mjs:138; whole-file `tokenize` then yields 0 `config` words), also reported by `node -e` scanSource over the three files → 0 findings each · base-vs-head: `scripts/git-config-writes.mjs` does not exist at base 43e8c1f9 (change-caused; the false PASS cannot reproduce at base because the gate is new) and the missed writes are O12's exact target class — direct argv-array writes in a scanned carrier, in scope per the gate's own boundary (only variable indirection is declared out of scope) · smallest action: make the tokenizer recover from a quote opened inside a regex literal (or bound quote state per line), then re-run the gate → route to /aw-local-apply; 2) SPEC.md:90 (Retirements) with packages/agentic-workflow/test/doc.envelope.test.mjs:215-216,282-283, scripts/review-receipt.test.mjs:441-442,483-484,519-520, scripts/audit-pr-receipt.test.mjs:283-284 — the declared retirement check fails, so S7/S9 are not delivered · reproducer: `rg -n '"config", "user\.|"config", "commit\.gpgsign"' scripts packages --glob '*.test.mjs'` → 12 matches in 3 files where SPEC.md:90 declares → 0 after the migration; doc.envelope is inside S9's own named glob (`packages/agentic-workflow/test/doc.*.test.mjs`) and was never migrated · base-vs-head: same command at base 43e8c1f9 (scratch archive) → 136 matches / 36 files, so the writes themselves are base-present, but the change-caused claims that fail at head — SPEC.md:90's "→ 0", SPEC.md:304's "35-carrier migration (129 writes removed)", S7's "no test suite writes git configuration anywhere", and obligations O12 ("No test carrier in the tree writes git configuration", marked verified) and O14 ("every previously-config-writing suite passes identity with `-c`", marked verified) — do not exist at base and cannot reproduce there · smallest action: migrate the 12 remaining writes to per-invocation `-c`, re-run the retirement rg and the gate, and reconcile the 35/129 narration → route to /aw-local-apply; 3) planning-obligations.md:19 (O11 validator cell) with SPEC.md:297-300 (D6) — the O11 validator names a nonexistent path while the status and D6 claim the cell was repaired · reproducer: `rg -n 'GIT_IDENTITY_HARDENING' docs/workflow/README.md template/docs/workflow/README.md` → 1 match plus `rg: template/docs/workflow/README.md: No such file or directory (os error 2)`, exit 2, where the cell requires "matches 2"; `template/docs/workflow/` carries no README.md, yet O11's status says "the validator cell now names the real second surface, D6" and D6 says "The validator now names the second surface that really exists — the template hooks README's link" — the bytes contradict both · base-vs-head: planning-obligations.md is added by this branch (absent at base 43e8c1f9), and O11 is marked verified on a validator that cannot run green here · smallest action: point the O11 validator cell at `template/.agentic-workflow/hooks/README.md` (the surface D6 names; that rg then matches 2) → route to /aw-local-apply
Advisories: 2 — 1) scripts/red-first.test.mjs:198 — standalone `bun test scripts/red-first.test.mjs` fails: the O4 shipped-history test times out at bun's 5s default (the gate walk measured 10.3s here); advisory because scripts/test-timeout-allowlist.json:9-12 carries a byte-identical entry at base 43e8c1f9 ("pre-existing, measured at f349d7b5"), the allowlist is untouched by the branch, and under the gate runner's allowlisted 30s budget the suite is green (`node scripts/run-root-suite.mjs` → PASS scripts/red-first.test.mjs (10.6s)) — 2) docs/workflow/SKILL_CONTEXT_BUDGETS.json — 183 lines re-serialized into `\uXXXX` escapes nobody asked for; advisory because a parse-diff of base vs head shows only the two declared #514 ceiling re-pins (GATE_INVENTORY.md linesMax 161→180, estimateMax 6182→6506, machineLines 65→68; init-workspace mainEstimateMax 4794→5282, each with an "issue #514" source note, on exactly the two surfaces this unit spent) and everything else is semantically identical, with `check-skill-context` (+ `--routes`, `--documents`) all PASS
Sibling sweep: list — SPEC.md:90 is the one surviving mention asserting a truth that does not hold (the retirement claim counted in blocker 2); every other sibling surface is clean: template/.agentic-workflow/hooks/README.md gains the identity section and no surviving "only guard-command.sh guards" claim exists repo-wide (`rg "only .{0,40}guard-command"` matches only SPEC.md's own Impact prose), docs/workflow/CONFIG.md carries the gitIdentity row and section-list entry, docs/workflow/GATE_INVENTORY.md rows 89-91 name the three new carriers, docs/workflow/README.md indexes the annex (1 match), docs/ROADMAP.md + docs/generated/** carry the unit row (docs-generate --check PASS), the shell hook tests contain no config writes, and no second gitIdentity profile copy exists (hook, checker and gate all read the one profile)
Completeness: S1-S9 resolved — every S# has its (Implements:) task and every task validator re-ran green here (config-contract 15/0, git-config-writes 8/0 + scan exit 0, push-identity-check 8/0, hook shell suite 18/0, parity 12/0, git-identity-guard 22/0, git-env 6/0, P9 greps, run-root-suite exit 0 109/109, docs-generate --check PASS) — but obligations O11, O12 and O14 fail their stated outcomes (blockers 3, 2, 2); open ids: O11, O12, O14
Spot check: node scripts/git-config-writes.mjs → match (reported E3: `278 carriers scanned, 0 findings / verdict: PASS`, exit 0; observed byte-identical, exit 0 — note the spot check confirms report fidelity only; the gate's 0 findings is itself blocker 1)
Verdict: NEEDS-DECISION (scripts/git-config-writes.mjs:132, SPEC.md:90, planning-obligations.md:19)
```

## Correction batch — 2026-11-12 (implementer side, not a verdict)

One batch against the three blockers above, per the correction bounds (one
batch → one recheck limited to those blockers → a second only if the same
blocker persists → `Needs your decision`). The owner's external verification
of the batch head is still what closes the unit; this section records what was
applied and observed, it does not re-verdict.

| item | route taken | observed |
|---|---|---|
| Blocker 1 — the gate tokenizer swallowed carriers after a quote in a regex literal (`scripts/git-config-writes.mjs:132`) | frozen-failure corpus added red to the gate's suite (`scripts/git-config-writes.test.mjs` — three poison shapes + the write that must be found on the next line), then two lexing rules: `"`/`'` line-bounded at the newline (ECMAScript StringLiteral grammar, node-verified — PE-013), regex literals skipped from a fresh `/` after an expression-opening token | red first: 8 pass / 1 fail, `write hidden after: assert.doesNotMatch(forge, /--body "/);` (E16) → after fix: regression green, and the gate itself reported exactly the 12 known writes (E17) |
| Blocker 2 — 12 `git config` writes remained in 3 suites; the Retirements check and S7/S9 failed (`SPEC.md:90`, O12, O14) | migrated `doc.envelope`, `review-receipt` and `audit-pr-receipt` to this unit's `-c`-triple shape (same fixture identity values, no assertion or path changed); O12's validator cell now carries the literal retirement search | gate `278 carriers / 0 findings` PASS, gate suite 9/0, receipt suites 58/0, doc.envelope 41/0, retirement `rg` → 0 (was 12); pre/post differential over base bytes: identical 99-test multisets, exit 0 both legs (E18) |
| Blocker 3 — O11's validator cell named nonexistent `template/docs/workflow/README.md` while the status and D6 claimed it repaired (`planning-obligations.md:19`, `SPEC.md:297-300`) | the cell now names `template/.agentic-workflow/hooks/README.md` — the surface D6 always described; status flipped back before the batch and re-verified after | `rg -n 'GIT_IDENTITY_HARDENING' docs/workflow/README.md template/.agentic-workflow/hooks/README.md` → matches 2, exit 0; D6's sentence now true of the bytes |
| Advisories 1–2 (pre-existing red-first timeout; budget re-serialization) | not in the batch — pre-existing/report-only never earns a correction round | recorded here as declined, unchanged |

## Recheck — 2026-11-14 (implementer side, not a verdict)

The receipt above is unchanged: its three blockers are what the 2026-11-12 batch
answered. This section re-runs those blockers' validators at head `0563b19d` (the
unit merged as `e6a696e9`, PR #520) and records what changed underneath the
receipt since. It is not a verdict and grants nothing; the owner's external
verification is still what closes the unit.

| blocker | what the 2026-11-12 batch did | observed 2026-11-14 | state |
|---|---|---|---|
| 1 — the `-c` gate false-PASSed on its own tree (`scripts/git-config-writes.mjs:132`) | line-bounded quote state + regex-literal skipping, red corpus first | `bun test scripts/git-config-writes.test.mjs` 9/0 exit 0 · `node scripts/git-config-writes.mjs` → `294 carriers scanned, 0 findings / verdict: PASS` exit 0 | **fixed**, reproduces green |
| 2 — 12 writes remained in 3 suites (`SPEC.md:90`, O12, O14) | migrated to the `-c` triple, O12's cell carries the literal search | the retirement search `rg -n '"config", "user\.\|"config", "commit\.gpgsign"' scripts packages --glob '*.test.mjs'` → 0 matches (exit 1) · the three suites 58/0 and 41/0 · whole tree `node scripts/run-root-suite.mjs` → 113 suites PASS / 0 FAIL, exit 0 — **retracted 2026-11-15: the root-suite clause did not reproduce at that head** (the recheck's own PR-URL lines made `roadmap-settle.test` red, so that run could not have been green; the retirement search and the six suites did reproduce green) — superseded by G9 (113/0, exit 0, after the P12 settle) | **fixed** (retirement + suites); root-suite clause retracted 2026-11-15, superseded by G9 |
| 3 — O11's validator named a nonexistent path (`planning-obligations.md:19`) | cell pointed at `template/.agentic-workflow/hooks/README.md`, which then matched 2 across both files | the path is real and matches, but the cell's **files-wide total** no longer holds: `2eb5b70f` (unit #546, 2026-11-14, after this unit) added a second annex link in the template hooks README, so the total reads 3 with both surfaces ≥1 | **substance fixed, validation outcome invalidated by a later unit** — O11 flipped back, the cell rewritten to per-surface presence, re-verified: `rg -c 'GIT_IDENTITY_HARDENING' docs/workflow/README.md` → 1 and `... template/.agentic-workflow/hooks/README.md` → 2, both ≥1, `node scripts/skill-lint.mjs` exit 0 |

Two things this recheck deliberately does not do: it does not re-verdict the unit
(the roadmap row stays `in-progress` until the owner's verdict), and it does not
touch any number in the receipt above — the receipt records what was observed on
2026-11-12, and a later observation belongs in a later section.

Boundaries honoured: every command above is read-only (`git rev-list`/`log`/
`config --get`, filesystem reads) or a suite inside its own throwaway fixtures;
no repository write, commit, push or forge mutation was made by the recheck
itself, and nothing introduced by this unit was executed against the live tree
outside the repo's own deterministic gates.

## Delta external verify — 2026-11-15

Delta verdict: corrections landed since the 2026-11-12 receipt (the correction
batch, the 2026-11-14 recheck, head `583f5536`), so this run re-verifies that
receipt's three blockers, the delta diff `6f3bb8a0...583f5536` (docs-only, 4
files) and the spot check. Binding: unit dir
`docs/features/514-git-identity-signing-guard/` · base `origin/main`
`6f3bb8a0b8bbffb5827374ba8a1eb1f3f140629c` (= merge-base) · bound head at run
start `583f55362cbc91e48ea5b771fb81f1a37ed4e972`. Mid-run a concurrent session
committed `ef05116c37830cc0b0a4f8d39b4a355b6b26bcfb` (one journal fragment —
inspected: its claims are accurate, it touches no tested surface); at that head
`journal aggregate --check` → `ok:true, checked:28, refusals:[]`,
`log-immutability` PASS, `temp-hygiene` PASS, and PR
[#556](https://github.com/gtrabanco/agentic-workflow/pull/556) exists (OPEN,
branch → main). Read-only: every command was read-only or ran in `mktemp -d`
scratch (`git archive` base copies, a poison-shape fixture, the suites' own
throwaway fixtures); no commit, push, branch, forge mutation or live-tree write
was made by this verification; `git status` clean at close.

```text
EXTERNAL VERIFY — base: 6f3bb8a0b8bbffb5827374ba8a1eb1f3f140629c · head: ef05116c37830cc0b0a4f8d39b4a355b6b26bcfb
Blockers: 3 — 1) scripts/roadmap-settle.test.mjs:77 via SPEC.md:437,478,493 — the delta's three PR-URL lines turn the declared roadmap-row-settlement gate red and take the root suite with it · reproducer: `node scripts/roadmap-settle.mjs` → 3 × `pr-url-unsettled` (:437 Log, :478 Next, :493 Next), exit 1; `bun test scripts/roadmap-settle.test.mjs` → 7 pass / 1 fail (`the live tree is green…`); `node scripts/run-root-suite.mjs` → exit 1 (run A: 112 PASS / 1 FAIL; run B: 111 PASS / 2 FAIL) · base-vs-head: the gate script and its suite are delta-untouched (docs-only change); the same gate against a `git archive origin/main` copy in mktemp scratch → `verdict: PASS, violations: 0, exit 0`, and the same suite in that scratch → 8 pass / 0 fail (base SPEC carries no `pull/520` at all) — change-caused, green at base; independent proof the companion blocker-1 fix holds: a poison fixture (regex-literal quote then a direct write) is flagged `FINDING …:2` FAIL · smallest action: remove the emitter's duplicate NN-514 `idea` row at docs/ROADMAP.md:156 (owner — shared index, `31439d10` regen, base-present) and settle the survivor through `roadmap rowUpsert` to `done · [#520](https://github.com/gtrabanco/agentic-workflow/pull/520)`, then re-run the gate and the root suite → route to /aw-local-apply (the shared-index row deletion needs the owner); 2) planning-obligations.md:22 (O14) and planning-obligations.md:25 (O17) — both rows read `verified` on a validator (`node scripts/run-root-suite.mjs` exits 0) that no longer reproduces at head (deterministic exit 1 per blocker 1), so SPEC.md:436 (D9)'s "no unverified obligation" fails with them · reproducer: the same root-suite run, exit 1 · base-vs-head: at base the deterministic component is green (roadmap-settle suite 8/0 in scratch); the rows' red is delta-caused · smallest action: repair per blocker 1, re-run the validator, keep both rows `verified` only on exit 0 → route to /aw-local-apply; 3) SPEC.md:471 (G8) with .agentic-workflow/journal/20261114T233130Z-feat-514-new-feature-git-identity-signing-guard-per-project-appr-narrative-local.md:4 and external-verify.md:62 — three sibling surfaces report `run-root-suite` `exit 0 · 113 suites PASS / 0 FAIL` "at this head" while the head is deterministically red (the roadmap-settle live-tree case cannot pass while the gate is red), and SPEC.md:489 discloses "the two PR-URL lines this recheck added" while the gate reports three (:437, :478, :493) · reproducer: run A / run B above · base-vs-head: all three claims are added by the delta, absent at base, and reproduce nowhere at head · smallest action: after blocker 1's repair, re-run the root suite and correct the three claims and the two-vs-three count (or mark them measured before the PR-URL lines were added) → route to /aw-local-apply
Advisories: 4 — 1) scripts/unit-route.test.mjs — inside the root pool FAILed once (51.0s, run B) while run A's pool run PASSed (23.3s) and standalone PASSed 64 pass / 0 fail here; the delta is docs-only and touches neither the suite nor its inputs → load-dependent flake on untouched code, not change-caused; 2) scripts/red-first.test.mjs (carried from the 2026-11-12 receipt) — standalone `bun test` still 8 pass / 1 fail at bun's 5s default; pre-existing, allowlisted at scripts/test-timeout-allowlist.json:9-11 (delta-untouched) and green inside both root-suite runs; 3) docs/workflow/SKILL_CONTEXT_BUDGETS.json (carried) — `\uXXXX` re-serialization, parse-identical apart from the two declared #514 ceiling re-pins; `check-skill-context` PASS (30 skills) here; 4) docs/ROADMAP.md:156 — the duplicate NN-514 `idea` row (emitter `31439d10`, base-present in origin/main; the only duplicated NN in the Features index) — pre-existing in its own right, and the reason blocker 1's settle cannot run unattended
Sibling sweep: list — the root-suite-green claim survives on three sibling surfaces asserting a truth that does not hold (SPEC.md:471, journal 20261114T233130Z line 4, external-verify.md:62 — blocker 3) and SPEC.md:489's "two PR-URL lines" undercounts three; otherwise clean — the rewritten O11 cell's old truth (`matches 2`, the nonexistent `template/docs/workflow/README.md`) survives only in dated receipt / D6 / E19 records and no current-state surface, SPEC.md:90 Retirements "→ 0" is now true, and the 278/109 figures survive only as dated E/G lines corrected in place by E20/G8
Completeness: S1–S9 each resolve to a task carrying `(Implements: S#)` (P1–P10); P1–P9 validators all re-ran green here (config-contract 17/0, git-config-writes suite 9/0 + gate `294 carriers / 0 findings` PASS, push-identity 20/0 + `local-gate --list` names it, hook shell 31 cases / 0 failures, parity 15/0, git-identity-guard 22/0, git-env 6/0, annex greps ≥1, docs-generate --check PASS, skill-lint `101 file(s) · 7 check(s) · 0 finding(s)` PASS, retirement rg 0 matches) — open ids: O14, O17 (verified rows whose validator now exits 1) and task P10 (its root-suite validator red), pending blocker 1; the original receipt's blocker-1/2/3 all reproduce green here
Spot check: node scripts/run-root-suite.mjs → mismatch — reported (SPEC.md:471) `exit 0 · 113 suites PASS / 0 FAIL`; observed exit 1 · 112 PASS / 1 FAIL (run A) and 111 PASS / 2 FAIL (run B). Per the rule the reported verification is untrusted as a whole; noted for the record: the individually re-run E20 lines (gate, retirement rg, skill-lint, O11 rgs, and the twelve named suites) did match their reported numbers — the mismatch is the root-suite claim and its two copies
Verdict: NEEDS-DECISION (SPEC.md:437,478,493 → roadmap-settle gate red + root-suite exit 1 · planning-obligations.md:22,25 O14/O17 · SPEC.md:471 G8 false report)
```

## Correction batch — 2026-11-15 (implementer side, not a verdict)

One batch against the three blockers of the 2026-11-15 delta receipt above
(the owner's L5 request), per the correction bounds: one batch → one recheck
limited to those blockers → a second only if the same blocker persists. This
section records what was applied and observed; it does not re-verdict — the
owner's external verification of the batch head is what answers the receipt.

| item | route taken | observed |
|---|---|---|
| Blocker 1 — the settle gate red and the root suite with it (`scripts/roadmap-settle.test.mjs:77` via SPEC's three PR-URL lines) | the duplicate-NN corpus added red to the writer's own suite, then one shared scope + one rule for the whole NN-lookup family (`nnRowIndexes`: the `\| NN \|` table, last match wins = what `parseIndexRows` keeps; the upsert splices the earlier duplicates out); the live settle through `roadmap rowUpsert --expect` — never a hand edit of the shared index — and the projection regenerated by its emitter | red: 28 pass / 3 fail at bff0e11b (E21) → green 31/0 twice at cd372114 (E22); live: one `\| 514 \|` row `done · [#520](…)`, gate PASS 0 violations, `units.md` re-check 0 stale (E23); root suite 113 PASS / 0 FAIL exit 0 (G9) |
| Blocker 2 — O14/O17 `verified` on a validator that did not reproduce | flipped back at the ledger freeze (before any code), re-verified only on the green run | O14 and O17 → `verified` on G9 + E24; the `## Next` claim that no obligation was open now holds |
| Blocker 3 — the falsified green-root-suite claim on three surfaces, plus the count the disclosure undercounted (three lines: SPEC.md:437, :478, :493 — the second at :478 and the third at :493) | prose corrected wherever prose may be edited (the undercounting sentence is gone from `## Next`; this recheck cell carries the retraction); the two append-only carriers are marked, never rewritten: SPEC `## Log` G8 retracted by D10 and superseded by G9, and the committed 2026-11-14 journal fragment superseded by this batch's own fragment — `log-immutability` refuses any other shape | E25: the superseded count phrase → 0 matches in SPEC (exit 1), `retracted` present in this file; G9 replaces the number everywhere the batch speaks |
| Loop discovery (S2 differential, inside the batch) | `version-parity-content` refused the crate change without a release intent → `.changeset/514-duplicate-safe-roadmap-upsert.md` folded into the code commit | `lint-changeset` ok · parity PASS · `local-gate.test` 49/0 (E24) |
| Disclosed inside the batch | the annotate corpus case's stale-row-absence assertion (authored red this session) was over-strict — annotate retargets, the upsert collapses — and was corrected to pin the targeting rule both sides agree on; the red evidence for targeting stands | commit message of cd372114 and E21 record both halves |
| Advisories 1–3 (unit-route pool flake, red-first standalone timeout, budget re-serialization) | not in the batch — flake and pre-existing never earn a correction round; advisory 4 (the duplicate's origin, a second registration added after the unit's own row) is not declined: it is blocker 1's root cause and is repaired above | recorded here as declined and repaired respectively, otherwise unchanged |
