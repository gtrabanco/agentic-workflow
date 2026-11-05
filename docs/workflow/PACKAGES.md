# Companion npm packages

> Deep reference for the guide's `## Deep references` index. `AGENTS.md` keeps
> only the pointer, so these rules are read when `packages/` is touched, never on
> every session.

## Packages

The packages under `packages/` are members of a **bun workspace**: a private
root `package.json` declares `workspaces: ["packages/*"]` and carries no
identity of its own. Members link each other **from the folder**, so a package
that pins a sibling installs that sibling's working copy — not a published
tarball — while the manifest keeps the exact version every consumer receives
(`npm publish` does not rewrite a `workspace:` spec, so the exact version is
what ships and the protocol is never used).

The reason is not convenience: a sibling pin used to name a version that only
existed **after** the merge that changed it, so a bump and its pin move could
never share a commit — the pin named an unpublished version (uninstallable) and
the lockfile could not be regenerated before the publish `--frozen-lockfile`
requires. The workspace removes that ordering trap; the pin rule below is still
enforced, and install itself enforces it (a pin that does not match the
member's version resolves from the registry and fails).

- **bun is the package manager, everywhere, with ONE lockfile.** `bun.lock` at
  the repository root (committed) is the sole lockfile for every member:
  install at the root with `bun install --frozen-lockfile`, or from a member
  directory (bun resolves the workspace root and installs the whole graph);
  run scripts with `bun run <script>`. A `bun.lock` or `package-lock.json`
  inside a package is drift — it would resolve that package's siblings from the
  registry instead of from the folder — and `scripts/workspace-lock-policy.test.mjs`
  fails the suite if one appears (both npm lockfiles resurrected once, on main,
  and had to be removed again). The npm CLI is still used for the publish step
  only (Trusted Publishing + `--provenance` are npm-CLI-specific tooling Bun
  doesn't replicate).
- **Dependency versions are pinned; floating specs are not.** Every `dependencies`/`devDependencies` entry names a version a fresh resolution may install: a full release (`6.0.3`) or a **deliberate partial pin** (`6`, `7`, `6.0`). A partial pin is a claim about the dependency, and it always carries its reason — the compiler is the standing example: TypeScript **honours semver** and is a well-maintained project, so a major-only pin still receives the fixes and the performance work of every 7.x release without a manifest edit, and this repository wants the speed of the native compiler. Refused, with no exception: `^`, `~`, `*`, `latest`, any other dist-tag, `x` ranges, and the local-only protocols `file:`, `link:`, `workspace:`, `git+` — each lets an install resolve to bytes nobody reviewed without the dependency having earned that trust. The committed `bun.lock` still records the exact resolution for every pin, partial or full, so byte-for-byte reproducibility does not depend on how precise the manifest specifier is. A partial pin is invisible to the `--pins` half of the parity gate (it verifies exact pins only), so it moves on the owner's deliberate `fix(deps)` cadence, not on a gate's nudge. `peerDependencies` stay ranges by nature (they resolve against the host's own version — e.g. the pi peer). Dependency **upgrades are deliberate `fix(deps)` PRs on a cadence** (not side effects of other work): bump the pinned versions, re-run the gate, ship as a patch.
- **Version bumps are manual and same-PR — and CI-enforced (feature 75, #292; trigger set extended to every package in feature 40).**
  Bump `version:` in the touched package's `package.json` and add a row to the
  "Companion npm packages" table in `CHANGELOG.md` in the same PR — or, since
  feature 40, ship a valid `.changeset/*.md` declaring the package (the
  release train applies it at cut time). The rule is no longer prose-only:
  `scripts/local-gate.mjs` runs `scripts/version-parity-gate.mjs` — locally on
  every pre-merge run, and remotely when the manual gate is dispatched (the
  local-first rule is [`AGENTS.md`](../../AGENTS.md) → Verification) — with two
  halves — the **content** half (offline, deterministic) fails any change
  under the trigger set of **every package under `packages/` (derived from the
  tree at runtime — a new package inherits the gate by existing; nothing to
  extend)** plus **`skills/**`** as the Pi package's shipped content, unless
  each triggered package is bumped + has its CHANGELOG companion row or is
  declared by a changeset (root `skills/` is the Pi package's staged content,
  which is exactly why a skills-only merge used to publish nothing; the
  skills-content-source mapping is the gate's only declared constant — extend
  it if a new package ever becomes a `skills/` content source, and audit the
  gate if packages ever ship outside `packages/`); the **registry** half (a
  separate job, clearly-degraded-when-
  unreachable) fails an exact pin whose target has published a newer version,
  and — for pins whose target is a local package under `packages/` — a pin that
  does not equal the **local package version** (the one the merge publishes;
  verified offline even when the registry is unreachable): a pin behind it
  recreates the post-publish red window, a pin ahead of everything points at a
  version that will never exist — fix: bump the pin + the package version in
  the same PR. The workspace is what makes that instruction executable: the
  member resolves its sibling from the folder, so the pin may name a version
  the merge has not published yet, and the root lock stays installable with
  `--frozen-lockfile` (before the workspace, that same instruction was
  unsatisfiable — an unpublished pin did not resolve, and a stale lock failed
  the install — so the pin could only chase a publish). CI publishes on merge
  to `main` when the version differs
  from the registry — one consolidated workflow since 2026-10-28
  (`.github/workflows/publish.yml`, three jobs chained schema → crate → pi;
  D-40-12): npm Trusted Publisher records pin the workflow filename, so the
  consolidation required re-registering the three packages' records to
  `publish.yml` on npmjs.com (owner one-time step; until then a publish
  fails E403). Releases are cut by dispatching `publish.yml` with `mode: cut`
  (`channel: stable` = train + publish, npm dist-tag `latest`;
  `channel: canary` = prerelease cut for the declared packages — the channel
  set is closed, and the old `latest` channel name is retired in favour of
  `stable`) — `mode: suggest` previews the
  versions read-only; everything runs `scripts/release.mjs` in CI.
- **Changesets file-format adopted, tool not** (decided 2026-08-30; reopened by feature 40 / issue #180, 2026-10-28). The curated changelog tables above remain the release-notes surface. The 2026-08-30 rejection targeted the full changesets tool (workspace root, version-PR loop, Trusted Publisher re-binding); both reopening triggers have since fired — a third package landed and per-package snapshot channels are needed — so the **file format** is now the per-PR release intent: a `.changeset/*.md` (YAML frontmatter mapping `"<package>"` or `"<skill-name>"`: patch|minor|major — the highest severity in the set always wins the train (D-40-15) — plus a release-note body), linted by `scripts/lint-changeset.mjs` and consumed by `scripts/release.mjs` at release time. A valid intent file declaring a package satisfies the version-parity gate's content half for that package in place of a manual package.json bump (the gate covers every package under `packages/` + `skills/` as the Pi package's content source); the tool's workspace machinery, version-PR loop and Trusted Publisher re-binding stay rejected.

**The release body is rendered, not concatenated** (issue #375).
`scripts/release.mjs release-notes` turns the pending changesets into a document
that is deterministic for a tree + date: an `## Install` block for the channel
being cut (`@canary` + the pinned `#v<tag>` skills ref, or `latest` +
`#v<version>`) with the way back to the other one — re-running the install
replaces the recorded source, so no uninstall is involved; a `## Package bumps`
table; one `##` section per kind (`Breaking changes` first) and one `###`
heading per change, taken from the **first line of its changeset body**, so that
line is a conventional commit title (`type(scope)!: subject`) — the linter warns
when it is not. A canary puts the changes added since the previous canary's tag
first and collapses the rest: nothing consumes changesets until a stable cut.
`--generate-notes` still appends the generated PR list and its author credit.