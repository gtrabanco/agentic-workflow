/**
 * ceremony-profile.mjs — the runtime half of the `ceremony-profile@1` contract
 * (issue #436) for the plain-`.mjs` dispatch path.
 *
 * The canonical machine contract lives in the schema package
 * (`packages/agentic-workflow-schema/src/ceremony-profile.ts`): a plain `.mjs`
 * script cannot import TypeScript, so this module mirrors the published
 * vocabularies and the reader — the same pattern as `unit-doc-phases.mjs`'s
 * `LOG_KINDS`. `scripts/vocabulary-parity.test.mjs` refuses a copy that drifts
 * from the built schema runtime, and the router corpus
 * (`scripts/ceremony-profile.test.mjs`) pins the dispatch behavior.
 *
 * **Anti-gaming is code, not discipline**: the vocabularies are closed and the
 * reader refuses instead of reading optimistically, so a profile can only
 * narrow ceremony relative to the catalog default. An absent block is a
 * degradation, never an error (`null` — no profile declared, the catalog
 * default stands); a present-but-wrong block is a typed refusal set.
 */

/** The contract id of the ceremony profile. */
export const CEREMONY_PROFILE_CONTRACT_ID = "ceremony-profile@1";

/** The closed piece vocabulary (`ceremony-profile-piece`). */
export const CEREMONY_PROFILE_PIECES = Object.freeze([
  "docs-step",
  "captures",
  "review-passes",
  "publish-gate",
  "test-policy",
]);

/** The closed adoption vocabulary (`ceremony-profile-adoption`). */
export const CEREMONY_PROFILE_ADOPTIONS = Object.freeze(["paid", "discarded"]);

/** The closed review-surface vocabulary (`ceremony-review-surface`), derived
 *  from the schema package's published `PASS_NAMES` (minus `classify`); the
 *  parity suite pins the derivation. */
export const CEREMONY_REVIEW_SURFACES = Object.freeze([
  "code",
  "security",
  "verify",
  "design",
  "a11y",
  "brand",
  "perf",
  "seo",
  "debt",
]);

/** The closed refusal vocabulary (`ceremony-profile-refusal`). */
export const CEREMONY_PROFILE_REFUSALS = Object.freeze([
  "bad-contract-id",
  "malformed-line",
  "unknown-piece",
  "duplicate-piece",
  "unknown-adoption",
  "unknown-review-surface",
  "empty-review-passes",
]);

const MARKER_PREFIX = "ceremony-profile@";
const LINE = /^([a-zA-Z][a-zA-Z-]*):\s*(.*)$/u;
const LIST_SEPARATOR = /\s*,\s*/u;
const NONE = "none";

const FENCE_OPEN = /^\s*(`{3,}|~{3,})/u;

function fenceOpener(line) {
  const open = FENCE_OPEN.exec(line);
  if (!open) return null;
  const marker = open[1];
  const rest = line.trimEnd().slice(marker.length);
  if (marker[0] === "`" && rest.includes("`")) return null;
  return marker;
}

function isFenceClose(line, marker) {
  const trimmed = line.trim();
  if (!trimmed.startsWith(marker[0].repeat(marker.length))) return false;
  return trimmed === marker[0].repeat(trimmed.length);
}

function refusal(reason, detail) {
  return { reason, detail };
}

function isPiece(value) {
  return CEREMONY_PROFILE_PIECES.includes(value);
}

function isSurface(value) {
  return CEREMONY_REVIEW_SURFACES.includes(value);
}

/**
 * Extract the first fenced block whose first non-empty line carries the
 * `ceremony-profile@` marker. `null` when none matches; typed refusals when
 * the version token is not the contract's.
 */
function extractProfileBlock(doc) {
  const lines = doc.split("\n");
  let fence = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (fence === null) {
      const opener = fenceOpener(line);
      if (opener) fence = opener;
      continue;
    }
    if (fence !== null && isFenceClose(line, fence)) {
      fence = null;
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed.startsWith(MARKER_PREFIX)) continue;
    const version = trimmed.slice(MARKER_PREFIX.length).trim();
    const body = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (isFenceClose(lines[cursor], fence)) break;
      body.push(lines[cursor]);
    }
    if (version !== CEREMONY_PROFILE_CONTRACT_ID.slice(MARKER_PREFIX.length)) {
      return {
        refusals: [refusal("bad-contract-id", `expected ${CEREMONY_PROFILE_CONTRACT_ID}, found ${MARKER_PREFIX}${version || "<empty>"}`)],
      };
    }
    return { version, body };
  }
  return null;
}

/**
 * Read the ceremony profile from a document's text — same contract as the
 * schema package's `readCeremonyProfile`. `null` when no block is present; a
 * typed refusal set when a block is present but wrong; the parsed profile
 * otherwise.
 */
export function readCeremonyProfile(doc) {
  const extracted = extractProfileBlock(doc);
  if (extracted === null) return null;
  if ("refusals" in extracted) return { ok: false, refusals: extracted.refusals };

  const refusals = [];
  const adoption = {};
  let reviewPasses = null;

  for (const raw of extracted.body) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;
    const match = LINE.exec(line);
    if (!match) {
      refusals.push(refusal("malformed-line", line));
      continue;
    }
    const key = match[1];
    const value = match[2];
    if (!isPiece(key)) {
      refusals.push(refusal("unknown-piece", key));
      continue;
    }
    if (adoption[key] !== undefined || (key === "review-passes" && reviewPasses !== null)) {
      refusals.push(refusal("duplicate-piece", key));
      continue;
    }
    if (key === "review-passes") {
      const names = value.trim();
      if (names === "") {
        refusals.push(refusal("empty-review-passes", line));
        continue;
      }
      if (names === NONE) {
        reviewPasses = [];
        continue;
      }
      const surfaces = [];
      let bad = false;
      for (const name of names.split(LIST_SEPARATOR)) {
        const surface = name.trim();
        if (!isSurface(surface)) {
          refusals.push(refusal("unknown-review-surface", surface));
          bad = true;
          continue;
        }
        if (!surfaces.includes(surface)) surfaces.push(surface);
      }
      if (!bad) reviewPasses = surfaces;
      continue;
    }
    if (!CEREMONY_PROFILE_ADOPTIONS.includes(value.trim())) {
      refusals.push(refusal("unknown-adoption", value.trim() || "<empty>"));
      continue;
    }
    adoption[key] = value.trim();
  }

  if (refusals.length > 0) return { ok: false, refusals };
  return { ok: true, profile: { contract: CEREMONY_PROFILE_CONTRACT_ID, adoption, reviewPasses } };
}

/**
 * The guide source the router reads the block from: the `## Project charter`
 * section of the project guide, when that section carries a profile block.
 * Returns the section text (or `""` when the guide has no charter section —
 * the caller treats both as "no profile declared").
 */
export function charterSectionOf(guideText) {
  const lines = guideText.split("\n");
  let start = -1;
  let level = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const heading = /^(#{1,6})\s+(.*)$/.exec(lines[index]);
    if (!heading) continue;
    if (start === -1) {
      if (heading[2].trim() === "Project charter") {
        start = index;
        level = heading[1].length;
      }
      continue;
    }
    if (heading[1].length <= level) return lines.slice(start, index).join("\n");
  }
  return start === -1 ? "" : lines.slice(start).join("\n");
}
