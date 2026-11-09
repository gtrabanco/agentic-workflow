// telemetry-extension.test.mjs — issue #383: the sample's session identity is
// only worth anything if the shipped adapter asks for it.
//
// Everything else in this suite drives the wiring factory directly, and that is
// the right split for the rules. It left one link unverified: `src/extension/
// index.ts` is what Pi loads, and it is the only place that knows the session id.
// Delete that one argument and every other test stays green while two sessions
// of one unit collapse into a single row again — the defect #383's sink exists
// to not have.
//
// So this file calls the shipped entry with a Pi-shaped API, dispatches a
// unit-scoped command, and asserts the row Pi would actually get.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const COLUMNS = ["unit", "changed_paths", "tokens", "turns", "model_ms", "tool_ms", "observed", "source"];
const SESSION_ID = "sess-383";

/** The ledger a sink can write: the grammar block and the empty sample table. */
function ledgerText() {
  const block = COLUMNS.map((column) => `${column} | \`x\` | what it holds`).join("\n");
  const header = `| ${COLUMNS.join(" | ")} |\n|${COLUMNS.map(() => "---").join("|")}|`;
  return `# Measured acceptance\n\n\`\`\`text\ntier-cost@1\ncolumn | shape | what it holds\n${block}\n\`\`\`\n\n## Samples\n\n${header}\n`;
}

/**
 * One isolated extension instance whose project carries a unit and a ledger, and
 * whose agent dir opts the telemetry in. Nothing here touches this machine's
 * `~/.pi`.
 */
async function shipped({ enabled = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), "paw-telemetry-"));
  const agentDir = join(root, "agent");
  const cwd = join(root, "repo");
  mkdirSync(agentDir, { recursive: true });
  mkdirSync(join(cwd, "docs/fix/383-measured-acceptance"), { recursive: true });
  mkdirSync(join(cwd, "docs/workflow"), { recursive: true });
  writeFileSync(join(cwd, "docs/fix/383-measured-acceptance/SPEC.md"), "# fix/383-measured-acceptance\n\n## Risk tier\n\n- **Tier** — `standard`\n");
  const ledgerPath = join(cwd, "docs/workflow/TIER_COST.md");
  writeFileSync(ledgerPath, ledgerText());
  writeFileSync(join(agentDir, "agentic-workflow.json"), JSON.stringify({ telemetry: { enabled } }));

  const handlers = new Map();
  const registered = new Map();
  const notes = [];
  const api = {
    on: (event, handler) => handlers.set(event, handler),
    registerCommand: (name, command) => registered.set(name, command),
    sendUserMessage: () => {},
    setModel: async () => true,
    getThinkingLevel: () => "medium",
    setThinkingLevel: () => {},
    getMcpServers: () => [],
    registerMcpServer: () => {},
  };

  const previous = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = agentDir;
  try {
    const { default: extension } = await import("../dist/extension/index.js");
    extension(api);
  } finally {
    if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previous;
  }

  /** The `ExtensionContext` Pi hands a command handler or an event. */
  const context = () => ({
    cwd,
    model: { provider: "anthropic", id: "claude-sonnet-4-5" },
    isIdle: () => true,
    isProjectTrusted: () => true,
    ui: {
      notify: (message) => notes.push(message),
      select: () => undefined,
      input: () => undefined,
      confirm: () => undefined,
    },
    modelRegistry: { find: () => undefined, hasConfiguredAuth: () => true, getAll: () => [] },
    sessionManager: { getSessionId: () => SESSION_ID },
  });

  /** One session over one unit, driven through the events Pi emits. */
  const runSession = async ({ tokens }) => {
    handlers.get("session_start")?.({}, context());
    await registered.get("execute-phase").handler("383", context());
    handlers.get("turn_end")?.({ message: { usage: { totalTokens: tokens } } }, context());
    handlers.get("session_shutdown")?.({}, context());
  };

  const hasListeners = () => ["turn_start", "turn_end", "tool_execution_end"].every((event) => handlers.has(event));

  const rows = () =>
    readFileSync(ledgerPath, "utf8")
      .split("\n")
      .filter((line) => line.startsWith("| 383"))
      .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));

  return { root, cwd, ledgerPath, runSession, rows, hasListeners, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

test("the shipped adapter names the session pi handed it", async () => {
  const entry = await shipped();
  try {
    await entry.runSession({ tokens: 321 });
    const rows = entry.rows();
    assert.equal(rows.length, 1, "a session that ran a unit-scoped command emits one row");
    const row = Object.fromEntries(COLUMNS.map((column, index) => [column, rows[0][index]]));
    assert.equal(row.unit, "383-measured-acceptance");
    assert.equal(row.tokens, "321");
    assert.equal(row.source, `pi:session=${SESSION_ID}`, "the id the adapter passes is the one pi's context carries");
  } finally {
    entry.cleanup();
  }
});

test("the switch off registers nothing, so a session emits no row at all", async () => {
  const entry = await shipped({ enabled: false });
  try {
    await entry.runSession({ tokens: 321 });
    assert.equal(entry.hasListeners(), false, "off means pi.on is never called, not a listener that finds itself disabled");
    assert.deepEqual(entry.rows(), []);
  } finally {
    entry.cleanup();
  }
});
