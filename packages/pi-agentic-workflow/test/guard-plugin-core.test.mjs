// guard-plugin-core.test.mjs — the guard-plugin seam as the runtime uses it
// (issue #654, S2 / S6 bullet 3 / S9).
//
// One seam, two guard kinds. A `deterministic` declaration answers today
// through the published decision function; a `model-backed` one is accepted by
// the schema and answered by a kind handler a later adapter injects (#444),
// which is what "the seam accepts them without assuming them" means in code.
// No Pi session and no vendor package is needed: the authorizer is a double and
// the service loader is injected.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildGuardPluginLinks,
  loadPermissionService,
  normalizeAuthorizerAsk,
  registerGuardPluginLinks,
  startGuardPlugins,
} from "../dist/guards/plugin-core.js";

const DENY_ENV = {
  kind: "deterministic",
  surface: "path",
  rules: [
    { match: "*", verdict: "allow" },
    { match: "**/.env", verdict: "deny", reason: "secrets never enter the agent's reach" },
  ],
};

const ASK_SHELL = {
  kind: "deterministic",
  surface: "bash",
  rules: [{ match: "sudo *" }],
};

/** The plugin's ask envelope as its docs describe it: the surface rides on
 *  `accessIntent`, the value beside it. */
const ask = (surface, value) => ({ accessIntent: { surface, value } });

function authorizerDouble() {
  const calls = [];
  return {
    calls,
    service: {
      registerAuthorizer(name, authorize) {
        calls.push({ name, authorize });
        return () => calls.push({ disposed: name });
      },
    },
  };
}

/* ------------------------------------------------------------- the links */

test("a deterministic link answers allow and deny, and defers everything else", async () => {
  const { links } = buildGuardPluginLinks({ guards: { "no-dotenv": DENY_ENV } });
  assert.equal(links.length, 1);
  assert.equal(links[0].name, "no-dotenv");

  assert.deepEqual(await links[0].authorize(ask("path", "/repo/src/a.ts")), { verdict: "allow" });
  assert.deepEqual(await links[0].authorize(ask("path", "/repo/.env")), {
    verdict: "deny",
    reason: "secrets never enter the agent's reach",
  });
  assert.deepEqual(await links[0].authorize(ask("bash", "ls")), { verdict: "defer" }, "another surface is not this link's to decide");
});

test("an `ask` rule defers to the terminal prompt instead of answering it", async () => {
  const { links } = buildGuardPluginLinks({ guards: { shell: ASK_SHELL } });
  assert.deepEqual(await links[0].authorize(ask("bash", "sudo ls")), { verdict: "defer" });
  assert.deepEqual(await links[0].authorize(ask("bash", "ls")), { verdict: "defer" });
});

test("a model-backed declaration registers nothing today and says why", () => {
  const { links, skipped } = buildGuardPluginLinks({
    guards: { judge: { kind: "model-backed", surface: "bash", rules: [{ match: "*", verdict: "ask" }] } },
  });
  assert.deepEqual(links, []);
  assert.deepEqual(skipped, [{ name: "judge", reason: "model-backed-unavailable" }]);
});

test("an injected kind handler makes the model-backed kind real without touching the declaration", async () => {
  const seen = [];
  const { links, skipped } = buildGuardPluginLinks({
    guards: { judge: { kind: "model-backed", surface: "bash", rules: [{ match: "*", verdict: "ask" }] } },
    kinds: {
      "model-backed": (declaration, request) => {
        seen.push([declaration.kind, request.surface, request.value]);
        return { verdict: "deny", reason: "the judge said no" };
      },
    },
  });
  assert.deepEqual(skipped, []);
  assert.equal(links.length, 1);
  assert.deepEqual(await links[0].authorize(ask("bash", "rm -rf /")), { verdict: "deny", reason: "the judge said no" });
  assert.deepEqual(seen, [["model-backed", "bash", "rm -rf /"]]);
});

/* ---------------------------------------------------------- registration */

test("registration follows declaration order and hands back a disposer per link", () => {
  const double = authorizerDouble();
  const result = registerGuardPluginLinks({
    guards: { "no-dotenv": DENY_ENV, shell: ASK_SHELL, judge: { kind: "model-backed", surface: "bash", rules: [{ match: "*" }] } },
    authorizer: double.service,
  });
  assert.deepEqual(result.registered, ["no-dotenv", "shell"]);
  assert.deepEqual(result.skipped, [{ name: "judge", reason: "model-backed-unavailable" }]);
  assert.deepEqual(double.calls.map((call) => call.name), ["no-dotenv", "shell"], "config order fixes the chain order");
  assert.equal(result.disposers.length, 2);
  result.disposers[0]();
  assert.deepEqual(double.calls.at(-1), { disposed: "no-dotenv" });
});

test("an ask the normalizer cannot read is never guessed: the link defers", async () => {
  const { links } = buildGuardPluginLinks({ guards: { "no-dotenv": DENY_ENV } });
  assert.equal(normalizeAuthorizerAsk(undefined), null);
  assert.equal(normalizeAuthorizerAsk({ tool: "bash" }), null);
  assert.equal(normalizeAuthorizerAsk({ accessIntent: { value: "/repo/.env" } }), null, "no surface, no request");
  assert.deepEqual(await links[0].authorize({ tool: "bash" }), { verdict: "defer" });
});

test("the normalizer reads the published envelope and tolerates the value's spellings", () => {
  assert.deepEqual(normalizeAuthorizerAsk(ask("path", "/repo/.env")), { surface: "path", value: "/repo/.env" });
  assert.deepEqual(normalizeAuthorizerAsk({ accessIntent: { surface: "bash", command: "rm -rf /" } }), { surface: "bash", value: "rm -rf /" });
  assert.deepEqual(normalizeAuthorizerAsk({ accessIntent: { surface: "bash" }, command: "ls" }), { surface: "bash", value: "ls" });
});

/* -------------------------------------------------------------- the loader */

test("the service loader answers null instead of throwing when the package is absent", async () => {
  assert.equal(await loadPermissionService("@nonexistent/paw-permission-package"), null);
  const service = await loadPermissionService(new URL("../../agentic-workflow-schema/dist/index.js", import.meta.url).href);
  assert.equal(service, null, "a module with no accessor is not a permission service");
});

/* -------------------------------------------------------------- the wiring */

function recordedNotices() {
  const notices = [];
  return { notices, notify: (message, kind) => notices.push([message, kind]) };
}

test("a declared guard with no plugin installed degrades in the open: one skip and one notice", async () => {
  const { notices, notify } = recordedNotices();
  const result = await startGuardPlugins({
    config: { enabled: true, guards: { "no-dotenv": DENY_ENV } },
    sessionId: "session-1",
    loadService: async () => null,
    notify,
  });
  assert.deepEqual(result.registered, []);
  assert.deepEqual(result.skipped, [{ name: "no-dotenv", reason: "guard-unavailable" }]);
  assert.equal(notices.length, 1, "one notice, not one per tool call");
  assert.match(notices[0][0], /@gotgenes\/pi-permission-system/, "the notice names what to install");
  assert.equal(notices[0][1], "warning");
});

test("an unavailable session id skips without pretending, and an off switch is silent", async () => {
  const { notices, notify } = recordedNotices();
  const double = authorizerDouble();
  const noSession = await startGuardPlugins({
    config: { enabled: true, guards: { "no-dotenv": DENY_ENV } },
    sessionId: undefined,
    loadService: async () => double.service,
    notify,
  });
  assert.deepEqual(noSession.skipped, [{ name: "no-dotenv", reason: "session-unavailable" }]);
  assert.deepEqual(double.calls, [], "nothing was registered without a session");

  const off = await startGuardPlugins({
    config: { enabled: false, guards: { "no-dotenv": DENY_ENV } },
    sessionId: "session-1",
    loadService: async () => double.service,
    notify,
  });
  assert.deepEqual(off, { registered: [], skipped: [] });
  assert.deepEqual(notices.length, 1, "the off switch adds no notice");
});

test("a declared guard on an installed plugin registers through the session's service", async () => {
  const double = authorizerDouble();
  const looked = [];
  const result = await startGuardPlugins({
    config: { enabled: true, guards: { "no-dotenv": DENY_ENV } },
    sessionId: "session-7",
    loadService: async () => ({
      getPermissionsService(sessionId) {
        looked.push(sessionId);
        return double.service;
      },
    }),
    notify: () => {},
  });
  assert.deepEqual(looked, ["session-7"]);
  assert.deepEqual(result.registered, ["no-dotenv"]);
  assert.equal(double.calls.length, 1);
});
