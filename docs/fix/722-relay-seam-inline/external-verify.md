# External verify — 2026-11-27

EXTERNAL VERIFY — base: f1b04a3a9093e17fe423e37cba1380f73a6ba963 · head: a43cf93d7ba7618acc81ac668da006d0a3e901c2
Blockers: 0
Advisories: 4 — (1) `packages/agentic-workflow/test/doc.structure.test.mjs:330` and `scripts/ceremony-findings-ledger.test.mjs` — gate attempts 1–3 red on `SUITE TIMEOUT` wall-clock kills (240.3s / 240.5s / 120.3s) with zero assertion failures while 2–3 other sessions' gates ran concurrently (load 10–16 on 6 CPUs); both suites are untouched by the diff and the failure mode is pre-documented in `scripts/test-timeout-allowlist.json`, so it is environmental, not change-caused — attempt 4 `bun scripts/local-gate.mjs --jobs 2` → PASS (20 steps, 694s). (2) `docs/workflow/SKILLS.md:80` — the unit-lane summary still says the pi-web hand-off "runs as Relay legs" without naming the seam's ask-and-stop; pre-existing summary whose same sentence defers to RELAY.md §Bootstrap as owner, and it asserts no old truth. (3) `skills/unit-lane/references/RELAY.md:119` — contract-text qualifier check: base step 3's explicit permission "drafting a packet is allowed before approval" has no verbatim survivor; its substance survives (§Bootstrap steps 1–2 order packet creation before the ask, step 3 handles the `draft` state) and the paired prohibition stays absolute at `§Forbidden` (line 331) — advisory, no binding rule lost or flipped. (4) the old `relay-next: … then dispatch_relay` wording survives only in 24 dated unit-doc triage receipts and `docs/LOGS.md:9446` — historical machine receipts, not live instructions (`rg 'then dispatch_relay' skills/ docs/workflow/ packages/ template/` = 0 matches).
Sibling sweep: clean — no live surface asserts the old truth (`rg -n 'The lane runs inline|conductor route' skills/unit-lane/` = 0 matches; old addendum wording absent from skills/, docs/workflow/, packages/, template/); the dated receipts are advisory 4.
Completeness: S1 S2 S3 S4 resolved — P1–P5 each carry `(Implements: S#)` and their validators re-ran green here (`bun test scripts/relay-route.test.mjs` 22 pass/0 fail exit 0; `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` 24 pass/0 fail exit 0; `bun scripts/check-skill-context.mjs` PASS 33 skills; `roadmap check` PASS; `bun scripts/docs-generate.mjs --check` PASS; `config validate --scope both` ok; `check:config-schema` current; `journal aggregate --check` ok; red-first order `c2e3967f4` before the implementation commits; `bun scripts/local-gate.mjs` PASS; `bun scripts/run-root-suite.mjs` exit 0); obligations O1–O15 all `verified` with those re-runs, none open.
Spot check: `bun test scripts/relay-route.test.mjs` → match (22 pass / 0 fail, exit 0 — equals the reported E3)
Verdict: VERIFIED

## Correction batch — 2026-11-27 (§9 round 1)

Advisory 2 fixed: `docs/workflow/SKILLS.md` and `README.md` now order the seam's ask
before Relay legs, each citing `references/RELAY.md` §Bootstrap, pinned by the new
contract case `the hand-off summaries name the seam's ask before Relay legs`
(RED `b1e3c8432` → green `07ecec725`). Advisories 1, 3, 4 dispositioned no-fix
with reasons in `## Log` D7. Recheck: `relay-route` 23 pass/0 fail ·
`config-contract` 24 pass/0 fail · skill-context both modes PASS ·
`test-obligation-tags` 147/0 · `docs-generate --check` PASS · `roadmap check` PASS ·
`journal aggregate --check` ok · `local-gate` PASS (20 steps, 559s) ·
`run-root-suite` exit 0 · SPEC `verify` ok. Sibling sweep for the old categorical
claim: 0 matches. No obligation row changed status. Next run: delta verdict on this head.
