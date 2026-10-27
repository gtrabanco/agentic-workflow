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
import { strictEqual, ok } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { checkUnitDoc, findRow, ROADMAP_CHECK_CODES, rowUpsert } from "../src/edit/Roadmap.mjs";

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
    const table = write("docs/features/ROADMAP.md", roadmapTable(["| 77 | `cli-unit` | in-progress | — | work |"]));

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
