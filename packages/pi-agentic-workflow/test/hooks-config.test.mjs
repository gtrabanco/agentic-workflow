// hooks-config.test.mjs — discovery, precedence, trust gate, alias mapping and
// the refusal grammar of the seam-hooks config loader (unit 413, O1/O2/O5/O10).
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { hookFilePaths, loadHooksConfig, readSeamHooksConsent } from "../dist/hooks/config.js";

const agentDir = "/fixture/agent";
const cwd = "/fixture/repo";
const paths = hookFilePaths(agentDir, cwd);
const readFrom = (map) => (path) => (path in map ? map[path] : null);

const VALID = JSON.stringify({
  hooks: {
    "pre:commit": [{ enabled: true, hooks: [{ type: "command", command: "bun run lint" }] }],
  },
});

test("discovery: project file lives at .pi/hooks.json, global at <agentDir>/hooks.json", () => {
  assert.equal(paths.project, join(cwd, ".pi", "hooks.json"));
  assert.equal(paths.global, join(agentDir, "hooks.json"));
});

test("missing config is a declared no-op: ok, no entries, no problems", () => {
  const loaded = loadHooksConfig({ agentDir, cwd, projectTrusted: true, readFile: () => null });
  assert.equal(loaded.ok, true);
  assert.deepEqual(loaded.entries, []);
  assert.deepEqual(loaded.problems, []);
});

test("O1: project and global entries both resolve, global first (project takes priority later)", () => {
  const globalHooks = JSON.stringify({
    hooks: { "session:start": [{ enabled: true, hooks: [{ type: "command", command: "global-cmd" }] }] },
  });
  const loaded = loadHooksConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({ [paths.global]: globalHooks, [paths.project]: VALID }),
  });
  assert.equal(loaded.ok, true);
  assert.deepEqual(
    loaded.entries.map((entry) => [entry.source, entry.seam, entry.group.hooks[0].command]),
    [["global", "session:start", "global-cmd"], ["project", "pre:commit", "bun run lint"]],
  );
});

test("O2: an untrusted project's hook file is never read", () => {
  const reads = [];
  const loaded = loadHooksConfig({
    agentDir,
    cwd,
    projectTrusted: false,
    readFile: (path) => {
      reads.push(path);
      return readFrom({ [paths.project]: VALID })(path);
    },
  });
  assert.deepEqual(reads, [paths.global]);
  assert.deepEqual(loaded.entries, []);
});

test("O5: broken JSON is a problem naming the file, never a throw", () => {
  const loaded = loadHooksConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({ [paths.project]: "{not json" }),
  });
  assert.equal(loaded.ok, false);
  assert.equal(loaded.problems.length, 1);
  assert.equal(loaded.problems[0].reason, "config-invalid");
  assert.equal(loaded.problems[0].file, paths.project);
  assert.deepEqual(loaded.entries, []);
});

test("O10: a hooks.json event with no seam mapping is refused (PreToolUse)", () => {
  const loaded = loadHooksConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({
      [paths.project]: JSON.stringify({
        hooks: { PreToolUse: [{ hooks: [{ type: "command", command: "x" }] }] },
      }),
    }),
  });
  assert.equal(loaded.ok, false);
  assert.equal(loaded.problems[0].reason, "config-invalid");
  assert.ok(loaded.problems[0].detail.includes("PreToolUse"));
});

test("O10: SessionStart/SessionEnd alias to session:start/session:end", () => {
  const loaded = loadHooksConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({
      [paths.global]: JSON.stringify({
        hooks: {
          SessionStart: [{ enabled: true, hooks: [{ type: "command", command: "a" }] }],
          SessionEnd: [{ enabled: true, hooks: [{ type: "command", command: "b" }] }],
        },
      }),
    }),
  });
  assert.equal(loaded.ok, true);
  assert.deepEqual(
    loaded.entries.map((entry) => [entry.declaredEvent, entry.seam]),
    [["SessionStart", "session:start"], ["SessionEnd", "session:end"]],
  );
});

test("refusals: non-command handler types, empty commands, out-of-range timeouts", () => {
  const cases = [
    { hooks: { "pre:commit": [{ enabled: true, hooks: [{ type: "http", url: "http://x" }] }] } },
    { hooks: { "pre:commit": [{ enabled: true, hooks: [{ type: "command", command: "" }] }] } },
    { hooks: { "pre:commit": [{ enabled: true, hooks: [{ type: "command", command: "x", timeout: 0 }] }] } },
    { hooks: { "pre:commit": [{ enabled: true, hooks: [{ type: "command", command: "x", timeout: 601 }] }] } },
    { hooks: { "pre:commit": [{ enabled: true, hooks: "not-an-array" }] } },
  ];
  for (const hooks of cases) {
    const loaded = loadHooksConfig({
      agentDir,
      cwd,
      projectTrusted: true,
      readFile: readFrom({ [paths.project]: JSON.stringify(hooks) }),
    });
    assert.equal(loaded.ok, false, JSON.stringify(hooks));
    assert.equal(loaded.problems[0].reason, "config-invalid");
  }
});

test("O4: an entry without enabled:true resolves but is opt-in off (group.enabled === false)", () => {
  const loaded = loadHooksConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({
      [paths.project]: JSON.stringify({
        hooks: { "pre:commit": [{ hooks: [{ type: "command", command: "x" }] }] },
      }),
    }),
  });
  assert.equal(loaded.ok, true);
  assert.equal(loaded.entries[0].group.enabled, false);
});

test("O11: autoCommit/autoPush are valid only on phase:end/unit:end, need a commit message, and autoPush needs autoCommit", () => {
  const invalid = [
    { hooks: { "pre:commit": [{ enabled: true, autoCommit: true, commitMessage: "m", hooks: [{ type: "command", command: "x" }] }] } },
    { hooks: { "unit:start": [{ enabled: true, autoCommit: true, commitMessage: "m", hooks: [{ type: "command", command: "x" }] }] } },
    { hooks: { "phase:end": [{ enabled: true, autoCommit: true, hooks: [{ type: "command", command: "x" }] }] } },
    { hooks: { "phase:end": [{ enabled: true, autoPush: true, commitMessage: "m", hooks: [{ type: "command", command: "x" }] }] } },
  ];
  for (const hooks of invalid) {
    const loaded = loadHooksConfig({
      agentDir,
      cwd,
      projectTrusted: true,
      readFile: readFrom({ [paths.project]: JSON.stringify(hooks) }),
    });
    assert.equal(loaded.ok, false, JSON.stringify(hooks));
  }
  const valid = loadHooksConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({
      [paths.project]: JSON.stringify({
        hooks: { "phase:end": [{ enabled: true, autoCommit: true, autoPush: true, commitMessage: "auto", hooks: [{ type: "command", command: "x" }] }] },
      }),
    }),
  });
  assert.equal(valid.ok, true);
});

test("O3: consent reads only the exact project path from the global consent store", () => {
  const consentFile = JSON.stringify({
    projects: { [cwd]: { consented: true, consentedAt: "2026-11-08T00:00:00Z" } },
  });
  assert.equal(readSeamHooksConsent(agentDir, cwd, readFrom({ [join(agentDir, "seam-hooks-consent.json")]: consentFile })), true);
  assert.equal(readSeamHooksConsent(agentDir, "/other/repo", readFrom({ [join(agentDir, "seam-hooks-consent.json")]: consentFile })), false);
  assert.equal(readSeamHooksConsent(agentDir, cwd, () => null), false);
  // A broken consent file fails closed: no consent, never a throw.
  assert.equal(readSeamHooksConsent(agentDir, cwd, readFrom({ [join(agentDir, "seam-hooks-consent.json")]: "{" })), false);
});
