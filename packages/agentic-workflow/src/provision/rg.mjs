/**
 * provision/rg.mjs — the ask-first, never-root `rg` bootstrap (issue #269,
 * remaining P1 scope). The runner crate owns the script (issue #269's
 * dependency note: feature 61's crate is the bootstrap's home); a future
 * wizard command may consume the same module.
 *
 * Contract (issue #269, P1 "Bootstrap installer"):
 *   1. skip entirely when `rg` is already installed;
 *   2. otherwise explain the reason and ask before installing (ask-first);
 *   3. user-scoped package managers only — brew, cargo, npm/bun global user
 *      prefix, pipx, scoop — no sudo/root, ever;
 *   4. else download the PINNED binary (digest-verified) to `~/.local/bin`
 *      when writable and on `$PATH`;
 *   5. else `<root>/.agentic-workflow/bin/` plus the `.gitignore` entry.
 *
 * Every dependency is injectable through the `ops` object so tests run the
 * whole contract without a real manager, download or PATH change.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync, inflateRawSync } from "node:zlib";
import { spawnSync } from "node:child_process";
import { homedir as realHomedir, platform as realPlatform, arch as realArch } from "node:os";
import { createInterface } from "node:readline/promises";

export const RECEIPT_SCHEMA = "provision-rg@1";
export const RG_PIN = {
  version: "15.2.0",
  digests: {
    "x86_64-unknown-linux-musl.tar.gz": "33e15bcf1624b25cdd2a55813a47a2f95dbe126268203e76aa6a585d1e7b149c",
    "aarch64-unknown-linux-gnu.tar.gz": "a740b91c82eaf9914cfedd353572f2791cbe0162c84101ee0951058f4dcbc90d",
    "aarch64-apple-darwin.tar.gz": "3750b2e93f37e0c692657da574d7019a101c0084da05a790c83fd335bad973e4",
    "x86_64-apple-darwin.tar.gz": "af7825fcc69a2afc7a7aea55fc9af90e26421d8f20fe59df32e233c0b8a231c1",
    "x86_64-pc-windows-msvc.zip": "71b2fef860abe467217a538ff31de02f5258807c0129f771846f87bd029aafc5",
  },
};

export const PROVISION_VERDICTS = Object.freeze([
  "installed",
  "already-installed",
  "refused-root",
  "refused-consent",
  "refused-unsupported-platform",
  "refused-digest-mismatch",
  "refused-download-failed",
  "refused-no-writable-target",
]);

/** User-scoped managers in the issue's declared order; sudo is never part of
 * any invocation. */
const MANAGERS = [
  ["brew", ["brew", "install", "ripgrep"]],
  ["cargo", ["cargo", "install", "ripgrep", "--locked"]],
  ["npm", ["npm", "install", "-g", "ripgrep"]],
  ["bun", ["bun", "add", "-g", "ripgrep"]],
  ["pipx", ["pipx", "install", "ripgrep"]],
  ["scoop", ["scoop", "install", "ripgrep"]],
];

function platformKey(ops) {
  const { platform, arch } = ops.platform();
  if (platform === "linux" && arch === "x64") return "x86_64-unknown-linux-musl.tar.gz";
  if (platform === "linux" && (arch === "arm64" || arch === "aarch64")) return "aarch64-unknown-linux-gnu.tar.gz";
  if (platform === "darwin" && arch === "arm64") return "aarch64-apple-darwin.tar.gz";
  if (platform === "darwin" && arch === "x64") return "x86_64-apple-darwin.tar.gz";
  if (platform === "win32" && arch === "x64") return "x86_64-pc-windows-msvc.zip";
  return null;
}

function receipt(verdict, method = null, target = null, note = null) {
  return { receipt: RECEIPT_SCHEMA, tool: "rg", verdict, method, target, note, exitCode: verdict.startsWith("refused-") ? 1 : 0 };
}

/** The single entry point. `ops` carries every side effect. */
export async function provisionRg(ops) {
  if (ops.isRoot()) {
    return receipt("refused-root", null, null, "running as root — the bootstrap installs user-scoped only and never with sudo; re-run as the user");
  }
  if (ops.rgInstalled()) {
    return receipt("already-installed", null, null, "rg found on PATH; skipped entirely");
  }

  // Ask-first: nothing installs before consent. Consent is recorded, never guessed.
  let consentSource = null;
  if (ops.yes) {
    consentSource = "flag";
  } else if (ops.interactive) {
    const answer = (await ops.ask("rg is not installed; the workflow runs `rg` first with `grep` as the documented fallback. Install it now (user-scoped, never sudo)? [y/N] ")).trim().toLowerCase();
    if (answer !== "y" && answer !== "yes") {
      return receipt("refused-consent", null, null, "declined — the tools keep the declared grep fallback until rg is installed");
    }
    consentSource = "prompt";
  } else {
    return receipt("refused-consent", null, null, "non-interactive without --yes: pass --yes to consent, or re-run interactively to be asked");
  }

  for (const [name, args] of MANAGERS) {
    if (!ops.managerAvailable(name)) continue;
    const outcome = ops.installWith(name, args);
    ops.appendConsent({ date: ops.now(), tool: "rg", action: "install", source: consentSource, method: name, verdict: outcome.ok ? "installed" : "failed" });
    if (!outcome.ok) {
      continue; // try the next user-scoped manager
    }
    return receipt("installed", name, null, "installed via a user-scoped package manager; a fresh shell may be needed for PATH");
  }

  // No user-scoped manager: the pinned, digest-verified binary download.
  const key = platformKey(ops);
  if (key === null || !RG_PIN.digests[key]) {
    return receipt("refused-unsupported-platform", null, null, `no user-scoped manager and no pinned build for ${JSON.stringify(ops.platform())} — install rg manually (https://github.com/BurntSushi/ripgrep/releases)`);
  }
  const url = `https://github.com/BurntSushi/ripgrep/releases/download/${RG_PIN.version}/ripgrep-${RG_PIN.version}-${key}`;
  let bytes;
  try {
    const response = await ops.fetch(url);
    if (!response.ok) return receipt("refused-download-failed", null, null, `fetch ${url} failed`);
    bytes = response.bytes;
  } catch {
    return receipt("refused-download-failed", null, null, `fetch ${url} failed`);
  }
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== (ops.pinOverride?.[key] ?? RG_PIN.digests[key])) {
    return receipt("refused-digest-mismatch", null, null, `sha256 ${digest} does not match the pinned digest for ${key} — no byte was written`);
  }

  const binary = key.endsWith(".zip") ? unzipBinary(bytes) : tarBinary(gunzipSync(bytes));
  if (binary === null) {
    return receipt("refused-download-failed", null, null, `the pinned artifact ${key} did not contain the rg binary`);
  }

  const home = ops.homedir();
  const localBin = join(home, ".local", "bin");
  const targetDir = (ops.canWrite(localBin) && ops.pathIncludes(localBin)) ? localBin : join(ops.root, ".agentic-workflow", "bin");
  if (!(targetDir === localBin || ops.canWrite(targetDir))) {
    return receipt("refused-no-writable-target", null, null, "neither ~/.local/bin nor .agentic-workflow/bin is writable");
  }
  const name = key.endsWith(".zip") ? "rg.exe" : "rg";
  const target = join(targetDir, name);
  ops.writeBinary(target, binary);
  try {
    ops.chmod(target, 0o755);
  } catch {
    // best-effort on filesystems without exec bits
  }
  if (targetDir === join(ops.root, ".agentic-workflow", "bin")) {
    ops.appendText(join(ops.root, ".gitignore"), ".agentic-workflow/bin/\n");
  }
  ops.appendConsent({ date: ops.now(), tool: "rg", action: "install", source: consentSource, method: "pinned-download", verdict: "installed" });
  return receipt("installed", "pinned-download", target, `${RG_PIN.version} verified against the pinned digest`);
}

/** Minimal ustar reader: the first regular file named `…/rg` or `rg`. */
export function tarBinary(tarBytes) {
  let offset = 0;
  while (offset + 512 <= tarBytes.length) {
    const header = tarBytes.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) return null;
    const rawName = header.subarray(0, 100).toString("utf8").replace(/\0.*$/u, "");
    const prefix = header.subarray(345, 500).toString("utf8").replace(/\0.*$/u, "");
    const name = prefix ? `${prefix}/${rawName}` : rawName;
    const size = Number.parseInt(header.subarray(124, 136).toString("utf8").replace(/\0.*$/u, "").trim(), 8) || 0;
    const typeflag = String.fromCharCode(header[156] === 0 ? 48 : header[156]);
    offset += 512;
    if ((typeflag === "0" || typeflag === "\0") && /(^|\/)rg$/u.test(name)) {
      return tarBytes.subarray(offset, offset + size);
    }
    offset += size + ((512 - (size % 512)) % 512);
  }
  return null;
}

/** Minimal zip reader over local file headers: the first entry named `…/rg.exe`. */
export function unzipBinary(zipBytes) {
  const marker = Buffer.from("PK\x03\x04");
  let index = zipBytes.indexOf(marker);
  while (index !== -1) {
    const method = zipBytes.readUInt16LE(index + 8);
    const compressedSize = zipBytes.readUInt32LE(index + 18);
    const nameLength = zipBytes.readUInt16LE(index + 26);
    const extraLength = zipBytes.readUInt16LE(index + 28);
    const name = zipBytes.subarray(index + 30, index + 30 + nameLength).toString("utf8");
    const dataStart = index + 30 + nameLength + extraLength;
    if (/(^|\/)rg\.exe$/u.test(name)) {
      const compressed = zipBytes.subarray(dataStart, dataStart + compressedSize);
      return method === 0 ? compressed : inflateRawSync(compressed);
    }
    index = zipBytes.indexOf(marker, dataStart + Math.max(compressedSize, 1));
  }
  return null;
}

/** The real side-effect bundle for the CLI. */
export function realOps(root) {
  return {
    root,
    yes: false,
    interactive: Boolean(process.stdout.isTTY && process.stdin.isTTY),
    isRoot: () => typeof process.getuid === "function" && process.getuid() === 0,
    now: () => new Date().toISOString(),
    rgInstalled: () => spawnSync("rg", ["--version"], { encoding: "utf8" }).status === 0,
    managerAvailable: (name) => spawnSync(name, ["--version"], { encoding: "utf8" }).status === 0,
    installWith: (name, args) => {
      const outcome = spawnSync(name, args, { encoding: "utf8", stdio: "inherit" });
      return { ok: outcome.status === 0 };
    },
    ask: async (question) => {
      const line = createInterface({ input: process.stdin });
      const answer = await line.question(question);
      line.close();
      return answer;
    },
    fetch: async (url) => {
      const response = await fetch(url, { redirect: "follow" });
      if (!response.ok) return { ok: false };
      return { ok: true, bytes: Buffer.from(await response.arrayBuffer()) };
    },
    platform: () => ({ platform: realPlatform(), arch: realArch() }),
    homedir: realHomedir,
    pathIncludes: (dir) => (process.env.PATH ?? "").split(":").includes(dir),
    canWrite: (dir) => {
      try {
        mkdirSync(dir, { recursive: true });
        return true;
      } catch {
        return false;
      }
    },
    exists: existsSync,
    readTextSafe: (p) => (existsSync(p) ? readFileSync(p, "utf8") : null),
    writeBinary: (p, bytes) => {
      mkdirSync(join(p, ".."), { recursive: true });
      writeFileSync(p, bytes);
    },
    chmod: (p, mode) => chmodSync(p, mode),
    appendText: (p, data) => {
      const current = existsSync(p) ? readFileSync(p, "utf8") : "";
      if (current.split("\n").some((line) => line.trim() === data.trim())) return;
      writeFileSync(p, current + (current.endsWith("\n") || current === "" ? "" : "\n") + data);
    },
    appendConsent: (record) => {
      const ledgerDir = join(root, ".agentic-workflow");
      mkdirSync(ledgerDir, { recursive: true });
      appendFileSync(join(ledgerDir, "provision-log.jsonl"), `${JSON.stringify(record)}\n`);
    },
  };
}
