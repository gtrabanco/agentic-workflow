import { effectiveRoute } from "../config/merge.js";
import { parseModelReference } from "../config/schema.js";
import { modelRefKey } from "./types.js";
export function createRouter({ surface, loadConfig, hint, settingsCommand, knownCommands, }) {
    let pending;
    // Reported once per session: an operator who ignores it once does not need it
    // on every command, and a route that matches nothing must not fail silently.
    let unknownRoutesReported = false;
    const refuse = (ctx, reason, message) => {
        ctx.notify(message, "error");
        return { status: "refused", reason, message };
    };
    const configureHint = `Configure routes with /${settingsCommand} or the pi-agentic-workflow.json files.`;
    return {
        inFlight: () => pending !== undefined,
        noteModelSelect(model) {
            if (!pending)
                return;
            const applied = pending.applied.model;
            // Pi fires `model_select` for our own switch too. Anything else is the
            // operator taking the model, and then we back off entirely — restoring on
            // top of their choice would fight the session.
            if (applied && modelRefKey(applied) === modelRefKey(model))
                return;
            pending.userChangedModel = true;
        },
        noteThinkingLevelSelect(level) {
            if (!pending?.applied.thinking)
                return;
            if (pending.applied.thinking === level)
                return;
            pending.userChangedThinking = true;
        },
        async settle(ctx) {
            const turn = pending;
            if (!turn)
                return;
            // Cleared first: the restore below fires its own select events, and a turn
            // that is already over must not read them as operator changes.
            pending = undefined;
            const session = surface(ctx);
            if (turn.userChangedModel) {
                if (turn.applied.model || turn.applied.thinking) {
                    ctx.notify(`/${turn.command} finished; leaving the model you chose in place.`, "info");
                }
                return;
            }
            if (turn.applied.model) {
                if (turn.snapshot.model)
                    await session.setModel(turn.snapshot.model);
                else
                    ctx.notify(`/${turn.command} switched a session that had no model; nothing to restore.`, "warning");
            }
            // Thinking after the model: selecting a model can move the thinking level,
            // so applying the snapshot last is what makes the session equal its start.
            if (turn.applied.thinking && !turn.userChangedThinking) {
                session.setThinkingLevel(turn.snapshot.thinking);
            }
        },
        async dispatch(command, args, ctx) {
            if (pending) {
                return refuse(ctx, "routed-turn-in-flight", `/${command.name} refused: /${pending.command} is still routed. Wait for it to settle before running /${command.name}.`);
            }
            if (!ctx.isIdle()) {
                return refuse(ctx, "busy", `/${command.name} refused: the agent is busy, and routing changes the session model. Run it when the agent is idle.`);
            }
            const loaded = loadConfig(ctx);
            if (!loaded.ok) {
                const detail = loaded.problems
                    .map((problem) => `${problem.scope} config, ${problem.path}: ${problem.message}`)
                    .join(" | ");
                return refuse(ctx, "invalid-config", `/${command.name} refused: invalid configuration (${detail}). Nothing was dispatched and no model was changed.`);
            }
            if (!unknownRoutesReported) {
                unknownRoutesReported = true;
                const typos = Object.keys(loaded.config.commands).filter((name) => !knownCommands.has(name));
                if (typos.length > 0) {
                    ctx.notify(`/${command.name}: these configured routes match no command and do nothing: ${typos.join(", ")}. Fix the spelling or remove them with /${settingsCommand}.`, "warning");
                }
            }
            const session = surface(ctx);
            const route = effectiveRoute(loaded.config, command.name);
            let target;
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
                        return refuse(ctx, "unavailable-route", `/${command.name} stopped: the configured model ${route.model} ${blocker}. ${configureHint}`);
                    }
                    ctx.notify(`/${command.name}: ${route.model} ${blocker}, so it runs on the current session model. ${configureHint}`, "warning");
                }
                else {
                    target = found;
                }
            }
            const snapshot = { model: ctx.model, thinking: session.getThinkingLevel() };
            const applied = { model: undefined, thinking: undefined };
            if (target) {
                const selected = await session.setModel(target);
                if (!selected) {
                    if (loaded.config.onUnavailableRoute !== "inherit") {
                        return refuse(ctx, "unavailable-route", `/${command.name} stopped: ${route.model} could not be selected. ${configureHint}`);
                    }
                    ctx.notify(`/${command.name}: ${route.model} could not be selected, so it runs on the current session model. ${configureHint}`, "warning");
                }
                else {
                    applied.model = target;
                }
            }
            if (route.thinking !== "inherit") {
                session.setThinkingLevel(route.thinking);
                applied.thinking = route.thinking;
            }
            let hintShown = false;
            if (hint.pending()) {
                hintShown = true;
                hint.acknowledge();
                ctx.notify(`/${command.name} is running. Per-command models are optional: configure them with /${settingsCommand} or the pi-agentic-workflow.json files. This hint appears once.`, "info");
            }
            if (applied.model || applied.thinking) {
                pending = { command: command.name, snapshot, applied, userChangedModel: false, userChangedThinking: false };
            }
            session.sendUserMessage(args === "" ? `/skill:${command.skill}` : `/skill:${command.skill} ${args}`, {
                expandPromptTemplates: true,
            });
            return { status: "dispatched", routed: Boolean(applied.model || applied.thinking), hintShown };
        },
    };
}
