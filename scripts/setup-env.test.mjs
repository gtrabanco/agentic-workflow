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
  engramAssetName,
  platformGuard,
  parseYesNo,
  bunOptInNote,
  planSetup,
  verify,
  probeEnvironment,
  runProvision,
  augmentPath,
  versionAtLeast,
} from "./setup-env.mjs";

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

/** A state where every tool is present — the idempotent baseline. */
function fullState(overrides = {}) {
  return {
    platform: "linux",
    home: "/home/tester",
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
    serenaLocalOverridePresent: true,
    ...overrides,
  };
}

/** Every command string a plan carries, joined — what the .engram guard scans. */
function planCommands(plan) {
  return plan.steps.map((step) => [step.command ?? "", ...(step.detail ? [step.detail] : [])].join(" ")).join("\n");
}

/** The only plan tools allowed to name a path under .serena/ — both local, both gitignored. */
const LOCAL_SERENA_WRITES = new Set(["serena-cache", "serena-local-override"]);

describe("node and bun are the user's prerequisites — never managed (S11)", () => {
  it("node is never a verify row and never a plan step on any state", () => {
    for (const state of [fullState(), fullState({ engram: { present: false, version: null } }), worktreeState()]) {
      assert.equal(verify(state).results.find((r) => r.tool === "node"), undefined);
      assert.equal(planSetup(state).steps.find((s) => s.tool === "node"), undefined);
    }
  });

  it("an absent node never fails the plan — the pi gate is the only unresolvable prerequisite left", () => {
    const plan = planSetup(fullState());
    assert.equal(plan.ok, true);
    assert.deepEqual(plan.steps.filter((s) => s.action === "fail"), []);
  });

  it("parseYesNo accepts only an explicit yes — empty or anything else declines", () => {
    for (const yes of ["y", "Y", "yes", "YES", " Yes "]) assert.equal(parseYesNo(yes), true);
    for (const no of ["", "n", "no", "nope", "yees", "1", null, undefined]) assert.equal(parseYesNo(no), false);
  });

  it("the skip note names bun as optional, node as the fallback and the pinned installer", () => {
    const note = bunOptInNote({ bunPinned: "1.4.0" });
    assert.match(note, /optional/);
    assert.match(note, /node is the runtime fallback/);
    assert.match(note, /bash -s "bun-v1\.4\.0"/);
  });
});

describe("bun is opt-in (S11, S2a/S2b)", () => {
  it("plans NO bun install when bun is missing and the user has not opted in", () => {
    const plan = planSetup(fullState({ bun: { present: false, version: null } }));
    assert.equal(plan.steps.find((s) => s.tool === "bun"), undefined);
    assert.equal(plan.ok, true, "a bun-less machine is not a failure");
  });

  it("plans the pinned install when bun is missing and the user opted in", () => {
    const plan = planSetup(fullState({ bun: { present: false, version: null }, bunPinned: "1.4.0" }), { bunOptIn: true });
    const step = plan.steps.find((s) => s.tool === "bun");
    assert.ok(step, "bun install step planned after the user's yes");
    assert.match(String(step.command), /bun\.sh\/install/);
    assert.match(String(step.command), /bash -s "bun-v1\.4\.0"/);
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

  it("maps every process.arch spelling onto the Go name the releases ship", () => {
    // The releases carry Go's arch names (PE-002); a `process.arch` value passed
    // straight through would build `..._x64.tar.gz`, an asset that does not exist.
    for (const arch of ["x64", "amd64"]) {
      assert.match(engramAssetName("3.6.0", "linux", arch), /_amd64\.tar\.gz$/);
    }
    assert.match(engramAssetName("3.6.0", "linux", "arm64"), /_arm64\.tar\.gz$/);
    assert.throws(() => engramAssetName("3.6.0", "linux", "ia32"), /architecture ia32/);
    assert.throws(() => engramAssetName("3.6.0", "freebsd", "x64"), /platform freebsd/);
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

  it("still fails when the package is present but the pi CLI is gone — it cannot be maintained, so `done` would be a green lie", () => {
    const plan = planSetup(fullState({ pi: { present: false, version: null }, gentleEngram: { present: true, version: "0.4.2" } }));
    const step = plan.steps.find((s) => s.tool === "gentle-engram");
    assert.ok(step, "the pi prerequisite is checked even with the package in place");
    assert.equal(step.action, "fail");
    assert.match(step.reason, /\bpi\b/);
    assert.equal(plan.ok, false);
  });

  it("a plan with pi absent never reports success — the pipeline exits 1 naming pi", () => {
    const result = runProvision({
      state: fullState({ pi: { present: false, version: null }, gentleEngram: { present: true, version: "0.4.2" } }),
      execute: () => ({ ok: true, message: "should never run" }),
      verifyAfterPass: () => true,
    });
    assert.equal(result.code, 1);
    assert.match(result.output, /\bpi\b/);
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

  it("an opt-in declined machine plans zero installs and stays ok (S11)", () => {
    const plan = planSetup(fullState({ bun: { present: false, version: null } }));
    assert.equal(plan.ok, true);
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

  it("an absent bun is a warning row that never fails the verdict (S11)", () => {
    const result = verify(fullState({ bun: { present: false, version: null } }));
    const bun = result.results.find((r) => r.tool === "bun");
    assert.equal(bun.warn, true);
    assert.equal(bun.ok, true);
    assert.match(bun.detail, /optional/);
    assert.match(bun.detail, /node is the runtime fallback/);
    assert.equal(result.ok, true);
  });

  it("the bun-built local rows warn instead of failing while bun is absent (S11)", () => {
    const result = verify(worktreeState({ bun: { present: false, version: null } }));
    for (const tool of ["schema-dist", "pi-crate-modules"]) {
      const row = result.results.find((r) => r.tool === tool);
      assert.equal(row.warn, true, tool);
      assert.equal(row.ok, true, tool);
      assert.match(row.detail, /bun/, tool);
    }
    assert.equal(result.ok, false, "the serena-cache/override misses still fail");
  });

  it("bun behind the pin stays a failing MISS even under S11 (old bun cannot parse lockfiles)", () => {
    const result = verify(fullState({ bun: { present: true, version: "1.3.9" }, bunPinned: "1.4.0" }));
    assert.equal(result.ok, false);
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
  it("no plan step on any platform may target .engram/, run `engram setup`, `pi-engram init`, `serena init`, or rewrite committed .serena/project.yml", () => {
    const forbidden = [/\.engram/, /engram\s+setup/, /pi-engram\s+init/, /serena\s+init/];
    const states = [
      fullState(),
      fullState({ bun: { present: false, version: null }, uv: { present: false, version: null }, serena: { present: false, version: null } }),
      fullState({ platform: "darwin", brew: { present: true }, engram: { present: false, version: null } }),
      fullState({ engram: { present: false, version: null } }),
      fullState({ gentleEngram: { present: false, version: null } }),
      // Every local state missing: the S10 override WRITE step is in the plan
      // here, so its content is scanned rather than filtered out of the walk.
      worktreeState(),
      worktreeState({ serenaLocalOverridePresent: false, engramConfigValid: false }),
    ];
    for (const state of states) {
      const plan = planSetup(state);
      // What a step ACTS on: the executable command, the write target and the
      // payload. A fail row's reason is prose that names the file it refuses to
      // touch, so it is scanned separately (it must never carry an action).
      const written = plan.steps
        .map((step) => [step.target, step.command, step.content].filter(Boolean).join(" "))
        .join("\n");
      for (const pattern of forbidden) {
        assert.doesNotMatch(written, pattern, `plan for platform=${state.platform} acts on a forbidden target ${pattern}`);
      }
      for (const step of plan.steps.filter((s) => s.action === "fail")) {
        assert.doesNotMatch(String(step.command ?? ""), /.engram|engram\s+setup|pi-engram\s+init|serena\s+init/u, `a fail row must not carry a command (${step.tool})`);
      }
      for (const step of plan.steps) {
        // The only .serena/ paths a plan may write are the machine-local, gitignored
        // ones (S10); the committed project.yml is never a write target.
        assert.doesNotMatch(written, /project\.local\.yml.*>|>.*project\.yml/, "no step redirects into the committed project.yml");
        if (!LOCAL_SERENA_WRITES.has(step.tool)) {
          assert.doesNotMatch([step.target, step.command].filter(Boolean).join(" "), /\.serena\//, `${step.tool} must not touch .serena/`);
        }
      }
      // The override step is the one .serena/ write the plan does carry, and its
      // payload lists language servers only — never a committed file, and never a
      // server that cannot start here (markdown/marksman, PE-014).
      const override = plan.steps.find((step) => step.tool === "serena-local-override");
      if (override) {
        assert.match(override.target, /\.serena\/project\.local\.yml$/);
        assert.ok(override.content.length > 0);
        const listed = override.content
          .split("\n")
          .filter((line) => /^\s*-\s/u.test(line))
          .map((line) => line.replace(/^\s*-\s*/u, "").trim());
        assert.ok(listed.length > 0, "the override lists language servers");
        assert.doesNotMatch(listed.join(" "), /\bmarkdown\b/, "markdown must stay unlisted (marksman crashes without libicu)");
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
  it("exposes the exact installer commands the doc relies on", () => {
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
    fs.mkdirSync(path.join(tmp, ".serena"), { recursive: true });
    fs.writeFileSync(path.join(tmp, ".serena", "project.yml"), "project_name: fixture\n");
  });
  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it("reads .bun-version, probes each tool, and finds the committed project.yml", () => {
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

describe("no setup CI — removed by owner decision (S12, D8)", () => {
  it("no workflow file runs setup-env, and setup-check.yml is gone", () => {
    const dir = path.join(REPO_ROOT, ".github", "workflows");
    const offenders = fs
      .readdirSync(dir)
      .filter((f) => /\.ya?ml$/u.test(f))
      .filter((f) => fs.readFileSync(path.join(dir, f), "utf8").includes("setup-env"));
    assert.deepEqual(offenders, [], "no GitHub Actions workflow may run setup-env");
    assert.equal(fs.existsSync(path.join(dir, "setup-check.yml")), false);
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
    serenaLocalOverridePresent: false,
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

  it("skips the bun-built local steps while bun is absent and declined (S11) — never a failure", () => {
    const plan = planSetup(worktreeState({ bun: { present: false, version: null } }));
    assert.equal(plan.steps.find((s) => s.tool === "schema-dist"), undefined);
    assert.equal(plan.steps.find((s) => s.tool === "pi-crate-modules"), undefined);
    assert.ok(plan.steps.find((s) => s.tool === "serena-cache"), "cache and override are not bun-dependent");
    assert.ok(plan.steps.find((s) => s.tool === "serena-local-override"));
    assert.equal(plan.ok, true);
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
  it("executes every planned fix in dependency order within one pass", () => {
    const executed = [];
    const result = runProvision({
      state: worktreeState(),
      execute: (step) => {
        executed.push(step.tool);
        return { ok: true, message: `fixed ${step.tool}` };
      },
      verifyAfterPass: () => true,
    });
    assert.equal(result.code, 0);
    assert.deepEqual(executed, ["serena-cache", "serena-local-override", "schema-dist", "pi-crate-modules"]);
    assert.equal(result.passes, 1);
  });

  it("re-probes after a fix and converges on the next pass — the loop, not a lucky first pass (AC12)", () => {
    const executed = [];
    const probes = [];
    let state = worktreeState();
    const result = runProvision({
      state,
      execute: (step) => {
        executed.push(step.tool);
        // The machine only reflects the fix on the next probe, exactly like an
        // installer that writes and lets the following pass find it.
        return { ok: true, message: `fixed ${step.tool}` };
      },
      // First pass: the fake probe has not caught up yet. Second: the fixes landed.
      verifyAfterPass: (pass) => {
        probes.push(pass);
        return pass >= 2;
      },
      advance: () => {
        state = fullState({ serenaLocalOverridePresent: false });
        return state;
      },
    });
    assert.equal(result.code, 0);
    assert.equal(result.passes, 2, "it takes the second pass to converge");
    assert.deepEqual(probes, [1, 2]);
    // The first pass ran every fix once; the second pass had nothing left to plan
    // except the override whose state the fake never advanced.
    assert.deepEqual(executed.slice(0, 4), ["serena-cache", "serena-local-override", "schema-dist", "pi-crate-modules"]);
  });

  it("a pass that installs a tool unlocks the next pass — PATH augmentation is what the loop relies on", () => {
    const executed = [];
    const result = runProvision({
      state: fullState({ bun: { present: false, version: null }, uv: { present: false, version: null }, serena: { present: false, version: null } }),
      execute: (step) => {
        executed.push(step.tool);
        return { ok: true, message: `installed ${step.tool}` };
      },
      verifyAfterPass: (pass) => pass >= 2,
      advance: () => fullState(),
      bunOptIn: true,
    });
    assert.equal(result.code, 0);
    assert.deepEqual(executed, ["bun", "uv", "serena"]);
    assert.equal(result.passes, 2);
  });

  it("a declined bun never plans an install — only uv/serena run (S11)", () => {
    const executed = [];
    const result = runProvision({
      state: fullState({ bun: { present: false, version: null }, uv: { present: false, version: null }, serena: { present: false, version: null } }),
      execute: (step) => {
        executed.push(step.tool);
        return { ok: true, message: `installed ${step.tool}` };
      },
      verifyAfterPass: (pass) => pass >= 2,
      advance: () => fullState({ bun: { present: false, version: null } }),
    });
    assert.equal(result.code, 0);
    assert.deepEqual(executed, ["uv", "serena"]);
    assert.equal(result.passes, 2);
  });

  it("stops the pipeline naming the tool when a fix fails — later steps never run", () => {
    const executed = [];
    const result = runProvision({
      state: worktreeState({ bun: { present: false, version: null } }),
      bunOptIn: true,
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
// Owner correction S2a (2026-10-28): bun pinned by the committed .bun-version,
// symmetric with .node-version for node — read as a MINIMUM by the owner
// correction S2b (newer accepted, behind repaired). Evidence PE-013; supersedes
// the PE-006 reading (and S2a's own first, exact-match interpretation, D5/L4).
// ---------------------------------------------------------------------------

describe("bun pinned via .bun-version (S2a, AC13)", () => {
  it("a newer bun satisfies the pin; the pin itself verifies clean (S2b minimum)", () => {
    for (const installed of ["1.4.0", "1.4.4"]) {
      const result = verify(fullState({ bun: { present: true, version: installed }, bunPinned: "1.4.0" }));
      const bun = result.results.find((r) => r.tool === "bun");
      assert.equal(bun.ok, true, installed);
      assert.match(bun.detail, /\.bun-version/);
    }
  });

  it("plans the pinned install when bun is missing and the user opted in", () => {
    const plan = planSetup(fullState({ bun: { present: false, version: null }, bunPinned: "1.4.0" }), { bunOptIn: true });
    const step = plan.steps.find((s) => s.tool === "bun");
    assert.ok(step);
    assert.match(String(step.command), /bun\.sh\/install/);
    assert.match(String(step.command), /bash -s "bun-v1\.4\.0"/);
  });

  it("plans no bun step when the installed bun satisfies the pin (S2b)", () => {
    const plan = planSetup(fullState({ bun: { present: true, version: "1.4.4" }, bunPinned: "1.4.0" }));
    assert.equal(plan.steps.find((s) => s.tool === "bun"), undefined);
  });

  it("falls back to the latest installer when no .bun-version exists", () => {
    const plan = planSetup(fullState({ bun: { present: false, version: null }, bunPinned: null }), { bunOptIn: true });
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

// ---------------------------------------------------------------------------
// Owner correction S2b (2026-10-28): the .bun-version pin is a MINIMUM —
// bun >= pin verifies (a newer bun is accepted, like node's >=-major rule);
// only missing-or-behind installs/repairs at the pin. Supersedes the exact
// reading tested above (those fixtures keep pin == version, still valid).
// ---------------------------------------------------------------------------

describe(".bun-version is a minimum (S2b)", () => {
  it("versionAtLeast compares numerically, not lexicographically", () => {
    assert.equal(versionAtLeast("1.4.4", "1.4.0"), true);
    assert.equal(versionAtLeast("1.4.0", "1.4.0"), true);
    assert.equal(versionAtLeast("1.10.0", "1.4.0"), true, "10 > 4 numerically");
    assert.equal(versionAtLeast("1.3.9", "1.4.0"), false);
    assert.equal(versionAtLeast(null, "1.4.0"), false);
  });

  it("a newer bun satisfies the pin — no MISS, no repair step", () => {
    const state = fullState({ bun: { present: true, version: "1.4.4" }, bunPinned: "1.4.0" });
    const result = verify(state);
    const bun = result.results.find((r) => r.tool === "bun");
    assert.equal(bun.ok, true);
    assert.match(bun.detail, /\.bun-version/);
    const plan = planSetup(state);
    assert.equal(plan.steps.find((s) => s.tool === "bun"), undefined);
  });

  it("bun behind the pin is a MISS row naming .bun-version", () => {
    const result = verify(fullState({ bun: { present: true, version: "1.3.9" }, bunPinned: "1.4.0" }));
    const bun = result.results.find((r) => r.tool === "bun");
    assert.equal(bun.ok, false);
    assert.match(bun.detail, /\.bun-version/);
    assert.match(bun.detail, /1\.4\.0/);
  });

  it("bun behind the pin plans a repair at the pinned version; newer plans nothing", () => {
    const behind = planSetup(fullState({ bun: { present: true, version: "1.3.9" }, bunPinned: "1.4.0" }));
    const step = behind.steps.find((s) => s.tool === "bun");
    assert.ok(step);
    assert.match(String(step.command), /bash -s "bun-v1\.4\.0"/);
    const current = planSetup(fullState({ bun: { present: true, version: "1.4.4" }, bunPinned: "1.4.0" }));
    assert.equal(current.steps.find((s) => s.tool === "bun"), undefined);
  });

  it("SETUP.md describes the pin as a minimum", () => {
    const text = fs.readFileSync(path.join(REPO_ROOT, "docs", "workflow", "SETUP.md"), "utf8");
    assert.match(text, /≥|>=|minimum/i);
    assert.ok(text.includes(".bun-version"));
  });
});

// ---------------------------------------------------------------------------
// Owner amendment S10 (2026-10-28): PE-010 fixed at its reproduced root cause.
// The machine-local .serena/project.local.yml override (markdown deliberately
// absent — marksman crashes on this machine, and one failing LS kills the
// whole manager) is local state a fresh worktree lacks; setup-env creates it.
// ---------------------------------------------------------------------------

describe("the serena local override (S10, AC14)", () => {
  it("a checkout without the override is a MISS row in verification", () => {
    const result = verify(fullState({ serenaLocalOverridePresent: false }));
    const row = result.results.find((r) => r.tool === "serena-local-override");
    assert.equal(row.ok, false);
    assert.match(row.detail, /project\.local\.yml/);
  });

  it("plans the override creation when it is missing — with the safe language-server list", () => {
    const plan = planSetup(fullState({ serenaLocalOverridePresent: false }));
    const step = plan.steps.find((s) => s.tool === "serena-local-override");
    assert.ok(step);
    assert.equal(step.action, "fix");
    assert.equal(step.kind, "write-local-override");
    const listed = String(step.content)
      .split("\n")
      .filter((line) => /^\s*-\s/u.test(line))
      .map((line) => line.replace(/^\s*-\s/u, "").trim());
    assert.deepEqual(listed, ["typescript", "bash", "json", "yaml"]);
    assert.ok(!listed.includes("markdown"), "markdown must be deliberately absent (marksman crashes, PE-014)");
  });

  it("plans nothing when the override already exists — never overwrites a local file", () => {
    const plan = planSetup(fullState({ serenaLocalOverridePresent: true }));
    assert.equal(plan.steps.find((s) => s.tool === "serena-local-override"), undefined);
  });

  it("the committed .serena/project.yml is never a write target even in a bare worktree state", () => {
    const plan = planSetup(worktreeState());
    for (const step of plan.steps) {
      // Writes happen through `target` (mkdir/write kinds) or shell `command`;
      // a step's comment content may mention the committed file without
      // writing it.
      const text = [step.command, step.target].filter(Boolean).join(" ");
      assert.doesNotMatch(text, /\bproject\.yml\b/, `${step.tool} must not touch the committed project.yml`);
    }
  });

  it("probeEnvironment reports the override's presence", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "setup-env-override-"));
    try {
      fs.mkdirSync(path.join(tmp, ".serena"), { recursive: true });
      const absent = probeEnvironment({ root: tmp, platform: "linux", home: tmp, env: {}, probe: () => null });
      assert.equal(absent.serenaLocalOverridePresent, false);
      fs.writeFileSync(path.join(tmp, ".serena", "project.local.yml"), "language_servers: [typescript]\n");
      const present = probeEnvironment({ root: tmp, platform: "linux", home: tmp, env: {}, probe: () => null });
      assert.equal(present.serenaLocalOverridePresent, true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("SETUP.md documents the override row", () => {
    const text = fs.readFileSync(path.join(REPO_ROOT, "docs", "workflow", "SETUP.md"), "utf8");
    assert.ok(text.includes("project.local.yml"), "SETUP.md must mention the machine-local override");
  });
});
