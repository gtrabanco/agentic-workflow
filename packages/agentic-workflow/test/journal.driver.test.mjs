/**
 * journal.driver.test.mjs — the store-driver contract and its conformance
 * harness (issue #374, unit docs/fix/374-pluggable-session-journal/).
 *
 * This suite was observed RED before `entry.mjs`, `driver.mjs` and the two
 * drivers existed (owner S7). It pins:
 *
 *  - **One contract, two drivers, one conformance harness** (AC2): the
 *    Markdown default and the reference SQLite driver both pass
 *    `runDriverConformance` — append, query, render, insert-only, refusals —
 *    and the harness catches a driver that violates the contract (AC7).
 *  - **The default is byte-identical** (AC4/AC8): a metadata-free mechanical
 *    append equals `renderEntry(facts)` exactly; the fragment routing composes
 *    with #405 unchanged.
 *  - **Consumer fields survive** (AC5): `metadata.dev_id` and
 *    `metadata.commit_hash` round-trip through both drivers, and the Markdown
 *    transport carries them on the `- **Metadata:**` line the driver contract
 *    owns (D7).
 *  - **Predicates are expressed once** (AC6): both drivers answer the identical
 *    `{ dateRange, branch, keyword }` predicate set with the same results.
 *  - **Insert-only** (D3): a correction is a new entry; nothing ever mutates or
 *    reorders what was appended.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  JOURNAL_ENTRY_CONTRACT_ID,
  JOURNAL_ENTRY_VERSION,
} from "../../agentic-workflow-schema/dist/index.js";
import { renderEntry } from "../src/log/render.mjs";
import { JOURNAL_DIR } from "../src/journal/fragment.mjs";
import { DEFAULT_LOG } from "../src/journal/aggregate.mjs";
import {
  createMarkdownDriver,
} from "../src/journal/drivers/markdown.mjs";
import {
  createSqliteDriver,
  SQLITE_JOURNAL_STORE_DIR,
} from "../src/journal/drivers/sqlite.mjs";
import {
  DRIVER_KINDS,
  normalizePredicate,
  renderEntryBlock,
  runDriverConformance,
} from "../src/journal/driver.mjs";
import { entryToFacts, factsToEntry, normalizeEntry } from "../src/journal/entry.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "j374-driver-"));
}

function seedJournal(root) {
  const journalPath = path.join(root, DEFAULT_LOG);
  fs.mkdirSync(path.dirname(journalPath), { recursive: true });
  fs.writeFileSync(journalPath, "# Session log\n\n<!-- append-only -->\n");
  return journalPath;
}

const FACTS = {
  timestamp: "2026-11-07T10:00Z",
  branch: "feat/374-pluggable-session-journal",
  reason: "clear",
  commits: { count: 2, range: "b8e4d15a…bcd0830c" },
  files: ["packages/agentic-workflow/src/journal/driver.mjs"],
};

const NARRATIVE_ENTRY = {
  contract: JOURNAL_ENTRY_CONTRACT_ID,
  version: JOURNAL_ENTRY_VERSION,
  timestamp: "2026-11-07T10:59:26Z",
  branch: "main",
  kind: "narrative",
  summary: "Landed the store-driver contract; both drivers pass conformance.",
  metadata: { dev_id: "d1", commit_hash: "abc1234" },
};

const MECHANICAL_ENTRY = {
  ...factsToEntry(FACTS),
};

/** The driver factories both legs of the conformance suite run against. */
const DRIVER_FACTORIES = [
  ["markdown", (root) => createMarkdownDriver({ root, journalPath: DEFAULT_LOG })],
  ["sqlite", (root) => createSqliteDriver({ root })],
];

test("the driver contract is named and closed", () => {
  assert.deepEqual(DRIVER_KINDS, ["markdown", "sqlite"]);
});

test("factsToEntry round-trips into renderEntry byte-for-byte (AC4 golden seed)", () => {
  const entry = factsToEntry(FACTS);
  assert.equal(entry.kind, "mechanical");
  assert.equal(renderEntryBlock(entry), renderEntry(FACTS));
  const back = renderEntry(entryToFacts(entry));
  assert.equal(back, renderEntry(FACTS));
});

test("normalizeEntry rejects an unknown top-level key before any driver sees it", () => {
  const result = normalizeEntry({ ...MECHANICAL_ENTRY, dev_id: "d1" });
  assert.equal(result.ok, false);
});

for (const [driverName, factory] of DRIVER_FACTORIES) {
  test(`conformance: the ${driverName} driver passes the shared harness`, () => {
    const root = tmpRoot();
    try {
      if (driverName === "markdown") seedJournal(root);
      const report = runDriverConformance(() => factory(root), { root });
      assert.equal(report.ok, true, JSON.stringify(report.violations ?? []));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test(`conformance: the ${driverName} driver round-trips consumer metadata (AC5)`, () => {
    const root = tmpRoot();
    try {
      if (driverName === "markdown") seedJournal(root);
      const driver = factory(root);
      const appended = driver.append(NARRATIVE_ENTRY);
      assert.equal(appended.ok, true, appended.error ?? "");
      const back = driver.query({ keyword: "conformance" });
      assert.equal(back.ok, true, back.error ?? "");
      assert.equal(back.entries.length, 1);
      assert.deepEqual(back.entries[0].metadata, { dev_id: "d1", commit_hash: "abc1234" });
      assert.equal(back.entries[0].metadata.dev_id, "d1");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test(`conformance: the ${driverName} driver is insert-only and arrival-ordered (D3/D9)`, () => {
    const root = tmpRoot();
    try {
      if (driverName === "markdown") seedJournal(root);
      const driver = factory(root);
      driver.append(MECHANICAL_ENTRY);
      driver.append(NARRATIVE_ENTRY);
      const all = driver.query({});
      assert.equal(all.entries.length, 2);
      // The first entry is byte-for-byte what was appended: an append never
      // mutates or reorders what is already stored.
      assert.equal(all.entries[0].kind, "mechanical");
      assert.deepEqual(all.entries[0].metadata, {});
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test(`conformance: the ${driverName} driver refuses an invalid entry before mutating (O14)`, () => {
    const root = tmpRoot();
    try {
      if (driverName === "markdown") seedJournal(root);
      const driver = factory(root);
      driver.append(MECHANICAL_ENTRY);
      const refused = driver.append({ ...MECHANICAL_ENTRY, timestamp: "not-a-date" });
      assert.equal(refused.ok, false);
      const unchanged = driver.query({});
      assert.equal(unchanged.entries.length, 1);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
}

test("predicate parity: both drivers answer the same predicates with the same results (AC6)", () => {
  const results = DRIVER_FACTORIES.map(([name, factory]) => {
    const root = tmpRoot();
    try {
      if (name === "markdown") seedJournal(root);
      const driver = factory(root);
      driver.append(MECHANICAL_ENTRY);
      driver.append(NARRATIVE_ENTRY);
      driver.append({
        ...factsToEntry({ ...FACTS, timestamp: "2026-11-07T11:30Z", branch: "main" }),
      });
      return {
        byBranch: driver.query({ branch: "main" }).entries.map((e) => e.timestamp),
        byRange: driver.query({ dateRange: { from: "2026-11-07T11:00Z" } }).entries.map((e) => e.timestamp),
        byKeyword: driver.query({ keyword: "STORE-DRIVER" }).entries.map((e) => e.timestamp),
        combined: driver.query({ branch: "main", dateRange: { to: "2026-11-07T11:00Z" } }).entries.length,
      };
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
  assert.deepEqual(results[0], results[1]);
  assert.deepEqual(results[0].byBranch, ["2026-11-07T10:59:26Z", "2026-11-07T11:30Z"]);
  assert.deepEqual(results[0].byRange, ["2026-11-07T11:30Z"]);
  assert.deepEqual(results[0].byKeyword, ["2026-11-07T10:59:26Z"]);
  assert.equal(results[0].combined, 1);
});

test("normalizePredicate is the one expression of the predicate grammar (AC6)", () => {
  assert.deepEqual(normalizePredicate({}), { ok: true, predicate: {} });
  assert.deepEqual(normalizePredicate({ branch: "main", keyword: "x" }), {
    ok: true,
    predicate: { branch: "main", keyword: "x" },
  });
  assert.deepEqual(normalizePredicate({ dateRange: { from: "2026-11-07T00:00Z", to: "2026-11-08T00:00Z" } }).predicate.dateRange, {
    from: "2026-11-07T00:00Z",
    to: "2026-11-08T00:00Z",
  });
  assert.equal(normalizePredicate({ nonsense: true }).ok, false);
  assert.equal(normalizePredicate({ dateRange: { from: "yesterday" } }).ok, false);
});

test("the markdown driver's golden append is byte-identical to the pre-change behaviour (AC4/AC8)", () => {
  const root = tmpRoot();
  try {
    const journalPath = seedJournal(root);
    const before = fs.readFileSync(journalPath, "utf8");
    const driver = createMarkdownDriver({ root, journalPath: DEFAULT_LOG });
    const appended = driver.append(MECHANICAL_ENTRY);
    assert.equal(appended.ok, true, appended.error ?? "");
    const after = fs.readFileSync(journalPath, "utf8");
    assert.equal(after, `${before}\n${renderEntry(FACTS)}`);
    // No Metadata line without metadata: the format change AC8 forbids.
    assert.ok(!after.includes("**Metadata:**"));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the markdown driver routes through the fragment carrier when opted in (#405 composition, D6)", () => {
  const root = tmpRoot();
  try {
    const journalPath = seedJournal(root);
    const carrier = path.join(root, JOURNAL_DIR);
    fs.mkdirSync(carrier, { recursive: true });
    const driver = createMarkdownDriver({ root, journalPath: DEFAULT_LOG });
    const appended = driver.append(MECHANICAL_ENTRY);
    assert.equal(appended.ok, true, appended.error ?? "");
    assert.equal(appended.target, "fragment");
    assert.equal(fs.readdirSync(carrier).length, 1);
    const journalBefore = fs.readFileSync(journalPath, "utf8");
    driver.append(NARRATIVE_ENTRY);
    assert.equal(fs.readFileSync(journalPath, "utf8"), journalBefore);
    assert.ok(!fs.readFileSync(journalPath, "utf8").includes(renderEntry(FACTS)));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a metadata-bearing mechanical entry travels as a narrative-kind fragment (D7)", () => {
  const root = tmpRoot();
  try {
    seedJournal(root);
    const carrier = path.join(root, JOURNAL_DIR);
    fs.mkdirSync(carrier, { recursive: true });
    const driver = createMarkdownDriver({ root, journalPath: DEFAULT_LOG });
    const entry = { ...MECHANICAL_ENTRY, metadata: { dev_id: "d1" } };
    const appended = driver.append(entry);
    assert.equal(appended.ok, true, appended.error ?? "");
    const [name] = fs.readdirSync(carrier);
    assert.ok(name.includes("-narrative-"), name);
    const content = fs.readFileSync(path.join(carrier, name), "utf8");
    assert.ok(content.startsWith("## "));
    assert.ok(content.includes("- **Metadata:**"));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the markdown driver renders a range deterministically (in-scope 6, render target)", () => {
  const root = tmpRoot();
  try {
    seedJournal(root);
    const driver = createMarkdownDriver({ root, journalPath: DEFAULT_LOG });
    driver.append(MECHANICAL_ENTRY);
    driver.append(NARRATIVE_ENTRY);
    const first = driver.render({ from: "2026-11-07T00:00Z" });
    const second = driver.render({ from: "2026-11-07T00:00Z" });
    assert.equal(first.ok, true, first.error ?? "");
    assert.equal(first.rendered, second.rendered);
    assert.ok(first.rendered.startsWith("## "));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the sqlite driver owns its own store outside the carrier (D8)", () => {
  assert.equal(SQLITE_JOURNAL_STORE_DIR, ".agentic-workflow/journal-store");
});

test("the conformance harness catches a driver that strips consumer metadata (AC7, no silent loss)", () => {
  const root = tmpRoot();
  try {
    seedJournal(root);
    const violating = () => {
      const driver = createMarkdownDriver({ root, journalPath: DEFAULT_LOG });
      return {
        ...driver,
        name: "metadata-stripper",
        append(entry) {
          const { metadata, ...stripped } = entry;
          return driver.append(stripped);
        },
      };
    };
    const report = runDriverConformance(violating, { root });
    assert.equal(report.ok, false);
    assert.ok((report.violations ?? []).some((v) => v.includes("metadata")), JSON.stringify(report.violations ?? []));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the conformance harness catches a driver that mutates stored entries (AC7/D3, insert-only)", () => {
  const root = tmpRoot();
  try {
    seedJournal(root);
    const violating = () => {
      const driver = createMarkdownDriver({ root, journalPath: DEFAULT_LOG });
      return {
        ...driver,
        name: "rewriter",
        append(entry) {
          const result = driver.append(entry);
          if (result.ok && driver.query({}).entries.length > 1) {
            // A violating correction: rewrite the first entry's summary.
            const journalPath = path.join(root, DEFAULT_LOG);
            const text = fs.readFileSync(journalPath, "utf8");
            fs.writeFileSync(journalPath, text.replace("conformance.", "MUTATED."));
          }
          return result;
        },
      };
    };
    const report = runDriverConformance(violating, { root });
    assert.equal(report.ok, false);
    assert.ok((report.violations ?? []).length > 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the publisher routes through the driver with the options API intact (AC3/O3)", async () => {
  const { createJournalPublisher } = await import("../src/log/publish.mjs");
  const root = tmpRoot();
  try {
    const journalPath = path.join(root, DEFAULT_LOG);
    fs.writeFileSync(journalPath, "# Session log\n\n");
    const publisher = createJournalPublisher({ journalPath });
    const result = publisher.publish(FACTS);
    assert.equal(result.ok, true);
    assert.equal(result.target, "journal");
    assert.ok(fs.readFileSync(journalPath, "utf8").endsWith(renderEntry(FACTS)));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
