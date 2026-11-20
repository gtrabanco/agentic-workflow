/**
 * command.mjs — the command guard's decision (unit 554).
 *
 * `guard-command.sh` held this rule in shell: a per-project literal allowlist, the
 * merge families of every forge the workflow can drive, environment disclosure,
 * and `.env` reads. It moved here so the platform adapters delegate to one
 * implementation instead of sourcing a second one, and so a project that installs
 * the scaffold carries a shim rather than the rule.
 *
 * The rules are translated one for one from that script's `grep -Eqi` patterns.
 * Two details are deliberate and load-bearing:
 *
 * - matching is **case-insensitive** and **line-oriented** (`im`), because the
 *   shell fed the command through `grep` one line at a time — a merge on the
 *   second line of a multi-line command blocked before and must block here;
 * - the allowlist is compared against the **whole** command line, literally, so
 *   an approved entry can never widen into a prefix (`… && cat .env` riding
 *   along) or into another PR number.
 *
 * The guard is not a sandbox: variable indirection (`cmd=gh; $cmd pr merge`) is
 * out of scope by design, and the forge's branch rules plus CI are the
 * enforcement boundary.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { normalizeHookPayload } from "./payload.mjs";

const POLICY_PREFIX = "Blocked by agentic-workflow safety policy:";

/** The refused sentences, so a caller and a suite cite one string. */
export const DENY = Object.freeze({
  merge: "direct pull-request merge; merge stays owner-only or runs through fullauto-merge and its preconditions",
  mr: "direct merge-request merge; merge stays owner-only or runs through fullauto-merge and its preconditions",
  gitea: "direct pull-request merge through a Gitea CLI; merge stays owner-only or runs through fullauto-merge and its preconditions",
  hub: "direct pull-request merge through hub",
  git: "direct git merge",
  api: "merge through a forge API",
  envDisclosure: "environment-variable disclosure",
  envList: "environment export listing",
  envRead: "reading environment files may disclose secrets",
  invalidPayload: "invalid hook payload",
});

// A word boundary that also refuses an absolute or relative path form
// (`/usr/bin/gh`, `./gh`). `[^[:alnum:]_/-]` in the shell pattern.
const LEAD = String.raw`(?:^|[^A-Za-z0-9_/-])`;
const WORD_END = String.raw`(?:[^A-Za-z0-9_-]|$)`;
const ARG = String.raw`[^\s;&|()]`;
const LEAD_OR_SEPARATOR = String.raw`(?:^|[;&|()\s])`;
const PATH_PREFIX = String.raw`(?:${ARG}*/)?`;

/** `<binary> <word>{0,8} <subcommand…>` — up to eight arguments before the verb. */
function mergePattern(binary, ...words) {
  const between = words.map((word) => `\\s+${word}`).join("");
  return new RegExp(`${LEAD}${PATH_PREFIX}${binary}(?:\\s+${ARG}+){0,8}${between}${WORD_END}`, "imu");
}

const MERGE_RULES = Object.freeze([
  { pattern: mergePattern("gh", "pr", "merge"), reason: DENY.merge },
  { pattern: mergePattern("glab", "mr", "merge"), reason: DENY.mr },
  { pattern: mergePattern("(?:gt|tea)", "pr", "merge"), reason: DENY.gitea },
  { pattern: mergePattern("hub", "merge"), reason: DENY.hub },
  { pattern: mergePattern("git", "merge"), reason: DENY.git },
  {
    pattern: /mergePullRequest|\/pulls\/[0-9]+\/merge|\/merge_requests\/[0-9]+\/merge|\/pullrequests\/[0-9]+\/merge(?:[?\s]|$)/imu,
    reason: DENY.api,
  },
]);

const ENV_RULES = Object.freeze([
  {
    pattern: new RegExp(`${LEAD_OR_SEPARATOR}${PATH_PREFIX}printenv(?:\\s|$)`, "imu"),
    reason: DENY.envDisclosure,
  },
  {
    pattern: new RegExp(`${LEAD_OR_SEPARATOR}${PATH_PREFIX}(?:declare|typeset)\\s+-x(?:\\s|$)`, "imu"),
    reason: DENY.envDisclosure,
  },
  {
    pattern: /(?:^|[;&|()\s])export(?:\s+-p)?\s*(?:$|[;&|)])/imu,
    reason: DENY.envList,
  },
  {
    pattern: new RegExp(`${LEAD_OR_SEPARATOR}${PATH_PREFIX}env(?:\\s+(?:-0|--null))?\\s*(?:$|[;&|)])`, "imu"),
    reason: DENY.envDisclosure,
  },
  {
    pattern: new RegExp(`${LEAD_OR_SEPARATOR}${PATH_PREFIX}env(?:\\s+[A-Za-z_][A-Za-z0-9_]*=[^\\s]+)+\\s*(?:$|[;&|)])`, "imu"),
    reason: DENY.envDisclosure,
  },
  {
    pattern: new RegExp(`${LEAD_OR_SEPARATOR}${PATH_PREFIX}set\\s*(?:$|[;&|)])`, "imu"),
    reason: DENY.envDisclosure,
  },
  {
    pattern: /(?:^|[^A-Za-z0-9_])\.env(?:[A-Za-z0-9_.-]*)(?:[^A-Za-z0-9_]|$)/imu,
    reason: DENY.envRead,
  },
]);

/** The path rule: an environment file, by name or by extension. */
const ENV_PATH = /(?:^|\/)(?:\.env(?:$|\.)|[^/]*\.env(?:$|\.))/imu;

/**
 * `readAllowlist(file)` — the entries of a `guard-allow.txt`, one whole command
 * line each. `#` comments and blank lines are never entries; an absent or
 * unreadable file answers an empty list, which allows nothing.
 */
export function readAllowlist(file) {
  if (typeof file !== "string" || file === "") return [];
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return [];
  }
  const entries = [];
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\r$/u, "");
    if (line.trim() === "") continue;
    if (line.startsWith("#")) continue;
    entries.push(line);
  }
  return entries;
}

/**
 * `decideCommand({command, path}, {allowlist})` — `{allow: true}` or
 * `{allow: false, reason}`. The path rule runs first (a read of an environment
 * file discloses secrets whatever the command says), then the allowlist exempts
 * the merge families only, then the environment rules run regardless — an
 * allowlisted line never widens into them.
 */
export function decideCommand({ command = "", path: filePath = "" } = {}, { allowlist = [] } = {}) {
  if (filePath !== "" && ENV_PATH.test(filePath)) return { allow: false, reason: DENY.envRead };
  if (command === "") return { allow: true };
  const approved = new Set(allowlist);
  if (!approved.has(command)) {
    for (const rule of MERGE_RULES) {
      if (rule.pattern.test(command)) return { allow: false, reason: rule.reason };
    }
  }
  for (const rule of ENV_RULES) {
    if (rule.pattern.test(command)) return { allow: false, reason: rule.reason };
  }
  return { allow: true };
}

/** The project default: the hooks directory, relative to the working tree top. */
export function defaultAllowlist(cwd = process.cwd()) {
  return path.join(cwd, ".agentic-workflow", "hooks", "guard-allow.txt");
}

const USAGE =
  "usage: agentic-workflow guard-command [--command <text>] [--path <text>] [--allowlist <file>]\n" +
  "                                    [--payload] [--format plain|copilot|json] [--help]\n\n" +
  "  --command <text>    the shell command an agent asked to run\n" +
  "  --path <text>       the file a read tool asked for\n" +
  "  --allowlist <file>  the per-project allowlist (default: .agentic-workflow/hooks/guard-allow.txt)\n" +
  "  --payload           read a platform hook payload (JSON) from stdin\n" +
  "  --format plain      the decision as text (default): silent pass, stderr refusal, exit 2\n" +
  "  --format copilot    the decision as Copilot's {continue, stopReason} document, exit 0\n" +
  "  --format json       normalize only: print [command, path], exit 0\n" +
  "  --help              print this usage and exit 0\n";

/**
 * The CLI face. `--format` is the platform seam the adapters name: `plain` is the
 * pre-tool and OpenCode shape, `copilot` is Copilot's document, and `json` is the
 * normalizer an adapter calls when it does its own formatting.
 */
export function main(argv, { stdin = () => readFileSync(0, "utf8"), stdout = (text) => process.stdout.write(text), stderr = (text) => process.stderr.write(text), cwd = process.cwd() } = {}) {
  let command = "";
  let filePath = "";
  let allowlistFile = "";
  let readPayload = false;
  let format = "plain";
  const rest = [...argv];
  while (rest.length > 0) {
    const arg = rest.shift();
    if (arg === "--help") {
      stdout(USAGE);
      return 0;
    }
    if (arg === "--payload") {
      readPayload = true;
      continue;
    }
    if (arg === "--command" || arg === "--path" || arg === "--allowlist" || arg === "--format") {
      const value = rest.shift();
      if (value === undefined) {
        stderr(`agentic-workflow guard: ${arg} needs a value\n`);
        return 2;
      }
      if (arg === "--command") command = value;
      else if (arg === "--path") filePath = value;
      else if (arg === "--allowlist") allowlistFile = value;
      else format = value;
      continue;
    }
    stderr(`agentic-workflow guard: unknown argument: ${arg}\n`);
    return 2;
  }
  if (!["plain", "copilot", "json"].includes(format)) {
    stderr(`agentic-workflow guard: --format must be plain, copilot or json\n`);
    return 2;
  }

  let payloadFault = null;
  if (readPayload) {
    const normalized = normalizeHookPayload(stdin());
    if (normalized.ok) {
      command = normalized.command;
      filePath = normalized.path;
    } else {
      payloadFault = normalized.message;
    }
  }

  const asCopilot = (reason) => {
    stdout(`${JSON.stringify({ continue: false, stopReason: `${POLICY_PREFIX} ${reason}` })}\n`);
    return 0;
  };

  if (format === "json") {
    // The normalization face: an adapter that renders its own document asks this
    // one for the facts and never re-derives them.
    if (payloadFault !== null) {
      stderr(`agentic-workflow guard: ${payloadFault}\n`);
      return 2;
    }
    stdout(`${JSON.stringify([command, filePath])}\n`);
    return 0;
  }

  if (payloadFault !== null) {
    return format === "copilot" ? asCopilot(DENY.invalidPayload) : refuse(stderr, DENY.invalidPayload);
  }

  const allowlist = allowlistFile === "" ? readAllowlist(defaultAllowlist(cwd)) : readAllowlist(allowlistFile);
  const verdict = decideCommand({ command, path: filePath }, { allowlist });
  if (verdict.allow) return 0;
  return format === "copilot" ? asCopilot(verdict.reason) : refuse(stderr, verdict.reason);
}

function refuse(stderr, reason) {
  stderr(`${POLICY_PREFIX} ${reason}\n`);
  return 2;
}
