# Decisions — fix/487-deterministic-secret-scanning

- **D1** — the scan resolves its own push range. `scripts/local-gate.mjs` drops a
  `pushBase: true` step whenever the gate receives no base, and the hook's base is
  empty exactly when several refs are pushed or the range is unresolvable; a CI
  checkout is shallow. A guard that vanishes in those cases would be the
  discipline-only barrier this unit exists to remove, so the step declares no
  `pushBase` marker and the script resolves the range itself
  (`--base`, then the upstream merge-base, then `origin/main`'s, then the whole
  tracked tree). See PE-002, PE-003, PE-004.

- **D2** — the allowlist is a file of narrow entries, not an inline comment
  marker. An inline marker would have to be a second grammar inside every scanned
  file, and the issue's "without an explicit allowlist entry" asks for the
  explicit artifact. Each entry names one path, one rule (or `*` with a reason)
  and why; an entry that matches nothing in whole-tree mode is itself a finding,
  so the allowlist cannot rot into a blanket silence. The file's shape follows
  the repository's existing `scripts/test-timeout-allowlist.json` precedent
  (path + reason + evidence). See O5.

- **D3** — one binary bound, declared. A text pass cannot judge a compressed or
  compiled container, so a file is skipped when its extension is in the closed
  binary list or its bytes carry a NUL. There is no size ceiling: the largest
  tracked text file here is the journal at 1,599,899 bytes, and a ceiling would
  be a silent blind spot rather than a declared one. The bound is a Non-goal in
  the SPEC and a pinned case in the suite. See PE-007.

- **D4** — the suite's own known-secret fixture is literal and allowlisted by
  rule, with the negative proven in the same file: the same content is a finding
  under an empty allowlist and allowlisted under the shipped one. A fixture built
  by concatenation would prove the detector but never prove the allowlist, which
  is the half S10 names. See O5, O6.

- **D5** — the step id is `secret-scan` and its table slot is inside the offline
  push-range block, after `push-identity`. S6 fixes the id; the slot is chosen so
  the reading order of the offline block stays the flow's order (carrier lint,
  journal immutability, push identity, secret scan, temp hygiene, worktree). See
  O7.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/secret-scan.test.mjs | P2 | 2026-11-15 | execute-phase | the new gate step's own corpus: it lands as the red commit before the module exists (S4, S9) and carries one positive case per rule plus the benign, redaction, range, allowlist and exit-code cases (S1, S3, S10)
justification | scripts/local-gate.test.mjs | P4 | 2026-11-15 | execute-phase | the shipped step's three pins: the id list grows by one, the impact-gated planned list names it, and the gate-level refusal case proves a secret in the range fails through the gate (S6, S7, S8). No pre-existing assertion is deleted, relaxed or narrowed
justification | scripts/release-workflows.test.mjs | P4 | 2026-11-15 | execute-phase | the local gate's id array grows by the one shipped id, its former-remote-check coverage contract unchanged (S6, S12)
```
