// test-obligation: protects=scripts/findings-corpus.mjs obligations=contract,failure-path

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
 * once to prove the counts the planning ledger froze (1178 findings, 56 legacy
 * ledgers, 229 fold-annotated rows).
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

const cleanupDirs = [];

function tempTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "findings-corpus-"));
  cleanupDirs.push(dir);
  return dir;
}

test.after(() => {
  for (const dir of cleanupDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best effort
    }
  }
  cleanupDirs.length = 0;
});

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

/**
 * The settled carrier (issue #651): the settle trims `## Findings`, keeps the
 * whole `## Log` and appends one digest `E` line. Its one-line `F`/`R`/`V` marks
 * must still reach the corpus — a shipped unit's traceability is the reason the
 * trimmer never touches a log line.
 */
const SETTLED = `---

# 3 — settled unit

> One-line: a settled unit.

\`\`\`text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@3
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
- **F1** — 2026-01-01, folded · fold ccccccc.
- **R1** — 2026-01-02, review at HEAD 3333333333333333333333333333333333333333 · verdict REVIEW-PASS · cycle 3 · gate exit 0.
- **V1** — scripts/d.mjs:9 · reviewer review-change · HEAD 3333333333333333333333333333333333333333 · recheck direct read · confirmed
- **E1** — 2026-01-03, the evidence table collapsed at settle — 1 row(s): \`true\` exit 0 — carrier digest \`sha256:000000000000\`.

## References

none
`;

test("reader reconciliation: a settled carrier keeps its one-line marks and opens no row", () => {
  const parsed = parseMigratedCarrier(SETTLED, { file: "docs/features/3-z/SPEC.md", unit: "3-z" });
  assert.deepEqual(parsed.findings, [], "the trimmed table leaves no open row behind");
  assert.equal(parsed.reviewMarks, 1, "the R line survives the settle");
  assert.equal(parsed.verifiedMarks, 1, "the V line survives the settle");

  const root = tempTree();
  write(path.join(root, "docs", "features", "3-z", "SPEC.md"), SETTLED);
  write(path.join(root, "docs", "ROADMAP.md"), "# Roadmap\n\n## Features\n\n| NN | Slug | Status | Dependencies | Summary |\n|---|---|---|---|---|\n| 3 | `z` | done · merged | — | settled |\n\n## Fixes\n\n| Issue | Topic | Status |\n|---|---|---|\n");
  const corpus = buildCorpus(root, { resolveFold: () => null });
  assert.equal(corpus.reviewMarks, 1);
  assert.equal(corpus.findings.length, 0);
  assert.deepEqual(corpus.unparsable, []);
});

test("harvest: the real tree yields the counts the planning ledger froze", () => {
  const corpus = buildCorpus(ROOT, { resolveFold: () => null });
  // 1178 findings, 56 legacy ledgers, 229 fold-annotated rows and 181 review
  // marks were measured on the tree this merge produces, not on either parent:
  // main's lineage carries feature 719's `F9`-`F13` rows and its `R3` line, fix/729
  // adds its own `R1` and `R2` lines, feat/727 (brought in by main) records its own
  // `R1` line on top of main's 179 marks, unit 728 contributes its `R1` line for
  // this branch's review cycle, and fix/722 contributes its `R1` line — its seven
  // `F` lines close the seven rows its review opened, so the finding census is
  // unchanged. The corpus counts what the tree actually carries —
  // the mechanism issue #651 introduced — so a unit that records a finding or a
  // review mark raises it and a folded row lowers it; the assertions stay exact,
  // nothing is relaxed.

  assert.equal(corpus.findings.length, 1178, "every finding row in either carrier is in the corpus");
  assert.equal(corpus.legacyLedgers, 56);
  assert.equal(corpus.foldAnnotated, 229);
  assert.equal(corpus.reviewMarks, 182);
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

test("issue #702 S4: a doc table in the ledger grammar is reported, and its rows still read", () => {
  // The live tree carries one such unit (`docs/fix/353-residue-shadow-copies`):
  // a `## Findings` table whose header is the side ledger's. Reading it by
  // position would turn its `class` into `impact` and its `folded` into `route`;
  // the carrier defect is what makes the drift loud without dropping history.
  const doc = `# 2-y\n\n## Findings\n\n| id | file:line | axis | severity | class | route | folded |\n|---|---|---|---|---|---|---|\n| F1 | a.mjs:3 | code | high | fix-now | fold | no |\n| F2 | a.mjs:9 | code | high | fix-now | fold | yes |\n\n## Log\n`;
  const parsed = parseMigratedCarrier(doc, { file: "docs/features/2-y/SPEC.md", unit: "2-y" });
  assert.deepEqual(parsed.defects.map((defect) => defect.code), ["wrong-carrier-grammar"]);
  assert.equal(parsed.defects[0].grammar, "findings-ledger@1");
  assert.equal(parsed.findings.length, 2, "every row is still in the corpus — a defect never deletes history");
});

test("issue #702 S4: a superseded doc table is reported as superseded, and the live tree's counts hold", () => {
  const doc = `# 3-z\n\n## Findings\n\n| id | S# / file:line | axis | severity | class | route |\n|---|---|---|---|---|---|\n| F1 | a.mjs:3 | code | WARNING | source | fold |\n\n## Log\n`;
  const parsed = parseMigratedCarrier(doc, { file: "docs/features/3-z/SPEC.md", unit: "3-z" });
  assert.deepEqual(parsed.defects.map((defect) => defect.code), ["superseded-grammar"]);
  assert.equal(parsed.findings.length, 1);
});
