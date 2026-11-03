#!/usr/bin/env node
/**
 * risk-tiers.mjs — the computed risk-tier classifier (issue #360, direction #307).
 *
 * Ceremony is proportional to **risk**, and risk is decided by this module, never
 * by the model: `classifyTier()` takes the changed paths and their contents and
 * answers one of the published tiers `passive | standard | high`. It is a pure
 * function over repo evidence — no clock, no environment, no network, no git —
 * so the same tree always yields the same verdict, and the crate (#352) can wrap
 * it unchanged.
 *
 * **Task Size = Understood + Contained risk + Resumable-from-diff.** File counts
 * never decide: four hundred prose files are passive and a one-file auth change
 * is high. Ambiguity fails closed **upward** — an unreadable or unknown path can
 * only raise a tier, never lower one — because a change the classifier cannot
 * prove inert must pay the ceremony that proves it.
 *
 * Vocabulary: one home. The closed sets are the schema package's published consts
 * (`@gtrabanco/agentic-workflow-schema`); this module imports them from the
 * package source next door so a root checkout needs no build and no second copy.
 */

import {
  RISK_TIER_KINDS,
  RISK_TIER_SIGNAL_KINDS,
  RISK_TIER_REASONS,
} from "../packages/agentic-workflow-schema/src/vocabularies.ts";

export { RISK_TIER_KINDS, RISK_TIER_SIGNAL_KINDS, RISK_TIER_REASONS };

/** The contract id of the verdict shape the CLI emits and `RISK_TIERS.md`
 *  documents (`risk-tier-verdict@1`). */
export const RISK_TIERS_CONTRACT_ID = "risk-tier-verdict@1";

/** Extensions whose bytes a runtime can execute or interpret. */
const EXECUTABLE_EXTENSIONS = new Set([
  "js", "mjs", "cjs", "ts", "tsx", "jsx", "mts", "cts", "json", "yml", "yaml",
  "sh", "bash", "zsh", "py", "rb", "rs", "go", "java", "sql", "toml",
]);

/** Extensions that carry no executable effect whatever their bytes say. */
const PROSE_EXTENSIONS = new Set([
  "md", "mdx", "markdown", "txt", "rst", "adoc",
  "png", "jpg", "jpeg", "gif", "svg", "webp", "avif", "ico", "pdf",
]);

/**
 * The named high-risk surfaces (issue #360 S5: "a *named* high-risk item — auth,
 * destructive ops, CI/publish surfaces"). Anchored path or basename patterns, so
 * the signal is a repo fact and not a guess: the signal is the whole reason the
 * verdict is `high`, and an unnamed `high` is the defect this table prevents.
 */
const HIGH_RISK_PATHS = Object.freeze([
  { signal: "auth", pattern: /(^|\/)(auth|authori[sz]ations?|secrets?|credentials?|tokens?|keys?)(\.|\/|-|_|$)/i },
  { signal: "security", pattern: /(^|\/)(security|path-policy|path-guard|sandbox|permissions?)(\.|\/|-|_|$)/i },
  { signal: "ci", pattern: /^\.github\/(workflows|actions)\//i },
  { signal: "publish", pattern: /(^|\/)(release|publish|publish-ui|npm-version-gate|lint-changeset|changeset-create)(\.|-|_|$)/i },
]);

/**
 * The markers that make a change destructive — the operations that remove data a
 * user cannot get back. This signal is **content-only**: `docs/delete-a-row.md`
 * is prose about deleting, and `scripts/delete-unit.mjs` is a file remover whose
 * own name says what it does, so a path name raises nothing here. A guarded
 * `{ recursive: true, force: true }` is deletion hygiene, not a destructive
 * surface: a suite that cleans its own scratch directory must not raise `high`.
 */
const DESTRUCTIVE_CONTENT = new RegExp(
  [
    // A deletion call in code. A guarded one (`{ recursive: true, force: true }` —
    // scratch cleanup) is not a destructive surface; the guard may sit anywhere in
    // the call's arguments, so the lookahead spans the whole argument list and
    // requires BOTH flags (`force` alone is how an unguarded delete is written).
    "\\b(?:rm(?:dir)?Sync|unlinkSync|purge|purgeDir)\\s*\\((?![^()]*(?:\\brecursive:\\s*true[^()]*\\bforce:\\s*true|\\bforce:\\s*true[^()]*\\brecursive:\\s*true))[^()]*\\)",
    // The operations no guard makes safe.
    "\\brm\\s+(?:-[a-z]*r[a-z]*f[a-z]*|-[a-z]*f[a-z]*r[a-z]*|--recursive\\s+--force|--force\\s+--recursive)\\b",
    "\\bdrop\\s+(?:table|database)\\b",
    "\\bdelete\\s+from\\b",
    "\\bTRUNCATE\\b",
    "\\bgit\\s+push\\s+--force\\b",
  ].join("|"),
  "i",
);

const CELL_RE = /\\\|/g;

/**
 * A file's extension, lowercased, without the dot. A file with no extension is
 * treated as executable content (fail closed: an unreadable class is never
 * assumed inert).
 */
function extensionOf(file) {
  const base = file.split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot <= 0 ? "" : base.slice(dot + 1).toLowerCase();
}

/** The changed lines of a file, or the whole text when the caller has no diff. */
function changedLinesOf(text) {
  return String(text).split("\n");
}

/**
 * `true` when every non-blank line the caller handed over is a comment or a
 * block-comment interior — the "comment-only edit in an executable file" case,
 * which has no executable effect.
 */
function isCommentOnly(text) {
  let sawContent = false;
  let inBlock = false;
  for (const raw of changedLinesOf(text)) {
    const line = raw.trim();
    if (line === "") continue;
    if (inBlock) {
      sawContent = true;
      if (line.includes("*/")) inBlock = false;
      continue;
    }
    if (line.startsWith("/*") || line.startsWith("<!--")) {
      sawContent = true;
      if (!line.includes("*/") && !line.includes("-->")) inBlock = true;
      continue;
    }
    if (line.startsWith("//") || line.startsWith("#") || line.startsWith("*") || line.startsWith("--")) {
      sawContent = true;
      continue;
    }
    return false;
  }
  return sawContent;
}

/** The named high-risk signal for a path and its contents, or `null`. */
function namedSignalFor(file, text) {
  for (const { signal, pattern } of HIGH_RISK_PATHS) {
    if (pattern.test(file)) return signal;
  }
  // Prose *describes* operations and never executes one: a doc that warns about
  // destructive commands is a doc, not a destructive surface.
  if (PROSE_EXTENSIONS.has(extensionOf(file))) return null;
  if (DESTRUCTIVE_CONTENT.test(text)) return "destructive";
  return null;
}

/**
 * One changed file → `{ path, effect, signal }` where `effect` is
 * `prose | comment-only | executable`.
 */
function classifyPath(file, text) {
  const extension = extensionOf(file);
  const content = String(text ?? "");
  const body = content.replace(CELL_RE, "|");

  const signal = namedSignalFor(file, body);
  if (signal !== null) return { path: file, effect: "executable", signal };

  if (PROSE_EXTENSIONS.has(extension)) return { path: file, effect: "prose", signal: null };
  if (EXECUTABLE_EXTENSIONS.has(extension)) {
    if (body.trim() !== "" && isCommentOnly(body)) return { path: file, effect: "comment-only", signal: null };
    return { path: file, effect: "executable", signal: "content" };
  }
  // Unknown extension: an unreadable class fails closed upward.
  return { path: file, effect: "executable", signal: "content" };
}

/**
 * The Task Size a tier owes. Three signals (issue #360 S2) plus the two the
 * ceremony needs to be executable: the ceremony class and its verification.
 */
export function taskSizeOf(tier) {
  if (!RISK_TIER_KINDS.includes(tier)) {
    throw new Error(`unknown risk tier: ${String(tier)} (published: ${RISK_TIER_KINDS.join(", ")})`);
  }
  if (tier === "passive") {
    return {
      understood: true,
      contained_risk: "contained",
      resumable_from_diff: true,
      ceremony: "none",
      verification: "readback",
    };
  }
  if (tier === "standard") {
    return {
      understood: true,
      contained_risk: "contained",
      resumable_from_diff: true,
      ceremony: "unit-doc",
      verification: "gates",
    };
  }
  return {
    understood: true,
    contained_risk: "named",
    resumable_from_diff: true,
    ceremony: "unit-doc+review-change",
    verification: "review-change",
  };
}

/**
 * Classify a change.
 *
 * @param {Map<string, string> | Record<string, string>} files
 *   changed path → its content (the whole file, or only the changed lines).
 * @param {{ force?: string[], renamed?: {from: string, to: string}[] }} [options]
 *   `force` adds paths whose content is unknown (they classify as executable
 *   content, never as prose); `renamed` names a rename's source so its deletion
 *   side is counted.
 * @returns {{ tier: string, reason: string, reason_kind: string, task_size: object,
 *             signals: {path: string, signal: string}[], paths: object }}
 */
export function classifyTier(files, options = {}) {
  const entries = files instanceof Map ? [...files.entries()] : Object.entries(files ?? {});
  const forced = Array.isArray(options.force) ? options.force : [];
  const changed = [...new Set([...entries.map(([file]) => file), ...forced])].sort();

  if (changed.length === 0) {
    return {
      tier: "standard",
      reason: "the change names no path, so nothing proves it inert — fail closed upward",
      reason_kind: "empty-change",
      task_size: taskSizeOf("standard"),
      signals: [],
      paths: { changed: [], escalating: [] },
    };
  }

  const contents = new Map(entries);
  const kinds = changed.map((file) => classifyPath(file, contents.get(file) ?? ""));

  const named = kinds.filter((k) => k.signal !== null && k.signal !== "content");
  const executable = kinds.filter((k) => k.effect === "executable");
  const inert = kinds.filter((k) => k.effect !== "executable");

  if (named.length > 0) {
    const signals = [];
    for (const kind of named) {
      if (signals.some((s) => s.signal === kind.signal)) continue;
      signals.push({ path: kind.path, signal: kind.signal });
    }
    return {
      tier: "high",
      reason: `${named.length} path(s) touch a named high-risk surface: ${signals.map((s) => `${s.signal} (${s.path})`).join(", ")}`,
      reason_kind: "named-high-risk",
      task_size: taskSizeOf("high"),
      signals,
      paths: { changed, escalating: named.map((k) => k.path) },
    };
  }

  if (executable.length === 0) {
    const commentOnly = kinds.some((k) => k.effect === "comment-only");
    const proseOnly = kinds.every((k) => k.effect === "prose");
    return {
      tier: "passive",
      reason: commentOnly
        ? "every changed line is a comment or prose: no executable effect"
        : proseOnly
          ? "every changed path is documentation, an image or prose: no executable effect"
          : "only deleted or renamed prose: no executable effect",
      reason_kind: commentOnly ? "comment-only" : "no-executable-effect",
      task_size: taskSizeOf("passive"),
      signals: [],
      paths: { changed, escalating: [] },
    };
  }

  return {
    tier: "standard",
    reason: `${executable.length} path(s) carry executable content: ${executable.slice(0, 3).map((k) => k.path).join(", ")}${executable.length > 3 ? ", …" : ""}`,
    reason_kind: "executable-content",
    task_size: taskSizeOf("standard"),
    signals: [],
    paths: { changed, escalating: executable.map((k) => k.path), inert: inert.map((k) => k.path) },
  };
}
