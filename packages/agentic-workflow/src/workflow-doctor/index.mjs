/**
 * index.mjs — the `workflow-doctor` command's grammar and dispatch (issue #703).
 *
 * One closed family, five ops, one exit contract:
 *
 *   mine      read the project's own record   → `workflow-doctor-mine@1` (stdout)
 *   battery   read the project's live facts   → `workflow-doctor-battery@1`
 *   bundle    validate the triage and anonymize → `workflow-doctor-bundle@1`
 *   route     match the report classes upstream → `workflow-doctor-route@1`
 *   publish   post the bundle, with consent   → `workflow-doctor-publish@1`
 *
 * Exit: 0 a receipt was produced · 1 a required input or the forge was
 * unavailable (a state refusal) · 2 a usage or contract refusal. Every refusal
 * goes to stderr as `WORKFLOW-DOCTOR REFUSAL — <token>: <sentence>` and prints no
 * receipt; stdout is the machine receipt, never progress (the process-wide
 * feedback channel owns stderr).
 *
 * Nothing here decides anything: the miner collects, `bundle` validates the
 * model's rubric application, `route` proposes, and `publish` is the one write.
 */

import fs from "node:fs";
import path from "node:path";

import { buildBundle, renderBundle } from "./bundle.mjs";
import { buildMine, renderMine } from "./mine.mjs";
import { buildRoute, publishReceipt, renderPublish, renderRoute } from "./upstream.mjs";
import { COMMAND, DoctorRefusal, OPS, USAGE } from "./vocabulary.mjs";

/** The refusals that describe the world, not the command line. */
const STATE_REFUSALS = new Set([
  "insufficient-input",
  "doctor-unavailable",
  "unavailable-forge-missing-cli",
  "unavailable-forge-auth",
  "unavailable-forge-timeout",
  "unavailable-forge-no-network",
  "forge-write-failed",
]);

/** The flags each op accepts, spelled as the CLI takes them; every op also takes `--json`. */
const FLAGS = Object.freeze({
  mine: Object.freeze(["--root", "--json", "--fold-budget", "--cycle-budget"]),
  battery: Object.freeze(["--root", "--json", "--unit", "--skills-root"]),
  bundle: Object.freeze(["--root", "--json", "--mine", "--triage", "--battery"]),
  route: Object.freeze(["--root", "--json", "--bundle", "--candidate", "--search"]),
  publish: Object.freeze(["--json", "--bundle", "--issue", "--new-title", "--repo", "--forge", "--yes"]),
});

/** The flags that take a value; every other flag is boolean. */
const VALUED = new Set([
  "--root",
  "--fold-budget",
  "--cycle-budget",
  "--unit",
  "--skills-root",
  "--mine",
  "--triage",
  "--battery",
  "--bundle",
  "--candidate",
  "--search",
  "--issue",
  "--new-title",
  "--repo",
  "--forge",
]);

/**
 * Parse one op's argv. A repeated `--candidate`/`--search` accumulates; a
 * repeated single-value flag is refused rather than last-write-wins.
 */
function parseFlags(op, argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!flag.startsWith("--")) {
      throw new DoctorRefusal("unknown-argument", `unexpected argument "${flag}"; ${COMMAND} ${op} takes flags only`);
    }
    if (!FLAGS[op].includes(flag)) {
      throw new DoctorRefusal(
        "unknown-flag",
        `${COMMAND} ${op} does not take ${flag}; it accepts ${FLAGS[op].join(", ")}`,
      );
    }
    const name = flag.slice(2);
    if (!VALUED.has(flag)) {
      flags[name] = true;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new DoctorRefusal("missing-flag-value", `${flag} needs a value`);
    }
    index += 1;
    if (name === "candidate" || name === "search") {
      flags[name] = [...(flags[name] ?? []), value];
    } else if (flags[name] !== undefined) {
      throw new DoctorRefusal("duplicate-flag", `${flag} was given twice`);
    } else {
      flags[name] = value;
    }
  }
  return flags;
}

/** Read a JSON file, refusing a path that is absent or not JSON. */
function readJson(file, what) {
  if (!fs.existsSync(file)) throw new DoctorRefusal(`missing-${what}`, `${file} does not exist`);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new DoctorRefusal(`malformed-${what}`, `${file} is not JSON: ${error.message}`);
  }
}

/** `--json` prints the envelope, otherwise the fixed block. */
function emit(flags, envelope, render) {
  process.stdout.write(`${flags.json === true ? JSON.stringify(envelope, null, 2) : render(envelope)}\n`);
}

/** The integer a budget flag carries, or the given default. */
function budgetOf(value, fallback, name) {
  if (value === undefined) return fallback;
  const number = Number.parseInt(String(value), 10);
  if (!Number.isInteger(number) || number < 0) throw new DoctorRefusal("malformed-flag", `--${name} needs a non-negative integer`);
  return number;
}

/**
 * The command's entry point. Returns the exit code, or a promise of it for the
 * async op (`battery`), exactly as the bin's dispatch expects.
 *
 * @param {string[]} [argv]
 * @param {{root?: string, spawn?: Function, doctor?: Function, transport?: object, projectDir?: string}} [options]
 * @returns {number|Promise<number>}
 */
export function main(argv = process.argv.slice(2), options = {}) {
  const [op, ...rest] = argv;

  if (op === undefined) {
    process.stderr.write(`WORKFLOW-DOCTOR REFUSAL — missing-operation: ${COMMAND} needs one of ${OPS.join(", ")}\n${USAGE}\n`);
    return 2;
  }
  if (!OPS.includes(op)) {
    const candidates = OPS.filter((name) => name.startsWith(op.slice(0, 1)) || name.includes(op));
    process.stderr.write(
      `WORKFLOW-DOCTOR REFUSAL — unknown-operation: "${op}" is not an op; ${COMMAND} accepts ${OPS.join(", ")}`
        + `${candidates.length === 0 ? "" : ` (did you mean ${candidates.join(" or ")}?)`}\n${USAGE}\n`,
    );
    return 2;
  }

  try {
    const flags = parseFlags(op, rest);
    const root = path.resolve(flags.root ?? options.root ?? process.cwd());

    if (op === "mine") {
      const receipt = buildMine(root, {
        foldBudget: budgetOf(flags["fold-budget"], undefined, "fold-budget"),
        cycleBudget: budgetOf(flags["cycle-budget"], undefined, "cycle-budget"),
      });
      emit(flags, receipt, renderMine);
      return 0;
    }

    if (op === "battery") {
      // The battery is the one op that loads the tool doctor's graph — its probe
      // modules read the crate manifest at import time — so it is imported here
      // rather than at module load: the other four ops cost nothing for it, and a
      // host that mirrors this graph without the manifest still runs them.
      return import("./battery.mjs")
        .then(async ({ buildBattery, renderBattery }) => {
          const receipt = await buildBattery(root, {
            ...(options.doctor === undefined ? {} : { doctor: options.doctor }),
            unit: flags.unit,
            skillsRoot: flags["skills-root"] ?? null,
          });
          emit(flags, receipt, renderBattery);
          return 0;
        })
        .catch((error) => refuseWith(error));
    }

    if (op === "bundle") {
      if (flags.triage === undefined) throw new DoctorRefusal("missing-triage", "bundle needs --triage <file>");
      const mine = flags.mine === undefined ? buildMine(root) : readJson(flags.mine, "mine");
      const battery = flags.battery === undefined ? null : readJson(flags.battery, "battery");
      const bundle = buildBundle({ mine, triage: readJson(flags.triage, "triage"), battery });
      emit(flags, bundle, renderBundle);
      return 0;
    }

    if (op === "route") {
      if (flags.bundle === undefined) throw new DoctorRefusal("missing-bundle-flag", "route needs --bundle <file>");
      const bundle = readJson(flags.bundle, "bundle");
      const receipt = buildRoute({
        bundle,
        transport: options.transport,
        candidate: flags.candidate ?? [],
        search: flags.search ?? [],
        projectDir: root,
      });
      emit(flags, receipt, renderRoute);
      return 0;
    }

    if (flags.bundle === undefined) throw new DoctorRefusal("missing-bundle-flag", "publish needs --bundle <file>");
    const receipt = publishReceipt({
      bundleFile: path.resolve(flags.bundle),
      issue: flags.issue ?? null,
      newTitle: flags["new-title"] ?? null,
      repo: flags.repo ?? null,
      forge: flags.forge ?? "default",
      yes: flags.yes === true,
      ...(options.spawn === undefined ? {} : { spawn: options.spawn }),
    });
    emit(flags, receipt, renderPublish);
    return 0;
  } catch (error) {
    return refuseWith(error);
  }
}

/** One refusal path for both the synchronous ops and the battery's promise. */
function refuseWith(error) {
  if (!(error instanceof DoctorRefusal)) throw error;
  process.stderr.write(`WORKFLOW-DOCTOR REFUSAL — ${error.refusal}: ${error.message}\n`);
  return STATE_REFUSALS.has(error.refusal) ? 1 : 2;
}
