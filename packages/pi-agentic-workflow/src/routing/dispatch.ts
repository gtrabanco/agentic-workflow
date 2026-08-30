import { effectiveRoute } from "../config/merge.js";
import { parseModelReference } from "../config/schema.js";
import type { LoadedConfig } from "../config/load.js";
import type { ThinkingLevel } from "../config/types.js";
import type {
  DispatchOutcome,
  ExtensionSurface,
  InvocationContext,
  ModelRef,
  RefusalReason,
  WorkflowCommand,
} from "./types.js";
import { modelRefKey } from "./types.js";

/**
 * Routed dispatch — the `idle → routing → dispatched → settled → restored`
 * machine (SPEC "Command surface (api)" steps 1–6).
 *
 * Everything it needs from the session arrives as an injected surface, so every
 * branch is reachable from a test without a live Pi session, and the shipped
 * adapter can only ever use calls Pi documents. `M` is Pi's opaque `Model` type
 * as far as this module is concerned: it stores references and hands them back,
 * never builds one.
 *
 * The three rules with the sharpest edges:
 *  - guards run before any skill expansion, so a busy agent, an in-flight routed
 *    turn, or a broken configuration never starts a turn and never changes a
 *    model (D-P15, D-E5, AC12);
 *  - restore never overwrites what the operator chose during the routed turn: a
 *    select event that is not our own marks that part of the session untouchable
 *    (D-P14, AC7);
 *  - a route that cannot be honoured follows `onUnavailableRoute`, and the
 *    default `stop` refuses before anything is applied (AC9, D-P13).
 */

/** One routed turn in flight: what to put back, and what the operator seized. */
interface PendingTurn<M extends ModelRef = ModelRef> {
  command: string;
  /** Session state before anything was applied — what `settle()` puts back. */
  snapshot: { model: M | undefined; thinking: ThinkingLevel };
  /** What this turn actually changed. `undefined` means "not ours to restore". */
  applied: {
    model: M | undefined;
    thinking: ThinkingLevel | undefined;
    /** The level Pi derived from our own model switch — ours, not the operator's. */
    modelThinking?: ThinkingLevel;
  };
  userChangedModel: boolean;
  userChangedThinking: boolean;
  /** The level the operator picked mid-turn, if any. It survives the restore. */
  operatorThinking?: ThinkingLevel;
}

export interface RouterDeps<M extends ModelRef = ModelRef> {
  /** Pi's API is session-bound, so the surface is resolved per call. */
  surface: (ctx: InvocationContext<M>) => ExtensionSurface<M>;
  /** Fresh read per dispatch: project trust and file validity change between commands. */
  loadConfig: (ctx: InvocationContext<M>) => LoadedConfig;
  hint: { pending(): boolean; acknowledge(now?: string): boolean };
  /** Slash name of the settings console, quoted in every refusal. */
  settingsCommand: string;
  /** Command names that actually exist — a route for anything else is a typo. */
  knownCommands: ReadonlySet<string>;
}

export interface Router<M extends ModelRef = ModelRef> {
  dispatch(command: WorkflowCommand, args: string, ctx: InvocationContext<M>): Promise<DispatchOutcome>;
  /** Pi `model_select` — distinguishes our own switch from the operator's. */
  noteModelSelect(model: M): void;
  /** Pi `thinking_level_select` — same distinction for the thinking level. */
  noteThinkingLevelSelect(level: ThinkingLevel): void;
  /** Pi `agent_settled` — restores whatever this turn still owns. */
  settle(ctx: InvocationContext<M>): Promise<void>;
  /** True while a routed turn owns the session. The console shows and clears it. */
  inFlight(): boolean;
  /**
   * Undo a routed turn the operator can see will never settle, putting the session
   * back exactly as `settle()` would. Returns false when nothing was in flight.
   */
  undoInFlight(ctx: InvocationContext<M>): Promise<boolean>;
}

/**
 * Put a routed turn's session back (AC8). Shared by `settle()` and the console's
 * release so the two can never disagree about what "restore" means; `why` is only
 * the operator's word for what happened to the turn.
 */
async function restore<M extends ModelRef>(
  turn: PendingTurn<M>,
  session: ExtensionSurface<M>,
  ctx: InvocationContext<M>,
  why: string,
): Promise<void> {
  if (turn.userChangedModel) {
    if (turn.applied.model || turn.applied.thinking) {
      ctx.notify(`/${turn.command}: ${why}; leaving the model you chose in place.`, "info");
    }
    return;
  }
  const touched = Boolean(turn.applied.model || turn.applied.thinking);
  if (turn.applied.model) {
    if (turn.snapshot.model) await session.setModel(turn.snapshot.model);
    else ctx.notify(`/${turn.command} switched a session that had no model; nothing to restore.`, "warning");
  }
  if (!touched) return;
  // Thinking last, and always: selecting a model re-derives the level inside Pi, so
  // restoring the model alone leaves a model-only route with the operator's level
  // moved (AC8 asks for the session to equal its start). An operator who moved the
  // level themselves keeps it — including over the model restore's side effect.
  const wanted = turn.userChangedThinking && turn.operatorThinking ? turn.operatorThinking : turn.snapshot.thinking;
  if (session.getThinkingLevel() !== wanted) session.setThinkingLevel(wanted);
}

export function createRouter<M extends ModelRef = ModelRef>({
  surface,
  loadConfig,
  hint,
  settingsCommand,
  knownCommands,
}: RouterDeps<M>): Router<M> {
  let pending: PendingTurn<M> | undefined;
  // Reported once per session: an operator who ignores it once does not need it
  // on every command, and a route that matches nothing must not fail silently.
  let unknownRoutesReported = false;

  const refuse = (ctx: InvocationContext<M>, reason: RefusalReason, message: string): DispatchOutcome => {
    ctx.notify(message, "error");
    return { status: "refused", reason, message };
  };

  const configureHint = `Configure routes with /${settingsCommand} or the pi-agentic-workflow.json files.`;

  return {
    noteModelSelect(model: M): void {
      if (!pending) return;
      const applied = pending.applied.model;
      // Pi fires `model_select` for our own switch too. Anything else is the
      // operator taking the model, and then we back off entirely — restoring on
      // top of their choice would fight the session.
      if (applied && modelRefKey(applied) === modelRefKey(model)) return;
      pending.userChangedModel = true;
    },

    noteThinkingLevelSelect(level: ThinkingLevel): void {
      if (!pending) return;
      // A level we just applied ourselves is not an operator change. A model
      // switch counts as "ours" too: Pi re-derives thinking inside `setModel`,
      // and this router performs that switch.
      if (pending.applied.thinking === level || pending.applied.modelThinking === level) return;
      pending.userChangedThinking = true;
      pending.operatorThinking = level;
    },

    inFlight: () => pending !== undefined,

    async undoInFlight(ctx): Promise<boolean> {
      const turn = pending;
      if (!turn) return false;
      pending = undefined;
      await restore(turn, surface(ctx), ctx, `undo: nothing was dispatched by /${turn.command}`);
      return true;
    },

    async settle(ctx): Promise<void> {
      const turn = pending;
      if (!turn) return;
      // Cleared first: the restore fires its own select events, and a turn that is
      // already over must not read them as operator changes.
      pending = undefined;
      await restore(turn, surface(ctx), ctx, "finished");
    },

    async dispatch(command: WorkflowCommand, args: string, ctx): Promise<DispatchOutcome> {
      if (pending) {
        // Refuse even when `ctx.isIdle()` reads true: idleness says the agent loop
        // is quiet, not that the routed turn is over, and guessing here is how a
        // session gets restored mid-turn. Pi starts a routed turn inside an action
        // that swallows failures and `prompt()` can throw before the loop runs, so a
        // latch with no turn behind it is real — and the operator releases it through
        // the console (`undoInFlight`), which is why the refusal points there (N-4).
        return refuse(
          ctx,
          "routed-turn-in-flight",
          `/${command.name} refused: /${pending.command} is still routed. Wait for it to settle, or undo it with /${settingsCommand}.`,
        );
      }
      if (!ctx.isIdle()) {
        return refuse(
          ctx,
          "busy",
          `/${command.name} refused: the agent is busy, and routing changes the session model. Run it when the agent is idle.`,
        );
      }

      const loaded = loadConfig(ctx);
      if (!loaded.ok) {
        const detail = loaded.problems
          .map((problem) => `${problem.scope} config, ${problem.path}: ${problem.message}`)
          .join(" | ");
        return refuse(
          ctx,
          "invalid-config",
          `/${command.name} refused: invalid configuration (${detail}). Nothing was dispatched and no model was changed.`,
        );
      }

      if (!unknownRoutesReported) {
        unknownRoutesReported = true;
        const typos = Object.keys(loaded.config.commands).filter((name) => !knownCommands.has(name));
        if (typos.length > 0) {
          ctx.notify(
            `/${command.name}: these configured routes match no command and do nothing: ${typos.join(", ")}. Fix the spelling or remove them with /${settingsCommand}.`,
            "warning",
          );
        }
      }

      const session = surface(ctx);
      const route = effectiveRoute(loaded.config, command.name);
      let target: M | undefined;

      if (route.model !== "inherit") {
        const reference = parseModelReference(route.model);
        const found = reference ? ctx.find(reference.provider, reference.id) : undefined;
        const blocker = !found
          ? "is not in the model registry"
          : !ctx.hasConfiguredAuth(found)
            ? "has no configured credentials"
            : undefined;

        if (blocker) {
          if (loaded.config.onUnavailableRoute !== "inherit") {
            return refuse(
              ctx,
              "unavailable-route",
              `/${command.name} stopped: the configured model ${route.model} ${blocker}. ${configureHint}`,
            );
          }
          ctx.notify(
            `/${command.name}: ${route.model} ${blocker}, so it runs on the current session model. ${configureHint}`,
            "warning",
          );
        } else {
          target = found;
        }
      }

      const snapshot = { model: ctx.model, thinking: session.getThinkingLevel() };
      const applied: PendingTurn<M>["applied"] = { model: undefined, thinking: undefined };

      if (target) {
        const selected = await session.setModel(target);
        if (!selected) {
          if (loaded.config.onUnavailableRoute !== "inherit") {
            return refuse(
              ctx,
              "unavailable-route",
              `/${command.name} stopped: ${route.model} could not be selected. ${configureHint}`,
            );
          }
          ctx.notify(
            `/${command.name}: ${route.model} could not be selected, so it runs on the current session model. ${configureHint}`,
            "warning",
          );
        } else {
          applied.model = target;
          // Pi re-derives thinking inside `setModel`; whatever level the session
          // holds now came from us, not from the operator.
          applied.modelThinking = session.getThinkingLevel();
        }
      }
      if (route.thinking !== "inherit") {
        session.setThinkingLevel(route.thinking);
        // The *effective* level, never the requested one: Pi clamps a level the model
        // cannot run (`_modelSupportsThinking` → `clampThinkingLevel`) and announces
        // that one a microtask later. Bookkeeping the request made our own clamped
        // write read as an operator move, so the restore preserved the clamp instead
        // of the operator's level (N-3).
        applied.thinking = session.getThinkingLevel() ?? route.thinking;
      }

      let hintShown = false;
      if (hint.pending()) {
        hintShown = true;
        hint.acknowledge();
        ctx.notify(
          `/${command.name} is running. Per-command models are optional: configure them with /${settingsCommand} or the pi-agentic-workflow.json files. This hint appears once.`,
          "info",
        );
      }

      if (applied.model || applied.thinking) {
        pending = { command: command.name, snapshot, applied, userChangedModel: false, userChangedThinking: false };
      }

      // Pi expands `/skill:<x>` by the skill's frontmatter `name:`, and passes an
      // unknown key through as literal text — so the name is the only correct
      // wire value. The bundled directory (`command.skill`) is not it: it happens
      // to match today and would silently stop expanding if a skill ever renamed.
      const invocation = args === "" ? `/skill:${command.name}` : `/skill:${command.name} ${args}`;
      // The send is where Pi's own path can throw first (`prompt()` refuses while
      // compaction is in progress, with no model, or without credentials — before
      // the agent loop ever runs). That throw is proof the turn never started, so
      // the routing applied a moment ago is undone here and now: leaving it would
      // wedge the latch behind a refusal that names no cause (N-4).
      try {
        session.sendUserMessage(invocation, { expandPromptTemplates: true });
      } catch (error) {
        pending = undefined;
        if (applied.model || applied.thinking) {
          await restore(
            { command: command.name, snapshot, applied, userChangedModel: false, userChangedThinking: false },
            session,
            ctx,
            `dispatch failed (${(error as Error).message}); the session was put back`,
          );
        }
        return refuse(
          ctx,
          "dispatch-failed",
          `/${command.name} was not dispatched: ${(error as Error).message}. Nothing was sent, and the session model was put back.`,
        );
      }

      return { status: "dispatched", routed: Boolean(applied.model || applied.thinking), hintShown };
    },
  };
}
