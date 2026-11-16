/**
 * materialize.test.mjs — the `materialize` file service (unit 557,
 * feature/557-verification-materialization, issue #564).
 *
 * The interview records what the team answered (`charter`); this service turns a
 * `prose-only` answer into a recorded outcome, and refuses to let one quietly
 * stay prose. It owns four operations:
 *
 *   plan     — one row per declared boundary / feature map / evidence driver,
 *              with the residual every unanswered item leaves behind;
 *   check    — the declaration-enforcement check: a boundary declared with no
 *              enforcement mechanism becomes a typed finding with a
 *              `finding-route@1`-shaped route, never a sentence;
 *   apply    — the only writer: records the team's consented outcome and flips a
 *              scaffolded boundary's charter answer to `machine: <mechanism>`,
 *              refusing before any byte moves when a consent or an artifact is
 *              missing;
 *   evidence — the artifact-evidence half of the acceptance contract: a criterion
 *              naming a capture records its digest and the project's own driver
 *              command, and fails closed with `manual:` when no driver is
 *              declared.
 *
 * Every refusal and every write is a fixture over the same code path the CLI
 * runs; the live tree is only ever read, and the shipped pin at the end runs the
 * real template guide through `check` so a shape drift is caught here.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BOUNDARY_SLOT,
  CONTRACT_ID,
  DRIVER_SLOT,
  FEATURE_MAP_MARKER,
  FEATURE_MAP_PATH,
  FINDING_CODES,
  ARTIFACT_KINDS,
  MaterializeRefusal,
  OUTCOMES,
  RECORD_MARKER,
  RECORD_PATH,
  applyMaterialization,
  checkArtifactEvidence,
  checkMaterialization,
  planMaterialization,
  readBoundaryEntries,
  readDriver,
  readFeatureMap,
  readRecord,
} from "../src/materialize/materialize.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));
const GUIDE_REL = "template/AGENTS.md";

const read = (rel) => readFileSync(path.join(REPO, rel), "utf8");
const run = (...args) => {
  const result = spawnSync(process.execPath, [BIN, ...args], { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

/** One scratch tree per case, removed by the case that made it. */
function scratch() {
  const root = mkdtempSync(path.join(tmpdir(), "materialize-test-"));
  mkdirSync(path.join(root, "docs"), { recursive: true });
  return root;
}

/** A guide whose charter carries the two slots this service reads. */
const guideFixture = ({ boundaries = "`api → machine: eslint-plugin-boundaries`", driver = "`bun run capture`" } = {}) =>
  [
    "# AGENTS",
    "",
    "## Project charter",
    "",
    "- **Repo purpose:** ship the widget",
    boundaries === null ? "" : `- **${BOUNDARY_SLOT}:** ${boundaries}`,
    driver === null ? "" : `- **${DRIVER_SLOT}:** ${driver}`,
    "",
    "## Commands",
    "",
    "- gate: `true`",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");

const recordFixture = (rows) =>
  [
    "# Boundary enforcement record",
    "",
    "```text",
    RECORD_MARKER,
    "```",
    "",
    "| boundary | enforcement | outcome | artifact | recorded |",
    "|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");

const mapFixture = (rows) =>
  [
    "# Feature map",
    "",
    "```text",
    FEATURE_MAP_MARKER,
    "```",
    "",
    "| flow | what exists | how a user reaches it | evidence | status |",
    "|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");

const unitFixture = ({ driver = true, digest = true, driverCommand = "bun run capture", carrier = "evidence" } = {}) => {
  const criteria = [
    "## Acceptance criteria",
    "",
    "| # | Criterion | Proved by |",
    "|---|---|---|",
    "| AC-1 (S1) | the API rejects a foreign module | `bun test` |",
    "| AC-2 (S2) | the settings pane renders `artifact: screenshot` of its empty state | the capture driver |",
    "",
  ].join("\n");
  const evidence =
    carrier === "evidence"
      ? [
          "## Evidence",
          "",
          "| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |",
          "|---|---|---|---|---|",
          `| AC-1 | \`bun test\` | exit 0 | ok | agent |`,
          `| AC-2 | ${digest ? `\`${driverCommand}\`` : "`bun test`"} | ${digest ? "digest: sha256:9f2c0a6b" : "exit 0"} | captured | agent |`,
          "",
        ].join("\n")
      : [
          "## Log",
          "",
          "| kind | line |",
          "|---|---|",
          `- **E1** — 2026-11-17, \`bun test\` · exit 0 · ok`,
          digest
            ? `- **E2** — 2026-11-17, AC-2 \`${driverCommand}\` · digest: sha256:9f2c0a6b · captured`
            : "- **E2** — 2026-11-17, AC-2 · exit 0 · nothing captured",
          "",
        ].join("\n");
  return ["# unit", "", "## Specs", "", "**S1 — a rule.**", "> the rule", "", criteria, evidence].join("\n");
};

const guideWithDriver = (declared) => guideFixture({ driver: declared ? "`bun run capture`" : null });

// ── the declared sets ───────────────────────────────────────────────────

test("the closed sets the receipt prints are declared once and in a stable order", () => {
  assert.equal(CONTRACT_ID, "materialization@1");
  assert.equal(RECORD_MARKER, "boundary-enforcement@1");
  assert.equal(FEATURE_MAP_MARKER, "feature-map@1");
  assert.equal(RECORD_PATH, "docs/workflow/BOUNDARY_ENFORCEMENT.md");
  assert.equal(FEATURE_MAP_PATH, "docs/workflow/FEATURE_MAP.md");
  assert.deepEqual([...OUTCOMES], ["scaffold", "issue", "declined"]);
  assert.deepEqual([...ARTIFACT_KINDS], ["screenshot", "video", "state-snapshot"]);
  assert.deepEqual([...FINDING_CODES].sort(), [
    "artifact-evidence-missing",
    "boundary-artifact-missing",
    "boundary-declared-unenforced",
    "evidence-driver-missing",
    "feature-map-missing",
    "feature-map-shape",
  ]);
});

// ── read the charter's answer ───────────────────────────────────────────

test("the boundary entries are read from the charter slot, both legal shapes", () => {
  const { entries, malformed } = readBoundaryEntries(
    guideFixture({ boundaries: "`api → machine: eslint-plugin-boundaries` · `web → prose-only`" }),
  );
  assert.deepEqual(malformed, []);
  assert.deepEqual(entries, [
    { boundary: "api", enforcement: "machine", mechanism: "eslint-plugin-boundaries" },
    { boundary: "web", enforcement: "prose-only", mechanism: null },
  ]);
});

test("an entry outside the charter's two shapes is reported as malformed, never guessed", () => {
  const { malformed } = readBoundaryEntries(guideFixture({ boundaries: "`api → probably fine`" }));
  assert.equal(malformed.length, 1);
  assert.match(malformed[0].detail, /neither/);
});

test("a placeholder boundary slot declares nothing yet — it is not a malformed entry", () => {
  const { entries, malformed, placeholder } = readBoundaryEntries(
    guideFixture({ boundaries: "`<boundary> → machine: <mechanism>` · `<boundary> → prose-only`" }),
  );
  assert.deepEqual(entries, []);
  assert.deepEqual(malformed, []);
  assert.equal(placeholder, true);
});

test("the evidence driver is declared only when the slot carries a command", () => {
  assert.deepEqual(readDriver(guideWithDriver(true)), { declared: true, command: "bun run capture" });
  assert.deepEqual(readDriver(guideWithDriver(false)), { declared: false, command: null });
  assert.deepEqual(readDriver(guideFixture({ driver: "`n/a — no artifact evidence required`" })), {
    declared: false,
    command: null,
  });
});

test("the record and the feature map are read from their own marker blocks", () => {
  const record = readRecord(recordFixture(["| api | prose-only | issue | #601 | 2026-11-17 |"]));
  assert.equal(record.present, true);
  assert.deepEqual(record.rows, [
    { boundary: "api", enforcement: "prose-only", outcome: "issue", artifact: "#601", recorded: "2026-11-17" },
  ]);
  const map = readFeatureMap(mapFixture(["| settings | a pane | menu → settings | `artifact: screenshot` | shipped |"]));
  assert.equal(map.present, true);
  assert.equal(map.rows.length, 1);
  assert.equal(map.placeholderCells, 0);
  assert.equal(readFeatureMap("# nothing").present, false);
});

// ── plan: what is declared, what is answered, what is a residual ────────

test("a prose-only boundary with no recorded outcome is a pending item and a residual", () => {
  const plan = planMaterialization({
    guideText: guideFixture({ boundaries: "`web → prose-only`" }),
    recordText: null,
    featureMapText: null,
  });
  const boundary = plan.rows.find((row) => row.kind === "boundary");
  assert.equal(boundary.status, "pending");
  assert.equal(plan.verdict, "PENDING");
  assert.ok(plan.residuals.some((row) => row.kind === "boundary" && row.item === "web"));
});

test("a machine boundary is enforced and leaves no residual", () => {
  const plan = planMaterialization({
    guideText: guideFixture({ boundaries: "`api → machine: dep-cruiser`" }),
    recordText: null,
    featureMapText: mapFixture(["| settings | a pane | menu | `artifact: screenshot` | shipped |"]),
  });
  assert.deepEqual(
    plan.rows.map((row) => [row.kind, row.status]),
    [
      ["boundary", "enforced"],
      ["feature-map", "seeded"],
      ["evidence-driver", "declared"],
    ],
  );
  assert.deepEqual(plan.residuals, []);
  assert.equal(plan.verdict, "COMPLETE");
});

test("a recorded forge issue is a legal outcome: the boundary is not silently prose-only", () => {
  const plan = planMaterialization({
    guideText: guideFixture({ boundaries: "`web → prose-only`" }),
    recordText: recordFixture(["| web | prose-only | issue | #601 | 2026-11-17 |"]),
    featureMapText: null,
  });
  const boundary = plan.rows.find((row) => row.kind === "boundary");
  assert.equal(boundary.status, "recorded-issue");
  assert.ok(plan.residuals.every((row) => row.kind !== "boundary"));
});

test("a declined boundary is recorded as a decision, not as residual debt", () => {
  const plan = planMaterialization({
    guideText: guideFixture({ boundaries: "`web → prose-only`" }),
    recordText: recordFixture(["| web | prose-only | declined | — | 2026-11-17 |"]),
    featureMapText: null,
  });
  assert.equal(plan.rows.find((row) => row.kind === "boundary").status, "declined");
  assert.ok(plan.residuals.every((row) => row.kind !== "boundary"));
});

test("a scaffold recorded while the charter still answers prose-only stays pending", () => {
  const plan = planMaterialization({
    guideText: guideFixture({ boundaries: "`web → prose-only`" }),
    recordText: recordFixture(["| web | prose-only | scaffold | tools/boundary.json | 2026-11-17 |"]),
    featureMapText: null,
  });
  const boundary = plan.rows.find((row) => row.kind === "boundary");
  assert.equal(boundary.status, "pending");
  assert.match(boundary.detail, /still answers prose-only/);
});

test("an unanswered interview leaves one residual naming the round, not a boundary row", () => {
  const plan = planMaterialization({
    guideText: guideFixture({ boundaries: "`<boundary> → machine: <mechanism>` · `<boundary> → prose-only`" }),
    recordText: null,
    featureMapText: null,
  });
  assert.equal(plan.rows.filter((row) => row.kind === "boundary").length, 0);
  assert.ok(plan.residuals.some((row) => row.item === BOUNDARY_SLOT));
  assert.equal(plan.verdict, "PENDING");
});

test("the plan refuses a malformed charter slot instead of reporting half a surface", () => {
  assert.throws(
    () =>
      planMaterialization({
        guideText: guideFixture({ boundaries: "`api → probably fine`" }),
        recordText: null,
        featureMapText: null,
      }),
    (error) => error instanceof MaterializeRefusal && /charter check/.test(error.message),
  );
});

// ── check: the declaration-enforcement finding ──────────────────────────

test("a prose-only boundary with no recorded outcome is a typed finding with a finding-route@1 route", () => {
  const result = checkMaterialization({
    guideText: guideFixture({ boundaries: "`web → prose-only`" }),
    recordText: null,
    invariantsText: null,
    featureMapText: null,
  });
  assert.equal(result.verdict, "BLOCKED");
  const finding = result.findings.find((row) => row.code === "boundary-declared-unenforced");
  assert.ok(finding);
  assert.match(finding.route, /^(continue|fix|review|audit|explain-state) — .+$/);
  assert.match(finding.detail, /"web"/);
});

test("a scaffolded rule the tree does not carry is a finding, not a silent pass", () => {
  const result = checkMaterialization({
    guideText: guideFixture({ boundaries: "`web → prose-only`" }),
    recordText: recordFixture(["| web | prose-only | scaffold | tools/boundary.json | 2026-11-17 |"]),
    pathExists: () => false,
    featureMapText: null,
  });
  assert.ok(result.findings.some((row) => row.code === "boundary-artifact-missing"));
});

test("an invariant section that names no enforcement is a finding", () => {
  const invariants = [
    "# Architectural invariants",
    "",
    "## AI-001 — the domain layer never imports the transport layer",
    "",
    "- Rule: no import from `transport/` inside `domain/`",
    "- Applies to: `src/domain`",
    "- Evidence: `src/domain/README.md`",
    "",
    "## AI-002 — the schema package stays dependency-free",
    "",
    "- Rule: no runtime dependency",
    "- Enforcement: machine: the package manifest check",
    "",
  ].join("\n");
  const result = checkMaterialization({
    guideText: guideFixture({ boundaries: "`api → machine: lint`" }),
    recordText: null,
    invariantsText: invariants,
    featureMapText: null,
  });
  const findings = result.findings.filter((row) => row.code === "boundary-declared-unenforced");
  assert.equal(findings.length, 1);
  assert.match(findings[0].detail, /AI-001/);
});

test("a fenced example inside the invariants template is never read as a declaration", () => {
  const template = read("template/docs/architecture/ARCHITECTURAL_INVARIANTS.md");
  const result = checkMaterialization({
    guideText: guideFixture({ boundaries: "`api → machine: lint`" }),
    recordText: null,
    invariantsText: template,
    featureMapText: null,
  });
  assert.deepEqual(result.findings, []);
  assert.equal(result.verdict, "PASS");
});

test("a declared feature map that is absent or still templated is a finding", () => {
  const missing = checkMaterialization({
    guideText: guideFixture({ boundaries: "`api → machine: lint`" }),
    recordText: null,
    invariantsText: null,
    featureMapText: null,
    featureMapDeclared: true,
  });
  assert.ok(missing.findings.some((row) => row.code === "feature-map-missing"));

  const templated = checkMaterialization({
    guideText: guideFixture({ boundaries: "`api → machine: lint`" }),
    recordText: null,
    invariantsText: null,
    featureMapText: mapFixture(["| `<flow>` | `<what exists>` | `<how>` | `<evidence>` | `<status>` |"]),
    featureMapDeclared: true,
  });
  assert.ok(templated.findings.some((row) => row.code === "feature-map-shape"));
});

test("every finding code the check can emit is in the published set", () => {
  const result = checkMaterialization({
    guideText: guideFixture({ boundaries: "`web → prose-only`" }),
    recordText: recordFixture(["| web | prose-only | scaffold | gone.json | 2026-11-17 |"]),
    pathExists: () => false,
    invariantsText: null,
    featureMapText: null,
    featureMapDeclared: true,
  });
  for (const finding of result.findings) {
    assert.ok(FINDING_CODES.includes(finding.code), `${finding.code} is published`);
  }
});

// ── apply: the consent gate and the only writer ─────────────────────────

test("apply without an explicit consent is refused before any byte moves", () => {
  for (const payload of [{}, { consent: "maybe", items: [] }]) {
    assert.throws(
      () =>
        applyMaterialization({
          guideText: guideFixture({ boundaries: "`web → prose-only`" }),
          recordText: null,
          payload,
          pathExists: () => true,
          date: "2026-11-17",
        }),
      (error) => error instanceof MaterializeRefusal,
    );
  }
});

test("a declined consent writes nothing and records one residual per item", () => {
  const guideText = guideFixture({ boundaries: "`web → prose-only`" });
  const result = applyMaterialization({
    guideText,
    recordText: null,
    payload: { consent: "no", items: [{ boundary: "web", outcome: "scaffold", mechanism: "lint", path: "a.json" }] },
    pathExists: () => true,
    date: "2026-11-17",
  });
  assert.equal(result.guideText, guideText);
  assert.equal(result.recordText, null);
  assert.equal(result.verdict, "DECLINED");
  assert.equal(result.residuals.length, 1);
  assert.equal(result.residuals[0].item, "web");
});

test("a consented scaffold flips the charter answer and records the artifact", () => {
  const result = applyMaterialization({
    guideText: guideFixture({ boundaries: "`web → prose-only`" }),
    recordText: null,
    payload: {
      consent: "yes",
      items: [{ boundary: "web", outcome: "scaffold", mechanism: "eslint-plugin-boundaries", path: "tools/boundary.json" }],
    },
    pathExists: (rel) => rel === "tools/boundary.json",
    date: "2026-11-17",
  });
  assert.equal(result.verdict, "WRITTEN");
  assert.match(result.guideText, /`web → machine: eslint-plugin-boundaries`/);
  assert.deepEqual(readRecord(result.recordText).rows, [
    { boundary: "web", enforcement: "prose-only", outcome: "scaffold", artifact: "tools/boundary.json", recorded: "2026-11-17" },
  ]);
});

test("a scaffold whose artifact the tree does not carry writes nothing", () => {
  const guideText = guideFixture({ boundaries: "`web → prose-only`" });
  const result = applyMaterialization({
    guideText,
    recordText: null,
    payload: {
      consent: "yes",
      items: [{ boundary: "web", outcome: "scaffold", mechanism: "lint", path: "missing.json" }],
    },
    pathExists: () => false,
    date: "2026-11-17",
  });
  assert.equal(result.verdict, "BLOCKED");
  assert.equal(result.guideText, guideText);
  assert.equal(result.recordText, null);
  assert.ok(result.findings.some((row) => row.code === "boundary-artifact-missing"));
});

test("a filed issue is recorded and leaves the charter answer untouched", () => {
  const result = applyMaterialization({
    guideText: guideFixture({ boundaries: "`web → prose-only`" }),
    recordText: null,
    payload: { consent: "yes", items: [{ boundary: "web", outcome: "issue", ref: "#601" }] },
    pathExists: () => true,
    date: "2026-11-17",
  });
  assert.equal(result.verdict, "WRITTEN");
  assert.match(result.guideText, /`web → prose-only`/);
  assert.equal(readRecord(result.recordText).rows[0].outcome, "issue");
});

test("apply refuses an unknown boundary and an incomplete item instead of guessing", () => {
  const base = { guideText: guideFixture({ boundaries: "`web → prose-only`" }), recordText: null, pathExists: () => true, date: "2026-11-17" };
  for (const item of [
    { boundary: "ghost", outcome: "issue", ref: "#1" },
    { boundary: "web", outcome: "issue" },
    { boundary: "web", outcome: "declined" },
    { boundary: "web", outcome: "scaffold", mechanism: "lint" },
    { boundary: "web", outcome: "invented", ref: "#1" },
  ]) {
    assert.throws(
      () => applyMaterialization({ ...base, payload: { consent: "yes", items: [item] } }),
      (error) => error instanceof MaterializeRefusal,
      JSON.stringify(item),
    );
  }
});

test("a second apply over the same outcome is idempotent and reports it kept", () => {
  const first = applyMaterialization({
    guideText: guideFixture({ boundaries: "`web → prose-only`" }),
    recordText: null,
    payload: { consent: "yes", items: [{ boundary: "web", outcome: "issue", ref: "#601" }] },
    pathExists: () => true,
    date: "2026-11-17",
  });
  const second = applyMaterialization({
    guideText: first.guideText,
    recordText: first.recordText,
    payload: { consent: "yes", items: [{ boundary: "web", outcome: "issue", ref: "#601" }] },
    pathExists: () => true,
    date: "2026-11-17",
  });
  assert.equal(second.verdict, "WRITTEN");
  assert.equal(second.rows[0].status, "kept");
  assert.equal(second.recordText, first.recordText);
  assert.equal((second.recordText.match(/\| web \|/g) ?? []).length, 1);
});

test("two runs over the same bytes produce the same bytes", () => {
  const payload = { consent: "yes", items: [{ boundary: "web", outcome: "scaffold", mechanism: "lint", path: "tools/b.json" }] };
  const once = applyMaterialization({
    guideText: guideFixture({ boundaries: "`web → prose-only`" }),
    recordText: null,
    payload,
    pathExists: () => true,
    date: "2026-11-17",
  });
  const twice = applyMaterialization({
    guideText: guideFixture({ boundaries: "`web → prose-only`" }),
    recordText: null,
    payload,
    pathExists: () => true,
    date: "2026-11-17",
  });
  assert.equal(once.guideText, twice.guideText);
  assert.equal(once.recordText, twice.recordText);
});

// ── evidence: the artifact digest and the project's driver ──────────────

test("a criterion naming a capture records its digest and the declared driver command", () => {
  const result = checkArtifactEvidence({ guideText: guideWithDriver(true), unitText: unitFixture() });
  assert.equal(result.driver, "bun run capture");
  assert.equal(result.verdict, "PASS");
  assert.deepEqual(result.rows.map((row) => [row.criterion, row.status]), [["AC-2", "recorded"]]);
});

test("with no driver declared every capture criterion fails closed with a manual label", () => {
  const result = checkArtifactEvidence({ guideText: guideWithDriver(false), unitText: unitFixture() });
  assert.equal(result.driver, null);
  assert.equal(result.verdict, "BLOCKED");
  assert.ok(result.findings.some((row) => row.code === "evidence-driver-missing"));
  assert.deepEqual(result.rows, [{ criterion: "AC-2", status: "manual", detail: `no ${DRIVER_SLOT} declared` }]);
});

test("a declared driver with no digest in the row is still a manual criterion", () => {
  const result = checkArtifactEvidence({ guideText: guideWithDriver(true), unitText: unitFixture({ digest: false }) });
  assert.equal(result.verdict, "BLOCKED");
  assert.equal(result.rows[0].status, "manual");
  assert.ok(result.findings.some((row) => row.code === "artifact-evidence-missing"));
});

test("the digest carrier may be the Log E lines of a re-cut unit", () => {
  const result = checkArtifactEvidence({
    guideText: guideWithDriver(true),
    unitText: unitFixture({ carrier: "log" }),
  });
  assert.equal(result.verdict, "PASS");
  assert.equal(result.rows[0].status, "recorded");
});

test("a non-artifact criterion is never asked for a digest", () => {
  const result = checkArtifactEvidence({
    guideText: guideWithDriver(true),
    unitText: unitFixture().replace("`artifact: screenshot` ", ""),
  });
  assert.deepEqual(result.rows, []);
  assert.equal(result.verdict, "PASS");
});

// ── CLI: receipts on stdout, refusals on stderr ─────────────────────────

test("the CLI prints the plan receipt and exits 0 even when items are pending", () => {
  const root = scratch();
  try {
    writeFileSync(path.join(root, "AGENTS.md"), guideFixture({ boundaries: "`web → prose-only`" }));
    const result = run("materialize", "plan", "--guide", "AGENTS.md", "--root", root);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^MATERIALIZE PLAN — AGENTS\.md · 3 item\(s\) · pending 2/m);
    assert.match(result.stdout, /^residual: boundary web — /m);
    assert.match(result.stdout, /^verdict: PENDING$/m);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the CLI blocks with typed findings and exit 1", () => {
  const root = scratch();
  try {
    writeFileSync(path.join(root, "AGENTS.md"), guideFixture({ boundaries: "`web → prose-only`" }));
    const result = run("materialize", "check", "--guide", "AGENTS.md", "--root", root);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^MATERIALIZE CHECK BLOCKED — 1 finding\(s\)$/m);
    assert.match(result.stdout, /^- boundary-declared-unenforced: .+ · route: /m);
    assert.equal(result.stderr, "");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the CLI refuses a missing consent on stderr with exit 2 and writes nothing", () => {
  const root = scratch();
  try {
    const guide = guideFixture({ boundaries: "`web → prose-only`" });
    writeFileSync(path.join(root, "AGENTS.md"), guide);
    writeFileSync(path.join(root, "outcomes.json"), JSON.stringify({ items: [] }));
    const result = run("materialize", "apply", "--guide", "AGENTS.md", "--outcomes", "outcomes.json", "--root", root);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /^EDIT REFUSAL — .*consent/m);
    assert.equal(readFileSync(path.join(root, "AGENTS.md"), "utf8"), guide);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the CLI refuses an operation-foreign flag before reading anything", () => {
  const root = scratch();
  try {
    writeFileSync(path.join(root, "AGENTS.md"), guideFixture());
    const result = run("materialize", "plan", "--guide", "AGENTS.md", "--root", root, "--unit", "x.md");
    assert.equal(result.status, 2);
    assert.match(result.stderr, /unknown argument "--unit" for `materialize plan`/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--json prints the receipt as one JSON document and keeps stderr empty", () => {
  const root = scratch();
  try {
    writeFileSync(path.join(root, "AGENTS.md"), guideFixture({ boundaries: "`api → machine: lint`" }));
    const result = run("materialize", "plan", "--guide", "AGENTS.md", "--root", root, "--json");
    assert.equal(result.status, 0, result.stderr);
    const receipt = JSON.parse(result.stdout);
    assert.equal(receipt.contract, CONTRACT_ID);
    assert.equal(receipt.operation, "plan");
    assert.equal(receipt.verdict, "PENDING");
    assert.equal(result.stderr, "");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the evidence operation reports manual criteria and exits 1", () => {
  const root = scratch();
  try {
    mkdirSync(path.join(root, "docs"), { recursive: true });
    writeFileSync(path.join(root, "AGENTS.md"), guideWithDriver(false));
    writeFileSync(path.join(root, "unit.md"), unitFixture());
    const result = run("materialize", "evidence", "--guide", "AGENTS.md", "--unit", "unit.md", "--root", root);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^MATERIALIZE EVIDENCE BLOCKED — /m);
    assert.match(result.stdout, /^manual: AC-2 — no Evidence driver declared$/m);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the shipped template guide and invariants pass the check once its interview is answered", () => {
  const result = checkMaterialization({
    guideText: guideFixture({ boundaries: "`api → machine: the project's own lint config`" }),
    recordText: null,
    invariantsText: read("template/docs/architecture/ARCHITECTURAL_INVARIANTS.md"),
    featureMapText: null,
  });
  assert.equal(result.verdict, "PASS");
  assert.deepEqual(result.findings, []);
});

test("the shipped template's boundary slot declares no boundary yet, and the plan says so", () => {
  const plan = planMaterialization({
    guideText: read(GUIDE_REL),
    recordText: null,
    featureMapText: null,
  });
  assert.equal(plan.verdict, "PENDING");
  assert.ok(plan.residuals.some((row) => row.item === BOUNDARY_SLOT));
});
