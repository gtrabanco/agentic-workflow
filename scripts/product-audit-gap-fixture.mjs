#!/usr/bin/env node
/**
 * Seeded coverage-gap fixture for product-audit's coverage-gap dimension
 * (issue #590 S7, the analogue of `scripts/product-audit-residue-fixture.mjs`).
 *
 * Writes two deterministic twin trees into the target directory:
 *
 *   <target>/seeded/ — exactly one seed per gap class:
 *     (a) criterion-uncovered  docs/workflow/VERIFICATION_CRITERIA.md names
 *                              `scripts/absent-check.mjs`, which does not exist
 *     (b) class-uncovered      two units carry the same admitted `workflow ×
 *                              fix-now` class and no detector names the axis
 *     (c) detector-idle        `idle-gate` is declared and no criterion names it
 *   <target>/clean/  — the same shape with all three seeds repaired.
 *
 * Each tree is a real git repository: the corpus admits a class only when its
 * row carries a fold commit whose own diff touches the named path and the class
 * recurs across two units, so the fixture commits the seed, a fold touching
 * `src/a.js`, and the recording commit that cites the fold's sha. Running the
 * join over `seeded/` must yield exactly one gap per class; over `clean/`, zero.
 * The trees are written on demand outside the repository — never committed.
 *
 * Usage: bun scripts/product-audit-gap-fixture.mjs <target-dir>
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const target = process.argv[2];
if (!target) {
  console.error("usage: bun scripts/product-audit-gap-fixture.mjs <target-dir>");
  process.exit(1);
}

const CRITERIA_HEADER = [
  "| Criterion | Applies to (surface type) | Provenance | Source / authority | Notes |",
  "|---|---|---|---|---|",
];

const INVENTORY_HEADER = [
  "```text",
  "prose-gate-inventory@1",
  "gate-id | statement | carrier | file | section | token | surfaces | safety | recurrence | checkability | tier | stay-reason | rederive",
];

const gateRow = (id, statement) => `${id} | ${statement} | script | scripts/demo.test.mjs | - | demo token | - | 2 | 3 | 3 | script | - | -`;

const unitDoc = (id, axis) => `# ${id}

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | S1 · src/a.js | ${axis} | warning | blocking | product | fold |

## Log

`;

const files = (axis, criteriaNotes, gates) => ({
  "AGENTS.md": "# Fixture guide\n\nA throwaway project the coverage-gap join reads.\n",
  "docs/workflow/VERIFICATION_CRITERIA.md": [
    "# Verification criteria catalogue",
    "",
    "## Criteria",
    "",
    ...CRITERIA_HEADER,
    "| Suite green before every commit | code | workflow-generic | agent guide §Commands | `bun test` |",
    `| Docs page per feature | docs | project-declared | decision D1 | ${criteriaNotes} |`,
    "| Boundary enforced by a machine | architecture | project-declared | charter answer | `demo-gate` |",
    "",
  ].join("\n"),
  "docs/workflow/GATE_INVENTORY.md": [
    "# Gate inventory",
    "",
    ...INVENTORY_HEADER,
    ...gates.map(([id, statement]) => gateRow(id, statement)),
    "```",
    "",
  ].join("\n"),
  "docs/features/001-demo/SPEC.md": unitDoc("001 — demo", axis),
  "docs/features/002-demo/SPEC.md": unitDoc("002 — demo", axis),
  "src/a.js": "export const demo = 1;\n",
  "scripts/demo.test.mjs": "// the fixture's named gate suite — never run, only resolved.\n",
});

const TREES = {
  seeded: files(
    "workflow",
    "`scripts/absent-check.mjs`",
    [
      ["demo-gate", "the demo gate a criterion names"],
      ["idle-gate", "a declared gate no criterion names"],
    ],
  ),
  clean: files(
    "code",
    "`bun run docs:check`",
    [["demo-gate", "the demo gate a criterion names"]],
  ),
};

/** Run git in a fixture tree with identity passed per invocation (the
 *  repository's `-c`-only convention: no config file is ever written). */
function git(dir, args) {
  const result = spawnSync(
    "git",
    ["-C", dir, "-c", "user.name=fixture", "-c", "user.email=fixture@example.test", "-c", "commit.gpgsign=false", "-c", "init.defaultBranch=main", ...args],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

for (const [tree, entries] of Object.entries(TREES)) {
  const dir = path.join(target, tree);
  for (const [rel, content] of Object.entries(entries)) {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }

  git(dir, ["init", "-q"]);
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "fixture: seed the tree"]);

  fs.appendFileSync(path.join(dir, "src/a.js"), "// repaired by this commit\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "fixture: the fold commit"]);
  const fold = git(dir, ["rev-parse", "HEAD"]);

  for (const unit of ["001-demo", "002-demo"]) {
    fs.appendFileSync(
      path.join(dir, "docs/features", unit, "SPEC.md"),
      `- **F1** — 2026-01-01, repaired in the fold · fold ${fold}\n`,
    );
  }
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "fixture: record the fold"]);
}

console.log(`seeded coverage-gap fixture written to ${target} (seeded/ + clean/)`);
