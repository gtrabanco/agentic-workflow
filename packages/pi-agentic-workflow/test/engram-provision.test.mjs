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
 * reachable. The suite imports the compiled `dist/` like every other pi-package
 * test: `src/extension/engram.js` is not a file that exists (the source is
 * `.ts`), so bun resolved it through its own TS handling while `node --test` —
 * the package's declared `test:node` fallback — could not. Setup path only: no
 * assertion was touched, and both runners now execute the same suite.
 */

import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ENGRAM_ARGS,
  ENGRAM_INSTALL_ROUTE,
  ENGRAM_SERVER_NAME,
  declaredMcpServerPaths,
  provisionEngram,
  readDeclaredServerNames,
  readDeclaredServerNamesFrom,
  resolveEngramBinary,
} from "../dist/extension/engram.js";

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

describe("engram provisioning — the declaration check reads every file Pi reads (F6)", () => {
  it("names both scopes, and the project scope only while the project is trusted", () => {
    deepStrictEqual(
      declaredMcpServerPaths({ agentDir: "/fixture/agent", cwd: "/fixture/repo", projectTrusted: true }),
      [join("/fixture/agent", "mcp.json"), join("/fixture/repo", ".pi", "mcp.json")],
    );
    deepStrictEqual(declaredMcpServerPaths({ agentDir: "/fixture/agent", cwd: "/fixture/repo", projectTrusted: false }), [
      join("/fixture/agent", "mcp.json"),
    ]);
  });

  it("a project-declared engram is already declared — the guard that read only the user file missed it", () => {
    const dir = mkdtempSync(join(tmpdir(), "engram-scopes-"));
    try {
      const agentDir = join(dir, "agent");
      const cwd = join(dir, "repo");
      mkdirSync(join(cwd, ".pi"), { recursive: true });
      mkdirSync(agentDir, { recursive: true });
      writeFileSync(join(agentDir, "mcp.json"), JSON.stringify({ mcpServers: { jira: { command: "jira" } } }));
      writeFileSync(join(cwd, ".pi", "mcp.json"), JSON.stringify({ mcpServers: { engram: { command: "/somewhere/engram" } } }));

      const paths = declaredMcpServerPaths({ agentDir, cwd, projectTrusted: true });
      const declared = readDeclaredServerNamesFrom(paths);
      ok(declared.includes(ENGRAM_SERVER_NAME), `the project file's declaration is visible: ${declared.join(",")}`);

      const { calls, register } = recorder();
      const report = provisionEngram({ consented: true, binaryPath: BINARY, declaredNames: declared, register });
      strictEqual(report.status, "already-declared");
      strictEqual(calls.length, 0, "nothing is registered over a declaration Pi would honour instead");

      // Untrusted project: the project file is not read at all, exactly as the
      // loader treats it — and the user file alone still yields no shadowing.
      const untrusted = readDeclaredServerNamesFrom(
        declaredMcpServerPaths({ agentDir, cwd, projectTrusted: false }),
      );
      deepStrictEqual(untrusted, ["jira"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("engram provisioning — an unreadable config is not a refusal the operator made (F5)", () => {
  it("reports config-invalid instead of reading a broken file as no-consent", () => {
    // `loadConfig` fails closed: a present-but-invalid file hands back the
    // shipped default, whose `memory.engram` is false. Falling through to the
    // consent branch told an opted-in operator to opt in — and `dispatch.ts`
    // refuses the same file rather than defaulting it.
    const { calls, register } = recorder();
    const report = provisionEngram({
      consented: false,
      configInvalid: true,
      binaryPath: BINARY,
      declaredNames: [],
      register,
    });
    strictEqual(report.status, "config-invalid");
    strictEqual(calls.length, 0, "consent that cannot be read is never treated as granted…");
    ok(/invalid/u.test(report.message), report.message);
    ok(/nothing was written/u.test(report.message), "…and the refusal says nothing was written");
    ok(!/set "memory"/u.test(report.message), "it does not tell an opted-in operator to opt in");
  });

  it("a broken config outranks consent, the binary and the host", () => {
    const report = provisionEngram({
      consented: true,
      configInvalid: true,
      binaryPath: null,
      declaredNames: [ENGRAM_SERVER_NAME],
      register: null,
    });
    strictEqual(report.status, "config-invalid");
  });
});
