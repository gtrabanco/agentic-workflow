/**
 * fullauto-merge.mjs — the automated merge wrapper, forge-agnostic since #546 and
 * one implementation since unit 554.
 *
 * The former `ship-roadmap --fullauto` was the sole automated merge authority and
 * asked for this wrapper only after a fresh, SHA-bound audit. The preconditions are
 * unchanged and none of them is a forge fact: a clean, synchronized tree; a
 * PR/MR whose base is the forge's default branch and whose head is the audited
 * SHA; a green check rollup (or a fresh local gate for that same SHA); a
 * `<!-- audit-pr:merge-ready sha=… -->` comment; `merge: fullauto` in the head's
 * own `docs/features/SHIP_DECISIONS.md`. What is *asked* is resolved from the
 * remote by `./forge.mjs` (`gh`, `glab`, `gt`; a Bitbucket remote is refused with
 * the message naming its absent CLI), so the wrapper is not GitHub-only.
 *
 * The decision file is read from the checkout at the audited SHA (`git show`), not
 * from the forge's contents API: the bytes that authorize the merge are then the
 * bytes of the commit being merged, and a forge that exposes no contents API needs
 * no special case.
 *
 * The wrapper writes one transient marker under the git common directory and
 * removes it on every exit, and posts an idempotent audit comment on the merged
 * PR/MR. It never creates a persistent `.automerge` permission. It needs no `jq`:
 * the documents the forge CLIs return are parsed here (unit 554 retired that
 * precondition with the shell's pipeline).
 *
 * usage: fullauto-merge --pr <number> --run-id <id>
 *                       [--method merge|squash|rebase] [--remote <name>] [--forge <name>]
 * exit: 0 merged (or already merged, comment reconciled) · 1 refused · 2 usage
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { comment, defaultBase, detectForge, forgeCli, mergePr, prJson, prNotes, requireForgeCli } from "./forge.mjs";

const USAGE =
  "usage: fullauto-merge --pr <number> --run-id <id> [--method merge|squash|rebase] [--remote <name>] [--forge <name>]\n";

const DECISION_FILE = "docs/features/SHIP_DECISIONS.md";
const MERGE_METHODS = Object.freeze(["merge", "squash", "rebase"]);

function run(binary, args, { cwd, env }) {
  const result = spawnSync(binary, args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0 || result.error !== undefined) {
    return { ok: false, out: "", err: String(result.stderr ?? result.error?.message ?? "") };
  }
  return { ok: true, out: result.stdout ?? "", err: result.stderr ?? "" };
}

/** `main(argv)` — the wrapper's receipt and exit code. */
export function main(argv, options = {}) {
  const { env = process.env, cwd = process.cwd() } = options;
  const stdout = options.stdout ?? ((text) => process.stdout.write(text));
  const stderr = options.stderr ?? ((text) => process.stderr.write(text));

  let pr = "";
  let runId = "";
  let method = "merge";
  let remote = "origin";
  let forgeOverride = "";
  const rest = [...argv];
  while (rest.length > 0) {
    const arg = rest.shift();
    if (arg === "--help") {
      stdout(USAGE);
      return 0;
    }
    if (!["--pr", "--run-id", "--method", "--remote", "--forge"].includes(arg)) {
      stderr(`fullauto-merge: unknown argument: ${arg}\n`);
      return 2;
    }
    const value = rest.shift();
    if (value === undefined) {
      fail(stderr, `${arg} requires a value`);
      return 1;
    }
    if (arg === "--pr") pr = value;
    else if (arg === "--run-id") runId = value;
    else if (arg === "--method") method = value;
    else if (arg === "--remote") remote = value;
    else forgeOverride = value;
  }

  if (pr === "" || runId === "") {
    fail(stderr, "--pr and --run-id are required");
    return 1;
  }
  if (!/^[0-9]+$/u.test(pr)) {
    fail(stderr, "PR must be numeric");
    return 1;
  }
  if (!/^[A-Za-z0-9._-]+$/u.test(runId)) {
    fail(stderr, "run id is invalid");
    return 1;
  }
  if (!MERGE_METHODS.includes(method)) {
    fail(stderr, "method must be merge, squash, or rebase");
    return 1;
  }

  const git = (args) => run("git", args, { cwd, env });

  // The forge is a fact about the remote being merged into.
  const remoteUrl = git(["remote", "get-url", remote]);
  if (!remoteUrl.ok) {
    fail(stderr, `the remote "${remote}" is not a remote of this repository`);
    return 1;
  }
  const detected = detectForge(remoteUrl.out.trim(), forgeOverride, env);
  if (!detected.ok) {
    // An invalid --forge is a usage error, not a verdict about the merge.
    stderr(`${detected.message}\n`);
    stderr(USAGE);
    return 2;
  }
  const forge = detected.forge;
  const carrier = forgeCli(forge);
  if (!carrier.ok) {
    fail(stderr, `the ${forge} forge has no CLI carrier`);
    return 1;
  }
  const required = requireForgeCli(forge, { env });
  if (!required.ok) {
    fail(stderr, required.message.replace(/^agentic-workflow: /u, ""));
    return 1;
  }

  const status = git(["status", "--porcelain"]);
  if (!status.ok || status.out.trim() !== "") {
    fail(stderr, "working tree is not clean");
    return 1;
  }
  const upstream = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]);
  if (!upstream.ok || upstream.out.trim() === "") {
    fail(stderr, "current branch has no upstream");
    return 1;
  }
  git(["fetch", "--quiet"]);
  const sync = git(["rev-list", "--left-right", "--count", `${upstream.out.trim()}...HEAD`]);
  if (!sync.ok || sync.out.trim().replace(/\s+/gu, " ") !== "0 0") {
    fail(stderr, "branch is not synchronized with its remote");
    return 1;
  }

  const viewed = prJson(forge, pr, { env, cwd });
  if (!viewed.ok) {
    fail(stderr, `the ${forge} forge could not answer for PR ${pr}`);
    return 1;
  }
  const notes = prNotes(forge, pr, remoteUrl.out.trim(), { env, cwd });
  if (!notes.ok) {
    fail(stderr, `the ${forge} forge could not answer for the comments of PR ${pr}`);
    return 1;
  }
  const document = viewed.document;
  document.comments = [...(document.comments ?? []), ...notes.notes];

  const headSha = document.headRefOid;
  const remoteBase = document.baseRefName;
  const remoteState = document.state;
  const prUrl = document.url;
  const base = defaultBase(forge, { env, cwd });
  if (!base.ok) {
    fail(stderr, `the ${forge} forge could not name its default branch`);
    return 1;
  }
  if (typeof headSha !== "string" || headSha === "") {
    fail(stderr, "PR head is unavailable");
    return 1;
  }
  if (remoteBase !== base.branch) {
    fail(stderr, "PR base is not the forge default branch");
    return 1;
  }

  const auditMarker = `<!-- audit-pr:merge-ready sha=${headSha} -->`;
  const marker = `<!-- agentic-workflow:automerge head=${headSha} -->`;
  const hasMarker = (bodies, needle) => bodies.some((body) => typeof body === "string" && body.includes(needle));
  const commentBodies = (entry) => (entry.comments ?? []).map((note) => note?.body ?? "");

  if (!hasMarker(commentBodies(document), auditMarker)) {
    fail(stderr, "fresh SHA-bound audit MERGE-READY evidence is unavailable");
    return 1;
  }

  if (!git(["rev-parse", "--verify", "--quiet", `${headSha}^{commit}`]).ok) {
    fail(stderr, `the audited SHA ${headSha} is not in this checkout`);
    return 1;
  }
  const decision = git(["show", `${headSha}:${DECISION_FILE}`]);
  if (!decision.ok) {
    fail(stderr, `the audited SHA has no ${DECISION_FILE}`);
    return 1;
  }
  if (!decision.out.split(/\r?\n/u).some((line) => /^merge:\s*fullauto\s*$/iu.test(line))) {
    fail(stderr, "PR head does not authorize merge: fullauto");
    return 1;
  }

  const postComment = (mergeSha) => {
    const body = [
      marker,
      "## agentic-workflow: auto-merged",
      "",
      "- **Mode:** `the former ship-roadmap --fullauto (retired, feature 61)`",
      `- **Run:** \`${runId}\``,
      `- **Forge:** \`${forge}\``,
      `- **Audited head:** \`${headSha}\``,
      `- **Merge commit:** \`${mergeSha}\``,
      "- **Audit trail:** this comment is the durable automerge log; direct merge commands remained blocked.",
      "",
    ].join("\n");
    const posted = comment(forge, pr, body, { env, cwd });
    if (!posted.ok) fail(stderr, posted.message.replace(/^agentic-workflow: /u, ""));
    return posted.ok;
  };

  if (remoteState === "MERGED") {
    // An idempotent retry: reconcile the trail, never duplicate it.
    if (!hasMarker(commentBodies(document), marker)) {
      const merged = prJson(forge, pr, { env, cwd });
      const mergeSha = merged.ok ? (merged.document.mergeCommit?.oid ?? "") : "";
      if (!postComment(mergeSha)) return 1;
    }
    stdout(`MERGED ${prUrl} @ ${headSha} (already merged; comment reconciled)\n`);
    return 0;
  }

  if (remoteState !== "OPEN") {
    fail(stderr, "PR is not open");
    return 1;
  }
  if (document.mergeable === "CONFLICTING") {
    fail(stderr, "PR is conflicting");
    return 1;
  }

  const checks = document.statusCheckRollup ?? [];
  if (checks.length === 0) {
    if (env.AGENTIC_WORKFLOW_LOCAL_GATE_SHA !== headSha) {
      fail(stderr, "no CI checks and no fresh local gate for the audited SHA");
      return 1;
    }
  } else {
    const green = checks.every((check) => {
      const result = String(check?.conclusion ?? check?.state ?? "").toUpperCase();
      return ["SUCCESS", "NEUTRAL", "SKIPPED"].includes(result);
    });
    if (!green) {
      fail(stderr, "CI is not green on the audited SHA");
      return 1;
    }
  }

  // The transient attempt marker: under the git common directory, removed on every
  // exit, and never a persistent permission.
  const common = git(["rev-parse", "--git-common-dir"]);
  if (!common.ok) {
    fail(stderr, "the git common directory cannot be resolved");
    return 1;
  }
  const commonDir = common.out.trim().startsWith("/") ? common.out.trim() : path.resolve(cwd, common.out.trim());
  const markerDir = path.join(commonDir, "agentic-workflow");
  const attemptMarker = path.join(markerDir, `automerge-${runId}`);
  mkdirSync(markerDir, { recursive: true, mode: 0o700 });
  writeFileSync(attemptMarker, `run=${runId}\npr=${pr}\nhead=${headSha}\nforge=${forge}\n`, { mode: 0o600 });

  try {
    const merged = mergePr(forge, pr, method, headSha, { env, cwd });
    if (!merged.ok) {
      fail(stderr, `the ${forge} forge refused the merge`);
      return 1;
    }

    const reread = prJson(forge, pr, { env, cwd });
    if (!reread.ok || reread.document.state !== "MERGED") {
      fail(stderr, "forge did not report the PR as merged");
      return 1;
    }
    // A forge whose CLI cannot pin the head at merge time is verified here instead:
    // the merged PR must still be the one that was audited.
    if (reread.document.headRefOid !== headSha) {
      fail(stderr, "the forge merged a different head than the audited one");
      return 1;
    }
    const mergeSha = reread.document.mergeCommit?.oid ?? "";
    if (!hasMarker(commentBodies(reread.document), marker)) {
      if (!postComment(mergeSha)) return 1;
    }
    stdout(`MERGED ${prUrl} @ ${mergeSha}\n`);
    return 0;
  } finally {
    rmSync(attemptMarker, { force: true });
  }
}

function fail(stderr, message) {
  stderr(`fullauto-merge: ${message}\n`);
}
