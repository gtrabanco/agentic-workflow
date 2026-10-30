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
 * that declares exact pins, and when one has drifted it files **one issue** —
 * naming the package, the pinned version and the published version — so the
 * upgrade lands as a deliberate human `fix(deps)` PR and never as a side effect.
 * A pin whose target is a local package under `packages/` is judged against
 * that package's own version, read from the manifest: the same rule and the same
 * evaluator the PR gate applies, so the watch cannot disagree with the gate.
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

import { evaluatePins, localPackageVersions, packageDirs } from "./version-parity-gate.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "gtrabanco/agentic-workflow";

/**
 * The packages whose exact `dependencies` pins are watched: every package under
 * `packages/`, derived from the tree — the same census the PR gate takes, so a
 * new package is watched by existing. A package that declares no exact pin
 * contributes nothing rather than erroring.
 */
export function watchedPackages({ root = REPO_ROOT } = {}) {
  const packages = [];
  for (const dir of packageDirs(root)) {
    const manifest = path.join(root, dir, "package.json");
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(manifest, "utf8"));
    } catch {
      continue; // A package that is not there is not this script's problem to report.
    }
    packages.push({ name: parsed.name ?? dir, dir, dependencies: parsed.dependencies ?? {} });
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

/**
 * Collect drift across every watched package. `fetchLatest(name)` returns the
 * registry's latest version or throws (the CLI wires it to `npm view`; the
 * suite injects fakes, so no test touches the network). `localVersions` is the
 * local sibling census the CLI reads from the tree: a pin on a package that
 * lives in this repository is judged against that package's own version, the
 * same rule and the same evaluator the PR gate applies.
 *
 * The per-package decision is `evaluatePins` — the PR gate's own evaluator, not
 * a second implementation of the same rule.
 */
export function collectDrift({ packages, fetchLatest, localVersions = {} }) {
  const findings = [];
  const degraded = [];
  const skipped = [];
  let checked = 0;

  for (const pkg of packages ?? []) {
    const result = evaluatePins({
      packageName: pkg.name,
      dependencies: pkg.dependencies ?? {},
      fetchLatest,
      localVersions,
    });
    checked += Object.keys(pkg.dependencies ?? {}).length - result.skipped.length;
    skipped.push(...result.skipped.map((entry) => ({ ...entry, package: pkg.name, dir: pkg.dir })));
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
  }

  return { ok: findings.length === 0, findings, degraded, skipped, checked };
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
      `\`${finding.package}\` pins \`${finding.dependency}\` at **${finding.pin}**,`,
      finding.localVersion
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
      `Watched manifest: \`${finding.dir}/package.json\``,
      `Resolve by closing this issue from that PR (a \`Closes\` footer keeps the trace).`,
      `Repository: ${repo}`,
    ].join("\n"),
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
  const lines = [`PIN-WATCH — ${repo}`, `exact pins checked: ${result.checked}`];
  for (const entry of result.skipped) lines.push(`notice: ${entry.package ?? entry.name}: ${entry.message}`);
  for (const entry of result.degraded) lines.push(`::warning::${entry.message} — watch degraded, not failed`);
  for (const finding of result.findings) {
    if (finding.registry === "pypi.org") {
      lines.push(`drift: ${finding.name} ${finding.installed} → ${finding.latest} (pypi.org)`);
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
      `no drift — every exact pin matches the registry's latest and every local pin matches its package (+${plural(result.degraded.length, "degraded entry", "degraded entries")})`,
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
    localVersions: localPackageVersions(),
  });
  const pypiResult = collectPyPIDrift({ packages: watchedPyPI(), fetchLatest: pypiLatest });
  // Merge: both must pass for overall clean
  const allFindings = [...npmResult.findings, ...pypiResult.findings];
  const allDegraded = [...npmResult.degraded, ...pypiResult.degraded];
  const allSkipped = [...npmResult.skipped, ...pypiResult.skipped];
  const checked = npmResult.checked + pypiResult.checked;
  const result = { ok: allFindings.length === 0, findings: allFindings, degraded: allDegraded, skipped: allSkipped, checked };
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else process.stdout.write(`${renderReport(result, { repo })}\n`);

  if (!fileIssues) return result.ok ? 0 : 1;

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
