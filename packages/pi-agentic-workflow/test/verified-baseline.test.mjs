// verified-baseline.test.mjs — the README's verified-pi record and the manifest's
// peer floor are one fact with two readers, so they must not drift.
//
// `README.md` → `## Notes` states two things a consumer reads at a glance: the
// pi version the package was last verified against (with the date of the run)
// and the peer floor it was verified *down* to. The floor is a second copy of
// `package.json`'s `peerDependencies` entry — a copy is allowed, a drifting one
// is not (the same contract `scripts/unit-doc-contract.test.mjs` enforces for
// the unit-doc section list). Feature 72 paid three review cycles for stale
// version literals in exactly this block, so the record is now machine-read
// instead of trusted: one dated baseline, at or above the floor, and a floor
// sentence that still says what the manifest says.
//
// Version-independent on purpose: no pi version is typed here, so a
// re-verification edits the README (and the release note) and leaves this file
// alone.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const PEER = "@earendil-works/pi-coding-agent";

const readme = () => readFileSync(join(PKG_DIR, "README.md"), "utf8");
const manifest = () => JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));

/** The verified baseline: `Also verified against Pi 1.2.3 (2026-10-14)`. */
const BASELINE = /Also verified against Pi (\d+\.\d+\.\d+) \((\d{4}-\d{2}-\d{2})\)/g;
/** The floor the package was verified down to: `peer floor Pi 0.99.1`. */
const FLOOR_CLAIM = /peer floor Pi (\d+\.\d+\.\d+)/;

const atLeast = (a, b) => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) if (pa[i] !== pb[i]) return pa[i] > pb[i];
  return true;
};

/** The floor the manifest declares, or a failure naming the entry to add. */
function manifestFloor() {
  const spec = manifest().peerDependencies?.[PEER];
  assert.ok(
    typeof spec === "string",
    `package.json no longer declares ${PEER} in peerDependencies — the README floor has nothing to mirror`,
  );
  const match = />=\s*(\d+\.\d+\.\d+)/.exec(spec);
  assert.ok(match, `${PEER} peer spec "${spec}" carries no ">=x.y.z" floor for the README to mirror`);
  return match[1];
}

const baselines = () => [...readme().matchAll(BASELINE)].map((m) => ({ version: m[1], date: m[2] }));

test("the Notes carry exactly one dated verified baseline", () => {
  const found = baselines();
  assert.equal(
    found.length,
    1,
    `README Notes must state one "Also verified against Pi <x.y.z> (<YYYY-MM-DD>)" claim, found ${found.length} — a second claim is the stale-baseline defect feature 72 folded three times`,
  );
  const { version, date } = found[0];
  assert.match(version, /^\d+\.\d+\.\d+$/, `the baseline version "${version}" is not a full release`);
  assert.equal(
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10),
    date,
    `the baseline date "${date}" is not a real calendar day`,
  );
});

test("the verified baseline is at or above the peer floor", () => {
  const [baseline] = baselines();
  assert.ok(baseline, "README Notes carry no verified baseline to compare against the floor");
  const floor = manifestFloor();
  assert.ok(
    atLeast(baseline.version, floor),
    `the README claims it was verified against Pi ${baseline.version}, below the declared floor ${floor} — the record and the manifest disagree`,
  );
});

test("the README's floor sentence names the floor the manifest declares", () => {
  const match = FLOOR_CLAIM.exec(readme());
  assert.ok(
    match,
    "README Notes no longer state the peer floor it was verified down to (`peer floor Pi <x.y.z>`)",
  );
  assert.equal(
    match[1],
    manifestFloor(),
    `README says the floor is ${match[1]} while package.json declares ${manifestFloor()} — one fact, two readers, one of them stale`,
  );
});
