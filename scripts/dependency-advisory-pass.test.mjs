#!/usr/bin/env node

/**
 * dependency-advisory-pass.test.mjs — the pass's contract (issue #365 S5–S9).
 *
 * The corpus is the issue's own failure: `review-security`'s dependency
 * checklist line asked the model to "state how you checked" and nothing checked.
 * The pass answers it deterministically, and these cases are its frozen
 * contract: resolution from the committed lock (never a registry guess), the OSV
 * query shape, the fix version chosen against the *resolved* version, the
 * materiality rule exactly as `S6` states it, the closed severity projection, the
 * degraded path, and the report-only exit code.
 *
 * No case touches the network: every fetcher is injected, which is also what
 * proves the gate can be green with OSV unreachable (`S9`).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  classifyImpact,
  collectAdvisories,
  collectResolved,
  buildQueries,
  fixedVersionFor,
  projectSeverity,
  renderReport,
  run,
} from "./dependency-advisory-pass.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** A toy repository: one manifest declaring a range, one lock stating the truth. */
function toyRepo({ manifestDeps = { alpha: "^9.0.0" }, packages = null } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dep-advisory-"));
  fs.mkdirSync(path.join(root, "packages", "a"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "packages", "a", "package.json"),
    JSON.stringify({ name: "a", version: "1.0.0", dependencies: manifestDeps }, null, 2),
  );
  // JSONC: trailing commas, exactly as `bun.lock` writes them.
  const lock = {
    lockfileVersion: 2,
    workspaces: { "": { name: "toy" }, "packages/a": { name: "a", version: "1.0.0" } },
    packages:
      packages ??
      {
        alpha: ["alpha@1.2.3", "", {}, "sha512-x"],
        beta: ["beta@4.5.6", "", {}, "sha512-y"],
        "@toy/a": ["@toy/a@workspace:packages/a"],
      },
  };
  fs.writeFileSync(path.join(root, "bun.lock"), `${JSON.stringify(lock, null, 2).replace(/\n\}$/u, ",\n}")}\n`);
  return root;
}

const cleanup = (root) => fs.rmSync(root, { recursive: true, force: true });

/* ------------------------------------------------------------------ S5 */

test("resolves every npm package the lock states, and never a workspace link", () => {
  const root = toyRepo();
  try {
    assert.deepEqual(collectResolved({ root }), [
      { name: "alpha", version: "1.2.3", direct: true },
      { name: "beta", version: "4.5.6", direct: false },
    ]);
  } finally {
    cleanup(root);
  }
});

test("the query carries the resolved version, never the manifest range", () => {
  const root = toyRepo({ manifestDeps: { alpha: "^9.0.0" } });
  try {
    const queries = buildQueries(collectResolved({ root }));
    assert.deepEqual(queries, [
      { package: { name: "alpha", ecosystem: "npm" }, version: "1.2.3" },
      { package: { name: "beta", ecosystem: "npm" }, version: "4.5.6" },
    ]);
    assert.ok(!JSON.stringify(queries).includes("^9.0.0"), "a range is never sent");
  } finally {
    cleanup(root);
  }
});

test("a package the manifests do not declare is transitive, not direct", () => {
  const root = toyRepo({ manifestDeps: {} });
  try {
    assert.deepEqual(
      collectResolved({ root }).map((entry) => entry.direct),
      [false, false],
    );
  } finally {
    cleanup(root);
  }
});

/* ------------------------------------------------------- S6 (materiality) */

const projection = {
  CRITICAL: { severity: "critical", ladder: "BLOCKER", ledger: "high" },
  HIGH: { severity: "high", ladder: "CRITICAL", ledger: "high" },
  MODERATE: { severity: "moderate", ladder: "WARNING", ledger: "med" },
  LOW: { severity: "low", ladder: "SUGGESTION", ledger: "low" },
};

test("the severity projection covers every producer word, and an absent grade is unknown", () => {
  for (const [raw, expected] of Object.entries(projection)) {
    assert.deepEqual(projectSeverity({ database_specific: { severity: raw } }), expected, raw);
  }
  assert.deepEqual(projectSeverity({}), { severity: "unknown", ladder: "WARNING", ledger: "med" });
  assert.deepEqual(projectSeverity({ database_specific: {} }), {
    severity: "unknown",
    ladder: "WARNING",
    ledger: "med",
  });
});

test("the fix is the smallest range leg above the resolved version, not the first leg", () => {
  const vuln = {
    id: "GHSA-multi-leg",
    affected: [
      // Another package's leg: never this package's fix.
      { package: { name: "elsewhere" }, ranges: [{ type: "SEMVER", events: [{ introduced: "0" }, { fixed: "1.0.0" }] }] },
      {
        package: { name: "beta" },
        ranges: [
          {
            type: "SEMVER",
            events: [
              { introduced: "0" },
              { fixed: "4.9.0" },
              { introduced: "5.0.0" },
              { fixed: "5.4.2" },
              { introduced: "8.0.0" },
              { fixed: "8.12.2" },
            ],
          },
        ],
      },
    ],
  };
  assert.equal(fixedVersionFor(vuln, { name: "beta", version: "8.10.2" }), "8.12.2");
  assert.equal(fixedVersionFor(vuln, { name: "beta", version: "4.6.0" }), "4.9.0");
  assert.equal(fixedVersionFor(vuln, { name: "beta", version: "9.0.0" }), null, "past every leg: no fix");
  assert.equal(fixedVersionFor(vuln, { name: "unknown-pkg", version: "1.0.0" }), null);
});

test("an advisory with no fixed event states no fix", () => {
  const vuln = { id: "MAL-1", affected: [{ package: { name: "beta" }, ranges: [{ type: "SEMVER", events: [{ introduced: "0" }] }] }] };
  assert.equal(fixedVersionFor(vuln, { name: "beta", version: "4.5.6" }), null);
});

test("blocking is exactly CRITICAL/HIGH with a fixed version — every other row is report-only", () => {
  const cases = [
    [{ severity: "critical", fixed: "2.0.0" }, "blocking"],
    [{ severity: "high", fixed: "8.12.2" }, "blocking"],
    [{ severity: "high", fixed: null }, "report-only"],
    [{ severity: "moderate", fixed: "8.12.2" }, "report-only"],
    [{ severity: "low", fixed: "8.12.2" }, "report-only"],
    [{ severity: "unknown", fixed: "8.12.2" }, "report-only"],
  ];
  for (const [input, expected] of cases) {
    assert.equal(classifyImpact(input), expected, JSON.stringify(input));
  }
});

/* ------------------------------------------------- S5/S8/S9 (collection) */

const betaHigh = {
  id: "GHSA-beta-high",
  summary: "beta reaches a sink it should not",
  database_specific: { severity: "HIGH" },
  affected: [
    { package: { name: "beta" }, ranges: [{ type: "SEMVER", events: [{ introduced: "8.0.0" }, { fixed: "8.12.2" }] }] },
  ],
};

/** A record with no `fixed` event: the advisory is real, the repair is not stated. */
const betaNoFix = {
  id: "GHSA-beta-no-fix",
  summary: "beta reaches a sink it should not",
  database_specific: { severity: "HIGH" },
  affected: [{ package: { name: "beta" }, ranges: [{ type: "SEMVER", events: [{ introduced: "0" }] }] }],
};

const alphaModerate = {
  id: "GHSA-alpha-moderate",
  summary: "alpha amplifies a glob",
  database_specific: { severity: "MODERATE" },
  affected: [
    { package: { name: "alpha" }, ranges: [{ type: "SEMVER", events: [{ introduced: "0" }, { fixed: "1.3.0" }] }] },
  ],
};

/** An injected OSV: one batch answer, then the full records by id. */
function osvStub({ batch = { results: [{ vulns: [] }, { vulns: [{ id: "GHSA-beta-no-fix", modified: "x" }] }] }, details = { "GHSA-beta-no-fix": betaNoFix, "GHSA-beta-high": betaHigh } } = {}) {
  const calls = { batch: 0, details: [] };
  return {
    calls,
    fetchBatch: async (queries) => {
      calls.batch += 1;
      calls.queries = queries;
      return batch;
    },
    fetchVuln: async (id) => {
      calls.details.push(id);
      if (!(id in details)) throw new Error(`404 ${id}`);
      return details[id];
    },
  };
}

test("collectAdvisories maps the batch answer onto one row per advisory and package", async () => {
  const root = toyRepo();
  try {
    const packages = collectResolved({ root });
    const osv = osvStub();
    const result = await collectAdvisories({ packages, fetchBatch: osv.fetchBatch, fetchVuln: osv.fetchVuln });
    assert.equal(osv.calls.batch, 1, "one batched query for the whole tree");
    assert.deepEqual(osv.calls.details, ["GHSA-beta-no-fix"], "one detail read per hit");
    assert.deepEqual(result.rows, [
      {
        id: "GHSA-beta-no-fix",
        package: "beta",
        resolved: "4.5.6",
        direct: false,
        severity: "high",
        ladder: "CRITICAL",
        ledger: "high",
        impact: "report-only",
        fixed: null,
        summary: "beta reaches a sink it should not",
        url: "https://osv.dev/vulnerability/GHSA-beta-no-fix",
      },
    ]);
  } finally {
    cleanup(root);
  }
});

test("a row is blocking only when the record states a fix above the resolved version", async () => {
  const root = toyRepo({
    manifestDeps: { beta: "8.10.2" },
    packages: { beta: ["beta@8.10.2", "", {}, "sha512-y"] },
  });
  try {
    const packages = collectResolved({ root });
    const osv = osvStub({
      batch: { results: [{ vulns: [{ id: "GHSA-beta-high", modified: "x" }] }] },
    });
    const result = await collectAdvisories({ packages, fetchBatch: osv.fetchBatch, fetchVuln: osv.fetchVuln });
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].fixed, "8.12.2");
    assert.equal(result.rows[0].impact, "blocking");
    assert.equal(result.rows[0].direct, true);
  } finally {
    cleanup(root);
  }
});

test("rows are ordered deterministically, whatever order the batch returns", async () => {
  const root = toyRepo();
  try {
    const packages = collectResolved({ root });
    const osv = osvStub({
      batch: {
        results: [
          { vulns: [{ id: "GHSA-alpha-moderate", modified: "x" }] },
          { vulns: [{ id: "GHSA-beta-high", modified: "x" }] },
        ],
      },
      details: { "GHSA-alpha-moderate": alphaModerate, "GHSA-beta-high": betaHigh },
    });
    const first = await collectAdvisories({ packages, fetchBatch: osv.fetchBatch, fetchVuln: osv.fetchVuln });
    assert.deepEqual(
      first.rows.map((row) => `${row.package}/${row.id}`),
      ["alpha/GHSA-alpha-moderate", "beta/GHSA-beta-high"],
    );
  } finally {
    cleanup(root);
  }
});

test("OSV unreachable degrades: no rows, a named warning, never a throw", async () => {
  const root = toyRepo();
  try {
    const packages = collectResolved({ root });
    const result = await collectAdvisories({
      packages,
      fetchBatch: async () => {
        throw new Error("getaddrinfo ENOTFOUND api.osv.dev");
      },
      fetchVuln: async () => {
        throw new Error("unreachable");
      },
    });
    assert.deepEqual(result.rows, []);
    assert.equal(result.degraded.length, 1);
    assert.match(result.degraded[0], /api\.osv\.dev/);
  } finally {
    cleanup(root);
  }
});

test("a detail read that fails is reported as degraded instead of silently clean", async () => {
  const root = toyRepo();
  try {
    const packages = collectResolved({ root });
    const osv = osvStub({ details: {} });
    const result = await collectAdvisories({ packages, fetchBatch: osv.fetchBatch, fetchVuln: osv.fetchVuln });
    assert.deepEqual(result.rows, []);
    assert.equal(result.degraded.length, 1);
    assert.match(result.degraded[0], /GHSA-beta-no-fix/);
  } finally {
    cleanup(root);
  }
});

/* ------------------------------------------------------- S7 (the report) */

const rowsOf = (result) => result.rows;

test("the report states the counts, the table and the report-only verdict", async () => {
  const root = toyRepo({
    manifestDeps: { beta: "8.10.2" },
    packages: { beta: ["beta@8.10.2", "", {}, "sha512-y"] },
  });
  try {
    const packages = collectResolved({ root });
    const osv = osvStub({ batch: { results: [{ vulns: [{ id: "GHSA-beta-high", modified: "x" }] }] } });
    const result = await collectAdvisories({ packages, fetchBatch: osv.fetchBatch, fetchVuln: osv.fetchVuln });
    const report = renderReport({ ...result, checked: packages.length });
    assert.match(report, /^DEPENDENCY ADVISORIES — 1 package resolved, 1 advisory, 1 blocking, 0 report-only$/mu);
    assert.match(report, /^\| package \| resolved \| fixed \| severity \| ladder \| impact \| advisory \|$/mu);
    assert.match(report, /^\| beta \| 8\.10\.2 \| 8\.12\.2 \| high \| CRITICAL \| blocking \| GHSA-beta-high \|$/mu);
    assert.match(report, /^VERDICT: REPORT-ONLY/mu);
    assert.match(report, /never fatal/u, "the verdict says why nothing fails");
    assert.equal(rowsOf(result).length, 1);
  } finally {
    cleanup(root);
  }
});

test("a clean tree prints the clean line and invents no row", async () => {
  const root = toyRepo();
  try {
    const packages = collectResolved({ root });
    const report = renderReport({
      rows: [],
      degraded: [],
      checked: packages.length,
    });
    assert.match(report, /^DEPENDENCY ADVISORIES — 2 packages resolved, 0 advisories$/mu);
    assert.match(report, /^no advisory affects the resolved tree$/mu);
    assert.match(report, /^VERDICT: REPORT-ONLY$/mu);
    assert.ok(!report.includes("| package |"), "no empty table");
  } finally {
    cleanup(root);
  }
});

test("a degraded report warns and still says REPORT-ONLY", () => {
  const report = renderReport({ rows: [], degraded: ["api.osv.dev unreachable"], checked: 0 });
  assert.match(report, /^::warning::api\.osv\.dev unreachable — advisory pass degraded, not failed$/mu);
  assert.match(report, /^VERDICT: REPORT-ONLY \(degraded\)$/mu);
});

/* ----------------------------------------------------------- S6 (the exit) */

const buffer = () => {
  const chunks = [];
  return { chunks, write: (text) => chunks.push(text), text: () => chunks.join("") };
};

test("run exits 0 with blocking rows present — the gate never reddens on an advisory", async () => {
  const root = toyRepo();
  try {
    const osv = osvStub({
      batch: { results: [{ vulns: [{ id: "GHSA-alpha-critical", modified: "x" }] }] },
      details: {
        "GHSA-alpha-critical": {
          ...alphaModerate,
          id: "GHSA-alpha-critical",
          database_specific: { severity: "CRITICAL" },
        },
      },
    });
    const out = buffer();
    const code = await run({ root, fetchBatch: osv.fetchBatch, fetchVuln: osv.fetchVuln, write: out.write });
    assert.equal(code, 0);
    assert.match(out.text(), /\| alpha \| 1\.2\.3 \| 1\.3\.0 \| critical \| BLOCKER \| blocking \| GHSA-alpha-critical \|/u);
    assert.match(out.text(), /^VERDICT: REPORT-ONLY/mu);
  } finally {
    cleanup(root);
  }
});

test("run exits 2 on a usage error and writes nothing to the report", async () => {
  const out = buffer();
  const err = buffer();
  const code = await run({
    argv: ["--bogus"],
    write: out.write,
    writeErr: err.write,
    fetchBatch: async () => ({ results: [] }),
    fetchVuln: async () => ({}),
  });
  assert.equal(code, 2);
  assert.match(err.text(), /unknown argument: --bogus/u);
  assert.equal(out.text(), "");
});

test("--json emits the machine view with the same decisions", async () => {
  const root = toyRepo({
    manifestDeps: { beta: "8.10.2" },
    packages: { beta: ["beta@8.10.2", "", {}, "sha512-y"] },
  });
  try {
    const osv = osvStub({ batch: { results: [{ vulns: [{ id: "GHSA-beta-high", modified: "x" }] }] } });
    const out = buffer();
    const code = await run({
      root,
      json: true,
      fetchBatch: osv.fetchBatch,
      fetchVuln: osv.fetchVuln,
      write: out.write,
    });
    assert.equal(code, 0);
    const payload = JSON.parse(out.text());
    assert.equal(payload.checked, 1);
    assert.deepEqual(payload.degraded, []);
    assert.equal(payload.rows[0].impact, "blocking");
    assert.equal(payload.rows[0].fixed, "8.12.2");
  } finally {
    cleanup(root);
  }
});

/* ------------------------------------------------- S5/S7 (the carriers) */

test("the review pack names the carrier, not a self-report", () => {
  const skill = fs.readFileSync(path.join(ROOT, "skills/review-security/SKILL.md"), "utf8");
  assert.match(skill, /dependency-advisory-pass\.mjs/u, "the checklist names the runnable pass");
  assert.match(skill, /adds or\s+updates/u, "the scope rule limits findings to the dependencies the change touches");
  assert.match(skill, /report-only/u, "the materiality rule is stated where the pass is invoked");
  assert.ok(!/bun\.lock|packages\/\*/u.test(skill), "the skill stays stack-agnostic: no lockfile or workspace layout");
});

test("the local gate runs the pass in the degraded-not-failed step", () => {
  // The remote workflow delegates to the local gate (owner decision 2026-11-04),
  // so the carrier of the step list is `scripts/local-gate.mjs`.
  const workflow = fs.readFileSync(path.join(ROOT, ".github/workflows/root-suite.yml"), "utf8");
  assert.match(workflow, /node scripts\/local-gate\.mjs/u, "the manual gate runs the local gate");

  const gate = fs.readFileSync(path.join(ROOT, "scripts/local-gate.mjs"), "utf8");
  const step = gate.slice(gate.indexOf(`id: "dependency-advisories"`));
  const block = step.slice(0, step.indexOf("},"));
  assert.match(block, /scripts\/dependency-advisory-pass\.mjs/u, "the registry step carries the advisory pass");
  assert.match(block, /report-only/iu, "the step says the pass cannot fail the gate");
  assert.match(block, /never fails/iu, "the degraded-not-failed contract is stated in the step");
  assert.match(block, /network: true/u, "the pass is the online half, so the pre-push subset skips it");
});
