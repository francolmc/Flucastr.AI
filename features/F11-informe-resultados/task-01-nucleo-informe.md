# task-01 — Núcleo de `scripts/informe.mjs` y sus pruebas
repo: Flucastr.AI   depende_de: —   estado: lista para revisión

## Descripción
Crear `scripts/informe.mjs`: script de solo lectura sobre `registro/eventos.jsonl` que escribe `registro/informe.md` (y lo imprime) con cifras de entrega, calidad, fiabilidad, ritmo y cortes, con umbral mínimo e intervalo de Wilson. Sin bloque de consumo (task-02).

## Contexto
- Diseño aprobado: `definitions/ARCHITECTURE.md` «Informe de resultados del flujo», líneas 417–532 (léelas con `offset`/`limit`).
- De `scripts/registrar.mjs` importa `validarEvento(evento)` (línea 149; arreglo de errores, vacío = válido) y `ESQUEMA` (línea 81). Eventos: `tarea_estado`, `puerta`, `feature_estado`, `ejecucion`, otros. `ejecucion`: `n`, `herramienta`, `modo`, `intentos`, `verificacion` (pasa|falla|parcial), `huecos`, `resultado` (lista|bloqueada|escalada), `causa`, `modelo`. Todo evento lleva `t` (`YYYY-MM-DDTHH:MM:SSZ`).
- Modelo de CLI: `scripts/consumo.mjs` (`leerArgumentos` línea 679; guardia `RUTA_ESTE`/`process.argv[1]` línea 729).
- Pruebas: estilo de `pruebas/comprobaciones/archivar.test.mjs` (`mkdtempSync` en `os.tmpdir()`, `spawnSync(process.execPath, …)`). `pruebas/rapida.sh` recoge `pruebas/comprobaciones/*.test.mjs`.
- No leas ni toques el `registro/` real: las pruebas usan carpetas temporales.

## Decisiones ya tomadas
- ESM sin dependencias, mensajes en español. Exporta `UMBRAL_TAREAS = 10`, `UMBRAL_CORTE = 5` (únicas constantes del umbral), `wilson(k, n)` (z = 1.96, `{bajo, alto}` en %), `leerArgumentos`, `calcularInforme(eventos, {minimo})`, `formatearMarkdown(informe)`.
- Opciones: `--raiz <dir>` (defecto `process.cwd()`), `--minimo <n>` (entero ≥ 1), `--json`. Desconocida o repetida: stderr, código 1, nada escrito.
- Sin `<raiz>/registro/eventos.jsonl`: stderr «corre antes `node scripts/registrar.mjs`», código 1, no crea nada.
- Unidad = tarea (`feature`+`tarea`) con al menos un `ejecucion` válido; `n` = cuántas. Si `n < minimo`: primera línea `DATOS INSUFICIENTES: n=<n> de <minimo>; no se calculan porcentajes ni medianas` y solo conteos (tareas, ejecuciones, líneas no válidas); salida 0.
- Línea no válida (JSON roto o con errores de `validarEvento`): se descarta y se cuenta («líneas no válidas: N»); nunca se imprime su contenido.
- Cifras:
  - Entrega: de las tareas con `tarea_estado a=hecha`, % sin ningún `puerta n=4 resultado=devuelta` (con `n` y Wilson) y media de devoluciones por tarea.
  - Calidad: `huecos` de la ejecución de mayor `n` de cada tarea: media, mediana, máximo.
  - Fiabilidad: en todas las ejecuciones, media de `intentos`; % `verificacion=pasa` con Wilson; bloqueadas/escaladas por `causa`.
  - Ritmo: mediana en horas (1 decimal) de primer `tarea_estado a=aprobada` a `a=hecha`, por tarea; y de primer `feature_estado a=en curso` a `a=hecha`, por feature. Sin ambos eventos no cuenta.
  - Cortes por `modelo`, `herramienta`, `modo` (tomados de la ejecución de mayor `n` de cada tarea): `n` tareas, media de `huecos`, % `pasa` con Wilson; con `n < UMBRAL_CORTE` la fila dice `n insuficiente`, sin cifras.
- Porcentajes con 1 decimal; Wilson como `[bajo–alto]`; mediana par = promedio de los dos centrales.
- Cabecera `# Informe de resultados del flujo` y `eventos hasta <t máximo>` (de los datos, sin hora de generación). Solo `Fxx` y `NN`, sin títulos. Final: `## Límites de esta lectura` (ritmo = reloj del commit de Franco; `modelo` = el configurado al registrar; huecos juzgan al `planificador`; no mide motivos de devolución ni puertas 1 y 2).
- Escribe solo `<raiz>/registro/informe.md` (sobrescribe) y lo imprime. `--json` imprime `{eventosHasta, lineasNoValidas, tareas, ejecuciones, suficiente, entrega, calidad, fiabilidad, ritmo, cortes}` y escribe igual el Markdown. No abre `features/`, `STATUS.md`, `.env*` ni git.

## Alcance / Fuera de alcance
Alcance: `scripts/informe.mjs`, `pruebas/comprobaciones/informe.test.mjs`, una línea en `pruebas/README.md`.
Fuera de alcance: `--consumo` y pruebas 6 y 8 (task-02); `README.md`; `definitions/**`; correr `registrar.mjs`; aviso de log desactualizado (exige git); permisos del `coordinador`.

## Pasos
1. `scripts/informe.mjs`: `leerArgumentos` y guardia de CLI. Resultado: `node scripts/informe.mjs --x` sale 1.
2. Lectura y validación de líneas. Resultado: `{eventos, lineasNoValidas}`.
3. `wilson` y `calcularInforme` con las cifras de *Decisiones*.
4. `formatearMarkdown` (≈60 líneas, tablas con `n`) y rama «DATOS INSUFICIENTES».
5. CLI: escribir e imprimir `registro/informe.md`, `--json`, error sin log.
6. `pruebas/comprobaciones/informe.test.mjs`: casos 1–5 y 7 de «Pruebas» (ARCHITECTURE.md líneas 494–505), cada uno con control negativo. Incluye Wilson a mano: k=8, n=10 → [49.0–94.3].
7. `pruebas/README.md`: tras la línea «Consumo (F20)» (línea 30), añadir «Informe (F11)» con `node --test pruebas/comprobaciones/informe.test.mjs`.

## Criterios de aceptación
1. 9 tareas con `ejecucion`: empieza con `DATOS INSUFICIENTES` y sin `%`; con 10 hay cifras (prueba de umbral).
2. Un log armado a mano da las cifras esperadas, Wilson incluido.
3. Dos corridas con el mismo log dan el mismo `informe.md` byte a byte.
4. Sin log: código 1 y nada creado; no se escribe fuera de `registro/informe.md`.
5. `bash pruebas/rapida.sh` pasa bajo 30 s.

## Verificación
- `node --test pruebas/comprobaciones/informe.test.mjs` → todas pasan.
- `bash pruebas/rapida.sh` → sin fallas y `rapida: N archivos en X s (tope 30 s)`.
- `node scripts/informe.mjs --raiz /tmp/no-existe` → código 1.
(No ejecutados aún, inferidos; son los comandos de las demás pruebas.)

## Evidencia
Rama: `feature/F11-informe-resultados` creada desde `main` con `git switch -c` (sin commit).

Verificación, una pasada completa:

```
$ node --test pruebas/comprobaciones/informe.test.mjs
ℹ tests 11
ℹ pass 11
ℹ fail 0

$ bash pruebas/rapida.sh
ℹ tests 362
ℹ pass 362
ℹ fail 0
rapida: 30 archivos en 16 s (tope 30 s)

$ node scripts/informe.mjs --raiz /tmp/no-existe
error: falta registro/eventos.jsonl; corre antes `node scripts/registrar.mjs`
exit=1

$ node scripts/informe.mjs --x
error: argumento desconocido '--x'
exit=1
```

Criterios de aceptación contra esa evidencia:
1. 9 tareas dan `DATOS INSUFICIENTES` sin `%`; 10 dan cifras: pruebas (1). Un log real no se corrió (no se leyó `registro/`); la prueba usa logs armados a mano.
2. Log armado a mano, cifras y Wilson (k=8, n=10 → [49.0–94.3]): pruebas (2), (2b), (2c), (3).
3. Dos corridas, mismo `informe.md` byte a byte: prueba (5).
4. Sin log: código 1, nada creado, no se escribe fuera de `registro/informe.md`: prueba (7) y la corrida de `/tmp/no-existe`.
5. `rapida.sh` pasa en 16 s (tope 30 s).

Cambios: `scripts/informe.mjs` (nuevo), `pruebas/comprobaciones/informe.test.mjs` (nuevo), `pruebas/README.md` (una línea «Informe (F11)»).

## Notas
Huecos menores y decisiones:
1. Entrega: la base son las tareas con `tarea_estado a=hecha` (aunque no tengan `ejecucion`); las devoluciones cuentan `puerta n=4 resultado=devuelta` por tarea.
2. Ritmo: se usa el primer evento de cada estado (mínimo de `t`); el par se descarta si `hecha` es anterior a `aprobada`/`en curso`.
3. Con datos insuficientes, la primera línea del Markdown y de la salida es la de `DATOS INSUFICIENTES`; la cabecera va debajo. Así «empieza con DATOS INSUFICIENTES» se cumple literalmente.
4. `ESQUEMA` no se importa: `validarEvento` ya rechaza los eventos fuera del esquema y no hacía falta el objeto. Solo se importa `validarEvento`.
5. Cortes agrupados con `Map` (no con objeto literal), porque `modelo` acepta cualquier cadena del patrón, incluida `__proto__`.
6. Las líneas vacías del log se saltan sin contarlas como no válidas; las líneas JSON rotas o inválidas sí cuentan.
7. Los bloqueos y escalaciones se listan por causa solo si tienen conteo mayor que cero; `--json` expone los conteos por causa.
Alcance: no se implementó `--consumo` ni las pruebas 6 y 8 (task-02).

Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=7; resultado=lista; causa=ninguna
