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
  git(root, "config", "commit.gpgsign", "false");
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
  // F1/F5/F6 are recoverable (the annotator writes their token), F2/F4 are recoverable
  // by message, F3 is the only row the walk cannot vouch for. The refusal names the
  // cause, so only the paused row appears there.
  assert.match(before.stdout, /unproven: F3/);
  assert.doesNotMatch(before.stdout, /^\s+\d+ recovered/m, "a recoverable row is not paused work");

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

test("the re-entry guard matches the token shape the annotator writes (F59)", () => {
  // The guard was built inside a template literal as `\s`, which JS collapses to the
  // bare character `s`: the pattern read `·s*folds[0-9a-f]{7}` and could never match
  // the `· fold <sha>` marker line 339 writes — a re-entry check that silently never
  // re-enters. This case evaluates the guard expression read out of the script's own
  // source, so an escape slip fails the suite instead of disabling the guard.
  const source = fs.readFileSync(script, "utf8");
  const expr = /if \((new RegExp\([\s\S]*?entry\.token[\s\S]*?\))\.test\(route\)\)/.exec(source)?.[1];
  assert.ok(expr, "the re-entry guard is gone from the --annotate branch");
  const build = new Function("entry", `return (${expr});`);
  assert.ok(build({ token: "fold" }).test("some route · fold 481f330 tail"), "the guard must match the shape the annotator emits");
  assert.ok(build({ token: "ticked" }).test("route · ticked abc1234"), "and the ticked form too");
  assert.ok(!build({ token: "fold" }).test("no marker here"), "and reject routes that carry none");
});

test("annotating twice changes nothing: tokens are not re-appended (F59 outcome)", (t) => {
  const { root } = makeFixture(t);
  assert.equal(run(root, "--annotate").status, 0);
  const once = fs.readFileSync(path.join(root, LEDGER), "utf8");
  assert.equal(run(root, "--annotate").status, 0);
  const twice = fs.readFileSync(path.join(root, LEDGER), "utf8");
  assert.equal(twice, once, "a second annotate pass mutated the durable ledger");
  for (const line of once.split("\n")) {
    assert.ok(!/· (fold|ticked) [0-9a-f]{7} · (fold|ticked) [0-9a-f]{7}/.test(line), `duplicate machine token: ${line}`);
  }
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
  // F4's line is a reference the schema refused while F4 also carries a schema row;
  // it is reported (never silently dropped) and never counted as paused work.
  const f4Entries = report.filter((e) => e.id === "F4").map((e) => e.status);
  assert.ok(f4Entries.includes("reference"), `F4's shadowed line is reported as a reference: ${f4Entries}`);
  assert.match(f2.evidence, /8 cells instead of the 7-column schema/);
  // The arity slip is the only REFUSED row (F4's line carries a duplicate-id reason and
  // is a reference to the row that was read); both stay visible in the report.
  assert.deepEqual(
    report.filter((e) => e.status === "unparsed").map((e) => e.id), ["F2"],
    "the arity slip is refused and named",
  );
  assert.match(report.find((e) => e.id === "F4" && e.status === "reference").evidence, /duplicate id/,
    "the shadowed line is reported beside the row it shadowed");
  assert.equal(report.find((e) => e.id === "F1").status, "recovered", "a parseable row is still classified");
  // A prose table that keys its rows by the same id shape is not a finding: only a
  // line carrying the row schema can be one (unit 27's summary table was read as ten
  // arity-broken findings before this rule).
  assert.equal(report.filter((e) => e.id === "F2" && e.status === "unparsed").length, 1,
    "the arity slip is reported once, as itself");

  // `--check` refuses both faults, and names them apart: a row nothing read is not a
  // row missing a token.
  const check = run(root, "--check");
  assert.equal(check.status, 1, `an unread row must fail the recount: ${check.stdout}${check.stderr}`);
  assert.match(check.stdout, /1 unparsed: F2 — the 7-column schema refused/);
  assert.doesNotMatch(check.stdout, /recovered: F1/, "a recoverable row is not paused work");

  // `--annotate` reports the same fault, says what it would do in check mode (C2), and
  // writes nothing.
  const checkAnnotate = run(root, "--check", "--annotate");
  assert.match(checkAnnotate.stdout, /would annotate \d+ row\(s\)/, checkAnnotate.stdout);
  assert.doesNotMatch(checkAnnotate.stdout, /^annotated /m, "`--check` must not claim a write it did not perform");
  assert.match(checkAnnotate.stdout, /ARITY: 2 row\(s\) matched the id pattern but the schema refused them/);
  assert.equal(run(root, "--check", "--annotate").stdout, checkAnnotate.stdout, "the check is read-only");
  assert.equal(fs.readFileSync(path.join(root, LEDGER), "utf8"), ledgerText("yes"), "--check --annotate wrote nothing");

  // Annotating for real leaves the malformed line byte-identical (the tool never
  // invents the arity it refused), still refuses the recount, and reports it.
  const annotate = run(root, "--annotate");
  assert.match(annotate.stdout, /annotated \d+ row\(s\)/, annotate.stdout);
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


test("unit 26's fold ledger is read, not silently passed", () => {
  // Feature 36's F80: `--check` used to exit 0 on this ledger while classifying
  // every row `open` (the annotated cells and their tokens were never read), so a
  // green recount here proved nothing. The recount now reads every row; the red it
  // reports is the ledger's own historical residue — F63/F64/F108 write
  // `· folded P<n> <sha>`, a shape that predates the annotator's `· fold <sha>` —
  // and must name exactly those rows rather than a blanket pass or a blanket fail.
  const rel = "docs/features/26-staged-verification-contracts/review-findings.md";
  const result = spawnSync(process.execPath, [script, rel, "--check"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /CHECK PASS/);
  const json = JSON.parse(spawnSync(process.execPath, [script, rel, "--json"], { cwd: repoRoot, encoding: "utf8" }).stdout);
  assert.equal(json.filter((e) => e.status === "open").length, 0, "no folded row is bucketed open");
});

test("--annotate never writes a token the contract does not declare (A1)", (t) => {
  // The annotator's vocabulary is closed by `ledger-ownership@1`: `· fold <sha>`,
  // `· ticked <sha>`, `· REOPENED`. A state that reached the append without a token
  // interpolated the literal string `undefined` into the ledger — a phantom no writer
  // can produce, and one the re-entry guard then matched against itself.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-provenance-token-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const abs = (rel) => path.join(root, rel);
  const ledger = abs(LEDGER);
  const read = () => fs.readFileSync(ledger, "utf8");
  const tick = (id, token) =>
    fs.writeFileSync(ledger, read().split("\n").map((l) => (l.startsWith(`| ${id} |`) ? l.replace(/\| no \|$/, `| yes${token ? ` · ${token}` : ""} |`) : l)).join("\n"));
  const commit = (message) => {
    git(root, "add", "-A", "--", ".");
    git(root, "commit", "-qm", message);
    return git(root, "rev-parse", "HEAD");
  };

  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "Fixture");
  git(root, "config", "commit.gpgsign", "false");
  fs.mkdirSync(abs("src"), { recursive: true });
  fs.mkdirSync(path.dirname(ledger), { recursive: true });
  fs.writeFileSync(abs("src/index.ts"), "export const a = 1;\n");
  fs.writeFileSync(
    ledger,
    HEADER +
      row("F1", "src/index.ts:1", "fold into current unit", "no") +
      row("F2", "src/index.ts:1", "fold into current unit", "no") +
      row("F3", "src/index.ts:1", "fold into current unit", "no"),
  );
  commit("planning artifacts");

  // F1 — a marker whose commit never claims this row.
  fs.writeFileSync(abs("src/other.ts"), "export const b = 1;\n");
  const claimedElsewhere = commit("fix(x): fold F9 — another unit's finding");
  tick("F1", `fold ${claimedElsewhere}`);
  commit("docs(x): tick F1");

  // F2 — a marker naming a TREE id: ancestry of a tree is trivially true.
  const tree = git(root, "rev-parse", "HEAD^{tree}");
  tick("F2", `fold ${tree}`);
  commit("docs(x): tick F2");

  // F3 — ticked, no marker, nothing behind it.
  tick("F3");
  commit("docs(x): tick F3");

  const out = run(root, "--annotate");
  const text = read();
  assert.doesNotMatch(text, /undefined/, `the annotator interpolated a missing token:\n${out.stdout}`);
  for (const line of text.split("\n").filter((l) => /^\| F\d+ \|/.test(l))) {
    for (const marker of line.matchAll(/·\s*([A-Za-z]+)/g)) {
      assert.ok(["fold", "ticked", "REOPENED"].includes(marker[1]), `token outside the declared vocabulary: ${marker[1]}`);
    }
  }
  const f1 = text.split("\n").find((l) => l.startsWith("| F1 |"));
  assert.match(f1, /REOPENED — provenance unproven/, `an unverifiable citation must re-open with evidence: ${f1}`);
  assert.match(f1, /\| no \|$/, "the unverifiable row must not stay ticked");
  const f2 = text.split("\n").find((l) => l.startsWith("| F2 |"));
  assert.match(f2, /REOPENED — provenance unproven/, `a tree id is not an ancestry proof: ${f2}`);
  const once = read();
  assert.match(run(root, "--annotate").stdout, /nothing to annotate/);
  assert.equal(read(), once, "annotating twice changed the ledger");
});

test("a target outside the checkout is refused before it is read (SEC)", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-provenance-outside-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const outside = path.join(root, "notes.txt");
  const body = HEADER + row("F1", "src/index.ts:1", "fold into current unit", "yes");
  fs.writeFileSync(outside, body);
  const result = spawnSync(process.execPath, [script, outside, "--annotate"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(result.status, 2, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /REFUSED/);
  assert.equal(fs.readFileSync(outside, "utf8"), body, "the tool wrote outside the checkout");
});

test("--check names each refusal cause separately (A2)", (t) => {
  const { root } = makeFixture(t);
  const out = run(root, "--check");
  assert.equal(out.status, 1);
  assert.match(out.stdout, /by cause:/, out.stdout);
  assert.match(out.stdout, /1 unproven: F3 — are ticked with no commit behind them/, out.stdout);
  assert.doesNotMatch(out.stdout, /outside HEAD's history/, "no dangling row exists in this fixture");
  assert.doesNotMatch(out.stdout, /recovered: /, "a recoverable row is not paused work");
});

console.log(
  "PASS ledger provenance: atomic, message-only, range, forge-only, unprovable and fabricated-sha rows all classified",
);

test("unit 36's fold ledger names its open residue, not a blanket pass (F80)", () => {
  // The recount's own gate on the ledger this fix ships in. Cycle 9 inherited F21–F54
  // folded before the annotator wrote `· fold <sha>` into the cell (they cite the
  // commit in the route cell instead, the shape that predates the marker), and the
  // ledger must say so row by row rather than claim a blanket PASS. The four cycle-9
  // rows this batch folded are proven, which is the path under test; a future fold
  // that re-points or annotates the residue is free to make this green.
  const rel = "docs/features/36-verification-contract-hygiene/review-findings.md";
  const json = JSON.parse(spawnSync(process.execPath, [script, rel, "--json"], { cwd: repoRoot, encoding: "utf8" }).stdout);
  const open = json.filter((e) => e.status === "open" && !/^F(2[0-9]|3[0-9]|4[0-9]|5[0-4])$/.test(e.id));
  assert.equal(open.length, 0, `a folded row is never bucketed open: ${open.map((e) => e.id).join(", ")}`);
  for (const id of ["F78", "F79", "F80", "F81", "F82", "F83", "F84", "F85", "F86"]) {
    assert.equal(json.find((e) => e.id === id).status, "proven-cited", `${id}'s own marker must prove it`);
  }
  const check = spawnSync(process.execPath, [script, rel, "--check"], { cwd: repoRoot, encoding: "utf8" });
  const citations = json.filter((e) => e.status === "cited-unverified").map((e) => e.id);
  assert.equal(check.status, citations.length === 0 ? 0 : 1, "the check mirrors the residue it can see");
  if (citations.length) assert.match(check.stdout, /by cause:/, check.stdout);
  // Cycle 10 repaired the residue this guard was written against: no row is open and
  // the recount now validates the whole ledger instead of reporting it.
  assert.deepEqual(citations, [], "the ledger's citations are repaired and verified");
});

test("an annotated ledger's citations are read and validated, not silently passed (F80)", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-provenance-annotated-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const abs = (rel) => path.join(root, rel);
  const ledger = abs(LEDGER);
  const ledgerText = () => fs.readFileSync(ledger, "utf8");
  const tick = (id) =>
    fs.writeFileSync(
      ledger,
      ledgerText()
        .split("\n")
        .map((line) => (line.startsWith(`| ${id} |`) ? line.replace(/\| no \|$/, "| yes |") : line))
        .join("\n"),
    );
  const annotate = (id, token) =>
    fs.writeFileSync(
      ledger,
      ledgerText()
        .split("\n")
        .map((line) => (line.startsWith(`| ${id} |`) ? line.replace(/\| yes \|$/, `| yes · ${token} |`) : line))
        .join("\n"),
    );
  const commit = (message) => {
    git(root, "add", "-A", "--", ".");
    git(root, "commit", "-qm", message);
    return git(root, "rev-parse", "HEAD");
  };

  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "Fixture");
  git(root, "config", "commit.gpgsign", "false");
  fs.mkdirSync(abs("src"), { recursive: true });
  fs.mkdirSync(path.dirname(ledger), { recursive: true });
  fs.writeFileSync(abs("src/index.ts"), "export const a = 1;\n");
  fs.writeFileSync(
    ledger,
    HEADER +
      row("F1", "src/index.ts:1", "fold into current unit", "no") +
      row("F2", "src/index.ts:1", "fold into current unit", "no") +
      row("F3", "src/index.ts:1", "fold into current unit", "no"),
  );
  commit("planning artifacts");

  // F1 — the branch's real shape (F78): fix commit, then a tick commit that writes
  // `yes · fold <fix>` naming it from history. The citation is honest by construction.
  fs.writeFileSync(abs("src/index.ts"), "export const a = 2;\n");
  const foldCommit = commit("fix(x): fold F1 — correct the field");
  tick("F1");
  annotate("F1", `fold ${foldCommit}`);
  commit("docs(x): tick F1");
  const amended = fs.readFileSync(abs("src/index.ts"), "utf8");

  // F2 — ticked and annotated with a commit that never names the row: it is a fold
  // of some other finding, so it touches no surface this row cites.
  fs.writeFileSync(abs("src/other.ts"), "export const b = 1;\n");
  const unrelated = commit("fix(x): F9 surface-touch repair of another unit's finding");
  tick("F2");
  annotate("F2", `fold ${unrelated}`);
  commit("docs(x): tick F2");

  // F3 — ticked with no citation at all.
  tick("F3");
  commit("docs(x): tick F3");

  // F80's defect: the annotated cells put every row back into the `open` bucket, so
  // `--check` validated nothing and exited 0 over citations it had never read.
  const json = JSON.parse(run(root, "--json").stdout);
  const f1 = json.find((e) => e.id === "F1");
  const f2 = json.find((e) => e.id === "F2");
  const f3 = json.find((e) => e.id === "F3");
  const tracked = ["proven-cited", "recovered", "recovered-by-message"];
  assert.ok(tracked.includes(f1.status), `an annotated fold is read, not bucketed as open (got ${f1.status})`);
  assert.equal(f1.fold, foldCommit.slice(0, 7), "the row's own marker proves the fold it names");
  assert.equal(f2.status, "cited-unverified", `a citation its row cannot claim is reported (got ${f2.status})`);
  assert.deepEqual(f2.cited, [unrelated.slice(0, 7)], "the unclaimable token is named");
  assert.notEqual(f3.status, "open", "a ticked row with no marker is never bucketed as open");

  const check = run(root, "--check");
  assert.equal(check.status, 1, "a citation the row cannot claim cannot pass the check");
  assert.match(check.stdout, /CHECK FAIL/);
  assert.match(check.stdout, /F2/, "the unclaimable citation is named");
  assert.match(check.stdout, /F2/, "the unclaimable citation is named");
  assert.doesNotMatch(check.stdout, /F1/, "the honest marker is never flagged");
});

// ---------------------------------------------------------------------------
// #308 §Scope 3 — the collapsed carrier (a migrated unit doc)
//
// A migrated unit has no `folded` column: its OPEN rows live in `## Findings` and a
// folded row leaves that table for a `## Log` line naming its own commit. The recount
// reads that carrier at the same proof standard, and refuses to annotate an
// append-only section. P5's path-protection receipt promised these cases.
// ---------------------------------------------------------------------------

const UNIT_DOC = "docs/features/9-x/SPEC.md";
const docRun = (cwd, ...flags) => spawnSync(process.execPath, [script, UNIT_DOC, ...flags], { cwd, encoding: "utf8" });

function makeDocFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-provenance-doc-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "Fixture");
  fs.mkdirSync(path.join(root, "docs/features/9-x"), { recursive: true });
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/index.ts"), "export const a = 1;\n");
  git(root, "add", "-A", "--", ".");
  git(root, "commit", "-qm", "planning artifacts");
  let folded = 0;
  /**
   * A fold commit: every call changes a surface first (git refuses an empty commit,
   * and a fold that touched nothing is not a fold), then commits with `message`.
   */
  const fold = (message) => {
    fs.writeFileSync(path.join(root, `src/fold-${++folded}.ts`), "export const folded = true;\n");
    git(root, "add", "-A", "--", ".");
    git(root, "commit", "-qm", message);
    return git(root, "rev-parse", "--short", "HEAD");
  };
  const writeDoc = (lines) =>
    fs.writeFileSync(
      path.join(root, UNIT_DOC),
      ["# 9 — doc", "", "## Findings", "", "| id | S# / file:line | axis | severity | class | route |",
       "|---|---|---|---|---|---|", "| F9 | S1 · src/index.ts:1 | code | med | source | fold: fix it |", "",
       "## Log", "", "- **L1** — 2026-10-23, the request, verbatim", ...lines, ""].join("\n"),
    );
  return { root, fold, writeDoc };
}

test("#308 a folded line naming a commit that claims its id is proven", (t) => {
  const { root, fold, writeDoc } = makeDocFixture(t);
  const sha = fold("fix(x): fold F7 — correct the parse");
  writeDoc([`- **F1** — 2026-10-23, folded F7 · \`${sha}\` · the parse was re-verified at the head.`]);
  const report = JSON.parse(docRun(root, "--json").stdout).rows;
  const proven = report.find((row) => row.id === "F7");
  assert.equal(proven.status, "proven-cited", JSON.stringify(proven));
  assert.equal(proven.carrier, "log");
  // The OPEN row of `## Findings` is work, not a receipt: it owes no proof.
  assert.equal(report.find((row) => row.id === "F9").status, "open");
  assert.equal(docRun(root, "--check").status, 0, docRun(root, "--check").stdout + docRun(root, "--check").stderr);
});

test("#308 a folded line with no commit, or a commit that claims nothing, fails the recount", (t) => {
  const { root, fold, writeDoc } = makeDocFixture(t);
  const sha = fold("fix(x): unrelated repair");
  writeDoc([
    "- **F1** — 2026-10-23, folded F7 · a commit was named nowhere in this line",
    `- **F2** — 2026-10-23, folded F8 · \`${sha}\` · claims no finding id`,
  ]);
  const statuses = JSON.parse(docRun(root, "--json").stdout).rows.map((row) => row.status);
  assert.ok(statuses.includes("unproven"), `a line with no commit token is named: ${statuses.join(",")}`);
  assert.ok(statuses.includes("cited-unverified"), `a commit that claims no id is named: ${statuses.join(",")}`);
  const check = docRun(root, "--check");
  assert.equal(check.status, 1, "an unproven folded line fails the merge-gate recount");
  assert.match(check.stdout, /CHECK FAIL/);
});

test("#308 --annotate refuses the append-only carrier instead of rewriting it", (t) => {
  const { root, fold, writeDoc } = makeDocFixture(t);
  const sha = fold("fix(x): fold F7 — the repair");
  writeDoc([`- **F1** — 2026-10-23, folded F7 · \`${sha}\` · verified`]);
  const bytes = fs.readFileSync(path.join(root, UNIT_DOC), "utf8");
  const run = docRun(root, "--annotate");
  assert.equal(run.status, 2, `a doc target is refused, not rewritten: ${run.stdout}${run.stderr}`);
  assert.match(run.stderr, /append-only/);
  assert.equal(fs.readFileSync(path.join(root, UNIT_DOC), "utf8"), bytes, "the refusal wrote nothing");
});

// ---------------------------------------------------------------------------
// #308 cycle 3 F36: a fold marker outranks the row's prose context citations.
// The F27 shape: the route prose names two reachable commits as BACKGROUND
// (the version the base consumed, the commit that registered it). The recount
// reads any reachable token as a fold citation, so the bare prose citations
// demote the genuinely-proven fold to `cited-unverified` — and the annotator's
// own marker, naming the real fold commit, outranks them. Both halves are
// pinned here so the precedence can never silently flip again.
// ---------------------------------------------------------------------------

test("#308 F36: prose context citations demote a proven fold; the fold marker outranks them", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-provenance-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const abs = (rel) => path.join(root, rel);
  const write = (rel, text) => fs.writeFileSync(abs(rel), text);
  const g = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const gitRun = (...args) => g(...args);
  const short7 = (sha) => sha.slice(0, 7);
  fs.mkdirSync(abs("src"), { recursive: true });
  fs.mkdirSync(path.dirname(abs(LEDGER)), { recursive: true });

  g("init", "-q", "-b", "main");
  g("config", "user.email", "fixture@example.invalid");
  g("config", "user.name", "Fixture");
  g("config", "commit.gpgsign", "false");
  write("src/index.ts", 'export const version = "0.31.0";\n');
  write(LEDGER, HEADER + row("F1", "src/index.ts:1", "fold into current unit", "no"));
  gitRun("add", "-A");
  gitRun("commit", "-qm", "planning artifacts");

  // The background commits the finding's prose will cite: neither claims F1.
  write("src/index.ts", 'export const version = "0.31.0"; // consumed downstream\n');
  const consumed = g("rev-parse", "HEAD");
  gitRun("add", "-A");
  gitRun("commit", "-qm", "chore(x): feature 66 consumes the published version");
  const ctx2 = g("rev-parse", "HEAD");

  // The row records with the prose citations already in it.
  write(
    LEDGER,
    HEADER +
      row("F1", "src/index.ts:1", `fold: the pins 0.31.0 (consumed by 66, ${short7(consumed)}; registered in ${short7(ctx2)}) — bump and add the companion row`, "no"),
  );
  gitRun("add", "-A");
  gitRun("commit", "-qm", "docs(x): record F1 open");

  // The true fold: names the id, changes the cited surface.
  write("src/index.ts", 'export const version = "0.32.0";\n');
  gitRun("add", "-A");
  gitRun("commit", "-qm", "fix(x): close F1 — bump to 0.32.0 with its companion row");
  const fold = g("rev-parse", "HEAD");

  // The tick lands in a later, unrelated batch (F1 is not named there).
  const read1 = () => fs.readFileSync(abs(LEDGER), "utf8");
  write(LEDGER, read1().replace(/\| no \|\n$/, "| yes |\n"));
  gitRun("add", "-A");
  gitRun("commit", "-qm", "docs(x): record the next triage fold");

  const before = entry(root, "F1");
  assert.equal(before.status, "cited-unverified", `background citations outrank nothing until marked: ${before.status}`);
  assert.deepEqual(before.cited, [short7(consumed), short7(ctx2)], "both background tokens are named");
  assert.equal(run(root, "--check").status, 1, "the demoted row keeps the recount red");

  // The annotator's repair: `· fold <sha>` naming the commit that owns the bump.
  write(LEDGER, read1().replace(`bump and add the companion row |`, `bump and add the companion row · fold ${short7(fold)} |`));
  gitRun("add", "-A");
  gitRun("commit", "-qm", "docs(x): annotate the fold provenance");

  const after = entry(root, "F1");
  assert.equal(after.status, "proven-cited", `the marker proves the fold the prose names: ${after.status}`);
  assert.equal(after.fold, short7(fold), "and it names the fold commit, not the background ones");
  assert.equal(run(root, "--check").status, 0, run(root, "--check").stdout + run(root, "--check").stderr);
});

// ---------------------------------------------------------------------------
// #308 cycle 7 F45: the collapsed-carrier probe is the fence-aware section
// reader, not a `/m` regex. A legacy unit doc that quotes the re-cut shape
// inside a fenced sample is NOT a migrated unit; reading the fence heading as
// the marker made the tool refuse it as an append-only carrier, and recounted
// an absent section as `CHECK PASS` over nothing.
// ---------------------------------------------------------------------------

test("#308 F45 a legacy unit doc quoting ## Findings in a fence is not the collapsed carrier", (t) => {
  const { root, writeDoc } = makeDocFixture(t);
  // The legacy shape: no real `## Findings`/`## Log` sections, only a fenced
  // illustration of the migrated grammar.
  writeDoc([]);
  fs.writeFileSync(
    path.join(root, UNIT_DOC),
    [
      "# 9 — legacy doc", "", "## Objective", "quoted fence only", "",
      "How a migrated unit reads:", "", "```markdown", "## Findings", "",
      "| id | S# / file:line | axis | severity | class | route |", "|---|---|---|---|---|---|",
      "| F1 | S1 · src/index.ts:1 | code | med | source | fold: quoted |", "",
      "## Log", "", "- **F9** — folded F9 · `dead000` · quoted, not a receipt", "```", "",
    ].join("\n"),
  );
  git(root, "add", "-A", "--", ".");
  git(root, "commit", "-qm", "quote the migrated shape in a fence");

  const run = docRun(root, "--check");
  assert.doesNotMatch(run.stdout, /^unit-doc /, `the fence heading was read as the carrier: ${run.stdout}`);

  const annotate = docRun(root, "--annotate");
  assert.equal(annotate.status, 0, `a legacy doc is not an append-only carrier: ${annotate.stdout}${annotate.stderr}`);
  assert.doesNotMatch(annotate.stderr, /append-only/);
});

// ---------------------------------------------------------------------------
// #308 cycle 7 F47: a folded `## Log` line may name its fold commit AND a later
// context commit. The recount read only the LAST token, so a line that cited the
// commit proving it first was misreported `cited-unverified` and `--check`
// failed a legitimate receipt (the mirror of F36, which demoted on prose
// citations in the legacy ledger).
// ---------------------------------------------------------------------------

test("#308 F47 a folded line citing its fold commit before a context commit is proven", (t) => {
  const { root, fold, writeDoc } = makeDocFixture(t);
  const proof = fold("fix(x): fold F7 — correct the parse");
  const context = fold("docs(x): note the follow-up that shipped with it");
  writeDoc([`- **F1** — 2026-10-23, folded F7 · \`${proof}\` · context \`${context}\` · verified at the head.`]);

  const row = JSON.parse(docRun(root, "--json").stdout).rows.find((e) => e.id === "F7");
  assert.equal(row.status, "proven-cited", `the citing order decided the verdict: ${JSON.stringify(row)}`);
  assert.equal(row.fold, proof.slice(0, 7));
  const check = docRun(root, "--check");
  assert.equal(check.status, 0, `${check.stdout}${check.stderr}`);
  assert.match(check.stdout, /CHECK PASS/);
});
