import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  compileWorkflowSnapshot,
  parseTurn,
  renderOutputInstruction,
  validateEnvelopeV2Strict,
  validateSkillOutcomeV1,
  validateWorkflowSnapshotV1,
  WORKFLOW_SKILL_PROFILES,
} from "../dist/index.js";

const envelope = (overrides = {}) => ({
  skill: "audit-pr",
  state: "BLOCKED",
  summary: "The audit found one blocking gate.",
  unit: { type: "feature", id: "12-skill-lockfile", issue: 134, branch: "fix/134-machine-contract" },
  phase: { current: "P1", total: 2, completed: 0 },
  pr: { number: 340, url: "https://github.com/example/repo/pull/340", state: "open", head_sha: "abc123", merge_ready: null, ci: "red" },
  gates: { verification: "red", review_pending: true, audit_pending: true },
  findings: { fix_now: [], issues_filed: [], untriaged: 0, decisions_recorded: 0 },
  blockers: [{ kind: "gate", id: "review-receipt", scope: "unit", detail: "The review receipt is stale." }],
  dependencies: { unmet: [], build_order: [] },
  recommendations: { product_audit: false, reason: null },
  needs_input: null,
  next: { recommended: "/review-change", alternatives: [], tier: "strong" },
  detail: null,
  ...overrides,
});

const fenced = (value) => `report\n\n\`\`\`json\n${JSON.stringify(value)}\n\`\`\``;
const packageFile = (name) => fileURLToPath(new URL(`../${name}`, import.meta.url));

test("strict v2 requires detail and rejects unknown top-level keys", () => {
  const { detail: _detail, ...missingDetail } = envelope();
  const missing = validateEnvelopeV2Strict(missingDetail);
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.includes("missing required key: detail"));

  const extra = validateEnvelopeV2Strict(envelope({ unexpected: true }));
  assert.equal(extra.ok, false);
  assert.ok(extra.errors.includes("unexpected top-level key: unexpected"));
});

test("strict v2 rejects unknown nested keys at the same boundary as the JSON Schema", () => {
  const result = validateEnvelopeV2Strict(
    envelope({
      blockers: [
        {
          kind: "gate",
          id: "review-receipt",
          scope: "unit",
          detail: "The review receipt is stale.",
          severity: "high",
        },
      ],
    }),
  );

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("unexpected key: blockers[0].severity"));
});

test("parseTurn normalizes the reported audit-pr native envelope without inventing facts", () => {
  const nativeEnvelope = envelope({
    unit: { type: "feature", id: 12, issue: 134, branch: "fix/134-machine-contract" },
    findings: { fix_now: [], issues_filed: 0, untriaged: 0, decisions_recorded: 0 },
    blockers: [
      {
        gate: "review-receipt",
        evidence: "The review receipt is stale.",
        route: "/review-change",
        severity: "high",
      },
    ],
  });

  const result = parseTurn({
    skill: "audit-pr",
    text: fenced(nativeEnvelope),
    context: { unitId: "12-skill-lockfile" },
  });

  assert.equal(result.ok, true);
  assert.equal(result.source, "envelope-v2-compat");
  assert.equal(result.envelope.unit.id, "12-skill-lockfile");
  assert.deepEqual(result.envelope.findings.issues_filed, []);
  assert.deepEqual(result.envelope.blockers, [
    {
      kind: "gate",
      id: "review-receipt",
      scope: "unit",
      detail: "The review receipt is stale.",
    },
  ]);
  assert.equal(result.outcome.status, "blocked");
  assert.equal(result.outcome.next.intent, "review-change");
  assert.ok(result.diagnostics.some((entry) => entry.code === "unit-id-from-context"));
});

test("parseTurn refuses a non-zero issue count because issue identities are not recoverable", () => {
  const result = parseTurn({
    skill: "audit-pr",
    text: fenced(envelope({ findings: { fix_now: [], issues_filed: 2, untriaged: 0, decisions_recorded: 0 } })),
    context: { unitId: "12-skill-lockfile" },
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((entry) => entry.includes("issues_filed count 2 cannot be normalized")));
});

test("parseTurn moves the documented legacy design_candidates extension into detail", () => {
  const result = parseTurn({
    skill: "workflow-status",
    text: fenced(envelope({
      skill: "workflow-status",
      design_candidates: ["13-machine-contract"],
      detail: undefined,
    })),
  });

  assert.equal(result.ok, true);
  assert.equal(result.source, "envelope-v2-compat");
  assert.deepEqual(result.envelope.detail, { design_candidates: ["13-machine-contract"] });
  assert.ok(result.diagnostics.some((entry) => entry.code === "design-candidates-moved"));
});

test("parseTurn accepts the compact model-owned SkillOutcome v1", () => {
  const outcome = {
    contract: "agentic-workflow/skill-outcome",
    version: 1,
    skill: "review-change",
    status: "continue",
    summary: "Two findings remain open on the current branch.",
    next: { intent: "loop-review-fold", targets: ["12-skill-lockfile"] },
    blockers: [],
    questions: [],
    discoveries: [],
    evidence_refs: ["docs/features/12-skill-lockfile/review-findings.md"],
  };

  const result = parseTurn({ skill: "review-change", text: fenced(outcome) });
  assert.equal(result.ok, true);
  assert.equal(result.source, "skill-outcome-v1");
  assert.deepEqual(result.outcome, outcome);
});

test("public validators reject undeclared model outcomes and malformed snapshots", () => {
  const outcome = validateSkillOutcomeV1({
    contract: "agentic-workflow/skill-outcome",
    version: 1,
    skill: "review-change",
    status: "completed",
    summary: "The change is ready.",
    next: { intent: "none", targets: [] },
    blockers: [],
    questions: [],
    discoveries: [],
    evidence_refs: [],
    invented_routing_field: true,
  });
  assert.equal(outcome.ok, false);
  assert.ok(outcome.errors.includes("unexpected top-level key: invented_routing_field"));

  const snapshot = validateWorkflowSnapshotV1({
    contract: "agentic-workflow/workflow-snapshot",
    version: 1,
    sourceRevision: "0123456789abcdef",
    repository: { branch: "main", headSha: "abcdef012345", dirty: false },
    repositoryState: "frozen",
    unit: null,
    phase: { current: null, total: null, completed: null, names: [] },
    provenance: [],
    contradictions: [],
    unknowns: [{ field: "unit", reason: 42 }],
  });
  assert.equal(snapshot.ok, false);
  assert.ok(snapshot.errors.includes("unknowns[0].reason must be a string"));
});

test("parseTurn extracts only fixed native contracts and leaves arbitrary prose unresolved", () => {
  const known = parseTurn({
    skill: "loop-review-fold",
    text: "REVIEW-FOLD LOOP — BLOCKED\nReview: FAIL · Fold: unchanged\n\n→ Next: /review-change — obtain a current receipt",
  });
  assert.equal(known.ok, true);
  assert.equal(known.source, "native");
  assert.equal(known.outcome.status, "blocked");
  assert.equal(known.outcome.next.intent, "review-change");

  const unknown = parseTurn({ skill: "loop-review-fold", text: "Probably ready; maybe check later." });
  assert.equal(unknown.ok, false);
  assert.ok(unknown.errors.includes("no deterministic workflow result found"));
});

test("parseTurn recognizes the fixed audit-pr verdict without requiring a duplicate envelope", () => {
  const result = parseTurn({
    skill: "audit-pr",
    text:
      "VERDICT: BLOCKED (1 blockers)\n1. [gate] review-receipt — receipt is stale → fix (/review-change)\n\n→ Next: /review-change — refresh review evidence",
  });

  assert.equal(result.ok, true);
  assert.equal(result.source, "native");
  assert.equal(result.outcome.status, "blocked");
  assert.deepEqual(result.outcome.blockers, [
    { kind: "gate", id: "review-receipt", scope: "unit", detail: "receipt is stale" },
  ]);
});

test("machine profiles cover exactly the skills AWL can invoke", () => {
  assert.deepEqual(
    WORKFLOW_SKILL_PROFILES.map((profile) => profile.skill),
    [
      "init-workspace",
      "workflow-status",
      "discover-repository-state",
      "resolve-repository-state",
      "design-feature",
      "plan-feature",
      "plan-fix",
      "triage-issue",
      "execute-phase",
      "review-change",
      "loop-review-fold",
      "audit-pr",
    ],
  );
  assert.equal(WORKFLOW_SKILL_PROFILES.find((profile) => profile.skill === "workflow-status").output, "envelope-v2");
  assert.equal(WORKFLOW_SKILL_PROFILES.find((profile) => profile.skill === "audit-pr").output, "skill-outcome-v1");
});

test("profiles fail closed when a sensor receives the wrong result contract or a skill is unknown", () => {
  const sensorOutcome = parseTurn({
    skill: "workflow-status",
    text: fenced({
      contract: "agentic-workflow/skill-outcome",
      version: 1,
      skill: "workflow-status",
      status: "completed",
      summary: "A compact result is not the sensor contract.",
      next: { intent: "none", targets: [] },
      blockers: [],
      questions: [],
      discoveries: [],
      evidence_refs: [],
    }),
  });
  assert.equal(sensorOutcome.ok, false);
  assert.ok(sensorOutcome.errors.includes("workflow-status requires an envelope-v2 result"));
  assert.throws(() => renderOutputInstruction("unregistered-skill"), /unknown workflow skill/i);
});

test("renderOutputInstruction keeps workflow-status on v2 and asks other skills for the compact outcome", () => {
  const statusInstruction = renderOutputInstruction("workflow-status");
  assert.match(statusInstruction, /machine envelope/i);
  assert.match(statusInstruction, /unit\.id.*string or null/i);
  assert.match(statusInstruction, /findings\.issues_filed.*array of integers/i);
  assert.match(statusInstruction, /blockers\[\].*kind.*id.*scope.*detail/i);
  const instruction = renderOutputInstruction("audit-pr");
  assert.match(instruction, /agentic-workflow\/skill-outcome/);
  assert.match(instruction, /blockers.*kind.*id.*scope.*detail/i);
  assert.match(instruction, /questions.*id.*question.*options/i);
  assert.match(instruction, /discoveries.*evidence_refs.*proposed_intent/i);
  assert.doesNotMatch(instruction, /"phase"/);
});

test("compileWorkflowSnapshot reports deterministic phase state and provenance", () => {
  const result = compileWorkflowSnapshot({
    sourceRevision: "0123456789abcdef",
    repository: { branch: "fix/134-machine-contract", headSha: "abcdef012345", dirty: false },
    documents: [
      {
        path: "docs/workflow/REPOSITORY_STATE.md",
        content: "# Repository state\n\nStatus: frozen\n",
      },
      {
        path: "docs/features/ROADMAP.md",
        content:
          "| # | Slug | Status | Depends on | Title |\n| - | - | - | - | - |\n| 12 | skill-lockfile | in-progress | — | Machine contract |\n",
      },
      {
        path: "docs/features/12-skill-lockfile/SPEC.md",
        content:
          "# 12 — skill-lockfile\n\n### P1 — Contract parser\n\n### P2 — Compatibility fixtures\n",
      },
      {
        path: "docs/features/12-skill-lockfile/progress.md",
        content: "# Progress\n\n- Done: P1 — Contract parser\n- Remains: P2 — Compatibility fixtures\n",
      },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.snapshot.unit, {
    kind: "feature",
    id: "12-skill-lockfile",
    status: "in-progress",
  });
  assert.deepEqual(result.snapshot.phase, {
    current: "P2",
    total: 2,
    completed: 1,
    names: ["P1 — Contract parser", "P2 — Compatibility fixtures"],
  });
  assert.equal(result.snapshot.repository.headSha, "abcdef012345");
  assert.ok(result.snapshot.provenance.some((entry) => entry.field === "phase.current"));
  assert.deepEqual(result.snapshot.unknowns, []);
});

test("compileWorkflowSnapshot refuses to infer a phase from ambiguous progress", () => {
  const result = compileWorkflowSnapshot({
    sourceRevision: "0123456789abcdef",
    repository: { branch: "main", headSha: "abcdef012345", dirty: false },
    documents: [
      { path: "docs/workflow/REPOSITORY_STATE.md", content: "Status: frozen\n" },
      {
        path: "docs/features/ROADMAP.md",
        content: "| 12 | skill-lockfile | in-progress | — | Machine contract |\n",
      },
      {
        path: "docs/features/12-skill-lockfile/SPEC.md",
        content: "### P1 — Contract parser\n### P2 — Compatibility fixtures\n",
      },
      { path: "docs/features/12-skill-lockfile/progress.md", content: "No phase receipt was recorded.\n" },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.snapshot.phase.current, null);
  assert.ok(result.snapshot.unknowns.some((entry) => entry.field === "phase.current"));
});

test("compileWorkflowSnapshot preserves contradictory repository state as a fact", () => {
  const result = compileWorkflowSnapshot({
    sourceRevision: "0123456789abcdef",
    repository: { branch: "main", headSha: "abcdef012345", dirty: false },
    documents: [{ path: "docs/workflow/REPOSITORY_STATE.md", content: "Status: contradicted\n" }],
  });

  assert.equal(result.ok, true);
  assert.equal(result.snapshot.repositoryState, "contradicted");
  assert.deepEqual(result.snapshot.contradictions, [
    {
      field: "repositoryState",
      source: "docs/workflow/REPOSITORY_STATE.md",
      line: 1,
      detail: "REPOSITORY_STATE.md declares the repository state contradicted.",
    },
  ]);
});

test("compileWorkflowSnapshot fails closed when caller facts cannot form a v1 snapshot", () => {
  const result = compileWorkflowSnapshot({
    sourceRevision: "",
    repository: { branch: "main", headSha: "abcdef012345", dirty: false },
    documents: [],
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("sourceRevision must be a non-empty string"));
});

test("compileWorkflowSnapshot falls back to the active fix index when no feature is in progress", () => {
  const result = compileWorkflowSnapshot({
    sourceRevision: "0123456789abcdef",
    repository: { branch: "fix/134-machine-contract", headSha: "abcdef012345", dirty: false },
    documents: [
      { path: "docs/workflow/REPOSITORY_STATE.md", content: "Status: frozen\n" },
      { path: "docs/features/ROADMAP.md", content: "| 12 | skill-lockfile | done | — | Machine contract |\n" },
      {
        path: "docs/fix/README.md",
        content:
          "| Folder | Topic | Status | Depends on | Issue |\n| `134-machine-contract` | Deterministic machine contract | in-progress | — | #134 |\n",
      },
      {
        path: "docs/fix/134-machine-contract/SPEC.md",
        content: "### P1 — Strict parser\n\n### P2 — Contract fixtures\n",
      },
      {
        path: "docs/fix/134-machine-contract/progress.md",
        content: "- Done: P1 — Strict parser\n- Remains: P2 — Contract fixtures\n",
      },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.snapshot.unit, {
    kind: "fix",
    id: "134-machine-contract",
    status: "in-progress",
  });
  assert.equal(result.snapshot.phase.current, "P2");
});

test("published JSON Schemas match the strict v2, outcome, and snapshot contracts", async () => {
  const [envelopeSchema, outcomeSchema, snapshotSchema] = await Promise.all(
    ["envelope.schema.json", "skill-outcome.schema.json", "workflow-snapshot.schema.json"].map(async (file) =>
      JSON.parse(await readFile(packageFile(file), "utf8")),
    ),
  );

  assert.equal(envelopeSchema.additionalProperties, false);
  assert.ok(envelopeSchema.required.includes("detail"));
  assert.equal(envelopeSchema.properties.unit.additionalProperties, false);

  assert.equal(outcomeSchema.properties.contract.const, "agentic-workflow/skill-outcome");
  assert.deepEqual(outcomeSchema.required, [
    "contract",
    "version",
    "skill",
    "status",
    "summary",
    "next",
    "blockers",
    "questions",
    "discoveries",
    "evidence_refs",
  ]);
  assert.equal(outcomeSchema.additionalProperties, false);

  assert.equal(snapshotSchema.properties.contract.const, "agentic-workflow/workflow-snapshot");
  assert.ok(snapshotSchema.required.includes("provenance"));
  assert.ok(snapshotSchema.required.includes("contradictions"));
  assert.ok(snapshotSchema.required.includes("unknowns"));
});
