# Programmatic orchestration

> 🇪🇸 [Versión en español](ORCHESTRATION.es.md)

Skills are text-first instructions. An external driver may run them headlessly
without turning every skill into a large JSON prompt: it asks for a small
machine result at the invocation boundary and combines it with facts compiled
from the repository documents.

```
  selected docs + repository facts ──► WorkflowSnapshot v1
                                         │
  one skill turn ──► parseTurn ──► SkillOutcome v1 / Envelope v2
                                         │
                                         ▼
                              driver policy and next invocation
```

The driver owns sessions, file reads, Git/forge commands, retries, persistence,
and authorization. The package owns portable contracts and pure parsing:
[`@gtrabanco/agentic-workflow-schema`](../../packages/agentic-workflow-schema/).

## Contracts and ownership

| Result | Producer | What it contains | What it must not replace |
| --- | --- | --- | --- |
| Envelope v2 | `workflow-status` | Full read-only sensor state; stable legacy contract. | Driver state or authorization. |
| SkillOutcome v1 | A driven working skill | Outcome, next intent/targets, blockers, questions, discoveries, evidence references. | Repository facts inferred from prose. |
| WorkflowSnapshot v1 | Driver + package | Selected document facts, phase state, provenance, unknowns, contradictions. | Filesystem, Git, or forge access in the package. |

Envelope v2 remains the `workflow-status` contract. `detail` is required and
all sensor-specific extensions, including `design_candidates`, live under it.
The package validates new v2 results strictly; `parseEnvelope()` remains for
existing legacy consumers.

## Drive one turn

Use the profile inventory and generated instruction instead of maintaining a
second prompt copy in every skill:

```ts
import {
  parseTurn,
  renderOutputInstruction,
  WORKFLOW_SKILL_PROFILES,
} from "@gtrabanco/agentic-workflow-schema";

async function runTurn(skill: string, prompt: string, session: Session) {
  const profile = WORKFLOW_SKILL_PROFILES.find((item) => item.skill === skill);
  if (profile === undefined) throw new Error(`Unsupported skill: ${skill}`);

  let text = await session.invoke(prompt, {
    systemAppend: renderOutputInstruction(skill),
  });
  let parsed = parseTurn({ skill, text, context: { unitId: session.unitId } });

  if (!parsed.ok) {
    text = await session.invoke("Emit only the machine result for the turn above.");
    parsed = parseTurn({ skill, text, context: { unitId: session.unitId } });
  }
  if (!parsed.ok) throw new DriverFailure(skill, parsed.errors);

  journal.append({ skill, source: parsed.source, diagnostics: parsed.diagnostics, outcome: parsed.outcome });
  return parsed;
}
```

The repair bound is exactly one re-invocation of the same session. A second
failure is a driver-level `FAILED`; do not retry indefinitely and never parse
arbitrary prose as a route. When a provider supports strict structured output,
use the selected JSON Schema on the small final-result or repair turn, not on a
working turn that still needs prose or tool use.

`parseTurn` accepts, in order: SkillOutcome v1, strict Envelope v2, named
legacy envelope repairs, then the two fixed native verdict formats
(`loop-review-fold`, `audit-pr`). No other prose fallback exists.

## Compile the snapshot before deciding

Compile the project facts from the exact documents and repository state already
read by the driver. The package does no I/O, making the output reproducible and
safe to cache by source revision.

```ts
import { compileWorkflowSnapshot } from "@gtrabanco/agentic-workflow-schema";

const result = compileWorkflowSnapshot({
  sourceRevision: repository.headSha,
  repository,
  documents: await readWorkflowDocuments(repository),
});
if (!result.ok) throw new DriverFailure("snapshot", result.errors);

const snapshot = result.snapshot;
if (snapshot.contradictions.length > 0) {
  await runTurn("resolve-repository-state", "Resolve the declared repository-state contradiction.", session);
}
```

`WorkflowSnapshot v1` exposes the active feature or fix, phase identifiers and
names, document provenance, explicit unknowns, and declared repository-state
contradictions. It does not invent a current phase if progress is ambiguous.
Read richer project-specific state only from the `workflow-status` Envelope v2
`detail` payload, with its own documented shape.

## Routing and safety floor

The driver may route on `outcome.status` and `outcome.next`, but it must retain
the skills' safeguards:

- `blocked`, `needs-input`, and `failed` stop normal advancement and surface
  canonical blockers or questions.
- A discovery outside the current unit is a proposal: it must not silently
  create an issue or expand the acceptance boundary.
- A `workflow-status` run-scoped blocker or `HALT` state stops the whole run.
- Never skip a review or audit gate; merge only after a fresh, current-head
  `MERGE_READY` result and the driver's explicit merge authorization.
- Treat `snapshot.unknowns` as missing evidence, not permission to guess.

The driver should persist each parsed outcome, its source/diagnostics, the
source revision, and the compiled snapshot append-only. On restart, recompute
the snapshot and poll `workflow-status`; the journal is a hypothesis, not
ground truth.

## Compatibility is a migration aid, not a policy engine

The package can repair only facts it can prove: missing `detail`, legacy root
`design_candidates`, a matching trusted unit id, a zero issue count, and the
reported native `audit-pr` blocker rows. It rejects a nonzero count without
issue identities and any unmatched or invented value. Keep the diagnostics in
the journal so an upgrade can quantify and then remove legacy emissions.

## Cost and performance

- Keep the static system prefix and selected skill stable to retain provider
  prompt-cache hits.
- Compile only the documents needed for the active decision and cache the
  snapshot by revision; invalidate it after a repository-changing turn.
- Pass structured outcomes and snapshots between contexts, not raw transcripts.
- Use the cheapest capable model for mechanical work, but keep planning,
  review, and audit at the project's required quality bar.

This protocol is portable across interactive agents, CLIs, API sessions, and
CI jobs. Agents without session resumption may perform the one repair in a
fresh invocation containing the prior turn, but must still keep the one-repair
bound and record that weaker recovery mode.
