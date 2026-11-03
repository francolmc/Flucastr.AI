# task-02 — Manifiesto de frases y tope de bytes de `lectura-extra`
repo: Flucastr.AI   depende_de: task-01   estado: hecha

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

Pasada 2 de Verificación (comandos idénticos a *Verificación*, salida real; la pasada 1 dio el mismo resultado).

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs
✔ muestra válida mínima no tiene errores (1.727166ms)
✔ rechaza regla 1: name no coincide con la clave del agente (0.240291ms)
[…recortado: 111 líneas…]
✔ control negativo sintético: skills/lectura-extra/SKILL.md con tope+1 excede y con tope no excede (0.020792ms)
ℹ tests 114
ℹ suites 0
ℹ pass 114
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 71.4585
exit 0
```

```
$ grep -c "ruta:" pruebas/comprobaciones/topes-bytes.test.mjs
9
exit 0
```

```
$ grep -c "15 KB" skills/lectura-extra/SKILL.md pruebas/comprobaciones/frases-por-archivo.mjs
skills/lectura-extra/SKILL.md:1
pruebas/comprobaciones/frases-por-archivo.mjs:1
exit 0
```

```
$ grep -c "tope: 7168\|tope: 3584\|tope: 3072\|tope: 5120\|tope: 4096" pruebas/comprobaciones/topes-bytes.test.mjs
9
exit 0
```

## Notas
- Criterios: 1 cumplido (`fail 0` en el node --test); 2 cumplido (`15 KB` en skill y manifiesto, ambos con 1); 3 cumplido (9 entradas `ruta:`, el test pasa); 4 cumplido (9 líneas con los cinco topes, los anteriores sin cambio).
- Cambios: `pruebas/comprobaciones/frases-por-archivo.mjs` (bloque `FRASES_LECTURA_EXTRA` antes de `FRASES_POR_ARCHIVO`, propagación en `agentes/constructor`, entrada `skills/lectura-extra`); `pruebas/comprobaciones/topes-bytes.test.mjs` (entrada `skills/lectura-extra/SKILL.md` con tope 5120 al final de `TOPES`).
- La frase «no aplica al `coordinador`» coincide con la skill de task-01; no hizo falta corregir el manifiesto.
- Pasada 1 de Verificación se corrió con redirección a un archivo de la carpeta temporal, así que no era idéntica a *Verificación*; la pasada 2 se corrió tal cual y es la que está en *Evidencia*. Luego se repitió el `node --test` solo para contar las líneas de salida (122); mismo resultado.
- Modo yolo: no se creó rama, no hubo `git switch` ni commit; el trabajo queda en `feature/F33-reglas-de-lectura`. No se tocó `definitions/STATUS.md`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
