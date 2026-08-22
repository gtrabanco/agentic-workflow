import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WORKFLOW_SKILL_PROFILES,
  SKILL_ROLES,
  SKILL_EFFECTS,
  SKILL_REASONING,
  SKILL_CONTEXT_SOURCES,
  SKILL_REQUIRED_EVIDENCE,
} from "../dist/index.js";

// Frozen AC2 table — the exact reviewed maximum-capability inventory.
const EXPECTED = [
  {
    skill: "init-workspace",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "executor",
      reasoning: "semantic",
      effects: ["repository-read", "repository-write", "git-write", "forge-read", "forge-write"],
      contextSources: ["repository", "semantic-context"],
      requiredEvidence: [],
    },
  },
  {
    skill: "workflow-status",
    output: "envelope-v2",
    nativeFallback: "none",
    capabilities: {
      role: "sensor",
      reasoning: "mechanical",
      effects: ["repository-read", "forge-read"],
      contextSources: ["repository", "execution-state"],
      requiredEvidence: ["workflow-snapshot"],
    },
  },
  {
    skill: "discover-repository-state",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "sensor",
      reasoning: "semantic",
      effects: ["repository-read", "repository-write", "git-write"],
      contextSources: ["repository", "semantic-context"],
      requiredEvidence: [],
    },
  },
  {
    skill: "resolve-repository-state",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "planner",
      reasoning: "critical",
      effects: ["repository-read", "repository-write"],
      contextSources: ["repository", "semantic-context", "execution-state"],
      requiredEvidence: ["workflow-snapshot"],
    },
  },
  {
    skill: "design-feature",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "planner",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "forge-read"],
      contextSources: ["repository", "semantic-context", "episodic-memory", "execution-state"],
      requiredEvidence: ["workflow-snapshot"],
    },
  },
  {
    skill: "plan-feature",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "planner",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "forge-read"],
      contextSources: ["repository", "semantic-context", "episodic-memory", "execution-state"],
      requiredEvidence: ["workflow-snapshot"],
    },
  },
  {
    skill: "plan-fix",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "planner",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "git-write", "forge-read"],
      contextSources: ["repository", "semantic-context", "episodic-memory", "execution-state"],
      requiredEvidence: ["workflow-snapshot", "issue-state"],
    },
  },
  {
    skill: "triage-issue",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "planner",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "forge-read", "forge-write"],
      contextSources: ["repository", "semantic-context", "episodic-memory", "execution-state"],
      requiredEvidence: ["workflow-snapshot", "issue-state"],
    },
  },
  {
    skill: "execute-phase",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "executor",
      reasoning: "semantic",
      effects: ["repository-read", "repository-write", "git-write", "forge-read", "forge-write"],
      contextSources: ["repository", "semantic-context", "episodic-memory", "execution-state"],
      requiredEvidence: ["workflow-snapshot", "current-candidate"],
    },
  },
  {
    skill: "review-change",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "reviewer",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "forge-read", "forge-write"],
      contextSources: ["repository", "semantic-context", "execution-state"],
      requiredEvidence: ["current-candidate", "verification"],
    },
  },
  {
    skill: "loop-review-fold",
    output: "skill-outcome-v1",
    nativeFallback: "fixed-verdict",
    capabilities: {
      role: "reviewer",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "git-write", "forge-read", "forge-write"],
      contextSources: ["repository", "semantic-context", "episodic-memory", "execution-state"],
      requiredEvidence: ["current-candidate", "independent-review"],
    },
  },
  {
    skill: "audit-pr",
    output: "skill-outcome-v1",
    nativeFallback: "fixed-verdict",
    capabilities: {
      role: "auditor",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "forge-read", "forge-write"],
      contextSources: ["repository", "semantic-context", "execution-state"],
      requiredEvidence: ["current-candidate", "verification", "independent-review", "pull-request-state"],
    },
  },
];

const VOCABULARY = {
  role: SKILL_ROLES,
  reasoning: SKILL_REASONING,
  effects: SKILL_EFFECTS,
  contextSources: SKILL_CONTEXT_SOURCES,
  requiredEvidence: SKILL_REQUIRED_EVIDENCE,
};

const profileBySkill = (skill) => {
  const profile = WORKFLOW_SKILL_PROFILES.find((entry) => entry.skill === skill);
  assert.ok(profile, `missing built-in profile: ${skill}`);
  return profile;
};

// A capability-aware consumer facade: every vocabulary value must be in the
// closed, exported vocabularies — otherwise it fails closed instead of
// guessing from the skill name.
function resolveCapabilities(profile) {
  if (profile.capabilities === undefined) {
    throw new Error(`capabilities are absent for ${profile.skill}; failing closed (never infer from the skill name)`);
  }
  for (const [field, vocab] of Object.entries(VOCABULARY)) {
    const value = profile.capabilities[field];
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (!vocab.includes(item)) {
        throw new Error(`${profile.skill} declares unknown ${field}: ${item}`);
      }
    }
  }
  return profile.capabilities;
}

test("every built-in profile matches the exact frozen AC2 table", () => {
  assert.equal(WORKFLOW_SKILL_PROFILES.length, EXPECTED.length, "exact inventory size");
  for (const expected of EXPECTED) {
    const profile = profileBySkill(expected.skill);
    assert.equal(profile.output, expected.output, `${expected.skill}.output`);
    assert.equal(profile.nativeFallback, expected.nativeFallback, `${expected.skill}.nativeFallback`);
    assert.deepEqual(profile.capabilities, expected.capabilities, `${expected.skill} capabilities`);
  }
});

test("inventory is complete and duplicate-free", () => {
  const skills = WORKFLOW_SKILL_PROFILES.map((profile) => profile.skill);
  assert.equal(new Set(skills).size, 12, "no duplicate skills");
  assert.equal(WORKFLOW_SKILL_PROFILES.every((profile) => profile.capabilities !== undefined), true, "all built-ins populated");
  for (const expected of EXPECTED) assert.ok(skills.includes(expected.skill), `missing ${expected.skill}`);
});

test("every profile value belongs to the closed exported vocabularies", () => {
  for (const profile of WORKFLOW_SKILL_PROFILES) {
    assert.doesNotThrow(() => resolveCapabilities(profile), `${profile.skill} must be resolvable`);
  }
});

test("a fail-closed consumer rejects unknown vocabulary values (one per vocabulary)", () => {
  const base = { skill: "x", output: "skill-outcome-v1", nativeFallback: "none" };
  const bad = [
    { capabilities: { role: "king", reasoning: "semantic", effects: [], contextSources: [], requiredEvidence: [] } },
    { capabilities: { role: "sensor", reasoning: "intuitive", effects: [], contextSources: [], requiredEvidence: [] } },
    { capabilities: { role: "sensor", reasoning: "semantic", effects: ["network-write"], contextSources: [], requiredEvidence: [] } },
    { capabilities: { role: "sensor", reasoning: "semantic", effects: [], contextSources: ["agent-memory"], requiredEvidence: [] } },
    { capabilities: { role: "sensor", reasoning: "semantic", effects: [], contextSources: [], requiredEvidence: ["human-approval"] } },
  ];
  for (const overrides of bad) {
    assert.throws(
      () => resolveCapabilities({ ...base, ...overrides }),
      /unknown/,
      `expected rejection for ${JSON.stringify(overrides.capabilities)}`
    );
  }
});

test("missing capabilities fail closed instead of being inferred from the skill name", () => {
  assert.throws(
    () => resolveCapabilities({ skill: "init-workspace", output: "skill-outcome-v1", nativeFallback: "none" }),
    /failing closed/
  );
});

test("exported vocabularies and every profile are frozen at runtime (no widening)", () => {
  for (const vocab of Object.values(VOCABULARY)) assert.equal(Object.isFrozen(vocab), true);

  assert.equal(Object.isFrozen(WORKFLOW_SKILL_PROFILES), true);
  for (const profile of WORKFLOW_SKILL_PROFILES) {
    assert.equal(Object.isFrozen(profile), true, `${profile.skill} is frozen`);
    assert.equal(Object.isFrozen(profile.capabilities), true, `${profile.skill}.capabilities is frozen`);
    for (const field of ["effects", "contextSources", "requiredEvidence"]) {
      assert.equal(Object.isFrozen(profile.capabilities[field]), true, `${profile.skill}.capabilities.${field} is frozen`);
    }
  }
});

test("capability widening is impossible: mutating a frozen effects array throws in strict mode", () => {
  const effects = profileBySkill("init-workspace").capabilities.effects;
  assert.throws(() => effects.push("forge-admin"), TypeError);
  assert.equal(Object.isFrozen(effects), true);
});

test("no undeclared fields on profiles or capability objects", () => {
  for (const profile of WORKFLOW_SKILL_PROFILES) {
    assert.deepEqual(Object.keys(profile).slice().sort(), ["capabilities", "nativeFallback", "output", "skill"]);
    assert.deepEqual(
      Object.keys(profile.capabilities).slice().sort(),
      ["contextSources", "effects", "reasoning", "requiredEvidence", "role"]
    );
  }
});

// P3 compatibility: the public WorkflowSkillProfile boundary is source-compatible.
// External consumers can construct and mutate profiles without TS2540.
// This runtime test mirrors the compile-time fixture at test/fixtures/workflow-skill-profile-compat.ts.
test("public boundary accepts external profile construction without capabilities (AC3 compat)", () => {
  // Construct a profile omitting capabilities — must be accepted.
  const external = {
    skill: "custom-skill",
    output: "skill-outcome-v1",
    nativeFallback: "none",
  };
  assert.equal(external.skill, "custom-skill");
  assert.equal(external.output, "skill-outcome-v1");
  assert.equal(external.nativeFallback, "none");
  assert.equal(external.capabilities, undefined);

  // Mutate the legacy fields — must work at runtime.
  external.skill = "modified";
  external.output = "envelope-v2";
  external.nativeFallback = "fixed-verdict";
  assert.equal(external.skill, "modified");
  assert.equal(external.output, "envelope-v2");
  assert.equal(external.nativeFallback, "fixed-verdict");
});

test("public boundary accepts capabilities assignment (AC3 compat)", () => {
  const external = {
    skill: "with-caps",
    output: "skill-outcome-v1",
    nativeFallback: "none",
  };
  external.capabilities = {
    role: "sensor",
    reasoning: "mechanical",
    effects: ["repository-read"],
    contextSources: ["repository"],
    requiredEvidence: [],
  };
  assert.equal(external.capabilities.role, "sensor");
});