import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { loadConfig } from "../config/load.js";
import { createExtension } from "./factory.js";
import { createHintStore, stateFilePath } from "../routing/state.js";
import { runSettingsConsole } from "../settings/console.js";
import { readConfigFile, writeConfigFile } from "../settings/store.js";
import { SETTINGS_COMMAND } from "../routing/types.js";
/**
 * Pi adapter — the only file in the package that imports Pi values (SPEC
 * "Package layout": `dist/extension/index.js`).
 *
 * Its whole job is translation between Pi's context and the narrow view the
 * router understands, with no casts: `M` is bound to Pi's own `Model`, so every
 * model reference the router stores and hands back is the exact object
 * `ctx.modelRegistry` produced. Routing, configuration, and lifecycle live in
 * the Pi-free modules this wires — which is what lets AC3–AC12 be tested
 * without a session.
 */
const skillsDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "skills");
const thinkingLevelsInSyncWithPi = true;
function toInvocationContext(ctx) {
    return {
        cwd: ctx.cwd,
        get model() {
            return ctx.model;
        },
        isIdle: () => ctx.isIdle(),
        isProjectTrusted: () => ctx.isProjectTrusted(),
        notify: (message, kind) => ctx.ui.notify(message, kind),
        ui: ctx.ui,
        availableModels: () => ctx.modelRegistry.getAll(),
        find: (provider, modelId) => ctx.modelRegistry.find(provider, modelId),
        hasConfiguredAuth: (model) => ctx.modelRegistry.hasConfiguredAuth(model),
    };
}
function toRegistrar(pi) {
    return {
        registerCommand: (name, options) => pi.registerCommand(name, {
            ...(options.description ? { description: options.description } : {}),
            handler: async (args, ctx) => {
                await options.handler(args, toInvocationContext(ctx));
            },
        }),
    };
}
export default function extension(pi) {
    const agentDir = getAgentDir();
    const hint = createHintStore({ path: stateFilePath(agentDir) });
    const { router } = createExtension({
        registrar: toRegistrar(pi),
        // Resolved per call: the router must never hold a session-bound object
        // between turns, because Pi can hand a new session to the same extension.
        surface: () => ({
            sendUserMessage: (content, options) => pi.sendUserMessage(content, options),
            setModel: (model) => pi.setModel(model),
            getThinkingLevel: () => pi.getThinkingLevel(),
            setThinkingLevel: (level) => pi.setThinkingLevel(level),
        }),
        skillsDir,
        agentDir,
        hint,
        loadConfig: (ctx) => loadConfig({ agentDir, cwd: ctx.cwd, projectTrusted: ctx.isProjectTrusted() }),
        // The console edits the same files the dispatcher reads (SPEC S4, AC10).
        settings: ({ ctx, catalogue: routed }) => runSettingsConsole({
            ui: ctx.ui,
            agentDir,
            cwd: ctx.cwd,
            projectTrusted: ctx.isProjectTrusted(),
            commands: routed.commands.map((command) => command.name),
            models: ctx.availableModels().map((model) => `${model.provider}/${model.id}`),
            readFile: readConfigFile,
            writeFile: writeConfigFile,
        }),
    });
    pi.on("model_select", (event) => router.noteModelSelect(event.model));
    pi.on("thinking_level_select", (event) => router.noteThinkingLevelSelect(event.level));
    pi.on("agent_settled", (_event, ctx) => void router.settle(toInvocationContext(ctx)));
}
// Exported so the settings console (P4) names the same command without relisting it.
export { SETTINGS_COMMAND };
void thinkingLevelsInSyncWithPi;
