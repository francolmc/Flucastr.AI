---
status: done
branch: feature/escalera-recuperacion
base: main
repos: [.]
executor: builder
segment: 6
type: code
---
# Escalera de recuperación del builder

## Goal
Cuando el builder no termina, el kit toma la salida más barata que funcione. El relevo del planner es el último paso y exige respuesta explícita de la persona.

## Exploration
- Cifras en `pausas.md`: 87 detenciones; infraestructura 9, entorno 10, plan 40, decisión 8, tarea 16, sin causa 4. Devoluciones de revisión aparte: 54.
- No hay `runs.jsonl` reales. Thrashing local: 7 eventos, todos del planner.
- `scripts/kit-run.mjs` junta toda falla del builder en `PAUSED motivo=access` sin relanzar; solo lanza Codex.
- Override por corrida existente: `FLUCASTR_MODELOS` (`tools/model-resolution/models.mjs`).
- La cifra 6,6 de A4 mide el revisor contra el builder, no un relevo: no se usa como costo del relevo.
- La oferta de relevo está en `core/references/planner/paused-and-interrupted.md`; `planner.md` mide 8191 de 8192 bytes.

## Evaluation
Beneficio: 25 de 87 casos (infraestructura 9, tarea 16) tienen salida barata automática o guiada; 58 (entorno, plan, decisión) vuelven con diagnóstico sin gastar corridas; 4 sin causa irían como entorno. Costo: 6 tramos. Riesgo: clasificar mal una falla; ante duda se devuelve a la persona. Recomendación: hacer. El mayor volumen es «plan» (46 %): prevenirlo queda fuera.

## Assumptions
- Escalera agotada (sin cupo y con al menos una falla de tarea): `kit run` sin `--paso` sale con 2 sin tocar el plan y dice las salidas (`--paso 3`, o apartar `runs.jsonl`). Con el cupo gastado solo por infraestructura sí corre, sin relanzar.
- Aviso residual de `review-plan` en `plan.md` (6 tramos sin `continuity`): son historias distintas y se revisan una a una.
- Infraestructura = thrashing, `invalid_request` o corte por tope del builder o del revisor. Límite de uso y errores de red son entorno; si se quieren como infraestructura, cambia A1.
- Los patrones de infraestructura solo se aplican al proceso que murió, nunca a la salida de la verificación.
- Corte por tope de la verificación y señales 137/143, disco lleno, Docker o navegador ausente: entorno.
- Falla del builder sin patrón conocido: entorno (vuelve a la persona).
- `PAUSED` del builder: `ambiguous`/`design` = decisión; `scope` o desconocido = plan; `access` = entorno; `verify` = tarea.
- Puerta mecánica y `RETURNED` son tarea. El corte por «pegado» conserva su conducta actual (no relanza).
- Reintentar el revisor por infraestructura no relanza al builder.
- Consejo ≤ 500 tokens se comprueba como ≤ 2000 caracteres.

## Decisions already taken
- Resuelto: no cambiar motivos de `PAUSED` ni editar `models.json`.
- Resuelto: relevo solo con respuesta explícita y estimación comparada.
- Resuelto: sin commit ni push.

## Decisions
Resuelto: aprobadas el 2026-11-26 en su opción principal; las alternativas quedan descartadas.
- D1 (límite): siguen 2 relanzamientos por tramo. El paso 3 sería un tercero: solo con tu sí en cada caso (`--paso 3`). Alternativas: subir el límite a 3 automático, o no tener paso 3.
- D2 (consejo): tras la segunda falla de tarea `kit run` se detiene; el planner vivo escribe el consejo y relanza. Alternativa: `kit run` lanza un planner en frío (sin pausa, una llamada más).
- D3 (infraestructura): consume el mismo límite de 2 y no avanza de paso. Alternativa: contador propio (cambia el límite).
- D4 (estimación): `scripts/rates.json` no tiene tarifas de `gpt-6.1-terra` ni de Claude; se informa «sin tarifa». Alternativa: tú entregas esas tarifas y se agregan.
- D5 (pruebas): se editan casos existentes C2, R1 (campos), A2, A3d, A6, M1, `puerta-fuera-de-alcance` y `puerta-tercer-fallo`, porque describen la conducta que cambia.

## Validation
Aprobado por la persona el 2026-11-26 («apruebo»), con D1–D5 como están recomendadas.

## Scope
- `tools/run/{clasificar,escalera,handoff,nivel,estimar,informe}.mjs`
- `scripts/kit-run.mjs`, `scripts/kit-escalera.mjs`, `tools/verify/usage-and-run.sh`
- `tests/escalera/`
- `tests/kit-run/run.mjs`: solo los casos de D5. `tests/progress/run.mjs` y `tests/runs-report/run.mjs`: solo expectativas que cambien por la escalera o el motivo `infra`; se anota cada una en Notes.
- `core/agents/planner.md`, `core/references/planner/paused-and-interrupted.md`, `docs/kit-run.md`, `docs/como-funciona.md`
- Fuera: `models.json`, `core/agents/builder.md`, motivos de `PAUSED`, mapear Claude o Pi en `kit run`.

## Verification
`./verify` — nivel 3, sin caché; exit 0 y `VERIFY OK` (≈3 min).

## Stop conditions
- Un caso de prueba existente fuera de D5 y de Scope necesita cambiar.
- Se requiere un motivo de `PAUSED` nuevo o editar `models.json`.
- La misma comprobación falla dos veces por la misma causa.

## Steps
Un tramo por corrida, en orden:
1. `tramo-1.md` — clasificar la falla.
2. `tramo-2.md` — paso 0 en `kit run`.
3. `tramo-3.md` — pasos 1 y 2.
4. `tramo-4.md` — pasos 3 y 4.
5. `tramo-5.md` — escalera para el flujo por subagente.
6. `tramo-6.md` — planner y documentación.

## Evidence
Cada tramo la guarda en su `tramo-N.md`.
## Notes
- Tramo 1 APPROVED; cambios sin commit: `tools/run/clasificar.mjs`, `tests/escalera/`, `tools/verify/usage-and-run.sh`.
- Devuelto: defecto — tramo 1 — tools/run/clasificar.mjs:59, A1: una falla de verificación (tarea) informa la señal `invalid_request`, propia de infraestructura, por un caso especial no pedido; ensuciaría el diagnóstico. La señal debe ser `verify`. Relanzamiento 1 de 2.
- Devuelto: defecto — tramo 2 — scripts/kit-run.mjs (veredicto inválido del revisor y revisor que modifica el árbol), A3: el veredicto inválido se registra como `tarea` (no es falla del builder y subiría la escalera) y el árbol modificado deja una línea PAUSED con `clase` null; ambos deben ser `entorno` con diagnóstico. Relanzamiento 1 de 2.
- Tramo 2 APPROVED (corrida propia: paso0 11/11, kit-run 50, runs-report 7).
- Tramo 3 checkpoint: pasos 1 y 2 en `scripts/kit-run.mjs`, `tools/run/handoff.mjs` (nuevo), `tools/run/escalera.mjs`; `tests/escalera/pasos12.test.mjs` (6/6). D5 en `tests/kit-run/run.mjs`: A2, A3d, A6, `puerta-fuera-de-alcance`, `puerta-tercer-fallo` pasan de 3 a 2 corridas del builder; M1 comprueba la nota. Sin cambios en `tests/progress` ni `tests/runs-report`. Verificación del segmento: exit 0 (escalera 44/44, kit-run 50, progress 44).
- Devuelto: omision — tramo 3 — scripts/kit-run.mjs (rama PAUSED), A4: `motivo=verify` del builder no entra en la escalera. Además `pideConsejo` exige `usados===1` y descarta el consejo si hay 2 fallas con 0 usados (A5), y con cupo gastado solo por infra se niega a correr. Relanzamiento 1 de 2.
- Tramo 3 APPROVED (corrida propia: escalera 49/49, kit-run 50, progress 44).
- Tramo 4 checkpoint: pasos 3 y 4 en `scripts/kit-run.mjs`, `tools/run/nivel.mjs` y `tools/run/estimar.mjs` (nuevos); `tests/escalera/pasos34.test.mjs` (16/16). Verificación del segmento: exit 0 (escalera 65/65, kit-run 50). `models.json` sin cambios.
- Devuelto: defecto — tramo 4 — scripts/kit-run.mjs:498, A3/A7: la nota `paso 4` (pregunta de relevo) se escribe aunque el paso 3 termine por entorno, plan, decisión o infraestructura; y esa corrida impide repetir `--paso 3`. Relanzamiento 1 de 2.
- Tramo 4 APPROVED (escalera 68/68, kit-run 50).
- Devuelto: defecto — tramo 5 — scripts/kit-escalera.mjs:99, A8: `--resuelto` no admite `--paso`, así que un paso 3 o un relevo exitoso queda con `resuelto_por` 2 o 3. Relanzamiento 1 de 2.
- Tramo 5 APPROVED (escalera 77/77, kit-run 50).
- Devuelto: defecto — tramo 6 — paused-and-interrupted.md y docs/kit-run.md, A9: mandan `--paso 3` en Pi (sin mapeo) y el comando omite `<kit-root>`, `--herramienta` y `--raiz`. Relanzamiento 1 de 2.
- Tramo 6 APPROVED; veredicto final en `revision.md`.
