#!/usr/bin/env node
/**
 * version-parity-gate.mjs — PR-triggered version-parity gate for
 * @gtrabanco/pi-agentic-workflow (feature 75, issue #292).
 *
 * Two modes, one question: does the package's shipped content still match its
 * published version?
 *
 *   --content   Offline, deterministic. Three-dot diff vs --base over the
 *               closed trigger set (root `skills/` + `packages/pi-agentic-workflow/`).
 *               Any triggered change ⇒ the package version must differ from
 *               base AND the CHANGELOG.md "Companion npm packages" row for the
 *               new version must exist (via scripts/check-changelog-row.mjs).
 *               This is the #164 option-4 gate, extended with the trigger set
 *               #164 missed: root skills/ is the package's content source but
 *               lives outside the package tree, so a skills-only merge bumps
 *               nothing, publish-pi-package.yml never triggers, and npm ships
 *               stale skills (live 2026-10-15: registry 0.19.1's bundle 5 files
 *               behind main's skills/; schema pin 4.5.0 vs registry 4.6.0).
 *
 *   --pins      Online. For every exact `dependencies` pin, compares the
 *               registry's latest version against the pin; registry > pin ⇒
 *               fail with the fix in the message ("bump the pin + the package
 *               version in the same PR"). A registry that cannot be reached is
 *               a clearly-degraded pass (visible ::warning::, exit 0) — a
 *               network blip must never redden a PR no commit caused (AC3).
 *               peerDependencies and non-exact specs are skipped with a notice
 *               (peer ranges are ranges by nature; the exact-pin rule for
 *               `dependencies` is the package's own lockfile-policy test's job).
 *
 * Exit codes: 0 = PASS (or degraded pass), 1 = FAIL, 2 = usage error.
 * Read-only except nothing: no writes, no state. Dependency-free: node:
 * builtins only; git/npm run as spawned CLIs.
 *
 * Usage:
 *   node scripts/version-parity-gate.mjs --content [--base <git-ref>]
 *   node scripts/version-parity-gate.mjs --pins   [--package <dir>]
 *
 * --base defaults to origin/main when it resolves, else main. --package
 * defaults to packages/pi-agentic-workflow.
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PACKAGE_DIR = "packages/pi-agentic-workflow";
export const TRIGGER_PREFIXES = Object.freeze([
  "skills/",
  "packages/pi-agentic-workflow/",
]);

// ---------------------------------------------------------------------------
// semver comparison (dependency-free; prerelease sorts below its release)
// ---------------------------------------------------------------------------

const SEMVER_RE =
  /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

function parseSemver(version) {
  const m = SEMVER_RE.exec(String(version ?? "").trim());
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ?? null,
  };
}

/** True when `a` is strictly newer than `b`. Non-parsable input sorts lowest. */
export function semverGt(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return false;
  for (const key of ["major", "minor", "patch"]) {
    if (pa[key] !== pb[key]) return pa[key] > pb[key];
  }
  // Same numeric triple: a release outranks any prerelease; two prereleases
  // compare dot-separated identifier-wise (numeric identifiers numerically).
  if (pa.prerelease === pb.prerelease) return false;
  if (pa.prerelease === null) return true;
  if (pb.prerelease === null) return false;
  const left = pa.prerelease.split(".");
  const right = pb.prerelease.split(".");
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const l = left[i];
    const r = right[i];
    if (l === undefined) return false; // shorter prefix sorts lower
    if (r === undefined) return true;
    const ln = /^\d+$/.test(l);
    const rn = /^\d+$/.test(r);
    if (ln && rn) {
      if (Number(l) !== Number(r)) return Number(l) > Number(r);
    } else if (ln !== rn) {
      return rn; // numeric identifiers sort lower than alphanumeric
    } else if (l !== r) {
      return l > r;
    }
  }
  return false;
}

/** Exact pin = a bare semver version, no range operator, tag, path or shorthand. */
export function isExactSemver(spec) {
  return SEMVER_RE.test(String(spec ?? "").trim());
}

// ---------------------------------------------------------------------------
// content mode (offline, deterministic)
// ---------------------------------------------------------------------------

/**
 * Pure decision core for --content. `changelogRowCount` is the number of
 * CHANGELOG rows stating headVersion inside the package's companion table
 * (CLI side fetches it from scripts/check-changelog-row.mjs — the single
 * owner of that count).
 */
export function evaluateContent({
  packageName,
  packageJsonPath,
  triggerPrefixes,
  changedFiles,
  baseVersion,
  headVersion,
  changelogRowCount,
}) {
  const triggered = (changedFiles ?? []).filter((file) =>
    triggerPrefixes.some((prefix) => file.startsWith(prefix)),
  );
  if (triggered.length === 0) {
    return {
      ok: true,
      code: "no-triggered-change",
      message:
        "no change under the trigger set (skills/**, packages/pi-agentic-workflow/**) — nothing to enforce",
      triggered,
    };
  }
  const versionBumped = semverGt(headVersion, baseVersion) || (!baseVersion && !!headVersion);
  if (!versionBumped || headVersion === baseVersion) {
    return {
      ok: false,
      code: "shipped-content-version",
      message:
        `GATE REJECTION — shipped-content-version\n` +
        `  ${packageName} ships changed content (${triggered.length} file(s) under skills/** or packages/pi-agentic-workflow/**)\n` +
        `  but its version is unchanged vs base (${baseVersion}).\n` +
        `  Fix: bump ${packageJsonPath} and add the CHANGELOG.md "Companion npm packages" companion row\n` +
        `  for the new version — in the same PR. A skills-only merge without a bump publishes nothing to npm.`,
      triggered,
    };
  }
  if (changelogRowCount !== 1) {
    return {
      ok: false,
      code: "companion-row-missing",
      message:
        `GATE REJECTION — companion-row-missing\n` +
        `  ${packageName} is bumped to ${headVersion} but the CHANGELOG.md "Companion npm packages" table\n` +
        `  has ${changelogRowCount} row(s) stating ${headVersion} (expected exactly 1).\n` +
        `  Fix: add the companion row for ${headVersion} in the same PR.`,
      triggered,
    };
  }
  return {
    ok: true,
    code: "content-parity",
    message: `content parity holds: version ${baseVersion} → ${headVersion}, companion row present`,
    triggered,
  };
}

function git(args, { allowFailure = false } = {}) {
  const r = spawnSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (r.status !== 0 || r.error) {
    if (allowFailure) return null;
    failUsage(`git ${args.join(" ")} failed: ${(r.stderr || r.error?.message || "").trim()}`);
  }
  return r.stdout.trim();
}

function resolveBase(explicit) {
  if (explicit) return explicit;
  for (const candidate of ["origin/main", "main"]) {
    if (git(["rev-parse", "--verify", "--quiet", candidate], { allowFailure: true })) {
      return candidate;
    }
  }
  return failUsage("no --base given and neither origin/main nor main resolves");
}

/**
 * Every path this branch touches: the committed range against `base` **unioned
 * with the working tree**, because a PR's jobs run against a checkout whose
 * content is what the merge would ship. A three-dot diff alone is blind to an
 * uncommitted edit, so a change staged but not yet committed read as "nothing
 * under the trigger set" and the gate passed where it exists to fail.
 */
export function changedFilesSince(base) {
  const committed = git(["diff", "--name-only", `${base}...HEAD`], { allowFailure: true }) ?? "";
  const dirty = git(["status", "--porcelain=v1", "-z", "--untracked-files=all"], { allowFailure: true }) ?? "";
  const files = new Set(committed.split("\n").filter(Boolean));
  for (const path of porcelainPaths(dirty)) files.add(path);
  return [...files];
}

/** The target paths of a porcelain v1 `-z` status listing (renames keep both sides). */
function porcelainPaths(raw) {
  const paths = [];
  const entries = raw.split("\0");
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.length < 4) continue;
    const status = entry.slice(0, 2);
    const normalized = entry.replace(/^(.{2}) /u, "$1");
    paths.push(normalized.slice(2));
    if (status.includes("R") || status.includes("C")) {
      const original = entries[(index += 1)];
      if (original) paths.push(original);
    }
  }
  return paths;
}

function packageVersionAt(ref, packageJsonPath) {
  const raw = git(["show", `${ref}:${packageJsonPath}`], { allowFailure: true });
  if (raw === null) return ""; // file absent in base — any head version counts as a bump
  return String(JSON.parse(raw).version ?? "");
}

function readPackageVersion(packageJsonPath) {
  const raw = fs.readFileSync(path.resolve(REPO_ROOT, packageJsonPath), "utf8");
  return String(JSON.parse(raw).version ?? "");
}

/** Delegates the row count to check-changelog-row.mjs — the count's single owner. */
function changelogRowCount(version, packageDir) {
  const script = path.join(REPO_ROOT, "scripts", "check-changelog-row.mjs");
  const heading = path.basename(packageDir); // e.g. "pi-agentic-workflow"
  const r = spawnSync(process.execPath, [script, heading, version], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const count = Number((r.stdout || "").trim());
  return Number.isFinite(count) ? count : 0;
}

function runContent({ base }) {
  const ref = resolveBase(base);
  const packageJsonPath = `${PACKAGE_DIR}/package.json`;
  const files = changedFilesSince(ref);
  const headVersion = readPackageVersion(packageJsonPath);
  const baseVersion = packageVersionAt(ref, packageJsonPath);
  const result = evaluateContent({
    packageName: `@gtrabanco/${path.basename(PACKAGE_DIR)}`,
    packageJsonPath,
    triggerPrefixes: TRIGGER_PREFIXES,
    changedFiles: files,
    baseVersion,
    headVersion,
    changelogRowCount: changelogRowCount(headVersion, PACKAGE_DIR),
  });
  const head = git(["rev-parse", "--short", "HEAD"]);
  console.log(`VERSION-PARITY-GATE (content) — base ${ref} head ${head}`);
  console.log(`trigger set: ${TRIGGER_PREFIXES.join(", ")}`);
  console.log(`changed files: ${files.length}, triggered: ${result.triggered.length}`);
  console.log(`version: ${baseVersion || "(absent)"} → ${headVersion}`);
  console.log(result.message);
  console.log(`VERDICT: ${result.ok ? "PASS" : "FAIL"}`);
  process.exit(result.ok ? 0 : 1);
}

// ---------------------------------------------------------------------------
// pins mode (registry; clearly degraded when unreachable)
// ---------------------------------------------------------------------------

/**
 * Pure decision core for --pins. `fetchLatest(name)` returns the registry's
 * latest version string or throws (the CLI wires it to `npm view <name>
 * version`; tests inject fakes).
 */
export function evaluatePins({ packageName, dependencies, fetchLatest }) {
  const violations = [];
  const degraded = [];
  const skipped = [];
  for (const [name, spec] of Object.entries(dependencies ?? {})) {
    if (!isExactSemver(spec)) {
      skipped.push({
        name,
        spec,
        message: `${name}: "${spec}" is not an exact pin — skipped (peer ranges are ranges by nature; the exact-pin rule for dependencies is the package's lockfile-policy test's job)`,
      });
      continue;
    }
    let latest;
    try {
      latest = fetchLatest(name);
    } catch (err) {
      degraded.push({
        name,
        message: `registry unreachable for ${name}: ${String(err?.message ?? err).split("\n")[0]}`,
      });
      continue;
    }
    if (semverGt(latest, spec)) {
      violations.push({
        name,
        pin: spec,
        latest,
        message:
          `GATE REJECTION — dependency-pin-drift\n` +
          `  ${packageName} pins ${name} at ${spec} but the registry published ${latest}.\n` +
          `  Fix: bump the pin + the package version in the same PR (consumers cannot reach the newer package while the pin holds).`,
      });
    }
  }
  return { violations, degraded, skipped };
}

/** npm view as the registry fetcher; throws on any failure (degraded path). */
function npmLatest(name) {
  const r = spawnSync("npm", ["view", name, "version"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 30_000,
  });
  if (r.status !== 0 || r.error) {
    throw new Error((r.stderr || r.error?.message || "npm view failed").trim().split("\n")[0]);
  }
  return r.stdout.trim();
}

function runPins({ packageDir }) {
  const pkgJsonPath = path.join(packageDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, pkgJsonPath), "utf8"));
  const packageName = pkg.name ?? packageDir;
  const result = evaluatePins({
    packageName,
    dependencies: pkg.dependencies ?? {},
    fetchLatest: npmLatest,
  });
  console.log(`VERSION-PARITY-GATE (pins) — ${packageName}`);
  console.log(`exact pins checked: ${Object.keys(pkg.dependencies ?? {}).length - result.skipped.length}`);
  for (const s of result.skipped) console.log(`notice: ${s.message}`);
  for (const d of result.degraded) console.log(`::warning::${d.message} — gate degraded, not failed (AC3)`);
  for (const v of result.violations) console.log(v.message);
  console.log(`VERDICT: ${result.violations.length === 0 ? "PASS" : "FAIL"}${result.degraded.length ? " (degraded)" : ""}`);
  process.exit(result.violations.length === 0 ? 0 : 1);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function failUsage(message) {
  console.error(`version-parity-gate: ${message}`);
  process.exit(2);
}

function main(argv) {
  const args = argv.slice(2);
  const mode = args.filter((a) => a === "--content" || a === "--pins");
  if (mode.length !== 1) {
    failUsage("usage: node scripts/version-parity-gate.mjs --content [--base <ref>] | --pins [--package <dir>]");
  }
  const flagValue = (flag) => {
    const i = args.indexOf(flag);
    return i === -1 ? undefined : args[i + 1];
  };
  if (mode[0] === "--content") {
    runContent({ base: flagValue("--base") });
  } else {
    runPins({ packageDir: flagValue("--package") ?? PACKAGE_DIR });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv);
}
