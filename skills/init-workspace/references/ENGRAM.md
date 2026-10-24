## Why this step exists

The workflow's units save what they learned into Engram, the cross-session
memory layer its memory protocol documents. On a host whose agent has no `pi`
package to provision it (the pi package registers the server itself, feature
66 P4), the target project has no memory layer at all unless this step offers
one — so Engram provisioning is a **parity obligation**, not an optional extra:
feature 66's approval is that the pi path registers it and every other host is
offered the same thing ask-first.

## What this file owns

The **non-pi** half of Engram provisioning. It owns exactly four moves —
detect, ask, provision-or-instruct, report — and nothing else. The workflow-side
protocol (when units save, the recall order, the degraded path) is **not** here;
it lives in `unit-lane`'s memory reference, which the skills that run units
already load.

## 1. Detect

Look for the `engram` binary on `PATH` (`command -v engram`) and read its
version (`engram --version`). Two outcomes matter:

- **Present** — record the resolved path and the version fingerprint.
- **Absent** — record it as a residual, and go to step 2 with the install
  guidance below rather than silently skipping the step.

Never write an MCP registration file for a binary that does not resolve: a
registered-but-unstartable server fails every session after it, which is a worse
default than an honest gap.

## 2. Ask, then do exactly what was agreed

This is a **consent-gated install** like every other in this skill. Ask one
question — "register Engram as the project's memory layer?" — and act on the
answer:

| Answer | What you do |
|---|---|
| yes | write the MCP registration named in step 3 and report it verbatim |
| no | write nothing, record it as a residual, finish the run normally |
| not installed | offer the install route below, and provision **only** if the user then says yes |

**The install route is `pi install npm:gentle-engram@latest`.** The CLI's own
setup subcommand is **not** the documented route and must never be printed as an
instruction: it pins whatever version ran it and keeps serving that version
until it is re-run, so an updated binary can sit unused behind a stale
registration (decision D3, 2026-10-21).

## 3. What "register" means on a non-pi host

There is no `pi.registerMcpServer` here, so the registration is a **declared
file** the host agent reads. Write the server into that host's own MCP config
(the agent's documented MCP surface), never into a file the host does not read:

```json
{
  "mcpServers": {
    "engram": { "command": "<absolute path to engram>", "args": ["mcp", "--tools=agent"] }
  }
}
```

**Rules:**

- **Absolute path, never a bare name** — the host's `PATH` at load time is not
  the shell's.
- **Args are exactly** `mcp` `--tools=agent`. A different argv changes which
  tools the server exposes.
- **Never overwrite a server the user already declared** under the name
  `engram` — a declared server wins over anything this step would add. Report
  that you found it and left it alone.
- **Additive and idempotent** — a second run with the same content writes
  nothing and says so.

## 4. Report exactly what was written

Every outcome ends in a report the user can read back:

- **Registered** — the file path, the server name, and the exact `command` +
  `args` written.
- **Declined** — that nothing was written, and that the run continued.
- **Binary missing** — that nothing was written, the install route verbatim, and
  that it is recorded as a residual.
- **Already declared** — the file that already carries it, and that it was left
  untouched.

"Report exactly what was written" is the same contract the Serena step follows;
a provisioning step the user cannot read back is one they cannot trust.

## Checklist (pass only if)

- [ ] `engram` presence **and** version were detected (or absence recorded)
- [ ] Consent was asked before any file was written — never assumed
- [ ] The written server uses the absolute binary path and the exact argv
- [ ] An existing `engram` declaration was left untouched and reported
- [ ] A second run is a no-op
- [ ] The closing report states what was written — or that nothing was

## Forbidden

- Never print the CLI's own setup subcommand as the install route
- Never write an MCP config for an unresolved binary
- Never overwrite an operator's existing `engram` declaration
- Never let a memory gap fail the run — record it as a residual and continue
- Never restate the unit-boundary save/recall protocol here; that is the lane's
  memory reference
