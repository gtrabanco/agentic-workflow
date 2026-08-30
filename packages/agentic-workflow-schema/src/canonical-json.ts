/**
 * Canonical JSON serialization primitives — the byte-level authority behind
 * every digest in the package.
 *
 * Two domains, one walker:
 *   - `verification` (which the pre-execution contracts also use): a leaf
 *     outside the JSON data model is a NAMED refusal, so a digest can never be
 *     produced over a document the validators would refuse.
 *   - `legacy`: the 3.3.0 behaviour, kept byte-for-byte for the candidate-review
 *     family whose digests are already published in receipts. Non-finite numbers
 *     serialize as `null` there; that collision class stays on the legacy path
 *     and the cost is stated in `decisions.md`, not hidden.
 *
 * Extracted from the package root so the verification and pre-execution
 * contracts share ONE serializer with the candidate family instead of restating
 * it. Behaviour is unchanged and pinned by
 * `test/fixtures/canonical-legacy-vectors.mjs` and the published vector sets.
 */

import {
  captureVerificationInput,
  projectStructure,
  type VerificationContractSpec,
} from "./verification-contract.js";

export type CanonicalLeafDomain = "legacy" | "verification";

const _utf8Encoder = new TextEncoder();

/** Byte length of a string in UTF-8 — the only length any budget uses. */
export function utf8Bytes(text: string): number {
  return _utf8Encoder.encode(text).length;
}

/**
 * Unsigned UTF-8 byte comparison: the canonical ordering used for every ordered
 * collection in the package (artifact paths, context identities, finding ids,
 * acceptance inputs). JS's default string compare is code-unit order, which
 * differs for non-ASCII, so it is never used for a digest input.
 */
export function utf8ByteCompare(a: string, b: string): number {
  const ba = _utf8Encoder.encode(a);
  const bb = _utf8Encoder.encode(b);
  const len = Math.min(ba.length, bb.length);
  for (let i = 0; i < len; i++) {
    const diff = ba[i] - bb[i];
    if (diff !== 0) return diff;
  }
  return ba.length - bb.length;
}

/**
 * D4/D6 — Canonical serialization of one value: object keys sorted, compact
 * separators, and no formatting a second implementation could drift on.
 */
export function canonicalJSONValue(v: unknown, domain: CanonicalLeafDomain = "verification"): string {
  if (v === null) return "null";
  const kind = typeof v;
  if (kind === "string") return JSON.stringify(v);
  if (kind === "number") {
    if (!Number.isFinite(v as number)) {
      if (domain === "verification") {
        throw new TypeError(`canonical JSON: unsupported leaf (non-finite ${kind})`);
      }
      return JSON.stringify(v); // 3.3.0: NaN / ±Infinity serialize as `null`
    }
    return JSON.stringify(v);
  }
  if (kind === "boolean") return JSON.stringify(v);
  if (Array.isArray(v)) {
    // An explicit arrow, never `.map(canonicalJSONValue)`: `map` would pass the
    // element INDEX as the domain, silently selecting the legacy fallback for
    // every array leaf.
    return "[" + v.map((item) => canonicalJSONValue(item, domain)).join(",") + "]";
  }
  if (kind === "object") {
    const keys = Object.keys(v as Record<string, unknown>).sort();
    return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalJSONValue((v as Record<string, unknown>)[k], domain)).join(",") + "}";
  }
  if (domain === "verification") {
    throw new TypeError(`canonical JSON: unsupported leaf (${kind})`);
  }
  return JSON.stringify(v);
}

/**
 * F91 — canonical serialization of a contract value, guarded by the contract's
 * own ceilings.
 *
 * A digest must never be produced over a document the validators would refuse, so
 * before any bytes are written this checks the declared-collection cardinality
 * and the canonical byte budget, and it does both on ONE bounded capture of the
 * input. Without the capture, the guard and the projection would read the same
 * submission twice and an accessor that changes value could make a digest cover a
 * document the guard never saw (F97/F99).
 *
 * A refusal is a named `TypeError` quoting only the violated limit — never the
 * submitted content. `family`/`label` name the contract in the message
 * (`verification plan`, `pre-execution receipt`) so the failure is self-locating.
 * `budgetTag` optionally carries the decision tag a family pins on its byte
 * budget (feature 26 pins `D14`; F91 asserts it), keeping each family's
 * published message surface byte-identical across the shared serializer.
 */
export function canonicalizeContractInput(
  value: unknown,
  contract: VerificationContractSpec,
  options: {
    readonly collectionField: string;
    readonly maxItems: number;
    readonly budgetBytes: number;
    readonly family: string;
    readonly label: string;
    readonly budgetTag?: string;
  },
): string {
  const { collectionField, maxItems, budgetBytes, family, label, budgetTag } = options;
  const budgetName = budgetTag ? `${budgetTag} ${budgetBytes}-byte` : `${budgetBytes}-byte`;
  const submitted = captureVerificationInput(value, budgetBytes);
  if (!submitted.ok) {
    throw new TypeError(
      submitted.code === "limit-exceeded"
        ? // The capture measured the canonical form past the budget — the same
          // refusal F91 names, reached before the serializer could finish it.
          `${family} ${label} canonical form exceeds the ${budgetName} budget — validate before canonicalizing`
        : `${family} ${label} input is not a readable JSON document — validate before canonicalizing`,
    );
  }
  const document = submitted.value;
  if (document !== null && typeof document === "object") {
    const items = (document as Record<string, unknown>)[collectionField];
    if (Array.isArray(items) && items.length > maxItems) {
      throw new TypeError(
        `${family} ${label} exceeds the limit of at most ${maxItems} ${collectionField} — validate before canonicalizing`,
      );
    }
  }
  const canonical = canonicalJSONValue(projectStructure(contract, contract.root, document));
  if (utf8Bytes(canonical) > budgetBytes) {
    throw new TypeError(
      `${family} ${label} canonical form exceeds the ${budgetName} budget — validate before canonicalizing`,
    );
  }
  return canonical;
}
