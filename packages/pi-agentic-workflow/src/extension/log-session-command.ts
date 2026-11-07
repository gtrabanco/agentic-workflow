/**
 * log-session-command.ts — `/log-session` as a command, not as a wish
 * (issue #429, S2/S4/S5; obligations O3, O6, O8, O9).
 *
 * Two halves, one module:
 *
 *  - **the door** (`registerLogSessionCommand`) — the handler plans the
 *    invocation through the Pi-free core, which writes the record and resolves
 *    the entry's target, then hands the SAME catalogue command to the router
 *    with the code-composed directive as its arguments. Routing, the busy
 *    guard, the in-flight latch, the first-run hint and the #383 unit
 *    attribution keep working exactly as they shipped; what changes is that the
 *    values the model used to re-derive arrive with the skill.
 *  - **the settled turn** (`createInvocationWatch`) — pi documents
 *    `agent_settled` as the final, notification-only boundary, and the shipped
 *    adapter already uses it for one best-effort operator warning. This is the
 *    second: a session that asked to be logged and left no entry says so, once,
 *    naming the path it waited for. Silence was the defect.
 *
 * **Why the handler binds a catalogue name instead of registering a second
 * one.** Pi keeps duplicate registrations and suffixes the invocation names
 * (`/log-session:1`, `/log-session:2`), so adding a code door beside the prose
 * one would give the same intent to two commands. The catalogue entry stays —
 * the settings console, the configured-route typo report and the model routing
 * all read it — and the dispatch loop hands that one name to this module.
 *
 * Nothing here writes a journal, a fragment or an entry: feature 66's
 * two-writer split and the ownership map's single-writer rule both hold. The
 * handler records, resolves and directs; the prose lands through the writers
 * the skill already names.
 */

import {
  invocationMarkerPath,
  planInvocation,
  reconcileInvocation,
  removeInvocationRecord,
  sessionIdOf,
} from "../log-session-invocation.js";
import type { WriterSpawn } from "../log-session-invocation.js";
import type { CommandRegistrar } from "./factory.js";
import type { DispatchOutcome, InvocationContext, ModelRef, WorkflowCommand } from "../routing/types.js";

/** The command name the code door owns. */
export const LOG_SESSION_COMMAND = "log-session";

/** What the operator reads in the command menu: this door computes, you write. */
export const LOG_SESSION_DESCRIPTION =
  "Log this session: the invocation is recorded and the entry target resolved by code — you write Summary, Decisions and Next.";

/** The core as the door calls it — injectable so a suite owns the clock and the writer run. */
export type PlanInvocation = (input: {
  root: string;
  sessionId?: string;
  now?: () => number;
  bin?: string;
  run?: WriterSpawn;
}) => ReturnType<typeof planInvocation>;

/** The reconciliation the settled turn calls — same seam, same reason. */
export type ReconcileInvocation = (root: string, sessionId?: string) => ReturnType<typeof reconcileInvocation>;

export interface LogSessionCommandDeps<M extends ModelRef = ModelRef> {
  /** The catalogue entry this door stands behind: same name, same skill. */
  readonly command: WorkflowCommand;
  /** The routed dispatch, so the model-routing chain stays the shipped one. */
  dispatch: (command: WorkflowCommand, args: string, ctx: InvocationContext<M>) => Promise<DispatchOutcome>;
  readonly plan?: PlanInvocation;
  readonly now?: () => number;
  readonly bin?: string;
  readonly run?: WriterSpawn;
}

/**
 * Register the door. `registrar` is the package's own narrow view of Pi's
 * `registerCommand`, so the whole handler is driven from a double with no
 * session (the same split that keeps AC3–AC12 testable without one).
 */
export function registerLogSessionCommand<M extends ModelRef = ModelRef>(
  registrar: CommandRegistrar<M>,
  deps: LogSessionCommandDeps<M>,
): void {
  const plan: PlanInvocation = deps.plan ?? planInvocation;

  registrar.registerCommand(LOG_SESSION_COMMAND, {
    description: LOG_SESSION_DESCRIPTION,
    handler: async (args: string, ctx: InvocationContext<M>): Promise<void> => {
      let planned;
      try {
        planned = plan({ root: ctx.cwd, sessionId: ctx.sessionId, now: deps.now, bin: deps.bin, run: deps.run });
      } catch (error) {
        // A run that recorded nothing cannot claim an invocation, and it must not
        // send a directive whose target nobody resolved: the operator hears the
        // reason and no turn starts.
        ctx.notify(
          `/log-session recorded no invocation: ${error instanceof Error ? error.message : String(error)}. Nothing was dispatched.`,
          "error",
        );
        return;
      }

      const note = String(args ?? "").trim();
      const outcome = await deps.dispatch(
        deps.command,
        note === "" ? planned.directive : `${planned.directive}\nOperator note: ${note}`,
        ctx,
      );
      if (outcome.status === "refused") {
        // The refusal is the router's own words and it has already said them; the
        // record goes back with them, because nothing was invoked.
        removeInvocationRecord(ctx.cwd, planned.record.session);
        return;
      }
      ctx.notify(
        `/log-session recorded the invocation at ${projectRelative(ctx.cwd, invocationMarkerPath(ctx.cwd, planned.record.session))}; the entry belongs at ${planned.record.path}.`,
        "info",
      );
    },
  });
}

/** The record path as the operator would name it, not as an absolute filesystem string. */
function projectRelative(root: string, file: string): string {
  const prefix = `${root.replace(/\/+$/u, "")}/`;
  return file.startsWith(prefix) ? file.slice(prefix.length) : file;
}

export interface InvocationWatch {
  /** The notice this settled turn should say, or `null` when there is nothing to say. */
  check(root: string, sessionId?: string): string | null;
}

/**
 * The settled turn's memory. One instance serves one session (the shipped
 * adapter holds exactly one), so a miss is said once — and a delivered entry
 * both clears the record and re-arms the session, because a second invocation
 * is a new fact to report.
 */
export function createInvocationWatch(options: { reconcile?: ReconcileInvocation } = {}): InvocationWatch {
  const reconcile = options.reconcile ?? reconcileInvocation;
  const announced = new Set<string>();
  const keyOf = (root: string, sessionId?: string): string => [root, sessionIdOf(sessionId)].join("|");

  return {
    check(root, sessionId) {
      const result = reconcile(root, sessionId);
      if (result.status === "landed") {
        // Delivered: the record is gone and the session may be asked again.
        announced.delete(keyOf(root, sessionId));
        return null;
      }
      if (result.status === "none") {
        announced.delete(keyOf(root, sessionId));
        return null;
      }
      const key = keyOf(root, sessionId);
      if (announced.has(key)) return null;
      announced.add(key);
      return result.notice;
    },
  };
}
