# task-02 — Quitar las reglas 13 y 14 del contrato del constructor y sus pruebas
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Las reglas 13 y 14 de `pruebas/comprobaciones/contrato-constructor.mjs` exigen que el constructor y `ejecutar-tarea` digan que en yolo no se crea rama. F40 revierte esa decisión (yolo usa la misma regla de rama que el modo normal). Esta tarea borra las dos reglas y sus pruebas para que las tareas siguientes puedan quitar esas frases de los textos sin romper la suite. Las reglas 11 y 12 quedan igual.

## Contexto
- Tocar: `pruebas/comprobaciones/contrato-constructor.mjs`, `pruebas/comprobaciones/contrato-constructor.test.mjs`
- `contrato-constructor.mjs`: en el arreglo `REGLAS`, las líneas 24 (`{ n: 13, sobre: 'constructor', frases: ['Modo yolo: activo', 'no creas rama', …] }`) y 25 (`{ n: 14, sobre: 'skill', frases: ['Modo yolo: activo', 'salta este paso entero', …], despuesDe: […] }`).
- `contrato-constructor.test.mjs`: en `variantes`, las líneas 34 (`regla 13: …`) y 35 (`regla 14: …`); y la prueba `test('rechaza la regla 14 si «Modo yolo: activo» aparece después de «git switch -c» en la skill', …)` de las líneas 58-63.
- La numeración de las reglas restantes (15, 16, 17) no se cambia.
- Estado inicial: `node --test pruebas/comprobaciones/contrato-constructor.test.mjs` pasa con los textos actuales.
- Fuente: definitions/F40-RAMAS.md «C. Efectos fuera de las definiciones (no se editan aquí)»
- Requiere: ninguno

## Decisiones ya tomadas
- Se borran exactamente esas dos reglas, sus dos filas de `variantes` y la prueba de la regla 14. No se renumera nada ni se añaden reglas.
- No se tocan `agentes/constructor.md` ni `skills/ejecutar-tarea/SKILL.md` (task-03).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos reglas y tres bloques de prueba.
Fuera de alcance: editar textos de agentes o skills, `frases-por-archivo.mjs`, reglas 11 y 12, renumerar.

## Pasos
1. Comprueba `git branch --show-current`.
2. En `contrato-constructor.mjs` borra las líneas de las reglas 13 y 14.
3. En `contrato-constructor.test.mjs` borra las filas `regla 13` y `regla 14` de `variantes`.
4. En el mismo archivo borra la prueba «rechaza la regla 14 …» (con su línea en blanco previa).
5. Corre la *Verificación*.

## Criterios de aceptación
1. La rama activa es `fix/F40-rama-de-trabajo` (comando 1).
2. Ya no existen `regla 13` ni `regla 14` en los dos archivos (comando 2: salida vacía).
3. La prueba de contrato pasa sin fallos (comando 3).
4. Solo cambiaron esos dos archivos de `pruebas/comprobaciones` (comando 4).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F40-rama-de-trabajo`.

Comando 2:
```
grep -n -E 'n: 1[34],|regla 1[34]' pruebas/comprobaciones/contrato-constructor.mjs pruebas/comprobaciones/contrato-constructor.test.mjs
```
Esperado: salida vacía.

Comando 3:
```
node --test pruebas/comprobaciones/contrato-constructor.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
```
Esperado: `ℹ fail 0` (y `ℹ pass` mayor que 0).

Comando 4:
```
git diff --stat -- pruebas/comprobaciones
```
Esperado: solo `contrato-constructor.mjs` y `contrato-constructor.test.mjs`.

## Evidencia
```
$ git branch --show-current
fix/F40-rama-de-trabajo
exit 0
$ grep -n -E 'n: 1[34],|regla 1[34]' pruebas/comprobaciones/contrato-constructor.mjs pruebas/comprobaciones/contrato-constructor.test.mjs

exit 1
$ node --test pruebas/comprobaciones/contrato-constructor.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
ℹ pass 19
ℹ fail 0
exit 0
$ git diff --stat -- pruebas/comprobaciones
 pruebas/comprobaciones/contrato-constructor.mjs      | 2 --
 pruebas/comprobaciones/contrato-constructor.test.mjs | 9 ---------
 2 files changed, 11 deletions(-)
exit 0
```

## Notas
- Hueco menor: ninguno. Se borraron exactamente las líneas 24-25 de `REGLAS` en `contrato-constructor.mjs`, las dos filas `regla 13`/`regla 14` de `variantes` y la prueba «rechaza la regla 14 …» con su línea en blanco, como indica *Pasos*.
- Verificación: los cuatro comandos pasan (comando 2 sin salida, `exit 1` de grep = sin coincidencias, esperado). Suite del contrato: `pass 19`, `fail 0`.
- Modo yolo: no se creó rama ni se hizo `git switch`; se trabajó en `fix/F40-rama-de-trabajo`, sin commit.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
