/**
 * conformance.mjs — the shared writer conformance suite (issue #498,
 * `writer-driver-contract@1`): the one suite every writer-driver instance
 * passes before it ships, and that a violating driver fails.
 *
 * A driver that rewrites foreign bytes, drops lines, or accepts a stale read
 * fails it (issue #498 AC4) — the shipped fixtures in
 * `test/writer.driver.test.mjs` prove each violation class is caught.
 *
 * `runWriterConformance(writer, { root })`: `writer` is
 * `{ name, read(path), write({ path, expected, apply }) }` (the reference
 * instance is `nodeWriter`); `root` is a scratch directory the caller owns —
 * the suite seeds its fixture file inside it, resets it between checks and
 * cleans up after itself.
 */

import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

import { applyEdits } from "./driver.mjs";

const FIXTURE = [
  "header prose",
  "| A | one |",
  "| B | two |",
  "tail prose",
  "",
].join("\n");

const EDIT_REPLACEMENT = "| B | two. |";
const FIXTURE_MERGED = FIXTURE.replace("| B | two |", EDIT_REPLACEMENT);

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function editB(content) {
  const start = content.indexOf("| B | two |");
  if (start === -1) return { ok: false, reason: "invalid-document", detail: "row B not found" };
  return { ok: true, edits: [{ start, end: start + "| B | two |".length, replacement: EDIT_REPLACEMENT }] };
}

function check(name, run) {
  try {
    const detail = run();
    return detail === undefined ? { name, ok: true } : { name, ok: false, detail };
  } catch (error) {
    return { name, ok: false, detail: error.message };
  }
}

/**
 * Run the conformance suite against one writer instance.
 * Answers `{ ok, checks: [{ name, ok, detail? }] }`.
 */
export function runWriterConformance(writer, { root } = {}) {
  if (!writer || typeof writer.read !== "function" || typeof writer.write !== "function") {
    throw new TypeError("runWriterConformance: writer must answer read(path) and write({ path, expected, apply })");
  }
  const owned = !root;
  const dir = root ?? mkdtempSync(join(tmpdir(), "aw-writer-conformance-"));
  const path = join(dir, "conformance-fixture.md");
  const checks = [];
  try {
    const seed = () => writeFileSync(path, FIXTURE, "utf8");

    checks.push(check("typed receipt (op/path/before/after, after is the read-back digest)", () => {
      seed();
      const receipt = writer.write({ path, apply: editB });
      if (!receipt.ok) return `write refused: ${receipt.reason}`;
      for (const field of ["op", "path", "before", "after"]) {
        if (receipt[field] === undefined) return `receipt field \`${field}\` missing`;
      }
      const after = sha256(readFileSync(path, "utf8"));
      if (receipt.after !== after) return `receipt.after is not the read-back digest`;
      if (receipt.after === receipt.before) return "the write changed nothing";
    }));

    checks.push(check("lossless splice (no foreign-byte rewrite, no dropped lines)", () => {
      seed();
      const receipt = writer.write({ path, apply: editB });
      if (!receipt.ok) return `write refused: ${receipt.reason}`;
      const bytes = readFileSync(path, "utf8");
      if (bytes !== FIXTURE_MERGED) return "read-back differs from the independently computed splice of the declared edit";
    }));

    checks.push(check("stale-read refused before mutation, naming both revisions", () => {
      seed();
      const refused = writer.write({ path, expected: "0".repeat(64), apply: editB });
      if (refused.ok !== false) return "a stale read was accepted (last-write-wins)";
      if (refused.reason !== "stale-read") return `refused with \`${refused.reason}\` instead of \`stale-read\``;
      if (refused.expected === undefined || refused.actual === undefined) return "the refusal does not name both revisions";
      if (readFileSync(path, "utf8") !== FIXTURE) return "the refused write moved the file";
    }));

    checks.push(check("missing file refused before mutation", () => {
      const absent = join(dir, "absent.md");
      const refused = writer.write({ path: absent, apply: editB });
      if (refused.ok !== false || refused.reason !== "missing-file") return "a missing file was not refused with `missing-file`";
    }));

    checks.push(check("the applier's own refusal passes through and mutates nothing", () => {
      seed();
      const refused = writer.write({
        path,
        apply: () => ({ ok: false, reason: "invalid-document", detail: "conformance refusal" }),
      });
      if (refused.ok !== false || refused.reason !== "invalid-document") return "the applier's refusal was not passed through";
      if (readFileSync(path, "utf8") !== FIXTURE) return "the refused write moved the file";
    }));

    checks.push(check("readShared answers a revision receipt", () => {
      seed();
      const read = writer.read(path);
      if (!read.ok || !/^[0-9a-f]{64}$/.test(read.revision ?? "")) return "the read did not answer a full-sha256 revision";
      if (read.bytes !== FIXTURE) return "the read did not answer the bytes";
    }));

    return { ok: checks.every((c) => c.ok), checks };
  } finally {
    if (owned) rmSync(dir, { recursive: true, force: true });
  }
}

/** Re-exported for drivers that build on the splice primitive in their tests. */
export { applyEdits, FIXTURE as CONFORMANCE_FIXTURE };
