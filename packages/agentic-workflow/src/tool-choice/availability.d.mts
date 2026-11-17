/**
 * availability.d.mts — the type projection of `availability.mjs` (issue #610).
 *
 * Compared against the module by the suite (case `F19`), never a second contract.
 */

/** The preferred tools the shell-tool-choice policy forwards to. */
export declare const TOOL_CHOICE_TOOLS: readonly string[];

/** Which preferred tools this host actually has, from the doctor's resolver. */
export declare function resolveToolChoiceAvailability(options?: {
  find?: (name: string) => string | null;
}): { rg: boolean; bun: boolean };
