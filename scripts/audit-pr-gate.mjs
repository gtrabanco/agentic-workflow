#!/usr/bin/env node
/**
 * audit-pr-gate.mjs — the machine surface of the merge gate.
 *
 * `audit-pr`'s decision was prose end to end: the receipt currency rule, the
 * gate set, the verdict and the idempotent `audit-pr:merge-ready` comment all
 * existed as sentences in a reference file plus a **local reimplementation**
 * inside `scripts/audit-pr-receipt.test.mjs` — a test of a copy of a rule no
 * runtime executed (issue #182). This module is that runtime.
 *
 * Split by purity, as `review-receipt.mjs` does:
 *
 * - Every decision is an exported pure function (`newestAuditComment`,
 *   `auditVerdict`, `mergeCommentAction`, `hygieneFromState`,
 *   `renderMergeReadyBody`), so `audit-pr-receipt.test.mjs` proves the contract
 *   against the code the skill runs instead of against itself.
 * - The CLI reads forge/git state and prints one JSON report on stdout;
 *   diagnostics go to stderr, and every uncertainty fails closed.
 *
 * The receipt gate is **first**: without a current `review-change` receipt the
 * gate set is not evaluated at all. That ordering is the point — an absent
 * receipt routes back to `/review-change`, and re-reviewing the diff from the
 * merge gate is exactly the duplicated work the routing forbids.
 *
 * Hygiene gates (`tree-clean`, `branch-pushed`, `pr-ready`) were the missing
 * half of the merge contract: terminal hygiene had no owner at merge time, so a
 * clean, pushed, non-draft PR was an assumption rather than a checked fact.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

// `receiptStatus` is the review receipt's own grammar; importing it (rather than
// restating it) is what keeps one parser for one grammar.
import { receiptStatus } from "./review-receipt.mjs";

export const AUDIT_CONTRACT = "v1";
export const AUDIT_MARKER_RE = /<!-- audit-pr:merge-ready sha=([0-9a-f]{40}) -->/;

/**
 * The closed gate set. Every name must be present with value `pass` for a
 * MERGE-READY verdict; an omitted gate fails closed. The first ten are the
 * gates `audit-pr` has always evaluated; the last three are the terminal-hygiene
 * gates that previously had no owner (issue #182).
 */
export const GATE_NAMES = Object.freeze([
  "acceptance-coverage",
  "phases-complete",
  "scope-creep",
  "docs-updated",
  "traceability",
  "ci",
  "mergeability",
  "closure",
  "descope",
  "invariants",
  "tree-clean",
  "branch-pushed",
  "pr-ready",
]);

/** The hygiene subset, in report order. */
export const HYGIENE_GATES = Object.freeze(["tree-clean", "branch-pushed", "pr-ready"]);

/** The newest `audit-pr:merge-ready` marker, or `null`. */
export function newestAuditComment(comments) {
  const list = Array.isArray(comments) ? comments : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const match = AUDIT_MARKER_RE.exec(list[i]?.body ?? "");
    if (match) return match[1];
  }
  return null;
}

/**
 * The merge verdict.
 *
 * Precedence is deliberate and tested: an absent/stale receipt blocks *before*
 * any gate is read (`gatesEvaluated: false`) so the audit never re-reviews and
 * never implies a gate result it did not compute. Only once the receipt is
 * current does each gate get read, and every gate that is not exactly `pass`
 * blocks.
 */
export function auditVerdict({ comments, headSha, gates = {} }) {
  const status = receiptStatus(comments, headSha);
  if (status.status !== "current") {
    return {
      verdict: "BLOCKED",
      reason: status.reason,
      route: "/review-change",
      gatesEvaluated: false,
      blockers: [status.reason],
    };
  }
  const blockers = GATE_NAMES.filter((name) => gates[name] !== "pass").map((name) => `gate ${name} failed`);
  if (blockers.length > 0) {
    return { verdict: "BLOCKED", reason: blockers.join("; "), route: null, gatesEvaluated: true, blockers };
  }
  return {
    verdict: "MERGE-READY",
    reason: "receipt current; every applicable gate passes",
    route: null,
    gatesEvaluated: true,
    blockers: [],
  };
}

/**
 * The merge-ready comment action. Idempotent by the SHA marker: a newer marker
 * always wins, so a re-audit at the same head skips and a later head re-comments.
 * BLOCKED posts nothing — a stale green flag on a blocked PR is worse than none.
 */
export function mergeCommentAction({ verdict, comments, headSha }) {
  if (verdict !== "MERGE-READY") return { action: "none", reason: "BLOCKED posts no comment (no stale green flag)" };
  const marker = newestAuditComment(comments);
  if (marker === headSha) return { action: "skip", reason: "same SHA already commented — idempotent by SHA marker" };
  return { action: "post", reason: "newest marker wins; older SHA re-comments" };
}

/** The fixed merge-ready body. */
export function renderMergeReadyBody({ sha, gates = [], hygiene = [], mergeability = "unknown" }) {
  return [
    `<!-- audit-pr:merge-ready sha=${sha} -->`,
    "## audit-pr: MERGE-READY",
    "",
    `- Audited head: \`${sha}\``,
    `- Review receipt: current at \`${sha}\``,
    `- Gates (${gates.length}/${GATE_NAMES.length}): ${gates.join(", ") || "none"}`,
    `- Hygiene: ${hygiene.join(" · ") || "n/a"}`,
    `- Mergeability: ${mergeability}`,
    "",
  ].join("\n");
}

/**
 * Terminal hygiene, derived from observed state rather than asserted.
 *
 * `treePorcelain` is `git status --porcelain` output; `branchAhead` is the count
 * of local commits not on the remote, or `null` when `@{upstream}` did not resolve
 * (which fails the gate closed — a comparison that never ran is not "zero ahead");
 * `isDraft` is the forge's draft flag — `false`/`true` when actually read, `null`
 * when it was not observed (which fails `pr-ready` closed, never a default
 * `false`). Only `pr-ready` has a mechanical repair (`gh pr ready`), so it is the
 * only gate the caller may clear by acting — the other two are the author's to
 * fix, and a dirty tree names its files so the report is actionable.
 */
export function hygieneFromState({ treePorcelain = "", branchAhead = 0, isDraft = null } = {}) {
  const dirty = String(treePorcelain)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const ahead = branchAhead === null ? null : Number(branchAhead) || 0;
  return {
    gates: {
      "tree-clean": dirty.length === 0 ? "pass" : "fail",
      "branch-pushed": ahead === 0 ? "pass" : "fail",
      "pr-ready": isDraft === false ? "pass" : "fail",
    },
    blockers: [
      ...(dirty.length > 0 ? [`uncommitted changes: ${dirty.join(", ")}`] : []),
      ...(ahead === null
        ? ["the branch has no resolvable upstream to compare against (nothing was pushed)"]
        : ahead > 0
          ? [`branch is ${ahead} commit(s) ahead of its remote`]
          : []),
      ...(isDraft === true ? ["the PR is still a draft"] : []),
      ...(isDraft === null || isDraft === undefined ? ["the PR's draft state was not observed — pass --pr <N> to read it"] : []),
    ],
    repairs: isDraft === true ? ["gh pr ready"] : [],
  };
}

// ---------------------------------------------------------------------------
// Forge / git adapters — the only impure layer.
// ---------------------------------------------------------------------------

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { encoding: "utf8", ...options });
  if (result.error) throw new Error(`${cmd} not runnable: ${result.error.message}`);
  return result;
}

function ghJson(args) {
  const result = run("gh", args);
  if (result.status !== 0) throw new Error(`gh ${args.join(" ")} failed: ${(result.stderr || "").trim()}`);
  const out = result.stdout.trim();
  return out ? JSON.parse(out) : {};
}

function stateFromForge(pr, repo) {
  const scope = repo ? ["-R", repo] : [];
  const meta = ghJson(["pr", "view", String(pr), "--json", "headRefOid,number,isDraft,mergeable,comments", ...scope]);
  return {
    head: meta.headRefOid,
    number: meta.number ?? Number(pr),
    isDraft: Boolean(meta.isDraft),
    mergeable: meta.mergeable ?? "unknown",
    comments: meta.comments ?? [],
  };
}

function aheadCount() {
  const result = run("git", ["rev-list", "--count", "@{upstream}..HEAD"]);
  // A non-zero exit means `@{upstream}` did not resolve (no remote/upstream), so
  // nothing was compared. That is the blocked state, never a zero ahead-count.
  return result.status === 0 ? Number(result.stdout.trim()) || 0 : null;
}

const USAGE = `usage: audit-pr-gate <command> [options]

  evaluate  (--pr <N> | --comments-json <file|->) [--head <40-hex>] [--gates-json <file>]
            [-R owner/name] [--hygiene]
            Print the merge verdict as JSON. Exit 0 MERGE-READY, 2 BLOCKED.

  hygiene   [--pr <N>] [-R owner/name] [--apply] [--gates-json <file>]
            Read git/forge terminal hygiene. --apply runs the mechanical repairs
            (\\\`gh pr ready\\\`) and re-reads. Exit 0 clean, 2 blocked.

  comment   --pr <N> --head <40-hex> [--gates-json <file>] [-R owner/name]
            Post the merge-ready comment idempotently and confirm it landed.
`;

const VALUE_FLAGS = new Set(["--pr", "--repo", "--head", "--gates-json", "--comments-json"]);
const BOOLEAN_FLAGS = new Set(["--hygiene", "--apply"]);
const FLAG_ALIASES = { "-R": "--repo" };

/** Closed flag set: an unknown or misspelled flag is a usage error, never a
 * silent default, and the documented `-R owner/name` alias is honored (F5). */
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
    const name = FLAG_ALIASES[rawName] ?? rawName;
    if (BOOLEAN_FLAGS.has(name)) {
      if (inline !== undefined) throw new Error(`${name} takes no value`);
      opts[name.slice(2)] = true;
      continue;
    }
    if (!VALUE_FLAGS.has(name)) throw new Error(`unknown flag: ${rawName}`);
    const value = inline ?? argv[++i];
    if (value === undefined) throw new Error(`${name} needs a value`);
    opts[name.slice(2)] = value;
  }
  return opts;
}

function readJson(flag, opts) {
  const target = opts[flag];
  if (!target) return null;
  const raw = target === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(target, "utf8");
  return JSON.parse(raw);
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(USAGE);
    return;
  }
  if (!["evaluate", "hygiene", "comment"].includes(command)) {
    throw new Error(`unknown command "${command}"\n\n${USAGE}`);
  }
  const opts = parseArgs(argv.slice(1));
  const repo = opts.repo;

  if (command === "hygiene") {
    let stated = null;
    try {
      const prMeta = opts.pr ? stateFromForge(opts.pr, repo) : { isDraft: null };
      stated = hygieneFromState({ treePorcelain: run("git", ["status", "--porcelain"]).stdout, branchAhead: aheadCount(), isDraft: prMeta.isDraft });
      if (opts.apply) {
        for (const repair of stated.repairs) {
          const [cmd, ...rest] = repair.split(" ");
          run(cmd, rest);
        }
        if (stated.repairs.length > 0) {
          const prMeta = opts.pr ? stateFromForge(opts.pr, repo) : { isDraft: null };
          stated = hygieneFromState({ treePorcelain: run("git", ["status", "--porcelain"]).stdout, branchAhead: aheadCount(), isDraft: prMeta.isDraft });
        }
      }
    } catch (error) {
      // An unreadable forge is never a pass: report the failure as the blocker.
      stated = { gates: Object.fromEntries(HYGIENE_GATES.map((name) => [name, "fail"])), blockers: [error.message], repairs: [] };
    }
    Object.assign(stated, { clean: Object.values(stated.gates).every((value) => value === "pass") });
    process.stdout.write(`${JSON.stringify(stated, null, 2)}\n`);
    process.exitCode = stated.clean ? 0 : 2;
    return;
  }

  const stated = readJson("gates-json", opts);
  const inline = readJson("comments-json", opts);
  const forge = inline ? { comments: inline.comments ?? inline, head: opts.head, number: Number(opts.pr) || null } : stateFromForge(opts.pr, repo);
  const head = opts.head ?? forge.head;
  if (!/^[0-9a-f]{40}$/.test(String(head ?? ""))) throw new Error("--head is required when it cannot be read from the PR");

  const gates = { ...(stated ?? {}) };
  if (opts.hygiene) {
    const h = hygieneFromState({ treePorcelain: run("git", ["status", "--porcelain"]).stdout, branchAhead: aheadCount(), isDraft: forge.isDraft ?? null });
    Object.assign(gates, h.gates);
  }

  if (command === "evaluate") {
    const verdict = auditVerdict({ comments: forge.comments, headSha: head, gates });
    const action = mergeCommentAction({ verdict: verdict.verdict, comments: forge.comments, headSha: head });
    process.stdout.write(
      `${JSON.stringify({ ...verdict, head, pr: forge.number ?? null, action: action.action, actionReason: action.reason }, null, 2)}\n`,
    );
    process.exitCode = verdict.verdict === "MERGE-READY" ? 0 : 2;
    return;
  }

  // comment
  const verdict = auditVerdict({ comments: forge.comments, headSha: head, gates });
  const action = mergeCommentAction({ verdict: verdict.verdict, comments: forge.comments, headSha: head });
  if (action.action === "none") throw new Error(`refusing to post a merge-ready comment: ${verdict.reason}`);
  if (action.action === "post") {
    const body = renderMergeReadyBody({
      sha: head,
      gates: GATE_NAMES.filter((name) => gates[name] === "pass"),
      hygiene: HYGIENE_GATES.map((name) => `${name}=${gates[name] ?? "n/a"}`),
      mergeability: forge.mergeable ?? "unknown",
    });
    const scope = repo ? ["-R", repo] : [];
    // `--body-file -` reads standard input: the body never touches the disk.
    const result = run("gh", ["pr", "comment", String(forge.number), "--body-file", "-", ...scope], { input: body });
    if (result.status !== 0) throw new Error(`gh pr comment failed: ${(result.stderr || "").trim()}`);
  }
  const after = stateFromForge(forge.number, repo);
  const marker = newestAuditComment(after.comments);
  if (marker !== head) throw new Error(`the merge-ready comment did not land at ${head} (newest marker: ${marker})`);
  process.stdout.write(`${JSON.stringify({ verdict: "MERGE-READY", head, action: action.action, marker }, null, 2)}\n`);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`audit-pr-gate: ${error.message}\n`);
    process.exitCode = 1;
  }
}
