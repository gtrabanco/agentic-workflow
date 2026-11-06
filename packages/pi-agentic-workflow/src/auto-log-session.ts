/**
 * auto-log-session.ts — the session facts and the marker (issue #394, S5/S9/S11).
 *
 * Pi-free on purpose: this module knows git and the filesystem, and nothing
 * about events, sessions or the host. The wiring
 * (`extension/auto-log-session-wiring.ts`) is the only place that knows Pi
 * exists, and the renderer (`@gtrabanco/agentic-workflow/src/log/render.mjs`)
 * is where the entry's bytes come from — one owner for the shape, imported, not
 * copied.
 *
 * Two decisions this file carries:
 *
 *  - **The marker is recorded, never searched for.** `createMarker` returns the
 *    record it wrote and the wiring keeps it in memory for the session's life;
 *    nothing here reads "the newest marker in the directory". That is what makes
 *    S9's "a marker left by a crashed session must never be adopted" an absence
 *    of code instead of a check somebody can delete.
 *  - **The journal's existence is the opt-in.** A project without
 *    `docs/LOGS.md` never opted in, so the wiring writes no marker there and
 *    leaves no trace (S9).
 *
 * The path list is wider than the template hook's on purpose: the hook diffs the
 * committed range only, while a pi session usually ends with uncommitted work, so
 * the range is unioned with `git status --porcelain` — the same session-scope rule
 * the telemetry accumulator already applies (`sessionChangedPaths`).
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import type { LogFacts } from "@gtrabanco/agentic-workflow/src/log/render.mjs";

/** The project journal, relative to the project root (the template's default). */
export const JOURNAL_PATH = "docs/LOGS.md";

/**
 * The session-log fragment carrier, relative to the project root (issue #405).
 * Its presence is the opt-in: writers then produce fragments and the
 * merge-to-main aggregator is the only writer of `docs/LOGS.md` (AC1).
 */
export const FRAGMENT_DIR = ".agentic-workflow/journal";

/**
 * Where the session marker lives: the package's own project directory, which is
 * `.pi/` for every other project-scoped file this package writes
 * (`config/load.ts`). `.claude/` belongs to the Claude Code hook — sharing it
 * would let either writer read the other's crashed marker.
 */
export const MARKER_DIR = ".pi";

/** One session's starting point: the fields the journal range is built from. */
export interface Marker {
  /** `git rev-parse --short HEAD` at session start. */
  readonly sha: string;
  /** Seconds since the epoch, the hook's `date -u +%s`. */
  readonly epoch: number;
  /** UTC minute stamp, the hook's `date -u +%Y-%m-%dT%H:%MZ`. */
  readonly iso: string;
}

/** A git reader: the trimmed stdout, or `null` when the command failed. */
export type GitReader = (args: string[]) => string | null;

/** The marker's file for one session id. */
export function markerPath(root: string, sessionId: string): string {
  return path.join(root, MARKER_DIR, `.session-${sessionId}.start`);
}

/**
 * Ambient git location variables, stripped from every child `git` this module
 * spawns. When the host process runs inside a tooling checkout (a git worktree
 * whose harness exports `GIT_DIR`/`GIT_WORK_TREE`), a bare `git -C <root>`
 * still resolves the repository from the environment — the `-C` only moves the
 * working directory — so facts (and, in the worst case, writes) would land in
 * the outer repository instead of the project. The project root is the only
 * authority: the `-C` argument decides, never the caller's environment.
 */
const GIT_LOCATION_VARS = [
  "GIT_DIR",
  "GIT_WORK_TREE",
  "GIT_INDEX_FILE",
  "GIT_OBJECT_DIRECTORY",
  "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_COMMON_DIR",
  "GIT_NAMESPACE",
  "GIT_CEILING_DIRECTORIES",
] as const;

/** The process environment with the ambient git location variables removed. */
export function sandboxGitEnv(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const clean = { ...env };
  for (const name of GIT_LOCATION_VARS) delete clean[name];
  return clean;
}

/**
 * `git` in the project, or `null` when the command failed.
 *
 * The output is returned **untrimmed**: `git status --porcelain` puts meaning in
 * its first column (` M path` is not `M path`), and trimming the whole buffer
 * shifts every path one character left.
 */
function gitIn(root: string): GitReader {
  return (args) => {
    try {
      return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", env: sandboxGitEnv() });
    } catch {
      return null;
    }
  };
}

/** Whether `root` is inside a git work tree. */
function isRepo(git: GitReader): boolean {
  return (git(["rev-parse", "--is-inside-work-tree"]) ?? "").trim() === "true";
}

/** `YYYY-MM-DDTHH:MMZ` — the hook's `date -u +%Y-%m-%dT%H:%MZ`, no seconds. */
export function isoMinute(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 16) + "Z";
}

/** The abbreviated HEAD, or `null` in a repository with no commit yet. */
export function shortSha(root: string, git: GitReader = gitIn(root)): string | null {
  const sha = (git(["rev-parse", "--short", "HEAD"]) ?? "").trim();
  return sha !== "" ? sha : null;
}

/** The branch a human would name, or `detached`. */
function currentBranch(git: GitReader): string {
  const branch = (git(["branch", "--show-current"]) ?? "").trim();
  return branch !== "" ? branch : "detached";
}

/**
 * A project opted in by carrying a journal — either the journal file itself or
 * the fragment carrier directory (issue #405); nothing is created on its behalf.
 */
export function hasJournal(root: string): boolean {
  if (fs.existsSync(path.join(root, JOURNAL_PATH))) return true;
  try {
    return fs.statSync(path.join(root, FRAGMENT_DIR)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Write the session's marker and return the record.
 *
 * `null` — and no file — when there is nothing to mark: not a git repository, or
 * a repository without a commit yet.
 */
export function createMarker(options: {
  root: string;
  sessionId: string;
  now?: () => number;
  git?: GitReader;
}): Marker | null {
  const git = options.git ?? gitIn(options.root);
  if (!isRepo(git)) return null;
  const sha = shortSha(options.root, git);
  if (sha === null) return null;
  const epochMs = (options.now ?? Date.now)();
  const marker: Marker = { sha, epoch: Math.floor(epochMs / 1000), iso: isoMinute(epochMs) };
  const file = markerPath(options.root, options.sessionId);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${marker.sha} ${marker.epoch} ${marker.iso}\n`);
  return marker;
}

/** The marker's three fields, or `null` when it is absent or malformed. */
export function readMarker(root: string, sessionId: string): Marker | null {
  let text: string;
  try {
    text = fs.readFileSync(markerPath(root, sessionId), "utf8");
  } catch {
    return null;
  }
  const [sha, epoch, iso] = text.trim().split(/\s+/u);
  if (!sha || !epoch || !iso || !/^\d+$/u.test(epoch)) return null;
  return { sha, epoch: Number(epoch), iso };
}

/** Remove one session's marker, never another session's. */
export function removeMarker(root: string, sessionId: string): void {
  try {
    fs.rmSync(markerPath(root, sessionId), { force: true });
  } catch {
    // A marker that cannot be removed is inert: nothing ever adopts it.
  }
}

/**
 * The paths this session touched: the commits since its marker, plus whatever is
 * still uncommitted or untracked. Project-relative, in git's own order, deduped.
 *
 * The marker directory is filtered out: `.pi/` is this package's own bookkeeping,
 * not the session's work, and an entry that lists its own marker would be the
 * journal writing about itself.
 */
export function collectFiles(options: { root: string; startSha?: string | null; git?: GitReader }): string[] {
  const git = options.git ?? gitIn(options.root);
  const seen = new Set<string>();
  const own = `${MARKER_DIR}/`;
  const add = (line: string): void => {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed === MARKER_DIR || trimmed.startsWith(own)) return;
    seen.add(trimmed);
  };

  if (options.startSha) {
    for (const line of (git(["diff", "--name-only", `${options.startSha}..HEAD`]) ?? "").split("\n")) add(line);
  }
  for (const line of (git(["status", "--porcelain=v1"]) ?? "").split("\n")) {
    if (line.trim() === "") continue;
    // `XY path`, and `R  old -> new` for a rename: the new path is the file that
    // exists after the session, which is what a reader would look for.
    const entry = line.slice(3);
    add(entry.includes(" -> ") ? entry.split(" -> ")[1] : entry);
  }
  return [...seen];
}

/** Commits in `start..HEAD`, or `0` when the range cannot be read. */
function countCommits(git: GitReader, startSha: string): number {
  const log = git(["log", "--oneline", `${startSha}..HEAD`]) ?? "";
  return log.split("\n").filter((line) => line.trim() !== "").length;
}

/**
 * The frozen `log-facts@1` payload for one session.
 *
 * `marker: null` renders the hook's `(no marker)` shape instead of inventing a
 * range, and `null` from the whole function means "not a git repository" — the
 * one case where no entry can honestly be written.
 */
export function buildFacts(options: {
  root: string;
  marker: Marker | null;
  reason: string;
  now?: () => number;
  git?: GitReader;
}): LogFacts | null {
  const git = options.git ?? gitIn(options.root);
  if (!isRepo(git)) return null;
  const epochMs = (options.now ?? Date.now)();
  const marker = options.marker !== null && git(["cat-file", "-e", `${options.marker.sha}^{commit}`]) !== null
    ? options.marker
    : null;
  const head = shortSha(options.root, git);
  return {
    timestamp: isoMinute(epochMs),
    branch: currentBranch(git),
    reason: options.reason,
    commits:
      marker === null || head === null
        ? { count: 0, range: null }
        : { count: countCommits(git, marker.sha), range: `${marker.sha}…${head}` },
    files: collectFiles({ root: options.root, startSha: marker?.sha ?? null, git }),
  };
}
