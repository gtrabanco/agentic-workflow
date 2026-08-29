import type { LoadedConfig } from "../config/load.js";
import type { ThinkingLevel } from "../config/types.js";
import type { DispatchOutcome, ExtensionSurface, InvocationContext, ModelRef, WorkflowCommand } from "./types.js";
export interface RouterDeps<M extends ModelRef = ModelRef> {
    /** Pi's API is session-bound, so the surface is resolved per call. */
    surface: (ctx: InvocationContext<M>) => ExtensionSurface<M>;
    /** Fresh read per dispatch: project trust and file validity change between commands. */
    loadConfig: (ctx: InvocationContext<M>) => LoadedConfig;
    hint: {
        pending(): boolean;
        acknowledge(now?: string): boolean;
    };
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
    inFlight(): boolean;
}
export declare function createRouter<M extends ModelRef = ModelRef>({ surface, loadConfig, hint, settingsCommand, knownCommands, }: RouterDeps<M>): Router<M>;
