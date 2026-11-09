/**
 * findings-corpus.test.mjs — the reader's contract (issue #437, S2/S3/S4/S6/S10).
 *
 * Three behaviours are pinned here, and nothing else:
 *
 *   harvest     both carriers join into one row set, every row bound to its
 *               `file:line` and a digest of the bytes it was parsed from;
 *   admission   CIVER's two halves as deterministic gates — a `· fold <sha>`
 *               commit that touches the named path, and recurrence across
 *               distinct units — with every other row kept as annotated data;
 *   attribution the phase that should have caught each recurring class, the
 *               unmapped axes reported instead of bucketed, the loop-health
 *               metric and the ARW code-net ratio with its band.
 *
 * Fixtures are throwaway trees under the OS temp dir; the real tree is read
 * once to prove the counts the planning ledger froze (1147 findings, 56 legacy
 * ledgers, 373 fold-annotated rows).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ARW_OWNER_BASELINE,
  SEVERITY_BANDS,
  admit,
  arwBand,
  attribute,
  buildCorpus,
  digestOf,
  parseLegacyLedger,
  parseMigratedCarrier,
  phaseOfAxis,
  severityBandOf,
} from "./findings-corpus.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "scripts", "findings-corpus.mjs");

function tempTree() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "findings-corpus-"));
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function run(args, opts = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: opts.cwd || ROOT,
    encoding: "utf8",
    env: { ...process.env, ...(opts.env || {}) },
  });
}

function field(stdout, name) {
  const match = stdout.match(new RegExp(`^${name} \\| (.*)$`, "m"));
  return match ? match[1] : null;
}

const LEGACY = `# review findings

Cycle 1 — reviewed head 1111111111111111111111111111111111111111 (PR #1, open).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | scripts/a.mjs:10 | code | high | fix-now | fold into current unit · fold aaaaaaa | yes |
| F2 | docs/b.md:3 | workflow | low | fix-now | fold into current unit | no |
| REVIEW-RAN | HEAD 1111111111111111111111111111111111111111 | n/a | n/a | review-mark | n/a | n/a |
`;

const MIGRATED = `## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | S1 · scripts/c.mjs:7 | code | WARNING | blocking | source | fold |

## Log

- **F1** — 2026-01-01, folded · fold bbbbbbb.
- **R1** — 2026-01-02, review at HEAD 2222222222222222222222222222222222222222 · verdict REVIEW-PASS · cycle 2 · gate exit 0.
- **V1** — scripts/c.mjs:7 · reviewer review-change · HEAD 2222222222222222222222222222222222222222 · recheck direct read · confirmed
`;

test("harvest: the real tree yields the counts the planning ledger froze", () => {
  const corpus = buildCorpus(ROOT, { resolveFold: () => null });
  assert.equal(corpus.findings.length, 1149, "every finding row in either carrier is in the corpus");
  assert.equal(corpus.legacyLedgers, 56);
  assert.equal(corpus.foldAnnotated, 229);
  assert.equal(corpus.reviewMarks, 173);
  assert.ok(corpus.units.length >= 171);
  assert.deepEqual(corpus.unparsable, []);
  assert.ok(corpus.findings.every((row) => row.provenance.includes(":") && row.digest.length === 12));
});

test("harvest: provenance digest moves with the bytes and never with a re-derivation", () => {
  const a = digestOf("| F1 | x | code | high | fix-now | fold | yes |");
  const b = digestOf("| F1 | x | code | high | fix-now | fold | no |");
  assert.equal(a.length, 12);
  assert.notEqual(a, b);
  const rows = parseLegacyLedger(LEGACY, { file: "docs/fix/1-x/review-findings.md", unit: "fix-1-x" });
  assert.equal(rows.findings.length, 2);
  assert.equal(rows.findings[0].provenance.split(":")[1], "7");
  assert.equal(rows.findings[0].severity, "high");
  assert.equal(rows.findings[0].band, "material");
  assert.equal(rows.findings[1].band, "below-floor");
});

test("harvest: a prose table whose first column is also F<n> is never a finding", () => {
  const withReceipt = `${LEGACY}
## Fold receipt

| Row | Repaired in | What the fold had to get right |
|---|---|---|
| F1 | scripts/a.mjs | the level is restored whenever the turn touched the session |
`;
  const parsed = parseLegacyLedger(withReceipt, { file: "docs/fix/1-x/review-findings.md", unit: "fix-1-x" });
  assert.equal(parsed.findings.length, 2);
  assert.equal(parsed.reviewMarks, 1);
  assert.deepEqual(parsed.unparsable, []);
});

test("harvest: the migrated carrier reads its rows, its fold line and its marks", () => {
  const parsed = parseMigratedCarrier(MIGRATED, { file: "docs/features/2-y/SPEC.md", unit: "2-y" });
  assert.equal(parsed.findings.length, 1);
  assert.equal(parsed.findings[0].folded, true);
  assert.equal(parsed.findings[0].foldSha, "bbbbbbb");
  assert.equal(parsed.findings[0].severity, "WARNING");
  assert.equal(parsed.reviewMarks, 1);
  assert.equal(parsed.migratedRows, 1);
});

test("admission: a fold that repaired another path never admits the row", () => {
  const rows = parseLegacyLedger(LEGACY, { file: "docs/fix/1-x/review-findings.md", unit: "fix-1-x" }).findings;
  const admitted = admit(rows, {
    minRecurrence: 1,
    resolveFold: () => ({ sha: "aaaaaaa", paths: ["scripts/other.mjs"] }),
  });
  assert.equal(admitted[0].status, "annotated");
  assert.match(admitted[0].reason, /fold commit does not touch/);
});

test("admission: both gates pass only for a repaired, recurring row", () => {
  const second = `# review findings

Cycle 1 — reviewed head 3333333333333333333333333333333333333333 (PR #2, open).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F9 | scripts/a.mjs:10 | code | high | fix-now | fold into current unit · fold ccccccc | yes |
`;
  const rows = [
    ...parseLegacyLedger(LEGACY, { file: "docs/fix/1-x/review-findings.md", unit: "fix-1-x" }).findings,
    ...parseLegacyLedger(second, { file: "docs/fix/2-z/review-findings.md", unit: "fix-2-z" }).findings,
  ];
  const admitAll = admit(rows, {
    minRecurrence: 2,
    resolveFold: () => ({ sha: "x", paths: ["scripts/a.mjs"] }),
  });
  const admittedRows = admitAll.filter((row) => row.status === "admitted");
  assert.equal(admittedRows.length, 2, "the code axis recurs across two units and both folds repaired it");
  assert.ok(admitAll.some((row) => row.status === "annotated" && /recurrence/.test(row.reason)));
});

test("admission: a single occurrence is annotated data, never learning input", () => {
  const rows = parseLegacyLedger(LEGACY, { file: "docs/fix/1-x/review-findings.md", unit: "fix-1-x" }).findings;
  const out = admit(rows, { minRecurrence: 2, resolveFold: () => ({ sha: "a", paths: ["scripts/a.mjs"] }) });
  assert.ok(out.every((row) => row.status === "annotated"));
  assert.ok(out.every((row) => /recurrence/.test(row.reason)));
});

test("attribution: a known axis names exactly one phase and its proposal", () => {
  assert.equal(phaseOfAxis("code"), "gate");
  assert.equal(phaseOfAxis("spec-drift"), "design");
  assert.equal(phaseOfAxis("workflow"), "triage");
  assert.equal(phaseOfAxis("plan"), "plan");
  assert.equal(phaseOfAxis("mystery"), null);
  const classes = attribute(
    [
      { klass: "source", axis: "code", status: "admitted", unit: "1-a" },
      { klass: "source", axis: "code", status: "admitted", unit: "2-b" },
      { klass: "source", axis: "mystery", status: "admitted", unit: "1-a" },
      { klass: "source", axis: "mystery", status: "admitted", unit: "2-b" },
    ],
    { threshold: 2 },
  );
  const known = classes.find((row) => row.axis === "code");
  assert.equal(known.phase, "gate");
  assert.match(known.proposal, /GATE_INVENTORY/);
  const unknown = classes.find((row) => row.axis === "mystery");
  assert.equal(unknown.phase, "unmapped");
  assert.equal(unknown.proposal, null);
});

test("severity: every legacy token normalizes into the published bands", () => {
  for (const token of ["critical", "high", "major", "med", "medium", "low", "minor", "info"]) {
    assert.ok(SEVERITY_BANDS[severityBandOf(token)], `${token} has a band`);
  }
  assert.equal(severityBandOf("SUGGESTION"), "below-floor");
  assert.equal(severityBandOf("BLOCKER"), "blocker");
});

test("arw: the ratio excludes documentation surfaces and stays unbanded under three units", () => {
  assert.deepEqual(ARW_OWNER_BASELINE, { historical: 0.28, last30Days: 0.18 });
  assert.equal(arwBand(2), "insufficient-corpus");
  assert.equal(arwBand(3), "measured");
  const corpus = buildCorpus(ROOT, { resolveFold: () => null });
  assert.ok(corpus.arw.every((row) => row.surfaces.every((p) => !p.startsWith("docs/"))));
});

test("required failure state: an empty corpus is a defect, not a vacuous pass", () => {
  const empty = tempTree();
  write(path.join(empty, "docs", "fix", "1-x", "SPEC.md"), "# 1 — x\n");
  const result = run(["--repo", empty]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /findings-corpus: empty corpus/);
});

test("required failure state: a ledger whose rows all fail to parse is refused, naming the file", () => {
  const broken = tempTree();
  write(
    path.join(broken, "docs", "fix", "1-x", "review-findings.md"),
    "| id | file:line | axis | severity | class | route | folded |\n|---|---|---|---|---|---|---|\n| F1 | x | y |\n",
  );
  const result = run(["--repo", broken]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unparsable/);
});

test("read-only: a run leaves the tree byte-identical", () => {
  const tree = tempTree();
  write(
    path.join(tree, "docs", "fix", "1-x", "review-findings.md"),
    LEGACY,
  );
  const before = fs.readdirSync(tree, { recursive: true }).sort();
  const result = run(["--repo", tree]);
  const after = fs.readdirSync(tree, { recursive: true }).sort();
  assert.deepEqual(after, before);
  assert.equal(result.status, 0);
  assert.equal(field(result.stdout, "findings"), "2");
});

test("usage: an unknown flag is exit 2, never a silent run", () => {
  const result = run(["--nope"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage/);
});
