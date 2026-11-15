# Qué del kit actual asume Node (y otras herramientas)

Medido con `grep -rniE "pnpm|npm|node|jest|playwright|vitest|yarn|package\.json" agentes skills` (2026-11-14). Solo hay dos archivos con recetas; el resto del kit ya es neutro.

## Asume Node (a mover a `nucleo/recetas/node-pnpm.md`)
- `skills/preparar-proyecto/SKILL.md`, §2 punto 1: «`npm ci`, `pnpm install --frozen-lockfile`».
- Mismo archivo, §2 «Reglas de diseño»: declarar en `package.json` lo que el código importa; ejemplo `express` vía el adaptador de NestJS; regla ESLint `import/no-extraneous-dependencies`.
- `agentes/principal.md`, paso 5 «Mejora sugerida»: «Docker, Compose o Playwright».

## Asume una herramienta, aunque no sea Node (no entra en el grep pedido)
- Docker/Compose, Postgres y Mailpit: `preparar-proyecto` §2 y §3b, `skills/preparar-proyecto/referencia.md` (esqueleto completo de `verify`), `planificar-cambio` regla 13 y `ejecutar-plan` (Nivel 2 = «Docker con caché»).
- «Tipos, lint y tests unitarios del host» en `Comprobación rápida` (plantilla de `AGENTS.md`): supone un lenguaje tipado.

## Ya neutro
- `agentes/constructor.md`, `skills/definir-proyecto`, `migrar-proyecto`, `disenar-experiencia`: sin herramientas.
- `docs/practicas-por-tecnologia.md` nombra pnpm y Playwright, pero es un documento de prácticas, no `agentes/` ni `skills/`.

## Correspondencia con lo que ya existe
| Capacidad nueva | Hoy |
|---|---|
| rápida | Nivel 1, línea `Comprobación rápida:` |
| servicio | no existe como escalón propio |
| aceptación | `verify-flujo` dentro de Nivel 2/3 |
| evidencia | no existe; hay `Árbol: <12 hex>` en la evidencia del plan (`cambios/proceso-rapido`) |

## Riesgos
1. `instalar.sh` no instala `nucleo/` ni `docs/`: en un proyecto instalado, la ruta `nucleo/contrato/verificacion.md` solo existe en el repo del kit. Mismo caso que `docs/practicas-por-tecnologia.md`, ya citada por `principal.md`.
2. Planes abiertos que tocan los mismos archivos: `cambios/verificacion-general` (borrador; `preparar-proyecto`, reconoce npm/pnpm/yarn/pip en un auditor) y `cambios/proceso-rapido` (borrador; `ejecutar-plan`, `principal.md`, `preparar-proyecto`).
