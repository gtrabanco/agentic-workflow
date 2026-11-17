# Decisions — feat/470-content-guard-layer

Append-only path-protection records for this unit (grammar
`path-protection-records@1`, owner: `skills/orchestration-envelope/references/TURN_CONTRACT.md`).
The unit declares no `path-protection-plan@1` block, so no phase freeze is armed;
correction-batch decisions live in the unit doc's `## Log`.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/content-guard-discipline.test.mjs | P5 | 2026-11-17 | execute-phase | External-verify advisory 2 (2026-11-17): the release.mjs exemption's `why` cited a planned-guard-consumer record in the unit SPEC that does not exist (issue #470 and the SPEC never mention release.mjs); the clause is removed so the rationale states only its true substance — the rendered CHANGELOG title is human-read content, never an instruction the model follows. The exemption entry, its file, and every R1-R4 assertion are untouched; only the false citation inside the non-asserted reason string changes.
```
