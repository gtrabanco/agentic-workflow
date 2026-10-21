# review-findings — 36-verification-contract-hygiene

Cycle 1 review ran 2026-10-18 (review-change) on the exact candidate
`HEAD f21593eb946aa278edf2a36428825ee35d563d2c`, clean workspace, no PR yet
(pre-PR checkpoint). Applicable passes ran isolated: `review-code`,
`review-security`, `review-verify`, `review-brand`, `review-perf`; skipped with
reasons — `review-design`/`review-a11y`/`review-seo` (no UI, no web surface: the
repo ships markdown skills and a docs scaffold). Synthesis, classification
(`review-implementation`) and the debt transform (`review-debt`) each ran
isolated. Gate at head: root suites exit 1, `--routes` exit 1, shipped-content
version-parity exit 1.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:341-400 + skills/verification-contract/SKILL.md:36-49 | perf, verify | high | fix-now | fold into current unit: pay F10/F11 first, then re-measure `node scripts/check-skill-context.mjs --routes`; a ceiling that still fails is re-based at a declared `sources` entry naming verification-contract 1.4.0 / issue #183 — never widened silently | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| F2 | packages/pi-agentic-workflow/package.json:3 + CHANGELOG.md:71 | verify | high | fix-now | fold into current unit: bump the Pi package version and add its "Companion npm packages" row in this PR so `node scripts/version-parity-gate.mjs --content --base main` exits 0 | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| F3 | README.md:664-667 | security, brand | high | fix-now | fold into current unit: replace the four entries with issue #183's bibliography verbatim — real titles, full author lists, Görz et al. dated 2025 (arXiv 2505 = 2025-05), `https://appsec.guide/docs/fuzzing/techniques/writing-harnesses/` | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| F4 | README.md:663 | code, brand | high | fix-now | fold into current unit: restore "… material = `medium`+) is built." and remove the trailing space — a P3 append must not delete pre-existing prose | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| F5 | README.md:663 | brand | med | fix-now | fold into current unit: correct the pre-existing title while the line is edited — arXiv:2603.00539 is "Are LLMs Reliable Code Reviewers? Systematic Overcorrection in Requirement Conformance Judgement" | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| F6 | docs/features/36-verification-contract-hygiene/SPEC.md:183 | verify | high | fix-now | fold into current unit: re-record AC7 with the real exit codes of both halves (`node --test scripts/*.test.mjs`, `node scripts/check-skill-context.mjs --routes`); a red run is recorded red | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| F7 | docs/features/36-verification-contract-hygiene/SPEC.md:132-140 | workflow | med | fix-now | fold into current unit: flip O1-O5 to `verified` and add the issue #183 budget re-basis obligation with its phase and validator | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| F8 | docs/features/36-verification-contract-hygiene/SPEC.md:179-182 | verify | med | fix-now | fold into current unit: record the exact command and exit status per AC row; AC4's cited `grep -n "determin"` does not match the property/fuzz sentence — name the line that does | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| F9 | docs/features/ROADMAP.md:46 | workflow | med | fix-now | fold into current unit: set row 36 to `in-progress` (branch open, no PR) per the status legend so `node scripts/unit-route.mjs 36-verification-contract-hygiene` stops refusing the unit | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| F10 | skills/verification-contract/SKILL.md:42-45 | code, brand, perf | med | fix-now | fold into current unit: delete the restatement, keep one canonical determinism sentence, then re-measure `--routes` | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| F11 | skills/verification-contract/SKILL.md:45-47 | code | med | fix-now | fold into current unit: name the per-command caps (`fastCommandTimeoutMs` 10 min / `fullCommandTimeoutMs` 60 min) or point at `verification-plan.schema.json`'s per-command `timeoutMs` bound — `fullStageTimeoutMs` is the 120-minute whole-stage sum | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| F14 | skills/verification-contract/SKILL.md:8,20,52,64 + skills/review-change/SKILL.md:62 + skills/pre-execution-review/references/LEDGERS.md:58,150 + skills/pre-execution-review/references/POLICY.md:66,152 + skills/pre-execution-review/references/SNAPSHOT.md:64 + skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:111 + skills/workflow-status/references/PRE_EXECUTION.md:27 | architecture | med | fix-now | owner directive 2026-10-18 (in scope, do now): finish the ACCEPTANCE-era migration the workflow already decided — feature 61 P4 (`ACCEPTANCE.md is gone`, 2bd7c100) and fix/285 (`binds when present`, 5f111ff3) — by rewriting every surviving mandate line onto the unit doc's acceptance source; the machine side is already migrated (`scripts/pre-execution-contract.mjs:44` `required: false`, `lane-era-lineage.test.mjs`), so this is prose, and historical mentions (execute-phase's "is gone" notes, schema comments) stay untouched | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| F15 | template/docs/features/_TEMPLATE/SPEC.md:17-21 + docs/fix/_TEMPLATE/SPEC.md:31-33 | code | med | fix-now | owner directive 2026-10-18 (in scope): mirror the determinism + property/fuzz sentences, in the post-F10 dedup wording, into the two template substrates that still lack them; severity raised from the reviewer's `low` by owner materiality call, so it becomes an actionable row | yes · fold e28ff213ef2dd194eb1cb2368a15915b49fb4617 |
| VF-1 | docs/workflow/SKILL_CONTEXT_BUDGETS.json + skills/verification-contract/SKILL.md:36-49 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck run `node scripts/check-skill-context.mjs --routes` at head (exit 1, 15 ceiling violations across 12 routes) and at main 9bd272e9 (exit 0, 14 routes PASS); reproducer `node --test scripts/check-skill-context.test.mjs` exits 1 | perf | confirmed | finding-mark | n/a | n/a |
| VF-2 | packages/pi-agentic-workflow/package.json:3 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck `node scripts/version-parity-gate.mjs --content --base main` → `GATE REJECTION — shipped-content-version`, `0.21.0 → 0.21.0`, exit 1; same command on main → `changed files: 0`, PASS | verify | confirmed | finding-mark | n/a | n/a |
| VF-3 | README.md:664-667 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck `curl https://export.arxiv.org/api/query?id_list=2505.06177,2605.21824` returns "An Empirical Study of Fuzz Harness Degradation" and "Quality-Assured Fuzz Harness Generation via the Four Principles Framework"; `curl https://api.crossref.org/works/10.1109/TSE.2019.2946563` returns "The Art, Science, and Engineering of Fuzzing: A Survey"; `curl -o /dev/null -w %{http_code}` on the committed appsec.guide path → 404, on the `/techniques/` path → 200 | security | confirmed | finding-mark | n/a | n/a |
| VF-4 | README.md:663 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck direct read of `git diff main...HEAD -- README.md`: removed text is `is built.` on a line the diff also rewrites, replacement line ends with a trailing space | code | confirmed | finding-mark | n/a | n/a |
| VF-5 | README.md:663 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck `curl https://export.arxiv.org/api/query?id_list=2603.00539` → title "Are LLMs Reliable Code Reviewers? Systematic Overcorrection in Requirement Conformance Judgement", which the committed title "Overcorrection in LLM-based artifact review" does not match | brand | confirmed | finding-mark | n/a | n/a |
| VF-6 | docs/features/36-verification-contract-hygiene/SPEC.md:183 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck run the row's own cited gate at head: `node --test scripts/*.test.mjs` exits 1 (check-skill-context.test.mjs) and `node scripts/check-skill-context.mjs --routes` exits 1, while the row records `exit 0` | verify | confirmed | finding-mark | n/a | n/a |
| VF-7 | docs/features/36-verification-contract-hygiene/SPEC.md:132-140 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck direct read: every obligation row's status cell reads `planned` while the Progress log records P1-P4 complete and the Evidence rows are filled; no row covers the issue's budget re-basis obligation | workflow | confirmed | finding-mark | n/a | n/a |
| VF-8 | docs/features/36-verification-contract-hygiene/SPEC.md:179-182 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck run AC4's cited command `grep -n "determin" template/docs/fix/_TEMPLATE/SPEC.md` → lines 74 and 80 only, neither being the `**Property / fuzz validators.**` sentence the row claims; AC1/AC3/AC4 cells carry `verified` instead of an exit status | verify | confirmed | finding-mark | n/a | n/a |
| VF-9 | docs/features/ROADMAP.md:46 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck `node scripts/unit-route.mjs 36-verification-contract-hygiene` → `UNIT ROUTE — error` / "every phase … is recorded in its Progress log — re-triage the unit or settle its index status", with the row reading `defined` | workflow | confirmed | finding-mark | n/a | n/a |
| VF-10 | skills/verification-contract/SKILL.md:42-45 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck direct read: sentences 2-3 repeat sentence 1's pin-or-downgrade decision and re-list its examples ("recorded fixture, a fixed dependency version, a seeded PRNG") | code | confirmed | finding-mark | n/a | n/a |
| VF-11 | skills/verification-contract/SKILL.md:45-47 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck read `packages/agentic-workflow-schema/src/verification-contract.ts:221-224` — `fullStageTimeoutMs` is 120 minutes for a whole stage, `fullCommandTimeoutMs` is the 60-minute per-command cap; the schema's published `verification-plan.schema.json` pins the per-command maxima to 600000/3600000 | code | confirmed | finding-mark | n/a | n/a |

| VF-12 | skills/verification-contract/SKILL.md:8,20,52,64 + the nine consumer lines named in F14 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck direct read of each mandate line plus `git log -S` on the two decisions (execute-phase 2bd7c100 2026-09-22, pre-execution-review 5f111ff3 2026-10-05) and the machine surface `scripts/pre-execution-contract.mjs:44` (`required: false`) — the prose contradicts a decision the code already implements | architecture | confirmed | finding-mark | n/a | n/a |
| VF-13 | template/docs/features/_TEMPLATE/SPEC.md:17-21 + docs/fix/_TEMPLATE/SPEC.md:31-33 · reviewer review-change · HEAD f21593eb946aa278edf2a36428825ee35d563d2c · recheck `grep -n "## Acceptance" template/docs/features/_TEMPLATE/SPEC.md docs/fix/_TEMPLATE/SPEC.md` — both sections carry validator wording with no determinism sentence, while template/docs/fix/_TEMPLATE/SPEC.md:74-81 carries both | code | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD f21593eb946aa278edf2a36428825ee35d563d2c | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD f21593eb946aa278edf2a36428825ee35d563d2c | TMPDIR set to a writable tmpfs node --test scripts/*.test.mjs | exit 1 |
| GATE-RAN | HEAD f21593eb946aa278edf2a36428825ee35d563d2c | node scripts/check-skill-context.mjs --routes | exit 1 |
| GATE-RAN | HEAD f21593eb946aa278edf2a36428825ee35d563d2c | node scripts/version-parity-gate.mjs --content --base main | exit 1 |
| GATE-RAN | HEAD f21593eb946aa278edf2a36428825ee35d563d2c | node scripts/golden-fixture.test.mjs | exit 0 |
| GATE-RAN | HEAD f21593eb946aa278edf2a36428825ee35d563d2c | bun scripts/check-skill-context.mjs | exit 0 |

Non-ledger destinations (never persisted here, per D3): report-notes F12 (template
mirror duplicates "deterministic, bounded" and names no published surface), F13
(CHANGELOG row inserted second instead of newest-first), F16 (unit doc `## Next`
still routes to `/execute-phase … P1`), F17 (Evidence table nested under
`## Triaged steps`). Refuted: "the README bibliography costs an agent route's
context" — no route in `SKILL_CONTEXT_BUDGETS.json` loads `README.md`.

## Owner scope directive — 2026-10-18

F14 and F15 were first classified `proposal` (independent of the unit's frozen
ACs). The product owner directed on 2026-10-18 that both are **fix-now and
inside feature 36's scope**, on the ground that these skills are the ones used to
add every new feature. Both rows were therefore persisted above (F14 `med`,
F15 `med` by owner materiality call; reviewer severity for F15 was `low`).
`node scripts/unit-route.mjs 36-verification-contract-hygiene` prints `route:
fold` over the open rows, so no replan is needed: the fold repairs them, F10/F11
first, then the contract migration (F14) and the two template mirrors (F15). The
unit's frozen ACs are unchanged; this directive widens the repair batch, not the
acceptance set.

## Cycle 2 — 2026-10-18

Cycle 2 ran (review-change) on candidate `HEAD 636341e8fb82bb82b45187daf668cf1874b10337`,
clean workspace, no PR (pre-PR checkpoint). Applicable passes ran isolated:
`review-code`, `review-security`, `review-verify`, `review-perf`, `review-brand`;
skipped with reasons — `review-design`/`review-a11y`/`review-seo` (no UI, no web
surface). Synthesis, classification (`review-implementation`) and the debt
transform (`review-debt`) each ran isolated. Delta mode escalated to a full pass
on **Size** (fold diff `f21593eb..HEAD` = 223 added + 101 deleted = 324 changed
lines > 200; 17 files > 15). Gate at head: root suites exit 0 (693/693),
`--routes` exit 0 (14 routes), `check-skill-context` exit 0 (28 skills),
golden-fixture exit 0 (12/12), version-parity content PASS (0.21.0→0.22.0),
schema `bun run test` exit 0 (717 pass), pi package `bun run test` exit 0 (432 pass).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F18 | skills/verification-contract/SKILL.md:8-9,22,56; skills/review-change/SKILL.md:62; skills/review-change/references/REVIEW_PROCESS.md:56; skills/pre-execution-review/references/{LEDGERS.md:58,150,POLICY.md:66,152,SNAPSHOT.md:64}; skills/review-implementation/references/CLASSIFY.md:45; skills/workflow-status/references/PRE_EXECUTION.md:27 | code, architecture | high | fix-now | fold into current unit: rename every `ACCEPTANCE.md` era label from "lane-era" to "legacy/pre-lane (pre-feature 61)" across the nine cited files; fix `REVIEW_PROCESS.md:56`'s `(post-feature 61)` parenthetical; keep "lane-era" only for the unit-doc branch. The repo's own vocabulary is `SNAPSHOT.md:34` ("pre-lane artifact"), `docs/fix/285-pre-execution-lineage-gate/SPEC.md:17-18,36` and `docs/LOGS.md:2601` — lane-era units never write `ACCEPTANCE.md`, and `SNAPSHOT.md:64` now contradicts `:34` | yes · fold af67eb9e54cfd95eef7b12406a6905d7e1abbd23 + 1b764942a83d25c7e66b9a85f8793d42f1e40c30 + 636341e8f9721d45a12674e2426a9d79f35d563d |
| F19 | skills/pre-execution-review/references/LEDGERS.md:150 + skills/verification-contract/SKILL.md:64-65 | verify, code | high | fix-now | fold into current unit: replace the non-executable `git hash-object --no-index -- <SPEC>:## Acceptance criteria` with a runnable derivation (e.g. `sed -n '/^## Acceptance criteria/,/^## /p' <unit>/SPEC.md \| git hash-object --stdin`) and state the same command in `verification-contract` § Freeze and receipt | yes · fold af67eb9e54cfd95eef7b12406a6905d7e1abbd23 + 1b764942a83d25c7e66b9a85f8793d42f1e40c30 + 636341e8f9721d45a12674e2426a9d79f35d563d |
| F20 | skills/verification-contract/SKILL.md:56-73,76-88 | architecture, workflow | high | fix-now | fold into current unit: give the post-61 receipt one owner — either wire `execute-phase` to write it and make the stop/repair block artifact-neutral, or declare the Evidence table the receipt and delete the new block plus the duplicate generic block at `:73`; then record unit 36's receipt or its declared absence | yes · fold af67eb9e54cfd95eef7b12406a6905d7e1abbd23 + 1b764942a83d25c7e66b9a85f8793d42f1e40c30 + 636341e8f9721d45a12674e2426a9d79f35d563d |
| F21 | skills/audit-pr/SKILL.md; skills/pre-execution-review/SKILL.md; skills/review-change/SKILL.md; skills/review-implementation/SKILL.md; skills/workflow-status/SKILL.md; CHANGELOG.md | workflow | high | fix-now | fold into current unit: bump each changed skill's `version:` (patch for reference-only wording, minor for a contract change) and add its CHANGELOG row — `review-change` is the indisputable one (its SKILL.md changed); the other four changed references · undefined 54fbf64 | yes · fold 54fbf64754cdb398ac26f140b2846352ae48c8c4 |
| F22 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:160,184,210,233,257,280,304,360,393,426,459 | perf, verify | med | fix-now | fold into current unit: re-measure `--routes` and rewrite each declared base/ceiling to the true `ceil(measured×1.10)`; drop `execute-phase/SKILL.md` + `EXECUTION_CONTRACT.md:127` from the growth-source text (the branch never changed them) · undefined 52e917c | yes · fold 52e917c10232dd752b053458516c3265643c8dd5 |
| F23 | CHANGELOG.md:736 | brand, verify | med | fix-now | fold into current unit: name the per-command caps (`fastCommandTimeoutMs` 10 min / `fullCommandTimeoutMs` 60 min) or point at the schema's per-command `timeoutMs`; move the consumer-migration claim to the rows of the five skills that changed · undefined 54fbf64 | yes · fold 54fbf64754cdb398ac26f140b2846352ae48c8c4 + 52e917c10232dd752b053458516c3265643c8dd5 |
| F24 | template/docs/fix/_TEMPLATE/SPEC.md:74-81 + template/docs/features/_TEMPLATE/SPEC.md:23-30 | code, brand | med | fix-now | fold into current unit: drop "the schema package" from both exported templates (AC4 needs only "bounded runtime") and use the same post-F10 determinism sentence in both · undefined 97d2672 | yes · fold 97d26727e1822617439378c05844feead0aa76f7 |
| F25 | docs/features/36-verification-contract-hygiene/SPEC.md:178,180,184 | verify | med | fix-now | regression of F8 → fold into current unit: re-record AC1/AC3 with the actual lines (44/49) and re-label the AC7 version-parity cite as a gate row with its command and exit 0 · undefined 97d2672 | yes · fold 97d26727e1822617439378c05844feead0aa76f7 |
| F26 | docs/features/36-verification-contract-hygiene/review-findings.md:24,70-78 (F9) + scripts/unit-route.mjs:606-608 | workflow | med | fix-now | regression of F9 → fold into current unit: make the F9 claim reproduce — either add a close-out/review route for a fully-executed, ledger-clean `in-progress` unit or record the residual and settle the index/`Next` state. The check is the reviewed head's own ledger (`git show 636341e8:docs/features/36-verification-contract-hygiene/review-findings.md` — every row folded, no open rows) plus `node scripts/unit-route.mjs 36-verification-contract-hygiene` at that head → exit 1; a later open-row ledger routes `fold` for a different reason and does not prove F9 · undefined 97d2672 | yes · fold 97d26727e1822617439378c05844feead0aa76f7 |
| F27 | README.md:664-667 | brand | med | fix-now | fold into current unit: replace the four entries with issue #183's bibliography as printed — full author lists, original `"Writing harnesses"` title · undefined 97d2672 | yes · fold 97d26727e1822617439378c05844feead0aa76f7 |

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| VF-14 | skills/verification-contract/SKILL.md:8-9,22,56 + the consumer lines named in F18 · reviewer review-change · HEAD 636341e8fb82bb82b45187daf668cf1874b10337 · recheck direct read of the nine labels against `skills/pre-execution-review/references/SNAPSHOT.md:34` ("pre-lane artifact"), `docs/fix/285-pre-execution-lineage-gate/SPEC.md:17-18,36` and `docs/LOGS.md:2601`; the contradiction is `SNAPSHOT.md:64` vs `:34` | architecture | confirmed | finding-mark | n/a | n/a |
| VF-15 | skills/pre-execution-review/references/LEDGERS.md:150 · reviewer review-change · HEAD 636341e8fb82bb82b45187daf668cf1874b10337 · recheck reproducible command output: `git hash-object --no-index -- docs/features/36-verification-contract-hygiene/SPEC.md:##\ Acceptance\ criteria` → `error: unknown option 'no-index'`, exit 129 (`hash-object` also has no `path:section` selector) | verify | confirmed | finding-mark | n/a | n/a |
| VF-16 | skills/verification-contract/SKILL.md:56-73,76-88 · reviewer review-change · HEAD 636341e8fb82bb82b45187daf668cf1874b10337 · recheck `grep -rn "Acceptance receipt\|acceptance-criteria" skills/execute-phase` → no match; `grep -rn "Acceptance receipt\|Blob:" docs/features/36-verification-contract-hygiene/` → no match; unit docs 73/75/76 carry none; `execute-phase/SKILL.md:14-15` names Evidence rows as the receipts | architecture | confirmed | finding-mark | n/a | n/a |
| VF-17 | the five SKILL.md frontmatter versions + CHANGELOG.md · reviewer review-change · HEAD 636341e8fb82bb82b45187daf668cf1874b10337 · recheck `git show main:skills/<s>/SKILL.md \| grep '^version:'` vs HEAD: audit-pr 5.6.0=5.6.0, pre-execution-review 2.7.0=2.7.0, review-change 3.12.0=3.12.0, review-implementation 1.11.0=1.11.0, workflow-status 3.9.1=3.9.1; only verification-contract 1.3.0→1.4.0 | workflow | confirmed | finding-mark | n/a | n/a |
| VF-18 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:360,393,426,459 + :210 · reviewer review-change · HEAD 636341e8fb82bb82b45187daf668cf1874b10337 · recheck `node scripts/check-skill-context.mjs --routes` at HEAD: review-change:adversarial 18977/1360 (declared 18992/1361), default-backend 17324/1252 (declared 17339/1253), default-web same, synthesize 17793/1274 (declared 17808/1275); `:210` declares `ceil(11052×1.1)=12157` for committed 12158; `git diff --name-only main...HEAD \| grep execute-phase` → empty while 7 sources entries name it | perf | confirmed | finding-mark | n/a | n/a |
| VF-19 | CHANGELOG.md:736 · reviewer review-change · HEAD 636341e8fb82bb82b45187daf668cf1874b10337 · recheck direct read against `packages/agentic-workflow-schema/src/verification-contract.ts:221-224` (per-command caps `fastCommandTimeoutMs`/`fullCommandTimeoutMs`; `fullStageTimeoutMs` is the whole-stage sum) and `CHANGELOG.md:100` | brand | confirmed | finding-mark | n/a | n/a |
| VF-20 | template/docs/fix/_TEMPLATE/SPEC.md:74-81 + template/docs/features/_TEMPLATE/SPEC.md:23-30 · reviewer review-change · HEAD 636341e8fb82bb82b45187daf668cf1874b10337 · recheck direct read: both exported templates name "the schema package"; the fix template uses the pre-F10 long determinism wording while the skill and features template use the dedup wording; unit-doc AC4 requires only "bounded runtime" | code | confirmed | finding-mark | n/a | n/a |
| VF-21 | docs/features/36-verification-contract-hygiene/SPEC.md:178,180,184 · reviewer review-change · HEAD 636341e8fb82bb82b45187daf668cf1874b10337 · recheck `grep -n "Validator determinism"` → 44, `grep -n "Property / fuzz"` → 49 against the rows' "lines 36+"/"line 45"/"line 45"; AC7 credits version-parity to AC2, which is the template mirror | verify | confirmed | finding-mark | n/a | n/a |
| VF-22 | docs/features/36-verification-contract-hygiene/review-findings.md:24,70-78 · reviewer review-change · HEAD 636341e8fb82bb82b45187daf668cf1874b10337 · recheck reproducible command output at the reviewed head with its own (pre-review) ledger: `git show 636341e8:docs/features/36-verification-contract-hygiene/review-findings.md` has every row folded, and `node scripts/unit-route.mjs 36-verification-contract-hygiene` at that head → `UNIT ROUTE — error` / "every phase … is recorded in its Progress log", exit 1; the ledger asserts `route: fold` and "stops refusing the unit" | workflow | confirmed | finding-mark | n/a | n/a |
| VF-23 | README.md:664-667 · reviewer review-change · HEAD 636341e8fb82bb82b45187daf668cf1874b10337 · recheck direct read against `gh issue view 183` bibliography: author lists truncated to "et al." and `"Writing Fuzzing Harnesses"` replaces the printed `"Writing harnesses"` | brand | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD 636341e8fb82bb82b45187daf668cf1874b10337 | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 636341e8fb82bb82b45187daf668cf1874b10337 | TMPDIR set to a writable tmpfs node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD 636341e8fb82bb82b45187daf668cf1874b10337 | node scripts/check-skill-context.mjs --routes | exit 0 |
| GATE-RAN | HEAD 636341e8fb82bb82b45187daf668cf1874b10337 | node scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD 636341e8fb82bb82b45187daf668cf1874b10337 | node scripts/golden-fixture.test.mjs | exit 0 |
| GATE-RAN | HEAD 636341e8fb82bb82b45187daf668cf1874b10337 | node scripts/version-parity-gate.mjs --content --base main | exit 0 |
| GATE-RAN | HEAD 636341e8fb82bb82b45187daf668cf1874b10337 | (packages/agentic-workflow-schema) bun run test | exit 0 |
| GATE-RAN | HEAD 636341e8fb82bb82b45187daf668cf1874b10337 | (packages/pi-agentic-workflow) bun run test | exit 0 |

Cycle-2 re-verification of cycle-1 folded rows: F2, F4, F5, F7, F10 fixed;
F1, F3, F6, F11, F14, F15 repaired for their original defect with a residual
now filed as F22, F27, F25, F23, F18–F20 and F24 respectively; F8 and F9 are
**regressions** (F25, F26 — the cited check still does not reproduce). Report
notes, never persisted: S11 (determinism examples illustrative), S12 (roadmap
numbering leaks into the installable skill), S13 (fold widened scope without a
dated `## Amendments` row), S14 (`execute-phase:unit-loop` ceiling has double the
declared headroom; pre-existing on `main`, untouched). Refuted: the
security pass's "Manès et al. TSE'19 should read 2021" — issue #183's own
bibliography prints "IEEE Transactions on Software Engineering, 2019,
doi:10.1109/TSE.2019.2946563", so the committed year follows the issue's
authority. Every finding has a destination; this review creates no backlog.

## Cycle 3 — 2026-10-19

Cycle 3 ran (review-change) on candidate `HEAD d85eeb4040df9e28e2426de371b7a958f566a01c`,
clean workspace, no PR (pre-PR checkpoint). The preceding fold batch escalated
delta mode to a **full pass on Size**: fold diff `636341e8..HEAD` = 160 added +
70 deleted = 230 changed lines (> 200) across 22 files (> 15). Applicable passes
ran isolated: `review-code`, `review-security`, `review-verify`, `review-perf`,
`review-brand`; skipped with reasons — `review-design`/`review-a11y`/`review-seo`
(no UI, no web surface: the repo ships markdown skills and a docs scaffold).
Synthesis, classification (`review-implementation`) and the debt transform
(`review-debt`) each ran isolated. Gate at head: root suites **exit 1** (693
tests, 684 pass, 9 fail), `check-skill-context` exit 0, `--routes` exit 0 (14
routes), golden-fixture exit 0, version-parity content PASS, schema package 717
pass exit 0, pi package 432 pass exit 0. The 9 failures are branch-introduced:
the same two files are 29/29 green at `main` `9bd272e9`.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F28 | scripts/normative-drift.test.mjs:886-1032 + scripts/ledger-ownership.test.mjs:482-646 | verify | high | fix-now | fold into current unit: repair F29 + F30, then re-run all seven gate commands at the repaired head and record fresh GATE-RAN marks; AGENTS.md § Verification defines green as the root suite passing · undefined 50f359d | yes · fold 50f359da |
| F29 | skills/pre-execution-review/references/LEDGERS.md:150 | code | high | fix-now | regression of F19 → fold into current unit: the `acceptance-manifest` validator cell carries an escaped pipe (`sed … \| git hash-object --stdin`), so the `ledger-ownership@1` row parses 7 cells instead of 6 (`awk -F'\|'` → 7 at head, 6 at 1b764942) and `ledger-ownership.test.mjs` fails 6 of 11; keep one command form in the cell and move the era split into prose · undefined e7b1c1e | yes · fold e7b1c1eb |
| F30 | CHANGELOG.md:211,476,566 | workflow | high | fix-now | regression of F21 → fold into current unit: the three patch versions were added name-prefixed into the `\| Version \| Date \| Type \| What changed \|` tables, so `versionCells()` (`^\|\s*(\d+\.\d+\.\d+)\s*\|`) never reads them and `newestVersionCell` still returns 5.6.0 / 3.12.0 / 3.9.1 against frontmatter 5.6.1 / 3.12.1 / 3.9.2; write the rows in the section's own shape and drop the copies · undefined e7b1c1e | yes · fold e7b1c1eb |
| F31 | scripts/unit-route.mjs:745-757 | code | high | fix-now | fold into current unit: the close-out guard fires for any status that is not `done`/`absent` once all phases are recorded — reproducer (fixture roadmap row set to `defined`, both phases recorded) returns `route: close-out` / `/audit-pr` exit 0 where `main` refuses with exit 1 — and it re-runs the `readProject` + `parseUnitDocPhases` + `recordedPhases` derive that `firstUnfinishedPhase` already owns; gate the branch on the in-progress status and return the unfinished list from one helper · undefined f85567c | yes · fold f85567cd |
| F32 | docs/features/36-verification-contract-hygiene/SPEC.md:183-184 | verify | high | fix-now | regression of F25 → fold into current unit: both AC7 Evidence rows record `exit 0` while `node --test scripts/*.test.mjs` exits 1 at this head, and the AC6 row was replaced instead of kept, so O5's `required-evidence: Evidence row AC6` points at no row (the table carries AC7 twice); re-record one AC7 row with the real exits and restore the AC6 row · undefined 50f359d | yes · fold 50f359da |
| F33 | docs/features/36-verification-contract-hygiene/SPEC.md:206-212 | workflow | med | fix-now | replan-in-unit (plan route): `## Next` claims the gate was "re-verified green at the settled head f03fc673", which is not in this branch (`git cat-file -t` unresolvable) and whose suite is red anyway; rewrite it at the reviewed head with the real gate state and the router's close-out route · undefined b86d148 | yes · fold b86d1482 |
| F34 | skills/verification-contract/SKILL.md:66-70 | architecture | med | fix-now | regression of F20 → fold into current unit: the post-feature-61 `## Acceptance receipt v1` block still declares a receipt nothing writes (`grep -rn "Acceptance receipt" docs/features/` → none; `execute-phase/SKILL.md:13-15` names the Evidence rows the receipts), so the stop/repair block keys on a phantom artifact; give it one owner — declare the Evidence table the receipt and delete the block, or wire the executor to write it · undefined ea4ce05 | yes · fold ea4ce056 |
| F35 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:118-120 | code | med | fix-now | fold into current unit: `af67eb9e` appended a remedy sentence mid-bullet after the `→ Next: /unit-lane <unit>` clause with no terminator, so it runs into the sibling `- Lane-era path` bullet, and the same remedy already exists at `:159`; delete the appended clause or place it deliberately in the ACCEPTANCE-GATE block · undefined 320bf18 | yes · fold 320bf180 |
| F36 | README.md:663-666 | brand | med | fix-now | regression of F27 → fold into current unit: the three citations still truncate the issue #183 author lists to "Görz et al." / "Sheng et al." / "Manès et al."; `gh issue view 183` prints the full lists and the ledger's own directive was "full author lists" · undefined 5eae849 | yes · fold 5eae8492 |
| F37 | template/docs/features/_TEMPLATE/SPEC.md:30 + template/docs/fix/_TEMPLATE/SPEC.md:81 | architecture | med | fix-now | regression of F24 → fold into current unit: both exported templates keep this repository's nouns ("within the timeout budgets published by the schema package", "rides the existing commands class"), which F24 asked to drop and AGENTS.md forbids in shared docs; state the bound without repo-specific vocabulary · undefined 8a7664c | yes · fold 8a7664cc |
| F38 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:162,186,212,235,259,348 | perf | med | fix-now | regression of F22 → fold into current unit: the new `unit 36 / feature 36` growth entries cite `execute-phase/references/EXECUTION_CONTRACT.md` and `execute-phase/SKILL.md`, neither of which the branch changed (`EXECUTION_CONTRACT.md` mentions: 8 on `main`, 15 at head), and the review-change entries state `ceil(<already-ceiled value> × 1.10)` (`:348` "ceil(1360 × 1.10) = 1496 lines" for a measured 1355); name the real growth source (`skills/verification-contract/SKILL.md`) and state the pre-re-basis measurement · undefined 0914a01 | yes · fold 0914a011 |
| F39 | skills/verification-contract/SKILL.md:22 | brand | med | fix-now | regression of F18 → fold into current unit: the rewritten branch still reads as a present-tense mandate ("Legacy (pre-feature 61) units: every new feature/fix carries a frozen `ACCEPTANCE.md` … Copy the matching repository template") for an artifact `execute-phase/SKILL.md:13-14` declares gone and a template that does not exist (`find template -iname "*acceptance*"` → empty); restate as binding-if-present and drop the template instruction · undefined ea4ce05 | yes · fold ea4ce056 |

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| VF-24 | scripts/normative-drift.test.mjs:886-1032 + scripts/ledger-ownership.test.mjs:482-646 · reviewer review-change · HEAD d85eeb4040df9e28e2426de371b7a958f566a01c · recheck run `TMPDIR=$(mktemp -d) node --test scripts/*.test.mjs` at head (exit 1, 693 tests / 684 pass / 9 fail) and the two files in a detached `origin/main` worktree at 9bd272e9 (29/29 pass, exit 0) | verify | confirmed | finding-mark | n/a | n/a |
| VF-25 | skills/pre-execution-review/references/LEDGERS.md:150 · reviewer review-change · HEAD d85eeb4040df9e28e2426de371b7a958f566a01c · recheck `sed -n '150p' … \| awk -F'\|' '{print NF}'` → 7 at head vs 6 at 1b764942; `node --test scripts/ledger-ownership.test.mjs` → 6 fail at head, 11/11 at 1b764942 | code | confirmed | finding-mark | n/a | n/a |
| VF-26 | CHANGELOG.md:211,476,566 · reviewer review-change · HEAD d85eeb4040df9e28e2426de371b7a958f566a01c · recheck `node --test scripts/normative-drift.test.mjs` → 3 fail naming "restates audit-pr as 5.6.0 while its frontmatter says 5.6.1" (review-change 3.12.0/3.12.1, workflow-status 3.9.1/3.9.2 likewise); the same file is 18/18 at 1b764942 | workflow | confirmed | finding-mark | n/a | n/a |
| VF-27 | scripts/unit-route.mjs:745-757 · reviewer review-change · HEAD d85eeb4040df9e28e2426de371b7a958f566a01c · recheck fixture copy of `scripts/fixtures/unit-route` with roadmap row 13 set to `defined` and both phases recorded: head → `status: defined` `route: close-out` `next: /audit-pr` exit 0; the same tree under `origin/main`'s router → `UNIT ROUTE — error` "every phase … is recorded in its Progress log — re-triage the unit or settle its index status" exit 1 | code | confirmed | finding-mark | n/a | n/a |
| VF-28 | docs/features/36-verification-contract-hygiene/SPEC.md:183-184 · reviewer review-change · HEAD d85eeb4040df9e28e2426de371b7a958f566a01c · recheck `awk '/^## Evidence/,/^## Triaged steps/'` → two AC7 rows reading `exit 0` while the root suite exits 1 at head, and `grep -n "AC6"` shows lines 73/93/140 only — no `\| AC6 \|` Evidence row | verify | confirmed | finding-mark | n/a | n/a |
| VF-29 | docs/features/36-verification-contract-hygiene/SPEC.md:206-212 · reviewer review-change · HEAD d85eeb4040df9e28e2426de371b7a958f566a01c · recheck `git cat-file -t f03fc673` → "Not a valid object name"; head is d85eeb40; `node scripts/unit-route.mjs 36-verification-contract-hygiene` → `route: close-out` `next: /audit-pr` | workflow | confirmed | finding-mark | n/a | n/a |
| VF-30 | skills/verification-contract/SKILL.md:66-70 · reviewer review-change · HEAD d85eeb4040df9e28e2426de371b7a958f566a01c · recheck `grep -rn "Acceptance receipt" docs/features/` → no match; `grep -rn "Acceptance receipt\|acceptance-criteria" skills/execute-phase` → no match; `execute-phase/SKILL.md:13-15` names Evidence rows as the receipts | architecture | confirmed | finding-mark | n/a | n/a |
| VF-31 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:118-120 · reviewer review-change · HEAD d85eeb4040df9e28e2426de371b7a958f566a01c · recheck direct read of `:113-121` (the appended clause follows the `→ Next: /unit-lane <unit>` parenthetical with no terminator and is immediately followed by `- **Lane-era path**`); `git blame` → af67eb9e; the same remedy is stated at `:159` | code | confirmed | finding-mark | n/a | n/a |
| VF-32 | README.md:663-666 · reviewer review-change · HEAD d85eeb4040df9e28e2426de371b7a958f566a01c · recheck `gh issue view 183` bibliography against the committed lines: the issue prints "Philipp Görz, Joschua Schilling, Nicolai Bissantz, and Thorsten Holz", "Ze Sheng, Dmitrijs Trizna, Luigino Camastra, Zhicheng Chen, Qingxiao Xu, and Jeff Huang", "V. J. M. Manès, H. Han, C. Han, S. K. Cha, M. Egele, E. J. Schwartz, and M. Woo"; README says "Görz et al." / "Sheng et al." / "Manès et al." | brand | confirmed | finding-mark | n/a | n/a |
| VF-33 | template/docs/features/_TEMPLATE/SPEC.md:30 + template/docs/fix/_TEMPLATE/SPEC.md:81 · reviewer review-change · HEAD d85eeb4040df9e28e2426de371b7a958f566a01c · recheck `grep -n "schema package\|existing commands class" template/docs/*/_TEMPLATE/SPEC.md` → both files; `git show f2dbd40a -- template/` keeps "budgets published by the schema package." and appends the commands-class sentence | architecture | confirmed | finding-mark | n/a | n/a |
| VF-34 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:162,186,212,235,259,348 · reviewer review-change · HEAD d85eeb4040df9e28e2426de371b7a958f566a01c · recheck `git diff --stat main...HEAD` lists neither EXECUTION_CONTRACT.md nor execute-phase/SKILL.md; `grep -c EXECUTION_CONTRACT` → 8 on `main`, 15 at head; `:348` states "ceiling = ceil(1360 x 1.10) = 1496 lines" for a measured 1355 lines / 18977 est | perf | confirmed | finding-mark | n/a | n/a |
| VF-35 | skills/verification-contract/SKILL.md:22 · reviewer review-change · HEAD d85eeb4040df9e28e2426de371b7a958f566a01c · recheck direct read against `skills/execute-phase/SKILL.md:13-14` ("ACCEPTANCE.md is gone") and `find template -iname "*acceptance*"` → empty, the unit's own PE-002 | brand | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD d85eeb4040df9e28e2426de371b7a958f566a01c | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD d85eeb4040df9e28e2426de371b7a958f566a01c | TMPDIR set to a writable tmpfs node --test scripts/*.test.mjs | exit 1 |
| GATE-RAN | HEAD d85eeb4040df9e28e2426de371b7a958f566a01c | node scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD d85eeb4040df9e28e2426de371b7a958f566a01c | node scripts/check-skill-context.mjs --routes | exit 0 |
| GATE-RAN | HEAD d85eeb4040df9e28e2426de371b7a958f566a01c | node scripts/golden-fixture.test.mjs | exit 0 |
| GATE-RAN | HEAD d85eeb4040df9e28e2426de371b7a958f566a01c | node scripts/version-parity-gate.mjs --content --base main | exit 0 |
| GATE-RAN | HEAD d85eeb4040df9e28e2426de371b7a958f566a01c | (packages/agentic-workflow-schema) bun run test | exit 0 |
| GATE-RAN | HEAD d85eeb4040df9e28e2426de371b7a958f566a01c | (packages/pi-agentic-workflow) bun run test | exit 0 |

Cycle-3 re-verification of cycle-2 folded rows: F18/F21/F23/F26 (label rename,
version bumps, CHANGELOG 1.4.0 row, budget hygiene) landed as intended; F19,
F20, F22, F24, F25, F27 are **regressions** — the fold's own bytes re-open the
defect (F29, F34, F38, F37, F32, F36). The new F31 (unit-route fail-open) is the
F26 repair's own defect.

Report notes, never persisted (`low`, report-only): the CHANGELOG 3.12.1 row says
"`SKILL.md` **description**" for a body-prose edit at `skills/review-change/SKILL.md:62`,
and the 1.11.1 row says the label became "legacy" where `CLASSIFY.md:45` writes no
parenthetical; the ledger's F24/F25/F27 `fold 97d26727…` provenance names a commit
that touches only `scripts/unit-route.mjs` (the template/README/SPEC folds landed
in f2dbd40a); the acceptance-manifest `sed` recipe hashes an empty stream
(`e69de29b`) and exits 0 when the unit doc has no `## Acceptance criteria` section,
and its `<unit>` path is unquoted. Debt transform (`review-debt`) attached
TRIGGERs to the last two.

Refuted (verified false, reported with counter-evidence, never persisted):
"origin/main is independently red in 8 suites / 57 tests" — a fresh detached
worktree lacks the gitignored `packages/agentic-workflow-schema/dist/`, and
`scripts/schema-runtime.mjs:37` refuses to load without it; the two files that
fail at head are 29/29 green in that same worktree. "9ad8e50b deleted the
released `audit-pr` 5.6.0 / `review-change` 3.12.0 / `workflow-status` 3.9.1
rows" — they are present at CHANGELOG.md:567/477/212. "The features template
carries no property/fuzz sentence" — it does, at
`template/docs/features/_TEMPLATE/SPEC.md:28-30`. "The
`sed -n '/^## Acceptance criteria/,/^## /p'` range stops at the section's own
first line" — it yields the same 43 lines as a section slice (the end pattern is
first tested after the start line). "The new era labels contradict SNAPSHOT.md" —
`SNAPSHOT.md:34-38` already pairs "pre-lane artifact" (`ACCEPTANCE.md`) with
"lane-era unit" (unit doc), which is exactly the fold's labelling. "The three
`#291 F8` tests were weakened" — their exit-code assertions were inverted with
the delivered behaviour change, not deleted.

Every finding has a destination; this review creates no backlog.

## Cycle 4 — 2026-10-19

Cycle 4 ran (review-change) on candidate `HEAD 77280bea15562850040e35f8f257bd02af0cc6c1`,
clean workspace, no PR (pre-PR checkpoint). **Cycle 4 is past the two-cycle cap**
and ran because the user invoked it explicitly; the residue routes to
`/triage-issue --prioritize-now` rather than a fifth review→fold cycle.
Delta mode against cycle 3's reviewed head `d85eeb40` escalated to a **full pass
on Size**: fold diff `d85eeb40..HEAD` = 393 added + 115 deleted = 508 changed
lines (> 200) across 14 files. Applicable passes ran isolated: `review-code`,
`review-security`, `review-verify`, `review-perf`, `review-brand`; skipped with
reasons — `review-design`/`review-a11y`/`review-seo` (no UI, no web surface: the
repo ships markdown skills, a docs scaffold, and node scripts). Synthesis,
classification (`review-implementation`) and the debt transform (`review-debt`)
each ran isolated. Gate at head: root 695 pass / 0 fail exit 0,
`check-skill-context` 28 skills exit 0, `--routes` 14 routes exit 0,
golden-fixture 12/12 exit 0, version-parity content PASS (0.21.0→0.22.0) exit 0,
schema 717 pass exit 0, pi 432 pass exit 0, normative-drift 18/18,
ledger-ownership 11/11, unit-route 44/44.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F40 | scripts/unit-route.mjs:598-604,762-773 | code, security | high | fix-now | regression of F31 → fold into current unit: `unfinishedPhases` returns ONE empty set for "doc absent / no `## Tasks` — untouched work routes to P1" (its own docstring) and "all phases recorded"; the new close-out guard reads it as proof of the latter and refuses with that unverified claim. Reproducer: a unit doc whose `## Tasks` heading is absent → `UNIT ROUTE — error … has all phases recorded but status is 'in-progress'` at head where `main` routed `route: execute` / `/execute-phase <unit> P1`. Return a discriminated result (`absent \| empty \| unfinished`) and consume it at both call sites · undefined 320bf18 | yes · fold 320bf180 |
| F41 | scripts/unit-route.mjs:621,764 | code | med | fix-now | fold into current unit: two dead predicates from the same P6 repair — `firstUnfinishedPhase`'s `if (unfinished.length === 0) fail(...)` is the negation of the `donePhases.size === 0` guard two lines above it, and `if (status === "done")` is nested inside the `else` of `else if (status === "done")` so it can never run. Delete both; F40's single-helper rewrite makes them redundant anyway · undefined 320bf18 | yes · fold 320bf180 |
| F42 | skills/review-change/references/REVIEW_PROCESS.md:34-35 | code, architecture, verify | med | fix-now | fold into current unit: delta-mode step 3 still makes "the sibling acceptance-manifest `ACCEPTANCE.md` blob recomputed to an **exact match** … unchanged and still mandatory" a precondition for every unit, while step 2 in the same file was migrated to the unit-doc acceptance source at `:56`; the text is branch-added (`e28ff213`). Unsatisfiable for every post-feature-61 unit — rewrite it onto "the step-2 acceptance artifact", the F34/F39 class in a sibling line · undefined c309345 | yes · fold c3093453 |
| F43 | docs/features/36-verification-contract-hygiene/SPEC.md:217-219,240,244,247 | verify, workflow | med | fix-now | fold into current unit: the `## Evidence` heading is empty and its table is nested under `## Triaged steps`, and three rows carry unescaped `\|` so they split into 10/7/7 cells — the `Exit / digest` cells of P5, P9 and AC6 hold table fragments and author names instead of exit codes · undefined 0e43990 | yes · fold 0e43990c |
| F44 | docs/features/36-verification-contract-hygiene/SPEC.md:146-150 | verify, workflow | high | fix-now | regression of F32 → fold into current unit: obligations O10–O14 still read `planned` although every evidence target exists, and O14's `required-evidence: Evidence row P12` resolves to no row at all (`grep -nE "^\| P12 \|" SPEC.md` → no match) · undefined b44bc14 | yes · fold b44bc14f |
| F45 | docs/features/36-verification-contract-hygiene/review-findings.md (tail) | verify, workflow | high | fix-now | regression of F28 → fold into current unit: no `GATE-RAN` mark exists at the reviewed head (newest are at `d85eeb40`) although P12's Task and Progress entry claim fresh marks were appended and O14 requires them; all seven gate commands do exit 0 at `77280bea` | yes · fold ccf54694 |
| F46 | docs/features/36-verification-contract-hygiene/review-findings.md:27-29,96-98 | verify, code | med | fix-now | fold into current unit: F18–F27 appear in two tables, so `node scripts/ledger-provenance.mjs <ledger> --check` exits 1 with "10 row(s) the 7-column schema refused were read by nothing" | yes · fold ccf54694 |
| F47 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:162,186,212,235,259 | perf, code | med | fix-now | regression of F38 → fold into current unit: the seven `execute-phase:*` `unit 36 / feature 36` growth entries still name `execute-phase/SKILL.md:13-14,22` and `execute-phase/references/EXECUTION_CONTRACT.md:127`, and `git diff --name-only main...HEAD \| grep execute-phase` is empty; P11 repaired the `feature 60 P3` entries and left these · undefined 0914a01 | yes · fold 0914a011 |
| F48 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:212,348,355 + skills/verification-contract/SKILL.md | perf, brand | med | fix-now | regression of F22 + F38 → fold into current unit: `ceil(1360 x 1.10) = 1496` is stated but equals 1497, and 1360 is the already-ceiled feature-60 value rather than the measured 1355; `ceil(11052 x 1.10) = 12157` where the true value is 12158; and the entries state the skill "grew to 1459 est" where it measures 1460 est / 116 lines · undefined 0914a01 | yes · fold 0914a011 |
| F49 | CHANGELOG.md:742 + scripts/normative-drift.test.mjs:771-785,703 | workflow, brand, verify | high | fix-now | fold into current unit: `verification-contract` frontmatter is 1.4.1 but its newest CHANGELOG row is 1.4.0 and no 1.4.1 row exists, although P7's Evidence row claims "version bumped 1.4.0→1.4.1 + CHANGELOG row". The reason a green gate missed it: `versionCells()` only collects rows under a `#### \`<skill>\`` heading, and no such heading exists for `verification-contract` (its rows live in the shared `### Internal` table with the name in the first column), so `newestVersionCell` returns null and the `version-tables` claim at `rendered-facts@1` is skipped for every internal skill. Add the 1.4.1 row and make the claim read that table shape · undefined c309345 | yes · fold c3093453 |
| F50 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:119-120 | code, brand, verify | med | fix-now | regression of F35 → fold into current unit: the P8 fold replaced the `)` closing the parenthetical opened at `:99` with `.` (so it stays unclosed) and left the remedy sentence running into the sibling `- **Lane-era path**` bullet; `CHANGELOG.md:566` then ships an audit-pr 5.6.2 row claiming the bullet was terminated · undefined 320bf18 | yes · fold 320bf180 |
| F51 | skills/verification-contract/SKILL.md:51 | architecture, brand | med | fix-now | fold into current unit: branch-added repo-specific noun in an installable skill — "within the timeout budgets published by the schema package" — the exact phrase F37 removed from both exported templates in this same batch; AGENTS.md's stack-agnostic rule forbids it in skills and shared docs · undefined 320bf18 | yes · fold 320bf180 |
| F52 | docs/features/36-verification-contract-hygiene/SPEC.md:272-274 | workflow | high | fix-now | regression of F33 → fold into current unit: `## Next` claims "all replan rows (F28–F39) folded and verified green" and routes to `/review-change`, while all twelve rows still read `folded: no` and `node scripts/unit-route.mjs 36-verification-contract-hygiene` prints `open-rows: 12` / `route: replan` / `next: /unit-lane 36-verification-contract-hygiene` | yes · fold b86d1482 |
| F53 | docs/features/36-verification-contract-hygiene/SPEC.md:107-118 | verify, workflow | med | fix-now | fold into current unit: `## Applicable tests` still says "No new test: … the change is wording-only" and `### Known pre-existing issues` still says "none observed", while the branch changes `scripts/unit-route.mjs` and adds a `defined`-status test case to its suite · undefined 320bf18 | yes · fold 320bf180 |
| F54 | docs/features/36-verification-contract-hygiene/SPEC.md:238,246 | verify | med | fix-now | regression of F25 → fold into current unit: two Evidence rows do not reproduce — the P4 AC7 row cites `node scripts/version-parity-gate.mjs` without `--content` (real exit 2, usage printed; recorded `exit 0`), and the P11 row records a bare `0` plus an invented "14 routes PASS (10990 est total under declared ceilings)" where the tool prints no total and the real total is 175373 est / 12941 lines · undefined 320bf18 | yes · fold 320bf180 |

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| VF-36 | scripts/unit-route.mjs:598-604,762-773 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck reproducible command output: a fixture copy of `scripts/fixtures/unit-route` with `## Tasks` renamed in `docs/features/13-execute-unit/SPEC.md` → head `UNIT ROUTE — error` / "has all phases recorded but status is 'in-progress' (not 'done')", while `main`'s router over the same tree prints `route: execute` / `next: /execute-phase 13-execute-unit P1 (tier: cheap)` exit 0 | code | confirmed | finding-mark | n/a | n/a |
| VF-37 | scripts/unit-route.mjs:621,764 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck direct read of `:616-623` (`if (donePhases.size === 0) return 1;` then `const unfinished = [...donePhases]…; if (unfinished.length === 0) fail(...)`) and `:737,748,764` (`} else if (status === "done") … } else { … if (status === "done")`) — both predicates are unreachable by construction | code | confirmed | finding-mark | n/a | n/a |
| VF-38 | skills/review-change/references/REVIEW_PROCESS.md:34-35 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `git blame -L 33,37` → the two lines are `e28ff213e` (branch); `git show main:skills/review-change/references/REVIEW_PROCESS.md \| grep -c ACCEPTANCE.md` → 0; the same file's step 2 at `:56` reads "legacy (pre-feature 61) `ACCEPTANCE.md` or the unit doc's …" | architecture | confirmed | finding-mark | n/a | n/a |
| VF-39 | docs/features/36-verification-contract-hygiene/SPEC.md:217-219,240,244,247 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `grep -n '^## '` → `217:## Evidence` immediately followed by `219:## Triaged steps`; a markdown-cell count honoring `\|` gives P5 → 10 cells, P9 → 7, AC6 → 7 against the 5-column header at `:229` | verify | confirmed | finding-mark | n/a | n/a |
| VF-40 | docs/features/36-verification-contract-hygiene/SPEC.md:146-150 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `awk 'NR>=146 && NR<=150 {split($0,a,"\|"); print a[length(a)-1]}'` → `planned` for all five rows; `grep -nE '^\| P12 \|' SPEC.md` → no match while O14's `required-evidence` cell reads `Evidence row P12` | verify | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 | TMPDIR set to a writable tmpfs node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 | node scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 | node scripts/check-skill-context.mjs --routes | exit 0 |
| GATE-RAN | HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 | node scripts/golden-fixture.test.mjs | exit 0 |
| GATE-RAN | HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 | node scripts/version-parity-gate.mjs --content --base main | exit 0 |
| GATE-RAN | HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 | (packages/agentic-workflow-schema) bun run test | exit 0 |
| GATE-RAN | HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 | (packages/pi-agentic-workflow) bun run test | exit 0 |
| GATE-RAN | HEAD 320bf180 (fold batch F40–F54, tree) | node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD 320bf180 (fold batch F40–F54, tree) | node scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD 320bf180 (fold batch F40–F54, tree) | node scripts/check-skill-context.mjs --routes | exit 0 |
| GATE-RAN | HEAD 320bf180 (fold batch F40–F54, tree) | node scripts/golden-fixture.test.mjs | exit 0 |
| GATE-RAN | HEAD 320bf180 (fold batch F40–F54, tree) | node scripts/version-parity-gate.mjs --content --base main | exit 0 |
| GATE-RAN | HEAD 320bf180 (fold batch F40–F54, tree) | (packages/agentic-workflow-schema) bun run test | exit 0 |
| GATE-RAN | HEAD 320bf180 (fold batch F40–F54, tree) | (packages/pi-agentic-workflow) bun run test | exit 0 |

| VF-41 | docs/features/36-verification-contract-hygiene/review-findings.md (tail) · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `grep -oE 'GATE-RAN \| HEAD [0-9a-f]{40}' <ledger> \| sort \| uniq -c` → 7 at `636341e8`, 7 at `d85eeb40`, 5 at `f21593eb`, zero at `77280bea`; all seven gate commands exit 0 at that head | verify | confirmed | finding-mark | n/a | n/a |
| VF-42 | docs/features/36-verification-contract-hygiene/review-findings.md:27-29,96-98 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `node scripts/ledger-provenance.mjs <ledger> --check` → exit 1, "CHECK FAIL: 10 row(s) the 7-column schema refused were read by nothing: F18…F27", one "duplicate id in the file — only the last row is read" per id; `git cat-file -t af67eb9e54cfd95eef7b12406a6905d7e1abbd23` → fatal, `git rev-parse af67eb9e` → `af67eb9e54cf…` | code | confirmed | finding-mark | n/a | n/a |
| VF-43 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:162,186,212,235,259 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `git diff --name-only main...HEAD \| grep execute-phase` → empty, while a JSON walk over `routes/*/sources` prints `unit 36 / feature 36` naming `execute-phase/SKILL.md:13-14,22` and `execute-phase/references/EXECUTION_CONTRACT.md:127` for execute-phase:descope, :feature, :final-pr, :finding, :fix, :legacy, :small | perf | confirmed | finding-mark | n/a | n/a |
| VF-44 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:212,348,355 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `node -e 'console.log(Math.ceil(1360*1.1), Math.ceil(11052*1.1))'` → `1497 12158` against the declared `1496` / `12157`; `node scripts/check-skill-context.mjs` prints `verification-contract 1460 116` against the entries' "grew to 1459 est" | perf | confirmed | finding-mark | n/a | n/a |
| VF-45 | CHANGELOG.md:742 + scripts/normative-drift.test.mjs:771-785,703 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `grep -m1 '^version:' skills/verification-contract/SKILL.md` → `1.4.1`; `grep -n '^#### `verification-contract`' CHANGELOG.md` → no match, so `versionCells(text,"verification-contract")` returns `[]` and `newestVersionCell` returns null while `:703` skips the comparison; the newest row is `1.4.0` at `:742` | workflow | confirmed | finding-mark | n/a | n/a |
| VF-46 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:119-120 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `git show 701cd08a -- <that file>` → the hunk replaces `\`→ Next: /unit-lane <unit>\`); restore` with `\`→ Next: /unit-lane <unit>\`. Restore`, so the `(` opened at `:99` is never closed; `sed -n '119,121p'` shows the sentence ending `write a fresh receipt` immediately above `- **Lane-era path**` | code | confirmed | finding-mark | n/a | n/a |
| VF-47 | skills/verification-contract/SKILL.md:51 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `git show main:skills/verification-contract/SKILL.md \| grep -c "schema package"` → 0; head `grep -n "schema package"` → `51`; both templates now read "within the project's timeout budgets" (F37) | brand | confirmed | finding-mark | n/a | n/a |
| VF-48 | docs/features/36-verification-contract-hygiene/SPEC.md:272-274 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `node scripts/unit-route.mjs 36-verification-contract-hygiene` → `status: in-progress` / `open-rows: 12` / `route: replan` / `next: /unit-lane 36-verification-contract-hygiene`; `grep -oE '^\| F(2[89]\|3[0-9]) \|.*' <ledger>` folded cell → `no` for all twelve | workflow | confirmed | finding-mark | n/a | n/a |
| VF-49 | docs/features/36-verification-contract-hygiene/SPEC.md:107-118 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `git diff --stat main...HEAD -- scripts/unit-route.mjs scripts/unit-route.test.mjs` → both modified (36+/21- and 100+/0-), while `:110` reads "No new test" and `:114` "none observed" | verify | confirmed | finding-mark | n/a | n/a |
| VF-50 | docs/features/36-verification-contract-hygiene/SPEC.md:238,246 · reviewer review-change · HEAD 77280bea15562850040e35f8f257bd02af0cc6c1 · recheck `node scripts/version-parity-gate.mjs` → exit 2, usage printed (recorded `exit 0`); `node scripts/check-skill-context.mjs --routes` prints no total (the row's "10990 est total" is invented) and an awk sum over its output gives 175373 est / 12941 lines | verify | confirmed | finding-mark | n/a | n/a |


Cycle-4 re-verification of cycle-3 folded rows: F29, F30, F31, F33, F34, F36,
F37, F39 fixed; F28, F32, F35, F38 are **regressions** (F45, F44, F50, F47/F48)
and F31's own repair introduced F40/F41. Report notes, never persisted (`low`,
report-only): F55 (the AC4 row quotes the template as "within schema timeout
budgets at line 79" where committed line 80 reads "within the project's timeout
budgets" — debt item D1, trigger: the next edit to that sentence or the next
audit that re-derives AC4); the `verification-contract` "legacy" label means
"has `ACCEPTANCE.md`" at `:22` and "has no manifest mention" at `:76`; both
templates carry the same determinism sentence but the fix template's property/
fuzz line reads "bounded runtime — deterministic, bounded" (redundant) where the
features template names the row class; the second P6/F31 test passes on `main`
too, so it is a guard and not the reproducer P6's Evidence row implies; the
`pi-agentic-workflow` 0.22.0 companion row names only `verification-contract`
1.4.0 while that package version also ships 1.4.1, audit-pr 5.6.2, review-change
3.12.1 and workflow-status 3.9.2; commit subjects alternate `docs(36)` /
`docs(unit 36)` and one reads `fix(36): bump F21 — five unchanged skills`, which
calls the renamed skills "unchanged"; the execute hand-off now reads and parses
the unit doc twice per invocation (guard + `firstUnfinishedPhase`, ~92 ms vs
83 ms on a 65 KB doc). Refuted: "the issue-#183 bibliography is wrong" — all
four entries match `gh issue view 183` field by field and the live arXiv,
Crossref and appsec.guide records; "path traversal or shell injection in the new
helper" — `unit.dir` comes only from an enumerated `readdirSync`, no
`child_process` import exists, and `sanitize()` flattens C0/C1/format
characters; "the exported templates still carry repo-specific nouns" — both grep
0; "the P10 Evidence row is column-shifted" — its pipes are escaped and it
renders 5 cells; "the three `#291 F8` tests were weakened" — their assertion
moved onto the delivered behaviour change and the branch adds a stricter
`defined`-status refusal test; "the branch breaks the gate" — root 695/0,
golden 12/12, routes 14 PASS, skills 28 PASS, parity PASS, schema 717/0, pi
432/0. Every finding has a destination; this review creates no backlog.

## Cycle 5 — 2026-10-19

Cycle 5 ran (review-change) on candidate `HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da`,
clean workspace, no PR (pre-PR checkpoint). **Cycle 5 is past the two-cycle cap**
and ran because the user invoked it explicitly; the residue routes through this
section's rows, not a sixth cycle. Delta mode against cycle 4's reviewed head
`77280bea` escalated to a **full pass on Size**: fold diff `77280bea..HEAD` = 245
added + 96 deleted = 341 changed lines (> 200) across 11 files (≤ 15). Applicable
passes ran isolated: `review-code`, `review-security`, `review-verify`,
`review-perf`, `review-brand`; skipped with reasons — `review-design`/
`review-a11y`/`review-seo` (no UI, no web surface: the repo ships markdown
skills, a docs scaffold, and node scripts). Synthesis, classification
(`review-implementation`) and the debt transform (`review-debt`) each ran
isolated. Gate at head: root 696 pass / 0 fail exit 0, `check-skill-context` 28
skills exit 0, `--routes` 14 routes exit 0, golden-fixture 12/12 exit 0,
version-parity content PASS (0.21.0→0.22.0) exit 0, schema 717 pass exit 0, pi
432 pass exit 0, `ledger-provenance --check` PASS (50 rows).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F56 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:119-120 | code, brand | high | fix-now | regression of F50 → fold into current unit: finish the repair — the appended remedy sentence still ends "then write a fresh receipt" with no terminator and runs into the `- **Lane-era path**` sibling bullet — or drop the appended clause and keep the canonical remedy at `:159`; then correct the two claims that say it shipped (`CHANGELOG.md:566`, `SPEC.md:248`) | yes · fold cb0ca7032426a6c12bc5883e1b4780be162f26d0 |
| F57 | docs/features/36-verification-contract-hygiene/SPEC.md:245,249,252 | verify, workflow | med | fix-now | regression of F43 → fold into current unit: escape the literal pipes in the P5 `\| version \| date \| type \| what \|`, P9 `"Philipp Görz\|Ze Sheng\|V. J. M. Manès"` and AC6 `none\|<k> · shape ok\|<fail-code>` cells so each row renders the header's 5 cells instead of 9/6/6 | yes · fold cb0ca7032426a6c12bc5883e1b4780be162f26d0 |
| F58 | docs/features/36-verification-contract-hygiene/SPEC.md:279 | workflow | med | fix-now | regression of F52 → fold into current unit: delete the "(`node scripts/unit-route.mjs 36-verification-contract-hygiene` prints `open-rows: 0`)" parenthetical — the command prints no route block and exits 1 with the close-out refusal the same paragraph then describes — and quote the router's actual output | yes · fold cb0ca7032426a6c12bc5883e1b4780be162f26d0 |
| F59 | docs/features/36-verification-contract-hygiene/SPEC.md:251 | verify | med | fix-now | regression of F54 → fold into current unit: record the sum the tool actually prints — 175373 est / 12941 lines at this row's head `9ee7511d`, 175329 at the reviewed head — instead of 175343, which matches no head | yes · fold cb0ca7032426a6c12bc5883e1b4780be162f26d0 |
| F60 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:160,162,185,210,234,258,281,328,355,362,388,395,421,428,454 | perf, verify | high | fix-now | regression of F48 → fold into current unit: re-derive every `unit 36 / feature 36` and rewritten `feature 60 P3` entry from `check-skill-context.mjs --routes`' own output — the `887 est / 887 lines` and `842 est / 842 lines` pairs cannot exist (est ≈ 12.5× lines), execute-phase claims 11189/887 vs the tool's 11083/869, review-change 17324/1252 and 18878 vs 17221/1234 and 18874, audit-pr 9810/606 vs 9848/607 (so no source row predicts the shipped 10833 ceiling), and "grew to 1460 est" vs the file's 1456 — then set each ceiling to `ceil(measured × 1.10)` of the real pair | yes · fold cb0ca7032426a6c12bc5883e1b4780be162f26d0 |
| F61 | docs/features/36-verification-contract-hygiene/SPEC.md:239,241 | verify | med | fix-now | fold into current unit (cycle 4's debt item D1/F55 trigger fired — the audit re-derived AC4): AC2 cites "line 81: deterministic, bounded" where the committed line is 80, and AC4 quotes "within schema timeout budgets" where line 80 reads "within the project's timeout budgets" | yes · fold cb0ca7032426a6c12bc5883e1b4780be162f26d0 |
| F62 | docs/features/36-verification-contract-hygiene/review-findings.md:249 | verify | med | fix-now | regression of F46 → fold into current unit: F46's route cell now cites `af67eb9e54cfd95eef7b12406a6905d7e1abbd23` as both the "non-existent" hash and "the real commit"; restore the real pair or state the defect once | yes · fold cb0ca7032426a6c12bc5883e1b4780be162f26d0 |
| F63 | CHANGELOG.md:100 | brand | med | fix-now | fold into current unit: the 0.22.0 companion row must name what this PR ships (`verification-contract` 1.4.2, not 1.4.0) and spell the artifact `ACCEPTANCE.md` | yes · fold cb0ca7032426a6c12bc5883e1b4780be162f26d0 |
| F64 | CHANGELOG.md:211,476,567,740,741 | brand | high | fix-now | fold into current unit: the five rows say the era label was "corrected from \"lane-era\" to \"legacy (pre-feature 61)\"", but `git show main:` carries no such label at any cited line — the branch introduced it (`e28ff213`) and renamed it (`af67eb9e`) inside this PR; state the shipped change (the label is added as "legacy (pre-feature 61)") instead of a correction of history | yes · fold cb0ca7032426a6c12bc5883e1b4780be162f26d0 |

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| VF-51 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:119-120 · reviewer review-change · HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da · recheck `sed -n '119,121p'` → "…then write a fresh receipt" (no period) immediately above `- **Lane-era path**`; `git show main:…` shows the branch-introduced clause | code | confirmed | finding-mark | n/a | n/a |
| VF-52 | docs/features/36-verification-contract-hygiene/SPEC.md:245,249,252 · reviewer review-change · HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da · recheck a cell count honouring `\|` → P5 = 9, P9 = 6, AC6 = 6 cells against the 5-column header at `:235` | verify | confirmed | finding-mark | n/a | n/a |
| VF-53 | docs/features/36-verification-contract-hygiene/SPEC.md:279 · reviewer review-change · HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da · recheck `node scripts/unit-route.mjs 36-verification-contract-hygiene` → empty stdout, stderr "UNIT ROUTE — error … status is 'in-progress' (not 'done')", exit 1 | workflow | confirmed | finding-mark | n/a | n/a |
| VF-54 | docs/features/36-verification-contract-hygiene/SPEC.md:251 · reviewer review-change · HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da · recheck `node scripts/check-skill-context.mjs --routes` at HEAD → summed est 175329 / 12941 lines; the same command in a worktree at `9ee7511d` → 175373 / 12941; the row records 175343 | verify | confirmed | finding-mark | n/a | n/a |
| VF-55 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:160,162,185,210,234,258,281,328,355,362,388,395,421,428,454 · reviewer review-change · HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da · recheck `--routes` → descope 11083/869, feature 10433/824, final-pr 10946/848, audit-pr 9848/607, review-change:adversarial 18874/1342, default-backend 17221/1234, synthesize 17690/1256; `check-skill-context.mjs` → verification-contract 1456/116; the entries declare 11189/887, 10539/842, 11052/866, 9810/606, 18878/1342, 17324/1252, 17793/1274, "1460 est", and the impossible `887 est / 887 lines` | perf | confirmed | finding-mark | n/a | n/a |
| VF-56 | docs/features/36-verification-contract-hygiene/SPEC.md:239,241 · reviewer review-change · HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da · recheck `grep -n "determin" template/docs/fix/_TEMPLATE/SPEC.md` → 74 and 80 (no 81); line 80 reads "bounded runtime — deterministic, bounded — within the project's timeout budgets" | verify | confirmed | finding-mark | n/a | n/a |
| VF-57 | docs/features/36-verification-contract-hygiene/review-findings.md:249 · reviewer review-change · HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da · recheck `sed -n '249p'` → both backticked hashes read `af67eb9e54cfd95eef7b12406a6905d7e1abbd23`, so "a non-existent 40-hex … where the real commit is …" states nothing | verify | confirmed | finding-mark | n/a | n/a |
| VF-58 | CHANGELOG.md:100 · reviewer review-change · HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da · recheck `grep -m1 '^version:' skills/verification-contract/SKILL.md` → `1.4.2` while the row says "`verification-contract` 1.4.0" and writes "acceptance.md" | brand | confirmed | finding-mark | n/a | n/a |
| VF-59 | CHANGELOG.md:211,476,567,740,741 · reviewer review-change · HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da · recheck `git show main:<each cited file> \| grep -n 'lane-era'` → no era label on any cited ACCEPTANCE.md line (SNAPSHOT.md/02_CLOSURE use "lane-era" for the pipeline/unit, not for the artifact); `git log -S'lane-era'` → `e28ff213` and `af67eb9e`, both in this branch | brand | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da | TMPDIR set to a writable tmpfs node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da | node scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da | node scripts/check-skill-context.mjs --routes | exit 0 |
| GATE-RAN | HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da | node scripts/golden-fixture.test.mjs | exit 0 |
| GATE-RAN | HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da | node scripts/version-parity-gate.mjs --content --base main | exit 0 |
| GATE-RAN | HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da | (packages/agentic-workflow-schema) bun run test | exit 0 |
| GATE-RAN | HEAD 5fa211e4c9f684b6701161442e67139c6f0e75da | (packages/pi-agentic-workflow) bun run test | exit 0 |

Cycle-5 re-verification of the 54 folded rows: fixed at the cited locations —
F1/F2/F6/F7/F9/F10/F11/F14/F15/F18/F19/F20/F21/F23/F24/F27/F28/F31/F32/F33/
F34/F35(partially: the parenthesis is closed, the sentence still lacks its
terminator → F56)/F36/F37/F39/F40/F41/F42/F44/F45/F46(moved marks to the cycle-4
section; the row's own text became self-contradictory → F62)/F47/F49/F51/F53.
**Regressions**: F43 → F57, F48 → F60, F50 → F56, F52 → F58, F54 → F59.
Report notes, never persisted (`low`, report-only): the AC4/P6 Evidence rows
record point-in-time counts (44 unit-route tests, 695 root tests) that later
commits raised to 45/696 — accepted as historical records, the head's counts are
in `## Next`; the cycle-4 `GATE-RAN` marks carry `HEAD 320bf180 (fold batch
F40–F54, tree)` where `gate-ran@1` asks for 40-hex (repo-wide precedent is
8-hex, so this is the baseline, not a branch defect); `scripts/unit-route.mjs`
reads and parses the unit doc twice (+11–19 ms on a 72–141 KB doc) and copies its
5-line command builder in three branches — debt item with TRIGGER "a 4th copy of
the builder, or build time crossing the gate budget" (cycle 4 left it a note, the
code is unchanged since); `template/docs/fix/_TEMPLATE/SPEC.md:80` reads
"bounded runtime — deterministic, bounded —" (duplicated modifier);
`LEDGERS.md:150`'s unit-doc recipe joins two commands with a bare `then`;
`review-loop-discipline.test.mjs:342-345` pins the new wording but nothing
asserts the post-61 `## Acceptance criteria` source; `normative-drift.test.mjs`'s
`internal` flag is not reset by a `####` heading (latent — no such heading exists
under `### Internal` today); eight commit subjects carry a space in the scope
(`docs(unit 36)`). Refuted: "the branch duplicated the `review-debt` 1.1.0
CHANGELOG row" — `grep -nF '\`review-debt\` | 1.1.0'` returns exactly one row
(`:895`, added by this branch; `main` has none) and `:896` is 1.0.1, so the
claimed byte-identical pair does not exist; "the `sed` acceptance derivation
returns nothing" — it yields a stable blob (`3b26da67…`). Every finding has a
destination; this review creates no backlog.

## Cycle 6

Cycle 6 review ran 2026-10-19 (review-change) on the exact candidate
`HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a`, clean workspace, no PR yet
(pre-PR checkpoint). Route: default review — the delta review the cycle-5
receipt asked for escalated to a full pass on the **Size** trigger
(`git diff --numstat 5fa211e4..HEAD` → 148 added + 67 deleted = 215 changed
lines > 200; 6 changed files ≤ 15). Applicable passes ran isolated:
`review-code`, `review-security`, `review-verify`, `review-brand`,
`review-perf`; skipped with reasons — `review-design`/`review-a11y`/
`review-seo` (no UI, no web surface: the repo ships markdown skills, a docs
scaffold and node scripts). Synthesis, classification (`review-implementation`)
and the debt transform (`review-debt`) each ran isolated. Gate at head: root
696 pass / 0 fail exit 0, `check-skill-context` 28 skills exit 0, `--routes` 14
routes exit 0, golden-fixture 12/12 exit 0, version-parity content PASS
(0.21.0→0.22.0) exit 0, schema 717 pass exit 0, pi 432 pass exit 0,
`ledger-provenance --check` PASS (59 rows). Cycle count: 6 (5 `REVIEW-RAN`
marks + 1) — the two-cycle cap was already exceeded by the earlier cycles;
this invocation is the user's explicit escape, never a reviewer election.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F65 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:164,188,214,237,261,284,308,397,430,463 | perf, brand | med | fix-now | regression of F60 → fold into current unit: the seven `execute-phase:*` `unit 36 / feature 36` notes swap the measured pair's nouns — "route measured 11083 lines; ceiling = ceil(11083 x 1.10) = 12192 lines, ceil(869 x 1.10) = 956 est" (`:164`) asserts a 12192-**line** route whose real line ceiling is the declared 956 and labels the est ceiling "lines", contradicting the sibling `feature 60 P3` note in the same object and the tool's `est lines` order; three `review-change:*` notes carry non-reproducible pairs the same way (`:397,430` "measured 1252 lines" vs the tool's 1234, ceiling 1378 vs the shipped 1358; `:463` 1274 vs 1256, 1402 vs 1382). Restate every note as `<est> est / <lines> lines` and ceil each quantity in place; the declared ceilings themselves are correct · undefined 3b60d5b | yes · fold 46eb430a |
| F66 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:330 | perf, verify | med | fix-now | regression of F60 → fold into current unit: the `execute-phase:unit-loop` `feature 60 P3` note states three numbers the tool refutes — "grew to 1460 est / 116 lines" (tool 1456/116), "pre-re-basis route measured 11634 est / 824 lines" (tool 10433/824; 11634 est cannot pair with 824 lines) and "ceiling re-based to ceil(11634 x 1.10) = 12798 est" while the route declares 13655/984 with no note explaining the delta; restate the measured pair and either re-basis to 11477/907 or record where 13655/984 comes from · undefined 3b60d5b | yes · fold 46eb430a |
| F67 | docs/features/36-verification-contract-hygiene/SPEC.md:239,241 | verify | med | fix-now | regression of F61 → fold into current unit: AC2 and AC4 both cite "line 80" of `template/docs/fix/_TEMPLATE/SPEC.md`, but line 80 is "No new validator kind is needed: property/fuzz uses the existing `commands`"; `grep -n "determin"` gives 74 (determinism rule) and 79 (deterministic, bounded runtime) — the fold relabelled 81→80 and then merged 79–80 in the same batch, so both cells now point past the cited text · undefined 3b60d5b | yes · fold 46eb430a |
| F68 | docs/features/36-verification-contract-hygiene/SPEC.md:251 | verify | med | fix-now | regression of F59 → fold into current unit: the P11 Evidence row records "summing its rows gives 175329 est / 12941 lines"; at the reviewed head the 14 `--routes` rows sum to 175333 est / 12941 lines (the fold batch's own audit-pr reference edit moved the total), so the recorded sum reproduces at no commit after the fold · undefined 3b60d5b | yes · fold 46eb430a |
| F69 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:119-120 | code, brand | med | fix-now | regression of F56 → fold into current unit: the remedy was converted from the imperative "Restore the bound artifact or obtain explicit user approval …; then write a fresh receipt" into the verbless fragment "Restoring the bound artifact or obtaining …; then writing a fresh receipt." — the terminator the previous fold owed now exists, but the sentence has no predicate and instructs nothing, diverging from the imperative siblings and from the canonical copy at `skills/verification-contract/SKILL.md:67-68` · undefined 3b60d5b | yes · fold 46eb430a |
| F70 | scripts/unit-route.mjs:751,770 | code | med | fix-now | regression of F41 → fold into current unit: F41 asked to delete the dead `if (status === "done")` predicate; it survives at `:770` inside the `else` of the `else if (status === "done")` chain that already returned `close-out` at `:724`, so the "all phases done AND status done" guard never runs and close-out never consults phase completeness (fixture `13-execute-unit` with roadmap `done` and only P1 recorded → `route: close-out` / `next: /audit-pr`, exit 0, identical on `main`); the unfinished set is also named `donePhases` (`:751`) although `size === 0` means "no unfinished phase". Delete the dead branch, keep the live `:724` path, rename the set · undefined 3b60d5b | yes · fold 46eb430a |
| F71 | skills/verification-contract/SKILL.md:113-116 | code, brand | med | fix-now | fold into current unit: obligation O9 claims the post-61 receipt has exactly one declared owner, but `## Done when` still reads "Frozen manifest + current blob receipt + named validators + literal quality floor" while § Freeze and receipt (`:56-70`) declares the unit doc's `## Evidence` table the execution receipt — two owners for one completion contract in the skill P7 rewrote; restate `## Done when` on the unit-doc Evidence receipt, with the legacy `ACCEPTANCE.md` path binding-if-present · undefined 3b60d5b | yes · fold 46eb430a |

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| VF-60 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:164 · reviewer review-change · HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a · recheck `node scripts/check-skill-context.mjs --routes` → `execute-phase:descope … 11083 869`; the note's "ceil(869 x 1.10) = 956 est" labels a lines ceiling "est", and the file declares `routeLinesMax: 956` | perf | confirmed | finding-mark | n/a | n/a |
| VF-61 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:330 · reviewer review-change · HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a · recheck `check-skill-context.mjs` → `verification-contract 1456 116`; `--routes` → `execute-phase:unit-loop 10433 824`; declared `routeEstimateMax: 13655`, `routeLinesMax: 984` | perf | confirmed | finding-mark | n/a | n/a |
| VF-62 | docs/features/36-verification-contract-hygiene/SPEC.md:239,241 · reviewer review-change · HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a · recheck `grep -n "determin" template/docs/fix/_TEMPLATE/SPEC.md` → 74, 79; `sed -n '80p'` → "No new validator kind is needed: property/fuzz uses the existing `commands`" | verify | confirmed | finding-mark | n/a | n/a |
| VF-63 | docs/features/36-verification-contract-hygiene/SPEC.md:251 · reviewer review-change · HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a · recheck summed `--routes` rows → 175333 est / 12941 lines at HEAD; the row records 175329 | verify | confirmed | finding-mark | n/a | n/a |
| VF-64 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:119-120 · reviewer review-change · HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a · recheck `sed -n '119,121p'` → "Restoring the bound artifact or obtaining explicit user approval for a / SPEC amendment and replacement manifest; then writing a fresh receipt." (no predicate), sibling `- **Lane-era path**` intact at `:121` | code | confirmed | finding-mark | n/a | n/a |
| VF-65 | scripts/unit-route.mjs:751,770 · reviewer review-change · HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a · recheck `grep -n 'status === "done"'` → 724, 770 (the second inside the first's `else`); fixture copy at `/tmp/rv36/fx` with roadmap row 13 `done` and Progress log recording P1 only → `route: close-out` / `next: /audit-pr`, exit 0 — identical with `main`'s router | code | confirmed | finding-mark | n/a | n/a |
| VF-66 | skills/verification-contract/SKILL.md:113-116 · reviewer review-change · HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a · recheck direct read: `## Done when` = "Frozen manifest + current blob receipt + named validators + literal quality floor" vs § Freeze and receipt `:56-70` "The unit doc's `## Evidence` table is the execution receipt" | code | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a | TMPDIR set to a writable tmpfs node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a | node scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a | node scripts/check-skill-context.mjs --routes | exit 0 |
| GATE-RAN | HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a | node scripts/golden-fixture.test.mjs | exit 0 |
| GATE-RAN | HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a | node scripts/version-parity-gate.mjs --content --base main | exit 0 |
| GATE-RAN | HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a | (packages/agentic-workflow-schema) bun run test | exit 0 |
| GATE-RAN | HEAD d3caeb86a52475c2f4bc086bb8a6827f6aa97e0a | (packages/pi-agentic-workflow) bun run test | exit 0 |

Cycle-6 re-verification of the 59 folded rows: the delta touched six files, so
every row citing one was re-checked at its cited line and the rest are byte-
identical to the cycle-5 verification. Fixed at the cited locations —
F1/F2/F6/F7/F9/F10/F11/F14/F15/F18/F19/F20/F21/F23/F24/F27/F28/F29/F30/F31/
F32/F33/F34/F36/F37/F39/F42/F43/F44/F45/F46/F47/F48/F49/F50/F51/F52/F53/F54,
F56 (terminator now present → F69), F57 (pipes escaped in the P5/P9/AC6 cells),
F58 (the false `open-rows: 0` parenthetical is gone and the quoted refusal
reproduces), F62 (the F46 route cell now carries one hash), F63 (row names
`verification-contract` 1.4.2 and `ACCEPTANCE.md`), F64 (all five rows say "era
label added"). **Regressions**: F59 → F68, F60 → F65 + F66, F61 → F67,
F41 → F70, F56 → F69. Report notes, never persisted (`low`, report-only):
`SPEC.md:279` still says "every ledger row F1–F54" while the ledger carries 59
rows through F64 ("the fold queue is empty" itself is true;
`grep -c 'folded: no'` → 0); `template/docs/features/_TEMPLATE/SPEC.md:27-29`
keeps the duplicated "bounded … bounded runtime" the same fold removed from the
fix template; `CHANGELOG.md:566` reads "to fix malformed bullet repair";
`docs/workflow/SKILL_CONTEXT_BUDGETS.json:70,92` claim an "era label migration
from \"lane-era\"" for `02_CLOSURE_AND_SCOPE_GATES.md` although `main` carried
no era label on that mandate (the F64 false-history class, outside F64's cited
files); `scripts/unit-route.mjs` still parses the unit doc three times per
execute route and copies its command builder twice — the existing debt item with
TRIGGER "a 4th copy of the builder, or build time crossing the gate budget"
(measured: duplicate parse ≈0.13 ms of a 121.9 ms CLI); the three new
`unit-route.test.mjs` cases cost +8.4 % on that file (5498 → 5962 ms, ≈140 ms per
node spawn) — debt item with TRIGGER "the file crossing 7 s or a 4th
fixture-per-case spawn"; `scripts/normative-drift.test.mjs`'s `internal` flag is
still not reset by any later heading (latent);
`skills/pre-execution-review/references/LEDGERS.md:150` still joins two commands
with a bare `then`. Refuted: "the Evidence table rows carry 4 cells under the
5-column header" — an escaped-aware split yields the header's 5 cells on every
row; "the P9 author-list cell carries unescaped pipes" — `od -c` shows `\|`, so
the row renders 5 cells; "the fold batch also ships the post-61 acceptance-source
sentences in `02_CLOSURE_AND_SCOPE_GATES.md`" — `git diff 5fa211e4..HEAD --stat`
for that file is 2 insertions / 2 deletions, one terminator hunk; "a `done` unit
with unrecorded phases routing to `close-out` is a branch regression" — `main`'s
router returns the same route at `:724`; "the 1.4.0 CHANGELOG row omits the
downgrade escape" — the row states "must be pinned or the row is
`read-verified:`/`manual:`"; "the legacy/lane-era labels are swapped in the five
rows" — every cited row labels the `ACCEPTANCE.md` mandate "legacy (pre-feature
61)", which is the repository's own vocabulary. Every finding has a destination;
this review creates no backlog.
| REVIEW-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | TMPDIR set to a writable tmpfs node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | node scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | node scripts/check-skill-context.mjs --routes | exit 0 |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | node scripts/golden-fixture.test.mjs | exit 0 |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | node scripts/version-parity-gate.mjs --content --base main | exit 0 |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | (packages/agentic-workflow-schema) bun run test | exit 0 |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | (packages/pi-agentic-workflow) bun run test | exit 0 |
## Cycle 7

Cycle 7 review ran 2026-10-20 (review-change) on the exact candidate
`HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d`, clean workspace, in sync with
origin, no PR (pre-PR checkpoint; `gh pr list --head …` → empty). The fold batch
`d3caeb86..46eb430a` escalated delta mode to a **full pass on Size**:
213 changed lines (> 200) across 6 files (≤ 15). Applicable passes: `review-verify`
ran isolated (subagent); `review-code`, `review-security`, `review-brand`,
`review-perf` ran via the documented inline fallback after the platform refused
to spawn subagents (403 on every Explore-tier spawn) — each reduced to its
findings table before the next; skipped with reasons — `review-design`/
`review-a11y`/`review-seo` (no UI, no web surface). Synthesis, classification
(`review-implementation`) and the debt transform (`review-debt`) ran inline
(same fallback). Gate at head, run by this review: root suites exit 0,
`check-skill-context` 28 skills exit 0, `--routes` 14 routes exit 0,
golden-fixture 12/12 exit 0, version-parity content PASS (0.21.0→0.22.0) exit 0,
schema exit 0, pi exit 0 — 7/7 fresh marks below. `ledger-provenance --check`
PASS (66 rows). Cycle count: 7 (6 `REVIEW-RAN` marks + 1) — far past the
two-cycle cap; this invocation is the user's explicit escape, never a reviewer
election.

CONVERGENCE-ANOMALY — 36-verification-contract-hygiene spec
- Finding ids: repeated F70, F68, F60+F65 / new F72, F73, F74, F75
- Snapshots: acceptance blob `3b26da67bd597771ffe006e515ec47b0d5fc1b19` →
  `3b26da67bd597771ffe006e515ec47b0d5fc1b19` (unchanged; no SPEC amendment)
- Missed: the cycle-6 fold's own Evidence — its receipt claims ("unit-route dead
  code", reproducible route sums) are not carried by the folded bytes
- Owning stage: source (fold-execution hygiene, not plan/product)
- Why the prior repair failed: the fold amended its commit after running the
  gate and recorded claims its diff does not implement (rename-only where a
  deletion was owed; stale measured pairs left in notes whose ceilings were
  re-based from fresh measurements)
- Route to owner: `/fold-findings` (source-rooted; all four rows fold into the
  current unit)

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F72 | scripts/unit-route.mjs:733,766-771 | code | med | fix-now | regression of F70 → fold into current unit: the fold receipt claims "unit-route dead code" repaired, but only the `donePhases`→`unfinished` rename landed (diff is 3+/3-); the dead `if (status === "done")` true-branch survives inside the `else` of the chain whose `else if (status === "done")` at `:733` already returned close-out, so it is unreachable by construction. Delete the dead branch (keep the fail-closed `else`), or re-state the fold receipt to match the landed bytes | yes · fold 20834486 |
| F73 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:162,164,187,188,212,214,357,364,397,430,463 (+ same-text repeats at 236,237,260,261,283,284,307,308,330) | perf, verify | med | fix-now | regression of F60 + F65 → fold into current unit: the fold re-based every route ceiling from the fresh measured pair but left the pre-fold pair in the notes' `ceil()` text, so the arithmetic is false at 10 of 14 routes — `:164` "ceil(11083 x 1.10) = 12217 est" (real 12192; the declared 12217 = ceil(11106×1.10), the tool's actual descope pair 11106/868) and "ceil(869 x 1.10) = 956 lines" contradicts the declared `routeLinesMax: 955`; `:188` "ceil(10433 x 1.10) = 11502" (real 11477; declared 11502 = ceil(10456×1.10)), "ceil(824 x 1.10) = 906" (real 907); `:214` "ceil(10946 x 1.10) = 12066" (real 12041); `:364` "ceil(1342 x 1.10) = 1476" (real 1477) and "ceil(17221 x 1.10) = 18969" at `:397,430` (real 18944 = ceil(17244×1.10)); `:463` "ceil(17690 x 1.10) = 19485" (real 19459 = ceil(17713×1.10)); `:357` states "pre-re-basis route measured 18874" then computes "ceil(18897 x 1.10)" in the same sentence. Re-record each note with the pair the re-basis actually measured (descope 11106/868, feature-class 10456/823, final-pr 10969/847, adversarial 18897/1341, default 17244/1233, synthesize 17713/1255, audit-pr 9850/607 — audit-pr's notes are already correct) so every `ceil(measured x 1.10)` reproduces the declared ceiling | yes · fold 20834486 |
| F74 | docs/features/36-verification-contract-hygiene/SPEC.md:251 | verify | med | fix-now | regression of F68 → fold into current unit: the P11 Evidence row records "summing its rows gives 175333 est / 12941 lines"; at the reviewed head the 14 `--routes` rows sum to 175609 est / 12929 lines (the fold batch's own edits moved the measurements), and the row's closing claim "correct ceil arithmetic" is false per F73. Re-record the sum at the repaired head | yes · fold 20834486 |
| F75 | docs/features/36-verification-contract-hygiene/review-findings.md (cycle-6 tail marks) | workflow | med | fix-now | fold into current unit: the cycle-6 fold ran its gate at `846f3d7c3a9422677c4c52ae939c9c934d0a6d2d`, then amended the commit into `46eb430a` — the tail `REVIEW-RAN`/`GATE-RAN` marks cite a commit that is not an ancestor of HEAD (`git merge-base --is-ancestor` fails), reachable only via reflog, and whose tree differs from HEAD (`8f28b519` vs `395e3d8f`); the delta is unit-doc prose + ledger only, so the receipts substantively hold, but the provenance points at dangling bytes. Remedy: fresh marks at the exact reviewed head (this review's own marks below satisfy it for cycle 7) and stop amending a commit after marking it | yes · fold 20834486 |

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| VF-67 | scripts/unit-route.mjs:733,766-771 · reviewer review-change · HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d · recheck `grep -n 'status === "done"' scripts/unit-route.mjs` → 733 and 770 (the second inside the first's `else`); direct read of `:712-775` shows the `else if (status === "done")` chain branch returns close-out before the execute block, so the inner true-branch is unreachable; `git diff d3caeb86..46eb430a -- scripts/unit-route.mjs` shows rename only (3+/3-) | code | confirmed | finding-mark | n/a | n/a |
| VF-68 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:164 · reviewer review-change · HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d · recheck `node -e 'console.log(Math.ceil(11083*1.1), Math.ceil(869*1.1), Math.ceil(11106*1.1), Math.ceil(868*1.1))'` → 12192 956 12217 955 against the note's "12217 est / 956 lines" and the declared 12217/955; `node scripts/check-skill-context.mjs --routes` → descope 11106/868; same method at :188/:214/:364/:397/:430/:463 | perf | confirmed | finding-mark | n/a | n/a |
| VF-69 | docs/features/36-verification-contract-hygiene/SPEC.md:251 · reviewer review-change · HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d · recheck `node scripts/check-skill-context.mjs --routes \| awk '{s+=$(NF-1); l+=$NF} END{print s, l}'` over the 14 route rows → 175609 est / 12929 lines against the recorded 175333/12941 | verify | confirmed | finding-mark | n/a | n/a |
| VF-70 | docs/features/36-verification-contract-hygiene/review-findings.md (cycle-6 tail marks) · reviewer review-change · HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d · recheck `git log -1 --format='%H %P %s' 846f3d7c` → "fix(36): fold F65-F71 …" parented on 77894bbf (same as 46eb430a, pre-amend); `git merge-base --is-ancestor 846f3d7c 46eb430a` → exit 1; `git rev-parse 846f3d7c^{tree} 46eb430a^{tree}` → 8f28b519 / 395e3d8f; `git diff 846f3d7c 46eb430a --stat` → SPEC.md + review-findings.md only | workflow | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | TMPDIR set to a writable tmpfs node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | node scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | node scripts/check-skill-context.mjs --routes | exit 0 |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | node scripts/golden-fixture.test.mjs | exit 0 |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | node scripts/version-parity-gate.mjs --content --base main | exit 0 |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | (packages/agentic-workflow-schema) bun run test | exit 0 |
| GATE-RAN | HEAD 46eb430a365cf0c8556b1ec430a7eefc9cacef6d | (packages/pi-agentic-workflow) bun run test | exit 0 |

Cycle-7 re-verification of the folded rows citing the six delta files: F65/F66
repaired for their noun defect but the pair/ceil defect persists → F73; F67
fixed (AC2/AC4 now cite template lines 74/79, both reproduce); F68 → regression
F74; F69 fixed for its cited defect (the sentence terminates and now carries a
predicate; the residual participial opener "Restoring … obtaining …, then
write" is a report-note, not a row); F70 → regression F72 (rename only); F71
fixed (`## Done when` now names the unit-doc Evidence receipt, one owner,
consistent with § Freeze and receipt). Rows citing untouched files are
byte-identical to the cycle-6 verification.

Report notes, never persisted (`low`, report-only): `02_CLOSURE_AND_SCOPE_GATES.md:119-120`
still opens the remedy with participles ("Restoring the bound artifact or
obtaining explicit user approval …, then write a fresh receipt") where the
canonical copy (`skills/verification-contract/SKILL.md:67-68`) uses imperatives
("Restore … obtain …"); `SPEC.md` AC7 row records the P12-era "root: 695 pass"
while the Progress log's fold-cycle-6 entry records 696 — accepted point-in-time
records, the head's own counts are the GATE-RAN marks above;
`scripts/unit-route.mjs:616` still names its local set `donePhases` inside
`firstUnfinishedPhase` (the F70 misnomer, outside the cited lines); the 8
`docs(unit 36)` space-in-scope commit subjects and the two file-scoped subjects
(`fix(CHANGELOG)`, `fix(README)`) remain the cycle-6 note. Refuted: "the
declared route ceilings are wrong" — every declared ceiling equals
`ceil(current measured × 1.10)` of the tool's real pair (checked all 14 routes);
"the gate is not green at the reviewed head" — 7/7 commands exit 0 at
`46eb430a`; "the ledger fails provenance" — cycle 7 read `--check` as PASS
(66 rows), a reading cycle 9's F80 showed was vacuous (the recount never examined
a folded cell's marker). Debt
transform: no new debt-shaped findings — the pre-existing debt items (unit-route
duplicate parses ≈0.13 ms, builder copies ×2 with TRIGGER "a 4th copy or build
time crossing the gate budget"; unit-route.test.mjs fixture spawns with TRIGGER
"file crossing 7 s or a 4th fixture-per-case spawn") are unchanged by this
delta (rename only). Every finding has a destination; this review creates no
backlog.

## Cycle 8

Cycle 8 review ran 2026-10-20 (review-change) on the exact candidate
`HEAD 20834486f644c5a22471a6e0d408f82b0b22d1a7`, clean workspace, in sync with
origin, no PR (pre-PR checkpoint; `gh pr list --head …` → empty). The fold
batch `a6a5e942..20834486` escalated delta mode to a **full pass on Size**:
978 changed lines (> 200) across 4 files (≤ 15). Applicable passes ran
isolated (subagents): `review-code`, `review-security`, `review-verify`,
`review-brand`, `review-perf`; skipped with reasons — `review-design`/
`review-a11y`/`review-seo` (no UI, no web surface: the repo ships markdown
skills, a docs scaffold and node scripts). Synthesis, classification
(`review-implementation`) and the debt transform (`review-debt`) each ran
isolated (subagents). Gate at head, run by the isolated verify pass: root
suites 696 pass / 0 fail exit 0, `check-skill-context` 28 skills exit 0,
`--routes` 14 routes exit 0, golden-fixture 12/12 exit 0, version-parity
content PASS (0.21.0→0.22.0) exit 0, schema 717 pass exit 0, pi 432 pass
exit 0 — 7/7 fresh marks below. `ledger-provenance --check` PASS (70 rows).
Cycle count: 8 (7 `REVIEW-RAN` marks + 1) — far past the two-cycle cap; this
invocation is the user's explicit escape, never a reviewer election.

CONVERGENCE-ANOMALY — 36-verification-contract-hygiene spec
- Finding ids: F76 (regression of F75), F77 (new)
- Snapshots: acceptance blob `3b26da67bd597771ffe006e515ec47b0d5fc1b19` →
  `3b26da67bd597771ffe006e515ec47b0d5fc1b19` (unchanged; F77 proposes the
  first SPEC amendment)
- Missed: cycles 3–7 ran full passes without re-reading the SPEC Objective
  against the grown diff (its "wording/template changes only" scope claim has
  been false since the 2026-10-19 replan batch); the fold batches kept
  amending commits after writing provenance into them (F75 → F76)
- Owning stage: source (fold-execution hygiene + unit-doc coherence)
- Why the prior repair failed: F75's remedy was prose ("stop amending a
  commit after marking it") with no mechanical guard, and the fold repeated
  the pattern the same day; the Objective was never re-checked
- Route to owner: `/fold-findings` (source-rooted; both rows fold into the
  current unit)

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F76 | docs/features/36-verification-contract-hygiene/review-findings.md:538-545 (cycle-7 section, F72–F75 folded cells) | workflow | med | fix-now | regression of F75 → fold into current unit: the F72–F75 fold wrote its ledger rows citing `fold f3fab05c`, then amended that commit into `20834486` (tree delta = the 4 ledger row flips only), so the provenance cells name a commit that is not an ancestor of HEAD and is reachable only via reflog — the exact defect F75's remedy ("stop amending a commit after marking it") forbids, now repeated. Remedy: re-point the four folded cells to the real final fold commit and never amend a commit the ledger names; `ledger-provenance --check` does not catch this (it checks existence, not ancestry) — do not weaken it to try · undefined 0746f27 | yes · fold 6128e903 |
| F77 | docs/features/36-verification-contract-hygiene/SPEC.md:20-24 | workflow, spec-drift | med | fix-now | fold into current unit: the Objective still scopes the unit as "wording/template changes only — skills/verification-contract/SKILL.md plus the template substrate validator mirror, a `bump-skill` version bump, and the README `## References` entries", while the shipped branch diff rewrites `scripts/unit-route.mjs`, `scripts/normative-drift.test.mjs`, five review-pack skills and re-bases the context budgets (27 files, +1699/−538) — the Objective contradicts the unit's own Tasks/Evidence (P5–P12), and no dated `## Amendments` row records the replan expansion. Amend the Objective or add a dated `## Amendments` row naming the P5–P12 replan batches · undefined 0746f27 | yes · fold 6128e903 |

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| VF-71 | docs/features/36-verification-contract-hygiene/review-findings.md:538-545 · reviewer review-change · HEAD 20834486f644c5a22471a6e0d408f82b0b22d1a7 · recheck `git merge-base --is-ancestor f3fab05c 20834486` → exit 1; `git log -1 --format='%h %s' f3fab05c` → "f3fab05c fix(36): fold F72-F75 …" (same subject as 20834486, pre-amend); `git diff --stat f3fab05c 20834486` → review-findings.md only, 4 insertions / 4 deletions (the row flips themselves); `node scripts/ledger-provenance.mjs <ledger> --check` → PASS (70 rows) because the tool verifies existence, not ancestry | workflow | confirmed | finding-mark | n/a | n/a |
| VF-72 | docs/features/36-verification-contract-hygiene/SPEC.md:20-24 · reviewer review-change · HEAD 20834486f644c5a22471a6e0d408f82b0b22d1a7 · recheck direct read: Objective reads "…as wording/template changes only — `skills/verification-contract/SKILL.md` plus the template substrate validator mirror, a `bump-skill` version bump, and the README `## References` entries…"; `git diff main...HEAD --stat` → 27 files, 1699 insertions / 538 deletions including scripts/unit-route.mjs, scripts/normative-drift.test.mjs, five skills and the budget JSON; `grep -n "## Amendments" docs/features/36-verification-contract-hygiene/SPEC.md` → no match | workflow, spec-drift | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD 20834486f644c5a22471a6e0d408f82b0b22d1a7 | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 20834486f644c5a22471a6e0d408f82b0b22d1a7 | TMPDIR set to a writable tmpfs node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD 20834486f644c5a22471a6e0d408f82b0b22d1a7 | node scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD 20834486f644c5a22471a6e0d408f82b0b22d1a7 | node scripts/check-skill-context.mjs --routes | exit 0 |
| GATE-RAN | HEAD 20834486f644c5a22471a6e0d408f82b0b22d1a7 | node scripts/golden-fixture.test.mjs | exit 0 |
| GATE-RAN | HEAD 20834486f644c5a22471a6e0d408f82b0b22d1a7 | node scripts/version-parity-gate.mjs --content --base main | exit 0 |
| GATE-RAN | HEAD 20834486f644c5a22471a6e0d408f82b0b22d1a7 | (packages/agentic-workflow-schema) bun run test | exit 0 |
| GATE-RAN | HEAD 20834486f644c5a22471a6e0d408f82b0b22d1a7 | (packages/pi-agentic-workflow) bun run test | exit 0 |

Cycle-8 re-verification of the folded rows citing the four delta files:
F72 fixed (the dead `if (status === "done")` true-branch is deleted;
`grep -n 'status === "done"' scripts/unit-route.mjs` → the single reachable
occurrence at `:733`); F73 fixed (every `ceil(N x 1.10) = M` claim in
SKILL_CONTEXT_BUDGETS.json reproduces — 0 false over the whole file — and all
14 declared ceilings equal `ceil(measured × 1.10)` of `--routes`' real pairs);
F74 fixed (the P11 row's sum reproduces: the 14 route rows sum to exactly
175609 est / 12929 lines at this head); F75's remedy partly landed — the seven
`GATE-RAN` siblings cite `46eb430a`, while the `REVIEW-RAN` mark still cited
`846f3d7c` until cycle 9 re-pointed it (F79) — and the fold commit itself was
amended after the rows cited it → F76. Rows citing untouched files are
byte-identical to the cycle-7 verification.

DISPUTED (never a row): the brand pass re-reported the participial opener at
`skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:119-120` ("Restoring
… or obtaining …, then write a fresh receipt.") — F69's cited defect (verbless
fragment, no predicate) is fixed, the residual was explicitly adjudicated a
report-note in cycle 7; the adjudication is upheld. Refuted (verified false,
reported with counter-evidence, never persisted): "the P11 est sum drifted
(175623 vs 175609)" — the reviewer's awk swallowed the trailing `PASS route
budgets: 14 routes` line (the stray 14 inflates the sum); hand-summing the 14
route rows gives exactly 175609, matching the SPEC row. "the
unit-route.test.mjs 7 s debt TRIGGER fired (7070 ms)" — that run shared the
CPU with three concurrent passes; clean sequential re-runs give 6326 / 5575 /
5605 ms (45 pass / 0 fail each), and the fixture-per-case spawn count (11 on
`main` → 14 at head) is exactly the three cases cycle 6 already recorded — no
4th spawn exists.

Report notes, never persisted (`low`, report-only): `scripts/unit-route.mjs:771-775`
re-assigns `route`/`selected` already set by the enclosing branch and
`firstUnfinishedPhase` re-reads/re-parses the unit doc the caller just parsed
(existing duplicate-parse debt); `:781`'s comment cites "(checked above at
line :733)" — a line-number reference that will rot; the new fail-closed
message at `:772` interpolates `unit.dir` without `sanitize()` (stderr echo
only; no `child_process` in the script, no injection surface);
`scripts/unit-route.test.mjs:385-418`'s F40 case would silently exercise the
normal P2 route if the fixture's `## Tasks` regex ever stopped matching (an
`assert.ok(taskSection)` guard would fail loud);
`scripts/normative-drift.test.mjs:774-790`'s `internal` flag is still not
reset by a later heading (known latent, unchanged); nested parenthetical era
labels read poorly (`POLICY.md:66`, `PRE_EXECUTION.md:27`);
`CHANGELOG.md`'s audit-pr 5.6.2 row phrase "malformed bullet repair" dangles;
`node scripts/unit-route.mjs` is ~30% slower than `main`'s interleaved
(≈97–112 ms vs ≈83 ms) but within the stated ~122 ms baseline; all 14 declared
route ceilings re-verified clean. Debt transform: no new debt-shaped findings
— the pre-existing debt items (duplicate unit-doc parses ≈0.13 ms of a ~122 ms
CLI; fixture-spawn pattern with TRIGGER "the file crossing 7 s or a 4th
fixture-per-case spawn") are unchanged by this delta. Every finding has a
destination; this review creates no backlog.

## Cycle 9

Cycle 9 review ran 2026-10-20 (review-change) on the exact candidate
`HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd`, clean workspace, in sync with
origin, no PR (pre-PR checkpoint; `gh pr view --json state` → no pull requests
for the branch). Route: default review — the delta the cycle-8 fold receipt
requires (`RE-REVIEW-REQUIRED (delta)` after the F76–F77 batch) escalated to a
**full pass on Width**: the fold batch `0746f275..6128e903` is 25 added + 9
deleted = 34 changed lines (≤ 200) across 2 files (≤ 15) — no Size trigger —
but `review-findings.md`'s changed line at :632 sits 87 lines beyond the
nearest batch-cited line (F76 cites :538-545; the F77 cites at SPEC.md:20-24
were hit only within 50 lines), so one changed line is more than 50 lines from
every cited line → Width fired, full pass. Applicable passes ran isolated
(subagents): `review-code`, `review-security`, `review-verify`, `review-brand`,
`review-perf`; skipped with reasons — `review-design`/`review-a11y`/
`review-seo` (no UI, no web surface: the repo ships markdown skills, a docs
scaffold and node scripts). Synthesis (single reviewer), classification
(`review-implementation`) and the debt transform (`review-debt`) each ran
isolated. Acceptance: post-feature-61 unit — `sed -n '/^## Acceptance
criteria/,/^## /p' SPEC.md | git hash-object --stdin` →
`3b26da67bd597771ffe006e515ec47b0d5fc1b19`, exact match (unchanged; no SPEC
amendment). Gate at head, run by the isolated verify pass: root suites 696
pass / 0 fail exit 0, `check-skill-context` 28 skills exit 0, `--routes` 14
routes exit 0 (route rows sum 175609 est / 12929 lines — the P11 Evidence row
reproduces), golden-fixture 12/12 exit 0, version-parity content PASS exit 0,
schema 717 pass exit 0, pi 432 pass exit 0 — 7/7 fresh marks below; the review
also ran `ledger-provenance --check` itself → exit 0, recorded as finding F80
because its PASS validates zero rows on this ledger. Mutation-proof spot-checks
by the verify pass: reverting `scripts/unit-route.mjs` to `main` fails the
root suite (1 fail), mutating the F30/F49 CHANGELOG row shape fails
`normative-drift` (3 fails), both restored to a clean tree. Cycle count: 9 (8
counted `REVIEW-RAN` marks + 1) — far past the two-cycle cap; this invocation
is the user's explicit escape, never a reviewer election.

CONVERGENCE-ANOMALY — 36-verification-contract-hygiene spec
- Finding ids: F78 + F79 + F80 + F81 + F82 + F83 + F84 + F85 + F86
- Snapshots: acceptance blob `3b26da67bd597771ffe006e515ec47b0d5fc1b19` →
  `3b26da67bd597771ffe006e515ec47b0d5fc1b19` (unchanged; no SPEC amendment)
- Missed: no cycle ever ran an ancestry sweep over every folded cell and mark —
  F65–F71's dangling `3b60d5b7` survived cycles 6–8; `ledger-provenance
  --check` was trusted as provenance evidence in five report lines, one VF row
  and SPEC's progress log although it validates zero rows on this ledger
  (folded cells carry `yes · fold <sha>`, which the tool reads as not-folded
  at `:254`, and its citation set at `:263` never includes folded-cell tokens
  at all); F76's fold re-pointed only the four cells its row named; comment and
  CHANGELOG restatements were never re-derived against the shipped bytes
- Owning stage: source (ledger-provenance hygiene + evidence-restatement
  accuracy)
- Why the prior repair failed: the F75/F76 remedies were prose naming specific
  cells and marks — never the class — with no mechanical ancestor/vacuity
  guard; the cycle-8 fold then repeated the pattern (F81's persist-commit cells)
- Route to owner: `/fold-findings` (source-rooted; all rows fold into the
  current unit)

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F78 | docs/features/36-verification-contract-hygiene/review-findings.md:428-434 | workflow | med | fix-now | fold into current unit: the F65–F71 folded cells cite `fold 3b60d5b75e36a033b28d9872be57b919c79ef56c` — `git merge-base --is-ancestor 3b60d5b7… HEAD` → exit 1 (object exists; amend-orphan sharing parent `77894bbf` with ancestor `46eb430a`, the cycle-6 fold's final commit). F76's remedy re-pointed only F72–F75's four cells; a full sweep of all 72 folded cells finds these seven as the only dangling citations. Remedy: re-point the seven cells to `46eb430a`; never amend a commit the ledger names | yes · fold 2c709dee |
| F79 | docs/features/36-verification-contract-hygiene/review-findings.md:496 + :656-657 | workflow | med | fix-now | regression of F75 → fold into current unit: the cycle-6 tail `REVIEW-RAN` at :496 still cites `846f3d7c3a9422677c4c52ae939c9c934d0a6d2d` (`is-ancestor` → exit 1; reflog-only sibling of `46eb430a`, same parent `77894bbf`); F75's fold re-pointed only the seven `GATE-RAN` siblings (at the post-fold head `20834486` the :496 row still cites `846f3d7c`), so the cycle-8 re-verification claim at :656-657 ("the cycle-6 tail marks now cite `46eb430a`, a true ancestor") is false for :496. Remedy: re-point or re-issue the mark at the exact reviewed head and correct the :656-657 claim | yes · fold 2c709dee |
| F80 | docs/features/36-verification-contract-hygiene/review-findings.md:342,422,521,586,610,637 + SPEC.md:292 + scripts/ledger-provenance.mjs:254,263 (tool not in the branch diff) | verify | high | fix-now | fold into current unit: `node scripts/ledger-provenance.mjs docs/features/36-verification-contract-hygiene/review-findings.md --check` → `rows 72 {"open":72}` + `CHECK PASS` exit 0 — every row parses `open` because folds write `yes · fold <sha>` into the folded cell and the tool tests `folded !== "yes"` (`:254`), while its citation set is file+route cells only (`:263`), so folded-cell tokens are doubly unchecked; `--json` shows fold/flip null for all 72. Cited claims: five report PASS lines (:342, :422, :521, :586, :610), VF-71's false mechanism "because the tool verifies existence, not ancestry" (:637), SPEC's progress log "ledger-provenance PASS" (:292). Contrast: unit-26's ledger (plain `yes` cells) → `proven-cited:107`. The tool's own header declares silent-pass the exact class P20/F106 exists to prevent. Remedy: parse `yes · fold <sha>`, verify folded-cell tokens (resolve + ancestry + id/message tie), pin annotated-ledger validation in `ledger-provenance.test.mjs`, and reword the claims to what the tool actually checks | yes · fold 2c709dee |
| F81 | docs/features/36-verification-contract-hygiene/review-findings.md:632-633 | workflow | med | fix-now | fold into current unit: the F76/F77 folded cells cite `fold 0746f275` — the cycle-8 persist commit where both rows read `folded: no` (`git show 0746f275:<ledger>`) — while the flip/fold commit is `6128e903`; every other row names its fix commit. Remedy: re-point both cells to `6128e903` in a follow-up commit (write the cell after the fix commit exists; never amend a cited commit) | yes · fold 2c709dee |
| F82 | scripts/unit-route.mjs:753-754 | code | med | fix-now | fold into current unit: the branch-added comment (introduced by `f85567cd`; absent on `main`) reads "F26: if all phases are done AND status is `done`, route to close-out", but the `status === "done"` branch at :733 returns close-out before any phase check — live repro: fixture `13-execute-unit` (Progress records P1 only) with roadmap row 13 set to `done` → `route: close-out` / `next: /audit-pr`, exit 0, P2 unrecorded. The behavior itself is main-parity (cycle-7's refutation stands); the comment documenting an unenforced rule is the defect. Remedy: state what the code does (close-out keys on status only) | yes · fold e4882c34 |
| F83 | skills/unit-lane/SKILL.md:110-115 + skills/unit-lane/references/IMPLEMENT.md:25 | code | med | fix-now | fold into current unit: P6/F31 shipped the router's fail-closed refusal (live: `node scripts/unit-route.mjs 36-verification-contract-hygiene` → `UNIT ROUTE — error … settle the index or roadmap status`, exit 1) but neither documented call site names it — both files (untouched by the diff) still present the router as printing the first unfinished phase / the ladder continuing straight to close-out, and `grep -rn "settle the index" skills/unit-lane skills/execute-phase` → empty. Counter-evidence verified (lowers impact, not existence): ladder step 6 never invokes the router, execute-phase uses the separate `--triage` path (unaffected), the error self-documents its remedy, and this unit's `## Next` calls the refusal correct. Remedy: name the refusal state and its remedy at both call sites | yes · fold e4882c34 |
| F84 | CHANGELOG.md:742 | brand | med | fix-now | fold into current unit: the 1.4.2 row's quote 'within the project's per-command timeout budgets' matches `skills/verification-contract/SKILL.md:51` exactly, but its clause "the same repair F37 applied to both exported templates" overstates — neither template carries "per-command" (`grep -rn "per-command"` over skill + both templates → skill:51 only; fix template:79 reads "within the project's timeout budgets"), and AC4 accepted the template variant. Remedy: quote what the templates read or drop the parity clause | yes · fold e4882c34 |
| F85 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:470 vs 14× "1456 est / 116 lines" (first :120) | brand | med | fix-now | fold into current unit: one measurement event recorded two ways — `policy.declared` (dated 2026-09-18, feature 60 P3) says "skills/verification-contract/SKILL.md measured 1459 est" while 14 occurrences of the `feature 60 P3` note say "grew to 1456 est / 116 lines" for the same file/event; `node scripts/check-skill-context.mjs` at head measures `verification-contract 1479 115` (a third, current value), and SPEC O13 marks the growth-source measurements verified/honest. Remedy: re-derive the event's value (or date each point-in-time explicitly) and write it identically in both places | yes · fold BATCH_SHA |
| F86 | CHANGELOG.md:100 | brand | med | fix-now | regression of F63 → fold into current unit: the 0.22.0 companion row names only `verification-contract` 1.4.2 while this PR ships six bumped skills (audit-pr 5.6.2, pre-execution-review 2.7.1, review-change 3.12.1, review-implementation 1.11.1, workflow-status 3.9.2 — five frontmatter bumps in this diff); sibling companion rows (0.21.0, 0.20.0) enumerate every shipped skill, and the row is dated 2026-10-18 while the named 1.4.1/1.4.2 rows are dated 2026-10-19. F63's literal version fix landed (1.4.2; `ACCEPTANCE.md` spelled); its instruction "name what this PR ships" remains incompletely satisfied — counter-evidence: the content-parity gate passes (presence-only). Remedy: list all six versions and fix the date | yes · fold BATCH_SHA |

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| VF-73 | docs/features/36-verification-contract-hygiene/review-findings.md:428-434 · reviewer review-change · HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd · recheck `git merge-base --is-ancestor 3b60d5b75e36a033b28d9872be57b919c79ef56c HEAD` → exit 1; `git log -1 --format='%h %p %s' 3b60d5b7…` → parent 77894bbf, same as ancestor 46eb430a; full sweep of all 72 folded cells: 65 name ancestors, only F65–F71 dangle | workflow | confirmed | finding-mark | n/a | n/a |
| VF-74 | docs/features/36-verification-contract-hygiene/review-findings.md:496 + :656-657 · reviewer review-change · HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd · recheck `git merge-base --is-ancestor 846f3d7c3a9422677c4c52ae939c9c934d0a6d2d HEAD` → exit 1; `git show 20834486:<ledger>` → :496 cites 846f3d7c after F75's fold while :497-503 cite 46eb430a; direct read of :656-657 asserts the whole tail now cites 46eb430a | workflow | confirmed | finding-mark | n/a | n/a |
| VF-75 | docs/features/36-verification-contract-hygiene/review-findings.md:342,422,521,586,610,637 + SPEC.md:292 + scripts/ledger-provenance.mjs:254,263 · reviewer review-change · HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd · recheck `node scripts/ledger-provenance.mjs <ledger> --check` → `rows 72 {"open":72}` + CHECK PASS exit 0; `--json` → every row status open, fold null, flip null; `grep -c '^| F.*| yes · fold' <ledger>` → 72; `:254` tests `folded !== "yes"`, `:263` reads citations from file+route cells only; same tool on unit-26's ledger → `proven-cited:107` | verify | confirmed | finding-mark | n/a | n/a |
| VF-76 | docs/features/36-verification-contract-hygiene/review-findings.md:632-633 · reviewer review-change · HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd · recheck `git show 0746f275:<ledger>` → F76/F77 folded cells `no`; `git show 6128e903:<ledger>` → `yes · fold 0746f275`; 0746f275 subject "docs(36): persist cycle-8 review findings (F76-F77)" (the record-open commit); the flip is introduced in 6128e903 | workflow | confirmed | finding-mark | n/a | n/a |
| VF-77 | scripts/unit-route.mjs:753-754 · reviewer review-change · HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd · recheck direct read of :753-754 vs the :733 chain; live repro on a tmp copy of fixture 13-execute-unit with roadmap row 13 → `done`: `route: close-out` / `next: /audit-pr` exit 0 while Progress records only P1; `git show main:scripts/unit-route.mjs | grep -c 'all phases are done AND'` → 0; `git log -S'all phases are done AND'` → f85567cd (branch) | code | confirmed | finding-mark | n/a | n/a |
| VF-78 | skills/unit-lane/SKILL.md:110-115 + references/IMPLEMENT.md:25 · reviewer review-change · HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd · recheck direct read of both call sites; live `node scripts/unit-route.mjs 36-verification-contract-hygiene` → `UNIT ROUTE — error` / "settle the index or roadmap status", exit 1; `grep -rn "settle the index\|settle the roadmap" skills/unit-lane skills/execute-phase` → empty; unit-lane step 6 read (no router call); `git diff main...HEAD --stat -- skills/unit-lane skills/execute-phase` → empty | code | confirmed | finding-mark | n/a | n/a |
| VF-79 | CHANGELOG.md:742 · reviewer review-change · HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd · recheck direct read: row quote equals skills/verification-contract/SKILL.md:51 verbatim; `grep -rn "per-command" skills/verification-contract/SKILL.md template/docs/*/_TEMPLATE/SPEC.md` → skill:51 only; template fix:79 reads "within the project's timeout budgets" | brand | confirmed | finding-mark | n/a | n/a |
| VF-80 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:470 vs 14× "1456 est / 116 lines" (first :120) · reviewer review-change · HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd · recheck context extract around :470 → "2026-09-18 (feature 60 P3 … growth source: skills/verification-contract/SKILL.md measured 1459 est)"; `grep -c "1456 est / 116 lines"` → 14; `node scripts/check-skill-context.mjs` → `verification-contract 1479 115` exit 0 | brand | confirmed | finding-mark | n/a | n/a |
| VF-81 | CHANGELOG.md:100 · reviewer review-change · HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd · recheck full row read → names only `verification-contract` 1.4.2, dated 2026-10-18; five frontmatter version bumps in this diff (audit-pr 5.6.2, pre-execution-review 2.7.1, review-change 3.12.1, review-implementation 1.11.1, workflow-status 3.9.2); sibling rows 0.21.0/0.20.0 enumerate multiple skills; rows 1.4.1/1.4.2 dated 2026-10-19 | brand | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd | TMPDIR set to a writable tmpfs node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd | node scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd | node scripts/check-skill-context.mjs --routes | exit 0 |
| GATE-RAN | HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd | node scripts/golden-fixture.test.mjs | exit 0 |
| GATE-RAN | HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd | node scripts/version-parity-gate.mjs --content --base main | exit 0 |
| GATE-RAN | HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd | (packages/agentic-workflow-schema) bun run test | exit 0 |
| GATE-RAN | HEAD 6128e9039b91fcf0e17e4c0c78f79262662b22bd | (packages/pi-agentic-workflow) bun run test | exit 0 |

Cycle-9 re-verification of every `folded: yes` row at its cited location:
files byte-identical since the cycle-8 verified head (`20834486..HEAD` touches
only SPEC.md and this ledger) inherit that verification; F76 fixed (cells cite
ancestor `20834486`, whose subject names F72–F75); F77 fixed (the Objective no
longer claims "changes only"; `## Amendments` present); F74 fixed (SPEC:251
region byte-identical; the P11 sum reproduces at 175609 est / 12929 lines over
the 14 `--routes` rows); F75 → regression (F79); the ancestry sweep adds F78
(seven cells) and the F81 cell-provenance defect (ancestor, but the wrong
commit). Rows citing untouched files are byte-identical to the cycle-8
verification.

DISPUTED (never a row): none. Refuted (verified false, reported with
counter-evidence, never persisted): the perf pass's three budget-note candidates
— "the `fix 285 (AC3)`/`pre-execution-review`/`review-implementation`/
`workflow-status` notes do not reproduce their declared ceilings" — each cited
note is a superseded event entry with a later same-map note reproducing the
field exactly (`= 2889` at :39, `= 4325` at :49, `= 3004` at :63, `= 2774` at
:98; :36's `= 3294` matches `mainEstimateMax`), and the pass's own checklist
found 0 arithmetic failures with all 14 route ceilings equal to the current
`--routes` pairs; "audit-pr's `ceil(9747 x 1.10) = 10722` note contradicts the
declared 10835" — superseded in place by :118's `unit 36 / feature 36` note
(9850 → 10835 / 668) and :119; ":330 states ceil(11634 x 1.10) = 12798" —
:330 currently reads `10456 → 11502`, matching the declared `11502/906`, and
`11634|12798` survives only in :470's dated `declared` changelog (the perf pass
quoted the folded F66 row's historical text as current bytes). The verify
pass's ":632 cites non-ancestor `f3fab05c`" — that token is F76's route prose;
the folded cell cites `0746f275`, an ancestor (its defect is F81, cited
separately). The code pass's unit-lane "dead-ends" framing — ladder step 6
never invokes the router, `--triage` is unaffected, and the refusal message
self-documents its remedy; the residual docs edge persists as F83.

Report notes, never persisted (`low`, report-note = debt notes with triggers):
SPEC.md:46's Amendments figure "(+1803/−538)" reproduces only at `0746f275`
(head: +1819/−538 three-dot; F77's row cites +1699) — TRIGGER: the next
amendment changing the branch total, or any self-inclusive count cited as
frozen evidence (re-derive at the folded head or drop volatile counts);
`scripts/unit-route.test.mjs:33` `routeNext` duplicates `nextLine` (`:55`, one
use at `:416`; branch-added, absent on main) — TRIGGER: a third `next:`-parser
helper, or the two helpers diverging; regression of F64's two residual false
statements (CHANGELOG:741 claims the label "(legacy (pre-feature 61))" landed in
CLASSIFY.md — that file has zero occurrences, its line 45 reads "(legacy
`ACCEPTANCE.md` or post-feature 61 …)"; CHANGELOG:476 says the label landed in
review-change's frontmatter `description:` — untouched, only the version line
and body :59-62 changed) — TRIGGER: the next era-label changelog row, or a
`review-implementation`/`review-change` description edit. Carried debt
unchanged by this delta: unit-route's duplicate unit-doc parses ≈0.13 ms of a
~122 ms CLI (TRIGGER: a 4th builder copy or build time crossing the gate
budget) and the fixture-spawn pattern (TRIGGER: the file crossing 7 s or a 4th
fixture-per-case spawn — 14 total spawns at head, the three cycle 6 recorded).

Debt transform (every row evaluated): 3 low rows transformed to debt notes with
triggers (the Amendments figure, `routeNext` duplication, the F64 residuals);
9 fix-now rows n/a as debt — current-unit correctness/honesty work paid by this
cycle's fold, never deferred; 2 pre-existing items carried with unfired
triggers. No current-unit debt was mislabeled non-blocking. Every finding has
a destination; this review creates no backlog.
