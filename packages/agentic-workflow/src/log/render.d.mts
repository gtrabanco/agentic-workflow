/**
 * render.d.mts — the type projection of `render.mjs`.
 *
 * The pi package compiles with `strict` and imports this module at runtime
 * (`@gtrabanco/agentic-workflow/src/log/render.mjs`), so the shape it sees is
 * declared once here. It is a projection, never a second contract: the names in
 * this file and the exports of `render.mjs` are compared by
 * `test/log.render.test.mjs`, so a new export cannot appear in one and not the
 * other.
 */

/** The payload a caller hands `renderEntry`. Five keys, frozen. */
export interface LogFacts {
  /** UTC minute precision: `YYYY-MM-DDTHH:MMZ`. */
  timestamp: string;
  branch: string;
  /** The shutdown reason, as pi reports it: `quit`, `reload`, `new`, `resume`, `fork`. */
  reason: string;
  commits: {
    /** Commits in the session's range; `0` with a `null` range means no marker. */
    count: number;
    /** `<sha>…<sha>`, or `null` when the session carried no valid marker. */
    range: string | null;
  };
  /** Project-relative paths, in git's order. */
  files: string[];
}

export type NormalizeResult =
  | { ok: true; facts: LogFacts }
  | { ok: false; reason: string };

export type RenderReceipt =
  | { ok: true; contract: string; facts: string; entry: string; bytes: number }
  | { ok: false; contract: string; facts: string; error: string };

export declare const LOG_FACTS_CONTRACT_ID: string;
export declare const LOG_ENTRY_CONTRACT_ID: string;
export declare const LOG_FACTS_KEYS: readonly string[];
export declare const LOG_COMMIT_KEYS: readonly string[];

export declare class LogFactsError extends Error {}

export declare function normalizeFacts(input: unknown): NormalizeResult;
export declare function isRenderedEntry(text: unknown): boolean;
export declare function renderEntry(facts: LogFacts): string;
export declare function renderReceipt(facts: unknown): RenderReceipt;
