# fix/375-release-notes-rendering

## Issue

`#375` — tracked issue. The PR closes it via `Closes #375`.

## Specs

**S1 — a release body must be readable.**
> El cuerpo de las releases con el nuevo publish.yml es una castaña y no se puede leer nada bien

**S2 — a canary must show what it adds, and the stable body must carry each change once.**
> Entiendo que cuando publique la versión estable en el cuerpo se añade todo lo que fui añadiendo en todas las versiones canary?
>
> Y una duda: Si lanzo otra versión canary mostrará todos los changesets de nuevo o mostrará solo los cambios entre versiones canary?

**S3 — the body states how to install, how to switch channels, and whether an uninstall is involved.**
> Y en el template añade como instalar y actualizar. Es decir si es una versión canary el @canary por si quiere probarla explicando los pasos a seguir. Explica brevemente como desinstalar la versión canary y pasar al canal estable cuando se publique una versión estable. No sé si es necesario desinstalar realmente (stable o canary) o basta con cambiar el canal en la @, es decir si estoy en @canary, quizás basta con ejecutar `pi install npm:@gtrabanco/pi-agentic-workflow@latest` y si estoy en latest y quiero probar un canary con lo mismo pero acabando en @canary.

**S4 — keep the generated change list, as other projects do.**
> Lo que suelan hacer otros proyectos.

## Impact

`scripts/release.mjs release-notes` is called by both cut jobs of
`.github/workflows/publish.yml` and its output is the GitHub Release body — the
surface a consumer reads before upgrading. It now resolves the version through
`resolveReleasePlan`, the same function `plan`/`apply` use, so a canary body
names the exact tag its cut publishes instead of staying version-agnostic. The
canary delta reads git tags (`git tag -l --merged HEAD`, `git ls-tree <tag> --
.changeset`), which the job already supports (`fetch-depth: 0`). The changeset
linter gains a warning (never a failure) about the body's first line, because
that line is now the release-note heading. `README.md` and
`docs/workflow/PACKAGES.md` state the channel switching and the rendered body.

Determinism boundary: the body is a pure function of the tree, the args and the
`--date` the workflow already pins; it reads tags and the filesystem, writes
nothing.

## Retirements

None — nothing is superseded. What the change removes is the concatenation
itself (the `bodies.join("\n\n")` block and the manual
`Canary cut — the changes below are the backlog…` echo the renderer now
replaces), not a surface with a consumer.

## Non-goals

- No change to how versions are computed, how changesets are consumed, or which
  packages a cut publishes.
- No removal of `--generate-notes`: PR-author credit stays (feature 40 AC-15 /
  PE-004), and it is what GitHub and most CI-driven projects publish.
- No hard lint failure on a non-conventional body title (a warning only, so an
  older intent file stays valid and no existing fixture is invalidated).
- No rewrite of the release body of any already-published release.

## Future

None.

## Future cost

- A new release-note section or a new bump level must be added to
  `NOTE_GROUPS`/`LEVEL_RANK` in `scripts/release.mjs` and pinned in
  `scripts/release.test.mjs` — the closed sets live there. Binds whoever extends
  the release pipeline.
- A changeset body's first line is a heading now: it must read as one. Binds
  every author of a `.changeset/*.md`.

## Applicable tests

`node --test scripts/release.test.mjs scripts/release-workflows.test.mjs
scripts/lint-changeset.test.mjs` — the renderer, the workflow wiring and the
linter warning. Six assertions are added to the first, one to the second, one to
the third; two workflow pins are re-aimed at the command that now names its
channel (same intent: the notes file is written outside the worktree, before
`apply` consumes the changesets).

## Known pre-existing issues

- `#352` / row 91 — `scripts/` is repo-only and is planned to move into the
  published crate. `does-not-affect` this unit: the renderer moves with it, and
  nothing here hardcodes a repository path.
- `#329` — sessions invoke `node` where the convention orders bun for manual
  runs. `does-not-affect`: the workflow calls `node` by the CI convention and the
  suite still runs under `node --test`.

## Tasks

- [x] P1 — pin the rendered body: per-change headings, kind grouping with breaking first, the bumps table, the install block per channel, the canary delta, the stable "no release intent" refusal (validator: `node --test scripts/release.test.mjs` exits non-zero, every new assertion failing on the concatenated output) (Implements: S1, S2, S3)
  Relevant files: scripts/release.test.mjs
- P2 — render the body: `resolveReleasePlan` shared by plan/apply/release-notes, `splitChange`, `bumpRows`, `installBlock`, `previousCanaryTag` + `changesetsAtTag` for the canary delta (validator: `node --test scripts/release.test.mjs` exits 0) (Implements: S1, S2, S3)
  Relevant files: scripts/release.mjs
- P3 — pass the channel and the pinned cut date from both cut jobs, and drop the hand-written canary preamble the renderer now emits (validator: `node --test scripts/release-workflows.test.mjs` exits 0) (Implements: S1, S2, S3)
  Relevant files: .github/workflows/publish.yml
- P4 — warn (never fail) when a changeset body does not open with a conventional commit title, and give the one in-tree offender that title (validator: `node --test scripts/lint-changeset.test.mjs` exits 0 and `node scripts/lint-changeset.mjs` prints no `warn` line) (Implements: S1)
  Relevant files: scripts/lint-changeset.mjs, .changeset/370-pi-150-compat-reverification.md
- P5 — state the rendered body and the channel switching in the docs that own them (validator: `node --test scripts/workflow-docs-index.test.mjs scripts/scaffold-parity.test.mjs` exits 0) (Implements: S1, S3, S4)
  Relevant files: README.md, docs/workflow/PACKAGES.md
- P6 — full gate sweep and the PR (validator: `node scripts/run-root-suite.mjs` exits 0) (Implements: S1, S2, S3, S4)

### Planning evidence

| id | claim | source | certainty |
|---|---|---|---|
| PE-001 | the body was a raw `join("\n\n")` of the changeset bodies — 6.4 KB, zero headings | `git show cebfa5aa:scripts/release.mjs` (`release-notes` block); `node scripts/release.mjs release-notes \| rg -c '^#'` → 0 | confirmed |
| PE-002 | canaries never consume changesets; only `apply` deletes them | `scripts/release.mjs:557` (`unlinkSync` inside the apply path) | confirmed |
| PE-003 | `pi install` replaces the recorded source of the same package; the match key ignores the tag | `dist/core/package-manager.js` (`getSourceMatchKeyForInput` → `npm:${name}`, `addSourceToMatches` rewrites the entry) | confirmed |
| PE-004 | a non-exact npm spec (`@canary`) is not pinned, so `pi update --extensions` follows the dist-tag | `dist/core/package-manager.js` (`pinned: isExactNpmVersion(version)`, `updateConfiguredSources`) | confirmed |
| PE-005 | the `@canary` dist-tag is repointed at every stable cut | `.github/workflows/publish.yml` (`npm dist-tag add "$NAME@$VERSION" canary` in all three publish jobs) | confirmed |
| PE-006 | the `stable` branch exists on the remote and is pushed by the stable cut | `git ls-remote --heads origin` → `refs/heads/stable`; `publish.yml` (`HEAD:refs/heads/stable`) | confirmed |
| PE-007 | `gh release create --notes-file` + `--generate-notes` renders the body first and appends the generated block | the shipped body of `v5.0.0-canary.20261102.1` (`gh release view`) | confirmed |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| OB-1 | S1 | a reader scans a release body by kind and per-change heading instead of reading a wall of prose | P2 | P1, P2 | scripts/release.mjs | `node --test scripts/release.test.mjs` | exit 0 | verified |
| OB-2 | S2 | a canary body shows its own new changes first and never loses the carried ones; a stable body carries every pending change exactly once | P2 | P1, P2 | scripts/release.mjs | same | exit 0 | verified |
| OB-3 | S3 | a reader can install the released channel and move between channels without guessing whether an uninstall is involved | P2 | P1, P3 | scripts/release.mjs, publish.yml | same + `release-workflows.test.mjs` | exit 0 | verified |
| OB-4 | S4 | PR-author credit survives the rewrite | P2 | P3 | publish.yml | `release-workflows.test.mjs` | `--generate-notes` still in both cut jobs, exit 0 | verified |
| OB-5 | determinism | the body is a pure function of tree + args + pinned date, and writes nothing | P2 | P2 | scripts/release.mjs | `node --test scripts/release.test.mjs` | `a prerelease cut never stamps the repo's skills` / `plan writes nothing` still green | verified |

## Findings

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-04, owner request, verbatim: the four `S#` quotes above.
- **D1** — 2026-11-04, owner decision on the generated block: keep what other projects publish — curated sections first, `## What's Changed` after (`--generate-notes` stays).
- **D2** — 2026-11-04, drafting decision: the changeset title is a warning, not a failure. Making it a hard lint error would invalidate every existing fixture in `scripts/lint-changeset.test.mjs` and force a test rewrite that proves nothing; the renderer already degrades a prose first line into a heading.
- **D3** — 2026-11-04, drafting decision: no `.changeset` intent file. `node scripts/version-parity-gate.mjs --content` reports `no-triggered-change` for all three packages — nothing under `packages/` or `skills/` changes, so an intent file would claim a release the tree does not contain.
- **E1** — 2026-11-04, `node --test scripts/release.test.mjs` · exit 1 · six new assertions red against the concatenated body (`the new change is rendered`, `AssertionError`).
- **E2** — 2026-11-04, `node --test scripts/release.test.mjs` · exit 0 · 62 tests pass after P2.
- **E3** — 2026-11-04, `node scripts/release.mjs release-notes --channel canary --date 2026-11-04` on the real tree · exit 0 · 15 `###` headings, the carried backlog collapsed under `## Also in this prerelease` (9 earlier changes), the `v5.0.0-canary.20261104.1` tag named in the install block.
- **E4** — 2026-11-04, `node --test scripts/release-workflows.test.mjs` · exit 0 · 17 tests; `node --test scripts/lint-changeset.test.mjs` · exit 0.
- **G1** — 2026-11-04, `node scripts/run-root-suite.mjs` · exit 0 · 1381 tests, 33 suites.
- **G2** — 2026-11-04, `node scripts/diff-guard.mjs --base origin/main` · exit 1 · BREACH 802 lines > 400, 12 files > 8.
  **Recorded exception, not a forced number.** An honest split was attempted and rejected: the only
  seam is code vs docs, and a docs-only PR would document a renderer that does not exist yet while
  stacking is forbidden (`AGENTS.md`). 374 of the lines are `scripts/release.mjs` — roughly a third
  is the `resolveReleasePlan` extraction the renderer needs to name the version it was cut at, which
  is a move, not new logic; deleting it back would re-introduce the duplication the extraction ends.
- **P1** — 2026-11-04, renderer + workflow + linter warning + docs, committed on `fix/375-release-notes-rendering`.

## Triaged steps

```text
TRIAGE — 375-release-notes-rendering (fix)
Steps: implement, evidence
Tiers: implement: cheap, evidence: strong
Skipped: research: scope fixed by the issue, design: shape decided in the issue, plan: trivial scope, tests: covered by the implement step's red-first suite, review: owner merges, docs: covered by P5, release: not a feature
Budget: strong
```

## Next

Run `/review-change` at the PR's HEAD.

## References

- `#375` — this fix's tracked issue.
- Feature 40 (`docs/features/40-versioned-skills-releases/`) — owns the release
  pipeline; AC-15/PE-004 is the PR-author credit this unit keeps.
- `docs/workflow/PACKAGES.md` — the release-body contract this unit writes down.
