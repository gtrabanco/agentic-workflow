## Question protocol

Follow the project's **Workflow conventions** question protocol (what / scope / criticality / each option with pros-cons + flagged recommendation). Fix-specific: *critical* = a wrong answer breaks production or invalidates the fix; also note **what it affects** (users, ops, security, data, future features). Only ask when the answer changes the SPEC materially — routine assumptions (e.g. a helper name) are made silently and recorded under "Decisions made during drafting".

## SPEC sections (extends the base template)

The base template at `docs/fix/_TEMPLATE/SPEC.md` is mandatory. Add these sections in order, after the existing ones:

- **Impact** — layers touched (per the architecture doc); modules and files (paths); blast radius; detection lead time.
- **Rules that must never be violated** — project-wide invariants the fix must preserve, from CLAUDE.md "Hard rules" + the cited docs. E.g. "Domain value-object rules hold", "Inner layers cannot import outer layers".
- **Operational risks** — scheduled-job / queue / cache / schema / external-adapter interactions; concurrency or eventual-consistency hazards.
- **Security risks** — auth, secrets, PII, webhooks, rate-limits.
- **Compliance touchpoints** — any domain/compliance rules; note "n/a" explicitly if none.
- **Affected docs** — files in `docs/` needing updates; each becomes an acceptance criterion.
- **Observability** — log line / metric / alert confirming the fix is live and healthy.
- **Cross-issue notes** — open issues / PRs that may absorb, block, or be blocked by this fix; decision for each.
- **Effort** — T-shirt size with one-line justification.
- **Decisions made during drafting** — non-blocking assumptions made by the architect, so the implementer can re-question.
