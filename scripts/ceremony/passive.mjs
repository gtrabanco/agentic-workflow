#!/usr/bin/env node
/**
 * passive.mjs — the passive carrier's only writer (issue #384, unit `360c`).
 *
 * `docs/passive/<id>.md` is a passive unit's whole record: no unit doc, no
 * phases, no evidence table. Its grammar is `passive-record@1`, owned by
 * `skills/execute-phase/references/risk-tiers.md`; this module is the **only
 * writer** (owner decision `D360-5`, and this unit's `D3`), which is what keeps
 * two passive units from colliding: the id is the file name, and a second `add`
 * on a taken id is a ceremonial block that writes nothing.
 *
 * Three subcommands, one closed world:
 *   add  --id <id> --paths a,b --readback <text> --gate <command> --gate-exit <n>
 *   read --id <id>
 *   list
 *
 * `add` classifies its own `--paths` and records the **computed** tier. There is
 * no `--tier` flag: a scope the classifier does not call `passive` is refused
 * (exit 2, `route: standard-ceremony`) rather than patched into passivity, which
 * is the one refusal this carrier owns — no other command in the project refuses
 * to run because of a tier (S4, S5, S9; see `decisions.md` D3).
 *
 * Exit contract (unchanged from #338): 0 success, 1 usage error, 2 ceremonial
 * block. JSON on stdout, always. Deterministic: the record carries no clock.
 */

import fs from "node:fs";
import path from "node:path";
import { out, fail, block, onlyFlags, parseFlags, readRepoFile } from "./lib.mjs";
import { classifyTier } from "../risk-tiers.mjs";

/** The grammar this module writes and reads. */
export const PASSIVE_CONTRACT_ID = "passive-record@1";

/** Where a passive unit's record lives, repo-relative. */
export const CARRIER_ROOT = "docs/passive";

/** `<YYYY-MM-DD>-<slug>` — the grammar's own id shape, and the file name. */
const ID_PATTERN = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The five fields, in the grammar's order, with the description each row carries. */
const FIELDS = Object.freeze([
  { name: "id", description: "the passive unit's stable id" },
  { name: "tier", description: "the verdict as the classifier emitted it" },
  { name: "paths", description: "the readback's own scope" },
  { name: "readback", description: "the structural readback: every changed file read and classified" },
  { name: "gate", description: "the deterministic gate that ran beside it" },
]);

/** One cell of the record: no pipe (it would split the row), one line, bounded. */
function cell(value) {
  return String(value).replace(/\|/g, "·").replace(/\s+/g, " ").trim();
}

/** The record's bytes, from the five values — the grammar, rendered once. */
function renderRecord(record) {
  const rows = [
    `id | \`${cell(record.id)}\` | ${FIELDS[0].description}`,
    `tier | ${cell(record.tier)} | ${FIELDS[1].description}`,
    `paths | ${record.paths.map((entry) => `\`${cell(entry)}\``).join(", ")} | ${FIELDS[2].description}`,
    `readback | ${cell(record.readback)} | ${FIELDS[3].description}`,
    `gate | \`${cell(record.gate.command)}\` · exit ${record.gate.exit} | ${FIELDS[4].description}`,
  ];
  return `# ${record.id}\n\n\`\`\`text\n${PASSIVE_CONTRACT_ID}\n${rows.join("\n")}\n\`\`\`\n`;
}

/** Strip the backticks a value cell may carry. */
function valueOf(raw) {
  return String(raw).trim().replace(/^`(.*)`$/u, "$1").trim();
}

/**
 * Parse a record's bytes → `{ record }` or `{ error, field }`. The five fields
 * must appear once each, in the grammar's order, with a tier the vocabulary
 * publishes — a record that disagrees with its own grammar is a ceremonial block,
 * never a silent default.
 */
export function parseRecord(text, expectedId = null) {
  const fenced = /```text\npassive-record@1\n([\s\S]*?)```/.exec(text);
  if (!fenced) return { error: "missing-block", detail: `no fenced ${PASSIVE_CONTRACT_ID} block` };
  const rows = fenced[1].split("\n").filter((line) => line.trim() !== "");
  if (rows.length !== FIELDS.length) return { error: "field-count", detail: `${rows.length} row(s), expected ${FIELDS.length}` };

  const values = {};
  for (const [index, row] of rows.entries()) {
    const cells = row.split("|").map((entry) => entry.trim());
    if (cells.length < 2) return { error: "row-shape", field: FIELDS[index].name, detail: "a row needs a name and a value" };
    if (cells[0] !== FIELDS[index].name) {
      return { error: "field-order", field: FIELDS[index].name, detail: `row ${index + 1} is "${cells[0]}"` };
    }
    values[FIELDS[index].name] = valueOf(cells[1]);
  }

  if (expectedId !== null && values.id !== expectedId) {
    return { error: "id-mismatch", field: "id", detail: `record says "${values.id}", file is "${expectedId}"` };
  }
  if (values.tier !== "passive") return { error: "tier", field: "tier", detail: `a passive carrier records "passive", not "${values.tier}"` };
  if (!ID_PATTERN.test(values.id)) return { error: "invalid-id", field: "id", detail: values.id };

  const paths = values.paths
    .split(",")
    .map((entry) => entry.trim().replace(/^`+|`+$/gu, "").trim())
    .filter(Boolean);
  if (paths.length === 0) return { error: "invalid-path", field: "paths", detail: "the record names no path" };

  const gate = /^(.+?)\s*·\s*exit\s+(\d+)$/u.exec(values.gate);
  if (!gate) return { error: "gate", field: "gate", detail: `expected "<command> · exit <code>", saw "${values.gate}"` };

  return {
    record: {
      id: values.id,
      tier: values.tier,
      paths,
      readback: values.readback,
      gate: { command: cell(gate[1].trim().replace(/^`+|`+$/gu, "")), exit: Number(gate[2]) },
    },
  };
}

/** The record's repo-relative path, from its id. */
const pathOf = (id) => `${CARRIER_ROOT}/${id}.md`;

/** A repo-relative path a record may name: inside the project, no escape. */
function isRepoRelative(entry) {
  const value = String(entry);
  if (value === "" || value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value)) return false;
  if (value.split(/[\\/]/).includes("..")) return false;
  return !value.includes("\\");
}

/** The paths a `--paths` cell names. */
function pathsOf(value) {
  return String(value).split(",").map((entry) => entry.trim()).filter(Boolean);
}

/** `add` — prove the scope is passive, then record it. */
function add(argv, cwd) {
  const flags = parseFlags(argv, ["id", "paths", "readback", "gate", "gate-exit"], ["id", "paths", "readback", "gate", "gate-exit"]);
  onlyFlags(flags, ["id", "paths", "readback", "gate", "gate-exit"]);

  const id = String(flags.id).trim();
  if (!ID_PATTERN.test(id)) fail("invalid-id", { id, expected: "<YYYY-MM-DD>-<slug>" });

  const paths = pathsOf(flags.paths);
  if (paths.length === 0) fail("invalid-path", { paths: [], detail: "at least one repo-relative path is required" });
  const outside = paths.find((entry) => !isRepoRelative(entry));
  if (outside !== undefined) fail("invalid-path", { path: outside, detail: "a record names repo-relative paths only" });

  const readback = String(flags.readback).trim();
  if (readback === "") fail("invalid-flag-value", { flag: "--readback", detail: "a structural readback is required" });

  const command = String(flags.gate).trim();
  if (command === "") fail("invalid-flag-value", { flag: "--gate", detail: "the gate that ran is required" });
  if (!/^\d+$/.test(String(flags["gate-exit"]))) {
    fail("invalid-flag-value", { flag: "--gate-exit", detail: "an exit code is a non-negative integer" });
  }

  const relative = pathOf(id);
  const absolute = path.join(cwd, relative);
  if (fs.existsSync(absolute)) {
    block({ error: "record-exists", id, path: relative, detail: "a passive unit's id is its file name; two units cannot share one" });
  }

  // The tier is computed from the scope's own bytes, never chosen: a change that
  // touches executable content is a standard unit, not a passive one.
  const files = new Map(paths.map((entry) => [entry, readRepoFile(cwd, entry) ?? ""]));
  const verdict = classifyTier(files, { resolve: (entry) => readRepoFile(cwd, entry) });
  if (verdict.tier !== "passive") {
    block({
      error: "not-passive",
      id,
      tier: verdict.tier,
      reason: verdict.reason,
      reason_kind: verdict.reason_kind,
      route: "standard-ceremony",
      detail: "a passive unit that turns out to touch executable content is routed to the standard ceremony, never patched into passivity",
    });
  }

  const record = { id, tier: verdict.tier, paths, readback, gate: { command, exit: Number(flags["gate-exit"]) } };
  fs.mkdirSync(path.join(cwd, CARRIER_ROOT), { recursive: true });
  fs.writeFileSync(absolute, renderRecord(record));
  out({ contract: PASSIVE_CONTRACT_ID, id, path: relative, tier: record.tier, record });
}

/** `read` — one record, parsed from its own bytes. */
function read(argv, cwd) {
  const flags = parseFlags(argv, ["id"], ["id"]);
  onlyFlags(flags, ["id"]);
  const id = String(flags.id).trim();
  const relative = pathOf(id);
  // An id that cannot be a record's name (and anything that escapes the carrier)
  // simply has no record: `read` answers "no such record", never a shape lecture.
  if (!ID_PATTERN.test(id)) fail("unknown-record", { id, path: relative });
  const text = readRepoFile(cwd, relative);
  if (text === null) fail("unknown-record", { id, path: relative });
  const parsed = parseRecord(text, id);
  if (parsed.error) block({ error: "malformed-record", path: relative, cause: parsed.error, ...parsed, error: "malformed-record" });
  out({ contract: PASSIVE_CONTRACT_ID, id, path: relative, record: parsed.record });
}

/** `list` — every record the carrier holds, and whatever does not parse. */
function list(argv, cwd) {
  const flags = parseFlags(argv, []);
  onlyFlags(flags, []);
  const directory = path.join(cwd, CARRIER_ROOT);
  if (!fs.existsSync(directory)) {
    out({ contract: PASSIVE_CONTRACT_ID, records: [], invalid: [] });
  }
  const records = [];
  const invalid = [];
  for (const name of fs.readdirSync(directory).sort()) {
    if (!name.endsWith(".md")) continue;
    const id = name.slice(0, -3);
    const relative = pathOf(id);
    const text = readRepoFile(cwd, relative);
    const parsed = text === null ? { error: "unreadable" } : parseRecord(text, id);
    if (parsed.error) {
      invalid.push({ id, path: relative, error: parsed.error });
      continue;
    }
    records.push({ id, path: relative, tier: parsed.record.tier, paths: parsed.record.paths });
  }
  records.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  out({ contract: PASSIVE_CONTRACT_ID, records, invalid });
}

/** The module's entry: one closed set of subcommands. */
export function passive(op, argv, cwd = process.cwd()) {
  switch (op) {
    case "add": return add(argv, cwd);
    case "read": return read(argv, cwd);
    case "list": return list(argv, cwd);
    default: fail("unknown-subcommand", { op, allowed: ["add", "read", "list"] });
  }
}
