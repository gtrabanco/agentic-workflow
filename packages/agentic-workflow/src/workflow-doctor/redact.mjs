/**
 * redact.mjs — the bundle's redaction profile (issue #703 S7/S12).
 *
 * The profile is an **allowlist plus three transforms**, not a filter: only the
 * fields `bundle.mjs` names reach the receipt (the runner version and pin, the
 * installed skill count, the doctor summary, the ceremony profile and tier, the
 * unit-doc slug, the log token, the class slug, the reason and the model's
 * defect sentence). Paths are normalized to the unit-doc slug anchor before they
 * are ever printed, so this module's job is narrower than it looks:
 *
 *   - **secret shapes refuse the whole bundle.** A receipt that carries a
 *     credential is worse than no receipt: the refusal names the field and never
 *     echoes the value.
 *   - **an e-mail or a repository/absolute path is replaced** by a placeholder
 *     and counted, because the model's own defect sentence is the one free-text
 *     field and a small model may leak a path or an address into it.
 *   - **SHAs and digests are kept verbatim** (`S7`): they are the evidence a
 *     maintainer re-checks, and they name nothing about the project.
 *
 * The shapes are a transposition, not an import: this crate ships no secret
 * scanner (`scripts/secret-scan.mjs` is repository-only), which `PE-012` records.
 */

/** The secret shapes that refuse a bundle outright. Ordered: first match wins. */
export const SECRET_SHAPES = Object.freeze([
  { kind: "private-key", re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/u },
  { kind: "github-token", re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/u },
  { kind: "aws-access-key", re: /\bAKIA[0-9A-Z]{16}\b/u },
  { kind: "slack-token", re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/u },
  { kind: "npm-token", re: /\bnpm_[A-Za-z0-9]{20,}\b/u },
  {
    kind: "assigned-secret",
    re: /\b(?:secret|token|password|passwd|api[_-]?key|access[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9_\-+/=]{16,}/iu,
  },
]);

/** The shapes that are redacted instead of refused, with their placeholder. */
const REPLACEMENTS = Object.freeze([
  { kind: "email", re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/gu },
  { kind: "absolute-path", re: /(?:^|[\s"'(])\/(?:[\w.-]+\/)+[\w.-]+/gu },
  { kind: "windows-path", re: /\b[A-Za-z]:\\[^\s"'()]+/gu },
  { kind: "repository-path", re: /\b(?:docs|src|skills|scripts|packages|template|tests?)\/[\w./-]+/gu },
]);

/**
 * The kind of secret shape `text` carries, or `null`. The first match wins, so
 * a private key is reported as one even when it also matches a looser shape.
 *
 * @param {string} text
 * @returns {string|null}
 */
export function secretShape(text) {
  const value = String(text ?? "");
  for (const shape of SECRET_SHAPES) {
    if (shape.re.test(value)) return shape.kind;
  }
  return null;
}

/**
 * Apply the replacement half of the profile.
 *
 * @param {string} text
 * @returns {{text: string, redactions: {kind: string, count: number}[]}}
 */
export function sanitizeText(text) {
  let value = String(text ?? "");
  const counts = new Map();
  for (const { kind, re } of REPLACEMENTS) {
    value = value.replace(re, (match) => {
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
      // An absolute-path match carries its leading boundary character; keep it.
      const lead = /^[\s"'(]/u.exec(match)?.[0] ?? "";
      return `${lead}[redacted:${kind}]`;
    });
  }
  return {
    text: value,
    redactions: [...counts.entries()].map(([kind, count]) => ({ kind, count })).sort((left, right) => left.kind.localeCompare(right.kind)),
  };
}

/**
 * The class slug the bundle may carry: lower-case, digits and hyphens, bounded.
 * A slug is the one model-chosen identifier, so its shape is enforced rather
 * than trusted.
 *
 * @param {string} value
 * @returns {string}
 */
export function sanitizeClass(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 48);
}

/**
 * The redacted anchor for one mined row: `unit:<slug> <handle>`. The row's
 * internal `anchor` (a repository path) is never part of the result.
 *
 * @param {{unit: string|null, handle: string}} row
 * @returns {string}
 */
export function redactedAnchor(row) {
  return `unit:${row.unit ?? "unknown"} ${row.handle}`;
}
