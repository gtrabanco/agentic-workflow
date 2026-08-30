import { loadConfig } from "../config/load.js";
import type { LoadedConfig } from "../config/load.js";
import { readCatalogue } from "../routing/catalogue.js";
import type { Catalogue } from "../routing/catalogue.js";
import { createRouter } from "../routing/dispatch.js";
import type { Router } from "../routing/dispatch.js";
import { SETTINGS_COMMAND } from "../routing/types.js";
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
  registerCommand(
    name: string,
    options: {
      description?: string;
      handler: (args: string, ctx: InvocationContext<M>) => void | Promise<void>;
    },
  ): void;
}

/** What the settings command presents (SPEC S4): the console, over the same files. */
export type SettingsHandler<M extends ModelRef = ModelRef> = (input: {
  catalogue: Catalogue;
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

export function createExtension<M extends ModelRef = ModelRef>(deps: ExtensionDeps<M>): ExtensionHandle<M> {
  const { registrar, surface, skillsDir, agentDir, hint, settings } = deps;
  const catalogue = readCatalogue(skillsDir);

  const read = (ctx: InvocationContext<M>): LoadedConfig =>
    deps.loadConfig?.(ctx) ?? loadConfig({ agentDir, cwd: ctx.cwd, projectTrusted: ctx.isProjectTrusted() });

  // A skill that cannot become a command is a packaging fact the operator must
  // see, and Pi exposes notifications only through the invocation context — so
  // the first command run in the session carries the report, once.
  let reported = catalogue.issues.length === 0;
  const reportCatalogueIssues = (ctx: InvocationContext<M>): void => {
    if (reported) return;
    reported = true;
    for (const issue of catalogue.issues) {
      ctx.notify(`pi-agentic-workflow: skills/${issue.dir}: ${issue.message}`, "warning");
    }
  };

  const knownCommands = new Set<string>([...catalogue.commands.map((entry) => entry.name), SETTINGS_COMMAND]);
  const router = createRouter<M>({ surface, loadConfig: read, hint, settingsCommand: SETTINGS_COMMAND, knownCommands });

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
        await settings({ catalogue, ctx });
      } catch (error) {
        // A console that dies mid-question must say so, not take the session down.
        ctx.notify(`Settings could not be opened: ${(error as Error).message}`, "error");
      }
    },
  });

  return { router, catalogue };
}
