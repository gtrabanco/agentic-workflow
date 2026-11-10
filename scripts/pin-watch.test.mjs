/**
 * pin-watch.test.mjs — offline suite for scripts/pin-watch.mjs (feature 67 P3,
 * AC2, obligation O3, issue #219 decision D1's addendum).
 *
 * The watch reports dependency-pin drift on a schedule; the scheduled report
 * may only report — upgrading a pin stays a deliberate human `fix(deps)` PR
 * (`docs/workflow/PACKAGES.md`, PE-005). The `--file-pr` half is the same
 * deliberate PR, executed on an explicit dispatch: every test here that edits
 * a manifest does it inside a `mkdtemp` fixture with an injected `git`/`gh`, so
 * nothing outside a temp dir is ever written.
 *
 * No network: the registry fetcher, the git runner and the gh runner are
 * injected everywhere, and the issue plan is a pure function over an
 * already-fetched open-issue list.
 *
 * Run: node --test scripts/pin-watch.test.mjs
 */

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  applyBumps,
  collectDrift,
  collectPyPIDrift,
  driftMarker,
  installedVersion,
  parseArgs,
  planBumps,
  planIssues,
  prFor,
  publishPr,
  parsePypiLatest,
  pypiIssueFor,
  pypiLatest,
  refreshLockfile,
  renderReport,
  watchedPackages,
  watchedPyPI,
} from "./pin-watch.mjs";

const PI = "@gtrabanco/pi-agentic-workflow";
const RUNNER = "@gtrabanco/agentic-workflow";

/** Two synthetic offline packages — the real manifest no longer carries the bridge pin (issue #321), which the shipped-wiring test below asserts. */
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

// #489: the watch cannot disagree with the gate — it decides exact pins with
// the gate's own evaluator. The gate's local half is a DIRECTION rule now (a pin
// ahead of the sibling's local version), because the unified train rewrites
// every local pin to one version and the pipeline cannot produce a lagging one.
test("drift: a pin on a local sibling that lags its package is not a finding — the gate rejects only a pin ahead of it", () => {
  const result = collectDrift({
    packages: [{ name: PI, dir: "packages/pi-agentic-workflow", dependencies: { [RUNNER]: "0.4.0" } }],
    fetchLatest: registry({ [RUNNER]: "0.4.0" }),
    localVersions: { [RUNNER]: "0.5.0" },
  });

  assert.equal(result.findings.length, 0, JSON.stringify(result.findings));
  assert.ok(result.notices.some((n) => /behind the local package version/u.test(n.message)), JSON.stringify(result.notices));
});

test("drift: a pin on a local sibling that runs ahead of it is a finding naming the local version, and the bump targets it", () => {
  const result = collectDrift({
    packages: [{ name: PI, dir: "packages/pi-agentic-workflow", dependencies: { [RUNNER]: "0.9.9" } }],
    fetchLatest: registry({ [RUNNER]: "0.4.0" }),
    localVersions: { [RUNNER]: "0.5.0" },
  });

  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].localVersion, "0.5.0");
  assert.match(
    renderReport(result),
    /0\.9\.9 → 0\.5\.0 \(local package version\)/u,
    "the report names the local version the pin should carry",
  );
  const plan = planBumps({ findings: result.findings });
  assert.deepEqual(
    plan.bumps.map((b) => `${b.dependency}:${b.from}->${b.to}`),
    [`${RUNNER}:0.9.9->0.5.0`],
    "the bump plan targets the local version, never a registry version the pin is already past",
  );
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
// partial pins (`7`, `7.0`) — a range the lock resolves and the registry moves
// inside, so "behind" means the lock fell out of date, not that a major exists
// ---------------------------------------------------------------------------

const partialPackage = (spec = "7") => [
  { name: PI, dir: "packages/pi-agentic-workflow", dependencies: { typescript: spec } },
];

test("partial pin: a lock behind the registry's newest in range is a finding naming both versions", () => {
  const result = collectDrift({
    packages: partialPackage("7"),
    fetchLatest: () => "7.0.2",
    fetchVersions: () => ["6.0.3", "7.0.0", "7.0.2", "7.1.0"],
    resolveVersion: () => "7.0.2",
  });

  assert.equal(result.findings.length, 1);
  const [finding] = result.findings;
  assert.equal(finding.kind, "partial");
  assert.equal(finding.pin, "7");
  assert.equal(finding.resolved, "7.0.2");
  assert.equal(finding.latest, "7.1.0", "the newest release INSIDE the pin's range, not the registry's latest");
  assert.match(renderReport(result), /7\.0\.2 → 7\.1\.0 \(inside the partial pin `7`/u);
  assert.match(planIssues({ findings: result.findings, openIssues: [] }).open[0].body, /partial pin \*\*7\*\*[\s\S]*7\.0\.2[\s\S]*7\.1\.0/u);
});

test("partial pin: the current lock is clean, and the watch says so instead of skipping", () => {
  const result = collectDrift({
    packages: partialPackage("7"),
    fetchLatest: () => "7.0.2",
    fetchVersions: () => ["7.0.0", "7.0.2"],
    resolveVersion: () => "7.0.2",
  });

  assert.equal(result.findings.length, 0);
  assert.equal(result.checked, 1, "a partial pin is checked, not skipped");
  assert.ok(result.notices.some((n) => /partial pin "7" is current \(lock 7\.0\.2/u.test(n.message)));
});

test("partial pin: a newer major outside the range is a notice, never drift", () => {
  const result = collectDrift({
    packages: partialPackage("6"),
    fetchLatest: () => "7.0.2",
    fetchVersions: () => ["6.0.3", "7.0.2"],
    resolveVersion: () => "6.0.3",
  });

  assert.equal(result.findings.length, 0, "taking a new major is an owner decision, not drift");
  assert.ok(
    result.notices.some((n) => /7\.0\.2 is published outside the partial pin "6"/u.test(n.message)),
    JSON.stringify(result.notices),
  );
  assert.equal(result.checked, 1);
});

test("partial pin: no resolved version in the lock is a notice — the watch cannot tell, so it does not pass", () => {
  const result = collectDrift({
    packages: partialPackage("7"),
    fetchLatest: () => "7.0.2",
    fetchVersions: () => ["7.0.2"],
    resolveVersion: () => null,
  });

  assert.equal(result.findings.length, 0);
  assert.ok(result.notices.some((n) => /lock carries no resolved version/u.test(n.message)));
});

test("partial pin: an unreachable registry degrades the entry, never fails it", () => {
  const result = collectDrift({
    packages: partialPackage("7"),
    fetchLatest: () => "7.0.2",
    fetchVersions: () => {
      throw new Error("ECONNREFUSED");
    },
    resolveVersion: () => "7.0.2",
  });

  assert.equal(result.findings.length, 0, "a network blip must not redden a scheduled run");
  assert.equal(result.degraded.length, 1);
});

test("a floating spec is never drift, and the report still names it", () => {
  const result = collectDrift({
    packages: [{ name: RUNNER, dir: "packages/agentic-workflow", dependencies: { typebox: "^1.4.3" } }],
    fetchLatest: () => "1.4.3",
    fetchVersions: () => ["1.4.3"],
    resolveVersion: () => "1.4.3",
  });

  assert.equal(result.findings.length, 0, "a range is not a pin, so it cannot drift");
  assert.equal(result.skipped.length, 1, "it is reported as skipped, with its reason");
  assert.match(renderReport(result), /notice: .*typebox: "\^1\.4\.3" is not an exact pin/u);
});

test("the watch covers development pins, not just runtime ones", () => {
  const root = mkdtempSync(path.join(tmpdir(), "pin-watch-census-"));
  try {
    const manifest = (name, body) => {
      mkdirSync(path.join(root, "packages", name), { recursive: true });
      writeFileSync(path.join(root, "packages", name, "package.json"), JSON.stringify({ name, version: "1.0.0", ...body }, null, 2));
    };
    manifest("a", { dependencies: { runtime: "1.0.0" }, devDependencies: { compiler: "7" }, peerDependencies: { host: "*" } });
    manifest("b", {});
    const [pkgA] = watchedPackages({ root });
    assert.deepEqual(Object.keys(pkgA.dependencies).sort(), ["compiler", "runtime"], "the compiler is a devDependency and must be watched");
    assert.ok(!("host" in pkgA.dependencies), "peer ranges resolve against the host, not here");
    assert.equal(watchedPackages({ root }).length, 2, "a new package is watched by existing");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a nightly outside the partial pin is not the news the report carries", () => {
  const result = collectDrift({
    packages: partialPackage("6"),
    fetchLatest: () => "7.0.2",
    fetchVersions: () => ["6.0.3", "7.0.2", "7.1.0-dev.20261030.1"],
    resolveVersion: () => "6.0.3",
  });

  assert.equal(result.findings.length, 0);
  const outside = result.notices.find((n) => /outside the partial pin/u.test(n.message));
  assert.match(outside.message, /7\.0\.2 is published outside/u, "the stable release, not the nightly");
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

test("the workflow wires the pr mode with the write it needs and a commit identity", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");

  assert.match(workflow, /pin-watch\.mjs\s+--file-pr/u, "the bump PR path is dispatched, never wired to the cron");
  assert.match(workflow, /^\s*contents:\s*write\s*(?:#.*)?$/mu, "pushing the bump commit and its lock refresh needs contents: write");
  assert.match(workflow, /git config user\.name /u, "actions/checkout configures no commit identity — the bump commit needs one");
  assert.match(workflow, /MODE=\$\{\{ inputs\.mode \|\| 'issues' \}\}/u, "the schedule and the default dispatch run the issues mode — bumping is dispatch-only (PE-005)");
});

test("the watch discovers the shipped packages and their exact pins", () => {
  const packages = watchedPackages();

  assert.ok(packages.length >= 2, `expected both shipped packages, found ${packages.length}`);
  const names = packages.map((pkg) => pkg.name);
  assert.ok(names.includes("@gtrabanco/pi-agentic-workflow"), `missing the Pi package in ${names.join(", ")}`);
  assert.ok(names.includes("@gtrabanco/agentic-workflow"), `missing the runner in ${names.join(", ")}`);

  // Issue #321: the bridge pin is gone. The watch must not resurrect it — and
  // if it ever reappears in the manifest, that IS drift worth reporting.
  const pi = packages.find((pkg) => pkg.name === "@gtrabanco/pi-agentic-workflow");
  assert.ok(!("@bacnh85/pi-serena" in pi.dependencies), "the bridge pin is removed (issue #321) and must stay gone");
});

// ---------------------------------------------------------------------------
// the PyPI half (issue #321 S5: "Extend `pin-watch` to check `serena-agent` on
// PyPI (installed vs latest) and file a drift issue — never a silent upgrade")
// ---------------------------------------------------------------------------

test("the PyPI watch lists serena-agent (issue #321)", () => {
  const entries = watchedPyPI();
  assert.ok(entries.some((entry) => entry.name === "serena-agent"), `serena-agent is not watched, got ${JSON.stringify(entries)}`);
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

// ---------------------------------------------------------------------------
// PyPI drift (issue #321): installed vs latest, with both sides injected so
// no test touches the system pip or the network.
// ---------------------------------------------------------------------------

/** A pypi stub: `versions` maps a package name to its published latest. */
function pypiRegistry(versions) {
  return (name) => {
    if (!(name in versions)) throw new Error(`404 ${name} not found on PyPI`);
    return versions[name];
  };
}

test("pypi drift: an installed version behind PyPI is a finding naming both versions", () => {
  const result = collectPyPIDrift({
    packages: watchedPyPI(),
    fetchLatest: pypiRegistry({ "serena-agent": "2.1.0" }),
    readInstalled: () => "1.7.0",
  });

  assert.equal(result.findings.length, 1);
  const [finding] = result.findings;
  assert.equal(finding.name, "serena-agent");
  assert.equal(finding.installed, "1.7.0");
  assert.equal(finding.latest, "2.1.0");
  assert.equal(finding.registry, "pypi.org");
  assert.equal(result.ok, false, "a drift fails the run");
});

test("pypi clean: installed equal to latest is no drift", () => {
  const result = collectPyPIDrift({
    packages: watchedPyPI(),
    fetchLatest: pypiRegistry({ "serena-agent": "2.1.0" }),
    readInstalled: () => "2.1.0",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
  assert.equal(result.checked, 1);
  assert.match(renderReport(result), /no drift/u);
});

test("pypi clean: an installed version ahead of PyPI (local build) is not drift", () => {
  const result = collectPyPIDrift({
    packages: watchedPyPI(),
    fetchLatest: pypiRegistry({ "serena-agent": "2.1.0" }),
    readInstalled: () => "2.2.0",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("pypi degraded: an unreachable PyPI never fails and never reads as drift", () => {
  const result = collectPyPIDrift({
    packages: watchedPyPI(),
    fetchLatest: () => {
      throw new Error("ECONNREFUSED pypi.org");
    },
    readInstalled: () => "1.7.0",
  });

  assert.equal(result.ok, true, "a network blip must not redden a scheduled run");
  assert.deepEqual(result.findings, []);
  assert.equal(result.degraded.length, 1);
  assert.match(renderReport(result), /degraded/u);
});

test("pypi skipped: a package not installed on the machine is skipped, never degraded", () => {
  const result = collectPyPIDrift({
    packages: watchedPyPI(),
    fetchLatest: pypiRegistry({ "serena-agent": "2.1.0" }),
    readInstalled: () => null,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
  assert.equal(result.degraded.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.match(result.skipped[0].message, /not installed/u);
});

test("pypi issue: the filed issue names the installed and published versions", () => {
  const issue = pypiIssueFor({ name: "serena-agent", registry: "pypi.org", installed: "1.7.0", latest: "2.1.0" });

  assert.match(issue.title, /serena-agent/u);
  assert.match(issue.title, /PyPI/u);
  assert.match(issue.body, /1\.7\.0/u, "the body names the installed version");
  assert.match(issue.body, /2\.1\.0/u, "the body names the published version");
  assert.doesNotMatch(JSON.stringify(issue), /uv tool upgrade [^\n]*automat/u, "the issue proposes a manual step, never a silent upgrade");
});

// ---------------------------------------------------------------------------
// installed-version detection (external-verify correction batch: `pip show`
// never sees the `uv tool install` route this repo documents — the uv-tool
// venv is isolated from pip, and the pip binary may not exist at all)
// ---------------------------------------------------------------------------

/** A probe stub keyed by "<bin> <args...>" → stdout; a miss reads as absent/failed (null). */
function probeStub(map) {
  return (bin, args) => {
    const key = `${bin} ${args.join(" ")}`;
    return key in map ? map[key] : null;
  };
}

test("installed-version: the tool's own binary answers first and the chain stops there", () => {
  const calls = [];
  const version = installedVersion(
    { name: "serena-agent", binary: "serena" },
    { probe: (bin, args) => { calls.push(`${bin} ${args.join(" ")}`); return "Serena 2.1.0\n"; } },
  );

  assert.equal(version, "2.1.0");
  assert.deepEqual(calls, ["serena --version"], "once a source answers, uv/pip are not consulted");
});

test("installed-version: `uv tool list` answers when the binary is absent", () => {
  const version = installedVersion(
    { name: "serena-agent", binary: "serena" },
    { probe: probeStub({ "uv tool list": "serena-agent v1.7.0\n- serena\n- serena-agent\n" }) },
  );

  assert.equal(version, "1.7.0");
});

test("installed-version: `pip show` is the last fallback", () => {
  const version = installedVersion(
    { name: "serena-agent", binary: "serena" },
    { probe: probeStub({ "pip show serena-agent": "Name: serena-agent\nVersion: 1.7.0\n" }) },
  );

  assert.equal(version, "1.7.0");
});

test("installed-version: a machine with none of the sources reports not installed", () => {
  const version = installedVersion(
    { name: "serena-agent", binary: "serena" },
    { probe: () => null },
  );

  assert.equal(version, null);
});

test("blocker pin: a uv-tool install is detected and drifts against PyPI — never `not installed`", () => {
  // The shape of the machine this blocker reproduced on: no pip binary, uv
  // manages serena-agent, `serena --version` answers. A stale install must
  // produce the drift finding; the pip-only detector reported
  // `not installed on this machine` here with a PASS verdict.
  const result = collectPyPIDrift({
    packages: watchedPyPI(),
    fetchLatest: pypiRegistry({ "serena-agent": "2.1.0" }),
    readInstalled: (entry) =>
      installedVersion(entry, {
        probe: probeStub({
          "serena --version": "Serena 1.7.0\n",
          "uv tool list": "serena-agent v1.7.0\n- serena\n",
        }),
      }),
  });

  assert.equal(result.findings.length, 1, "a stale uv-tool install is drift");
  assert.equal(result.findings[0].installed, "1.7.0");
  assert.equal(result.findings[0].latest, "2.1.0");
  assert.deepEqual(result.skipped, [], "an installed package is never reported not-installed");
});

test("the watched entry carries the tool binary (`serena` for serena-agent)", () => {
  const [entry] = watchedPyPI();
  assert.equal(entry.binary, "serena");
});

test("regression: a PyPI skipped entry prints its name, never `undefined` (differential pin)", () => {
  const npm = collectDrift({ packages: packages(), fetchLatest: registry({ typebox: "1.3.7" }) });
  const pypi = collectPyPIDrift({
    packages: watchedPyPI(),
    fetchLatest: pypiRegistry({ "serena-agent": "2.1.0" }),
    readInstalled: () => null,
  });
  const report = renderReport({
    ok: true,
    findings: [],
    degraded: [],
    skipped: [...npm.skipped, ...pypi.skipped],
    checked: npm.checked + pypi.checked,
  });
  assert.doesNotMatch(report, /undefined/u, "no skipped entry may render as `undefined:`");
  assert.match(report, /serena-agent: not installed on this machine/u);
});

test("pypi json payload: the API's info.version parses; junk and empty degrade to null", () => {
  assert.equal(parsePypiLatest('{"info":{"version":"2.1.0"}}'), "2.1.0");
  assert.equal(parsePypiLatest('{"info":{}}'), null, "no version field is not a version");
  assert.equal(parsePypiLatest("not json"), null, "a non-JSON body is not a version");
});

// ---------------------------------------------------------------------------
// the `--file-pr` half: the deliberate bump PR, executed on an explicit
// dispatch. The bumps are planned from already-collected findings, applied to
// manifests with their own shape, and published as ONE PR through injected
// `git`/`gh` runners — offline like every other case in this suite.
// ---------------------------------------------------------------------------

const PR_FINDINGS = [
  // Exact pin behind the registry: the bumpable case.
  { package: PI, dir: "packages/pi-agentic-workflow", dependency: "left-pad", pin: "1.3.0", latest: "1.3.1" },
  // Pin ahead of its local sibling (#489): the bump target is the local version — the only one that exists.
  { package: RUNNER, dir: "packages/agentic-workflow", dependency: "chalk", pin: "5.0.0", localVersion: "5.1.0" },
  // Partial pin: the fix is a lock refresh (`bun install`), not a spec edit.
  { package: PI, dir: "packages/pi-agentic-workflow", dependency: "zod", pin: "7", resolved: "7.0.0", latest: "7.1.0", kind: "partial" },
  // PyPI drift: an installed tool, addressable only by the operator's installer.
  { name: "serena-agent", registry: "pypi.org", installed: "2.0.0", latest: "2.1.0" },
];

test("parseArgs reads three modes, refuses --file-pr beside --file-issues, and keeps the unknown/usage contract", () => {
  assert.equal(parseArgs(["node", "scripts/pin-watch.mjs"]).mode, "check");
  assert.equal(parseArgs(["node", "scripts/pin-watch.mjs", "--check"]).mode, "check");
  assert.equal(parseArgs(["node", "scripts/pin-watch.mjs", "--file-issues"]).mode, "issues");
  assert.equal(parseArgs(["node", "scripts/pin-watch.mjs", "--file-pr"]).mode, "pr");
  assert.equal(parseArgs(["node", "scripts/pin-watch.mjs", "--repo", "o/r"]).repo, "o/r");
  assert.equal(parseArgs(["node", "scripts/pin-watch.mjs"]).repo, "gtrabanco/agentic-workflow");

  const conflict = parseArgs(["node", "scripts/pin-watch.mjs", "--file-issues", "--file-pr"]);
  assert.match(conflict.error, /--file-issues and --file-pr/u, "both filing modes at once is a usage error, never a silent preference");
  assert.equal(conflict.exit, 2);
  const unknown = parseArgs(["node", "scripts/pin-watch.mjs", "--nonsense"]);
  assert.deepEqual(unknown.unknown, ["--nonsense"]);
  const positional = parseArgs(["node", "scripts/pin-watch.mjs", "--repo", "o/r", "--stray"]);
  assert.deepEqual(positional.unknown, ["--stray"], "the value of --repo is never mistaken for an unknown flag");
});

test("planBumps turns exact-pin findings into manifest bumps and everything else into body notes", () => {
  const { bumps, notes } = planBumps({ findings: PR_FINDINGS });

  assert.deepEqual(bumps, [
    { package: PI, dir: "packages/pi-agentic-workflow", dependency: "left-pad", from: "1.3.0", to: "1.3.1" },
    { package: RUNNER, dir: "packages/agentic-workflow", dependency: "chalk", from: "5.0.0", to: "5.1.0" },
  ]);
  assert.equal(notes.length, 2, "the partial pin and the PyPI drift are carried, never dropped");
  assert.match(notes[0], /zod/u);
  assert.match(notes[0], /bun install/u, "a partial pin's fix is the lock refresh, which this PR does not invent");
  assert.match(notes[1], /serena-agent/u);
  assert.match(notes[1], /uv tool upgrade/u, "a PyPI drift names its installer, not a manifest edit");
});

test("applyBumps rewrites only the drifted field, in the manifest's own shape, at the named dir", () => {
  const root = mkdtempSync(path.join(tmpdir(), "pin-watch-pr-"));
  try {
    const dir = path.join(root, "packages", "demo");
    mkdirSync(dir, { recursive: true });
    const original = `${JSON.stringify(
      { name: "demo", version: "1.0.0", dependencies: { kept: "2.0.0" }, devDependencies: { stale: "1.0.0" } },
      null,
      2,
    )}\n`;
    writeFileSync(path.join(dir, "package.json"), original);

    const changed = applyBumps({
      root,
      bumps: [{ package: "demo", dir: "packages/demo", dependency: "stale", from: "1.0.0", to: "1.2.0" }],
    });

    assert.deepEqual(changed, ["packages/demo/package.json"]);
    const text = readFileSync(path.join(dir, "package.json"), "utf8");
    assert.match(text, /"stale": "1\.2\.0"/u, "the drift is bumped where it was pinned");
    assert.match(text, /"kept": "2\.0\.0"/u, "a sibling pin is untouched");
    assert.match(text, /"version": "1\.0\.0"/u, "the package version is never bumped by the watch — that is the release train's decision");
    assert.ok(text.endsWith("}\n"), "the manifest keeps its trailing newline");
    assert.equal(text, original.replace('"stale": "1.0.0"', '"stale": "1.2.0"'), "the rewrite touches exactly the one spec value");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("applyBumps refuses a bump whose manifest no longer carries the dependency, before any write", () => {
  const root = mkdtempSync(path.join(tmpdir(), "pin-watch-pr-"));
  try {
    const dir = path.join(root, "packages", "demo");
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "package.json"), '{"name":"demo","dependencies":{}}\n');
    assert.throws(
      () => applyBumps({ root, bumps: [{ package: "demo", dir: "packages/demo", dependency: "gone", from: "1.0.0", to: "1.1.0" }] }),
      /no longer carries/u,
      "stale drift is a fail-closed usage error, not a silent no-op",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("prFor is one PR: it names every bump from → to and carries the non-bumpable drift as notes", () => {
  const { bumps, notes } = planBumps({ findings: PR_FINDINGS });
  const { title, body } = prFor({ bumps, notes, repo: "o/r" });

  assert.match(title, /^fix\(deps\): /u, "the PR is a dependency fix commit, conventionally named");
  assert.match(body, /left-pad`: 1\.3\.0 → 1\.3\.1/u);
  assert.match(body, /chalk`: 5\.0\.0 → 5\.1\.0/u);
  assert.match(body, /zod/u, "the partial-pin note lands in the body");
  assert.match(body, /serena-agent/u, "the PyPI note lands in the body");
  assert.match(body, /Automated writed using a AI/u, "a body published on GitHub carries the required sign");
});

test("prFor with no bumps opens nothing — an empty PR is never the answer", () => {
  const { title, body } = prFor({ bumps: [], notes: [], repo: "o/r" });
  assert.equal(title, null, "no bumps, no title — the caller must not open a PR");
  assert.equal(body, null);
});

test("publishPr adds exactly the changed files, commits, pushes and opens one PR through gh", () => {
  const calls = [];
  const git = (args) => {
    calls.push(["git", ...args]);
    return { status: 0, stdout: "", stderr: "" };
  };
  const gh = (args) => {
    calls.push(["gh", ...args]);
    return { status: 0, stdout: "https://github.com/o/r/pull/9\n", stderr: "" };
  };

  const url = publishPr({
    repo: "o/r",
    title: "fix(deps): bump drifted pins",
    body: "body",
    changes: ["packages/demo/package.json", "bun.lock"],
    branch: "fix/deps-pin-bump-test",
    git,
    gh,
  });

  assert.equal(url, "https://github.com/o/r/pull/9");
  assert.deepEqual(
    calls.map(([bin, ...args]) => `${bin} ${args.join(" ")}`),
    [
      "git checkout -b fix/deps-pin-bump-test",
      "git add packages/demo/package.json bun.lock",
      "git commit -m fix(deps): bump drifted pins",
      "git push -u origin fix/deps-pin-bump-test",
      "gh pr create --repo o/r --base main --title fix(deps): bump drifted pins --body body",
    ],
    "one branch, one commit, one push, one PR — in that order",
  );
});

test("publishPr fails closed on a git failure, carrying the stderr — the run reddens instead of shipping half a PR", () => {
  const git = (args) =>
    args[0] === "commit" ? { status: 1, stdout: "", stderr: "nothing to commit\n" } : { status: 0, stdout: "", stderr: "" };
  const gh = () => {
    throw new Error("gh must not run after a failed commit");
  };

  assert.throws(
    () =>
      publishPr({
        repo: "o/r",
        title: "t",
        body: "b",
        changes: ["packages/demo/package.json"],
        branch: "br",
        git,
        gh,
      }),
    /nothing to commit/u,
  );
});

test("refreshLockfile regenerates the lock without installing, and a failure is reported, never thrown", () => {
  const ok = refreshLockfile({ runner: () => ({ status: 0, stdout: "", stderr: "" }) });
  assert.deepEqual(ok, { ok: true });

  const failed = refreshLockfile({ runner: () => ({ status: 1, stdout: "", stderr: "error: lockfile had changes\n" }) });
  assert.equal(failed.ok, false);
  assert.match(failed.message, /lockfile had changes/u);
});
