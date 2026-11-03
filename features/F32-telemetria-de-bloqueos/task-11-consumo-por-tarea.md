# task-11 — `consumo.mjs --por-tarea`: costo por tarea y vueltas por bloqueo
repo: Flucastr.AI   depende_de: task-10   estado: hecha

## Descripción
Hoy el costo por tarea es solo un promedio (`--tareas`). Esta tarea agrega `--por-tarea`: agrupa las corridas de subagente por tarea (feature y número), muestra el costo y los turnos de las tareas `hecha` y, aparte, las vueltas por bloqueo (corridas con `Disparó: BLOQUEO task-NN`) con su costo.

## Contexto
- Tocar: `scripts/consumo.mjs`, `pruebas/comprobaciones/consumo.test.mjs`
- Requiere: ninguno
- `scripts/consumo.mjs` (confirmado): `leerArgumentos` (línea ≈ 660) rechaza lo desconocido y repetido; `ejecutarCli` (≈ 700) llama a `descubrirSesiones` y a `formatearInforme`/`informeJson`; `redondear`, `dinero` y `compararTexto` ya existen. De task-10 lee solo las *Notas*: las sesiones traen `subagentes.corridas` (`{ rol, disparo, feature, tarea, turnos, costo }`).
- Estado final de una tarea (decisión): el último `tarea_estado` (por `t`) de `registro/eventos.jsonl`; el formato del evento es el de `registrar.mjs` (`feature`, `tarea`, `a`, `t`).
- *Inferido*: la unión corrida↔tarea usa la ruta de la tarea en el encargo (`Lee:`), que `resumirEncargo` extrae.
- Base medida: `node --test pruebas/comprobaciones/consumo.test.mjs` da `ℹ fail 0`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- Opciones nuevas: `--por-tarea` (bandera) y `--eventos <archivo>` (solo con `--por-tarea`; sin ella `leerArgumentos` devuelve el error «--eventos exige --por-tarea», salida 1, antes de comprobar `--raiz`). Mismas reglas de repetidas y valor faltante que el resto.
- Exports nuevos: `leerEstados(textoEventos)` → `Map` de `Fxx/NN` a estado final (ignora líneas que no son JSON); `costoPorTarea(sesiones, { estados })` → filas ordenadas por clave; `formatearPorTarea(filas)`.
- Cada fila: `{ clave: 'Fxx/NN', estado, corridas, turnos, costo, vueltas, turnosVueltas, costoVueltas }`. Una corrida con `tarea` no nula y `disparo?.origen !== 'bloqueo'` suma a `corridas`, `turnos` y `costo` de `feature/tarea`; una con `disparo.origen === 'bloqueo'` suma 1 a `vueltas` y a `turnosVueltas`/`costoVueltas` de `(feature ?? '?')/disparo.tarea`. `costo` y `costoVueltas` son `null` si ninguna corrida trae costo numérico (Claude Code).
- `estado` sale de `estados`; sin `--eventos`, `sin_dato`. Se listan las filas con `estado === 'hecha'` o `vueltas > 0`; sin `--eventos` se listan todas.
- Salida de texto: una línea por fila `Fxx/NN | estado | corridas | turnos | costo | vueltas | costo vueltas` con `n/d` para `null`, y la nota final «El costo del coordinador no se reparte entre tareas; la unión usa la ruta de la tarea en el encargo.» Con `--json`: `{ "tareas": filas }`. Nunca imprime texto de encargos.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: las dos opciones, los tres exports y sus pruebas.
Fuera de alcance: repartir el costo del `coordinador`, `informe.mjs` (task-12 y task-13), cambiar el informe existente.

## Pasos
1. En `scripts/consumo.mjs` agrega `leerEstados`, `costoPorTarea` y `formatearPorTarea`.
2. Extiende `leerArgumentos` y `ejecutarCli` con `--por-tarea` y `--eventos`.
3. En `consumo.test.mjs` agrega casos con sesiones armadas a mano: dos tareas con constructor (una `hecha`, una `bloqueada`), una vuelta `BLOQUEO` del `planificador` sobre la `bloqueada`; verifica filas, `costo: null` sin costo, `--eventos` sin `--por-tarea` (salida 1) y la salida `--json`.
4. Corre la verificación.

## Criterios de aceptación
1. Las tareas `hecha` salen con su costo y turnos; las `bloqueada` solo si tienen vueltas; se comprueba con la prueba.
2. Las vueltas por bloqueo cuentan por `Disparó: BLOQUEO task-NN`; se comprueba con la prueba.
3. `--eventos` sin `--por-tarea` termina en 1 y el informe sin `--por-tarea` no cambia; se comprueba con la prueba.

## Verificación
```
node --test pruebas/comprobaciones/consumo.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs 2>&1 | grep -E "^ℹ fail"
node scripts/consumo.mjs --raiz . --eventos x 2>&1 | head -1
```
Esperado: `ℹ fail 0` y la línea `error: --eventos exige --por-tarea`.

## Evidencia

```
$ node --test pruebas/comprobaciones/consumo.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0

$ node scripts/consumo.mjs --raiz . --eventos x 2>&1 | head -1
error: --eventos exige --por-tarea
exit 1
```

## Notas
- Hueco menor 1: con `--por-tarea` y sin filas, la salida es «No hay tareas que listar.» seguida de la nota final (la tarea no fijaba el texto vacío).
- Hueco menor 2: el filtro de listado (`hecha` o con vueltas, solo con `--eventos`) va en `ejecutarCli`; `costoPorTarea` devuelve todas las filas ordenadas por clave.
- Hueco menor 3: `--eventos` con archivo no legible da `error: no se puede leer --eventos: <ruta>` y salida 1 (la tarea no lo fijaba).
- Hueco menor 4: los tests de `--por-tarea` usan `os.tmpdir()` igual que el resto de `consumo.test.mjs`; el archivo de eventos va en su propio directorio temporal, fuera de la raíz (que solo busca `.jsonl`).
- Cota: se corrieron 2 pasadas completas de la Verificación. La primera dio `ℹ fail 0` sin capturar código de salida; la segunda capturó `exit 0` y `exit 1`. No hubo tercera pasada.
- Modo yolo: no se creó rama, no hubo `git switch` ni commit. Archivos tocados: `scripts/consumo.mjs`, `pruebas/comprobaciones/consumo.test.mjs` y esta tarea.
- Lectura: `task-10` (solo Notas), `consumo.mjs`, `formato-encargo.mjs` y el esquema de `tarea_estado` en `registrar.mjs` (el estado final es el campo `a`). No se leyeron logs reales ni `.env`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=4; resultado=lista; causa=ninguna
