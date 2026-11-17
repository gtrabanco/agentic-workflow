// turn-contract.forge.test.mjs — the forge-aware box4 the scaffold's shim has
// carried since issue #546, now part of the engine it delegates to (unit 554).
//
// A forge is a fact about the checked remote, so these cases prove the two flags
// the shell shim accepted and the engine did not: `--remote` (which remote box4
// asks, and which remote's HEAD decides box1's default branch) and `--forge`
// (forcing the forge for a self-hosted instance). No case contacts a forge: the
// CLI is a PATH stub.

import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const scratch = mkdtempSync(path.join(os.tmpdir(), "aw-turn-forge-"));
test.after(() => rmSync(scratch, { recursive: true, force: true }));

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const ENGINE = path.join(REPO_ROOT, "packages/agentic-workflow/bin/turn-contract.mjs");
const SHIM = path.join(REPO_ROOT, "template/.agentic-workflow/hooks/turn-contract.sh");
const CLI = path.join(REPO_ROOT, "packages/agentic-workflow/bin/agentic-workflow.mjs");

const GIT_CONFIG = ["-c", "user.email=t@example.com", "-c", "user.name=test", "-c", "commit.gpgsign=false"];

function git(cwd, ...args) {
  const result = spawnSync("git", [...GIT_CONFIG, "-C", cwd, ...args], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

/** A forge CLI stub that answers `pr list …` with `$ANSWER` (a JSON array). */
function forgeStub(binDir, name, answer) {
  const file = path.join(binDir, name);
  writeFileSync(
    file,
    `#!/usr/bin/env bash\ncase "$1 $2" in\n  "pr list"|"mr list") printf '%s\\n' '${answer}' ;;\n  *) exit 3 ;;\nesac\n`,
  );
  chmodSync(file, 0o755);
  return file;
}

/**
 * A checkout with a tracked branch, a bare `origin`, a `fork` remote whose host
 * says nothing, and the branch's own pull request answered by the stubs.
 */
function fixture(name, { head = null } = {}) {
  const root = mkdtempSync(path.join(scratch, `${name}-`));
  const bare = path.join(scratch, `${name}-remote.git`);
  const bin = path.join(scratch, `${name}-bin`);
  mkdirSync(bin, { recursive: true });
  spawnSync("git", ["init", "-q", "--bare", bare], { encoding: "utf8" });
  spawnSync("git", ["init", "-q", "-b", "main", root], { encoding: "utf8" });
  writeFileSync(path.join(root, "README.md"), "base\n");
  git(root, "add", "README.md");
  git(root, "commit", "-qm", "base");
  git(root, "remote", "add", "origin", bare);
  git(root, "push", "-qu", "origin", "main");
  git(root, "checkout", "-q", "-b", "feat/x");
  writeFileSync(path.join(root, "feat.txt"), "x\n");
  git(root, "add", "feat.txt");
  git(root, "commit", "-qm", "feat");
  git(root, "push", "-qu", "origin", "feat/x");
  git(root, "remote", "add", "fork", "https://git.example.com/o/r.git");
  git(root, "update-ref", "refs/remotes/fork/main", "HEAD");
  const sha = head ?? git(root, "rev-parse", "HEAD");
  forgeStub(bin, "gh", `[{"state":"OPEN","headRefOid":"${sha}"}]`);
  forgeStub(bin, "gt", `[{"state":"open","head_sha":"${sha}"}]`);
  forgeStub(bin, "glab", `[{"state":"opened","sha":"${sha}"}]`);
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    AGENTIC_WORKFLOW_BIN: CLI,
    HOME: root,
    PI_CODING_AGENT_DIR: root,
  };
  return { root, env, sha };
}

function run(entry, repo, args, env = repo.env) {
  return spawnSync(process.execPath, [entry, ...args], { cwd: repo.root, encoding: "utf8", env });
}

test("box4 asks the default CLI for a filesystem remote", () => {
  const repo = fixture("filesystem");
  const result = run(ENGINE, repo, ["--finished"]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.stdout, "TURN-CONTRACT ok\n");
});

test("box4 asks the remote named by --remote, and a host that says nothing is unreachable", () => {
  const repo = fixture("unknown");
  const result = run(ENGINE, repo, ["--finished", "--remote", "fork"]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "TURN-CONTRACT fail box4: pr-unreachable\n");
});

test("--forge forces the forge for a self-hosted remote", () => {
  const repo = fixture("forced");
  const gitea = run(ENGINE, repo, ["--finished", "--remote", "fork", "--forge", "gitea"]);
  assert.equal(gitea.status, 0, gitea.stdout + gitea.stderr);
  assert.equal(gitea.stdout, "TURN-CONTRACT ok\n");
});

test("an invalid --forge is a usage error naming the four forges, never a verdict", () => {
  const repo = fixture("invalid");
  const result = run(ENGINE, repo, ["--finished", "--forge", "gerrit"]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /forge "gerrit" is not one of github, gitlab, gitea, bitbucket/u);
  assert.match(result.stderr, /usage: turn-contract/u);
});

test("an invalid AGENTIC_WORKFLOW_FORGE is the same usage error", () => {
  const repo = fixture("invalid-env");
  const result = run(ENGINE, repo, ["--finished"], { ...repo.env, AGENTIC_WORKFLOW_FORGE: "gerrit" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /not one of github, gitlab, gitea, bitbucket/u);
});

test("a flag without a value is a usage error", () => {
  const repo = fixture("missing-value");
  for (const flag of ["--remote", "--forge"]) {
    const result = run(ENGINE, repo, [flag]);
    assert.equal(result.status, 2, flag);
    assert.match(result.stderr, new RegExp(`${flag} needs a value`, "u"));
  }
});

test("box4 reports pr-not-open when the branch has no pull request", () => {
  const repo = fixture("none", { head: "0000000000000000000000000000000000000000" });
  const result = run(ENGINE, repo, ["--finished"]);
  // The stub answers a pull request whose head is another commit.
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "TURN-CONTRACT fail box4: pr-head-mismatch\n");
});

test("the shim and the engine answer the same for the forge flags", () => {
  const repo = fixture("shim");
  const engine = run(ENGINE, repo, ["--finished", "--remote", "fork"]);
  const shim = spawnSync("bash", [SHIM, "--finished", "--remote", "fork"], {
    cwd: repo.root,
    encoding: "utf8",
    env: repo.env,
  });
  assert.equal(shim.status, engine.status);
  assert.equal(shim.stdout, engine.stdout);
});
