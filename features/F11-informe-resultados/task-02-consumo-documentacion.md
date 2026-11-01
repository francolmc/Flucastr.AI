# task-02 — Bloque `--consumo`, pruebas de privacidad y documentación
repo: Flucastr.AI   depende_de: task-01   estado: aprobada

## Descripción
Añadir a `scripts/informe.mjs` la opción `--consumo <dir>`: bloque con costo y turnos totales, por rol y por tarea (aproximado), usando `scripts/consumo.mjs`. Probar privacidad y el bloque opcional, y documentar el comando en `README.md`.

## Contexto
- Lee solo las *Notas* de `features/F11-informe-resultados/task-01-nucleo-informe.md` (exportaciones reales de `scripts/informe.mjs`).
- Diseño aprobado: `definitions/ARCHITECTURE.md` «Informe de resultados del flujo», filas «Consumo» (línea 458) y pruebas 6 y 8 (líneas 503 y 505).
- De `scripts/consumo.mjs`: `descubrirSesiones(raiz, {hasta})` (línea 585) devuelve sesiones con `herramienta`, `rol`, `archivo` (ruta: no copiarla), `turnos`, `costo` (número o `null`/no numérico = `n/d`) y `subagentes.porRol` = `{rol: {corridas, turnos, costo}}`. `informeJson(sesiones, {tareas})` (línea 673) da el JSON con `porTarea: {costo, turnos}` por sesión.
- Fixtures sintéticos: `pruebas/comprobaciones/consumo-fixtures.mjs` (`registroSesionPi`, `turnoPi`, `unirJsonl`, `turnoClaude`, `metaSubagentePi`, `transcriptSubagentePi`, etc.). Ejemplo de uso en `pruebas/comprobaciones/consumo.test.mjs`.
- README: sección «Medición de consumo» (línea 253) y «Registro de eventos» (línea 264); árbol de `scripts/` (líneas 88–93).

## Decisiones ya tomadas
- `--consumo <dir>` sin otra opción nueva. Sin la bandera el informe no cambia nada respecto de task-01 (byte a byte). Si `<dir>` no es carpeta: stderr, código 1, no escribe.
- El bloque `## Consumo (aproximado)` va antes de «Límites de esta lectura». Contiene: total de turnos y costo (suma de sesiones; `n/d` si ninguna tiene costo numérico), tabla por rol (rol | corridas | turnos | costo) sumando `subagentes.porRol` de todas las sesiones más el rol propio de cada sesión (`rol` de la sesión, con sus `turnos` y `costo`), y «por tarea (promedio)» = totales ÷ `n` de tareas con `tarea_estado a=hecha` del informe (`n/d` si 0).
- Texto fijo en el bloque: «F20 mide sesiones, no tareas: el costo por tarea es un promedio, no una atribución».
- Nunca se copia `archivo`, rutas ni texto de mensajes. `--json` agrega la clave `consumo` con los mismos números.
- Con `n < minimo` el bloque no se calcula (el informe solo trae conteos).

## Alcance / Fuera de alcance
Alcance: `scripts/informe.mjs`, `pruebas/comprobaciones/informe-consumo.test.mjs` (nuevo), `README.md`.
Fuera de alcance: `definitions/**` (incluye `WORKFLOW.md` §10.5 y permisos del `coordinador`: lo corre Franco); `scripts/consumo.mjs`; calibrar el umbral (lectura posterior de Franco); `pruebas/README.md`.

## Pasos
1. `informe.mjs`: aceptar `--consumo <dir>` en `leerArgumentos`; validar carpeta.
2. Calcular el bloque con `descubrirSesiones` y sumas; incluirlo en Markdown y `--json`.
3. `informe-consumo.test.mjs`, prueba 8: sesiones sintéticas en carpeta temporal; con la bandera aparecen totales y por rol; sin ella no aparece nada de consumo. Control: costo ausente da `n/d`.
4. Misma prueba, caso 6: el log lleva claves y valores canario (título, autor, ruta absoluta) que `validarEvento` rechaza, y la sesión sintética tiene un `archivo` con nombre canario; ninguno aparece en `informe.md` ni en stdout.
5. `README.md`: en «Registro de eventos» reemplazar la frase «El informe que lo resuma es una feature aparte (F11)…» por una que diga que existe `node scripts/informe.mjs [--consumo <carpeta de logs>] [--minimo <n>] [--json]`, que lo corro yo tras `registrar.mjs`, que escribe `registro/informe.md` (ignorado por git) y que bajo 10 tareas con datos solo da conteos. Añadir la línea `informe.mjs` al árbol de `scripts/`.

## Criterios de aceptación
1. Con `--consumo`, el informe incluye totales y tabla por rol con los números de las sesiones sintéticas; sin la bandera, no hay bloque.
2. Ningún canario (log ni ruta de sesión) aparece en `informe.md` ni en stdout.
3. `--consumo` con una carpeta inexistente: código 1 y no escribe.
4. `README.md` documenta el comando y `informe.mjs` figura en el árbol.
5. `bash pruebas/rapida.sh` pasa bajo 30 s.

## Verificación
- `node --test pruebas/comprobaciones/informe.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs` → todas pasan.
- `bash pruebas/rapida.sh` → sin fallas, bajo 30 s.
- `grep -n "informe.mjs" README.md` → al menos 2 líneas.
(No ejecutados aún, inferidos.)

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
