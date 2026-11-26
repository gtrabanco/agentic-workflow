/**
 * turn-contract.mjs — the canonical turn contract's mechanical verifier
 * (feature 52; the forge-aware box4 is issue #546's, moved here by unit 554).
 *
 * It checks the boxes a model can fake and a machine cannot: an agent inside a git
 * repository off its default branch, a unit document at HEAD for a unit-shaped
 * branch, at least one own commit, and a clean tree not ahead of its upstream.
 * `--finished` adds the box the workflow cares most about — a pushed branch with
 * an open pull request whose head is local HEAD.
 *
 * The forge is a fact about the checked remote, so box4 asks this module's forge
 * layer (`./forge.mjs`) rather than naming `gh`: `--remote` names the remote
 * (default `origin`) and `--forge` forces the forge for a self-hosted instance
 * that its hostname does not reveal. An invalid `--forge` is a usage error (exit
 * 2), never a verdict about the push.
 *
 * The verifier mutates nothing of its own: its reads use `--no-optional-locks`, so
 * not even `.git/index` is rewritten, and its one spawned subprocess is the
 * project's own `scripts/phase-lint.mjs` (box2, engine-only clause).
 *
 * prints: TURN-CONTRACT ok
 *      or TURN-CONTRACT fail box<N>: <code>
 */

import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";

import { detectForge, prLine } from "./forge.mjs";
import { isMachineLedgerExempt } from "./machine-ledger/index.mjs";

const USAGE =
  "usage: turn-contract [--finished|--remote <name>|--forge <name>|--help]\n\n" +
  "  --finished    also check box4 (pushed branch + open pull request whose head is local HEAD)\n" +
  "  --remote <n>  the remote box4 asks the forge about (default origin)\n" +
  "  --forge <n>   force the forge instead of detecting it (github, gitlab, gitea, bitbucket)\n" +
  "  --help        print this usage and exit 0\n";

/** Every git call is lock-free: a read that may opportunistically write —
 *  `git status` refreshing the index — would rewrite `.git/index` and contradict
 *  the read-only claim above (F10, fold cycle 3). */
function git(cwd, args) {
  const result = spawnSync("git", ["--no-optional-locks", ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (result.status !== 0 || result.error !== undefined) return { ok: false, out: "" };
  return { ok: true, out: (result.stdout ?? "").trimEnd() };
}

function count(cwd, range) {
  const result = git(cwd, ["rev-list", "--count", range]);
  const value = result.ok ? Number.parseInt(result.out, 10) : Number.NaN;
  return Number.isFinite(value) ? value : null;
}

/** box2 applies only when the unit path is a DIRECTORY: a path that exists as a
 *  regular file means the unit directory does not exist, so the box is
 *  not-applicable — the shim's `[ -d ]` semantics (F5, review cycle 2). */
function isDir(target) {
  try {
    return statSync(target).isDirectory();
  } catch {
    return false;
  }
}

/** bun-else-node per the repository runtime convention. */
function resolveRuntime() {
  const override = process.env.AGENTIC_WORKFLOW_RUNTIME;
  if (override === "bun" || override === "node") return override;
  if ((process.env.npm_config_user_agent ?? "").startsWith("bun/")) return "bun";
  return spawnSync("bun", ["--version"], { stdio: "ignore" }).status === 0 ? "bun" : "node";
}

/**
 * `main(argv)` — the receipt and the exit code. `options.prLine` is injectable so a
 * suite can prove box4's four answers without a forge.
 */
export function main(argv, options = {}) {
  const { write = (text) => process.stdout.write(text), env = process.env, forgePrLine = prLine } = options;
  let finished = false;
  let remote = "origin";
  let forgeOverride = "";
  const rest = [...argv];
  while (rest.length > 0) {
    const arg = rest.shift();
    if (arg === "--finished") finished = true;
    else if (arg === "--help") {
      write(USAGE);
      return 0;
    } else if (arg === "--remote" || arg === "--forge") {
      const value = rest.shift();
      if (value === undefined) {
        process.stderr.write(`turn-contract: ${arg} needs a value\n`);
        process.stderr.write(USAGE);
        return 2;
      }
      if (arg === "--remote") remote = value;
      else forgeOverride = value;
    } else {
      process.stderr.write(`turn-contract: unknown argument: ${arg}\n`);
      process.stderr.write(USAGE);
      return 2;
    }
  }

  const fail = (box, code) => {
    write(`TURN-CONTRACT fail box${box}: ${code}\n`);
    return 1;
  };

  // box1 — inside a git repository, and not on its default branch.
  const top = git(process.cwd(), ["rev-parse", "--show-toplevel"]);
  if (!top.ok || top.out === "") return fail(1, "not-a-repo");
  const root = top.out;

  // Default branch chain: the *checked* remote's HEAD, else local main, else local
  // master. The remote is a parameter, never a literal: a fork's own default branch
  // is not origin's (issue #546).
  let defaultRef = "";
  const remoteHead = git(root, ["symbolic-ref", "--quiet", "--short", `refs/remotes/${remote}/HEAD`]);
  if (remoteHead.ok && remoteHead.out !== "") defaultRef = remoteHead.out;
  else if (git(root, ["show-ref", "--verify", "--quiet", "refs/heads/main"]).ok) defaultRef = "main";
  else if (git(root, ["show-ref", "--verify", "--quiet", "refs/heads/master"]).ok) defaultRef = "master";
  const defaultBranch = defaultRef.startsWith(`${remote}/`) ? defaultRef.slice(remote.length + 1) : defaultRef;

  const current = git(root, ["branch", "--show-current"]);
  const currentBranch = current.ok ? current.out : "";
  if (defaultBranch !== "" && currentBranch === defaultBranch) return fail(1, "branch-default");

  // box2 — the unit document at HEAD for a unit-shaped branch; when the project
  // ships scripts/phase-lint.mjs and the unit carries a TASKS.md, phase lint must
  // be green (engine-only clause — the shim runs no other runtime).
  let unitDir = "";
  if (currentBranch.startsWith("feat/")) unitDir = `docs/features/${currentBranch.slice("feat/".length)}`;
  else if (currentBranch.startsWith("fix/")) unitDir = `docs/fix/${currentBranch.slice("fix/".length)}`;
  if (unitDir !== "" && isDir(`${root}/${unitDir}`)) {
    // Feature 61: the unit document is the frozen surface (ACCEPTANCE.md is retired).
    if (!git(root, ["cat-file", "-e", `HEAD:${unitDir}/SPEC.md`]).ok) return fail(2, "unit-doc-missing");
    const lint = `${root}/scripts/phase-lint.mjs`;
    const tasks = `${root}/${unitDir}/TASKS.md`;
    if (existsSync(lint) && existsSync(tasks)) {
      const linted = spawnSync(resolveRuntime(), ["scripts/phase-lint.mjs", `${unitDir}/TASKS.md`], {
        cwd: root,
        stdio: ["ignore", "ignore", "ignore"],
      });
      if (linted.status !== 0) return fail(2, "phase-lint-failed");
    }
  }

  // box3 — at least one commit on this branch that is not on the default.
  const ownCommits = defaultRef !== "" ? count(root, `${defaultRef}..HEAD`) : count(root, "HEAD");
  if (ownCommits === null || ownCommits < 1) return fail(3, "no-commits");

  // box4 — only with --finished: an upstream and an open pull request whose head is HEAD.
  if (finished) {
    const upstream = git(root, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]);
    if (!upstream.ok || upstream.out === "") return fail(4, "pr-not-open");
    const head = git(root, ["rev-parse", "HEAD"]);
    const localHead = head.ok ? head.out : "";
    // The forge is decided once, from the checked remote: an unreadable remote is
    // `pr-unreachable`, and an invalid `--forge` is a usage error, not a verdict.
    const remoteUrl = git(root, ["remote", "get-url", remote]);
    const detected = remoteUrl.ok && remoteUrl.out !== "" ? detectForge(remoteUrl.out, forgeOverride, env) : null;
    if (detected === null) return fail(4, "pr-unreachable");
    if (!detected.ok) {
      process.stderr.write(`${detected.message}\n`);
      process.stderr.write(USAGE);
      return 2;
    }
    // This branch's own pull request, scoped by the branch name: a forge that reads
    // an all-numeric argument as a PR *number* would judge an unrelated PR (F11).
    // The list query also answers "is there a PR at all?" with an empty result,
    // which is what separates a missing PR from an unaskable forge (F9).
    const found = forgePrLine(detected.forge, currentBranch, { env });
    if (!found.ok) {
      // The refusal is never silent: the forge layer names the forge that could
      // not be asked and both overrides, which is the operator's repair.
      if (typeof found.message === "string" && found.message !== "") process.stderr.write(`${found.message}\n`);
      return fail(4, "pr-unreachable");
    }
    if (found.line === null || found.line === "") return fail(4, "pr-not-open");
    const [state, prHead] = found.line.split(" ");
    if (!["open", "opened", "draft"].includes(String(state).toLowerCase())) return fail(4, "pr-not-open");
    if (prHead !== localHead) return fail(4, "pr-head-mismatch");
  }

  // box5 — clean tree, then not ahead of the configured upstream. A status query
  // that cannot be answered is never proof of a clean tree: it fails closed as
  // dirty-tree. `--untracked-files=all` overrides a repo-local
  // status.showUntrackedFiles=no, which would otherwise hide an untracked file (F8).
  //
  // Issue #727 S1d: the machine-owned ledger class is exempt. Its writer is
  // machinery — the telemetry sink, the journal aggregator, the annotators — so
  // its pending row lands after the session's last chance to commit it, and
  // refusing every review over a row no session can commit is the defect. The
  // exemption set is the class's own declaration, never a pattern invented here;
  // a human-uncommitted file still fails, and `ahead-of-remote` below is
  // untouched, so an exempt row can never excuse an unpublished commit.
  const status = git(root, ["status", "--porcelain", "--untracked-files=all"]);
  if (!status.ok) return fail(5, "dirty-tree");
  const foreign = status.out
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const raw = line.slice(3).trim();
      const target = raw.includes(" -> ") ? raw.split(" -> ")[1] : raw;
      return target.replace(/^"|"$/gu, "");
    })
    .filter((file) => !isMachineLedgerExempt(file));
  if (foreign.length > 0) return fail(5, "dirty-tree");
  const upstreamAgain = git(root, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]);
  if (upstreamAgain.ok && upstreamAgain.out !== "") {
    const ahead = count(root, `${upstreamAgain.out}..HEAD`);
    if (ahead === null || ahead !== 0) return fail(5, "ahead-of-remote");
  }

  write("TURN-CONTRACT ok\n");
  return 0;
}
