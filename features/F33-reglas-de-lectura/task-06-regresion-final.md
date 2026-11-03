# task-06 — Regresión final de F33: contrato, manifiesto, topes y rápida
repo: Flucastr.AI   depende_de: task-01, task-05   estado: borrador

## Descripción
Cierre de F33 sin cambios de código: se comprueba que ningún tope de bytes subió, que el contrato y el manifiesto pasan y que `pruebas/rapida.sh` no empeora respecto a su base (la línea `Base rápida:` que anotó task-01 en sus *Notas*).

## Contexto
- Tocar: `features/F33-reglas-de-lectura/task-06-regresion-final.md`
- Lee solo las *Notas* de `task-01` (línea `Base rápida:`) y las de `task-05` (tamaño del `coordinador`). Las demás tareas de F33 no se releen.
- `pruebas/rapida.sh` (confirmado) corre por glob todas las `pruebas/comprobaciones/*.test.mjs`, `pruebas/*.test.mjs` y tres de `pruebas/capa1/`, y falla si supera `FLUCASTR_TOPE_RAPIDA` (30 s). Hoy hay fallos preexistentes ajenos a F33 (ver task-01).
- Topes (confirmado): `agentes/coordinador.md` 7168, `planificador.md` 3584, `arquitecto.md` 3584, `constructor.md` 3072, `skills/lectura-extra/SKILL.md` 5120 en `pruebas/comprobaciones/topes-bytes.test.mjs`.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «Cambios en pruebas y documentos»

## Decisiones ya tomadas
- «No empeora» significa: el número de pruebas que fallan es menor o igual que `fail` de la base, y los títulos de las que fallan están todos en `fallos=` de la base; las pruebas totales aumentan o igualan; los segundos no superan 30. Si F30 corrigió alguno de los fallos de la base, mejorar es válido.
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
3. La rápida no tiene fallos nuevos respecto a la base; se comprueba con el bloque `ℹ fail` y la lista `✖`.
4. Los topes de `topes-bytes.test.mjs` son los de hoy más el de `lectura-extra`; se comprueba con `grep -c`.

## Verificación
```
node --test pruebas/comprobaciones/topes-bytes.test.mjs
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/lectura-extra.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs
bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)|^✖|rapida:"
grep -c "tope: 7168\|tope: 3584\|tope: 3072\|tope: 5120\|tope: 4096" pruebas/comprobaciones/topes-bytes.test.mjs
```
Esperado: `ℹ fail 0`; `ℹ fail 0`; la rápida con `fail` ≤ la base y sin títulos nuevos, `rapida: … (tope 30 s)`; el último comando da `9`.

## Evidencia

## Notas
