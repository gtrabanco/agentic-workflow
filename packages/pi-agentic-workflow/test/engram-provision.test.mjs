/**
 * Tests for the Engram MCP provisioning (feature 66, P4 — AC3, O10/O11).
 *
 * The contract these pin, in the order the module decides it (issue #531 adds
 * the two skip statuses the native-only Engram model demands):
 *
 *   not-consented      no `memory.engram` opt-in ⇒ nothing registered
 *   native-active      the native gentle-engram package provides mem_* ⇒ nothing registered
 *   external-server    `ENGRAM_URL` names a running server ⇒ nothing registered
 *   binary-missing     no `engram` core binary on PATH ⇒ nothing registered, surfaces named
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

import { BASE_CONFIG_FILE } from "@gtrabanco/agentic-workflow-schema";

import {
  ENGRAM_ARGS,
  ENGRAM_INSTALL_ROUTE,
  ENGRAM_SERVER_NAME,
  declaredMcpServerPaths,
  isNativeEngramPackage,
  piSettingsPaths,
  provisionEngram,
  readDeclaredServerNames,
  readDeclaredServerNamesFrom,
  readInstalledPackageSources,
  readInstalledPackageSourcesFrom,
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

  it("names the file the switch is read from, never the extension file that refuses it (S3a)", () => {
    // `memory` is a base-config section: `loadConfig` merges it from
    // `agentic-workflow.json`, and the extension file's own ROOT_KEYS list has no
    // `memory` key, so an operator who follows the extension-file instruction
    // makes the file invalid and lands on `config-invalid` instead.
    const report = provisionEngram({ consented: false, binaryPath: BINARY, declaredNames: [], register: () => {} });
    strictEqual(report.status, "not-consented");
    ok(report.message.includes(BASE_CONFIG_FILE), `the opt-in names ${BASE_CONFIG_FILE}: ${report.message}`);
    ok(
      !report.message.includes(`pi-${BASE_CONFIG_FILE}`),
      `the extension file refuses \`memory\` as an unknown key, so it is never named: ${report.message}`,
    );
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

describe("engram provisioning — the native gentle-engram package wins (issue #531, AC1)", () => {
  it("registers nothing and reports native-active when the native extension is installed", () => {
    const { calls, register } = recorder();
    const report = provisionEngram({
      consented: true,
      binaryPath: BINARY,
      nativePackagePresent: true,
      declaredNames: [],
      register,
    });
    strictEqual(report.status, "native-active");
    strictEqual(calls.length, 0, "the native mem_* tools already exist; a second MCP path would duplicate them");
    ok(!report.server);
    ok(report.message.includes("gentle-engram"), report.message);
    ok(/native-only/u.test(report.message), "the report names the native-only agent-write guarantee");
    ok(/nothing was written/u.test(report.message), report.message);
  });

  it("native-active outranks the MCP path even when the binary resolves and nothing is declared", () => {
    const report = provisionEngram({
      consented: true,
      binaryPath: BINARY,
      nativePackagePresent: true,
      declaredNames: [ENGRAM_SERVER_NAME],
      register: () => {},
    });
    strictEqual(report.status, "native-active");
    // The leftover declaration is the one thing that still breaks native-only
    // writes, and this branch is the only one that can say so: `already-declared`
    // never runs once the native package answers first.
    ok(/mcp\.json Pi reads still declares/u.test(report.message), report.message);
    ok(/remove that entry/u.test(report.message), report.message);
  });

  it("consent still comes first: no opt-in stays silent even with the native package present", () => {
    const { calls, register } = recorder();
    const report = provisionEngram({
      consented: false,
      binaryPath: null,
      nativePackagePresent: true,
      declaredNames: [],
      register,
    });
    strictEqual(report.status, "not-consented");
    strictEqual(calls.length, 0);
  });
});

describe("engram provisioning — an external server is a deliberate choice (issue #531, AC2)", () => {
  it("reports external-server and registers nothing when ENGRAM_URL names a server", () => {
    const { calls, register } = recorder();
    const report = provisionEngram({
      consented: true,
      binaryPath: null,
      engramUrl: "http://127.0.0.1:7437",
      declaredNames: [],
      register,
    });
    strictEqual(report.status, "external-server");
    strictEqual(calls.length, 0, "stdio MCP cannot target a URL; the native tools serve memory there");
    ok(report.message.includes("ENGRAM_URL"), report.message);
    ok(/nothing was written/u.test(report.message), report.message);
  });

  it("blank ENGRAM_URL is unset — the binary refusal still applies", () => {
    const report = provisionEngram({
      consented: true,
      binaryPath: null,
      engramUrl: "   ",
      declaredNames: [],
      register: () => {},
    });
    strictEqual(report.status, "binary-missing");
  });

  it("the native package outranks the external server: both present reports native-active", () => {
    const report = provisionEngram({
      consented: true,
      binaryPath: null,
      engramUrl: "http://127.0.0.1:7437",
      nativePackagePresent: true,
      declaredNames: [],
      register: () => {},
    });
    strictEqual(report.status, "native-active");
    // …and the deliberate configuration is still stated, never hidden by the
    // native branch: AC2 asks for it to be reported, AC1 for the native fact.
    ok(/served by the external Engram server/u.test(report.message), report.message);
  });
});

describe("engram provisioning — the binary-missing message names the core binary (issue #531, AC3)", () => {
  it("names PATH and ENGRAM_BIN for the core binary, ENGRAM_URL for a server, and the companion route separately", () => {
    const report = provisionEngram({
      consented: true,
      binaryPath: null,
      declaredNames: [],
      register: () => {},
    });
    strictEqual(report.status, "binary-missing");
    ok(/core binary/u.test(report.message), report.message);
    ok(report.message.includes("ENGRAM_BIN"), report.message);
    ok(report.message.includes("ENGRAM_URL"), report.message);
    ok(report.message.includes(ENGRAM_INSTALL_ROUTE), "the companion route stays named, as one surface among three");
  });
});

describe("engram provisioning — native package detection reads Pi's settings.json (issue #531, AC4)", () => {
  it("collects string and object package entries and matches gentle-engram", () => {
    const dir = mkdtempSync(join(tmpdir(), "engram-native-"));
    try {
      const file = join(dir, "settings.json");
      writeFileSync(
        file,
        JSON.stringify({
          packages: ["npm:pi-clear", "npm:gentle-engram@latest", { source: "npm:pi-effort" }],
        }),
      );
      const sources = readInstalledPackageSources(file);
      deepStrictEqual(sources, ["npm:pi-clear", "npm:gentle-engram@latest", "npm:pi-effort"]);
      strictEqual(isNativeEngramPackage(sources), true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("an install without gentle-engram, a missing file or malformed JSON resolves no native package", () => {
    const dir = mkdtempSync(join(tmpdir(), "engram-native-absent-"));
    try {
      const file = join(dir, "settings.json");
      writeFileSync(file, JSON.stringify({ packages: ["npm:pi-clear", { source: "npm:pi-effort" }] }));
      strictEqual(isNativeEngramPackage(readInstalledPackageSources(file)), false);
      deepStrictEqual(readInstalledPackageSources(join(dir, "missing.json")), []);
      writeFileSync(file, "{not json");
      deepStrictEqual(readInstalledPackageSources(file), []);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("engram provisioning — the package list is read from every scope Pi reads (issue #531, AC4)", () => {
  it("names Pi's two settings files, and the project one only while the project is trusted", () => {
    deepStrictEqual(piSettingsPaths({ agentDir: "/fixture/agent", cwd: "/fixture/repo", projectTrusted: true }), [
      join("/fixture/agent", "settings.json"),
      join("/fixture/repo", ".pi", "settings.json"),
    ]);
    deepStrictEqual(piSettingsPaths({ agentDir: "/fixture/agent", cwd: "/fixture/repo", projectTrusted: false }), [
      join("/fixture/agent", "settings.json"),
    ]);
  });

  it("unions the sources across the files Pi reads, without duplicates", () => {
    const dir = mkdtempSync(join(tmpdir(), "engram-settings-scopes-"));
    try {
      const agentDir = join(dir, "agent");
      const cwd = join(dir, "repo");
      mkdirSync(join(cwd, ".pi"), { recursive: true });
      mkdirSync(agentDir, { recursive: true });
      // Pi dedupes a package configured in both scopes, so the reader must not
      // report the same source twice.
      writeFileSync(
        join(agentDir, "settings.json"),
        JSON.stringify({ packages: ["npm:pi-clear", "npm:gentle-engram@latest"] }),
      );
      writeFileSync(
        join(cwd, ".pi", "settings.json"),
        JSON.stringify({ packages: [{ source: "npm:gentle-engram@latest" }, "npm:pi-effort"] }),
      );

      const trusted = readInstalledPackageSourcesFrom(piSettingsPaths({ agentDir, cwd, projectTrusted: true }));
      deepStrictEqual(trusted, ["npm:pi-clear", "npm:gentle-engram@latest", "npm:pi-effort"]);
      strictEqual(isNativeEngramPackage(trusted), true);

      // Untrusted: Pi does not read the project settings file at all, so a
      // project-scope declaration cannot be evidence of an installed package.
      const untrusted = readInstalledPackageSourcesFrom(piSettingsPaths({ agentDir, cwd, projectTrusted: false }));
      deepStrictEqual(untrusted, ["npm:pi-clear", "npm:gentle-engram@latest"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("a project-scope-only declaration is honoured when trusted and invisible when not", () => {
    const dir = mkdtempSync(join(tmpdir(), "engram-settings-project-"));
    try {
      const agentDir = join(dir, "agent");
      const cwd = join(dir, "repo");
      mkdirSync(join(cwd, ".pi"), { recursive: true });
      mkdirSync(agentDir, { recursive: true });
      writeFileSync(join(agentDir, "settings.json"), JSON.stringify({ packages: ["npm:pi-clear"] }));
      writeFileSync(join(cwd, ".pi", "settings.json"), JSON.stringify({ packages: ["npm:gentle-engram@latest"] }));

      const trusted = readInstalledPackageSourcesFrom(piSettingsPaths({ agentDir, cwd, projectTrusted: true }));
      strictEqual(isNativeEngramPackage(trusted), true, "a trusted project's install is one Pi loads");

      const untrusted = readInstalledPackageSourcesFrom(piSettingsPaths({ agentDir, cwd, projectTrusted: false }));
      strictEqual(isNativeEngramPackage(untrusted), false, "an untrusted project loads no package");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("engram provisioning — ENGRAM_BIN is a resolution surface, not only a name (issue #531, AC3)", () => {
  it("resolves the override before scanning PATH, and reports it as the resolved binary", () => {
    const present = resolveEngramBinary({
      env: { PATH: "/usr/local/bin", ENGRAM_BIN: "/opt/engram/bin/engram" },
      platform: "linux",
      exists: (path) => path === "/opt/engram/bin/engram",
    });
    strictEqual(present, "/opt/engram/bin/engram", "the route the refusal names has to work");
  });

  it("resolves a bare ENGRAM_BIN name on PATH, as Engram's own extension does", () => {
    const resolved = resolveEngramBinary({
      env: { PATH: "/opt/tools:/usr/local/bin", ENGRAM_BIN: "engram-custom" },
      platform: "linux",
      exists: (path) => path === "/opt/tools/engram-custom",
    });
    strictEqual(resolved, "/opt/tools/engram-custom");
  });

  it("an override that resolves nothing fails closed instead of falling back to PATH", () => {
    // Falling back would contradict the operator's explicit choice and register
    // a binary they did not name — the report has to be true about what runs.
    const resolved = resolveEngramBinary({
      env: { PATH: "/usr/local/bin", ENGRAM_BIN: "/nope/engram" },
      platform: "linux",
      exists: (path) => path === "/usr/local/bin/engram",
    });
    strictEqual(resolved, null);
  });

  it("a blank ENGRAM_BIN is unset, exactly as Engram's extension treats it", () => {
    const resolved = resolveEngramBinary({
      env: { PATH: "/usr/local/bin", ENGRAM_BIN: "   " },
      platform: "linux",
      exists: (path) => path === "/usr/local/bin/engram",
    });
    strictEqual(resolved, "/usr/local/bin/engram");
  });

  it("the resolved override is what gets registered, so the report names the binary that will run", () => {
    const { calls, register } = recorder();
    const report = provisionEngram({
      consented: true,
      binaryPath: "/opt/engram/bin/engram",
      declaredNames: [],
      register,
    });
    strictEqual(report.status, "registered");
    strictEqual(calls[0].config.command, "/opt/engram/bin/engram");
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
