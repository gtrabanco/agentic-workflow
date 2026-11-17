// content-guard.test.mjs — the published content-guard contract (issue #470).
//
// Two surfaces, one owner each:
//   - the closed vocabularies the crate's guard and the normative-surfaces
//     inventory read (`CONTENT_GUARD_REASONS` is the `schema-export:` surface);
//   - the `contentGuard` base config section: the shipped strictest default and
//     the tighten-only merge that never lets a project widen what a global value
//     already admitted.

import assert from "node:assert/strict";
import test from "node:test";

import {
  BASE_CONFIG_SECTIONS,
  CONTENT_AUTHOR_ASSOCIATIONS,
  CONTENT_GUARD_CONTRACT,
  CONTENT_GUARD_REASONS,
  CONTENT_HIDDEN_KINDS,
  CONTENT_SOURCES,
  composeConfigSchema,
  mergeContentGuardOverrides,
  validateSectionValue,
} from "../dist/index.js";

const section = BASE_CONFIG_SECTIONS.find((entry) => entry.key === "contentGuard");

test("the contract publishes the four closed vocabularies", () => {
  assert.equal(CONTENT_GUARD_CONTRACT, "content-guard@1");
  assert.deepEqual([...CONTENT_GUARD_REASONS], [
    "trusted-author",
    "allow-listed",
    "hidden-content-stripped",
    "untrusted-author",
    "deny-listed",
    "unknown-author",
    "malformed-policy",
  ]);
  // The eight associations GitHub publishes — sampled from the schema, never
  // recalled (planning evidence PE-003).
  assert.deepEqual([...CONTENT_AUTHOR_ASSOCIATIONS], [
    "OWNER",
    "MEMBER",
    "COLLABORATOR",
    "CONTRIBUTOR",
    "FIRST_TIME_CONTRIBUTOR",
    "FIRST_TIMER",
    "MANNEQUIN",
    "NONE",
  ]);
  assert.deepEqual([...CONTENT_SOURCES], [
    "issue-title",
    "issue-body",
    "issue-comment",
    "pr-title",
    "pr-body",
    "pr-comment",
    "review-comment",
    "code-comment",
  ]);
  assert.deepEqual([...CONTENT_HIDDEN_KINDS], [
    "html-comment",
    "zero-width",
    "bidi-control",
    "tag-character",
    "variation-selector",
    "control-character",
    "homoglyph-instruction",
  ]);
  for (const vocabulary of [CONTENT_GUARD_REASONS, CONTENT_AUTHOR_ASSOCIATIONS, CONTENT_SOURCES, CONTENT_HIDDEN_KINDS]) {
    assert.ok(Object.isFrozen(vocabulary), "every vocabulary is frozen");
  }
});

test("contentGuard is a base feature section with the shipped strictest default", () => {
  assert.ok(section, "the base registry carries contentGuard");
  assert.equal(section.category, "feature");
  assert.equal(section.file, "agentic-workflow.json");
  assert.ok(section.description.length > 0);
  assert.deepEqual(section.defaults, {
    trustedRoles: ["OWNER", "MEMBER", "COLLABORATOR"],
    allowLogins: [],
    denyLogins: [],
  });
  assert.equal(section.merge, mergeContentGuardOverrides, "the section declares its tighten-only merge");
});

test("the section refuses an unknown role, an unknown key and a scalar list", () => {
  const ok = (value) => validateSectionValue(section, value);
  assert.deepEqual(ok({}), []);
  assert.deepEqual(ok({ trustedRoles: ["OWNER"], allowLogins: ["alice"], denyLogins: [] }), []);
  assert.equal(ok({ trustedRoles: ["FRIEND"] }).length, 1, "an invented association is refused");
  assert.equal(ok({ trustedRoles: "OWNER" }).length, 1, "a scalar is not a list");
  assert.equal(ok({ admins: ["alice"] }).length, 1, "an unknown key is refused, never merged");
  assert.equal(ok({ allowLogins: [""] }).length, 1, "an empty login is refused");
});

test("the merge tightens: roles intersect, login lists union, an absent side passes through", () => {
  assert.deepEqual(
    mergeContentGuardOverrides({ trustedRoles: ["OWNER", "MEMBER"] }, { trustedRoles: ["MEMBER", "COLLABORATOR"] }),
    { trustedRoles: ["MEMBER"] },
  );
  assert.deepEqual(
    mergeContentGuardOverrides({ allowLogins: ["alice"], denyLogins: ["mallory"] }, { allowLogins: ["bob"], denyLogins: [] }),
    { allowLogins: ["alice", "bob"], denyLogins: ["mallory"] },
  );
  assert.deepEqual(mergeContentGuardOverrides(undefined, { trustedRoles: ["OWNER"] }), { trustedRoles: ["OWNER"] });
  assert.deepEqual(mergeContentGuardOverrides({ trustedRoles: ["OWNER"] }, undefined), { trustedRoles: ["OWNER"] });
  assert.deepEqual(
    mergeContentGuardOverrides({ trustedRoles: ["OWNER"] }, { trustedRoles: ["COLLABORATOR"] }),
    { trustedRoles: [] },
    "a disjoint pair trusts nobody — the strictest outcome, never the union",
  );
  assert.deepEqual(mergeContentGuardOverrides(undefined, undefined), {});
});

test("the composed schema publishes the section and a plain lookup sees it", () => {
  const composed = composeConfigSchema(BASE_CONFIG_SECTIONS);
  assert.deepEqual(Object.keys(composed.properties).includes("contentGuard"), true);
  assert.equal(composed.properties.contentGuard.additionalProperties, false);
});
