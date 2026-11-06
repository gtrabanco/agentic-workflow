/**
 * fragment.d.mts — the type projection of `fragment.mjs`.
 *
 * Same rule as `log/render.d.mts`: a projection of what the module exports,
 * compared against the module by the suites, never a second contract.
 */

/** A refused fragment write: the name collides, the kind is unknown, or the content is not one entry block. */
export declare class FragmentError extends Error {}

/** The fragment root, relative to the project root — the opt-in signal (issue #405). */
export declare const JOURNAL_DIR: string;

/** The closed kind set: `mechanical` (rendered from `log-facts@1`) and `narrative` (written by `/log-session`). */
export declare const FRAGMENT_KINDS: readonly string[];

/** A branch or session slug: ≤64 chars of `[A-Za-z0-9._-]`, never empty (`x` as the fallback). */
export declare function slug(input: unknown): string;

/** The deterministic fragment name from its identity: write-time second, branch slug, kind, session slug. */
export declare function fragmentName(options: {
  timestamp: Date | number | string;
  branch: string | undefined;
  kind: string;
  sessionId: string | undefined;
}): string;

/** The identity back out of a name, or null when the name is not a fragment. */
export declare function parseFragmentName(name: string): { timestamp: string; branch: string; kind: string; sessionId: string } | null;

/**
 * Write one fragment under `<root>/<dir?>`. `kind: "mechanical"` renders
 * `facts` through `renderEntry`; `kind: "narrative"` validates `content` as one
 * entry block. An existing target is refused, never overwritten.
 */
export declare function writeFragment(options: {
  root: string;
  dir?: string;
  facts?: Record<string, unknown>;
  content?: string;
  branch?: string;
  kind: string;
  sessionId?: string;
  now?: () => number;
  timestamp?: Date | number | string;
}): { ok: true; name: string; path: string; bytes: number };

/** The identity and bytes back out of a fragment, or null when it is not readable. */
export declare function readFragment(
  dir: string,
  name: string,
): { timestamp: string; branch: string; kind: string; sessionId: string; content: string } | null;
