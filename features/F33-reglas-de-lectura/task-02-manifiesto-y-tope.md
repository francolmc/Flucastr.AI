# task-02 — Manifiesto de frases y tope de bytes de `lectura-extra`
repo: Flucastr.AI   depende_de: task-01   estado: borrador

## Descripción
La skill y el puntero de `constructor` quedan protegidos: el manifiesto exige sus frases y `topes-bytes` fija el tope de la skill. Se crea `FRASES_LECTURA_EXTRA`, la lista que las tareas 03 a 05 ampliarán con `arquitecto`, `planificador` y `coordinador`.

## Contexto
- Tocar: `pruebas/comprobaciones/frases-por-archivo.mjs`, `pruebas/comprobaciones/topes-bytes.test.mjs`
- `frases-por-archivo.mjs` (confirmado): listas nombradas (`FRASES_COORDINADOR_F21`, `FRASES_LECTURA_F22`, `FRASES_UNA_PASADA`, líneas 6–72) y el objeto `FRASES_POR_ARCHIVO` (líneas 74–148) que las reparte con `...`. `'agentes/constructor'` está en las líneas 86–89; `'skills/ejecutar-tarea'` en 135–137.
- `contrato-roles.test.mjs` recorre `FRASES_POR_ARCHIVO` y genera solo un caso positivo y uno negativo por frase (líneas 61 y 178): no hay que escribir pruebas nuevas.
- `topes-bytes.test.mjs`: arreglo `TOPES` (líneas 12–21), última entrada `skills/control-consumo/SKILL.md` con 4096.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «Cambios en pruebas y documentos»

## Decisiones ya tomadas
- En `frases-por-archivo.mjs`, justo antes de `FRASES_POR_ARCHIVO`, un bloque nuevo con comentario «Frases de F33 (reglas de lectura). Las claves arquitecto, planificador y constructor son agentes; lectura-extra es skill.»:
  `export const FRASES_LECTURA_EXTRA = { constructor: ['solo se lee con `lectura-extra`'], 'lectura-extra': ['15 KB', 'Lectura extra: <ruta>; motivo=', 'rol=franco', 'no aplica al `coordinador`'] };`
- `'agentes/constructor'` agrega `...FRASES_LECTURA_EXTRA.constructor`. Entrada nueva `'skills/lectura-extra': [...FRASES_LECTURA_EXTRA['lectura-extra']]` al final del objeto.
- La frase `no aplica al `coordinador`` debe estar literal en la skill: task-01 escribe «Esta excepción no aplica al `coordinador`.» (la «n» minúscula coincide). Si la prueba falla por mayúscula, se corrige la frase del manifiesto, no la skill.
- `TOPES` agrega al final `{ ruta: 'skills/lectura-extra/SKILL.md', tope: 5120, opcional: false }`. Ningún tope existente cambia.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: dos archivos de prueba.
Fuera de alcance: `contrato-roles.mjs` (reexporta solo las listas F21/F22/F27; no se toca), frases de `arquitecto`, `planificador` y `coordinador` (tareas 03–05), cualquier tope existente.

## Pasos
1. En `frases-por-archivo.mjs` agrega `FRASES_LECTURA_EXTRA` con los contenidos de *Decisiones ya tomadas*.
2. Agrega la propagación en `'agentes/constructor'` y la entrada `'skills/lectura-extra'`.
3. En `topes-bytes.test.mjs` agrega la entrada de la skill.
4. Corre la verificación.

## Criterios de aceptación
1. El manifiesto exige las frases de la skill y del puntero; `contrato-roles.test.mjs` pasa con `fail 0`.
2. La frase `15 KB` está en la skill y en el manifiesto (el control negativo por frase de `contrato-roles.test.mjs` la cubre); se comprueba con `grep -c "15 KB"` en ambos archivos.
3. `topes-bytes.test.mjs` tiene 9 entradas y pasa; se comprueba con `grep -c "ruta:" pruebas/comprobaciones/topes-bytes.test.mjs` (`9`).
4. Los ocho topes anteriores no cambiaron; se comprueba con `grep -c` de los valores 7168, 3584, 3072, 5120 y 4096 (9 líneas con el nuevo).

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs
grep -c "ruta:" pruebas/comprobaciones/topes-bytes.test.mjs
grep -c "15 KB" skills/lectura-extra/SKILL.md pruebas/comprobaciones/frases-por-archivo.mjs
grep -c "tope: 7168\|tope: 3584\|tope: 3072\|tope: 5120\|tope: 4096" pruebas/comprobaciones/topes-bytes.test.mjs
```
Esperado: `ℹ fail 0`; `9`; `skills/lectura-extra/SKILL.md:1` y `pruebas/comprobaciones/frases-por-archivo.mjs:1`; `9`.

## Evidencia

## Notas
