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
 * `packages/agentic-workflow-schema/dist/` is a gitignored build output and
 * `main` in that package points at it, so the contract suites read whatever
 * build happens to sit on disk. A stale one turns them red with assertions that
 * read like a broken contract (`TRIAGE_VERDICTS is not iterable`), which is
 * issue #571: this runner therefore brings that build up to date **before** it
 * dispatches, and says so in one line on stderr. It runs the package's own
 * `build` script through the package manager of the runtime that launched it
 * (bun under bun, npm under node) instead of carrying a second copy of what
 * "the build" means. Three outcomes, each named: a rebuild proceeds silently
 * into the pool; a package manager that does not exist here prints why and the
 * suites still run (an unprovisioned tree keeps its previous behaviour); a
 * build that runs and fails stops the run with the compiler's own output,
 * because a tree that does not compile must not report contract results from
 * the build before it. A diagnostic only.
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

import { spawn, spawnSync, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { scrubGitEnv } from "./git-env.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The execution bounds (issue #493) and where the annotated allowlist lives. */
export const DEFAULT_SUITE_TIMEOUT_MS = 120_000;
export const DEFAULT_SUITE_MEM_CAP_MB = 1536;
export const DEFAULT_TEST_TIMEOUT_MS = 10_000;
export const ALLOWLIST_PATH = path.join(REPO_ROOT, "scripts", "test-timeout-allowlist.json");

/** The root gate's own suite tree and spawn directory (issue #598 S4: the same
 *  pool runs a package's tree through `--dir`/`--cwd`). */
export const SUITE_DIR = "scripts";
export const REPO_ROOT_DIR = ".";

/** The schema package whose gitignored build the contract suites read (issue #571). */
export const SCHEMA_PACKAGE_DIR = path.join(REPO_ROOT, "packages", "agentic-workflow-schema");

/** A compiler run that outlives this is a wedged toolchain, not a slow build. */
const SCHEMA_BUILD_TIMEOUT_MS = 300_000;

/** Every file under `dir` whose name matches `pattern`, relative and sorted.
 *  An absent directory is an empty list: the predicate reports what it sees. */
function relativeTree(dir, pattern, readdir) {
  const found = [];
  const walk = (current, prefix) => {
    let entries;
    try {
      entries = readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(path.join(current, entry.name), rel);
      else if (pattern.test(entry.name)) found.push(rel);
    }
  };
  walk(dir, "");
  return found.sort();
}

/**
 * What the build in `dist/` is relative to the sources it came from — the one
 * predicate both the dispatch decision and its suites rest on:
 *
 *   missing  `dist/index.js` is absent (a fresh clone, before any build)
 *   stale    a source has no emitted `.js`, or the newest source/config is
 *            newer than the oldest output (a build that predates the sources)
 *   fresh    the build is newer than every source
 *
 * The mtime comparison is the conservative direction: any edit writes its file
 * with a newer mtime, and `tsc` rewrites every output on every run, so a tree a
 * build just left can never read as stale. An incomplete build is caught the
 * other way, by the output set, which mtimes cannot see.
 */
export function readSchemaDistState({
  packageDir = SCHEMA_PACKAGE_DIR,
  stat = fs.statSync,
  readdir = fs.readdirSync,
} = {}) {
  const distDir = path.join(packageDir, "dist");
  const mtime = (file) => {
    try {
      return stat(file).mtimeMs;
    } catch {
      return null;
    }
  };
  if (mtime(path.join(distDir, "index.js")) === null) {
    return { status: "missing", detail: "dist/index.js is absent" };
  }
  const sources = relativeTree(path.join(packageDir, "src"), /\.ts$/, readdir);
  if (sources.length === 0) {
    return { status: "fresh", detail: "no sources to compare the build against" };
  }
  const unbuilt = sources.map((rel) => rel.replace(/\.ts$/, ".js")).find((rel) => mtime(path.join(distDir, rel)) === null);
  if (unbuilt !== undefined) {
    return { status: "stale", detail: `dist/${unbuilt} is absent — the build is incomplete` };
  }
  const outputs = relativeTree(distDir, /\.js$/, readdir).map((rel) => mtime(path.join(distDir, rel))).filter((value) => value !== null);
  const oldestOutput = outputs.reduce((oldest, value) => Math.min(oldest, value), Number.POSITIVE_INFINITY);
  const candidates = [
    ...sources.map((rel) => ({ label: `src/${rel}`, mtime: mtime(path.join(packageDir, "src", rel)) ?? 0 })),
    { label: "tsconfig.json", mtime: mtime(path.join(packageDir, "tsconfig.json")) ?? 0 },
  ];
  const newest = candidates.reduce((latest, row) => (row.mtime > latest.mtime ? row : latest), candidates[0]);
  if (newest.mtime > oldestOutput) {
    return { status: "stale", detail: `${newest.label} is newer than the build in dist/` };
  }
  return { status: "fresh", detail: "the build is newer than every source" };
}

/**
 * The package manager that runs the schema package's declared `build` script:
 * the runtime that launched this process decides, the same way the crate's own
 * test scripts resolve theirs. Bun is never forced on a node install, and node
 * ships its own manager, so neither runtime needs a probe.
 */
export function schemaBuildManager(execPath = process.execPath) {
  return execPath.includes("bun") ? "bun" : "npm";
}

/**
 * Run that build. `spawn` is injected so the decision is testable without a
 * compiler; it resolves three outcomes and never throws:
 *
 *   built        the declared script exited 0
 *   unavailable  the package manager does not exist here (ENOENT) — this tree
 *                was never provisioned, which is not the gate's verdict to make
 *   failed       the script ran and did not exit 0, or was killed (timeout)
 */
export function ensureSchemaBuild({
  manager = schemaBuildManager(),
  packageDir = SCHEMA_PACKAGE_DIR,
  spawn = spawnSync,
} = {}) {
  const started = Date.now();
  const result = spawn(manager, ["run", "build"], {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: SCHEMA_BUILD_TIMEOUT_MS,
  });
  const ms = Date.now() - started;
  if (result.error?.code === "ENOENT") {
    return { outcome: "unavailable", manager, ms, detail: `${manager} is not available on PATH (ENOENT)` };
  }
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.error || result.signal || result.status !== 0) {
    return {
      outcome: "failed",
      manager,
      ms,
      status: result.status ?? null,
      output,
      detail: result.error?.message ?? `exit ${result.status}${result.signal ? ` (${result.signal})` : ""}`,
    };
  }
  return { outcome: "built", manager, ms, output };
}

/** The dispatch decision: a current build is left alone, anything else is
 *  rebuilt before a worker pulls a suite — the whole of issue #571's mechanism. */
export function prepareSchemaRuntime({ state = readSchemaDistState(), build = ensureSchemaBuild } = {}) {
  if (state.status === "fresh") return { action: "current", state };
  const result = build();
  if (result.outcome === "built") return { action: "rebuilt", state, manager: result.manager, ms: result.ms };
  if (result.outcome === "unavailable") return { action: "unavailable", state, manager: result.manager, detail: result.detail };
  return { action: "failed", state, manager: result.manager, status: result.status, output: result.output, detail: result.detail };
}

/** What the decision is read back as: stderr lines, and whether the run stops. */
export function dispatchReport(decision) {
  if (decision.action === "current") return { lines: [], stop: false };
  if (decision.action === "rebuilt") {
    return {
      lines: [`root gate: schema dist rebuilt in ${(decision.ms / 1000).toFixed(1)}s (dist/ is a build output; the contract suites read it)`],
      stop: false,
    };
  }
  if (decision.action === "unavailable") {
    return {
      lines: [
        `root gate: schema dist is ${decision.state.status} and is not rebuilt here — ${decision.detail}; `
          + "build it with (cd packages/agentic-workflow-schema && bun run build) if a suite reads it",
      ],
      stop: false,
    };
  }
  const lines = decision.output === "" ? [] : [decision.output];
  lines.push(
    `root gate: the schema package does not build (${decision.manager} run build, exit ${decision.status ?? "?"}) — `
      + "the contract suites would read a dist/ that is not built from these sources",
  );
  return { lines, stop: true };
}

/** Every suite of one tree, discovered the same way the shell glob does. The
 *  root tree (`scripts/`) is the default; a package's tree is the same run over
 *  its own directory (issue #598 S4), never a second runner. */
export function suites(dir = SUITE_DIR) {
  const base = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base)
    .filter((name) => name.endsWith(".test.mjs"))
    .sort()
    .map((name) => path.posix.join(dir, name));
}

/** Where a suite is spawned from and what it is called there: a package's suite
 *  runs with the package as its cwd, exactly as `bun test test/` did, so the
 *  pooled dispatch changes the process count and nothing a suite observes. */
export function relativeToCwd(file, cwd = REPO_ROOT_DIR) {
  return path.posix.relative(cwd === "." ? "" : cwd, file);
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
    dir: SUITE_DIR,
    cwd: REPO_ROOT_DIR,
    suiteTimeoutMs: DEFAULT_SUITE_TIMEOUT_MS,
    suiteMemCapMb: DEFAULT_SUITE_MEM_CAP_MB,
    testTimeoutMs: DEFAULT_TEST_TIMEOUT_MS,
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
    } else if (arg === "--dir") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) throw new Error("--dir needs a directory");
      parsed.dir = value.replace(/\/+$/, "");
      index += 1;
    } else if (arg === "--cwd") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) throw new Error("--cwd needs a directory");
      parsed.cwd = value;
      index += 1;
    } else if (arg === "--test-timeout") {
      parsed.testTimeoutMs = positiveInteger("--test-timeout", argv[index + 1]) * 1000;
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
export function testBudgetFor(file, allowlist, defaultMs = DEFAULT_TEST_TIMEOUT_MS) {
  return allowlist.get(file)?.timeoutMs ?? defaultMs;
}

// `-c commit.gpgsign=false` applies to commands this process spawns only; the
// suites also `git init` fresh repositories, whose own config starts empty and
// inherits this as the system/global layer.
// Bun uses `bun test <files>` (subcommand), Node uses `node --test <files>` (flag).
// The per-test budget defaults to 10s (issue #493 S4); scripts/test-timeout-allowlist.json
// carries the suites that measured above it, with the reason and the cost.
const isBun = process.execPath.includes("bun");

/**
 * The environment a suite is spawned with: the caller's repository locators and
 * ambient git tracing stripped (`scripts/git-env.mjs` owns both vocabularies),
 * the gate's own `commit.gpgsign=false` layer added, and the parent's
 * test-runner context dropped (issue #493: with `NODE_TEST_CONTEXT` set,
 * `node --test <file>` skips the file entirely and exits 0). Published so its
 * contract is pinnable, mirroring the gate's `stepEnv`.
 * @returns {Record<string, string | undefined>}
 */
export function suiteChildEnv() {
  return scrubGitEnv({
    ...process.env,
    GIT_CONFIG_COUNT: String(Number(process.env.GIT_CONFIG_COUNT ?? 0) + 1),
    [`GIT_CONFIG_KEY_${process.env.GIT_CONFIG_COUNT ?? 0}`]: "commit.gpgsign",
    [`GIT_CONFIG_VALUE_${process.env.GIT_CONFIG_COUNT ?? 0}`]: "false",
    NODE_TEST_CONTEXT: undefined,
  });
}

const childEnv = suiteChildEnv();

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

function spawnReal(file, bail, signal, bounds, testTimeoutMs, cwd = REPO_ROOT_DIR) {
  const suiteTimeoutMs = bounds?.suiteTimeoutMs ?? DEFAULT_SUITE_TIMEOUT_MS;
  const suiteMemCapMb = bounds?.suiteMemCapMb ?? DEFAULT_SUITE_MEM_CAP_MB;
  // `detached` gives the suite its own process group, so a bound-kill takes the
  // whole tree down — node's runner spawns a child per file, and killing only
  // the runner would orphan the hung one (issue #493).
  const child = spawn(process.execPath, argvFor(relativeToCwd(file, cwd), bail, testTimeoutMs), {
    cwd: path.resolve(REPO_ROOT, cwd),
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
      // A SIGKILL from the bail abort leaves status null: that suite is
      // collateral of the first red, not a second failure (owner amendment
      // S9). Name it KILLED so the tally never shows an all-green suite as
      // FAIL — the exit status stays the first red's own either way.
      const bailKilled = status === null && verdict === null && signal?.aborted === true;
      resolve({ status: verdict ? 1 : status ?? 1, output: Buffer.concat(chunks), ms: Date.now() - started, verdict: verdict ?? (bailKilled ? "BAIL KILL" : null) });
    });
    child.on("error", () => {
      clearTimeout(wallClock);
      clearInterval(watchdog);
      const bailKilled = verdict === null && signal?.aborted === true;
      resolve({ status: 1, output: Buffer.concat(chunks), ms: Date.now() - started, verdict: verdict ?? (bailKilled ? "BAIL KILL" : null) });
    });
  });
}

async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`root gate: ${error.message}\n`);
    process.stderr.write(
      "usage: bun scripts/run-root-suite.mjs [--bail] [--jobs <n>] [--dir <dir>] [--cwd <dir>] [--test-timeout <s>] [--suite-timeout <s>] [--suite-mem-cap <mb>] [<suite…>]\n",
    );
    return 2;
  }
  let allowlist;
  try {
    allowlist = readAllowlist();
  } catch (error) {
    process.stderr.write(`root gate: ${error.message}\n`);
    return 2;
  }
  // Before a worker pulls anything (issue #571): the contract suites import a
  // gitignored build, and a stale one fails them with assertions that read like
  // a broken contract. The report is stderr — stdout stays the receipt.
  const decision = prepareSchemaRuntime();
  const report = dispatchReport(decision);
  for (const line of report.lines) process.stderr.write(`${line}\n`);
  if (report.stop) return 1;
  const selected = parsed.selected.length > 0 ? parsed.selected : suites(parsed.dir);
  const jobs = parsed.jobs ?? Math.max(1, Math.min(defaultJobs(), selected.length));
  const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;

  process.stdout.write(
    `root gate: ${selected.length} suite(s) from ${parsed.dir} · ${jobs} worker(s) · fail-fast ${parsed.bail ? "on" : "off"} · ` +
      `suite bound ${seconds(parsed.suiteTimeoutMs)} · mem cap ${parsed.suiteMemCapMb} MB\n`,
  );
  return runSuites({
    suites: selected,
    jobs,
    bail: parsed.bail,
    spawnSuite: (file, signal) =>
      spawnReal(file, parsed.bail, signal, parsed, testBudgetFor(file, allowlist, parsed.testTimeoutMs), parsed.cwd),
    onResult: (file, result) => {
      if ((result.status ?? 1) === 0) {
        process.stdout.write(`PASS ${file} (${seconds(result.ms)})\n`);
        return;
      }
      if (result.verdict === "BAIL KILL") {
        // The partial output of a killed suite is noise beside the first red
        // that killed it: the line is the receipt, the dump is not (S9).
        process.stdout.write(`KILLED ${file} (${seconds(result.ms)}) — in flight when the first red stopped the dispatch (bail)\n`);
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
