// event-reliability-matrix.test.mjs — issue #623 S1/S2/S3: the extension's own
// event surface has to be documented against the host it runs in.
//
// The defect this pins is a silent one: every listener is invisible to a reader
// until they burn a session in a host where the event never fires. So the
// corpus derives the registered set from the source (never a hand-kept list in
// this file) and compares it, cell by cell, with the matrix the documentation
// carries. A listener added without a matrix row, a row for an event nobody
// listens to, or a row that names no effect and no gap fails here.
//
// The matrix's grammar is `pi-event-reliability@1`, published in
// `docs/workflow/CONFIG.md`; the directive lines below its marker declare the
// column set and the two closed cell vocabularies, so the document owns the
// grammar and this suite only reads it.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const EXTENSION_DIR = fileURLToPath(new URL("../src/extension/", import.meta.url));
const CONFIG_DOC = fileURLToPath(new URL("../../../docs/workflow/CONFIG.md", import.meta.url));

/** The events the extension registers, read from the source, never listed here. */
function registeredEvents() {
  const events = new Set();
  for (const name of readdirSync(EXTENSION_DIR).filter((entry) => entry.endsWith(".ts"))) {
    const text = readFileSync(join(EXTENSION_DIR, name), "utf8");
    for (const match of text.matchAll(/pi\.on\("([a-z0-9_]+)"/gu)) events.add(match[1]);
  }
  return [...events].sort();
}

/** The cells of a row, with the boundary pipes dropped. */
function cellsOf(line) {
  const cells = line.split("|").map((cell) => cell.trim());
  if (cells[0] === "") cells.shift();
  if (cells.at(-1) === "") cells.pop();
  return cells;
}

/** The `pi-event-reliability@1` block, parsed into directives and rows. */
function matrix() {
  const lines = readFileSync(CONFIG_DOC, "utf8").split("\n");
  const markerAt = lines.findIndex((line) => line.trim() === "pi-event-reliability@1");
  assert.ok(markerAt > -1, `${CONFIG_DOC} carries no pi-event-reliability@1 block`);
  const fenceAt = lines.findIndex((line, index) => index > markerAt && line.trim().startsWith("```"));
  assert.ok(fenceAt > -1, "the pi-event-reliability@1 block is not closed");
  const body = lines.slice(markerAt + 1, fenceAt).filter((line) => line.trim() !== "");

  const headerAt = body.findIndex((line) => cellsOf(line).length === COLUMNS.length && cellsOf(line)[0] === "event");
  assert.ok(headerAt > -1, "the matrix declares no `event | …` header");
  const directives = body.slice(0, headerAt).map(cellsOf);
  const columns = cellsOf(body[headerAt]);
  const rows = body.slice(headerAt + 1).map(cellsOf);
  return { directives, columns, rows };
}

const HOST_COLUMNS = ["tui", "web", "headless"];
const COLUMNS = ["event", "listeners", "fires", ...HOST_COLUMNS, "reliability", "effect", "gap"];

/** The vocabulary a directive publishes: the cells after its name. */
function vocabulary(directives, name) {
  const directive = directives.find(([directiveName]) => directiveName === name);
  assert.ok(directive, `the matrix declares no ${name} directive`);
  return new Set(directive.slice(1));
}

test("the matrix declares its source, its columns and its closed cell vocabularies", () => {
  const { directives, columns } = matrix();
  const source = directives.find(([name]) => name === "source");
  assert.ok(source, "the matrix declares no source — an unsourced reliability claim is an assumption");
  const citation = source.slice(1).join("|");
  assert.match(citation, /pi\.dev/u, "the source names the host documentation");
  assert.match(citation, /@earendil-works\/pi-coding-agent@[0-9]/u, "the source names the pinned host version the catalogue was read from");

  assert.deepEqual(columns, COLUMNS);
  for (const column of columns) {
    assert.equal(directives.some(([name]) => name === column), true, `the block declares no meaning for ${column}`);
  }
  assert.equal(directives.some(([name]) => name === "cells"), true, "the host cells are a closed vocabulary the block publishes");
});

test("every event the extension registers has a matrix row, and no row invents one", () => {
  const { rows } = matrix();
  const documented = rows.map(([event]) => event);
  assert.deepEqual([...documented].sort(), registeredEvents(), "the matrix and the source's registrations must be the same set");
  assert.equal(new Set(documented).size, documented.length, "an event carries exactly one row");
});

test("every row answers all three hosts, the reliability verdict and both columns of the audit", () => {
  const { directives, rows } = matrix();
  const hostCells = vocabulary(directives, "cells");
  const reliability = vocabulary(directives, "reliability-vocabulary");
  for (const cells of rows) {
    assert.equal(cells.length, 9, `${cells[0]} carries ${cells.length} cells, not the declared 9`);
    const [event, listeners, fires, tui, web, headless, verdict, effect, gap] = cells;
    assert.ok(listeners !== "" && fires !== "", `${event} names no listener or no firing condition`);
    for (const [host, cell] of [["tui", tui], ["web", web], ["headless", headless]]) {
      assert.equal(hostCells.has(cell), true, `${event}'s ${host} cell is ${JSON.stringify(cell)}, outside the declared vocabulary`);
    }
    assert.equal(reliability.has(verdict), true, `${event}'s reliability is ${JSON.stringify(verdict)}, outside the declared vocabulary`);
    assert.ok(effect !== "", `${event} names no observable effect — every listener either produces one or says so`);
    assert.ok(gap !== "", `${event} names no gap — a reliability cell is a claim about what is lost`);
  }
});

test("the shutdown row carries the session:end seam's documented warning (S3/S4 option C)", () => {
  const { rows } = matrix();
  const shutdown = rows.find(([event]) => event === "session_shutdown");
  assert.ok(shutdown, "session_shutdown has no row");
  const [, , , , web, , verdict, effect, gap] = shutdown;
  assert.equal(web, "not-fire", "the web host does not fire session_shutdown between prompts — that is the gap this unit exists for");
  assert.equal(verdict, "unreliable", "session_shutdown is the unreliable boundary, by definition");
  assert.match(effect, /session:end/u, "the shutdown row names the hook seam it hosts");
  assert.match(gap, /session:end/u, "the seam's web gap is the known-issue this row warns about");
  assert.match(gap, /known-issue/u, "the gap is declared as a known-issue, not left as prose nobody routes");
});

test("the emission boundary this unit relies on is documented as reliable in every host", () => {
  const { rows } = matrix();
  const settled = rows.find(([event]) => event === "agent_settled");
  assert.ok(settled, "agent_settled has no row — the boundary S6 chose must be documented");
  const [, , , tui, web, headless, reliability] = settled;
  assert.deepEqual([tui, web, headless], ["fires", "fires", "fires"]);
  assert.equal(reliability, "reliable");
});

test("session_shutdown survives as a listener in all three wirings (S5: no Pi contract change)", () => {
  const text = ["index.ts", "telemetry-wiring.ts", "auto-log-session-wiring.ts"]
    .map((name) => readFileSync(join(EXTENSION_DIR, name), "utf8"))
    .join("\n");
  const registrations = [...text.matchAll(/pi\.on\("session_shutdown"/gu)].length;
  assert.equal(registrations, 3, "the shutdown event is still listened to by the adapter, the telemetry wiring and the auto-log wiring");
});
