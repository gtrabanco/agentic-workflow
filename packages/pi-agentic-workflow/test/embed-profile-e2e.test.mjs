// embed-profile-e2e.test.mjs — the whole point of issue #541 (S2, S9 AC1).
//
// A project with the two packages installed and **no hand-written
// `index.json`**: the preset's profile is materialized by the console's action,
// and the crate then embeds every chunk in one `doc --sync` with no declared
// degradation and the profile's model pinned in the store. The provider is a
// fixture (an injected embedder), so nothing here names a vendor — the crate and
// this package stay provider-neutral; the NaN profile's *data* is the companion
// package's suite.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { runDocOp } from "@gtrabanco/agentic-workflow/src/doc/retrieval.mjs";
import { applyEmbedProfile, planEmbedProfile } from "../dist/config/embed-profile.js";
import { sandboxGitEnv } from "./git-sandbox.mjs";

const PROFILE = {
  baseUrl: "https://acme.example/v1",
  model: "acme-embed-1",
  envVar: "ACME_API_KEY",
  chunk_limit: 6000,
  pacing: { batchSize: 6, requestsPerMinute: 60 },
};

const DOCS = {
  "a.md": ["# Alpha", "", "alpha body text about the retrieval index", "", "## Alpha two", "", "more alpha prose"].join("\n"),
  "b.md": ["# Beta", "", "beta body mentions the zanzibar term"].join("\n"),
  "c.md": ["# Gamma", "", "gamma body", "", "- a bullet", "- another bullet"].join("\n"),
};

function git(cwd, args) {
  return execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.test", "-c", "commit.gpgsign=false", ...args], {
    cwd,
    encoding: "utf8",
    env: sandboxGitEnv(),
  });
}

/** A deterministic embedder: one axis per known term, so vectors are stable and offline. */
function fixtureEmbedder(model) {
  const axes = { alpha: 0, beta: 1, gamma: 2, zanzibar: 3 };
  return {
    model,
    async embed(texts) {
      return texts.map((text) => {
        const vector = [0, 0, 0, 0];
        for (const [term, axis] of Object.entries(axes)) if (text.toLowerCase().includes(term)) vector[axis] += 1;
        vector[3] += 0.5; // a non-zero tail so no vector is degenerate
        return vector;
      });
    },
  };
}

test("S9 AC1: a materialized preset profile embeds every chunk in one sync, no degradation, the profile's model pinned", async () => {
  const root = mkdtempSync(join(tmpdir(), "embed-profile-e2e-"));
  try {
    mkdirSync(join(root, ".agentic-workflow"), { recursive: true });
    git(root, ["init", "-q"]);
    for (const [name, body] of Object.entries(DOCS)) writeFileSync(join(root, name), body);
    git(root, ["add", "-A"]);
    git(root, ["commit", "-qm", "fixture"]);

    // 1. Nothing is hand-written: the profile is materialized from the preset.
    const readFile = (path) => {
      try {
        return readFileSync(path, "utf8");
      } catch {
        return null;
      }
    };
    const plan = planEmbedProfile({ root, entry: { provider: "acme", profile: PROFILE }, readFile });
    assert.equal(plan.present, false, "the fixture starts with no index.json at all");
    assert.ok(plan.fills.length > 0, "every value comes from the preset");
    applyEmbedProfile({ root, plan, writeFile: (path, text) => writeFileSync(path, text) });
    assert.deepEqual(JSON.parse(readFile(join(root, ".agentic-workflow", "index.json"))).provider, PROFILE);

    // 2. The crate runs the sync the way `/aw-index` and a hook do.
    const envelope = await runDocOp({ op: "sync" }, { rootDir: root, embedder: fixtureEmbedder(PROFILE.model) });

    assert.deepEqual(envelope.degradations, [], "no unavailable-embeddings-* and no rejection");
    assert.equal(envelope.ok, true);
    assert.equal(envelope.store.kind ?? envelope.store.present, envelope.store.present);
    assert.equal(envelope.store.model, PROFILE.model, "the pinned model is the profile's");
    assert.equal(envelope.store.pending, 0, "100% of the chunks are embedded");
    assert.ok(envelope.store.chunks > 0, "the fixture really produced chunks");
    assert.equal(envelope.store.lastSync.embedded, envelope.store.chunks, "the pass embedded every chunk it chunked");
    assert.equal(envelope.store.rejected ?? null, null, "nothing was refused");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("S9 AC1: the second sync is a warm run — zero provider calls, still nothing pending", async () => {
  const root = mkdtempSync(join(tmpdir(), "embed-profile-e2e-warm-"));
  try {
    mkdirSync(join(root, ".agentic-workflow"), { recursive: true });
    git(root, ["init", "-q"]);
    writeFileSync(join(root, "a.md"), DOCS["a.md"]);
    git(root, ["add", "-A"]);
    git(root, ["commit", "-qm", "fixture"]);

    const readFile = (path) => {
      try {
        return readFileSync(path, "utf8");
      } catch {
        return null;
      }
    };
    const plan = planEmbedProfile({ root, entry: { provider: "acme", profile: PROFILE }, readFile });
    applyEmbedProfile({ root, plan, writeFile: (path, text) => writeFileSync(path, text) });

    const calls = [];
    const counting = fixtureEmbedder(PROFILE.model);
    const embedder = { model: counting.model, embed: (texts) => (calls.push(texts.length), counting.embed(texts)) };

    await runDocOp({ op: "sync" }, { rootDir: root, embedder });
    assert.equal(calls.length, 1, "the first sync makes exactly one request");

    const second = await runDocOp({ op: "sync" }, { rootDir: root, embedder });
    assert.equal(calls.length, 1, "a warm sync makes none");
    assert.deepEqual(second.degradations, []);
    assert.equal(second.store.pending, 0);
    assert.equal(second.store.lastSync.embedded, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
