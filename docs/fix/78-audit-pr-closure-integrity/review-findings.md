# Review findings — fix/78-audit-pr-closure-integrity

Fix-now fold ledger. `folded` starts `no`; only `execute-phase`/`fold-findings`
flips it to `yes`. Populated by `/review-change --adversarial 2`, 2026-07-17.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | docs/workflow/GOLDEN_FIXTURE.es.md (missing #78 row) | bilingual-sync | high | fix-now | fold-findings | yes |
| F2 | skills/audit-pr/SKILL.md:107,114 | correctness | med | fix-now | fold-findings | yes |
| F3 | skills/audit-pr/SKILL.md:251,258,272 | output-contract | med | fix-now | fold-findings | yes |
| F4 | skills/audit-pr/SKILL.md:8 | parity | med | fix-now | fold-findings | yes |
| F5 | skills/audit-pr/SKILL.md:120 | correctness | low | fix-now | fold-findings | no |
