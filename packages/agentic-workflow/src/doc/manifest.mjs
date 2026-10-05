/**
 * Canonical manifest for the `doc` retrieval index (unit 65, D4/D5).
 *
 * The manifest is the freshness surface: per-file sha256 over the tracked
 * markdown corpus plus the git HEAD. It is a canonical JSON document —
 * sorted keys at every level, no timestamps — so AC12's byte-for-byte
 * determinism assertion compares two `collectManifest` runs' exports
 * directly. `manifestHash` is the store's freshness fingerprint.
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Recursively JSON-stringify with object keys sorted — the canonical form. */
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function manifestHash(manifest) {
  return createHash("sha256").update(canonicalJson(manifest)).digest("hex");
}

/**
 * Build the manifest document. `files` rows arrive in any order; the output
 * is key-sorted. Rows carry exactly `{sha256, bytes}` — no mtimes, no
 * timestamps anywhere (AC2/AC12).
 */
export function buildManifest({ head, files }) {
  const sorted = [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const entries = Object.fromEntries(
    sorted.map((f) => [f.path, { sha256: f.sha256, bytes: f.bytes }]),
  );
  return { files: entries, head, version: 1 };
}

/** Tracked markdown corpus: `git ls-files '*.md'` under `root`. */
export function corpusFiles(root) {
  const out = execFileSync("git", ["ls-files", "--", "*.md"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split("\n").map((s) => s.trim()).filter((s) => s !== "");
}

/**
 * Collect the manifest over the live repo at `root`: git HEAD plus one
 * sha256 per tracked markdown file. Deterministic for an unchanged corpus
 * (AC12): same files, same bytes, same HEAD ⇒ byte-identical canonical form.
 */
export function collectManifest(root) {
  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  }).trim();
  const files = corpusFiles(root).map((rel) => {
    const abs = join(root, rel);
    let bytes;
    try {
      bytes = readFileSync(abs);
    } catch (e) {
      if (e.code === "ENOENT") {
        // File deleted in working tree but not yet committed — skip it
        // (AC11: treat as deletion, sync.mjs will reap it)
        return null;
      }
      throw e;
    }
    return {
      path: rel,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
    };
  }).filter((f) => f !== null); // drop missing files
  return buildManifest({ head, files });
}
