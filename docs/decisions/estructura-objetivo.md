# Estructura objetivo del kit

Este mapa separa el destino propuesto de lo que existe hoy. Una carpeta marcada «falta» no se crea en este cambio: el prompt responsable indica dónde se planifica su implementación. Las rutas actuales se contrastaron en el checkout, sin leer históricos protegidos.

Árbol objetivo propuesto, desde la raíz del kit:

```text
harness/
├── AGENTS.md
├── core/
│   ├── contracts/
│   ├── agents/
│   └── skills/
├── runtime/
├── guardrails/
├── observability/
├── memory/
├── adapters/
├── templates/
├── evals/
├── docs/
├── tests/
└── scripts/
```

El árbol expresa la forma de destino; la tabla detalla el estado actual de cada carpeta y el prompt responsable.

| Carpeta de destino | Estado actual | Dónde vive hoy | Prompt responsable |
|---|---|---|---|
| `harness/` | Falta como carpeta; el punto de entrada del proyecto ya existe | `AGENTS.md`, `README.md`, `install.sh`, `verify` en raíz | P00 |
| `core/contracts/` | Existe, parcial | `core/contracts/verification.md` | P02 |
| `core/agents/` | Existe | `core/agents/planner.md`, `core/agents/builder.md` | P03 |
| `core/skills/` | Existe | `core/skills/*/SKILL.md` y recursos de cada skill | P04 |
| `runtime/` | Falta como carpeta | `scripts/kit-run.mjs`, `scripts/kit-escalera.mjs`, módulos en `tools/run/` y `tools/spawn/` | P01 |
| `guardrails/` | Falta como carpeta | `scripts/permissions-hook.mjs`, `scripts/hook-shell.mjs`, `scripts/hook-decidir.mjs`, `adapters/*/*deny*`, `adapters/claude-code/sandbox.mjs`, `tools/verify/` | P05 |
| `observability/` | Falta como carpeta | `scripts/observe.mjs`, `scripts/usage.mjs`, `scripts/runs-report.mjs`, `scripts/progress-watch.mjs`, `tools/observe/`, `tools/progress/`, `tools/usage/` | P06 |
| `memory/` | Falta como carpeta | `changes/<nombre>/notes.md`, `decisions.md`, `progress.jsonl`; `scripts/after-compact.mjs` | P07 |
| `adapters/` | Existe | `adapters/claude-code/`, `adapters/codex/`, `adapters/pi/`, `adapters/shared/` | P08a Claude Code; P08b Codex; P08c Pi |
| `templates/` | Falta como carpeta | `install.sh` genera el contenido instalable mediante `tools/install/`; la plantilla de plan vive en `core/skills/plan-change/references/template.md` | P09 |
| `evals/` | Existe | `evals/builder/`, `evals/arquitectura-cambios/` | P10 |
| `docs/` | Existe | Documentación vigente y decisiones en `docs/` y `docs/decisions/` | P11 |
| `tests/` | Existe | Suites por flujo y componente en `tests/` | P12 |
| `scripts/` | Existe, mezcla entradas CLI, hooks y reportes | `scripts/`; módulos operativos compartidos están distribuidos en `tools/` | P13 |

Los prompts se aplican en el orden acordado por la persona usuaria. Este mapa no traslada ni renombra archivos; las ubicaciones objetivo describen trabajo posterior.
