import { resolveProfileChain, effectiveProfileOrder } from "../config/profiles.js";
import type { ProfileCandidate } from "../config/types.js";
import { parseModelReference } from "../config/schema.js";
import type { LoadedConfig } from "../config/load.js";
import type { SettlePolicy, ThinkingLevel } from "../config/types.js";
import type {
  DispatchOutcome,
  ExtensionSurface,
  InvocationContext,
  ModelRef,
  RefusalReason,
  WorkflowCommand,
} from "./types.js";
import { modelRefKey } from "./types.js";
import type { ProfileStateStore } from "./state.js";

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
  /** What `settle()` does: put the snapshot back, or leave the routed model in place. */
  settlePolicy: SettlePolicy;
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
  /** Profile demotion state store (P4, feature 63). */
  profileState?: ProfileStateStore;
  /** Wall-clock now (P4). Default: Date.now. */
  now?: () => number;
}

export interface Router<M extends ModelRef = ModelRef> {
  dispatch(command: WorkflowCommand, args: string, ctx: InvocationContext<M>, opts?: { onProfileSwitch?: "continue" | "restart" }): Promise<DispatchOutcome>;
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
  profileState,
  now,
}: RouterDeps<M>): Router<M> {
  let pending: PendingTurn<M> | undefined;
  // Reported once per session: an operator who ignores it once does not need it
  // on every command, and a route that matches nothing must not fail silently.
  let unknownRoutesReported = false;

  // P4: in-memory no-op for profileState when not provided.
  const ps = profileState ?? {
    demotion: (): undefined => undefined,
    record: (): true => true,
    clear: (): true => true,
  };
  const nowFn = now ?? Date.now;

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
      // `keep`: leave the routed model and thinking level in the open chat window,
      // so a follow-up edit or question keeps running on the model that planned it.
      // The operator's own mid-turn choice is still untouched (nothing is restored,
      // so it cannot be overwritten). Only "restore" puts the snapshot back (AC8).
      if (turn.settlePolicy === "keep") return;
      await restore(turn, surface(ctx), ctx, "finished");
    },

    async dispatch(command: WorkflowCommand, args: string, ctx, opts): Promise<DispatchOutcome> {
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

      // -----------------------------------------------------------------
      // P4: Profile-chain probing (feature 63, AC7–AC9)
      // -----------------------------------------------------------------
      const fallbackCfg = loaded.config.profileFallback;

      // Demotion window — only when applyTo is "flow".
      const chainOpts = { providerAvailable: (provider: string) => {
        const available = ctx.availableModels;
        return available && available().some((m) => m.provider === provider);
      } };
      let demotion = fallbackCfg.applyTo === "flow" ? ps.demotion() : undefined;
      if (demotion) {
        const age = nowFn() - Date.parse(demotion.at);
        const windowMs = fallbackCfg.retryAfterSeconds * 1000;
        if (!Number.isFinite(age) || age >= windowMs) {
          ps.clear();
          demotion = undefined;
        }
      }

      const order = effectiveProfileOrder(loaded.config, chainOpts);
      const startIndex = demotion ? order.indexOf(demotion.profile) : -1;

      let demotionStart = startIndex;
      if (demotion && demotionStart < 0) {
        // The demoted profile is no longer in the order — drop the stale record.
        ps.clear();
        demotion = undefined;
        demotionStart = -1;
      }

      const candidates = resolveProfileChain(loaded.config, command.name, chainOpts);
      const considered = demotionStart > 0 ? candidates.filter((c) => order.indexOf(c.profile) >= demotionStart) : candidates;

      // Find the preferred candidate (first with a declared model).
      const preferred = considered.find((c) => c.declared.model);

      // Model resolution: first candidate with a declared, usable model.
      let chosen: ProfileCandidate | undefined;
      let target: M | undefined;
      /** The reference string behind `target`, for the select-failure message. */
      let chosenRef: string | undefined;
      const reasons: string[] = [];

      for (const c of considered) {
        if (!c.declared.model) continue;
        if (c.route.model === "inherit") {
          chosen = c;
          break;
        }
        // Probe c.route.model (string or chain) — reuse the existing probe shape.
        const refs = typeof c.route.model === "string" ? [c.route.model] : c.route.model;
        for (const reference of refs) {
          const parsed = parseModelReference(reference);
          const found = parsed ? ctx.find(parsed.provider, parsed.id) : undefined;
          if (!found) {
            reasons.push(`${reference} is not in the model registry`);
            continue;
          }
          if (!ctx.hasConfiguredAuth(found)) {
            reasons.push(`${reference} has no configured credentials`);
            continue;
          }
          // First usable entry for this candidate.
          chosen = c;
          target = found;
          chosenRef = reference;
          break;
        }
        if (chosen) break;
        // Every entry in this candidate's chain was unusable.
        const tried = refs.join(", ");
        reasons.push(`${c.profile}: all models in [${tried}] unavailable`);
      }

      // Thinking: the first candidate that declares thinking, else "inherit".
      const thinkingCandidate = considered.find((c) => c.declared.thinking);
      const routeThinking = thinkingCandidate?.route.thinking ?? "inherit";

      // Handle no chosen candidate — fallback to onUnavailableRoute.
      if (!chosen && preferred) {
        // Build the chain detail for the notification, matching the old shape.
        const triedRefs: string[] = [];
        const detailParts: string[] = [];
        for (const c of considered) {
          if (!c.declared.model) continue;
          if (c.route.model === "inherit") continue;
          const refs = typeof c.route.model === "string" ? [c.route.model] : c.route.model;
          triedRefs.push(...refs);
          // Collect the first skip reason per entry for the detail.
          const entryReasons = reasons.filter((r) => refs.some((ref) => r.startsWith(ref)));
          detailParts.push(...entryReasons);
        }
        const tried = triedRefs.join(", ");
        const detail = detailParts.join("; ");

        if (loaded.config.onUnavailableRoute !== "inherit") {
          return refuse(
            ctx,
            "unavailable-route",
            `/${command.name} stopped: the configured model chain ${tried} is unavailable (${detail}). ${configureHint}`,
          );
        }
        ctx.notify(
          `/${command.name}: the configured model chain ${tried} is unavailable (${detail}), so it runs on the current session model. ${configureHint}`,
          "warning",
        );
      }

      let profileSwitched: { from: string; to: string } | undefined;
      if (chosen && preferred && chosen.profile !== preferred.profile) {
        profileSwitched = { from: preferred.profile, to: chosen.profile };
        if (fallbackCfg.applyTo === "flow") ps.record(chosen.profile);
      }

      // AC10 restart: when onProfileSwitch === "restart" AND applyTo === "flow",
      // record the demotion but do NOT apply the model or send — return deferred
      // so the loop re-runs the iteration under the fallback profile.
      if (
        opts?.onProfileSwitch === "restart"
        && fallbackCfg.applyTo === "flow"
        && profileSwitched
      ) {
        return {
          status: "dispatched",
          routed: false,
          hintShown: false,
          profileSwitched,
          deferred: true,
        };
      }

      // -----------------------------------------------------------------
      // Legacy: model application (target + thinking)
      // -----------------------------------------------------------------
      const snapshot = { model: ctx.model, thinking: session.getThinkingLevel() };
      const applied: PendingTurn<M>["applied"] = { model: undefined, thinking: undefined };

      if (target) {
        const selected = await session.setModel(target);
        if (!selected) {
          if (loaded.config.onUnavailableRoute !== "inherit") {
            return refuse(
              ctx,
              "unavailable-route",
              `/${command.name} stopped: ${chosenRef} could not be selected. ${configureHint}`,
            );
          }
          ctx.notify(
            `/${command.name}: ${chosenRef} could not be selected, so it runs on the current session model. ${configureHint}`,
            "warning",
          );
          // A failed select must not clear the demotion.
          // Demotion is cleared only by expiry (top of dispatch), manual rotation/clear, or the console.
        } else {
          applied.model = target;
          applied.modelThinking = session.getThinkingLevel();
        }
      }
      if (routeThinking !== "inherit") {
        session.setThinkingLevel(routeThinking);
        // The *effective* level, never the requested one: Pi clamps a level the model
        // cannot run (`_modelSupportsThinking` → `clampThinkingLevel`) and announces
        // that one a microtask later. Bookkeeping the request made our own clamped
        // write read as an operator move, so the restore preserved the clamp instead
        // of the operator's level (N-3).
        applied.thinking = session.getThinkingLevel() ?? routeThinking;
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
        pending = {
          command: command.name,
          snapshot,
          applied,
          settlePolicy: loaded.config.onSettle,
          userChangedModel: false,
          userChangedThinking: false,
        };
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
        const rolledBack = Boolean(applied.model || applied.thinking);
        if (rolledBack) {
          await restore(
            {
              command: command.name,
              snapshot,
              applied,
              // The turn never started, so the rollback always restores — it is not a
              // settle, and `onSettle` does not apply. Explicit, not read from config.
              settlePolicy: "restore",
              userChangedModel: false,
              userChangedThinking: false,
            },
            session,
            ctx,
            `dispatch failed (${(error as Error).message}); the session was put back`,
          );
        }
        return refuse(
          ctx,
          "dispatch-failed",
          `/${command.name} was not dispatched: ${(error as Error).message}. Nothing was sent${rolledBack ? ", and the session model was put back" : ""}.`,
        );
      }

      return { status: "dispatched", routed: Boolean(applied.model || applied.thinking), hintShown, ...(profileSwitched ? { profileSwitched } : {}) };

    },
  };
}
