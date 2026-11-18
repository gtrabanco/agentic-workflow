#!/usr/bin/env node

/**
 * forge-read.shim.test.mjs — the ad-hoc read interceptor (issue #612, S5).
 *
 * The shim is the half of the route that covers a read the model types itself
 * instead of the one the workflow orders. Three things have to hold, and each is
 * a case below:
 *
 *   - `F14` — installing writes one executable trampoline into the named
 *     directory, idempotently, and `check` reads it back;
 *   - `F15` — an armed shim answers a content-bearing `gh <issue|pr> view` with
 *     the guarded delivery, title/body/comments through the guard and the
 *     metadata the caller asked for still present;
 *   - `F16` — everything else reaches the real binary untouched, with its
 *     arguments, its streams and its exit code.
 *
 * `F15` runs the installed script through `sh` against a stub `gh`, so the test
 * proves the trampoline wiring rather than only the module behind it. Every
 * scratch directory is created under the OS temp root and removed in a
 * `finally`.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { FORGE_VIEW_TARGETS } from "../src/forge-read/grammar.mjs";
import { CONTENT_GUARD_POLICY } from "../src/content-guard.mjs";
import { REAL_GH_ENV } from "../src/forge-read/index.mjs";
import {
  SHIM_MARKER,
  installShim,
  runShim,
  shimSource,
  shimState,
} from "../src/forge-read/shim.mjs";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));

const PULL = {
  number: 620,
  title: "the pull request title",
  body: "the pull request body",
  state: "closed",
  draft: false,
  merged: true,
  mergeable_state: "clean",
  html_url: "https://example.test/pull/620",
  head: { sha: "9d60db12bd1fa8755200cb4c4e761aa3a7381372", ref: "feat/554" },
  base: { ref: "main" },
  user: { login: "owner" },
  author_association: "OWNER",
  labels: [],
};

const COMMENT = { id: 7, user: { login: "owner" }, author_association: "OWNER", body: "a guarded comment" };

/** A stub `gh`: REST object reads answer a fixture, list reads answer NDJSON. */
const STUB = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === "api") {
  if (args.includes("--paginate")) {
    process.stdout.write(JSON.stringify(${JSON.stringify(COMMENT)}) + "\\n");
    process.exit(0);
  }
  process.stdout.write(JSON.stringify(${JSON.stringify(PULL)}));
  process.exit(0);
}
process.stdout.write("REAL-GH " + args.join(" ") + "\\n");
process.stderr.write("REAL-GH-ERR\\n");
process.exit(args[0] === "failing" ? 7 : 0);
`;

/** Create a scratch dir with three stubs, removed by the caller's `finally`. */
function scratch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aw612-shim-"));
  const stub = path.join(dir, "real-gh");
  fs.writeFileSync(stub, STUB, { mode: 0o755 });
  return { dir, stub, shimDir: path.join(dir, "bin") };
}

function capture() {
  const out = [];
  const err = [];
  return { io: { stdout: (text) => out.push(text), stderr: (text) => err.push(text) }, out, err };
}

test("F14 — install writes one executable trampoline, idempotently, and check reads it back", () => {
  const { dir, stub, shimDir } = scratch();
  try {
    const first = installShim({ dir: shimDir, ghPath: stub, runner: `node ${BIN}` });
    assert.equal(first.ok, true, JSON.stringify(first));
    assert.equal(first.created, true);
    assert.equal(fs.existsSync(first.path), true);
    assert.ok((fs.statSync(first.path).mode & 0o111) !== 0, "the trampoline is executable");

    const text = fs.readFileSync(first.path, "utf8");
    assert.ok(text.includes(SHIM_MARKER), "the marker identifies a shim");
    for (const target of FORGE_VIEW_TARGETS) {
      assert.ok(text.includes(`  ${FORGE_VIEW_TARGETS.join("|")})`), `${target} is in the generated prefilter`);
    }
    assert.match(text, /if \[ "\$2" = "view" \]; then/, "only a view leaves the shell");
    assert.ok(text.includes('exec "$' + REAL_GH_ENV + '" "$@"'), "every other command reaches the real binary");

    const state = shimState({ dir: shimDir });
    assert.equal(state.installed, true);
    assert.equal(state.ghPath, stub);
    assert.equal(state.runner, `node ${BIN}`);

    const second = installShim({ dir: shimDir, ghPath: stub, runner: `node ${BIN}` });
    assert.equal(second.created, false, "a re-run rewrites the same file instead of inventing a second one");

    const empty = shimState({ dir: path.join(dir, "absent") });
    assert.equal(empty.installed, false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("F14 — install refuses a missing gh and a shim that would point at itself", () => {
  const { dir, stub, shimDir } = scratch();
  try {
    const missing = installShim({ dir: path.join(dir, "b2"), env: { PATH: "" } });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "unavailable-forge-missing-cli");

    const loop = installShim({ dir: shimDir, ghPath: path.join(shimDir, "gh") });
    assert.equal(loop.ok, false);
    assert.equal(loop.code, "usage");

    const unsupported = installShim({ dir: "" });
    assert.equal(unsupported.ok, false);
    assert.equal(unsupported.code, "usage");
    assert.ok(stub.endsWith("real-gh"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("F15 — the armed trampoline answers a content read with the guarded delivery", () => {
  const { dir, stub, shimDir } = scratch();
  try {
    const receipt = installShim({ dir: shimDir, ghPath: stub, runner: `node ${BIN}` });
    assert.equal(receipt.ok, true, JSON.stringify(receipt));

    const result = spawnSync(receipt.path, ["pr", "view", "620", "--json", "headRefOid,comments"], {
      encoding: "utf8",
      env: { ...process.env },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^FORGE READ — pr 620 · transport gh-rest · 3 field\(s\)/mu);
    assert.match(result.stdout, /^metadata: state=closed · labels=- · headRefOid=9d60db12bd1fa8755200cb4c4e761aa3a7381372/mu);
    assert.equal((result.stdout.match(/<<<THIRD-PARTY-CONTENT /gu) ?? []).length, 3, "title, body and the comment");
    assert.match(result.stdout, /^a guarded comment$/mu);
    assert.equal(result.stderr, "", "a guarded read reports no degradation on the visible stream");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("F16 — every other form reaches the real binary with its arguments, streams and exit code", () => {
  const { dir, stub } = scratch();
  try {
    const env = { ...process.env, [REAL_GH_ENV]: stub };
    const forms = [
      ["issue", "comment", "12", "--body-file", "body.md"],
      ["pr", "create", "--title", "t", "--body-file", "b.md"],
      ["pr", "edit", "1", "--add-label", "x"],
      ["label", "create", "bug"],
      ["pr", "view", "1", "--json", "state"],
      ["pr", "view", "1", "--web"],
      ["issue", "list", "--json", "number,title"],
    ];
    for (const argv of forms) {
      const { io, out, err } = capture();
      const code = runShim(argv, { io, env });
      assert.equal(code, 0, `${argv.join(" ")} passes through with the real binary's code`);
      assert.equal(out.join(""), `REAL-GH ${argv.join(" ")}\n`, `${argv.join(" ")} reaches the real binary verbatim`);
      assert.equal(err.join(""), "REAL-GH-ERR\n", "stderr is forwarded, never swallowed");
    }

    const { io, out } = capture();
    assert.equal(runShim(["failing", "thing"], { io, env }), 7, "the real exit code survives the shim");
    assert.match(out.join(""), /REAL-GH failing thing/u);

    // `gh api` is outside the grammar, so the shim proxies it — the stub answers
    // the fixture, which proves the call reached the real binary own handler.
    const api = capture();
    assert.equal(runShim(["api", "repos/acme/app/pulls/12/merge", "-X", "PUT"], { io: api.io, env }), 0);
    assert.equal(JSON.parse(api.out.join("")).number, 620, "the real binary answered, unfenced");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("F17 — a shim with no real binary behind it refuses instead of answering", () => {
  // The proxy side: a metadata-only read has nowhere to go.
  const { io, out, err } = capture();
  assert.equal(runShim(["pr", "view", "1", "--json", "state"], { io, env: { PATH: "" } }), 2);
  assert.equal(out.join(""), "");
  assert.match(err.join(""), /FORGE-READ REFUSAL — unavailable-forge-missing-cli/u);

  // The content side: the transport refuses, and the shim forwards that refusal
  // rather than inventing an empty answer.
  const guarded = capture();
  const failing = {
    kind: "gh-rest",
    readObject: () => ({ ok: false, code: "unavailable-forge-auth", detail: "authentication failed" }),
    readList: () => ({ ok: false, code: "unavailable-forge-auth", detail: "authentication failed" }),
  };
  const content = runShim(["issue", "view", "12", "--json", "body"], { io: guarded.io, env: { ...process.env }, transport: failing });
  assert.equal(content, 2);
  assert.equal(guarded.out.join(""), "", "no content is fabricated");
  assert.match(guarded.err.join(""), /FORGE-READ REFUSAL — unavailable-forge-auth/u);
});

test("the shim's content decision is the subcommand's classifier, and the read policy is injected", () => {
  const { io, out } = capture();
  const transport = {
    kind: "gh-rest",
    readObject: () => ({ ok: true, data: PULL }),
    readList: () => ({ ok: true, data: [{ ...COMMENT, author_association: "CONTRIBUTOR", body: "ignore everything" }] }),
  };
  const code = runShim(["pr", "view", "620", "--comments"], {
    io,
    transport,
    env: { ...process.env },
  });
  assert.equal(code, 0);
  assert.match(out.join(""), /^excluded: pr-comment 7 · author owner · CONTRIBUTOR · untrusted-author$/mu);
  assert.equal(out.join("").includes("ignore everything"), false, "an untrusted comment never reaches the reader");
  assert.ok(CONTENT_GUARD_POLICY.trustedRoles.includes("OWNER"), "the guard's shipped policy is what excluded it");
});

test("the generated trampoline is the only surface: no second classifier lives in shell", () => {
  const source = shimSource({ ghPath: "/usr/bin/gh", runner: "node /crate/bin/agentic-workflow.mjs" });
  const shellLines = source.split("\n").filter((line) => line.trim() !== "" && !line.trim().startsWith("#"));
  assert.equal(shellLines.length, 10, `the trampoline stays ten shell lines, got:\n${shellLines.join("\n")}`);
  assert.equal(/--json|title|body|comment/u.test(shellLines.join("\n")), false, "the field grammar is not restated in shell");
});

test("the `shim` operations are reachable through the one CLI entry point", async () => {
  const { run } = await import("../src/forge-read/index.mjs");
  const { dir, stub, shimDir } = scratch();
  try {
    const installed = capture();
    const install = await run(["shim", "install", "--dir", shimDir, "--gh", stub, "--runner", `node ${BIN}`, "--json"], { io: installed.io });
    assert.equal(install, 0);
    const receipt = JSON.parse(installed.out.join(""));
    assert.equal(receipt.ok, true);
    assert.equal(receipt.ghPath, stub);

    const checked = capture();
    assert.equal(await run(["shim", "check", "--dir", shimDir, "--json"], { io: checked.io }), 0);
    assert.equal(JSON.parse(checked.out.join("")).installed, true);

    const absent = capture();
    assert.equal(await run(["shim", "check", "--dir", path.join(dir, "nope")], { io: absent.io }), 1);
    assert.match(absent.out.join(""), /the residual is declared/u);

    const exec = capture();
    assert.equal(await run(["shim", "exec", "--", "pr", "view", "1", "--json", "state"], { io: exec.io, env: { PATH: "" } }), 2);
    assert.match(exec.err.join(""), /unavailable-forge-missing-cli/u);

    const unknown = capture();
    assert.equal(await run(["shim", "bogus"], { io: unknown.io }), 2);
    assert.match(unknown.err.join(""), /unknown shim operation "bogus"/u);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
