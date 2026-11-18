/**
 * merge-install.mjs — the telemetry merge driver's installation gate
 * (issue #630 S2–S4).
 *
 * The `telemetry` class is worthless while nobody names it: the driver acts
 * only where `.gitattributes` claims the path, and only where the checkout's
 * git config arms the driver that `.gitattributes` names. Two halves, one
 * installer, three surfaces:
 *
 *   - `init-workspace` writes the registry lines and runs
 *     `scripts/shared-doc-merge.mjs --install` (the primary surface, since the
 *     scaffold already appends a project's `.gitattributes` additively);
 *   - `agentic-workflow telemetry merge-install` (this module's `main`) is the
 *     retroactive surface for a project that had telemetry before the class
 *     existed;
 *   - `agentic-workflow telemetry reconstruct write` arms the driver as part of
 *     the reconciliation (S4), config-only, so a telemetry command never
 *     rewrites a tracked file behind the operator's back.
 *
 * Two rules the surfaces share:
 *
 *  - **Additive, never a rewrite.** A missing registry line is appended; an
 *    existing line — whatever it says — is left alone. A path claimed twice
 *    would be two drivers on one file, which git answers with whichever line
 *    comes last, so the installer never adds a second claim.
 *  - **A driver entry that cannot run is a refusal, not an arm.** The command
 *    recorded in git config names a file that must exist in this checkout: the
 *    root `scripts/shared-doc-merge.mjs` when the project replicated the
 *    workflow, else the crate's own `bin/shared-merge.mjs` (issue #630 D5 —
 *    the mechanics moved into the crate for exactly this install shape).
 *
 * exit: 0 the receipt answers; 2 a refusal (not a checkout, no entry). stdout
 * carries the `telemetry-merge-install@1` receipt; stderr the refusal.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  TELEMETRY_JSONL_PATH,
  TELEMETRY_LEDGER_PATH,
  armDriver,
  driverName,
  isGitCheckout,
} from "../writer/shared-merge.mjs";

/** The receipt's contract id. */
export const MERGE_INSTALL_CONTRACT_ID = "telemetry-merge-install@1";

/** The class the installer arms. */
export const TELEMETRY_CLASS = "telemetry";

/** The two registry lines the telemetry class needs, in `.gitattributes` order. */
export const TELEMETRY_ATTRIBUTE_LINES = Object.freeze([
  `${TELEMETRY_LEDGER_PATH} merge=${driverName(TELEMETRY_CLASS)}`,
  `${TELEMETRY_JSONL_PATH} merge=${driverName(TELEMETRY_CLASS)}`,
]);

/** The root entry a replicated workflow carries, relative to the project. */
export const ROOT_DRIVER_ENTRY = "scripts/shared-doc-merge.mjs";

const USAGE = [
  "usage: agentic-workflow telemetry merge-install [--repo <dir>]",
  "",
  "Installs the telemetry merge protection: appends the two `.gitattributes`",
  "registry lines the telemetry class needs (additively — an existing line is",
  "never touched) and arms `merge.agentic-shared-telemetry.driver` in the",
  "checkout's git config. Idempotent: a second run answers `unchanged`.",
  "",
  "exit: 0 the receipt answers; 2 refused (not a git checkout, no driver entry).",
].join("\n");

/** A refusal the CLI prints and the tests assert on. */
class MergeInstallRefusal extends Error {}

/**
 * The driver entry this checkout must arm: the project's own script when the
 * workflow was replicated, else the crate's bin. Answers `{ path, relative,
 * present }` — `path` is absolute, `relative` is what the armed command shows,
 * and `present` is the only field the installer trusts.
 */
export function resolveDriverEntry(root, { site = import.meta.url } = {}) {
  const rootScript = path.join(root, ROOT_DRIVER_ENTRY);
  if (fs.existsSync(rootScript)) return { path: rootScript, relative: ROOT_DRIVER_ENTRY, present: true };
  // `src/telemetry/merge-install.mjs` → the package root, then its bin.
  const crateBin = path.resolve(path.dirname(fileURLToPath(site)), "../../bin/shared-merge.mjs");
  const exists = fs.existsSync(crateBin);
  const relative = path.relative(root, crateBin);
  return {
    path: crateBin,
    relative: path.isAbsolute(relative) || relative.startsWith("..") ? crateBin : relative,
    present: exists,
  };
}

/** The registry lines `.gitattributes` is missing — none when a line already
 * claims the path with some driver, so the installer never adds a second claim. */
export function missingAttributeLines(text) {
  const claimed = attributeClaims(text);
  return TELEMETRY_ATTRIBUTE_LINES.filter((line) => !claimed.has(pathOf(line)));
}

/** The paths one `.gitattributes` text claims at all (comments and blank lines
 * aside), whichever driver claims them. */
function attributeClaims(text) {
  return new Set(
    String(text ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("#"))
      .map(pathOf),
  );
}

function pathOf(line) {
  return line.split(/\s+/)[0];
}

/** Append the missing registry lines to one `.gitattributes`, additively. */
export function ensureAttributeLines(root, lines) {
  const file = path.join(root, ".gitattributes");
  if (lines.length === 0) return { path: file, added: [] };
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const separator = current === "" || current.endsWith("\n") ? "" : "\n";
  fs.appendFileSync(file, `${separator}${lines.join("\n")}\n`);
  return { path: file, added: [...lines] };
}

/** Whether both registry lines are present verbatim (the declaration half of
 * the gate; a path claimed by another driver is declared, and reported as such
 * by the installer's `added`/`missing` split). */
export function isDeclared(root) {
  const file = path.join(root, ".gitattributes");
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  return text.split("\n").some((line) => line.trim() === TELEMETRY_ATTRIBUTE_LINES[0]) &&
    text.split("\n").some((line) => line.trim() === TELEMETRY_ATTRIBUTE_LINES[1]);
}

/**
 * Arm the telemetry driver as part of a command that must not fail on it — the
 * reconciliation trigger (S4, D7). Config-only: it never writes
 * `.gitattributes`, and a project that is not a checkout answers `unavailable`
 * instead of refusing the caller's real work.
 *
 * Answers `{ status, declared, missing, driver?, next? }` where `status` is
 * `armed` (the key changed), `unchanged`, or `unavailable` (not a checkout, or
 * the arming could not write).
 */
export function armTelemetryMerge({ root, entry = null } = {}) {
  const declared = isDeclared(root);
  if (!isGitCheckout(root)) {
    return {
      status: "unavailable",
      declared,
      detail: "not a git checkout",
      next: declared ? null : "agentic-workflow telemetry merge-install",
    };
  }
  const resolved = entry ?? resolveDriverEntry(root);
  if (!resolved.present) {
    return {
      status: "unavailable",
      declared,
      detail: `no driver entry at ${resolved.relative}`,
      next: "agentic-workflow telemetry merge-install",
    };
  }
  const armed = armDriver(root, TELEMETRY_CLASS, { entry: resolved.path });
  if (armed.status === "refused") {
    return { status: "unavailable", declared, detail: armed.detail, next: "agentic-workflow telemetry merge-install" };
  }
  return {
    status: armed.status === "written" ? "armed" : "unchanged",
    declared,
    driver: armed.driver,
    next: declared ? null : "agentic-workflow telemetry merge-install",
  };
}

/**
 * The explicit installer (S2's universal-CLI surface): arm the driver AND
 * append the missing registry lines. Idempotent in both halves.
 */
export function installTelemetryMerge({ root, entry = null } = {}) {
  if (!isGitCheckout(root)) throw new MergeInstallRefusal(`${root} is not a git checkout`);
  const resolved = entry ?? resolveDriverEntry(root);
  if (!resolved.present) {
    throw new MergeInstallRefusal(
      `no driver entry to arm — ${resolved.relative} does not exist; install the package or replicate scripts/, then re-run`,
    );
  }
  const file = path.join(root, ".gitattributes");
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const missing = missingAttributeLines(text);
  const attributes = ensureAttributeLines(root, missing);
  const armed = armDriver(root, TELEMETRY_CLASS, { entry: resolved.path });
  if (armed.status === "refused") throw new MergeInstallRefusal(`git config ${armed.setting} failed — ${armed.detail}`);
  return {
    contract: MERGE_INSTALL_CONTRACT_ID,
    root,
    entry: resolved.relative,
    attributes: { path: path.join(root, ".gitattributes"), added: attributes.added, missing: missing.length },
    driver: { name: armed.driver, status: armed.status, command: armed.command },
    declared: isDeclared(root),
  };
}

/** Parse `--repo <dir>` and nothing else. */
function parseArgs(argv) {
  let repo = null;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg !== "--repo") throw new MergeInstallRefusal(`unknown argument: ${arg}`);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) throw new MergeInstallRefusal("--repo needs a directory");
    repo = value;
    index += 1;
  }
  return { repo };
}

/**
 * The CLI entry: `agentic-workflow telemetry merge-install [--repo <dir>]`.
 *
 * stdout carries the receipt; stderr a refusal. exit 0 answered · 2 refused.
 */
export function main(
  argv,
  { cwd = process.cwd(), stdout = (text) => process.stdout.write(text), stderr = (text) => process.stderr.write(text) } = {},
) {
  try {
    if (argv.length === 1 && (argv[0] === "--help" || argv[0] === "-h")) {
      stdout(`${USAGE}\n`);
      return 0;
    }
    const { repo } = parseArgs(argv);
    const root = path.resolve(cwd, repo ?? ".");
    if (!fs.existsSync(root)) throw new MergeInstallRefusal(`project not found: ${root}`);
    stdout(`${JSON.stringify(installTelemetryMerge({ root }), null, 2)}\n`);
    return 0;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    stderr(`MERGE-INSTALL REFUSAL — ${detail}\n`);
    if (error instanceof MergeInstallRefusal && argv.length === 0) stderr(`${USAGE}\n`);
    return 2;
  }
}

// `agentic-workflow telemetry merge-install` imports this module; running it
// directly is the same command, which keeps a checkout usable without the bin.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
