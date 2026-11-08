/**
 * write.mjs — the programmatic fragment writer (issue #452, S1/S2/S7).
 *
 * The failure this removes is not a parser bug: it is a model composing a
 * filename and pasting bytes. Four fragments across 2026-11-07/08 put the writer
 * label in the kind slot or lost their trailing newline, and each one was only
 * discovered hours later by the merge-to-main aggregator, the weekly CI carrier
 * run or the publish gate's package suite.
 *
 * So the writer takes the only thing a model can honestly supply — prose fields
 * (or a rendered block on stdin, so long text never fights shell quoting) — and
 * computes everything else: the UTC second, the branch from git, the session
 * slug, the rendered bytes from the one block owner, and the name from the
 * grammar's one owner. It self-validates the produced name before writing and
 * lands the file through `writeFragment`, whose byte and identity contract is
 * already the library's (S2 — pinned here, never re-implemented).
 *
 * Read-side and write-side validation share one predicate (`fragmentFault`), so
 * the carrier lint and the writer cannot disagree about what a conforming
 * fragment is.
 */

import fs from "node:fs";
import path from "node:path";

import {
  FRAGMENT_KINDS,
  FragmentError,
  JOURNAL_DIR,
  fragmentName,
  parseFragmentName,
  slug,
  writeFragment,
} from "./fragment.mjs";
import { currentBranch, isoSecond, readSessionFacts, renderEntryBlock, resolveBase } from "./block.mjs";
import { LogFactsError } from "../log/render.mjs";

/** A refused write. The CLI maps this to exit 2, "JOURNAL REFUSAL — <reason>". */
export class JournalWriteError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "JournalWriteError";
  }
}

/** The flags the write operation accepts. A name flag is deliberately absent. */
const VALUE_FLAGS = new Set([
  "kind",
  "session",
  "timestamp",
  "title",
  "summary",
  "decisions",
  "next",
  "content",
  "facts",
  "base",
  "journal-dir",
  "dir",
]);

/**
 * Parse the write operation's flags. Closed world: an unknown flag is a
 * refusal, and the refusal names it — `--name` included, because a caller that
 * tries to hand a filename has to learn that it cannot.
 */
export function parseWriteArgs(argv) {
  const flags = { args: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--json") {
      flags.json = true;
      continue;
    }
    if (token.startsWith("--")) {
      const eq = token.indexOf("=");
      const name = eq === -1 ? token.slice(2) : token.slice(2, eq);
      if (!VALUE_FLAGS.has(name)) {
        throw new JournalWriteError(`unknown flag --${name} — journal write takes fields, never a filename`);
      }
      const value = eq === -1 ? argv[++i] : token.slice(eq + 1);
      if (value === undefined) throw new JournalWriteError(`--${name} needs a value`);
      flags[name] = value;
      continue;
    }
    flags.args.push(token);
  }
  return flags;
}

/** The write's refusal surface, for a CLI that maps named errors to exit 2. */
export const WRITE_REFUSALS = Object.freeze([JournalWriteError, FragmentError, LogFactsError]);

/**
 * The carrier's conforming fragment names — the read side of the
 * already-registered check: a fragment's name carries its session's slug, so
 * the carrier itself answers whether this conversation already landed an
 * entry. Unreadable entries are skipped; the carrier lint owns them.
 */
function registeredSessions(root, carrier) {
  let names;
  try {
    names = fs.readdirSync(path.join(root, carrier));
  } catch {
    return [];
  }
  return names
    .map((name) => ({ name, parsed: parseFragmentName(name) }))
    .filter((entry) => entry.parsed !== null);
}

/**
 * Write one fragment from fields.
 *
 * `kind: "narrative"` needs `content` or at least `summary`; the block is
 * rendered from the fields plus the session's git facts when `content` is
 * absent. `kind: "mechanical"` needs `facts` (`log-facts@1`) and nothing else —
 * its bytes stay `renderEntry`'s.
 *
 * Returns `{ ok, kind, name, path, bytes, branch, session }`; every failure is
 * one of the named refusals above, never a partial write.
 */
export function writeJournal(options) {
  const root = options?.root;
  if (typeof root !== "string" || root === "") throw new JournalWriteError("writeJournal: root is required");
  const kind = options?.kind;
  if (!FRAGMENT_KINDS.includes(kind)) {
    throw new JournalWriteError(`--kind must be one of ${FRAGMENT_KINDS.join(", ")}, got ${JSON.stringify(kind ?? "")}`);
  }
  // The carrier directory's presence is the opt-in (issue #405), so the writer
  // never creates it: a single write that sprang the directory into existence
  // would flip `session-close close` into carrier mode and hand the project's
  // journal to an aggregator nobody wired. Opting in stays a deliberate act.
  const carrier = options?.journalDir ?? JOURNAL_DIR;
  if (!fs.existsSync(path.join(root, carrier))) {
    throw new JournalWriteError(
      `the fragment carrier ${carrier} does not exist — its presence is the opt-in (issue #405), so this writer never creates it; opt the project in deliberately (mkdir -p ${carrier}) and re-run`,
    );
  }

  let timestamp;
  try {
    timestamp = options?.timestamp ?? Date.now();
    isoSecond(timestamp);
  } catch (error) {
    throw new JournalWriteError(error.message);
  }
  const session = options?.session ?? "local";
  const branch = kind === "mechanical" ? options?.facts?.branch : options?.branch ?? currentBranch(root);
  const name = fragmentName({ timestamp, branch, kind, sessionId: session });
  // S1's self-check: a name the aggregator could not parse back is never written.
  if (parseFragmentName(name) === null) {
    throw new JournalWriteError(
      `the computed fragment name ${JSON.stringify(name)} does not parse back to its identity — refusing to write a fragment the aggregator cannot read`,
    );
  }
  // The already-registered check (issue #468 S3): before writing, ask the
  // carrier whether this conversation already landed an entry — a fragment
  // whose name carries this session's slug. Scoped to an explicit `--session`:
  // the fallback slug (`local`) is shared by every unflagged write on the
  // machine, so a match there identifies no conversation and refusing it would
  // break the shipped multi-conversation default; an explicit `local` is
  // indistinguishable from the fallback and gets the same courtesy. The
  // computed name itself is excluded — an identical name is the grammar's own
  // collision refusal below (same entry slot), never an "already registered".
  if (options?.session !== undefined && slug(options.session) !== "local") {
    const registered = registeredSessions(root, carrier).find(
      (entry) => entry.parsed.sessionId === slug(options.session) && entry.name !== name,
    );
    if (registered !== undefined) {
      throw new JournalWriteError(
        `already registered: ${carrier}/${registered.name} already carries session ${JSON.stringify(slug(options.session))}'s entry — one entry per conversation; pass another --session id only if this is genuinely a different conversation`,
      );
    }
  }

  let content;
  if (kind === "narrative") {
    if (options?.content !== undefined && (options?.summary !== undefined || options?.decisions !== undefined || options?.next !== undefined)) {
      throw new JournalWriteError("give --content or the prose fields, never both — one entry, one body");
    }
    if (options?.content !== undefined) {
      content = options.content;
    } else if (String(options?.summary ?? "").trim() === "") {
      throw new JournalWriteError("a narrative write needs --summary (or --content <block|->): the prose is the only thing a model supplies");
    } else {
      const facts = readSessionFacts(root, resolveBase(root, options?.base));
      content = renderEntryBlock({
        timestamp: isoSecond(timestamp),
        branch,
        label: options?.title ?? "narrative",
        ...facts,
        summary: options?.summary,
        decisions: options?.decisions,
        next: options?.next,
      });
    }
  } else if (options?.facts === undefined || options?.facts === null || typeof options.facts !== "object") {
    throw new JournalWriteError("a mechanical write needs --facts <path|-> (a log-facts@1 payload)");
  }

  const receipt = writeFragment({
    root,
    dir: options?.journalDir,
    kind,
    content,
    facts: options?.facts,
    branch,
    sessionId: session,
    timestamp,
  });
  return { ...receipt, kind, branch, session };
}
