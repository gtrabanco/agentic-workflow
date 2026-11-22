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
 *  - **One entry per conversation per kind.** The entry slot is
 *    `(sessionId, kind)`, never the bytes (issue #675). The lint refuses a slot
 *    that is not one entry plus its declared corrections, naming every file; the
 *    aggregator keeps the newest of the set and records the fragments it
 *    superseded in its receipt, so a duplicate can neither pass the carrier
 *    nor append twice. The shared `local` slug names no conversation
 *    (`journal-write-grammar@1`), so it never collides.
 *  - **A stale entry is corrected, not rewritten.** A slot may hold one entry
 *    plus the corrections that declare it (issue #676): read newest-first,
 *    every fragment but the oldest names the one immediately older than it in
 *    its `Supersedes` cell, and the oldest (the entry) names nothing. The lint
 *    accepts exactly that chain and refuses every other multi-fragment slot;
 *    the aggregator's newest-wins consume then lands the correction once.
 *  - **The journal is never created.** A missing `docs/LOGS.md` is a refusal:
 *    the project creates its journal once (from the template's shape), the
 *    aggregator never invents one.
 */

import fs from "node:fs";
import path from "node:path";

import { JOURNAL_ERRATA_MARKERS } from "@gtrabanco/agentic-workflow-schema";

import { JOURNAL_DIR, fragmentFault, isConversationSession } from "./fragment.mjs";

/** A refused aggregation. The CLI maps this to exit 2, "JOURNAL REFUSAL — <reason>". */
export class JournalAggregateError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "JournalAggregateError";
  }
}

/** The project journal, relative to the project root. */
export const DEFAULT_LOG = "docs/LOGS.md";

/**
 * The entry slot the grammar names: one conversation, one kind. The timestamp
 * and the branch are not part of it — a second entry for the slot is a
 * duplicate however it is written (issue #468 S3, read side #675).
 */
function entrySlot(parsed) {
  return `${parsed.kind}\u0000${parsed.sessionId}`;
}

/** `"a"`, `"a" and "b"`, `"a", "b" and "c"` — a refusal that names every file. */
function namedList(names) {
  const quoted = names.map((name) => `"${name}"`);
  if (quoted.length === 1) return quoted[0];
  return `${quoted.slice(0, -1).join(", ")} and ${quoted[quoted.length - 1]}`;
}

/**
 * The order a slot is read and consumed in: newest first, ties broken branch,
 * then kind, then session, then name, all ascending. One comparator for the
 * aggregator's batch order and the lint's chain, so the two cannot disagree
 * about which fragment is newer.
 */
function newestFirst(a, b) {
  if (a.timestamp !== b.timestamp) return a.timestamp < b.timestamp ? 1 : -1;
  if (a.branch !== b.branch) return a.branch < b.branch ? -1 : 1;
  if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
  if (a.sessionId !== b.sessionId) return a.sessionId < b.sessionId ? -1 : 1;
  return a.name < b.name ? -1 : 1;
}

/** What a slot's fragments have in common, in every chain refusal's wording. */
function slotIdentity({ sessionId, kind, names }) {
  return `fragments ${namedList(names)} carry the same identity — session ${JSON.stringify(sessionId)}'s ${kind} entry; timestamps and branches do not distinguish an entry slot, and the grammar's unit is one entry per conversation per kind`;
}

/** The lint's one line for one slot whose fragments are not a correction chain. */
function chainReason({ identity, fragment, declared, expected }) {
  const marker = JOURNAL_ERRATA_MARKERS[0];
  if (expected === null) {
    return `${slotIdentity(identity)}; "${fragment}" is the oldest fragment of the slot and declares ${marker} "${declared}" — the oldest fragment is the entry a correction names, never a correction itself`;
  }
  if (declared === null) {
    return `${slotIdentity(identity)}; "${fragment}" declares no ${marker} cell, but "${expected}" is the fragment immediately older than it — a slot is one entry plus the corrections that name their immediate predecessor, so an undeclared second fragment is a duplicate`;
  }
  return `${slotIdentity(identity)}; "${fragment}" declares ${marker} "${declared}", but "${expected}" is the fragment immediately older than it — a slot is one entry plus the corrections that name their immediate predecessor, in order`;
}

/**
 * The lint's cross-fragment half (issues #675 and #676): group conforming
 * fragments by their entry slot and answer one refusal per slot that is not a
 * correction chain. The shared `local` slug is not a conversation, so it is
 * never grouped — the same predicate the writer reads, never a second copy of
 * the exemption.
 */
function identityFaults(fragments) {
  const slots = new Map();
  for (const fragment of fragments) {
    if (!isConversationSession(fragment.sessionId)) continue;
    const slot = entrySlot(fragment);
    if (!slots.has(slot)) slots.set(slot, []);
    slots.get(slot).push(fragment);
  }
  const refusals = [];
  for (const group of slots.values()) {
    const ordered = [...group].sort(newestFirst);
    const names = ordered.map((fragment) => fragment.name).sort();
    const identity = { sessionId: ordered[0].sessionId, kind: ordered[0].kind, names };
    // A lone fragment chains against nothing: the oldest names nothing, so a
    // lone declared link dangles or points outside the slot (D2/D7).
    if (group.length < 2) {
      const only = ordered[0];
      if (only.supersedes !== null) {
        refusals.push({
          name: names[0],
          names,
          reason: chainReason({ identity, fragment: only.name, declared: only.supersedes, expected: null }),
        });
      }
      continue;
    }
    for (const [index, fragment] of ordered.entries()) {
      const expected = index + 1 < ordered.length ? ordered[index + 1].name : null;
      if (fragment.supersedes === expected) continue;
      refusals.push({
        name: names[0],
        names,
        reason: chainReason({ identity, fragment: fragment.name, declared: fragment.supersedes, expected }),
      });
      break;
    }
  }
  return refusals;
}

/** One pending fragment: parsed identity + bytes, validated by the one predicate. */
function loadFragment(dir, name) {
  let content;
  try {
    content = fs.readFileSync(path.join(dir, name), "utf8");
  } catch {
    throw new JournalAggregateError(`fragment "${name}" is not readable`);
  }
  // The aggregator validates the name's grammar and the body's shape, then
  // trusts the name — its documented contract (S6). The heading/name
  // contradiction is the write path's, the lint's and the close's refusal.
  const fault = fragmentFault(name, content, { identity: false });
  if (!fault.ok) throw new JournalAggregateError(fault.reason);
  return { name, ...fault.parsed, content };
}

/**
 * The carrier's lint: validate every pending fragment, list every fault, move
 * no byte (issue #452 S3). `aggregate` refuses at the first fault because it
 * must not half-apply; a lint's job is the whole list, so a PR author sees all
 * of it in one run.
 *
 * Returns `{ ok, checked, refusals, journalDir }`; `ok` is true only for a
 * conforming carrier (which includes the `.gitkeep` placeholder, skipped by
 * the same rule the aggregator uses).
 */
export function checkJournal(options) {
  const root = options?.root;
  if (typeof root !== "string" || root === "") throw new JournalAggregateError("checkJournal: root is required");
  const journalDir = options?.journalDir ?? JOURNAL_DIR;
  const dir = path.join(root, journalDir);
  if (!fs.existsSync(dir)) return { ok: true, checked: 0, refusals: [], journalDir };
  if (!fs.statSync(dir).isDirectory()) throw new JournalAggregateError(`${journalDir} is not a directory`);
  const names = fs
    .readdirSync(dir)
    .filter((name) => fs.statSync(path.join(dir, name)).isFile() && name !== ".gitkeep")
    .sort();
  const refusals = [];
  const conforming = [];
  for (const name of names) {
    let content;
    try {
      content = fs.readFileSync(path.join(dir, name), "utf8");
    } catch {
      refusals.push({ name, reason: `fragment "${name}" is not readable` });
      continue;
    }
    const fault = fragmentFault(name, content);
    if (!fault.ok) refusals.push({ name, reason: fault.reason });
    else conforming.push({ name, ...fault.parsed, supersedes: fault.supersedes });
  }
  // The second half (issues #675/#676): the entry slot is compared across
  // fragments, which the per-fragment loop can never see.
  refusals.push(...identityFaults(conforming));
  return { ok: refusals.length === 0, checked: names.length, refusals, journalDir };
}

/**
 * Aggregate the pending fragments into the journal.
 *
 * Returns `{ ok: true, appended, alreadyPresent, superseded, removed, log,
 * fragments }` — names, not paths, in every list — or throws
 * `JournalAggregateError` with the refusal reason. A missing or empty carrier
 * directory is a no-op receipt, not an error: there is nothing to aggregate.
 *
 * A colliding identity slot is consumed newest-first (issue #675, decision D1):
 * the set is already sorted newest-first, so the first fragment of a slot is
 * appended and every later one is consumed without appending and named in
 * `superseded` with the fragment that superseded it. The rule is the slot's,
 * never byte coincidence, and it consumes nothing when `docs/LOGS.md` is absent.
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
    .sort(newestFirst);

  // Issue #675: one entry per conversation per kind. The sorted set is
  // newest-first, so the first fragment of a slot is the entry and the rest are
  // superseded — a differing timestamp is not a second entry slot, and the
  // decision never depends on the bytes (the old accidental rule).
  const kept = [];
  const superseded = [];
  const winners = new Map();
  for (const fragment of fragments) {
    if (!isConversationSession(fragment.sessionId)) {
      kept.push(fragment);
      continue;
    }
    const slot = entrySlot(fragment);
    const winner = winners.get(slot);
    if (winner === undefined) {
      winners.set(slot, fragment);
      kept.push(fragment);
      continue;
    }
    superseded.push({ name: fragment.name, supersededBy: winner.name });
  }

  const log = fs.readFileSync(logPath, "utf8");
  const appended = [];
  const alreadyPresent = [];
  for (const fragment of kept) {
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
  for (const fragment of superseded) fs.rmSync(path.join(dir, fragment.name));

  return {
    ok: true,
    appended,
    alreadyPresent,
    superseded,
    removed: fragments.map((fragment) => fragment.name),
    log: options?.logPath ?? DEFAULT_LOG,
    fragments: fragments.length,
  };
}
