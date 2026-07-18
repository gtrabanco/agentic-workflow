# Review findings — fix/79-workflow-status-driver-signals

Fix-now fold ledger (`review-change --adversarial 2`, 2026-07-19). `execute-phase`'s
fold cycle / `fold-findings` is the only step that flips `folded` to `yes`.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | skills/workflow-status/SKILL.md:410 | docs-accuracy | low | fix-now | fold | yes |
| F2 | skills/workflow-status/SKILL.md:501 | docs-accuracy | low | fix-now | fold | yes |
| F3 | README.md:123 | docs-accuracy | med | fix-now | fold | no |
