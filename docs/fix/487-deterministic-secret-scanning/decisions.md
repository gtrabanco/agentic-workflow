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

- **D6** — the assignment boundary widens in one direction and the payload floor
  closes the other (correction batch 2026-11-14, the receipt's blocker). The
  matcher now accepts an optional quote pair and a non-alphanumeric prefix, so
  `API_TOKEN=<payload>`, `GITHUB_TOKEN=<payload>` and `DB_PASSWORD=<payload>`
  are judged like their quoted twins; the boundary *after* the key name stays
  strict (`[:=]` must follow), which is what keeps `tokenizer=` out. The false
  positive that widened prefix opened — `const FIXTURE_TOKEN = /re/` — is
  answered **at the rule, never by an allowlist entry**: a payload beginning
  with `/` is a path or a literal pattern, not a credential, and the allowlist
  keeps its single shipped entry. The reason is structural: `scripts/local-gate.test.mjs`'s fixture sandbox copies the shipped allowlist but only the
  scan's own files (its own comment says so), so an entry for any other path
  reads stale in that tree and fails the gate's clean-tree case — observed
  directly at `79264b34` (Log E17). See F1, E16–E19.

- **D7** — an in-sync candidate is never a range (correction batch 2026-11-14,
  advisory 1). `resolveRange` skips a candidate whose merge-base equals HEAD,
  continues to `origin/main`, and falls to the whole tracked tree when no
  candidate has anything to add — the empty pass a synced checkout produced
  (`0 added line(s) scanned · verdict: PASS`) is gone, while the push path is
  untouched because the remote-tracking ref is stale while a push runs. For the
  same reason — no silent pass over explicit input — `--all` and `--base` are
  mutually exclusive and refuse with exit 2 (advisory 2). See F2, F3, E19, E21.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/secret-scan.test.mjs | P2 | 2026-11-14 | execute-phase | the new gate step's own corpus: it lands as the red commit before the module exists (S4, S9) and carries one positive case per rule plus the benign, redaction, range, allowlist and exit-code cases (S1, S3, S10)
justification | scripts/local-gate.test.mjs | P4 | 2026-11-14 | execute-phase | the shipped step's three pins: the id list grows by one, the impact-gated planned list names it, and the gate-level refusal case proves a secret in the range fails through the gate (S6, S7, S8). No pre-existing assertion is deleted, relaxed or narrowed
justification | scripts/release-workflows.test.mjs | P4 | 2026-11-14 | execute-phase | the local gate's id array grows by the one shipped id, its former-remote-check coverage contract unchanged (S6, S12)
justification | scripts/secret-scan.test.mjs | P9 | 2026-11-14 | execute-phase | the external-verify correction batch (external-verify.md, NEEDS-DECISION (1)): the suite gains the receipt's frozen-failure corpus — the unquoted/identifier-tail credential assignment (blocker), the in-sync-upstream fall-through, the `--all --base` refusal and the unreadable-not-binary disclosure. Each case lands red-first and is observed failing before the fix; no existing assertion is relaxed, deleted or narrowed
approval | scripts/secret-scan.test.mjs | P9 | 2026-11-14 | human-owner | owner instruction 2026-11-14 (external-verify correction round), verbatim: "Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff" — the recorded owner order for this post-freeze edit of the protected suite
```
