/**
 * doctor.relay.test.mjs — the doctor's Relay dispatch capability row (issue #705).
 *
 * The row answers a question the lane used to learn at the hand-off: can this
 * session chain Relay legs? The issue's own scope decision (`S7`) splits the
 * answer by the repository's delimitation rule — the generic half (a PI WEB
 * session marker, its session-daemon endpoint, and the `@jmfederico/pi-relay`
 * package with its two skills, all disk-observable) is this check's; the
 * session-dispatch bridge is a host event no separate process can observe, so it
 * is *named* in the evidence and never claimed.
 *
 * Every case drives the probe through a fake `ops` (the doctor's own seam), so no
 * host binary, network endpoint or real settings file is read.
 *
 * Written red-first: `src/doctor/relay.mjs` does not exist before this suite.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { renderDoctor, runDoctor } from "../src/doctor/doctor.mjs";
import {
  RELAY_BRIDGE_PROTOCOL,
  RELAY_PACKAGE,
  RELAY_SKILLS,
  evaluateRelay,
  relayEvidence,
} from "../src/doctor/relay.mjs";
import { DOCTOR_CHECK_STATUSES } from "../src/doctor/vocabulary.mjs";

const README = readFileSync(fileURLToPath(new URL("../README.md", import.meta.url)), "utf8");
const ROOT = "/project";
const HOME = "/home/agent";
const AGENT_DIR = `${HOME}/.pi/agent`;
/** The PI WEB distribution root the shipped Relay package lives under. */
const PIWEB = `${HOME}/.bun/install/global/node_modules/@jmfederico/pi-web`;
const EMBEDDED = `${PIWEB}/dist/pi-packages/relays`;
const SOCKET = `${HOME}/.pi-web/sessiond.sock`;
/** A sibling shipped package: the sibling that keeps the distribution root derivable. */
const SHIPPED_SIBLING = `${PIWEB}/dist/pi-packages/mcp-manager`;
/** The per-phase route the lane owns when Relay is not available. */
const DEGRADE = "→ Next: /execute-phase <NN-slug> P<k>";

const RELAY_MANIFEST = JSON.stringify({
  name: RELAY_PACKAGE,
  version: "0.1.0",
  private: true,
  pi: { skills: ["./skills"] },
});

/**
 * The fake host seam. `relay` selects the registered package declaration
 * (`"path"` a registered absolute path, `"npm"` a bare npm spec, `null` none),
 * and every other face comes from the healthy fixture so `runDoctor` can build
 * the whole envelope over it.
 */
function fakeOps({ env = {}, registered = "path", skills = ["relay", "relay-runner"], embedded = true, socket = true } = {}) {
  const files = {
    [`${ROOT}/.bun-version`]: "1.4.4\n",
    [`${ROOT}/.serena/project.yml`]: "language_servers:\n  - typescript\n",
    [`${ROOT}/.gitattributes`]: "docs/ROADMAP.md merge=agentic-shared-roadmap\n",
    [`${ROOT}/scripts/local-gate.mjs`]: "// gate\n",
    [`${ROOT}/scripts/shared-doc-merge.mjs`]: "// driver\n",
  };
  const dirs = { [`${ROOT}/.git/hooks`]: ["pre-push"], [`${ROOT}/.serena`]: ["project.yml"], [`${ROOT}/scripts`]: ["local-gate.mjs", "shared-doc-merge.mjs"] };

  if (registered !== null) {
    const source = registered === "path" ? EMBEDDED : `npm:${RELAY_PACKAGE}`;
    files[`${AGENT_DIR}/settings.json`] = JSON.stringify({ packages: [SHIPPED_SIBLING, source] });
  } else {
    // PI WEB registers the rest of its shipped packages; "Relays" is the one the
    // operator disabled, which is exactly how the embedded root stays derivable.
    files[`${AGENT_DIR}/settings.json`] = JSON.stringify({ packages: [SHIPPED_SIBLING] });
  }
  if (embedded) {
    files[`${EMBEDDED}/package.json`] = RELAY_MANIFEST;
    dirs[`${EMBEDDED}/skills`] = skills;
    for (const skill of skills) {
      dirs[`${EMBEDDED}/skills/${skill}`] = ["SKILL.md"];
      files[`${EMBEDDED}/skills/${skill}/SKILL.md`] = `# ${skill}\n`;
    }
  }
  if (registered === "npm" && embedded) {
    // A declared npm spec resolves into Pi's own install tree, not the shipped one.
    files[`${AGENT_DIR}/npm/node_modules/${RELAY_PACKAGE}/package.json`] = RELAY_MANIFEST;
    for (const skill of skills) files[`${AGENT_DIR}/npm/node_modules/${RELAY_PACKAGE}/skills/${skill}/SKILL.md`] = `# ${skill}\n`;
  }
  if (socket) files[SOCKET] = "";

  return {
    root: ROOT,
    home: HOME,
    platform: "linux",
    arch: "x64",
    nodeVersion: "26.13.0",
    env,
    binaryPath: (name) => (name === "node" ? "/usr/local/bin/node" : `/usr/bin/${name}`),
    version: () => null,
    readText: (path) => (path in files ? files[path] : null),
    exists: (path) => path in files || path in dirs,
    listDir: (path) => dirs[path] ?? [],
    git: (_root, args) => {
      if (args[0] === "rev-parse") return { status: 0, stdout: args.includes("--git-path") ? `${ROOT}/.git/hooks` : `${ROOT}/.git` };
      const key = args[args.length - 1];
      return key === "user.name" || key === "user.email" ? { status: 0, stdout: "An Operator" } : { status: 1, stdout: "" };
    },
    ghAuth: () => ({ authenticated: true, detail: "Logged in" }),
    httpJson: async () => ({ ok: false, body: null }),
  };
}

const withEnv = (ops, env) => ({ ...ops, env });
const rowOf = async (ops) => {
  const envelope = await runDoctor({ ops, inventoryText: README });
  const row = envelope.rows.find((candidate) => candidate.id === "relay");
  assert.ok(row, "the envelope carries the `relay` row");
  return { envelope, row };
};

/* ------------------------------------------------------------ the row's shape */

test("the relay row answers one published status, and names its cause", async () => {
  const fixtures = [
    withEnv(fakeOps(), {}),
    withEnv(fakeOps({ socket: false }), { PI_WEB_SESSION: "1" }),
    withEnv(fakeOps({ registered: null }), { PI_WEB_SESSION: "1" }),
    withEnv(fakeOps({ skills: ["relay"] }), { PI_WEB_SESSION: "1" }),
    withEnv(fakeOps(), { PI_WEB_SESSION: "1" }),
  ];
  const statuses = [];
  for (const ops of fixtures) {
    const { row } = await rowOf(ops);
    assert.ok(DOCTOR_CHECK_STATUSES.includes(row.status), `${row.status} is a published status`);
    statuses.push(row.status);
    if (!["ok", "not-applicable"].includes(row.status)) {
      assert.ok(row.advisory, `${row.status} names its cause instead of staying silent`);
      assert.match(row.advisory, /execute-phase <NN-slug> P<k>/u, "a dead end states the documented degradation route");
    }
  }
  assert.deepEqual(statuses, ["not-applicable", "unreachable", "missing", "missing", "ok"], "five environments, five honest answers");
});

test("the vocabulary is the host's, never a recalled spelling", () => {
  assert.equal(RELAY_PACKAGE, "@jmfederico/pi-relay");
  assert.deepEqual([...RELAY_SKILLS], ["relay", "relay-runner"]);
  assert.equal(RELAY_BRIDGE_PROTOCOL, "pi-web:session-dispatch:v1");
});

/* ------------------------------------------------------------- the two halves */

test("the bridge is evidence with an owner, never a probed fact", () => {
  const evidence = relayEvidence(withEnv(fakeOps(), { PI_WEB_SESSION: "1" }));
  assert.equal(evidence.bridge.protocol, RELAY_BRIDGE_PROTOCOL);
  assert.equal(evidence.bridge.observable, false, "a separate process cannot see a live session's listeners");
  assert.equal(evidence.bridge.owner, "pi-web");
  const verdict = evaluateRelay(evidence);
  assert.equal(verdict.status, "ok");
  assert.equal(verdict.advisory, null, "a healthy Relay adds no advisory to a healthy host");
});

test("no PI WEB session: the row is not-applicable and names the per-phase hand-off", async () => {
  const { row } = await rowOf(withEnv(fakeOps(), {}));
  assert.equal(row.status, "not-applicable");
  assert.equal(row.move, "report-only");
  assert.equal(row.advisory, null, "an absent enhancement is not a remediation");
  assert.equal(row.evidence.piWeb.present, false);
  assert.equal(row.evidence.degradation, DEGRADE, "the by-design route is stated, not implied");
  assert.match(renderDoctor(await runDoctor({ ops: withEnv(fakeOps(), {}), inventoryText: README })), /execute-phase <NN-slug> P<k>/u);
});

test("pi-web marker present and no session daemon: unreachable, and the marker alone never reads as ok", async () => {
  const { row } = await rowOf(withEnv(fakeOps({ socket: false }), { PI_WEB_SESSION: "1" }));
  assert.equal(row.status, "unreachable");
  assert.equal(row.evidence.sessiond.present, false);
  assert.match(row.advisory, new RegExp(`${RELAY_BRIDGE_PROTOCOL}|session daemon`, "u"));
  assert.match(row.advisory, /execute-phase <NN-slug> P<k>/u);
});

test("a configured daemon port is reported as a TCP endpoint, never as an absent socket", () => {
  const evidence = relayEvidence(withEnv(fakeOps({ socket: false }), { PI_WEB_SESSION: "1", PI_WEB_SESSIOND_PORT: "8510" }));
  assert.equal(evidence.sessiond.kind, "tcp");
  assert.equal(evidence.sessiond.endpoint, "127.0.0.1:8510");
  assert.equal(evidence.sessiond.present, null, "a TCP endpoint is not a file this probe can judge");
  assert.notEqual(evaluateRelay(evidence).status, "unreachable", "an unobservable endpoint is never reported as absent");
});

test("the daemon socket is pi-web's own resolution: PI_WEB_SESSIOND_SOCKET, then <PI_WEB_DATA_DIR>/sessiond.sock", () => {
  const configured = relayEvidence(withEnv(fakeOps({ socket: false }), { PI_WEB_SESSION: "1", PI_WEB_SESSIOND_SOCKET: "/run/pi-web/sessiond.sock" }));
  assert.equal(configured.sessiond.path, "/run/pi-web/sessiond.sock");
  const dataDir = relayEvidence(withEnv(fakeOps({ socket: false }), { PI_WEB_SESSION: "1", PI_WEB_DATA_DIR: "/srv/pi-web" }));
  assert.equal(dataDir.sessiond.path, "/srv/pi-web/sessiond.sock");
  const fallback = relayEvidence(withEnv(fakeOps(), { PI_WEB_SESSION: "1" }));
  assert.equal(fallback.sessiond.path, SOCKET, "the default data dir is ~/.pi-web");
  assert.equal(fallback.sessiond.present, true);
});

/* ---------------------------------------------------------- the installed set */

test("a registered path entry carrying both skills is ok", async () => {
  const { row } = await rowOf(withEnv(fakeOps(), { PI_WEB_SESSION: "1" }));
  assert.equal(row.status, "ok");
  assert.equal(row.evidence.package.name, RELAY_PACKAGE);
  assert.equal(row.evidence.package.path, EMBEDDED);
  assert.deepEqual(row.evidence.package.skills, { relay: true, "relay-runner": true });
  assert.equal(row.move, "report-only");
});

test("a registered npm spec resolves into Pi's own install tree", async () => {
  const { row } = await rowOf(withEnv(fakeOps({ registered: "npm" }), { PI_WEB_SESSION: "1" }));
  assert.equal(row.status, "ok");
  assert.equal(row.evidence.package.path, `${AGENT_DIR}/npm/node_modules/${RELAY_PACKAGE}`);
  assert.equal(row.evidence.package.source, `npm:${RELAY_PACKAGE}`);
});

test("a declared package missing a skill is missing, and names the skill", async () => {
  const { row } = await rowOf(withEnv(fakeOps({ skills: ["relay"] }), { PI_WEB_SESSION: "1" }));
  assert.equal(row.status, "missing");
  assert.equal(row.evidence.package.skills["relay-runner"], false);
  assert.match(row.advisory, /relay-runner/u);
  assert.equal(row.move, "residual", "a package that is present but incomplete is its host's decision, not an operator command");
});

test("absent under pi-web: the embedded path is named, npm is refused, and the instruction is the local install", async () => {
  const { row } = await rowOf(withEnv(fakeOps({ registered: null }), { PI_WEB_SESSION: "1" }));
  assert.equal(row.status, "missing");
  assert.equal(row.evidence.embedded.present, true);
  assert.equal(row.evidence.embedded.path, EMBEDDED);
  assert.match(row.advisory, /private/u, "the advisory says why npm is not the route");
  assert.match(row.advisory, /npm is not a route|not published on npm|private/u);
  assert.equal(row.instruction, `pi install ${EMBEDDED}`);
  assert.equal(row.move, "instruct-only");
  assert.equal(row.route, "instruct-only", "the declared route is the operator's, never an installer's");
});

test("absent under pi-web with no shipped copy on disk: no command is invented", async () => {
  const { row } = await rowOf(withEnv(fakeOps({ registered: null, embedded: false }), { PI_WEB_SESSION: "1" }));
  assert.equal(row.status, "missing");
  assert.equal(row.evidence.embedded.present, false);
  assert.equal(row.instruction, null, "PI WEB's own package registration is the route; this CLI prints no path it cannot see");
  assert.equal(row.move, "residual");
});

/* ------------------------------------------------------------ the invariants */

test("the probe spawns nothing, reads no network and writes nothing", () => {
  const calls = { version: 0, git: 0, ghAuth: 0, httpJson: 0 };
  const base = withEnv(fakeOps(), { PI_WEB_SESSION: "1" });
  const ops = {
    ...base,
    version: () => {
      calls.version += 1;
      return null;
    },
    git: () => {
      calls.git += 1;
      return { status: 1, stdout: "" };
    },
    ghAuth: () => {
      calls.ghAuth += 1;
      return null;
    },
    httpJson: async () => {
      calls.httpJson += 1;
      return { ok: false, body: null };
    },
  };
  const evidence = relayEvidence(ops);
  assert.equal(evidence.package.name, RELAY_PACKAGE, "the probe read the package it declared");
  assert.deepEqual(calls, { version: 0, git: 0, ghAuth: 0, httpJson: 0 }, "no version probe, no git, no forge auth, no HTTP");
});

test("a missing capability is an advisory, and the exit code stays 0", async () => {
  const { envelope, row } = await rowOf(withEnv(fakeOps({ registered: null }), { PI_WEB_SESSION: "1" }));
  assert.equal(row.requirement, "optional");
  assert.equal(row.status, "missing");
  assert.equal(envelope.exitCode, 0, "an optional capability never fails the run");
  assert.equal(envelope.summary.missing >= 1, true);
});

test("the row is one documented surface, and the inventory refuses the drift both ways", async () => {
  const { envelope } = await rowOf(withEnv(fakeOps(), { PI_WEB_SESSION: "1" }));
  assert.equal(envelope.inventory.rows, envelope.rows.length);
  assert.deepEqual(envelope.rows.map((row) => row.id).includes("relay"), true);
});
