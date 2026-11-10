#!/usr/bin/env node
/**
 * The root gate — `scripts/*.test.mjs`, one command.
 *
 * Two environment facts a test suite must not inherit from the machine it runs
 * on, both of which turn a green gate red for reasons that have nothing to do
 * with the code under test:
 *
 *  - `commit.gpgsign=true` in the operator's global git config. Dozens of
 *    fixtures `git init` a throwaway repository and commit into it; with signing
 *    on, every one of those goes to a pinentry that has no tty, so the failure
 *    is `gpg failed to sign the data: Inappropriate ioctl for device` — under
 *    load it surfaces as `Cannot allocate memory`. CI never sees it (runners
 *    sign nothing), so this is a local-only flake that reads like a real defect
 *    and appears in whichever suite happens to be running.
 *  - A caller-provided `GIT_CONFIG_*` / `GIT_AUTHOR_*` set that would pin the
 *    fixtures to the caller's identity or signing key.
 *
 * A fixture repository is disposable: it has no business signing. The gate
 * therefore runs the suites with signing disabled for anything that does not
 * opt in, and leaves `GIT_DEFAULT_BRANCH`, the identity and the rest of the
 * environment alone — a suite that wants to prove signing behaviour can set
 * `commit.gpgsign` itself.
 *
 * Usage
 *   bun scripts/run-root-suite.mjs            # every suite, one worker per CPU
 *   bun scripts/run-root-suite.mjs --bail     # stop at the first failing suite
 *   bun scripts/run-root-suite.mjs --jobs 2   # cap the worker count
 *   bun scripts/run-root-suite.mjs <suite…>   # a subset, in the order given
 *
 * The suites run in a bounded worker pool (unit 100): one worker per CPU by
 * default, each worker pulling the next suite as soon as it frees — the same
 * per-file invocation the per-suite rule prescribes, so a suite is isolated in
 * its own process exactly as `bun test scripts/<file>.test.mjs` runs it and as
 * node's runner already does. `--bail` stops the dispatch at the first red and
 * kills the suites still in flight; without it every suite runs and the first
 * failing status is forwarded verbatim. `--jobs 1` runs one suite at a time.
 *
 * Exit: 0 every selected suite passed; otherwise the first failing suite's own
 * status.
 */

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { scrubGitLocator } from "./git-env.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The execution bounds (issue #493) and where the annotated allowlist lives. */
export const DEFAULT_SUITE_TIMEOUT_MS = 120_000;
export const DEFAULT_SUITE_MEM_CAP_MB = 1536;
export const DEFAULT_TEST_TIMEOUT_MS = 10_000;
export const ALLOWLIST_PATH = path.join(REPO_ROOT, "scripts", "test-timeout-allowlist.json");

/** Every root suite, discovered the same way the shell glob does. */
function suites() {
  return fs
    .readdirSync(path.join(REPO_ROOT, "scripts"))
    .filter((name) => name.endsWith(".test.mjs"))
    .sort()
    .map((name) => path.join("scripts", name));
}

/** The default worker count: one worker per CPU, never fewer than one. */
export function defaultJobs() {
  return Math.max(1, os.availableParallelism?.() ?? os.cpus().length);
}

/** `--bail`, `--jobs <n>`, the execution bounds (`--suite-timeout`,
 *  `--suite-mem-cap`) and the selected suites; everything else is a suite path. */
export function parseArgs(argv) {
  const parsed = {
    bail: false,
    jobs: null,
    selected: [],
    suiteTimeoutMs: DEFAULT_SUITE_TIMEOUT_MS,
    suiteMemCapMb: DEFAULT_SUITE_MEM_CAP_MB,
  };
  const positiveInteger = (flag, value) => {
    if (value === undefined || !/^\d+$/.test(value) || Number(value) < 1) {
      throw new Error(`${flag} needs a positive integer${value === undefined ? "" : `, got ${JSON.stringify(value)}`}`);
    }
    return Number(value);
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--bail") {
      parsed.bail = true;
    } else if (arg === "--jobs") {
      parsed.jobs = positiveInteger("--jobs", argv[index + 1]);
      index += 1;
    } else if (arg === "--suite-timeout") {
      parsed.suiteTimeoutMs = positiveInteger("--suite-timeout", argv[index + 1]) * 1000;
      index += 1;
    } else if (arg === "--suite-mem-cap") {
      parsed.suiteMemCapMb = positiveInteger("--suite-mem-cap", argv[index + 1]);
      index += 1;
    } else if (arg === "--") {
      continue;
    } else {
      parsed.selected.push(arg);
    }
  }
  return parsed;
}

/**
 * The bounded worker pool. `jobs` workers pull from a shared queue, so a slow
 * suite never leaves a finished worker idle; each suite gets its own process.
 * `bail` aborts the signal on the first red — stopping the dispatch and
 * killing the in-flight suites — and the returned exit status is the first
 * failing suite's own.
 */
export async function runSuites({ suites: files, jobs, bail = false, spawnSuite, onResult }) {
  const controller = new AbortController();
  const queue = [...files];
  let next = 0;
  let firstFailure = null;

  const worker = async () => {
    while (next < queue.length && !(bail && firstFailure)) {
      const file = queue[next];
      next += 1;
      const result = await spawnSuite(file, controller.signal);
      onResult?.(file, result);
      if ((result.status ?? 1) !== 0 && firstFailure === null) {
        firstFailure = result;
        if (bail) controller.abort();
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, jobs ?? 1) }, worker));
  return firstFailure ? firstFailure.status ?? 1 : 0;
}

/**
 * The annotated per-test budget allowlist (issue #493 S4): one entry per suite
 * that legitimately needs more per test than the 10 s default, each naming its
 * own budget, the reason and the measured cost. A missing file is an empty
 * allowlist; anything malformed, incomplete or pointing outside `scripts/`
 * `*.test.mjs` is refused — a silent no-op would re-arm exactly the trap the
 * allowlist exists to disarm.
 */
export function readAllowlist(file = ALLOWLIST_PATH) {
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return new Map();
    throw error;
  }
  let entries;
  try {
    entries = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${path.basename(file)} is malformed: ${error.message}`);
  }
  if (!Array.isArray(entries)) {
    throw new Error(`${path.basename(file)} must hold a JSON array of entries`);
  }
  const allowlist = new Map();
  for (const entry of entries) {
    const where = `${path.basename(file)}: entry ${JSON.stringify(entry.path ?? entry)}`;
    if (typeof entry.path !== "string" || !/^scripts\/[\w./-]+\.test\.mjs$/u.test(entry.path)) {
      throw new Error(`${where} — path must be a scripts/*.test.mjs relative path`);
    }
    if (!Number.isInteger(entry.timeoutMs) || entry.timeoutMs < 1) {
      throw new Error(`${where} — timeoutMs must be a positive integer`);
    }
    if (typeof entry.reason !== "string" || entry.reason.trim() === "") {
      throw new Error(`${where} — reason is required; a slow test is justified in writing`);
    }
    if (typeof entry.measured !== "string" || entry.measured.trim() === "") {
      throw new Error(`${where} — measured is required; the cost is recorded, never assumed`);
    }
    allowlist.set(entry.path, { timeoutMs: entry.timeoutMs, reason: entry.reason, measured: entry.measured });
  }
  return allowlist;
}

/** The per-test budget a suite's runner receives: its allowlist entry's own
 *  budget, or the 10 s default. */
export function testBudgetFor(file, allowlist) {
  return allowlist.get(file)?.timeoutMs ?? DEFAULT_TEST_TIMEOUT_MS;
}

// `-c commit.gpgsign=false` applies to commands this process spawns only; the
// suites also `git init` fresh repositories, whose own config starts empty and
// inherits this as the system/global layer.
// Bun uses `bun test <files>` (subcommand), Node uses `node --test <files>` (flag).
// The per-test budget defaults to 10s (issue #493 S4); scripts/test-timeout-allowlist.json
// carries the suites that measured above it, with the reason and the cost.
const isBun = process.execPath.includes("bun");
const childEnv = scrubGitLocator({
  ...process.env,
  GIT_CONFIG_COUNT: String(Number(process.env.GIT_CONFIG_COUNT ?? 0) + 1),
  [`GIT_CONFIG_KEY_${process.env.GIT_CONFIG_COUNT ?? 0}`]: "commit.gpgsign",
  [`GIT_CONFIG_VALUE_${process.env.GIT_CONFIG_COUNT ?? 0}`]: "false",
  // A suite never inherits its parent's test-runner context: with
  // NODE_TEST_CONTEXT set, `node --test <file>` skips the file entirely and
  // exits 0 — a silent pass for every suite (observed when the gate itself is
  // exercised from inside a node test run; issue #493).
  NODE_TEST_CONTEXT: undefined,
});

export function argvFor(file, bail, testTimeoutMs, runtime = isBun ? "bun" : "node") {
  const budget = `--${runtime === "bun" ? "" : "test-"}timeout=${testTimeoutMs}`;
  return runtime === "bun"
    ? ["test", budget, ...(bail ? ["--bail=1"] : []), file]
    : ["--test", budget, file];
}

/** The RSS of a process tree, in bytes — sampled portably (`ps` walks pid and
 *  ppid on Linux and macOS alike). A host where `ps` cannot answer gets an
 *  inert watchdog tick, never a broken gate. */
export function rssOfTree(pid) {
  let lines;
  try {
    lines = execFileSync("ps", ["-axo", "pid=,ppid=,rss="], { encoding: "utf8" });
  } catch {
    return null;
  }
  const rows = new Map();
  for (const line of lines.split("\n")) {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)$/);
    if (match) rows.set(Number(match[1]), { ppid: Number(match[2]), rssKb: Number(match[3]) });
  }
  if (!rows.has(pid)) return null;
  let totalKb = rows.get(pid).rssKb;
  const walk = (root) => {
    for (const [rowPid, row] of rows) {
      if (row.ppid === root) {
        totalKb += row.rssKb;
        walk(rowPid);
      }
    }
  };
  walk(pid);
  return totalKb * 1024;
}

const WATCHDOG_INTERVAL_MS = 250;

function spawnReal(file, bail, signal, bounds, testTimeoutMs) {
  const suiteTimeoutMs = bounds?.suiteTimeoutMs ?? DEFAULT_SUITE_TIMEOUT_MS;
  const suiteMemCapMb = bounds?.suiteMemCapMb ?? DEFAULT_SUITE_MEM_CAP_MB;
  // `detached` gives the suite its own process group, so a bound-kill takes the
  // whole tree down — node's runner spawns a child per file, and killing only
  // the runner would orphan the hung one (issue #493).
  const child = spawn(process.execPath, argvFor(file, bail, testTimeoutMs), {
    cwd: REPO_ROOT,
    env: childEnv,
    signal,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const killTree = () => {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      try {
        child.kill("SIGKILL");
      } catch {
        /* already gone */
      }
    }
  };
  const chunks = [];
  const started = Date.now();
  child.stdout.on("data", (chunk) => chunks.push(chunk));
  child.stderr.on("data", (chunk) => chunks.push(chunk));

  // The bounds are external on purpose (issue #493, PE-002): a runner's own
  // timer-based timeout is dead in a microtask-starved loop, so the gate kills
  // by signal and names the verdict.
  let verdict = null;
  const wallClock = setTimeout(() => {
    verdict = "SUITE TIMEOUT";
    killTree();
  }, suiteTimeoutMs);
  const watchdog = setInterval(() => {
    if (verdict) return;
    const rss = rssOfTree(child.pid);
    if (rss !== null && rss > suiteMemCapMb * 1024 * 1024) {
      verdict = "SUITE MEMORY CAP";
      killTree();
    }
  }, WATCHDOG_INTERVAL_MS);
  signal?.addEventListener("abort", killTree, { once: true });

  return new Promise((resolve) => {
    child.on("close", (status) => {
      clearTimeout(wallClock);
      clearInterval(watchdog);
      resolve({ status: verdict ? 1 : status ?? 1, output: Buffer.concat(chunks), ms: Date.now() - started, verdict });
    });
    child.on("error", () => {
      clearTimeout(wallClock);
      clearInterval(watchdog);
      resolve({ status: 1, output: Buffer.concat(chunks), ms: Date.now() - started, verdict });
    });
  });
}

async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`root gate: ${error.message}\n`);
    process.stderr.write("usage: bun scripts/run-root-suite.mjs [--bail] [--jobs <n>] [--suite-timeout <s>] [--suite-mem-cap <mb>] [<suite…>]\n");
    return 2;
  }
  let allowlist;
  try {
    allowlist = readAllowlist();
  } catch (error) {
    process.stderr.write(`root gate: ${error.message}\n`);
    return 2;
  }
  const selected = parsed.selected.length > 0 ? parsed.selected : suites();
  const jobs = parsed.jobs ?? Math.max(1, Math.min(defaultJobs(), selected.length));
  const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;

  process.stdout.write(
    `root gate: ${selected.length} suite(s) · ${jobs} worker(s) · fail-fast ${parsed.bail ? "on" : "off"} · ` +
      `suite bound ${seconds(parsed.suiteTimeoutMs)} · mem cap ${parsed.suiteMemCapMb} MB\n`,
  );
  return runSuites({
    suites: selected,
    jobs,
    bail: parsed.bail,
    spawnSuite: (file, signal) => spawnReal(file, parsed.bail, signal, parsed, testBudgetFor(file, allowlist)),
    onResult: (file, result) => {
      if ((result.status ?? 1) === 0) {
        process.stdout.write(`PASS ${file} (${seconds(result.ms)})\n`);
        return;
      }
      process.stdout.write(`FAIL ${file} (${seconds(result.ms)})${result.verdict ? ` — ${result.verdict}` : ""}\n`);
      const output = result.output.toString().trim();
      if (output) process.stdout.write(`${output}\n`);
    },
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv.slice(2)));
}
