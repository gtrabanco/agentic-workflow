#!/usr/bin/env node
/**
 * version-parity-gate.mjs — PR-triggered version-parity gate for
 * @gtrabanco/pi-agentic-workflow (feature 75, issue #292).
 *
 * Two modes, one question: does the package's shipped content still match its
 * published version?
 *
 *   --content   Offline, deterministic. Three-dot diff vs --base over the
 *               trigger set of EVERY package under `packages/` — the package
 *               list is derived from the tree at runtime, so a new package
 *               inherits the gate by existing (NOTE: the only wiring to keep
 *               when the repo grows is the skills-content-source mapping,
 *               PACKAGE_DIR, if root `skills/` ever stops being the Pi
 *               package's staged content). A triggered package must either
 *               bump its version + companion CHANGELOG row, or ship a valid
 *               `.changeset/*.md` declaring it — the release applies it
 *               (feature 40). This is the #164 option-4 gate, extended with
 *               the trigger set #164 missed: root skills/ is the package's
 *               content source but lives outside the package tree, so a
 *               skills-only merge bumps nothing, the old per-package publish
 *               workflows never triggered, and npm ships stale skills (live
 *               2026-10-15: registry 0.19.1's bundle 5 files behind main's
 *               skills/; schema pin 4.5.0 vs registry 4.6.0).
 *
 *   --pins      Online + offline. For EVERY package under `packages/` (not just
 *               the Pi one) and every exact `dependencies` pin whose target has
 *               a local sibling package, the pin must equal the LOCAL package
 *               version (the one this merge publishes) — a pin behind it
 *               recreates the post-publish red window, a pin ahead of
 *               everything points at a version that will never exist; this
 *               check is offline-deterministic and holds even when the
 *               registry is unreachable. Both sides are read from the two
 *               manifests, never from a number written in a test or a doc.
 *               Without a local sibling, the registry's latest is compared
 *               against the pin; registry > pin ⇒ fail with the fix in the
 *               message ("bump the pin + the package version in the same PR").
 *               A registry that cannot be reached is a clearly-degraded pass
 *               (visible ::warning::, exit 0) — a network blip must never redden
 *               a PR no commit caused (AC3).
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
 * narrows --pins to one package directory; by default every package under
 * `packages/` is checked, because a pin is a fact about two manifests and the
 * package a run forgets to name is the one a stale pin hides in.
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseChangeset } from "./lint-changeset.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PACKAGE_DIR = "packages/pi-agentic-workflow";

/**
 * The per-package trigger prefixes. Every package enforces its own tree; the
 * one declared coupling is the skills content source — root `skills/` is the
 * staged content of the Pi package only (AGENTS.md "Packages"). If a new
 * package ever becomes a skills content source, extend THIS mapping — the
 * rest of the gate derives itself from the tree.
 */
export function contentTriggerPrefixes(packageDir) {
  const prefixes = [];
  if (packageDir === PACKAGE_DIR) prefixes.push("skills/");
  prefixes.push(`${packageDir}/`);
  return prefixes;
}

/** The Pi package's own trigger set (kept pinned for the --pins default and
 *  the historical AC2 assertion). */
export const TRIGGER_PREFIXES = Object.freeze(contentTriggerPrefixes(PACKAGE_DIR));

/**
 * Every package the content half enforces, derived from the tree: one entry
 * per directory under `packages/` carrying a `package.json`. A new package
 * inherits the gate by existing — no list to extend, no trigger set to amend.
 */
export function packageDirs(root = REPO_ROOT) {
  const dir = path.join(root, "packages");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, "package.json")))
    .map((e) => `packages/${e.name}`)
    .sort();
}

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

/**
 * What a manifest dependency spec says about the versions it accepts:
 *
 *   exact    `6.0.3` — one version, and the `--pins` half can verify it.
 *   partial  `7` / `7.0` — a deliberate partial pin (AGENTS.md → Packages):
 *            every patch of that major (or major.minor) is accepted, so the
 *            spec names a range the lock resolves and the registry may move
 *            inside. Nothing in the PR gate watches it; the scheduled watch
 *            does, by comparing the registry's newest in-range release with
 *            the version the committed lock resolves.
 *   floating `^7.0.3`, `~7`, `*`, `latest`, `7.x`, `file:`, `workspace:`
 *            — not a pin at all. The manifest tests refuse these for a
 *            published package; the watch reports them instead of skipping
 *            them silently, so one cannot hide in a package that has no such
 *            test.
 */
export function specKind(spec) {
  const value = String(spec ?? "").trim();
  if (SEMVER_RE.test(value)) return "exact";
  if (/^\d+$/u.test(value) || /^\d+\.\d+$/u.test(value)) return "partial";
  return "floating";
}

/** True when `version` falls inside the range `spec` accepts (exact or partial). */
export function matchesSpec(spec, version) {
  const wanted = parseSemver(version);
  if (!wanted) return false;
  const value = String(spec ?? "").trim();
  const kind = specKind(value);
  if (kind === "exact") return value === String(version).trim();
  if (kind !== "partial") return false;
  const [major, minor] = value.split(".");
  if (wanted.major !== Number(major)) return false;
  return minor === undefined || wanted.minor === Number(minor);
}

/** The newest version of `versions` that `spec` accepts, or null. */
export function newestMatching(versions, spec) {
  let best = null;
  for (const version of versions ?? []) {
    if (!matchesSpec(spec, version)) continue;
    if (best === null || semverGt(version, best)) best = version;
  }
  return best;
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
  changesetIntent = [],
}) {
  const triggered = (changedFiles ?? []).filter((file) =>
    triggerPrefixes.some((prefix) => file.startsWith(prefix)),
  );
  if (triggered.length === 0) {
    return {
      ok: true,
      code: "no-triggered-change",
      message: `no change under ${triggerPrefixes.join(", ")} — nothing to enforce`,
      triggered,
    };
  }
  const versionBumped = semverGt(headVersion, baseVersion) || (!baseVersion && !!headVersion);
  if (!versionBumped || headVersion === baseVersion) {
    // The changeset route (feature 40, issue #180): a PR may declare the bump
    // intent in a valid .changeset/*.md instead of bumping the package.json —
    // scripts/release.mjs applies it at release time. A malformed intent file
    // never sails through (AC-16: fail closed).
    const malformed = changesetIntent.find((entry) => !entry.ok);
    if (malformed) {
      return {
        ok: false,
        code: "changeset-invalid",
        message:
          `GATE REJECTION — changeset-invalid\n` +
          `  ${packageName} ships changed content and the intent file ${malformed.file} is malformed:\n` +
          `  ${malformed.error}\n` +
          `  Fix: repair the file (see scripts/lint-changeset.mjs) or bump ${packageJsonPath}\n` +
          `  and add the CHANGELOG.md "Companion npm packages" row — in the same PR.`,
        triggered,
      };
    }
    // A skill entry declares the package whose trigger set carries skills/
    // (the skills-content package): skills are its shipped content (D-40-15).
    const declaring = changesetIntent.find((entry) =>
      (entry.entries ?? []).some(
        (e) => e.pkg === packageName || (e.kind === "skill" && triggerPrefixes.includes("skills/")),
      ),
    );
    if (declaring) {
      return {
        ok: true,
        code: "changeset-intent",
        message:
          `changeset route: ${declaring.file} declares ${packageName} — the bump happens at\n` +
          `  release time via scripts/release.mjs; no package.json bump or companion row is\n` +
          `  required in this PR (feature 40).`,
        triggered,
      };
    }
    return {
      ok: false,
      code: "shipped-content-version",
      message:
        `GATE REJECTION — shipped-content-version\n` +
        `  ${packageName} ships changed content (${triggered.length} file(s) under ${triggerPrefixes.join(", ")})\n` +
        `  but its version is unchanged vs base (${baseVersion}).\n` +
        `  Fix: bump ${packageJsonPath} and add the CHANGELOG.md "Companion npm packages" companion row\n` +
        `  for the new version — in the same PR. A skills-only merge without a bump publishes nothing to npm.\n` +
        `  Alternative: add a valid .changeset/*.md declaring ${packageName} (the release applies it).`,
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

/**
 * Pure decision core for the whole content half: every package under `packages/`,
 * each judged independently (bump + companion row, or a valid changeset declaring
 * it), the gate failing if ANY triggered package fails. `packages` carries the
 * per-package data the CLI wires from the tree.
 */
export function evaluateContentAll({ packages, changedFiles, changesetIntent = [] }) {
  const results = (packages ?? []).map((p) => ({
    packageName: p.packageName,
    ...evaluateContent({ ...p, changedFiles, changesetIntent }),
  }));
  const enforced = results.filter((r) => r.code !== "no-triggered-change");
  if (enforced.length === 0) {
    return { ok: true, code: "no-triggered-change", results };
  }
  const failed = results.filter((r) => !r.ok);
  return {
    ok: failed.length === 0,
    code: failed.length > 0 ? failed[0].code : "content-parity",
    results,
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

/**
 * Delegates the row count to check-changelog-row.mjs — the count's single owner.
 * The heading is the BACKTICKED scoped package name: the script's matcher is a
 * substring match, and "agentic-workflow" is contained in both sibling names,
 * so a basename heading would count rows across all three companion tables.
 */
export function changelogRowCount(version, packageDir, packageName) {
  const script = path.join(REPO_ROOT, "scripts", "check-changelog-row.mjs");
  const heading = `\`${packageName}\``;
  const r = spawnSync(process.execPath, [script, heading, version], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const count = Number((r.stdout || "").trim());
  return Number.isFinite(count) ? count : 0;
}

/**
 * The PR's .changeset/*.md intent files (added/modified, README ignored), read
 * from the working tree and parsed. This is the changeset route of the
 * content half: a valid file declaring the package replaces the manual bump
 * (feature 40, issue #180).
 */
function collectChangesetIntent(files) {
  const intent = [];
  for (const file of files) {
    if (!/^\.changeset\/[^/]+\.md$/.test(file) || file.endsWith("/README.md")) continue;
    const abs = path.resolve(REPO_ROOT, file);
    let content;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue; // deleted or unreadable — nothing to enforce from it
    }
    const parsed = parseChangeset(content);
    intent.push({ file, ok: parsed.ok, entries: parsed.ok ? parsed.entries : [], error: parsed.ok ? null : parsed.error });
  }
  return intent;
}

function runContent({ base }) {
  const ref = resolveBase(base);
  const files = changedFilesSince(ref);
  const changesetIntent = collectChangesetIntent(files);
  const dirs = packageDirs();
  if (dirs.length === 0) {
    failUsage(`no package manifests under ${path.join(REPO_ROOT, "packages")}`);
  }
  const packages = dirs.map((dir) => {
    const packageJsonPath = `${dir}/package.json`;
    const headVersion = readPackageVersion(packageJsonPath);
    const pkgName = String(
      JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, packageJsonPath), "utf8")).name ?? dir,
    );
    return {
      packageName: pkgName,
      packageJsonPath,
      triggerPrefixes: contentTriggerPrefixes(dir),
      baseVersion: packageVersionAt(ref, packageJsonPath),
      headVersion,
      changelogRowCount: changelogRowCount(headVersion, dir, pkgName),
    };
  });
  const all = evaluateContentAll({ packages, changedFiles: files, changesetIntent });
  const head = git(["rev-parse", "--short", "HEAD"]);
  console.log(`VERSION-PARITY-GATE (content) — base ${ref} head ${head}`);
  console.log(
    `trigger set: every package under packages/ (derived: ${dirs.join(", ")}) + skills/ as ${PACKAGE_DIR}'s content source`,
  );
  console.log(`changed files: ${files.length}`);
  for (const r of all.results) {
    console.log(`\n[${r.packageName}] ${r.code}`);
    console.log(r.message.replace(/^/gm, "  ").trimEnd());
  }
  console.log(`\nVERDICT: ${all.ok ? "PASS" : "FAIL"}`);
  process.exit(all.ok ? 0 : 1);
}

// ---------------------------------------------------------------------------
// pins mode (registry; clearly degraded when unreachable)
// ---------------------------------------------------------------------------

/**
 * Pure decision core for --pins. `fetchLatest(name)` returns the registry's
 * latest version string or throws (the CLI wires it to `npm view <name>
 * version`; tests inject fakes).
 */
export function evaluatePins({ packageName, dependencies, fetchLatest, localVersions }) {
  const violations = [];
  const degraded = [];
  const skipped = [];
  const notices = [];
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
      latest = undefined;
    }
    const localVersion = localVersions?.[name];
    // Registry rule first (precedence over the local check): a pin behind the
    // published latest is a violation even when it matches the local package —
    // that is a branch off an outdated main, and rebasing is the fix.
    if (latest !== undefined && semverGt(latest, spec)) {
      violations.push({
        name,
        pin: spec,
        latest,
        message:
          `GATE REJECTION — dependency-pin-drift\n` +
          `  ${packageName} pins ${name} at ${spec} but the registry published ${latest}.\n` +
          `  Fix: bump the pin + the package version in the same PR (consumers cannot reach the newer package while the pin holds).`,
      });
      continue;
    }
    // Local rule: a pin whose target has a local package under packages/ is
    // verified against the LOCAL version — the one this merge will publish —
    // closing the registry-vs-local bind: a pin behind it recreates the
    // post-publish red window, a pin ahead of everything points at a version
    // that will never exist. Offline-deterministic: it holds even when the
    // registry is unreachable (a network blip still degrades, never fails, a
    // pin that matches its local package — AC3).
    if (localVersion !== undefined) {
      if (spec !== localVersion) {
        violations.push({
          name,
          pin: spec,
          localVersion,
          message:
            `GATE REJECTION — dependency-pin-drift\n` +
            `  ${packageName} pins ${name} at ${spec} but the local package version is ${localVersion}.\n` +
            `  The pin points at a version that is neither published nor the local package version.\n` +
            `  Fix: bump the pin to the local package version in the same PR (the merge publishes it; consumers cannot reach a package the pin does not name).`,
        });
        continue;
      }
      notices.push({
        name,
        message: `${name}: pin ${spec} matches the local package version (verified offline; the merge publishes it when the registry is behind)`,
      });
    }
  }
  return { violations, degraded, skipped, notices };
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

/** The local sibling packages' name → version at HEAD — the offline authority
 * a pin is verified against alongside the registry (the merge publishes them). */
export function localPackageVersions() {
  const packagesDir = path.join(REPO_ROOT, "packages");
  const versions = {};
  if (!fs.existsSync(packagesDir)) return versions;
  for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgJsonPath = path.join(packagesDir, entry.name, "package.json");
    if (!fs.existsSync(pkgJsonPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    if (pkg.name && pkg.version) versions[pkg.name] = String(pkg.version);
  }
  return versions;
}

function runPins({ packageDir }) {
  const dirs = packageDir ? [packageDir] : packageDirs();
  if (dirs.length === 0) failUsage(`no package manifests under ${path.join(REPO_ROOT, "packages")}`);
  const localVersions = localPackageVersions();
  const results = dirs.map((dir) => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, dir, "package.json"), "utf8"));
    const packageName = pkg.name ?? dir;
    const dependencies = pkg.dependencies ?? {};
    return {
      packageName,
      dependencies,
      ...evaluatePins({ packageName, dependencies, fetchLatest: npmLatest, localVersions }),
    };
  });
  const violations = results.flatMap((r) => r.violations);
  const degraded = results.flatMap((r) => r.degraded);
  console.log(`VERSION-PARITY-GATE (pins) — ${results.map((r) => r.packageName).join(", ")}`);
  console.log(`local packages read from packages/*/package.json: ${Object.entries(localVersions).map(([n, v]) => `${n}@${v}`).join(", ") || "none"}`);
  for (const r of results) {
    console.log(`[${r.packageName}] exact pins checked: ${Object.keys(r.dependencies).length - r.skipped.length}`);
    for (const s of r.skipped) console.log(`notice: ${s.message}`);
    for (const n of r.notices) console.log(`notice: ${n.message}`);
    for (const d of r.degraded) console.log(`::warning::${d.message} — gate degraded, not failed (AC3)`);
    for (const v of r.violations) console.log(v.message);
  }
  console.log(`VERDICT: ${violations.length === 0 ? "PASS" : "FAIL"}${degraded.length ? " (degraded)" : ""}`);
  process.exit(violations.length === 0 ? 0 : 1);
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
