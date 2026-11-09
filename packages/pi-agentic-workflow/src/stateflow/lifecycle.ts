import type { StateFlowConfig } from "../config/types.js";

/**
 * The Pi-free half of the State Flow episode lifecycle (issue #174).
 *
 * The issue's three rules with sharp edges live here, and nothing else:
 *  - the allowlist gate — a command outside `config.commands` (or a disabled
 *    config) never reaches the backend, not even for a presence probe;
 *  - ownership — the package stops only an episode it started, and an abort
 *    still clears what it owns, so the next `/design-feature` is never stuck
 *    in state-mode (issue §Lifecycle details);
 *  - the missing-backend policies — `noop` proceeds with one warning per
 *    session, `refuse` stops the command before anything is dispatched.
 *
 * The backend is an injected narrow interface; the shipped adapter binds it to
 * Pi's documented API (`getCommands` for detection, extension-command dispatch
 * for the mode switches) and every branch here is reachable from a test
 * without a live session.
 */

/** The narrow backend seam the adapter implements over Pi's real API. */
export interface StateFlowBackend {
  /** True when the backend's session surface is present (its commands are registered). */
  detect(): boolean;
  /** Enter the execution-state mode (the backend's Active). */
  start(): void;
  /** Leave the execution-state mode (the backend's Off). */
  stop(): void;
}

/** What `start` decided for one command dispatch. */
export type StateFlowStart =
  | { status: "none" }
  | { status: "started" }
  | { status: "restarted" }
  | { status: "noop-missing"; warn: boolean }
  | { status: "refuse-missing" };

export interface StateFlowLifecycle {
  /**
   * Consulted inside dispatch, after the router's own guards pass and before
   * the skill prompt is sent. A `"refuse-missing"` outcome means the caller
   * must refuse the dispatch; every other outcome means the dispatch proceeds.
   */
  start(command: string, config: StateFlowConfig): StateFlowStart;
  /**
   * Consulted on the command's settle. Stops and clears a package-owned
   * episode — including on abort — and returns whether one was stopped. An
   * episode the package did not start is never touched.
   */
  settle(aborted: boolean): boolean;
  /** True while a package-owned episode is open (the settings console reads it). */
  ownsEpisode(): boolean;
}

export function createStateFlowLifecycle(backend: StateFlowBackend): StateFlowLifecycle {
  // Package-internal ownership: v1 has no machine-readable read of the
  // backend's mode, so only an episode this lifecycle started is ever stopped
  // (PE-006; the limitation is documented in the package README).
  let owned = false;
  // Said once per session, not once per command: a missing backend is a
  // configuration fact the operator fixes once.
  let backendWarned = false;

  return {
    start(command, config) {
      if (!config.enabled || !config.commands.includes(command)) return { status: "none" };
      if (!backend.detect()) {
        if (config.onBackendMissing === "refuse") return { status: "refuse-missing" };
        const warn = !backendWarned;
        backendWarned = true;
        return { status: "noop-missing", warn };
      }
      // Only one package-owned episode at a time: a dispatch while one is open
      // closes the previous one first (issue §Lifecycle details).
      const restarted = owned;
      if (owned) backend.stop();
      backend.start();
      owned = true;
      return { status: restarted ? "restarted" : "started" };
    },

    settle(_aborted) {
      // Abort or normal settle: both clear (issue §Lifecycle details: an
      // aborted command must not leave the session in state-mode). The
      // parameter is kept in the contract so the wiring cannot "optimize"
      // the abort case away silently.
      if (!owned) return false;
      owned = false;
      backend.stop();
      return true;
    },

    ownsEpisode: () => owned,
  };
}
