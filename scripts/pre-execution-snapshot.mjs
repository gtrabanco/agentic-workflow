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
 *        [--dir <artifact-dir>] [--unit-kind feature|fix] [--receipt <id|64-hex>]
 *        [--parent <64-hex>] [--policy <version>] [--artifact-revision <id>]
 *        [--source-revision <sha>]
 *   node scripts/pre-execution-snapshot.mjs contract
 *
 * Exit codes: 0 fresh / digest printed · 1 usage or refused snapshot ·
 * 3 no receipt for that stage · 4 receipt exists but is no longer current.
 *
 * Two things this file owns and the package does not: which bytes of *this*
 * repository enter a snapshot (the stage tables and context list below), and the
 * attribution a receipt-only consumer can still prove. `verify` holds the digest
 * the receipt recorded, never the reviewed snapshot object, so it names the drifted
 * dimension from the identity lines the receipt itself pins plus git evidence over
 * the bound paths — in the schema comparator's documented precedence, so the code
 * it prints is the code the contract answers (`attributeFreshness`). It never
 * fabricates a reviewed object to feed the comparator: that would be evidence
 * forgery wearing a real reason code.
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

/**
 * git, bound to a root. The CLI always runs at `repoRoot`; the parameter exists so
 * the two repository facts below (which revision the bound bytes sit at, which of
 * them moved) are testable against a throwaway repository instead of only against
 * the one under review.
 */
const gitAt = (root) => (...args) => {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim(); } catch { return ""; }
};
const git = gitAt(repoRoot);
const GIT_REVISION = /^[a-f0-9]{40}$|^[a-f0-9]{64}$/;
const isRevision = (value) => GIT_REVISION.test(String(value ?? ""));
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

/**
 * RS3(b) — the newest commit that actually touched one of the bound paths.
 *
 * This is what `sourceRevision`/`artifactRevisionId` default to. Defaulting them to
 * live `HEAD` made every commit — including the one that writes a receipt block
 * into `progress.md`, and every unrelated implementation commit — rotate a digest
 * over unchanged bytes, so a receipt could not survive being recorded. A
 * content-derived revision moves exactly once per real edit of a bound path, which
 * is the only movement a content-bound verdict is supposed to answer.
 *
 * The `HEAD` fallback is honest about its own weakness: a unit whose bound paths
 * are not in git yet (an uncommitted planning branch) has no commit that touched
 * them, so the revision it was read at is the working revision. Once the unit is
 * committed the derivation is exact.
 */
export function contentRevision(gitRun, boundPaths) {
  const touched = gitRun("log", "-1", "--format=%H", "--", ...boundPaths);
  if (isRevision(touched)) return touched;
  const head = gitRun("rev-parse", "HEAD");
  return isRevision(head) ? head : null;
}

/**
 * The bound paths whose bytes differ between the revision a receipt recorded and
 * the worktree the consumer is standing in: a committed edit, an uncommitted edit,
 * and a path that entered the snapshot after it was committed all read as changed.
 *
 * `git log <rev>..<rev>` cannot be trusted for "did anything move", so this uses
 * the cheapest exact question git can answer: `diff --name-only <rev>` compares that
 * revision against the worktree over exactly the paths the snapshot binds, and
 * `ls-files --others` adds the rows git never saw. An unparsable recorded revision
 * yields no evidence, which `attributeFreshness` reports as an unattributed drift
 * rather than inventing a cause.
 */
export function changedBoundPaths(gitRun, sourceRevision, boundPaths) {
  if (!isRevision(sourceRevision)) return [];
  const lines = (out) => (out === "" ? [] : out.split("\n").filter(Boolean));
  const tracked = lines(gitRun("diff", "--name-only", sourceRevision, "--", ...boundPaths));
  const untracked = lines(gitRun("ls-files", "--others", "--exclude-standard", "--", ...boundPaths));
  return [...new Set([...tracked, ...untracked].map(normalize))].sort();
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
  const artifactPaths = files.map((row) => row.path);
  const contextPaths = CONTEXT_SOURCES.map((source) => source.file);
  // The paths the snapshot binds, in one sorted list: what a revision is derived
  // from and what a drift report may name are the same set by construction.
  const boundPaths = [...new Set([...artifactPaths, ...contextPaths])].sort();
  if (stage === "plan" && unitKind === "feature" && !opts.parent) {
    // RS14: `plan-stage-requires-parent` is a deliberate contract rule, but a
    // pointer to `/parentSpecSnapshotDigest` tells a consumer nothing they can act
    // on. Name the remedy, because the CLI shares the builder with `verify`.
    const self = path.relative(repoRoot, fileURLToPath(import.meta.url));
    throw new Error("a feature plan snapshot requires --parent <64-hex>: the digest of this unit's `stage: spec` snapshot — "
      + `build it with \`node ${self} build --stage spec --unit ${unit}\` and pass the digest it prints `
      + "(a fix unit binds no parent at all: it has no Product half to bind, D6)");
  }
  const needsDefault = !opts["source-revision"] || !opts["artifact-revision"];
  const identity = needsDefault ? contentRevision(git, boundPaths) : null;
  if (needsDefault && identity === null) {
    throw new Error(`no git revision covers the bound paths of ${dir} (live HEAD: ${head || "none"}): commit the artifacts, or pass --source-revision/--artifact-revision`);
  }
  const input = {
    stage,
    unitKind,
    unitId: unit,
    sourceRevision: opts["source-revision"] || identity,
    artifactRevisionId: opts["artifact-revision"] || identity,
    files,
    contexts,
  };
  if (opts.parent) input.parentSpecSnapshotDigest = opts.parent;
  const built = buildPreExecutionArtifactSnapshot(input);
  if (!built.ok) {
    const codes = built.diagnostics.map((d) => `${d.code}@${d.path ?? ""}`).join(", ");
    throw new Error(`snapshot refused: ${codes}`);
  }
  return {
    snapshot: built.snapshot,
    digest: await digestPreExecutionArtifactSnapshot(built.snapshot),
    boundPaths,
    artifactPaths,
    contextPaths,
  };
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
  return text.split(/^## Pre-execution review receipt v1 — /m).slice(1).map((chunk) => ({
    stage: chunk.startsWith("spec") ? "spec" : chunk.startsWith("plan") ? "plan" : "unknown",
    id: fieldFrom(chunk, "Review"),
    snapshot: fieldFrom(chunk, "Snapshot"),
    verdict: fieldFrom(chunk, "Verdict"),
    unit: fieldFrom(chunk, "Unit"),
    unitKind: fieldFrom(chunk, "Unit kind"),
    sourceRevision: fieldFrom(chunk, "Source revision"),
    artifactRevision: fieldFrom(chunk, "Artifact revision"),
    // A SPEC block writes `Parent: null`, a Plan block writes
    // `Parent SPEC snapshot: <64-hex>`; either line is the lineage this receipt states.
    parent: fieldFrom(chunk, "Parent SPEC snapshot") ?? fieldFrom(chunk, "Parent"),
    authorExclusion: fieldFrom(chunk, "Author exclusion"),
    contextClean: fieldFrom(chunk, "Context clean"),
    policy: fieldFrom(chunk, "Policy"),
  }));
}

const DIGEST64 = /^[a-f0-9]{64}$/;
const NULL_WORDS = new Set(["null", "none", "n/a", "na", "—", "-", ""]);

/** A recorded line as a comparable value: backticks and a `sha256:` prefix are dress. */
function recordedValue(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/`/g, "").trim();
  const bare = text.startsWith("sha256:") ? text.slice(7).trim() : text;
  return NULL_WORDS.has(bare.toLowerCase()) ? null : bare;
}

/** A recorded line that must be a digest, or `null` when the receipt binds nothing. */
const recordedDigest = (value) => {
  const text = recordedValue(value);
  return text !== null && DIGEST64.test(text) ? text : null;
};

/**
 * RS13 — which dimension of a bound receipt stopped being true.
 *
 * The schema comparator answers this question from two snapshot objects; a consumer
 * that only has the digest a receipt recorded cannot hand it one without inventing
 * it, and an invented "reviewed" object would make the answer meaningless. So this
 * function compares what the receipt *itself* pins — its bound digest, Stage, Unit,
 * Unit kind, Policy, Source revision, Parent SPEC snapshot and Artifact revision
 * lines — against the snapshot re-derived from the bytes on disk, and it uses the
 * caller's git evidence (`changedBoundPaths`) only for the two dimensions a receipt
 * cannot state: the bound artifact bytes and the bound authorities.
 *
 * The order is `comparePreExecutionReceiptToSnapshot`'s documented precedence, and
 * `scripts/pre-execution-attribution.test.mjs` proves the two agree dimension by
 * dimension against the real comparator. `missing-receipt-snapshot` keeps its true
 * meaning: precedence 1 is "this receipt binds no digest I can read", never
 * "something moved and I could not tell you what".
 */
export function attributeFreshness({
  recorded = {}, snapshot, observedDigest, policyVersion,
  changedArtifacts = [], changedContexts = [],
} = {}) {
  const bound = recordedDigest(recorded.snapshot);
  const paths = [...new Set([...changedContexts, ...changedArtifacts])].sort();
  const report = (reasonCode, detail, named = []) => {
    // The published vocabulary is the only one this sensor may speak: a code that
    // drifted from the package would read as a real freshness answer to every
    // consumer (`execute-phase`, `workflow-status`, `audit-pr`) that keys on it.
    if (!PRE_EXECUTION_FRESHNESS_CODES.includes(reasonCode)) {
      throw new Error(`attribution invented a code outside the published vocabulary: ${reasonCode}`);
    }
    return Object.freeze({
      fresh: false, reasonCode, detail, changedPaths: Object.freeze([...named]),
    });
  };
  if (bound === null) {
    return report("missing-receipt-snapshot",
      "the receipt records no parsable snapshot digest, so nothing here is bound to it");
  }
  const fresh = Object.freeze({
    fresh: true, detail: "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    changedPaths: Object.freeze([]),
  });
  const recordedStage = recordedValue(recorded.stage);
  if (recordedStage !== null && recordedStage !== snapshot.stage) {
    return report("invalid-stage", `the receipt records Stage: ${recordedStage}, the reviewed target is ${snapshot.stage}`);
  }
  const recordedUnit = recordedValue(recorded.unit);
  const recordedKind = recordedValue(recorded.unitKind);
  if ((recordedUnit !== null && recordedUnit !== snapshot.unitId)
    || (recordedKind !== null && recordedKind !== snapshot.unitKind)) {
    const seen = [`Unit: ${recordedUnit ?? "(unrecorded)"}`];
    if (recordedKind !== null) seen.push(`Unit kind: ${recordedKind}`);
    return report("invalid-unit", `${seen.join(" · ")} is not the reviewed target ${snapshot.unitId} (${snapshot.unitKind})`);
  }
  const recordedPolicy = recordedValue(recorded.policy) ?? "";
  if (recordedPolicy !== policyVersion) {
    return report("stale-policy", `the receipt was produced under Policy: ${recordedPolicy || "(unrecorded)"}, the current policy is ${policyVersion}`);
  }
  // The identity lines a receipt states are assertions, not decoration, so they are
  // checked before a matching digest may answer FRESH: a receipt that binds the
  // digest of one snapshot while recording another one's lineage is inconsistent,
  // and "nothing moved" would be the wrong comfort. From here the dimensions below
  // are ordered exactly as the comparator orders them.
  if (changedContexts.length > 0) {
    return report("stale-context", `an authority the reviewer relied on moved: ${changedContexts.join(", ")}`, changedContexts);
  }
  const recordedSource = recordedValue(recorded.sourceRevision);
  if (recordedSource !== snapshot.sourceRevision) {
    // A revision moved because bound bytes moved, so every moved path is evidence for
    // THIS dimension and may be named.
    return report("stale-source-revision", `the artifacts were reviewed at ${recordedSource ?? "(unrecorded revision)"}, the bound bytes now sit at ${snapshot.sourceRevision}`, paths);
  }
  const parentLine = recordedValue(recorded.parent);
  const recordedParent = parentLine === null ? null : recordedDigest(recorded.parent);
  if (recordedParent !== snapshot.parentSpecSnapshotDigest) {
    // Nothing is named here on purpose: the parent is lineage over the PRODUCT
    // snapshot, not a row bound by this one. Naming this snapshot's own moved files
    // would read as "the plan artifacts caused the lineage drift", which is a lie
    // about the causal chain even when both are true of the same commit.
    return report("stale-parent", `the receipt descends from Parent SPEC snapshot: ${recorded.parent ?? "(no line recorded)"}, the current Product snapshot is ${snapshot.parentSpecSnapshotDigest}`);
  }
  if (changedArtifacts.length > 0) {
    return report("stale-artifact-content", `bound artifact bytes moved since the receipt: ${changedArtifacts.join(", ")}`, changedArtifacts);
  }
  const recordedArtifactRevision = recordedValue(recorded.artifactRevision);
  if (recordedArtifactRevision !== snapshot.artifactRevisionId) {
    return report("stale-artifact-revision", `the authoring revision rotated to ${snapshot.artifactRevisionId} from ${recordedArtifactRevision ?? "(unrecorded)"} with no bound byte moved`);
  }
  // Every assertion the receipt states holds and git named no moved path: if the
  // digest it bound is the digest the bytes carry, the reviewed object IS this
  // object — collision-free, so there is nothing left to drift.
  if (bound === recordedValue(observedDigest)) return fresh;
  // The digests differ anyway: the only remaining members of the snapshot are the artifact and
  // context rows, so content is the honest answer — said out loud as an
  // elimination rather than presented as observed movement.
  return report("stale-artifact-content",
    "attributed by elimination: every identity line the receipt records still matches, so a bound row's bytes moved without a git-visible change to name (an unrecorded revision, an untracked path, or rewritten history)");
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
  const { snapshot, digest, artifactPaths, contextPaths } = await buildSnapshot(opts);
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
  // RS13 — the drift is attributed from the lines this receipt pins plus git
  // evidence over exactly the paths the snapshot binds. The schema comparator is
  // never handed the current object twice: that fabricated "reviewed" side is what
  // made every stale receipt answer precedence-1 `missing-receipt-snapshot` and
  // could name no moved file. `pre-execution-attribution.test.mjs` proves this path
  // answers what the comparator answers, dimension by dimension, in its precedence.
  const moved = changedBoundPaths(git, receipt.sourceRevision, [...artifactPaths, ...contextPaths]);
  const structural = attributeFreshness({
    recorded: receipt,
    snapshot,
    observedDigest: digest,
    policyVersion: opts.policy ?? "v1",
    changedArtifacts: moved.filter((p) => artifactPaths.includes(p)),
    changedContexts: moved.filter((p) => contextPaths.includes(p)),
  });
  const report = {
    // Fails closed on an inconsistent receipt: a bound digest that matches while its
    // own lineage lines do not is not evidence that anything was reviewed.
    current: structural.fresh && receipt.verdict === (opts.stage === "spec" ? "spec-review-pass" : "plan-review-pass"),
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

// Importable without side effects: `pre-execution-attribution.test.mjs` imports
// `attributeFreshness` to prove the sensor agrees with the contract, and a CLI that
// ran itself on import would answer a usage error into every importer's exit status.
// Spawned as `node scripts/pre-execution-snapshot.mjs …` this path still matches.
const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    process.stderr.write(`pre-execution-snapshot: ${error.message}\n`);
    process.exitCode = 1;
  });
}
