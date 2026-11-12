/**
 * cli.mjs — the distributable runner's closed dispatch table (issue #352).
 *
 * The crate publishes one bin, `agentic-workflow`. Its editor services live in
 * `bin/agentic-workflow.mjs`; the runtime half — the sensors and the ceremony
 * CLI — is this table. Both halves are the same process and the same bin, so a
 * target project installs one package and gets every command the skills cite.
 *
 * The table is the whole surface: a name that is not a key here reaches the
 * bin's closed-world usage error, never an invented shell fallback. Each entry
 * keeps its own exit contract (`(args) => void | number`): it prints its own
 * block and exits with its own code, or returns the code for the bin to set.
 */

import { run as runUnitRoute } from "./unit-route.mjs";

/**
 * @typedef {(args: string[]) => void | number} RunnerCommand
 * @type {Readonly<Record<string, RunnerCommand>>}
 */
export const RUNNER_COMMANDS = Object.freeze({
  "unit-route": runUnitRoute,
});

/**
 * Whether `name` is a runner subcommand.
 * @param {string} name
 * @returns {boolean}
 */
export const isRunnerCommand = (name) => Object.hasOwn(RUNNER_COMMANDS, name);

/**
 * Dispatch one runner subcommand. A returned number is the exit code to set; a
 * `undefined` return means the command already printed and set (or left) its
 * own code.
 *
 * @param {string} name
 * @param {string[]} args
 * @returns {number | undefined}
 */
export function runRunnerCommand(name, args) {
  const handler = RUNNER_COMMANDS[name];
  if (!handler) return undefined;
  const code = handler(args);
  return typeof code === "number" ? code : undefined;
}
