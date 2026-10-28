#!/usr/bin/env node
/**
 * setup-env.mjs — the authoring repo's idempotent bootstrap (issue #331,
 * unit fix/331-authoring-setup, S2/S6/S7).
 *
 * A developer (or agent session) that clones this repository gets one command
 * that provisions the authoring toolchain that used to be discoverable only by
 * reading logs and AGENTS.md side notes:
 *
 *   node scripts/setup-env.mjs           install what is missing
 *   node scripts/setup-env.mjs --check   verify only — installs nothing,
 *                                        writes nothing; exit 0 / 1
 *
 * What it installs (binaries first, S7 — never a package manager as the only
 * route):
 *   node        verified only — never installed. Major must be ≥ the
 *               `.node-version` major (exact equality not required; a newer
 *               toolchain is accepted — planning evidence PE-006).
 *   bun         the official installer (https://bun.sh/install) when absent.
 *   uv          the official installer (https://astral.sh/uv/install.sh) when
 *               absent.
 *   serena      `uv tool install -p 3.13 serena-agent` (the repo's canonical
 *               route, feature 67) when the `serena` binary is absent. The
 *               committed `.serena/project.yml` is verified in every mode.
 *   engram      Homebrew tap `gentleman-programming/tap/engram` on macOS when
 *               brew is present; otherwise the GitHub-Releases tarball for the
 *               platform, extracted into `~/.local/bin` (design decision D1 —
 *               the binary is neither a uv tool nor an npm package).
 *   gentle-engram  `pi install npm:gentle-engram@latest` (feature 66's pinned
 *               route, never `engram setup pi`) when the pi package is absent.
 *               Requires the `pi` CLI, which this script does not install —
 *               a machine without pi is an unresolvable prerequisite and fails
 *               with a message naming it.
 *
 * What it never does: initialize, wipe or rewrite `.engram/` (committed shared
 * state — guarded by `setup-env.test.mjs`'s byte-identity test, not prose),
 * run `engram setup`, `pi-engram init` or `serena init` (all three write
 * config the repo owns), or create a root `package.json` (two-islands rule).
 *
 * Idempotent by construction: every step is decided from a probe of the
 * machine, so a second run plans zero installs. All decision functions are
 * exported and take injected state/probes — the offline suite never touches
 * the network or the real toolchain.
 *
 * Exit codes: 0 = provisioned or verified; 1 = missing/unresolvable
 * prerequisite (check mode) or a failed install; 2 = usage error.
 *
 * Usage:
 *   node scripts/setup-env.mjs [--check]
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const BUN_INSTALL = "curl -fsSL https://bun.sh/install | bash";
/**
 * The bun installer pinned to an exact version (S2a, PE-013): the official
 * installer accepts a git tag argument — `bash -s "bun-v<version>"`. With no
 * pin it falls back to latest.
 */
export function bunInstallCommand(pinnedVersion) {
  return pinnedVersion ? `${BUN_INSTALL} -s "bun-v${pinnedVersion}"` : BUN_INSTALL;
}
export const UV_INSTALL = "curl -LsSf https://astral.sh/uv/install.sh | sh";
export const SERENA_INSTALL = "uv tool install -p 3.13 serena-agent";
export const PI_ENGRAM_INSTALL = "pi install npm:gentle-engram@latest";
export const BREW_ENGRAM_INSTALL = "brew install gentleman-programming/tap/engram";
export const ENGRAM_RELEASES = "https://github.com/Gentleman-Programming/engram/releases";
export const SERENA_PYTHON = "3.13";

/**
 * Windows is documented as WSL-only (S7): refuse before any check or install,
 * naming the supported route.
 */
export function platformGuard(platform) {
  if (platform === "win32") {
    return {
      ok: false,
      message:
        "Windows is not a supported target for this repo's authoring toolchain — run the scripts inside WSL instead. See docs/workflow/SETUP.md (Windows-via-WSL note).",
    };
  }
  return { ok: true, message: "" };
}

/** The major version a `.node-version` pins, or null when unreadable. */
export function parseNodeMajor(text) {
  const match = /^v?(\d+)/u.exec(String(text ?? "").trim());
  return match ? Number(match[1]) : null;
}

/**
 * The engram release asset name for a tag, platform and arch — the layout the
 * project's GoReleaser ships (PE-002): `engram_<tag>_<os>_<arch>.tar.gz`.
 */
export function engramAssetName(tag, platform, arch) {
  const osName = platform === "darwin" ? "darwin" : platform === "linux" ? "linux" : null;
  if (!osName) throw new Error(`engram tarball is not available for platform ${platform}`);
  const archName = arch === "arm64" ? "arm64" : "amd64";
  return `engram_${tag}_${osName}_${archName}.tar.gz`;
}

/**
 * PATH for the passes after an installer ran: the bun and uv installers write
 * into `~/.bun/bin` and `~/.local/bin` but only mutate the shell profile, so
 * the same process must prepend them itself to probe what it just installed.
 * Entries already present are never duplicated.
 */
export function augmentPath(home, currentPath) {
  const additions = [path.join(home, ".bun", "bin"), path.join(home, ".local", "bin")];
  const existing = String(currentPath ?? "").split(":").filter(Boolean);
  const merged = [...additions.filter((dir) => !existing.includes(dir)), ...existing];
  return merged.join(":");
}

/** One spawned probe: stdout trimmed, or null when the CLI is absent or fails. */
function spawnProbe(bin, args, { cwd = REPO_ROOT } = {}) {
  const result = spawnSync(bin, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30_000 });
  if (result.error || result.status !== 0) return null;
  return (result.stdout ?? "").trim();
}

/** The first version-looking token in a probe output, or null. */
function versionToken(output) {
  const match = /(\d+(?:\.\d+)+)/u.exec(output ?? "");
  return match ? match[1] : null;
}

/**
 * The installed gentle-engram pi-package version, read from pi's agent
 * directory (PE-007): `$PI_CODING_AGENT_DIR` or `~/.pi/agent`, then
 * `npm/node_modules/gentle-engram/package.json`. Injectable for the suite.
 */
export function readPiPackageVersion({ env = {}, home = "", fsMod = fs } = {}) {
  const agentDir = env.PI_CODING_AGENT_DIR || path.join(home, ".pi", "agent");
  const manifest = path.join(agentDir, "npm", "node_modules", "gentle-engram", "package.json");
  try {
    return String(JSON.parse(fsMod.readFileSync(manifest, "utf8")).version ?? "") || null;
  } catch {
    return null;
  }
}

/**
 * Probe the machine into the decision state. Every input is injectable:
 * `probe` for the CLIs, `root`/`home`/`env` for the filesystem, `platform`
 * for the OS, `readPiPackageVersion` for the pi package manifest. A bare
 * machine probes cleanly into all-absent — it never throws.
 */
export function probeEnvironment({ root = REPO_ROOT, platform = process.platform, home = os.homedir(), env = process.env, probe = spawnProbe, readPiPackageVersion: readPiPkg = readPiPackageVersion } = {}) {
  const nodeOut = probe("node", ["--version"]);
  const bunOut = probe("bun", ["--version"]);
  const uvOut = probe("uv", ["--version"]);
  const serenaOut = probe("serena", ["--version"]);
  const engramOut = probe("engram", ["--version"]);
  const piOut = probe("pi", ["--version"]);
  const brewOut = platform === "darwin" ? probe("brew", ["--version"]) : null;

  let projectYml = { present: false, bytes: null };
  try {
    const bytes = fs.statSync(path.join(root, ".serena", "project.yml")).size;
    projectYml = { present: bytes > 0, bytes };
  } catch {
    // absent stays absent
  }

  // Local, gitignored state a fresh worktree lacks (S9): the checks are
  // path-shaped so the same probe works in any checkout.
  const isDir = (p) => {
    try {
      return fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  };
  const cachePresent = isDir(path.join(root, ".serena", "cache"));
  const schemaDistPresent = isDir(path.join(root, "packages", "agentic-workflow-schema", "dist"));
  const piCrateModulesPresent = isDir(path.join(root, "packages", "pi-agentic-workflow", "node_modules"));

  // Committed shared state is verified read-only (PE-012, owner decision
  // "Solo estado local"): parse errors are reported, the bytes never change.
  let engramConfigValid = false;
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(root, ".engram", "config.json"), "utf8"));
    engramConfigValid = typeof parsed?.project_name === "string" && parsed.project_name.length > 0;
  } catch {
    engramConfigValid = false;
  }

  let requiredNodeMajor = null;
  try {
    requiredNodeMajor = parseNodeMajor(fs.readFileSync(path.join(root, ".node-version"), "utf8"));
  } catch {
    // no .node-version → no node gate
  }

  let bunPinned = null;
  try {
    const text = String(fs.readFileSync(path.join(root, ".bun-version"), "utf8")).trim();
    bunPinned = text ? text.replace(/^v/u, "") : null;
  } catch {
    // no .bun-version → bun installs latest
  }

  return {
    platform,
    home,
    nodeMajor: versionToken(nodeOut) ? Number(versionToken(nodeOut).split(".")[0]) : null,
    requiredNodeMajor,
    bun: { present: bunOut !== null, version: versionToken(bunOut) },
    bunPinned,
    uv: { present: uvOut !== null, version: versionToken(uvOut) },
    serena: { present: serenaOut !== null, version: versionToken(serenaOut) },
    engram: { present: engramOut !== null, version: versionToken(engramOut) },
    pi: { present: piOut !== null, version: versionToken(piOut) },
    brew: { present: brewOut !== null },
    gentleEngram: { present: readPiPkg({ env, home, fsMod: fs }) !== null, version: readPiPkg({ env, home, fsMod: fs }) },
    projectYml,
    cachePresent,
    schemaDistPresent,
    piCrateModulesPresent,
    engramConfigValid,
  };
}

/**
 * The check-mode verdict (AC2): every tool verified in place, nothing
 * installed, nothing written. `ok` is the exit-code mapping — true → 0,
 * false → 1 — and every row names the tool and what was checked.
 */
export function verify(state) {
  const results = [];

  if (state.nodeMajor === null) {
    results.push({ tool: "node", ok: false, detail: "node is not on PATH — install Node.js (see docs/workflow/SETUP.md); this script never installs node" });
  } else if (state.requiredNodeMajor !== null && state.nodeMajor < state.requiredNodeMajor) {
    results.push({ tool: "node", ok: false, detail: `node v${state.nodeMajor} is behind the major the repo's .node-version pins (${state.requiredNodeMajor})` });
  } else {
    results.push({ tool: "node", ok: true, detail: `node v${state.nodeMajor}${state.requiredNodeMajor !== null ? ` (≥ .node-version major ${state.requiredNodeMajor})` : ""}` });
  }

  const tools = [
    ["bun", state.bun, "bun"],
    ["uv", state.uv, "uv"],
    ["serena", state.serena, "serena (serena-agent via uv tool)"],
    ["engram", state.engram, "engram"],
  ];
  for (const [tool, entry, label] of tools) {
    if (tool === "bun" && entry.present && state.bunPinned && entry.version !== state.bunPinned) {
      results.push({ tool, ok: false, detail: `bun ${entry.version} does not match the version .bun-version pins (${state.bunPinned}) — run without --check to repair` });
      continue;
    }
    results.push(
      entry.present
        ? { tool, ok: true, detail: `${label} ${entry.version ?? "(version unreadable)"}${tool === "bun" && state.bunPinned ? " (== .bun-version)" : ""}` }
        : { tool, ok: false, detail: `${label} is not installed` },
    );
  }

  results.push(
    state.pi.present
      ? { tool: "pi", ok: true, detail: `pi ${state.pi.version ?? "(version unreadable)"}` }
      : { tool: "pi", ok: false, detail: "pi is not installed — required for the gentle-engram pi package (see docs/workflow/SETUP.md)" },
  );
  results.push(
    state.gentleEngram.present
      ? { tool: "gentle-engram", ok: true, detail: `npm:gentle-engram ${state.gentleEngram.version ?? "(version unreadable)"}` }
      : { tool: "gentle-engram", ok: false, detail: "npm:gentle-engram is not installed in the pi agent directory" },
  );

  results.push(
    state.projectYml.present
      ? { tool: "serena-project", ok: true, detail: `.serena/project.yml present (${state.projectYml.bytes} bytes)` }
      : { tool: "serena-project", ok: false, detail: "the committed .serena/project.yml is missing or empty" },
  );
  results.push(
    state.engramConfigValid
      ? { tool: "engram-config", ok: true, detail: ".engram/config.json is valid committed JSON with a project_name" }
      : { tool: "engram-config", ok: false, detail: "the committed .engram/config.json is missing, invalid JSON, or has no project_name — fix it in a commit; this script never rewrites it" },
  );
  results.push(
    state.cachePresent
      ? { tool: "serena-cache", ok: true, detail: ".serena/cache present (local, gitignored)" }
      : { tool: "serena-cache", ok: false, detail: ".serena/cache is missing (local state a fresh worktree lacks) — run without --check to create it" },
  );
  results.push(
    state.schemaDistPresent
      ? { tool: "schema-dist", ok: true, detail: "packages/agentic-workflow-schema/dist built" }
      : { tool: "schema-dist", ok: false, detail: "packages/agentic-workflow-schema/dist is missing (gitignored build output the root suites require) — run without --check to build it" },
  );
  results.push(
    state.piCrateModulesPresent
      ? { tool: "pi-crate-modules", ok: true, detail: "packages/pi-agentic-workflow/node_modules installed" }
      : { tool: "pi-crate-modules", ok: false, detail: "packages/pi-agentic-workflow/node_modules is missing — run without --check to install" },
  );

  return { ok: results.every((row) => row.ok), results };
}

/**
 * The install plan (AC1): one step per missing tool, in dependency order, and
 * a `fail` step (never an install) for an unresolvable prerequisite. A fully
 * provisioned machine plans zero install steps — that is the idempotency
 * contract. Every step's command is the documented route; nothing here
 * targets `.engram/` or `.serena/` or runs any `* init` subcommand (AC3).
 */
export function planSetup(state) {
  const steps = [];
  let ok = true;

  if (state.nodeMajor === null) {
    steps.push({ tool: "node", action: "fail", reason: "node is not on PATH — install Node.js first (see docs/workflow/SETUP.md); this script never installs node" });
    ok = false;
  } else if (state.requiredNodeMajor !== null && state.nodeMajor < state.requiredNodeMajor) {
    steps.push({ tool: "node", action: "fail", reason: `node v${state.nodeMajor} is behind the .node-version major (${state.requiredNodeMajor}) — upgrade node first` });
    ok = false;
  }

  if (!state.bun.present || (state.bunPinned !== null && state.bun.version !== state.bunPinned)) {
    steps.push({
      tool: "bun",
      action: "install",
      command: bunInstallCommand(state.bunPinned),
      kind: "shell",
      reason: state.bunPinned
        ? state.bun.present
          ? `bun ${state.bun.version} does not match .bun-version (${state.bunPinned}) — repairing at the pinned version`
          : `bun is not installed — installing the .bun-version pin (${state.bunPinned})`
        : "bun is not installed — running the official installer",
    });
  }

  if (!state.uv.present) {
    steps.push({ tool: "uv", action: "install", command: UV_INSTALL, kind: "shell", reason: "uv is not installed — running the official installer" });
  }
  if (!state.serena.present) {
    steps.push({ tool: "serena", action: "install", command: SERENA_INSTALL, kind: "shell", reason: `serena-agent is not installed — installing via uv (python ${SERENA_PYTHON})` });
  }

  if (!state.engram.present) {
    if (state.platform === "darwin" && state.brew.present) {
      steps.push({ tool: "engram", action: "install", command: BREW_ENGRAM_INSTALL, kind: "shell", reason: "engram is not installed — installing the Homebrew tap" });
    } else {
      steps.push({
        tool: "engram",
        action: "install",
        kind: "engram-tarball",
        command: `curl -fsSL ${ENGRAM_RELEASES}/latest/download/<asset> | tar -xz -C ~/.local/bin`,
        reason: "engram is not installed — downloading the GitHub release tarball into ~/.local/bin",
      });
    }
  }

  if (!state.pi.present && !state.gentleEngram.present) {
    steps.push({ tool: "gentle-engram", action: "fail", reason: "the pi CLI is not installed — install pi first (see docs/workflow/SETUP.md); this script never installs pi" });
    ok = false;
  } else if (!state.gentleEngram.present) {
    steps.push({ tool: "gentle-engram", action: "install", command: PI_ENGRAM_INSTALL, kind: "shell", reason: "npm:gentle-engram is not installed in the pi agent directory — installing via pi" });
  }

  // --- Config phase (S8, PE-012 owner decision "Solo estado local"): local
  // gitignored state is rebuilt; committed state is only ever a fail row. ---
  if (!state.cachePresent) {
    steps.push({ tool: "serena-cache", action: "fix", kind: "mkdir", target: ".serena/cache", reason: ".serena/cache is missing (local state a fresh worktree lacks) — creating it" });
  }
  if (!state.schemaDistPresent) {
    steps.push({ tool: "schema-dist", action: "fix", kind: "shell", command: "cd packages/agentic-workflow-schema && bun install --frozen-lockfile && bun run build", reason: "packages/agentic-workflow-schema/dist is missing (gitignored build output the root suites require) — installing and building" });
  }
  if (!state.piCrateModulesPresent) {
    steps.push({ tool: "pi-crate-modules", action: "fix", kind: "shell", command: "cd packages/pi-agentic-workflow && bun install --frozen-lockfile", reason: "packages/pi-agentic-workflow/node_modules is missing — installing with a frozen lockfile" });
  }
  if (!state.engramConfigValid) {
    steps.push({ tool: "engram-config", action: "fail", reason: "the committed .engram/config.json is missing, invalid, or has no project_name — fix it in a commit; this script never rewrites committed shared state" });
    ok = false;
  }
  if (state.projectYml && state.projectYml.present === false) {
    steps.push({ tool: "serena-project", action: "fail", reason: "the committed .serena/project.yml is missing or empty — restore it from git; this script never rewrites committed shared state" });
    ok = false;
  }

  return { ok, steps };
}

/**
 * The engram tarball route (D1): resolve the latest release tag, download the
 * platform asset, extract the binary into `~/.local/bin`. Injectable `fetch`
 * and `spawn` keep the suite offline.
 */
export function installEngramTarball({ platform, arch, home, fetch = globalThis.fetch, spawn = spawnSync, root = REPO_ROOT } = {}) {
  const binDir = path.join(home, ".local", "bin");
  const meta = spawn("curl", ["-fsSL", "https://api.github.com/repos/Gentleman-Programming/engram/releases/latest"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 60_000,
  });
  if (meta.error || meta.status !== 0) {
    return { ok: false, message: `could not resolve the latest engram release (${(meta.stderr || meta.error?.message || "curl failed").trim().split("\n")[0]})` };
  }
  const tagMatch = /"tag_name":\s*"v?([^"]+)"/u.exec(meta.stdout ?? "");
  if (!tagMatch) return { ok: false, message: "the GitHub release payload carried no tag_name" };
  const url = `https://github.com/Gentleman-Programming/engram/releases/download/v${tagMatch[1]}/${engramAssetName(tagMatch[1], platform, arch)}`;
  fs.mkdirSync(binDir, { recursive: true });
  const download = spawn("bash", ["-c", `curl -fsSL ${JSON.stringify(url)} | tar -xz -C ${JSON.stringify(binDir)} engram`], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 300_000,
  });
  if (download.error || download.status !== 0) {
    return { ok: false, message: `engram tarball install failed: ${(download.stderr || download.error?.message || "extract failed").trim().split("\n")[0]}` };
  }
  return { ok: true, message: `engram ${tagMatch[1]} extracted into ${binDir} (asset ${engramAssetName(tagMatch[1], platform, arch)})` };
}

function runShell(command, { root = REPO_ROOT } = {}) {
  const result = spawnSync("bash", ["-c", command], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 600_000 });
  return { ok: !result.error && result.status === 0, message: ((result.stderr || result.stdout || result.error?.message || "").trim().split("\n")[0]) || command };
}

/**
 * The progressive verify→fix→next pipeline (S8, AC10), as one injectable seam:
 * each pass plans from the current state, executes every fix **in order**
 * (a failed step stops the pipeline naming its tool — nothing after it runs),
 * and the caller's `verifyAfterPass` stands in for the next pass's re-probe.
 * Bounded by `maxPasses` (default 3): a run that never converges ends exit 1
 * with VERDICT: FAIL instead of looping forever.
 */
export function runProvision({ state, execute, verifyAfterPass, maxPasses = 3 }) {
  const output = [];
  for (let pass = 1; pass <= maxPasses; pass++) {
    const plan = planSetup(state);
    const fails = plan.steps.filter((step) => step.action === "fail");
    if (fails.length > 0) {
      for (const step of fails) output.push(`✗ ${step.tool}: ${step.reason}`);
      output.push("Nothing was changed. Resolve the unresolvable prerequisites above and re-run.");
      return { code: 1, output: output.join("\n") };
    }
    if (plan.steps.length === 0) {
      if (verifyAfterPass(pass)) {
        output.push("SETUP — everything is already provisioned; nothing to do (idempotent re-run).");
        return { code: 0, output: output.join("\n") };
      }
      continue; // nothing plannable but verification still red — count the pass and re-check
    }
    for (const step of plan.steps) {
      output.push(`→ ${step.tool}: ${step.reason}`);
      const outcome = execute(step);
      if (!outcome.ok) {
        output.push(`  ✗ ${step.tool}: ${outcome.message}`);
        output.push(`SETUP — stopped at ${step.tool}: each step must succeed before the next one runs; fix it and re-run (the run is idempotent).`);
        return { code: 1, output: output.join("\n") };
      }
      output.push(`  ✓ ${outcome.message}`);
    }
    if (verifyAfterPass(pass)) {
      output.push("SETUP — done. Verify with: node scripts/setup-env.mjs --check");
      return { code: 0, output: output.join("\n") };
    }
  }
  output.push("VERDICT: FAIL — the pipeline did not converge after " + maxPasses + " passes; run `node scripts/setup-env.mjs --check` for the remaining rows.");
  return { code: 1, output: output.join("\n") };
}

/** The fixed human report header/footer shared by both modes. */
function renderCheck(result) {
  const lines = ["SETUP-CHECK — authoring toolchain (issue #331)"];
  for (const row of result.results) lines.push(`${row.ok ? "ok  " : "MISS"} ${row.tool}: ${row.detail}`);
  lines.push(result.ok ? "VERDICT: PASS" : "VERDICT: FAIL — run `node scripts/setup-env.mjs` to provision, or install the missing tools (docs/workflow/SETUP.md)");
  return lines.join("\n");
}

function main(argv) {
  const check = argv.includes("--check");
  const unknown = argv.filter((arg) => arg !== "--check");
  if (unknown.length > 0) {
    process.stderr.write(`usage: node scripts/setup-env.mjs [--check]\nunknown argument: ${unknown[0]}\n`);
    return 2;
  }

  const guard = platformGuard(process.platform);
  if (!guard.ok) {
    process.stderr.write(`${guard.message}\n`);
    return 1;
  }

  const state = probeEnvironment();

  if (check) {
    const result = verify(state);
    process.stdout.write(renderCheck(result) + "\n");
    return result.ok ? 0 : 1;
  }

  // Progressive verify→fix→next (S8): every pass re-probes the machine, so a
  // pass that installs bun/uv finds them (and what they unlock) on the next
  // one. Bounded at 3 passes; a still-red run reports the remaining rows.
  const maxPasses = 3;
  for (let pass = 1; pass <= maxPasses; pass++) {
    const current = probeEnvironment();
    const plan = planSetup(current);
    if (!plan.ok) {
      process.stdout.write("SETUP — unresolvable prerequisites:\n");
      for (const step of plan.steps.filter((s) => s.action === "fail")) process.stdout.write(`  ✗ ${step.tool}: ${step.reason}\n`);
      process.stdout.write("Nothing was installed. Resolve the prerequisites above and re-run.\n");
      return 1;
    }
    if (plan.steps.length === 0) {
      const verdict = verify(current);
      if (verdict.ok) {
        process.stdout.write("SETUP — everything is already provisioned; nothing to do (idempotent re-run).\n");
        return 0;
      }
      continue;
    }
    process.stdout.write(`SETUP — pass ${pass}/${maxPasses}\n`);
    for (const step of plan.steps) {
      process.stdout.write(`→ ${step.tool}: ${step.reason}\n`);
      let outcome;
      if (step.kind === "mkdir") {
        try {
          fs.mkdirSync(path.join(REPO_ROOT, step.target), { recursive: true });
          outcome = { ok: true, message: `${step.target} created` };
        } catch (error) {
          outcome = { ok: false, message: error.message };
        }
      } else if (step.kind === "engram-tarball") {
        const arch = process.arch === "arm64" ? "arm64" : "x64";
        outcome = installEngramTarball({ platform: process.platform, arch, home: current.home });
      } else {
        outcome = runShell(step.command);
      }
      if (!outcome.ok) {
        process.stdout.write(`  ✗ ${step.tool}: ${outcome.message}\n`);
        process.stdout.write(`SETUP — stopped at ${step.tool}: each step must succeed before the next one runs; fix it and re-run (the run is idempotent).\n`);
        return 1;
      }
      process.stdout.write(`  ✓ ${outcome.message}\n`);
      if (step.tool === "bun" || step.tool === "uv") {
        // The installers only mutate the shell profile — this process must
        // prepend their bin dirs itself for the next pass's probes.
        process.env.PATH = augmentPath(current.home, process.env.PATH);
      }
    }
  }

  const verdict = verify(probeEnvironment());
  process.stdout.write(renderCheck(verdict) + "\n");
  if (verdict.ok) {
    process.stdout.write("SETUP — done.\n");
    return 0;
  }
  process.stdout.write("SETUP — the pipeline did not converge; resolve the rows above and re-run.\n");
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
