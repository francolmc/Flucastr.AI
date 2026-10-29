# task-07 — Evaluador de resultados: caso yolo (sin cambio de rama, sin CONFIRMAR, sin commit)
repo: Flucastr.AI   depende_de: task-01   estado: aprobada

## Descripción
`pruebas/comprobaciones/constructor-resultado.mjs` evalúa, sin modelo ni red, el estado de un fixture antes y después de una corrida del constructor. Esta tarea añade el caso `yolo`: la misma tarea feliz, pero en modo yolo la rama no debe cambiar, la respuesta no debe ser `CONFIRMAR:` ni `BLOQUEO:` y no debe haber commit. Así queda comprobable, sin modelo, el comportamiento que task-01 describe.

## Contexto
- Repo: este, único repo. Node, ESM, `node:test`, sin dependencias. Leídos: `pruebas/comprobaciones/constructor-resultado.mjs` (objeto `TAREA` por caso; `leerEstado(dir)` devuelve `{ archivos, head, rama }`; `evaluarCaso(caso, { antes, despues, respuesta })` devuelve un arreglo de errores; reglas comunes de HEAD y `hecha`; caso `feliz` valida estado `lista para revisión`, `salida.txt` y archivos cambiados) y `pruebas/comprobaciones/constructor-resultado.test.mjs` (fixture generado con `pruebas/fixtures/constructor.sh`; objeto `CORRECTOS` con `cambiar` y `respuesta`; arreglo `INCORRECTOS`; prueba de rama cambiada del caso `confirmar`).
- Archivos a tocar: `pruebas/comprobaciones/constructor-resultado.mjs` y `pruebas/comprobaciones/constructor-resultado.test.mjs`. Comando: `node --test pruebas/comprobaciones/constructor-resultado.test.mjs`.

## Decisiones ya tomadas
- En `TAREA` se añade `yolo: 'features/F99-demo/task-01-crear-salida.md'` (la misma tarea que `feliz`).
- En `evaluarCaso`, después de la comprobación de caso desconocido y antes del resto, si `caso === 'yolo'`: devolver `[...evaluarCaso('feliz', { antes, despues, respuesta }), ...extras]`, donde `extras` contiene, cada uno como mensaje en español: «La rama cambió («X» → «Y»): en yolo no debe cambiar.» si `a.rama !== d.rama`; «La respuesta es una línea CONFIRMAR; en yolo no aplica.» si la primera línea empieza por `CONFIRMAR:`; «La respuesta es un BLOQUEO; la tarea debía terminar.» si empieza por `BLOQUEO:`.
- En el test: `CORRECTOS.yolo = { cambiar: feliz, respuesta: 'Creé salida.txt con la línea hola.' }` (se usa el bucle existente de resultados correctos). Variantes negativas, una prueba cada una: (a) `yolo` donde `cambiar` hace `git -C <dir> switch -c otra` además de `feliz`, y la prueba exige un error que mencione «rama»; (b) `yolo` con la respuesta `CONFIRMAR: accion=git switch feature/F99-demo; motivo=x`; (c) `yolo` con estado `hecha` (mismo cambio que la variante «feliz con estado hecha»), añadida al arreglo `INCORRECTOS`.
- No se fija cuántos casos hay. No se tocan los casos existentes ni los lanzadores.

## Alcance / Fuera de alcance
Alcance: el caso `yolo`, su resultado correcto y las tres variantes negativas.
Fuera de alcance: los lanzadores (`pruebas/lanzar-constructor-claude.sh`), el fixture, el contrato del constructor (task-05), los casos existentes.

## Pasos
1. Añadir `yolo` a `TAREA` y la rama de `evaluarCaso`. Resultado: `evaluarCaso('yolo', …)` ya no devuelve «Caso desconocido».
2. Añadir `CORRECTOS.yolo` en el test. Resultado: «un resultado correcto simulado del caso yolo da []» pasa.
3. Añadir las variantes (a), (b) y (c). Resultado: tres pruebas «rechaza/se rechaza …» pasan.
4. Correr la *Verificación*.

## Criterios de aceptación
1. Un resultado correcto simulado de `yolo` da `[]`. Se comprueba con la prueba del bucle de `CORRECTOS`.
2. Cambiar de rama durante la corrida da un error que menciona «rama». Se comprueba con la variante (a).
3. Una respuesta `CONFIRMAR:` o el estado `hecha` dan al menos un error. Se comprueba con (b) y (c).
4. Los casos existentes siguen dando el mismo resultado. Se comprueba con `fail 0` de todo el archivo de pruebas.

## Verificación
```
node --test pruebas/comprobaciones/constructor-resultado.test.mjs
bash pruebas/rapida.sh
git status --short pruebas/comprobaciones
```
Esperado: la primera con `fail 0`; la segunda termina con `rapida: N archivos en S s (tope 30 s)` y código 0; la tercera muestra `constructor-resultado.mjs` y `constructor-resultado.test.mjs` entre los cambios.

## Evidencia

## Notas
