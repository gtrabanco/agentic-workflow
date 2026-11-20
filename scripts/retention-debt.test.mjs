// test-obligation: protects=scripts/retention-debt.mjs obligations=contract,failure-path

/**
 * retention-debt.test.mjs — the retention-debt producer (issue #651 S8).
 *
 * The product-audit dimension reuses the eligibility predicate instead of
 * re-deriving it, so this suite pins three things and nothing else: the receipt's
 * fixed block, one finding per class on a seeded tree, and a clean settled tree
 * answering `PASS`. The fixtures are throwaway trees under the OS temp dir.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FINDING_CODES, RECEIPT, analyze } from "./retention-debt.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "scripts", "retention-debt.mjs");

const cleanup = [];
const tempTree = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "retention-debt-"));
  cleanup.push(dir);
  return dir;
};
test.after(() => {
  for (const dir of cleanup) fs.rmSync(dir, { recursive: true, force: true });
  cleanup.length = 0;
});

const write = (root, rel, text) => {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text);
};

const SPEC = (format = "unit-doc@2") => `---
type: feature
scope: small
---

# 42 — example

> One-line: an example unit.

\`\`\`text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: ${format}
grammars: {"log-kind":1,"obligations":1,"unit-doc":1}
\`\`\`

## Specs

**S1 — do the thing.**
> verbatim ask

## Acceptance criteria

1. **AC1 (S1)** — done.

## Impact

none

## Non-goals

none

## Future cost

none

## Known pre-existing issues

none

## Log

- **L1** — 2026-01-01, the request, verbatim:
  \`\`\`
  do the thing
  \`\`\`

## References

none
`;

const ROADMAP = (rows) => [
  "# Roadmap",
  "",
  "## Features",
  "",
  "| NN | Slug | Status | Dependencies | Summary |",
  "|---|---|---|---|---|",
  ...rows,
  "",
  "## Fixes",
  "",
  "| Issue | Topic | Status |",
  "|---|---|---|",
  "",
].join("\n");

const run = (args) => spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8" });

test("the receipt declares the contract, the counts and the verdict", () => {
  const root = tempTree();
  write(root, "docs/ROADMAP.md", ROADMAP(["| 42 | `example` | done | — | shipped |"]));
  write(root, "docs/features/42-example/SPEC.md", SPEC());
  write(root, "docs/features/42-example/progress.md", "p");

  const result = run([root]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`^${RECEIPT}$`, "mu"));
  assert.match(result.stdout, /^units \| 1$/mu);
  assert.match(result.stdout, /^pending \| 1$/mu);
  assert.match(result.stdout, /^finding \| pending-trim \| docs\/features\/42-example \|/mu);
  assert.match(result.stdout, /^verdict \| DEBT$/mu);
});

test("one finding per class: pending, unstamped and unclassified", () => {
  const root = tempTree();
  write(root, "docs/ROADMAP.md", ROADMAP([
    "| 42 | `example` | done | — | shipped |",
    "| 43 | `ancient` | done | — | unstamped |",
    "| 44 | `messy` | done | — | notes |",
  ]));
  write(root, "docs/features/42-example/SPEC.md", SPEC());
  write(root, "docs/features/42-example/progress.md", "p");
  write(root, "docs/features/43-ancient/SPEC.md", SPEC().replace(/```text\ndoc-provenance@1[\s\S]*?```\n/u, ""));
  write(root, "docs/features/44-messy/SPEC.md", SPEC());
  write(root, "docs/features/44-messy/notes.md", "a file the matrix does not classify");

  const report = analyze(root);
  const codes = report.findings.map((finding) => finding.code).sort();
  assert.deepEqual(codes, ["pending-trim", "unclassified-file", "unstamped-doc"]);
  assert.ok(report.findings.every((finding) => FINDING_CODES.includes(finding.code)));
});

test("a settled tree answers PASS, because a settled unit is not debt", () => {
  const root = tempTree();
  write(root, "docs/ROADMAP.md", ROADMAP(["| 42 | `example` | done | — | shipped |"]));
  write(root, "docs/features/42-example/SPEC.md", SPEC("unit-doc@3"));
  write(root, "docs/features/42-example/decisions.md", "d");

  const result = run([root, "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const document = JSON.parse(result.stdout);
  assert.equal(document.contract, RECEIPT);
  assert.deepEqual(document.findings, []);
  assert.equal(document.verdict, "PASS");
});

test("usage: an unknown flag is exit 2, never a silent run", () => {
  const result = run(["--nonsense"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage/u);
});
