/**
 * runConductorLoop — the main deterministic loop (feature 62).
 *
 * Flow per iteration:
 *  1. Sensor (runSensor(cwd, runtimeBin) — Envelope v2, fail-closed)
 *  2. Urgency judge (deterministic short-circuits; INTERRUPT_NOW parks first)
 *  3. Git probe & closeout (consecutive-partial tracking)
 *  4. Decide (decideWorkflowAction over the mapped snapshot)
 *  5. invoke → sendUserMessage(invocation verbatim) | sense (bounded) | stop
 *
 * Stops on: sensor refusal, invocation refusal, stop decision, 3 consecutive
 * partials, 2 consecutive senses without progress, cap exceeded. NEVER sends a
 * merge command — merge authority stays with the human + /audit-pr (feature 20).
 *
 * Run-log line format (SPEC AC10):
 *   YYYY-MM-DD HH:MM — <kind/code> — <invocation|stop> — <k>/<cap>
 */

import type {
  CloseoutStatus,
  ConductorConfig,
  ContinuationPrecondition,
  LoopDeps,
  LoopResult,
} from "./types.js";
import { checkCloseout } from "./closeout.js";

/** Default config used when deps.config is not provided. */
export const DEFAULT_CONDUCTOR_CONFIG: ConductorConfig = {
  iterationsCap: 12,
  sensitivePaths: [],
  securityPaths: [],
  runLogPath: ".agentic-workflow/advance-run.log",
};

/**
 * Fallback command-name set used when deps.commandNames is not provided.
 * The real wiring derives the names from the bundled skills catalogue —
 * this fallback covers the lane's own user-invocable commands only.
 * Retired fixed-pipeline skills and the merge verb are deliberately absent.
 */
const FALLBACK_COMMANDS = new Set([
  "audit-docs", "audit-pr", "discover-repository-state", "execute-phase",
  "fold-findings", "init-workspace", "product-audit",
  "resolve-repository-state", "review-change", "triage-issue", "unit-lane",
  "workflow-status",
]);

/** Verbs the conductor must never invoke, whatever the decision says. */
const FORBIDDEN_VERBS = new Set(["merge", "fullauto-merge"]);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatDate(now: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatLogLine(kind: string, code: string, invocation: string, iteration: number, cap: number): string {
  return `${formatDate(new Date())} — ${kind}/${code} — ${invocation} — ${iteration}/${cap}`;
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

/**
 * Run the conductor loop until convergence, stop, cap, or park.
 * All I/O is injected through deps; the loop itself is deterministic.
 */
export async function runConductorLoop(deps: LoopDeps): Promise<LoopResult> {
  const config = deps.config ?? DEFAULT_CONDUCTOR_CONFIG;
  const cap = config.iterationsCap ?? 12;
  const commandNames = deps.commandNames ?? FALLBACK_COMMANDS;
  const cwd = deps.cwd ?? process.cwd();
  const bin = deps.runtimeBin ?? "bun";
  let consecutivePartials = 0;
  let consecutiveSenses = 0;
  let invoked = 0;

  for (let iteration = 1; iteration <= cap; iteration++) {
    // ── 1. Sensor ───────────────────────────────────────────────────────
    const sensorResult = await deps.runSensor(cwd, bin);

    if (!sensorResult.ok) {
      deps.appendRunLog(
        formatLogLine("stop", sensorResult.refusal, "sensor-refused", iteration, cap),
      );
      return {
        banner: "ADVANCE: STOPPED",
        stopCode: sensorResult.refusal,
        detail: `${sensorResult.refusal}: ${sensorResult.detail}`,
        iterations: iteration - 1,
      };
    }

    const envelope = sensorResult.envelope;

    // ── 2. Urgency judge (deterministic; AC5) ───────────────────────────
    const urgency = deps.judgeUrgency(envelope);
    if (urgency.verdict === "interrupt-now") {
      // Park the in-flight unit, then let the next iteration's sensor route
      // to the urgent issue (the sensor's priority queue already ranks it).
      deps.parkInFlight();
      deps.appendRunLog(
        formatLogLine("urgent", "INTERRUPT_NOW", `issue ${urgency.issue ?? "?"}`, iteration, cap),
      );
      continue;
    }
    // finish-first (incl. fix-next head-of-line and the fail-safe default):
    // proceed normally — the sensor ranks the urgent fix for a later iteration.

    // ── 3. Git probe & closeout (AC7) ───────────────────────────────────
    const gitStatus = await deps.gitProbe();
    const closeout: CloseoutStatus = checkCloseout(gitStatus.porcelain, gitStatus.ahead);

    if (closeout === "partial") {
      consecutivePartials++;
      if (consecutivePartials >= 3) {
        deps.appendRunLog(
          formatLogLine("stop", "parked", "consecutive-partials", iteration, cap),
        );
        return {
          banner: "ADVANCE: STOPPED",
          stopCode: "parked",
          detail: "parked after 3 consecutive partial closeouts",
          iterations: iteration - 1,
        };
      }
    } else {
      consecutivePartials = 0;
    }

    // ── 4. Decide ───────────────────────────────────────────────────────
    const decision = deps.decide({
      envelope,
      lastOutcome: null,
      lastOutcomeSourceRevision: null,
      policy: deps.policy ?? { allowedIntents: [...FALLBACK_COMMANDS], forgeWriteAuthorized: true },
    });

    // ── 5. Handle decision ──────────────────────────────────────────────
    if (decision.kind === "invoke") {
      const invResult = deps.invocation(decision, {
        commandNames,
        attended: deps.attended,
        sensitive: (config.sensitivePaths?.length ?? 0) > 0,
        security: (config.securityPaths?.length ?? 0) > 0,
        unitScope: envelope.unit
          ? {
              type: (envelope.unit as Record<string, unknown>).type as string ?? "",
              id: (envelope.unit as Record<string, unknown>).id as string ?? "",
            }
          : undefined,
        continuation: (envelope.next as Record<string, unknown>)?.continuation
          ? {
              preconditions:
                ((envelope.next as Record<string, unknown>).continuation as Record<string, unknown>)
                  ?.preconditions as ContinuationPrecondition[] | undefined,
            }
          : undefined,
      });

      if (!invResult.ok) {
        deps.appendRunLog(
          formatLogLine("stop", invResult.refusal, "invocation-failed", iteration, cap),
        );
        return {
          banner: "ADVANCE: STOPPED",
          stopCode: invResult.refusal,
          detail: invResult.detail ?? invResult.refusal,
          iterations: iteration - 1,
        };
      }

      // The mapped invocation is the command of record (AC2/AC6): use it
      // verbatim; only append the decision's targets when the mapping
      // produced a bare verb without arguments.
      const mapped = invResult.invocation;
      const invocation = mapped.includes(" ")
        ? mapped
        : [mapped, ...decision.targets].join(" ");

      // Merge authority is never the conductor's (AC9) — belt and braces on
      // top of the command-name refusal.
      const verb = invocation.replace(/^\/skill:/, "").split(" ")[0];
      if (FORBIDDEN_VERBS.has(verb)) {
        deps.appendRunLog(
          formatLogLine("stop", "stop-policy-denied", invocation, iteration, cap),
        );
        return {
          banner: "ADVANCE: STOPPED",
          stopCode: "stop-policy-denied",
          detail: "merge authority is never the conductor's — /audit-pr + human merge",
          iterations: iteration - 1,
        };
      }

      await deps.sendUserMessage(invocation);
      deps.appendRunLog(
        formatLogLine("invoke", decision.reasonCode, invocation, iteration, cap),
      );
      // One-stage-per-invocation wiring: the invoked skill must settle before
      // the next sensor run can see its effect, so the default wiring stops
      // here and the operator re-invokes (or passes --continue for the full loop).
      invoked++;
      if (deps.maxInvokes !== undefined && invoked >= deps.maxInvokes) {
        return {
          banner: "ADVANCE: CONTINUE",
          detail: "one stage advanced — re-invoke advance to continue (or --continue for the full loop)",
          iterations: iteration,
        };
      }
    } else if (decision.kind === "sense") {
      // Sense is bounded: one re-sense without progress stops the loop (AC4).
      consecutiveSenses++;
      if (consecutiveSenses >= 2) {
        deps.appendRunLog(
          formatLogLine("stop", decision.reasonCode, "sense-stale", iteration, cap),
        );
        return {
          banner: "ADVANCE: STOPPED",
          stopCode: decision.reasonCode,
          detail: `sense-stale: no progress after re-sense (${decision.detail ?? ""})`,
          iterations: iteration - 1,
        };
      }
      deps.appendRunLog(
        formatLogLine("sense", decision.reasonCode, "re-sense", iteration, cap),
      );
      continue;
    } else {
      // Stop decision — surface the code and detail to the operator (AC4).
      deps.appendRunLog(
        formatLogLine("stop", decision.reasonCode, "stop", iteration, cap),
      );
      return {
        banner: "ADVANCE: STOPPED",
        stopCode: decision.reasonCode,
        detail: decision.detail ?? "",
        iterations: iteration - 1,
      };
    }
  }

  // ── 6. Cap exceeded (AC8) ───────────────────────────────────────────
  return {
    banner: "ADVANCE: STOPPED",
    stopCode: "stop-failed",
    detail: `stop-failed: iterations cap (${cap}) reached without convergence`,
    iterations: cap,
  };
}
