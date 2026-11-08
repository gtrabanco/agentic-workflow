/**
 * block.mjs — the ONE owner of a narrative journal entry's bytes and of the
 * git facts that block carries (issue #452, S1/S7).
 *
 * A `docs/LOGS.md` entry and a fragment carry the same block shape: one
 * `## <stamp> — <branch> — <label>` heading, the commit count and range, the
 * paths the session touched, and — for a hand-written entry — the Summary,
 * Decisions and Next cells. Three callers produce it and they must not drift:
 * `scripts/session-close.mjs` (the session writer), the crate's
 * `journal write` (the fragment writer) and, through the extension, the
 * `/log-session` directive. They agree because they all come through
 * `renderEntryBlock`; the facts come from `readSessionFacts` for the same
 * reason.
 *
 * The block is deliberately the hook's punctuation, not a nicer one: a second
 * renderer is how the journal and the carrier grew different bytes in the first
 * place.
 */

import { spawnSync } from "node:child_process";

/** `YYYY-MM-DDTHH:MM:SSZ` — the entry heading's second precision, UTC. */
export function isoSecond(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) throw new Error(`timestamp is not a date, got ${JSON.stringify(timestamp)}`);
  return date.toISOString().replace(/\.\d{3}Z$/u, "Z");
}

/**
 * One entry block. `prose` is the difference between the two writers the same
 * shape serves: the mechanical/auto entry carries only the facts lines, while a
 * narrative entry carries Summary (always, so the cell is never silently
 * dropped) and Decisions/Next only when they hold something real — an empty
 * `**Decisions:**` line reads as a decision that was never made.
 */
export function renderEntryBlock({
  timestamp,
  branch,
  label = "manual",
  commits,
  files,
  summary,
  decisions,
  next,
  prose = true,
}) {
  const lines = [`## ${timestamp} — ${branch} — ${label}`];
  lines.push(`- **Commits:** ${commits?.count ?? 0}${commits?.range ? ` (\`${commits.range}\`)` : ""}`);
  lines.push(`- **Files:** ${files ?? "—"}`);
  if (prose) {
    lines.push(`- **Summary:** ${String(summary ?? "").trim()}`);
    if (String(decisions ?? "").trim()) lines.push(`- **Decisions:** ${String(decisions).trim()}`);
    if (String(next ?? "").trim()) lines.push(`- **Next:** ${String(next).trim()}`);
  }
  return `${lines.join("\n")}\n`;
}

/** `git` in one project root; the journal is a durable file, so the buffer is generous. */
function git(root, args) {
  // maxBuffer: `docs/LOGS.md` is a journal that only grows — `git show` of a
  // large committed log already outgrew spawnSync's 1 MB default once
  // (session-close, issue #182). 64 MB keeps every reader clear of that edge.
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.error) throw new Error(`git not runnable: ${result.error.message}`);
  return result;
}

function mustGit(root, args) {
  const result = git(root, args);
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${(result.stderr || "").trim()}`);
  return result.stdout;
}

/** The branch a human would name, or `detached` — the fallback every writer shares. */
export function currentBranch(root) {
  try {
    return mustGit(root, ["branch", "--show-current"]).trim() || "detached";
  } catch {
    return "detached";
  }
}

/**
 * The repository's base branch, resolved the same way every writer does. An
 * explicit base that does not resolve is a usage error, never a silent fallback
 * to `origin/main` (issue #182 F7).
 */
export function resolveBase(root, explicit) {
  if (explicit !== undefined && explicit !== null && String(explicit).trim() !== "") {
    if (git(root, ["rev-parse", "--verify", "--quiet", explicit]).status !== 0) {
      throw new Error(`--base ${explicit} does not resolve to a known revision`);
    }
    return explicit;
  }
  for (const candidate of ["origin/main", "main"]) {
    if (git(root, ["rev-parse", "--verify", "--quiet", candidate]).status === 0) return candidate;
  }
  return null;
}

/** The session's git facts: the commits the base..HEAD range carries and the paths it touched. */
export function readSessionFacts(root, base) {
  if (!base) return { commits: { count: 0, range: null }, files: "—", touched: [] };
  const shas = mustGit(root, ["rev-list", "--reverse", `${base}..HEAD`]).split("\n").filter(Boolean);
  const touched = mustGit(root, ["diff", "--name-only", `${base}...HEAD`]).split("\n").filter(Boolean);
  const short = (sha) => sha.slice(0, 8);
  return {
    commits: {
      count: shas.length,
      range: shas.length > 0 ? `${short(shas[0])}…${short(shas[shas.length - 1])}` : null,
    },
    files: touched.length === 0 ? "—" : touched.length <= 5 ? touched.join(", ") : `${touched.length} files`,
    touched,
  };
}
