/**
 * runner-bin — where the runtime commands live, resolved programmatically.
 *
 * The workflow's sensors and guards ship inside `@gtrabanco/agentic-workflow`
 * (feature 91, issue #352), not in a project's `scripts/`. pi always has that
 * package as its own dependency, so the first answer is its bin path
 * (`createRequire`, no download, no PATH, nothing to choose) — the question
 * issue #555 removes from prose.
 *
 * When the installed copy is missing, the choice is still not prose: the crate's
 * own resolver (`@gtrabanco/agentic-workflow/src/runner/resolve.mjs`) answers the
 * closed set `bunx` → `npx --yes` → `pnpm dlx` at the crate's exact pin, gated
 * by the crate's own `engines`. That module ships with the crate, so a tree that
 * cannot resolve the bin cannot resolve the resolver either — and the honest
 * answer there is a refusal naming the missing dependency and the override, which
 * is what `runnerLaunch` throws. One implementation, two consumers: this module
 * and the crate's `runner resolve` command.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { runtimeBin } from "./runtime.js";

const CRATE = "@gtrabanco/agentic-workflow";
const require = createRequire(import.meta.url);

/** The resolver module's shape — the two exports pi reads. */
interface ResolverModule {
  resolveRunner(options: {
    args: string[];
    env: NodeJS.ProcessEnv;
    manifest: unknown;
    installed: { program: string; script: string } | null;
  }): RunnerAnswer;
  RunnerResolutionError: new (message: string, attempts?: unknown[]) => Error;
}

/** The answer the resolver composes: what to spawn, and which route answered. */
export interface RunnerAnswer {
  source: string;
  program: string;
  argv: string[];
}

/** A runner that could not be composed at all — reported, never guessed past. */
export class RunnerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunnerUnavailableError";
  }
}

export interface RunnerLaunchDeps {
  /** The environment the candidate probes read; defaults to `process.env`. */
  env?: NodeJS.ProcessEnv;
  /**
   * A caller's installed candidate, tried after the override. Omitted means
   * "sniff it": the crate bin this package resolves, under the runtime that
   * launched pi. `null` forces the closed set (the test seam).
   */
  installed?: { program: string; script: string } | null;
}

let installedBin: string | null | undefined;

/**
 * The absolute path of the installed crate bin, or `null` when this package
 * cannot resolve its own dependency. Resolved once: a module-level cache would
 * hide a repaired install, and this value cannot change under a live process.
 */
export function runnerBin(): string | null {
  if (installedBin === undefined) {
    try {
      installedBin = require.resolve(`${CRATE}/bin/agentic-workflow.mjs`);
    } catch {
      installedBin = null;
    }
  }
  return installedBin;
}

/** The installed candidate the resolver tries before the closed set. */
export function installedCandidate(program: string = runtimeBin()): { program: string; script: string } | null {
  const script = runnerBin();
  return script === null ? null : { program, script };
}

let resolver: Promise<ResolverModule> | null = null;

/** Load the crate's resolver once; a failed load is not retried per call. */
function loadResolver(): Promise<ResolverModule> {
  resolver ??= (async () => {
    try {
      const path = require.resolve(`${CRATE}/src/runner/resolve.mjs`);
      return (await import(pathToFileURL(path).href)) as ResolverModule;
    } catch (error) {
      throw new RunnerUnavailableError(
        `the runner crate (${CRATE}) is not resolvable from this package: ${
          error instanceof Error ? error.message : String(error)
        } — reinstall the package, or set AGENTIC_WORKFLOW_RUNNER to a working checkout's bin`,
      );
    }
  })();
  return resolver;
}

/** The crate's own manifest — the pin and the engine floors, never restated here. */
function crateManifest(): unknown {
  return JSON.parse(readFileSync(require.resolve(`${CRATE}/package.json`), "utf8"));
}

/**
 * The crate's own version, or `null` when this package cannot resolve its
 * dependency. This is the train a printed instruction must name: the dependency
 * pin rides the same train (D-40-14), so the version read here is the one an
 * install of this package fetches — no literal to rot, no `latest` to drift.
 */
export function crateVersion(): string | null {
  try {
    const manifest = crateManifest() as { version?: unknown };
    const version = typeof manifest.version === "string" ? manifest.version.trim() : "";
    return version === "" ? null : version;
  } catch {
    return null;
  }
}

/**
 * The exact-version launcher for a printed instruction (issue #710 S7):
 * `bunx @gtrabanco/agentic-workflow@<version> <args…>`, or `null` when no version
 * can be read. A caller that gets `null` must say what to run without naming a
 * package it cannot version — never fall back to the scope-less name, which
 * resolves to nothing.
 */
export function exactVersionLauncher(args: readonly string[]): string | null {
  const version = crateVersion();
  return version === null ? null : `bunx ${CRATE}@${version} ${args.join(" ")}`;
}

/**
 * Compose the command that runs one runner subcommand.
 *
 * Order (the resolver's, not pi's): the documented `AGENTIC_WORKFLOW_RUNNER`
 * override, then the installed crate bin under the runtime that launched pi,
 * then the crate's closed runner set. The override is honoured even when the
 * crate is unresolvable — it is the escape hatch that repairs exactly that
 * install — and it is tokenised, so the spaced `bun /abs/path` form the contract
 * documents works here too.
 *
 * @param args the subcommand and its arguments
 * @throws {RunnerUnavailableError} when nothing can be composed
 */
export async function runnerLaunch(args: string[], deps: RunnerLaunchDeps = {}): Promise<RunnerAnswer> {
  const env = deps.env ?? process.env;
  const override = String(env.AGENTIC_WORKFLOW_RUNNER ?? "").trim();
  if (override !== "") {
    const argv = override.split(/\s+/u).filter(Boolean);
    return { source: "AGENTIC_WORKFLOW_RUNNER", program: argv[0], argv: [...argv, ...args] };
  }

  const module = await loadResolver();
  const installed = deps.installed === undefined ? installedCandidate() : deps.installed;
  try {
    const answer = module.resolveRunner({ args, env, manifest: crateManifest(), installed });
    return { source: answer.source, program: answer.program, argv: answer.argv };
  } catch (error) {
    if (error instanceof module.RunnerResolutionError) throw new RunnerUnavailableError(error.message);
    throw error;
  }
}
