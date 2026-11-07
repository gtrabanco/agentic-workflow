#!/usr/bin/env node

/**
 * batch-scheduler — the deterministic batch planner (issue #449).
 *
 * One pass over the live work graph that emits the fixed `batch-plan@1`
 * document (schema package: `agentic-workflow/batch-plan`): which open issues
 * can run together now (batch 1), which come next (batch N+1…), which surface
 * each lane occupies, and which spots are unresolvable — always findings,
 * never silent omissions.
 *
 * Standing constraints, enforced mechanically:
 *   - hard blockers (native `blocked-by`, authoritative per the #442 contract)
 *     gate an issue into a later batch;
 *   - soft dependencies (the prose `## Dependencies` rows) order issues within
 *     and across batches without ever gating batch membership;
 *   - one lane per touched surface — issues sharing a surface serialize in
 *     that lane (surface-conflict), disjoint surfaces run in disjoint lanes;
 *   - measured-size hints are reported per issue and per lane; the lane-count
 *     decision is the consumer's.
 *
 * The planner is not an orchestrator: it never spawns sessions, never creates
 * worktrees, never launches units. `worktree` and `command` are reported
 * strings. The single write path is its own state file
 * (`.agentic-workflow/batches.json` by default — untracked and durable, so a
 * re-run recognizes lanes already claimed/launched); `--no-state` reads pure.
 *
 * Relations and surfaces are read from where they live — forge (native
 * `blocked-by` + issue bodies), `docs/ROADMAP.md`, unit docs on disk — through
 * the same shared parsers `workflow-status.mjs` uses. Nothing is re-declared
 * here. No decision model exists anywhere in the path (#444 adds the optional
 * signal layer over this deterministic half).
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readRoadmapIndex, roadmapTableRows } from "../packages/agentic-workflow/src/index-document.mjs";

/** The state file's name, under `<root>/.agentic-workflow/` (untracked, durable). */
export const STATE_FILE_NAME = "batches.json";

const STATE_VERSION = 1;
const SIZE_ORDER = { light: 0, mixed: 1, heavy: 2 };
const SIZE_FROM_TOKEN = { S: "light", M: "light", L: "heavy", XL: "heavy" };
const REVISION_RE = /^[0-9a-f]{7,40}$/u;
const ZERO_REVISION = "0000000000000000000000000000000000000000";

// ── forge collection ───────────────────────────────────────────────────────

/**
 * Collect the open issues. Offline-first: `--issues-file <json>` injects a
 * previously fetched array (the tests' fixture path and an operator's cache);
 * the live path is one `gh issue list` call plus one GraphQL call for the
 * native `blocked-by` relations. Any failure degrades declared
 * (`unavailable-<source>-<cause>`), never crashes into a silent empty plan.
 *
 * @returns {Promise<{issues: Array<{number:number,title:string,body:string,blockedBy:number[],labels:string[]}>, degradations: string[]}>}
 */
export async function collectIssues({ issuesFile, ghBin = "gh", remote = null } = {}) {
  if (issuesFile) {
    const degradations = [];
    let raw = null;
    try {
      raw = JSON.parse(fs.readFileSync(issuesFile, "utf8"));
      if (!Array.isArray(raw)) throw new Error("issues fixture is not a JSON array");
    } catch (cause) {
      degradations.push(`unavailable-forge-issues-file-${sanitizeCause(cause)}`);
      return { issues: [], degradations, relationsKnown: false };
    }
    // A cache that carries the native relations needs no forge call; one that
    // does not (a plain `gh issue list` export) fetches them live, best-effort.
    const hasRelations = raw.every((i) => i !== null && typeof i === "object" && Array.isArray(i.blockedBy));
    const issues = normalizeIssues(raw);
    if (hasRelations) return { issues, degradations, relationsKnown: true };
    const relations = await fetchRelations({ ghBin, remote, degradations });
    return {
      issues: issues.map((issue) => ({ ...issue, blockedBy: relations.get(issue.number) ?? [] })),
      degradations,
      relationsKnown: relations.size > 0 || degradations.length === 0,
    };
  }
  return collectIssuesLive({ ghBin, remote });
}

async function collectIssuesLive({ ghBin, remote }) {
  const degradations = [];
  let listed = null;
  try {
    const run = spawnSync(
      ghBin,
      ["issue", "list", "--state", "open", "--limit", "200", "--json", "number,title,body,labels"],
      { encoding: "utf8", timeout: 30000 },
    );
    if (run.error) throw run.error;
    if (run.status !== 0) throw new Error((run.stderr || "gh issue list failed").trim().split("\n")[0]);
    listed = JSON.parse(run.stdout);
  } catch (cause) {
    degradations.push(`unavailable-forge-issue-list-${sanitizeCause(cause)}`);
    return { issues: [], degradations, relationsKnown: false };
  }

  const relations = await fetchRelations({ ghBin, remote, degradations });
  const issues = normalizeIssues(listed).map((issue) => ({ ...issue, blockedBy: relations.get(issue.number) ?? [] }));
  return { issues, degradations, relationsKnown: relations.size > 0 || issues.length === 0 };
}

/**
 * One GraphQL call for the native `blocked-by` relations of the open issues.
 * Failures push a degradation and return an empty map — the plan then skips
 * the prose/native agreement check (it needs native data) and says so.
 */
async function fetchRelations({ ghBin, remote, degradations }) {
  const relations = new Map();
  const origin = remote ?? gitOriginUrl();
  const parsed = origin !== null ? parseOrigin(origin) : null;
  if (parsed === null) {
    degradations.push("unavailable-forge-blocked-by-no-origin");
    return relations;
  }
  try {
    const query =
      'query{repository(owner:"' + parsed.owner + '",name:"' + parsed.name + '"){'
      + "issues(first:100,states:OPEN){nodes{number blockedBy(first:20){nodes{number}}}}}}";
    const run = spawnSync(ghBin, ["api", "graphql", "-f", `query=${query}`], { encoding: "utf8", timeout: 30000 });
    if (run.error) throw run.error;
    if (run.status !== 0) throw new Error((run.stderr || "gh api failed").trim().split("\n")[0]);
    for (const node of JSON.parse(run.stdout).data.repository.issues.nodes) {
      relations.set(node.number, node.blockedBy.nodes.map((n) => n.number));
    }
  } catch {
    degradations.push("unavailable-forge-blocked-by-graphql-error");
  }
  return relations;
}

function gitOriginUrl() {
  const run = spawnSync("git", ["remote", "get-url", "origin"], { encoding: "utf8", timeout: 10000 });
  if (run.status !== 0) return null;
  return run.stdout.trim() || null;
}

/** `git@host:owner/repo.git` or `https://host/owner/repo.git` → {owner, name}. */
function parseOrigin(url) {
  const ssh = /^git@[^:]+:([^/]+)\/(.+?)(?:\.git)?$/u.exec(url);
  if (ssh) return { owner: ssh[1], name: ssh[2] };
  const https = /^https?:\/\/[^/]+\/([^/]+)\/(.+?)(?:\.git)?$/u.exec(url);
  if (https) return { owner: https[1], name: https[2] };
  return null;
}

function normalizeIssues(raw) {
  return raw
    .filter((i) => typeof i?.number === "number")
    .map((i) => ({
      number: i.number,
      title: typeof i.title === "string" ? i.title : "",
      body: typeof i.body === "string" ? i.body : "",
      blockedBy: Array.isArray(i.blockedBy) ? i.blockedBy.filter((n) => typeof n === "number") : [],
      labels: Array.isArray(i.labels)
        ? i.labels.map((l) => (typeof l === "string" ? l : l?.name)).filter((l) => typeof l === "string")
        : [],
    }))
    .sort((a, b) => a.number - b.number);
}

function sanitizeCause(cause) {
  const text = String(cause?.message ?? cause ?? "error").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return text.slice(0, 40) || "error";
}

// ── surfaces, dependencies, sizes (all read from where they live) ─────────

/** Extract `## Where` / `## In scope` (fallback: the whole body) path tokens. */
export function extractSurfaces(body) {
  const sections = [];
  for (const heading of ["## Where", "## In scope"]) {
    const idx = body.indexOf(heading);
    if (idx === -1) continue;
    const rest = body.slice(idx + heading.length);
    const end = rest.indexOf("\n## ");
    sections.push(end === -1 ? rest : rest.slice(0, end));
  }
  const scope = sections.length > 0 ? sections.join("\n") : body;
  const surfaces = new Set();
  for (const match of scope.matchAll(/`([^`]+)`/g)) {
    const clean = match[1].replace(/^\.\//, "");
    const top = clean.split("/")[0];
    if (top === "skills" || top === "packages") {
      const parts = clean.split("/");
      surfaces.add(parts.length >= 2 ? `${parts[0]}/${parts[1]}` : top);
    } else if (["scripts", "docs", "template", ".github"].includes(top)) {
      surfaces.add(top);
    }
  }
  return surfaces;
}

/**
 * Parse the prose `## Dependencies` table (the #442 contract's soft rows and
 * prose-declared hard rows) out of an issue body.
 *
 * @returns {{soft: number[], proseHard: number[]}}
 */
export function extractProseDependencies(body) {
  const idx = body.indexOf("## Dependencies");
  if (idx === -1) return { soft: [], proseHard: [] };
  const rest = body.slice(idx + "## Dependencies".length);
  const end = rest.indexOf("\n## ");
  const section = end === -1 ? rest : rest.slice(0, end);
  const soft = [];
  const proseHard = [];
  for (const line of section.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 4) continue;
    const depCell = cells[1];
    const kindCell = cells[2];
    if (depCell === "Depends on" || /^:?-{2,}:?$/.test(depCell)) continue;
    const kind = kindCell.toLowerCase();
    for (const match of depCell.matchAll(/#(\d+)/g)) {
      const dep = Number(match[1]);
      if (kind.includes("hard") || kind.includes("block")) {
        if (!proseHard.includes(dep)) proseHard.push(dep);
      } else if (!soft.includes(dep)) {
        soft.push(dep);
      }
    }
  }
  return { soft, proseHard };
}

/** Measured-size hint: declared `(S)/(M)/(L)/(XL)` token first, then surface count. */
export function sizeHint(issue, surfaces) {
  const token = /\(([SMLXL])\)/.exec(issue.title) ?? /\(([SMLXL])\)/.exec(issue.body.slice(0, 400));
  if (token) return SIZE_FROM_TOKEN[token[1]];
  if (surfaces.size >= 3) return "heavy";
  if (surfaces.size === 2) return "mixed";
  return "light";
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48).replace(/-+$/, "") || "unit";
}

function worktreeFor(issue) {
  const prefix = issue.labels.includes("bug") ? "fix" : "feat";
  return `${prefix}/${issue.number}-${slugify(issue.title)}`;
}

// ── the plan (pure) ────────────────────────────────────────────────────────

/**
 * Build the batch plan. Pure given its inputs; deterministic for identical
 * inputs (no wall clock anywhere in the document).
 *
 * @param {{
 *   issues: Array<object>,
 *   root: string,
 *   head: string,
 *   previous?: object | null,
 *   degraded?: string[],
 * }} input
 */
export function buildBatchPlan({ issues, root, head, previous = null, degraded = [], relationsKnown = true }) {
  const degradations = [...degraded];
  const openNumbers = new Set(issues.map((i) => i.number));
  const byNumber = new Map(issues.map((i) => [i.number, i]));

  // ── where things live: roadmap state + unit docs on disk ──
  let roadmapText = null;
  try {
    const index = readRoadmapIndex(root);
    roadmapText = index?.text ?? null;
  } catch {
    roadmapText = null;
  }
  if (roadmapText === null) degradations.push("unavailable-roadmap-missing");
  const knownNumbers = new Set();
  if (roadmapText !== null) {
    for (const row of roadmapTableRows(roadmapText, "fix")) {
      for (const match of (row[0] ?? "").matchAll(/#(\d+)/g)) knownNumbers.add(Number(match[1]));
    }
  }
  const unitDirByIssue = new Map();
  for (const dir of listUnitDirs(root)) {
    const match = /(\d+)-/.exec(path.basename(dir));
    if (match) unitDirByIssue.set(Number(match[1]), dir);
  }

  const launched = [];
  const launchedSurfaces = new Map();
  const launchable = [];  for (const issue of issues) {
    const unitDir = unitDirByIssue.get(issue.number);
    if (unitDir) {
      launched.push({ number: issue.number, evidence: `unit-doc ${unitDir}` });
      launchedSurfaces.set(issue.number, extractSurfaces(issue.body));
    } else {
      launchable.push(issue);
    }
  }
  launched.sort((a, b) => a.number - b.number);

  const model = new Map();
  for (const issue of launchable) {
    const surfaces = extractSurfaces(issue.body);
    const surfaceSet = surfaces.size > 0 ? surfaces : new Set(["general"]);
    const prose = extractProseDependencies(issue.body);
    model.set(issue.number, {
      issue,
      surfaces: [...surfaceSet].sort((a, b) => a.localeCompare(b)),
      softAll: prose.soft,
      proseHard: prose.proseHard,
      size: sizeHint(issue, surfaceSet),
    });
  }
  for (const row of model.values()) {
    row.soft = row.softAll.filter((n) => model.has(n));
    row.softOrphans = row.softAll.filter((n) => !model.has(n) && !knownNumbers.has(n));
  }

  const findings = [];
  for (const [number, row] of model) {
    const native = byNumber.get(number)?.blockedBy ?? [];
    if (relationsKnown) {
      // The #442 agreement check needs the native relations; without them a
      // mismatch would be indistinguishable from missing data, so the check
      // skips and the degradation above says so.
      for (const target of row.proseHard) {
        if (native.includes(target)) continue;
        findings.push({
          code: "prose-native-mismatch",
          numbers: [number],
          detail: `prose row declares #${target} hard but no native blocked-by exists (the #442 agreement check); the native relation is authoritative`,
        });
      }
    }
    if (row.softOrphans.length > 0) {
      findings.push({
        code: "orphaned-soft-dep",
        numbers: [number],
        detail: `soft dep targets ${row.softOrphans.map((n) => `#${n}`).join(", ")}, which is neither open nor in the location index`,
      });
    }
  }

  // ── batches: hard blockers gate; soft deps only order (after the layers) ──
  const batchOf = new Map();
  const unmetByIssue = new Map();
  let current = [];
  for (const [number, row] of model) {
    const native = byNumber.get(number)?.blockedBy ?? [];
    const unmet = native.filter((b) => openNumbers.has(b) && b !== number);
    unmetByIssue.set(number, unmet);
    if (unmet.length === 0) current.push(number);
  }
  let batchNumber = 0;
  while (current.length > 0) {
    batchNumber += 1;
    for (const number of current) batchOf.set(number, batchNumber);
    const next = [];
    for (const [number, unmet] of unmetByIssue) {
      if (!batchOf.has(number) && unmet.every((b) => batchOf.has(b))) next.push(number);
    }
    current = next;
  }
  const unresolvable = [...model.keys()].filter((number) => !batchOf.has(number)).sort((a, b) => a - b);
  if (unresolvable.length > 0) {
    findings.push({
      code: "cycle",
      numbers: unresolvable,
      detail: "cyclic (or cycle-downstream) blocked-by wait — no batch can ever satisfy it",
    });
  }

  // Soft ordering across batches: a dependent never runs before its target.
  let moved = true;
  let guard = 0;
  while (moved && guard < 1000) {
    moved = false;
    guard += 1;
    for (const [number, row] of model) {
      const dependentBatch = batchOf.get(number);
      if (dependentBatch === undefined) continue;
      for (const target of row.soft) {
        const targetBatch = batchOf.get(target);
        if (targetBatch !== undefined && targetBatch > dependentBatch) {
          batchOf.set(number, targetBatch);
          moved = true;
        }
      }
    }
  }

  const numbersByBatch = new Map();
  for (const number of [...batchOf.keys()].sort((a, b) => a - b)) {
    const batch = batchOf.get(number);
    if (!numbersByBatch.has(batch)) numbersByBatch.set(batch, []);
    numbersByBatch.get(batch).push(number);
  }
  const normalized = [...numbersByBatch.entries()].sort((a, b) => a[0] - b[0]);
  const batches = normalized.map(([, numbers], index) => ({
    n: index + 1,
    lanes: buildLanes(numbers, model, launched, launchedSurfaces),
  }));

  const blocked = [];
  for (const number of [...unmetByIssue.keys()].sort((a, b) => a - b)) {
    const unmet = unmetByIssue.get(number);
    if (unmet.length === 0) continue;
    const blockers = [...unmet].sort((a, b) => a - b);
    blocked.push({ number, blockers, reason: `blocked-by ${blockers.join(", ")} (open)` });
  }

  findings.sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : a.numbers[0] - b.numbers[0]));

  // Claimed lanes from the previous run's persisted state (S6).
  const previousClaims = previous?.claimed ?? {};
  const claimedNumbers = new Set(Object.keys(previousClaims).map(Number));

  const plan = {
    contract: "agentic-workflow/batch-plan",
    version: 1,
    schema: "batch-plan@1",
    source_revision: head,
    degraded: degradations.sort((a, b) => a.localeCompare(b)),
    batches,
    blocked,
    launched,
    findings,
    summary: {
      open_issues: issues.length,
      batched: batchOf.size,
      blocked: blocked.length,
      launched: launched.length,
      findings: findings.length,
      batches: batches.length,
    },
  };
  for (const lane of plan.batches.flatMap((batch) => batch.lanes)) {
    for (const row of lane.issues) {
      if (claimedNumbers.has(row.number)) row.claimed = true;
    }
  }
  return plan;
}

/** Group one batch's issues into lanes — one lane per surface, soft-ordered. */
function buildLanes(numbers, model, launched, launchedSurfaces) {
  const bySurface = new Map();
  for (const number of numbers) {
    const row = model.get(number);
    if (!row) continue;
    for (const surface of row.surfaces) {
      // An issue spanning several surfaces serializes in each of them — one
      // lane per surface, so a multi-surface issue blocks both lanes.
      if (!bySurface.has(surface)) bySurface.set(surface, []);
      bySurface.get(surface).push(number);
    }
  }
  const lanes = [];
  for (const [surface, occupants] of [...bySurface.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const unique = [...new Set(occupants)];
    // Soft-order within the lane: an occupant soft-depending on another
    // occupant follows it; ties break by issue number.
    unique.sort((a, b) => {
      if ((model.get(a)?.soft ?? []).includes(b)) return 1;
      if ((model.get(b)?.soft ?? []).includes(a)) return -1;
      return a - b;
    });
    const issues = unique.map((number, index) => {
      const row = model.get(number);
      const softTarget = (row.soft ?? []).find((t) => unique.includes(t) && unique.indexOf(t) < index);
      let reason;
      if (index === 0) {
        reason = { kind: "satisfied-inputs", detail: "no open blockers; surface free" };
      } else if (softTarget !== undefined) {
        reason = { kind: "soft-ordered", detail: `soft dep on #${softTarget} in the same lane` };
      } else {
        reason = { kind: "surface-conflict", detail: `shares the ${surface} lane; serializes after #${unique[index - 1]}` };
      }
      return {
        number,
        title: row.issue.title,
        lane: surface,
        worktree: worktreeFor(row.issue),
        command: `/unit-lane --from-issue ${number}`,
        reason,
        size_hint: row.size,
      };
    });
    const laneHint = issues.reduce((max, issue) => Math.max(max, SIZE_ORDER[issue.size_hint]), 0);
    const occupiedBy = laneOccupiedBy(surface, launched, launchedSurfaces);
    lanes.push({
      surface,
      occupied_by: occupiedBy,
      size_hint: Object.keys(SIZE_ORDER)[laneHint],
      issues,
    });
  }
  return lanes;
}

/** The in-flight unit dir of a launched issue whose surfaces overlap this lane's. */
function laneOccupiedBy(surface, launched, launchedSurfaces) {
  for (const entry of launched) {
    const surfaces = launchedSurfaces.get(entry.number) ?? new Set();
    if (surfaces.has(surface) || (surface === "general" && surfaces.size === 0)) return entry.evidence;
  }
  return null;
}

// ── state (the single write path) ────────────────────────────────────────

/** Open unit dirs under docs/fix/ and docs/features/ (relative paths). */
function listUnitDirs(root) {
  const dirs = [];
  for (const base of ["docs/fix", "docs/features"]) {
    let entries = [];
    try {
      entries = fs.readdirSync(path.join(root, base), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith("_")) dirs.push(`${base}/${entry.name}`);
    }
  }
  return dirs.sort((a, b) => a.localeCompare(b));
}

// ── state (the single write path) ──────────────────────────────────────────

/**
 * Merge this run's lanes into the persisted state: claimed numbers keep their
 * first_seen; new claims enter with this run's batch and lane.
 */
export function updateState(plan, previous, { now, head }) {
  const claimed = {};
  const previousClaims = previous?.claimed ?? {};
  for (const batch of plan.batches) {
    for (const lane of batch.lanes) {
      for (const row of lane.issues) {
        const prior = previousClaims[String(row.number)];
        claimed[String(row.number)] = {
          batch: prior?.batch ?? batch.n,
          lane: prior?.lane ?? row.lane,
          first_seen: prior?.first_seen ?? now,
          last_seen: now,
          worktree: row.worktree,
        };
      }
    }
  }
  return {
    version: STATE_VERSION,
    written_at: now,
    source_revision: head,
    claimed,
  };
}

export function loadState(statePath) {
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return null;
  }
}

export function saveState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

// ── CLI ────────────────────────────────────────────────────────────────────

function usage() {
  process.stderr.write(
    "usage: batch-scheduler.mjs [--root <dir>] [--issues-file <json>] [--state <path> | --no-state]\n"
      + "                           [--remote <url>] [--mark-launched <n>] [--json-only]\n",
  );
}

async function main(argv) {
  const args = { root: process.cwd(), jsonOnly: false, noState: false, markLaunched: null, statePath: null, issuesFile: null, remote: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--root") args.root = path.resolve(argv[++i]);
    else if (arg === "--issues-file") args.issuesFile = path.resolve(argv[++i]);
    else if (arg === "--state") args.statePath = path.resolve(argv[++i]);
    else if (arg === "--no-state") args.noState = true;
    else if (arg === "--mark-launched") args.markLaunched = Number(argv[++i]);
    else if (arg === "--json-only") args.jsonOnly = true;
    else if (arg === "--remote") args.remote = argv[++i];
    else {
      usage();
      process.exit(2);
    }
  }
  if (argv.includes("--mark-launched") && (!Number.isInteger(args.markLaunched) || args.markLaunched <= 0)) {
    process.stderr.write("--mark-launched needs an issue number\n");
    process.exit(2);
  }
  const statePath = args.statePath ?? path.join(args.root, ".agentic-workflow", STATE_FILE_NAME);
  const head = readHead(args.root);

  if (args.markLaunched !== null) {
    // Manual operator mark after launching a lane outside the sensor. The only
    // other write this tool performs is the plan's own state save below.
    const state = loadState(statePath) ?? { version: STATE_VERSION, written_at: null, source_revision: head, claimed: {} };
    const prior = state.claimed[String(args.markLaunched)];
    const now = new Date().toISOString();
    state.claimed[String(args.markLaunched)] = {
      batch: prior?.batch ?? 0,
      lane: prior?.lane ?? "general",
      first_seen: prior?.first_seen ?? now,
      last_seen: prior?.last_seen ?? now,
      launched_at: now,
    };
    saveState(statePath, state);
    console.log(JSON.stringify({ marked: args.markLaunched, state: statePath }));
    return;
  }

  const [collected, schema] = await Promise.all([collectIssues({ issuesFile: args.issuesFile, remote: args.remote }), loadSchemaRuntime()]);
  const previous = args.noState ? null : loadState(statePath);
  const plan = buildBatchPlan({
    issues: collected.issues,
    root: args.root,
    head,
    previous,
    degraded: collected.degradations,
    relationsKnown: collected.relationsKnown,
  });

  const check = schema.validateBatchPlan(plan);
  if (!check.ok) {
    process.stderr.write(`BATCH-PLAN REJECTED — the produced document violates batch-plan@1:\n${check.errors.map((e) => `  - ${e}`).join("\n")}\n`);
    process.exit(1);
  }

  if (!args.noState) {
    const state = updateState(plan, previous, { now: new Date().toISOString(), head });
    saveState(statePath, state);
  }

  if (!args.jsonOnly) {
    printHumanSummary(plan);
    console.log("");
  }
  console.log(JSON.stringify(plan, null, 2));
}

function readHead(root) {
  try {
    const run = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", timeout: 10000 });
    const head = run.stdout.trim();
    return REVISION_RE.test(head) ? head : ZERO_REVISION;
  } catch {
    return ZERO_REVISION;
  }
}

function printHumanSummary(plan) {
  console.log(`# Batch plan (${plan.source_revision.slice(0, 12)}) — ${plan.summary.batches} batch(es), ${plan.summary.batched} batched, ${plan.summary.blocked} blocked, ${plan.summary.launched} launched, ${plan.summary.findings} finding(s)`);
  for (const batch of plan.batches) {
    console.log(`\n## Batch ${batch.n}`);
    for (const lane of batch.lanes) {
      const occupied = lane.occupied_by ? ` (occupied: ${lane.occupied_by})` : "";
      console.log(`  lane ${lane.surface} [${lane.size_hint}]${occupied}`);
      for (const issue of lane.issues) {
        console.log(`    #${issue.number} ${issue.title} — ${issue.reason.kind}${issue.claimed ? " · claimed" : ""} · ${issue.command}`);
      }
    }
  }
  for (const row of plan.blocked) console.log(`\nblocked #${row.number}: ${row.reason}`);
  for (const finding of plan.findings) console.log(`finding ${finding.code}: ${finding.numbers.map((n) => `#${n}`).join(", ")} — ${finding.detail}`);
  for (const d of plan.degraded) console.log(`degraded: ${d}`);
}

// The schema runtime loader is imported lazily: the pure functions stay
// importable without the built dist/ (the tests import them directly), while
// the CLI path keeps workflow-status.mjs's named-precondition contract.
async function loadSchemaRuntime() {
  const { loadSchemaRuntime: load } = await import("./schema-runtime.mjs");
  return load();
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  await main(process.argv.slice(2));
}
