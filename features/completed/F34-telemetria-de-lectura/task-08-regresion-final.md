# task-08 — Regresión final de F34: rápida, topes y contratos sin empeorar
repo: Flucastr.AI   depende_de: task-07   estado: hecha

## Descripción
Cierre de F34 sin cambios de código: se comprueba que los topes de bytes no se movieron (F34 no toca agentes ni skills) y que `pruebas/rapida.sh` no empeora: 7 fallos preexistentes y 24 pruebas nuevas.

## Contexto
- Tocar: `features/F34-telemetria-de-lectura/task-08-regresion-final.md`
- Requiere: ninguno
- Lee solo las *Notas* de task-07.
- Base medida hoy (antes de F34): `bash pruebas/rapida.sh` sale 1 con `ℹ tests 658`, `ℹ pass 651`, `ℹ fail 7`. Sumas de F34: task-01 +5, task-02 +3, task-03 +3, task-04 +2, task-05 +6, task-06 +2, task-07 +3 = +24, es decir `ℹ tests 682`, `ℹ pass 675`.
- `pruebas/rapida.sh` sale 1 mientras existan los 7 fallos (`set -e` corta antes de su línea `rapida:`); no es motivo de bloqueo. Los títulos de los 7 fallos son los de la base de F33/task-06 (BACKLOG, regla de archivos reales, línea de modelos.json, lectura acotada en constructor y en ejecutar-tarea, y dos de `WORKFLOW.md`).
- Fuente: ninguna

## Decisiones ya tomadas
- «No empeora»: `ℹ fail` es 7 o menos, ningún título nuevo en la lista `✖`, `ℹ tests` ≥ 682. Si algún fallo preexistente se corrigió por otra vía, mejorar es válido.
- No se exige salida 0 de `rapida.sh`. No se sube ningún tope ni se corrige nada aquí.
- La *Evidencia* lleva solo conteos y títulos de fallos.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: correr las verificaciones y registrar la evidencia.
Fuera de alcance: editar scripts, pruebas, agentes o skills; arreglar fallos preexistentes; `definitions/` (`CONTEXTO.md` §6 queda para Franco); la medición real en Flucastr.Cleaner (pieza 9 del documento de diseño).

## Pasos
1. Corre los tres comandos de *Verificación*, uno por uno, y pégalos en *Evidencia*.
2. Compara con la base y anota `Rápida: mejora | igual | empeora` en *Notas*.
3. Si algo empeora, deja la tarea `bloqueada` con el motivo; no corrijas.

## Criterios de aceptación
1. Los topes de bytes siguen verdes; se comprueba con `topes-bytes.test.mjs` (`fail 0`).
2. Los seis archivos de F34 pasan juntos; se comprueba con `node --test`.
3. La rápida da `ℹ fail 7` sin títulos nuevos y `ℹ tests` ≥ 682; se comprueba con el bloque `ℹ` y la lista `✖`.

## Verificación
```
node --test pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E "^ℹ (tests|fail)"
node --test pruebas/comprobaciones/formato-encargo.test.mjs pruebas/comprobaciones/consumo.test.mjs pruebas/comprobaciones/informe-pistas-lectura.test.mjs pruebas/comprobaciones/informe-pistas.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs pruebas/comprobaciones/informe-lectura-cli.test.mjs 2>&1 | grep -E "^ℹ (tests|fail)"
bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)|^✖"
```
Esperado: `ℹ fail 0` (primer comando); `ℹ tests 102` y `ℹ fail 0` (13 + 62 + 6 + 12 + 6 + 3); la rápida con `ℹ fail 7`, `ℹ tests 682`, `ℹ pass 675` y los 7 títulos de la base.


## Evidencia

Pasada 1 y pasada 2 (idénticas en conteos y títulos).

$ node --test pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E "^ℹ (tests|fail)"
ℹ tests 23
ℹ fail 0
exit 0

$ node --test pruebas/comprobaciones/formato-encargo.test.mjs pruebas/comprobaciones/consumo.test.mjs pruebas/comprobaciones/informe-pistas-lectura.test.mjs pruebas/comprobaciones/informe-pistas.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs pruebas/comprobaciones/informe-lectura-cli.test.mjs 2>&1 | grep -E "^ℹ (tests|fail)"
ℹ tests 102
ℹ fail 0
exit 0

$ bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)|^✖"
ℹ tests 682
ℹ pass 674
ℹ fail 8
✖ definitions/BACKLOG.md real cumple el formato
✖ definitions/STATUS.md real cumple el formato
✖ los archivos reales cumplen la regla
✖ falla si un agente conserva la línea de modelos.json
✖ falla si falta la lectura acotada en constructor
✖ falla si falta la lectura acotada en ejecutar-tarea
✖ falla si WORKFLOW.md pasa de 30720 caracteres
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json
exit 1

## Notas
- Rápida: empeora. Base: `ℹ tests 658`, `ℹ pass 651`, `ℹ fail 7`. Medido: `ℹ tests 682` (cumple), `ℹ pass 674` (se esperaban 675), `ℹ fail 8` (se esperaban 7).
- Título nuevo: «definitions/STATUS.md real cumple el formato» (`pruebas/comprobaciones/formato-flujo.test.mjs:217`): «La línea «Presupuesto» tiene una forma inválida.». El archivo `definitions/STATUS.md` aparece `M` en git desde antes de F34 (lo escribe el coordinador). F34 no lo toca. Causa probable: la línea «Presupuesto» de ese archivo, no el código de F34.
- No se corrigió nada (fuera de alcance: `definitions/` y `pruebas/`). Tampoco se editó `STATUS.md`.
- Criterios: 1 cumple (topes-bytes `fail 0`); 2 cumple (102 tests, `fail 0`); 3 no cumple (`fail 8` y título nuevo).
- Huecos menores: 0.
- Bloqueo: la regresión viene de fuera de F34 (estado de `definitions/STATUS.md`). Franco decide si se corrige ese archivo o se acepta la base nueva.
Bloqueo: tipo=verificacion_x2; falta=-
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2
