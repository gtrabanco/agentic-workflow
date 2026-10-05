#!/usr/bin/env node
/**
 * review-receipt.mjs — the machine surface for `review-change`'s durable verdict.
 *
 * `review-change` closes with a SHA-bound PR comment. Before this script the
 * comment was assembled, posted, re-read and retried **in prose**, so a reviewer
 * could print `Decision: REVIEW-PASS` and recommend `/audit-pr` while no current
 * receipt existed — the reviewer was never mechanically unable to end its turn
 * without one (issue #182). The grammar was even pinned by a test that
 * reimplemented it locally and nothing in the workflow imported.
 *
 * This is the runtime that prose used to stand in for. Three commands:
 *
 *   render  — print the exact receipt body. No forge call. Pure.
 *   verify  — is a current receipt present? Exit 0 current · 3 absent · 4 stale · 1 error.
 *   emit    — post it idempotently, re-read, and confirm it landed. Exit 0 only
 *             when the newest marker equals the reviewed head.
 *
 * Design rules it shares with `pre-execution-snapshot.mjs` (so the two receipt
 * families answer one shape for their consumers):
 *
 * - The pure grammar and the forge are separated: every decision (`parseReviewReceipt`,
 *   `latestReceipt`, `receiptStatus`, `shouldPost`, `renderReceiptBody`,
 *   `validateEmitOptions`) is exported and side-effect free, so the contract is
 *   tested against this module instead of against a copy of it.
 * - Diagnostics go to stderr; the machine report goes to stdout as JSON.
 * - Fail closed: a malformed head, an unknown value, or a forge error is exit 1,
 *   never a silent success.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// The closed non-affecting vocabulary has one owner (fix/286): the scope-manifest
// runtime. This consumer imports the matcher, it never re-states the classes.
import { affectingPathsAt, changedPathsBetween, isNonAffecting, scopeDigestOf } from "./scope-manifest.mjs";

/** The one contract version this consumer reads. */
export const REVIEW_CONTRACT = "v1";

/**
 * The published marker. Anchored to the exact published shape so a malformed
 * marker cannot satisfy a reader: 40 hex (not "abc", not 41), an explicit
 * `contract=`, and the closing delimiter. The optional `scope=<64-hex>`
 * attribute (fix/286) records the affecting-path scope manifest the review
 * signed; a legacy receipt without it keeps head-bound semantics.
 */
export const REVIEW_MARKER_RE =
  /<!-- review-change:pass sha=([0-9a-f]{40}) contract=([^ \n]+)(?: scope=([0-9a-f]{64}))? -->/;

/** The values `- Architectural invariants:` accepts (the fixed report's own set). */
export const INVARIANT_VALUES = Object.freeze(["pass", "n/a"]);

const HEX40 = /^[0-9a-f]{40}$/;

/**
 * Flatten an interpolated value into one inert line.
 *
 * Three classes, each for a reason the body is machine-consumed:
 *
 * 1. **Control and format characters** — a newline would forge extra evidence
 *    lines and a bidi/zero-width mark is invisible to a reader while structural
 *    to a parser (the same class `unit-route.mjs` sanitizes).
 * 2. **HTML comment delimiters** — `-->` would close the marker early and
 *    `<!--` would open a second one, letting an evidence string impersonate the
 *    receipt itself.
 * 3. **Shell interpolation openers** — the receipt's own history is an inline
 *    `--body "${...}"`; a value that reads as `${VAR}` keeps that hazard alive
 *    for any consumer that renders the body through a shell.
 *
 * All three are neutralised by rewriting the bytes, never by rejecting: a
 * finding's quoted text stays readable in the receipt (which is the point of a
 * receipt) while none of the three can act.
 */
export function sanitizeValue(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u2064\u2066-\u2069\ufeff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/-->/g, "--&gt;")
    .replace(/<!--/g, "&lt;!--")
    .replace(/\$\{/g, "&#36;{")
    .replace(/\$\(/g, "&#36;(");
}

/** Parse one comment body into `{sha, contract, scope?}` or `null`. */
export function parseReviewReceipt(body) {
  if (typeof body !== "string") return null;
  const match = REVIEW_MARKER_RE.exec(body);
  return match ? { sha: match[1], contract: match[2], scope: match[3] } : null;
}

/**
 * The newest receipt in comment order whose contract matches. The forge returns
 * comments oldest-first, so "newest" is the last match — a later receipt always
 * supersedes an earlier one, which is what makes re-posting after a new commit
 * meaningful.
 */
export function latestReceipt(comments, contract = REVIEW_CONTRACT) {
  const list = Array.isArray(comments) ? comments : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const receipt = parseReviewReceipt(list[i]?.body);
    if (receipt && receipt.contract === contract) return receipt;
  }
  return null;
}

/** Is a receipt current at `headSha`? Returns `{status, reason}`. */
export function receiptStatus(comments, headSha, contract = REVIEW_CONTRACT) {
  const receipt = latestReceipt(comments, contract);
  if (!receipt) {
    return { status: "absent", reason: `no REVIEW-PASS marker with contract=${contract} in the PR comments`, receipt: null };
  }
  if (receipt.sha !== headSha) {
    return {
      status: "stale",
      reason: `receipt at ${receipt.sha}, head is ${headSha}`,
      receipt,
    };
  }
  return { status: "current", reason: `receipt current at ${headSha}`, receipt };
}

/**
 * The scope-aware judge (fix/286, #182 AC 3/9). A receipt whose sha equals the
 * head is current. Otherwise a receipt that recorded a scope manifest stays
 * current when the head delta touches only non-affecting paths — the exact
 * foreign-commit pattern (session log, agent toolstate) that head-binding
 * re-reviews over. Any affecting path in the delta voids it, named; so does an
 * unresolvable delta (fail-closed: `changedPaths: null` is never current) and
 * a legacy receipt that recorded no scope manifest (head-bound, unchanged).
 * Pure: the delta is computed by the caller's git-backed CLI layer.
 */
export function judgeReceipt({ receipt, headSha, changedPaths }) {
  if (!receipt || receipt.sha === headSha) {
    return { current: true, reason: receipt ? `receipt current at ${headSha}` : "no receipt" };
  }
  if (!receipt.scope) {
    return { current: false, changedPaths: [], reason: `receipt at ${receipt.sha}, head is ${headSha} (no scope manifest recorded — head-bound)` };
  }
  if (changedPaths === null || changedPaths === undefined) {
    return { current: false, changedPaths: [], reason: `receipt at ${receipt.sha}, head is ${headSha} — the head delta could not be resolved, so the scope cannot clear it (fail-closed)` };
  }
  const affecting = changedPaths.filter((p) => !isNonAffecting(p));
  if (affecting.length > 0) {
    return { current: false, changedPaths: affecting, reason: `the head delta touches the reviewed surface: ${affecting.join(", ")}` };
  }
  return { current: true, reason: "non-affecting head delta", changedPaths: [...changedPaths] };
}

/**
 * The idempotent post decision. Same SHA → skip; anything else → post. A receipt
 * for another contract never suppresses this one.
 */
export function shouldPost(comments, headSha, contract = REVIEW_CONTRACT) {
  const status = receiptStatus(comments, headSha, contract);
  return status.status === "current"
    ? { action: "skip", reason: `a current receipt already exists at ${headSha}` }
    : { action: "post", reason: status.reason };
}

/** The fixed receipt body. `sha` is interpolated as bytes because it is validated, not free text.
 * `scopeManifest` (fix/286) is a 64-hex scope digest recorded in the marker + body. */
export function renderReceiptBody({ sha, scope, axes, coverage, invariants, proposals, manual, scopeManifest }) {
  const scopeAttr = scopeManifest ? ` scope=${scopeManifest}` : "";
  const manifestLine = scopeManifest ? `- Scope manifest: \`sha256:${scopeManifest}\`` : null;
  const lines = [
    `<!-- review-change:pass sha=${sha} contract=${REVIEW_CONTRACT}${scopeAttr} -->`,
    "## review-change: REVIEW-PASS",
    "",
    `- Reviewed head: \`${sha}\``,
  ];
  if (manifestLine) lines.push(manifestLine);
  lines.push(
    `- Scope and applicable axes: ${sanitizeValue(scope)}`,
    `- Acceptance coverage: ${sanitizeValue(coverage)}`,
    `- Architectural invariants: ${sanitizeValue(invariants)}`,
    "- Current-unit findings open: 0",
    `- Future-capability proposals: ${sanitizeValue(proposals)}`,
    `- Manual verification: ${sanitizeValue(manual)}`,
    "",
  );
  return lines.join("\n");
}

/**
 * Every reason `emit` must refuse **before** it touches the forge. Returning the
 * whole list (instead of throwing on the first) lets one run report every bad
 * argument at once.
 */
export function validateEmitOptions(opts = {}) {
  const errors = [];
  const pr = Number(opts.pr);
  if (!Number.isInteger(pr) || pr <= 0) errors.push("--pr must be a positive integer");
  if (!HEX40.test(String(opts.head ?? ""))) errors.push("--head must be a 40-hex commit SHA");
  if (opts.scopeManifest !== undefined && opts.scopeManifest !== "" && !/^[a-f0-9]{64}$/.test(String(opts.scopeManifest))) {
    errors.push("--scope-manifest must be a 64-hex scope digest (from scripts/scope-manifest.mjs sign)");
  }
  if (!sanitizeValue(opts.scope)) errors.push("--scope is required (the reviewed surface)");
  if (!sanitizeValue(opts.axes)) errors.push("--axes is required (axes run and skipped)");
  if (!sanitizeValue(opts.coverage)) errors.push("--coverage is required (criterion-to-evidence summary)");
  if (!INVARIANT_VALUES.includes(String(opts.invariants ?? ""))) {
    errors.push(`--invariants must be one of: ${INVARIANT_VALUES.join(" | ")}`);
  }
  const proposals = Number(opts.proposals);
  if (!Number.isInteger(proposals) || proposals < 0) errors.push("--proposals must be a non-negative integer");
  return errors;
}

// ---------------------------------------------------------------------------
// Forge adapter — the only impure layer. Everything above is importable in a
// test with no network, which is what lets the contract be proven here.
// ---------------------------------------------------------------------------

function gh(args, { input } = {}) {
  const result = spawnSync("gh", args, { encoding: "utf8", input });
  if (result.error) throw new Error(`gh not runnable: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`gh ${args.join(" ")} failed (${result.status}): ${(result.stderr || "").trim()}`);
  }
  return result.stdout;
}

function ghJson(args) {
  const out = gh(args).trim();
  return out ? JSON.parse(out) : {};
}

/** `gh pr view` twice: `headRefOid` alone is not enough, and comments can be large. */
function forgePr(pr, { repo }) {
  const scope = repo ? ["-R", repo] : [];
  const meta = ghJson(["pr", "view", String(pr), "--json", "headRefOid,number", ...scope]);
  const { comments } = ghJson(["pr", "view", String(pr), "--json", "comments", ...scope]);
  return { head: meta.headRefOid, number: meta.number ?? Number(pr), comments: comments ?? [] };
}

/**
 * Post via `--body-file -`, which reads the body from standard input. The body
 * never touches the disk and never reaches a shell: `--body "${...}"` is the
 * interpolation hazard the old prose instruction flirted with, and a temp file
 * would be a durable-looking write for no reason.
 */
function postComment(pr, body, { repo }) {
  const scope = repo ? ["-R", repo] : [];
  gh(["pr", "comment", String(pr), "--body-file", "-", ...scope], { input: body });
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = `usage: review-receipt <command> [options]

  render  --head <40-hex> --scope <s> --axes <a> --coverage <c>
          [--invariants pass|n/a] [--proposals <n>] [--manual <text>]
          Print the receipt body. Performs no forge call.

  verify  (--pr <N> | --comments-json <file|->) [--head <40-hex>] [-R owner/name]
          Exit 0 when a contract=${REVIEW_CONTRACT} receipt names the head,
          3 when none exists, 4 when a receipt is stale, 1 on a usage error.

  emit    --pr <N> --head <40-hex> --scope <s> --axes <a> --coverage <c>
          [--invariants pass|n/a] [--proposals <n>] [--manual <text>]
          [--scope-base <ref> | --scope-manifest <64-hex>] [-R owner/name]
          [--root <repo>] [--dry-run]
          Post the receipt idempotently and confirm it landed at the head.
          With --scope-base, the affecting-path manifest (fix/286) is derived
          from the branch delta vs that ref at the head and recorded in the
          receipt, so a later foreign-only commit does not void it.
`;

const VALUE_FLAGS = new Set([
  "--head", "--scope", "--axes", "--coverage", "--invariants", "--proposals", "--manual",
  "--pr", "--comments-json", "--repo", "--scope-manifest", "--scope-base", "--root",
]);
const BOOLEAN_FLAGS = new Set(["--dry-run"]);
const FLAG_ALIASES = { "-R": "--repo" };

/**
 * Parse a flag vector against this module's closed flag set. Unknown flags and
 * a value flag with no value are usage errors: a misspelled `--invariants` must
 * not silently fall back to `n/a` (issue #182 F5). `--flag=value` and the
 * documented `-R owner/name` alias are supported.
 */
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
      opts[name === "--dry-run" ? "dryRun" : name.slice(2)] = true;
      continue;
    }
    if (!VALUE_FLAGS.has(name)) throw new Error(`unknown flag: ${rawName}`);
    const value = inline ?? argv[++i];
    if (value === undefined) throw new Error(`${name} needs a value`);
    opts[name.slice(2)] = value;
  }
  return opts;
}

function readComments(opts) {
  if (opts["comments-json"]) {
    const raw = opts["comments-json"] === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(opts["comments-json"], "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : (parsed.comments ?? []);
  }
  return null;
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(USAGE);
    return;
  }
  const known = ["render", "verify", "emit"];
  if (!known.includes(command)) throw new Error(`unknown command "${command}"\n\n${USAGE}`);

  const opts = parseArgs(argv.slice(1));
  const repo = opts.repo;
  // The local git root the head-delta check runs in (fix/286): a consumer that
  // senses another checkout passes --root, like its sibling runtimes.
  const gitRoot = opts.root ? path.resolve(opts.root) : process.cwd();
  /** The changed paths between two revisions in `gitRoot`, or null (fail-closed). */
  const delta = (fromSha, toSha) => changedPathsBetween((...args) => {
    const result = spawnSync("git", args, { cwd: gitRoot, encoding: "utf8" });
    return result.status === 0 ? result.stdout : null;
  }, fromSha, toSha);
  // fix/286 — the scope manifest is derived by the runtime when the caller names
  // the base ref (`--scope-base main`): the reviewed surface is the branch delta
  // vs that base at the reviewed head. Passing an explicit `--scope-manifest`
  // digest overrides it; passing neither records no manifest (head-bound).
  if (opts["scope-base"] && opts["scope-manifest"]) {
    throw new Error("--scope-base and --scope-manifest are mutually exclusive");
  }
  let scopeManifest = opts["scope-manifest"];
  if (!scopeManifest && opts["scope-base"]) {
    const gitRun = (...args) => {
      const result = spawnSync("git", args, { cwd: gitRoot, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
      return result.status === 0 ? result.stdout : null;
    };
    const paths = affectingPathsAt(gitRun, opts["scope-base"], opts.head);
    if (paths === null) throw new Error(`--scope-base ${opts["scope-base"]}: git could not resolve the delta at ${opts.head}`);
    scopeManifest = scopeDigestOf({ base: opts["scope-base"], head: opts.head, paths });
  }
  const fields = {
    scope: opts.scope,
    axes: opts.axes,
    coverage: opts.coverage,
    invariants: opts.invariants ?? "n/a",
    proposals: opts.proposals ?? 0,
    manual: opts.manual ?? "none",
    scopeManifest,
  };

  if (command === "render") {
    if (!HEX40.test(String(opts.head ?? ""))) throw new Error("--head must be a 40-hex commit SHA");
    process.stdout.write(renderReceiptBody({ sha: opts.head, ...fields }));
    return;
  }

  if (command === "verify") {
    if (opts.head !== undefined && !HEX40.test(String(opts.head))) throw new Error("--head must be a 40-hex commit SHA");
    const inline = readComments(opts);
    if (!inline && !opts.pr) throw new Error(`verify needs --pr or --comments-json\n\n${USAGE}`);
    const forge = inline ? null : forgePr(opts.pr, { repo });
    const head = opts.head ?? forge?.head;
    if (!HEX40.test(String(head ?? ""))) throw new Error("--head is required when it cannot be read from the PR");
    let status = receiptStatus(inline ?? forge.comments, head);
    // fix/286 — the scope-aware judge: a stale-by-sha receipt that recorded a
    // scope manifest stays current when the head delta (receipt sha → head) is
    // all non-affecting. The delta is computed locally (git at --root/cwd);
    // an unresolvable delta stays stale — fail closed.
    let judge = null;
    if (status.status === "stale" && status.receipt?.scope) {
      const changed = delta(status.receipt.sha, head);
      judge = judgeReceipt({ receipt: status.receipt, headSha: head, changedPaths: changed });
      if (judge.current) {
        status = { status: "current", reason: judge.reason, receipt: status.receipt };
      }
    }
    const report = {
      current: status.status === "current",
      status: status.status,
      code:
        status.status === "absent"
          ? "missing-review-receipt"
          : status.status === "stale"
            ? "stale-review-receipt"
            : undefined,
      pr: forge?.number ?? (opts.pr ? Number(opts.pr) : null),
      head,
      contract: REVIEW_CONTRACT,
      receipt: status.receipt,
      reason: status.reason,
      ...(judge ? { scopeJudge: judge } : {}),
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = status.status === "current" ? 0 : status.status === "absent" ? 3 : 4;
    return;
  }

  // emit
  const errors = validateEmitOptions({ pr: opts.pr, head: opts.head, ...fields });
  if (errors.length > 0) throw new Error(errors.join("\n"));
  const body = renderReceiptBody({ sha: opts.head, ...fields });
  if (opts.dryRun) {
    process.stdout.write(body);
    return;
  }
  const before = forgePr(opts.pr, { repo });
  if (before.head !== opts.head) {
    // fix/286 — a head delta whose changed paths are all non-affecting (foreign
    // commits on a shared checkout) does not make the candidate "changed during
    // review": the reviewed surface is byte-identical, so the receipt posts at
    // the reviewed head. Any affecting delta, an unresolvable one, or a receipt
    // without a scope manifest keeps the refusal — fail closed.
    const changed = fields.scopeManifest ? delta(opts.head, before.head) : null;
    const judged = fields.scopeManifest
      ? judgeReceipt({ receipt: { sha: opts.head, scope: fields.scopeManifest }, headSha: before.head, changedPaths: changed })
      : { current: false, reason: "no scope manifest recorded — head-bound" };
    if (!judged.current) {
      throw new Error(
        `the PR head is ${before.head} but this receipt names ${opts.head}: the candidate changed during review — re-run the review at the PR head`,
      );
    }
  }
  const decision = shouldPost(before.comments, opts.head);
  if (decision.action === "post") postComment(before.number, body, { repo });
  const after = forgePr(opts.pr, { repo });
  const status = receiptStatus(after.comments, opts.head);
  if (status.status !== "current") {
    throw new Error(`the receipt did not land at ${opts.head}: ${status.reason}`);
  }
  process.stdout.write(
    `${JSON.stringify(
      {
        current: true,
        status: "current",
        pr: after.number,
        head: opts.head,
        contract: REVIEW_CONTRACT,
        posted: decision.action === "post",
        action: decision.action,
        reason: status.reason,
      },
      null,
      2,
    )}\n`,
  );
}

// Importable without side effects.
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`review-receipt: ${error.message}\n`);
    process.exitCode = 1;
  }
}
