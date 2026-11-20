# 655 — git-identity-guard · decisions

Owner-scoped decisions and the path-protection escape records for this unit. The
records are append-only (`path-protection-records@1`, grammar owned by
`skills/orchestration-envelope/references/TURN_CONTRACT.md`); the declaration
they answer lives in [`SPEC.md`](SPEC.md) `## Path protection`.

## Path-protection escape records

The frozen suite this unit appends to is a protected path (`**/*.test.*`,
`freeze: true`). The row below is an *expansion* — no pre-existing assertion is
deleted, relaxed or narrowed.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/pi-agentic-workflow/test/git-identity-guard.test.mjs | P2 | 2026-11-19 | execute-phase | the guard's frozen corpus gains the disposition cases (deny without a dialog, allow standing down interactive and headless, deny outranking a stored consent, the no-consent writes, the decideGitConfigCall parity corpus, and the two wired-path cases); every pre-existing case keeps its exact assertions, and the only edit to an existing line is none
```

## Decisions

- **D1** (2026-11-19) — `decideGitConfigCall` is **wired**, not removed (the
  issue offers both). The disposition body moves into one function
  (`dispositionFor(write, options)`) that both `decideGitConfigCall` (the pure
  projection over the first write needing consent, host-free) and
  `applyGitIdentityGuard` (the consent lifecycle) consume. Deleting the pure
  function would put the answer behind a host argument, and the parity case in
  O4 is what keeps the two from drifting again.
- **D2** (2026-11-19) — `deny` outranks a stored consent. The disposition is the
  project's configured posture; the consent store answers the `ask` question
  ("may I write this key here?"), never "may I override the project's deny".
  The alternative — a stored approval reopening a denied guard — is a security
  regression wearing a convenience argument, and no consent file predates the
  mode's first working day in a way an operator cannot re-decide.
- **D3** (2026-11-19) — `allow` applies headless too, and writes nothing. S4
  states it ("blocks in every mode except `allow`") and the store's only
  purpose is answering a question that is no longer asked; recording a consent
  under `allow` would silently pre-approve a later switch back to `ask`.
- **D4** (2026-11-19) — the `deny` refusal composes the write's own reason (the
  one `ask` shows) with a sentence naming `guard.gitIdentity.mode`, instead of
  a second reason vocabulary. One teaching text per write keeps S1's "teaching
  reason" true in both modes and keeps the repair hints identical.
- **D5** (2026-11-19) — a `.changeset/` intent file, because the change touches
  `packages/pi-agentic-workflow/src` and the schema package's published
  description; the version-parity gate's trigger set covers both and a fix row
  with no release intent would fail it.
- **D6** (2026-11-19) — no new config key, no schema shape change: `allow`,
  `deny` and `ask` already exist and already resolve (`PE-004`). The unit makes
  the shipped value act, which is what its rollback strategy (revert the one
  wiring commit) assumes.
