# task-13 — `informe.mjs --consumo <dir> --pistas`: pistas 2 y 6 desde los logs
repo: Flucastr.AI   depende_de: task-09, task-10, task-12   estado: hecha

## Descripción
Las pistas 2 (un bloqueo de entorno volvió a `planificador` o `arquitecto`) y 6 (el costo de definir supera al de ejecutar) necesitan los logs de sesión. Esta tarea las agrega a `calcularPistas` usando las corridas con `Disparó:` (task-10) y el bloque de consumo que `informe.mjs` ya calcula con `--consumo`.

## Contexto
- Tocar: `scripts/pistas.mjs`, `scripts/informe.mjs`, `pruebas/comprobaciones/informe-pistas.test.mjs`
- Requiere: ninguno
- `scripts/pistas.mjs` (de task-12; lee solo las *Notas*): `calcularPistas(eventos, { corridas, consumo })`, que ignora las dos opciones.
- `scripts/informe.mjs` (confirmado): `bloqueConsumo(sesiones, n)` devuelve `{ turnos, costo, filas: [{ rol, corridas, turnos, costo }], porTarea }` con `costo` `null` si ninguna sesión trae costo (Claude Code); `ejecutarCli` hoy llama a `descubrirSesiones(opciones.consumo)` solo si `informe.suficiente`.
- Las corridas salen de `sesion.subagentes.corridas` (task-10): `{ rol, disparo, feature, tarea, turnos, costo }`.
- *Inferido*: el encargo de una vuelta de bloqueo trae `Disparó: BLOQUEO task-NN`, y `feature` se conoce solo si el encargo cita una ruta de `features/Fxx-`.
- Base medida: `node --test pruebas/comprobaciones/informe.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs` da `ℹ fail 0`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- Pista 2 (por feature): cuenta las corridas con `rol` `planificador` o `arquitecto`, `disparo.origen === 'bloqueo'`, `disparo.tarea` igual a la `tarea` de un `bloqueo` `tipo=entorno` de esa feature y `corrida.feature` nula o igual a esa feature. Con 1 o más: medición «<k> vuelta(s) de entorno a planificador o arquitecto»; acción «Esa vuelta no podía arreglarlo: usa `rol=franco`.»
- Pista 6 (global, `feature: null`): participación de `arquitecto` + `planificador` en el total de `consumo.filas`: por `costo` si `consumo.costo` no es `null`, si no por `turnos`. Si es mayor que 0,60: medición «arquitecto+planificador = <p> % del total» (`p` entero); acción «Pocos bloques de ejecución para el costo de definir: junta features chicas.»
- `ejecutarCli`: con `--pistas` y `--consumo`, calcula las sesiones una vez, `corridas = sesiones.flatMap((s) => s.subagentes?.corridas ?? [])` y `consumo = bloqueConsumo(sesiones, informe.suficiente ? informe.entrega.n : 0)`, y los pasa a `calcularPistas`. El bloque «Consumo» sigue saliendo solo si `informe.suficiente`, como hoy.
- Con `--pistas` sin `--consumo`, el Markdown agrega bajo `## Pistas` la línea «(pistas 2 y 6 no evaluadas: falta --consumo <dir>)». El JSON no cambia de forma.
- Mismos umbrales supuestos y misma regla de salida (solo `Fxx`, números y frases fijas).

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: las pistas 2 y 6, el cableado de `--consumo` con `--pistas` y sus pruebas.
Fuera de alcance: leer logs fuera de `consumo.mjs`, repartir costos por tarea, `definitions/`.

## Pasos
1. En `scripts/pistas.mjs` agrega las pistas 2 y 6 a `calcularPistas`.
2. En `scripts/informe.mjs` calcula `sesiones`, `corridas` y `consumo` para las pistas y escribe la línea de pistas no evaluadas.
3. En `informe-pistas.test.mjs` agrega casos: 2 con una vuelta de `planificador` y otra de `constructor` (solo la primera cuenta), con `feature` nula y con otra feature (no cuenta); 6 con costo (65 %, dispara; 55 %, no) y con `costo: null` por turnos; la CLI con un directorio de sesiones sintético de Pi (fixtures de `consumo-fixtures.mjs`) y `--consumo --pistas`; sin `--consumo` aparece la línea de no evaluadas.
4. Corre la verificación.

## Criterios de aceptación
1. La pista 2 cuenta solo vueltas de `planificador` o `arquitecto` a un bloqueo de entorno; se comprueba con la prueba.
2. La pista 6 dispara con más de 60 % por costo o por turnos; se comprueba con la prueba.
3. `--consumo <dir> --pistas` funciona de punta a punta sobre sesiones sintéticas; se comprueba con la prueba.

## Verificación
```
node --test pruebas/comprobaciones/informe-pistas.test.mjs pruebas/comprobaciones/informe.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs pruebas/comprobaciones/consumo.test.mjs 2>&1 | grep -E "^ℹ fail"
```
Esperado: `ℹ fail 0`.

## Evidencia

```text
$ node --test pruebas/comprobaciones/informe-pistas.test.mjs pruebas/comprobaciones/informe.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs pruebas/comprobaciones/consumo.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0
```

Anotación: Verificación, pasada 1 de 2 (intentos=1). Pasa a la primera.

```text
$ node --test pruebas/comprobaciones/informe-pistas.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 12
ℹ pass 12
ℹ fail 0
exit 0
```

Anotación: comprobación adicional, no pasada de Verificación. 12 = 8 previas más 4 nuevas (pista 2; pista 6 por costo; pista 6 por turnos; CLI con Pi sintético).

```text
$ sh pruebas/rapida.sh > /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/fcf8d866-8f65-4f96-abd5-83def002b359/scratchpad/rapida-task13.txt 2>&1
ℹ tests 655
ℹ pass 648
ℹ fail 7
✖ definitions/BACKLOG.md real cumple el formato (2.445125ms)
✖ los archivos reales cumplen la regla (3.91825ms)
✖ falla si un agente conserva la línea de modelos.json (0.689958ms)
✖ falla si falta la lectura acotada en constructor (0.505542ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (5.534416ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (27.321459ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (0.698542ms)
exit 1
```

Anotación: líneas ℹ y ✖ tomadas de la salida guardada en el scratchpad (la lista de ✖ aparece dos veces; se muestra la primera). Los 7 son los conocidos; ninguno es nuevo. Base: 651 tests, 644 pass, 7 fail; ahora 655, 648, 7 (4 pruebas nuevas, todas pasan).

Criterios de aceptación: 1 (pista 2 solo con planificador o arquitecto a bloqueo de entorno) comprobado por «pista 2 cuenta solo vueltas…»; 2 (pista 6 por costo 65 % dispara, 55 % no; por turnos) comprobado por las dos pruebas de «pista 6»; 3 (`--consumo <dir> --pistas` de punta a punta) comprobado por «CLI: --consumo <dir> --pistas…». Formato de logs de Pi y Claude Code: inferido; la prueba usa solo fixtures sintéticos.

## Notas
- Hueco menor 1: la pista 6 es global (`feature: null`). Su línea sale como `- Pista 6: …` sin `[null]`; el JSON conserva `feature: null`.
- Hueco menor 2: la pista 6 redondea con `Math.round`, igual que la pista 3, y la prueba afirma 65 %. Si Franco prefiere truncar, es un cambio de una línea.
- Hueco menor 3: si una corrida trae `feature` nula, la pista 2 la cuenta en cada feature que tenga bloqueo de entorno de esa misma tarea. La tarea no dice otra cosa; se aplicó la regla literal.
- Cambio interno: con `--consumo`, `descubrirSesiones` ahora corre también si n es insuficiente (antes no). El bloque «Consumo» sigue saliendo solo si `suficiente`.
- Sin `--consumo` y con `--pistas`: la línea «(pistas 2 y 6 no evaluadas: falta --consumo <dir>)» va dentro de `## Pistas`, después de la lista o de «Sin pistas…». El JSON no cambia de forma.
- Formato de logs de Pi y Claude Code: sigue inferido. La prueba CLI usa solo fixtures sintéticos de `consumo-fixtures.mjs`. No se leyeron logs reales, `registro/` ni `.env`.
- Temporales: las pruebas usan `os.tmpdir()`, como el resto de pruebas de informe. Mis redirecciones fueron al scratchpad; no se escribió en `/tmp`.
- Modo yolo: no se creó rama, no hubo `git switch` ni commit. `definitions/STATUS.md` no se tocó. Se leyeron las *Notas* de task-09, task-10 y task-12, y los archivos de *Contexto*; no hizo falta `lectura-extra`.
- Huecos menores: 3.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
