#!/usr/bin/env node
/**
 * unit-cycle.mjs — the delivery cycle as code (unit 78, owner directive).
 *
 * A deterministic control loop drives one unit through its whole cycle —
 * design if undesigned, plan if unplanned, each phase as its own session,
 * tests, evidence, docs, release, the context-clean review whose receipt
 * passes, folds within a bounded budget, and audit-pr — re-sensing repository
 * state after every act. The control decisions are pure (`decide`) and proven
 * offline in `unit-cycle.test.mjs` with an injected executor; judgment steps
 * are spawned as `pi -p` sessions, never re-derived by prose.
 *
 * Terminal outcomes are a closed set (also the process exit codes):
 *
 *   done             0   the audit's merge-ready comment is current at the head
 *   needs-input      2   open questions (or an audit blocked without findings)
 *                        stop the loop; the verbatim open-questions@1 block is
 *                        printed before exiting
 *   budget-exhausted 3   the fold budget (--max-cycles, default 2) is spent
 *   no-progress      4   a commit-expecting act left head+findings unchanged
 *   failed           5   dirty tree, on-main, red gate, failed step, unreadable unit
 *   (usage/internal) 1
 *
 * Usage:
 *   node scripts/unit-cycle.mjs <NN|slug|path> [--max-cycles N] [--max-actions N]
 *                               [--dry-run] [--json] [--help]
 *
 * `--dry-run` senses and decides, prints the next action, spawns nothing.
 * Env: UNIT_CYCLE_MAX_CYCLES / UNIT_CYCLE_MAX_ACTIONS override the defaults.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { parseUnitDocPhases } from "./unit-doc-phases.mjs";
import { compute as needsInputCompute } from "./needs-input.mjs";
import { findRow, rowUpsert } from "../packages/agentic-workflow/src/edit/Roadmap.mjs";
import {
  openRows,
  routeOfRow,
  sectionBody,
  recordedPhases,
  resolveUnit,
} from "./unit-route.mjs";
import { fileURLToPath } from "node:url";
import { AUDIT_MARKER_RE } from "./audit-pr-gate.mjs";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.dirname(SCRIPTS_DIR);
/** The checkout the loop drives (`--repo`); defaults to this script's repo. */
let TARGET = REPO;

export const OUTCOME = Object.freeze({
  DONE: "done",
  NEEDS_INPUT: "needs-input",
  BUDGET: "budget-exhausted",
  NO_PROGRESS: "no-progress",
  FAILED: "failed",
});

/** Acts that must move the head+findings key (the no-progress rule, D6). */
const COMMITS = new Set(["research", "design", "plan", "phase", "evidence", "docs", "release", "fold", "settle-roadmap"]);

/* ------------------------------------------------------------------ pure */

/** Declared phases minus recorded ones, ascending. */
export function phaseOrder(declared, done) {
  const doneSet = new Set(done ?? []);
  return [...new Set(declared ?? [])].sort((a, b) => a - b).filter((n) => !doneSet.has(n));
}

const AC_GUIDANCE = /Design step finalises wording|Numbered list\. Each AC is/;

/** A unit whose AC section still carries template/lane guidance is undesigned. */
export function designedFrom(acSection) {
  const body = acSection ?? "";
  if (body === "" || AC_GUIDANCE.test(body)) return false;
  return /^\s*\d+\.\s+/m.test(body);
}

/** A progress entry head, e.g. `- 2026-10-23 14:24 — evidence step: …`. */
function progressHasStep(progress, step) {
  return new RegExp(`^[-*+] [^\\n]*\\b${step} step\\b`, "m").test(progress ?? "");
}

/** Research is done when the Evidence carries R-rows and the log says so. */
export function researchDoneFrom(evidence, progress) {
  return /^\|\s*R\d+\s*\|/m.test(evidence ?? "") && progressHasStep(progress, "research");
}

/** The PR number a unit's References section names, or null. */
export function parsePrNumber(references) {
  const m = /(?:^|\n)-\s*PR:\s*(\S+)/.exec(references ?? "");
  if (!m) return null;
  const pr = /\/pull\/(\d+)/.exec(m[1]) ?? /^#?(\d+)$/.exec(m[1]);
  return pr ? Number(pr[1]) : null;
}

/** The PR URL a unit's References section names whole, for the settle link. */
export function parsePrUrl(references) {
  const m = /(?:^|\n)-\s*PR:\s*(\S+)/.exec(references ?? "");
  if (!m) return null;
  return /\/pull\/\d+/.test(m[1]) ? m[1] : null;
}

/**
 * settleRoadmapRow — the loop writes the roadmap row itself (issue #316):
 * the done settle goes through the crate's `rowUpsert` (the writer the issue
 * names), with every cell the write does not own preserved verbatim, so the
 * row's slug, dependency and summary survive. Never asks the model to.
 *
 * Writes `done · [#<pr>](<prUrl>)` into the status cell. A rowless NN is
 * inserted (slug when given); a fix-unit row is refused — the fix index
 * removes merged rows by its own convention and its table grammar is not the
 * roadmap's, so the writer fails closed there and the settle stays the
 * release step's documented duty.
 */
export function settleRoadmapRow({ nn, pr, prUrl, slug }, { cwd } = {}) {
  const table = path.join(cwd ?? REPO, "docs", "features", "ROADMAP.md");
  const status = `done · [#${pr}](${prUrl})`;
  try {
    const row = findRow(table, String(nn));
    const receipt = rowUpsert(table, {
      nn: String(nn),
      slug: row?.slug ?? (slug ? `\`${slug}\`` : ""),
      status,
      dependsOn: row?.dependsOn ?? "",
      description: row?.description ?? "",
    });
    return receipt.ok ? { ok: true, status } : { ok: false, detail: `rowUpsert receipt not ok for NN ${nn}` };
  } catch (error) {
    return { ok: false, detail: error?.message ?? String(error) };
  }
}

/**
 * The state machine. `state` carries both sensed facts and loop history
 * (foldCycles/actions/prevAction/maxCycles/maxActions — merged in by runCycle).
 */
export function decide(state) {
  const wants = (step) => !Array.isArray(state.triageSteps) || state.triageSteps.includes(step);
  const fail = (detail) => ({ type: "stop", reason: OUTCOME.FAILED, detail });
  const step = (name) => ({ type: "step", step: name });

  if (state.dirty) return fail("dirty-tree");
  if (state.branch === "main") return fail("on-main");
  if ((state.pendingInput ?? 0) > 0) return { type: "stop", reason: OUTCOME.NEEDS_INPUT };
  if ((state.actions ?? 0) >= (state.maxActions ?? 40)) return fail("action-budget");
  if (state.ledgerError) return fail("ledger-error");
  if (state.docExists === false) return step("design");
  if (state.triageError) return fail("triage-error");
  if (state.tasksMalformed) {
    return fail(
      `tasks-grammar — ${state.tasksMalformed} \`P<n>\` line(s) in the Tasks section do not parse; ` +
        `each phase is a list item (\`- P1 — …\`) with a validator, so \`parseUnitDocPhases\` can read it`,
    );
  }
  if (wants("research") && !state.researchDone) return step("research");
  if (wants("design") && !state.designed) return step("design");

  const declared = state.phasesDeclared ?? [];
  if (wants("plan") && declared.length === 0) return step("plan");
  const unfinished = phaseOrder(declared, state.phasesDone ?? []);
  if (unfinished.length > 0) return { type: "phase", n: unfinished[0] };

  if (wants("tests") && (state.testsOk ?? null) === null) return step("tests");
  if ((state.testsOk ?? null) === false) return fail("gate-red");
  if (wants("evidence") && !state.evidenceDone) return step("evidence");
  if (wants("docs") && !state.docsDone) return step("docs");
  if (!state.releaseDone) return step("release");
  // The done settle is code (issue #316): between the release and the receipt
  // chain, the loop writes the row itself — a skipped write can never reach
  // review, and `roadmapSettled === false` is sensed, never assumed.
  if (state.roadmapSettled === false) return { type: "settle-roadmap" };

  // Receipt → fold loop → audit. The receipt is machine ground truth.
  const foldCycles = state.foldCycles ?? 0;
  const maxCycles = state.maxCycles ?? 2;
  const findings = state.openFindings ?? [];
  if (state.receipt !== "current") {
    if (findings.length > 0) {
      if (foldCycles >= maxCycles) return { type: "stop", reason: OUTCOME.BUDGET };
      return step("fold");
    }
    if (state.prevAction === "review") return fail("review-no-receipt");
    return step("review");
  }
  if (state.auditGateError) return fail("audit-gate-error");
  if (findings.length > 0) {
    if (foldCycles >= maxCycles) return { type: "stop", reason: OUTCOME.BUDGET };
    return step("fold");
  }
  if (state.mergeReady === true) return { type: "stop", reason: OUTCOME.DONE };
  if (state.prevAction === "audit") return { type: "stop", reason: OUTCOME.NEEDS_INPUT, detail: "audit-blocked" };
  return step("audit");
}

/** The exact command one judgment step receives. */
export function renderPrompt(action, state) {
  const unit = state.unit;
  const head =
    `You are one step executor of unit-cycle, the coded delivery loop, for ${unit}. ` +
    `Perform ONLY this step, follow the named contract literally, commit with a ` +
    `conventional commit message, never widen scope, and stop.`;
  const label = action.type === "phase" ? "phase" : action.step;
  switch (label) {
    case "phase": {
      const tier = state.tiers?.implement ?? "implement";
      return {
        prompt:
          `${head}\n\nStep: run \`/execute-phase ${unit} P${action.n} (tier: ${tier})\` — ` +
          `exactly one phase: implement it, run the phase validator and ` +
          `\`bun scripts/diff-guard.mjs --unit ${action.n}\`, commit, and stop. ` +
          `Do not start another phase.`,
      };
    }
    case "design": {
      const create = state.docExists
        ? ""
        : `\n\nThe unit doc is missing: create ${state.unitDir}/SPEC.md from ` +
          `\`docs/features/_TEMPLATE/SPEC.md\` first (title, frontmatter type: feature).`;
      return {
        prompt:
          `${head}${create}\n\nStep: run unit-lane's design step ` +
          `(\`skills/unit-lane/references/DESIGN.md\`) for ${unit} only: finalise the ` +
          `acceptance criteria with their sources, and when a fact is owned by the ` +
          `human, append an open-question row to \`decisions.md\` instead of inferring — ` +
          `the loop stops for input on the next sense.`,
      };
    }
    case "plan":
      return {
        prompt:
          `${head}\n\nStep: run unit-lane's plan step ` +
          `(\`skills/unit-lane/references/PLAN.md\`) for ${unit}: cut the Tasks into ` +
          `P1…Pn with per-phase validators and relevant files, write the planning ` +
          `ledgers, and set the roadmap row's status.`,
      };
    case "research":
      return {
        prompt:
          `${head}\n\nStep: run unit-lane's research step for ${unit} (one web pass over ` +
          `the primary sources): record each finding as an \`R<n>\` row in the unit doc's ` +
          `Evidence section, route uncertainties to open questions, and record a ` +
          `\`research step\` head in the Progress log.`,
      };
    case "evidence":
      return {
        prompt:
          `${head}\n\nStep: run unit-lane's evidence step for ${unit}: re-run every ` +
          `acceptance command, write one Evidence row per AC (command → exit/digest → ` +
          `output → verified-by), and record an \`evidence step\` head in the Progress log.`,
      };
    case "docs":
      return {
        prompt:
          `${head}\n\nStep: run unit-lane's docs step ` +
          `(\`skills/unit-lane/references/DOCS.md\`) for ${unit}: update every ` +
          `documentation surface the unit demands (changelog rows, READMEs, references ` +
          `that drifted), then record a \`docs step\` head in the Progress log.`,
      };
    case "release":
      return {
        prompt:
          `${head}\n\nStep: run unit-lane's release step ` +
          `(\`skills/unit-lane/references/RELEASE.md\`) for ${unit}: push the branch, open ` +
          `the PR against \`main\` carrying the Evidence section and \`Closes\`, write ` +
          `\`- PR: <url>\` into the unit doc's References, and stop — the loop ` +
          `settles the roadmap row itself before the review runs.`,
      };
    case "review":
      return {
        prompt:
          `${head}\n\nStep: run \`/review-change ${unit}\` — the context-clean end review ` +
          `for PR #${state.prNumber}: run the applicable axes and persist findings in the ` +
          `unit's \`review-findings.md\`. **Order is strict (the loop machine-checks it):** ` +
          `commit AND push every artifact your review produces first (findings ledger, ` +
          `review-debt, everything — one or more commits is fine), then emit the ` +
          `SHA-bound \`review-change:pass\` receipt LAST with ` +
          `\`--head \"$(git rev-parse HEAD)\"\` at that final head. **Never commit, push or ` +
          `write anything after the receipt** — a later commit voids it and the loop ` +
          `will re-run the review.`,
      };
    case "fold":
      return {
        prompt:
          `${head}\n\nStep: run \`/fold-findings\` for ${unit}: repair the open fix-now ` +
          `findings (${(state.openFindings ?? []).join(", ")}) in compatible atomic ` +
          `batches with a green gate, commit, and mark each row folded.`,
      };
    case "audit":
      return {
        prompt:
          `${head}\n\nStep: run \`/audit-pr\` against PR #${state.prNumber}: audit the PR ` +
          `against the delivery contract at the settled head and emit the ` +
          `\`audit-pr:merge-ready\` comment if it is ready; otherwise report the ` +
          `evidenced blockers without editing code.`,
      };
    default:
      throw new Error(`unknown action: ${JSON.stringify(action)}`);
  }
}

/* ----------------------------------------------------------------- sense */

function sh(cmd, args, cwd = TARGET) {
  const r = spawnSync(cmd, args, { encoding: "utf8", cwd, timeout: 30_000 });
  return { status: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

const SCOPE_MAP = { XS: "xs", S: "small", M: "medium", L: "large", XL: "xlarge" };

/** Resolve a unit token against TARGET (never against this script's checkout). */
function resolveTargetUnit(token) {
  // When TARGET matches the default PROJECT, delegate to resolveUnit (unit-route).
  // When TARGET differs (e.g. --repo), fall back to a local scan under TARGET.
  const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  if (TARGET === projectDir) {
    return resolveUnit(token);
  }
  const clean = token.replace(/^docs\/(?:features|fix)\//, "").replace(/\/+$/, "");
  const entries = [];
  for (const [kind, dir] of [["feature", "docs/features"], ["fix", "docs/fix"]]) {
    try {
      const dirents = fs.readdirSync(path.join(TARGET, dir), { withFileTypes: true });
      for (const e of dirents) {
        if (!e.isDirectory() || e.name.startsWith("_")) continue;
        const m = /^(\d+)-(.+)$/.exec(e.name);
        if (!m) continue;
        entries.push({ kind, number: m[1], slug: e.name, dir: `${dir}/${e.name}` });
      }
    } catch {}
  }
  const matches = /^\d+$/.test(clean)
    ? entries.filter((folder) => folder.number === clean)
    : entries.filter((folder) => folder.slug === clean || folder.dir.endsWith(`/${clean}`));
  return { matches, clean };
}

function roadmapRow(nn, cwd = TARGET) {
  const text = fs.readFileSync(path.join(cwd, "docs/features/ROADMAP.md"), "utf8");
  const line = text.split("\n").find((row) => row.startsWith(`| ${nn} |`));
  if (!line) return null;
  const cells = line.split("|").map((cell) => cell.trim());
  const slug = (cells[2] ?? "").replace(/`/g, "");
  const summary = cells[5] ?? "";
  const scope = /\((XS|XL|S|M|L)\)/.exec(summary)?.[1] ?? null;
  return slug ? { slug, scope: scope ? SCOPE_MAP[scope] : null } : null;
}

/** Read every fact the state machine needs. Throws only on usage errors. */
export function sense(token) {
  const { matches, clean } = resolveTargetUnit(token);
  let unitDir = matches[0]?.dir ?? null;
  let row = null;
  if (!unitDir && /^\d+$/.test(clean)) row = roadmapRow(clean);
  if (!unitDir && row) unitDir = `docs/features/${clean}-${row.slug}`;
  if (!unitDir) {
    const error = new Error(`unit not found: ${clean}`);
    error.usage = true;
    throw error;
  }

  const specPath = path.join(TARGET, unitDir, "SPEC.md");
  const docExists = fs.existsSync(specPath);
  const doc = docExists ? fs.readFileSync(specPath, "utf8") : "";
  const progress = sectionBody(doc, "Progress log") ?? "";
  const evidence = sectionBody(doc, "Evidence") ?? "";
  const references = sectionBody(doc, "References") ?? "";
  const ac = sectionBody(doc, "Acceptance criteria") ?? "";
  const phases = docExists ? parseUnitDocPhases(doc).phases.map((phase) => phase.number) : [];
  // A `P<n>` line the repo's parser cannot read (not a list item) is a
  // document defect, not "plan not done yet": name it instead of re-running
  // the plan step forever.
  const tasksBody = sectionBody(doc, "Tasks") ?? "";
  const tasksMalformed = tasksBody
    .split("\n")
    .filter((line) => /^\s*\**P\d+\b/.test(line) && !/^ {0,3}[-*+]\s/.test(line)).length;

  const ni = needsInputCompute(path.join(TARGET, unitDir));
  // A decisions ledger with no `open-questions@1` block is a unit that never
  // asked a question — absence is not corruption. Only a present-but-malformed
  // ledger fails the run (needs-input itself fails closed on both).
  const decisionsPath = path.join(TARGET, unitDir, "decisions.md");
  const decisions = fs.existsSync(decisionsPath) ? fs.readFileSync(decisionsPath, "utf8") : "";
  const hasQuestionLedger = /^open-questions@1\s*$/m.test(decisions);
  const pendingInput = ni.ok ? ni.open_questions.length : 0;
  const ledgerError = ni.ok || ni.reason === "missing-unit-doc" || (!hasQuestionLedger && ni.reason === "malformed-ledger-header")
    ? null
    : ni.reason;

  let triageSteps = null;
  let triageError = false;
  let tiers = null;
  // The unit doc's own `## Triaged steps` block is authoritative (the lane
  // pastes it verbatim); a doc that records `n/a` demands no catalog step at
  // all, so the loop never invents a design/plan step the unit never had.
  const triagedBody = docExists ? (sectionBody(doc, "Triaged steps") ?? "") : "";
  const declaredSteps = /^Steps:\s*(.+)$/m.exec(triagedBody);
  const noneDemanded = /\bn\/a\b/u.test(triagedBody) && declaredSteps === null;
  if (noneDemanded) triageSteps = [];
  else if (docExists) {
    const r = sh(process.execPath, ["scripts/unit-route.mjs", "--triage", unitDir, "--json"]);
    if (r.status === 0) {
      try {
        const parsed = JSON.parse(r.stdout);
        triageSteps = parsed.steps;
        tiers = parsed.tiers;
      } catch {
        triageError = true;
      }
    } else {
      triageError = true;
    }
  }

  const branch = sh("git", ["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim();
  const dirty = sh("git", ["status", "--porcelain"]).stdout.trim() !== "";
  const head = sh("git", ["rev-parse", "HEAD"]).stdout.trim();
  const prNumber = parsePrNumber(references);
  const prUrl = parsePrUrl(references);

  // The settle fact (issue #316): a roadmap row reading `done · [#N](<same
  // url>)`. Fix units are exempt in-code — the fix index removes merged rows
  // by its own convention, so `roadmapSettled` stays null there and the
  // release step's documented duty owns their row.
  let roadmapSettled = null;
  const nn = path.basename(unitDir).match(/^(\d+)/)?.[1] ?? null;
  const isFix = unitDir.split(path.sep).includes("fix") && unitDir.split(path.sep).includes("docs");
  if (!isFix && nn) {
    const row = findRow(path.join(TARGET, "docs", "features", "ROADMAP.md"), nn);
    if (!row || prNumber === null) {
      roadmapSettled = false;
    } else {
      const token = row.status.replace(/[`*]/g, "").split("·")[0].trim();
      const link = prUrl ? new RegExp(`\\[#${prNumber}\\]\\(`).test(row.status) : false;
      roadmapSettled = token === "done" && link;
    }
  }

  let receipt = null;
  if (prNumber) {
    const r = sh(process.execPath, ["scripts/review-receipt.mjs", "verify", "--pr", String(prNumber)]);
    receipt = r.status === 0 ? "current" : r.status === 4 ? "stale" : "absent";
  }

  const findingsPath = path.join(TARGET, unitDir, "review-findings.md");
  const openFindings = fs.existsSync(findingsPath)
    ? openRows(fs.readFileSync(findingsPath, "utf8"))
        .filter((finding) => routeOfRow(finding) === "fold")
        .map((finding) => finding.id)
    : [];

  let mergeReady = null;
  let auditGateError = null;
  if (prNumber && receipt === "current") {
    // The audit pass is the `audit-pr:merge-ready` marker at the settled head.
    // (A bare `evaluate` without the skill's gate set fails closed by design,
    // so the marker — emitted only after every gate passed — is the signal.)
    const r = sh("gh", ["pr", "view", String(prNumber), "--json", "comments"]);
    if (r.status !== 0) {
      auditGateError = `gh pr view exited ${r.status}: ${r.stderr.trim().split("\n")[0] || "unreadable comments"}`;
    } else {
      try {
        const comments = JSON.parse(r.stdout).comments ?? [];
        mergeReady = comments.some((comment) => AUDIT_MARKER_RE.exec(comment.body ?? "")?.[1] === head);
      } catch (error) {
        auditGateError = `unreadable comments payload: ${error?.message ?? error}`;
      }
    }
  }

  return {
    unit: unitDir.split("/").pop(),
    unitDir,
    docExists,
    designed: designedFrom(ac),
    researchDone: researchDoneFrom(evidence, progress),
    evidenceDone: progressHasStep(progress, "evidence"),
    docsDone: progressHasStep(progress, "docs"),
    releaseDone: prNumber !== null,
    roadmapSettled,
    phasesDeclared: phases,
    phasesDone: [...recordedPhases(doc)],
    testsOk: null,
    triageSteps,
    triageError,
    tasksMalformed,
    tiers,
    branch,
    dirty,
    pendingInput,
    ledgerError,
    prNumber,
    receipt,
    openFindings,
    mergeReady,
    auditGateError,
    key: `${head}|${[...openFindings].sort().join(",")}`,
  };
}

/* ------------------------------------------------------------------- act */

function runRootSuite() {
  // The schema's dist/ is a gitignored build output (fresh checkouts lack it);
  // build it when missing so the root suite runs against built artifacts, the
  // same order `root-suite.yml` uses before the crate suite.
  const schemaDist = path.join(TARGET, "packages/agentic-workflow-schema/dist/index.js");
  if (!fs.existsSync(schemaDist)) {
    const pkg = path.join(TARGET, "packages/agentic-workflow-schema");
    const built = spawnSync("bun", ["run", "build"], { cwd: pkg, encoding: "utf8", timeout: 30_000 });
    if ((built.status ?? 1) !== 0) {
      const fallback = spawnSync("npm", ["run", "build"], { cwd: pkg, encoding: "utf8", timeout: 30_000 });
      if ((fallback.status ?? 1) !== 0) {
        throw new Error(
          `schema build failed (bun exit ${built.status}: ${(built.stderr ?? "").trim().split("\n")[0] || "no output"}; npm exit ${fallback.status})`,
        );
      }
    }
  }
  const files = fs
    .readdirSync(path.join(TARGET, "scripts"))
    .filter((name) => name.endsWith(".test.mjs"))
    .sort()
    .map((name) => path.join("scripts", name));
  const r = spawnSync(process.execPath, ["--test", ...files], { cwd: TARGET, encoding: "utf8", timeout: 30_000 });
  if ((r.status ?? 1) !== 0) {
    const tail = `${r.stdout ?? ""}${r.stderr ?? ""}`.split("\n").slice(-12).join("\n");
    throw new Error(`root suite red (exit ${r.status}):\n${tail}`);
  }
  return `${files.length} files green`;
}

/** One act: `tests` and the roadmap settle run in code, everything else spawns a pi session. */
function makeAct() {
  return (action, state) => {
    const label = action.type === "phase" ? `P${action.n}` : (action.step ?? action.type);
    if (action.type === "step" && action.step === "tests") {
      runRootSuite();
      return;
    }
    if (action.type === "settle-roadmap") {
      // The loop writes the row itself (issue #316) — through the crate's
      // rowUpsert, cells preserved — then commits and pushes the settle so the
      // receipt chain sees a current head.
      const unit = state.unit;
      const result = settleRoadmapRow(
        { nn: /^\d+/.exec(unit)?.[0], pr: state.prNumber, prUrl: state.prUrl, slug: unit.replace(/^\d+-/, "") },
        { cwd: TARGET },
      );
      if (!result.ok) throw new Error(`roadmap settle failed: ${result.detail}`);
      const commit = spawnSync(
        "git",
        ["commit", "--", "docs/features/ROADMAP.md", "-m", `docs(roadmap): settle ${unit} — done · [#${state.prNumber}](${state.prUrl})`],
        { cwd: TARGET, encoding: "utf8" },
      );
      if ((commit.status ?? 1) !== 0) {
        throw new Error(`roadmap settle commit failed: ${(commit.stderr ?? "").trim().split("\n")[0] || `exit ${commit.status}`}`);
      }
      return;
    }
    const { prompt } = renderPrompt(action, state);
    const r = spawnSync("pi", ["-p", "--approve", "--name", `unit-cycle:${state.unit}:${label}`, prompt], {
      cwd: TARGET,
      stdio: "inherit",
      timeout: 30_000,
    });
    if ((r.status ?? 1) !== 0) {
      throw new Error(`pi session exited ${r.status ?? `on signal ${r.signal}`} for ${label}`);
    }
    // The receipt chain is forge-bound: a step that commits must land on the
    // remote or `review-receipt verify --pr` can never see a current head.
    // `review` joins the push set without joining the commit set: its own
    // artifacts must already be pushed before its receipt was emitted, and a
    // no-op push cannot void a receipt.
    const pushedLabel = action.type === "phase" ? "phase" : (action.step ?? action.type);
    if (COMMITS.has(pushedLabel) || pushedLabel === "review") {
      const pushed = spawnSync("git", ["push"], { cwd: TARGET, encoding: "utf8", timeout: 30_000 });
      if ((pushed.status ?? 1) !== 0) {
        throw new Error(`push after ${label} failed: ${(pushed.stderr ?? "").trim().split("\n")[0] || `exit ${pushed.status}`}`);
      }
    }
  };
}

/* -------------------------------------------------------------- runCycle */

/**
 * The generic loop. `sense` returns the next state, `act` executes one
 * action (and may throw to stop the run), `log` narrates. Control decisions
 * stay in `decide`, so this whole loop is proven offline.
 */
export async function runCycle({ sense: senseFn, act, log = () => {} }) {
  const history = { foldCycles: 0, actions: 0, prevAction: null, testsOk: null, acted: [] };
  let state = await senseFn();
  for (;;) {
    const merged = {
      ...state,
      foldCycles: history.foldCycles,
      maxCycles: state.maxCycles ?? 2,
      actions: history.actions,
      maxActions: state.maxActions ?? 40,
      prevAction: history.prevAction,
      testsOk: history.testsOk === null ? (state.testsOk ?? null) : history.testsOk,
    };
    const action = decide(merged);
    if (action.type === "stop") {
      return { outcome: action.reason, detail: action.detail, actions: history.acted, foldCycles: history.foldCycles };
    }
    const label = action.type === "phase" ? `phase P${action.n}` : action.step;
    log(`unit-cycle → ${label}`);
    try {
      await act(action, merged);
    } catch (error) {
      return {
        outcome: OUTCOME.FAILED,
        detail: `${label}: ${error?.message ?? error}`,
        actions: history.acted,
        foldCycles: history.foldCycles,
      };
    }
    history.acted.push(action.type === "phase" ? `phase${action.n}` : (action.step ?? action.type));
    const after = await senseFn();
    const key = action.type === "phase" ? "phase" : (action.step ?? action.type);
    if (COMMITS.has(key) && after.key === state.key) {
      return {
        outcome: OUTCOME.NO_PROGRESS,
        detail: `${label} left the head+findings key unchanged`,
        actions: history.acted,
        foldCycles: history.foldCycles,
      };
    }
    if (key === "fold") history.foldCycles += 1;
    if (key === "tests") history.testsOk = true;
    history.actions += 1;
    history.prevAction = key;
    state = after;
  }
}

/* ------------------------------------------------------------------ main */

const EXIT_CODES = {
  [OUTCOME.DONE]: 0,
  [OUTCOME.NEEDS_INPUT]: 2,
  [OUTCOME.BUDGET]: 3,
  [OUTCOME.NO_PROGRESS]: 4,
  [OUTCOME.FAILED]: 5,
};

const USAGE = `usage: node scripts/unit-cycle.mjs <NN|slug|path> [--repo <checkout>] [--max-cycles N] [--max-actions N] [--dry-run] [--json]

Runs a unit's whole delivery cycle as code: design → plan → phases → tests →
evidence → docs → release → review receipt → fold ≤ X → audit-pr, stopping on
manual input or a terminal state (exit codes: 0 done · 2 needs-input ·
3 budget-exhausted · 4 no-progress · 5 failed · 1 usage).`;

function main(argv) {
  const args = argv.slice(2);
  let token = null;
  let maxCycles = Number(process.env.UNIT_CYCLE_MAX_CYCLES ?? 2);
  let maxActions = Number(process.env.UNIT_CYCLE_MAX_ACTIONS ?? 40);
  let dryRun = false;
  let json = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      process.stdout.write(`${USAGE}\n`);
      return 0;
    }
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--json") json = true;
    else if (arg === "--repo") {
      const value = args[++i];
      if (!value || !fs.existsSync(path.join(path.resolve(value), "scripts"))) {
        process.stderr.write(`--repo needs a checkout that contains scripts/\n`);
        return 1;
      }
      TARGET = path.resolve(value);
    }
    else if (arg === "--max-cycles" || arg === "--max-actions") {
      const value = Number(args[++i]);
      if (!Number.isInteger(value) || value < 0) {
        process.stderr.write(`${arg} needs a non-negative integer\n`);
        return 1;
      }
      if (arg === "--max-cycles") maxCycles = value;
      else maxActions = value;
    } else if (arg.startsWith("-")) {
      process.stderr.write(`unknown flag: ${arg}\n${USAGE}\n`);
      return 1;
    } else if (token === null) token = arg;
    else {
      process.stderr.write(`unexpected argument: ${arg}\n${USAGE}\n`);
      return 1;
    }
  }
  if (token === null) {
    process.stderr.write(`${USAGE}\n`);
    return 1;
  }

  let unitDir;
  const sensed = () => {
    const state = sense(token);
    unitDir = state.unitDir;
    return { ...state, maxCycles, maxActions };
  };

  if (dryRun) {
    let state;
    try {
      state = sensed();
    } catch (error) {
      process.stderr.write(`${error.message}\n`);
      return 1;
    }
    const action = decide({ ...state, foldCycles: 0, actions: 0, prevAction: null, testsOk: null });
    if (json) {
      process.stdout.write(`${JSON.stringify({ unit: state.unit, action, state }, null, 2)}\n`);
    } else {
      process.stdout.write(
        `unit-cycle dry-run — ${state.unit}\n` +
          `  branch: ${state.branch}${state.dirty ? " (dirty)" : ""} · receipt: ${state.receipt ?? "no PR"} · ` +
          `phases: ${state.phasesDone.length}/${state.phasesDeclared.length} · questions: ${state.pendingInput}\n` +
          `  next: ${action.type === "phase" ? `phase P${action.n}` : `${action.type === "stop" ? `stop — ${action.reason}${action.detail ? ` (${action.detail})` : ""}` : action.step}`}\n`,
      );
    }
    return 0;
  }

  return runCycle({ sense: sensed, act: makeAct(), log: (line) => process.stdout.write(`${line}\n`) })
    .then((result) => {
      if (json) {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      } else {
        process.stdout.write(`unit-cycle: ${result.outcome}${result.detail ? ` — ${result.detail}` : ""}\n`);
        if (result.actions.length > 0) process.stdout.write(`  acts: ${result.actions.join(" → ")}\n`);
      }
      if (result.outcome === OUTCOME.NEEDS_INPUT) {
        // The block is the operator's input request. A unit whose ledger simply
        // never existed has nothing to ask, so a non-zero needs-input run is
        // reported as "no open questions recorded" — not as a failure.
        const block = spawnSync(process.execPath, ["scripts/needs-input.mjs", unitDir], {
          cwd: TARGET,
          stdio: "inherit",
          timeout: 30_000,
        });
        if ((block.status ?? 1) !== 0) {
          process.stdout.write("  (no open-questions ledger for this unit — the stop came from the audit verdict)\n");
        }
      }
      return EXIT_CODES[result.outcome] ?? 1;
    })
    .catch((error) => {
      if (error?.usage) {
        process.stderr.write(`${error.message}\n`);
        return 1;
      }
      process.stderr.write(`unit-cycle failed: ${error?.message ?? error}\n`);
      return 1;
    });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  Promise.resolve(main(process.argv)).then((code) => {
    process.exitCode = code;
  });
}
