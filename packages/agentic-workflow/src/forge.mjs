/**
 * forge.mjs — the one place a capability names a forge (issue #546 S4/S5,
 * moved into the crate by unit 554).
 *
 * A guard that needs to know whether a branch has an open pull request has to
 * ask *some* forge, and every forge speaks its own CLI. Naming one of them
 * inline is how these guards became GitHub-only; naming all of them everywhere
 * is how they stay unreadable. So the names live here, once, and the callers ask
 * this module.
 *
 * | forge      | CLI      | why                                                          |
 * |------------|----------|--------------------------------------------------------------|
 * | github     | `gh`     | official CLI                                                 |
 * | gitlab     | `glab`   | official CLI                                                 |
 * | gitea      | `gt`     | official CLI since 1.0; the older `tea` is archived           |
 * | bitbucket  | none     | Atlassian ships no pull-request CLI — refused, never guessed   |
 * | default    | `gh`     | a filesystem remote has no forge to detect                    |
 *
 * `unknown` is the answer for a host that says nothing (`git.example.com`), and
 * the caller refuses rather than guessing: `AGENTIC_WORKFLOW_FORGE` or `--forge`
 * is the documented way to name a self-hosted instance.
 *
 * Every function is read-only apart from the CLI calls the caller asked for, and
 * every call returns a result object — `{ok: true, …}` or `{ok: false, message}`
 * — so a caller reports the refusal instead of parsing an error string. The
 * shell library this replaces needed `jq` for its three JSON shapes; the
 * documents are parsed here, so `jq` is no longer a precondition anywhere.
 */

import { spawnSync } from "node:child_process";
import { accessSync, constants, rmSync, statSync, writeFileSync } from "node:fs";

import { mktempFile } from "./temp.mjs";

/** The forges a caller may name explicitly. */
export const NAMED_FORGES = Object.freeze(["github", "gitlab", "gitea", "bitbucket"]);

/** The forge a filesystem remote gets: the project's default CLI answers. */
export const DEFAULT_FORGE = "default";

/** The forge a host that says nothing gets: refused, never guessed. */
export const UNKNOWN_FORGE = "unknown";

const CLI_BY_FORGE = Object.freeze({ github: "gh", [DEFAULT_FORGE]: "gh", gitlab: "glab", gitea: "gt" });

/**
 * `detectForge(url, override)` — `{ok: true, forge}` or a refusal naming the four
 * values an override may take. The override is the second argument, else
 * `AGENTIC_WORKFLOW_FORGE`.
 *
 * A `file://` URL is still a URL — a fixture, a mirror or a local proxy — so it is
 * classified by what it names, which is also what lets a project test the forge
 * path without contacting one.
 */
export function detectForge(url, override = "", env = process.env) {
  const named = override !== "" ? override : (env.AGENTIC_WORKFLOW_FORGE ?? "");
  if (named !== "") {
    if (NAMED_FORGES.includes(named)) return { ok: true, forge: named };
    return {
      ok: false,
      message: `agentic-workflow: forge "${named}" is not one of github, gitlab, gitea, bitbucket`,
    };
  }
  const remote = typeof url === "string" ? url : "";
  // A bare filesystem path names no forge; the project's default CLI answers.
  if (remote === "" || remote.startsWith("/") || remote.startsWith("./") || remote.startsWith("../")) {
    return { ok: true, forge: DEFAULT_FORGE };
  }
  if (remote.includes("github.com")) return { ok: true, forge: "github" };
  if (remote.includes("gitlab")) return { ok: true, forge: "gitlab" };
  if (remote.includes("gitea")) return { ok: true, forge: "gitea" };
  if (remote.includes("bitbucket")) return { ok: true, forge: "bitbucket" };
  if (remote.includes("://")) return { ok: true, forge: UNKNOWN_FORGE };
  return { ok: true, forge: DEFAULT_FORGE };
}

/** `forgeCli(forge)` — the binary, or a refusal naming why there is none. */
export function forgeCli(forge) {
  const cli = CLI_BY_FORGE[forge];
  if (cli !== undefined) return { ok: true, cli };
  if (forge === "bitbucket") {
    return {
      ok: false,
      message:
        "agentic-workflow: bitbucket has no official pull-request CLI, so this guard cannot ask it; use the REST API " +
        "(https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/pullrequests/<n>/merge) or name a wrapper with --forge",
    };
  }
  return {
    ok: false,
    message: `agentic-workflow: forge "${forge ?? ""}" has no CLI mapping; name it with --forge or AGENTIC_WORKFLOW_FORGE`,
  };
}

function onPath(binary, env) {
  const pathValue = env?.PATH ?? process.env.PATH ?? "";
  for (const directory of pathValue.split(":")) {
    if (directory === "") continue;
    const candidate = `${directory}/${binary}`;
    try {
      if (!statSync(candidate).isFile()) continue;
      accessSync(candidate, constants.X_OK);
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

/** `requireForgeCli(forge)` — the binary, once it is installed. */
export function requireForgeCli(forge, { env = process.env, probe = onPath } = {}) {
  const mapped = forgeCli(forge);
  if (!mapped.ok) return mapped;
  if (!probe(mapped.cli, env)) {
    return {
      ok: false,
      message: `agentic-workflow: ${mapped.cli} is not installed, so the ${forge} forge cannot be asked`,
    };
  }
  return mapped;
}

/** `projectPath(url)` — `owner/repo`, or the leaf of a filesystem remote. */
export function projectPath(url) {
  let value = typeof url === "string" ? url : "";
  if (value.startsWith("/")) {
    value = value.slice(value.lastIndexOf("/") + 1);
    return value.replace(/\.git$/u, "");
  }
  if (value.includes("://")) {
    value = value.slice(value.indexOf("://") + 3);
    value = value.slice(value.indexOf("/") + 1);
  } else if (/@[^/]*:/u.test(value)) {
    value = value.slice(value.indexOf("@") + 1);
    value = value.slice(value.indexOf(":") + 1);
  }
  return value
    .replace(/^\//u, "")
    .replace(/\.git$/u, "")
    .replace(/\/$/u, "");
}

/**
 * Run one forge CLI. `spawn` is injectable so a suite can prove the argv without
 * a forge; the default spawns for real with the caller's environment.
 */
function run(binary, args, { env = process.env, spawn = spawnSync, cwd } = {}) {
  const result = spawn(binary, args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result?.error !== undefined && result.error !== null) {
    return { ok: false, status: null, stdout: "", stderr: String(result.error.message ?? result.error) };
  }
  if (typeof result?.status !== "number" || result.status === null) {
    return { ok: false, status: null, stdout: "", stderr: String(result?.stderr ?? "") };
  }
  return { ok: result.status === 0, status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * `prLine(forge, branch)` — `<STATE> <HEAD>` for the branch's open pull request,
 * `{ok: true, line: null}` when there is none, and `{ok: false, unverifiable:
 * true}` when the forge could not be asked (no CLI, an auth failure, a network
 * refusal). The caller must treat `unverifiable` as "unknown", never as "no pull
 * request".
 */
export function prLine(forge, branch, options = {}) {
  const required = requireForgeCli(forge, options);
  if (!required.ok) return { ok: false, unverifiable: true, message: required.message };
  const { env = process.env, spawn, cwd } = options;
  const cli = required.cli;
  const argv =
    forge === "gitlab"
      ? ["mr", "list", "--source-branch", branch, "-F", "json"]
      : forge === "gitea"
        ? ["pr", "list", "--head", branch, "--json", "state,head_sha"]
        : ["pr", "list", "--head", branch, "--state", "open", "--json", "state,headRefOid"];
  const result = run(cli, argv, { env, spawn, cwd });
  if (!result.ok) {
    return { ok: false, unverifiable: true, message: `agentic-workflow: the ${forge} forge could not be asked about ${branch}` };
  }
  const parsed = parseJson(result.stdout);
  const entries = Array.isArray(parsed) ? parsed : [];
  const entry = entries[0];
  if (entry === undefined) return { ok: true, line: null };
  const state = entry.state ?? "";
  const head = entry.headRefOid ?? entry.head_sha ?? entry.sha ?? "";
  if (state === "") return { ok: true, line: null };
  return { ok: true, line: `${state} ${head}` };
}

/** The GitHub-shaped document every caller reads, whatever forge answered. */
function normalizeGitHub(document) {
  return {
    number: document.number,
    url: document.url,
    state: document.state,
    baseRefName: document.baseRefName,
    headRefOid: document.headRefOid,
    mergeable: document.mergeable,
    statusCheckRollup: Array.isArray(document.statusCheckRollup) ? document.statusCheckRollup : [],
    comments: Array.isArray(document.comments) ? document.comments : [],
    mergeCommit: document.mergeCommit ?? null,
  };
}

function normalizeGitLab(document) {
  const state = String(document.state ?? "").toLowerCase();
  const pipeline = String(document.head_pipeline?.status ?? "").toLowerCase();
  return {
    number: document.iid,
    url: document.web_url,
    state: ["opened", "locked", "reopened"].includes(state) ? "OPEN" : state.toUpperCase(),
    baseRefName: document.target_branch,
    headRefOid: document.sha,
    mergeable: document.merge_status === "can_be_merged" ? "MERGEABLE" : "CONFLICTING",
    statusCheckRollup:
      pipeline === "success"
        ? [{ conclusion: "SUCCESS" }]
        : [{ conclusion: String(document.head_pipeline?.status ?? "pending").toUpperCase() }],
    comments: [],
    mergeCommit: { oid: document.merge_commit_sha ?? "" },
  };
}

function normalizeGitea(document) {
  return {
    number: document.number,
    url: document.url,
    state: document.merged === true ? "MERGED" : String(document.state ?? "").toUpperCase(),
    baseRefName: document.base,
    headRefOid: document.head_sha,
    mergeable: document.mergeable === true ? "MERGEABLE" : "CONFLICTING",
    statusCheckRollup: [],
    comments: Array.isArray(document.comments) ? document.comments : [],
    mergeCommit: null,
  };
}

/** `prJson(forge, pr)` — `{ok: true, document}` in the GitHub shape, or a refusal. */
export function prJson(forge, pr, options = {}) {
  const required = requireForgeCli(forge, options);
  if (!required.ok) return required;
  const { env = process.env, spawn, cwd } = options;
  const argv =
    forge === "gitlab"
      ? ["mr", "view", pr, "-F", "json"]
      : forge === "gitea"
        ? ["pr", "view", pr, "--json", "number,url,state,base,head_sha,mergeable,comments,draft,merged"]
        : [
            "pr",
            "view",
            pr,
            "--json",
            "number,url,state,baseRefName,headRefOid,mergeable,statusCheckRollup,comments,headRepository,headRefName,mergeCommit",
          ];
  const result = run(required.cli, argv, { env, spawn, cwd });
  const parsed = result.ok ? parseJson(result.stdout) : null;
  if (parsed === null || typeof parsed !== "object") {
    return { ok: false, message: `agentic-workflow: the ${forge} forge could not answer for PR ${pr}` };
  }
  const document = forge === "gitlab" ? normalizeGitLab(parsed) : forge === "gitea" ? normalizeGitea(parsed) : normalizeGitHub(parsed);
  return { ok: true, document };
}

/**
 * `prNotes(forge, pr, url)` — the comment bodies as `[{body}]`. GitHub and Gitea
 * carry them in the pull-request document; GitLab needs its own call, which is
 * why this is a separate function instead of a field.
 */
export function prNotes(forge, pr, url, options = {}) {
  if (forge !== "gitlab") return { ok: true, notes: [] };
  const required = requireForgeCli("gitlab", options);
  if (!required.ok) return required;
  const { env = process.env, spawn, cwd } = options;
  const project = projectPath(url).replaceAll("/", "%2F");
  const result = run(required.cli, ["api", `projects/${project}/merge_requests/${pr}/notes?per_page=100`], { env, spawn, cwd });
  const parsed = result.ok ? parseJson(result.stdout) : null;
  if (!Array.isArray(parsed)) {
    return { ok: false, message: `agentic-workflow: the gitlab forge could not answer for the comments of PR ${pr}` };
  }
  return { ok: true, notes: parsed.map((note) => ({ body: note?.body ?? "" })) };
}

/**
 * `comment(forge, pr, body)` — post the audit comment. The comment is the durable
 * automerge trail, so a forge that cannot carry one is a refusal. The body
 * travels through a temporary file for `gh` (its `--body-file`) so it never has
 * to survive an argv round trip.
 */
export function comment(forge, pr, body, options = {}) {
  const required = requireForgeCli(forge, options);
  if (!required.ok) return required;
  const { env = process.env, spawn, cwd } = options;
  if (forge === "gitlab" || forge === "gitea") {
    const verb = forge === "gitlab" ? ["mr", "note", pr, "-m", body] : ["pr", "comment", pr, "-m", body];
    const result = run(required.cli, verb, { env, spawn, cwd });
    return result.ok ? { ok: true } : { ok: false, message: `agentic-workflow: the ${forge} forge refused the comment` };
  }
  const scratch = mktempFile("agentic-workflow-comment", { env });
  if (!scratch.ok) return scratch;
  try {
    writeFileSync(scratch.file, body);
    const result = run(required.cli, ["pr", "comment", pr, "--body-file", scratch.file], { env, spawn, cwd });
    return result.ok ? { ok: true } : { ok: false, message: `agentic-workflow: the ${forge} forge refused the comment` };
  } finally {
    rmSync(scratch.file, { force: true });
  }
}

/** `defaultBase(forge)` — the branch a merge must target. */
export function defaultBase(forge, options = {}) {
  const required = requireForgeCli(forge, options);
  if (!required.ok) return required;
  const { env = process.env, spawn, cwd } = options;
  const argv = forge === "gitlab" ? ["repo", "view", "-F", "json"] : forge === "gitea" ? ["repo", "view", "--json", "default_branch"] : ["repo", "view", "--json", "defaultBranchRef"];
  const result = run(required.cli, argv, { env, spawn, cwd });
  const parsed = result.ok ? parseJson(result.stdout) : null;
  const name = forge === "gitlab" ? parsed?.default_branch : forge === "gitea" ? parsed?.default_branch : parsed?.defaultBranchRef?.name;
  if (typeof name !== "string" || name === "") {
    return { ok: false, message: `agentic-workflow: the ${forge} forge could not name its default branch` };
  }
  return { ok: true, branch: name };
}

/**
 * `mergePr(forge, pr, method, head)` — merge, pinned to the audited SHA wherever
 * the CLI can express the pin (`gh --match-head-commit`, `glab --sha`). `gt` has
 * no such flag: the caller re-reads the head after the merge, and the pre-merge
 * compare is what stands between them.
 */
export function mergePr(forge, pr, method, head, options = {}) {
  const required = requireForgeCli(forge, options);
  if (!required.ok) return required;
  const { env = process.env, spawn, cwd } = options;
  const argv =
    forge === "gitlab"
      ? ["mr", "merge", pr, "--sha", head, ...(method === "squash" ? ["--squash"] : method === "rebase" ? ["--rebase"] : []), "-y"]
      : forge === "gitea"
        ? ["pr", "merge", pr, "--method", method, "-y"]
        : ["pr", "merge", pr, `--${method}`, "--match-head-commit", head];
  const result = run(required.cli, argv, { env, spawn, cwd });
  return result.ok ? { ok: true } : { ok: false, message: `agentic-workflow: the ${forge} forge refused the merge` };
}
