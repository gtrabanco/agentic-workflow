#!/usr/bin/env node

/**
 * F106 / P20 — the ledger recount must be mechanical, never asserted.
 *
 * `scripts/ledger-provenance.mjs` is the recount, so these tests pin the recount:
 * a fixture repo covering every provenance shape the real ledger has, plus the
 * real unit-26 ledger, which must pass `--check` from now on.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(repoRoot, "scripts/ledger-provenance.mjs");
const LEDGER = "docs/review-findings.md";
const HEADER = "| id | file:line | axis | severity | class | route | folded |\n| --- | --- | --- | --- | --- | --- | --- |\n";
const CELL_RE = /(?<!\\)\|/;
const row = (id, file, route, folded) => `| ${id} | ${file} | code | high | fix-now | ${route} | ${folded} |\n`;

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/**
 * A throwaway repo: C0 records the rows open, then five commits fold them in the
 * five shapes the real ledger contains.
 */
function makeFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-provenance-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const abs = (rel) => path.join(root, rel);
  const write = (rel, text) => fs.writeFileSync(abs(rel), text);
  const flip = (...ids) =>
    write(
      LEDGER,
      read()
        .split("\n")
        .map((line) => (ids.some((id) => line.startsWith(`| ${id} |`)) ? line.replace(/\| no \|$/, "| yes |") : line))
        .join("\n"),
    );
  const read = () => fs.readFileSync(abs(LEDGER), "utf8");
  const commit = (message) => {
    git(root, "add", "-A", "--", ".");
    git(root, "commit", "-qm", message);
    return git(root, "rev-parse", "HEAD");
  };

  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "Fixture");
  fs.mkdirSync(abs("src"), { recursive: true });
  fs.mkdirSync(abs("docs"), { recursive: true });
  write("src/index.ts", "export const a = 1;\n");
  write("docs/other.md", "other\n");
  write(
    LEDGER,
    HEADER +
      row("F1", "src/index.ts:1", "fold into current unit", "no") +
      row("F2", "src/index.ts:1", "fold into current unit", "no") +
      row("F3", "src/index.ts:1", "fold into current unit", "no") +
      row("F4", "PR #1 body", "fold via gh pr edit", "no") +
      row("F5", "src/index.ts:1", "already cites deadbeef from the last sprint", "no") +
      row("F6", "docs/other.md:1", "fold into current unit", "no"),
  );
  commit("planning artifacts");

  // F1 — atomic fold: changes the cited surface and ticks the row in one commit.
  write("src/index.ts", "export const a = 2;\n");
  flip("F1");
  const atomic = commit("fix(x): fold F1 — correct the field");

  // F2 — the fix lands elsewhere and claims the id; the tick is a later docs commit.
  write("docs/other.md", "repaired beside it\n");
  const messageOnly = commit("fix(x): fold F2 — repair the helper");
  flip("F2");
  const f2tick = commit("docs(x): tick F2");

  // F3 — ticked by a commit that names nothing and changes nothing outside the ledger.
  flip("F3");
  commit("docs(x): housekeeping");

  // F4 — forge-only fold: the surface is not a file at all.
  flip("F4");
  const forgeOnly = commit("docs(x): fold F4 — refresh PR body");

  // F5 — the row cites a sha that has never existed.
  write("src/index.ts", "export const a = 3;\n");
  flip("F5");
  const realRepair = commit("fix(x): fold F5 — the real repair");

  // F6 — recovered through a `F4-F6` range in a subject.
  write("docs/other.md", "range change\n");
  flip("F6");
  const ranged = commit("fix(x): fold F4-F6 — batch fold by range");

  return { root, atomic, messageOnly, f2tick, forgeOnly, realRepair, ranged };
}

const run = (cwd, ...flags) => spawnSync(process.execPath, [script, LEDGER, ...flags], { cwd, encoding: "utf8" });
const reportOf = (cwd) => JSON.parse(run(cwd, "--json").stdout);
const entry = (cwd, id) => reportOf(cwd).find((e) => e.id === id);

test("an atomic fold is proven by the commit that owns the cited surface", (t) => {
  const { root, atomic } = makeFixture(t);
  const f1 = entry(root, "F1");
  assert.equal(f1.status, "recovered");
  assert.equal(f1.fold, atomic.slice(0, 7));
});

test("a message-only claim and a range in a subject are both recovered", (t) => {
  const { root, messageOnly, f2tick, ranged } = makeFixture(t);
  const f2 = entry(root, "F2");
  assert.equal(f2.status, "recovered-by-message");
  assert.equal(f2.fold, messageOnly.slice(0, 7), "the commit with the change outranks the tick");
  assert.equal(f2.tickedIn, f2tick.slice(0, 7), "and the tick stays visible");
  const f6 = entry(root, "F6");
  assert.equal(f6.status, "recovered", "`F4-F6` must expand to F6");
  assert.equal(f6.fold, ranged.slice(0, 7));
});

test("a forge-only fold (no cited file) is proven by the commit that claims it", (t) => {
  const { root, forgeOnly } = makeFixture(t);
  const f4 = entry(root, "F4");
  assert.equal(f4.status, "recovered-by-message");
  assert.equal(f4.fold, forgeOnly.slice(0, 7));
});

test("a tick with no commit behind it is UNPROVEN, never annotated", (t) => {
  const { root } = makeFixture(t);
  const f3 = entry(root, "F3");
  assert.equal(f3.status, "unproven");
  assert.equal(f3.fold, null);
});

test("an unverifiable sha inside a row is never trusted as provenance", (t) => {
  const { root, realRepair } = makeFixture(t);
  const f5 = entry(root, "F5");
  assert.equal(f5.status, "recovered");
  assert.deepEqual(f5.cited, [], "`deadbeef` resolves to nothing");
  assert.equal(f5.fold, realRepair.slice(0, 7));
});

test("--check fails while folded rows lack a commit token; --annotate fixes provable rows only", (t) => {
  const { root } = makeFixture(t);
  const before = run(root, "--check");
  assert.equal(before.status, 1);
  assert.match(before.stdout, /CHECK FAIL/);
  for (const id of ["F1", "F2", "F3", "F4", "F5", "F6"]) assert.match(before.stdout, new RegExp(id));

  assert.equal(run(root, "--annotate").status, 0);
  // The recount is green again because the one row that could not be proven was
  // re-opened, not because its token was invented.
  const after = run(root, "--check");
  assert.equal(after.status, 0, after.stdout + after.stderr);
  assert.match(after.stdout, /CHECK PASS/);

  const lines = fs
    .readFileSync(path.join(root, LEDGER), "utf8")
    .split("\n")
    .filter((line) => /^\|\s*F\d+\s*\|/.test(line));
  assert.equal(lines.length, 6);
  for (const line of lines) {
    assert.equal(line.split("|").length, 9, `7-column schema broken: ${line}`);
    if (/\| yes \|$/.test(line)) {
      assert.match(line, /· (fold|ticked) [0-9a-f]{7}/, `folded row without a token: ${line}`);
    } else {
      assert.match(line.slice(0, 12), /\| F3 /, "only the unprovable row may re-open");
      assert.match(line, /REOPENED — provenance unproven/, `re-opened row without evidence: ${line}`);
    }
  }
  assert.match(run(root, "--annotate").stdout, /nothing to annotate/, "annotation is idempotent");
});

test("a re-opened row names no phase the annotator cannot see (F58)", (t) => {
  // F58: the reopen note hardcoded `· REOPENED P20 — provenance unproven`, and no plan
  // of the annotated unit contains a P20 — a mechanical token inventing a fact while
  // reopening rows the contract correctly reopened. The walk observes git state only:
  // the note may name the row, its missing evidence, and nothing it cannot see.
  const { root } = makeFixture(t);
  assert.equal(run(root, "--annotate").status, 0);
  const line = fs
    .readFileSync(path.join(root, LEDGER), "utf8")
    .split("\n")
    .find((l) => /^\| F3 \|/.test(l));
  assert.match(line, /\| no \|$/, "an unproven tick must re-open");
  assert.match(line, /· REOPENED — provenance unproven:/, "the reopen note keeps naming the missing evidence");
  assert.doesNotMatch(line, /REOPENED[^|]*\bP\d/, `the reopen token names a phase it cannot observe: ${line}`);
});

test("the annotation says what it knows: `fold` for a surface change, `ticked` for a claim", (t) => {
  const { root, atomic, forgeOnly } = makeFixture(t);
  assert.equal(run(root, "--annotate").status, 0);
  const lines = fs
    .readFileSync(path.join(root, LEDGER), "utf8")
    .split("\n")
    .filter((line) => /^\|\s*F\d+\s*\|/.test(line));
  const of = (id) => lines.find((line) => line.startsWith(`| ${id} |`));
  assert.match(of("F1"), new RegExp(`· fold ${atomic.slice(0, 7)} `), "owns the surface");
  assert.match(of("F4"), new RegExp(`· ticked ${forgeOnly.slice(0, 7)} `), "only the tick claims it");
  assert.match(of("F2"), /· fold [0-9a-f]{7} \(ticked [0-9a-f]{7}\) /, "the fix and the tick are both named");
});

test("a row whose cell escapes a pipe is counted, checked and annotated like any other", (t) => {
  // P16's fold (F38) found its own row invisible: `file:line` held
  // "`REVIEW-RAN \| HEAD <40-hex sha>`", the naive split read eight columns, and
  // `parseRows` dropped the row — so the recount, `--check` and `--annotate` all
  // silently skipped a fix-now finding that was sitting there in the table.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-provenance-escaped-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => fs.writeFileSync(path.join(root, rel), text);
  const gitRun = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  gitRun("init", "-q", "-b", "main");
  gitRun("config", "user.email", "fixture@example.invalid");
  gitRun("config", "user.name", "Fixture");
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  const escaped = "src/index.ts:1 (the `REVIEW-RAN \\| HEAD <40-hex sha>` row)";
  const rows = [row("F1", escaped, "fold into current unit", "no"), row("F2", "src/index.ts:1", "fold", "no")];
  const ledger = () => HEADER + rows.join("");
  const ticked = (id) => rows.map((l) => (l.startsWith(`| ${id} |`) ? l.replace(/\| no \|\n$/, "| yes |\n") : l));
  write(LEDGER, ledger());
  write("src/index.ts", "export const a = 1;\n");
  gitRun("add", "-A", "--", ".");
  gitRun("commit", "-qm", "planning artifacts");
  write("src/index.ts", "export const a = 2;\n");
  rows.splice(0, rows.length, ...ticked("F1"));
  write(LEDGER, ledger());
  gitRun("add", "-A", "--", ".");
  gitRun("commit", "-qm", "fix(x): fold F1 — repair the cited surface");
  const sha = gitRun("rev-parse", "HEAD").slice(0, 7);

  const report = JSON.parse(run(root, "--json").stdout);
  assert.equal(report.length, 2, `the escaped-pipe row was dropped from the recount: ${JSON.stringify(report.map((e) => e.id))}`);
  const f1 = report.find((e) => e.id === "F1");
  assert.equal(f1.status, "recovered");
  assert.equal(f1.fold, sha);

  assert.equal(run(root, "--annotate").status, 0);
  const line = fs.readFileSync(path.join(root, LEDGER), "utf8").split("\n").find((l) => /^\| F1 \|/.test(l));
  assert.match(line, new RegExp(`· fold ${sha}`), "the annotated row kept no provenance");
  assert.equal(line.split(CELL_RE).length, 9, `annotation broke the 7-column schema: ${line}`);
  assert.equal(run(root, "--check").status, 0, "the row is still invisible to the check");
});

test("a row the 7-column schema refuses is counted, reported and refused — never skipped (C1)", (t) => {
  // C1, P16 fold: `parseRows` kept a line only when its unescaped-pipe split yielded
  // exactly seven cells, and `continue`d otherwise with no signal at all. An arity
  // slip therefore removed a fix-now finding from the recount, from `--check` and
  // from `--annotate` while the row sat there in the table looking accounted for —
  // the same silent-drop class the escaped-pipe fix above closed from the other end.
  // Nothing may be read by neither branch: counted vs parsed is now a check.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-provenance-arity-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => fs.writeFileSync(path.join(root, rel), text);
  const gitRun = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  gitRun("init", "-q", "-b", "main");
  gitRun("config", "user.email", "fixture@example.invalid");
  gitRun("config", "user.name", "Fixture");
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  const malformed = "| F2 | src/index.ts:1 | code | high | fix-now | fold into current unit | yes | shifted ninth cell |";
  const ledgerText = (f1folded) =>
    HEADER +
    row("F1", "src/index.ts:1", "fold into current unit", f1folded) +
    malformed + "\n" +
    row("F3", "src/index.ts:1", "fold into current unit", "no") +
    // A repeated id: `rows.set` kept the last line and dropped the first with no
    // signal, so one row shadowed another in silence.
    row("F4", "src/index.ts:1", "fold", "no") +
    row("F4", "docs/other.md:1", "fold", "no");
  write("src/index.ts", "export const a = 1;\n");
  write("docs/other.md", "other\n");
  write(LEDGER, ledgerText("no"));
  gitRun("add", "-A", "--", ".");
  gitRun("commit", "-qm", "planning artifacts");
  write("src/index.ts", "export const a = 2;\n");
  write(LEDGER, ledgerText("yes"));
  gitRun("add", "-A", "--", ".");
  gitRun("commit", "-qm", "fix(x): fold F1 — repair the cited surface");
  const foldSha = gitRun("rev-parse", "HEAD").slice(0, 7);

  // Five `^| F<n> |` lines in the file; the schema reads three ids and refuses two lines.
  const summary = run(root).stdout;
  assert.match(summary, /rows 3 counted 5 unparsed 2/, `the summary does not separate counted from parsed: ${summary}`);
  const report = JSON.parse(run(root, "--json").stdout);
  const f2 = report.find((e) => e.id === "F2");
  assert.equal(f2.status, "unparsed", "the arity slip is reported as its own state, not as open or proven");
  assert.match(f2.evidence, /8 cells instead of the 7-column schema/);
  assert.deepEqual(
    report.filter((e) => e.status === "unparsed").map((e) => e.id), ["F2", "F4"],
    "the arity slip and the shadowed duplicate are both visible",
  );
  assert.match(report.find((e) => e.id === "F4" && e.status === "unparsed").evidence, /duplicate id/,
    "the shadowed line is reported beside the row it shadowed");
  assert.equal(report.find((e) => e.id === "F1").status, "recovered", "a parseable row is still classified");

  // `--check` refuses both faults, and names them apart: a row nothing read is not a
  // row missing a token.
  const check = run(root, "--check");
  assert.equal(check.status, 1, `an unread row must fail the recount: ${check.stdout}${check.stderr}`);
  assert.match(check.stdout, /1 folded row\(s\) lack a verified commit token: F1/);
  assert.match(check.stdout, /2 row\(s\) the 7-column schema refused were read by nothing: F2, F4/);

  // `--annotate` reports the same fault, says what it would do in check mode (C2), and
  // writes nothing.
  const checkAnnotate = run(root, "--check", "--annotate");
  assert.match(checkAnnotate.stdout, /would annotate 1 row\(s\)/, checkAnnotate.stdout);
  assert.doesNotMatch(checkAnnotate.stdout, /^annotated /m, "`--check` must not claim a write it did not perform");
  assert.match(checkAnnotate.stdout, /ARITY: 2 row\(s\) matched the id pattern but the schema refused them/);
  assert.equal(run(root, "--check", "--annotate").stdout, checkAnnotate.stdout, "the check is read-only");
  assert.equal(fs.readFileSync(path.join(root, LEDGER), "utf8"), ledgerText("yes"), "--check --annotate wrote nothing");

  // Annotating for real leaves the malformed line byte-identical (the tool never
  // invents the arity it refused), still refuses the recount, and reports it.
  const annotate = run(root, "--annotate");
  assert.match(annotate.stdout, /annotated 1 row\(s\)/, annotate.stdout);
  assert.match(annotate.stdout, /ARITY: 2 row\(s\)/);
  const after = fs.readFileSync(path.join(root, LEDGER), "utf8").split("\n");
  assert.ok(after.includes(malformed), "the malformed row was rewritten, not reported");
  assert.ok(after.includes(row("F1", "src/index.ts:1", `fold into current unit · fold ${foldSha}`, "yes").replace("\n", "")),
    `the parseable folded row did not get its token:\n${after.join("\n")}`);
  assert.equal(run(root, "--check").status, 1, "the recount stays red while a counted line is unread");
});

test("`--check --annotate` speaks in the conditional (C2)", (t) => {
  const { root } = makeFixture(t);
  const out = run(root, "--check", "--annotate");
  assert.match(out.stdout, /would annotate \d+ row\(s\)/, out.stdout);
  assert.ok(!/^annotated /m.test(out.stdout), "past tense while writing nothing is a false report");
  assert.equal(out.stdout, run(root, "--check", "--annotate").stdout, "and the ledger is unchanged by it");
});

test("unit 26's fold ledger names a verified commit on every folded row", () => {
  const rel = "docs/features/26-staged-verification-contracts/review-findings.md";
  const result = spawnSync(process.execPath, [script, rel, "--check"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /CHECK PASS/);
});

console.log(
  "PASS ledger provenance: atomic, message-only, range, forge-only, unprovable and fabricated-sha rows all classified",
);
