import type { SettingsUi } from "../routing/types.js";
import type { ConfigFile } from "../config/types.js";
export interface SettingsDeps {
    ui: SettingsUi;
    agentDir: string;
    cwd: string;
    projectTrusted: boolean;
    /** Routed command names — what the operator may attach an override to. */
    commands: readonly string[];
    /** `provider/modelId` references from the live registry, when one is reachable. */
    models?: readonly string[];
    readFile(path: string): string | null;
    writeFile(path: string, text: string): void;
}
export type ConsoleOutcome = {
    status: "saved";
    scope: "global" | "project";
    path: string;
    file: ConfigFile;
} | {
    status: "cancelled";
    edited: boolean;
};
/** The console's questions. `test/settings-console.test.mjs` drives the flow
 * through these strings, so renaming one fails the tests that use it rather than
 * silently re-sequencing them. */
export declare const prompts: {
    readonly scope: "Which file should the console edit?";
    readonly menu: "What do you want to change?";
    readonly command: "Which command?";
    readonly policyChoice: "What should happen when a configured model is unavailable?";
    readonly saveTo: (path: string) => string;
    readonly discard: "Discard the draft?";
    readonly setDefaultRoute: "Set the default route";
    readonly setOverride: "Set a command override";
    readonly clearOverride: "Clear a command override";
    readonly policy: "Set the unavailable-route policy";
    readonly save: "Save";
    readonly cancel: "Cancel";
    readonly model: (target: string) => string;
    readonly modelPicked: (target: string) => string;
    readonly thinking: (target: string) => string;
};
export declare function runSettingsConsole(deps: SettingsDeps): Promise<ConsoleOutcome>;
