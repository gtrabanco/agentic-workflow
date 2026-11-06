/**
 * The canonical journal entry (`journal-entry@1`) — issue #374's structured
 * record, the substrate a store driver persists and the web layer renders.
 *
 * One versioned type, the envelope precedent: a version constant, a contract
 * id, a dependency-free validator, and a TypeBox-flavoured draft-07 JSON Schema
 * document (`journal-entry.schema.json`) that strict Ajv compiles and the
 * crate's TypeBox dependency can compile too — the suite pins the agreement.
 *
 * The field set is the issue's core list extended by exactly one field:
 * `reason` (required when `kind` is `mechanical`, because the default driver's
 * rendered heading is `## <ts> — <branch> — auto (<reason>)` and
 * `log-entry@1`'s bytes are frozen). `summary` is required when `kind` is
 * `narrative` and carried by no mechanical entry — a required prose line on
 * machine entries would break that parity.
 *
 * **Core is closed; `metadata` is open.** An unknown top-level key is refused
 * — a consumer field (`dev_id`, `commit_hash`, `team`, `ticket`) belongs in
 * the `metadata` map, which is validated for shape (a JSON object) and never
 * for keys. No core writer ever strips one.
 */

/** The contract id of the canonical journal entry. */
export const JOURNAL_ENTRY_CONTRACT_ID = "agentic-workflow/journal-entry";

/** The version constant: adding or changing a core field bumps this. */
export const JOURNAL_ENTRY_VERSION = 1;

/** The closed `kind` set — the fragment carrier's writer classes (#405). */
export const JOURNAL_ENTRY_KINDS = ["mechanical", "narrative"] as const;
export type JournalEntryKind = (typeof JOURNAL_ENTRY_KINDS)[number];

/** UTC minute (`YYYY-MM-DDTHH:MMZ`, the mechanical form) or second (`…:SSZ`, the narrative form). */
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/u;

/** A lowercase token: the shutdown reasons `log-facts@1` froze. */
const REASON = /^[a-z][a-z0-9-]*$/u;

/** `<sha>…<sha>` — both sides abbreviated by git, so length varies. */
const RANGE = /^[0-9a-f]{4,40}…[0-9a-f]{4,40}$/u;

const MAX_BRANCH_LENGTH = 255;
const MAX_PATH_LENGTH = 1024;
const MAX_FILES = 10000;

export interface JournalEntryCommits {
  count: number;
  range: string | null;
}

export interface JournalEntry {
  contract: typeof JOURNAL_ENTRY_CONTRACT_ID;
  version: typeof JOURNAL_ENTRY_VERSION;
  timestamp: string;
  branch: string;
  kind: JournalEntryKind;
  /** Required when `kind` is `narrative`; carried by no mechanical entry. */
  summary?: string;
  /** Required when `kind` is `mechanical` — the rendered heading's reason token. */
  reason?: string;
  commits?: JournalEntryCommits;
  files?: string[];
  /** The open map: validated for shape, never for keys. */
  metadata?: Record<string, unknown>;
}

export type JournalEntryResult =
  | { ok: true; entry: JournalEntry }
  | { ok: false; errors: string[] };

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isSingleLine(v: unknown, max: number): v is string {
  return typeof v === "string" && v.trim() !== "" && !/[\r\n]/u.test(v) && v.length <= max;
}

/**
 * Validate a canonical journal entry. Never repairs, coerces or trims: an
 * unknown top-level key is refused (the consumer map is `metadata`), an
 * out-of-shape field names itself in the errors.
 */
export function validateJournalEntry(value: unknown): JournalEntryResult {
  const errors: string[] = [];
  if (!isObj(value)) {
    return { ok: false, errors: [`the journal entry must be a JSON object, got ${value === null ? "null" : Array.isArray(value) ? "an array" : typeof value}`] };
  }
  const { contract, version, timestamp, branch, kind, summary, reason, commits, files, metadata, ...unknown } = value;

  if (contract !== JOURNAL_ENTRY_CONTRACT_ID) errors.push(`contract must be "${JOURNAL_ENTRY_CONTRACT_ID}", got ${JSON.stringify(contract)}`);
  if (version !== JOURNAL_ENTRY_VERSION) errors.push(`version must be ${JOURNAL_ENTRY_VERSION}, got ${JSON.stringify(version)}`);
  for (const key of Object.keys(unknown)) {
    errors.push(`unknown top-level key "${key}" — a consumer field belongs in the metadata map`);
  }
  if (typeof timestamp !== "string" || !TIMESTAMP.test(timestamp)) {
    errors.push(`timestamp must be a UTC minute or second stamp (YYYY-MM-DDTHH:MM[Z] or …:SSZ), got ${JSON.stringify(timestamp)}`);
  } else {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, timestamp.length - 1) !== timestamp.slice(0, -1)) {
      errors.push(`timestamp must parse as a real UTC instant, got ${JSON.stringify(timestamp)}`);
    }
  }
  if (!isSingleLine(branch, MAX_BRANCH_LENGTH)) errors.push(`branch must be a non-empty single-line string of at most ${MAX_BRANCH_LENGTH} chars, got ${JSON.stringify(branch)}`);
  if (kind !== "mechanical" && kind !== "narrative") {
    errors.push(`kind must be one of ${JOURNAL_ENTRY_KINDS.join(", ")}, got ${JSON.stringify(kind)}`);
  }
  if (kind === "narrative") {
    if (typeof summary !== "string" || summary.trim() === "") errors.push(`a narrative entry requires a non-empty summary, got ${JSON.stringify(summary)}`);
  } else if (kind === "mechanical") {
    if (typeof reason !== "string" || !REASON.test(reason)) errors.push(`a mechanical entry requires a lowercase reason token (a-z, 0-9, "-"), got ${JSON.stringify(reason)}`);
  }
  if (summary !== undefined && (typeof summary !== "string" || summary.trim() === "")) {
    errors.push(`summary, when present, must be a non-empty string, got ${JSON.stringify(summary)}`);
  }
  if (reason !== undefined && (typeof reason !== "string" || !REASON.test(reason))) {
    errors.push(`reason, when present, must be a lowercase token (a-z, 0-9, "-"), got ${JSON.stringify(reason)}`);
  }
  if (commits !== undefined) {
    if (!isObj(commits)) {
      errors.push(`commits must be an object with count and range, got ${Array.isArray(commits) ? "an array" : typeof commits}`);
    } else {
      const { count, range, ...commitUnknown } = commits;
      for (const key of Object.keys(commitUnknown)) errors.push(`unknown key "${key}" in commits (allowed: count, range)`);
      if (!Number.isInteger(count) || (count as number) < 0) errors.push(`commits.count must be a non-negative integer, got ${JSON.stringify(count)}`);
      if (range !== null && (typeof range !== "string" || !RANGE.test(range))) {
        errors.push(`commits.range must be null or look like "<sha>…<sha>", got ${JSON.stringify(range)}`);
      }
      if (range === null && typeof count === "number" && count > 0) {
        errors.push(`commits.range is required when commits.count is ${count} — a count with no range is not a marker`);
      }
    }
  }
  if (files !== undefined) {
    if (!Array.isArray(files)) {
      errors.push(`files must be an array of project-relative paths, got ${typeof files}`);
    } else if (files.length > MAX_FILES) {
      errors.push(`files carries ${files.length} paths, over the ${MAX_FILES} bound`);
    } else {
      for (const file of files) {
        if (!isSingleLine(file, MAX_PATH_LENGTH)) errors.push(`files must hold non-empty single-line paths of at most ${MAX_PATH_LENGTH} chars, got ${JSON.stringify(file)}`);
      }
    }
  }
  if (metadata !== undefined && !isObj(metadata)) {
    errors.push(`metadata must be a JSON object (validated for shape, never for keys), got ${Array.isArray(metadata) ? "an array" : typeof metadata}`);
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    entry: {
      contract: JOURNAL_ENTRY_CONTRACT_ID,
      version: JOURNAL_ENTRY_VERSION,
      timestamp: timestamp as string,
      branch: branch as string,
      kind: kind as JournalEntryKind,
      ...(summary !== undefined ? { summary: summary as string } : {}),
      ...(reason !== undefined ? { reason: reason as string } : {}),
      ...(commits !== undefined ? { commits: commits as JournalEntryCommits } : {}),
      ...(files !== undefined ? { files: [...(files as string[])] } : {}),
      ...(metadata !== undefined ? { metadata: metadata as Record<string, unknown> } : {}),
    },
  };
}
