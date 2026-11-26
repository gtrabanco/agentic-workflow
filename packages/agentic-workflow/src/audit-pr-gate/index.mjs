/**
 * audit-pr-gate — the machine surface of the merge gate.
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
 *   `auditVerdict`, `mergeCommentAction`, `blockedCommentAction`,
 *   `hygieneFromState`, `renderMergeReadyBody`, `renderBlockedBody`), so
 *   `audit-pr-receipt.test.mjs` proves the contract
 *   against the code the skill runs instead of against itself.
 * - The CLI reads forge/git state and prints one JSON report on stdout;
 *   diagnostics go to stderr, and every uncertainty fails closed.
 *
 * The receipt gate is **first**: without a current `review-change` receipt —
 * and no current repair receipt answering it (issue #698 S4/S5) — the gate set
 * is not evaluated at all. That ordering is the point — an absent receipt routes
 * back to `/review-change`, and re-reviewing the diff from the
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

/** This package's bin: the one entry every command shares. */
const BIN = fileURLToPath(new URL("../../bin/agentic-workflow.mjs", import.meta.url));

// `receiptStatus`/`judgeReceipt` are the review receipt's own grammar; importing
// them (rather than restating it) is what keeps one parser for one grammar —
// fix/286 adds the scope-aware judge to the same import.
import { judgeReceipt, latestReceipt, receiptStatus } from "../review-receipt/index.mjs";
import { changedPathsBetween } from "../scope-manifest/index.mjs";
import { foreignPorcelainLines } from "../machine-ledger/index.mjs";
import { collectRepairFacts, judgeRepair, latestRepairReceipt } from "../repair-receipt/index.mjs";

export const AUDIT_CONTRACT = "v1";
export const AUDIT_MARKER_RE = /<!-- audit-pr:merge-ready sha=([0-9a-f]{40}) -->/;

/** The BLOCKED verdict's own receipt (issue #698 S7): a typed marker, so a failed
 *  audit leaves the same machine trace its merge-ready sibling does. */
export const AUDIT_BLOCKED_MARKER_RE = /<!-- audit-pr:blocked sha=([0-9a-f]{40}) blockers=(\d+) route=([^ \n]+) -->/;

/**
 * The merge gate's per-gate outcome vocabulary (issue #702 S5/S10).
 *
 * `pass` and `fail` are this report's own spellings of the receipt family's
 * `passed`/`failed`; `skipped` and `unevaluatable` are the same values the
 * published gate-check-status family carries, and `unevaluatable` is the one a
 * gate nobody could read must answer: an ambiguous `HEAD`, an unprovable
 * merge-base, a forge this checkout cannot reach. Folding that into `failed`
 * accuses content nobody observed and misroutes the diagnosis.
 *
 * One owner: the value is declared by `GATE_CHECK_STATUSES` in
 * `@gtrabanco/agentic-workflow-schema`, and no second copy of that set lives here.
 */
export const GATE_OUTCOMES = Object.freeze(["pass", "fail", "skipped", "unevaluatable"]);

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
  // The gate receipt (issue #409): a missing or stale envelope is a blocker, so
  // a caller that omits the name fails closed exactly like a failed gate.
  "gate-receipt",
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
 * One gate's outcome and the reason it holds it, for every gate in the closed
 * set. A gate the caller never supplied was **not evaluated** — its own outcome
 * with its own reason, never a content failure (issue #702 S5).
 *
 * A value may be the outcome string or `{ outcome, reason }`, so a caller that
 * knows why a gate could not be read says so instead of implying a failure.
 */
export function gateReport(gates = {}) {
  const report = {};
  for (const name of GATE_NAMES) {
    const value = gates[name];
    const stated = value !== null && typeof value === "object" ? value.outcome : value;
    const reason = value !== null && typeof value === "object" ? value.reason : undefined;
    if (stated === undefined || stated === null || stated === "") {
      report[name] = { outcome: "unevaluatable", reason: "not-evaluated" };
    } else if (stated === "pass" || stated === "fail" || stated === "skipped") {
      report[name] = { outcome: stated, ...(reason ? { reason } : {}) };
    } else if (stated === "unevaluatable") {
      report[name] = { outcome: "unevaluatable", reason: typeof reason === "string" && reason !== "" ? reason : "reported" };
    } else {
      // Fail closed on a value outside the vocabulary: a gate that is not exactly
      // a pass did not pass, and the reason names the value nobody published.
      report[name] = { outcome: "unevaluatable", reason: `unknown-outcome:${String(stated)}` };
    }
  }
  return report;
}

/** The blocker line for one gate: the outcome and, when it has one, its reason. */
export function gateBlocker(name, { outcome, reason }) {
  if (outcome === "unevaluatable") return `gate ${name} unevaluatable: ${reason ?? "not-evaluated"}`;
  if (outcome === "fail") return reason ? `gate ${name} failed: ${reason}` : `gate ${name} failed`;
  return `gate ${name} ${outcome}`;
}

/**
 * The merge verdict.
 *
 * Precedence is deliberate and tested: an absent/stale receipt blocks *before*
 * any gate is read (`gatesEvaluated: false`) so the audit never re-reviews and
 * never implies a gate result it did not compute. Only once the receipt is
 * current does each gate get read, and every gate that is not exactly `pass`
 * blocks — with the outcome it actually holds (`gateReport`).
 */
export function auditVerdict({ comments, headSha, gates = {}, changedPaths, repair = null }) {
  let status = receiptStatus(comments, headSha);
  // A current repair receipt is the review gate's currency (issue #698 S4/S5):
  // the fold repaired only ceremony/docs, the acceptance blob is unchanged and
  // the gate ran green, so a review receipt staled by that bookkeeping never
  // re-opens a full review. The remaining gates still decide, below.
  let receiptSource = "review";
  let repairJudge = null;
  // fix/286 (#182 AC 3/9) — a receipt that recorded a scope manifest stays
  // current across a head delta whose changed paths are all non-affecting
  // (foreign session-log/toolstate commits); any affecting path, an
  // unresolvable delta, or a legacy scope-less receipt keeps the BLOCKED
  // precedence: the receipt gate still fires before any gate is read.
  let scopeJudge = null;
  if (status.status === "stale" && status.receipt?.scope) {
    scopeJudge = judgeReceipt({ receipt: status.receipt, headSha, changedPaths, scopeManifest: status.receipt.scope });
    if (scopeJudge.current) {
      status = { status: "current", reason: scopeJudge.reason, receipt: status.receipt };
    }
  }
  if (status.status !== "current" && repair?.current) {
    status = { status: "current", reason: `repair receipt currency at ${headSha}`, receipt: status.receipt };
    receiptSource = "repair";
    repairJudge = repair;
  }
  if (status.status !== "current") {
    return {
      verdict: "BLOCKED",
      reason: repair && !repair.current ? `repair receipt not current: ${repair.reason}` : status.reason,
      route: "/review-change",
      gatesEvaluated: false,
      blockers: [repair && !repair.current ? `repair receipt not current: ${repair.reason}` : status.reason],
      ...(repairJudge ? { repairJudge } : {}),
      ...(scopeJudge && !scopeJudge.current ? { scopeJudge } : {}),
    };
  }
  const report = gateReport(gates);
  // The repair receipt already re-derived the gate's currency (current + pass,
  // or stale only over ceremony bookkeeping), so a stale gate judge answer is
  // cleared with its reason. A genuinely missing/invalid/red gate never is.
  if (repairJudge && report["gate-receipt"]?.outcome === "fail") {
    report["gate-receipt"] = { outcome: "pass", reason: "repair receipt gate currency" };
  }
  const blocking = GATE_NAMES.filter((name) => report[name].outcome !== "pass");
  if (blocking.length > 0) {
    return {
      verdict: "BLOCKED",
      reason: blocking.map((name) => gateBlocker(name, report[name])).join("; "),
      route: null,
      gatesEvaluated: true,
      blockers: blocking.map((name) => gateBlocker(name, report[name])),
      gates: report,
      unevaluatable: GATE_NAMES.filter((name) => report[name].outcome === "unevaluatable"),
      receiptSource,
      ...(repairJudge ? { repairJudge } : {}),
    };
  }
  return {
    verdict: "MERGE-READY",
    reason: "receipt current; every applicable gate passes",
    route: null,
    gatesEvaluated: true,
    blockers: [],
    gates: report,
    unevaluatable: [],
    receiptSource,
    ...(repairJudge ? { repairJudge } : {}),
    ...(scopeJudge?.current ? { scopeJudge } : {}),
  };
}

/**
 * The merge-ready comment action. Idempotent by the SHA marker: a newer marker
 * always wins, so a re-audit at the same head skips and a later head re-comments.
 * A BLOCKED verdict never posts this marker — a stale green flag on a blocked
 * PR is worse than none; it posts its own `audit-pr:blocked` receipt instead
 * (issue #698 S7).
 */
export function mergeCommentAction({ verdict, comments, headSha }) {
  if (verdict !== "MERGE-READY") return { action: "none", reason: "BLOCKED posts no merge-ready comment (its own blocked marker carries the failure)" };
  const marker = newestAuditComment(comments);
  if (marker === headSha) return { action: "skip", reason: "same SHA already commented — idempotent by SHA marker" };
  return { action: "post", reason: "newest marker wins; older SHA re-comments" };
}

/** The fixed BLOCKED receipt body (issue #698 S7). */
export function renderBlockedBody({ sha, blockers = [], route = "/review-change", gates = {} }) {
  const list = Array.isArray(blockers) ? blockers : [];
  const gateRows = Object.entries(gates)
    .map(([name, value]) => `${name}=${value !== null && typeof value === "object" ? value.outcome : value}`)
    .join(" · ");
  return [
    `<!-- audit-pr:blocked sha=${sha} blockers=${list.length} route=${route} -->`,
    "## audit-pr: BLOCKED",
    "",
    `- Audited head: \`${sha}\``,
    `- Route: ${route}`,
    `- Blockers (${list.length}):`,
    ...(list.length > 0 ? list.map((blocker) => `  - ${blocker}`) : ["  - none"]),
    `- Gates: ${gateRows || "none evaluated"}`,
    "",
  ].join("\n");
}

/** The newest blocked marker, in comment order. */
export function newestBlockedComment(comments) {
  const list = Array.isArray(comments) ? comments : [];
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const match = AUDIT_BLOCKED_MARKER_RE.exec(list[index]?.body ?? "");
    if (match) return { sha: match[1], blockers: Number(match[2]), route: match[3] };
  }
  return null;
}

/**
 * The verdict's receipt action: MERGE-READY keeps its merge-ready marker, and
 * BLOCKED posts its own blocked marker (issue #698 S7). Both are idempotent by
 * SHA: a newer marker always wins, so a re-audit at the same head skips.
 */
export function auditReceiptAction({ verdict, comments, headSha }) {
  if (verdict === "MERGE-READY") return mergeCommentAction({ verdict, comments, headSha });
  const marker = newestBlockedComment(comments);
  if (marker?.sha === headSha) return { action: "skip", reason: "same SHA already posted its blocked receipt — idempotent by SHA marker" };
  return { action: "post", reason: "newest blocked marker wins; a later head re-comments" };
}

/** The blocked receipt action — the BLOCKED half of `auditReceiptAction`, named
 *  separately so a caller can act on one verdict without matching strings. */
export function blockedCommentAction({ verdict, comments, headSha }) {
  if (verdict !== "BLOCKED") return { action: "none", reason: "a MERGE-READY verdict posts its own merge-ready marker" };
  return auditReceiptAction({ verdict, comments, headSha });
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
  // Issue #727 S5: the machine-owned ledger class (`machine-ledger-commit@1`,
  // LEDGERS.md) is exempt — its writer is machinery, and refusing the merge on
  // a pending row is the same defect the review's box 5 stopped carrying. The
  // filter is the class module's own, never a second list here.
  const dirty = foreignPorcelainLines(treePorcelain);
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

/**
 * The `gate-receipt` gate's own truth (issue #409, split by issue #702):
 *
 * - the judge answered and the receipt is current + passing → `pass`;
 * - the judge answered anything else → `fail`, naming the freshness status it
 *   reported (`missing`, `stale-manifest`, `invalid`) — a missing receipt is a
 *   genuinely failed gate;
 * - the judge could not be read at all (no output, not JSON) → `unevaluatable`,
 *   because nothing about the gate's content was observed.
 */
export function receiptGateOutcome(result) {
  try {
    const report = JSON.parse(result.stdout ?? "");
    if (report.status === "current" && report.verdict === "pass") return { outcome: "pass" };
    return { outcome: "fail", reason: typeof report.status === "string" && report.status !== "" ? report.status : "receipt-not-current" };
  } catch {
    return { outcome: "unevaluatable", reason: "judge-unreadable" };
  }
}

/**
 * The `gate-receipt` gate (issue #409): the merge gate reads the machine
 * envelope instead of trusting a prose claim that the suite is green.
 *
 * The judgment is delegated to `scripts/gate-receipt.mjs verify --json` — one
 * implementation of the freshness rule, never a second copy here. A subprocess
 * that cannot run, prints no verdict, or answers anything but
 * `status: current` + `verdict: pass` never passes: a judged miss is a `fail`
 * with its status, and an unreadable judge is `unevaluatable`.
 */
export function gateReceiptGate({ receipt = null, root = process.cwd() } = {}) {
  // The judge is this package's own bin (issue #553): `--root` names the project
  // whose receipt is being read, so a receipt is judged in the tree it signs.
  const args = [BIN, "gate-receipt", "verify", "--json", "--root", root];
  if (receipt) args.push("--receipt", receipt);
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  return receiptGateOutcome(result);
}

async function repairJudgeAt({ comments, head, root }) {
  const marker = latestRepairReceipt(comments);
  if (!marker) return null;
  try {
    const facts = await collectRepairFacts({ root, unit: marker.unit, reviewed: marker.reviewed, head });
    return { ...judgeRepair({ marker, headSha: head, derived: facts.derived }), marker };
  } catch (error) {
    return { current: false, currency: false, route: "RE-REVIEW-REQUIRED", reason: error.message, marker };
  }
}

const USAGE = `usage: audit-pr-gate <command> [options]

  evaluate  (--pr <N> | --comments-json <file|->) [--head <40-hex>] [--gates-json <file>]
            [-R owner/name] [--hygiene] [--receipt <path>]
            Print the merge verdict as JSON. Exit 0 MERGE-READY, 2 BLOCKED.

  hygiene   [--pr <N>] [-R owner/name] [--apply] [--gates-json <file>]
            Read git/forge terminal hygiene. --apply runs the mechanical repairs
            (\\\`gh pr ready\\\`) and re-reads. Exit 0 clean, 2 blocked.

  comment   --pr <N> --head <40-hex> [--gates-json <file>] [-R owner/name]
            Post the merge-ready comment idempotently and confirm it landed.
`;

const VALUE_FLAGS = new Set(["--pr", "--repo", "--head", "--gates-json", "--comments-json", "--receipt"]);
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

/**
 * Refuse a gate value outside `GATE_OUTCOMES`, naming the gate, the value and
 * the closed set. A value the merge gate cannot classify is a usage error; the
 * alternative — classifying it as a failure — is the misreport issue #702 S5
 * removes.
 */
function assertGateValues(stated) {
  for (const [name, value] of Object.entries(stated ?? {})) {
    const outcome = value !== null && typeof value === "object" ? value.outcome : value;
    if (!GATE_OUTCOMES.includes(outcome)) {
      throw new Error(`gate ${name} has outcome ${JSON.stringify(outcome)}; the closed set is ${GATE_OUTCOMES.join(", ")}`);
    }
    if (value !== null && typeof value === "object" && value.reason !== undefined && typeof value.reason !== "string") {
      throw new Error(`gate ${name}'s reason is not a string`);
    }
  }
}

async function dispatch(argv, options) {
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
  // The caller's gate map walks a closed vocabulary (issue #702 S5/S10): an
  // outcome nobody publishes is a usage error naming it, never a silent `fail`.
  assertGateValues(stated);
  const inline = readJson("comments-json", opts);
  const forge = inline ? { comments: inline.comments ?? inline, head: opts.head, number: Number(opts.pr) || null } : stateFromForge(opts.pr, repo);
  const head = opts.head ?? forge.head;
  if (!/^[0-9a-f]{40}$/.test(String(head ?? ""))) throw new Error("--head is required when it cannot be read from the PR");

  const gates = { ...(stated ?? {}) };
  if (opts.hygiene) {
    const h = hygieneFromState({ treePorcelain: run("git", ["status", "--porcelain"]).stdout, branchAhead: aheadCount(), isDraft: forge.isDraft ?? null });
    Object.assign(gates, h.gates);
  }
  // The receipt gate is read from the machine envelope unless the caller
  // supplied it explicitly; an absent one fails closed like a failed gate.
  if (!Object.hasOwn(gates, "gate-receipt")) {
    gates["gate-receipt"] = gateReceiptGate({ receipt: opts.receipt ?? null });
  }

  if (command === "evaluate") {
    // fix/286 — when the receipt is stale-by-sha but scoped, the head delta is
    // computed locally (git in this checkout) and the scope-aware judge decides;
    // an unresolvable delta stays null → the judge fails closed.
    const newest = latestReceipt(forge.comments);
    const changedPaths = newest?.scope && newest.sha !== head
      ? changedPathsBetween((...args) => {
          const result = run("git", args);
          return result.status === 0 ? result.stdout : null;
        }, newest.sha, head)
      : undefined;
    // Issue #698 S4/S5 — a current repair receipt is the review gate's currency.
    const repair = await repairJudgeAt({ comments: forge.comments, head, root: process.cwd() });
    const verdict = auditVerdict({ comments: forge.comments, headSha: head, gates, changedPaths, repair });
    const action = auditReceiptAction({ verdict: verdict.verdict, comments: forge.comments, headSha: head });
    process.stdout.write(
      `${JSON.stringify({ ...verdict, head, pr: forge.number ?? null, action: action.action, actionReason: action.reason }, null, 2)}\n`,
    );
    process.exitCode = verdict.verdict === "MERGE-READY" ? 0 : 2;
    return;
  }

  // comment — shares the same scoped-receipt and repair logic as evaluate (fix/286, #698)
  const newest = latestReceipt(forge.comments);
  const changedPaths = newest?.scope && newest.sha !== head
    ? changedPathsBetween((...args) => {
        const result = run("git", args);
        return result.status === 0 ? result.stdout : null;
      }, newest.sha, head)
    : undefined;
  const repair = await repairJudgeAt({ comments: forge.comments, head, root: process.cwd() });
  const verdict = auditVerdict({ comments: forge.comments, headSha: head, gates, changedPaths, repair });
  const action = auditReceiptAction({ verdict: verdict.verdict, comments: forge.comments, headSha: head });
  if (action.action === "post") {
    const body = verdict.verdict === "MERGE-READY"
      ? renderMergeReadyBody({
          sha: head,
          gates: GATE_NAMES.filter((name) => verdict.gates?.[name]?.outcome === "pass"),
          hygiene: HYGIENE_GATES.map((name) => `${name}=${verdict.gates?.[name]?.outcome ?? "n/a"}`),
          mergeability: forge.mergeable ?? "unknown",
        })
      : renderBlockedBody({
          sha: head,
          blockers: verdict.blockers,
          route: verdict.route ?? "/review-change",
          gates: verdict.gates ?? {},
        });
    const scope = repo ? ["-R", repo] : [];
    // `--body-file -` reads standard input: the body never touches the disk.
    const result = run("gh", ["pr", "comment", String(forge.number), "--body-file", "-", ...scope], { input: body });
    if (result.status !== 0) throw new Error(`gh pr comment failed: ${(result.stderr || "").trim()}`);
  }
  const after = stateFromForge(forge.number, repo);
  const marker = verdict.verdict === "MERGE-READY"
    ? newestAuditComment(after.comments)
    : newestBlockedComment(after.comments)?.sha ?? null;
  if (marker !== head) throw new Error(`the ${verdict.verdict === "MERGE-READY" ? "merge-ready" : "blocked"} receipt did not land at ${head} (newest marker: ${marker})`);
  process.stdout.write(`${JSON.stringify({ verdict: verdict.verdict, head, action: action.action, marker }, null, 2)}\n`);
}

/**
 * The command's entry: a forge, git or filesystem failure is a named refusal
 * (exit 1), never a stack trace.
 */
export function main(argv = process.argv.slice(2), options = {}) {
  try {
    return dispatch(argv, options);
  } catch (error) {
    process.stderr.write(`audit-pr-gate: ${error.message}\n`);
    return 1;
  }
}
