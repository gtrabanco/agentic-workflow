/**
 * scaffold-contract.mjs — the scaffold contract that travels (issue #701).
 *
 * The failure this closes is a distribution gap, not a code defect.
 * `scripts/scaffold-parity.test.mjs` compares the vendor's export with its repo
 * twin, but it runs *in the vendor repo over the export*: it never reaches a
 * consumer install, so nothing re-checks the templates a consumer keeps after
 * drift, an upgrade, or a local edit. A fresh relay then writes a unit doc the
 * audit layer rejects for shape weeks later, and the defect costs a review
 * cycle to find.
 *
 * Two operations, one engine:
 *
 *   `check`      — the traveled comparator. The consumer's exported unit-doc
 *                  templates against the installed release's own section
 *                  contract. One row per disagreeing surface, `absent` for a
 *                  surface the workspace does not carry.
 *   `authoring`  — the write-time check. A staged unit doc against the same
 *                  contract, through the same selector the audit reads, so the
 *                  class dies at emission rather than at audit.
 *
 * The contract is READ from its owner. `UNIT_DOC_SECTION_SHAPES`,
 * `resolveUnitDocShape` and `selectSpecProduct` live in
 * `@gtrabanco/agentic-workflow-schema`, which publishes them through this
 * crate's dependency; a literal section list here would be the second copy that
 * `vocabulary-residency@1` forbids and the drift class this unit repairs.
 *
 * Read-only, offline, deterministic: the same workspace always prints the same
 * bytes, and no operation writes a template, a unit doc or a config byte.
 *
 * Usage
 *   agentic-workflow scaffold-contract check [--workspace <dir>] [--json]
 *   agentic-workflow scaffold-contract authoring <unit-doc|slug> [--workspace <dir>] [--json]
 *
 * stdout: the fixed `scaffold-contract@1` block.
 * exit: 0 clean · 1 a mismatch or a defect · 2 refusal or usage error.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  UNIT_DOC_SECTION_SHAPES,
  resolveUnitDocShape,
  selectSpecProduct,
} from "@gtrabanco/agentic-workflow-schema";

import { sectionText } from "../unit-doc-phases.mjs";

/** Contract identifier for the printed block. */
export const BLOCK_ID = "scaffold-contract@1";

/** The exported unit-doc templates, relative to a workspace root. */
export const TEMPLATE_SURFACES = Object.freeze([
  "docs/features/_TEMPLATE/SPEC.md",
  "docs/fix/_TEMPLATE/SPEC.md",
]);

/** The unit-doc home directories a slug resolves against. */
const UNIT_HOMES = Object.freeze(["docs/fix", "docs/features"]);

/** The closed surface-state vocabulary. */
export const SURFACE_STATES = Object.freeze(["match", "mismatch", "absent"]);

/** The closed finding-code vocabulary `authoring` reports. */
export const FINDING_CODES = Object.freeze([
  "heading-missing",
  "heading-duplicate",
  "heading-order",
  "heading-level",
  "shape-unknown",
  "acceptance-missing",
  "acceptance-hash",
]);

/** The closed acceptance-state vocabulary. */
export const ACCEPTANCE_STATES = Object.freeze(["match", "absent", "missing", "stale"]);

/** The frontmatter `ac-hash` line — the template's own promise (issue #701 PE-003). */
const AC_HASH_LINE = /^#\s*ac-hash:\s*([0-9a-f]{64}|<[^>]*>)\s*$/u;
const FRONTMATTER_AC_HASH = /^ac-hash:\s*(.+?)\s*$/u;
const ACCEPTANCE_SECTION = "Acceptance criteria";

/**
 * Every heading in a document, fence-aware, with its level and 1-based line.
 * CommonMark's fence rule: a block closes only on a run of the character that
 * opened it, at least as long, with nothing but spaces after it — so a `~~~`
 * line inside a ``` block is content, not a terminator. The selector this
 * module delegates to applies the identical rule, and the two must never
 * disagree about what a heading is.
 */
export function headings(text) {
  const out = [];
  let fence = null;
  const lines = String(text ?? "").split(/\r?\n/u);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const run = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
    if (run !== null) {
      const marker = run[1][0];
      const length = run[1].length;
      if (fence === null) fence = { marker, length };
      else if (marker === fence.marker && length >= fence.length && run[2].trim() === "") fence = null;
      continue;
    }
    if (fence !== null) continue;
    const heading = /^(#{1,6})[ \t]+(.*?)[ \t]*$/u.exec(line);
    if (heading !== null) out.push({ level: heading[1].length, text: heading[2], line: index + 1 });
  }
  return out;
}

/** The level-2 section names a document carries, in document order. */
const level2 = (text) => headings(text).filter((h) => h.level === 2).map((h) => h.text);

/** The section list one template asserts, resolved from its own headings. */
function contractFor(text) {
  const shape = resolveUnitDocShape(level2(text));
  // A document satisfying no accepted shape is judged against the richest one:
  // a fresh author aiming at the re-cut must not be forgiven the legacy list.
  return { shape, sections: UNIT_DOC_SECTION_SHAPES[shape ?? "spec-by-reference"] };
}

/**
 * The parity failures of one template, as finding rows. Empty means the template
 * carries the contract.
 *
 * The selector (`selectSpecProduct`) decides missing, duplicate and order
 * defects; this function adds the one it cannot see — a heading at the wrong
 * level, which a level-2-only reader reports as missing and an author cannot
 * distinguish from an absent section. That distinction is the whole F18/F1 class.
 */
export function shapeFindings(text) {
  const found = headings(text);

  // Level drift first. A required section written at the wrong depth is invisible
  // to every level-2 reader: the selector reports it as `missing`, and an author
  // cannot tell it from an absent section. That ambiguity is the whole F18/F1
  // class, so it is resolved here — a heading that spells a required section at
  // another level is a level defect, and the shape is resolved as though it sat
  // at level 2 so the rest of the document is still judged against the shape it
  // was written for.
  const names = found.filter((h) => h.level === 2).map((h) => h.text);
  const expected = UNIT_DOC_SECTION_SHAPES[resolveUnitDocShape(names) ?? "spec-by-reference"];
  const levelRows = [];
  for (const heading of found) {
    if (heading.level === 2 || !expected.includes(heading.text)) continue;
    levelRows.push({
      code: "heading-level",
      section: heading.text,
      detail: `${"#".repeat(heading.level)} ${heading.text} at line ${heading.line} (the contract reads ## ${heading.text})`,
    });
  }

  // Delegate the rest to the owner, over the document as it reads once the level
  // drift is set aside: a document with one demoted section and no other defect
  // reports exactly that one row.
  const corrected = levelRows.length === 0 ? text : promote(text, levelRows.map((row) => row.section));
  const { shape, sections } = contractFor(corrected);
  const rows = [];

  const selection = selectSpecProduct(corrected);
  if (!selection.ok) {
    for (const error of selection.errors) {
      const code = error.code === "selector-heading-missing" ? "heading-missing"
        : error.code === "selector-heading-duplicate" ? "heading-duplicate"
          : error.code === "selector-heading-order" ? "heading-order"
            : "shape-unknown";
      rows.push({ code, section: error.heading, detail: `## ${error.heading} is required by the ${shape ?? "spec-by-reference"} shape` });
    }
  }

  // The selector reports the first defect of each kind and stops. A document can
  // carry several, and an author fixes them in one pass only if they are told
  // about all of them.
  const scan = headings(corrected);
  for (const section of sections) {
    const at = scan.filter((h) => h.text === section && h.level === 2);
    if (at.length === 0 && !rows.some((r) => r.section === section)) {
      rows.push({ code: "heading-missing", section, detail: `## ${section} is absent` });
    }
    if (at.length > 1 && !rows.some((r) => r.section === section && r.code === "heading-duplicate")) {
      rows.push({ code: "heading-duplicate", section, detail: `## ${section} appears ${at.length} times` });
    }
  }

  return { shape, sections, rows: [...levelRows, ...rows] };
}

/** The document with the named sections re-read as level-2 headings, fences untouched. */
function promote(text, sections) {
  return String(text)
    .split(/\r?\n/u)
    .map((line) => {
      const match = /^#{3,6}[ \t]+(.*?)[ \t]*$/u.exec(line);
      return match !== null && sections.includes(match[1]) ? `## ${match[1]}` : line;
    })
    .join("\n");
}

/**
 * The comparator: one row per exported template, `match`, `mismatch` or `absent`.
 *
 * @param {{ workspace?: string }} [options]
 */
export function check({ workspace = process.cwd() } = {}) {
  const root = path.resolve(workspace);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new Error(`workspace not found: ${root} (a comparator needs a directory to read)`);
  }

  const surfaces = TEMPLATE_SURFACES.map((surface) => {
    const full = path.join(root, surface);
    if (!fs.existsSync(full)) return { surface, state: "absent", rows: [] };
    const { shape, rows } = shapeFindings(fs.readFileSync(full, "utf8"));
    return { surface, state: rows.length === 0 ? "match" : "mismatch", shape: shape ?? "spec-by-reference", rows };
  });

  const mismatched = surfaces.filter((s) => s.state === "mismatch");
  const present = surfaces.filter((s) => s.state !== "absent");
  return {
    ok: mismatched.length === 0 && present.length > 0,
    surfaces,
    rows: mismatched.flatMap((s) => s.rows.map((row) => ({ surface: s.surface, ...row }))),
    verdict: mismatched.length > 0 ? "SCAFFOLD MISMATCH" : present.length === 0 ? "SCAFFOLD ABSENT" : "SCAFFOLD OK",
  };
}

/** Split a leading `---` frontmatter block off a document, with its line offset. */
function frontmatter(text) {
  const lines = String(text ?? "").split(/\r?\n/u);
  if (lines[0]?.trim() !== "---") return { keys: {}, body: text, bodyLine: 1 };
  const close = lines.indexOf("---", 1);
  if (close === -1) return { keys: {}, body: text, bodyLine: 1 };
  const keys = {};
  for (const line of lines.slice(1, close)) {
    const match = FRONTMATTER_AC_HASH.exec(line);
    if (match !== null) keys["ac-hash"] = match[1].replace(/^["']|["']$/gu, "");
  }
  return { keys, body: lines.slice(close + 1).join("\n"), bodyLine: close + 2 };
}

/**
 * The acceptance section's state for a document that declares `ac-hash`.
 *
 * The promise is the template's: its frontmatter comment names
 * `## Acceptance criteria` as the section the design step hashes, while no
 * template ships that section (PE-003). A document that repeats the promise
 * therefore earns the check, and one whose hash no longer re-derives is a defect
 * the review would otherwise raise weeks later.
 */
export function acceptanceState(text) {
  const { keys } = frontmatter(text);
  const declared = keys["ac-hash"];
  if (declared === undefined || declared.startsWith("<")) return { state: "absent", declared: null };
  // The section's bytes are the owner's: `sectionText` is the reader the design
  // step that records the hash uses, the review checklist uses, and `ac-hash` is
  // defined over. A second parser here would re-derive a different digest from
  // the same document and report every correct hash stale.
  const body = sectionText(text, ACCEPTANCE_SECTION);
  if (body === null) return { state: "missing", declared };
  const digest = createHash("sha256").update(body).digest("hex");
  return { state: digest === declared ? "match" : "stale", declared, computed: digest };
}

/** Resolve a unit-doc token against the workspace's two unit homes. */
function resolveUnitDoc(root, token) {
  const clean = token
    .replace(/^docs\/(?:features|fix)\//u, "")
    .replace(/\/SPEC\.md$/u, "")
    .replace(/\/+$/u, "");
  const candidates = [];
  for (const home of UNIT_HOMES) {
    const direct = path.join(root, home, clean, "SPEC.md");
    if (fs.existsSync(direct)) candidates.push(direct);
  }
  if (candidates.length === 0) {
    for (const home of UNIT_HOMES) {
      const dir = path.join(root, home);
      if (!fs.existsSync(dir)) continue;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
        const full = path.join(dir, entry.name, "SPEC.md");
        if (entry.name.endsWith(clean) && fs.existsSync(full)) candidates.push(full);
      }
    }
  }
  if (candidates.length === 0) throw new Error(`unit doc not found: ${clean} (no docs/fix or docs/features folder carries a SPEC.md)`);
  if (candidates.length > 1) throw new Error(`ambiguous unit doc: ${clean} matches ${candidates.map((c) => path.relative(root, c)).join(", ")}`);
  return candidates[0];
}

/**
 * The write-time check: a staged unit doc against the contract the audit reads.
 *
 * @param {{ workspace?: string, unitDoc: string }} options
 */
export function authoring({ workspace = process.cwd(), unitDoc } = {}) {
  const root = path.resolve(workspace);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new Error(`workspace not found: ${root} (a check needs a directory to read)`);
  }
  if (!unitDoc) throw new Error("authoring requires a unit doc: <unit-doc|slug>");
  const full = path.isAbsolute(unitDoc) && fs.existsSync(unitDoc) ? unitDoc : resolveUnitDoc(root, unitDoc);
  const text = fs.readFileSync(full, "utf8");

  const { shape, rows } = shapeFindings(text);
  const acceptance = acceptanceState(text);
  if (acceptance.state === "missing") {
    rows.push({ code: "acceptance-missing", section: ACCEPTANCE_SECTION, detail: "the frontmatter declares ac-hash but the document carries no ## Acceptance criteria" });
  } else if (acceptance.state === "stale") {
    rows.push({ code: "acceptance-hash", section: ACCEPTANCE_SECTION, detail: `recorded ${acceptance.declared.slice(0, 12)}… re-derives ${acceptance.computed.slice(0, 12)}…` });
  }

  return {
    ok: rows.length === 0,
    unitDoc: path.relative(root, full).split(path.sep).join("/"),
    shape: shape ?? "spec-by-reference",
    acceptance,
    rows,
    verdict: rows.length === 0 ? "SCAFFOLD OK" : "SCAFFOLD DEFECT",
  };
}

/** The fixed block, one shape for both operations. */
export function render(result, operation) {
  const lines = [`${BLOCK_ID} ${operation}`];
  if (operation === "check") {
    for (const surface of result.surfaces) lines.push(`SURFACE ${surface.surface} — ${surface.state.toUpperCase()}`);
    for (const row of result.rows) lines.push(`MISMATCH ${row.surface} — ${row.code}: ${row.detail}`);
  } else {
    lines.push(`UNIT ${result.unitDoc} — shape ${result.shape}`);
    lines.push(`ACCEPTANCE ${result.acceptance.state.toUpperCase()}`);
    for (const row of result.rows) lines.push(`DEFECT ${row.code} — ${row.detail}`);
  }
  lines.push(`verdict ${result.verdict}`);
  return `${lines.join("\n")}\n`;
}

const USAGE = "usage: scaffold-contract <check|authoring> [<unit-doc>] [--workspace <dir>] [--json]";

/**
 * The CLI entry the runner's closed table dispatches.
 *
 * @param {string[]} args
 * @returns {number}
 */
export function run(args = []) {
  const operation = args[0];
  const json = args.includes("--json");
  const at = args.indexOf("--workspace");
  const workspace = at === -1 ? process.cwd() : args[at + 1];
  const positional = args.slice(1).filter((arg, index, all) => !arg.startsWith("--") && all[index - 1] !== "--workspace");

  if (operation !== "check" && operation !== "authoring") {
    process.stderr.write(`SCAFFOLD REFUSAL — ${USAGE}\n`);
    return 2;
  }
  if (at !== -1 && workspace === undefined) {
    process.stderr.write("SCAFFOLD REFUSAL — --workspace requires a directory\n");
    return 2;
  }

  try {
    const result = operation === "check"
      ? check({ workspace })
      : authoring({ workspace, unitDoc: positional[0] });
    process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : render(result, operation));
    return result.ok ? 0 : 1;
  } catch (e) {
    process.stderr.write(`SCAFFOLD REFUSAL — ${e.message}\n`);
    return 2;
  }
}

export default run;
