/**
 * UnitDoc — create and edit single-unit SPEC documents.
 *
 * The unit doc is a single Markdown file (docs/features/<NN>-<slug>/SPEC.md)
 * containing exactly 13 closed sections in a fixed order.  All edits go
 * through typed operations that validate post-state against the file schema
 * before writing.
 */

import { readFileSync, writeFileSync, renameSync, existsSync, mkdtempSync, rename } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import {
  UNIT_DOC_SECTIONS,
  EVIDENCE_COLUMNS,
  PROGRESS_ENTRY_REGEX,
} from "./schema.mjs";

// ── Canonical skeleton matching docs/features/_TEMPLATE/SPEC.md ──────────
const CANONICAL_SKELETON = `# NN — <unit-slug>

> One-line: what this unit doc is. Copy to docs/features/NN-<slug>/.

## Objective

What this unit delivers and why it exists now (2-4 lines).

## Why

The problem or gap this unit addresses; what already exists, what is missing.

## User outcome

From the user's perspective: what they can do or observe after this unit ships.

## Acceptance criteria

Numbered list. Each AC is induced from a concrete user scenario ("I do X and observe Y").
Make each AC command-verified where possible. If the request is too vague to state an AC,
STOP and ask the user with concrete options — never invent one.

## Non-goals

What this unit is NOT. Findings discovered during implementation never expand scope.

## Future cost

Standing obligations this unit imposes on future work. Each row: the rule + who it binds.

## Applicable tests

The tests this unit will run (triage-decided). Write exactly \`n/a — no tests step for this unit\`
when there is none.

## Known pre-existing issues

Each: <issue/observation> + explicit \`affects\` or \`does-not-affect\` this unit.
A red gate is never excused by an unrecorded issue.

## Tasks

P1…Pn with stable IDs, one line each, smallest first. Final task is verification when the unit has behavior.

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

## Progress log

One entry per step taken. Format exactly:
\`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>\`

## Next

The single next action.

## References

Issues, roadmap rows, related material. The PR closes absorbed issues via \`Closes #N\`. \`none\` if empty.
`;

// ── Helpers ──────────────────────────────────────────────────────────────

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function shaPrefix(hex) {
  return hex.slice(0, 8);
}

/**
 * Write content to a temporary file, then atomically rename to the target.
 * Returns the full write path on success.
 */
function atomicWrite(targetPath, content) {
  const dir = dirname(targetPath);
  const tmp = join(dir, `.${Math.random().toString(36).slice(2)}.tmp`);
  writeFileSync(tmp, content, "utf8");
  renameSync(tmp, targetPath);
  return targetPath;
}

/**
 * Build a receipt object from operation parameters.
 */
function makeReceipt(service, op, path, schema, before, after, ok) {
  return { service, op, path, schema, before, after, ok };
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * create(dir, slug) — write the unit doc with all 13 sections from the
 * canonical skeleton.  dir is the parent directory (e.g. docs/features);
 * slug is the kebab-case name.  The file lands at docs/features/<slug>/SPEC.md.
 *
 * Returns { ok: true, receipt } on success.
 */
export function create(dir, slug) {
  // dir is the feature directory (e.g. docs/features/61-test-slug)
  // slug is the kebab-case name (e.g. 61-test-slug) — unit doc writes to dir/SPEC.md
  if (!existsSync(dir)) {
    throw new Error(`Directory does not exist: ${dir}`);
  }
  const target = join(dir, "SPEC.md");
  const content = CANONICAL_SKELETON;
  const beforeHash = existsSync(target) ? sha256(readFileSync(target, "utf8")) : "empty";
  atomicWrite(target, content);
  const afterHash = sha256(readFileSync(target, "utf8"));

  const validation = validate(readFileSync(target, "utf8"));
  const ok = validation.ok && validation.violations.length === 0;
  return makeReceipt(
    "unitDoc",
    "create",
    target,
    "unit-doc-template@1",
    shaPrefix(beforeHash),
    shaPrefix(afterHash),
    ok,
  );
}

/**
 * setSection(doc, name, body) — replace the body of an existing section.
 * Refuses unknown section names (closed 13).
 *
 * doc is the absolute path to the SPEC.md.
 * name is one of the 13 section headings (without the "# " prefix).
 * body is the new section content (text between the heading and the next heading).
 *
 * Returns a receipt.  Throws on unknown section.
 */
export function setSection(doc, name, body) {
  if (!UNIT_DOC_SECTIONS.includes(name)) {
    throw new Error(`Unknown section "${name}"; allowed: ${UNIT_DOC_SECTIONS.join(", ")}`);
  }
  const content = readFileSync(doc, "utf8");
  const beforeHash = sha256(content);
  const heading = `## ${name}`;
  const nextHeadingIdx = content.indexOf("\n## ", content.indexOf(heading) + 1);
  const endIndex = nextHeadingIdx === -1 ? content.length : nextHeadingIdx;
  const beforeContent = content.slice(content.indexOf(heading), endIndex);
  const newContent = content.slice(0, content.indexOf(heading)) + heading + "\n\n" + body.trimEnd() + content.slice(endIndex);
  atomicWrite(doc, newContent);
  const afterHash = sha256(readFileSync(doc, "utf8"));

  const validation = validate(newContent);
  const ok = validation.ok && validation.violations.length === 0;
  return makeReceipt(
    "unitDoc",
    "setSection",
    doc,
    "unit-doc-section@1",
    shaPrefix(beforeHash),
    shaPrefix(afterHash),
    ok,
  );
}

/**
 * evidence.addRow(doc, { ac, command, exitDigest, output, verifiedBy })
 * Appends a row to the evidence table in the unit doc.
 *
 * doc is the absolute path to the SPEC.md.
 * ac, command, exitDigest, output, verifiedBy are the column values.
 *
 * Returns a receipt.  The row is appended before the Evidence closing fence.
 */
export function evidence_addRow(doc, { ac, command, exitDigest, output, verifiedBy }) {
  const content = readFileSync(doc, "utf8");
  const beforeHash = sha256(content);

  // Append a row after the header line and before the Progress log heading.
  const evidenceSectionIdx = content.indexOf("## Evidence");
  const progressLogIdx = content.indexOf("## Progress log");
  if (evidenceSectionIdx === -1 || progressLogIdx === -1 || progressLogIdx <= evidenceSectionIdx) {
    throw new Error("Evidence section not found or malformed");
  }

  // Find the header row (the line with |---|)
  const evidenceStart = content.indexOf("| AC |", evidenceSectionIdx);
  const headerRowEnd = content.indexOf("\n", evidenceStart);
  const headerRow = content.slice(evidenceStart, headerRowEnd);

  // Build the new data row
  const newRow = [
    `| ${ac || ""} `,
    `| ${command || ""} `,
    `| ${exitDigest || ""} `,
    `| ${output || ""} `,
    `| ${verifiedBy || ""} |`,
  ].join("");

  const newContent = content.slice(0, headerRowEnd + 1) + newRow + "\n" + content.slice(headerRowEnd + 1);
  atomicWrite(doc, newContent);
  const afterHash = sha256(readFileSync(doc, "utf8"));

  const validation = validate(newContent);
  const ok = validation.ok && validation.violations.length === 0;
  return makeReceipt(
    "unitDoc",
    "evidence_addRow",
    doc,
    "evidence-table@1",
    shaPrefix(beforeHash),
    shaPrefix(afterHash),
    ok,
  );
}

/**
 * progress.logEntry(doc, { ts, what, ref, next })
 * Appends a progress entry.  Validates the exact format:
 *   YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>
 *
 * doc is the absolute path to the SPEC.md.
 * ts is "YYYY-MM-DD HH:MM".
 * what is a description.
 * ref is a commit sha or evidence reference.
 * next is the next action.
 *
 * Returns a receipt.  Throws if the format doesn't match.
 */
export function progress_logEntry(doc, { ts, what, ref, next }) {
  const content = readFileSync(doc, "utf8");
  const beforeHash = sha256(content);

  const entry = `${ts} — ${what} → ${ref} — next: ${next}`;
  if (!PROGRESS_ENTRY_REGEX.test(entry)) {
    throw new Error(`Progress entry does not match required format: ${entry}`);
  }

  const progressLogIdx = content.indexOf("## Progress log");
  if (progressLogIdx === -1) {
    throw new Error("Progress log section not found");
  }

  const insertPoint = content.indexOf("\n## Next", progressLogIdx);
  const newContent = content.slice(0, insertPoint) + "\n" + entry + content.slice(insertPoint);

  atomicWrite(doc, newContent);
  const afterHash = sha256(readFileSync(doc, "utf8"));

  const validation = validate(newContent);
  const ok = validation.ok && validation.violations.length === 0;
  return makeReceipt(
    "unitDoc",
    "progress_logEntry",
    doc,
    "progress-log@1",
    shaPrefix(beforeHash),
    shaPrefix(afterHash),
    ok,
  );
}

/**
 * validate(text) — check the unit doc content for schema compliance.
 *
 * Returns { ok, violations[] } where violations are strings describing
 * missing/duplicated/misordered sections.
 */
export function validate(text) {
  const violations = [];

  // Extract all ## headings in order
  const foundHeadings = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const m = line.match(/^## (.+)$/);
    if (m) foundHeadings.push(m[1]);
  }

  // Check for missing sections
  for (const section of UNIT_DOC_SECTIONS) {
    if (!foundHeadings.includes(section)) {
      violations.push(`Missing section: ${section}`);
    }
  }

  // Check for duplicated sections
  const seen = new Set();
  for (const h of foundHeadings) {
    if (seen.has(h)) {
      violations.push(`Duplicate section: ${h}`);
    }
    seen.add(h);
  }

  // Check for misordered sections (only the ones that exist)
  const filtered = UNIT_DOC_SECTIONS.filter((s) => foundHeadings.includes(s));
  let expectedIdx = 0;
  for (const found of foundHeadings) {
    if (found === UNIT_DOC_SECTIONS[expectedIdx]) {
      expectedIdx++;
    } else if (UNIT_DOC_SECTIONS.includes(found)) {
      violations.push(`Misordered section: ${found} (expected after ${UNIT_DOC_SECTIONS[expectedIdx - 1]} or before ${UNIT_DOC_SECTIONS[expectedIdx]})`);
    }
  }

  const ok = violations.length === 0;
  return { ok, violations };
}