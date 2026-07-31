# Replicar en cualquier proyecto

> 🇬🇧 [English version](REPLICATE.md)

Replicar el flujo de trabajo tiene **dos mitades**: el **andamiaje** de
documentación (el sustrato que leen las skills) y las **skills** mismas
(el comportamiento).

## Mitad 1 — el andamiaje de documentación (`template/`)

Las skills operan sobre el sustrato de documentación de un proyecto: el
mapa de documentación, las plantillas de SPEC/feature/fix, y las
convenciones. Este repositorio distribuye ese sustrato como un andamiaje
genérico y copiable en `template/`:

```sh
# Scaffold a new project's way of working (CLAUDE.md, docs/ tree, .github templates):
npx degit gtrabanco/agentic-workflow/template my-project
```

Luego rellena los placeholders en `CLAUDE.md` (comandos, el mapa de
documentación, tu arquitectura) y elimina las carpetas de docs que no
necesites (p. ej. `frontend/` para un proyecto sin UI). Las skills leen
este andamiaje en tiempo de ejecución, así que las dos mitades encajan.

## Mitad 2 — las skills

Dos formas de instalar las skills en un repositorio. Son complementarias.

| Método | Qué obtienes | Cuándo usarlo |
|---|---|---|
| **CLI `skills`** | Las 30 skills instalables (17 orientadas al usuario + 13 internas, incluido el contrato `orchestration-envelope`) copiadas (o enlazadas simbólicamente) **textualmente** en el directorio de skills del agente destino | Quieres exactamente las mismas skills, rápido, determinista, en cualquier agente |
| **Prompt portable** | Las skills **regeneradas, adaptadas** a los docs/arquitectura del repositorio destino | Quieres que se ajusten a las convenciones de un proyecto distinto |

El conjunto instalable es **17 orientadas al usuario + 13 internas** (30 en total):

- **Orientadas al usuario (17):** `init-workspace`,
  `discover-repository-state`, `resolve-repository-state`, `design-feature`,
  `plan-feature`, `plan-fix`, `execute-phase`, `review-change`, `audit-pr`,
  `audit-docs`, `product-audit`, `fold-findings`, `generate-docs`,
  `triage-issue`, `ship-roadmap`, `log-session`, `workflow-status`.
- **Internas (13):** `plan-feature-from-issue`, `plan-feature-scaffold`,
  `orchestration-envelope`, `review-implementation`, `review-code`,
  `review-security`, `review-verify`, `review-debt`, `review-design`,
  `review-a11y`, `review-brand`, `review-perf` y `review-seo`. Están ocultas
  del menú y los routers de las skills orientadas al usuario las despachan.
  La utilidad `bump-skill`, exclusiva del repositorio, queda fuera del conteo
  instalable. La entrevista de idea-en-bruto que solía ser un paso interno de
  `plan-feature` ahora está incorporada en la propia `design-feature`
  (orientada al usuario, ya que la definición de producto es su propia etapa).

> **Versionado.** Cada skill lleva su propio `version:` (semver) en el
> frontmatter; los cambios se registran en
> [`../../CHANGELOG.md`](../../CHANGELOG.md). Actualiza una instalación
> con `npx skills update`.

## Método 1 — CLI `skills` (determinista)

La CLI [`skills`](https://github.com/vercel-labs/skills) lee los archivos
`SKILL.md` directamente de este repositorio y los instala en el agente que
uses. Detecta automáticamente los agentes instalados (Claude Code, Cursor,
Codex, OpenCode, Cline, y [70+ más](https://skills.sh)) y escribe cada
skill en el directorio de skills de ese agente — `.claude/skills/` para
Claude Code, `.agents/skills/` para el conjunto universal, etc.

```sh
# From the root of the TARGET repository — install all skills:
npx skills add gtrabanco/agentic-workflow

# This repo is PRIVATE. The shorthand above can fail under bunx; use the SSH URL:
npx skills add git@github.com:gtrabanco/agentic-workflow.git

# Useful flags:
#   --skill <name>     install only specific skills (repeatable)
#   --agent <name>     target specific agents (repeatable; e.g. claude-code, cursor, codex)
#   --global, -g       install for the current user instead of the current project
#   --copy             copy files instead of symlinking
#   --list, -l         list the skills the source exposes, then exit
#   --yes, -y          non-interactive

# Manage them afterwards:
npx skills list
npx skills update
npx skills remove <name>
```

Sin publicación en npm, sin registro, sin paso de build — la CLI clona el
repositorio y coloca las carpetas de skills para cada agente. Añadir una
skill a este sistema es solo añadir un `skills/<name>/SKILL.md`; la CLI la
detecta automáticamente sin ningún manifiesto que mantener.

Tras instalarlas, las skills funcionan de inmediato porque **descubren el
proyecto destino en tiempo de ejecución** (guía del agente, mapa de
documentación, arquitectura, roadmap, índice de fixes). Nada en ellas está
codificado a las rutas de este repositorio.

> **Skill individual / ref distinta.** La fuente acepta una ruta a una
> sola skill (`.../tree/main/skills/plan-feature`), una URL git completa,
> o una ruta local (`npx skills add ./path/to/agentic-workflow`). Ver el
> README de `skills` para todos los formatos de fuente.

## Método 2 — Prompt portable (adaptativo)

[`PORTABLE_PROMPT.es.md`](PORTABLE_PROMPT.es.md) contiene un prompt que
pegas en Claude Code (o cualquier agente de programación capaz) desde la
raíz del repositorio destino. Este:

1. Descubre las convenciones de ese proyecto (reglas de rama, comandos de
   puerta, idioma de docs, esquema de SPEC/roadmap/fix, arquitectura,
   estilo).
2. Crea las skills adaptadas a esas convenciones.
3. Escribe una copia de `docs/workflow/` usando las rutas y comandos
   reales del proyecto.
4. Se combina con cualquier skill de ejecución/revisión que ya exista ahí.

Usa esto cuando la estructura del proyecto destino difiera lo suficiente
como para que prefieras que las skills se reajusten en lugar de copiarse.

## ¿Cuál debería usar?

- Mismo stack / repositorio similar → **CLI `skills`** (Método 1). Las
  skills se adaptan en tiempo de ejecución de todas formas.
- Stack distinto, o quieres que la copia de docs/workflow esté escrita en
  los propios términos del proyecto → **prompt** (Método 2).
- Cinturón y tirantes → instala con la CLI, luego ejecuta `audit-docs`
  para confirmar que las skills encajan con los docs del proyecto nuevo.

## Qué significa "respetar el proyecto" aquí

Ambos métodos producen skills que, en tiempo de ejecución, **leen y
obedecen** las reglas de arquitectura, el mapa de documentación, las guías
de estilo, las convenciones de nombres, las reglas de
dinero/i18n/SEO/a11y/seguridad, y la puerta de verificación **del proyecto
destino**. La forma del flujo de trabajo se mantiene constante; los
detalles siempre vienen del proyecto en el que estás.
