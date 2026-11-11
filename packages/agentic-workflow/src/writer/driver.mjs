/**
 * driver.mjs — the shared writer-driver contract (issue #498,
 * `writer-driver-contract@1` in this package's README).
 *
 * A shared document is one several concurrent sessions and PRs write and
 * overwrite (`docs/ROADMAP.md`, the budgets manifest, …). The driver owns the
 * write path so a write is a **key-based splice** — the caller declares the
 * byte ranges it changes, every other byte is carried through untouched —
 * with optional **CAS**: a write that carries the revision it read refuses
 * with a named `stale-read` rejection when the file moved since the read,
 * instead of last-write-wins (unit-32 finding F19, `docs/LOGS.md:2306`).
 *
 * Contract shape (mirrors `journal-driver-contract@1`):
 *
 *   - `readShared(path)`          — answers `{ ok, op, path, revision, bytes }`;
 *                                   `revision` is the full SHA-256 the caller
 *                                   passes back as `expected` to close the CAS
 *                                   loop.
 *   - `writeShared({ path, expected, apply })` — `apply(content)` returns
 *                                   `{ ok, edits: [{ start, end, replacement }] }`
 *                                   declaring the ranges it changes (never the
 *                                   whole content — that is what makes a
 *                                   foreign-byte rewrite unrepresentable), or
 *                                   its own `{ ok: false, reason, detail }`.
 *
 * Every answer is `{ ok: true, … }` or `{ ok: false, reason, … }` — a refusal
 * is a value, never a thrown error the caller has to catch (predictable
 * failure). Refusals happen BEFORE the first byte moves; a refused write
 * leaves the document byte-identical and no staging file behind. The write
 * itself is atomic (staging file + rename in the document's own directory).
 *
 * The closed refusal vocabulary is `WRITER_REFUSAL_REASONS`; `WriterError`
 * is the typed error for callers that prefer throw semantics. `nodeWriter`
 * is the reference instance the shared conformance suite passes
 * (`runWriterConformance`, `src/writer/conformance.mjs`).
 *
 * Pure Node: no git, no network, no child processes.
 */

import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { createHash, randomBytes } from "node:crypto";

/** The closed refusal vocabulary. Adding a reason is a contract change. */
export const WRITER_REFUSAL_REASONS = Object.freeze([
  "stale-read",
  "missing-file",
  "unreadable",
  "invalid-document",
]);

/** A refused writer operation, named so a caller can tell a refusal from a bug. */
export class WriterError extends Error {
  constructor(reason, details = {}) {
    super(details.detail ? `${reason} — ${details.detail}` : reason);
    this.name = "WriterError";
    this.reason = reason;
    this.details = details;
  }
}

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * readShared(path) — the read half of the CAS loop. Answers
 * `{ ok, op, path, revision, bytes }` or a refusal value.
 */
export function readShared(path) {
  let bytes;
  try {
    bytes = readFileSync(path, "utf8");
  } catch (error) {
    const reason = error.code === "ENOENT" ? "missing-file" : "unreadable";
    return { ok: false, reason, op: "read", path, detail: error.message };
  }
  return { ok: true, op: "read", path, revision: sha256(bytes), bytes };
}

/**
 * Splice `edits` into `original` losslessly. Edits are sorted, checked for
 * overlap and bounds — a bad edit is a refusal (`{ ok: false, … }`), never a
 * silent corruption.
 */
export function applyEdits(original, edits) {
  const sorted = [...edits].sort((a, b) => a.start - b.start);
  let out = "";
  let cursor = 0;
  for (const edit of sorted) {
    if (!Number.isInteger(edit.start) || !Number.isInteger(edit.end) || edit.start < 0 || edit.end < edit.start || edit.end > original.length) {
      return { ok: false, reason: "invalid-document", detail: `edit out of bounds (${edit.start}..${edit.end} of ${original.length})` };
    }
    if (edit.start < cursor) {
      return { ok: false, reason: "invalid-document", detail: `overlapping edits at ${edit.start}` };
    }
    if (typeof edit.replacement !== "string") {
      return { ok: false, reason: "invalid-document", detail: "edit replacement is not a string" };
    }
    out += original.slice(cursor, edit.start) + edit.replacement;
    cursor = edit.end;
  }
  out += original.slice(cursor);
  return { ok: true, content: out };
}

/**
 * writeShared({ path, expected, apply }) — the write half. `expected`, when
 * given, is the `revision` the caller read earlier: any movement since refuses
 * with `stale-read` naming BOTH revisions. The applier declares its edits; the
 * driver splices them and writes atomically.
 */
export function writeShared({ path, expected, apply }) {
  let bytes;
  try {
    bytes = readFileSync(path, "utf8");
  } catch (error) {
    const reason = error.code === "ENOENT" ? "missing-file" : "unreadable";
    return { ok: false, reason, op: "write", path, detail: error.message };
  }
  const revision = sha256(bytes);
  if (expected !== undefined && expected !== revision) {
    return { ok: false, reason: "stale-read", op: "write", path, expected, actual: revision };
  }

  const declared = apply(bytes);
  if (!declared || declared.ok !== true) {
    return {
      ok: false,
      reason: declared?.reason ?? "invalid-document",
      op: "write",
      path,
      ...(declared?.detail ? { detail: declared.detail } : {}),
    };
  }
  const spliced = applyEdits(bytes, declared.edits ?? []);
  if (!spliced.ok) {
    return { ...spliced, op: "write", path };
  }

  if (spliced.content === bytes) {
    return { ok: true, op: "write", path, before: revision, after: revision, expected, edits: 0, changed: false };
  }
  const staging = join(dirname(path), `.${basename(path)}.agwo-write-${process.pid}-${randomBytes(4).toString("hex")}`);
  writeFileSync(staging, spliced.content, "utf8");
  renameSync(staging, path);
  return { ok: true, op: "write", path, before: revision, after: sha256(spliced.content), expected, edits: (declared.edits ?? []).length, changed: true };
}

/** The reference driver instance over the module functions. */
export const nodeWriter = Object.freeze({ name: "node", read: readShared, write: writeShared });
