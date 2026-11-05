#!/usr/bin/env node

/**
 * relay-route.test.mjs — the router's relay hint and its degradation (unit 82).
 *
 * The contract under test (S1, S2, S14, S24):
 *   - with pi-web detectable (`PI_WEB_SESSION=1`), a code unit's triage and its
 *     execute route name the Relay bootstrap: the packet path, the unit doc the
 *     charter points at, the leg identity and the leg count (phases + one
 *     coherence review);
 *   - without it, the router prints the per-phase `/execute-phase <unit> P<k>`
 *     fallback and says why relay is unavailable — the tool's own failure
 *     wording, never a claim that a dispatch happened;
 *   - the machine block (route, `next:`, rows, read-set, fingerprint) is
 *     byte-identical in both environments: the hint is an addendum.
 *
 * The fixture tree is `scripts/fixtures/relay-route/` (three feature units with
 * a packet in each state plus one docs unit); every mutating case copies it.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts", "unit-route.mjs");
const FIXTURE = path.join(ROOT, "scripts", "fixtures", "relay-route");
const BRIDGE = "dispatch_relay requires PI WEB's session dispatch bridge";

let scratch;

before(() => {
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), "relay-route-"));
});

after(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
});

let copies = 0;
const tree = () => {
  const dir = path.join(scratch, `tree-${++copies}`);
  fs.cpSync(FIXTURE, dir, { recursive: true });
  return dir;
};

/** Run the router with pi-web detection explicitly on or off. */
const run = (args, { root = FIXTURE, piWeb = true } = {}) => {
  const env = { ...process.env, UNIT_ROUTE_REPO: root };
  if (piWeb) env.PI_WEB_SESSION = "1";
  else delete env.PI_WEB_SESSION;
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", env });
};

const lines = (stdout) => stdout.split("\n");
const relayLines = (stdout) => lines(stdout).filter((line) => line.startsWith("relay"));
const field = (stdout, name) => new RegExp(`^${name}: (.+)$`, "m").exec(stdout)?.[1] ?? null;

/* ----------------------------------------------------------------- detection */

test("pi-web present: triage names the bootstrap, the unit doc, leg 1 and the leg count", () => {
  const result = run(["--triage", "20-relay-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^relay: bootstrap-needed — no packet at \.pi-web\/relays\/20-relay-unit$/m);
  const next = field(result.stdout, "relay-next");
  assert.ok(next, result.stdout);
  assert.match(next, /create \.pi-web\/relays\/20-relay-unit\/ \(charter → docs\/features\/20-relay-unit\/SPEC\.md\)/);
  assert.match(next, /dispatch_relay\(packet: "\.pi-web\/relays\/20-relay-unit", leg: "1"\)/);
  assert.match(next, /3 = 2 phases \+ 1 coherence review/, "S13: leg count = phase count + review legs");
});

test("pi-web absent: triage prints the degradation and no dispatch hint", () => {
  const result = run(["--triage", "20-relay-unit"], { piWeb: false });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`^relay: unavailable — ${BRIDGE}$`, "m"));
  assert.equal(field(result.stdout, "relay-next"), null, "no leg is seeded while dispatch is unavailable");
});

test("pi-web present: a drafted packet waits for approval and seeds no leg", () => {
  const result = run(["--triage", "22-packet-draft-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^relay: draft — awaiting approval$/m);
  const next = field(result.stdout, "relay-next");
  assert.ok(next, result.stdout);
  assert.match(next, /set `State: Active` in \.pi-web\/relays\/22-packet-draft-unit\/status\.md/);
  assert.match(next, /leg "1"/);
});

test("pi-web present: an active packet names the next leg", () => {
  const result = run(["--triage", "21-packet-active-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^relay: active \(leg 2\)$/m);
});

test("pi-web present: a completed packet seeds nothing", () => {
  const root = tree();
  fs.writeFileSync(path.join(root, ".pi-web/relays/21-packet-active-unit/status.md"), "# Baton\n\nState: Complete\nLegs: 2 → 2\nPhase: done\n");
  const result = run(["--triage", "21-packet-active-unit"], { root });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^relay: complete$/m);
  assert.equal(field(result.stdout, "relay-next"), null);
});

test("an unreadable packet state is reported, never guessed", () => {
  const root = tree();
  fs.writeFileSync(path.join(root, ".pi-web/relays/21-packet-active-unit/status.md"), "# Baton\n\nState: Whatever\nLegs: 1 → 2\n");
  const result = run(["--triage", "21-packet-active-unit"], { root });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^relay: unreadable — state `Whatever` is outside the closed set$/m);
  assert.equal(field(result.stdout, "relay-next"), null);
});

test("a docs unit never gets a relay hint: it has no execution leg", () => {
  const result = run(["--triage", "23-docs-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(relayLines(result.stdout), []);
});

/* ------------------------------------------------------------------- routing */

test("router, pi-web absent: the per-phase fallback is printed and unchanged", () => {
  const result = run(["20-relay-unit"], { piWeb: false });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(field(result.stdout, "route"), "execute");
  assert.equal(field(result.stdout, "next"), "/execute-phase 20-relay-unit P1 (tier: cheap)");
  assert.match(result.stdout, new RegExp(`^relay: unavailable — ${BRIDGE}$`, "m"), "the reason is named once");
  assert.equal((result.stdout.match(new RegExp(BRIDGE.replace(/[']/g, "."), "g")) ?? []).length, 1);
});

test("router, pi-web present: the hint is an addendum, the machine block is identical", () => {
  const withPi = run(["20-relay-unit"], { piWeb: true });
  const withoutPi = run(["20-relay-unit"], { piWeb: false });
  assert.equal(withPi.status, 0, withPi.stderr);
  assert.equal(withoutPi.status, 0, withoutPi.stderr);
  const machine = (stdout) => lines(stdout).filter((line) => !line.startsWith("relay"));
  assert.deepEqual(machine(withPi.stdout), machine(withoutPi.stdout));
  assert.match(withPi.stdout, /^relay: bootstrap-needed — no packet at \.pi-web\/relays\/20-relay-unit$/m);
  assert.match(withPi.stdout, /^relay-next: create /m);
});

test("router, pi-web present: an active packet routes to its next leg", () => {
  const result = run(["21-packet-active-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(field(result.stdout, "next"), "/execute-phase 21-packet-active-unit P1 (tier: cheap)");
  assert.match(result.stdout, /^relay: active \(leg 2\)$/m);
});

test("the hint never changes the route or the read-set", () => {
  const withPi = run(["21-packet-active-unit"], { piWeb: true });
  const withoutPi = run(["21-packet-active-unit"], { piWeb: false });
  for (const name of ["unit", "status", "route", "next", "rows"]) {
    assert.equal(field(withPi.stdout, name), field(withoutPi.stdout, name), `${name} must not depend on the environment`);
  }
  assert.equal(
    /read-set \((\d+)\):/.exec(withPi.stdout)?.[1],
    /read-set \((\d+)\):/.exec(withoutPi.stdout)?.[1],
  );
});

/* ---------------------------------------------------------------------- JSON */

test("triage JSON carries the relay answer as data", () => {
  const result = run(["--triage", "20-relay-unit", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const json = JSON.parse(result.stdout);
  assert.equal(json.relay.kind, "bootstrap-needed");
  assert.equal(json.relay.packet, ".pi-web/relays/20-relay-unit");
  assert.equal(json.relay.unitDoc, "docs/features/20-relay-unit/SPEC.md");
  assert.equal(json.relay.legs, 3);
  assert.deepEqual(json.relay.tiers, { execute: "cheap", "coherence-review": "strong" });
  const withoutMarker = JSON.parse(run(["--triage", "20-relay-unit", "--json"], { piWeb: false }).stdout);
  assert.deepEqual(json.steps, withoutMarker.steps, "the step list is untouched");
  assert.deepEqual(json.tiers, withoutMarker.tiers, "the per-step tiers are untouched");
});

test("triage JSON reports the degradation without a packet path", () => {
  const result = run(["--triage", "20-relay-unit", "--json"], { piWeb: false });
  assert.equal(result.status, 0, result.stderr);
  const json = JSON.parse(result.stdout);
  assert.equal(json.relay.kind, "unavailable");
  assert.equal(json.relay.packet, null);
  assert.equal(json.relay.legs, null);
  assert.match(json.relay.reason, new RegExp(BRIDGE));
});
