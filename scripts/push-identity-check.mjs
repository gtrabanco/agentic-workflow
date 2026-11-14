#!/usr/bin/env node
/**
 * push-identity-check.mjs — Layer 2's last resort: refuse to publish a commit
 * whose author or committer is not the project's approved identity (issue #514
 * S4).
 *
 * The pi guard only sees what a model asks bash to run, and a pre-commit hook
 * only sees commits made in this checkout. Two of the three recorded leaks in
 * this repository were produced by processes neither could see: a suite that
 * wrote `t <t@example.test>` into the shared config from a failed fixture
 * resolution, and an agent identity pinned on purpose. The commits that carried
 * them were signed, valid, and invisible to every gate — signature validity
 * says nothing about attribution.
 *
 * So the push range is checked as one fact: every author *and* committer of
 * the never-published commits of `<base>..<head>` must match the approved
 * profile the project declares in the unified config (`gitIdentity` in
 * `.pi/agentic-workflow.json`, project over global). Publication is the last
 * moment this is cheap to stop; after the push the only repair is a history
 * rewrite.
 *
 * What the range *is* respects reachability (issue #539): a commit already
 * reachable from a published ref — the remote mainline, and the pushed branch's
 * own remote tip — cannot be changed by this push, so it is skipped and only the
 * never-published commits are judged. Without that, merging `origin/main` into a
 * branch put main's own history in the range and refused every merge-push. The
 * rule is one module (`published-refs.mjs`), never a copy here.
 *
 * Read-only by construction: it spawns `git rev-list` and `git log`, reads two
 * JSON files, writes nothing, calls no network, and never repairs a value — the
 * repair text it prints is the operator's to run.
 *
 * Usage
 *   bun scripts/push-identity-check.mjs --base <rev> [--head <rev>] [--root <dir>]
 *   (node fallback, same argv)
 *
 * Without `--base` the merge base with the upstream is used; a range that cannot
 * be resolved is a usage error (exit 2) — the caller that has no range must not
 * run the step at all.
 *
 * stdout: `PUSH IDENTITY — ok: <n> commit(s) verified`, `… — failed: <k> of <n>
 * …` with one offender line per commit and the repair block, or `… — skipped:
 * <reason>` when the project enforces nothing on push.
 * exit: 0 ok or skipped; 1 a misattributed commit; 2 usage or configuration
 * error (a config file that does not parse is never read as "no profile").
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { publishedRefs, unpublishedCommits } from "./published-refs.mjs";

const DEFAULT_ROOT = process.cwd();
const BASE_CONFIG_FILE = "agentic-workflow.json";
const ENFORCE_VALUES = new Set(["off", "commit", "push", "commit-and-push"]);

/** The two repair facts every failure prints: diagnose the origin, then fix it. */
export const REPAIR_LINES = Object.freeze([
  "git config --show-origin --get-all user.name",
  "git config --show-origin --get-all user.email",
  "git config --unset user.name    # only when a stale local value shadows the approved one",
  "git var GIT_AUTHOR_IDENT",
  "git var GIT_COMMITTER_IDENT",
]);

/**
 * Read a JSONC document with one documented rule — the same rule the template's
 * pre-commit hook applies (they are two implementations of one contract, pinned
 * by `scripts/identity-hook-parity.test.mjs`): full-line `//` comments, `/* … *\/`
 * blocks, and trailing commas before `}`/`]` are accepted; everything else is
 * JSON. A string's own `//` is never touched because the scan respects quotes.
 */
export function parseJsonc(text) {
  let out = "";
  let quote = null;
  let index = 0;
  let lineStart = true;
  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1];
    if (quote !== null) {
      out += char;
      if (char === "\\" && next !== undefined) {
        out += next;
        index += 2;
        continue;
      }
      if (char === quote) quote = null;
      index += 1;
      continue;
    }
    if (char === '"') {
      quote = char;
      out += char;
      lineStart = false;
      index += 1;
      continue;
    }
    if (char === "/" && next === "/" && lineStart) {
      while (index < text.length && text[index] !== "\n") index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      index += 2;
      while (index < text.length && !(text[index] === "*" && text[index + 1] === "/")) index += 1;
      index += 2;
      continue;
    }
    if (char === "," ) {
      // Drop the comma when the next significant character closes an object or array.
      let lookahead = index + 1;
      while (lookahead < text.length && /\s/u.test(text[lookahead])) lookahead += 1;
      if (text[lookahead] === "}" || text[lookahead] === "]") {
        index += 1;
        continue;
      }
    }
    out += char;
    lineStart = char === "\n" || (lineStart && /\s/u.test(char));
    index += 1;
  }
  return JSON.parse(out);
}

function readConfigFile(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
  try {
    const value = parseJsonc(text);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error("not a JSON object");
    }
    return value;
  } catch (error) {
    const failure = new Error(`${file}: ${error instanceof Error ? error.message : String(error)}`);
    failure.code = "config-unparseable";
    throw failure;
  }
}

/** The global agent directory: the host's, then `~/.pi/agent`. */
export function globalAgentDir(env = process.env) {
  return env.PI_CODING_AGENT_DIR && env.PI_CODING_AGENT_DIR !== "" ? env.PI_CODING_AGENT_DIR : path.join(os.homedir(), ".pi", "agent");
}

/**
 * Resolve the `gitIdentity` section: global then project, per field,
 * project wins. Returns `{ enforce, approved, sources }` — `sources` names the
 * file each truth came from, so a failure can say where the profile lives.
 */
export function resolveIdentityProfile({ root, env = process.env }) {
  const globalFile = path.join(globalAgentDir(env), BASE_CONFIG_FILE);
  const projectFile = path.join(root, ".pi", BASE_CONFIG_FILE);
  const globalConfig = readConfigFile(globalFile);
  const projectConfig = readConfigFile(projectFile);
  const globalSection = globalConfig?.gitIdentity ?? {};
  const projectSection = projectConfig?.gitIdentity ?? {};
  const approved = {
    ...(typeof globalSection.approved === "object" ? globalSection.approved : {}),
    ...(typeof projectSection.approved === "object" ? projectSection.approved : {}),
  };
  const declared = projectSection.enforce ?? globalSection.enforce;
  const enforce = declared ?? "off";
  const named = Object.values(approved).some((value) => typeof value === "string" && value !== "");
  return {
    enforce,
    enforceDeclared: declared !== undefined,
    approved,
    named,
    sources: {
      global: globalFile,
      project: projectFile,
      profile: projectSection.approved !== undefined ? "project" : globalSection.approved !== undefined ? "global" : "none",
    },
  };
}

function git(root, args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  if (result.status !== 0) {
    const failure = new Error((result.stderr || "").trim() || `git ${args.join(" ")} failed`);
    failure.code = "git-failed";
    throw failure;
  }
  return result.stdout;
}

/** The commits of `base..head` a published ref does not reach, oldest first, as
 *  `{sha, author, committer}`. The range's own base is the pushed branch's remote
 *  tip when the hook supplies it, so it enters the published set too. */
export function rangeCommits({ root, base, head = "HEAD", published = [] }) {
  const shas = unpublishedCommits({ root, base, head, published });
  return shas.map((sha) => {
    const [authorName, authorEmail, committerName, committerEmail] = git(root, [
      "log",
      "-1",
      "--format=%an%x00%ae%x00%cn%x00%ce",
      sha,
    ])
      .trim()
      .split("\u0000");
    return { sha, author: { name: authorName, email: authorEmail }, committer: { name: committerName, email: committerEmail } };
  });
}

function matches(value, expected) {
  if (typeof expected !== "string" || expected === "") return true;
  return String(value).toLowerCase() === expected.toLowerCase();
}

/** Which identity facts of one commit fall outside the approved profile. */
export function commitViolations(commit, approved) {
  const violations = [];
  for (const role of ["author", "committer"]) {
    const actual = commit[role];
    const nameOk = matches(actual.name, approved.name);
    const emailOk = matches(actual.email, approved.email);
    if (!nameOk || !emailOk) violations.push({ role, actual });
  }
  return violations;
}

function describeApproved(approved) {
  const name = typeof approved.name === "string" && approved.name !== "" ? approved.name : "<any name>";
  const email = typeof approved.email === "string" && approved.email !== "" ? `<${approved.email}>` : "<any email>";
  return `${name} ${email}`;
}

/** The optional profile facts the *commit* cannot carry; the hook checks them. */
function renderSkipped(reason) {
  return `PUSH IDENTITY — skipped: ${reason}\n`;
}

export function renderResult({ status, commits, offenders, profile }) {
  if (status === "skipped") return renderSkipped(offenders);
  if (status === "ok") {
    const where = profile.sources.profile === "project" ? ".pi/agentic-workflow.json" : "the global agentic-workflow.json";
    return `PUSH IDENTITY — ok: ${commits.length} commit(s) verified against ${describeApproved(profile.approved)} (${where})\n`;
  }
  const lines = [`PUSH IDENTITY — failed: ${offenders.length} of ${commits.length} commit(s) outside the approved profile`];
  for (const { sha, violations } of offenders) {
    for (const { role, actual } of violations) {
      lines.push(`  ${sha} ${role} ${actual.name} <${actual.email}> — expected ${describeApproved(profile.approved)}`);
    }
  }
  lines.push("repair (never automatic):");
  for (const line of REPAIR_LINES) lines.push(`  ${line}`);
  return `${lines.join("\n")}\n`;
}

function usage(message) {
  process.stderr.write(`push-identity-check: ${message}\n`);
  process.stderr.write("usage: bun scripts/push-identity-check.mjs --base <rev> [--head <rev>] [--root <dir>]  (node fallback, same argv)\n");
  return 2;
}

/** The base a caller that named none means: the merge base with the upstream. */
function resolveBase(root) {
  const upstream = spawnSync("git", ["-C", root, "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], {
    encoding: "utf8",
  });
  if (upstream.status !== 0) return null;
  const base = spawnSync("git", ["-C", root, "merge-base", "HEAD", upstream.stdout.trim()], { encoding: "utf8" });
  return base.status === 0 ? base.stdout.trim() : null;
}

export function main(argv) {
  let root = DEFAULT_ROOT;
  let base = null;
  let head = "HEAD";
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root" || arg === "--base" || arg === "--head") {
      const value = argv[index + 1];
      if (value === undefined || value === "") return usage(`${arg} needs a value`);
      if (arg === "--root") root = path.resolve(value);
      else if (arg === "--base") base = value;
      else head = value;
      index += 1;
      continue;
    }
    return usage(`unknown argument ${arg}`);
  }

  let profile;
  try {
    profile = resolveIdentityProfile({ root });
  } catch (error) {
    process.stderr.write(`PUSH IDENTITY — config error: ${error.message}\n`);
    return 2;
  }
  if (!ENFORCE_VALUES.has(profile.enforce)) {
    process.stderr.write(`PUSH IDENTITY — config error: gitIdentity.enforce "${profile.enforce}" is not one of ${[...ENFORCE_VALUES].join(", ")}\n`);
    return 2;
  }
  if (!profile.named) {
    // Nothing declared to enforce: an unconfigured project is inert, but a
    // project that *asked* for enforcement and declared no profile is broken
    // and must say so instead of passing silently.
    if (profile.enforceDeclared && profile.enforce !== "off") {
      process.stderr.write(
        `PUSH IDENTITY — config error: gitIdentity.enforce is "${profile.enforce}" but gitIdentity.approved declares no name or email\n`,
      );
      return 2;
    }
    process.stdout.write(renderResult({ status: "skipped", offenders: "no approved identity profile", profile }));
    return 0;
  }
  if (profile.enforce === "off" || profile.enforce === "commit") {
    process.stdout.write(renderResult({ status: "skipped", offenders: `gitIdentity.enforce is "${profile.enforce}"`, profile }));
    return 0;
  }

  const resolvedBase = base ?? resolveBase(root);
  if (resolvedBase === null) return usage("--base is required when the branch has no upstream");

  let commits;
  try {
    commits = rangeCommits({ root, base: resolvedBase, head, published: publishedRefs({ root, extra: [resolvedBase] }) });
  } catch (error) {
    return usage(error.message);
  }
  const offenders = [];
  for (const commit of commits) {
    const violations = commitViolations(commit, profile.approved);
    if (violations.length > 0) offenders.push({ sha: commit.sha, violations });
  }
  if (offenders.length === 0) {
    process.stdout.write(renderResult({ status: "ok", commits, offenders, profile }));
    return 0;
  }
  process.stdout.write(renderResult({ status: "failed", commits, offenders, profile }));
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
