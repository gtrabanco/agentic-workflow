# The universal CLI

The workflow ships two things: `skills/`, and `@gtrabanco/agentic-workflow` —
one package, one bin, one command per deterministic job. The documentation
scaffold (`template/`) ships **no `scripts/` tree**, and that is the point:

> "template no tiene carpeta scripts porque no lo necesita, para eso es el
> universal cli." — owner, 2026-11-14 (issue #553)

So an executable step a skill names must be a **command the target project can
reach**, never a path in the workflow's own repository. This page is the
procedure; the invocation itself is
[`skills/runner-contract/references/RUNNER.md`](../../skills/runner-contract/references/RUNNER.md)'s,
and the command list is the crate's
[`README.md`](../../packages/agentic-workflow/README.md).

## How a skill cites a command

One form, and it spells no launcher, no version and no path:

```text
runner <subcommand> [args...]
```

`runner` means "the first candidate in RUNNER.md's closed set that is eligible,
at the pin RUNNER.md carries". The words live there, the choice lives in code
(`src/runner/resolve.mjs`), and neither is restated in a skill — a skill that
hard-codes `bunx @gtrabanco/agentic-workflow@4.10.0` re-opens the per-release
maintenance the contract exists to remove.

The rule is enforced, not remembered: `scripts/cli-coverage.test.mjs` scans
every skill, refuses a `bun scripts/…`/`node scripts/…` citation, a launcher
spelling and a restated pin, and exempts only a skill that declares
`metadata.internal: true` in its frontmatter (this repository's own maintenance
skills — one at the time of writing).

## The router

`packages/agentic-workflow/bin/agentic-workflow.mjs` is a closed `switch` over
the first argument. A subcommand is exactly one case:

```js
case "phase-lint": {
  const { main } = await import("../src/runner/phase-lint.mjs");
  process.exit(main(restArgs));
  break;
}
```

- The module owns its arguments, its fixed block and its exit codes; the router
  only dispatches. A command that needs the project's location takes it as an
  input (`--root`, or `process.cwd()`), never from its own `import.meta.url`.
- `process.exit(code)` carries the contract: `0` success, `1` the command's own
  failure, `2` a refusal before anything was written. The refusal line names the
  service (`<SERVICE> REFUSAL — <reason>`) and every progress line goes to
  stderr (owner: [`FEEDBACK.md`](FEEDBACK.md)).
- Read-only commands say so in their doc comment and write nothing; a command
  that writes names the single byte it may write.

Nothing registers itself: the switch **is** the registry today, and #603
replaces it with a generated one plus parity pins across the router, the usage
string and the README.

## Adding a subcommand

1. `packages/agentic-workflow/src/<command>/index.mjs` — the implementation,
   exporting `main(argv, options)` and returning (or exiting with) a code.
2. `packages/agentic-workflow/test/<command>.test.mjs` — the suite **lands
   first**, observed red on the missing module, then green (the repository's
   red-first rule, `IR4`, enforced by `scripts/red-first.mjs`).
3. The router case above, and the command's name in the bin's usage line.
4. One row in the crate README's `## Commands` table. Not `tool-inventory@1` —
   that block is the **tool** list (node, bun, rg, git, gh …), and a subcommand
   is not a tool you install.
5. One row in RUNNER.md's `## Subcommands` table: the name a skill cites and one
   line of what it runs.
6. If the command replaces a repository script, a row in
   [`MIGRATION.md`](MIGRATION.md) naming the old path and the new command.

`scripts/cli-coverage.test.mjs` refuses a migrated command that reaches fewer
than all three of the router, the README and RUNNER.md, so step 3, 4 and 5 are
checked rather than trusted.

## Migrating a repository script

The pattern this repository uses, and the reason it works: **the logic moves,
the script stays as a shim**. `scripts/relay-packet.mjs` is the reference
implementation of it — it owns argv, usage and the two manifest paths, while
`src/relay/Packet.mjs` owns the grammar, and both entry points print the
identical block. Unit 554 applied the same shape to the template hooks.

1. Move the implementation to `src/<command>/index.mjs`, rewriting its crate
   imports (`../packages/agentic-workflow/src/x` → `../x`). The workspace root it
   used to derive from `import.meta.url` becomes an input: `process.cwd()`, an
   explicit `--root`, or the caller's value.
2. Export every binding the old file exported — the sibling suite may import
   them — and guard the "run as a program" tail so importing the module never
   runs it.
3. Replace `scripts/<name>.mjs` with the shim: a first-line marker
   `// cli-command: <command>`, the module import, `export *` from it, the
   workspace root it has always computed, and a forward of the exit code.
4. Re-point the skills that cite the script to `runner <command>`, and re-run
   the script's own suite — **unmodified**. It is the parity net: a suite that
   has to change to keep passing is a behaviour change, and a behaviour change is
   a different unit.

The shim exists for this repository's gate and suites, not for an older
consumer: the crate is the published surface, the script is the caller's adapter
and stays out of the package's `files`.

## Why the carrier arrives with the command

A migrated command that nobody runs is a hole relocated. `check-skill-context`
proved it: the script existed, every gate was green, and the live tree was red
(issue #553's comment, 2026-11-15). So a command that replaces a repository check
adds its caller in the same change — a `local-gate` step (`scripts/local-gate.mjs`
`STEPS`, re-pinned by `scripts/release-workflows.test.mjs`) or a live full-sweep
assertion in its own suite.
