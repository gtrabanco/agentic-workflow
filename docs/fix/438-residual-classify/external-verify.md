# fix/438-residual-classify — external verification receipt

**2026-11-13 · first receipt for this unit** (no prior `EXTERNAL VERIFY` block or
review verdict exists in this unit dir → full verdict, once).

- **head** `a44c6c4a311e2cf873a7f2c0b0f550cafdde2306` (`feat/438-new-feature-residual-classify`)
- **base** `43e8c1f9e6f854a1e57a5ba2227f32e7042dacee` — the merge-base and the unit
  doc's own cut base; `origin/main` = `8079f11a6803b9f54f17748a54100a2249eded30`
  (96 commits ahead of the merge-base) is proven on the base side too where noted.
- working tree clean (`git status --porcelain` empty) before and after every run;
  no commit, no push, no branch, no forge call, no tracked-file edit.
- the classifier has no mutation path (source read: `spawnSync` only for
  `rg`/`grep` and `git diff` — `scripts/residual-classify.mjs:61,149,550`;
  `fs` read-only), so running it was in scope; fixtures all lived in `mktemp -d`.

## Commands run — `command: observed result`

| command | observed result |
|---|---|
| `bun install --frozen-lockfile` + `packages/agentic-workflow-schema`: `bun run build` | 163 packages installed; `tsc` exit 0 (env provisioning for the doc's Known pre-existing #1; gitignored only, tree stayed clean) |
| `bun test scripts/residual-classify.test.mjs` | `20 pass / 0 fail`, exit 0 (run once as the declaration run, once as the spot check) |
| `bun test scripts/unit-doc-contract.test.mjs` | `21 pass / 0 fail`, exit 0 |
| `bun test scripts/scaffold-parity.test.mjs` | `17 pass / 0 fail`, exit 0 |
| `bun test scripts/normative-drift.test.mjs` | `21 pass / 0 fail`, exit 0 |
| `bun test scripts/structural-sibling-pins.test.mjs` | `8 pass / 0 fail`, exit 0 |
| `bun test scripts/residue-dimensions.test.mjs` | `29 pass / 0 fail`, exit 0 |
| `bun test scripts/prose-gate-inventory.test.mjs` | `21 pass / 0 fail`, exit 0 |
| `bun test scripts/guide-split.test.mjs` | `15 pass / 0 fail`, exit 0 |
| `bun scripts/check-skill-context.mjs` | `PASS context budgets: 29 skills`, exit 0 |
| `bun scripts/check-skill-context.mjs --documents` | `PASS context documents: 4 budgeted documents` (GATE_INVENTORY 161/66/95/5822), exit 0 |
| `bun scripts/docs-generate.mjs --check` | `verdict: PASS` — 3 checked · 0 stale · roadmap unchanged, exit 0 |
| `bun scripts/roadmap-settle.mjs` | `verdict: PASS · violations: 0` (189 unit docs), exit 0 |
| `bun scripts/lint-changeset.mjs` | `ok 438-residual-classify.md`, exit 0 |
| `bun scripts/red-first.mjs` | `PASS — 57 pair(s) · 26 after the cutoff · 0 finding(s)`, exit 0 |
| `bun scripts/log-immutability.mjs` | `PASS · 0 violations`, exit 0 |
| `bun scripts/local-gate.mjs --jobs 2 --no-bail` | `local-gate: PASS — 17 step(s) in 262s`, exit 0 (includes the root suite) |
| red observation, scratch `git archive 2ce333f5` + `bun test scripts/residual-classify.test.mjs` | `1 pass / 19 fail`; `git cat-file -e 2ce333f5:scripts/residual-classify.mjs` → absent, test present → matches E1 |
| `node scripts/residual-classify.mjs --inventory --base 43e8c1f9` | exit 0, `residual-classify-inventory@1`, 15 rows (14 `used`, `CONSULT_ORDER` → `orphan`) |
| `rg -n 'Date\.now\|new Date\|process\.env\.\|fetch(\|gh '` `scripts/residual-classify.mjs` | no match — D9 (no clock, no forge) holds |
| `git merge-tree --write-tree origin/main HEAD` | conflicts in `docs/ROADMAP.md` and `docs/workflow/SKILL_CONTEXT_BUDGETS.json`; `docs/generated/**` resolved by the armed driver with a "run `bun scripts/docs-generate.mjs`" note — see A5 |

## Base-vs-head differential (S10 / O21)

Scratch copies in `mktemp -d` (`git archive 43e8c1f9` vs `git archive HEAD`,
same fixtures, same commands, identical dependency symlinks) — every
pre-existing command identical on both sides:

| command | base | head |
|---|---|---|
| `unit-doc-contract` / `scaffold-parity` / `normative-drift` | 21/0 · 17/0 · 21/0 | 21/0 · 17/0 · 21/0 |
| `residue-dimensions` / `prose-gate-inventory` / `guide-split` | 29/0 · 21/0 · 15/0 | 29/0 · 21/0 · 15/0 |
| `check-skill-context` / `--documents` | PASS · PASS | PASS · PASS |
| `docs-generate --check` / `roadmap-settle` | PASS · PASS (0 violations) | PASS · PASS (0 violations) |
| `scripts/residual-classify.test.mjs` | exit 1 (module absent) | `20 pass / 0 fail` |

The new suite is the only delta — and `git cat-file -e origin/main:scripts/residual-classify.mjs`
also fails, so both candidate bases lack the module.

## Blockers (4)

**B1 — `scripts/residual-classify.mjs:298` — a feature unit can never be closed.**
`const rows = unit.kind === "feature" ? index.features : index.fixes;` while
`unitFolders()` records kinds from `UNIT_KINDS = ["features","fix"]`, so every
feature unit falls to `index.fixes`, finds no row and returns *open* — D4's
"its row's status is non-terminal" test never runs for feature units.
*Reproducer* (fixture matrix in `mktemp -d`, correct rows, only the unit kind varies):

| case | D4/D3 expect | observed |
|---|---|---|
| closed **fix** unit, unticked task naming an unconsumed surface | `orphan` | `orphan` ✓ |
| closed **feature** unit, same | `orphan` | **`half-built` (exit 0)** |
| open fix unit, same | `half-built` | `half-built` ✓ |
| promise `unit:` → closed **fix** unit | `ambiguous`, exit 1 | `ambiguous`, exit 1 ✓ |
| promise `unit:` → closed **feature** unit | `ambiguous`, exit 1 | **`andamio`, exit 0** |

*Realistic input on this repository* (`node scripts/residual-classify.mjs <target>`):

- `packages/agentic-workflow/test/verify.test.mjs` → **`half-built`**, evidence
  `docs/features/227-deterministic-artifact-emitters/SPEC.md:P2,P3` — but row 227
  reads `done · [#472]` (terminal, `docs/ROADMAP.md:28`); live-tree `none`,
  roadmap-rows `none`, promises `none`, charter `absent` → D4 says `orphan`.
- `ProviderPreset.profiles` → **`half-built`**, evidence
  `docs/features/388-extract-nan-vendor-coupling/SPEC.md:P8` — row 388 reads
  `done · branch feat/388-…` (`docs/ROADMAP.md:156`) → D4 says `orphan`.

*Base-vs-head*: `scripts/residual-classify.mjs` does not exist at `43e8c1f9` nor
at `origin/main` (`git cat-file -e` → fatal), so no such verdict is possible at
base. *Stability*: the same fixture with a **fix** unit is quiet (table above).
*Smallest action*: read the unit's own kind table (`unit.kind === "features"`)
and add the two regression cases (closed feature unit → no claim; promise →
closed feature unit → `ambiguous`/1) to `scripts/residual-classify.test.mjs`.

**B2 — `docs/fix/438-residual-classify/planning-obligations.md:33,34` — obligations
`O22` and `O23` are `in-progress`.** Obligations closure accepts only `verified`
with a validator that re-runs green here, or an evidenced `n/a`.
*Reproducer*: read the status cells (`| O22 | … | in-progress — …`, `| O23 | … |
in-progress — …`); `rg -n 'residual-classify' docs/LOGS.md` → exit 1 (O22's
`docs/LOGS.md` clause still does not reproduce; the journal fragment carries it).
*Base-vs-head*: both rows ship in this change, and O23's stated outcome now
reproduces green — `bun scripts/local-gate.mjs` → `PASS 17/17 in 262s` — so the
row is stale as well as open. *Smallest action*: run both validators, resolve
O22's `docs/LOGS.md` clause to the journal-fragment carrier its status text
already names, flip both rows to `verified` with the observed outcome (or an
evidenced `n/a`), and update the SPEC's `## Next` "two obligations stay open"
note in the same batch.

**B3 — sibling sweep — `skills/unit-lane/references/PLAN.md:174-175` (+ its pin
`scripts/residue-dimensions.test.mjs:178`) still orders the superseded
prose-only answer.** The change rewrote the strictly-additive `## Retirements`
answer in all four templates (`docs/fix/_TEMPLATE/SPEC.md:74` etc.: "A
**strictly additive** unit answers with its computed surface inventory
instead"), while the plan step still says: "No declared retirements → write
exactly ``none — the design states why nothing can be removed``" — the same case,
two lane steps, two orders.
*Reproducer*: `rg -n 'strictly additive' docs/features/_TEMPLATE/SPEC.md docs/fix/_TEMPLATE/SPEC.md template/docs/*/_TEMPLATE/SPEC.md skills/unit-lane/references/PLAN.md`
→ 4 hits in the templates, **0** in PLAN.md; `rg -n 'No declared retirements' skills/unit-lane/references/PLAN.md` → line 174.
*Base-vs-head*: at `43e8c1f9` templates and PLAN.md agreed (both prose-only);
the divergence is introduced by this change. *Smallest action*: one sentence in
PLAN.md's `retirements` block naming the strictly-additive inventory answer
(keeping the retained empty-answer reason, so the pin at
`residue-dimensions.test.mjs:178` stays green — no test edit needed).

**B4 — `docs/fix/438-residual-classify/SPEC.md:88-91` (D3) — "taught by the
template's Retirements section" is not in the bytes.** None of the four
templates mentions `residual-promise@1`, the block, or `decisions.md`:
`rg -n 'residual-promise|decisions\.md' docs/features/_TEMPLATE/SPEC.md docs/fix/_TEMPLATE/SPEC.md template/docs/features/_TEMPLATE/SPEC.md template/docs/fix/_TEMPLATE/SPEC.md`
→ no match (they name "the recorded planned-consumer promise" without saying
where or how to record it); `rg -c 'decisions' docs/*_TEMPLATE/SPEC.md` → none.
The grammar is taught only in `skills/unit-lane/references/DESIGN.md:146-155`.
*Base-vs-head*: D3 is a claim of this change; at `43e8c1f9` neither the claim nor
the grammar exists, so no mismatch could reproduce there. *Smallest action*: one
sentence in the four templates' `## Retirements` sections pointing at the
`residual-promise@1` block in the unit folder's `decisions.md` (pin it in `T1`),
or amend D3's clause to name the DESIGN.md Retirements section — owner's call.

## Advisories (5)

- **A1 — `docs/fix/438-residual-classify/SPEC.md:314`** — AC-S10's Check names "the
  `F1` differential test"; no `F1` test exists in `scripts/residual-classify.test.mjs`
  (`rg -n 'test\("F1'` → no match), so the Check cannot be executed as written.
  *Why advisory*: the differential itself re-runs green here and matches E8
  exactly (table above), so the need the AC names is met — only the pointer dangles.
- **A2 — `docs/fix/438-residual-classify/planning-obligations.md:30` (O19
  validator cell)** — claims X2 covers `used`/`andamio`/`half-built`/`ambiguous`
  refusals, but `scripts/residual-classify.test.mjs:376` loops only `usedSurface`
  and `andamioSurface`. *Why advisory*: I verified the missing half directly —
  `--receipt` on a `half-built` target and on an `ambiguous` target both exit 1
  with empty stdout and `retire refused` on stderr — so the obligation's stated
  outcome reproduces; only the coverage description is off.
- **A3 — `docs/fix/438-residual-classify/SPEC.md:262,429`** — the disclosed
  pre-existing `worktree-guard` finding no longer reproduces: `git worktree list`
  shows 3 entries (the merged `feat/437-…` tree is gone) and the gate is 17/17.
  *Why advisory*: stale environment disclosure, not a change defect; it is the
  context of blocker B2/O23.
- **A4 — `docs/fix/438-residual-classify/SPEC.md:227`** — Future cost says "the
  evidence sites are printed, so a reader judges them", but `--inventory` rows
  carry only `surface/kind/state/reason`: this change's own run reports
  `classify → used` (a token collision with other scripts) and
  `CONSULT_ORDER → orphan` (`scripts/residual-classify.mjs:82`, exported and
  consumed nowhere) with no site to judge. *Why advisory*: a stated-intent
  mismatch in a Future-cost note; no verdict, exit code or receipt is wrong.
- **A5 — integration state** — `origin/main` is 96 commits ahead of the
  merge-base; `git merge-tree --write-tree origin/main HEAD` conflicts in
  `docs/ROADMAP.md` and `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, and the
  armed `docs-generated` driver resolves `docs/generated/**` to the incoming
  projection with "run `bun scripts/docs-generate.mjs`". *Why advisory*:
  other units' movement on main, not a defect this change caused; resolved (with
  a budget re-pin and a projection re-render) at integration.

## Sibling sweep

**list** — one survivor: `skills/unit-lane/references/PLAN.md:174-175` with its
declared pin `scripts/residue-dimensions.test.mjs:178` (blocker B3).

Everything else clean: the four unit-doc templates, `skills/unit-lane/references/DESIGN.md`
(bullet + `residual-promise@1` block), `AGENTS.md` `normative-surfaces@1` row,
`docs/workflow/GATE_INVENTORY.md` (both rows), `docs/workflow/SKILL_CONTEXT_BUDGETS.json`,
`docs/ROADMAP.md` (feature row 151 + Fixes row 188), `docs/research/ATTRIBUTION.md`,
`.changeset/438-residual-classify.md`, the journal fragment, and the generated
projection are all updated and agree with the new rule; `unit-doc-contract`,
`scaffold-parity`, `normative-drift` and `residue-dimensions` stay green;
`rg -n 'residual-classify|residual-promise'` over the tracked tree returns only
those surfaces (plus this unit's own docs); no surviving surface denies the new
truth, and the other units' prose-only `## Retirements` sections are frozen
history of their own cuts, not live instruction.

## Completeness

- **S1–S10 resolved**: every `S#` carries `(Implements: S#)` on at least one
  task, and every task validator re-ran green here — P1 (`ls` → three files),
  P2 (red observed at `2ce333f5`: 1 pass/19 fail, module absent; green at head),
  P3 (20/0), P4 (`unit-doc-contract` 21/0 + `normative-drift` 21/0), P5
  (`docs-generate --check` PASS + `lint-changeset` ok), P6
  (`local-gate` 17/17, exit 0). No `S#` open, no disposition needed.
- **Obligations**: `O1`–`O21` `verified` and re-green here (each named test
  present in the 20/0 run; `O16` = 21/0 + 17/0; `O17` = 21/0 + budgets PASS;
  `O21` = the differential above). **Open ids: `O22`, `O23`** (blocker B2).

## Spot check

`bun test scripts/residual-classify.test.mjs` → `20 pass / 0 fail`, exit 0 →
matches the reported E3 / every obligation's evidence cell (`20 pass, 0 fail`) →
**match**.

---

Disclosure (verification incident): my own fixture helper wrote two untracked
files into this worktree with relative paths (`docs/features/12-promising/decisions.md`,
`src/promise.mjs`); both were found and removed in the same session, `git status
--porcelain` was empty before and after, and no tracked byte, commit, branch or
forge surface was touched. The command introduced by this change was never used
to write anywhere — it has no mutation path.

EXTERNAL VERIFY — base: 43e8c1f9e6f854a1e57a5ba2227f32e7042dacee · head: a44c6c4a311e2cf873a7f2c0b0f550cafdde2306 (2026-11-13)
Blockers: 4 — each: file:line, reproducer, base-vs-head evidence
  - B1 `scripts/residual-classify.mjs:298` — `unit.kind === "feature"` (kind is `"features"`): closed feature units keep claiming; fixture matrix above (closed feature → `half-built`/`andamio` where D4/D3 say `orphan`/`ambiguous`, closed fix unit quiet) + two live-tree cases (`packages/agentic-workflow/test/verify.test.mjs`, `ProviderPreset.profiles`); base 43e8c1f9 and origin/main have no module (`git cat-file -e` → fatal).
  - B2 `docs/fix/438-residual-classify/planning-obligations.md:33,34` — rows `O22`, `O23` read `in-progress`; reproducer: read the status cells, `rg -n 'residual-classify' docs/LOGS.md` → exit 1; both rows ship with this change, and O23's validator now reproduces green (`local-gate` 17/17, exit 0).
  - B3 `skills/unit-lane/references/PLAN.md:174-175` (+ pin `scripts/residue-dimensions.test.mjs:178`) — still orders the superseded prose-only answer for a unit that declares no retirements; reproducer: `rg -n 'strictly additive' docs/*_TEMPLATE/SPEC.md template/docs/*_TEMPLATE/SPEC.md skills/unit-lane/references/PLAN.md` → 4 template hits, 0 in PLAN.md; base had templates and PLAN.md agreeing (both prose-only), head diverges.
  - B4 `docs/fix/438-residual-classify/SPEC.md:88-91` (D3) — "taught by the template's Retirements section" has no bytes: `rg -n 'residual-promise|decisions\.md'` over the four templates → no match; the claim is new in this change (absent at base).
Advisories: 5 — each: file:line, why advisory
  - A1 `docs/fix/438-residual-classify/SPEC.md:314` — AC-S10's Check names an `F1` differential test that does not exist; the differential itself re-runs green here and matches E8, so only the pointer dangles.
  - A2 `docs/fix/438-residual-classify/planning-obligations.md:30` — O19's validator cell overstates X2's coverage (`scripts/residual-classify.test.mjs:376` loops two targets), but both missing refusals were observed directly (exit 1, empty stdout).
  - A3 `docs/fix/438-residual-classify/SPEC.md:262,429` — the disclosed pre-existing `worktree-guard` failure no longer reproduces (worktree gone, gate 17/17); stale environment note, context of B2.
  - A4 `docs/fix/438-residual-classify/SPEC.md:227` — Future cost claims evidence sites are printed, `--inventory` rows carry none (`classify → used` collision, `CONSULT_ORDER → orphan` unconsumed); stated-intent mismatch, no verdict wrong.
  - A5 branch vs `origin/main` (96 commits ahead) — `git merge-tree` conflicts in `docs/ROADMAP.md` and `docs/workflow/SKILL_CONTEXT_BUDGETS.json`; other units' movement, resolved at integration, not change-caused.
Sibling sweep: list — `skills/unit-lane/references/PLAN.md:174-175` + `scripts/residue-dimensions.test.mjs:178` (B3); every other touched/renamed surface (4 templates, DESIGN.md, AGENTS.md row, GATE_INVENTORY, budgets, ROADMAP, ATTRIBUTION, changeset, journal fragment, generated projection) updated and consistent; no other survivor of the superseded truth.
Completeness: S1–S10 resolved (every `(Implements: S#)` validator re-ran green here, incl. `local-gate` 17/17); obligations O1–O21 verified and re-green — open ids: O22, O23.
Spot check: bun test scripts/residual-classify.test.mjs → match (20 pass / 0 fail, exit 0 = reported E3)
Verdict: NEEDS-DECISION (open blockers: B1 classifier feature-unit openness, O22, O23, PLAN.md sibling, D3 template clause)

---

## 2026-11-13 — correction batch applied, recheck of the reported blockers

Owner instruction, verbatim: `Apply to this repository: triage and fix those
that deserve to fix but understand the context before fix and check you haven't
broke another different thing, if you have done, start the loop again until you
fixed full symbol/related stuff.` + `Fix merge conflicts in the PR as well
keeping all the features that mustn't be deleted`. Protected-suite approval
recorded: `Approve both suites`. Push question answered by the owner with
`No entiendo esta pregunta, por que quieres hacer push con "no-verify"?` — so
**no bypass was taken** and the push waits on his call.

| reported id | recheck (foreground, 2026-11-13) | result |
|---|---|---|
| B1 | `bun test scripts/residual-classify.test.mjs` → 25 pass / 0 fail; H3 (closed feature unit → `orphan`), P4 (promise → closed feature unit → `ambiguous`/1) green; H4 control green; the two live-tree cases (`packages/agentic-workflow/test/verify.test.mjs`, `ProviderPreset.profiles`) now classify `orphan` | fixed `620c9cad` |
| B2 / O22 | every cell of O22's validator exits 0 (rg matches, `docs-generate --check`, `lint-changeset`, `roadmap-settle` 194/0); status flipped to `verified` with E17 as evidence | closed |
| B2 / O23 | `bun scripts/local-gate.mjs` → **16/17**, only `log-immutability` exit 1 on two **main-side** commits in the upstream-based range (`b012b31d`, `3cbc1237`); `--base origin/main` → PASS 0/12 | **still open — named to the owner, no bypass taken** |
| B3 | `bun test scripts/residue-dimensions.test.mjs` → 30 pass / 0 fail (the plan pin green, the prose pin untouched) | fixed `ff2deb0f` |
| B4 | `T3` green: all four templates name `residual-promise@1` and `decisions.md` | fixed `ff2deb0f` |
| A1 | `F1` exists and runs: `RESIDUAL_DIFF_BASE=<origin/main copy> bun test scripts/residual-classify.test.mjs` → 25 pass / 0 fail; empty-base negative control → 1 fail (gate live); the `## Log` carries the run (E16) | folded `4e9df6a2` + E16 |
| A2 | `X2` now loops all four states (`used`/`andamio`/`half-built`/`ambiguous`), all refuse exit 1 with empty stdout — O19's text is now literally true | folded `4e9df6a2` |
| A3 | SPEC `## Known pre-existing issues` rewritten to the observed truth; `worktree-guard` exit 0 in E17 | folded |
| A4 | `--inventory` rows carry the consumer evidence sites (I1 green); the changeset names them | fixed `620c9cad` |
| A5 (merge half) | `0fbf30f2` resolves both conflicts keeping every feature (main's four active rows **and** #438's row; both budgets sources **and** `machineLines` 69 = the merged measurement); `66fa8509` integrates main's `fbbf336e`; post-merge budgets/`docs-generate`/`roadmap-settle` green | folded; the push half stays with O23 |

Loop (S1): the integration surfaced main's #514 gate against this branch — 4
`git-config-writes` findings in this unit's own suite, green at base only
because the file does not exist there — repaired at `fb951e61` (per-invocation
`-c` identity + F1's timeout), then `node scripts/run-root-suite.mjs` → exit 0
(110 suites) and the full gate re-run. Nothing else regressed:
`unit-doc-contract` 21/0, `scaffold-parity` 17/0, `normative-drift` 21/0,
`structural-sibling-pins` 8/0, `prose-gate-inventory` 22/0, `guide-split`
15/0, `red-first` PASS, `check-skill-context` PASS both modes.

Open ids handed back: **O23** (the push range), nothing else — the batch's own
new observation (the D4 closed-unit behaviour had no obligation row in the
frozen ledger; its regression now lives in H3/P4) is reported to the owner,
not retro-fitted into a frozen ledger.

**Push evidence (2026-11-13, both attempts plain `git push`, no bypass):**
attempts at 00:03 and earlier both abort inside the pre-push gate at
`push-identity` (issue #514, `enforce: push`) with git exit 1 and the remote
untouched (`origin/feat/438-new-feature-residual-classify` still `a44c6c4a`).
The checker reports 26 offender lines over the range `a44c6c4a..HEAD` —
`GitHub <noreply@github.com>` as committer of main's merged PRs, `journal-bot`,
`github-actions[bot]`, and the short-name author `Gabriel Trabanco` — and
**zero** lines for this branch's own commits (`0fbf30f2`, `4e9df6a2`,
`620c9cad`, `ff2deb0f`, `66fa8509`, `fb951e61`, `6a5fe38a`: author and
committer both `Gabriel Trabanco Llano <1969593+gtrabanco@users.noreply.github.com>`).
`log-immutability` (E17) is the companion range gate the same push would meet.
Amendment follow-up, same day: the owner authorized the post-cut ledger rows
(`Sí, arreglalo`) → `O24`/`O25` verified on E18's run. The paragraph above
states this batch's handoff position **before** that answer; the amendment
supersedes it, dated the same day — the receipt appends, it never rewrites.
