# Decisions — fix/740-config-json5-stem

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow-schema/test/config-jsonc.test.mjs | P2 | 2026-11-27 | execute-phase | Red-first cases for S1: the suite owns the one parser, and its JSON5 constructs (identifier keys, single quotes + ES5 escapes, hex, leading/trailing dot, +sign, Infinity/NaN) and the retained strict-EOF refusal must fail before the parser widens. No existing assertion is deleted or relaxed; the pre-existing cases stay byte-identical.
justification | packages/agentic-workflow-schema/test/config-contract.test.mjs | P2 | 2026-11-27 | execute-phase | Red-first cases for S2/S4/S5/S7 (candidate order, resolution precedence, stem descriptor contract, non-finite refusal, invalid-value sanitize) plus the two assertions the requirement changes (section `file` is the stem, a `.json`-suffixed descriptor is refused). The suite owns the contract these cases judge.
justification | packages/agentic-workflow/test/config-cli.test.mjs | P4 | 2026-11-27 | execute-phase | Red-first cases for S2/S3/S5/S7 on the CLI surface: a `.jsonc`/`.json5` file is read, precedence is silent, `set`/`init` create `<stem>.json5`, `--sanitize` drops an invalid value, and a non-finite value is refused. The suite owns the command's output and file bytes; unchanged commands keep their pre-existing cases.
justification | packages/agentic-workflow/test/config-materialize.test.mjs | P4 | 2026-11-27 | execute-phase | S3's write-side half belongs here: `config default` over a missing pair creates `<stem>.json5` and over a `.jsonc` writes that file, never a rename. The receipt's `file` field is the stem (S4), so the cases that name it are updated to the new identity.
justification | packages/agentic-workflow/test/git-identity.hook.test.mjs | P4 | 2026-11-27 | execute-phase | S2 names `gitIdentity` as a reader: a `.jsonc`/`.json5` profile must be enforced with the real path in the refusal. The suite owns the guard's behaviour.
justification | packages/agentic-workflow/test/doctor.checks.test.mjs | P4 | 2026-11-27 | execute-phase | S2 names doctor/divergence as a reader: the probe must resolve the stem over its host seam and report the real file name. The suite owns the `config-files` row.
justification | packages/pi-agentic-workflow/test/config-jsonc.test.mjs | P5 | 2026-11-27 | execute-phase | S1/S2/S6 change what this suite judges: the JSON5 constructs parse (the two cases that asserted a single-quoted string and a hex number are refused flip to acceptance, per #740 S1), a `.jsonc`/`.json5` file is read, and an unknown key or invalid value degrades instead of refusing while a parse error still refuses. The parse-refusal cases are unchanged.
justification | packages/pi-agentic-workflow/test/default-inherit.test.mjs | P5 | 2026-11-27 | execute-phase | `configFilePaths`' create name becomes `<stem>.json5` (S3/S4), so the exact-value assertion moves with the requirement; the zero-config, route and defaults cases stay unchanged.
justification | packages/pi-agentic-workflow/test/config-extension.test.mjs | P5 | 2026-11-27 | execute-phase | The published descriptor's `file` becomes the stem (S4); the byte-equality pin and the identity assertion move with it and stay exact.
justification | packages/pi-agentic-workflow/test/untrusted-project-config.test.mjs | P5 | 2026-11-27 | execute-phase | The suite builds its in-memory readers from `configFilePaths`, whose create name changes (S3); the trust boundary cases are unchanged.
justification | packages/agentic-workflow-schema/test/content-guard.test.mjs | P2 | 2026-11-27 | execute-phase | One assertion names the section's file identity (S4); it moves from the file name to the stem.
justification | packages/agentic-workflow/test/provision.permissions.test.mjs | P4 | 2026-11-27 | execute-phase | The projected policy header names the authoring surface (S4); the assertion keeps proving that and stops requiring a `.json` suffix the config no longer carries.
justification | packages/pi-agentic-workflow/test/auto-log-session-config.test.mjs | P5 | 2026-11-27 | execute-phase | ACFG-04/05/06 asserted the fail-closed refusal that S6 supersedes; the same invalid corpus now asserts the drop-and-default degradation, with a parse-refusal case left in config-jsonc.test.mjs.
justification | packages/pi-agentic-workflow/test/dispatch-refusals.test.mjs | P5 | 2026-11-27 | execute-phase | The injected reader names the file whose read fails; the create name is `<stem>.json5` (S3), so the two hardcoded paths move and every assertion stays.
justification | packages/pi-agentic-workflow/test/path-protection.test.mjs | P5 | 2026-11-27 | execute-phase | The resolver input documents are keyed by the section identity, which is now the stem (S4); the merged policy assertions are unchanged.
justification | packages/pi-agentic-workflow/test/settings-console.test.mjs | P5 | 2026-11-27 | execute-phase | The console saves to the resolved path, which is `<stem>.json5` over an absent pair (S3); one scripted answer key moves and every assertion stays.
justification | packages/pi-agentic-workflow/test/shipped-adapter.test.mjs | P5 | 2026-11-27 | execute-phase | Two contract moves: the read list names the create paths (S3) and F5's "invalid config is a problem" now needs a file that does not PARSE (S6), so the fixture's text changes while the obligation it pins is kept.
justification | packages/pi-agentic-workflow/test/engram-provision.test.mjs | P5 | 2026-11-27 | execute-phase | The refusal names the base stem (S4); the negative assertion narrows to the extension file's suffixed forms because the product prefix legitimately contains the stem.
justification | scripts/local-config-contract.test.mjs | P6 | 2026-11-27 | execute-phase | This repository's own config moves to `.jsonc` (S4), so the suite that reads it must read the resolved name and prove the resolver finds the committed file. Every existing assertion stays; the path becomes the resolved one.
```

## D1 — the issue's seven items are the requirements

The `## Problem` paragraph motivates; S1-S7 are the seven proposal items. No
eighth requirement is invented.

## D2 — the stem replaces the file-name constant

`BASE_CONFIG_FILE` is deleted in favour of `BASE_CONFIG_STEM`; the
`config-extension@1` `file` field is a stem. Both are the owner's decision in the
issue (§Proposal 4) and no compatibility shim is kept (`IR6`).

## D3 — one parser, one name

`parseJsonc` widens to JSON5 instead of adding a second parser: the crate and the
pi package import the same function, and a second spelling would be the
duplicate owner `IR11` refuses.

## D4 — degradation is silent only at the load boundary

`config validate`, `config show` and the doctor's divergence keep reporting; they
are the on-demand trail the issue names. The pi loader drops and fills defaults.

## D5 — degradation granularity

The base file degrades per section through the exported sanitizer (recursive, so
a valid sibling survives an invalid one); the pi file degrades per reported path
through its own strict validator, which stays the load's acceptance authority.
