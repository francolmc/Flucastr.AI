# task-02 — Módulo que mide los topes de contexto (Leer)
repo: Flucastr.AI   depende_de: task-01   estado: aprobada

## Descripción
Crea `scripts/formato-topes.mjs`: lee la línea `- Leer:` de *Contexto* y mide archivos a leer (≤4) y bytes de contexto (aviso >9 KB, error >12 KB). Es una función pura, igual que `validarFuente`; el CLI la cablea en task-03.

## Contexto
- Tocar: `scripts/formato-topes.mjs`, `pruebas/comprobaciones/formato-topes.test.mjs`
- Leer: `scripts/formato-fuente.mjs`, `scripts/formato-tarea.mjs@75-4`, `definitions/F42-TOPES.md@30-6`
- Patrón: `validarFuente(texto, leer)` de `scripts/formato-fuente.mjs` (usa `secciones` de `formato-tarea.mjs`; `leer(ruta)` devuelve texto o `null`). `secciones(lineas)` devuelve `[{ titulo, lineas }]`.
- Medición (confirmada, `definitions/F42-TOPES.md` §3): el tamaño en disco del archivo, o el de las `limit` líneas desde `offset` si hay rango. Lo declarado es lo medido.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Exporta `MAX_LEER = 4`, `MAX_BYTES_CONTEXTO = 12288`, `AVISO_BYTES_CONTEXTO = 9216` y `medirTopes(texto, leer)` que devuelve `{ errores, avisos }` (arreglos de mensajes en español).
- Sintaxis de la línea: `- Leer: ` + rutas entre comillas invertidas separadas por `, `; cada una `ruta` o `ruta@offset-limit` (`offset` = primera línea, desde 1; `limit` = número de líneas). Ausente = sin lectura declarada, sin error. Más de una línea `- Leer:` = error. Formato inválido o rango con `offset` o `limit` menor que 1 = error.
- Bytes de un rango: `Buffer.byteLength` de las líneas elegidas unidas con `\n` más un `\n` final. Archivo ilegible (`leer` devuelve `null`) = error «El archivo de Leer no se puede leer: <ruta>.».
- Mensajes: «`«Leer» tiene N archivos; el tope es 4 (WORKFLOW.md §6).`», «`El contexto a leer mide N bytes; el tope es 12288 (12 KB).`» y, como aviso, «`El contexto a leer mide N bytes; pasa de 9216 (9 KB).`». No uses la palabra «caracteres» (la firma de `scripts/firma.mjs` la clasifica como `tamano`).
- Exentas: estado `hecha` o `cancelada` (segunda línea de la tarea) devuelven `{ errores: [], avisos: [] }`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el módulo y su prueba unitaria con `leer` simulado.
Fuera de alcance: cablear el CLI (task-03), modificar `formato-tarea.mjs`, medir pasos o `Tocar`.

## Pasos
1. Corre `git branch --show-current`.
2. Crea `scripts/formato-topes.mjs` con las constantes y `medirTopes`.
3. Crea `pruebas/comprobaciones/formato-topes.test.mjs` con ocho pruebas: sin `Leer` sin errores; 4 archivos pasan; 5 archivos fallan y nombran «4»; 12288 bytes pasan; 12289 fallan; 9217 dan aviso sin error; rango `@2-3` mide solo esas líneas; `hecha` con 5 archivos pasa.
4. Corre la verificación.

## Criterios de aceptación
1. Cinco archivos dan un error que nombra el tope 4 y la cifra 5 (prueba).
2. 12288 bytes pasan y 12289 fallan; 9217 solo avisa (pruebas).
3. Un rango mide solo sus líneas (prueba) y una tarea `hecha` queda exenta (prueba).

## Verificación
```
git branch --show-current
node --test pruebas/comprobaciones/formato-topes.test.mjs
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; `fail 0`.

## Evidencia

## Notas
