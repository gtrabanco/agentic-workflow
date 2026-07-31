# Flujo de trabajo agéntico

> 🇬🇧 [English version](README.md)

Cómo construimos con programación agéntica en este repositorio: el flujo de
extremo a extremo para una **feature** y para un **issue**, las **skills**
que impulsan cada paso, y cómo **replicar** todo el sistema en otro proyecto.

Esta es la copia versionada, dentro del repositorio. Un espejo multi-página
más amigable para el lector vive en Notion ("Agentic Workflow").

## Páginas

| Doc | Qué cubre |
|---|---|
| [FEATURE_WORKFLOW.es.md](FEATURE_WORKFLOW.es.md) | Idea/issue → SPEC + artefactos → ejecución por fases → hardening → review → audit → PR |
| [ISSUE_WORKFLOW.es.md](ISSUE_WORKFLOW.es.md) | Triage → clasificar (fix-now / postpone / wontfix / promote) → enrutar → informar |
| [SKILLS.es.md](SKILLS.es.md) | Cada skill del sistema, qué hace, y cómo se combinan |
| [REVIEW_AND_CLASSIFY.es.md](REVIEW_AND_CLASSIFY.es.md) | Cuándo y cómo revisar — `review-change` (las revisiones correctas según la plataforma) y su motor `review-implementation` (encontrar → tabla de decisión clasificada) |
| [RECOMMENDED_SKILLS.es.md](RECOMMENDED_SKILLS.es.md) | Skills agnósticas de calidad de software y arquitectura para una buena programación agéntica — universales vs. condicionales según la naturaleza del proyecto; las skills de stack/infraestructura quedan fuera de alcance |
| [REPLICATE.es.md](REPLICATE.es.md) | Instalación con `npx skills` + prompt portable para configurar esto en cualquier proyecto |
| [MIGRATION.es.md](MIGRATION.es.md) | Actualizar una instalación existente desde el conjunto de skills anterior — qué se renombró, qué eliminar |
| [GOLDEN_FIXTURE.es.md](GOLDEN_FIXTURE.es.md) | Prueba de humo manual: tras editar una skill del camino ejecutor, correrla contra un fixture de juguete con el modelo más débil de la flota y comprobar que su salida contractual se mantiene |
| [WORKFLOW_INVARIANTS.es.md](WORKFLOW_INVARIANTS.es.md) | Contrato portable para invariantes arquitectónicas opcionales del proyecto y su evaluación basada en evidencia |

## Principios fundamentales

1. **Los docs guían el trabajo.** Cada skill lee primero la guía propia del
   proyecto (`CLAUDE.md`/`AGENTS.md`), el mapa de documentación, la
   arquitectura, el roadmap y los docs de estilo, y los respeta. El flujo de
   trabajo se adapta al proyecto, no al revés.
2. **Planificar antes de programar.** Las features reciben un SPEC +
   artefactos de planificación antes de escribir una sola línea.
3. **Una fase a la vez.** La ejecución es fase a fase, cada una verificada y
   confirmada (commit) por separado.
4. **Un PR por unidad, siempre contra la rama por defecto.** Nunca trabajar
   directamente sobre `main`; nunca apilar PRs.
5. **Las decisiones se respaldan con evidencia.** El triage de issues
   verifica los disparadores contra el código real; el trabajo diferido se
   rastrea, no se implementa sobre la marcha.
6. **Puerta de verificación antes de cada commit.** El chequeo de tipos, los
   tests y el build deben pasar (usando los comandos de puerta propios del
   proyecto).
7. **Revisión a la altitud correcta.** El cambio (`review-change`), luego el
   PR (`audit-pr`), y — periódicamente — el producto entero
   (`product-audit`).
8. **Los cambios de arquitectura son explícitos.** Las invariantes
   arquitectónicas aplicables se evidencian y preservan, o se cambian mediante
   una decisión explícita; nunca se infieren de una SPEC o implementación.

## El mapa de un vistazo

```
                 ┌─────────────── ISSUE ───────────────┐
                 │            triage-issue              │
                 │   fix-now │ promote │ postpone │ wontfix
                 └─────┬──────────┬──────────┬──────────┘
                       │          │          └─ leave open + dated comment
                       │          │
              plan-fix │          │ plan-feature  (router takes the issue → SPEC)
                       │          │
                       ▼          ▼
   FEATURE:   plan-feature ──▶ execute-phase ──▶ review-change ──▶ audit-pr ──▶ PR
              (router:                            (auto every       (merge
               idea│issue│scoped)                  2 phases)         gate)
   FIX:        plan-fix ──▶ execute-phase --fix ──▶ review-change ──▶ audit-pr ──▶ PR

   audit-docs ───── docs ↔ roadmap ↔ code ↔ fix index coherence            (anytime)
   product-audit ── product-wide health check → issues + roadmap proposals (periodic)

   AUTOPILOT:  ship-roadmap ── interview once ─▶ found + roadmap ─▶
               /loop { the FEATURE chain above, feature by feature } ─▶ final report
               (you merge the PRs — or --fullauto under safety floors)
```
