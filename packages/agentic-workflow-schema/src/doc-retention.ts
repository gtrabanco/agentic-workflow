/**
 * The document-retention contract (issue #651).
 *
 * A unit folder accumulates process artifacts nobody re-reads once the unit
 * ships. This module publishes the **deterministic half** of the collapse: which
 * files are trimmable, which are the permanent record, when a unit is a
 * candidate at all, and what an archive copy must carry to be restorable.
 *
 * One owner, one copy (`vocabulary-residency@1`): the crate's write path, the
 * sensor's projection, the audit producer and the template declaration gate all
 * import these consts. A second copy of the matrix is the defect this module
 * exists to prevent.
 *
 * Three rules carry the design:
 *
 *  - **The matrix is closed.** A file in neither set is not "probably
 *    trimmable": it refuses the write path, so a unit folder's new artifact
 *    enters by a matrix edit, never by a guess.
 *  - **Eligibility is one predicate** (`classifyUnitRetention`). The CLI refuses
 *    on it, the sensor projects it, the audit reports it — they cannot disagree
 *    about which unit is a candidate, only about how strong the merge proof is
 *    (the sensor can reach the forge; the CLI cannot).
 *  - **The archive binds bytes.** `doc-retention-archive@1` carries one
 *    `sha256:<64 hex>` per archived file, so a restore re-hashes before it
 *    writes and a tampered archive can never overwrite a settled document.
 */

/** Files a settle moves into the gitignored archive before anything is deleted. */
export const UNIT_DOC_TRIM_FILES = Object.freeze([
  "TASKS.md",
  "PLAN.md",
  "progress.md",
  "ACCEPTANCE.md",
  "testing.md",
  "CHECKLIST.md",
  "BRIEF.md",
  "pr-body.md",
  "external-verify.md",
  "review-findings.md",
  "planning-findings.md",
] as const);

/** Files a settle keeps in place: the permanent, decision-grade record. */
export const UNIT_DOC_KEEP_FILES = Object.freeze([
  "SPEC.md",
  "decisions.md",
  "known-issues.md",
  "planning-obligations.md",
  "planning-evidence.md",
  "architecture-notes.md",
  "sources.md",
  "research.md",
] as const);

export type UnitDocTrimFile = (typeof UNIT_DOC_TRIM_FILES)[number];
export type UnitDocKeepFile = (typeof UNIT_DOC_KEEP_FILES)[number];

/**
 * What `docRetention.mode` may say. `keep-all` is the shipped posture: detection
 * reports, the trim step never runs. The mode gates **only** the trim step —
 * validation never reads it (S6: config never makes a document invalid).
 */
export const DOC_RETENTION_MODES = Object.freeze(["keep-all", "archive"] as const);
export type DocRetentionMode = (typeof DOC_RETENTION_MODES)[number];

/**
 * The closed eligibility states. `eligible` is the only one the write path acts
 * on; every other value is the refusal reason it reports (S5: "out-of-scope items
 * reported visibly in the dry-run report, never silently skipped").
 */
export const RETENTION_STATES = Object.freeze([
  "eligible",
  "not-done",
  "already-settled",
  "unstamped",
  "older-format",
  "unknown-carrier",
  "open-findings",
  "dirty-unit-dir",
] as const);
export type RetentionState = (typeof RETENTION_STATES)[number];

/** The predicate input: the three facts the offline readers can prove. */
export interface RetentionCandidate {
  /** The unit's roadmap/fix-index row status (`done` is the shipped lifecycle mark). */
  readonly status: string | null;
  /** The carrier the document's own headings resolve, or null when none resolves. */
  readonly shape: string | null;
  /** The provenance format the document carries, or null when it carries no stamp. */
  readonly format: string | null;
  /** True when the unit folder carries uncommitted bytes. */
  readonly dirty?: boolean;
  /** True when a legacy `review-findings.md` still carries an unfoleded row. */
  readonly openFindings?: boolean;
}

export interface RetentionVerdict {
  readonly state: RetentionState;
  readonly eligible: boolean;
  readonly reason: string;
}

/**
 * The one eligibility predicate (S5/S8). Order matters and is published by the
 * tests: the lifecycle gate first (a `done` row is the merge proof the CLI can
 * read), then the carrier gate (an already-settled or unknown carrier is not a
 * candidate), then the stamp gate (unversioned docs are out of scope forever),
 * then the working-tree gate.
 */
export function classifyUnitRetention(candidate: RetentionCandidate): RetentionVerdict {
  const state = (value: RetentionState): RetentionVerdict => ({
    state: value,
    eligible: value === "eligible",
    reason: value === "eligible" ? "proved-merged-full-carrier" : value,
  });
  if (candidate.status !== "done") return state("not-done");
  if (candidate.shape === "settled") return state("already-settled");
  if (candidate.format === null || candidate.format === undefined) return state("unstamped");
  if (candidate.format === "unit-doc@1") return state("older-format");
  if (candidate.shape === null) return state("unknown-carrier");
  if (candidate.openFindings === true) return state("open-findings");
  if (candidate.dirty === true) return state("dirty-unit-dir");
  return state("eligible");
}

/** The archive manifest's contract id. */
export const DOC_RETENTION_ARCHIVE_CONTRACT = "doc-retention-archive@1" as const;

/** The manifest's closed top-level field set, in serialization order. */
export const DOC_RETENTION_ARCHIVE_FIELDS = [
  "contract",
  "unit",
  "settled_at",
  "source_revision",
  "spec_digest",
  "files",
] as const;

/** The per-file row's closed field set. */
export const DOC_RETENTION_ARCHIVE_ROW_FIELDS = ["path", "contentHash"] as const;

/** `sha256:<64 lowercase hex>` — the published digest spelling (projection-manifest@1). */
export const RETENTION_DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u;

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/u;
const REVISION = /^[0-9a-f]{7,40}$/u;

export interface RetentionArchiveRow {
  readonly path: string;
  readonly contentHash: string;
}

export interface RetentionArchive {
  readonly contract: typeof DOC_RETENTION_ARCHIVE_CONTRACT;
  readonly unit: string;
  readonly settled_at: string;
  readonly source_revision: string;
  readonly spec_digest: string;
  readonly files: readonly RetentionArchiveRow[];
}

export interface RetentionArchiveValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/** Refuse a manifest that cannot restore what it claims (S5). */
export function validateRetentionArchive(value: unknown): RetentionArchiveValidation {
  const errors: string[] = [];
  if (!isRecord(value)) return { valid: false, errors: ["the manifest is not an object"] };
  for (const key of Object.keys(value)) {
    if (!(DOC_RETENTION_ARCHIVE_FIELDS as readonly string[]).includes(key)) {
      errors.push(`unknown field: ${key}`);
    }
  }
  for (const field of DOC_RETENTION_ARCHIVE_FIELDS) {
    if (value[field] === undefined || value[field] === null) errors.push(`missing field: ${field}`);
  }
  if (value.contract !== DOC_RETENTION_ARCHIVE_CONTRACT) {
    errors.push(`contract must be ${DOC_RETENTION_ARCHIVE_CONTRACT}`);
  }
  if (value.unit !== undefined && value.unit !== null && !isNonEmptyString(value.unit)) {
    errors.push("unit must be a non-empty repo-relative path");
  }
  if (value.settled_at !== undefined && value.settled_at !== null && !ISO_UTC.test(String(value.settled_at))) {
    errors.push("settled_at must be an ISO-8601 UTC instant");
  }
  if (value.source_revision !== undefined && value.source_revision !== null && !REVISION.test(String(value.source_revision))) {
    errors.push("source_revision must be a git revision");
  }
  if (value.spec_digest !== undefined && value.spec_digest !== null && !RETENTION_DIGEST_PATTERN.test(String(value.spec_digest))) {
    errors.push("spec_digest must be sha256:<64 lowercase hex>");
  }
  if (value.files !== undefined && value.files !== null) {
    if (!Array.isArray(value.files) || value.files.length === 0) {
      errors.push("files must be a non-empty array (an archive with nothing in it is not a settle)");
    } else {
      value.files.forEach((row, index) => {
        if (!isRecord(row)) {
          errors.push(`files[${index}] is not an object`);
          return;
        }
        for (const key of Object.keys(row)) {
          if (!(DOC_RETENTION_ARCHIVE_ROW_FIELDS as readonly string[]).includes(key)) {
            errors.push(`files[${index}] unknown field: ${key}`);
          }
        }
        if (!isNonEmptyString(row.path)) errors.push(`files[${index}].path must be a file name`);
        else if (row.path.includes("/") || row.path.includes("\\")) {
          errors.push(`files[${index}].path must be a bare unit-folder file name`);
        }
        if (!RETENTION_DIGEST_PATTERN.test(String(row.contentHash))) {
          errors.push(`files[${index}].contentHash must be sha256:<64 lowercase hex>`);
        }
      });
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * The trim declaration a template carries (`retention-declaration@1`, decision
 * D8). One row per candidate path; the disposition is a closed set, and the
 * declaration gate compares the rows against the published matrix.
 */
export const RETENTION_DECLARATION_CONTRACT = "retention-declaration@1" as const;

export const RETENTION_DECLARATION_DISPOSITIONS = Object.freeze([
  "trimmable",
  "kept",
  "out-of-scope",
] as const);
export type RetentionDeclarationDisposition = (typeof RETENTION_DECLARATION_DISPOSITIONS)[number];

/** The disposition the published matrix assigns a path, or null when it assigns none. */
export function publishedDisposition(path: string): "trimmable" | "kept" | null {
  if ((UNIT_DOC_TRIM_FILES as readonly string[]).includes(path)) return "trimmable";
  if ((UNIT_DOC_KEEP_FILES as readonly string[]).includes(path)) return "kept";
  return null;
}

/** The `docRetention` section's shipped defaults (decision D6). */
export const DOC_RETENTION_DEFAULTS: Readonly<Record<string, unknown>> = Object.freeze({
  mode: "keep-all",
  pendingTrimAfterDays: 0,
  archiveDir: ".agentic-workflow/archive",
  archiveRetentionDays: null,
  seamHook: null,
});

/**
 * The `docRetention` section schema, published here beside the vocabulary it
 * constrains (decision D6). Deliberately no `enabled` switch and no second mode
 * spelling: `keep-all` is the posture, `archive` is the only other answer, and
 * the window fields are nullable integers because "never" is a real setting.
 */
export const DOC_RETENTION_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  properties: {
    mode: { type: "string", enum: DOC_RETENTION_MODES, default: "keep-all" },
    pendingTrimAfterDays: { type: "integer", minimum: 0, default: 0 },
    archiveDir: { type: "string", minLength: 1, pattern: "^(?!/)(?!.*\\.\\.).+$", default: ".agentic-workflow/archive" },
    archiveRetentionDays: { type: ["integer", "null"], minimum: 1, default: null },
    seamHook: { type: ["string", "null"], minLength: 1, default: null },
  },
});
