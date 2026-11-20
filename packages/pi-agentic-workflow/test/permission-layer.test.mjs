// permission-layer.test.mjs — the adoption's two halves (issue #654, S4 / S6 /
// S9 / S11).
//
// The first half is a retirement: the first-party shell write guard is gone, so
// its decorative prompt, its heredoc false positives, its missing session grant
// and its missing off switch cannot come back through this package. The second
// half is what replaced it: the operator-level permission package, named once in
// the docs with what it decides and what it cannot, plus the surface a project
// authors its own guards on. Both halves are pinned by reading the committed
// tree — a claim only prose could make is a claim this suite records as prose,
// not as behaviour.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..");
const repoRoot = join(packageRoot, "..", "..");
const read = (path) => readFileSync(join(repoRoot, path), "utf8");

/* ------------------------------------------------------------- retirement */

test("the first-party shell guard is gone: module, suite and helpers", () => {
  assert.equal(existsSync(join(packageRoot, "src", "guards", "shell-path.ts")), false, "guards/shell-path.ts is retired");
  assert.equal(existsSync(join(packageRoot, "test", "shell-write-guard.test.mjs")), false, "its suite went with it");
  const guards = readdirSync(join(packageRoot, "src", "guards")).sort();
  assert.deepEqual(guards, ["git-identity-consent.ts", "git-identity.ts", "plugin-core.ts", "tool-choice.ts"], "no bash parser survives under guards/");
});

test("no source in the package names the retired guard, its helpers or its module", () => {
  const retired = /decideShellWrite|analyzeShellWrite|SHELL_TEMP_ROOTS|SHELL_HOMEDIR|readScriptBounded|guards\/shell-path/;
  const offenders = [];
  for (const dir of ["src", "test", "scripts"]) {
    for (const entry of walk(join(packageRoot, dir))) {
      if (/\.(?:ts|mjs|js)$/u.test(entry) && retired.test(readFileSync(entry, "utf8"))) offenders.push(entry);
    }
  }
  assert.deepEqual(offenders, [], "a reintroduced name is the defect this pin exists for");
});

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const next = join(dir, entry.name);
    return entry.isDirectory() ? walk(next) : [next];
  });
}

test("the contract no longer claims bash containment under path-protection@1", () => {
  const contract = read("skills/orchestration-envelope/references/TURN_CONTRACT.md");
  assert.equal(/shell-bound writes/u.test(contract), false, "the retired surface's prose is gone");
  assert.equal(contract.includes("path-protection@1"), true, "the block itself stays");
  assert.match(contract, /pi-permission-system|permission layer/u, "the paragraph names bash's owner instead of leaving a hole");
});

/* ---------------------------------------------------------------- adoption */

test("the package README documents the permission layer: install, scopes, and the guarantees it does not claim", () => {
  const readme = readFileSync(join(packageRoot, "README.md"), "utf8");
  assert.match(readme, /pi install npm:@gotgenes\/pi-permission-system/u, "the install command is stated once");
  assert.match(readme, /extensions\/pi-permission-system\/config\.json/u, "both config paths are named");
  assert.match(readme, /promptTimeoutMs/u, "an unanswered prompt denies, and the doc says so");
  assert.match(readme, /last matching rule wins/iu, "the ordering rule that makes a declaration's override work");
  assert.match(readme, /external_directory/u, "the surface that replaces the retired scratch carve-out");
  assert.match(readme, /session/iu, "the session grant is the capability the first-party guard lacked");
  assert.match(readme, /guardPlugins/u, "the authoring surface for a project's own guards");
  assert.match(readme, /provision permissions/u, "the projection command is named");
  assert.equal(/decideShellWrite|analyzeShellWrite/u.test(readme), false, "no retired name survives in the README");
});

test("the init-workspace reference carries the consent-gated offer and the operator checklist", () => {
  const reference = read("skills/init-workspace/references/PERMISSIONS.md");
  assert.match(reference, /## Consent/u, "the offer is consent-gated and says so");
  assert.match(reference, /a no writes nothing/u, "a decline writes nothing");
  assert.match(reference, /pi install npm:@gotgenes\/pi-permission-system/u);
  assert.match(reference, /promptTimeoutMs/u, "the unattended half is documented");
  assert.match(reference, /provision permissions/u, "a project's own guards go through the projection, never a hand-written file");
  assert.match(reference, /extension_ui_request/u, "the pi-web checklist is concrete");
  assert.match(reference, /session grant|approve for this session/iu);
});

test("init-workspace links the reference from its own allowlist", () => {
  const skill = read("skills/init-workspace/SKILL.md");
  assert.match(skill, /\(references\/PERMISSIONS\.md\)/u, "the reference is reachable from the skill body");
  assert.match(skill, /permission layer|permission package/iu, "the guardrails section offers it");
});

test("the unified config guide offers the section and keeps path protection's row honest", () => {
  const config = read("docs/workflow/CONFIG.md");
  assert.match(config, /`guardPlugins`/u, "the pi section row names it");
  assert.match(config, /## Guard plugins/u, "the section has its own page section");
  assert.equal(/shell-bound writes/u.test(config), false, "no config prose claims the retired surface");
});

/* -------------------------------------------- the shipped handler, end to end */

function piDouble() {
  const handlers = new Map();
  return {
    handlers,
    api: {
      registerCommand: () => {},
      sendUserMessage: () => {},
      setModel: async () => true,
      getThinkingLevel: () => "medium",
      setThinkingLevel: () => {},
      on: (type, handler) => handlers.set(type, handler),
    },
  };
}

function context(cwd) {
  return {
    cwd,
    model: { provider: "anthropic", id: "claude-sonnet-4-5" },
    isIdle: () => true,
    isProjectTrusted: () => true,
    ui: { notify: () => {}, select: () => undefined, input: () => undefined, confirm: () => undefined },
    modelRegistry: { find: () => undefined, hasConfiguredAuth: () => false, getAll: () => [] },
  };
}

async function shippedEntry(cwd, agentDir) {
  const previous = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = agentDir;
  try {
    const { default: extension } = await import("../dist/extension/index.js");
    const double = piDouble();
    extension(double.api);
    return double;
  } finally {
    if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previous;
  }
}

test("no double gate: a bash write outside the root reaches the seams with no first-party verdict", async () => {
  const root = mkdtempSync(join(tmpdir(), "paw-permission-"));
  const cwd = join(root, "repo");
  const agentDir = join(root, "agent");
  mkdirSync(cwd, { recursive: true });
  mkdirSync(agentDir, { recursive: true });
  try {
    const entry = await shippedEntry(cwd, agentDir);
    const decision = await entry.handlers.get("tool_call")(
      { toolName: "bash", input: { command: "printf x > /tmp/paw-out-of-root.txt" } },
      context(cwd),
    );
    assert.equal(decision, undefined, "bash containment belongs to the permission layer, not to this package");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the shipped handler still answers a bash call the package owns", async () => {
  const root = mkdtempSync(join(tmpdir(), "paw-permission-owned-"));
  const cwd = join(root, "repo");
  const agentDir = join(root, "agent");
  mkdirSync(cwd, { recursive: true });
  mkdirSync(agentDir, { recursive: true });
  writeFileSync(join(cwd, "AGENTS.md"), "# guide\n");
  try {
    const entry = await shippedEntry(cwd, agentDir);
    const decision = await entry.handlers.get("tool_call")(
      { toolName: "bash", input: { command: 'gh pr comment 1 --body "review-change:pass"' } },
      context(cwd),
    );
    assert.equal(decision.block, true, "the receipt guard's bash reach is unchanged by the retirement");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
