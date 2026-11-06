/**
 * journal-entry.test.mjs — the canonical journal entry contract (issue #374,
 * unit docs/fix/374-pluggable-session-journal/).
 *
 * The corpus was observed RED before `src/journal.ts` existed (owner S7: one
 * RED test per requested rule). The contract it pins:
 *
 *  - **One versioned type.** `journal-entry@1` — a version constant and a
 *    contract id, the envelope precedent (AC1).
 *  - **Core is closed, metadata is open.** The top level refuses unknown keys
 *    (a consumer field belongs in `metadata`); `metadata` is validated for
 *    shape only — any JSON object, any keys (AC1). Consumer fields
 *    (`dev_id`, `commit_hash`, …) survive untouched.
 *  - **The core extends `log-facts@1` by exactly one field.** `reason`
 *    (required when `kind` is `mechanical` — AC4's byte parity needs it),
 *    `summary` (required when `kind` is `narrative`), `commits`/`files`
 *    optional (derivable), `timestamp` in either UTC precision the journal
 *    already carries (D12).
 *  - **The JSON Schema and the validator agree.** Every entry the validator
 *    accepts must compile and validate under strict Ajv, and a rule it refuses
 *    must be refused by the schema too — the projection suite's discipline.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import Ajv from "ajv";

import {
  JOURNAL_ENTRY_CONTRACT_ID,
  JOURNAL_ENTRY_VERSION,
  validateJournalEntry,
} from "../dist/index.js";

const packageRoot = new URL("..", import.meta.url).pathname;
const schema = JSON.parse(readFileSync(`${packageRoot}/journal-entry.schema.json`, "utf8"));
const ajv = new Ajv({ strict: true });
const schemaValidates = ajv.compile(schema);

const MECHANICAL = {
  contract: JOURNAL_ENTRY_CONTRACT_ID,
  version: JOURNAL_ENTRY_VERSION,
  timestamp: "2026-11-07T10:00Z",
  branch: "feat/374-pluggable-session-journal",
  kind: "mechanical",
  reason: "clear",
  commits: { count: 2, range: "b8e4d15…bcd0830" },
  files: ["packages/agentic-workflow/src/journal/driver.mjs"],
};

const NARRATIVE = {
  contract: JOURNAL_ENTRY_CONTRACT_ID,
  version: JOURNAL_ENTRY_VERSION,
  timestamp: "2026-11-07T10:59:26Z",
  branch: "main",
  kind: "narrative",
  summary: "Landed the store-driver contract; both drivers pass the conformance harness.",
  metadata: { dev_id: "d1", commit_hash: "abc1234", team: "platform", nested: { deep: [1, 2] } },
};

const bothWays = (value, ok) => {
  const result = validateJournalEntry(value);
  assert.equal(result.ok, ok, result.ok ? "" : result.reason);
  assert.equal(schemaValidates(value), ok, JSON.stringify(schemaValidates.errors ?? []));
  return result;
};

test("publishes the version constant and the contract id", () => {
  assert.equal(JOURNAL_ENTRY_VERSION, 1);
  assert.equal(JOURNAL_ENTRY_CONTRACT_ID, "agentic-workflow/journal-entry");
  assert.equal(schema.properties.version.const, 1);
  assert.equal(schema.properties.contract.const, "agentic-workflow/journal-entry");
});

test("accepts a mechanical entry shaped from log-facts@1", () => {
  bothWays(MECHANICAL, true);
});

test("accepts a narrative entry at second precision", () => {
  bothWays(NARRATIVE, true);
});

test("metadata is an open map: unknown consumer keys survive, shape only", () => {
  const result = bothWays(NARRATIVE, true);
  assert.deepEqual(result.entry.metadata.dev_id, "d1");
  assert.deepEqual(result.entry.metadata.commit_hash, "abc1234");
  assert.deepEqual(result.entry.metadata.nested, { deep: [1, 2] });
});

test("an unknown top-level key is refused — consumer fields belong in metadata", () => {
  bothWays({ ...MECHANICAL, dev_id: "d1" }, false);
  bothWays({ ...MECHANICAL, extra: { nested: true } }, false);
});

test("a non-object metadata is refused", () => {
  bothWays({ ...NARRATIVE, metadata: "dev" }, false);
  bothWays({ ...NARRATIVE, metadata: 7 }, false);
  bothWays({ ...NARRATIVE, metadata: [] }, false);
});

test("contract and version are required and frozen", () => {
  const { contract, ...noContract } = MECHANICAL;
  const { version, ...noVersion } = MECHANICAL;
  bothWays(noContract, false);
  bothWays(noVersion, false);
  bothWays({ ...MECHANICAL, contract: "agentic-workflow/something-else" }, false);
  bothWays({ ...MECHANICAL, version: 2 }, false);
});

test("the timestamp must be UTC minute or second precision, component-ranged and parseable", () => {
  bothWays({ ...MECHANICAL, timestamp: "2026-11-07T10:00:26Z" }, true);
  bothWays({ ...MECHANICAL, timestamp: "2026-11-07 10:00Z" }, false);
  bothWays({ ...MECHANICAL, timestamp: "yesterday" }, false);
  // An impossible month passes the schema's component-range pattern but is
  // refused by the runtime validator — the one rule draft-07 cannot express
  // without ajv-formats (full instant parseability, D12). Asserted against the
  // validator alone, the stricter authority.
  const result = validateJournalEntry({ ...MECHANICAL, timestamp: "2026-13-07T10:00Z" });
  assert.equal(result.ok, false);
});

test("kind is the closed mechanical|narrative set", () => {
  bothWays({ ...MECHANICAL, kind: "auto" }, false);
  bothWays({ ...MECHANICAL, kind: "" }, false);
});

test("a narrative entry without a summary is refused; a mechanical one carries none", () => {
  const { summary, ...noSummary } = NARRATIVE;
  bothWays(noSummary, false);
  bothWays({ ...NARRATIVE, summary: "" }, false);
  const mechanicalNoSummary = { ...MECHANICAL };
  delete mechanicalNoSummary.summary;
  bothWays(mechanicalNoSummary, true);
});

test("a mechanical entry without a reason is refused (AC4 parity needs it)", () => {
  const { reason, ...noReason } = MECHANICAL;
  bothWays(noReason, false);
  bothWays({ ...MECHANICAL, reason: "Clear" }, false);
});

test("commits and files are optional but shape-checked", () => {
  const { commits, ...noCommits } = MECHANICAL;
  bothWays(noCommits, true);
  bothWays({ ...MECHANICAL, commits: { count: 2 } }, false);
  bothWays({ ...MECHANICAL, commits: { count: -1, range: null } }, false);
  bothWays({ ...MECHANICAL, commits: { count: 2, range: "abc…def" }, files: [""] }, false);
  bothWays({ ...MECHANICAL, commits: { count: 2, range: "abc…def" }, files: "a b" }, false);
});

test("a non-object payload is refused", () => {
  bothWays(null, false);
  bothWays("entry", false);
  bothWays([MECHANICAL], false);
});
