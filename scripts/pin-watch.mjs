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

import { evaluatePins } from "./version-parity-gate.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "gtrabanco/agentic-workflow";

/**
 * The packages whose exact `dependencies` pins are watched. Both are the ones
 * that declare any (PE-012): the Pi package (three pins after P1) and the
 * runner (typebox). A package with no exact pin contributes nothing rather
 * than erroring.
 */
export function watchedPackages({ root = REPO_ROOT } = {}) {
  const packages = [];
  for (const dir of ["packages/pi-agentic-workflow", "packages/agentic-workflow"]) {
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
 * Collect drift across every watched package. `fetchLatest(name)` returns the
 * registry's latest version or throws (the CLI wires it to `npm view`; the
 * suite injects fakes, so no test touches the network).
 *
 * The per-package decision is `evaluatePins` — the PR gate's own evaluator, not
 * a second implementation of the same rule.
 */
export function collectDrift({ packages, fetchLatest }) {
  const findings = [];
  const degraded = [];
  const skipped = [];
  let checked = 0;

  for (const pkg of packages ?? []) {
    const result = evaluatePins({
      packageName: pkg.name,
      dependencies: pkg.dependencies ?? {},
      fetchLatest,
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
      });
    }
  }

  return { ok: findings.length === 0, findings, degraded, skipped, checked };
}

/** The stable token an issue title carries, so a later run recognises its own issue. */
export function driftMarker(packageName, dependency) {
  return `${packageName}/${dependency}`;
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
      `but the registry published **${finding.latest}**.`,
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
  for (const entry of result.skipped) lines.push(`notice: ${entry.package}: ${entry.message}`);
  for (const entry of result.degraded) lines.push(`::warning::${entry.message} — watch degraded, not failed`);
  for (const finding of result.findings) {
    lines.push(`drift: ${finding.package} · ${finding.dependency} ${finding.pin} → ${finding.latest}`);
  }
  if (result.findings.length === 0) {
    lines.push(`no drift — every exact pin matches the registry's latest (+${plural(result.degraded.length, "degraded entry", "degraded entries")})`);
    lines.push(`VERDICT: PASS${result.degraded.length > 0 ? " (degraded)" : ""}`);
  } else {
    lines.push(
      `drift: ${plural(result.findings.length, "pin")} behind the registry — ` +
        `fix with a deliberate \`fix(deps)\` PR (bump the pin + the package version + its CHANGELOG row)`,
    );
    lines.push("VERDICT: DRIFT");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CLI wiring (spawned CLIs — never called by the suite)
// ---------------------------------------------------------------------------

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

  const result = collectDrift({ packages: watchedPackages(), fetchLatest: npmLatest });
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else process.stdout.write(`${renderReport(result, { repo })}\n`);

  if (!fileIssues) return result.ok ? 0 : 1;

  if (result.findings.length === 0) return 0;

  let plan;
  try {
    plan = planIssues({ findings: result.findings, openIssues: openIssues(repo) });
  } catch (error) {
    // Filing is best-effort on a network host: report the drift loudly and let
    // the exit code carry the signal rather than crashing on a gh hiccup.
    process.stdout.write(`::warning::issue planning failed: ${error.message}\n`);
    return 1;
  }

  for (const { finding, issue } of plan.reuse) {
    process.stdout.write(`reused open issue #${issue.number} for ${finding.dependency}\n`);
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

  // A weekly job that re-files a known drift stays green; only a genuinely new
  // drift reddens the schedule, which is what makes the alert worth reading.
  return opened > 0 ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv);
}
