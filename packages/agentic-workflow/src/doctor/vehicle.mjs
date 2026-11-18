/**
 * vehicle.mjs — the authoring checkout's own vehicle (issue #611, S2).
 *
 * The gap this module makes visible: a merged-but-unreleased unit is invisible to
 * an authoring session that runs the **installed** release. The override that
 * fixes it exists and is honoured everywhere (`AGENTIC_WORKFLOW_RUNNER`, owner:
 * `skills/runner-contract/references/RUNNER.md`); what was missing is a state
 * anyone can read without re-deriving it. This module owns that reading: it
 * gathers the evidence (the override, the installed pi package, the newest canary
 * tag, the override's target tree) and derives one published status.
 *
 * It is a **setup state**, never a code defect — which is why the same module also
 * owns `classifySetupState`, the decision the triage route reads: a runner refusal
 * for a subcommand the working tree ships, while the vehicle is stale or unarmed,
 * is a setup defect; anything else falls through to the ordinary classification.
 *
 * Read-only by construction: every read goes through the doctor's injected `ops`
 * seam (`probes.mjs`), and a read that cannot answer is `null` in the evidence
 * with the row's advisory naming what could not be compared — never a guessed,
 * silent `ok`.
 */

import path from "node:path";

/**
 * The override's host environment key — the contract's spelling (RUNNER.md), not
 * a second one. The module reads it, never restates its semantics.
 */
export const VEHICLE_OVERRIDE = "AGENTIC_WORKFLOW_RUNNER";
/** The working tree's crate bin — what the override should reach in this checkout. */
export const VEHICLE_TARGET = "packages/agentic-workflow/bin/agentic-workflow.mjs";
/** The pi package whose release a session runs when the override is unset. */
export const INSTALLED_PACKAGE = "@gtrabanco/pi-agentic-workflow";
/** The tag family the comparison reads (`v<line>-canary.<YYYYMMDD>.<n>`). */
export const CANARY_TAG_PATTERN = "*canary*";
/**
 * The post-merge refresh, in order: a canary cut (its commands are printed, never
 * run, by the release script) and the pi install that follows it.
 */
export const VEHICLE_REFRESH = Object.freeze([
  "bun scripts/release.mjs apply --channel canary",
  `pi install npm:${INSTALLED_PACKAGE}@canary`,
]);

/** Pi's agent directory: `$PI_CODING_AGENT_DIR`, else `~/.pi/agent`. */
export function piAgentDir(ops) {
  const configured = String(ops.env?.PI_CODING_AGENT_DIR ?? "").trim();
  return configured !== "" ? configured : path.join(ops.home, ".pi", "agent");
}

/** A canary tag's parts, or `null` when the tag carries no canary stamp. */
export function parseCanaryTag(tag) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)-canary\.(\d{8})\.(\d+)$/u.exec(String(tag ?? "").trim());
  if (match === null) return null;
  return { tag: String(tag).trim(), version: `${match[1]}.${match[2]}.${match[3]}`, date: match[4], serial: Number(match[5]) };
}

/** Numeric semver compare, then the canary stamp — `1.10` is above `1.4`. */
function compareVersion(left, right) {
  const a = String(left ?? "").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const b = String(right ?? "").split(".").map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) < (b[index] ?? 0) ? -1 : 1;
  }
  return 0;
}

/**
 * The newest of two canary tags. A tag may arrive parsed or raw; anything that is
 * not a canary is `null` and never wins a comparison.
 */
export function compareCanaryTag(left, right) {
  const a = typeof left === "string" ? parseCanaryTag(left) : left;
  const b = typeof right === "string" ? parseCanaryTag(right) : right;
  if (a === null) return b === null ? 0 : -1;
  if (b === null) return 1;
  const version = compareVersion(a.version, b.version);
  if (version !== 0) return version;
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return a.serial === b.serial ? 0 : a.serial < b.serial ? -1 : 1;
}

/** The override's tokens: one command, tokenised on whitespace (RUNNER.md's shape). */
export function overrideTokens(raw) {
  const value = String(raw ?? "").trim();
  return value === "" ? [] : value.split(/\s+/u);
}

/**
 * The path an override names, when it names one: the first token that is an
 * absolute path or ends in `.mjs`. A value that names no path (`bunx …`) is an
 * override applied to a release, which the evaluator reports as `stale`.
 */
export function overrideTarget(tokens) {
  for (const token of tokens) {
    if (token.startsWith("/") || /^[A-Za-z]:[\\/]/u.test(token) || token.endsWith(".mjs")) return token;
  }
  return null;
}

/** Whether a resolved path lives inside the observed checkout. */
function insideCheckout(root, candidate) {
  const resolved = path.resolve(candidate);
  const base = path.resolve(root);
  return resolved === base || resolved.startsWith(`${base}${path.sep}`);
}

/** The installed pi package's manifest version, or `null` when unreadable. */
function installedPackage(ops) {
  const manifest = path.join(piAgentDir(ops), "npm", "node_modules", ...INSTALLED_PACKAGE.split("/"), "package.json");
  try {
    const parsed = JSON.parse(ops.readText(manifest) ?? "null");
    if (parsed === null || typeof parsed.version !== "string" || parsed.version === "") return null;
    return { version: parsed.version, path: manifest };
  } catch {
    return null;
  }
}

/** The newest canary tag the checkout can see, and how many it saw. */
function newestCanary(ops) {
  const listed = ops.git(ops.root, ["tag", "--list", CANARY_TAG_PATTERN]);
  if (listed.status !== 0) return { canary: null, tagsVisible: 0, readable: false };
  const tags = String(listed.stdout ?? "")
    .split("\n")
    .map((tag) => parseCanaryTag(tag))
    .filter((tag) => tag !== null);
  const newest = tags.reduce((best, tag) => (best === null || compareCanaryTag(tag, best) > 0 ? tag : best), null);
  return { canary: newest, tagsVisible: tags.length, readable: true };
}

/**
 * The evidence: what the override says, what it would say, what is installed and
 * what the newest canary is. Every field is observed; nothing is inferred from a
 * version the checkout cannot read.
 */
export function vehicleEvidence(ops) {
  const tokens = overrideTokens(ops.env?.[VEHICLE_OVERRIDE]);
  const target = overrideTarget(tokens);
  const bin = path.join(ops.root, VEHICLE_TARGET);
  const program = ops.binaryPath?.("bun") ? "bun" : "node";
  const command = `${program} ${bin}`;
  const installed = installedPackage(ops);
  const { canary, tagsVisible, readable } = newestCanary(ops);

  // The installed release is compared with the newest canary; a stable install
  // compares by version line, a canary install by its stamp.
  const installedCanary = installed === null ? null : parseCanaryTag(installed.version);
  const behind =
    installed === null || canary === null
      ? false
      : installedCanary !== null
        ? compareCanaryTag(installedCanary, canary) < 0
        : compareVersion(installed.version, canary.version) < 0;

  return {
    root: ops.root,
    source: tokens.length === 0 ? "unset" : VEHICLE_OVERRIDE,
    raw: tokens.length === 0 ? "" : String(ops.env[VEHICLE_OVERRIDE]).trim(),
    target,
    targetExists: target === null ? false : Boolean(ops.exists(path.resolve(ops.root, target))),
    targetInCheckout: target === null ? false : insideCheckout(ops.root, target),
    bin,
    binPresent: Boolean(ops.exists(bin)),
    program,
    command,
    arming: `export ${VEHICLE_OVERRIDE}='${command}'`,
    refresh: [...VEHICLE_REFRESH],
    installed,
    canary,
    tagsVisible,
    canaryReadable: readable,
    behind,
  };
}

/** The sentence that names what to run, without repeating the arming line. */
function refreshNote(evidence) {
  return `run \`${evidence.refresh[0]}\` then \`${evidence.refresh[1]}\``;
}

/**
 * Turn the evidence into the row's status, advisory and instruction. The statuses
 * are the published ones: `ok`, `unarmed`, `stale`, `unreachable`,
 * `not-applicable`. Precedence is stated once here — a target inside this
 * checkout that does not exist is `unreachable` (a stale path from another
 * worktree), an armed value that does not reach this checkout is `stale` (the
 * vehicle in force is a release), and an unset override is `unarmed`.
 */
export function evaluateVehicle(evidence) {
  if (!evidence.binPresent) {
    return { status: "not-applicable", advisory: null, instruction: null };
  }

  if (evidence.source === VEHICLE_OVERRIDE) {
    if (evidence.targetInCheckout && !evidence.targetExists) {
      return {
        status: "unreachable",
        advisory: `${VEHICLE_OVERRIDE} names ${evidence.target}, which does not exist in this checkout — a path left over from another worktree points the runner at nothing`,
        instruction: evidence.arming,
      };
    }
    if (!evidence.targetInCheckout) {
      return {
        status: "stale",
        advisory: `${VEHICLE_OVERRIDE} is applied but does not reach this checkout's bin (${evidence.command}), so the vehicle in force is a release rather than the working tree${evidence.installed ? ` (installed ${evidence.installed.version})` : ""} — a merged-but-unreleased unit stays invisible`,
        instruction: evidence.arming,
      };
    }
    const behind = evidence.behind
      ? `the installed package (${evidence.installed.version}) is behind the newest canary tag (${evidence.canary.tag}); the working tree is the newer half, so the next post-merge session runs ${refreshNote(evidence)}`
      : null;
    const unreadable = evidence.canary === null ? "no canary tag is visible in this checkout, so staleness cannot be compared — run `git fetch --tags`" : null;
    const advisory = [behind, unreadable].filter(Boolean).join(" · ");
    return { status: "ok", advisory: advisory === "" ? null : advisory, instruction: null };
  }

  const facts = [];
  if (evidence.installed) facts.push(`installed ${evidence.installed.version}`);
  if (evidence.canary) facts.push(`newest canary ${evidence.canary.tag}`);
  const behind = evidence.behind
    ? `the installed package (${evidence.installed.version}) is behind the newest canary tag (${evidence.canary.tag}), so a merged-but-unreleased unit is invisible to this session`
    : null;
  const unreadable =
    evidence.canary === null
      ? "no canary tag is visible in this checkout, so the comparison cannot be made — run `git fetch --tags`"
      : null;
  const advisory = [
    `${VEHICLE_OVERRIDE} is not set, so this session runs the installed release${facts.length > 0 ? ` (${facts.join(", ")})` : ""}`,
    behind,
    unreadable,
    behind ? `after arming, ${refreshNote(evidence)}` : null,
  ]
    .filter(Boolean)
    .join(" — ");
  const instruction = evidence.canary === null ? `git fetch --tags && ${evidence.arming}` : evidence.arming;
  return { status: "unarmed", advisory, instruction };
}

/**
 * The triage route's decision table (S3): is this refusal a setup state or a code
 * defect? Only the shape the issue names is a setup defect — a subcommand the
 * working tree ships, refused while the vehicle is stale or unarmed. A genuine
 * missing subcommand, or a healthy vehicle refusing a shipped one, is a code bug;
 * a vehicle that cannot be read proves nothing, so it stays `unresolved` and falls
 * through to the ordinary classification.
 */
export function classifySetupState({ vehicleStatus, subcommandInTree }) {
  if (subcommandInTree !== true) {
    return {
      classification: "code-bug",
      move: "the ordinary classification, unchanged — the working tree does not ship the named subcommand or skill",
      reason: "the tree does not ship what the refusal names, so no vehicle could have answered it differently",
    };
  }
  if (vehicleStatus === "stale" || vehicleStatus === "unarmed") {
    return {
      classification: "setup-defect",
      move: "apply the dogfooding-vehicle row's arming or refresh move, then re-run the refused command",
      reason: `a setup state, not a code defect: the working tree ships it and the vehicle in force is ${vehicleStatus}`,
    };
  }
  if (vehicleStatus === "ok") {
    return {
      classification: "code-bug",
      move: "the ordinary classification, unchanged — a healthy vehicle refused a command this tree ships",
      reason: "the vehicle runs this checkout, so the refusal names real behaviour",
    };
  }
  return {
    classification: "unresolved",
    move: "read the dogfooding-vehicle row's evidence and repair what it names, then re-classify",
    reason: `the vehicle cannot be shown healthy (${vehicleStatus}), so neither direction is proven`,
  };
}
