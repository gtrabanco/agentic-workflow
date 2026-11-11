/**
 * writer.driver.test.mjs — issue #498 (feature 498 shared-writer-driver): the
 * runtime writer driver over the repository's shared documents.
 *
 * Frozen-failure corpus:
 *   FF-1 — last-write-wins: the pre-driver `src/edit/Roadmap.mjs` (frozen at
 *          base 27275c94) rewrote the whole file with no concurrency guard; two
 *          writers in one checkout clobbered each other (unit-32 finding F19,
 *          `docs/LOGS.md` line 2306). The corpus
 *          reproducer is the stale-read case: a writer whose read is stale
 *          must be refused with a named rejection, never applied.
 *   FF-5 — a writer that rewrites foreign bytes, drops lines, or accepts a
 *          stale read must fail the shared conformance suite (issue #498 AC4).
 *
 * The driver is value-refusing (the journal-driver shape): a refusal is
 * `{ ok: false, reason, … }` answered BEFORE the first byte moves, never a
 * thrown error the caller has to catch.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  WRITER_REFUSAL_REASONS,
  WriterError,
  readShared,
  writeShared,
  nodeWriter,
} from "../src/writer/driver.mjs";
import { runWriterConformance } from "../src/writer/conformance.mjs";

const FIXTURE = [
  "lead prose line",
  "",
  "| NN | slug | status | notes |",
  "|---|---|---|---|",
  "| 1 | alpha | idea | first |",
  "| 2 | beta | idea | second |",
  "",
  "tail prose line",
  "",
].join("\n");

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), "aw-writer-driver-"));
  return {
    dir,
    path: join(dir, "ROADMAP.md"),
    release() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

function seed(path, text = FIXTURE) {
  writeFileSync(path, text, "utf8");
}

/** One edit: replace row `| 2 |` with new content. */
const rowTwoEdit = (replacement) => (content) => {
  const start = content.indexOf("| 2 | beta | idea | second |");
  if (start === -1) return { ok: false, reason: "invalid-document", detail: "row 2 not found" };
  return { ok: true, edits: [{ start, end: start + "| 2 | beta | idea | second |".length, replacement }] };
};

test("the refusal vocabulary is closed and frozen, with stale-read in it", () => {
  assert.ok(Object.isFrozen(WRITER_REFUSAL_REASONS));
  assert.ok(WRITER_REFUSAL_REASONS.includes("stale-read"));
});

test("readShared answers a revision receipt: full sha256 + bytes", () => {
  const s = scratch();
  try {
    seed(s.path);
    const read = readShared(s.path);
    assert.equal(read.ok, true);
    assert.equal(read.path, s.path);
    assert.match(read.revision, /^[0-9a-f]{64}$/);
    assert.equal(read.bytes, FIXTURE);
  } finally {
    s.release();
  }
});

test("FF-1 — a stale read is refused with a named rejection naming BOTH revisions, before mutation", () => {
  const s = scratch();
  try {
    seed(s.path);
    const first = readShared(s.path);
    // A concurrent writer moves the file forward.
    writeShared({ path: s.path, apply: rowTwoEdit("| 2 | beta | done | second |") });
    // The first writer's CAS write must refuse.
    const refused = writeShared({ path: s.path, expected: first.revision, apply: rowTwoEdit("| 2 | beta | closed | second |") });
    assert.equal(refused.ok, false);
    assert.equal(refused.reason, "stale-read");
    assert.equal(refused.expected, first.revision);
    assert.match(refused.actual, /^[0-9a-f]{64}$/);
    assert.notEqual(refused.expected, refused.actual);
    assert.equal(refused.op, "write");
    // Nothing moved: the file is exactly the concurrent writer's output.
    assert.equal(readFileSync(s.path, "utf8"), FIXTURE.replace("| 2 | beta | idea |", "| 2 | beta | done |"));
    // No staging leftovers beside the document.
    assert.deepEqual(readdirSync(s.dir).filter((n) => n !== "ROADMAP.md"), []);
  } finally {
    s.release();
  }
});

test("a CAS write with the revision it read succeeds and answers a typed receipt", () => {
  const s = scratch();
  try {
    seed(s.path);
    const read = readShared(s.path);
    const receipt = writeShared({ path: s.path, expected: read.revision, apply: rowTwoEdit("| 2 | beta | done | second |") });
    assert.equal(receipt.ok, true);
    assert.equal(receipt.op, "write");
    assert.equal(receipt.path, s.path);
    assert.equal(receipt.before, read.revision);
    assert.match(receipt.after, /^[0-9a-f]{64}$/);
    assert.notEqual(receipt.before, receipt.after);
    assert.equal(receipt.edits, 1);
  } finally {
    s.release();
  }
});

test("the splice is lossless: every byte outside the declared edit range is carried through", () => {
  const s = scratch();
  try {
    seed(s.path);
    writeShared({ path: s.path, apply: rowTwoEdit("| 2 | beta | done | second |") });
    const after = readFileSync(s.path, "utf8");
    const expected = FIXTURE.replace("| 2 | beta | idea | second |", "| 2 | beta | done | second |");
    assert.equal(after, expected);
  } finally {
    s.release();
  }
});

test("a missing file is refused before mutation", () => {
  const s = scratch();
  try {
    const refused = writeShared({ path: s.path, apply: rowTwoEdit("x") });
    assert.equal(refused.ok, false);
    assert.equal(refused.reason, "missing-file");
    assert.equal(existsSync(s.path), false);
  } finally {
    s.release();
  }
});

test("the applier's own refusal passes through and mutates nothing", () => {
  const s = scratch();
  try {
    seed(s.path);
    const refused = writeShared({
      path: s.path,
      apply: () => ({ ok: false, reason: "invalid-document", detail: "row 7 not found" }),
    });
    assert.equal(refused.ok, false);
    assert.equal(refused.reason, "invalid-document");
    assert.equal(readFileSync(s.path, "utf8"), FIXTURE);
  } finally {
    s.release();
  }
});

test("a read refusal is a value, never a throw (predictable failure)", () => {
  const s = scratch();
  try {
    const read = readShared(join(s.dir, "absent.md"));
    assert.equal(read.ok, false);
    assert.equal(read.reason, "missing-file");
  } finally {
    s.release();
  }
});

test("WriterError is the typed error for callers that prefer throw semantics", () => {
  const error = new WriterError("stale-read", { expected: "a", actual: "b" });
  assert.equal(error.name, "WriterError");
  assert.equal(error.reason, "stale-read");
  assert.deepEqual(error.details, { expected: "a", actual: "b" });
});

// ── The shared conformance suite ─────────────────────────────────────────

test("the shipped node writer passes the shared conformance suite", () => {
  const s = scratch();
  try {
    const result = runWriterConformance(nodeWriter, { root: s.dir });
    assert.equal(result.ok, true, JSON.stringify(result.checks?.filter((c) => !c.ok)));
  } finally {
    s.release();
  }
});

test("FF-5 — a writer that rewrites foreign bytes fails the conformance suite", () => {
  const s = scratch();
  try {
    const violator = {
      name: "foreign-byte-rewriter",
      read: nodeWriter.read,
      write({ path, apply }) {
        const receipt = nodeWriter.write({ path, apply });
        if (!receipt.ok) return receipt;
        // Corrupt one byte outside any declared edit range.
        const bytes = readFileSync(path, "utf8");
        writeFileSync(path, bytes.replace("| A | one |", "| A | one! |"), "utf8");
        return receipt;
      },
    };
    const result = runWriterConformance(violator, { root: s.dir });
    assert.equal(result.ok, false);
    assert.ok(result.checks.some((c) => !c.ok && /lossless/.test(c.name)), "the lossless check names the violation");
  } finally {
    s.release();
  }
});

test("FF-5 — a writer that drops lines fails the conformance suite", () => {
  const s = scratch();
  try {
    const violator = {
      name: "line-dropper",
      read: nodeWriter.read,
      write({ path, apply }) {
        const receipt = nodeWriter.write({ path, apply });
        if (!receipt.ok) return receipt;
        const lines = readFileSync(path, "utf8").split("\n");
        writeFileSync(path, lines.filter((l) => l !== "| A | one |").join("\n"), "utf8");
        return receipt;
      },
    };
    const result = runWriterConformance(violator, { root: s.dir });
    assert.equal(result.ok, false);
    assert.ok(result.checks.some((c) => !c.ok && /lossless/.test(c.name)));
  } finally {
    s.release();
  }
});

test("FF-5 — a writer that accepts a stale read fails the conformance suite", () => {
  const s = scratch();
  try {
    const violator = {
      name: "stale-acceptor",
      read: nodeWriter.read,
      write({ path, expected, apply }) {
        // CAS ignored: last-write-wins.
        return nodeWriter.write({ path, apply });
      },
    };
    const result = runWriterConformance(violator, { root: s.dir });
    assert.equal(result.ok, false);
    assert.ok(result.checks.some((c) => !c.ok && /stale-read/.test(c.name)));
  } finally {
    s.release();
  }
});
