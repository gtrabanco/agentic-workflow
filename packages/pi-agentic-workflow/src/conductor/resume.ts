/**
 * Resume entry — the crash reconcile gate before an `advance` run continues
 * (issue #284).
 *
 * The verdict is the sensor's own (`detail.crash_recovery.verdict`, features
 * 03/38): this module never re-derives crash state. It answers one question —
 * "may the loop continue into an invocation?" — with the issue's rule:
 *
 *   CLEAN      → continue; nothing was in flight.
 *   RESUMABLE  → continue from the sensor's own recommendation (ground truth).
 *   AMBIGUOUS  → halt before any invocation; a human decides.
 *
 * A missing, malformed or unreadable verdict fails closed to AMBIGUOUS: an
 * unverifiable resume must not continue silently.
 */

/** The sensor's closed crash-recovery verdict vocabulary. */
export type CrashVerdictKind = "CLEAN" | "RESUMABLE" | "AMBIGUOUS";

const VERDICTS: ReadonlySet<string> = new Set(["CLEAN", "RESUMABLE", "AMBIGUOUS"]);

/** The verdict plus the resume command its RESUMABLE branch named. */
export interface CrashVerdict {
  verdict: CrashVerdictKind;
  resumeCommand: string | null;
}

/** What the loop does next with an interrupted (or forced) resume. */
export interface ResumeDecision {
  action: "proceed" | "halt";
  verdict: CrashVerdictKind | null;
  /** `stop-crash-ambiguous` (halt), `resume-resumable` / `resume-clean` (proceed), or null when no reconcile was due. */
  reasonCode: string | null;
  detail: string;
  resumeCommand: string | null;
  interrupted: { runId: string | null; iteration: number } | null;
}

type EnvelopeDetail = { detail?: unknown };

/**
 * Read the sensor's crash verdict. Anything that is not one of the three
 * published values — including a missing section — reads as AMBIGUOUS.
 */
export function crashVerdict(envelope: unknown): CrashVerdict {
  const detail = (envelope as EnvelopeDetail | null | undefined)?.detail;
  if (typeof detail !== "object" || detail === null) {
    return { verdict: "AMBIGUOUS", resumeCommand: null };
  }
  const crash = (detail as Record<string, unknown>).crash_recovery;
  if (typeof crash !== "object" || crash === null) {
    return { verdict: "AMBIGUOUS", resumeCommand: null };
  }
  const raw = (crash as Record<string, unknown>).verdict;
  if (typeof raw !== "string" || !VERDICTS.has(raw)) {
    return { verdict: "AMBIGUOUS", resumeCommand: null };
  }
  const branches = (crash as Record<string, unknown>).branches;
  let resumeCommand: string | null = null;
  if (Array.isArray(branches)) {
    for (const branch of branches) {
      if (typeof branch !== "object" || branch === null) continue;
      const candidate = (branch as Record<string, unknown>).resume_command;
      if (typeof candidate === "string" && candidate.length > 0) {
        resumeCommand = candidate;
        break;
      }
    }
  }
  return { verdict: raw as CrashVerdictKind, resumeCommand };
}

/**
 * The reconcile gate. `interrupted` is the journal's finding; `forced` is
 * `--resume` (reconcile even when the journal shows no death).
 */
export function decideResume(input: {
  interrupted: { runId: string | null; pid?: number | null; iteration: number; lastInvocation?: string | null } | null;
  forced: boolean;
  verdict: CrashVerdictKind;
  resumeCommand: string | null;
  recommended: string;
}): ResumeDecision {
  const { interrupted, forced, verdict, resumeCommand } = input;
  const interruptedRef = interrupted
    ? { runId: interrupted.runId, iteration: interrupted.iteration }
    : null;

  if (!interrupted && !forced) {
    return { action: "proceed", verdict: null, reasonCode: null, detail: "no reconcile due", resumeCommand: null, interrupted: null };
  }

  const where = interrupted
    ? `interrupted run ${interrupted.runId ?? "unknown"} at iteration ${interrupted.iteration}${
        interrupted.lastInvocation ? ` (last: ${interrupted.lastInvocation})` : ""
      }`
    : "forced reconcile";

  if (verdict === "AMBIGUOUS") {
    return {
      action: "halt",
      verdict,
      reasonCode: "stop-crash-ambiguous",
      detail: `${where}: AMBIGUOUS — a human decides before the run continues`,
      resumeCommand: null,
      interrupted: interruptedRef,
    };
  }

  if (verdict === "RESUMABLE") {
    const command = resumeCommand ?? (input.recommended || null);
    return {
      action: "proceed",
      verdict,
      reasonCode: "resume-resumable",
      detail: `${where}: RESUMABLE — continuing from ground truth${command ? ` (${command})` : ""}`,
      resumeCommand: command,
      interrupted: interruptedRef,
    };
  }

  return {
    action: "proceed",
    verdict,
    reasonCode: "resume-clean",
    detail: `${where}: CLEAN — nothing in flight, continuing`,
    resumeCommand: null,
    interrupted: interruptedRef,
  };
}

/** The `advance` command's flags. One parser, so the wiring cannot drift. */
export interface AdvanceFlags {
  resume: boolean;
  printSupervisor: boolean;
  continueLoop: boolean;
  attended: boolean;
}

/** Parse the `advance` command's argv text. Unknown flags are ignored. */
export function parseAdvanceFlags(args: string): AdvanceFlags {
  const flags = new Set(String(args ?? "").split(/\s+/u).filter(Boolean));
  return {
    resume: flags.has("--resume"),
    printSupervisor: flags.has("--print-supervisor"),
    continueLoop: flags.has("--continue"),
    attended: !flags.has("--fullauto") && !flags.has("--unattended"),
  };
}
