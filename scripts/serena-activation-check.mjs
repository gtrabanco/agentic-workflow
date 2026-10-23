#!/usr/bin/env node
/**
 * serena-activation-check.mjs — feature 67 P2 (AC1, obligation O2, issue #219).
 *
 * The declared wiring (`@bacnh85/pi-serena` in `dependencies` + its
 * `node_modules` extension entry in `pi.extensions`) is only a claim until pi
 * loads it: pi installs a package's dependencies but activates only the
 * package's own `pi.extensions` entries, so a pin whose entry is wrong — or a
 * dependency an install silently skipped — ships a no-op and every `serena_*`
 * tool simply would not exist.
 *
 * This runs the real thing, end to end, in a throwaway environment:
 *
 *   1. Copy the package into a scratch tree and stage its skill bundle there
 *      (`skills/` is gitignored pack-time build output; without it the packed
 *      extension cannot even load — the `scandir …/skills` ENOENT a consumer
 *      would see). The repository working tree is never written to.
 *   2. `npm pack` the staged copy and untar the artifact.
 *   3. `npm install --omit=dev` the artifact, exactly as a consumer's install
 *      resolves it: the dependency and its node_modules entry are what ship.
 *   4. `pi install <that dir>` against a temp `PI_CODING_AGENT_DIR`, so the
 *      operator's real settings are never touched, and `pi list` to prove the
 *      registration landed.
 *   5. Boot a real Pi session (SDK, in-memory history) against that agent dir
 *      and read what the extension runner registered.
 *
 * Exit codes: 0 = PASS (`ACTIVATION: ok`), 1 = the tools did not register,
 * 2 = the environment could not run the check (missing bun/npm/pi/tar, a failed
 * pack or install). Everything written lives under `os.tmpdir()` and is removed
 * on exit, pass or fail.
 *
 * Usage: node scripts/serena-activation-check.mjs [--keep] [--json]
 *   --keep   leave the temp tree in place and print its path (debugging)
 *   --json   print the machine block instead of the human block
 */

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_DIR = path.join(REPO_ROOT, "packages", "pi-agentic-workflow");
const PACKAGE_NAME = "@gtrabanco/pi-agentic-workflow";
const SERENA_DEPENDENCY = "@bacnh85/pi-serena";
const SERENA_TOOL_PREFIX = "serena_";
/** The activation promises Serena's tool set; a superset is fine, a subset is not. */
const REQUIRED_TOOLS = Object.freeze([
  "serena_status",
  "serena_list_tools",
  "serena_get_symbols_overview",
  "serena_find_symbol",
  "serena_find_referencing_symbols",
]);

/** Print one fixed block and exit; `cannot-run` is the environment's fault, not the wiring's. */
function stop(code, message, detail = []) {
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify({ status: "failed", code, message, detail }, null, 2)}\n`);
  } else {
    process.stdout.write(`${[`ACTIVATION: failed — ${code}`, message, ...detail].join("\n")}\n`);
  }
  process.exit(code === "cannot-run" ? 2 : 1);
}

/** Run a command in `cwd`, returning trimmed stdout; a non-zero exit aborts the check. */
function run(bin, args, { cwd = REPO_ROOT, label = `${bin} ${args.join(" ")}` } = {}) {
  const result = spawnSync(bin, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30_000 });
  if (result.error || result.status !== 0) {
    const problem = result.error ? result.error.message : (result.stderr || result.stdout || "").trim();
    stop("cannot-run", `${label} failed (exit ${result.status ?? "spawn-error"})`, problem.split("\n").slice(-8));
  }
  return (result.stdout ?? "").trim();
}

function readVersion(packageJson) {
  try {
    return String(JSON.parse(fs.readFileSync(packageJson, "utf8")).version ?? "unknown");
  } catch {
    return "unknown";
  }
}

/**
 * Copy the package into `target` with its pack-time skill bundle staged there.
 * The bundle is built by the package's own bundler so the check ships exactly
 * the skill set the published tarball carries.
 */
async function stagePackage(target) {
  const { bundleSkills } = await import(pathToFileURL(path.join(PACKAGE_DIR, "scripts", "bundle-skills.mjs")).href);
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(PACKAGE_DIR, target, {
    recursive: true,
    force: true,
    filter: (source) => {
      const rel = path.relative(PACKAGE_DIR, source);
      if (rel === "") return true;
      const top = rel.split(path.sep)[0];
      return top !== "node_modules" && top !== "skills" && top !== "dist";
    },
  });
  // `dist/` is gitignored build output; the artifact carries the compiled
  // extension the manifest names, so the copy needs one. `tsc` here runs from
  // the package's own installed toolchain (the copy has no node_modules and a
  // published tarball never ships one).
  const tsc = path.join(PACKAGE_DIR, "node_modules", "typescript", "bin", "tsc");
  if (!fs.existsSync(tsc)) {
    stop("cannot-run", "the package's TypeScript compiler is missing", [
      `expected: ${tsc}`,
      "run `bun install --frozen-lockfile` in packages/pi-agentic-workflow",
    ]);
  }
  // The copy carries no node_modules (a published tarball never does), so its
  // type resolution comes from the tree that built it: `typeRoots` and `paths`
  // are rewritten to the package's own installed toolchain. A `baseUrl` would
  // make npm rewrite host-provided bare specifiers into relative paths (which
  // pi's module mapping cannot resolve), so it is deliberately absent.
  const tsconfig = path.join(target, "tsconfig.json");
  const base = JSON.parse(fs.readFileSync(tsconfig, "utf8"));
  const installed = (dep) => path.join(PACKAGE_DIR, "node_modules", dep);
  fs.writeFileSync(
    tsconfig,
    `${JSON.stringify(
      {
        ...base,
        compilerOptions: {
          ...base.compilerOptions,
          typeRoots: [path.join(PACKAGE_DIR, "node_modules", "@types")],
          paths: {
            "@earendil-works/pi-coding-agent": [installed("@earendil-works/pi-coding-agent")],
            "@earendil-works/pi-tui": [installed("@earendil-works/pi-tui")],
          },
        },
      },
      null,
      2,
    )}\n`,
  );
  // The package's own installed `@types` supply `node:`/`process` typings; the
  // copy sees them through the rewritten tsconfig above.
  fs.symlinkSync(path.join(PACKAGE_DIR, "node_modules"), path.join(target, "node_modules"), "dir");
  run(process.execPath, [tsc, "-p", tsconfig], { cwd: target, label: "tsc (staged package)" });
  fs.rmSync(path.join(target, "node_modules"), { force: true });
  bundleSkills({ sourceDir: path.join(REPO_ROOT, "skills"), targetDir: path.join(target, "skills") });
}

/**
 * Registered tool names from a real Pi session booted against `agentDir`.
 * Runs in a child so the packed artifact's module resolution is its own, and
 * with an in-memory session manager so nothing reaches an operator's history.
 */
function registeredTools(cwd, agentDir) {
  const sdk = path.join(
    cwd,
    "node_modules",
    "@earendil-works",
    "pi-coding-agent",
    "dist",
    "index.js",
  );
  // The host-provided peer is not installed by `--omit=dev` (it is a peer by
  // design): fall back to the pi this machine runs, which is the host the
  // activation targets.
  const sdkUrl = fs.existsSync(sdk)
    ? pathToFileURL(sdk).href
    : pathToFileURL(createRequire(import.meta.url).resolve("@earendil-works/pi-coding-agent")).href;
  const program = `
    const { createAgentSession, SessionManager } = await import(${JSON.stringify(sdkUrl)});
    const { session } = await createAgentSession({ cwd: ${JSON.stringify(cwd)}, sessionManager: SessionManager.inMemory() });
    const registered = (session._extensionRunner?.getAllRegisteredTools?.() ?? []).map((tool) => tool.definition?.name ?? tool.definition);
    session.dispose();
    process.stdout.write(JSON.stringify(registered));
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", program], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
    env: { ...process.env, PI_CODING_AGENT_DIR: agentDir },
  });
  if (result.status !== 0) {
    stop("cannot-run", "booting a Pi session against the scratch agent dir failed", [
      ...(result.stderr || result.stdout || "").trim().split("\n").slice(-8),
    ]);
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    return stop("cannot-run", "the Pi session did not report its registered tools", [
      String(result.stdout).slice(0, 200),
    ]);
  }
}

async function main() {
  const keep = process.argv.includes("--keep");
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "serena-activation-"));
  process.on("exit", () => {
    if (!keep) fs.rmSync(scratch, { recursive: true, force: true });
  });

  const staged = path.join(scratch, "staged");
  await stagePackage(staged);

  // Pack the staged copy. Its `postpack` cleanup runs against the copy, so the
  // repository working tree is untouched. `--ignore-scripts` keeps the
  // lifecycle from re-staging into the scratch tree we control.
  const packs = path.join(scratch, "packs");
  fs.mkdirSync(packs, { recursive: true });
  const packed = run("npm", ["pack", "--ignore-scripts", "--pack-destination", packs, "--json"], {
    cwd: staged,
    label: "npm pack (staged package)",
  });
  let tarball;
  try {
    tarball = path.join(packs, JSON.parse(packed)[0].filename);
  } catch {
    stop("cannot-run", "npm pack did not report a tarball", [(packed.split("\n").pop() ?? "").slice(0, 200)]);
  }

  const unpacked = path.join(scratch, "package");
  fs.mkdirSync(unpacked, { recursive: true });
  run("tar", ["-xzf", tarball, "-C", unpacked, "--strip-components", "1"], { label: "tar -xzf <tarball>" });
  run("npm", ["install", "--omit=dev", "--no-audit", "--no-fund", "--ignore-scripts", "--loglevel=error"], {
    cwd: unpacked,
    label: "npm install --omit=dev (packed artifact)",
  });

  const installedEntry = path.join(unpacked, "node_modules", SERENA_DEPENDENCY, "extensions", "index.ts");
  if (!fs.existsSync(installedEntry)) {
    stop("dependency-not-installed", `${SERENA_DEPENDENCY} is missing from the packed artifact's node_modules`, [
      `expected: ${installedEntry}`,
      "the pin is declared, so an install that skips it means the shipped manifest is wrong",
    ]);
  }

  const agentDir = path.join(scratch, "agent");
  fs.mkdirSync(agentDir, { recursive: true });
  const piEnv = { ...process.env, PI_CODING_AGENT_DIR: agentDir };
  const install = spawnSync("pi", ["install", unpacked], {
    cwd: scratch,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
    env: piEnv,
  });
  if (install.status !== 0) {
    stop("cannot-run", `pi install ${unpacked} failed (exit ${install.status ?? "spawn-error"})`, [
      ...(install.stderr || install.stdout || "").trim().split("\n").slice(-6),
    ]);
  }
  const listed = spawnSync("pi", ["list"], {
    cwd: scratch,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
    env: piEnv,
  });
  if (listed.status !== 0 || !(listed.stdout ?? "").includes(unpacked)) {
    stop("not-registered", "pi did not record the packed artifact in the scratch agent dir", [
      ...(listed.stderr || listed.stdout || "").trim().split("\n").slice(-4),
    ]);
  }

  const tools = registeredTools(unpacked, agentDir);
  const missing = REQUIRED_TOOLS.filter((name) => !tools.includes(name));
  if (missing.length > 0) {
    stop("tools-not-registered", "pi loaded the package but the serena_* tools are absent", [
      `missing: ${missing.join(", ")}`,
      `registered: ${tools.length === 0 ? "(none)" : tools.join(", ")}`,
    ]);
  }

  const report = {
    status: "ok",
    package: PACKAGE_NAME,
    dependency: SERENA_DEPENDENCY,
    dependencyVersion: readVersion(path.join(unpacked, "node_modules", SERENA_DEPENDENCY, "package.json")),
    tools: tools.filter((name) => name.startsWith(SERENA_TOOL_PREFIX)).length,
    required: REQUIRED_TOOLS.length,
    ...(keep ? { kept: scratch } : {}),
  };
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(
      [
        "ACTIVATION: ok",
        `package: ${report.package}`,
        `dependency: ${report.dependency}@${report.dependencyVersion} (installed from the packed artifact)`,
        `serena_* tools registered: ${report.tools} (required ${report.required} present)`,
        ...(report.kept ? [`kept: ${report.kept}`] : []),
      ].join("\n") + "\n",
    );
  }
}

await main();
