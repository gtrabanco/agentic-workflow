// profile-fallback.test.mjs — P4, feature 63 (AC7, AC8, AC9, AC3, AC4)
//
// Profile-chain probing: when the preferred profile's model is unusable,
// the router falls back to the next profile in order; demotion state
// prevents thrashing; and an explicit inherit stops the search.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createSession, configFor } from "./helpers/session.mjs";
import { createProfileStateStore } from "../dist/routing/state.js";

// ---------------------------------------------------------------------------
// In-memory store helper for tests
// ---------------------------------------------------------------------------

/**
 * Create an in-memory profile state store for testing.
 * Provides the same interface as the file-backed store.
 */
function createInMemoryStore() {
  const data = { profileDemotion: undefined };
  return {
    demotion() {
      return data.profileDemotion;
    },
    record(profile, now = new Date()) {
      data.profileDemotion = { profile, at: now.toISOString() };
      return true;
    },
    clear() {
      data.profileDemotion = undefined;
      return true;
    },
    getData() {
      return data;
    },
  };
}

// ---------------------------------------------------------------------------
// AC7: per-command fallback selects the next profile when the preferred model
// is unusable
// ---------------------------------------------------------------------------

test("AC7: per-command fallback selects the next profile when the preferred model is unusable", async () => {
  const config = configFor({
    profiles: {
      work: { default: { model: "w/1" } },
      fb: { default: { model: "fb/1" } },
    },
    profileOrder: ["work", "fb"],
    recommendedModels: false,
    profileFallback: { applyTo: "command" },
  });

  const session = createSession({
    config,
    models: { "fb/1": true }, // only fb/1 available; work's model is not in the catalog
    knownCommands: ["plan-feature", "design-feature", "execute-phase", "agentic-workflow-settings"],
  });

  const outcome = await session.dispatch({ name: "plan-feature", skill: "plan-feature" }, "");

  assert.equal(outcome.status, "dispatched", "command dispatched via fallback");
  assert.deepEqual(outcome.profileSwitched, { from: "work", to: "fb" }, "profileSwitched shows the fallback");
  assert.deepEqual(session.log.setModel, ["fb/1"], "the fallback model was selected");
  // applyTo=command should NOT record demotion.
  assert.equal(session.router.inFlight(), true, "turn is in flight");
});

// ---------------------------------------------------------------------------
// AC8: applyTo flow records the demotion in the state store
// ---------------------------------------------------------------------------

test("AC8: applyTo flow records the demotion in the state store", async () => {
  const imStore = createInMemoryStore();

  const config = configFor({
    profiles: {
      work: { default: { model: "w/1" } },
      fb: { default: { model: "fb/1" } },
    },
    profileOrder: ["work", "fb"],
    recommendedModels: false,
    profileFallback: { applyTo: "flow" },
  });

  const session = createSession({
    config,
    models: { "fb/1": true },
    profileState: imStore,
    knownCommands: ["plan-feature", "design-feature", "execute-phase", "agentic-workflow-settings"],
  });

  const outcome = await session.dispatch({ name: "plan-feature", skill: "plan-feature" }, "");

  assert.equal(outcome.status, "dispatched");
  assert.deepEqual(outcome.profileSwitched, { from: "work", to: "fb" });
  assert.deepEqual(session.log.setModel, ["fb/1"]);

  const demotion = imStore.demotion();
  assert.ok(demotion, "demotion was recorded");
  assert.equal(demotion.profile, "fb", "demoted profile is 'fb'");
  assert.ok(Number.isFinite(Date.parse(demotion.at)), "at is a valid ISO timestamp");
});

// ---------------------------------------------------------------------------
// AC8: an active demotion makes later commands start at the demoted profile
// ---------------------------------------------------------------------------

test("AC8: an active demotion makes later commands start at the demoted profile", async () => {
  const imStore = createInMemoryStore();
  // Pre-seed: the "fb" profile was demoted.
  imStore.record("fb", new Date(Date.now() - 1000));

  const config = configFor({
    profiles: {
      work: { default: { model: "w/1" } },
      fb: { default: { model: "fb/1" } },
    },
    profileOrder: ["work", "fb"],
    recommendedModels: false,
    profileFallback: { applyTo: "flow" },
  });

  // Both models are available — the demotion should make us skip to fb.
  const session = createSession({
    config,
    models: { "w/1": true, "fb/1": true },
    profileState: imStore,
    knownCommands: ["plan-feature", "design-feature", "execute-phase", "agentic-workflow-settings"],
  });

  const outcome1 = await session.dispatch({ name: "plan-feature", skill: "plan-feature" }, "");
  assert.equal(outcome1.status, "dispatched");
  assert.deepEqual(session.log.setModel, ["fb/1"], "demoted profile fb/1 is used (work skipped)");

  // Settle to release the in-flight latch so we can dispatch again.
  await session.settle();

  // Control: same session without demotion (we clear it manually).
  imStore.clear();
  assert.equal(imStore.demotion(), undefined, "demotion cleared");

  // Now dispatch again — without demotion, work should be first.
  const outcome2 = await session.dispatch({ name: "design-feature", skill: "design-feature" }, "");
  assert.equal(outcome2.status, "dispatched");
  // log.setModel accumulates; the last entry is the one from this dispatch.
  assert.equal(session.log.setModel[session.log.setModel.length - 1], "w/1", "without demotion, the top profile is used");
});

// ---------------------------------------------------------------------------
// AC9: a demotion older than retryAfterSeconds is ignored and cleared
// ---------------------------------------------------------------------------

test("AC9: a demotion older than retryAfterSeconds is ignored and cleared", async () => {
  // Use a mutable state so the store's clear() is reflected in subsequent reads.
  let storedState = {
    profileDemotion: {
      profile: "fb",
      at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    },
  };
  const rawStore = createProfileStateStore({
    path: "/tmp/pi-profile-test-state.json",
    readFile: () => JSON.stringify(storedState),
    writeFile: (_path, text) => { storedState = JSON.parse(text); },
  });

  const config = configFor({
    profiles: {
      work: { default: { model: "w/1" } },
      fb: { default: { model: "fb/1" } },
    },
    profileOrder: ["work", "fb"],
    recommendedModels: false,
    profileFallback: { applyTo: "flow", retryAfterSeconds: 86400 },
  });

  // The demotion is 2 days old, retryAfterSeconds is 86400 (1 day).
  // So the demotion should be expired and cleared.
  const session = createSession({
    config,
    models: { "w/1": true, "fb/1": true },
    profileState: rawStore,
    knownCommands: ["plan-feature", "design-feature", "execute-phase", "agentic-workflow-settings"],
  });

  const outcome = await session.dispatch({ name: "plan-feature", skill: "plan-feature" }, "");
  assert.equal(outcome.status, "dispatched");
  assert.deepEqual(session.log.setModel, ["w/1"], "expired demotion cleared, top profile used");
  assert.equal(rawStore.demotion(), undefined, "demotion cleared after expiry");
});

// ---------------------------------------------------------------------------
// AC3: no candidates and no nan provider runs on inherit
// ---------------------------------------------------------------------------

test("AC3: no candidates and no nan provider runs on inherit", async () => {
  const config = configFor({
    recommendedModels: false,
  });

  // Only the session's own model is in the catalog — no profiles define a model.
  const session = createSession({
    config,
    models: { "anthropic/claude-sonnet-4-5": true },
    knownCommands: ["plan-feature", "design-feature", "execute-phase", "agentic-workflow-settings"],
  });

  const outcome = await session.dispatch({ name: "plan-feature", skill: "plan-feature" }, "");

  assert.equal(outcome.status, "dispatched");
  assert.equal(outcome.profileSwitched, undefined, "no profile switch occurred");
  assert.deepEqual(session.log.setModel, [], "no model was switched (inherits session model)");
});

// ---------------------------------------------------------------------------
// AC4: an explicit inherit route stops the search even when nan is available
// ---------------------------------------------------------------------------

test("AC4: an explicit inherit route stops the search even when nan is available", async () => {
  const config = configFor({
    commands: { "plan-feature": { model: "inherit" } },
    recommendedModels: true,
  });

  // Include a nan model and the session's own model.
  const session = createSession({
    config,
    models: {
      "anthropic/claude-sonnet-4-5": true,
      "nan/deepseek-v4-flash": true,
      "nan/glm5.3-flash": true,
    },
    knownCommands: ["plan-feature", "design-feature", "execute-phase", "agentic-workflow-settings"],
  });

  const outcome = await session.dispatch({ name: "plan-feature", skill: "plan-feature" }, "");

  assert.equal(outcome.status, "dispatched");
  assert.equal(outcome.profileSwitched, undefined, "explicit inherit stops the search");
  assert.deepEqual(session.log.setModel, [], "no model was switched (inherits session model)");
});

// ---------------------------------------------------------------------------
// AC8: a flow demotion persists across dispatches until the retry window elapses
// ---------------------------------------------------------------------------

test("AC8: a flow demotion persists across dispatches until the retry window elapses", async () => {
  const imStore = createInMemoryStore();
  imStore.record("fb"); // already demoted before the first dispatch

  const config = configFor({
    profiles: {
      work: { default: { model: "w/1" } },
      fb: { default: { model: "fb/1" } },
    },
    profileOrder: ["work", "fb"],
    recommendedModels: false,
    profileFallback: { applyTo: "flow", retryAfterSeconds: 86400 },
  });

  const session = createSession({
    config,
    models: { "w/1": true, "fb/1": true }, // both available — the demotion alone must skip work
    profileState: imStore,
    knownCommands: ["plan-feature", "design-feature", "execute-phase", "agentic-workflow-settings"],
  });

  await session.dispatch({ name: "plan-feature", skill: "plan-feature" }, "");
  await session.settle();
  await session.dispatch({ name: "design-feature", skill: "design-feature" }, "");

  assert.deepEqual(session.log.setModel, ["fb/1", "fb/1"], "both dispatches stay on the demoted profile");
  assert.equal(imStore.demotion()?.profile, "fb", "the demotion is not cleared by a dispatch");
});
