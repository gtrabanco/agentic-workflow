#!/usr/bin/env node
/**
 * session-close.mjs — the mechanical half of ending a session.
 *
 * `/log-session` asked a model to append a structured entry to `docs/LOGS.md`
 * and then *remember* to commit it. Two failures followed, both observed in the
 * field (issue #182):
 *
 * 1. The entry rode along **uncommitted** — the skill's own step 5 said so — so
 *    a later review in the same checkout hit a dirty tree authored by a
 *    different conversation and refused to run.
 * 2. "Verify there are no uncommitted changes" stayed a prose box that nothing
 *    checked, so a session could end with real work stranded in the worktree.
 *
 * This script makes both mechanical, and it computes every fact a model used to
 * re-derive by hand (branch, timestamp, commit count and range, files touched).
 *
 * **Why it does not write the log itself.** `docs/LOGS.md` is a durable record,
 * and this repository's `ledger-ownership@1` map allows exactly one non-test
 * script to rewrite a durable ledger (`scripts/ledger-provenance.mjs`), and
 * admits no ledger outside `docs/features/` and `docs/fix/`. A session log is
 * therefore written by its own sanctioned writers — `/log-session` for the rich
 * entry, the session hooks for the mechanical one. This script owns the other
 * half: it proves the append was append-only, commits it, and names whatever is
 * still uncommitted. The only thing a model contributes is the prose.
 *
 * Two commands:
 *
 *   render  — print the entry (facts computed here) for the sanctioned writer to
 *             apply. Writes nothing.
 *   close   — refuse unless the log was appended to but not rewritten, commit
 *             it alone, then report leftovers. Exit 0 clean · 2 leftovers ·
 *             1 refused.
 *
 * It deliberately never runs `git add -A`: committing a concurrent
 * conversation's half-finished work is the hazard the entry exists to prevent.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/** The documented default; a project's documentation map may point elsewhere. */
export const DEFAULT_LOG = "docs/LOGS.md";

/** `git status --porcelain` → `{status, path}` for every entry. */
export function parsePorcelain(output) {
  return String(output ?? "")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .filter(Boolean)
    .map((line) => ({ status: line.slice(0, 2).trim(), path: line.slice(3).trim() }));
}

/**
 * The entry block, in the log's own documented format. Optional sections are
 * omitted rather than left empty — an empty `**Decisions:**` line reads as a
 * decision that was never made.
 */
export function renderEntry({ timestamp, branch, kind = "manual", commits, files, summary, decisions, next }) {
  const lines = [`## ${timestamp} — ${branch} — ${kind}`];
  lines.push(`- **Commits:** ${commits?.count ?? 0}${commits?.range ? ` (\`${commits.range}\`)` : ""}`);
  lines.push(`- **Files:** ${files}`);
  if (kind === "manual") {
    lines.push(`- **Summary:** ${String(summary ?? "").trim()}`);
    if (String(decisions ?? "").trim()) lines.push(`- **Decisions:** ${String(decisions).trim()}`);
    if (String(next ?? "").trim()) lines.push(`- **Next:** ${String(next).trim()}`);
  }
  return `${lines.join("\n")}\n`;
}

/**
 * The log may only ever grow. Anything else — a rewritten header, an edited old
 * entry, a truncated file — means the append did not happen and must not be
 * committed under a session-log message.
 */
export function appendedOnly(baseline, current) {
  const before = String(baseline ?? "");
  const after = String(current ?? "");
  if (!after.startsWith(before)) return { ok: false, reason: "the recorded log is not a prefix of the current one" };
  const added = after.slice(before.length);
  if (added.trim().length === 0) return { ok: false, reason: "nothing was appended" };
  return { ok: true, added };
}

/** The `**Summary:**` lines, newest last. */
export function summaries(text) {
  return [...String(text ?? "").matchAll(/^- \*\*Summary:\*\* (.*)$/gm)].map((match) => match[1].trim());
}

/** A one-line commit subject from the appended summary — first sentence, capped. */
export function commitSubject(summary, fallback = "log session") {
  const flat = String(summary ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const first = flat.split(/(?<=[.!?])\s/)[0] || fallback;
  return first.length > 72 ? `${first.slice(0, 71)}…` : first;
}

// ---------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.error) throw new Error(`git not runnable: ${result.error.message}`);
  return result;
}

function mustGit(args) {
  const result = git(args);
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${(result.stderr || "").trim()}`);
  return result.stdout;
}

/** The repository's base branch, resolved the same way the skills do. An
 * explicit `--base` that does not resolve is a usage error, never a silent
 * fallback to `origin/main` (issue #182 F7). */
function resolveBase(explicit) {
  if (explicit !== undefined && explicit !== null && String(explicit).trim() !== "") {
    if (git(["rev-parse", "--verify", "--quiet", explicit]).status !== 0) {
      throw new Error(`--base ${explicit} does not resolve to a known revision`);
    }
    return explicit;
  }
  for (const candidate of ["origin/main", "main"]) {
    if (git(["rev-parse", "--verify", "--quiet", candidate]).status === 0) return candidate;
  }
  return null;
}

function sessionFacts(base) {
  if (!base) return { commits: { count: 0, range: null }, files: "—", touched: [] };
  const shas = mustGit(["rev-list", "--reverse", `${base}..HEAD`]).split("\n").filter(Boolean);
  const touched = mustGit(["diff", "--name-only", `${base}...HEAD`]).split("\n").filter(Boolean);
  const short = (sha) => sha.slice(0, 8);
  return {
    commits: {
      count: shas.length,
      range: shas.length > 0 ? `${short(shas[0])}…${short(shas[shas.length - 1])}` : null,
    },
    files: touched.length === 0 ? "—" : touched.length <= 5 ? touched.join(", ") : `${touched.length} files`,
    touched,
  };
}

const USAGE = `usage: session-close <command> [options]

  render  --summary <text|@file|-> [--decisions <text>] [--next <text>]
          [--kind manual|auto] [--base <ref>]
          Print the entry block with the git facts filled in. Writes nothing;
          the sanctioned writer (\\\`/log-session\\\`, the session hook) applies it.

  close   [--log <path>] [--base <ref>]
          Refuse unless the log was appended to (never rewritten), commit it
          alone, then report what is still uncommitted.
          Exit 0 clean · 2 leftovers (named) · 1 refused.
`;

const VALUE_FLAGS = new Set(["--summary", "--decisions", "--next", "--kind", "--base", "--log"]);

/** Closed flag set: an unknown or misspelled flag is a usage error, never a
 * silent default, and `--flag=value` is accepted (issue #182 F5). */
function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("-") || token === "-") {
      opts._.push(token);
      continue;
    }
    const eq = token.indexOf("=");
    const rawName = eq === -1 ? token : token.slice(0, eq);
    const inline = eq === -1 ? undefined : token.slice(eq + 1);
    if (!VALUE_FLAGS.has(rawName)) throw new Error(`unknown flag: ${rawName}`);
    const value = inline ?? argv[++i];
    if (value === undefined) throw new Error(`${rawName} needs a value`);
    opts[rawName.slice(2)] = value;
  }
  return opts;
}

function readValue(value) {
  if (value === undefined) return undefined;
  if (value === "-") return fs.readFileSync(0, "utf8");
  if (value.startsWith("@")) return fs.readFileSync(value.slice(1), "utf8");
  return value;
}

/**
 * `git show HEAD:<rel>` — an untracked log has an empty baseline. Only the
 * *absent* case is an empty baseline: a HEAD that does not resolve, or a
 * committed path git cannot read, fails closed instead of emptying the baseline
 * and letting `appendedOnly` accept any rewrite (issue #182 F8).
 */
function baselineOf(rel) {
  const spec = `HEAD:${rel}`;
  if (git(["rev-parse", "--verify", "--quiet", "HEAD"]).status !== 0) {
    throw new Error(`cannot establish the ${rel} baseline: HEAD does not resolve`);
  }
  if (git(["cat-file", "-e", spec]).status !== 0) return "";
  const result = git(["show", spec]);
  if (result.status !== 0) {
    throw new Error(`git could not read the committed ${rel}: ${(result.stderr || "").trim() || "unknown error"}`);
  }
  return result.stdout;
}

function relativeToRoot(logPath) {
  const top = mustGit(["rev-parse", "--show-toplevel"]).trim();
  return path.relative(top, logPath).split(path.sep).join("/");
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(USAGE);
    return;
  }
  if (!["render", "close"].includes(command)) throw new Error(`unknown command "${command}"\n\n${USAGE}`);
  const opts = parseArgs(argv.slice(1));

  if (command === "render") {
    const summary = readValue(opts.summary);
    const kind = opts.kind ?? "manual";
    if (kind === "manual" && !String(summary ?? "").trim()) {
      throw new Error("--summary is required: the facts are computed here, but the narrative is yours");
    }
    const facts = sessionFacts(resolveBase(opts.base));
    const branch = mustGit(["branch", "--show-current"]).trim() || "detached";
    process.stdout.write(
      renderEntry({
        timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
        branch,
        kind,
        commits: facts.commits,
        files: facts.files,
        summary,
        decisions: opts.decisions,
        next: opts.next,
      }),
    );
    return;
  }

  // close
  const logPath = path.resolve(opts.log ?? DEFAULT_LOG);
  if (!fs.existsSync(logPath)) {
    throw new Error(`no session log at ${logPath} — create it (see template/docs/LOGS.md) or pass --log`);
  }
  const rel = relativeToRoot(logPath);
  const verdict = appendedOnly(baselineOf(rel), fs.readFileSync(logPath, "utf8"));
  if (!verdict.ok) {
    throw new Error(
      `${rel} was not appended to (${verdict.reason}) — write the entry first with \`session-close render\` + /log-session, then re-run close`,
    );
  }

  const appended = summaries(verdict.added);
  const subject = commitSubject(appended[appended.length - 1], "session entry");
  const preDirty = parsePorcelain(git(["status", "--porcelain"]).stdout);
  mustGit(["add", "--", rel]);
  mustGit(["commit", "-m", `docs(log): ${subject}`, "--", rel]);
  const sha = mustGit(["rev-parse", "HEAD"]).trim();

  const leftovers = parsePorcelain(git(["status", "--porcelain"]).stdout).map((item) => `${item.status} ${item.path}`);
  const report = {
    committed: true,
    sha: sha.slice(0, 8),
    log: rel,
    subject,
    preExistingDirty: preDirty.map((item) => item.path),
    leftovers,
    clean: leftovers.length === 0,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  // A clean close is exit 0. Anything left over is named and is exit 2: the
  // session may still finish, but the tree it leaves behind is not silent.
  process.exitCode = report.clean ? 0 : 2;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`session-close: ${error.message}\n`);
    process.exitCode = 1;
  }
}
