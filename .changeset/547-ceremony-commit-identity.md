---
"@gtrabanco/agentic-workflow": patch
---

test(ceremony): give the spawned ceremony a git identity (#547)

Test-only fix: `ceremony commit create` spawns its own `git commit`, which
inherits the ambient environment — CI runners carry no git identity, so the
suite failed with `Author identity unknown` instead of the behavior under test.
The fixture now injects an identity (and `commit.gpgsign=false`) through the
`GIT_CONFIG_COUNT` channel, mirroring the root suite's neutralization.
