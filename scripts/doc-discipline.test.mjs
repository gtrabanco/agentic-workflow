/**
 * Transversal discipline suites for the doc retrieval toolchain (unit 65,
 * P9 — AC4, AC24, AC25, AC26). These ride the root gate
 * (`node --test scripts/*.test.mjs`) and fail closed:
 *
 *  - AC25  single entry point: store paths are referenced only from the
 *          entry point + its config + .gitignore + docs — never from a
 *          skill, hook, or doc tool.
 *  - AC26  never authority: the entry point appears only inside the
 *          allowlisted discovery steps (triage-issue, review-change) and
 *          its own surfaces; no gate/receipt producer invokes it.
 *  - AC4   no build step: the toolchain's code never generates or rewrites
 *          skills/**\/SKILL.md.
 *  - AC24  ships to target projects: in a throwaway git repo shaped like a
 *          target project (hook installed, config present), the entry point
 *          syncs, answers, and keeps `git status` clean (AC7's full form).
 */

import { describe, it, before, after } from "node:test";
import { strictEqual, ok } from "node:assert";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, cpSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BIN = join(REPO_ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs");

function repoFiles() {
  const out = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split("\n").map((s) => s.trim()).filter((s) => s !== "");
}

/** Grep a single path for an ERE pattern; "" on no match (grep exits 1). */
function grepOut(args) {
  try {
    return execFileSync("grep", args, { encoding: "utf8" });
  } catch (e) {
    if (e.status === 1) return ""; // no match
    throw e;
  }
}

/** Grep a file set for the pattern; returns matching repo-relative paths. */
function filesMatching(files, pattern) {
  const matches = [];
  for (const rel of files) {
    if (grepOut(["-lE", pattern, join(REPO_ROOT, rel)]).trim() !== "") matches.push(rel);
  }
  return matches;
}

// ── AC25 — single entry point, mechanically enforced ────────────────────

describe("AC25: store paths are referenced only from the entry point's surfaces", () => {
  // The STORE (index.db) is the guarded surface; the committed config path
  // (.agentic-workflow/index.json) is public documentation and may appear
  // anywhere (init-workspace's consent text names it by design).
  const PATTERN = "index\\.db";
  const ALLOWED = [
    /^packages\/agentic-workflow\/(bin|src|test)\//, // the entry point and its engine + tests
    /^docs\//, // documentation (this unit's SPEC included)
    /^\.gitignore$/, // the ignore rule
    /^\.agentic-workflow\/index\.json$/, // the committed config
    /^scripts\/doc-discipline\.test\.mjs$/, // this suite (self-reference)
    /^CHANGELOG\.md$/, // release notes
    /^packages\/(agentic-workflow-schema|pi-agentic-workflow)\/README\.md$/, // package docs
    /^template\/docs\//, // target-project scaffold docs
  ];

  it("no skill, hook, schema, or script outside the allowlist opens the store", () => {
    const offenders = filesMatching(repoFiles(), PATTERN).filter(
      (rel) => !ALLOWED.some((re) => re.test(rel)),
    );
    strictEqual(offenders.length, 0, `store-path references outside the entry point: ${offenders.join(", ")}`);
  });

  it("no tracked file matches the store/manifest path pattern (F4 fold)" , () => {
    const tracked = repoFiles();
    const offenders = tracked.filter((rel) =>
      /\.agentic-workflow\/index\/(index\.db|manifest\.json)$/.test(rel),
    );
    strictEqual(offenders.length, 0, `tracked store/manifest paths: ${offenders.join(", ")}`);
  });

  it("skills/** never reference the store at all (the strongest form)", () => {
    const hits = filesMatching(
      repoFiles().filter((f) => f.startsWith("skills/")),
      PATTERN,
    );
    strictEqual(hits.length, 0, `skills referencing the store: ${hits.join(", ")}`);
  });

  it("the shipped hook invokes the entry point, never the store path", () => {
    const hook = join(REPO_ROOT, "template", ".agentic-workflow", "hooks", "index-sync.sh");
    ok(grepOut(["-cE", "agentic-workflow", hook]).trim() !== "");
    strictEqual(grepOut(["-cE", "index\\.db", hook]).trim(), "");
  });

  it("no tracked file matches the store/manifest path pattern (F4 fold — never committed)", () => {
    const tracked = repoFiles();
    const offenders = tracked.filter((rel) =>
      /\.agentic-workflow\/index\/(index\.db|manifest\.json)$/.test(rel),
    );
    strictEqual(offenders.length, 0, `tracked store/manifest paths: ${offenders.join(", ")}`);
  });
});

// ── AC26 — never authority, mechanically enforced ───────────────────────

describe("AC26: the entry point appears only in the allowlisted discovery steps", () => {
  const PATTERN = "agentic-workflow doc|doc --query|doc --sync";
  const ALLOWED_SKILLS = [
    "skills/triage-issue/SKILL.md", // allowlisted discovery step
    "skills/review-change/SKILL.md", // allowlisted discovery step
    "skills/init-workspace/SKILL.md", // consent/install surface (AC22)
    "skills/unit-lane/SKILL.md", // the lane that carries this unit's own record
    "skills/65-doc-toolchain/SKILL.md", // n/a — unit docs are not skills; kept explicit
  ];

  it("no gate, receipt, or Decision producer invokes the entry point", () => {
    const forbidden = [
      "skills/execute-phase/SKILL.md",
      "skills/pre-execution-review/SKILL.md",
      "skills/phase-contract/SKILL.md",
      "skills/verification-contract/SKILL.md",
      "skills/orchestration-envelope/SKILL.md",
      "skills/audit-pr/SKILL.md",
      "skills/workflow-status/SKILL.md",
    ];
    const hits = filesMatching(forbidden, PATTERN);
    strictEqual(hits.length, 0, `gate/receipt producers invoking the entry point: ${hits.join(", ")}`);
  });

  it("inside skills/, only the allowlisted discovery steps mention it", () => {
    const skillFiles = repoFiles().filter((f) => /^skills\/.*SKILL\.md$/.test(f));
    const hits = filesMatching(skillFiles, PATTERN).filter((rel) => !ALLOWED_SKILLS.includes(rel));
    strictEqual(hits.length, 0, `non-allowlisted skills invoking the entry point: ${hits.join(", ")}`);
  });

  it("the crate's own modules never make a decision from the index (retrieval only)", () => {
    // No module under src/doc may import a gate/receipt/decision surface.
    const srcDir = join(REPO_ROOT, "packages", "agentic-workflow", "src", "doc");
    const hits = grepOut(["-rlE", "receipt|EDIT REFUSAL|verdict", srcDir]);
    strictEqual(hits.trim(), "");
  });
});

// ── AC4 — no build step ─────────────────────────────────────────────────

describe("AC4: the toolchain never generates or rewrites skills/**/SKILL.md", () => {
  it("no doc-toolchain source or bin references SKILL.md at all", () => {
    const dirs = [
      join(REPO_ROOT, "packages", "agentic-workflow", "src", "doc"),
      join(REPO_ROOT, "packages", "agentic-workflow", "bin"),
    ];
    for (const dir of dirs) {
      const hits = grepOut(["-rlE", "SKILL\\.md", dir]);
      strictEqual(hits.trim(), "", `toolchain code referencing SKILL.md under ${dir}`);
    }
  });

  it("the doc entry point writes only under the gitignored index dir", () => {
    const srcDir = join(REPO_ROOT, "packages", "agentic-workflow", "src", "doc");
    // every write target in the toolchain is the store or the manifest
    // export; assert no .md path is written anywhere
    const hits = grepOut(["-rnE", "writeFileSync", srcDir]);
    ok(!/\.md/.test(hits), `a .md write target found in the toolchain:\n${hits}`);
  });
});

// ── AC24 — ships to target projects (temp-dir run) ──────────────────────

describe("AC24: the entry point runs in a target-project-shaped temp dir", () => {
  let proj;

  before(() => {
    proj = mkdtempSync(join(tmpdir(), "doc-target-"));
    const git = (args) => execFileSync("git", args, { cwd: proj, encoding: "utf8" });
    git(["init", "-q"]);
    git(["config", "user.email", "t@example.test"]);
    git(["config", "user.name", "t"]);
    // the target-project scaffold, as init-workspace's consented install lays it out
    mkdirSync(join(proj, "template"), { recursive: true });
    writeFileSync(
      join(proj, "guide.md"),
      "# Project guide\n\n## Findings policy\n\nthe wombatverdict policy for duplicate findings\n",
    );
    mkdirSync(join(proj, ".agentic-workflow"), { recursive: true });
    writeFileSync(
      join(proj, ".agentic-workflow", "index.json"),
      JSON.stringify({ version: 1, store: { path: ".agentic-workflow/index/index.db" }, provider: null }) + "\n",
    );
    // the ignore rule P1 books as AC7's precondition; init-workspace's
    // consented install lays it down with the scaffold
    writeFileSync(join(proj, ".gitignore"), ".agentic-workflow/index/\n");
    mkdirSync(join(proj, ".git", "hooks"), { recursive: true });
    cpSync(
      join(REPO_ROOT, "template", ".agentic-workflow", "hooks", "index-sync.sh"),
      join(proj, ".git", "hooks", "post-merge"),
    );
    // the entry point resolves on PATH, exactly as the pi-package install exposes it
    mkdirSync(join(proj, "bin"), { recursive: true });
    writeFileSync(
      join(proj, "bin", "agentic-workflow"),
      `#!/usr/bin/env bash\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(BIN)} "$@"\n`,
    );
    chmodSync(join(proj, "bin", "agentic-workflow"), 0o755);
    git(["add", "-A"]);
    git(["commit", "-qm", "fixture"]);
  });

  after(() => {
    if (proj && existsSync(proj)) rmSync(proj, { recursive: true, force: true });
  });

  it("the installed hook syncs the store; git status stays clean (AC7 + AC23)", () => {
    const r = spawnSync("bash", [join(proj, ".git", "hooks", "post-merge"), "post-merge"], {
      cwd: proj,
      encoding: "utf8",
      env: { ...process.env, PATH: `${join(proj, "bin")}:${process.env.PATH}` },
    });
    strictEqual(r.status, 0, `stderr: ${r.stderr}`);
    ok(existsSync(join(proj, ".agentic-workflow", "index", "index.db")), "hook did not create the store");
    const status = execFileSync("git", ["status", "--porcelain"], { cwd: proj, encoding: "utf8" });
    strictEqual(status.trim(), "", "sync dirtied the working tree (the store must stay gitignored)");
  });

  it("a query answers from the synced store in the target project (AC8)", () => {
    const r = spawnSync(process.execPath, [BIN, "doc", "--query", "wombatverdict", "--json-only"], {
      cwd: proj,
      encoding: "utf8",
    });
    strictEqual(r.status, 0, `stderr: ${r.stderr}`);
    const env = JSON.parse(r.stdout);
    ok(env.results.some((row) => row.path === "guide.md"), JSON.stringify(env.results));
  });
});
