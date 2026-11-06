/**
 * markdown.mjs — the DEFAULT store driver (issue #374): the journal stays the
 * committed `docs/LOGS.md`, and the driver is where its authoring rules live.
 *
 * The composition with the fragment carrier (#405) is this driver's transport,
 * not a second driver (unit decision D6): when the carrier directory
 * `.agentic-workflow/journal/` exists the append writes a fragment — the
 * merge-to-main aggregator is the only writer of the journal there — and when
 * it does not, the append is the same one `O_APPEND` write feature 394 shipped,
 * byte for byte (AC4's golden).
 *
 * The three methods, and the decisions behind them:
 *
 *  - **append(entry)** — validate first (`normalizeEntry`), render through
 *    `renderEntryBlock` (the one block renderer), then move. A metadata-free
 *    mechanical entry goes to a mechanical fragment (whose bytes
 *    `writeFragment` pins to `renderEntry(facts)`, fix/405 AC6); a narrative
 *    or metadata-carrying entry goes to a narrative-kind fragment or the
 *    direct append. The journal file is never created: a missing journal is a
 *    refusal, the project creates it once (S9 of feature 394).
 *  - **query(predicate)** — parse the journal's entry blocks and filter them
 *    through the shared `matchesPredicate`. Blocks that predate the canonical
 *    grammar (the journal's 2026-09 legacy, `TXX:XXZ` stamps and free-form
 *    writer labels) are outside the structured stream — retroactive migration
 *    is the issue's declared non-goal — but a driver-written block whose
 *    `Metadata:` line does not parse is a refusal: that would be silent loss.
 *  - **render(range)** — the blocks for a date range, in file order, through
 *    the same renderer: the human journal is this driver's output, never its
 *    storage (AC8: no Git-tracked format change).
 *
 * All methods are synchronous: the mechanical writer (`publishAll`) runs
 * inside a session shutdown and must not await. The reference SQLite driver is
 * the contract's async half.
 */

import fs from "node:fs";
import path from "node:path";

import { JOURNAL_DIR, writeFragment } from "../fragment.mjs";
import { DEFAULT_LOG } from "../aggregate.mjs";
import { entryToFacts, normalizeEntry } from "../entry.mjs";
import { DriverError, matchesPredicate, metadataLine, normalizePredicate, renderEntryBlock } from "../driver.mjs";

/** The rendered block's heading: `<ts> — <branch> — auto (<reason>)` (mechanical). */
const MECHANICAL_HEADING = /^## (\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?Z) — (.+?) — auto \(([a-z][a-z0-9-]*)\)$/u;

/** The rendered block's heading: `<ts> — <branch> — <free writer label>` (narrative). */
const NARRATIVE_HEADING = /^## (\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?Z) — (.+?) — (.+)$/u;

/** `- **Metadata:** {json}` — the transport's consumer-field carrier (D7). */
const METADATA_LINE = /^- \*\*Metadata:\*\* (.+)$/u;

const SUMMARY_LINE = /^- \*\*Summary:\*\* (.+)$/u;
const COMMITS_LINE = /^- \*\*Commits:\*\* (\d+)(?: `([0-9a-f]{4,40}…[0-9a-f]{4,40})`| \(no marker\))?$/u;
const FILES_LINE = /^- \*\*Files:\*\* (.+)$/u;

/** A real UTC instant (the historical `TXX:XXZ` stamps are not). */
function instant(text) {
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function parseHeading(line) {
  const mechanical = MECHANICAL_HEADING.exec(line);
  if (mechanical !== null) {
    const [, timestamp, branch, reason] = mechanical;
    return { timestamp, branch, kind: "mechanical", reason, heading: line };
  }
  const narrative = NARRATIVE_HEADING.exec(line);
  if (narrative !== null) {
    const [, timestamp, branch] = narrative;
    return { timestamp, branch, kind: "narrative", heading: line };
  }
  return null;
}

/**
 * Parse the journal's canonical entry blocks. Legacy blocks whose heading or
 * timestamp predates the grammar answer `null` and are skipped — they are the
 * history the issue declares out of scope for migration. A canonical block
 * with an unparseable Metadata line throws: skipping it would be silent loss.
 */
export function parseJournalBlocks(text) {
  const entries = [];
  const lines = text.split("\n");
  let current = null;
  const flush = () => {
    if (current === null) return;
    const { heading, body, line } = current;
    current = null;
    const entry = blockToEntry(heading, body, line);
    if (entry !== null) entries.push(entry);
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      flush();
      const heading = parseHeading(line);
      if (heading !== null) current = { heading, body: [], line: i + 1 };
      continue;
    }
    if (current !== null) current.body.push(line);
  }
  flush();
  return entries;
}

function blockToEntry(heading, body, line) {
  if (instant(heading.timestamp) === null) return null; // pre-driver history
  let summary;
  let commits;
  let files;
  let metadata;
  for (const text of body) {
    let match;
    if ((match = SUMMARY_LINE.exec(text)) !== null) {
      summary = match[1];
    } else if ((match = COMMITS_LINE.exec(text)) !== null) {
      const count = Number(match[1]);
      const range = match[2] !== undefined ? match[2] : null;
      commits = { count, range };
    } else if ((match = FILES_LINE.exec(text)) !== null) {
      files = match[1] === "—" ? [] : match[1].split(" ");
    } else if ((match = METADATA_LINE.exec(text)) !== null) {
      try {
        metadata = JSON.parse(match[1]);
      } catch {
        throw new DriverError(`docs/LOGS.md:${line}: the Metadata line does not carry parseable JSON — refusing instead of losing the consumer fields`);
      }
    }
  }
  return {
    contract: "agentic-workflow/journal-entry",
    version: 1,
    timestamp: heading.timestamp,
    branch: heading.branch,
    kind: heading.kind,
    ...(heading.kind === "mechanical" ? { reason: heading.reason } : {}),
    ...(summary !== undefined ? { summary } : {}),
    ...(commits !== undefined ? { commits } : {}),
    ...(files !== undefined ? { files } : {}),
    ...(metadata !== undefined ? { metadata } : {}),
  };
}

function carrierDir(options) {
  if (options?.fragmentDir === null) return null; // fragment routing explicitly disabled
  const base = options?.fragmentDir ?? JOURNAL_DIR;
  return path.isAbsolute(base) ? base : path.join(options?.root ?? "", base);
}

function carrierPresent(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

/**
 * The default Markdown store driver. Options: `root` (project root,
 * required), `journalPath` (relative; the documented default
 * `docs/LOGS.md`), `fragmentDir` (the carrier directory, absolute or
 * relative-to-root; defaults to `<root>/.agentic-workflow/journal`),
 * `sessionId` (the fragment name's session slug; a string or a function),
 * `now` (the fragment name's clock, for tests).
 */
export function createMarkdownDriver(options) {
  const root = options?.root;
  if (typeof root !== "string" || root === "") throw new DriverError("createMarkdownDriver: root is required");
  const journalPathArg = options?.journalPath ?? DEFAULT_LOG;
  const journalPath = path.isAbsolute(journalPathArg) ? journalPathArg : path.join(root, journalPathArg);
  const fragmentDir = carrierDir({ root, fragmentDir: options?.fragmentDir });
  const sessionId = typeof options?.sessionId === "function" ? options.sessionId : () => options?.sessionId ?? "local";
  const now = options?.now ?? (() => Date.now());

  return {
    name: "markdown",
    append(entry) {
      const checked = normalizeEntry(entry);
      if (!checked.ok) return { ok: false, error: checked.errors.join("; ") };
      const block = checked.entry;
      const rendered = renderEntryBlock(block);

      if (carrierPresent(fragmentDir)) {
        const mechanicalFragment = block.kind === "mechanical" && metadataLine(block) === null;
        const fragmentRoot = path.dirname(fragmentDir);
        const fragmentBase = path.basename(fragmentDir);
        try {
          const fragment = mechanicalFragment
            ? writeFragment({ root: fragmentRoot, dir: fragmentBase, facts: entryToFacts(block), kind: "mechanical", sessionId: sessionId(), now })
            : writeFragment({ root: fragmentRoot, dir: fragmentBase, content: rendered, branch: block.branch, kind: "narrative", sessionId: sessionId(), now });
          return { ok: true, target: "fragment", name: fragment.name, bytes: fragment.bytes };
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : String(error) };
        }
      }

      let present = true;
      try {
        fs.accessSync(journalPath, fs.constants.W_OK);
      } catch {
        present = false;
      }
      if (!present) return { ok: false, error: `no journal at ${options?.journalPath ?? DEFAULT_LOG} — the driver never creates one` };
      fs.appendFileSync(journalPath, `\n${rendered}`);
      return { ok: true, target: "journal", bytes: Buffer.byteLength(rendered, "utf8") };
    },

    query(predicate) {
      const normalized = normalizePredicate(predicate);
      if (!normalized.ok) return { ok: false, error: normalized.error };
      let text;
      try {
        text = fs.readFileSync(journalPath, "utf8");
      } catch {
        return { ok: false, error: `no journal at ${options?.journalPath ?? DEFAULT_LOG} — the driver never creates one` };
      }
      const entries = parseJournalBlocks(text).filter((entry) => matchesPredicate(entry, normalized.predicate));
      return { ok: true, entries };
    },

    render(range) {
      const normalized = normalizePredicate({ dateRange: range ?? {} });
      if (!normalized.ok) return { ok: false, error: normalized.error };
      let text;
      try {
        text = fs.readFileSync(journalPath, "utf8");
      } catch {
        return { ok: false, error: `no journal at ${options?.journalPath ?? DEFAULT_LOG} — the driver never creates one` };
      }
      const rendered = parseJournalBlocks(text)
        .filter((entry) => matchesPredicate(entry, normalized.predicate))
        .map((entry) => renderEntryBlock(entry))
        .join("\n");
      return { ok: true, rendered };
    },
  };
}
