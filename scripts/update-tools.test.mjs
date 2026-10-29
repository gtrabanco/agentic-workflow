/**
 * update-tools.test.mjs — the offline suite for scripts/update-tools.mjs
 * (issue #331, unit fix/331-authoring-setup, S3).
 *
 * The rules under test: upgrade commands are exactly the documented ones,
 * --dry-run mutates nothing while reporting current vs latest for both tools,
 * and the detection/pin logic is pin-watch's own — never a second
 * implementation. All fetchers and executors are injected; no test touches
 * the network.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SERENA_UPGRADE,
  GENTLE_ENGRAM_UPGRADE,
  installedVersion,
  pypiLatest,
  npmLatest,
  collectToolReports,
  renderReport,
  run,
} from "./update-tools.mjs";
import * as pinWatch from "./pin-watch.mjs";

describe("pin-watch logic is reused, not reimplemented (S3, PE-005)", () => {
  it("exports pin-watch's own detection/pin functions by identity", () => {
    assert.equal(installedVersion, pinWatch.installedVersion);
    assert.equal(pypiLatest, pinWatch.pypiLatest);
    assert.equal(npmLatest, pinWatch.npmLatest);
  });
});

describe("collectToolReports — installed vs published (AC4)", () => {
  it("reports drift when PyPI published a newer serena-agent", () => {
    const reports = collectToolReports({
      readSerenaInstalled: () => "2.1.0",
      fetchPypiLatest: () => "2.2.0",
      readGentleEngramInstalled: () => "0.4.2",
      fetchNpmLatest: () => "0.4.2",
    });
    const serena = reports.find((r) => r.tool === "serena-agent");
    assert.equal(serena.installed, "2.1.0");
    assert.equal(serena.published, "2.2.0");
    assert.equal(serena.drift, true);
    assert.equal(serena.degraded, false);
  });

  it("reports no drift when both tools are current", () => {
    const reports = collectToolReports({
      readSerenaInstalled: () => "2.2.0",
      fetchPypiLatest: () => "2.2.0",
      readGentleEngramInstalled: () => "0.4.2",
      fetchNpmLatest: () => "0.4.2",
    });
    assert.deepEqual(reports.filter((r) => r.drift).map((r) => r.tool), []);
  });

  it("reports gentle-engram drift from npm's latest", () => {
    const reports = collectToolReports({
      readSerenaInstalled: () => "2.1.0",
      fetchPypiLatest: () => "2.1.0",
      readGentleEngramInstalled: () => "0.4.1",
      fetchNpmLatest: () => "0.4.2",
    });
    const pkg = reports.find((r) => r.tool === "gentle-engram");
    assert.equal(pkg.installed, "0.4.1");
    assert.equal(pkg.published, "0.4.2");
    assert.equal(pkg.drift, true);
  });

  it("reports a tool that is not installed without crashing", () => {
    const reports = collectToolReports({
      readSerenaInstalled: () => null,
      fetchPypiLatest: () => "2.2.0",
      readGentleEngramInstalled: () => null,
      fetchNpmLatest: () => "0.4.2",
    });
    for (const row of reports) {
      assert.equal(row.installed, null);
      assert.equal(row.drift, false);
      assert.match(row.note ?? "", /not installed/i);
    }
  });

  it("degrades — never throws — when a registry fetch fails", () => {
    const reports = collectToolReports({
      readSerenaInstalled: () => "2.1.0",
      fetchPypiLatest: () => {
        throw new Error("PyPI unreachable");
      },
      readGentleEngramInstalled: () => "0.4.2",
      fetchNpmLatest: () => {
        throw new Error("npm unreachable");
      },
    });
    for (const row of reports) {
      assert.equal(row.drift, false);
      assert.equal(row.degraded, true);
      assert.match(row.note, /unreachable/);
    }
  });
});

describe("--dry-run reports without changing anything (AC4)", () => {
  it("runs zero commands and prints both tools' current vs latest", () => {
    const executed = [];
    const result = run({
      dryRun: true,
      readSerenaInstalled: () => "2.1.0",
      fetchPypiLatest: () => "2.2.0",
      readGentleEngramInstalled: () => "0.4.1",
      fetchNpmLatest: () => "0.4.2",
      execute: (command) => {
        executed.push(command);
        return { ok: true, message: command };
      },
    });
    assert.deepEqual(executed, [], "dry-run must not execute anything");
    assert.equal(result.code, 0);
    assert.match(result.output, /serena-agent/);
    assert.match(result.output, /2\.1\.0/);
    assert.match(result.output, /2\.2\.0/);
    assert.match(result.output, /gentle-engram/);
    assert.match(result.output, /0\.4\.1/);
    assert.match(result.output, /0\.4\.2/);
  });
});

describe("upgrade mode runs exactly the documented commands (S3)", () => {
  it("executes `uv tool upgrade serena-agent` and `pi install npm:gentle-engram@latest`", () => {
    const executed = [];
    const result = run({
      dryRun: false,
      readSerenaInstalled: () => "2.1.0",
      fetchPypiLatest: () => "2.2.0",
      readGentleEngramInstalled: () => "0.4.1",
      fetchNpmLatest: () => "0.4.2",
      execute: (command) => {
        executed.push(command);
        return { ok: true, message: "upgraded" };
      },
    });
    assert.deepEqual(executed, [SERENA_UPGRADE, GENTLE_ENGRAM_UPGRADE]);
    assert.equal(SERENA_UPGRADE, "uv tool upgrade serena-agent");
    assert.equal(GENTLE_ENGRAM_UPGRADE, "pi install npm:gentle-engram@latest");
    assert.equal(result.code, 0);
  });

  it("exits 1 when an upgrade command fails, naming the tool", () => {
    const result = run({
      dryRun: false,
      readSerenaInstalled: () => "2.1.0",
      fetchPypiLatest: () => "2.2.0",
      readGentleEngramInstalled: () => "0.4.1",
      fetchNpmLatest: () => "0.4.2",
      execute: (command) =>
        command === SERENA_UPGRADE ? { ok: false, message: "uv: no such tool" } : { ok: true, message: "upgraded" },
    });
    assert.equal(result.code, 1);
    assert.match(result.output, /serena-agent/);
    assert.match(result.output, /uv: no such tool/);
  });
});

describe("renderReport — the fixed report shape", () => {
  it("prints one line per tool plus a verdict, degraded rows included", () => {
    const text = renderReport([
      { tool: "serena-agent", installed: "2.1.0", published: "2.2.0", drift: true },
      { tool: "gentle-engram", installed: "0.4.2", published: null, drift: false, degraded: true, note: "npm unreachable" },
    ]);
    assert.match(text, /serena-agent: installed 2\.1\.0 · published 2\.2\.0 · DRIFT/);
    assert.match(text, /gentle-engram: installed 0\.4\.2 · published unknown · degraded — npm unreachable/);
    assert.match(text, /VERDICT:/);
  });
});
