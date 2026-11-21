#!/usr/bin/env node
/**
 * npm-availability-wait.mjs — wait for a published tarball to be installable
 * before the release pipeline announces it.
 *
 * WHY (2026-11-09, canary run 42638128017): `npm publish` returning success only
 * proves the registry accepted the upload. npm then processes the tarball onto
 * its CDN asynchronously, and during that window the packument, the dist-tag and
 * the git tag can all be visible while the tarball URL still returns 404. The
 * canary cut announced the release immediately after publishing and an install
 * run failed twice (404, then a client-side negative packument cache) on
 * `@gtrabanco/agentic-workflow-schema@5.0.0-canary.20261109.1`. The publish was
 * correct — the shasum matched once the tarball propagated — so the defect is
 * WHEN the pipeline signals "the cut is out".
 *
 * Owner decision 2026-11-21 (canary run 44849041090): a healthy cut lost its
 * tag and pre-release because ONE packument stayed cache-stale past the whole
 * 10-minute budget (the CDN eventually served it, shasum intact) while the
 * three siblings were available within minutes. Two contract changes:
 *   - every packument probe carries a distinct cache-buster query — the
 *     registry's own recommendation for fresh reads — so CDN staleness stops
 *     being the wait's dominant failure mode;
 *   - a TIMEOUT is a WARNING (exit 0): the lag is self-healing and the run must
 *     not lose its announcement to it. Real corruption still fails the run
 *     (exit 1): a shasum mismatch that survives the budget and a malformed dist
 *     are FATAL. A warned package is never reported available.
 *
 * The gate reads the packument, resolves `versions[<v>].dist.tarball` and
 * `dist.shasum`, and polls the tarball until it returns 200 AND the downloaded
 * bytes hash to that shasum — availability plus integrity, never a bare HEAD.
 * On timeout every package that never became available is named on stderr as a
 * WARNING and the run exits 0 (the announcement may proceed); a FATAL (malformed
 * dist, or a shasum mismatch that survives the budget) names its package and
 * exits 1 so the run fails visibly instead of announcing a corrupted release.
 * The timeout verdict follows the package's LAST probe reason: only an
 * integrity mismatch escalates to FATAL, every other stale reason is lag.
 *
 * Usage
 *   node scripts/npm-availability-wait.mjs [--plan <publish-plan.tsv>]
 *     [--timeout <duration>] [--interval <duration>] [<name>@<version> ...]
 *
 *   --plan      a `release.mjs publish-plan` TSV (name, dir, version, tag)
 *   --timeout   overall budget, default 10m (bare number = seconds; ms|s|m)
 *   --interval  poll interval, default 20s (bare number = seconds; ms|s|m)
 *
 * Exit: 0 every package is available and integrity-checked; 1 at least one is
 * not (timeout, mismatch, malformed dist or unreadable packument); 2 usage.
 *
 * Pure Node ESM, node: builtins only, network injected at the core so the suite
 * makes no live registry call. Its sibling suite is
 * `scripts/npm-availability-wait.test.mjs`.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const DEFAULT_TIMEOUT_MS = 600_000;
export const DEFAULT_INTERVAL_MS = 20_000;
export const REGISTRY = "https://registry.npmjs.org";

const USAGE =
  "usage: npm-availability-wait.mjs [--plan <publish-plan.tsv>] " +
  "[--timeout <duration>] [--interval <duration>] [<name>@<version> ...]";

/** `250ms`, `20s`, `10m` or a bare number of seconds; null when unparsable. */
export function parseDuration(value) {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m)?$/.exec(String(value).trim());
  if (!match) return null;
  const factor = match[2] === "ms" ? 1 : match[2] === "m" ? 60_000 : 1_000;
  const ms = Math.round(Number(match[1]) * factor);
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

/** `name@version` with the version after the LAST `@` (scoped names keep theirs). */
export function parsePackageSpec(spec) {
  const text = String(spec).trim();
  const at = text.lastIndexOf("@");
  if (at <= 0 || at === text.length - 1) return null;
  const name = text.slice(0, at);
  const version = text.slice(at + 1);
  if (name === "" || version === "" || version.includes("@")) return null;
  return { name, version };
}

/** The name/version columns of a `publish-plan.tsv`; blank rows are skipped. */
export function parsePlan(text) {
  const packages = [];
  for (const line of String(text).split("\n")) {
    const cells = line.trim().split("\t");
    if (cells.length < 3) continue;
    const name = cells[0].trim();
    const version = cells[2].trim();
    if (name === "" || version === "") continue;
    packages.push({ name, version });
  }
  return packages;
}

export function packumentUrl(name) {
  return `${REGISTRY}/${name.replaceAll("/", "%2F")}`;
}

/** A distinct query per packument request: a CDN cannot serve a stale cached
 * packument to a URL it has never seen (the registry's recommendation for
 * fresh reads). The query is opaque to routing — the tarball URL, which comes
 * from the packument itself, is never cache-busted. */
let probeSequence = 0;
export function cacheBust(url) {
  probeSequence += 1;
  return `${url}?cb=${Date.now().toString(36)}-${probeSequence}`;
}

export function sha1Hex(bytes) {
  return createHash("sha1").update(Buffer.from(bytes)).digest("hex");
}

export function parseArgs(argv) {
  const out = { packages: [], plan: null, timeoutMs: DEFAULT_TIMEOUT_MS, intervalMs: DEFAULT_INTERVAL_MS };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--plan") {
      if (index + 1 >= argv.length) return null;
      out.plan = argv[index + 1];
      index += 1;
    } else if (flag === "--timeout" || flag === "--interval") {
      if (index + 1 >= argv.length) return null;
      const value = parseDuration(argv[index + 1]);
      if (value === null) return null;
      out[flag === "--timeout" ? "timeoutMs" : "intervalMs"] = value;
      index += 1;
    } else if (flag.startsWith("-")) {
      return null;
    } else {
      const spec = parsePackageSpec(flag);
      if (spec === null) return null;
      out.packages.push(spec);
    }
  }
  return out;
}

const sleepFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const label = ({ name, version }) => `${name}@${version}`;

/** One availability attempt: packument → dist → tarball bytes → shasum. */
async function probe(pkg, fetchImpl) {
  const wait = (reason) => ({ available: false, fatal: false, reason });

  let packumentResponse;
  try {
    packumentResponse = await fetchImpl(cacheBust(packumentUrl(pkg.name)));
  } catch (error) {
    return wait(`packument request failed: ${error?.message ?? error}`);
  }
  if (!packumentResponse?.ok) return wait(`packument HTTP ${packumentResponse?.status ?? "no response"}`);

  let packument;
  try {
    packument = await packumentResponse.json();
  } catch {
    return wait("packument is not JSON");
  }

  const entry = packument?.versions?.[pkg.version];
  if (!entry) return wait(`packument does not list ${pkg.version}`);

  const dist = entry.dist;
  if (!dist?.tarball || !dist?.shasum) {
    // A listed version with no dist is malformed registry state, not a slow CDN:
    // polling cannot fix it, so the run fails at once.
    return { available: false, fatal: true, reason: `packument lists ${pkg.version} without dist.tarball/dist.shasum` };
  }

  let tarballResponse;
  try {
    tarballResponse = await fetchImpl(dist.tarball);
  } catch (error) {
    return wait(`tarball request failed: ${error?.message ?? error}`);
  }
  if (!tarballResponse?.ok) return wait(`tarball HTTP ${tarballResponse?.status ?? "no response"}`);

  let bytes;
  try {
    bytes = new Uint8Array(await tarballResponse.arrayBuffer());
  } catch (error) {
    return wait(`tarball body unreadable: ${error?.message ?? error}`);
  }
  const actual = sha1Hex(bytes);
  const expected = String(dist.shasum).toLowerCase();
  if (actual !== expected) return wait(`tarball shasum mismatch (expected ${expected}, got ${actual})`);
  return { available: true, fatal: false, shasum: actual };
}

/**
 * Poll until every package is available or the shared budget expires.
 *
 * `fetchImpl`, `sleepImpl` and `now` are injected so the suite runs on a fake
 * registry and a fake clock; the CLI passes the runtime's real ones.
 */
export async function waitForAvailability({
  packages,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  intervalMs = DEFAULT_INTERVAL_MS,
  fetchImpl = globalThis.fetch,
  sleepImpl = sleepFor,
  now = Date.now,
  logger = () => {},
}) {
  const startedAt = now();
  const deadline = startedAt + timeoutMs;
  const unique = [...new Map(packages.map((pkg) => [label(pkg), { ...pkg, attempts: 0, reason: null }])).values()];
  const available = [];
  const warnings = [];
  const failures = [];
  let pending = unique;

  while (pending.length > 0) {
    const stillPending = [];
    for (const pkg of pending) {
      pkg.attempts += 1;
      const outcome = await probe(pkg, fetchImpl);
      if (outcome.available) {
        pkg.shasum = outcome.shasum;
        pkg.availableAt = now();
        available.push(pkg);
        logger({ type: "available", name: pkg.name, version: pkg.version, attempts: pkg.attempts, shasum: pkg.shasum });
        continue;
      }
      pkg.reason = outcome.reason;
      logger({ type: outcome.fatal ? "failed" : "wait", name: pkg.name, version: pkg.version, attempts: pkg.attempts, reason: pkg.reason });
      if (outcome.fatal) {
        failures.push({ ...pkg, timedOut: false, message: `${label(pkg)}: ${pkg.reason}` });
        continue;
      }
      stillPending.push(pkg);
    }
    pending = stillPending;
    if (pending.length === 0) break;
    if (now() >= deadline) break;
    await sleepImpl(Math.max(1, Math.min(intervalMs, deadline - now())));
  }

  for (const pkg of pending) {
    const entry = { ...pkg, timedOut: true, message: `${label(pkg)}: ${pkg.reason ?? "no attempt completed"}` };
    // The timeout verdict follows the LAST probe reason: a surviving shasum
    // mismatch is corruption, not lag — FATAL. Every other stale reason (a
    // tarball still 404ing, a packument that never listed the version, a
    // network hiccup) is self-healing CDN/cache lag — WARNING.
    if (/shasum mismatch/.test(pkg.reason ?? "")) failures.push(entry);
    else warnings.push(entry);
  }

  return {
    ok: failures.length === 0,
    available,
    warnings,
    failures,
    elapsedMs: now() - startedAt,
  };
}

/** The CLI. Returns the exit code; tests call it with injected network/clock. */
export async function main(argv, deps = {}) {
  const writeErr = deps.writeErr ?? ((line) => process.stderr.write(`${line}\n`));
  const args = parseArgs(argv);
  if (args === null) {
    writeErr(USAGE);
    return 2;
  }

  const packages = [...args.packages];
  if (args.plan !== null) {
    let text;
    try {
      text = fs.readFileSync(args.plan, "utf8");
    } catch (error) {
      writeErr(`npm-availability-wait: cannot read the plan ${args.plan} (${error?.message ?? error})`);
      return 2;
    }
    packages.push(...parsePlan(text));
  }
  if (packages.length === 0) {
    writeErr(`npm-availability-wait: no package@version to wait for\n${USAGE}`);
    return 2;
  }

  const result = await waitForAvailability({
    packages,
    timeoutMs: args.timeoutMs,
    intervalMs: args.intervalMs,
    fetchImpl: deps.fetchImpl ?? globalThis.fetch,
    sleepImpl: deps.sleepImpl ?? sleepFor,
    now: deps.now ?? Date.now,
    logger:
      deps.logger ??
      ((event) => {
        if (event.type === "wait") {
          writeErr(`npm-availability-wait: ${event.name}@${event.version} not available yet (${event.reason}) — attempt ${event.attempts}`);
        }
      }),
  });

  for (const pkg of result.available) {
    writeErr(`npm-availability-wait: ${label(pkg)} available (shasum ${pkg.shasum}, ${pkg.attempts} attempt(s))`);
  }
  for (const warning of result.warnings) {
    writeErr(`npm-availability-wait: WARNING (TIMEOUT after ${Math.round(result.elapsedMs / 1000)}s) — ${warning.message}`);
  }
  for (const failure of result.failures) {
    writeErr(`npm-availability-wait: FAILED — ${failure.message}`);
  }
  return result.ok ? 0 : 1;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) process.exit(await main(process.argv.slice(2)));
