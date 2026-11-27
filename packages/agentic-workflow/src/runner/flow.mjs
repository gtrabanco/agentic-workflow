#!/usr/bin/env node
/**
 * flow.mjs — the deterministic lane driver (issue #669).
 *
 * One program, two doors: `/flow` hands the next catalog step to the model and
 * `/draft` is the same program stopped after the plan. This module is the
 * program's deterministic half — **sense → decide → hand off** — and it never
 * runs a step itself:
 *
 *   sense   `runTriage` (the closed catalog's step list), `computeRoute` (the
 *           router's route and its one command) and the unit doc's own facts
 *           (`## Tasks`, `## Risk tier`, `## Log`) through their one readers.
 *   decide  the first pending step, the post-plan stop rule, the session mode.
 *   hand off one command, one bounded read set, one receipt.
 *
 * The loop is closed by the step's own hand-off: the invoked skill must settle
 * before the next sense can observe its effect, so the driver never chains two
 * steps inside one invocation (unit decision D5).
 *
 * Read-only except for the two writes the operator asks for by name: `--yes`
 * (one human-owner row in the unit's `decisions.md`) and `--record` (one `D` log
 * line naming the composed session). Everything else is stdout.
 *
 * Exit codes: 0 a decision was printed (a halt included); 1 an unknown unit or a
 * usage error; 2 a refusal in the driver's own closed set (an unknown step name,
 * an ambiguous unit token, a unit doc outside the accepted shapes or unreadable).
 * Diagnostics go to stderr and a refusal prints no hand-off. `UNIT_ROUTE_REPO`
 * re-points the router, and therefore this driver, at a fixture tree.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { parseLog, parseUnitDocPhases, sectionText } from "./unit-doc-phases.mjs";
import { recordedTier } from "./ceremony/tier.mjs";
import { appendLogLine, today } from "./lib.mjs";
import { computeRoute, loadCatalog, projectRoot, relayAnswer, resolveUnit, runTriage } from "./unit-route.mjs";

/** The block's own contract id. */
export const FLOW_CONTRACT_ID = "flow@1";
/** The approval block `--stop-after` prints, declared by `flow-approval@1`. */
export const APPROVAL_CONTRACT_ID = "flow-approval@1";

/**
 * The routed session modes. The table that maps a recorded verdict onto one of
 * them is `flow-session-modes@1` in `docs/workflow/LIFECYCLE.md`; the code below
 * reads that table row for row.
 */
export const SESSION_MODES = Object.freeze(["single-session", "phase-per-turn", "orchestrate", "relay"]);

/** The steps a lane pass runs as one conductor invocation, in catalog order. */
const PLANNING_STEPS = Object.freeze(["research", "design", "plan"]);

/**
 * The v1 stop rules — the seam #708's SystemOne consumer will own
 * (`flow-stop-rules@1`, `docs/workflow/LIFECYCLE.md`). A rule set is plain data
 * so a later decision substrate passes its own without touching the grammar:
 * `{ contract, rules: [{ id, when, stop, overridable }] }`.
 *
 * `overridable: false` is what makes the define entry always stop: `/draft` is
 * an explicit `--stop-after plan`, and no flag cancels an explicit stop.
 */
export const FLOW_STOP_RULES_V1 = Object.freeze({
  contract: "flow-stop-rules@1",
  rules: Object.freeze([
    Object.freeze({ id: "explicit", when: "the operator passed --stop-after <step>", stop: "after-plan", overridable: false }),
    Object.freeze({ id: "tier-high", when: "the unit recorded tier high", stop: "after-plan", overridable: true }),
  ]),
});

/**
 * The one stop decision. Consulted only once the plan is done: a stop is a
 * post-plan rule by definition, and a unit that has not planned yet is handed the
 * lane instead.
 *
 * @param {{planned: boolean, tier: string|null, stopAfter: string|null, yes: boolean}} verdict
 * @param {{rules: readonly {id: string, stop: string, overridable: boolean}[]}} [rules]
 * @returns {{stop: boolean, rule: string|null, kind: string|null}}
 */
export function decideStop(verdict, rules = FLOW_STOP_RULES_V1) {
  if (verdict.stopAfter !== null) {
    // An explicit stop is the define entry: it is honoured whatever `--yes` says.
    const rule = rules.rules.find((entry) => entry.id === "explicit");
    return { stop: true, rule: rule === undefined ? "explicit" : rule.id, kind: "after-plan" };
  }
  if (!verdict.planned) return { stop: false, rule: null, kind: null };
  for (const rule of rules.rules) {
    if (rule.id !== "tier-high") continue;
    if (verdict.tier !== "high") continue;
    if (rule.overridable && verdict.yes) continue;
    return { stop: true, rule: rule.id, kind: "after-plan" };
  }
  return { stop: false, rule: null, kind: null };
}

/**
 * The session mode the recorded verdict composes (`flow-session-modes@1`):
 * a live Relay packet wins, then the recorded tier, then the size. Never a
 * keyboard choice, and never a mode outside the routed set.
 *
 * @param {{tier: string|null, scope: string, relay: string|null}} verdict
 */
export function composeSession(verdict) {
  if (verdict.relay === "active" || verdict.relay === "draft") return "relay";
  if (verdict.tier === "high") return "phase-per-turn";
  if (verdict.scope === "large" || verdict.scope === "xlarge") return "orchestrate";
  if (["trivial", "xs", "small"].includes(verdict.scope)) return "single-session";
  return "phase-per-turn";
}

/**
 * The step → reference map (`flow-step-references@1`): the bounded read set is
 * the step's own reference plus the unit's state pointers, never the transcript.
 * `handed-by` says who owns the command: `lane` runs the planning steps as one
 * conductor invocation, `router` means the router's own `next:` is the command
 * (the driver never re-decides a route).
 */
export const STEP_REFERENCES = Object.freeze({
  research: { reference: "skills/unit-lane/references/RESEARCH.md", handedBy: "lane" },
  design: { reference: "skills/unit-lane/references/DESIGN.md", handedBy: "lane" },
  plan: { reference: "skills/unit-lane/references/PLAN.md", handedBy: "lane" },
  implement: { reference: "skills/unit-lane/references/IMPLEMENT.md", handedBy: "router" },
  tests: { reference: "skills/unit-lane/references/TESTS.md", handedBy: "router" },
  evidence: { reference: "skills/unit-lane/references/EVIDENCE.md", handedBy: "router" },
  review: { reference: "skills/unit-lane/references/REVIEW.md", handedBy: "router" },
  docs: { reference: "skills/unit-lane/references/DOCS.md", handedBy: "router" },
  release: { reference: "skills/unit-lane/references/RELEASE.md", handedBy: "router" },
});

/** The step a router route hands over, by the driver's declared mapping. */
const ROUTE_STEPS = Object.freeze({
  execute: "implement",
  fold: "review",
  replan: "plan",
  product: "implement",
  "close-out": "done",
  historical: "done",
  "plan-from-issue": "plan",
});

const USAGE = `usage: agentic-workflow flow <unit> [--stop-after <step>] [--yes] [--retriage] [--record] [--json]

Prints the one next step of the lane's closed catalog for a unit, with the
bounded read set and the turn-contract receipt the model executes. It reads
machine state only (the unit doc, the router's triage answer and the router's
route) and writes nothing unless asked:

  --stop-after <step>  stop after that catalog step and print the approval block
                       (the /draft entry is --stop-after plan; an explicit stop is
                       never cancelled by --yes)
  --yes                the owner-typed override: no post-plan stop fires, and the
                       override lands as a human-owner D row in decisions.md
  --retriage           re-plan an already-planned unit (the only path back to
                       planning; without it a planned unit implements directly)
  --record             write the composed session mode into the unit doc's
                       ## Log as one D line, before execution starts
  --json               print the same decision as one JSON document

Exit codes: 0 a decision was printed (a halt included); 1 an unknown unit or a
usage error; 2 a refusal in the driver's own closed set. Diagnostics go to
stderr and a refusal prints no next line.
`;

function fail(code, message) {
  process.stderr.write(`FLOW REFUSAL — ${message}\n`);
  process.exit(code);
}

/** The unit doc's own facts, through the shapes' one readers. */
export function unitFacts(doc) {
  const phases = parseUnitDocPhases(doc).phases;
  return {
    phases: phases.map((phase) => phase.number),
    planned: phases.length > 0,
    tier: recordedTier(doc),
  };
}

/** The scope the frontmatter records, or the triage derivation's own fallback. */
function scopeOf(doc) {
  const front = /^---\n([\s\S]*?)\n---/u.exec(String(doc));
  if (front === null) return "standard";
  const line = /^scope:[ \t]*(\S+)[ \t]*$/mu.exec(front[1]);
  return line === null ? "standard" : line[1];
}

/** The lane's planning invocation for a unit's kind. */
function laneCommand(unit) {
  return unit.kind === "fix" ? `/unit-lane --fix ${unit.number}` : `/unit-lane ${unit.slug}`;
}

/** The unit's state pointers, plus the handed step's own reference when it exists. */
function readSetFor(unitDir, step) {
  const base = ["SPEC.md", "decisions.md", "planning-obligations.md", "planning-evidence.md"];
  const root = projectRoot();
  const paths = base.map((name) => `${unitDir}/${name}`).filter((relative) => fs.existsSync(path.join(root, relative)));
  const reference = STEP_REFERENCES[step]?.reference;
  if (reference !== undefined && fs.existsSync(path.join(root, reference))) paths.push(reference);
  return [...new Set(paths)].sort();
}

/** Deterministic fingerprint over the exact inputs the answer used. */
function fingerprint(record) {
  return createHash("sha256").update(JSON.stringify(record)).digest("hex");
}

/**
 * The decision one run makes: the step, its command, the stop rule the run
 * applies and the session the recorded verdict composes.
 *
 * @param {{triage: object, route: object|null, unit: object, facts: object, scope: string, relay: string|null, stopAfter: string|null, yes: boolean, retriage: boolean}} input
 */
export function decideFlow(input) {
  const session = composeSession({ tier: input.facts.tier, scope: input.scope, relay: input.relay });
  if (!input.facts.planned || input.retriage) {
    // The planning steps run as one lane invocation; nothing stops here because
    // the stop is a *post-plan* rule.
    const step = PLANNING_STEPS.find((candidate) => input.triage.steps.includes(candidate)) ?? "plan";
    return { step, command: laneCommand(input.unit), stop: { stop: false, rule: null, kind: null }, session, route: "plan" };
  }
  const stop = decideStop({ planned: true, tier: input.facts.tier, stopAfter: input.stopAfter, yes: input.yes });
  if (stop.stop) return { step: "halt", command: "", stop, session, route: input.route.route };
  if (input.route.route === "decision") {
    return { step: "halt", command: input.route.command, stop: { stop: true, rule: "decision-required", kind: "decision-required" }, session, route: "decision" };
  }
  return { step: ROUTE_STEPS[input.route.route] ?? "implement", command: input.route.command, stop, session, route: input.route.route };
}

/** The `Tiers:` line: the catalog's own tiers for the steps that remain. */
function tiersAfter(triage, step) {
  const at = triage.steps.indexOf(step);
  const remaining = at === -1 ? triage.steps : triage.steps.slice(at);
  return remaining.map((name) => `${name}: ${triage.tiers[name]}`).join(", ");
}

/** The approval block — exactly the fields `flow-approval@1` declares. */
export function approvalLines(record) {
  const phases = record.facts.phases;
  const after = record.triage.steps.slice(record.triage.steps.indexOf("plan") + 1);
  return [
    `APPROVAL — ${record.unit.slug}`,
    `unit: ${record.unit.slug}`,
    `plan: ${phases.length} phases — ${phases.map((number) => `P${number}`).join(", ")}`,
    `tiers: ${tiersAfter(record.triage, "implement")}`,
    `unlocks: ${after.length === 0 ? "none" : after.join(", ")}`,
    `tier: ${record.facts.tier ?? "unset"}`,
    `session: ${record.session}`,
    `continue: /flow ${record.unit.slug}`,
  ];
}

/** The block `record` renders, in its declared field order. */
export function renderFlow(record) {
  const receipt = [
    `route=${record.route}`,
    `step=${record.step}`,
    `tier=${record.triage.tiers[record.step] ?? "n/a"}`,
    `continuation=/flow ${record.unit.slug}`,
  ].join(" · ");
  const skipped = record.triage.skipped.length === 0
    ? "none"
    : record.triage.skipped.map((entry) => `${entry.step}: ${entry.reason}`).join(", ");
  return [
    `FLOW — ${record.unit.slug}`,
    `unit: ${record.unit.slug}`,
    `unit-type: ${record.triage.type}`,
    `scope: ${record.scope}`,
    `tier: ${record.facts.tier ?? "unset"}`,
    `planned: ${record.facts.planned ? "yes" : "no"}`,
    `steps: ${record.triage.steps.join(", ")}`,
    `skipped: ${skipped}`,
    ...(record.triage.fused === null || record.triage.fused === undefined ? [] : [`fused: ${record.triage.fused.steps.join(" + ")} (activity-fusion@1)`]),
    `retriage: ${record.retriage ? "yes" : "no"}`,
    `stop-after: ${record.stopAfter ?? "none"}`,
    `stop: ${record.stop.stop ? `${record.stop.kind} (rule: ${record.stop.rule})` : "none"}`,
    `next-step: ${record.stop.stop ? "halt" : record.step}`,
    `next: ${record.stop.stop && record.command === "" ? `/flow ${record.unit.slug}` : record.command}`,
    `session: ${record.session}`,
    `read-set (${record.readSet.length}):`,
    ...(record.readSet.length === 0 ? ["  (none)"] : record.readSet.map((entry) => `  ${entry}`)),
    `receipt: ${receipt}`,
    `fingerprint: ${record.fingerprint}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// The two writes — both asked for by name, both shaped by an existing grammar
// ---------------------------------------------------------------------------

/**
 * The `--yes` human-owner row, appended to a `decisions.md` table. Pure so the
 * shape is testable without a tree: the caller hands the file's bytes (or
 * `null` for a unit that has no ledger yet) and gets the next bytes.
 */
export function withYesRow(text, { tier, date }) {
  const table = [
    "| id | decision | scope | ground |",
    "|---|---|---|---|",
  ].join("\n");
  const header = [
    "# decisions",
    "",
    "Each row is a decision this unit's plan rests on (`decision-scope@1`).",
    "",
    table,
  ].join("\n");
  const current = text === null ? header : text;
  const rows = current.split("\n").filter((line) => /^\|\s*D\d+\s*\|/u.test(line));
  const next = rows.reduce((highest, line) => Math.max(highest, Number(/^\|\s*D(\d+)\s*\|/u.exec(line)[1])), 0) + 1;
  const row = `| D${next} | **\`--yes\` override** — the operator typed \`--yes\`, so no post-plan stop fires for this unit (the \`tier-high\` rule is overridden; tier \`${tier ?? "unset"}\`). | unit-only | S5; the owner typed \`--yes\` on ${date} (human-owner) |`;
  const lines = current.split("\n");
  let last = -1;
  for (let index = 0; index < lines.length; index += 1) if (/^\|/u.test(lines[index])) last = index;
  if (last === -1) return `${current.replace(/\s+$/u, "")}\n\n${table}\n${row}\n`;
  lines.splice(last + 1, 0, row);
  return lines.join("\n");
}

/** Append the composition as one `D` log line — `log-kind@1`'s decision kind. */
function recordComposition(dir, session, verdict) {
  const specPath = path.join(projectRoot(), dir, "SPEC.md");
  const text = fs.readFileSync(specPath, "utf8");
  if (sectionText(text, "Log") === null) fail(2, `cannot record the session mode: ${dir}/SPEC.md has no ## Log section`);
  const line = `session composition: ${session} — derived from tier ${verdict.tier ?? "unset"} · size ${verdict.scope} (flow-session-modes@1; authority: flow driver)`;
  fs.writeFileSync(specPath, appendLogLine(text, "D", line, today()));
}

function writeYesRow(dir, slug, tier) {
  const ledger = path.join(projectRoot(), dir, "decisions.md");
  const text = fs.existsSync(ledger) ? fs.readFileSync(ledger, "utf8") : null;
  fs.writeFileSync(ledger, withYesRow(text, { tier, date: today() }));
  process.stderr.write(`FLOW — --yes recorded in ${dir}/decisions.md for ${slug}\n`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE_LINE = "usage: agentic-workflow flow <unit> [--stop-after <step>] [--yes] [--retriage] [--record] [--json]";

/** Parse the driver's own flags: one unit token, and nothing invented. */
function parseArgs(args) {
  const flags = { unit: null, stopAfter: null, yes: false, retriage: false, record: false, json: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      if (flags.unit !== null) fail(1, USAGE_LINE);
      flags.unit = arg;
      continue;
    }
    switch (arg) {
      case "--yes":
        flags.yes = true;
        break;
      case "--retriage":
        flags.retriage = true;
        break;
      case "--record":
        flags.record = true;
        break;
      case "--json":
        flags.json = true;
        break;
      case "--stop-after": {
        const value = args[index + 1];
        if (value === undefined || value.startsWith("--")) fail(1, "--stop-after needs a step name");
        flags.stopAfter = value;
        index += 1;
        break;
      }
      default:
        fail(1, `unknown flag: ${arg}`);
    }
  }
  return flags;
}

export function run(args) {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    process.stdout.write(USAGE);
    return;
  }
  const flags = parseArgs(args.filter((arg) => arg !== ""));
  if (flags.unit === null) fail(1, USAGE_LINE);

  const catalog = loadCatalog();
  if (flags.stopAfter !== null && !catalog.steps.includes(flags.stopAfter)) {
    fail(2, `unknown step '${flags.stopAfter}' (one of ${catalog.steps.join(", ")})`);
  }

  const resolved = resolveUnit(flags.unit);
  if (resolved.matches.length === 0) fail(1, `unknown unit: ${resolved.clean}`);
  if (resolved.matches.length > 1) fail(2, `ambiguous unit: ${resolved.clean} matches ${resolved.matches.map((entry) => entry.dir).join(", ")}`);
  const unit = resolved.matches[0];
  const specPath = path.join(projectRoot(), unit.dir, "SPEC.md");
  let doc;
  try {
    doc = fs.readFileSync(specPath, "utf8");
  } catch {
    fail(2, `unit doc not found: ${unit.dir}/SPEC.md`);
  }

  const facts = unitFacts(doc);
  const scope = scopeOf(doc);
  // The router's two answers, through their own owners: the closed catalog's
  // step list and — only once a unit is planned — the route it takes now. An
  // unplanned unit's route is the lane's, and the router refuses to answer an
  // execute hand-off for a unit with no parseable phase by design.
  const triage = runTriage(flags.unit, { json: true });
  const relay = relayAnswer(unit.dir, unit.slug, { catalog, phases: facts.phases.length });
  const route = facts.planned && !flags.retriage ? computeRoute(flags.unit) : { route: "plan", command: laneCommand(unit) };
  const decision = decideFlow({
    triage,
    route,
    unit,
    facts,
    scope,
    relay: relay.kind,
    stopAfter: flags.stopAfter,
    yes: flags.yes,
    retriage: flags.retriage,
  });
  const record = {
    ...decision,
    unit,
    triage,
    facts,
    scope,
    retriage: flags.retriage,
    stopAfter: flags.stopAfter,
    readSet: readSetFor(unit.dir, decision.step),
  };
  record.fingerprint = fingerprint({
    unit: unit.slug,
    step: record.step,
    command: record.command,
    route: record.route,
    stop: record.stop,
    session: record.session,
    readSet: record.readSet,
  });

  if (flags.yes) writeYesRow(unit.dir, unit.slug, facts.tier);
  if (flags.record) recordComposition(unit.dir, decision.session, { tier: facts.tier, scope });

  if (flags.json) {
    process.stdout.write(`${JSON.stringify({
      contract: FLOW_CONTRACT_ID,
      unit: unit.slug,
      unitType: triage.type,
      scope,
      tier: facts.tier,
      planned: facts.planned,
      steps: triage.steps,
      skipped: triage.skipped,
      retriage: flags.retriage,
      stopAfter: flags.stopAfter,
      stop: record.stop,
      nextStep: record.stop.stop ? "halt" : record.step,
      next: record.stop.stop && record.command === "" ? `/flow ${unit.slug}` : record.command,
      session: record.session,
      readSet: record.readSet,
      fingerprint: record.fingerprint,
    })}\n`);
    return;
  }

  process.stdout.write(`${renderFlow(record)}\n`);
  if (record.stop.stop) process.stdout.write(`\n${approvalLines(record).join("\n")}\n`);
}
