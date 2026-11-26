#!/usr/bin/env node
// test-obligation: protects=skills/pre-execution-review/references/LEDGERS.md obligations=contract,convention,coherence

/**
 * machine-ledger-policy.test.mjs — the machine-owned ledger class has one owner
 * and three sources that agree (issue #727 S3/S4).
 *
 * A class declared in three places is a class with three truths unless one of
 * them is machine-owned and the others are checked against it. Here the machine
 * statement is `MACHINE_LEDGER_CLASSES`; `LEDGERS.md`'s
 * `machine-ledger-commit@1` block is its prose projection, and `.gitattributes`
 * is the merge layer's own declaration. The suite fails in both directions, so
 * neither a row added to the block alone nor a merge line added alone survives.
 *
 * It also pins the two surfaces the same class touches: the gate's prelude
 * declaration (S2) and `needs-triage`'s exit (S4), which has no other reader.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { MACHINE_LEDGER_CLASSES, MACHINE_LEDGER_ZONES, isMachineLedgerPath } from "../packages/agentic-workflow/src/machine-ledger/index.mjs";
import { STEPS } from "./local-gate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

const MAP_REL = "skills/pre-execution-review/references/LEDGERS.md";
const MARKER = "machine-ledger-commit@1";

/** One fenced `MARKER` block: header, data rows and `#` directives. */
export function parsePolicyBlock(text, marker = MARKER) {
  const lines = String(text ?? "").split("\n");
  const opener = lines.findIndex((line) => /^\s*(?:```|~~~)/u.test(line) && lines[lines.indexOf(line) + 1]?.trim() === marker);
  const at = opener === -1 ? lines.findIndex((line, index) => line.trim() === marker && /^\s*(?:```|~~~)/u.test(lines[index - 1] ?? "")) : opener;
  if (at === -1) return null;
  const rows = [];
  const directives = [];
  let header = null;
  for (let index = at + 2; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*(?:```|~~~)/u.test(line)) break;
    const trimmed = line.trim();
    if (trimmed === "") continue;
    if (trimmed.startsWith("#")) {
      directives.push(trimmed);
      continue;
    }
    const cells = trimmed.split(" | ").map((cell) => cell.trim());
    if (header === null) {
      header = cells;
      continue;
    }
    if (cells.every((cell) => /^-{2,}$/u.test(cell))) continue;
    if (cells.length !== header.length) throw new Error(`row has ${cells.length} cells, header has ${header.length}: ${trimmed}`);
    rows.push(Object.fromEntries(header.map((name, index) => [name, cells[index]])));
  }
  return header === null ? null : { header, rows, directives };
}

/** The paths `.gitattributes` declares for the shared-merge classes. */
export function declaredMergePaths(text) {
  const lines = [];
  for (const line of String(text ?? "").split("\n")) {
    const match = /^(\S+)\s+merge=(agentic-shared-[a-z-]+)\s*$/u.exec(line.trim());
    if (match === null) continue;
    lines.push({ path: match[1], merge: match[2] });
  }
  return lines;
}

/**
 * Both directions of the class's truth, as data: the block, the machine constant
 * and `.gitattributes` must describe the same rows. Returns one string per drift.
 */
export function parityFaults({ block, classes, attributes }) {
  const faults = [];
  if (block === null) return ["the machine-ledger-commit@1 block is missing or malformed"];
  const byClass = new Map(classes.map((row) => [row.class, row]));
  const blockIds = block.rows.map((row) => row.class);
  if (new Set(blockIds).size !== blockIds.length) faults.push("the block names a class twice");
  for (const id of byClass.keys()) if (!blockIds.includes(id)) faults.push(`the block omits class ${id}`);
  for (const id of blockIds) if (!byClass.has(id)) faults.push(`the block declares class ${id}, which the machine statement does not`);

  const attributePaths = new Map(attributes.map((row) => [row.path, row.merge]));
  for (const row of block.rows) {
    const machine = byClass.get(row.class);
    if (machine === undefined) continue;
    if (row.zone !== machine.zone) faults.push(`${row.class}: block zone ${row.zone}, machine zone ${machine.zone}`);
    if (row.subject !== machine.subject) faults.push(`${row.class}: block subject ${row.subject}, machine subject ${machine.subject}`);
    const declaredMerge = row.merge === "none" ? null : row.merge;
    for (const literal of machine.paths ?? []) {
      if (!String(row.paths).includes(literal)) faults.push(`${row.class}: block paths do not name ${literal}`);
      if (declaredMerge !== null) {
        if (attributePaths.get(literal) !== declaredMerge) {
          faults.push(`${row.class}: ${literal} is declared ${declaredMerge} by the block, ${attributePaths.get(literal) ?? "nothing"} by .gitattributes`);
        }
      }
    }
  }
  for (const row of attributes) {
    const owner = block.rows.find((entry) => String(entry.paths).split(" · ").includes(row.path));
    if (owner === undefined) faults.push(`.gitattributes declares ${row.path}, which no class row claims`);
    else if (owner.merge !== row.merge) faults.push(`.gitattributes declares ${row.path} as ${row.merge}, the block as ${owner.merge}`);
  }
  for (const row of block.rows) {
    if (!MACHINE_LEDGER_ZONES.includes(row.zone)) faults.push(`${row.class}: ${row.zone} is not a zone`);
    if (!/·|writer|step|gate|teardown|aggregator|none/u.test(row["commit-point"])) {
      faults.push(`${row.class}: commit-point states no mechanical or writer step`);
    }
    if (row.paths.trim() === "" || row.subject.trim() === "") faults.push(`${row.class}: an empty cell`);
  }
  return faults;
}

test("the three sources name the same paths in both directions", () => {
  const block = parsePolicyBlock(read(MAP_REL));
  assert.notEqual(block, null, `${MARKER} is missing from ${MAP_REL}`);
  assert.deepEqual(block.header, ["class", "paths", "merge", "zone", "commit-point", "subject"]);
  const faults = parityFaults({ block, classes: MACHINE_LEDGER_CLASSES, attributes: declaredMergePaths(read(".gitattributes")) });
  assert.deepEqual(faults, []);
});

test("an injected class on one side alone fails", () => {
  const block = parsePolicyBlock(read(MAP_REL));
  const attributes = declaredMergePaths(read(".gitattributes"));

  const blockOnly = { ...block, rows: [...block.rows, { class: "shadow", paths: "docs/shadow.md", merge: "none", zone: "auto", "commit-point": "gate prelude", subject: "docs(shadow)" }] };
  assert.match(parityFaults({ block: blockOnly, classes: MACHINE_LEDGER_CLASSES, attributes }).join("\n"), /the block declares class shadow/u);

  const machineOnly = [...MACHINE_LEDGER_CLASSES, { class: "shadow", zone: "auto", paths: ["docs/shadow.md"], subject: "docs(shadow)", merge: null }];
  assert.match(parityFaults({ block, classes: machineOnly, attributes }).join("\n"), /the block omits class shadow/u);

  const attributeOnly = [...attributes, { path: "docs/shadow.md", merge: "agentic-shared-logs" }];
  assert.match(parityFaults({ block, classes: MACHINE_LEDGER_CLASSES, attributes: attributeOnly }).join("\n"), /which no class row claims/u);

  assert.deepEqual(parityFaults({ block: null, classes: MACHINE_LEDGER_CLASSES, attributes }), ["the machine-ledger-commit@1 block is missing or malformed"]);
});

test("every class row names its zone and its commit point", () => {
  const block = parsePolicyBlock(read(MAP_REL));
  for (const row of block.rows) {
    assert.ok(MACHINE_LEDGER_ZONES.includes(row.zone), `${row.class} zone`);
    assert.ok(row["commit-point"].trim() !== "", `${row.class} commit point`);
  }
  const prefix = block.directives.find((line) => line.startsWith("# exempt-from-dirty-tree:"));
  assert.equal(prefix, "# exempt-from-dirty-tree: every row whose zone is not out-of-scope", "the exemption set is declared, never inferred by a reader");
});

test("the declared class recognises each of its own rows", () => {
  for (const sample of [
    "docs/fix/727-machine-ledger-commits/review-findings.md",
    "docs/fix/727-machine-ledger-commits/known-issues.md",
    "docs/fix/727-machine-ledger-commits/decisions.md",
    "docs/features/61/planning-findings.md",
  ]) {
    assert.equal(isMachineLedgerPath(sample), true, sample);
  }
  assert.equal(isMachineLedgerPath("docs/fix/727-machine-ledger-commits/SPEC.md"), false, "a unit doc is not a ledger row");
});

test("the gate's class commit is a prelude, never a pool step", () => {
  const preludes = STEPS.filter((step) => step.prelude === true);
  assert.deepEqual(preludes.map((step) => step.id), ["machine-ledger-commit"], "exactly one prelude, declared once");
  assert.equal(preludes[0].tests, false, "a prose-only push still commits its ledger rows");
});

test("the triage pass removes needs-triage on every published verdict", () => {
  const labels = read("skills/triage-issue/references/LABELS.md");
  assert.match(labels, /## The triage-state label \(owned here\)/u, "the label's lifecycle has an owner section");
  assert.match(labels, /`needs-triage`/u);
  assert.match(labels, /`gh issue edit <N> --remove-label needs-triage`/u, "the removal command is stated once");
  assert.match(labels, /every published verdict/u, "the removal is bound to the verdict, not to a memory");
  assert.match(labels, /`remove`/u, "the remove verdict clears it too");

  const process = read("skills/triage-issue/references/ISSUE_PROCESS.md");
  assert.match(process, /--remove-label needs-triage/u, "the pass runs the removal");
  assert.match(process, /loud/u, "the failure is loud, like the urgency labels");
  assert.match(process, /4\. \*\*Classify\*\*/u, "the removal is stated in the classify step");
});

test("the removal rule is loud on failure and never touches human-revision-needed", () => {
  const labels = read("skills/triage-issue/references/LABELS.md");
  const section = labels.slice(labels.indexOf("## The triage-state label (owned here)"));
  assert.match(section.slice(0, section.indexOf("## Review-gate label vocabulary")), /states that failure explicitly/u);
  assert.doesNotMatch(labels, /--remove-label human-revision-needed/u, "IR5: only a human removes the review hold");
});

test("every exempting surface cites the policy block", () => {
  const surfaces = [
    "skills/orchestration-envelope/references/TURN_CONTRACT.md",
    "skills/review-change/references/PERSIST_AND_DECIDE.md",
    "skills/review-change/references/REVIEW_PROCESS.md",
  ];
  for (const surface of surfaces) {
    assert.match(read(surface), new RegExp(MARKER, "u"), `${surface} cites ${MARKER}`);
  }
});
