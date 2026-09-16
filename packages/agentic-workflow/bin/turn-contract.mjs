#!/usr/bin/env node
// Deterministic verifier for the canonical turn contract's mechanical boxes
// (branch, pre-edit artifacts, commit, pushed pull request, clean tree).
// Node standard library only, zero dependencies. The verifier mutates nothing
// of its own: its one spawned process is the repository's own
// scripts/phase-lint.mjs (box2, engine-only clause).
// See skills/orchestration-envelope/references/TURN_CONTRACT.md.
//
// usage: turn-contract [--finished|--help]
// prints exactly one line: TURN-CONTRACT ok
//                      or: TURN-CONTRACT fail box<N>: <code>

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

const USAGE =
  "usage: turn-contract [--finished|--help]\n\n" +
  "  --finished  also check box4 (pushed branch + open pull request whose head is local HEAD)\n" +
  "  --help      print this usage and exit 0\n";

// Every git call is lock-free: a read that may opportunistically write —
// `git status` refreshing the index — would rewrite `.git/index` and contradict
// the read-only claim above (F10, fold cycle 3).
function git(cwd, args) {
  try {
    const out = execFileSync("git", ["--no-optional-locks", ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return { ok: true, out: out.trimEnd() };
  } catch {
    return { ok: false, out: "" };
  }
}

function count(cwd, range) {
  const r = git(cwd, ["rev-list", "--count", range]);
  const n = r.ok ? Number.parseInt(r.out, 10) : Number.NaN;
  return Number.isFinite(n) ? n : null;
}

// box2 applies only when the unit path is a DIRECTORY: a path that exists as a
// regular file means the unit directory does not exist, so the box is
// not-applicable — the shim's `[ -d ]` semantics (F5, review cycle 2; SPEC
// box2 row + ED-52-2).
function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

// bun-else-node per the repository runtime convention.
function resolveRuntime() {
  const override = process.env.AGENTIC_WORKFLOW_RUNTIME;
  if (override === "bun" || override === "node") return override;
  if ((process.env.npm_config_user_agent ?? "").startsWith("bun/")) return "bun";
  return spawnSync("bun", ["--version"], { stdio: "ignore" }).status === 0 ? "bun" : "node";
}

function main(argv) {
  let finished = false;
  const rest = [...argv];
  while (rest.length > 0) {
    const arg = rest.shift();
    if (arg === "--finished") finished = true;
    else if (arg === "--help") {
      process.stdout.write(USAGE);
      return 0;
    } else {
      process.stderr.write(`turn-contract: unknown argument: ${arg}\n`);
      process.stderr.write(USAGE);
      return 2;
    }
  }

  const fail = (box, code) => {
    process.stdout.write(`TURN-CONTRACT fail box${box}: ${code}\n`);
    return 1;
  };

  // box1 — inside a git repository, and not on its default branch.
  const top = git(process.cwd(), ["rev-parse", "--show-toplevel"]);
  if (!top.ok || top.out === "") return fail(1, "not-a-repo");
  const root = top.out;

  // Default branch chain: origin/HEAD, else local main, else local master.
  let defaultRef = "";
  const originHead = git(root, ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"]);
  if (originHead.ok && originHead.out !== "") defaultRef = originHead.out;
  else if (git(root, ["show-ref", "--verify", "--quiet", "refs/heads/main"]).ok) defaultRef = "main";
  else if (git(root, ["show-ref", "--verify", "--quiet", "refs/heads/master"]).ok) defaultRef = "master";
  const defaultBranch = defaultRef.replace(/^origin\//, "");

  const current = git(root, ["branch", "--show-current"]);
  const currentBranch = current.ok ? current.out : "";
  if (defaultBranch !== "" && currentBranch === defaultBranch) return fail(1, "branch-default");

  // box2 — frozen acceptance at HEAD for a unit-shaped branch; when the
  // project ships scripts/phase-lint.mjs and the unit has a TASKS.md, phase
  // lint must be green (engine-only clause — the shim runs no other runtime).
  let unitDir = "";
  if (currentBranch.startsWith("feat/")) unitDir = `docs/features/${currentBranch.slice("feat/".length)}`;
  else if (currentBranch.startsWith("fix/")) unitDir = `docs/fix/${currentBranch.slice("fix/".length)}`;
  if (unitDir !== "" && isDir(path.join(root, unitDir))) {
    if (!git(root, ["cat-file", "-e", `HEAD:${unitDir}/ACCEPTANCE.md`]).ok) return fail(2, "acceptance-missing");
    const lint = path.join(root, "scripts", "phase-lint.mjs");
    const tasks = path.join(root, unitDir, "TASKS.md");
    if (existsSync(lint) && existsSync(tasks)) {
      const r = spawnSync(resolveRuntime(), ["scripts/phase-lint.mjs", `${unitDir}/TASKS.md`], {
        cwd: root,
        stdio: ["ignore", "ignore", "ignore"],
      });
      if (r.status !== 0) return fail(2, "phase-lint-failed");
    }
  }

  // box3 — at least one commit on this branch that is not on the default.
  const ownCommits = defaultRef !== "" ? count(root, `${defaultRef}..HEAD`) : count(root, "HEAD");
  if (ownCommits === null || ownCommits < 1) return fail(3, "no-commits");

  // box4 — only with --finished: an upstream and an open PR whose head is HEAD.
  if (finished) {
    const upstream = git(root, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]);
    if (!upstream.ok || upstream.out === "") return fail(4, "pr-not-open");
    const head = git(root, ["rev-parse", "HEAD"]);
    const localHead = head.ok ? head.out : "";
    // This branch's own pull requests, scoped by --head: `gh pr view <arg>`
    // reads an all-numeric argument as a PR *number*, so a branch named e.g.
    // `123` would have box4 judge an unrelated PR (F11, fold cycle 3). The list
    // query also answers "is there a PR at all?" with exit 0 plus an empty
    // result, which is what separates a missing PR (pr-not-open) from a gh
    // failure (pr-unreachable) — `gh pr view` exits nonzero for both, so the
    // SPEC's "no PR → pr-not-open" clause was unimplementable (F9).
    const gh = spawnSync(
      "gh",
      ["pr", "list", "--head", currentBranch, "--state", "open", "--json", "state,headRefOid"],
      { cwd: root, encoding: "utf8" },
    );
    if (gh.status !== 0) return fail(4, "pr-unreachable");
    let parsed;
    try {
      parsed = JSON.parse(gh.stdout);
    } catch {
      parsed = null;
    }
    const prs = Array.isArray(parsed) ? parsed : [];
    const pr = prs.find((entry) => entry?.state === "OPEN");
    if (pr === undefined) return fail(4, "pr-not-open");
    if (pr.headRefOid !== localHead) return fail(4, "pr-head-mismatch");
  }

  // box5 — clean tree, then not ahead of the configured upstream. A status
  // query that cannot be answered (error, or output past the buffer cap) is
  // never proof of a clean tree: it fails closed as dirty-tree.
  // `--untracked-files=all` overrides a repo-local status.showUntrackedFiles=no,
  // which would otherwise hide an untracked file and win a false ok (F8).
  const status = git(root, ["status", "--porcelain", "--untracked-files=all"]);
  if (!status.ok || status.out !== "") return fail(5, "dirty-tree");
  const upstream = git(root, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]);
  if (upstream.ok && upstream.out !== "") {
    const ahead = count(root, `${upstream.out}..HEAD`);
    if (ahead === null || ahead !== 0) return fail(5, "ahead-of-remote");
  }

  process.stdout.write("TURN-CONTRACT ok\n");
  return 0;
}

process.exitCode = main(process.argv.slice(2));
