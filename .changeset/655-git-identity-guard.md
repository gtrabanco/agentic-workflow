---
"@gtrabanco/pi-agentic-workflow": patch
"@gtrabanco/agentic-workflow-schema": patch
---

fix(655): honour `guard.gitIdentity.mode` on the wired identity guard

The agent-side git identity guard resolved its disposition (issue #626: `allow`,
`deny`, `ask`) and then never read it on the only path that runs, so a project
configured `deny` still saw the approval dialog — and let the write through when
it was approved — while `allow` still asked. `deny` also hung the call for the
host's dialog timeout, which has no reason to exist when nothing is being asked.

One function now decides per write (`dispositionFor`), and both readers consume
it: `decideGitConfigCall` stays the host-free projection it was (byte-identical
output), and `applyGitIdentityGuard` gains the mode. `deny` refuses with the
write's own teaching reason plus the disposition that refused it, `allow` stands
the guard down, and `ask` keeps its consent lifecycle untouched — a remembered
approval, one prompt per scope+key, and a headless session that blocks because
an unanswered prompt is not consent. A headless session is refused in every mode
except `allow`, and a stored approval never reopens a `deny`: the store answers
the `ask` question, not the project's posture.

The published `gitIdentity` config description names the headless rule as it now
behaves.
