/**
 * Tests for the Engram MCP provisioning (feature 66, P4 — AC3, O10/O11).
 *
 * The contract these pin, in the order the module decides it:
 *
 *   not-consented      no `memory.engram` opt-in ⇒ nothing registered
 *   binary-missing     no `engram` on PATH ⇒ nothing registered, install route named
 *   unsupported-host   a Pi host without `registerMcpServer` ⇒ nothing written
 *   already-declared   the operator's `mcp.json` name wins ⇒ nothing shadowed
 *   registered         the exact command + args, read back verbatim
 *
 * Nothing here touches the network, a real PATH or a Pi session: the binary
 * lookup and the registrar are injected, which is what makes every branch
 * reachable.
 */

import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ENGRAM_ARGS,
  ENGRAM_INSTALL_ROUTE,
  ENGRAM_SERVER_NAME,
  provisionEngram,
  readDeclaredServerNames,
  resolveEngramBinary,
} from "../src/extension/engram.js";

const BINARY = "/home/agent/.local/bin/engram";

/** A registrar that records what it was asked to write. */
function recorder() {
  const calls = [];
  const register = (name, config) => calls.push({ name, config });
  return { calls, register };
}

describe("engram provisioning — consent is first", () => {
  it("registers nothing without the memory.engram opt-in", () => {
    const { calls, register } = recorder();
    const report = provisionEngram({ consented: false, binaryPath: BINARY, declaredNames: [], register });
    strictEqual(report.status, "not-consented");
    strictEqual(calls.length, 0);
    ok(report.message.includes("memory"));
    ok(!report.server);
  });

  it("consent alone is not enough when the binary is absent", () => {
    const { calls, register } = recorder();
    const report = provisionEngram({ consented: true, binaryPath: null, declaredNames: [], register });
    strictEqual(report.status, "binary-missing");
    strictEqual(calls.length, 0);
  });
});

describe("engram provisioning — the binary must resolve (AC3)", () => {
  it("names the one documented install route when engram is missing", () => {
    const { register } = recorder();
    const report = provisionEngram({ consented: true, binaryPath: null, declaredNames: [], register });
    strictEqual(report.status, "binary-missing");
    ok(report.message.includes(ENGRAM_INSTALL_ROUTE), report.message);
  });

  it("resolves engram from PATH and skips non-executable entries", () => {
    const env = { PATH: ["/nope", "/usr/local/bin"].join(":") };
    const present = resolveEngramBinary({
      env,
      platform: "linux",
      exists: (path) => path === "/usr/local/bin/engram",
    });
    strictEqual(present, "/usr/local/bin/engram");

    const absent = resolveEngramBinary({ env, platform: "linux", exists: () => false });
    strictEqual(absent, null);
  });

  it("an empty PATH resolves nothing instead of scanning the cwd", () => {
    strictEqual(resolveEngramBinary({ env: { PATH: "" }, platform: "linux", exists: () => true }), null);
  });
});

describe("engram provisioning — an older host degrades", () => {
  it("reports unsupported-host instead of throwing when registerMcpServer is absent", () => {
    const report = provisionEngram({ consented: true, binaryPath: BINARY, declaredNames: [], register: null });
    strictEqual(report.status, "unsupported-host");
    ok(report.message.includes("registerMcpServer"));
    ok(!report.server);
  });
});

describe("engram provisioning — the operator's mcp.json wins", () => {
  it("does not shadow a declared server", () => {
    const { calls, register } = recorder();
    const report = provisionEngram({
      consented: true,
      binaryPath: BINARY,
      declaredNames: ["jira", ENGRAM_SERVER_NAME],
      register,
    });
    strictEqual(report.status, "already-declared");
    strictEqual(calls.length, 0);
    ok(report.message.includes("mcp.json"));
  });

  it("reads the declared names from an mcp.json file", () => {
    const dir = mkdtempSync(join(tmpdir(), "engram-declared-"));
    try {
      const file = join(dir, "mcp.json");
      writeFileSync(file, JSON.stringify({ mcpServers: { engram: { command: "x" }, jira: { url: "y" } } }));
      deepStrictEqual(readDeclaredServerNames(file).sort(), ["engram", "jira"]);
      strictEqual(readDeclaredServerNames(join(dir, "missing.json")).length, 0);
      writeFileSync(file, "{not json");
      strictEqual(readDeclaredServerNames(file).length, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("engram provisioning — registration reports exactly what was written (AC3)", () => {
  it("registers the resolved binary with the workflow's argv", () => {
    const { calls, register } = recorder();
    const report = provisionEngram({ consented: true, binaryPath: BINARY, declaredNames: [], register });
    strictEqual(report.status, "registered");
    deepStrictEqual(calls, [{ name: ENGRAM_SERVER_NAME, config: { command: BINARY, args: [...ENGRAM_ARGS] } }]);
    deepStrictEqual(report.server, { name: ENGRAM_SERVER_NAME, command: BINARY, args: [...ENGRAM_ARGS] });
    ok(report.message.includes(BINARY), report.message);
    ok(report.message.includes(ENGRAM_ARGS.join(" ")), report.message);
    ok(report.message.includes("does not persist"), "the report says the registration is session-scoped");
  });

  it("states that nothing was written on every refusal path", () => {
    for (const input of [
      { consented: false, binaryPath: BINARY, register: () => {} },
      { consented: true, binaryPath: null, register: () => {} },
      { consented: true, binaryPath: BINARY, register: null },
    ]) {
      const report = provisionEngram({ ...input, declaredNames: [] });
      ok(report.message.includes("nothing was written"), `${report.status}: ${report.message}`);
    }
  });
});

describe("engram provisioning — the discarded install route never ships (O11)", () => {
  it("the module's own text names the pi install route, never the CLI setup subcommand", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { dirname, resolve } = await import("node:path");
    const here = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(resolve(here, "../src/extension/engram.ts"), "utf8");
    ok(source.includes(ENGRAM_INSTALL_ROUTE));
    ok(!/engram\s+setup\s+pi/.test(source), "the stale-version setup subcommand must not be printed as the route");
  });
});
