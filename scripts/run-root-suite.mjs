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

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { scrubGitLocator } from "./git-env.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

/** `--bail`, `--jobs <n>` and the selected suites; everything else is a suite path. */
export function parseArgs(argv) {
  const parsed = { bail: false, jobs: null, selected: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--bail") {
      parsed.bail = true;
    } else if (arg === "--jobs") {
      const value = argv[index + 1];
      if (value === undefined || !/^\d+$/.test(value) || Number(value) < 1) {
        throw new Error(`--jobs needs a positive integer${value === undefined ? "" : `, got ${JSON.stringify(value)}`}`);
      }
      parsed.jobs = Number(value);
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

// `-c commit.gpgsign=false` applies to commands this process spawns only; the
// suites also `git init` fresh repositories, whose own config starts empty and
// inherits this as the system/global layer.
// Bun uses `bun test <files>` (subcommand), Node uses `node --test <files>` (flag).
// Bun defaults to a 5-second per-test timeout; budget 60s to cover bun→bun spawn
// overhead and the full-history git walks on tests that are fast in node but slow
// under bun (node keeps its no-default timeout model).
const isBun = process.execPath.includes("bun");
const childEnv = scrubGitLocator({
  ...process.env,
  GIT_CONFIG_COUNT: String(Number(process.env.GIT_CONFIG_COUNT ?? 0) + 1),
  [`GIT_CONFIG_KEY_${process.env.GIT_CONFIG_COUNT ?? 0}`]: "commit.gpgsign",
  [`GIT_CONFIG_VALUE_${process.env.GIT_CONFIG_COUNT ?? 0}`]: "false",
});

const argvFor = (file, bail) =>
  isBun
    ? ["test", "--timeout=60000", ...(bail ? ["--bail=1"] : []), file]
    : ["--test", file];

function spawnReal(file, bail, signal) {
  const child = spawn(process.execPath, argvFor(file, bail), {
    cwd: REPO_ROOT,
    env: childEnv,
    signal,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const chunks = [];
  const started = Date.now();
  child.stdout.on("data", (chunk) => chunks.push(chunk));
  child.stderr.on("data", (chunk) => chunks.push(chunk));
  return new Promise((resolve) => {
    child.on("close", (status) => resolve({ status: status ?? 1, output: Buffer.concat(chunks), ms: Date.now() - started }));
    child.on("error", () => resolve({ status: 1, output: Buffer.concat(chunks), ms: Date.now() - started }));
  });
}

async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`root gate: ${error.message}\n`);
    process.stderr.write("usage: bun scripts/run-root-suite.mjs [--bail] [--jobs <n>] [<suite…>]\n");
    return 2;
  }
  const selected = parsed.selected.length > 0 ? parsed.selected : suites();
  const jobs = parsed.jobs ?? Math.max(1, Math.min(defaultJobs(), selected.length));
  const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;

  process.stdout.write(`root gate: ${selected.length} suite(s) · ${jobs} worker(s) · fail-fast ${parsed.bail ? "on" : "off"}\n`);
  return runSuites({
    suites: selected,
    jobs,
    bail: parsed.bail,
    spawnSuite: (file, signal) => spawnReal(file, parsed.bail, signal),
    onResult: (file, result) => {
      if ((result.status ?? 1) === 0) {
        process.stdout.write(`PASS ${file} (${seconds(result.ms)})\n`);
        return;
      }
      process.stdout.write(`FAIL ${file} (${seconds(result.ms)})\n`);
      const output = result.output.toString().trim();
      if (output) process.stdout.write(`${output}\n`);
    },
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv.slice(2)));
}
