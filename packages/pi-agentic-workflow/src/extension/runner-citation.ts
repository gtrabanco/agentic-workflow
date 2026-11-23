/**
 * runner-citation.ts — the second-best path for the symbolic runner citation
 * (issue #696, AC6).
 *
 * The mapping's primary delivery is the block the bundle splices into every
 * packaged `SKILL.md` that cites `runner <subcommand>` (owner:
 * `skills/runner-contract/references/RUNNER.md`, injected by
 * `scripts/bundle-skills.mjs`). This module is what happens when a session skims
 * both: it reaches bash with the citation, which cannot work — no `runner`
 * executable is installed anywhere, so the shell answers 127 and the session goes
 * hunting for a binary the contract never ships.
 *
 * The `tool_call` seam therefore recognizes the citation head, refuses the shell
 * form and states the same canon block the bundle carries, naming the subcommand
 * the session tried. One failure becomes one lesson, deterministically, instead
 * of a filesystem expedition.
 *
 * Boundaries, stated rather than guessed: only the bare head `runner` is the
 * citation — a path-qualified spelling (`./runner`, `/usr/local/bin/runner`) is a
 * real binary a project may legitimately ship, and polling every command for a
 * name it does not head would be an accusation the carrier cannot answer. The
 * mapping's *wording* is never composed here: `readRunnerMapping` only extracts
 * the block its owner publishes, and the seam's own suite holds the refusal to
 * those bytes.
 */

import { readFileSync } from "node:fs";

import { segmentTokens, splitCommandSegments } from "@gtrabanco/agentic-workflow/src/tool-choice/policy.mjs";

/** The symbol a pi session resolves to the tool surface, never to a shell call. */
export const RUNNER_CITATION_HEAD = "runner";

/** The one id the mapping's owner publishes (mirrors `runner-mapping@1`). */
export const RUNNER_MAPPING_MARKER = "runner-mapping@1";

/** What the session tried: the subcommand (or none) and its own arguments. */
export interface RunnerCitation {
  subcommand: string | null;
  args: readonly string[];
}

/** An `A=b` prefix is an assignment, never the command word. */
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;
const QUOTED = /^(['"])([\s\S]*)\1$/u;

/** The token as the shell would hand it over: its own quoting is not the value. */
const shellWord = (token: string): string => token.replace(QUOTED, "$2");

/**
 * Read the mapping out of its owner document, or `null` when the document or its
 * block is absent (a caller without the bundle still refuses the shell form, it
 * just points at the contract instead of quoting it).
 *
 * @param runnerMdPath the staged `runner-contract/references/RUNNER.md`
 * @returns the fenced block, byte for byte
 */
export function readRunnerMapping(runnerMdPath: string): string | null {
  let text: string;
  try {
    text = readFileSync(runnerMdPath, "utf8");
  } catch {
    return null;
  }
  const opening = `\`\`\`text\n${RUNNER_MAPPING_MARKER}\n`;
  const at = text.indexOf(opening);
  if (at === -1) return null;
  const end = text.indexOf("\n```", at + opening.length);
  return end === -1 ? null : text.slice(at, end + 4);
}

/**
 * The `runner <subcommand>` citation a command carries, or null when it carries
 * none. Any segment counts (`cd x && runner y`), and the first citation wins.
 *
 * @param command
 * @returns the citation, with the arguments the session passed
 */
export function parseRunnerCitation(command: string): RunnerCitation | null {
  const text = typeof command === "string" ? command : "";
  if (text.trim() === "") return null;
  for (const segment of splitCommandSegments(text)) {
    const tokens = segmentTokens(segment.text);
    let index = 0;
    while (index < tokens.length && ASSIGNMENT.test(tokens[index] ?? "")) index += 1;
    if (tokens[index] !== RUNNER_CITATION_HEAD) continue;
    const rest = tokens.slice(index + 1).map(shellWord);
    return { subcommand: rest[0] ?? null, args: rest.slice(1) };
  }
  return null;
}

/**
 * The teaching refusal: the command it refused, the canon block, and the one way
 * a real `runner` binary could be meant. `mapping` is the owner's block, or null
 * when it could not be read.
 *
 * @param citation
 * @param mapping the canon block, byte for byte, or null
 * @returns what the model reads
 */
export function runnerCitationRefusal(citation: RunnerCitation | null, mapping: string | null): string {
  const subcommand = citation?.subcommand ?? null;
  const command = [RUNNER_CITATION_HEAD, subcommand, ...(citation?.args ?? [])].filter((part) => part !== null).join(" ");
  const head = [
    `\`${command}\` is the workflow's symbolic runner citation, not a shell command: no \`runner\` executable exists to call, so the shell answers 127 and the workflow command never runs.`,
    subcommand === null
      ? "The citation names a subcommand — `runner <subcommand> [args...]` — and resolves through the mapping below."
      : `\`${subcommand}\` is the runner subcommand; it resolves through the mapping below.`,
  ];
  const tail =
    mapping === null
      ? "The mapping's owner is `skills/runner-contract/references/RUNNER.md`; the short form, until that file is readable, is that in a pi session `runner <subcommand>` is the `agentic_workflow_run` tool, surfaced with `tool_search` when it is not already declared."
      : mapping;
  return [...head, tail, "A real binary named `runner` is reached by its path (`./runner …`), never by the bare word."].join("\n\n");
}
