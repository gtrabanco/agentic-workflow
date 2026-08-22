# @gtrabanco/agentic-workflow-schema

> 🇪🇸 [Versión en español](README.es.md)

Zero-runtime-dependency machine contracts for
[agentic-workflow](https://github.com/gtrabanco/agentic-workflow). Version 3
keeps the established `workflow-status` envelope while giving headless drivers
a smaller result for working skills and deterministic state compiled from
documents.

## Install

```sh
npm install @gtrabanco/agentic-workflow-schema
```

## Three contracts, distinct owners

| Contract | Owner | Use |
| --- | --- | --- |
| Envelope v2 | `workflow-status` | Full read-only sensor result and existing consumers. |
| SkillOutcome v1 | A driven skill turn | Small model-owned outcome, route, blockers, questions, discoveries, and evidence references. |
| WorkflowSnapshot v1 | The driver | Deterministic repository and document facts, with provenance, unknowns, and contradictions. |

All JSON Schemas are strict: undeclared keys are rejected. `detail` is required
on Envelope v2 (use `null` when empty); skill-specific extensions belong inside
it. The schemas are exported at `./envelope.schema.json`,
`./skill-outcome.schema.json`, and `./workflow-snapshot.schema.json`.

## Parse a driven turn

Use the profile metadata to select the required result, append the generated
instruction only to a headless invocation, then parse the final reply.

```ts
import {
  parseTurn,
  renderOutputInstruction,
  WORKFLOW_SKILL_PROFILES,
} from "@gtrabanco/agentic-workflow-schema";

const skill = "audit-pr";
const profile = WORKFLOW_SKILL_PROFILES.find((entry) => entry.skill === skill);
if (profile === undefined) throw new Error(`Unknown workflow skill: ${skill}`);

const output = await invokeAgent({
  prompt: "Follow the installed skill for /audit-pr.",
  systemAppend: renderOutputInstruction(skill),
});

const result = parseTurn({ skill, text: output, context: { unitId: "12-machine-contract" } });
if (!result.ok) throw new Error(result.errors.join("; "));

// result.outcome is SkillOutcome v1; result.envelope is non-null only for v2.
route(result.outcome.next.intent, result.outcome.next.targets);
```

On a malformed result, re-invoke the *same session once* with `Emit only the
machine result for the turn above.` and parse again. A second failure is a
driver-level failure. Do not promote arbitrary prose to structured facts.

`workflow-status` keeps its native Envelope v2 result. Existing consumers may
continue to use `parseEnvelope(text)`; new consumers use
`parseEnvelopeV2Strict(text)` or the uniform `parseTurn({skill, text})`.

## Capability profiles

Every built-in profile in `WORKFLOW_SKILL_PROFILES` carries an optional,
immutable `capabilities` object: role, reasoning class, **maximum effects**,
context sources, and required evidence, all from the exported closed
vocabularies (`SKILL_ROLES`, `SKILL_EFFECTS`, `SKILL_REASONING`,
`SKILL_CONTEXT_SOURCES`, `SKILL_REQUIRED_EVIDENCE`).

Capability semantics:

- **Repository evidence is authoritative.** `effects`, `contextSources` and
  `requiredEvidence` document the reviewed maximum capabilities from the
  workflow's own documents (`docs/`); they never promise anything about a
  model or provider runtime.
- **Context is advisory.** `semantic-context` and `episodic-memory` describe
  context that *may* help; they never change what a skill may do.
- **Exports are immutable.** Vocabulary arrays and every profile are frozen at
  runtime (`Object.isFrozen`); widening a profile at runtime is unsupported.
  Any vocabulary or profile change is a reviewed package release.

`capabilities` is optional for source compatibility. A capability-aware
consumer must **fail closed** when it is absent — never infer a skill's role
or effects from its name.

## Compile deterministic state

The package never reads the filesystem, Git, or a forge. The caller supplies
the exact documents and repository facts it has already read, so snapshots are
reproducible and safe to cache by `sourceRevision`.

```ts
import { compileWorkflowSnapshot } from "@gtrabanco/agentic-workflow-schema";

const result = compileWorkflowSnapshot({
  sourceRevision: headSha,
  repository: { branch, headSha, dirty },
  documents: [
    { path: "docs/workflow/REPOSITORY_STATE.md", content: repositoryState },
    { path: "docs/features/ROADMAP.md", content: roadmap },
    { path: "docs/features/12-machine-contract/SPEC.md", content: spec },
    { path: "docs/features/12-machine-contract/progress.md", content: progress },
  ],
});
if (!result.ok) throw new Error(result.errors.join("; "));

const { snapshot } = result;
// snapshot.unit, snapshot.phase, snapshot.provenance,
// snapshot.unknowns, and snapshot.contradictions are deterministic.
```

The compiler deliberately reports an unknown current phase instead of guessing
from ambiguous progress prose. A declared `Status: contradicted` is retained in
`snapshot.contradictions`; route it to repository-state resolution rather than
overwriting it.

## Validate or use another language

The public validators are `validateEnvelopeV2Strict`, `validateSkillOutcomeV1`,
and `validateWorkflowSnapshotV1`. Import a JSON Schema when a non-TypeScript
consumer needs the same boundary:

```ts
import schema from "@gtrabanco/agentic-workflow-schema/skill-outcome.schema.json" with { type: "json" };
```

For Node versions without JSON import attributes, load the schema with
`createRequire`. The package supports Node 18 and later.

## Compatibility and versioning

`parseTurn` accepts strict v2 first, then only these named legacy repairs:

- a missing `detail` becomes `null`;
- legacy root `design_candidates` moves to `detail.design_candidates`;
- the known `audit-pr` form may map a numeric unit id from matching trusted
  driver context, zero issue count to `[]`, and a native gate row to a canonical
  blocker.

It refuses a nonzero issue count without identities, an unmatched unit id, and
unstructured prose. The compatibility diagnostics make every repair visible to
the driver.

Package major versions signal a breaking change to any published contract.
Additive contract fields are minor; parser, documentation, or implementation
fixes are patch releases. See
[programmatic orchestration](../../docs/workflow/ORCHESTRATION.md) for the
driver protocol.
