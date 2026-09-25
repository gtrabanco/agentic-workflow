import type { RouteFile } from "./types.js";

/** Provider identifiers shipped as built-in profiles. */
export const RECOMMENDED_PROVIDERS: readonly string[] = ["nan"];

/** A built-in profile shape: optional default route + per-command overrides. */
export interface RecommendedProfile {
  default?: RouteFile;
  commands: Record<string, RouteFile>;
}

/**
 * Built-in model profiles keyed by provider identifier.
 * Only these four models are ever used: nan/glm5.3, nan/glm5.3-flash,
 * nan/deepseek-v4-flash, nan/mimo-v2.6-flash.
 *
 * The judgment slots (audit-pr, product-audit, review-change, unit-lane) use
 * the Xiaomi family for reviewer independence from the DeepSeek/GLM executors;
 * mimo-v2.6-flash supersedes mimo-v2.5 there (same family, same 1.0B quota,
 * OpenAI-`tools`-native, stronger on the shared coding/agentic benchmarks).
 * Keep this list in step with the README's NaN guidance — there is no test
 * asserting that parity, only the expectations in test/model-profiles.test.mjs.
 */
export const RECOMMENDED_PROFILES: Readonly<Record<string, RecommendedProfile>> = {
  nan: {
    default: { model: ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], thinking: "inherit" },
    commands: {
      "audit-pr": { model: ["nan/mimo-v2.6-flash", "nan/deepseek-v4-flash"], thinking: "high" },
      "product-audit": { model: ["nan/glm5.3", "nan/mimo-v2.6-flash", "nan/deepseek-v4-flash"], thinking: "high" },
      "review-change": { model: ["nan/mimo-v2.6-flash", "nan/glm5.3-flash", "nan/deepseek-v4-flash"], thinking: "high" },
      "unit-lane": { model: ["nan/mimo-v2.6-flash", "nan/glm5.3-flash", "nan/deepseek-v4-flash"], thinking: "high" },
      "triage-issue": { model: ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], thinking: "inherit" },
      "init-workspace": { model: ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], thinking: "inherit" },
      "execute-phase": { model: ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], thinking: "inherit" },
      "fold-findings": { model: ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], thinking: "inherit" },
      "log-session": { model: ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], thinking: "inherit" },
      "workflow-status": { model: ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], thinking: "inherit" },
      "audit-docs": { model: ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], thinking: "inherit" },
      "discover-repository-state": { model: ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], thinking: "inherit" },
      "resolve-repository-state": { model: ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], thinking: "inherit" },
      "advance": { model: ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], thinking: "inherit" },
    },
  },
};