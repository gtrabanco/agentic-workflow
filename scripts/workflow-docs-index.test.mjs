/**
 * The `docs/workflow/` index is complete — this repository's own doc map.
 *
 * `docs/workflow/README.md` is the entry point to the tutorial that ships with
 * this repo; a document that is not in it is a document nobody arrives at.
 * Three of them once were, for months, because nothing checked: a new file
 * lands in a commit whose axis is something else (a skill, the normalized
 * repository state, the bootstrap prompt) and the index table is never part of
 * that thought.
 *
 * The rule this test pins is deliberately total, so it cannot rot into a
 * half-true list: **every file in `docs/workflow/` is either a page in the
 * index or an entry in its `## Data` table, and the two sets are exactly the
 * files on disk.** Adding a document without a row fails here, naming the file;
 * adding a row for a file that does not exist fails too, in both directions.
 *
 * Repository-specific by construction: `docs/workflow/` is this repository's
 * own tutorial, not a path any target project receives. It rides the root gate
 * (`node --test scripts/*.test.mjs`), never the shipped skills.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS_DIR = path.join(REPO_ROOT, "docs", "workflow");
const INDEX = path.join(DOCS_DIR, "README.md");

/** The index itself documents the directory; it is never a row in its own table. */
const SELF = "README.md";

/**
 * Every file under `docs/workflow/`, excluded set included, as `{ pages,
 * data }` — the split the index declares. Parsed from the two tables so the
 * test reads the same surface a human does, not a second copy of the list.
 */
function declared() {
  const text = fs.readFileSync(INDEX, "utf8");
  const pages = [];
  const data = [];
  let section = null;
  for (const line of text.split("\n")) {
    if (/^##\s+Pages\s*$/u.test(line)) {
      section = pages;
      continue;
    }
    if (/^##\s+Data\s*$/u.test(line)) {
      section = data;
      continue;
    }
    if (/^##\s+\S/u.test(line)) {
      section = null;
      continue;
    }
    if (section === null) continue;
    // A table row whose first cell is a link to a sibling file, or a
    // backticked filename for the data table.
    const link = /^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|/u.exec(line);
    if (link) {
      section.push(link[2]);
      continue;
    }
    const bare = /^\|\s*`([^`]+)`\s*\|/u.exec(line);
    if (bare) section.push(bare[1]);
  }
  return { pages, data };
}

/** Every entry in `docs/workflow/`, `README.md` aside — what the index must cover. */
function onDisk() {
  return fs
    .readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name !== SELF)
    .sort();
}

describe("the docs/workflow index covers the directory exactly", () => {
  it("declares every file that exists and no file that does not", () => {
    const { pages, data } = declared();
    const seen = [...pages, ...data].sort();
    const files = onDisk();

    const missing = files.filter((name) => !seen.includes(name));
    assert.deepEqual(missing, [], `docs/workflow/README.md must index: ${missing.join(", ")}`);

    const phantom = seen.filter((name) => !files.includes(name));
    assert.deepEqual(phantom, [], `docs/workflow/README.md indexes files that do not exist: ${phantom.join(", ")}`);
  });

  it("partitions the directory — a file is a page or data, never both, never neither", () => {
    const { pages, data } = declared();
    const both = pages.filter((name) => data.includes(name));
    assert.deepEqual(both, [], `declared as both a page and a data file: ${both.join(", ")}`);
  });

  it("keeps the machine-input table to machine input", () => {
    // The only file this directory carries as data rather than prose. A markdown
    // document appearing here would be a page hiding from the Pages table.
    const { data } = declared();
    for (const name of data) {
      assert.ok(name.endsWith(".json"), `${name} is listed as data but is not a data file — pages belong in ## Pages`);
    }
  });

  it("links every page to a file in the directory, so the index has no dead entry", () => {
    const { pages } = declared();
    for (const name of pages) {
      assert.ok(fs.existsSync(path.join(DOCS_DIR, name)), `the index links ${name}, which does not exist in docs/workflow/`);
    }
  });

  it("names each page once — no duplicate rows", () => {
    const { pages } = declared();
    assert.deepEqual(pages, [...new Set(pages)], "a page is listed more than once");
  });
});
