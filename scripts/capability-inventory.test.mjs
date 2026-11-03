#!/usr/bin/env node

/**
 * #333 — the capability-inventory seeding contract.
 *
 * `init-workspace` seeded `docs/CAPABILITIES.md` as the raw template: 13
 * `<yes|no|partial>` cells, one `<role>` row, zero values inferred from the
 * repository, and no question asked about the rows nothing could settle. The
 * defect is not "the values are wrong" — it is that the *procedure* was prose
 * ("propose the state … from what the code actually shows"), so the only
 * mechanical reading of it was to copy the file. This suite pins the procedure
 * and its output, and it is red before the fix lands:
 *
 *   A. the shipped template is exactly the seed the write gate must refuse, and
 *      this repository's own inventory is not (the fix's observable defect);
 *   B. every retained row cites a repository path that exists — `yes`/`partial`
 *      prove existence, `no` proves the probe — and nothing is guessed;
 *   C. `capability-inventory@1` orders classify → delete → infer → ask → forbid
 *      → report, with `capability-evidence@1` carrying one probe row per
 *      candidate (parity both ways, so neither can drift alone);
 *   D. the write route carries the gate, upgrade mode points at the one owner,
 *      and the exported template calls its rows candidates.
 *
 * The readers are pure functions over text, so the red case is the template's
 * own bytes: no fixture has to be invented to reproduce the defect, and a
 * mutated copy pins that the reader is not vacuous. `CAPABILITY_INVENTORY_ROOT`
 * re-points the tree read at a throwaway copy (`mktemp -d`, removed after) —
 * the `NORMATIVE_DRIFT_REPO` pattern — so a candidate change is measured before
 * it lands on the real files.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.CAPABILITY_INVENTORY_ROOT ? path.resolve(process.env.CAPABILITY_INVENTORY_ROOT) : repoRoot;

const INVENTORY = "docs/CAPABILITIES.md";
const TEMPLATE = "template/docs/CAPABILITIES.md";
const DISCOVERY = "skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md";
const WRITE = "skills/init-workspace/references/BOOTSTRAP_WRITE.md";
const UPGRADE = "skills/init-workspace/references/UPGRADE.md";

const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

/** Path-like tokens a row may cite: a backticked repo path with an extension or a slash. */
const EXTENSIONS = [".md", ".json", ".mjs", ".js", ".ts", ".yml", ".yaml", ".sh", ".toml"];
const PATH_SHAPE = /^[\w.@-]+(?:\/[\w.@-]+)*\/?$/;

/* ------------------------------------------------------------------ readers */

/** Split a markdown table row on unescaped pipes, dropping the outer edges. */
function rowCells(line) {
  const cells = [];
  let current = "";
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\\" && line[index + 1] === "|") {
      current += "|";
      index += 1;
    } else if (char === "|") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.slice(1, -1).map((cell) => cell.trim());
}

/** The data rows of the table under `## <heading>`, header and separator dropped. */
function tableRows(text, heading) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return [];
  const rows = [];
  let separatorSeen = false;
  for (const line of lines.slice(start + 1)) {
    if (/^## /.test(line)) break;
    if (!line.trim().startsWith("|")) {
      if (rows.length > 0) break;
      continue;
    }
    const cells = rowCells(line);
    if (cells.every((cell) => cell === "" || /^:?-{2,}:?$/.test(cell))) {
      separatorSeen = true;
      continue;
    }
    if (!separatorSeen) continue;
    rows.push(cells);
  }
  return rows;
}

const subsystemRows = (text) => tableRows(text, "Cross-cutting subsystems");
const roleRows = (text) => tableRows(text, "Roles");

/** A cell still carrying the template's placeholder — the defect's own shape. */
const isPlaceholder = (cell) => /^<[\s\S]*>$/.test(cell.trim().replace(/^`+|`+$/g, ""));

/** Every placeholder cell in the document, as `row <n>, column <n> — <cell>`. */
function placeholderCells(text) {
  const out = [];
  for (const [heading, rows] of [
    ["Subsystem", subsystemRows(text)],
    ["Role", roleRows(text)],
  ]) {
    rows.forEach((cells, rowIndex) => {
      cells.forEach((cell, cellIndex) => {
        if (isPlaceholder(cell)) out.push(`${heading} row ${rowIndex + 1}, column ${cellIndex + 1} — ${cell}`);
      });
    });
  }
  return out;
}

/** The backticked, repo-path-shaped tokens of one cell. */
function pathTokens(cell) {
  return [...cell.matchAll(/`([^`]+)`/g)]
    .map((match) => match[1].trim())
    .filter((token) => PATH_SHAPE.test(token) && !token.includes(" "))
    .filter((token) => token.includes("/") || EXTENSIONS.some((ext) => token.endsWith(ext)));
}

/** The cited paths of one cell that actually exist in the read tree. */
const citedPaths = (cell) => pathTokens(cell).filter((token) => exists(token.replace(/\/$/, "")));

/** A fenced `name@1` grammar block's data rows, keyed by its first cell. */
function grammarRows(text, name) {
  const fence = /```text\n([\s\S]*?)```/g;
  for (const match of text.matchAll(fence)) {
    const lines = match[1].replace(/\n$/, "").split("\n");
    if (lines[0].trim() !== name) continue;
    // Line 1 is the block id and line 2 its column header — the repo's shape.
    return lines
      .slice(2)
      .filter((line) => line.trim() !== "")
      .map((line) => line.split("|").map((cell) => cell.trim()));
  }
  return [];
}

/**
 * The rows whose state nothing proves: an `Exists` cell that is neither a legal
 * state nor the explicit unresolved form, or a row whose evidence cell cites no
 * repository path that exists.
 */
function unprovenRows(text) {
  const out = [];
  subsystemRows(text).forEach((cells, index) => {
    const [subsystem, state, , evidence = ""] = cells;
    const legal = /^(yes|partial|no)$/.test(state) || state.startsWith("unresolved — ");
    if (!legal) out.push(`${subsystem}: Exists is \`${state}\`, not yes|partial|no or \`unresolved — <question>\``);
    if (citedPaths(evidence).length === 0) out.push(`${subsystem}: no cited repository path in \`${evidence || "(empty)"}\``);
    if (out.length > 0 && index === -1) return;
  });
  return out;
}

/** The same rule for the role rows: `Granted where` must cite a real path. */
function unprovenRoles(text) {
  const out = [];
  for (const cells of roleRows(text)) {
    const [role, , granted = ""] = cells;
    if (isPlaceholder(role) || isPlaceholder(granted)) {
      out.push(`${role}: still a template role`);
      continue;
    }
    if (citedPaths(granted).length === 0) out.push(`${role}: \`Granted where\` cites no existing path`);
  }
  return out;
}

/** The candidate subsystems the exported template ships, in order. */
const candidateNames = (text) => subsystemRows(text).map((cells) => cells[0]);

/* -------------------------------------------------- A. the defect, as bytes */

test("A1 — the shipped template is the raw seed the gate must refuse (#333)", () => {
  const template = read(TEMPLATE);
  const candidates = candidateNames(template);
  assert.equal(candidates.length, 13, "the template ships 13 candidate subsystems");
  const placeholders = placeholderCells(template);
  assert.ok(
    placeholders.length >= 13,
    `the template's post-fix shape still carries placeholders per candidate row, found ${placeholders.length}`,
  );
  for (const cells of subsystemRows(template)) {
    assert.ok(isPlaceholder(cells[1]), `candidate \`${cells[0]}\` lost its \`<yes|no|partial>\` seed cell`);
  }
  const roles = roleRows(template);
  assert.equal(roles.length, 1, "the template ships one role row");
  assert.ok(roles[0].every(isPlaceholder), "the role row is a placeholder row");
});

test("A2 — this repository's inventory carries no placeholder cell (#333 S11, S17)", () => {
  const offenders = placeholderCells(read(INVENTORY));
  assert.deepEqual(offenders, [], `template placeholders survive in ${INVENTORY}: ${offenders.join(" · ")}`);
});

test("A3 — no retained row is guessed: every row cites a path that exists (#333 S2, S14)", () => {
  assert.deepEqual(unprovenRows(read(INVENTORY)), [], "rows with no cited evidence");
  assert.deepEqual(unprovenRoles(read(INVENTORY)), [], "roles with no cited grant site");
});

test("A4 — the reader is not vacuous: emptying one evidence cell fails it", () => {
  const text = read(INVENTORY);
  const rows = subsystemRows(text);
  assert.ok(rows.length > 0, `${INVENTORY} carries no subsystem row to mutate`);
  const target = rows[0][0];
  const mutated = text.replace(
    new RegExp(`^(\\| ${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\|.*)$`, "m"),
    `| ${target} | no | none | some subsystem we probably have |`,
  );
  assert.notEqual(mutated, text, "the mutation applied");
  assert.ok(
    unprovenRows(mutated).some((row) => row.startsWith(`${target}:`)),
    "a row citing no existing path must be reported",
  );
});

test("A5 — the same reader refuses a throwaway copy of the template tree", () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "capability-inventory-"));
  try {
    fs.mkdirSync(path.join(scratch, "docs"), { recursive: true });
    fs.mkdirSync(path.join(scratch, "template", "docs"), { recursive: true });
    fs.copyFileSync(path.join(root, TEMPLATE), path.join(scratch, TEMPLATE));
    fs.copyFileSync(path.join(root, INVENTORY), path.join(scratch, INVENTORY));
    const seeded = fs.readFileSync(path.join(scratch, TEMPLATE), "utf8");
    assert.ok(placeholderCells(seeded).length > 0, "the copied seed is refused");
    const settled = fs.readFileSync(path.join(scratch, INVENTORY), "utf8");
    assert.deepEqual(placeholderCells(settled), [], "the copied inventory passes");
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});

test("A6 — the repair states its three outcomes: deleted candidates gone, the rest cited, project rows added (#333 S11, S13, S14, S15)", () => {
  const text = read(INVENTORY);
  const subsystems = subsystemRows(text).map((cells) => cells[0]);
  const deleted = ["Navigation (menus, dashboard)", "Notifications (email, push, in-app)", "File / media storage", "Billing / payments"];
  assert.deepEqual(
    subsystems.filter((name) => deleted.includes(name)),
    [],
    "a row the project type cannot carry survived the delete move",
  );
  const added = ["Skills distribution", "Scaffold export", "Deterministic gates"];
  for (const name of added) {
    assert.ok(subsystems.includes(name), `the project-specific row \`${name}\` is missing`);
  }
  assert.equal(roleRows(text).length, 2, "the inventory documents both roles: the owner and an agent session");
  assert.equal(subsystems.length, 12, "nine retained candidates plus three project-specific rows");
});

/* ------------------------------------------- B. the procedure and its probes */

test("B1 — the discovery route carries the six ordered moves (#333 S1, S7)", () => {
  const rows = grammarRows(read(DISCOVERY), "capability-inventory@1");
  assert.ok(rows.length > 0, `${DISCOVERY} has no capability-inventory@1 block`);
  const moves = rows.map((cells) => cells[0].trim());
  assert.deepEqual(moves, ["1 classify", "2 delete", "3 infer", "4 ask", "5 forbid", "6 report"]);
  for (const cells of rows) {
    assert.ok(cells.length >= 3, `move \`${cells[0]}\` does not state its evidence and outcome`);
    assert.ok(cells.slice(1).every((cell) => cell !== ""), `move \`${cells[0]}\` has an empty cell`);
  }
  const byMove = new Map(rows.map((cells) => [cells[0].trim(), cells.join(" | ")]));
  assert.match(byMove.get("2 delete"), /without a question/, "the delete move asks no question");
  assert.match(byMove.get("3 infer"), /one cited path|named repository path/, "the infer move names no evidence");
  assert.match(byMove.get("5 forbid"), /never `no`|never no/i, "the forbid move allows a default `no`");
  assert.match(byMove.get("5 forbid"), /template/, "the forbid move does not refuse the template's text");
});

test("B2 — the ask move is one batch, existence before state (#333 S3)", () => {
  const rows = grammarRows(read(DISCOVERY), "capability-inventory@1");
  const ask = rows.find((cells) => cells[0].trim() === "4 ask");
  assert.ok(ask, "no ask move");
  const text = ask.join(" | ");
  assert.match(text, /batched|one round/, "the ask move allows several rounds");
  assert.match(text, /existence question before any state question/, "the ask move asks state before existence");
});

test("B3 — the forbid move defers to the no-assumption owner (#333 S4)", () => {
  const discovery = read(DISCOVERY);
  const rows = grammarRows(discovery, "capability-inventory@1");
  assert.ok(rows.some((cells) => cells[0].trim() === "5 forbid"), "no forbid move");
  assert.match(discovery, /ask-don't-infer/, "the procedure does not reference the no-assumption rule");
  assert.match(discovery, /DESIGN\.md/, "the reference carries no owner pointer");
});

test("B4 — every candidate has a probe row, and the two sets are equal (#333 S7)", () => {
  const evidence = grammarRows(read(DISCOVERY), "capability-evidence@1");
  assert.ok(evidence.length > 0, `${DISCOVERY} has no capability-evidence@1 block`);
  for (const row of evidence) {
    assert.equal(row.length, 4, `evidence row \`${row[0]}\` does not carry a \`yes\`, \`partial\` and \`no\` probe`);
    assert.ok(row[1] && row[2] && row[3], `evidence row \`${row[0]}\` has an empty probe`);
  }
  const probes = evidence.map((row) => row[0].trim());
  const candidates = candidateNames(read(TEMPLATE));
  assert.deepEqual(probes, candidates, "the probe table and the template's candidate set diverged");
});

test("B5 — one owner: the procedure block is stated in exactly one file (#333 S9)", () => {
  const references = path.join(root, "skills/init-workspace/references");
  const carriers = fs
    .readdirSync(references)
    .filter((name) => name.endsWith(".md"))
    .filter((name) => grammarRows(fs.readFileSync(path.join(references, name), "utf8"), "capability-inventory@1").length > 0);
  assert.deepEqual(carriers, ["BOOTSTRAP_DISCOVERY.md"], "the procedure block is copied into a second reference");
});

/* ------------------------------------------------ C. the write gate and upgrade */

test("C1 — the write route gates the inventory it reports as seeded (#333 S5, S8)", () => {
  const write = read(WRITE);
  assert.match(write, /docs\/CAPABILITIES\.md/, "the write route never names the inventory");
  assert.ok(
    write.includes("rg -n '\\| *`?<[^>]+>`? *\\|' docs/CAPABILITIES.md"),
    "the gate names no placeholder probe",
  );
  assert.match(write, /unresolved — <question>/, "the gate does not accept the explicit unresolved form");
  assert.match(write, /residual/, "a failing file is not reported as a residual");
  assert.match(write, /not\W+reported as seeded|never reported as seeded|is not reported as seeded/, "the gate does not refuse the raw seed");
});

test("C2 — upgrade mode points at the one procedure instead of inheriting it (#333 S6, S9)", () => {
  const upgrade = read(UPGRADE);
  assert.match(upgrade, /capability-inventory@1/, "upgrade mode does not name the procedure");
  assert.match(upgrade, /BOOTSTRAP_DISCOVERY\.md/, "upgrade mode does not point at the procedure's owner");
  assert.match(upgrade, /BOOTSTRAP_WRITE\.md/, "upgrade mode does not point at the write gate");
  assert.match(upgrade, /additively/, "upgrade mode does not state its additive bound");
});

/* -------------------------------------------------- D. the exported template */

test("D1 — the template calls its rows candidates and states the order (#333 S10)", () => {
  const template = read(TEMPLATE);
  const header = template.slice(0, template.indexOf("## Cross-cutting subsystems"));
  assert.match(header, /candidate/i, "the template's header does not call the rows candidates");
  const deleted = header.search(/\*\*delete\*\*/i);
  const inferred = header.search(/\*\*infer\*\*/i);
  const asked = header.search(/\*\*ask\*\*/i);
  assert.ok(deleted !== -1 && inferred !== -1 && asked !== -1, "the header does not state all three moves");
  assert.ok(deleted < inferred && inferred < asked, "the header does not state delete-then-infer-then-ask");
  assert.match(header, /unresolved — <question>/, "the header does not name the unresolved form");
});

test("D2 — the template keeps the same 13 candidates and one role row (#333 S10)", () => {
  const template = read(TEMPLATE);
  assert.equal(candidateNames(template).length, 13, "the candidate set changed");
  assert.equal(roleRows(template).length, 1, "the role seed changed");
});
