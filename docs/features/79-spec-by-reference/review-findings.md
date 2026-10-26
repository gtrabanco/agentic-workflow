# review-findings — 79-spec-by-reference

Cycle 1 fold ledger: `review-change` over `git diff main...HEAD` at the reviewed
head `5c81b2404930f5f43507f12ce5039ea02918cd1d` (PR
[#311](https://github.com/gtrabanco/agentic-workflow/pull/311)). Four applicable
pack axes ran (`review-code`, `review-security`, `review-verify`, `review-perf`);
the prior lane verdict's 22 candidates were re-derived against this head — 19
confirmed, 3 refuted — and two new findings came from the packs. Every row below
carries its `VF-` verification mark with the recheck method that confirmed it.

## Findings

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | scripts/phase-lint.mjs:781 | code | med | fix-now | fold: the re-cut shape's comment claims all-or-nothing but only `Log`-without-`Specs` is checked — a `Specs`-without-`Log` doc lints `PASS` while `unit-route --triage` refuses it (`missing mandatory sections: … Log`); add the symmetric branch and the both-directions case to `scripts/phase-lint.test.mjs` | yes |
| F2 | skills/fold-findings/SKILL.md:60 | workflow | med | fix-now | fold: the fold queue's schema is single-shape — probe-first is stated at `:53-56`, then `:60` mandates the legacy seven-column row with `folded: no → yes`, while the shipped `findings-table@1` has six columns, no `folded` cell and a closed `folded: no → yes` target that does not exist in the carrier; make the queue shape-aware (a migrated row is open by definition, closed by its `F` `## Log` line) | yes |
| F3 | skills/review-change/references/PERSIST_AND_DECIDE.md:18 | workflow | med | fix-now | fold: persist step 11 states the probe-first carrier correctly and then publishes one fixed seven-column block that takes priority over the sentence — `class` values, the `folded` cell and the `folded: no → yes` flip all belong to the legacy shape only; state the carrier's own grammar per shape | yes |
| F4 | skills/triage-issue/references/FOLD_LEDGER.md:4 | workflow | med | fix-now | fold: `triage-issue`'s loaded references still order an unconditional `review-findings.md` append (`FOLD_LEDGER.md:4`, `ISSUE_PROCESS.md:25`, `REVIEW_FINDING_PROCESS.md:6-8`) while `SKILL.md:52` says probe the doc first, never both — on a migrated unit the write lands in a side file every reader ignores; state the rule in all four | yes |
| F5 | scripts/workflow-status.mjs:639 | code | high | fix-now | fold: `readReviewMark` opens only `review-findings.md` and looks for a `REVIEW-RAN` table row, `log-kind@1` publishes no mark token, and `LOG_LINE` cannot parse one — so AC4's "`REVIEW-RAN` … become `## Log` lines" does not ship: a migrated unit with a current mark reports `review_pending: true` forever; probe the doc's `## Log`, publish the mark token in `log-kind@1`, and close `LEDGERS.md:177-182`'s contradictory prose in the same fold | yes |
| F6 | docs/features/_TEMPLATE/SPEC.md:123 | workflow | high | fix-now | fold: `findings-table@1` publishes `class` as `product` / `plan` / `source` / `environment` / `runtime` (the owner of the repair) while `routeOfRow` (`scripts/unit-route.mjs:192-200`) classifies off `class` as if it were the legacy disposition vocabulary (`fix-now` / `replan-in-unit` / `decision-required`) — `PLAN_ROUTE` and `DECISION_ROUTE` are tested against a column that now holds the repairing owner rather than the routing disposition, so the two vocabularies collide and a `class: source` row routes to fold with no fix-now signal at all; state one vocabulary per column and pin it | yes |
| F7 | docs/features/79-spec-by-reference/SPEC.md:373 | workflow | med | fix-now | fold: AC7 (`:45-49`) and obligation O2 (`planning-obligations.md:12`) both require the owner acceptance to be a `decision` row in `decisions.md` before any workflow doc is re-cut; `decisions.md` carries only `Q1`–`Q3`/`D1`–`D3`/`A1`–`A5` — the acceptance lives in the Evidence row and the Progress log's `D4` paragraph (the machine reason is disclosed at `SPEC.md:450`) — record `D4` as a `decision` row with that reason or re-cut AC7/O2 to the carrier actually used | yes |
| F8 | docs/features/79-spec-by-reference/decisions.md:49 | workflow | med | fix-now | fold: the `path-protection-records@1` block's `justification` rows promise that `scripts/ledger-ownership.test.mjs`, `scripts/ledger-provenance.test.mjs` and `scripts/workflow-status-sensor.test.mjs` "gain cases" — the diff touches only `scripts/review-loop-discipline.test.mjs` of the four suites named at `:57,59`, so three receipts attest work the commit does not carry; re-cut the rows to the suite that changed | yes |
| F9 | packages/agentic-workflow-schema/package.json:3 | package | high | fix-now | fold: `src/pre-execution.ts` (+69/−3) and `src/index.ts` (+5) publish four new exports (`UNIT_DOC_SPEC_REF_SECTIONS`, `UNIT_DOC_SECTION_SHAPES`, `UnitDocShape`, `resolveUnitDocShape`, `unitDocSectionsFor`) while the package stays `4.7.0` with no companion row — the schema package is not in `version-parity-gate`'s trigger set (`AGENTS.md` §Packages closes the gate over `skills/**` + `packages/pi-agentic-workflow/**`, `scripts/version-parity-gate.mjs:51-55`), so the gate is green while this rule is broken; bump (a new additive surface is a minor) and add the CHANGELOG row | yes |
| F10 | docs/features/79-spec-by-reference/planning-obligations.md:11 | workflow | high | fix-now | fold: all ten obligation rows still read `planned`, so `node scripts/unit-lineage.mjs --unit 79-spec-by-reference` exits 1 with `LINEAGE BLOCKED — open obligation rows: O1 … O10` — the merge gate is red at this head although the Evidence table and Progress log record P7 verification complete; flip each row to `verified` citing the now-reproduced Evidence row and re-run the twice-cited command | yes |
| F11 | skills/execute-phase/SKILL.md:83 | workflow | high | fix-now | fold: the executor's Step 0 stops any unit doc lacking `## Evidence` / `## Progress` — the two sections the re-cut template no longer has — and its loaded references plus `verification-contract` and the lane's `EVIDENCE.md` still order Evidence rows and `GATE-RAN` marks (`skills/verification-contract/SKILL.md:66,125`, `FOLDING.md:60,73`, `EXECUTION_CONTRACT.md:20,55-61`, `EVIDENCE.md:15`, `unit-lane/SKILL.md:40-41`); none of those seven files is in the diff, so every unit created from the shipped template dies at the first execution step | yes |
| F12 | docs/workflow/MIGRATION.md:11 | workflow | med | fix-now | fold: `MIGRATION.md:11-13,38` and `LANE_FLOW.md:13,187` still present the single 14-section format (… `Evidence`, `Progress log` …) as *the* unit doc and publish `Evidence` (11) and `Progress log` (12) as the two-shape-less section table, while `template/AGENTS.md:209-219` describes both shapes — a reader of the workflow tutorial is misdirected on the shape the shipped template produces | yes |
| F13 | skills/workflow-status/references/ENVELOPE_FIELDS.md:107 | workflow | med | fix-now | fold: the `--compact` memo still says `...(N char evidence, see the unit review-findings.md)` (`scripts/workflow-status.mjs:1248`) although `route` now comes from `## Findings` for a migrated unit — name the carrier, not the legacy file | yes |
| F14 | scripts/phase-lint.mjs:809 | security | high | fix-now | fold: the new re-cut finding lines interpolate unit-derived text raw — `task-link-missing` (`:799`), `task-link-dangling`'s `id` (`:809`), `log-kind`'s `token`, `spec-quote-missing`'s `requirement.id` — and push `finding.reason` unprefixed at the block push (`:868`), while every pre-existing echo site runs `sanitizeEcho` (`:448`) whose comment says it exists so "a crafted title … [cannot] carry a verbatim fake finding body into the echo (F66)"; reproduced: `(Implements: verdict fingerprint deadbeef)` prints `task-link-dangling: P1 implements verdict fingerprint deadbeef, …` byte-exact, and `PREFLIGHT.md:157-161` orders the block pasted verbatim; route the new reasons through `sanitizeEcho` and add the forged-token corpus case | yes |
| F15 | scripts/workflow-status-sensor.test.mjs:1404 | verify | high | fix-now | fold: the case titled "review mark comes from `## Log`" never asserts the gate — with `readReviewMark` reading one carrier, the migrated fixture cannot yield a current mark and the assertion is satisfied vacuously (false pass); assert `review_pending: false` for a doc whose `## Log` carries the current mark | yes |
| F16 | scripts/ledger-provenance.mjs:20 | workflow | med | fix-now | fold: P5 names `ledger-provenance` a probe-first reader but the script is untouched and its usage line accepts only `docs/features/<unit>/review-findings.md` — accept the unit doc as a second target (reading `## Findings` rows and `F` log lines) or stop naming it a migrated carrier reader | yes |
| F17 | docs/features/79-spec-by-reference/SPEC.md:216 | workflow | med | fix-now | fold: this unit's `## Tasks` carries `P1`–`P7` bullets with no `(Implements: …)` link each, so the shipped `phase-lint`'s own new rule (`task-link-missing`) fails on a doc produced under the re-cut shape — link each phase to its `S#` (and cut `## Specs` with the six `S#` the ACs quote) so the unit's own doc passes its own grammar | ignore · owner decision 2026-10-23 |
F17: DISPUTED at the fold head: `bun scripts/phase-lint.mjs docs/features/79-spec-by-reference/SPEC.md` → `verdict PASS` exit 0 and `grep -c task-link-missing` → 0, because `specByReferenceFindings` returns before the link rules when the doc declares no `## Specs` — this unit's doc is the legacy shape by `decisions.md` A3, so the rule is inert on it and the reported failure does not reproduce. Its remaining substance (link this doc's phases) is the *migration* A3 defers to the doc's next touch, not a defect at this head.
F17: RESOLVED — owner decision 2026-10-23 (SPEC Progress log; re-judged settled in review cycles 2 and 4): dismissed as reported and re-scoped — the rule is inert on this legacy-shape doc (`decisions.md` A3); the doc's own migration stays with A3's next-touch rule. Disposition `ignore` = decided, never routed (`scripts/unit-route.mjs` NOT_OPEN).
| F18 | docs/features/79-spec-by-reference/SPEC.md:78 | workflow | med | fix-now | fold: AC4's second clause ("`REVIEW-RAN` / `GATE-RAN` / `VF` marks become log lines carrying exit codes") is half-true at this head — `GATE-RAN`→`G` ships, `REVIEW-RAN`/`VF` do not (`F5`) — so the criterion as written is unmet; either deliver it with `F5` or narrow the criterion honestly in the same fold | yes |
| F19 | AGENTS.md:127 | workflow | med | fix-now | fold: the `normative-surfaces@1` block this PR edited licenses `S#` in `## Specs` (`:120-126`) and 25 lines later keeps the overbroad "never emit `S1`/`S2`/"Step N" into a `PLAN.md`, `TASKS.md`, `progress.md`, SPEC, or roadmap" — scope the ban to phase labels so a weak executor is not told to strip the requirement ids the re-cut template requires | yes |
| F20 | docs/features/79-spec-by-reference/SPEC.md:119 | workflow | med | fix-now | fold: `## Impact` still lists "open-row routing from `review-findings.md` at `:716`" and the 14-section reader set as the affected surfaces, while the change makes `## Findings` the carrier — amend the `## Impact` cells to the files this PR actually edited (a planning-surface claim that contradicts the shipped tree is the drift class AC15 exists to prevent) | ignore · owner decision 2026-10-23 |
F20: DISPUTED: `## Impact` states the surfaces the change touches — a pre-change map by contract (`What the change touches beyond its own files`) — and the same section's `What stops being true when it lands` bullet already names the carrier the change moves to. Line cites drifting after the edit is the section's normal shape; no sentence asserts a post-change fact the tree contradicts, and `node scripts/promise-coherence.mjs` → verdict PASS over 36 claims. The real stale-narration defect on those surfaces is F12 (the workflow docs) and F11 (the executor), both folded.
F20: RESOLVED — owner decision 2026-10-23 (SPEC Progress log; re-judged settled in review cycles 2 and 4): dismissed — `## Impact` is the pre-change surface map by its own contract and `promise-coherence` PASS covers the claims; the stale-narration substance was folded as F12 and F11. Disposition `ignore` = decided, never routed.
| F21 | docs/features/_TEMPLATE/SPEC.md:32 | code | med | fix-now | fold: the re-cut template's `## Impact` replaces the bullet list the `pre-execution-quality` pins read with a shape no validator exercised — the template lints `PASS` only because it carries no phases, and `docs/features/79-spec-by-reference/SPEC.md:119-131` shows the real `## Impact` prose form; pin the re-cut template's `## Impact` in `scripts/pre-execution-quality.test.mjs` so the next template edit cannot silently drop the cells a reader scrapes | yes |
| F22 | scripts/unit-doc-phases.mjs:205 | code | med | fix-now | fold: `LOG_KINDS` is a second copy of the `log-kind@1` vocabulary the templates publish, with no parity test — the `#305` second-copy class its own neighbours are pinned against; add the parity case (every token the `log-kind@1` block declares is in `LOG_KINDS`) | yes |
| F23 | packages/agentic-workflow-schema/src/pre-execution.ts:250 | docs | low | fix-now | fold: the new `UNIT_DOC_SPEC_REF_SECTIONS` doc-comment says "the two shapes differ in exactly three headings", but the two lists differ in five headings (three added, two replaced, two removed) — `UNIT_DOC_REQUIRED_SECTIONS` and `UNIT_DOC_SPEC_REF_SECTIONS` share seven; correct the sentence a consumer reads to accept the shape table | yes |
| F24 | docs/features/_TEMPLATE/SPEC.md:112 | workflow | med | fix-now | fold: `## Findings` in the template says "Rows are appended by `review-change` and `triage-issue`; no other writer touches them", but `ledger-ownership@1` (`LEDGERS.md:156-157`) names only `review-findings.md` — the collapsed carrier has no owner-map row, so the one-writer rule for `## Findings` is asserted in prose with no machine row behind it; add the migrated-carrier row to `ledger-ownership@1` and its validator | ignore · owner decision 2026-10-23 (D5) |
| F25 | scripts/spec-by-reference.test.mjs:1 | workflow | low | fix-now | fold: the new corpus suite is AC5's declared gate but is not named in `## Applicable tests` (`SPEC.md:180-188`) nor in the review's own root-suite list, so a future delete of the migration gate is caught by nothing that cites it — add it to `## Applicable tests` | yes |
| F26 | docs/features/79-spec-by-reference/SPEC.md:396 | workflow | med | fix-now | fold: the `## Next` pane recommends `/review-change` — the invocation this turn performed — and names ladder steps 2–4 as waiting behind the repair; re-cut it to this review's exit (the fold cycle over the open ids) so the pane is not a stale instruction the next reader follows | yes |
| VF-1 | scripts/phase-lint.mjs:781 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read + reproducer: a `/tmp` doc with `## Specs` and no `## Log` → `phase-lint` prints `verdict PASS` exit 0 while `UNIT_ROUTE_REPO=/tmp/… unit-route --triage` prints `TRIAGE ERROR — missing mandatory sections: … Log` | code | confirmed | finding-mark | n/a | n/a |
| VF-2 | skills/fold-findings/SKILL.md:60 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read: `:53-56` probe-first prose beside `:60`'s fixed seven-column row naming `folded`; `docs/features/_TEMPLATE/SPEC.md:119-131` publishes six columns and no `folded` cell | workflow | confirmed | finding-mark | n/a | n/a |
| VF-3 | skills/review-change/references/PERSIST_AND_DECIDE.md:14-18 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read of the paragraph and the single fixed block it publishes | workflow | confirmed | finding-mark | n/a | n/a |
| VF-4 | skills/triage-issue/references/FOLD_LEDGER.md:4 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read of the three references against `skills/triage-issue/SKILL.md:52` | workflow | confirmed | finding-mark | n/a | n/a |
| VF-5 | scripts/workflow-status.mjs:639-654 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read: `readReviewMark` opens only `review-findings.md`; `grep -n 'REVIEW-RAN' scripts/workflow-status.mjs` has no `## Log` branch; `log-kind@1` lists L/E/G/F/D/P only | code | confirmed | finding-mark | n/a | n/a |
| VF-6 | docs/features/_TEMPLATE/SPEC.md:124 vs scripts/unit-route.mjs:192-200 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read of both the published `class` vocabulary and `routeOfRow`'s regex table | workflow | confirmed | finding-mark | n/a | n/a |
| VF-7 | docs/features/79-spec-by-reference/SPEC.md:45-49 + planning-obligations.md:12 vs decisions.md · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read: `grep -c '^D' decisions.md` → 3 (`D1`–`D3`), no `D4` row; the `D4` acceptance is a Progress-log paragraph | workflow | confirmed | finding-mark | n/a | n/a |
| VF-8 | docs/features/79-spec-by-reference/decisions.md:49-59 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck `git diff --name-only main...HEAD -- scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs scripts/ledger-provenance.mjs scripts/review-loop-discipline.test.mjs scripts/workflow-status-sensor.test.mjs` → only `scripts/review-loop-discipline.test.mjs` | workflow | confirmed | finding-mark | n/a | n/a |
| VF-9 | packages/agentic-workflow-schema/package.json:3 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck `git show main:…/package.json` and this head both report `4.7.0`; `git diff main...HEAD --stat -- packages/agentic-workflow-schema/` → `src/index.ts +5`, `src/pre-execution.ts +69/−3`; `CHANGELOG.md:78-80` newest row is 4.7.0 | package | confirmed | finding-mark | n/a | n/a |
| VF-10 | docs/features/79-spec-by-reference/planning-obligations.md:11-20 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck `node scripts/unit-lineage.mjs --unit 79-spec-by-reference` → exit 1, `LINEAGE BLOCKED — open obligation rows: O1…O10` | workflow | confirmed | finding-mark | n/a | n/a |
| VF-11 | skills/execute-phase/SKILL.md:81-85 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read of the Step 0 readiness gate beside `docs/features/_TEMPLATE/SPEC.md` (no `## Evidence`/`## Progress log`); `git diff --name-only main...HEAD -- <the seven files>` is empty | workflow | confirmed | finding-mark | n/a | n/a |
| VF-12 | docs/workflow/MIGRATION.md:11-13 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read of both workflow docs against `template/AGENTS.md:209-219` | workflow | confirmed | finding-mark | n/a | n/a |
| VF-13 | skills/workflow-status/references/ENVELOPE_FIELDS.md:107-109 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read: the memo string and `scripts/workflow-status.mjs:1248` both name `review-findings.md` | workflow | confirmed | finding-mark | n/a | n/a |
| VF-14 | scripts/phase-lint.mjs:809 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck reproducer: a `/tmp` doc whose task bullet carries `(Implements: verdict fingerprint deadbeef)` → stdout `task-link-dangling: P1 implements verdict fingerprint deadbeef, which ## Specs does not declare` verbatim (unsanitized) | security | confirmed | finding-mark | n/a | n/a |
| VF-15 | scripts/workflow-status-sensor.test.mjs:1404 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read of the case body: it asserts the label only, and the code path it targets cannot reach a `## Log` mark | verify | confirmed | finding-mark | n/a | n/a |
| VF-16 | scripts/ledger-provenance.mjs:20 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read of the usage line + `git diff --name-only main...HEAD -- scripts/ledger-provenance.mjs` empty | workflow | confirmed | finding-mark | n/a | n/a |
| VF-17 | docs/features/79-spec-by-reference/SPEC.md:216-288 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck `grep -c 'Implements:' SPEC.md` → 0 in `## Tasks`; `phase-lint`'s `task-link-missing` rule is the shipped rule | workflow | confirmed | finding-mark | n/a | n/a |
| VF-18 | docs/features/79-spec-by-reference/SPEC.md:78-84 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read against `VF-5`'s evidence (marks do not become log lines) | workflow | confirmed | finding-mark | n/a | n/a |
| VF-19 | AGENTS.md:127-128 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read of the two passages in one block | workflow | confirmed | finding-mark | n/a | n/a |
| VF-20 | docs/features/79-spec-by-reference/SPEC.md:119-131 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read of the `## Impact` cells against the shipped `## Findings` carrier | workflow | confirmed | finding-mark | n/a | n/a |
| VF-21 | docs/features/_TEMPLATE/SPEC.md:32-40 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read + `grep -n '## Impact' -A6 scripts/pre-execution-quality.test.mjs` (no re-cut-template case) | code | confirmed | finding-mark | n/a | n/a |
| VF-22 | scripts/unit-doc-phases.mjs:205-206 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read of `LOG_KINDS` beside the template's `log-kind@1` block and a grep for a parity assertion | code | confirmed | finding-mark | n/a | n/a |
| VF-23 | packages/agentic-workflow-schema/src/pre-execution.ts:250-264 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read of the comment against both frozen lists | docs | confirmed | finding-mark | n/a | n/a |
| VF-24 | docs/features/_TEMPLATE/SPEC.md:112-120 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read against `LEDGERS.md:156-157`'s ownership rows (no migrated-carrier row) | workflow | confirmed | finding-mark | n/a | n/a |
| VF-25 | docs/features/79-spec-by-reference/SPEC.md:180-188 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read: `## Applicable tests` names 10 suites, `spec-by-reference.test.mjs` not among them though AC5 declares it | workflow | confirmed | finding-mark | n/a | n/a |
| VF-26 | docs/features/79-spec-by-reference/SPEC.md:396-406 · reviewer review-change · HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d · recheck direct read: the pane recommends the invocation this turn performed | workflow | confirmed | finding-mark | n/a | n/a |

## Marks

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d | node --test scripts/*.test.mjs | exit 0 | 814 tests · 814 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d | bun run build + bun run test (packages/agentic-workflow-schema) | exit 0 | 721 tests · 721 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD 5c81b2404930f5f43507f12ce5039ea02918cd1d | bun run test (packages/pi-agentic-workflow) | exit 0 | 432 tests · 432 pass · 0 fail | n/a | n/a |

## Cycle 1 fold outcomes (2026-10-23)

Folded (23 rows, five batches): F1+F14 `09950d83` · F6+F21+F22 `8802d89a` ·
F5+F8+F13+F15+F16+F18+F23+F24 `d885f693` · F2+F3+F4 `b5c7248b` ·
F7+F9+F10+F12+F19+F25+F26 (this commit).

Not folded — the fold's own evidence, stated so the next review re-judges rather than
re-guesses (no row's severity, class or route was edited):

- **F17 DISPUTED** — at the fold head `bun scripts/phase-lint.mjs
  docs/features/79-spec-by-reference/SPEC.md` answers `verdict PASS` (exit 0) with zero
  `task-link-missing` lines: `specByReferenceFindings` returns before the link rules when
  the document declares no `## Specs`, and this unit's doc is the legacy shape by
  `decisions.md` A3. The reported failure does not reproduce. What is true — that this
  doc is not yet migrated — is the migration A3 defers to the doc's next touch, not a
  defect at this head.
- **F20 DISPUTED** — `## Impact` is the *pre-change* surface map by its own contract
  ("What the change touches beyond its own files"), and the same section's "What stops
  being true when it lands" bullet names the carrier the change moves to;
  `node scripts/promise-coherence.mjs` → verdict PASS over 36 claims. Drifting line
  numbers are that section's normal shape. The stale-narration defect the row reached for
  is on other surfaces and was folded as F12 and F11.
- **F24 half-folded, half-decision** — the prose half landed in `d885f693` (both templates
  cite the `review-findings` truth class; `ledger-ownership.test.mjs` pins that one class
  owns both carriers). The machine half cannot land without amending a frozen contract:
  `ledger-ownership@1` keys one row per *file* pattern, AC16's seven truth classes are
  pinned closed, and re-using `SPEC.md` on a second row is refused as a duplicate ledger.
  The user decides between amending AC16's class set and accepting the citation pin.

Correction to cycle 1's own report, disclosed: **N8 was refuted and should not have
been.** Both shipped templates exited 1 on `spec-unlinked: S2` — they broke the
`(Implements: …)` rule they publish — and the review's refutation line quoted a run that
had not been made. The defect is folded as F21's root cause (both templates link both
example requirements; `unit-doc-contract.test.mjs` now lints them for real).

## Cycle 2 — delta re-review, escalated to a full pass (2026-10-25)

Delta mode per the fold receipt's `RE-REVIEW-REQUIRED (delta)` branch; both
escalation triggers fired (width: changed files outside the folded rows' cited
union — CHANGELOG, workflow docs, package tests, 9 suites, 10+ skill references;
size: ~830 added+deleted lines / 48 files vs the 200 / 15 limits), so the delta
pass ran as a full review over `git diff main...HEAD` at the reviewed head
`ac543b6d0238e9c0820035ee2bfe0bf2623de3a4`. All 23 `folded: yes` rows re-verified
**fixed** at their cited locations; F17/F20/F24 re-judged and confirmed settled
per the owner's recorded resolutions (Q4/D4, Q5/D5 — `promise-coherence` PASS 36
claims, both templates lint PASS, the citation pin landed and is tested).
Four applicable axes ran isolated (`review-code`, `review-security` PASS,
`review-verify`, `review-perf`); design/a11y/brand/seo skipped — no UI surface.
`review-verify` reproduced the whole gate at this head (root 824/824, schema
721/721, pi 432/432, every declared AC validator exit 0) and caught the parity
rejection below. Cycle: 2 (one prior `REVIEW-RAN` mark + one forge receipt) —
the two-cycle cap is reached; see the report's LOOP CAP block.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F27 | packages/pi-agentic-workflow/package.json:3 | workflow | high | fix-now | fold: the version-parity gate is red at this head — `node scripts/version-parity-gate.mjs --content --base main` exits 1 (`GATE REJECTION — shipped-content-version`): the package pins 0.31.0 and `main` also pins 0.31.0 (consumed by feature 66, `270b4be8`, after this branch registered 0.31.0 in `a8bf7abd`) while the branch changes 22 files under `skills/**` — merging as-is publishes nothing to npm, and the CHANGELOG 0.31.0 row's "registered above the base" claim is false against current `main`; bump to 0.32.0 + add the CHANGELOG Companion-npm-packages row in the same commit · fold 9a35a976 | yes |
| F28 | scripts/workflow-status.mjs:666 | code | med | fix-now | fold: `sectionBounds` is duplicated byte-identically (`scripts/ledger-provenance.mjs:370`) and both copies are fence-unaware while the shared reader `sectionText` (`scripts/unit-doc-phases.mjs:296`) is fence-aware — a fenced line starting `## ` at column 0 inside `## Log`/`## Findings` (the template's own L1 verbatim-request form invites it) truncates the section for the two fence-blind readers but not the third; read both through the shared reader (or move `sectionBounds` beside it) and pin the fenced-heading case | yes |
| F29 | scripts/workflow-status.mjs:762 | code | med | fix-now | fold: `rowsFromFindingsSection` re-implements the exported `findingsRows` (`scripts/unit-route.mjs:168-187`) — the same `findings-table@1` row grammar (cell slicing, ≥6-cell guard, header/separator/mark-row guards, `carrier:"doc"` normalization) in two copies that can drift while the shared parsers sit one import away in `unit-doc-phases.mjs`; import/extract the shared reader and pin parity — fold F6's `bounded()` control-char gap (`scripts/workflow-status.mjs:835`) opportunistically in the same batch | yes |
| VF-27 | packages/pi-agentic-workflow/package.json:3 · reviewer review-change · HEAD ac543b6d0238e9c0820035ee2bfe0bf2623de3a4 · recheck reproducer: `node scripts/version-parity-gate.mjs --content --base main` → exit 1, `GATE REJECTION — shipped-content-version` (version `0.31.0 → 0.31.0`, 22 files triggered); `git show main:packages/pi-agentic-workflow/package.json` → `0.31.0`, last changed by `270b4be8` (feature 66) | workflow | confirmed | finding-mark | n/a | n/a |
| VF-28 | scripts/workflow-status.mjs:666 · reviewer review-change · HEAD ac543b6d0238e9c0820035ee2bfe0bf2623de3a4 · recheck direct read of all three sites + reproducer: a doc whose `## Log` carries a fenced block with a column-0 `## ` heading line → shared `sectionText` returns the full section (the `P1` mark visible) while the copied `sectionBounds` body truncates to the first fence line and loses the mark | code | confirmed | finding-mark | n/a | n/a |
| VF-29 | scripts/workflow-status.mjs:762 · reviewer review-change · HEAD ac543b6d0238e9c0820035ee2bfe0bf2623de3a4 · recheck direct read of `rowsFromFindingsSection` beside `findingsRows` (`scripts/unit-route.mjs:168-187`): same grammar, no shared import, no parity pin | code | confirmed | finding-mark | n/a | n/a |

### Cycle 3 — findings from auditing the `--prioritize-now` turn itself (2026-10-25)

F24: RESOLVED by `D5` — owner decision 2026-10-23 (SPEC Progress log): the citation pin is this unit's machine backing (landed in `d885f693`, pinned by `scripts/ledger-ownership.test.mjs` — both templates cite the `review-findings` truth class, one class owns both carriers); the `ledger-ownership@1` section-level carrier row is deferred to its own unit (## Future row, dated 2026-10-23). Disposition `ignore` = decided, never routed.

Persisted by `triage-issue` in review-finding mode from its own dated,
evidence-grounded verdict (the marker in each `route` cell names the invocation
that produced the row: `triage --prioritize-now 79-spec-by-reference 2026-10-25`;
no issue number exists for this batch, and none is invented). Rows start
`folded: no` — this skill never flips them (`FOLD_LEDGER.md:20-21`).
Axis: `workflow` for the two prose defects, `verify` for the coverage gap.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F30 | skills/triage-issue/SKILL.md:28 | workflow | high | fix-now | fold: the turn contract's box 4 orders the opposite of the skill's own normative reference — it says every `--prioritize-now` finding gets "a verdict, **an immediate-fix attempt**, or an explicit replan/user-decision route", reinforced at `:11` ("an immediate-fix review-finding outcome") and `:53` ("`--prioritize-now` means **attempt to resolve** every named finding immediately"), while `references/REVIEW_FINDING_PROCESS.md` §3 says the same case "remains on the current unit. **Route it to `/fold-findings`** or an explicit `/execute-phase <unit> P<n>`"; `AGENTS.md`'s turn-contract rule ("weak models drop end-of-document duties, so the contract goes first") makes the contradictory box win, so the skill instructs an implementation it must not perform — reproduced this very cycle: the review-finding route implemented three rows inline instead of routing them; state in the contract that a `fix-now` row is *routed* to `/fold-findings` (never implemented) and delete "immediate-fix"/"attempt to resolve" from the description and `When to use` — triage `--prioritize-now 79-spec-by-reference` 2026-10-25 | yes |
| F31 | skills/triage-issue/references/FOLD_LEDGER.md:20 | workflow | high | fix-now | fold: the only sentence in this skill that forbids writing the flip — "`folded` starts `no` (this skill never sets `folded: yes` — that transition belongs solely to `/fold-findings`)" — sits in a reference the progressive-loading table (`skills/triage-issue/SKILL.md`, §Progressive loading, last bullet: "**Only when the verdict is `fix-in-unit`**, read [fold ledger]") loads for a verdict the review-finding mode can never produce (its closed set is `fix-now` / `replan-in-unit` / `decision-required` / `product-repair` / `disputed`), and `REVIEW_FINDING_PROCESS.md` — the file that *is* loaded — never names the flip; the ownership rule is therefore unreachable exactly on the path that flips, and this cycle wrote three flips through the wrong owner (`ledger-ownership@1` names `fold-findings:folded-flag` the sole writer, `LEDGERS.md:168`) in a commit separate from the fixes (`FOLD_POLICY.md:22` demands the flip "in the same commit as the fix"); restate the ownership rule in `REVIEW_FINDING_PROCESS.md` and widen the load condition to "when the verdict writes a row (`fix-in-unit` or `fix-now`)" — triage `--prioritize-now 79-spec-by-reference` 2026-10-25 | yes |
| F32 | scripts/review-loop-discipline.test.mjs:400 | verify | med | fix-now | fold: the IS-1 pins assert the sole-flipper claim only on `fold-findings/SKILL.md`, `PERSIST_AND_DECIDE.md` and `FOLDING.md`; nothing pins `triage-issue`'s turn contract against its own reference, and nothing pins that the review-finding route states who flips — so the two defects above (`F30`, `F31`) ship with a green suite; add a case asserting the triage turn contract contains no "immediate-fix" instruction and that `REVIEW_FINDING_PROCESS.md` names `/fold-findings` as the fold owner — triage `--prioritize-now 79-spec-by-reference` 2026-10-25 | yes |
| VF-30 | skills/triage-issue/SKILL.md:28 vs skills/triage-issue/references/REVIEW_FINDING_PROCESS.md:14-16 · reviewer triage-issue 2.11.2 · HEAD af53daae44f006c80c7ff99cbca8925170a01822 · recheck direct read of the three conflicting lines (`:11`, `:28`, `:53`) against §3 of the reference; reproduced by this turn's own behaviour — three rows implemented inline instead of routed | workflow | confirmed | finding-mark | n/a | n/a |
| VF-31 | skills/triage-issue/references/FOLD_LEDGER.md:20-21 + skills/triage-issue/SKILL.md §Progressive loading · reviewer triage-issue 2.11.2 · HEAD af53daae44f006c80c7ff99cbca8925170a01822 · recheck direct read of the load condition beside the review-finding verdict set in `REVIEW_FINDING_PROCESS.md` §3, plus `grep -n 'flip\|folded: yes' REVIEW_FINDING_PROCESS.md` → no match; observed outcome: three flips written by this skill, in a commit separate from the fixes | workflow | confirmed | finding-mark | n/a | n/a |
| VF-32 | scripts/review-loop-discipline.test.mjs:400-408 · reviewer triage-issue 2.11.2 · HEAD af53daae44f006c80c7ff99cbca8925170a01822 · recheck direct read of the IS-1 pin block: it names `foldSkill`, `persist`, `folding` only; `grep -n 'triage-issue' scripts/review-loop-discipline.test.mjs` returns only `--prioritize-now` routing matches, no contract-coherence case | verify | confirmed | finding-mark | n/a | n/a |

### Cycle 3b — scope and `--prioritize-now` decisions (owner, 2026-10-25)

Persisted by `triage-issue:triage-rows` from an explicit **owner decision** in
this session's turn (provenance marker `owner decision 2026-10-25` — not a
triage verdict and not an issue number). Both rows are defects this PR
introduced or left exposed, so both are **in-scope** and therefore `fix-now`
by the current-unit contract, regardless of axis: an in-scope defect is never
postponed because it looks cheap or expensive.

The owner's two rulings, recorded here because the rows encode them:

- **Disposition follows scope, never axis or tier.** An in-scope defect is
  `fix-now` always; size only chooses between the fold route and a replan, and
  axis/severity only set execution order and the gate that must run.
- **`--prioritize-now` is an escape, never a default.** It is admissible only
  for an in-scope finding whose expected diff is small (≤2 files, no normative
  surface, no published contract) — the axis never gates it — and no skill may
  emit it automatically as the LOOP CAP default.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F33 | skills/review-implementation/references/CLASSIFY.md:82 | workflow | high | fix-now | fold: "a finding belongs to the **current unit** when it maps to the governing SPEC, a phase, a documented invariant, …" is a prose test with no mechanical contrast — nothing compares a row's `file:line` against what the unit actually declared, so the owner's rule ("in-scope is always fix-now; the only question is where") has no evidence to stand on, and `F27` (a release-contract bump) entered as in-unit without any scope check; make `review-implementation` emit an explicit `scope: in-unit \| new-unit` per row with cited evidence (the row's `file:line` against the unit's `## Impact` set and the files the unit touched) and make `triage-issue` **consume** that field instead of re-deriving it — owner decision 2026-10-25 | yes |
| F34 | skills/review-change/references/REVIEW_PROCESS.md:173 | workflow | high | fix-now | fold: the two-cycle cap's fixed block routes the residue to `/triage-issue --prioritize-now` **by default** (`:173`) and the prose repeats "the residue routes to `triage-issue --prioritize-now`" (`:177-178`), so the cap — the moment with the least evidence about the findings — emits the escape as the standard path, which is how `F30`/`F31` happened; the cap must stop and hand the decision back (named findings + each one's expected-diff size), with `--prioritize-now` listed only as the owner's forced option for a small in-scope finding, never as the recommended route — owner decision 2026-10-25 | yes |
| VF-33 | skills/review-implementation/references/CLASSIFY.md:82-86 vs skills/review-implementation/SKILL.md:64-70 · reviewer triage-issue 2.11.2 · HEAD af53daae44f006c80c7ff99cbca8925170a01822 · recheck direct read: the current-unit test names SPEC/phase/invariant/correctness but no evidence comparison; neither `SKILL.md` Step 2 nor `CLASSIFY.md` emits a scope field; `grep -rn 'scope: in-unit\|scope: new-unit' skills/` → no match | workflow | confirmed | finding-mark | n/a | n/a |
| VF-34 | skills/review-change/references/REVIEW_PROCESS.md:170-178 · reviewer triage-issue 2.11.2 · HEAD af53daae44f006c80c7ff99cbca8925170a01822 · recheck direct read of the LOOP CAP block and the following paragraph: both name `--prioritize-now` as the route; reproduced in this cycle — the review emitted that block and the next turn took the escape | workflow | confirmed | finding-mark | n/a | n/a |

### Marks

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD ac543b6d0238e9c0820035ee2bfe0bf2623de3a4 · cycle 2 (delta, escalated full pass) · verdict REVIEW-FAIL | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD ac543b6d0238e9c0820035ee2bfe0bf2623de3a4 | node --test scripts/*.test.mjs | exit 0 | 824 tests · 824 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD ac543b6d0238e9c0820035ee2bfe0bf2623de3a4 | bun run build + bun run test (packages/agentic-workflow-schema) | exit 0 | 721 tests · 721 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD ac543b6d0238e9c0820035ee2bfe0bf2623de3a4 | bun run test (packages/pi-agentic-workflow) | exit 0 | 432 tests · 432 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD ac543b6d0238e9c0820035ee2bfe0bf2623de3a4 | node scripts/version-parity-gate.mjs --content --base main | exit 1 | GATE REJECTION — shipped-content-version (F27) | n/a | n/a |

### Cycle 2 outcomes

Three new fix-now rows (F27+F28+F29), all source-owned — no Product- or
Plan-rooted finding, so the fold route stays valid; none is a regression of a
cycle-1 row (all 23 re-verified fixed). Proposals (user-routed, D3):
`createSpecByReference` exported and unwired (no CLI verb, no test import —
recorded by the owner's dispute resolution) and a perf-benchmark pin for the new
append-only-Log parsers (trigger: a parser lands on a hot path or a real Log
exceeds ~1 MB).

### Cycle 4 — review-change cycle 3: delta escalated to a full pass (2026-10-25)

Run on the user's explicit instruction (the two-cycle cap was reached at cycle 2;
this is the owner's escape, not a reviewer election). Delta mode per the
post-fold re-review default; **escalated to a full pass — size trigger fired**:
the last fold batch (`d7b8ea14`, F30–F34) changed 15 files / ~368 added+deleted
lines against the 200-line limit (width trigger did not: 15 files, not >15, and
every changed file is inside the batch's cited union). Reviewed head
`d7b8ea14ada630c434fcca1adba70190227f6259` (= PR #311 head). All 31 `folded: yes`
rows re-verified **fixed** at their cited locations (F17/F20 stay DISPUTED per the
owner's recorded resolutions; F24's prose half fixed). Four applicable axes ran
isolated (`review-code` FAIL, `review-security` FAIL, `review-verify` PASS,
`review-perf` PASS); design/a11y/brand/seo skipped — no UI surface. Every AC's
declared validator re-run at this head (AC1 13/13, AC2 211/211, AC3 20/20, AC4
105/105, AC5 32/32 + no closed unit doc in the diff, AC6 9/9, parity
0.31.0→0.33.0 PASS, budgets 28 skills/14 routes, LINEAGE OK, needs-input 0,
promise-coherence PASS 36 claims); no test deleted or loosened. Cycle: 3 (two
prior `REVIEW-RAN` marks + forge receipts) — a cycle ≥ 2 with new fix-now rows,
so the report carries the `CONVERGENCE-ANOMALY` block and the cap hands the
decision back.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F35 | docs/features/79-spec-by-reference/SPEC.md:414-514 | code | med | fix-now | fold: the cycle-2 review-verdict block is duplicated byte-identically — the material table (M1–M7), report-notes (N1–N15) and the "Ladder position…" paragraph appear in both `## Next` (:414-462) and `## Review verdict` (:466-514); only the fenced `REVIEW-VERDICT: FAIL` header differs (`grep -c '^\| M1 \|'` → 2) — keep `## Review verdict` canonical and reduce `## Next` to the verdict block plus a one-line pointer, so the pane F26's fold re-cut cannot be read twice | yes |
| F36 | docs/features/79-spec-by-reference/review-findings.md:134 | verify | med | fix-now | fold: `node scripts/ledger-provenance.mjs --check docs/features/79-spec-by-reference/review-findings.md` exits 1 at this head — F27 `cited-unverified`: the row's prose cites two reachable context commits (`270b4be8`, `a8bf7abd`) and the demotion rule (`status = cited.length ? "cited-unverified" : …`, `scripts/ledger-provenance.mjs:508`) demotes an otherwise score-3-proven fold (`9a35a976` names F27 and changes the cited surface, but the marker was never appended); annotate the row (the tool's own repair route) or re-cut the context citations, and pin the marker-vs-prose-citation precedence case in `ledger-provenance.test.mjs` · fold ac8e20b8 | yes |
| F37 | scripts/workflow-status.mjs:656 | security | med | fix-now | fold: the doc-carrier review-mark regex `/\s*[-*+ ]\s+\*\*R(\d+)\*\*…/gm` (new in this delta) lost the `^` anchor — `\s*` matches across newlines, so a prose bullet `- see **R2** — note` matches, and because the section body `sectionRange` returns includes fenced lines, a forged `**R2** — HEAD <40-hex>` inside a ``` fence inside `## Log` is taken as the latest mark with its sha extracted (reproduced in /tmp): review-freshness self-deception; re-anchor to `^\s*` with `/m` and add prose-mention + fenced-forgery corpus cases to `workflow-status-sensor.test.mjs` | yes |
| F38 | scripts/workflow-status.mjs:805-808,815-835 | security | med | fix-now | fold: `bounded()` only collapses `\s+` and `readFixNow` pushes identity cells verbatim — Log mark bodies (`readLogMarks` → observations at `:1450`) and fixNow `id`/`file`/`axis`/`class`/`route` cells from unit-doc table rows reach the envelope with no `sanitize()` (grep: only call sites `:852,:866`) — the same control/C1/bidi/zero-width echo class F14 closed in `phase-lint`, and the gap F29's fold route explicitly promised to close "in the same batch"; route both echo paths through `sanitize()` (or share its flatten class in `bounded()`), keep the 120-char bound, and pin a control-char corpus case | yes |
| F39 | scripts/workflow-status.mjs:788-792 | code | med | fix-now | fold: `readLogMarks` still extracts `## Log` fence-blind (`search(/^## Log/m)` + `search(/^## /m)`) — the exact F28 defect class left in a third reader after the fold moved the other two onto the shared fence-aware `sectionBounds`; a fenced column-0 `## ` heading inside `## Log` truncates the marks this reader sees while the shared reader returns the full section; read it through `sectionBounds(doc, "Log")` (already imported at `:41`) and pin the fenced-heading case | yes |
| VF-35 | docs/features/79-spec-by-reference/SPEC.md:414-462 vs :466-514 · reviewer review-change 3.13.0 · HEAD d7b8ea14ada630c434fcca1adba70190227f6259 · recheck direct read + `grep -c '^| M1 '` → 2; `diff` of the two ranges shows only the fenced header differs | code | confirmed | finding-mark | n/a | n/a |
| VF-36 | docs/features/79-spec-by-reference/review-findings.md:134 · reviewer review-change 3.13.0 · HEAD d7b8ea14ada630c434fcca1adba70190227f6259 · recheck reproducer: `node scripts/ledger-provenance.mjs --check docs/features/79-spec-by-reference/review-findings.md` → exit 1, `1 cited-unverified: F27`; direct read of the demotion rule at `scripts/ledger-provenance.mjs:508` and `9a35a976`'s subject (`fix(78): close F27 parity gate…`) | verify | confirmed | finding-mark | n/a | n/a |
| VF-37 | scripts/workflow-status.mjs:656 · reviewer review-change 3.13.0 · HEAD d7b8ea14ada630c434fcca1adba70190227f6259 · recheck direct read + reproducer: `/^\s*/`-less regex matches `- see **R1** — note` mid-Log; `sectionRange` builds on fence-aware `sectionBounds` for headings but returns the full body including fenced lines, so a fenced `**R2** — HEAD …` line is captured | security | confirmed | finding-mark | n/a | n/a |
| VF-38 | scripts/workflow-status.mjs:805-808 · reviewer review-change 3.13.0 · HEAD d7b8ea14ada630c434fcca1adba70190227f6259 · recheck direct read: `bounded()` = `.replace(/\s+/g," ").trim()` only; `sanitize` imported at `:38` with call sites `:852,:866` only; `readFixNow` `:815-835` pushes carrier cells verbatim; F29's ledger row names the bounded() gap as an in-batch promise | security | confirmed | finding-mark | n/a | n/a |
| VF-39 | scripts/workflow-status.mjs:788-792 · reviewer review-change 3.13.0 · HEAD d7b8ea14ada630c434fcca1adba70190227f6259 · recheck direct read: inline `doc.search(/^## Log\s*$/m)` + `doc.slice(after).search(/^## /m)` — no `openFence`/`closesFence`; `sectionBounds` imported at `:41` and used at `:670,:686` but not here | code | confirmed | finding-mark | n/a | n/a |
| F40 | docs/features/79-spec-by-reference/SPEC.md:161,168 | code | med | fix-now | fold: the re-cut Future rows carry the status token `kept deferred <date>`, outside the closed Future status vocabulary this same PR publishes — `open`, `planned`, or `discarded <YYYY-MM-DD>` (`docs/features/_TEMPLATE/SPEC.md:48`, `docs/fix/_TEMPLATE/SPEC.md:60`, `packages/agentic-workflow/src/edit/UnitDoc.mjs:70,150`); "keep-deferred" is an offer outcome (`skills/unit-lane/SKILL.md:177-178`), not a status — under the published grammar a kept row stays `open` with the deferral dated in prose. No parser reads Future status (behavior unaffected); introduced in the post-cycle-4 delta (the pre-delta row was the in-vocab `open`). Re-cut the two tokens to a published status — the owner's recorded decision (D5: the deferral) survives in prose | yes |
| VF-40 | docs/features/79-spec-by-reference/SPEC.md:161,168 · reviewer review-change · HEAD a775c112ad73bff51b42a78876cea526e542b64d · recheck direct read: the token is absent from the published set at all three grammar surfaces; "keep-deferred" appears only as an offer outcome (`unit-lane/SKILL.md:177-178`); `grep -n "kept deferred" docs/features/79-spec-by-reference/SPEC.md` → the two delta rows; no parser reads Future status (`grep -rn "kept deferred" scripts/ packages/` → 0) | code | confirmed | finding-mark | n/a | n/a |
| F41 | docs/features/79-spec-by-reference/ + docs/features/ROADMAP.md:88 | mergeability | high | fix-now | fold: rebase onto main and renumber the unit — main already merged `docs/features/78-unit-cycle` (PR #314, 2026-10-23), so this folder, its 63 in-tree references and roadmap row 78 all collide; resolve the 7 conflicted files in the same pass (CHANGELOG.md, docs/features/ROADMAP.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, packages/pi-agentic-workflow/package.json, scripts/unit-route.mjs, skills/execute-phase/SKILL.md, skills/unit-lane/SKILL.md), re-run the budgets and both suites, then re-review — the receipt at this head is void at the new head · fold 62b36a56 | yes |
| VF-41 | HEAD fca4ba8d18c7ec771ccda81f5c11c54deedba1ae · auditor audit-pr · recheck `git merge-tree --write-tree origin/main HEAD` → 7 CONFLICT files; `git ls-tree origin/main docs/features/` → `78-unit-cycle` present and its roadmap row reads `done · [#314]`; `grep -rn 79-spec-by-reference` → 63 references inside the colliding folder | mergeability | confirmed | finding-mark | n/a | n/a |
| F42 | packages/pi-agentic-workflow/package.json:61 | verify | high | fix-now | fold: clear the dependency-pin-drift — the pin holds `@gtrabanco/agentic-workflow-schema` 4.6.0 while the registry published 4.7.0 (main pins 4.7.0 beside pi 0.31.0); bump the pin with the package version in the rebase commit, and confirm CI actually runs at the new head — no workflow run exists for this head (`gh pr checks 311` → no checks reported) · fold 62b36a56 | yes |
| VF-42 | HEAD fca4ba8d18c7ec771ccda81f5c11c54deedba1ae · auditor audit-pr · recheck job log of run 40010434992 (`dependency-pin-gate`) → `GATE REJECTION — dependency-pin-drift … pins at 4.6.0 but the registry published 4.7.0` · `VERDICT: FAIL`; `npm view @gtrabanco/agentic-workflow-schema version` → 4.7.0; `gh pr view 311 --json statusCheckRollup` → `[]`; local `node --test scripts/*.test.mjs` → 828 pass | verify | confirmed | finding-mark | n/a | n/a |
| F43 | docs/features/ROADMAP.md:88 | traceability | high | fix-now | fold: settle the row's status to `done · [#311](https://github.com/gtrabanco/agentic-workflow/pull/311)` when the row is re-cut to the free number — `bun scripts/unit-route.mjs 79-spec-by-reference` answers `status: in-progress · route: execute · next: /execute-phase 79-spec-by-reference P1`, so the status-only close-out branch never fires · fold 62b36a56 | yes |
| VF-43 | HEAD fca4ba8d18c7ec771ccda81f5c11c54deedba1ae · auditor audit-pr · recheck `bun scripts/unit-route.mjs 79-spec-by-reference` → `status: in-progress · route: execute · next: /execute-phase 79-spec-by-reference P1`; `awk '/^## Progress log/'` entries carry no `- ` head, so `recordedPhases` reads none; roadmap row 78 reads `in-progress · [#311]` while `audit-pr`'s closure reference states a unit flips to `done` when its PR opens | traceability | confirmed | finding-mark | n/a | n/a |
| F44 | docs/features/79-spec-by-reference/review-findings.md:233,238 | verify | med | fix-now | fold: the re-pointed fold markers cite `9a35a976a` — an invalid sha abbreviation (the real commit is `9a35a976853a78e18cccba96eb0d54bf5f95a5ab`; the 9th char is `8`, not `a`) — so the marker never resolves and `ledger-provenance --check` stays green only via by-message recovery while the unit SPEC `## Next` claims the re-point as a cleared audit blocker; correct the token to `9a35a976` via the tool's annotate/repair route (as F36 did) · fold 00f4900 | yes |

| VF-44 | HEAD 7597376b0c8060950b3966129212527220c17134 · reviewer review-change cycle 7 · recheck `git rev-parse --verify 9a35a976a^{commit}` → unresolvable; `git rev-parse 9a35a976` → `9a35a976853a78e18cccba96eb0d54bf5f95a5ab`; the token appears at review-findings.md:233,238 (F36's `ac8e20b8` resolves) | verify | confirmed | finding-mark | n/a | n/a |
| F45 | scripts/workflow-status.mjs:668,773 + scripts/ledger-provenance.mjs:259 | code | med | fix-now | fold: the carrier probes `/^## (Findings\|Log)\s*$/m` are fence-blind — the exact class F28/F37/F39 fixed on the shared fence-aware readers — so a `## Findings`/`## Log` heading inside a fenced sample flips carrier selection; probe with `sectionText(doc,"Findings") !== null` / `sectionBounds` (both already imported beside the sites) and pin the fenced-heading case in `scripts/workflow-status-sensor.test.mjs` + `scripts/ledger-provenance.test.mjs` | no |
| VF-45 | HEAD 7597376b0c8060950b3966129212527220c17134 · reviewer review-change cycle 7 · recheck reproducer: the probe regex tests `true` on `~~~\n## Findings\n~~~\nbody` while `sectionBounds(same, "Findings")` → `null` | code | confirmed | finding-mark | n/a | n/a |
| F46 | scripts/unit-doc-phases.mjs:19,161-165 | code | med | fix-now | fold: `IMPLEMENTS_LINK` is unanchored — a prose line mentioning `(Implements: S9)` mid-sentence after the dedicated link line overwrites the phase's link (reproduced: `P1 implements = "S9"`, expected `S1`); anchor to `/^\(Implements:\s*([^)]*)\)$/` like the anchored `UNIT_DOC_RELEVANT_FILES` sibling and pin the mid-sentence case in the parser/phase-lint suite | yes |
| VF-46 | HEAD 7597376b0c8060950b3966129212527220c17134 · reviewer review-change cycle 7 · recheck reproducer: `parseUnitDocPhases` on a P1 bullet with `(Implements: S1)` followed by prose containing `(Implements: S9)` → `implements: "S9"` | code | confirmed | finding-mark | n/a | n/a |
| F47 | scripts/ledger-provenance.mjs:333 | code | med | fix-now | fold: the doc recount takes only the last cited token (`cited.at(-1)`) as the fold sha — a log line citing the fold commit first plus a later context commit is misreported `cited-unverified` and `--check` exits 1 on a valid line (reproduced: `fold ac8e20b8 · context 9a35a976` → `cited-unverified fold=9a35a97`); try each cited token until `foldSubjectIds(sha)` intersects the claimed ids | no |
| VF-47 | HEAD 7597376b0c8060950b3966129212527220c17134 · reviewer review-change cycle 7 · recheck reproducer: crafted unit-doc carrier, `ledger-provenance --check` → `F36 cited-unverified fold=9a35a97 … CHECK FAIL` exit 1 on a line whose first token proves it | code | confirmed | finding-mark | n/a | n/a |

F41: RESOLVED — audit blocker folded at `e3aecb34` (folded by the rebase onto `origin/main` + the renumber commit: `docs/features/79-spec-by-reference` replaces the colliding 78 folder, its 63 in-tree references and the roadmap row move to 79, and the seven conflicted files are resolved (`git merge-tree --write-tree origin/main HEAD` at 21dfb67f → 0 conflicts, `gh pr view 311 --json mergeable` → MERGEABLE after the push)).
F42: RESOLVED — audit blocker folded at `21dfb67f` (folded: the rebase lands the published pin (`@gtrabanco/agentic-workflow-schema` 4.7.0 in package.json and bun.lock) and the version ladder above main (pi 0.34.0, execute-phase 6.2.2, unit-lane 2.4.3) so `version-parity-gate --pins` and `--content` both PASS; CI runs at the new head).
F43: RESOLVED — audit blocker folded at `21dfb67f` (folded: roadmap row 79 reads `done · [#311]` next to main's `78-unit-cycle` row, so `bun scripts/unit-route.mjs 79-spec-by-reference` reports `status: done` and reaches the close-out route instead of `/execute-phase … P1`).

### Marks

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD d7b8ea14ada630c434fcca1adba70190227f6259 · cycle 3 (delta, escalated full pass — size trigger ~368 added+deleted > 200) · verdict REVIEW-FAIL | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD d7b8ea14ada630c434fcca1adba70190227f6259 | node --test scripts/*.test.mjs | exit 0 | 824 tests · 824 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD d7b8ea14ada630c434fcca1adba70190227f6259 | bun run build + bun run test (packages/agentic-workflow-schema) | exit 0 | 721 tests · 721 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD d7b8ea14ada630c434fcca1adba70190227f6259 | bun run test (packages/pi-agentic-workflow) | exit 0 | 432 tests · 432 pass · 0 fail | n/a | n/a |

### Cycle 4 outcomes

Five new fix-now rows (F35+F36+F37+F38+F39), all `scope: in-unit` (the unit's own
doc and ledger, plus `scripts/workflow-status.mjs` / `unit-doc-phases.mjs` both in
the unit's `## Impact` set) and all source-owned — no Product- or Plan-rooted
finding, so the fold route stays valid. None is a `regression of <id>`: all 31
prior folded rows re-verified fixed at their cited locations; F38 is adjacent to
F29's promised in-batch extra but at different cited lines, so it enters as its
own row. Report-only notes (low, never persisted): a byte-identical duplicate
"dispute resolutions (owner)" Progress-log entry (SPEC.md:405-406); a dead
import `sectionText` (workflow-status.mjs:41); the shared `sectionBounds`/
`sectionText` heading test on `trimmed` lines admits an indented `## Log`/
`## Findings` the column-0 regexes refused (unit-doc-phases.mjs:296-352 — debt
note, trigger: a doc with an indented `## Log` line). Proposals unchanged from
cycle 2 (user-routed, D3): `createSpecByReference` exported and unwired; a
perf-benchmark pin for the append-only-Log parsers.

### Cycle 5 — review-change cycle 4: delta escalated to a full pass — verdict PASS (2026-10-26)

Run on the owner's standing authorization (the doc's `## Next` pane named this
delta re-review; the two-cycle cap was reached at cycle 2, so the escape stays
the owner's, never a reviewer election). Reviewed head frozen at
`56f8ea254f12b1d433a086d8812be5297cfb4421` (= PR #311 head, after the ledger
closure commit below). Delta mode first: the fold diff `66837370..56f8ea25`
measures 314 added+deleted lines (> 200) — **size trigger fired**, so the
delta escalated to a full pass over `git diff main...HEAD`.

**Ledger closure first (owner decisions persisted).** The three DISPUTED rows
were decided by the owner on 2026-10-23 (SPEC Progress log) and re-judged
settled in cycles 2 and 4; their folded cells now read
`ignore · owner decision 2026-10-23` with a dated RESOLVED line each (F17 —
dismissed as reported and re-scoped, A3 defers this doc's own migration;
F20 — dismissed, `## Impact` is the pre-change surface map by contract; F24 —
resolved by `D5`, the citation pin is the machine backing and the map
amendment runs as its own future unit). `ignore` is `unit-route`'s
decided-never-routed disposition (`scripts/unit-route.mjs` NOT_OPEN) — no
`folded: yes` flip was written and none of these rows claims a fold; the
router now reports `open-rows: 0`.

**Re-verification (two isolated passes):** all 36 `folded: yes` rows re-verified
**fixed** at their cited surfaces (construct-level check at shifted offsets,
with /tmp reproducers for the behavior rows: sanitizeEcho, fence-aware
`parseLog`/`sectionBounds`, `flattenCell`, parity gate, lineage,
ledger-provenance precedence). F17/F20/F24 skipped as owner-decided.

**Four isolated axis passes:** `review-code` PASS (2 low), `review-security`
PASS (0 findings — F14/F37/F38 fixes re-proven by reproducers),
`review-perf` PASS (2 low proposals), `review-verify` PASS (every declared AC
validator and all three suites green). No same-`file:line`+axis re-report and
no regression of any folded row; no new high/med finding, so nothing is
persisted below and no `CONVERGENCE-ANOMALY` table is due (the two low
code-classed notes are below the materiality floor and ride as report-notes).

**Gates at the reviewed head (verify axis, isolated):** root
`node --test scripts/*.test.mjs` → 828/828 · schema `bun run test` → 721/721 ·
pi `bun run test` → 432/432 · AC1 13/13 · AC2 211/211 · AC3 20/20 · AC4 109/109
· AC5 32/32 with no closed-unit doc in the merge-base diff (the two-dot `docs/`
rows for 61/66/67/78-unit-cycle are main-side drift: main tip `b659bf63` is
ahead of merge-base `01151e6b`) · AC6 9/9 · budgets 28 skills/14 routes ·
parity `0.31.0 → 0.33.0` PASS · `LINEAGE OK` · needs-input 0 ·
promise-coherence PASS (36 checked) · phase-lint PASS ·
`ledger-provenance --check` CHECK PASS (the pre-existing `GIT ERROR …
deadbeef` line is recorded noise). AC integrity: `## Acceptance criteria`
byte-identical between `15ab46a1` and `56f8ea25` (`de9aea6898468b0d`,
extractor-normalized). Merge-drift check: `git merge-tree` → 0 conflict
markers against the advanced main.

**Report-notes (low, never persisted — the owner routes them):**
- `review-code` — dead `sectionRange` helper in `scripts/workflow-status.mjs`
  (the F37/F39 fold removed its last caller); dead branch in the F38 corpus
  test (`workflow-status-sensor.test.mjs` — a 10-char range string is always
  skipped by the `ch.length === 1` guard).
- `review-perf` (proposals) — one SPEC.md read+parse up to 4× per unit per
  envelope build (constant-factor, all scans O(doc) and fence-aware); one
  observation per `## Log` mark line with no cap on an append-only Log
  (extends the recorded cycle-2 perf-benchmark proposal — trigger: a real Log
  exceeds ~1 MB).
- `review-verify` (n/a-class) — `phase-lint.mjs` accepts exactly one plan path
  (a two-path invocation exits 1; both templates PASS individually); a stray
  untracked reproducer file at the repo root was deleted by the orchestrator.

**Proposals (user-routed, D3 — unchanged set):** `createSpecByReference`
exported and unwired; perf-benchmark pin for the append-only-Log parsers (now
also covering the observation path).

Verdict: **REVIEW-VERDICT: PASS** — the SHA-bound receipt is the next stage
(`/review-change` owns it); the audit stage follows the receipt.

### Cycle 6 — review-change cycle 5: delta pass, verdict PASS (2026-10-26)

Run on the owner's explicit invocation (the cap's escape stays the owner's; the
`## Next` pane and the cycle-5 fold entry both named this delta re-review).
Reviewed head frozen at `b6f45995a501d868cf3ef2cc275b44461f49ef59` (= PR #311
head before the marks below). Delta mode: the fold diff `a775c112..b6f45995`
measures 13 added+deleted lines over 2 files, both inside the folded rows'
cited union — **no escalation trigger fired**, so the delta ran as a delta pass
over `git diff a775c112..HEAD`. All 37 `folded: yes` rows re-verified **fixed**
at their cited constructs (two isolated passes: F1–F26 23/23, F27–F40 14/14);
F17/F20/F24 stay owner-decided (`ignore`, not folded rows). Four applicable
axes ran isolated over the fold delta (`review-code` PASS 2 low,
`review-security` PASS 0, `review-verify` PASS 1 low informational,
`review-perf` PASS 0); design/a11y/brand/seo skipped — no UI surface. No
high/med finding, so nothing is persisted below and no `CONVERGENCE-ANOMALY`
block is due; the lows ride as report-notes (VF-40's provenance cell omits the
reviewer semver its siblings carry; the cycle-5 fold Progress entry sits above
the cycle-4 review entry, both dated 2026-10-26; the `unit-lane` offer menu
still lists `kept deferred` — trigger: the D5-deferred Future-carrier unit;
one branch commit lacks a scope token: `docs: fold F19+F13's documented half`).

**Gates at the reviewed head (verify axis, run fresh — no identical-head mark
existed):** root `node --test scripts/*.test.mjs` → 828/828 · schema `bun run
build` + `bun run test` → 721/721 · pi `bun run test` → 432/432 · parity
`0.31.0 → 0.33.0` PASS · budgets 14 routes PASS · `LINEAGE OK` · needs-input 0
· promise-coherence PASS (36 checked) · phase-lint PASS · unit-route
`open-rows: 0`. AC integrity: `## Acceptance criteria` byte-identical between
`a775c112` and `b6f45995` (the delta hunks touch only `## Future` and the
Progress log; the recorded extractor-normalized digest `de9aea6898468b0d`
stands). F40's fix verified in place: both re-cut rows read `open` — kept
deferred `<date>` with the D5 deferral in prose, `discarded 2026-10-21`
untouched, no parser reads Future status (behavior unchanged, as F40 recorded).

Verdict: **REVIEW-VERDICT: PASS** — the SHA-bound receipt is the next stage
(`/review-change` owns it); the audit stage follows the receipt.

### Marks

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD 56f8ea254f12b1d433a086d8812be5297cfb4421 · cycle 4 (delta, escalated full pass — size trigger 314 > 200) · verdict REVIEW-PASS | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 56f8ea254f12b1d433a086d8812be5297cfb4421 | node --test scripts/*.test.mjs | exit 0 | 828 tests · 828 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD 56f8ea254f12b1d433a086d8812be5297cfb4421 | bun run test (packages/agentic-workflow-schema) | exit 0 | 721 tests · 721 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD 56f8ea254f12b1d433a086d8812be5297cfb4421 | bun run test (packages/pi-agentic-workflow) | exit 0 | 432 tests · 432 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD 56f8ea254f12b1d433a086d8812be5297cfb4421 | node scripts/version-parity-gate.mjs --content --base main | exit 0 | content parity holds: 0.31.0 → 0.33.0 · VERDICT: PASS | n/a | n/a |
| REVIEW-RAN | HEAD a775c112ad73bff51b42a78876cea526e542b64d · cycle 5 (fresh final review at the moved head — cycle 4's persist/verdict re-cut commit; full pass, four isolated axis reviewers + classifier) · verdict REVIEW-FAIL | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD a775c112ad73bff51b42a78876cea526e542b64d | node --test scripts/*.test.mjs | exit 0 | 828 tests · 828 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD a775c112ad73bff51b42a78876cea526e542b64d | bun run test (packages/agentic-workflow-schema) | exit 0 | 721 tests · 721 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD a775c112ad73bff51b42a78876cea526e542b64d | bun run test (packages/pi-agentic-workflow) | exit 0 | 432 tests · 432 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD a775c112ad73bff51b42a78876cea526e542b64d | node scripts/version-parity-gate.mjs --content --base main | exit 0 | content parity holds: 0.31.0 → 0.33.0 · VERDICT: PASS | n/a | n/a |
| GATE-RAN | HEAD a775c112ad73bff51b42a78876cea526e542b64d | bun scripts/check-skill-context.mjs --routes · node scripts/unit-lineage.mjs --unit 79-spec-by-reference · node scripts/needs-input.mjs docs/features/79-spec-by-reference · node scripts/promise-coherence.mjs · node scripts/phase-lint.mjs docs/features/79-spec-by-reference/SPEC.md · node scripts/unit-route.mjs 79-spec-by-reference | exit 0 (each) | budgets PASS 14 routes · LINEAGE OK · open questions 0 · promise PASS (36 checked) · phase-lint PASS · open-rows: 0 | n/a | n/a |
| REVIEW-RAN | HEAD b6f45995a501d868cf3ef2cc275b44461f49ef59 · cycle 6 (delta pass — fold diff a775c112..b6f45995, 13 lines / 2 files, no escalation trigger) · verdict REVIEW-PASS | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD b6f45995a501d868cf3ef2cc275b44461f49ef59 | node --test scripts/*.test.mjs | exit 0 | 828 tests · 828 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD b6f45995a501d868cf3ef2cc275b44461f49ef59 | bun run build + bun run test (packages/agentic-workflow-schema) | exit 0 | 721 tests · 721 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD b6f45995a501d868cf3ef2cc275b44461f49ef59 | bun run test (packages/pi-agentic-workflow) | exit 0 | 432 tests · 432 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD b6f45995a501d868cf3ef2cc275b44461f49ef59 | node scripts/version-parity-gate.mjs --content --base main | exit 0 | content parity holds: 0.31.0 → 0.33.0 · VERDICT: PASS | n/a | n/a |
| GATE-RAN | HEAD b6f45995a501d868cf3ef2cc275b44461f49ef59 | bun scripts/check-skill-context.mjs --routes · node scripts/unit-lineage.mjs --unit 79-spec-by-reference · node scripts/needs-input.mjs docs/features/79-spec-by-reference · node scripts/promise-coherence.mjs · node scripts/phase-lint.mjs docs/features/79-spec-by-reference/SPEC.md · node scripts/unit-route.mjs 79-spec-by-reference | exit 0 (each) | budgets PASS 14 routes · LINEAGE OK · open questions 0 · promise PASS (36 checked) · phase-lint PASS · open-rows: 0 | n/a | n/a |
| REVIEW-RAN | HEAD 7597376b0c8060950b3966129212527220c17134 · cycle 7 (delta over the audit-stage rebase/renumber fold `219e01ac..HEAD`, escalated full pass — size trigger 274 added+deleted > 200 across 13 files; six isolated passes: code/security/verify/perf + two folded-row re-verification passes F1–F20, F21–F43 → 40/40 fixed, 0 regressions) · verdict REVIEW-FAIL | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 7597376b0c8060950b3966129212527220c17134 | node --test scripts/*.test.mjs | exit 0 | 885 tests · 885 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD 7597376b0c8060950b3966129212527220c17134 | bun run build + bun run test (packages/agentic-workflow-schema) | exit 0 | 721 tests · 721 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD 7597376b0c8060950b3966129212527220c17134 | bun run test (packages/pi-agentic-workflow) | exit 0 | 471 tests · 471 pass · 0 fail | n/a | n/a |
| GATE-RAN | HEAD 7597376b0c8060950b3966129212527220c17134 | node scripts/version-parity-gate.mjs --content --base main | exit 0 | content parity holds: 0.31.0 → 0.34.0 · VERDICT: PASS | n/a | n/a |
| GATE-RAN | HEAD 7597376b0c8060950b3966129212527220c17134 | bun scripts/check-skill-context.mjs --routes · node scripts/unit-lineage.mjs --unit 79-spec-by-reference · node scripts/needs-input.mjs docs/features/79-spec-by-reference · node scripts/promise-coherence.mjs · bun scripts/phase-lint.mjs docs/features/79-spec-by-reference/SPEC.md · node scripts/unit-route.mjs 79-spec-by-reference · node scripts/ledger-provenance.mjs docs/features/79-spec-by-reference/review-findings.md --check | exit 0 (each) | budgets PASS 14 routes · LINEAGE OK (10) · open questions 0 · promise PASS (42 checked) · phase-lint PASS · open-rows: 0 · CHECK PASS | n/a | n/a |
