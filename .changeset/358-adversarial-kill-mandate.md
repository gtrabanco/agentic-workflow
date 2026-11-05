---
"@gtrabanco/agentic-workflow-schema": minor
"review-change": minor
---

feat(review-change): adversarial pass verifies with a kill mandate, a diff-only reflector and a stability check

The `--adversarial N` pass stops enumerating and starts verifying. Every candidate
it receives is arbitrated as `kill | confirm` with falsifying or supporting
evidence, and a finding the pass raises itself needs its own falsifying evidence
from cycle 1, not only from the next cycle. A diff-only reflector then sees the
diff plus the claim — never a transcript — and returns `keep | drop` with a
reason, so a comment the diff does not ground leaves the table. A reproducer that
also fires on untouched adjacent code is a misattribution and is re-scoped before
persisting, never persisted as-is. The three closed sets are published
(`ADVERSARIAL_VERDICTS`, `ADVERSARIAL_REFLECTOR_VERDICTS`,
`ADVERSARIAL_STABILITY_VERDICTS`) and bound to the `adversarial-verdict@1`
grammar, and `scripts/adversarial-verdict.mjs` is the conductor's one added step:
it validates a pass record, refuses an unsupported verdict, and prints the
persistable rows. The merge gate, the receipt and the two-cycle cap are
untouched, and a killed finding is reported with its evidence so the operator can
override.
