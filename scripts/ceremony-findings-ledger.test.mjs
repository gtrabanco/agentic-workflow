/**
 * ceremony-findings-ledger.test.mjs — ceremony `findings` + `ledger` modules
 * (fix #338, P5).
 *
 * Fixtures: hermetic temp repos. A migrated fixture carries the unit doc's
 * `## Findings` table + `## Log`; a legacy fixture has no `## Findings`
 * section and a copied `review-findings.md`. Pins the R1 frozen-failure
 * reproducer (ledger count over a legacy carrier, grep-equivalent) and the R4
 * reproducer (folded flip replaces the ad-hoc `sed -i`).
 */

import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { cer, makeRepo, unitDoc } from "./ceremony/testing.mjs";

const REPO = path.resolve(import.meta.dirname, "..");

function makeUnit({ findingsRows = "", log = "" } = {}) {
  const dir = makeRepo();
  fs.mkdirSync(path.join(dir, "docs/fix/1-fixture"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/fix/1-fixture/SPEC.md"), unitDoc({ findings: findingsRows, log }));
  return dir;
}

/** Legacy fixture: a SPEC without `## Findings` + a copied legacy side ledger. */
function makeLegacyUnit() {
  const dir = makeRepo();
  fs.mkdirSync(path.join(dir, "docs/fix/2-legacy"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/fix/2-legacy/SPEC.md"), `# fix/2-legacy\n\n## Issue\n\n\`#2\` — legacy.\n`);
  const source = fs.readFileSync(path.join(REPO, "docs/fix/258-harden-needs-input-contracts/review-findings.md"), "utf8");
  fs.writeFileSync(path.join(dir, "docs/fix/2-legacy/review-findings.md"), source);
  return dir;
}

const ROW = (id, sev = "med", folded = "") =>
  `| ${id} | src/a.ts:1 | code | ${sev} | fix-now | fold |${folded ? ` ${folded} |` : ""}`;

test("findings append/read/update on the migrated table (S4, S7)", () => {
  const dir = makeUnit();
  const a = cer(["findings", "append", "--slug", "1-fixture", "--file", "src/a.ts", "--line", "1", "--axis", "code", "--severity", "med", "--class", "fix-now", "--route", "fold"], dir);
  assert.equal(a.code, 0);
  assert.equal(a.json.finding.id, "F1");
  const b = cer(["findings", "append", "--slug", "1-fixture", "--file", "src/b.ts", "--line", "2", "--axis", "security", "--severity", "high", "--class", "fix-now", "--route", "fold"], dir);
  assert.equal(b.json.finding.id, "F2");
  const read = cer(["findings", "read", "--slug", "1-fixture"], dir);
  assert.equal(read.json.carrier, "unit-doc");
  assert.equal(read.json.findings.length, 2);
  const up = cer(["findings", "update", "--slug", "1-fixture", "--id", "1", "--severity", "low"], dir);
  assert.equal(up.code, 0);
  assert.equal(up.json.severity, "low");
  assert.equal(cer(["findings", "read", "--slug", "1-fixture"], dir).json.findings[0].severity, "low");
});

test("R4 reproducer: `findings update --folded true` removes the row and appends the F log line (O12)", () => {
  const dir = makeUnit({ findingsRows: ROW("F1") });
  const before = cer(["findings", "read", "--slug", "1-fixture"], dir);
  assert.equal(before.json.findings.length, 1);
  const r = cer(["findings", "update", "--slug", "1-fixture", "--id", "1", "--folded", "true"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.folded, true);
  const after = cer(["findings", "read", "--slug", "1-fixture"], dir);
  assert.deepEqual(after.json.findings, []);
  const log = cer(["ledger", "read", "--slug", "1-fixture"], dir);
  const fLine = log.json.marks.find((m) => m.kind === "F");
  assert.ok(fLine, "an F log line must exist after the fold");
  assert.match(fLine.text, /folded F1 \(code\)/);
  // no `sed -i` in sight: the flip was one closed operation
});

test("folded flip on a migrated carrier: --folded false is a usage error", () => {
  const dir = makeUnit({ findingsRows: ROW("F1") });
  const r = cer(["findings", "update", "--slug", "1-fixture", "--id", "1", "--folded", "false"], dir);
  assert.equal(r.code, 1);
  assert.equal(r.json.error, "fold-flip-unsupported");
});

test("findings delete by id/axis/severity and delete-all", () => {
  const dir = makeUnit({ findingsRows: [ROW("F1", "low"), ROW("F2"), ROW("F3", "low")].join("\n") });
  assert.equal(cer(["findings", "delete", "--slug", "1-fixture", "--id", "2"], dir).json["deleted-count"], 1);
  assert.equal(cer(["findings", "delete", "--slug", "1-fixture", "--severity", "low"], dir).json["deleted-count"], 2);
  assert.equal(cer(["findings", "append", "--slug", "1-fixture", "--file", "c.ts", "--axis", "a", "--severity", "low", "--class", "c", "--route", "r"], dir).json.finding.id, "F1");
  assert.equal(cer(["findings", "delete-all", "--slug", "1-fixture"], dir).json["deleted-count"], 1);
  assert.deepEqual(cer(["findings", "read", "--slug", "1-fixture"], dir).json.findings, []);
});

test("findings merge keeps the lowest id and the highest severity (S5)", () => {
  const dir = makeUnit({ findingsRows: [ROW("F1", "low"), ROW("F2", "high"), ROW("F3", "med")].join("\n") });
  const r = cer(["findings", "merge", "--slug", "1-fixture", "--ids", "2,1,3"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json["new-id"], "F1");
  assert.equal(r.json.finding.severity, "high");
  assert.match(r.json.finding.target, /src\/a\.ts:1 \+ src\/a\.ts:1 \+ src\/a\.ts:1/);
  const read = cer(["findings", "read", "--slug", "1-fixture"], dir);
  assert.equal(read.json.findings.length, 1);
});

test("findings summarize groups by axis/severity/class; legacy carrier is read-only", () => {
  const dir = makeUnit({ findingsRows: [ROW("F1", "low"), ROW("F2", "high")].join("\n") });
  const s = cer(["findings", "summarize", "--slug", "1-fixture"], dir);
  assert.equal(s.json.total, 2);
  assert.equal(s.json.bySeverity.high, 1);
  const legacy = makeLegacyUnit();
  const lr = cer(["findings", "read", "--slug", "2-legacy"], legacy);
  assert.equal(lr.json.carrier, "legacy");
  assert.ok(lr.json.findings.length > 50, `legacy F rows parsed: ${lr.json.findings.length}`);
  const lw = cer(["findings", "update", "--slug", "2-legacy", "--id", "1", "--severity", "low"], legacy);
  assert.equal(lw.code, 1);
  assert.equal(lw.json.error, "legacy-carrier-readonly");
});

test("R1 reproducer: ledger count over the legacy 258 carrier equals the ad-hoc grep (O9)", () => {
  const dir = makeLegacyUnit();
  const r = cer(["ledger", "count", "--slug", "2-legacy"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.carrier, "legacy");
  const grepCount = fs.readFileSync(path.join(dir, "docs/fix/2-legacy/review-findings.md"), "utf8")
    .split("\n").filter((l) => l.includes("REVIEW-RAN")).length;
  assert.equal(grepCount, 23, "the copied legacy ledger carries 23 REVIEW-RAN lines");
  assert.equal(r.json.counts["REVIEW-RAN"], grepCount);
  assert.equal(r.json.counts["VF"], 68);
});

test("ledger read/count over the migrated Log; append maps marks to log kinds (S5)", () => {
  const dir = makeUnit({ log: "- **R1** — 2026-11-24, HEAD abc · review ran." });
  const c = cer(["ledger", "count", "--slug", "1-fixture"], dir);
  assert.equal(c.json.carrier, "unit-doc");
  assert.equal(c.json.counts.R, 1);
  const a = cer(["ledger", "append", "--slug", "1-fixture", "--mark", "GATE-RAN", "--sha", "def0123", "--detail", "root suite green"], dir);
  assert.equal(a.code, 0);
  assert.equal(a.json.kind, "G");
  const read = cer(["ledger", "read", "--slug", "1-fixture"], dir);
  assert.equal(read.json.marks.length, 2);
  assert.match(read.json.marks[1].text, /HEAD def0123 · root suite green/);
});

test("ledger verify: present mark → exit 0; missing mark → ceremonial block, exit 2", () => {
  const dir = makeUnit({ log: "- **R1** — 2026-11-24, HEAD abc · review ran." });
  const ok = cer(["ledger", "verify", "--slug", "1-fixture", "--required-mark", "REVIEW-RAN"], dir);
  assert.equal(ok.code, 0);
  assert.equal(ok.json.verified, true);
  const no = cer(["ledger", "verify", "--slug", "1-fixture", "--required-mark", "REVIEW-RAN"], makeUnit());
  assert.equal(no.code, 2);
  assert.equal(no.json.verified, false);
});

test("ledger delete by mark and by type on the migrated Log", () => {
  const dir = makeUnit({ log: ["- **R1** — 2026-11-24, one.", "- **R2** — 2026-11-24, two.", "- **G1** — 2026-11-24, gate."].join("\n") });
  const d1 = cer(["ledger", "delete", "--slug", "1-fixture", "--mark", "R1"], dir);
  assert.equal(d1.code, 0);
  assert.equal(cer(["ledger", "read", "--slug", "1-fixture"], dir).json.marks.length, 2);
  const d2 = cer(["ledger", "delete", "--slug", "1-fixture", "--type", "GATE-RAN"], dir);
  assert.equal(d2.json["deleted-count"], 1);
  assert.deepEqual(cer(["ledger", "read", "--slug", "1-fixture"], dir).json.marks.map((m) => m.kind), ["R"]);
});

test("unknown findings/ledger subcommand → exit 1; missing slug → exit 1", () => {
  const dir = makeUnit();
  assert.equal(cer(["findings", "teleport", "--slug", "1-fixture"], dir).code, 1);
  assert.equal(cer(["ledger", "count"], dir).code, 1);
  assert.equal(cer(["ledger", "count", "--slug", "nope"], dir).json.error, "unknown-slug");
});
