#!/usr/bin/env node
/**
 * agentic-workflow — CLI router for agentic-workflow typed file services.
 *
 * Usage:
 *   agentic-workflow unit-doc <NN-slug> [--dir <root>] <op> [args...]
 *   agentic-workflow roadmap <op> [args...]
 *   agentic-workflow changelog <op> [args...]
 *   agentic-workflow budgets <op> [args...]
 *   agentic-workflow manifest <op> [args...]
 *   agentic-workflow doc (--sync | --query <term> | --status | --rebuild) [--json-only]
 *
 * --json prints the operation receipt as JSON.
 * Every operation prints a fixed receipt block to stdout.
 *
 * Refusals exit 2 with "EDIT REFUSAL — <reason>" before writing anything.
 */

import { readFileSync } from "node:fs";
import { join, resolve, basename } from "node:path";

// Import SDK modules
import { create, setSection, evidence_addRow, progress_logEntry, validate } from "../src/edit/UnitDoc.mjs";
import { rowUpsert, annotate as roadmapAnnotate } from "../src/edit/Roadmap.mjs";
import { rowAdd } from "../src/edit/Changelog.mjs";
import { ceilingRebase } from "../src/edit/Budgets.mjs";
import { skillAdd, skillRemove } from "../src/edit/Manifest.mjs";
import { parseDocArgs } from "../src/doc/grammar.mjs";
import { runDocOp } from "../src/doc/retrieval.mjs";

// ── Helpers ──────────────────────────────────────────────────────────────

function printReceipt(receipt) {
  console.log("");
  console.log(`EDIT ${receipt.service}.${receipt.op} — ${receipt.path}`);
  console.log(`Schema: ${receipt.schema} · Receipt: ${receipt.ok ? "pass" : "fail"}`);
  console.log(`Before: ${receipt.before} · After: ${receipt.after}`);
}

function parseArgs(args) {
  const result = {};
  const positions = [];
  let i = 0;
  while (i < args.length) {
    if (args[i] === "--json") {
      result.json = true;
      i++;
    } else if (args[i] === "--dir") {
      result.dir = args[i + 1];
      i += 2;
    } else {
      positions.push(args[i]);
      i++;
    }
  }
  result.args = positions;
  return result;
}

function refuse(reason) {
  process.stderr.write(`EDIT REFUSAL — ${reason}\n`);
  process.exit(2);
}

// ── Router ───────────────────────────────────────────────────────────────

const command = process.argv[2];
if (!command) {
  console.error("usage: agentic-workflow <unit-doc|roadmap|changelog|budgets|manifest|doc> ...");
  process.exit(1);
}

const restArgs = process.argv.slice(3);
const parsed = parseArgs(restArgs);
const rawArgs = parsed.args;

switch (command) {
  // ── doc — retrieval entry point (unit 65, D2) ────────────────────────
  case "doc": {
    let grammar;
    try {
      grammar = parseDocArgs(restArgs);
    } catch (e) {
      process.stderr.write(`doc: ${e.message}\n`);
      process.exit(1);
    }
    let envelope;
    try {
      envelope = await runDocOp(grammar, { rootDir: process.cwd() });
    } catch (e) {
      // IO/store failures are usage/IO territory (exit 1, D3); the message
      // goes to stderr and stdout stays empty.
      process.stderr.write(`doc: ${e.message}\n`);
      process.exit(1);
    }
    if (grammar.jsonOnly) {
      // AC8: exactly one JSON document on stdout; diagnostics on stderr.
      process.stdout.write(JSON.stringify(envelope) + "\n");
    } else if (grammar.quiet) {
      // AC23's hook spelling: --sync --quiet writes nothing on success;
      // diagnostics stay on stderr. Exit code still reports failure.
      if (envelope.ok !== true) process.stderr.write(`doc ${envelope.command}: failed\n`);
    } else {
      for (const d of envelope.degradations) process.stderr.write(`doc: degradation: ${d}\n`);
      for (const r of envelope.results) {
        console.log(`${r.path} · ${r.section ?? "-"} · L${r.lines[0]}-${r.lines[1]} · ${r.score}`);
      }
      if (envelope.store?.lastSync) {
        const s = envelope.store.lastSync;
        console.log(`doc sync: files_scanned=${s.files_scanned} files_changed=${s.files_changed} files_deleted=${s.files_deleted} chunks=${envelope.store.chunks}`);
      }
      console.log(`doc ${envelope.command}: ${envelope.results.length} result(s)`);
    }
    break;
  }

  // ── unit-doc ─────────────────────────────────────────────────────────
  case "unit-doc": {
    const slug = rawArgs[0];
    const op = rawArgs[1];
    if (!slug || !op) refuse("unit-doc requires <slug> <operation> [args...]");

    const rootDir = parsed.dir ? resolve(parsed.dir) : process.cwd();
    const unitDir = join(rootDir, "docs", "features", slug);

    if (op === "create") {
      try {
        const receipt = create(unitDir, slug);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (op === "setSection") {
      if (rawArgs.length < 4) refuse("setSection requires <slug> <section> <body_file|body>");
      const section = rawArgs[2];
      let body;
      try {
        body = readFileSync(rawArgs[3], "utf8");
      } catch {
        body = rawArgs[3];
      }
      try {
        const receipt = setSection(join(unitDir, "SPEC.md"), section, body);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (op === "evidence") {
      try {
        const body = rawArgs[2] ? JSON.parse(rawArgs[2]) : {};
        const receipt = evidence_addRow(join(unitDir, "SPEC.md"), body);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (op === "progress") {
      try {
        const body = rawArgs[2] ? JSON.parse(rawArgs[2]) : {};
        const receipt = progress_logEntry(join(unitDir, "SPEC.md"), body);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (op === "validate") {
      try {
        const content = readFileSync(join(unitDir, "SPEC.md"), "utf8");
        const result = validate(content);
        if (parsed.json) console.log(JSON.stringify(result, null, 2));
        else console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        refuse(e.message);
      }
    } else {
      refuse(`Unknown unit-doc operation: ${op}`);
    }
    break;
  }

  // ── roadmap ──────────────────────────────────────────────────────────
  case "roadmap": {
    const filePath = rawArgs[0] ? resolve(rawArgs[0]) : join(process.cwd(), "ROADMAP.md");

    if (rawArgs[0] === "rowUpsert" || (rawArgs[0] && rawArgs[1] === "rowUpsert")) {
      // Skip file path if it's the first positional
      const data = rawArgs[1] === "rowUpsert" ? (rawArgs[2] ? JSON.parse(rawArgs[2]) : {}) : JSON.parse(rawArgs[1] || "{}");
      try {
        const receipt = rowUpsert(filePath, data);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (rawArgs[0] === "annotate" || (rawArgs[0] && rawArgs[1] === "annotate")) {
      const nn = rawArgs[1] === "annotate" ? rawArgs[2] : rawArgs[1];
      const note = rawArgs[1] === "annotate" ? rawArgs[3] || "" : (rawArgs[2] || "");
      try {
        const receipt = roadmapAnnotate(filePath, nn, note);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else {
      refuse(`Unknown roadmap operation`);
    }
    break;
  }

  // ── changelog ────────────────────────────────────────────────────────
  case "changelog": {
    const filePath = rawArgs[0] ? resolve(rawArgs[0]) : join(process.cwd(), "CHANGELOG.md");
    const data = rawArgs[1] ? JSON.parse(rawArgs[1]) : {};

    try {
      // Format: changelog <data_json> — sectionName inferred from data or first arg
      const sectionName = data.section || data.skill || rawArgs[1] ? "default" : "default";
      const receipt = rowAdd(filePath, sectionName, data);
      if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
      printReceipt(receipt);
    } catch (e) {
      refuse(e.message);
    }
    break;
  }

  // ── budgets ──────────────────────────────────────────────────────────
  case "budgets": {
    const filePath = rawArgs[0] ? resolve(rawArgs[0]) : join(process.cwd(), "budgets.json");
    const data = rawArgs[1] ? JSON.parse(rawArgs[1]) : {};
    const { version, date, type, what, section, skill } = {};

    try {
      const receipt = ceilingRebase(filePath, data.route, data.estimateMax, data.linesMax, data.growthSource);
      if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
      printReceipt(receipt);
      if (!receipt.ok) refuse("Ceiling shrinkage without growth source");
    } catch (e) {
      refuse(e.message);
    }
    break;
  }

  // ── manifest ─────────────────────────────────────────────────────────
  case "manifest": {
    const pluginJson = rawArgs[0] ? resolve(rawArgs[0]) : join(process.cwd(), ".claude-plugin", "plugin.json");
    const op = rawArgs[1] || "";

    if (op === "skillAdd") {
      const skillName = rawArgs[2] || "";
      const meta = rawArgs[3] ? JSON.parse(rawArgs[3]) : {};
      try {
        const receipt = skillAdd(pluginJson, skillName, meta);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (op === "skillRemove") {
      const skillName = rawArgs[2] || "";
      try {
        const receipt = skillRemove(pluginJson, skillName);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else {
      refuse(`Unknown manifest operation: ${op}`);
    }
    break;
  }

  default:
    refuse(`Unknown service: ${command}`);
}