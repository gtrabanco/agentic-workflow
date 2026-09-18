// path-protection.test.mjs — feature 60 Tier 2 pi guard (AC4, AC10)
//
// The block / reason / read-passthrough / create-passthrough cases, the
// matching-justification-permits-write positive case, the tighten-honored /
// loosen-rejected resolution cases, the cross-scope merge, and the
// cross-package shipped-default parity pin. The guard decision is pure, so no
// live Pi session is needed.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PHASE_STATES,
  SHIPPED_PATH_POLICY,
  evaluateToolCall,
  globToRegExp,
  intersectPathPolicy,
  isProtectedPath,
  matchingJustification,
  mergePathProtectionOverrides,
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
