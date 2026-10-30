/**
 * The cost guard — tests estimated above the token budget are owner-gated.
 *
 * Operators declare command patterns and their estimated cost in tokens
 * (`guards.expensiveTests.patterns`), plus a ceiling (`maxTokens`, `0` = every
 * match is gated). A bash command matching a pattern whose estimate exceeds the
 * ceiling is blocked — an LLM-driven suite or a mutation run can burn a budget
 * silently, and "it was just a test" is not authorization to spend it.
 *
 * The estimate is exactly what the word says: a number the operator wrote next
 * to the pattern, not a measurement. It answers "may this run unattended?",
 * never "how much did it cost?".
 *
 * The only way through is an explicit owner instruction in the same turn,
 * carried as the command's first word: `AW_ALLOW=cost`. Listing or reading
 * tests is never gated.
 */

import { explicitAllow, type GuardDecision, type ToolCallLike } from "./guard-util.js";
import type { GuardsCostPattern } from "../config/types.js";

export const COST_REASON =
  "Running this is owner-gated (cost guard): its estimated token cost exceeds the configured budget, and a test is not authorization to spend it. " +
  "Only an explicit owner instruction in this turn enables it, carried as the command's first word: `AW_ALLOW=cost`.";

/** The estimated cost of one command, or null when it matches nothing. */
export function estimatedCost(command: string, patterns: GuardsCostPattern[]): number | null {
  let cost: number | null = null;
  for (const pattern of patterns) {
    let re: RegExp;
    try {
      re = new RegExp(pattern.match, "u");
    } catch {
      continue; // Invalid patterns are rejected at config load; never trust twice.
    }
    if (re.test(command) && (cost === null || pattern.tokens > cost)) cost = pattern.tokens;
  }
  return cost;
}

/**
 * The `tool_call` gate, bash only. `policy.maxTokens` is the ceiling; `0`
 * gates every match. The guard is a no-op while no patterns are configured.
 */
export function costGuard(
  { toolName, command }: ToolCallLike,
  policy: { maxTokens: number; patterns: GuardsCostPattern[] } = { maxTokens: 0, patterns: [] },
): GuardDecision {
  if (toolName !== "bash" || command === undefined || policy.patterns.length === 0) return { block: false };
  if (explicitAllow(command).has("cost")) return { block: false };
  const cost = estimatedCost(command, policy.patterns);
  if (cost === null || cost <= policy.maxTokens) return { block: false };
  return { block: true, reason: `${COST_REASON} (estimated: ${cost} tokens, budget: ${policy.maxTokens})` };
}
