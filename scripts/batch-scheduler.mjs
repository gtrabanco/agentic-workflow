#!/usr/bin/env node

/**
 * batch-scheduler — the deterministic batch planner (issue #449).
 *
 * One pass over the live work graph that emits the fixed `batch-plan@2`
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

const STATE_VERSION = 2;
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
  // The documented scratch-origin case: a clone whose `origin` is a local path
  // cannot tell `gh` which repository to read, so `--remote` names it for BOTH
  // sources — the issue list and the relations call.
  const origin = remote ?? gitOriginUrl();
  const parsed = origin !== null ? parseOrigin(origin) : null;
  const repoArgs = parsed === null ? [] : ["-R", `${parsed.owner}/${parsed.name}`];
  let listed = null;
  try {
    const run = spawnSync(
      ghBin,
      ["issue", "list", ...repoArgs, "--state", "open", "--limit", "200", "--json", "number,title,body,labels"],
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

/** Normalize one path token to its lane key (see `surfaceKey`). */
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
    const key = surfaceKey(match[1]);
    if (key !== null) surfaces.add(key);
  }
  return surfaces;
}

/**
 * One lane key from one path token.
 *
 * `skills/<name>` and `packages/<name>` are the documented surfaces; a token
 * that names the tree instead of a child — `skills`, `skills/`, `skills/**`,
 * a wildcard child — collapses to the tree-root key, never to a wildcard
 * (a wildcard lane would run beside the concrete lanes it covers). A
 * top-level directory is its own key; anything else names no surface.
 */
function surfaceKey(token) {
  const clean = String(token).trim().replace(/^\.\//u, "").replace(/(?:\/|\*)+$/u, "");
  if (clean === "") return null;
  const parts = clean.split("/").filter(Boolean);
  const top = parts[0];
  if (top === "skills" || top === "packages") {
    const child = parts[1];
    return child !== undefined && !/^\*+$/u.test(child) ? `${top}/${child}` : top;
  }
  if (["scripts", "docs", "template", ".github"].includes(top)) return top;
  return null;
}

/**
 * Parse the prose `## Dependencies` table (the #442 contract's soft rows and
 * prose-declared hard rows) out of an issue body — fail-closed (issue #460,
 * S5): only the declared table form (`| Depends on | Kind | Why |`) is parsed;
 * any other table shape in the section is refused (`malformed: true`) instead
 * of harvesting `#\d+` from arbitrary columns, so a non-conforming issue can
 * never produce false findings. A section with no table at all parses as no
 * dependencies — there is nothing to refuse.
 *
 * @returns {{soft: number[], proseHard: number[], malformed: boolean}}
 */
export function extractProseDependencies(body) {
  const idx = body.indexOf("## Dependencies");
  if (idx === -1) return { soft: [], proseHard: [], malformed: false };
  const rest = body.slice(idx + "## Dependencies".length);
  const end = rest.indexOf("\n## ");
  const section = end === -1 ? rest : rest.slice(0, end);
  const tableLines = section.split("\n").filter((line) => line.trim().startsWith("|"));
  if (tableLines.length === 0) return { soft: [], proseHard: [], malformed: false };
  // The declared form's header row names its columns; anything else is refused.
  const header = tableLines[0].split("|").map((c) => c.trim());
  const declared = header[1] === "Depends on" && header[2] === "Kind" && header[3] === "Why";
  if (!declared) return { soft: [], proseHard: [], malformed: true };
  const soft = [];
  const proseHard = [];
  for (const line of tableLines.slice(1)) {
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
  return { soft, proseHard, malformed: false };
}

/** Measured-size hint: declared `(S)/(M)/(L)/(XL)` token first, then surface count. */
export function sizeHint(issue, surfaces) {
  const token = /\(([SMLXL])\)/.exec(issue.title) ?? /\(([SMLXL])\)/.exec(issue.body.slice(0, 400));
  if (token) return SIZE_FROM_TOKEN[token[1]];
  if (surfaces.size >= 3) return "heavy";
  if (surfaces.size === 2) return "mixed";
  return "light";
}

/**
 * Triage readiness from the roadmap fix-row status (issue #460, S3, decision
 * D3/D4): a unit is executable only once the lane's triage produced its Tasks
 * (`planned`+), so a row below `planned` marks the issue untriaged. A missing
 * row carries no triage signal — the issue stays unmarked. In practice the
 * only reachable untriaged status is `idea`: `defined`+ implies a unit doc on
 * disk, which makes the issue launched (excluded from every lane).
 *
 * The cell often carries a PR annotation after the status (`done · [#475](…)`,
 * the fix index's own rendering), so the value read is the token before it.
 */
function isTriaged(status) {
  if (status === undefined) return true;
  const token = status.split("·")[0].trim();
  return ["planned", "in-progress", "done"].includes(token);
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
  /** The roadmap fix-row status per issue number — the triage signal (issue #460, S3). */
  const fixStatusByNumber = new Map();
  if (roadmapText !== null) {
    for (const row of roadmapTableRows(roadmapText, "fix")) {
      for (const match of (row[0] ?? "").matchAll(/#(\d+)/g)) knownNumbers.add(Number(match[1]));
      const issueMatch = /#(\d+)/.exec(row[0] ?? "");
      if (issueMatch) fixStatusByNumber.set(Number(issueMatch[1]), (row[2] ?? "").trim());
    }
  }
  const unitDirByIssue = new Map();
  for (const dir of listUnitDirs(root)) {
    const match = /(\d+)-/.exec(path.basename(dir));
    if (match) unitDirByIssue.set(Number(match[1]), dir);
  }

  const launched = [];
  const launchedSurfaces = new Map();
  const launchable = [];
  for (const issue of issues) {
    const unitDir = unitDirByIssue.get(issue.number);
    if (unitDir) {
      launched.push({ number: issue.number, evidence: `unit-doc ${unitDir}` });
      launchedSurfaces.set(issue.number, extractSurfaces(issue.body));
    } else {
      launchable.push(issue);
    }
  }
  launched.sort((a, b) => a.number - b.number);
  const launchedNumbers = new Set(launched.map((entry) => entry.number));

  const model = new Map();
  for (const issue of launchable) {
    const surfaces = extractSurfaces(issue.body);
    const surfaceSet = surfaces.size > 0 ? surfaces : new Set(["general"]);
    const prose = extractProseDependencies(issue.body);
    if (prose.malformed) {
      // Fail closed (issue #460, S5): a non-declared table shape degrades
      // declared, naming the issue, instead of harvesting `#\d+` from
      // arbitrary columns.
      degradations.push(`unavailable-prose-dependencies-issue-${issue.number}-undeclared-table-shape`);
    }
    model.set(issue.number, {
      issue,
      surfaces: [...surfaceSet].sort((a, b) => a.localeCompare(b)),
      softAll: prose.soft,
      proseHard: prose.proseHard,
      size: sizeHint(issue, surfaceSet),
      triaged: isTriaged(fixStatusByNumber.get(issue.number)),
    });
  }
  // A tree-root declaration (`skills`, `skills/**`, `packages/`) names every
  // declared child of that tree: it joins their lanes instead of opening a
  // lane of its own, so a broad issue can never run beside the concrete lane
  // it covers (S5, "one lane per surface"). The child set is derived from the
  // run's own declarations, so the plan stays deterministic.
  const children = new Map();
  const noteChildren = (surfaces) => {
    for (const surface of surfaces) {
      const [root, child] = surface.split("/");
      if (child === undefined || (root !== "skills" && root !== "packages")) continue;
      if (!children.has(root)) children.set(root, new Set());
      children.get(root).add(child);
    }
  };
  for (const row of model.values()) noteChildren(row.surfaces);
  for (const surfaces of launchedSurfaces.values()) noteChildren(surfaces);
  const expand = (surface) => {
    const kids = children.get(surface);
    return kids === undefined || kids.size === 0 ? [surface] : [...kids].map((child) => `${surface}/${child}`);
  };
  for (const row of model.values()) {
    row.surfaces = [...new Set(row.surfaces.flatMap(expand))].sort((a, b) => a.localeCompare(b));
  }
  for (const [number, surfaces] of launchedSurfaces) {
    launchedSurfaces.set(number, new Set([...surfaces].flatMap(expand)));
  }
  for (const row of model.values()) {
    row.soft = row.softAll.filter((n) => model.has(n));
    row.softOrphans = row.softAll.filter((n) => !model.has(n) && !launchedNumbers.has(n) && !knownNumbers.has(n));
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
  const inFlightByIssue = new Map();
  let current = [];
  for (const [number, row] of model) {
    const native = byNumber.get(number)?.blockedBy ?? [];
    // A blocker whose unit doc is on disk is open and in flight: it gates the
    // issue but no batch will ever contain it, so it is a state to report —
    // never an unresolvable wait (S7).
    const inFlight = native.filter((b) => launchedNumbers.has(b));
    const unmet = native.filter((b) => openNumbers.has(b) && !launchedNumbers.has(b) && b !== number);
    inFlightByIssue.set(number, inFlight);
    unmetByIssue.set(number, unmet);
    if (unmet.length === 0 && inFlight.length === 0) current.push(number);
  }
  let batchNumber = 0;
  while (current.length > 0) {
    batchNumber += 1;
    for (const number of current) batchOf.set(number, batchNumber);
    const next = [];
    for (const [number, unmet] of unmetByIssue) {
      if (batchOf.has(number)) continue;
      if ((inFlightByIssue.get(number) ?? []).length > 0) continue;
      if (unmet.every((b) => batchOf.has(b))) next.push(number);
    }
    current = next;
  }
  const deferred = new Set(
    [...inFlightByIssue.entries()].filter(([, inFlight]) => inFlight.length > 0).map(([number]) => number),
  );
  const unresolvable = [...model.keys()].filter((number) => !batchOf.has(number) && !deferred.has(number)).sort((a, b) => a - b);
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

  // ── lifecycle delta vs the previous plan (issue #460, S2) ────────────
  // The state file's `seen` map is the last-seen open-issue set; every run
  // reports what changed, so a closed blocker or a fresh issue is never
  // silent. A state file from before v2 carries no `seen` — the first run
  // then reports every open issue as newly seen (a declared, honest delta).
  const previousSeen = previous?.seen ?? {};
  const new_issues = issues
    .filter((issue) => previousSeen[String(issue.number)] === undefined)
    .map((issue) => ({ number: issue.number, title: issue.title }));
  const closed_since = Object.entries(previousSeen)
    .filter(([key]) => !openNumbers.has(Number(key)))
    .map(([key, entry]) => ({
      number: Number(key),
      title: typeof entry?.title === "string" && entry.title !== "" ? entry.title : `#${key}`,
      batch: Number.isInteger(entry?.batch) ? entry.batch : null,
      lane: typeof entry?.lane === "string" && entry.lane !== "" ? entry.lane : null,
      last_seen: typeof entry?.last_seen === "string" && entry.last_seen !== "" ? entry.last_seen : "unknown",
    }))
    .sort((a, b) => a.number - b.number);

  const numbersByBatch = new Map();
  for (const number of [...batchOf.keys()].sort((a, b) => a - b)) {
    const batch = batchOf.get(number);
    if (!numbersByBatch.has(batch)) numbersByBatch.set(batch, []);
    numbersByBatch.get(batch).push(number);
  }
  const normalized = [...numbersByBatch.entries()].sort((a, b) => a[0] - b[0]);
  // The document renumbers batches 1..N; the caveat strings must name the
  // document's batch numbers, so map the internal batch ids onto them.
  const documentBatchOf = new Map(normalized.map(([original], index) => [original, index + 1]));
  const batches = normalized.map(([original, numbers], index) => ({
    n: index + 1,
    lanes: buildLanes(numbers, model, launched, launchedSurfaces, {
      batchOf,
      documentBatchOf,
      documentBatch: index + 1,
      openNumbers,
      launchedNumbers,
    }),
  }));

  const blocked = [];
  for (const number of [...unmetByIssue.keys()].sort((a, b) => a - b)) {
    const unmet = unmetByIssue.get(number);
    const inFlight = inFlightByIssue.get(number) ?? [];
    if (unmet.length === 0 && inFlight.length === 0) continue;
    const blockers = [...new Set([...unmet, ...inFlight])].sort((a, b) => a - b);
    const inFlightNote = inFlight.length > 0 ? ", unit in flight" : "";
    blocked.push({ number, blockers, reason: `blocked-by ${blockers.join(", ")} (open${inFlightNote})` });
  }

  findings.sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : a.numbers[0] - b.numbers[0]));

  // Claimed lanes from the previous run's persisted state (S6).
  const previousClaims = previous?.claimed ?? {};
  const claimedNumbers = new Set(Object.keys(previousClaims).map(Number));

  const plan = {
    contract: "agentic-workflow/batch-plan",
    version: 2,
    schema: "batch-plan@2",
    source_revision: head,
    degraded: degradations.sort((a, b) => a.localeCompare(b)),
    batches,
    blocked,
    launched,
    findings,
    new_issues,
    closed_since,
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
function buildLanes(numbers, model, launched, launchedSurfaces, { batchOf, documentBatchOf, documentBatch, openNumbers, launchedNumbers }) {
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
      // Cross-lane soft-dep caveat (issue #460, S4, decision D2): an open
      // soft dep the plan does not deliver strictly before this issue —
      // same-batch other-lane, same-batch later in the lane, or unbatched —
      // is an input the issue starts without.
      const undelivered = [];
      for (const target of row.softAll) {
        if (target === number || !openNumbers.has(target)) continue;
        const targetDocumentBatch = batchOf.get(target) !== undefined ? documentBatchOf.get(batchOf.get(target)) : undefined;
        if (targetDocumentBatch !== undefined && targetDocumentBatch < documentBatch) continue;
        if (targetDocumentBatch === documentBatch) {
          const targetIndex = unique.indexOf(target);
          if (targetIndex !== -1 && targetIndex < index) continue;
        }
        const state = launchedNumbers.has(target)
          ? "in flight"
          : targetDocumentBatch !== undefined
            ? `batch ${targetDocumentBatch}`
            : "blocked";
        undelivered.push(`#${target} (${state})`);
      }
      const parts = [];
      if (index > 0) {
        parts.push(
          softTarget !== undefined
            ? `soft dep on #${softTarget} in the same lane`
            : `shares the ${surface} lane; serializes after #${unique[index - 1]}`,
        );
      }
      if (!row.triaged) {
        parts.push("no triage yet (roadmap status below planned) — scope undetermined; co-scheduling provisional until the lane's triage runs");
      }
      if (undelivered.length > 0) parts.push(`open soft deps: ${undelivered.join(", ")}`);
      let reason;
      if (!row.triaged && index === 0) {
        reason = { kind: "untriaged", detail: parts.join("; ") };
      } else if (undelivered.length > 0) {
        reason = { kind: "soft-deps-open", detail: parts.join("; ") };
      } else if (!row.triaged) {
        reason = { kind: "untriaged", detail: parts.join("; ") };
      } else if (index === 0) {
        reason = { kind: "satisfied-inputs", detail: "no open blockers; surface free" };
      } else if (softTarget !== undefined) {
        reason = { kind: "soft-ordered", detail: parts.join("; ") };
      } else {
        reason = { kind: "surface-conflict", detail: parts.join("; ") };
      }
      return {
        number,
        title: row.issue.title,
        lane: surface,
        worktree: worktreeFor(row.issue),
        command: `/unit-lane --from-issue ${number}`,
        reason,
        size_hint: row.size,
        ...(row.triaged ? {} : { triaged: false }),
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
 * first_seen; new claims enter with this run's batch and lane. The state also
 * carries the last-seen open-issue set (`seen`, issue #460) — every open
 * issue of this run, batched or not, so the next run can diff the work
 * graph's lifecycle. `openIssues` (the collected issue list) supplies the
 * titles for issues outside the batches; without it the plan's own rows are
 * the source.
 */
export function updateState(plan, previous, { now, head, openIssues = null } = {}) {
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
  const previousSeen = previous?.seen ?? {};
  // Batch/lane come from the plan's own rows (blocked, launched and
  // unresolvable issues never batched → null); `openIssues` supplies the
  // titles and the issues the plan's rows cannot see (cycle members).
  const planInfo = new Map();
  for (const batch of plan.batches) {
    for (const lane of batch.lanes) {
      for (const row of lane.issues) planInfo.set(row.number, { batch: batch.n, lane: row.lane });
    }
  }
  const seen = {};
  const open = openIssues ?? [
    ...plan.batches.flatMap((batch) => batch.lanes.flatMap((lane) => lane.issues.map((row) => ({ number: row.number, title: row.title })))),
    ...plan.blocked.map((row) => ({ number: row.number, title: null })),
    ...plan.launched.map((row) => ({ number: row.number, title: null })),
  ];
  for (const entry of open) {
    const prior = previousSeen[String(entry.number)];
    const info = planInfo.get(entry.number) ?? { batch: null, lane: null };
    seen[String(entry.number)] = {
      title: entry.title ?? prior?.title ?? `#${entry.number}`,
      batch: info.batch,
      lane: info.lane,
      first_seen: prior?.first_seen ?? now,
      last_seen: now,
    };
  }
  return {
    version: STATE_VERSION,
    written_at: now,
    source_revision: head,
    claimed,
    seen,
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

/** A usage error: the fixed exit 2 and the usage block, never a stack trace. */
function fail(message) {
  process.stderr.write(`${message}\n`);
  usage();
  process.exit(2);
}

async function main(argv) {
  const args = { root: process.cwd(), jsonOnly: false, noState: false, markLaunched: null, statePath: null, issuesFile: null, remote: null };
  const valueAt = (flag, index) => {
    const value = argv[index];
    if (value === undefined) fail(`${flag} needs a value`);
    return value;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--root") args.root = path.resolve(valueAt(arg, ++i));
    else if (arg === "--issues-file") args.issuesFile = path.resolve(valueAt(arg, ++i));
    else if (arg === "--state") args.statePath = path.resolve(valueAt(arg, ++i));
    else if (arg === "--no-state") args.noState = true;
    else if (arg === "--mark-launched") args.markLaunched = Number(valueAt(arg, ++i));
    else if (arg === "--json-only") args.jsonOnly = true;
    else if (arg === "--remote") args.remote = valueAt(arg, ++i);
    else fail(`unknown argument: ${arg}`);
  }
  if (args.noState && args.markLaunched !== null) {
    fail("--mark-launched writes the state file, so it cannot be combined with --no-state (a pure read writes nothing)");
  }
  if (argv.includes("--mark-launched") && (!Number.isInteger(args.markLaunched) || args.markLaunched <= 0)) {
    fail("--mark-launched needs a positive issue number");
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
    process.stderr.write(`BATCH-PLAN REJECTED — the produced document violates ${schema.BATCH_PLAN_SCHEMA}:\n${check.errors.map((e) => `  - ${e}`).join("\n")}\n`);
    process.exit(1);
  }

  if (!args.noState) {
    const state = updateState(plan, previous, { now: new Date().toISOString(), head, openIssues: collected.issues });
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
  const untriaged = plan.batches
    .flatMap((batch) => batch.lanes)
    .flatMap((lane) => lane.issues)
    .filter((row) => row.triaged === false);
  if (untriaged.length > 0) {
    console.log(
      `\nuntriaged: ${untriaged.map((row) => `#${row.number}`).join(", ")} — scope undetermined; co-scheduling provisional until their lane triage runs`,
    );
  }
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
