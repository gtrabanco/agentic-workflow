/**
 * The durable-subagents layer's provisioning contract (issue #726, defect 2).
 *
 * `pi.extensions` entries are resolved with `path.resolve(packageDir, entry)` and
 * kept only when the file exists; a void path is dropped with no diagnostic.
 * The dependency's `./node_modules/pi-extensible-workflows/dist/subagents/index.js`
 * only exists when npm nests dependencies — a hoisted install (npm v11 default,
 * and bun's global strategy) has no nested `node_modules`, so the layer never
 * loaded and nothing said so.
 *
 * This module owns the resolution instead: the dependency is located with Node's
 * package algorithm, which walks up from our own directory and therefore finds
 * it in both layouts. A package-owned shim (`subagents-entry.ts`) is the manifest
 * entry; a resolution or load failure becomes one session-level diagnostic that
 * names the entry, never a silent skip.
 *
 * Nothing here imports the dependency statically: it is an optional runtime
 * layer, and a broken or absent install must degrade, not fail the package.
 */

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** The package that ships the durable-subagents extension. */
export const SUBAGENTS_PACKAGE = "pi-extensible-workflows";

/** The entry, relative to that package's root. */
export const SUBAGENTS_ENTRY = "dist/subagents/index.js";

/** The entry as a person reads it in a diagnostic. */
export const SUBAGENTS_ENTRY_LABEL = `${SUBAGENTS_PACKAGE}/${SUBAGENTS_ENTRY}`;

export type SubagentsResolution = { ok: true; path: string } | { ok: false; reason: string };

export interface SubagentsProvisionOptions {
  /** The module URL (or absolute path) resolution starts from; a test seam. */
  from?: string;
  /** The loader; defaults to a dynamic `import()`. A test seam. */
  load?: (href: string) => Promise<unknown>;
}

export interface SubagentsProvisionResult {
  status: "loaded" | "unavailable";
  entry: string;
  reason?: string;
}

/** A path or `file:` URL as a filesystem path. */
function asPath(from: string): string {
  return from.startsWith("file:") ? fileURLToPath(from) : from;
}

/** The error text a diagnostic may quote. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Walk up from `start` to the directory whose `package.json` names `name`. The
 * walk ends at the filesystem root, not at a fixed depth: Node's resolution
 * already found the package's entry, so the package root is always reachable
 * and a private copy in a deep `node_modules` store stays findable. A malformed
 * or foreign manifest is skipped, never thrown on: this runs before any
 * user-visible surface exists.
 */
function findPackageRoot(start: string, name: string): string | null {
  let current = start;
  for (;;) {
    const manifestPath = join(current, "package.json");
    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { name?: unknown };
        if (manifest.name === name) return current;
      } catch {
        // A manifest this walk cannot read is not the package it is looking for.
      }
    }
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/**
 * Resolve the dependency's subagents entry from `from` (default: this module).
 * `createRequire` is Node's own package resolution, so a hoisted sibling and a
 * nested dependency both answer; the walk then locates the package root without
 * assuming a `node_modules` depth.
 */
export function resolveSubagentsEntry(from: string = import.meta.url): SubagentsResolution {
  const fromPath = asPath(from);
  let main: string;
  try {
    main = createRequire(fromPath).resolve(SUBAGENTS_PACKAGE);
  } catch (error) {
    return {
      ok: false,
      reason: `${SUBAGENTS_PACKAGE} does not resolve from ${dirname(fromPath)} (${messageOf(error)})`,
    };
  }
  const root = findPackageRoot(dirname(main), SUBAGENTS_PACKAGE);
  if (root === null) {
    return { ok: false, reason: `${SUBAGENTS_PACKAGE} resolves to ${main}, which is not inside its package root` };
  }
  const entry = join(root, SUBAGENTS_ENTRY);
  if (!existsSync(entry)) {
    return { ok: false, reason: `${SUBAGENTS_PACKAGE} resolves to ${root} but ships no ${SUBAGENTS_ENTRY}` };
  }
  return { ok: true, path: entry };
}

/** The one-line message a failed provision leaves the session. */
export function subagentsDiagnostic(reason: string): string {
  return (
    `pi-agentic-workflow: the durable-subagents layer did not load — ${reason}. ` +
    `Expected ${SUBAGENTS_ENTRY_LABEL}. Reinstall the package, or remove the ` +
    `./dist/extension/subagents-entry.js entry from this package's pi.extensions to disable the layer deliberately.`
  );
}

/**
 * Register the diagnostic on the session, once. An extension factory has no UI
 * context, so the message is delivered at `session_start`, the first point a
 * handler receives `ctx.ui`. A host with no `on` cannot receive it; nothing
 * throws on the load path.
 */
function reportAtSessionStart(host: unknown, reason: string): void {
  const on = (host as { on?: unknown } | null)?.on;
  if (typeof on !== "function") return;
  let reported = false;
  (on as (event: string, handler: (event: unknown, ctx: unknown) => void) => void).call(
    host,
    "session_start",
    (_event, ctx) => {
      if (reported) return;
      reported = true;
      const ui = (ctx as { ui?: { notify?: (message: string, kind: string) => void } } | null)?.ui;
      ui?.notify?.(subagentsDiagnostic(reason), "warning");
    },
  );
}

function unavailable(host: unknown, reason: string): SubagentsProvisionResult {
  reportAtSessionStart(host, reason);
  return { status: "unavailable", entry: SUBAGENTS_ENTRY_LABEL, reason };
}

/**
 * Resolve and load the dependency's subagents extension with the host API, so
 * its tools register in the session. Any failure returns `unavailable` and
 * leaves exactly one session diagnostic; the caller never has to branch.
 */
export async function provisionSubagents(
  host: unknown,
  options: SubagentsProvisionOptions = {},
): Promise<SubagentsProvisionResult> {
  const resolved = resolveSubagentsEntry(options.from ?? import.meta.url);
  if (!resolved.ok) return unavailable(host, resolved.reason);

  const load = options.load ?? ((href: string) => import(href));
  let factory: unknown;
  try {
    const module = (await load(pathToFileURL(resolved.path).href)) as { default?: unknown } | null;
    factory = module?.default ?? module;
  } catch (error) {
    return unavailable(host, `loading it failed: ${messageOf(error)}`);
  }
  if (typeof factory !== "function") {
    return unavailable(host, `its module exports no factory function (${resolved.path})`);
  }
  try {
    await (factory as (api: unknown) => unknown)(host);
  } catch (error) {
    return unavailable(host, `its factory threw: ${messageOf(error)}`);
  }
  return { status: "loaded", entry: resolved.path };
}
