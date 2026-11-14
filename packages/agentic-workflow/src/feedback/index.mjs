/**
 * feedback.mjs — the CLI feedback channel (issue #424).
 *
 * Every command the workflow ships works silently: a user cannot tell a busy
 * machine from a frozen one. This module is the one home of the reporting
 * contract, in three cumulative tiers (the published `FEEDBACK_TIERS`):
 *
 *   regular — start, stage, progress (with a remaining estimate) and done with
 *             its duration. Minimal: it answers "is it working, and how long".
 *   debug   — `--debug`: every unit of work and every stage's cost, plus the
 *             command's own provider/diagnostic detail.
 *   profile — `--profile`: `--debug` plus a per-stage table (milliseconds,
 *             share of the total, the total, the named bottleneck).
 *
 * Three invariants the rest of the tree depends on:
 *
 *   * **stderr only.** Feedback is diagnostics, never a machine receipt: stdout
 *     and the envelope are untouched, so every consumer that parses stdout
 *     keeps working with no flag and with any flag (`--json-only` included).
 *   * **quiet until it matters.** `attach()` is the universal attachment: a run
 *     announces itself only once it is still working at
 *     `FEEDBACK_START_AFTER_MS`, so a fast command adds nothing to a hook, a CI
 *     log or a scripted pipe, while a command that would feel frozen speaks up
 *     inside a quarter second and always reports its duration when it ends. A
 *     command that knows it is long-running (`doc`) announces itself through
 *     `stage()`, which flushes the same start line immediately.
 *   * **no environment sniffing.** The channel never asks whether stderr is a
 *     terminal: an output that depends on the environment is a defect class this
 *     repository's gates refuse, and it would make the lines untestable.
 *
 * The clock, the writer, the timer and the exit-hook registration are all
 * injectable seams, so the suite drives every tier on a fake clock instead of
 * racing a real one. Nothing here writes to fd 1.
 */

import { writeSync } from "node:fs";

/**
 * The three tiers, in precedence order. Exported as a frozen literal array
 * because it is a published vocabulary: `AGENTS.md`'s `normative-surfaces@1`
 * binds it through its `schema-export:` row, so the flags an agent may pass and
 * the values the module accepts cannot drift apart.
 */
export const FEEDBACK_TIERS = Object.freeze(["regular", "debug", "profile"]);

/**
 * How long a universally-attached run may stay silent before it announces
 * itself. Below this a command finishes first and prints nothing: the failure
 * this channel exists for is the run that takes long enough to look frozen.
 */
export const FEEDBACK_START_AFTER_MS = 250;

/** How often the regular tier repeats a progress line. */
export const FEEDBACK_PROGRESS_EVERY_MS = 100;

/** The estimate is only printed once it is worth reading, in milliseconds. */
const ESTIMATE_FLOOR_MS = 1000;

const MARK = "feedback: ";

/**
 * A duration as the lines print it: `820ms`, `1.24s`, `59.40s`, `2m 03s`.
 * Sub-second work keeps its milliseconds because that is the scale a slow
 * refusal or a single query lives on.
 *
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  const value = Number.isFinite(ms) && ms > 0 ? ms : 0;
  if (value < 1000) return `${Math.round(value)}ms`;
  if (value < 60_000) return `${(value / 1000).toFixed(2)}s`;
  const minutes = Math.floor(value / 60_000);
  const seconds = Math.round((value % 60_000) / 1000);
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

/**
 * Split the tier flags out of an argument vector.
 *
 * The tier flags are universal: they are consumed here, once, before any
 * command's own grammar runs — `doc`'s grammar is closed and would call
 * `--debug` an unknown flag, and every other command's is closed the same way.
 * `--profile` outranks `--debug` (a run carrying both is profiled: the profile
 * tier is the superset) rather than inventing a refusal the issue never asked
 * for.
 *
 * @param {string[]} argv
 * @returns {{tier: "regular"|"debug"|"profile", args: string[]}}
 */
export function parseFeedbackArgs(argv) {
  const list = Array.isArray(argv) ? argv : [];
  const args = [];
  let tier = "regular";
  for (const arg of list) {
    if (arg === "--debug") {
      if (tier !== "profile") tier = "debug";
      continue;
    }
    if (arg === "--profile") {
      tier = "profile";
      continue;
    }
    args.push(arg);
  }
  return { tier, args };
}

/** Whether a value is one of the published tiers. */
const isTier = (value) => FEEDBACK_TIERS.includes(value);

/**
 * The channel. Every method is safe to call on any tier: a call the tier does
 * not cover prints nothing, so a caller never branches on the tier.
 *
 * @param {{
 *   tier?: "regular"|"debug"|"profile",
 *   quiet?: boolean,
 *   subject?: string,
 *   now?: () => number,
 *   write?: (line: string) => void,
 *   schedule?: (fn: () => void, ms: number) => { unref?: () => void } | undefined,
 *   register?: (fn: (code?: number) => void) => void,
 *   startAfterMs?: number,
 *   progressEveryMs?: number,
 * }} [options]
 */
export function createFeedback(options = {}) {
  const tier = isTier(options.tier) ? options.tier : "regular";
  const quiet = options.quiet === true;
  const subject = options.subject ?? "agentic-workflow";
  const now = options.now ?? (() => Date.now());
  // One synchronous write to fd 2: the exit hook runs after the event loop has
  // drained, where a buffered stream write can be lost on a pipe.
  const write = options.write ?? ((line) => writeSync(2, `${line}\n`));
  const schedule =
    options.schedule ??
    ((fn, ms) => {
      const timer = setTimeout(fn, ms);
      // Never keep the process alive for a progress line.
      if (typeof timer.unref === "function") timer.unref();
      return timer;
    });
  const register = options.register ?? ((fn) => void process.on("exit", fn));
  const startAfterMs = options.startAfterMs ?? FEEDBACK_START_AFTER_MS;
  const progressEveryMs = options.progressEveryMs ?? FEEDBACK_PROGRESS_EVERY_MS;

  const beganAt = now();
  const stages = [];
  let announced = false;
  let finished = false;
  let lastProgressAt = null;
  let stageStartedAt = null;
  let openStage = null;
  let profilePrinted = false;

  const allowed = (kind) => {
    if (kind === "regular") return tier === "regular" && !quiet;
    if (kind === "diagnostic") return tier !== "regular";
    return tier === "profile";
  };
  /** Whether the tier writes anything at all (`--quiet` mutes only the regular one). */
  const speaks = () => tier !== "regular" || !quiet;

  /** The start line: printed by the first event, or by the threshold timer. */
  function announce() {
    if (announced) return;
    announced = true;
    if (speaks()) write(`${MARK}start ${subject}`);
  }

  function closeStage() {
    if (openStage === null) return;
    const cost = now() - stageStartedAt;
    stages.push({ name: openStage, ms: cost });
    if (allowed("diagnostic")) write(`${MARK}stage ${openStage} · ${formatDuration(cost)}`);
    openStage = null;
    stageStartedAt = null;
  }

  const channel = {
    tier,

    /** Announce now, whatever the threshold says. */
    start() {
      announce();
    },

    /**
     * Run one named stage. The regular tier prints the stage's name when it
     * starts; the diagnostic tiers print its cost when it ends (a second line
     * for the same stage would be the noise `--debug` exists to avoid); the
     * profile tier records it for the table.
     *
     * @template T
     * @param {string} name
     * @param {() => T} fn
     * @returns {T}
     */
    stage(name, fn) {
      announce();
      closeStage();
      if (allowed("regular")) write(`${MARK}stage ${name}`);
      openStage = name;
      stageStartedAt = now();
      try {
        return fn();
      } finally {
        closeStage();
      }
    },

    /**
     * One unit of work done out of a known total. The regular tier prints the
     * first tick, one per interval and the last tick (so a reader always sees
     * the work move and always sees it end); the diagnostic tiers print every
     * tick and append the unit's own detail.
     *
     * @param {{done: number, total: number, unit?: string, detail?: string}} event
     */
    progress({ done, total, unit = "", detail = "" } = {}) {
      closeStage();
      announce();
      if (allowed("regular")) {
        const atEnd = done >= total;
        const first = lastProgressAt === null;
        if (!atEnd && !first && now() - lastProgressAt < progressEveryMs) return;
        lastProgressAt = now();
        const percent = total > 0 ? Math.floor((done / total) * 100) : 0;
        const noun = unit === "" ? "" : ` ${unit}`;
        let line = `${MARK}progress ${done}/${total}${noun} (${percent}%)`;
        const estimate = total > 0 && done > 0 ? ((now() - beganAt) * (total - done)) / done : 0;
        if (estimate >= ESTIMATE_FLOOR_MS) line += ` · ~${formatDuration(estimate)} left`;
        write(line);
        return;
      }
      if (allowed("diagnostic")) {
        const percent = total > 0 ? Math.floor((done / total) * 100) : 0;
        const noun = unit === "" ? "" : ` ${unit}`;
        const suffix = detail === "" ? "" : ` · ${detail}`;
        write(`${MARK}progress ${done}/${total}${noun} (${percent}%)${suffix}`);
      }
    },

    /** A diagnostic line — printed at `--debug` and above, never at regular. */
    detail(message) {
      if (!allowed("diagnostic")) return;
      announce();
      write(`${MARK}detail ${message}`);
    },

    /**
     * The closing line. Called by a command that knows a better summary than
     * "exit 0", or by the exit hook for everything else; the first call wins, so
     * the summary a command supplies is never overwritten by the hook.
     *
     * @param {string} summary
     */
    done(summary) {
      if (finished) return;
      finished = true;
      closeStage();
      if (announced && speaks()) write(`${MARK}done ${subject} · ${summary} · ${formatDuration(now() - beganAt)}`);
      channel.profile();
    },

    /**
     * The profile table: per-stage milliseconds, share, total and bottleneck. A
     * command that declares no stages still answers — the whole run is one
     * `run` row — so `--profile` is never silent about where the time went.
     */
    profile() {
      if (!allowed("profile") || profilePrinted) return;
      profilePrinted = true;
      const elapsed = now() - beganAt;
      const rows = stages.length > 0 ? stages : [{ name: "run", ms: elapsed }];
      const total = rows.reduce((sum, stage) => sum + stage.ms, 0);
      const share = (ms) => (total > 0 ? Math.round((ms / total) * 100) : 0);
      const width = Math.max(...rows.map((s) => s.name.length));
      const lines = [`FEEDBACK PROFILE — ${subject} · total ${formatDuration(elapsed)}`];
      for (const stage of rows) {
        lines.push(`  ${stage.name.padEnd(width)}  ${`${Math.round(stage.ms)}ms`.padStart(6)}  ${share(stage.ms)}%`);
      }
      const bottleneck = rows.reduce((worst, stage) => (stage.ms > worst.ms ? stage : worst), rows[0]);
      lines.push(
        `  bottleneck: ${bottleneck.name} (${Math.round(bottleneck.ms)}ms, ${share(bottleneck.ms)}% of total)`,
      );
      for (const line of lines) write(line);
    },

    /**
     * The universal attachment: announce once the run is still working at the
     * threshold, and report the exit in the closing line. Idempotent — the bin
     * installs it once for the whole process.
     */
    attach() {
      if (tier !== "regular") announce();
      else if (startAfterMs > 0) schedule(() => announce(), startAfterMs);
      else announce();
      register((code) => {
        channel.done(`exit ${code ?? process.exitCode ?? 0}`);
      });
    },
  };

  return channel;
}

/**
 * The no-op channel: every method takes the same arguments and does nothing, so
 * a caller that has no channel (a suite, the pi package's renderer, an engine
 * embedded in another program) needs no branch. `stage` still runs the work and
 * returns its result.
 */
export const NO_FEEDBACK = Object.freeze({
  tier: "regular",
  start() {},
  stage(_name, fn) {
    return fn();
  },
  progress() {},
  detail() {},
  done() {},
  profile() {},
  attach() {},
});
