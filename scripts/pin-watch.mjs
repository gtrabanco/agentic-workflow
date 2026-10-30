#!/usr/bin/env node
/**
 * pin-watch.mjs — dependency-pin drift watch (feature 67 P3, AC2, issue #219
 * decision D1's addendum; obligation O3).
 *
 * The Pi package's `dependencies` are exact pins on purpose (AGENTS.md →
 * Packages: a fresh install must reproduce the lockfile byte-for-byte), and the
 * PR-time `--pins` half of `version-parity-gate.mjs` already fails a pin whose
 * registry target has published a newer version. That gate only sees a PR.
 * This is the scheduled early warning in front of it: it looks at every package
 * under `packages/` — runtime AND development pins, because the compiler and the
 * typings are devDependencies and their majors are exactly what a weekly watch
 * is for — and when one has drifted it files **one issue** naming the package and
 * both versions, so the upgrade lands as a deliberate human `fix(deps)` PR and
 * never as a side effect. A pin whose target is a local package under
 * `packages/` is judged against that package's own version, read from the
 * manifest: the same rule and the same evaluator the PR gate applies, so the
 * watch cannot disagree with the gate.
 *
 * A **partial** pin (`7`, `7.0`) names a range the committed lock resolves and
 * the registry moves inside, so the PR gate has nothing to compare: drift there
 * means the lock fell behind the newest release inside that range. A newer major
 * outside the range is a notice, never drift — taking a major is an owner
 * decision. Nightlies are never news.
 *
 * A second half (issue #321) watches `serena-agent` on PyPI — installed vs
 * published — and files the same kind of drift issue. `serena-agent` is a tool
 * installed on the operator's machine (`uv tool install serena-agent`), not a
 * manifest pin, so "drift" here means the machine's install is behind PyPI.
 * The installed version is read from the tool itself (`serena --version`,
 * then `uv tool list`, then `pip show`): the uv-tool venv `pip show` cannot
 * see is the install route this repo documents. A machine without it
 * contributes a skipped entry, never an error.
 *
 * What it deliberately does NOT do: it never bumps a pin, never edits a
 * manifest, never opens a PR. The upgrade cadence is a human decision (PE-005).
 *
 * Two entry shapes, one core:
 *   --check        print the report; exit 1 on drift, 0 clean or degraded.
 *   --file-issues  as --check, then open (or reuse) the tracking issue per
 *                  drifted dependency. Exits 1 only when a NEW issue was
 *                  opened — a weekly job that re-files a known drift must stay
 *                  green, or the alert becomes the noise it was meant to avoid.
 *
 * Degraded, never failed, when the registry cannot be reached: a network blip
 * must not redden a scheduled run no commit caused (the same rule the PR-time
 * gate's `--pins` half follows).
 *
 * Exit codes: 0 = PASS (clean or degraded), 1 = drift, 2 = usage/IO error.
 * Read-only apart from the issues it files. Node builtins only; `npm` and `gh`
 * are spawned CLIs, and both are injectable for the offline suite.
 *
 * Usage:
 *   node scripts/pin-watch.mjs [--check|--file-issues] [--json] [--repo <owner/name>]
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  evaluatePins,
  localPackageVersions,
  newestMatching,
  packageDirs,
  semverGt,
  specKind,
} from "./version-parity-gate.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "gtrabanco/agentic-workflow";

/**
 * The packages whose pins are watched: every package under `packages/`, derived
 * from the tree — the same census the PR gate takes, so a new package is watched
 * by existing. A package that declares no pin contributes nothing rather than
 * erroring.
 */
export function watchedPackages({ root = REPO_ROOT } = {}) {
  const packages = [];
  // Derived from the tree: a new package is watched by existing, and a package
  // the census forgets is exactly where a stale pin hides.
  for (const dir of packageDirs(root)) {
    const manifest = path.join(root, dir, "package.json");
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(manifest, "utf8"));
    } catch {
      continue; // A package that is not there is not this script's problem to report.
    }
    // Runtime AND development pins: the compiler and the typings are
    // devDependencies, and their versions are exactly what a weekly watch is
    // for (a major that shows up outside a partial pin is news, not drift).
    // peerDependencies stay out: they are ranges the host resolves.
    packages.push({
      name: parsed.name ?? dir,
      dir,
      dependencies: {
        ...(parsed.dependencies ?? {}),
        ...(parsed.optionalDependencies ?? {}),
        ...(parsed.devDependencies ?? {}),
      },
    });
  }
  return packages;
}

/**
 * Python packages whose PyPI versions are watched. Each entry names the PyPI
 * package and the version expected on the operator's machine (read from the
 * installed version at check time). Drift is reported when PyPI has a newer
 * version.
 *
 * S5: extend pin-watch to check serena-agent on PyPI (installed vs latest).
 */
export function watchedPyPI() {
  return [
    // `expectedVersion` is null: the installed version is read from the machine
    // at check time (see `installedVersion`), never pinned in this file.
    // `binary` is the PATH shim `uv tool install` exposes for the package —
    // the first source `installedVersion` asks.
    { name: "serena-agent", binary: "serena", expectedVersion: null },
  ];
}

/** The committed lock, parsed. `bun.lock` is JSONC (trailing commas). */
export function parseLock(text) {
  return JSON.parse(String(text).replace(/,(\s*[}\]])/g, "$1"));
}

/**
 * The lock that governs `dir`: the workspace root's — scripts/
 * workspace-lock-policy.test.mjs owns that location, one lock for every member
 * — or the package's own in a repository that has no workspace root.
 */
export function lockFileFor({ root = REPO_ROOT, dir }) {
  for (const candidate of [path.join(root, "bun.lock"), path.join(root, dir, "bun.lock")]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * The version the committed lock resolved for `dependency` in `dir`, or null.
 * A workspace link (`name@workspace:packages/x`) is not a version, and a
 * dependency the lock does not carry is not a silent pass either: the caller
 * reports that the watch cannot tell whether the pin has moved.
 */
export function resolvedVersion({ root = REPO_ROOT, dir, dependency }) {
  const file = lockFileFor({ root, dir });
  if (!file) return null;
  const entry = parseLock(fs.readFileSync(file, "utf8")).packages?.[dependency];
  const spec = Array.isArray(entry) ? String(entry[0] ?? "") : "";
  const version = spec.slice(spec.lastIndexOf("@") + 1);
  return /^\d/u.test(version) ? version : null;
}

/** The newest of a version list, or null. */
function newestOf(versions) {
  let best = null;
  for (const version of versions ?? []) if (best === null || semverGt(version, best)) best = version;
  return best;
}

/** Releases only: a nightly is not the news a weekly watch reports. */
const stableOnly = (versions) => (versions ?? []).filter((v) => !String(v).includes("-"));

/**
 * Collect drift across every watched package.
 *
 * `fetchLatest(name)` returns the registry's latest version or throws (the CLI
 * wires it to `npm view`; the suite injects fakes, so no test touches the
 * network), and `fetchVersions(name)` returns every published version — the
 * input a partial pin needs. `localVersions` is the local sibling census the
 * CLI reads from the tree: a pin on a package that lives in this repository is
 * judged against that package's own version, the same rule the PR gate applies.
 *
 * An **exact** pin is decided by `evaluatePins` — the PR gate's own evaluator,
 * not a second implementation of the same rule. A **partial** pin (`7`, `7.0`)
 * is judged against the registry's newest release *inside the range it
 * accepts*, compared with the version the committed lock resolves — the spec
 * names a range, so "behind" means the lock has fallen out of date, not that a
 * new major exists. A newer major outside the range is a notice, never drift:
 * taking it is an owner decision. A spec that is not a pin at all is reported,
 * not skipped, so one cannot hide in a package with no manifest test.
 */
export function collectDrift({
  packages,
  fetchLatest,
  fetchVersions,
  localVersions = {},
  resolveVersion = resolvedVersion,
  root = REPO_ROOT,
}) {
  const findings = [];
  const degraded = [];
  const skipped = [];
  let checked = 0;

  const notices = [];

  for (const pkg of packages ?? []) {
    const exact = {};
    const partial = [];
    for (const [name, spec] of Object.entries(pkg.dependencies ?? {})) {
      const kind = specKind(spec);
      if (kind === "exact") exact[name] = spec;
      else if (kind === "partial") partial.push([name, spec]);
      // A floating spec is not a pin: the evaluator reports it as skipped with
      // its reason, and the report prints every skipped entry as a notice.
    }

    const result = evaluatePins({
      packageName: pkg.name,
      dependencies: pkg.dependencies ?? {},
      fetchLatest,
      localVersions,
    });
    checked += Object.keys(exact).length;
    const partialNames = new Set(partial.map(([name]) => name));
    skipped.push(
      ...result.skipped
        .filter((entry) => !partialNames.has(entry.name))
        .map((entry) => ({ ...entry, package: pkg.name, dir: pkg.dir })),
    );
    degraded.push(...result.degraded.map((entry) => ({ ...entry, package: pkg.name })));
    for (const violation of result.violations) {
      findings.push({
        package: pkg.name,
        dir: pkg.dir,
        dependency: violation.name,
        pin: violation.pin,
        latest: violation.latest,
        localVersion: violation.localVersion,
      });
    }

    for (const [name, spec] of partial) {
      let versions;
      try {
        versions = fetchVersions(name);
      } catch (err) {
        degraded.push({ package: pkg.name, name, message: `registry unreachable for ${name}: ${String(err?.message ?? err).split("\n")[0]}` });
        continue;
      }
      checked += 1;
      const stable = stableOnly(versions);
      const newest = newestMatching(stable, spec);
      const resolved = resolveVersion({ root, dir: pkg.dir, dependency: name });
      if (newest === null) {
        degraded.push({ package: pkg.name, name, message: `the registry lists no ${name} release inside the partial pin "${spec}" — nothing to compare` });
        continue;
      }
      if (resolved === null) {
        notices.push({
          package: pkg.name,
          message: `${name}: partial pin "${spec}" but the lock carries no resolved version — the watch cannot tell whether the pin has moved (run bun install and commit the lock)`,
        });
        continue;
      }
      if (semverGt(newest, resolved)) {
        findings.push({ package: pkg.name, dir: pkg.dir, dependency: name, pin: spec, resolved, latest: newest, kind: "partial" });
      } else {
        notices.push({
          package: pkg.name,
          message: `${name}: partial pin "${spec}" is current (lock ${resolved}; newest in range ${newest})`,
        });
      }
      const newestOverall = newestOf(stable);
      if (newestOverall !== null && semverGt(newestOverall, newest)) {
        notices.push({
          package: pkg.name,
          message: `${name}: ${newestOverall} is published outside the partial pin "${spec}" — a major upgrade is an owner decision, not drift`,
        });
      }
    }
  }

  return { ok: findings.length === 0, findings, degraded, skipped, notices, checked };
}

/** The stable token an issue title carries, so a later run recognises its own issue. */
export function driftMarker(packageName, dependency) {
  return `${packageName}/${dependency}`;
}

/** The issue a PyPI finding would file. */
export function pypiIssueFor(finding, { repo = REPO } = {}) {
  return {
    name: finding.name,
    registry: "pypi.org",
    installed: finding.installed,
    latest: finding.latest,
    title: `chore(deps): pin drift in ${finding.name} (PyPI)`,
    body: [
      `\`${finding.name}\` is at **${finding.installed}** on this machine,`,
      `but pypi.org published **${finding.latest}**.`,
      "",
      "Reported by the scheduled pin watch (`scripts/pin-watch.mjs`; the PyPI half",
      "was added by issue #321). Upgrading should be a deliberate manual step",
      "never a side effect of other work.",
      "",
      "Resolve by running the appropriate installer (uv/pipx) and closing this issue.",
      `Repository: ${repo}`,
    ].join("\n"),
  };
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/** The issue a finding would file, naming the package and both versions. */
export function issueFor(finding, { repo = REPO } = {}) {
  const marker = driftMarker(finding.package, finding.dependency);
  return {
    package: finding.package,
    dependency: finding.dependency,
    pin: finding.pin,
    latest: finding.latest,
    title: `chore(deps): pin drift in ${marker}`,
    body: [
      finding.kind === "partial"
        ? `\`${finding.package}\` pins \`${finding.dependency}\` with the deliberate partial pin **${finding.pin}**;`
        : `\`${finding.package}\` pins \`${finding.dependency}\` at **${finding.pin}**,`,
      finding.kind === "partial"
        ? `the committed lock resolves **${finding.resolved}**, and the registry has **${finding.latest}** inside that range.`
        : finding.localVersion
          ? `but the local package in this repository carries **${finding.localVersion}**.`
          : `but the registry published **${finding.latest}**.`,
      "",
      "Reported by the scheduled pin watch (`scripts/pin-watch.mjs`, feature 67",
      "AC2 / issue #219). The PR-time `version-parity-gate.mjs --pins` half fails",
      "the same drift once it reaches a PR; this is the early warning in front of it.",
      "",
      "**The fix is a deliberate `fix(deps)` PR**: bump the pin and the package",
      "version together, with the CHANGELOG companion row (AGENTS.md → Packages).",
      "Nothing is bumped automatically — dependency upgrades are never side effects",
      "of other work.",
      "",
      finding.repoUrl ? `Release notes: ${finding.repoUrl}` : null,
      "Read the release notes that cover this window before bumping, and record in",
      "the PR which changes matter here and which do not: the watch names the",
      "version that moved, not what it changed.",
      "",
      `Watched manifest: \`${finding.dir}/package.json\``,
      `Resolve by closing this issue from that PR (a \`Closes\` footer keeps the trace).`,
      `Repository: ${repo}`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  };
}

/**
 * Decide what to file. An open issue whose title carries the same marker is
 * reused — including when the published version moved again, because the
 * operator is already tracking that dependency and a second issue is noise.
 */
export function planIssues({ findings, openIssues = [] }) {
  const open = [];
  const reuse = [];
  for (const finding of findings ?? []) {
    const marker = driftMarker(finding.package, finding.dependency);
    const existing = (openIssues ?? []).find((issue) => new RegExp(escapeRegExp(marker), "u").test(issue.title ?? ""));
    if (existing) reuse.push({ finding, issue: existing });
    else open.push(issueFor(finding));
  }
  return { open, reuse };
}

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** The fixed human report. */
export function renderReport(result, { repo = REPO } = {}) {
  const lines = [`PIN-WATCH — ${repo}`, `pins checked: ${result.checked}`];
  for (const entry of result.skipped) lines.push(`notice: ${entry.package ?? entry.name}: ${entry.message}`);
  for (const entry of result.notices ?? []) lines.push(`notice: ${entry.package ? `${entry.package}: ` : ""}${entry.message}`);
  for (const entry of result.degraded) lines.push(`::warning::${entry.message} — watch degraded, not failed`);
  for (const finding of result.findings) {
    if (finding.registry === "pypi.org") {
      lines.push(`drift: ${finding.name} ${finding.installed} → ${finding.latest} (pypi.org)`);
    } else if (finding.kind === "partial") {
      lines.push(
        `drift: ${finding.package} · ${finding.dependency} ${finding.resolved} → ${finding.latest} ` +
          `(inside the partial pin \`${finding.pin}\`; the lock has fallen behind the range)`,
      );
    } else if (finding.localVersion) {
      lines.push(
        `drift: ${finding.package} · ${finding.dependency} ${finding.pin} → ${finding.localVersion} (local package version)`,
      );
    } else {
      lines.push(`drift: ${finding.package} · ${finding.dependency} ${finding.pin} → ${finding.latest}`);
    }
  }
  if (result.findings.length === 0) {
    lines.push(
      `no drift — every exact pin matches the registry's latest or its local package version, ` +
        `and every partial pin matches the newest release in its range ` +
        `(+${plural(result.degraded.length, "degraded entry", "degraded entries")})`,
    );
    lines.push(`VERDICT: PASS${result.degraded.length > 0 ? " (degraded)" : ""}`);
  } else {
    lines.push(
      `drift: ${plural(result.findings.length, "pin")} out of parity — ` +
        `fix with a deliberate \`fix(deps)\` PR (bump the pin + the package version + its CHANGELOG row)`,
    );
    lines.push("VERDICT: DRIFT");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CLI wiring (spawned CLIs — never called by the suite)
// ---------------------------------------------------------------------------

/**
 * PyPI as the registry fetcher; throws on any failure (the degraded path).
 * PyPI's JSON API via `curl` first — it needs no Python tooling on PATH,
 * which matters because the machine this watch exists for installs
 * `serena-agent` through `uv tool` and may have no pip binary at all.
 * `pip index versions` (pip ≥ 21.2) is the fallback.
 */
export function pypiLatest(name) {
  const viaApi = spawnSync("curl", ["-fsS", `https://pypi.org/pypi/${name}/json`], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  });
  if (viaApi.status === 0 && viaApi.stdout) {
    const fromApi = parsePypiLatest(viaApi.stdout);
    if (fromApi !== null) return fromApi;
  }
  const result = spawnSync("pip", ["index", "versions", name], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      (result.stderr || result.error?.message || "pip index versions failed").trim().split("\n")[0],
    );
  }
  // Output: "serena-agent (2.1.0)\nAvailable versions: 2.0.0, 1.7.0, ...\n  INSTALLED: 1.7.0"
  const line = result.stdout.trim().split("\n")[0];
  const match = /^.+ \(([^)]+)\)/u.exec(line);
  if (!match) throw new Error("pip index versions returned unexpected format");
  return match[1];
}

/** The version PyPI's JSON API payload reports, or null. Pure; the suite tests this. */
export function parsePypiLatest(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    const version = parsed?.info?.version;
    return typeof version === "string" && version !== "" ? version : null;
  } catch {
    return null;
  }
}

/**
 * Read the installed version of a watched Python package from the machine.
 * Most-specific source first:
 *
 *   1. the tool's own binary on PATH (`serena --version`) — the shim
 *      `uv tool install` exposes, i.e. the install route this repo documents;
 *   2. `uv tool list` — names uv-managed tools even when the shim is off PATH;
 *   3. `pip show` — a pip-managed install (the legacy fallback).
 *
 * A machine with none of the three returns null: `collectPyPIDrift` records a
 * skipped entry, never an error. `probe(bin, args)` returns the command's
 * stdout or null when the CLI is absent or fails; injectable so the offline
 * suite never touches the system.
 */
export function installedVersion(entry, { probe = spawnProbe } = {}) {
  const name = entry?.name;
  if (!name) return null;
  if (entry.binary) {
    for (const flag of ["--version", "-V"]) {
      const out = probe(entry.binary, [flag]);
      if (out !== null) {
        const match = /(\d+(?:\.\d+)+)/u.exec(out);
        if (match) return match[1];
      }
    }
  }
  const uv = probe("uv", ["tool", "list"]);
  if (uv !== null) {
    const match = new RegExp(`^${escapeRegExp(name)}\\s+v?(\\S+)`, "mu").exec(uv);
    if (match) return match[1];
  }
  const pip = probe("pip", ["show", name]);
  if (pip !== null) {
    const match = /^Version:\s*(\S+)/mu.exec(pip);
    if (match) return match[1];
  }
  return null;
}

/** One spawned probe: stdout, or null when the CLI is absent or fails. */
function spawnProbe(bin, args) {
  const result = spawnSync(bin, args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout ?? "";
}

/**
 * Collect drift for PyPI packages. Each entry carries the installed version
 * (read at runtime by `installedVersion`) and the latest from PyPI.
 * Drift = latest > installed. `readInstalled` is injectable so the offline
 * suite never touches the system.
 */
export function collectPyPIDrift({ packages, fetchLatest, readInstalled = installedVersion }) {
  const findings = [];
  const degraded = [];
  const skipped = [];
  let checked = 0;

  for (const entry of packages ?? []) {
    try {
      const installed = readInstalled(entry);
      if (installed === null) {
        skipped.push({ name: entry.name, message: "not installed on this machine" });
        continue;
      }
      const latest = fetchLatest(entry.name);
      checked += 1;
      // Compare: latest > installed → drift
      // Simple semver compare: split into parts and compare numerically
      const latestParts = latest.split(".").map((p) => parseInt(p, 10) || 0);
      const installedParts = installed.split(".").map((p) => parseInt(p, 10) || 0);
      let isDrift = false;
      for (let i = 0; i < Math.max(latestParts.length, installedParts.length); i++) {
        const lp = latestParts[i] ?? 0;
        const ip = installedParts[i] ?? 0;
        if (lp > ip) { isDrift = true; break; }
        if (lp < ip) { break; } // installed is newer (unlikely)
      }
      if (isDrift) {
        findings.push({
          name: entry.name,
          registry: "pypi.org",
          installed,
          latest,
        });
      }
    } catch (error) {
      degraded.push({ name: entry.name, message: `PyPI check degraded: ${error.message}` });
    }
  }

  return { ok: findings.length === 0, findings, degraded, skipped, checked };
}

/** The repository URL a finding's release notes live under, or null. */
function npmRepoUrl(name) {
  const r = spawnSync("npm", ["view", name, "repository.url", "homepage", "--json"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 30_000,
  });
  if (r.status !== 0 || r.error) return null;
  try {
    const info = JSON.parse(r.stdout);
    const repo = typeof info?.["repository.url"] === "string" ? info["repository.url"] : "";
    const url = repo.replace(/^git\+/u, "").replace(/\.git$/u, "");
    if (/^https?:\/\//u.test(url)) return `${url}/releases`;
    return typeof info?.homepage === "string" && info.homepage !== "" ? info.homepage : null;
  } catch {
    return null;
  }
}

/** `npm view <name> versions --json` as the in-range fetcher; throws on failure. */
function npmVersions(name) {
  const r = spawnSync("npm", ["view", name, "versions", "--json"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 30_000,
  });
  if (r.status !== 0 || r.error) {
    throw new Error((r.stderr || r.error?.message || "npm view versions failed").trim().split("\n")[0]);
  }
  const parsed = JSON.parse(r.stdout);
  return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
}

/** npm view as the registry fetcher; throws on any failure (the degraded path). */
export function npmLatest(name) {
  const result = spawnSync("npm", ["view", name, "version"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  });
  if (result.error || result.status !== 0) {
    throw new Error((result.stderr || result.error?.message || "npm view failed").trim().split("\n")[0]);
  }
  return result.stdout.trim();
}

/** Every open issue's number and title — what the dedupe reads. */
function openIssues(repo) {
  const result = spawnSync(
    "gh",
    ["issue", "list", "--repo", repo, "--state", "open", "--limit", "200", "--json", "number,title"],
    { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30_000 },
  );
  if (result.error || result.status !== 0) {
    throw new Error((result.stderr || result.error?.message || "gh issue list failed").trim().split("\n")[0]);
  }
  try {
    const parsed = JSON.parse(result.stdout);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new Error("gh issue list did not return JSON");
  }
}

function createIssue(repo, issue) {
  const result = spawnSync("gh", ["issue", "create", "--repo", repo, "--title", issue.title, "--body", issue.body], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  });
  if (result.error || result.status !== 0) {
    throw new Error((result.stderr || result.error?.message || "gh issue create failed").trim().split("\n")[0]);
  }
  return (result.stdout ?? "").trim();
}

function main(argv) {
  const args = argv.slice(2);
  const fileIssues = args.includes("--file-issues");
  const json = args.includes("--json");
  const repoIndex = args.indexOf("--repo");
  const repo = repoIndex === -1 ? REPO : (args[repoIndex + 1] ?? REPO);
  const unknown = args.filter(
    (arg, index) =>
      !["--check", "--file-issues", "--json", "--repo"].includes(arg) && args[index - 1] !== "--repo",
  );
  if (unknown.length > 0) {
    process.stderr.write(`pin-watch: unknown argument: ${unknown[0]}\n`);
    process.stderr.write("usage: node scripts/pin-watch.mjs [--check|--file-issues] [--json] [--repo <owner/name>]\n");
    return 2;
  }

  const npmResult = collectDrift({
    packages: watchedPackages(),
    fetchLatest: npmLatest,
    fetchVersions: npmVersions,
    localVersions: localPackageVersions(),
  });
  const pypiResult = collectPyPIDrift({ packages: watchedPyPI(), fetchLatest: pypiLatest });
  // Merge: both must pass for overall clean
  const allFindings = [...npmResult.findings, ...pypiResult.findings];
  const allDegraded = [...npmResult.degraded, ...pypiResult.degraded];
  const allSkipped = [...npmResult.skipped, ...pypiResult.skipped];
  const checked = npmResult.checked + pypiResult.checked;
  const allNotices = [...(npmResult.notices ?? []), ...(pypiResult.notices ?? [])];
  const result = { ok: allFindings.length === 0, findings: allFindings, degraded: allDegraded, skipped: allSkipped, notices: allNotices, checked };
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else process.stdout.write(`${renderReport(result, { repo })}\n`);

  if (!fileIssues) return result.ok ? 0 : 1;

  // A finding names the version that moved; where it moved from is what the
  // reader needs next, so the issue carries the release-notes URL when the
  // registry knows one. Best effort: an unreachable registry leaves it out.
  for (const finding of result.findings) {
    if (finding.registry !== "pypi.org" && finding.repoUrl === undefined) {
      finding.repoUrl = npmRepoUrl(finding.dependency);
    }
  }

  if (result.findings.length === 0 && pypiResult.findings.length === 0) return 0;

  // The open-issue list is fetched once and feeds both halves' dedupe: the
  // npm marker match and the PyPI title match read the same list.
  let issues;
  try {
    issues = openIssues(repo);
  } catch (error) {
    // Filing is best-effort on a network host: report the drift loudly and let
    // the exit code carry the signal rather than crashing on a gh hiccup.
    process.stdout.write(`::warning::issue planning failed: ${error.message}\n`);
    return 1;
  }

  // Only npm findings go through the marker-based dedupe: a PyPI finding has
  // no package/dependency pair, and feeding it to planIssues would corrupt the
  // marker match. PyPI findings are filed in their own pass below.
  const plan = planIssues({ findings: npmResult.findings, openIssues: issues });

  for (const { finding, issue } of plan.reuse) {
    const dep = finding.dependency ?? finding.name;
    process.stdout.write(`reused open issue #${issue.number} for ${dep}\n`);
  }
  let opened = 0;
  try {
    for (const issue of plan.open) {
      process.stdout.write(`opened ${createIssue(repo, issue)}\n`);
      opened += 1;
    }
  } catch (error) {
    process.stdout.write(`::warning::issue creation failed: ${error.message}\n`);
    return 1;
  }

  // PyPI findings are filed separately (they don't use driftMarker dedup).
  // Reuse is based on the issue title matching the package name.
  const pypiFindings = allFindings.filter((f) => f.registry === "pypi.org");
  if (pypiFindings.length > 0) {
    try {
      for (const pyFinding of pypiFindings) {
        const existing = issues.find(
          (issue) => issue.title && issue.title.includes(pyFinding.name),
        );
        if (existing) {
          process.stdout.write(`reused open issue #${existing.number} for ${pyFinding.name} (PyPI)\n`);
        } else {
          const pyIssue = pypiIssueFor(pyFinding);
          process.stdout.write(`opened ${createIssue(repo, pyIssue)}\n`);
          opened += 1;
        }
      }
    } catch (error) {
      process.stdout.write(`::warning::PyPI issue creation failed: ${error.message}\n`);
      return 1;
    }
  }

  // A weekly job that re-files a known drift stays green; only a genuinely new
  // drift reddens the schedule, which is what makes the alert worth reading.
  return opened > 0 ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv);
}
