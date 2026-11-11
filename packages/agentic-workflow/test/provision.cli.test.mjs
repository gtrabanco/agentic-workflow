// provision.cli.test.mjs — the ask-first `rg` bootstrap (issue #269 remaining
// P1 scope). The module is injectable so no test installs, downloads or
// touches a real manager; the CLI cases run the real binary for the surface
// wiring only. Red-first against the missing module, per the repo rule.

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

// RED: this import fails until packages/agentic-workflow/src/provision/rg.mjs exists.
import { provisionRg, PROVISION_VERDICTS } from "../src/provision/rg.mjs";

const CLI = new URL("../bin/agentic-workflow.mjs", import.meta.url).pathname;

function freshRoot() {
  const root = mkdtempSync(join(tmpdir(), "aw-provision-"));
  return root;
}

/** Build a real gzipped ustar archive holding one 8-byte `/rg` member —
 * the tar reader is under test against the real container format. */
async function buildGzipFixture(memberName) {
  const zlib = await import("node:zlib");
  return zlib.gzipSync(buildTarFixture(memberName));
}

function buildTarFixture(memberName) {
  const blocks = [];
  const header = Buffer.alloc(512, 0);
  header.write(memberName, 0, "utf8");
  header.write("00000000010", 124, "utf8"); // size = 8 octal
  header.write("0", 156, "utf8"); // regular file
  header.write("ustar\0", 257, "utf8");
  blocks.push(header);
  const content = Buffer.alloc(512, 0);
  content.write("x".repeat(8), 0, "utf8");
  blocks.push(content);
  blocks.push(Buffer.alloc(1024, 0)); // the two end blocks
  return Buffer.concat(blocks);
}

/** Recording fake ops. `managers` maps manager name -> true (available). */
function fakeOps(root, { managers = {}, installed = false, isRoot = false, interactive = false, yes = false, answers = [], platform = { platform: "linux", arch: "x64" }, homeWritable = true, homeOnPath = true, download = null, home, pinOverride = null } = {}) {
  const calls = { managers: [], consent: [], writes: [], gitignore: [] };
  return {
    calls,
    ops: {
      root,
      yes,
      interactive,
      isRoot: () => isRoot,
      now: () => "2026-11-10T00:00:00.000Z",
      pinOverride,
      pinOverride,
      rgInstalled: () => installed,
      managerAvailable: (name) => Boolean(managers[name]),
      installWith: (name, args) => {
        calls.managers.push([...args]);
        calls.sudo = calls.sudo || args.some((a) => /sudo/.test(a));
        return { ok: true };
      },
      ask: () => answers.shift() ?? "n",
      fetch: async () => {
        if (!download) return { ok: false };
        return { ok: true, bytes: download.bytes };
      },
      platform: () => platform,
      homedir: () => home ?? join(root, "home"),
      pathIncludes: (dir) => (dir.includes(".local/bin") ? homeOnPath : true),
      canWrite: (dir) => (dir.includes(".local/bin") ? homeWritable : true),
      exists: existsSync,
      readText: (p) => readFileSync(p, "utf8"),
      writeBinary: (p, bytes) => {
        mkdirSync(join(p, ".."), { recursive: true });
        writeFileSync(p, bytes);
        calls.writes.push(p);
      },
      chmod: chmodSync,
      readTextSafe: (p) => (existsSync(p) ? readFileSync(p, "utf8") : null),
      appendText: (p, data) => {
        calls.gitignore.push(p);
        writeFileSync(p, existsSync(p) ? readFileSync(p, "utf8") + data : data);
      },
      appendConsent: (record) => calls.consent.push(record),
    },
  };
}

test("verdicts are a closed set the receipt admits", () => {
  for (const verdict of ["installed", "already-installed", "refused-root", "refused-consent", "refused-unsupported-platform", "refused-digest-mismatch", "refused-download-failed", "refused-no-writable-target"]) {
    assert.ok(PROVISION_VERDICTS.includes(verdict), `PROVISION_VERDICTS admits ${verdict}`);
  }
});

test("running as root installs nothing, ever", async () => {
  const root = freshRoot();
  const { ops, calls } = fakeOps(root, { isRoot: true, managers: { brew: true } });
  const out = await provisionRg(ops);
  assert.equal(out.verdict, "refused-root");
  assert.equal(out.exitCode, 1);
  assert.deepEqual(calls.managers, []);
  assert.deepEqual(calls.consent, []);
  rmSync(root, { recursive: true, force: true });
});

test("an rg already on PATH is skipped entirely (no consent, no manager)", async () => {
  const root = freshRoot();
  const { ops, calls } = fakeOps(root, { installed: true, managers: { brew: true } });
  const out = await provisionRg(ops);
  assert.equal(out.verdict, "already-installed");
  assert.equal(out.exitCode, 0);
  assert.deepEqual(calls.managers, []);
  assert.deepEqual(calls.consent, []);
  rmSync(root, { recursive: true, force: true });
});

test("non-interactive without --yes refuses before anything runs (ask-first)", async () => {
  const root = freshRoot();
  const { ops, calls } = fakeOps(root, { managers: { brew: true } });
  const out = await provisionRg(ops);
  assert.equal(out.verdict, "refused-consent");
  assert.equal(out.exitCode, 1);
  assert.deepEqual(calls.managers, []);
  assert.deepEqual(calls.consent, []);
  rmSync(root, { recursive: true, force: true });
});

test("--yes is recorded consent: manager installs, the ledger gets the record, sudo never appears", async () => {
  const root = freshRoot();
  const { ops, calls } = fakeOps(root, { yes: true, managers: { brew: true, cargo: true } });
  const out = await provisionRg(ops);
  assert.equal(out.verdict, "installed");
  assert.equal(out.exitCode, 0);
  assert.equal(out.method, "brew");
  assert.deepEqual(calls.managers, [["brew", "install", "ripgrep"]]);
  assert.ok(!calls.sudo, "sudo never appears in a manager invocation");
  assert.equal(calls.consent.length, 1);
  assert.equal(calls.consent[0].tool, "rg");
  assert.equal(calls.consent[0].source, "flag");
  assert.equal(calls.consent[0].action, "install");
  rmSync(root, { recursive: true, force: true });
});

test("manager order follows the issue's list: the first available wins", async () => {
  const root = freshRoot();
  const { ops, calls } = fakeOps(root, { yes: true, managers: { npm: true, cargo: true } });
  const out = await provisionRg(ops);
  assert.equal(out.method, "cargo");
  assert.equal(calls.managers.length, 1);
  assert.equal(calls.managers[0][0], "cargo");
  rmSync(root, { recursive: true, force: true });
});

test("an interactive ask is honored: yes installs, no refuses", async () => {
  const root = freshRoot();
  const yesRun = fakeOps(root, { managers: { pipx: true }, interactive: true, answers: ["y"] });
  const yesOut = await provisionRg(yesRun.ops);
  assert.equal(yesOut.verdict, "installed");
  assert.equal(yesOut.method, "pipx");
  assert.equal(yesRun.calls.consent[0]?.source, "prompt");
  rmSync(root, { recursive: true, force: true });

  const root2 = freshRoot();
  const noRun = fakeOps(root2, { managers: { pipx: true }, interactive: true, answers: ["n"] });
  const noOut = await provisionRg(noRun.ops);
  assert.equal(noOut.verdict, "refused-consent");
  assert.deepEqual(noRun.calls.managers, []);
  rmSync(root2, { recursive: true, force: true });
});

test("no manager and an unsupported platform is a refusal with the manual hint", async () => {
  const root = freshRoot();
  const { ops, calls } = fakeOps(root, { yes: true, platform: { platform: "sunos", arch: "x64" } });
  const out = await provisionRg(ops);
  assert.equal(out.verdict, "refused-unsupported-platform");
  assert.deepEqual(calls.managers, []);
  rmSync(root, { recursive: true, force: true });
});

test("a downloaded artifact whose digest does not match the pin is refused before any byte lands", async () => {
  const root = freshRoot();
  const { ops, calls } = fakeOps(root, { yes: true, download: { bytes: Buffer.from("corrupted") } });
  const out = await provisionRg(ops);
  assert.equal(out.verdict, "refused-digest-mismatch");
  assert.equal(out.exitCode, 1);
  assert.deepEqual(calls.writes, []);
  rmSync(root, { recursive: true, force: true });
});

test("the pinned binary lands in ~/.local/bin when writable and on $PATH", async () => {
  const root = freshRoot();
  // A real (fixture-built) ustar member named .../rg holding 8 bytes, gzipped:
  // the digest-of-bytes contract AND the tar reader are both under test.
  const { gzipSync } = await import("node:zlib");
  const { createHash } = await import("node:crypto");
  const bytes = await buildGzipFixture("ripgrep-15.2.0-x86_64-unknown-linux-musl/rg");
  const digest = createHash("sha256").update(bytes).digest("hex");
  const { ops, calls } = fakeOps(root, {
    yes: true,
    download: { bytes },
    pinOverride: { "x86_64-unknown-linux-musl.tar.gz": digest },
  });
  const out = await provisionRg(ops);
  assert.equal(out.verdict, "installed");
  assert.equal(out.method, "pinned-download");
  assert.match(calls.writes.at(-1), /\.local\/bin\/rg$/);
  rmSync(root, { recursive: true, force: true });
});

test("~/.local/bin unavailable falls back to .agentic-workflow/bin plus the gitignore entry", async () => {
  const root = freshRoot();
  const { gzipSync } = await import("node:zlib");
  const { createHash } = await import("node:crypto");
  const bytes = await buildGzipFixture("ripgrep-15.2.0-x86_64-unknown-linux-musl/rg");
  const digest = createHash("sha256").update(bytes).digest("hex");
  const { ops, calls } = fakeOps(root, {
    yes: true,
    download: { bytes },
    homeWritable: false,
    homeOnPath: false,
    pinOverride: { "x86_64-unknown-linux-musl.tar.gz": digest },
  });
  const out = await provisionRg(ops);
  assert.equal(out.verdict, "installed");
  assert.match(calls.writes.at(-1), /\.agentic-workflow\/bin\/rg$/);
  const ignored = readFileSync(join(root, ".gitignore"), "utf8");
  assert.match(ignored, /\.agentic-workflow\/bin\//);
  rmSync(root, { recursive: true, force: true });
});

test("the CLI refuses an unknown tool and bare invocation with usage", () => {
  const bare = spawnSync(process.execPath, [CLI, "provision"], { encoding: "utf8" });
  assert.equal(bare.status, 2);
  assert.match(bare.stderr, /usage/);
  const unknown = spawnSync(process.execPath, [CLI, "provision", "vim"], { encoding: "utf8" });
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /REFUSAL|usage/);
});

test("the CLI skips cleanly when a stub rg is on PATH", () => {
  const root = freshRoot();
  const stub = join(root, "bin-stub");
  mkdirSync(stub, { recursive: true });
  const rg = join(stub, "rg");
  writeFileSync(rg, "#!/bin/sh\nexit 0\n");
  chmodSync(rg, 0o755);
  const env = { ...process.env, PATH: `${stub}:${process.env.PATH ?? ""}` };
  const r = spawnSync(process.execPath, [CLI, "provision", "rg", "--dir", root], { encoding: "utf8", env });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /already-installed/);
  rmSync(root, { recursive: true, force: true });
});
