---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": patch
---

feat(701): the scaffold contract that travels

A new runner subcommand, `scaffold-contract`, with two read-only operations. `check`
compares a project's exported unit-doc templates (`docs/features/_TEMPLATE/SPEC.md`,
`docs/fix/_TEMPLATE/SPEC.md`) against the section contract the installed release
publishes — the vendor-side comparator of `scaffold-parity` previously ran only inside
the vendor repo over its own export, so nothing re-checked a consumer's templates after
drift, an upgrade, or a local edit. `authoring` runs the same comparison on a staged
unit doc at emission, so a missing, duplicated, out-of-order or wrong-level section, and
an `ac-hash` its section cannot re-derive, are reported where the document is written
rather than by a review cycle later.

Both operations read the contract from its owner (`UNIT_DOC_SECTION_SHAPES`,
`resolveUnitDocShape`, `selectSpecProduct` in `@gtrabanco/agentic-workflow-schema`) and
the acceptance section's bytes from `sectionText`, so there is no second copy to drift.

The `pi` companion changes because `init-workspace`'s upgrade path now runs the check
before and after its additive writes and names `authoring` as the relay's emission check;
its Starlight projection follows in the same release.

The exported scaffold gains the worktree namespace law with its measured consequence and
the `ADMIN_NAMESPACE` audit, the gate/hook bypass enumeration, and the gate integrity
floor (no truncation masking, runtime/environment parity with CI declared rather than
assumed).
