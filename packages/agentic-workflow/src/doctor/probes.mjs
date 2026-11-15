/**
 * probes.mjs — the doctor's only host access (issue #537 S4).
 *
 * Every reading the checker needs is a method on one `ops` object, so the suite
 * drives the whole contract through a fake and a real run touches the host only
 * here. Read-only by construction: nothing in this module writes a file, a git
 * key or a process state.
 *
 * Provenance: the PATH resolution, the `<binary> --version` probe and the
 * `git config --get` read are the same primitives `scripts/setup-env.mjs` uses;
 * the HTTP read is a bounded `fetch` (node's global, no dependency) with a hard
 * timeout so a hung server can never hang the doctor.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { execFile as execFileCallback, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";

/** How long one probe may take before the surface counts as answering nothing. */
const PROBE_TIMEOUT_MS = 5000;
/** How long one HTTP read may take. `resources/check.mjs` uses the same spirit. */
const HTTP_TIMEOUT_MS = 1500;

/** The first `x.y[.z]` token in an output, or null. */
export function versionToken(text) {
  const match = /(\d+(?:\.\d+)+)/u.exec(String(text ?? ""));
  return match ? match[1] : null;
}

/** Numeric semver compare — `1.10.0` is not below `1.4.0`. */
export function versionAtLeast(version, minimum) {
  if (!version || !minimum) return false;
  const left = String(version).split(".").map((part) => Number.parseInt(part, 10) || 0);
  const right = String(minimum).split(".").map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    if ((left[index] ?? 0) < (right[index] ?? 0)) return false;
  }
  return true;
}

/** `3.7.1` → `3.7`: the release line a curated pairing is declared against. */
export function releaseLine(version) {
  if (!version) return null;
  return String(version).split(".").slice(0, 2).join(".");
}

/** Resolve an executable on PATH (and `PATHEXT` on Windows). */
export function findOnPath(name, { env = process.env, platform = process.platform, isFile = existsSync } = {}) {
  const extensions = platform === "win32" ? String(env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";").filter(Boolean) : [""];
  for (const dir of String(env.PATH ?? "").split(path.delimiter).filter(Boolean)) {
    for (const extension of extensions) {
      const candidate = path.join(dir, extension ? `${name}${extension.toLowerCase()}` : name);
      try {
        if (isFile(candidate)) return candidate;
      } catch {
        // an unreadable PATH entry is not the name's answer
      }
    }
  }
  return null;
}

/**
 * The real host access. Everything is injectable so a suite never reads the
 * machine: `spawn`, `fetchImpl`, `env`, `home`, `platform`, `arch`, `root`.
 */
export function realOps({
  root = process.cwd(),
  env = process.env,
  home = os.homedir(),
  platform = process.platform,
  arch = process.arch,
  spawn = spawnSync,
  fetchImpl = globalThis.fetch,
  execFileImpl = execFileCallback,
  now = () => new Date().toISOString(),
} = {}) {
  const execFileAsync = promisify(execFileImpl);
  const probe = (program, args) => {
    const result = spawn(program, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: PROBE_TIMEOUT_MS,
    });
    if (result.error || result.status !== 0) return null;
    return `${result.stdout ?? ""}${result.stderr ?? ""}`;
  };

  return {
    root,
    home,
    platform,
    arch,
    env,
    /** The running runtime's Node.js compatibility version (the CLI is node-shaped). */
    nodeVersion: process.versions.node,
    runtime: process.execPath,
    now,
    /** `ENGRAM_BIN`-style override first, then PATH. */
    binaryPath: (name, envVar = null) => {
      const override = envVar ? String(env[envVar] ?? "").trim() : "";
      if (override !== "") return override;
      if (name === "node") return process.execPath;
      return findOnPath(name, { env, platform });
    },
    version: (name) => versionToken(probe(name, ["--version"])),
    /** Every version at once: `serena --version` alone costs seconds, so the
     *  wall time is the slowest probe rather than their sum. */
    versionMany: async (names) => {
      const entries = await Promise.all(
        names.map(async (name) => {
          try {
            const { stdout, stderr } = await execFileAsync(name, ["--version"], { timeout: PROBE_TIMEOUT_MS, encoding: "utf8" });
            return [name, versionToken(`${stdout}${stderr}`)];
          } catch (error) {
            return [name, versionToken(`${error?.stdout ?? ""}${error?.stderr ?? ""}`)];
          }
        }),
      );
      return new Map(entries);
    },
    readText: (file) => {
      try {
        return readFileSync(file, "utf8");
      } catch {
        return null;
      }
    },
    exists: (file) => {
      try {
        return existsSync(file);
      } catch {
        return false;
      }
    },
    listDir: (dir) => {
      try {
        return readdirSync(dir);
      } catch {
        return [];
      }
    },
    git: (gitRoot, args) => {
      const result = spawn("git", ["-C", gitRoot, ...args], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: PROBE_TIMEOUT_MS,
      });
      return { status: result.status ?? 1, stdout: (result.stdout ?? "").trim() };
    },
    ghAuth: () => {
      const result = spawn("gh", ["auth", "status"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: PROBE_TIMEOUT_MS,
      });
      const detail = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split("\n")[0] ?? "";
      return { authenticated: result.status === 0, detail };
    },
    httpJson: async (url) => {
      if (typeof fetchImpl !== "function") return { ok: false, body: null };
      try {
        const response = await fetchImpl(url, { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) });
        if (!response.ok) return { ok: false, body: null };
        return { ok: true, body: await response.json() };
      } catch {
        return { ok: false, body: null };
      }
    },
  };
}
