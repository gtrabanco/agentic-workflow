/**
 * verify.test.mjs — issue #260 AC6: the document verifier (`agentic-workflow
 * verify`), the non-negotiable #2 tool that is distinct from the `edit`
 * writer CLI and fails closed on a unit doc that does not satisfy the frozen
 * schemas.
 *
 * The suite carries the two frozen-failure reproducers of the unit (PE-012):
 * the 2026-09-24 fabricated receipt (a REVIEW-RAN mark produced as plausible
 * text — future-dated, or naming a commit that does not exist, or carrying a
 * truncated sha) and the fix-258 unclosed-obligations class. Written
 * red-first: the module did not exist when this landed.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { verifyUnitDoc, VERIFY_CONTRACT_ID } from "../src/verify/Verify.mjs";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));

// A minimal spec-by-reference unit doc that satisfies the shape: every
// required section present, a closed Log, no obligations table.
const BASE_DOC = [
  "# fix/999-example",
  "",
  "## Issue",
  "`#999` — example.",
  "",
  "## Specs",
  "**S1 — example.**",
  "> example words",
  "",
  "## Impact",
  "none",
  "",
  "## Non-goals",
  "none",
  "",
  "## Future cost",
  "none",
  "",
  "## Applicable tests",
  "n/a",
  "",
  "## Known pre-existing issues",
  "none",
  "",
  "## Tasks",
  "- P1 — do the thing (validator: `true` exits 0)",
  "  (Implements: S1)",
  "",
  "## Findings",
  "",
  "## Log",
  "- **L1** — 2026-11-08, the request, verbatim:",
  "  ```",
  "  example",
  "  ```",
  "",
  "## Next",
  "done.",
  "",
  "## References",
  "none",
  "",
].join("\n");

// Real HEAD from the repo the tests run in: receipt marks naming it are real
// marks, not fabrications.
const realSha = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();

function writeDoc(body, extraFiles = {}) {
  const dir = mkdtempSync(join(tmpdir(), "aw-verify-"));
  const path = join(dir, "SPEC.md");
  writeFileSync(path, body);
  for (const [name, content] of Object.entries(extraFiles)) {
    writeFileSync(join(dir, name), content);
  }
  return { dir, path, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test("verifyUnitDoc passes a minimal spec-by-reference unit doc", () => {
  const { path, cleanup } = writeDoc(BASE_DOC);
  try {
    const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08" });
    assert.equal(result.ok, true, JSON.stringify(result.violations));
    assert.equal(result.contract, VERIFY_CONTRACT_ID);
    assert.equal(result.shape, "spec-by-reference");
  } finally {
    cleanup();
  }
});

test("verify refuses a doc missing a required section", () => {
  const body = BASE_DOC.replace("## Non-goals\nnone\n\n", "");
  const { path, cleanup } = writeDoc(body);
  try {
    const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08" });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some((v) => v.code === "section-missing" && v.message.includes("Non-goals")),
      JSON.stringify(result.violations),
    );
  } finally {
    cleanup();
  }
});

test("verify refuses a legacy doc whose Evidence table drops a required column", () => {
  // A legacy-shape doc: Evidence table present but missing the Verified-by column.
  const body = [
    "# fix/998-legacy",
    "",
    "## Objective",
    "example",
    "",
    "## Why",
    "example",
    "",
    "## User outcome",
    "example",
    "",
    "## Acceptance criteria",
    "- [ ] AC1 — example",
    "",
    "## Impact",
    "none",
    "",
    "## Non-goals",
    "none",
    "",
    "## Future cost",
    "none",
    "",
    "## Applicable tests",
    "n/a",
    "",
    "## Known pre-existing issues",
    "none",
    "",
    "## Tasks",
    "- P1 — do the thing",
    "",
    "## Evidence",
    "",
    "| AC | What was run | Exit / digest | Output (≤2 lines) |",
    "|---|---|---|---|",
    "| AC1 | `true` | exit 0 | — |",
    "",
    "## Progress log",
    "",
    "## Next",
    "done.",
    "",
    "## References",
    "none",
    "",
  ].join("\n");
  const { path, cleanup } = writeDoc(body);
  try {
    const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08" });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some((v) => v.code === "evidence-columns"),
      JSON.stringify(result.violations),
    );
  } finally {
    cleanup();
  }
});

test("verify refuses an unclosed obligations row (the fix-258 failure class)", () => {
  const obligations = [
    "### Obligations",
    "",
    "| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |",
    "|---|---|---|---|---|---|---|---|---|",
    "| O1 | S1 | example invariant | P2 | P2 | execute-phase | `true` exits 0 | suite row | verified |",
    "| O2 | S2 | another invariant | P3 | P3 | execute-phase | `true` exits 0 | suite row | planned |",
    "",
  ].join("\n");
  const { path, cleanup } = writeDoc(BASE_DOC.replace("## Findings\n", `## Findings\n${obligations}`));
  try {
    const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08" });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some((v) => v.code === "obligations-open" && v.message.includes("O2")),
      JSON.stringify(result.violations),
    );
  } finally {
    cleanup();
  }
});

test("verify passes when every obligations row is verified or an evidenced n/a", () => {
  const obligations = [
    "### Obligations",
    "",
    "| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |",
    "|---|---|---|---|---|---|---|---|---|",
    "| O1 | S1 | example invariant | P2 | P2 | execute-phase | `true` exits 0 | suite row | verified |",
    "| O2 | S2 | another invariant | P3 | P3 | execute-phase | n/a: no behaviour | row | n/a: no behaviour |",
    "",
  ].join("\n");
  const { path, cleanup } = writeDoc(BASE_DOC.replace("## Findings\n", `## Findings\n${obligations}`));
  try {
    const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08" });
    assert.equal(result.ok, true, JSON.stringify(result.violations));
  } finally {
    cleanup();
  }
});

test("verify also reads a sibling planning-obligations.md (the M/L ledger home)", () => {
  const sibling = [
    "| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |",
    "|---|---|---|---|---|---|---|---|---|",
    "| O1 | S1 | example | P2 | P2 | execute-phase | `true` exits 0 | row | verified |",
    "| O2 | S2 | example | P3 | P3 | execute-phase | `true` exits 0 | row | in-progress |",
    "",
  ].join("\n");
  const { path, cleanup } = writeDoc(BASE_DOC, { "planning-obligations.md": sibling });
  try {
    const dir = path.slice(0, path.lastIndexOf("/"));
    const result = verifyUnitDoc({
      text: readFileSync(path, "utf8"),
      path,
      siblingDir: dir,
      headExists: () => true,
      now: "2026-11-08",
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some((v) => v.code === "obligations-open" && v.message.includes("O2")),
      JSON.stringify(result.violations),
    );
  } finally {
    cleanup();
  }
});

test("verify refuses a fabricated receipt mark: sha absent from the repo (2026-09-24 reproducer)", () => {
  const fabricated = BASE_DOC.replace(
    "## Log\n",
    "## Log\n- **R1** — 2026-11-08, review of HEAD a009aafb00000000000000000000000000000000, verdict PASS\n",
  );
  const { path, cleanup } = writeDoc(fabricated);
  try {
    const result = verifyUnitDoc({
      text: readFileSync(path, "utf8"),
      path,
      headExists: (sha) => sha === realSha,
      now: "2026-11-08",
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some((v) => v.code === "receipt-unknown-head" && v.message.includes("a009aafb")),
      JSON.stringify(result.violations),
    );
  } finally {
    cleanup();
  }
});

test("verify refuses a fabricated receipt mark: future-dated or truncated sha", () => {
  const future = BASE_DOC.replace(
    "## Log\n",
    "## Log\n- **R1** — 2027-01-01, review of the change, verdict PASS\n",
  );
  const truncated = BASE_DOC.replace(
    "## Log\n",
    "## Log\n- **G1** — 2026-11-08, gate run, head a009aafb…, exit 0\n",
  );
  const cases = [
    { body: future, code: "receipt-future-date" },
    { body: truncated, code: "receipt-malformed-head" },
  ];
  for (const { body, code } of cases) {
    const { path, cleanup } = writeDoc(body);
    try {
      const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08" });
      assert.equal(result.ok, false, code);
      assert.ok(result.violations.some((v) => v.code === code), JSON.stringify(result.violations));
    } finally {
      cleanup();
    }
  }
});

test("verify accepts a real receipt mark: the repo's HEAD sha and a past date", () => {
  const real = BASE_DOC.replace(
    "## Log\n",
    `## Log\n- **R1** — 2026-11-08, review of HEAD ${realSha}, verdict PASS\n- **G1** — 2026-11-08, gate run, HEAD ${realSha} | true | exit 0\n`,
  );
  const { path, cleanup } = writeDoc(real);
  try {
    const result = verifyUnitDoc({
      text: readFileSync(path, "utf8"),
      path,
      headExists: (sha) => sha === realSha,
      now: "2026-11-08",
    });
    assert.equal(result.ok, true, JSON.stringify(result.violations));
  } finally {
    cleanup();
  }
});

test("verify refuses an unknown Log kind token", () => {
  const bad = BASE_DOC.replace("## Log\n", "## Log\n- **X1** — 2026-11-08, something that never happened\n");
  const { path, cleanup } = writeDoc(bad);
  try {
    const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08" });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some((v) => v.code === "log-kind" && v.message.includes("X1")),
      JSON.stringify(result.violations),
    );
  } finally {
    cleanup();
  }
});

test("CLI: verify exits 0 with a receipt block on a clean doc, 2 with VERIFY REFUSAL on a violation", () => {
  const { path, cleanup } = writeDoc(BASE_DOC);
  try {
    const ok = spawnSync("bun", [BIN, "verify", path], { encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.match(ok.stdout, /VERIFY PASS/u);

    const bad = BASE_DOC.replace("## Non-goals\nnone\n\n", "");
    const badPath = join(path.slice(0, path.lastIndexOf("/")), "BAD.md");
    writeFileSync(badPath, bad);
    const refusal = spawnSync("bun", [BIN, "verify", badPath], { encoding: "utf8" });
    assert.equal(refusal.status, 2);
    assert.match(refusal.stderr, /VERIFY REFUSAL —/u);
    assert.match(refusal.stderr, /Non-goals/u);
    rmSync(badPath, { force: true });
  } finally {
    cleanup();
  }
});

// ── Tree cross-checks (issue #227's 2026-11-03 re-scope residual) ──────────

// The frozen-failure corpus of unit 227: a doc whose citations drift from the
// tree used to pass verification. `pathExists`/`rootHasDir`/`gateKnown` are
// injected exactly like `headExists`; `null` (no repo context, `--no-git`)
// skips the check it feeds instead of passing silently on a stale claim.

const CITATION_DOC = BASE_DOC.replace(
  "## References\nnone\n",
  "## References\n- `packages/agentic-workflow/src/verify/Verify.mjs:305` — the receipt checker\n",
);

const TREE = new Set([
  "docs",
  "docs/fix",
  "docs/fix/201-operator-approved-pass-routing",
  "docs/fix/201-operator-approved-pass-routing/SPEC.md",
  "packages",
  "packages/agentic-workflow",
  "packages/agentic-workflow/src",
  "packages/agentic-workflow/src/verify",
  "packages/agentic-workflow/src/verify/Verify.mjs",
  "scripts",
  "scripts/audit-pr-gate.mjs",
  "skills",
  "skills/unit-lane",
  "skills/unit-lane/SKILL.md",
]);
const treeContext = {
  pathExists: (p) => TREE.has(p),
  rootHasDir: (seg) => TREE.has(seg),
  gateKnown: (id) =>
    TREE.has(`skills/${id}/SKILL.md`) || id === "phase-lint-rules" || id === "branch-pushed",
};

test("verify refuses a root-relative path citation the tree does not hold (unit 227 corpus)", () => {
  const stale = CITATION_DOC.replace("packages/agentic-workflow/src/verify/Verify.mjs:305", "scripts/retracted-gate.mjs:12");
  const { path, cleanup } = writeDoc(stale);
  try {
    const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08", ...treeContext });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some((v) => v.code === "cited-path-missing" && v.message.includes("scripts/retracted-gate.mjs")),
      JSON.stringify(result.violations),
    );
  } finally {
    cleanup();
  }
});

test("verify keeps a resolvable :line citation and refuses only the missing file", () => {
  const { path, cleanup } = writeDoc(CITATION_DOC);
  try {
    const ok = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08", ...treeContext });
    assert.equal(ok.ok, true, JSON.stringify(ok.violations));
  } finally {
    cleanup();
  }
});

test("verify does not treat context-relative shorthand, brace expansion or commands as path claims", () => {
  const shapes = [
    "- `src/passes/` shorthand without an extension",
    "- `references/ADVERSARIAL_SETUP.md` context-relative (no root `references/` dir)",
    "- `packages/pi-agentic-workflow/src/config/{types,schema}.ts` brace expansion",
    "- `bun test packages/agentic-workflow/test/verify.test.mjs` a command, not a path",
    "- `feat/227-deterministic-artifact-emitters` a branch name (no root dir, no extension)",
  ];
  const body = CITATION_DOC.replace("## References\n- `packages/agentic-workflow/src/verify/Verify.mjs:305` — the receipt checker\n", `## References\n${shapes.join("\n")}\n`);
  const { path, cleanup } = writeDoc(body);
  try {
    const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08", ...treeContext });
    assert.equal(result.ok, true, JSON.stringify(result.violations));
  } finally {
    cleanup();
  }
});

test("verify refuses a gate citation nothing publishes (unit 227 corpus)", () => {
  const cited = CITATION_DOC.replace(
    "## References\n- `packages/agentic-workflow/src/verify/Verify.mjs:305` — the receipt checker\n",
    "## References\nThe `retracted-gate` gate was never published.\n",
  );
  const { path, cleanup } = writeDoc(cited);
  try {
    const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08", ...treeContext });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some((v) => v.code === "cited-gate-unknown" && v.message.includes("retracted-gate")),
      JSON.stringify(result.violations),
    );
  } finally {
    cleanup();
  }
});

test("verify accepts gate citations that resolve to published sources", () => {
  const cited = CITATION_DOC.replace(
    "## References\n- `packages/agentic-workflow/src/verify/Verify.mjs:305` — the receipt checker\n",
    "## References\nThe `unit-lane` gate, the `phase-lint-rules` gate and the `branch-pushed` gate are published.\n",
  );
  const { path, cleanup } = writeDoc(cited);
  try {
    const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08", ...treeContext });
    assert.equal(result.ok, true, JSON.stringify(result.violations));
  } finally {
    cleanup();
  }
});

test("verify skips the cross-checks when the repo context is absent (null deps, --no-git)", () => {
  const stale = CITATION_DOC.replace("packages/agentic-workflow/src/verify/Verify.mjs:305", "scripts/retracted-gate.mjs:12")
    + "\nThe `retracted-gate` gate, too.\n";
  const { path, cleanup } = writeDoc(stale);
  try {
    const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: null, now: "2026-11-08", pathExists: null, rootHasDir: null, gateKnown: null });
    assert.equal(result.ok, true, JSON.stringify(result.violations));
    assert.ok(!result.checks.includes("cited-paths") && !result.checks.includes("cited-gates"), result.checks.join(","));
  } finally {
    cleanup();
  }
});

test("verify does not scan fenced blocks for citation claims", () => {
  const fenced = CITATION_DOC.replace(
    "## References\n- `packages/agentic-workflow/src/verify/Verify.mjs:305` — the receipt checker\n",
    "## References\nVerbatim quotes stay verbatim:\n```\nThe `retracted-gate` gate and `scripts/retracted-gate.mjs:12` live in the quote only.\n```\n",
  );
  const { path, cleanup } = writeDoc(fenced);
  try {
    const result = verifyUnitDoc({ text: readFileSync(path, "utf8"), path, headExists: () => true, now: "2026-11-08", ...treeContext });
    assert.equal(result.ok, true, JSON.stringify(result.violations));
  } finally {
    cleanup();
  }
});

test("CLI: the verify cross-checks wire to the containing repo, and --no-git skips them", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-verify-cli-"));
  try {
    // Outside a repo the root falls back to the doc's directory, so a cited
    // path resolves against it: `sub/real.mjs` exists, `sub/missing.mjs` does not.
    mkdirSync(join(dir, "sub"));
    writeFileSync(join(dir, "sub", "real.mjs"), "// tree member\n");
    const okDoc = join(dir, "SPEC.md");
    writeFileSync(okDoc, CITATION_DOC.replace("packages/agentic-workflow/src/verify/Verify.mjs:305", "sub/real.mjs"));
    const ok = spawnSync("bun", [BIN, "verify", okDoc], { encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.match(ok.stdout, /cited-paths/u);

    const staleDoc = join(dir, "STALE.md");
    writeFileSync(staleDoc, CITATION_DOC.replace("packages/agentic-workflow/src/verify/Verify.mjs:305", "sub/missing.mjs"));
    const stale = spawnSync("bun", [BIN, "verify", staleDoc], { encoding: "utf8" });
    assert.equal(stale.status, 2);
    assert.match(stale.stderr, /cited-path-missing/u);

    const skipped = spawnSync("bun", [BIN, "verify", staleDoc, "--no-git"], { encoding: "utf8" });
    assert.equal(skipped.status, 0, skipped.stdout + skipped.stderr);
    assert.doesNotMatch(skipped.stdout, /cited-paths/u);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI: gate citations resolve against the inventory's prose block, never the header cell (unit 227 corpus)", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-verify-inventory-"));
  try {
    mkdirSync(join(dir, "docs", "workflow"), { recursive: true });
    // The live inventory's rows are `id | …` lines inside the
    // `prose-gate-inventory@1` text block; only its legend and migration notes
    // are markdown. A resolver reading markdown pipes publishes nothing, so
    // every real inventory id is refused as unknown.
    writeFileSync(
      join(dir, "docs", "workflow", "GATE_INVENTORY.md"),
      [
        "# Gate inventory",
        "",
        "| Carrier | What it means |",
        "|---|---|",
        "| `script` | a root suite re-runs it |",
        "",
        "```text",
        "prose-gate-inventory@1",
        "# gate-suites: scripts/*-discipline.test.mjs",
        "gate-id | statement | carrier | file | section | token | surfaces | safety | recurrence | checkability | tier | stay-reason | rederive",
        "model-memory-provenance | a journaled claim's provenance | prose | skills/unit-lane/references/DESIGN.md | Provenance | never `confirmed` | - | 2 | 3 | 2 | prose | judgment-needed | skills/unit-lane/references/DESIGN.md#Provenance",
        "```",
        "",
      ].join("\n"),
    );
    const path = join(dir, "SPEC.md");

    const cited = BASE_DOC.replace("## References\nnone\n", "## References\nThe `model-memory-provenance` gate is an inventory row.\n");
    writeFileSync(path, cited);
    const ok = spawnSync("bun", [BIN, "verify", path], { encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.match(ok.stdout, /cited-gates/u);

    // The header cell is a column name, not a published gate.
    writeFileSync(path, BASE_DOC.replace("## References\nnone\n", "## References\nThe `gate-id` gate is cited.\n"));
    const header = spawnSync("bun", [BIN, "verify", path], { encoding: "utf8" });
    assert.equal(header.status, 2, header.stdout + header.stderr);
    assert.match(header.stderr, /cited-gate-unknown: .*gate-id/u);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── CLI wiring ──────────────────────────────────────────────────────────────

test("CLI: verify on the published 201 unit doc exits 0", () => {
  const published = fileURLToPath(
    new URL("../../../docs/fix/201-operator-approved-pass-routing/SPEC.md", import.meta.url),
  );
  const run = spawnSync("bun", [BIN, "verify", published], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /VERIFY PASS/u);
});
