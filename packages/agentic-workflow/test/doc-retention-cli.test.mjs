/**
 * doc-retention-cli.test.mjs — `agentic-workflow doc archive|restore` (issue #651).
 *
 * The command is the only write surface of the feature, so the suite pins the
 * three things an operator can get wrong: the report that must name every row,
 * the refusal that must move no byte, and the config section that gates the trim
 * step without ever gating validation.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CLI } from "./fixtures.mjs";

const tmp = () => mkdtempSync(join(tmpdir(), "aw-retention-cli-"));
const rm = (dir) => rmSync(dir, { recursive: true, force: true });

const SPEC_REF = `---
type: feature
scope: small
---

# 42 — example

> One-line: an example unit.

\`\`\`text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
\`\`\`

## Specs

**S1 — do the thing.**
> verbatim ask

## Acceptance criteria

1. **AC1 (S1)** — the thing is done.

## Impact

none

## Non-goals

none

## Future cost

none

## Applicable tests

- \`true\`

## Known pre-existing issues

none

## Tasks

- P1 — do it (validator: \`true\` exits 0)
  (Implements: S1)

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-20, the request, verbatim:
  \`\`\`
  do the thing
  \`\`\`

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC1 | \`true\` | 0 | ok | phase |

## Next

ship it

## References

none
`;

const fixture = () => {
  const root = tmp();
  mkdirSync(join(root, "docs", "features", "42-example"), { recursive: true });
  writeFileSync(join(root, ".gitignore"), ".agentic-workflow/archive/\n");
  mkdirSync(join(root, ".pi"), { recursive: true });
  writeFileSync(join(root, ".pi", "agentic-workflow.json"), JSON.stringify({ docRetention: { mode: "archive" } }));
  writeFileSync(
    join(root, "docs", "ROADMAP.md"),
    [
      "# Roadmap",
      "",
      "## Features",
      "",
      "| NN | Slug | Status | Dependencies | Summary |",
      "|---|---|---|---|---|",
      "| 42 | `example` | done | — | shipped |",
      "| 43 | `ancient` | done | — | unstamped |",
      "",
      "## Fixes",
      "",
      "| Issue | Topic | Status |",
      "|---|---|---|",
      "",
    ].join("\n"),
  );
  writeFileSync(join(root, "docs", "features", "42-example", "SPEC.md"), SPEC_REF);
  writeFileSync(join(root, "docs", "features", "42-example", "progress.md"), "progress body");
  writeFileSync(join(root, "docs", "features", "42-example", "decisions.md"), "decision body");
  mkdirSync(join(root, "docs", "features", "43-ancient"), { recursive: true });
  writeFileSync(join(root, "docs", "features", "43-ancient", "SPEC.md"), SPEC_REF.replace(/```text\ndoc-provenance@1[\s\S]*?```\n/u, ""));
  return root;
};

const run = (root, ...args) => {
  const result = spawnSync(process.execPath, [CLI, "doc", ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

const digestTree = (root) => {
  const out = [];
  const walk = (rel) => {
    for (const entry of readdirSync(join(root, rel), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = rel === "" ? entry.name : `${rel}/${entry.name}`;
      if (entry.name === ".git") continue;
      if (entry.isDirectory()) walk(child);
      else out.push(`${child}:${createHash("sha256").update(readFileSync(join(root, child))).digest("hex")}`);
    }
  };
  walk("");
  return out;
};

test("doc archive --dry-run prints every row including the out-of-scope ones, and writes nothing", () => {
  const root = fixture();
  try {
    const before = digestTree(root);
    const result = run(root, "archive", "--dry-run", "--json");
    assert.equal(result.status, 0, result.stderr);
    const receipt = JSON.parse(result.stdout);
    assert.equal(receipt.dry_run, true);
    const states = Object.fromEntries(receipt.plan.rows.map((row) => [row.unit, row.state]));
    assert.equal(states["docs/features/42-example"], "eligible");
    assert.equal(states["docs/features/43-ancient"], "unstamped");
    assert.deepEqual(receipt.plan.out_of_scope.map((row) => row.unit), ["docs/features/43-ancient"]);
    assert.deepEqual(digestTree(root), before);
  } finally {
    rm(root);
  }
});

test("doc archive --unit trims one unit and doc restore puts it back", () => {
  const root = fixture();
  try {
    const archived = run(root, "archive", "--unit", "docs/features/42-example", "--json");
    assert.equal(archived.status, 0, archived.stderr);
    const receipt = JSON.parse(archived.stdout);
    assert.deepEqual(receipt.archived, ["docs/features/42-example"]);
    assert.equal(existsSync(join(root, "docs/features/42-example/progress.md")), false);
    assert.equal(readFileSync(join(root, "docs/features/42-example/decisions.md"), "utf8"), "decision body");

    const restored = run(root, "restore", "--unit", "docs/features/42-example", "--json");
    assert.equal(restored.status, 0, restored.stderr);
    assert.deepEqual(JSON.parse(restored.stdout).restored, ["progress.md"]);
    assert.equal(readFileSync(join(root, "docs/features/42-example/progress.md"), "utf8"), "progress body");
  } finally {
    rm(root);
  }
});

test("a refusal exits 2 with a DOC REFUSAL line and moves no byte", () => {
  const root = fixture();
  try {
    const before = digestTree(root);
    const result = run(root, "archive", "--unit", "docs/features/43-ancient");
    assert.equal(result.status, 2);
    assert.match(result.stderr, /DOC REFUSAL — unstamped/);
    assert.deepEqual(digestTree(root), before);
  } finally {
    rm(root);
  }
});

test("the config section gates the trim step only: keep-all refuses the write, reports the plan, and never invalidates a document", () => {
  const root = fixture();
  try {
    writeFileSync(join(root, ".pi", "agentic-workflow.json"), JSON.stringify({ docRetention: { mode: "keep-all" } }));

    const refused = run(root, "archive", "--unit", "docs/features/42-example");
    assert.equal(refused.status, 2);
    assert.match(refused.stderr, /mode-keep-all/);
    assert.equal(existsSync(join(root, "docs/features/42-example/progress.md")), true);

    // Detection still reports, and validation never reads the mode.
    const report = run(root, "archive", "--dry-run", "--json");
    assert.equal(report.status, 0, report.stderr);
    assert.equal(JSON.parse(report.stdout).plan.trim_allowed, false);

    const doc = run(root, "read", "--file", "docs/features/42-example/SPEC.md");
    assert.equal(doc.status, 0, doc.stderr);
  } finally {
    rm(root);
  }
});

test("doc archive demands an explicit target and refuses an unknown one", () => {
  const root = fixture();
  try {
    const none = run(root, "archive");
    assert.equal(none.status, 1);
    assert.match(none.stderr, /--unit|--all-eligible|--dry-run/);

    const unknown = run(root, "archive", "--unit", "docs/features/99-missing", "--json");
    assert.equal(unknown.status, 2);
    assert.match(unknown.stderr, /unknown-unit/);

    const restoreWithoutUnit = run(root, "restore");
    assert.equal(restoreWithoutUnit.status, 1);
    assert.match(restoreWithoutUnit.stderr, /--unit/);
  } finally {
    rm(root);
  }
});
