// guard-plugin.test.mjs — the guard-plugin contract (issue #654, S6 bullet 3 / S9).
//
// One decision function, two carriers: the plugin's policy projection decides at
// the gate, the authorizer link answers the asks the policy leaves open. This
// suite pins the contract both carriers read — the closed vocabularies, the
// strict declaration validator, the matcher's documented edge, the decision's
// last-match-wins order and the projection's collision refusal — so a downstream
// project's declared guard means the same thing wherever it is enforced.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  GUARD_MODES,
  GUARD_PLUGIN_CONTRACT,
  GUARD_PLUGIN_KINDS,
  GUARD_PLUGIN_SURFACES,
  decideGuardPlugin,
  decideGuardPluginChain,
  matchesGuardPattern,
  renderGuardPluginPolicy,
  validateGuardPluginDeclaration,
  validateGuardPlugins,
} from "../dist/index.js";

const DENY_ENV = {
  kind: "deterministic",
  surface: "path",
  rules: [{ match: "**/.env", verdict: "deny", reason: "secrets never enter the agent's reach" }],
};

const issuesText = (result) => JSON.stringify(result.issues ?? []);

/* ----------------------------------------------------------- the vocabulary */

test("the contract is versioned and both vocabularies are closed", () => {
  assert.equal(GUARD_PLUGIN_CONTRACT, "guard-plugin@1");
  assert.deepEqual([...GUARD_PLUGIN_KINDS], ["deterministic", "model-backed"]);
  assert.deepEqual([...GUARD_PLUGIN_SURFACES], ["bash", "path", "tool", "skill", "mcp"]);
  assert.deepEqual([...GUARD_MODES], ["allow", "deny", "ask"], "a rule verdict reuses the published disposition vocabulary");
  assert.equal(Object.isFrozen(GUARD_PLUGIN_KINDS), true);
  assert.equal(Object.isFrozen(GUARD_PLUGIN_SURFACES), true);
});

/* ------------------------------------------------------------- validation */

test("a well-formed declaration passes untouched", () => {
  const result = validateGuardPluginDeclaration(DENY_ENV);
  assert.equal(result.ok, true, issuesText(result));
  assert.deepEqual(result.declaration, DENY_ENV);
});

test("a declaration is refused by name at every level, never coerced", () => {
  const refused = (value, needle, label) => {
    const result = validateGuardPluginDeclaration(value);
    assert.equal(result.ok, false, `${label}: expected a refusal`);
    assert.ok(issuesText(result).includes(needle), `${label}: expected an issue naming ${needle}, got ${issuesText(result)}`);
  };
  refused({ ...DENY_ENV, kind: "judge" }, "kind", "unknown kind");
  refused({ ...DENY_ENV, surface: "network" }, "surface", "unknown surface");
  refused({ ...DENY_ENV, rules: [] }, "rules", "empty rules");
  refused({ ...DENY_ENV, audience: "me" }, "audience", "unknown declaration key");
  refused({ ...DENY_ENV, rules: [{ match: "" }] }, "match", "empty match");
  refused({ ...DENY_ENV, rules: [{ match: "*", verdict: "maybe" }] }, "verdict", "unknown verdict");
  refused({ ...DENY_ENV, rules: [{ match: "*", reason: "" }] }, "reason", "empty reason");
  refused({ ...DENY_ENV, rules: [{ match: "*", then: "deny" }] }, "then", "unknown rule key");
  refused([DENY_ENV], "object", "not an object");
});

test("the section is strict too: an unknown section key or a malformed guard name is refused", () => {
  const good = validateGuardPlugins({ enabled: false, guards: { "no-dotenv": DENY_ENV } });
  assert.equal(good.ok, true, issuesText(good));
  assert.equal(good.value.guards["no-dotenv"].surface, "path");

  const unknownSectionKey = validateGuardPlugins({ on: true });
  assert.equal(unknownSectionKey.ok, false);
  assert.ok(issuesText(unknownSectionKey).includes("on"), "the section key is named");

  const badName = validateGuardPlugins({ guards: { "No Dotenv": DENY_ENV } });
  assert.equal(badName.ok, false, "a guard name is a lowercase slug");
});

/* --------------------------------------------------------------- decisions */

const request = (surface, value) => ({ surface, value });

test("the last matching rule wins, and its reason travels with the verdict", () => {
  const declaration = {
    kind: "deterministic",
    surface: "path",
    rules: [
      { match: "*", verdict: "allow" },
      { match: "**/.env", verdict: "deny", reason: "secrets" },
      { match: "**/.env.example", verdict: "allow" },
    ],
  };
  assert.deepEqual(decideGuardPlugin(declaration, request("path", "/repo/.env")), { verdict: "deny", rule: 2, reason: "secrets" });
  assert.deepEqual(decideGuardPlugin(declaration, request("path", "/repo/.env.example")), { verdict: "allow", rule: 3 });
  assert.deepEqual(decideGuardPlugin(declaration, request("path", "/repo/src/a.ts")), { verdict: "allow", rule: 1 });
});

test("a rule without a verdict asks, and a value nothing matches defers", () => {
  const declaration = { kind: "deterministic", surface: "bash", rules: [{ match: "sudo *" }] };
  assert.deepEqual(decideGuardPlugin(declaration, request("bash", "sudo ls")), { verdict: "ask", rule: 1 });
  assert.deepEqual(decideGuardPlugin(declaration, request("bash", "ls")), { verdict: "defer" });
});

test("a declaration for another surface has no opinion on this one", () => {
  assert.deepEqual(decideGuardPlugin(DENY_ENV, request("bash", "/repo/.env")), { verdict: "defer" });
});

test("the chain answers in declaration order and the first non-defer wins", () => {
  const chain = [
    { name: "first", declaration: { kind: "deterministic", surface: "path", rules: [{ match: "*", verdict: "deny", reason: "first" }] } },
    { name: "second", declaration: { kind: "deterministic", surface: "path", rules: [{ match: "*", verdict: "allow" }] } },
  ];
  assert.deepEqual(decideGuardPluginChain(chain, request("path", "/repo/a.ts")), { verdict: "deny", rule: 1, reason: "first", guard: "first" });
  assert.deepEqual(decideGuardPluginChain([chain[1], chain[0]], request("path", "/repo/a.ts")), { verdict: "allow", rule: 1, guard: "second" });
  assert.deepEqual(decideGuardPluginChain(chain, request("bash", "ls")), { verdict: "defer" });
});

/* ---------------------------------------------------------------- matcher */

test("the matcher is the documented one: greedy star, literal metacharacters, anchored", () => {
  assert.equal(matchesGuardPattern("*", "anything at all"), true);
  assert.equal(matchesGuardPattern("*", ""), true);
  assert.equal(matchesGuardPattern("", ""), true);
  assert.equal(matchesGuardPattern("", "x"), false);
  assert.equal(matchesGuardPattern("**/.env", "/repo/.env"), true);
  assert.equal(matchesGuardPattern("**/.env", "/repo/.env.local"), false);
  assert.equal(matchesGuardPattern("path/src/*", "path/src/deep/nested/a.ts"), true, "a star crosses separators");
  assert.equal(matchesGuardPattern("a.b", "axb"), false, "a dot is a literal, not a wildcard");
  assert.equal(matchesGuardPattern("foo", "xfoo"), false, "the pattern is anchored at both ends");
  assert.equal(matchesGuardPattern("rm -rf *", "rm -rf /"), true);
  assert.equal(matchesGuardPattern("rm -rf *", "rm -rf /\n&& x"), true, "a newline is an ordinary character");
});

/* ------------------------------------------------------------- projection */

test("the projection keeps declaration order per surface and folds identical rules", () => {
  const result = renderGuardPluginPolicy({
    "no-dotenv": DENY_ENV,
    "wide": { kind: "deterministic", surface: "path", rules: [{ match: "*", verdict: "allow" }, { match: "**/.env", verdict: "deny" }] },
    "scratch": { kind: "deterministic", surface: "bash", rules: [{ match: "rm -rf *", verdict: "deny" }] },
  });
  assert.equal(result.ok, true, issuesText(result));
  assert.deepEqual(Object.keys(result.permission.path), ["**/.env", "*"], "the first declaration's rule lands first");
  assert.equal(result.permission.path["**/.env"], "deny", "an identical rule folds instead of colliding");
  assert.equal(result.permission.path["*"], "allow");
  assert.deepEqual(result.permission.bash, { "rm -rf *": "deny" });
});

test("two guards disagreeing on one rule are refused, never silently last-wins", () => {
  const result = renderGuardPluginPolicy({
    a: { kind: "deterministic", surface: "path", rules: [{ match: "**/.env", verdict: "deny" }] },
    b: { kind: "deterministic", surface: "path", rules: [{ match: "**/.env", verdict: "allow" }] },
  });
  assert.equal(result.ok, false);
  assert.ok(issuesText(result).includes("**/.env"), "the disputed rule is named");
  assert.ok(issuesText(result).includes("a") && issuesText(result).includes("b"), "both guards are named");
});

test("a model-backed declaration renders nothing: a static policy holds no model", () => {
  const result = renderGuardPluginPolicy({ judge: { kind: "model-backed", surface: "bash", rules: [{ match: "*", verdict: "ask" }] } });
  assert.equal(result.ok, true, issuesText(result));
  assert.deepEqual(result.permission, {});
});
