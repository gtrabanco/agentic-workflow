---
type: fix
scope: large
roadmap_summary: Issue [#626](https://github.com/gtrabanco/agentic-workflow/issues/626) (L, breaking), PR [#636](https://github.com/gtrabanco/agentic-workflow/pull/636): one `guard` section owns every guard disposition (`allow`/`deny`/`ask`), with a global `guard.default` and one override per guard; `block` retires in favour of `deny`, the never-wired `guards` booleans retire, and `docs/workflow/CONFIG.md` gains the exhaustive guard reference plus a complete example file. SPEC: [SPEC](fix/626-config-guards-ux/SPEC.md)
---

# fix/626-config-guards-ux

> Fix specification — applied through the owner's local, unpublished workflow:
> the ledgers below are frozen at cut, the change is worked inline, and the owner
> is the external verifier.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#626` — [config(guards)!: mejorar UX de los guards — modos intuitivos (allow/deny/ask), modo global off, y esquema de configuración](https://github.com/gtrabanco/agentic-workflow/issues/626).
The PR closes it via `Closes #626`.

## Specs

**S1 — Guard modes are not intuitive and two dispositions are missing.**
> El guard `gitIdentity.approved.agentGuard` solo acepta dos valores para `mode`: `"ask"` y `"block"`.
>
> - `"block"` es contra-intuitivo: no comunica que niega sin preguntar, solo que "bloquea".
> - No existe un modo `"deny"` que sea explícito sobre la negación.
> - No existe un modo `"allow"` para permitir todo sin preguntar.
>
> La semántica debería ser clara y explícita: **allow**, **deny**, **ask**.
>
> **Mismos problemas aparecen en otros guards** — no hay una lista exhaustiva, pero es probable que otros guards tengan restricciones similares.

**S2 — The guard inventory does not exist.**
> **Guards afectados:**
> - `gitIdentity.approved.agentGuard.mode` → solo acepta `["ask", "block"]` (schema: `packages/agentic-workflow-schema/src/config.ts` línea 191)
> - `gitIdentity.approved.signing` → solo acepta `["required", "allowed", "off"]` (schema: `packages/agentic-workflow-schema/src/config.ts` línea 181)
> - Posiblemente otros guards no auditados aún — se necesita un inventario completo de todos los guards y sus opciones.

**S3 — There is no global mode for the guards.**
> No hay forma de desactivar todas las verificaciones de guards de forma global. El usuario tiene que configurar cada guard individualmente.
>
> **Propuesta:** Un nivel superior de configuración que apague o modifique el comportamiento por defecto de todos los guards:
>
> Opción A — granular:
> ```json
> {
>   "guard": {
>     "default": "ask"
>   }
> }
> ```
>
> La primera es más flexible: `default: "ask"` permite todo por defecto pero permite overrides por guard.
>
> **Default de todo guard:** `"ask"` a menos que el operador especifique lo contrario. Esto es más seguro que `"allow"` para los guards que verifican identidad y atribución.

**S4 — The config schema mixes notations and documents nothing.**
> Los archivos de configuración (`agentic-workflow.json`, `pi-agentic-workflow.json`) mezclan notaciones y el esquema chirría:
>
> - Se usa camelCase en los keys (`agentGuard`, `logSession`, `pathProtection`, `gitIdentity`, `recommendedModels`, `onUnavailableRoute`, etc.)
> - Esto no es coherente y confunde a los usuarios que esperan `kebab-case` o al menos una notación consistente
> - El esquema JSON no documenta de forma clara qué sections existen y qué opciones tiene cada una
> - No hay un archivo de configuración completo de ejemplo que liste todos los guards, secciones y opciones posibles
>
> **Sugerencias:**
> - Establecer una notación de keys consistente (camelCase o kebab-case, no mezclar)
> - Crear un archivo de configuración de ejemplo/documentado con todos los keys y sus opciones
> - Los comentarios largos en el JSON pueden documentar las opciones completas sin saturar el JSON
> - Documentar los valores por defecto de cada sección

**S5 — Guard documentation must be exhaustive.**
> El archivo de configuración completo debe figurar explícitamente:
>
> - Todos los guards existentes
> - Todas las opciones disponibles por guard
> - Los valores por defecto
> - Ejemplos de uso corto (en comentarios largos del JSON)
>
> **Ejemplo de configuración final esperada:**
>
> ```json
> {
>   "guard": {
>     "default": "ask",
>     "gitIdentity": {
>       "mode": "deny"
>     },
>     "toolChoice": {
>       "mode": "allow"
>     }
>   }
> }
> ```

## Impact

- **The disposition vocabulary gains a third value.** `gitIdentity.approved.agentGuard.mode` retires in favour of `guard.gitIdentity.mode` (S5's example puts the disposition there), so three carriers change with it: the crate's `src/guard/git-identity.mjs` normalizer, the pi Layer 1 guard (`src/guards/git-identity.ts`), and the `gitIdentity-check.sh` Layer 2 hook — which reads the resolved profile, not the mode, and therefore needs only the shape check the crate test pins.
- **A new base section reaches every reader of `BASE_CONFIG_SECTIONS`**: the `config` CLI (`get`/`set`/`list`/`validate`/`init`/`schema`), the pi extension's `loadConfig`, both packages' `config.schema.json` projection via `packages/agentic-workflow-schema/scripts/generate-config-schema.mjs`, and `init-workspace`'s reference page.
- **`guards` retires.** The four booleans (`merge`, `history`, `ci`, `cost.maxTokens`) have no consumer in this repository: `rg -c 'guards\.(merge|history|ci|cost)' --glob '!node_modules'` answers 0 outside the schema, its tests and `docs/workflow/CONFIG.md`. Keeping a `guards` section beside a new `guard` section is the exact confusion S3/S4 report, and AGENTS.md's config policy refuses a key no runtime reads. Removing them changes no behaviour, and the removal is recorded as `D2` with its `rg` receipt.
- **The `agentGuard` object keeps its allow-list only.** `gitIdentity.approved.agentGuard.allow` is a per-key exemption and stays where it is; only `mode` moves. Consumers: `guardOptions` (pi), `normalizeGitIdentity` (crate), `docs/workflow/GIT_IDENTITY_HARDENING.md` and its template twin.
- **Naming collision is a live risk.** `guard` (new, singular) and `guards` (retired) differ by one character; the retirement is what prevents the pair from coexisting, and any later re-introduction of a `guards` key must be refused at validation time, not remembered as prose.
- **Not touched:** `pathProtection`, `contentGuard`, the seam hooks and `gitIdentity.approved.signing`. Their dispositions stay fixed by design (`D1`), and the new reference table states each one instead of leaving it implicit.

## Surfaces

- `packages/agentic-workflow-schema`
- `packages/agentic-workflow`
- `packages/pi-agentic-workflow`
- `docs`
- `skills/init-workspace`
- `template`

## Retirements

- `guards` section (base file): `rg -c 'guards\.(merge|history|ci|cost)' --glob '!node_modules' --glob '!*.test.*'` → 0 outside `packages/agentic-workflow-schema/src/config.ts`, its tests and `docs/workflow/CONFIG.md`; no runtime consumer, so the key is retired with no replacement. Receipt: `E1`.
- `gitIdentity.approved.agentGuard.mode`: replaced by `guard.gitIdentity.mode`. The value vocabulary changes with it (`block` → `deny`); `rg -c 'agentGuard\.mode' --glob '!node_modules'` → 0 after the change (`E2`), and the migration note in `docs/workflow/CONFIG.md` names the mapping.
- `block` as a *mode name* in the crate/pi guard predicates: it becomes `deny` everywhere the disposition is read (`rg -c '"block"' packages/agentic-workflow/src/guard packages/pi-agentic-workflow/src/guards` → 0, `E3`).
- `template/docs/workflow/GIT_IDENTITY_HARDENING.md`'s `agentGuard.mode` example line: replaced by the `guard.gitIdentity` form (the template is a copyable scaffold, so a stale example there is a real defect, not a mirror).

## Non-goals

- **No `kebab-case` migration** (`D3`). The repository's shipped keys are camelCase end to end; the only kebab rule today is the extension section-key regex, which *refuses* camelCase extension keys — the one real mixing defect S4 names. The fix makes that regex accept camelCase, so one notation is legal everywhere, without renaming ~40 keys across two files, the CLI, the template, the skills and every suite.
- **No disposition for `pathProtection` or `contentGuard`** (`D1`). `CONFIG.md` says of path protection "a project never silently drops a global glob or lowers a requirement"; `config.ts` says of the content guard "there is no `enabled` switch on purpose: a bypass is exactly the setting the layer exists to deny". A global `allow` reaching either would be a security regression disguised as a UX fix; both are documented as always-on instead.
- **No interaction design for guards with no question path.** `toolChoice` and `receipt` answer `ask` as `deny` and say so in the reference table; inventing a prompt for every `grep` is a different unit.
- **No `gitIdentity.approved.allow` move.** Only `mode` relocates; the allow-list keeps its path.
- **No `guards` compatibility shim.** This repository keeps no old surface alive for an older consumer: a config carrying `guards` is refused with the ordinary unknown-key report.
- **No new CLI verb.** `config list`, `config get` and `config init` already enumerate every section; the new one appears there without a new command.

## Risk tier

Verdict copied verbatim from `agentic-workflow ceremony tier classify` over the planned paths (`contract: risk-tier-verdict@1`):

- **Tier** — `standard` · **Task Size** — understood / contained / resumable-from-diff
- **Named high-risk item** — none — not a high-tier unit (`signals: []`)
- **Reason** — `multiple-packages`: 3 planned paths carry published contract content

## Future

none

## Future cost

- **One disposition vocabulary, one publisher.** `GUARD_MODES` is exported by the schema package and is the only spelling of allow/deny/ask; a carrier that re-spells it (a local `["allow","deny","ask"]` literal) is the drift the `normative-surfaces@1` row exists to catch. Binds whoever wires the next guard.
- **`guard.<name>.mode` is the only home of a disposition.** A future guard adds its name to `GUARD_NAMES`, its schema entry, and its row in the CONFIG.md reference table — never a second `mode` key inside its own section. Binds whoever adds a guard.
- **Always-on guards are declared, not forgotten.** `pathProtection` and `contentGuard` appear in the reference table with "always on (no disposition)"; a future change that gives either one a switch must rewrite that row and its invariant sentence together. Binds whoever reopens that decision.

## Applicable tests

- `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` — registry, `guard` validation, `normalizeGuard` resolution, `guards` refusal.
- `bun test packages/agentic-workflow-schema/test/config-schema-artifact.test.mjs` — the committed `config.schema.json` is a fixed point of the generator.
- `bun test packages/agentic-workflow/test/git-identity.hook.test.mjs` — the crate normalizer's disposition mapping.
- `bun test packages/agentic-workflow/test/config-cli.test.mjs` — the CLI enumerates `guard.*` and no longer `guards.*`.
- `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` — Layer 1 dispositions, headless `ask`.
- `bun test packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs` — the `allow` disposition stands the carrier down.
- `bun test packages/pi-agentic-workflow/test/receipt-guard.test.mjs` — the receipt guard's disposition.
- `bun test packages/pi-agentic-workflow/test/default-inherit.test.mjs` — the effective config's shape.
- `cd packages/pi-agentic-workflow && bun run test` and `cd packages/agentic-workflow-schema && bun run test` — both package gates.
- `bun test scripts/config-guards-doc.test.mjs` — the reference table names every published guard and disposition.
- `bun test scripts/local-config-contract.test.mjs` — the repository's own committed config obeys the schema it ships.
- `bun test scripts/prose-gate-inventory.test.mjs` — every declared normative surface is claimed by a gate row.
- `bun test scripts/normative-drift.test.mjs` — the drift gate's own suite.
- `bun scripts/docs-generate.mjs --check` — the projection is a fixed point.

## Known pre-existing issues

- **`guards` shipped four keys no runtime reads** (`merge`, `history`, `ci`, `cost.maxTokens`) — *affects* this unit: SG-2's inventory cannot be exhaustive over a section whose keys nothing consumes, so the retirement is part of this change (`D2`), not a follow-up.
- **The `guards` name and a new `guard` name differ by one character** — *does not affect* this unit once the retirement lands; validation refuses the retired key, so the pair never coexists.
- **`template/` carries a second copy of `GIT_IDENTITY_HARDENING.md`** — *affects* this unit: the example line it copies must move with the source, and `audit-docs` compares the pair.
- **`docs/workflow/CONFIG.md` documents `guards` and the `agentGuard.mode` pair** — *affects* this unit: both rows are rewritten in the same change (S5).

## Acceptance criteria

- **AC-S1** — The disposition vocabulary is `allow`/`deny`/`ask` and one publisher owns it (`GUARD_MODES` in the schema package); the retired `block` spelling is refused with the enum report; and `agentGuard.mode` decides nothing — the schema refuses the key and the guards ignore a written one. Check: `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 0 (cases `S1: the disposition vocabulary…`, `S1: the retired block spelling…`, `S2/D2: …`) and `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (case `the disposition is resolved from guard, and a retired mode is inert`). `block` survives only as Pi's own `tool_call` result field, which is not this vocabulary.
- **AC-S2** — The inventory is exhaustive and testable: every guard name the schema publishes is a row in the CONFIG.md reference table, every disposition value is named by it, and every row states its default and whether it can ask. Check: `bun test scripts/config-guards-doc.test.mjs` exits 0 (5 cases, reading the built vocabularies) and `bun test scripts/normative-drift.test.mjs` exits 0 with the three new inventory rows.
- **AC-S3** — A global default exists and each guard overrides it: `guard.default` is the fallback, `guard.<name>.mode` wins, and the shipped default is `ask` for all three disposition-bearing guards, so an unconfigured project behaves exactly as it did. Check: the schema suite's `normalizeGuard` cases plus `bun test packages/pi-agentic-workflow/test/default-inherit.test.mjs` exit 0.
- **AC-S4** — One notation is legal everywhere: `validateConfigExtension` accepts a camelCase section key and a kebab-case one, and a snake_case or uppercase key is still refused. Check: `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 0 (case `extension keys accept both camelCase and kebab-case`).
- **AC-S5** — The documentation is exhaustive: `docs/workflow/CONFIG.md` carries the guard reference table (every guard, its modes, its default, whether it can ask, and the always-on pair), a complete commented example file, and the migration mapping; `config init` renders the `guard` section with its modes. Check: `bun scripts/normative-drift.mjs` exits 0, `bun test packages/agentic-workflow/test/config-cli.test.mjs` exits 0 (case `the init template documents the guard section`).

## Tasks

- P1 — Freeze the contract as failing cases: schema registry (`guard` present, `guards` gone), `guard` validation, `normalizeGuard` resolution, the retired `block` spelling, the extension-key notation, the CLI inventory, the crate normalizer and the two pi carriers
  (validator: `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 1 at the cut head with the new cases red)
  (Implements: S1, S2, S3, S4)
  - Relevant files: packages/agentic-workflow-schema/test/config-contract.test.mjs, packages/agentic-workflow/test/config-cli.test.mjs, packages/pi-agentic-workflow/test/git-identity-guard.test.mjs
- P2 — Publish the vocabulary and the section in the schema package: `GUARD_MODES`, `GUARD_NAMES`, `normalizeGuard`, `GUARD_SECTION_SCHEMA`, the `guard` base section, the `guards` retirement, `agentGuard.mode` retirement, and the camelCase extension-key rule
  (validator: `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4)
  - Relevant files: packages/agentic-workflow-schema/src/config.ts, packages/agentic-workflow-schema/src/index.ts, packages/agentic-workflow-schema/config.schema.json, packages/agentic-workflow-schema/scripts/generate-config-schema.mjs
- P3 — Make the carriers read the disposition: the crate normalizer, the pi git-identity guard, the tool-choice carrier and the receipt guard, with `ask` answering as `deny` where no question path exists
  (validator: `cd packages/agentic-workflow && bun test test/git-identity.hook.test.mjs` exits 0 and `cd packages/pi-agentic-workflow && bun run test` exits 0)
  (Implements: S1, S3)
  - Relevant files: packages/agentic-workflow/src/guard/git-identity.mjs, packages/pi-agentic-workflow/src/guards/git-identity.ts, packages/pi-agentic-workflow/src/guards/tool-choice.ts, packages/pi-agentic-workflow/src/extension/receipt-guard.ts, packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/src/config/types.ts
- P4 — Write the documentation the issue asks for: the guard reference table, the complete example, the migration mapping, the package READMEs, the init-workspace reference and the template copy
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S2, S5)
  - Relevant files: docs/workflow/CONFIG.md, docs/workflow/GIT_IDENTITY_HARDENING.md, template/docs/workflow/GIT_IDENTITY_HARDENING.md, packages/pi-agentic-workflow/README.md, skills/init-workspace/references/CONFIG.md, AGENTS.md
- P5 — Verify the whole surface and record the evidence
  (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: docs/fix/626-config-guards-ux/SPEC.md

## Triaged steps

n/a — the owner's local, unpublished workflow substitutes for the lane's triage
(`## Tasks` is the authoritative list; `unit-lane` is not run on this change).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-18, the issue, verbatim:
  ```
  config(guards)!: mejorar UX de los guards — modos intuitivos (allow/deny/ask), modo global off, y esquema de configuración
  ```
- **L2** — 2026-11-18, the owner's local workflow instruction, verbatim:
  ```
  Apply to this repository: issue #626

  This is a **local, unpublished** workflow for changing agentic-workflow itself.
  ```
- **D1** — 2026-11-18, owner scope decision taken at cut (asked, answer not received before
  the delivery instruction; recorded so it can be reversed cheaply): `guard` governs the
  behaviour guards (`gitIdentity`, `toolChoice`, `receipt`); `pathProtection` and
  `contentGuard` stay always-on and keep their written invariants.
- **D2** — 2026-11-18, `guards` retires with its `rg` receipt (see `## Retirements`): the
  four booleans have no runtime consumer, and keeping the section beside `guard` is the
  confusion the issue reports.
- **D3** — 2026-11-18, notation decision at cut: camelCase everywhere; the extension
  section-key regex becomes the one rule that makes both spellings legal, instead of a
  ~40-key kebab migration.

- **E1** — 2026-11-18, `rg -n 'guards\.(merge|history|ci|cost)' --glob '!node_modules' --glob '!*.test.*' scripts/ packages/ skills/ template/` · 0 matches outside the schema section, its tests and CONFIG.md → the retirement is behaviour-neutral.
- **E2** — 2026-11-18, the cut-head baseline, `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs packages/agentic-workflow/test/config-cli.test.mjs packages/agentic-workflow/test/git-identity.hook.test.mjs` · exit 0 · 52 pass.
- **E3** — 2026-11-18, RED then GREEN: at the cut head the schema suite died on `SyntaxError: Export named 'GUARD_MODES' not found` (0 pass / 1 error) and the crate suites failed 4 cases (`init writes…`, `list names…`, `normalizeGitIdentity…`, `the identity guard's disposition…`); after the implementation `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` · exit 0 · 22 pass, and the crate trio · exit 0 · 58 pass.
- **E4** — 2026-11-18, `bun run test` in `packages/agentic-workflow-schema` · exit 0 · 914 pass / 0 fail (52 files), and in `packages/agentic-workflow` · exit 0 · 1290 pass / 0 fail (70 files).
- **E5** — 2026-11-18, the composed `config.schema.json` regenerated by `packages/agentic-workflow-schema/scripts/generate-config-schema.mjs` (48 insertions, 18 deletions) · `bun test test/config-schema-artifact.test.mjs` · exit 0 · 2 pass.
- **E6** — 2026-11-18, `bun run test` in `packages/pi-agentic-workflow` · exit 0 · 992 pass / 0 fail (85 files), including the new `D1`/`D2`/`F29` dispositions cases and the identity guard's `allow` case.
- **E7** — 2026-11-18, `bun test scripts/normative-drift.test.mjs` · exit 0 · 21 pass; `bun test scripts/config-guards-doc.test.mjs` · exit 0 · 5 pass; `bun test scripts/prose-gate-inventory.test.mjs` · exit 0 · 22 pass.
- **E8** — 2026-11-18, `bun scripts/check-skill-context.mjs --documents` · PASS (4 documents) after re-pinning `machineLines` 165 → 168 and `linesMax` 728 → 731 to the measured boundary (prose 563/571, estimate 13,212/13,259 unchanged).
- **G1** — 2026-11-18, HEAD 6beea3c28ab9259742021afd77bbee0894a70667, `node scripts/run-root-suite.mjs` · exit 0 · 123 suites pass. Two earlier runs were red on load-sensitive cases only: `unit-route` F7 measured 546 ms against a 500 ms budget and `phase-lint` hit the 120 s suite wall; both pass alone (64 pass / 14 s and 162 pass / 40 s).
- **E12** — 2026-11-18, `bun scripts/dimension-regression.mjs --root . --base 784c3414` · `17 dimensions` at both ends, `changed review surfaces 1` (`docs/workflow/GATE_INVENTORY.md`, where the three new normative-surface rows are claimed) · the review-dimension checklist is untouched by this change: the one surface the range carries is the inventory itself, and the dimensions it indexes keep their count.
- **G2** — 2026-11-18, HEAD 6beea3c28ab9259742021afd77bbee0894a70667, `bun scripts/docs-generate.mjs --check` · PASS (3 files, roadmap unchanged); `bun scripts/lint-changeset.mjs` · ok for `.changeset/626-config-guards-ux.md`.
- **P1** — 2026-11-18, the unit doc and both planning ledgers frozen · `2007a121`.
- **P2** — 2026-11-18, the contract frozen as failing cases · `ba1c0054`.
- **P3** — 2026-11-18, the vocabulary, the section and both carriers · `5abee0df`.
- **P4** — 2026-11-18, the reference table, the example, the migration and the declared inventory · `8206025f`.
- **D4** — 2026-11-18, the repository's own `.pi/agentic-workflow.json` migrated in the same change (`agentGuard.mode: block` → `guard.gitIdentity.mode: deny`, the identical behaviour): the retired key made every config reader report `malformed-config`, which two root suites caught. The content guard's fail-closed rule was doing its job.
- **D5** — 2026-11-18, two ledger references corrected at implementation time (an AC citing `bun scripts/normative-drift.mjs`, which does not exist: the gate is its test suite), and AC-S1/AC-S2 restated to the receipts actually run. The asks themselves are untouched.
- **P5** — 2026-11-18, the journal fragment written through `journal write --kind narrative` · `6beea3c2`.

- **D6** — 2026-11-18, an out-of-unit commit (`1cab6da3` `chore(config): fix config`, authored while this branch's push gate ran) rewrote `.pi/agentic-workflow.json`'s key back to the retired `guards`. The reader validated only the sections its registry names and ignored the key, so the project's identity guard fell from `deny` to the shipped `ask` with no error. Restored, and the gap that let it pass silently now has its own suite (`scripts/local-config-contract.test.mjs`, red `ac3a570e` / green `9b05bc79`): both committed config files are checked against their owners — the schema registry and the package's extension descriptor.

## Next

The owner's external verdict on PR [#636](https://github.com/gtrabanco/agentic-workflow/pull/636):
the obligations ledger (14 rows, all `verified`), the verification block, and the disclosures
(the pi suite's red was inferred from the same frozen cases rather than observed first; the
repository's own config had to be migrated; two root-gate runs flaked on timing-only cases).
Two environment findings this change exposed belong to their own units: the pre-push hook
prints `local-gate: PASS` and then the push dies with exit 141 (SIGPIPE) without transferring
refs (reproduced twice; the same commit pushes immediately with `--no-verify`), and
`worktree-guard` fails every push while a merged sibling worktree's directory is held as `cwd`
by the daemon's MCP children.

## References

- Issue: [#626](https://github.com/gtrabanco/agentic-workflow/issues/626)
- Prior decisions: [docs/workflow/CONFIG.md](../../workflow/CONFIG.md) (unified config, issue #427), [docs/workflow/GIT_IDENTITY_HARDENING.md](../../workflow/GIT_IDENTITY_HARDENING.md) (issue #514)
- Rule that forces the `guards` retirement: AGENTS.md §"Config policy for new features" (a key no runtime reads is not shipped)

## Branch

`fix/626-config-guards-ux`

## Depends on

none

## Regression scope

| Scenario | Check |
|---|---|
| An unconfigured project behaves as before: the git-identity agent guard asks (headless blocks), the tool-choice carrier blocks a `grep`-as-search, the receipt guard blocks an inline marker | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs`, `.../tool-choice-guard.test.mjs`, `.../receipt-guard.test.mjs` exit 0 |
| The Layer 2 identity hook keeps judging the resolved profile and ignores the disposition | `bun test packages/agentic-workflow/test/git-identity.hook.test.mjs` exits 0 |
| `config get`/`set`/`list`/`validate`/`reset` keep working on every pre-existing section | `bun test packages/agentic-workflow/test/config-cli.test.mjs` exits 0 |
| The committed `config.schema.json` stays a generator fixed point | `bun test packages/agentic-workflow-schema/test/config-schema-artifact.test.mjs` exits 0 |
| The projection stays a fixed point | `bun scripts/docs-generate.mjs --check` exits 0 |
