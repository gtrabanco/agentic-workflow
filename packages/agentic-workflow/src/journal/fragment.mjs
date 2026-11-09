/**
 * fragment.mjs — the ONE owner of the journal fragment's name and bytes
 * (issue #405, S9/S10; the grammar is published as `journal-fragment-grammar@1`
 * in this package's README).
 *
 * A fragment is one journal entry in its own file under
 * `.agentic-workflow/journal/`, committed in the PR like any other change. The
 * merge-to-main aggregator (`aggregate.mjs`) is the only surface that turns
 * fragments back into `docs/LOGS.md` entries, which is what makes branch-vs-
 * branch conflicts on the journal structurally impossible: two sessions on two
 * branches write two *files*, never two appends to one file.
 *
 * Three rules, each a test in `test/journal.test.mjs`:
 *
 *  - **The name is the identity.** `<UTC-second>-<branch-slug>-<kind>-<session-slug>.md`,
 *    parsed back by `parseFragmentName`, never free text. Two sessions on the
 *    same branch differ in their session slug, so their names cannot collide;
 *    a name whose target already exists is refused, never overwritten (S10).
 *  - **The fragment is the entry.** A mechanical fragment's bytes are exactly
 *    `renderEntry(facts)` — feature 394's renderer stays the one owner of the
 *    mechanical entry's bytes — and a narrative fragment is one `## `-headed
 *    entry block, newline-terminated, never CR.
 *  - **The carrier's presence is the opt-in.** Nothing here flips a writer to
 *    fragments on its own: the caller checks the carrier directory first
 *    (`createJournalPublisher` in `../log/publish.mjs` owns that routing).
 */

import fs from "node:fs";
import path from "node:path";

import { renderEntry } from "../log/render.mjs";

/** The fragment root, relative to the project root — the owner decision of 2026-11-05. */
export const JOURNAL_DIR = ".agentic-workflow/journal";

/** The closed kind set. A fragment of another kind does not exist. */
export const FRAGMENT_KINDS = Object.freeze(["mechanical", "narrative"]);

/** A refused fragment write. Named so a caller can tell a refusal from a bug. */
export class FragmentError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "FragmentError";
  }
}

/** A branch or session slug: ≤64 chars of `[A-Za-z0-9._-]`, never empty. */
const SLUG_MAX = 64;

/**
 * The filename sanitizer. Runs of characters outside `[A-Za-z0-9._-]` become
 * one `-`, leading/trailing `-` are trimmed, the result is capped and an empty
 * slug falls back to `x` — deterministic in both directions with
 * `parseFragmentName`, which re-slugifies nothing (the name stores slugs).
 */
export function slug(input) {
  const cleaned = String(input ?? "")
    .replace(/[^A-Za-z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, SLUG_MAX)
    .replace(/^-+|-+$/gu, "");
  return cleaned === "" ? "x" : cleaned;
}

/** `Date | number | string` → `YYYYMMDDTHHMMSSZ` (UTC, second precision). */
function utcSecond(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) throw new FragmentError(`timestamp is not a date, got ${JSON.stringify(timestamp)}`);
  return date.toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
}

/** A real `YYYYMMDDTHHMMSSZ` second, or null — the aggregator re-checks this. */
function parseUtcSecond(text) {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/u.exec(text);
  if (match === null) return null;
  const [, y, m, d, h, min, s] = match;
  const date = new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +s));
  if (
    date.getUTCFullYear() !== +y ||
    date.getUTCMonth() !== +m - 1 ||
    date.getUTCDate() !== +d ||
    date.getUTCHours() !== +h ||
    date.getUTCMinutes() !== +min ||
    date.getUTCSeconds() !== +s
  ) {
    return null;
  }
  return date.getTime();
}

/**
 * The fragment's name from its identity: write-time second, branch slug, kind,
 * session slug. Deterministic from git facts so two sessions cannot collide
 * (S10) — and the caller supplies the session id, because the frozen
 * `log-facts@1` payload does not carry one and stays frozen.
 */
export function fragmentName({ timestamp, branch, kind, sessionId }) {
  if (!FRAGMENT_KINDS.includes(kind)) {
    throw new FragmentError(`kind must be one of ${FRAGMENT_KINDS.join(", ")}, got ${JSON.stringify(kind)}`);
  }
  const second = utcSecond(timestamp);
  const branchSlug = slug(branch);
  const sessionSlug = slug(sessionId);
  return `${second}-${branchSlug}-${kind}-${sessionSlug}.md`;
}

/**
 * The identity back out of a name, or null when the name is not a fragment —
 * the aggregator refuses names it cannot parse instead of guessing.
 */
export function parseFragmentName(name) {
  const match = /^(\d{8}T\d{6}Z)-([A-Za-z0-9._-]{1,64})-(mechanical|narrative)-([A-Za-z0-9._-]{1,64})\.md$/u.exec(String(name ?? ""));
  if (match === null) return null;
  const [, second, branch, kind, sessionId] = match;
  if (parseUtcSecond(second) === null) return null;
  return { timestamp: second, branch, kind, sessionId };
}

/**
 * One entry block: newline-terminated, CR-free, `## `-headed — the shape both
 * the mechanical renderer and the narrative writers already produce. The
 * predicate is shared with the read side (`fragmentFault`) so the carrier's
 * lint and the writer can never disagree about what a conforming block is.
 *
 * Returns the closed fault code, or `null` for a conforming block. Exported
 * for the push-level write-path gate (`scripts/log-immutability.mjs`), which
 * judges blocks already appended to the journal — the same shape predicate,
 * never a second copy of the grammar.
 */
export function contentFault(content) {
  if (typeof content !== "string" || content === "") return "empty";
  if (content.includes("\r")) return "cr";
  if (!content.endsWith("\n")) return "newline";
  if (!content.startsWith("## ")) return "heading";
  return null;
}

/** The write-side wording of one content fault. */
function checkedContent(content) {
  switch (contentFault(content)) {
    case "empty":
      throw new FragmentError(`fragment content must be a non-empty string, got ${JSON.stringify(content)}`);
    case "cr":
      throw new FragmentError("fragment content must not contain CR");
    case "newline":
      throw new FragmentError("fragment content must be newline-terminated");
    case "heading":
      throw new FragmentError("fragment content must be one entry block starting with '## '");
    default:
      return content;
  }
}

/** The read-side wording of one content fault, carrying the fragment's name. */
function contentFaultReason(name, fault) {
  if (fault === "cr") return `fragment "${name}" contains CR`;
  if (fault === "heading") return `fragment "${name}" does not start with an entry heading`;
  return `fragment "${name}" is not a newline-terminated entry block`;
}

/** The entry block's identity line: `## <timestamp> — <branch> — <label>`. The
 *  name and the bytes must agree on the branch, or the fragment is refused:
 *  a name that parses but describes another entry is the 440 incident (a
 *  committed fragment whose filename contradicted its own header). */
const ENTRY_HEADING = /^## .+? — (.+?) — .+$/u;

/**
 * Refuse a fragment whose name and bytes describe different entries.
 *
 * The name is the fragment's identity and the aggregator trusts it, so the one
 * place that can stop a contradiction is the write: the produced name must
 * round-trip through `parseFragmentName`, and a narrative block's heading must
 * name the same branch the name records. A refusal is never a partial write.
 */
function checkedIdentity(content, identity) {
  if (identity === null) {
    throw new FragmentError("the fragment name does not parse back to its identity — refusing to write a fragment the aggregator cannot read");
  }
  const headingLine = content.slice(0, content.indexOf("\n"));
  const heading = ENTRY_HEADING.exec(headingLine);
  if (heading === null) {
    throw new FragmentError(
      `fragment heading must be '## <timestamp> — <branch> — <label>', got ${JSON.stringify(headingLine)}`,
    );
  }
  if (slug(heading[1]) !== identity.branch) {
    throw new FragmentError(
      `fragment name records branch ${JSON.stringify(identity.branch)} but its heading names ${JSON.stringify(heading[1])} — a fragment's name and bytes must agree`,
    );
  }
}

/**
 * Validate one fragment's identity and bytes — the ONE predicate
 * `journal aggregate --check`, `session-close close` and the write CLI share
 * (issue #452, S2/S3/S5). Returns `{ ok: true, parsed }` or
 * `{ ok: false, reason }` in the read side's wording; it never repairs.
 *
 * `identity: false` keeps the aggregator's documented contract: it validates
 * the name's grammar and the body's shape and then trusts the name (S6 forbids
 * moving that contract). The heading/name contradiction is caught one step
 * earlier — at the write, at the carrier lint and at the close — where it can
 * still be repaired by the session that made it.
 */
export function fragmentFault(name, content, options = {}) {
  const parsed = parseFragmentName(name);
  if (parsed === null) return { ok: false, reason: `unparseable fragment name "${name}" — a fragment's name is its identity` };
  const fault = contentFault(content);
  if (fault !== null) return { ok: false, reason: contentFaultReason(name, fault) };
  if (options.identity === false) return { ok: true, parsed };
  try {
    checkedIdentity(content, parsed);
  } catch (error) {
    // The predicate's wording names the contradiction; a lint line must also
    // name the file it belongs to, so a multi-fault carrier stays actionable.
    if (error instanceof FragmentError) return { ok: false, reason: `fragment "${name}": ${error.message}` };
    throw error;
  }
  return { ok: true, parsed };
}

/** `fragmentFault` as a thrower: a caller that must refuse uses one call, not a branch. */
export function assertFragment(name, content) {
  const fault = fragmentFault(name, content);
  if (!fault.ok) throw new FragmentError(fault.reason);
  return fault.parsed;
}

/**
 * Write one fragment. Returns `{ ok: true, name, path, bytes }`, or throws
 * `FragmentError` — a refusal is never a partial write.
 *
 *  - `kind: "mechanical"` requires `facts` (`log-facts@1`); the bytes are
 *    `renderEntry(facts)` and nothing else.
 *  - `kind: "narrative"` requires `content` (the entry block the writer
 *    rendered) plus the `branch` the name records; the block's own heading must
 *    name that same branch.
 *  - `timestamp` defaults to `options.now()` (write-time clock, second
 *    precision); passing it pins the name in tests.
 *  - A target that already exists is refused, never overwritten (S10).
 */
export function writeFragment(options) {
  const root = options?.root;
  if (typeof root !== "string" || root === "") throw new FragmentError("writeFragment: root is required");
  const kind = options?.kind;
  if (!FRAGMENT_KINDS.includes(kind)) {
    throw new FragmentError(`writeFragment: kind must be one of ${FRAGMENT_KINDS.join(", ")}, got ${JSON.stringify(kind)}`);
  }
  const content =
    kind === "mechanical" ? renderEntry(options?.facts) : checkedContent(options?.content);
  const now = options?.now ?? (() => Date.now());
  const timestamp = options?.timestamp ?? now();
  const name = fragmentName({
    timestamp,
    branch: kind === "mechanical" ? options?.facts?.branch : options?.branch,
    kind,
    sessionId: options?.sessionId,
  });
  const dir = path.join(root, options?.dir ?? JOURNAL_DIR);
  const identity = kind === "narrative" ? parseFragmentName(name) : null;
  if (kind === "narrative") checkedIdentity(content, identity);
  const target = path.join(dir, name);
  // Exclusive create is the collision rule itself: a check-then-write lets a
  // racing second writer pass the check and overwrite the first entry. `wx`
  // makes the filesystem the arbiter and leaves the loser's refusal explicit.
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(target, content, { flag: "wx" });
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new FragmentError(`fragment ${name} already exists — a collision is refused, never overwritten`);
    }
    throw error;
  }
  return { ok: true, name, path: target, bytes: Buffer.byteLength(content, "utf8") };
}

/** The identity back out of a fragment's bytes and name, in one call. */
export function readFragment(dir, name) {
  const parsed = parseFragmentName(name);
  if (parsed === null) return null;
  let content;
  try {
    content = fs.readFileSync(path.join(dir, name), "utf8");
  } catch {
    return null;
  }
  return { ...parsed, content };
}
