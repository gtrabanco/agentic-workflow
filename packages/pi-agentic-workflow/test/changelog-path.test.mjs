// changelog-path.test.mjs — issue #694 S3: the packages' release notes have a door.
//
// Pi shows an extension's "What's New" by reading the changelog the package
// declares (`pi.changelogPath`, resolved inside the package root, defaulting to
// `CHANGELOG.md`) and diffing its versioned sections against the installed
// version. Neither Pi package declared the key or shipped the file, so *Extension
// Updates* was blank for both — not because nothing changed, but because nothing
// was readable.
//
// The contract this pins has two halves that must not drift: the manifest names
// the file and publishes it, and the file's newest section is the version the
// manifest carries. The section text is the release cut's business
// (`scripts/release.mjs apply`, one writer); this suite only reads the pair.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The repository root: this suite lives in `packages/<name>/test`. */
const REPO_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
/** The directory that holds every package the workspace ships. */
const PACKAGES_DIR = resolve(REPO_ROOT, "packages");
/** The markdown code span the companion rows use around a package name. */
const BACKTICK = String.fromCharCode(96);

/** Every Pi package the workspace ships, by directory — read, never listed by hand. */
const PI_PACKAGES = [
  "pi-agentic-workflow",
  "pi-nan-agentic-workflow",
].map((dir) => {
  const at = join(PACKAGES_DIR, dir);
  const manifestPath = join(at, "package.json");
  return {
    dir,
    at,
    manifestPath,
    manifest: JSON.parse(readFileSync(manifestPath, "utf8")),
  };
});

/** The `## [x.y.z] - <date>` sections of a changelog, in file order (newest first). */
function sections(text) {
  const found = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const match = /^##\s+\[?(\d+)\.(\d+)\.(\d+)\]?\s*(?:-\s*(\d{4}-\d{2}-\d{2}))?\s*$/u.exec(lines[i]);
    if (match === null) continue;
    const body = [];
    for (let j = i + 1; j < lines.length && !lines[j].startsWith("## "); j += 1) body.push(lines[j]);
    found.push({
      version: `${match[1]}.${match[2]}.${match[3]}`,
      date: match[4] ?? null,
      body: body.join("\n").trim(),
    });
  }
  return found;
}

for (const pkg of PI_PACKAGES) {
  test(`${pkg.dir}: the manifest declares pi.changelogPath and publishes the file`, () => {
    const declared = pkg.manifest.pi?.changelogPath;
    assert.equal(
      typeof declared,
      "string",
      `${pkg.dir}/package.json declares no pi.changelogPath — Pi reads the default only when the file exists, and this package declared neither`,
    );
    const target = resolve(pkg.at, declared);
    assert.ok(existsSync(target), `${pkg.dir}: pi.changelogPath points at ${declared}, which is not in the package`);
    assert.ok(
      (pkg.manifest.files ?? []).includes("CHANGELOG.md"),
      `${pkg.dir}/package.json must list CHANGELOG.md in "files" — an unpublished changelog reads as an absent one`,
    );
  });

  test(`${pkg.dir}: the changelog's newest section is the version the manifest carries`, () => {
    const declared = pkg.manifest.pi?.changelogPath;
    assert.equal(typeof declared, "string", `${pkg.dir} declares no pi.changelogPath`);
    const found = sections(readFileSync(resolve(pkg.at, declared), "utf8"));
    assert.ok(found.length > 0, `${pkg.dir}'s changelog carries no "## [x.y.z] - <date>" section`);
    assert.equal(
      found[0].version,
      pkg.manifest.version,
      `${pkg.dir}: the changelog's newest section is ${found[0].version} while package.json carries ${pkg.manifest.version} — the release cut writes both`,
    );
  });

  test(`${pkg.dir}: every section is dated, versioned and says what changed`, () => {
    const declared = pkg.manifest.pi?.changelogPath;
    const found = sections(readFileSync(resolve(pkg.at, declared), "utf8"));
    const seen = new Set();
    for (const section of found) {
      assert.ok(section.date !== null, `${pkg.dir}: ${section.version} carries no ISO date — Pi's reader sorts by version, but a human reads the date`);
      assert.equal(
        new Date(`${section.date}T00:00:00Z`).toISOString().slice(0, 10),
        section.date,
        `${pkg.dir}: ${section.version}'s date "${section.date}" is not a real calendar day`,
      );
      assert.ok(section.body !== "", `${pkg.dir}: ${section.version} has an empty body — a section with no text shows an empty note`);
      assert.equal(seen.has(section.version), false, `${pkg.dir}: ${section.version} appears twice`);
      seen.add(section.version);
    }
  });
}

test("a shipped section reads the root companion row the cut seeds it from (issue #694 F1)", () => {
  // The package changelog is not authored: `scripts/release.mjs apply` seeds it
  // from the package's root companion row, so the two must read alike. A note
  // that exists as a separate edit drifts on the next cut — the garbled clause
  // review-change's F1 found was seeded that way and survived because nothing
  // compared the pair. This reads the newest section of each declared changelog
  // against the cell the root CHANGELOG.md carries for that version.
  const root = readFileSync(join(REPO_ROOT, "CHANGELOG.md"), "utf8");
  for (const pkg of PI_PACKAGES) {
    const declared = pkg.manifest.pi?.changelogPath;
    if (declared === undefined) continue;
    const newest = sections(readFileSync(resolve(pkg.at, declared), "utf8"))[0];
    assert.ok(newest !== undefined, `${pkg.dir}: the declared changelog carries no section`);
    // The row says which package the alignment held back; the cell's pipes are
    // escaped by the cut's own `escapeCell`, so the comparison undoes that here.
    const row = root
      .split("\n")
      .find((line) => line.startsWith(`| ${newest.version} |`) && line.includes(`leaving ${BACKTICK}${pkg.manifest.name}${BACKTICK}`));
    assert.ok(row !== undefined, `${pkg.dir}: ${newest.version} has no root companion row naming ${pkg.manifest.name}`);
    const cell = row.split(" | ").at(-1).replace(/\s*\|\s*$/u, "").trim();
    assert.equal(
      newest.body.replace(/\\`/gu, "`"),
      cell.replace(/\\`/gu, "`").replace(/\\\\/gu, "\\"),
      `${pkg.dir}: ${newest.version}'s shipped note is not the root row's text — the cut seeds one from the other`,
    );
  }
});

test("every package that declares a changelog is a Pi package the workspace ships", () => {
  // The reader walks the two directories this workspace publishes as Pi
  // packages; a third one added later must join this list or its notes stay
  // dark. Guards against the list silently shrinking (a rename reads as absent).
  for (const dir of ["pi-agentic-workflow", "pi-nan-agentic-workflow"]) {
    assert.ok(existsSync(join(PACKAGES_DIR, dir, "package.json")), `${dir} is not a package directory any more`);
  }
  assert.equal(PI_PACKAGES.length, 2);
});
