#!/usr/bin/env node
/**
 * gate-receipt.mjs — the machine receipt for the project verification gate
 * (issue #409, unit `docs/features/108-machine-gate-receipts/`).
 *
 * The gate already exists (`scripts/local-gate.mjs`); what it prints is a human
 * log. This runner turns one run into the `gate-receipt@1` document the review
 * and audit passes consume — exit codes, per-check verdicts and bounded failing
 * fragments — and keeps the full log on disk, referenced and never inlined.
 *
 * Validity is the declared content manifest (owner directive S12): the runner
 * signs a minimal, declared closure (`GATE_MANIFEST_PATTERNS`) and `verify`
 * re-hashes exactly the paths the receipt declares. HEAD is provenance, so an
 * unrelated commit or an unsigned new file cannot invalidate evidence, and one
 * mutated signed byte cannot leave it current. No gate re-run is needed to
 * answer "is this evidence still true?" — a local hash comparison answers it.
 *
 * The runner's own limits are the schema's: the inlined fragments are bounded
 * (≤8 rows of ≤240 characters) and the manifest is data, not context (one row
 * per signed file; 1,568 rows / 217 KiB measured on this repository). A filtered
 * run (`-- --only …`) records what ran but is `degraded` with
 * `partial-gate-selection` — a subset is never merge evidence.
 *
 * The gate handshake is declared: `<gate> --json <path>` writes a
 * `local-gate-result@1` document (`scripts/local-gate.mjs` does; a project's own
 * gate script can). Anything else — no document, an unreadable one, a foreign
 * schema token — is a **degraded** receipt with a bounded raw tail and the
 * `unrecognized-gate-output` reason. It is never a silent pass.
 *
 * Usage
 *   bun scripts/gate-receipt.mjs run [--root <dir>] [--receipt <path>] [--log <path>]
 *                                    [--gate <script>] [-- <gate args...>]
 *   bun scripts/gate-receipt.mjs verify [--root <dir>] [--receipt <path>] [--json]
 *   (node fallback, same argv)
 *
 * `run` exit: the gate's own exit code.
 * `verify` exit: 0 current and `pass`; 1 current and not `pass`; 3 missing;
 *                4 stale (signed bytes changed); 5 invalid (not a receipt).
 *
 * Its sibling suite is `scripts/gate-receipt.test.mjs`.
 */

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/** Where a run writes the envelope, relative to the project root. */
export const GATE_RECEIPT_PATH = ".agentic-workflow/gate/gate-receipt.json";

/** Where a run writes the full log, relative to the project root. */
export const GATE_LOG_PATH = ".agentic-workflow/gate/gate-receipt.log";

/** The gate handshake document's schema token. */
export const GATE_RESULT_SCHEMA = "local-gate-result@1";

/** The declared exit contract of `verify`, so a caller routes on a token. */
export const GATE_VERIFY_EXITS = Object.freeze({ currentPass: 0, currentNotPass: 1, missing: 3, stale: 4, invalid: 5 });

const DEFAULT_RECEIPT = GATE_RECEIPT_PATH;
const DEFAULT_LOG = GATE_LOG_PATH;
const MAX_FRAGMENTS = 8;
const MAX_FRAGMENT_CHARS = 240;
const RAW_TAIL_CHARS = 8 * 1024;
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/gu;
const SKIP_DIRS = new Set([".git", ".serena", ".pi-web", ".worktrees", "dist", "node_modules"]);
const SCRIPT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The built schema runtime; loaded lazily so `--help` and `--list` never need it. */
let schemaPromise = null;
function schema() {
  schemaPromise ??= import("./schema-runtime.mjs").then((module) => module.loadSchemaRuntime());
  return schemaPromise;
}

/** Lowercase SHA-256 of one file's bytes. */
function sha256File(absolute) {
  return createHash("sha256").update(fs.readFileSync(absolute)).digest("hex");
}

/** One glob pattern → the regular expression it means over a relative path. */
export function globToRegExp(pattern) {
  let source = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "*") {
      if (pattern[index + 1] === "*") {
        // `**/` spans zero or more directories; a trailing `**` spans the rest.
        if (pattern[index + 2] === "/") {
          source += "(?:[^/]+/)*";
          index += 2;
        } else {
          source += ".*";
          index += 1;
        }
      } else {
        source += "[^/]*";
      }
    } else if ("\\^$.|?+()[]{}".includes(char)) {
      source += `\\${char}`;
    } else {
      source += char;
    }
  }
  return new RegExp(`^${source}$`, "u");
}

/** Every regular file under `root`, relative and POSIX-separated. */
function walkFiles(root) {
  const files = [];
  const walk = (absolute, relative) => {
    let entries;
    try {
      entries = fs.readdirSync(absolute, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(path.join(absolute, entry.name), childRelative);
      } else if (entry.isFile()) {
        files.push(childRelative);
      }
    }
  };
  walk(root, "");
  return files.sort();
}

/**
 * The declared closure, signed. Build output and dependencies are never signed,
 * and the pattern list is the schema package's published constant — one home.
 */
export async function buildManifest(root, patterns = null) {
  const resolved = patterns ?? (await schema()).GATE_MANIFEST_PATTERNS;
  const matchers = [...resolved].map(globToRegExp);
  return walkFiles(root)
    .filter((relative) => matchers.some((matcher) => matcher.test(relative)))
    .map((relative) => ({ path: relative, sha256: sha256File(path.join(root, relative)) }));
}

/**
 * Bounded failing fragments: the check's own first error lines, ANSI stripped,
 * 8 rows of at most 240 characters. The full log stays where it is.
 */
export function boundedFragments(text) {
  const lines = String(text ?? "")
    .replace(ANSI, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const signal = /(not ok|\berror\b|assertion|expected|failed|fail\b|finding|✗)/iu;
  const prioritized = lines.filter((line) => signal.test(line));
  const picked = (prioritized.length > 0 ? prioritized : lines).slice(0, MAX_FRAGMENTS);
  return picked.map((line) => (line.length > MAX_FRAGMENT_CHARS ? `${line.slice(0, MAX_FRAGMENT_CHARS - 3)}...` : line));
}

/** The check status the receipt's closed vocabulary carries. */
function checkStatus(step) {
  if (step.status === "passed" || step.status === "failed") return step.status;
  return "skipped";
}

/**
 * The envelope for one run: pure assembly over the gate result document. A
 * missing or foreign result document is a degraded receipt whose single row
 * carries the bounded raw tail — never a pass.
 */
export async function assembleReceipt({ root, entries, argv, headSha, now, logRef, exitCode, durationMs, result, rawTail = "", partial = false }) {
  const { validateGateReceipt } = await schema();
  const failedExit = Number.isInteger(exitCode) ? exitCode : null;
  let checks;
  let degraded;
  let verdict;

  if (!result || result.schema !== GATE_RESULT_SCHEMA || !Array.isArray(result.steps)) {
    degraded = ["unrecognized-gate-output"];
    verdict = "degraded";
    checks = [{
      id: "unrecognized-gate-output",
      status: "skipped",
      exit_code: failedExit,
      duration_ms: Math.max(0, Math.round(durationMs)),
      fragments: boundedFragments(rawTail),
    }];
  } else {
    checks = result.steps.map((step) => ({
      id: String(step.id),
      status: checkStatus(step),
      exit_code: Number.isInteger(step.exit_code) ? step.exit_code : null,
      duration_ms: Number.isInteger(step.duration_ms) && step.duration_ms >= 0 ? step.duration_ms : 0,
      fragments: step.status === "failed" ? boundedFragments(`${step.stderr_tail ?? ""}\n${step.stdout_tail ?? ""}`) : [],
    }));
    const failed = checks.filter((check) => check.status === "failed").length;
    if (failed > 0) {
      verdict = "fail";
      degraded = [];
    } else if (checks.length > 0 && checks.every((check) => check.status === "passed") && !partial) {
      verdict = "pass";
      degraded = [];
    } else if (checks.length > 0 && checks.every((check) => check.status === "passed")) {
      // A filtered run (`-- --only …`) proves only the steps it ran. It is a
      // usable record, never merge evidence, so it can never say `pass`.
      verdict = "degraded";
      degraded = ["partial-gate-selection"];
    } else {
      // A run that produced no check, or one that only skipped, is evidence of
      // nothing: the receipt says so instead of implying green.
      verdict = "degraded";
      degraded = ["gate-step-not-run"];
    }
  }

  const { digestGateManifest } = await schema();
  const receipt = {
    contract: "agentic-workflow/gate-receipt",
    version: 1,
    schema: "gate-receipt@1",
    verdict,
    degraded,
    provenance: {
      head_sha: headSha,
      generated_at: now,
      gate_command: argv,
    },
    manifest: { digest: digestGateManifest(entries), entries },
    gate: {
      exit_code: failedExit === null ? 1 : failedExit,
      duration_ms: Math.max(0, Math.round(durationMs)),
      log_ref: logRef,
    },
    checks,
  };
  const validated = validateGateReceipt(receipt);
  if (!validated.ok) throw new Error(`the assembled receipt is not contract-valid: ${validated.errors.join("; ")}`);
  return validated.receipt;
}

/** The current digest of exactly the paths a receipt declares. */
async function hashDeclaredEntries(root, entries) {
  const current = [];
  for (const entry of entries) {
    const absolute = path.join(root, entry.path);
    try {
      if (!fs.statSync(absolute).isFile()) continue;
    } catch {
      continue;
    }
    current.push({ path: entry.path, sha256: sha256File(absolute) });
  }
  return current;
}

/**
 * The consumption verdict. `consumed` is true only for a `current` receipt;
 * missing, unreadable and stale all answer `fail` with a re-run route, so a
 * consumer can never read absence as evidence.
 */
export async function judgeGateReceipt({ root = process.cwd(), receiptPath = DEFAULT_RECEIPT } = {}) {
  const absolute = path.resolve(root, receiptPath);
  const relative = path.relative(root, absolute) || receiptPath;
  const rerun = `re-run \`bun scripts/gate-receipt.mjs run\` before consuming the gate evidence`;
  let document;
  try {
    document = JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch (error) {
    const missing = error && error.code === "ENOENT";
    return {
      status: missing ? "missing" : "invalid",
      verdict: "fail",
      consumed: false,
      blockers: [missing ? `gate receipt is missing: ${relative}` : `gate receipt is unreadable: ${relative}`],
      changedPaths: [],
      route: rerun,
    };
  }

  const runtime = await schema();
  const validated = runtime.validateGateReceipt(document);
  if (!validated.ok) {
    return {
      status: "invalid",
      verdict: "fail",
      consumed: false,
      blockers: [`gate receipt is not valid: ${validated.errors.slice(0, 3).join("; ")}`],
      changedPaths: [],
      route: rerun,
    };
  }

  const current = await hashDeclaredEntries(root, validated.receipt.manifest.entries);
  const fresh = await runtime.compareGateReceiptToCurrent(validated.receipt, current);
  if (fresh.fresh) {
    return {
      status: "current",
      verdict: validated.receipt.verdict,
      consumed: true,
      blockers: validated.receipt.verdict === "pass" ? [] : [`gate verdict is ${validated.receipt.verdict}`],
      changedPaths: [],
      route: validated.receipt.verdict === "pass" ? null : rerun,
    };
  }
  return {
    status: "stale",
    verdict: "fail",
    consumed: false,
    blockers: [`gate receipt is stale: ${fresh.changedPaths.join(", ") || "signed content changed"}`],
    changedPaths: fresh.changedPaths,
    route: rerun,
  };
}

/* ------------------------------------------------------------------ CLI */

const USAGE = [
  "usage: bun scripts/gate-receipt.mjs run [--root <dir>] [--receipt <path>] [--log <path>]",
  "                                         [--gate <script>] [-- <gate args...>]",
  "       bun scripts/gate-receipt.mjs verify [--root <dir>] [--receipt <path>] [--json]",
  "       (node fallback, same argv)",
].join("\n");

function usage(message) {
  process.stderr.write(`gate-receipt: ${message}\n${USAGE}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const options = { command: null, root: SCRIPT_ROOT, receipt: null, log: null, gate: null, json: false, passthrough: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      options.passthrough = argv.slice(index + 1);
      break;
    }
    if (arg === "run" || arg === "verify") {
      if (options.command) usage(`only one command may be named, got ${options.command} and ${arg}`);
      options.command = arg;
    } else if (arg === "--root" || arg === "--receipt" || arg === "--log" || arg === "--gate") {
      const value = argv[index + 1];
      if (value === undefined) usage(`${arg} needs a value`);
      const key = arg.slice(2);
      options[key] = arg === "--root" ? path.resolve(value) : value;
      index += 1;
    } else if (arg === "--json") {
      options.json = true;
    } else {
      usage(`unknown argument ${arg}`);
    }
  }
  if (!options.command) usage("name a command: run or verify");
  return options;
}

/** The gate argv: the project's own gate script, plus the declared handshake. */
function gateArgv(options) {
  if (options.gate) return [process.execPath, path.resolve(options.root, options.gate)];
  return [process.execPath, path.join(options.root, "scripts", "local-gate.mjs")];
}

/** Run the gate, tee its output to the terminal and to the full log on disk. */
async function runGate(options, resultPath) {
  const receiptAbsolute = path.resolve(options.root, options.receipt ?? DEFAULT_RECEIPT);
  const logAbsolute = path.resolve(options.root, options.log ?? DEFAULT_LOG);
  fs.mkdirSync(path.dirname(receiptAbsolute), { recursive: true });
  fs.mkdirSync(path.dirname(logAbsolute), { recursive: true });
  const log = fs.openSync(logAbsolute, "w");
  const argv = [...gateArgv(options), "--json", resultPath, ...options.passthrough];
  let rawTail = "";
  const started = Date.now();

  const exitCode = await new Promise((resolve) => {
    let child;
    try {
      child = spawn(argv[0], argv.slice(1), { cwd: options.root, stdio: ["ignore", "pipe", "pipe"], env: process.env });
    } catch (error) {
      rawTail = `gate-receipt: could not run ${argv[0]}: ${error.message}\n`;
      fs.writeSync(log, rawTail);
      resolve(1);
      return;
    }
    const capture = (chunk) => {
      fs.writeSync(log, chunk);
      rawTail = (rawTail + chunk.toString("utf8")).slice(-RAW_TAIL_CHARS);
    };
    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      capture(chunk);
    });
    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
      capture(chunk);
    });
    child.on("error", (error) => {
      rawTail += `gate-receipt: could not run ${argv[0]}: ${error.message}\n`;
      resolve(1);
    });
    child.on("close", (code) => resolve(code ?? 1));
  });
  fs.closeSync(log);

  let result = null;
  try {
    result = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  } catch {
    result = null;
  }

  const headSha = readHead(options.root);
  const entries = await buildManifest(options.root);
  const receipt = await assembleReceipt({
    root: options.root,
    entries,
    argv,
    headSha,
    now: new Date().toISOString(),
    logRef: path.relative(options.root, logAbsolute),
    exitCode,
    durationMs: Date.now() - started,
    result,
    rawTail,
    partial: options.passthrough.length > 0,
  });
  fs.writeFileSync(receiptAbsolute, `${JSON.stringify(receipt, null, 2)}\n`);

  const counts = receipt.checks.reduce((tally, check) => ({ ...tally, [check.status]: (tally[check.status] ?? 0) + 1 }), {});
  process.stdout.write(
    `\nGATE RECEIPT — wrote ${path.relative(options.root, receiptAbsolute)}\n` +
      `verdict: ${receipt.verdict}\n` +
      `checks: ${counts.passed ?? 0} passed, ${counts.failed ?? 0} failed, ${counts.skipped ?? 0} skipped\n` +
      `log: ${receipt.gate.log_ref}\n`,
  );
  // A degraded or failed envelope is never a pass, even when the gate command
  // itself exited 0: the receipt is the verdict a consumer reads.
  if (receipt.verdict === "pass") return exitCode;
  return exitCode === 0 ? 1 : exitCode;
}

/** The commit the run happened on, or `null` outside a checkout. */
function readHead(root) {
  try {
    const head = fs.readFileSync(path.join(root, ".git", "HEAD"), "utf8").trim();
    if (/^[0-9a-f]{40,64}$/u.test(head)) return head;
  } catch {
    // A worktree's `.git` is a file; fall through to the git CLI below.
  }
  try {
    const result = spawnSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" });
    return result.status === 0 ? result.stdout.trim() || null : null;
  } catch {
    return null;
  }
}

/** The fixed `verify` block, plus the machine verdict under `--json`. */
function report(judgement, receiptPath) {
  const verdict = judgement.status === "current" && judgement.verdict === "pass" ? "pass" : judgement.verdict;
  const lines = [
    `GATE RECEIPT — status: ${judgement.status}`,
    `verdict: ${verdict}`,
    `receipt: ${receiptPath}`,
  ];
  if (judgement.changedPaths.length > 0) lines.push(`changed: ${judgement.changedPaths.join(", ")}`);
  for (const blocker of judgement.blockers) lines.push(`blocker: ${blocker}`);
  if (judgement.route) lines.push(`route: ${judgement.route}`);
  return `${lines.join("\n")}\n`;
}

async function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  const options = parseArgs(argv);

  if (options.command === "run") {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-result-"));
    const resultPath = path.join(dir, "result.json");
    try {
      return await runGate(options, resultPath);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  const judgement = await judgeGateReceipt({ root: options.root, receiptPath: options.receipt ?? DEFAULT_RECEIPT });
  if (options.json) {
    process.stdout.write(`${JSON.stringify({
      status: judgement.status,
      verdict: judgement.verdict,
      consumed: judgement.consumed,
      blockers: judgement.blockers,
      changed_paths: judgement.changedPaths,
      route: judgement.route,
    }, null, 2)}\n`);
  } else {
    process.stdout.write(report(judgement, options.receipt ?? DEFAULT_RECEIPT));
  }
  if (judgement.status === "missing") return GATE_VERIFY_EXITS.missing;
  if (judgement.status === "invalid") return GATE_VERIFY_EXITS.invalid;
  if (judgement.status === "stale") return GATE_VERIFY_EXITS.stale;
  return judgement.verdict === "pass" ? GATE_VERIFY_EXITS.currentPass : GATE_VERIFY_EXITS.currentNotPass;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
