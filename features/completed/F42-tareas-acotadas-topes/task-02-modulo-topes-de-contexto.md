# task-02 — Módulo que mide los topes de contexto (Leer)
repo: Flucastr.AI   depende_de: task-01   estado: hecha

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

```
$ git branch --show-current
feature/F42-tareas-acotadas-topes
exit 0
```

```
$ node --test pruebas/comprobaciones/formato-topes.test.mjs
✔ 12289 bytes fallan (0.068666ms)
✔ 9217 bytes dan aviso sin error (0.067709ms)
✔ un rango mide solo sus líneas (0.122459ms)
✔ una tarea hecha con cinco archivos queda exenta (0.059166ms)
ℹ tests 8
ℹ suites 0
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 53.137292
exit 0
```

## Notas
- Código de salida: en la pasada 2 el `exit` no se capturó bien (el shell no dejó `PIPESTATUS`); el `exit 0` de arriba es el de `node --test` con `fail 0` en la salida real. No se repitió la pasada por la cota de dos pasadas.
- Pasada 1 de la Verificación: `node --test` falló en «un rango mide solo sus líneas» (`f@2-3` leído como archivo inexistente). Causa: el regex de línea `Leer` ponía el rango fuera de las comillas; la tarea fija `` `ruta@offset-limit` ``. Corregido en `scripts/formato-topes.mjs` (`RE_ITEM = /^`(.+?)(?:@(\d+)-(\d+))?`$/`). Pasada 2: 8 de 8 pasan.
- Hueco menor: el aviso (>9216) se emite solo si no hay error; con más de 12288 bytes solo sale el error. La tarea no lo fijaba. Elegido por ser lo más conservador.
- Hueco menor: el total de bytes suma todos los archivos de `Leer`. La tarea no lo fijaba. Elegido por ser lo más conservador.
- Medición de bytes sin rango: `Buffer.byteLength` del texto leído (tamaño en UTF-8). Con rango: líneas `offset`..`offset+limit-1` unidas con `\n` más `\n` final, como pide la tarea.
- Módulo de la tarea: `scripts/formato-topes.mjs` exporta `MAX_LEER`, `MAX_BYTES_CONTEXTO`, `AVISO_BYTES_CONTEXTO` y `medirTopes(texto, leer)`. No se tocó el CLI ni `formato-tarea.mjs`.
- No se hizo commit, push, PR ni merge. Rama no cambiada (`feature/F42-tareas-acotadas-topes`, actual).
- Huecos menores: 2.

Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
