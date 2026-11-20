// src/phase-batching-command.ts
// The `/nan-phase-batching` command's Pi-free core (issue #632).
//
// Two jobs, both testable without a session: parse the operator's flags into
// the policy's inputs, and render the policy's document. What it does NOT do is
// invent a fact — a missing flag, a value outside a published vocabulary, an
// unknown flag or an unparseable phase count is refused with the flag named and
// the supported syntax printed, because a recommendation built on a guess is
// the thing this policy exists to replace.
//
// The session's model is the default subject (Pi knows it, the operator should
// not have to retype it); `--model` overrides it. The config switch is read from
// the merged `pi-agentic-workflow.json` section the main package resolves — this
// module takes the resolved value, never the files.

import { RISK_TIER_KINDS, SIZE_TIER_KINDS } from "@gtrabanco/agentic-workflow-schema";
import type { PhaseBatchingEligibility } from "@gtrabanco/agentic-workflow-schema";

import { recommendPhaseBatching } from "./phase-batching.js";

/** The command name, in the preset's namespace: no skill owns it. */
export const PHASE_BATCHING_COMMAND = "nan-phase-batching";

const USAGE = `usage: /${PHASE_BATCHING_COMMAND} --risk-tier <${RISK_TIER_KINDS.join("|")}> --size-tier <${SIZE_TIER_KINDS.join("|")}> --phases <n> [--relay] [--model <provider/modelId>]`;

/** What the caller resolved before the command runs. */
export interface PhaseBatchingCommandInput {
  /** The raw argument string Pi hands the handler. */
  readonly args: string;
  /** The session's current model reference, or undefined when none is selected. */
  readonly sessionModel?: string;
  /** The resolved extension config; only the `phaseBatching` switch is read. */
  readonly config: { readonly phaseBatching?: { readonly enabled?: boolean } };
}

export type PhaseBatchingCommandResult = { ok: true; output: string } | { ok: false; error: string };

const FLAGS = Object.freeze(["--model", "--risk-tier", "--size-tier", "--phases"] as const);
const BOOLEAN_FLAGS = Object.freeze(["--relay"] as const);

interface ParsedFlags {
  readonly values: Map<string, string>;
  readonly relay: boolean;
}

const fail = (error: string): PhaseBatchingCommandResult => ({ ok: false, error });

/** Split the argument string into flags, refusing anything the command does not
 *  declare — an unknown flag silently ignored is a typo that changes an answer. */
function parseFlags(args: string): { ok: true; flags: ParsedFlags } | { ok: false; error: string } {
  const tokens = args.trim().length === 0 ? [] : args.trim().split(/\s+/u);
  const values = new Map<string, string>();
  let relay = false;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      return { ok: false, error: `unexpected argument "${token}" — ${USAGE}` };
    }
    if ((BOOLEAN_FLAGS as readonly string[]).includes(token)) {
      relay = true;
      continue;
    }
    if (!(FLAGS as readonly string[]).includes(token)) {
      return { ok: false, error: `unknown flag "${token}" — ${USAGE}` };
    }
    const value = tokens[index + 1];
    if (value === undefined || value.startsWith("--")) {
      return { ok: false, error: `missing value for "${token}" — ${USAGE}` };
    }
    if (values.has(token)) return { ok: false, error: `"${token}" is given twice — ${USAGE}` };
    values.set(token, value);
    index += 1;
  }
  return { ok: true, flags: { values, relay } };
}

/**
 * Run the command: parse, refuse what it cannot state, and render the policy's
 * document as JSON (the typed output is the answer — nothing summary-shaped is
 * printed beside it).
 */
export function phaseBatchingCommand(input: PhaseBatchingCommandInput): PhaseBatchingCommandResult {
  const parsed = parseFlags(input.args);
  if (!parsed.ok) return fail(parsed.error);
  const { values, relay } = parsed.flags;

  const model = values.get("--model") ?? input.sessionModel;
  const missing = [...FLAGS].filter((flag) => flag !== "--model" && !values.has(flag));
  if (model === undefined) missing.unshift("--model");
  if (missing.length > 0) return fail(`missing ${missing.join(", ")} — ${USAGE}`);

  const riskTier = values.get("--risk-tier") ?? "";
  if (!(RISK_TIER_KINDS as readonly string[]).includes(riskTier)) {
    return fail(`--risk-tier must be one of ${RISK_TIER_KINDS.join(" | ")}, got "${riskTier}" — ${USAGE}`);
  }
  const sizeTier = values.get("--size-tier") ?? "";
  if (!(SIZE_TIER_KINDS as readonly string[]).includes(sizeTier)) {
    return fail(`--size-tier must be one of ${SIZE_TIER_KINDS.join(" | ")}, got "${sizeTier}" — ${USAGE}`);
  }
  const phases = Number(values.get("--phases"));
  if (!Number.isInteger(phases) || phases < 1) {
    return fail(`--phases must be a positive integer, got "${values.get("--phases")}" — ${USAGE}`);
  }
  if (typeof model !== "string" || !/^[^\s/]+\/[^\s/]+$/u.test(model)) {
    return fail(`--model must be a \`provider/modelId\` reference, got "${model}" — ${USAGE}`);
  }

  const eligibility: PhaseBatchingEligibility = {
    risk_tier: riskTier as PhaseBatchingEligibility["risk_tier"],
    size_tier: sizeTier as PhaseBatchingEligibility["size_tier"],
    relay_in_flow: relay,
    phases_remaining: phases,
  };

  const recommendation = recommendPhaseBatching({
    model,
    eligibility,
    enabled: input.config.phaseBatching?.enabled === true,
  });

  return { ok: true, output: `${JSON.stringify(recommendation, null, 2)}\n` };
}
