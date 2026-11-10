/**
 * The pi extension's config section, published to the unified config CLI
 * (issue #427, the owner's plugin architecture).
 *
 * This package owns the vault of keys that only make sense inside
 * `pi-agentic-workflow` — model routing, profiles, passes, subagent limits and
 * the State Flow lifecycle. It ships them as data: `agentic-workflow config`
 * discovers `agentic-workflow.config.json`, composes this schema with the base
 * feature schema, and reads/writes `pi-agentic-workflow.json` without importing
 * this package.
 *
 * `test/config-extension.test.mjs` pins the committed descriptor to this
 * module, so the published data and the runtime validator cannot drift.
 */

import {
  CONFIG_EXTENSION_CONTRACT,
  type ConfigExtensionDescriptor,
  type JsonSchema,
} from "@gtrabanco/agentic-workflow-schema";

import { DEFAULT_PI_CONFIG } from "./defaults.js";
import {
  MAX_MODEL_CHAIN,
  PROFILE_FALLBACK_APPLY_TO,
  PROFILE_FALLBACK_RESUME,
  STATE_FLOW_BACKENDS,
  STATE_FLOW_MISSING_POLICIES,
  STATE_FLOW_STOP_POLICIES,
  THINKING_LEVELS,
  UNAVAILABLE_ROUTE_POLICIES,
} from "./types.js";

const MODEL = {
  oneOf: [
    { type: "string", minLength: 1 },
    { type: "array", items: { type: "string", minLength: 1 }, minItems: 1, maxItems: MAX_MODEL_CHAIN },
  ],
} satisfies JsonSchema;

const ROUTE = {
  type: "object",
  additionalProperties: false,
  properties: {
    model: MODEL,
    thinking: { type: "string", enum: [...THINKING_LEVELS, "inherit"] },
  },
} satisfies JsonSchema;

const ROUTE_MAP = { type: "object", additionalProperties: ROUTE } satisfies JsonSchema;

const PROFILE = {
  type: "object",
  additionalProperties: false,
  properties: { default: ROUTE, commands: ROUTE_MAP },
} satisfies JsonSchema;

const PI_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    default: ROUTE,
    commands: ROUTE_MAP,
    onUnavailableRoute: { type: "string", enum: [...UNAVAILABLE_ROUTE_POLICIES] },
    onSettle: { type: "string", enum: ["keep", "restore"] },
    recommendedModels: { type: "boolean" },
    profiles: { type: "object", additionalProperties: PROFILE },
    profileOrder: { type: "array", items: { type: "string", minLength: 1 } },
    profileFallback: {
      type: "object",
      additionalProperties: false,
      properties: {
        applyTo: { type: "string", enum: [...PROFILE_FALLBACK_APPLY_TO] },
        resume: { type: "string", enum: [...PROFILE_FALLBACK_RESUME] },
        retryAfterSeconds: { type: "integer", minimum: 0 },
      },
    },
    presetProfile: {
      anyOf: [
        { type: "string", pattern: "^[a-z0-9][a-z0-9._-]*$" },
        { type: "array", items: { type: "string", pattern: "^[a-z0-9][a-z0-9._-]*$" }, minItems: 1, maxItems: 8 },
      ],
    },
    tierRouting: {
      anyOf: [
        { type: "boolean" },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            enabled: { type: "boolean" },
            skills: { type: "object", additionalProperties: { type: "boolean" } },
          },
        },
      ],
    },
    passes: { type: "object", additionalProperties: ROUTE },
    subagents: {
      type: "object",
      additionalProperties: false,
      properties: {
        parallelism: { oneOf: [{ type: "string", enum: ["serial", "auto"] }, { type: "integer", minimum: 1 }] },
        memoryCap: { type: "string", minLength: 1 },
        threadCap: { type: "string", minLength: 1 },
      },
    },
    stateFlow: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean" },
        backend: { type: "string", enum: [...STATE_FLOW_BACKENDS] },
        commands: { type: "array", items: { type: "string", minLength: 1 } },
        stopOn: { type: "string", enum: [...STATE_FLOW_STOP_POLICIES] },
        onBackendMissing: { type: "string", enum: [...STATE_FLOW_MISSING_POLICIES] },
      },
    },
  },
} satisfies JsonSchema;

const { declared: _declared, ...piDefaults } = DEFAULT_PI_CONFIG;

export const PI_CONFIG_EXTENSION: ConfigExtensionDescriptor = {
  contract: CONFIG_EXTENSION_CONTRACT,
  key: "pi",
  file: "pi-agentic-workflow.json",
  description: "pi-agentic-workflow package config: model routing, profiles, passes, subagent limits, State Flow.",
  schema: PI_SCHEMA,
  defaults: piDefaults,
};
