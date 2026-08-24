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

## Content-bound review receipts (v1)

Two new versioned contracts prove exactly which diff a review evaluated:

- **CandidateSnapshot v1** — `baseCommit`, `candidateCommit`, `baseTree`,
  `candidateTree`, ordered `changedPaths` manifest, and `acceptanceFingerprint`.
  Strict validators reject undeclared fields, mixed hash algorithms, path
  injection, and unsupported statuses.
- **ReviewReceipt v1** — opaque `id`, `candidateSnapshotDigest`, closed `kind`
  vocabulary (10 values), `verdict`, structured `findings`, and
  `policyVersion`.

### Hashing and fingerprinting

```ts
import {
  digestCandidateSnapshot,
  digestReviewReceipt,
  computeAcceptanceFingerprint,
  canonicalizeCandidateSnapshot,
  canonicalizeReviewReceipt,
} from "@gtrabanco/agentic-workflow-schema";

const digest = await digestCandidateSnapshot(snapshot);
const fingerprint = await computeAcceptanceFingerprint([{ id: "AC-001", blobSha256: "..." }]);
```

### Freshness predicate

```ts
import { compareReceiptToCurrentSnapshot } from "@gtrabanco/agentic-workflow-schema";

const result = await compareReceiptToCurrentSnapshot(
  receipt, currentSnapshot, currentAcceptanceInputs, policyVersion
);
// { fresh: true } | { fresh: false, reasonCode: "stale-base-tree" | "stale-candidate-tree" | "stale-manifest" | "stale-acceptance-fingerprint" | "stale-review-policy" }
```

> ⚠️ **Schema validity ≠ review correctness.** A valid schema proves the
> structure was preserved, not that the review was accurate. Content binding
> is mandatory — never trust a receipt that is not content-bound to the current
> candidate snapshot and acceptance boundary.

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

## Workflow transition decider

Export `decideWorkflowAction(input)` — a pure, deterministic function that
combines a `WorkflowSnapshot v1`, the last validated `SkillOutcome v1`, and a
caller-provided `WorkflowDecisionPolicy` to decide whether a headless driver
may invoke the next skill, must refresh with `workflow-status`, or must stop.

```ts
function decideWorkflowAction(input: WorkflowDecisionInput): WorkflowActionDecision
```

- **Safe elision:** when the snapshot is frozen and the last skill → next intent
  is proven by the frozen `WORKFLOW_TRANSITION_TABLE`, the driver invokes
  directly without calling `workflow-status`.
- **Mandatory fallback:** on missing evidence, stale revision, blocked status,
  contradictions, unauthorized effects, or any unrecognized transition, the
  function returns `sense` (call `workflow-status`) or `stop` (terminate).

**Mandatory sensor points:** initial run (no outcome), recovered run (stale
revision), snapshot state unknown or contradicted, unrecognized next intent,
and any transition not in the closed table.

See [SPEC](../features/24-workflow-transition-decider/SPEC.md) for the full
design, transition tables, and reason-code vocabulary.

Package major versions signal a breaking change to any published contract.
Additive contract fields are minor; parser, documentation, or implementation
fixes are patch releases. See
[programmatic orchestration](../../docs/workflow/ORCHESTRATION.md) for the
driver protocol.

## Staged Verification Contracts (feature 26)

Two versioned wire contracts for staged verification:

- `VerificationPlan v1` (`agentic-workflow/verification-plan@1`) — an ordered,
  non-empty command list where each command carries a stable `id`,
  `stage: fast | full`, an `executable` and ordered `args` (never a shell
  string), a working-directory policy (`candidate-root` or `relative-path` with
  validated relative path), a positive `timeoutMs`, `stopOnFailure`, and a
  cost class.

- `VerificationReceipt v1` (`agentic-workflow/verification-receipt@1`) — a receipt that
  binds to the plan digest, candidate-snapshot digest, and acceptance
  fingerprint, carrying per-command results with status (`passed | failed |
  timed-out | skipped | infrastructure-error`), exit-code/signal per the D4
  matrix, bounded evidence references, and an explicit skip reason. The
  overall verdict (`pass | fail | incomplete`) is derived from the receipt
  content.

**Two-stage model:** requesting `fast` executes only fast commands; requesting
`full` executes every fast and full command. The freshness predicate returns
stable reason codes (`stale-plan | stale-candidate-snapshot |
stale-acceptance-fingerprint | incomplete-missing-results |
incomplete-unjustified-skip | incomplete-stage-coverage`) or `{fresh: true}`.

**Delivery-gate rule:** a delivery verification gate is satisfied ONLY by a
receipt that is fresh, requests `full`, and has verdict `pass`.

**No-execution boundary:** the package validates, canonicalizes, digests,
derives, and compares — it does not execute commands. The caller owns execution.

### Consumer example

```ts
import {
  validateVerificationPlanV1,
  validateVerificationReceiptV1,
  validateVerificationReceiptAgainstPlan,
  deriveVerificationVerdict,
  compareVerificationReceiptToCurrent,
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
  digestVerificationPlan,
} from "@gtrabanco/agentic-workflow-schema";

// 1. Build and validate a plan
const plan = {
  contract: VERIFICATION_PLAN_CONTRACT_ID,
  commands: [
    { id: "lint", stage: "fast", executable: "npm", args: ["run", "lint"],
      workingDirectoryPolicy: "candidate-root", workingDirectory: null,
      timeoutMs: 30000, stopOnFailure: true, costClass: "cheap" },
    { id: "test", stage: "full", executable: "npm", args: ["test"],
      workingDirectoryPolicy: "candidate-root", workingDirectory: null,
      timeoutMs: 120000, stopOnFailure: false, costClass: "moderate" },
  ],
};
const pv = validateVerificationPlanV1(plan);
if (!pv.ok) throw new Error(pv.errors.join(", "));

// 2. Build and validate a receipt
const planDigest = await digestVerificationPlan(plan);
const receipt = {
  contract: VERIFICATION_RECEIPT_CONTRACT_ID,
  planDigest,
  candidateSnapshotDigest: "a".repeat(64),
  acceptanceFingerprint: "b".repeat(64),
  stageRequested: "full",
  results: [
    { commandId: "lint", status: "passed", exitCode: 0, signal: null,
      startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
      stdout: null, stderr: null, skipReason: null },
    { commandId: "test", status: "passed", exitCode: 0, signal: null,
      startedAt: "2025-01-01T00:01:00Z", endedAt: "2025-01-01T00:05:00Z",
      stdout: null, stderr: null, skipReason: null },
  ],
  verdict: "pass",
};
const rv = validateVerificationReceiptV1(receipt);
if (!rv.ok) throw new Error(rv.errors.join(", "));

// 3. Plan-bound validation
const pbv = validateVerificationReceiptAgainstPlan({ plan, receipt });
if (!pbv.ok) throw new Error(pbv.errors.join(", "));

// 4. Verdict derivation (must match stored verdict)
const derived = deriveVerificationVerdict(receipt, plan);
// => "pass" if all full commands passed, "fail" if any failed,
//    "incomplete" if any result is missing

// 5. Freshness check
const freshness = await compareVerificationReceiptToCurrent(
  receipt, plan,
  "a".repeat(64), "b".repeat(64)
);
// => { fresh: true } or { fresh: false, reasonCode: "stale-..." }

// 6. Delivery-gate composition
if (freshness.fresh && receipt.stageRequested === "full" && derived === "pass") {
  console.log("Delivery verified");
}
```
