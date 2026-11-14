---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(config): give the identity guard a push scope and a signing policy (issue #546)

The workflow's guards assumed one identity, one remote and one forge, so a
third-party fork, a second machine with its own signing key, a corporate
`includeIf` layout or a GitLab/Gitea host had no legal path through them.

`gitIdentity.enforce` gains the `push-upstream` scope (judge only a push to the
branch's tracked upstream remote) beside `push` (any remote), and the
`commit-and-push-upstream` combination. `gitIdentity.approved` gains
`signing` (`required` / `allowed` / `off`, the sign-off workflow) and
`signingKeys` (the per-machine key form), so signing a commit stays a decision a
project declares instead of one machine's accident.

The scaffold's hooks follow: the push-range check takes the pushed remote, the
turn-contract verifier and the merge wrapper resolve the forge from the remote
(`gh`, `glab`, `gt`; Bitbucket refused with the message naming its absent CLI),
the command guard covers the forge merge surface with a per-project allowlist,
one portable temp resolution replaces every `/tmp` fallback, and a host with
neither bun nor node now fails the push instead of letting it through
unverified. A new `rigidity-review` gate step audits the guards for the
hardcoded dependency coming back.
