/**
 * index.mjs — the guarded forge read (issue #612, S2).
 *
 * This is the route the workflow's prose uses instead of a raw
 * `gh issue view --json body`: it performs the content-bearing read over REST,
 * hands every field that can carry third-party text to #470's guard, and prints
 * the guarded result. Three properties are the whole point:
 *
 *   * **the transport is here, never in a skill.** One `ghRestTransport` speaks
 *     REST for issues, PRs, comments and reviews; the envelope publishes which
 *     transport answered, and the skills cite `runner forge-read` (S2, S4).
 *   * **the fence is the only delivery.** A field's guarded text exists as
 *     `fenced`, never as a bare `text`, so a consumer of this envelope cannot
 *     accidentally read past the boundary the guard drew. Everything the guard
 *     refused or stripped is declared — an exclusion is a named line, a removal
 *     is a counted line (AC1).
 *   * **no fabricated answer.** An unreachable forge refuses with the class it
 *     failed by (`FORGE-READ REFUSALS`) and prints no envelope; the honest
 *     evidence class is the same one the doctor and the sensor use.
 *
 * The guard is consumed as published: no vocabulary, no config key and no
 * sanitizer lives here (AC5).
 */

import { spawnSync } from "node:child_process";

import {
  CONTENT_GUARD_POLICY,
  guardForgeContent,
  readContentGuardPolicy,
} from "../content-guard.mjs";

import { FORGE_READ_CONTRACT } from "./grammar.mjs";

/**
 * The variable the ad-hoc shim exports so this transport spawns the binary it
 * stands in front of. Owned here because every transport consumer reads it.
 */
export const REAL_GH_ENV = "AGENTIC_WORKFLOW_REAL_GH";

/** The refusal classes a read can end by — the same words the sensors degrade by. */
export const FORGE_READ_REFUSALS = Object.freeze([
  "unavailable-forge-missing-cli",
  "unavailable-forge-timeout",
  "unavailable-forge-auth",
  "unavailable-forge-no-network",
]);

const USAGE = "usage: agentic-workflow forge-read <issue|pr> <number> [--comments] [--reviews] [--json]";

/** The PR metadata the audit reads beside the content, in render order. */
const METADATA_KEYS = Object.freeze([
  "state",
  "labels",
  "headRefOid",
  "headRefName",
  "baseRefName",
  "draft",
  "merged",
  "mergeable",
]);

/* --------------------------------------------------------------- transport */

/** Classify one failed spawn or one non-zero exit into a published refusal class. */
function failureOf(result) {
  const error = result?.error;
  if (error?.code === "ENOENT") {
    return { ok: false, code: "unavailable-forge-missing-cli", detail: "the forge CLI was not found on PATH" };
  }
  if (error?.code === "ETIMEDOUT" || result?.signal === "SIGTERM") {
    return { ok: false, code: "unavailable-forge-timeout", detail: "the forge read exceeded its bound" };
  }
  const stderr = String(result?.stderr ?? "");
  if (/authenticat|401|credential|bad credentials/iu.test(stderr)) {
    return { ok: false, code: "unavailable-forge-auth", detail: firstLine(stderr) || "authentication failed" };
  }
  return {
    ok: false,
    code: "unavailable-forge-no-network",
    detail: firstLine(stderr) || (error === undefined ? "the forge read failed" : String(error.message ?? error)),
  };
}

function firstLine(text) {
  return String(text).trim().split("\n")[0] ?? "";
}

/**
 * The REST transport — one `gh api` child per read, `--paginate` plus
 * `--jq '.[] | @json'` for a list so pagination never stitches an array in the
 * client and a multi-page answer stays one object per line (PE-004).
 *
 * `spawn` is injectable so a suite drives the transport without a forge, and so
 * a different transport (GraphQL, an MCP tool) can replace this one without the
 * caller changing — the seam S2 asks the crate to own.
 */
export function createGhTransport({
  bin = String(process.env[REAL_GH_ENV] ?? "").trim() || "gh",
  cwd = process.cwd(),
  timeoutMs = 30_000,
  spawn = spawnSync,
} = {}) {
  const run = (args) => {
    const result = spawn(bin, args, { cwd, encoding: "utf8", timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024 });
    if (result?.error !== undefined && result?.error !== null) return failureOf(result);
    if (result?.status !== 0) return failureOf(result);
    return { ok: true, stdout: String(result.stdout ?? "") };
  };
  const parse = (text, label) => {
    try {
      return { ok: true, data: JSON.parse(text) };
    } catch {
      return { ok: false, code: "unavailable-forge-no-network", detail: `the forge answered ${label} that is not JSON` };
    }
  };
  return {
    kind: "gh-rest",
    readObject(path) {
      const result = run(["api", path]);
      return result.ok ? parse(result.stdout, "an object") : result;
    },
    readList(path) {
      const result = run(["api", "--paginate", path, "--jq", ".[] | @json"]);
      if (!result.ok) return result;
      const data = [];
      for (const line of result.stdout.split("\n")) {
        const trimmed = line.trim();
        if (trimmed === "") continue;
        const parsed = parse(trimmed, "a list row");
        if (!parsed.ok) return parsed;
        data.push(parsed.data);
      }
      return { ok: true, data };
    },
  };
}

/* ------------------------------------------------------------------- read */

/** The metadata a caller needs, in `METADATA_KEYS` order, absent keys dropped. */
function metadataOf(target, detail) {
  const labels = Array.isArray(detail?.labels)
    ? detail.labels.map((label) => (typeof label === "string" ? label : label?.name)).filter((name) => typeof name === "string")
    : [];
  const raw = {
    state: typeof detail?.state === "string" ? detail.state : undefined,
    labels,
    headRefOid: target === "pr" ? detail?.head?.sha : undefined,
    headRefName: target === "pr" ? detail?.head?.ref : undefined,
    baseRefName: target === "pr" ? detail?.base?.ref : undefined,
    draft: target === "pr" ? detail?.draft : undefined,
    merged: target === "pr" ? detail?.merged : undefined,
    mergeable: target === "pr" ? detail?.mergeable_state : undefined,
  };
  return Object.fromEntries(METADATA_KEYS.filter((key) => raw[key] !== undefined).map((key) => [key, raw[key]]));
}

/**
 * Read one issue or pull request, guarded.
 *
 * @returns {{ok: true, envelope: object} | {ok: false, refusal: {code: string, detail: string}}}
 */
export function readForge({
  target,
  number,
  comments = false,
  reviews = false,
  policy,
  transport,
  projectDir = process.cwd(),
  degradations = [],
} = {}) {
  const route = transport ?? createGhTransport({ cwd: projectDir });
  const resolved = policy === undefined ? readContentGuardPolicy({ projectDir }) : { policy, degradations: [] };
  const effective = resolved.policy ?? CONTENT_GUARD_POLICY;
  const declared = [...degradations, ...(resolved.degradations ?? [])];

  const detailPath = target === "pr"
    ? `repos/{owner}/{repo}/pulls/${number}`
    : `repos/{owner}/{repo}/issues/${number}`;
  const detail = route.readObject(detailPath);
  if (!detail.ok) return { ok: false, refusal: { code: detail.code, detail: detail.detail } };

  const payload = detail.data ?? {};
  const fields = [];
  const push = (decision) => {
    // The fence is the delivery: the guard's sanitized `text` is dropped here so
    // an envelope consumer has no unfenced door to read through.
    const { contract: _contract, text: _text, ...field } = decision;
    fields.push(field);
    declared.push(...field.degradations);
    return field;
  };

  push(guardForgeContent({
    source: `${target}-title`,
    id: String(number),
    author: payload?.user?.login ?? null,
    association: payload?.author_association ?? null,
    text: typeof payload.title === "string" ? payload.title : "",
    policy: effective,
  }));
  push(guardForgeContent({
    source: `${target}-body`,
    id: String(number),
    author: payload?.user?.login ?? null,
    association: payload?.author_association ?? null,
    text: typeof payload.body === "string" ? payload.body : "",
    policy: effective,
  }));

  if (comments) {
    const thread = route.readList(`repos/{owner}/{repo}/issues/${number}/comments?per_page=100`);
    if (!thread.ok) return { ok: false, refusal: { code: thread.code, detail: thread.detail } };
    for (const comment of thread.data) {
      push(guardForgeContent({
        source: `${target}-comment`,
        id: String(comment?.id ?? ""),
        author: comment?.user?.login ?? null,
        association: comment?.author_association ?? null,
        text: typeof comment.body === "string" ? comment.body : "",
        policy: effective,
      }));
    }
  }

  if (reviews) {
    const threads = [
      route.readList(`repos/{owner}/{repo}/pulls/${number}/reviews?per_page=100`),
      route.readList(`repos/{owner}/{repo}/pulls/${number}/comments?per_page=100`),
    ];
    for (const thread of threads) {
      if (!thread.ok) return { ok: false, refusal: { code: thread.code, detail: thread.detail } };
      for (const review of thread.data) {
        push(guardForgeContent({
          source: "review-comment",
          id: String(review?.id ?? ""),
          author: review?.user?.login ?? null,
          association: review?.author_association ?? null,
          text: typeof review.body === "string" ? review.body : "",
          policy: effective,
        }));
      }
    }
  }

  const delivered = fields.filter((field) => field.verdict === "allowed");
  const excluded = fields.filter((field) => field.verdict === "excluded");
  return {
    ok: true,
    envelope: {
      contract: FORGE_READ_CONTRACT,
      target,
      number,
      transport: route.kind ?? "unknown",
      url: typeof payload.html_url === "string" ? payload.html_url : null,
      metadata: metadataOf(target, payload),
      policy: {
        state: effective.state ?? "unknown",
        trustedRoles: [...(effective.trustedRoles ?? [])],
        allowLogins: [...(effective.allowLogins ?? [])],
        denyLogins: [...(effective.denyLogins ?? [])],
      },
      fields,
      summary: {
        total: fields.length,
        delivered: delivered.length,
        excluded: excluded.length,
        stripped: delivered.filter((field) => field.removals.length > 0).length,
      },
      degradations: declared,
    },
  };
}

/* ----------------------------------------------------------------- render */

/** `labels=a,b` — a list cell, `-` when empty, so the line never misaligns. */
function cell(value) {
  if (value === undefined || value === null) return "-";
  if (Array.isArray(value)) return value.length === 0 ? "-" : value.join(",");
  return String(value);
}

/**
 * The printed delivery: one line of facts, the policy in force, then one fenced
 * block per admitted field with its stripping declared beneath it, then one line
 * per exclusion. A reader never sees third-party text without its fence.
 */
export function renderForgeRead(envelope) {
  const lines = [];
  lines.push(
    `FORGE READ — ${envelope.target} ${envelope.number} · transport ${envelope.transport}`
    + ` · ${envelope.summary.total} field(s) · ${envelope.summary.excluded} excluded · ${envelope.summary.stripped} stripped`,
  );
  const metadata = envelope.metadata ?? {};
  const keys = Object.keys(metadata);
  if (keys.length > 0) lines.push(`metadata: ${keys.map((key) => `${key}=${cell(metadata[key])}`).join(" · ")}`);
  lines.push(`policy: ${envelope.policy.state} · trusted ${envelope.policy.trustedRoles.join(", ") || "none"}`);
  for (const field of envelope.fields) {
    if (field.verdict !== "allowed") continue;
    lines.push(field.fenced);
    if (field.removals.length > 0) {
      const removals = field.removals.map((removal) => `${removal.kind}×${removal.count}`).join(" · ");
      lines.push(`stripped: ${field.source} · ${removals}`);
    }
  }
  for (const field of envelope.fields) {
    if (field.verdict !== "excluded") continue;
    // An exclusion names why: the author, the role it held (or `unknown` when the
    // forge did not say), and the reason the guard refused it.
    const association = field.association === null || field.association === undefined ? "unknown" : field.association;
    lines.push(`excluded: ${field.source} ${field.id} · author ${field.author ?? "unknown"} · ${association} · ${field.reason}`);
  }
  return lines.join("\n");
}

/* -------------------------------------------------------------------- CLI */

/** A usage refusal: the named fault, then the grammar a caller copies. */
function refuse(io, message) {
  io.stderr(`FORGE-READ REFUSAL — ${message}\n${USAGE}\n`);
  return 2;
}

/**
 * `runner forge-read <issue|pr> <number> [--comments] [--reviews] [--json]`, plus
 * the `shim` operations the ad-hoc interceptor drives (`./shim.mjs`).
 *
 * @param {string[]} args
 * @param {{ io?: {stdout: (text: string) => void, stderr: (text: string) => void}, transport?: object, policy?: object, projectDir?: string }} [context]
 * @returns {Promise<number>}
 */
export async function run(args, context = {}) {
  const io = context.io ?? {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  };
  const argv = Array.isArray(args) ? [...args] : [];
  if (argv[0] === "shim") {
    // Loaded on demand: the guarded read is the hot path, the shim is not, and a
    // static edge would be a cycle (the shim reads this module's `readForge`).
    const { runShimCommand } = await import("./shim.mjs");
    return runShimCommand(argv.slice(1), { ...context, io });
  }

  const positional = [];
  let json = false;
  let comments = false;
  let reviews = false;
  for (const arg of argv) {
    if (arg === "--json") json = true;
    else if (arg === "--comments") comments = true;
    else if (arg === "--reviews") reviews = true;
    else if (arg === "--help" || arg === "-h") {
      io.stdout(`${USAGE}\n\nReads one issue or pull request through the content guard and prints the\nfenced delivery; --comments and --reviews add the threads, --json prints the\n${FORGE_READ_CONTRACT} envelope instead of the rendered form.\n`);
      return 0;
    } else if (arg.startsWith("-")) return refuse(io, `unknown argument "${arg}"`);
    else positional.push(arg);
  }
  if (positional.length !== 2) return refuse(io, `expected <issue|pr> and a number, got ${positional.length} positional argument(s)`);
  const [target, numberText] = positional;
  if (target !== "issue" && target !== "pr") return refuse(io, `unknown target "${target}"`);
  if (reviews && target !== "pr") return refuse(io, "--reviews is a pull-request read");
  const number = Number(numberText);
  if (!Number.isInteger(number) || number <= 0) return refuse(io, `"${numberText}" is not a forge number`);

  const outcome = readForge({
    target,
    number,
    comments,
    reviews,
    policy: context.policy,
    transport: context.transport,
    projectDir: context.projectDir,
  });
  if (!outcome.ok) {
    io.stderr(`FORGE-READ REFUSAL — ${outcome.refusal.code}\n  ${outcome.refusal.detail}\n  No content was delivered: a read that could not reach the forge is not an empty answer.\n`);
    return 2;
  }
  io.stdout(json ? `${JSON.stringify(outcome.envelope, null, 2)}\n` : `${renderForgeRead(outcome.envelope)}\n`);
  return 0;
}
