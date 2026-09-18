// path-protection.test.mjs — feature 60 Tier 2 pi guard (AC4, AC10)
//
// The block / reason / read-passthrough / create-passthrough cases, the
// matching-justification-permits-write positive case, the tighten-honored /
// loosen-rejected resolution cases, the cross-scope merge, and the
// cross-package shipped-default parity pin. The guard decision is pure, so no
// live Pi session is needed.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  PATH_GLOB_MAX_LENGTH,
  PHASE_STATES,
  SHIPPED_PATH_POLICY,
  evaluateToolCall,
  globToRegExp,
  intersectPathPolicy,
  isProtectedPath,
  matchingJustification,
  mergePathProtectionOverrides,
  normalizeTarget,
} from "../dist/config/path-policy.js";
import { mergeConfigs } from "../dist/config/merge.js";
import { parseConfigFile } from "../dist/config/schema.js";
import { SHIPPED_PATH_POLICY as CRATE_SHIPPED } from "../../agentic-workflow/src/path-policy.mjs";

const FLOOR = intersectPathPolicy(SHIPPED_PATH_POLICY, {});
const ALL_SHIPPED_GLOBS = Object.values(SHIPPED_PATH_POLICY.classes).flatMap((cls) => cls.globs);

function justificationRow(target, phase = "P1", authority = "execute-phase") {
  return `path-protection-records@1\nkind | paths | phase | date | authority | justification\njustification | ${target} | ${phase} | 2026-09-18 | ${authority} | because`;
}

/* --------------------------------------------------------------- parity pin */

test("AC10 parity: the pi mirror equals the crate's shipped-default projection", () => {
  assert.deepEqual(SHIPPED_PATH_POLICY, JSON.parse(JSON.stringify(CRATE_SHIPPED)));
  assert.equal(JSON.stringify(SHIPPED_PATH_POLICY), JSON.stringify(CRATE_SHIPPED));
});

/* ------------------------------------------------------------ config shape */

test("the strict schema accepts a shaped override and rejects unknown keys", () => {
  const good = parseConfigFile(JSON.stringify({ pathProtection: { protectedGlobs: ["spec/**"], requirements: { "pre-freeze": { modify: "approval" } } } }));
  assert.equal(good.ok, true, JSON.stringify(good.ok ? [] : good.issues));
  assert.equal(parseConfigFile(JSON.stringify({ pathProtection: { nope: true } })).ok, false);
  assert.equal(parseConfigFile(JSON.stringify({ pathProtection: { requirements: { "pre-freeze": { modify: "maybe" } } } })).ok, false);
  assert.equal(parseConfigFile(JSON.stringify({ pathProtection: { protectedGlobs: [""] } })).ok, false);
});

test("F29 mirror: the strict schema rejects a protectedGlobs entry over the glob-length bound", () => {
  assert.equal(parseConfigFile(JSON.stringify({ pathProtection: { protectedGlobs: ["a".repeat(PATH_GLOB_MAX_LENGTH + 1)] } })).ok, false);
});

/* --------------------------------------------------------------- tighten-only */

test("a tightening override is honored", () => {
  const policy = intersectPathPolicy(SHIPPED_PATH_POLICY, {
    protectedGlobs: [...ALL_SHIPPED_GLOBS, "spec/**"],
    requirements: { "pre-freeze": { modify: "approval" } },
  });
  assert.deepEqual(policy.degradations, []);
  assert.equal(isProtectedPath(policy, "spec/a.mjs"), true);
  assert.equal(policy.matrix["pre-freeze"].modify, "approval");
});

test("a loosening override is rejected with the shipped floor kept and reported", () => {
  const policy = intersectPathPolicy(SHIPPED_PATH_POLICY, {
    protectedGlobs: ["spec/**"],
    requirements: { "post-freeze": { modify: "justification" } },
  });
  assert.equal(policy.matrix["post-freeze"].modify, "approval");
  assert.equal(isProtectedPath(policy, "tests/a.mjs"), true, "a removal cannot drop the shipped glob");
  assert.equal(isProtectedPath(policy, "spec/a.mjs"), true, "the added glob is still honored");
  const codes = policy.degradations.map((entry) => entry.code);
  assert.equal(codes.includes("ignored-lowering"), true);
  assert.equal(codes.includes("ignored-removal"), true);
});

test("overrides merge across scopes with globs union and requirements max", () => {
  const merged = mergePathProtectionOverrides(
    { protectedGlobs: ["a/**"], requirements: { "pre-freeze": { modify: "justification" } } },
    { protectedGlobs: ["b/**"], requirements: { "pre-freeze": { delete: "approval" } } },
  );
  assert.deepEqual(merged.protectedGlobs, ["a/**", "b/**"]);
  assert.equal(merged.requirements["pre-freeze"].modify, "justification");
  assert.equal(merged.requirements["pre-freeze"].delete, "approval");
});

test("mergeConfigs applies the cross-scope override to the effective policy", () => {
  const globalCfg = parseConfigFile(JSON.stringify({ pathProtection: { protectedGlobs: ["g/**"] } })).config;
  const projectCfg = parseConfigFile(JSON.stringify({ pathProtection: { protectedGlobs: ["p/**"] } })).config;
  const merged = mergeConfigs(globalCfg, projectCfg);
  assert.equal(isProtectedPath(merged.pathProtection, "g/x.mjs"), true);
  assert.equal(isProtectedPath(merged.pathProtection, "p/x.mjs"), true);
  assert.equal(merged.pathProtection.matrix["post-freeze"].modify, "approval");
});

test("DEFAULT_CONFIG carries the untouched shipped floor with no degradation", () => {
  const merged = mergeConfigs({}, {});
  assert.deepEqual(merged.pathProtection, FLOOR);
  assert.deepEqual(merged.pathProtection.degradations, []);
});

/* ---------------------------------------------------------- record matching */

test("matchingJustification honors only an execute-phase justification row", () => {
  assert.equal(matchingJustification("tests/a.mjs", justificationRow("tests/a.mjs")), true);
  assert.equal(matchingJustification("tests/a.mjs", justificationRow("tests/other.mjs")), false);
  assert.equal(matchingJustification("tests/a.mjs", justificationRow("tests/a.mjs", "P1", "human-owner")), false);
  assert.equal(
    matchingJustification(
      "tests/a.mjs",
      "path-protection-records@1\nkind | paths | phase | date | authority | justification\napproval | tests/a.mjs | P1 | 2026-09-18 | human-owner | owner",
    ),
    false,
    "an approval row does not satisfy the Tier 2 justification floor",
  );
});

/* ------------------------------------------------------------- tool decision */

test("AC4: an edit to an existing protected file is blocked with the escape path named", () => {
  const decision = evaluateToolCall({
    toolName: "edit",
    targetPath: "tests/a.mjs",
    targetExists: true,
    policy: FLOOR,
    recordsText: "",
  });
  assert.equal(decision.block, true);
  assert.match(decision.reason, /tests\/a\.mjs/);
  assert.match(decision.reason, /path-protection-records@1/);
  assert.match(decision.reason, /execute-phase/);
});

test("AC4: a matching justification record permits the same write", () => {
  const decision = evaluateToolCall({
    toolName: "write",
    targetPath: "tests/a.mjs",
    targetExists: true,
    policy: FLOOR,
    recordsText: justificationRow("tests/a.mjs"),
  });
  assert.equal(decision.block, false);
});

test("pi:read-passthrough — read-only calls are never blocked", () => {
  for (const toolName of ["read", "grep", "find", "ls"]) {
    const decision = evaluateToolCall({ toolName, targetPath: "tests/a.mjs", targetExists: true, policy: FLOOR, recordsText: "" });
    assert.equal(decision.block, false, toolName);
  }
});

test("pi:create-passthrough — a new protected file is authoring, not modification", () => {
  const decision = evaluateToolCall({
    toolName: "write",
    targetPath: "tests/new.test.mjs",
    targetExists: false,
    policy: FLOOR,
    recordsText: "",
  });
  assert.equal(decision.block, false);
});

test("a non-protected existing file passes", () => {
  const decision = evaluateToolCall({
    toolName: "edit",
    targetPath: "src/app.ts",
    targetExists: true,
    policy: FLOOR,
    recordsText: "",
  });
  assert.equal(decision.block, false);
});

test("glob semantics match the crate: ** crosses directories, * does not", () => {
  assert.equal(globToRegExp("tests/**").test("tests/a/b.mjs"), true);
  assert.equal(globToRegExp("**/*.test.*").test("a/b/x.test.mjs"), true);
  assert.equal(globToRegExp("**/*.test.*").test("a/x.spec.mjs"), false);
  for (const state of PHASE_STATES) assert.deepEqual(Object.keys(SHIPPED_PATH_POLICY.matrix[state]).sort(), ["create", "delete", "modify", "rename"]);
});

test("F20 mirror: the matcher stays linear on a star-chain glob", () => {
  const policy = intersectPathPolicy(SHIPPED_PATH_POLICY, { protectedGlobs: ["a*a*a*a*a*a*a*a*a*a*a*a*a*b"] });
  const started = Date.now();
  assert.equal(isProtectedPath(policy, `${'a'.repeat(40)}c`), false);
  assert.equal(isProtectedPath(policy, `a${'a'.repeat(40)}b`), true);
  assert.ok(Date.now() - started < 500, "the mirror matcher must not backtrack exponentially");
});

/* ---------------------------------------------- shipped entry: handler-level */
// AC4/AC10 name "the pi extension unit test" as the proof that a `tool_call`
// returns `{ block: true, reason }`. The pure-helper cases above never invoke
// the entry, which is exactly how a non-compiling handler shipped green; the
// cases below drive the real `dist/extension/index.js` with a Pi-shaped API.

/** A Pi-shaped API that records event handlers instead of registering them. */
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

function context(cwd, notified = []) {
  return {
    cwd,
    model: { provider: "anthropic", id: "claude-sonnet-4-5" },
    isIdle: () => true,
    isProjectTrusted: () => true,
    ui: {
      notify: (message, kind) => notified.push([message, kind]),
      select: () => undefined,
      input: () => undefined,
      confirm: () => undefined,
    },
    modelRegistry: { find: () => undefined, hasConfiguredAuth: () => false, getAll: () => [] },
  };
}

/** Load the shipped entry once against an isolated agent dir and repo cwd. */
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

function tempRoot(name) {
  const root = mkdtempSync(join(tmpdir(), `paw-path-${name}-`));
  const cwd = join(root, "repo");
  const agentDir = join(root, "agent");
  mkdirSync(join(cwd, "tests"), { recursive: true });
  mkdirSync(agentDir, { recursive: true });
  writeFileSync(join(cwd, "tests", "a.mjs"), "v1\n");
  return { root, cwd, agentDir };
}

function recordsFence(rows) {
  return `\`\`\`text\npath-protection-records@1\nkind | paths | phase | date | authority | justification\n${rows.join("\n")}\n\`\`\`\n`;
}

test("AC4 entry: the shipped handler blocks an inline `gh pr comment` receipt on a bash call", async () => {
  const { root, cwd, agentDir } = tempRoot("receipt");
  try {
    const entry = await shippedEntry(cwd, agentDir);
    const decision = entry.handlers.get("tool_call")(
      { toolName: "bash", input: { command: 'gh pr comment 1 --body "review-change:pass"' } },
      context(cwd),
    );
    assert.equal(decision.block, true, "the ticket #182 receipt guard must be reachable for a bash call");
    assert.match(decision.reason, /review-receipt\.mjs emit/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC4 entry: the shipped handler blocks a write to an existing protected file and names it", async () => {
  const { root, cwd, agentDir } = tempRoot("write");
  try {
    const entry = await shippedEntry(cwd, agentDir);
    const decision = entry.handlers.get("tool_call")({ toolName: "edit", input: { path: "tests/a.mjs" } }, context(cwd));
    assert.equal(decision.block, true);
    assert.match(decision.reason, /tests\/a\.mjs/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC4 entry: a matching justification row permits the same write", async () => {
  const { root, cwd, agentDir } = tempRoot("justified");
  try {
    mkdirSync(join(cwd, "docs", "features", "unit-one"), { recursive: true });
    writeFileSync(
      join(cwd, "docs", "features", "unit-one", "decisions.md"),
      recordsFence(["justification | tests/a.mjs | P1 | 2026-09-18 | execute-phase | authoring the test"]),
    );
    const entry = await shippedEntry(cwd, agentDir);
    const decision = entry.handlers.get("tool_call")({ toolName: "write", input: { path: "tests/a.mjs" } }, context(cwd));
    assert.equal(decision, undefined, "a matching justification must let the write pass");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC4 entry: every unit's records block is consulted, not just the first", async () => {
  const { root, cwd, agentDir } = tempRoot("all-blocks");
  try {
    // The first ledger (directory order) carries a non-matching row; the
    // matching justification lives in a later block. A reader that stops at the
    // first block blocks the write instead of letting it through.
    mkdirSync(join(cwd, "docs", "features", "aaa-first"), { recursive: true });
    mkdirSync(join(cwd, "docs", "features", "zzz-second"), { recursive: true });
    writeFileSync(
      join(cwd, "docs", "features", "aaa-first", "decisions.md"),
      recordsFence(["justification | tests/other.mjs | P1 | 2026-09-18 | execute-phase | another path"]),
    );
    writeFileSync(
      join(cwd, "docs", "features", "zzz-second", "decisions.md"),
      recordsFence(["justification | tests/a.mjs | P1 | 2026-09-18 | execute-phase | this path"]),
    );
    assert.equal(
      matchingJustification(
        "tests/a.mjs",
        `${recordsFence(["justification | tests/other.mjs | P1 | 2026-09-18 | execute-phase | another path"])}\n${recordsFence(["justification | tests/a.mjs | P1 | 2026-09-18 | execute-phase | this path"])}`,
      ),
      true,
    );
    const entry = await shippedEntry(cwd, agentDir);
    const decision = entry.handlers.get("tool_call")({ toolName: "edit", input: { path: "tests/a.mjs" } }, context(cwd));
    assert.equal(decision, undefined, "a justification in any ledger must permit the write");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC4 entry: equivalent path spellings are normalised before matching", async () => {
  const { root, cwd, agentDir } = tempRoot("normalize");
  try {
    const entry = await shippedEntry(cwd, agentDir);
    for (const spelling of ["./tests/a.mjs", "sub/../tests/a.mjs", "foo/../tests/a.mjs"]) {
      const decision = entry.handlers.get("tool_call")({ toolName: "write", input: { path: spelling } }, context(cwd));
      assert.equal(decision?.block, true, `${spelling} must be recognised as the protected tests/a.mjs`);
    }
    assert.equal(normalizeTarget("./tests/a.mjs"), "tests/a.mjs");
    assert.equal(normalizeTarget("sub/../tests/a.mjs"), "tests/a.mjs");
    assert.equal(normalizeTarget("../outside.mjs"), "../outside.mjs");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC4 entry: a target escaping the project root is blocked, never silently allowed", async () => {
  const { root, cwd, agentDir } = tempRoot("outside");
  try {
    const entry = await shippedEntry(cwd, agentDir);
    const decision = entry.handlers.get("tool_call")({ toolName: "write", input: { path: "../outside.mjs" } }, context(cwd));
    assert.equal(decision?.block, true);
    assert.match(decision.reason, /outside the project root/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("F19: a symlink alias to a protected file is blocked, and a symlink escape is refused", async () => {
  const { root, cwd, agentDir } = tempRoot("symlink");
  try {
    symlinkSync(join("tests", "a.mjs"), join(cwd, "alias.mjs"));
    const outside = join(root, "outside");
    mkdirSync(outside, { recursive: true });
    writeFileSync(join(outside, "secret.mjs"), "secret\n");
    symlinkSync(outside, join(cwd, "escapeLink"));
    const entry = await shippedEntry(cwd, agentDir);
    const aliased = entry.handlers.get("tool_call")({ toolName: "write", input: { path: "alias.mjs" } }, context(cwd));
    assert.equal(aliased?.block, true, "a symlink alias must not defeat the protected-glob match");
    assert.match(aliased.reason, /tests\/a\.mjs/);
    const escaped = entry.handlers.get("tool_call")({ toolName: "write", input: { path: "escapeLink/secret.mjs" } }, context(cwd));
    assert.equal(escaped?.block, true, "a symlink escape must not defeat the out-of-root refusal");
    assert.match(escaped.reason, /outside the project root/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("F27: a create under a symlinked cwd is not misread as outside the project root", async () => {
  const { root, cwd, agentDir } = tempRoot("symlink-cwd");
  try {
    const link = join(root, "repo-link");
    symlinkSync(cwd, link);
    const entry = await shippedEntry(link, agentDir);
    const decision = entry.handlers.get("tool_call")({ toolName: "write", input: { path: "src/new.ts" } }, context(link));
    assert.equal(decision, undefined, "a new-file create must pass even when cwd is reached through a symlink");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("F28: a dangling symlink target cannot route a write outside the project root", async () => {
  const { root, cwd, agentDir } = tempRoot("dangling");
  try {
    const outside = join(root, "outside");
    mkdirSync(outside, { recursive: true });
    symlinkSync(join(outside, "created.ts"), join(cwd, "escape.ts"));
    const entry = await shippedEntry(cwd, agentDir);
    const decision = entry.handlers.get("tool_call")({ toolName: "write", input: { path: "escape.ts" } }, context(cwd));
    assert.equal(decision?.block, true, "a dangling symlink escaping the root must be blocked");
    assert.match(decision.reason, /outside the project root/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
