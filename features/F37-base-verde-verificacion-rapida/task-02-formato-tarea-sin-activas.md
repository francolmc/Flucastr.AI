# task-02 — formato-tarea acepta features/ sin tareas activas y cierre en verde
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
La prueba «las tareas reales de features/ cumplen el formato» en `pruebas/comprobaciones/formato-tarea.test.mjs` exige al menos una tarea activa y falla con «no hay tareas reales en features/» cuando todas las features están archivadas en `features/completed/`. Se corrige igual que F16 con `coherencia-features`: `features/` sin tareas activas es válido. Es la última tarea: cierra la feature comprobando que `bash pruebas/rapida.sh` termina en 0 con 0 fallos.

## Contexto
- Tocar: `pruebas/comprobaciones/formato-tarea.test.mjs`
- Tocar solo `pruebas/comprobaciones/formato-tarea.test.mjs`. Líneas 129-141 hoy:
  `const reales = fs.readdirSync(path.join(raiz, 'features'), { recursive: true }).filter(...task-\d{2}-...).filter((r) => !r.startsWith('completed/')).map(...)` y
  `test('las tareas reales de features/ cumplen el formato', () => {` con la primera línea `assert.ok(reales.length >= 1, 'no hay tareas reales en features/');`.
- Patrón de F16 (`pruebas/comprobaciones/coherencia-features.test.mjs`, prueba hacia las líneas 148-177): una prueba con carpeta temporal en `pruebas/.temporales` donde solo hay `completed/F01-base/task-01-x.md` y se afirma que la validación no da errores; y la prueba «reales» no exige existencia.
- `validarTarea(texto)` se importa de `./formato-tarea.mjs` (línea 6) y devuelve un arreglo de errores; `muestra` (línea 10) es una tarea válida y la usa el resto del archivo.
- La siguiente prueba (línea ~143) itera `reales` y con arreglo vacío no hace nada: no necesita cambio.
- Estado inicial confirmado: `node --test pruebas/comprobaciones/formato-tarea.test.mjs` da 1 fallo (la prueba de las líneas 135-141) con `features/` solo con `completed/` (mientras existan las tareas de F37 la afirmación pasa, pero falla al archivarse).
- Se ejecuta con `node` y `bash`.
- Fuente: ninguna
- Requiere: largo:60

## Decisiones ya tomadas
- Se elimina la línea `assert.ok(reales.length >= 1, …)`; el resto de la prueba queda igual (con 0 tareas, `fallos` es `[]` y pasa).
- Se añade una prueba de que el filtro de `reales` excluye `completed/`: construye la lista de rutas `['completed/F01-x/task-01-a.md', 'F37-y/task-01-b.md']`, aplica la misma regex y el mismo filtro `!r.startsWith('completed/')` y afirma que queda solo `F37-y/task-01-b.md`. Para no duplicar lógica, extrae el filtro a `const esActiva = (r) => /(^|\/)task-\d{2}-[^/]*\.md$/.test(r) && !r.startsWith('completed/');` y úsalo en `reales` y en la prueba.
- La prueba de control negativo ya existente de `validarTarea` (tarea mal formada rechazada) se mantiene; no se añade otra.
- No se toca `scripts/` ni `formato-tarea.mjs`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: la prueba de tareas reales, la extracción de `esActiva` y una prueba nueva del filtro.
Fuera de alcance: cambiar `validarTarea`, `coherencia-features*`, `formato-flujo.test.mjs` (ya verde, solo se confirma), `WORKFLOW.md`, compactar el backlog y la duración de la suite (38 s).

## Pasos
1. En `pruebas/comprobaciones/formato-tarea.test.mjs` define `esActiva` justo antes de `const reales` y reescribe `reales` con `.filter(esActiva)`.
2. Borra la línea `assert.ok(reales.length >= 1, 'no hay tareas reales en features/');`.
3. Añade tras esa prueba `test('las tareas de features/completed/ no cuentan como activas', …)` con las dos rutas indicadas y `assert.deepEqual(rutas.filter(esActiva), ['F37-y/task-01-b.md'])`.
4. Ejecuta `node --test pruebas/comprobaciones/formato-tarea.test.mjs`.
5. Ejecuta `bash pruebas/rapida.sh` completa y copia el resumen final en *Evidencia*.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/formato-tarea.test.mjs` termina con 0 fallos.
2. La prueba de tareas reales ya no contiene `reales.length >= 1` (`grep -c 'reales.length >= 1' pruebas/comprobaciones/formato-tarea.test.mjs` → `0`).
3. La prueba nueva del filtro aprueba y falla si se quita `!r.startsWith('completed/')` de `esActiva`.
4. `bash pruebas/rapida.sh` termina en 0 con 0 fallos (aceptación de F37).
5. `git diff --stat -- . ':!features' ':!definitions'` muestra solo `pruebas/comprobaciones/higiene-contexto.test.mjs` y `pruebas/comprobaciones/formato-tarea.test.mjs`.

## Verificación
Comando 1:
```
node --test pruebas/comprobaciones/formato-tarea.test.mjs 2>&1 | grep -E '^ℹ fail'
```
Esperado: `ℹ fail 0`.

Comando 2:
```
grep -c 'reales.length >= 1' pruebas/comprobaciones/formato-tarea.test.mjs
```
Esperado: `0`.

Comando 3:
```
bash pruebas/rapida.sh; echo "salida=$?"
```
Esperado: termina con `salida=0` y 0 fallos en el resumen.

## Evidencia
```
$ node --test pruebas/comprobaciones/formato-tarea.test.mjs 2>&1 | grep -E '^ℹ fail'
ℹ fail 0
exit 0
$ grep -c 'reales.length >= 1' pruebas/comprobaciones/formato-tarea.test.mjs
0
exit 1
$ bash pruebas/rapida.sh; echo "salida=$?"
ℹ tests 742
ℹ pass 742
ℹ fail 0
rapida: 50 archivos en 25 s (tope 90 s)
salida=0
exit 0
```

## Notas
Hecho: `esActiva` extraído antes de `reales` y usado con `.filter(esActiva)`; borrada `assert.ok(reales.length >= 1, ...)`; añadida la prueba «las tareas de features/completed/ no cuentan como activas». Solo se tocó `pruebas/comprobaciones/formato-tarea.test.mjs` y esta tarea.
Pasada 1 de rapida.sh: 53 s, mismo resumen (742 pass, 0 fail), salida=1 por el tope de 30 s. Pasada 2: 41 s, mismo resultado. Se agotó la cota de 2 pasadas.
Bloqueo: tipo=verificacion_x2; falta=-
Causa: rapida.sh no falla por una prueba; falla por el tope de duración de 30 s (la suite tarda 41 a 53 s). El cambio de esta tarea no toca nada que dure más. Franco decide si sube el tope o acepta la suite más lenta.
`validar-tarea.mjs --evidencia` rechazó la tarea con «La tarea no está terminada: estado «en curso»» antes del cambio a bloqueada. No se marcó `lista para revisión` porque `verificacion=falla`.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2
Reintento: el tope de rapida.sh pasó a 90 s (commit 97d82fa, decisión de Franco). Con la tarea en curso, rapida.sh da 742 pass, 0 fail, 25 s, salida=0. Diff fuera de features/ y definitions/: solo formato-tarea.test.mjs (higiene-contexto no aparece). Sin huecos menores.
Registro: n=2; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
