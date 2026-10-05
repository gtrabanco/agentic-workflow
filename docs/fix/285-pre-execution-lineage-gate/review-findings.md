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
| F1 | scripts/unit-route.mjs (reasons map, ~line 447) | code | low | report-note | report-note: the triage block's `Skipped:` reason strings are static per unit type ("trivial scope") even when the actual scope is `standard` — misleading prose in an authoritative block. Pre-existing behaviour, outside this fix's regression boundary (fix/285 changes nothing in `unit-route.mjs`); file its own issue if a consumer ever parses those strings. | yes |
| REVIEW-RAN | HEAD b9ea9fa31bb434d5a78b04963633142b14746c08 | n/a | n/a | review-mark | n/a | n/a |
| F2 | packages/agentic-workflow-schema/package.json:3 · test/release-contract.test.mjs:28 · test/verification-gates.test.mjs:117 | code | high | fix-now | fold into current phase (bump both version pins to 4.6.0; make CI run the schema package's own `bun run test`) · fold 9477ffe2 | yes |
| F3 | docs/fix/285-pre-execution-lineage-gate/SPEC.md:149 | spec-drift | high | fix-now | fold into current phase (rewrite the `bun run test` Evidence row to exit 1 / 715 pass / 2 fail) · fold 9477ffe2 | yes |
| F4 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:95-106 | security | high | fix-now | fold into current phase (replace the `progress.md`-absence discriminator with a non-author-controlled marker; adversarial test) · fold 9477ffe2 | yes |
| F5 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:120-128 | security | high | fix-now | fold into current phase (require ≥1 obligation row or an explicit `n/a: <reason>`; red test for an empty-present `### Obligations`) · fold 9477ffe2 | yes |
| F6 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:104-107 | security | med | fix-now | fold into current phase (emit BLOCKED + `→ Next: /unit-lane <unit>` for an absent ledger section) · fold 9477ffe2 | yes |
| F7 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:95-101 | security | med | fix-now | fold into current phase (bind the triage output + ledgers with a frozen digest/timestamp anchor; shrunk-objective test) · fold 9477ffe2 | yes |
| F8 | CHANGELOG.md · docs/workflow/SKILL_CONTEXT_BUDGETS.json · README.md · skills/audit-pr/SKILL.md · SPEC `Depends on` | workflow | high | fix-now | coordinate with #288 F10: one PR rebases, single `audit-pr` version, single budget re-base; correct the SPEC "Depends on: None" · fold 9477ffe2 | yes |

Cycle 2 — independent review at HEAD `b9ea9fa3` (2026-10-05). Axes run: code,
security, verify, perf (perf PASS — no material surface); workflow/spec-drift
(FAIL); design / a11y / brand / SEO — n/a (no UI or user-facing copy).
Workspace precondition: clean worktree, branch in sync with `origin`. F1 (the
low report-note) stays report-only. Low findings (G–K) are report-only notes,
never ledger rows. Escalation: full pass, not delta.
