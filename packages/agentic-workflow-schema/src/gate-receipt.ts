/**
 * The machine gate receipt (`gate-receipt@1`) — issue #409, unit
 * `docs/features/108-machine-gate-receipts/`.
 *
 * The project verification gate's output, made a document instead of
 * conversation text: the consumer reads exit codes, per-check verdicts and
 * bounded failing fragments; the full log stays on disk and is referenced,
 * never inlined.
 *
 * **Validity is the declared content manifest, never the commit.** The HEAD sha
 * under `provenance` says *where the run happened*; `manifest.entries` (path +
 * SHA-256 per file) is the declared closure that says *which bytes the claim
 * covers*, and `manifest.digest` is the canonical digest of those entries. An
 * unrelated later commit — or a commit that adds an unsigned file — cannot
 * invalidate the receipt, and a commit that mutates one signed byte must
 * (owner directive recorded as S12 in the unit doc). `compareGateReceiptToCurrent`
 * is that predicate: a pure local hash comparison, no gate re-run.
 *
 * **The short-circuit stops at the determinism frontier (S13).** `generated_at`
 * and `duration_ms` are records about a run, not promises about bytes; they are
 * provenance and freshness never compares them.
 *
 * **Core is closed and bounded.** An unknown key anywhere is refused, and the
 * published limits keep what a consumer *reads* compact: ≤64 checks, ≤8
 * fragments of ≤240 characters each. The manifest is data, not context — it
 * carries one `{path, sha256}` row per signed file (≤16,384 rows, ≤1 MiB of
 * canonical JSON, sized from a measured 1,568-file closure at 217 KiB), because
 * freshness must re-hash exactly the bytes the claim covers.
 *
 * The Draft-07 projection (`gate-receipt.schema.json`) is hand-maintained beside
 * this module, the `batch-plan` precedent, and `test/gate-receipt.test.mjs` pins
 * that the two agree.
 */

import { canonicalJSONValue, utf8ByteCompare, utf8Bytes } from "./canonical-json.js";
import { sha256Hex, sha256HexSync } from "./sha256.js";

/** The contract id of the machine gate receipt. */
export const GATE_RECEIPT_CONTRACT_ID = "agentic-workflow/gate-receipt";

/** The version constant: adding or changing a core field bumps this. */
export const GATE_RECEIPT_VERSION = 1;

/** The schema token printed in the document's `schema` field. */
export const GATE_RECEIPT_SCHEMA = "gate-receipt@1";

/** The closed verdict set. `pass` is never inferred from a missing check. */
export const GATE_RECEIPT_VERDICTS = ["pass", "fail", "degraded"] as const;
export type GateReceiptVerdict = (typeof GATE_RECEIPT_VERDICTS)[number];

/** The closed per-check status set. */
export const GATE_CHECK_STATUSES = ["passed", "failed", "skipped"] as const;
export type GateCheckStatus = (typeof GATE_CHECK_STATUSES)[number];

/** The closed freshness vocabulary a consumer routes on. */
export const GATE_RECEIPT_FRESHNESS_CODES = ["current", "missing", "invalid", "stale-manifest"] as const;
export type GateReceiptFreshnessCode = (typeof GATE_RECEIPT_FRESHNESS_CODES)[number];

/**
 * The declared, minimal closure a gate claim covers (S14): the lockfile and the
 * manifests that decide what runs, the gate scripts and the skills that order
 * them, the project documents the deterministic checks read, and the packages'
 * source and test trees. Build output (`dist/`) and dependencies
 * (`node_modules/`) are never signed — no commit owns those bytes.
 *
 * A new input to the gate's result belongs here in the same change; that is the
 * future cost the unit doc records.
 */
export const GATE_MANIFEST_PATTERNS = [
  ".bun-version",
  ".github/workflows/**",
  ".node-version",
  "bun.lock",
  "docs/**",
  "package.json",
  "packages/*/package.json",
  "packages/*/*.schema.json",
  "packages/*/src/**",
  "packages/*/test/**",
  "packages/*/tsconfig*.json",
  "scripts/**",
  "skills/**",
  "template/**",
] as const;

/** The published bounds of the document (S2). */
export const GATE_RECEIPT_LIMITS = Object.freeze({
  checks: 64,
  fragments: 8,
  fragmentChars: 240,
  manifestEntries: 16_384,
  pathChars: 1024,
  logRefChars: 1024,
  commandArgChars: 512,
  bytes: 1_048_576,
});

const CHECK_ID = /^[a-z0-9][a-z0-9._-]*$/u;
const DEGRADED_REASON = /^[a-z0-9][a-z0-9-]*$/u;
const HEX64 = /^[0-9a-f]{64}$/u;
const HEAD_SHA = /^[0-9a-f]{7,40}$/u;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u;

/** A manifest row: one signed file. */
export interface GateManifestEntry {
  /** Repository-relative path, never absolute and never escaping the root. */
  readonly path: string;
  /** Lowercase 64-hex SHA-256 of the file's bytes. */
  readonly sha256: string;
}

/** Where and when the run happened — provenance, never a validity test. */
export interface GateReceiptProvenance {
  /** The commit the run happened on, or `null` outside a checkout. */
  readonly head_sha: string | null;
  /** ISO-8601 UTC instant; a record about the run (S13). */
  readonly generated_at: string;
  /** The argv that produced the run, so a consumer can re-run the same gate. */
  readonly gate_command: readonly string[];
}

/** The declared closure and its canonical digest. */
export interface GateReceiptManifest {
  /** Lowercase 64-hex digest of the sorted `entries` (see `digestGateManifest`). */
  readonly digest: string;
  /** Path-ordered rows; unique paths; ≤ `GATE_RECEIPT_LIMITS.manifestEntries`. */
  readonly entries: readonly GateManifestEntry[];
}

/** One check's outcome, with only the failing fragments inlined. */
export interface GateCheckReceipt {
  /** Stable step id from the gate's own table. */
  readonly id: string;
  readonly status: GateCheckStatus;
  /** Process exit code; `null` when the check produced none. */
  readonly exit_code: number | null;
  /** Record about the run, never compared by freshness (S13). */
  readonly duration_ms: number;
  /** Bounded failing fragments: the check's own first error lines. */
  readonly fragments: readonly string[];
}

/** The whole-run record: exit code, duration and the full-log reference. */
export interface GateRunReceipt {
  readonly exit_code: number;
  readonly duration_ms: number;
  /** Path to the full log on disk; the log itself is never inlined. */
  readonly log_ref: string;
}

/** The canonical machine gate receipt. */
export interface GateReceiptV1 {
  readonly contract: typeof GATE_RECEIPT_CONTRACT_ID;
  readonly version: typeof GATE_RECEIPT_VERSION;
  readonly schema: typeof GATE_RECEIPT_SCHEMA;
  readonly verdict: GateReceiptVerdict;
  /** Closed degradation reasons; non-empty iff `verdict: degraded` (S11). */
  readonly degraded: readonly string[];
  readonly provenance: GateReceiptProvenance;
  readonly manifest: GateReceiptManifest;
  readonly gate: GateRunReceipt;
  readonly checks: readonly GateCheckReceipt[];
}

/** The single validation result shape the package publishes. */
export type GateReceiptValidationResult =
  | { ok: true; receipt: GateReceiptV1 }
  | { ok: false; errors: readonly string[] };

/** The freshness verdict a consumer routes on. */
export type GateReceiptFreshnessResult =
  | { fresh: true }
  | { fresh: false; reasonCode: Exclude<GateReceiptFreshnessCode, "current">; changedPaths: readonly string[] };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isInteger = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value);

/** `true` when `path` stays inside the repository root. */
function safeRelativePath(path: string): boolean {
  if (path.length === 0 || path.length > GATE_RECEIPT_LIMITS.pathChars) return false;
  if (path.startsWith("/") || path.includes("\\") || path.includes("\0")) return false;
  return !path.split("/").includes("..");
}

/** The canonical digest of a manifest: sorted `{path, sha256}` rows, SHA-256. */
export function digestGateManifest(entries: readonly GateManifestEntry[]): string {
  const rows = [...entries]
    .map((entry) => ({ path: entry.path, sha256: entry.sha256 }))
    .sort((left, right) => utf8ByteCompare(left.path, right.path));
  return sha256HexSync(canonicalJSONValue(rows));
}

/** The canonical digest of a validated receipt (whole document). */
export async function digestGateReceipt(receipt: GateReceiptV1): Promise<string> {
  return sha256Hex(canonicalJSONValue(receipt));
}

/** The keys each object admits; an unknown key is refused, never ignored. */
const KEYS = Object.freeze({
  root: ["checks", "contract", "degraded", "gate", "manifest", "provenance", "schema", "verdict", "version"],
  provenance: ["gate_command", "generated_at", "head_sha"],
  manifest: ["digest", "entries"],
  entry: ["path", "sha256"],
  gate: ["duration_ms", "exit_code", "log_ref"],
  check: ["duration_ms", "exit_code", "fragments", "id", "status"],
});

/** Unknown own keys of `value` against the declared set, sorted. */
function unknownKeys(value: Record<string, unknown>, allowed: readonly string[]): string[] {
  return Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .sort();
}

/** A manifest row shape check; returns one error per defect. */
function checkManifestEntry(entry: unknown, index: number, errors: string[]): GateManifestEntry | null {
  const at = `/manifest/entries/${index}`;
  if (!isObject(entry)) {
    errors.push(`${at}: manifest entry is not a JSON object`);
    return null;
  }
  for (const key of unknownKeys(entry, KEYS.entry)) errors.push(`${at}: unknown key ${key}`);
  let ok = true;
  if (typeof entry.path !== "string" || !safeRelativePath(entry.path)) {
    errors.push(`${at}/path: not a safe repository-relative path`);
    ok = false;
  }
  if (typeof entry.sha256 !== "string" || !HEX64.test(entry.sha256)) {
    errors.push(`${at}/sha256: not a lowercase 64-hex digest`);
    ok = false;
  }
  return ok ? { path: entry.path as string, sha256: entry.sha256 as string } : null;
}

/** A check row shape check; returns one error per defect. */
function checkCheck(check: unknown, index: number, errors: string[]): GateCheckReceipt | null {
  const at = `/checks/${index}`;
  if (!isObject(check)) {
    errors.push(`${at}: check is not a JSON object`);
    return null;
  }
  for (const key of unknownKeys(check, KEYS.check)) errors.push(`${at}: unknown key ${key}`);
  let ok = true;
  if (typeof check.id !== "string" || check.id.length === 0 || check.id.length > 128 || !CHECK_ID.test(check.id)) {
    errors.push(`${at}/id: not a check-id slug`);
    ok = false;
  }
  if (typeof check.status !== "string" || !GATE_CHECK_STATUSES.includes(check.status as GateCheckStatus)) {
    errors.push(`${at}/status: not one of ${GATE_CHECK_STATUSES.join(" | ")}`);
    ok = false;
  }
  if (check.exit_code !== null && !isInteger(check.exit_code)) {
    errors.push(`${at}/exit_code: not an integer or null`);
    ok = false;
  }
  if (!isInteger(check.duration_ms) || check.duration_ms < 0) {
    errors.push(`${at}/duration_ms: not a non-negative integer`);
    ok = false;
  }
  let fragments: string[] = [];
  if (!Array.isArray(check.fragments)) {
    errors.push(`${at}/fragments: not an array`);
    ok = false;
  } else {
    if (check.fragments.length > GATE_RECEIPT_LIMITS.fragments) {
      errors.push(`${at}/fragments: more than ${GATE_RECEIPT_LIMITS.fragments} fragments`);
      ok = false;
    }
    for (const [fragmentIndex, fragment] of check.fragments.entries()) {
      if (typeof fragment !== "string" || fragment.length === 0 || fragment.length > GATE_RECEIPT_LIMITS.fragmentChars) {
        errors.push(`${at}/fragments/${fragmentIndex}: not a non-empty string of at most ${GATE_RECEIPT_LIMITS.fragmentChars} characters`);
        ok = false;
      }
    }
    fragments = check.fragments.filter((fragment): fragment is string => typeof fragment === "string");
  }
  return ok
    ? {
        id: check.id as string,
        status: check.status as GateCheckStatus,
        exit_code: check.exit_code as number | null,
        duration_ms: check.duration_ms as number,
        fragments,
      }
    : null;
}

/**
 * The sole receipt-validation authority.
 *
 * Accepts any JSON value, returns a normalized own-property DTO on success and
 * every defect as a named error on failure. A document over the declared byte
 * budget is refused before any structural walk allocates diagnostics.
 */
export function validateGateReceipt(value: unknown): GateReceiptValidationResult {
  if (!isObject(value)) return { ok: false, errors: ["gate receipt is not a JSON object"] };

  let canonical: string;
  try {
    canonical = canonicalJSONValue(value);
  } catch {
    return { ok: false, errors: ["gate receipt is not JSON-serializable"] };
  }
  if (utf8Bytes(canonical) > GATE_RECEIPT_LIMITS.bytes) {
    return { ok: false, errors: [`gate receipt exceeds the ${GATE_RECEIPT_LIMITS.bytes}-byte budget`] };
  }

  const errors: string[] = [];
  for (const key of unknownKeys(value, KEYS.root)) errors.push(`: unknown key ${key}`);

  if (value.contract !== GATE_RECEIPT_CONTRACT_ID) errors.push(": contract is not the published id");
  if (value.version !== GATE_RECEIPT_VERSION) errors.push(": version is not the published version");
  if (value.schema !== GATE_RECEIPT_SCHEMA) errors.push(": schema is not the published token");

  // Verdict and degradations are one consistency rule: a degradation is never a
  // pass (S11), and a pass never hides a defect row.
  let verdict: GateReceiptVerdict | null = null;
  if (typeof value.verdict !== "string" || !GATE_RECEIPT_VERDICTS.includes(value.verdict as GateReceiptVerdict)) {
    errors.push(`: verdict is not one of ${GATE_RECEIPT_VERDICTS.join(" | ")}`);
  } else {
    verdict = value.verdict as GateReceiptVerdict;
  }
  let degraded: string[] = [];
  if (!Array.isArray(value.degraded)) {
    errors.push("/degraded: not an array");
  } else {
    for (const [index, reason] of value.degraded.entries()) {
      if (typeof reason !== "string" || reason.length === 0 || !DEGRADED_REASON.test(reason)) {
        errors.push(`/degraded/${index}: not a lowercase degradation token`);
      }
    }
    degraded = value.degraded.filter((reason): reason is string => typeof reason === "string");
  }
  if (verdict === "degraded" && degraded.length === 0) errors.push("/degraded: a degraded verdict names its degradation");
  if (verdict !== "degraded" && degraded.length > 0) errors.push("/degraded: a degradation is never a pass");

  // Provenance — records about the run, not validity tests.
  let provenance: GateReceiptProvenance | null = null;
  if (!isObject(value.provenance)) {
    errors.push("/provenance: not a JSON object");
  } else {
    for (const key of unknownKeys(value.provenance, KEYS.provenance)) errors.push(`/provenance: unknown key ${key}`);
    const head = value.provenance.head_sha;
    if (head !== null && (typeof head !== "string" || !HEAD_SHA.test(head))) errors.push("/provenance/head_sha: not a git sha or null");
    const generatedAt = value.provenance.generated_at;
    if (typeof generatedAt !== "string" || !ISO_UTC.test(generatedAt)) errors.push("/provenance/generated_at: not an ISO-8601 UTC instant");
    const command = value.provenance.gate_command;
    if (!Array.isArray(command) || command.length === 0) {
      errors.push("/provenance/gate_command: not a non-empty argv");
    } else {
      for (const [index, arg] of command.entries()) {
        if (typeof arg !== "string" || arg.length === 0 || arg.length > GATE_RECEIPT_LIMITS.commandArgChars) {
          errors.push(`/provenance/gate_command/${index}: not a non-empty argument of at most ${GATE_RECEIPT_LIMITS.commandArgChars} characters`);
        }
      }
    }
    if (errors.every((error) => !error.startsWith("/provenance/"))) {
      provenance = {
        head_sha: head as string | null,
        generated_at: generatedAt as string,
        gate_command: command as string[],
      };
    }
  }

  // Manifest — sorted, unique, safe paths; the digest must agree with the rows.
  let manifest: GateReceiptManifest | null = null;
  if (!isObject(value.manifest)) {
    errors.push("/manifest: not a JSON object");
  } else {
    for (const key of unknownKeys(value.manifest, KEYS.manifest)) errors.push(`/manifest: unknown key ${key}`);
    const rows = value.manifest.entries;
    const entries: GateManifestEntry[] = [];
    if (!Array.isArray(rows)) {
      errors.push("/manifest/entries: not an array");
    } else {
      if (rows.length > GATE_RECEIPT_LIMITS.manifestEntries) {
        errors.push(`/manifest/entries: more than ${GATE_RECEIPT_LIMITS.manifestEntries} entries`);
      }
      rows.forEach((row, index) => {
        const parsed = checkManifestEntry(row, index, errors);
        if (parsed) entries.push(parsed);
      });
      for (let index = 1; index < entries.length; index += 1) {
        const order = utf8ByteCompare(entries[index - 1].path, entries[index].path);
        if (order >= 0) {
          errors.push(`/manifest/entries/${index}/path: entries are not path-ordered and unique`);
          break;
        }
      }
    }
    if (typeof value.manifest.digest !== "string" || !HEX64.test(value.manifest.digest)) {
      errors.push("/manifest/digest: not a lowercase 64-hex digest");
    } else if (entries.length === (Array.isArray(rows) ? rows.length : -1) && digestGateManifest(entries) !== value.manifest.digest) {
      errors.push("/manifest/digest: manifest digest does not match its own entries");
    }
    if (errors.every((error) => !error.startsWith("/manifest/"))) {
      manifest = { digest: value.manifest.digest as string, entries };
    }
  }

  // The whole-run record.
  let gate: GateRunReceipt | null = null;
  if (!isObject(value.gate)) {
    errors.push("/gate: not a JSON object");
  } else {
    for (const key of unknownKeys(value.gate, KEYS.gate)) errors.push(`/gate: unknown key ${key}`);
    if (!isInteger(value.gate.exit_code)) errors.push("/gate/exit_code: not an integer");
    if (!isInteger(value.gate.duration_ms) || (value.gate.duration_ms as number) < 0) errors.push("/gate/duration_ms: not a non-negative integer");
    const logRef = value.gate.log_ref;
    if (typeof logRef !== "string" || logRef.length === 0 || logRef.length > GATE_RECEIPT_LIMITS.logRefChars) {
      errors.push("/gate/log_ref: not a non-empty reference of at most 1024 characters");
    }
    if (errors.every((error) => !error.startsWith("/gate/"))) {
      gate = {
        exit_code: value.gate.exit_code as number,
        duration_ms: value.gate.duration_ms as number,
        log_ref: logRef as string,
      };
    }
  }

  // Per-check rows.
  const checks: GateCheckReceipt[] = [];
  if (!Array.isArray(value.checks)) {
    errors.push("/checks: not an array");
  } else {
    if (value.checks.length > GATE_RECEIPT_LIMITS.checks) errors.push(`/checks: more than ${GATE_RECEIPT_LIMITS.checks} checks`);
    const seen = new Set<string>();
    value.checks.forEach((check, index) => {
      const parsed = checkCheck(check, index, errors);
      if (!parsed) return;
      if (seen.has(parsed.id)) errors.push(`/checks/${index}/id: duplicate check id`);
      seen.add(parsed.id);
      checks.push(parsed);
    });
  }

  // Verdict consistency against the check rows.
  const failed = checks.filter((check) => check.status === "failed");
  const passed = checks.filter((check) => check.status === "passed");
  if (verdict === "pass" && (checks.length === 0 || passed.length !== checks.length)) {
    errors.push("/verdict: a pass requires every check to have passed");
  }
  if (verdict === "fail" && failed.length === 0) {
    errors.push("/verdict: a fail names at least one failed check");
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    receipt: {
      contract: GATE_RECEIPT_CONTRACT_ID,
      version: GATE_RECEIPT_VERSION,
      schema: GATE_RECEIPT_SCHEMA,
      verdict: verdict as GateReceiptVerdict,
      degraded,
      provenance: provenance as GateReceiptProvenance,
      manifest: manifest as GateReceiptManifest,
      gate: gate as GateRunReceipt,
      checks,
    },
  };
}

/** The paths whose bytes differ between the receipt and the current tree. */
function changedManifestPaths(
  entries: readonly GateManifestEntry[],
  current: readonly GateManifestEntry[],
): string[] {
  const before = new Map(entries.map((entry) => [entry.path, entry.sha256]));
  const after = new Map(current.map((entry) => [entry.path, entry.sha256]));
  const changed: string[] = [];
  for (const path of [...new Set([...before.keys(), ...after.keys()])].sort(utf8ByteCompare)) {
    if (before.get(path) !== after.get(path)) changed.push(path);
  }
  return changed;
}

/**
 * Freshness: recompute the current bytes' digest and compare it with the signed
 * one. Never reads `provenance.head_sha` — an unrelated commit cannot invalidate
 * a receipt, and a signed byte cannot survive one. Pure, async, throws nothing.
 */
export async function compareGateReceiptToCurrent(
  receipt: unknown,
  currentEntries: readonly GateManifestEntry[],
): Promise<GateReceiptFreshnessResult> {
  const validated = validateGateReceipt(receipt);
  if (!validated.ok) return { fresh: false, reasonCode: "invalid", changedPaths: [] };
  const signed = validated.receipt.manifest.entries;
  if (digestGateManifest(currentEntries) === validated.receipt.manifest.digest) return { fresh: true };
  return {
    fresh: false,
    reasonCode: "stale-manifest",
    changedPaths: changedManifestPaths(signed, currentEntries),
  };
}
