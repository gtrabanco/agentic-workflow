#!/usr/bin/env node

/**
 * The bounded gate — which suites a changed path must run (#318 S13/S14).
 *
 * The root gate (`run-root-suite.mjs`) is all-or-nothing by design, and it stays
 * exactly that at the merge gate and in CI. What it cannot serve is the
 * intermediate checkpoint: a repair loop that pays the full pass per iteration
 * gets skipped instead of paid, which is the failure mode S5's claim-evidence
 * loop exists to prevent.
 *
 * This planner answers one question — "which suites does THIS path need?" — from
 * a committed map (`scripts/test-route-map.json`), never from inference.
 *
 * Fail-closed is the whole safety property (S14): an unmatched path, an
 * unreadable map, a route whose suites do not exist, or a glob that selects
 * nothing all answer the FULL suite. Fewer tests than the full gate is
 * reachable only through a matched, committed glob naming suites that exist.
 *
 * Usage
 *   node scripts/test-route.mjs --check <path>   # the route for one path
 *   node scripts/test-route.mjs --list          # every route the map declares
 *
 * Exit: 0 a plan was printed; 1 a usage error or an unknown argument. This
 * planner writes nothing.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const MAP_PATH = path.join(REPO_ROOT, "scripts", "test-route-map.json");
const FULL_SUITE = "full-suite";

/**
 * Read the committed map. A missing, unreadable or malformed map is returned as
 * `{ error }` — the caller answers the full suite rather than guessing, because
 * a map this planner cannot trust must never cost coverage.
 *
 * @param {string} mapPath
 */
export function loadMap(mapPath = MAP_PATH) {
  let raw;
  try {
    raw = fs.readFileSync(mapPath, "utf8");
  } catch (error) {
    return { routes: [], error: `unreadable map: ${error.code ?? error.message}` };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { routes: [], error: "unreadable map: not valid JSON" };
  }
  if (!parsed || !Array.isArray(parsed.routes)) {
    return { routes: [], error: "unreadable map: no routes array" };
  }
  const routes = [];
  for (const entry of parsed.routes) {
    if (!entry || typeof entry.name !== "string") continue;
    const globs = Array.isArray(entry.globs) ? entry.globs.filter((g) => typeof g === "string") : [];
    const suites = Array.isArray(entry.suites) ? entry.suites.filter((s) => typeof s === "string") : [];
    if (globs.length === 0 || suites.length === 0) continue;
    routes.push({ name: entry.name, globs, suites });
  }
  if (routes.length === 0) return { routes: [], error: "unreadable map: no usable route" };
  return { routes };
}

/**
 * Translate a path glob into a matcher. `**` spans segments, `*` spans one
 * segment, and everything else is literal — the two wildcard forms the map uses,
 * so a glob can never silently behave like a different one.
 *
 * @param {string} glob
 */
function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === "*") {
      if (glob[i + 1] === "*") {
        // `**/` swallows the separator too, so `a/**` matches `a/b` and `a/b/c`.
        out += ".*";
        i += 1;
        if (glob[i + 1] === "/") i += 1;
      } else {
        out += "[^/]*";
      }
      continue;
    }
    out += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`);
}

/**
 * The plan for one path. `route` is the matched route name or `full-suite`;
 * `suites` is what must run; `reason` always explains the answer, so a reviewer
 * can see why a checkpoint was cheap instead of trusting it.
 *
 * @param {string} changedPath — repo-relative
 * @param {{routes: Array, error?: string}} map
 * @param {{root?: string, allSuites?: string[]}} [options]
 */
export function routeFor(changedPath, map, options = {}) {
  const root = options.root ?? REPO_ROOT;
  const normalize = (p) => p.replace(/\\/g, "/").replace(/^\.\//, "");
  const target = normalize(changedPath);
  const all = options.allSuites ?? everySuite(root);

  if (map.error) {
    return { route: FULL_SUITE, suites: all, reason: map.error };
  }

  for (const entry of map.routes) {
    const hit = entry.globs.find((glob) => globToRegExp(glob).test(target));
    if (!hit) continue;
    const missing = entry.suites.filter((suite) => !fs.existsSync(path.join(root, suite)));
    if (missing.length > 0) {
      return { route: FULL_SUITE, suites: all, reason: `missing suite in route ${entry.name}: ${missing.join(", ")}` };
    }
    return { route: entry.name, suites: [...entry.suites], reason: `matched glob ${hit}` };
  }
  return { route: FULL_SUITE, suites: all, reason: `no glob matched ${target}` };
}

/**
 * Plan for a change set: the union of every path's route, or the full suite as
 * soon as one path is unmatched — one unmapped path never rides a cheap plan.
 *
 * @param {string[]} changedPaths
 * @param {{routes: Array, error?: string}} map
 * @param {{root?: string, allSuites?: string[]}} [options]
 */
export function planFor(changedPaths, map, options = {}) {
  const paths = Array.isArray(changedPaths) ? changedPaths : [changedPaths];
  const all = options.allSuites ?? everySuite(options.root ?? REPO_ROOT);
  const suites = new Set();
  const routes = [];
  for (const changed of paths) {
    const plan = routeFor(changed, map, { ...options, allSuites: all });
    routes.push({ path: changed, ...plan });
    if (plan.route === FULL_SUITE) {
      return { route: FULL_SUITE, suites: all, reason: plan.reason, routes };
    }
    for (const suite of plan.suites) suites.add(suite);
  }
  return {
    route: routes.length === 1 ? routes[0].route : "union",
    suites: [...suites].sort(),
    reason: routes.map((entry) => `${entry.path} -> ${entry.route}`).join("; "),
    routes,
  };
}

/** Every root suite, discovered the way the full gate discovers them. */
export function everySuite(root = REPO_ROOT) {
  return fs.readdirSync(path.join(root, "scripts"))
    .filter((name) => name.endsWith(".test.mjs"))
    .sort()
    .map((name) => `scripts/${name}`);
}

function printPlan(plan) {
  const lines = [
    `route: ${plan.route}`,
    `reason: ${plan.reason}`,
    `suites (${plan.suites.length}):`,
    ...plan.suites.map((suite) => `  ${suite}`),
  ];
  process.stdout.write(`${lines.join("\n")}\n`);
}

function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(
      "usage: node scripts/test-route.mjs --check <path> | --list\n\n"
      + "Prints the minimal suite route a changed path selects. An unmatched path,\n"
      + "an unreadable map, or a route naming a suite that does not exist answers the\n"
      + "full suite — never fewer tests. The planner writes nothing.\n",
    );
    return;
  }

  const known = new Set(["--check", "--list"]);
  const unknown = argv.find((arg) => arg.startsWith("-") && !known.has(arg));
  if (unknown) {
    process.stderr.write(`TEST ROUTE — error\nUnknown argument: ${unknown}\n`);
    process.exit(1);
  }

  if (argv.includes("--list")) {
    const map = loadMap();
    if (map.error) {
      process.stderr.write(`TEST ROUTE — error\n${map.error}\n`);
      process.exit(1);
    }
    const lines = map.routes.map((route) => `${route.name}\t${route.suites.length} suites\t${route.globs.join(", ")}`);
    process.stdout.write(`${lines.join("\n")}\n`);
    return;
  }

  const index = argv.indexOf("--check");
  if (index === -1) {
    process.stderr.write("TEST ROUTE — error\nusage: node scripts/test-route.mjs --check <path> | --list\n");
    process.exit(1);
  }
  const changed = argv[index + 1];
  if (!changed || changed.startsWith("-")) {
    process.stderr.write("TEST ROUTE — error\n--check requires a path\n");
    process.exit(1);
  }

  printPlan(routeFor(changed, loadMap()));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
