/**
 * availability.mjs — which preferred tools this host actually has (issue #610).
 *
 * S2 of the unit: the interception layer reads availability from the doctor's
 * resolver, never from a second probe. So this module is one thin reading of
 * `findOnPath` — the same exported primitive `agentic-workflow doctor` probes
 * every documented tool with — and nothing else. The carrier (the pi extension)
 * imports the answer; it owns no `PATH` logic of its own.
 *
 * The failure posture is part of the contract: an unreadable `PATH`, or a
 * resolver that throws, reads as **absent**, which stands the carrier down. A
 * convention is never allowed to cost a session the fallback tool it needs.
 */

import { findOnPath } from "../doctor/probes.mjs";

/** The preferred tools the shell-tool-choice policy forwards to. */
export const TOOL_CHOICE_TOOLS = Object.freeze(["rg", "bun"]);

/**
 * @param {{find?: (name: string) => string | null}} [options] the resolver, injected by the suite
 * @returns {{rg: boolean, bun: boolean}}
 */
export function resolveToolChoiceAvailability(options = {}) {
  const find = options.find ?? findOnPath;
  const has = (name) => {
    try {
      return find(name) !== null;
    } catch {
      // An unreadable PATH is an answer: the tool is not usable.
      return false;
    }
  };
  const availability = {};
  for (const tool of TOOL_CHOICE_TOOLS) availability[tool] = has(tool);
  return availability;
}
