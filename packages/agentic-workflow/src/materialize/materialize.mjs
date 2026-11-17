/**
 * materialize.mjs — the verification-materialization file service (unit 557,
 * feature/557-verification-materialization, issue #564).
 *
 * The engineering interview (`src/charter/interview.mjs`) records what the team
 * answered; one of those answers is per-boundary *is this enforced by a machine,
 * or by prose only?* A `prose-only` answer is honest, and it is also the defect
 * the mapped talk warns about: a boundary that lives in a reviewer's memory is
 * not a boundary. This service is the last mile the product can own — it does not
 * ship the verification (always the adopting team's code, the "adapt, don't
 * ship" boundary), it materializes the *decision*:
 *
 *   plan     — what is declared, what has an outcome, and the residual every
 *              unanswered item leaves behind;
 *   check    — the declaration-enforcement check: a boundary declared with no
 *              enforcement mechanism becomes a typed finding carrying a
 *              `finding-route@1`-shaped route, never a sentence;
 *   apply    — the only writer, behind an explicit consent: it records the
 *              team's outcome in the record document and flips a scaffolded
 *              boundary's charter answer to `machine: <mechanism>`;
 *   evidence — the artifact-evidence half of the acceptance contract: a
 *              criterion naming a capture records its digest and the project's
 *              own driver command, and fails closed with a `manual:` label when
 *              the project declared no driver.
 *
 * The boundary shape is not re-implemented here: `boundaryFindings` and
 * `isPlaceholder` are the charter's, so `charter check` and `materialize` can
 * never disagree about what the slot says. Read-only except `apply`; no clock
 * (the landing date is the payload's), no network, no git, so two runs over the
 * same bytes produce the same bytes.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { BOUNDARY_SLOT, boundaryFindings, isPlaceholder, readSlots } from "../charter/interview.mjs";

/** The charter's boundary slot, re-exported because it is the location this service reads. */
export { BOUNDARY_SLOT };

/** The receipt's fixed contract id (same `<name>@<n>` shape as the other crate receipts). */
export const CONTRACT_ID = "materialization@1";
/** The record document's marker; its columns are the crate README's `materialization@1` block. */
export const RECORD_MARKER = "boundary-enforcement@1";
/** The feature map's marker; its columns are the crate README's `materialization@1` block. */
export const FEATURE_MAP_MARKER = "feature-map@1";
/** Where the record lives in a target project (seeded from `template/`). */
export const RECORD_PATH = "docs/workflow/BOUNDARY_ENFORCEMENT.md";
/** Where the feature map lives in a target project (seeded from `template/`). */
export const FEATURE_MAP_PATH = "docs/workflow/FEATURE_MAP.md";
/** The charter slot the artifact-evidence driver is read from. */
export const DRIVER_SLOT = "Evidence driver";
/** The routes a prose-only boundary may take. */
export const OUTCOMES = Object.freeze(["scaffold", "issue", "declined"]);
/** The artifact kinds a capture criterion may name. */
export const ARTIFACT_KINDS = Object.freeze(["screenshot", "video", "state-snapshot"]);
/**
 * The closed finding-code set `check` and `evidence` emit (mirror of the schema
 * package's `MATERIALIZATION_FINDING_CODES` — provenance:
 * packages/agentic-workflow-schema/src/vocabularies.ts, MIT, same repo).
 */
export const FINDING_CODES = Object.freeze([
  "artifact-evidence-missing",
  "boundary-artifact-missing",
  "boundary-declared-unenforced",
  "evidence-driver-missing",
  "feature-map-missing",
  "feature-map-shape",
]);

/** The record's columns, in the order the document prints them. */
export const RECORD_COLUMNS = Object.freeze(["boundary", "enforcement", "outcome", "artifact", "recorded"]);
/** The feature map's columns, in the order the document prints them. */
export const FEATURE_MAP_COLUMNS = Object.freeze(["flow", "what-exists", "how-a-user-reaches-it", "evidence", "status"]);

/** A refusal the caller reports as `EDIT REFUSAL — <message>` (exit 2). */
export class MaterializeRefusal extends Error {}

const cell = (line) => line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split(/(?<!\\)\|/u).map((value) => value.trim());

/** A cell whose entire content is one `<…>` placeholder, code span or not. */
const PLACEHOLDER_CELL = /^`?<[^>]+>`?$/;
const DIGEST = /digest:\s*sha256:[0-9a-f]{8,64}/u;
const ARTIFACT_CRITERION = new RegExp(`artifact:\\s*(${ARTIFACT_KINDS.join("|")})`, "u");
const CRITERION_ID = /^AC-?(\d+)/u;
const ENFORCEMENT_MACHINE = /^machine:\s*([^`\s][^`]*)$/u;

/**
 * Drop fenced blocks: a documented shape inside ``` is an example, never a
 * declaration. The invariants template ships exactly such an example, and
 * reading it as a real invariant would report the template as a defect.
 * @param {string} text
 */
function withoutFences(text) {
  const out = [];
  let fence = null;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (fence === null) {
      const opened = /^(```+|~~~+)/u.exec(trimmed);
      if (opened) { fence = opened[1]; continue; }
      out.push(line);
      continue;
    }
    if (trimmed.startsWith(fence)) fence = null;
  }
  return out.join("\n");
}

/**
 * The first markdown table after a `marker` fenced block.
 * @param {string} text
 * @param {string} marker
 * @returns {{present: boolean, columns: string[], rows: string[][]}}
 */
function tableAfterMarker(text, marker) {
  const lines = text.split("\n");
  let blockEnd = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    const opened = /^(```+|~~~+)/u.exec(trimmed);
    if (!opened) continue;
    const first = (lines[index + 1] ?? "").trim();
    let close = index + 2;
    while (close < lines.length && !lines[close].trim().startsWith(opened[1])) close += 1;
    if (first === marker) { blockEnd = close; break; }
    index = close;
  }
  if (blockEnd === -1) return { present: false, columns: [], rows: [] };
  let index = blockEnd + 1;
  while (index < lines.length && !/^\s*\|/u.test(lines[index])) index += 1;
  if (index >= lines.length) return { present: true, columns: [], rows: [] };
  const columns = cell(lines[index]);
  index += 1;
  if (index < lines.length && /^\s*\|\s*[-: ]+\|/u.test(lines[index])) index += 1;
  const rows = [];
  while (index < lines.length && /^\s*\|/u.test(lines[index])) {
    rows.push(cell(lines[index]));
    index += 1;
  }
  return { present: true, columns, rows };
}

const recordOf = (columns, values) => {
  const row = {};
  columns.forEach((column, position) => { row[column] = values[position] ?? ""; });
  return {
    boundary: row.boundary ?? "",
    enforcement: row.enforcement ?? "",
    outcome: row.outcome ?? "",
    artifact: row.artifact ?? "",
    recorded: row.recorded ?? "",
  };
};

/**
 * The declared boundaries, from the charter's `Architectural boundaries` slot.
 * The shape rule is the charter's (`boundaryFindings`) — one owner for it.
 * @param {string} guideText
 * @returns {{entries: {boundary: string, enforcement: "machine"|"prose-only", mechanism: string|null}[], malformed: {raw: string, detail: string}[], placeholder: boolean}}
 */
export function readBoundaryEntries(guideText) {
  const slot = readSlots(guideText).find((row) => row.key === BOUNDARY_SLOT);
  if (slot === undefined) return { entries: [], malformed: [], placeholder: false };
  if (isPlaceholder(slot.value)) return { entries: [], malformed: [], placeholder: true };
  const entries = [];
  const malformed = [];
  for (const entry of slot.value.replace(/`/gu, "").split(" · ")) {
    const trimmed = entry.trim();
    const parts = trimmed.split(" → ");
    if (parts.length === 2 && parts[0].trim() !== "") {
      const enforcement = parts[1].trim();
      const machine = ENFORCEMENT_MACHINE.exec(enforcement);
      if (machine !== null) {
        entries.push({ boundary: parts[0].trim(), enforcement: "machine", mechanism: machine[1].trim() });
        continue;
      }
      if (enforcement === "prose-only") {
        entries.push({ boundary: parts[0].trim(), enforcement: "prose-only", mechanism: null });
        continue;
      }
    }
    const [finding] = boundaryFindings(trimmed);
    malformed.push({ raw: trimmed, detail: finding?.detail ?? `"${trimmed}" is not a declared boundary entry` });
  }
  return { entries, malformed, placeholder: false };
}

/**
 * The record document's rows.
 * @param {string|null} text
 * @returns {{present: boolean, rows: ReturnType<typeof recordOf>[]}}
 */
export function readRecord(text) {
  if (text === null || text === undefined) return { present: false, rows: [] };
  const table = tableAfterMarker(text, RECORD_MARKER);
  return { present: table.present, rows: table.rows.map((values) => recordOf(table.columns, values)) };
}

/**
 * The feature map's rows, and how many of its cells are still template
 * placeholders — a seeded map has none.
 * @param {string|null} text
 */
export function readFeatureMap(text) {
  if (text === null || text === undefined) return { present: false, rows: [], placeholderCells: 0, columns: [] };
  const table = tableAfterMarker(text, FEATURE_MAP_MARKER);
  const rows = table.rows.map((values) => ({ cells: values, flow: values[0] ?? "", status: values[values.length - 1] ?? "" }));
  const placeholderCells = table.rows.reduce((total, values) => total + values.filter((value) => PLACEHOLDER_CELL.test(value)).length, 0);
  return { present: table.present, rows, placeholderCells, columns: table.columns };
}

/**
 * The project-declared artifact-capture driver: the charter's `Evidence driver`
 * slot. A placeholder or an `n/a` answer declares none.
 * @param {string} guideText
 * @returns {{declared: boolean, command: string|null}}
 */
export function readDriver(guideText) {
  const slot = readSlots(guideText).find((row) => row.key === DRIVER_SLOT);
  if (slot === undefined) return { declared: false, command: null };
  const value = slot.value.replace(/`/gu, "").trim();
  if (value === "" || isPlaceholder(slot.value) || /^n\/a\b/u.test(value)) return { declared: false, command: null };
  return { declared: true, command: value };
}

/**
 * What the materialization round still owes: one row per declared item, and a
 * residual for every item without an outcome.
 * @param {{guideText: string, recordText: string|null, featureMapText: string|null}} input
 */
export function planMaterialization({ guideText, recordText, featureMapText }) {
  const boundaries = readBoundaryEntries(guideText);
  if (boundaries.malformed.length > 0) {
    throw new MaterializeRefusal(
      `the guide's ${BOUNDARY_SLOT} slot is not in the charter's two legal shapes (${boundaries.malformed[0].detail}) — run \`agentic-workflow charter check\``,
    );
  }
  const record = readRecord(recordText);
  const rows = [];
  const residuals = [];

  if (boundaries.placeholder) {
    residuals.push({ kind: "boundary", item: BOUNDARY_SLOT, reason: "the engineering interview has recorded no boundary yet, so there is nothing to materialize" });
  }
  for (const entry of boundaries.entries) {
    const recorded = record.rows.find((row) => row.boundary === entry.boundary);
    if (entry.enforcement === "machine") {
      rows.push({ kind: "boundary", item: entry.boundary, status: "enforced", detail: `machine: ${entry.mechanism}` });
      continue;
    }
    if (recorded === undefined) {
      rows.push({ kind: "boundary", item: entry.boundary, status: "pending", detail: "no materialization outcome is recorded" });
      residuals.push({ kind: "boundary", item: entry.boundary, reason: "declared prose-only with no recorded outcome — run the materialization round" });
      continue;
    }
    if (recorded.outcome === "issue") {
      rows.push({ kind: "boundary", item: entry.boundary, status: "recorded-issue", detail: `issue ${recorded.artifact} proposes the rule` });
      continue;
    }
    if (recorded.outcome === "declined") {
      rows.push({ kind: "boundary", item: entry.boundary, status: "declined", detail: "the team declined to materialize it" });
      continue;
    }
    rows.push({ kind: "boundary", item: entry.boundary, status: "pending", detail: `the rule is recorded at ${recorded.artifact} but the charter still answers prose-only` });
    residuals.push({ kind: "boundary", item: entry.boundary, reason: `scaffolded at ${recorded.artifact} but the charter still answers prose-only — re-record the answer as machine: <mechanism>` });
  }

  const map = readFeatureMap(featureMapText);
  rows.push({
    kind: "feature-map",
    item: FEATURE_MAP_PATH,
    status: map.present ? "seeded" : "missing",
    detail: map.present ? `${map.rows.length} flow(s)` : "no feature map in the tree",
  });
  if (!map.present) residuals.push({ kind: "feature-map", item: FEATURE_MAP_PATH, reason: "the bootstrap seeds it from template/ and the lane's docs step maintains it" });

  const driver = readDriver(guideText);
  rows.push({
    kind: "evidence-driver",
    item: DRIVER_SLOT,
    status: driver.declared ? "declared" : "undeclared",
    detail: driver.declared ? driver.command : "no artifact-capture driver declared",
  });
  if (!driver.declared) residuals.push({ kind: "evidence-driver", item: DRIVER_SLOT, reason: "a capture criterion cannot record a digest without a declared driver" });

  return { rows, residuals, verdict: residuals.length === 0 ? "COMPLETE" : "PENDING" };
}

/**
 * Every invariant section of an invariants document, with its enforcement answer.
 * @param {string} text
 */
function invariantSections(text) {
  const sections = [];
  const lines = withoutFences(text).split("\n");
  let current = null;
  for (const line of lines) {
    const heading = /^##\s+(AI-\d+)\s*—\s*(.*)$/u.exec(line);
    if (heading !== null) {
      current = { id: heading[1], title: heading[2].trim(), enforcement: null };
      sections.push(current);
      continue;
    }
    if (/^##\s+/u.test(line)) { current = null; continue; }
    if (current === null) continue;
    const bullet = /^-\s+Enforcement:\s*(.*)$/u.exec(line);
    if (bullet !== null) current.enforcement = bullet[1].trim();
  }
  return sections;
}

/**
 * The declaration-enforcement check: a boundary declared in the charter or in
 * `ARCHITECTURAL_INVARIANTS.md` with no named enforcement mechanism is a typed
 * finding, never prose. Routes are `finding-route@1`-shaped (a single-input verb
 * plus the concrete target that resolves it).
 * @param {{guideText: string, recordText: string|null, invariantsText: string|null, featureMapText: string|null, featureMapDeclared?: boolean, invariantsPath?: string, pathExists?: (rel: string) => boolean}} input
 */
export function checkMaterialization({
  guideText,
  recordText,
  invariantsText,
  featureMapText,
  featureMapDeclared = false,
  invariantsPath = "docs/architecture/ARCHITECTURAL_INVARIANTS.md",
  pathExists = () => true,
}) {
  const boundaries = readBoundaryEntries(guideText);
  if (boundaries.malformed.length > 0) {
    throw new MaterializeRefusal(
      `the guide's ${BOUNDARY_SLOT} slot is not in the charter's two legal shapes (${boundaries.malformed[0].detail}) — run \`agentic-workflow charter check\``,
    );
  }
  const record = readRecord(recordText);
  const findings = [];

  for (const entry of boundaries.entries) {
    if (entry.enforcement !== "prose-only") continue;
    const recorded = record.rows.find((row) => row.boundary === entry.boundary);
    if (recorded === undefined) {
      findings.push({
        code: "boundary-declared-unenforced",
        detail: `"${entry.boundary}" is declared prose-only and no materialization outcome is recorded`,
        route: "continue — init-workspace",
      });
      continue;
    }
    if (recorded.outcome === "issue" || recorded.outcome === "declined") continue;
    if (!pathExists(recorded.artifact)) {
      findings.push({
        code: "boundary-artifact-missing",
        detail: `the rule recorded for "${entry.boundary}" at ${recorded.artifact} is not in the tree`,
        route: `fix — ${recorded.artifact}`,
      });
      continue;
    }
    findings.push({
      code: "boundary-declared-unenforced",
      detail: `"${entry.boundary}" has its rule at ${recorded.artifact} but the charter still answers prose-only`,
      route: `fix — ${recorded.artifact}`,
    });
  }

  for (const section of invariantSections(invariantsText ?? "")) {
    if (section.enforcement === null) {
      findings.push({
        code: "boundary-declared-unenforced",
        detail: `invariant ${section.id} ("${section.title}") declares no enforcement mechanism`,
        route: `fix — ${invariantsPath}`,
      });
      continue;
    }
    const value = section.enforcement.replace(/`/gu, "").trim();
    if (!ENFORCEMENT_MACHINE.test(value) && value !== "prose-only") {
      findings.push({
        code: "boundary-declared-unenforced",
        detail: `invariant ${section.id} ("${section.title}") states "${value}", which is neither \`machine: <mechanism>\` nor \`prose-only\``,
        route: `fix — ${invariantsPath}`,
      });
    }
  }

  const map = readFeatureMap(featureMapText);
  if (!map.present && featureMapDeclared) {
    findings.push({ code: "feature-map-missing", detail: `${FEATURE_MAP_PATH} is declared in the documentation map and absent from the tree`, route: `fix — ${FEATURE_MAP_PATH}` });
  } else if (map.present) {
    if (map.placeholderCells > 0) {
      findings.push({ code: "feature-map-shape", detail: `${map.placeholderCells} placeholder cell(s) survive in ${FEATURE_MAP_PATH}`, route: `fix — ${FEATURE_MAP_PATH}` });
    } else if (map.columns.length > 0 && map.columns.join("|") !== FEATURE_MAP_COLUMNS.join("|")) {
      findings.push({ code: "feature-map-shape", detail: `the header (${map.columns.join(", ")}) does not equal the declared columns (${FEATURE_MAP_COLUMNS.join(", ")})`, route: `fix — ${FEATURE_MAP_PATH}` });
    }
  }

  const ordered = findings.slice().sort((left, right) => `${left.code}${left.detail}`.localeCompare(`${right.code}${right.detail}`));
  return { findings: ordered, verdict: ordered.length === 0 ? "PASS" : "BLOCKED" };
}

/**
 * The outcomes payload: `{ consent: "yes"|"no", items: [{ boundary, outcome, mechanism?, path?, ref?, reason? }] }`.
 * An absent or non-boolean consent is a refusal — never a default.
 * @param {string} text
 */
function readOutcomesPayload(text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    throw new MaterializeRefusal(`the outcomes payload is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new MaterializeRefusal("the outcomes payload must be an object with `consent` and `items`");
  }
  if (payload.consent !== "yes" && payload.consent !== "no") {
    throw new MaterializeRefusal(`\`consent\` must be "yes" or "no" — a materialization writes nothing, and files nothing, without an explicit yes (got ${JSON.stringify(payload.consent)})`);
  }
  const items = payload.items ?? [];
  if (!Array.isArray(items)) throw new MaterializeRefusal("`items` must be an array of { boundary, outcome, … }");
  return { consent: payload.consent, items };
}

/** The record skeleton a project gets on its first materialization. */
const recordSkeleton = () =>
  ["# Boundary enforcement record", "", `\`\`\`text`, RECORD_MARKER, "```", "", `| ${RECORD_COLUMNS.join(" | ")} |`, `|${RECORD_COLUMNS.map(() => "---").join("|")}|`, ""].join("\n");

/** Replace the row for `boundary`, or append one. Returns the new document text. */
function upsertRecord(text, row) {
  const source = text ?? recordSkeleton();
  const line = `| ${RECORD_COLUMNS.map((column) => row[column]).join(" | ")} |`;
  const lines = source.split("\n");
  const headerAt = lines.findIndex((value) => /^\s*\|\s*boundary\s*\|/u.test(value));
  if (headerAt === -1) return `${source.replace(/\n*$/u, "\n")}${line}\n`;
  let end = headerAt + 1;
  while (end < lines.length && /^\s*\|/u.test(lines[end])) end += 1;
  const last = end - 1;
  for (let index = headerAt + 2; index < end; index += 1) {
    if (cell(lines[index])[0] === row.boundary) {
      const kept = lines[index] === line;
      lines[index] = line;
      return { text: lines.join("\n"), kept };
    }
  }
  lines.splice(last + 1, 0, line);
  return { text: lines.join("\n"), kept: false };
}

/** Rewrite the charter's boundary slot with one entry flipped to `machine: <mechanism>`. */
function flipBoundaryToMachine(guideText, boundary, mechanism) {
  const lines = guideText.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(\s*-\s+\*\*[^*]+:\*\*\s*)(.*)$/u.exec(lines[index]);
    if (match === null || match[1].includes(`${BOUNDARY_SLOT}:`) === false) continue;
    const entries = match[2].replace(/`/gu, "").split(" · ").map((entry) => {
      const parts = entry.trim().split(" → ");
      if (parts.length !== 2 || parts[0].trim() !== boundary) return entry.trim();
      return `${boundary} → machine: ${mechanism}`;
    });
    lines[index] = `${match[1]}${entries.map((entry) => `\`${entry}\``).join(" · ")}`;
    return lines.join("\n");
  }
  throw new MaterializeRefusal(`the guide carries no ${BOUNDARY_SLOT} slot, so no boundary answer can be re-recorded`);
}

/**
 * Record the team's consented outcomes. `consent: "no"` writes nothing and
 * reports one residual per item; a missing consent is a refusal. With consent,
 * every item is validated first — a scaffold whose artifact the tree does not
 * carry blocks the whole batch, so a boundary is never recorded materialized
 * when nothing materialized it.
 * @param {{guideText: string, recordText: string|null, payload: object, pathExists?: (rel: string) => boolean, date: string}} input
 */
export function applyMaterialization({ guideText, recordText, payload, pathExists = () => true, date }) {
  const { consent, items } = readOutcomesPayload(typeof payload === "string" ? payload : JSON.stringify(payload));
  if (consent === "no") {
    return {
      guideText,
      recordText,
      rows: [],
      residuals: items.map((item) => ({ kind: "boundary", item: item.boundary, reason: `the team declined to materialize it (${item.outcome ?? "no outcome given"})` })),
      findings: [],
      verdict: "DECLINED",
    };
  }

  const boundaries = readBoundaryEntries(guideText);
  const declared = new Set(boundaries.entries.map((entry) => entry.boundary));
  const findings = [];
  for (const item of items) {
    if (typeof item.boundary !== "string" || !declared.has(item.boundary)) {
      throw new MaterializeRefusal(`"${item.boundary ?? ""}" is not a boundary the guide's ${BOUNDARY_SLOT} slot declares`);
    }
    if (!OUTCOMES.includes(item.outcome)) {
      throw new MaterializeRefusal(`"${item.boundary}" names outcome ${JSON.stringify(item.outcome ?? null)}; the closed set is ${OUTCOMES.join(" / ")}`);
    }
    if (item.outcome === "scaffold") {
      if (typeof item.mechanism !== "string" || item.mechanism.trim() === "") throw new MaterializeRefusal(`"${item.boundary}" is scaffolded with no \`mechanism\` — the project names the mechanism, the workflow never invents one`);
      if (typeof item.path !== "string" || item.path.trim() === "") throw new MaterializeRefusal(`"${item.boundary}" is scaffolded with no \`path\` — the rule file is the artifact`);
      if (!pathExists(item.path)) {
        findings.push({ code: "boundary-artifact-missing", detail: `the scaffolded rule for "${item.boundary}" at ${item.path} is not in the tree`, route: `fix — ${item.path}` });
      }
    }
    if (item.outcome === "issue" && (typeof item.ref !== "string" || item.ref.trim() === "")) {
      throw new MaterializeRefusal(`"${item.boundary}" is filed as an issue with no \`ref\` — the forge reference is the artifact`);
    }
    if (item.outcome === "declined" && (typeof item.reason !== "string" || item.reason.trim() === "")) {
      throw new MaterializeRefusal(`"${item.boundary}" is declined with no \`reason\` — a refusal records why`);
    }
  }
  if (findings.length > 0) {
    return { guideText, recordText, rows: [], residuals: [], findings, verdict: "BLOCKED" };
  }

  let nextRecord = recordText;
  let nextGuide = guideText;
  const rows = [];
  for (const item of items) {
    const artifact = item.outcome === "scaffold" ? item.path : item.outcome === "issue" ? item.ref : "—";
    const written = upsertRecord(nextRecord, {
      boundary: item.boundary,
      enforcement: "prose-only",
      outcome: item.outcome,
      artifact,
      recorded: date,
    });
    nextRecord = written.text;
    if (item.outcome === "scaffold") nextGuide = flipBoundaryToMachine(nextGuide, item.boundary, item.mechanism.trim());
    rows.push({ boundary: item.boundary, outcome: item.outcome, status: written.kept ? "kept" : "written" });
  }
  return { guideText: nextGuide, recordText: nextRecord, rows, residuals: [], findings: [], verdict: "WRITTEN" };
}

/**
 * The artifact-evidence check: every acceptance criterion that names a capture
 * must record the artifact's digest and the project-declared driver command in
 * the unit's evidence carrier. With no driver declared the criterion fails
 * closed with a `manual:` label — it never passes on prose.
 * @param {{guideText: string, unitText: string, unitPath?: string}} input
 */
export function checkArtifactEvidence({ guideText, unitText, unitPath = "the unit doc" }) {
  const driver = readDriver(guideText);
  const criteria = [];
  const acceptance = sectionBody(unitText, "Acceptance criteria");
  for (const line of (acceptance ?? "").split("\n")) {
    if (!/^\s*\|/u.test(line) || /^\s*\|\s*[-: ]+\|/u.test(line)) continue;
    const values = cell(line);
    const id = CRITERION_ID.exec(values[0] ?? "");
    if (id === null) continue;
    const text = values.slice(1).join(" | ");
    if (!ARTIFACT_CRITERION.test(text)) continue;
    criteria.push({ criterion: `AC-${id[1]}`, text });
  }

  const evidence = sectionBody(unitText, "Evidence");
  const log = sectionBody(unitText, "Log");
  const entries = [];
  if (evidence !== null) {
    const rows = evidence.split("\n").filter((line) => /^\s*\|/u.test(line) && !/^\s*\|\s*[-: ]+\|/u.test(line));
    const header = rows.length > 0 ? cell(rows[0]) : [];
    if (header[0] !== "AC") rows.shift();
    for (const line of rows) {
      const values = cell(line);
      entries.push({ id: values[0] ?? "", run: values[1] ?? "", exit: values[2] ?? "", line });
    }
  } else if (log !== null) {
    for (const line of log.split("\n")) {
      if (!/^- \*\*E\d+\*\*/u.test(line)) continue;
      entries.push({ id: null, run: line, exit: line, line });
    }
  }

  const findings = [];
  const rows = [];
  if (criteria.length > 0 && !driver.declared) {
    findings.push({ code: "evidence-driver-missing", detail: `no ${DRIVER_SLOT} is declared, so a capture criterion cannot record its digest`, route: "fix — AGENTS.md" });
  }
  for (const criterion of criteria) {
    if (!driver.declared) {
      rows.push({ criterion: criterion.criterion, status: "manual", detail: `no ${DRIVER_SLOT} declared` });
      continue;
    }
    const number = criterion.criterion.slice(3);
    const addresses = new RegExp(`(^|[^0-9])AC-?${number}([^0-9]|$)`, "u");
    const entry = entries.find((candidate) => (candidate.id === null ? addresses.test(candidate.line) : addresses.test(candidate.id)));
    if (entry === undefined) {
      rows.push({ criterion: criterion.criterion, status: "manual", detail: "no evidence entry records it" });
      findings.push({ code: "artifact-evidence-missing", detail: `${criterion.criterion} names a capture and no evidence entry records it`, route: `fix — ${unitPath}` });
      continue;
    }
    if (!DIGEST.test(entry.exit)) {
      rows.push({ criterion: criterion.criterion, status: "manual", detail: "no digest: sha256:<hex> recorded" });
      findings.push({ code: "artifact-evidence-missing", detail: `${criterion.criterion} records no digest: sha256:<hex> for its artifact`, route: `fix — ${unitPath}` });
      continue;
    }
    if (!entry.run.includes(driver.command)) {
      rows.push({ criterion: criterion.criterion, status: "manual", detail: `does not name the declared driver (${driver.command})` });
      findings.push({ code: "artifact-evidence-missing", detail: `${criterion.criterion} does not name the declared driver ${driver.command}`, route: `fix — ${unitPath}` });
      continue;
    }
    rows.push({ criterion: criterion.criterion, status: "recorded", detail: (DIGEST.exec(entry.exit) ?? ["digest"])[0] });
  }
  const ordered = findings.slice().sort((left, right) => `${left.code}${left.detail}`.localeCompare(`${right.code}${right.detail}`));
  return { driver: driver.declared ? driver.command : null, rows, findings: ordered, verdict: ordered.length === 0 ? "PASS" : "BLOCKED" };
}

/** The body of one `## <name>` section, or null when the document has none. */
function sectionBody(text, name) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line === `## ${name}`);
  if (start === -1) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith("## ")) { end = index; break; }
  }
  return lines.slice(start + 1, end).join("\n");
}

// ── CLI ───────────────────────────────────────────────────────────────────

const USAGE =
  "usage: materialize plan --guide <path> | materialize check --guide <path> [--invariants <path>] [--feature-map <path>] [--feature-map-declared] | materialize apply --guide <path> --outcomes <path|-> [--record <path>] [--date <YYYY-MM-DD>] | materialize evidence --guide <path> --unit <path>";

/**
 * The flags each operation takes (`--json` and `--root` are legal everywhere).
 * An operation-foreign flag is refused with exit 2 before anything is read or
 * written — a flag accepted-and-discarded would report success for a run that
 * never happened.
 */
const OPERATION_FLAGS = Object.freeze({
  plan: ["guide", "record", "feature-map"],
  check: ["guide", "record", "invariants", "feature-map", "feature-map-declared"],
  apply: ["guide", "record", "outcomes", "date"],
  evidence: ["guide", "unit"],
});

const BOOLEAN_FLAGS = new Set(["json", "feature-map-declared"]);

const parseFlags = (args) => {
  const flags = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) throw new MaterializeRefusal(`unexpected argument "${arg}" — ${USAGE}`);
    const name = arg.slice(2);
    if (BOOLEAN_FLAGS.has(name)) { flags[name] = true; continue; }
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) throw new MaterializeRefusal(`${arg} requires a value — ${USAGE}`);
    flags[name] = value;
    index += 1;
  }
  return flags;
};

const readText = (file, what) => {
  try {
    return readFileSync(resolve(file), "utf8");
  } catch (error) {
    throw new MaterializeRefusal(`${what} could not be read: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/** The receipt lines every operation prints after its own block. */
const printFindings = (findings) => {
  for (const finding of findings) process.stdout.write(`- ${finding.code}: ${finding.detail} · route: ${finding.route}\n`);
};

/**
 * The `materialize` subcommand.
 * @param {string[]} args
 * @returns {number} the exit code
 */
export function run(args) {
  try {
    const [operation, ...rest] = args;
    const allowed = OPERATION_FLAGS[operation];
    if (allowed === undefined) throw new MaterializeRefusal(`unknown operation "${operation ?? ""}" — ${USAGE}`);
    const flags = parseFlags(rest);
    for (const flag of Object.keys(flags)) {
      if (flag === "json" || flag === "root" || allowed.includes(flag)) continue;
      throw new MaterializeRefusal(`unknown argument "--${flag}" for \`materialize ${operation}\` — ${USAGE}`);
    }
    if (flags.guide === undefined) throw new MaterializeRefusal(`no --guide given — ${USAGE}`);
    const root = flags.root === undefined ? "." : flags.root;
    const at = (file) => resolve(root, file);

    if (operation === "plan") {
      const guideText = readText(at(flags.guide), "the guide");
      const recordPath = flags.record === undefined ? RECORD_PATH : flags.record;
      const featureMapPath = flags["feature-map"] === undefined ? FEATURE_MAP_PATH : flags["feature-map"];
      const result = planMaterialization({
        guideText,
        recordText: existsSync(at(recordPath)) ? readText(at(recordPath), "the record") : null,
        featureMapText: existsSync(at(featureMapPath)) ? readText(at(featureMapPath), "the feature map") : null,
      });
      const pending = result.rows.filter((row) => row.status === "pending" || row.status === "missing" || row.status === "undeclared").length;
      if (flags.json) {
        process.stdout.write(`${JSON.stringify({ contract: CONTRACT_ID, ok: true, operation, guide: flags.guide, ...result }, null, 2)}\n`);
        return 0;
      }
      process.stdout.write(`MATERIALIZE PLAN — ${flags.guide} · ${result.rows.length} item(s) · pending ${pending}\n`);
      for (const row of result.rows) process.stdout.write(`- ${row.kind} ${row.item}: ${row.status}${row.detail === "" ? "" : ` (${row.detail})`}\n`);
      for (const residual of result.residuals) process.stdout.write(`residual: ${residual.kind} ${residual.item} — ${residual.reason}\n`);
      process.stdout.write(`verdict: ${result.verdict}\n`);
      return 0;
    }

    if (operation === "check") {
      const guideText = readText(at(flags.guide), "the guide");
      const recordPath = flags.record === undefined ? RECORD_PATH : flags.record;
      const recordText = existsSync(at(recordPath)) ? readText(at(recordPath), "the record") : null;
      const invariantsPath = flags.invariants === undefined ? "docs/architecture/ARCHITECTURAL_INVARIANTS.md" : flags.invariants;
      const featureMapPath = flags["feature-map"] === undefined ? FEATURE_MAP_PATH : flags["feature-map"];
      const result = checkMaterialization({
        guideText,
        recordText,
        invariantsText: existsSync(at(invariantsPath)) ? readText(at(invariantsPath), "the invariants document") : null,
        featureMapText: existsSync(at(featureMapPath)) ? readText(at(featureMapPath), "the feature map") : null,
        featureMapDeclared: flags["feature-map-declared"] === true,
        invariantsPath,
        pathExists: (rel) => existsSync(at(rel)),
      });
      if (flags.json) {
        process.stdout.write(`${JSON.stringify({ contract: CONTRACT_ID, ok: result.verdict === "PASS", operation, guide: flags.guide, ...result }, null, 2)}\n`);
        return result.verdict === "PASS" ? 0 : 1;
      }
      if (result.verdict === "PASS") {
        process.stdout.write(`MATERIALIZE CHECK PASS — ${flags.guide}\nverdict: PASS\n`);
        return 0;
      }
      process.stdout.write(`MATERIALIZE CHECK BLOCKED — ${result.findings.length} finding(s)\n`);
      printFindings(result.findings);
      process.stdout.write("verdict: BLOCKED\n");
      return 1;
    }

    if (operation === "apply") {
      if (flags.outcomes === undefined) throw new MaterializeRefusal(`no --outcomes given — ${USAGE}`);
      const guidePath = at(flags.guide);
      const guideText = readText(guidePath, "the guide");
      const recordPath = flags.record === undefined ? RECORD_PATH : flags.record;
      const recordText = existsSync(at(recordPath)) ? readText(at(recordPath), "the record") : null;
      const raw = flags.outcomes === "-" ? readStdin() : readText(at(flags.outcomes), "the outcomes payload");
      const date = flags.date ?? new Date().toISOString().slice(0, 10);
      const result = applyMaterialization({ guideText, recordText, payload: raw, pathExists: (rel) => existsSync(at(rel)), date });
      if (result.verdict === "WRITTEN") {
        if (result.recordText !== recordText) writeFileSync(at(recordPath), result.recordText, "utf8");
        if (result.guideText !== guideText) writeFileSync(guidePath, result.guideText, "utf8");
      }
      const tally = (status) => result.rows.filter((row) => row.status === status).length;
      const declined = result.residuals.length;
      if (flags.json) {
        const ok = result.verdict !== "BLOCKED";
        process.stdout.write(`${JSON.stringify({ contract: CONTRACT_ID, ok, operation, guide: flags.guide, ...result }, null, 2)}\n`);
        return ok ? 0 : 1;
      }
      if (result.verdict === "BLOCKED") {
        process.stdout.write(`MATERIALIZE APPLY BLOCKED — ${result.findings.length} finding(s)\n`);
        printFindings(result.findings);
        process.stdout.write("verdict: BLOCKED\n");
        return 1;
      }
      process.stdout.write(
        `MATERIALIZE APPLY — ${flags.guide} · written ${tally("written")} · kept ${tally("kept")} · declined ${declined} · residual ${declined}\n`,
      );
      for (const row of result.rows) process.stdout.write(`- ${row.boundary}: ${row.status} (${row.outcome})\n`);
      for (const residual of result.residuals) process.stdout.write(`residual: ${residual.kind} ${residual.item} — ${residual.reason}\n`);
      process.stdout.write(`verdict: ${result.verdict}\n`);
      return 0;
    }

    if (operation === "evidence") {
      if (flags.unit === undefined) throw new MaterializeRefusal(`no --unit given — ${USAGE}`);
      const result = checkArtifactEvidence({
        guideText: readText(at(flags.guide), "the guide"),
        unitText: readText(at(flags.unit), "the unit document"),
        unitPath: flags.unit,
      });
      if (flags.json) {
        process.stdout.write(`${JSON.stringify({ contract: CONTRACT_ID, ok: result.verdict === "PASS", operation, unit: flags.unit, ...result }, null, 2)}\n`);
        return result.verdict === "PASS" ? 0 : 1;
      }
      const recorded = result.rows.filter((row) => row.status === "recorded").length;
      const manual = result.rows.filter((row) => row.status === "manual").length;
      if (result.verdict === "PASS") {
        process.stdout.write(`MATERIALIZE EVIDENCE — ${flags.unit} · driver ${result.driver ?? "none"} · recorded ${recorded} · manual ${manual}\nverdict: PASS\n`);
        return 0;
      }
      process.stdout.write(`MATERIALIZE EVIDENCE BLOCKED — ${result.findings.length} finding(s)\n`);
      printFindings(result.findings);
      for (const row of result.rows.filter((candidate) => candidate.status === "manual")) {
        process.stdout.write(`manual: ${row.criterion} — ${row.detail}\n`);
      }
      process.stdout.write("verdict: BLOCKED\n");
      return 1;
    }

    throw new MaterializeRefusal(`unknown operation "${operation}" — ${USAGE}`);
  } catch (error) {
    if (!(error instanceof MaterializeRefusal)) throw error;
    process.stderr.write(`EDIT REFUSAL — ${error.message}\n`);
    return 2;
  }
}

/** `--outcomes -`: the payload arrives on stdin, e.g. from a heredoc. */
const readStdin = () => {
  try {
    return readFileSync(0, "utf8");
  } catch (error) {
    throw new MaterializeRefusal(`stdin is unreadable: ${error instanceof Error ? error.message : String(error)}`);
  }
};
