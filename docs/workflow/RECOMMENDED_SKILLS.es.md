# Skills recomendadas — calidad de software y arquitectura agnósticas

> 🇬🇧 [English version](RECOMMENDED_SKILLS.md)

Esta lista corta es deliberadamente **agnóstica de stack**: skills que te
ayudan a *programar bien con agentes* y elevan la **calidad de software y la
arquitectura** en **cualquier** proyecto — sin importar el lenguaje, el
framework, o la infraestructura. Apoyan y afinan nuestras skills del flujo
de trabajo.

> **Ninguna de estas es una dependencia.** El flujo de trabajo trae su
> propio paquete de revisión interno (`skills/review-*`: código, seguridad,
> verificación, deuda, diseño, a11y, marca, rendimiento, seo), así que
> `review-change` / `product-audit` cubren cada eje de revisión por sí
> solas, en cualquier agente y cualquier modelo. Todo lo de abajo es un
> **extra opcional** que puede afinar un eje — nunca requerido para que el
> flujo de trabajo funcione.

> **Fuera de alcance a propósito:** skills de stack/infraestructura/servicio
> (tu plataforma, framework, ORM, runtime, y paquetes de servicio/herramienta…).
> Instala esas simplemente porque encajan con tu stack — te hacen más rápido
> en *ese* stack, pero **no** son recomendaciones de calidad transversales.
> Ver la sección de abajo.

## Dos ejes de aplicabilidad

- **Universal** — aplica a *todo* proyecto: CLI, librería, demonio, servicio,
  web, móvil.
- **Condicional según la *naturaleza* del proyecto** (no su stack) — aplica
  según lo que el proyecto **es**. La prueba de fuego, generalizada a partir
  del ejemplo de diseño: *"una skill de diseño es genial cuando hay algo que
  diseñar — inútil para un programa de terminal (a menos que sea una app
  TUI/`ink`, e incluso así suele ser excesivo)."* Pregunta **"¿hay
  realmente un artefacto de este tipo que producir?"** antes de instalar.

---

## Universal — instalar en todo proyecto serio

### A. Disciplina agéntica (programar *bien* con agentes)

| Skill | Por qué | Combina con (nuestras) |
|---|---|---|
| `karpathy-guidelines` | Reduce los modos de fallo clásicos del agente: sobrecomplicación, ediciones no quirúrgicas, suposiciones no declaradas, criterios de éxito vagos. La skill de "programar bien con un agente" de mayor apalancamiento. | todas |
| `skill-creator` (anthropic) | Autorar/mantener skills para que tu conjunto de herramientas agéntico se mantenga sano y consistente. | todas las nuestras |
| `consolidate-memory` (anthropic) | Higiene periódica de memoria para que las notas de largo plazo del agente se mantengan veraces. | proyectos de larga duración |

### B. Calidad de código & corrección

| Skill | Por qué | Combina con (nuestras) |
|---|---|---|
| `code-review` | Bugs de corrección + simplificación sobre el diff. | `review-implementation` (añade la clasificación que le falta) |
| `simplify` | Limpiezas de reutilización / simplificación / eficiencia / altitud — solo calidad, sin caza de bugs. | `review-implementation` |
| `security-review` | Pase de seguridad sobre los cambios. | eje de seguridad de `review-implementation` |
| `verify` | Ejecutar la cosa y confirmar el comportamiento real — no solo que los tests pasen. | `execute-phase` Etapa 4 |
| `ghost-scan-secrets` | Escanea secretos/credenciales filtradas en cualquier código base. | "sin secretos" pre-commit |

### C. Arquitectura & práctica de ingeniería

| Skill | Por qué | Combina con (nuestras) |
|---|---|---|
| `engineering:architecture` | Guía & decisiones de arquitectura. | `plan-feature`, `review-implementation` (eje de arquitectura) |
| `engineering:system-design` | Diseño de sistemas para features no triviales. | `design-feature`, `plan-feature` |
| `engineering:testing-strategy` | Qué probar, en qué capa, cuánto. | ejes de test de `review-implementation`, testing de `execute-phase` |
| `engineering:tech-debt` | Identificar & gestionar deuda deliberadamente. | `triage-issue`, `audit-docs` |
| `engineering:debug` | Metodología sistemática de depuración. | cualquier trabajo de bugs |
| `engineering:documentation` | Práctica de documentación. | `plan-feature`, `audit-docs` |
| `doc-coauthoring` (anthropic) | Docs largos y estructurados: specs, propuestas, documentos de decisión. | `design-feature`, `plan-feature` |

> **Skill de patrón de arquitectura:** mantén una que codifique *tu* patrón
> elegido (puertos y adaptadores, arquitectura limpia, por capas, MVC…). El
> patrón es agnóstico; la skill registra la decisión. Mantén una skill de
> patrón de arquitectura por proyecto — reemplaza su contenido según el
> proyecto, conserva la idea.

---

## Condicional — según lo que el proyecto *es* (no su stack)

| Skill(s) | Instalar cuando el proyecto… | Saltar cuando… |
|---|---|---|
| `design-review`, `ux-audit`, `ux-extract`, `ux-compare`, `design-system`, `frontend-design` | …tiene una **UI de cara al usuario** que diseñar (app web, sitio de marketing, GUI de escritorio) | …es una CLI, librería, demonio, o backend/servicio puro — *a menos que* sea una app TUI/`ink` con maquetación real, e incluso así suele ser excesivo |
| `web-perf` | …despliega un frontend **web** con Core Web Vitals que defender | …no es web |
| `claude-api` | …**llama a la API de Claude / construye sobre el SDK de Anthropic** | …no tiene funciones de LLM |
| `docx`, `pptx`, `xlsx`, `pdf`, `brand-guidelines`, `canvas-design` (anthropic) | …**produce esos artefactos como entregables** (informes, presentaciones, marca) | …tu salida es código fuente |

**Regla de decisión:** la capacidad de la skill es irrelevante si el
artefacto no está ahí. Sin UI → sin skills de diseño. Sin web → sin
web-perf. Sin llamadas a LLM → sin claude-api. Sin documentos que entregar →
sin skills de oficina.

---

## Cómo refuerzan estas nuestras skills del flujo de trabajo

- **Planificar** — `engineering:system-design` + `doc-coauthoring` afinan
  `plan-feature` (el router que cubre los caminos de entrada de idea, issue,
  y slug acotado).
- **Revisar** — `code-review` + `simplify` + `security-review` alimentan
  los hallazgos de `review-implementation`; la nuestra añade la
  **clasificación** que a ellas les falta.
- **Decidir / deuda** — `engineering:tech-debt` ↔ `triage-issue`;
  `audit-docs` mantiene honesto el conjunto de docs.
- **Higiene agéntica** — `karpathy-guidelines` (cada tarea) + `skill-creator`
  (mantener el conjunto de herramientas) + `consolidate-memory` (mantener la
  memoria veraz).

---

## Fuera de alcance aquí — skills de stack / infraestructura / servicio

Tus skills de plataforma/runtime, skills de framework, skills de
ORM/base de datos, skills específicas de lenguaje, y los paquetes de
servicio/herramienta `*:*` (pagos, chat, docs, control de versiones…).

Instala estas **solo si** encajan con tu stack y servicios. Te hacen más
rápido *en ese stack* — para este repositorio son la decisión correcta;
para una CLI en Go o una librería en Rust son ruido. No forman parte de la
recomendación de calidad agnóstica.

---

## En resumen

En **cualquier** proyecto, instala el conjunto **Universal** (disciplina
agéntica + calidad de código + arquitectura). Añade una skill
**Condicional** solo cuando el proyecto tenga ese tipo de artefacto (UI,
rendimiento web, LLM, documentos). Trata las skills de **stack/infra** como
un eje separado y obvio — ajústalas a tu stack, no a la "calidad". Pocas
skills de alta señal superan a muchas.
