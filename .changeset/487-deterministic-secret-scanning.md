---
"@gtrabanco/agentic-workflow": minor
---

feat(gate): a deterministic push-range secret scan (issue #487)

The only barrier against a committed credential was one line of the
`review-security` checklist — model-conducted, inside a review pass that can be
skipped, and paying for a grep the platform can run for free on every push.

`scripts/secret-scan.mjs` reads the added lines of a push range and reports
private-key blocks, provider token prefixes (GitHub, GitLab, OpenAI, AWS,
Google, Slack, npm, SendGrid, JWTs), `<key>: "<payload>"` assignments whose
payload clears an entropy and placeholder floor, and credentials inside a
connection string. Every tracked text path is in scope — a token pasted into a
fixture, a test, a log line or a documentation example is exactly the leak path
the issue names.

The scan fails closed: a finding exits 1, an unreadable tree, an unresolvable
base or a malformed allowlist exits 2, and a match is never echoed — the report
carries a four-character prefix and the payload's length, so a finding in a CI
log does not republish the secret it caught. A benign shape is answered through
`scripts/secret-scan-allowlist.json`: one path, one rule, one recorded reason
per entry, and an entry that matches nothing is itself a finding, so the
allowlist cannot rot into silence.

The `secret-scan` step joins the local gate's offline subset, so the `pre-push`
hook and CI run it. It declares no `tests` marker (a prose-only push is the leak
path, so an empty test-impact verdict must never skip it) and no `pushBase`
dependency (the hook can prove no base and a shallow CI clone has none) — the
script resolves its own range and falls back to the whole tracked tree rather
than to a skip. `docs/workflow/GATE_INVENTORY.md` carries the row.
