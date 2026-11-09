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

import { DEFAULT_CONDUCTOR_CONFIG } from "./types.js";
import type {
  CloseoutStatus,
  ContinuationPrecondition,
  InterruptedRunLike,
  LoopDeps,
  LoopResult,
} from "./types.js";
import { checkCloseout } from "./closeout.js";
import { formatJournalRow } from "./journal.js";
import { crashVerdict, decideResume } from "./resume.js";

/**
 * The one shipped default, owned by `types.ts` (deeply frozen so that merges
 * always produce new objects) and re-exported here so this module's surface is
 * unchanged. `loop.ts` used to declare a SECOND copy of the same object literal:
 * the package then published two identically-named constants —
 * `DEFAULT_CONDUCTOR_CONFIG` and its `DEFAULT_CONDUCTOR_CONFIG_LOOP` alias —
 * which could silently diverge, and the loop's own fallback was mutable while
 * the published one was frozen.
 */
export { DEFAULT_CONDUCTOR_CONFIG };

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
// Run boundary + main loop
// ---------------------------------------------------------------------------

/**
 * Run the conductor loop until convergence, stop, cap, or park, wrapped in the
 * run boundary the resume entry reads (issue #284):
 *
 *   run/start  <run-id> pid=<pid>
 *   …iteration rows…
 *   run/stop   <stop-code|continue>
 *
 * A process that dies (SIGKILL, OOM, redeploy) writes no `run/stop` — that
 * missing row is exactly what the operator supervisor detects and what
 * `advance --resume` reconciles. All I/O stays injected; the loop is
 * deterministic.
 */
export async function runConductorLoop(deps: LoopDeps): Promise<LoopResult> {
  const config = deps.config ?? DEFAULT_CONDUCTOR_CONFIG;
  const cap = config.iterationsCap ?? 12;
  const meta = deps.runMeta?.() ?? { id: `r-${process.pid}-${Date.now()}`, pid: process.pid };
  deps.appendRunLog(formatJournalRow("run", "start", `${meta.id} pid=${meta.pid}`, 0, cap));
  const result = await runLoopBody(deps, config, cap);
  deps.appendRunLog(
    formatJournalRow("run", "stop", result.stopCode ?? "continue", result.iterations, cap),
  );
  return result;
}

/** The loop proper; the exported wrapper above owns the run boundary. */
async function runLoopBody(deps: LoopDeps, config: NonNullable<LoopDeps["config"]>, cap: number): Promise<LoopResult> {
  const commandNames = deps.commandNames ?? FALLBACK_COMMANDS;
  const cwd = deps.cwd ?? process.cwd();
  const bin = deps.runtimeBin ?? "bun";
  let consecutivePartials = 0;
  let consecutiveSenses = 0;
  let consecutiveDeferred = 0;
  let invoked = 0;

  // The resume entry (issue #284): an interrupted journal, or `--resume`,
  // arms the reconcile gate on the first iteration. The journal is the hint;
  // the sensor's crash verdict is the ground truth the gate reads.
  const interrupted: InterruptedRunLike | null = deps.resumePreflight
    ? await deps.resumePreflight()
    : null;
  const reconcileDue = deps.resume === true || interrupted !== null;

  for (let iteration = 1; iteration <= cap; iteration++) {
    // ── 1. Sensor ───────────────────────────────────────────────────────
    const sensorResult = await deps.runSensor(cwd, bin);

    if (!sensorResult.ok) {
      deps.appendRunLog(
        formatJournalRow("stop", sensorResult.refusal, "sensor-refused", iteration, cap),
      );
      return {
        banner: "ADVANCE: STOPPED",
        stopCode: sensorResult.refusal,
        detail: `${sensorResult.refusal}: ${sensorResult.detail}`,
        iterations: iteration - 1,
      };
    }

    const envelope = sensorResult.envelope;

    // ── 2. Crash reconcile (issue #284) ─────────────────────────────────
    // Resume continues ONLY on CLEAN/RESUMABLE; AMBIGUOUS halts before any
    // invocation and records the stop. A missing verdict is AMBIGUOUS.
    if (iteration === 1 && reconcileDue) {
      const verdict = crashVerdict(envelope);
      const decision = decideResume({
        interrupted,
        forced: deps.resume === true,
        verdict: verdict.verdict,
        resumeCommand: verdict.resumeCommand,
        recommended: String((envelope.next as Record<string, unknown>)?.recommended ?? ""),
      });
      if (decision.action === "halt") {
        deps.appendRunLog(formatJournalRow("resume", "halted", decision.verdict ?? "AMBIGUOUS", 0, cap));
        return {
          banner: "ADVANCE: STOPPED",
          stopCode: "stop-crash-ambiguous",
          detail: decision.detail,
          iterations: 0,
        };
      }
      if (interrupted) {
        const last = interrupted.lastInvocation ? ` last=${interrupted.lastInvocation}` : "";
        deps.appendRunLog(
          formatJournalRow(
            "resume",
            "detected",
            `${interrupted.runId ?? "unknown"} iteration=${interrupted.iteration}${last}`,
            interrupted.iteration,
            cap,
          ),
        );
      }
      deps.appendRunLog(
        formatJournalRow(
          "resume",
          `verdict:${decision.verdict ?? "AMBIGUOUS"}`,
          decision.resumeCommand ?? decision.detail,
          iteration - 1,
          cap,
        ),
      );
    }

    // ── 3. Banner pre-check: COMPLETE or BLOCKED before any decision (AC8) ──
    // COMPLETE: nothing startable — no recommended action and no blockers
    const nextRecommended = (envelope.next as Record<string, unknown>)?.recommended;
    const blockers = (envelope.blockers as Array<Record<string, unknown>>) ?? [];
    if (!nextRecommended && blockers.length === 0) {
      deps.appendRunLog(
        formatJournalRow("stop", "stop-nothing-startable", "nothing-startable", iteration, cap),
      );
      return {
        banner: "ADVANCE: COMPLETE",
        stopCode: "stop-nothing-startable",
        detail: "nothing startable — no recommended action and no blockers",
        iterations: 0,
      };
    }

    // BLOCKED: blockers present with unblock information from the envelope
    if (blockers.length > 0) {
      const unblockInfo = blockers
        .map((b) => `${(b.kind as string) ?? "unknown"}: ${(b.detail as string) ?? ""}`)
        .join("; ");
      deps.appendRunLog(
        formatJournalRow("stop", "stop-blocked", "blocked", iteration, cap),
      );
      return {
        banner: "ADVANCE: BLOCKED",
        stopCode: "stop-blocked",
        detail: `blocked — ${unblockInfo}`,
        iterations: 0,
      };
    }

    // ── 4. Urgency judge (deterministic; AC5) ───────────────────────────
    const urgency = deps.judgeUrgency(envelope);
    if (urgency.verdict === "interrupt-now") {
      // Park the in-flight unit, then let the next iteration's sensor route
      // to the urgent issue (the sensor's priority queue already ranks it).
      await deps.parkInFlight();
      deps.appendRunLog(
        formatJournalRow("urgent", "INTERRUPT_NOW", `issue ${urgency.issue ?? "?"}`, iteration, cap),
      );
      continue;
    }
    // finish-first (incl. fix-next head-of-line and the fail-safe default):
    // proceed normally — the sensor ranks the urgent fix for a later iteration.

    // ── 5. Git probe & closeout (AC7) ───────────────────────────────────
    const gitStatus = await deps.gitProbe();
    const closeout: CloseoutStatus = checkCloseout(gitStatus.porcelain, gitStatus.ahead);

    if (closeout === "partial") {
      consecutivePartials++;
      if (consecutivePartials >= 3) {
        deps.appendRunLog(
          formatJournalRow("stop", "parked", "consecutive-partials", iteration, cap),
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

    // ── 6. Decide ───────────────────────────────────────────────────────
    const decision = deps.decide({
      envelope,
      lastOutcome: null,
      lastOutcomeSourceRevision: null,
      policy: deps.policy ?? { allowedIntents: [...FALLBACK_COMMANDS], forgeWriteAuthorized: true },
    });

    // ── 7. Handle decision ──────────────────────────────────────────────
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
          formatJournalRow("stop", invResult.refusal, "invocation-failed", iteration, cap),
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
          formatJournalRow("stop", "stop-policy-denied", invocation, iteration, cap),
        );
        return {
          banner: "ADVANCE: STOPPED",
          stopCode: "stop-policy-denied",
          detail: "merge authority is never the conductor's — /audit-pr + human merge",
          iterations: iteration - 1,
        };
      }

      const sendResult = await deps.sendUserMessage(invocation);
      if (sendResult.ok === false) {
        deps.appendRunLog(formatJournalRow("stop", "stop-dispatch-refused", invocation, iteration, cap));
        return {
          banner: "ADVANCE: STOPPED",
          stopCode: "stop-dispatch-refused",
          detail: "the stage dispatch was refused (the router already explained why)",
          iterations: iteration - 1,
        };
      }
      if (sendResult.deferred === true) {
        // AC10 restart: the routing recorded the demotion instead of sending; re-run
        // the iteration so the stage is decided and served under the fallback profile.
        deps.appendRunLog(formatJournalRow("switch", `${sendResult.profileSwitched?.from ?? "?"}->${sendResult.profileSwitched?.to ?? "?"}`, invocation, iteration, cap));
        consecutiveDeferred++;
        if (consecutiveDeferred >= 2) {
          deps.appendRunLog(formatJournalRow("stop", "stop-profile-switch-loop", "deferred-twice", iteration, cap));
          return { banner: "ADVANCE: STOPPED", stopCode: "stop-profile-switch-loop", detail: "profile switch deferred twice without progress", iterations: iteration - 1 };
        }
        continue; // do NOT increment `invoked`
      }
      consecutiveDeferred = 0;
      deps.appendRunLog(
        formatJournalRow("invoke", decision.reasonCode, invocation, iteration, cap),
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
          formatJournalRow("stop", decision.reasonCode, "sense-stale", iteration, cap),
        );
        return {
          banner: "ADVANCE: STOPPED",
          stopCode: decision.reasonCode,
          detail: `sense-stale: no progress after re-sense (${decision.detail ?? ""})`,
          iterations: iteration - 1,
        };
      }
      deps.appendRunLog(
        formatJournalRow("sense", decision.reasonCode, "re-sense", iteration, cap),
      );
      continue;
    } else {
      // Stop decision — surface the code and detail to the operator (AC4).
      deps.appendRunLog(
        formatJournalRow("stop", decision.reasonCode, "stop", iteration, cap),
      );
      return {
        banner: "ADVANCE: STOPPED",
        stopCode: decision.reasonCode,
        detail: decision.detail ?? "",
        iterations: iteration - 1,
      };
    }
  }

  // ── 8. Cap exceeded (AC8) ───────────────────────────────────────────
  return {
    banner: "ADVANCE: STOPPED",
    stopCode: "stop-failed",
    detail: `stop-failed: iterations cap (${cap}) reached without convergence`,
    iterations: cap,
  };
}
