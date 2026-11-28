/**
 * The pi extension's config section, published to the unified config CLI
 * (issue #427, the owner's plugin architecture).
 *
 * This package owns the vault of keys that only make sense inside
 * `pi-agentic-workflow` — model routing, profiles, passes, subagent limits, the
 * State Flow lifecycle, the shell-tool choice carrier and the phase-batching
 * switch. It ships them as data:
 * `agentic-workflow config`
 * discovers `agentic-workflow.config.json`, composes this schema with the base
 * feature schema, and reads/writes the `pi-agentic-workflow` stem (`.json`,
 * `.jsonc` or `.json5`, resolved by the shared rule) without importing this
 * package.
 *
 * `test/config-extension.test.mjs` pins the committed descriptor to this
 * module, so the published data and the runtime validator cannot drift.
 */

import {
  CONFIG_EXTENSION_CONTRACT,
  GUARD_MODES,
  GUARD_PLUGIN_KINDS,
  GUARD_PLUGIN_SURFACES,
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
  TOOL_CHOICE_MODES,
  UNAVAILABLE_ROUTE_POLICIES,
} from "./types.js";

const MODEL = {
  description: "The model: a provider/modelId reference, a 1-4 reference chain, or inherit.",
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
    thinking: {
      type: "string",
      enum: [...THINKING_LEVELS, "inherit"],
      description: "The thinking level for this route; inherit keeps the host's.",
    },
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
    default: { ...ROUTE, description: "The default model route for a command with no override of its own." },
    commands: { ...ROUTE_MAP, description: "Per-command route overrides; a command not named here uses the default route." },
    onUnavailableRoute: {
      type: "string",
      enum: [...UNAVAILABLE_ROUTE_POLICIES],
      description: "What a routed command does when its model is unavailable: stop, fall back, or ask.",
    },
    onSettle: {
      type: "string",
      enum: ["keep", "restore"],
      description: "What happens to the model after a routed command settles: keep or restore.",
    },
    recommendedModels: { type: "boolean", description: "Offer the recommended built-in model references in pickers." },
    profiles: { type: "object", additionalProperties: PROFILE, description: "Named route profiles a session can rotate to." },
    profileOrder: {
      type: "array",
      items: { type: "string", minLength: 1 },
      description: "The order profiles rotate through; the first is the default profile.",
    },
    profileFallback: {
      type: "object",
      additionalProperties: false,
      description: "How a profile fallback resumes and how long it waits before retrying.",
      properties: {
        applyTo: {
          type: "string",
          enum: [...PROFILE_FALLBACK_APPLY_TO],
          description: "Which surface the fallback applies to: flow, command, or both.",
        },
        resume: {
          type: "string",
          enum: [...PROFILE_FALLBACK_RESUME],
          description: "How the interrupted work resumes: continue or restart.",
        },
        retryAfterSeconds: {
          type: "integer",
          minimum: 0,
          description: "How long to wait before retrying a demoted profile.",
        },
      },
    },
    presetProfile: {
      description: "A provider preset's contributed profile; omitted when no preset registers one.",
      anyOf: [
        { type: "string", pattern: "^[a-z0-9][a-z0-9._-]*$" },
        { type: "array", items: { type: "string", pattern: "^[a-z0-9][a-z0-9._-]*$" }, minItems: 1, maxItems: 8 },
      ],
    },
    tierRouting: {
      description: "A provider preset's tier routing table; omitted when no preset registers one.",
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
    passes: {
      type: "object",
      additionalProperties: ROUTE,
      description: "Model routing for the review passes, keyed by the published pass name plus default.",
    },
    subagents: {
      type: "object",
      additionalProperties: false,
      description: "Limits for spawned subagents: parallelism and the resource caps.",
      properties: {
        parallelism: {
          oneOf: [{ type: "string", enum: ["serial", "auto"] }, { type: "integer", minimum: 1 }],
          description: "How many subagents may run at once.",
        },
        memoryCap: { type: "string", minLength: 1, description: "The memory cap a subagent may use, as the harness spells it." },
        threadCap: { type: "string", minLength: 1, description: "The thread cap a subagent may use, as the harness spells it." },
      },
    },
    stateFlow: {
      type: "object",
      additionalProperties: false,
      description: "The opt-in execution-state episode around the longest workflow commands.",
      properties: {
        enabled: { type: "boolean", description: "Start and stop a state-flow episode per routed command." },
        backend: { type: "string", enum: [...STATE_FLOW_BACKENDS], description: "The state-flow backend the episode is opened on." },
        commands: {
          type: "array",
          items: { type: "string", minLength: 1 },
          description: "The commands that run inside an episode (the allowlist).",
        },
        stopOn: { type: "string", enum: [...STATE_FLOW_STOP_POLICIES], description: "When the episode is stopped: success, failure, or always." },
        onBackendMissing: {
          type: "string",
          enum: [...STATE_FLOW_MISSING_POLICIES],
          description: "What a command does when the state-flow backend is missing.",
        },
      },
    },
    // Issue #610 — the shell-tool-choice carrier, published to the config CLI so
    // `agentic-workflow config schema` offers exactly what the runtime validates.
    toolChoice: {
      type: "object",
      additionalProperties: false,
      description: "The command-time search/run tool carrier: rg before grep, bun before node.",
      properties: {
        enabled: { type: "boolean", description: "Arm the tool-choice carrier." },
        mode: {
          type: "string",
          enum: [...TOOL_CHOICE_MODES],
          description: "block refuses the unpreferred tool; rewrite forwards the preferred one.",
        },
      },
    },
    // Issue #654 — the project's own guards, declared as data. This section is
    // the ONE authoring surface; the permission layer's own configuration is a
    // projection of it (`provision permissions`), so the shape is closed at every
    // level: an undeclared key is refused rather than read as a policy nobody
    // declared.
    guardPlugins: {
      type: "object",
      additionalProperties: false,
      description: "The project's own guards, declared as data and enforced by the installed carrier.",
      properties: {
        enabled: { type: "boolean", description: "Arm the guard-plugin chain without deleting its declarations." },
        guards: {
          description: "One entry per declared guard, keyed by the guard name.",
          type: "object",
          additionalProperties: {
            type: "object",
            additionalProperties: false,
            required: ["kind", "surface", "rules"],
            properties: {
              kind: { type: "string", enum: [...GUARD_PLUGIN_KINDS] },
              surface: { type: "string", enum: [...GUARD_PLUGIN_SURFACES] },
              rules: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["match"],
                  properties: {
                    match: { type: "string", minLength: 1 },
                    verdict: { type: "string", enum: [...GUARD_MODES] },
                    reason: { type: "string", minLength: 1 },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Issue #632 — the phase-batching switch the companion preset's policy
    // reads through the seam. One scalar: the policy's thresholds are preset
    // data, so a second knob here would be a setting nothing reads.
    phaseBatching: {
      type: "object",
      additionalProperties: false,
      description: "Ask the provider preset how many execute-phase steps one context holds.",
      properties: {
        enabled: { type: "boolean", description: "Arm model-aware phase batching; false is the shipped one-phase posture." },
      },
    },
  },
} satisfies JsonSchema;

const { declared: _declared, ...piDefaults } = DEFAULT_PI_CONFIG;

export const PI_CONFIG_EXTENSION: ConfigExtensionDescriptor = {
  contract: CONFIG_EXTENSION_CONTRACT,
  key: "pi",
  // The canonical identity is the stem (#740 S4): the scopes carry
  // `pi-agentic-workflow.json`, `.jsonc` or `.json5`, and the resolver picks.
  file: "pi-agentic-workflow",
  description: "pi-agentic-workflow package config: model routing, profiles, passes, subagent limits, State Flow, shell-tool choice, phase batching, guard plugins.",
  schema: PI_SCHEMA,
  defaults: piDefaults,
};
