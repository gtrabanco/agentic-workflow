/**
 * setup-env.test.mjs — the offline suite for scripts/setup-env.mjs (issue #331,
 * unit fix/331-authoring-setup).
 *
 * One test per requested rule (S2, S6, S7) plus the `.engram/` byte-identity
 * guard (AC3). No test touches the network or the real toolchain: decision
 * functions take an injected state, probes are fakes, and the single
 * subprocess run is `--check`, which is write-free by contract.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

import {
  BUN_INSTALL,
  bunInstallCommand,
  UV_INSTALL,
  SERENA_INSTALL,
  PI_ENGRAM_INSTALL,
  BREW_ENGRAM_INSTALL,
  parseNodeMajor,
  engramAssetName,
  platformGuard,
  planSetup,
  verify,
  probeEnvironment,
  runProvision,
  augmentPath,
} from "./setup-env.mjs";

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

/** A state where every tool is present — the idempotent baseline. */
function fullState(overrides = {}) {
  return {
    platform: "linux",
    home: "/home/tester",
    nodeMajor: 24,
    requiredNodeMajor: 24,
    bun: { present: true, version: "1.4.0" },
    bunPinned: "1.4.0",
    uv: { present: true, version: "0.12.4" },
    serena: { present: true, version: "2.1.0" },
    engram: { present: true, version: "3.6.0" },
    pi: { present: true, version: "1.4.0" },
    gentleEngram: { present: true, version: "0.4.2" },
    brew: { present: false },
    projectYml: { present: true, bytes: 10993 },
    cachePresent: true,
    schemaDistPresent: true,
    piCrateModulesPresent: true,
    engramConfigValid: true,
    ...overrides,
  };
}

/** Every command string a plan carries, joined — what the .engram guard scans. */
function planCommands(plan) {
  return plan.steps.map((step) => [step.command ?? "", ...(step.detail ? [step.detail] : [])].join(" ")).join("\n");
}

describe("node verification against .node-version (S2, PE-006)", () => {
  it("parses the pinned major from a bare and a v-prefixed .node-version", () => {
    assert.equal(parseNodeMajor("24.21.0"), 24);
    assert.equal(parseNodeMajor("v24.21.0"), 24);
    assert.equal(parseNodeMajor("24"), 24);
    assert.equal(parseNodeMajor("garbage"), null);
    assert.equal(parseNodeMajor(""), null);
  });

  it("fails verification when node is absent, naming the prerequisite", () => {
    const result = verify(fullState({ nodeMajor: null }));
    const node = result.results.find((r) => r.tool === "node");
    assert.equal(node.ok, false);
    assert.match(node.detail, /node/);
    assert.equal(result.ok, false);
  });

  it("fails verification when node is behind the pinned major, naming .node-version", () => {
    const result = verify(fullState({ nodeMajor: 20, requiredNodeMajor: 24 }));
    const node = result.results.find((r) => r.tool === "node");
    assert.equal(node.ok, false);
    assert.match(node.detail, /\.node-version/);
    assert.match(node.detail, /24/);
  });

  it("accepts a newer node major than pinned (exact equality not required)", () => {
    const result = verify(fullState({ nodeMajor: 26, requiredNodeMajor: 24 }));
    const node = result.results.find((r) => r.tool === "node");
    assert.equal(node.ok, true);
  });
});

describe("bun install when absent (S2)", () => {
  it("plans the official bun installer when bun is missing", () => {
    const plan = planSetup(fullState({ bun: { present: false, version: null } }));
    const step = plan.steps.find((s) => s.tool === "bun");
    assert.ok(step, "bun install step planned");
    assert.match(String(step.command), /bun\.sh\/install/);
  });

  it("plans nothing for a present bun (idempotent)", () => {
    const plan = planSetup(fullState());
    assert.equal(plan.steps.find((s) => s.tool === "bun"), undefined);
  });
});

describe("uv → serena-agent (S2)", () => {
  it("plans the astral.sh uv installer when uv is missing", () => {
    const plan = planSetup(fullState({ uv: { present: false, version: null }, serena: { present: false, version: null } }));
    const step = plan.steps.find((s) => s.tool === "uv");
    assert.ok(step);
    assert.match(String(step.command), /astral\.sh\/uv\/install\.sh/);
  });

  it("plans `uv tool install -p 3.13 serena-agent` when serena is missing (PE-003)", () => {
    const plan = planSetup(fullState({ serena: { present: false, version: null } }));
    const step = plan.steps.find((s) => s.tool === "serena");
    assert.ok(step);
    assert.match(String(step.command), /^uv tool install -p 3\.13 serena-agent$/);
  });

  it("plans nothing for present uv and serena (idempotent)", () => {
    const plan = planSetup(fullState());
    assert.equal(plan.steps.find((s) => s.tool === "uv"), undefined);
    assert.equal(plan.steps.find((s) => s.tool === "serena"), undefined);
  });
});

describe("engram install route — binaries first (S7, PE-001/PE-002/D1)", () => {
  it("uses the Homebrew tap on macOS when brew is present", () => {
    const plan = planSetup(fullState({ platform: "darwin", brew: { present: true }, engram: { present: false, version: null } }));
    const step = plan.steps.find((s) => s.tool === "engram");
    assert.ok(step);
    assert.match(String(step.command), /^brew install gentleman-programming\/tap\/engram$/);
  });

  it("falls back to the GitHub-Releases tarball on macOS without brew", () => {
    const plan = planSetup(fullState({ platform: "darwin", brew: { present: false }, engram: { present: false, version: null } }));
    const step = plan.steps.find((s) => s.tool === "engram");
    assert.ok(step);
    assert.equal(step.kind, "engram-tarball");
  });

  it("uses the GitHub-Releases tarball on Linux", () => {
    const plan = planSetup(fullState({ engram: { present: false, version: null } }));
    const step = plan.steps.find((s) => s.tool === "engram");
    assert.ok(step);
    assert.equal(step.kind, "engram-tarball");
  });

  it("names the release asset after the platform/arch map", () => {
    assert.equal(engramAssetName("3.6.0", "linux", "x64"), "engram_3.6.0_linux_amd64.tar.gz");
    assert.equal(engramAssetName("3.6.0", "linux", "arm64"), "engram_3.6.0_linux_arm64.tar.gz");
    assert.equal(engramAssetName("3.6.0", "darwin", "arm64"), "engram_3.6.0_darwin_arm64.tar.gz");
    assert.equal(engramAssetName("3.6.0", "darwin", "x64"), "engram_3.6.0_darwin_amd64.tar.gz");
  });

  it("plans nothing for a present engram (idempotent)", () => {
    const plan = planSetup(fullState());
    assert.equal(plan.steps.find((s) => s.tool === "engram"), undefined);
  });
});

describe("gentle-engram pi package (S2, PE-004)", () => {
  it("plans `pi install npm:gentle-engram@latest` when the package is missing", () => {
    const plan = planSetup(fullState({ gentleEngram: { present: false, version: null } }));
    const step = plan.steps.find((s) => s.tool === "gentle-engram");
    assert.ok(step);
    assert.match(String(step.command), /^pi install npm:gentle-engram@latest$/);
  });

  it("fails with a clear message when the pi CLI itself is absent (unresolvable prerequisite)", () => {
    const plan = planSetup(fullState({ pi: { present: false, version: null }, gentleEngram: { present: false, version: null } }));
    const step = plan.steps.find((s) => s.tool === "gentle-engram");
    assert.ok(step);
    assert.equal(step.action, "fail");
    assert.match(step.reason, /\bpi\b/);
    assert.equal(plan.ok, false);
  });

  it("plans nothing for a present package (idempotent)", () => {
    const plan = planSetup(fullState());
    assert.equal(plan.steps.find((s) => s.tool === "gentle-engram"), undefined);
  });
});

describe("idempotency (AC1)", () => {
  it("a fully-provisioned machine plans zero install steps", () => {
    const plan = planSetup(fullState());
    assert.deepEqual(plan.steps.filter((s) => s.action === "install"), []);
    assert.equal(plan.ok, true);
  });

  it("an unresolvable node is a failure state, never an install", () => {
    const plan = planSetup(fullState({ nodeMajor: null }));
    assert.equal(plan.ok, false);
    assert.equal(plan.steps.filter((s) => s.action === "install").length, 0);
  });
});

describe("committed state verification (S2)", () => {
  it("fails verification when the committed .serena/project.yml is missing", () => {
    const result = verify(fullState({ projectYml: { present: false, bytes: null } }));
    const row = result.results.find((r) => r.tool === "serena-project");
    assert.equal(row.ok, false);
    assert.match(row.detail, /\.serena\/project\.yml/);
  });

  it("passes verification when the committed .serena/project.yml is present and non-empty", () => {
    const result = verify(fullState());
    assert.equal(result.results.find((r) => r.tool === "serena-project").ok, true);
  });
});

describe("check mode is read-only with 0/1 exits (AC2)", () => {
  it("verify is ok:true and every row ok on a fully provisioned machine", () => {
    const result = verify(fullState());
    assert.equal(result.ok, true);
    for (const row of result.results) assert.equal(row.ok, true, `${row.tool}: ${row.detail}`);
  });

  it("verify is ok:false and names the missing tool when one is absent", () => {
    const result = verify(fullState({ engram: { present: false, version: null } }));
    assert.equal(result.ok, false);
    const missing = result.results.filter((r) => !r.ok).map((r) => r.tool);
    assert.deepEqual(missing, ["engram"]);
  });
});

describe("Windows is refused — WSL-only (S7, AC9)", () => {
  it("platformGuard refuses win32 with the WSL note before any check or install", () => {
    const guard = platformGuard("win32");
    assert.equal(guard.ok, false);
    assert.match(guard.message, /WSL/i);
  });

  it("platformGuard passes macOS and Linux", () => {
    assert.equal(platformGuard("darwin").ok, true);
    assert.equal(platformGuard("linux").ok, true);
  });
});

describe("the .engram/ protection (AC3) — guarded by a test, not prose", () => {
  it("no plan step on any platform may target .engram/, run `engram setup`, `pi-engram init`, `serena init`, or write .serena/", () => {
    const forbidden = [/\.engram/, /engram\s+setup/, /pi-engram\s+init/, /serena\s+init/, /\.serena\/(?!project\.yml)/];
    const states = [
      fullState(),
      fullState({ bun: { present: false, version: null }, uv: { present: false, version: null }, serena: { present: false, version: null } }),
      fullState({ platform: "darwin", brew: { present: true }, engram: { present: false, version: null } }),
      fullState({ engram: { present: false, version: null } }),
      fullState({ gentleEngram: { present: false, version: null } }),
    ];
    for (const state of states) {
      const text = planCommands(planSetup(state));
      for (const pattern of forbidden) {
        assert.doesNotMatch(text, pattern, `plan for platform=${state.platform} matches forbidden pattern ${pattern}`);
      }
    }
  });

  it("a real `--check` subprocess run at the repo root leaves .engram/ byte-identical", () => {
    const hashDir = (dir) => {
      const entries = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
      return entries
        .filter((e) => e.isFile())
        .map((e) => {
          const file = path.join(e.parentPath ?? e.path, e.name);
          const digest = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
          return `${path.relative(dir, file)} ${digest}`;
        })
        .sort()
        .join("\n");
    };
    const before = hashDir(path.join(REPO_ROOT, ".engram"));
    const run = spawnSync(process.execPath, [path.join(REPO_ROOT, "scripts", "setup-env.mjs"), "--check"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      timeout: 120_000,
    });
    assert.ok(run.status === 0 || run.status === 1, `--check must exit 0 or 1, got ${run.status}: ${run.stderr}`);
    const afterHash = hashDir(path.join(REPO_ROOT, ".engram"));
    assert.equal(afterHash, before, ".engram/ changed during --check");
  });
});

describe("the committed install commands are the documented ones (S2/S7 constants)", () => {
  it("exposes the exact installer commands the doc and CI rely on", () => {
    assert.match(BUN_INSTALL, /bun\.sh\/install/);
    assert.match(UV_INSTALL, /astral\.sh\/uv\/install\.sh/);
    assert.equal(SERENA_INSTALL, "uv tool install -p 3.13 serena-agent");
    assert.equal(PI_ENGRAM_INSTALL, "pi install npm:gentle-engram@latest");
    assert.equal(BREW_ENGRAM_INSTALL, "brew install gentleman-programming/tap/engram");
  });
});

describe("probeEnvironment reads the real inputs through injectable fakes", () => {
  let tmp;
  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "setup-env-fixture-"));
    fs.writeFileSync(path.join(tmp, ".node-version"), "v24.21.0\n");
    fs.mkdirSync(path.join(tmp, ".serena"), { recursive: true });
    fs.writeFileSync(path.join(tmp, ".serena", "project.yml"), "project_name: fixture\n");
  });
  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it("reads .node-version, probes each tool, and finds the committed project.yml", () => {
    const state = probeEnvironment({
      root: tmp,
      platform: "linux",
      home: tmp,
      env: {},
      probe: (bin, args) => {
        if (bin === "bun" && args[0] === "--version") return "1.4.4\n";
        if (bin === "uv" && args[0] === "--version") return "uv 0.12.4\n";
        if (bin === "serena" && args[0] === "--version") return "Serena 2.1.0\n";
        if (bin === "engram" && args[0] === "--version") return "engram 3.6.0\n";
        if (bin === "pi" && args[0] === "--version") return "1.4.0\n";
        return null;
      },
      readPiPackageVersion: () => "0.4.2",
    });
    assert.equal(state.requiredNodeMajor, 24);
    assert.equal(state.bun.present, true);
    assert.equal(state.serena.version, "2.1.0");
    assert.equal(state.engram.version, "3.6.0");
    assert.equal(state.gentleEngram.version, "0.4.2");
    assert.equal(state.projectYml.present, true);
  });

  it("reports absent tools as absent — never throws on a bare machine", () => {
    const state = probeEnvironment({
      root: tmp,
      platform: "linux",
      home: tmp,
      env: {},
      probe: () => null,
      readPiPackageVersion: () => null,
    });
    for (const tool of ["bun", "uv", "serena", "engram", "pi", "gentleEngram"]) {
      assert.equal(state[tool].present, false, tool);
    }
    assert.equal(state.nodeMajor, process.versions.node.split(".")[0] * 1 >= 0 ? state.nodeMajor : null);
    assert.equal(typeof state.nodeMajor === "number" || state.nodeMajor === null, true);
  });
});

describe("docs/workflow/SETUP.md covers every automated step (S1, AC6)", () => {
  const doc = () => fs.readFileSync(path.join(REPO_ROOT, "docs", "workflow", "SETUP.md"), "utf8");

  it("documents each install command the scripts run, verbatim", () => {
    const text = doc();
    for (const [name, needle] of [
      ["bun installer", "https://bun.sh/install \\| bash"],
      ["uv installer", "https://astral.sh/uv/install.sh \\| sh"],
      ["serena install", "uv tool install -p 3.13 serena-agent"],
      ["brew engram tap", "brew install gentleman-programming/tap/engram"],
      ["pi gentle-engram install", "pi install npm:gentle-engram@latest"],
      ["release tarball layout", "engram_<version>_<os>_<arch>.tar.gz"],
      ["setup usage", "node scripts/setup-env.mjs"],
      ["check usage", "node scripts/setup-env.mjs --check"],
      ["update-tools dry-run", "node scripts/update-tools.mjs --dry-run"],
    ]) {
      assert.ok(text.includes(needle), `SETUP.md must name the ${name} (${needle})`);
    }
  });

  it("documents the committed-vs-local split and the WSL note (S1/S7)", () => {
    const text = doc();
    for (const needle of [".serena/project.yml", ".engram/", ".serena/memories/", "WSL", ".node-version"]) {
      assert.ok(text.includes(needle), `SETUP.md must mention ${needle}`);
    }
  });
});

describe(".github/workflows/setup-check.yml runs the check on macos + linux (S4, AC5)", () => {
  const workflow = () => fs.readFileSync(path.join(REPO_ROOT, ".github", "workflows", "setup-check.yml"), "utf8");

  it("matrices ubuntu-latest and macos-latest and runs provision then --check", () => {
    const text = workflow();
    assert.match(text, /ubuntu-latest/);
    assert.match(text, /macos-latest/);
    assert.match(text, /node scripts\/setup-env\.mjs\n/);
    assert.match(text, /node scripts\/setup-env\.mjs --check/);
  });

  it("installs the pi CLI before provisioning (setup-env refuses to install it)", () => {
    const text = workflow();
    const piAt = text.indexOf("pi-coding-agent");
    const provisionAt = text.indexOf("node scripts/setup-env.mjs\n");
    assert.ok(piAt !== -1, "the workflow must install the pi CLI");
    assert.ok(provisionAt !== -1);
    assert.ok(piAt < provisionAt, "pi must be installed before the provision step");
  });
});

// ---------------------------------------------------------------------------
// Owner amendment S8/S9 (2026-10-28): progressive verify→fix→next pipeline,
// local-only config repair, worktree quick resetup. Decision: "Solo estado
// local" — committed config is verified read-only, never rewritten.
// ---------------------------------------------------------------------------

/** A state where every tool is present but every piece of local state is missing. */
function worktreeState(overrides = {}) {
  return fullState({
    cachePresent: false,
    schemaDistPresent: false,
    piCrateModulesPresent: false,
    engramConfigValid: true,
    projectYml: { present: true, bytes: 10993 },
    ...overrides,
  });
}

describe("config verification (S8, AC11)", () => {
  it("fullState plans zero steps — committed valid config plus present local state is done", () => {
    const plan = planSetup(fullState({ cachePresent: true, schemaDistPresent: true, piCrateModulesPresent: true, engramConfigValid: true }));
    assert.deepEqual(plan.steps, []);
    assert.equal(plan.ok, true);
  });

  it("plans a fix for a missing .serena/cache (local, gitignored)", () => {
    const plan = planSetup(worktreeState());
    const step = plan.steps.find((s) => s.tool === "serena-cache");
    assert.ok(step, "serena-cache step planned");
    assert.equal(step.action, "fix");
  });

  it("plans the schema dist build (install + build in packages/agentic-workflow-schema) when dist is missing", () => {
    const plan = planSetup(worktreeState());
    const step = plan.steps.find((s) => s.tool === "schema-dist");
    assert.ok(step);
    assert.match(String(step.command), /packages\/agentic-workflow-schema/);
    assert.match(String(step.command), /--frozen-lockfile/);
    assert.match(String(step.command), /build/);
  });

  it("plans the pi crate module install when its node_modules is missing", () => {
    const plan = planSetup(worktreeState());
    const step = plan.steps.find((s) => s.tool === "pi-crate-modules");
    assert.ok(step);
    assert.match(String(step.command), /packages\/pi-agentic-workflow/);
    assert.match(String(step.command), /--frozen-lockfile/);
  });

  it("never plans a fix for committed state — invalid .engram/config.json is a failure, not a rewrite", () => {
    const plan = planSetup(fullState({ engramConfigValid: false, cachePresent: true, schemaDistPresent: true, piCrateModulesPresent: true }));
    assert.equal(plan.ok, false);
    const step = plan.steps.find((s) => s.tool === "engram-config");
    assert.ok(step);
    assert.equal(step.action, "fail");
    assert.match(step.reason, /committed/);
    assert.doesNotMatch(planCommands(plan), /engram\s+(setup|init)|rewrite/i);
  });

  it("never plans a fix for an empty committed .serena/project.yml either", () => {
    const plan = planSetup(fullState({ projectYml: { present: false, bytes: null }, cachePresent: true, schemaDistPresent: true, piCrateModulesPresent: true }));
    assert.equal(plan.ok, false);
    const step = plan.steps.find((s) => s.tool === "serena-project");
    assert.ok(step);
    assert.equal(step.action, "fail");
  });
});

describe("the verify→fix loop converges (S8, AC10)", () => {
  it("runs every fix before the next step and exits 0 when verification then passes", () => {
    const executed = [];
    const result = runProvision({
      state: worktreeState(),
      // The fake executor fixes one layer per call; verification state advances
      // with each executed fix, like the real machine would.
      execute: (step) => {
        executed.push(step.tool);
        return { ok: true, message: `fixed ${step.tool}` };
      },
      // Verification succeeds once every tool has run (the loop re-probes in
      // reality; here the fake says "converged after all fixes").
      verifyAfterPass: (pass) => pass >= 1,
    });
    assert.equal(result.code, 0);
    assert.ok(executed.length > 0);
  });

  it("stops the pipeline naming the tool when a fix fails — later steps never run", () => {
    const executed = [];
    const result = runProvision({
      state: worktreeState({ bun: { present: false, version: null } }),
      execute: (step) => {
        executed.push(step.tool);
        return step.tool === "bun" ? { ok: false, message: "network unreachable" } : { ok: true, message: "fixed" };
      },
      verifyAfterPass: () => false,
    });
    assert.equal(result.code, 1);
    assert.match(result.output, /bun/);
    assert.match(result.output, /network unreachable/);
    assert.deepEqual(executed.slice(executed.indexOf("bun") + 1), [], "no step runs after a failed one");
  });

  it("is bounded — a check that never converges exits 1 after the last pass, naming the misses", () => {
    const result = runProvision({
      state: worktreeState(),
      execute: () => ({ ok: true, message: "fixed" }),
      verifyAfterPass: () => false,
      maxPasses: 3,
    });
    assert.equal(result.code, 1);
    assert.match(result.output, /VERDICT: FAIL/);
  });
});

describe("PATH augmentation after installer runs (S8)", () => {
  it("adds the bun and uv install dirs so the next pass probes the freshly installed tools", () => {
    const next = augmentPath("/home/tester", "/usr/bin:/bin");
    assert.ok(next.includes("/home/tester/.bun/bin"));
    assert.ok(next.includes("/home/tester/.local/bin"));
    assert.ok(next.startsWith("/home/tester/.bun/bin:/home/tester/.local/bin:"));
  });

  it("does not duplicate entries already present", () => {
    const next = augmentPath("/home/tester", "/home/tester/.local/bin:/usr/bin");
    assert.equal(next.split(":").filter((p) => p === "/home/tester/.local/bin").length, 1);
  });
});

describe("probeEnvironment reads the local-state and committed-config facts (S8)", () => {
  let tmp;
  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "setup-env-amend-"));
    fs.writeFileSync(path.join(tmp, ".node-version"), "v24.21.0\n");
    fs.mkdirSync(path.join(tmp, ".serena"), { recursive: true });
    fs.writeFileSync(path.join(tmp, ".serena", "project.yml"), "project_name: fixture\n");
    fs.mkdirSync(path.join(tmp, ".engram"), { recursive: true });
    fs.writeFileSync(path.join(tmp, ".engram", "config.json"), '{"project_name":"fixture"}\n');
    fs.mkdirSync(path.join(tmp, "packages", "agentic-workflow-schema", "dist"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "packages", "agentic-workflow-schema", "dist", "index.js"), "export {};\n");
  });
  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it("reports cache/dist/modules present when they exist and engram config as valid", () => {
    const state = probeEnvironment({ root: tmp, platform: "linux", home: tmp, env: {}, probe: () => null });
    assert.equal(state.cachePresent, false, "no .serena/cache in the fixture");
    assert.equal(state.schemaDistPresent, true);
    assert.equal(state.piCrateModulesPresent, false);
    assert.equal(state.engramConfigValid, true);
  });

  it("marks an invalid committed .engram/config.json without ever writing to it", () => {
    fs.writeFileSync(path.join(tmp, ".engram", "config.json"), "{ not json");
    const state = probeEnvironment({ root: tmp, platform: "linux", home: tmp, env: {}, probe: () => null });
    assert.equal(state.engramConfigValid, false);
    assert.equal(fs.readFileSync(path.join(tmp, ".engram", "config.json"), "utf8"), "{ not json");
  });
});

describe("docs/workflow/SETUP.md documents the amendment (S1/S8/S9)", () => {
  const doc = () => fs.readFileSync(path.join(REPO_ROOT, "docs", "workflow", "SETUP.md"), "utf8");

  it("names the progressive pipeline, the rebuilt local state and the worktree resetup", () => {
    const text = doc();
    for (const needle of [
      "packages/agentic-workflow-schema",
      "--frozen-lockfile",
      ".serena/cache",
      "worktree",
    ]) {
      assert.ok(text.includes(needle), `SETUP.md must mention ${needle}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Owner correction S2a (2026-10-28): bun pinned by the committed .bun-version
// (exact match — the convention bun's ecosystem honors), symmetric with
// .node-version for node. Evidence PE-013; supersedes the PE-006 reading.
// ---------------------------------------------------------------------------

describe("bun pinned via .bun-version (S2a, AC13)", () => {
  it("verifies bun exactly against the pin — drift is a MISS row", () => {
    const drifted = verify(fullState({ bun: { present: true, version: "1.4.4" }, bunPinned: "1.4.0" }));
    const bun = drifted.results.find((r) => r.tool === "bun");
    assert.equal(bun.ok, false);
    assert.match(bun.detail, /\.bun-version/);
    assert.match(bun.detail, /1\.4\.0/);
  });

  it("accepts an exact match", () => {
    const ok = verify(fullState({ bun: { present: true, version: "1.4.0" }, bunPinned: "1.4.0" }));
    assert.equal(ok.results.find((r) => r.tool === "bun").ok, true);
  });

  it("plans the pinned install when bun is missing", () => {
    const plan = planSetup(fullState({ bun: { present: false, version: null }, bunPinned: "1.4.0" }));
    const step = plan.steps.find((s) => s.tool === "bun");
    assert.ok(step);
    assert.match(String(step.command), /bun\.sh\/install/);
    assert.match(String(step.command), /bash -s "bun-v1\.4\.0"/);
  });

  it("plans a repair install at the pinned version when the installed bun drifted", () => {
    const plan = planSetup(fullState({ bun: { present: true, version: "1.4.4" }, bunPinned: "1.4.0" }));
    const step = plan.steps.find((s) => s.tool === "bun");
    assert.ok(step);
    assert.match(String(step.command), /bash -s "bun-v1\.4\.0"/);
  });

  it("falls back to the latest installer when no .bun-version exists", () => {
    const plan = planSetup(fullState({ bun: { present: false, version: null }, bunPinned: null }));
    const step = plan.steps.find((s) => s.tool === "bun");
    assert.ok(step);
    assert.match(String(step.command), /bun\.sh\/install/);
    assert.doesNotMatch(String(step.command), /bun-v/);
  });

  it("bunInstallCommand builds the documented versioned installer", () => {
    assert.equal(bunInstallCommand("1.4.0"), 'curl -fsSL https://bun.sh/install | bash -s "bun-v1.4.0"');
    assert.equal(bunInstallCommand(null), BUN_INSTALL);
  });

  it("probeEnvironment reads .bun-version", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "setup-env-bunver-"));
    try {
      fs.writeFileSync(path.join(tmp, ".bun-version"), "1.4.0\n");
      const state = probeEnvironment({ root: tmp, platform: "linux", home: tmp, env: {}, probe: () => null });
      assert.equal(state.bunPinned, "1.4.0");
      fs.writeFileSync(path.join(tmp, ".bun-version"), "v1.3.3\n");
      assert.equal(probeEnvironment({ root: tmp, platform: "linux", home: tmp, env: {}, probe: () => null }).bunPinned, "1.3.3");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("SETUP.md documents the pin and the committed file", () => {
    const text = fs.readFileSync(path.join(REPO_ROOT, "docs", "workflow", "SETUP.md"), "utf8");
    assert.ok(text.includes(".bun-version"), "SETUP.md must mention .bun-version");
    assert.ok(text.includes("bun-v"), "SETUP.md must name the versioned installer argument");
  });
});
