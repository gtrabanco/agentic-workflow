/**
 * single-repo-leaks — the census and the standing criterion for one defect
 * class (issue #717): a shipped surface that resolves a path this repository
 * owns as if the consumer's project owned it.
 *
 * #716 fixed the first instance (the batch scheduler's lane vocabulary). The
 * class regrows one surface at a time because a repo-relative path reading is
 * invisible until a foreign tree hits it, and the crate's own fail-closed
 * standards make the two failure shapes look like answers:
 *
 *   - a command refuses, naming a path only this repository has
 *     (`packages/agentic-workflow-schema/src/vocabularies.ts is absent under …`);
 *   - a command answers `PASS`/`not-applicable` because it found nothing to
 *     judge, which is a false pass rather than a degradation.
 *
 * The criterion has two halves and no third:
 *
 *   declaration  every subcommand the CLI publishes states which root it
 *                resolves against — `project`, `product` or `host` — in the
 *                help registry, the one machine home of the CLI grammar. A
 *                command with no cell, or with a value outside the set, is a
 *                finding, so a new subcommand cannot skip the question;
 *   probe        every read-only `project` row that declares a `probe` argv is
 *                executed once against a consumer-shaped fixture built from the
 *                template, and any path token it prints that resolves in the
 *                product tree but not in the fixture is a finding. That is the
 *                measured form of the issue's own test: *is the consumer able to
 *                satisfy or declare this path?*
 *
 * A lexical sweep of path literals is deliberately NOT the instrument: it cannot
 * tell a resolved path from a prose citation (measured: 458 raw hits, 138 with
 * comments stripped, dominated by citations and by segment-wise `path.join`
 * calls), so it would measure wording instead of resolution.
 *
 * Usage
 *   single-repo-leaks [--root <dir>] [--json]
 *   (node fallback, same argv)
 *
 * stdout: one fixed block — `single-repo-leaks@1`, the root line, the declared
 * tally, the probed tally, one `finding — <code> · <command> · <detail>` line per
 * finding, then `verdict`. Exit: 0 `PASS` · 1 `FAIL` or `REFUSED` · 2 a usage
 * error.
 *
 * Read-only over the project it measures, and it writes nothing inside the
 * product tree: the fixture it probes is built under `os.tmpdir()` and removed
 * in the same run. Its sibling suite is `scripts/single-repo-leaks.test.mjs`.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const CONTRACT = "single-repo-leaks@1";
/** The closed resolution vocabulary. Order is report order. */
export const RESOLUTIONS = Object.freeze(["project", "product", "host"]);
/** The closed finding set, in report order. */
export const FINDING_CODES = Object.freeze([
  "undeclared-command",
  "unknown-resolution",
  "product-path-named",
  "probe-failed",
  "empty-registry",
  "missing-root",
  "product-root-missing",
]);

/** The registry field that carries the declaration. */
export const RESOLUTION_FIELD = "resolution";
/** The registry field that opts a row into the probe, with its argv tail. */
export const PROBE_FIELD = "probe";
/** How long one probe may run before it is reported as a skip. */
export const PROBE_TIMEOUT_MS = 60_000;

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * The product tree: an explicit root as given, else the nearest ancestor of this
 * crate that carries the `template/` scaffold. One resolver for both entry routes
 * — the shipped `runner single-repo-leaks` and this repository's `scripts/` caller
 * measure the same tree, so neither can quietly mute the leak comparison
 * (issue #717, F3).
 */
export function resolveProductRoot(explicit = null) {
  if (explicit !== null && explicit !== undefined) return path.resolve(explicit);
  let candidate = PACKAGE_ROOT;
  for (;;) {
    if (fs.existsSync(path.join(candidate, "template"))) return candidate;
    const parent = path.dirname(candidate);
    if (parent === candidate) return PACKAGE_ROOT;
    candidate = parent;
  }
}

/**
 * The declaration half: one row per published subcommand, and the findings a
 * registry carries. Pure over the registry, so a fixture registry takes the same
 * path as the shipped one.
 */
export function declarations(registry) {
  const entries = Object.entries(registry ?? {});
  const findings = [];
  if (entries.length === 0) {
    findings.push({ code: "empty-registry", command: "-", detail: "the help registry publishes no subcommand" });
    return { rows: [], findings };
  }
  const rows = entries.map(([command, entry]) => {
    const resolution = entry?.[RESOLUTION_FIELD];
    if (resolution === undefined) {
      findings.push({ code: "undeclared-command", command, detail: `declares no \`${RESOLUTION_FIELD}\` cell` });
    } else if (!RESOLUTIONS.includes(resolution)) {
      findings.push({ code: "unknown-resolution", command, detail: `declares \`${resolution}\`, which is not ${RESOLUTIONS.join("/")}` });
    }
    const probe = entry?.[PROBE_FIELD];
    return {
      command,
      family: entry?.family ?? "-",
      resolution: resolution ?? null,
      probe: typeof probe === "string" ? probe : null,
      probed: resolution === "project" && typeof probe === "string",
    };
  });
  return { rows, findings };
}

/** Path-shaped tokens a command's output carries, outside quoted command spans. */
export function pathTokens(text) {
  const tokens = new Set();
  for (const match of String(text ?? "").matchAll(/(?:^|[\s`"'(=:])((?:packages|skills|template|scripts|docs|\.github|\.agentic-workflow)\/[A-Za-z0-9._@/-]+)/g)) {
    tokens.add(match[1].replace(/[.,;:]+$/, ""));
  }
  return [...tokens].sort();
}

const isFile = (target) => {
  try {
    return fs.statSync(target).isFile();
  } catch {
    return false;
  }
};

/** The measured root resolves only when it is a directory the probes can run in. */
const rootStat = (target) => {
  try {
    return fs.statSync(target);
  } catch {
    return null;
  }
};

/**
 * The leak: a token the command printed that the product tree carries and the
 * measured root does not. A token the project itself owns is never a finding —
 * that is the difference between a declared convention and this class.
 */
export function productPathFindings({ command, output, root, productRoot }) {
  const findings = [];
  for (const token of pathTokens(output)) {
    if (isFile(path.join(root, token))) continue;
    if (!isFile(path.join(productRoot, token))) continue;
    findings.push({
      code: "product-path-named",
      command,
      detail: `names \`${token}\`, which resolves in the product tree and not under ${root}`,
    });
  }
  return findings;
}

/** Copy the seeded scaffold into the fixture, then add one project-owned tree. */
export function buildFixture(dir, productRoot) {
  const scaffold = path.join(productRoot, "template");
  const seeded = fs.existsSync(scaffold);
  if (seeded) fs.cpSync(scaffold, dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "AGENTS.md"), fs.existsSync(path.join(dir, "AGENTS.md")) ? fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8") : "# Project guide\n");
  fs.mkdirSync(path.join(dir, "src", "pages"), { recursive: true });
  fs.writeFileSync(path.join(dir, "src", "pages", "ledger.ts"), "export const ledger = [];\n");
  fs.writeFileSync(path.join(dir, "src", "pages", "ledger.test.ts"), "// a co-located suite\n");
  fs.mkdirSync(path.join(dir, "docs", "fix", "49-ledger"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs", "fix", "49-ledger", "SPEC.md"), "# fix/49-ledger\n");
  // The declared conventions a consumer adopts (the product's own path
  // constants name them): the modern roadmap index and the journal carrier.
  // Without them a `project`-class command that legitimately names one would be
  // read as a leak, and the census would measure the fixture's gaps instead of
  // the command's assumptions.
  fs.writeFileSync(path.join(dir, "docs", "ROADMAP.md"), "# Roadmap\n");
  fs.mkdirSync(path.join(dir, ".agentic-workflow", "journal"), { recursive: true });
  return seeded;
}

/**
 * Why a probe's answer is not an answer, or `null` when the command ran. A probe
 * that never ran is never scored executed-and-clean: the fail-closed standard this
 * command exists to enforce applies to its own run (issue #717, F1).
 */
function probeFailure(result) {
  if (result.timedOut === true) return `did not answer inside ${PROBE_TIMEOUT_MS} ms`;
  if (result.error) return `did not run: ${result.error.message ?? result.error}`;
  if (result.signal) return `was killed by ${result.signal}`;
  if (!Number.isInteger(result.status)) return "answered without an exit status";
  return null;
}

/**
 * The probe half. `run` is injectable so a suite can drive the same code without
 * spawning the CLI; the default runs this crate's bin in the fixture root.
 */
export function probeRows({ rows, root, productRoot = root, bin, run }) {
  const findings = [];
  const probed = [];
  for (const row of rows.filter((entry) => entry.probed)) {
    const argv = row.probe.trim() === "" ? [] : row.probe.trim().split(/\s+/);
    const result = run({ bin, argv, root });
    const failure = probeFailure(result);
    if (failure !== null) {
      findings.push({ code: "probe-failed", command: row.command, detail: failure });
      continue;
    }
    probed.push(row.command);
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    findings.push(...productPathFindings({ command: row.command, output, root, productRoot }));
  }
  return { probed, findings };
}

/** The default runner: this crate's own bin, in the measured root. */
export function defaultRun({ bin, argv, root, execPath = process.execPath }) {
  const result = spawnSync(execPath, [bin, ...argv], {
    cwd: root,
    encoding: "utf8",
    timeout: PROBE_TIMEOUT_MS,
    env: { ...process.env, AGENTIC_WORKFLOW_PROBE: "1" },
  });
  const timedOut = result.error?.code === "ETIMEDOUT" || result.signal === "SIGTERM";
  return {
    status: result.status,
    signal: result.signal ?? null,
    error: result.error ?? null,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    timedOut,
  };
}

/** The fixed report block. */
export function renderReceipt(result) {
  const lines = [CONTRACT];
  lines.push(`root | ${result.fixture ? "consumer fixture" : "caller root"} · ${result.root}`);
  lines.push(`declared | ${result.tally.total} subcommand(s) · ${RESOLUTIONS.map((value) => `${value} ${result.tally[value] ?? 0}`).join(" · ")}`);
  lines.push(`probe | ${result.probed.length} read-only project command(s) executed · ${result.tally.probeable} declared`);
  for (const finding of result.findings) lines.push(`finding — ${finding.code} · ${finding.command} · ${finding.detail}`);
  lines.push(`verdict ${result.verdict}`);
  return `${lines.join("\n")}\n`;
}

const USAGE = "usage: single-repo-leaks [--root <dir>] [--json]";

/**
 * The whole run: the declaration, the fixture, the probes, the receipt. A root
 * the caller names is measured as it is; without one the fixture is built from
 * the product's own template and removed again, so the default run measures a
 * consumer shape without touching this checkout.
 */
export function census({ registry, productRoot = resolveProductRoot(), root = null, bin = path.join(PACKAGE_ROOT, "bin", "agentic-workflow.mjs"), run = defaultRun } = {}) {
  const { rows, findings } = declarations(registry);
  const tally = { total: rows.length, probeable: rows.filter((row) => row.probed).length };
  for (const value of RESOLUTIONS) tally[value] = rows.filter((row) => row.resolution === value).length;

  const fixture = root === null;
  let measuredRoot = root;
  let scratch = null;
  try {
    // A tree that cannot carry the comparison cannot answer it: without the
    // product's own scaffold a path this repository carries is indistinguishable
    // from one the project does, and a zero-finding run would be a false pass
    // (issue #717, F3).
    if (!fs.existsSync(path.join(productRoot, "template"))) {
      findings.push({
        code: "product-root-missing",
        command: "-",
        detail: `${productRoot} carries no template/ scaffold, so a product path cannot be told from a project one`,
      });
      return { fixture, root: measuredRoot ?? productRoot, tally, probed: [], findings, verdict: "REFUSED" };
    }
    if (fixture) {
      scratch = fs.mkdtempSync(path.join(os.tmpdir(), "single-repo-leaks-"));
      measuredRoot = scratch;
      buildFixture(scratch, productRoot);
    }
    const stats = rootStat(measuredRoot);
    if (stats === null || !stats.isDirectory()) {
      const detail = stats === null ? `${measuredRoot} does not exist` : `${measuredRoot} is not a directory the probes can run in`;
      findings.push({ code: "missing-root", command: "-", detail });
      return { fixture, root: measuredRoot, tally, probed: [], findings, verdict: "REFUSED" };
    }
    const probe = probeRows({
      rows,
      root: measuredRoot,
      productRoot,
      bin,
      run,
    });
    findings.push(...probe.findings);
    return {
      fixture,
      root: measuredRoot,
      tally,
      probed: probe.probed,
      findings,
      verdict: findings.length === 0 ? "PASS" : "FAIL",
    };
  } finally {
    if (scratch !== null) fs.rmSync(scratch, { recursive: true, force: true });
  }
}

/** CLI: `--root` and `--json`, nothing else. */
export async function main(argv = process.argv.slice(2), context = {}) {
  let root = null;
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      const value = argv[index + 1];
      if (!value) {
        process.stderr.write(`single-repo-leaks: --root needs a directory\n${USAGE}\n`);
        return 2;
      }
      root = path.resolve(value);
      index += 1;
    } else if (arg === "--json") {
      json = true;
    } else {
      process.stderr.write(`single-repo-leaks: unknown argument ${arg}\n${USAGE}\n`);
      return 2;
    }
  }
  const { HELP_REGISTRY } = await import("../runner/help.mjs");
  const productRoot = resolveProductRoot(context.root ?? null);
  const result = census({ registry: HELP_REGISTRY, productRoot, root, bin: context.bin ?? path.join(PACKAGE_ROOT, "bin", "agentic-workflow.mjs") });
  if (json) {
    process.stdout.write(`${JSON.stringify({ contract: CONTRACT, ...result }, null, 2)}\n`);
  } else {
    process.stdout.write(renderReceipt(result));
  }
  return result.verdict === "PASS" ? 0 : 1;
}
