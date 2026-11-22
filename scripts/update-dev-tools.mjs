#!/usr/bin/env node
/**
 * update-dev-tools.mjs — the one-shot refresher for this repository's machine
 * toolchain: bun, uv, serena, the engram binary, the gentle-engram pi package
 * and ripgrep.
 *
 * Division of labor with `scripts/update-tools.mjs` (issue #331): that script
 * is the *deliberate* drift closer — it reports installed vs published through
 * pin-watch's registry readers for the two watched tools and upgrades them on
 * the operator's decision. This script is the *blanket* refresher: it upgrades
 * what is present through its install channel, with no registry round-trip;
 * it borrows #331's upgrade constants instead of restating them, so the two
 * surfaces cannot drift apart.
 *
 * The split with `setup-env.mjs` is strict: `setup-env` installs what is
 * missing and a second run plans zero installs — it never refreshes a present
 * tool. This updater is the reverse (only what is present): an absent tool is
 * an honest skip naming `setup-env` as the install owner, never an install.
 * The one exception is bun behind its `.bun-version` pin, which the updater
 * refuses to leave stale because the pin is a CI-read minimum — it runs the
 * official installer at the pinned build, the same surface `setup-env` uses;
 * a bun at or above the pin refreshes in place with `bun upgrade`. As in S11,
 * the updater never installs bun, node, pi or any package manager itself.
 *
 * Decision and execution are separated so the sibling suite can pin the plan
 * without touching the network: `updatePlan(state)` is a pure function whose
 * state shape is the `probeEnvironment` result (plus an `rg` probe), and the
 * driver below only spawns what the plan already named. All progress goes to
 * stderr (docs/workflow/FEEDBACK.md); stdout stays empty and the exit code is
 * the machine receipt — 0 every handled step succeeded, 1 a step failed
 * (execution stops at the first failure), 2 a refusal.
 *
 * ripgrep is the honest edge: it is a system binary with no single channel.
 * The updater refreshes engram through the Homebrew tap on a brew machine (a
 * tarball would fight the brew-managed binary) and the GitHub release tarball
 * otherwise; it refreshes ripgrep through Homebrew when brew is present (macOS,
 * or Linuxbrew) and skips it with that reason otherwise — guessing apt/cargo
 * shapes on the user's behalf would be the defect.
 *
 * Usage
 *   bun scripts/update-dev-tools.mjs           # plan and execute
 *   bun scripts/update-dev-tools.mjs --plan    # plan only, print, exit
 *
 * exit: 0 done; 1 a step failed; 2 a refusal (win32, or an unusable state).
 */

import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  BUN_INSTALL,
  installEngramTarball,
  probeEnvironment,
  versionAtLeast,
} from "../packages/agentic-workflow/src/setup-env/index.mjs";
import { GENTLE_ENGRAM_UPGRADE, SERENA_UPGRADE } from "./update-tools.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** The bun command that installs the exact `.bun-version` build (S2a). */
export function buildBunPinCommand(pinnedVersion) {
  return `${BUN_INSTALL} -s "bun-v${pinnedVersion}"`;
}

/**
 * The pure decision: given the probed state, what does the updater do per
 * tool? `action` is "upgrade" (an executable step) or "skip" (a documented
 * no-op); `command` is the shell string the driver runs, `kind` marks the
 * seam when the step is not a plain shell command.
 */
export function updatePlan(state) {
  if (state.platform === "win32") {
    return { refused: "win32 is documented WSL-only (docs/workflow/SETUP.md); run this inside WSL", steps: [] };
  }

  const skip = (tool, reason) => ({ tool, action: "skip", kind: "shell", command: null, reason });
  const upgrade = (tool, { command, kind = "shell", reason }) => ({ tool, action: "upgrade", kind, command, reason });
  const steps = [];

  // bun first: the runtime every later step may invoke.
  if (!state.bun.present) {
    steps.push(skip("bun", "bun is absent and the updater never installs a runtime (S11) — opt in with scripts/setup-env.mjs"));
  } else if (state.bunPinned && !versionAtLeast(state.bun.version, state.bunPinned)) {
    steps.push(upgrade("bun", { command: buildBunPinCommand(state.bunPinned), reason: `bun ${state.bun.version} is behind the .bun-version pin ${state.bunPinned} — installing the pinned build` }));
  } else {
    steps.push(upgrade("bun", { command: "bun upgrade", reason: `bun ${state.bun.version} satisfies the pin — refreshing in place` }));
  }

  if (!state.uv.present) {
    steps.push(skip("uv", "uv is absent — scripts/setup-env.mjs owns installs"));
  } else {
    steps.push(upgrade("uv", { command: "uv self update", reason: `uv ${state.uv.version} — self update` }));
  }

  if (!state.serena.present) {
    steps.push(skip("serena", "serena is absent — scripts/setup-env.mjs owns installs"));
  } else if (!state.uv.present) {
    steps.push(skip("serena", `serena ${state.serena.version} has no uv to upgrade through — refresh it through the channel that installed it`));
  } else {
    steps.push(upgrade("serena", { command: SERENA_UPGRADE, reason: `serena ${state.serena.version} — ${SERENA_UPGRADE}` }));
  }

  if (!state.engram.present) {
    steps.push(skip("engram", "the engram binary is absent — scripts/setup-env.mjs owns installs"));
  } else if (state.brew?.present) {
    // The tarball seam would overwrite a brew-managed binary; the tap route
    // (docs/workflow/SETUP.md) is the update channel on a brew machine.
    steps.push(upgrade("engram", { command: "brew upgrade gentleman-programming/tap/engram", reason: `engram ${state.engram.version} — refreshing through the brew tap` }));
  } else {
    steps.push(upgrade("engram", { kind: "engram-tarball", reason: `engram ${state.engram.version} — refreshing from the latest GitHub release tarball` }));
  }

  if (!state.gentleEngram.present) {
    steps.push(skip("gentle-engram", "the gentle-engram pi package is absent — scripts/setup-env.mjs owns installs"));
  } else if (!state.pi.present) {
    steps.push(skip("gentle-engram", `gentle-engram ${state.gentleEngram.version} has no pi CLI to install through — the updater never installs pi (S11)`));
  } else {
    steps.push(upgrade("gentle-engram", { command: GENTLE_ENGRAM_UPGRADE, reason: `gentle-engram ${state.gentleEngram.version} — reinstalling the latest pi package` }));
  }

  if (!state.rg?.present) {
    steps.push(skip("ripgrep", "rg is absent or not a managed binary — install it through your system package manager"));
  } else if (state.brew?.present) {
    steps.push(upgrade("ripgrep", { command: "brew upgrade ripgrep", reason: "rg — refreshing through the brew channel" }));
  } else {
    steps.push(skip("ripgrep", "rg is present but no brew channel exists — update it through your system package manager"));
  }

  return { refused: null, steps };
}

function runShell(command, { cwd = REPO, timeout = 600_000 } = {}) {
  const result = spawnSync("bash", ["-c", command], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout });
  return { ok: !result.error && result.status === 0, message: ((result.stderr || result.stdout || result.error?.message || "").trim().split("\n")[0]) || command };
}

async function main(argv = process.argv.slice(2), options = {}) {
  const planOnly = argv.includes("--plan");
  const cwd = options.root ?? REPO;

  const state = probeEnvironment({ root: cwd });
  state.brew = { present: state.brew?.present === true };
  const rgProbe = spawnSync("rg", ["--version"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 15_000 });
  state.rg = { present: !rgProbe.error && rgProbe.status === 0 };

  const plan = updatePlan(state);
  if (plan.refused) {
    process.stderr.write(`UPDATE REFUSED — ${plan.refused}\n`);
    return 2;
  }

  process.stderr.write("UPDATE-DEV-TOOLS — one-shot refresh of the machine toolchain (installs stay with setup-env)\n");
  for (const step of plan.steps) {
    if (step.action === "skip") {
      process.stderr.write(`  · ${step.tool}: ${step.reason}\n`);
      continue;
    }
    process.stderr.write(`→ ${step.tool}: ${step.reason}\n`);
    if (planOnly) continue;

    const outcome = step.kind === "engram-tarball"
      ? installEngramTarball({ platform: state.platform, arch: process.arch, home: state.home, root: cwd })
      : runShell(step.command, { cwd });
    if (!outcome.ok) {
      process.stderr.write(`  ✗ ${step.tool}: ${outcome.message}\nUPDATE — stopped at ${step.tool}: fix it and re-run (every executed step is idempotent).\n`);
      return 1;
    }
    process.stderr.write(`  ✓ ${step.tool}: ${outcome.message}\n`);
  }

  process.stderr.write(
    planOnly
      ? `UPDATE — plan only, nothing was executed (verify what is installed with: node scripts/setup-env.mjs --check)\n`
      : `UPDATE — done. Verify with: node scripts/setup-env.mjs --check\n`,
  );
  return 0;
}

// Run only as a program: the sibling suite imports the module's bindings, and
// an import must never dispatch this repository's command.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const code = main(process.argv.slice(2), { root: REPO });
  if (code && typeof code.then === "function") {
    code.then((value) => process.exit(value ?? process.exitCode ?? 0));
  } else {
    process.exit(code ?? process.exitCode ?? 0);
  }
}
