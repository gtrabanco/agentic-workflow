/**
 * auto-log-session-wiring.ts — attaches the journal writer to Pi's session
 * lifecycle (issue #394, S1/S4/S9/S10/S11; #623 S3/S4).
 *
 * This is a factory over a `pi`-shaped object so the suite drives the events
 * directly and never needs a live session. What it owns, and what it deliberately
 * does not:
 *
 *  - **`off` registers nothing.** Not a listener that wakes up to find itself
 *    disabled — `pi.on` is never called (S1).
 *  - **It is not the telemetry wiring.** Log writing and the measured sample are
 *    two wirings over two switches (S4); nothing here imports the accumulator,
 *    and nothing there knows about the journal.
 *  - **One entry per session, at the first boundary that arrives** (#623 S4). A
 *    settled run publishes the entry, so a host whose session never tears down
 *    still writes one; `session_shutdown` publishes it when no run settled first,
 *    and a later boundary writes nothing at all. It cannot write a second entry:
 *    the journal is append-only by the repository's own write gate, so "the
 *    latest entry" is not something a second write could produce.
 *  - **The marker goes at both boundaries.** A session that never shuts down used
 *    to leave its marker on disk forever; the run boundary removes it too, and
 *    `session_start` sweeps the ones a crash or an older build stranded (#623 S3).
 *  - **Nothing escapes.** Every failure — no journal, no marker, a broken git, a
 *    publisher that throws — is swallowed at this boundary: a session shutdown
 *    must never be blocked by a journal, and a lost copy must never cost the
 *    local entry (S10).
 */

import { createPublisherFromConfig, publishAll, DEFAULT_JOURNAL } from "@gtrabanco/agentic-workflow/src/log/publish.mjs";
import type { Publisher } from "@gtrabanco/agentic-workflow/src/log/publish.mjs";
import { JOURNAL_DIR } from "@gtrabanco/agentic-workflow/src/journal/fragment.mjs";

import { FRAGMENT_DIR, JOURNAL_PATH, buildFacts, createMarker, hasJournal, purgeStaleMarkers, removeMarker } from "../auto-log-session.js";
import type { GitReader, Marker } from "../auto-log-session.js";
import type { LogSessionConfig } from "../config/types.js";

/** The slice of `pi` the wiring needs. Pi hands every handler its context. */
export interface PiLike {
  on(event: string, handler: (event?: unknown, ctx?: unknown) => void): void;
}

/** The events this wiring listens to. */
export const AUTO_LOG_SESSION_EVENTS = Object.freeze(["session_start", "agent_settled", "session_shutdown"] as const);

/**
 * The renderer's reason grammar is a lowercase token (the hook's `exit`/`clear`/
 * `other`, pi's `quit`/`new`/`resume`/`fork`). A reason outside it — an event
 * name, a host-specific string — is normalized to `unknown` so the entry still
 * lands instead of being refused at the renderer (the local write must never be
 * lost to a reason the grammar does not know).
 */
const REASON_TOKEN = /^[a-z][a-z0-9-]*$/u;
export function normalizeShutdownReason(reason: unknown): string {
  return typeof reason === "string" && REASON_TOKEN.test(reason) ? reason : "unknown";
}

export interface AutoLogSessionWiringOptions {
  readonly root: string;
  /** The resolved switch: `false` registers nothing. */
  readonly enabled: boolean;
  /** The resolved publisher, or `null` for the local journal alone. */
  readonly publisher?: LogSessionConfig["publisher"];
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
  const fragmentDir = `${options.root}/${FRAGMENT_DIR}`;
  /** This session's id, captured at `session_start` — the fragment name's session slug (issue #405). */
  let currentSessionId: string | undefined;
  const publishers = createPublisherFromConfig(
    { publisher: options.publisher ?? null },
    { journalPath, cwd: options.root, fragmentDir, kind: "mechanical", sessionId: () => currentSessionId, now: options.now },
  );
  const all = options.extraPublishers ? [...publishers, ...options.extraPublishers] : publishers;

  /** This session's marker and id, held in memory — never read back from disk. */
  let marked: { sessionId: string; marker: Marker } | null = null;
  /** The session already published its entry: a later boundary writes nothing. */
  let published = false;

  /**
   * Publish this session's one entry, at whichever boundary reaches the marker
   * first, and remove the marker at that boundary. The reason is the event's own
   * — `settled` for a run boundary, the event's normalized token for a shutdown —
   * so an entry written at a settle says which boundary wrote it.
   */
  function publish(reason: unknown): void {
    if (published || marked === null) return;
    published = true;
    const { sessionId, marker } = marked;
    marked = null;
    try {
      const facts = buildFacts({
        root: options.root,
        marker,
        reason: normalizeShutdownReason(reason),
        now: options.now,
        git: options.git,
      });
      if (facts === null) return;
      publishAll(all, facts);
    } catch {
      // A journal write must never block a shutdown, and a settled run has no UI
      // left to nag. The fan-out's own result is dropped on purpose: no retry,
      // no queue, no report — the next session's entry is a new entry.
    } finally {
      removeMarker(options.root, sessionId);
    }
  }

  return {
    register(pi) {
      if (!options.enabled) return;

      pi.on("session_start", (_event, ctx) => {
        // The sweep runs before this session records anything, so a stranded
        // marker from a crashed session is removed and never becomes this
        // session's range: the sweep dates each file by its own recorded epoch.
        try {
          purgeStaleMarkers({ root: options.root, now: options.now });
        } catch {
          // A directory that cannot be read is not a reason to lose the session's
          // own marker below.
        }
        if (!hasJournal(options.root)) return;
        const sessionId = sessionIdOf(ctx);
        if (sessionId === undefined) return;
        currentSessionId = sessionId;
        try {
          const marker = createMarker({ root: options.root, sessionId, now: options.now, git: options.git });
          marked = marker === null ? null : { sessionId, marker };
        } catch {
          marked = null;
        }
      });

      // The reliable boundary (#623 S3/S4): a settled run is the last moment a
      // long-lived session is guaranteed to reach, so the entry lands there.
      pi.on("agent_settled", () => publish("settled"));

      pi.on("session_shutdown", (event) => publish((event as { reason?: unknown } | undefined)?.reason));
    },
  };
}

/** Re-exported so a caller names the shipped journal without importing the crate. */
export { DEFAULT_JOURNAL, JOURNAL_DIR };
