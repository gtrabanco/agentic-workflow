/**
 * retention.mjs — the doc-retention write path (issue #651).
 *
 * A merged unit's process artifacts (phase logs, task lists, review ledgers) are
 * never read again, while the decision-grade record beside them is. This module
 * is the one place that collapses the first into the second:
 *
 *   settleUnitDoc    the pure projection — a `spec-by-reference` carrier becomes
 *                    the settled one, its evidence table folded into one `## Log`
 *                    `E` line, and nothing else touched;
 *   assessUnit       the folder's classification against the published matrix,
 *                    with every way a unit is not a candidate named;
 *   planRetention    the report `doc archive --dry-run` prints: candidates,
 *                    refusals and the permanently out-of-scope documents;
 *   archiveRetention the write path — archive first (byte-bound by a manifest),
 *                    then the settle, then the deletions;
 *   restoreRetention the read path back, refusing a tampered archive before it
 *                    writes anything.
 *
 * Two invariants bound every write:
 *
 *  - **Nothing is deleted before it is archived**, and the archive carries a
 *    `sha256:` digest per file, so a restore re-hashes before it writes.
 *  - **A refusal moves no byte.** Every precondition is evaluated over the whole
 *    plan first; a unit that fails one is reported and skipped, never half-done.
 *
 * The matrix, the eligibility states and the archive contract are the schema
 * package's published consts (`doc-retention.ts`) — this module owns the
 * operations, never a second copy of the vocabulary.
 */

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

import {
  DOC_RETENTION_ARCHIVE_CONTRACT,
  DOC_RETENTION_DEFAULTS,
  RETENTION_DIGEST_PATTERN,
  UNIT_DOC_KEEP_FILES,
  UNIT_DOC_SETTLED_SECTIONS,
  UNIT_DOC_TRIM_FILES,
  classifyUnitRetention,
  validateRetentionArchive,
} from "@gtrabanco/agentic-workflow-schema";

import { createConfigApi } from "../config/api.mjs";
import { parseProvenance, deriveFormat, headingsOf, stampDocument } from "../edit/Provenance.mjs";
import { splitSections } from "../runner/unit-doc-phases.mjs";
import { readRoadmapIndex, roadmapTableRows } from "../index-document.mjs";

/** The sections a settle removes outright. */
export const SETTLED_TRIM_SECTIONS = Object.freeze(["Tasks", "Findings", "Applicable tests", "Next"]);

/** The section a settle folds into a `## Log` digest line. */
export const SETTLED_EVIDENCE_SECTION = "Evidence";

/** The archive manifest's file name inside a unit's archive directory. */
export const ARCHIVE_MANIFEST = "manifest.json";

/** The archived-bytes directory name inside a unit's archive directory. */
export const ARCHIVE_FILES_DIR = "files";

const isDir = (path) => {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
};

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const digestOf = (text) => `sha256:${sha256(text)}`;

const shortDigest = (text) => sha256(text).slice(0, 12);

const isGitRepo = (root) => {
  const result = spawnSync("git", ["-C", root, "rev-parse", "--is-inside-work-tree"], { encoding: "utf8" });
  return result.status === 0 && result.stdout.trim() === "true";
};

/** The folder's uncommitted paths, or `[]` when git cannot answer (a tarball). */
function dirtyPaths(root, dir) {
  if (!isGitRepo(root)) return [];
  const result = spawnSync("git", ["-C", root, "status", "--porcelain", "--", dir], { encoding: "utf8" });
  if (result.status !== 0) return [];
  return result.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
}

/** True when `rel` is ignored by git, or by `.gitignore` when there is no repo. */
export function isArchiveIgnored(root, rel) {
  const clean = rel.replace(/^\.\//u, "").replace(/\/+$/u, "");
  if (isGitRepo(root)) {
    // Probe a path INSIDE the directory: a `dir/` pattern matches its contents
    // whether or not the directory exists yet, while the bare directory path
    // only matches once git can see it as a directory.
    const result = spawnSync("git", ["-C", root, "check-ignore", "-q", "--", `${clean}/.probe`], { encoding: "utf8" });
    return result.status === 0;
  }
  const ignore = join(root, ".gitignore");
  if (!existsSync(ignore)) return false;
  for (const line of readFileSync(ignore, "utf8").split("\n")) {
    const pattern = line.trim().replace(/^\.\//u, "").replace(/\/+$/u, "");
    if (pattern === "" || pattern.startsWith("#") || pattern.startsWith("!")) continue;
    if (pattern === clean || clean.startsWith(`${pattern}/`)) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ the settle */

/**
 * The one `E` line a settle appends to `## Log`: which commands the removed
 * evidence table recorded, their exit status, and a digest of the bytes that left
 * the carrier — so the receipt is reproducible without the table.
 */
function evidenceDigestLine(evidenceBody, { settledAt }) {
  const rows = evidenceBody
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 3 && !cells.every((cell) => /^[-:\s]*$/u.test(cell)) && cells[0] !== "AC");
  const commands = rows.map((cells) => {
    const command = cells[1] ?? "";
    const exit = cells[2] ?? "";
    return `${command}${exit === "" ? "" : ` exit ${exit}`}`;
  });
  const detail = commands.length === 0 ? "no evidence row was recorded" : commands.join("; ");
  const date = settledAt.slice(0, 10);
  return `- **E1** — ${date}, the evidence table collapsed at settle — ${rows.length} row(s): ${detail} — carrier digest \`sha256:${shortDigest(evidenceBody)}\`.`;
}

const appendToSection = (raw, line) => `${raw.replace(/\n+$/u, "")}\n${line}\n\n`;

/**
 * The settle projection (S3). Pure: the caller supplies the text and gets the
 * settled carrier back, or a typed refusal naming why it cannot settle.
 *
 * A settle is a **carrier** change, never a content rewrite: every kept section
 * is re-emitted byte-for-byte, `## Log` is untouched apart from the one appended
 * digest line, and only `Tasks`, `Findings`, `Applicable tests`, `Next` and the
 * evidence table leave.
 *
 * @returns {{ ok: true, text: string, removed: string[] } | { ok: false, reason: string, errors: string[] }}
 */
export function settleUnitDoc(text, { settledAt = new Date().toISOString() } = {}) {
  const fail = (reason, errors = [reason]) => ({ ok: false, reason, errors });
  const parsed = parseProvenance(text);
  if (parsed.errors.length > 0) return fail("stamp-invalid", parsed.errors);
  if (parsed.value === null) return fail("unstamped");
  const format = parsed.value.format;
  if (format === "unit-doc@1") return fail("older-format");
  if (format === "unit-doc@3") return fail("already-settled");
  if (format !== "unit-doc@2") return fail("unsupported-format");
  const derived = deriveFormat(headingsOf(text));
  if (derived === "unit-doc@3") return fail("already-settled");
  if (derived === "unit-doc@1") return fail("older-format");
  if (derived !== "unit-doc@2") return fail("unknown-carrier");

  const { preamble, sections } = splitSections(text);
  const removed = [];
  const kept = [];
  let logIndex = -1;
  sections.forEach((section, index) => {
    if (SETTLED_TRIM_SECTIONS.includes(section.heading) || section.heading === SETTLED_EVIDENCE_SECTION) {
      removed.push(section.heading);
      return;
    }
    if (section.heading === "Log") logIndex = kept.length;
    kept.push(section);
  });
  // `## Log` is a required section of the full carrier, so a document missing it
  // already failed the carrier derivation above; the guard keeps the projection
  // total if the shape table ever loosens that.
  if (logIndex === -1) return fail("no-log-section");
  const evidence = sections.find((section) => section.heading === SETTLED_EVIDENCE_SECTION);
  if (evidence !== undefined && logIndex !== -1) {
    kept[logIndex] = {
      ...kept[logIndex],
      raw: appendToSection(kept[logIndex].raw, evidenceDigestLine(evidence.raw, { settledAt })),
    };
  }

  const body = `${preamble}${kept.map((section) => section.raw).join("")}`;
  // The projection must satisfy the settled carrier before a stamp is written:
  // a document missing one of its sections would be stamped with a format its
  // own headings deny, which is exactly the half state the validator refuses.
  const settledHeadings = headingsOf(body);
  const missing = UNIT_DOC_SETTLED_SECTIONS.filter((section) => !settledHeadings.includes(section));
  if (missing.length > 0) return fail("missing-settled-section", missing);
  // The settled carrier derives `unit-doc@3`; the stamp is re-emitted from the
  // document that will actually exist, never carried over from the old carrier.
  const settled = stampDocument(body);
  return { ok: true, text: settled, removed };
}

/* -------------------------------------------------------------- the assessment */

/** True when a legacy `review-findings.md` still carries an unfoleded row. */
function hasOpenFindings(text) {
  if (typeof text !== "string") return false;
  const rows = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
  for (const row of rows) {
    const cells = row.split("|").slice(1, -1).map((cell) => cell.trim().toLowerCase());
    if (cells.length === 0) continue;
    if (cells[0] === "id") continue;
    if (cells.every((cell) => /^[-:\s]*$/u.test(cell))) continue;
    const folded = cells.at(-1) ?? "";
    if (folded !== "yes" && !folded.includes("fold ")) return true;
  }
  return false;
}

/**
 * Classify one unit folder against the published matrix.
 *
 * `status` is the unit's roadmap/fix-index row status; the sensor passes `done`
 * only when its own merge resolver proves the merge, which is the one difference
 * between the offline report and the shipped one (decision D4).
 *
 * @param {{ unit: string, text: string, status: string | null, files: string[], dirty?: boolean, reviewFindings?: string | null }} input
 */
export function assessUnit({ unit, text, status, files, dirty = false, reviewFindings = null }) {
  const shape = shapeOf(text);
  const parsed = parseProvenance(text);
  const format = parsed.value === null ? null : parsed.value.format;
  const present = [...files].sort();
  const openFindings = present.includes("review-findings.md") && hasOpenFindings(reviewFindings);
  const verdict = classifyUnitRetention({ status, shape, format, dirty, openFindings });
  const trim = present.filter((name) => UNIT_DOC_TRIM_FILES.includes(name));
  const kept = present.filter((name) => UNIT_DOC_KEEP_FILES.includes(name));
  const unclassified = present.filter((name) => !trim.includes(name) && !kept.includes(name));
  const blocked = unclassified.length > 0 && verdict.state === "eligible" ? "unclassified-file" : null;
  return {
    unit,
    status,
    shape,
    format,
    state: verdict.state,
    eligible: verdict.eligible,
    reason: verdict.reason,
    writable: verdict.eligible && blocked === null,
    blocked,
    trim,
    kept,
    unclassified,
  };
}

/** The accepted shape a document's headings satisfy, or null. */
function shapeOf(text) {
  const derived = deriveFormat(headingsOf(text));
  if (derived === "unit-doc@1") return "legacy";
  if (derived === "unit-doc@2") return "spec-by-reference";
  if (derived === "unit-doc@3") return "settled";
  return null;
}

/* ------------------------------------------------------------------ the report */

/** The unit folders of a repository: `docs/features/<id>` and `docs/fix/<id>`. */
export function unitDirs(root) {
  const out = [];
  for (const kind of ["features", "fix"]) {
    const base = join(root, "docs", kind);
    if (!isDir(base)) continue;
    for (const name of readdirSync(base).sort()) {
      if (name.startsWith("_")) continue;
      if (isDir(join(base, name))) out.push(`docs/${kind}/${name}`);
    }
  }
  return out;
}

/** The roadmap and fix-index statuses, keyed by repo-relative unit folder. */
function statusByUnit(root) {
  const map = new Map();
  const index = readRoadmapIndex(root);
  if (index === null) return map;
  for (const cells of roadmapTableRows(index.text, "feature")) {
    const [nn, slug, status] = cells;
    if (!/^\d+$/u.test(nn ?? "") || slug === undefined || status === undefined) continue;
    map.set(`docs/features/${nn}-${slug.replace(/`/gu, "").trim()}`, statusToken(status));
  }
  for (const cells of roadmapTableRows(index.text, "fix")) {
    const [issue, topic, status] = cells;
    const number = /(\d+)/u.exec(issue ?? "")?.[1];
    if (number === undefined || topic === undefined || status === undefined) continue;
    map.set(`docs/fix/${number}-${topic.replace(/`/gu, "").trim()}`, statusToken(status));
  }
  return map;
}

const statusToken = (cell) => (/^([a-z][a-z-]*)/iu.exec(String(cell ?? "").replace(/`/gu, "").trim())?.[1] ?? "").toLowerCase() || null;

/** The last dated `## Log` entry's day count from `now`, or 0 when undated. */
export function logAgeDays(text, now = new Date()) {
  const dates = [...text.matchAll(/^- \*\*[LDRFEVPG]\d+\*\* — (\d{4}-\d{2}-\d{2})/gmu)].map((match) => match[1]);
  if (dates.length === 0) return 0;
  const last = dates.sort().at(-1);
  const at = Date.parse(`${last}T00:00:00Z`);
  if (Number.isNaN(at)) return 0;
  return Math.max(0, Math.floor((now.getTime() - at) / 86_400_000));
}

/**
 * The eligibility report (`doc archive --dry-run`): one row per unit folder, the
 * candidate list, and the documents that are out of scope forever — reported
 * visibly, never skipped (S5).
 */
export function planRetention({ root, config = DOC_RETENTION_DEFAULTS, now = new Date() } = {}) {
  const statuses = statusByUnit(root);
  const rows = [];
  for (const unit of unitDirs(root)) {
    const abs = join(root, unit);
    const specPath = join(abs, "SPEC.md");
    if (!existsSync(specPath)) continue;
    const text = readFileSync(specPath, "utf8");
    const findingsPath = join(abs, "review-findings.md");
    const row = assessUnit({
      unit,
      text,
      status: statuses.get(unit) ?? null,
      files: readdirSync(abs).filter((name) => statSync(join(abs, name)).isFile()),
      dirty: dirtyPaths(root, unit).length > 0,
      reviewFindings: existsSync(findingsPath) ? readFileSync(findingsPath, "utf8") : null,
    });
    row.age_days = logAgeDays(text, now);
    row.offered = row.writable && row.age_days >= (config.pendingTrimAfterDays ?? 0);
    rows.push(row);
  }
  const summary = {};
  for (const row of rows) summary[row.state] = (summary[row.state] ?? 0) + 1;
  return {
    contract: "doc-retention-plan@1",
    dry_run: true,
    mode: config.mode ?? DOC_RETENTION_DEFAULTS.mode,
    archive_dir: config.archiveDir ?? DOC_RETENTION_DEFAULTS.archiveDir,
    trim_allowed: (config.mode ?? DOC_RETENTION_DEFAULTS.mode) === "archive",
    rows,
    eligible: rows.filter((row) => row.writable),
    offered: rows.filter((row) => row.offered),
    out_of_scope: rows.filter((row) => row.state === "unstamped" || row.state === "older-format"),
    summary,
  };
}

/* ------------------------------------------------------------------- the write */

const archiveDirOf = (root, config) => resolve(root, config.archiveDir ?? DOC_RETENTION_DEFAULTS.archiveDir);

const unitBase = (unit) => unit.split("/").pop();

/** The refusal a precondition produces, in evaluation order. */
function precondition({ root, row, config, plan }) {
  // The unit's own answer comes first: "your unit is not a candidate" is more
  // useful than the policy's posture, and a refusal names one thing.
  if (row === undefined) return "unknown-unit";
  if (row.state !== "eligible") return row.state;
  if (row.unclassified.length > 0) return "unclassified-file";
  if (plan.mode !== "archive") return "mode-keep-all";
  if (!isArchiveIgnored(root, relative(root, archiveDirOf(root, config)))) return "archive-not-ignored";
  const target = join(archiveDirOf(root, config), unitBase(row.unit));
  if (existsSync(target)) return "archive-exists";
  return null;
}

/** Write one unit's archive into a staging directory, then rename it into place. */
function stageArchive({ root, config, row, settledAt }) {
  const archiveRoot = archiveDirOf(root, config);
  mkdirSync(archiveRoot, { recursive: true });
  const staging = join(archiveRoot, `.staging-${unitBase(row.unit)}-${process.pid}-${Date.now()}`);
  const filesDir = join(staging, ARCHIVE_FILES_DIR);
  mkdirSync(filesDir, { recursive: true });
  const unitAbs = join(root, row.unit);
  const files = [];
  for (const name of row.trim) {
    const bytes = readFileSync(join(unitAbs, name));
    writeFileSync(join(filesDir, name), bytes);
    files.push({ path: name, contentHash: digestOf(bytes) });
  }
  const specPath = join(unitAbs, "SPEC.md");
  const specDigest = digestOf(readFileSync(specPath));
  const manifest = {
    contract: DOC_RETENTION_ARCHIVE_CONTRACT,
    unit: row.unit,
    settled_at: settledAt,
    source_revision: headRevision(root),
    spec_digest: specDigest,
    files,
  };
  const validation = validateRetentionArchive(manifest);
  if (!validation.valid) {
    rmSync(staging, { recursive: true, force: true });
    return { ok: false, reason: "manifest-invalid", errors: validation.errors };
  }
  writeFileSync(join(staging, ARCHIVE_MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  const target = join(archiveRoot, unitBase(row.unit));
  renameSync(staging, target);
  return { ok: true, target, manifest };
}

function headRevision(root) {
  const result = spawnSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" });
  const value = result.status === 0 ? result.stdout.trim() : "";
  return /^[0-9a-f]{7,40}$/u.test(value) ? value : "0".repeat(40);
}

/** Run the project-declared seam hook (decision D6). Never throws. */
function runSeamHook({ root, config, unit, archive }) {
  const hook = config.seamHook;
  if (typeof hook !== "string" || hook.trim() === "") return { ran: false, exit: null };
  const [command, ...args] = hook.trim().split(/\s+/u);
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, AGENTIC_WORKFLOW_UNIT: unit, AGENTIC_WORKFLOW_ARCHIVE_DIR: archive },
  });
  return { ran: true, command: hook, exit: result.status, stderr: (result.stderr ?? "").trim() };
}

/**
 * `doc archive` (S5). Every precondition is evaluated over the whole plan first,
 * so a refusal moves no byte; then each target is archived, settled and trimmed.
 */
export function archiveRetention({ root, config = DOC_RETENTION_DEFAULTS, only = null, allEligible = false, dryRun = false, now = new Date() } = {}) {
  const plan = planRetention({ root, config, now });
  const rows = only === null ? plan.rows : plan.rows.filter((row) => row.unit === only);
  const targets = only !== null
    ? rows
    : allEligible
      ? plan.offered
      : [];
  if (only !== null && rows.length === 0) {
    return { ok: false, contract: "doc-retention-archive-receipt@1", dry_run: dryRun, plan, archived: [], refused: [{ unit: only, reason: "unknown-unit" }], degradations: [], hooks: [] };
  }
  const decisions = targets.map((row) => ({ row, reason: precondition({ root, row, config, plan }) }));

  if (dryRun) {
    const wouldArchive = decisions.filter((entry) => entry.reason === null).map((entry) => entry.row.unit);
    const refused = decisions.filter((entry) => entry.reason !== null).map((entry) => ({ unit: entry.row.unit, reason: entry.reason }));
    if (only !== null && decisions.length === 1 && decisions[0].reason !== null) {
      return { ok: false, contract: "doc-retention-archive-receipt@1", dry_run: true, plan, archived: [], refused, degradations: [], hooks: [] };
    }
    return { ok: true, contract: "doc-retention-archive-receipt@1", dry_run: true, plan, archived: [], would_archive: wouldArchive, refused, degradations: [], hooks: [] };
  }

  const archived = [];
  const refused = [];
  const degradations = [];
  const hooks = [];
  for (const { row, reason } of decisions) {
    if (reason !== null) {
      refused.push({ unit: row.unit, reason });
      continue;
    }
    const settledAt = now.toISOString();
    const staged = stageArchive({ root, config, row, settledAt });
    if (!staged.ok) {
      refused.push({ unit: row.unit, reason: staged.reason });
      continue;
    }
    const specPath = join(root, row.unit, "SPEC.md");
    const settled = settleUnitDoc(readFileSync(specPath, "utf8"), { settledAt });
    if (!settled.ok) {
      // The archive is durable; nothing was deleted. Report and move on.
      rmSync(staged.target, { recursive: true, force: true });
      refused.push({ unit: row.unit, reason: settled.reason });
      continue;
    }
    writeAtomic(specPath, settled.text);
    for (const name of row.trim) rmSync(join(root, row.unit, name), { force: true });
    archived.push(row.unit);
    const hook = runSeamHook({ root, config, unit: row.unit, archive: staged.target });
    if (hook.ran) {
      hooks.push({ unit: row.unit, ...hook });
      if (hook.exit !== 0) {
        degradations.push(`seam-hook: ${hook.command} exited ${hook.exit} for ${row.unit} — the local archive is durable, the offsite copy is not`);
      }
    }
  }
  return {
    ok: refused.length === 0,
    contract: "doc-retention-archive-receipt@1",
    dry_run: false,
    plan,
    archived,
    refused,
    degradations,
    hooks,
  };
}

function writeAtomic(path, content) {
  const temporary = join(dirname(path), `.${path.split(sep).pop()}.retention.tmp`);
  writeFileSync(temporary, content);
  renameSync(temporary, path);
}

/* ------------------------------------------------------------------ the restore */

/**
 * `doc restore` (S5): put an archived carrier back. Every archived file is
 * re-hashed before the first write, so a tampered archive cannot overwrite a
 * document, and a file whose on-disk bytes differ is a conflict, never a silent
 * overwrite.
 */
export function restoreRetention({ root, config = DOC_RETENTION_DEFAULTS, unit } = {}) {
  const archiveRoot = archiveDirOf(root, config);
  const target = join(archiveRoot, unitBase(unit));
  const manifestPath = join(target, ARCHIVE_MANIFEST);
  if (!existsSync(manifestPath)) {
    return { ok: false, restored: [], refused: [{ unit, reason: "archive-missing" }] };
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return { ok: false, restored: [], refused: [{ unit, reason: "manifest-invalid", detail: error.message }] };
  }
  const validation = validateRetentionArchive(manifest);
  if (!validation.valid) {
    return { ok: false, restored: [], refused: [{ unit, reason: "manifest-invalid", detail: validation.errors.join("; ") }] };
  }
  const unitAbs = join(root, manifest.unit);
  const verified = [];
  for (const row of manifest.files) {
    const archived = join(target, ARCHIVE_FILES_DIR, row.path);
    if (!existsSync(archived)) return { ok: false, restored: [], refused: [{ unit, reason: "archive-incomplete", detail: row.path }] };
    const bytes = readFileSync(archived);
    if (digestOf(bytes) !== row.contentHash || !RETENTION_DIGEST_PATTERN.test(row.contentHash)) {
      return { ok: false, restored: [], refused: [{ unit, reason: "content-hash-mismatch", detail: row.path }] };
    }
    const destination = join(unitAbs, row.path);
    if (existsSync(destination) && digestOf(readFileSync(destination)) !== row.contentHash) {
      return { ok: false, restored: [], refused: [{ unit, reason: "target-conflict", detail: row.path }] };
    }
    verified.push({ row, bytes, destination });
  }
  const restored = [];
  for (const { row, bytes, destination } of verified) {
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, bytes);
    restored.push(row.path);
  }
  return { ok: true, unit: manifest.unit, restored, refused: [] };
}

/* -------------------------------------------------------------------- the config */

/**
 * The project's `docRetention` section, filled with the shipped defaults.
 *
 * The config is read through the same API the `config` CLI uses, so an operator
 * reading `config get docRetention` and the trimmer can never disagree about
 * "absent". A config the resolver refuses degrades to the shipped defaults —
 * detection still reports, and `keep-all` is the safe posture.
 */
export function readRetentionConfig({ root } = {}) {
  const fallback = { ...DOC_RETENTION_DEFAULTS, degradations: [] };
  try {
    const { value } = createConfigApi({ projectDir: root }).get("resolved", ["docRetention"]);
    return { ...DOC_RETENTION_DEFAULTS, ...value, degradations: [] };
  } catch (error) {
    return { ...fallback, degradations: [`docRetention: ${error.message}`] };
  }
}
