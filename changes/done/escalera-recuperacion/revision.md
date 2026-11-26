# Revisión final (planner)

Veredicto: **APPROVED**. Compuerta 2: aprobado por la persona el 2026-11-26 («apruebo»), con los puntos de «Para tu decisión» como están. Cerrado.

## Evidencia
- `./verify` del builder: `VERIFY OK`, `Fingerprint: 6df8aac37cd4`; `node scripts/kit-verificado.mjs estado --nivel aceptacion` → exit 0.
- Corrida propia: `node --test tests/context-size/*.test.mjs tests/escalera/*.test.mjs` → 99/99; `git diff --check` limpio; `models.json` igual a HEAD.

## Criterios
| A# | Qué | Resultado |
|---|---|---|
| A1 | clasificación en cinco clases | cumple |
| A2 | infraestructura repite con el mismo modelo | cumple |
| A3 | entorno, plan y decisión vuelven con diagnóstico | cumple |
| A4 | paso 1 con handoff cronológico | cumple |
| A5 | paso 2 con consejo | cumple |
| A6 | paso 3 por una corrida | cumple en Codex; Pi sin mecanismo |
| A7 | estimación y pregunta de relevo | cumple |
| A8 | comando para el flujo por subagente | cumple |
| A9 | reglas del planner y documentación | cumple |

## Para tu decisión
1. Paso 3 en Pi: no hay mecanismo de un solo lanzamiento (`kit run` solo mapea Codex). Las reglas lo presentan como decisión tuya; mapear Pi sería otro cambio.
2. Supuesto agregado: con la escalera agotada, `kit run` sin `--paso 3` sale con 2 sin tocar el plan (alternativa: apartar `runs.jsonl`).
3. Ajuste a A6: `--paso 3` vale con la escalera agotada aunque la infraestructura haya gastado el cupo, y se puede repetir (con tu sí) si el anterior no falló por tarea.
4. En el flujo por subagente, `--resuelto --paso 4` registra el relevo; el consejo pendiente no deja línea.

## No probado
- Todo se probó con fixtures: ningún thrashing, `invalid_request` ni `runs.jsonl` real.
- Sin tarifa para `gpt-6.1-terra` ni modelos Claude en `scripts/rates.json` (D4).

## Proceso
- Los 6 tramos tuvieron una devolución cada uno (1 de 2). La del tramo 6 nació de un error de mi Handoff.
- Tramo 2: el builder escribió código antes del test (rojo comprobado después) y un hook le bloqueó un `rm -rf` de limpieza que no reintentó.

## Commit sugerido
`Add the builder recovery ladder to kit run and the planner rules`
