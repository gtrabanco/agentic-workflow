/**
 * commit.mjs — ceremony `commit` module (issue #352 P4): the conventional commit
 * as a checked operation.
 *
 * `verify-format` is the rule; `create` refuses to write a commit the rule would
 * reject, so a subject is judged before it lands rather than in review. `delete`
 * reverts — the history stays append-only, and the replacement commit is the one
 * a reader follows.
 *
 * Exit contract (unchanged from #338): 0 success, 1 usage error, 2 ceremonial
 * block. JSON on stdout, always.
 */

import { out, fail, block, onlyFlags, parseFlags, resolveUnit, git, gitOrFail } from "../lib.mjs";

/** The conventional-commit grammar: `type(scope)!: summary`. */
export const CONVENTIONAL = /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?: (?<summary>\S.*)$/u;
/** The published type set. */
export const COMMIT_TYPES = Object.freeze(["build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test"]);

/** Parse one subject, or null when it is not conventional. */
export function verifyFormat(message) {
  const subject = String(message).split("\n")[0].trim();
  const match = CONVENTIONAL.exec(subject);
  if (match === null) return { valid: false, type: null, scope: null, summary: null, reason: "not-conventional" };
  if (!COMMIT_TYPES.includes(match.groups.type)) {
    return { valid: false, type: match.groups.type, scope: match.groups.scope ?? null, summary: match.groups.summary, reason: "unknown-type" };
  }
  return { valid: true, type: match.groups.type, scope: match.groups.scope ?? null, summary: match.groups.summary, breaking: match.groups.bang === "!" };
}

export function commit(op, argv) {
  switch (op) {
    case "verify-format": {
      const flags = parseFlags(argv, [], []);
      onlyFlags(flags, []);
      const message = flags._[0];
      if (message === undefined) fail("usage", { usage: "ceremony commit verify-format <message>" });
      const verdict = verifyFormat(message);
      // `out()` exits 0 by design; this operation's answer IS its exit code, so
      // it writes the same JSON and sets the code the answer carries.
      process.stdout.write(`${JSON.stringify(verdict, null, 2)}\n`);
      process.exitCode = verdict.valid ? 0 : 1;
      break;
    }
    case "create": {
      const flags = parseFlags(argv, ["slug", "message", "files"], ["slug", "message", "files"]);
      onlyFlags(flags, ["message", "files"]);
      resolveUnit(flags.slug);
      const verdict = verifyFormat(flags.message);
      if (!verdict.valid) block({ check: "commit-format", message: flags.message, reason: verdict.reason });
      const files = String(flags.files).split(",").map((file) => file.trim()).filter(Boolean);
      if (files.length === 0) fail("missing-flag", { flag: "--files" });
      gitOrFail(["add", "--", ...files]);
      gitOrFail(["commit", "-m", String(flags.message)]);
      out({ created: true, sha: git(["rev-parse", "HEAD"]), message: flags.message, "message-verified": true, files });
    }
    case "delete": {
      const flags = parseFlags(argv, ["slug", "sha"], ["slug", "sha"]);
      onlyFlags(flags, ["sha"]);
      resolveUnit(flags.slug);
      gitOrFail(["revert", "--no-edit", String(flags.sha)]);
      out({ deleted: true, sha: flags.sha, "replacement-sha": git(["rev-parse", "HEAD"]) });
    }
    case "list": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      const rows = gitOrFail(["log", "--format=%h\t%ad\t%s", "--date=short", "--", unit.dir])
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [sha, date, ...rest] = line.split("\t");
          return { sha, date, message: rest.join("\t") };
        });
      out({ slug: flags.slug, commits: rows, count: rows.length });
    }
    default:
      fail("unknown-op", { object: "commit", op, ops: ["create", "verify-format", "delete", "list"] });
  }
}
