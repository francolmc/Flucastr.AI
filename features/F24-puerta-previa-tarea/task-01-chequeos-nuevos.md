# task-01 — Chequeos nuevos en el validador de tareas
repo: Flucastr.AI   depende_de: —   estado: bloqueada

## Descripción
`validarTarea` hoy exige nueve secciones y no mira qué archivos toca la tarea ni si queda una decisión sin cerrar (S2 y S3 de la medición en Flucastr.Cleaner). Esta tarea lo deja en diez secciones (con «Decisiones abiertas», ya en la plantilla) y le suma dos chequeos: rutas a tocar y decisiones abiertas. Todo en su sitio actual; moverlo a `scripts/` es task-02.

## Contexto
- Leer: `definitions/WORKFLOW.md` §6 (plantilla de diez secciones); `pruebas/comprobaciones/formato-tarea.mjs` (regla 3 usa `SECCIONES`, líneas 5-15; reglas 1-9 hasta la línea 126; la función `secciones(lineas)` devuelve `{titulo, lineas}`).
- Tocar: `pruebas/comprobaciones/formato-tarea.mjs`, `pruebas/comprobaciones/formato-tarea.test.mjs`, `pruebas/fixtures/constructor.sh`
- Prueba: `muestra` es la tarea válida del test (líneas 11-42); `variantes` son los controles negativos; el test «las tareas reales de features/ cumplen el formato» lee `features/F24-puerta-previa-tarea/` y hoy falla porque no hay tareas con diez secciones. Pasará al terminar esta tarea.
- `pruebas/fixtures/constructor.sh` genera 4 tareas en heredocs; cada una tiene `- Repo: demo. Solo este repo.` en *Contexto* (líneas 25, 60, 95, 131).
- Baseline: `pruebas/rapida.sh` ya falla 8 pruebas ajenas (BACKLOG con 11 celdas en F26, contrato-roles real y WORKFLOW.md >30720). No son de esta tarea; no las toques.

## Decisiones ya tomadas
- `SECCIONES` pasa a diez, con `'Decisiones abiertas'` en cuarto lugar (tras «Decisiones ya tomadas»). El mensaje de la regla 3 usa `SECCIONES.length` en vez de «nueve».
- Regla 10 (decisiones abiertas): válida si el cuerpo es `Ninguna` o `Ninguna.`, o si cada línea no vacía empieza con `- ` y contiene `Resuelta:` seguido de texto. Cualquier otra cosa se rechaza con un mensaje que cita «Decisiones abiertas».
- Regla 11 (rutas a tocar): en *Contexto* debe haber exactamente una línea que empiece con `- Tocar: `. Las rutas van entre comillas invertidas, separadas por `, `. Entre 1 y 3. Cada ruta debe cumplir `/^[A-Za-z0-9_.\-\/]+$/`, sin `*` ni `..`, sin terminar en `/` ni empezar con `/` (relativa al repo, archivo exacto). Mensajes que citan «Tocar».
- Sin cambios al límite de 8192 caracteres ni a las reglas 1-9.
- Control negativo: sobre `muestra`, variantes que rechacen cada caso (ver Pasos).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: las reglas 10 y 11, el cambio a diez secciones, la muestra y variantes del test y las 4 tareas del fixture.
Fuera de alcance: mover el archivo a `scripts/`, crear `validar-tarea.mjs`, cambiar agentes, instaladores o `definitions/`, aviso de 6 KB.

## Pasos
1. En `pruebas/comprobaciones/formato-tarea.mjs`: añadir `'Decisiones abiertas'` a `SECCIONES` y cambiar «nueve» por `${SECCIONES.length}` en el mensaje de la regla 3.
2. En el mismo archivo: añadir la regla 10 y la regla 11 con las decisiones de arriba, después de la regla 7 y con el estilo de las existentes (comentario «// Regla N: …»).
3. En `formato-tarea.test.mjs`: añadir a `muestra` la sección `## Decisiones abiertas` con `Ninguna.` y la línea `- Tocar: \`archivo.mjs\`` en *Contexto*.
4. En el mismo test: añadir variantes que rechacen (a) cuatro rutas, (b) ruta con `*`, (c) sin línea `Tocar`, (d) decisión abierta sin resolver (`- ¿Qué librería usar?`), (e) sección «Decisiones abiertas» vacía. Añadir un test que acepte `- Elegir librería — Resuelta: node:test`.
5. En `pruebas/fixtures/constructor.sh`: en las 4 tareas, reemplazar la línea `- Repo: demo. Solo este repo.` por ella más `- Tocar: \`<archivo>\`` (el único archivo que nombra su sección *Pasos*), e insertar `## Decisiones abiertas` con `Ninguna.` entre «Decisiones ya tomadas» y «Alcance / Fuera de alcance».
6. Ejecutar la verificación.

## Criterios de aceptación
1. La muestra es válida y cada variante nueva produce al menos un error: `node --test pruebas/comprobaciones/formato-tarea.test.mjs` sin fallos.
2. Las tareas reales de F24 cumplen el formato (mismo comando, prueba «las tareas reales»).
3. Las 4 tareas del fixture siguen cumpliendo la plantilla: `node --test pruebas/comprobaciones/fixture-constructor.test.mjs` sin fallos.
4. `constructor-resultado` no se rompe: `node --test pruebas/comprobaciones/constructor-resultado.test.mjs` sin fallos.

## Verificación
```
node --test pruebas/comprobaciones/formato-tarea.test.mjs pruebas/comprobaciones/fixture-constructor.test.mjs pruebas/comprobaciones/constructor-resultado.test.mjs
bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (pass|fail)"
```
Esperado: primer comando `ℹ fail 0`. Segundo: `fail` ≤ 7 (baseline 8; baja en 1 al pasar «las tareas reales») y ninguna prueba nueva en la lista de fallos.

## Evidencia
`node --test pruebas/comprobaciones/formato-tarea.test.mjs pruebas/comprobaciones/fixture-constructor.test.mjs pruebas/comprobaciones/constructor-resultado.test.mjs` (combinado):
```
ℹ tests 42
ℹ pass 41
ℹ fail 1
✖ las tareas reales de features/ cumplen el formato
  «features/F24-puerta-previa-tarea/task-07-prueba-real-permiso.md: «Tocar» debe listar las rutas entre comillas invertidas, separadas por «, ».»
```
Por archivo: `formato-tarea.test.mjs` → `ℹ pass 20`, `ℹ fail 1` (la misma prueba); `fixture-constructor.test.mjs` → `ℹ pass 2`, `ℹ fail 0`; `constructor-resultado.test.mjs` → `ℹ pass 19`, `ℹ fail 0`.

`bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (pass|fail)"`:
```
ℹ pass 363
ℹ fail 9
```
Fallos de `rapida.sh`: «definitions/BACKLOG.md y features/F*/task-*.md reales son coherentes», «definitions/BACKLOG.md real cumple el formato», «las tareas reales de features/ cumplen el formato», «los archivos reales cumplen la regla», y cinco de `higiene-contexto` (modelos.json, lectura acotada en constructor y ejecutar-tarea, WORKFLOW.md >30720 y su frase de modelos.json). Diagnóstico de «coherentes»: `features/F24-puerta-previa-tarea/task-06-reglas-puerta-previa.md` depende de task-07, que no tiene número menor.

Criterios: 1 no cumplido (formato-tarea: 1 fallo, el de «las tareas reales»); 2 no cumplido (task-07 no cumple la regla 11); 3 cumplido; 4 cumplido.

## Notas
- Huecos menores (1): las reglas 10 y 11 van tras la regla 9, no tras la 7, para que la numeración quede en orden 1-11. Sigue cumpliendo «después de la regla 7».
- Bloqueo: el criterio 1 y el 2 dependen de `features/F24-puerta-previa-tarea/task-07-prueba-real-permiso.md`, que no cumple la regla 11 (la línea `- Tocar:` no usa el formato «`ruta`, `ruta`»). Es otra tarea de F24, fuera de mi encargo; no la toqué ni la leí. Requiere revisión del planificador.
- No pude confirmar que los 9 fallos de `rapida.sh` coincidan con la base de 8 del encargo: no hice `git stash` (no permitido). Ninguno de los archivos del test de `coherencia-features` o `higiene-contexto` importa `formato-tarea.mjs` ni `constructor.sh`; el único fallo que sí toca mi cambio es «las tareas reales».
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=falla; huecos=1; resultado=bloqueada; causa=otra
