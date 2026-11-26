/**
 * repair-receipt — the machine-consumable REPAIR-RECEIPT (issue #698 S4/S6).
 *
 * `fold-findings` has printed a `REPAIR-RECEIPT` block since feature 30, whose
 * branch cell already names `RE-REVIEW-SKIPPED | RE-REVIEW-OPTIONAL |
 * RE-REVIEW-REQUIRED | REPLAN-ROUTE | PRODUCT-ROUTE` — and no runtime consumed
 * it. So a repaired, gate-green, acceptance-stable head kept losing its proof
 * to its own bookkeeping commits, and the merge gate re-opened a full review
 * over ceremony (fix-334 F2/F3).
 *
 * This module is the runtime that prose waited for:
 *
 *   emit    — derive the typed marker from the repository at HEAD, post it
 *             idempotently (or print it with `--dry-run`), and confirm it
 *             landed. It commits nothing: the emission order is bookkeeping
 *             commits first, the receipt last, and a re-pin commits nothing.
 *   verify  — re-derive every fact the marker claims and judge it at a head.
 *
 * The route is the consumer's decision, encoded by the producer so the same
 * shape serves both continuations: `RE-REVIEW-SKIPPED`/`RE-REVIEW-OPTIONAL`
 * grant currency (the head proceeds to merge), `RE-REVIEW-REQUIRED`,
 * `REPLAN-ROUTE` and `PRODUCT-ROUTE` grant nothing and route as they always
 * did. Currency is fail-closed: a moved acceptance blob, an open
 * `BLOCKER`/`CRITICAL` row, a gate that is not green, or a delta that carries
 * any behaviour-bearing path derives required.
 *
 * The verdict is `REPAIR-RECEIPT`'s own shape, not a second convention: the
 * class is `ceremony` (only workflow bookkeeping) or `docs-only` (only
 * Markdown under `docs/`), both consumed from `scope-manifest`'s one matcher
 * family.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const schema = await import("@gtrabanco/agentic-workflow-schema");
const { sha256HexSync } = schema;
import {
  changedPathsBetween,
  isCeremonyBookkeeping,
  mergeBase,
} from "../scope-manifest/index.mjs";
import { GATE_RECEIPT_PATH, judgeGateReceipt } from "../gate-receipt/index.mjs";
import { acceptanceState } from "../runner/sensors/scaffold-contract.mjs";
import { readCarrier } from "../runner/findings-carrier.mjs";

/** The one contract version this producer emits and its consumers read. */
export const REPAIR_CONTRACT = "v1";

/** The delta classes a repair receipt may claim. */
export const REPAIR_CLASSES = Object.freeze(["ceremony", "docs-only"]);

/** The routes the fold's closing-block decision branch already publishes. */
export const REPAIR_ROUTES = Object.freeze([
  "RE-REVIEW-SKIPPED",
  "RE-REVIEW-OPTIONAL",
  "RE-REVIEW-REQUIRED",
  "REPLAN-ROUTE",
  "PRODUCT-ROUTE",
]);

/** The routes that grant merge currency. Everything else fails closed. */
export const CURRENCY_ROUTES = Object.freeze(["RE-REVIEW-SKIPPED", "RE-REVIEW-OPTIONAL"]);

const HEX40 = "[0-9a-f]{40}";
const HEX64 = "[0-9a-f]{64}";
const UNIT_SLUG = "[0-9]+-[a-z0-9][a-z0-9-]*";

/** The published marker. Every attribute is a closed shape: a malformed marker
 *  satisfies no reader, so a free-text value can never forge receipt structure. */
export const REPAIR_MARKER_RE = new RegExp(
  `<!-- fold-findings:repair sha=(${HEX40}) unit=(${UNIT_SLUG}) reviewed=(${HEX40})`
  + ` scope=(${HEX64}) class=(ceremony|docs-only) route=(${REPAIR_ROUTES.join("|")})`
  + ` ac=(${HEX64}) gate=(${HEX64}) open=(\\d+) -->`,
  "u",
);

/** Parse one comment body into the receipt fields, or `null`. */
export function parseRepairReceipt(body) {
  if (typeof body !== "string") return null;
  const match = REPAIR_MARKER_RE.exec(body);
  if (match === null) return null;
  return {
    sha: match[1],
    unit: match[2],
    reviewed: match[3],
    scope: match[4],
    classKind: match[5],
    route: match[6],
    ac: match[7],
    gate: match[8],
    open: Number(match[9]),
  };
}

/** The newest repair marker in comment order (the forge returns oldest-first). */
export function latestRepairReceipt(comments) {
  const list = Array.isArray(comments) ? comments : [];
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const receipt = parseRepairReceipt(list[index]?.body);
    if (receipt !== null) return receipt;
  }
  return null;
}

/** The delta's digest: the reviewed head and the sorted changed paths, never
 *  the head itself — the same reason the scope manifest does not bind its head. */
export function repairScopeDigest({ reviewed, head = null, paths }) {
  void head;
  return sha256HexSync(JSON.stringify({
    contract: "repair-scope@1",
    reviewed,
    paths: [...paths].sort(),
  }));
}

/** One line per route, for the receipt body and the refusal pointer. */
const ROUTE_OWNER = Object.freeze({
  "RE-REVIEW-SKIPPED": "no re-review; the head is merge currency",
  "RE-REVIEW-OPTIONAL": "no re-review by default; the consumer may record a re-review",
  "RE-REVIEW-REQUIRED": "the delta is not provably ceremony-only — re-review in delta mode",
  "REPLAN-ROUTE": "a replan-class row is open — route to the planner",
  "PRODUCT-ROUTE": "a product-owned row is open — route to the lane",
});

/** The fixed receipt body. */
export function renderRepairBody({ sha, unit, reviewed, scope, classKind, route, ac, gate, open, repairs = [] }) {
  if (!new RegExp(`^${HEX40}$`, "u").test(String(sha ?? ""))) throw new Error("sha must be a 40-hex commit");
  if (!new RegExp(`^${HEX40}$`, "u").test(String(reviewed ?? ""))) throw new Error("reviewed must be a 40-hex commit");
  if (!new RegExp(`^${HEX64}$`, "u").test(String(scope ?? ""))) throw new Error("scope must be a 64-hex digest");
  if (!new RegExp(`^${HEX64}$`, "u").test(String(ac ?? ""))) throw new Error("ac must be a 64-hex digest");
  if (!new RegExp(`^${HEX64}$`, "u").test(String(gate ?? ""))) throw new Error("gate must be a 64-hex digest");
  if (!new RegExp(`^${UNIT_SLUG}$`, "u").test(String(unit ?? ""))) throw new Error(`unit must be a unit slug (${UNIT_SLUG})`);
  if (!REPAIR_CLASSES.includes(classKind)) throw new Error(`class must be one of: ${REPAIR_CLASSES.join(" | ")}`);
  if (!REPAIR_ROUTES.includes(route)) throw new Error(`route must be one of: ${REPAIR_ROUTES.join(" | ")}`);
  const openCount = Number(open);
  if (!Number.isInteger(openCount) || openCount < 0) throw new Error("open must be a non-negative integer");
  const repaired = repairs.length > 0 ? repairs.join(" + ") : "none";
  return [
    `<!-- fold-findings:repair sha=${sha} unit=${unit} reviewed=${reviewed} scope=${scope} class=${classKind} route=${route} ac=${ac} gate=${gate} open=${openCount} -->`,
    "## fold-findings: REPAIR-RECEIPT",
    "",
    `- Repaired head: \`${sha}\``,
    `- Reviewed head: \`${reviewed}\``,
    `- Delta class: \`${classKind}\``,
    `- Scope digest: \`sha256:${scope}\``,
    `- Acceptance: \`sha256:${ac}\``,
    `- Gate evidence: \`sha256:${gate}\``,
    `- Open BLOCKER/CRITICAL rows: ${openCount}`,
    `- Repaired: ${repaired}`,
    `- Route: ${route} — ${ROUTE_OWNER[route]}`,
    "",
  ].join("\n");
}

/**
 * Classify the delta between the reviewed head and this one. `null` means the
 * delta carries a path a consumer would call behaviour-bearing, and no receipt
 * may claim it as a repair.
 */
export function classifyDelta(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return null;
  if (paths.every((rel) => isCeremonyBookkeeping(rel))) return "ceremony";
  const docsOnly = paths.every((rel) => rel.endsWith(".md")
    && !rel.startsWith("packages/")
    && !rel.startsWith("scripts/")
    && !rel.startsWith("template/")
    && !rel.startsWith(".github/"));
  return docsOnly ? "docs-only" : null;
}

/**
 * The route the facts support. Freeze routes win (a replan/product row means
 * the fold already declared a different continuation), then every currency
 * gate, then the class's own default.
 */
export function deriveRoute({ classKind, openBlocking = 0, freeze = null, acMatch = false, gateOk = false } = {}) {
  if (freeze === "replan") return "REPLAN-ROUTE";
  if (freeze === "product") return "PRODUCT-ROUTE";
  if (classKind === null || !REPAIR_CLASSES.includes(classKind)) return "RE-REVIEW-REQUIRED";
  if (Number(openBlocking) > 0 || !acMatch || !gateOk) return "RE-REVIEW-REQUIRED";
  return classKind === "docs-only" ? "RE-REVIEW-OPTIONAL" : "RE-REVIEW-SKIPPED";
}

/**
 * Judge a marker against the facts a consumer re-derives at the head.
 *
 * `current` requires the marker to name this head and every claimed attribute
 * to reproduce; `currency` additionally requires the derived route to be one
 * of the two that grant it. Anything else reports the route the facts support,
 * so the consumer routes from evidence rather than from the marker's wish.
 */
export function judgeRepair({ marker, headSha, derived }) {
  const route = deriveRoute(derived);
  const reasons = [];
  if (!marker) {
    return { current: false, currency: false, route, reason: "no repair receipt in the PR comments" };
  }
  if (marker.sha !== headSha) reasons.push(`receipt at ${marker.sha}, head is ${headSha}`);
  if (marker.unit !== derived.unit) reasons.push(`receipt names unit ${marker.unit}, the read unit is ${derived.unit}`);
  if (marker.classKind !== derived.classKind) reasons.push(`receipt class ${marker.classKind}, re-derived ${derived.classKind ?? "behaviour-bearing"}`);
  if (marker.scope !== derived.scope) reasons.push("the delta scope digest does not reproduce");
  if (marker.ac !== derived.acHash) reasons.push("the acceptance hash does not reproduce");
  if (marker.gate !== derived.gateDigest) reasons.push("the gate evidence digest does not reproduce");
  if (marker.open !== derived.openBlocking) reasons.push(`receipt says ${marker.open} open blocker(s), the carrier has ${derived.openBlocking}`);
  if (marker.route !== route) reasons.push(`receipt route ${marker.route}, facts derive ${route}`);
  const current = reasons.length === 0;
  const currency = current && CURRENCY_ROUTES.includes(route);
  return {
    current,
    currency,
    route,
    reason: current
      ? route === "RE-REVIEW-SKIPPED"
        ? "a ceremony-only repair; the head is merge currency"
        : "a docs-only repair; the head is merge currency unless a consumer records a re-review"
      : reasons.join("; "),
  };
}

/* ------------------------------------------------------------------ facts */

/** One git runner rooted at a directory; `null` when git cannot answer. */
function gitAt(root) {
  return (...args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
    return result.status === 0 ? result.stdout : null;
  };
}

function gitLine(run, ...args) {
  const out = run(...args);
  return out === null ? null : out.toString("utf8").trim();
}

/** Is `ancestor` reachable from `head`? A non-zero answer is a refusal, not a guess. */
export function isAncestor(root, ancestor, head) {
  const run = spawnSync("git", ["merge-base", "--is-ancestor", ancestor, head], { cwd: root, encoding: "utf8" });
  return run.status === 0;
}

/** The unit's carrier paths, or `null` when neither home holds the doc. */
export function unitDocAt(root, unit) {
  for (const home of ["docs/fix", "docs/features"]) {
    const dir = path.join(root, home, unit);
    const spec = path.join(dir, "SPEC.md");
    if (fs.existsSync(spec)) return { dir, specPath: spec };
  }
  return null;
}

/** The open rows: `BLOCKER`/`CRITICAL` count and the freeze route a row declares. */
export function findingsFacts(root, unit) {
  const located = unitDocAt(root, unit);
  if (located === null) throw new Error(`unit not found: ${unit} (no docs/fix or docs/features folder carries a SPEC.md)`);
  const docText = fs.readFileSync(located.specPath, "utf8");
  const legacyPath = path.join(located.dir, "review-findings.md");
  const ledgerText = fs.existsSync(legacyPath) ? fs.readFileSync(legacyPath, "utf8") : null;
  const carrier = readCarrier({
    docText,
    ledgerText,
    docPath: path.relative(root, located.specPath),
    ledgerPath: path.relative(root, legacyPath),
  });
  let openBlocking = 0;
  let freeze = null;
  for (const row of carrier.rows) {
    const folded = carrier.carrier === "legacy" && String(row.folded ?? "").trim() === "yes";
    if (folded) continue;
    if (row.severity === "BLOCKER" || row.severity === "CRITICAL") openBlocking += 1;
    const route = String(row.route ?? "").trim();
    if (route.startsWith("replan-in-unit")) freeze = freeze ?? "replan";
    else if (route.startsWith("decision-required") || row.class === "product") freeze = freeze === "replan" ? "replan" : "product";
  }
  return { openBlocking, freeze, docText };
}

/** The gate's currency: current + pass, or stale only over ceremony bookkeeping. */
export async function gateFacts(root) {
  const judge = await judgeGateReceipt({ root });
  let digest;
  try {
    digest = sha256HexSync(fs.readFileSync(path.resolve(root, GATE_RECEIPT_PATH), "utf8"));
  } catch {
    digest = sha256HexSync("missing-gate-receipt");
  }
  let gateOk = false;
  let stalePaths = [];
  if (judge.status === "current" && judge.verdict === "pass") {
    gateOk = true;
  } else if (judge.status === "stale" && judge.receiptVerdict === "pass") {
    stalePaths = Array.isArray(judge.changedPaths) ? judge.changedPaths : [];
    // A stale receipt proves the gate ran green only when every path that moved
    // since the run is the workflow's own bookkeeping; an authored doc or any
    // source byte was never gated, so it keeps the receipt out of currency.
    if (stalePaths.length > 0 && stalePaths.every((rel) => isCeremonyBookkeeping(rel))) gateOk = true;
  }
  return {
    gateOk,
    digest,
    status: judge.status,
    verdict: judge.verdict,
    stalePaths,
    changedPaths: judge.changedPaths ?? [],
  };
}

/**
 * Re-derive every fact the marker claims, at `head`. Throws only on a
 * repository fact it cannot read (an unresolvable head, a missing unit); a
 * fact that is merely false is a `false` in the returned object.
 */
export async function collectRepairFacts({ root = process.cwd(), unit, reviewed, head = null }) {
  const run = gitAt(root);
  const headSha = head ?? gitLine(run, "rev-parse", "HEAD");
  if (!headSha || !new RegExp(`^${HEX40}$`, "u").test(headSha)) throw new Error("HEAD is not a readable 40-hex commit");
  if (!new RegExp(`^${HEX40}$`, "u").test(String(reviewed ?? ""))) throw new Error("--reviewed must be a 40-hex commit SHA");
  if (!isAncestor(root, reviewed, headSha)) throw new Error(`--reviewed ${reviewed} is not an ancestor of ${headSha}`);
  if (reviewed === headSha) throw new Error("nothing to repair: --reviewed is the head itself");
  const paths = changedPathsBetween(run, reviewed, headSha);
  if (paths === null) throw new Error(`the delta ${reviewed}..${headSha} could not be resolved`);
  const classKind = classifyDelta(paths);
  const { openBlocking, freeze, docText } = findingsFacts(root, unit);
  const acceptance = acceptanceState(docText);
  const gate = await gateFacts(root);
  const derived = {
    unit,
    classKind,
    paths,
    openBlocking,
    freeze,
    acMatch: acceptance.state === "match",
    acHash: acceptance.declared ?? sha256HexSync(docText),
    gateOk: gate.gateOk,
    gateStalePaths: gate.stalePaths,
    gateDigest: gate.digest,
    scope: repairScopeDigest({ reviewed, head: headSha, paths }),
    headSha,
  };
  return { derived, paths, acceptance, gate };
}

/* -------------------------------------------------------------------- CLI */

const USAGE = `usage: repair-receipt <command> [options]

  emit    --unit <slug> --reviewed <40-hex> (--pr <N> | --dry-run)
          [--repairs <F-ids>] [-R owner/name] [--root <repo>]
          Derive the receipt from the repository at HEAD and post it
          idempotently. It commits nothing: bookkeeping commits first,
          the receipt last, and a re-pin commits nothing.

  verify  (--pr <N> | --comments-json <file|->) [--head <40-hex>] [--root <repo>]
          Re-derive every fact the newest marker claims and judge it at the
          head. Exit 0 merge currency · 3 absent · 4 not current · 1 error.
`;

const VALUE_FLAGS = new Set(["--unit", "--reviewed", "--pr", "--repairs", "--repo", "--root", "--comments-json", "--head"]);
const BOOLEAN_FLAGS = new Set(["--dry-run"]);
const FLAG_ALIASES = { "-R": "--repo" };

function parseArgs(argv) {
  const opts = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
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
    const value = inline ?? argv[++index];
    if (value === undefined) throw new Error(`${name} needs a value`);
    opts[name.slice(2)] = value;
  }
  return opts;
}

function gh(args, { input } = {}) {
  const result = spawnSync("gh", args, { encoding: "utf8", input });
  if (result.error) throw new Error(`gh not runnable: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`gh ${args.join(" ")} failed (${result.status}): ${(result.stderr || "").trim()}`);
  return result.stdout;
}

function ghJson(args) {
  const out = gh(args).trim();
  return out ? JSON.parse(out) : {};
}

function forgePr(pr, { repo }) {
  const scope = repo ? ["-R", repo] : [];
  const meta = ghJson(["pr", "view", String(pr), "--json", "headRefOid,number", ...scope]);
  const { comments } = ghJson(["pr", "view", String(pr), "--json", "comments", ...scope]);
  return { head: meta.headRefOid, number: meta.number ?? Number(pr), comments: comments ?? [] };
}

function readComments(opts) {
  if (!opts["comments-json"]) return null;
  const raw = opts["comments-json"] === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(opts["comments-json"], "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : (parsed.comments ?? []);
}

async function dispatch(argv, options) {
  const command = argv[0];
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(USAGE);
    return;
  }
  if (!["emit", "verify"].includes(command)) throw new Error(`unknown command "${command}"\n\n${USAGE}`);
  const opts = parseArgs(argv.slice(1));
  const root = path.resolve(opts.root ?? options.root ?? process.cwd());
  const repo = opts.repo;

  if (command === "emit") {
    if (!opts.unit) throw new Error("--unit is required (the unit slug whose carrier the receipt reads)");
    if (!opts.reviewed) throw new Error("--reviewed is required (the reviewed head the repair follows)");
    if (!opts.pr && !opts.dryRun) throw new Error("emit needs --pr <N> or --dry-run");
    const facts = await collectRepairFacts({ root, unit: opts.unit, reviewed: opts.reviewed });
    const { derived } = facts;
    const route = deriveRoute(derived);
    const repairs = opts.repairs ? String(opts.repairs).split(",").map((cell) => cell.trim()).filter(Boolean) : [];
    const body = renderRepairBody({
      sha: derived.headSha,
      unit: derived.unit,
      reviewed: opts.reviewed,
      scope: derived.scope,
      classKind: derived.classKind ?? "ceremony",
      route,
      ac: derived.acHash,
      gate: derived.gateDigest,
      open: derived.openBlocking,
      repairs,
    });
    if (opts.dryRun) {
      process.stdout.write(body);
      return;
    }
    const before = forgePr(opts.pr, { repo });
    if (before.head !== derived.headSha) {
      throw new Error(`the PR head is ${before.head} but the receipt was derived at ${derived.headSha}: bookkeeping landed after the derivation — re-run emit at the PR head`);
    }
    const existing = latestRepairReceipt(before.comments);
    const posted = !(existing && existing.sha === derived.headSha && existing.route === route && existing.scope === derived.scope);
    if (posted) gh(["pr", "comment", String(before.number), "--body-file", "-", ...(repo ? ["-R", repo] : [])], { input: body });
    const after = forgePr(opts.pr, { repo });
    const marker = latestRepairReceipt(after.comments);
    if (!marker || marker.sha !== derived.headSha) throw new Error(`the repair receipt did not land at ${derived.headSha}`);
    process.stdout.write(`${JSON.stringify({
      contract: REPAIR_CONTRACT,
      pr: after.number,
      head: derived.headSha,
      reviewed: opts.reviewed,
      class: derived.classKind,
      route,
      currency: CURRENCY_ROUTES.includes(route),
      posted,
      marker,
    }, null, 2)}\n`);
    return;
  }

  // verify
  if (opts.head !== undefined && !new RegExp(`^${HEX40}$`, "u").test(String(opts.head))) throw new Error("--head must be a 40-hex commit SHA");
  const inline = readComments(opts);
  if (!inline && !opts.pr) throw new Error(`verify needs --pr or --comments-json\n\n${USAGE}`);
  const forge = inline ? null : forgePr(opts.pr, { repo });
  const head = opts.head ?? forge?.head;
  if (!new RegExp(`^${HEX40}$`, "u").test(String(head ?? ""))) throw new Error("--head is required when it cannot be read from the PR");
  const marker = latestRepairReceipt(inline ?? forge.comments);
  if (!marker) {
    process.stdout.write(`${JSON.stringify({ contract: REPAIR_CONTRACT, current: false, currency: false, status: "absent", head, route: "RE-REVIEW-REQUIRED", reason: "no repair receipt in the PR comments" }, null, 2)}\n`);
    process.exitCode = 3;
    return;
  }
  // Re-derive at the judged head from the marker's own reviewed head and unit;
  // a marker naming an unreadable unit is evidence of nothing, not an error path.
  let facts;
  try {
    facts = await collectRepairFacts({ root, unit: marker.unit, reviewed: marker.reviewed, head });
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ contract: REPAIR_CONTRACT, current: false, currency: false, status: "stale", head, marker, route: "RE-REVIEW-REQUIRED", reason: error.message }, null, 2)}\n`);
    process.exitCode = 4;
    return;
  }
  const judged = judgeRepair({ marker, headSha: head, derived: facts.derived });
  const report = {
    contract: REPAIR_CONTRACT,
    status: judged.currency ? "current" : "stale",
    current: judged.current,
    currency: judged.currency,
    head,
    marker,
    route: judged.route,
    reason: judged.reason,
    class: facts.derived.classKind,
    gate: { status: facts.gate.status, stalePaths: facts.gate.stalePaths },
    acceptance: { state: facts.acceptance.state, declared: facts.acceptance.declared, computed: facts.acceptance.computed },
    openBlocking: facts.derived.openBlocking,
    paths: facts.paths,
    mergeBase: mergeBase(gitAt(root), marker.reviewed, head),
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = judged.currency ? 0 : 4;
}

/** The command's entry: a git, forge or filesystem failure is a named refusal. */
export function main(argv = process.argv.slice(2), options = {}) {
  return dispatch(argv, options).catch((error) => {
    process.stderr.write(`repair-receipt: ${error.message}\n`);
    return 1;
  });
}
