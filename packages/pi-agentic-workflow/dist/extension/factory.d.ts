import type { LoadedConfig } from "../config/load.js";
import type { Catalogue } from "../routing/catalogue.js";
import type { Router } from "../routing/dispatch.js";
import type { ExtensionSurface, InvocationContext, ModelRef } from "../routing/types.js";
import type { HintStore } from "../routing/state.js";
/**
 * The Pi-free half of the extension entry (SPEC "Command surface (api)").
 *
 * Given something that can register commands and a surface shaped like
 * `ExtensionAPI`, this wires one command per bundled public skill plus the
 * settings console, and returns the router that owns model lifecycle. Every
 * behaviour in AC3–AC12 is reachable from here, so `index.ts` stays a thin
 * adapter over Pi's real objects and nothing has to be tested against a live
 * session. `M` is the session model type — Pi's `Model` in production, a plain
 * `{provider, id}` in tests.
 */
export interface CommandRegistrar<M extends ModelRef = ModelRef> {
    registerCommand(name: string, options: {
        description?: string;
        handler: (args: string, ctx: InvocationContext<M>) => void | Promise<void>;
    }): void;
}
/** What the settings command presents (SPEC S4): the console, over the same files. */
export type SettingsHandler<M extends ModelRef = ModelRef> = (input: {
    catalogue: Catalogue;
    loaded: LoadedConfig;
    ctx: InvocationContext<M>;
}) => unknown;
export interface ExtensionDeps<M extends ModelRef = ModelRef> {
    registrar: CommandRegistrar<M>;
    /** Pi's API is session-bound, so the router resolves the surface per call. */
    surface: (ctx: InvocationContext<M>) => ExtensionSurface<M>;
    /** Directory holding the bundled `skills/` tree. */
    skillsDir: string;
    /** Global agent directory, from Pi's `getAgentDir()`. */
    agentDir: string;
    hint: HintStore;
    settings: SettingsHandler<M>;
    /** Overridable so a test can hand the router an in-memory configuration. */
    loadConfig?: (ctx: InvocationContext<M>) => LoadedConfig;
}
export interface ExtensionHandle<M extends ModelRef = ModelRef> {
    router: Router<M>;
    catalogue: Catalogue;
}
export declare function createExtension<M extends ModelRef = ModelRef>(deps: ExtensionDeps<M>): ExtensionHandle<M>;
