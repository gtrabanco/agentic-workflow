/**
 * checks.mjs — the doctor's probes and evaluators (issue #537 S4).
 *
 * One entry per documented surface. Each entry owns only the *probe* (what to
 * read) — the declarative half (requirement, route, why, alternative) lives in
 * the crate README's `tool-inventory@1` block, so a documented fact has one home.
 *
 * `probe(ops, ctx)` returns evidence; `evaluate(evidence)` turns it into
 * `{ status, advisory, instruction, action }`. The evidence returned by the probe
 * is what the envelope prints, so every row answers "with what evidence" before
 * it answers "is it healthy". Nothing here writes, spawns an installer or
 * decides a session-level question: the evalutors are pure over the evidence.
 *
 * `ctx` carries the facts two rows share (the resolved `engram` binary and its
 * server's `/health` answer), computed once per run by `doctor.mjs`.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { RUNNER_CANDIDATES, renderInvocation } from "../runner/resolve.mjs";
import { COMPANION_PAIRINGS, NODE_ENGINE } from "./vocabulary.mjs";
import { releaseLine, versionAtLeast } from "./probes.mjs";

/**
 * This crate's own version and the bun-first closed-set head rendered at it —
 * the one symbol `resolve.mjs` owns, so the doctor's bootstrap instruction can
 * never drift from the pin the contract carries (issue #555: the launcher and
 * the pin live in one place, never spelled twice).
 */
const CRATE_VERSION = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version;
const RG_BOOTSTRAP = renderInvocation(RUNNER_CANDIDATES[0], CRATE_VERSION, ["provision", "rg", "--yes"]);

const at = (ops, ...parts) => path.join(ops.root, ...parts);

/** Pi's agent directory: `$PI_CODING_AGENT_DIR`, else `~/.pi/agent`. */
export function piAgentDir(ops) {
  const configured = String(ops.env?.PI_CODING_AGENT_DIR ?? "").trim();
  return configured !== "" ? configured : path.join(ops.home, ".pi", "agent");
}

/** The npm spec a project declared for `gentle-engram`, from Pi's own list shape. */
function companionPin(ops, dir) {
  for (const settingsPath of [path.join(dir, "settings.json"), at(ops, ".pi", "settings.json")]) {
    const text = ops.readText(settingsPath);
    if (!text) continue;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      continue;
    }
    for (const entry of Array.isArray(parsed?.packages) ? parsed.packages : []) {
      const source = typeof entry === "string" ? entry : entry?.source;
      if (typeof source === "string" && source.includes("gentle-engram")) return source;
    }
  }
  return null;
}

/** The installers a project may ship for its own declared merge drivers. */
function mergeInstaller(ops, drivers) {
  const groups = [];
  if (drivers.some((driver) => driver.startsWith("agentic-shared-"))) groups.push(["scripts/shared-doc-merge.mjs", "--install", "the shared-document drivers"]);
  if (drivers.includes("docs-generated")) groups.push(["scripts/docs-generated-merge.mjs", "--install", "the generated-projection driver"]);
  for (const [script, flag, label] of groups) {
    if (ops.exists(at(ops, script))) {
      return {
        id: "merge-drivers",
        program: ops.runtime ?? process.execPath,
        args: [at(ops, script), flag],
        cwd: ops.root,
        display: `${script} ${flag}`,
        label,
      };
    }
  }
  return null;
}

/** The adapter config files the scaffold knows about, in its own order. */
const ADAPTERS = Object.freeze([
  { id: "claude", label: "Claude Code", paths: [".mcp.json", ".claude/settings.json"] },
  { id: "cursor", label: "Cursor", paths: [".cursor/mcp.json"] },
  { id: "copilot", label: "GitHub Copilot", paths: [".vscode/mcp.json"] },
  { id: "opencode", label: "OpenCode", paths: ["opencode.json", "opencode.jsonc"] },
]);

/** Parse the `language_servers` list of a Serena project file (block or inline). */
export function languageServers(text) {
  if (!text) return [];
  const lines = String(text).split("\n");
  const start = lines.findIndex((line) => /^language_servers:\s*/u.test(line));
  if (start === -1) return [];
  const inline = /^language_servers:\s*\[(.*)\]\s*$/u.exec(lines[start]);
  if (inline) {
    return inline[1]
      .split(",")
      .map((entry) => entry.trim().replace(/^["']|["']$/gu, ""))
      .filter(Boolean);
  }
  const servers = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/u.test(line)) break;
    const item = /^\s*-\s*(.+?)\s*$/u.exec(line);
    if (item) servers.push(item[1].replace(/^["']|["']$/gu, ""));
  }
  return servers;
}

/**
 * The published checks, in the documented inventory's order. `probe` reads,
 * `evaluate` decides; neither writes.
 */
export const CHECK_PROBES = Object.freeze([
  {
    id: "node",
    probe: (ops) => ({ path: ops.binaryPath("node"), version: ops.nodeVersion ?? null, engine: NODE_ENGINE }),
    evaluate: (evidence) => {
      if (!evidence.version) {
        return { status: "missing", advisory: `no Node.js version could be read — the CLI needs ${NODE_ENGINE} (packages/agentic-workflow/package.json)`, instruction: null };
      }
      if (!versionAtLeast(evidence.version, NODE_ENGINE)) {
        return {
          status: "mismatch",
          advisory: `Node.js ${evidence.version} is below the ${NODE_ENGINE} floor packages/agentic-workflow/package.json declares — upgrade the runtime you run the CLI with`,
          instruction: null,
        };
      }
      return { status: "ok", advisory: null, instruction: null };
    },
  },
  {
    id: "bun",
    probe: (ops, ctx) => {
      const text = ops.readText(at(ops, ".bun-version"));
      return {
        path: ops.binaryPath("bun"),
        version: ctx.version("bun"),
        pin: text ? String(text).trim().replace(/^v/u, "") || null : null,
      };
    },
    evaluate: (evidence) => {
      if (!evidence.path) {
        const pin = evidence.pin ? `-s "bun-v${evidence.pin}"` : "";
        return {
          status: "missing",
          advisory: `bun is not installed — it is optional (node is the runtime fallback). Install it with: curl -fsSL https://bun.sh/install | bash ${pin}`.trim(),
          instruction: `curl -fsSL https://bun.sh/install | bash ${pin}`.trim(),
        };
      }
      if (evidence.pin && !versionAtLeast(evidence.version, evidence.pin)) {
        return {
          status: "mismatch",
          advisory: `bun ${evidence.version} is behind the committed .bun-version pin (${evidence.pin}) — an older bun cannot install this project's lockfile`,
          instruction: `curl -fsSL https://bun.sh/install | bash -s "bun-v${evidence.pin}"`,
        };
      }
      return { status: "ok", advisory: null, instruction: null };
    },
  },
  {
    id: "rg",
    probe: (ops, ctx) => ({ path: ops.binaryPath("rg"), version: ctx.version("rg") }),
    evaluate: (evidence) =>
      evidence.path
        ? { status: "ok", advisory: null, instruction: null }
        : {
            status: "missing",
            advisory: "rg is not on PATH — the workflow searches with rg first and falls back to grep, but a session that assumes rg is present is the gap this check closes",
            instruction: RG_BOOTSTRAP,
          },
  },
  {
    id: "git",
    probe: (ops, ctx) => ({
      path: ops.binaryPath("git"),
      version: ctx.version("git"),
      identity: {
        name: ops.git(ops.root, ["config", "--get", "user.name"]).stdout || null,
        email: ops.git(ops.root, ["config", "--get", "user.email"]).stdout || null,
      },
    }),
    evaluate: (evidence) => {
      if (!evidence.path) {
        return {
          status: "missing",
          advisory: "git is not installed — every unit commits, so nothing can land without it",
          instruction: null,
        };
      }
      const missing = [];
      if (!evidence.identity.name) missing.push("user.name");
      if (!evidence.identity.email) missing.push("user.email");
      if (missing.length === 0) return { status: "ok", advisory: null, instruction: null };
      const commands = missing.map((key) => `git config --global ${key} "<${key === "user.name" ? "your name" : "you@example.com"}>"`).join(" && ");
      return {
        status: "missing",
        advisory: `git has no commit identity (${missing.join(", ")} unset) — a commit would be refused`,
        instruction: commands,
      };
    },
  },
  {
    id: "gh",
    probe: (ops, ctx) => ({ path: ops.binaryPath("gh"), version: ctx.version("gh"), auth: ops.ghAuth() }),
    evaluate: (evidence) => {
      if (!evidence.path) {
        return {
          status: "missing",
          advisory: "gh is not installed — issues, pull requests and labels are read and written through it; the forge's web interface is the by-hand alternative",
          instruction: null,
        };
      }
      if (!evidence.auth?.authenticated) {
        return {
          status: "unreachable",
          advisory: `gh is installed but not authenticated${evidence.auth?.detail ? ` (${evidence.auth.detail})` : ""} — the forge half of the workflow cannot answer`,
          instruction: "gh auth login",
        };
      }
      return { status: "ok", advisory: null, instruction: null };
    },
  },
  {
    id: "serena",
    probe: (ops, ctx) => ({
      path: ops.binaryPath("serena"),
      version: ctx.version("serena"),
      project: { present: ops.exists(at(ops, ".serena", "project.yml")), languageServers: languageServers(ops.readText(at(ops, ".serena", "project.yml"))) },
      localOverride: { present: ops.exists(at(ops, ".serena", "project.local.yml")), path: ".serena/project.local.yml" },
    }),
    evaluate: (evidence) => {
      if (!evidence.path) {
        return {
          status: "missing",
          advisory: "serena is not installed — symbol-level reads and diagnostics degrade to plain text search",
          instruction: "uv tool install -p 3.13 serena-agent",
        };
      }
      if (!evidence.project.present) {
        return {
          status: "missing",
          advisory: ".serena/project.yml is missing — the project declares no language servers, so none starts (init-workspace writes the committed file)",
          instruction: null,
        };
      }
      if (evidence.project.languageServers.length === 0) {
        return {
          status: "missing",
          advisory: ".serena/project.yml lists no language_servers — the manager starts nothing for this project",
          instruction: null,
        };
      }
      return { status: "ok", advisory: null, instruction: null };
    },
  },
  {
    id: "engram-binary",
    probe: (ops, ctx) => ({
      path: ctx.engram.path,
      version: ctx.engram.version,
      source: String(ops.env?.ENGRAM_BIN ?? "").trim() !== "" ? "ENGRAM_BIN" : "PATH",
    }),
    evaluate: (evidence) =>
      evidence.path
        ? { status: "ok", advisory: null, instruction: null }
        : {
            status: "missing",
            advisory: "the engram core binary is not resolved — brew on macOS, the release tarball into ~/.local/bin elsewhere, or name an existing binary with ENGRAM_BIN",
            instruction: "brew install gentleman-programming/tap/engram",
          },
  },
  {
    id: "engram-server",
    probe: (ops, ctx) => ({
      url: ctx.engram.url,
      reachable: ctx.engram.reachable,
      status: ctx.engram.status,
      served: ctx.engram.served,
      pair: ctx.engram.served && ctx.engram.version ? { binary: ctx.engram.version, served: ctx.engram.served } : null,
    }),
    evaluate: (evidence) => {
      if (!evidence.reachable) {
        return {
          status: "unreachable",
          advisory: `no Engram server answers at ${evidence.url} — start it with \`engram run -d\`, or point ENGRAM_URL at the server you manage`,
          instruction: "engram run -d",
        };
      }
      if (evidence.pair && evidence.pair.binary !== evidence.pair.served) {
        return {
          status: "mismatch",
          advisory: `the server answers ${evidence.pair.served} while the resolved binary is ${evidence.pair.binary} — a server started from an older binary keeps serving after an upgrade (the 2026-11-13 incident): stop it, then run \`engram run -d\``,
          instruction: "engram run -d",
        };
      }
      return { status: "ok", advisory: null, instruction: null };
    },
  },
  {
    id: "gentle-engram",
    probe: (ops, ctx) => {
      const dir = piAgentDir(ops);
      const manifest = ops.readText(path.join(dir, "npm", "node_modules", "gentle-engram", "package.json"));
      let installed = null;
      try {
        installed = JSON.parse(manifest ?? "null")?.version ?? null;
      } catch {
        installed = null;
      }
      const pair = COMPANION_PAIRINGS[0] ?? null;
      const coreVersion = ctx.engram.served ?? ctx.engram.version;
      return {
        pi: ops.binaryPath("pi"),
        settingsDir: dir,
        pin: companionPin(ops, dir),
        installed,
        pair: pair && installed && coreVersion
          ? { companionLine: releaseLine(installed), coreLine: releaseLine(coreVersion) }
          : null,
        declaredPair: pair ? { companionLine: pair.companionLine, coreLine: pair.coreLine } : null,
      };
    },
    evaluate: (evidence) => {
      if (!evidence.pi) {
        return { status: "not-applicable", advisory: null, instruction: null };
      }
      if (!evidence.pin) {
        return {
          status: "missing",
          advisory: "the gentle-engram companion is not declared in Pi's settings.json packages — the memory tools have no path to Engram",
          instruction: "pi install npm:gentle-engram@latest",
        };
      }
      if (
        evidence.pair &&
        evidence.declaredPair &&
        (evidence.pair.companionLine !== evidence.declaredPair.companionLine || evidence.pair.coreLine !== evidence.declaredPair.coreLine)
      ) {
        return {
          status: "mismatch",
          advisory: `companion ${evidence.pair.companionLine}.x with core ${evidence.pair.coreLine}.x is outside the curated pairing (${evidence.declaredPair.companionLine}.x ↔ ${evidence.declaredPair.coreLine}.x) — a maintainer decision, not an operator command`,
          instruction: null,
        };
      }
      return { status: "ok", advisory: null, instruction: null };
    },
  },
  {
    id: "pi",
    probe: (ops, ctx) => ({ path: ops.binaryPath("pi"), version: ctx.version("pi"), agentDir: piAgentDir(ops) }),
    evaluate: (evidence) =>
      evidence.path
        ? { status: "ok", advisory: null, instruction: null }
        : {
            status: "missing",
            advisory: "the pi host is not installed — the workflow's skills and commands run inside it; another supported adapter is the alternative",
            instruction: null,
          },
  },
  {
    id: "agent-adapters",
    probe: (ops) => ({
      adapters: ADAPTERS.map((adapter) => {
        const found = adapter.paths.find((relative) => ops.exists(at(ops, relative)));
        return { id: adapter.id, label: adapter.label, present: Boolean(found), config: found ?? null };
      }),
    }),
    evaluate: (evidence) => {
      const present = evidence.adapters.filter((adapter) => adapter.present);
      if (present.length === 0) return { status: "not-applicable", advisory: null, instruction: null };
      return { status: "ok", advisory: null, instruction: null };
    },
  },
  {
    id: "git-hooks",
    probe: (ops) => {
      const answer = ops.git(ops.root, ["rev-parse", "--git-path", "hooks"]).stdout;
      const resolved = answer ? path.resolve(ops.root, answer) : at(ops, ".git", "hooks");
      return {
        hooksPath: resolved,
        entries: ops.listDir(resolved),
        installer: { present: ops.exists(at(ops, "scripts", "local-gate.mjs")), path: at(ops, "scripts", "local-gate.mjs") },
      };
    },
    evaluate: (evidence, ctx) => {
      if (!evidence.installer.present) return { status: "not-applicable", advisory: null, instruction: null };
      if (evidence.entries.includes("pre-push")) return { status: "ok", advisory: null, instruction: null };
      return {
        status: "unarmed",
        advisory: `the project ships the local gate but ${evidence.hooksPath} carries no pre-push hook — the offline subset never runs before a push`,
        instruction: "scripts/local-gate.mjs --install-hook",
        action: {
          id: "git-hooks",
          program: ctx.ops.runtime ?? process.execPath,
          args: [evidence.installer.path, "--install-hook"],
          cwd: ctx.ops.root,
          display: "scripts/local-gate.mjs --install-hook",
          label: "the pre-push hook",
        },
      };
    },
  },
  {
    id: "merge-drivers",
    probe: (ops) => {
      const attributes = ops.readText(at(ops, ".gitattributes")) ?? "";
      const drivers = [...new Set([...attributes.matchAll(/merge\s*=\s*([A-Za-z0-9._-]+)/gu)].map((match) => match[1]))];
      const armed = {};
      for (const driver of drivers) {
        const answer = ops.git(ops.root, ["config", "--local", "--get", `merge.${driver}.driver`]);
        armed[driver] = answer.status === 0 && answer.stdout !== "" ? answer.stdout : null;
      }
      return { drivers, armed, unarmed: drivers.filter((driver) => !armed[driver]) };
    },
    evaluate: (evidence, ctx) => {
      if (evidence.drivers.length === 0) return { status: "not-applicable", advisory: null, instruction: null };
      if (evidence.unarmed.length === 0) return { status: "ok", advisory: null, instruction: null };
      const installer = mergeInstaller(ctx.ops, evidence.unarmed);
      return {
        status: "unarmed",
        advisory: `.gitattributes declares ${evidence.unarmed.join(", ")} but no merge.<driver>.driver is armed — an un-armed driver silently falls back to a textual merge`,
        instruction: installer ? null : evidence.unarmed.map((driver) => `git config --local merge.${driver}.driver "<command>"`).join(" && "),
        action: installer,
      };
    },
  },
  {
    id: "skills-cli",
    probe: (ops) => ({
      authoring: ops.exists(at(ops, "skills.sh.json")),
      skills: ops.listDir(at(ops, "skills")).length,
    }),
    evaluate: (evidence) =>
      evidence.authoring
        ? { status: "ok", advisory: null, instruction: null }
        : { status: "not-applicable", advisory: null, instruction: null },
  },
]);
