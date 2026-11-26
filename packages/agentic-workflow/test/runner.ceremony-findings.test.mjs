// test-obligation: protects=packages/agentic-workflow/src/runner/ceremony/findings.mjs,packages/agentic-workflow/src/runner/findings-carrier.mjs obligations=contract,failure-path,state-integrity
/**
 * runner.ceremony-findings.test.mjs — issue #702: the findings carrier keeps its
 * prose and its identity, and one grammar is in force.
 *
 * Every case drives the shipped CLI over a throwaway unit, and the two field
 * reproducers the issue reports are cases here: a report-only note under the
 * table survives a rewrite (fix-101 fold A1), and a `## Log` line that merely
 * cites an older finding never feeds the next id (the `F1`+`F3` → `F15` jump).
 *
 * Cases (owner ids in the obligation ledger):
 *   O1  the section rewrite keeps prose, for every write op
 *   O2  a section with no carrier table is refused, naming what would be lost
 *   O3  a fold's log line is numbered with the closed finding's own id
 *   O4  `append --id` writes the id the caller names; a used id is refused
 *   O5  the next id comes from the carrier, never from prose
 *   O6  two carriers at once are a typed defect naming both paths
 *   O7  the wrong grammar (or the superseded one) is reported, and refused for writing
 *   O8  the legacy side ledger stays readable and is never rewritten
 *   O17 the carrier's unchanged behaviour still answers the same way
 *   AC3  the class cell resolves against the published set
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PRE_EXECUTION_FINDING_CLASSES } from "@gtrabanco/agentic-workflow-schema";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));

/** The three published header lines, copied from the carriers they belong to. */
const TABLE_V1 = "| id | S# / file:line | axis | severity | impact | class | route |\n|---|---|---|---|---|---|---|";
const TABLE_V0 = "| id | S# / file:line | axis | severity | class | route |\n|---|---|---|---|---|---|";
const TABLE_LEDGER = "| id | file:line | axis | severity | class | route | folded |\n|---|---|---|---|---|---|---|";

const ROW_V1 = (n, target = `src/a${n}.mjs:1`) =>
  `| F${n} | ${target} | code | WARNING | blocking | source | fold |`;
const ROW_V0 = (n) => `| F${n} | src/a${n}.mjs:1 | code | WARNING | source | fold |`;
const ROW_LEDGER = (n, folded = "no") => `| F${n} | src/a${n}.mjs:1 | code | WARNING | source | fold | ${folded} |`;

function run(cwd, ...args) {
  try {
    return { code: 0, stdout: execFileSync(process.execPath, [BIN, "ceremony", ...args], { cwd, encoding: "utf8" }), stderr: "" };
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
  }
}

const json = (result) => {
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
};

/**
 * A throwaway unit whose `## Findings` and `## Log` are exactly the bytes the
 * case needs. `findingsBody === null` writes a doc with no `## Findings`
 * section at all — the legacy unit shape.
 */
function makeUnit(t, { findingsBody = "", logBody = "", findingsSection = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), "ceremony-findings-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const dir = join(root, "docs/fix/77-toy");
  mkdirSync(dir, { recursive: true });
  const sections = ["# 77-toy", "", "## Specs", "", "S1 — toy.", ""];
  if (findingsSection) sections.push("## Findings", "", findingsBody, "");
  sections.push("## Log", "", logBody, "", "## Next", "", "none", "");
  writeFileSync(join(dir, "SPEC.md"), sections.join("\n"));
  const spec = () => readFileSync(join(dir, "SPEC.md"), "utf8");
  const write = (rel, text) => writeFileSync(join(dir, rel), text);
  return { root, dir, spec, write };
}

const findingsOf = (text) => {
  const start = text.indexOf("## Findings");
  const end = text.indexOf("## Log");
  return text.slice(start, end);
};
const logOf = (text) => text.slice(text.indexOf("## Log"), text.indexOf("## Next"));

test("O1 a section rewrite keeps the report-only prose under the table", (t) => {
  const prose = "Report-only record (findings-table@1 keeps this as prose): the sink was audited in fix-101 A1, no code change.";
  const { root, spec } = makeUnit(t, { findingsBody: `${TABLE_V1}\n${ROW_V1(1)}\n\n${prose}` });
  const appended = run(root, "findings", "append", "--slug", "77-toy", "--file", "src/b.mjs", "--line", "2", "--axis", "tests", "--severity", "SUGGESTION", "--impact", "report-only", "--class", "source", "--route", "fold");
  assert.equal(appended.code, 0, appended.stdout + appended.stderr);
  assert.ok(findingsOf(spec()).includes(prose), `the prose survived append:\n${findingsOf(spec())}`);
  assert.match(findingsOf(spec()), /^\| F2 \| src\/b\.mjs:2 \|/mu, "and the row landed in the same table");
});

test("O1 every write op keeps non-table prose (append, update, delete, delete-all, merge)", (t) => {
  const prose = "Report-only record: kept as prose, never as a row.";
  const { root, spec } = makeUnit(t, { findingsBody: `${TABLE_V1}\n${ROW_V1(1)}\n${ROW_V1(2)}\n\n${prose}` });

  const folded = run(root, "findings", "update", "--slug", "77-toy", "--id", "F1", "--folded", "true");
  assert.equal(folded.code, 0, folded.stdout + folded.stderr);
  assert.ok(findingsOf(spec()).includes(prose), "update --folded keeps the prose");

  const updated = run(root, "findings", "update", "--slug", "77-toy", "--id", "F2", "--severity", "CRITICAL");
  assert.equal(updated.code, 0, updated.stdout + updated.stderr);
  assert.ok(findingsOf(spec()).includes(prose), "update keeps the prose");

  const added = run(root, "findings", "append", "--slug", "77-toy", "--file", "src/c.mjs", "--line", "3", "--axis", "code", "--severity", "WARNING", "--impact", "blocking", "--class", "source", "--route", "fold");
  assert.equal(added.code, 0, added.stdout + added.stderr);
  assert.ok(findingsOf(spec()).includes(prose), "append keeps the prose");

  const merge = run(root, "findings", "merge", "--slug", "77-toy", "--ids", "F2,F3");
  assert.equal(merge.code, 0, merge.stdout + merge.stderr);
  assert.ok(findingsOf(spec()).includes(prose), "merge keeps the prose");

  const deleted = run(root, "findings", "delete", "--slug", "77-toy", "--id", "F2");
  assert.equal(deleted.code, 0, deleted.stdout + deleted.stderr);
  assert.ok(findingsOf(spec()).includes(prose), "delete keeps the prose");

  const cleared = run(root, "findings", "delete-all", "--slug", "77-toy");
  assert.equal(cleared.code, 0, cleared.stdout + cleared.stderr);
  assert.ok(findingsOf(spec()).includes(prose), "delete-all keeps the prose");
  assert.match(findingsOf(spec()), /^\| id \| S# \/ file:line \|/mu, "and the empty table is still the carrier's own header");
});

test("O2 a section without the carrier table is refused, naming what would be lost", (t) => {
  const prose = "A note a reviewer wrote with no table under it.";
  const { root, spec } = makeUnit(t, { findingsBody: prose });
  const before = spec();
  const appended = run(root, "findings", "append", "--slug", "77-toy", "--file", "src/a.mjs", "--line", "1", "--axis", "code", "--severity", "WARNING", "--impact", "blocking", "--class", "source", "--route", "fold");
  assert.equal(appended.code, 1, appended.stdout + appended.stderr);
  assert.equal(json(appended).error, "carrier-table-missing");
  assert.equal(json(appended).section, "Findings");
  assert.equal(spec(), before, "nothing is written over prose the writer cannot place");
});

test("O3 a fold writes the F log line under the finding's own id", (t) => {
  const { root, spec } = makeUnit(t, { findingsBody: `${TABLE_V1}\n${ROW_V1(1)}\n${ROW_V1(3)}` });
  const first = run(root, "findings", "update", "--slug", "77-toy", "--id", "F1", "--folded", "true");
  assert.equal(first.code, 0, first.stdout + first.stderr);
  const second = run(root, "findings", "update", "--slug", "77-toy", "--id", "F3", "--folded", "true");
  assert.equal(second.code, 0, second.stdout + second.stderr);
  const log = logOf(spec());
  assert.match(log, /^- \*\*F1\*\* — \d{4}-\d{2}-\d{2}, folded F1 \(code\): src\/a1\.mjs:1/mu, log);
  assert.match(log, /^- \*\*F3\*\* — \d{4}-\d{2}-\d{2}, folded F3 \(code\): src\/a3\.mjs:1/mu, `a fold line's number is the id it closed, never an independent counter:\n${log}`);
  assert.doesNotMatch(log, /\*\*F2\*\*/u, "no fold counter invents an id nobody closed");
});

test("O4 append accepts --id and refuses an id the carrier already used", (t) => {
  const { root, spec } = makeUnit(t, { findingsBody: `${TABLE_V1}\n${ROW_V1(1)}\n${ROW_V1(3)}` });
  const explicit = run(root, "findings", "append", "--slug", "77-toy", "--id", "F2", "--file", "src/b.mjs", "--line", "2", "--axis", "tests", "--severity", "WARNING", "--impact", "blocking", "--class", "source", "--route", "fold");
  assert.equal(explicit.code, 0, explicit.stdout + explicit.stderr);
  assert.match(findingsOf(spec()), /^\| F2 \| src\/b\.mjs:2 \|/mu, "--id writes the id the caller named");

  const reused = run(root, "findings", "append", "--slug", "77-toy", "--id", "F1", "--file", "src/c.mjs", "--line", "3", "--axis", "code", "--severity", "WARNING", "--impact", "blocking", "--class", "source", "--route", "fold");
  assert.equal(reused.code, 1, reused.stdout + reused.stderr);
  assert.equal(json(reused).error, "duplicate-finding-id");
  assert.equal(json(reused).id, "F1");

  const fold = run(root, "findings", "update", "--slug", "77-toy", "--id", "F3", "--folded", "true");
  assert.equal(fold.code, 0, fold.stdout + fold.stderr);
  const closed = run(root, "findings", "append", "--slug", "77-toy", "--id", "F3", "--file", "src/d.mjs", "--line", "4", "--axis", "code", "--severity", "WARNING", "--impact", "blocking", "--class", "source", "--route", "fold");
  assert.equal(closed.code, 1, "a folded id is a used id");
  assert.equal(json(closed).error, "duplicate-finding-id");
});

test("O5 the next id comes from the carrier, never from prose citing an older id", (t) => {
  const { root, spec } = makeUnit(t, {
    findingsBody: `${TABLE_V1}\n${ROW_V1(1)}`,
    logBody: "- **R1** — 2026-11-23, HEAD abc, verdict BLOCKED (the review cited F9 and F14)\n- **D1** — 2026-11-23, the fix-101 ledger's F11 note stands",
  });
  const appended = run(root, "findings", "append", "--slug", "77-toy", "--file", "src/b.mjs", "--line", "2", "--axis", "code", "--severity", "WARNING", "--impact", "blocking", "--class", "source", "--route", "fold");
  assert.equal(appended.code, 0, appended.stdout + appended.stderr);
  assert.equal(json(appended).finding.id, "F2", `the next free id after F1 is F2, not F15:\n${spec()}`);
});

test("O6 dual carriers are a typed defect naming both paths", (t) => {
  const { root, write } = makeUnit(t, { findingsBody: `${TABLE_V1}\n${ROW_V1(1)}` });
  write("review-findings.md", `# Findings\n\n${TABLE_LEDGER}\n${ROW_LEDGER(1)}\n`);
  for (const argv of [
    ["findings", "read", "--slug", "77-toy"],
    ["findings", "append", "--slug", "77-toy", "--file", "src/b.mjs", "--line", "2", "--axis", "code", "--severity", "WARNING", "--impact", "blocking", "--class", "source", "--route", "fold"],
  ]) {
    const result = run(root, ...argv);
    assert.equal(result.code, 1, `${argv[1]} refuses a unit with two carriers: ${result.stdout}${result.stderr}`);
    assert.equal(json(result).error, "dual-findings-carrier");
    assert.deepEqual(json(result).paths, ["docs/fix/77-toy/SPEC.md", "docs/fix/77-toy/review-findings.md"]);
  }
});

test("O7 a doc table in the ledger grammar is a typed defect, and every write refuses it", (t) => {
  const prose = "Report-only record: prose the ledger grammar has no cell for.";
  const { root, spec } = makeUnit(t, { findingsBody: `${TABLE_LEDGER}\n${ROW_LEDGER(1)}\n${ROW_LEDGER(2, "yes")}\n\n${prose}` });
  const read = run(root, "findings", "read", "--slug", "77-toy");
  assert.equal(read.code, 1, `a carrier parsed in the other grammar is a loud, typed defect: ${read.stdout}`);
  assert.equal(json(read).error, "wrong-carrier-grammar");
  assert.equal(json(read).grammar, "findings-ledger@1");
  assert.equal(json(read).expected, "findings-table@1");

  const before = spec();
  const appended = run(root, "findings", "append", "--slug", "77-toy", "--file", "src/b.mjs", "--line", "2", "--axis", "code", "--severity", "WARNING", "--impact", "blocking", "--class", "source", "--route", "fold");
  assert.equal(appended.code, 1);
  assert.equal(json(appended).error, "wrong-carrier-grammar");
  assert.equal(spec(), before, "the writer never shifts a cell it cannot place");
});

test("O7 a superseded six-column table is read as its own grammar and refused for writing", (t) => {
  const { root, spec } = makeUnit(t, { findingsBody: `${TABLE_V0}\n${ROW_V0(1)}` });
  const read = run(root, "findings", "read", "--slug", "77-toy");
  assert.equal(read.code, 0, read.stdout + read.stderr);
  assert.equal(json(read).grammar, "findings-table@0");
  assert.deepEqual(json(read).defects.map((defect) => defect.code), ["superseded-grammar"]);
  assert.equal(json(read).findings[0].id, "F1");
  assert.equal(json(read).findings[0].target, "src/a1.mjs:1", "the row reads by its header, never by position");

  const before = spec();
  const appended = run(root, "findings", "append", "--slug", "77-toy", "--file", "src/b.mjs", "--line", "2", "--axis", "code", "--severity", "WARNING", "--impact", "blocking", "--class", "source", "--route", "fold");
  assert.equal(appended.code, 1, appended.stdout + appended.stderr);
  assert.equal(json(appended).error, "superseded-grammar");
  assert.equal(spec(), before, "adding an impact cell to an old row would shift every cell after it");
});

test("O8 the legacy side ledger stays readable and is never rewritten", (t) => {
  const { root, spec, write } = makeUnit(t, { findingsSection: false });
  write("review-findings.md", `# Findings\n\n${TABLE_LEDGER}\n${ROW_LEDGER(1)}\n${ROW_LEDGER(2, "yes")}\n`);
  const ledgerBefore = readFileSync(join(root, "docs/fix/77-toy/review-findings.md"), "utf8");
  const read = run(root, "findings", "read", "--slug", "77-toy");
  assert.equal(read.code, 0, read.stdout + read.stderr);
  assert.equal(json(read).carrier, "legacy");
  assert.equal(json(read).grammar, "findings-ledger@1");
  assert.deepEqual(json(read).defects, []);
  assert.deepEqual(json(read).findings.map((row) => [row.id, row.folded]), [["F1", false], ["F2", true]], "the raw carrier answers both rows with its own folded flag — the open-row filter is the router's, not the carrier's");
  const append = run(root, "findings", "append", "--slug", "77-toy", "--file", "src/c.mjs", "--line", "3", "--axis", "code", "--severity", "WARNING", "--impact", "blocking", "--class", "source", "--route", "fold");
  assert.equal(append.code, 1);
  assert.equal(json(append).error, "legacy-carrier-readonly");
  assert.equal(readFileSync(join(root, "docs/fix/77-toy/review-findings.md"), "utf8"), ledgerBefore, "the side ledger is read, never rewritten");
  assert.doesNotMatch(spec(), /## Findings/u, "and no section is invented over it");
});

test("O8 a side ledger in the doc grammar is a typed defect", (t) => {
  const { root, write } = makeUnit(t, { findingsSection: false });
  write("review-findings.md", `# Findings\n\n${TABLE_V1}\n${ROW_V1(1)}\n`);
  const read = run(root, "findings", "read", "--slug", "77-toy");
  assert.equal(read.code, 1, read.stdout + read.stderr);
  assert.equal(json(read).error, "wrong-carrier-grammar");
  assert.equal(json(read).grammar, "findings-table@1");
  assert.equal(json(read).expected, "findings-ledger@1");
});

test("O17 the unchanged carrier still appends, reads, groups, deletes and merges", (t) => {
  const { root, spec } = makeUnit(t, { findingsBody: TABLE_V1 });
  const appended = run(root, "findings", "append", "--slug", "77-toy", "--file", "src/a.mjs", "--line", "3", "--axis", "code", "--severity", "BLOCKER", "--impact", "blocking", "--class", "source", "--route", "fold");
  assert.equal(appended.code, 0, appended.stdout + appended.stderr);
  assert.equal(json(appended).finding.id, "F1", "the first row of an empty carrier is F1");

  const read = run(root, "findings", "read", "--slug", "77-toy");
  assert.equal(json(read).grammar, "findings-table@1");
  assert.deepEqual(json(read).defects, []);

  const summary = run(root, "findings", "summarize", "--slug", "77-toy");
  assert.equal(json(summary).byAxis.code, 1);
  assert.equal(json(summary).bySeverity.BLOCKER, 1);
  assert.equal(json(summary).byClass.source, 1);

  const advisory = run(root, "findings", "append", "--slug", "77-toy", "--file", "src/b.mjs", "--line", "4", "--axis", "code", "--severity", "BLOCKER", "--impact", "report-only", "--class", "source", "--route", "fold");
  assert.equal(advisory.code, 1, "a BLOCKER is never report-only");
  assert.equal(json(advisory).error, "blocker-cannot-be-advisory");

  const offLadder = run(root, "findings", "append", "--slug", "77-toy", "--file", "src/b.mjs", "--line", "4", "--axis", "code", "--severity", "MAJOR", "--impact", "blocking", "--class", "source", "--route", "fold");
  assert.equal(offLadder.code, 1);
  assert.equal(json(offLadder).error, "unknown-vocabulary");

  const deleted = run(root, "findings", "delete", "--slug", "77-toy", "--severity", "BLOCKER");
  assert.equal(json(deleted)["deleted-count"], 1);
  assert.match(findingsOf(spec()), /^\| id \| S# \/ file:line \|/mu, "an emptied carrier keeps its header");
});

test("O20 a workflow row must be report-only", (t) => {
  const { root, spec } = makeUnit(t, { findingsBody: TABLE_V1 });
  const before = spec();
  for (const impact of ["blocking", "docs-only"]) {
    const refused = run(root, "findings", "append", "--slug", "77-toy", "--file", "docs/workflow/SETUP.md", "--line", "1", "--axis", "workflow", "--severity", "WARNING", "--impact", impact, "--class", "workflow", "--route", "report upstream");
    assert.equal(refused.code, 1, `${impact}: ${refused.stdout}${refused.stderr}`);
    assert.equal(json(refused).error, "workflow-cannot-block");
    assert.equal(spec(), before, "a refused workflow row writes nothing");
  }
  // The class cell is the published set, not free text.
  const offSet = run(root, "findings", "append", "--slug", "77-toy", "--file", "docs/workflow/SETUP.md", "--line", "1", "--axis", "workflow", "--severity", "WARNING", "--impact", "report-only", "--class", "ceremony", "--route", "report upstream");
  assert.equal(offSet.code, 1, offSet.stdout + offSet.stderr);
  assert.equal(json(offSet).error, "unknown-vocabulary");
  assert.equal(json(offSet).flag, "--class");
});

test("O20 a workflow row is persisted report-only and keeps its class", (t) => {
  const { root, spec } = makeUnit(t, { findingsBody: TABLE_V1 });
  const appended = run(root, "findings", "append", "--slug", "77-toy", "--file", "docs/workflow/SETUP.md", "--line", "1", "--axis", "workflow", "--severity", "WARNING", "--impact", "report-only", "--class", "workflow", "--route", "report upstream");
  assert.equal(appended.code, 0, appended.stdout + appended.stderr);
  assert.equal(json(appended).finding.class, "workflow");
  assert.equal(json(appended).finding.impact, "report-only");
  assert.match(findingsOf(spec()), /^\| F1 \| docs\/workflow\/SETUP\.md:1 \| workflow \| WARNING \| report-only \| workflow \| report upstream \|$/mu);
  const read = run(root, "findings", "read", "--slug", "77-toy");
  assert.equal(json(read).findings[0].class, "workflow");
  assert.equal(json(read).findings[0].impact, "report-only");
  // Flipping a persisted source row to workflow with a blocking impact is refused too.
  const flip = run(root, "findings", "update", "--slug", "77-toy", "--id", "F1", "--class", "workflow", "--impact", "blocking");
  assert.equal(flip.code, 1, flip.stdout + flip.stderr);
  assert.equal(json(flip).error, "workflow-cannot-block");
});

test("the class cell resolves against the published set", (t) => {
  const { root } = makeUnit(t, { findingsBody: TABLE_V1 });
  // Every published owning-stage token resolves on write, and only those: the
  // class cell is validated against PRE_EXECUTION_FINDING_CLASSES — one owner,
  // never free text (issue #698 AC3).
  for (const [index, token] of [...PRE_EXECUTION_FINDING_CLASSES].entries()) {
    const impact = token === "workflow" ? "report-only" : "docs-only";
    const route = token === "workflow" ? "report upstream" : "fold";
    const appended = run(root, "findings", "append", "--slug", "77-toy", "--file", "docs/workflow/SETUP.md", "--line", String(index + 1), "--axis", "code", "--severity", "WARNING", "--impact", impact, "--class", token, "--route", route);
    assert.equal(appended.code, 0, `${token}: ${appended.stdout}${appended.stderr}`);
    assert.equal(json(appended).finding.class, token);
  }
  // An off-set cell resolves nowhere: refused as unknown-vocabulary, naming the flag.
  const offSet = run(root, "findings", "append", "--slug", "77-toy", "--file", "docs/workflow/SETUP.md", "--line", "9", "--axis", "code", "--severity", "WARNING", "--impact", "blocking", "--class", "workflowy", "--route", "fold");
  assert.equal(offSet.code, 1, offSet.stdout + offSet.stderr);
  assert.equal(json(offSet).error, "unknown-vocabulary");
  assert.equal(json(offSet).flag, "--class");
  // The carrier holds exactly one row per published class, in the set's order.
  const read = run(root, "findings", "read", "--slug", "77-toy");
  assert.deepEqual(json(read).findings.map((row) => row.class), [...PRE_EXECUTION_FINDING_CLASSES]);
});
