---
"execute-phase": minor
"unit-lane": minor
"workflow-status": minor
"@gtrabanco/agentic-workflow-schema": minor
---

feat(risk-tiers): a computed risk tier decides the ceremony a change owes

Ceremony is proportional to risk, and the tier is computed by a script, never
chosen by the model: `scripts/risk-tiers.mjs` classifies a change from its paths
and contents — never from a file count — into `passive` (documentation, images,
comments, prose with no executable effect: no unit doc, a structural readback in
`docs/passive/<id>.md`), `standard` (the current unit-doc ceremony) or `high`
(auth, security, destructive operations, CI/publish surfaces — always a *named*
high-risk item). Ambiguity fails closed upward.

The three vocabularies are published as versioned grammar
(`RISK_TIER_KINDS`, `RISK_TIER_SIGNAL_KINDS`, `RISK_TIER_REASONS`) and bound in
`normative-surfaces@1`; the closed ceremony CLI emits the verdict
(`ceremony tier classify|read|plan`), the sensor projects it as
`detail.risk_tier` — a distinct key from `next.tier`, which stays the model
budget — and the lane's triage and the executor's `RISK_TIERS.md` consume it.
