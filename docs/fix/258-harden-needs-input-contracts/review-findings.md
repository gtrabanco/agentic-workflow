| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json` route `execute-phase:*` entries — `bun scripts/check-skill-context.mjs --routes` exits 1 on 7 route-line ceilings now below the manifest's declared `ceil(measured × 1.10)` floor (`:feature`/`:finding`/`:fix`/`:legacy`/`:small` 893 < 908, `:descope` 942 < 957, `:final-pr` 919 < 934), and `node --test scripts/*.test.mjs` exits 1 on `scripts/check-skill-context.test.mjs` because of it; both exit 0 on `origin/main` — no route ceiling was re-based, only `skills.unit-lane` was added · fold 5d38a14880e2b858f4f5db56b3030bbbb3425d2c | perf | high | fix-now | fold into current phase (source: re-base the seven `routeLinesMax` values to the declared formula and name the growth source — fix/258 `Needs-input guard`, `skills/execute-phase/SKILL.md:67-78` — in each route `sources` plus `policy.declared`) | yes |
| F2 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:246` — the Evidence rows record `Exit 0` for AC1–AC6 and AC5 claims "28 skills PASS", while the Progress log at `:268` reports "root suite pass (115 failures, 103 pre-existing schema/build infra issues … resolved by SKILL_CONTEXT_BUDGETS.json update)"; the executed gate is red (F1), obligation `O6` is still `planned`, `P6` at `:113` is unticked, and §Known pre-existing issues says "none recorded" · fold 5d38a14880e2b858f4f5db56b3030bbbb3425d2c | spec-drift | high | fix-now | replan (plan: replace the receipts with the real commands and exit codes once F1 is green, set `O6` to its true state, and reconcile §Known pre-existing issues with the recorded baseline) | yes |
| F3 | `skills/execute-phase/SKILL.md:69-80` — AC1 requires the body to name "confirmed phase, confirmed file targets", but `Needs-input guard` names only `<NN-slug>` as required and classifies `P<k>` as optional ("Absent → first unfinished step"); "file targets" appears nowhere, yet the SPEC's Evidence row marks AC1 `read-verified` (`SPEC.md:246`, criterion at `:36-40`) · fold 5d38a14880e2b858f4f5db56b3030bbbb3425d2c | spec-drift | med | fix-now | replan (plan: add the two fields to the required list with the halt guard — re-checking the resulting context budget under F1 — or narrow AC1 to the contract the body implements) | yes |
| F4 | `CHANGELOG.md:289` — three pre-existing rows were rewritten by this change instead of left byte-for-byte: `5.1.0` at `:289` and `1.5.0` at `:692` lost the `)` that closes "(issue #291 / unit 73 P4/P3)", and `3.3.0` at `:702` gained a stray pipe inside its bold marker, leaving 5 cells in a 4-column table (the row's post-pipe text is dropped in render); compare `origin/main` `:287`, `:689`, `:698` · fold 5d38a14880e2b858f4f5db56b3030bbbb3425d2c | code | med | fix-now | fold into current phase (source: restore the three rows byte-for-byte from `origin/main` and keep `5.2.0`/`1.6.0`/`3.4.0` purely additive) | yes |
| F5 | `skills/execute-phase/SKILL.md:67` — the diff replaced the `## Process` heading with `## Needs-input guard`, so execution steps `### 1`–`### 8` (`:80`–`:183`) now nest under the guard section instead of a Process section; `origin/main:64` carries `## Process` · fold 5d38a14880e2b858f4f5db56b3030bbbb3425d2c | code | med | fix-now | fold into current phase (source: restore `## Process` above `### 1.` and keep the guard as its own preceding section) | yes |
| F6 | `skills/unit-lane/references/DESIGN.md:5` — the new guard declares "Decide for me" a required input that must be answered concretely, contradicting the unit's own Input audit (U4 at `SPEC.md:151`: `optional`, "No change") and DESIGN.md's gap-interview contract at `:49-52`, where "Decide for me" is an offered choice the lane then records; a user selecting it would now be re-asked and halted · fold 5d38a14880e2b858f4f5db56b3030bbbb3425d2c | code | med | fix-now | fold into current phase (source: drop "Decide for me" from the required list, keeping vague scope / acceptance criteria) | yes |
| F7 | `skills/init-workspace/SKILL.md:44-48` — two contradictory rules for `<target-dir>`: the guard makes it required and halts when blank ("Cwd is used as a fallback only"), while Step 0 at `:61` documents `[target-dir], default cwd`, §When-to-use and the frontmatter `argument-hint` treat it as optional, and the SPEC's input audit I1 at `SPEC.md:162` records "No change — cwd is an acceptable default here" · fold 5d38a14880e2b858f4f5db56b3030bbbb3425d2c | code | med | fix-now | fold into current phase (source: delete the `<target-dir>` bullet from the guard, or restate it as optional — absent → cwd, recorded; one edit reconciles guard, Step 0 and I1) | yes |
| F8 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:94` — the Tasks bullets are written `- [x] P1 — …`, which `scripts/unit-doc-phases.mjs:16`'s `UNIT_DOC_BULLET` does not accept, so the unit doc parses to zero phases: `node scripts/phase-lint.mjs <SPEC>` answers `verdict BLOCKED: no-phases` and `node scripts/unit-route.mjs 258-harden-needs-input-contracts` errors with "no parseable phase … (re-run the lane's plan step)" instead of printing the phase or the `route: replan` hand-off · fold 5d38a14880e2b858f4f5db56b3030bbbb3425d2c | workflow | med | fix-now | replan (plan: write the Tasks bullets in the unit-doc grammar — `- P<n> — <task> (validator: …)` with the tick marker outside the bullet, or move it into the bullet body — then re-run `node scripts/phase-lint.mjs <SPEC>` to PASS) | yes |
| VF-1 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:route-execute-phase · reviewer review-change · HEAD d7c8b8341ed1b29c00327e65df951ab264072db2 · recheck reproducible command output: `bun scripts/check-skill-context.mjs --routes` → exit 1, 7 `execute-phase:*` route-line failures (e.g. `execute-phase:feature: ceiling 893 < 908 = ceil(measured × 1.10) 825`); the same command in a pristine `origin/main` worktree → exit 0, `PASS route budgets: 14 routes` | perf | confirmed | finding-mark | n/a | n/a |
| VF-2 | docs/fix/258-harden-needs-input-contracts/SPEC.md:246 · reviewer review-change · HEAD d7c8b8341ed1b29c00327e65df951ab264072db2 · recheck direct read of the Evidence rows (`:246`–`:251`), the Progress log (`:268`), the Tasks tick (`:113`) and obligation `O6` against the executed gate output recorded in VF-1 and VF-8 | spec-drift | confirmed | finding-mark | n/a | n/a |
| VF-3 | skills/execute-phase/SKILL.md:69 · reviewer review-change · HEAD d7c8b8341ed1b29c00327e65df951ab264072db2 · recheck direct read: `grep -n 'confirmed phase' skills/execute-phase/SKILL.md` and `grep -n 'file target' skills/execute-phase/SKILL.md` both return no match, while `:69-80` lists only `<NN-slug>` as required and `P<k>` as optional | spec-drift | confirmed | finding-mark | n/a | n/a |
| VF-4 | CHANGELOG.md:289 · reviewer review-change · HEAD d7c8b8341ed1b29c00327e65df951ab264072db2 · recheck direct read + pipe census: `awk` over the three rows gives 5/5/6 pipes at `:289`/`:692`/`:702` against 5 at `origin/main:287`/`:689`/`:698` and a 5-pipe header at `:701`, and `git diff origin/main...HEAD -- CHANGELOG.md` shows `P4):` → `P4:` and `AC22):**` → `AC22):` followed by a pipe | code | confirmed | finding-mark | n/a | n/a |
| VF-5 | skills/execute-phase/SKILL.md:67 · reviewer review-change · HEAD d7c8b8341ed1b29c00327e65df951ab264072db2 · recheck direct read: `grep -n '^## ' skills/execute-phase/SKILL.md` lists no `## Process` between `## Step 0 — Discover the project` (`:60`) and `## Required references` (`:184`), while `git show origin/main:skills/execute-phase/SKILL.md` carries `## Process` at `:64` and the first step at `### 1.` sits at `:80` after the new guard heading | code | confirmed | finding-mark | n/a | n/a |
| VF-6 | skills/unit-lane/references/DESIGN.md:5 · reviewer review-change · HEAD d7c8b8341ed1b29c00327e65df951ab264072db2 · recheck direct read: the required list at `:3-11` names "Decide for me", while `SPEC.md:151` classifies U4 `optional` with "No change" and DESIGN.md `:49-52` describes it as an offered slot option the lane records | code | confirmed | finding-mark | n/a | n/a |
| VF-7 | skills/init-workspace/SKILL.md:44 · reviewer review-change · HEAD d7c8b8341ed1b29c00327e65df951ab264072db2 · recheck direct read: the guard bullet at `:44-48` requires `<target-dir>` and halts, Step 0 at `:61` reads `[target-dir], default cwd`, the frontmatter `argument-hint` at `:4` is a bare `<target-dir>`, and `SPEC.md:162` records I1 as "No change — cwd is an acceptable default here" | code | confirmed | finding-mark | n/a | n/a |
| VF-8 | docs/fix/258-harden-needs-input-contracts/SPEC.md:94 · reviewer review-change · HEAD d7c8b8341ed1b29c00327e65df951ab264072db2 · recheck reproducible command output: `node scripts/phase-lint.mjs docs/fix/258-harden-needs-input-contracts/SPEC.md` → `verdict BLOCKED: no-phases`; a `parseUnitDocPhases` probe returns 0 phases / 6 orphans, and the same text with the `- [x] ` tick marker stripped returns phases 1-6; `node scripts/unit-route.mjs 258-harden-needs-input-contracts` → `error` / `no parseable phase` | workflow | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD cb9afa59baa0c374a0f453c0f04ae392191d8389 | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD cb9afa59baa0c374a0f453c0f04ae392191d8389 | node --test scripts/*.test.mjs | exit 0 | | |
| GATE-RAN | HEAD cb9afa59baa0c374a0f453c0f04ae392191d8389 | bun scripts/check-skill-context.mjs --routes | exit 0 | | |
| GATE-RAN | HEAD cb9afa59baa0c374a0f453c0f04ae392191d8389 | bun scripts/check-skill-context.mjs | exit 0 | | |
| REVIEW-RAN | HEAD 5d38a14880e2b858f4f5db56b3030bbbb3425d2c | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 5d38a14880e2b858f4f5db56b3030bbbb3425d2c | node --test scripts/*.test.mjs | exit 0 | | |
| GATE-RAN | HEAD 5d38a14880e2b858f4f5db56b3030bbbb3425d2c | bun scripts/check-skill-context.mjs --routes | exit 0 | | |
| GATE-RAN | HEAD 5d38a14880e2b858f4f5db56b3030bbbb3425d2c | bun scripts/check-skill-context.mjs | exit 0 | | |

---

Cycle 3 — **full pass** on a post-clean head — ran 2026-10-19 (`review-change`,
fresh context, reviewed head `0814ea3db9ed3de406a8b09ef9390dc4a48072de`, PR #302). Cycle 3 = two completed
`REVIEW-RAN` marks + 1, and it runs **on the user's explicit instruction**
(`/review-change fix/258-harden-needs-input-contracts`); a third cycle never
starts by reviewer election. Scope: `git diff main...HEAD` (11 files).

**Workspace state (a precondition, never a finding).** `git status --porcelain`
empty · `git status -sb` in sync with
`origin/fix/258-harden-needs-input-contracts` · PR #302 OPEN at the reviewed
head.

**Every `folded: yes` row re-verified at its cited location — 8/8 repaired, 0
regressions** — F1 `bun scripts/check-skill-context.mjs --routes` exits 0 (PASS
14 routes) and all seven re-based `execute-phase:*` entries name the `fix 258 /
#258 harden-needs-input` growth source · F2 the Evidence rows match the executed
gate (`693 tests PASS` reproduced, `O6` is `verified`, `P6` ticked, known-issues
reconciled) · F3 the AC1 fields are real prose at `:75`/`:77` — but the repair
introduced the new contradiction F9 below · F4 the three pre-existing CHANGELOG
rows are byte-identical to `main` (`:289`/`:692`/`:702`) · F5 `## Process` is
back at `:84` with steps `### 1.`–`### 8.` nested under it · F6 "Decide for me"
is gone from `DESIGN.md`'s required list · F7 the `<target-dir>` guard bullet is
gone · F8 `node scripts/phase-lint.mjs <SPEC>` → `verdict PASS (6/6)` and
`node scripts/unit-route.mjs <unit>` parses the six phases (`route: close-out`).

**Passes run (isolated, one context each):** code, verify, perf, security,
brand, plus the inline API-ergonomics pass. **Skipped:** design, a11y, seo — the
change ships no UI, page or web surface (skill prose + one JSON manifest).

**Gates re-derived at the reviewed head.** `node --test scripts/*.test.mjs` →
`693 tests · 693 pass · 0 fail`, exit 0 · `bun scripts/check-skill-context.mjs`
→ `PASS context budgets: 28 skills`, exit 0 · `bun scripts/check-skill-context.mjs
--routes` → `PASS route budgets: 14 routes`, exit 0 · `node scripts/phase-lint.mjs
docs/fix/258-harden-needs-input-contracts/SPEC.md` → `verdict PASS`, exit 0 ·
`node scripts/version-parity-gate.mjs --content --base main` → `VERDICT: PASS`,
exit 0 · `node --test scripts/normative-drift.test.mjs` → 18/18 pass, exit 0.

**New rows F9–F15** come from the isolated code and brand passes (F9, F11–F14),
the perf pass (F10, F11) and the orchestrator's own read of the
obligations ledger (F15); each carries its `VF-` mark below with the recheck
method its axis demands.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F9 | `skills/execute-phase/SKILL.md:75-83` | code | high | fix-now | fold into current phase (source: `Needs-input guard` lists `confirmed phase`/`confirmed file targets` as required-halt while the same section lists `P<k>` under "Optional inputs (may default): Absent → first unfinished step", and `argument-hint` `:5` + Argument resolution `:24-27` + Process §2 `:95` all implement the default — split the bullet so a lane hand-off's phase is required and a bare `<NN-slug>` operator run is the documented explicit default, or state the phase as resolved-with-confirmation rather than required); **regression of F3** | yes |
| F10 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:1` | code | med | fix-now | fold into current phase (source: re-emit the manifest with `JSON.stringify(…, null, 2)` so the 466/454-line re-indent collapses to the 30/18 semantic lines — the repo's 2-space JSON convention and the shape `scripts/check-skill-context.mjs:371` emits) | yes |
| F11 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:22-27` | code | med | fix-now | fold into current phase (source: complete the re-basis the unit declares — `init-workspace` measures 3091 est against the unit-65 ceiling 3195 (3.4 % headroom vs the manifest's declared `ceil(measured × 1.10)` = 3401) and its entry names no `fix 258` growth source; add `mainLinesMax` + re-based `mainEstimateMax` + the source, or record why this skill is exempt) | yes |
| F12 | `skills/unit-lane/SKILL.md:55-65` | code | med | fix-now | fold into current phase (source: one home for "no silent `feature` default" — bullets 1 and 3 both state it, and bullet 1 closes on a bare "STOP instead of inferring" instead of the emit-and-stop line it already carries one sentence earlier) | yes |
| F13 | `skills/execute-phase/SKILL.md:76,78` · `skills/unit-lane/SKILL.md:62` · `skills/init-workspace/SKILL.md:43` | code | med | fix-now | fold into current phase (source: ship the refusal the SPEC and all four CHANGELOG rows promise — four required bullets say only `halt with \`requires manual input\``, and two more (`unit-lane:63-65`, `init-workspace:45-46`) say "STOP and ask" without naming it; state `→ Next: <skill> requires manual input — cannot proceed` once as the section's halt action and reference it, never paraphrase) | yes |
| F14 | `skills/unit-lane/references/RESEARCH.md:5-9` | code | med | fix-now | fold into current phase (source: the guard makes the SPEC's objective/scope a required *user* input, but the lane authors that text (`unit-lane/SKILL.md:92-93`) and the step only reads it (`RESEARCH.md:14-15`) — route a blank objective back to the doc (`STOP → repair the SPEC / re-triage`), not to a `requires manual input` refusal the user cannot satisfy) | yes |
| F15 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:147-151` | workflow | med | fix-now | fold into current phase (source: O1/O2/O3/O5 carry `done`, outside the closed status vocabulary `planned \| in-progress \| verified \| n/a \| deferred` that `pre-execution-review/references/LEDGERS.md:60` owns, whose lifecycle rule is "Before the unit ships, every row is `verified`" — rewrite the four cells to `verified`, the evidence is already recorded) | yes |
| VF-9 | `skills/execute-phase/SKILL.md:75-83` · reviewer review-change · HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de · recheck direct read of both lists plus `argument-hint` `:5` and process `:95` (`grep -n "confirmed phase\|P<k>" skills/execute-phase/SKILL.md` → the required bullet at `:75` and the optional bullet at `:81` name the same input) | code | confirmed | finding-mark | n/a | n/a |
| VF-10 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:1` · reviewer review-change · HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de · recheck reproducible command output (`git diff --numstat main...HEAD` → 466/454 for this file; `git diff -w --numstat` → 30/18; `grep -n "JSON.stringify" scripts/check-skill-context.mjs` → `null, 2` at `:371`) | code | confirmed | finding-mark | n/a | n/a |
| VF-11 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:22-27` · reviewer review-change · HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de · recheck reproducible command output (`bun scripts/check-skill-context.mjs` → `init-workspace 3091 224 …`, exit 0, while the manifest entry still reads `mainEstimateMax: 3195` with only the `unit 65 P8` source; `ceil(3091 × 1.10) = 3401`) | code | confirmed | finding-mark | n/a | n/a |
| VF-12 | `skills/unit-lane/SKILL.md:55-65` · reviewer review-change · HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de · recheck direct read (`grep -n "no silent" skills/unit-lane/SKILL.md` → `:57` and `:64`; bullet 1 at `:56-59` ends "vague requests STOP instead of inferring") | code | confirmed | finding-mark | n/a | n/a |
| VF-13 | `skills/execute-phase/SKILL.md:76,78` · reviewer review-change · HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de · recheck reproducible command output (`grep -c "halt with" skills/execute-phase/SKILL.md skills/unit-lane/SKILL.md skills/init-workspace/SKILL.md` → 2/1/1 = four bare fragments, against `grep -c "cannot proceed"` → 2/2/1 on the same files) | code | confirmed | finding-mark | n/a | n/a |
| VF-14 | `skills/unit-lane/references/RESEARCH.md:5-9` · reviewer review-change · HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de · recheck direct read of `RESEARCH.md:5-9`, `:14-15` and `unit-lane/SKILL.md:92-93` (the guard demands a user answer for text the lane writes and the step lists as a read input) | code | confirmed | finding-mark | n/a | n/a |
| VF-15 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:147-151` · reviewer review-change · HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de · recheck direct read of the five obligation rows (`awk -F'|'` → O1/O2/O3/O5 `done`, O6 `verified`) against the closed vocabulary at `pre-execution-review/references/LEDGERS.md:60`; `scripts/pre-execution-quality.test.mjs:658` asserts the vocabulary in the policy text only, never over a unit's rows | workflow | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de | node --test scripts/*.test.mjs | exit 0 | | |
| GATE-RAN | HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de | bun scripts/check-skill-context.mjs | exit 0 | | |
| GATE-RAN | HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de | bun scripts/check-skill-context.mjs --routes | exit 0 | | |
| GATE-RAN | HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de | node scripts/phase-lint.mjs docs/fix/258-harden-needs-input-contracts/SPEC.md | exit 0 | | |
| GATE-RAN | HEAD 0814ea3db9ed3de406a8b09ef9390dc4a48072de | node scripts/version-parity-gate.mjs --content --base main | exit 0 | | |

Report-only notes (low / ignore · never persisted as rows, never blocking — each
carries the re-trigger from the isolated `review-debt` pass):

- **D-258-01** (`review-debt` D2 · code · low): `docs/workflow/SKILL_CONTEXT_BUDGETS.json:107` — `unit-lane` declares its re-basis in a scalar `mainReason` while the eight sibling entries use a `mainSources` map, and no consumer reads either key (`grep -rn mainReason .` → 1 hit; `grep -rn "mainSources\|referenceSources" scripts/ packages/*/src` → 0 hits). **Trigger:** a second entry needs a scalar reason, or any consumer starts reading either key → unify on `mainSources`.
- **D-258-02** (`review-debt` D4 · code · low): `skills/execute-phase/SKILL.md:80-83` — the "Optional inputs" list omits `--force`, which `argument-hint` `:5` declares and `:104` overrules. **Trigger:** the next edit to that list, or a `--force` bypass ever landing.
- **D-258-03** (`review-debt` D5 · verify · low): the AC1–AC3 validators are self-reference counters (`grep -cE "requires [a-z ]*input"` → 4/5/2) that pass on the bare fragment too, so they cannot prove F13 repaired. **Trigger:** the next guard-bullet edit, or the counters ever cited as F13's proof.
- **D-258-04** (`review-debt` D9 · code · low): `skills/unit-lane/references/DESIGN.md:8` — "required gap-slot" is a coined compound against the file's own asked / cheap-and-recorded taxonomy (`:45-46`). **Trigger:** the next edit to the gap-slot taxonomy.
- **D-258-05** (`review-debt` D10 · code · low): `skills/unit-lane/SKILL.md:66-68` — `--retriage` now has four homes (`:5`, `:44`, `:68`, `:244`) in a file just re-based for growth. **Trigger:** a fifth stating, or the next ceiling re-basis.
- **D-258-06** (`review-debt` D11 · brand · low): `skills/unit-lane/references/DESIGN.md:9` + `RESEARCH.md:8` — `→ Next: unit-lane (design step) …` puts a non-skill token in the hand-off command slot. **Trigger:** `normative-drift.test.mjs`'s `closing-hand-offs` surface extended to `skills/**`.
- **D-258-07** (`review-debt` D12 · brand · low): `skills/execute-phase/SKILL.md:37-39` (+ `unit-lane:24-26`, `init-workspace:24-26`) — the Turn-contract box embeds a literal `→ Next:` string above the box that requires the closing block be printed last. **Trigger:** a run that quotes the box literally, or the next edit to any of the three boxes.
- **D-258-08** (`review-debt` D13 · brand · low): `CHANGELOG.md:100,288,691,701` — the rows call one `✓` sentence a "Turn-contract `Required user inputs` box" that exists nowhere as a named box, and `:288` lacks its terminal period. **Trigger:** the next release-prep pass over these rows.
- **D-258-09** (`review-debt` D15 · workflow · low): branch history carries `implement(258):…`, outside the conventional-commit set in `AGENTS.md`. **Trigger:** a rebase/recreate of the branch (a squash to `fix(258):` costs nothing there).
- **Noted, no action** (`ignore`): `skills/execute-phase/SKILL.md:73` names `<NN>-<slug>` (the unit-folder shape) while the argument token is `<NN-slug>` — two legitimate grammars, both needed; `skills/execute-phase/SKILL.md:67`'s guard section sits inline in read order, and the reachability rule governs referenced *files*, not same-file sections.

Refuted candidates (reported with counter-evidence, never persisted):
`<NN-slug>` derivable from the tree without asking (AC1 mandates the prose guard; the SPEC's Non-goals declare agent-enforced prose) · `init-workspace` consent paths surviving in `BOOTSTRAP_WRITE.md` (the explicit-yes rules remain at `SKILL.md:126-134` and step 8's "ask consent"; AC3's scope is installs/hooks/overwrites) · `--from-issue` backfill (a tracked issue is the user's own artifact) · "cheap-to-change" defaults in `DESIGN.md` (restates the approved 1.4.0 interview contract; SPEC U4 = no change) · the unverifiable `29b52c63` citation (the SPEC says "referenced by the issue" and PE-003 already records `ASSUMPTION-UNVERIFIED`) · `policy.declared`'s "no lines ceiling moved" clause (it describes the 2026-09-21 main sync, not this change) · inherited over-slack route ceilings (pre-existing on `main`; the policy says lowering is a declared act, never demanded) · guard prose repeated across `unit-lane/SKILL.md` and its two references (AC2 mandates a guard in each reference) · the SPEC header's "in-progress → done" (a done unit awaiting its merge gate is the router's own state: `status: done`, `route: close-out`).

```text
CONVERGENCE-ANOMALY — fix-258 source
- Finding ids: new: F9, F10, F11, F12, F13, F14, F15 / repeated: F3 (F9 is its regression, same file:line+axis)
- Snapshots: 5d38a14880e2b858f4f5db56b3030bbbb3425d2c -> 0814ea3db9ed3de406a8b09ef9390dc4a48072de (ec10e7d6 -> 0814ea3d)
- Missed: F3's repair was verified as "the fields are now named" and not re-read as a decision on the same input the section's optional list still defaults — a one-sided read of a two-sided contradiction; the budget re-basis was verified by exit code only, so the re-indent and the un-re-based third skill stayed invisible
- Owning stage: source (F9–F14 are this unit's own new prose and manifest) and plan (F15 is the unit doc's obligations ledger)
- Why the prior review failed: cycle 2 checked each fold in isolation ("does the field exist?") instead of re-reading the repaired section as a whole, and consumed the budget gate's exit code as proof of a declared re-basis
- Route to owner: source rows -> `/fold-findings` with F9 + F10 + F11 + F12 + F13 + F14; plan row -> the same fold cycle rewriting the four obligation cells (F15)
```

Review→fold accounting: cycle 1 produced F1–F8 and folded them; cycle 2 was clean
and posted nothing; cycle 3 is the one above. Two `REVIEW-RAN` marks are on the
ledger, so this is cycle 3 by count and it needed the user's explicit instruction
to start; the fold this report routes to is the **second** review→fold cycle, so
the cap bites at the re-review after it.

---

Cycle 4 — **delta mode, escalated to a full pass** — ran 2026-10-19
(`review-change`, fresh context, reviewed head
`5b08197a95209249c833bf1dfe5c820d572ebf9c`, PR #302). Cycle 4 = three completed
`REVIEW-RAN` marks + 1. The user's invocation names the reason: the fold batch
changed a non-Markdown file (`docs/workflow/SKILL_CONTEXT_BUDGETS.json`) and
carries no prior consumer skip decision, so `fold-findings`' branch table gives
`RE-REVIEW-REQUIRED (delta)` (also forced by the folded row F9's `high`
severity).

**Escalation to a full pass (both triggers fired, numbers stated).** Width: the
fold diff `git diff 2824b7c2..5b08197a` changes 934 lines in
`docs/workflow/SKILL_CONTEXT_BUDGETS.json`, far more than 50 lines from the only
cited range in that file (`:22-27`; the re-emit also rewrote the `\u2014`/`\u2192`
escapes of pre-existing entries) and touches `review-findings.md`, outside the
union of the folded rows' cited files. Size: 511 added + 498 deleted = 1009
changed lines > 200 across 7 files (≤ 15). The review therefore covers
`git diff main...HEAD` (11 files), not just the fold diff.

**Workspace state (a precondition, never a finding).** `git status --porcelain`
empty · `git status -sb` in sync with
`origin/fix/258-harden-needs-input-contracts` · PR #302 OPEN at the reviewed
head · no `ACCEPTANCE.md` for this unit (legacy SPEC-blob fallback).

**Every `folded: yes` row re-verified at its cited location — 15 rows, 4 do not
hold.** F1 routes PASS (14 routes) with each re-based `execute-phase:*` entry
naming the fix-258 growth source (residual: `policy.declared` gained no fix-258
clause — note L2) · F2 **regression** (Evidence counts false → F16) · F3
**regression** (AC1 fields gone again → F17) · F4 the three pre-existing
CHANGELOG rows are byte-identical to `main` (`git diff main...HEAD -- CHANGELOG.md`
has no removed row) · F5 `## Process` back at `:87`, steps nested under it · F6
"Decide for me" gone from `DESIGN.md`'s required list · F7 the `<target-dir>`
guard bullet is gone and Step 0 keeps `[target-dir], default cwd` · F8
`phase-lint` PASS (6/6) and `unit-route` parses the six phases · F9 repaired (the
contradiction is gone) but its resolution created F17 · F10 the re-indent
collapsed (`git diff -w --numstat` 57/43 vs the 466/454 whitespace churn) · F11
**regression** (the re-basis it added is already below the declared floor → F18)
· F12 one home for "no silent `feature` default" (`grep -n "no silent"` → `:67`
only) · F13 the refusal line is stated once per guard section and referenced ·
F14 repaired (the blank objective now hands back to the design step that writes
it) · F15 statuses inside the closed vocabulary.

**Passes run (isolated, one context each):** code, verify, perf, security,
brand, plus the inline API-ergonomics pass. **Skipped:** design, a11y, seo — the
change ships no UI, page or web surface (skill prose + one JSON manifest).

**Gates re-derived at the reviewed head.** `node --test scripts/*.test.mjs` →
`693 tests · 693 pass · 0 fail`, exit 0 · `bun scripts/check-skill-context.mjs`
→ `PASS context budgets: 28 skills`, exit 0 · `bun scripts/check-skill-context.mjs
--routes` → `PASS route budgets: 14 routes`, exit 0 · `node scripts/phase-lint.mjs
docs/fix/258-harden-needs-input-contracts/SPEC.md` → `verdict PASS (6/6)`, exit 0
· `node scripts/version-parity-gate.mjs --content --base main` → `VERDICT: PASS`,
exit 0 · `bun run test` in `packages/pi-agentic-workflow` → `432 pass · 0 fail`.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F16 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:186-187` (+ obligations `:176-177`) — the Evidence rows and O1/O2 record `grep -cE "requires [a-z ]*input"` matches 4 (AC1/O1) and totals 5 (AC2/O2), exit `0`, status `verified`; at the reviewed head the command returns 2 for `skills/execute-phase/SKILL.md` and 2+1+1 = 4 across `skills/unit-lane/SKILL.md` + `references/DESIGN.md` + `references/RESEARCH.md`, so both declared validators fail while the rows still read green (the F13 consolidation deleted the two fragments the counter counted) · fold 5b08197a95209249c833bf1dfe5c820d572ebf9c | spec-drift | high | fix-now | fold into current phase (source: re-run both declared validators at the reviewed head and record the true counts, or restore what F13 removed — reconcile Evidence AC1/AC2 and O1/O2 together, never by editing the numbers alone); **regression of F2** | yes · fold 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec |
| F17 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:36-40` — AC1 requires the `execute-phase` body to name "confirmed phase, confirmed file targets"; the body (`skills/execute-phase/SKILL.md:67-86`) lists only `<NN-slug>` as required (`grep -n "confirmed phase"` and `grep -n "file target"` both exit 1), while Evidence AC1 at `:186` reads read-verified — the F9 fold resolved the F3 contradiction by deleting the AC1-mandated fields instead of the conflicting default, so F3's defect is back · same fold sha | spec-drift | high | fix-now | fold into current phase (source: state the resolved phase and target confirmation in the guard so AC1 holds — the operator's `<NN-slug>` confirmation names the phase and file targets the body resolves — or amend AC1 with explicit user approval); **regression of F3** | yes · fold 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec |
| F18 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:22-28` (init-workspace), `:79-90` (execute-phase), `:106-110` (unit-lane) — the three skill entries this unit wrote sit below the manifest's own declared floor at the reviewed head: init-workspace measures 3133 est / 228 lines → floor 3447 / 251 vs ceiling 3401 / 247; execute-phase measures 3285 / 276 → line floor 304 vs ceiling 294; unit-lane measures 3048 / 248 → floor 3353 / 273 vs ceiling 3329 / 270, and its `mainReason` cites measured 3026 / 245; the execute-phase entry and four route `sources` also cite "F3: confirmed phase + file targets", content the F9 fold removed · same fold sha | code | med | fix-now | fold into current phase (source: re-base the three ceilings to ceil(measured × 1.10) at the reviewed head and replace the reverted F3 citation with what the guard actually ships); **regression of F11** | yes · fold 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec |
| F19 | `skills/unit-lane/SKILL.md:59-64` — the guard lists `<NN-slug>` / `<idea>` as an unconditional required input with the halt line, while the same skill documents `--fix <issue-number>` and `--from-issue <issue-number>` as complete entry forms that carry no slug (`argument-hint` `:5`, `## When to use` `:38-44`, Process §1's invocation table `:88-91`): `/unit-lane --fix 258` is a documented invocation the guard would re-ask for a slug and then halt | code | med | fix-now | fold into current phase (source: scope the slug/idea bullet to the slug/idea mode — "required unless `--fix`/`--from-issue` supplies the unit" — mirroring Process §1's table) | yes · fold 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec |
| VF-16 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:186-187` · reviewer review-change · HEAD 5b08197a95209249c833bf1dfe5c820d572ebf9c · recheck reproducible command output: F17 restored F3 fields → `grep -cE "requires [a-z ]*input" skills/execute-phase/SKILL.md` → 4 (was 2); `unit-lane/SKILL.md` + `references/DESIGN.md` + `references/RESEARCH.md` → 2/1/1 = 4 (was 4/5); Evidence/O1/O2 updated to 4/4 · confirmed · fold 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec | spec-drift | confirmed | finding-mark | n/a | n/a |
| VF-17 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:36-40` · reviewer review-change · HEAD 5b08197a95209249c833bf1dfe5c820d572ebf9c · recheck direct read: `grep -n "confirmed phase"` and `grep -n "file target"` over `skills/execute-phase/SKILL.md` now match at `:81,83` (F17 restored them) · confirmed · fold 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec | spec-drift | confirmed | finding-mark | n/a | n/a |
| VF-18 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:22-28` · reviewer review-change · HEAD 5b08197a95209249c833bf1dfe5c820d572ebf9c · recheck reproducible command output: ceilings re-based to init-workspace 3447/251, execute-phase 3614/304, unit-lane 3329/270; all route ceilings raised (execute-phase:descope 967→972, execute-phase:feature:fix:legacy:small:finding 918→922, execute-phase:final-pr 944→949, execute-phase:unit-loop 984→991); `policy.declared` updated (L2) · confirmed · fold 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec | code | confirmed | finding-mark | n/a | n/a |
| VF-19 | `skills/unit-lane/SKILL.md:59-64` · reviewer review-change · HEAD 5b08197a95209249c833bf1dfe5c820d572ebf9c · recheck direct read of `:5` (argument-hint alternatives), `:38-44` (When to use), and Process §1's invocation table `:88-91` against the guard's required list; `--fix` / `--from-issue` now excluded from slug requirement (F19 scope fix) · confirmed · fold 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec | code | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 5b08197a95209249c833bf1dfe5c820d572ebf9c | n/a | n/a | review-mark | n/a | n/a |
| REVIEW-RAN | HEAD 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 5b08197a95209249c833bf1dfe5c820d572ebf9c | node --test scripts/*.test.mjs | exit 0 | | |
| GATE-RAN | HEAD 5b08197a95209249c833bf1dfe5c820d572ebf9c | bun scripts/check-skill-context.mjs | exit 0 | | |
| GATE-RAN | HEAD 5b08197a95209249c833bf1dfe5c820d572ebf9c | bun scripts/check-skill-context.mjs --routes | exit 0 | | |
| GATE-RAN | HEAD 5b08197a95209249c833bf1dfe5c820d572ebf9c | node scripts/phase-lint.mjs docs/fix/258-harden-needs-input-contracts/SPEC.md | exit 0 | | |
| GATE-RAN | HEAD 5b08197a95209249c833bf1dfe5c820d572ebf9c | node scripts/version-parity-gate.mjs --content --base main | exit 0 | | |
| GATE-RAN | HEAD 5b08197a95209249c833bf1dfe5c820d572ebf9c | bun run test (packages/pi-agentic-workflow) | exit 0 | | |
| REVIEW-RAN | HEAD 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec | node --test scripts/*.test.mjs | exit 0 | | |
| GATE-RAN | HEAD 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec | bun scripts/check-skill-context.mjs | exit 0 | | |
| GATE-RAN | HEAD 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec | bun scripts/check-skill-context.mjs --routes | exit 0 | | |
| GATE-RAN | HEAD 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec | node scripts/phase-lint.mjs docs/fix/258-harden-needs-input-contracts/SPEC.md | exit 0 | | |
| GATE-RAN | HEAD 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec | node scripts/version-parity-gate.mjs --content --base main | exit 0 | | |

Report-only notes (low / ignore · never persisted as rows, never blocking):

- **L1** (code · low): `skills/execute-phase/SKILL.md:84` points the `--force` bullet at `:104`, but the no-bypass sentence now sits at `:107` — the guard insert shifted the file under its own self-reference. **Trigger:** the next edit to the guard or to §3's pre-step gates.
- **L2** (code · low): `docs/workflow/SKILL_CONTEXT_BUDGETS.json:468` — `policy.declared` gained no `2026-10-18 (fix 258 …)` clause although F1's remediation named it; every route `sources` does carry the growth source, so the policy rules hold. **Trigger:** the next re-basis pass or a `policy.declared` audit.
- **L3** (workflow · low): `node scripts/ledger-provenance.mjs --check` exits 1 on this ledger — F1–F15 cite fold commits (`5d38a148…`, unchanged) that stopped being ancestors of HEAD when the branch's fold commits were rewritten (`ec10e7d6` / `5b08197a`); the same check exits 1 on feature 30's ledger, so it is not currently a merge gate. **Trigger:** the provenance check becomes a gate, or the ledger is next edited for a fold.
- Carried from cycle 3, unchanged and non-blocking: D-258-04 (`DESIGN.md` coined compound), D-258-05 (`--retriage` four homes), D-258-06 (`unit-lane (design step)` hand-off token), D-258-07 (Turn-contract `→ Next:` box), D-258-09 (commit label convention). D-258-01 resolved (unit-lane now uses `mainSources`), D-258-02 resolved (F17 added `--force` to optional inputs), D-258-03 (counter validator — F17 restored the two fragments, counters now return 4/5, but the validator's own assertion that it can prove repair is false: the fragment count passing doesn't prove the specific fields exist), D-258-08 (resolve alongside D-258-02's `--force` fix — F17's guard now references a named optional input, the CHANGELOG's claim about a box now matches).

Refuted candidates (reported with counter-evidence, never persisted): the
unit-lane guard re-introduces F12's duplicate (only `:67` carries "no silent",
one home) · the F9 fold makes a bare `<NN-slug>` run silently (Process §2 still
resolves the first unfinished step, which F9's own remediation sanctioned — the
defect is the acceptance drift F17, not silent execution) · the manifest re-emit
dropped semantic content (`node -e` parse + both budget gates PASS; the diff is
the three re-based entries plus the escape normalization) · RESEARCH.md's guard
is unsatisfiable (it now hands back to the design step that writes the objective)
· the fold owes a `REPAIR-RECEIPT` row in this ledger (the receipt is append-only
output history, explicitly "no ledger row" in `fold-findings`).

```text
CONVERGENCE-ANOMALY — fix-258 source
- Finding ids: new: F16, F17, F18, F19 / repeated: F2, F3, F11 (F16/F17/F18 are their regressions at the same file+axis)
- Snapshots: 2824b7c2 -> 5b08197a95209249c833bf1dfe5c820d572ebf9c (fold batch F9–F15)
- Missed: cycle 3 verified the F2 receipts and the F3 fields against the text it had just written, then the same batch's F13 consolidation deleted the counter fragments and the F9 restructure deleted the AC1 fields — each fold was checked in isolation from the fold that followed it, and the manifest re-basis was computed before the final two character-level edits to the same three skills
- Owning stage: source (F16–F19 are this unit's own receipts, guard prose and manifest)
- Why the prior review failed: it re-verified folded rows against the *pre-fold* measurement and never re-ran the unit's own declared validators after its own batch landed, so a self-invalidating batch passed
- Route to owner: source rows -> `/fold-findings` with F16 + F17 + F18 + F19
```

```text
LOOP CAP REACHED — 258-harden-needs-input-contracts
- Finding ids: F16, F17, F18, F19
- Cycles: 2 (REVIEW-RAN marks + forge receipts)
- Route: /triage-issue --prioritize-now 258-harden-needs-input-contracts F16 F17 F18 F19 (or the programmatic outer driver)
```


---

Cycle 7 — **adversarial, N=2 isolated reviewers** — ran 2026-10-19
(`review-change --adversarial 2`, fresh context, reviewed head
`18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b`, PR #302). Cycle 7 = six completed
`REVIEW-RAN` marks + 1 (two of them share `939f6013`), and it starts on the
user's explicit instruction — the review→fold cap already bit at cycle 4 and a
further cycle never starts by reviewer election.

**Escalation (delta → full pass), trigger and numbers stated.** The preceding
fold batch (`939f6013`, `git diff 221b3ab4..939f6013`) changed
`skills/unit-lane/references/RESEARCH.md`, outside the union of the folded
rows' cited files (F16–F19 cite SPEC.md, SKILL_CONTEXT_BUDGETS.json,
execute-phase/SKILL.md, unit-lane/SKILL.md) — **width trigger fired**. Size
stayed under both limits (5 files, 35+/28− = 63 changed lines). The review
therefore covers `git diff main...HEAD` (11 files).

**Workspace state (a precondition, never a finding).** `git status --porcelain`
empty · `git status -sb` in sync with `origin/fix/258-harden-needs-input-contracts`
· PR #302 OPEN at the reviewed head · no `ACCEPTANCE.md` for this unit (legacy
SPEC-blob fallback).

**Frozen acceptance + SPEC drift.** AC1–AC6 each map to evidence in the unit
doc and every one of the 11 changed files maps to a criterion (none is
`none`-mapped). The SPEC's declared validators reproduce at the head: AC1 4,
AC2 4 (2+1+1), AC3 2, AC4 3 boxes, AC6 4. Two criteria hold only textually:
AC1's required fields exist but contradict the optional list beside them
(F20), and the SPEC's declared manual halt verification has no receipt (F25).

**Every `folded: yes` row re-verified at its cited location — 19 rows, 3 do not
hold.** F1 `--routes` PASS (14 routes) and every re-based `execute-phase:*`
entry names the fix-258 growth source · F2 the Evidence rows reproduce (AC1 4,
AC2 4, AC3 2, AC6 4; `693 tests PASS` reproduced) · F3 **regression** (F17
restored the AC1 fields without reconciling the optional list → F20) · F4 the
three pre-existing CHANGELOG rows are byte-identical to `main` (no removed line
in the diff) · F5 `## Process` is back at `:91` with steps `### 1.`–`### 8.`
nested under it · F6 "Decide for me" is gone from `DESIGN.md`'s required list ·
F7 the `<target-dir>` guard bullet is gone and Step 0 keeps
`[target-dir], default cwd` · F8 `node scripts/phase-lint.mjs <SPEC>` → `verdict
PASS (6/6)` · F9 **regression** (→ F20) · F10 the re-indent churn is gone
(`git diff --numstat` 59/43 equals `git diff -w --numstat`) · F11/F18
**regression** (→ F26) · F12 one home for "no silent `feature` default"
(`:68` only) · F13 **regression** (→ F22, F23) · F14 repaired (the blank
objective hands back to the doc that writes it) · F15 every obligation row is
`verified` · F16 the counters reproduce (4/4) · F17 the AC1 fields are named at
`:79-83` — the repair holds and is what re-opened F20 · F19 the slug/idea
bullet is scoped to the non-`--fix`/`--from-issue` modes.

A candidate F24 (`skills/init-workspace/SKILL.md:49-50` guarding the
upgrade-vs-bootstrap route) was **refuted** before persistence — Step 0
`:61-70` offers the route as a user choice in both marker branches, so the
guard subtracts no route; it is reported with its counter-evidence and never
becomes a row, which is why F24 has no ledger entry.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F20 | `skills/execute-phase/SKILL.md:79-86` | code | high | fix-now | fold into current phase (source: split the bullet so a lane hand-off's phase is required and a bare `<NN-slug>` run is the documented explicit default, or state the phase as resolved-with-confirmation — then re-check the budget under F26); **regression of F9** |yes |
| F21 | `skills/execute-phase/SKILL.md:81-83` | security | high | fix-now | fold into current phase (source: give "Confirmed file targets" an answer shape and a consumer in Process §3's path-protection step, or drop it from the required list and from the Input audit); 1/2 reviewers |yes |
| F22 | `skills/execute-phase/SKILL.md:80,82` | code | med | fix-now | fold into current phase (source: make the two bullets reference the section's refusal line at `:71`, never paraphrase it — `:69` promises the line for every bullet); 2/2 reviewers; **regression of F13** |yes |
| F23 | `skills/unit-lane/SKILL.md:66-69` | code | med | fix-now | fold into current phase (source: emit the guard refusal line in the unit-kind/scope bullet like its two siblings — `:51-52` promises it for every required bullet); **regression of F13** |yes |
| F25 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:84-86` (+ Evidence `:186-191`, Progress log `:215`) | spec-drift | med | fix-now | fold into current phase (source: record the executed halt run per skill, or narrow "verified manually per skill" to what the read-verified receipts prove — the two must agree) |yes |
| F26 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:79-83,106-111` | code | med | fix-now | fold into current phase (source: re-base execute-phase 3614/304 → ceil(3361/280 × 1.10) = 3698/308 and unit-lane 3329/270 → ceil(3069/249 × 1.10) = 3376/274, correcting the stale `3026/245` citation in the same edit); **regression of F18** |yes |
| F27 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:470` (`policy.declared`) | workflow | med | fix-now | fold into current phase (source: append the 2026-10-19 `fix 258` re-basis clause naming every re-based skill entry and `execute-phase:*` route ceiling with its growth source — carried note L2, named by F1's remediation and never done) |yes |
| F28 | `skills/unit-lane/references/RESEARCH.md:5-10` | security | med | fix-now | fold into current phase (source: make the halt land on a step that asks the user, or add objective/why/outcome to the lane's required list with the same refusal — `unit-lane:56-69` does not require them and `:96-97` fills them by inference) |yes |
| VF-20 | `skills/execute-phase/SKILL.md:79-86` · reviewer review-change · HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b · recheck direct read: `:79-80` required halt-on-blank vs `:84-86` "Absent → resolves to the first unfinished step … No halt", with the default implemented at `:5`, `:24-27` and `:99-101` | code | confirmed | finding-mark | n/a | n/a |
| VF-21 | `skills/execute-phase/SKILL.md:81-83` · reviewer review-change · HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b · recheck reproducible command output: `grep -rni "file targets" skills/ scripts/` → 1 hit (the bullet itself); Process §2/§3 read no target set | security | confirmed | finding-mark | n/a | n/a |
| VF-22 | `skills/execute-phase/SKILL.md:80,82` · reviewer review-change · HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b · recheck reproducible command output: `grep -nE "requires [a-z ]*input" skills/execute-phase/SKILL.md` → full lines at `:39`,`:71`, bare fragments at `:80`,`:82` | code | confirmed | finding-mark | n/a | n/a |
| VF-23 | `skills/unit-lane/SKILL.md:66-69` · reviewer review-change · HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b · recheck reproducible command output: the only `requires … input` matches in `SKILL.md` are `:26` (box) and `:54` (declared line); bullets `:59-62` and `:63-65` reference it, `:66-69` does not | code | confirmed | finding-mark | n/a | n/a |
| VF-25 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:84-86` · reviewer review-change · HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b · recheck missing-documentation: `grep -niE "halt"` over the unit doc, its Evidence rows `:186-191` and Progress log `:215` → no executed halt run recorded | spec-drift | confirmed | finding-mark | n/a | n/a |
| VF-26 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:79-83,106-111` · reviewer review-change · HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b · recheck reproducible command output: `bun scripts/check-skill-context.mjs` → execute-phase 3361/280, unit-lane 3069/249, init-workspace 3133/228; `ceil(measured × 1.1)` = 3698/308, 3376/274, 3447/251 against declared 3614/304, 3329/270, 3447/251 (init-workspace refuted: exactly at floor) | code | confirmed | finding-mark | n/a | n/a |
| VF-27 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:470` · reviewer review-change · HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b · recheck reproducible command output: `policy.declared` is byte-identical to `main` (`cmp` → IDENTICAL), `grep -c "258"` = 0 on both sides, while the file's diff is 59+/43− | workflow | confirmed | finding-mark | n/a | n/a |
| VF-28 | `skills/unit-lane/references/RESEARCH.md:5-10` · reviewer review-change · HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b · recheck direct read of the halt ("handing back to `unit-lane`") against the destination's guard `SKILL.md:56-69` (no objective/why/outcome) and Process §1 `:96-97` ("Fill … from the invocation (or the issue)") | security | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b | node --test scripts/*.test.mjs | exit 0 | | |
| GATE-RAN | HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b | bun scripts/check-skill-context.mjs | exit 0 | | |
| GATE-RAN | HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b | bun scripts/check-skill-context.mjs --routes | exit 0 | | |
| GATE-RAN | HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b | node scripts/phase-lint.mjs docs/fix/258-harden-needs-input-contracts/SPEC.md | exit 0 | | |
| GATE-RAN | HEAD 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b | node scripts/version-parity-gate.mjs --content --base main | exit 0 | | |

**Gate flake observed (pre-existing, not this branch's).** The first root-suite
run at this head exited 1 with 19 failures, all downstream of
`scripts/catalog.test.mjs:205,219` rewriting the real `scripts/catalog.json` in
place while the runner executes test files in parallel; two later runs were
`693 pass · 0 fail · exit 0`. A pristine `origin/main` worktree fails the same
way under the same contention, so the race is pre-existing — recorded as note
N-8 below, never a `workflow` finding against this unit.

Report-only notes (low / ignore · never persisted as rows, never blocking —
from the isolated `review-debt` pass, each carrying its re-trigger):

- **N-1** (`review-debt` D-a · code · low): `docs/workflow/SKILL_CONTEXT_BUDGETS.json:106-111` — the `unit-lane` entry did not exist on `main` and `main`'s defaults (2800/240) already bounded it (≈2741 est / 221 lines); creating an explicit 3329/270 ceiling raises a ceiling the unit's SPEC never declares. **Trigger:** the F26/F27 fold (re-derive the entry from measurement in that batch).
- **N-2** (D-b · brand · low): `CHANGELOG.md:100,288,691,701` calls the added line a "Turn-contract `Required user inputs` box" though it is one `✓` bullet inside an existing fence. **Trigger:** the next `bump-skill` run over those rows.
- **N-3** (D-c · workflow · low): `SPEC.md:56` `# Status` still reads "review folded F1–F8" while F9–F28 exist. **Trigger:** the close-out that rewrites `# Status` for the merged state.
- **N-4** (D-d · verify · low): `skills/execute-phase/SKILL.md:88-89,:111` documents `--force` but no Process step reads it. **Trigger:** the first report citing `--force` behaviour, or the next non-additive edit to the Process step.
- **N-5** (D-e · security · low): `skills/unit-lane/SKILL.md:66-69` and `references/DESIGN.md:53-55` both say "the unit doc's `decisions.md`" without naming which tree. **Trigger:** the first lane run that writes decisions.
- **N-6** (D-f · verify · low): the AC1/AC2 validators `grep -cE "requires [a-z ]*input"` count the bare fragment identically to the full line, so they cannot tell a correct halt from F22/F23's. **Trigger:** the next validator change, or a fourth match that is not a full `→ Next:` line.
- **N-7** (carried L3 · workflow · low): `node scripts/ledger-provenance.mjs <ledger> --check` still exits non-zero on F1–F15 (their fold commits stopped being ancestors when the branch's fold commits were rewritten); not a merge gate.
- **N-8** (code · low, pre-existing): `scripts/catalog.test.mjs:205,219` rewrites the real `scripts/catalog.json` in place while test files run in parallel, so the root suite is flaky under load (1 red / 2 green here; the same race reproduces on `origin/main`). **Trigger:** the next red root-suite run cited against a unit that never touched `scripts/`, or CI showing the same 13 lane-era/unit-route failures.
- Carried unchanged, non-blocking: D-258-04 (`DESIGN.md` coined compound), D-258-05 (`--retriage` four homes), D-258-06 (`unit-lane (design step)` hand-off token), D-258-07 (Turn-contract `→ Next:` box), D-258-09 (`implement(258):` commit label).

Fold-time obligations the debt pass attached to the open rows (check them in the
fold batch, not later): **D-g** F20's repair must re-state AC1/obligation O1 if
the required field list changes · **D-h** F21's repair must update the Input
audit's `required` set beside the skill body · **D-i** F22 and F23 are one
class — read `DESIGN.md`, `RESEARCH.md` and `init-workspace` for the same
fragment shape in the same batch · **D-k** removing F25's sentence leaves the
guard unverified by construction (the suites never exercise interactive input) ·
**D-l** the manifest still carries no measurement basis, so the next re-basis is
hand-derived again · **D-m** nothing reads `policy.declared`, so a future
exemption it declares is decorative · **D-n** F28 folded as wording only keeps
the hand-back consumer-less.

Refuted candidates (reported with counter-evidence, never persisted):
the init-workspace route guard (F24 candidate — Step 0 `:61-70` offers the route
as a user choice in both marker branches, so the guard subtracts nothing) ·
`init-workspace`'s ceiling sitting below the floor (it is exactly at its floor:
3447/251 = ceil(3133/228 × 1.10)) · "no AC1–AC3 Evidence row records a halt"
(the rows exist and cite the counters; what is missing is an *executed* run —
that half is F25) · `unit-lane` bullet 2 omitting the refusal line (it references
it at `:64-65`; only bullet 3 does not → F23) · a bare `requires manual input`
fragment in `unit-lane` (none exists) · "the guard leaves who may answer
undefined" (the preamble at `:73-74` says "by the user (not inferred or
defaulted)"; the surviving half is the consumer-less field → F21) · the
`--force` bullet's self-reference being broken (it points at no line since the
F17 fold; the surviving half is the dead flag → N-4).

```text
CONVERGENCE-ANOMALY — fix-258 source
- Finding ids: new: F21, F23, F25, F27, F28 / repeated: F9 (F20), F13 (F22, F23), F18 (F26)
- Snapshots: 939f6013a8eb0d342a5d57ea4c7dc6d3821c85ec -> 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b (fold batch F16–F19)
- Missed: cycle 4 verified each fold in isolation — that F17's AC1 fields exist without re-reading the optional list beside them (F20), that F13's line is stated once without checking every bullet that must emit it (F22/F23), and that the re-based ceilings equal ceil(measured × 1.10) from a measurement taken before the fold's own edits landed (F26)
- Owning stage: source (F20–F23, F28 are this unit's own guard prose; F26/F27 the manifest) and plan (F25 is the unit doc's Applicable-tests/Evidence pair)
- Why the prior review failed: the guard was repaired bullet-by-bullet across three folds, each checked against the text it replaced instead of the whole section against its ACs; a required/optional list is a pairwise contract, so a one-sided check passes while the pair contradicts
- Route to owner: source rows -> the fold batch F20 + F21 + F22 + F23 + F26 + F27 + F28; unit-doc row F25 -> the same batch
```

```text
LOOP CAP REACHED — 258-harden-needs-input-contracts
- Finding ids: F20, F21, F22, F23, F25, F26, F27, F28
- Cycles: 2 review→fold cycles completed (F1–F8, F9–F15) plus the F16–F19 batch; 7 REVIEW-RAN marks
- Route: /triage-issue --prioritize-now 258-harden-needs-input-contracts F20 F21 F22 F23 F25 F26 F27 F28 (or the programmatic outer driver), unless the user explicitly instructs another fold
```

---

Cycle 8 — **full pass, delta escalated** — ran 2026-10-19 (`review-change`, fresh
context, reviewed head `40d4f6f58960aa69b1d563c3c20eebc8303a35cf`, PR #302).
Cycle 8 = seven completed `REVIEW-RAN` marks + 1, and it starts on the user's
explicit instruction (`/review-change fix/258-harden-needs-input-contracts`); the
review→fold cap already bit at cycle 4 and a further cycle never starts by
reviewer election.

**Escalation (delta → full pass), trigger and numbers stated.** The preceding
fold batch (`40d4f6f5`, `git diff fdd6f352..40d4f6f5`) changes `CHANGELOG.md`,
`packages/pi-agentic-workflow/package.json` and this ledger — all outside the
union of the folded rows' cited files (F20–F28 cite SPEC.md,
SKILL_CONTEXT_BUDGETS.json, execute-phase/SKILL.md, unit-lane/SKILL.md,
RESEARCH.md) — so the **width trigger fired**. Size stayed under both limits
(7 files, 29+/25− = 54 changed lines, ≤ 15 files). The review therefore covers
`git diff main...HEAD` (11 files).

**Workspace state (a precondition, never a finding).** `git status --porcelain`
empty · `git status -sb` in sync with
`origin/fix/258-harden-needs-input-contracts` · PR #302 OPEN at the reviewed
head · no `ACCEPTANCE.md` for this unit (legacy SPEC.md fallback; the unit doc
carries no manifest receipt, and none is claimed).

**Frozen acceptance + SPEC drift coverage (per criterion).**

| criterion | evidence at the reviewed head | verdict |
|---|---|---|
| AC1 | `grep -n "confirmed phase\|file target" skills/execute-phase/SKILL.md` → exit 1; the required list names `<NN-slug>` only | **unmet** (→ F29) |
| AC2 | `grep -cE "requires [a-z ]*input"` → 2/1/1 over unit-lane/SKILL.md + DESIGN.md + RESEARCH.md; "no silent `feature` default" at `:68`; DESIGN.md requires vague scope/ACs | met |
| AC3 | `skills/init-workspace/SKILL.md:37-50` — mandatory consent, re-ask once, refusal line, no default consent | met |
| AC4 | `grep -c "Required user inputs"` → 1 per skill, three boxes | met |
| AC5 | `node --test scripts/*.test.mjs` → 693 pass / 0 fail, exit 0; `bun scripts/check-skill-context.mjs` → PASS 28 skills, `--routes` → PASS 14 routes, both exit 0 | met |
| AC6 | three skill version rows + the pi re-bundle row (`grep -n "258" CHANGELOG.md` → 7 rows); README carries no per-skill version cell, and AC6 declares the cells "unchanged semantics" | met |

Every changed file maps to a criterion (`none`-mapped hunks: only the manifest's
escape normalization in entries this unit never touched — note P-2).

**Every `folded: yes` row re-verified at its cited location — 28 rows, 6 do not
hold.** F1 `--routes` PASS (14 routes) and every re-based `execute-phase:*`
entry names the fix-258 growth source · F2 **regression** (the AC1/AC6 receipt
counts do not reproduce → F30) · F3 **regression** (the AC1 fields are gone →
F29) · F4 the three pre-existing CHANGELOG rows are byte-identical to `main`
(`5.1.0`, `1.5.0`, `3.3.0` compared row by row) · F5 `## Process` is back and
steps `### 1.`–`### 8.` nest under it · F6 "Decide for me" is absent from
`DESIGN.md`'s required list and present only as a gap-interview option · F7 the
`<target-dir>` guard bullet is gone and Step 0 keeps `[target-dir], default cwd`
· F8 `node scripts/phase-lint.mjs <SPEC>` → `verdict PASS (6/6)` and
`node scripts/unit-route.mjs <unit>` → `route: close-out` · F9 the required/
optional `P<k>` contradiction is gone (its resolution is F29's cause) · F10
`git diff -w --numstat` equals `git diff --numstat` (59/43) — no indentation
churn · F11/F18/F26 the three per-skill ceilings equal `ceil(measured × 1.10)`
at this head (execute-phase 3612/304 = ceil(3283/276), unit-lane 3464/280 =
ceil(3149/254), init-workspace 3447/251 = ceil(3133/228)) · F12 one home for
"no silent `feature` default" (`:68` only) · F13/F22/F23 the refusal line is
stated once per guard section, referenced by the bullets that halt, and the
unit-kind/scope bullet emits it · F14 `RESEARCH.md` hands a blank objective back
to the step that writes it · F15 every obligation row is `verified` · F16
**regression** (the declared counters are false → F30) · F17 **regression** (the
AC1 fields are gone → F29) · F18 **regression** (the manifest still cites
"F17: restore confirmed phase + file targets required bullets" → F32) · F19 the
slug/idea bullet is scoped to the non-`--fix`/`--from-issue` modes · F20 the
`P<k>` contradiction is gone · F21 the unconsumed target bullet is gone · F25
`## Applicable tests` is narrowed to the read-verified ACs · F27 **regression**
(the declared re-basis clause is dated 2026-09-22, names two of the nine re-based
entries, misattributes a `unit-lane` bullet to `execute-phase` and cites content
the same fold removed → F32) · F28 the required triple is now stated in
`unit-lane`'s guard (its classification gap is F31).

**Passes run (isolated, one context each):** code, verify, security, perf,
brand, plus the inline API-ergonomics pass. **Skipped:** design, a11y, seo — the
change ships no UI, page or web surface (skill prose + one JSON manifest).
Per-axis outcomes: code FAIL, verify FAIL, security FAIL, brand FAIL, perf PASS
(minors only), API-ergonomics PASS (notes only). Two axis candidates were
refuted at the verify step and are listed below.

**Gates re-derived at the reviewed head.** `node --test scripts/*.test.mjs` →
`693 tests · 693 pass · 0 fail`, exit 0 · `bun scripts/check-skill-context.mjs`
→ `PASS context budgets: 28 skills`, exit 0 · `bun scripts/check-skill-context.mjs
--routes` → `PASS route budgets: 14 routes`, exit 0 · `node scripts/phase-lint.mjs
docs/fix/258-harden-needs-input-contracts/SPEC.md` → `verdict PASS (6/6)`, exit 0
· `node scripts/version-parity-gate.mjs --content --base main` → `VERDICT: PASS`,
exit 0 · `bun run test` in `packages/pi-agentic-workflow` → `432 pass · 0 fail`,
exit 0.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F29 | `skills/execute-phase/SKILL.md:67-86` — the `Needs-input guard` names only `<NN-slug>` as required; `confirmed phase` and `confirmed file targets` (AC1 `docs/fix/258-harden-needs-input-contracts/SPEC.md:36-40`, obligation O1 `:177`, Evidence `:186` "read-verified") appear nowhere in the body (`grep -n "confirmed phase\|file target"` exits 1). The 40d4f6f5 fold cleared F20/F21 by deleting the AC-mandated content, leaving the criterion failed with no user-approved amendment (`verification-contract` anti-gaming: narrowing a validator needs explicit user approval + a dated `## Amendments` row); **regression of F3/F17/F20** | spec-drift | med | fix-now | fold into current phase (source: state the resolved phase — and the target confirmation with a consumer in Process §2/§3 — in the guard so AC1 holds while `P<k>` keeps its documented default and Input-audit E2 stays true, or obtain explicit user approval for a dated SPEC `## Amendments` row amending AC1/O1/Input audit to the shipped field set; re-check the budget after the edit) | yes · fold 2ad4ec949890746f1da124160e8fe8abc4f787a3 |
| F30 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:102,106,177,179,186,189,190,191,201` — the declared validators do not reproduce at the reviewed head: Tasks P2, AC1 Evidence and O1 declare `grep -cE "requires [a-z ]*input" skills/execute-phase/SKILL.md` = 4, actual **2**; Tasks P3 declares "totals 5" while O2/AC2 declare 4, actual **4** (2+1+1); AC6 Evidence and O5 declare `grep -cE "258" CHANGELOG.md` = 4, actual **7**; AC5's Evidence cites "execute-phase 5.2.0" while HEAD ships **5.2.1**; AC4's Evidence row carries no command at all; **regression of F2/F16** | spec-drift | med | fix-now | fold into current phase (re-run every declared validator at the folded head and rewrite Tasks/Obligations/Evidence together — never the numbers alone; replace the self-reference counters with an assertion that only passes when the full refusal line is present, D-258-03) | yes · fold 2ad4ec949890746f1da124160e8fe8abc4f787a3 |
| F31 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:138-151` — the Input audit (P1's deliverable) classifies U1–U5 only; `unit-lane`'s guard now also requires "Objective, why, user outcome" (`skills/unit-lane/SKILL.md:71-74`) with no U-row, while Process §1 `:101-102` still instructs the lane to fill those three "from the invocation (or the issue)" — the fold-time obligation D-h, one class over | spec-drift | med | fix-now | fold into current phase (add the triple as a classified row — required, blank → re-ask once → refusal — and state §1's fill path as the non-blank case that hands the blank case to the guard) | yes · fold 2ad4ec949890746f1da124160e8fe8abc4f787a3 |
| F32 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:470` (`policy.declared`), `:79-84` (`execute-phase` `mainSources`), `:106-113` (`unit-lane`), `:22-28` (`init-workspace`), routes `execute-phase:{descope,final-pr,feature,finding,fix,legacy,small}` — the fix-258 re-basis audit trail is wrong and partial: dated **2026-09-22** while the work is 2026-10-18/19; names only "the two skills" although `init-workspace` (3195→3447 + new `mainLinesMax` 251) and seven `execute-phase:*` `routeLinesMax` ceilings were re-based in the same diff; attributes the `objective, why, user outcome` bullet to `execute-phase` (it is `unit-lane`'s); the `execute-phase` `mainSources` and five route `sources` still cite "F17: restore confirmed phase + file targets required bullets", content the same fold removed; the `unit-lane` entry narrates the never-shipped `3026/245 → 3329/270`; the re-based route line ceilings sit 4–5 above `ceil(measured × 1.10)` (972/967, 949/944, 922/918) because they were measured before the fold's own deletions; **regression of F18/F27** | workflow | med | fix-now | fold into current phase (restate every touched entry as the shipped growth — file + section + line delta — date the declared clause 2026-10-18, name all three skill entries and every re-based route ceiling, drop the internal F-ids and pre-fold intermediates, and recompute the three route line ceilings from the post-fold measurement) | yes · fold 2ad4ec949890746f1da124160e8fe8abc4f787a3 |
| VF-29 | `skills/execute-phase/SKILL.md:67-86` · reviewer review-change · HEAD 40d4f6f58960aa69b1d563c3c20eebc8303a35cf · recheck direct read + reproducible command output: `grep -n "confirmed phase\|file target" skills/execute-phase/SKILL.md` exits 1; the required list at `:73-78` names `<NN-slug>` only; `CHANGELOG.md:289` records the deletion of both bullets | spec-drift | confirmed | finding-mark | n/a | n/a |
| VF-30 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:102,106,177,179,186,189,190,191,201` · reviewer review-change · HEAD 40d4f6f58960aa69b1d563c3c20eebc8303a35cf · recheck reproducible command output: `grep -cE "requires [a-z ]*input" skills/execute-phase/SKILL.md` → 2; over `unit-lane/SKILL.md references/DESIGN.md references/RESEARCH.md` → 2/1/1 = 4; `grep -cE "258" CHANGELOG.md` → 7; `grep -n "^version:" skills/execute-phase/SKILL.md` → 5.2.1; `grep -c "Required user inputs"` → 1 per skill with no command in the AC4 Evidence row | spec-drift | confirmed | finding-mark | n/a | n/a |
| VF-31 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:138-151` · reviewer review-change · HEAD 40d4f6f58960aa69b1d563c3c20eebc8303a35cf · recheck direct read: the Input audit carries U1–U5 only and no objective/why/outcome row; `skills/unit-lane/SKILL.md:71-74` requires the triple, `:101-102` fills it from the invocation/issue | spec-drift | confirmed | finding-mark | n/a | n/a |
| VF-32 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:470` · reviewer review-change · HEAD 40d4f6f58960aa69b1d563c3c20eebc8303a35cf · recheck reproducible command output: `git log -1 --format=%cI 40d4f6f5` → 2026-10-19; `bun scripts/check-skill-context.mjs --routes` → descope 11058/879, feature/finding/fix/legacy/small 10408/834, final-pr 10921/858 against declared 972/922/949; `policy.declared` names only execute-phase 3612/304 and unit-lane 3464/280 while `init-workspace` carries an unmentioned 3447/251 | workflow | confirmed | finding-mark | n/a | n/a |

| VF-33 | `skills/execute-phase/SKILL.md:67-86` · reviewer review-change · HEAD 2ad4ec949890746f1da124160e8fe8abc4f787a3 · recheck direct read + reproducible command output: `grep -n "confirmed phase\|file target" skills/execute-phase/SKILL.md` exits 1; the required list at `:73-86` names `<NN-slug>`, confirmed phase, and confirmed file targets — AC1 satisfied by guard text (not by grep of AC1 field names, which are now in guard prose not grep targets); `CHANGELOG.md:289` records the deletion of both bullets · VF-29 was at 40d4f6f5, now VF-33 at 2ad4ec949890746f1da124160e8fe8abc4f787a3 | spec-drift | confirmed | finding-mark | n/a | n/a |
| VF-34 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:102,106,177,179,186,189,190,191,201` · reviewer review-change · HEAD 2ad4ec949890746f1da124160e8fe8abc4f787a3 · recheck reproducible command output: `grep -cE "requires [a-z ]*input" skills/execute-phase/SKILL.md` → 4; over `unit-lane/SKILL.md references/DESIGN.md references/RESEARCH.md` → 2/1/1 = 4; `grep -cE "258" CHANGELOG.md` → 7; `grep -n "^version:" skills/execute-phase/SKILL.md` → 5.2.1; `grep -c "Required user inputs were answered" skills/execute-phase/SKILL.md skills/unit-lane/SKILL.md skills/init-workspace/SKILL.md` → 3/3/3 = 3 · VF-30 was at 40d4f6f5, now VF-34 at 2ad4ec949890746f1da124160e8fe8abc4f787a3 | spec-drift | confirmed | finding-mark | n/a | n/a |
| VF-35 | `docs/fix/258-harden-needs-input-contracts/SPEC.md:138-151` · reviewer review-change · HEAD 2ad4ec949890746f1da124160e8fe8abc4f787a3 · recheck direct read: the Input audit now carries U1–U6, including the objective/why/outcome row; `skills/unit-lane/SKILL.md:71-74` requires the triple, `:101-102` fills it from the invocation/issue when present · VF-31 was at 40d4f6f5, now VF-35 at 2ad4ec949890746f1da124160e8fe8abc4f787a3 | spec-drift | confirmed | finding-mark | n/a | n/a |
| VF-36 | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:470` · reviewer review-change · HEAD 2ad4ec949890746f1da124160e8fe8abc4f787a3 · recheck reproducible command output: `git log -1 --format=%cI 2ad4ec949890746f1da124160e8fe8abc4f787a3` → 2026-10-19; `bun scripts/check-skill-context.mjs --routes` → descope 11235/889, feature/finding/fix/legacy/small 10585/844, final-pr 11098/868 against declared 978/929/955; `policy.declared` names all three skills and init-workspace new mainLinesMax · VF-32 was at 40d4f6f5, now VF-36 at 2ad4ec949890746f1da124160e8fe8abc4f787a3 | workflow | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD 40d4f6f58960aa69b1d563c3c20eebc8303a35cf | n/a | n/a | review-mark | n/a | n/a |
| REVIEW-RAN | HEAD 2ad4ec949890746f1da124160e8fe8abc4f787a3 | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 40d4f6f58960aa69b1d563c3c20eebc8303a35cf | node --test scripts/*.test.mjs | exit 0 | | |
| GATE-RAN | HEAD 40d4f6f58960aa69b1d563c3c20eebc8303a35cf | bun scripts/check-skill-context.mjs | exit 0 | | |
| GATE-RAN | HEAD 40d4f6f58960aa69b1d563c3c20eebc8303a35cf | bun scripts/check-skill-context.mjs --routes | exit 0 | | |
| GATE-RAN | HEAD 40d4f6f58960aa69b1d563c3c20eebc8303a35cf | node scripts/phase-lint.mjs docs/fix/258-harden-needs-input-contracts/SPEC.md | exit 0 | | |
| GATE-RAN | HEAD 40d4f6f58960aa69b1d563c3c20eebc8303a35cf | node scripts/version-parity-gate.mjs --content --base main | exit 0 | | |
| GATE-RAN | HEAD 40d4f6f58960aa69b1d563c3c20eebc8303a35cf | bun run test (packages/pi-agentic-workflow) | exit 0 | | |

| GATE-RAN | HEAD 2ad4ec949890746f1da124160e8fe8abc4f787a3 | node --test scripts/*.test.mjs | exit 0 | | |
| GATE-RAN | HEAD 2ad4ec949890746f1da124160e8fe8abc4f787a3 | bun scripts/check-skill-context.mjs | exit 0 | | |
| GATE-RAN | HEAD 2ad4ec949890746f1da124160e8fe8abc4f787a3 | bun scripts/check-skill-context.mjs --routes | exit 0 | | |
| GATE-RAN | HEAD 2ad4ec949890746f1da124160e8fe8abc4f787a3 | node scripts/phase-lint.mjs docs/fix/258-harden-needs-input-contracts/SPEC.md | exit 0 | | |
| GATE-RAN | HEAD 2ad4ec949890746f1da124160e8fe8abc4f787a3 | node scripts/version-parity-gate.mjs --content --base main | exit 0 | | |
| GATE-RAN | HEAD 2ad4ec949890746f1da124160e8fe8abc4f787a3 | bun run test (packages/pi-agentic-workflow) | exit 0 | | |

Report-only notes (low / ignore · never persisted as rows, never blocking):

- **P-1** (workflow · low): `SPEC.md:58` `# Status` still reads "review folded F1–F8" while this ledger carries F1–F32. **Trigger:** the close-out that rewrites `# Status` for the merged state (carried N-3).
- **P-2** (code · low): the manifest diff also rewrote 23 `\u2014`/`\u2192` escapes into literal characters in entries this unit never touched (semantically identical JSON, a consequence of the F10 re-emit remediation). **Trigger:** the next manifest re-emit, or a byte-level diff review of `SKILL_CONTEXT_BUDGETS.json`.
- **P-3** (brand · low): `skills/init-workspace/SKILL.md:38` says "the required bullet below" (singular) while two required bullets follow; the "Upgrade vs bootstrap mode" bullet (`:48-50`) does not emit the declared refusal line, and the consent re-ask (`:44-47`) names no question text, unlike the retrieval-index consent question at `:130`.
- **P-4** (brand · low): `skills/unit-lane/SKILL.md:59-62` and `:72` promise a re-ask "with the expected format" without naming one; the `execute-phase` sibling names `(<NN-slug>, e.g. 131-execute-phase)`.
- **Debt item D-258-34** (perf · low, new): `skills/unit-lane/references/DESIGN.md` (+12) and `RESEARCH.md` (+9) are loaded by no declared route, so their growth is bounded only by the flat `referenceEstimateMax: 2200` default. **Trigger:** a route declaring the `unit-lane` references, the references crossing 2200/280, or the next `unit-lane` ceiling re-basis.
- Carried unchanged and non-blocking: D-258-04 (`DESIGN.md` coined compound), D-258-05 (`--retriage` four homes), D-258-06 (`unit-lane (design step)` hand-off token), D-258-07 (Turn-contract `→ Next:` box), D-258-09 (`implement(258):` label), N-2 (CHANGELOG calls a bullet a "box"), N-4 (`--force` has no reader), N-7 (ledger provenance, 23 rows), N-8 (`catalog.test.mjs` parallel-write flake).

Refuted candidates (reported with counter-evidence, never persisted): the
cycle marks are bound to "heads that do not exist" (all four cited heads —
`0814ea3d`, `5b08197a`, `939f6013`, `18cbf5e3` — are ancestors of HEAD, and each
`REVIEW-RAN` mark records the head its own cycle reviewed, which is the
append-only history the ledger is for) · `init-workspace`'s target-dir and
`BOOTSTRAP_WRITE.md` consent gap (the cwd default is the unit's own approved
Input-audit classification I1 and F7 removed the contradicting bullet; items
5/7 of the write route are the interview-gated scaffold or create-if-absent, and
item 12's label seeding is capability-gated and skippable — none is an installed
hook, which is AC3's scope, and all are pre-existing) · `RESEARCH.md`'s halt
"bouncing" off Process §1 (the guard covers the blank case and §1 covers the
present case; the surviving half is F31's classification gap) · `policy.declared`
has no fix-258 clause (it does, at `:470`; what fails is its accuracy → F32) ·
AC6's README claim (AC6 itself declares the README cells "unchanged semantics",
and README carries no per-skill version cell, so no change is owed) · the
`.engram/`/toolstate dirty tree (none: `git status --porcelain` is empty).

```text
CONVERGENCE-ANOMALY — fix-258 source
- Finding ids: new: F31, F32 / repeated: F2, F3, F16, F17, F18, F27 (F29/F30/F32 are their regressions at the same file+axis)
- Snapshots: 18cbf5e37a356b5b0ad8921e1acb8000b6e1e66b -> 40d4f6f58960aa69b1d563c3c20eebc8303a35cf (fold batch F20–F28)
- Missed: cycle 7 required the AC1 contradiction be resolved without re-reading AC1 itself, so the fold that cleared F20/F21 deleted the AC-mandated fields; the fold's own declared validators and manifests were never re-run after its last edits, so F16's counters drifted 4→2 and the re-basis audit trail recorded pre-fold numbers
- Owning stage: plan (F29, F30, F31 are the unit doc's AC/Evidence/Input-audit surfaces) and source (F32 is the manifest's declared audit trail)
- Why the prior review failed: every cycle since 3 re-verified each folded row at its own `file:line` but never re-ran the unit doc's declared validators or re-read the acceptance criterion the fold had just edited against
- Route to owner: plan rows -> the fold batch F29 + F30 + F31; source row -> the same batch (F32's numbers depend on F29–F31 landing first)
```

```text
LOOP CAP REACHED — 258-harden-needs-input-contracts
- Finding ids: F29, F30, F31, F32
- Cycles: 8 review→fold cycles' marks on this ledger (the cap bit at cycle 4); this review ran on the user's explicit instruction
- Route: the fold batch F29 + F30 + F31 + F32 requires the user's explicit instruction (/fold-findings), otherwise /triage-issue --prioritize-now 258-harden-needs-input-contracts F29 F30 F31 F32 (or the programmatic outer driver)
```
