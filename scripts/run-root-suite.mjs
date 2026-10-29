#!/usr/bin/env node
/**
 * The root gate — `scripts/*.test.mjs`, one command.
 *
 * Two environment facts a test suite must not inherit from the machine it runs
 * on, both of which turn a green gate red for reasons that have nothing to do
 * with the code under test:
 *
 *  - `commit.gpgsign=true` in the operator's global git config. Dozens of
 *    fixtures `git init` a throwaway repository and commit into it; with signing
 *    on, every one of those goes to a pinentry that has no tty, so the failure
 *    is `gpg failed to sign the data: Inappropriate ioctl for device` — under
 *    load it surfaces as `Cannot allocate memory`. CI never sees it (runners
 *    sign nothing), so this is a local-only flake that reads like a real defect
 *    and appears in whichever suite happens to be running.
 *  - A caller-provided `GIT_CONFIG_*` / `GIT_AUTHOR_*` set that would pin the
 *    fixtures to the caller's identity or signing key.
 *
 * A fixture repository is disposable: it has no business signing. The gate
 * therefore runs the suites with signing disabled for anything that does not
 * opt in, and leaves `GIT_DEFAULT_BRANCH`, the identity and the rest of the
 * environment alone — a suite that wants to prove signing behaviour can set
 * `commit.gpgsign` itself.
 *
 * Usage
 *   node scripts/run-root-suite.mjs            # the whole root gate
 *   node scripts/run-root-suite.mjs -- <args>  # forward args to `node --test`
 *
 * Exit: whatever `node --test` returns, the exit status is forwarded verbatim.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Every root suite, discovered the same way the shell glob does. */
function suites() {
  return fs
    .readdirSync(path.join(REPO_ROOT, "scripts"))
    .filter((name) => name.endsWith(".test.mjs"))
    .sort()
    .map((name) => path.join("scripts", name));
}

const forwarded = process.argv.slice(2);
const selected = forwarded.length > 0 ? forwarded : suites();

// `-c commit.gpgsign=false` applies to commands this process spawns only; the
// suites also `git init` fresh repositories, whose own config starts empty and
// inherits this as the system/global layer.
const result = spawnSync(process.execPath, ["--test", ...selected], {
  cwd: REPO_ROOT,
  stdio: "inherit",
  env: {
    ...process.env,
    GIT_CONFIG_COUNT: String(Number(process.env.GIT_CONFIG_COUNT ?? 0) + 1),
    [`GIT_CONFIG_KEY_${process.env.GIT_CONFIG_COUNT ?? 0}`]: "commit.gpgsign",
    [`GIT_CONFIG_VALUE_${process.env.GIT_CONFIG_COUNT ?? 0}`]: "false",
  },
});

process.exit(result.status ?? 1);
