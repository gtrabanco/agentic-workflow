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
| F21 | skills/audit-pr/SKILL.md; skills/pre-execution-review/SKILL.md; skills/review-change/SKILL.md; skills/review-implementation/SKILL.md; skills/workflow-status/SKILL.md; CHANGELOG.md | workflow | high | fix-now | fold into current unit: bump each changed skill's `version:` (patch for reference-only wording, minor for a contract change) and add its CHANGELOG row — `review-change` is the indisputable one (its SKILL.md changed); the other four changed references | yes · fold 54fbf64754cdb398ac26f140b2846352ae48c8c4 |
| F22 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:160,184,210,233,257,280,304,360,393,426,459 | perf, verify | med | fix-now | fold into current unit: re-measure `--routes` and rewrite each declared base/ceiling to the true `ceil(measured×1.10)`; drop `execute-phase/SKILL.md` + `EXECUTION_CONTRACT.md:127` from the growth-source text (the branch never changed them) | yes · fold 52e917c10232dd752b053458516c3265643c8dd5 |
| F23 | CHANGELOG.md:736 | brand, verify | med | fix-now | fold into current unit: name the per-command caps (`fastCommandTimeoutMs` 10 min / `fullCommandTimeoutMs` 60 min) or point at the schema's per-command `timeoutMs`; move the consumer-migration claim to the rows of the five skills that changed | yes · fold 54fbf64754cdb398ac26f140b2846352ae48c8c4 + 52e917c10232dd752b053458516c3265643c8dd5 |
| F24 | template/docs/fix/_TEMPLATE/SPEC.md:74-81 + template/docs/features/_TEMPLATE/SPEC.md:23-30 | code, brand | med | fix-now | fold into current unit: drop "the schema package" from both exported templates (AC4 needs only "bounded runtime") and use the same post-F10 determinism sentence in both | yes · fold 97d26727e1822617439378c05844feead0aa76f7 |
| F25 | docs/features/36-verification-contract-hygiene/SPEC.md:178,180,184 | verify | med | fix-now | regression of F8 → fold into current unit: re-record AC1/AC3 with the actual lines (44/49) and re-label the AC7 version-parity cite as a gate row with its command and exit 0 | yes · fold 97d26727e1822617439378c05844feead0aa76f7 |
| F26 | docs/features/36-verification-contract-hygiene/review-findings.md:24,70-78 (F9) + scripts/unit-route.mjs:606-608 | workflow | med | fix-now | regression of F9 → fold into current unit: make the F9 claim reproduce — either add a close-out/review route for a fully-executed, ledger-clean `in-progress` unit or record the residual and settle the index/`Next` state. The check is the reviewed head's own ledger (`git show 636341e8:docs/features/36-verification-contract-hygiene/review-findings.md` — every row folded, no open rows) plus `node scripts/unit-route.mjs 36-verification-contract-hygiene` at that head → exit 1; a later open-row ledger routes `fold` for a different reason and does not prove F9 | yes · fold 97d26727e1822617439378c05844feead0aa76f7 |
| F27 | README.md:664-667 | brand | med | fix-now | fold into current unit: replace the four entries with issue #183's bibliography as printed — full author lists, original `"Writing harnesses"` title | yes · fold 97d26727e1822617439378c05844feead0aa76f7 |

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
| F28 | scripts/normative-drift.test.mjs:886-1032 + scripts/ledger-ownership.test.mjs:482-646 | verify | high | fix-now | fold into current unit: repair F29 + F30, then re-run all seven gate commands at the repaired head and record fresh GATE-RAN marks; AGENTS.md § Verification defines green as the root suite passing | yes · fold 50f359da |
| F29 | skills/pre-execution-review/references/LEDGERS.md:150 | code | high | fix-now | regression of F19 → fold into current unit: the `acceptance-manifest` validator cell carries an escaped pipe (`sed … \| git hash-object --stdin`), so the `ledger-ownership@1` row parses 7 cells instead of 6 (`awk -F'\|'` → 7 at head, 6 at 1b764942) and `ledger-ownership.test.mjs` fails 6 of 11; keep one command form in the cell and move the era split into prose | yes · fold e7b1c1eb |
| F30 | CHANGELOG.md:211,476,566 | workflow | high | fix-now | regression of F21 → fold into current unit: the three patch versions were added name-prefixed into the `\| Version \| Date \| Type \| What changed \|` tables, so `versionCells()` (`^\|\s*(\d+\.\d+\.\d+)\s*\|`) never reads them and `newestVersionCell` still returns 5.6.0 / 3.12.0 / 3.9.1 against frontmatter 5.6.1 / 3.12.1 / 3.9.2; write the rows in the section's own shape and drop the copies | yes · fold e7b1c1eb |
| F31 | scripts/unit-route.mjs:745-757 | code | high | fix-now | fold into current unit: the close-out guard fires for any status that is not `done`/`absent` once all phases are recorded — reproducer (fixture roadmap row set to `defined`, both phases recorded) returns `route: close-out` / `/audit-pr` exit 0 where `main` refuses with exit 1 — and it re-runs the `readProject` + `parseUnitDocPhases` + `recordedPhases` derive that `firstUnfinishedPhase` already owns; gate the branch on the in-progress status and return the unfinished list from one helper | yes · fold f85567cd |
| F32 | docs/features/36-verification-contract-hygiene/SPEC.md:183-184 | verify | high | fix-now | regression of F25 → fold into current unit: both AC7 Evidence rows record `exit 0` while `node --test scripts/*.test.mjs` exits 1 at this head, and the AC6 row was replaced instead of kept, so O5's `required-evidence: Evidence row AC6` points at no row (the table carries AC7 twice); re-record one AC7 row with the real exits and restore the AC6 row | yes · fold 50f359da |
| F33 | docs/features/36-verification-contract-hygiene/SPEC.md:206-212 | workflow | med | fix-now | replan-in-unit (plan route): `## Next` claims the gate was "re-verified green at the settled head f03fc673", which is not in this branch (`git cat-file -t` unresolvable) and whose suite is red anyway; rewrite it at the reviewed head with the real gate state and the router's close-out route | yes · fold b86d1482 |
| F34 | skills/verification-contract/SKILL.md:66-70 | architecture | med | fix-now | regression of F20 → fold into current unit: the post-feature-61 `## Acceptance receipt v1` block still declares a receipt nothing writes (`grep -rn "Acceptance receipt" docs/features/` → none; `execute-phase/SKILL.md:13-15` names the Evidence rows the receipts), so the stop/repair block keys on a phantom artifact; give it one owner — declare the Evidence table the receipt and delete the block, or wire the executor to write it | yes · fold ea4ce056 |
| F35 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:118-120 | code | med | fix-now | fold into current unit: `af67eb9e` appended a remedy sentence mid-bullet after the `→ Next: /unit-lane <unit>` clause with no terminator, so it runs into the sibling `- Lane-era path` bullet, and the same remedy already exists at `:159`; delete the appended clause or place it deliberately in the ACCEPTANCE-GATE block | yes · fold 320bf180 |
| F36 | README.md:663-666 | brand | med | fix-now | regression of F27 → fold into current unit: the three citations still truncate the issue #183 author lists to "Görz et al." / "Sheng et al." / "Manès et al."; `gh issue view 183` prints the full lists and the ledger's own directive was "full author lists" | yes · fold 5eae8492 |
| F37 | template/docs/features/_TEMPLATE/SPEC.md:30 + template/docs/fix/_TEMPLATE/SPEC.md:81 | architecture | med | fix-now | regression of F24 → fold into current unit: both exported templates keep this repository's nouns ("within the timeout budgets published by the schema package", "rides the existing commands class"), which F24 asked to drop and AGENTS.md forbids in shared docs; state the bound without repo-specific vocabulary | yes · fold 8a7664cc |
| F38 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:162,186,212,235,259,348 | perf | med | fix-now | regression of F22 → fold into current unit: the new `unit 36 / feature 36` growth entries cite `execute-phase/references/EXECUTION_CONTRACT.md` and `execute-phase/SKILL.md`, neither of which the branch changed (`EXECUTION_CONTRACT.md` mentions: 8 on `main`, 15 at head), and the review-change entries state `ceil(<already-ceiled value> × 1.10)` (`:348` "ceil(1360 × 1.10) = 1496 lines" for a measured 1355); name the real growth source (`skills/verification-contract/SKILL.md`) and state the pre-re-basis measurement | yes · fold 0914a011 |
| F39 | skills/verification-contract/SKILL.md:22 | brand | med | fix-now | regression of F18 → fold into current unit: the rewritten branch still reads as a present-tense mandate ("Legacy (pre-feature 61) units: every new feature/fix carries a frozen `ACCEPTANCE.md` … Copy the matching repository template") for an artifact `execute-phase/SKILL.md:13-14` declares gone and a template that does not exist (`find template -iname "*acceptance*"` → empty); restate as binding-if-present and drop the template instruction | yes · fold ea4ce056 |

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
| F40 | scripts/unit-route.mjs:598-604,762-773 | code, security | high | fix-now | regression of F31 → fold into current unit: `unfinishedPhases` returns ONE empty set for "doc absent / no `## Tasks` — untouched work routes to P1" (its own docstring) and "all phases recorded"; the new close-out guard reads it as proof of the latter and refuses with that unverified claim. Reproducer: a unit doc whose `## Tasks` heading is absent → `UNIT ROUTE — error … has all phases recorded but status is 'in-progress'` at head where `main` routed `route: execute` / `/execute-phase <unit> P1`. Return a discriminated result (`absent \| empty \| unfinished`) and consume it at both call sites | yes · fold 320bf180 |
| F41 | scripts/unit-route.mjs:621,764 | code | med | fix-now | fold into current unit: two dead predicates from the same P6 repair — `firstUnfinishedPhase`'s `if (unfinished.length === 0) fail(...)` is the negation of the `donePhases.size === 0` guard two lines above it, and `if (status === "done")` is nested inside the `else` of `else if (status === "done")` so it can never run. Delete both; F40's single-helper rewrite makes them redundant anyway | yes · fold 320bf180 |
| F42 | skills/review-change/references/REVIEW_PROCESS.md:34-35 | code, architecture, verify | med | fix-now | fold into current unit: delta-mode step 3 still makes "the sibling acceptance-manifest `ACCEPTANCE.md` blob recomputed to an **exact match** … unchanged and still mandatory" a precondition for every unit, while step 2 in the same file was migrated to the unit-doc acceptance source at `:56`; the text is branch-added (`e28ff213`). Unsatisfiable for every post-feature-61 unit — rewrite it onto "the step-2 acceptance artifact", the F34/F39 class in a sibling line | yes · fold c3093453 |
| F43 | docs/features/36-verification-contract-hygiene/SPEC.md:217-219,240,244,247 | verify, workflow | med | fix-now | fold into current unit: the `## Evidence` heading is empty and its table is nested under `## Triaged steps`, and three rows carry unescaped `\|` so they split into 10/7/7 cells — the `Exit / digest` cells of P5, P9 and AC6 hold table fragments and author names instead of exit codes | yes · fold 0e43990c |
| F44 | docs/features/36-verification-contract-hygiene/SPEC.md:146-150 | verify, workflow | high | fix-now | regression of F32 → fold into current unit: obligations O10–O14 still read `planned` although every evidence target exists, and O14's `required-evidence: Evidence row P12` resolves to no row at all (`grep -nE "^\| P12 \|" SPEC.md` → no match) | yes · fold b44bc14f |
| F45 | docs/features/36-verification-contract-hygiene/review-findings.md (tail) | verify, workflow | high | fix-now | regression of F28 → fold into current unit: no `GATE-RAN` mark exists at the reviewed head (newest are at `d85eeb40`) although P12's Task and Progress entry claim fresh marks were appended and O14 requires them; all seven gate commands do exit 0 at `77280bea` | yes · fold ccf54694 |
| F46 | docs/features/36-verification-contract-hygiene/review-findings.md:27-29,96-98 | verify, code | med | fix-now | fold into current unit: F18–F27 appear in two tables, so `node scripts/ledger-provenance.mjs <ledger> --check` exits 1 with "10 row(s) the 7-column schema refused were read by nothing"; and the fold cell cites a non-existent 40-hex `af67eb9e54cfd95eef7b12406a6905d7e1abbd23` where the real commit is `af67eb9e54cfd95eef7b12406a6905d7e1abbd23` | yes · fold ccf54694 |
| F47 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:162,186,212,235,259 | perf, code | med | fix-now | regression of F38 → fold into current unit: the seven `execute-phase:*` `unit 36 / feature 36` growth entries still name `execute-phase/SKILL.md:13-14,22` and `execute-phase/references/EXECUTION_CONTRACT.md:127`, and `git diff --name-only main...HEAD \| grep execute-phase` is empty; P11 repaired the `feature 60 P3` entries and left these | yes · fold 0914a011 |
| F48 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:212,348,355 + skills/verification-contract/SKILL.md | perf, brand | med | fix-now | regression of F22 + F38 → fold into current unit: `ceil(1360 x 1.10) = 1496` is stated but equals 1497, and 1360 is the already-ceiled feature-60 value rather than the measured 1355; `ceil(11052 x 1.10) = 12157` where the true value is 12158; and the entries state the skill "grew to 1459 est" where it measures 1460 est / 116 lines | yes · fold 0914a011 |
| F49 | CHANGELOG.md:742 + scripts/normative-drift.test.mjs:771-785,703 | workflow, brand, verify | high | fix-now | fold into current unit: `verification-contract` frontmatter is 1.4.1 but its newest CHANGELOG row is 1.4.0 and no 1.4.1 row exists, although P7's Evidence row claims "version bumped 1.4.0→1.4.1 + CHANGELOG row". The reason a green gate missed it: `versionCells()` only collects rows under a `#### \`<skill>\`` heading, and no such heading exists for `verification-contract` (its rows live in the shared `### Internal` table with the name in the first column), so `newestVersionCell` returns null and the `version-tables` claim at `rendered-facts@1` is skipped for every internal skill. Add the 1.4.1 row and make the claim read that table shape | yes · fold c3093453 |
| F50 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:119-120 | code, brand, verify | med | fix-now | regression of F35 → fold into current unit: the P8 fold replaced the `)` closing the parenthetical opened at `:99` with `.` (so it stays unclosed) and left the remedy sentence running into the sibling `- **Lane-era path**` bullet; `CHANGELOG.md:566` then ships an audit-pr 5.6.2 row claiming the bullet was terminated | yes · fold 320bf180 |
| F51 | skills/verification-contract/SKILL.md:51 | architecture, brand | med | fix-now | fold into current unit: branch-added repo-specific noun in an installable skill — "within the timeout budgets published by the schema package" — the exact phrase F37 removed from both exported templates in this same batch; AGENTS.md's stack-agnostic rule forbids it in skills and shared docs | yes · fold 320bf180 |
| F52 | docs/features/36-verification-contract-hygiene/SPEC.md:272-274 | workflow | high | fix-now | regression of F33 → fold into current unit: `## Next` claims "all replan rows (F28–F39) folded and verified green" and routes to `/review-change`, while all twelve rows still read `folded: no` and `node scripts/unit-route.mjs 36-verification-contract-hygiene` prints `open-rows: 12` / `route: replan` / `next: /unit-lane 36-verification-contract-hygiene` | yes · fold b86d1482 |
| F53 | docs/features/36-verification-contract-hygiene/SPEC.md:107-118 | verify, workflow | med | fix-now | fold into current unit: `## Applicable tests` still says "No new test: … the change is wording-only" and `### Known pre-existing issues` still says "none observed", while the branch changes `scripts/unit-route.mjs` and adds a `defined`-status test case to its suite | yes · fold 320bf180 |
| F54 | docs/features/36-verification-contract-hygiene/SPEC.md:238,246 | verify | med | fix-now | regression of F25 → fold into current unit: two Evidence rows do not reproduce — the P4 AC7 row cites `node scripts/version-parity-gate.mjs` without `--content` (real exit 2, usage printed; recorded `exit 0`), and the P11 row records a bare `0` plus an invented "14 routes PASS (10990 est total under declared ceilings)" where the tool prints no total and the real total is 175373 est / 12941 lines | yes · fold 320bf180 |

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
