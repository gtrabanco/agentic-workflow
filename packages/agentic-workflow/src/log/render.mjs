/**
 * render.mjs — the ONE owner of a mechanical journal entry's bytes
 * (feature #394, issue #394 S2/S5/S8).
 *
 * A `docs/LOGS.md` entry is machine output: branch, commit count and range, and
 * the paths the session touched. Three writers produce it — this package's
 * `log render` CLI, the pi extension's session hook (`@gtrabanco/pi-agentic-workflow`)
 * and, in the exported scaffold, `template/.claude/hooks/log-session-end.sh`.
 * They agree because they all come through here: the CLI and the extension
 * import this module, and the hook is executed by
 * `packages/pi-agentic-workflow/test/auto-log-session-parity.test.mjs` so its
 * bytes are compared, never assumed.
 *
 * Three rules, each a test in `test/log.render.test.mjs`:
 *
 *  - **The payload is frozen.** `log-facts@1` is five keys. An unknown key is
 *    refused instead of carried: a caller that smuggles prompt text, model
 *    output or a diff into the facts has to change this file first, and that
 *    change is the review (S5).
 *  - **Pure.** No clock, no git, no filesystem, no pi: the caller supplies the
 *    timestamp, the branch, the count, the range and the paths. Rendering the
 *    same payload twice is the same bytes, which is what makes a CI job able to
 *    byte-diff an entry without running a session (S2).
 *  - **The hook's punctuation, not a nicer one.** `<iso> — <branch> — auto
 *    (<reason>)`, `- **Commits:** n \`a…b\``, `- **Files:** a b` — the hook's
 *    own printf calls, including `(no marker)` (S8).
 */

/** The contract id of the payload a caller hands `renderEntry`. */
export const LOG_FACTS_CONTRACT_ID = "log-facts@1";

/** The contract id of the rendered entry block. */
export const LOG_ENTRY_CONTRACT_ID = "log-entry@1";

/** The payload's closed key set. Adding one is a contract change, by design. */
export const LOG_FACTS_KEYS = Object.freeze(["timestamp", "branch", "reason", "commits", "files"]);

/** The `commits` object's closed key set. */
export const LOG_COMMIT_KEYS = Object.freeze(["count", "range"]);

/** UTC minute precision, the hook's `date -u +%Y-%m-%dT%H:%MZ`. */
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/u;

/** A lowercase token: pi's shutdown reasons, the hook's `exit`/`clear`/`other`. */
const REASON = /^[a-z][a-z0-9-]*$/u;

/** `<sha>…<sha>` — both sides abbreviated by git, so length varies. */
const RANGE = /^[0-9a-f]{4,40}…[0-9a-f]{4,40}$/u;

/** A path cell: non-empty, single line, no leading dash that would read as a flag. */
const MAX_PATH_LENGTH = 1024;
const MAX_FILES = 10000;
const MAX_BRANCH_LENGTH = 255;

/** A refused payload. Named so a caller can tell a refusal from a bug. */
export class LogFactsError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "LogFactsError";
  }
}

const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

/** `typeof` with the two shapes a caller confuses with objects spelled out. */
function describe(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  return typeof value === "string" ? JSON.stringify(value) : typeof value;
}

/**
 * Validate and normalize a `log-facts@1` payload.
 *
 * Returns `{ ok: true, facts }` with the payload's own five keys, or
 * `{ ok: false, reason }` naming the offending field and what it must be. It
 * never repairs, coerces or trims: a caller that has to be guessed at is a
 * caller that has not been read.
 */
export function normalizeFacts(input) {
  if (!isRecord(input)) {
    return { ok: false, reason: `the facts payload must be a JSON object, got ${describe(input)}` };
  }
  for (const key of Object.keys(input)) {
    if (!LOG_FACTS_KEYS.includes(key)) {
      return {
        ok: false,
        reason: `unknown key "${key}" in the facts payload (allowed: ${LOG_FACTS_KEYS.join(", ")})`,
      };
    }
  }

  const { timestamp, branch, reason, commits, files } = input;

  if (typeof timestamp !== "string" || !TIMESTAMP.test(timestamp)) {
    return {
      ok: false,
      reason: `timestamp must be a UTC minute stamp (YYYY-MM-DDTHH:MMZ), got ${describe(timestamp)}`,
    };
  }
  if (typeof branch !== "string" || branch.trim() === "" || /[\r\n]/u.test(branch) || branch.length > MAX_BRANCH_LENGTH) {
    return { ok: false, reason: `branch must be a non-empty single-line string, got ${describe(branch)}` };
  }
  if (typeof reason !== "string" || !REASON.test(reason)) {
    return {
      ok: false,
      reason: `reason must be a lowercase token (a-z, 0-9, "-"), got ${describe(reason)}`,
    };
  }
  if (!isRecord(commits)) {
    return { ok: false, reason: `commits must be an object with count and range, got ${describe(commits)}` };
  }
  for (const key of Object.keys(commits)) {
    if (!LOG_COMMIT_KEYS.includes(key)) {
      return {
        ok: false,
        reason: `unknown key "${key}" in commits (allowed: ${LOG_COMMIT_KEYS.join(", ")})`,
      };
    }
  }
  if (!Number.isInteger(commits.count) || commits.count < 0) {
    return { ok: false, reason: `commits.count must be a non-negative integer, got ${describe(commits.count)}` };
  }
  if (commits.range !== null && (typeof commits.range !== "string" || !RANGE.test(commits.range))) {
    return {
      ok: false,
      reason: `commits.range must be null or look like "<sha>…<sha>", got ${describe(commits.range)}`,
    };
  }
  if (commits.range === null && commits.count > 0) {
    return {
      ok: false,
      reason: `commits.range is required when commits.count is ${commits.count} — a count with no range is not a marker`,
    };
  }
  if (!Array.isArray(files)) {
    return { ok: false, reason: `files must be an array of project-relative paths, got ${describe(files)}` };
  }
  if (files.length > MAX_FILES) {
    return { ok: false, reason: `files carries ${files.length} paths, over the ${MAX_FILES} bound` };
  }
  for (const file of files) {
    if (typeof file !== "string" || file.trim() === "" || /[\r\n]/u.test(file) || file.length > MAX_PATH_LENGTH) {
      return { ok: false, reason: `files must hold non-empty single-line paths, got ${describe(file)}` };
    }
  }

  return {
    ok: true,
    facts: {
      timestamp,
      branch,
      reason,
      commits: { count: commits.count, range: commits.range },
      files: [...files],
    },
  };
}

/** The facts, or a thrown `LogFactsError` — the shape the renderers use. */
function checked(facts) {
  const result = normalizeFacts(facts);
  if (!result.ok) throw new LogFactsError(result.reason);
  return result.facts;
}

/**
 * What the journal append looks like once the entry is written.
 *
 * A string predicate rather than a second grammar: the three-line shape the hook
 * prints, used by the parity test to prove the oracle still speaks it.
 */
export function isRenderedEntry(text) {
  if (typeof text !== "string" || !text.endsWith("\n") || text.includes("\r")) return false;
  const lines = text.slice(0, -1).split("\n");
  if (lines.length !== 3) return false;
  return (
    /^## \d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z — .+ — auto \([a-z][a-z0-9-]*\)$/u.test(lines[0]) &&
    /^- \*\*Commits:\*\* \d+( `[0-9a-f]{4,40}…[0-9a-f]{4,40}`| \(no marker\))$/u.test(lines[1]) &&
    /^- \*\*Files:\*\* .+$/u.test(lines[2])
  );
}

/**
 * The entry block, exactly as it is appended (the caller supplies the separating
 * newline — see `createJournalPublisher` and the hook's own `printf '\n## …'`).
 *
 * Throws `LogFactsError` on a payload that does not satisfy `log-facts@1`.
 */
export function renderEntry(facts) {
  const checkedFacts = checked(facts);
  const { timestamp, branch, reason, commits, files } = checkedFacts;
  const range = commits.range === null ? " (no marker)" : ` \`${commits.range}\``;
  const paths = files.length === 0 ? "—" : files.join(" ");
  return (
    `## ${timestamp} — ${branch} — auto (${reason})\n` +
    `- **Commits:** ${commits.count}${range}\n` +
    `- **Files:** ${paths}\n`
  );
}

/**
 * The CLI's machine answer: the contract ids, the bytes and their length, so a
 * caller byte-diffs without re-rendering anything. A refused payload answers
 * `{ ok: false, error }` instead of throwing — a CLI reports refusals on stdout.
 */
export function renderReceipt(facts) {
  const result = normalizeFacts(facts);
  if (!result.ok) {
    return { ok: false, contract: LOG_ENTRY_CONTRACT_ID, facts: LOG_FACTS_CONTRACT_ID, error: result.reason };
  }
  const entry = renderEntry(result.facts);
  return {
    ok: true,
    contract: LOG_ENTRY_CONTRACT_ID,
    facts: LOG_FACTS_CONTRACT_ID,
    entry,
    bytes: Buffer.byteLength(entry, "utf8"),
  };
}
