// src/extension.ts
// The companion's Pi extension entry: registers the NaN preset into the main
// package's provider-preset seam at load time (issue #388; amendment 2 adds
// the named profile catalog), applies that profile's doc-index default (issue
// #719 D5), and — issue #632 — the phase-batching command that prints the
// preset's recommendation for a unit.
// The main package never names a provider; this file is the only place the two
// meet.
//
// Registration is idempotent (the seam's registry replaces by provider id), so
// both the top-level side effect and the extension call are safe. The command
// is registered only on a host that registers commands: a test double (and any
// host without them) keeps exactly the behaviour it had before #632.

import { registerProviderPreset } from "@gtrabanco/pi-agentic-workflow/dist/config/presets.js";
import { loadConfig } from "@gtrabanco/pi-agentic-workflow/dist/config/load.js";
import { applyEmbedDefaultOn } from "@gtrabanco/pi-agentic-workflow/dist/config/embed-profile.js";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { PROVIDER, PROFILES, DEFAULT_PROFILE, resolvePresetProfile } from "./preset.js";
import { NAN_EMBED_PROFILE } from "./embed-profile.js";
import { PHASE_BATCHING_COMMAND, phaseBatchingCommand } from "./phase-batching-command.js";

function register(): void {
  registerProviderPreset({
    provider: PROVIDER,
    profiles: PROFILES,
    defaultProfile: DEFAULT_PROFILE,
    // Issue #541: the doc-index embedding profile rides the same registration,
    // typed against the runner crate's provider block by the main package's
    // seam — this companion never depends on the crate itself.
    embedProfile: NAN_EMBED_PROFILE,
    resolveProfile: ({ config, profile }) =>
      resolvePresetProfile({ tierRouting: config.tierRouting, profile }),
  });
}

/**
 * Issue #719 S1/S4 (decision D5) — apply this preset's doc-index embedding
 * profile by default, right after the registration that publishes it.
 *
 * The trigger lives here, with the profile's owner, and deliberately not in the
 * main package: Pi loads extensions in an order it does not promise, so a
 * registry read from another package's load could find the registry empty and
 * silently answer keyword-only. Called from the module top *after* `register()`,
 * the profile exists by construction.
 *
 * `applyEmbedDefaultOn` owns the whole decision — an operator's committed block
 * withholds it, an absent key withholds it, and a trio this resolver wrote is
 * withdrawn before the next decision, so the call is safe to repeat. It reports
 * what it did; nothing here announces a keyword-only session, which is a
 * supported state rather than a fault.
 */
function applyEmbedDefault(): void {
  applyEmbedDefaultOn({ entry: { provider: PROVIDER, profile: NAN_EMBED_PROFILE }, root: process.cwd() });
}

/**
 * Issue #632: `/nan-phase-batching` prints the policy's typed document. The
 * config switch comes from the merged extension file the main package resolves
 * — the same resolution the router reads, so the command and the preset cannot
 * disagree about whether batching is on.
 *
 * The two impure seams are injected, the way the package's other commands do it:
 * a suite drives the whole handler (config resolution included) against a
 * temporary agent directory and a capturing host, so the glue that turns a Pi
 * context into the policy's inputs is asserted instead of trusted.
 */
export interface PhaseBatchingHandlerDeps {
  /** The host's agent directory; defaults to Pi's own. */
  agentDir?: string;
  /** The config loader; defaults to the main package's. */
  loadConfig?: typeof loadConfig;
  /** The policy core; defaults to the shipped one. */
  command?: typeof phaseBatchingCommand;
}

/** What the host must give the handler: Pi's context, structurally. */
export interface PhaseBatchingHostContext {
  readonly cwd: string;
  readonly model?: { readonly provider: string; readonly id: string };
  isProjectTrusted(): boolean;
  readonly ui: { notify(message: string, kind?: "info" | "warning" | "error"): void };
}

export function createPhaseBatchingHandler(
  deps: PhaseBatchingHandlerDeps = {},
): (args: string, ctx: PhaseBatchingHostContext) => Promise<void> {
  const load = deps.loadConfig ?? loadConfig;
  const run = deps.command ?? phaseBatchingCommand;
  return async (args, ctx) => {
    const loaded = load({
      agentDir: deps.agentDir ?? getAgentDir(),
      cwd: ctx.cwd,
      projectTrusted: ctx.isProjectTrusted(),
    });
    const model = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : undefined;
    const result = run({ args: String(args ?? ""), sessionModel: model, config: loaded.config });
    if (!result.ok) {
      ctx.ui.notify(`/${PHASE_BATCHING_COMMAND} — ${result.error}`, "error");
      return;
    }
    ctx.ui.notify(result.output.trimEnd(), "info");
    for (const problem of loaded.problems) {
      ctx.ui.notify(`/${PHASE_BATCHING_COMMAND}: config ${problem.scope} ${problem.path} — ${problem.message}`, "warning");
    }
  };
}

function registerPhaseBatchingCommand(pi?: ExtensionAPI): void {
  if (!pi || typeof pi.registerCommand !== "function") return;
  const handler = createPhaseBatchingHandler();
  pi.registerCommand(PHASE_BATCHING_COMMAND, {
    description:
      "Print the model-aware phase-batching recommendation for a unit: how many execute-phase steps the session's model holds in one context, and which fact decided it.",
    handler,
  });
}

register();
applyEmbedDefault();

export default function extension(pi?: ExtensionAPI): void {
  register();
  applyEmbedDefault();
  registerPhaseBatchingCommand(pi);
}
