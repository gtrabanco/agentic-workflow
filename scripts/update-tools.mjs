#!/usr/bin/env node
/**
 * update-tools.mjs — deliberate tool upgrades for the authoring toolchain
 * (issue #331, unit fix/331-authoring-setup, S3).
 *
 * The counterpart to pin-watch: pin-watch watches and files issues; this
 * performs the upgrade the operator decides on. Two tools, the two the
 * issue names:
 *
 *   serena-agent    `uv tool upgrade serena-agent` — installed vs published
 *                   is read with pin-watch's own logic (installedVersion,
 *                   pypiLatest), never a second implementation.
 *   gentle-engram   `pi install npm:gentle-engram@latest` — feature 66's
 *                   pinned route. The installed version is read from pi's
 *                   agent directory (setup-env's reader, PE-007); the
 *                   published one from `npm view` (pin-watch's npmLatest).
 *
 *   node scripts/update-tools.mjs --dry-run   report current vs latest,
 *                                             change nothing, exit 0
 *   node scripts/update-tools.mjs             upgrade both, exit 0; exit 1
 *                                             when an upgrade command fails
 *
 * Registry fetch failures degrade the report (like pin-watch's rule) — they
 * never crash the run. Exit codes: 0 = reported / upgraded; 1 = a failed
 * upgrade; 2 = usage error. Node builtins only; the fetchers and executor
 * are injectable, so the offline suite never touches the network.
 *
 * Usage:
 *   node scripts/update-tools.mjs [--dry-run]
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { installedVersion, pypiLatest, npmLatest } from "./pin-watch.mjs";
import { readPiPackageVersion, platformGuard } from "./setup-env.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export { installedVersion, pypiLatest, npmLatest };

export const SERENA_UPGRADE = "uv tool upgrade serena-agent";
export const GENTLE_ENGRAM_UPGRADE = "pi install npm:gentle-engram@latest";

function spawnExecutor(command, { root = REPO_ROOT } = {}) {
  const result = spawnSync("bash", ["-c", command], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 600_000 });
  return { ok: !result.error && result.status === 0, message: ((result.stderr || result.stdout || result.error?.message || "").trim().split("\n")[0]) || command };
}

/**
 * One report row per tool: installed vs published, with `drift` when the
 * registry is ahead. A tool that is not installed reports installed null and
 * no drift (nothing to compare); a registry failure degrades the row with a
 * note — neither ever throws (the pin-watch degraded rule).
 */
export function collectToolReports({ readSerenaInstalled, fetchPypiLatest, readGentleEngramInstalled, fetchNpmLatest }) {
  const reports = [];
  for (const [tool, readInstalled, fetchPublished, registry] of [
    ["serena-agent", readSerenaInstalled, fetchPypiLatest, "pypi.org"],
    ["gentle-engram", readGentleEngramInstalled, fetchNpmLatest, "npm"],
  ]) {
    const installed = readInstalled();
    let published = null;
    let note = null;
    let degraded = false;
    if (installed === null) {
      note = "not installed on this machine";
    } else {
      try {
        published = fetchPublished();
      } catch (error) {
        degraded = true;
        note = error.message;
      }
    }
    reports.push({ tool, registry, installed, published, drift: installed !== null && published !== null && published !== installed && newer(published, installed), degraded, note });
  }
  return reports;
}

/** Numeric semver compare: is `a` strictly newer than `b`? (pin-watch's rule) */
function newer(a, b) {
  const pa = String(a).split(".").map((p) => parseInt(p, 10) || 0);
  const pb = String(b).split(".").map((p) => parseInt(p, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
  }
  return false;
}

/** The fixed human report: one line per tool plus a verdict. */
export function renderReport(reports) {
  const lines = ["UPDATE-TOOLS — authoring toolchain (issue #331)"];
  for (const row of reports) {
    if (row.degraded) {
      lines.push(`${row.tool}: installed ${row.installed} · published unknown · degraded — ${row.note}`);
    } else if (row.installed === null) {
      lines.push(`${row.tool}: not installed · published ${row.published ?? "unknown"} — ${row.note}`);
    } else {
      lines.push(`${row.tool}: installed ${row.installed} · published ${row.published} · ${row.drift ? "DRIFT" : "current"}`);
    }
  }
  const drift = reports.filter((row) => row.drift).map((row) => row.tool);
  lines.push(drift.length > 0 ? `VERDICT: DRIFT in ${drift.join(", ")} — run without --dry-run to upgrade` : "VERDICT: CURRENT (or degraded)");
  return lines.join("\n");
}

/**
 * The run: collect reports, then (upgrade mode) execute exactly the two
 * documented upgrade commands. Injected `execute` stands in for the shell in
 * the offline suite. Returns { code, output } — code 0 unless an upgrade
 * fails (1).
 */
export function run({ dryRun = false, readSerenaInstalled, fetchPypiLatest, readGentleEngramInstalled, fetchNpmLatest, execute = spawnExecutor } = {}) {
  const reports = collectToolReports({ readSerenaInstalled, fetchPypiLatest, readGentleEngramInstalled, fetchNpmLatest });
  const blocks = [renderReport(reports)];

  if (dryRun) {
    blocks.push("DRY-RUN — nothing was changed.");
    return { code: 0, output: blocks.join("\n") };
  }

  let failed = false;
  for (const [tool, command] of [
    ["serena-agent", SERENA_UPGRADE],
    ["gentle-engram", GENTLE_ENGRAM_UPGRADE],
  ]) {
    blocks.push(`→ ${tool}: ${command}`);
    const outcome = execute(command);
    blocks.push(outcome.ok ? `  ✓ ${outcome.message}` : `  ✗ ${tool}: ${outcome.message}`);
    if (!outcome.ok) failed = true;
  }

  return { code: failed ? 1 : 0, output: blocks.join("\n") };
}

function main(argv) {
  const dryRun = argv.includes("--dry-run");
  const unknown = argv.filter((arg) => arg !== "--dry-run");
  if (unknown.length > 0) {
    process.stderr.write(`usage: node scripts/update-tools.mjs [--dry-run]\nunknown argument: ${unknown[0]}\n`);
    return 2;
  }

  const guard = platformGuard(process.platform);
  if (!guard.ok) {
    process.stderr.write(`${guard.message}\n`);
    return 1;
  }

  const result = run({
    dryRun,
    readSerenaInstalled: () => installedVersion({ name: "serena-agent", binary: "serena" }),
    fetchPypiLatest: () => pypiLatest("serena-agent"),
    readGentleEngramInstalled: () => readPiPackageVersion({ env: process.env, home: process.env.HOME ?? "" }),
    fetchNpmLatest: () => npmLatest("gentle-engram"),
  });
  process.stdout.write(result.output + "\n");
  return result.code;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
