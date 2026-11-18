/**
 * shim.mjs — the ad-hoc forge read's interceptor (issue #612, S5).
 *
 * The guarded subcommand covers every read the workflow *orders*. It cannot
 * cover a read the model types itself, so the second half of the route is a
 * session-scoped `gh` trampoline: when it is armed, a content-bearing
 * `gh issue view` / `gh pr view` is answered by the guarded path, and everything
 * else — writes, metadata-only reads, `gh api`, any verb outside the grammar —
 * reaches the real binary untouched.
 *
 * Three decisions, stated because each one is a boundary:
 *
 *   * **the shell prefilter is generated, not hand-written.** A `gh` invocation
 *     costs one `case` unless it is a `view` of an issue or a PR, so writes and
 *     `gh auth` pay nothing. The words in it come from `FORGE_VIEW_TARGETS`, so
 *     the trampoline cannot disagree with the classifier.
 *   * **the content/metadata decision is the classifier's,** never the shell's:
 *     `shim exec` runs the same `classifyForgeArgs` the subcommand and the pin
 *     run.
 *   * **an unrecognised form passes through.** Blocking what the grammar does not
 *     recognise would break a write path to protect nothing; the pass-through
 *     residual is declared in unit 612's SPEC, not hidden behind a guess.
 *
 * The shim writes exactly one file, into a directory the caller names; nothing
 * here touches this repository, a `PATH` in process, or a session.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { findOnPath } from "../doctor/probes.mjs";

import { FORGE_VIEW_TARGETS, classifyForgeArgs } from "./grammar.mjs";

import { REAL_GH_ENV, readForge, renderForgeRead } from "./index.mjs";

/** Re-exported for the shim's own callers: the read module owns the name. */
export { REAL_GH_ENV };

/** The first line of the generated script — how `check` recognises one. */
export const SHIM_MARKER = "# agentic-workflow forge-read shim (issue #612)";

/** The binary name the shim answers for. */
export const SHIM_NAME = "gh";

/** The crate's own bin, so the default trampoline needs no download. */
const CRATE_BIN = fileURLToPath(new URL("../../bin/agentic-workflow.mjs", import.meta.url));

/** A single-quoted shell word, safe for any path. */
function shellQuote(value) {
  return `'${String(value).replace(/'/gu, `'\\''`)}'`;
}

/**
 * The command the trampoline spawns: the documented override when it is set,
 * otherwise the crate's own bin under this process's runtime.
 */
export function defaultRunner({ env = process.env, execPath = process.execPath } = {}) {
  const override = String(env.AGENTIC_WORKFLOW_RUNNER ?? "").trim();
  if (override !== "") return override;
  return `${execPath} ${CRATE_BIN}`;
}

/**
 * The generated trampoline. The `case` pattern lists the targets the classifier
 * owns, so a `gh` command that is not a `view` of one of them never leaves the
 * shell.
 */
export function shimSource({ ghPath, runner }) {
  const targets = FORGE_VIEW_TARGETS.join("|");
  return [
    "#!/bin/sh",
    `${SHIM_MARKER} — written by \`agentic-workflow forge-read shim install\`; do not edit.`,
    "# A content-bearing forge read is answered by the guarded route; every other",
    "# gh command reaches the real binary untouched (unit 612 S5).",
    `${REAL_GH_ENV}=${shellQuote(ghPath)}`,
    `export ${REAL_GH_ENV}`,
    'case "$1" in',
    `  ${targets})`,
    '    if [ "$2" = "view" ]; then',
    `      exec ${runner} forge-read shim exec -- "$@"`,
    "    fi",
    "    ;;",
    "esac",
    `exec "$${REAL_GH_ENV}" "$@"`,
    "",
  ].join("\n");
}

/** PATH entries with one directory removed — how the real binary is found. */
function pathWithout(dir, env) {
  const entries = String(env.PATH ?? "").split(path.delimiter).filter(Boolean);
  return entries.filter((entry) => path.resolve(entry) !== path.resolve(dir)).join(path.delimiter);
}

/** The real `gh` — the one the shim stands in front of. */
export function resolveRealGh({ dir, env = process.env } = {}) {
  const configured = String(env[REAL_GH_ENV] ?? "").trim();
  if (configured !== "") return configured;
  return findOnPath(SHIM_NAME, { env: { ...env, PATH: pathWithout(dir, env) } });
}

/**
 * Write the trampoline into `dir`. The only write this unit performs, and it
 * takes an explicit directory — never a discovered one.
 *
 * @returns {{ok: true, path: string, ghPath: string, runner: string, created: boolean} | {ok: false, code: string, detail: string}}
 */
export function installShim({ dir, ghPath, runner, env = process.env, writeFile = fs.writeFileSync, mkdirSync = fs.mkdirSync }) {
  if (typeof dir !== "string" || dir.trim() === "") {
    return { ok: false, code: "usage", detail: "shim install requires --dir <directory on the session PATH>" };
  }
  const target = path.join(dir, SHIM_NAME);
  const real = ghPath ?? resolveRealGh({ dir, env });
  if (real === null || real === undefined || real === "") {
    return { ok: false, code: "unavailable-forge-missing-cli", detail: "no gh binary on PATH outside the shim directory — install gh first" };
  }
  if (path.resolve(real) === path.resolve(target)) {
    return { ok: false, code: "usage", detail: `${real} is the shim itself — name the real gh with --gh <path>` };
  }
  const command = runner ?? defaultRunner({ env });
  mkdirSync(dir, { recursive: true });
  const created = !fs.existsSync(target);
  writeFile(target, shimSource({ ghPath: real, runner: command }), { mode: 0o755 });
  fs.chmodSync(target, 0o755);
  return { ok: true, path: target, ghPath: real, runner: command, created };
}

/** Read a directory's shim state — installed or not, and what it points at. */
export function shimState({ dir }) {
  const target = path.join(dir, SHIM_NAME);
  let text;
  try {
    text = fs.readFileSync(target, "utf8");
  } catch {
    return { installed: false, path: target, ghPath: null, runner: null };
  }
  const ghPath = new RegExp(`${REAL_GH_ENV}='([^']*)'`, "u").exec(text)?.[1] ?? null;
  const runner = /exec (.+?) forge-read shim exec/u.exec(text)?.[1] ?? null;
  return { installed: text.includes(SHIM_MARKER), path: target, ghPath, runner };
}

/** The real binary this process should proxy to, or a named refusal. */
function realGhFor({ io, env = process.env, spawn = spawnSync }) {
  const configured = String(env[REAL_GH_ENV] ?? "").trim();
  const real = configured !== "" ? configured : findOnPath(SHIM_NAME, { env });
  if (real === null || real === undefined || real === "") {
    io.stderr("FORGE-READ REFUSAL — unavailable-forge-missing-cli\n  the shim found no real gh on PATH\n");
    return null;
  }
  return { real, spawn };
}

/** Proxy one command to the real binary, forwarding both streams and the code. */
function proxy(argv, { io, spawn = spawnSync, env = process.env }) {
  const target = realGhFor({ io, env, spawn });
  if (target === null) return 2;
  const result = spawn(target.real, argv, { encoding: "utf8", env, maxBuffer: 32 * 1024 * 1024 });
  if (result?.error !== undefined && result?.error !== null) {
    io.stderr(`FORGE-READ REFUSAL — ${result.error.code === "ENOENT" ? "unavailable-forge-missing-cli" : "unavailable-forge-no-network"}\n  ${result.error.message ?? result.error}\n`);
    return 2;
  }
  if (result.stdout !== undefined && result.stdout !== "") io.stdout(result.stdout);
  if (result.stderr !== undefined && result.stderr !== "") io.stderr(result.stderr);
  return typeof result.status === "number" ? result.status : 1;
}

/** The number a bare `gh pr view` means: the PR of the current branch. */
function currentPullRequest({ io, spawn, env }) {
  const target = realGhFor({ io, env, spawn });
  if (target === null) return null;
  const result = spawn(target.real, ["pr", "view", "--json", "number", "--jq", ".number"], { encoding: "utf8", env });
  const number = Number.parseInt(String(result?.stdout ?? "").trim(), 10);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/**
 * The `gh` the shim replaced, for one invocation.
 *
 * @param {string[]} argv the arguments *after* `gh`
 * @param {{ io?: object, transport?: object, spawn?: Function, env?: object, projectDir?: string }} [context]
 * @returns {number} the exit code the session sees
 */
export function runShim(argv, context = {}) {
  const io = context.io ?? { stdout: (text) => process.stdout.write(text), stderr: (text) => process.stderr.write(text) };
  const args = Array.isArray(argv) ? argv.map(String) : [];
  const env = context.env ?? process.env;
  const decision = classifyForgeArgs(args);
  if (decision.kind !== "content") return proxy(args, { io, spawn: context.spawn, env });

  const number = decision.number ?? (decision.target === "pr" ? currentPullRequest({ io, spawn: context.spawn, env }) : null);
  if (number === null) {
    io.stderr(`FORGE-READ REFUSAL — usage\n  the shim could not resolve which ${decision.target} "gh ${decision.target} view" means; pass a number\n`);
    return 2;
  }
  const outcome = readForge({
    target: decision.target,
    number,
    comments: decision.comments,
    reviews: decision.reviews,
    transport: context.transport,
    projectDir: context.projectDir,
  });
  if (!outcome.ok) {
    io.stderr(`FORGE-READ REFUSAL — ${outcome.refusal.code}\n  ${outcome.refusal.detail}\n`);
    return 2;
  }
  io.stdout(`${renderForgeRead(outcome.envelope)}\n`);
  return 0;
}

const USAGE = "usage: agentic-workflow forge-read shim <install --dir <dir> [--gh <path>] [--runner <command>] | check --dir <dir> | exec -- <gh arguments...>>";

/**
 * The `shim` operations: `install` (the one writer), `check` (read-only state)
 * and `exec` (the trampoline's target).
 */
export async function runShimCommand(args, context = {}) {
  const io = context.io ?? { stdout: (text) => process.stdout.write(text), stderr: (text) => process.stderr.write(text) };
  const argv = Array.isArray(args) ? [...args] : [];
  const op = argv[0];
  const flags = {};
  const rest = [];
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      rest.push(...argv.slice(index + 1));
      break;
    }
    if (arg === "--json") flags.json = true;
    else if (arg === "--dir" || arg === "--gh" || arg === "--runner") {
      if (index + 1 >= argv.length) {
        io.stderr(`FORGE-READ REFUSAL — ${arg} requires a value\n${USAGE}\n`);
        return 2;
      }
      flags[arg.slice(2)] = argv[index + 1];
      index += 1;
    } else rest.push(arg);
  }

  if (op === "exec") {
    return runShim(rest, context);
  }
  if (op === "install") {
    const receipt = installShim({ dir: flags.dir, ghPath: flags.gh, runner: flags.runner, env: context.env });
    if (!receipt.ok) {
      io.stderr(`FORGE-READ REFUSAL — ${receipt.code}\n  ${receipt.detail}\n`);
      return 2;
    }
    io.stdout(flags.json
      ? `${JSON.stringify({ ok: true, op: "shim", ...receipt })}\n`
      : `SHIM INSTALLED — ${receipt.path}\n  real gh: ${receipt.ghPath}\n  runner:  ${receipt.runner}\n  ${receipt.created ? "written" : "rewritten (idempotent)"}\n`);
    return 0;
  }
  if (op === "check") {
    if (typeof flags.dir !== "string") {
      io.stderr(`FORGE-READ REFUSAL — check requires --dir <directory>\n${USAGE}\n`);
      return 2;
    }
    const state = shimState({ dir: flags.dir });
    io.stdout(flags.json
      ? `${JSON.stringify({ op: "shim", ...state })}\n`
      : state.installed
        ? `SHIM — installed at ${state.path}\n  real gh: ${state.ghPath}\n  runner:  ${state.runner}\n`
        : `SHIM — not installed at ${state.path}\n  the residual is declared: ad-hoc forge reads bypass the guard until the shim is armed\n`);
    return state.installed ? 0 : 1;
  }
  io.stderr(`FORGE-READ REFUSAL — unknown shim operation "${op ?? ""}"\n${USAGE}\n`);
  return 2;
}
