#!/usr/bin/env node
/**
 * log-immutability.test.mjs — the aggregator-only write path for the journal,
 * tested against throwaway git repositories.
 *
 * Once the fragment carrier is opted in, `docs/LOGS.md` has exactly one legal
 * writer (the merge-to-main aggregator, issue #405) and the carrier has exactly
 * one legal mutation (the aggregator consuming fragments it appended). Sessions
 * prove their own discipline at close time (`session-close close` refuses); the
 * gate here is the push-level half that holds even when a session skips its
 * close — the 2026-11-08 incident (issue #468) is one commit that deleted 19
 * pending fragments and hand-appended their blocks to the journal.
 *
 * Fixture commits never touch git config — not even a throwaway repository's:
 * every identity is passed per invocation with `git -c user.name=… -c
 * user.email=… -c commit.gpgsign=false`, so the suite writes no configuration
 * anywhere.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { aggregatorCommit, checkWorkingTree, resolveBase } from "./log-immutability.mjs";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "log-immutability.mjs");
const LOG = "docs/LOGS.md";
const CARRIER = ".agentic-workflow/journal";

const HUMAN = { name: "Fixture Human", email: "human@example.com" };
const BOT = { name: "journal-bot", email: "journal-bot@users.noreply.github.com" };

const BASE_ENTRY = `## 2026-11-01T10:00:00Z — main — manual
- **Commits:** 0
- **Files:** —
- **Summary:** The seed entry the fixture repositories start from.
- **Decisions:** None.
- **Next:** Nothing.
`;

function run(cwd, args, env = {}) {
  return spawnSync("node", [script, ...args], { cwd, encoding: "utf8", env: { ...process.env, ...env } });
}

/** One `git` invocation. Every commit-carrying call passes its identity with
 *  `-c`, so no fixture (and no checkout) ever has git config written to it. */
function git(cwd, args, identity = HUMAN) {
  const result = spawnSync(
    "git",
    [`-c`, `user.name=${identity.name}`, `-c`, `user.email=${identity.email}`, `-c`, `commit.gpgsign=false`, ...args],
    { cwd, encoding: "utf8" },
  );
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
}

/** A throwaway repository: LOGS.md seeded with one entry, one pending fragment
 *  in an opted-in carrier, both committed. Returns the helpers plus the base
 *  revision the range checks diff against. */
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "log-immutable-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  fs.mkdirSync(path.join(root, CARRIER), { recursive: true });
  fs.writeFileSync(path.join(root, LOG), `# Session log\n\n${BASE_ENTRY}`);
  fs.writeFileSync(path.join(root, CARRIER, "20261101T090000Z-main-narrative-local.md"), `${BASE_ENTRY}\n`);
  fs.writeFileSync(path.join(root, "untouched.txt"), "not the journal\n");
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-q", "-m", "seed: log, carrier, one fragment"]);
  return {
    root,
    base: git(root, ["rev-parse", "HEAD"]).trim(),
    git,
    /** Append one conforming entry block to the log (or replace its bytes). */
    editLog(replacement, append) {
      const current = fs.readFileSync(path.join(root, LOG), "utf8");
      fs.writeFileSync(path.join(root, LOG), append ? current + replacement : replacement);
    },
    commit(message, identity = HUMAN) {
      git(root, ["add", "-A"]);
      git(root, ["commit", "-q", "-m", message], identity);
      return git(root, ["rev-parse", "HEAD"]).trim();
    },
  };
}

const CONFORMING = `## 2026-11-02T10:00:00Z — feat/x — narrative
- **Commits:** 1 (\`aaaabbbb…ccccdddd\`)
- **Files:** —
- **Summary:** A conforming appended entry.
- **Decisions:** None.
- **Next:** Nothing.
`;

// ---------------------------------------------------------------------------
// Pure predicates
// ---------------------------------------------------------------------------

test("aggregatorCommit: the closed identity set", () => {
  assert.equal(aggregatorCommit({ committerEmail: BOT.email, authorEmail: BOT.email }), true, "the workflow's git identity");
  assert.equal(aggregatorCommit({ committerEmail: "github-actions[bot]@users.noreply.github.com", authorEmail: "human@example.com" }), true, "the forge merge identity");
  assert.equal(aggregatorCommit({ committerEmail: "human@example.com", authorEmail: "human@example.com", actor: "github-actions[bot]" }), true, "CI names the bot actor");
  assert.equal(aggregatorCommit({ committerEmail: "human@example.com", authorEmail: "human@example.com" }), false, "a session identity is never the aggregator");
  assert.equal(aggregatorCommit({ committerEmail: "journal-bot@users.noreply.github.com", authorEmail: "human@example.com", actor: "gtrabanco" }), true, "committer identity wins over a human actor");
});

test("resolveBase: explicit flag, then env, then upstream/origin merge-base, then HEAD", () => {
  const calls = [];
  const gitQuery = (root, args) => {
    calls.push(args.join(" "));
    if (args[0] === "rev-parse" && args[1] === "--verify") return null;
    return null;
  };
  assert.deepEqual(resolveBase({ explicit: "abc123", gitQuery }), { ok: true, base: "abc123", source: "flag" });
  assert.deepEqual(resolveBase({ env: "def456", gitQuery }), { ok: true, base: "def456", source: "env" });
  resolveBase({ gitQuery });
  assert.ok(calls.some((line) => line.includes("@{upstream}")), "falls through to the upstream");
});

test("PASS: a journal past spawnSync's 1 MiB default maxBuffer still reads (the live-tree find)", (t) => {
  const fx = fixture(t);
  // A real year-old journal is >1 MiB; the default spawnSync maxBuffer killed
  // `git show <base>:docs/LOGS.md` on the live tree (the gate's first
  // foreground run on this repository). The fix is the explicit 64 MiB
  // ceiling; this fixture is the pin (justification: decisions.md, P8).
  const grown = `# Session log\n\n<!-- ${"x".repeat(1024 * 1024)} -->\n\n${BASE_ENTRY}`;
  fs.writeFileSync(path.join(fx.root, LOG), grown);
  const grew = fx.commit("grow the journal past the default maxBuffer");
  fx.editLog(CONFORMING, true);
  fx.commit("bot: append the entry", BOT);
  const result = run(fx.root, ["--base", grew]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /verdict: PASS/);
});

// ---------------------------------------------------------------------------
// Range checks against throwaway repositories
// ---------------------------------------------------------------------------

test("PASS: a push that touches neither the log nor the carrier", (t) => {
  const fx = fixture(t);
  fs.writeFileSync(path.join(fx.root, "untouched.txt"), "changed\n");
  fx.commit("an unrelated change");
  const result = run(fx.root, ["--base", fx.base]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /verdict: PASS/);
});

test("PASS: the aggregator appends a conforming block and consumes its fragment", (t) => {
  const fx = fixture(t);
  fx.editLog(CONFORMING, true);
  fx.commit("bot: append the entry", BOT);
  const result = run(fx.root, ["--base", fx.base]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /verdict: PASS/);
});

test("PASS: the aggregator deletes a consumed fragment", (t) => {
  const fx = fixture(t);
  fx.editLog(CONFORMING, true);
  fx.commit("bot: append the entry", BOT);
  fs.rmSync(path.join(fx.root, CARRIER, "20261101T090000Z-main-narrative-local.md"));
  fx.commit("bot: consume the fragment", BOT);
  const result = run(fx.root, ["--base", fx.base]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("PASS: a session adds a pending fragment — the door stays open", (t) => {
  const fx = fixture(t);
  fs.writeFileSync(path.join(fx.root, CARRIER, "20261102T090000Z-feat-x-narrative-local.md"), `${CONFORMING}\n`);
  fx.commit("session: write the fragment");
  const result = run(fx.root, ["--base", fx.base]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("FAIL log-hand-appended: a session appends to docs/LOGS.md, however conforming", (t) => {
  const fx = fixture(t);
  fx.editLog(CONFORMING, true);
  fx.commit("session: hand-append the entry");
  const result = run(fx.root, ["--base", fx.base]);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /log-hand-appended/);
  assert.match(result.stdout, /verdict: FAIL/);
});

test("FAIL log-rewritten: an existing entry line is edited", (t) => {
  const fx = fixture(t);
  fx.editLog(fs.readFileSync(path.join(fx.root, LOG), "utf8").replace("The seed entry", "A REWRITTEN entry"), false);
  fx.commit("session: rewrite the past", BOT);
  const result = run(fx.root, ["--base", fx.base]);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /log-rewritten/, "even the bot's identity cannot launder a rewrite");
});

test("PASS: an append separated by a blank line is a heading extension (the aggregator's byte shape)", (t) => {
  const fx = fixture(t);
  // The aggregator appends `\n` + the fragment block, so after the log's last
  // entry the suffix is a blank-line separator followed by the `## ` heading.
  // The separator is structural, not payload: the range must still see the
  // append as an entry block rather than report the blank line as a malformed one.
  fx.editLog(`\n${CONFORMING}`, true);
  fx.commit("bot: append a blank-line-separated block", BOT);
  const result = run(fx.root, ["--base", fx.base]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /verdict: PASS/);
});

test("FAIL log-block-malformed: an appended block that is not newline-terminated", (t) => {
  const fx = fixture(t);
  fx.editLog(CONFORMING.trimEnd(), true);
  fx.commit("bot: append a truncated block", BOT);
  const result = run(fx.root, ["--base", fx.base]);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /log-block-malformed/);
});

test("FAIL fragment-hand-deleted: a session deletes a pending fragment", (t) => {
  const fx = fixture(t);
  fs.rmSync(path.join(fx.root, CARRIER, "20261101T090000Z-main-narrative-local.md"));
  fx.commit("session: play the aggregator");
  const result = run(fx.root, ["--base", fx.base]);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /fragment-hand-deleted/);
  assert.match(result.stdout, /20261101T090000Z-main-narrative-local\.md/);
});

test("FAIL fragment-hand-edited: a session edits a pending fragment", (t) => {
  const fx = fixture(t);
  fs.writeFileSync(path.join(fx.root, CARRIER, "20261101T090000Z-main-narrative-local.md"), "## edited\n");
  fx.commit("session: touch up a fragment");
  const result = run(fx.root, ["--base", fx.base]);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /fragment-hand-edited/);
});

test("PASS: the bot actor env certifies the merge identity in CI", (t) => {
  const fx = fixture(t);
  fx.editLog(CONFORMING, true);
  fx.commit("merge: integration resolution", { name: "GitHub", email: "noreply@github.com" });
  const result = run(fx.root, ["--base", fx.base], { GITHUB_ACTOR: "github-actions[bot]" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

// ---------------------------------------------------------------------------
// Working tree (pre-commit) half
// ---------------------------------------------------------------------------

test("FAIL: an uncommitted edit to an existing entry is refused before any commit", (t) => {
  const fx = fixture(t);
  fx.editLog(fs.readFileSync(path.join(fx.root, LOG), "utf8").replace("seed entry", "edited entry"), false);
  const result = checkWorkingTree({ root: fx.root });
  assert.equal(result.ok, false);
  assert.equal(result.violations[0].code, "log-rewritten");
});

test("FAIL: an uncommitted pending-fragment deletion is refused before any commit", (t) => {
  const fx = fixture(t);
  fs.rmSync(path.join(fx.root, CARRIER, "20261101T090000Z-main-narrative-local.md"));
  const result = checkWorkingTree({ root: fx.root });
  assert.equal(result.ok, false);
  assert.equal(result.violations[0].code, "fragment-hand-deleted");
});

test("PASS: a carrier placeholder's deletion is not a lost entry — fragments only, like-for-like", (t) => {
  const fx = fixture(t);
  fs.writeFileSync(path.join(fx.root, CARRIER, ".gitkeep"), "");
  fx.commit("track the carrier placeholder");
  fs.rmSync(path.join(fx.root, CARRIER, ".gitkeep"));
  const result = checkWorkingTree({ root: fx.root });
  assert.equal(result.ok, true, JSON.stringify(result.violations));
});

// ---------------------------------------------------------------------------
// CLI surface
// ---------------------------------------------------------------------------

test("usage: a missing --base value is exit 2", (t) => {
  const fx = fixture(t);
  const result = run(fx.root, ["--base"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--base needs a revision/);
});

test("the fixed output block names the base and the tally", (t) => {
  const fx = fixture(t);
  fx.editLog(CONFORMING, true);
  fx.commit("session: hand-append");
  const result = run(fx.root, ["--base", fx.base]);
  assert.match(result.stdout, /Log-immutability: \d+ violations · base [0-9a-f]{7,} · range \d+ commits?\b/);
  assert.match(result.stdout, /verdict: FAIL/);
});
