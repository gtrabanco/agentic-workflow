/**
 * judgeUrgency > classify urgency from an envelope's urgent detail.
 *
 * Implements the five-row urgency table:
 *   1. no urgent issues → no-urgent
 *   2. fix-next label present → finish-first (queue head, never interrupt)
 *   3. interruptibility.dirty === false → interrupt-now
 *   4. tasks_from_boundary ≤ 1 → finish-first
 *   5. else → finish-first (fail-safe: finish first, never interrupt mid-phase)
 */

import type { EnvelopeLike, UrgencyResult } from "./types.js";

interface UrgentDetail {
  issues?: Array<{ number: number; title: string; label: string }>;
  interruptibility?: {
    unit: string;
    phase: string;
    dirty: boolean;
    tasks_from_boundary: number;
  };
}

/**
 * Classify urgency from an envelope's urgent detail.
 * Pure function > no I/O, no side effects.
 */
export function judgeUrgency(env: EnvelopeLike): UrgencyResult {
  const detail = env.detail as Record<string, unknown> | undefined;
  const urgent = detail?.urgent as UrgentDetail | undefined;

  if (!urgent) {
    return { verdict: "no-urgent", reason: "no urgent detail found" };
  }

  const issues = urgent.issues ?? [];
  const interruptibility = urgent.interruptibility;

  // Row 1: no urgent issues → no-urgent
  if (issues.length === 0) {
    return { verdict: "no-urgent", reason: "no urgent issues present" };
  }

  // Pick the first issue (highest priority)
  const firstIssue = issues[0];
  const issueNumber = firstIssue.number;

  // Row 2: fix-next label → finish-first (queue head, never interrupt)
  const hasFixNext = issues.some((i) => i.label === "fix-next");
  if (hasFixNext) {
    return {
      verdict: "finish-first",
      issue: issueNumber,
      reason: "fix-next issue in queue: finish current unit first, queue head priority",
    };
  }

  // Fall through to interruptibility checks
  if (interruptibility) {
    // Row 3: dirty === false → interrupt-now
    if (!interruptibility.dirty) {
      return {
        verdict: "interrupt-now",
        issue: issueNumber,
        reason: `unit ${interruptibility.unit} is not dirty > safe to interrupt`,
      };
    }

    // Row 4: tasks_from_boundary ≤ 1 → finish-first
    if (interruptibility.tasks_from_boundary <= 1) {
      return {
        verdict: "finish-first",
        issue: issueNumber,
        reason: "few tasks remaining (≤ 1) > finish first",
      };
    }

    // Row 5: fail-safe finish-first (dirty, tasks > 1, no fix-next)
    return {
      verdict: "finish-first",
      issue: issueNumber,
      reason: "fail-safe: unit is dirty with multiple tasks remaining > finish first, never interrupt mid-phase",
    };
  }

  // No interruptibility data → finish-first (fail-safe)
  return {
    verdict: "finish-first",
    issue: issueNumber,
    reason: "no interruptibility data available > finish first (fail-safe)",
  };
}