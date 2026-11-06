# task-12 — `informe.mjs --pistas`: pistas 1, 3, 4 y 5 desde `eventos.jsonl`
repo: Flucastr.AI   depende_de: task-06, task-07   estado: hecha

## Descripción
El informe mide resultados pero no dice qué hacer con ellos. Esta tarea agrega la opción `--pistas` y un módulo `scripts/pistas.mjs` que, solo con `registro/eventos.jsonl`, dispara las pistas accionables que no necesitan los logs de sesión: bloqueos de entorno repetidos (1), exceso de tareas canceladas (3), telemetría incompleta (4) y bloqueos por alcance o especificación (5). Las pistas 2 y 6 las agrega task-13.

## Contexto
- Tocar: `scripts/pistas.mjs`, `scripts/informe.mjs`, `pruebas/comprobaciones/informe-pistas.test.mjs`
- Requiere: ninguno
- `scripts/informe.mjs` (confirmado): `OPCIONES_CONOCIDAS` (línea 24), `formatearMarkdown(informe, consumo = null)` (línea 266, imprime «## Límites de esta lectura» al final), `informeJson(informe, consumo = undefined)` (línea 315), `leerArgumentos` (línea 324), `ejecutarCli` (línea 353). Los eventos pasan por `leerEventos` y `validarEvento`.
- Eventos que usa (de task-06 y task-07; lee solo sus *Notas*): `bloqueo` (`feature`, `tarea`, `tipo`), `cancelacion` (`feature`, `tarea`, `motivo`), `tarea_estado` (`feature`, `tarea`, `a`), `ejecucion` (`feature`, `tarea`).
- Modelo de fixtures: el helper `ev(evento, t, campos)` de `pruebas/comprobaciones/informe.test.mjs` (la fuente de `bloqueo` y `cancelacion` es `notas`).
- Base medida: `node --test pruebas/comprobaciones/informe.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs` da `ℹ fail 0`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- `calcularPistas(eventos, { corridas = null, consumo = null } = {})` devuelve un arreglo ordenado por número de pista y feature: `{ n, feature, medicion, accion }`. Esta tarea implementa solo 1, 3, 4 y 5; ignora `corridas` y `consumo`.
- Pista 1 (por feature, si hay 2 o más `bloqueo` con `tipo` `entorno`): medición «<k> bloqueos tipo=entorno»; acción «Añade `Requiere:` a sus tareas o arregla el entorno antes de aprobar.»
- Pista 3 (por feature, si tareas con algún `tarea_estado` `a=cancelada` / tareas con cualquier `tarea_estado` es mayor que 0,30): medición «<c> de <t> tareas canceladas (<p> %)» con `p` entero redondeado; acción «Se planifica de más: baja el tamaño de la feature o valida la idea antes de descomponer.»
- Pista 4 (por feature): se dispara por tareas con `a=cancelada` sin `cancelacion` (medición «<k> cancelada(s) sin motivo») o por tareas con `a=hecha` sin ningún `ejecucion`, solo si la feature tiene al menos un `ejecucion` (medición «<k> hecha(s) sin ejecución válida»; cubre `Registro:` ausente o incoherente, que `registrar.mjs` no emite); acción «Corre la validación con el lanzador; falta aplicar §3.»
- Pista 5 (por feature, 2 o más `bloqueo` con `tipo` `alcance` o `especificacion`): medición «<k> bloqueos de alcance o especificación»; acción «El planificador omite decisiones: revisa `Fuente:` y *Decisiones ya tomadas*.»
- Los umbrales son supuestos a calibrar (dicho en el propio documento de diseño). La salida solo contiene `Fxx`, números y las frases fijas.
- `--pistas` es bandera sin valor. En el Markdown agrega la sección `## Pistas` antes de «## Límites de esta lectura»: una viñeta `- Pista <n> [<Fxx>]: <medición>. <acción>` por pista, o «Sin pistas: ninguna medición supera su umbral.» En `--json` agrega la clave `pistas` (el arreglo). Sin `--pistas` la salida es idéntica a la actual. Se evalúan aunque `suficiente` sea falso.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: `calcularPistas` (pistas 1, 3, 4, 5), la opción y sus pruebas.
Fuera de alcance: pistas 2 y 6 y el uso de `--consumo` (task-13), cambiar los bloques existentes del informe, `definitions/`.

## Pasos
1. Crea `scripts/pistas.mjs` con `calcularPistas` y las cuatro pistas (función pura, sin leer archivos).
2. En `scripts/informe.mjs` agrega `--pistas` a `OPCIONES_CONOCIDAS` y `leerArgumentos`, y pasa las pistas a `formatearMarkdown` y `informeJson` (parámetro nuevo opcional al final).
3. Crea `pruebas/comprobaciones/informe-pistas.test.mjs`: cada pista dispara con su umbral y no dispara un evento antes; la 3 con 3 de 8 (37 %) y con 2 de 8 (25 %, no dispara); la 4 en sus dos formas y una feature sin `ejecucion` no dispara «hecha sin ejecución»; ejecuta la CLI sobre una raíz temporal y comprueba la sección `## Pistas`, la clave `pistas` con `--json` y que sin `--pistas` no aparece.
4. Corre la verificación.

## Criterios de aceptación
1. Cada una de las cuatro pistas dispara en su umbral y no antes; se comprueba con la prueba.
2. La CLI imprime `## Pistas` solo con `--pistas`; se comprueba con la prueba.
3. Las pruebas existentes del informe no cambian; se comprueba con el comando.

## Verificación
```
node --test pruebas/comprobaciones/informe-pistas.test.mjs pruebas/comprobaciones/informe.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs 2>&1 | grep -E "^ℹ fail"
```
Esperado: `ℹ fail 0`.

## Evidencia

```
$ node --test pruebas/comprobaciones/informe-pistas.test.mjs pruebas/comprobaciones/informe.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0
```

```
$ bash pruebas/rapida.sh
ℹ tests 651
ℹ pass 644
ℹ fail 7
✖ definitions/BACKLOG.md real cumple el formato
✖ los archivos reales cumplen la regla
✖ falla si un agente conserva la línea de modelos.json
✖ falla si falta la lectura acotada en constructor
✖ falla si falta la lectura acotada en ejecutar-tarea
✖ falla si WORKFLOW.md pasa de 30720 caracteres
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json
[…recortado: N líneas de detalle de fallos…]
exit 1
```

## Notas
- Pasos 1 a 4 hechos. `scripts/pistas.mjs` (calcularPistas, pistas 1, 3, 4 en sus dos formas y 5). `scripts/informe.mjs`: `--pistas` en `OPCIONES_CONOCIDAS` y `leerArgumentos`; `formatearMarkdown` e `informeJson` con parámetro opcional al final. `pruebas/comprobaciones/informe-pistas.test.mjs`: 8 pruebas. Verificación pasa en la primera pasada.
- Huecos menores: (1) 3 de 8 da 37,5 %. La regla dice «entero redondeado» y la prueba de la tarea dice «37 %»; se usó `Math.round`, que da 38 %, y la prueba afirma 38 %. Si Franco quiere 37 (truncar), es un cambio de una línea. (2) La pista 4 con sus dos formas en una misma feature emite dos entradas con `n=4`, una por medición.
- La rápida: `ℹ tests 651` = 643 base + 8 nuevas; `ℹ pass 644`; `ℹ fail 7` con los 7 títulos conocidos, ninguno nuevo. `node --test` sale 1 y `rapida.sh` corta con `set -e` antes de su línea `rapida:`.
- Modo yolo: sin rama, sin `git switch`, sin commit. No se tocó `definitions/STATUS.md`. No se leyó `registro/`, `.env` ni `definitions/`.
- Incidente: al correr la rápida redirigí una salida a `/tmp/x` por error; lo borré y repetí la corrida con salida en el scratchpad. Las pruebas usan `os.tmpdir()`, como `informe.test.mjs` (en macOS es `$TMPDIR`).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
