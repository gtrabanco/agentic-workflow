import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { THINKING_LEVELS } from "../config/types.js";
import type { ModelSetting, ThinkingSetting } from "../config/types.js";

// The peer package is imported for types only; Pi resolves it at runtime. Pi
// does not re-export `ThinkingLevel`/`Model` from its root index, so both are
// derived from the public API surface instead of reaching into dist internals.
type PiThinkingLevel = Parameters<ExtensionAPI["setThinkingLevel"]>[0];
type PiModel = NonNullable<Parameters<ExtensionAPI["setModel"]>[0]>;

/**
 * Compile-time drift guard (SPEC "Risks": Pi may add thinking levels). The
 * mirrored union in `config/types.ts` must stay equal to Pi's own; when Pi
 * changes, this line stops compiling rather than silently rejecting a valid
 * level at runtime.
 */
type ThinkingLevelsMirrorMatchesPi = [PiThinkingLevel] extends [(typeof THINKING_LEVELS)[number]]
  ? [(typeof THINKING_LEVELS)[number]] extends [PiThinkingLevel]
    ? true
    : false
  : false;
const thinkingLevelsInSyncWithPi: ThinkingLevelsMirrorMatchesPi = true;

export interface WorkflowCommand {
  /** Slash name users type, without the leading slash. */
  name: string;
  /** Skill directory whose `SKILL.md` body is injected. */
  skill: string;
  /** Where the skill came from, for diagnostics. */
  origin: "canonical" | "override";
}

/**
 * A routed slash command resolves to the skill body plus the model/thinking
 * route the command will run under (SPEC S2, S7).
 */
export interface ResolvedCommand extends WorkflowCommand {
  route: { model: ModelSetting; thinking: ThinkingSetting };
}

/**
 * Command surface for the package (SPEC S1-S4).
 *
 * P2 lands the configuration vocabulary and its compile-time link to Pi; the
 * catalogue, alias registration, route application, and lifecycle restore are
 * P3. The default export stays a valid no-op extension until then so a partially
 * built package cannot be activated by a real Pi session and register a
 * half-wired command.
 */
export default function extension(_pi: ExtensionAPI): void {
  void thinkingLevelsInSyncWithPi;
}

// Re-exported so the settings console (P4) can reuse the same Pi model type.
export type { PiModel };
