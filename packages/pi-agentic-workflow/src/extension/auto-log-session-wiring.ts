/**
 * auto-log-session-wiring.ts — attaches the journal writer to Pi's session
 * lifecycle (issue #394, S1/S4/S9/S10/S11).
 *
 * This is a factory over a `pi`-shaped object so the suite drives the two events
 * directly and never needs a live session. What it owns, and what it deliberately
 * does not:
 *
 *  - **`off` registers nothing.** Not a listener that wakes up to find itself
 *    disabled — `pi.on` is never called (S1).
 *  - **It is not the telemetry wiring.** Log writing and the measured sample are
 *    two wirings over two switches (S4); nothing here imports the accumulator,
 *    and nothing there knows about the journal.
 *  - **One entry per session.** `session_start` records the marker and the
 *    instance keeps it; `session_shutdown` writes one entry, then removes the
 *    marker and latches. A second shutdown returns before doing any work — the
 *    cheap fix for a teardown that fires twice (S9).
 *  - **Nothing escapes.** Every failure — no journal, no marker, a broken git, a
 *    publisher that throws — is swallowed at this boundary: a session shutdown
 *    must never be blocked by a journal, and a lost copy must never cost the
 *    local entry (S10).
 */

import { createPublisherFromConfig, publishAll, DEFAULT_JOURNAL } from "@gtrabanco/agentic-workflow/src/log/publish.mjs";
import type { Publisher } from "@gtrabanco/agentic-workflow/src/log/publish.mjs";

import { JOURNAL_PATH, buildFacts, createMarker, hasJournal, removeMarker } from "../auto-log-session.js";
import type { GitReader, Marker } from "../auto-log-session.js";
import type { AutoLogSessionConfig } from "../config/types.js";

/** The slice of `pi` the wiring needs. Pi hands every handler its context. */
export interface PiLike {
  on(event: string, handler: (event?: unknown, ctx?: unknown) => void): void;
}

/** The events this wiring listens to. */
export const AUTO_LOG_SESSION_EVENTS = Object.freeze(["session_start", "session_shutdown"] as const);

export interface AutoLogSessionWiringOptions {
  readonly root: string;
  /** The resolved switch: `off` registers nothing. */
  readonly mode: AutoLogSessionConfig["mode"];
  /** The resolved publisher, or `null` for the local journal alone. */
  readonly publisher?: AutoLogSessionConfig["publisher"];
  /** Where the journal lives, relative to `root`. */
  readonly journalPath?: string;
  /** Injected clock, so the suite owns the timestamp. */
  readonly now?: () => number;
  /** Injected git reader, for the same reason. */
  readonly git?: GitReader;
  /** Publishers that always run after the shipped ones (a host seam, a spy). */
  readonly extraPublishers?: readonly Publisher[];
}

export interface AutoLogSessionWiring {
  register(pi: PiLike): void;
}

/**
 * The session id Pi hands a handler in its context. Read defensively: the wiring
 * stays a factory over a `pi`-shaped object, and a caller that names nothing gets
 * no marker rather than a marker every session would share.
 */
function sessionIdOf(ctx: unknown): string | undefined {
  const manager = (ctx as { sessionManager?: { getSessionId?: () => unknown } } | undefined)?.sessionManager;
  const id = manager?.getSessionId?.();
  return typeof id === "string" && id !== "" ? id : undefined;
}

/**
 * Build the wiring. Everything it cannot know is injected: the root, the
 * resolved switch, the clock and the git reader.
 */
export function createAutoLogSessionWiring(options: AutoLogSessionWiringOptions): AutoLogSessionWiring {
  const journalPath = `${options.root}/${options.journalPath ?? JOURNAL_PATH}`;
  const publishers = createPublisherFromConfig(
    { publisher: options.publisher ?? null },
    { journalPath, cwd: options.root },
  );
  const all = options.extraPublishers ? [...publishers, ...options.extraPublishers] : publishers;

  /** This session's marker and id, held in memory — never read back from disk. */
  let marked: { sessionId: string; marker: Marker } | null = null;
  let flushed = false;

  return {
    register(pi) {
      if (options.mode === "off") return;

      pi.on("session_start", (_event, ctx) => {
        if (!hasJournal(options.root)) return;
        const sessionId = sessionIdOf(ctx);
        if (sessionId === undefined) return;
        try {
          const marker = createMarker({ root: options.root, sessionId, now: options.now, git: options.git });
          marked = marker === null ? null : { sessionId, marker };
        } catch {
          marked = null;
        }
      });

      pi.on("session_shutdown", (event) => {
        if (flushed || marked === null) return;
        flushed = true;
        const { sessionId, marker } = marked;
        marked = null;
        try {
          const reason = (event as { reason?: unknown } | undefined)?.reason;
          const facts = buildFacts({
            root: options.root,
            marker,
            reason: typeof reason === "string" && reason !== "" ? reason : "unknown",
            now: options.now,
            git: options.git,
          });
          if (facts === null) return;
          publishAll(all, facts);
        } catch {
          // A journal write must never block a shutdown, and a teardown has no UI
          // left to nag. The fan-out's own result is dropped on purpose: no retry,
          // no queue, no report — the next session's entry is a new entry.
        } finally {
          removeMarker(options.root, sessionId);
        }
      });
    },
  };
}

/** Re-exported so a caller names the shipped journal without importing the crate. */
export { DEFAULT_JOURNAL };
