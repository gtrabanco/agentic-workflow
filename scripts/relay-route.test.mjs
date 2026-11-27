#!/usr/bin/env node
// test-obligation: protects=packages/agentic-workflow/src/relay,packages/agentic-workflow/src/runner/catalog.json,skills/unit-lane/references/RELAY.md,docs/workflow/CONFIG.md,docs/workflow/SKILLS.md,README.md obligations=contract,failure-path

/**
 * relay-route.test.mjs — the lane's relay seam: the router's hint, its
 * degradation, the owner's recorded default and the contract wording (unit 82,
 * issue #722).
 *
 * The contract under test:
 *   - with pi-web detectable (`PI_WEB_SESSION=1`), a code unit's triage and its
 *     execute route name the Relay bootstrap: the packet path, the unit doc the
 *     charter points at, the leg identity and the leg count (phases + one
 *     coherence review);
 *   - a `bootstrap-needed` or `draft` packet orders the owner's answer before
 *     any dispatch, and the turn stops for it — the 719-class "just dispatch"
 *     reading is no longer the only instruction (issue #722 S1/S4);
 *   - `relay.seam` carries the owner's preselected answer (`ask`, the shipped
 *     default, or `inline`); it preselects the question and never skips it
 *     (S3);
 *   - without pi-web the router prints the per-phase `/execute-phase <unit> P<k>`
 *     fallback and says why relay is unavailable — the tool's own failure
 *     wording, never a claim that a dispatch happened, and the only degradation
 *     the contract defines (S2);
 *   - the machine block (route, `next:`, rows, read-set, fingerprint) is
 *     byte-identical in both environments: the hint is an addendum;
 *   - the two hand-off summaries (`docs/workflow/SKILLS.md`, `README.md`) name
 *     the seam's ask before they name Relay legs, each citing
 *     `references/RELAY.md` §Bootstrap as the owner (external-verify 2026-11-27,
 *     advisory 2).
 *
 * The fixture tree is `scripts/fixtures/relay-route/` (three feature units with
 * a packet in each state plus one docs unit); every mutating case copies it. The
 * global config is an empty scratch directory, so a case's project config is the
 * only one the router resolves.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** The runner's bin: the router answers as its `unit-route` subcommand. */
const SCRIPT = path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs");
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
  const env = { ...process.env, UNIT_ROUTE_REPO: root, PI_CODING_AGENT_DIR: path.join(scratch, "global") };
  if (piWeb) env.PI_WEB_SESSION = "1";
  else delete env.PI_WEB_SESSION;
  return spawnSync(process.execPath, [SCRIPT, "unit-route", ...args], { encoding: "utf8", env });
};

/** A copied fixture tree carrying the project config the case resolves. */
const withProjectConfig = (root, config) => {
  fs.mkdirSync(path.join(root, ".pi"), { recursive: true });
  fs.writeFileSync(path.join(root, ".pi", "agentic-workflow.json"), JSON.stringify(config));
  return root;
};

const lines = (stdout) => stdout.split("\n");
const relayLines = (stdout) => lines(stdout).filter((line) => line.startsWith("relay"));
const field = (stdout, name) => new RegExp(`^${name}: (.+)$`, "m").exec(stdout)?.[1] ?? null;

/** One repository file, read for a contract case (the prose the conductor follows). */
const repoFile = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
/** The body of a `## ` section, heading excluded (the parser's own semantics). */
const sectionBody = (text, heading) => {
  const start = text.indexOf(`## ${heading}`);
  assert.ok(start > -1, `the document declares ## ${heading}`);
  const rest = text.slice(start + 3 + heading.length);
  const end = rest.indexOf("\n## ");
  return end === -1 ? rest : rest.slice(0, end);
};
const SEAM = /^relay-seam: (ask|inline) \(relay\.seam; absent = ask\)/m;

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

test("pi-web present: bootstrap-needed mandates the ask and the stop (issue #722 S1)", () => {
  const result = run(["--triage", "20-relay-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, SEAM, "the absent key resolves to the shipped ask");
  assert.match(result.stdout, /^relay-seam: ask \(relay\.seam; absent = ask\)/m);
  const next = field(result.stdout, "relay-next");
  assert.ok(next, result.stdout);
  assert.match(next, /ASK the owner/i, "the addendum orders the question, never dispatch alone");
  assert.match(next, /STOP for the answer/i, "the ask is a stop, not an optional courtesy");
  assert.match(next, /relay legs/i, "the rela answer is named");
  assert.match(next, /inline/i, "the inline answer is named");
  const asked = next.indexOf("ASK the owner");
  const dispatched = next.indexOf("dispatch_relay");
  assert.ok(asked > -1 && dispatched > asked, "the ask precedes the dispatch it authorizes");
  const activated = next.indexOf("State: Active");
  assert.ok(activated > -1 && activated < dispatched, "the baton is activated before the dispatch §Bootstrap step 4 orders");
  assert.match(next, /as the final action/, "the dispatch is the turn's final operational action");
});

test("pi-web present: draft mandates the ask and the stop, and seeds no leg (issue #722 S1)", () => {
  const result = run(["--triage", "22-packet-draft-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^relay: draft — awaiting approval$/m);
  assert.match(result.stdout, /^relay-seam: ask \(relay\.seam; absent = ask\)/m);
  const next = field(result.stdout, "relay-next");
  assert.ok(next, result.stdout);
  assert.match(next, /ASK the owner/i);
  assert.match(next, /STOP for the answer/i);
  assert.match(next, /set `State: Active` in \.pi-web\/relays\/22-packet-draft-unit\/status\.md/);
  assert.match(next, /leg "1"/);
  assert.match(next, /as the final action/, "the dispatch is the turn's final operational action");
});

test("relay-seam: ask stays open, inline states the preselection (issue #722 S3)", () => {
  const asked = run(["--triage", "20-relay-unit"]);
  assert.equal(asked.status, 0, asked.stderr);
  assert.match(asked.stdout, /^relay-seam: ask \(relay\.seam; absent = ask\) — the question stays open$/m,
    "an ask default preselects nothing, exactly as RELAY.md §The seam's default says");
  const inline = run(["--triage", "20-relay-unit"], { root: withProjectConfig(tree(), { relay: { seam: "inline" } }) });
  assert.equal(inline.status, 0, inline.stderr);
  assert.match(inline.stdout, /^relay-seam: inline \(relay\.seam; absent = ask\) — preselects the inline answer, never skips the question$/m);
  for (const stdout of [asked.stdout, inline.stdout]) assert.match(stdout, /ASK the owner/, "neither value skips the question");
});

test("relay.seam: inline preselects the question and never skips it (issue #722 S3)", () => {
  const root = withProjectConfig(tree(), { relay: { seam: "inline" } });
  const result = run(["--triage", "20-relay-unit"], { root });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^relay-seam: inline \(relay\.seam; absent = ask\)/m);
  const next = field(result.stdout, "relay-next");
  assert.ok(next, result.stdout);
  assert.match(next, /ASK the owner/i, "inline preselects the answer, it never skips the question");
  assert.match(next, /STOP for the answer/i);
});

test("relay.seam: inline never reaches the machine block or the route", () => {
  const root = withProjectConfig(tree(), { relay: { seam: "inline" } });
  const inline = run(["20-relay-unit"], { root });
  const asked = run(["20-relay-unit"], { root: tree() });
  assert.equal(inline.status, 0, inline.stderr);
  assert.equal(asked.status, 0, asked.stderr);
  const machine = (stdout) => lines(stdout).filter((line) => !line.startsWith("relay"));
  assert.deepEqual(machine(inline.stdout), machine(asked.stdout));
  assert.equal(field(inline.stdout, "route"), "execute");
  assert.match(inline.stdout, /^next: \/execute-phase 20-relay-unit P1 \(tier: cheap\)$/m);
});

test("pi-web absent: triage prints the degradation and no dispatch hint", () => {
  const result = run(["--triage", "20-relay-unit"], { piWeb: false });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`^relay: unavailable — ${BRIDGE}$`, "m"));
  assert.equal(field(result.stdout, "relay-next"), null, "no leg is seeded while dispatch is unavailable");
  assert.equal(field(result.stdout, "relay-seam"), null, "the seam question does not exist while relay does not (S2)");
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
  assert.equal(json.relay.seam, "ask", "the triage answer carries the resolved seam");
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
  assert.equal(json.relay.seam, null, "no seam is resolved while relay is unavailable");
  assert.match(json.relay.reason, new RegExp(BRIDGE));
});

/* ------------------------------------------------------------ the contract */

/*
 * The wording the conductor follows is a contract surface too (issue #722 S1):
 * the red run pinned the router's addendum, and these cases pin the two prose
 * owners to the same mandate. RELAY.md owns the ask; SKILL.md cites it.
 */

test("RELAY.md §Bootstrap mandates the ask-and-stop and names both answers", () => {
  const bootstrap = sectionBody(repoFile("skills/unit-lane/references/RELAY.md"), "Bootstrap");
  assert.match(bootstrap, /ASK the owner/i, "the ask is a step, not a condition");
  assert.match(bootstrap, /STOP for the answer/i, "the answer is awaited, never assumed");
  assert.match(bootstrap, /relay\.seam/, "the recorded default is named");
  assert.match(bootstrap, /inline/i, "the inline answer is named");
  assert.match(bootstrap, /\.\/execute-phase|\/execute-phase/, "the inline answer names the per-phase hand-off");
});

test("SKILL.md step 4 hands the unapproved seam to the ask-and-stop", () => {
  const skill = repoFile("skills/unit-lane/SKILL.md");
  assert.match(skill, /ask the owner \(relay legs or inline\) and stop for the answer/i);
  assert.match(skill, /§Bootstrap/);
});

test("RELAY.md §Degradation keeps its unavailable-only meaning (issue #722 S2)", () => {
  const degradation = sectionBody(repoFile("skills/unit-lane/references/RELAY.md"), "Degradation");
  assert.match(degradation, /relay: unavailable/);
  assert.match(degradation, /not a degradation/i, "a present-but-unapproved packet is excluded by name");
  assert.match(degradation, /bootstrap-needed/);
  assert.match(degradation, /draft/);
  const inline = degradation.match(/→ Next: \/execute-phase[^\n]*/)?.[0] ?? "";
  assert.ok(inline, "the per-phase fallback stays printed");
});

test("the 719-class path is unreachable: no skill surface permits a silent inline hand-off", () => {
  const relief = repoFile("skills/unit-lane/references/RELAY.md") + repoFile("skills/unit-lane/SKILL.md");
  assert.doesNotMatch(relief, /The lane runs inline/);
  assert.doesNotMatch(relief, /conductor route/i);
  assert.doesNotMatch(relief, /silently degrade/i);
});

test("CONFIG.md documents relay.seam: absent means ask, and never a bypass", () => {
  const config = repoFile("docs/workflow/CONFIG.md");
  assert.match(config, /^\| `relay` \| base \|/m, "the section is in the map");
  assert.match(config, /`relay\.seam`/);
  assert.match(config, /absent (?:key )?(?:means|=) `ask`/i);
  assert.match(config, /never bypass/i);
});

test("the hand-off summaries name the seam's ask before Relay legs", () => {
  for (const file of ["docs/workflow/SKILLS.md", "README.md"]) {
    const text = repoFile(file);
    assert.match(text, /first asks the owner/, `${file} orders the question before the hand-off`);
    assert.match(text, /`references\/RELAY\.md` §Bootstrap/, `${file} cites the seam's owner`);
  }
});
