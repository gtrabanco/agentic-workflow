/**
 * check.mjs — the runtime observation half of the progress-led guards
 * (issue #260 S6, delivered by the S11 edge amendment).
 *
 * Two deterministic tools the orchestrator runs around a spawned trial:
 *
 * `checkTrial` — the check-in. It reads the trial's recorded receipt and
 * emits a verdict **with data**: within the estimate, over the estimate (the
 * check-in message names the task, the declared expectation and the elapsed
 * time, and orders "wait explicitly, investigate, or stop" — killing is never
 * the first response), unmeasurable (the brief carried no machine-readable
 * `expected_seconds` — declare it at admit time), or bound-killed (the receipt
 * already says the trial hit its hard bound; re-decide, never retry blind).
 * A `--pid` reading (process state + cumulative CPU, against the previous
 * reading) is appended when given: "is it moving", not "is it consuming".
 *
 * `boundLine` — the S6 layer-A trial envelope: the exact `systemd-run --user
 * --scope` line that bounds the trial (soft MemoryHigh throttles, hard
 * MemoryMax discovers "does not fit" cheaply, CPUQuota throttles) plus the
 * `systemctl show` line that reads the receipt after exit (MemoryPeak,
 * CPUPeak, ExecMainStatus — the OOM-kill evidence). Derived from the
 * `detectHost` envelope; the runtime layer decides overlap, these lines only
 * bound the trial.
 *
 * Read-only: nothing here writes. Tests inject the pid readings and the
 * elapsed time; the CLI reads /proc when asked for a live pid.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const CHECK_CONTRACT_ID = "resources-check@1";

/** A refused check (the caller's error: an unknown trial, a bad duration). */
export class CheckError extends Error {
  constructor(message) {
    super(message);
    this.name = "CheckError";
  }
}

/** Parse a machine duration — "90s", "47m", "2h", "1500ms". Prose ("about 5
 * minutes") is deliberately refused: the check compares numbers, the prose
 * expectation travels in the message. */
export function parseDuration(text) {
  const m = typeof text === "string" && text.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)$/u);
  if (!m) throw new CheckError(`expected a machine duration ("<n>ms|s|m|h"), got ${JSON.stringify(text)}`);
  const n = Number(m[1]);
  return m[2] === "ms" ? n / 1000 : m[2] === "s" ? n : m[2] === "m" ? n * 60 : n * 3600;
}

function formatSeconds(s) {
  if (s >= 3600 && s % 3600 === 0) return `${s / 3600}h`;
  if (s >= 60 && s % 60 === 0) return `${s / 60}m`;
  return `${s}s`;
}

function readReceipt(recordDir, task) {
  const receiptsDir = join(recordDir, "receipts");
  if (!existsSync(receiptsDir)) return null;
  let found = null;
  for (const name of readdirSync(receiptsDir)) {
    if (!name.endsWith(".json")) continue;
    try {
      const rec = JSON.parse(readFileSync(join(receiptsDir, name), "utf8"));
      if (rec.task === task && (!found || (rec.recordedAt ?? "") > (found.recordedAt ?? ""))) found = rec;
    } catch {
      // an unreadable receipt is not evidence; skip it
    }
  }
  return found;
}

function describePid(pid) {
  if (!pid) return "";
  if (typeof pid.state !== "string" || typeof pid.cpuSeconds !== "number") {
    throw new CheckError("pid readings must carry state and cpuSeconds");
  }
  const prev = typeof pid.prevCpuSeconds === "number" ? pid.prevCpuSeconds : null;
  const moving = prev === null ? null : pid.cpuSeconds > prev;
  const reading =
    moving === null
      ? `cpu ${pid.cpuSeconds.toFixed(1)}s cumulative (no previous reading to compare)`
      : moving
        ? `cpu advancing (${pid.cpuSeconds.toFixed(1)}s cumulative, was ${prev.toFixed(1)}s)`
        : `cpu stalled (${pid.cpuSeconds.toFixed(1)}s cumulative, unchanged from ${prev.toFixed(1)}s)`;
  return ` process state ${pid.state}; ${reading}.`;
}

/**
 * checkTrial({ task, recordDir, elapsedSeconds?, now?, pid?, allowUnknownForPid? })
 * — the check-in verdict. Throws CheckError on the caller's errors (unknown
 * trial without `allowUnknownForPid`, malformed duration); every measured
 * verdict returns exit-0 information — the orchestrator decides, the check
 * never kills. Returns `{ contract, task, verdict, message, receipt, recordDir }`.
 */
export function checkTrial({ task, recordDir, elapsedSeconds = null, now = null, pid = null, allowUnknownForPid = false }) {
  if (typeof task !== "string" || task.trim() === "") throw new CheckError("task id is required");
  if (typeof recordDir !== "string" || recordDir === "") throw new CheckError("recordDir is required");

  const receipt = readReceipt(recordDir, task);
  if (!receipt) {
    if (allowUnknownForPid && pid) {
      const message = `task ${task}: no recorded trial (the admission check was not run through a record dir) — the live reading:${describePid(pid)}`;
      return { contract: CHECK_CONTRACT_ID, task, verdict: "unknown-trial", message, receipt: null, recordDir };
    }
    throw new CheckError(`no recorded trial for task "${task}" in ${recordDir} — admit it first (resources admit)`);
  }

  const pidText = describePid(pid);

  if (receipt.verdict === "bound-kill") {
    return {
      contract: CHECK_CONTRACT_ID,
      task,
      verdict: "bound-killed",
      message: `task ${task}: the trial hit its hard bound (peak ${receipt.peak ?? "unknown"}) — re-decide with the receipt (split the task, shrink it, or a bigger host); re-running unchanged is blocked.`,
      receipt,
      recordDir,
    };
  }

  let elapsed = elapsedSeconds;
  if (elapsed === null) {
    if (!receipt.recordedAt) throw new CheckError(`the receipt for "${task}" carries no recordedAt and no --elapsed was given`);
    const base = now ?? Date.now();
    elapsed = Math.max(0, Math.round((base - Date.parse(receipt.recordedAt)) / 1000));
  }
  if (!Number.isFinite(elapsed) || elapsed < 0) throw new CheckError(`elapsed must be a non-negative number of seconds`);

  const expected = receipt.expect?.expected_seconds;
  if (!Number.isFinite(expected)) {
    return {
      contract: CHECK_CONTRACT_ID,
      task,
      verdict: "unmeasurable",
      message: `task ${task}: the brief declared no machine-readable expected_seconds (prose only: ${JSON.stringify(receipt.expect?.expected_duration ?? "")}) — declare it at admit time so the check-in can compare.${pidText}`,
      receipt,
      recordDir,
    };
  }

  if (elapsed <= expected) {
    return {
      contract: CHECK_CONTRACT_ID,
      task,
      verdict: "within-estimate",
      message: `task ${task}: ${formatSeconds(elapsed)} elapsed, within the declared ${formatSeconds(expected)} (${JSON.stringify(receipt.expect?.expected_duration ?? "")}).${pidText}`,
      receipt,
      recordDir,
    };
  }

  return {
    contract: CHECK_CONTRACT_ID,
    task,
    verdict: "over-estimate",
    message: `task ${task}: ${formatSeconds(elapsed)} elapsed against the declared ${formatSeconds(expected)} (${JSON.stringify(receipt.expect?.expected_duration ?? "")}) — wait explicitly, investigate, or stop; the decision is yours, this check never kills.${pidText}`,
    receipt,
    recordDir,
  };
}

/** Read the live pid readings for the CLI: state char + cumulative CPU seconds
 * from /proc/<pid>/stat (utime+stime in clock ticks; 100 ticks/s is the
 * common CLK_TCK — the cumulative comparison, not the absolute, is what the
 * check-in reports, and a same-host comparison is exact under any tick rate). */
export function readPidLive(pid) {
  let stat;
  try {
    stat = readFileSync(`/proc/${pid}/stat`, "utf8");
  } catch {
    return { state: "gone", cpuSeconds: null, prevCpuSeconds: null };
  }
  // the comm field may contain spaces — split after the last ')'
  const rest = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
  const state = rest[0];
  const utime = Number(rest[11]);
  const stime = Number(rest[12]);
  return { state, cpuSeconds: (utime + stime) / 100, prevCpuSeconds: null };
}

const MB = 1024 ** 2;

/**
 * boundLine({ task, envelope, command }) — the S6 layer-A lines for one
 * trial, derived from the detectHost envelope: soft MemoryHigh (90% of the
 * effective limit, throttles), hard MemoryMax (the effective limit, discovers
 * "does not fit" cheaply), CPUQuota (the thread envelope), plus the
 * `systemctl show` receipt read. Deterministic for the same inputs.
 */
export function boundLine({ task, envelope, command }) {
  if (typeof task !== "string" || task.trim() === "") throw new CheckError("task id is required");
  if (!envelope?.memory?.effectiveLimitBytes) throw new CheckError("envelope must be a detectHost() result");
  if (typeof command !== "string" || command.trim() === "") throw new CheckError("command is required");
  const maxMb = Math.max(1, Math.floor(envelope.memory.effectiveLimitBytes / MB));
  const highMb = Math.max(1, Math.floor(maxMb * 0.9));
  const quota = `${Math.max(100, envelope.threads * 100)}%`;
  const unit = `task-${task}`; // the runtime appends a uuid when it needs uniqueness across concurrent trials
  const run =
    `systemd-run --user --scope -p MemoryHigh=${highMb}M -p MemoryMax=${maxMb}M -p CPUQuota=${quota} ` +
    `--unit=${unit} ${command}`;
  const show = `systemctl --user show ${unit}.scope -p MemoryPeak,CPUPeak,ExecMainStatus`;
  return `${run}\n${show}`;
}
