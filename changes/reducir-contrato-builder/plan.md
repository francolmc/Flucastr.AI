---
status: draft
branch: chore/reducir-contrato-builder
base: main
repos: [.]
executor: builder
type: code
---
# Reducir y unificar el contrato del builder

## Goal
Que el builder reciba cada regla una sola vez y sin contradicciones, sin perder ninguna restricción de seguridad.

## Exploration
- Inventario: [inventario.md](inventario.md). 82 reglas, 51 duplicadas, 24 en 12 casos de contradicción o tensión, 17 cubiertas solo en parte por herramientas o hook.
- Tamaño de partida (`wc -c`): `core/agents/builder.md` 5470 bytes (43 líneas); `core/skills/execute-plan/SKILL.md` 10397 bytes (98 líneas); total 15867.
- Verificado en las fuentes: C1 (builder 24 / skill 13), C2 (skill 79-84 frente a 28 y 32), C3 (skill 32 y builder 23 frente a skill 71), C4 (skill 40 / builder 28), C6 (skill 76 frente a 77 y builder 43).
- Las pruebas exigen frases literales en cada archivo (inventario §1): mover una regla de archivo obliga a actualizar su prueba.
- `scripts/kit-run.mjs` línea 236 extrae `motivo=` de forma genérica.
- Sin saber: si la duplicación causó detenciones reales (no probado, `docs/investigaciones/fiabilidad-constructor.md` línea 108); si las tres herramientas cargan siempre la skill declarada.

### Preguntas de comportamiento
Pendientes: motivo de pausa (C2), límite de fallas (C3), interrupción (C6) y reparto entre archivos.

## Evaluation
- A. Solo corregir contradicciones: riesgo bajo, reducción mínima; quedan las duplicadas.
- B. Una sola ubicación por regla: `builder.md` con identidad, límites de seguridad y retorno; la skill con el procedimiento. Reduce duplicación; obliga a mover aserciones en las pruebas. Recomendada: los límites de seguridad siguen en el texto que siempre se carga.
- C. Fundir todo en un archivo: mayor reducción; depende de cómo carga cada herramienta y rompe más pruebas.

## Assumptions
- Ninguna regla de seguridad (R10, R14-R17, R26, R40-R43) se quita ni se debilita, y la cobertura por herramientas no autoriza a quitar texto.
- C1: se prohíbe `git -C` y `git -c` siempre (opción estricta); si se quiere permitir lectura con `-C`, cambian las reglas de Codex y dos pruebas.
- C4: leer una vez, con relectura permitida tras editar o recuperarse; si no, cambia la frase exigida en `operating-contract.sh`.
- C5, C7, C9-C12: se corrigen solo en la redacción, sin cambiar comportamiento; si alguna debe cambiarlo, vuelve a Exploración.
- C8: el punto de control por tramo queda como hoy en `builder.md` (solo en continuidad); si se quiere siempre, cambia la skill y un criterio.
- C13 (`.env.example` alcanzado por hook y deny) queda fuera: tocar herramientas de permisos sería otro cambio.
- Sin meta numérica de reducción: se mide bytes antes y después; si se quiere una meta, se agrega un criterio.
- Las frases exigidas por pruebas que cambien de archivo se mueven con su aserción, sin debilitarla.

## Decisions already taken
- Primer paso de solo inventario: hecho.
- Executor: builder, porque no es un cambio pequeño y toca el contrato y sus pruebas.

## Decisions

## Validation
Pendiente.

## Scope
Pendiente de la validación. Repositorio único (`.`).

## Verification
`./verify`

## Steps
Sin historias hasta cerrar las preguntas de comportamiento.

## Evidence

## Notes
