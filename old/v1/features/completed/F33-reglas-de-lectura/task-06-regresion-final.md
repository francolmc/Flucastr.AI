# task-06 — Regresión final de F33: contrato, manifiesto, topes y rápida
repo: Flucastr.AI   depende_de: task-01, task-05   estado: hecha

## Descripción
Cierre de F33 sin cambios de código: se comprueba que ningún tope de bytes subió, que el contrato y el manifiesto pasan y que `pruebas/rapida.sh` no empeora respecto a su base (la línea `Base rápida:` que anotó task-01 en sus *Notas*).

## Contexto
- Tocar: `features/F33-reglas-de-lectura/task-06-regresion-final.md`
- Lee solo las *Notas* de `task-01` (línea `Base rápida:`) y las de `task-05` (tamaño del `coordinador`). Las demás tareas de F33 no se releen.
- `pruebas/rapida.sh` (confirmado) corre por glob todas las `pruebas/comprobaciones/*.test.mjs`, `pruebas/*.test.mjs` y tres de `pruebas/capa1/`,; con `set -euo pipefail` sale 1 antes de imprimir la línea de segundos si `node --test` tiene fallos. Hoy hay 7 fallos preexistentes ajenos a F33 (fila F26 del BACKLOG y 6 de WORKFLOW.md/higiene de contexto).
- Topes (confirmado): `agentes/coordinador.md` 7168, `planificador.md` 3584, `arquitecto.md` 3584, `constructor.md` 3072, `skills/lectura-extra/SKILL.md` 5120 en `pruebas/comprobaciones/topes-bytes.test.mjs`.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «Cambios en pruebas y documentos»

## Decisiones ya tomadas
- «No empeora» significa, con la base real de hoy (`ℹ tests 551`, `ℹ pass 544`, `ℹ fail 7`): `fail` es 7 o menos, los títulos de las que fallan son los 7 de la base y no hay ninguno nuevo; las pruebas totales igualan o superan 551. No se exige la línea de segundos ni que `rapida.sh` salga 0. Si F30 corrigió alguno de los fallos de la base, mejorar es válido.
- Los tamaños se comparan con los topes tal cual están; si alguno no cabe, se devuelve `bloqueada` con el archivo y los bytes. No se sube ningún tope ni se recorta nada en esta tarea.
- La *Evidencia* lleva solo tamaños, conteos y títulos de fallos, sin pegar salidas largas.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: correr las verificaciones y registrar la evidencia.
Fuera de alcance: cualquier edición de agentes, skills, pruebas o scripts; arreglar fallos preexistentes; `definitions/` (`CONTRATOS.md` y `CONTEXTO.md` quedan para la puerta 1); medición real en Cleaner (F34).

## Pasos
1. Lee la línea `Base rápida:` en las *Notas* de `task-01`.
2. Corre los cuatro comandos de *Verificación*, uno por uno, y pega cada uno en *Evidencia* con su salida.
3. Compara la rápida contra la base según *Decisiones ya tomadas* y anota el veredicto en *Notas* (`Rápida: mejora | igual | empeora`).
4. Si algo empeora, deja la tarea `bloqueada` con el motivo; no corrijas.

## Criterios de aceptación
1. Los cinco archivos con tope miden como máximo su tope; se comprueba con `topes-bytes.test.mjs` (`fail 0`).
2. Contrato, manifiesto, `lectura-extra` y README pasan; se comprueba con `node --test` de los cuatro archivos.
3. La rápida da `ℹ fail 7` con los 7 títulos de la base y ningún título nuevo; se comprueba con el bloque `ℹ` y la lista `✖`. No se exige la línea de segundos ni que `rapida.sh` salga 0.
4. Los topes de `topes-bytes.test.mjs` son los de hoy más el de `lectura-extra`; se comprueba con `grep -c`.

## Verificación
```
node --test pruebas/comprobaciones/topes-bytes.test.mjs
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/lectura-extra.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs
bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)|^✖"
grep -c "tope: 7168\|tope: 3584\|tope: 3072\|tope: 5120\|tope: 4096" pruebas/comprobaciones/topes-bytes.test.mjs
```
Esperado: `ℹ fail 0`; `ℹ fail 0`; la rápida con `ℹ fail 7`, los 7 títulos de la base y ningún título nuevo; el último comando da `9`.
El código de salida de `rapida.sh` será 1 mientras existan los 7 fallos preexistentes (la Verificación lo oculta con el pipe a `grep`); no es motivo de bloqueo.

## Evidencia

Pasada 1 (única de esta ejecución, `intentos=1`). Salidas reales; las líneas ✔ de `node --test` se recortan.

```
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs
[…recortado: 19 líneas ✔…]
ℹ tests 19
ℹ suites 0
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 103.872417
exit 0

$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/lectura-extra.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs
[…recortado: 133 líneas ✔…]
ℹ tests 133
ℹ suites 0
ℹ pass 133
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 135.762875
exit 0

$ bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)|^✖"
✖ definitions/BACKLOG.md real cumple el formato (1.242042ms)
✖ los archivos reales cumplen la regla (5.377875ms)
✖ falla si un agente conserva la línea de modelos.json (1.72575ms)
✖ falla si falta la lectura acotada en constructor (0.94125ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (0.415125ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (0.346875ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (0.993917ms)
ℹ tests 551
ℹ pass 544
ℹ fail 7
✖ failing tests:
[…recortado: 7 líneas repetidas de ✖ con los mismos títulos…]
exit 0
```
Código de `grep` del pipeline; el de `rapida.sh` está en la corrida extra.

Extra, fuera de la Verificación (sin pipe, para el código real de `rapida.sh`):
```
$ bash pruebas/rapida.sh
[…recortado: salida de node --test; se conservan solo las líneas ℹ tests/pass/fail y ✖ de arriba…]
ℹ tests 551
ℹ pass 544
ℹ fail 7
exit 1
```

```
$ grep -c "tope: 7168\|tope: 3584\|tope: 3072\|tope: 5120\|tope: 4096" pruebas/comprobaciones/topes-bytes.test.mjs
9
exit 0
```

Tamaños con `wc -c` frente a los topes: `agentes/coordinador.md` 7088 / 7168; `agentes/planificador.md` 3576 / 3584; `agentes/arquitecto.md` 3583 / 3584; `agentes/constructor.md` 3008 / 3072; `skills/lectura-extra/SKILL.md` 925 / 5120. Ninguno supera su tope.

## Notas
- Corrida nueva tras la corrección del criterio 3 por el planificador. Base de la rápida (coordinador): tests=551; pass=544; fail=7. Rápida: igual (fail 7 con los 7 títulos de la base; ningún título nuevo; tests 551).
- El criterio 3 no exige segundos ni salida 0 de `rapida.sh`: sale 1 mientras existan los 7 fallos conocidos. El pipe de la Verificación da el código de `grep` (0); el código real (1) va en la corrida extra de *Evidencia*.
- Criterios 1, 2, 3 y 4 cumplidos en la pasada 1: topes sin cambios (9 coincidencias), contrato/manifiesto/lectura-extra/README 133 de 133, tamaños bajo tope (`coordinador` 7088 / 7168).
- Modo yolo: sin rama, sin `git switch`, sin commit; el trabajo queda en `feature/F33-reglas-de-lectura`. No se escribió en `definitions/STATUS.md`.
- Huecos: 1 (el pipe de la Verificación oculta el código de `rapida.sh`; cubierto con la corrida extra).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=falla; huecos=1; resultado=bloqueada; causa=verificacion_x2
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
