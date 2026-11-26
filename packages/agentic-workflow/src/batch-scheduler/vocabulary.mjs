// vocabulary.mjs — the batch scheduler's lane vocabulary (issue #716).
//
// One owner for the only rule that turns a path into a lane key. Until this
// module existed, the two functions that produced keys carried this
// repository's own trees inline — `skills/<name>`, `packages/<name>`,
// `scripts`, `docs`, `template`, `.github` — so every other project resolved
// nothing, degraded every issue to `surface-unknown`, and ran fully serial.
//
// Three layers, in this order:
//
//   1. **the shipped roots** — the trees this workflow itself ships with. Always
//      recognized, so no existing declaration and no section of this repository
//      changes lane because the vocabulary became project-aware.
//   2. **the project's declared roots** — `batchScheduler.surfaces` in the
//      project config. Authoritative for that project: a tree it does not name
//      resolves to nothing, because a project that declares its lanes has said
//      which trees may run beside each other.
//   3. **the project's own tree** — its existing top-level directories and each
//      of their existing children, discovered only while nothing is declared.
//      This is what keeps a foreign tree schedulable before anyone configures
//      it, and it is bounded on purpose: a directory that is not a lane
//      (`node_modules`) and a hidden directory are never one.
//
// The matching rule: the deepest entry whose segments prefix the token wins, so
// a declared `src/pages` refines a discovered `src`; a token that is a prefix of
// an entry names that tree's root. Placementholders and wildcards are notation,
// never lanes.

import fs from "node:fs";
import path from "node:path";

import { createConfigApi } from "../config/api.mjs";

/** Directories that are never a lane, whatever the project's tree carries. */
const NEVER_A_LANE = new Set(["node_modules"]);

/**
 * The trees this workflow ships with, in the order the documentation lists them.
 *
 * `family: true` keeps one child segment in the key — `skills/<name>` and
 * `packages/<name>` are the two multi-unit trees of the authoring repository,
 * and collapsing them to their root would serialize every skill against every
 * other. A new shipped root is an edit here plus its tests: no doc and no
 * consumer carries a second copy of this list.
 */
export const SHIPPED_SURFACE_ROOTS = Object.freeze([
  Object.freeze({ path: Object.freeze(["skills"]), family: true }),
  Object.freeze({ path: Object.freeze(["packages"]), family: true }),
  Object.freeze({ path: Object.freeze(["scripts"]), family: false }),
  Object.freeze({ path: Object.freeze(["docs"]), family: false }),
  Object.freeze({ path: Object.freeze(["template"]), family: false }),
  Object.freeze({ path: Object.freeze([".github"]), family: false }),
]);

/** One slug for one cause — the `degraded[]` grammar's own alphabet. */
export function sanitizeCause(cause) {
  const text = String(cause?.message ?? cause ?? "error").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return text.slice(0, 40) || "error";
}

/** A path token as its segments, or null when it names nothing. */
function segments(raw) {
  const clean = String(raw ?? "").trim().replace(/^\.\//u, "").replace(/(?:\/|\*)+$/u, "");
  if (clean === "") return null;
  const parts = clean.split("/").filter(Boolean);
  return parts.length === 0 ? null : parts;
}

/** Whether `entry` is a prefix of `parts` (`inside`) or `parts` a prefix of it (`root`). */
function relation(entry, parts) {
  if (parts.length >= entry.length && entry.every((segment, index) => segment === parts[index])) return "inside";
  if (entry.length >= parts.length && parts.every((segment, index) => segment === entry[index])) return "root";
  return null;
}

/** The stronger of two candidates: `inside` over `root`, then the deeper entry. */
function stronger(current, candidate) {
  if (current === null) return candidate;
  if (candidate.kind !== current.kind) return candidate.kind === "inside" ? candidate : current;
  if (candidate.entry.path.length !== current.entry.path.length) {
    return candidate.entry.path.length > current.entry.path.length ? candidate : current;
  }
  return candidate.entry.path.join("/") < current.entry.path.join("/") ? candidate : current;
}

/**
 * One token against one entry set.
 *
 * @returns {{state: "none"} | {state: "refused"} | {state: "key", key: string}}
 *   `refused` is not `none`: a `<name>` metavariable inside a family tree is
 *   notation, and a caller must not go looking for the token somewhere else.
 */
function keyFrom(raw, entries) {
  const parts = segments(raw);
  if (parts === null) return { state: "none" };
  let best = null;
  for (const entry of entries) {
    const kind = relation(entry.path, parts);
    if (kind === null) continue;
    if (entry.family && kind === "inside" && parts.length > entry.path.length) {
      const child = parts[entry.path.length];
      if (/[<>]/u.test(child)) return { state: "refused" };
      const key = /^\*+$/u.test(child) ? undefined : [...entry.path, child].join("/");
      best = stronger(best, { entry, kind, key: key ?? entry.path.join("/") });
      continue;
    }
    // A tree root (`kind === "root"`) keeps the token's own spelling, so a bare
    // `src` stays `src` and the lane derivation joins it to the concrete lanes.
    const key = kind === "inside" ? entry.path.join("/") : parts.join("/");
    best = stronger(best, { entry, kind, key });
  }
  return best === null ? { state: "none" } : { state: "key", key: best.key };
}

/** The directories of one level, sorted, with the never-a-lane names removed. */
function childDirectories(dir) {
  let dirents;
  try {
    dirents = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return dirents
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && !NEVER_A_LANE.has(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * The project's own lane candidates: every top-level directory and each of its
 * children. Bounded to two segments on purpose — a deeper key would split one
 * tree into lanes nobody declared (`apps/web/src` is one lane at `apps/web`),
 * and a project that wants finer lanes declares them.
 */
export function discoverSurfaceRoots(root) {
  const entries = [];
  for (const name of childDirectories(root)) {
    entries.push({ path: [name], family: false, source: "discovered" });
    for (const child of childDirectories(path.join(root, name))) {
      entries.push({ path: [name, child], family: false, source: "discovered" });
    }
  }
  return entries;
}

/**
 * The declared entries, read through the same config API the `config` CLI uses,
 * so an operator reading `config get batchScheduler.surfaces` and the planner can
 * never disagree about "absent" or about which value is refused.
 *
 * @returns {string[]} the declared project-relative directories (empty = undeclared)
 */
export function readDeclaredSurfaces({ root } = {}) {
  const { value } = createConfigApi({ projectDir: root }).get("project", ["batchScheduler", "surfaces"]);
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
}

/** The vocabulary the exported readers use when no project root is known. */
export const SHIPPED_VOCABULARY = Object.freeze({
  roots: Object.freeze(SHIPPED_SURFACE_ROOTS.map((entry) => Object.freeze({ ...entry, source: "shipped" }))),
  declared: false,
  degradations: Object.freeze([]),
  discoveredRoots: () => [],
});

/**
 * Resolve a project's vocabulary.
 *
 * The discovery layer is computed on the first token the shipped and declared
 * roots do not answer, and never computed again — a run reads the tree at most
 * once, and a project that declares its lanes never reads it at all.
 *
 * @param {{root?: string, readConfig?: Function}} [options]
 * @returns {{
 *   roots: Array<{path: string[], family: boolean, source: string}>,
 *   declared: boolean,
 *   degradations: string[],
 *   discoveredRoots: () => Array<{path: string[], family: boolean, source: string}>,
 * }}
 */
export function resolveSurfaceVocabulary({ root = null, readConfig = readDeclaredSurfaces } = {}) {
  const degradations = [];
  let declaredSurfaces = [];
  try {
    declaredSurfaces = root === null ? [] : readConfig({ root });
  } catch (cause) {
    // A config the resolver refuses is never read as "undeclared": a project
    // whose file is broken must not silently look like one with no extra trees.
    degradations.push(`unavailable-surface-vocabulary-${sanitizeCause(cause)}`);
  }
  const declared = declaredSurfaces.length > 0;
  const roots = [
    ...SHIPPED_SURFACE_ROOTS.map((entry) => ({ path: [...entry.path], family: entry.family, source: "shipped" })),
    ...declaredSurfaces.map((surface) => ({
      path: String(surface).split("/").filter(Boolean),
      family: false,
      source: "declared",
    })),
  ];
  let discovered = null;
  const discoveredRoots = () => {
    if (discovered === null) {
      discovered = declared || root === null || degradations.length > 0 ? [] : discoverSurfaceRoots(root);
    }
    return discovered;
  };
  return { roots, declared, degradations, discoveredRoots };
}

/**
 * One path token as a lane key: the shipped roots first, the project's own tree
 * only when they answer nothing.
 *
 * @param {string} raw the token as the body or the diff spells it
 * @param {{roots: Array<object>, discoveredRoots: Function}} vocabulary
 * @returns {string|null}
 */
export function surfaceKey(raw, vocabulary = SHIPPED_VOCABULARY) {
  const shippedOrDeclared = keyFrom(raw, vocabulary.roots);
  if (shippedOrDeclared.state === "key") return shippedOrDeclared.key;
  if (shippedOrDeclared.state === "refused") return null;
  const discovered = keyFrom(raw, vocabulary.discoveredRoots());
  return discovered.state === "key" ? discovered.key : null;
}
