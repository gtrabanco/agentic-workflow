/**
 * pr.mjs — ceremony `pr` module (issue #352 P4): the pull request as a checked
 * surface, backed by `gh` with a *declared* degradation.
 *
 * `gh` is the only external dependency in the whole runner, so its absence is a
 * first-class answer, never a stack trace and never an invented API call:
 *
 *   - `gh-missing`       the binary is not on PATH            → ceremonial block, exit 2
 *   - `gh-unauthenticated` `gh auth status` refuses           → ceremonial block, exit 2
 *   - `gh-error`         any other non-zero gh run            → usage error, exit 1
 *
 * Every operation prints the same JSON envelope as the rest of the CLI; the
 * block carries `degraded: "gh-…"` so a caller can tell "the forge said no" from
 * "the forge is not here".
 *
 * Exit contract (unchanged from #338): 0 success, 1 usage error, 2 ceremonial
 * block. JSON on stdout, always.
 */

import { execFileSync } from "node:child_process";
import { out, fail, block, onlyFlags, parseFlags, git } from "../lib.mjs";

/** The degradation contract's closed codes. */
export const GH_DEGRADATIONS = Object.freeze(["gh-missing", "gh-unauthenticated", "gh-error"]);

/** Run one `gh` command; every failure path is one of the declared degradations. */
function gh(args) {
  try {
    return { ok: true, stdout: execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 }).trim() };
  } catch (error) {
    if (error.code === "ENOENT") block({ check: "gh-missing", degraded: "gh-missing", args, note: "install the GitHub CLI and authenticate it, or run the equivalent forge command by hand" });
    const stderr = String(error.stderr ?? error.message ?? "").trim();
    if (/auth|login|not logged in|GH_TOKEN/iu.test(stderr)) block({ check: "gh-unauthenticated", degraded: "gh-unauthenticated", args, detail: stderr.split("\n")[0] });
    fail("gh-error", { args: args.join(" "), exit: error.status ?? 1, detail: stderr.split("\n")[0] ?? "" });
  }
}

/** `gh ... --json a,b` parsed, or the same degradation contract. */
function ghJson(args) {
  const result = gh(args);
  try {
    return JSON.parse(result.stdout);
  } catch {
    fail("gh-error", { args: args.join(" "), detail: "gh answered non-JSON" });
  }
}

const prOf = (number) => Number(number);

export function pr(op, argv) {
  switch (op) {
    case "create": {
      const flags = parseFlags(argv, ["base", "title", "body"], ["base", "title", "body"]);
      onlyFlags(flags, ["base", "title", "body"]);
      const branch = git(["branch", "--show-current"]);
      if (branch === "") block({ check: "detached-head", note: "a pull request needs a branch" });
      const url = gh(["pr", "create", "--base", String(flags.base), "--head", branch, "--title", String(flags.title), "--body", String(flags.body)]).stdout;
      const number = /\/pull\/(\d+)/u.exec(url)?.[1];
      out({ created: true, "pr-number": number === undefined ? null : Number(number), url, branch, sha: git(["rev-parse", "HEAD"]) });
    }
    case "comment": {
      const flags = parseFlags(argv, ["body", "marker"], ["body", "marker"]);
      onlyFlags(flags, ["body", "marker"]);
      const number = prOf(flags._[0] ?? "");
      if (!Number.isInteger(number) || number < 1) fail("usage", { usage: "ceremony pr comment <N> --body <text> --marker <marker>" });
      gh(["pr", "comment", String(number), "--body", `${flags.marker}\n\n${flags.body}`]);
      const view = ghJson(["pr", "view", String(number), "--json", "comments"]);
      const posted = (view.comments ?? []).find((comment) => String(comment.body ?? "").includes(String(flags.marker)));
      out({ "comment-id": posted?.id ?? posted?.url ?? null, posted: posted !== undefined, "pr-number": number });
    }
    case "verify-receipt": {
      const flags = parseFlags(argv, ["head"], ["head"]);
      onlyFlags(flags, ["head"]);
      const number = prOf(flags._[0] ?? "");
      if (!Number.isInteger(number) || number < 1) fail("usage", { usage: "ceremony pr verify-receipt <N> --head <sha>" });
      const view = ghJson(["pr", "view", String(number), "--json", "body,comments,headRefOid"]);
      const haystack = [view.body ?? "", ...(view.comments ?? []).map((comment) => comment.body ?? "")].join("\n");
      const short = String(flags.head).slice(0, 12);
      const namesHead = haystack.includes(`HEAD ${short}`) || haystack.includes(`HEAD ${flags.head}`);
      const verdict = /verdict:\s*(PASS|FAIL|MERGE-READY|NEEDS-DECISION)/iu.exec(haystack)?.[1] ?? null;
      out({ verified: namesHead && verdict !== null, receipt: { namesHead, verdict, "pr-head": view.headRefOid ?? null }, "pr-number": number });
    }
    case "verify-hygiene": {
      const flags = parseFlags(argv, [], []);
      onlyFlags(flags, []);
      const number = prOf(flags._[0] ?? "");
      if (!Number.isInteger(number) || number < 1) fail("usage", { usage: "ceremony pr verify-hygiene <N>" });
      const view = ghJson(["pr", "view", String(number), "--json", "isDraft,mergeable,reviews,statusCheckRollup"]);
      const checks = view.statusCheckRollup ?? [];
      const ci = checks.length === 0 ? null : checks.every((check) => check.conclusion === "SUCCESS" || check.state === "SUCCESS");
      out({ "pr-number": number, hygiene: { draft: Boolean(view.isDraft), mergeable: view.mergeable ?? "UNKNOWN", reviews: (view.reviews ?? []).length, ci } });
    }
    case "read-diff": {
      const flags = parseFlags(argv, [], []);
      onlyFlags(flags, []);
      const number = prOf(flags._[0] ?? "");
      if (!Number.isInteger(number) || number < 1) fail("usage", { usage: "ceremony pr read-diff <N>" });
      const patch = gh(["pr", "diff", String(number), "--patch"]).stdout;
      const lines = patch.split("\n");
      const files = lines.filter((line) => line.startsWith("diff --git ")).length;
      const additions = lines.filter((line) => line.startsWith("+") && !line.startsWith("+++")).length;
      const deletions = lines.filter((line) => line.startsWith("-") && !line.startsWith("---")).length;
      out({ "pr-number": number, files, "lines-added": additions, "lines-deleted": deletions });
    }
    case "read-commits": {
      const flags = parseFlags(argv, [], []);
      onlyFlags(flags, []);
      const number = prOf(flags._[0] ?? "");
      if (!Number.isInteger(number) || number < 1) fail("usage", { usage: "ceremony pr read-commits <N>" });
      const view = ghJson(["pr", "view", String(number), "--json", "commits"]);
      out({ "pr-number": number, commits: (view.commits ?? []).map((commit) => ({ sha: commit.oid, message: commit.messageHeadline })) });
    }
    default:
      fail("unknown-op", { object: "pr", op, ops: ["create", "comment", "verify-receipt", "verify-hygiene", "read-diff", "read-commits"] });
  }
}
