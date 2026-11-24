# Editing — typed, schema-checked writes

Every write in this crate goes through a service that validates before it moves
a byte. The point is not ceremony: a write that refuses is cheaper than a write
that lands wrong and is discovered three phases later.

**Flag spelling is not here.** It is `runner help <subcommand>`.

## The read → compare → write loop (the CAS pattern)

A shared document (the roadmap, the budgets manifest, the unit's own catalogue)
is read, modified and written back **with the revision that was read**. Two
sessions writing the same table concurrently is the failure this prevents.

```text
1. <read the document, capturing its revision>
2. decide the change from the bytes just read — never from memory
3. write, carrying the captured revision as the expectation
4. a stale-read refusal means: go back to 1. It is not an error to retry.
```

The CAS shape is the same wherever it appears — the roadmap writer takes the
revision as `--expect`, the shared-document writers take it as a field. The
subcommand's own `help` names the spelling; the *pattern* is what transfers.

**The rule that matters:** a `stale-read` refusal is information, not failure.
Re-read and retry. Never retry blindly against the same expectation — that is a
write that cannot land.

## Which writer owns which document

| The document | The writer | Note |
|---|---|---|
| a unit document (SPEC, decisions, log) | `unit-doc` | sections are typed; an unknown section is refused |
| the roadmap's two tables | `roadmap` | never hand-edit a row — the row writer owns the cells |
| one section of any Markdown file | `section`, `doc edit` | section bounds come from the AST, not from a regex |
| the plugin manifest's skill array | `manifest` | alphabetical by contract |
| the budgets manifest's ceilings | `budgets` | a shrinkage without a growth source is refused |

## The refusal that is not a bug

A writer refuses **before** it writes, by design. Three shapes you will meet:

- **`EDIT REFUSAL — stale-read`** — the document moved since you read it. Re-read.
- **`EDIT REFUSAL — unknown-section`** — you asked for a section the document
  shape does not carry. The refusal lists the legal ones; `help` explains the
  shape.
- **`VERIFY REFUSAL`** — the *document* is malformed, not the write. Read the
  named violations; each one is a section or a row you must fix first.

Do not work around a refusal by writing the file directly. The refusal exists
because a direct write re-opens the drift the service was built to close.
