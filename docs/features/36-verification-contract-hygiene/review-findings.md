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
| F1 | docs/workflow/SKILL_CONTEXT_BUDGETS.json:341-400 + skills/verification-contract/SKILL.md:36-49 | perf, verify | high | fix-now | fold into current unit: pay F10/F11 first, then re-measure `node scripts/check-skill-context.mjs --routes`; a ceiling that still fails is re-based at a declared `sources` entry naming verification-contract 1.4.0 / issue #183 — never widened silently | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
| F2 | packages/pi-agentic-workflow/package.json:3 + CHANGELOG.md:71 | verify | high | fix-now | fold into current unit: bump the Pi package version and add its "Companion npm packages" row in this PR so `node scripts/version-parity-gate.mjs --content --base main` exits 0 | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
| F3 | README.md:664-667 | security, brand | high | fix-now | fold into current unit: replace the four entries with issue #183's bibliography verbatim — real titles, full author lists, Görz et al. dated 2025 (arXiv 2505 = 2025-05), `https://appsec.guide/docs/fuzzing/techniques/writing-harnesses/` | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
| F4 | README.md:663 | code, brand | high | fix-now | fold into current unit: restore "… material = `medium`+) is built." and remove the trailing space — a P3 append must not delete pre-existing prose | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
| F5 | README.md:663 | brand | med | fix-now | fold into current unit: correct the pre-existing title while the line is edited — arXiv:2603.00539 is "Are LLMs Reliable Code Reviewers? Systematic Overcorrection in Requirement Conformance Judgement" | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
| F6 | docs/features/36-verification-contract-hygiene/SPEC.md:183 | verify | high | fix-now | fold into current unit: re-record AC7 with the real exit codes of both halves (`node --test scripts/*.test.mjs`, `node scripts/check-skill-context.mjs --routes`); a red run is recorded red | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
| F7 | docs/features/36-verification-contract-hygiene/SPEC.md:132-140 | workflow | med | fix-now | fold into current unit: flip O1-O5 to `verified` and add the issue #183 budget re-basis obligation with its phase and validator | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
| F8 | docs/features/36-verification-contract-hygiene/SPEC.md:179-182 | verify | med | fix-now | fold into current unit: record the exact command and exit status per AC row; AC4's cited `grep -n "determin"` does not match the property/fuzz sentence — name the line that does | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
| F9 | docs/features/ROADMAP.md:46 | workflow | med | fix-now | fold into current unit: set row 36 to `in-progress` (branch open, no PR) per the status legend so `node scripts/unit-route.mjs 36-verification-contract-hygiene` stops refusing the unit | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
| F10 | skills/verification-contract/SKILL.md:42-45 | code, brand, perf | med | fix-now | fold into current unit: delete the restatement, keep one canonical determinism sentence, then re-measure `--routes` | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
| F11 | skills/verification-contract/SKILL.md:45-47 | code | med | fix-now | fold into current unit: name the per-command caps (`fastCommandTimeoutMs` 10 min / `fullCommandTimeoutMs` 60 min) or point at `verification-plan.schema.json`'s per-command `timeoutMs` bound — `fullStageTimeoutMs` is the 120-minute whole-stage sum | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
| F14 | skills/verification-contract/SKILL.md:8,20,52,64 + skills/review-change/SKILL.md:62 + skills/pre-execution-review/references/LEDGERS.md:58,150 + skills/pre-execution-review/references/POLICY.md:66,152 + skills/pre-execution-review/references/SNAPSHOT.md:64 + skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:111 + skills/workflow-status/references/PRE_EXECUTION.md:27 | architecture | med | fix-now | owner directive 2026-10-18 (in scope, do now): finish the ACCEPTANCE-era migration the workflow already decided — feature 61 P4 (`ACCEPTANCE.md is gone`, 2bd7c100) and fix/285 (`binds when present`, 5f111ff3) — by rewriting every surviving mandate line onto the unit doc's acceptance source; the machine side is already migrated (`scripts/pre-execution-contract.mjs:44` `required: false`, `lane-era-lineage.test.mjs`), so this is prose, and historical mentions (execute-phase's "is gone" notes, schema comments) stay untouched | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
| F15 | template/docs/features/_TEMPLATE/SPEC.md:17-21 + docs/fix/_TEMPLATE/SPEC.md:31-33 | code | med | fix-now | owner directive 2026-10-18 (in scope): mirror the determinism + property/fuzz sentences, in the post-F10 dedup wording, into the two template substrates that still lack them; severity raised from the reviewer's `low` by owner materiality call, so it becomes an actionable row | yes · fold 188234938c5a44081e51dbed0a90bf63982d88dc |
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
