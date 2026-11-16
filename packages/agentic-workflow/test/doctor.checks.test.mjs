/**
 * doctor.checks.test.mjs — the tool doctor's checker contract (issue #537).
 *
 * The checker is read-only and its probes are injectable, so every case here
 * drives `runDoctor` through a fake `ops`: no host binary, HTTP endpoint or git
 * config is read. The inventory text comes from the shipped crate README (the
 * documented inventory is the single declaration); the drift cases inject their
 * own text.
 *
 * Written red-first (S9): the module does not exist before this suite.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { DoctorRefusal, renderDoctor, runDoctor } from "../src/doctor/doctor.mjs";
import { CHECK_PROBES } from "../src/doctor/checks.mjs";
import {
  COMPANION_PAIRINGS,
  DOCTOR_CHECK_STATUSES,
  DOCTOR_CONTRACT_ID,
  INSTALL_ROUTES,
  NODE_ENGINE,
  WIZARD_MOVES,
} from "../src/doctor/vocabulary.mjs";

const README = readFileSync(fileURLToPath(new URL("../README.md", import.meta.url)), "utf8");
const ROOT = "/project";
const HOME = "/home/agent";
const AGENT_DIR = `${HOME}/.pi/agent`;

/** A complete fake ops bundle: every probe reads only what the case supplies. */
function fakeOps({ bins = {}, versions = {}, files = {}, dirs = {}, git = {}, http = {}, env = {}, ghAuth = null } = {}) {
  return {
    root: ROOT,
    home: HOME,
    platform: "linux",
    arch: "x64",
    nodeVersion: "26.13.0",
    env,
    binaryPath: (name) => bins[name] ?? null,
    version: (name) => versions[name] ?? null,
    readText: (path) => (path in files ? files[path] : null),
    exists: (path) => path in files || path in dirs || Object.values(bins).includes(path),
    listDir: (path) => dirs[path] ?? [],
    git: (_root, args) => {
      if (args[0] === "rev-parse") return { status: 0, stdout: args.includes("--git-path") ? `${ROOT}/.git/hooks` : `${ROOT}/.git` };
      const key = args[args.length - 1];
      return key in git ? { status: 0, stdout: git[key] } : { status: 1, stdout: "" };
    },
    ghAuth: () => ghAuth,
    httpJson: async (url) => (url in http ? { ok: true, body: http[url] } : { ok: false, body: null }),
  };
}

/** A host where every documented surface is healthy. */
function healthyOps(overrides = {}) {
  const bins = {
    node: "/usr/local/bin/node",
    bun: `${HOME}/.bun/bin/bun`,
    rg: "/usr/bin/rg",
    git: "/usr/bin/git",
    gh: "/usr/bin/gh",
    serena: `${HOME}/.local/bin/serena`,
    engram: "/home/agent/go/bin/engram",
    pi: `${HOME}/.bun/bin/pi`,
  };
  const versions = {
    bun: "1.4.4",
    rg: "15.2.0",
    git: "2.47.3",
    gh: "2.46.0",
    serena: "2.1.0",
    engram: "3.7.1",
    pi: "1.5.2",
  };
  const files = {
    [`${ROOT}/.bun-version`]: "1.4.4\n",
    [`${ROOT}/.serena/project.yml`]: "language_servers:\n  - typescript\n  - bash\n",
    [`${ROOT}/.serena/project.local.yml`]: "language_servers:\n  - typescript\n",
    [`${ROOT}/.gitattributes`]: "docs/ROADMAP.md merge=agentic-shared-roadmap\ndocs/generated/** merge=docs-generated\n",
    [`${ROOT}/scripts/local-gate.mjs`]: "// the project's gate installer\n",
    [`${ROOT}/scripts/shared-doc-merge.mjs`]: "// the project's driver installer\n",
    [`${ROOT}/scripts/docs-generated-merge.mjs`]: "// the project's projection driver installer\n",
    [`${AGENT_DIR}/settings.json`]: JSON.stringify({ packages: ["npm:gentle-engram@latest", "npm:pi-clear"] }),
    [`${AGENT_DIR}/npm/node_modules/gentle-engram/package.json`]: JSON.stringify({ version: "0.8.0" }),
    [`${ROOT}/.mcp.json`]: JSON.stringify({ mcpServers: {} }),
  };
  const git = {
    "user.name": "An Operator",
    "user.email": "operator@example.test",
    "merge.agentic-shared-roadmap.driver": "bash driver.sh roadmap %O %A %B %L \"%P\"",
    "merge.docs-generated.driver": "bash driver.sh %O %A %B %L \"%P\"",
  };
  const http = { "http://127.0.0.1:7437/health": { status: "ok", service: "engram", version: "3.7.1" } };
  return fakeOps({
    bins,
    versions,
    files,
    dirs: { [`${ROOT}/.git/hooks`]: ["pre-push"], [`${ROOT}/.serena`]: ["project.yml", "project.local.yml"], [`${ROOT}/scripts`]: ["local-gate.mjs", "shared-doc-merge.mjs", "docs-generated-merge.mjs"] },
    git,
    http,
    ghAuth: { authenticated: true, detail: "Logged in to github.com as operator" },
    env: {},
    ...overrides,
  });
}

/** The same fake with a different directory listing (the fake closes over its own). */
function withDirs(ops, dirs) {
  return { ...ops, listDir: (path) => dirs[path] ?? [] };
}

/** The same fake with one path gone: `readText` and `exists` agree it is absent. */
function withoutPath(ops, gone) {
  return {
    ...ops,
    readText: (path) => (path === gone ? null : ops.readText(path)),
    exists: (path) => (path === gone ? false : ops.exists(path)),
  };
}

const rowOf = (envelope, id) => envelope.rows.find((row) => row.id === id);const check = (envelope, id) => {
  const row = rowOf(envelope, id);
  assert.ok(row, `the envelope carries the \`${id}\` row`);
  return row;
};

/** Insert one line before the inventory block's closing fence (the drift case). */
function insertInventoryRow(text, line) {
  const start = text.indexOf("\ntool-inventory@1\n");
  assert.ok(start > 0, "the crate README declares the inventory block");
  const end = text.indexOf("```", start);
  return `${text.slice(0, end)}${line}\n${text.slice(end)}`;
}

test("the vocabularies are published, frozen and carry the contract id", () => {
  assert.equal(DOCTOR_CONTRACT_ID, "doctor@1");
  for (const set of [DOCTOR_CHECK_STATUSES, INSTALL_ROUTES, WIZARD_MOVES, COMPANION_PAIRINGS]) {
    assert.ok(Object.isFrozen(set), "a published vocabulary is frozen");
  }
  assert.deepEqual(
    [...DOCTOR_CHECK_STATUSES],
    ["ok", "missing", "mismatch", "unarmed", "unreachable", "not-applicable"],
  );
  assert.deepEqual([...INSTALL_ROUTES], ["npm", "bun", "pip-uv", "brew", "binary", "instruct-only"]);
  assert.deepEqual([...WIZARD_MOVES], ["report-only", "ask-consent-write", "instruct-only", "residual"]);
  assert.match(NODE_ENGINE, /^>=\d+$/u);
});

test("a healthy host yields zero advisories and verdict pass (S9)", async () => {
  const envelope = await runDoctor({ ops: healthyOps(), inventoryText: README });
  assert.equal(envelope.contract, DOCTOR_CONTRACT_ID);
  assert.equal(envelope.verdict, "pass");
  assert.equal(envelope.summary.advisories, 0, "a healthy host gets no remediation advisory at all");
  assert.equal(envelope.exitCode, 0);
  assert.equal(envelope.rows.length, CHECK_PROBES.length, "one row per published probe");
});

test("every row carries evidence, one status, one route and one move", async () => {
  const envelope = await runDoctor({ ops: healthyOps(), inventoryText: README });
  for (const row of envelope.rows) {
    assert.ok(DOCTOR_CHECK_STATUSES.includes(row.status), `${row.id}: status is published`);
    assert.ok(INSTALL_ROUTES.includes(row.route), `${row.id}: route is published`);
    assert.ok(WIZARD_MOVES.includes(row.move), `${row.id}: move is published`);
    assert.ok(row.evidence && typeof row.evidence === "object", `${row.id}: evidence is an object`);
    assert.ok(["required", "optional"].includes(row.requirement), `${row.id}: requirement is declared`);
  }
});

test("the 2026-11-13 pair: a served engram version that disagrees with the binary is a mismatch naming both (S9)", async () => {
  const base = healthyOps();
  const ops = {
    ...base,
    httpJson: async (url) =>
      url in { "http://127.0.0.1:7437/health": 1 } ? { ok: true, body: { status: "ok", version: "3.6.0" } } : { ok: false, body: null },
  };
  const envelope = await runDoctor({ ops, inventoryText: README });
  const row = check(envelope, "engram-server");
  assert.equal(row.status, "mismatch");
  assert.deepEqual(row.evidence.pair, { binary: "3.7.1", served: "3.6.0" });
  assert.match(row.advisory, /3\.7\.1/u);
  assert.match(row.advisory, /3\.6\.0/u);
  assert.equal(row.move, "instruct-only", "the operator restarts it; the doctor never does");
});

test("an unreachable engram server is reported, never silently", async () => {
  const envelope = await runDoctor({ ops: healthyOps({ http: {} }), inventoryText: README });
  const row = check(envelope, "engram-server");
  assert.equal(row.status, "unreachable");
  assert.match(row.advisory, /ENGRAM_URL|engram run -d/u);
});

test("rg's absence is detected with the pinned bootstrap command (gap 1)", async () => {
  const base = healthyOps();
  const bins = { ...base.bins };
  const envelope = await runDoctor({
    ops: { ...base, binaryPath: (name) => (name === "rg" ? null : (bins[name] ?? null)) },
    inventoryText: README,
  });
  const row = check(envelope, "rg");
  assert.equal(row.status, "missing");
  assert.match(row.advisory, /provision rg/u);
  assert.equal(row.requirement, "optional");
});

test("a missing required surface fails the exit code; a missing optional one never does (S9)", async () => {
  const base = healthyOps();
  const withoutBun = { ...base, binaryPath: (name) => (name === "bun" ? null : base.binaryPath(name)) };
  const optional = await runDoctor({ ops: withoutBun, inventoryText: README });
  assert.equal(check(optional, "bun").status, "missing");
  assert.equal(optional.exitCode, 0, "an optional absence is a warning, never a failure");

  const withoutGitIdentity = {
    ...base,
    git: (_root, args) => {
      if (args[0] === "rev-parse") return { status: 0, stdout: args.includes("--git-path") ? `${ROOT}/.git/hooks` : `${ROOT}/.git` };
      return { status: 1, stdout: "" };
    },
  };
  const required = await runDoctor({ ops: withoutGitIdentity, inventoryText: README });
  const git = check(required, "git");
  assert.equal(git.status, "missing");
  assert.notEqual(required.exitCode, 0, "an unconfigured required surface is a failure");
  assert.match(git.advisory, /git config --global user\.name/u);
});

test("a bun behind the committed .bun-version pin is a mismatch (the version pair)", async () => {
  const envelope = await runDoctor({ ops: healthyOps({ versions: { bun: "1.3.0", rg: "15.2.0", git: "2.47.3", gh: "2.46.0", serena: "2.1.0", engram: "3.7.1", pi: "1.5.2" } }), inventoryText: README });
  const row = check(envelope, "bun");
  assert.equal(row.status, "mismatch");
  assert.equal(row.evidence.pin, "1.4.4");
  assert.equal(row.evidence.version, "1.3.0");
});

test("a declared but un-armed merge driver is `unarmed` naming the driver (gap 3)", async () => {
  const base = healthyOps();
  const ops = {
    ...base,
    git: (_root, args) => {
      if (args[0] === "rev-parse") return { status: 0, stdout: args.includes("--git-path") ? `${ROOT}/.git/hooks` : `${ROOT}/.git` };
      const key = args[args.length - 1];
      if (key.startsWith("merge.")) return { status: 1, stdout: "" };
      return key === "user.name" || key === "user.email" ? { status: 0, stdout: "x" } : { status: 1, stdout: "" };
    },
  };
  const envelope = await runDoctor({ ops, inventoryText: README });
  const row = check(envelope, "merge-drivers");
  assert.equal(row.status, "unarmed");
  assert.deepEqual(row.evidence.unarmed.sort(), ["agentic-shared-roadmap", "docs-generated"]);
  assert.equal(row.move, "ask-consent-write", "the project's own installer repairs it");
  assert.ok(row.action && row.action.program && Array.isArray(row.action.args), "the action is a runnable command");
  assert.match(row.action.display, /shared-doc-merge\.mjs --install/u);
});

test("a project that declares no merge driver is `not-applicable` with no advisory", async () => {
  const ops = withoutPath(healthyOps(), `${ROOT}/.gitattributes`);
  const envelope = await runDoctor({ ops, inventoryText: README });
  const row = check(envelope, "merge-drivers");
  assert.equal(row.status, "not-applicable");
  assert.equal(row.advisory, null);
  assert.equal(row.move, "report-only");
});

test("a missing pre-push hook is unarmed when the project ships the gate installer", async () => {
  const envelope = await runDoctor({ ops: withDirs(healthyOps(), { [`${ROOT}/.git/hooks`]: [] }), inventoryText: README });
  const row = check(envelope, "git-hooks");
  assert.equal(row.status, "unarmed");
  assert.equal(row.move, "ask-consent-write");
  assert.match(row.action.display, /local-gate\.mjs --install-hook/u);
});

test("a project with no gate installer has no hook contract: not-applicable, no advisory", async () => {
  const ops = withoutPath(healthyOps(), `${ROOT}/scripts/local-gate.mjs`);
  const envelope = await runDoctor({ ops, inventoryText: README });
  const row = check(envelope, "git-hooks");
  assert.equal(row.status, "not-applicable");
  assert.equal(row.advisory, null);
});

test("serena is observed at all three levels (S4)", async () => {
  const base = healthyOps();
  const noBinary = { ...base, binaryPath: (name) => (name === "serena" ? null : base.binaryPath(name)) };
  assert.equal(check(await runDoctor({ ops: noBinary, inventoryText: README }), "serena").status, "missing");

  const emptyServers = { ...base, readText: (path) => (path === `${ROOT}/.serena/project.yml` ? "language_servers: []\n" : base.readText(path)) };
  const empty = check(await runDoctor({ ops: emptyServers, inventoryText: README }), "serena");
  assert.equal(empty.status, "missing");
  assert.deepEqual(empty.evidence.project.languageServers, [], "an empty list is reported, not assumed healthy");

  const ok = check(await runDoctor({ ops: base, inventoryText: README }), "serena");
  assert.equal(ok.status, "ok");
  assert.deepEqual(ok.evidence.project.languageServers, ["typescript", "bash"]);
  assert.equal(ok.evidence.localOverride.present, true);
});

test("the companion pin is read from pi settings and the curated pair is a residual (S3)", async () => {
  const base = healthyOps();
  const undeclared = {
    ...base,
    readText: (path) => (path === `${AGENT_DIR}/settings.json` ? JSON.stringify({ packages: ["npm:pi-clear"] }) : base.readText(path)),
  };
  const missing = check(await runDoctor({ ops: undeclared, inventoryText: README }), "gentle-engram");
  assert.equal(missing.status, "missing");
  assert.match(missing.advisory, /pi install npm:gentle-engram@latest/u);
  assert.equal(missing.move, "instruct-only");

  const objectEntry = {
    ...base,
    readText: (path) =>
      path === `${AGENT_DIR}/settings.json`
        ? JSON.stringify({ packages: [{ source: "npm:gentle-engram@0.8.0" }] })
        : base.readText(path),
  };
  assert.equal(check(await runDoctor({ ops: objectEntry, inventoryText: README }), "gentle-engram").evidence.pin, "npm:gentle-engram@0.8.0");

  const staleCore = { ...base, httpJson: async () => ({ ok: true, body: { status: "ok", version: "3.6.0" } }) };
  const pair = check(await runDoctor({ ops: staleCore, inventoryText: README }), "gentle-engram");
  assert.equal(pair.status, "mismatch");
  assert.equal(pair.move, "residual", "a curated pair mismatch is a maintainer decision, not a command");
  assert.deepEqual(pair.evidence.pair, { companionLine: "0.8", coreLine: "3.6" });

  const noPi = { ...base, binaryPath: (name) => (name === "pi" ? null : base.binaryPath(name)) };
  assert.equal(check(await runDoctor({ ops: noPi, inventoryText: README }), "gentle-engram").status, "not-applicable");
});

test("the adapter scan is report-only and never plans a write (S3, S4)", async () => {
  const ok = check(await runDoctor({ ops: healthyOps(), inventoryText: README }), "agent-adapters");
  assert.equal(ok.status, "ok");
  assert.equal(ok.move, "report-only");
  assert.ok(ok.evidence.adapters.some((adapter) => adapter.id === "claude" && adapter.present));

  const none = check(await runDoctor({ ops: withoutPath(healthyOps(), `${ROOT}/.mcp.json`), inventoryText: README }), "agent-adapters");
  assert.equal(none.status, "not-applicable");
  assert.equal(none.action, null);
});

test("the gh row distinguishes absence from an unauthenticated CLI", async () => {
  const unauthenticated = check(await runDoctor({ ops: healthyOps({ ghAuth: { authenticated: false, detail: "not logged in" } }), inventoryText: README }), "gh");
  assert.equal(unauthenticated.status, "unreachable");
  assert.match(unauthenticated.advisory, /gh auth login/u);
});

test("ENGRAM_BIN is honoured and the evidence names its source", async () => {
  const base = healthyOps();
  const ops = { ...base, env: { ENGRAM_BIN: "/opt/engram/bin/engram" }, binaryPath: (name) => (name === "engram" ? "/opt/engram/bin/engram" : base.binaryPath(name)) };
  const row = check(await runDoctor({ ops, inventoryText: README }), "engram-binary");
  assert.equal(row.status, "ok");
  assert.equal(row.evidence.source, "ENGRAM_BIN");
  assert.equal(row.evidence.path, "/opt/engram/bin/engram");
});

test("install routes are instructions, never an action: the doctor runs no package manager (S3)", async () => {
  const base = healthyOps();
  const ops = {
    ...base,
    binaryPath: (name) => (["serena", "engram", "pi", "gh", "bun"].includes(name) ? null : base.binaryPath(name)),
    // The two rows whose repair is the project's own installer are un-armed, so
    // the assertion below has something to distinguish: an actionable row and an
    // instruction-only one are never the same row.
    listDir: (path) => ({ [`${ROOT}/.git/hooks`]: [] })[path] ?? [],
    git: (_root, args) => {
      if (args[0] === "rev-parse") return { status: 0, stdout: args.includes("--git-path") ? `${ROOT}/.git/hooks` : `${ROOT}/.git` };
      const key = args[args.length - 1];
      if (key.startsWith("merge.")) return { status: 1, stdout: "" };
      return key === "user.name" || key === "user.email" ? { status: 0, stdout: "x" } : { status: 1, stdout: "" };
    },
  };
  const envelope = await runDoctor({ ops, inventoryText: README });
  for (const row of envelope.rows) {
    if (row.route === "instruct-only" && row.status !== "ok" && row.move === "instruct-only") {
      assert.equal(row.action, null, `${row.id}: an operator command is never an action`);
      assert.ok(row.advisory, `${row.id}: the instruction is printed`);
    }
  }
  const actions = envelope.rows.filter((row) => row.action !== null).map((row) => row.id).sort();
  assert.deepEqual(actions, ["git-hooks", "merge-drivers"], "only the project's own installers are actionable");
});

test("the envelope is deterministic: two runs over the same ops are byte-identical", async () => {
  const first = await runDoctor({ ops: healthyOps(), inventoryText: README });
  const second = await runDoctor({ ops: healthyOps(), inventoryText: README });
  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

const LABELLED_LINE = /^(ok|MISS|MISMATCH|UNARMED|UNREACHABLE|N\/A)\s{2,}\S/u;

/** An envelope whose rows carry one status each, so the block renders every label. */
function oneRowPerStatus() {
  const rows = DOCTOR_CHECK_STATUSES.map((status) => ({
    id: `surface-${status}`,
    requirement: "optional",
    status,
    route: "instruct-only",
    action: null,
    instruction: null,
    advisory: null,
    move: "report-only",
    evidence: {},
  }));
  return {
    contract: DOCTOR_CONTRACT_ID,
    host: { platform: "linux", arch: "x64" },
    rows,
    summary: { ok: 1, missing: 1, mismatch: 1, unarmed: 1, unreachable: 1, notApplicable: 1, advisories: 0 },
    verdict: "pass",
  };
}

test("the human block keeps a two-space gutter after every published label (S2)", () => {
  const envelope = oneRowPerStatus();
  const lines = renderDoctor(envelope).split("\n");
  // The 11-character UNREACHABLE is the longest label, so a padded label column
  // alone leaves it one space short of the fixed block's separation.
  for (const row of envelope.rows) {
    const line = lines.find((candidate) => candidate.includes(row.id));
    assert.ok(line, `${row.status}: the row is rendered`);
    assert.match(line, LABELLED_LINE, `${row.status}: at least two spaces before the row id`);
  }
  assert.equal(lines.filter((line) => LABELLED_LINE.test(line)).length, envelope.rows.length, "one labelled line per row");
});

test("the documented inventory is the declaration: a drift refuses in both directions (S8)", async () => {
  const dropped = README.replace(/^rg \|.*$/mu, "");
  await assert.rejects(
    () => runDoctor({ ops: healthyOps(), inventoryText: dropped }),
    (error) => error instanceof DoctorRefusal && error.code === "inventory-drift" && /rg/u.test(error.message),
  );

  const extra = insertInventoryRow(README, "bogus | a tool nobody probes | x | optional | nothing | nothing | instruct-only");
  await assert.rejects(
    () => runDoctor({ ops: healthyOps(), inventoryText: extra }),
    (error) => error instanceof DoctorRefusal && error.code === "inventory-drift" && /bogus/u.test(error.message),
  );

  await assert.rejects(
    () => runDoctor({ ops: healthyOps(), inventoryText: "# no inventory here\n" }),
    (error) => error instanceof DoctorRefusal && error.code === "inventory-missing",
  );
});
