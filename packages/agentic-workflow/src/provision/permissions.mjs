// permissions.mjs — the guard-plugin policy projection (issue #654).
//
// A project declares its own guards once, in `pi-agentic-workflow.json`, and this
// module turns that declaration into the permission layer's own policy document:
// the documented baseline first, the project's rules appended after it so the
// layer's last-match-wins order grants exactly what the author meant.
//
// Two rules keep the projection honest and the operator in charge:
//   * a collision (two declarations disagreeing on one rule) is refused here,
//     by name, instead of letting whichever came last win silently;
//   * the target file is created only when it does not exist. An operator's own
//     policy is never overwritten — the run refuses and prints the block for a
//     hand merge, because two writers on one policy file is how a policy becomes
//     unknown.
//
// The baseline is the permission package's documented starting point plus the
// scratch carve-out this repository needs: OS-temp writes are allowed outside the
// working tree (the retired shell guard allowed them and `mktemp` depends on it),
// and everything else outside the tree still asks.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir as osHomedir } from "node:os";
import { dirname, join } from "node:path";

import { renderGuardPluginPolicy } from "@gtrabanco/agentic-workflow-schema";

/** Where the permission layer reads its policy, per scope (its published paths). */
export const PERMISSION_CONFIG_RELATIVE = join("extensions", "pi-permission-system", "config.json");

/** How long an unanswered prompt waits before it is denied and the agent told. */
export const DEFAULT_PROMPT_TIMEOUT_MS = 300000;

/**
 * The documented baseline. `*`/`path`/`bash` mirror the package's own quick
 * start; `external_directory` carries the scratch allowance so a `/tmp` write is
 * not a prompt on every call, and every other outside path still asks.
 */
export const BASELINE_PERMISSION = Object.freeze({
  "*": "allow",
  path: Object.freeze({
    "*": "allow",
    "*.env": "deny",
    "*.env.*": "deny",
    "*.env.example": "allow",
  }),
  bash: Object.freeze({
    "*": "ask",
    "rm -rf *": "deny",
    "sudo *": "ask",
  }),
  external_directory: Object.freeze({
    "*": "ask",
    "/tmp/*": "allow",
    "~/.cache/*": "allow",
  }),
});

/** The absolute policy path this run would write, per scope. */
export function permissionConfigPath({ root = process.cwd(), scope = "project", home = osHomedir() } = {}) {
  if (scope === "global") return join(home, ".pi", "agent", PERMISSION_CONFIG_RELATIVE);
  return join(root, ".pi", PERMISSION_CONFIG_RELATIVE);
}

/**
 * Compose the policy document from the declared guards. `permission` is the map
 * the layer reads; `text` is the JSONC file body, with each declared rule's reason
 * kept as the comment above it so the file stays readable after a hand edit.
 */
export function renderPermissionPolicy({ guards = {} } = {}) {
  const projection = renderGuardPluginPolicy(guards);
  const target = PERMISSION_CONFIG_RELATIVE;
  if (!projection.ok) return { ok: false, permission: {}, issues: projection.issues, text: "", target };

  const permission = structuredClone(BASELINE_PERMISSION);
  const comments = {};
  for (const [name, declaration] of Object.entries(guards)) {
    if (declaration.kind !== "deterministic") continue;
    for (const rule of declaration.rules) {
      if (rule.reason) comments[`${declaration.surface}\u0000${rule.match}`] = `${name}: ${rule.reason}`;
    }
  }
  for (const [surface, rules] of Object.entries(projection.permission)) {
    const target = (permission[surface] ??= {});
    for (const [match, verdict] of Object.entries(rules)) {
      // Re-append, so a declaration that names a baseline rule lands after it.
      delete target[match];
      target[match] = verdict;
    }
  }

  return { ok: true, permission, issues: [], text: renderPolicyText({ permission, comments, target }), target };
}

function renderPolicyText({ permission, comments, target }) {
  const lines = [
    "// Permission policy for the operator-level permission layer (issue #654).",
    `// Target: ${target}`,
    "// Generated from the guards declared in `.pi/pi-agentic-workflow.json`",
    "// (`guardPlugins`): re-run `agentic-workflow provision permissions` after a",
    "// change there instead of editing a rule twice. Last matching rule wins, so a",
    "// specific rule belongs after its catch-all.",
    "{",
    '  "permission": {',
  ];
  const entries = Object.entries(permission);
  entries.forEach(([key, value], index) => {
    const comma = index === entries.length - 1 ? "" : ",";
    if (typeof value === "string") {
      lines.push(`    ${JSON.stringify(key)}: ${JSON.stringify(value)}${comma}`);
      return;
    }
    lines.push(`    ${JSON.stringify(key)}: {`);
    const rules = Object.entries(value);
    rules.forEach(([match, verdict], ruleIndex) => {
      const note = comments[`${key}\u0000${match}`];
      if (note !== undefined) lines.push(`      // ${note}`);
      lines.push(`      ${JSON.stringify(match)}: ${JSON.stringify(verdict)}${ruleIndex === rules.length - 1 ? "" : ","}`);
    });
    lines.push(`    }${comma}`);
  });
  lines.push("  },", `  "promptTimeoutMs": ${DEFAULT_PROMPT_TIMEOUT_MS}`, "}");
  return `${lines.join("\n")}\n`;
}

/**
 * Render, and write only into an absent file. The verdict is the machine receipt:
 * `rendered` (printed, nothing written), `written`, or `refused` — with the block
 * still returned, so a refusal is a merge instruction rather than a dead end.
 */
export function provisionPermissions({
  root = process.cwd(),
  home = osHomedir(),
  scope = "project",
  write = false,
  guards = {},
} = {}) {
  const target = permissionConfigPath({ root, scope, home });
  const rendered = renderPermissionPolicy({ guards });
  if (!rendered.ok) {
    return { ok: false, verdict: "refused", exitCode: 2, target, text: "", issues: rendered.issues };
  }
  if (!write) {
    return { ok: true, verdict: "rendered", exitCode: 0, target, text: rendered.text, issues: [] };
  }
  if (existsSync(target)) {
    return { ok: false, verdict: "refused", exitCode: 2, target, text: rendered.text, issues: [
      { path: target, message: "the permission policy already exists; merge the printed block into it by hand (this command never overwrites a policy file)" },
    ] };
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, rendered.text);
  return { ok: true, verdict: "written", exitCode: 0, target, text: rendered.text, issues: [] };
}
