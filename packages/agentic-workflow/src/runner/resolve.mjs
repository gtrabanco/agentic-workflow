/**
 * resolve.mjs — the programmatic runner resolver (issue #555).
 *
 * The runner used to be chosen in prose: `bunx` first, `npx` when bun is not
 * installed — two candidates resolved by whichever model read the sentence, and
 * every consumer that ran in code spelled the rule again for itself. This
 * module answers the question once, for code:
 *
 *  - **A closed set, in a fixed order.** `bunx` → `npx --yes` → `pnpm dlx`. A
 *    fourth candidate is a contract decision (`RUNNER_CANDIDATES` here and the
 *    `runner-set@1` block in `skills/runner-contract/references/RUNNER.md` move
 *    together — the crate suite fails if only one side changes).
 *  - **The floors are the crate's own.** Eligibility compares the launcher's
 *    reported version with `engines.bun` / `engines.node` from this package's
 *    manifest — a run below the floor is never launched, and it falls through to
 *    the next candidate instead of guessing.
 *  - **Two escape hatches, in one order.** `AGENTIC_WORKFLOW_RUNNER` first (the
 *    contract's documented local/canary override, tokenised so the spaced
 *    `bun /abs/path` form works), then a caller's installed bin (pi resolves the
 *    crate from its own dependency, so no runner is needed), then the set.
 *  - **Fail closed upward.** Nothing here installs, prompts or silently skips:
 *    an environment with none of the set is a typed refusal naming every
 *    candidate it tried, why it was ineligible, and the one repair.
 *
 * The module is pure input → output: the environment, the manifest and the PATH
 * probe are injected, so the suite runs it offline against fake executables that
 * print the pinned versions, and no probe is cached between calls.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { delimiter, join } from "node:path";

/** The shape this module publishes; the crate suite pins it to its siblings. */
export const RESOLVER_CONTRACT_ID = "runner-resolver@1";

/** The one package every candidate launches, at the pin the contract carries. */
export const RUNNER_PACKAGE = "@gtrabanco/agentic-workflow";

/**
 * The closed set, in the order it is tried. `program` is what must be on PATH,
 * `floor` is the manifest key its version is compared with (`null` = no version
 * floor), `prefix` is the invocation as tokens (the `<pin>` placeholder is
 * replaced at answer time), and `also` names a second program whose floor only
 * binds when that program is present (pnpm standalone ships its own runtime).
 */
export const RUNNER_CANDIDATES = Object.freeze([
  Object.freeze({
    id: "bunx",
    program: "bun",
    floor: "bun",
    prefix: Object.freeze(["bunx", `${RUNNER_PACKAGE}@<pin>`]),
    also: null,
  }),
  Object.freeze({
    id: "npx",
    program: "node",
    floor: "node",
    prefix: Object.freeze(["npx", "--yes", `${RUNNER_PACKAGE}@<pin>`]),
    also: null,
  }),
  Object.freeze({
    id: "pnpm dlx",
    program: "pnpm",
    floor: null,
    prefix: Object.freeze(["pnpm", "dlx", `${RUNNER_PACKAGE}@<pin>`]),
    also: Object.freeze({ program: "node", floor: "node" }),
  }),
]);

/**
 * The resolver's refusal. `attempts` carries one row per candidate
 * (`{id, ok, reason}`), so a caller reports the same evidence the resolver
 * used; the message names every candidate and the repair.
 */
export class RunnerResolutionError extends Error {
  constructor(message, attempts = []) {
    super(message);
    this.name = "RunnerResolutionError";
    this.code = "no-runner";
    this.attempts = attempts;
  }
}

/** Render one candidate's invocation for a pin and a subcommand's arguments. */
export function renderInvocation(candidate, pin, args = []) {
  return [...candidate.prefix.map((token) => token.replace("<pin>", pin)), ...args].join(" ");
}

/** A manifest floor (`>=X.Y`) as `[major, minor]`; anything else is a refusal. */
const FLOOR_SPEC = /^>=\s*(\d+)(?:\.(\d+))?/u;

function floorOf(manifest, key) {
  const spec = String(manifest?.engines?.[key] ?? "");
  const match = FLOOR_SPEC.exec(spec);
  if (match === null) {
    throw new RunnerResolutionError(
      `cannot derive the crate's engines.${key} floor from ${JSON.stringify(spec)} — refusing to guess which runtimes are supported`,
    );
  }
  return [Number(match[1]), Number(match[2] ?? 0)];
}

const VERSION = /(\d+)(?:\.(\d+))?/u;

/** Whether a probe's reported version meets `[major, minor]`; unreadable is below. */
function meets(version, [major, minor]) {
  const match = VERSION.exec(String(version ?? ""));
  if (match === null) return false;
  const found = [Number(match[1]), Number(match[2] ?? 0)];
  return found[0] > major || (found[0] === major && found[1] >= minor);
}

/**
 * The default PATH probe: an executable is `has` when a PATH entry holds a
 * regular file of that name (the resolution a shell performs), and its version
 * is the first line of `--version` — a probe that cannot run reports `null`,
 * never a guessed version.
 */
function pathProbe(env) {
  const entries = String(env.PATH ?? env.Path ?? "").split(delimiter).filter(Boolean);
  return {
    has(program) {
      return entries.some((dir) => {
        try {
          return statSync(join(dir, program)).isFile();
        } catch {
          return false;
        }
      });
    },
    version(program) {
      const probe = spawnSync(program, ["--version"], { encoding: "utf8", timeout: 15_000, env });
      if (probe.error !== undefined || probe.status !== 0) return null;
      const first = String(probe.stdout ?? "").trim().split("\n")[0].trim();
      return first === "" ? null : first;
    },
  };
}

/** This package's own manifest: the pin and the floors are read, never restated. */
function defaultManifest() {
  return JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
}

/**
 * Answer the runner choice.
 *
 * @param {object} [options]
 * @param {string[]} [options.args] the subcommand and its arguments
 * @param {object} [options.env] the environment (defaults to `process.env`)
 * @param {object} [options.manifest] the crate manifest (defaults to this package's)
 * @param {{program: string, script: string}|null} [options.installed] a caller's
 *   already-installed crate bin, tried after the override and before the set
 * @param {{has: (program: string) => boolean, version: (program: string) => string|null}} [options.probe]
 * @returns {{source: string, program: string, argv: string[], attempts: object[]}}
 * @throws {RunnerResolutionError} when nothing resolves
 */
export function resolveRunner({ args = [], env = process.env, manifest = defaultManifest(), installed = null, probe = null } = {}) {
  const probes = probe ?? pathProbe(env);

  const override = String(env.AGENTIC_WORKFLOW_RUNNER ?? "").trim();
  if (override !== "") {
    const argv = override.split(/\s+/u).filter(Boolean);
    return { source: "AGENTIC_WORKFLOW_RUNNER", program: argv[0], argv: [...argv, ...args], attempts: [] };
  }

  if (installed !== null && typeof installed?.script === "string" && existsSync(installed.script)) {
    return {
      source: "installed",
      program: installed.program,
      argv: [installed.program, installed.script, ...args],
      attempts: [],
    };
  }

  const floors = { bun: floorOf(manifest, "bun"), node: floorOf(manifest, "node") };
  const attempts = [];

  for (const candidate of RUNNER_CANDIDATES) {
    const ineligible = (reason) => attempts.push({ id: candidate.id, ok: false, reason });
    if (!probes.has(candidate.program)) {
      ineligible(`${candidate.program} absent`);
      continue;
    }
    const reported = probes.version(candidate.program);
    if (reported === null) {
      ineligible(`${candidate.program} --version failed`);
      continue;
    }
    if (candidate.floor !== null && !meets(reported, floors[candidate.floor])) {
      ineligible(`${candidate.program} ${reported} below >=${floors[candidate.floor].join(".")}`);
      continue;
    }
    if (candidate.also !== null && probes.has(candidate.also.program)) {
      const alsoReported = probes.version(candidate.also.program);
      if (alsoReported === null || !meets(alsoReported, floors[candidate.also.floor])) {
        ineligible(`${candidate.also.program} ${alsoReported ?? "did not answer"} below >=${floors[candidate.also.floor].join(".")}`);
        continue;
      }
    }
    const argv = [...candidate.prefix.map((token) => token.replace("<pin>", String(manifest.version))), ...args];
    attempts.push({ id: candidate.id, ok: true, reason: `launches ${RUNNER_PACKAGE}@${manifest.version}` });
    return { source: candidate.id, program: argv[0], argv, attempts };
  }

  throw new RunnerResolutionError(
    `no runner resolved: set AGENTIC_WORKFLOW_RUNNER, or install bun >=${floors.bun.join(".")}, node >=${floors.node.join(".")} or pnpm — tried: ${attempts
      .map((attempt) => `${attempt.id} (${attempt.reason})`)
      .join("; ")}`,
    attempts,
  );
}
