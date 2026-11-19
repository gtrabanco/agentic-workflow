// src/extension.ts
// The companion's Pi extension entry: registers the NaN preset into the main
// package's provider-preset seam at load time (issue #388; amendment 2 adds
// the named profile catalog), and — issue #632 — the phase-batching command
// that prints the preset's recommendation for a unit.
// The main package never names a provider; this file is the only place the two
// meet.
//
// Registration is idempotent (the seam's registry replaces by provider id), so
// both the top-level side effect and the extension call are safe. The command
// is registered only on a host that registers commands: a test double (and any
// host without them) keeps exactly the behaviour it had before #632.

import { registerProviderPreset } from "@gtrabanco/pi-agentic-workflow/dist/config/presets.js";
import { loadConfig } from "@gtrabanco/pi-agentic-workflow/dist/config/load.js";
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
 * Issue #632: `/nan-phase-batching` prints the policy's typed document. The
 * config switch comes from the merged extension file the main package resolves
 * — the same resolution the router reads, so the command and the preset cannot
 * disagree about whether batching is on.
 */
function registerPhaseBatchingCommand(pi?: ExtensionAPI): void {
  if (!pi || typeof pi.registerCommand !== "function") return;
  pi.registerCommand(PHASE_BATCHING_COMMAND, {
    description:
      "Print the model-aware phase-batching recommendation for a unit: how many execute-phase steps the session's model holds in one context, and which fact decided it.",
    handler: async (args: string, ctx) => {
      const loaded = loadConfig({
        agentDir: getAgentDir(),
        cwd: ctx.cwd,
        projectTrusted: ctx.isProjectTrusted(),
      });
      const model = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : undefined;
      const result = phaseBatchingCommand({ args: String(args ?? ""), sessionModel: model, config: loaded.config });
      if (!result.ok) {
        ctx.ui.notify(`/${PHASE_BATCHING_COMMAND} — ${result.error}`, "error");
        return;
      }
      ctx.ui.notify(result.output.trimEnd(), "info");
      for (const problem of loaded.problems) {
        ctx.ui.notify(`/${PHASE_BATCHING_COMMAND}: config ${problem.scope} ${problem.path} — ${problem.message}`, "warning");
      }
    },
  });
}

register();

export default function extension(pi?: ExtensionAPI): void {
  register();
  registerPhaseBatchingCommand(pi);
}
