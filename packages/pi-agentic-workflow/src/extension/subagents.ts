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
 *
 * Issue #755 hardened the host side of that resolution. The dependency imports
 * the host through the bare specifier `@earendil-works/pi-coding-agent`, so its
 * import binds whatever the extension sandbox hoists — and `pi update --all`
 * never refreshes a hoisted peer with no direct requester, so that copy can
 * predate the export the layer needs. A stale copy is therefore a *loading*
 * failure of the dependency, not of this package. This module answers it where
 * the truth lives: the check judges the copy the dependency's own import will
 * bind — a satisfying one loads the layer silently, an unsatisfying one becomes
 * a diagnostic naming its version and the one-line repair instead of a
 * reinstall that never helps — and a nameable running host only adds what it
 * can say, never rescues a binding the dependency does not use.
 */

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseSemver, semverGt } from "@gtrabanco/agentic-workflow/src/dependency/versions.mjs";

/** The package that ships the durable-subagents extension. */
export const SUBAGENTS_PACKAGE = "pi-extensible-workflows";

/** The host whose module the dependency binds through a bare specifier. */
export const HOST_PACKAGE = "@earendil-works/pi-coding-agent";

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
  /**
   * The running host's own module file, when the caller can name it. A host
   * module that satisfies the peer range wins over a stale sandbox copy; absent,
   * the sandbox's bare-specifier resolution is the only candidate.
   */
  hostModule?: string;
  /** This package's manifest, for the declared peer range. A test seam. */
  manifest?: unknown;
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

/** The message for a host the dependency binds but the peer range refuses. A
 * reinstall never reaches the hoisted copy (issue #755), so that instruction is
 * replaced by the repair that does, and the disable target is kept. The opening
 * clause stays the one operators and tests key on. `note` adds what a nameable
 * running host can say about its own satisfaction.
 */
export function peerDiagnostic(finding: HostFinding, spec: string | null, note = ""): string {
  return (
    `pi-agentic-workflow: the durable-subagents layer did not load — ${hostFindingReason(finding, spec)}${note}. ` +
    `Expected ${SUBAGENTS_ENTRY_LABEL}. To disable the layer deliberately, remove the ` +
    `./dist/extension/subagents-entry.js entry from this package's pi.extensions.`
  );
}

/**
 * The peer spec this package declares for the host, read from its own manifest
 * — never restated as a literal, so moving the floor moves the check with it.
 * The manifest is two levels above `dist/extension/`.
 */
export function peerRange(manifest?: unknown): string | null {
  const source = manifest ?? readOwnManifest();
  const spec = (source as { peerDependencies?: Record<string, unknown> } | null)?.peerDependencies?.[HOST_PACKAGE];
  return typeof spec === "string" && spec.trim() !== "" ? spec.trim() : null;
}

/** This package's own manifest, or `null` when it cannot be read. */
function readOwnManifest(): unknown {
  try {
    return JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json"), "utf8"));
  } catch {
    return null;
  }
}

/**
 * Whether `version` satisfies a `>=X.Y.Z` floor — the only shape this package
 * declares. Any other spec is unenforceable here and answers `false`: the
 * check fails closed and reports the range as unmet rather than claiming a
 * satisfaction nobody checked.
 */
export function satisfiesPeerRange(version: string | null, spec: string | null): boolean {
  if (version === null || spec === null) return false;
  const floor = /^>=\s*(\S+)$/u.exec(spec);
  if (floor === null) return false;
  if (parseSemver(version) === null || parseSemver(floor[1]) === null) return false;
  return !semverGt(floor[1], version);
}

/**
 * The version a host module file belongs to: the `version` of the package
 * manifest above its `dist/`. `null` when it cannot be read — a version this
 * package cannot prove is never reported as satisfying.
 */
export function readHostVersion(modulePath: string): string | null {
  const root = findPackageRoot(dirname(modulePath), HOST_PACKAGE);
  if (root === null) return null;
  try {
    const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: unknown };
    return typeof manifest.version === "string" ? manifest.version : null;
  } catch {
    return null;
  }
}

/** A host module the shim can bind, with the version it was proven to carry. */
export type HostModuleResolution =
  | { ok: true; path: string; version: string }
  | { ok: false; reason: string; finding: HostFinding };

/** What the host probe found, so the diagnostic can name the right repair. */
export type HostFinding =
  | { kind: "stale"; path: string; version: string | null }
  | { kind: "unreadable"; path: string }
  | { kind: "unresolved" };

/**
 * Resolve the best nameable host module: the running host when the caller can
 * name it, else what the sandbox's own resolution binds. This is knowledge for
 * the diagnostic, never the load gate — the gate is the copy the dependency's
 * import binds (`boundFinding`), because only that copy decides whether the
 * layer loads.
 */
export function resolveHostModule(
  options: { from?: string; hostModule?: string; manifest?: unknown } = {},
): HostModuleResolution {
  const spec = peerRange(options.manifest);
  const candidates: string[] = [];
  if (options.hostModule) candidates.push(options.hostModule);
  const sandbox = sandboxHostModule(options.from ?? import.meta.url);
  if (sandbox !== null && !candidates.includes(sandbox)) candidates.push(sandbox);

  if (candidates.length === 0) {
    return {
      ok: false,
      finding: { kind: "unresolved" },
      reason: `${HOST_PACKAGE} does not resolve from the extension sandbox, so the peer range ${spec ?? "(undeclared)"} cannot be checked`,
    };
  }

  let best: HostFinding | null = null;
  for (const path of candidates) {
    const version = readHostVersion(path);
    if (version === null) {
      best ??= { kind: "unreadable", path };
      continue;
    }
    if (satisfiesPeerRange(version, spec)) return { ok: true, path, version };
    best = { kind: "stale", path, version };
  }
  const finding = best ?? { kind: "unresolved" };
  return { ok: false, finding, reason: hostFindingReason(finding, spec) };
}

/** The module the dependency's bare specifier binds from the given start file. */
function sandboxHostModule(from: string): string | null {
  try {
    return createRequire(asPath(from)).resolve(HOST_PACKAGE);
  } catch {
    // A hoisted copy whose manifest carries no entry point still *is* the copy
    // the hoist exposes; walk to it rather than reporting it absent, so the
    // finding names an unreadable version instead of a missing package.
    const root = findHostPackageDir(dirname(asPath(from)));
    return root === null ? null : join(root, "dist", "index.js");
  }
}

/** Walk up from `start` for the host package directory, `node_modules` ignored. */
function findHostPackageDir(start: string): string | null {
  let current = start;
  for (;;) {
    const candidate = join(current, "node_modules", ...HOST_PACKAGE.split("/"));
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/** The phrase the diagnostic uses for a host finding — version first, repair second. */
export function hostFindingReason(finding: HostFinding, spec: string | null): string {
  const range = spec ?? "the declared peer range";
  if (finding.kind === "unreadable") {
    return `could not read the version of the ${HOST_PACKAGE} that the extension sandbox binds (${finding.path}), so ${range} cannot be checked`;
  }
  if (finding.kind === "stale") {
    return (
      `the extension sandbox resolves ${HOST_PACKAGE}@${finding.version ?? "?"} (${finding.path}), which does not satisfy ${range} — ` +
      `update it with \`bun add ${HOST_PACKAGE}\` in the sandbox's package manager directory (\`cd ~/.pi/agent/npm\`) and restart the session`
    );
  }
  return `the extension sandbox resolves no ${HOST_PACKAGE}, so the peer range ${range} cannot be checked`;
}

/**
 * Register the diagnostic on the session, once. An extension factory has no UI
 * context, so the message is delivered at `session_start`, the first point a
 * handler receives `ctx.ui`. A host with no `on` cannot receive it; nothing
 * throws on the load path.
 */
function reportAtSessionStart(host: unknown, message: string): void {
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
      ui?.notify?.(message, "warning");
    },
  );
}

function unavailable(host: unknown, reason: string): SubagentsProvisionResult {
  reportAtSessionStart(host, subagentsDiagnostic(reason));
  return { status: "unavailable", entry: SUBAGENTS_ENTRY_LABEL, reason };
}

/**
 * The finding for the copy the dependency's own import will bind: resolution
 * starts at its entry, the same `node_modules` walk its bare specifier runs, so
 * the verdict is about the effective binding — never about a fresher copy that
 * sits closer to this package or about a running host the dependency does not
 * import through. `null` means the binding satisfies the range.
 */
function boundFinding(entry: string, spec: string | null): HostFinding | null {
  const path = sandboxHostModule(entry);
  if (path === null) return { kind: "unresolved" };
  const version = readHostVersion(path);
  if (version === null) return { kind: "unreadable", path };
  if (satisfiesPeerRange(version, spec)) return null;
  return { kind: "stale", path, version };
}

function unavailableForHost(host: unknown, finding: HostFinding, spec: string | null, reason: string, note = ""): SubagentsProvisionResult {
  reportAtSessionStart(host, peerDiagnostic(finding, spec, note));
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

  // The peer check judges the copy the dependency's own bare specifier will
  // bind (issue #755): resolution starts at its entry, the same node_modules
  // walk its import runs. A nameable running host informs the warning but never
  // rescues a stale binding — the dependency does not import through it, so
  // accepting it here would reach the load and fail with the very export error
  // this check exists to replace.
  const spec = peerRange(options.manifest);
  const finding = boundFinding(resolved.path, spec);
  if (finding !== null) {
    const running =
      options.hostModule === undefined
        ? null
        : resolveHostModule({ from: resolved.path, hostModule: options.hostModule, manifest: options.manifest });
    const note =
      running !== null && running.ok && running.path === options.hostModule
        ? ` (the running ${HOST_PACKAGE}@${running.version} satisfies it)`
        : "";
    return unavailableForHost(host, finding, spec, hostFindingReason(finding, spec), note);
  }

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
