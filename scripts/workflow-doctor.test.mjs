#!/usr/bin/env node
// test-obligation: protects=scripts/workflow-doctor.mjs obligations=contract,failure-path,boundary

/**
 * workflow-doctor.test.mjs — the ceremony-failure doctor's sibling suite (issue #703).
 *
 * The command this suite judges is the mechanical half of
 * `/agentic-workflow-doctor`: a project's own durable record becomes one
 * anonymized upstream bundle, with no free-form shell work between the steps.
 * The suite was observed RED against the tree that carried no module at all
 * (the import below names the missing file) before any implementation landed.
 *
 * What it pins, one case per rule:
 *
 *  - **The miner** reads only declared carriers — the journal through
 *    `journal-corpus`, the unit docs' `## Log` through the shared `parseLog` —
 *    and emits a stable, sorted `W<n>` row per ceremony event with a real
 *    `file:line` anchor.
 *  - **The completeness receipt**: every row is in exactly one group and the
 *    groups add up; a tree with no carrier answers `insufficient-input` instead
 *    of a vacuous clean.
 *  - **The rubric** is a closed contract: two verdicts, four discard reasons,
 *    three report reasons, a report class citing real rows and a discard class
 *    citing none.
 *  - **The profile** is the anonymizer: slugs and log tokens replace paths, a
 *    path or an e-mail or a secret-shaped value never reaches the bundle, and a
 *    secret refuses the whole bundle rather than printing a partial one.
 *  - **The battery** consumes the tool doctor's `doctor@1` envelope as-is and
 *    reads the ceremony profile and the named unit's recorded tier through their
 *    owners.
 *  - **The upstream half** matches report classes against guarded candidate text
 *    through an injected transport, names a forge refusal instead of swallowing
 *    it, and refuses to publish without explicit consent.
 *  - **The boundary**: every op except `publish` leaves the tree byte-identical.
 *
 * Run: `bun test scripts/workflow-doctor.test.mjs`
 * (fallback `node --test scripts/workflow-doctor.test.mjs`).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  BATTERY_CONTRACT,
  BUNDLE_CONTRACT,
  DISCARD_REASONS,
  MARKER_KINDS,
  MINE_CONTRACT,
  REPORT_REASONS,
  ROUTE_CONTRACT,
  VERDICTS,
} from "../packages/agentic-workflow/src/workflow-doctor/vocabulary.mjs";
import { buildMine, renderMine } from "../packages/agentic-workflow/src/workflow-doctor/mine.mjs";
import { buildBundle, renderBundle } from "../packages/agentic-workflow/src/workflow-doctor/bundle.mjs";
import { buildBattery, renderBattery } from "../packages/agentic-workflow/src/workflow-doctor/battery.mjs";
import { buildRoute, publishReceipt, renderRoute } from "../packages/agentic-workflow/src/workflow-doctor/upstream.mjs";
import { main } from "../packages/agentic-workflow/src/workflow-doctor/index.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BIN = path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs");
const SCRATCH = [];

/* ------------------------------------------------------------------ fixtures */

const UNIT_DOC = `# fix/700-demo

## Specs

**S1 — the demo requirement.**

> demo

## Risk tier

- **Tier** — \`standard\` · **Task Size** — \`{understood: true}\`

## Log

- **L1** — 2026-12-01, the request
- **G1** — 2026-12-01, \`bun test\` · exit 1 · \`tests 3 / fail 1\`
- **G2** — 2026-12-01, \`bun test\` · exit 0 · \`tests 3 / pass 3\`
- **E1** — 2026-12-01, \`bun test scripts/x.test.mjs\` · exit 2 · unknown flag
- **E2** — 2026-12-01, \`bun test scripts/x.test.mjs\` · exit 0
- **R1** — 2026-12-02, review-change cycle 1 · verdict REVIEW-FAIL · two blockers
- **F1** — 2026-12-02, folded F1 at abc1234
- **F2** — 2026-12-02, folded F2 at abc1234
- **F3** — 2026-12-02, folded F3 at abc1234
`;

const SECOND_DOC = `# fix/701-other

## Log

- **G1** — 2026-12-03, \`bun run gate\` · exit 3 · pool killed
- **R1** — 2026-12-03, review-change cycle 1 · verdict PASS
- **R2** — 2026-12-03, review-change cycle 2 · verdict REVIEW-FAIL
- **R3** — 2026-12-03, review-change cycle 3 · verdict REVIEW-FAIL
`;

const LOG_ENTRY = "## 2026-12-01 — fix/700-demo — manual\n";

const JOURNAL = `# Session log

${LOG_ENTRY}
- **Summary:** the first session on this unit
- **Correction (same session):** the earlier reading of F1 was wrong

${LOG_ENTRY}
- **Summary:** the second session on this unit
- **Decision:** F2 was a false positive, refuted by the reproducer
`;

const RUNNER_DOC = `# Runner contract

\`\`\`text
bunx @gtrabanco/agentic-workflow@4.10.1 workflow-doctor mine
\`\`\`
`;

const GUIDE = `# AGENTS.md

## Project charter

\`\`\`text
ceremony-profile@1
docs-step: paid
captures: discarded
\`\`\`
`;

const DOCTOR_ENVELOPE = Object.freeze({
  contract: "doctor@1",
  host: { platform: "linux", arch: "x64", node: "v24", root: "/fixture" },
  inventory: { source: "packages/agentic-workflow/README.md", rows: 2 },
  rows: [
    { id: "git", requirement: "required", status: "ok", move: "report-only", advisory: null },
    { id: "gh", requirement: "required", status: "missing", move: "instruct-only", advisory: "install the forge CLI" },
  ],
  summary: { ok: 1, missing: 1, mismatch: 0, unarmed: 0, unreachable: 0, notApplicable: 0, advisories: 1 },
  verdict: "attention",
  exitCode: 1,
});

/** A throwaway project: the journal, two unit docs, the pin and the guide. */
function fixture({ journal = true, units = true, runnerDoc = true, guide = true } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "workflow-doctor-"));
  SCRATCH.push(dir);
  if (journal) {
    mkdirSync(path.join(dir, "docs"), { recursive: true });
    writeFileSync(path.join(dir, "docs", "LOGS.md"), JOURNAL);
  }
  if (units) {
    mkdirSync(path.join(dir, "docs", "fix", "700-demo"), { recursive: true });
    writeFileSync(path.join(dir, "docs", "fix", "700-demo", "SPEC.md"), UNIT_DOC);
    mkdirSync(path.join(dir, "docs", "fix", "701-other"), { recursive: true });
    writeFileSync(path.join(dir, "docs", "fix", "701-other", "SPEC.md"), SECOND_DOC);
  }
  if (runnerDoc) {
    mkdirSync(path.join(dir, "skills", "runner-contract", "references"), { recursive: true });
    writeFileSync(path.join(dir, "skills", "runner-contract", "references", "RUNNER.md"), RUNNER_DOC);
  }
  for (const skill of ["agentic-workflow-doctor", "aw-doctor"]) {
    mkdirSync(path.join(dir, "skills", skill), { recursive: true });
    writeFileSync(
      path.join(dir, "skills", skill, "SKILL.md"),
      `---\nname: ${skill}\nuser-invocable: true\ndescription: >\n  fixture\n---\n\nbody\n`,
    );
  }
  if (guide) writeFileSync(path.join(dir, "AGENTS.md"), GUIDE);
  return dir;
}

/** Every file under `dir` with the digest of its bytes — the read-only witness. */
function digestTree(dir) {
  const out = {};
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else out[path.relative(dir, full)] = createHash("sha256").update(readFileSync(full)).digest("hex");
    }
  };
  walk(dir);
  return out;
}

const writeJson = (dir, name, value) => {
  const file = path.join(dir, name);
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
};

const kindOf = (rows, kind) => rows.filter((row) => row.kind === kind);

const REPORT_READY = (dir) => {
  const mine = buildMine(dir);
  const triage = {
    classes: [
      {
        class: "gate-red",
        verdict: "report",
        reason: "reproducible-defect",
        defect: "the project gate exits non-zero on the same suite in two units",
        rows: [kindOf(mine.rows, "gate-red")[0].id],
      },
      { class: "rework", verdict: "discard", reason: "one-off-human", rows: [] },
    ],
  };
  return { mine, triage };
};

test.after(() => {
  for (const dir of SCRATCH) rmSync(dir, { recursive: true, force: true });
});

/* -------------------------------------------------------------- the contract */

test("the contract ids and the closed marker set are the published ones", () => {
  assert.equal(MINE_CONTRACT, "workflow-doctor-mine@1");
  assert.equal(BUNDLE_CONTRACT, "workflow-doctor-bundle@1");
  assert.equal(BATTERY_CONTRACT, "workflow-doctor-battery@1");
  assert.equal(ROUTE_CONTRACT, "workflow-doctor-route@1");
  assert.deepEqual(
    [...MARKER_KINDS],
    ["gate-red", "evidence-red", "review-fail", "fold-over-budget", "review-cycles-over-budget", "correction", "refuted-finding", "rework"],
  );
  assert.deepEqual([...VERDICTS], ["report", "discard"]);
  assert.deepEqual([...DISCARD_REASONS], ["operator-error", "env-specific", "covered-upstream", "one-off-human"]);
  assert.deepEqual([...REPORT_REASONS], ["reproducible-defect", "contract-vs-behavior", "cross-project-recurrence"]);
});

/* ------------------------------------------------------------------- the mine */

test("the miner reads the journal carrier and the unit-doc log lines into stable, sorted rows", () => {
  const dir = fixture();
  const receipt = buildMine(dir);

  assert.equal(receipt.contract, MINE_CONTRACT);
  assert.equal(receipt.carriers.log.present, true);
  assert.equal(receipt.carriers.units.length, 2);

  const ids = receipt.rows.map((row) => row.id);
  assert.deepEqual(ids, ids.slice().sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))), "ids ascend in render order");
  assert.equal(new Set(ids).size, ids.length, "every id is unique");

  // Deterministic: the same tree yields the same receipt bytes.
  assert.deepEqual(buildMine(dir), receipt);

  // Every anchor is a real file:line carrying that line's token, and every row
  // carries the handle the bundle prints in place of the path.
  for (const row of receipt.rows) {
    assert.ok(row.anchor === null || /^docs\//u.test(row.anchor), `anchor stays repository-relative: ${row.anchor}`);
    assert.match(
      row.handle,
      /^(?:lg:[GER]\d+|jn:(?:correction|refuted)|agg:(?:fold|cycle|rework)×\d+)$/u,
      `handle shape: ${row.handle}`,
    );
    if (row.token) {
      assert.match(row.anchor, /^docs\/(?:fix|features)\/[^:]+SPEC\.md:\d+$/u, `log anchor shape: ${row.anchor}`);
      const [file, line] = row.anchor.split(":");
      const text = readFileSync(path.join(dir, file), "utf8").split("\n")[Number(line) - 1];
      assert.ok(text.includes(`**${row.token}**`), `the anchor names the line carrying ${row.token}: ${text}`);
    }
    if (row.handle.startsWith("jn:")) {
      assert.match(row.anchor, /^docs\/LOGS\.md:\d+$/u, `journal anchor shape: ${row.anchor}`);
    }
  }

  // The declared shapes produced exactly the events the fixture records.
  assert.deepEqual(
    kindOf(receipt.rows, "gate-red").map((row) => row.token).sort(),
    ["G1", "G1"],
    "two units record a non-zero gate exit, one line each",
  );
  assert.deepEqual(kindOf(receipt.rows, "evidence-red").map((row) => row.token), ["E1"], "only the non-zero evidence line is an event");
  assert.deepEqual(
    [...new Set(kindOf(receipt.rows, "review-fail").map((row) => row.unit))].sort(),
    ["700-demo", "701-other"],
    "the FAIL verdicts are events, the PASS one is not",
  );
  assert.equal(kindOf(receipt.rows, "review-fail").length, 3, "one row per failing verdict line");
  assert.deepEqual(kindOf(receipt.rows, "fold-over-budget").map((row) => row.unit), ["700-demo"], "three folded findings is over the budget of two");
  assert.deepEqual(kindOf(receipt.rows, "review-cycles-over-budget").map((row) => row.unit), ["701-other"], "three review cycles is over the budget of two");
  assert.equal(kindOf(receipt.rows, "correction").length, 1, "the journal's correcting line");
  assert.equal(kindOf(receipt.rows, "refuted-finding").length, 1, "the journal's refuted finding");
  assert.equal(kindOf(receipt.rows, "rework").length, 1, "two sessions on one unit is rework");
});

test("the miner groups its rows by kind and the group counts add up", () => {
  const receipt = buildMine(fixture());
  assert.deepEqual(receipt.groups.map((group) => group.kind), [...MARKER_KINDS], "one group per kind, in the published order");
  assert.equal(
    receipt.groups.reduce((sum, group) => sum + group.count, 0),
    receipt.rows.length,
    "every row is in exactly one group",
  );
  for (const group of receipt.groups) {
    assert.equal(group.count, kindOf(receipt.rows, group.kind).length, `group ${group.kind} counts its own rows`);
    assert.deepEqual(group.rows, kindOf(receipt.rows, group.kind).map((row) => row.id), `group ${group.kind} lists its ids`);
  }
  const rendered = renderMine(receipt);
  assert.match(rendered, /^WORKFLOW DOCTOR MINE — \d+ row\(s\)/u);
  assert.match(rendered, /contract workflow-doctor-mine@1/u);
  assert.match(rendered, /group — gate-red · 2 row\(s\)/u);
});

test("a tree with no carrier answers insufficient-input instead of a clean receipt", () => {
  const empty = mkdtempSync(path.join(tmpdir(), "workflow-doctor-empty-"));
  SCRATCH.push(empty);
  assert.throws(
    () => buildMine(empty),
    (error) => error.refusal === "insufficient-input" && /docs\/LOGS\.md/u.test(error.message),
    "the refusal names the carrier it looked for",
  );
  const code = main(["mine", "--root", empty], { root: ROOT });
  assert.equal(code, 1, "a missing corpus is a refusal, never a clean 0");
});

/* ------------------------------------------------------------------ the triage */

test("an unknown verdict or reason is refused by name", () => {
  const dir = fixture();
  const mine = buildMine(dir);
  const base = { class: "gate-red", rows: [mine.rows[0].id] };

  assert.throws(
    () => buildBundle({ mine, triage: { classes: [{ ...base, verdict: "maybe", reason: "reproducible-defect" }] } }),
    (error) => error.refusal === "unknown-verdict" && error.message.includes("report, discard"),
    "the refusal prints the legal verdict set",
  );
  assert.throws(
    () => buildBundle({ mine, triage: { classes: [{ ...base, verdict: "discard", reason: "vibes" }] } }),
    (error) => error.refusal === "unknown-reason" && error.message.includes("operator-error"),
    "the refusal prints the legal reason set",
  );
  assert.throws(
    () => buildBundle({ mine, triage: { classes: [{ ...base, verdict: "report", reason: "one-off-human" }] } }),
    (error) => error.refusal === "reason-verdict-mismatch",
    "a discard reason cannot carry a report verdict",
  );
  assert.throws(
    () => buildBundle({ mine, triage: { classes: [{ ...base, verdict: "report" }] } }),
    (error) => error.refusal === "missing-reason",
  );
  assert.throws(
    () => buildBundle({ mine, triage: { classes: [{ ...base, verdict: "report", reason: "reproducible-defect", row: [mine.rows[0].id] }] } }),
    (error) => error.refusal === "unknown-class-field",
    "a typo'd field is refused instead of silently ignored",
  );
});

test("a report class cites at least one mined row and a discard class states its reason", () => {
  const dir = fixture();
  const mine = buildMine(dir);
  const gateRow = kindOf(mine.rows, "gate-red")[0].id;

  assert.throws(
    () => buildBundle({ mine, triage: { classes: [{ class: "gate-red", verdict: "report", reason: "reproducible-defect", defect: "x", rows: [] }] } }),
    (error) => error.refusal === "report-without-evidence",
  );
  assert.throws(
    () => buildBundle({ mine, triage: { classes: [{ class: "gate-red", verdict: "report", reason: "reproducible-defect", rows: [gateRow] }] } }),
    (error) => error.refusal === "report-without-defect",
    "a report class states what a maintainer acts on",
  );
  assert.throws(
    () => buildBundle({ mine, triage: { classes: [{ class: "gate-red", verdict: "report", reason: "reproducible-defect", defect: "x", rows: ["W999"] }] } }),
    (error) => error.refusal === "unknown-row" && error.message.includes("W999"),
    "a cited id must exist in this mine receipt",
  );
  assert.throws(
    () => buildBundle({ mine, triage: { classes: [{ class: "rework", verdict: "discard", reason: "one-off-human", defect: "x", rows: [gateRow] }] } }),
    (error) => error.refusal === "discard-with-evidence",
    "a discard cites no row: it is not a finding",
  );

  const ok = buildBundle({ mine, triage: REPORT_READY(dir).triage });
  assert.equal(ok.totals.report, 1);
  assert.equal(ok.totals.discard, 1);
  assert.equal(ok.classes[0].occurrences, kindOf(mine.rows, "gate-red").length, "occurrences come from the corpus, not the citation");
  assert.equal(ok.unclassified, mine.rows.length - kindOf(mine.rows, "gate-red").length, "rows no class claims are counted, never bucketed");
});

/* --------------------------------------------------------------- the profile */

test("the bundle prints slugs and log tokens, never a repository path", () => {
  const dir = fixture();
  const { mine, triage } = REPORT_READY(dir);
  const bundle = buildBundle({ mine, triage });
  const rendered = renderBundle(bundle);

  assert.ok(rendered.startsWith(`WORKFLOW DOCTOR BUNDLE — contract ${BUNDLE_CONTRACT}`), "the contract id opens the receipt");
  assert.match(rendered, /evidence: unit:700-demo lg:G1/u);
  assert.doesNotMatch(rendered, /docs\//u, "no repository path survives");
  assert.doesNotMatch(rendered, new RegExp(dir.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"), "no absolute path survives");
  assert.doesNotMatch(rendered, /[\w.+-]+@[\w-]+\.[\w.]+/u, "no e-mail survives");
  assert.doesNotMatch(rendered, /fix\/700-demo/u, "the branch spelling is not the anchor");
});

test("a secret-shaped value refuses the bundle and prints nothing", () => {
  const dir = fixture();
  const mine = buildMine(dir);
  const secret = `token ghp_${"a".repeat(36)} leaked into the defect`;
  for (const field of ["defect", "class"]) {
    assert.throws(
      () =>
        buildBundle({
          mine,
          triage: {
            classes: [
              {
                class: field === "class" ? "ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" : "gate-red",
                verdict: "report",
                reason: "reproducible-defect",
                defect: field === "defect" ? secret : "a plain sentence",
                rows: [kindOf(mine.rows, "gate-red")[0].id],
              },
            ],
          },
        }),
      (error) => error.refusal === "secret-shaped-value" && !error.message.includes("ghp_"),
      `a secret in the ${field} field refuses without echoing it`,
    );
  }
});

test("the same inputs render the same bundle bytes", () => {
  const dir = fixture();
  const { mine, triage } = REPORT_READY(dir);
  const first = renderBundle(buildBundle({ mine, triage }));
  const second = renderBundle(buildBundle({ mine, triage }));
  assert.equal(first, second);
  assert.match(first, /## Discarded/u);
  assert.match(first, /one-off-human/u);
});

/* --------------------------------------------------------------- the battery */

test("the battery embeds the doctor envelope verbatim and reports the runner version and pin", async () => {
  const dir = fixture();
  const receipt = await buildBattery(dir, { doctor: async () => DOCTOR_ENVELOPE });

  assert.equal(receipt.contract, BATTERY_CONTRACT);
  assert.deepEqual(receipt.doctor, DOCTOR_ENVELOPE, "the doctor envelope is carried as-is, never re-derived");
  assert.equal(receipt.runner.pin, "4.10.1");
  assert.equal(receipt.runner.version, "4.10.1");
  assert.equal(receipt.skills.count, 2);
  assert.equal(receipt.skills.userInvocable, 2);
  assert.deepEqual(receipt.skills.names, ["agentic-workflow-doctor", "aw-doctor"]);

  const rendered = renderBattery(receipt);
  assert.match(rendered, /contract workflow-doctor-battery@1/u);
  assert.match(rendered, /doctor: attention · ok 1 · missing 1/u);
});

test("an absent doctor refuses the battery instead of fabricating a healthy row", async () => {
  const dir = fixture();
  await assert.rejects(
    buildBattery(dir, {
      doctor: async () => {
        const error = new Error("the inventory is unreadable");
        error.code = "inventory-malformed";
        throw error;
      },
    }),
    (error) => error.refusal === "doctor-unavailable" && /inventory-malformed/u.test(error.message),
  );
  const receipt = await buildBattery(dir, { doctor: async () => DOCTOR_ENVELOPE });
  assert.equal(receipt.degradations.length, 0, "a present doctor is no degradation");
});

test("the battery reads the ceremony profile and the named unit's recorded tier", async () => {
  const dir = fixture();
  const receipt = await buildBattery(dir, { doctor: async () => DOCTOR_ENVELOPE, unit: "700-demo" });
  assert.deepEqual(receipt.ceremony.adoption, { "docs-step": "paid", captures: "discarded" });
  assert.equal(receipt.ceremony.unit, "700-demo");
  assert.equal(receipt.ceremony.tier, "standard");

  const absent = await buildBattery(fixture({ guide: false }), { doctor: async () => DOCTOR_ENVELOPE });
  assert.equal(absent.ceremony.adoption, null, "no guide section is no declared profile");
  assert.equal(absent.ceremony.tier, null, "no unit named is no tier, never an assumed one");
});

/* -------------------------------------------------------------- the upstream */

/** A transport shaped like `createGhTransport`, with the two rates the route uses. */
function fakeTransport({ issues = {}, list = [], fail = null } = {}) {
  const calls = { objects: [], lists: [] };
  return {
    calls,
    kind: "fake",
    readObject(pathname) {
      calls.objects.push(pathname);
      if (fail) return { ok: false, code: fail, detail: "the fake forge refused" };
      const number = /(\d+)$/u.exec(pathname)?.[1];
      const issue = issues[number];
      return issue ? { ok: true, data: issue } : { ok: false, code: "unavailable-forge-no-network", detail: "not found" };
    },
    readList(pathname) {
      calls.lists.push(pathname);
      if (fail) return { ok: false, code: fail, detail: "the fake forge refused" };
      return { ok: true, data: list };
    },
  };
}

const ISSUE_698 = {
  number: 698,
  title: "a ceremony-shaped finding never blocks the merge",
  body: "When the project gate exits non-zero on the same suite in two units, the finding repeats: the gate-red class is a reproducible defect.",
  state: "open",
  user: { login: "maintainer" },
  author_association: "OWNER",
  html_url: "https://example.test/issues/698",
};

test("the route matches a report class against guarded candidate text and proposes existing or new", () => {
  const dir = fixture();
  const { mine, triage } = REPORT_READY(dir);
  const bundle = buildBundle({ mine, triage });
  const transport = fakeTransport({ issues: { 698: ISSUE_698 }, list: [{ number: 698, title: "x" }] });

  const receipt = buildRoute({ bundle, transport, search: ["ceremony gate repeated"] });
  assert.equal(receipt.contract, ROUTE_CONTRACT);
  assert.deepEqual(receipt.candidates, [698]);
  assert.equal(transport.calls.lists.length, 1, "the search reads the list endpoint once");
  assert.equal(transport.calls.objects.length, 1, "every candidate is re-read through the guarded transport");

  const matched = receipt.classes.find((entry) => entry.class === "gate-red");
  assert.equal(matched.action, "existing-issue");
  assert.equal(matched.issue, 698);
  assert.ok(matched.matched.includes("gate-red"), "the class name is one of the matched tokens");
  assert.match(renderRoute(receipt), /gate-red · existing-issue #698/u);
  assert.match(renderRoute(receipt), /consent/u, "the receipt names the consent the filing needs");

  const fresh = buildRoute({ bundle, transport: fakeTransport({ issues: {}, list: [] }), candidate: [999] });
  const action = fresh.classes.find((entry) => entry.class === "gate-red");
  assert.equal(action.action, "new-issue");
  assert.equal(action.issue, null);
});

test("a forge refusal is named, never swallowed", () => {
  const dir = fixture();
  const bundle = buildBundle(REPORT_READY(dir));
  for (const code of ["unavailable-forge-missing-cli", "unavailable-forge-auth", "unavailable-forge-timeout", "unavailable-forge-no-network"]) {
    assert.throws(
      () => buildRoute({ bundle, transport: fakeTransport({ fail: code }), candidate: [698] }),
      (error) => error.refusal === code,
      `the ${code} class surfaces as a refusal`,
    );
  }
});

test("publish refuses without explicit consent and writes nothing", () => {
  const dir = fixture();
  const bundleFile = writeJson(dir, "bundle.json", buildBundle(REPORT_READY(dir)));
  const calls = [];
  const spawn = (bin, args, options) => {
    calls.push({ bin, args, input: options?.input });
    return { status: 0, stdout: "ok", stderr: "" };
  };

  assert.throws(
    () => publishReceipt({ bundleFile, issue: 698, yes: false, spawn }),
    (error) => error.refusal === "consent-required" && /--yes/u.test(error.message),
  );
  assert.equal(calls.length, 0, "no forge command runs before consent");

  const code = main(["publish", "--bundle", bundleFile, "--issue", "698"], { root: dir, spawn });
  assert.equal(code, 2, "the CLI refuses at the usage boundary");

  const done = publishReceipt({ bundleFile, issue: 698, yes: true, repo: "gtrabanco/agentic-workflow", spawn });
  assert.equal(done.posted, true);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].args.slice(0, 1), ["issue"]);
  assert.ok(calls[0].args.includes("comment"));
  assert.equal(calls[0].args[calls[0].args.indexOf("698")], "698");
  assert.ok(calls[0].input.includes(BUNDLE_CONTRACT), "the bundle is the body");
});

test("publish refuses an upstream that is not the GitHub family", () => {
  const dir = fixture();
  const bundleFile = writeJson(dir, "bundle.json", buildBundle(REPORT_READY(dir)));
  const spawn = () => ({ status: 0, stdout: "", stderr: "" });
  assert.throws(
    () => publishReceipt({ bundleFile, issue: 1, yes: true, forge: "gitlab", spawn }),
    (error) => error.refusal === "unsupported-upstream-forge" && error.message.includes("gitlab"),
  );
  assert.throws(
    () => publishReceipt({ bundleFile, issue: 1, yes: true, repo: "not a repo", spawn }),
    (error) => error.refusal === "invalid-upstream-repo",
  );
});

/* -------------------------------------------------------------- the boundary */

test("every op except publish leaves the tree byte-identical", async () => {
  const dir = fixture();
  const before = digestTree(dir);
  const mine = buildMine(dir);
  await buildBattery(dir, { doctor: async () => DOCTOR_ENVELOPE, unit: "700-demo" });
  const bundle = buildBundle({ mine, triage: REPORT_READY(dir).triage });
  renderBundle(bundle);
  buildRoute({ bundle, transport: fakeTransport({ issues: { 698: ISSUE_698 }, list: [] }), candidate: [698] });
  main(["mine", "--root", dir, "--json"], { root: ROOT });
  main(["battery", "--root", dir, "--json"], { root: ROOT, doctor: async () => DOCTOR_ENVELOPE });
  assert.deepEqual(digestTree(dir), before);
});

test("the CLI prints a help block and refuses an unknown op with candidates", () => {
  const help = spawnSync(process.execPath, [BIN, "help", "workflow-doctor", "--json"], { encoding: "utf8" });
  assert.equal(help.status, 0);
  const envelope = JSON.parse(help.stdout);
  assert.deepEqual(envelope.subcommands[0].ops, ["mine", "battery", "bundle", "route", "publish"]);

  const refused = spawnSync(process.execPath, [BIN, "workflow-doctor", "bogus"], { encoding: "utf8" });
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /bogus/u);
  assert.match(refused.stderr, /mine/u, "the refusal names the legal ops");
  assert.equal(refused.stdout, "", "a refusal prints no receipt");
});

/* ------------------------------------------------------------ the published prose */

test("the rubric covers every marker kind and the skill cites the five ops", () => {
  const rubric = readFileSync(path.join(ROOT, "skills", "agentic-workflow-doctor", "references", "RUBRIC.md"), "utf8");
  const block = /```text\ndoctor-triage-rubric@1\n([\s\S]*?)```/u.exec(rubric);
  assert.ok(block, "the rubric is a published block, not loose prose");
  const rows = block[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("kind"));
  const kinds = rows.map((line) => line.split("|")[0].trim());
  assert.deepEqual(kinds, [...MARKER_KINDS], "one rubric row per marker kind, in the published order");
  for (const line of rows) {
    const cells = line.split("|").map((cell) => cell.trim());
    assert.equal(cells.length, 4, `rubric row shape: ${line}`);
    assert.ok(VERDICTS.includes(cells[1]), `a verdict per row: ${line}`);
    assert.ok([...DISCARD_REASONS, ...REPORT_REASONS].includes(cells[2]), `a reason per row: ${line}`);
  }

  const skill = readFileSync(path.join(ROOT, "skills", "agentic-workflow-doctor", "SKILL.md"), "utf8");
  for (const op of ["mine", "battery", "bundle", "route", "publish"]) {
    assert.ok(skill.includes(`runner workflow-doctor ${op}`), `the skill cites \`runner workflow-doctor ${op}\``);
  }
  const pointer = readFileSync(path.join(ROOT, "skills", "aw-doctor", "SKILL.md"), "utf8");
  assert.ok(pointer.includes("agentic-workflow-doctor/SKILL.md"), "the alias names its owner");
  assert.ok(!pointer.includes("runner workflow-doctor mine"), "the alias restates no rule");
});
