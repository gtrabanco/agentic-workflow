/**
 * driver.mjs — the store-driver contract (issue #374, `journal-driver-contract@1`
 * in this package's README).
 *
 * A store driver owns where a canonical journal entry (`journal-entry@1`,
 * `src/journal/entry.mjs`) lives. The contract is three methods:
 *
 *   - `append(entry)`  — insert-only: the entry is stored, never updated;
 *                        a correction is a NEW correcting entry (owner decision D3).
 *   - `query(predicate)` — the one predicate grammar, `normalizePredicate`
 *                        below: `{ dateRange: {from?, to?}, branch?, keyword? }`.
 *   - `render(range)`  — the human journal blocks for a date range, the render
 *                        target a Markdown reader consumes.
 *
 * Every method answers `{ ok: true, … }` or `{ ok: false, error }` — a refusal
 * is a value, never a thrown error the caller has to catch (predictable
 * failure), and may be a promise (the reference SQLite driver is async; a
 * caller must await). Refusals happen BEFORE the first byte moves.
 *
 * The four guarantees a driver must hold (AC7's authoring doc states them):
 *
 *  1. **Insert-only.** An append never mutates, rewrites or deletes what is
 *     already stored; read-back of an earlier entry is byte-stable.
 *  2. **Arrival-order monotonic.** Entries read back in append order; ids (or
 *     file offsets) never go backwards. Entry *timestamps* are NOT required
 *     monotonic — the journal itself is not strictly chronological (fix/405's
 *     known pre-existing issue).
 *  3. **No silent loss.** Every field of a validated entry — including every
 *     unknown `metadata` key — survives a round trip. A driver that strips a
 *     key or drops a row is caught by `runDriverConformance` (the AC7 fixture).
 *  4. **Predictable failure.** An invalid entry, an unusable store or an
 *     ambiguous state is a refusal answered before anything mutates.
 *
 * `renderEntryBlock` is the one renderer of a canonical entry's Markdown
 * block: a mechanical entry renders through `renderEntry` (the byte owner,
 * feature 394) — byte-identical to the pre-driver behaviour (AC4) — and a
 * metadata-carrying entry appends ONE trailing `- **Metadata:** <json>` line
 * (sorted keys, deterministic; the line's grammar is owned by
 * `journal-driver-contract@1`). A metadata-free entry produces no line, so the
 * default path stays byte-identical (AC8). Both shipped drivers render through
 * this one function; a driver must never hand-roll its own block grammar.
 *
 * `runDriverConformance(factory, { root })` is the single shared conformance
 * suite both shipped drivers pass (AC2) and a violating driver fails (AC7):
 * append + read-back, metadata round-trip, predicate answers, insert-only,
 * render determinism, refusals before mutation.
 */

import { renderEntry } from "../log/render.mjs";
import { entryToFacts, normalizeEntry } from "./entry.mjs";

/** The shipped driver kinds. */
export const DRIVER_KINDS = Object.freeze(["markdown", "sqlite"]);

/** A refused driver operation. Named so a caller can tell a refusal from a bug. */
export class DriverError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "DriverError";
  }
}

/** The predicate's closed key set. Adding one is a contract change, by design. */
const PREDICATE_KEYS = Object.freeze(["dateRange", "branch", "keyword"]);

/** The same timestamp rule the canonical entry carries. */
const TIMESTAMP = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?Z$/u;

function validInstant(text) {
  if (typeof text !== "string" || !TIMESTAMP.test(text)) return false;
  const date = new Date(text);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, text.length - 1) === text.slice(0, -1);
}

/**
 * The ONE expression of the query predicate grammar (AC6): a closed key set,
 * a shape-checked `dateRange`, non-empty single-line `branch`/`keyword`.
 * Returns `{ ok: true, predicate }` with only the known keys, or
 * `{ ok: false, error }`. Drivers must normalize through here, never re-parse
 * their own predicate shape.
 */
export function normalizePredicate(input) {
  if (input === undefined || input === null) return { ok: true, predicate: {} };
  if (typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: `the predicate must be an object, got ${input === null ? "null" : Array.isArray(input) ? "an array" : typeof input}` };
  }
  const predicate = {};
  for (const [key, value] of Object.entries(input)) {
    if (!PREDICATE_KEYS.includes(key)) {
      return { ok: false, error: `unknown predicate key "${key}" (allowed: ${PREDICATE_KEYS.join(", ")})` };
    }
    if (key === "dateRange") {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { ok: false, error: `dateRange must be an object with from/to, got ${JSON.stringify(value)}` };
      }
      const { from, to, ...rangeUnknown } = value;
      for (const rangeKey of Object.keys(rangeUnknown)) {
        return { ok: false, error: `unknown dateRange key "${rangeKey}" (allowed: from, to)` };
      }
      const range = {};
      if (from !== undefined) {
        if (!validInstant(from)) return { ok: false, error: `dateRange.from must be a UTC timestamp the entry grammar carries, got ${JSON.stringify(from)}` };
        range.from = from;
      }
      if (to !== undefined) {
        if (!validInstant(to)) return { ok: false, error: `dateRange.to must be a UTC timestamp the entry grammar carries, got ${JSON.stringify(to)}` };
        range.to = to;
      }
      predicate.dateRange = range;
    } else if (typeof value !== "string" || value.trim() === "" || /[\r\n]/u.test(value)) {
      return { ok: false, error: `${key} must be a non-empty single-line string, got ${JSON.stringify(value)}` };
    } else {
      predicate[key] = value;
    }
  }
  return { ok: true, predicate };
}

/** A deterministic, key-sorted JSON text — the Metadata line's payload form, and the harness's stable comparison form. */
export function sortedJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(sortedJson).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${sortedJson(value[key])}`).join(",")}}`;
}

/**
 * The metadata line, only when the entry carries metadata — the Markdown
 * transport's consumer-field carrier (D7). Its grammar is owned by
 * `journal-driver-contract@1`.
 */
export function metadataLine(entry) {
  if (entry.metadata === undefined || Object.keys(entry.metadata).length === 0) return null;
  return `- **Metadata:** ${sortedJson(entry.metadata)}`;
}

/**
 * The ONE renderer of a canonical entry's Markdown block (see the module doc).
 * Both drivers and both transports (direct append and fragment) go through
 * this; a metadata-free mechanical entry is byte-identical to `renderEntry`.
 */
export function renderEntryBlock(entry) {
  const checked = normalizeEntry(entry);
  if (!checked.ok) throw new DriverError(checked.errors.join("; "));
  const block = checked.entry;
  const lines =
    block.kind === "mechanical"
      ? [renderEntry(entryToFacts(block)).slice(0, -1)]
      : [
          `## ${block.timestamp} — ${block.branch} — manual`,
          `- **Summary:** ${block.summary}`,
          ...(block.commits !== undefined ? [`- **Commits:** ${block.commits.count}${block.commits.range === null || block.commits.range === undefined ? " (no marker)" : ` \`${block.commits.range}\``}`] : []),
          ...(block.files !== undefined && block.files.length > 0 ? [`- **Files:** ${block.files.join(" ")}`] : []),
        ];
  const meta = metadataLine(block);
  if (meta !== null) lines.push(meta);
  return `${lines.join("\n")}\n`;
}

/** Instant ms of a canonical timestamp, for date-range comparison. */
function instantMs(text) {
  return new Date(text).getTime();
}

/**
 * The ONE predicate matcher (AC6): both drivers filter their entries through
 * this, so the answers cannot diverge. `keyword` is a case-insensitive
 * substring match over the entry's rendered block — the same text a reader
 * sees, never a second search grammar.
 */
export function matchesPredicate(entry, predicate) {
  if (predicate.dateRange !== undefined) {
    const t = instantMs(entry.timestamp);
    if (predicate.dateRange.from !== undefined && t < instantMs(predicate.dateRange.from)) return false;
    if (predicate.dateRange.to !== undefined && t > instantMs(predicate.dateRange.to)) return false;
  }
  if (predicate.branch !== undefined && entry.branch !== predicate.branch) return false;
  if (predicate.keyword !== undefined) {
    const haystack = renderEntryBlock(entry).toLowerCase();
    if (!haystack.includes(predicate.keyword.toLowerCase())) return false;
  }
  return true;
}

/** The conformance checks' shared driver-creation wrapper. */
async function callDriver(value) {
  return value instanceof Promise ? await value : value;
}

/**
 * The shared conformance suite (AC2/AC7): every shipped driver must pass it,
 * and a driver that violates a guarantee must fail it. `factory(root)` builds
 * a fresh driver over `root`. Returns `{ ok, violations }` — violation
 * strings, each naming the guarantee broken. Async: a driver's methods may
 * return promises and the harness awaits everything.
 */
export async function runDriverConformance(factory, options) {
  const root = options?.root;
  if (typeof root !== "string" || root === "") throw new DriverError("runDriverConformance: root is required");
  const violations = [];

  const driver = await callDriver(factory(root));
  if (typeof driver?.append !== "function" || typeof driver?.query !== "function" || typeof driver?.render !== "function") {
    return { ok: false, violations: ["the driver must implement append(entry), query(predicate) and render(range)"] };
  }

  const mechanical = {
    contract: "agentic-workflow/journal-entry",
    version: 1,
    timestamp: "2026-11-07T10:00Z",
    branch: "feat/conformance",
    kind: "mechanical",
    reason: "clear",
    commits: { count: 1, range: "aaaaaaaa…bbbbbbbb" },
    files: ["src/journal/driver.mjs"],
  };
  const narrative = {
    contract: "agentic-workflow/journal-entry",
    version: 1,
    timestamp: "2026-11-07T11:00:26Z",
    branch: "main",
    kind: "narrative",
    summary: "Consumer metadata round-trips through this driver.",
    metadata: { dev_id: "d1", commit_hash: "abc1234", nested: { deep: [1, 2] } },
  };

  // 1. Valid appends are accepted.
  const first = await callDriver(driver.append(mechanical));
  if (!first?.ok) violations.push(`append refused a valid mechanical entry: ${first?.error ?? "no answer"}`);
  const storedBefore = await callDriver(driver.query({}));
  const snapshotBefore = storedBefore?.ok ? JSON.stringify(storedBefore.entries) : null;

  // 2. No silent loss: every unknown metadata key survives the round trip (AC5).
  const appendedMetadata = await callDriver(driver.append(narrative));
  if (!appendedMetadata?.ok) {
    violations.push(`append refused a valid narrative entry: ${appendedMetadata?.error ?? "no answer"}`);
  } else {
    const back = await callDriver(driver.query({}));
    if (!back?.ok) {
      violations.push(`query failed after a valid append: ${back?.error ?? "no answer"}`);
    } else {
      if (back.entries.length !== 2) violations.push(`no silent loss: expected 2 stored entries, query answered ${back.entries.length}`);
      const stored = back.entries.find((entry) => entry.kind === "narrative");
      if (stored === undefined) {
        violations.push("no silent loss: the narrative entry was not found after append");
      } else if (sortedJson(stored.metadata) !== sortedJson(narrative.metadata)) {
        violations.push(`no silent loss: consumer metadata was not preserved verbatim — metadata keys must survive the round trip (got ${sortedJson(stored.metadata)})`);
      }
    }
  }

  // 3. Insert-only + arrival-order monotonic (D3/D9): a second append never
  //    changes what the first stored, and order never goes backwards.
  const again = await callDriver(driver.query({}));
  if (again?.ok) {
    const kinds = again.entries.map((entry) => entry.kind);
    if (JSON.stringify(kinds) !== JSON.stringify(["mechanical", "narrative"])) {
      violations.push(`insert-only / arrival order: read-back is ${JSON.stringify(kinds)} — an append never mutates or reorders what is stored`);
    }
    if (snapshotBefore !== null && JSON.stringify(again.entries.slice(0, snapshotBefore ? JSON.parse(snapshotBefore).length : 0)) !== snapshotBefore) {
      violations.push("insert-only: an append changed what was already stored — stored entries are read-back stable");
    }
  }

  // 4. Refusal before mutation: an invalid entry is refused and stores nothing.
  const refused = await callDriver(driver.append({ ...mechanical, timestamp: "not-a-date" }));
  if (refused?.ok) violations.push("predictable failure: an invalid entry was accepted");
  const afterRefusal = await callDriver(driver.query({}));
  if (afterRefusal?.ok && afterRefusal.entries.length !== 2) {
    violations.push(`predictable failure: a refused entry changed the store (${afterRefusal.entries.length} entries after the refusal)`);
  }

  // 5. Render is deterministic (the render target).
  const rendered1 = await callDriver(driver.render({ from: "2026-11-07T00:00Z" }));
  const rendered2 = await callDriver(driver.render({ from: "2026-11-07T00:00Z" }));
  if (!rendered1?.ok) {
    violations.push(`render failed: ${rendered1?.error ?? "no answer"}`);
  } else if (rendered1.rendered !== rendered2?.rendered) {
    violations.push("render is not deterministic: two runs of the same range differ");
  } else if (!rendered1.rendered.includes("## 2026-11-07T10:00Z")) {
    violations.push("render missed a stored entry inside the requested range");
  }

  // 6. The predicate grammar answers consistently through the driver.
  const byBranch = await callDriver(driver.query({ branch: "main" }));
  if (byBranch?.ok && byBranch.entries.length !== 1) {
    violations.push(`query answered ${byBranch.entries.length} entries for { branch: "main" }, expected 1`);
  }

  return { ok: violations.length === 0, violations };
}
