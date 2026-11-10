// src/extension.ts
// The companion's Pi extension entry: registers the NaN preset into the main
// package's provider-preset seam at load time (issue #388; amendment 2 adds
// the named profile catalog). The main package never names a provider; this
// file is the only place the two meet.
//
// Registration is idempotent (the seam's registry replaces by provider id), so
// both the top-level side effect and the extension call are safe.

import { registerProviderPreset } from "@gtrabanco/pi-agentic-workflow/dist/config/presets.js";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { PROVIDER, PROFILES, DEFAULT_PROFILE, resolvePresetProfile } from "./preset.js";

function register(): void {
  registerProviderPreset({
    provider: PROVIDER,
    profiles: PROFILES,
    defaultProfile: DEFAULT_PROFILE,
    resolveProfile: ({ config, profile }) =>
      resolvePresetProfile({ tierRouting: config.tierRouting, profile }),
  });
}

register();

export default function extension(_pi?: ExtensionAPI): void {
  register();
}
