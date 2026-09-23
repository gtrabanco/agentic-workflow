/**
 * invocationFromDecision > map an invoke decision to /skill:<verb> <args>.
 *
 * Handles:
 *  - verb not in commandNames → no-decision-available
 *  - precondition check (if any precondition has satisfied:false) → precondition-uncheckable
 *  - unattended + review verb → --adversarial flag
 *  - unattended + security → --adversarial 3
 */

import type { ActionDecision, InvocationOpts, InvocationResult } from "./types.js";

/**
 * Map an invoke decision into an executable invocation string.
 * Returns { ok: true, invocation, adversarial? } or { ok: false, refusal }.
 */
export function invocationFromDecision(decision: ActionDecision, opts: InvocationOpts): InvocationResult {
  const { commandNames, attended, sensitive, security, continuation } = opts;

  // For non-invoke decisions, return a refusal
  if (decision.kind !== "invoke") {
    return { ok: false, refusal: "no-decision-available", detail: `decision is ${decision.kind}, not invoke` };
  }

  const verb = decision.intent;

  // Check if the verb is a known command
  if (!commandNames.has(verb)) {
    return { ok: false, refusal: "no-decision-available", detail: `command "${verb}" not found` };
  }

  // Check preconditions > if any precondition has satisfied:false → refuse
  if (continuation?.preconditions) {
    const hasUnchecked = continuation.preconditions.some((p) => !p.satisfied);
    if (hasUnchecked) {
      return { ok: false, refusal: "precondition-uncheckable", detail: "unmet precondition(s)" };
    }
  }

  // Build invocation: /skill:<verb> <targets joined with space>
  const targets = decision.targets ?? [];
  let invocation = `/skill:${verb}`;
  if (targets.length > 0) {
    invocation += " " + targets.join(" ");
  }

  // Adversarial flags > only for unattended mode
  let adversarial: number | undefined;
  if (!attended) {
    // Security mode overrides everything
    if (security) {
      adversarial = 3;
      invocation += " --adversarial 3";
    } else if (sensitive && isReviewVerb(verb)) {
      adversarial = 2;
      invocation += " --adversarial 2";
    }
  }

  return { ok: true, invocation, adversarial };
}

/**
 * Check if an intent is a review-class verb.
 * The tests specifically check for "review-change" as the review verb.
 */
function isReviewVerb(verb: string): boolean {
  return verb.startsWith("review-") || verb === "review-change";
}