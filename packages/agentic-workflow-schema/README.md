# @gtrabanco/agentic-workflow-schema

> 🇪🇸 [Versión en español](README.es.md)

Zero-runtime-dependency machine contracts for
[agentic-workflow](https://github.com/gtrabanco/agentic-workflow). Version 3
keeps the established `workflow-status` envelope while giving headless drivers
a smaller result for working skills and deterministic state compiled from
documents.

That claim has an exact shape, and it is the shipped shape: `package.json`
declares no `dependencies`, and no module under `src/` carries a static built-in
specifier (`from "node:…"`) — so the same code loads in Node, Bun and a browser.
The package still takes the host's own SHA-256 when the host happens to offer
one, opportunistically and per call: see "Canonical form and vectors".

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

The public contract validators are `validateEnvelopeV2Strict`,
`validateSkillOutcomeV1`, `validateWorkflowSnapshotV1`,
`validateCandidateSnapshotV1`, and `validateReviewReceiptV1`; the staged
verification contracts add exactly the two authoritative entries named above,
`validateVerificationPlanV1` and `validateVerificationReceiptAgainstPlan`. Import a
JSON Schema when a non-TypeScript consumer needs the same structural boundary:

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

## Evidence-Grounded Pre-Execution Review (feature 28)

Two versioned wire contracts that let a reviewer prove *which bytes* it judged,
before any code exists:

- `PreExecutionArtifactSnapshot v1`
  (`agentic-workflow/pre-execution-artifact-snapshot@1`) — the exact artifact set
  and authoritative contexts a review was allowed to rely on, at one source
  revision and one causal artifact revision.
- `PreExecutionReviewReceipt v1` (`agentic-workflow/pre-execution-review-receipt@1`)
  — one reviewer's verdict over one snapshot, with structured findings, opaque
  author identity, and an optional parent topology.

These are **pre-execution** contracts. They are distinct from
`CandidateSnapshotV1`/`ReviewReceiptV1` (which bind a built candidate) and from
`VerificationPlanV1`/`VerificationReceiptV1` (which bind command execution). No
contract in this family substitutes for another: a candidate or verification
receipt never validates as a pre-execution receipt, and no approval survives a
change in what was approved.

### Public entries

| Entry | Contract |
| --- | --- |
| `validatePreExecutionArtifactSnapshotV1(value)` | `{ ok, snapshot?, diagnostics, truncated }` |
| `validatePreExecutionReviewReceiptV1(value)` | `{ ok, receipt?, diagnostics, truncated }` |
| `validatePreExecutionReceiptAgainstSnapshot(receipt, snapshot, policyVersion)` | the only PASS authority |
| `buildPreExecutionArtifactSnapshot(input)` | stage-aware set builder over caller-supplied bytes |
| `selectSpecProduct(text)` | deterministic `spec-product-v1` projection |
| `canonicalizePreExecutionArtifactSnapshot(snapshot)` | canonical JSON string |
| `digestPreExecutionArtifactSnapshot(snapshot)` | lowercase SHA-256 hex |
| `canonicalizePreExecutionReviewReceipt(receipt)` / `digestPreExecutionReviewReceipt(receipt)` | same pair for receipts |
| `comparePreExecutionReceiptToSnapshot(receipt, reviewed, current, policyVersion)` | freshness decision |

Every entry accepts `unknown`, never throws on hostile input, and answers the
closed, redacted diagnostic vocabulary `PRE_EXECUTION_DIAGNOSTIC_CODES` — codes
and field pointers only, never a submitted value.

### Contract identifiers

The two `contract` discriminators are exported as
`PRE_EXECUTION_SNAPSHOT_CONTRACT_ID` and
`PRE_EXECUTION_RECEIPT_CONTRACT_ID`; the SPEC-stage Product projection name is
`PRE_EXECUTION_SNAPSHOT_SELECTOR` (`spec-product-v1`). Compare them by string
equality — a snapshot or receipt whose `contract` is anything else is refused with
`invalid-value`, which is what keeps a candidate, verification, or future-version
document from being mistaken for one of these.

### Closed vocabularies

Every value below is exported as a frozen array; nothing outside them validates.
`PRE_EXECUTION_RUNTIME_RULES` publishes the same split the prose describes —
`{ snapshot: [...], receipt: [...] }`, each row `{ id, claim }` — so a driver can
display the guarantees the schema cannot state.

| Export | Values and meaning |
| --- | --- |
| `PRE_EXECUTION_STAGES` | `spec` · `plan` — The two review stages. Drives the required artifact set and the verdict matrix. |
| `PRE_EXECUTION_UNIT_KINDS` | `feature` · `fix` — `fix` has no Product half, so it has no SPEC-stage snapshot. |
| `PRE_EXECUTION_POLICY_VERSION` | `v1` — The review-policy version a receipt is bound to. A policy bump rotates the `stale-policy` axis, so a receipt reviewed under a different version no longer blesses a verdict. The one authority the snapshot CLI reads instead of a hardcoded literal. |
| `PRE_EXECUTION_ARTIFACT_KINDS` | `spec` · `acceptance` · `plan` · `tasks` · `testing` · `decisions` · `architecture-notes` · `planning-evidence` · `obligations` — Roles a bound document may play. |
| `PRE_EXECUTION_SELECTORS` | `whole-file` · `spec-product-v1` — How bound bytes were chosen out of a file. |
| `PRE_EXECUTION_CONTEXT_KINDS` | `roadmap-row` · `governing-issue` · `normalized-repository-state` · `architectural-invariants` · `dependency-unit` · `project-guide` — Authorities a reviewer was allowed to rely on. |
| `PRE_EXECUTION_CONTEXT_PRESENCE` | `present` · `absent` — `absent` is a recorded fact, never a skipped field. |
| `PRE_EXECUTION_VERDICTS` | `spec-review-pass` · `spec-review-fail` · `plan-review-pass` · `plan-review-fail` · `needs-design` — Each verdict names the stage it is legal on. |
| `PRE_EXECUTION_FINDING_SEVERITIES` | `info` · `low` · `medium` · `high` · `critical` — `info` never blocks a PASS on its own merits. |
| `PRE_EXECUTION_FINDING_CLASSES` | `product` · `plan` · `source` · `environment` · `runtime` — Which contract layer the finding is about. |
| `PRE_EXECUTION_FINDING_VERIFICATION` | `verified` · `unverified` — Only `verified` material findings can support a PASS. |
| `PRE_EXECUTION_FINDING_RESOLUTIONS` | `open` · `resolved` · `dismissed` — `dismissed` requires recorded counter-evidence. |
| `PRE_EXECUTION_REVIEW_ROLES` | `reviewer` · `critic` · `synthesizer` · `arbiter` — What this receipt is in the topology. |
| `PRE_EXECUTION_PARENT_ROLES` | `critic` · `synthesis` · `arbitration` — What a parent receipt was — there is no quorum over them. |
| `PRE_EXECUTION_AUTHOR_EXCLUSIONS` | `enforced` · `not-enforceable` — Whether the runtime can prove the reviewer did not author the artifact set. |
| `PRE_EXECUTION_MODEL_DIVERSITY` | `same-model` · `cross-model` · `not-applicable` — A truthful label, never a threshold. |
| `PRE_EXECUTION_FRESHNESS_CODES` | `invalid-stage` · `invalid-unit` · `stale-policy` · `stale-context` · `stale-source-revision` · `stale-parent` · `stale-artifact-revision` · `stale-artifact-content` · `missing-receipt-snapshot` — Ordered precedence: see Freshness. |
| `PRE_EXECUTION_DIAGNOSTIC_CODES` | `invalid-type` · `missing-field` · `unknown-field` · `invalid-value` · `limit-exceeded` · `duplicate-id` · `unknown-command` · `invalid-order` · `invalid-stage` · `invalid-exit-state` · `invalid-evidence` · `invalid-skip` · `invalid-fail-fast` · `digest-mismatch` · `verdict-mismatch` · `budget-exceeded` · `missing-artifact-kind` · `invalid-artifact-set` · `invalid-selector` · `invalid-author` · `invalid-context` · `invalid-topology` · `stale-snapshot` · `stale-policy` — Redacted: codes and pointers only, never a submitted value. |

### What the snapshot binds

`contract`, `stage` (`spec | plan`), `unitKind` (`feature | fix`), `unitId`,
`sourceRevision` (40- or 64-hex git object id), `artifactRevisionId` (the causal
revision — a deliberate rotation even when content reverts), `artifacts[]`,
`contexts[]`, and `parentSpecSnapshotDigest` (null iff `stage === "spec"`).

Each artifact row is `{ kind, path, selector, byteLength, digest }`:

- `kind` ∈ `PRE_EXECUTION_ARTIFACT_KINDS` (`spec`, `acceptance`, `plan`, `tasks`,
  `testing`, `decisions`, `architecture-notes`, `planning-evidence`,
  `obligations`).
- `path` is normalized repository-relative — absolute, drive-letter, backslash,
  `.`/`..` segments, trailing separators, and empty segments are refused.
- `selector` ∈ `whole-file | spec-product-v1`. The SPEC stage binds its SPEC row
  with `spec-product-v1` and nothing else; the Plan stage binds whole files.
- `byteLength`/`digest` describe the **selection**, not the file.

Required sets are stage-driven: SPEC = exactly the projected `spec` row;
Plan = `spec` + `acceptance`, plus whichever of `plan`, `tasks`, `testing`,
`decisions`, `architecture-notes`, `planning-evidence`, `obligations` exist for
that unit size. A `fix` unit has no Product half, so it has no SPEC-stage
snapshot — Plan review is its pre-execution gate.

Each context row is `{ kind, identifier, presence, digest }` with `kind` ∈
`roadmap-row | governing-issue | normalized-repository-state |
architectural-invariants | dependency-unit | project-guide`. `presence` is
`present | absent`; a present authority carries its 64-hex digest, an absent one
binds exactly `null`. Absence is a recorded fact, never a skipped field.

Rows are canonically ordered — artifacts by UTF-8 path bytes, contexts by kind
then identifier — and identities are unique within each list.

### Collection rules live in the runtime, not the schema

The published projections
([`pre-execution-artifact-snapshot.schema.json`](./pre-execution-artifact-snapshot.schema.json),
[`pre-execution-review-receipt.schema.json`](./pre-execution-review-receipt.schema.json))
are rendered from the same internal definition the runtime enforces, so they can
never contradict it. Draft 07 has no form for properties **of a collection**
(path-byte ordering, per-kind/per-path uniqueness, the stage↔selector matrix,
context identity uniqueness), so those five-plus rules —
`artifact-rows-ordered`, `artifact-kinds-unique`, `artifact-paths-unique`,
`context-rows-ordered`, `context-identities-unique`,
`spec-artifact-uses-product-selector`, `stage-selector-matrix` — are enforced by
this package only. Validate them here; do not trust a third-party draft-07
validator to refuse an unordered snapshot.

### Verdicts, findings, and the PASS authority

`verdict` ∈ `spec-review-pass | spec-review-fail | plan-review-pass |
plan-review-fail | needs-design`, and the verdict must match the snapshot stage.
A finding is `{ id, severity, class, claim, evidenceRefs, verification,
resolution, resolutionEvidence }` with `severity` ∈ `info | low | medium | high
| critical`, `class` ∈ `product | plan | source | environment | runtime`,
`verification` ∈ `verified | unverified`, and `resolution` ∈ `open | resolved |
dismissed`. Every finding carries at least one evidence reference, and a
dismissal requires recorded counter-evidence.

`validatePreExecutionReceiptAgainstSnapshot` is the only entry that can bless a
PASS. It refuses a PASS while any material finding is open or unverified
(`info`-severity findings never block on their own merits), while the receipt
binds a different snapshot, while the policy version differs, when the claimed
author exclusion is violated under `enforced`, or when the reviewer's own
identity authored the artifact set (`invalid-author`). Parent receipts model a
bounded critic/synthesis/arbitration topology (`role` ∈ `critic | synthesis |
arbitration`, unique `receiptDigest`) — there is **no quorum**: votes never erase
an unresolved material finding, and `modelDiversity` is a truthful label
(`same-model | cross-model | not-applicable`), never a threshold.

### Freshness

`comparePreExecutionReceiptToSnapshot` answers `{ fresh: true }` or
`{ fresh: false, reasonCode }` from the closed `PRE_EXECUTION_FRESHNESS_CODES`,
in this fixed precedence: `stale-policy` → `stale-context` →
`stale-source-revision` → `stale-parent` → `stale-artifact-content` →
`stale-artifact-revision` → `missing-receipt-snapshot`, with `invalid-stage` and
`invalid-unit` refused before any comparison. Because a revert that rotates
`artifactRevisionId` still changes the snapshot digest, an old PASS cannot be
resurrected by editing a document back to its previous bytes.

### Published limits

`PRE_EXECUTION_LIMITS` (all exact ceilings, one diagnostic sink shared with the
other families):

```
artifacts 32 · contexts 16 · findings 64 · evidencePerFinding 8
parentReceipts 8 · receiptDiagnostics 8 · diagnostics 50
unitIdChars 128 · revisionIdChars 128 · idChars 128 · identifierChars 160
pathChars 1024 · claimChars 2048 · evidenceChars 1024
resolutionEvidenceChars 2048 · policyChars 64 · diagnosticChars 512
artifactBytes 4194304 · snapshotBytes 32768 · receiptBytes 65536
```

### Canonical form and vectors

Canonicalization sorts object keys, preserves declared array order, emits UTF-8
with no whitespace, and refuses leaves outside the JSON data model. Digests are
lowercase SHA-256 over those canonical bytes. Four payloads are published in
`PRE_EXECUTION_CANONICAL_VECTORS` (both stages × both contracts); the suite
reproduces every digest from its fixture independently through `node:crypto`, so
a serializer change breaks a test instead of silently moving a consumer's lineage.

The synchronous digest (`sha256HexSync`, used by the artifact builder) answers
from the host's native SHA-256 wherever the host exposes one through
`globalThis.process?.getBuiltinModule?.("crypto")` — Node v22.3.0 and v20.16.0
and later, and Bun; browsers expose no such binding — and from this package's
pure-JS FIPS 180-4 core everywhere else. The binding is looked up on every call
and never cached, so a bundle that moves between hosts cannot strand a stale
verdict, and a digest never throws because a host builtin did. Both paths return
one identical lowercase 64-hex digest for identical bytes; the three-path case in
`test/pre-execution-canonical.test.mjs` pins native, pure JS and async WebCrypto
against each other, and `npm run probe:sha256-paths` prints the digests and the
per-path cost of each on your host (check-only: it writes nothing).

```bash
npm run gate:pre-execution   # tests + schema drift + package checks + pack
```

### Consumer example

```ts
import {
  buildPreExecutionArtifactSnapshot,
  comparePreExecutionReceiptToSnapshot,
  digestPreExecutionArtifactSnapshot,
  selectSpecProduct,
  validatePreExecutionReceiptAgainstSnapshot,
} from "@gtrabanco/agentic-workflow-schema";

const POLICY_VERSION = "2026-08-30";

// The caller reads the documents: this package never touches Git or the filesystem.
const spec = [
  "# Toy feature", "", "## Goal", "", "Ship one usable slice.", "",
  "## Branch", "", "`feat/toy`", "", "## Size", "", "`S`", "",
  "## Dependencies", "", "- none", "", "## Product half", "", "### Scope", "",
  "- **S1:** the slice.", "", "## Design status", "", "`designed`", "",
].join("\n");

/** 1. Freeze the exact bytes a reviewer may rely on, at one causal revision. */
async function freeze(artifactRevisionId: string) {
  const built = buildPreExecutionArtifactSnapshot({
    stage: "spec",
    unitKind: "feature",
    unitId: "toy",
    sourceRevision: "8ab22ea6c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
    artifactRevisionId,
    files: [{ kind: "spec", path: "docs/features/toy/SPEC.md", content: spec }],
    contexts: [{ kind: "governing-issue", identifier: "#146", content: "the issue body" }],
  });
  const snapshot = built.ok ? built.snapshot : undefined;
  if (!snapshot) throw new Error(JSON.stringify(built.diagnostics));
  return snapshot;
}

const snapshot = await freeze("rev-0001");

// 2. A reviewer records a verdict bound to that digest, never to the mutable file.
const receipt = {
  contract: "agentic-workflow/pre-execution-review-receipt@1",
  id: "review-0001",
  stage: snapshot.stage,
  snapshotDigest: digestPreExecutionArtifactSnapshot(snapshot),
  verdict: "spec-review-pass",
  findings: [],
  reviewer: "reviewer-7",
  sessionId: "session-7",
  reviewerRole: "reviewer",
  authorId: "author-3",
  authorExclusion: "enforced",
  contextClean: true,
  modelDiversity: "cross-model",
  policyVersion: POLICY_VERSION,
  startedAt: "2026-08-30T00:00:00Z",
  finishedAt: "2026-08-30T00:04:00Z",
  parentReceipts: [],
  diagnostics: [],
};

// 3. Only this entry can bless a PASS; it answers with codes, never submitted values.
const blessed = validatePreExecutionReceiptAgainstSnapshot(receipt, snapshot, POLICY_VERSION);
if (!blessed.ok) throw new Error(JSON.stringify(blessed.diagnostics));

// 4. Before executing, freeze again: unchanged authority stays fresh.
const fresh = comparePreExecutionReceiptToSnapshot(
  receipt, snapshot, await freeze("rev-0001"), POLICY_VERSION,
);
if (fresh.fresh !== true) throw new Error(JSON.stringify(fresh));

// 5. Edit, revert, and rotate the revision anyway and the PASS is void: a stale
//    approval can never be resurrected by restoring the previous bytes.
const stale = comparePreExecutionReceiptToSnapshot(
  receipt, snapshot, await freeze("rev-0002"), POLICY_VERSION,
);
if (stale.fresh === true || stale.reasonCode !== "stale-artifact-revision") {
  throw new Error(JSON.stringify(stale));
}

// 6. The projection is why a plan-side write cannot erase Product lineage: the
//    selector never saw anything outside the named Product headings.
const projection = selectSpecProduct(`${spec}\n## Engineering half\n\n### Phases\n\n- P1\n`);
if (projection.ok !== true) throw new Error(JSON.stringify(projection.errors));
if (projection.content.includes("Engineering half")) throw new Error("the projection leaked");

console.log("review bound", projection.byteLength, receipt.snapshotDigest.slice(0, 12), fresh, stale);
```

## Staged Verification Contracts (feature 26)

Two versioned wire contracts for staged verification:

- `VerificationPlan v1` (`agentic-workflow/verification-plan@1`) — an ordered,
  non-empty command list where each command carries a stable `id`,
  `stage: fast | full` (the closed `VERIFICATION_STAGES` vocabulary), an
  `executable` and ordered `args` (never a shell
  string), a working-directory policy (`candidate-root` or `relative-path` with
  validated relative path), a positive `timeoutMs`, `stopOnFailure`, and a
  cost class (`VERIFICATION_COST_CLASSES`). The validated relative path is an **opaque** string: resolve it
  under the candidate root exactly as submitted, and never percent-decode it
  before resolution — decoding can turn a path the validator rejected into one
  that escapes the root.

- `VerificationReceipt v1` (`agentic-workflow/verification-receipt@1`) — a receipt that
  binds to the plan digest, candidate-snapshot digest, and acceptance
  fingerprint, carrying per-command results with status (`passed | failed |
  timed-out | skipped | infrastructure-error`), exit-code/signal per the D4
  matrix, bounded evidence references, and an explicit skip reason. The
  overall verdict (`pass | fail | incomplete`) is derived from the receipt
  content.

**Validation authority.** Exactly two public authoritative entries decide runtime
validity: `validateVerificationPlanV1(value)` for a plan, and
`await validateVerificationReceiptAgainstPlan(receipt, plan)` for a receipt, which
performs the structural check and every plan-bound rule in one call. No standalone
receipt validator is exported — a receipt is only meaningful against the plan it
binds to. Both accept unknown input and both return a **normalized** own-property
DTO on success rather than the object you handed them, so digests and downstream
semantics never depend on inherited, duplicated or undeclared properties.

**Failure diagnostics.** A rejection is `{ ok: false, diagnostics, truncated }`.
`diagnostics` holds at most 50 frozen `{ code, path }` rows in document order and
`truncated` says whether that ceiling dropped any. A row is never a message: no
prose and no submitted value is ever returned. `code` comes from the closed
`VERIFICATION_DIAGNOSTIC_CODES` vocabulary and `path` is an RFC 6901 JSON Pointer
built only from declared property names and array indices — `/commands/3/id`,
`/results/1/commandId`, or `""` for the payload as a whole. An undeclared key is
reported as `unknown-field` on its **container**, because the key name is itself
submitted data. Recover from diagnostics using only each stable `code` and `path`,
without copying submitted values into logs, errors, or telemetry.

| Diagnostic code | What it answers for | Caller recovery |
| --- | --- | --- |
| `invalid-type` | a field holds a value of the wrong JSON type | Supply the declared JSON type at `path`. |
| `missing-field` | a declared field is absent | Add the required field at `path`. |
| `unknown-field` | the object carries an undeclared property | Remove undeclared keys from the container at `path`. |
| `invalid-value` | a value breaks its own rule (vocabulary, pattern, NUL) | Replace it with an allowed vocabulary member or format-valid, NUL-free value. |
| `limit-exceeded` | a cardinality or length ceiling is crossed | Reduce the indicated collection or string to `VERIFICATION_LIMITS`. |
| `duplicate-id` | the same command id appears twice | Assign unique command ids, then update their result references. |
| `unknown-command` | a result or skip reason names no declared command | Reference an id declared by the bound plan. |
| `invalid-order` | results do not follow the plan's declared order | Reorder result rows to match plan order. |
| `invalid-stage` | a receipt carries a row outside its requested stage | Remove out-of-stage rows or request the stage that includes them. |
| `invalid-exit-state` | exit code and signal break the D4 matrix | Align `exitCode` and `signal` with the row's status matrix. |
| `invalid-evidence` | an evidence reference is malformed (D5 content rules) | Provide a bounded `ref`, non-negative byte count, and lowercase SHA-256. |
| `invalid-skip` | a skip reason is not justified by a failed predecessor | Use `null` when unattributed, or name an earlier actual non-pass trigger. |
| `invalid-fail-fast` | `stopOnFailure` sequencing is broken | Mark rows after the trigger skipped and attribute them to that trigger. |
| `digest-mismatch` | the receipt's `planDigest` is not the bound plan's | Recompute it from the validated, normalized bound plan. |
| `verdict-mismatch` | the stored verdict differs from the derived one | Store the result of `deriveVerificationVerdict`. |
| `budget-exceeded` | a stage's declared timeouts exceed its aggregate budget | Reduce command timeouts until the stage sum is within `VERIFICATION_LIMITS`. |

**JSON Schema status.** `verification-plan.schema.json` and
`verification-receipt.schema.json` are generated, **non-authoritative structural
projections** of the package's canonical contract definition. They exist for editors
and transport checks; a Draft-07 match is not contract validity, and semantic rules
(`unique-command-ids`, both aggregate stage budgets, both canonical byte budgets) are
enforced only by the two runtime entries above — each projection discloses them in
its `$comment`. The projections are generated rather than hand-edited. In a source
checkout, maintainers change the canonical definition; the only writer is
`node scripts/generate-verification-schemas.mjs`, and the source-only drift check
rebuilds before comparing bytes.

**Source-checkout-only commands.** The published tarball intentionally omits the
repository's `scripts/`, `test/`, source, and TypeScript configuration. These
manifest commands are maintainer checks for a source checkout, not commands an
installed-package consumer can run:

| Source-checkout-only command | Purpose |
| --- | --- |
| `npm run check:verification-schemas` | rebuild and byte-check generated projections |
| `npm run check:verification-package` | inspect the package tarball contract |
| `npm run bench:verification -- --commands 128` | run the AC10 warm-process benchmark |
| `npm run test:verification-docs` | run the executable bilingual documentation suite |
| `npm run gate:verification` | compose all verification release checks |

**Two-stage model:** requesting `fast` executes only fast commands; requesting
`full` executes every fast and full command. The freshness predicate returns
one of the stable `VERIFICATION_FRESHNESS_CODES` reason codes (`stale-plan | stale-candidate-snapshot |
stale-acceptance-fingerprint | incomplete-missing-results |
incomplete-unjustified-skip | incomplete-stage-coverage`) or `{ fresh: true }`.

**Delivery-gate rule:** a delivery verification gate is satisfied ONLY by a
receipt that is fresh, requests `full`, and has verdict `pass`.

**No-execution boundary:** the package validates, canonicalizes, digests,
derives, and compares — it does not execute commands. The caller owns execution.

### Public verification API inventory

The complete runtime surface for these contracts is:

| Runtime group | Exports |
| --- | --- |
| Contract and vocabulary values | `VERIFICATION_PLAN_CONTRACT_ID`, `VERIFICATION_RECEIPT_CONTRACT_ID`, `VERIFICATION_STAGES`, `VERIFICATION_COST_CLASSES`, `VERIFICATION_COMMAND_STATUSES`, `VERIFICATION_VERDICTS`, `VERIFICATION_DIAGNOSTIC_CODES`, `VERIFICATION_FRESHNESS_CODES`, `VERIFICATION_LIMITS`, `VERIFICATION_CANONICAL_VECTORS` |
| Validation and semantics | `validateVerificationPlanV1`, `validateVerificationReceiptAgainstPlan`, `deriveVerificationVerdict`, `compareVerificationReceiptToCurrent` |
| Canonicalization and digests | `canonicalizeVerificationPlan`, `canonicalizeVerificationReceipt`, `digestVerificationPlan`, `digestVerificationReceipt` |

TypeScript also publishes these type-only names:

| Type group | Exports |
| --- | --- |
| Plan | `VerificationStage`, `VerificationCostClass`, `WorkingDirectoryPolicy`, `VerificationCommandV1`, `VerificationPlanV1`, `VerificationPlanValidationResult` |
| Receipt | `VerificationCommandStatus`, `VerificationVerdict`, `VerificationStageRequest`, `EvidenceReferenceV1`, `VerificationResultV1`, `VerificationReceiptV1`, `VerificationReceiptValidationResult` |
| Diagnostics and freshness | `VerificationDiagnosticCode`, `VerificationDiagnosticV1`, `VerificationFreshnessReasonCode`, `VerificationFreshnessResult` |

### Usability limits

Every v1 ceiling is published once, as the frozen `VERIFICATION_LIMITS` object, and
is enforced by the two authoritative entries: an over-limit plan or receipt is
rejected, never silently truncated.

| Limit | Value | Applies to |
| --- | --- | --- |
| `commands` | 128 | commands declared in one plan |
| `results` | 128 | result rows in one receipt |
| `argsPerCommand` | 64 | arguments in one command |
| `idChars` | 128 | a command `id` or result `commandId` |
| `pathChars` | 1024 | `executable` and `workingDirectory` |
| `argChars` | 4096 | a single argument string |
| `skipReasonChars` | 1024 | a `skipReason` |
| `evidenceRefChars` | 1024 | an evidence `ref` |
| `planBytes` | 262144 | canonical plan size (256 KiB) |
| `receiptBytes` | 524288 | canonical receipt size (512 KiB) |
| `fastCommandTimeoutMs` | 600000 | one fast command's timeout (10 min) |
| `fastStageTimeoutMs` | 900000 | every fast command's timeouts summed (15 min) |
| `fullCommandTimeoutMs` | 3600000 | one full command's timeout (60 min) |
| `fullStageTimeoutMs` | 7200000 | every full command's timeouts summed (2 h, i.e. 120 min) |
| `diagnostics` | 50 | rows in one failure result |

The canonical byte budget is measured before a payload is examined, so an oversized
document is refused by the budget alone. The time ceilings are deliberately
asymmetric: one maximum-length fast command leaves 5 minutes for the rest of the
fast stage. `npm run bench:verification -- --commands 128` is a
source-checkout-only maintainer command: run it from a source checkout, never
from the installed tarball, and it proves the declared performance bound — a warm
128-command plan+receipt validate → canonicalize → digest cycle at p95 ≤ 100 ms —
and exits non-zero when it is not met. Cross-implementation
interoperability is pinned by `VERIFICATION_CANONICAL_VECTORS`, the frozen
`{ contract, digest, description }` fixtures whose digests any correct
canonicalizer must reproduce — the package's own digest tests consume exactly
these payloads.

### Consumer example

```ts
import {
  compareVerificationReceiptToCurrent,
  deriveVerificationVerdict,
  digestVerificationPlan,
  validateVerificationPlanV1,
  validateVerificationReceiptAgainstPlan,
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
} from "@gtrabanco/agentic-workflow-schema";

const candidateDigest = "3f2a9c1e5b7d4f8a0c2e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a";
const acceptanceDigest = "9c4e7b1d3f5a8c2e4b6d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c24";

// 1. Declare the plan: a fast lint that stops the stage, then a full test run.
const plan = {
  contract: VERIFICATION_PLAN_CONTRACT_ID,
  commands: [
    { id: "lint", stage: "fast" as const, executable: "npm", args: ["run", "lint"],
      workingDirectoryPolicy: "candidate-root" as const, workingDirectory: null,
      timeoutMs: 30_000, stopOnFailure: true, costClass: "cheap" as const },
    { id: "test", stage: "full" as const, executable: "npm", args: ["test"],
      workingDirectoryPolicy: "candidate-root" as const, workingDirectory: null,
      timeoutMs: 120_000, stopOnFailure: false, costClass: "moderate" as const },
  ],
} as const;

const pv = validateVerificationPlanV1(plan);
if (!pv.ok) throw new Error(`plan rejected: ${JSON.stringify(pv.diagnostics)}`);

// 2. Bind the receipt to one candidate and one acceptance manifest. In a real
//    gate `candidateDigest` comes from `digestCandidateSnapshot(snapshot)` and
//    `acceptanceDigest` comes from `computeAcceptanceFingerprint(rows)`, which
//    hashes the ordered `{ id, blobSha256 }` acceptance rows — not the raw
//    `ACCEPTANCE.md` blob itself.
const planDigest = await digestVerificationPlan(pv.plan);
const receipt = {
  contract: VERIFICATION_RECEIPT_CONTRACT_ID,
  planDigest,
  candidateSnapshotDigest: candidateDigest,
  acceptanceFingerprint: acceptanceDigest,
  stageRequested: "full" as const,
  results: [
    { commandId: "lint", status: "passed" as const, exitCode: 0, signal: null,
      startedAt: "2026-08-27T09:00:00Z", endedAt: "2026-08-27T09:00:12Z",
      stdout: null, stderr: null, skipReason: null },
    { commandId: "test", status: "passed" as const, exitCode: 0, signal: null,
      startedAt: "2026-08-27T09:00:12Z", endedAt: "2026-08-27T09:02:00Z",
      stdout: { ref: "evidence/test/stdout.log", bytes: 18213,
        sha256: "6b1f4d8a2c5e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d" },
      stderr: null, skipReason: null },
  ],
  verdict: "pass" as const,
} as const;

// 3. One call proves receipt structure and plan binding.
const rv = await validateVerificationReceiptAgainstPlan(receipt, plan);
if (!rv.ok) throw new Error(`receipt rejected: ${JSON.stringify(rv.diagnostics)}`);

// 4. A row that ran longer than its command's declared timeout is incoherent.
for (const result of rv.receipt.results) {
  const declared = pv.plan.commands.find((command) => command.id === result.commandId);
  if (declared === undefined || Date.parse(result.endedAt) - Date.parse(result.startedAt) > declared.timeoutMs) {
    throw new Error(`${result.commandId} outran the timeout its command declared`);
  }
}

// 5. The verdict is derived from content; the payload's copy is never trusted.
const derived = deriveVerificationVerdict(rv.receipt, pv.plan); // => "pass"

// 6. Freshness compares the digests the receipt was bound to with the current ones.
const freshness = await compareVerificationReceiptToCurrent(
  rv.receipt, pv.plan, candidateDigest, acceptanceDigest,
);

// 7. The delivery gate needs all three conditions at once.
if (freshness.fresh === true && rv.receipt.stageRequested === "full" && derived === "pass") {
  console.log("Delivery verified");
}
```

### Consumer boundary

An AWL dialect, runner or adapter that emits plans and executes them is **not part
of this package**, and no issue tracks it: this schema owns the contracts, the
canonical forms and the digests only. It becomes independent future work once AWL
consumes the released package.
