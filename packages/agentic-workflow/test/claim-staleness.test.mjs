#!/usr/bin/env node
// test-obligation: protects=packages/agentic-workflow/src/runner/sensors/claim-staleness.mjs obligations=contract,failure-path,convention

/**
 * Issue #634 — the claim-staleness projection.
 *
 * A claim ledger (`sources.md`) states what each row rests on and cites the bytes
 * that prove it. Those bytes move: a later phase rewrites the file a `CLAIM` row
 * points at, and the row keeps asserting its `certainty` while its citation rots.
 * This suite pins the projection that answers, per row, whether the cited bytes
 * moved after a RECORDED phase — and the mark it writes.
 *
 * The obligations it covers, one per case below:
 *
 *   · the mark grammar — `stale (P<n> · <sha>)` is a literal, not a substring;
 *   · phase precedence — the mark names the NEWEST recorded phase whose revision
 *     no longer contains the cited bytes, never the earliest;
 *   · the three no-signal states — `no-citation`, `unverified: no-recorded-phase`,
 *     `unverified: unresolvable-revision (P<n>)` — because a false `fresh` is the
 *     defect this projection exists to prevent;
 *   · the write is confined to one appended column and is idempotent;
 *   · the sensor op is additive: `build`/`verify`/`contract` keep answering.
 *
 * Fixtures only: every git answer is injected, and the one end-to-end case builds
 * a throwaway repository under `mkdtemp`, so this file never reads the live tree.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const BIN = path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs");

const {
  CLAIM_STALENESS_STATES,
  renderStalenessMark,
  citedPaths,
  phaseRevisions,
  projectClaimStaleness,
  writeStalenessColumn,
} = await import("../../packages/agentic-workflow/src/runner/sensors/claim-staleness.mjs");

/* ------------------------------------------------------------------ fixtures */

const ledger = (...rows) => [
  "| id | claim | source | provenance | certainty |",
  "|---|---|---|---|---|",
  ...rows,
  "",
].join("\n");

const unitDoc = (...phases) => [
  "# toy",
  "",
  "## Log",
  "",
  ...phases,
  "",
].join("\n");

const PHASE_1 = "1111111111111111111111111111111111111111";
const PHASE_2 = "2222222222222222222222222222222222222222";
const PHASE_3 = "3333333333333333333333333333333333333333";

/**
 * The injected git answers, shaped like the sensor's own `gitRun`: `diff
 * --name-only <rev> -- <paths>` names what moved at that revision, `rev-parse
 * --verify` resolves a recorded token, `ls-files --error-unmatch` says whether a
 * cited path is tracked (a claim that cites an untracked file has nothing to
 * compare against a revision).
 */
function fakeGit({ tracked = [], revisions = {}, moved = {} } = {}) {
  return (...args) => {
    if (args[0] === "rev-parse" && args[1] === "--verify") {
      const token = String(args[2]).replace(/\^\{commit\}$/u, "");
      return Object.hasOwn(revisions, token) ? revisions[token] : "";
    }
    if (args[0] === "ls-files" && args[1] === "--error-unmatch") {
      const wanted = args.filter((a) => !a.startsWith("--") && a !== "ls-files");
      const target = wanted[wanted.length - 1];
      return tracked.includes(target) ? target : "";
    }
    if (args[0] === "diff" && args[1] === "--name-only") {
      const revision = args[2];
      const separator = args.indexOf("--");
      const paths = separator === -1 ? [] : args.slice(separator + 1);
      const movedHere = moved[revision] ?? [];
      return paths.filter((p) => movedHere.includes(p)).join("\n");
    }
    if (args[0] === "ls-files" && args[1] === "--others") return "";
    return "";
  };
}

/* ------------------------------------------------------- the mark vocabulary */

test("the mark vocabulary is closed and published by the module", () => {
  assert.deepEqual([...CLAIM_STALENESS_STATES], [
    "fresh",
    "stale",
    "no-citation",
    "unverified-no-phase",
    "unverified-unresolvable-revision",
  ]);
});

test("renderStalenessMark prints the literal grammar the issue asks for", () => {
  assert.equal(renderStalenessMark({ state: "fresh" }), "fresh");
  assert.equal(renderStalenessMark({ state: "no-citation" }), "no-citation");
  assert.equal(renderStalenessMark({ state: "unverified-no-phase" }), "unverified: no-recorded-phase");
  assert.equal(
    renderStalenessMark({ state: "stale", phase: 2, revision: "a1b2c3d4e5f6" }),
    "stale (P2 · a1b2c3d4e5f6)",
    "the mark is `stale (P<n> · <sha>)`, exactly",
  );
  assert.equal(
    renderStalenessMark({ state: "unverified-unresolvable-revision", phase: 3 }),
    "unverified: unresolvable-revision (P3)",
  );
});

test("renderStalenessMark refuses a state outside the published vocabulary", () => {
  assert.throws(() => renderStalenessMark({ state: "kinda-stale" }), /published vocabulary/u);
  assert.throws(
    () => renderStalenessMark({ state: "stale", phase: 1 }),
    /needs a phase and a revision/u,
    "a mark without its evidence is refused, never printed half-empty",
  );
});

/* ------------------------------------------------------------ cited paths */

test("citedPaths reads the shapes a `source` cell really carries", () => {
  assert.deepEqual(
    citedPaths("`docs/features/22-bounded-delivery-loops/decisions.md:3-4`"),
    ["docs/features/22-bounded-delivery-loops/decisions.md"],
    "a line range is not part of the path",
  );
  assert.deepEqual(
    citedPaths("`packages/x/src/pre-execution.ts:225`; `scripts/unit-doc-contract.test.mjs:3-13`"),
    ["packages/x/src/pre-execution.ts", "scripts/unit-doc-contract.test.mjs"],
    "two citations in one cell are two paths",
  );
  assert.deepEqual(
    citedPaths("`scripts/needs-input.mjs:43,63`"),
    ["scripts/needs-input.mjs"],
    "a comma list of lines is not part of the path",
  );
  assert.deepEqual(citedPaths("`SPEC.md#Non-goals`"), ["SPEC.md"], "an anchor is not part of the path");
  assert.deepEqual(citedPaths("`#308` §Scope 1"), [], "an issue reference is not a path");
  assert.deepEqual(citedPaths("`cat ~/.pi/agent/mcp.json`"), [], "a path outside the repository is not projectable");
  assert.deepEqual(citedPaths("owner answer"), [], "a prose provenance names no path");
  assert.deepEqual(citedPaths("`gh issue view 303/305`"), [], "a forge read is not a path");
});

/* ------------------------------------------------------------ phase reading */

test("phaseRevisions reads a recorded phase and the commit it carries", () => {
  const doc = unitDoc(
    "- **P1** — 2026-11-04, the renderer · `1111111`.",
    "- **P2** — 2026-11-04, the publisher, no sha recorded here.",
    "- **P3** — 2026-11-05 · `3333333` (suite landed red first in `9999999`).",
  );
  assert.deepEqual(phaseRevisions(doc), [
    { phase: 1, revision: "1111111" },
    { phase: 3, revision: "9999999" },
  ], "a line with no sha records no revision, and the last sha on the line is the phase's");
});

test("phaseRevisions answers nothing for a unit that records no phase", () => {
  assert.deepEqual(phaseRevisions(unitDoc("- **E1** — a run, not a phase.")), []);
});

/* ------------------------------------------------------------- the projection */

const project = (sourcesText, docText, git, unitDir = "docs/features/toy") =>
  projectClaimStaleness({ sourcesText, unitDocText: docText, gitRun: git, unitDir });

test("a row whose cited bytes moved after a phase is marked `stale (P<n> · <sha>)`", () => {
  const sources = ledger(
    "| CLAIM-001 | the reader exists | `scripts/reader.mjs:12` | repository | confirmed |",
  );
  const doc = unitDoc("- **P1** — the module · `1111111`.", "- **P2** — the suite · `2222222`.");
  const git = fakeGit({
    tracked: ["scripts/reader.mjs"],
    revisions: { 1111111: PHASE_1, 2222222: PHASE_2 },
    moved: { [PHASE_2]: ["scripts/reader.mjs"] },
  });
  const { rows } = project(sources, doc, git);
  assert.equal(rows.length, 1, "the row is reported, never dropped");
  assert.equal(rows[0].mark, "stale (P2 · 222222222222)");
  assert.equal(rows[0].phase, 2);
  assert.deepEqual(rows[0].movedPaths, ["scripts/reader.mjs"]);
});

test("the mark names the NEWEST phase whose revision no longer holds the bytes", () => {
  // The file moved after P1 only: P2 and P3 already contain the new bytes, so the
  // honest statement is "changed after P1" — naming P3 would blame a checkpoint
  // that saw the current content.
  const sources = ledger(
    "| CLAIM-001 | the reader exists | `scripts/reader.mjs` | repository | confirmed |",
  );
  const doc = unitDoc(
    "- **P1** — a · `1111111`.",
    "- **P2** — b · `2222222`.",
    "- **P3** — c · `3333333`.",
  );
  const git = fakeGit({
    tracked: ["scripts/reader.mjs"],
    revisions: { 1111111: PHASE_1, 2222222: PHASE_2, 3333333: PHASE_3 },
    moved: { [PHASE_1]: ["scripts/reader.mjs"] },
  });
  assert.equal(project(sources, doc, git).rows[0].mark, "stale (P1 · 111111111111)");
});

test("an unmoved citation is `fresh`, and a row citing nothing projectable is `no-citation`", () => {
  const sources = ledger(
    "| CLAIM-001 | the reader exists | `scripts/reader.mjs` | repository | confirmed |",
    "| CLAIM-002 | the owner wants this | `#308` §Scope 1 | owner answer | confirmed |",
  );
  const doc = unitDoc("- **P1** — a · `1111111`.");
  const git = fakeGit({ tracked: ["scripts/reader.mjs"], revisions: { 1111111: PHASE_1 } });
  const { rows } = project(sources, doc, git);
  assert.equal(rows[0].mark, "fresh");
  assert.equal(rows[1].mark, "no-citation");
  assert.equal(rows.length, 2, "no row is ever silently dropped");
});

test("a unit with no recorded phase answers `unverified: no-recorded-phase`, never a false fresh", () => {
  const sources = ledger("| CLAIM-001 | x | `scripts/reader.mjs` | repository | confirmed |");
  const git = fakeGit({ tracked: ["scripts/reader.mjs"] });
  assert.equal(project(sources, unitDoc("- **E1** — a run."), git).rows[0].mark, "unverified: no-recorded-phase");
});

test("an unresolvable recorded revision is stated, never read as fresh", () => {
  const sources = ledger("| CLAIM-001 | x | `scripts/reader.mjs` | repository | confirmed |");
  const doc = unitDoc("- **P1** — a · `deadbeef`.");
  const git = fakeGit({ tracked: ["scripts/reader.mjs"], revisions: {} });
  assert.equal(
    project(sources, doc, git).rows[0].mark,
    "unverified: unresolvable-revision (P1)",
  );
});

test("a bare filename resolves inside the unit folder, and an untracked one is not projectable", () => {
  const sources = ledger(
    "| CLAIM-001 | the spec says so | `SPEC.md#Non-goals` | repository | confirmed |",
    "| CLAIM-002 | a scratch file says so | `notes.md` | repository | confirmed |",
  );
  const doc = unitDoc("- **P1** — a · `1111111`.");
  const git = fakeGit({ tracked: ["docs/features/toy/SPEC.md"], revisions: { 1111111: PHASE_1 } });
  const { rows } = project(sources, doc, git);
  assert.equal(rows[0].mark, "fresh", "`SPEC.md` in a unit ledger means the unit's own SPEC");
  assert.equal(rows[1].mark, "no-citation", "a path git cannot see at a revision is not projectable");
});

/* --------------------------------------------------------------- the write */

const withMarks = (sourcesText, rows) => writeStalenessColumn(sourcesText, rows);

test("the write appends one column and touches nothing else", () => {
  const sources = [
    "# Sources — toy",
    "",
    "Prose that must survive untouched, with a `|` pipe in it.",
    "",
    ledger(
      "| CLAIM-001 | the reader exists | `scripts/reader.mjs` | repository | confirmed |",
    ),
    "",
    "## Notes",
    "",
    "A trailing note.",
    "",
  ].join("\n");
  const rows = [{ id: "CLAIM-001", mark: "stale (P2 · 222222222222)" }];
  const written = withMarks(sources, rows);
  assert.match(written, /^\| id \| claim \| source \| provenance \| certainty \| staleness \|$/mu);
  assert.match(
    written,
    /^\| CLAIM-001 \| the reader exists \| `scripts\/reader\.mjs` \| repository \| confirmed \| stale \(P2 · 222222222222\) \|$/mu,
  );
  assert.match(written, /^Prose that must survive untouched, with a `\|` pipe in it\.$/mu, "prose is byte-identical");
  assert.match(written, /^A trailing note\.$/mu);
  assert.equal(withMarks(written, rows), written, "a second run is byte-identical — idempotent, not additive");
});

test("the write preserves an escaped pipe inside an existing cell", () => {
  const sources = ledger(
    "| CLAIM-001 | a row with an escaped \\| pipe | `scripts/reader.mjs` | repository | confirmed |",
  );
  const written = withMarks(sources, [{ id: "CLAIM-001", mark: "fresh" }]);
  assert.match(written, /escaped \\\| pipe/u, "the escape survives the rewrite");
  assert.match(written, /\| confirmed \| fresh \|$/mu);
});

test("the write leaves a row it was not given, and a non-claim row, untouched", () => {
  const sources = ledger(
    "| CLAIM-001 | first | `scripts/a.mjs` | repository | confirmed |",
    "| NOT-A-CLAIM | something else | — | repository | confirmed |",
  );
  const written = withMarks(sources, [{ id: "CLAIM-001", mark: "fresh" }]);
  assert.match(written, /\| CLAIM-001 \|[^\n]*\| fresh \|$/mu);
  assert.match(written, /^\| NOT-A-CLAIM \| something else \| — \| repository \| confirmed \|$/mu);
});

test("the write covers every claim table in one file", () => {
  const sources = [
    ledger("| CLAIM-001 | a | `scripts/a.mjs` | repository | confirmed |"),
    "",
    "## Second table",
    "",
    ledger("| INV-001 | b | `scripts/b.mjs` | repository | confirmed |"),
  ].join("\n");
  const written = withMarks(sources, [
    { id: "CLAIM-001", mark: "fresh" },
    { id: "INV-001", mark: "stale (P1 · 111111111111)" },
  ]);
  assert.equal((written.match(/\| staleness \|$/gmu) ?? []).length, 2, "both tables gained the column");
  assert.match(written, /\| INV-001 \|[^\n]*\| stale \(P1 · 111111111111\) \|$/mu);
});

/* ------------------------------------------------------------------- the CLI */

/** A throwaway repository, so the op is proved end to end without the live tree. */
function toyRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), "claim-staleness-"));
  const git = (...args) =>
    spawnSync("git", args, { cwd: dir, encoding: "utf8", env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null" } });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "Fixture");
  mkdirSync(path.join(dir, "docs", "features", "toy"), { recursive: true });
  mkdirSync(path.join(dir, "scripts"), { recursive: true });
  writeFileSync(path.join(dir, "scripts", "reader.mjs"), "export const a = 1;\n");
  writeFileSync(
    path.join(dir, "docs", "features", "toy", "sources.md"),
    ledger("| CLAIM-001 | the reader exists | `scripts/reader.mjs:1` | repository | confirmed |"),
  );
  writeFileSync(
    path.join(dir, "docs", "features", "toy", "SPEC.md"),
    unitDoc("- **P1** — the reader · `PHASE1`."),
  );
  git("add", "-A");
  git("commit", "-q", "-m", "fixture: base");
  const phase1 = git("rev-parse", "HEAD").stdout.trim();
  // The phase line names the commit the phase produced; the sha is written after
  // the commit exists, exactly as a real unit doc records it.
  writeFileSync(
    path.join(dir, "docs", "features", "toy", "SPEC.md"),
    unitDoc(`- **P1** — the reader · \`${phase1.slice(0, 7)}\`.`),
  );
  git("add", "-A");
  git("commit", "-q", "-m", "fixture: record the phase");
  // Now the cited bytes move.
  writeFileSync(path.join(dir, "scripts", "reader.mjs"), "export const a = 2;\n");
  return { dir, phase1, git };
}

const runBin = (args, cwd) =>
  spawnSync(process.execPath, [BIN, "pre-execution-snapshot", ...args], { cwd, encoding: "utf8" });

test("the `claims` op reports a stale row and exits 0 (mark-and-report, never a block)", () => {
  const { dir } = toyRepo();
  try {
    const result = runBin(["claims", "--unit", "toy", "--root", dir], dir);
    assert.equal(result.status, 0, `report-only: ${result.stderr}`);
    assert.match(result.stdout, /^claim-staleness@1$/mu);
    assert.match(result.stdout, /stale \(P1 · [0-9a-f]{12}\)/u, "the moved citation is marked");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("`--write` projects the mark into sources.md, and a second run changes no byte", () => {
  const { dir } = toyRepo();
  const sources = path.join(dir, "docs", "features", "toy", "sources.md");
  try {
    const first = runBin(["claims", "--unit", "toy", "--root", dir, "--write"], dir);
    assert.equal(first.status, 0, first.stderr);
    const once = readFileSync(sources, "utf8");
    assert.match(once, /\| staleness \|$/mu);
    const second = runBin(["claims", "--unit", "toy", "--root", dir, "--write"], dir);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(readFileSync(sources, "utf8"), once, "idempotent");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("`--check` exits 1 on a stale row and 0 when the ledger is clean", () => {
  const { dir } = toyRepo();
  try {
    const stale = runBin(["claims", "--unit", "toy", "--root", dir, "--check"], dir);
    assert.equal(stale.status, 1, "a caller may gate on it; the default run does not");
    writeFileSync(path.join(dir, "scripts", "reader.mjs"), "export const a = 2;\n");
    const committed = spawnSync("git", ["add", "-A"], { cwd: dir, encoding: "utf8" });
    assert.equal(committed.status, 0);
    spawnSync("git", ["commit", "-q", "-m", "fixture: settle"], { cwd: dir, encoding: "utf8" });
    // Settling the working tree does not change the answer: the mark is against a
    // RECORDED phase revision, and that phase still predates the move.
    assert.equal(runBin(["claims", "--unit", "toy", "--root", dir, "--check"], dir).status, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("`--check` exits 2 on a usage error, and a missing ledger is a refusal", () => {
  const { dir } = toyRepo();
  try {
    assert.equal(runBin(["claims", "--root", dir], dir).status, 2, "no --unit is a usage error");
    rmSync(path.join(dir, "docs", "features", "toy", "sources.md"));
    const missing = runBin(["claims", "--unit", "toy", "--root", dir], dir);
    assert.equal(missing.status, 2, "no claim ledger means nothing to project");
    assert.match(missing.stderr, /sources\.md/u, "the refusal names the artifact it looked for");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the three existing ops still answer — the op is additive", () => {
  const contract = spawnSync(process.execPath, [BIN, "pre-execution-snapshot", "contract"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(contract.status, 0, contract.stderr);
  assert.match(contract.stdout, /"receiptContract"/u);
  assert.ok(existsSync(BIN));
});
