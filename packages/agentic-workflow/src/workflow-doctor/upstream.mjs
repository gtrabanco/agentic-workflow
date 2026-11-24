/**
 * upstream.mjs — the route and the consent-gated publication (issue #703 S8/S13).
 *
 * The `S13` decision is the shape: the upstream searcher is not a new surface —
 * it drives the already-shipped guarded forge transport. Candidate numbers come
 * from `search/issues` (numbers only: a title is a third-party field and is
 * re-read through the guard before any token is matched), and every candidate's
 * content is read through `readForge`, whose fence is the only delivery.
 *
 * `route` writes nothing: it proposes, per report class, either the candidate
 * issue that already covers the defect family or a new one, with the tokens that
 * matched. `publish` is the one write path in the whole command, and it refuses
 * without explicit consent before it reads a byte of the bundle or runs a forge
 * command — that refusal is a contract, not a politeness (`O15`).
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";

import { requireForgeCli } from "../forge.mjs";
import { createGhTransport, readForge } from "../forge-read/index.mjs";

import { sanitizeClass } from "./redact.mjs";
import {
  BUNDLE_CONTRACT,
  DoctorRefusal,
  MAX_CANDIDATES,
  MIN_MATCH,
  PUBLISH_CONTRACT,
  ROUTE_CONTRACT,
} from "./vocabulary.mjs";

/** The forges `publish` can reach. The upstream tracker is GitHub today (`D8`). */
export const SUPPORTED_FORGES = Object.freeze(["default", "github"]);

/** The defect words a class's sentence contributes to the match, as a floor. */
const WORD_FLOOR = 6;
/** How many defect words may join the class name in one class's token set. */
const MAX_WORDS = 10;

/** The consent line every route receipt carries, verbatim. */
const CONSENT = "filing requires explicit user consent — show the bundle, then run `runner workflow-doctor publish --issue <n> --bundle <file> --yes`";

/** The tokens a report class matches a candidate's guarded text against. */
function tokensOf(entry) {
  const words = String(entry.defect ?? "")
    .toLowerCase()
    .split(/[^a-z0-9-]+/u)
    .filter((word) => word.length >= WORD_FLOOR);
  const unique = [...new Set([sanitizeClass(entry.class), ...words])].filter((token) => token !== "");
  return unique.slice(0, MAX_WORDS + 1);
}

/** The candidate numbers: the explicit list plus every search answer's numbers. */
function candidatesOf({ candidate, search, transport }) {
  const numbers = new Set();
  for (const value of candidate) {
    const number = Number.parseInt(String(value), 10);
    if (Number.isInteger(number) && number > 0) numbers.add(number);
  }
  for (const query of search) {
    const result = transport.readList(`search/issues?q=${encodeURIComponent(String(query))}&per_page=20`);
    if (!result.ok) throw new DoctorRefusal(result.code, result.detail);
    for (const row of result.data ?? []) {
      const number = Number.parseInt(String(row?.number ?? ""), 10);
      if (Number.isInteger(number) && number > 0) numbers.add(number);
    }
  }
  return [...numbers].sort((left, right) => left - right).slice(0, MAX_CANDIDATES);
}

/** The guarded text of one candidate, lower-cased for matching. */
function guardedText({ number, transport, projectDir }) {
  const read = readForge({ target: "issue", number, transport, projectDir });
  if (read.ok === false) throw new DoctorRefusal(read.refusal.code, read.refusal.detail);
  return read.envelope.fields
    .filter((field) => field.verdict === "allowed")
    .map((field) => field.fenced)
    .join("\n")
    .toLowerCase();
}

/**
 * Whether a read refusal means "this candidate no longer exists" rather than
 * "this forge cannot be read". The transport classifies a 404 as
 * `unavailable-forge-no-network` (it cannot tell an absent resource from an
 * unreachable host), so the distinction is made here, once, from the detail it
 * carries — a vanished candidate is a named degradation, everything else stays
 * fatal (`O14`: an unreachable forge is never read as "no issue exists").
 */
const MISSING = /\b404\b|not found|does not exist/iu;

/**
 * Match every report class against the candidate issues.
 *
 * @param {{bundle: object, transport?: object, candidate?: string[], search?: string[], projectDir?: string}} input
 * @returns {object} the `workflow-doctor-route@1` envelope
 */
export function buildRoute({ bundle, transport = null, candidate = [], search = [], projectDir = process.cwd() } = {}) {
  if (bundle === null || typeof bundle !== "object" || !Array.isArray(bundle.classes)) {
    throw new DoctorRefusal("malformed-bundle", "route needs a bundle receipt carrying a `classes` array");
  }
  const channel = transport ?? createGhTransport({ cwd: projectDir });
  const numbers = candidatesOf({ candidate, search, transport: channel });
  const texts = new Map();
  const degradations = [];
  for (const number of numbers) {
    try {
      texts.set(number, guardedText({ number, transport: channel, projectDir }));
    } catch (error) {
      if (!(error instanceof DoctorRefusal) || !MISSING.test(error.message)) throw error;
      degradations.push({ issue: number, code: error.refusal, detail: error.message });
    }
  }

  const classes = bundle.classes.map((entry) => {
    const tokens = tokensOf(entry);
    let best = { issue: null, score: 0, matched: [] };
    for (const number of numbers) {
      const text = texts.get(number);
      if (text === undefined) continue;
      const matched = tokens.filter((token) => text.includes(token));
      // Deterministic tie-break: the lowest issue number wins, because two
      // equally good candidates must not make the receipt depend on read order.
      if (matched.length > best.score) best = { issue: number, score: matched.length, matched };
    }
    const covered = best.score >= MIN_MATCH;
    return {
      class: entry.class,
      action: covered ? "existing-issue" : "new-issue",
      issue: covered ? best.issue : null,
      score: covered ? best.score : 0,
      matched: covered ? best.matched : [],
    };
  });

  return { contract: ROUTE_CONTRACT, candidates: numbers, classes, degradations, consent: CONSENT };
}

/** The fixed route block: one line per class, then the consent the filing needs. */
export function renderRoute(receipt) {
  const lines = [
    `WORKFLOW DOCTOR ROUTE — ${receipt.candidates.length} candidate(s) · ${receipt.classes.length} report class(es) · contract ${receipt.contract}`,
  ];
  if (receipt.candidates.length === 0) lines.push("candidates: none — every class is a new issue");
  if (receipt.degradations.length > 0) {
    lines.push(`degradations: ${receipt.degradations.map((item) => `#${item.issue} ${item.code}`).join(", ")}`);
  }
  for (const entry of receipt.classes) {
    const target = entry.action === "existing-issue" ? `existing-issue #${entry.issue}` : "new-issue";
    lines.push(`${entry.class} · ${target} · score ${entry.score}${entry.matched.length === 0 ? "" : ` · matched ${entry.matched.join(", ")}`}`);
  }
  lines.push(`consent: ${receipt.consent}`);
  return lines.join("\n");
}

/** The one forge argv this command runs, per action. */
function argvFor({ action, issue, repo, title }) {
  const scope = repo === null ? [] : ["--repo", repo];
  if (action === "create") return ["issue", "create", ...scope, "--title", title, "--body-file", "-"];
  return ["issue", "comment", String(issue), ...scope, "--body-file", "-"];
}

/**
 * Publish the bundle upstream — the command's only write.
 *
 * @param {{bundleFile: string, issue?: number|string|null, newTitle?: string|null, repo?: string|null,
 *          forge?: string, yes?: boolean, spawn?: Function, env?: object}} input
 * @returns {object} the `workflow-doctor-publish@1` receipt
 */
export function publishReceipt({
  bundleFile,
  issue = null,
  newTitle = null,
  repo = null,
  forge = "default",
  yes = false,
  spawn = spawnSync,
  env = process.env,
} = {}) {
  if (yes !== true) {
    throw new DoctorRefusal(
      "consent-required",
      "publish requires explicit consent: show the bundle to the user, then pass --yes — nothing was read, written or posted",
    );
  }
  if (!SUPPORTED_FORGES.includes(String(forge))) {
    throw new DoctorRefusal(
      "unsupported-upstream-forge",
      `the upstream forge "${forge}" is not supported by this command (${SUPPORTED_FORGES.join(", ")}); a second transport is its own unit`,
    );
  }
  if (repo !== null && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(String(repo))) {
    throw new DoctorRefusal("invalid-upstream-repo", `"${repo}" is not an owner/name pair`);
  }
  const create = newTitle !== null && String(newTitle).trim() !== "";
  if (!create && (issue === null || String(issue).trim() === "")) {
    throw new DoctorRefusal("missing-target", "publish needs --issue <n> or --new-title <title>");
  }
  if (!fs.existsSync(bundleFile)) {
    throw new DoctorRefusal("missing-bundle", `${bundleFile} does not exist`);
  }
  const body = fs.readFileSync(bundleFile, "utf8");
  if (!body.includes(BUNDLE_CONTRACT)) {
    throw new DoctorRefusal("malformed-bundle", `the file does not carry the ${BUNDLE_CONTRACT} receipt`);
  }

  const required = requireForgeCli(forge === "default" ? "default" : forge, { env });
  if (required.ok === false) throw new DoctorRefusal("unavailable-forge-missing-cli", required.message);

  const action = create ? "create" : "comment";
  const args = argvFor({ action, issue, repo: repo === null ? null : String(repo), title: String(newTitle ?? "").trim() });
  let result;
  try {
    result = spawn(required.cli, args, { encoding: "utf8", input: body });
  } catch (error) {
    throw new DoctorRefusal("forge-write-failed", `the forge CLI could not run: ${error?.message ?? String(error)}`);
  }
  if (result?.error !== undefined && result?.error !== null) {
    const code = result.error.code === "ENOENT" ? "unavailable-forge-missing-cli" : "forge-write-failed";
    throw new DoctorRefusal(code, `the forge CLI could not run: ${result.error.message ?? result.error}`);
  }
  if (result?.status !== 0) {
    const detail = String(result?.stderr ?? "").trim().split("\n")[0] ?? "";
    throw new DoctorRefusal("forge-write-failed", `the forge refused the write (exit ${result?.status}): ${detail}`);
  }

  return {
    contract: PUBLISH_CONTRACT,
    action: create ? "create-issue" : "append-evidence",
    target: { issue: create ? null : Number(issue), repo: repo === null ? null : String(repo) },
    posted: true,
  };
}

/** The fixed publication block. */
export function renderPublish(receipt) {
  const target = receipt.action === "create-issue" ? "a new issue" : `issue #${receipt.target.issue}`;
  return [
    `WORKFLOW DOCTOR PUBLISH — ${receipt.action} · contract ${receipt.contract}`,
    `posted: ${target}${receipt.target.repo === null ? "" : ` on ${receipt.target.repo}`}`,
  ].join("\n");
}
