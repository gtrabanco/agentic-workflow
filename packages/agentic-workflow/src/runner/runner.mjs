/**
 * runner.mjs — the `runner` subcommand (issue #555).
 *
 * The resolver answers the choice for code; this operation is how a script,
 * a test or a non-model caller reads that answer without importing the module.
 * It is the enforcing side of the contract the skills' prose states, which is
 * also why the pi bundle's projection rule names it.
 *
 *   agentic-workflow runner resolve [--json] [<subcommand> [args...]]
 *
 * `resolve` is the only operation (a closed world: an unknown one is a usage
 * error). JSON prints the answer a caller spawns (`source`, `program`, `argv`,
 * `attempts`); the text form is the same fact on two lines. Nothing resolves to
 * a refusal: exit 2 with `RUNNER REFUSAL —` naming every candidate it tried.
 */

import { RunnerResolutionError, resolveRunner } from "./resolve.mjs";

const USAGE = "usage: agentic-workflow runner <resolve> [--json] [<subcommand> [args...]]";

/**
 * Dispatch one `runner` invocation.
 * @param {string[]} argv the arguments after the `runner` token
 * @returns {number} the exit code
 */
export function run(argv) {
  if (argv[0] !== "resolve") {
    process.stderr.write(`${USAGE}\n`);
    return 1;
  }

  // `--json` is the operation's own flag, and it may only open the subcommand's
  // arguments: a subcommand that takes `--json` for itself keeps it.
  let json = false;
  const args = [];
  for (const token of argv.slice(1)) {
    if (token === "--json" && args.length === 0) json = true;
    else args.push(token);
  }

  let answer;
  try {
    answer = resolveRunner({ args });
  } catch (error) {
    if (!(error instanceof RunnerResolutionError)) throw error;
    process.stderr.write(`RUNNER REFUSAL — ${error.message}\n`);
    return 2;
  }

  if (json) process.stdout.write(`${JSON.stringify(answer)}\n`);
  else process.stdout.write(`RUNNER RESOLVED — ${answer.source}\nargv: ${answer.argv.join(" ")}\n`);
  return 0;
}
