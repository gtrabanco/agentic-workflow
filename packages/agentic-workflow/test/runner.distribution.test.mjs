/**
 * runner.distribution.test.mjs — issue #352's distribution proof.
 *
 * The claim under test is the one the whole unit exists for: *a project with no
 * clone of this repository can run every command the skills cite*. The proof is
 * built from the crate's own published surface — the `files` list in its
 * `package.json` — copied into a throwaway directory, with nothing but the
 * declared dependencies beside it. From there the bin is invoked exactly as a
 * skill invokes it.
 *
 * Network-free and deterministic by construction: no `npm pack`, no registry,
 * no repository path in the copied tree. The dependency tree the crate declares
 * is linked in as an installed one would be, because the question here is not
 * "do the dependencies exist" but "does the shipped source travel alone".
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));

/** Copy exactly what the package publishes into a fresh directory. */
function publishedCopy() {
  const root = mkdtempSync(join(tmpdir(), "runner-dist-"));
  for (const entry of manifest.files) {
    const from = join(packageRoot, entry);
    if (!existsSync(from)) continue;
    cpSync(from, join(root, entry), { recursive: true });
  }
  // An installed package resolves its declared dependencies; linking the
  // workspace's tree is that step without a registry round-trip.
  symlinkSync(join(packageRoot, "node_modules"), join(root, "node_modules"), "dir");
  return root;
}

/** Every file under `dir`, as paths relative to it. */
function filesUnder(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...filesUnder(abs, base));
    else out.push(relative(base, abs));
  }
  return out;
}

const run = (cwd, ...args) => spawnSync(process.execPath, [join(cwd, "bin", "agentic-workflow.mjs"), ...args], { cwd, encoding: "utf8" });

test("the published surface alone runs the runner, with no repository file behind it", () => {
  const root = publishedCopy();
  try {
    const files = filesUnder(root).filter((f) => !f.startsWith("node_modules"));
    assert.ok(files.includes("bin/agentic-workflow.mjs"), "the bin ships");
    assert.ok(files.includes("src/runner/cli.mjs"), "the runner's dispatch table ships");
    assert.ok(files.includes("src/runner/catalog.json"), "the router's catalog ships with the package");
    assert.ok(files.includes("src/runner/ceremony/index.mjs"), "the ceremony registry ships");

    // No shipped module may reach outside the package: a repository script
    // import would resolve on the authoring checkout and fail on a target.
    for (const file of files.filter((f) => f.startsWith("src/") && f.endsWith(".mjs"))) {
      const text = readFileSync(join(root, file), "utf8");
      const imports = [...text.matchAll(/(?:from|require\()\s*"([^"]+)"/gu)].map((m) => m[1]);
      for (const spec of imports) {
        assert.doesNotMatch(spec, /^(\.\.\/)+scripts\//u, `${file} imports a repository script (${spec})`);
        assert.doesNotMatch(spec, /agentic-workflow-schema\/src\//u, `${file} imports the schema's TypeScript source (${spec})`);
      }
    }

    const ceremony = run(root, "ceremony");
    assert.equal(ceremony.status, 1, "a ceremony call with no object is the closed-world usage error");
    assert.equal(JSON.parse(ceremony.stdout).error, "usage");
    assert.ok(JSON.parse(ceremony.stdout).objects.includes("workspace"), "the registry answers from the shipped copy");

    const routed = run(root, "unit-route", "--help");
    assert.equal(routed.status, 0, routed.stderr);
    assert.match(routed.stdout, /^usage: agentic-workflow unit-route /mu, "the router answers with its own usage line, never a script path");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the pin the skills cite is the version this package publishes", () => {
  const runner = readFileSync(fileURLToPath(new URL("../../../skills/runner-contract/references/RUNNER.md", import.meta.url)), "utf8");
  const pin = /bunx @gtrabanco\/agentic-workflow@([0-9A-Za-z.\-]+)/u.exec(runner)?.[1];
  assert.equal(pin, manifest.version, "RUNNER.md's pin and the crate's manifest are one value — the drift gate recomputes both");
});

test("no version literal is restated anywhere else the skills cite", () => {
  const skillsRoot = fileURLToPath(new URL("../../../skills/", import.meta.url));
  const offenders = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      if (statSync(abs).isDirectory()) walk(abs);
      else if (name.endsWith(".md") && !abs.endsWith("RUNNER.md")) {
        const text = readFileSync(abs, "utf8");
        if (/@gtrabanco\/agentic-workflow@[0-9]/u.test(text)) offenders.push(relative(skillsRoot, abs));
      }
    }
  };
  walk(skillsRoot);
  assert.deepEqual(offenders, [], "the pin lives in RUNNER.md only");
});
