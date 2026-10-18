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

