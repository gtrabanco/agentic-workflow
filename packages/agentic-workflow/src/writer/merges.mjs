/**
 * merges.mjs — the merge library the file-class git merge drivers run on
 * (issue #498, layer 2). Pure functions over strings: no git, no filesystem,
 * no network — the driver script (`scripts/shared-doc-merge.mjs`) owns the
 * git mechanics, this module owns the semantics.
 *
 * Two merges:
 *
 *   - `unionTableRows(base, ours, theirs, keyFn)` — mechanical union of a
 *     Markdown table document by row key, scoped per table block (a block is
 *     a consecutive run of `|`-led lines; its identity is its header line).
 *     One side's edit wins when the other side never touched the row; both
 *     sides editing the same row differently is a real conflict (FF-4) that
 *     answers conflict markers, never a silent resolution. Non-table lines
 *     are carried through byte for byte (ours' prose, byte-identical).
 *   - `structuralJsonMerge(base, ours, theirs)` — recursive union by JSON key
 *     (decision D3): one side's change wins when the other side never touched
 *     the key; both sides setting the same leaf differently is a conflict
 *     naming the path.
 *
 * Every answer is `{ ok: true, content }` or
 * `{ ok: false, reason, ... }` — a refusal is a value, never a throw. A
 * structural refusal (`invalid-document`) never guesses: a side whose table
 * headers or JSON shape changed is for a human, not for a driver.
 */

/** Row key: a leading numeric first cell — the roadmap Features table. */
export function numericRowKey(line) {
  const m = /^\|\s*(\d+)\s*\|/.exec(line);
  return m ? m[1] : null;
}

/** Row key: the issue number inside a leading `[#N](url)` link — the Fixes table. */
export function issueRowKey(line) {
  const m = /^\|\s*\[#(\d+)\]/.exec(line);
  return m ? m[1] : null;
}

const SEP_RE = /^\s*\|[-: |]+\|?\s*$/;

/**
 * Parse the table blocks of one document. A block is a run of consecutive
 * `|`-led lines: when the run's second line is a separator rule the block is
 * a table and its identity is the header line; otherwise the run is headerless
 * rows (a table fragment split by a blank line) and its identity is the empty
 * header — keyed rows still union, and a side without such rows reads as an
 * empty table, never a structure change. Answers
 * `{ ok, blocks: [{ header, headerIndex, start, end, rows: [{ index, line, key }] }] }`.
 */
function parseTableBlocks(text, keyFn) {
  const lines = text.split("\n");
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    if (!lines[index].startsWith("|")) {
      index += 1;
      continue;
    }
    const start = index;
    let header = "";
    let rowsStart = start;
    index += 1;
    if (index < lines.length && SEP_RE.test(lines[index])) {
      header = lines[start];
      rowsStart = start + 2;
      index += 1;
    }
    const rows = [];
    for (let r = rowsStart; r < index; r += 1) {
      const key = keyFn(lines[r]);
      rows.push({ index: r, line: lines[r], key });
    }
    while (index < lines.length && lines[index].startsWith("|")) {
      const key = keyFn(lines[index]);
      rows.push({ index, line: lines[index], key });
      index += 1;
    }
    blocks.push({ header, headerIndex: start, start, end: index - 1, rows });
  }
  return { ok: true, blocks, lines };
}

function blockMap(blocks, side) {
  const map = new Map();
  for (const block of blocks) {
    if (map.has(block.header)) {
      return { ok: false, reason: "invalid-document", detail: `${side}: duplicate table header "${block.header}"` };
    }
    const rows = new Map();
    for (const row of block.rows) {
      if (row.key === null) continue; // not a keyed row — never merged
      if (rows.has(row.key)) {
        return { ok: false, reason: "invalid-document", detail: `${side}: duplicate key ${row.key} under "${block.header}"` };
      }
      rows.set(row.key, row);
    }
    map.set(block.header, { block, rows });
  }
  return { ok: true, map };
}

function sameSide(a, b) {
  if (a === null || b === null) return a === null && b === null;
  return a.line === b.line;
}

/**
 * unionTableRows(base, ours, theirs, keyFn) — the row-union merge.
 * `keyFn` is `numericRowKey` (roadmap Features table) or `issueRowKey`
 * (the Fixes table). Answers `{ ok, content }`, a conflict
 * (`{ ok: false, reason: "conflict", conflicts, content }` with conflict
 * markers written into the content) or `invalid-document`.
 */
export function unionTableRows(base, ours, theirs, keyFn) {
  const parsedBase = parseTableBlocks(base, keyFn);
  const parsedOurs = parseTableBlocks(ours, keyFn);
  const parsedTheirs = parseTableBlocks(theirs, keyFn);
  const mapBase = blockMap(parsedBase.blocks, "base");
  if (!mapBase.ok) return mapBase;
  const mapOurs = blockMap(parsedOurs.blocks, "ours");
  if (!mapOurs.ok) return mapOurs;
  const mapTheirs = blockMap(parsedTheirs.blocks, "theirs");
  if (!mapTheirs.ok) return mapTheirs;

  // Table structure must agree across sides: a header gained or lost (a
  // column added, a table renamed) is a decision for a human. Headerless
  // fragments (the empty header) are exempt — a side without them reads as an
  // empty table, not a structure change.
  const headers = new Set([...mapBase.map.keys(), ...mapOurs.map.keys(), ...mapTheirs.map.keys()]);
  for (const header of headers) {
    if (header === "") continue;
    if (!mapBase.map.has(header) || !mapOurs.map.has(header) || !mapTheirs.map.has(header)) {
      return { ok: false, reason: "invalid-document", detail: `table structure changed for "${header}" — a human resolves it` };
    }
  }

  const lines = [...parsedOurs.lines];
  const conflicts = [];
  /** Insertions waiting to land at the end of their block, in theirs' order. */
  const insertions = new Map();

  for (const header of headers) {
    const { block: blockOurs, rows: rowsOurs } = mapOurs.map.get(header) ?? { block: null, rows: new Map() };
    const rowsBase = mapBase.map.get(header)?.rows ?? new Map();
    const rowsTheirs = mapTheirs.map.get(header)?.rows ?? new Map();
    const keys = new Set([...rowsBase.keys(), ...rowsOurs.keys(), ...rowsTheirs.keys()]);
    const blockInsertions = [];

    for (const key of keys) {
      const inBase = rowsBase.get(key) ?? null;
      const inOurs = rowsOurs.get(key) ?? null;
      const inTheirs = rowsTheirs.get(key) ?? null;

      let desired;
      if (sameSide(inOurs, inTheirs)) {
        desired = inOurs;
      } else if (sameSide(inOurs, inBase)) {
        desired = inTheirs; // ours never touched it — theirs' edit/deletion wins
      } else if (sameSide(inTheirs, inBase)) {
        desired = inOurs; // theirs never touched it — ours' edit/deletion wins
      } else {
        desired = undefined; // both sides changed the same row differently
      }

      if (desired === undefined) {
        conflicts.push({
          key,
          table: header,
          ours: inOurs?.line ?? null,
          theirs: inTheirs?.line ?? null,
          base: inBase?.line ?? null,
        });
        continue;
      }

      if (desired === null) {
        // Deleted (or never present) on the winning side: drop ours' row.
        if (inOurs) lines[inOurs.index] = null;
        continue;
      }
      if (inOurs) {
        lines[inOurs.index] = desired.line;
      } else {
        blockInsertions.push(desired.line);
      }
    }
    if (blockInsertions.length > 0) {
      const end = blockOurs ? blockOurs.end : lines.length - 1;
      insertions.set(end, [...(insertions.get(end) ?? []), ...blockInsertions]);
    }
  }

  // Apply removals, then conflict markers, then insertions — in one pass so
  // line indices stay stable.
  if (conflicts.length > 0) {
    for (const conflict of conflicts) {
      const inOurs = mapOurs.map.get(conflict.table).rows.get(conflict.key) ?? null;
      const markers = [
        "<<<<<<< ours",
        conflict.ours ?? "",
        "=======",
        conflict.theirs ?? "",
        ">>>>>>> theirs",
      ];
      if (inOurs) {
        lines[inOurs.index] = markers.join("\n");
      } else {
        const block = mapOurs.map.get(conflict.table)?.block;
        const end = block ? block.end : lines.length - 1;
        insertions.set(end, [...(insertions.get(end) ?? []), markers.join("\n")]);
      }
    }
  }

  const offsets = [...insertions.keys()].sort((a, b) => a - b);
  let out = [];
  let cursor = 0;
  for (const offset of offsets) {
    while (cursor <= offset) {
      if (lines[cursor] !== null) out.push(lines[cursor]);
      cursor += 1;
    }
    out.push(...insertions.get(offset));
  }
  for (; cursor < lines.length; cursor += 1) {
    if (lines[cursor] !== null) out.push(lines[cursor]);
  }
  if (conflicts.length > 0) {
    return { ok: false, reason: "conflict", conflicts, content: out.join("\n") };
  }
  return { ok: true, content: out.join("\n") };
}

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
}

function deepEqual(a, b) {
  return canonical(a) === canonical(b);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeNode(base, ours, theirs, path, conflicts) {
  if (deepEqual(ours, theirs)) return ours;
  if (deepEqual(ours, base)) return theirs;
  if (deepEqual(theirs, base)) return ours;
  if (isPlainObject(base) && isPlainObject(ours) && isPlainObject(theirs)) {
    const merged = { ...ours };
    for (const key of new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)])) {
      merged[key] = mergeNode(base[key] ?? null, ours[key] ?? null, theirs[key] ?? null, path ? `${path}.${key}` : key, conflicts);
    }
    return merged;
  }
  conflicts.push(path || "(root)");
  return ours;
}

/**
 * structuralJsonMerge(base, ours, theirs) — recursive union by JSON key
 * (decision D3). Answers `{ ok, content }` with a two-space render, or a
 * conflict naming every differing path, or `invalid-document` for a
 * side that does not parse.
 */
export function structuralJsonMerge(base, ours, theirs) {
  let b, o, t;
  try {
    b = JSON.parse(base);
    o = JSON.parse(ours);
    t = JSON.parse(theirs);
  } catch (error) {
    return { ok: false, reason: "invalid-document", detail: `a side does not parse as JSON — ${error.message}` };
  }
  const conflicts = [];
  const merged = mergeNode(b, o, t, "", conflicts);
  if (conflicts.length > 0) {
    return { ok: false, reason: "conflict", conflicts, content: ours };
  }
  return { ok: true, content: `${JSON.stringify(merged, null, 2)}\n` };
}
