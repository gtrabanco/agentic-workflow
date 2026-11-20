---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/agentic-workflow": minor
"unit-lane": minor
"product-audit": minor
---

feat(decisions): promote a cross-unit decision to its one owner doc

A decision whose scope is **cross-unit** no longer dies with the unit folder that
took it. The `decision` row of a unit's `decisions.md` gains a trailing `scope`
cell whose closed set is the schema package's new `DECISION_SCOPES`
(`unit-only` | `cross-unit`); the reader (`agentic-workflow needs-input`) exposes
it without changing the printed `open-questions@1` envelope, and a legacy row
with no scope cell keeps parsing exactly as before.

The rule itself is published where it is read: `docs/architecture/ARCHITECTURE.md`
§ Promoting a decision carries the owner-doc-per-scope map (the guide's laws, the
architecture doc, the architectural invariants), the precedence when a scope
spans two of them (the doc carrying the mechanism owns the statement; the guide
carries one law row citing it) and the link-never-copy consequence. The lane
records the scope at capture time (`decision-scope@1`, published in
`skills/unit-lane/references/DESIGN.md`), and the scaffold's agent guide carries
the same contract for a target project.

`product-audit` gains the `Decision promotion` dimension with its deterministic
producer, `bun scripts/decision-promotion.mjs <repo>`: one `decision-promotion@1`
receipt, one finding per cross-unit decision that cites no owner doc, per
decision captured after the rule landed with no scope cell, and per promotion
citing a doc that owns no scope or does not exist — plus one named `skipped —`
line per ledger the dispatcher cannot read, so a sweep never silently drops a
ledger. It writes nothing: promotion stays an owner-directed docs change.
