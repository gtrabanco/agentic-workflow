/**
 * relay.mjs — the doctor's Relay dispatch capability row (issue #705).
 *
 * The question the row answers is the one the lane used to learn at the
 * hand-off: can this session chain Relay legs? The issue's own scope decision
 * splits the answer by the repository's delimitation rule (generic = everything
 * observable without a live agent session):
 *
 *   - generic, and this check's — the PI WEB session marker, the session
 *     daemon endpoint PI WEB itself resolves, and the `@jmfederico/pi-relay`
 *     package as Pi's own settings declare it, with its two skills on disk;
 *   - pi-specific, and the host's — the session-dispatch bridge, a synchronous
 *     event `dispatch_relay` emits into its own session. No separate process can
 *     observe a live session's listeners, so the evidence carries the protocol
 *     id and `observable: false` with its owner, and no status claims a dispatch
 *     was attempted or a bridge was found.
 *
 * Read-only by construction: every reading goes through the doctor's injected
 * `ops` (files, directories, the environment), never a spawn, a socket connect
 * or an HTTP call. `@jmfederico/pi-relay` is `private: true` and ships inside the
 * PI WEB distribution, so nothing here asks a registry or installs anything.
 */

import path from "node:path";

import {
  SESSION_DISPATCH_PROTOCOL,
  RELAY_BRIDGE,
  piWebPresent,
  sessiondEndpoint,
} from "../runner/pi-web.mjs";
import { piAgentDir } from "./vehicle.mjs";

/** The package that owns the `relay` and `relay-runner` skills. */
export const RELAY_PACKAGE = "@jmfederico/pi-relay";
/** The two skills a Relay leg needs; the host declares them under `pi.skills`. */
export const RELAY_SKILLS = Object.freeze(["relay", "relay-runner"]);
/** The versioned host protocol the bridge would answer on — named, never dialled. */
export const RELAY_BRIDGE_PROTOCOL = SESSION_DISPATCH_PROTOCOL;
/** Where PI WEB ships the Relay package inside its own distribution. */
export const SHIPPED_RELAY_SEGMENTS = Object.freeze(["dist", "pi-packages", "relays"]);
/** The per-phase route the lane owns when Relay is not available. */
export const DEGRADATION_ROUTE = "→ Next: /execute-phase <NN-slug> P<k>";

/** The `packages` declarations of both settings files Pi loads packages from. */
function packageSources(ops, agentDir) {
  const sources = [];
  for (const settingsPath of [path.join(agentDir, "settings.json"), path.join(ops.root, ".pi", "settings.json")]) {
    const text = ops.readText(settingsPath);
    if (!text) continue;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      continue;
    }
    for (const entry of Array.isArray(parsed?.packages) ? parsed.packages : []) {
      const source = typeof entry === "string" ? entry : entry?.source;
      if (typeof source === "string" && source !== "") sources.push({ source, settingsPath });
    }
  }
  return sources;
}

/**
 * Resolve one settings declaration to the directory Pi loads it from: an `npm:`
 * spec into Pi's own install tree, a path as given (relative ones against the
 * settings file's own directory). A `git:` spec has no on-disk answer a probe can
 * read, so it resolves to `null` and is reported as unreadable rather than
 * guessed.
 */
function resolveSource(agentDir, source) {
  if (source.startsWith("npm:")) {
    const spec = source.slice("npm:".length);
    const at = spec.lastIndexOf("@");
    const name = at > 0 ? spec.slice(0, at) : spec;
    return path.join(agentDir, "npm", "node_modules", ...name.split("/"));
  }
  if (source.startsWith("git:")) return null;
  return path.isAbsolute(source) ? source : path.resolve(agentDir, source);
}

/** A package manifest read through the seam, or `null` when it is absent/malformed. */
function readManifest(ops, dir) {
  try {
    const parsed = JSON.parse(ops.readText(path.join(dir, "package.json")) ?? "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * The PI WEB distribution root, derived from what is on disk: a settings entry
 * that points inside `<root>/dist/pi-packages/<name>` (PI WEB registers its
 * shipped packages that way), or a pi-web package beside the resolved `pi`
 * binary in the two layouts a global install leaves. Never a hard-coded path.
 */
function distributionRoots(ops, sources, agentDir) {
  const roots = [];
  for (const { source } of sources) {
    const dir = resolveSource(agentDir, source);
    if (dir === null) continue;
    const match = /^(.*)[\\/]dist[\\/]pi-packages[\\/][^\\/]+$/u.exec(dir);
    if (match) roots.push(match[1]);
  }
  const bin = ops.binaryPath("pi");
  if (bin) {
    const binDir = path.dirname(bin);
    roots.push(
      path.resolve(binDir, "..", "install", "global", "node_modules", "@jmfederico", "pi-web"),
      path.resolve(binDir, "..", "node_modules", "@jmfederico", "pi-web"),
      path.resolve(binDir, "..", "lib", "node_modules", "@jmfederico", "pi-web"),
    );
  }
  return [...new Set(roots)];
}

/**
 * The capability evidence. Every field is something this process read; the
 * bridge half states what it is and who owns it.
 */
export function relayEvidence(ops) {
  const agentDir = piAgentDir(ops);
  const sources = packageSources(ops, agentDir);

  let declared = null;
  for (const { source } of sources) {
    const dir = resolveSource(agentDir, source);
    if (dir === null) continue;
    const manifest = readManifest(ops, dir);
    if (manifest?.name === RELAY_PACKAGE) {
      declared = { source, dir, manifest };
      break;
    }
  }

  const declaredSkillDirs = Array.isArray(declared?.manifest?.pi?.skills) ? declared.manifest.pi.skills : null;
  const skillDirs = (declaredSkillDirs ?? []).map((relative) => path.join(declared.dir, relative));
  const skills = {};
  for (const name of RELAY_SKILLS) {
    skills[name] = skillDirs.some((dir) => ops.exists(path.join(dir, name, "SKILL.md")));
  }

  let embedded = { path: null, present: false, version: null };
  for (const root of distributionRoots(ops, sources, agentDir)) {
    const candidate = path.join(root, ...SHIPPED_RELAY_SEGMENTS);
    const manifest = readManifest(ops, candidate);
    if (manifest?.name === RELAY_PACKAGE) {
      embedded = { path: candidate, present: true, version: manifest.version ?? null };
      break;
    }
    if (embedded.path === null) embedded = { path: candidate, present: false, version: null };
  }

  const endpoint = sessiondEndpoint(ops.env, { home: ops.home, cwd: ops.root });

  return {
    piWeb: { present: piWebPresent(ops.env) },
    sessiond: {
      kind: endpoint.kind,
      path: endpoint.path,
      endpoint: endpoint.endpoint,
      // A TCP endpoint is not a file: `null` means "not observable here", which
      // is never the same answer as "absent".
      present: endpoint.kind === "socket" ? ops.exists(endpoint.path) : null,
    },
    package: {
      name: RELAY_PACKAGE,
      declared: declared !== null,
      source: declared?.source ?? null,
      path: declared?.dir ?? null,
      version: declared?.manifest?.version ?? null,
      declaredSkills: declaredSkillDirs,
      skills,
    },
    embedded,
    bridge: { protocol: RELAY_BRIDGE_PROTOCOL, observable: false, owner: "pi-web" },
    degradation: DEGRADATION_ROUTE,
  };
}

/** The missing halves, phrased as what a reader can do next. */
function absentSkillsAdvisory(evidence, absent) {
  const declared = evidence.package.declaredSkills;
  const declaredText = declared === null ? "it declares no `pi.skills` entry" : `its \`pi.skills\` entry is ${declared.join(", ")}`;
  return `${RELAY_PACKAGE} is registered at ${evidence.package.path} but ${declaredText}, so ${absent.join(" and ")} cannot start — a Relay leg needs both ${RELAY_SKILLS.join(" and ")}; ${DEGRADATION_ROUTE} until the package ships them`;
}

/**
 * Turn the evidence into one published status, one advisory and (never) an
 * installer. The order is the decision order: a session with no PI WEB cannot
 * chain a leg at all, a session whose daemon does not answer cannot dispatch,
 * and only then does the package matter.
 */
export function evaluateRelay(evidence) {
  if (!evidence.piWeb.present) {
    // The by-design route, not a defect: Relay is an enhancement of the seam.
    return { status: "not-applicable", advisory: null, instruction: null };
  }
  if (evidence.sessiond.present === false) {
    return {
      status: "unreachable",
      advisory: `PI WEB's session marker is set but no session daemon answers at ${evidence.sessiond.endpoint} — ${RELAY_BRIDGE} (${evidence.bridge.protocol}), so a dispatch would fail before creating a session; ${DEGRADATION_ROUTE} until the daemon is back`,
      instruction: null,
    };
  }
  if (!evidence.package.declared) {
    const where = evidence.embedded.present
      ? `it is private — never published on npm, so npm is not a route — and ships inside PI WEB at ${evidence.embedded.path}`
      : "it is private — never published on npm, so npm is not a route — and ships inside the PI WEB distribution (dist/pi-packages/relays), which PI WEB's own Pi-packages settings registers";
    return {
      status: "missing",
      advisory: `${RELAY_PACKAGE} is not registered in Pi's packages: ${where}; without it and PI WEB's bridge a Relay leg cannot start; ${DEGRADATION_ROUTE} until it is enabled`,
      instruction: evidence.embedded.present ? `pi install ${evidence.embedded.path}` : null,
    };
  }
  const absent = RELAY_SKILLS.filter((name) => evidence.package.skills[name] !== true);
  if (absent.length > 0) {
    return { status: "missing", advisory: absentSkillsAdvisory(evidence, absent), instruction: null };
  }
  // Healthy: the one thing left unproven is the session-level bridge, which the
  // evidence names. It is no advisory — a healthy host must never read as one.
  return { status: "ok", advisory: null, instruction: null };
}
