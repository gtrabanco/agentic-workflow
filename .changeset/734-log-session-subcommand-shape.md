---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/pi-agentic-workflow": patch
---

fix(pi-agentic-workflow): use contract-conforming subcommand shape in log-session hand-off

The extension's /log-session directive rendered "subcommand": "journal write"
and "subcommand": "session-close close" as single spaced strings, but the
runner door forwards subcommand as one argv token, so the crate received a
literal service name with a space and refused.

Fixed: the emitter now renders the service and operation separately —
"subcommand": "journal" with "args": ["write", ...] and
"subcommand": "session-close" with "args": ["close"].

- Resolves: #734
