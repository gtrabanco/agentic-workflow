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

import {
  FRAGMENT_KINDS,
  FragmentError,
  fragmentName,
  parseFragmentName,
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
