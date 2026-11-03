#!/usr/bin/env node
/**
 * dependency-advisory-pass.mjs — dependency advisories over the resolved tree
 * (issue #365, `S5`–`S9`; roadmap row 101).
 *
 * The deterministic answer to the question `skills/review-security/SKILL.md` used
 * to ask a model: "New/updated dependencies pinned and free of known-critical
 * advisories (state how you checked)". It checks.
 *
 * What it does: reads every package under `packages/` for the direct-dependency
 * census, reads the committed `bun.lock` for the **resolved** version of every
 * package in the tree, and asks OSV about those exact versions — one batched
 * `POST /v1/querybatch`, then one `GET /v1/vulns/<id>` per hit for the severity and
 * the fix. No registry lookup, no range arithmetic on a manifest: the lock is the
 * tree, and a range is never sent to the API.
 *
 * Why OSV and not `bun audit` / `osv-scanner` / Dependabot — measured, with
 * citations, in `docs/fix/365-manifest-vulnerability-pass/research.md`. The short
 * version: `osv-scanner` is not installed here; `bun audit` reports the same nine
 * advisories on this tree but cannot state a fixed version when the npm payload
 * gives an equality (`=3.3.6`), and OSV's record carries
 * `events: [{introduced}, {fixed}]`; Dependabot alerts are disabled for this
 * repository.
 *
 * **Report-only, never fatal** (owner decision 2026-11-03, `S6`): the pass exits 0
 * whatever it finds. Each row is classified `blocking` only when the advisory is
 * CRITICAL/HIGH **and** a fixed version exists, and `report-only` otherwise — the
 * review scopes a `blocking` row to the dependencies that change *adds or updates*,
 * so a pre-existing advisory on an untouched dependency never reddens a review.
 * The gate half is a report you can read on every PR, not a tripwire.
 *
 * Degraded, never failed, when OSV cannot be reached — the same contract
 * `scripts/version-parity-gate.mjs --pins` follows for a network blip.
 *
 * Two documented bounds: a single `querybatch` page is read (OSV paginates only
 * beyond 1,000 matches for one query or 3,000 for the whole query set, and this
 * tree resolves ~150 packages); and a severity OSV does not state is reported as
 * `unknown`, which is never blocking.
 *
 * Exit codes: 0 = report emitted (clean, degraded, or carrying blocking rows),
 * 2 = usage/IO error (an unreadable lock is a configuration error, not a network
 * blip).
 *
 * Usage:
 *   node scripts/dependency-advisory-pass.mjs [--root <dir>] [--json]
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { parseLock } from "./pin-watch.mjs";
import { packageDirs, semverGt } from "./version-parity-gate.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const USAGE = "usage: bun scripts/dependency-advisory-pass.mjs [--root <dir>] [--json]  (node fallback, same argv)";

/** The one network dependency `S9` allows. */
export const OSV_API = "https://api.osv.dev";

/**
 * The closed severity projection (`S7`, decision D3). The producer word is what
 * OSV/GHSA states; the ladder token is #361's enum; the ledger scale is
 * `skills/review-implementation/references/CLASSIFY.md`'s canonical conversion —
 * the same four buckets, so no second converter appears in the tree. A grade
 * nobody stated is `unknown`: reported, never blocking (`S8`).
 */
const SEVERITY_TABLE = Object.freeze({
  CRITICAL: Object.freeze({ severity: "critical", ladder: "BLOCKER", ledger: "high" }),
  HIGH: Object.freeze({ severity: "high", ladder: "CRITICAL", ledger: "high" }),
  MODERATE: Object.freeze({ severity: "moderate", ladder: "WARNING", ledger: "med" }),
  LOW: Object.freeze({ severity: "low", ladder: "SUGGESTION", ledger: "low" }),
});
const UNKNOWN_SEVERITY = Object.freeze({ severity: "unknown", ladder: "WARNING", ledger: "med" });

/** The first line of an error, for a one-line degradation note. */
const reason = (error) => String(error?.message ?? error).split("\n")[0];

const byBytes = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

/**
 * Every package the committed lock resolves, with the direct/transitive fact the
 * manifests supply (`S5`). A workspace member (`name@workspace:packages/x`) is not
 * a registry package and is not queried — there is nothing to ask OSV about.
 */
export function collectResolved({ root = REPO_ROOT } = {}) {
  const direct = new Set();
  for (const dir of packageDirs(root)) {
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(path.join(root, dir, "package.json"), "utf8"));
    } catch (error) {
      throw new Error(`${dir}/package.json is unreadable: ${reason(error)}`);
    }
    for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
      for (const name of Object.keys(manifest?.[field] ?? {})) direct.add(name);
    }
  }

  const lockPath = path.join(root, "bun.lock");
  let lock;
  try {
    lock = parseLock(fs.readFileSync(lockPath, "utf8"));
  } catch (error) {
    throw new Error(`${path.relative(root, lockPath)} is unreadable: ${reason(error)}`);
  }

  const packages = [];
  for (const [name, entry] of Object.entries(lock?.packages ?? {})) {
    const spec = Array.isArray(entry) ? String(entry[0] ?? "") : "";
    // The lock states `<name>@<version>`; a workspace link states a path and has
    // no version, so it contributes nothing rather than a bogus query.
    const version = spec.slice(spec.lastIndexOf("@") + 1);
    if (!/^\d/u.test(version)) continue;
    packages.push({ name, version, direct: direct.has(name) });
  }
  return packages.sort((left, right) => byBytes(left.name, right.name));
}

/** The batched OSV query payload: resolved versions only (`S5`). */
export function buildQueries(packages) {
  return (packages ?? []).map((entry) => ({
    package: { name: entry.name, ecosystem: "npm" },
    version: entry.version,
  }));
}

/** The producer grade projected onto the ladder and the ledger scale (`S7`). */
export function projectSeverity(vuln) {
  const raw = String(vuln?.database_specific?.severity ?? "").trim().toUpperCase();
  return SEVERITY_TABLE[raw] ?? UNKNOWN_SEVERITY;
}

/**
 * The version that fixes this package, or null (`S6`'s second half).
 *
 * An advisory can carry several SEMVER legs (one per maintained line), so the
 * answer is the *smallest* `fixed` event above the resolved version — never the
 * first leg, which would name a fix from a line the tree is not on. Legs for
 * other packages in the same advisory are ignored.
 */
export function fixedVersionFor(vuln, { name, version }) {
  let best = null;
  for (const affected of vuln?.affected ?? []) {
    if (affected?.package?.name !== name) continue;
    for (const range of affected.ranges ?? []) {
      for (const event of range?.events ?? []) {
        const fixed = event?.fixed;
        if (typeof fixed !== "string" || !semverGt(fixed, version)) continue;
        if (best === null || semverGt(best, fixed)) best = fixed;
      }
    }
  }
  return best;
}

/** `S6`'s materiality rule, exactly: CRITICAL/HIGH **and** a fixed version. */
export function classifyImpact({ severity, fixed }) {
  const material = severity === "critical" || severity === "high";
  return material && fixed !== null ? "blocking" : "report-only";
}

/**
 * Query OSV for the resolved tree and map the answer onto one row per advisory and
 * package. Both fetchers are injected, which is what lets the suite prove the
 * degraded path without a network (`S9`) and keeps the seam where a future client
 * would be swapped in.
 */
export async function collectAdvisories({ packages, fetchBatch, fetchVuln }) {
  const checked = (packages ?? []).length;
  if (checked === 0) return { rows: [], degraded: [], checked };

  let batch;
  try {
    batch = await fetchBatch(buildQueries(packages));
  } catch (error) {
    return { rows: [], degraded: [`OSV query failed: ${reason(error)}`], checked };
  }

  const hits = new Map();
  const results = Array.isArray(batch?.results) ? batch.results : [];
  results.forEach((result, index) => {
    const entry = packages[index];
    if (!entry) return;
    for (const hit of result?.vulns ?? []) {
      if (typeof hit?.id !== "string" || hit.id === "") continue;
      if (!hits.has(hit.id)) hits.set(hit.id, []);
      hits.get(hit.id).push(entry);
    }
  });

  const rows = [];
  const degraded = [];
  for (const id of [...hits.keys()].sort(byBytes)) {
    let vuln;
    try {
      vuln = await fetchVuln(id);
    } catch (error) {
      // A detail read that fails is a gap, not a clean result: name it.
      degraded.push(`${id}: ${reason(error)}`);
      continue;
    }
    const projection = projectSeverity(vuln);
    for (const entry of hits.get(id)) {
      const fixed = fixedVersionFor(vuln, entry);
      rows.push({
        id,
        package: entry.name,
        resolved: entry.version,
        direct: entry.direct,
        ...projection,
        impact: classifyImpact({ severity: projection.severity, fixed }),
        fixed,
        summary: String(vuln?.summary ?? ""),
        url: `https://osv.dev/vulnerability/${id}`,
      });
    }
  }

  rows.sort((left, right) => byBytes(left.package, right.package) || byBytes(left.id, right.id));
  return { rows, degraded, checked };
}

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** The fixed human report. Nothing here can fail the caller (`S6`). */
export function renderReport({ rows, degraded, checked }) {
  const advisories = rows.length;
  const blocking = rows.filter((row) => row.impact === "blocking").length;
  const reportOnly = advisories - blocking;
  const breakdown =
    advisories === 0 ? "" : `, ${blocking} blocking, ${reportOnly} report-only`;
  const lines = [
    `DEPENDENCY ADVISORIES — ${plural(checked, "package")} resolved, ${plural(advisories, "advisory", "advisories")}${breakdown}`,
  ];

  if (advisories > 0) {
    lines.push("| package | resolved | fixed | severity | ladder | impact | advisory |");
    lines.push("|---|---|---|---|---|---|---|");
    for (const row of rows) {
      lines.push(
        `| ${row.package} | ${row.resolved} | ${row.fixed ?? "—"} | ${row.severity} | ${row.ladder} | ${row.impact} | ${row.id} |`,
      );
    }
  } else if (degraded.length === 0) {
    lines.push("no advisory affects the resolved tree");
  }

  for (const entry of degraded) lines.push(`::warning::${entry} — advisory pass degraded, not failed`);

  lines.push(
    degraded.length > 0
      ? "VERDICT: REPORT-ONLY (degraded)"
      : advisories > 0
        ? "VERDICT: REPORT-ONLY — blocking rows are classified, never fatal: the review scopes them to the dependencies a change adds or updates"
        : "VERDICT: REPORT-ONLY",
  );
  return `${lines.join("\n")}\n`;
}

/* ------------------------------------------------------------------ OSV I/O */

/** One OSV request — the only `fetch` in the tree, `S9`'s single dependency. */
async function osvRequest(pathname, init) {
  const response = await fetch(`${OSV_API}${pathname}`, init);
  if (!response.ok) throw new Error(`OSV answered ${response.status} for ${pathname}`);
  return response.json();
}

/** The batched query: a POST, so it goes through the same error contract. */
export const osvBatch = (queries) =>
  osvRequest("/v1/querybatch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ queries }),
  });

/** The full record for one advisory id, where the severity and the fix live. */
export const osvVuln = (id) => osvRequest(`/v1/vulns/${encodeURIComponent(id)}`);

/* ------------------------------------------------------------------ the CLI */

const KNOWN_FLAGS = new Set(["--json", "--help"]);

/**
 * Run the pass. `argv` is parsed here (never in the entry guard) so a usage error
 * and a report are both testable without spawning a process.
 */
export async function run({
  root = REPO_ROOT,
  argv = [],
  json = false,
  fetchBatch = osvBatch,
  fetchVuln = osvVuln,
  write = (text) => process.stdout.write(text),
  writeErr = (text) => process.stderr.write(text),
} = {}) {
  let target = root;
  const unknown = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      target = argv[index + 1] ?? target;
      index += 1;
    } else if (!KNOWN_FLAGS.has(arg)) {
      unknown.push(arg);
    }
  }

  if (argv.includes("--help")) {
    write(`${USAGE}\n`);
    return 0;
  }
  if (unknown.length > 0) {
    writeErr(`dependency-advisory-pass: unknown argument: ${unknown[0]}\n${USAGE}\n`);
    return 2;
  }

  let packages;
  try {
    packages = collectResolved({ root: target });
  } catch (error) {
    writeErr(`dependency-advisory-pass: ${reason(error)}\n`);
    return 2;
  }

  const result = await collectAdvisories({ packages, fetchBatch, fetchVuln });
  const machine = json || argv.includes("--json");
  write(
    machine
      ? `${JSON.stringify({ checked: result.checked, degraded: result.degraded, rows: result.rows }, null, 2)}\n`
      : renderReport(result),
  );
  return 0;
}

async function main(argv) {
  return run({ argv });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
