---
estado: listo
rama: feature/probar-revisor-luna
base: main
repos: [.]
ejecutor: constructor
tramo: 2
tipo: codigo
---
# Probar a Luna como revisor de `kit run` con defectos sembrados

## Objetivo
Decidir con datos si un revisor `gpt-6-luna` detecta lo mismo que `gpt-6.1-sol` a una fracción del costo (A4 medido: razón 6,6; `docs/investigaciones/a4-costo-revisor.md`). **No se crea ningún agente nuevo**: se compara el mismo rol (revisor) con dos modelos. Si Luna rinde, un plan posterior solo añadirá una opción de configuración (p. ej. `kit_run.revisor_agente` en `modelos.json`), no un agente.

## Supuestos
- Condiciones: **S** = Sol `low` (la actual del revisor); **L1** = Luna `low`; **L2** = Luna `medium`. Mismo prompt del revisor que `scripts/kit-run.mjs` (leer sus funciones de prompt y de esquema; no editarlas), mismo `--output-schema`, `--sandbox read-only`, `-C` raíz del repo.
- 12 casos fijos: 6 con un defecto sembrado y 6 limpios (control de falsas alarmas). Entre los sembrados, el defecto **real** del piloto (una guía que dice que cada causa de relanzamiento tiene su propio cupo de 2, cuando el contador es compartido), 2 más de documentación y 3 de código (borde sin cubrir, criterio de Aceptación incumplido, archivo fuera del Alcance).
- Cada caso trae `plan.md`, `diff.patch`, `evidencia.txt` y `oracle.json` (`{"defecto": true|false, "palabras": ["…"]}`). Se acierta si el veredicto coincide y, en los sembrados, los defectos devueltos contienen alguna de las palabras clave. Sin LLM-juez.
- Presupuesto: tope **20 créditos** en total (cota: Sol ≈1,3 por caso). El runner suma los créditos de cada corrida con `scripts/tarifas.json` y se detiene al pasar el tope. Es reanudable: escribe una línea por corrida en `resultados.jsonl` y salta las ya hechas.
- Regla de decisión **fijada de antemano**: Luna se considera viable si detecta ≥ (los defectos que detecta Sol − 1), tiene ≤ (las falsas alarmas de Sol + 1) y su costo medio por caso es ≤ 25 % del de Sol. Con menos casos de los esperados la conclusión es «no concluyente», no «sí».
- Los fixtures se escriben a mano en archivos; no tocan el repo del producto. El runner no corre con `./verify`.

## Alcance
`pruebas/revisor-luna/` (nuevo: `casos/<id>/…`, `medir.mjs`, `resultados.jsonl`), `docs/investigaciones/revisor-luna.md` (nuevo, ≤ 60 líneas). `.gitignore` (solo la excepción `!pruebas/revisor-luna/`, porque `pruebas/*` está ignorado y el tramo 1 no se podría commitear). Fuera: `scripts/kit-run.mjs`, `modelos.json`, `agentes/`, `verify`, todo lo demás.

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| R1 | 12 casos con oráculo | `ls pruebas/revisor-luna/casos \| wc -l` y 6 con `"defecto": true` | 12 casos, 6 sembrados |
| R2 | El runner funciona sin red | `node pruebas/revisor-luna/medir.mjs --autoprueba` | con un `codex` falso en el PATH, procesa 2 casos × 3 condiciones y el tope de créditos corta |
| R3 | Datos completos | `wc -l pruebas/revisor-luna/resultados.jsonl` | 36 líneas (o menos si el tope cortó, y entonces queda dicho) |
| R4 | El informe aplica la regla fijada | leer `docs/investigaciones/revisor-luna.md` | tabla por condición (detectados, falsas alarmas, créditos medios) y veredicto según la regla |
| R5 | No se tocó nada fuera del Alcance | `git status --short` | solo `pruebas/revisor-luna/`, el informe y el plan |

## Verificación
`node pruebas/revisor-luna/medir.mjs --autoprueba && ./verify`

## Pasos
### Tramo 1 — Fixtures y runner (offline)
Resultado: 12 casos y un runner probado con un `codex` falso; sin gasto.
Archivos: `pruebas/revisor-luna/`.
- [x] Escribir los 12 casos (R1). Los diffs deben ser realistas y cortos (≤ 60 líneas); los sembrados, con un defecto claro pero no ruidoso.
  - evidencia: `pruebas/revisor-luna/casos/c01` … `c12`, cada uno con `plan.md`, `diff.patch`, `evidencia.txt`, `oracle.json`. `ls pruebas/revisor-luna/casos | wc -l` = 12; `"defecto": true` en 6 (c01–c06).
- [x] `medir.mjs` con `--autoprueba`, `--condicion S|L1|L2`, `--tope-creditos <n>`; extrae del rollout el **último** evento `token_count` con `info` (total acumulado de la sesión, como `scripts/uso.mjs`) y calcula créditos (R2).
  - evidencia: `pruebas/revisor-luna/medir.mjs` creado; `node pruebas/revisor-luna/medir.mjs --autoprueba` con codex falso: 4 filas (c01 S, c01 L1, c01 L2, c02 S), tope cortó antes de c02 L1, primera fila 0.655 (último token_count), `AUTOPRUEBA OK`, exit 0. `--condicion constructor` sale con exit 2.
Verificación del tramo: `node pruebas/revisor-luna/medir.mjs --autoprueba`.

### Tramo 2 — Corridas e informe (con gasto real)
Resultado: las 36 corridas hechas y el informe con el veredicto.
Archivos: `pruebas/revisor-luna/resultados.jsonl`, `docs/investigaciones/revisor-luna.md`.
- [x] Añadir `!pruebas/revisor-luna/` a `.gitignore` (junto a las otras excepciones) y comprobar con `git check-ignore` que `medir.mjs`, `casos/` y `resultados.jsonl` ya no se ignoran (R5).
  - evidencia: `.gitignore` con la línea `!pruebas/revisor-luna/`; `git check-ignore -v` sobre `pruebas/revisor-luna/medir.mjs`, `pruebas/revisor-luna/casos/c01/plan.md` y `pruebas/revisor-luna/resultados.jsonl` sale con exit 1 (no ignorados).
- [x] Correr S, L1 y L2 sobre los 12 casos, en tandas (el runner es reanudable); sin repetir corridas hechas (R3).
  - evidencia: `resultados.jsonl` con 39 líneas: S 12 (deduplicadas), L1 12, L2 12, y 3 de S con `costo_limpio: true` (c01, c07, c11). Las 36 del plan más esas 3. Gasto acumulado del runner 17,94 créditos, bajo el tope 25,01. Hubo un error mío: lancé dos procesos de S en paralelo antes (ver Notas del tramo 2 y la decisión del principal); el paso 4 de la decisión del principal se ejecutó tal cual.
- [x] Escribir el informe con la tabla y el veredicto de la regla fijada; marcar medido/estimado/opinión (R4).
  - evidencia: `docs/investigaciones/revisor-luna.md` (41 líneas): tabla por condición, regla aplicada (L1 viable, L2 no), gasto y limitaciones.
Verificación del tramo: `./verify`.

## Notas
- Pausa en el paso 2 del Tramo 1 (`motivo=diseño`), sin escribir `medir.mjs`. El paso pide extraer «el primer evento `token_count`» del rollout. Eso subestima el coste: `total_token_usage` es acumulado por sesión (`scripts/uso.mjs` toma el último). En un rollout real de `~/.codex/sessions/2026/11/01/rollout-2026-11-01T18-39-49-….jsonl`, el primer evento marca 14.626 tokens totales y el cuarto, 73.406. Con el primero, Sol quedaría subestimado y la razón de costo de la regla fijada, mal medida.
- Los 12 casos sí están hechos (paso 1 del Tramo 1); no se corrió Codex ni hubo gasto.
- Relanzamiento (Tramo 1, paso 2): aplicada la decisión del principal. El coste sale del último `token_count` con `info` de cada rollout nuevo; la autoprueba comprueba que la primera fila vale 0,655 (Sol con el último evento), no la del primero. Los casos c01–c12 no se tocaron.
- `pruebas/*` está en `.gitignore` (línea 2): `git status --short` no muestra `pruebas/revisor-luna/`, ni los casos ni `medir.mjs`. El R5 se comprueba con `ls`, no con `git status`. No toqué `.gitignore` (fuera de Alcance); decisión del principal si quiere una excepción para esta carpeta.
- Resultados de la autoprueba en una carpeta temporal: `pruebas/revisor-luna/resultados.jsonl` no existe todavía y no se creó; el tramo 2 lo creará.

- Tramo 2, PAUSA (2026-11-10): lancé dos veces `medir.mjs --condicion S` (un background y luego uno en primer plano) por error mío: el segundo no esperó al primero. Cada proceso aplica el tope por separado, así que `resultados.jsonl` tiene 24 filas de S (c01–c12 dos veces), con 9 filas con aviso «sin token_count con info». Gasto estimado por el runner: 32,95 créditos, por encima del tope de 20. No corrí L1 ni L2. No borré ni deduplicé `resultados.jsonl` (decisión del principal). El paso 2 del Tramo 2 queda sin marcar; el paso 1 sí está hecho (`.gitignore`, check-ignore exit 1).
- Resultado parcial de S (sin deduplicar, para el principal): veredicto DEVUELTO en c01–c06 (sembrados, acierto) y c11 (limpio, falsa alarma en ambas filas); APROBADO en c07–c10 y c12 (acierto). Con 24 filas no se puede concluir la regla fijada.
- Opciones para el principal: (1) (recomendada) dedupe a mano de `resultados.jsonl` conservando una fila por caso (la de `creditos` con `token_count` válido) y decidir si se gasta el resto con tope nuevo; (2) aceptar el gasto real y cerrar el informe como «no concluyente» con solo S; (3) borrar `resultados.jsonl` y rehacer S con un solo proceso y tope nuevo, lo que gastaría otra vez ~17 créditos.

## Decisión del principal (2026-11-10)
El coste de cada corrida se toma del **último** `token_count` con `info` (opción 1): `total_token_usage` es acumulado por sesión y el primer evento subestima una revisión de varias llamadas. Cada corrida se aísla por su rollout nuevo. Los casos c01–c12 ya hechos se conservan. Relanzar el paso 2 del tramo 1.

## Decisión del principal (2026-11-10, tras la PAUSA del tramo 2)
Franco aprobó **≈8 créditos más, tope 10** (el gasto total ya supera el tope original de 20: ≈33 por dos procesos de Sol en paralelo). Reglas:
1. **Nunca dos procesos de `medir.mjs` a la vez.** Un proceso, en primer plano o uno solo en segundo plano; esperar a que termine antes de lanzar otro. Antes de lanzar, comprobar con `pgrep -f medir.mjs` que no hay otro.
2. **Deduplicar `resultados.jsonl` de S:** conservar una fila por caso (la primera). La detección es idéntica en ambas pasadas (DEVUELTO en c01–c06 y c11; APROBADO en c07–c10 y c12). Anotar que los **costos de esas filas no son fiables** (rollouts de dos procesos mezclados, de 0,27 a 2,0) y no usarlos para la regla.
3. Correr **L1 y L2** sobre los 12 casos, una condición a la vez. Tope nuevo: (gasto actual de las filas conservadas + 10). Si el runner no lo permite, usar `--tope-creditos` con ese valor.
4. **Costo de Sol:** correr S en serie solo sobre c01, c07 y c11, como filas de la condición `S` marcadas aparte (campo `costo_limpio: true`), y usar su media como costo de Sol para la regla del 25 %. Si no cuadra el tope, PAUSA.
5. Escribir el informe `docs/investigaciones/revisor-luna.md` (R4) con la regla fijada; la detección de Sol viene de las 12 filas deduplicadas, su costo de las 3 limpias, y declarar que S gastó más de lo previsto por el error de paralelismo.
- Tramo 2, relanzamiento (2026-11-10): deduplicado `resultados.jsonl` (copia previa en la carpeta de scratchpad de la sesión). Se añadió a `medir.mjs` `--casos <ids>` y `--costo-limpio` (filas aparte, `costo_limpio: true`, clave de corrida con esa marca); no cambia la autoprueba. Clase de costo limpio de S: c01 0,2856, c07 1,0134, c11 0,4222 (media 0,574).
- Un intento de la guarda con `pgrep -f medir.mjs` se bloqueó a sí mismo (el propio shell contiene la ruta); no se lanzó nada. Las guardas usan `pgrep -f "^node .*medir.mjs"`.
- Resultado: S detecta 6/6 sembrados y falla 1 limpio (c11); L1 detecta 5/6 y falla 1 limpio (c12); L2 detecta 4/6 y falla 1 limpio (c11). Regla fijada: L1 viable, L2 no. Detalle en `docs/investigaciones/revisor-luna.md`.
- R3: 39 líneas, no 36: las 36 del plan más las 3 de costo limpio de S, que se declararon.
- Autoprueba y `./verify`: `node pruebas/revisor-luna/medir.mjs --autoprueba && ./verify`, exit 0 (VERIFY OK).
