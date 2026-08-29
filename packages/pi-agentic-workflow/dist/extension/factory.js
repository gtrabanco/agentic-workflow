import { loadConfig } from "../config/load.js";
import { readCatalogue } from "../routing/catalogue.js";
import { createRouter } from "../routing/dispatch.js";
import { SETTINGS_COMMAND } from "../routing/types.js";
export function createExtension(deps) {
    const { registrar, surface, skillsDir, agentDir, hint, settings } = deps;
    const catalogue = readCatalogue(skillsDir);
    const read = (ctx) => deps.loadConfig?.(ctx) ?? loadConfig({ agentDir, cwd: ctx.cwd, projectTrusted: ctx.isProjectTrusted() });
    // A skill that cannot become a command is a packaging fact the operator must
    // see, and Pi exposes notifications only through the invocation context — so
    // the first command run in the session carries the report, once.
    let reported = catalogue.issues.length === 0;
    const reportCatalogueIssues = (ctx) => {
        if (reported)
            return;
        reported = true;
        for (const issue of catalogue.issues) {
            ctx.notify(`pi-agentic-workflow: skills/${issue.dir}: ${issue.message}`, "warning");
        }
    };
    const knownCommands = new Set([...catalogue.commands.map((entry) => entry.name), SETTINGS_COMMAND]);
    const router = createRouter({ surface, loadConfig: read, hint, settingsCommand: SETTINGS_COMMAND, knownCommands });
    for (const command of catalogue.commands) {
        registrar.registerCommand(command.name, {
            ...(command.description ? { description: command.description } : {}),
            handler: async (args, ctx) => {
                reportCatalogueIssues(ctx);
                await router.dispatch(command, args, ctx);
            },
        });
    }
    registrar.registerCommand(SETTINGS_COMMAND, {
        description: "Show and configure per-command model routing",
        handler: async (_args, ctx) => {
            reportCatalogueIssues(ctx);
            try {
                await settings({ catalogue, loaded: read(ctx), ctx });
            }
            catch (error) {
                // A console that dies mid-question must say so, not take the session down.
                ctx.notify(`Settings could not be opened: ${error.message}`, "error");
            }
        },
    });
    return { router, catalogue };
}
