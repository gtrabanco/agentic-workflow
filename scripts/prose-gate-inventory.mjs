#!/usr/bin/env node
/**
 * prose-gate-inventory.mjs — the gate that keeps the gate inventory true.
 *
 * The defect class (issue #359, arXiv 2606.22528): a rule enforced only by
 * skill prose silently disappears when the context compacts, and the run keeps
 * going as if the gate never existed. `docs/workflow/GATE_INVENTORY.md` answers
 * "which gates are script-pinned and which are prose-only"; this script makes
 * that answer mechanical:
 *
 *   shape     the `prose-gate-inventory@1` block parses in its closed column
 *             order, with unique ids, integer scores and closed vocabularies;
 *   carrier   every `script`/`cli` row's pinned token, and every `prose` row's
 *             anchored sentence, still resolves — the report prints the
 *             resolved `file:line`, so an anchor is a location, not a memory;
 *   ranking   the tier is recomputed from `safety × recurrence × checkability`
 *             and a `migrate` row (priority ≥ 6 with `checkability: 3`) may not
 *             survive at the head;
 *   survivor  every row that stays names `judgment-needed`, `low-recurrence` or
 *             `host-owned`, the reason agrees with its own scores, and its
 *             `rederive` pointer resolves to a durable file and section;
 *   coverage  in both directions: every suite in the declared gate-suite
 *             families is cited, and every `normative-surfaces@1` id is claimed
 *             by some row.
 *
 * Usage
 *   bun scripts/prose-gate-inventory.mjs            (the repository this file lives in)
 *   bun scripts/prose-gate-inventory.mjs --repo <dir>   (another tree)
 *   (node fallback, same argv)
 *
 * stdout: a `prose-gate-inventory —` header with the per-carrier tally, one
 * resolved `gate-id — carrier · file:line · priority <p> · <tier>` line per row,
 * one `prose-gate-inventory: <gate> — <reason> — <detail>` line per refusal, then
 * `verdict`. Exit: 0 only when the verdict is `PASS`; 1 on a refusal; 2 on a
 * usage error.
 *
 * Read-only: it reads bytes, writes nothing, calls no network and holds no
 * state between runs. Its sibling suite is `scripts/prose-gate-inventory.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { closesFence, headingBoundsAll, openFence } from "./unit-doc-phases.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The closed carrier vocabulary. `script` re-runs automatically, `cli` needs a
 *  per-run input, `prose` lives only in prose. Order is display order. */
export const CARRIERS = Object.freeze(["script", "cli", "prose"]);
/** The closed stay-reason vocabulary (issue #359 S6's own words). */
export const STAY_REASONS = Object.freeze(["judgment-needed", "low-recurrence", "host-owned"]);
/** The tier vocabulary: a carrier, or the planning state that must ship empty. */
export const TIERS = Object.freeze(["script", "cli", "prose", "migrate"]);

export const INVENTORY_REL = "docs/workflow/GATE_INVENTORY.md";
export const MARKER = "prose-gate-inventory@1";
export const SURFACE_SOURCE = "AGENTS.md#normative-surfaces@1";

/** The closed column order. Extending it is a SPEC change in the unit doc. */
export const COLUMNS = Object.freeze([
  "gate-id",
  "statement",
  "carrier",
  "file",
  "section",
  "token",
  "surfaces",
  "safety",
  "recurrence",
  "checkability",
  "tier",
  "stay-reason",
  "rederive",
]);

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SCORE = /^[123]$/;
const HEADING_TITLE = /^[^#|]+$/;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const lineAt = (text, offset) => text.slice(0, offset).split("\n").length;

/**
 * The tier the row's own numbers derive. `script` is terminal; otherwise a
 * priority of 6+ with full checkability is `migrate`, and everything else keeps
 * its carrier.
 */
export function deriveTier({ safety, recurrence, checkability, carrier }) {
  if (carrier === "script") return "script";
  const priority = Number(safety) * Number(recurrence);
  return priority >= 6 && Number(checkability) === 3 ? "migrate" : carrier;
}

/** Split a `file#section` anchor cell at its last `#`; `-` is the whole file. */
const splitAnchor = (value) => {
  const at = value.indexOf("#");
  if (at <= 0 || at === value.length - 1) return null;
  return { file: value.slice(0, at), section: value.slice(at + 1) };
};

/**
 * Parse the inventory block out of a document's bytes. Pure: it returns errors
 * instead of throwing, so a fixture and the live tree go through one path.
 */
export function parseInventory(text) {
  const errors = [];
  const rows = [];
  const directives = {};
  const lines = text.split("\n");

  let markerLine = -1;
  let fence = null;
  let inBlock = false;
  let skipMarker = false;
  const block = [];
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (inBlock) {
      if (skipMarker) {
        skipMarker = false;
        continue;
      }
      if (closesFence(trimmed, fence)) {
        inBlock = false;
        fence = null;
        continue;
      }
      block.push({ text: lines[index], line: index + 1 });
      continue;
    }
    const opened = openFence(trimmed);
    if (opened && lines[index + 1]?.trim() === MARKER) {
      markerLine = index + 1;
      fence = opened;
      inBlock = true;
      skipMarker = true;
    }
  }
  if (markerLine === -1) {
    return { rows, directives, errors: [{ gate: "-", reason: "missing-inventory", detail: `${INVENTORY_REL} carries no \`${MARKER}\` block` }] };
  }

  let headerSeen = false;
  for (const entry of block) {
    const trimmed = entry.text.trim();
    if (trimmed === "") continue;
    if (trimmed.startsWith("# ")) {
      const directive = /^# ([a-z-]+): (.+)$/.exec(trimmed);
      if (!directive) {
        errors.push({ gate: "-", reason: "row-shape", detail: `${INVENTORY_REL}:${entry.line} — a directive must read \`# <name>: <value>\`` });
        continue;
      }
      const [, name, value] = directive;
      directives[name] = directives[name] ? `${directives[name]} + ${value}` : value;
      continue;
    }
    if (!headerSeen) {
      if (trimmed !== COLUMNS.join(" | ")) {
        errors.push({ gate: "-", reason: "row-shape", detail: `${INVENTORY_REL}:${entry.line} — the header is not the closed column order` });
        return { rows, directives, errors };
      }
      headerSeen = true;
      continue;
    }
    const cells = trimmed.split("|").map((cell) => cell.trim());
    if (cells.length !== COLUMNS.length) {
      errors.push({ gate: cells[0] || "-", reason: "row-shape", detail: `${INVENTORY_REL}:${entry.line} — a row has ${cells.length} cells, the grammar declares ${COLUMNS.length}` });
      continue;
    }
    const row = Object.fromEntries(COLUMNS.map((column, at) => [column, cells[at]]));
    row.line = entry.line;
    rows.push(row);
  }

  if (!headerSeen) errors.push({ gate: "-", reason: "row-shape", detail: `${INVENTORY_REL}:${markerLine} — the block carries no header row` });
  return { rows, directives, errors };
}

/** The `normative-surfaces@1` ids a document block declares, in row order. */
export function parseSurfaceIds(text, marker) {
  const lines = text.split("\n");
  let fence = null;
  let inBlock = false;
  let headerSeen = false;
  const ids = [];
  let skipMarker = false;
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (inBlock) {
      if (skipMarker) {
        skipMarker = false;
        continue;
      }
      if (closesFence(trimmed, fence)) {
        inBlock = false;
        fence = null;
        continue;
      }
      if (trimmed === "" || trimmed.startsWith("# ")) continue;
      const cells = trimmed.split("|").map((cell) => cell.trim());
      if (!headerSeen) {
        if (cells[0] !== "surface") return null;
        headerSeen = true;
        continue;
      }
      if (cells.length < 2) return null;
      ids.push(cells[0]);
      continue;
    }
    const opened = openFence(trimmed);
    if (opened && lines[index + 1]?.trim() === marker) {
      fence = opened;
      inBlock = true;
      skipMarker = true;
    }
  }
  return headerSeen ? ids : null;
}

/** Resolve one anchor: the file, its section (title, any level), and the token. */
function resolveAnchor(root, file, section, token) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) return { reason: "missing-file", detail: file };
  const text = fs.readFileSync(absolute, "utf8");
  if (section === "-") {
    const at = text.indexOf(token);
    if (at < 0) return { reason: "missing-token", detail: `${file} — "${token}" is not in the file` };
    return { line: lineAt(text, at) };
  }
  const bounds = headingBoundsAll(text, section);
  if (bounds.length === 0) return { reason: "missing-section", detail: `${file}#${section}` };
  if (bounds.length > 1) return { reason: "ambiguous-section", detail: `${file}#${section} — ${bounds.length} headings share the title` };
  const { start, end } = bounds[0];
  const at = text.slice(start, end).indexOf(token);
  if (at < 0) return { reason: "missing-token", detail: `${file}#${section} — "${token}" is not in that section` };
  return { line: lineAt(text, start + at) };
}

/** Resolve a `rederive` pointer: a durable file and section, no token needed. */
function resolvePointer(root, value) {
  const parsed = splitAnchor(value);
  if (parsed === null) return { reason: "malformed-rederive", detail: `${value} — expected \`<path>#<section>\`` };
  const absolute = path.join(root, parsed.file);
  if (!fs.existsSync(absolute)) return { reason: "missing-rederive", detail: `${parsed.file} does not exist` };
  if (parsed.section === "-") return { line: 1 };
  const bounds = headingBoundsAll(fs.readFileSync(absolute, "utf8"), parsed.section);
  if (bounds.length === 0) return { reason: "missing-rederive", detail: `${parsed.file}#${parsed.section} has no such section` };
  if (bounds.length > 1) return { reason: "missing-rederive", detail: `${parsed.file}#${parsed.section} — ${bounds.length} headings share the title` };
  return { line: bounds[0].line };
}

/** Files a `dir/pattern` glob matches, repository-relative and sorted. A `**`
 *  segment is refused rather than silently approximated. */
export function listGlob(root, pattern) {
  if (pattern.includes("**")) return { reason: "unsupported-glob", detail: pattern };
  const at = pattern.lastIndexOf("/");
  const directory = at === -1 ? "" : pattern.slice(0, at);
  const basename = at === -1 ? pattern : pattern.slice(at + 1);
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return { files: [] };
  const matcher = new RegExp(`^${escapeRegExp(basename).replaceAll("\\*", "[^/]*")}$`);
  const files = fs
    .readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => entry.isFile() && matcher.test(entry.name))
    .map((entry) => (directory === "" ? entry.name : `${directory}/${entry.name}`))
    .sort();
  return { files };
}

/** Every document in the tree whose bytes carry the marker as a block-header
 *  line, repository-relative and sorted. The walk covers the whole tree (skipping
 *  `.git` and `node_modules`), so a second fenced copy anywhere — a unit doc, the
 *  template scaffold — is refused like a copy inside the guide layer; an inline
 *  mention in prose or backticks is a citation, not a home, and never matches.
 *  Symlinks are not followed. */
export function findHomes(root) {
  const skip = new Set([".git", "node_modules"]);
  const marker = /^prose-gate-inventory@1[ \t]*$/m;
  const homes = [];
  const walk = (absolute, relative) => {
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.isDirectory()) {
        if (!skip.has(entry.name)) walk(path.join(absolute, entry.name), relative ? `${relative}/${entry.name}` : entry.name);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const relativePath = relative ? `${relative}/${entry.name}` : entry.name;
        if (marker.test(fs.readFileSync(path.join(absolute, entry.name), "utf8"))) homes.push(relativePath);
      }
    }
  };
  if (fs.existsSync(root)) walk(root, "");
  return homes;
}

/** The declared gate-suite patterns, `+`-joined directives flattened. */
const patternList = (value) =>
  String(value ?? "-")
    .split("+")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "" && entry !== "-");

/**
 * Read a tree and check it. The model is plain data so a fixture and the live
 * repository are the same code path.
 */
export function inspect(root = ROOT) {
  const errors = [];
  const resolved = [];
  const inventoryPath = path.join(root, INVENTORY_REL);
  if (!fs.existsSync(inventoryPath)) {
    return { root, rows: [], directives: {}, errors: [{ gate: "-", reason: "missing-inventory", detail: `${INVENTORY_REL} does not exist` }] };
  }
  const homes = findHomes(root);
  if (homes.length > 1) {
    errors.push({ gate: "-", reason: "multiple-homes", detail: homes.join(", ") });
  }
  const parsed = parseInventory(fs.readFileSync(inventoryPath, "utf8"));
  errors.push(...parsed.errors);
  const { rows, directives } = parsed;

  if (rows.length === 0 && parsed.errors.length === 0) {
    errors.push({ gate: "-", reason: "empty-inventory", detail: `${INVENTORY_REL} carries a header and no gate` });
  }

  const surfaceSeed = directives["surface-seed"] ?? "-";
  let surfaceIds = null;
  if (surfaceSeed !== "-") {
    const pointer = splitAnchor(surfaceSeed);
    const seedFile = pointer ? path.join(root, pointer.file) : null;
    if (pointer === null || seedFile === null || !fs.existsSync(seedFile)) {
      errors.push({ gate: "-", reason: "missing-surface-source", detail: surfaceSeed });
    } else {
      surfaceIds = parseSurfaceIds(fs.readFileSync(seedFile, "utf8"), pointer.section);
      if (surfaceIds === null) errors.push({ gate: "-", reason: "missing-surface-source", detail: `${surfaceSeed} declares no readable \`${pointer.section}\` block` });
    }
  }

  const seen = new Set();
  const claimedSurfaces = new Map();
  for (const row of rows) {
    const gate = row["gate-id"];
    let shaped = true;
    if (!SLUG.test(gate)) { errors.push({ gate, reason: "row-shape", detail: `"${gate}" is not a slug` }); shaped = false; }
    else if (seen.has(gate)) { errors.push({ gate, reason: "duplicate-id", detail: `${INVENTORY_REL}:${row.line}` }); shaped = false; }
    seen.add(gate);
    if (!CARRIERS.includes(row.carrier)) { errors.push({ gate, reason: "row-shape", detail: `carrier "${row.carrier}" is not in ${CARRIERS.join(" | ")}` }); shaped = false; }
    if (!TIERS.includes(row.tier)) { errors.push({ gate, reason: "row-shape", detail: `tier "${row.tier}" is not in ${TIERS.join(" | ")}` }); shaped = false; }
    for (const column of ["safety", "recurrence", "checkability"]) {
      if (!SCORE.test(row[column])) { errors.push({ gate, reason: "row-shape", detail: `${column} "${row[column]}" is not 1..3` }); shaped = false; }
    }
    if (row["stay-reason"] !== "-" && !STAY_REASONS.includes(row["stay-reason"])) {
      errors.push({ gate, reason: "row-shape", detail: `stay-reason "${row["stay-reason"]}" is not in ${STAY_REASONS.join(" | ")}` });
      shaped = false;
    }
    if (row.file === "" || row.token === "" || row.section === "") { errors.push({ gate, reason: "row-shape", detail: "file, section and token are required" }); shaped = false; }
    if (!shaped) continue;

    const derived = deriveTier(row);
    if (row.tier !== derived) {
      errors.push({ gate, reason: "tier-mismatch", detail: `declared ${row.tier}, derived ${derived} (priority ${Number(row.safety) * Number(row.recurrence)} · checkability ${row.checkability})` });
    }
    if (row.tier === "migrate") {
      errors.push({ gate, reason: "unmigrated-gate", detail: `priority ${Number(row.safety) * Number(row.recurrence)} with checkability 3 must be a script by now` });
    }

    if (row.tier === "script") {
      if (row["stay-reason"] !== "-") errors.push({ gate, reason: "stay-reason-mismatch", detail: "a script row records no stay reason" });
      if (row.rederive !== "-") errors.push({ gate, reason: "stay-reason-mismatch", detail: "a script row needs no re-derivation pointer; the pin is the durable surface" });
    } else if (row.tier === "prose" || row.tier === "cli") {
      if (row["stay-reason"] === "-") {
        errors.push({ gate, reason: "stay-reason-missing", detail: `tier ${row.tier} requires one of ${STAY_REASONS.join(" | ")}` });
      } else if (row["stay-reason"] === "low-recurrence" && row.recurrence !== "1") {
        errors.push({ gate, reason: "stay-reason-mismatch", detail: `low-recurrence with recurrence ${row.recurrence}` });
      } else if ((row["stay-reason"] === "judgment-needed" || row["stay-reason"] === "host-owned") && row.checkability === "3") {
        errors.push({ gate, reason: "stay-reason-mismatch", detail: `${row["stay-reason"]} with checkability 3 — an automatic assertion is available, so the row must migrate` });
      }
      if (row.rederive === "-") {
        errors.push({ gate, reason: "missing-rederive", detail: `tier ${row.tier} must name the durable surface it re-derives from` });
      } else {
        const pointer = resolvePointer(root, row.rederive);
        if (pointer.reason) errors.push({ gate, reason: pointer.reason, detail: pointer.detail });
      }
    }

    const anchor = resolveAnchor(root, row.file, row.section, row.token);
    if (anchor.reason) errors.push({ gate, reason: anchor.reason, detail: anchor.detail });
    resolved.push({ ...row, priority: Number(row.safety) * Number(row.recurrence), at: anchor.line ?? null });

    if (row.surfaces !== "-") {
      for (const id of row.surfaces.split(",").map((entry) => entry.trim()).filter(Boolean)) {
        if (surfaceIds !== null && !surfaceIds.includes(id)) {
          errors.push({ gate, reason: "unknown-surface", detail: `${id} is not a row of ${surfaceSeed}` });
          continue;
        }
        claimedSurfaces.set(id, [...(claimedSurfaces.get(id) ?? []), gate]);
      }
    }
  }

  for (const [name, value] of [["gate-suites", directives["gate-suites"] ?? "-"]]) {
    for (const pattern of patternList(value)) {
      const listed = listGlob(root, pattern);
      if (listed.reason) { errors.push({ gate: "-", reason: listed.reason, detail: `${name}: ${listed.detail}` }); continue; }
      for (const file of listed.files ?? []) {
        if (!rows.some((row) => row.carrier === "script" && row.file === file)) {
          errors.push({ gate: "-", reason: "uncited-gate-suite", detail: `${file} matches \`${pattern}\` and no row cites it` });
        }
      }
    }
  }

  if (surfaceIds !== null) {
    for (const id of surfaceIds) {
      if (!claimedSurfaces.has(id)) errors.push({ gate: "-", reason: "uncited-surface", detail: `${id} is declared by ${surfaceSeed} and no row claims it` });
    }
  }

  const ordered = [...errors].sort((left, right) => `${left.gate}${left.reason}${left.detail}`.localeCompare(`${right.gate}${right.reason}${right.detail}`));
  return { root, rows: resolved, directives, errors: ordered };
}

/** The fixed report: tallies, one resolved line per row, refusals, verdict. */
export function report(result) {
  const tally = (carrier) => result.rows.filter((row) => row.carrier === carrier).length;
  const lines = [
    `prose-gate-inventory — ${result.rows.length} row(s) · script ${tally("script")} · cli ${tally("cli")} · prose ${tally("prose")} · migrate ${result.rows.filter((row) => row.tier === "migrate").length}`,
  ];
  for (const row of result.rows) {
    const at = row.at === null ? row.file : `${row.file}:${row.at}`;
    lines.push(`  ${row["gate-id"]} — ${row.carrier} · ${at} · priority ${row.priority} · ${row.tier}`);
  }
  for (const error of result.errors) lines.push(`prose-gate-inventory: ${error.gate} — ${error.reason} — ${error.detail}`);
  lines.push(`verdict: ${result.errors.length === 0 ? "PASS" : "FAIL"}`);
  return lines.join("\n");
}

/** A block in the grammar, used by the suite's round-trip case. */
export function renderBlock({ rows, directives = {} }) {
  const lines = ["```text", MARKER];
  for (const [name, value] of Object.entries(directives)) lines.push(`# ${name}: ${value}`);
  lines.push(COLUMNS.join(" | "));
  for (const entry of rows) lines.push(COLUMNS.map((column) => entry[column]).join(" | "));
  lines.push("```");
  return lines.join("\n");
}

function usage(message) {
  process.stderr.write(`prose-gate-inventory: ${message}\n`);
  process.stderr.write("usage: bun scripts/prose-gate-inventory.mjs [--repo <dir>]  (node fallback, same argv)\n");
  process.exit(2);
}

function main(argv) {
  let root = ROOT;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo") {
      const value = argv[index + 1];
      if (value === undefined) usage("--repo needs a directory");
      root = path.resolve(value);
      index += 1;
    } else {
      usage(`unknown argument ${arg}`);
    }
  }
  const result = inspect(root);
  console.log(report(result));
  process.exit(result.errors.length === 0 ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
