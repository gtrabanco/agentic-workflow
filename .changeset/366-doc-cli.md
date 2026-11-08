---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": patch
---

feat(366): doc CLI — deterministic section-level read/edit/index (half A of #192)

The positional branch of the one `agentic-workflow doc` entry point ships: `doc
read --file <path|-> [--section <id|title>]` (section-level read over the #407
locator, D5 ids and exact titles), `doc edit --file <path> --section <id|title>
--replacement <path|-> [--dry-run]` (section-splice, in place, byte-lossless
outside the replaced range, refusals before any write), and `doc index
[--out <path>] [--json]` (the derived JSON structure document: stable section
IDs through the shared D5 function, parsed frontmatter, skill triggers,
unit-doc phase mapping, dependencies — TypeBox-validated, byte-identical over
two runs). Experimental until promotion is earned; retrieval stays feature
65's and is untouched.

The schema package carries one performance repair: the `F99` refusal capture
charges a key's canonical units without a per-key `JSON.stringify` and writes
captured keys by assignment except `__proto__` (which keeps `defineProperty`).
Identical bytes and identical diagnostics — the same refusals, at roughly half
the work, so the published `200 000 commands in ≤ 50 ms` bar keeps its margin on
a loaded machine. Issue #366's external verification, finding A1.
