#!/usr/bin/env node
/**
 * Pre-execution snapshot + receipt sensor — the mechanical half of feature 28.
 *
 * One executable recipe for the three roles that must agree on a digest:
 *
 *   · a reviewer (`review-spec`, `review-plan`) builds the snapshot its verdict
 *     binds to;
 *   · a consumer (`execute-phase`, `audit-pr`, `workflow-status`) re-derives the
 *     digest from the bytes on disk and compares it with the receipt's;
 *   · a test asserts the vocabularies it prints are the published ones.
 *
 * Every value comes from `@gtrabanco/agentic-workflow-schema`, so the CLI cannot
 * drift from the contract it prints. `git hash-object` is NOT a substitute: a
 * snapshot digest is the canonical SHA-256 over the snapshot object, not a git
 * blob id (git blob ids stay the acceptance-manifest convention).
 *
 * Usage
 *   node scripts/pre-execution-snapshot.mjs build --stage spec|plan --unit <id>
 *        [--dir <artifact-dir>] [--unit-kind feature|fix]
 *        [--artifact-revision <id>] [--source-revision <sha>]
 *        [--parent <64-hex>] [--json <out-file>]
 *   node scripts/pre-execution-snapshot.mjs verify --stage spec|plan --unit <id>
 *        [--dir <artifact-dir>] [--receipt <id|64-hex>]
 *   node scripts/pre-execution-snapshot.mjs contract
 *
 * Exit codes: 0 fresh / digest printed · 1 usage or refused snapshot ·
 * 3 no receipt for that stage · 4 receipt exists but is no longer current.
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(repoRoot, "packages", "agentic-workflow-schema", "dist", "index.js");
const schema = fs.existsSync(schemaPath)
  ? require(schemaPath)
  : require("@gtrabanco/agentic-workflow-schema");

const {
  buildPreExecutionArtifactSnapshot,
  digestPreExecutionArtifactSnapshot,
  comparePreExecutionReceiptToSnapshot,
  PRE_EXECUTION_RECEIPT_CONTRACT_ID,
  PRE_EXECUTION_STAGES,
  PRE_EXECUTION_ARTIFACT_KINDS,
  PRE_EXECUTION_CONTEXT_KINDS,
  PRE_EXECUTION_SELECTORS,
  PRE_EXECUTION_FRESHNESS_CODES,
  PRE_EXECUTION_VERDICTS,
} = schema;

/**
 * Artifact rows per stage — the same lists `review-spec`/`review-plan` publish.
 * A required file that is absent is refused (a silent omission would bind a
 * smaller set than the contract reviewed); an optional one is skipped because an
 * XS/S or fix unit legitimately embeds its ledgers in the SPEC (D20) and a fix
 * unit has no PLAN/architecture notes at all.
 */
const STAGE_ARTIFACTS = {
  spec: [
    { kind: "spec", file: "SPEC.md", selector: "spec-product-v1", required: true },
  ],
  plan: [
    { kind: "spec", file: "SPEC.md", required: true },
    { kind: "acceptance", file: "ACCEPTANCE.md", required: true },
    { kind: "planning-evidence", file: "planning-evidence.md", required: false },
    { kind: "obligations", file: "planning-obligations.md", required: false },
    { kind: "plan", file: "PLAN.md", required: false },
    { kind: "tasks", file: "TASKS.md", required: false },
    { kind: "testing", file: "testing.md", required: false },
    { kind: "decisions", file: "decisions.md", required: false },
    { kind: "architecture-notes", file: "architecture-notes.md", required: false },
  ],
};

const CONTEXT_SOURCES = [
  { kind: "roadmap-row", file: "docs/features/ROADMAP.md", identifier: "roadmap-row" },
  { kind: "project-guide", file: "CLAUDE.md" },
  { kind: "normalized-repository-state", file: "docs/workflow/REPOSITORY_STATE.md" },
  // The *project's* declared invariants only: docs/workflow/WORKFLOW_INVARIANTS.md
  // is the portable evaluation contract, never a project's rule set, so binding it
  // would report presence where the project declared none.
  { kind: "architectural-invariants", file: "docs/architecture/ARCHITECTURAL_INVARIANTS.md" },
];

function parseArgs(argv) {
  const action = argv[0];
  const opts = {};
  const valueFlags = new Set(["--stage", "--unit", "--dir", "--unit-kind", "--artifact-revision",
    "--source-revision", "--parent", "--receipt", "--json", "--policy"]);
  for (let i = 1; i < argv.length; i += 1) {
    const token = argv[i];
    if (valueFlags.has(token)) { opts[argv[i].replace(/^--/, "")] = argv[i + 1]; i += 1; continue; }
    if (token.startsWith("--")) { opts[token.replace(/^--/, "")] = true; }
  }
  return { action, opts };
}

const git = (...args) => {
  try { return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim(); }
  catch { return ""; }
};
const normalize = (p) => path.relative(repoRoot, path.resolve(repoRoot, p)).split(path.sep).join("/");
const contained = (rel) => {
  // Agent-supplied ids/paths (unit, dir, json) must never reach outside the
  // repository: normalize preserves `../` escapes, so refuse them explicitly.
  if (rel.startsWith("../") || rel === ".." || path.isAbsolute(rel)) {
    throw new Error(`path escapes the repository: ${rel}`);
  }
  return rel;
};
const readRepo = (rel) => {
  const abs = path.join(repoRoot, rel);
  // lstat, not stat: a symlinked artifact must read as absent, never followed —
  // out-of-repo bytes must not enter the snapshot digest invisibly.
  return fs.existsSync(abs) && fs.lstatSync(abs).isFile() ? fs.readFileSync(abs, "utf8") : null;
};

function unitDir(opts) {
  if (opts.dir) return contained(normalize(opts.dir));
  if (opts.unit.startsWith("fix-")) return contained(normalize(path.join("docs/fix", opts.unit.slice(4))));
  return contained(normalize(path.join("docs/features", opts.unit)));
}

async function buildSnapshot(opts) {
  const { stage, unit } = opts;
  if (!PRE_EXECUTION_STAGES.includes(stage)) throw new Error(`--stage must be ${PRE_EXECUTION_STAGES.join("|")}`);
  const dir = unitDir(opts);
  const unitKind = opts["unit-kind"] ?? (dir.startsWith("docs/fix/") ? "fix" : "feature");
  const files = [];
  const refused = [];
  for (const row of STAGE_ARTIFACTS[stage]) {
    const rel = normalize(path.join(dir, row.file));
    const content = readRepo(rel);
    if (content === null) {
      if (row.required) refused.push(rel);
      continue;
    }
    const entry = { kind: row.kind, path: rel, content };
    if (row.selector) entry.selector = row.selector;
    files.push(entry);
  }
  if (refused.length) throw new Error(`required artifact(s) absent: ${refused.join(", ")}`);
  if (stage === "plan" && unitKind === "feature"
    && !files.some((f) => f.kind === "planning-evidence") && !files.some((f) => f.kind === "obligations")) {
    // A feature unit with neither ledger is exactly the legacy state: bindable,
    // but the caller must say so out loud rather than let it look like a full set.
    process.stderr.write(`note: ${unit} has no planning ledgers — legacy adoption state (pre-feature-28)\n`);
  }
  const contexts = CONTEXT_SOURCES.map((source) => {
    const content = readRepo(source.file);
    // `presence` carries the absent fact; the identifier stays an opaque id, and
    // the schema's pattern refuses spaces in it.
    return content === null
      ? { kind: source.kind, identifier: source.identifier ?? source.file, presence: "absent" }
      : { kind: source.kind, identifier: source.identifier ?? source.file, content };
  });
  const head = git("rev-parse", "HEAD");
  const input = {
    stage,
    unitKind,
    unitId: unit,
    sourceRevision: opts["source-revision"] || head,
    artifactRevisionId: opts["artifact-revision"] || head,
    files,
    contexts,
  };
  if (opts.parent) input.parentSpecSnapshotDigest = opts.parent;
  const built = buildPreExecutionArtifactSnapshot(input);
  if (!built.ok) {
    const codes = built.diagnostics.map((d) => `${d.code}@${d.path ?? ""}`).join(", ");
    throw new Error(`snapshot refused: ${codes}`);
  }
  return { snapshot: built.snapshot, digest: await digestPreExecutionArtifactSnapshot(built.snapshot) };
}

const FIELD_RES = new Map();
const fieldFrom = (chunk, label) => {
  let re = FIELD_RES.get(label);
  if (!re) FIELD_RES.set(label, (re = new RegExp(`${label}:\\s*([^\\n·]+)`)));
  const m = chunk.match(re);
  return m ? m[1].replace(/[`]/g, "").trim() : null;
};
function receipts(dir) {
  const text = readRepo(normalize(path.join(dir, "progress.md")));
  if (text === null) return [];
  return text.split(/^## Pre-execution review receipt v1 — /m).slice(1).map((chunk) => {
    const stage = chunk.startsWith("spec") ? "spec" : chunk.startsWith("plan") ? "plan" : "unknown";
    return {
      stage,
      id: fieldFrom(chunk, "Review"),
      snapshot: fieldFrom(chunk, "Snapshot"),
      verdict: fieldFrom(chunk, "Verdict"),
      unit: fieldFrom(chunk, "Unit"),
      artifactRevision: fieldFrom(chunk, "Artifact revision"),
      parent: fieldFrom(chunk, "Parent SPEC snapshot"),
      authorExclusion: fieldFrom(chunk, "Author exclusion"),
      contextClean: fieldFrom(chunk, "Context clean"),
      policy: fieldFrom(chunk, "Policy"),
    };
  });
}

async function main() {
  const { action, opts } = parseArgs(process.argv.slice(2));
  if (action === "contract") {
    process.stdout.write(`${JSON.stringify({
      receiptContract: PRE_EXECUTION_RECEIPT_CONTRACT_ID,
      stages: PRE_EXECUTION_STAGES,
      artifactKinds: PRE_EXECUTION_ARTIFACT_KINDS,
      selectors: PRE_EXECUTION_SELECTORS,
      contextKinds: PRE_EXECUTION_CONTEXT_KINDS,
      freshnessCodes: PRE_EXECUTION_FRESHNESS_CODES,
      verdicts: PRE_EXECUTION_VERDICTS,
    }, null, 2)}\n`);
    return;
  }
  if (!action || !["build", "verify"].includes(action) || !opts.stage || !opts.unit) {
    throw new Error("usage: pre-execution-snapshot.mjs build|verify --stage <spec|plan> --unit <id> [--dir <path>] [--receipt <id|digest>]");
  }
  const { snapshot, digest } = await buildSnapshot(opts);
  const dir = unitDir(opts);

  if (action === "build") {
    if (opts.json) fs.writeFileSync(path.resolve(repoRoot, contained(normalize(opts.json))), `${JSON.stringify({ snapshot, digest }, null, 2)}\n`);
    process.stdout.write(`${digest}\n`);
    if (!opts.json) process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
    return;
  }

  const rows = receipts(dir).filter((r) => r.stage === opts.stage);
  const wanted = opts.receipt;
  const receipt = wanted
    ? rows.find((r) => r.id === wanted || r.snapshot === wanted)
    : rows[rows.length - 1];
  if (!receipt) {
    process.stdout.write(`${JSON.stringify({
      current: false, code: "missing-receipt-snapshot", stage: opts.stage, unit: opts.unit,
      seen: rows.map((r) => ({ id: r.id, verdict: r.verdict, snapshot: r.snapshot })),
    }, null, 2)}\n`);
    process.exitCode = 3;
    return;
  }
  const bound = receipt.snapshot && /^sha256:[0-9a-f]{64}$/.test(receipt.snapshot)
    ? receipt.snapshot.slice(7) : receipt.snapshot;
  const digestMatches = Boolean(bound) && (bound === digest || `sha256:${bound}` === `sha256:${digest}`);
  // The recorded Policy line is the receipt's own policy version; verify compares
  // it against the CURRENT policy (--policy, default "v1" per POLICY.md), so a
  // receipt recorded under a moved policy can no longer read as fresh.
  const structural = await comparePreExecutionReceiptToSnapshot(
    { contract: PRE_EXECUTION_RECEIPT_CONTRACT_ID, snapshotDigest: bound ?? "", policyVersion: receipt.policy ?? "" },
    snapshot, snapshot, opts.policy ?? "v1",
  );
  const report = {
    current: digestMatches && receipt.verdict === (opts.stage === "spec" ? "spec-review-pass" : "plan-review-pass"),
    stage: opts.stage,
    unit: opts.unit,
    receipt: { id: receipt.id, verdict: receipt.verdict, snapshot: receipt.snapshot, authorExclusion: receipt.authorExclusion, contextClean: receipt.contextClean, policy: receipt.policy },
    observedDigest: digest,
    digestMatches: Boolean(digestMatches),
    verdictIsPass: receipt.verdict === (opts.stage === "spec" ? "spec-review-pass" : "plan-review-pass"),
    structural,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.current) process.exitCode = report.receipt.verdict ? 4 : 3;
}

main().catch((error) => {
  process.stderr.write(`pre-execution-snapshot: ${error.message}\n`);
  process.exitCode = 1;
});
