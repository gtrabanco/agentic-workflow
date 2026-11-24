# Permission layer — the operator's pi package and the project's own guards

> Owner of the enforcement contract: `@gotgenes/pi-permission-system` (its
> README and `docs/configuration.md`). Owner of the authoring section and the
> projection: `@gtrabanco/pi-agentic-workflow`'s README. This page is the
> init-workspace checklist: what to offer, what to write, and what to verify — it
> restates no policy engine.

## Consent

The permission package is an **operator-level pi package**, and this skill never
installs anything on its own. Offer it once, as one question:

> Install the permission layer (`@gotgenes/pi-permission-system`) as the pi-side
> guard for bash, paths, file tools, MCP and skills?

Three answers, three outcomes:

- **yes** → run the package's own installer: `pi install npm:@gotgenes/pi-permission-system`.
  Then offer the project's policy file (below), also one question, also a no
  writes nothing.
- **no** → **a no writes nothing**: no package, no policy file, no config key, no
  workflow edit. Record it as a residual, with the consequence stated plainly —
  bash and file access run ungated by this package, and the first-party shell
  guard that used to sit in the extension is retired, so nothing silently stands
  in for it.
- **not now** → same as no, recorded as a residual the next session may re-open.

An existing scaffold that already carries a policy file is never offered the
write again: the file is the operator's, and `provision permissions` refuses to
overwrite it.

## What the package decides

Say this in one paragraph, not as a feature list; the operator needs to know what
a prompt means, not the architecture:

- an unparseable or indirected command (`bash -c`, `eval`, `sudo`, `env`,
  `xargs`) **asks** rather than passing silently — fail closed;
- every surface answers `allow` / `ask` / `deny`, and an omitted rule asks;
- within one surface map the **last matching rule wins**, so broad catch-alls come
  first and specific overrides after;
- `path` is cross-cutting over every tool and matches the canonical form, so a
  symlink alias or a case variant does not evade it;
- `external_directory` is the outside-the-working-tree boundary and takes a
  pattern map — the right place to allow a cache directory, not `path`;
- a prompt offers **approve once** and **approve for this session** (the grant is
  ephemeral, per session, never durable);
- `promptTimeoutMs` denies an unanswered prompt **and tells the agent** nobody
  answered; unset means it waits indefinitely.

## The project's policy file

Offer to create `<root>/.pi/extensions/pi-permission-system/config.json` through
the command, never by hand:

```bash
runner provision permissions --write
```

The command renders the documented baseline (bash asks, `rm -rf *` denies,
outside-the-tree asks with `/tmp/*` and `~/.cache/*` allowed as scratch) plus the
guards the project declared, in last-match-wins order, and creates the file **only
when it does not exist**. An existing file is refused with the block printed for a
hand merge: two writers on one policy file is how a policy becomes unknown. The
command also refuses — exit 2, nothing written — when it cannot honestly project
your declarations: an authoring file whose `guardPlugins` the config system
cannot resolve (the owning package is not discoverable) or that fails validation
prints the refusal instead of a baseline that would silently omit your rules.

Without `--write` the same command prints the block and touches nothing — use that
form when the operator wants to see the policy before it exists. `--scope global`
targets `~/.pi/agent/extensions/pi-permission-system/config.json` instead.

## The project's own guards

A project that needs more than the baseline declares it in
`.pi/pi-agentic-workflow.json` (`guardPlugins`), which is the **one authoring
surface** for rules this workflow renders. Then re-run the command above; the
declaration is what changes, never the generated file.

```jsonc
{
  "guardPlugins": {
    "guards": {
      "no-dotenv": {
        "kind": "deterministic",
        "surface": "path",
        "rules": [{ "match": "**/.env", "verdict": "deny", "reason": "secrets never enter the agent's reach" }]
      }
    }
  }
}
```

- `kind: "deterministic"` is evaluated locally: no model, no network.
- `kind: "model-backed"` is accepted and enforced only once an adapter for that
  kind exists; until then it registers nothing and the extension says so once per
  session. Offer it only to a project that already knows it has that adapter.
- An unknown key, an unknown kind or surface, a malformed guard name and a
  malformed verdict are refused by path — never coerced into a default. Render the
  refusal to the operator instead of "fixing" the file.

The declaration shape and the merge rules are
[`docs/workflow/CONFIG.md`](../../../docs/workflow/CONFIG.md) § Guard plugins; this
page never restates them.

## Verify it on the machine (the operator checklist)

The enforcement lives in a package this repository does not ship, so the checks
that matter need a live session where it is installed. Print them; do not claim
them:

1. **The dialog renders and resolves** — an `ask` policy produces a prompt over
   `extension_ui_request`/`extension_ui_response` in the host (pi-web included),
   and the answer settles the call. A dialog that appears and leaves the call
   running is the defect the retired guard shipped; check the call's outcome, not
   the dialog's appearance.
2. **A decline blocks** — answer `n` and confirm the tool call is refused with the
   layer's reason, not merely logged.
3. **Session grants stick, and only for the session** — approve for the session
   once, repeat the call, and confirm no second prompt; a new session prompts
   again.
4. **`promptTimeoutMs` denies and informs** — set it to a small value in an
   unattended run and confirm the call is denied with a message naming the
   timeout, never a hang.
5. **No double prompt** — with this workflow installed, a bash `ask` must prompt
   once: the first-party shell guard is retired, and a second prompt is evidence
   it came back.

## What this layer does not do

- It decides; it does not isolate. A sandbox is another package's job, and an
  allowed tool can still do whatever its args say.
- It does not replace the agent-side `git config` guard, the inline-receipt guard
  or Tier 2 path protection: those are the extension's own rules, and they run
  beside it.
- It is not a secret scanner. There is no built-in denylist; a project that wants
  `.env` refused declares it.
