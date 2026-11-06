/**
 * aggregate.d.mts — the type projection of `aggregate.mjs`.
 *
 * Same rule as `log/render.d.mts`: a projection of what the module exports,
 * compared against the module by the suites, never a second contract.
 */

/** A refused aggregation: the CLI maps this to exit 2, "JOURNAL REFUSAL — <reason>". */
export declare class JournalAggregateError extends Error {}

/** The project journal, relative to the project root. */
export declare const DEFAULT_LOG: string;

/**
 * Aggregate the pending fragments under `<root>/<journalDir?>` into
 * `<root>/<logPath?>`: append newest-first (ties: branch, kind, session
 * ascending), delete the consumed fragments, consume already-present bytes
 * without appending. Refuses before the first byte moves.
 */
export declare function aggregateJournal(options: {
  root: string;
  journalDir?: string;
  logPath?: string;
}): {
  ok: true;
  appended: string[];
  alreadyPresent: string[];
  removed: string[];
  log: string;
  fragments: number;
};
