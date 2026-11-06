/**
 * aggregate.mjs — the merge-to-main aggregator (issue #405, S11).
 *
 * Reads the pending fragments under `.agentic-workflow/journal/`, appends them
 * to `docs/LOGS.md` newest-first with a declared tie-break, deletes the
 * consumed fragments, and refuses anything ambiguous instead of guessing. The
 * module carries no hosting-platform dependency: the example
 * push-to-default-branch workflow and the documented `post-receive` hook both
 * run the same `journal aggregate` command unchanged (AC5).
 *
 * The decisions worth knowing, each pinned by `test/journal.test.mjs`:
 *
 *  - **Append at the end.** `docs/LOGS.md` is append-only (its own header says
 *    so), so the batch lands after the last entry — the same place a direct
 *    append would have put it — ordered newest-first within the batch, ties
 *    broken branch, then kind, then session, ascending. The committed history
 *    is never reordered.
 *  - **Validate everything, then mutate.** Every fragment is parsed and
 *    checked before the first byte moves, so a refusal leaves the journal and
 *    the carrier exactly as they were (O11).
 *  - **Already-present is not duplicated.** A fragment whose bytes are already
 *    in the journal is consumed without being appended — a crash between the
 *    append and the delete re-runs as a no-op instead of duplicating an entry.
 *  - **The journal is never created.** A missing `docs/LOGS.md` is a refusal:
 *    the project creates its journal once (from the template's shape), the
 *    aggregator never invents one.
 */

import fs from "node:fs";
import path from "node:path";

import { JOURNAL_DIR, parseFragmentName } from "./fragment.mjs";

/** A refused aggregation. The CLI maps this to exit 2, "JOURNAL REFUSAL — <reason>". */
export class JournalAggregateError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "JournalAggregateError";
  }
}

/** The project journal, relative to the project root. */
export const DEFAULT_LOG = "docs/LOGS.md";

/** One pending fragment: parsed identity + bytes. */
function loadFragment(dir, name) {
  const parsed = parseFragmentName(name);
  if (parsed === null) throw new JournalAggregateError(`unparseable fragment name "${name}" — a fragment's name is its identity`);
  let content;
  try {
    content = fs.readFileSync(path.join(dir, name), "utf8");
  } catch {
    throw new JournalAggregateError(`fragment "${name}" is not readable`);
  }
  if (content === "" || !content.endsWith("\n")) {
    throw new JournalAggregateError(`fragment "${name}" is not a newline-terminated entry block`);
  }
  if (content.includes("\r")) {
    throw new JournalAggregateError(`fragment "${name}" contains CR`);
  }
  if (!content.startsWith("## ")) {
    throw new JournalAggregateError(`fragment "${name}" does not start with an entry heading`);
  }
  return { name, ...parsed, content };
}

/**
 * Aggregate the pending fragments into the journal.
 *
 * Returns `{ ok: true, appended, alreadyPresent, removed, log, fragments }` —
 * names, not paths, in every list — or throws `JournalAggregateError` with the
 * refusal reason. A missing or empty carrier directory is a no-op receipt, not
 * an error: there is nothing to aggregate.
 */
export function aggregateJournal(options) {
  const root = options?.root;
  if (typeof root !== "string" || root === "") throw new JournalAggregateError("aggregateJournal: root is required");
  const dir = path.join(root, options?.journalDir ?? JOURNAL_DIR);
  const logPath = path.join(root, options?.logPath ?? DEFAULT_LOG);

  if (!fs.existsSync(dir)) {
    return { ok: true, appended: [], alreadyPresent: [], removed: [], log: options?.logPath ?? DEFAULT_LOG, fragments: 0 };
  }
  if (!fs.statSync(dir).isDirectory()) {
    throw new JournalAggregateError(`${options?.journalDir ?? JOURNAL_DIR} is not a directory`);
  }
  if (!fs.existsSync(logPath)) {
    throw new JournalAggregateError(`no journal at ${options?.logPath ?? DEFAULT_LOG} — the aggregator never creates one`);
  }

  const names = fs.readdirSync(dir).filter((name) => fs.statSync(path.join(dir, name)).isFile());
  // The carrier's one declared placeholder: a git repository cannot track an
  // empty directory, and an opted-in project's carrier IS empty between
  // aggregations — without the placeholder the directory would vanish from
  // the tree and the opt-in ("the directory's presence is the opt-in") would
  // silently evaporate after every full aggregation. The placeholder is
  // zero-byte and stays zero-byte (notes live in `journal.md` beside the
  // carrier), so it is skipped, never consumed; any other non-fragment name is
  // still refused (issue #374's differential found the gap, D13).
  const pending = names.filter((name) => name !== ".gitkeep");
  if (pending.length === 0) {
    return { ok: true, appended: [], alreadyPresent: [], removed: [], log: options?.logPath ?? DEFAULT_LOG, fragments: 0 };
  }

  // Validate everything before the first byte moves.
  const fragments = pending
    .map((name) => loadFragment(dir, name))
    .sort((a, b) => {
      // Newest first; ties break branch, then kind, then session, ascending.
      if (a.timestamp !== b.timestamp) return a.timestamp < b.timestamp ? 1 : -1;
      if (a.branch !== b.branch) return a.branch < b.branch ? -1 : 1;
      if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
      if (a.sessionId !== b.sessionId) return a.sessionId < b.sessionId ? -1 : 1;
      return a.name < b.name ? -1 : 1;
    });

  const log = fs.readFileSync(logPath, "utf8");
  const appended = [];
  const alreadyPresent = [];
  for (const fragment of fragments) {
    if (log.includes(fragment.content)) {
      // A crash between the append and the delete re-presents this fragment;
      // consuming it keeps the re-run a no-op instead of duplicating an entry.
      alreadyPresent.push(fragment.name);
    } else {
      fs.appendFileSync(logPath, `\n${fragment.content}`);
      appended.push(fragment.name);
    }
    fs.rmSync(path.join(dir, fragment.name));
  }

  return {
    ok: true,
    appended,
    alreadyPresent,
    removed: fragments.map((fragment) => fragment.name),
    log: options?.logPath ?? DEFAULT_LOG,
    fragments: fragments.length,
  };
}
