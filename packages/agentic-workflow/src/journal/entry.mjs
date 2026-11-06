/**
 * entry.mjs — the crate-side codec for the canonical journal entry
 * `journal-entry@1` (issue #374).
 *
 * The type's ONE machine owner is `@gtrabanco/agentic-workflow-schema`
 * (`src/journal.ts` + `journal-entry.schema.json`, published as
 * `journal-entry.schema.json` on the package). This module is the crate's
 * dependency-free runtime mirror — the `src/edit/schema.mjs` precedent: same
 * rules, hand-rolled, and the owner named here so a reader never mistakes the
 * mirror for a second grammar. A sample the schema validator accepts, this
 * accepts; one it refuses, this refuses (the driver suite pins the agreement).
 *
 * Two conversions live here because they are the bridge between the frozen
 * `log-facts@1` payload and the canonical entry:
 *
 *  - `factsToEntry(facts)` — the mechanical writer's payload becomes an entry
 *    (`kind: "mechanical"`, no summary, no metadata). Rendering it back through
 *    `renderEntry` is byte-identical to rendering the payload, which is what
 *    the golden test pins (AC4).
 *  - `entryToFacts(entry)` — the mechanical entry back out, for the fragment
 *    carrier's `writeFragment`, which stays the byte owner of a mechanical
 *    fragment (fix/405 AC6).
 *
 * `normalizeEntry` never repairs, coerces or trims — the same refusal
 * discipline as `normalizeFacts` next door.
 */

import { normalizeFacts, renderEntry } from "../log/render.mjs";

/** The contract id — kept in sync with the schema package's `JOURNAL_ENTRY_CONTRACT_ID`. */
export const JOURNAL_ENTRY_CONTRACT_ID = "agentic-workflow/journal-entry";

/** The version constant — kept in sync with the schema package's `JOURNAL_ENTRY_VERSION`. */
export const JOURNAL_ENTRY_VERSION = 1;

/** The closed kind set — the fragment carrier's writer classes (fix/405). */
export const JOURNAL_ENTRY_KINDS = Object.freeze(["mechanical", "narrative"]);

/** A refused entry. Named so a caller can tell a refusal from a bug. */
export class JournalEntryError extends Error {
  constructor(reasons) {
    super(Array.isArray(reasons) ? reasons.join("; ") : String(reasons));
    this.name = "JournalEntryError";
  }
}

/** UTC minute (`YYYY-MM-DDTHH:MMZ`, the mechanical form) or second (`…:SSZ`, the narrative form). */
const TIMESTAMP = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?Z$/u;

/** A lowercase token: the shutdown reasons `log-facts@1` froze. */
const REASON = /^[a-z][a-z0-9-]*$/u;

/** `<sha>…<sha>` — both sides abbreviated by git, so length varies. */
const RANGE = /^[0-9a-f]{4,40}…[0-9a-f]{4,40}$/u;

const MAX_BRANCH_LENGTH = 255;
const MAX_PATH_LENGTH = 1024;
const MAX_FILES = 10000;

const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

/** `typeof` with the two shapes a caller confuses with objects spelled out. */
function describe(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  return typeof value === "string" ? JSON.stringify(value) : typeof value;
}

const isSingleLine = (value, max) =>
  typeof value === "string" && value.trim() !== "" && !/[\r\n]/u.test(value) && value.length <= max;

/**
 * Validate a canonical journal entry. Returns `{ ok: true, entry }` or
 * `{ ok: false, errors }` — the schema package's `validateJournalEntry`
 * semantics, dependency-free. Unknown top-level keys are refused: a consumer
 * field belongs in the open `metadata` map.
 */
export function normalizeEntry(input) {
  if (!isRecord(input)) {
    return { ok: false, errors: [`the journal entry must be a JSON object, got ${describe(input)}`] };
  }
  const errors = [];
  const { contract, version, timestamp, branch, kind, summary, reason, commits, files, metadata, ...unknown } = input;

  if (contract !== JOURNAL_ENTRY_CONTRACT_ID) errors.push(`contract must be "${JOURNAL_ENTRY_CONTRACT_ID}", got ${JSON.stringify(contract)}`);
  if (version !== JOURNAL_ENTRY_VERSION) errors.push(`version must be ${JOURNAL_ENTRY_VERSION}, got ${JSON.stringify(version)}`);
  for (const key of Object.keys(unknown)) {
    errors.push(`unknown top-level key "${key}" — a consumer field belongs in the metadata map`);
  }
  if (typeof timestamp !== "string" || !TIMESTAMP.test(timestamp)) {
    errors.push(`timestamp must be a UTC minute or second stamp (YYYY-MM-DDTHH:MM[Z] or …:SSZ), got ${describe(timestamp)}`);
  } else {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, timestamp.length - 1) !== timestamp.slice(0, -1)) {
      errors.push(`timestamp must parse as a real UTC instant, got ${JSON.stringify(timestamp)}`);
    }
  }
  if (!isSingleLine(branch, MAX_BRANCH_LENGTH)) errors.push(`branch must be a non-empty single-line string of at most ${MAX_BRANCH_LENGTH} chars, got ${describe(branch)}`);
  if (kind !== "mechanical" && kind !== "narrative") {
    errors.push(`kind must be one of ${JOURNAL_ENTRY_KINDS.join(", ")}, got ${JSON.stringify(kind)}`);
  }
  if (kind === "narrative" && (typeof summary !== "string" || summary.trim() === "")) {
    errors.push(`a narrative entry requires a non-empty summary, got ${describe(summary)}`);
  }
  if (kind === "mechanical" && (typeof reason !== "string" || !REASON.test(reason))) {
    errors.push(`a mechanical entry requires a lowercase reason token (a-z, 0-9, "-"), got ${describe(reason)}`);
  }
  if (summary !== undefined && (typeof summary !== "string" || summary.trim() === "")) {
    errors.push(`summary, when present, must be a non-empty string, got ${describe(summary)}`);
  }
  if (reason !== undefined && (typeof reason !== "string" || !REASON.test(reason))) {
    errors.push(`reason, when present, must be a lowercase token (a-z, 0-9, "-"), got ${describe(reason)}`);
  }
  if (commits !== undefined) {
    if (!isRecord(commits)) {
      errors.push(`commits must be an object with count and range, got ${describe(commits)}`);
    } else {
      const { count, range, ...commitUnknown } = commits;
      for (const key of Object.keys(commitUnknown)) errors.push(`unknown key "${key}" in commits (allowed: count, range)`);
      if (!Number.isInteger(count) || count < 0) errors.push(`commits.count must be a non-negative integer, got ${JSON.stringify(count)}`);
      if (range !== null && (typeof range !== "string" || !RANGE.test(range))) {
        errors.push(`commits.range must be null or look like "<sha>…<sha>", got ${JSON.stringify(range)}`);
      }
      if (range === null && count > 0) {
        errors.push(`commits.range is required when commits.count is ${count} — a count with no range is not a marker`);
      }
    }
  }
  if (files !== undefined) {
    if (!Array.isArray(files)) {
      errors.push(`files must be an array of project-relative paths, got ${describe(files)}`);
    } else if (files.length > MAX_FILES) {
      errors.push(`files carries ${files.length} paths, over the ${MAX_FILES} bound`);
    } else {
      for (const file of files) {
        if (!isSingleLine(file, MAX_PATH_LENGTH)) errors.push(`files must hold non-empty single-line paths of at most ${MAX_PATH_LENGTH} chars, got ${describe(file)}`);
      }
    }
  }
  if (metadata !== undefined && !isRecord(metadata)) {
    errors.push(`metadata must be a JSON object (validated for shape, never for keys), got ${describe(metadata)}`);
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    entry: {
      contract: JOURNAL_ENTRY_CONTRACT_ID,
      version: JOURNAL_ENTRY_VERSION,
      timestamp,
      branch,
      kind,
      ...(summary !== undefined ? { summary } : {}),
      ...(reason !== undefined ? { reason } : {}),
      ...(commits !== undefined ? { commits: { count: commits.count, range: commits.range } } : {}),
      ...(files !== undefined ? { files: [...files] } : {}),
      ...(metadata !== undefined ? { metadata } : {}),
    },
  };
}

/** The entry, or a thrown `JournalEntryError` — the shape the drivers use. */
function checked(input) {
  const result = normalizeEntry(input);
  if (!result.ok) throw new JournalEntryError(result.errors);
  return result.entry;
}

/**
 * A validated `log-facts@1` payload becomes a canonical mechanical entry —
 * the mechanical writer's bridge (AC3). The payload is validated here too, so
 * a caller that skipped `normalizeFacts` is refused with the facts' own reason.
 */
export function factsToEntry(facts) {
  const result = normalizeFacts(facts);
  if (!result.ok) throw new JournalEntryError(result.reason);
  const { timestamp, branch, reason, commits, files } = result.facts;
  return {
    contract: JOURNAL_ENTRY_CONTRACT_ID,
    version: JOURNAL_ENTRY_VERSION,
    timestamp,
    branch,
    kind: "mechanical",
    reason,
    commits: { count: commits.count, range: commits.range },
    files: [...files],
  };
}

/**
 * The mechanical entry's `log-facts@1` payload back out — the fragment
 * carrier's `writeFragment` input. A narrative entry has no facts payload
 * (its prose is the entry); this answers `null` for one instead of inventing
 * fields.
 */
export function entryToFacts(entry) {
  const checkedEntry = checked(entry);
  if (checkedEntry.kind !== "mechanical") return null;
  return {
    timestamp: checkedEntry.timestamp,
    branch: checkedEntry.branch,
    reason: checkedEntry.reason,
    commits: { count: checkedEntry.commits.count, range: checkedEntry.commits.range },
    files: [...checkedEntry.files],
  };
}
