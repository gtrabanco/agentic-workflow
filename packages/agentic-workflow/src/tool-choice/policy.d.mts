/**
 * policy.d.mts — the type projection of `policy.mjs` (issue #610).
 *
 * Same rule as `journal/fragment.d.mts`: a projection of what the module
 * exports, compared against the module by the suite (case `F19`), never a second
 * contract.
 */

/** The contract this module implements. */
export declare const TOOL_CHOICE_CONTRACT: string;

/** The sanctioned `node` scripts — one declaration, two readers. */
export declare const NODE_SANCTIONED_SCRIPTS: readonly string[];

/** The bootstrap pair, each row carrying the reason it stays node-runnable. */
export declare const BOOTSTRAP_SCRIPTS: ReadonlyMap<string, string>;

/** One command segment: its leading operator, its text and its offsets. */
export interface ToolChoiceSegment {
  operator: string;
  text: string;
  start: number;
  end: number;
}

/** One tool-choice violation. */
export interface ToolChoiceViolation {
  kind: "pass" | "grep-search" | "node-default";
  head: string;
  segment: string;
  suggestion: string | null;
  rewritable: boolean;
  reason: string | null;
}

/** Split a bash command into segments, keeping position and offsets. */
export declare function splitCommandSegments(command: string): ToolChoiceSegment[];

/** Whitespace tokenizer that keeps a quoted operand as one token. */
export declare function segmentTokens(segment: string): string[];

/** The `rg` equivalent of a grep segment, or null when it is not grep. */
export declare function forwardGrepSegment(tokens: string[]): string | null;

/** The `bun` equivalent of a node segment, or null when it is not one, or is sanctioned. */
export declare function forwardNodeSegment(tokens: string[]): string | null;

/** Classify one command segment. */
export declare function classifySegment(segment: { operator?: string; text?: string }): ToolChoiceViolation;

/** Every tool-choice violation in a command, in command order. */
export declare function analyzeToolChoice(command: string): {
  parsed: boolean;
  violations: ToolChoiceViolation[];
  segments: ToolChoiceSegment[];
};

/** The command with the named violation kinds forwarded in place. */
export declare function forwardCommand(command: string, kinds: Iterable<string>): string;
