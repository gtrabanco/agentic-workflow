# review-findings — fix/285-pre-execution-lineage-gate

Mark and finding shapes are owned by `skills/pre-execution-review/references/LEDGERS.md`
(`review-mark@1` / `finding-mark@1` — cited, not re-declared).

Axes run at HEAD `ffab7c28d03c02bc022b13bdd7d260cd8edddb13`: code/correctness
(schema requiredness relaxation + CLI consumer sweep: every `acceptance`-row
consumer already handles absence — `attributeFreshness`'s acceptance-exclusion
explicitly tolerates a snapshot that binds no manifest; the wording-only route
stays fail-closed without one), security (no new input surface; docs +
requiredness only), perf (trivial — build-time row filtering), verify (all gates
re-run live at HEAD: repo suite 619/0, schema package 717/0, context budgets
PASS, schema drift checks PASS), a11y/brand/seo — n/a (no UI or user-facing
copy).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD 4fe52c7b87a9b517d62e889fdeffaa904d9081ed | n/a | n/a | review-mark | n/a | n/a |
| REVIEW-RAN | HEAD e58760ce707e9ab2cf4331bf77ab8e3921e78b2e | n/a | n/a | review-mark | n/a | n/a |
| F1 | scripts/unit-route.mjs (reasons map, ~line 447) | code | low | report-note | report-note: the triage block's `Skipped:` reason strings are static per unit type ("trivial scope") even when the actual scope is `standard` — misleading prose in an authoritative block. Pre-existing behaviour, outside this fix's regression boundary (fix/285 changes nothing in `unit-route.mjs`); file its own issue if a consumer ever parses those strings. | no |
| REVIEW-RAN | HEAD b9ea9fa31bb434d5a78b04963633142b14746c08 | n/a | n/a | review-mark | n/a | n/a |
| F2 | packages/agentic-workflow-schema/package.json:3 · test/release-contract.test.mjs:28 · test/verification-gates.test.mjs:117 | code | high | fix-now | fold into current phase (bump both version pins to 4.6.0; make CI run the schema package's own `bun run test`) · fold 9477ffe2 | yes |
| F3 | docs/fix/285-pre-execution-lineage-gate/SPEC.md:149 | spec-drift | high | fix-now | fold into current phase (rewrite the `bun run test` Evidence row to exit 1 / 715 pass / 2 fail) · fold 9477ffe2 | yes |
| F4 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:95-106 | security | high | fix-now | fold into current phase (replace the `progress.md`-absence discriminator with a non-author-controlled marker; adversarial test) · fold 9477ffe2 | yes |
| F5 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:120-128 | security | high | fix-now | fold into current phase (require ≥1 obligation row or an explicit `n/a: <reason>`; red test for an empty-present `### Obligations`) · fold 9477ffe2 | yes |
| F6 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:104-107 | security | med | fix-now | fold into current phase (emit BLOCKED + `→ Next: /unit-lane <unit>` for an absent ledger section) · fold 9477ffe2 | yes |
| F7 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:95-101 | security | med | fix-now | fold into current phase (bind the triage output + ledgers with a frozen digest/timestamp anchor; shrunk-objective test) · fold 9477ffe2 | yes |
| F8 | CHANGELOG.md · docs/workflow/SKILL_CONTEXT_BUDGETS.json · README.md · skills/audit-pr/SKILL.md · SPEC `Depends on` | workflow | high | fix-now | coordinate with #288 F10: one PR rebases, single `audit-pr` version, single budget re-base; correct the SPEC "Depends on: None" · fold 9477ffe2 | yes |
| REVIEW-RAN | HEAD 7bec8d4bd3f2c0490bd556ab6595ab8b8fb7800c | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 7bec8d4bd3f2c0490bd556ab6595ab8b8fb7800c | node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD 7bec8d4bd3f2c0490bd556ab6595ab8b8fb7800c | bun scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD 7bec8d4bd3f2c0490bd556ab6595ab8b8fb7800c | (cd packages/agentic-workflow-schema && bun run test) | exit 0 |
| F9 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:122-129 | code,security | high | fix-now | regression of F7 — the "Frozen digest anchor" names a `unit-route.mjs --triage` digest the CLI never emits; retract the paragraph or implement the digest and assert it · fold into current phase | no |
| F10 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:95-139 | security | high | fix-now | regression of F4 — the lane-era/legacy discriminator is still author-controlled `progress.md` presence; replan route: key it on a non-author-controlled signal and bind the unit-doc bytes (`node scripts/unit-route.mjs 285-pre-execution-lineage-gate` → route: replan) | no |
| F11 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:104-112 | security | med | fix-now | regression of F5 + F6 — the empty-or-absent `### Obligations` → BLOCKED rules are prose with no reader and no test; add the assertion over a fixture unit doc · fold into current phase | no |
| F12 | scripts/lane-era-lineage.test.mjs:161-174 | code,verify | high | fix-now | AC3 is asserted by substring presence only; add a behavioural assertion that runs `unit-route.mjs --triage` over the fixture and compares the `Steps:` line · fold into current phase | no |
| F13 | docs/fix/285-pre-execution-lineage-gate/review-findings.md:20 | workflow | med | fix-now | `ledger-provenance.mjs --check` exits 1 — F1 is `folded: yes` with no fold token, and a `low` report-note is never persisted to the fold ledger; drop the row to a report note or record its real fold token · fold into current phase | no |
| VF-1 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:122-129 · reviewer review-change · HEAD 7bec8d4b · recheck direct read + `node scripts/unit-route.mjs --triage 285-pre-execution-lineage-gate --json` (keys unit,type,steps,skipped,budget — no digest) | security | confirmed | finding-mark | n/a | n/a |
| VF-2 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:95 · reviewer review-change · HEAD 7bec8d4b · recheck direct read ("no `progress.md`" vs "carries `progress.md` receipts") + `grep -rn 'Triaged steps' scripts/*.mjs` (only the test fixture) | security | confirmed | finding-mark | n/a | n/a |
| VF-3 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:105-112 · reviewer review-change · HEAD 7bec8d4b · recheck `grep -rn Obligations scripts/*.mjs` (excluding tests → none) + `node --test scripts/lane-era-lineage.test.mjs` green with both states untested | security | confirmed | finding-mark | n/a | n/a |
| VF-4 | scripts/lane-era-lineage.test.mjs:161-174 · reviewer review-change · HEAD 7bec8d4b · recheck direct read (five `assert.match` prose pins, no command execution) | code | confirmed | finding-mark | n/a | n/a |
| VF-5 | docs/fix/285-pre-execution-lineage-gate/review-findings.md:20 · reviewer review-change · HEAD 7bec8d4b · recheck `node scripts/ledger-provenance.mjs docs/fix/285-pre-execution-lineage-gate/review-findings.md --check` → exit 1, `CHECK FAIL: 1 folded row(s) lack a verified commit token: F1` | workflow | confirmed | finding-mark | n/a | n/a |

Cycle 2 — independent review at HEAD `b9ea9fa3` (2026-10-05). Axes run: code,
security, verify, perf (perf PASS — no material surface); workflow/spec-drift
(FAIL); design / a11y / brand / SEO — n/a (no UI or user-facing copy).
Workspace precondition: clean worktree, branch in sync with `origin`. F1 (the
low report-note) stays report-only. Low findings (G–K) are report-only notes,
never ledger rows. Escalation: full pass, not delta.

Cycle 4 — independent review at HEAD `7bec8d4b` (2026-10-05). Axes run: code
(FAIL — the audit gate names a triage digest `unit-route.mjs` never emits; AC3
is a substring-only test), security (FAIL — the F4/F5/F6/F7 folds are prose
without a mechanism; F4 marked `folded: yes` while the `progress.md`
discriminator is unchanged), verify (PASS — every Evidence exit code and count
matched live; one low note: the diff-guard magnitude in SPEC.md/decisions.md is
stale at 617/16, head-true 735/23), workflow (FAIL — `ledger-provenance.mjs
--check` exits 1 on the F1 row), perf (PASS — the artifact filter is strictly
cheaper). design / a11y / brand / SEO — n/a (no UI or user-facing copy).
Escalation: full pass, not delta (fold diff + ledger growth exceeded the delta
size trigger). Five new fix-now rows (F9–F13), four of them `regression of
<id>`: the F4–F7 fold answered its findings with prose, and the suite that
called the repairs green asserted words, not mechanisms.

Cycle 4 fold — `833c1121` (2026-10-06). F9–F12 folded as one mechanism:
`scripts/unit-lineage.mjs`, the machine surface of gate 1 — the discriminator
keys on a verifying plan receipt (F10), the absent/empty/open obligation rules
have a reader and fixture tests (F11), the triage currency check re-derives
behaviorally over fixture repos (F12), and the phantom-digest paragraph is
retracted (F9 — resolved by retraction, `unit-route.mjs` untouched). F13 folds
separately: F1 was a `low` report-note that was never folded — its `folded:
yes` mark was bogus (no fold token exists because no fold exists), dropped to
`folded: no`, which is the state `ledger-provenance.mjs --check` demands of a
report-note. Red-first: the behavioral suite ran 15 fail / 2 pass at
`a505c7b7` before the script existed.
