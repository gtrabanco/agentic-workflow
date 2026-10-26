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
  collectPyPIDrift,
  driftMarker,
  installedVersion,
  planIssues,
  parsePypiLatest,
  pypiIssueFor,
  pypiLatest,
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
