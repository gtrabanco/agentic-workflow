// projection.mjs — the pack-time projection transform (issue #410).
//
// `bundle-skills.mjs` stopped being byte-copy: a repo-internal manifest
// (`projection-manifest.json` at the package root, outside the `files:`
// whitelist — committed, never packed) declares which prose sections the pi
// bundle drops or pointerizes, and this module applies those rules to the
// staged copy. One source (`skills/`), two products: standalone full, pi
// projected.
//
// Responsibilities, all fail-closed:
//   - Load and validate the manifest through @gtrabanco/agentic-workflow-schema
//     (`validateProjectionManifestV1`, issue #406's grammar).
//   - Resolve every rule's selector through the runner crate's section locator
//     (`packages/agentic-workflow/src/doc/section-locator.mjs`, issue #407) —
//     never a hand-rolled heading scan.
//   - Bind every removed range by sha256 over the exact UTF-8 bytes the rule
//     removes; a digest that differs is a re-verify failure.
//   - Check that every `remove`/`pointerize` rule names an enforcing command
//     the crate CLI actually dispatches.
//   - Refuse the `prereq` op: its grammar shipped (#406) but its execution is
//     its own unit — the stripper never runs it.
//
// Removed-bytes binding, per op:
//   - `remove` without `except`: the whole section, heading line included.
//   - `remove` with `except`: the parent range minus the kept children's
//     ranges, concatenated in document order. Each `except` entry is a child
//     heading path *relative to the removed section* (it does not include the
//     removed heading itself). A kept child carries its own nested content and
//     is spliced back byte-identically; it is promoted one outline level.
//   - `pointerize`: the section body — everything after the heading line up to
//     the section end. The heading line survives; the body is replaced by the
//     one-line pointer.
//
// Rules apply sequentially in manifest order, and each hash binds the bytes
// removed at that rule's application time: a rule whose range an earlier rule
// disturbed fails its hash check, which is the auditable staleness signal.
// A file whose source path no rule names is never touched.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { locate, SectionLocatorError } from "@gtrabanco/agentic-workflow/src/doc/section-locator.mjs";
import { validateProjectionManifestV1 } from "@gtrabanco/agentic-workflow-schema";

/** The closed failure vocabulary: every failure mode of the projection has its
 *  own code, and the gate's output names it. Distinctness is pinned by the
 *  suite beside this module. */
export const PROJECTION_ERROR_CODES = Object.freeze([
  "manifest-invalid",
  "stale-rule",
  "ambiguous-match",
  "hash-mismatch",
  "unknown-command",
  "unsupported-op",
]);

/** The typed projection failure. `code` is one of `PROJECTION_ERROR_CODES`;
 *  `ruleId` names the offending rule when one exists. */
export class ProjectionError extends Error {
  constructor(code, message, ruleId = null) {
    super(`projection: ${message}`);
    this.name = "ProjectionError";
    this.code = code;
    this.ruleId = ruleId;
  }
}

/** Every top-level command the crate CLI dispatches (`bin/agentic-workflow.mjs`
 *  `case` tokens). The suite parses the bin source and holds this list to set
 *  equality, so a command added to the crate without updating the projection's
 *  enforcement check fails the gate — and vice versa. */
export const CRATE_COMMANDS = Object.freeze([
  "budgets",
  "changelog",
  "config",
  "doc",
  "journal",
  "log",
  "manifest",
  "memory",
  "relay",
  "resolve-passes",
  "resources",
  "roadmap",
  "section",
  "unit-doc",
  "verify",
]);

/** The one-line pointer a `pointerize` rule leaves behind. Naming the
 *  enforcing command is the contract: the prose is gone, the enforcement is
 *  not. */
const pointerLine = (rule) =>
  `> Enforced by \`${rule.enforcingCommand}\` — this section's prose is not shipped in the pi bundle; the standalone skills/ tree carries the full text.`;

const sha256Digest = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const sha256Hex = (text) => `sha256:${sha256Digest(text)}`;

/**
 * rulesFor(rules, repoRelativePath) — the rules that name this source document.
 * @param {readonly object[]} rules
 * @param {string} repoRelativePath e.g. `skills/workflow-status/SKILL.md`
 * @returns {object[]}
 */
export function rulesFor(rules, repoRelativePath) {
  return (rules ?? []).filter((rule) => rule.source === repoRelativePath);
}

/**
 * loadProjectionManifest(manifestPath) — read, parse and validate a manifest.
 * Any structural failure raises `ProjectionError("manifest-invalid")` with the
 * validator's errors in the message.
 * @param {string} manifestPath
 * @returns {object} the validated manifest
 */
export function loadProjectionManifest(manifestPath) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new ProjectionError("manifest-invalid", `${manifestPath} is not readable JSON: ${error.message}`);
  }
  const verdict = validateProjectionManifestV1(parsed);
  if (!verdict.ok) {
    throw new ProjectionError("manifest-invalid", `${manifestPath} failed manifest validation:\n  - ${verdict.errors.join("\n  - ")}`);
  }
  return verdict.manifest;
}

/** Map a manifest selector onto the locator's selector forms. The forms are the
 *  same JSON shapes (#406 cited #407's grammar), so this is identity except
 *  for the `within: null` spelling the manifest may carry. */
function locatorSelector(selector) {
  if (selector.within !== undefined) return { line: selector.line, within: selector.within ?? null };
  return selector;
}

/** Translate the locator's typed failures into the projection's codes. */
function mapLocatorError(error, rule, context) {
  if (error.code === "NO_MATCH") {
    return new ProjectionError("stale-rule", `${context}: rule "${rule.id}" matches nothing (${error.message})`, rule.id);
  }
  if (error.code === "AMBIGUOUS_MATCH") {
    return new ProjectionError("ambiguous-match", `${context}: rule "${rule.id}" matches several: ${error.message}`, rule.id);
  }
  return new ProjectionError("manifest-invalid", `${context}: rule "${rule.id}": ${error.message}`, rule.id);
}

/**
 * removedChunks(sourceText, rule, context) — the byte ranges a rule removes,
 * resolved through the locator, in document order.
 */
function removedChunks(sourceText, rule, context) {
  if (rule.op === "prereq") {
    throw new ProjectionError("unsupported-op", `rule "${rule.id}" carries the prereq op; the stripper never executes it`, rule.id);
  }
  const command = rule.enforcingCommand.trim().split(/\s+/)[0];
  if (!CRATE_COMMANDS.includes(command)) {
    throw new ProjectionError("unknown-command", `rule "${rule.id}" names "${rule.enforcingCommand}", which the crate CLI does not dispatch`, rule.id);
  }

  let range;
  try {
    range = locate(sourceText, locatorSelector(rule.selector));
  } catch (error) {
    if (error instanceof SectionLocatorError) throw mapLocatorError(error, rule, context);
    throw error;
  }

  // A line selector removes exactly the matched line range; `except` scopes a
  // section removal and is meaningless here (the schema's within-only-on-line
  // rule already keeps the two forms apart).
  if (range.kind === "line-range") return [range];

  // A pointerize removes the section body: everything after the heading line's
  // newline through the section end (the heading line survives and carries the
  // pointer). A heading with no trailing newline has no body to remove.
  if (rule.op === "pointerize") {
    const headingNewline = sourceText.indexOf("\n", range.start);
    if (headingNewline === -1 || headingNewline >= range.end) return [];
    return [{ start: headingNewline + 1, end: range.end, text: sourceText.slice(headingNewline + 1, range.end) }];
  }

  if (rule.except === undefined) return [range];

  // Except-child: locate every kept child inside the parent slice — the slice
  // opens with the parent's own heading, so each child's path in the slice is
  // prefixed by the parent's title.
  const parentTitle = range.section.path[range.section.path.length - 1];
  const parentText = sourceText.slice(range.start, range.end);
  const kept = [];
  for (const entry of rule.except) {
    try {
      kept.push(locate(parentText, { path: [parentTitle, ...entry] }));
    } catch (error) {
      if (error instanceof SectionLocatorError) throw mapLocatorError(error, rule, `${context} except path ${JSON.stringify(entry)}`);
      throw error;
    }
  }
  kept.sort((left, right) => left.start - right.start);
  for (let index = 1; index < kept.length; index += 1) {
    if (kept[index].start < kept[index - 1].end) {
      throw new ProjectionError("ambiguous-match", `${context}: rule "${rule.id}" keeps overlapping children`, rule.id);
    }
  }

  // Parent range minus the kept spans, in document order.
  const chunks = [];
  let cursor = 0;
  for (const span of kept) {
    if (span.start > cursor) chunks.push({ start: cursor, end: span.start });
    cursor = span.end;
  }
  if (cursor < parentText.length) chunks.push({ start: cursor, end: parentText.length });
  return chunks.map((chunk) => ({
    start: range.start + chunk.start,
    end: range.start + chunk.end,
    text: parentText.slice(chunk.start, chunk.end),
  }));
}

/**
 * applyRule(sourceText, rule, context) — the source with one rule applied.
 * The rule's hash must match the exact bytes removed at application time.
 * @returns {string}
 */
function applyRule(sourceText, rule, context) {
  const chunks = removedChunks(sourceText, rule, context);
  const removed = chunks.map((chunk) => sourceText.slice(chunk.start, chunk.end)).join("");
  if (sha256Hex(removed) !== rule.contentHash) {
    throw new ProjectionError(
      "hash-mismatch",
      `${context}: rule "${rule.id}" binds ${rule.contentHash} but removes ${sha256Hex(removed)} — the source moved under the rule; re-verify the entry`,
      rule.id,
    );
  }
  let out = sourceText;
  for (let index = chunks.length - 1; index >= 0; index -= 1) {
    const chunk = chunks[index];
    let replacement = "";
    if (index === 0 && rule.op === "pointerize") {
      // The pointer takes the body's place, keeping the body's own trailing
      // newline shape so the next heading stays separated exactly as it was.
      const removedText = sourceText.slice(chunk.start, chunk.end);
      replacement = `${pointerLine(rule)}\n${removedText.endsWith("\n\n") ? "\n" : ""}`;
    }
    out = out.slice(0, chunk.start) + replacement + out.slice(chunk.end);
  }
  return out;
}

/**
 * applyProjection(sourceText, rules) — apply every rule in order, or raise.
 * @param {string} sourceText
 * @param {readonly object[]} rules rules for this one source document
 * @param {string} [context] label for error messages (the file being projected)
 * @returns {string} the projected text
 */
export function applyProjection(sourceText, rules, context = "source") {
  let out = sourceText;
  for (const rule of rules) out = applyRule(out, rule, context);
  return out;
}
