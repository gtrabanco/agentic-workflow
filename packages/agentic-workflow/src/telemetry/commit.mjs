#!/usr/bin/env node
/**
 * commit.mjs — `agentic-workflow telemetry commit`, the machine-owned ledger's
 * one command (issue #727 S1a/S1b).
 *
 * The class's commit is mechanical and spends no model tokens, so the command is
 * the smallest possible wrapper over `commitMachineLedgers`: it exists so every
 * caller that is not JavaScript — the pi extension's teardown, a shell in a
 * skills-only install, an operator — reaches the same implementation, the same
 * lock and the same subject instead of re-deriving a `git add`+`git commit`
 * pair. The pi extension spawns it at teardown; `session-close close` and
 * `telemetry reconstruct write` call the module directly because they already
 * hold the project.
 *
 * stdout carries the `machine-ledger-commit@1` envelope (the machine receipt);
 * stderr carries the one human line. `clean`, `locked` and `not-a-repository`
 * exit 0 — the class is append-only, so a row that waited for the next cycle is
 * not a failure — while a refused commit exits 1 with git's own text.
 */

import process from "node:process";

import { MACHINE_LEDGER_CLASSES, MACHINE_LEDGER_ZONES, commitMachineLedgers } from "../machine-ledger/index.mjs";

/** The contract id of the answer this command prints. */
export const COMMIT_CONTRACT_ID = "machine-ledger-commit@1";

const USAGE = `usage: agentic-workflow telemetry commit [flags]

  Commit the pending bytes of the machine-owned ledger class, alone and behind a
  lock. Never \`git add -A\`: a concurrent conversation's staged file stays staged.

--class <id>   commit one class (repeatable); default: the auto zone
               (${MACHINE_LEDGER_CLASSES.filter((row) => row.zone === "auto").map((row) => row.class).join(", ")})
--zone <name>  commit every class in a zone (${MACHINE_LEDGER_ZONES.join(" | ")})
--subject <s>  the commit subject (default: derived from the classes that changed)
--repo <dir>   the checkout to commit in (default: cwd)
--dry-run      print what would be committed and write nothing
--json         print the envelope only (stdout is the envelope either way)
--help         this block

exit: 0 committed · clean · locked · not-a-repository · 1 the commit failed · 2 usage
`;

const VALUE_FLAGS = Object.freeze(["--class", "--zone", "--subject", "--repo"]);

/** The closed flag grammar: an unknown flag is a refusal, never a silent default. */
export function parseArgs(argv) {
  const flags = { classes: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const [name, inline] = token.includes("=") ? [token.slice(0, token.indexOf("=")), token.slice(token.indexOf("=") + 1)] : [token, undefined];
    if (name === "--help" || name === "-h") {
      flags.help = true;
      continue;
    }
    if (name === "--dry-run") {
      flags.dryRun = true;
      continue;
    }
    if (name === "--json") {
      flags.json = true;
      continue;
    }
    if (!VALUE_FLAGS.includes(name)) throw new Error(`unknown flag: ${name}`);
    const value = inline ?? argv[++index];
    if (value === undefined || value === "") throw new Error(`${name} needs a value`);
    if (name === "--class") flags.classes.push(value);
    else flags[name.slice(2)] = value;
  }
  return flags;
}

/**
 * The command. stdout is the envelope; stderr is the human line and the refusal.
 * Exit codes follow the module's statuses: a tree condition is never a crash.
 */
export function main(argv, { cwd = process.cwd(), stdout = (text) => process.stdout.write(text), stderr = (text) => process.stderr.write(text) } = {}) {
  let flags;
  try {
    flags = parseArgs(argv);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    stderr(`TELEMETRY COMMIT REFUSAL — ${detail}\n${USAGE}`);
    stdout(`${JSON.stringify({ contract: COMMIT_CONTRACT_ID, error: "refusal", detail })}\n`);
    return 2;
  }
  if (flags.help === true) {
    stdout(USAGE);
    return 0;
  }

  let outcome;
  try {
    outcome = commitMachineLedgers({
      root: flags.repo ?? cwd,
      classes: flags.classes.length > 0 ? flags.classes : undefined,
      zone: flags.zone,
      subject: flags.subject,
      dryRun: flags.dryRun === true,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    stderr(`TELEMETRY COMMIT REFUSAL — ${detail}\n`);
    stdout(`${JSON.stringify({ contract: COMMIT_CONTRACT_ID, error: "refusal", detail })}\n`);
    return 2;
  }

  const envelope = {
    contract: COMMIT_CONTRACT_ID,
    root: outcome.root,
    status: outcome.status,
    committed: outcome.committed,
    classes: outcome.classes,
    paths: outcome.paths,
    subject: outcome.subject,
    sha: outcome.sha,
    ...(outcome.detail === undefined ? {} : { detail: outcome.detail }),
  };
  stdout(`${JSON.stringify(envelope, null, 2)}\n`);
  const where = outcome.paths.length === 0 ? "nothing pending" : outcome.paths.join(", ");
  stderr(`machine-ledger-commit: ${outcome.status}${outcome.sha === null ? "" : ` ${outcome.sha}`} (${where})\n`);
  return outcome.status === "failed" ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
