/**
 * snapshotFromEnvelope — pure mapping from an Envelope v2 to a WorkflowSnapshot v1.
 *
 * The conductor builds its own lightweight snapshot from the envelope; it does
 * NOT call compileWorkflowSnapshot (that's a separate concern).
 */

import type { WorkflowSnapshot } from "@gtrabanco/agentic-workflow-schema";

import type { EnvelopeLike } from "./types.js";

/**
 * Map an Envelope v2 into a WorkflowSnapshot v1.
 * Pure function — no I/O, no side effects.
 */
export function snapshotFromEnvelope(env: EnvelopeLike): WorkflowSnapshot {
  const detail = env.detail as Record<string, unknown> | undefined;
  const rs = detail?.repository_state as Record<string, unknown> | undefined;
  const status = String(rs?.status ?? "unknown");
  const sourceRevision =
    (rs?.source_revision as string | undefined) ?? env.summary;

  // Map unit
  const unitLike = env.unit as
    | Record<string, unknown>
    | null
    | undefined;
  const unit: WorkflowSnapshot["unit"] = unitLike
    ? {
        kind: unitLike.type === "fix" ? ("fix" as const) : ("feature" as const),
        id: (unitLike.id as string) ?? "",
        status: "",
      }
    : null;

  // Phase: current, total, completed; names not available from envelope
  const phaseRaw = env.phase as Record<string, unknown> | undefined;
  const phase = {
    current: (phaseRaw?.current as string | null) ?? null,
    total: (phaseRaw?.total as number | null) ?? null,
    completed: (phaseRaw?.completed as number | null) ?? null,
    names: [] as string[],
  };

  // Repository: branch from unit.branch, headSha from pr.head_sha or falls back
  const pr = env.pr as Record<string, unknown> | undefined;
  const branch = (unitLike?.branch as string | undefined) ?? "";
  const headShaFromPr = pr?.head_sha as string | null | undefined;
  const headSha: string = headShaFromPr ?? sourceRevision;

  // dirty is always false from the envelope
  const dirty = false;

  // Detect contradictions from the envelope's repository_state
  const contradictions: Array<{ field: string; source: string; line: number; detail: string }> =
    status === "contradicted"
      ? [{ field: "repository_state", source: "workflow-status", line: 0, detail: "repository_state is contradicted" }]
      : [];

  // Detect unknowns from the envelope's repository_state
  const unknowns: Array<{ field: string; reason: string }> =
    status === "unknown"
      ? [{ field: "repository_state", reason: "repository_state is unknown" }]
      : [];

  return {
    contract: "agentic-workflow/workflow-snapshot",
    version: 1,
    sourceRevision,
    repository: { branch, headSha, dirty },
    repositoryState: status as WorkflowSnapshot["repositoryState"],
    unit,
    phase,
    provenance: [{ field: "envelope", source: "workflow-status", line: 0 }],
    contradictions,
    unknowns,
  };
}