/**
 * Run journal — the one reader/writer of `advance`'s run log (issue #284).
 *
 * The log is a hint, never an authority: it answers exactly one question —
 * "did the last run reach a terminal row?" — and the reconcile behind
 * `advance --resume` decides everything else from ground truth (the sensor's
 * `crash_recovery` verdict, git, the docs).
 *
 * Row grammar (the shape the conductor has always written):
 *
 *   YYYY-MM-DD HH:MM — <kind>/<code> — <detail> — <k>/<cap>
 *
 * `detail` may itself contain the separator; only the first two cells and the
 * trailing `k/cap` cell are positional. Rows this module adds:
 *
 *   run/start        <run-id> pid=<pid>          — the run boundary opens
 *   run/stop         <stop-code|continue>        — the run boundary closes
 *   resume/detected  <run-id> iteration=<n> …    — a death was found
 *   resume/verdict:<CLEAN|RESUMABLE|AMBIGUOUS>   — the reconcile's outcome
 *   resume/halted    AMBIGUOUS                   — a human owns the next move
 *   supervisor/restart|exhausted                 — the operator restarter's rows
 *
 * A run with no `run/stop` is an interrupted run: the process died (SIGKILL,
 * OOM, redeploy) before it could close its own boundary. A clean stop, the
 * one-stage `--continue` hand-off and the iteration-cap stop all close it.
 */

const DATE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/u;
const TOKEN = /^([A-Za-z][A-Za-z0-9-]*)\/([A-Za-z0-9:_.-]+)$/u;
const COUNTER = /^(\d+)\/(\d+)$/u;

/** One parsed journal row. */
export interface JournalRow {
  /** `YYYY-MM-DD HH:MM`, the row writer's local clock. */
  at: string;
  /** The row's kind — `run`, `resume`, `supervisor`, `invoke`, `stop`, … */
  kind: string;
  /** The row's code within its kind — `start`, `stop`, `verdict:RESUMABLE`, … */
  code: string;
  /** Everything between the kind/code cell and the counter cell. */
  detail: string;
  /** The iteration counter (`k` in `k/cap`). */
  iteration: number;
  /** The run's iteration cap (`cap` in `k/cap`). */
  cap: number;
  /** The original line, byte for byte. */
  raw: string;
}

/** A run that opened its boundary and never closed it. */
export interface InterruptedRun {
  /** The run id the killed process wrote, when it got that far. */
  runId: string | null;
  /** The killed process's pid, when the start row carried one. */
  pid: number | null;
  /** The last iteration the journal records for that run (0 before any). */
  iteration: number;
  /** The last invocation that may have partially run. */
  lastInvocation: string | null;
}

/** `YYYY-MM-DD HH:MM` for a moment; local time, matching the historical log. */
export function formatJournalDate(now: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * The one row writer. Every journal row in the package goes through here, so
 * the reader above can never drift from the writer.
 */
export function formatJournalRow(
  kind: string,
  code: string,
  detail: string,
  iteration: number,
  cap: number,
  now: Date = new Date(),
): string {
  return `${formatJournalDate(now)} — ${kind}/${code} — ${detail} — ${iteration}/${cap}`;
}

/** Parse one line; `null` for prose, blank lines and malformed rows. */
export function parseJournalRow(line: string): JournalRow | null {
  if (typeof line !== "string") return null;
  const cells = line.split(" — ");
  if (cells.length < 4) return null;
  if (!DATE.test(cells[0])) return null;
  const token = TOKEN.exec(cells[1]);
  const counter = COUNTER.exec(cells[cells.length - 1]);
  if (!token || !counter) return null;
  return {
    at: cells[0],
    kind: token[1],
    code: token[2],
    detail: cells.slice(2, -1).join(" — "),
    iteration: Number.parseInt(counter[1], 10),
    cap: Number.parseInt(counter[2], 10),
    raw: line,
  };
}

/** Parse a whole log; unparseable lines are skipped, never guessed at. */
export function readJournal(text: string): JournalRow[] {
  if (typeof text !== "string" || text.length === 0) return [];
  const rows: JournalRow[] = [];
  for (const line of text.split("\n")) {
    const row = parseJournalRow(line);
    if (row) rows.push(row);
  }
  return rows;
}

/**
 * The last run's state: an interrupted run when its `run/start` was never
 * followed by a `run/stop`, `null` when the last run closed cleanly (or the
 * journal carries no run at all).
 */
export function interruptedRun(rows: JournalRow[]): InterruptedRun | null {
  let candidate: InterruptedRun | null = null;
  for (const row of rows) {
    if (row.kind === "run" && row.code === "start") {
      const runId = row.detail.split(" ")[0] || null;
      const pid = /(?:^|\s)pid=(\d+)/u.exec(row.detail);
      candidate = {
        runId,
        pid: pid ? Number.parseInt(pid[1], 10) : null,
        iteration: 0,
        lastInvocation: null,
      };
      continue;
    }
    if (row.kind === "run" && row.code === "stop") {
      candidate = null;
      continue;
    }
    if (candidate && row.kind === "invoke") {
      candidate.lastInvocation = row.detail;
      candidate.iteration = row.iteration;
    }
  }
  return candidate;
}
