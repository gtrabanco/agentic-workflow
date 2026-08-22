/**
 * Compatibility fixture: proves that consumers can assign to the legacy
 * WorkflowSkillProfile fields (skill, output, nativeFallback) and that
 * capabilities remains optional.
 *
 * The WorkflowSkillProfile public boundary must stay source-compatible —
 * a third-party library or internal code that constructs profiles must be
 * able to assign to the three legacy fields.
 *
 * Compiled with `tsc` to verify the public boundary does not emit TS2540.
 */

import type { WorkflowSkillProfile } from "../../src/index.js";

// 1. Construct a profile with all three legacy fields — must compile.
const fullProfile: WorkflowSkillProfile = {
  skill: "custom-skill",
  output: "skill-outcome-v1",
  nativeFallback: "none",
};

// 2. Construct a profile omitting capabilities — must compile.
const partialProfile: WorkflowSkillProfile = {
  skill: "partial-skill",
  output: "envelope-v2",
  nativeFallback: "fixed-verdict",
};

// 3. Mutate the legacy fields after construction — must compile.
// This is the core regression test: assigning to a readonly field
// triggers TS2540 ("Cannot assign to 'skill' because it is a read-only property.")
fullProfile.skill = "modified-skill";
fullProfile.output = "envelope-v2";
fullProfile.nativeFallback = "fixed-verdict";

// 4. Assign to an object property of type WorkflowSkillProfile — must compile.
const container: { profile: WorkflowSkillProfile } = { profile: fullProfile };
container.profile.skill = "another-skill";
container.profile.output = "skill-outcome-v1";
container.profile.nativeFallback = "none";

// If this file compiles with `tsc`, the public boundary is source-compatible.
// If it fails with TS2540, the readonly modifier on WorkflowSkillProfile
// must be removed from the legacy fields.

export { fullProfile, partialProfile, container };