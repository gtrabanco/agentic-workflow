#!/usr/bin/env node
/**
 * skills.mjs — the discovery route's command surface (issue #591).
 *
 * Three verbs, one contract each:
 *
 *   discover   read a candidates manifest, screen every candidate's tree with the
 *              seven `skill-lint` checks plus provenance, print the
 *              `skill-discovery@1` block with a row per candidate and its consent
 *              record. Read-only and offline: no fetch, no installer, no write.
 *   register   append one `review-extras@1` row to the guide's "Optional review
 *              extras" note (creating the note when absent) for a skill the owner
 *              just consented to install. The one writer here.
 *   inventory  read the note back with a decay state per row — `ok`, `unpinned`,
 *              `stale`, `incomplete` — so a later `product-audit` reports decay
 *              instead of missing it. Read-only.
 *
 * The route asks the questions and the owner answers; this command never installs
 * anything and never decides a candidate is good. `lint-clean` is not `good` —
 * the screen answers only "is this safe to offer".
 *
 * Usage
 *   agentic-workflow skills discover --candidates <path|-> [--consent <path|->] [--root <dir>] [--json]
 *   agentic-workflow skills register --guide <path> --name <n> --source <s> --pin <p> [--installed <YYYY-MM-DD>] --axis <a> [--json]
 *   agentic-workflow skills inventory --guide <path> [--as-of <YYYY-MM-DD>] [--max-age-days <n>] [--json]
 *
 * Exit: 0 the run's verdict passed · 1 a consented candidate was blocked
 * (discover) or a row is decaying (inventory) · 2 usage or refusal, with
 * `SKILLS REFUSAL — <reason>` on stderr before any byte moves.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  SkillDiscoveryRefusal,
  buildDiscoveryReport,
  parseConsent,
  renderDiscovery,
} from "../skills/discovery.mjs";
import {
  DEFAULT_MAX_AGE_DAYS,
  SkillExtrasRefusal,
  inventoryExtras,
  registerReviewExtra,
  renderInventory,
} from "../skills/register.mjs";

const USAGE = "usage: agentic-workflow skills <discover|register|inventory> [flags] — see the crate README's `skills` row";

/** The flags each verb accepts (besides `--json`, which all three take). */
const VERB_FLAGS = Object.freeze({
  discover: Object.freeze(["candidates", "consent", "root"]),
  register: Object.freeze(["guide", "name", "source", "pin", "installed", "axis"]),
  inventory: Object.freeze(["guide", "as-of", "max-age-days"]),
});

/** Today in UTC — the CLI supplies the date, the library never reads a clock. */
const todayUtc = () => new Date().toISOString().slice(0, 10);

class UsageError extends Error {}

/** `--flag <value>` pairs plus the `--json` switch; an unknown flag is a usage error. */
function parseFlags(args, allowed) {
  const flags = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") {
      flags.json = true;
      continue;
    }
    if (!arg.startsWith("--")) throw new UsageError(`unexpected argument "${arg}"`);
    const name = arg.slice(2);
    if (!allowed.includes(name) && name !== "json") throw new UsageError(`unknown argument "${arg}" for this verb`);
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) throw new UsageError(`--${name} needs a value`);
    flags[name] = value;
    index += 1;
  }
  return flags;
}

/** The named file's text, or stdin for `-`; an unreadable input is a refusal. */
function readInput(target, label) {
  try {
    if (target === "-") return readFileSync(0, "utf8");
    return readFileSync(resolve(target), "utf8");
  } catch {
    throw new SkillDiscoveryRefusal(`the ${label} file ${target} could not be read`);
  }
}

/** The input's parsed JSON; a malformed document is a refusal, never a stack trace. */
function parseInput(text, label) {
  try {
    return JSON.parse(text);
  } catch {
    throw new SkillDiscoveryRefusal(`the ${label} file is not valid JSON`);
  }
}

function discover(args) {
  const flags = parseFlags(args, VERB_FLAGS.discover);
  if (flags.candidates === undefined) throw new SkillDiscoveryRefusal("discover needs --candidates <path|->");
  const payload = parseInput(readInput(flags.candidates, "candidates"), "candidates");
  const consent = flags.consent === undefined ? {} : parseConsent(parseInput(readInput(flags.consent, "consent"), "consent"));
  const root = resolve(flags.root ?? process.cwd());
  const report = buildDiscoveryReport({ payload, consent, root });
  if (flags.json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else process.stdout.write(renderDiscovery(report));
  return report.exitCode;
}

function register(args) {
  const flags = parseFlags(args, VERB_FLAGS.register);
  if (flags.guide === undefined) throw new SkillExtrasRefusal("register needs --guide <path>");
  const guidePath = resolve(flags.guide);
  let guideText;
  try {
    guideText = readFileSync(guidePath, "utf8");
  } catch {
    throw new SkillExtrasRefusal(`the guide ${flags.guide} does not exist`);
  }
  const { text, changed } = registerReviewExtra({
    guideText,
    name: flags.name,
    source: flags.source,
    pin: flags.pin,
    installed: flags.installed ?? todayUtc(),
    axis: flags.axis,
  });
  writeFileSync(guidePath, text, "utf8");
  if (flags.json) {
    process.stdout.write(`${JSON.stringify({ ok: true, operation: "register", guide: flags.guide, changed, name: flags.name }, null, 2)}\n`);
    return 0;
  }
  process.stdout.write(`SKILLS register — 1 row(s) · ${flags.name}\n`);
  process.stdout.write(`guide ${flags.guide} · changed ${changed}\n`);
  return 0;
}

function inventory(args) {
  const flags = parseFlags(args, VERB_FLAGS.inventory);
  if (flags.guide === undefined) throw new SkillExtrasRefusal("inventory needs --guide <path>");
  const asOf = flags["as-of"] ?? todayUtc();
  const maxAgeDays = flags["max-age-days"] === undefined ? DEFAULT_MAX_AGE_DAYS : Number(flags["max-age-days"]);
  let guideText;
  try {
    guideText = readFileSync(resolve(flags.guide), "utf8");
  } catch {
    throw new SkillExtrasRefusal(`the guide ${flags.guide} does not exist`);
  }
  const report = inventoryExtras({ guideText, asOf, maxAgeDays });
  if (flags.json) {
    process.stdout.write(`${JSON.stringify({ ...report, guide: flags.guide, asOf, maxAgeDays }, null, 2)}\n`);
  } else {
    process.stdout.write(renderInventory(report, { asOf, maxAgeDays }));
  }
  return report.verdict === "pass" ? 0 : 1;
}

/**
 * The command body. Split from module scope so the bin can import this module
 * without it running: the body reads files, may write one, and sets an exit code.
 * @param {string[]} argv arguments after `skills`
 * @returns {number}
 */
export function run(argv) {
  const [verb, ...rest] = argv;
  try {
    if (verb === "discover") return discover(rest);
    if (verb === "register") return register(rest);
    if (verb === "inventory") return inventory(rest);
    process.stderr.write(`${USAGE}\n`);
    return 2;
  } catch (error) {
    if (error instanceof UsageError) {
      process.stderr.write(`usage: agentic-workflow skills ${verb ?? "<verb>"} — ${error.message}\n`);
      return 2;
    }
    if (error instanceof SkillDiscoveryRefusal || error instanceof SkillExtrasRefusal) {
      process.stderr.write(`SKILLS REFUSAL — ${error.message}\n`);
      return 2;
    }
    throw error;
  }
}
