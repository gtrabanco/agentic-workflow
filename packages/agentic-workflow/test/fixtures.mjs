// Shared throwaway-repo fixture matrix for the turn-contract suites.
//
// The engine suite, the two-engine parity suite, and the grammar conformance
// test all drive the SAME matrix so a per-box outcome and the receipt grammar
// are asserted once and reused (D-52-9 proportionality, no combinatorial
// flag x state sweep). Everything lives in one temp directory; `gh` is a
// PATH-stub because no suite contacts a forge.

import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, "..", "..", "..");
export const ENGINE = path.join(REPO_ROOT, "packages/agentic-workflow/bin/turn-contract.mjs");
export const SHIM = path.join(REPO_ROOT, "template/.agentic-workflow/hooks/turn-contract.sh");

const GIT_CONFIG = ["-c", "user.email=t@example.com", "-c", "user.name=test", "-c", "commit.gpgsign=false"];

export function git(cwd, ...args) {
  const r = spawnSync("git", [...GIT_CONFIG, "-C", cwd, ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} in ${cwd} failed: ${r.stderr}`);
  return r.stdout.trimEnd();
}

function gitInit(dir, branch) {
  const r = spawnSync("git", ["init", "-q", "-b", branch, dir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git init ${dir} failed: ${r.stderr}`);
}

function newRepo(root, name, branch) {
  const dir = path.join(root, name);
  gitInit(dir, branch);
  writeFileSync(path.join(dir, "README.md"), "base\n");
  git(dir, "add", "README.md");
  git(dir, "commit", "-qm", "base");
  return dir;
}

export { newRepo, commitFile };

function commitFile(dir, rel, content) {
  const target = path.join(dir, rel);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
  git(dir, "add", rel);
  git(dir, "commit", "-qm", `add ${rel}`);
}

function bareRemote(root, dir, branch) {
  const bare = path.join(root, `${path.basename(dir)}-remote.git`);
  const r = spawnSync("git", ["init", "-q", "--bare", bare], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git init --bare failed: ${r.stderr}`);
  git(dir, "remote", "add", "origin", bare);
  git(dir, "push", "-qu", "origin", branch);
}

function unitBranch(root, name, branch, acceptance = "frozen") {
  const dir = newRepo(root, name, "main");
  git(dir, "checkout", "-q", "-b", branch);
  commitFile(dir, `docs/features/${branch.split("/")[1]}/ACCEPTANCE.md`, `${acceptance}\n`);
  return dir;
}

function ghStub(root) {
  const dir = path.join(root, "bin");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "gh");
  writeFileSync(
    file,
    [
      "#!/usr/bin/env bash",
      "# PATH-stub for gh. `pr list --head <branch>` answers with $GH_STUB_JSON (the",
      "# pull requests of that branch); `pr view <arg>` answers with",
      "# $GH_STUB_VIEW_JSON — real gh reads an all-numeric argument as a PR NUMBER",
      "# and exits nonzero when no pull request matches the branch.",
      "# $GH_STUB_EXIT forces a failure exit from either invocation;",
      "# $GH_STUB_VIEW_EXIT forces one from `pr view` only (the real 'no PR for",
      "# this branch' answer, which is what makes a missing PR",
      "# indistinguishable from an unreachable gh in the pre-F9 query).",
      'case "$1 $2" in',
      '  "pr list")\n    printf \'%s\\n\' "${GH_STUB_JSON:-[]}"\n    exit_code="${GH_STUB_EXIT:-0}"\n    ;;',
      '  "pr view")\n    printf \'%s\\n\' "${GH_STUB_VIEW_JSON:-}"\n    exit_code="${GH_STUB_VIEW_EXIT:-${GH_STUB_EXIT:-0}}"\n    ;;',
      "  *) exit 3 ;;",
      "esac",
      '[ "$exit_code" -eq 0 ] || exit "$exit_code"',
      "",
    ].join("\n"),
  );
  chmodSync(file, 0o755);
  return dir;
}

function buildFixtures(root) {
  const fx = {};

  // Unit-shaped, clean, no upstream -> the ok path.
  fx.ok = unitBranch(root, "ok", "feat/ok");

  // On the default branch.
  fx.default = newRepo(root, "default", "main");

  // Not a repository at all.
  fx.notrepo = path.join(root, "notrepo");
  mkdirSync(fx.notrepo, { recursive: true });

  // Branch with no own commit.
  fx.nocommits = newRepo(root, "nocommits", "main");
  git(fx.nocommits, "checkout", "-q", "-b", "feat/none");

  // Unborn branch, zero commits anywhere (dev scenario verifier:empty-repo).
  fx.empty = path.join(root, "empty");
  gitInit(fx.empty, "feature/x");

  // Unit directory exists but ACCEPTANCE.md is absent at HEAD.
  fx.missing = newRepo(root, "missing", "main");
  git(fx.missing, "checkout", "-q", "-b", "feat/missing");
  commitFile(fx.missing, "docs/features/missing/SPEC.md", "no acceptance here\n");

  // Not unit-shaped -> box2 not applicable.
  fx.plain = newRepo(root, "plain", "main");
  git(fx.plain, "checkout", "-q", "-b", "chore/plain");
  commitFile(fx.plain, "note.txt", "x\n");

  // Unit path exists as a regular FILE, not a directory -> the unit directory
  // does not exist, so box2 is not-applicable (ED-52-2) in BOTH engines
  // (F5, review cycle 2).
  fx.unitfile = newRepo(root, "unitfile", "main");
  git(fx.unitfile, "checkout", "-q", "-b", "feat/unitfile");
  commitFile(fx.unitfile, "docs/features/unitfile", "not a directory\n");

  // Dirty tree.
  fx.dirty = unitBranch(root, "dirty", "feat/dirty");
  writeFileSync(path.join(fx.dirty, "README.md"), "base\ndirty\n");

  // Pushed branch plus one local commit -> ahead of remote.
  fx.ahead = unitBranch(root, "ahead", "feat/ahead");
  bareRemote(root, fx.ahead, "feat/ahead");
  commitFile(fx.ahead, "extra.txt", "local only\n");

  // Dirty AND ahead simultaneously -> dirty wins inside box5.
  fx.dirtyahead = unitBranch(root, "dirtyahead", "feat/dirtyahead");
  bareRemote(root, fx.dirtyahead, "feat/dirtyahead");
  commitFile(fx.dirtyahead, "extra.txt", "local only\n");
  writeFileSync(path.join(fx.dirtyahead, "README.md"), "base\ndirty\n");

  // Dirty tree with spaces / unicode filenames (dev scenario).
  fx.unicode = unitBranch(root, "unicode", "feat/unicode");
  writeFileSync(path.join(fx.unicode, "a b.txt"), "x\n");
  writeFileSync(path.join(fx.unicode, "café.txt"), "x\n");

  // Pushed branch with an upstream -> box4 exercises the gh stub.
  fx.b4 = unitBranch(root, "b4", "feat/b4");
  bareRemote(root, fx.b4, "feat/b4");

  // Corrupt index: `git status` itself errors while branch/rev-list still
  // answer -> box5 must fail closed, never print a fake ok (F1, review cycle 1).
  fx.corrupt = unitBranch(root, "corrupt", "feat/corrupt");
  writeFileSync(path.join(fx.corrupt, ".git/index"), "not a git index\n");

  // Listing past the engine's 1 MiB read cap and past the shim's pipe buffer:
  // both truncate, and both must still fail closed (F6, fold cycle 2). Long
  // path segments keep the fixture cheap — 320 files ≈ 1.2 MB of porcelain.
  fx.bigstatus = unitBranch(root, "bigstatus", "feat/bigstatus");
  const longDir = Array.from({ length: 19 }, () => "d".repeat(200)).join("/");
  commitFile(fx.bigstatus, `${longDir}/tracked.txt`, "x\n");
  for (let i = 0; i < 320; i += 1) writeFileSync(path.join(fx.bigstatus, longDir, `f${i}`), "x\n");

  // Repo-local `status.showUntrackedFiles=no` must not hide an untracked file
  // from box5 (F8, fold cycle 3).
  fx.hidden = unitBranch(root, "hidden", "feat/hidden");
  git(fx.hidden, "config", "status.showUntrackedFiles", "no");
  writeFileSync(path.join(fx.hidden, "untracked.txt"), "x\n");

  // All-numeric branch name: a bare `gh pr view <branch>` argument is read by
  // gh as a PR NUMBER, so box4 would judge the unrelated PR that shares the
  // name instead of this branch (F11, fold cycle 3).
  fx.numeric = newRepo(root, "numeric", "main");
  git(fx.numeric, "checkout", "-q", "-b", "123");
  commitFile(fx.numeric, "note.txt", "x\n");
  bareRemote(root, fx.numeric, "123");

  // Engine-only: the phase-lint clause of box2 (the shim cannot run it).
  fx.lintfail = unitBranch(root, "lintfail", "feat/lintfail");
  commitFile(fx.lintfail, "docs/features/lintfail/TASKS.md", "# TASKS\n");
  commitFile(fx.lintfail, "scripts/phase-lint.mjs", "process.exit(1);\n");
  fx.lintpass = unitBranch(root, "lintpass", "feat/lintpass");
  commitFile(fx.lintpass, "docs/features/lintpass/TASKS.md", "# TASKS\n");
  commitFile(fx.lintpass, "scripts/phase-lint.mjs", "process.exit(0);\n");

  return fx;
}

function baseEnv(ghDir) {
  return {
    ...process.env,
    PATH: `${ghDir}:${process.env.PATH}`,
    AGENTIC_WORKFLOW_RUNTIME: "node",
  };
}

export function makeContext() {
  const root = mkdtempSync(path.join(os.tmpdir(), "tc-fixtures-"));
  const ghDir = ghStub(root);
  const fx = buildFixtures(root);
  return {
    root,
    ghDir,
    fx,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
    runEngine(cwd, args = [], env = {}) {
      const r = spawnSync(process.execPath, [ENGINE, ...args], {
        cwd,
        encoding: "utf8",
        env: { ...baseEnv(ghDir), ...env },
      });
      return { code: r.status, stdout: r.stdout, stderr: r.stderr };
    },
    runShim(cwd, args = [], env = {}) {
      const r = spawnSync("bash", [SHIM, ...args], {
        cwd,
        encoding: "utf8",
        env: { ...baseEnv(ghDir), ...env },
      });
      return { code: r.status, stdout: r.stdout, stderr: r.stderr };
    },
  };
}

// The shared matrix for BOTH engines (no phase-lint fixture: that clause is
// engine-only, ED-52-3).
export function receiptCases(ctx) {
  const head = git(ctx.fx.b4, "rev-parse", "HEAD");
  return [
    { name: "box1 default branch", dir: ctx.fx.default, code: 1, line: "TURN-CONTRACT fail box1: branch-default" },
    { name: "box1 not a repo", dir: ctx.fx.notrepo, code: 1, line: "TURN-CONTRACT fail box1: not-a-repo" },
    { name: "box2 acceptance missing", dir: ctx.fx.missing, code: 1, line: "TURN-CONTRACT fail box2: acceptance-missing" },
    { name: "box2 not applicable", dir: ctx.fx.plain, code: 0, line: "TURN-CONTRACT ok" },
    { name: "box2 unit path is a file", dir: ctx.fx.unitfile, code: 0, line: "TURN-CONTRACT ok" },
    { name: "box3 no commits", dir: ctx.fx.nocommits, code: 1, line: "TURN-CONTRACT fail box3: no-commits" },
    { name: "box3 empty repo", dir: ctx.fx.empty, code: 1, line: "TURN-CONTRACT fail box3: no-commits" },
    { name: "box4 not applicable", dir: ctx.fx.ok, code: 0, line: "TURN-CONTRACT ok" },
    { name: "box4 no upstream", dir: ctx.fx.ok, args: ["--finished"], code: 1, line: "TURN-CONTRACT fail box4: pr-not-open" },
    {
      name: "box4 gh unreachable",
      dir: ctx.fx.b4,
      args: ["--finished"],
      env: { GH_STUB_EXIT: "1" },
      code: 1,
      line: "TURN-CONTRACT fail box4: pr-unreachable",
    },
    {
      name: "box4 no PR for the branch",
      dir: ctx.fx.b4,
      args: ["--finished"],
      // The branch is pushed and has no PR: `pr list` answers that with exit 0
      // and an empty result; the pre-F9 query (`pr view`) exits nonzero for the
      // same state, which is why it reports a missing PR as pr-unreachable.
      env: { GH_STUB_JSON: "[]", GH_STUB_VIEW_EXIT: "1" },
      code: 1,
      line: "TURN-CONTRACT fail box4: pr-not-open",
    },
    {
      name: "box4 merged PR is not an open PR",
      dir: ctx.fx.b4,
      args: ["--finished"],
      env: {
        GH_STUB_JSON: JSON.stringify([{ headRefOid: head, state: "MERGED" }]),
        GH_STUB_VIEW_JSON: JSON.stringify({ headRefOid: head, state: "MERGED" }),
      },
      code: 1,
      line: "TURN-CONTRACT fail box4: pr-not-open",
    },
    {
      name: "box4 head mismatch",
      dir: ctx.fx.b4,
      args: ["--finished"],
      env: { GH_STUB_JSON: JSON.stringify([{ headRefOid: "0".repeat(40), state: "OPEN" }]) },
      code: 1,
      line: "TURN-CONTRACT fail box4: pr-head-mismatch",
    },
    {
      name: "box4 open PR at HEAD",
      dir: ctx.fx.b4,
      args: ["--finished"],
      env: { GH_STUB_JSON: JSON.stringify([{ headRefOid: head, state: "OPEN" }]) },
      code: 0,
      line: "TURN-CONTRACT ok",
    },
    {
      name: "box4 numeric branch is not a PR number",
      dir: ctx.fx.numeric,
      args: ["--finished"],
      env: {
        GH_STUB_JSON: "[]",
        GH_STUB_VIEW_JSON: JSON.stringify({ headRefOid: "0".repeat(40), state: "OPEN" }),
      },
      code: 1,
      line: "TURN-CONTRACT fail box4: pr-not-open",
    },
    { name: "box5 dirty tree", dir: ctx.fx.dirty, code: 1, line: "TURN-CONTRACT fail box5: dirty-tree" },
    { name: "box5 ahead of remote", dir: ctx.fx.ahead, code: 1, line: "TURN-CONTRACT fail box5: ahead-of-remote" },
    { name: "box5 dirty precedes ahead", dir: ctx.fx.dirtyahead, code: 1, line: "TURN-CONTRACT fail box5: dirty-tree" },
    { name: "box5 unicode/space names", dir: ctx.fx.unicode, code: 1, line: "TURN-CONTRACT fail box5: dirty-tree" },
    {
      name: "box5 ignores status.showUntrackedFiles=no",
      dir: ctx.fx.hidden,
      code: 1,
      line: "TURN-CONTRACT fail box5: dirty-tree",
    },
    { name: "box5 unreadable status fails closed", dir: ctx.fx.corrupt, code: 1, line: "TURN-CONTRACT fail box5: dirty-tree" },
    { name: "box5 huge listing fails closed", dir: ctx.fx.bigstatus, code: 1, line: "TURN-CONTRACT fail box5: dirty-tree" },
    { name: "clean feature branch", dir: ctx.fx.ok, code: 0, line: "TURN-CONTRACT ok" },
  ];
}

// Engine-only cases: the phase-lint clause of box2.
export function engineOnlyCases(ctx) {
  return [
    { name: "box2 phase-lint failed", dir: ctx.fx.lintfail, code: 1, line: "TURN-CONTRACT fail box2: phase-lint-failed" },
    { name: "box2 phase-lint green", dir: ctx.fx.lintpass, code: 0, line: "TURN-CONTRACT ok" },
  ];
}
