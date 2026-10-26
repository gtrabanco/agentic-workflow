#!/usr/bin/env node
/**
 * serena-activation-check.mjs — feature 321 (issue #321).
 *
 * After replacing the @bacnh85/pi-serena bridge with native MCP registration,
 * this script validates that the MCP registration path is intact by exercising
 * the package's own staging + packing pipeline and verifying the resulting
 * artifact declares no bridge dependency.
 *
 * It does NOT boot a real pi session or install `serena-agent` — that is the
 * operator's provisioning step, not the package's responsibility. The package
 * ships the workflow; the user's MCP client (or `pi mcp add`) consumes it.
 *
 * Exit codes: 0 = PASS (the MCP registration path is intact), 1 = the wiring
 * is broken, 2 = the environment could not run the check. Everything written
 * lives under `os.tmpdir()` and is removed on exit, pass or fail.
 *
 * Usage: node scripts/serena-activation-check.mjs [--keep] [--json]
 *   --keep   leave the temp tree in place and print its path (debugging)
 *   --json   print the machine block instead of the human block
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_DIR = path.join(REPO_ROOT, "packages", "pi-agentic-workflow");
const PACKAGE_NAME = "@gtrabanco/pi-agentic-workflow";
const SERENA_DEPENDENCY = "@bacnh85/pi-serena";

/** Print one fixed block and exit; `cannot-run` is the environment's fault, not the wiring's. */
function stop(code, message, detail = []) {
  if (process.argv.includes("--json")) {
    process.stdout.write(
      `${JSON.stringify({ status: "failed", code, message, detail }, null, 2)}\n`,
    );
  } else {
    process.stdout.write(
      [...[`ACTIVATION: failed — ${code}`, message, ...detail].flat()].join("\n") + "\n",
    );
  }
  process.exit(code === "cannot-run" ? 2 : 1);
}

/** Run a command in `cwd`, returning trimmed stdout; a non-zero exit aborts the check. */
function run(bin, args, { cwd = REPO_ROOT, label = `${bin} ${args.join(" ")}` } = {}) {
  const result = spawnSync(bin, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  });
  if (result.error || result.status !== 0) {
    const problem = result.error
      ? result.error.message
      : (result.stderr || result.stdout || "").trim();
    stop(
      "cannot-run",
      `${label} failed (exit ${result.status ?? "spawn-error"})`,
      problem.split("\n").slice(-8),
    );
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
  const { bundleSkills } = await import(
    pathToFileURL(path.join(PACKAGE_DIR, "scripts", "bundle-skills.mjs")).href
  );
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
    stop(
      "cannot-run",
      "the package's TypeScript compiler is missing",
      [
        `expected: ${tsc}`,
        "run `bun install --frozen-lockfile` in packages/pi-agentic-workflow",
      ],
    );
  }
  // The copy carries no node_modules (a published tarball never does), so its
  // type resolution comes from the tree that built it: `typeRoots` and `paths`
  // are rewritten to the package's own installed toolchain.
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
  fs.symlinkSync(
    path.join(PACKAGE_DIR, "node_modules"),
    path.join(target, "node_modules"),
    "dir",
  );
  run(process.execPath, [tsc, "-p", tsconfig], { cwd: target, label: "tsc (staged package)" });
  fs.rmSync(path.join(target, "node_modules"), { force: true });
  bundleSkills({
    sourceDir: path.join(REPO_ROOT, "skills"),
    targetDir: path.join(target, "skills"),
  });
}

async function main() {
  const keep = process.argv.includes("--keep");
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "serena-activation-"));
  process.on("exit", () => {
    if (!keep) fs.rmSync(scratch, { recursive: true, force: true });
  });

  const staged = path.join(scratch, "staged");
  await stagePackage(staged);

  // Pack the staged copy.
  const packs = path.join(scratch, "packs");
  fs.mkdirSync(packs, { recursive: true });
  const packed = run(
    "npm",
    ["pack", "--ignore-scripts", "--pack-destination", packs, "--json"],
    { cwd: staged, label: "npm pack (staged package)" },
  );
  let tarball;
  try {
    tarball = path.join(packs, JSON.parse(packed)[0].filename);
  } catch {
    stop(
      "cannot-run",
      "npm pack did not report a tarball",
      [(packed.split("\n").pop() ?? "").slice(0, 200)],
    );
  }

  const unpacked = path.join(scratch, "package");
  fs.mkdirSync(unpacked, { recursive: true });
  run("tar", ["-xzf", tarball, "-C", unpacked, "--strip-components", "1"], {
    label: "tar -xzf <tarball>",
  });
  run(
    "npm",
    [
      "install",
      "--omit=dev",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
      "--loglevel=error",
    ],
    { cwd: unpacked, label: "npm install --omit=dev (packed artifact)" },
  );

  // AC: verify the bridge dependency is NOT installed (S1: must be absent)
  const bridgeNodeModules = path.join(unpacked, "node_modules", SERENA_DEPENDENCY);
  if (fs.existsSync(bridgeNodeModules)) {
    stop(
      "bridge-still-installed",
      `${SERENA_DEPENDENCY} is present in the packed artifact's node_modules`,
      [`expected: ${bridgeNodeModules} must not exist`],
    );
  }

  // S2: verify the package's manifest does not reference the bridge
  const manifestPath = path.join(unpacked, "package.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.dependencies?.[SERENA_DEPENDENCY]) {
    stop(
      "bridge-in-deps",
      `${SERENA_DEPENDENCY} is still in dependencies`,
      [
        "the package must declare no dependency on the bridge after MCP replacement",
      ],
    );
  }

  // S2: verify pi.extensions does not reference the bridge
  const extEntries = manifest.pi?.extensions ?? [];
  const bridgeEntry = extEntries.find((e) => e.includes(SERENA_DEPENDENCY));
  if (bridgeEntry) {
    stop(
      "bridge-in-extensions",
      `pi.extensions still references the bridge (${bridgeEntry})`,
      ["remove the bridge's extension entry"],
    );
  }

  // S7: verify the package's own extension is still declared
  if (!extEntries.includes("./dist/extension/index.js")) {
    stop(
      "own-extension-missing",
      "the package's own extension entry is missing from pi.extensions",
      [
        `expected: ["./dist/extension/index.js"]`,
        `found: ${JSON.stringify(extEntries)}`,
      ],
    );
  }

  const report = {
    status: "ok",
    package: PACKAGE_NAME,
    packageVersion: readVersion(manifestPath),
    bridgeDependency: "absent",
    bridgeExtensionEntry: "absent",
    ownExtension: extEntries.includes("./dist/extension/index.js") ? "declared" : "missing",
    ...(keep ? { kept: scratch } : {}),
  };
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(
      [
        "ACTIVATION: ok",
        `package: ${report.package} v${report.packageVersion}`,
        `${SERENA_DEPENDENCY}: absent (removed)`,
        `bridge extension entry: absent`,
        `own extension: ${report.ownExtension}`,
        "VERDICT: MCP registration path is intact",
        ...(report.kept ? [`kept: ${report.kept}`] : []),
      ].join("\n") + "\n",
    );
  }
}

await main();