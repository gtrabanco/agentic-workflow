---
"@gtrabanco/pi-agentic-workflow": minor
---

feat(pi): register the envelope-emitting scripts as deferred workflow tools

The pi package gains its first tool surface (issue #274): five Pi-free tools in
the `agentic-workflow` namespace — `agentic_workflow_status`,
`agentic_workflow_diff_guard`, `agentic_workflow_phase_lint`,
`agentic_workflow_audit_pr_gate`, `agentic_workflow_snapshot_verify` — each a
thin wrapper over the same script spawn the skills take (the project's own
checkout copy, bin resolved by the runtime convention).

- `exposure: "deferred"`: never declared to the model, zero standing token cost;
  findable by `tool_search`, callable by name from codemode scripts.
- `outputSchema` is the machine contract the repo already publishes: the status
  tool embeds `@gtrabanco/agentic-workflow-schema`'s `envelope.schema.json`
  verbatim; the gate tools' schemas are tested against live script output.
- Red gates (breach, BLOCKED, stale/missing receipt, BLOCKED merge verdict)
  arrive as `isError: true` with the structured result attached, so
  programmatic consumers read findings as data instead of re-parsing exit
  codes and prose.
- Skills never change: the bash wording stays the portable path; the conductor
  sensor's degraded result gains an additive `envelope` field so the degraded
  case can carry the envelope (its refusal contract is unchanged).
