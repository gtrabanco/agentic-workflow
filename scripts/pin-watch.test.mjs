/**
 * pin-watch.test.mjs — offline suite for scripts/pin-watch.mjs (feature 67 P3,
 * AC2, obligation O3, issue #219 decision D1's addendum).
 *
 * The watch reports dependency-pin drift on a schedule. It may only report:
 * upgrading a pin stays a deliberate human `fix(deps)` PR (AGENTS.md →
 * Packages, PE-005), so nothing here writes a manifest.
 *
 * No network: the registry fetcher is injected everywhere, and the issue plan
 * is a pure function over an already-fetched open-issue list.
 *
 * Run: node --test scripts/pin-watch.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  collectDrift,
  driftMarker,
  planIssues,
  renderReport,
  watchedPackages,
} from "./pin-watch.mjs";

const PI = "@gtrabanco/pi-agentic-workflow";
const RUNNER = "@gtrabanco/agentic-workflow";

/** Two packages, exactly as `--check` discovers them. */
function packages(overrides = {}) {
  return [
    {
      name: PI,
      dir: "packages/pi-agentic-workflow",
      dependencies: overrides[PI] ?? { "@bacnh85/pi-serena": "0.10.0" },
    },
    {
      name: RUNNER,
      dir: "packages/agentic-workflow",
      dependencies: overrides[RUNNER] ?? { typebox: "1.3.7" },
    },
  ];
}

/** A registry stub: `versions` maps a package name to its published latest. */
function registry(versions) {
  return (name) => {
    if (!(name in versions)) throw new Error(`404 ${name} not found`);
    return versions[name];
  };
}

// ---------------------------------------------------------------------------
// drift
// ---------------------------------------------------------------------------

test("drift: a published version above the pin is a finding naming both versions", () => {
  const result = collectDrift({
    packages: packages(),
    fetchLatest: registry({ "@bacnh85/pi-serena": "0.11.0", typebox: "1.3.7" }),
  });

  assert.equal(result.findings.length, 1);
  const [finding] = result.findings;
  assert.equal(finding.package, PI);
  assert.equal(finding.dependency, "@bacnh85/pi-serena");
  assert.equal(finding.pin, "0.10.0");
  assert.equal(finding.latest, "0.11.0");
  assert.equal(result.ok, false, "a drift fails the run");
});

test("drift: every package that declares exact pins is watched, not just the first", () => {
  const result = collectDrift({
    packages: packages(),
    fetchLatest: registry({ "@bacnh85/pi-serena": "0.10.0", typebox: "1.4.0" }),
  });

  assert.deepEqual(
    result.findings.map((finding) => `${finding.package}:${finding.dependency}`),
    [`${RUNNER}:typebox`],
    "the runner package's pin drifts too — the watch loops every package dir (PE-012 / A4)",
  );
});

test("drift: several findings in one package are all reported", () => {
  const result = collectDrift({
    packages: [
      {
        name: PI,
        dir: "packages/pi-agentic-workflow",
        dependencies: {
          "@bacnh85/pi-serena": "0.10.0",
          "@gtrabanco/agentic-workflow": "0.2.0",
          "@gtrabanco/agentic-workflow-schema": "4.6.0",
        },
      },
    ],
    fetchLatest: registry({
      "@bacnh85/pi-serena": "0.11.0",
      "@gtrabanco/agentic-workflow": "0.2.0",
      "@gtrabanco/agentic-workflow-schema": "4.7.0",
    }),
  });

  assert.deepEqual(
    result.findings.map((finding) => finding.dependency).sort(),
    ["@bacnh85/pi-serena", "@gtrabanco/agentic-workflow-schema"],
  );
});

// ---------------------------------------------------------------------------
// clean
// ---------------------------------------------------------------------------

test("clean: registry equal to every pin is no drift", () => {
  const result = collectDrift({
    packages: packages(),
    fetchLatest: registry({ "@bacnh85/pi-serena": "0.10.0", typebox: "1.3.7" }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
  assert.match(renderReport(result), /no drift/u);
});

test("clean: a registry behind the pin (an unpublished rollback) is not drift", () => {
  const result = collectDrift({
    packages: packages(),
    fetchLatest: registry({ "@bacnh85/pi-serena": "0.9.0", typebox: "1.3.7" }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("clean: a non-exact spec is skipped with its reason, never treated as drift", () => {
  const result = collectDrift({
    packages: [{ name: PI, dir: "packages/pi-agentic-workflow", dependencies: { typebox: "^1.3.7" } }],
    fetchLatest: registry({ typebox: "9.9.9" }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
  assert.equal(result.skipped.length, 1);
  assert.match(result.skipped[0].message, /not an exact pin/u);
});

// ---------------------------------------------------------------------------
// degraded
// ---------------------------------------------------------------------------

test("degraded: an unreachable registry never fails and never reads as drift", () => {
  const result = collectDrift({
    packages: packages(),
    fetchLatest: () => {
      throw new Error("ECONNREFUSED registry.npmjs.org");
    },
  });

  assert.equal(result.ok, true, "a network blip must not redden a scheduled run");
  assert.deepEqual(result.findings, []);
  assert.equal(result.degraded.length, 2);
  for (const entry of result.degraded) assert.match(entry.message, /registry unreachable/u);
  assert.match(renderReport(result), /degraded/u);
});

test("degraded: one unreachable dependency does not hide another's drift", () => {
  const result = collectDrift({
    packages: packages(),
    fetchLatest: (name) => {
      if (name === "typebox") throw new Error("timeout");
      return "0.11.0";
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.findings.length, 1);
  assert.equal(result.degraded.length, 1);
});

// ---------------------------------------------------------------------------
// issue planning (dedupe)
// ---------------------------------------------------------------------------

/** The marker an open issue's title carries, so a second run recognises it. */
test("the marker is stable and names the package and the dependency", () => {
  assert.equal(driftMarker(PI, "@bacnh85/pi-serena"), `${PI}/@bacnh85/pi-serena`);
  assert.equal(driftMarker(PI, "@bacnh85/pi-serena"), driftMarker(PI, "@bacnh85/pi-serena"));
});

test("dedupe: a drift with no matching open issue is opened once", () => {
  const findings = collectDrift({
    packages: packages(),
    fetchLatest: registry({ "@bacnh85/pi-serena": "0.11.0", typebox: "1.3.7" }),
  }).findings;

  const plan = planIssues({ findings, openIssues: [] });
  assert.equal(plan.open.length, 1);
  assert.deepEqual(plan.reuse, []);
  assert.match(plan.open[0].title, new RegExp(driftMarker(PI, "@bacnh85/pi-serena").replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")));
  assert.match(plan.open[0].body, /0\.10\.0/u, "the body names the pinned version");
  assert.match(plan.open[0].body, /0\.11\.0/u, "the body names the published version");
});

test("dedupe: an already-open issue is reused, never opened twice", () => {
  const findings = collectDrift({
    packages: packages(),
    fetchLatest: registry({ "@bacnh85/pi-serena": "0.11.0", typebox: "1.3.7" }),
  }).findings;

  const openIssues = [
    { number: 41, title: `chore(deps): pin drift in ${driftMarker(PI, "@bacnh85/pi-serena")}` },
    { number: 12, title: "unrelated: fix the docs" },
  ];
  const plan = planIssues({ findings, openIssues });

  assert.deepEqual(plan.open, []);
  assert.equal(plan.reuse.length, 1);
  assert.equal(plan.reuse[0].issue.number, 41);
  assert.equal(plan.reuse[0].finding.dependency, "@bacnh85/pi-serena");
});

test("dedupe: a new drift for a dependency whose issue is already open is reused too", () => {
  // The published version moved again (0.11.0 → 0.12.0): same dependency, same
  // open issue — the operator is already tracking it, so a second issue would
  // be noise.
  const findings = collectDrift({
    packages: packages(),
    fetchLatest: registry({ "@bacnh85/pi-serena": "0.12.0", typebox: "1.3.7" }),
  }).findings;

  const openIssues = [{ number: 41, title: `chore(deps): pin drift in ${driftMarker(PI, "@bacnh85/pi-serena")}` }];
  const plan = planIssues({ findings, openIssues });

  assert.deepEqual(plan.open, []);
  assert.equal(plan.reuse[0].issue.number, 41);
  assert.equal(plan.reuse[0].finding.latest, "0.12.0");
});

test("dedupe: findings for different dependencies map to their own issues", () => {
  const findings = collectDrift({
    packages: packages(),
    fetchLatest: registry({ "@bacnh85/pi-serena": "0.11.0", typebox: "1.4.0" }),
  }).findings;

  const plan = planIssues({
    findings,
    openIssues: [{ number: 41, title: `chore(deps): pin drift in ${driftMarker(PI, "@bacnh85/pi-serena")}` }],
  });

  assert.equal(plan.reuse.length, 1);
  assert.equal(plan.open.length, 1);
  assert.match(plan.open[0].title, /typebox/u);
});

test("dedupe: the plan never mutates a manifest — it is issues only", () => {
  const findings = collectDrift({
    packages: packages(),
    fetchLatest: registry({ "@bacnh85/pi-serena": "0.11.0", typebox: "1.4.0" }),
  }).findings;
  const plan = planIssues({ findings, openIssues: [] });

  assert.deepEqual(Object.keys(plan).sort(), ["open", "reuse"]);
  for (const entry of plan.open) assert.deepEqual(Object.keys(entry).sort(), ["body", "dependency", "latest", "package", "pin", "title"]);
  assert.doesNotMatch(JSON.stringify(plan), /"version"\s*:/u, "no package.json payload — the watch reports, it never bumps (PE-005)");
});

// ---------------------------------------------------------------------------
// the report
// ---------------------------------------------------------------------------

test("the report names every drift, its pin and its published version", () => {
  const result = collectDrift({
    packages: packages(),
    fetchLatest: registry({ "@bacnh85/pi-serena": "0.11.0", typebox: "1.4.0" }),
  });
  const report = renderReport(result);

  assert.match(report, /PIN-WATCH/u);
  assert.match(report, new RegExp(PI.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")));
  assert.match(report, /@bacnh85\/pi-serena 0\.10\.0 → 0\.11\.0/u);
  assert.match(report, /typebox 1\.3\.7 → 1\.4\.0/u);
  assert.match(report, /VERDICT: DRIFT/u);
});

test("the report says no drift in the clean case and degrades visibly otherwise", () => {
  const clean = collectDrift({
    packages: packages(),
    fetchLatest: registry({ "@bacnh85/pi-serena": "0.10.0", typebox: "1.3.7" }),
  });
  assert.match(renderReport(clean), /VERDICT: PASS/u);
  assert.match(renderReport(clean), /no drift/u);

  const degraded = collectDrift({ packages: packages(), fetchLatest: () => { throw new Error("offline"); } });
  assert.match(renderReport(degraded), /degraded/u);
  assert.match(renderReport(degraded), /VERDICT: PASS \(degraded\)/u);
});

// ---------------------------------------------------------------------------
// the shipped wiring (AC2: "FAIL if the schedule or the issue-creation path is
// missing") — read from the committed files, so a dropped cron or a step that
// stops filing is a red suite rather than a silent gap
// ---------------------------------------------------------------------------

const WORKFLOW = new URL("../.github/workflows/pin-watch.yml", import.meta.url);

test("the workflow runs on a weekly schedule and by hand", async () => {
  const workflow = readFileSync(WORKFLOW, "utf8");

  assert.match(workflow, /^\s*schedule:/mu, "no schedule — nothing would ever run the watch");
  const cron = /^\s*- cron:\s*["']?([^"'\n]+?)["']?\s*$/mu.exec(workflow);
  assert.ok(cron, "the schedule carries no cron expression");
  assert.equal(
    cron[1].split(" ").length,
    5,
    `"${cron[1]}" is not a 5-field cron expression`,
  );
  assert.match(workflow, /^\s*workflow_dispatch:\s*(\{\s*\})?\s*$/mu, "not runnable by hand");
});

test("the workflow may write issues and runs the filing path", async () => {
  const workflow = readFileSync(WORKFLOW, "utf8");

  assert.match(workflow, /^\s*issues:\s*write\s*(?:#.*)?$/mu, "without issues: write the job cannot open the tracking issue");
  assert.match(workflow, /pin-watch\.mjs\s+--file-issues/u, "the job never runs the issue-creation path");
  assert.match(workflow, /GH_TOKEN:/u, "gh needs a token in the step's environment");
});

test("the watch discovers the shipped packages and their exact pins", () => {
  const packages = watchedPackages();

  assert.ok(packages.length >= 2, `expected both shipped packages, found ${packages.length}`);
  const names = packages.map((pkg) => pkg.name);
  assert.ok(names.includes("@gtrabanco/pi-agentic-workflow"), `missing the Pi package in ${names.join(", ")}`);
  assert.ok(names.includes("@gtrabanco/agentic-workflow"), `missing the runner in ${names.join(", ")}`);

  // The Pi package's Serena pin is the one this unit added (P1): the watch must
  // see it, or a stale Serena toolset would never be reported.
  const pi = packages.find((pkg) => pkg.name === "@gtrabanco/pi-agentic-workflow");
  assert.ok("@bacnh85/pi-serena" in pi.dependencies, "the Serena pin is not watched");
});

test("the watch's report never proposes a bump — the fix is always a human PR", () => {
  const result = collectDrift({
    packages: packages(),
    fetchLatest: registry({ "@bacnh85/pi-serena": "0.11.0", typebox: "1.3.7" }),
  });
  const report = renderReport(result);

  assert.match(report, /fix\(deps\)/u);
  assert.doesNotMatch(report, /bumped|upgraded to|applied/u, "the watch reports; the upgrade is a deliberate PR (PE-005)");
});
