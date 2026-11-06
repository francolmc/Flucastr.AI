# task-04 — `scripts/entorno.mjs`: comprobar el entorno que declara `Requiere:`
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Script que lee la línea `- Requiere:` de una tarea y comprueba cada requisito con una sonda, sin shell y sin modificar nada. Lo correrá el constructor como primer paso (task-07) para no tocar nada si falta Docker, un puerto, un navegador o una versión de runtime. Las sondas son inyectables para probar sin depender de la máquina.

## Contexto
- Tocar: `scripts/entorno.mjs`, `pruebas/comprobaciones/entorno.test.mjs`
- Requiere: ninguno
- Convención (confirmado en `scripts/validar-tarea.mjs`, líneas 1–38): cabecera con uso y códigos de salida, se ejecuta al importarse (lo cargará un lanzador), `process.exitCode` en vez de `process.exit`, errores de uso a stderr.
- De task-02 lee solo las *Notas*: `scripts/formato-requiere.mjs` exporta `extraerRequiere(texto)` y `parsearRequiere(valor)` (items `{tipo, valor?, nombre?, version?, texto}`).
- Node v25.8.1 (confirmado); solo `node:child_process` (`spawnSync` con arreglo de argumentos, nunca `shell`), `node:net`, `node:dns/promises`, `node:fs`, `node:os`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «4. Pieza 1 — Puerta de entorno»

## Decisiones ya tomadas
- Uso: `node scripts/entorno.mjs <ruta-tarea>`. Salida 0: imprime `ok` (o `aviso: la tarea no declara Requiere` si no hay línea; no bloquea). Salida 1: imprime una sola línea `falta=<items separados por ,>` en el orden de la tarea. Salida 2: uso, archivo ilegible, línea inválida o `Requiere:` repetida (mensaje a stderr).
- Exporta `comprobarEntorno(items, sondas)` (async → arreglo de `texto` que faltan) y `SONDAS` (las reales). Cada sonda devuelve `Promise<boolean>` y tiene tope de 10 s.
- Sondas reales: `docker` = `docker info` con `spawnSync` sale 0; `puerto:<n>` = intento de escucha en `127.0.0.1` (si falla por cualquier error, falta; cierra el servidor y nunca mata procesos); `red` = `dns.lookup('example.com')`; `runtime:<nombre>@<v>` = corre `<binario> --version` (para `node`, `process.execPath`) y compara por prefijo de segmentos (`24` acepta `24.3.1`; `24.3` no acepta `24.4.0`); `navegador` = existe alguno de `google-chrome`, `chromium`, `chromium-browser` o `chrome` en `PATH`, o `/Applications/Google Chrome.app`, o un directorio `chromium-*` en `~/Library/Caches/ms-playwright` o `~/.cache/ms-playwright`; `largo:<s>` no tiene sonda (documenta; siempre cumple).
- Sin dependencias nuevas ni escritura en disco.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: el script y sus pruebas.
Fuera de alcance: `--sugerir` (task-05), el lanzador en `~/.flucastr-ai` (task-06), el paso del constructor (task-07), `definitions/`.

## Pasos
1. Crea `scripts/entorno.mjs` con `comprobarEntorno`, `SONDAS` y la CLI (la CLI solo corre si el módulo es el punto de entrada o lo importa el lanzador; no al importarlo desde la prueba).
2. Crea `pruebas/comprobaciones/entorno.test.mjs`: con sondas simuladas, `docker, puerto:55432` con ambas fallando da esas dos faltas en orden; con ambas ok da arreglo vacío.
3. Agrega pruebas de CLI con archivos temporales: `ninguno` → `ok`/0; sin línea → aviso/0; línea inválida → 2; `runtime:node@<mayor de process.versions.node>` → 0; `runtime:node@999` → 1 y `falta=runtime:node@999`; `puerto:<n>` con un servidor abierto por la prueba → 1 y `falta=puerto:<n>`; el mismo puerto ya cerrado → 0; `largo:240` → 0.
4. Agrega una prueba de que la CLI no escribe en el directorio de la tarea (el listado antes y después es igual).

## Criterios de aceptación
1. Los códigos 0, 1 y 2 y sus salidas coinciden con *Decisiones ya tomadas*; se comprueba con las pruebas de CLI.
2. Una falta de puerto ocupado y una de versión se detectan con sondas reales; se comprueba en `entorno.test.mjs`.
3. `comprobarEntorno` no usa shell ni depende de la máquina con sondas inyectadas; se comprueba con `grep -c "shell" scripts/entorno.mjs` → `0`.

## Verificación
```
node --test pruebas/comprobaciones/entorno.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
grep -c "shell" scripts/entorno.mjs
```
Esperado: `ℹ fail 0` y `ℹ pass` igual a `ℹ tests` (menos de 20 s); `0`.

## Evidencia

```
$ node --test pruebas/comprobaciones/entorno.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 14
ℹ pass 14
ℹ fail 0
exit 0
```

```
$ grep -c "shell" scripts/entorno.mjs
0
exit 1
```

## Notas
- Hueco menor: la CLI corre solo si el módulo es el punto de entrada; se exporta `ejecutarCli(argumentos)` que devuelve el código, para que el lanzador de task-06 lo llame sin ejecutar nada al importarse desde la prueba. Opción conservadora: la prueba importa `comprobarEntorno` sin efectos.
- Hueco menor: `largo:<s>` no tiene entrada en `SONDAS`; `comprobarEntorno` la trata como cumplida. `SONDAS` solo tiene `docker`, `puerto`, `red`, `runtime` y `navegador`.
- Hueco menor: `grep -c "shell"` sale 1 porque no hay coincidencias (imprime 0); es el resultado real, no un fallo del script. Ninguna línea de `scripts/entorno.mjs` contiene la palabra.
- Rápida (`bash pruebas/rapida.sh`, sale 1 como se esperaba): `ℹ tests 571`, `ℹ pass 564`, `ℹ fail 7`. Respecto de la base 557/550/7, son 14 pruebas nuevas, todas pasan. Los 7 fallos por nombre: «definitions/BACKLOG.md real cumple el formato» y «los archivos reales cumplen la regla» (fila F26 y regla de archivos reales); «falla si falta la lectura acotada en constructor» y «... en ejecutar-tarea» (2 de lectura acotada); «falla si un agente conserva la línea de modelos.json» (1 de agente); «falla si WORKFLOW.md pasa de 30720 caracteres» y «falla si WORKFLOW.md conserva la frase sobre modelos.json» (2 de WORKFLOW.md). Coinciden con la base.
- Intentos: 1 pasada completa de la Verificación (la salida de la tabla es la de esa pasada). Las ejecuciones previas fueron diagnósticos al escribir el script.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
