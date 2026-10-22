/**
 * UnitDoc — create and edit single-unit SPEC documents.
 *
 * The unit doc is a single Markdown file (docs/features/<NN>-<slug>/SPEC.md)
 * containing one of two accepted closed section sets in a fixed order (#305
 * added `## Impact`; #308 added the `spec-by-reference` shape).  All edits go
 * through typed operations that validate post-state against the file schema
 * before writing, and validation resolves the shape from the headings the
 * document carries — a legacy doc and a migrated one are both valid, never one
 * of them silently upgraded.
 */

import { readFileSync, writeFileSync, renameSync, existsSync, mkdtempSync, rename } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import {
  UNIT_DOC_SECTIONS,
  UNIT_DOC_SPEC_REF_SECTIONS,
  UNIT_DOC_SECTION_SHAPES,
  EVIDENCE_COLUMNS,
  PROGRESS_ENTRY_REGEX,
  resolveUnitDocShape,
  unitDocSectionsFor,
} from "./schema.mjs";

// ── Canonical skeletons matching docs/{features,fix}/_TEMPLATE/SPEC.md ────
// The legacy shape is emitted by `create`; the re-cut shape by
// `createSpecByReference`. Neither is derived from the other: a skeleton is a
// published template, and generating it from the other shape would make the two
// drift silently (the #305 defect class).
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

## Impact

What the change touches beyond its own files: what consumes this unit's
deliverables, what this unit consumes from others, what stops being true when
the change lands (comments, docs, declared validators, narrations naming the
old shape), and what must be asked before touching something live on the other
side. Cut at plan time — the executor sweeps this surface, it is not
rediscovered at review.

## Non-goals

What this unit is NOT. Findings discovered during implementation never expand scope.

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a
date and a status: \`open\`, \`planned\`, or \`discarded <YYYY-MM-DD>\`. This unit
never implements, specs, or tasks a row here. Write \`none\` when nothing was
deferred. Reviewed at unit close, on session resume, and whenever later work
returns to the same area — each open row is then offered as
plan-now / keep-deferred / discard.

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

// The re-cut skeleton (issue #308). Section bodies state what to write, in
// positive terms: each `S#` quotes the request verbatim, each task links the
// requirement it implements, and the log is appended to, never rewritten.
const CANONICAL_SPEC_REF_SKELETON = `# NN — <unit-slug>

> One-line: what this unit doc is. Copy to docs/features/NN-<slug>/.

## Specs

Requirements, each numbered \`S#\` and quoting the requester's own words
verbatim between the quote markers. Cut one requirement per distinct ask, in the
order the request states them; a later correction is appended under its own id
(\`S1a\`, \`S2a\`, …) and never rewrites the id it corrects.

**S1 — <short title in your own words>.**
> <the request's words, verbatim and unedited>

## Impact

What the change touches beyond its own files: what consumes this unit's
deliverables, what this unit consumes from others, what stops being true when
the change lands (comments, docs, declared validators, narrations naming the
old shape), and what must be asked before touching something live on the other
side. Cut at plan time — the executor sweeps this surface, it is not
rediscovered at review.

## Non-goals

What this unit is NOT. Findings discovered during implementation never expand scope.

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a
date and a status: \`open\`, \`planned\`, or \`discarded <YYYY-MM-DD>\`. This unit
never implements, specs, or tasks a row here. Write \`none\` when nothing was
deferred. Reviewed at unit close, on session resume, and whenever later work
returns to the same area — each open row is then offered as
plan-now / keep-deferred / discard.

## Future cost

Standing obligations this unit imposes on future work. Each row: the rule + who it binds.

## Applicable tests

The tests this unit will run (triage-decided). Write exactly \`n/a — no tests step for this unit\`
when there is none.

## Known pre-existing issues

Each: <issue/observation> + explicit \`affects\` or \`does-not-affect\` this unit.
A red gate is never excused by an unrecorded issue.

## Tasks

P1…Pn with stable IDs, one line each, smallest first. Final task is verification when the unit has behavior. Each task carries its validator — a backticked command plus its expected outcome — and an \`(Implements: S1, S2)\` line naming the requirements it delivers, plus an optional nested \`Relevant files: <path, path…>\` line naming that task's read set (metadata, never a task).

- P1 — <task> (validator: \`node --test scripts/x.test.mjs\` exits 0)
  (Implements: S1)
  Relevant files: <path>

### Planning evidence

One row per Engineering claim (the closed column order and vocabularies are owned
by \`skills/pre-execution-review/references/LEDGERS.md\`). Embedded here for XS/S
units; for M/L the ledger lives in the unit folder's \`planning-evidence.md\` and
this section names it instead — never both.

### Obligations

One row per normative behaviour, compatibility invariant, affected use case, and
required failure state (shape owned by
\`skills/pre-execution-review/references/LEDGERS.md\`). Embedded here for XS/S
units; for M/L the ledger lives in the unit folder's \`planning-obligations.md\`
and this section names it — never both. Before the unit ships, every row is
\`verified\` (or an evidenced \`n/a\`).

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed.
A folded row leaves this table and becomes a \`## Log\` line. Rows are appended by
\`review-change\` and \`triage-issue\`.

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

Append-only. \`L1\` is the request verbatim; every later line carries one kind
token — \`L<n>\` request or correction (a verbatim quote), \`E<n>\` evidence run,
\`G<n>\` gate run, \`F<n>\` folded finding, \`D<n>\` owner decision, \`P<n>\` phase
progress. A correction never edits an earlier line: it appends.

- **L1** — <YYYY-MM-DD>, the request, verbatim:
  \`\`\`
  <the request as it was made>
  \`\`\`

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
 * create(dir, slug) — write the unit doc with all 14 sections from the
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
  // Both accepted shapes are addressable: a migrated document sets its own
  // sections and a legacy one keeps its own (#308).
  const addressable = [...new Set([...UNIT_DOC_SECTIONS, ...UNIT_DOC_SPEC_REF_SECTIONS])];
  if (!addressable.includes(name)) {
    throw new Error(`Unknown section "${name}"; allowed: ${addressable.join(", ")}`);
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
 * createSpecByReference(dir, slug) — write the unit doc in the re-cut
 * (`spec-by-reference`) shape from its own canonical skeleton (#308). Same
 * contract as `create`: dir is the unit directory, the file lands at
 * dir/SPEC.md, and the receipt reports whether the written content validates.
 *
 * Returns { ok: true, receipt } on success.
 */
export function createSpecByReference(dir, slug) {
  if (!existsSync(dir)) {
    throw new Error(`Directory does not exist: ${dir}`);
  }
  const target = join(dir, "SPEC.md");
  const content = CANONICAL_SPEC_REF_SKELETON;
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

  // Which accepted shape the document asserts (#308). A document satisfying
  // neither is reported against the legacy list, which is the shape every unit
  // predating the re-cut carries.
  const shape = resolveUnitDocShape(foundHeadings);
  const required = unitDocSectionsFor(shape);

  // Check for missing sections
  for (const section of required) {
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
  let expectedIdx = 0;
  for (const found of foundHeadings) {
    if (found === required[expectedIdx]) {
      expectedIdx++;
    } else if (required.includes(found)) {
      violations.push(`Misordered section: ${found} (expected after ${required[expectedIdx - 1]} or before ${required[expectedIdx]})`);
    }
  }

  // A half-migrated document carries a section from the other shape: its
  // Evidence rows and its Log would both claim to be the receipt, so it is
  // refused rather than read two ways (the #308 §Scope 4 migration rule).
  if (shape !== null) {
    const foreign = Object.entries(UNIT_DOC_SECTION_SHAPES)
      .filter(([name]) => name !== shape)
      .flatMap(([, sections]) => sections)
      .filter((section) => !required.includes(section) && foundHeadings.includes(section));
    for (const section of new Set(foreign)) {
      violations.push(`Half-migrated section: ${section} belongs to the other accepted shape`);
    }
  }

  const ok = violations.length === 0;
  return { ok, violations };
}