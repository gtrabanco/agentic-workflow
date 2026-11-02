/**
 * roadmap-check.test.mjs — the cross-document check between a unit doc's own
 * facts (NN, slug, PR URL) and its index row (issue #316's frozen-failure corpus).
 *
 * Reproducers come from git history:
 *   unit 77 `promise-coherence-guard` — PR #309 merged 2026-10-21, the roadmap
 *   row still read `in-progress` on `main` (caught at audit-pr, after the
 *   review pass was already paid);
 *   unit 79 `spec-by-reference` — seven phases logged, PR #311 open, the row
 *   still `in-progress` until the audit blocked on it.
 *
 * Both live cases carry the URL in-doc (77 in `## Next`, 79 in an Evidence
 * row), so the contradiction is offline-detectable — that is exactly what
 * `checkUnitDoc` detects, with the closed code set in `ROADMAP_CHECK_CODES`.
 */

import { describe, it, before, after } from "node:test";
import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { checkUnitDoc, findRow, ROADMAP_CHECK_CODES, rowUpsert } from "../src/edit/Roadmap.mjs";
import { ROADMAP_DOCUMENT, roadmapTableRows } from "../src/index-document.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "bin", "agentic-workflow.mjs");

const OWNER = "https://github.com/gtrabanco/agentic-workflow";

// The separator/header shapes are the repository's real ones (unit #316 found
// the writer refusing `|----|------|…` because it matched only the literal
// `|---|` — the check and the writer must accept the table that exists).
const REAL_SEPARATOR = "|----|------|--------|------------|---------|";
const roadmapTable = (rows) =>
  ["# Roadmap", "", "## Features", "", "| NN | Slug | Status | Depends on | Summary |", REAL_SEPARATOR, ...rows, ""].join("\n");

const fixIndexTable = (rows) =>
  ["# Active fixes", "", "| Issue | Topic | Status | Notes |", "|---|---|---|---|", ...rows, ""].join("\n");

let tmpDir;

before(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "agentic-workflow-roadmap-check-"));
});

after(() => {
  if (tmpDir && existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
});

const write = (relative, content) => {
  const p = join(tmpDir, relative);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
  return p;
};

describe("checkUnitDoc — the frozen-failure corpus (issue #316)", () => {
  it("REPRODUCER unit 77: doc carries its PR URL in ## Next while the row reads in-progress", () => {
    // Verbatim shape of docs/features/77-promise-coherence-guard/SPEC.md:274
    // against the row state main carried while PR #309 was merged.
    const docText = [
      "# 77 — promise-coherence-guard",
      "## Next",
      "",
      "Owner review of PR #309 (`" + OWNER + "/pull/309`); the",
      "external verifier decides, and no self-approval follows from a green suite.",
      "",
      "## References",
      "",
      "Issue `#305`.",
    ].join("\n");
    const indexText = roadmapTable(["| 77 | `promise-coherence-guard` | in-progress | — | Issue [#305](…) (M) |"]);
    const result = checkUnitDoc({ nn: 77, slug: "promise-coherence-guard", kind: "feature", docText, indexText });
    strictEqual(result.ok, false);
    strictEqual(result.violations.length, 1);
    strictEqual(result.violations[0].code, "pr-url-unsettled");
    ok(result.violations[0].detail.includes("Next"));
    ok(result.violations[0].detail.includes(OWNER + "/pull/309"));
  });

  it("REPRODUCER unit 79: doc carries its PR URL in an Evidence row while the row reads in-progress", () => {
    // Verbatim shape of 79's Evidence row (line 378) against the row state at
    // filing time (`in-progress` until the audit blocked on it).
    const docText = [
      "# 79 — spec-by-reference",
      "## Evidence",
      "",
      "| — | PR opened with `Closes #308` | exit 0 | " + OWNER + "/pull/311 | this session, 2026-10-21 |",
    ].join("\n");
    const indexText = roadmapTable(["| 79 | `spec-by-reference` | in-progress | — (soft: 303 305, both merged) | Issue [#308](…) (L) |"]);
    const result = checkUnitDoc({ nn: 79, slug: "spec-by-reference", kind: "feature", docText, indexText });
    strictEqual(result.ok, false);
    strictEqual(result.violations[0].code, "pr-url-unsettled");
  });

  it("both reproducers pass once the row reads done · [#N](same url)", () => {
    const doc77 = "# 77 — x\n## Next\n\nOwner review of PR #309 (`" + OWNER + "/pull/309`).\n";
    const doc79 = "# 79 — x\n## Evidence\n\n| — | PR opened | exit 0 | " + OWNER + "/pull/311 | x |";
    const settled = roadmapTable([
      "| 77 | `promise-coherence-guard` | done · [#309](" + OWNER + "/pull/309) | — | Issue [#305](…) |",
      "| 79 | `spec-by-reference` | done · [#311](" + OWNER + "/pull/311) | — | Issue [#308](…) |",
    ]);
    strictEqual(checkUnitDoc({ nn: 77, slug: "promise-coherence-guard", kind: "feature", docText: doc77, indexText: settled }).ok, true);
    strictEqual(checkUnitDoc({ nn: 79, slug: "spec-by-reference", kind: "feature", docText: doc79, indexText: settled }).ok, true);
  });

  it("a settle link with backticked decoration or trailing punctuation still matches", () => {
    const docText = "# 40 — x\n## Log\n\nL1 — PR #235 → " + OWNER + "/pull/235.";
    const indexText = roadmapTable(["| 40 | `versioned-skills-releases` | done · [`#235`](" + OWNER + "/pull/235) | — | Issue [#180](…) |"]);
    const result = checkUnitDoc({ nn: 40, slug: "versioned-skills-releases", kind: "feature", docText, indexText });
    strictEqual(result.ok, true, JSON.stringify(result.violations));
  });
});

describe("checkUnitDoc — no false positives on cross-references and conventions", () => {
  it("a doc citing another unit's settled PR passes (fix 272 → #276 shape)", () => {
    // Verbatim shape of docs/fix/272-…/SPEC.md:347: it cites PR #276, which the
    // fix index settles on the unit's own row.
    const docText = "# 272 — x\n## Log\n\nL9 — phase-lint fix landed via " + OWNER + "/pull/276.\n";
    const indexText = fixIndexTable([
      "| [#272](" + OWNER + "/issues/272) | phase-lint-unit-doc-grammar | `done` · [#276](" + OWNER + "/pull/276) · [SPEC](272-phase-lint-unit-doc-grammar/SPEC.md) | notes |",
    ]);
    strictEqual(checkUnitDoc({ nn: 272, slug: "phase-lint-unit-doc-grammar", kind: "fix", docText, indexText }).ok, true);
  });

  it("a fix doc with no index row passes — merged fixes are removed by the index's own convention", () => {
    const docText = "# 99 — x\n## References\n\n- PR: " + OWNER + "/pull/241\n";
    strictEqual(checkUnitDoc({ nn: 99, slug: "x", kind: "fix", docText, indexText: fixIndexTable([]) }).ok, true);
  });

  it("an active fix whose doc carries its PR URL and whose row is not settled fails", () => {
    const docText = "# 91 — x\n## Evidence\n\n| — | PR opened | exit 0 | " + OWNER + "/pull/303 | x |";
    const indexText = fixIndexTable(["| [#91](" + OWNER + "/issues/91) | toy-fix | `in-progress` | notes |"]);
    const result = checkUnitDoc({ nn: 91, slug: "toy-fix", kind: "fix", docText, indexText });
    strictEqual(result.ok, false);
    strictEqual(result.violations[0].code, "pr-url-unsettled");
  });

  it("a doc with no PR URL of its own carries no settle obligation", () => {
    const indexText = roadmapTable(["| 80 | `planned-unit` | planned | — | work |"]);
    strictEqual(checkUnitDoc({ nn: 80, slug: "planned-unit", kind: "feature", docText: "# 80 — x\n## Tasks\n- P1 — work\n", indexText }).ok, true);
  });

  it("URLs outside the doc's own lifecycle surfaces are never treated as its PR", () => {
    const docText = "# 80 — x\n## References\n\n- the corpus: docs/fix/258-… (reviewed in " + OWNER + "/pull/302)\n";
    const indexText = roadmapTable(["| 80 | `planned-unit` | planned | — | work |"]);
    strictEqual(checkUnitDoc({ nn: 80, slug: "planned-unit", kind: "feature", docText, indexText }).ok, true);
  });
});

describe("checkUnitDoc — row identity", () => {
  it("a feature doc whose NN has no roadmap row fails with row-missing", () => {
    const result = checkUnitDoc({ nn: 81, slug: "rowless", kind: "feature", docText: "# 81 — x\n", indexText: roadmapTable([]) });
    strictEqual(result.ok, false);
    strictEqual(result.violations[0].code, "row-missing");
  });

  it("a doc whose folder slug disagrees with the row fails with slug-mismatch", () => {
    // The F48 class: the renumber to 79 left unit-identity headings behind.
    const indexText = roadmapTable(["| 79 | `spec-by-reference` | in-progress | — | work |"]);
    const result = checkUnitDoc({ nn: 79, slug: "unit-78-leftover", kind: "feature", docText: "# 79 — x\n", indexText });
    strictEqual(result.ok, false);
    strictEqual(result.violations[0].code, "slug-mismatch");
  });

  it("a row settled `done` with a different URL than the doc's PR fails closed", () => {
    const docText = "# 78 — x\n## Log\n\nL1 — PR #311 → " + OWNER + "/pull/311\n";
    const indexText = roadmapTable(["| 78 | `x` | done · [#999](" + OWNER + "/pull/999) | — | work |"]);
    const result = checkUnitDoc({ nn: 78, slug: "x", kind: "feature", docText, indexText });
    strictEqual(result.ok, false);
    strictEqual(result.violations[0].code, "pr-url-unsettled");
  });

  it("ROADMAP_CHECK_CODES is the closed vocabulary and nothing else is emitted", () => {
    ok(ROADMAP_CHECK_CODES.includes("row-missing"));
    ok(ROADMAP_CHECK_CODES.includes("slug-mismatch"));
    ok(ROADMAP_CHECK_CODES.includes("pr-url-unsettled"));
    strictEqual(ROADMAP_CHECK_CODES.length, 3);
  });
});

describe("findRow", () => {
  it("parses the real table shape's cells for the settle writer's callers", () => {
    const p = write("findrow/ROADMAP.md", roadmapTable(["| 77 | `promise-coherence-guard` | in-progress | — | Issue [#305](…) (M) |"]));
    const row = findRow(p, "77");
    strictEqual(row.slug, "`promise-coherence-guard`"); // raw cell — the settle writer re-emits it verbatim
    strictEqual(row.slug.replace(/`/g, ""), "promise-coherence-guard");
    strictEqual(row.status, "in-progress");
    strictEqual(row.dependsOn, "—");
    ok(row.description.startsWith("Issue [#305]"));
    strictEqual(findRow(p, "999"), null);
  });
});

describe("roadmap check — CLI exit contract", () => {
  it("exit 0 when consistent, 1 with named codes, 2 on usage refusal", () => {
    const docDir = join(tmpDir, "docs", "features", "77-cli-unit");
    mkdirSync(docDir, { recursive: true });
    writeFileSync(join(docDir, "SPEC.md"), "# 77 — cli-unit\n## Next\n\nPR #309 (`" + OWNER + "/pull/309`).\n", "utf8");
    const table = write(ROADMAP_DOCUMENT, roadmapTable(["| 77 | `cli-unit` | in-progress | — | work |"]));

    const failing = spawnSync(process.execPath, [CLI, "roadmap", "check", join(docDir, "SPEC.md"), "--roadmap", table], { encoding: "utf8" });
    strictEqual(failing.status, 1);
    ok(failing.stdout.includes("pr-url-unsettled"), failing.stdout);
    ok(failing.stdout.includes("verdict: FAIL"));

    // The same table after the settle write the writer performs.
    rowUpsert(table, { nn: "77", slug: "cli-unit", status: "done · [#309](" + OWNER + "/pull/309)", dependsOn: "—", description: "work" });
    const passing = spawnSync(process.execPath, [CLI, "roadmap", "check", join(docDir, "SPEC.md"), "--roadmap", table], { encoding: "utf8" });
    strictEqual(passing.status, 0);
    ok(passing.stdout.includes("verdict: PASS"));

    const usage = spawnSync(process.execPath, [CLI, "roadmap", "check"], { encoding: "utf8" });
    strictEqual(usage.status, 2);
  });

  it("a bare rowUpsert is a usage error, never a table path (review F4)", () => {
    // `roadmap rowUpsert …` used to resolve the subcommand word as the table
    // path, so the writer refused with ENOENT on a file named `rowUpsert` — an
    // unreadable-table error for what is a missing-argument mistake
    // (issue #316).
    const bare = spawnSync(process.execPath, [CLI, "roadmap", "rowUpsert", '{"nn":"77"}'], { encoding: "utf8", cwd: tmpDir });
    strictEqual(bare.status, 2);
    ok(bare.stderr.includes("usage: agentic-workflow roadmap <table-path> rowUpsert"), bare.stderr);
    ok(!bare.stderr.includes("ENOENT"), bare.stderr);
    strictEqual(existsSync(join(tmpDir, "rowUpsert")), false);

    const bareAnnotate = spawnSync(process.execPath, [CLI, "roadmap", "annotate", "77", "note"], { encoding: "utf8", cwd: tmpDir });
    strictEqual(bareAnnotate.status, 2);
  });

  it("--json emits the envelope with the same codes", () => {
    const docDir = join(tmpDir, "docs", "features", "78-json-unit");
    mkdirSync(docDir, { recursive: true });
    writeFileSync(join(docDir, "SPEC.md"), "# 78 — json-unit\n## Next\n\nPR #311 (`" + OWNER + "/pull/311`).\n", "utf8");
    const table = write("docs/features/json-ROADMAP.md", roadmapTable(["| 78 | `json-unit` | in-progress | — | work |"]));
    const r = spawnSync(process.execPath, [CLI, "roadmap", "check", join(docDir, "SPEC.md"), "--roadmap", table, "--json"], { encoding: "utf8" });
    strictEqual(r.status, 1);
    const envelope = JSON.parse(r.stdout);
    strictEqual(envelope.service, "roadmap");
    strictEqual(envelope.op, "check");
    strictEqual(envelope.ok, false);
    strictEqual(envelope.violations[0].code, "pr-url-unsettled");
  });
});

describe("previous behavior holds — the writer ops the call sites already name", () => {
  it("roadmap rowUpsert still writes the real separator shape and emits the same receipt", () => {
    const p = write("writer/ROADMAP.md", roadmapTable(["| 61 | `adaptive-unit-lane` | active | — | Adaptive unit lane implementation |"]));
    const receipt = rowUpsert(p, { nn: "61", slug: "adaptive-unit-lane", status: "completed", dependsOn: "", description: "Updated description" });
    strictEqual(receipt.service, "roadmap");
    strictEqual(receipt.op, "rowUpsert");
    strictEqual(receipt.schema, "roadmap-table@1");
    strictEqual(receipt.ok, true);
  });
});

describe("roadmap check — the half-migrated tree (issue #319)", () => {
  // The documented two-pass migration: the consolidated index exists without a
  // `## Fixes` table while the active fix rows are still in the standalone fix
  // index. `MIGRATION.md` and `init-workspace`'s upgrade reference promise that
  // a tree in this state still reads its fix rows.
  const halfMigrated = (featureRow) =>
    [
      "# Roadmap",
      "",
      "## Features",
      "",
      "| NN | Slug | Status | Depends on | Summary |",
      REAL_SEPARATOR,
      featureRow,
      "",
    ].join("\n");

  const fixDocDir = (relative) => {
    const dir = join(tmpDir, relative);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SPEC.md"), "# fix unit\n## Next\n\nReady to merge.\n", "utf8");
    return dir;
  };

  it("reads the standalone fix index instead of a feature row with the same NN", () => {
    const root = join(tmpDir, "half-1");
    const docDir = fixDocDir("half-1/docs/fix/91-beta");
    writeFileSync(join(root, "docs", "ROADMAP.md"), halfMigrated("| 91 | `alpha` | in-progress | — | a feature row that must never be read as fix 91 |"), "utf8");
    const standalone = join(root, "docs", "fix", "README.md");
    writeFileSync(standalone, fixIndexTable(["| [#91](https://example.invalid/issues/91) | `beta` | in-progress | x |"]), "utf8");

    const r = spawnSync(process.execPath, [CLI, "roadmap", "check", join(docDir, "SPEC.md")], { encoding: "utf8" });
    strictEqual(r.status, 0, r.stdout + r.stderr);
    ok(r.stdout.includes("verdict: PASS"), r.stdout);
  });

  it("never reports a vacuous pass: the fix row's own settle obligation is checked", () => {
    const root = join(tmpDir, "half-2");
    const docDir = join(tmpDir, "half-2", "docs", "fix", "91-beta");
    mkdirSync(docDir, { recursive: true });
    // The doc carries its PR URL, so an unsettled row must fail once the
    // standalone index is read.
    writeFileSync(join(docDir, "SPEC.md"), "# fix unit\n## Next\n\nPR #402 (`" + OWNER + "/pull/402`).\n", "utf8");
    writeFileSync(join(root, "docs", "ROADMAP.md"), halfMigrated("| 90 | `alpha` | in-progress | — | no row for 91 here |"), "utf8");
    writeFileSync(
      join(root, "docs", "fix", "README.md"),
      fixIndexTable(["| [#91](https://example.invalid/issues/91) | `beta` | in-progress | x |"]),
      "utf8",
    );

    const r = spawnSync(process.execPath, [CLI, "roadmap", "check", join(docDir, "SPEC.md")], { encoding: "utf8" });
    strictEqual(r.status, 1, r.stdout + r.stderr);
    ok(r.stdout.includes("pr-url-unsettled"), r.stdout);
  });

  it("keeps preferring the consolidated ## Fixes table once the tree is migrated", () => {
    const root = join(tmpDir, "half-3");
    const docDir = fixDocDir("half-3/docs/fix/91-beta");
    writeFileSync(
      join(root, "docs", "ROADMAP.md"),
      [
        "# Roadmap",
        "",
        "## Features",
        "",
        "| NN | Slug | Status | Depends on | Summary |",
        REAL_SEPARATOR,
        "| 90 | `alpha` | in-progress | — | a feature row |",
        "",
        "## Fixes",
        "",
        "| Issue | Topic | Status | Notes |",
        "|---|---|---|---|",
        "| [#91](https://example.invalid/issues/91) | `beta` | in-progress | consolidated |",
        "",
      ].join("\n"),
      "utf8",
    );
    // A stale standalone index that would disagree: it must be ignored.
    writeFileSync(join(root, "docs", "fix", "README.md"), fixIndexTable(["| [#91](https://example.invalid/issues/91) | `other` | in-progress | x |"]), "utf8");

    const r = spawnSync(process.execPath, [CLI, "roadmap", "check", join(docDir, "SPEC.md")], { encoding: "utf8" });
    strictEqual(r.status, 0, r.stdout + r.stderr);
  });

  it("never reads a feature row as the fix row of the same NN when ## Fixes is absent", () => {
    // F1: a consolidated document that has no `## Fixes` table and no standalone
    // index has NO fix rows. Reading its Features table as fixes makes feature
    // row 91 answer for fix 91 and report a slug mismatch against a row that
    // belongs to another kind entirely.
    const root = join(tmpDir, "half-4");
    const docDir = fixDocDir("half-4/docs/fix/91-beta");
    writeFileSync(join(root, "docs", "ROADMAP.md"), halfMigrated("| 91 | `alpha` | in-progress | — | a feature row that must never be read as fix 91 |"), "utf8");

    const r = spawnSync(process.execPath, [CLI, "roadmap", "check", join(docDir, "SPEC.md")], { encoding: "utf8" });
    strictEqual(r.status, 0, r.stdout + r.stderr);
    ok(r.stdout.includes("verdict: PASS"), r.stdout);
    ok(!r.stdout.includes("slug-mismatch"), "no feature row answers for the fix row: \n" + r.stdout);
  });

  it("the documented rollback lever re-opens the pre-move path for every consumer", () => {
    // F10: `ROADMAP_LEGACY_READ = true` is the documented emergency rollback
    // (`index-document.mjs`), and the shared reader honours it — but the CLI
    // computed its canonical index directly and never consulted the reader, so
    // flipping the lever changed nothing here: a legacy-only tree answered
    // "index not found" and lost the `roadmap-moved` pointer that names the new
    // home. The CLI reads the index through the shared resolver now.
    //
    // The tree is its own tmp root: the doc's walk must stop at this repository
    // root, never climb to the checkout's real `docs/ROADMAP.md`.
    const root = mkdtempSync(join(tmpdir(), "agentic-workflow-lever-"));
    const docDir = join(root, "docs", "fix", "91-beta");
    mkdirSync(docDir, { recursive: true });
    writeFileSync(join(docDir, "SPEC.md"), "# fix unit\n## Next\n\nReady to merge.\n", "utf8");
    mkdirSync(join(root, "docs", "features"), { recursive: true });
    writeFileSync(
      join(root, "docs", "features", "ROADMAP.md"),
      roadmapTable(["| 91 | `beta` | in-progress | — | a pre-319 tree |"]),
      "utf8",
    );

    // Window closed: the pre-move path is refused with its pointer at the new home.
    const closed = spawnSync(process.execPath, [CLI, "roadmap", "check", join(docDir, "SPEC.md")], { encoding: "utf8" });
    strictEqual(closed.status, 2, closed.stdout + closed.stderr);
    ok(closed.stderr.includes("roadmap-moved"), closed.stderr);
    ok(closed.stderr.includes("docs/ROADMAP.md"), closed.stderr);

    // Window re-opened by the lever: the same tree reads its fix row.
    const reOpened = spawnSync(process.execPath, [CLI, "roadmap", "check", join(docDir, "SPEC.md")], {
      encoding: "utf8",
      env: { ...process.env, AGENTIC_WORKFLOW_ROADMAP_LEGACY_READ: "1" },
    });
    strictEqual(reOpened.status, 0, reOpened.stdout + reOpened.stderr);
    ok(reOpened.stdout.includes("verdict: PASS"), reOpened.stdout);
    rmSync(root, { recursive: true, force: true });
  });

  it("#319 F14: the row scanner reads one fence grammar, so a fenced example is never a live row", () => {
    // The consolidated index teaches its own row format; a writer editing it
    // copies a row into a fence. That example is content, not an active unit.
    const doc = [
      "# Roadmap",
      "",
      "## Features",
      "",
      "| NN | Slug | Status | Depends on | Summary |",
      "|----|------|--------|------------|---------|",
      "| 01 | `real` | in-progress | — | a live feature row |",
      "",
      "## Fixes",
      "",
      "The row format:",
      "",
      "```markdown",
      "| [#999](https://example.test/999) | example-fix | pending | not a unit |",
      "```",
      "",
      "| [#319](https://example.test/319) | real-fix | done | a live fix row |",
      "",
      "~~~",
      "| 42 | `tilde` | pending | — | fenced with tildes |",
      "~~~",
      "",
    ].join("\n");

    const fixRows = roadmapTableRows(doc, "fix");
    deepStrictEqual(fixRows.map((cells) => cells[1]), ["real-fix"], "the fenced example is not a fix row");

    const featureRows = roadmapTableRows(doc, "feature");
    deepStrictEqual(
      featureRows.map((cells) => cells[0]).filter((cell) => /^\d+$/.test(cell ?? "")),
      ["01"],
      "neither fence leaks into the features table",
    );

    // The reported face: a headline rule outside a fence does not open one, so
    // an equal-length fence is needed for anything past it to be content.
    const rule = ["## Fixes", "", "| #3 | headline-fix | done |", "", "| #4 | live-fix | done |"].join("\n");
    deepStrictEqual(roadmapTableRows(rule, "fix").map((cells) => cells[0]), ["#3", "#4"], "a headline rule is not a fence");

    // A run shorter than the one that opened the block does not close it
    // (CommonMark), and a fence closes only on its own character.
    const mixed = [
      "## Fixes",
      "````",
      "```",
      "| #5 | still-fenced | done |",
      "~~~~~~~~~",
      "| #6 | still-fenced-too | done |",
      "````",
      "| #7 | live | done |",
    ].join("\n");
    deepStrictEqual(
      roadmapTableRows(mixed, "fix").map((cells) => cells[0]),
      ["#7"],
      "only a fence of the opening character at equal-or-greater length closes the block",
    );

    // The keyed consumer shares the grammar instead of restating it.
    const result = checkUnitDoc({
      nn: "999",
      slug: "example-fix",
      kind: "fix",
      docText: "# fix unit\n\nStatus: planned\n",
      indexText: doc,
    });
    ok(
      result.violations.every((violation) => violation.code !== "row-missing"),
      `a fenced example never answers a fix check as a missing row: ${JSON.stringify(result.violations)}`,
    );
    ok(
      result.violations.every((violation) => violation.code !== "slug-mismatch"),
      `a fenced example never answers a fix check with its slug: ${JSON.stringify(result.violations)}`,
    );
  });
});
