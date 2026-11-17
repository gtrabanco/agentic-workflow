// Content guard — sanitized, policy-gated, fenced ingestion of forge content.
//
// Third-party forge text (issue and PR titles, bodies, comments, review comments)
// is untrusted by construction: anybody who can comment can write it, and a model
// reading it cannot tell the workflow's instructions from an attacker's. The guard
// layer is deterministic code in the collection path, never model discipline — the
// same philosophy as `path-policy.mjs` (a model can never allow what policy
// denies). Issue #470.
//
// The module owns four things and nothing else:
//   1. the hidden-content sanitizer (strip and count, never silently);
//   2. the author-provenance policy resolver (fail-closed, strictest default);
//   3. the fence (bounded, labeled delivery that content cannot close) ;
//   4. the single ingestion function (`guardForgeContent`) — the ONLY path that
//      returns third-party text, so no producer can reach the raw value.
//
// Node standard library plus the published schema vocabularies; nothing here
// writes to the repository.

import { spawnSync } from "node:child_process";

import {
  CONTENT_AUTHOR_ASSOCIATIONS,
  CONTENT_HIDDEN_KINDS,
  BASE_CONFIG_SECTIONS,
  resolveConfigDocuments,
} from "@gtrabanco/agentic-workflow-schema";

import { readScopeDocuments, scopeDirectories } from "./config/store.mjs";

/** The shipped strictest policy: trusted roles only, no exception list. */
export const DEFAULT_CONTENT_GUARD_POLICY = Object.freeze({
  trustedRoles: Object.freeze(["OWNER", "MEMBER", "COLLABORATOR"]),
  allowLogins: Object.freeze([]),
  denyLogins: Object.freeze([]),
});

/** What an unconfigured project resolves to — the strictest default, not an error. */
export const CONTENT_GUARD_POLICY = Object.freeze({
  ...DEFAULT_CONTENT_GUARD_POLICY,
  state: "default",
});

/* ------------------------------------------------------------------ policy */

const POLICY_KEYS = ["trustedRoles", "allowLogins", "denyLogins"];

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringList(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : null;
}

/** The full reason vocabulary, re-exported from the schema package's single home. */
export { CONTENT_AUTHOR_ASSOCIATIONS, CONTENT_HIDDEN_KINDS } from "@gtrabanco/agentic-workflow-schema";

/**
 * Resolve one `contentGuard` section value into an effective policy. Anything
 * that is not the declared shape is refused whole — the shipped default comes
 * back with `state: "malformed"` and a `malformed-config` degradation, because a
 * partially honored policy is exactly the silent inclusion this layer denies.
 *
 * @returns {{ok: boolean, policy: {trustedRoles: readonly string[], allowLogins: readonly string[], denyLogins: readonly string[], state: string}, degradations: string[]}}
 */
export function resolveContentGuardPolicy(sectionValue) {
  if (sectionValue === undefined || sectionValue === null) {
    return { ok: true, policy: CONTENT_GUARD_POLICY, degradations: [] };
  }
  const refuse = () => ({
    ok: false,
    policy: Object.freeze({ ...DEFAULT_CONTENT_GUARD_POLICY, state: "malformed" }),
    degradations: ["malformed-config"],
  });
  if (!isRecord(sectionValue)) return refuse();
  for (const key of Object.keys(sectionValue)) {
    if (!POLICY_KEYS.includes(key)) return refuse();
  }
  const trustedRoles = sectionValue.trustedRoles === undefined
    ? [...DEFAULT_CONTENT_GUARD_POLICY.trustedRoles]
    : stringList(sectionValue.trustedRoles);
  const allowLogins = sectionValue.allowLogins === undefined ? [] : stringList(sectionValue.allowLogins);
  const denyLogins = sectionValue.denyLogins === undefined ? [] : stringList(sectionValue.denyLogins);
  if (trustedRoles === null || allowLogins === null || denyLogins === null) return refuse();
  if (trustedRoles.some((role) => !CONTENT_AUTHOR_ASSOCIATIONS.includes(role))) return refuse();
  for (const login of [...allowLogins, ...denyLogins]) {
    if (typeof login !== "string" || login.trim() === "") return refuse();
  }
  return {
    ok: true,
    policy: Object.freeze({
      trustedRoles: Object.freeze([...new Set(trustedRoles)]),
      allowLogins: Object.freeze([...new Set(allowLogins)]),
      denyLogins: Object.freeze([...new Set(denyLogins)]),
      state: "explicit",
    }),
    degradations: [],
  };
}

/**
 * Read the effective policy from the unified config (#427): project over global,
 * shipped defaults for keys nobody set, tighten-only merge of the two scopes.
 * An unreadable or broken config file fails closed to the strictest default.
 *
 * @returns {{ok: boolean, policy: object, degradations: string[]}}
 */
export function readContentGuardPolicy({ projectDir = process.cwd(), globalDir, env = process.env } = {}) {
  let project;
  let global;
  try {
    const directories = scopeDirectories({ projectDir, globalDir, env });
    project = readScopeDocuments(directories.project, BASE_CONFIG_SECTIONS);
    global = readScopeDocuments(directories.global, BASE_CONFIG_SECTIONS);
  } catch (error) {
    return {
      ok: false,
      policy: Object.freeze({ ...DEFAULT_CONTENT_GUARD_POLICY, state: "malformed" }),
      degradations: [`malformed-config`, `unavailable-config-${causeWord(error)}`],
    };
  }
  const resolved = resolveConfigDocuments({
    sections: BASE_CONFIG_SECTIONS,
    global: global.documents,
    project: project.documents,
  });
  const sectionIssues = [...project.issues, ...global.issues, ...resolved.issues]
    .filter((issue) => String(issue.path ?? "").startsWith("contentGuard") || !String(issue.path ?? "").startsWith("pi"));
  if (sectionIssues.length > 0) {
    return {
      ok: false,
      policy: Object.freeze({ ...DEFAULT_CONTENT_GUARD_POLICY, state: "malformed" }),
      degradations: ["malformed-config"],
    };
  }
  return resolveContentGuardPolicy(resolved.config.contentGuard);
}

/* --------------------------------------------------------------- sanitizer */

/**
 * One hidden-material class per entry, in the vocabulary's declared order, so a
 * report's row order is stable and diffable. `control-character` keeps tab, CR
 * and LF: those are content, not camouflage.
 */
const HIDDEN_PATTERNS = [
  { kind: "zero-width", pattern: /[\u200B-\u200D\u2060\uFEFF\u180E]/gu },
  { kind: "bidi-control", pattern: /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/gu },
  { kind: "tag-character", pattern: /[\u{E0000}-\u{E007F}]/gu },
  { kind: "variation-selector", pattern: /[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/gu },
  { kind: "control-character", pattern: /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu },
];

const HTML_COMMENT = /<!--[\s\S]*?(?:-->|$)/gu;

/**
 * Confusables that turn a Latin word into a lookalike when a single character is
 * swapped for its Cyrillic/Greek twin. The table is deliberately small: the
 * detector's job is the *detectable* case (a mixed-script token that spells a
 * known instruction), and a wider table would start rewriting legitimate text.
 */
const CONFUSABLES = new Map([
  ["\u0430", "a"], ["\u0435", "e"], ["\u043E", "o"], ["\u0440", "p"], ["\u0441", "c"],
  ["\u0443", "y"], ["\u0445", "x"], ["\u0456", "i"], ["\u0455", "s"], ["\u0458", "j"],
  ["\u0501", "d"], ["\u04BB", "h"], ["\u04CF", "l"], ["\u0261", "g"],
  ["\u03B1", "a"], ["\u03B5", "e"], ["\u03B9", "i"], ["\u03BD", "v"], ["\u03BF", "o"],
  ["\u03C1", "p"], ["\u03C4", "t"], ["\u03C5", "u"], ["\u03C7", "x"], ["\u03BC", "m"],
  ["\u03F2", "c"], ["\u0582", "u"],
  ["\u0410", "A"], ["\u0412", "B"], ["\u0415", "E"], ["\u041A", "K"], ["\u041C", "M"],
  ["\u041D", "H"], ["\u041E", "O"], ["\u0420", "P"], ["\u0421", "C"], ["\u0422", "T"],
  ["\u0425", "X"], ["\u0406", "I"], ["\u0408", "J"], ["\u0405", "S"],
  ["\u0391", "A"], ["\u0392", "B"], ["\u0395", "E"], ["\u0396", "Z"], ["\u0397", "H"],
  ["\u0399", "I"], ["\u039A", "K"], ["\u039C", "M"], ["\u039D", "N"], ["\u039F", "O"],
  ["\u03A1", "P"], ["\u03A4", "T"], ["\u03A5", "Y"], ["\u03A7", "X"],
]);

/** The instruction words a lookalike is trying to spell. Closed on purpose. */
const HIDDEN_INSTRUCTION_WORDS = new Set([
  "ignore", "ignores", "ignored", "instruction", "instructions", "system", "prompt",
  "prompts", "admin", "administrator", "override", "overrides", "bypass", "bypasses",
  "jailbreak", "disregard", "sudo", "root", "assistant", "systemprompt",
]);

const TOKEN = /[\p{L}\p{N}_]+/gu;

/** Strip lookalike instruction tokens; returns the text and how many were removed. */
function stripHomoglyphInstructions(text) {
  let out = "";
  let last = 0;
  let count = 0;
  for (const match of text.matchAll(TOKEN)) {
    const token = match[0];
    if (!/[A-Za-z]/.test(token)) continue;
    let normalized = "";
    let mixed = false;
    for (const char of token) {
      const mapped = CONFUSABLES.get(char);
      if (mapped === undefined) normalized += char;
      else {
        mixed = true;
        normalized += mapped;
      }
    }
    if (!mixed || !HIDDEN_INSTRUCTION_WORDS.has(normalized.toLowerCase())) continue;
    out += text.slice(last, match.index);
    last = match.index + token.length;
    count += 1;
  }
  if (count === 0) return { text, count: 0 };
  return { text: out + text.slice(last), count };
}

/**
 * Remove hidden material from one piece of third-party text and report what went.
 * Clean input comes out byte-identical: the layer is a surface reducer, so it has
 * no business rewriting prose it did not need to touch.
 *
 * @returns {{text: string, removals: Array<{kind: string, count: number}>, removedChars: number}}
 */
export function sanitizeHiddenContent(text) {
  const source = typeof text === "string" ? text : "";
  const removals = [];
  let removedChars = 0;

  let current = source.replace(HTML_COMMENT, (match) => {
    removedChars += match.length;
    return "";
  });
  const comments = (source.match(HTML_COMMENT) ?? []).length;
  if (comments > 0) removals.push({ kind: "html-comment", count: comments });

  for (const { kind, pattern } of HIDDEN_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = current.match(pattern);
    if (matches === null) continue;
    removedChars += matches.join("").length;
    current = current.replace(pattern, "");
    removals.push({ kind, count: matches.length });
  }

  const homoglyphs = stripHomoglyphInstructions(current);
  if (homoglyphs.count > 0) {
    removals.push({ kind: "homoglyph-instruction", count: homoglyphs.count });
  }
  const ordered = CONTENT_HIDDEN_KINDS
    .map((kind) => removals.find((entry) => entry.kind === kind))
    .filter((entry) => entry !== undefined);
  return { text: homoglyphs.text, removals: ordered, removedChars };
}

/* -------------------------------------------------------------------- fence */

const FENCE_OPEN = "<<<THIRD-PARTY-CONTENT";
const FENCE_CLOSE = "<<<END-THIRD-PARTY-CONTENT>>>";
const FENCE_PREFIX = "<<<";
const FENCE_ESCAPE = "\u2039\u2039\u2039";

/** One attribute value, confined to a single header line. */
function attribute(value) {
  const text = value === undefined || value === null ? "" : String(value);
  return text.replace(/["\r\n<>]/gu, "_").slice(0, 120);
}

/**
 * Wrap one payload as bounded, labeled third-party data.
 *
 * Content can never close its own fence: every `<<<` inside the text is
 * neutralized and counted, so the delivered block holds exactly one open and one
 * close marker no matter what the forge returned.
 *
 * @returns {{fenced: string, escaped: number}}
 */
export function fenceThirdParty({ source, id, author, association, verdict = "allowed", reason, text }) {
  const parts = String(text ?? "").split(FENCE_PREFIX);
  const escaped = parts.length - 1;
  const body = parts.join(FENCE_ESCAPE);
  const header = `${FENCE_OPEN} source="${attribute(source)}" id="${attribute(id)}" author="${attribute(author)}"`
    + ` association="${attribute(association)}" verdict="${attribute(verdict)}" reason="${attribute(reason)}">>>`;
  return { fenced: `${header}\n${body}\n${FENCE_CLOSE}`, escaped };
}

/* -------------------------------------------------------------------- guard */

function causeWord(cause) {
  const text = String(cause?.message ?? cause ?? "error").toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "");
  return text.slice(0, 40) || "error";
}

const ALLOWED_REASONS = new Set(["trusted-author", "allow-listed", "hidden-content-stripped"]);

/**
 * The single ingestion path for third-party text.
 *
 * Order matters and is not configurable: sanitize, then decide on the author,
 * then deliver (text + fenced form) or exclude with a declaration. An excluded
 * payload has no text and no fence, so a caller cannot leak what the policy
 * refused.
 *
 * @returns {{
 *   contract: string, source: string, id: string, author: string|null,
 *   association: string|null, verdict: "allowed"|"excluded", reason: string,
 *   matchedBy: string, text: string|null, fenced: string|null,
 *   removals: Array<{kind: string, count: number}>, removedChars: number,
 *   escaped: number, degradations: string[],
 * }}
 */
export function guardForgeContent({
  source,
  id,
  author = null,
  association = null,
  text = "",
  policy = CONTENT_GUARD_POLICY,
} = {}) {
  const effective = policy ?? CONTENT_GUARD_POLICY;
  const label = `${String(source) || "unknown"}-${String(id ?? "unknown")}`;
  const base = {
    contract: "content-guard@1",
    source: String(source ?? "unknown"),
    id: String(id ?? "unknown"),
    author: author === null || author === undefined ? null : String(author),
    association: association === null || association === undefined ? null : String(association),
    removals: [],
    removedChars: 0,
    escaped: 0,
    degradations: [],
  };
  const exclude = (reason, matchedBy) => ({
    ...base,
    verdict: "excluded",
    reason,
    matchedBy,
    text: null,
    fenced: null,
    degradations: [`excluded-forge-content-${label}-${reason}`],
  });

  if (effective.state === "malformed") return exclude("malformed-policy", "policy-error");

  const sanitized = sanitizeHiddenContent(text);
  const associationValue = base.association;
  const denyListed = effective.denyLogins.includes(base.author ?? "");
  const allowListed = !denyListed && effective.allowLogins.includes(base.author ?? "");
  const trustedRole = associationValue !== null
    && effective.trustedRoles.includes(associationValue)
    && CONTENT_AUTHOR_ASSOCIATIONS.includes(associationValue);

  if (denyListed) return { ...exclude("deny-listed", "deny-list"), ...sanitizedReport(sanitized) };
  if (associationValue === null || !CONTENT_AUTHOR_ASSOCIATIONS.includes(associationValue)) {
    return { ...exclude("unknown-author", "unknown"), ...sanitizedReport(sanitized) };
  }
  if (!trustedRole && !allowListed) return { ...exclude("untrusted-author", "unlisted-role"), ...sanitizedReport(sanitized) };

  const matchedBy = allowListed && !trustedRole ? "allow-list" : "trusted-role";
  const degradations = sanitized.removals.map(
    (entry) => `stripped-forge-content-${label}-${entry.kind}-${entry.count}`,
  );
  const reason = sanitized.removals.length > 0
    ? "hidden-content-stripped"
    : matchedBy === "allow-list" ? "allow-listed" : "trusted-author";
  const fence = fenceThirdParty({
    source: base.source,
    id: base.id,
    author: base.author,
    association: base.association,
    verdict: "allowed",
    reason,
    text: sanitized.text,
  });
  return {
    ...base,
    verdict: "allowed",
    reason,
    matchedBy,
    text: sanitized.text,
    fenced: fence.fenced,
    removals: sanitized.removals,
    removedChars: sanitized.removedChars,
    escaped: fence.escaped,
    degradations,
  };
}

/** The sanitizer's report, carried on an exclusion so the removal is auditable. */
function sanitizedReport(sanitized) {
  return { removals: sanitized.removals, removedChars: sanitized.removedChars };
}

/* --------------------------------------------------------------- collectors */

/**
 * Read every open issue's `authorAssociation` in one paginated REST call.
 *
 * The pinned `gh` has no `authorAssociation` JSON field on `issue list`, while the
 * REST issues endpoint carries `author_association` and `gh api --paginate` walks
 * the pages — one call shape serves both the planner and the sensor. A failure
 * degrades by cause and returns an empty map: the caller declares the exclusion,
 * it never falls back to "assume trusted".
 *
 * @returns {{associations: Map<number, {association: string, login: string, pullRequest: boolean}>, degradation: string|null}}
 */
export function collectAssociations({ ghBin = "gh", owner, name, timeoutMs = 30_000 } = {}) {
  const associations = new Map();
  const degrade = (cause) => ({ associations, degradation: `unavailable-forge-associations-${cause}` });
  if (typeof owner !== "string" || typeof name !== "string" || owner === "" || name === "") {
    return degrade("no-remote");
  }
  const path = `repos/${owner}/${name}/issues?state=open&per_page=100`;
  const filter = '.[] | "\\(.number) \\(.author_association // "NONE") \\(.user.login // "") '
    + '\\(if .pull_request then "pr" else "issue" end)"';
  const run = spawnSync(ghBin, ["api", "--paginate", path, "--jq", filter], { encoding: "utf8", timeout: timeoutMs });
  if (run.error !== undefined && run.error !== null) {
    if (run.error.code === "ENOENT") return degrade("missing-cli");
    if (run.error.code === "ETIMEDOUT") return degrade("timeout");
    return degrade(causeWord(run.error));
  }
  if (run.status !== 0) {
    const stderr = String(run.stderr ?? "");
    if (/authenticat|401|credential|bad credentials/iu.test(stderr)) return degrade("auth");
    if (/could not resolve|network|econnrefused|econnreset|timeout/iu.test(stderr)) return degrade("no-network");
    return degrade(causeWord(stderr.trim().split("\n")[0] ?? "error"));
  }
  for (const line of String(run.stdout ?? "").split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    const [numberText, association, login, kind] = trimmed.split(" ");
    const number = Number.parseInt(numberText, 10);
    if (!Number.isInteger(number) || typeof association !== "string" || association === "") {
      return degrade("malformed-answer");
    }
    associations.set(number, {
      association,
      login: login ?? "",
      pullRequest: kind === "pr",
    });
  }
  return { associations, degradation: null };
}
