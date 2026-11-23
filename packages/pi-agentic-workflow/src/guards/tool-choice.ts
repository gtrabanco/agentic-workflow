/**
 * tool-choice.ts — the command-time carrier for the shell-tool-choice policy
 * (issue #610).
 *
 * The workflow's `rg`-before-`grep` / `bun`-before-`node` convention used to live
 * only in prose, and prose read once decays: the audited authoring sessions
 * issued 15 `node`-as-default commands and 13 `grep`-as-search commands with the
 * preferred tools on `PATH` the whole time. This module is the enforcement half —
 * Pi's `tool_call` fires before the command runs and can block it or mutate its
 * input, so the choice is re-made at command time whether or not the model still
 * remembers the sentence.
 *
 * Pure on purpose (the receipt guard's shape): availability and the resolved
 * config are injected, so the whole posture is testable with no session. The
 * words are not here either — `AGENTS.md` §Runtime convention owns the
 * convention, `packages/agentic-workflow/src/tool-choice/policy.mjs` owns the
 * allowlist and the classifier, and every reason this module returns cites that
 * owner instead of restating it.
 *
 * Availability is never probed here: the caller hands it in from the doctor's
 * resolver, because a second `PATH` probe is exactly the drift #610 exists to
 * remove.
 */

import { analyzeToolChoice, forwardCommand } from "@gtrabanco/agentic-workflow/src/tool-choice/policy.mjs";

import { DEFAULT_TOOL_CHOICE } from "../config/types.js";
import type { ToolChoiceConfig } from "../config/types.js";

/** What the host actually has on `PATH`, resolved once by the caller. */
export interface ToolChoiceAvailability {
  rg: boolean;
  bun: boolean;
}

/** The Pi `tool_call` result shape plus the optional rewritten command. */
export interface ToolChoiceDecision {
  /** Refuse the call; `reason` is what the model reads. */
  block: boolean;
  reason?: string;
  /** The command to run instead, when the posture rewrites. */
  command?: string;
}

/** Which availability answer gates which violation kind. */
const KIND_REQUIRES: Record<string, keyof ToolChoiceAvailability> = {
  "grep-search": "rg",
  "node-default": "bun",
};

export interface EnforceOptions {
  /** The resolved `pi.toolChoice` posture. */
  config?: ToolChoiceConfig;
  /** The resolved `guard.toolChoice.mode` (issue #626). This guard has no
   *  question path, so `ask` answers as `deny`; `allow` stands it down. */
  disposition?: "allow" | "deny" | "ask";
  /** The tools the host has; a missing preferred tool stands the carrier down. */
  availability: ToolChoiceAvailability;
  /** The session's project, for the repair reasons that name a path (issue #696).
   *  `undefined` means "cannot answer": the reason then keeps today's wording. */
  existsPath?: (rel: string) => boolean;
}

/**
 * Decide what to do with one bash command.
 *
 * - the carrier disabled or allowed by its `guard` disposition, or the command
 *   unparseable → pass untouched;
 * - a violation whose preferred tool is absent → pass untouched (the fallback
 *   is never blocked: that would trade a convention for a broken session);
 * - `rewrite` and every violation translatable → the forwarded command;
 * - otherwise → block, with the equivalent and the owner in the reason.
 */
export function enforceToolChoice(command: string, options: EnforceOptions): ToolChoiceDecision {
  const config = options.config ?? DEFAULT_TOOL_CHOICE;
  if (options.disposition === "allow") return { block: false };
  if (config.enabled !== true) return { block: false };
  if (typeof command !== "string" || command.trim() === "") return { block: false };
  const analysis = analyzeToolChoice(command, { exists: options.existsPath });
  if (!analysis.parsed) return { block: false };
  const actionable = analysis.violations.filter((violation) => {
    const required = KIND_REQUIRES[violation.kind];
    return required === undefined || options.availability[required] === true;
  });
  if (actionable.length === 0) return { block: false };
  if (config.mode === "rewrite" && actionable.every((violation) => violation.rewritable)) {
    const forwarded = forwardCommand(command, new Set(actionable.map((violation) => violation.kind)), { exists: options.existsPath });
    if (forwarded !== command) return { block: false, command: forwarded };
  }
  const [first] = actionable;
  const rest = actionable.length - 1;
  const reason = rest > 0 ? `${first.reason} (${rest} more in this command.)` : first.reason ?? "";
  return { block: true, reason };
}
