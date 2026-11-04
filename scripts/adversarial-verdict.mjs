#!/usr/bin/env node
/**
 * adversarial-verdict.mjs — the conductor's one added step for a
 * `review-change --adversarial N` pass (issue #358).
 *
 * The pass stops enumerating and starts verifying. Every candidate it receives
 * is arbitrated with the kill mandate (`kill | confirm` plus falsifying or
 * supporting evidence), a finding the pass raises itself must carry its own
 * falsifying evidence from cycle 1, a diff-only reflector returns
 * `keep | drop` with a reason, and a reproducer that also fires on untouched
 * adjacent code is a misattribution to be re-scoped before it persists. This
 * checker is what makes those sentences executable: it reads the pass's record
 * and the reviewed diff, refuses every row that breaks the contract, and prints
 * the rows that may persist.
 *
 * Why a script and not prose: the verdicts are grammar, and a mode whose whole
 * purpose is precision cannot be audited by trusting the report. The three
 * closed sets are read from the published schema package, so a token this
 * repository does not export can never be accepted here.
 *
 * Usage
 *   bun scripts/adversarial-verdict.mjs --record <record.json> --diff <diff.patch>
 *   (node fallback, same argv)
 *
 * `--diff` is required: a record with no diff cannot be grounded, and grounding
 * is the reflector's entire answer. The diff is a unified diff of the pass's
 * reviewed range (`git diff <base>..<head>`).
 *
 * stdout: one fixed, byte-stable block — a `adversarial-verdict —` header, the
 * seven-column matrix in record order, one `VIOLATION <code> <id> — <message>`
 * line per refusal, the tally, then `verdict`.
 * exit: 0 when the verdict is `PASS`; 1 when it is `FAIL`; 2 on a usage error
 * (an unknown flag, a missing flag value, or an unreadable record/diff).
 *
 * Read-only: it writes nothing, calls no network, and holds no state between
 * runs. Its sibling suite is `scripts/adversarial-verdict.test.mjs`, and its
 * contract is the `adversarial-verdict@1` block owned by
 * `skills/review-change/references/ADVERSARIAL_SETUP.md`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { loadSchemaRuntime } from "./schema-runtime.mjs";

const CONTRACT = "adversarial-verdict@1";

const runtime = await loadSchemaRuntime();
const VERDICTS = runtime.ADVERSARIAL_VERDICTS;
const REFLECTOR_VERDICTS = runtime.ADVERSARIAL_REFLECTOR_VERDICTS;
const STABILITY_VERDICTS = runtime.ADVERSARIAL_STABILITY_VERDICTS;

/** The record's own two-valued origin: a finder raised it, or the pass did. */
const ORIGINS = ["finder", "new"];

/** Fields the reflector may never be handed: the point is that it sees the diff. */
const REFLECTOR_FIELDS = ["verdict", "reason"];
const TRANSCRIPT_LIKE = ["transcript", "tool_notes", "tool_calls", "history", "exploration", "notes"];

const HEAD = /^[0-9a-f]{40}$/;
const LOCATION = /^[^:\s]+:\d+$/;

const usage = (message) => {
  process.stderr.write(`adversarial-verdict: ${message}\n`);
  process.stderr.write("usage: bun scripts/adversarial-verdict.mjs --record <record.json> --diff <diff.patch>  (node fallback, same argv)\n");
  process.exit(2);
};

/**
 * The added line numbers of every file in a unified diff, keyed by the new path.
 * The walk reads each hunk's declared extents (the counts in the `@@ -a,b +c,d
 * @@` header) to know where its content ends, and a `+` line inside that range
 * is a changed line, a context line is not, and the reflected claim is grounded
 * on the former only. Header detection runs only outside a hunk, so a content
 * line whose own text starts with `+++ ` or `--- ` can never be mistaken for a
 * file header mid-hunk.
 */
export function changedLines(diffText) {
  const changed = new Map();
  let file = null;
  let newLine = 0;
  let oldLeft = 0;
  let newLeft = 0;
  for (const line of diffText.split("\n")) {
    if (oldLeft > 0 || newLeft > 0) {
      // Inside a hunk: every line here is content, whatever its prefix — except
      // a bare `@@` line, which is the next hunk's header (a content line that
      // looks like one always carries its own `+`/`-`/space prefix first).
      const next = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
      if (next) {
        oldLeft = Number(next[2] ?? 1);
        newLeft = Number(next[4] ?? 1);
        newLine = Number(next[3]);
        continue;
      }
      if (line.startsWith("\\")) continue; // "\ No newline…" carries no line.
      if (line.startsWith("+")) {
        if (file) changed.get(file).add(newLine);
        newLine += 1;
        newLeft -= 1;
      } else if (line.startsWith("-")) {
        oldLeft -= 1;
      } else if (line.startsWith(" ")) {
        newLine += 1;
        oldLeft -= 1;
        newLeft -= 1;
      } else {
        // A blank line is the hunk's end (or a malformed diff): stop counting
        // and fall back to header detection. Fail-closed either way.
        oldLeft = 0;
        newLeft = 0;
      }
      continue;
    }
    if (line.startsWith("+++ ")) {
      const target = line.slice(4).trim();
      file = target === "/dev/null" ? null : target.replace(/^b\//, "");
      if (file && !changed.has(file)) changed.set(file, new Set());
      continue;
    }
    if (line.startsWith("--- ")) continue;
    const hunk = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (hunk) {
      oldLeft = Number(hunk[2] ?? 1);
      newLeft = Number(hunk[4] ?? 1);
      newLine = Number(hunk[3]);
      continue;
    }
    // "diff --git", "index …", mode and rename lines — none carries a line.
  }
  return changed;
}

/** One refusal shape for every fault, so the report reads the same in each case. */
const refuse = (code, id, message) => ({ code, id, message });

/**
 * Validate a pass record against the diff it reviewed.
 * Pure: the same (record, diff) always yields the same result.
 */
export function validateRecord(record, diffText) {
  const violations = [];
  const changed = changedLines(diffText);
  const findings = [];

  if (!record || typeof record !== "object") {
    return { record: record ?? null, contract: null, head: null, cycle: null, findings, violations: [refuse("empty-record", "-", "the record is not an object")], persist: [], killed: 0, dropped: 0, verdict: "FAIL" };
  }
  if (record.contract !== CONTRACT) {
    violations.push(refuse("unknown-contract", "-", `the record declares ${JSON.stringify(record.contract)} where this checker reads ${CONTRACT}`));
  }
  if (!HEAD.test(String(record.head ?? ""))) {
    violations.push(refuse("invalid-head", "-", `the record's head ${JSON.stringify(record.head)} is not the reviewed 40-hex commit`));
  }
  const rows = Array.isArray(record.findings) ? record.findings : [];
  if (rows.length === 0) {
    violations.push(refuse("empty-record", "-", "the record carries no finding, so the pass verified nothing"));
  }

  for (const [index, row] of rows.entries()) {
    const id = String(row?.id ?? `#${index + 1}`);
    const file = String(row?.file ?? "");
    const line = Number(row?.line ?? 0);
    const claim = `${file}:${line}`;
    const origin = String(row?.origin ?? "");
    const verdict = String(row?.verdict ?? "");
    const evidenceKind = String(row?.evidence_kind ?? "");
    const evidence = String(row?.evidence ?? "").trim();
    const stability = String(row?.stability ?? "");
    const scope = String(row?.scope ?? "");
    const reflector = row?.reflector && typeof row.reflector === "object" ? row.reflector : {};

    if (!LOCATION.test(claim)) {
      violations.push(refuse("malformed-claim", id, `${JSON.stringify(claim)} is not a <file>:<line> location`));
    }
    if (!ORIGINS.includes(origin)) {
      violations.push(refuse("unknown-origin", id, `origin ${JSON.stringify(origin)} is neither finder nor new`));
    }
    if (!VERDICTS.includes(verdict)) {
      violations.push(refuse("unknown-verdict", id, `verdict ${JSON.stringify(verdict)} is not one of ${VERDICTS.join(", ")}`));
    }
    if (evidence === "") {
      violations.push(refuse("missing-evidence", id, "a verdict with no evidence is an opinion, not an arbitration"));
    }
    // What the evidence must *be*: a kill is a disproof attempt, so its evidence
    // is falsifying; a finder's confirm is a disproof attempt that failed, so its
    // evidence is supporting; a finding the pass raised itself has no finder
    // behind it and must bring its own failing reproducer, from cycle 1 on (S1).
    if (VERDICTS.includes(verdict) && evidence !== "") {
      if (verdict === "kill" && evidenceKind !== "falsifying") {
        violations.push(refuse("wrong-evidence-kind", id, `a kill needs falsifying evidence, and ${JSON.stringify(evidenceKind)} is not`));
      }
      if (verdict === "confirm" && origin === "finder" && evidenceKind !== "supporting") {
        violations.push(refuse("wrong-evidence-kind", id, `a finder's confirm needs the supporting evidence its failed disproof produced, and ${JSON.stringify(evidenceKind)} is not`));
      }
      if (origin === "new" && evidenceKind !== "falsifying") {
        violations.push(refuse("new-finding-needs-falsifying-evidence", id,
          `a finding the pass raised itself needs its own falsifying evidence in every cycle, and ${JSON.stringify(evidenceKind)} is not that`));
      }
    }
    if (!STABILITY_VERDICTS.includes(stability)) {
      violations.push(refuse("unknown-stability", id, `stability ${JSON.stringify(stability)} is not one of ${STABILITY_VERDICTS.join(", ")}`));
    }

    // The stability check (S3): an unstable reproducer is a misattribution, so it
    // is re-scoped before it persists — `as-reported` at that point is the defect.
    let persistedAt = claim;
    if (stability === "unstable") {
      const target = scope.startsWith("rescoped:") ? scope.slice("rescoped:".length) : null;
      if (scope === "as-reported" || scope === "") {
        violations.push(refuse("unstable-not-rescoped", id,
          "the reproducer also fires on untouched adjacent code, so the finding is a misattribution and cannot persist as-reported"));
      } else if (target === null || !LOCATION.test(target)) {
        violations.push(refuse("malformed-rescope", id, `scope ${JSON.stringify(scope)} is not rescoped:<file>:<line>`));
      } else {
        persistedAt = target;
      }
    } else if (scope !== "as-reported") {
      violations.push(refuse("malformed-scope", id, `a stable finding has no re-scope, and scope ${JSON.stringify(scope)} claims one`));
    }

    // The reflector (S2): diff-only input, a closed verdict, and a reason.
    const reflectorVerdict = String(reflector.verdict ?? "");
    const leaked = Object.keys(reflector).filter((key) => !REFLECTOR_FIELDS.includes(key));
    const transcript = leaked.filter((key) => TRANSCRIPT_LIKE.includes(key));
    if (transcript.length > 0) {
      violations.push(refuse("reflector-not-diff-only", id,
        `the reflector is handed a tool transcript (${transcript.join(", ")}); it sees the diff and the claim only`));
    } else if (leaked.length > 0) {
      violations.push(refuse("reflector-not-diff-only", id,
        `the reflector is handed ${leaked.join(", ")}, which is not part of the diff or the claim`));
    }
    if (!REFLECTOR_VERDICTS.includes(reflectorVerdict)) {
      violations.push(refuse("unknown-reflector-verdict", id,
        `reflector verdict ${JSON.stringify(reflectorVerdict)} is not one of ${REFLECTOR_VERDICTS.join(", ")}`));
    } else if (String(reflector.reason ?? "").trim() === "") {
      violations.push(refuse("reflector-needs-reason", id, "a reflector verdict with no reason is an unexplained drop"));
    }
    const grounded = changed.get(file)?.has(line) ?? false;
    if (reflectorVerdict === "keep" && LOCATION.test(claim) && !grounded) {
      violations.push(refuse("ungrounded-keep", id,
        `no hunk of this diff changes ${claim}, so the reflector cannot ground the claim and must drop it`));
    }

    let destination;
    if (verdict === "kill") destination = "killed";
    else if (reflectorVerdict === "drop") destination = "dropped";
    else if (!grounded || violations.some((v) => v.id === id)) destination = `refused ${claim}`;
    else destination = `persist ${persistedAt}`;

    findings.push({
      id, file, line, claim, axis: String(row?.axis ?? ""), origin, verdict, evidenceKind,
      stability, scope, reflector: reflectorVerdict, persistedAt, destination,
    });
  }

  const persist = findings.filter((finding) => finding.destination.startsWith("persist "));
  return {
    record,
    contract: record.contract ?? null,
    head: record.head ?? null,
    cycle: record.cycle ?? null,
    findings,
    violations,
    persist,
    killed: findings.filter((finding) => finding.destination === "killed").length,
    dropped: findings.filter((finding) => finding.destination === "dropped").length,
    verdict: violations.length === 0 ? "PASS" : "FAIL",
  };
}

/** The fixed output block. Byte-stable for the same record and diff. */
export function formatReport(result) {
  const lines = [];
  lines.push(`adversarial-verdict — ${result.findings.length} finding(s) · cycle ${result.cycle} · head ${result.head}`);
  lines.push("| id | claim | verdict | evidence | stability | reflector | destination |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const finding of result.findings) {
    const stability = finding.stability === "unstable" && finding.persistedAt !== finding.claim
      ? `unstable → ${finding.persistedAt}`
      : finding.stability;
    lines.push(`| ${finding.id} | ${finding.claim} | ${finding.verdict} | ${finding.evidenceKind} | ${stability} | ${finding.reflector} | ${finding.destination} |`);
  }
  for (const violation of result.violations) {
    lines.push(`VIOLATION ${violation.code} ${violation.id} — ${violation.message}`);
  }
  lines.push(`tally: ${result.persist.length} persist · ${result.killed} killed · ${result.dropped} dropped · ${result.violations.length} violation(s)`);
  lines.push(`verdict: ${result.verdict}`);
  return `${lines.join("\n")}\n`;
}

/* ------------------------------------------------------------------------ CLI */

function main(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg !== "--record" && arg !== "--diff") usage(`unknown argument ${arg}`);
    const value = argv[index + 1];
    if (value === undefined) usage(`${arg} needs a file`);
    flags[arg.slice(2)] = value;
    index += 1;
  }
  if (!flags.record) usage("--record is required");
  if (!flags.diff) usage("--diff is required: a record with no diff cannot be grounded");

  const read = (flag, file) => {
    const resolved = path.resolve(file);
    if (!fs.existsSync(resolved)) usage(`${flag} ${file} does not exist`);
    return fs.readFileSync(resolved, "utf8");
  };
  const recordText = read("--record", flags.record);
  const diffText = read("--diff", flags.diff);
  let record;
  try {
    record = JSON.parse(recordText);
  } catch (error) {
    usage(`--record ${flags.record} is not JSON (${error.message})`);
  }

  const result = validateRecord(record, diffText);
  process.stdout.write(formatReport(result));
  process.exit(result.verdict === "PASS" ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main(process.argv.slice(2));
