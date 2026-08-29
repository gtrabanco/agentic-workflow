// D16 diagnostic assertions shared by the feature-26 suites.
//
// A validation failure is `{ ok: false, diagnostics, truncated }` where each row
// is `{ code, path }` — a frozen code from `VERIFICATION_DIAGNOSTIC_CODES` plus an
// RFC 6901 pointer. No row ever carries a message or a submitted value, so the
// assertions below match on codes and paths, never on prose.
import assert from "node:assert/strict";
import { VERIFICATION_DIAGNOSTIC_CODES } from "../../dist/index.js";

/** Diagnostic rows in emission order. */
export function rowsOf(result) {
  assert.equal(result.ok, false, "expected a rejected result");
  assert.ok(Array.isArray(result.diagnostics), "`diagnostics` must be an array");
  return result.diagnostics;
}

/** Codes only, in emission order. */
export function codesOf(result) {
  return rowsOf(result).map((row) => row.code);
}

/** Compact rendering for assertion messages — never a substitute for matching. */
export function describeDiagnostics(result) {
  if (result.ok) return "accepted";
  const rows = result.diagnostics.map((row) => `${row.code}@${row.path}`).join(" | ");
  return `${rows}${result.truncated ? " (+truncated)" : ""}`;
}

/** True when the rejection carries `code`, optionally at exactly `path`. */
export function hasDiagnostic(result, code, path) {
  return rowsOf(result).some(
    (row) => row.code === code && (path === undefined || row.path === path),
  );
}

/** Rejection must carry `code` (optionally at `path`); the reason is reported. */
export function assertDiagnostic(result, code, path, label = "") {
  assert.equal(result.ok, false, `${label || code}: expected rejection, got acceptance`);
  assert.ok(
    hasDiagnostic(result, code, path),
    `${label || code}: no ${code}${path ? `@${path}` : ""} in [${describeDiagnostics(result)}]`,
  );
}

/** Rejection must consist of EXACTLY these code+path rows, in order. */
export function assertDiagnosticRows(result, expected, label = "") {
  assert.equal(result.ok, false, `${label}: expected rejection`);
  assert.deepEqual(
    rowsOf(result).map((row) => [row.code, row.path]),
    expected.map(([code, path]) => [code, path]),
    `${label}: ${describeDiagnostics(result)}`,
  );
}

/** Failure rows must be code+path only — the redaction rule (D16/F71). */
export function assertRedacted(result) {
  for (const row of rowsOf(result)) {
    assert.deepEqual(Object.keys(row).sort(), ["code", "path"], "a diagnostic row is code+path only");
    assert.ok(Object.isFrozen(row), "diagnostic rows must be frozen");
    assert.ok(
      VERIFICATION_DIAGNOSTIC_CODES.includes(row.code),
      `diagnostic code ${row.code} is not in the published vocabulary`,
    );
    assert.equal(typeof row.path, "string");
    // RFC 6901: "" is the whole document; otherwise a leading "/" followed by
    // slash-separated tokens whose only escapes are ~0 (for ~) and ~1 (for /).
    const tokenOk = (token) => /^(?:[^~]|~0|~1)*$/.test(token);
    assert.ok(
      row.path === "" || (row.path.startsWith("/") && row.path.slice(1).split("/").every(tokenOk)),
      `path must be an RFC 6901 pointer, got ${JSON.stringify(row.path)}`,
    );
    for (const token of row.path.split("/").slice(1)) {
      assert.ok(
        token === "" || /^\d+$/.test(token) || /^[A-Za-z][A-Za-z0-9]*$/.test(token),
        `path tokens must be contract names or indices, got ${JSON.stringify(token)} in ${row.path}`,
      );
    }
  }
}

/**
 * Rejection must carry `code` on the row whose path names `field` (any level of
 * the pointer, so `/commands/2/args/0` matches `args`).
 *
 * D16 removed the prose a substring assertion used to match, so field identity is
 * proven through the RFC 6901 pointer instead — the same claim, stated against the
 * contract location rather than against an error string.
 */
export function assertDiagnosticOn(result, code, field, label = "") {
  assert.equal(result.ok, false, `${label || `${code}@${field}`}: expected rejection, got acceptance`);
  assert.ok(
    rowsOf(result).some((row) => row.code === code && row.path.split("/").includes(field)),
    `${label || code}: no ${code} diagnostic on a path naming "${field}" — [${describeDiagnostics(result)}]`,
  );
}

/**
 * Rejection must carry `code` at exactly this RFC 6901 `path`.
 *
 * Used where the pointer itself is the claim — e.g. an `unknown-field` row, whose
 * path names the offending container rather than the submitted key (D16 redaction).
 */
export function assertDiagnosticAt(result, code, path, label = "") {
  assert.equal(result.ok, false, `${label || `${code}@${path}`}: expected rejection, got acceptance`);
  assert.ok(
    hasDiagnostic(result, code, path),
    `${label || code}: no ${code}@${JSON.stringify(path)} diagnostic — [${describeDiagnostics(result)}]`,
  );
}

/** The rejection consists of exactly one row: `code` at `path`. */
export function assertOnlyDiagnostic(result, code, path, label = "") {
  assertDiagnosticAt(result, code, path, label);
  assert.equal(result.diagnostics.length, 1, `${label}: expected one row — [${describeDiagnostics(result)}]`);
  assert.equal(result.truncated, false, `${label}: a single row cannot be truncated`);
}
