/**
 * headless.mjs — the headless run's journal writer (issue #471).
 *
 * A CI-driven session — an agent action landing a PR, a scheduled driver, a
 * compiled workflow — has no operator, so `log-session` never runs and the
 * journal stays silent. This module turns that run's **declaration** into one
 * conforming fragment through the owners that already exist. It knows no host:
 * the run's identifiers arrive as flags, so a self-hosted CI passes its own.
 *
 *  - the name from `fragmentName` (`src/journal/fragment.mjs`), with the run's
 *    identity in the session slot (`gha-<run id>`);
 *  - the bytes from `renderEntryBlock` (`src/journal/block.mjs`), never a second
 *    renderer;
 *  - the write from `writeJournal` (`src/journal/write.mjs`), never a second
 *    writer, so the carrier check, the name self-check and the collision rule
 *    stay the writer's.
 *
 * Three rules, each a case in `test/journal.headless.test.mjs`:
 *
 *  - **Provenance rides the grammar's fields, and no field is added.** The run's
 *    workflow, run id and actor land in the heading label (the block owner's
 *    own free-text cell) and the run id is the session slug, which is what makes
 *    a CI entry distinguishable from an operator's.
 *  - **One entry per run.** A re-run of the same workflow run carries the same
 *    run id, so the second invocation answers `already-present` with the
 *    existing fragment instead of duplicating the entry or failing the job —
 *    and once the aggregator consumed that fragment, with the journal entry
 *    that carries the run, still writing nothing (D6; the read-only lookup
 *    below never moves the journal's bytes — the aggregator stays its only
 *    writer).
 *  - **The opt-in is still the carrier.** An absent carrier is a refusal, and a
 *    refusal creates nothing — not the directory, not a journal.
 */

import fs from "node:fs";
import path from "node:path";

import { JOURNAL_DIR, fragmentName, parseFragmentName } from "./fragment.mjs";
import { currentBranch, isoSecond, readSessionFacts, renderEntryBlock, resolveBase } from "./block.mjs";
import { DEFAULT_LOG } from "./aggregate.mjs";
import { writeJournal } from "./write.mjs";

/** A refused headless write. The CLI maps this to exit 2, "JOURNAL REFUSAL —". */
export class JournalHeadlessError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "JournalHeadlessError";
  }
}

/** The identity prefix a headless run's session slug carries. */
export const HEADLESS_SESSION_PREFIX = "gha-";

/** A run id has to survive the fragment name's alphabet unchanged (1–60 chars). */
const RUN_ID = /^[A-Za-z0-9._-]{1,60}$/u;

/** An issue reference: `471` or `#471`. */
const ISSUE = /^#?(\d{1,9})$/u;

/** The flags the operation accepts. A name flag is deliberately absent. */
const VALUE_FLAGS = new Set([
  "workflow",
  "run-id",
  "actor",
  "issue",
  "summary",
  "decisions",
  "next",
  "files",
  "block",
  "base",
  "timestamp",
  "journal-dir",
  "dir",
]);

/**
 * Parse the operation's flags. Closed world: an unknown flag is a refusal, and
 * the refusal names it — `--name` included, because a caller that tries to hand
 * a filename has to learn that it cannot.
 */
export function parseHeadlessArgs(argv) {
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
        throw new JournalHeadlessError(`unknown flag --${name} — journal headless takes the run's declaration, never a filename`);
      }
      const value = eq === -1 ? argv[++i] : token.slice(eq + 1);
      if (value === undefined) throw new JournalHeadlessError(`--${name} needs a value`);
      flags[name] = value;
      continue;
    }
    flags.args.push(token);
  }
  return flags;
}

/**
 * One line of prose from a declaration cell. The block grammar is one line per
 * cell, so a cell's own line breaks collapse to a space — deterministic, and
 * never a second block line the aggregator would read as a new entry.
 */
function flatten(value, max) {
  return String(value ?? "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, max);
}

/** One provenance cell, or a refusal naming both spellings a caller can see. */
function requiredCell(value, { key, flag, max }) {
  const flat = flatten(value, max);
  if (flat === "") {
    throw new JournalHeadlessError(`headless provenance is incomplete: ${key} is required (--${flag})`);
  }
  return flat;
}

/**
 * The run's identity inside the fragment grammar: the session slug and the
 * entry's label. Pure — no clock, no git, no filesystem — so a caller can read
 * the identity before anything is written, and a test can pin it.
 *
 * `context` is the run (workflow, run id, actor); `declaration` contributes the
 * issue it worked on, when the caller declares one.
 */
export function headlessIdentity({ declaration = {}, context = {} } = {}) {
  const workflow = requiredCell(context.workflow, {
    key: "workflow",
    flag: "workflow",
    max: 120,
  });
  const runId = requiredCell(context.runId, {
    key: "runId",
    flag: "run-id",
    max: 60,
  });
  if (!RUN_ID.test(runId)) {
    throw new JournalHeadlessError(
      `run id ${JSON.stringify(runId)} is not a fragment identity — a run id is 1-60 characters of [A-Za-z0-9._-]`,
    );
  }
  const actor = requiredCell(context.actor, {
    key: "actor",
    flag: "actor",
    max: 80,
  });

  let issue;
  if (declaration.issue !== undefined && declaration.issue !== null && String(declaration.issue).trim() !== "") {
    const match = ISSUE.exec(String(declaration.issue).trim());
    if (match === null) {
      throw new JournalHeadlessError(
        `issue ${JSON.stringify(declaration.issue)} is not an issue reference — pass the number, with or without a leading "#"`,
      );
    }
    issue = match[1];
  }

  const label = flatten(
    `headless ${workflow} run ${runId} by ${actor}${issue === undefined ? "" : ` for #${issue}`}`,
    200,
  );
  return {
    session: `${HEADLESS_SESSION_PREFIX}${runId}`,
    label,
    workflow,
    runId,
    actor,
    issue,
  };
}

/** The carrier's fragment for one session and kind, when this run already wrote one. */
function findRunFragment(dir, session) {
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch {
    return null;
  }
  for (const name of names.sort()) {
    const parsed = parseFragmentName(name);
    if (parsed !== null && parsed.kind === "narrative" && parsed.sessionId === session) {
      return { name, parsed };
    }
  }
  return null;
}

/**
 * The run's entry in the journal itself, when its fragment was already
 * aggregated away: the heading's label carries the run's identity (`headless
 * <workflow> run <run-id> by <actor> …`) and the heading's stamp, branch and
 * the run's session slug reconstruct the original name through the one name
 * owner — so a re-run after aggregation reports where the entry lives now
 * instead of writing a second one (issue #471, D6; the EXTERNAL VERIFY B1
 * reproducer).
 *
 * Read-only by contract: this lookup never writes the journal — the
 * aggregation step stays its only writer (#405 AC1, #468). A heading that
 * cannot be decided (no stamp, an unparsable name) is skipped, never guessed;
 * no journal yet means nothing this run can already have written.
 *
 * Returns `{ name, path, branch, bytes }` or null.
 */
function findConsumedEntry(root, identity) {
  const logPath = path.join(root, DEFAULT_LOG);
  let text;
  try {
    text = fs.readFileSync(logPath, "utf8");
  } catch {
    return null;
  }
  const needle = ` run ${identity.runId} by `;
  for (const line of text.split("\n")) {
    if (!line.startsWith("## ")) continue;
    const parts = line.slice(3).split(" — ");
    if (parts.length < 3) continue;
    const label = parts.slice(2).join(" — ");
    if (!label.startsWith("headless ") || !label.includes(needle)) continue;
    const stamp = Date.parse(parts[0]);
    if (!Number.isFinite(stamp)) continue;
    const name = fragmentName({
      timestamp: stamp,
      branch: parts[1],
      kind: "narrative",
      sessionId: identity.session,
    });
    if (parseFragmentName(name) === null) continue;
    return { name, path: logPath, branch: parts[1], bytes: Buffer.byteLength(text, "utf8") };
  }
  return null;
}

/**
 * Write one fragment for a headless run.
 *
 * `declaration` is what the run did: `issue`, `summary`, `decisions`, `next`,
 * `files` — or `block`, a rendered entry block the caller supplies instead of
 * the prose fields. `context` is the provenance: `workflow`, `runId`, `actor`.
 *
 * Returns `{ ok, status, kind, name, path, bytes, branch, session, label }`
 * where `status` is `written` or `already-present`; every failure is a
 * `JournalHeadlessError`, `FragmentError` or `JournalWriteError`, never a
 * partial write.
 */
export function writeHeadlessJournal(options) {
  const root = options?.root;
  if (typeof root !== "string" || root === "") throw new JournalHeadlessError("writeHeadlessJournal: root is required");
  const carrier = options?.journalDir ?? JOURNAL_DIR;
  if (!fs.existsSync(path.join(root, carrier))) {
    throw new JournalHeadlessError(
      `the fragment carrier ${carrier} does not exist — its presence is the opt-in (issue #405), so a headless run never opts a project in; install it deliberately and re-run`,
    );
  }

  const declaration = options?.declaration ?? {};
  const identity = headlessIdentity({ declaration, context: options?.context });

  // One entry per headless run: a re-run of the same workflow run must not
  // duplicate the entry, and must not fail the job either.
  const existing = findRunFragment(path.join(root, carrier), identity.session);
  if (existing !== null) {
    const file = path.join(root, carrier, existing.name);
    return {
      ok: true,
      status: "already-present",
      kind: "narrative",
      name: existing.name,
      path: file,
      bytes: Buffer.byteLength(fs.readFileSync(file, "utf8"), "utf8"),
      branch: existing.parsed.branch,
      session: identity.session,
      label: identity.label,
    };
  }

  // The same promise across the whole lifecycle: once the aggregator consumed
  // the fragment, the run's entry lives in the journal — the re-run reports it
  // there (read-only) instead of writing a second fragment the next
  // aggregation would append as a duplicate entry.
  const consumed = findConsumedEntry(root, identity);
  if (consumed !== null) {
    return {
      ok: true,
      status: "already-present",
      kind: "narrative",
      name: consumed.name,
      path: consumed.path,
      bytes: consumed.bytes,
      branch: consumed.branch,
      session: identity.session,
      label: identity.label,
    };
  }

  let timestamp;
  try {
    timestamp = options?.timestamp ?? Date.now();
    isoSecond(timestamp);
  } catch (error) {
    throw new JournalHeadlessError(error.message);
  }

  const hasProse = ["summary", "decisions", "next"].some(
    (cell) => declaration[cell] !== undefined && String(declaration[cell]).trim() !== "",
  );
  let content;
  if (declaration.block !== undefined) {
    if (hasProse) {
      throw new JournalHeadlessError("give --block or the prose fields, never both — one entry, one body");
    }
    if (typeof declaration.block !== "string" || declaration.block.trim() === "") {
      throw new JournalHeadlessError("--block must carry one rendered entry block, got an empty body");
    }
    content = declaration.block;
  } else {
    if (!hasProse) {
      throw new JournalHeadlessError(
        "a headless narrative needs --summary (or --block <path|->): the prose is the only thing a caller supplies",
      );
    }
    const branch = currentBranch(root);
    const facts = readSessionFacts(root, resolveBase(root, options?.base));
    content = renderEntryBlock({
      timestamp: isoSecond(timestamp),
      branch,
      label: identity.label,
      commits: facts.commits,
      files: declaration.files === undefined ? facts.files : flatten(declaration.files, 1024),
      summary: flatten(declaration.summary, 4000),
      decisions: flatten(declaration.decisions, 4000),
      next: flatten(declaration.next, 4000),
    });
  }

  const receipt = writeJournal({
    root,
    journalDir: options?.journalDir,
    kind: "narrative",
    content,
    branch: currentBranch(root),
    session: identity.session,
    timestamp,
  });
  return {
    ...receipt,
    status: "written",
    kind: "narrative",
    branch: receipt.branch,
    session: identity.session,
    label: identity.label,
  };
}
