#!/usr/bin/env node
/**
 * log-immutability.mjs — the push-level write-path gate for the journal
 * (issue #468).
 *
 * Once the fragment carrier (`.agentic-workflow/journal/`) is opted in,
 * `docs/LOGS.md` has exactly one legal writer — the merge-to-main aggregator
 * (issue #405, the weekly bot PR) — and the carrier has exactly one legal
 * mutation — the aggregator consuming the fragments it appended. Sessions
 * prove their own discipline at close time (`session-close close` refuses a
 * journal touch and a fragment deletion); this gate holds even when a session
 * skips its close. The incident it exists for is one commit (37e5e01f, merged
 * by PR #464) that deleted 19 pending fragments and hand-appended their blocks
 * straight into the journal.
 *
 * What it checks, over a push range (`--base`, default: the upstream or
 * `origin/main` merge-base) and always over the working tree:
 *
 *   - `docs/LOGS.md` must be a byte-prefix extension of its base version —
 *     appends at EOF only, so a rewritten line, a dropped block or a middle
 *     insertion fails no matter who committed it;
 *   - every appended block must satisfy the crate's one entry-block predicate
 *     (`contentFault`, `src/journal/fragment.mjs`) — never a second copy of
 *     the grammar;
 *   - every non-merge commit touching `docs/LOGS.md`, or deleting or editing a
 *     tracked fragment, must carry the aggregator identity; carrier additions
 *     are legal for anyone (that door is the flow). Merge commits are judged
 *     by resolution: a fragment that vanishes relative to every parent is a
 *     resolution deletion, a fragment that survives every parent's edit is a
 *     resolution edit;
 *   - the working tree half mirrors `session-close close`: an uncommitted
 *     journal rewrite or pending-fragment deletion/edit is refused before any
 *     commit can carry it.
 *
 * The aggregator identity is a closed set, in any of these forms:
 *   - committer `journal-bot@users.noreply.github.com` (the workflow's git
 *     identity, set inside the aggregation job);
 *   - author or committer `github-actions[bot]@users.noreply.github.com`;
 *   - `GITHUB_ACTOR=github-actions[bot]` (CI names the actor that drove the
 *     run — a local checkout has no such env, so a hand commit can never
 *     borrow the identity there).
 *
 * stdout: one `Log-immutability:` line per violation with its named code and
 * detail, then the tally and the verdict. exit: 0 only when the verdict is
 * `PASS`; 1 on violations; 2 on usage. Read-only: it writes nothing.
 *
 * Known limit (deliberate, v1): the appended blocks' order is not checked —
 * the aggregator appends newest-first, but a legitimate integration merge can
 * union an older branch's appends after main's newer ones, so an order
 * assertion would false-positive exactly where the flow is healthy.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { contentFault } from "../packages/agentic-workflow/src/journal/fragment.mjs";

const LOG = "docs/LOGS.md";
const CARRIER = ".agentic-workflow/journal";
const BOT_EMAIL = "journal-bot@users.noreply.github.com";
const FORGE_BOT_EMAIL = "github-actions[bot]@users.noreply.github.com";
const FORGE_BOT_ACTOR = "github-actions[bot]";

const USAGE = `usage: log-immutability [--base <rev>] [--json]

  --base <rev>  the push range's base (default: merge-base with the upstream,
                then origin/main, then HEAD — working-tree checks always run)
  --json        one JSON object instead of the fixed text block

stdout: one "Log-immutability:" line per violation, the tally, the verdict.
exit: 0 pass · 1 violations · 2 usage`;

/** The closed aggregator-identity predicate: any of the forms in the header. */
export function aggregatorCommit({ committerEmail, authorEmail, actor } = {}) {
  if (committerEmail === BOT_EMAIL) return true;
  if (committerEmail === FORGE_BOT_EMAIL || authorEmail === FORGE_BOT_EMAIL) return true;
  if (actor === FORGE_BOT_ACTOR) return true;
  return false;
}

/**
 * Resolve the push range's base. `gitQuery(root, args)` returns the trimmed
 * stdout or `null` — injected so the preference order stays testable. The
 * order is: the explicit flag, the `LOG_IMMUTABILITY_BASE` env (a driver can
 * pin the base it already computed), the upstream merge-base, the `origin/main`
 * merge-base, and finally HEAD (empty range; the working-tree half still runs).
 */
export function resolveBase({ root = ".", explicit, env, gitQuery = defaultGitQuery } = {}) {
  if (explicit !== undefined) return { ok: true, base: explicit, source: "flag" };
  if (env !== undefined && env !== "") return { ok: true, base: env, source: "env" };
  for (const candidate of ["@{upstream}", "origin/main"]) {
    const rev = gitQuery(root, ["rev-parse", "--verify", "--quiet", candidate]);
    if (rev !== null) {
      const base = gitQuery(root, ["merge-base", "HEAD", candidate.trim()]);
      if (base !== null) return { ok: true, base, source: candidate === "@{upstream}" ? "upstream" : "origin/main" };
    }
  }
  const head = gitQuery(root, ["rev-parse", "HEAD"]);
  if (head !== null) return { ok: true, base: head, source: "HEAD" };
  return { ok: false, reason: "no base to diff against — pass --base" };
}

function defaultGitQuery(root, args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

function gitOut(root, args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${(result.stderr || "").trim()}`);
  return result.stdout;
}

/** The blob at `<rev>:<path>`, or `null` when that revision has no such file. */
function blobAt(root, rev, rel) {
  if (spawnSync("git", ["-C", root, "cat-file", "-e", `${rev}:${rel}`, "--"], { encoding: "utf8" }).status !== 0) return null;
  return gitOut(root, ["show", `${rev}:${rel}`]);
}

/** One entry block per element, newlines kept — the journal file is a sequence
 *  of `## `-headed blocks; everything before the first heading is the header. */
export function splitBlocks(text) {
  const blocks = [];
  let current = null;
  for (const line of text.split(/(?<=\n)/)) {
    if (line.startsWith("## ")) {
      if (current !== null) blocks.push(current);
      current = line;
    } else if (current !== null) {
      current += line;
    }
  }
  if (current !== null) blocks.push(current);
  return blocks;
}

/**
 * The journal's shape contract: `current` must be a byte-prefix extension of
 * `baseline` — append at EOF only — and every appended block must satisfy the
 * crate's entry-block predicate. Returns violations (empty when clean).
 */
export function logShapeViolations(baseline, current, { what = LOG } = {}) {
  if (current === baseline) return [];
  if (baseline !== null && current.startsWith(baseline)) {
    const suffix = current.slice(baseline.length);
    if (suffix === "") return [];
    if (!suffix.startsWith("## ")) {
      return [{ code: "log-block-malformed", detail: `${what}: the appended bytes do not start with an entry heading` }];
    }
    const violations = [];
    for (const block of splitBlocks(suffix)) {
      const fault = contentFault(block);
      if (fault !== null) {
        violations.push({
          code: "log-block-malformed",
          detail: `${what}: appended block "${(block.split("\n")[0] || "").slice(0, 80)}" is not a conforming entry block (${fault})`,
        });
      }
    }
    return violations;
  }
  const line = [...(baseline ?? "")].findIndex((ch, i) => ch !== current[i]);
  return [
    {
      code: "log-rewritten",
      detail: `${what}: not a byte-prefix extension of the baseline${line >= 0 ? ` — first difference at byte ${line}` : ""}`,
    },
  ];
}

function nameStatus(root, args) {
  const out = gitOut(root, args);
  const entries = [];
  for (const line of out.split("\n")) {
    if (!line.trim()) continue;
    const tab = line.indexOf("\t");
    if (tab === -1) continue;
    const status = line.slice(0, tab);
    const file = line.slice(tab + 1).split("\t").pop();
    entries.push({ status, file });
  }
  return entries;
}

function shortSha(root, sha) {
  return gitOut(root, ["rev-parse", "--short", sha]).trim();
}

/**
 * The range half: the journal's shape over `base..HEAD`, plus the identity of
 * every commit that touched it or consumed a fragment. Read-only.
 */
export function checkRange({ root, base, actor }) {
  const violations = [];
  const baseline = blobAt(root, base, LOG);
  const current = blobAt(root, "HEAD", LOG);
  if (current === null) {
    violations.push({ code: "log-rewritten", detail: `${LOG}: deleted in the range` });
  } else {
    violations.push(...logShapeViolations(baseline, current));
  }

  // Who touched what: non-merge commits carry their own name-status; merges are
  // judged by resolution (below), because `-m` diffs attribute the other
  // parent's incoming appends to the merge — a clean integration must not red.
  const commits = gitOut(root, ["rev-list", "--reverse", `${base}..HEAD`]).split("\n").filter(Boolean);
  const merges = [];
  const touchedLog = []; // non-merge commits touching the journal
  const consumed = new Map(); // fragment name → the non-merge commits that D/M'd it
  for (const sha of commits) {
    const parents = gitOut(root, ["rev-list", "--parents", "-n", "1", sha]).trim().split(" ").slice(1);
    if (parents.length > 1) {
      merges.push(sha);
      continue;
    }
    const identity = gitOut(root, ["show", "-s", "--format=%ce%x00%ae", sha]).trim().split("\0");
    const isBot = aggregatorCommit({ committerEmail: identity[0], authorEmail: identity[1], actor });
    for (const { status, file } of nameStatus(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", sha])) {
      if (file === LOG) {
        if (!isBot) touchedLog.push({ sha, subject: gitOut(root, ["show", "-s", "--format=%s", sha]).trim() });
      } else if (file.startsWith(`${CARRIER}/`) && file.endsWith(".md") && (status.startsWith("D") || status.startsWith("M"))) {
        const name = path.basename(file);
        if (!consumed.has(name)) consumed.set(name, []);
        consumed.get(name).push({ sha, status, isBot });
      }
    }
  }
  for (const { sha, subject } of touchedLog) {
    violations.push({
      code: "log-hand-appended",
      detail: `${LOG}: touched by non-aggregator commit ${shortSha(root, sha)} "${subject}" — write a fragment instead; the aggregator owns the journal`,
    });
  }
  for (const [name, hits] of consumed) {
    const byHuman = hits.filter((hit) => !hit.isBot);
    for (const hit of byHuman) {
      violations.push({
        code: hit.status.startsWith("D") ? "fragment-hand-deleted" : "fragment-hand-edited",
        detail: `${CARRIER}/${name}: ${hit.status.startsWith("D") ? "deleted" : "edited"} by non-aggregator commit ${shortSha(root, hit.sha)}`,
      });
    }
  }

  // Merge resolutions: a fragment the net diff lost or edited that no
  // non-merge commit explains was resolved away (or into something new) by a
  // merge — the one mutation only the aggregator may perform.
  if (merges.length > 0) {
    const net = nameStatus(root, ["diff", "--name-status", "-r", base, "HEAD"]).filter((entry) =>
      entry.file.startsWith(`${CARRIER}/`) && entry.file.endsWith(".md") && (entry.status.startsWith("D") || entry.status.startsWith("M")));
    for (const { status, file } of net) {
      const name = path.basename(file);
      if (consumed.has(name)) continue; // already attributed (and judged) per commit
      for (const sha of merges) {
        const parents = gitOut(root, ["rev-list", "--parents", "-n", "1", sha]).trim().split(" ").slice(1);
        const perParent = parents.map((parent) =>
          nameStatus(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", sha, parent]).find((entry) => entry.file === file));
        const inEveryParent = perParent.every((entry) => entry !== undefined && entry.status[0] === status[0]);
        if (inEveryParent) {
          violations.push({
            code: status.startsWith("D") ? "fragment-hand-deleted" : "fragment-hand-edited",
            detail: `${CARRIER}/${name}: ${status.startsWith("D") ? "deleted" : "edited"} by merge resolution ${shortSha(root, sha)} — only the aggregator consumes fragments`,
          });
          break;
        }
      }
    }
  }
  return { violations, rangeCommits: commits.length };
}

/**
 * The working-tree half — the same claims `session-close close` makes, so a
 * session that skips its close is still caught before the push.
 */
export function checkWorkingTree({ root }) {
  const violations = [];
  const logPath = path.join(root, LOG);
  if (!fs.existsSync(logPath)) {
    violations.push({ code: "log-rewritten", detail: `${LOG}: missing from the working tree` });
  } else {
    violations.push(...logShapeViolations(blobAt(root, "HEAD", LOG), fs.readFileSync(logPath, "utf8")));
  }
  const committed = gitOut(root, ["ls-tree", "-r", "--name-only", "HEAD", "--", CARRIER])
    .split("\n").filter(Boolean).map((entry) => path.basename(entry));
  const working = fs.existsSync(path.join(root, CARRIER))
    ? fs.readdirSync(path.join(root, CARRIER)).filter((name) => name.endsWith(".md"))
    : [];
  for (const name of committed) {
    if (!working.includes(name)) {
      violations.push({ code: "fragment-hand-deleted", detail: `${CARRIER}/${name}: deleted in the working tree — a deletion is a lost entry, not a session entry` });
      continue;
    }
    const headBytes = gitOut(root, ["show", `HEAD:${CARRIER}/${name}`]);
    if (headBytes !== fs.readFileSync(path.join(root, CARRIER, name), "utf8")) {
      violations.push({ code: "fragment-hand-edited", detail: `${CARRIER}/${name}: edited in the working tree — append-only holds at fragment level too` });
    }
  }
  return { ok: violations.length === 0, violations };
}

function parseArgs(argv) {
  const opts = { base: undefined, json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") opts.json = true;
    else if (arg === "--base") {
      const value = argv[++i];
      if (value === undefined) throw new UsageError("--base needs a revision");
      opts.base = value;
    } else throw new UsageError(`unknown argument: ${arg}`);
  }
  return opts;
}

class UsageError extends Error {}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    if (error instanceof UsageError) {
      process.stderr.write(`${error.message}\n${USAGE}\n`);
      process.exitCode = 2;
      return;
    }
    throw error;
  }
  const root = process.cwd();
  const resolved = resolveBase({ root, explicit: opts.base, env: process.env.LOG_IMMUTABILITY_BASE });
  if (!resolved.ok) {
    process.stderr.write(`${resolved.reason}\n${USAGE}\n`);
    process.exitCode = 2;
    return;
  }
  let range = { violations: [], rangeCommits: 0 };
  try {
    range = checkRange({ root, base: resolved.base, actor: process.env.GITHUB_ACTOR });
  } catch (error) {
    process.stderr.write(`log-immutability: ${error.message}\n`);
    process.exitCode = 2;
    return;
  }
  const working = checkWorkingTree({ root });
  const violations = [...range.violations, ...working.violations];
  const actor = process.env.GITHUB_ACTOR;
  const payload = {
    ok: violations.length === 0,
    base: shortSha(root, resolved.base),
    source: resolved.source,
    actor: actor ? actor : null,
    rangeCommits: range.rangeCommits,
    violations,
  };
  if (opts.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    for (const violation of violations) process.stdout.write(`Log-immutability: ${violation.code} — ${violation.detail}\n`);
    process.stdout.write(
      `Log-immutability: ${violations.length} violations · base ${payload.base} · range ${range.rangeCommits} commits\n`,
    );
    process.stdout.write(`verdict: ${payload.ok ? "PASS" : "FAIL"}\n`);
  }
  process.exitCode = payload.ok ? 0 : 1;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
