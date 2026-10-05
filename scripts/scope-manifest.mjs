#!/usr/bin/env node
/**
 * scope-manifest.mjs — the deterministic affecting-surface tool (fix/286).
 *
 * One executable recipe for the scope binding #182's amendment specified and
 * issue #286 tracks: the review receipt freezes the affecting-path manifest
 * beside the reviewed head sha, so a head delta whose changed paths are all
 * non-affecting (foreign session-log / agent toolstate commits on a shared
 * checkout) keeps the receipt current, and any affecting-path delta voids it.
 *
 * Two commands, the `pre-execution-snapshot.mjs` pattern:
 *
 *   sign   --base <ref> [--head <sha>] [--root <repo>]
 *            Emit the manifest: contract, base/head revisions, the sorted
 *            affected paths (branch delta vs base, minus the non-affecting
 *            classes) with the SHA-256 of each path's git blob at the head,
 *            and one scope digest over the deterministic manifest object.
 *   verify --base <ref> --head <sha> --scope <64-hex> [--since <sha>] [--root <repo>]
 *            Re-derive the manifest at the head and compare scope digests.
 *            Exit 0 fresh · 4 stale (naming appeared/disappeared/changed
 *            paths when `--since` names the reviewed revision) · 1 error.
 *
 * Design rules it shares with its sibling receipt runtimes:
 *
 * - Digests come from `@gtrabanco/agentic-workflow-schema` (`sha256HexSync`) —
 *   never a second hash implementation (#182 amendment: one CLI family, the
 *   schema package's digest functions).
 * - The classification is a closed vocabulary owned here and imported by every
 *   consumer (`review-receipt.mjs`), never re-stated: the session log
 *   (`docs/LOGS.md`) and the agent toolstate/memory dirs (`.engram/`, `.pi/`,
 *   `.serena/`). Fail closed: a path matching no named class is affecting.
 * - Diagnostics to stderr, machine report to stdout as JSON, fail closed on
 *   anything ambiguous (a malformed scope, an unresolvable revision).
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(repoRoot, "packages", "agentic-workflow-schema", "dist", "index.js");
const schema = fs.existsSync(schemaPath)
  ? require(schemaPath)
  : require("@gtrabanco/agentic-workflow-schema");
const { sha256HexSync } = schema;

/** The one contract version this tool emits and its consumers read. */
export const SCOPE_MANIFEST_CONTRACT = "scope-manifest-v1";

/**
 * The closed non-affecting vocabulary (#182 Expected behaviour 1, via #286):
 * the session log and the agent toolstate/memory directories. Security-relevant:
 * extending this list is a reviewed, tested change in this file — never inline
 * in a consumer.
 */
export const NON_AFFECTING_PATHS = Object.freeze(["docs/LOGS.md"]);
export const NON_AFFECTING_DIRS = Object.freeze([".engram/", ".pi/", ".serena/"]);

/** Fail closed: only a named class is non-affecting; everything else binds. */
export function isNonAffecting(relPath) {
  const rel = String(relPath ?? "").replace(/^\.\//, "");
  return NON_AFFECTING_PATHS.includes(rel)
    || NON_AFFECTING_DIRS.some((dir) => rel.startsWith(dir));
}

/** The manifest the scope digest is computed over — key order is the contract.
 * The `head` is deliberately NOT part of the digested object: binding the head
 * into the scope digest would re-create the head-bound defect (any commit — a
 * foreign one included — would rotate the digest). The head is recorded beside
 * the digest for attribution; freshness is judged on the affecting surface. */
function manifestObject({ base, head, paths }) {
  return {
    contract: SCOPE_MANIFEST_CONTRACT,
    base,
    paths: paths.map((row) => ({ path: row.path, digest: row.digest })),
  };
}

/** One scope digest over the deterministic manifest serialization. */
export function scopeDigestOf(manifest) {
  return sha256HexSync(JSON.stringify(manifestObject(manifest)));
}

const SHA1_RE = /^[0-9a-f]{40}$/;
const SHA256_RE = /^[a-f0-9]{64}$/;

const gitAt = (root) => (...args) => {
  const result = spawnSync("git", args, { cwd: root, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0 || result.error) return null;
  return result.stdout;
};
const gitLine = (gitRun, ...args) => {
  const out = gitRun(...args);
  return out === null ? null : out.toString("utf8").trim();
};

/**
 * The branch delta's changed paths between two revisions (`git diff --name-only
 * from..to`), sorted. `null` when git cannot answer (unresolvable revision) —
 * callers fail closed on `null`, never invent "nothing changed".
 */
export function changedPathsBetween(gitRun, fromSha, toSha) {
  const out = gitLine(gitRun, "diff", "--name-only", `${fromSha}..${toSha}`);
  if (out === null) return null;
  return out === "" ? [] : out.split("\n").filter(Boolean).sort();
}

/**
 * The affecting surface at `head`: the branch delta vs `base`, minus the
 * non-affecting classes, each path's SHA-256 over its git blob at `head`
 * (blob, not worktree — the manifest must be re-derivable at any revision, and
 * a shared checkout's worktree is exactly the thing foreign commits move).
 * `null` when git cannot answer.
 */
export function affectingPathsAt(gitRun, base, head) {
  const changed = changedPathsBetween(gitRun, base, head);
  if (changed === null) return null;
  const rows = [];
  for (const rel of changed) {
    if (isNonAffecting(rel)) continue;
    const blob = gitRun("show", `${head}:${rel}`);
    if (blob === null) return null; // unresolvable path (deleted/history rewritten) — fail closed
    rows.push({ path: rel, digest: sha256HexSync(blob) });
  }
  return rows.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

function parseArgs(argv) {
  const opts = {};
  const valueFlags = new Set(["--base", "--head", "--scope", "--since", "--root"]);
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (valueFlags.has(token)) {
      opts[token.slice(2)] = argv[i + 1];
      i += 1;
      continue;
    }
    process.stderr.write(`scope-manifest: unknown flag ${token}\n`);
    process.exitCode = 1;
    return null;
  }
  return opts;
}

function main(argv) {
  const command = argv[0];
  const USAGE = `usage: scope-manifest <command> [options]

  sign   --base <ref> [--head <sha>] [--root <repo>]    emit the manifest JSON
  verify --base <ref> --head <sha> --scope <64-hex> [--since <sha>] [--root <repo>]
`;
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(USAGE);
    return;
  }
  const opts = parseArgs(argv.slice(1));
  if (opts === null) return;
  const root = opts.root ? path.resolve(opts.root) : repoRoot;
  const gitRun = gitAt(root);

  if (command === "sign") {
    const head = opts.head ?? gitLine(gitRun, "rev-parse", "HEAD");
    const exists = head && SHA1_RE.test(String(head)) && gitRun("cat-file", "-e", `${head}^{commit}`) !== null;
    if (!exists) {
      process.stderr.write("scope-manifest: --head must be a resolvable commit SHA\n");
      process.exitCode = 1;
      return;
    }
    const paths = affectingPathsAt(gitRun, opts.base, head);
    if (paths === null) {
      process.stderr.write("scope-manifest: git could not resolve the delta (check --base/--head)\n");
      process.exitCode = 1;
      return;
    }
    const manifest = { base: opts.base, head, paths };
    // `head` is emitted for attribution beside the scope digest, but is NOT part
    // of the digested object (see manifestObject) — the surface binds, not the head.
    process.stdout.write(`${JSON.stringify({ ...manifestObject(manifest), head, scope: scopeDigestOf(manifest) }, null, 2)}\n`);
    return;
  }

  if (command === "verify") {
    for (const [flag, re, what] of [
      ["--head", SHA1_RE, "a resolvable commit SHA"],
      ["--scope", SHA256_RE, "a 64-hex scope digest"],
    ]) {
      if (!re.test(String(opts[flag.slice(2)] ?? ""))) {
        process.stderr.write(`scope-manifest: ${flag} must be ${what}\n`);
        process.exitCode = 1;
        return;
      }
    }
    const paths = affectingPathsAt(gitRun, opts.base, opts.head);
    if (paths === null) {
      process.stderr.write("scope-manifest: git could not resolve the delta (check --base/--head)\n");
      process.exitCode = 1;
      return;
    }
    const observed = scopeDigestOf({ base: opts.base, head: opts.head, paths });  // head not digested (see manifestObject)
    if (observed === opts.scope) {
      process.stdout.write(`${JSON.stringify({ fresh: true, head: opts.head, scope: observed, reason: "the affecting surface is byte-identical to the signed manifest" }, null, 2)}\n`);
      return;
    }
    // Name the drift when the reviewed revision is known: derive both manifests
    // and diff their bound paths.
    const drift = { appeared: [], disappeared: [], changed: [] };
    if (opts.since) {
      const sincePaths = affectingPathsAt(gitRun, opts.base, opts.since);
      if (sincePaths !== null) {
        const before = new Map(sincePaths.map((row) => [row.path, row.digest]));
        const after = new Map(paths.map((row) => [row.path, row.digest]));
        for (const [p, d] of after) if (!before.has(p)) drift.appeared.push(p);
        else if (before.get(p) !== d) drift.changed.push(p);
        for (const p of before.keys()) if (!after.has(p)) drift.disappeared.push(p);
      }
    }
    process.stdout.write(`${JSON.stringify({ fresh: false, head: opts.head, scope: observed, recorded: opts.scope, reason: "the affecting surface moved since the manifest was signed", drift }, null, 2)}\n`);
    process.exitCode = 4;
    return;
  }

  process.stderr.write(`scope-manifest: unknown command "${command}"\n\n${USAGE}`);
  process.exitCode = 1;
}

// Importable without side effects, like its sibling receipt runtimes.
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main(process.argv.slice(2));
}
