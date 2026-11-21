#!/usr/bin/env node
// test-obligation: protects=scripts/npm-availability-wait.mjs obligations=contract,failure-path

/**
 * npm-availability-wait.test.mjs — the post-publish availability gate (issue #481).
 *
 * Incident (2026-11-09, run 42638128017): all three canary packages published,
 * but `@gtrabanco/agentic-workflow-schema@5.0.0-canary.20261109.1` returned 404
 * on its tarball URL for ~10 minutes while the packument, the `canary` dist-tag
 * and the git tag were already visible. The publish was correct — the shasum in
 * the run log matched the registry once the CDN caught up. The defect was the
 * announcement: the cut tagged and released immediately after `npm publish`.
 *
 * The gate waits per package until the tarball returns 200 AND the downloaded
 * bytes hash to the packument's `dist.shasum`, then lets the workflow announce.
 * Every case below injects the network, the clock and the sleeper: the suite
 * makes no live registry call.
 *
 * Owner decision 2026-11-21 (run 44849041090): the packument of a published
 * canary stayed cache-stale past the whole 10-minute budget while three
 * siblings were available within minutes, so a healthy cut failed its wait and
 * the tag/pre-release never got created. Two contract changes:
 *   - the packument probe carries a cache-buster query (the registry's own
 *     recommendation for fresh reads), so CDN staleness stops being the wait's
 *     dominant failure;
 *   - a TIMEOUT degrades to a WARNING (exit 0) — the lag is self-healing and
 *     the run must not lose its announcement to it — while real corruption
 *     still fails the run: a shasum mismatch that survives the budget and a
 *     malformed dist are FATAL (exit 1).
 *
 * Covers:
 *   - REPRODUCER: a 404 tarball while the packument lists the version is never
 *     "available", and the availability signal follows the 200 + shasum match
 *   - a version that appears in the packument late is waited for
 *   - two packages: one available early never short-circuits the other
 *   - integrity: 200 with wrong bytes never passes; mismatch is retried
 *   - integrity: 200 with wrong bytes never passes; mismatch is retried and
 *     becomes FATAL at the timeout (corruption, not lag)
 *   - TIMEOUT is a WARNING: exit 0, the package named on stderr, the cut may
 *     proceed — the packument cache lag is self-healing
 *   - FATAL: malformed dist (immediate) and a mismatch that survives the
 *     budget exit non-zero
 *   - every packument probe carries a distinct cache-buster query
 *   - fail closed: a version the packument never lists never reads available
 *     (reported as a timeout warning, never as available)
 *   - malformed dist (no tarball/shasum) fails immediately
 *   - `--plan publish-plan.tsv` and explicit `name@version` inputs
 *   - scoped-name URL encoding, default 20 s interval and 10 min timeout
 *   - usage errors (no input, unknown flag, bad duration, unreadable plan)
 *   - the suite carries no live registry URL and the script writes no signal
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  REGISTRY,
  parseArgs,
  parseDuration,
  parsePackageSpec,
  parsePlan,
  packumentUrl,
  sha1Hex,
  waitForAvailability,
} from "./npm-availability-wait.mjs";
import { tempRoot } from "./temp-root.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(repoRoot, "scripts", "npm-availability-wait.mjs");

const bytesOf = (text) => new TextEncoder().encode(text);
const digestOf = (text) => createHash("sha1").update(bytesOf(text)).digest("hex");

/** A fake `Response` for the fields the gate reads. */
const response = ({ status = 200, body = "", json = null }) => ({
  ok: status >= 200 && status < 300,
  status,
  async arrayBuffer() {
    return bytesOf(body).buffer;
  },
  async json() {
    if (json === null) throw new Error("no json body");
    return json;
  },
});

/** A packument listing one version with the shasum of the served bytes. */
const packument = (name, version, { tarball, shasum, dist = true } = {}) => ({
  name,
  "dist-tags": { latest: version },
  versions: {
    [version]: dist
      ? {
          version,
          dist: {
            tarball: tarball ?? tarballOf(name, version),
            shasum: shasum ?? digestOf(`${name}@${version}`),
          },
        }
      : { version },
  },
});

/** A controllable clock: `sleep` advances the same `now` the gate reads. */
const makeClock = (start = 0) => {
  let now = start;
  return {
    now: () => now,
    sleep: async (ms) => {
      now += ms;
    },
  };
};

/** A fetch double: a URL → responder map plus an ordered call log.
 * The cache-buster query is opaque to routing (a CDN serves the same packument
 * for any query string), so routes match on the URL path only; the raw URL,
 * query included, stays in the call log for the cache-bust assertions. */
const makeFetch = (routes, calls = []) => {
  const fn = async (url) => {
    const raw = String(url);
    const key = raw.split("?")[0];
    const route = routes[key];
    if (route === undefined) {
      calls.push({ url: key, status: 404 });
      return response({ status: 404 });
    }
    const answer = typeof route === "function" ? route(calls.filter((c) => c.url.split("?")[0] === key).length) : route;
    calls.push({ url: raw, status: answer.status });
    return answer;
  };
  fn.calls = calls;
  return fn;
};

const registryOf = (name) => `${REGISTRY}/${name.replace("/", "%2F")}`;
const tarballOf = (name, version) =>
  `${REGISTRY}/${name.replace("/", "%2F")}/-/${name.split("/").pop()}-${version}.tgz`;

const runGate = async (packages, { fetchImpl, clock, timeoutMs = 5_000, intervalMs = 1_000, logger = () => {} }) => {
  const events = [];
  const result = await waitForAvailability({
    packages,
    timeoutMs,
    intervalMs,
    fetchImpl,
    sleepImpl: clock.sleep,
    now: clock.now,
    logger: (event) => {
      events.push(event);
      logger(event);
    },
  });
  return { result, events };
};

// ---------------------------------------------------------------------------
// The frozen-failure corpus
// ---------------------------------------------------------------------------

test("REPRODUCER: a tarball returning 404 while its packument lists the version is never available", async () => {
  const name = "@fixture/slow";
  const version = "5.0.0-canary.20261109.1";
  const body = `${name}@${version} tarball`;
  const calls = [];
  const fetchImpl = makeFetch(
    {
      [registryOf(name)]: response({ json: packument(name, version, { shasum: digestOf(body) }) }),
      // The incident: packument serves the version, tarball 404s for 3 polls.
      [tarballOf(name, version)]: (seen) => (seen < 3 ? response({ status: 404 }) : response({ body })),
    },
    calls,
  );
  const clock = makeClock();
  const { result, events } = await runGate([{ name, version }], {
    fetchImpl,
    clock,
    intervalMs: 1_000,
  });
  const order = [...calls.map((call) => ({ kind: "fetch", ...call })), ...events.map((event) => ({ kind: event.type, ...event }))];
  const firstAvailable = order.findIndex((entry) => entry.kind === "available");
  const lastTarball = order.map((entry) => entry.kind === "fetch" && entry.url === tarballOf(name, version));
  const first200 = lastTarball.lastIndexOf(true);
  assert.equal(result.ok, true, "the tarball does become available");
  assert.ok(firstAvailable !== -1, "the gate reports availability");
  assert.ok(firstAvailable > first200, "no availability signal before the tarball returned 200");
  assert.ok(
    order.slice(0, firstAvailable).every((entry) => entry.kind !== "available"),
    "exactly one availability signal, and it follows the successful tarball read",
  );
  assert.equal(result.available[0].attempts, 4, "three 404 polls then the successful one");
  assert.equal(events.filter((event) => event.type === "available").length, 1);
  assert.equal(events[0].type, "wait", "the first poll records the 404 as a wait, never as available");
});

test("a version that appears in the packument late is waited for", async () => {
  const name = "@fixture/late-packument";
  const version = "1.2.3";
  const body = "late packument";
  const fetchImpl = makeFetch({
    [registryOf(name)]: (seen) =>
      seen < 1 ? response({ json: { versions: {} } }) : response({ json: packument(name, version, { shasum: digestOf(body) }) }),
    [tarballOf(name, version)]: response({ body }),
  });
  const { result } = await runGate([{ name, version }], { fetchImpl, clock: makeClock(), intervalMs: 50 });
  assert.equal(result.ok, true, "the packument lag is tolerated inside the budget");
  assert.equal(result.available[0].attempts, 2, "one poll before the version landed, one after");
});

test("two packages: an early one never short-circuits the package still unavailable", async () => {
  const a = { name: "@fixture/a", version: "1.0.0" };
  const b = { name: "@fixture/b", version: "1.0.0" };
  const bodyA = "a";
  const bodyB = "b";
  const fetchImpl = makeFetch({
    [registryOf(a.name)]: response({ json: packument(a.name, a.version, { shasum: digestOf(bodyA) }) }),
    [tarballOf(a.name, a.version)]: response({ body: bodyA }),
    [registryOf(b.name)]: response({ json: packument(b.name, b.version, { shasum: digestOf(bodyB) }) }),
    [tarballOf(b.name, b.version)]: (seen) => (seen < 2 ? response({ status: 404 }) : response({ body: bodyB })),
  });
  const { result } = await runGate([a, b], { fetchImpl, clock: makeClock(), intervalMs: 100 });
  assert.equal(result.ok, true);
  assert.equal(result.available.length, 2, "both packages are accounted for");
  assert.equal(result.available.find((entry) => entry.name === b.name).attempts, 3);
});

test("integrity: a 200 with bytes that do not hash to the shasum never reads available", async () => {
  const name = "@fixture/corrupt";
  const version = "2.0.0";
  const fetchImpl = makeFetch({
    [registryOf(name)]: response({ json: packument(name, version, { shasum: digestOf("the real bytes") }) }),
    [tarballOf(name, version)]: response({ body: "the wrong bytes" }),
  });
  const clock = makeClock();
  const { result, events } = await runGate([{ name, version }], {
    fetchImpl,
    clock,
    timeoutMs: 100,
    intervalMs: 40,
  });
  assert.equal(result.ok, false, "a mismatch must never pass");
  assert.match(result.failures[0].reason, /shasum mismatch/);
  assert.ok(events.every((event) => event.type !== "available"), "no availability signal for corrupted bytes");
});

test("integrity: a 200 with bytes that do not hash to the shasum never reads available, and a mismatch that survives the budget is FATAL", async () => {
  const name = "@fixture/corrupt";
  const version = "2.0.0";
  const fetchImpl = makeFetch({
    [registryOf(name)]: response({ json: packument(name, version, { shasum: digestOf("the real bytes") }) }),
    [tarballOf(name, version)]: response({ body: "the wrong bytes" }),
  });
  const clock = makeClock();
  const { result, events } = await runGate([{ name, version }], {
    fetchImpl,
    clock,
    timeoutMs: 100,
    intervalMs: 40,
  });
  assert.equal(result.ok, false, "a mismatch that survives the budget must fail the run, not warn");
  assert.match(result.failures[0].reason, /shasum mismatch/);
  assert.ok(events.every((event) => event.type !== "available"), "no availability signal for corrupted bytes");
  assert.equal(result.warnings.length, 0, "integrity corruption is never degraded to a warning");
});

test("timeout is a WARNING: the package is named, never reads available, and the run may proceed", async () => {
  const name = "@fixture/missing-tarball";
  const version = "3.0.0";
  const fetchImpl = makeFetch({
    [registryOf(name)]: response({ json: packument(name, version) }),
    [tarballOf(name, version)]: response({ status: 404 }),
  });
  const { result, events } = await runGate([{ name, version }], {
    fetchImpl,
    clock: makeClock(),
    timeoutMs: 100,
    intervalMs: 40,
  });
  assert.equal(result.ok, true, "a timeout after a healthy publish is CDN lag, not corruption");
  assert.equal(result.failures.length, 0);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].name, name);
  assert.equal(result.warnings[0].timedOut, true);
  assert.match(result.warnings[0].reason, /404/);
  assert.match(result.warnings[0].message, /@fixture\/missing-tarball@3\.0\.0/);
  assert.match(result.warnings[0].message, /404/);
  assert.ok(events.every((event) => event.type !== "available"), "a timed-out package is never announced as available");
});

test("the timeout verdict follows the last reason: only an integrity mismatch escalates to FATAL", async () => {
  const lagging = { name: "@fixture/lagging-packument", version: "1.0.0" };
  const corrupting = { name: "@fixture/mismatch-at-timeout", version: "1.0.0" };
  const fetchImpl = makeFetch({
    [registryOf(lagging.name)]: response({ json: { versions: {} } }),
    [registryOf(corrupting.name)]: response({ json: packument(corrupting.name, corrupting.version, { shasum: digestOf("real") }) }),
    [tarballOf(corrupting.name, corrupting.version)]: response({ body: "served bytes" }),
  });
  const { result } = await runGate([lagging, corrupting], {
    fetchImpl,
    clock: makeClock(),
    timeoutMs: 90,
    intervalMs: 30,
  });
  assert.equal(result.ok, false, "the surviving mismatch fails the run");
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].name, corrupting.name);
  assert.match(result.failures[0].reason, /shasum mismatch/);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].name, lagging.name);
});

test("fail closed: a version the packument never lists never reads available (a timeout warning, never an availability signal)", async () => {
  const name = "@fixture/unlisted";
  const version = "4.0.0";
  const fetchImpl = makeFetch({
    [registryOf(name)]: response({ json: { versions: { "3.9.0": { version: "3.9.0" } } } }),
  });
  const { result } = await runGate([{ name, version }], {
    fetchImpl,
    clock: makeClock(),
    timeoutMs: 90,
    intervalMs: 30,
  });
  assert.equal(result.ok, true, "the unlisted version degrades to a warning by the 2026-11-21 decision");
  assert.equal(result.available.length, 0);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0].reason, /does not list 4\.0\.0/);
});

test("a malformed dist (no tarball or shasum) fails immediately instead of polling forever", async () => {
  const name = "@fixture/malformed";
  const version = "1.0.0";
  const fetchImpl = makeFetch({
    [registryOf(name)]: response({ json: packument(name, version, { dist: false }) }),
  });
  const clock = makeClock();
  const { result } = await runGate([{ name, version }], {
    fetchImpl,
    clock,
    timeoutMs: 5_000,
    intervalMs: 1_000,
  });
  assert.equal(result.ok, false);
  assert.match(result.failures[0].reason, /dist\.tarball/);
  assert.equal(clock.now(), 0, "no polling budget was spent: the registry state is malformed, not late");
});

test("every packument probe carries a distinct cache-buster query (CDN staleness is not a wait state)", async () => {
  const name = "@fixture/cache-bust";
  const version = "1.0.0";
  const body = "cache-busted";
  const calls = [];
  const fetchImpl = makeFetch({
    // The version lands on the packument only after the first poll.
    [registryOf(name)]: (seen) =>
      seen < 1 ? response({ json: { versions: {} } }) : response({ json: packument(name, version, { shasum: digestOf(body) }) }),
    [tarballOf(name, version)]: response({ body }),
  }, calls);
  const { result } = await runGate([{ name, version }], { fetchImpl, clock: makeClock(), intervalMs: 50 });
  assert.equal(result.ok, true);
  const packumentUrls = calls.map((call) => call.url).filter((url) => url.startsWith(`${REGISTRY}/${name.replace("/", "%2F")}`) && !url.includes("/-/"));
  assert.equal(packumentUrls.length, 2, "one packument request per poll");
  assert.ok(packumentUrls.every((url) => url.includes("?")), "each packument request busts the CDN cache with a query");
  assert.notEqual(packumentUrls[0], packumentUrls[1], "the cache-buster is distinct per attempt");
  const tarballUrls = calls.map((call) => call.url).filter((url) => url.includes("/-/"));
  assert.ok(tarballUrls.every((url) => !url.includes("?")), "the tarball URL stays the packument's canonical one");
});

// ---------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------

test("the defaults are the issue's: 20 s interval and 10 min timeout", () => {
  assert.equal(DEFAULT_INTERVAL_MS, 20_000);
  assert.equal(DEFAULT_TIMEOUT_MS, 600_000);
});

test("parseDuration accepts ms, s and m; rejects anything else", () => {
  assert.equal(parseDuration("20"), 20_000);
  assert.equal(parseDuration("20s"), 20_000);
  assert.equal(parseDuration("20m"), 1_200_000);
  assert.equal(parseDuration("250ms"), 250);
  assert.equal(parseDuration("nope"), null);
  assert.equal(parseDuration("-1"), null);
});

test("scoped package names are URL-encoded for the packument and tarball", () => {
  assert.equal(packumentUrl("@scope/pkg"), `${REGISTRY}/@scope%2Fpkg`);
  assert.equal(packumentUrl("plain"), `${REGISTRY}/plain`);
});

test("parsePackageSpec reads name@version and rejects a missing side", () => {
  assert.deepEqual(parsePackageSpec("@scope/pkg@1.2.3"), { name: "@scope/pkg", version: "1.2.3" });
  assert.deepEqual(parsePackageSpec("plain@1.0.0-canary.1"), { name: "plain", version: "1.0.0-canary.1" });
  assert.equal(parsePackageSpec("plain"), null);
  assert.equal(parsePackageSpec("@1.2.3"), null);
});

test("parsePlan reads the publish-plan.tsv name/version columns and skips blanks", () => {
  const plan = parsePlan(
    [
      "@gtrabanco/agentic-workflow-schema\tagentic-workflow-schema\t5.0.0\tcanary",
      "",
      "@gtrabanco/pi-agentic-workflow\tpi-agentic-workflow\t5.0.0\tcanary",
    ].join("\n"),
  );
  assert.deepEqual(plan, [
    { name: "@gtrabanco/agentic-workflow-schema", version: "5.0.0" },
    { name: "@gtrabanco/pi-agentic-workflow", version: "5.0.0" },
  ]);
});

test("parseArgs collects explicit pairs and plan files, with the declared defaults", () => {
  assert.deepEqual(parseArgs([]), { packages: [], plan: null, timeoutMs: DEFAULT_TIMEOUT_MS, intervalMs: DEFAULT_INTERVAL_MS });
  const args = parseArgs(["--plan", "plan.tsv", "--timeout", "1m", "--interval", "250ms", "@scope/pkg@1.2.3"]);
  assert.equal(args.plan, "plan.tsv");
  assert.equal(args.timeoutMs, 60_000);
  assert.equal(args.intervalMs, 250);
  assert.deepEqual(args.packages, [{ name: "@scope/pkg", version: "1.2.3" }]);
  assert.equal(parseArgs(["--what"]), null);
});

test("main: --plan waits for every row; explicit pairs work for a publish job", async () => {
  const { main } = await import("./npm-availability-wait.mjs");
  const name = "@fixture/plan";
  const version = "5.0.0-canary.20261109.1";
  const body = "plan tarball";
  const fetchImpl = makeFetch({
    [registryOf(name)]: response({ json: packument(name, version, { shasum: digestOf(body) }) }),
    [tarballOf(name, version)]: response({ body }),
  });
  const dir = tempRoot("npm-availability-wait-");
  const planPath = path.join(dir, "publish-plan.tsv");
  fs.writeFileSync(planPath, `${name}\tfixture\t${version}\tcanary\n`, "utf8");
  const stderr = [];
  const collect = (line) => stderr.push(line);
  const planClock = makeClock();
  const deps = { fetchImpl, sleepImpl: planClock.sleep, now: planClock.now, writeErr: collect, writeOut: () => {} };
  assert.equal(await main(["--plan", planPath, "--timeout", "1s", "--interval", "100ms"], deps), 0);
  assert.ok(stderr.some((line) => line.includes(`${name}@${version}`) && line.includes("available")));

  const pairClock = makeClock();
  const pairDeps = {
    fetchImpl: makeFetch({
      [registryOf("plain")]: response({ json: packument("plain", "1.0.0", { shasum: digestOf("plain") }) }),
      [tarballOf("plain", "1.0.0")]: response({ body: "plain" }),
    }),
    sleepImpl: pairClock.sleep,
    now: pairClock.now,
    writeErr: collect,
    writeOut: () => {},
  };
  assert.equal(await main(["plain@1.0.0"], pairDeps), 0);
});

test("main: a timeout exits 0 with a WARNING naming the package on stderr", async () => {
  const { main } = await import("./npm-availability-wait.mjs");
  const name = "@fixture/never";
  const version = "9.9.9";
  const err = [];
  const clock = makeClock();
  const code = await main([`${name}@${version}`, "--timeout", "80ms", "--interval", "20ms"], {
    fetchImpl: makeFetch({
      [registryOf(name)]: response({ json: packument(name, version) }),
      [tarballOf(name, version)]: response({ status: 404 }),
    }),
    sleepImpl: clock.sleep,
    now: clock.now,
    writeErr: (line) => err.push(line),
    writeOut: () => {},
  });
  assert.equal(code, 0, "the timeout degrades to a warning (owner decision 2026-11-21)");
  assert.ok(err.some((line) => line.includes(`${name}@${version}`) && line.includes("TIMEOUT") && line.includes("WARNING")));
});

test("main: a fatal (malformed dist) exits non-zero and names the package", async () => {
  const { main } = await import("./npm-availability-wait.mjs");
  const name = "@fixture/broken-dist";
  const version = "1.0.0";
  const err = [];
  const clock = makeClock();
  const code = await main([`${name}@${version}`, "--timeout", "1s", "--interval", "20ms"], {
    fetchImpl: makeFetch({
      [registryOf(name)]: response({ json: packument(name, version, { dist: false }) }),
    }),
    sleepImpl: clock.sleep,
    now: clock.now,
    writeErr: (line) => err.push(line),
    writeOut: () => {},
  });
  assert.equal(code, 1, "malformed registry state still fails the run");
  assert.ok(err.some((line) => line.includes(`${name}@${version}`) && line.includes("FAILED")));
  assert.equal(clock.now(), 0, "the fatal is immediate: no polling budget was spent");
});

test("main: usage errors exit 2 (no input, bad duration, unreadable plan)", async () => {
  const { main } = await import("./npm-availability-wait.mjs");
  const err = [];
  const deps = {
    fetchImpl: async () => response({ status: 404 }),
    sleepImpl: async () => {},
    now: () => 0,
    writeErr: (line) => err.push(line),
    writeOut: () => {},
  };
  assert.equal(await main([], deps), 2);
  assert.equal(await main(["plain@1.0.0", "--timeout", "soon"], deps), 2);
  assert.equal(await main(["--plan", path.join(tempRoot("npm-availability-wait-"), "absent.tsv")], deps), 2);
  assert.ok(err.length >= 3, "each refusal explains itself on stderr");
});

test("the script writes no signal", () => {
  const script = fs.readFileSync(scriptPath, "utf8");
  assert.doesNotMatch(script, /node:child_process|execSync|spawnSync/, "the gate polls; it cannot run a tag, release or dist-tag command");
  assert.match(sha1Hex(bytesOf("x")), /^[0-9a-f]{40}$/, "the integrity digest is a SHA-1 hex string");
});
