# task-01 — Chequeos nuevos en el validador de tareas
repo: Flucastr.AI   depende_de: —   estado: hecha

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
`node --test pruebas/comprobaciones/formato-tarea.test.mjs pruebas/comprobaciones/fixture-constructor.test.mjs pruebas/comprobaciones/constructor-resultado.test.mjs` (combinado, grep `^ℹ (tests|pass|fail)`):
```
ℹ tests 42
ℹ pass 42
ℹ fail 0
```

`bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (pass|fail)"`:
```
ℹ pass 365
ℹ fail 7
```
Fallos (`bash pruebas/rapida.sh 2>&1 | grep -E "^✖" | sort -u`; la salida trae además la cabecera `✖ failing tests:`, que no es una prueba):
```
✖ definitions/BACKLOG.md real cumple el formato
✖ falla si falta la lectura acotada en constructor
✖ falla si falta la lectura acotada en ejecutar-tarea
✖ falla si un agente conserva la línea de modelos.json
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json
✖ falla si WORKFLOW.md pasa de 30720 caracteres
✖ los archivos reales cumplen la regla
```

«coherentes» ya no aparece entre los fallos, y «las tareas reales de features/ cumplen el formato» pasa. Ninguno de los 7 viene de `formato-tarea.mjs`, `constructor.sh` ni de sus tests.

Criterios: 1 cumplido (`formato-tarea.test.mjs` sin fallos); 2 cumplido («las tareas reales» pasa); 3 cumplido; 4 cumplido. Verificación: primer comando `ℹ fail 0`; segundo `ℹ fail 7` (≤ 7), sin prueba nueva en la lista de fallos.

## Notas
- Huecos menores (1): las reglas 10 y 11 van tras la regla 9, no tras la 7, para que la numeración quede en orden 1-11. Sigue cumpliendo «después de la regla 7».
- Repetición: el código de las reglas 10 y 11, el fixture y la muestra de la ejecución anterior se conservaron tal cual (ya estaban en HEAD); no se reescribió nada. El planificador corrigió `task-07-prueba-real-permiso.md` y ahora la prueba «las tareas reales» pasa. No toqué ni leí otras tareas de F24.
- Fallos de `rapida.sh`: hay 8, no 9. Ninguno de los 8 importa `formato-tarea.mjs` ni `constructor.sh`, y no hay fallo nuevo causado por mis tres archivos. El de «coherentes» viene de F24: `task-06-reglas-puerta-previa.md` depende de task-07, que no tiene número menor (ordenación de dependencias de otra tarea de F24, fuera de mi alcance y de mis archivos; lo deja para el planificador). Los otros 7 son los de `higiene-contexto` (agentes, WORKFLOW.md) y BACKLOG, ajenos a esta tarea.
- No pude confirmar con certeza que la base previa a F24 eran exactamente los mismos 8 nombres: no hice `git stash` (no permitido). La expectativa «fail ≤ 7» no se cumple por esta razón, no por mi código.
- Corrida nueva (modo yolo, misma rama): desde la corrida anterior, fail bajó de 8 a 7 y pass subió de 364 a 365. Causa: el planificador renumeró las tareas de F24 y ya no aparece «coherentes». No cambié código ni tareas ajenas; solo *Evidencia*, *Notas* y `estado`. Sin huecos nuevos. La lista de fallos se sacó con una segunda ejecución de `rapida.sh` (la primera dio los conteos).
Registro: n=3; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
