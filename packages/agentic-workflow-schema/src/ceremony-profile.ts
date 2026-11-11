/**
 * The ceremony profile (`ceremony-profile@1`) — issue #436.
 *
 * A versioned, machine-readable block owned by the project charter (the #435
 * writer) that declares *which ceremony pieces this project pays*. The
 * dispatch/catalog check (the router's `--triage` path) reads it in code before
 * emitting its next step: a step whose piece the profile discards is skipped
 * with a recorded receipt — never emitted as a hand-off, never an error.
 *
 * **Anti-gaming is code, not discipline** (issue §Expected behaviour 4): the
 * published vocabularies are closed and the parser refuses instead of reading
 * optimistically, so the profile can only *narrow* ceremony relative to the
 * catalog default — nothing in the grammar can expand it, and nothing malformed
 * is silently ignored. Only the declared profile plus the computed risk tier
 * decide; there is no model-readable expansion path.
 *
 * **Absent block is a degradation, never an error** (the `doc-provenance` S5
 * pattern): a guide without the block reads as `null` — no profile declared,
 * every applicable piece keeps the catalog default. The full-ceremony adopter
 * is exactly the no-profile behavior.
 *
 * The carried block is one fenced block anywhere in the document text (the
 * caller scopes it — the router reads it from the guide's `## Project charter`
 * section), first match winning:
 *
 * ```text
 * ceremony-profile@1
 * docs-step: paid
 * captures: discarded
 * review-passes: a11y, seo
 * publish-gate: paid
 * test-policy: discarded
 * ```
 *
 * Every piece is scalar `paid | discarded`, except `review-passes`, which is
 * list-valued over the review-pack surfaces derived from the published
 * `PASS_NAMES` vocabulary (`classify` is internal machinery, not a payable
 * surface): the value names the surfaces the project pays; an unlisted surface
 * is discarded; `none` discards every surface. An undeclared piece keeps the
 * catalog's default behavior, so a partial profile only narrows what it names.
 *
 * `readCeremonyProfile` is deterministic and dependency-free: same text → same
 * result, always.
 */

import { PASS_NAMES } from "./vocabularies.js";

/** The contract id of the ceremony profile. */
export const CEREMONY_PROFILE_CONTRACT_ID = "ceremony-profile@1" as const;

/** The closed piece vocabulary (`ceremony-profile-piece`) — the ceremony
 *  elements a charter can pay or discard (the issue's example rows, closed). */
export const CEREMONY_PROFILE_PIECES = Object.freeze([
  "docs-step",
  "captures",
  "review-passes",
  "publish-gate",
  "test-policy",
]);
export type CeremonyProfilePiece = (typeof CEREMONY_PROFILE_PIECES)[number];

/** The closed adoption vocabulary (`ceremony-profile-adoption`): what the
 *  charter declares per piece. */
export const CEREMONY_PROFILE_ADOPTIONS = Object.freeze(["paid", "discarded"]);
export type CeremonyProfileAdoption = (typeof CEREMONY_PROFILE_ADOPTIONS)[number];

/** The closed refusal vocabulary (`ceremony-profile-refusal`): every way a
 *  present-but-wrong block can fail, typed. Declared before the derived
 *  review-surface const below: the normative-drift gate reads published const
 *  literals from committed source, and a literal placed after a
 *  derivation-expression const falls inside that const's regex match. */
export const CEREMONY_PROFILE_REFUSALS = Object.freeze([
  "bad-contract-id",
  "malformed-line",
  "unknown-piece",
  "duplicate-piece",
  "unknown-adoption",
  "unknown-review-surface",
  "empty-review-passes",
]);
export type CeremonyProfileRefusal = (typeof CEREMONY_PROFILE_REFUSALS)[number];

/** The closed review-surface vocabulary (`ceremony-review-surface`): the
 *  review-pack surfaces `review-passes` can name. Derived from the published
 *  `PASS_NAMES` (minus `classify` — internal machinery, never a payable
 *  surface), at the type level and at runtime alike, so adding a review pass
 *  is a schema-const change in one PR, never a prose-only edit. */
export type CeremonyReviewSurface = Exclude<(typeof PASS_NAMES)[number], "classify"> extends `review-${infer Surface}`
  ? Surface
  : Exclude<(typeof PASS_NAMES)[number], "classify">;
export const CEREMONY_REVIEW_SURFACES: readonly CeremonyReviewSurface[] = Object.freeze(
  [...new Set(PASS_NAMES.filter((name) => name !== "classify").map((name) => name.replace(/^review-/, "")))] as CeremonyReviewSurface[],
);

/** The parsed profile: only declared scalar pieces appear in `adoption` (an
 *  undeclared piece keeps the catalog default); `reviewPasses` is `null` when
 *  the piece is absent (catalog default) and the paid-surface list otherwise
 *  (empty = `none` — every surface discarded). */
export interface CeremonyProfile {
  contract: typeof CEREMONY_PROFILE_CONTRACT_ID;
  adoption: Partial<Record<CeremonyProfilePiece, CeremonyProfileAdoption>>;
  reviewPasses: CeremonyReviewSurface[] | null;
}

export interface CeremonyProfileRefusalDetail {
  reason: CeremonyProfileRefusal;
  detail: string;
}

export type CeremonyProfileResult =
  | { ok: true; profile: CeremonyProfile }
  | { ok: false; refusals: CeremonyProfileRefusalDetail[] };

/** A fence opener: three or more backticks/tildes with an optional info
 *  string (CommonMark: the info string of a backtick fence cannot contain
 *  backticks). */
const FENCE_OPEN = /^\s*(`{3,}|~{3,})/u;

function fenceOpener(line: string): string | null {
  const open = FENCE_OPEN.exec(line);
  if (!open) return null;
  const marker = open[1];
  const rest = line.trimEnd().slice(marker.length);
  if (marker[0] === "`" && rest.includes("`")) return null;
  return marker;
}

/** A fence closer: the same character, at least the same length, no info. */
function isFenceClose(line: string, marker: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith(marker[0].repeat(marker.length))) return false;
  return trimmed === marker[0].repeat(trimmed.length);
}
const MARKER_PREFIX = "ceremony-profile@";
const LINE = /^([a-zA-Z][a-zA-Z-]*):\s*(.*)$/u;
const LIST_SEPARATOR = /\s*,\s*/u;
const NONE = "none";

function refusal(reason: CeremonyProfileRefusal, detail: string): CeremonyProfileRefusalDetail {
  return { reason, detail };
}

function isPiece(value: string): value is CeremonyProfilePiece {
  return (CEREMONY_PROFILE_PIECES as readonly string[]).includes(value);
}

function isSurface(value: string): value is CeremonyReviewSurface {
  return (CEREMONY_REVIEW_SURFACES as readonly string[]).includes(value);
}

/**
 * The block-extraction walk: fenced blocks in document order; the first block
 * whose first non-empty line carries the `ceremony-profile@` marker wins.
 * Returns the marker line's version token with the block's body lines, `null`
 * when no block matches (absent = degradation, never an error).
 */
function extractProfileBlock(
  doc: string,
): { version: string; body: string[] } | { refusals: CeremonyProfileRefusalDetail[] } | null {
  const lines = doc.split("\n");
  let fence: string | null = null;
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
    const body: string[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (isFenceClose(lines[cursor], fence)) break;
      body.push(lines[cursor]);
    }
    if (version !== CEREMONY_PROFILE_CONTRACT_ID.slice(MARKER_PREFIX.length)) {
      return { refusals: [refusal("bad-contract-id", `expected ${CEREMONY_PROFILE_CONTRACT_ID}, found ${MARKER_PREFIX}${version || "<empty>"}`)] };
    }
    return { version, body };
  }
  return null;
}

/**
 * Read the ceremony profile from a document's text. `null` when no block is
 * present (no profile declared — the catalog default stands); a typed refusal
 * set when a block is present but wrong; the parsed profile otherwise.
 */
export function readCeremonyProfile(doc: string): CeremonyProfileResult | null {
  const extracted = extractProfileBlock(doc);
  if (extracted === null) return null;
  if ("refusals" in extracted) return { ok: false, refusals: extracted.refusals };

  const refusals: CeremonyProfileRefusalDetail[] = [];
  const adoption: Partial<Record<CeremonyProfilePiece, CeremonyProfileAdoption>> = {};
  let reviewPasses: CeremonyReviewSurface[] | null = null;

  for (const raw of extracted.body) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;
    const match = LINE.exec(line);
    if (!match) {
      refusals.push(refusal("malformed-line", line));
      continue;
    }
    const [, key, value] = match;
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
      const surfaces: CeremonyReviewSurface[] = [];
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
    if (!(CEREMONY_PROFILE_ADOPTIONS as readonly string[]).includes(value.trim())) {
      refusals.push(refusal("unknown-adoption", value.trim() || "<empty>"));
      continue;
    }
    adoption[key] = value.trim() as CeremonyProfileAdoption;
  }

  if (refusals.length > 0) return { ok: false, refusals };
  // A bare `ceremony-profile@1` marker (or a comment-only body) is a valid
  // empty profile: every piece keeps the catalog default — pinned by the
  // corpus's "a block with no declarations is valid" case (external-verify B1:
  // no phantom refusal is published for a shape the parser accepts).
  return { ok: true, profile: { contract: CEREMONY_PROFILE_CONTRACT_ID, adoption, reviewPasses } };
}

/**
 * The canonical serialization: declared scalar pieces in the closed piece
 * order, `review-passes` as the paid list (surfaces in the closed surface
 * order) or `none` when empty. Round-trips through `readCeremonyProfile`.
 */
export function serializeCeremonyProfile(profile: CeremonyProfile): string {
  const lines: string[] = [];
  for (const piece of CEREMONY_PROFILE_PIECES) {
    if (piece === "review-passes") {
      const paid = profile.reviewPasses;
      if (paid !== null) {
        const surfaces = CEREMONY_REVIEW_SURFACES.filter((surface) => paid.includes(surface));
        lines.push(surfaces.length === 0 ? `${piece}: ${NONE}` : `${piece}: ${surfaces.join(", ")}`);
      }
      continue;
    }
    const value = profile.adoption[piece];
    if (value !== undefined) lines.push(`${piece}: ${value}`);
  }
  return lines.join("\n");
}
