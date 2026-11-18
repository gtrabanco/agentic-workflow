---
"@gtrabanco/agentic-workflow-schema": major
"@gtrabanco/agentic-workflow": major
"@gtrabanco/pi-agentic-workflow": major
---

config(guards)!: one `guard` section with allow/deny/ask dispositions and a global default

Issue #626 asked for guard modes a human can read and one place to turn them off.
The base config gains `guard`: a `default` disposition plus one `mode` per guard
(`gitIdentity`, `toolChoice`, `receipt`), each `allow`, `deny` or `ask`, shipped
as `ask` so an unconfigured project behaves exactly as before. `gitIdentity.agentGuard.mode`
retires — its `block` spelling becomes `deny`, `allow` is new, and the guard's
disposition is now `guard.gitIdentity.mode` — and the never-wired `guards`
section (`merge`, `history`, `ci`, `cost.maxTokens`) retires with it: no runtime
read any of those keys, and a `guards` section beside a `guard` section is the
confusion the issue reports. `pathProtection` and `contentGuard` stay always on
and say so in the new guard reference table, because a global `allow` reaching
either would be a security regression rather than a UX fix. `docs/workflow/CONFIG.md`
gains that table, the complete example file and the migration mapping; the
package's config CLI reports camelCase paths the way it accepts them, and a
`config-extension@1` section key may be camelCase or kebab-case instead of kebab
alone.
