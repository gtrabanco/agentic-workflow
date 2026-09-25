/**
 * Conductor types — configuration, sensor result, decision, and loop envelope.
 *
 * The conductor is a deterministic loop: sensor -> decide -> invoke -> repeat.
 * Everything is pure data; no I/O lives in this module.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Per-iteration control knobs for the conductor loop.
 * All values are optional in the config file; the exported DEFAULT
 * supplies the shipped defaults.
 */
export interface ConductorConfig {
  /** Maximum loop iterations before a hard stop. */
  iterationsCap?: number;
  /** Path globs that should not be modified during the loop. */
  sensitivePaths?: readonly string[];
  /** Path globs that require extra scrutiny during the loop. */
  securityPaths?: readonly string[];
  /** Path to the run log file, relative to the project root. */
  runLogPath?: string;
}

/**
 * Shipped default conductor configuration.
 * Deeply frozen so that merges always produce new objects.
 */
export const DEFAULT_CONDUCTOR_CONFIG: ConductorConfig = Object.freeze({
  iterationsCap: 12,
  sensitivePaths: Object.freeze([] as const),
  securityPaths: Object.freeze([] as const),
  runLogPath: ".agentic-workflow/advance-run.log",
});

/**
 * Merge two advance config files on top of the default.
 * Known keys only — unknown keys are silently dropped.
 * Returns a new object each call.
 */
export function mergeAdvanceConfig(
  globalFile: ConductorConfig = {},
  projectFile: ConductorConfig = {},
): ConductorConfig {
  const result: ConductorConfig = {
    iterationsCap: DEFAULT_CONDUCTOR_CONFIG.iterationsCap,
    sensitivePaths: globalFile.sensitivePaths?.slice() ?? [],
    securityPaths: globalFile.securityPaths?.slice() ?? [],
    runLogPath: DEFAULT_CONDUCTOR_CONFIG.runLogPath,
  };

  if (projectFile.iterationsCap !== undefined) {
    (result as Record<string, unknown>).iterationsCap = projectFile.iterationsCap;
  }
  if (projectFile.sensitivePaths !== undefined) {
    (result as Record<string, unknown>).sensitivePaths = projectFile.sensitivePaths.slice();
  }
  if (projectFile.securityPaths !== undefined) {
    (result as Record<string, unknown>).securityPaths = projectFile.securityPaths.slice();
  }
  if (projectFile.runLogPath !== undefined) {
    (result as Record<string, unknown>).runLogPath = projectFile.runLogPath;
  }

  return Object.freeze({
    iterationsCap: result.iterationsCap,
    sensitivePaths: Object.freeze(result.sensitivePaths ?? []),
    securityPaths: Object.freeze(result.securityPaths ?? []),
    runLogPath: result.runLogPath,
  });
}

// ---------------------------------------------------------------------------
// Sensor
// ---------------------------------------------------------------------------

/** Result returned by runSensor — success or refusal. */
export type SensorResult =
  | { ok: true; envelope: EnvelopeLike }
  | { ok: false; refusal: "sensor-degraded"; detail: string };

// ---------------------------------------------------------------------------
// Invocation
// ---------------------------------------------------------------------------

/** Result of mapping a decision to an invocable command string. */
export type InvocationResult =
  | { ok: true; invocation: string; adversarial?: number }
  | {
      ok: false;
      refusal:
        | "no-decision-available"
        | "precondition-uncheckable"
        | "rendering-failed";
      detail?: string;
    };

// ---------------------------------------------------------------------------
// Urgency
// ---------------------------------------------------------------------------

export type UrgencyVerdict = "no-urgent" | "interrupt-now" | "finish-first";

export interface UrgencyResult {
  verdict: UrgencyVerdict;
  /** Issue number present only when verdict is not "no-urgent". */
  issue?: number;
  reason: string;
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------

export interface LoopDeps {
  runSensor: (cwd: string, bin: string) => Promise<SensorResult>;
  decide: (input: {
    envelope: EnvelopeLike;
    lastOutcome: OutcomeLike | null;
    lastOutcomeSourceRevision: string | null;
    policy: PolicyLike;
    reviewLoopCycles?: { spec?: number; plan?: number };
  }) => ActionDecision;
  invocation: (decision: ActionDecision, opts: InvocationOpts) => InvocationResult;
  sendUserMessage: (invocation: string) => Promise<{
    ok: boolean;
    profileSwitched?: { from: string; to: string };
    deferred?: boolean;
  }>;
  profileResume?: "continue" | "restart";
  gitProbe: () => Promise<{ porcelain: string; ahead: number }>;
  appendRunLog: (line: string) => void;
  config: ConductorConfig;
  attended: boolean;
  judgeUrgency: (envelope: EnvelopeLike) => UrgencyResult;
  parkInFlight: () => Promise<void>;
  /** Working directory the sensor runs in (defaults to process.cwd()). */
  cwd?: string;
  /** Runtime binary for the sensor spawn (defaults to "bun"). */
  runtimeBin?: string;
  /** Command names the invocation mapper accepts (defaults to the lane fallback set). */
  commandNames?: Set<string>;
  /** Decision policy forwarded to the decide step (defaults to the lane fallback). */
  policy?: PolicyLike;
  /** Stop after this many successful invocations (1 = one stage per invocation).
   *  Unlimited when omitted (tests drive the full loop). */
  maxInvokes?: number;
}

export interface LoopResult {
  banner: string;
  stopCode?: string;
  detail?: string;
  iterations: number;
}

export interface InvocationOpts {
  commandNames: Set<string>;
  attended: boolean;
  sensitive?: boolean;
  security?: boolean;
  unitScope?: { type: string; id: string };
  continuation?: { preconditions?: ContinuationPrecondition[] };
}

export interface ContinuationPrecondition {
  id: string;
  check: string;
  satisfied: boolean;
}

// ---------------------------------------------------------------------------
// Closeout
// ---------------------------------------------------------------------------

export type CloseoutStatus = "clean" | "partial";

// ---------------------------------------------------------------------------
// Shape aliases — local so the module stays dependency-free
// ---------------------------------------------------------------------------

/** Minimal envelope shape as seen by the conductor. */
export interface EnvelopeLike {
  skill: string;
  state: string;
  summary: string;
  unit:
    | { type: string; id: string | null; issue: number | null; branch: string | null }
    | null;
  phase: { current: string | null; total: number | null; completed: number | null };
  pr: {
    number: number | null;
    url: string | null;
    state: string;
    head_sha: string | null;
    merge_ready: boolean | null;
    ci: string | null;
  };
  gates: {
    verification: string | null;
    review_pending: boolean | null;
    audit_pending: boolean | null;
  };
  findings: {
    fix_now: unknown[];
    issues_filed: number[];
    untriaged: number;
    decisions_recorded: number;
  };
  blockers: unknown[];
  dependencies: { unmet: string[]; build_order: string[] };
  recommendations: { product_audit: boolean; reason: string | null };
  needs_input: { question: string; options: string[] } | null;
  next: {
    recommended: string;
    alternatives: string[];
    tier: string;
    continuation?: {
      argv: string[];
      preconditions: ContinuationPrecondition[];
      convergence: string;
    };
  };
  detail: unknown;
}

/** Minimal outcome shape as seen by the conductor. */
export interface OutcomeLike {
  contract: string;
  version: number;
  skill: string;
  status: string;
  summary: string;
  next: { intent: string; targets: string[] };
  blockers: unknown[];
  questions: unknown[];
  discoveries: unknown[];
  evidence_refs: string[];
}

/** Minimal policy shape as seen by decide. */
export interface PolicyLike {
  allowedIntents: string[];
  forgeWriteAuthorized: boolean;
}

/** Minimal action decision shape as returned by decide. */
export interface ActionDecision {
  kind: "invoke" | "sense" | "stop";
  intent: string;
  targets: string[];
  reasonCode: string;
  evidenceRefs: string[];
  detail: string;
}

/** Minimal workflow snapshot shape. */
export interface WorkflowSnapshotLike {
  contract: string;
  version: number;
  sourceRevision: string;
  repository: {
    branch: string;
    headSha: string;
    dirty: boolean;
  };
  repositoryState:
    | "missing"
    | "draft"
    | "frozen"
    | "contradicted"
    | "needs-input"
    | "unknown";
  unit:
    | {
        kind: "feature" | "fix";
        id: string;
        status: string;
      }
    | null;
  phase: {
    current: string | null;
    total: number | null;
    completed: number | null;
    names: string[];
  };
  provenance: Array<{ field: string; source: string; line: number }>;
  contradictions: Array<{
    field: string;
    source: string;
    line: number;
    detail: string;
  }>;
  unknowns: Array<{ field: string; reason: string }>;
}