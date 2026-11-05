# 407 — section-locator-core · planning evidence

One row per Engineering claim this change rests on. `authority-kind` is the closed
cell the unit-lane plan step writes (`known | assumption | unknown | spec`);
`freshness` is `current | stale | not-applicable`; every row was sampled at the
cut head (`caee2502`). Column order and vocabularies are owned by
`skills/pre-execution-review/references/LEDGERS.md` §1.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | `mdast-util-from-markdown` v2 attaches `position.start.offset`/`position.end.offset` (and lines) to every node, so section bounds come from the AST instead of a text scan | throwaway probe in `mktemp -d /tmp/sl407-*`: `bun add mdast-util-from-markdown@2.1.0`, `fromMarkdown` printed offsets for each node | current | O1, O2, P1 |
| PE-002 | known | a fenced block's `## `-looking lines are one `code` node with no heading node, so an AST locator cannot match them; a `> ## x` heading is a blockquote child, never a root section | same probe: fenced block parsed as a single `code` node; the quoted heading sits under `blockquote` | current | O2, P1 |
| PE-003 | known | `position.offset` values are UTF-16 code-unit indices, so `String.prototype.slice` is the lossless splice and a UTF-8 byte offset must be derived | same probe: a fixture with `🚀`/日本語/Café measured 199 code units and 208 UTF-8 bytes | current | O7, P1 |
| PE-004 | known | frontmatter `---` plus `key: value` parses as a **setext** heading (depth 2), so ATX-only section detection is required or the frontmatter becomes a phantom section | same probe: `---\ntype: fix\nscope: xs\n---` → `heading depth 2 [4,27]` | current | O2, P1 |
| PE-005 | known | a fence-blind `indexOf` heading scan corrupts a section body today: `setSection` splices at a fenced `## ` line | probe on `src/edit/UnitDoc.mjs` + `src/edit/schema.mjs` copied to `/tmp`: a doc whose Evidence body carries a fenced `## Non-goals` was spliced there, leaving a dangling fence and a promoted heading | current | O2, §Known pre-existing issues |
| PE-006 | known | the runner crate ships exactly one dependency today and the schema package ships none | `packages/agentic-workflow/package.json:29-31` (`typebox`); `packages/agentic-workflow-schema/package.json` has no `dependencies` key | current | O8, P2 |
| PE-007 | known | the root `bun.lock` is the sole lockfile and records each pin's exact resolution; a lockfile inside a package is drift | `docs/workflow/PACKAGES.md` §Packages; `scripts/workspace-lock-policy.test.mjs` | current | O9, P2 |
| PE-008 | known | the CLI router prints its `usage:` line from one hardcoded string and dispatches on the first argv token | `packages/agentic-workflow/bin/agentic-workflow.mjs` (`usage: agentic-workflow <unit-doc, …>`, the `switch (command)` router) | current | O11, P3 |
| PE-009 | known | the crate has no `exports` map: its library surface is the shipped `src/` path (deep import), and a `.d.mts` projection beside a module is the repo's typing pattern | `packages/agentic-workflow/package.json` (`files: [bin, src, README.md]`); `packages/agentic-workflow/src/log/render.d.mts` | current | O10, P2 |
| PE-010 | known | issue #407's `Dependencies` says `None` and its in-scope list consumes no #406 artifact, while roadmap row 106 declares `depends on 105` (a sequencing cell); #406 is open with no unit folder | `docs/ROADMAP.md:125-126`; `gh issue view 406 --json state` → `OPEN`; `rg --files docs/features` → no `105-` folder; `docs/LOGS.md` 2026-11-05 next-step names #407 next | current | S12, §Depends on, §Known pre-existing issues |
| PE-011 | known | both crate suites discover `test/*.test.mjs`; the gate runs the bun and node legs as separate steps | `packages/agentic-workflow/package.json` (`bun test test/`, `node --test`); `scripts/local-gate.mjs` STEPS `crate-suite-bun`/`crate-suite-node` | current | O16, P1, P3 |
| PE-012 | known | `mdast-util-from-markdown@2.1.0` is pure-JS ESM with no native build step, so the crate's "no native deps, no build step" claim survives the addition | the same `/tmp` probe resolve: 35 transitive packages, no postinstall/native artifact; imported and ran on node 26 and bun 1.4.4 | current | O8, P2 |
| PE-013 | known | `bun.lock` is JSON-with-trailing-commas that `JSON.parse` refuses, so a pin assertion reads it as text | `head bun.lock` (lockfileVersion 2, trailing commas); `rg -n '"typebox": "1\.4\.3"' bun.lock` → 2 hits | current | O9, P2 |
