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
  WorkflowSnapshotLike,
} from "./types.js";

export { runSensor } from "./sensor.js";
export { snapshotFromEnvelope } from "./snapshot.js";
export { decideFromEnvelope } from "./decide.js";
export { invocationFromDecision } from "./invoke.js";
export { judgeUrgency } from "./urgency.js";
export { checkCloseout } from "./closeout.js";
export { runConductorLoop, DEFAULT_CONDUCTOR_CONFIG as DEFAULT_CONDUCTOR_CONFIG_LOOP } from "./loop.js";