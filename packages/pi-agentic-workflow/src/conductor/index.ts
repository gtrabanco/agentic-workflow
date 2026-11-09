/**
 * Conductor module > deterministic sensor → decide → invoke loop.
 *
 * Re-exports the public surface so consumers can import everything from one place.
 *
 * Import surface: `../dist/conductor/index.js`
 */

export {
  DEFAULT_CONDUCTOR_CONFIG,
  mergeAdvanceConfig,
} from "./types.js";
export type {
  ConductorConfig,
  EnvelopeLike,
  OutcomeLike,
  PolicyLike,
  ActionDecision,
  LoopDeps,
  LoopResult,
  InvocationOpts,
  InvocationResult,
  SensorResult,
  UrgencyResult,
  CloseoutStatus,
  ContinuationPrecondition,
  InterruptedRunLike,
  WorkflowSnapshotLike,
} from "./types.js";

export { runSensor } from "./sensor.js";
export { snapshotFromEnvelope } from "./snapshot.js";
export { decideFromEnvelope } from "./decide.js";
export { invocationFromDecision } from "./invoke.js";
export { judgeUrgency } from "./urgency.js";
export { checkCloseout } from "./closeout.js";
export { runConductorLoop, DEFAULT_CONDUCTOR_CONFIG as DEFAULT_CONDUCTOR_CONFIG_LOOP } from "./loop.js";

// Issue #284 — unattended durability: the run journal, the resume entry and
// the operator supervisor template.
export {
  formatJournalDate,
  formatJournalRow,
  parseJournalRow,
  readJournal,
  interruptedRun,
} from "./journal.js";
export type { JournalRow, InterruptedRun } from "./journal.js";
export { crashVerdict, decideResume, parseAdvanceFlags } from "./resume.js";
export type { AdvanceFlags, CrashVerdict, CrashVerdictKind, ResumeDecision } from "./resume.js";
export {
  renderSupervisorScript,
  SUPERVISOR_TEMPLATE,
  SUPERVISOR_HUMAN_STOP_CODES,
} from "./supervisor.js";
export type { SupervisorSpec } from "./supervisor.js";