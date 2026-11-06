/**
 * publish.d.mts — the type projection of `publish.mjs`.
 *
 * Same rule as `render.d.mts`: a projection of what the module exports, compared
 * against the module by `test/log.render.test.mjs`, never a second contract.
 */

import type { LogFacts } from "./render.mjs";

/** What a strategy answers. `ok: false` is a reported failure, not a throw. */
export interface PublisherResult {
  ok?: boolean;
  error?: string;
  /** The journal strategy's answer: did the append happen? */
  written?: boolean;
  /** Why a journal append was skipped (`no-journal`). */
  skipped?: string;
  /** Where the entry went (`fragment` when the carrier routed it, `journal` for the direct append). */
  target?: string;
  /** The fragment name, when `target` is `"fragment"`. */
  fragment?: string;
}

/** One destination for the frozen facts. The journal and the argv both speak it. */
export interface Publisher {
  readonly name: string;
  publish(facts: LogFacts): PublisherResult | void;
}

/** A publisher as an operator declares it in `autoLogSession.publisher`. */
export interface DeclaredPublisher {
  command: string[];
  timeoutMs?: number;
}

/** One fan-out row: which strategy, and whether it delivered. */
export interface PublisherOutcome {
  name: string;
  ok: boolean;
  error?: string;
}

export declare const DEFAULT_JOURNAL: string;
export declare const DEFAULT_PUBLISH_TIMEOUT_MS: number;

/**
 * The local strategy's options. `fragmentDir` opts a project into the session-log
 * fragment carrier (issue #405): when the directory exists, the entry goes to a
 * fragment and the merge-to-main aggregator owns `docs/LOGS.md` (AC1).
 */
export declare function createJournalPublisher(options: {
  journalPath: string;
  fragmentDir?: string;
  kind?: string;
  sessionId?: string | (() => string | undefined);
  now?: () => number;
}): Publisher;
export declare function createCommandPublisher(options: {
  command: string[];
  cwd: string;
  timeoutMs?: number;
  spawn?: unknown;
}): Publisher;
export declare function createPublisherFromConfig(
  config: { publisher?: DeclaredPublisher | null } | undefined,
  context: { journalPath: string; cwd: string; fragmentDir?: string; kind?: string; sessionId?: string | (() => string | undefined); now?: () => number },
): Publisher[];
export declare function publishAll(
  publishers: readonly Publisher[],
  facts: LogFacts,
): { ok: boolean; results: PublisherOutcome[] };
