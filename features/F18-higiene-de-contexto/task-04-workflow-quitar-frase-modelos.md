# task-04 — Quitar de `WORKFLOW.md` §2 la frase sobre `modelos.json`
repo: Flucastr.AI   depende_de: —   estado: borrador

## Descripción
Quitar de `definitions/WORKFLOW.md` §2 (línea 22) la frase «Cada rol configura su nivel de modelo en `modelos.json`, a elección de Franco (inicialmente `planificador` en medio).», equivalente a la que task-03 quita de los agentes. Solo se acepta si el archivo queda en o bajo 30.720 caracteres.

## Contexto
- Leído: `definitions/WORKFLOW.md:22`: «Ramas, refinado y modo yolo: §9. Todos: sin leer `.env`, llaves ni credenciales. Cada rol configura su nivel de modelo en `modelos.json`, a elección de Franco (inicialmente `planificador` en medio).».
- Medido: `wc -m definitions/WORKFLOW.md` → 30679 (tope informativo 30.720, `DEFINICION_INFORMATIVO` en `scripts/archivar.mjs:24`). Quitar texto solo reduce el tamaño, así que la condición del backlog se cumple.
- `WORKFLOW.md` §7 de modelos por agente (línea ~161, «Modelo por agente (F07)») sigue explicando `modelos.json`; no se toca.
- Ningún comprobador exige la frase (`grep -rn "inicialmente" pruebas scripts` sin coincidencias relevantes).
- Es documentación de Franco aprobada; la edición está cubierta por el alcance de F18 aprobado el 2026-10-31 (BACKLOG, «Alcance de F18», punto 4).

## Decisiones ya tomadas
- Se borra solo la frase (desde «Cada rol configura» hasta «en medio).») y el espacio previo; el resto de la línea 22 queda igual.
- Si tras el cambio `wc -m` > 30720 (no puede pasar, pero se comprueba), no se aplica y la tarea queda `bloqueada`.

## Alcance / Fuera de alcance
Alcance: esa frase.
Fuera de alcance: cualquier otro cambio en `WORKFLOW.md`, `definitions/STATUS.md`, §7, agentes.

## Pasos
1. Editar `definitions/WORKFLOW.md` quitando la frase. Resultado: la línea 22 termina en «credenciales.».
2. Medir y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. `grep -n "Cada rol configura" definitions/WORKFLOW.md` sin salida.
2. `wc -m definitions/WORKFLOW.md` ≤ 30720.
3. `git diff --stat definitions/WORKFLOW.md` muestra la línea 22 como único cambio introducido por esta tarea.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -n "Cada rol configura" definitions/WORKFLOW.md
wc -m definitions/WORKFLOW.md
node --test pruebas/comprobaciones/formato-flujo.test.mjs
```
Esperado: sin salida del `grep`; un número ≤ 30720; `fail 0` (`formato-flujo.test.mjs` existe, no ejecutado tras el cambio).

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
